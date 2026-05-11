---
title: "Nodes"
mmh3_hash: "a03a3691d9d28fd0576d8eae0e0dc818"
summary: "Node 的配对、功能、权限和 canvas/camera/screen/device/notifications/system 的 CLI 辅助工具"
read_when:
  - 将 iOS/Android Node 配对到 Gateway
  - 将 node canvas/camera 用于 agent 上下文
  - 添加新的 node 命令或 CLI 辅助工具
---

**Node** 是伴侣设备（macOS/iOS/Android/无头），它以 `role: "node"` 连接到 Gateway **WebSocket**（与操作员相同的端口），并通过 `node.invoke` 公开命令界面（例如 `canvas.*`、`camera.*`、`device.*`、`notifications.*`、`system.*`）。协议详情：[Gateway 协议](/gateway/protocol)。

旧版传输：[Bridge 协议](/gateway/bridge-protocol)（TCP JSONL；仅供当前 node 历史参考）。

macOS 也可以以 **node 模式**运行：菜单栏应用连接到 Gateway 的 WS 服务器，并将其本地 canvas/camera 命令作为 node 公开（因此 `openclaw nodes …` 可以针对这台 Mac 使用）。在远程 Gateway 模式下，浏览器自动化由 CLI node 主机（`openclaw node run` 或已安装的 node 服务）处理，而不是由原生应用 node 处理。

说明：

- Node 是**外设**，不是 Gateway。它们不运行 Gateway 服务。
- Telegram/WhatsApp 等消息会落在 **Gateway** 上，而不是 node 上。
- 故障排除手册：[/nodes/troubleshooting](/nodes/troubleshooting)

## 配对 + 状态

**WS node 使用设备配对。** Node 在 `connect` 期间提供设备身份；Gateway 为 `role: node` 创建设备配对请求。通过设备 CLI（或 UI）批准。

快速 CLI：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
```

如果 node 以更改的认证详情（角色/范围/公钥）重试，之前的待处理请求将被取代，并创建新的 `requestId`。批准之前重新运行 `openclaw devices list`。

说明：

- `nodes status` 当设备配对角色包含 `node` 时将 node 标记为**已配对**。
- 设备配对记录是持久的已批准角色合同。令牌轮换保持在该合同内；它不能将已配对的 node 升级为配对批准从未授予的不同角色。
- `node.pair.*`（CLI：`openclaw nodes pending/approve/reject/remove/rename`）是一个独立的 Gateway 拥有的 node 配对存储；它**不**控制 WS `connect` 握手。
- `openclaw nodes remove --node <id|name|ip>` 从该独立的 Gateway 拥有的 node 配对存储中删除过时条目。
- 批准范围遵循待处理请求声明的命令：
  - 无命令请求：`operator.pairing`
  - 非执行 node 命令：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which`：`operator.pairing` + `operator.admin`

## 远程 node 主机（system.run）

当您的 Gateway 在一台机器上运行，而您希望命令在另一台机器上执行时，使用 **node 主机**。模型仍然与 **Gateway** 通信；当选择 `host=node` 时，Gateway 将 `exec` 调用转发给 **node 主机**。

### 各处运行的内容

- **Gateway 主机**：接收消息，运行模型，路由工具调用。
- **Node 主机**：在 node 机器上执行 `system.run`/`system.which`。
- **批准**：通过 `~/.openclaw/exec-approvals.json` 在 node 主机上强制执行。

批准说明：

- 批准支持的 node 运行绑定确切的请求上下文。
- 对于直接 shell/运行时文件执行，OpenClaw 还尽力绑定一个具体的本地文件操作数，并在执行前文件发生更改时拒绝运行。
- 如果 OpenClaw 无法为解释器/运行时命令确定恰好一个具体的本地文件，则拒绝批准支持的执行，而不是假装完整的运行时覆盖。对于更广泛的解释器语义，请使用沙盒、独立主机或明确的受信任允许列表/完整工作流。

### 启动 node 主机（前台）

在 node 机器上：

```bash
openclaw node run --host <gateway-host> --port 18789 --display-name "Build Node"
```

### 通过 SSH 隧道连接远程 Gateway（环回绑定）

如果 Gateway 绑定到环回（`gateway.bind=loopback`，本地模式默认），远程 node 主机无法直接连接。创建 SSH 隧道并将 node 主机指向隧道的本地端。

示例（node 主机 -> Gateway 主机）：

