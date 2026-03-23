---
mmh3_hash: "96692800277db98709a39f59b59bee74"
summary: "使用 SSH 隧道(Gateway WS)和 Tailnet 进行远程访问"
read_when:
  - 运行或故障排除远程 Gateway 设置
title: "远程访问"
---

# 远程访问(SSH、隧道和 Tailnet)

本仓库通过在专用主机(桌面/服务器)上运行单个 Gateway(主)并将客户端连接到它来支持"通过 SSH 远程"。

- 对于**操作员(您/macOS 应用)**:SSH 隧道是通用回退方案。
- 对于**节点(iOS/Android 和未来设备)**:连接到 Gateway **WebSocket**(LAN/tailnet 或按需 SSH 隧道)。

## 核心思想

- Gateway WebSocket 绑定到您配置端口上的**回环**(默认为 18789)。
- 对于远程使用,您通过 SSH 转发该回环端口(或使用 tailnet/VPN 减少隧道需求)。

## 常见 VPN/tailnet 设置(Agent 所在位置)

将 **Gateway 主机**视为"Agent 所在位置"。它拥有 Session、认证配置文件、Channel 和状态。
您的笔记本/桌面(和节点)连接到该主机。

### 1) 在 tailnet 中始终在线的 Gateway(VPS 或家用服务器)

在持久主机上运行 Gateway 并通过 **Tailscale** 或 SSH 访问它。

- **最佳用户体验:**保持 `gateway.bind: "loopback"` 并使用 **Tailscale Serve** 作为 Control UI。
- **回退方案:**保持回环 + 从任何需要访问的机器通过 SSH 隧道。
- **示例:**[exe.dev](/install/exe-dev)(简易 VM)或 [Hetzner](/install/hetzner)(生产 VPS)。

当您的笔记本经常休眠但您希望 Agent 始终在线时,这是理想的。

### 2) 家用桌面运行 Gateway,笔记本是远程控制

笔记本**不**运行 Agent。它远程连接:

- 使用 macOS 应用的**通过 SSH 远程**模式(设置 → 常规 → "OpenClaw 运行")。
- 应用打开并管理隧道,因此 WebChat + 健康检查"就能工作"。

运行手册:[macOS 远程访问](/platforms/mac/remote)。

### 3) 笔记本运行 Gateway,从其他机器远程访问

保持 Gateway 在本地但安全地暴露它:

- 从其他机器通过 SSH 隧道到笔记本,或
- 使用 Tailscale Serve 提供 Control UI 并保持 Gateway 仅回环。

指南:[Tailscale](/gateway/tailscale) 和 [Web 概述](/web)。

## 命令流程(什么在哪里运行)

一个 Gateway 服务拥有状态 + Channel。节点是外设。

流程示例(Telegram → 节点):

- Telegram 消息到达 **Gateway**。
- Gateway 运行 **Agent** 并决定是否调用节点工具。
- Gateway 通过 Gateway WebSocket(`node.*` RPC)调用**节点**。
- 节点返回结果;Gateway 回复给 Telegram。

注意:

- **节点不运行 Gateway 服务。** 每个主机只应运行一个 Gateway,除非您有意运行隔离的配置文件(参见[多个 Gateway](/gateway/multiple-gateways))。
- macOS 应用"节点模式"只是通过 Gateway WebSocket 的节点客户端。

## SSH 隧道(CLI + 工具)

创建到远程 Gateway WS 的本地隧道:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

隧道启动后:

- `openclaw health` 和 `openclaw status --deep` 现在通过 `ws://127.0.0.1:18789` 访问远程 Gateway。
- `openclaw gateway {status,health,send,agent,call}` 在需要时也可以通过 `--url` 定向到转发的 URL。

注意:将 `18789` 替换为您配置的 `gateway.port`(或 `--port`/`OPENCLAW_GATEWAY_PORT`)。
注意:当您传递 `--url` 时,CLI 不会回退到配置或环境凭证。
明确包含 `--token` 或 `--password`。缺少明确凭证是错误。

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

当 Gateway 仅回环时,保持 URL 为 `ws://127.0.0.1:18789` 并首先打开 SSH 隧道。

## 凭证优先级

Gateway 凭证解析遵循跨 call/probe/status 路径和 Discord exec-approval 监控的一个共享契约。节点主机使用相同的基础契约,但有一个本地模式例外(它有意忽略 `gateway.remote.*`):

- 明确凭证(`--token`、`--password` 或工具 `gatewayToken`)在接受明确认证的 call 路径上始终优先。
- URL 覆盖安全:
  - CLI URL 覆盖(`--url`)从不重用隐式配置/环境凭证。
  - 环境 URL 覆盖(`OPENCLAW_GATEWAY_URL`)只能使用环境凭证(`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`)。
- 本地模式默认值:
  - token:`OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token`(远程回退仅在本地认证 token 输入未设置时适用)
  - password:`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password`(远程回退仅在本地认证 password 输入未设置时适用)
- 远程模式默认值:
  - token:`gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password:`OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- 节点主机本地模式例外:`gateway.remote.token` / `gateway.remote.password` 被忽略。
- 远程 probe/status token 检查默认严格:当定向远程模式时,它们只使用 `gateway.remote.token`(无本地 token 回退)。
- 旧版 `CLAWDBOT_GATEWAY_*` 环境变量只被兼容性 call 路径使用;probe/status/auth 解析只使用 `OPENCLAW_GATEWAY_*`。

## SSH 上的 Chat UI

WebChat 不再使用单独的 HTTP 端口。SwiftUI 聊天 UI 直接连接到 Gateway WebSocket。

- 通过 SSH 转发 `18789`(见上文),然后将客户端连接到 `ws://127.0.0.1:18789`。
- 在 macOS 上,建议使用应用的"通过 SSH 远程"模式,它自动管理隧道。

## macOS 应用"通过 SSH 远程"

macOS 菜单栏应用可以端到端驱动相同的设置(远程状态检查、WebChat 和语音唤醒转发)。

运行手册:[macOS 远程访问](/platforms/mac/remote)。

## 安全规则(远程/VPN)

简短版本:**保持 Gateway 仅回环**,除非您确定需要绑定。

- **回环 + SSH/Tailscale Serve** 是最安全的默认设置(无公开暴露)。
- 明文 `ws://` 默认仅限回环。对于受信任的私有网络,在客户端进程上设置 `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` 作为紧急方案。
- **非回环绑定**(`lan`/`tailnet`/`custom`,或 `auto` 当回环不可用时)必须使用认证令牌/密码。
- `gateway.remote.token` / `.password` 是客户端凭证来源。它们**不**单独配置服务器认证。
- 本地 call 路径只有在 `gateway.auth.*` 未设置时才能使用 `gateway.remote.*` 作为回退。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 明确配置且未解析,则解析会关闭失败(无远程回退掩盖)。
- `gateway.remote.tlsFingerprint` 在使用 `wss://` 时固定远程 TLS 证书。
- **Tailscale Serve** 可以在 `gateway.auth.allowTailscale: true` 时通过身份标头对 Control UI/WebSocket 流量进行认证;HTTP API 端点仍需要 token/password 认证。此无令牌流程假设 Gateway 主机受信任。如果您希望所有地方都使用令牌/密码,请将其设置为 `false`。
- 将 Browser 控制视为操作员访问:仅 tailnet + 刻意的节点配对。

深入讨论:[安全](/gateway/security)。
