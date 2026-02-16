---
title: "iOS 应用 (节点)"
sidebarTitle: "iOS"
mmh3_hash: "b32ebedc129284b10412031bbd8c23a1"
summary: "iOS 节点应用:连接到网关、配对、canvas 和故障排除"
read_when: ["配对或重新连接 iOS 节点","从源代码运行 iOS 应用","调试网关发现或 canvas 命令"]
---
# iOS 应用 (节点)

可用性:内部预览。iOS 应用尚未公开分发。

## 它的作用

- 通过 WebSocket(LAN 或 tailnet)连接到网关。
- 公开节点功能:Canvas、屏幕快照、相机捕获、位置、对话模式、语音唤醒。
- 接收 `node.invoke` 命令并报告节点状态事件。

## 要求

- 网关在另一台设备上运行(macOS、Linux 或 Windows via WSL2)。
- 网络路径:
  - 通过 Bonjour 在同一局域网,**或**
  - 通过单播 DNS-SD 在 Tailnet 上(示例域:`openclaw.internal.`),**或**
  - 手动主机/端口(备用方案)。

## 快速开始(配对 + 连接)

1) 启动网关:

```bash
openclaw gateway --port 18789
```

2) 在 iOS 应用中,打开设置并选择一个已发现的网关(或启用手动主机并输入主机/端口)。

3) 在网关主机上批准配对请求:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

4) 验证连接:

```bash
openclaw nodes status
openclaw gateway call node.list --params "{}"
```

## 发现路径

### Bonjour(局域网)

网关在 `local.` 上广播 `_openclaw-gw._tcp`。iOS 应用会自动列出这些。

### Tailnet(跨网络)

如果 mDNS 被阻止,使用单播 DNS-SD 区域(选择一个域;示例:`openclaw.internal.`)和 Tailscale 分割 DNS。
有关 CoreDNS 示例,请参阅 [Bonjour](/gateway/bonjour)。

### 手动主机/端口

在设置中,启用**手动主机**并输入网关主机 + 端口(默认 `18789`)。

## Canvas + A2UI

iOS 节点渲染 WKWebView canvas。使用 `node.invoke` 来驱动它:

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.navigate --params '{"url":"http://<gateway-host>:18789/__openclaw__/canvas/"}'
```

注意:
- 网关 canvas 主机提供 `/__openclaw__/canvas/` 和 `/__openclaw__/a2ui/`。
- 它从网关 HTTP 服务器提供(与 `gateway.port` 相同端口,默认 `18789`)。
- 当广播 canvas 主机 URL 时,iOS 节点在连接时自动导航到 A2UI。
- 使用 `canvas.navigate` 和 `{"url":""}` 返回到内置脚手架。

### Canvas eval / snapshot

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.eval --params '{"javaScript":"(() => { const {ctx} = window.__openclaw; ctx.clearRect(0,0,innerWidth,innerHeight); ctx.lineWidth=6; ctx.strokeStyle="#ff2d55"; ctx.beginPath(); ctx.moveTo(40,40); ctx.lineTo(innerWidth-40, innerHeight-40); ctx.stroke(); return "ok"; })()"}'
```

```bash
openclaw nodes invoke --node "iOS Node" --command canvas.snapshot --params '{"maxWidth":900,"format":"jpeg"}'
```

## 语音唤醒 + 对话模式

- 语音唤醒和对话模式在设置中可用。
- iOS 可能会暂停后台音频;当应用不活跃时,将语音功能视为尽力而为。

## 常见错误

- `NODE_BACKGROUND_UNAVAILABLE`:将 iOS 应用带到前台(canvas/camera/screen 命令需要它)。
- `A2UI_HOST_NOT_CONFIGURED`:网关未广播 canvas 主机 URL;检查[网关配置](/gateway/configuration)中的 `canvasHost`。
- 配对提示从未出现:运行 `openclaw nodes pending` 并手动批准。
- 重新安装后重新连接失败:钥匙串配对令牌已清除;重新配对节点。

## 相关文档

- [配对](/gateway/pairing)
- [发现](/gateway/discovery)
- [Bonjour](/gateway/bonjour)
