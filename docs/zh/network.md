---
mmh3_hash: "0b697e413a925a1a0b387420db6a6ab0"
summary: "网络中心: gateway 界面、配对、发现和安全"
read_when:
  - 您需要网络架构 + 安全概述
  - 您正在调试本地 vs tailnet 访问或配对
  - 您想要网络文档的规范列表
title: "网络"
---

# 网络中心

此中心链接了有关 OpenClaw 如何在 localhost、LAN 和 tailnet 上连接、配对和保护设备的核心文档。

## 核心模型

大多数操作通过 Gateway（`openclaw gateway`）流动，这是一个拥有 Channel 连接和 WebSocket 控制平面的单一长运行进程。

- **环回优先**：Gateway WS 默认为 `ws://127.0.0.1:18789`。非环回绑定需要有效的 Gateway 认证路径：共享密钥令牌/密码认证，或正确配置的非环回 `trusted-proxy` 部署。
- **推荐每台主机一个 Gateway**。为了隔离，请使用隔离的配置文件和端口运行多个 Gateway（[多个 Gateway](/gateway/multiple-gateways)）。
- **Canvas host** 与 Gateway 在同一端口提供（`/__openclaw__/canvas/`、`/__openclaw__/a2ui/`），在超出环回绑定时受 Gateway 认证保护。
- **远程访问** 通常通过 SSH 隧道或 Tailscale VPN（[远程访问](/gateway/remote)）。

关键参考：

- [Gateway 架构](/concepts/architecture)
- [Gateway 协议](/gateway/protocol)
- [Gateway 运行手册](/gateway)
- [Web surfaces + 绑定模式](/web)

## 配对 + 身份

- [配对概述 (DM + 节点)](/channels/pairing)
- [Gateway 拥有的节点配对](/gateway/pairing)
- [设备 CLI (配对 + 令牌轮换)](/cli/devices)
- [配对 CLI (DM 批准)](/cli/pairing)

本地信任：

- 直接本地环回连接可以自动批准配对，以保持同主机 UX 流畅。
- OpenClaw 也为受信任的共享密钥助手流程提供了一条窄的后端/容器本地自连接路径。
- Tailnet 和 LAN 客户端，包括同主机 tailnet 绑定，仍然需要显式配对批准。

## 发现 + 传输

- [发现和传输](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [远程访问 (SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## 节点 + 传输

- [节点概述](/nodes)
- [Bridge 协议 (传统节点)](/gateway/bridge-protocol)
- [节点运行手册: iOS](/platforms/ios)
- [节点运行手册: Android](/platforms/android)

## 安全

- [安全概述](/gateway/security)
- [Gateway 配置参考](/gateway/configuration)
- [故障排除](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
