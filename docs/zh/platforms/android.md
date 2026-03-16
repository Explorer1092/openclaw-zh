---
mmh3_hash: "42aa7b4421af209a5dd630a88a58b275"
title: "Android 应用 (节点)"
summary: "Android 应用（节点）：连接手册 + Connect/Chat/Voice/Canvas 命令接口"
read_when:
  - 配对或重新连接 Android 节点
  - 调试 Android gateway 发现或 auth
  - 验证跨客户端的聊天历史一致性
---

# Android 应用（节点）

> **注意：** Android 应用尚未公开发布。源代码在 [OpenClaw 仓库](https://github.com/openclaw/openclaw) 的 `apps/android` 下可用。你可以使用 Java 17 和 Android SDK 自行构建（`./gradlew :app:assembleDebug`）。构建说明见 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)。

## 支持快照

- 角色：伴侣节点应用（Android 不托管 Gateway）。
- 需要 Gateway：是（在 macOS、Linux 或 Windows 通过 WSL2 运行）。
- 安装：[入门](/start/getting-started) + [配对](/channels/pairing)。
- Gateway：[手册](/gateway) + [配置](/gateway/configuration)。
  - 协议：[Gateway 协议](/gateway/protocol)（节点 + 控制平面）。

## 系统控制

系统控制（launchd/systemd）位于 Gateway 主机上。参见 [Gateway](/gateway)。

## 连接手册

Android 节点应用 ⇄ （mDNS/NSD + WebSocket）⇄ **Gateway**

Android 直接连接到 Gateway WebSocket（默认 `ws://<host>:18789`）并使用设备配对（`role: node`）。

### 先决条件

- 你可以在"主"机器上运行 Gateway。
- Android 设备/模拟器可以到达 gateway WebSocket：
  - 同一局域网通过 mDNS/NSD，**或**
  - 通过广域 Bonjour / unicast DNS-SD 连接同一 Tailscale tailnet（见下文），**或**
  - 手动 gateway 主机/端口（备用）
- 你可以在 gateway 机器上运行 CLI（`openclaw`）（或通过 SSH）。

### 1) 启动 Gateway

```bash
openclaw gateway --port 18789 --verbose
```

在日志中确认你看到类似这样的内容：

- `listening on ws://0.0.0.0:18789`

对于仅 tailnet 设置（推荐用于 Vienna ⇄ London），将 gateway 绑定到 tailnet IP：

- 在 gateway 主机上的 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`。
- 重启 Gateway / macOS menubar 应用。

### 2) 验证发现（可选）

从 gateway 机器：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多调试说明：[Bonjour](/gateway/bonjour)。

#### Tailnet（Vienna ⇄ London）通过 unicast DNS-SD 发现

Android NSD/mDNS 发现不会跨网络。如果你的 Android 节点和 gateway 在不同网络上但通过 Tailscale 连接，请改用广域 Bonjour / unicast DNS-SD：

1. 在 gateway 主机上设置 DNS-SD 区域（示例 `openclaw.internal.`）并发布 `_openclaw-gw._tcp` 记录。
2. 为你选择的域名配置 Tailscale 分割 DNS，指向该 DNS 服务器。

详情和 CoreDNS 示例配置：[Bonjour](/gateway/bonjour)。

### 3) 从 Android 连接

在 Android 应用中：

- 应用通过**前台服务**（持久通知）保持 gateway 连接存活。
- 打开 **Connect** 选项卡。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果发现被阻止，在 **Advanced controls** 中使用手动主机/端口（以及需要时的 TLS/token/密码）。

首次成功配对后，Android 在启动时自动重新连接：

- 手动端点（如果启用），否则
- 最后发现的 gateway（尽力而为）。

### 4) 批准配对（CLI）

在 gateway 机器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配对详情：[配对](/channels/pairing)。

### 5) 验证节点已连接

- 通过节点状态：

  ```bash
  openclaw nodes status
  ```

- 通过 Gateway：

  ```bash
  openclaw gateway call node.list --params "{}"
  ```

### 6) 聊天 + 历史记录

Android Chat 选项卡支持 session 选择（默认 `main`，加上其他现有 sessions）：

- 历史记录：`chat.history`
- 发送：`chat.send`
- 推送更新（尽力而为）：`chat.subscribe` → `event:"chat"`

### 7) Canvas + 摄像头

#### Gateway Canvas Host（推荐用于 web 内容）

如果你想让节点显示 agent 可以在磁盘上编辑的真实 HTML/CSS/JS，将节点指向 Gateway canvas host。

注意：节点从 Gateway HTTP 服务器（与 `gateway.port` 相同端口，默认 `18789`）加载 canvas。

1. 在 gateway 主机上创建 `~/.openclaw/workspace/canvas/index.html`。

2. 将节点导航到它（局域网）：

```bash
openclaw nodes invoke --node "<Android Node>" --command canvas.navigate --params '{"url":"http://<gateway-hostname>.local:18789/__openclaw__/canvas/"}'
```

Tailnet（可选）：如果两台设备都在 Tailscale 上，使用 MagicDNS 名称或 tailnet IP 而不是 `.local`，例如 `http://<gateway-magicdns>:18789/__openclaw__/canvas/`。

此服务器将实时重载客户端注入 HTML 并在文件更改时重载。
A2UI host 位于 `http://<gateway-host>:18789/__openclaw__/a2ui/`。

Canvas 命令（仅前台）：

- `canvas.eval`、`canvas.snapshot`、`canvas.navigate`（使用 `{"url":""}` 或 `{"url":"/"}` 返回默认脚手架）。`canvas.snapshot` 返回 `{ format, base64 }`（默认 `format="jpeg"`）。
- A2UI：`canvas.a2ui.push`、`canvas.a2ui.reset`（`canvas.a2ui.pushJSONL` 旧版别名）

摄像头命令（仅前台；权限门控）：

- `camera.snap`（jpg）
- `camera.clip`（mp4）

参见 [Camera 节点](/nodes/camera) 了解参数和 CLI helpers。

### 8) Voice + 扩展 Android 命令接口

- Voice：Android 在 Voice 选项卡中使用单一麦克风开/关流程，带转录捕获和 TTS 播放（配置时使用 ElevenLabs，系统 TTS 备用）。当应用离开前台时 Voice 停止。
- Voice wake/talk-mode 切换目前已从 Android UX/运行时中删除。
- 其他 Android 命令系列（可用性取决于设备 + 权限）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions`
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `motion.activity`、`motion.pedometer`
