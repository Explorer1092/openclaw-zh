---
mmh3_hash: "a0db3ad2d64029816ffa70c352878cc0"
title: "Android 应用 (节点)"
summary: "Android 应用（节点）：连接手册 + Connect/Chat/Voice/Canvas 命令接口"
read_when:
  - 配对或重新连接 Android 节点
  - 调试 Android gateway 发现或 auth
  - 验证跨客户端的聊天历史一致性
---

<Note>
官方 Android 应用已在 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN) 上架。它是一个伴侣节点，需要一个正在运行的 OpenClaw Gateway。源代码也可在 [OpenClaw 仓库](https://github.com/openclaw/openclaw) 的 `apps/android` 下获取；构建说明见 [apps/android/README.md](https://github.com/openclaw/openclaw/blob/main/apps/android/README.md)。
</Note>

## 支持快照

- 角色：伴侣节点应用（Android 不托管 Gateway）。
- 需要 Gateway：是（在 macOS、Linux 或 Windows 通过 WSL2 运行）。
- 安装：应用请访问 [Google Play](https://play.google.com/store/apps/details?id=ai.openclaw.app&hl=en_IN)，Gateway 请参阅[入门](/start/getting-started)，然后[配对](/channels/pairing)。
- Gateway：[手册](/gateway) + [配置](/gateway/configuration)。
  - 协议：[Gateway 协议](/gateway/protocol)（节点 + 控制平面）。

## 系统控制

系统控制（launchd/systemd）位于 Gateway 主机上。参见 [Gateway](/gateway)。

## 连接手册

Android 节点应用 ⇄ （mDNS/NSD + WebSocket）⇄ **Gateway**

Android 直接连接到 Gateway WebSocket 并使用设备配对（`role: node`）。

对于 Tailscale 或公共主机，Android 需要一个安全端点：

- 首选：Tailscale Serve / Funnel，使用 `https://<magicdns>` / `wss://<magicdns>`
- 也支持：任何其他带有真实 TLS 端点的 `wss://` Gateway URL
- 明文 `ws://` 在私有局域网地址 / `.local` 主机、`localhost`、`127.0.0.1` 以及 Android 模拟器桥接（`10.0.2.2`）上仍然支持

### 先决条件

- 你可以在"主"机器上运行 Gateway。
- Android 设备/模拟器可以到达 gateway WebSocket：
  - 同一局域网通过 mDNS/NSD，**或**
  - 通过广域 Bonjour / unicast DNS-SD 连接同一 Tailscale tailnet（见下文），**或**
  - 手动 gateway 主机/端口（备用）
- Tailnet/公共移动配对**不使用**原始 tailnet IP `ws://` 端点。请改用 Tailscale Serve 或其他 `wss://` URL。
- 你可以在 gateway 机器上运行 CLI（`openclaw`）（或通过 SSH）。

### 1) 启动 Gateway

```bash
openclaw gateway --port 18789 --verbose
```

在日志中确认你看到类似这样的内容：

- `listening on ws://0.0.0.0:18789`

对于通过 Tailscale 进行远程 Android 访问，优先使用 Serve/Funnel 而不是原始 tailnet 绑定：

```bash
openclaw gateway --tailscale serve
```

这给 Android 提供一个安全的 `wss://` / `https://` 端点。纯 `gateway.bind: "tailnet"` 设置不足以进行首次远程 Android 配对，除非你也单独终止 TLS。

### 2) 验证发现（可选）

从 gateway 机器：

```bash
dns-sd -B _openclaw-gw._tcp local.
```

更多调试说明：[Bonjour](/gateway/bonjour)。

如果你也配置了广域发现域，与以下命令进行比较：

```bash
openclaw gateway discover --json
```

这会在一次扫描中显示 `local.` 加上已配置的广域域，并使用解析的服务端点而非仅 TXT 提示。

#### Tailnet（Vienna ⇄ London）通过 unicast DNS-SD 发现

Android NSD/mDNS 发现不会跨网络。如果你的 Android 节点和 gateway 在不同网络上但通过 Tailscale 连接，请改用广域 Bonjour / unicast DNS-SD：

仅发现本身对于 tailnet/公共 Android 配对是不够的。发现的路由仍需要一个安全端点（`wss://` 或 Tailscale Serve）：

1. 在 gateway 主机上设置 DNS-SD 区域（示例 `openclaw.internal.`）并发布 `_openclaw-gw._tcp` 记录。
2. 为你选择的域名配置 Tailscale 分割 DNS，指向该 DNS 服务器。

详情和 CoreDNS 示例配置：[Bonjour](/gateway/bonjour)。

### 3) 从 Android 连接

在 Android 应用中：

- 应用通过**前台服务**（持久通知）保持 gateway 连接存活。
- 打开 **Connect** 选项卡。
- 使用 **Setup Code** 或 **Manual** 模式。
- 如果发现被阻止，在 **Advanced controls** 中使用手动主机/端口。对于私有局域网主机，`ws://` 仍然有效。对于 Tailscale/公共主机，开启 TLS 并使用 `wss://` / Tailscale Serve 端点。

首次成功配对后，Android 在启动时自动重新连接：

- 手动端点（如果启用），否则
- 最后发现的 gateway（尽力而为）。

### 在线信标

经认证的节点 session 连接后，以及当应用在前台服务仍处于连接状态时移至后台，Android 会调用 `node.event`，传入 `event: "node.presence.alive"`。只有在已知认证节点设备身份后，gateway 才会将此记录为配对节点/设备元数据上的 `lastSeenAtMs`/`lastSeenReason`。

只有当 gateway 响应包含 `handled: true` 时，应用才将信标视为已成功记录。旧版 gateway 可能以 `{ "ok": true }` 确认 `node.event`；该响应兼容，但不计为持久的最后在线更新。

### 4) 批准配对（CLI）

在 gateway 机器上：

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

配对详情：[配对](/channels/pairing)。

可选：如果 Android 节点始终从严格控制的子网连接，你可以通过明确的 CIDR 或精确 IP 选择加入首次节点自动批准：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

此选项默认禁用。仅适用于没有请求 scope 的全新 `role: node` 配对。Operator/browser 配对以及任何 role、scope、元数据或公钥更改仍需要手动批准。

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

- 历史记录：`chat.history`（显示标准化；内联指令标签从可见文本中剥离，纯文本工具调用 XML 载荷（包括 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>`、`<function_calls>...</function_calls>` 以及截断的工具调用块）和泄露的 ASCII/全角模型控制令牌被剥离，纯静默令牌助手行（如精确的 `NO_REPLY` / `no_reply`）被省略，超大行可以用占位符替换）
- 发送：`chat.send`
- 推送更新（尽力而为）：`chat.subscribe` → `event:"chat"`

### 7) Canvas + 摄像头

#### Gateway Canvas Host（推荐用于 web 内容）

如果你想让节点显示 agent 可以在磁盘上编辑的真实 HTML/CSS/JS，将节点指向 Gateway canvas host。

<Note>
节点从 Gateway HTTP 服务器（与 `gateway.port` 相同端口，默认 `18789`）加载 canvas。
</Note>

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

- Voice 选项卡：Android 有两种明确的捕获模式。**Mic** 是手动 Voice 选项卡 session，将每次停顿作为聊天轮发送，当应用离开前台或用户离开 Voice 选项卡时停止。**Talk** 是持续 Talk 模式，持续监听直到关闭或节点断开连接。
- Talk 模式在捕获开始前将现有前台服务从 `dataSync` 提升为 `dataSync|microphone`，Talk 模式停止时再降级。Android 14+ 需要 `FOREGROUND_SERVICE_MICROPHONE` 声明、`RECORD_AUDIO` 运行时授权以及运行时的麦克风服务类型。
- 语音回复通过已配置的 gateway Talk provider 使用 `talk.speak`。仅当 `talk.speak` 不可用时才使用本地系统 TTS。
- Voice wake 在 Android UX/运行时中保持禁用。
- 其他 Android 命令系列（可用性取决于设备 + 权限）：
  - `device.status`、`device.info`、`device.permissions`、`device.health`
  - `notifications.list`、`notifications.actions`（参见下方[通知转发](#通知转发)）
  - `photos.latest`
  - `contacts.search`、`contacts.add`
  - `calendar.events`、`calendar.add`
  - `callLog.search`
  - `sms.search`
  - `motion.activity`、`motion.pedometer`

## 助手入口

Android 支持从系统助手触发器（Google Assistant）启动 OpenClaw。配置后，按住主页按钮或说"Hey Google，问 OpenClaw..."会打开应用并将提示传入聊天输入框。

这使用在应用清单中声明的 Android **App Actions** 元数据。gateway 端不需要额外配置——助手意图完全由 Android 应用处理，并作为普通聊天消息转发。

<Note>
App Actions 可用性取决于设备、Google Play Services 版本，以及用户是否将 OpenClaw 设置为默认助手应用。
</Note>

## 通知转发

Android 可以将设备通知作为事件转发到 gateway。多个控件允许你限定转发哪些通知以及何时转发。

| 键                               | 类型           | 描述                                                                                        |
| -------------------------------- | -------------- | ------------------------------------------------------------------------------------------- |
| `notifications.allowPackages`    | string[]       | 仅转发来自这些包名的通知。如果设置，所有其他包将被忽略。                                    |
| `notifications.denyPackages`     | string[]       | 永不转发来自这些包名的通知。在 `allowPackages` 之后应用。                                   |
| `notifications.quietHours.start` | string (HH:mm) | 安静时段开始时间（设备本地时间）。在此窗口期间通知被抑制。                                  |
| `notifications.quietHours.end`   | string (HH:mm) | 安静时段结束时间。                                                                          |
| `notifications.rateLimit`        | number         | 每个包每分钟的最大转发通知数。超出的通知将被丢弃。                                          |

通知选择器还对转发的通知事件使用更安全的行为，防止意外转发敏感系统通知。

示例配置：

```json5
{
  notifications: {
    allowPackages: ["com.slack", "com.whatsapp"],
    denyPackages: ["com.android.systemui"],
    quietHours: {
      start: "22:00",
      end: "07:00",
    },
    rateLimit: 5,
  },
}
```

<Note>
通知转发需要 Android 通知监听器权限。应用在设置期间会提示授予此权限。
</Note>

## 相关文档

- [iOS 应用](/platforms/ios)
- [节点](/nodes)
- [Android 节点故障排除](/nodes/troubleshooting)
