---
mmh3_hash: "cc08168c0c64b86eb882e9412f881bb3"
summary: "Gateway、节点和 Canvas Host 如何连接。"
read_when:
  - 您想要 Gateway 网络模型的简明概述
title: "网络模型"
---

> 本内容已合并到 [Network](/network#core-model)。当前指南请参见该页面。

大多数操作通过 Gateway（`openclaw gateway`）流动，这是一个拥有 Channel 连接和 WebSocket 控制平面的长时间运行的单个进程。

## 核心规则

- 推荐每个主机一个 Gateway。它是唯一允许拥有 WhatsApp Web 会话的进程。对于救援机器人或严格隔离，请使用隔离的配置文件和端口运行多个 Gateway。参见 [多个 Gateways](/gateway/multiple-gateways)。
- 首选回环：Gateway WS 默认为 `ws://127.0.0.1:18789`。向导默认创建共享密钥认证，通常生成令牌，即使对于回环也是如此。对于非回环访问，使用有效的 Gateway 认证路径：共享密钥 token/password 认证，或正确配置的非回环 `trusted-proxy` 部署。Tailnet/移动设置通常最好通过 Tailscale Serve 或其他 `wss://` 端点，而不是原始 tailnet `ws://`。
- 节点根据需要通过 LAN、tailnet 或 SSH 连接到 Gateway WS。旧版 TCP 桥接已被移除。
- Canvas Host 由 Gateway HTTP 服务器在与 Gateway **相同的端口**上提供（默认 `18789`）：
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    当配置了 `gateway.auth` 且 Gateway 绑定超出回环时，这些路由受 Gateway 身份验证保护。节点客户端使用与其活跃 WS 会话绑定的节点作用域功能 URL。参见 [Gateway 配置](/gateway/configuration)（`canvasHost`、`gateway`）。
- 远程使用通常是 SSH 隧道或 tailnet VPN。参见 [远程访问](/gateway/remote) 和 [发现](/gateway/discovery)。

## 相关

- [远程访问](/gateway/remote)
- [受信代理认证](/gateway/trusted-proxy-auth)
- [Gateway 协议](/gateway/protocol)
