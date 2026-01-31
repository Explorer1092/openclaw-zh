---
title: "TUI (终端界面)"
sidebarTitle: "TUI"
mmh3_hash: "b80aa67c5e030c09e7327b047b4ff551"
summary: "终端 UI (TUI):从任何机器连接到网关"
read_when: ["您想要 TUI 的初学者友好演练","您需要 TUI 功能、命令和快捷键的完整列表"]
---
# TUI (终端界面)

## 快速入门
1) 启动网关。
```bash
openclaw gateway
```
2) 打开 TUI。
```bash
openclaw tui
```
3) 输入消息并按 Enter。

远程网关:
```bash
openclaw tui --url ws://<host>:<port> --token <gateway-token>
```
如果您的网关使用密码身份验证,请使用 `--password`。

## 您看到的内容
- 标题:连接 URL、当前代理、当前会话。
- 聊天日志:用户消息、助手回复、系统通知、工具卡片。
- 状态行:连接/运行状态(连接中、运行中、流式传输、空闲、错误)。
- 页脚:连接状态 + 代理 + 会话 + 模型 + 思考/详细/推理 + 令牌计数 + 传递。
- 输入:带自动完成的文本编辑器。

## 心智模型:代理 + 会话
- 代理是唯一的缩写(例如 `main`、`research`)。网关公开列表。
- 会话属于当前代理。
- 会话键存储为 `agent:<agentId>:<sessionKey>`。
  - 如果您输入 `/session main`,TUI 会将其扩展为 `agent:<currentAgent>:main`。
  - 如果您输入 `/session agent:other:main`,您会显式切换到该代理会话。
- 会话范围:
  - `per-sender`(默认):每个代理有许多会话。
  - `global`:TUI 始终使用 `global` 会话(选择器可能为空)。
- 当前代理 + 会话始终在页脚中可见。

## 发送 + 传递
- 消息发送到网关;默认情况下,向提供程序传递是关闭的。
- 打开传递:
  - `/deliver on`
  - 或设置面板
  - 或使用 `openclaw tui --deliver` 启动

## 选择器 + 覆盖层
- 模型选择器:列出可用模型并设置会话覆盖。
- 代理选择器:选择不同的代理。
- 会话选择器:仅显示当前代理的会话。
- 设置:切换传递、工具输出扩展和思考可见性。

## 键盘快捷键
- Enter:发送消息
- Esc:中止活动运行
- Ctrl+C:清除输入(按两次退出)
- Ctrl+D:退出
- Ctrl+L:模型选择器
- Ctrl+G:代理选择器
- Ctrl+P:会话选择器
- Ctrl+O:切换工具输出扩展
- Ctrl+T:切换思考可见性(重新加载历史)

## 斜杠命令
核心:
- `/help`
- `/status`
- `/agent <id>`(或 `/agents`)
- `/session <key>`(或 `/sessions`)
- `/model <provider/model>`(或 `/models`)

会话控制:
- `/think <off|minimal|low|medium|high>`
- `/verbose <on|full|off>`
- `/reasoning <on|off|stream>`
- `/usage <off|tokens|full>`
- `/elevated <on|off|ask|full>`(别名:`/elev`)
- `/activation <mention|always>`
- `/deliver <on|off>`

会话生命周期:
- `/new` 或 `/reset`(重置会话)
- `/abort`(中止活动运行)
- `/settings`
- `/exit`

其他网关斜杠命令(例如,`/context`)被转发到网关并显示为系统输出。请参阅[斜杠命令](/tools/slash-commands)。

## 本地 shell 命令
- 以 `!` 为前缀的行在 TUI 主机上运行本地 shell 命令。
- TUI 每个会话提示一次以允许本地执行;拒绝会使 `!` 在会话中禁用。
- 命令在 TUI 工作目录中的全新、非交互式 shell 中运行(无持久 `cd`/env)。
- 单独的 `!` 作为正常消息发送;前导空格不会触发本地执行。

## 工具输出
- 工具调用显示为带有参数 + 结果的卡片。
- Ctrl+O 在折叠/展开视图之间切换。
- 在工具运行时,部分更新流入同一张卡片。

## 历史 + 流式传输
- 连接时,TUI 加载最新历史(默认 200 条消息)。
- 流式响应在最终确定之前就地更新。
- TUI 还监听代理工具事件以获得更丰富的工具卡片。

## 连接详细信息
- TUI 以 `mode: "tui"` 向网关注册。
- 重新连接显示系统消息;事件间隙在日志中显示。

## 选项
- `--url <url>`:网关 WebSocket URL(默认为配置或 `ws://127.0.0.1:<port>`)
- `--token <token>`:网关令牌(如果需要)
- `--password <password>`:网关密码(如果需要)
- `--session <key>`:会话键(默认:`main`,或当范围为 global 时为 `global`)
- `--deliver`:将助手回复传递给提供程序(默认关闭)
- `--thinking <level>`:覆盖发送的思考级别
- `--timeout-ms <ms>`:代理超时(毫秒)(默认为 `agents.defaults.timeoutSeconds`)

## 故障排除

发送消息后无输出:
- 在 TUI 中运行 `/status` 以确认网关已连接并处于空闲/忙碌状态。
- 检查网关日志:`openclaw logs --follow`。
- 确认代理可以运行:`openclaw status` 和 `openclaw models status`。
- 如果您期望在聊天通道中接收消息,请启用传递(`/deliver on` 或 `--deliver`)。
- `--history-limit <n>`:要加载的历史条目(默认 200)

## 故障排除
- `disconnected`:确保网关正在运行,并且您的 `--url/--token/--password` 正确。
- 选择器中没有代理:检查 `openclaw agents list` 和您的路由配置。
- 会话选择器为空:您可能处于全局范围或尚无会话。
