---
title: "Exec 工具"
sidebarTitle: "Exec 工具"
mmh3_hash: "6412816102b825a871400e716a0b2f05"
summary: "Exec 工具使用、stdin 模式和 TTY 支持"
read_when:
  - 使用或修改 exec 工具
  - 调试 stdin 或 TTY 行为
---

在工作区中运行 shell 命令。`exec` 是一个可变更的 shell 界面：命令可以在所选主机或沙盒文件系统允许的范围内创建、编辑或删除文件。禁用 OpenClaw 的文件系统工具（如 `write`、`edit` 或 `apply_patch`）并不会使 `exec` 变为只读。

通过 `process` 支持前台 + 后台执行。如果 `process` 被禁止，`exec` 同步运行并忽略 `yieldMs`/`background`。后台会话的作用域限定为每个 Agent；`process` 只能看到来自同一 Agent 的会话。

## 参数

<ParamField path="command" type="string" required>
要运行的 shell 命令。
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
命令的工作目录。
</ParamField>

<ParamField path="env" type="object">
合并到继承环境之上的键/值环境覆盖。
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
在此延迟后自动后台化命令（毫秒）。
</ParamField>

<ParamField path="background" type="boolean" default="false">
立即后台化命令，而不是等待 `yieldMs`。
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
覆盖此次调用的已配置 exec 超时时间。仅当命令应在不设置 exec 进程超时的情况下运行时，才设置 `timeout: 0`。
</ParamField>

<ParamField path="pty" type="boolean" default="false">
在可用时在伪终端中运行。适用于仅限 TTY 的 CLI、编码 Agent 和终端 UI。
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
执行位置。`auto` 在沙盒运行时活跃时解析为 `sandbox`，否则解析为 `gateway`。
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
普通工具调用时忽略此参数。`gateway`/`node` 安全性由 `tools.exec.security` 和 `~/.openclaw/exec-approvals.json` 控制；仅当操作者明确授予提升访问权限时，提升模式才可强制 `security=full`。
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
`gateway`/`node` 执行的审批提示行为。
</ParamField>

<ParamField path="node" type="string">
`host=node` 时的节点 id/名称。
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
请求提升模式——将沙盒逃逸到配置的主机路径。仅当 elevated 解析为 `full` 时才强制 `security=full`。
</ParamField>

注意：

- `host` 默认为 `auto`：当沙盒运行时对 Session 活跃时为 sandbox，否则为 gateway。
- `host` 仅接受 `auto`、`sandbox`、`gateway` 或 `node`。它不是主机名选择器；类似主机名的值在命令运行前会被拒绝。
- `auto` 是默认路由策略，而非通配符。从 `auto` 发起的每次调用中 `host=node` 是允许的；`host=gateway` 仅在没有沙盒运行时活跃时才允许。
- 无需额外配置，`host=auto` 仍"开箱即用"：无沙盒时解析为 `gateway`；有活跃沙盒时保持在沙盒中。
- `elevated` 将沙盒逃逸到配置的主机路径：默认为 `gateway`，或当 `tools.exec.host=node`（或 Session 默认为 `host=node`）时为 `node`。仅在当前 Session/Provider 启用了提升访问时可用。
- `gateway`/`node` 审批由 `~/.openclaw/exec-approvals.json` 控制。
- `node` 需要配对的节点（伴侣应用或无头节点主机）。
- 如果有多个节点可用，设置 `exec.node` 或 `tools.exec.node` 以选择一个。
- `exec host=node` 是节点上唯一的 shell 执行路径；旧版 `nodes.run` 封装器已被移除。
- `timeout` 适用于前台、后台、`yieldMs`、gateway、沙盒和节点 `system.run` 执行。如果省略，OpenClaw 使用 `tools.exec.timeoutSec`；显式 `timeout: 0` 禁用该次调用的 exec 进程超时。
- 在非 Windows 主机上，exec 在设置时使用 `SHELL`；如果 `SHELL` 是 `fish`，它会优先选择 `PATH` 中的 `bash`（或 `sh`）以避免与 fish 不兼容的脚本，如果两者都不存在则回退到 `SHELL`。
- 在 Windows 主机上，exec 优先发现 PowerShell 7（`pwsh`）（Program Files、ProgramW6432，然后 PATH），然后回退到 Windows PowerShell 5.1。
- 主机执行（`gateway`/`node`）拒绝 `env.PATH` 和加载器覆盖（`LD_*`/`DYLD_*`）以防止二进制劫持或注入代码。
- OpenClaw 在生成的命令环境中设置 `OPENCLAW_SHELL=exec`（包括 PTY 和沙盒执行），以便 shell/profile 规则可以检测 exec 工具上下文。
- `openclaw channels login` 在 `exec` 中被阻止，因为它是一个交互式 Channel 认证流程；在 Gateway 主机上的终端中运行它，或在聊天中使用 Channel 原生登录工具（如果存在）。
- 重要：沙盒**默认关闭**。如果沙盒关闭，隐式 `host=auto` 解析为 `gateway`。显式 `host=sandbox` 仍会安全失败，而不是静默地在 Gateway 主机上运行。启用沙盒或使用带有审批的 `host=gateway`。
- 脚本预检（针对常见的 Python/Node shell 语法错误）仅检查有效 `workdir` 边界内的文件。如果脚本路径解析到 `workdir` 之外，则跳过该文件的预检。
- 对于立即开始的长时间运行工作，启动一次后依赖自动完成唤醒（在启用且命令产生输出或失败时）。使用 `process` 查看日志、状态、输入或干预；不要用 sleep 循环、超时循环或重复轮询来模拟调度。
- 对于应在以后或按计划进行的工作，请使用 cron 而非 `exec` sleep/delay 模式。

