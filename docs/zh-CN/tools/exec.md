---
mmh3_hash: "eec9116273e2f38adae5feee74ef6d59"
read_when:
  - 使用或修改 exec 工具
  - 调试 stdin 或 TTY 行为
summary: Exec 工具用法、stdin 模式和 TTY 支持
title: Exec 工具
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/exec.md
  workflow: 15
---

# Exec 工具

在工作区中运行 shell 命令。通过 `process` 支持前台和后台执行。
如果 `process` 被禁用，`exec` 将同步运行并忽略 `yieldMs`/`background`。
后台 Session 按智能体隔离；`process` 只能看到同一智能体的 Session。

## 参数

- `command`（必填）
- `workdir`（默认为当前工作目录）
- `env`（键值对覆盖）
- `yieldMs`（默认 10000）：延迟后自动转入后台
- `background`（布尔值）：立即转入后台
- `timeout`（秒，默认 1800）：超时后终止
- `pty`（布尔值）：在可用时使用伪终端运行（仅限 TTY 的 CLI、编码智能体、终端 UI）
- `host`（`auto | sandbox | gateway | node`）：执行位置
- `security`（`deny | allowlist | full`）：`gateway`/`node` 的执行策略
- `ask`（`off | on-miss | always`）：`gateway`/`node` 的审批提示
- `node`（字符串）：`host=node` 时的节点 id/名称
- `elevated`（布尔值）：请求提升模式（gateway 宿主机）；仅当 elevated 解析为 `full` 时才强制 `security=full`

注意事项：

- `host` 默认为 `auto`：当 Session 的沙箱运行时处于活跃状态时为 `sandbox`，否则为 `gateway`。
- `elevated` 强制 `host=gateway`；仅当当前 Session/提供商启用了提升访问时才可用。
- `gateway`/`node` 审批由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要已配对的节点（配套应用或无头节点宿主机）。
- 如果有多个可用节点，设置 `exec.node` 或 `tools.exec.node` 来选择一个。
- `exec host=node` 是节点的唯一 shell 执行路径；旧版 `nodes.run` 封装已被移除。
- 在非 Windows 宿主机上，exec 会使用已设置的 `SHELL`；如果 `SHELL` 是 `fish`，它会优先从 `PATH` 中选择 `bash`（或 `sh`）以避免 fish 不兼容的脚本，如果两者都不存在则回退到 `SHELL`。
- 宿主机执行（`gateway`/`node`）会拒绝 `env.PATH` 和加载器覆盖（`LD_*`/`DYLD_*`），以防止二进制劫持或代码注入。
- OpenClaw 在生成的命令环境中设置 `OPENCLAW_SHELL=exec`（包括 PTY 和沙箱执行），以便 shell/profile 规则可以检测 exec 工具上下文。
- 重要提示：沙箱**默认关闭**。如果沙箱关闭，隐式 `host=auto` 解析为 `gateway`。显式 `host=sandbox` 仍然会失败而不是静默地在 gateway 宿主机上运行。启用沙箱或使用带审批的 `host=gateway`。

## 配置

- `tools.exec.notifyOnExit`（默认：true）：为 true 时，后台 exec Session 在退出时会入队系统事件并请求心跳。
- `tools.exec.approvalRunningNoticeMs`（默认：10000）：当需要审批的 exec 运行时间超过此值时发出单次"运行中"通知（0 表示禁用）。
- `tools.exec.host`（默认：`auto`；当沙箱运行时处于活跃状态时解析为 `sandbox`，否则为 `gateway`）
- `tools.exec.security`（默认：sandbox 为 `deny`，gateway + node 未设置时为 `allowlist`）
- `tools.exec.ask`（默认：`on-miss`）
- `tools.exec.node`（默认：未设置）
- `tools.exec.strictInlineEval`（默认：false）：为 true 时，内联解释器 eval 形式（如 `python -c`、`node -e`、`ruby -e` 等）始终需要显式审批，且不会被 `allow-always` 持久化。
- `tools.exec.pathPrepend`：exec 运行时添加到 `PATH` 前面的目录列表（仅 gateway + 沙箱）。
- `tools.exec.safeBins`：仅限 stdin 的安全二进制文件，无需显式白名单条目即可运行。
- `tools.exec.safeBinTrustedDirs`：`safeBins` 路径检查的额外显式受信任目录。
- `tools.exec.safeBinProfiles`：每个安全 bin 的可选自定义 argv 策略。

示例：

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### PATH 处理

- `host=gateway`：将你的登录 shell `PATH` 合并到 exec 环境中。宿主机执行时会拒绝 `env.PATH` 覆盖。
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell）。`tools.exec.pathPrepend` 在此也适用。
- `host=node`：只有你传递的未被阻止的 env 覆盖会发送到节点。`env.PATH` 覆盖被拒绝。

按智能体绑定节点（在配置中使用智能体列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

## Session 覆盖（`/exec`）

使用 `/exec` 为 `host`、`security`、`ask` 和 `node` 设置**每 Session**默认值。不带参数发送 `/exec` 可显示当前值。

示例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对**已授权发送者**（Channel 白名单/配对加 `commands.useAccessGroups`）生效。
它仅更新**Session 状态**，不写入配置。要彻底禁用 exec，请通过工具策略拒绝它（`tools.deny: ["exec"]` 或按智能体配置）。

## Exec 审批（配套应用/节点宿主机）

沙箱化的智能体可以要求在 `exec` 于 Gateway 或节点宿主机上运行前进行逐请求审批。
参阅 [Exec 审批](/tools/exec-approvals) 了解策略、白名单和 UI 流程。

## 白名单 + 安全二进制文件

白名单执行仅匹配**解析后的二进制路径**（不匹配基本名称）。当 `security=allowlist` 时，仅当每个管道段都在白名单中或是安全二进制文件时，shell 命令才会自动允许。

不要将 `safeBins` 视为通用白名单，不要添加解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。

## 示例

前台：

```json
{ "tool": "exec", "command": "ls -la" }
```

后台 + 轮询：

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

发送按键（tmux 风格）：

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
```

提交（仅发送 CR）：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

粘贴（默认带括号）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` 是 `exec` 的子工具，用于结构化多文件编辑。
对于 OpenAI 和 OpenAI Codex 模型**默认启用**。仅在需要禁用或限制特定模型时使用配置：

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.2"] },
    },
  },
}
```

注意事项：

- 仅适用于 OpenAI/OpenAI Codex 模型。
- 工具策略仍然适用；`allow: ["write"]` 隐式允许 `apply_patch`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 默认为 `true`；设置为 `false` 可禁用。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（仅限工作区）。
