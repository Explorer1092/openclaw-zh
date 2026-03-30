---
read_when:
  - 调试或配置 WebChat 访问
summary: 用于聊天 UI 的 loopback WebChat 静态主机和 Gateway 网关 WS 使用
title: WebChat
x-i18n:
  generated_at: "2026-02-03T10:13:28Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 97ab1e59af6feae51ed3380e21cc3bb0df4ccbcdcb4bcae630a21664caccc567
  source_path: web/webchat.md
  workflow: 15
---

# WebChat（Gateway 网关 WebSocket UI）

状态：macOS/iOS SwiftUI 聊天 UI 直接与 Gateway 网关 WebSocket 通信。

## 它是什么

- Gateway 网关的原生聊天 UI（无嵌入式浏览器，无本地静态服务器）。
- 使用与其他渠道相同的会话和路由规则。
- 确定性路由：回复始终返回到 WebChat。

## 快速开始

1. 启动 Gateway 网关。
2. 打开 WebChat UI（macOS/iOS 应用）或控制 UI 聊天标签页。
3. 确保已配置 Gateway 网关认证（默认需要，即使在 loopback 上）。

## 工作原理（行为）

- UI 连接到 Gateway 网关 WebSocket 并使用 `chat.history`、`chat.send` 和 `chat.inject`。
- `chat.inject` 直接将助手注释追加到转录并广播到 UI（无智能体运行）。
- 历史记录始终从 Gateway 网关获取（无本地文件监听）。
- 如果 Gateway 网关不可达，WebChat 为只读模式。

## 控制 UI 智能体工具面板

- 控制 UI 的 `/agents` 工具面板有两个独立视图：
  - **当前可用** 使用 `tools.effective(sessionKey=...)`，显示当前会话在运行时实际可以使用的工具，包括核心工具、插件工具和渠道自有工具。
  - **工具配置** 使用 `tools.catalog`，专注于配置文件、覆盖设置和目录语义。
- 运行时可用性是会话范围的。在同一智能体上切换会话可能会改变**当前可用**列表。
- 配置编辑器不代表运行时可用性；实际访问仍遵循策略优先级（`allow`/`deny`、每智能体及提供商/渠道覆盖）。

## 远程使用

- 远程模式通过 SSH/Tailscale 隧道传输 Gateway 网关 WebSocket。
- 你不需要运行单独的 WebChat 服务器。

## 配置参考（WebChat）

完整配置：[配置](/gateway/configuration)

渠道选项：

- 没有专用的 `webchat.*` 块。WebChat 使用下面的 Gateway 网关端点 + 认证设置。

相关的全局选项：

- `gateway.port`、`gateway.bind`：WebSocket 主机/端口。
- `gateway.auth.mode`、`gateway.auth.token`、`gateway.auth.password`：WebSocket 认证。
- `gateway.remote.url`、`gateway.remote.token`、`gateway.remote.password`：远程 Gateway 网关目标。
- `session.*`：会话存储和主键默认值。
