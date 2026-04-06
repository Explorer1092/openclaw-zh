---
mmh3_hash: "5ec1e8f580494957a450c8b16be17206"
summary: "Terminal UI（TUI）：从任何机器连接到 Gateway"
read_when:
  - 您想要 TUI 的入门友好演练
  - 您需要 TUI 功能、命令和快捷键的完整列表
title: "TUI"
---

# TUI（Terminal UI）

## 快速开始

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

## 您看到的内容

- 标题：连接 URL、当前 Agent、当前会话。
- 聊天日志：用户消息、助手回复、系统通知、工具卡片。
- 状态行：连接/运行状态（连接中、运行中、流式传输中、空闲、错误）。
- 页脚：连接状态 + Agent + Session + 模型 + think/fast/verbose/reasoning + 令牌计数 + 传递。
- 输入：带自动完成的文本编辑器。

## 心智模型：Agents + Sessions

- Agents 是唯一的 slug（例如 `main`、`research`）。Gateway 公开列表。
- Sessions 属于当前 Agent。
- Session 键存储为 `agent:<agentId>:<sessionKey>`。
  - 如果您输入 `/session main`，TUI 将其扩展为 `agent:<currentAgent>:main`。
  - 如果您输入 `/session agent:other:main`，您将显式切换到该 Agent Session。
- Session 范围：
  - `per-sender`（默认）：每个 Agent 有多个会话。
  - `global`：TUI 始终使用 `global` 会话（选择器可能为空）。
- 当前 Agent + Session 始终在页脚中可见。

## 发送 + 传递

- 消息发送到 Gateway；默认情况下关闭传递到 Providers。
- 打开传递：
  - `/deliver on`
  - 或设置面板
  - 或使用 `openclaw tui --deliver` 启动

## 选择器 + 覆盖层

- 模型选择器：列出可用模型并设置会话覆盖。
- Agent 选择器：选择不同的 Agent。
- Session 选择器：仅显示当前 Agent 的会话。
- 设置：切换传递、工具输出展开和思考可见性。

## 键盘快捷键

- Enter：发送消息
- Esc：中止活动运行
- Ctrl+C：清除输入（按两次退出）
- Ctrl+D：退出
- Ctrl+L：模型选择器
- Ctrl+G：Agent 选择器
- Ctrl+P：Session 选择器
- Ctrl+O：切换工具输出展开
- Ctrl+T：切换思考可见性（重新加载历史）

## 斜杠命令

核心：

- `/help`
- `/status`
- `/agent <id>`（或 `/agents`）
- `/session <key>`（或 `/sessions`）
- `/model <provider/model>`（或 `/models`）

Session 控制：

- `/think <off|minimal|low|medium|high>`
- `/fast <status|on|off>`
- `/verbose <on|full|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`（别名：`/elev`）
- `/activation <mention|always>`
- `/deliver <on|off>`

Session 生命周期：

- `/new` 或 `/reset`（重置会话）
- `/abort`（中止活动运行）
- `/settings`
- `/exit`

其他 Gateway 斜杠命令（例如 `/context`）转发到 Gateway 并显示为系统输出。参见 [斜杠命令](/tools/slash-commands)。

## 本地 Shell 命令

- 在行前加上 `!` 以在 TUI 主机上运行本地 Shell 命令。
- TUI 每个会话提示一次以允许本地执行；拒绝会使会话的 `!` 保持禁用状态。
- 命令在 TUI 工作目录中的全新、非交互式 Shell 中运行（没有持久的 `cd`/env）。
- 本地 Shell 命令在其环境中接收 `OPENCLAW_SHELL=tui-local`。
- 单独的 `!` 作为普通消息发送；前导空格不触发本地执行。

## 工具输出

- 工具调用显示为带有参数 + 结果的卡片。
- Ctrl+O 在折叠/展开视图之间切换。
- 工具运行时，部分更新流式传输到同一卡片。

## 终端颜色

- TUI 将助手正文文本保持在您终端的默认前景色中，以便深色和浅色终端都保持可读性。
- 如果您的终端使用浅色背景且自动检测不正确，请在启动 `openclaw tui` 前设置 `OPENCLAW_THEME=light`。
- 要强制使用原始深色调色板，请设置 `OPENCLAW_THEME=dark`。

## 历史 + 流式传输

- 连接时，TUI 加载最新历史（默认 200 条消息）。
- 流式响应就地更新直到完成。
- TUI 还监听 Agent 工具事件以获得更丰富的工具卡片。

## 连接详情

- TUI 以 `mode: "tui"` 向 Gateway 注册。
- 重新连接显示系统消息；事件间隙在日志中显示。

## 选项

- `--url <url>`：Gateway WebSocket URL（默认为配置或 `ws://127.0.0.1:<port>`）
- `--token <token>`：Gateway 令牌（如果需要）
- `--password <password>`：Gateway 密码（如果需要）
- `--session <key>`：Session 键（默认：`main`，或范围为 global 时为 `global`）
- `--deliver`：将助手回复传递到 Provider（默认关闭）
- `--thinking <level>`：覆盖发送的思考级别
- `--message <text>`：连接后发送初始消息
- `--timeout-ms <ms>`：Agent 超时（毫秒）（默认为 `agents.defaults.timeoutSeconds`）
- `--history-limit <n>`：要加载的历史条目（默认 200）

注意：当您设置 `--url` 时，TUI 不会回退到配置或环境凭据。明确传递 `--token` 或 `--password`。缺少明确凭据是错误。

## 故障排除

发送消息后无输出：

- 在 TUI 中运行 `/status` 以确认 Gateway 已连接且处于空闲/繁忙状态。
- 检查 Gateway 日志：`openclaw logs --follow`。
- 确认 Agent 可以运行：`openclaw status` 和 `openclaw models status`。
- 如果您期望聊天 Channel 中的消息，请启用传递（`/deliver on` 或 `--deliver`）。

## 连接故障排除

- `disconnected`：确保 Gateway 正在运行，并且您的 `--url/--token/--password` 正确。
- 选择器中没有 Agents：检查 `openclaw agents list` 和您的路由配置。
- Session 选择器为空：您可能处于全局范围或尚未有会话。

## 相关

- [Control UI](/web/control-ui) — 基于 Web 的控制界面
- [CLI 参考](/cli) — 完整 CLI 命令参考
