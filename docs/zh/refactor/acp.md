---
mmh3_hash: "d7b74049a1ba624d48c002514e40fd29"
summary: "使 ACP Session 和 ACPX 进程所有权显式化的迁移计划"
read_when:
  - 重构 ACP Session 生命周期或 ACPX 进程清理
  - 调试 ACPX 孤立进程、PID 重用或多 Gateway 清理安全问题
  - 更改已派生 ACP 或子 Agent Session 的 sessions_list 可见性
  - 为后台任务、ACP Session 或进程租约设计所有权元数据
title: "ACP 生命周期重构"
sidebarTitle: "ACP 生命周期重构"
---

ACP 生命周期目前可以正常工作，但其中太多内容是事后推断的。进程清理通过 PID、命令字符串、包装器路径和活跃进程表来重建所有权。Session 可见性通过 Session 键字符串加上次级 `sessions.list({ spawnedBy })` 查询来重建所有权。这使得针对性修复成为可能，但也使边缘情况容易被遗漏：PID 重用、带引号的命令、适配器的孙进程、多 Gateway 状态根、`cancel` 与 `close` 的区别，以及 `tree` 与 `all` 可见性，都各自成为重新发现相同所有权规则的独立位置。

本次重构使所有权成为一等公民。目标不是新的 ACP 产品界面，而是现有 ACP 和 ACPX 行为更安全的内部契约。

## 目标

- 清理操作仅在当前活跃证据与 OpenClaw 拥有的租约匹配时才向进程发送信号。
- `cancel`、`close` 和启动收割具有明确的生命周期意图。
- `sessions_list`、`sessions_history`、`sessions_send` 和状态检查使用相同的请求者拥有的 Session 模型。
- 多 Gateway 安装不能收割彼此的 ACPX 包装器。
- 旧的 ACPX Session 记录在迁移期间保持可用。
- 运行时仍由 Plugin 拥有；核心不了解 ACPX 包的详细信息。

## 非目标

- 替换 ACPX 或更改公开的 `/acp` 命令界面。
- 将特定供应商的 ACP 适配器行为移入核心。
- 要求用户在升级前手动清理状态。
- 使 `cancel` 关闭可复用的 ACP Session。

## 目标模型

### Gateway 实例标识

每个 Gateway 进程应具有稳定的运行时实例 ID：

```ts
type GatewayInstanceId = string;
```

它可以在 Gateway 启动时生成，并在该安装的生命周期内持久化到状态中。它不是安全密钥；它是用于避免混淆一个 Gateway 的 ACP 进程与另一个 Gateway 进程的所有权鉴别器。

### ACP Session 所有权

每个派生的 ACP Session 应具有规范化的所有权元数据：

```ts
type AcpSessionOwner = {
  sessionKey: string;
  spawnedBy?: string;
  parentSessionKey?: string;
  ownerSessionKey: string;
  agentId: string;
  backend: "acpx";
  gatewayInstanceId: GatewayInstanceId;
  createdAt: number;
};
```

Gateway 应在已知的 Session 行中返回这些字段。可见性过滤应是对行元数据的纯检查：

```ts
canSeeSessionRow({
  row,
  requesterSessionKey,
  visibility,
  a2aPolicy,
});
```

这消除了可见性检查中隐藏的次级 `sessions.list({ spawnedBy })` 调用。派生的跨 Agent ACP 子项由请求者拥有，因为行本身说明了这一点，而不是因为第二次查询碰巧找到了它。

### ACPX 进程租约

每次生成包装器启动时应创建一条租约记录：

```ts
type AcpxProcessLease = {
  leaseId: string;
  gatewayInstanceId: GatewayInstanceId;
  sessionKey: string;
  wrapperRoot: string;
  wrapperPath: string;
  rootPid: number;
  processGroupId?: number;
  commandHash: string;
  startedAt: number;
  state: "open" | "closing" | "closed" | "lost";
};
```

包装器进程应在其环境中接收租约 ID 和 Gateway 实例 ID：

```sh
OPENCLAW_ACPX_LEASE_ID=...
OPENCLAW_GATEWAY_INSTANCE_ID=...
```

在平台允许的情况下，验证应优先使用不会因命令引号而混淆的活跃进程元数据：

- 根 PID 仍然存在
- 活跃包装器路径位于 `wrapperRoot` 下
- 进程组与租约匹配（如果可用）
- 环境包含预期的租约 ID（如果可读）
- 命令哈希或可执行路径与租约匹配

如果活跃进程无法验证，清理操作将以失败关闭。

## 生命周期控制器

引入一个 ACPX 生命周期控制器，拥有进程租约和清理策略：

```ts
interface AcpxLifecycleController {
  ensureSession(input: AcpRuntimeEnsureInput): Promise<AcpRuntimeHandle>;
  cancelTurn(handle: AcpRuntimeHandle): Promise<void>;
  closeSession(input: {
    handle: AcpRuntimeHandle;
    discardPersistentState?: boolean;
    reason?: string;
  }): Promise<void>;
  reapStartupOrphans(): Promise<void>;
  verifyOwnedTree(lease: AcpxProcessLease): Promise<OwnedProcessTree | null>;
}
```

`cancelTurn` 仅请求取消轮次。它不得收割可复用的包装器或适配器进程。

`closeSession` 允许收割，但仅在加载 Session 记录、加载租约并验证活跃进程树仍属于该租约之后。

