---
summary: "OpenClaw 引导选项和流程概述"
read_when:
  - 选择引导路径
  - 设置新环境
title: "引导概述"
sidebarTitle: "引导概述"
---

# 引导概述

OpenClaw 支持多个引导路径，具体取决于 Gateway 运行的位置以及您喜欢如何配置 Providers。

## 选择您的引导路径

- **CLI 向导**，用于 macOS、Linux 和 Windows（通过 WSL2）。
- **macOS 应用**，用于在 Apple Silicon 或 Intel Mac 上进行引导式首次运行。

## CLI 引导向导

在终端中运行向导：

```bash
openclaw onboard
```

当您想要完全控制 Gateway、工作空间、Channels 和 Skills 时，使用 CLI 向导。文档：

- [引导向导（CLI）](/start/wizard)
- [`openclaw onboard` 命令](/cli/onboard)

## macOS 应用引导

当您想要在 macOS 上进行完全引导式设置时，使用 OpenClaw 应用。文档：

- [引导（macOS 应用）](/start/onboarding)

## 自定义 Provider

如果您需要未列出的端点，包括公开标准 OpenAI 或 Anthropic API 的托管 Providers，请在 CLI 向导中选择 **Custom Provider**。系统将要求您：

- 选择 OpenAI 兼容、Anthropic 兼容或 **Unknown**（自动检测）。
- 输入 Base URL 和 API 密钥（如果 Provider 需要）。
- 提供模型 ID 和可选别名。
- 选择端点 ID，以便多个自定义端点可以共存。

有关详细步骤，请遵循上面的 CLI 引导文档。
