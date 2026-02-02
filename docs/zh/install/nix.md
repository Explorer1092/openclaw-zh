---
mmh3_hash: "ca55789dbbcdcf26e3c5cc31b3f87c1a"
title: "Nix 安装"
sidebarTitle: "Nix"
summary: "使用 Nix 声明式安装 OpenClaw"
read_when: ["你想要可重现、可回滚的安装","你已经在使用 Nix/NixOS/Home Manager","你想要一切都被固定并声明式管理"]
---

# Nix 安装

使用 Nix 运行 OpenClaw 的推荐方法是通过 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** — 一个电池包含的 Home Manager 模块。

## 快速开始

将此粘贴给你的 AI 智能体 (Claude, Cursor 等)：

```text
I want to set up nix-openclaw on my Mac.
Repository: github:openclaw/nix-openclaw

What I need you to do:
1. Check if Determinate Nix is installed (if not, install it)
2. Create a local flake at ~/code/openclaw-local using templates/agent-first/flake.nix
3. Help me create a Telegram bot (@BotFather) and get my chat ID (@userinfobot)
4. Set up secrets (bot token, Anthropic key) - plain files at ~/.secrets/ is fine
5. Fill in the template placeholders and run home-manager switch
6. Verify: launchd running, bot responds to messages

Reference the nix-openclaw README for module options.
```

> **📦 完整指南: [github.com/openclaw/nix-openclaw](https://github.com/openclaw/nix-openclaw)**
>
> nix-openclaw 仓库是 Nix 安装的事实来源。本页只是一个快速概览。

## 你得到了什么

- 网关 + macOS 应用 + 工具 (whisper, spotify, cameras) — 全部固定
- 重启后存活的 Launchd 服务
- 带有声明式配置的插件系统
- 即时回滚: `home-manager switch --rollback`

---

## Nix 模式运行时行为

当设置了 `OPENCLAW_NIX_MODE=1` (nix-openclaw 自动设置) 时：

OpenClaw 支持 **Nix 模式**，该模式使配置具有确定性并禁用自动安装流程。
通过导出启用它：

```bash
OPENCLAW_NIX_MODE=1
```

在 macOS 上，GUI 应用程序不会自动继承 shell 环境变量。你也可以通过 defaults 启用 Nix 模式：

```bash
defaults write bot.molt.mac openclaw.nixMode -bool true
```

### 配置 + 状态路径

OpenClaw 从 `OPENCLAW_CONFIG_PATH` 读取 JSON5 配置，并将可变数据存储在 `OPENCLAW_STATE_DIR` 中。

- `OPENCLAW_STATE_DIR` (默认: `~/.openclaw`)
- `OPENCLAW_CONFIG_PATH` (默认: `$OPENCLAW_STATE_DIR/openclaw.json`)

在 Nix 下运行时，将这些显式设置为 Nix 管理的位置，以便运行时状态和配置远离不可变存储。

### Nix 模式下的运行时行为

- 禁用自动安装和自我变异流程
- 丢失的依赖项会浮现 Nix 特定的补救消息
- UI 出现时会显示只读的 Nix 模式横幅

## 打包说明 (macOS)

macOS 打包流程期望在以下位置有一个稳定的 Info.plist 模板：

```
apps/macos/Sources/OpenClaw/Resources/Info.plist
```

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) 将此模板复制到应用程序包中并修补动态字段（包 ID、版本/构建、Git SHA、Sparkle 密钥）。这使得 plist 对于 SwiftPM 打包和 Nix 构建（不依赖完整的 Xcode 工具链）具有确定性。

## 相关

- [nix-openclaw](https://github.com/openclaw/nix-openclaw) — 完整设置指南
- [向导](/start/wizard) — 非 Nix CLI 设置
- [Docker](/install/docker) — 容器化设置
