---
title: "WebChat (Gateway WebSocket UI)"
sidebarTitle: "WebChat"
mmh3_hash: "placeholder"
summary: "环回 WebChat 静态主机和 Gateway WS 聊天 UI 使用"
read_when: ["调试或配置 WebChat 访问"]
---
# WebChat (Gateway WebSocket UI)

状态: macOS/iOS SwiftUI 聊天 UI 直接与 Gateway WebSocket 通信。

## 它是什么

- Gateway 的原生聊天 UI(无嵌入式浏览器,无本地静态服务器)。
- 使用与其他通道相同的会话和路由规则。
- 确定性路由: 回复始终返回 WebChat。

## 快速开始

1. 启动 Gateway。
2. 打开 WebChat UI(macOS/iOS 应用)或 Control UI 聊天选项卡。
3. 确保配置了 Gateway 身份验证(默认情况下需要,即使在环回上)。

## 工作原理(行为)

- UI 连接到 Gateway WebSocket 并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.inject` 直接将助手注释附加到转录并将其广播到 UI(无代理运行)。
- 历史始终从 Gateway 获取(无本地文件监视)。
- 如果 Gateway 不可访问,WebChat 是只读的。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道 Gateway WebSocket。
- 您不需要运行单独的 WebChat 服务器。

## 配置参考(WebChat)

完整配置: [配置](/gateway/configuration)

通道选项:

- 无专用 `webchat.*` 块。WebChat 使用下面的 Gateway 端点 + 身份验证设置。

相关全局选项:

- `gateway.port`、`gateway.bind`: WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`: WebSocket 身份验证。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`: 远程 Gateway 目标。
- `session.*`: 会话存储和主键默认值。