`reapStartupOrphans` 从状态中的开放租约开始。它可以使用进程表来查找后代，但不应首先扫描任意看似 ACP 的命令，然后再决定它们可能是我们的。

## 包装器契约

生成的包装器应保持精简。它们应：

- 在支持的情况下，在进程组中启动适配器
- 将正常终止信号转发给进程组
- 检测父进程死亡
- 在父进程死亡时，发送 SIGTERM，然后保持包装器存活，直到 SIGKILL 回退运行
- 在可用时将根 PID 和进程组 ID 报告回生命周期控制器

包装器不应决定 Session 策略。它们仅为其自己的适配器组强制执行本地进程树清理。

## Session 可见性契约

可见性应使用规范化的行所有权：

```ts
type SessionVisibilityInput = {
  requesterSessionKey: string;
  row: {
    key: string;
    agentId: string;
    ownerSessionKey?: string;
    spawnedBy?: string;
    parentSessionKey?: string;
  };
  visibility: "self" | "tree" | "agent" | "all";
  a2aPolicy: AgentToAgentPolicy;
};
```

规则：

- `self`：仅限请求者 Session。
- `tree`：请求者 Session 加上请求者拥有或从请求者派生的行。
- `all`：所有同 Agent 行、允许 a2a 的跨 Agent 行，以及请求者拥有的派生跨 Agent 行（即使一般 a2a 被禁用）。
- `agent`：仅限同一 Agent，除非明确的所有者关系表明该行属于请求者。

这使 `tree` 和 `all` 具有单调性：`all` 不得隐藏 `tree` 会显示的已拥有子项。

## 迁移计划

### 阶段 1：添加标识和租约

- 向 Gateway 状态添加 `gatewayInstanceId`。
- 在 ACPX 状态目录下添加 ACPX 租约存储。
- 在派生生成的包装器之前写入租约。
- 在新 ACPX Session 记录中存储 `leaseId`。
- 保留现有 PID 和命令字段以用于旧记录。

### 阶段 2：租约优先清理

- 将关闭清理更改为首先加载 `leaseId`。
- 在发送信号之前根据租约验证活跃进程所有权。
- 仅将当前根 PID 和包装器根回退保留用于旧记录。
- 验证清理后将租约标记为 `closed`。
- 当进程在清理前已消失时，将租约标记为 `lost`。

### 阶段 3：租约优先启动收割

- 启动收割扫描开放租约。
- 对于每个租约，验证根进程并收集后代。
- 以子进程优先的顺序收割已验证的树。
- 以有界保留窗口过期旧的 `closed` 和 `lost` 租约。
- 仅将命令标记扫描保留为临时旧版回退，尽可能通过包装器根和 Gateway 实例进行限制。

### 阶段 4：Session 所有权行

- 向 Gateway Session 行添加所有权元数据。
- 指导 ACPX、子 Agent、后台任务和 Session 存储写入器填充 `ownerSessionKey` 或 `spawnedBy`。
- 将 Session 可见性检查转换为使用行元数据。
- 删除可见性时的次级 `sessions.list({ spawnedBy })` 查找。

### 阶段 5：删除旧版启发式方法

在一个发布窗口后：

- 停止依赖存储的根命令字符串进行非旧版 ACPX 清理
- 删除命令标记启动扫描
- 删除可见性回退列表查找
- 为缺失或无法验证的租约保留防御性失败关闭行为

## 测试

添加两个表驱动的测试套件。

进程生命周期模拟器：

- PID 被不相关的进程重用
- PID 被另一个 Gateway 的包装器根重用
- 存储的包装器命令带有 shell 引号，活跃的 `ps` 命令没有
- 适配器子进程退出，孙进程仍在进程组中
- 父进程死亡 SIGTERM 回退到达 SIGKILL
- 进程列表不可用
- 带有缺失进程的过时租约
- 启动孤立进程，包含包装器、适配器子进程和孙进程

Session 可见性矩阵：

- `self`、`tree`、`agent`、`all`
- a2a 启用和禁用
- 同 Agent 行
- 跨 Agent 行
- 请求者拥有的派生跨 Agent ACP 行
- 沙箱请求者被限制为 `tree`
- 列表、历史记录、发送和状态操作

重要不变式：请求者拥有的派生子项在配置的可见性包括请求者 Session 树的任何地方都可见，且 `all` 的能力不低于 `tree`。

## 兼容性说明

旧 Session 记录可能没有 `leaseId`。它们应使用旧版失败关闭清理路径：

- 需要活跃的根进程
- 预期有生成的包装器时需要包装器根所有权
- 对非包装器根需要命令一致性
- 绝不仅基于过时的存储 PID 元数据发送信号

如果旧版记录无法验证，请不要处理它。启动租约清理和下一个发布窗口最终应淘汰该回退。

## 成功标准

- 关闭旧的或过时的 ACPX Session 不会杀死另一个 Gateway 的进程。
- 父进程死亡不会留下顽固的适配器孙进程在运行。
- `cancel` 中止活跃轮次，但不关闭可复用的 Session。
- `sessions_list` 可以在 `tree` 和 `all` 下显示请求者拥有的跨 Agent ACP 子项。
- 启动清理由租约驱动，而不是宽泛的命令字符串扫描。
- 专注的进程和可见性矩阵测试涵盖了以前需要一次性审查修复的每个边缘情况。
