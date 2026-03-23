---
title: "Exec 工具"
sidebarTitle: "Exec 工具"
mmh3_hash: "bfcede7d5c8202099879cb7d8be0d993"
summary: "Exec 工具使用、stdin 模式和 TTY 支持"
read_when:
  - 使用或修改 exec 工具
  - 调试 stdin 或 TTY 行为
---

# Exec 工具

在工作区中运行 shell 命令。通过 `process` 支持前台 + 后台执行。如果 `process` 被禁止，`exec` 同步运行并忽略 `yieldMs`/`background`。后台会话的作用域限定为每个代理；`process` 只能看到来自同一代理的会话。

## 参数

- `command`（必需）
- `workdir`（默认为 cwd）
- `env`（键/值覆盖）
- `yieldMs`（默认 10000）：延迟后自动后台运行
- `background`（bool）：立即后台运行
- `timeout`（秒，默认 1800）：超时时杀死
- `pty`（bool）：在可用时在伪终端中运行（仅 TTY CLI、编码代理、终端 UI）
- `host`（`sandbox | gateway | node`）：执行位置
- `security`（`deny | allowlist | full`）：`gateway`/`node` 的强制模式
- `ask`（`off | on-miss | always`）：`gateway`/`node` 的批准提示
- `node`（string）：`host=node` 的节点 id/名称
- `elevated`（bool）：请求提升模式（Gateway 主机）；仅当 elevated 解析为 `full` 时才强制 `security=full`

注意：

- `host` 默认为 `sandbox`。
- 当沙盒关闭时，`elevated` 被忽略（exec 已在主机上运行）。
- `gateway`/`node` 批准由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要配对的节点（伴侣应用或无头节点主机）。
- 如果有多个节点可用，设置 `exec.node` 或 `tools.exec.node` 以选择一个。
- 在非 Windows 主机上，exec 在设置时使用 `SHELL`；如果 `SHELL` 是 `fish`，它会优先选择 `PATH` 中的 `bash`（或 `sh`）以避免与 fish 不兼容的脚本，如果两者都不存在则回退到 `SHELL`。
- 在 Windows 主机上，exec 优先发现 PowerShell 7（`pwsh`）（Program Files、ProgramW6432，然后 PATH），然后回退到 Windows PowerShell 5.1。
- 主机执行（`gateway`/`node`）拒绝 `env.PATH` 和加载器覆盖（`LD_*`/`DYLD_*`）以防止二进制劫持或注入代码。
- 重要：沙盒**默认关闭**。如果沙盒关闭且显式配置/请求了 `host=sandbox`，exec 现在会安全失败而不是静默地在 Gateway 主机上运行。启用沙盒或使用带有批准的 `host=gateway`。
- 脚本预检（针对常见的 Python/Node shell 语法错误）仅检查有效 `workdir` 边界内的文件。如果脚本路径解析到 `workdir` 之外，则跳过该文件的预检。

## 配置

- `tools.exec.notifyOnExit`（默认：true）：为 true 时，后台 exec 会话在退出时排队系统事件并请求心跳。
- `tools.exec.approvalRunningNoticeMs`（默认：10000）：当批准门控的 exec 运行时间超过此值时发出单个"运行中"通知（0 禁用）。
- `tools.exec.host`（默认：`sandbox`）
- `tools.exec.security`（对于沙盒默认为 `deny`，对于 Gateway + 节点在未设置时默认为 `allowlist`）
- `tools.exec.ask`（默认：`on-miss`）
- `tools.exec.node`（默认：未设置）
- `tools.exec.strictInlineEval`（默认：false）：为 true 时，内联解释器 eval 形式（如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e`）始终需要显式批准，且 `allow-always` 永远不会持久化它们。
- `tools.exec.pathPrepend`：要为 exec 运行前置到 `PATH` 的目录列表（仅 Gateway + 沙盒）。
- `tools.exec.safeBins`：可以在没有显式允许列表条目的情况下运行的仅 stdin 安全二进制文件。有关行为详细信息，请参见 [安全 bin](/tools/exec-approvals#safe-bins-stdin-only)。
- `tools.exec.safeBinTrustedDirs`：用于 `safeBins` 路径检查的额外显式受信任目录。`PATH` 条目永远不会自动受信任。内置默认值为 `/bin` 和 `/usr/bin`。
- `tools.exec.safeBinProfiles`：每个安全 bin 的可选自定义 argv 策略（`minPositional`、`maxPositional`、`allowedValueFlags`、`deniedFlags`）。

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

- `host=gateway`：将您的登录 shell `PATH` 合并到 exec 环境中。主机执行拒绝 `env.PATH` 覆盖。守护进程本身仍然使用最小的 `PATH` 运行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。OpenClaw 在配置文件来源后通过内部环境变量前置 `env.PATH`（无 shell 插值）；`tools.exec.pathPrepend` 也在这里应用。
- `host=node`：只有您传递的非阻止环境覆盖才会发送到节点。主机执行拒绝 `env.PATH` 覆盖，节点主机也会忽略它。如果您需要节点上的额外 PATH 条目，请配置节点主机服务环境（systemd/launchd）或将工具安装在标准位置。

每个代理的节点绑定（在配置中使用代理列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI：节点选项卡包含一个小的"Exec 节点绑定"面板，用于相同的设置。

## 会话覆盖（`/exec`）

使用 `/exec` 为 `host`、`security`、`ask` 和 `node` 设置**每会话**默认值。发送不带参数的 `/exec` 以显示当前值。

示例：

```
/exec host=gateway security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对**授权发送者**（频道允许列表/配对加 `commands.useAccessGroups`）有效。它**仅**更新会话状态，不写入配置。要硬禁用 exec，通过工具策略拒绝它（`tools.deny: ["exec"]` 或每个代理）。除非您明确设置 `security=full` 和 `ask=off`，否则主机批准仍然适用。

