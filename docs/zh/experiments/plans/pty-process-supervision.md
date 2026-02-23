---
mmh3_hash: "53c1c924eb011809eccc22966f3c948e"
title: "PTY 与进程监督计划"
summary: "可靠交互式进程监督（PTY + 非 PTY）的生产计划，包含明确所有权、统一生命周期和确定性清理"
read_when:
  - 处理 exec/进程生命周期所有权和清理问题
  - 调试 PTY 和非 PTY 监督行为
owner: "openclaw"
status: "in-progress"
last_updated: "2026-02-15"
---

# PTY 与进程监督计划

## 1. 问题与目标

我们需要在以下场景中为长时间运行的命令执行提供统一可靠的生命周期：

- `exec` 前台运行
- `exec` 后台运行
- `process` 后续操作（`poll`、`log`、`send-keys`、`paste`、`submit`、`kill`、`remove`）
- CLI Agent 运行器子进程

目标不仅仅是支持 PTY，而是实现可预测的所有权、取消、超时和清理，不使用不安全的进程匹配启发式方法。

## 2. 范围与边界

- 将实现保留在 `src/process/supervisor` 内部。
- 不为此创建新包。
- 在实际可行的情况下保持当前行为兼容性。
- 不将范围扩展到终端回放或 tmux 风格的 session 持久化。

## 3. 本分支已实现内容

### 监督器基线已就位

- 监督器模块已在 `src/process/supervisor/*` 下建立。
- Exec 运行时和 CLI 运行器已通过监督器的 spawn 和 wait 路由。
- 注册表终止是幂等的。

### 本轮已完成

1. 明确的 PTY 命令契约

- `SpawnInput` 现在是 `src/process/supervisor/types.ts` 中的可辨识联合类型。
- PTY 运行需要 `ptyCommand` 而非重用通用的 `argv`。
- 监督器不再在 `src/process/supervisor/supervisor.ts` 中从 argv 拼接重建 PTY 命令字符串。
- Exec 运行时现在在 `src/agents/bash-tools.exec-runtime.ts` 中直接传递 `ptyCommand`。

2. 进程层类型解耦

- 监督器类型不再从 agents 导入 `SessionStdin`。
- 进程本地 stdin 契约在 `src/process/supervisor/types.ts` 中（`ManagedRunStdin`）。
- 适配器现在只依赖进程级类型：
  - `src/process/supervisor/adapters/child.ts`
  - `src/process/supervisor/adapters/pty.ts`

3. 进程工具生命周期所有权改进

- `src/agents/bash-tools.process.ts` 现在首先通过监督器请求取消。
- `process kill/remove` 现在在监督器查找失败时使用进程树回退终止。
- `remove` 通过在请求终止后立即删除运行中的 session 条目来保持确定性删除行为。

4. 单一来源看门狗默认值

- 在 `src/agents/cli-watchdog-defaults.ts` 中添加了共享默认值。
- `src/agents/cli-backends.ts` 使用共享默认值。
- `src/agents/cli-runner/reliability.ts` 使用相同的共享默认值。

5. 清理无用辅助函数

- 从 `src/agents/bash-tools.shared.ts` 移除了未使用的 `killSession` 辅助函数路径。

6. 添加直接监督器路径测试

- 添加了 `src/agents/bash-tools.process.supervisor.test.ts`，覆盖通过监督器取消进行的 kill 和 remove 路由。

7. 完成可靠性缺口修复

- `src/agents/bash-tools.process.ts` 现在在监督器查找失败时回退到真实的 OS 级进程终止。
- `src/process/supervisor/adapters/child.ts` 现在对默认取消/超时 kill 路径使用进程树终止语义。
- 在 `src/process/kill-tree.ts` 中添加了共享的进程树工具。

8. 添加 PTY 契约边缘情况覆盖

- 添加了 `src/process/supervisor/supervisor.pty-command.test.ts`，用于逐字 PTY 命令转发和空命令拒绝。
- 添加了 `src/process/supervisor/adapters/child.test.ts`，用于子适配器取消中的进程树 kill 行为。

## 4. 剩余缺口与决策

### 可靠性状态

本轮所需的两个可靠性缺口现已关闭：

- `process kill/remove` 现在在监督器查找失败时具有真实的 OS 终止回退。
- child 取消/超时现在对默认 kill 路径使用进程树 kill 语义。
- 两种行为均已添加回归测试。

