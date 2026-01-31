---
title: "网络中心"
mmh3_hash: "1a0fba2bb498f745bbae44bb9e79fffa"
summary: "网络中心:网关界面、配对、发现和安全"
read_when: ["您需要网络架构 + 安全概述","您正在调试本地 vs tailnet 访问或配对","您想要网络文档的规范列表"]
---
# 网络中心

此中心链接了有关 OpenClaw 如何在 localhost、LAN 和 tailnet 上连接、配对和保护设备的核心文档。

## 核心模型

- [网关架构](/concepts/architecture)
- [网关协议](/gateway/protocol)
- [网关运行手册](/gateway)
- [Web 界面 + 绑定模式](/web)

## 配对 + 身份

- [配对概述(DM + 节点)](/start/pairing)
- [网关拥有的节点配对](/gateway/pairing)
- [设备 CLI(配对 + 令牌轮换)](/cli/devices)
- [配对 CLI(DM 批准)](/cli/pairing)

本地信任:
- 本地连接(loopback 或网关主机自己的 tailnet 地址)可以自动批准配对,以保持同主机 UX 流畅。
- 非本地 tailnet/LAN 客户端仍需要显式配对批准。

## 发现 + 传输

- [发现和传输](/gateway/discovery)
- [Bonjour / mDNS](/gateway/bonjour)
- [远程访问(SSH)](/gateway/remote)
- [Tailscale](/gateway/tailscale)

## 节点 + 传输

- [节点概述](/nodes)
- [桥接协议(传统节点)](/gateway/bridge-protocol)
- [节点运行手册: iOS](/platforms/ios)
- [节点运行手册: Android](/platforms/android)

## 安全

- [安全概述](/gateway/security)
- [网关配置参考](/gateway/configuration)
- [故障排除](/gateway/troubleshooting)
- [Doctor](/gateway/doctor)
