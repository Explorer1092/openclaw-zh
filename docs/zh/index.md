---
title: "OpenClaw"
mmh3_hash: "76d134773d0b2f9a3cbe1668dcb86040"
summary: "OpenClaw 的顶级概述、功能和目的"
read_when:
  - 向新手介绍 OpenClaw
---

# OpenClaw

> *"脱壳!脱壳!"* — 太空龙虾,可能

![OpenClaw](https://raw.githubusercontent.com/openclaw/openclaw/main/docs/assets/openclaw-logo-text.png)

**任何 OS + WhatsApp/Telegram/Discord/iMessage 网关用于 AI 代理(Pi)。**
插件添加 Mattermost 等。发送消息,从你的口袋获得代理响应。

[GitHub](https://github.com/openclaw/openclaw) · [Releases](https://github.com/openclaw/openclaw/releases) · [Docs](/) · [OpenClaw 助手设置](/start/openclaw)

OpenClaw 将 WhatsApp(通过 WhatsApp Web / Baileys)、Telegram(Bot API / grammY)、Discord(Bot API / channels.discord.js)和 iMessage(imsg CLI)桥接到编码代理,如 [Pi](https://github.com/badlogic/pi-mono)。插件添加 Mattermost(Bot API + WebSocket)等。
OpenClaw 还为 OpenClaw 助手提供动力。

## 从这里开始

- **从零开始的新安装:** [入门](/start/getting-started)
- **引导式设置(推荐):** [向导](/start/wizard)(`openclaw onboard`)
- **打开仪表板(本地网关):** `http://127.0.0.1:18789/`(或 `http://localhost:18789/`）

如果网关在同一台计算机上运行,该链接会立即打开浏览器控制 UI。如果失败,首先启动网关: `openclaw gateway`。

## 仪表板(浏览器控制 UI)

仪表板是用于聊天、配置、节点、会话等的浏览器控制 UI。
本地默认: `http://127.0.0.1:18789/`
远程访问: [Web 界面](/web) 和 [Tailscale](/gateway/tailscale)

## 工作原理

```text
WhatsApp / Telegram / Discord / iMessage (+ 插件)
        │
        ▼
  ┌───────────────────────────┐
  │          网关             │  ws://127.0.0.1:18789 (仅环回)
  │       (单一来源)          │
  │                           │  http://gateway-host:18793
  │                           │    /__openclaw__/canvas/ (Canvas 主机)
  └───────────┬───────────────┘
              │
              ├─ Pi 代理(RPC)
              ├─ CLI(openclaw …)
              ├─ 聊天 UI(SwiftUI)
              ├─ macOS 应用(OpenClaw.app)
              ├─ iOS 节点通过网关 WS + 配对
              └─ Android 节点通过网关 WS + 配对
```

大多数操作通过**网关**(`openclaw gateway`)流动,这是一个拥有通道连接和 WebSocket 控制平面的单一长期运行进程。

## 快速开始

运行时要求: **Node ≥ 22**。

```bash
# 推荐: 全局安装(npm/pnpm)
npm install -g openclaw@latest
# 或: pnpm add -g openclaw@latest

# 引导 + 安装服务(launchd/systemd 用户服务)
openclaw onboard --install-daemon

# 配对 WhatsApp Web(显示二维码)
openclaw channels login

# 引导后网关通过服务运行;手动运行仍然可能:
openclaw gateway --port 18789
```

## 文档

- [入门](/start/getting-started) — 从零开始
- [帮助](/help) — 常见修复 + 故障排除
- [配置](/gateway/configuration)
- [多代理路由](/concepts/multi-agent)
- [配对(DM + 节点)](/start/pairing)
- [OpenClaw 助手设置](/start/openclaw)

## 许可证

MIT