### 持久性与启动协调

重启行为现已明确定义为仅内存生命周期。

- `reconcileOrphans()` 在 `src/process/supervisor/supervisor.ts` 中按设计保持为空操作。
- 活跃运行在进程重启后不会恢复。
- 此边界是本实施轮次的有意设计，以避免部分持久化风险。

### 可维护性后续工作

1. `src/agents/bash-tools.exec-runtime.ts` 中的 `runExecProcess` 仍处理多个职责，可在后续拆分为专注的辅助函数。

## 5. 实施计划

所需可靠性和契约项的实施轮次已完成。

已完成：

- `process kill/remove` 回退真实终止
- child 适配器默认 kill 路径的进程树取消
- 回退 kill 和 child 适配器 kill 路径的回归测试
- 在显式 `ptyCommand` 下的 PTY 命令边缘情况测试
- 通过 `reconcileOrphans()` 空操作的显式内存重启边界

可选后续工作：

- 将 `runExecProcess` 拆分为无行为偏移的专注辅助函数

## 6. 文件映射

### 进程监督器

- `src/process/supervisor/types.ts` 更新了可辨识的 spawn 输入和进程本地 stdin 契约。
- `src/process/supervisor/supervisor.ts` 更新为使用显式 `ptyCommand`。
- `src/process/supervisor/adapters/child.ts` 和 `src/process/supervisor/adapters/pty.ts` 与 agent 类型解耦。
- `src/process/supervisor/registry.ts` 幂等终止保持不变并保留。

### Exec 和进程集成

- `src/agents/bash-tools.exec-runtime.ts` 更新为显式传递 PTY 命令并保留回退路径。
- `src/agents/bash-tools.process.ts` 更新为通过监督器取消，并具有真实的进程树回退终止。
- `src/agents/bash-tools.shared.ts` 移除了直接 kill 辅助函数路径。

### CLI 可靠性

- 添加 `src/agents/cli-watchdog-defaults.ts` 作为共享基线。
- `src/agents/cli-backends.ts` 和 `src/agents/cli-runner/reliability.ts` 现在使用相同的默认值。

## 7. 本轮验证运行

单元测试：

- `pnpm vitest src/process/supervisor/registry.test.ts`
- `pnpm vitest src/process/supervisor/supervisor.test.ts`
- `pnpm vitest src/process/supervisor/supervisor.pty-command.test.ts`
- `pnpm vitest src/process/supervisor/adapters/child.test.ts`
- `pnpm vitest src/agents/cli-backends.test.ts`
- `pnpm vitest src/agents/bash-tools.exec.pty-cleanup.test.ts`
- `pnpm vitest src/agents/bash-tools.process.poll-timeout.test.ts`
- `pnpm vitest src/agents/bash-tools.process.supervisor.test.ts`
- `pnpm vitest src/process/exec.test.ts`

E2E 目标：

- `pnpm vitest src/agents/cli-runner.test.ts`
- `pnpm vitest run src/agents/bash-tools.exec.pty-fallback.test.ts src/agents/bash-tools.exec.background-abort.test.ts src/agents/bash-tools.process.send-keys.test.ts`

类型检查说明：

- 在此 repo 中使用 `pnpm build`（以及 `pnpm check` 进行完整 lint/docs 检查）。较旧的 `pnpm tsgo` 说明已过时。

## 8. 保留的操作保证

- Exec 环境加固行为保持不变。
- 审批和允许列表流程保持不变。
- 输出净化和输出上限保持不变。
- PTY 适配器仍然保证在强制 kill 和监听器销毁时的等待结算。

## 9. 完成标准

1. 监督器是被管理运行的生命周期所有者。
2. PTY spawn 使用显式命令契约，无 argv 重建。
3. 进程层对监督器 stdin 契约没有对 agent 层的类型依赖。
4. 看门狗默认值是单一来源。
5. 有针对性的单元和 e2e 测试保持绿色。
6. 重启持久性边界已明确记录或完全实现。

## 10. 总结

该分支现在具有连贯且更安全的监督形状：

- 明确的 PTY 契约
- 更清晰的进程分层
- 进程操作的监督器驱动取消路径
- 监督器查找失败时的真实回退终止
- child 运行默认 kill 路径的进程树取消
- 统一的看门狗默认值
- 明确的内存重启边界（本轮不进行重启后的孤儿协调）
