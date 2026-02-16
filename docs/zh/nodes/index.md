---
summary: "节点: 配对、功能、权限以及用于 canvas/camera/screen/system 的 CLI 助手"
read_when:
  - 将 iOS/Android 节点配对到 gateway
  - 使用 node canvas/camera 获取 agent 上下文
  - 添加新的 node 命令或 CLI 助手
title: "节点"
---

# 节点

**node** 是连接到 Gateway **WebSocket** (与操作员相同的端口) 并具有 `role: "node"` 的配套设备 (macOS/iOS/Android/无头), 并通过 `node.invoke` 暴露命令界面 (例如 `canvas.*`, `camera.*`, `system.*`)。协议详情: [Gateway 协议](/gateway/protocol)。

旧版传输: [Bridge 协议](/gateway/bridge-protocol) (TCP JSONL; 当前 node 已弃用/移除)。

macOS 也可以在 **node 模式**下运行: 菜单栏应用连接到 Gateway 的 WS 服务器, 并将其本地 canvas/camera 命令作为 node 暴露 (因此 `openclaw nodes …` 对这台 Mac 有效)。

注意:

- 节点是**外围设备**, 不是 gateway。它们不运行 gateway 服务。
- Telegram/WhatsApp 等消息落在 **gateway** 上, 而不是 node 上。
- 故障排除运行手册: [/nodes/troubleshooting](/nodes/troubleshooting)

## 配对 + 状态

**WS 节点使用设备配对。** 节点在 `connect` 期间出示设备身份; Gateway 为 `role: node` 创建设备配对请求。通过设备 CLI (或 UI) 批准。

快速 CLI:

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

注意:

- 当 node 的设备配对角色包含 `node` 时, `nodes status` 将其标记为**已配对 (paired)**。
- `node.pair.*` (CLI: `openclaw nodes pending/approve/reject`) 是一个独立的 Gateway 拥有的 node 配对存储; 它**不**门控 WS `connect` 握手。

## 远程 node 主机 (system.run)

当您的 Gateway 运行在一台机器上, 而您希望命令在另一台机器上执行时, 使用 **node host**。模型仍然与 **gateway** 对话; 当选择 `host=node` 时, gateway 将 `exec` 调用转发给 **node host**。

### 什么在哪里运行

- **Gateway host**: 接收消息, 运行模型, 路由工具调用。
- **Node host**: 在 node 机器上执行 `system.run`/`system.which`。
- **Approvals**: 通过 `~/.openclaw/exec-approvals.json` 在 node host 上强制执行。

### 启动 node host (前台)

在 node 机器上:

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### 远程 gateway 通过 SSH 隧道 (loopback 绑定)

如果 Gateway 绑定到 loopback (`gateway.bind=loopback`, 本地模式下默认), 远程 node host 无法直接连接。创建一个 SSH 隧道并将 node host 指向隧道的本地端。

示例 (node host -> gateway host):

```bash
# 终端 A (保持运行): 转发本地 18790 -> gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 终端 B: 导出 gateway token 并通过隧道连接
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

注意:

- token 是 gateway 配置中的 `gateway.auth.token` (gateway host 上的 `~/.openclaw/openclaw.json`)。
- `openclaw node run` 读取 `OPENCLAW_GATEWAY_TOKEN` 进行认证。

### 启动 node host (服务)

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node restart
```

### 配对 + 命名

在 gateway host 上:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes list
```

命名选项:

- `openclaw node run` / `openclaw node install` 上的 `--display-name` (持久化在 node 上的 `~/.openclaw/node.json` 中)。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"` (gateway 覆盖)。

### 白名单命令

Exec 批准是**每个 node host** 独立的。从 gateway 添加白名单条目:

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

批准位于 node host 的 `~/.openclaw/exec-approvals.json`。

### 将 exec 指向 node

配置默认值 (gateway 配置):

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或每个会话:

```
/exec host=node security=allowlist node=<id-or-name>
```

一旦设置, 任何带有 `host=node` 的 `exec` 调用都会在 node host 上运行 (受 node 白名单/批准限制)。

相关:

- [Node host CLI](/cli/node)
- [Exec 工具](/tools/exec)
- [Exec 批准](/tools/exec-approvals)

## 调用命令

低级 (原始 RPC):

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

存在更高级别的助手, 用于常见的 "给 agent 一个 MEDIA 附件" 工作流。

## 截图 (canvas 快照)

如果 node 正在显示 Canvas (WebView), `canvas.snapshot` 返回 `{ format, base64 }`。

CLI 助手 (写入临时文件并打印 `MEDIA:<path>`):

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 控制

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

注意:

- `canvas present` 接受 URL 或本地文件路径 (`--target`), 加上用于定位的可选 `--x/--y/--width/--height`。
- `canvas eval` 接受内联 JS (`--js`) 或位置参数。

### A2UI (Canvas)

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

注意:

- 仅支持 A2UI v0.8 JSONL (v0.9/createSurface 被拒绝)。