```bash
# 终端 A（保持运行）：将本地 18790 转发到 gateway 127.0.0.1:18789
ssh -N -L 18790:127.0.0.1:18789 user@gateway-host

# 终端 B：导出 Gateway 令牌并通过隧道连接
export OPENCLAW_GATEWAY_TOKEN="<gateway-token>"
openclaw node run --host 127.0.0.1 --port 18790 --display-name "Build Node"
```

说明：

- `openclaw node run` 支持令牌或密码认证。
- 首选环境变量：`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`。
- 配置回退：`gateway.auth.token` / `gateway.auth.password`。
- 在本地模式下，node 主机有意忽略 `gateway.remote.token` / `gateway.remote.password`。
- 在远程模式下，`gateway.remote.token` / `gateway.remote.password` 按远程优先级规则适用。
- 如果活动的本地 `gateway.auth.*` SecretRef 已配置但未解析，node 主机认证会失败关闭。
- Node 主机认证解析只接受 `OPENCLAW_GATEWAY_*` 环境变量。

### 启动 node 主机（服务）

```bash
openclaw node install --host <gateway-host> --port 18789 --display-name "Build Node"
openclaw node start
openclaw node restart
```

### 配对 + 命名

在 Gateway 主机上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw nodes status
```

如果 node 以更改的认证详情重试，请重新运行 `openclaw devices list` 并批准当前的 `requestId`。

命名选项：

- `openclaw node run` / `openclaw node install` 上的 `--display-name`（持久存储在 node 上的 `~/.openclaw/node.json` 中）。
- `openclaw nodes rename --node <id|name|ip> --name "Build Node"`（Gateway 覆盖）。

### 将命令加入允许列表

执行批准是**每个 node 主机**的。从 Gateway 添加允许列表条目：

```bash
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/uname"
openclaw approvals allowlist add --node <id|name|ip> "/usr/bin/sw_vers"
```

批准存储在 node 主机上的 `~/.openclaw/exec-approvals.json` 中。

### 将执行指向 node

配置默认值（Gateway 配置）：

```bash
openclaw config set tools.exec.host node
openclaw config set tools.exec.security allowlist
openclaw config set tools.exec.node "<id-or-name>"
```

或每个会话：

```
/exec host=node security=allowlist node=<id-or-name>
```

设置后，任何带有 `host=node` 的 `exec` 调用都会在 node 主机上运行（受 node 允许列表/批准约束）。

`host=auto` 不会自行隐式选择 node，但来自 `auto` 的显式每次调用 `host=node` 请求是允许的。如果您希望 node 执行成为会话的默认值，请明确设置 `tools.exec.host=node` 或 `/exec host=node ...`。

相关：

- [Node 主机 CLI](/cli/node)
- [Exec 工具](/tools/exec)
- [Exec 批准](/tools/exec-approvals)

## 调用命令

低级（原始 RPC）：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command canvas.eval --params '{"javaScript":"location.href"}'
```

常见的"给 agent 一个 MEDIA 附件"工作流存在更高级别的辅助工具。

## 命令策略

Node 命令在被调用之前必须通过两个门控：

1. Node 必须在其 WebSocket `connect.commands` 列表中声明该命令。
2. Gateway 的平台策略必须允许声明的命令。

Windows 和 macOS 伴侣 node 默认允许安全声明的命令，如 `canvas.*`、`camera.list`、`location.get` 和 `screen.snapshot`。声明了 `talk` 能力或 `talk.*` 命令的受信任 node 也默认允许声明的推送对讲命令（`talk.ptt.start`、`talk.ptt.stop`、`talk.ptt.cancel`、`talk.ptt.once`），与平台标签无关。危险或涉及隐私的命令如 `camera.snap`、`camera.clip` 和 `screen.record` 仍需要使用 `gateway.nodes.allowCommands` 明确启用。`gateway.nodes.denyCommands` 总是覆盖默认值和额外的允许列表条目。

插件拥有的 node 命令可以添加 Gateway node 调用策略。该策略在允许列表检查之后、转发到 node 之前运行，因此原始 `node.invoke`、CLI 辅助工具和专用 agent 工具共享相同的插件权限边界。危险的插件 node 命令仍需要明确的 `gateway.nodes.allowCommands` 启用。

Node 更改其声明的命令列表后，拒绝旧的设备配对并批准新请求，以便 Gateway 存储更新的命令快照。

## 截图（canvas 快照）

如果 node 显示 Canvas（WebView），`canvas.snapshot` 返回 `{ format, base64 }`。

CLI 辅助工具（写入临时文件并打印 `MEDIA:<path>`）：

```bash
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format png
openclaw nodes canvas snapshot --node <idOrNameOrIp> --format jpg --max-width 1200 --quality 0.9
```

### Canvas 控件

