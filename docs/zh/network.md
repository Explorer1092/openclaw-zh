---
mmh3_hash: "07303fdaed22d9418fd595de419b4d36"
summary: "网络中心: gateway 界面、配对、发现和安全"
read_when:
  - 您需要网络架构 + 安全概述
  - 您正在调试本地与 tailnet 访问或配对
  - 您想要网络文档的规范列表
title: "网络"
---

本中心链接了 OpenClaw 如何跨 localhost、局域网和 tailnet 连接、配对及保护设备的核心文档。

## 核心模型

大多数操作通过 Gateway（`openclaw gateway`）进行，这是一个拥有 Channel 连接和 WebSocket 控制平面的单一长期运行进程。

- **环回优先**：Gateway WS 默认为 `ws://127.0.0.1:18789`。非环回绑定需要有效的 Gateway 认证路径：共享密钥令牌/密码认证，或正确配置的非环回 `trusted-proxy` 部署。
- **每台主机建议运行一个 Gateway**。如需隔离，可使用隔离的配置文件和端口运行多个 Gateway（[多个 Gateway](/gateway/multiple-gateways)）。
- **Canvas 主机**与 Gateway 服务在同一端口（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`），在环回之外绑定时受 Gateway 认证保护。
- **远程访问**通常通过 SSH 隧道或 Tailscale VPN（[远程访问](/gateway/remote)）。

主要参考文档：

- [Gateway 架构](/concepts/architecture)
- [Gateway 协议](/gateway/protocol)
- [Gateway 运行手册](/gateway)
- [Web 界面 + 绑定模式](/web)

## 配对 + 身份

- [配对概述（DM + Node）](/channels/pairing)
- [Gateway 拥有的 Node 配对](/gateway/pairing)
- [设备 CLI（配对 + 令牌轮换）](/cli/devices)
- [配对 CLI（DM 审批）](/cli/pairing)

本地信任：

- 直接本地环回连接可以自动批准配对，以保持同一主机的用户体验流畅。
- OpenClaw 还有一个用于可信共享密钥辅助流程的狭窄后端/容器本地自连接路径。
- Tailnet 和局域网客户端（包括同一主机 tailnet 绑定）仍然需要明确的配对批准。

## 发现 + 传输

- [发现和传输](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [远程访问（SSH）](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## Node + 传输

- [Node 概述](/nodes)
- [桥接协议（旧版 Node，历史）](/gateway/bridge-protocol)
- [Node 运行手册：iOS](/platforms/ios)
- [Node 运行手册：Android](/platforms/android)

## 安全

- [安全概述](/gateway/security)
- [Gateway 配置参考](/gateway/configuration)
- [故障排除](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)

## 相关文档

- [Gateway 运行手册](/gateway)
- [远程访问](/gateway/remote)
