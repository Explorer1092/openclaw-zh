---
title: "WebChat (macOS 应用)"
sidebarTitle: "WebChat"
mmh3_hash: "fd8c5bb4fe56f1049642755836af580e"
summary: "mac 应用如何嵌入网关 WebChat 以及如何调试它"
read_when: ["调试 mac WebChat 视图或环回端口"]
---
# WebChat (macOS 应用)

macOS 菜单栏应用将 WebChat UI 嵌入为原生 SwiftUI 视图。它连接到网关并默认
为所选代理的 **main session**(其他会话有会话切换器)。

- **本地模式**:直接连接到本地网关 WebSocket。
- **远程模式**:通过 SSH 转发网关控制端口并使用该隧道作为数据平面。

## 启动和调试

- 手动:Lobster 菜单 → "Open Chat"。
- 测试的自动打开:
  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```
- 日志:`./scripts/clawlog.sh`(子系统 `bot.molt`,类别 `WebChatSwiftUI`)。

## 连接方式

- 数据平面:网关 WS 方法 `chat.history`、`chat.send`、`chat.abort`、
  `chat.inject` 和事件 `chat`、`agent`、`presence`、`tick`、`health`。
- 会话:默认为主会话(`main`,或当范围为全局时为 `global`)。UI 可以在会话之间切换。
- 入门使用专用会话,以保持首次运行设置分离。

## 安全表面

- 远程模式仅通过 SSH 转发网关 WebSocket 控制端口。

## 已知限制

- UI 针对聊天会话进行了优化(不是完整的浏览器沙箱)。
