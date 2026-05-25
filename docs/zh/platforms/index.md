---
mmh3_hash: "615da4d646a3b5ff8a7fcfb476cd18f3"
title: "平台"
summary: "平台支持概述（Gateway + 配套应用）"
read_when:
  - 寻找 OS 支持或安装路径
  - 决定在哪里运行 Gateway
---

OpenClaw 核心用 TypeScript 编写。**推荐使用 Node 作为运行时**。
不推荐在 Gateway 中使用 Bun——WhatsApp 和 Telegram Channel 存在已知问题；详见 [Bun（实验性）](/install/bun)。

macOS（菜单栏应用）和移动节点（iOS/Android）存在配套应用。Windows 和
Linux 配套应用已在计划中，但 Gateway 今天已完全支持。
Windows 的原生配套应用也已在计划中；推荐通过 WSL2 运行 Gateway。

## 选择你的 OS

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS 和托管

- VPS 中心: [VPS 托管](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- Azure (Linux VM): [Azure](/install/azure)
- exe.dev (VM + HTTPS 代理): [exe.dev](/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/platforms/easyrunner)

## 常见链接

- 安装指南: [入门指南](/start/getting-started)
- Gateway 运行手册: [Gateway](/gateway)
- Gateway 配置: [配置](/gateway/configuration)
- 服务状态: `openclaw gateway status`

## Gateway 服务安装（CLI）

使用以下其中之一（均支持）：

- 向导（推荐）: `openclaw onboard --install-daemon`
- 直接: `openclaw gateway install`
- 配置流程: `openclaw configure` → 选择 **Gateway service**
- 修复/迁移: `openclaw doctor`（提供安装或修复服务）

服务目标取决于 OS：

- macOS: LaunchAgent（`ai.openclaw.gateway` 或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 可能保留）
- Linux/WSL2: systemd 用户服务（`openclaw-gateway[-<profile>].service`）
- 原生 Windows: 计划任务（`OpenClaw Gateway` 或 `OpenClaw Gateway (<profile>)`），如果任务创建被拒绝则回退到每用户 Startup 文件夹登录项

## 相关文档

- [安装概述](/install)
- [macOS 应用](/platforms/macos)
- [iOS 应用](/platforms/ios)