```bash
openclaw nodes canvas present --node <idOrNameOrIp> --target https://example.com
openclaw nodes canvas hide --node <idOrNameOrIp>
openclaw nodes canvas navigate https://example.com --node <idOrNameOrIp>
openclaw nodes canvas eval --node <idOrNameOrIp> --js "document.title"
```

说明：

- `canvas present` 接受 URL 或本地文件路径（`--target`），加上用于定位的可选 `--x/--y/--width/--height`。
- `canvas eval` 接受内联 JS（`--js`）或位置参数。

### A2UI（Canvas）

```bash
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --text "Hello"
openclaw nodes canvas a2ui push --node <idOrNameOrIp> --jsonl ./payload.jsonl
openclaw nodes canvas a2ui reset --node <idOrNameOrIp>
```

说明：

- 只支持 A2UI v0.8 JSONL（v0.9/createSurface 被拒绝）。

## 照片 + 视频（node 相机）

照片（`jpg`）：

```bash
openclaw nodes camera list --node <idOrNameOrIp>
openclaw nodes camera snap --node <idOrNameOrIp>            # 默认：两个方向（2 个 MEDIA 行）
openclaw nodes camera snap --node <idOrNameOrIp> --facing front
```

视频片段（`mp4`）：

```bash
openclaw nodes camera clip --node <idOrNameOrIp> --duration 10s
openclaw nodes camera clip --node <idOrNameOrIp> --duration 3000 --no-audio
```

说明：

- Node 必须处于**前台**才能使用 `canvas.*` 和 `camera.*`（后台调用返回 `NODE_BACKGROUND_UNAVAILABLE`）。
- 片段时长有上限（当前 `<= 60s`）以避免 base64 负载过大。
- Android 在可能时会提示获取 `CAMERA`/`RECORD_AUDIO` 权限；被拒绝的权限会以 `*_PERMISSION_REQUIRED` 失败。

## 屏幕录制（nodes）

支持的 node 公开 `screen.record`（mp4）。示例：

```bash
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10
openclaw nodes screen record --node <idOrNameOrIp> --duration 10s --fps 10 --no-audio
```

说明：

- `screen.record` 的可用性取决于 node 平台。
- 屏幕录制限制为 `<= 60s`。
- `--no-audio` 在支持的平台上禁用麦克风捕获。
- 使用 `--screen <index>` 在多屏幕可用时选择显示器。

## 位置（nodes）

当位置在设置中启用时，Node 公开 `location.get`。

CLI 辅助工具：

```bash
openclaw nodes location get --node <idOrNameOrIp>
openclaw nodes location get --node <idOrNameOrIp> --accuracy precise --max-age 15000 --location-timeout 10000
```

说明：

- 位置**默认关闭**。
- "始终"需要系统权限；后台获取是尽力而为的。
- 响应包括纬度/经度、精度（米）和时间戳。

## SMS（Android nodes）

当用户授予 **SMS** 权限且设备支持电话功能时，Android node 可以公开 `sms.send`。

