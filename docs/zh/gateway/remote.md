---
mmh3_hash: "307f1628faa5888289177022bc850d08"
summary: "使用 SSH 隧道(Gateway WS)和 Tailnet 进行远程访问"
read_when:
  - 运行或故障排除远程 Gateway 设置
title: "远程访问"
---

# 远程访问(SSH、隧道和 Tailnet)

此仓库通过在专用主机(桌面/服务器)上运行单个 Gateway(主机)并将客户端连接到它来支持"通过 SSH 远程"。

- 对于**操作员(您/macOS 应用程序)**:SSH 隧道是通用回退。
- 对于**节点(iOS/Android 和未来设备)**:连接到 Gateway **WebSocket**(LAN/Tailnet 或根据需要 SSH 隧道)。

## 核心思想

- Gateway WebSocket 绑定到配置端口上的**回环**(默认为 18789)。
- 对于远程使用,您通过 SSH 转发该回环端口(或使用 Tailnet/VPN 并减少隧道)。

## 常见 VPN/Tailnet 设置(Agent 所在位置)

将 **Gateway 主机**视为"Agent 所在位置"。它拥有 Session、认证配置文件、Channel 和状态。
您的笔记本电脑/台式机(和节点)连接到该主机。

### 1) Tailnet 中的始终在线 Gateway(VPS 或家庭服务器)

在持久主机上运行 Gateway 并通过 **Tailscale** 或 SSH 访问它。

- **最佳 UX:**保持 `gateway.bind: "loopback"` 并为 Control UI 使用 **Tailscale Serve**。
- **回退:**保持回环 + 从任何需要访问的机器进行 SSH 隧道。
- **示例:**[exe.dev](/install/exe-dev)(简单 VM)或 [Hetzner](/install/hetzner)(生产 VPS)。

当您的笔记本电脑经常睡眠但您希望 Agent 始终在线时,这是理想的。

### 2) 家庭台式机运行 Gateway,笔记本电脑是远程控制

笔记本电脑**不**运行 Agent。它远程连接:

- 使用 macOS 应用程序的 **Remote over SSH** 模式(设置 → 常规 → "OpenClaw runs")。
- 应用程序打开和管理隧道,因此 WebChat + 健康检查"开箱即用"。

运行手册:[macOS 远程访问](/platforms/mac/remote)。

### 3) 笔记本电脑运行 Gateway,从其他机器进行远程访问

保持 Gateway 本地但安全地公开它:

- 从其他机器通过 SSH 隧道到笔记本电脑,或
- Tailscale Serve Control UI 并保持 Gateway 仅回环。

指南:[Tailscale](/gateway/tailscale) 和 [Web 概述](/web)。

## 命令流(什么在哪里运行)

一个 Gateway 服务拥有状态 + Channel。节点是外围设备。

流程示例(Telegram → 节点):

- Telegram 消息到达 **Gateway**。
- Gateway 运行 **Agent** 并决定是否调用节点工具。
- Gateway 通过 Gateway WebSocket(`node.*` RPC)调用**节点**。
- 节点返回结果;Gateway 回复到 Telegram。

注意:

- **节点不运行 Gateway 服务。**除非您有意运行隔离的 Profile(参见[多个 Gateway](/gateway/multiple-gateways)),否则每个主机只应运行一个 Gateway。
- macOS 应用程序"节点模式"只是通过 Gateway WebSocket 的节点客户端。

## SSH 隧道(CLI + 工具)

创建到远程 Gateway WS 的本地隧道:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

隧道启动后:

- `openclaw health` 和 `openclaw status --deep` 现在通过 `ws://127.0.0.1:18789` 到达远程 Gateway。
- `openclaw gateway {status,health,send,agent,call}` 也可以在需要时通过 `--url` 定位转发的 URL。

注意:将 `18789` 替换为您配置的 `gateway.port`(或 `--port`/`OPENCLAW_GATEWAY_PORT`)。
注意:当您传递 `--url` 时,CLI 不会回退到配置或环境凭证。
显式包含 `--token` 或 `--password`。缺少显式凭证是错误。

## CLI 远程默认值

您可以持久化远程目标,以便 CLI 命令默认使用它:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

当 Gateway 仅回环时,将 URL 保持在 `ws://127.0.0.1:18789` 并首先打开 SSH 隧道。

## 凭证优先级

Gateway 调用/探测凭证解析现在遵循一个共享契约:

- 显式凭证(`--token`、`--password` 或工具 `gatewayToken`)始终优先。
- 本地模式默认值:
  - 令牌:`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`
  - 密码:`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`
- 远程模式默认值:
  - 令牌:`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - 密码:`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- 远程探测/状态令牌检查默认情况下是严格的:当定位远程模式时,它们仅使用 `gateway.remote.token`(无本地令牌回退)。
- 旧版 `CLAWDBOT_GATEWAY_*` 环境变量仅由兼容性调用路径使用;探测/状态/认证解析仅使用 `OPENCLAW_GATEWAY_*`。

## 通过 SSH 的聊天 UI

WebChat 不再使用单独的 HTTP 端口。SwiftUI 聊天 UI 直接连接到 Gateway WebSocket。

- 通过 SSH 转发 `18789`(见上文),然后将客户端连接到 `ws://127.0.0.1:18789`。
- 在 macOS 上,首选应用程序的"Remote over SSH"模式,它会自动管理隧道。

## macOS 应用程序"Remote over SSH"

macOS 菜单栏应用程序可以端到端驱动相同的设置(远程状态检查、WebChat 和 Voice Wake 转发)。

运行手册:[macOS 远程访问](/platforms/mac/remote)。

## 安全规则(远程/VPN)

简短版本:**保持 Gateway 仅回环**,除非您确定需要绑定。

- **回环 + SSH/Tailscale Serve** 是最安全的默认值(无公共暴露)。
- 明文 `ws://` 默认仅限回环。对于受信任的私有网络,在客户端进程上设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 作为紧急措施。
- **非回环绑定**(`lan`/`tailnet`/`custom`,或当回环不可用时的 `auto`)必须使用认证令牌/密码。
- `gateway.remote.token` / `.password` 是客户端凭证来源。它们本身**不**配置服务器认证。
- 本地调用路径可以在未设置 `gateway.auth.*` 时使用 `gateway.remote.*` 作为回退。
- `gateway.remote.tlsFingerprint` 在使用 `wss://` 时固定远程 TLS 证书。
- **Tailscale Serve** 可以在 `gateway.auth.allowTailscale: true` 时通过身份标头对 Control UI/WebSocket 流量进行身份验证;HTTP API 端点仍然需要令牌/密码认证。此无令牌流程假设 Gateway 主机是可信的。如果您想要令牌/密码,请将其设置为 `false`。
- 将 Browser 控制视为操作员访问:仅 Tailnet + 故意节点配对。

深入探讨:[安全](/gateway/security)。
