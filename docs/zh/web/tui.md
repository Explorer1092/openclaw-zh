---
title: "TUI"
mmh3_hash: "60bf45f9c955a788f4280ed4ef872085"
summary: "Terminal UI（TUI）：连接到 Gateway 或在嵌入式模式下本地运行"
read_when:
  - 您想要 TUI 的入门友好演练
  - 您需要 TUI 功能、命令和快捷键的完整列表
---

## 快速开始

### Gateway 模式

1. 启动 Gateway。

```bash
openclaw gateway
```

2. 打开 TUI。

```bash
openclaw tui
```

3. 输入消息并按 Enter。

远程 Gateway：

```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```

如果您的 Gateway 使用密码认证，请使用 `--password`。

### 本地模式

在没有 Gateway 的情况下运行 TUI：

```bash
openclaw chat
# 或
openclaw tui --local
```

说明：

- `openclaw chat` 和 `openclaw terminal` 是 `openclaw tui --local` 的别名。
- `--local` 不能与 `--url`、`--token` 或 `--password` 组合使用。
- 本地模式直接使用嵌入式 agent 运行时。大多数本地工具有效，但仅 Gateway 功能不可用。
- 配置文件设置完成后，`openclaw` 和 `openclaw crestodian` 也使用此 TUI shell，Crestodian 作为本地设置和修复聊天后端。

## 您看到的内容

- 标头：连接 URL、当前 agent、当前会话。
- 聊天日志：用户消息、助手回复、系统通知、工具卡片。
- 状态行：连接/运行状态（连接中、运行中、流式传输中、空闲、错误）。
- 页脚：连接状态 + agent + 会话 + 模型 + 思考/快速/详细/跟踪/推理 + 令牌计数 + 交付。
- 输入：带自动完成的文本编辑器。

## 心智模型：agent + 会话

- Agent 是唯一的 slug（例如 `main`、`research`）。Gateway 公开列表。
- 会话属于当前 agent。
- 会话键存储为 `agent:<agentId>:<sessionKey>`。
  - 如果您输入 `/session main`，TUI 将其扩展为 `agent:<currentAgent>:main`。
  - 如果您输入 `/session agent:other:main`，您将明确切换到该 agent 会话。
- 会话范围：
  - `per-sender`（默认）：每个 agent 有多个会话。
  - `global`：TUI 始终使用 `global` 会话（选择器可能为空）。
- 当前 agent + 会话始终在页脚中可见。
- 在没有 `--session` 的情况下启动时，Gateway 模式 TUI 会恢复同一 Gateway、agent 和会话范围上次选择的会话（如果该会话仍然存在）。传递 `--session`、`/session`、`/new` 或 `/reset` 仍然是明确的。

## 发送 + 交付

- 消息发送到 Gateway；默认情况下，向 provider 的交付是关闭的。
- TUI 是像 WebChat 一样的内部来源界面，而不是通用的出站 Channel。需要 `tools.message` 来显示回复的 Harness 可以用无目标的 `message.send` 满足活动的 TUI 轮次；显式 Provider 交付仍然使用正常配置的 Channel，绝不回退到 `lastChannel`。
- 开启交付：
  - `/deliver on`
  - 或设置面板
  - 或使用 `openclaw tui --deliver` 启动

## 选择器 + 叠加层

- 模型选择器：列出可用模型并设置会话覆盖。
- Agent 选择器：选择不同的 agent。
- 会话选择器：显示当前 agent 在过去 7 天内更新的最多 50 个会话。使用 `/session <key>` 跳转到较旧的已知会话。
- 设置：切换交付、工具输出展开和思考可见性。

## 键盘快捷键

- Enter：发送消息
- Esc：中止活动运行
- Ctrl+C：清除输入（按两次退出）
- Ctrl+D：退出
- Ctrl+L：模型选择器
- Ctrl+G：Agent 选择器
- Ctrl+P：会话选择器
- Ctrl+O：切换工具输出展开
- Ctrl+T：切换思考可见性（重新加载历史）

## 斜杠命令

核心：

- `/help`
- `/status`
- `/agent <id>`（或 `/agents`）
- `/session <key>`（或 `/sessions`）
- `/model <provider/model>`（或 `/models`）

会话控制：

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/trace <on|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`（别名：`/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

会话生命周期：

- `/new` 或 `/reset`（重置会话）
- `/abort`（中止活动运行）
- `/settings`
- `/exit`

仅本地模式：

- `/auth [provider]` 在 TUI 内打开 provider 认证/登录流程。

其他 Gateway 斜杠命令（例如 `/context`）被转发到 Gateway 并显示为系统输出。请参阅 [斜杠命令](/tools/slash-commands)。

## 本地 shell 命令