## 配置

- `tools.exec.notifyOnExit`（默认：true）：为 true 时，后台 exec 会话在退出时排队系统事件并请求心跳。
- `tools.exec.approvalRunningNoticeMs`（默认：10000）：当审批门控的 exec 运行时间超过此值时发出单个"运行中"通知（0 禁用）。
- `tools.exec.timeoutSec`（默认：1800）：默认每命令 exec 超时（秒）。每次调用的 `timeout` 覆盖它；每次调用的 `timeout: 0` 禁用该次调用的 exec 进程超时。
- `tools.exec.host`（默认：`auto`；当沙盒运行时对 Session 活跃时解析为 `sandbox`，否则为 `gateway`）
- `tools.exec.security`（对于沙盒默认为 `deny`，对于 Gateway + 节点在未设置时默认为 `full`）
- `tools.exec.ask`（默认：`off`）
- 无审批的主机 exec 是 Gateway + 节点的默认行为。如果你想要审批/允许列表行为，请同时收紧 `tools.exec.*` 和主机 `~/.openclaw/exec-approvals.json`；参见 [Exec 审批](/tools/exec-approvals#yolo-mode-no-approval)。
- YOLO 来自主机策略默认值（`security=full`、`ask=off`），而不是来自 `host=auto`。如果你想强制 Gateway 或节点路由，请设置 `tools.exec.host` 或使用 `/exec host=...`。
- 在 `security=full` 加 `ask=off` 模式下，主机 exec 直接遵循配置的策略；没有额外的启发式命令混淆预过滤器或脚本预检拒绝层。
- `tools.exec.node`（默认：未设置）
- `tools.exec.strictInlineEval`（默认：false）：为 true 时，内联解释器 eval 形式（如 `python -c`、`node -e`、`ruby -e`、`perl -e`、`php -r`、`lua -e` 和 `osascript -e`）始终需要显式审批。`allow-always` 仍可以持久化良性的解释器/脚本调用，但内联 eval 形式每次仍会提示。
- `tools.exec.commandHighlighting`（默认：false）：为 true 时，审批提示可以高亮显示命令文本中解析器派生的命令 span。可在全局或每个 Agent 设置为 `true` 以启用命令文本高亮，而不更改 exec 审批策略。
- `tools.exec.pathPrepend`：要为 exec 运行前置到 `PATH` 的目录列表（仅 Gateway + 沙盒）。
- `tools.exec.safeBins`：可以在没有显式允许列表条目的情况下运行的仅 stdin 安全二进制文件。有关行为详细信息，请参见 [安全 bin](/tools/exec-approvals-advanced#safe-bins-stdin-only)。
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

- `host=gateway`：将你的登录 shell `PATH` 合并到 exec 环境中。主机执行拒绝 `env.PATH` 覆盖。守护进程本身仍然使用最小的 `PATH` 运行：
  - macOS：`/opt/homebrew/bin`、`/usr/local/bin`、`/usr/bin`、`/bin`
  - Linux：`/usr/local/bin`、`/usr/bin`、`/bin`
    - 为防止用户 shell 配置（如 `~/.zshenv` 或 `/etc/zshenv`）在启动时覆盖优先级路径，`tools.exec.pathPrepend` 条目会在执行前以安全方式前置到 shell 命令内部的最终 `PATH` 中。
- `host=sandbox`：在容器内运行 `sh -lc`（登录 shell），因此 `/etc/profile` 可能会重置 `PATH`。OpenClaw 在配置文件来源后通过内部环境变量前置 `env.PATH`（无 shell 插值）；`tools.exec.pathPrepend` 也在这里应用。
- `host=node`：只有你传递的非阻止环境覆盖才会发送到节点。主机执行拒绝 `env.PATH` 覆盖，节点主机也会忽略它。如果你需要节点上的额外 PATH 条目，请配置节点主机服务环境（systemd/launchd）或将工具安装在标准位置。

每个 Agent 的节点绑定（在配置中使用 Agent 列表索引）：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

控制 UI：节点选项卡包含一个小的"Exec 节点绑定"面板，用于相同的设置。

## 会话覆盖（`/exec`）

使用 `/exec` 为 `host`、`security`、`ask` 和 `node` 设置**每 Session** 默认值。发送不带参数的 `/exec` 以显示当前值。

示例：

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## 授权模型

`/exec` 仅对**授权发送者**（Channel 允许列表/配对加 `commands.useAccessGroups`）有效。它**仅**更新 Session 状态，不写入配置。要硬禁用 exec，通过工具策略拒绝它（`tools.deny: ["exec"]` 或每个 Agent）。除非你明确设置 `security=full` 和 `ask=off`，否则主机审批仍然适用。

## Exec 审批（伴侣应用/节点主机）

沙盒化的 Agent 可以在 `exec` 在 Gateway 或节点主机上运行之前要求每请求审批。有关策略、允许列表和 UI 流程，请参见 [Exec 审批](/tools/exec-approvals)。

当需要审批时，exec 工具立即返回 `status: "approval-pending"` 和审批 id。一旦审批（或拒绝/超时），Gateway 仅为已审批的运行发出命令进度和完成系统事件（`Exec running` / `Exec finished`）。被拒绝或超时的审批是终态，不会用拒绝系统事件唤醒 Agent Session。在具有原生审批卡/按钮的 Channel 上，Agent 应优先依赖该原生 UI，仅在工具结果明确表示聊天审批不可用或手动审批是唯一路径时才包含手动 `/approve` 命令。

## 允许列表 + 安全 bin

手动允许列表强制执行匹配已解析的二进制路径 glob 和裸命令名 glob。裸名称仅匹配通过 PATH 调用的命令，因此当命令为 `rg` 时，`rg` 可以匹配 `/opt/homebrew/bin/rg`，但不匹配 `./rg` 或 `/tmp/rg`。当 `security=allowlist` 时，仅当每个管道段都在允许列表中或是安全 bin 时，才自动允许 shell 命令。在允许列表模式下，链接（`;`、`&&`、`||`）和重定向仅在每个顶级段满足允许列表时被允许（包括安全 bin）。重定向仍不受支持。持久 `allow-always` 信任不会绕过该规则：链接命令仍然要求每个顶级段都匹配。

`autoAllowSkills` 是 exec 审批中的一个独立便捷路径。它与手动路径允许列表条目不同。对于严格的显式信任，保持 `autoAllowSkills` 禁用。

对不同任务使用两个控制：

- `tools.exec.safeBins`：小型、仅 stdin 的流过滤器。
- `tools.exec.safeBinTrustedDirs`：安全 bin 可执行文件路径的额外显式受信任目录。
- `tools.exec.safeBinProfiles`：自定义安全 bin 的显式 argv 策略。
- 允许列表：可执行文件路径的显式信任。

不要将 `safeBins` 视为通用允许列表，也不要添加解释器/运行时二进制文件（例如 `python3`、`node`、`ruby`、`bash`）。如果你需要这些，请使用显式允许列表条目并保持启用审批提示。
`openclaw security audit` 在解释器/运行时 `safeBins` 条目缺少显式配置文件时发出警告，`openclaw doctor --fix` 可以为缺失的自定义 `safeBinProfiles` 条目搭建脚手架。
`openclaw security audit` 和 `openclaw doctor` 还会在你将 `jq` 等宽行为 bin 显式加回 `safeBins` 时发出警告。
如果你显式将解释器加入允许列表，请启用 `tools.exec.strictInlineEval`，使内联代码 eval 形式仍需新的审批。

有关完整的策略详细信息和示例，请参见 [Exec 审批](/tools/exec-approvals-advanced#safe-bins-stdin-only) 和 [安全 bin 与允许列表](/tools/exec-approvals-advanced#safe-bins-versus-allowlist)。

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

轮询用于按需查看状态，而非等待循环。如果启用了自动完成唤醒，命令在产生输出或失败时可以唤醒 Session。

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

## apply_patch

`apply_patch` 是 `exec` 的子工具，用于结构化的多文件编辑。默认对 OpenAI 和 OpenAI Codex 模型可用。仅在需要禁用或限制特定模型时使用配置：

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

注意：

- 仅适用于 OpenAI/OpenAI Codex 模型。
- 工具策略仍然适用；`allow: ["write"]` 隐式允许 `apply_patch`。
- `deny: ["write"]` 不会拒绝 `apply_patch`；当 patch 写入也应被阻止时，显式拒绝 `apply_patch` 或使用 `deny: ["group:fs"]`。
- 配置位于 `tools.exec.applyPatch` 下。
- `tools.exec.applyPatch.enabled` 默认为 `true`；将其设置为 `false` 可为 OpenAI 模型禁用该工具。
- `tools.exec.applyPatch.workspaceOnly` 默认为 `true`（工作区包含）。仅在你故意希望 `apply_patch` 在工作区目录之外写入/删除时才将其设置为 `false`。

## 相关

- [Exec 审批](/tools/exec-approvals) — shell 命令的审批门控
- [沙盒化](/gateway/sandboxing) — 在沙盒环境中运行命令
- [后台进程](/gateway/background-process) — 长时间运行的 exec 和 process 工具
- [安全](/gateway/security) — 工具策略和提升访问
