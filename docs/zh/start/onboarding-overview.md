---
mmh3_hash: "8a45d7224b1fd4e482e6fba693dec0b1"
summary: "OpenClaw 引导选项和流程概述"
read_when:
  - 选择引导路径
  - 设置新环境
title: "引导概述"
sidebarTitle: "引导概述"
---

OpenClaw 有两种引导路径。两者都会配置认证、Gateway 和可选 Channel——区别只在于交互方式不同。

## 应该选择哪种路径？

|                | CLI 引导                                   | macOS 应用引导              |
| -------------- | ------------------------------------------ | --------------------------- |
| **平台**       | macOS、Linux、Windows（原生或 WSL2）       | 仅 macOS                    |
| **界面**       | 终端向导                                   | 应用内引导 UI               |
| **适合**       | 服务器、无头环境、完全控制                 | Mac 桌面、可视化设置        |
| **自动化**     | `--non-interactive` 用于脚本               | 仅手动                      |
| **命令**       | `openclaw onboard`                         | 启动应用                    |

大多数用户应从 **CLI 引导**开始——它适用于所有平台，并提供最大控制权。

## 引导配置的内容

无论选择哪种路径，引导都会设置：

1. **模型提供商和认证** — 所选提供商的 API 密钥、OAuth 或设置令牌
2. **工作区** — Agent 文件、引导模板和记忆的目录
3. **Gateway** — 端口、绑定地址、认证模式
4. **Channel**（可选）— 内置和捆绑的聊天 Channel，如
   iMessage、Discord、Feishu、Google Chat、Mattermost、Microsoft Teams、
   Telegram、WhatsApp 等
5. **守护程序**（可选）— 后台服务，使 Gateway 自动启动

## CLI 引导

在任意终端中运行：

```bash
openclaw onboard
```

添加 `--install-daemon` 可在一步中同时安装后台服务。

完整参考：[引导向导（CLI）](/start/wizard)
CLI 命令文档：[`openclaw onboard`](/cli/onboard)

## macOS 应用引导

打开 OpenClaw 应用。首次运行向导会通过可视化界面引导你完成相同的步骤。

完整参考：[引导（macOS 应用）](/start/onboarding)

## 自定义或未列出的提供商

如果你的提供商未在引导中列出，请选择 **Custom Provider** 并输入：

- API 兼容模式（OpenAI 兼容、Anthropic 兼容或自动检测）
- Base URL 和 API 密钥
- 模型 ID 和可选别名

多个自定义端点可以共存——每个都有自己的端点 ID。

## 相关

- [入门指南](/start/getting-started)
- [CLI 引导参考](/start/wizard-cli-reference)
