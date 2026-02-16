---
mmh3_hash: "19185f782ce250c2b3cd9681dc3f7d37"
summary: "OpenClaw 的 VPS 托管中心 (Oracle/Fly/Hetzner/GCP/exe.dev)"
read_when:
  - 您想在云中运行 Gateway
  - 您需要 VPS/托管指南的快速地图
title: "VPS 托管"
---

# VPS 托管

此中心链接到支持的 VPS/托管指南,并从高层次解释云部署的工作方式。

## 选择提供商

- **Railway** (一键 + 浏览器设置): [Railway](/install/railway)
- **Northflank** (一键 + 浏览器设置): [Northflank](/install/northflank)
- **Oracle Cloud (Always Free)**: [Oracle](/platforms/oracle) — $0/月 (Always Free, ARM; 容量/注册可能很棘手)
- **Fly.io**: [Fly.io](/install/fly)
- **Hetzner (Docker)**: [Hetzner](/install/hetzner)
- **GCP (Compute Engine)**: [GCP](/install/gcp)
- **exe.dev** (VM + HTTPS 代理): [exe.dev](/install/exe-dev)
- **AWS (EC2/Lightsail/免费层)**: 也很好用。视频指南:
  [https://x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)

## 云设置的工作方式

- **Gateway 在 VPS 上运行**并拥有状态 + workspace。
- 您通过**控制 UI** 或 **Tailscale/SSH** 从笔记本电脑/手机连接。
- 将 VPS 视为真实来源并**备份**状态 + workspace。
- 安全默认值: 将 Gateway 保持在 loopback 上,并通过 SSH 隧道或 Tailscale Serve 访问它。
  如果您绑定到 `lan`/`tailnet`,则需要 `gateway.auth.token` 或 `gateway.auth.password`。

远程访问: [Gateway 远程](/gateway/remote)
平台中心: [平台](/platforms)

## 将节点与 VPS 一起使用

您可以将 Gateway 保留在云中,并在本地设备 (Mac/iOS/Android/无头) 上配对**节点**。节点提供本地屏幕/相机/canvas 和 `system.run` 功能,而 Gateway 保留在云中。

文档: [节点](/nodes), [节点 CLI](/cli/nodes)