低级调用：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command sms.send --params '{"to":"+15555550123","message":"Hello from OpenClaw"}'
```

说明：

- 在能力被公开之前，必须在 Android 设备上接受权限提示。
- 仅 Wi-Fi 且没有电话功能的设备不会公开 `sms.send`。

## Android 设备 + 个人数据命令

当启用相应功能时，Android node 可以公开其他命令族。

可用族：

- `device.status`、`device.info`、`device.permissions`、`device.health`
- `notifications.list`、`notifications.actions`
- `photos.latest`
- `contacts.search`、`contacts.add`
- `calendar.events`、`calendar.add`
- `callLog.search`
- `sms.search`
- `motion.activity`、`motion.pedometer`

调用示例：

```bash
openclaw nodes invoke --node <idOrNameOrIp> --command device.status --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command notifications.list --params '{}'
openclaw nodes invoke --node <idOrNameOrIp> --command photos.latest --params '{"limit":1}'
```

说明：

- 运动命令受可用传感器的能力限制。

## 系统命令（node 主机 / mac node）

macOS node 公开 `system.run`、`system.notify` 和 `system.execApprovals.get/set`。
无头 node 主机公开 `system.run`、`system.which` 和 `system.execApprovals.get/set`。

示例：

```bash
openclaw nodes notify --node <idOrNameOrIp> --title "Ping" --body "Gateway ready"
openclaw nodes invoke --node <idOrNameOrIp> --command system.which --params '{"name":"git"}'
```

说明：

- `system.run` 在负载中返回标准输出/标准错误/退出码。
- Shell 执行现在通过带 `host=node` 的 `exec` 工具进行；`nodes` 仍然是明确 node 命令的直接 RPC 界面。
- `nodes invoke` 不公开 `system.run` 或 `system.run.prepare`；这些仅保留在执行路径上。
- 执行路径在批准之前准备规范的 `systemRunPlan`。一旦批准被授予，Gateway 转发该存储的计划，而不是任何后来调用者编辑的命令/cwd/会话字段。
- `system.notify` 在 macOS 应用上遵循通知权限状态。
- 未知的 node `platform` / `deviceFamily` 元数据使用保守的默认允许列表，排除 `system.run` 和 `system.which`。如果您有意需要这些命令用于未知平台，请通过 `gateway.nodes.allowCommands` 明确添加它们。
- `system.run` 支持 `--cwd`、`--env KEY=VAL`、`--command-timeout` 和 `--needs-screen-recording`。
- 对于 shell 包装器（`bash|sh|zsh ... -c/-lc`），请求范围的 `--env` 值被减少为明确的允许列表（`TERM`、`LANG`、`LC_*`、`COLORTERM`、`NO_COLOR`、`FORCE_COLOR`）。
- 对于允许列表模式中的始终允许决策，已知的调度包装器（`env`、`nice`、`nohup`、`stdbuf`、`timeout`）持久化内部可执行文件路径而不是包装器路径。如果解包不安全，则不会自动持久化任何允许列表条目。
- 在允许列表模式的 Windows node 主机上，通过 `cmd.exe /c` 的 shell 包装运行需要批准（仅允许列表条目不会自动允许包装形式）。
- `system.notify` 支持 `--priority <passive|active|timeSensitive>` 和 `--delivery <system|overlay|auto>`。
- Node 主机忽略 `PATH` 覆盖并剥离危险的启动/shell 键（`DYLD_*`、`LD_*`、`NODE_OPTIONS`、`PYTHON*`、`PERL*`、`RUBYOPT`、`SHELLOPTS`、`PS4`）。如果您需要额外的 PATH 条目，请配置 node 主机服务环境（或将工具安装在标准位置），而不是通过 `--env` 传递 `PATH`。
- 在 macOS node 模式下，`system.run` 受 macOS 应用中执行批准的限制（设置 → 执行批准）。询问/允许列表/完整行为与无头 node 主机相同；被拒绝的提示返回 `SYSTEM_RUN_DENIED`。
- 在无头 node 主机上，`system.run` 受执行批准的限制（`~/.openclaw/exec-approvals.json`）。

## Exec node 绑定

当有多个 node 可用时，您可以将 exec 绑定到特定的 node。这设置了 `exec host=node` 的默认 node（并且可以按 agent 覆盖）。

全局默认：

```bash
openclaw config set tools.exec.node "node-id-or-name"
```

每个 agent 覆盖：

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

取消设置以允许任何 node：

```bash
openclaw config unset tools.exec.node
openclaw config unset agents.list[0].tools.exec.node
```

## 权限映射

Node 可以在 `node.list` / `node.describe` 中包含 `permissions` 映射，以权限名称（例如 `screenRecording`、`accessibility`）为键，以布尔值（`true` = 已授予）为值。

## 无头 node 主机（跨平台）

OpenClaw 可以运行**无头 node 主机**（无 UI），连接到 Gateway WebSocket 并公开 `system.run` / `system.which`。这在 Linux/Windows 上或在服务器旁边运行最小化 node 时很有用。

启动它：

```bash
openclaw node run --host <gateway-host> --port 18789
```

说明：

- 仍然需要配对（Gateway 将显示设备配对提示）。
- Node 主机将其 node id、令牌、显示名称和 Gateway 连接信息存储在 `~/.openclaw/node.json` 中。
- 执行批准通过 `~/.openclaw/exec-approvals.json` 在本地强制执行（参见 [执行批准](/tools/exec-approvals)）。
- 在 macOS 上，无头 node 主机默认在本地执行 `system.run`。设置 `OPENCLAW_NODE_EXEC_HOST=app` 通过配套应用执行主机路由 `system.run`；添加 `OPENCLAW_NODE_EXEC_FALLBACK=0` 以要求应用主机并在不可用时失败关闭。
- 当 Gateway WS 使用 TLS 时，添加 `--tls` / `--tls-fingerprint`。

## Mac node 模式

- macOS 菜单栏应用以 node 身份连接到 Gateway WS 服务器（因此 `openclaw nodes …` 可以针对这台 Mac 使用）。
- 在远程模式下，应用为 Gateway 端口打开 SSH 隧道并连接到 `localhost`。
