---
title: "WebChat (网关 WebSocket 界面)"
sidebarTitle: "WebChat"
mmh3_hash: "d2bb050ccfc3bb95128aceb34b57f03f"
summary: "环回 WebChat 静态主机和网关 WS 聊天 UI 使用"
read_when:
  - 调试或配置 WebChat 访问
---
# WebChat (网关 WebSocket 界面)

状态: macOS/iOS SwiftUI 聊天 UI 直接与网关 WebSocket 通信。

## 它是什么
- 网关的原生聊天 UI(无嵌入式浏览器,无本地静态服务器)。
- 使用与其他通道相同的会话和路由规则。
- 确定性路由: 回复始终返回 WebChat。

## 快速开始
1) 启动网关。
2) 打开 WebChat UI(macOS/iOS 应用)或控制 UI 聊天选项卡。
3) 确保配置了网关身份验证(默认情况下需要,即使在环回上)。

## 工作原理(行为)
- UI 连接到网关 WebSocket 并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.inject` 直接将助手注释附加到转录并将其广播到 UI(无代理运行)。
- 历史始终从网关获取(无本地文件监视)。
- 如果网关不可访问,WebChat 是只读的。

## 远程使用
- 远程模式通过 SSH/Tailscale 隧道网关 WebSocket。
- 您不需要运行单独的 WebChat 服务器。

## 配置参考(WebChat)
完整配置: [配置](/gateway/configuration)

通道选项:
- 无专用 `webchat.*` 块。WebChat 使用下面的网关端点 + 身份验证设置。

相关全局选项:
- `gateway.port`、`gateway.bind`: WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`: WebSocket 身份验证。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`: 远程网关目标。
- `session.*`: 会话存储和主键默认值。