## 照片 + 视频 (node 相机)

照片 (`jpg`):

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # 默认: 两个摄像头 (2 行 MEDIA)
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

视频片段 (`mp4`):

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

注意:

- node 必须在**前台**才能使用 `canvas.*` 和 `camera.*` (后台调用返回 `NODE_BACKGROUND_UNAVAILABLE`)。
- 片段持续时间有上限 (目前 `<= 60s`), 以避免过大的 base64 载荷。
- Android 会在可能时提示 `CAMERA`/`RECORD_AUDIO` 权限; 被拒绝的权限会失败并返回 `*_PERMISSION_REQUIRED`。

## 屏幕录制 (nodes)

节点暴露 `screen.record` (mp4)。示例:

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

注意:

- `screen.record` 要求 node 应用在前台。
- Android 会在录制前显示系统屏幕捕获提示。
- 屏幕录制上限为 `<= 60s`。
- `--no-audio` 禁用麦克风捕获 (iOS/Android 支持; macOS 使用系统捕获音频)。
- 当有多个屏幕可用时, 使用 `--screen <index>` 选择显示器。

## 位置 (nodes)

当在设置中启用 Location 时, 节点暴露 `location.get`。

CLI 助手:

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

注意:

- Location **默认关闭**。
- "Always" 需要系统权限; 后台获取是尽力而为。
- 响应包括 lat/lon、准确度 (米) 和时间戳。

## SMS (Android nodes)

当用户授予 **SMS** 权限且设备支持电话功能时, Android 节点可以暴露 `sms.send`。

低级调用:

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

注意:

- 在能力被通告之前, 必须在 Android 设备上接受权限提示。
- 没有电话功能的仅 Wi-Fi 设备不会通告 `sms.send`。

## 系统命令 (node host / mac node)

macOS node 暴露 `system.run`, `system.notify` 和 `system.execApprovals.get/set`。
无头 node host 暴露 `system.run`, `system.which` 和 `system.execApprovals.get/set`。

示例:

```bash
openclaw nodes run --node <idOrNameOrIp> -- echo "Hello from mac node"
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
```

注意:

- `system.run` 在载荷中返回 stdout/stderr/退出代码。
- `system.notify` 尊重 macOS 应用上的通知权限状态。
- `system.run` 支持 `--cwd`, `--env KEY=VAL`, `--command-timeout` 和 `--needs-screen-recording`。
- `system.notify` 支持 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- Node host 忽略 `PATH` 覆盖。如果您需要额外的 PATH 条目, 请配置 node host 服务环境 (或在标准位置安装工具), 而不是通过 `--env` 传递 `PATH`。
- 在 macOS node 模式下, `system.run` 受 macOS 应用中的 exec 批准门控 (Settings → Exec approvals)。
  Ask/allowlist/full 的行为与无头 node host 相同; 被拒绝的提示返回 `SYSTEM_RUN_DENIED`。
- 在无头 node host 上, `system.run` 受 exec 批准门控 (`~/.openclaw/exec-approvals.json`)。

## Exec node 绑定

当有多个节点可用时, 您可以将 exec 绑定到特定节点。
这为 `exec host=node` 设置默认节点 (并可以按 agent 覆盖)。

全局默认:

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

按 agent 覆盖:

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

取消设置以允许任何节点:

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 权限映射

节点可能在 `node.list` / `node.describe` 中包含一个 `permissions` 映射, 按权限名称 (例如 `screenRecording`, `accessibility`) 键入, 布尔值 (`true` = 已授予)。

## 无头 node host (跨平台)

OpenClaw 可以运行**无头 node host** (无 UI), 连接到 Gateway WebSocket 并暴露 `system.run` / `system.which`。这在 Linux/Windows 上或在服务器旁边运行最小 node 时很有用。

启动它:

```bash
openclaw node run --host <gateway-host> --port 18789
```

注意:

- 仍需要配对 (Gateway 将显示 node 批准提示)。
- node host 将其 node id、token、显示名称和 gateway 连接信息存储在 `~/.openclaw/node.json` 中。
- Exec 批准通过 `~/.openclaw/exec-approvals.json` 在本地强制执行
  (请参阅 [Exec 批准](/tools/exec-approvals))。
- 在 macOS 上, 无头 node host 在可达时优先使用配套应用 exec host, 如果应用不可用则回退到本地执行。设置 `OPENCLAW_NODE_EXEC_HOST=app` 以要求应用, 或 `OPENCLAW_NODE_EXEC_FALLBACK=0` 以禁用回退。
- 当 Gateway WS 使用 TLS 时, 添加 `--tls` / `--tls-fingerprint`。

## Mac node 模式

- macOS 菜单栏应用作为 node 连接到 Gateway WS 服务器 (因此 `openclaw nodes …` 对这台 Mac 有效)。
- 在远程模式下, 应用为 Gateway 端口打开 SSH 隧道并连接到 `localhost`。
