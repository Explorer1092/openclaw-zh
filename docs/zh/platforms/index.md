---
mmh3_hash: "888a1217854ea503f0763259e2ca2980"
summary: "平台支持概述(网关 + 配套应用)"
read_when:
  - 寻找 OS 支持或安装路径
  - 决定在哪里运行网关
---
# 平台

OpenClaw 核心用 TypeScript 编写。**推荐使用 Node 作为运行时**。
不推荐在网关中使用 Bun(WhatsApp/Telegram 错误)。

存在 macOS(菜单栏应用)和移动节点(iOS/Android)的配套应用。计划推出 Windows 和
Linux 配套应用,但网关今天已完全支持。
也计划推出 Windows 的原生配套应用;推荐通过 WSL2 运行网关。

## 选择你的 OS

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS 和托管

- VPS 中心: [VPS 托管](/vps)
- Fly.io: [Fly.io](/platforms/fly)
- Hetzner (Docker): [Hetzner](/platforms/hetzner)
- GCP (Compute Engine): [GCP](/platforms/gcp)
- exe.dev (VM + HTTPS 代理): [exe.dev](/platforms/exe-dev)

## 常见链接

- 安装指南: [入门指南](/start/getting-started)
- 网关运行手册: [网关](/gateway)
- 网关配置: [配置](/gateway/configuration)
- 服务状态: `openclaw gateway status`

## 网关服务安装(CLI)

使用以下其中之一(均支持):

- 向导(推荐): `openclaw onboard --install-daemon`
- 直接: `openclaw gateway install`
- 配置流程: `openclaw configure` → 选择 **Gateway service**
- 修复/迁移: `openclaw doctor`(提供安装或修复服务)

服务目标取决于 OS:
- macOS: LaunchAgent(`bot.molt.gateway` 或 `bot.molt.<profile>`;旧版 `com.openclaw.*`)
- Linux/WSL2: systemd 用户服务(`openclaw-gateway[-<profile>].service`)