- 以 `!` 为行前缀以在 TUI 主机上运行本地 shell 命令。
- TUI 每个会话提示一次以允许本地执行；拒绝会在该会话中保持 `!` 禁用。
- 命令在 TUI 工作目录中的新鲜、非交互式 shell 中运行（无持久 `cd`/env）。
- 本地 shell 命令在其环境中接收 `OPENCLAW_SHELL=tui-local`。
- 单独的 `!` 作为普通消息发送；前导空格不触发本地执行。

## 从本地 TUI 修复配置

当当前配置已经验证，并且您希望嵌入式 agent 在同一台机器上检查它，将其与文档进行比较，并在不依赖运行中的 Gateway 的情况下帮助修复漂移时，请使用本地模式。

如果 `openclaw config validate` 已经失败，请先从 `openclaw configure` 或 `openclaw doctor --fix` 开始。`openclaw chat` 不会绕过无效配置保护。

典型循环：

1. 启动本地模式：

```bash
openclaw chat
```

2. 询问 agent 您想检查的内容，例如：

```text
Compare my gateway auth config with the docs and suggest the smallest fix.
```

3. 使用本地 shell 命令获取确切证据和验证：

```text
!openclaw config file
!openclaw docs gateway auth token secretref
!openclaw config validate
!openclaw doctor
```

4. 使用 `openclaw config set` 或 `openclaw configure` 应用窄小更改，然后重新运行 `!openclaw config validate`。
5. 如果 Doctor 建议自动迁移或修复，审查它并运行 `!openclaw doctor --fix`。

提示：

- 优先使用 `openclaw config set` 或 `openclaw configure`，而不是手动编辑 `openclaw.json`。
- `openclaw docs "<query>"` 从同一台机器搜索实时文档索引。
- `openclaw config validate --json` 在您需要结构化 schema 和 SecretRef/可解析性错误时很有用。

## 工具输出

- 工具调用显示为带参数 + 结果的卡片。
- Ctrl+O 在折叠/展开视图之间切换。
- 工具运行时，部分更新流入同一卡片。

## 终端颜色

- TUI 将助手正文文本保持在您终端的默认前景颜色，以便深色和浅色终端都保持可读。
- 如果您的终端使用浅色背景且自动检测有误，请在启动 `openclaw tui` 之前设置 `OPENCLAW_THEME=light`。
- 要强制使用原始深色调色板，请设置 `OPENCLAW_THEME=dark`。

## 历史 + 流式传输

- 连接时，TUI 加载最新历史（默认 200 条消息）。
- 流式响应就地更新直到最终化。
- TUI 还监听 agent 工具事件以获得更丰富的工具卡片。

## 连接详情

- TUI 以 `mode: "tui"` 向 Gateway 注册。
- 重新连接显示系统消息；事件间隙在日志中显示。

## 选项

- `--local`：针对本地嵌入式 agent 运行时运行
- `--url <url>`：Gateway WebSocket URL（默认为配置或 `ws://127.0.0.1:<port>`）
- `--token <token>`：Gateway 令牌（如果需要）
- `--password <password>`：Gateway 密码（如果需要）
- `--session <key>`：会话键（默认：`main`，或当范围为全局时为 `global`）
- `--deliver`：向 provider 交付助手回复（默认关闭）
- `--thinking <level>`：覆盖发送的思考级别
- `--message <text>`：连接后发送初始消息
- `--timeout-ms <ms>`：Agent 超时（毫秒，默认为 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要加载的历史条目（默认 `200`）

<Warning>
当您设置 `--url` 时，TUI 不会回退到配置或环境凭据。明确传递 `--token` 或 `--password`。缺少显式凭据是错误。在本地模式下，不要传递 `--url`、`--token` 或 `--password`。
</Warning>

## 故障排除

发送消息后无输出：

- 在 TUI 中运行 `/status` 以确认 Gateway 已连接且处于空闲/忙碌状态。
- 检查 Gateway 日志：`openclaw logs --follow`。
- 确认 agent 可以运行：`openclaw status` 和 `openclaw models status`。
- 如果您期望聊天频道中有消息，请启用交付（`/deliver on` 或 `--deliver`）。

## 连接故障排除

- `disconnected`：确保 Gateway 正在运行，您的 `--url/--token/--password` 正确。
- 选择器中没有 agent：检查 `openclaw agents list` 和您的路由配置。
- 空的会话选择器：您可能处于全局范围或尚无会话。

## 相关文档

- [Control UI](/web/control-ui) — 基于 Web 的控制界面
- [配置](/cli/config) — 检查、验证和编辑 `openclaw.json`
- [Doctor](/cli/doctor) — 引导修复和迁移检查
- [CLI 参考](/cli) — 完整 CLI 命令参考