## Exec 批准（伴侣应用/节点主机）

沙盒化的代理可以在 `exec` 在 Gateway 或节点主机上运行之前要求每请求批准。有关策略、允许列表和 UI 流程，请参见 [Exec 批准](/tools/exec-approvals)。

当需要批准时，exec 工具立即返回 `status: "approval-pending"` 和批准 id。一旦批准（或拒绝/超时），Gateway 发出系统事件（`Exec finished` / `Exec denied`）。如果命令在 `tools.exec.approvalRunningNoticeMs` 后仍在运行，会发出单个 `Exec running` 通知。

## 允许列表 + 安全 bin

允许列表强制执行**仅**匹配解析的二进制路径（无基名匹配）。当 `security=allowlist` 时，仅当每个管道段都在允许列表中或是安全 bin 时，才自动允许 shell 命令。在允许列表模式下，链接（`;`、`&&`、`||`）和重定向仅在每个顶级段满足允许列表时被允许（包括安全 bin）。重定向仍不受支持。

`autoAllowSkills` 是 exec 批准中的一个独立便捷路径。它与手动路径允许列表条目不同。对于严格的显式信任，保持 `autoAllowSkills` 禁用。

对不同任务使用两个控制：

- `tools.exec.safeBins`：小型、仅 stdin 的流过滤器。
- `tools.exec.safeBinTrustedDirs`：安全 bin 可执行文件路径的额外显式受信任目录。
- `tools.exec.safeBinProfiles`：自定义安全 bin 的显式 argv 策略。
- 允许列表：可执行文件路径的显式信任。

不要将 `safeBins` 视为通用允许列表，也不要添加解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要这些，请使用显式允许列表条目并保持启用批准提示。
`openclaw security audit` 在解释器/运行时 `safeBins` 条目缺少显式配置文件时发出警告，`openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles` 条目搭建脚手架。
`openclaw security audit` 和 `openclaw doctor` 还会在你将 `jq` 等宽行为 bin 显式加回 `safeBins` 时发出警告。
如果你显式将解释器加入允许列表，请启用 `tools.exec.strictInlineEval`，使内联代码 eval 形式仍需新的批准。

有关完整的策略详细信息和示例，请参见 [Exec 批准](/tools/exec-approvals#safe-bins-stdin-only) 和 [安全 bin 与允许列表](/tools/exec-approvals#safe-bins-versus-allowlist)。

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

发送键（tmux 样式）：

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

提交（仅发送 CR）：

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

粘贴（默认使用括号）：

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch（实验性）

`apply_patch` 是 `exec` 的子工具，用于结构化的多文件编辑。明确启用它：

```json5
{
  tools: {
    exec: {
      applyPatch: { enabled: true, workspaceOnly: true, allowModels: ["gpt-5.2"] },
    },
  },
}
```

注意：

- 仅适用于 OpenAI/OpenAI Codex 模型。
- 工具策略仍然适用；`allow: ["exec"]` 隐式允许 `apply_patch`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（工作区包含）。仅在您故意希望 `apply_patch` 在工作区目录之外写入/删除时才将其设置为 `false`。
