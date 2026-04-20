---
mmh3_hash: "795b685e88af5c70d4516e59f6057a35"
title: "常见问题解答"
sidebarTitle: "常见问题"
summary: "关于 OpenClaw 设置、配置和使用的常见问题解答"
read_when:
  - "回答常见的设置、安装、引导或运行时支持问题"
  - "在深入调试之前对用户报告的问题进行分类"
---

# 常见问题解答

## 目录

**前 60 秒调试**

- [什么都不起作用，从哪里开始](#什么都不起作用从哪里开始)

**快速入门**

- [OpenClaw 最快的入门方式是什么](#openclaw-最快的入门方式是什么)
- [我安装了 OpenClaw。下一步是什么](#我安装了-openclaw下一步是什么)
- [我运行了 openclaw onboard 但没有 Anthropic 密钥。我可以用 OpenAI 或 OpenRouter 吗](#我运行了-openclaw-onboard-但没有-anthropic-密钥我可以用-openai-或-openrouter-吗)
- [onboard 给了我 OpenAI Code 登录——那是什么](#onboard-给了我-openai-code-登录那是什么)
- [向导完成后 gateway 没有运行怎么办](#向导完成后-gateway-没有运行怎么办)
- [向导要求 phone number——为什么](#向导要求-phone-number为什么)
- [我想跳过向导直接使用。最小配置是什么](#我想跳过向导直接使用最小配置是什么)
- [我更新了 openclaw.json 但什么都没变](#我更新了-openclaw.json-但什么都没变)
- [Gateway 无法启动、立即崩溃或找不到配置](#gateway-无法启动立即崩溃或找不到配置)
- [openclaw onboard 和 openclaw setup 有什么区别](#openclaw-onboard-和-openclaw-setup-有什么区别)
- [我应该使用 WSL2 还是 Native Windows](#我应该使用-wsl2-还是-native-windows)
- [什么都不起作用](#什么都不起作用)
- [我卡住了，最快的解决方法是什么](#我卡住了最快的解决方法是什么)
- [安装和设置 OpenClaw 的推荐方式](#安装和设置-openclaw-的推荐方式)
- [onboarding 后如何打开 dashboard](#onboarding-后如何打开-dashboard)
- [如何在本地与远程验证 dashboard](#如何在本地与远程验证-dashboard)
- [我需要什么运行时](#我需要什么运行时)
- [它能在 Raspberry Pi 上运行吗](#它能在-raspberry-pi-上运行吗)
- [Raspberry Pi 安装有什么提示](#raspberry-pi-安装有什么提示)
- [它卡在唤醒我的朋友 / onboarding 不会启动，怎么办](#它卡在唤醒我的朋友--onboarding-不会启动怎么办)
- [我可以将设置迁移到新机器而不重新进行 onboarding 吗](#我可以将设置迁移到新机器而不重新进行-onboarding-吗)
- [在哪里查看最新版本的新功能](#在哪里查看最新版本的新功能)
- [stable 和 beta 的区别](#stable-和-beta-的区别)
- [如何安装 beta 版本，beta 和 dev 有什么区别](#如何安装-beta-版本beta-和-dev-有什么区别)
- [如何尝试最新版本](#如何尝试最新版本)
- [如何在 Linux 上安装 OpenClaw](#如何在-linux-上安装-openclaw)
- [如何在 VPS 上安装 OpenClaw](#如何在-vps-上安装-openclaw)
- [onboarding 实际上做了什么](#onboarding-实际上做了什么)
- [我需要 Claude 或 OpenAI 订阅才能运行吗](#我需要-claude-或-openai-订阅才能运行吗)
- [Anthropic setup-token auth 如何工作](#anthropic-setup-token-auth-如何工作)
- [你支持 Claude 订阅 auth 吗](#你支持-claude-订阅-auth-吗)
- [Codex auth 如何工作](#codex-auth-如何工作)
- [如何设置 Gemini CLI OAuth](#如何设置-gemini-cli-oauth)
- [我必须购买 Mac Mini 才能安装吗](#我必须购买-mac-mini-才能安装吗)
- [hackable git 安装和 npm 安装的区别](#hackable-git-安装和-npm-安装的区别)
- [我应该在笔记本上还是 VPS 上运行 Gateway](#我应该在笔记本上还是-vps-上运行-gateway)
- [最低 VPS 要求和推荐 OS 是什么](#最低-vps-要求和推荐-os-是什么)

**OpenClaw 是什么**

- [OpenClaw 和 pi-coding-agent 有什么区别](#openclaw-和-pi-coding-agent-有什么区别)
- [Gateway 是什么，为什么需要它](#gateway-是什么为什么需要它)
- [什么是 Channels](#什么是-channels)
- [我可以不用 Telegram、Discord 或 WhatsApp 吗](#我可以不用-telegramdiscord-或-whatsapp-吗)
- [OpenClaw 需要 VPS 吗](#openclaw-需要-vps-吗)
- [OpenClaw 的价值主张](#openclaw-的价值主张)
- [我刚设置好——首先应该做什么](#我刚设置好首先应该做什么)

**Skills 和自动化**

- [什么是 Skills，它们如何工作](#什么是-skills它们如何工作)
- [我在哪里找到 Skills](#我在哪里找到-skills)
- [什么是 Workflow Skills](#什么是-workflow-skills)
- [如何创建自定义 Slash Command](#如何创建自定义-slash-command)
- [Slash Commands 和 Skills 有什么区别](#slash-commands-和-skills-有什么区别)
- [如何为不同任务使用不同 models](#如何为不同任务使用不同-models)
- [Cron 或提醒不触发，检查什么](#cron-或提醒不触发检查什么)
- [OpenClaw 可以按计划或在后台持续运行任务吗](#openclaw-可以按计划或在后台持续运行任务吗)

**沙盒**

- [什么是沙盒，如何启用它](#什么是沙盒如何启用它)
- [Docker 感觉受限——如何启用完整功能](#docker-感觉受限如何启用完整功能)
- [我可以让 DMs 保持私密但让群组公开/沙盒化吗](#我可以让-dms-保持私密但让群组公开沙盒化吗)

**Memory**

- [Memory 如何工作](#memory-如何工作)
- [如何关闭 memory 摘要](#如何关闭-memory-摘要)
- [Memory 一直在忘记事情，如何让它记住](#memory-一直在忘记事情如何让它记住)
- [Memory 会永远持久吗，有什么限制](#memory-会永远持久吗有什么限制)
- [语义 memory 搜索需要 OpenAI API key 吗](#语义-memory-搜索需要-openai-api-key-吗)

**磁盘上的文件位置**

- [状态文件在哪里](#状态文件在哪里)
- [如何更改 gateway 状态目录](#如何更改-gateway-状态目录)
- [OpenClaw 将其数据存储在哪里](#openclaw-将其数据存储在哪里)
- [AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里](#agentsmd--soulmd--usermd--memorymd-应该放在哪里)
- [推荐的备份策略](#推荐的备份策略)

**配置基础**

- [配置文件在哪里](#配置文件在哪里)
- [config set 和 config edit 有什么区别](#config-set-和-config-edit-有什么区别)
- [我可以对 config 使用环境变量吗](#我可以对-config-使用环境变量吗)
- [什么是 profile，如何在多个 bot 账户之间切换](#什么是-profile如何在多个-bot-账户之间切换)
- [更改配置后必须重启吗](#更改配置后必须重启吗)
- [如何启用网络搜索（和 web fetch）](#如何启用网络搜索和-web-fetch)
- [OpenClaw 浏览器可以无头运行吗](#openclaw-浏览器可以无头运行吗)

**远程 Gateways 和 Nodes**

- [什么是 Node](#什么是-node)
- [如何从笔记本连接到远程 gateway](#如何从笔记本连接到远程-gateway)
- [如何在没有 VPN 的情况下安全地远程访问 gateway](#如何在没有-vpn-的情况下安全地远程访问-gateway)
- [什么是 Tailscale 以及何时使用它](#什么是-tailscale-以及何时使用它)
- [如果 Gateway 远程托管，我的 agent 如何访问我的电脑](#如果-gateway-远程托管我的-agent-如何访问我的电脑)
- [两个 OpenClaw 实例可以互相交流吗](#两个-openclaw-实例可以互相交流吗)
- [如何在 VPS 上设置 Tailscale 并从 Mac 连接](#如何在-vps-上设置-tailscale-并从-mac-连接)

**环境变量和 .env 加载**

- [OpenClaw 加载哪些环境变量](#openclaw-加载哪些环境变量)
- [如何通过 env var 注入 API key 而不写入配置文件](#如何通过-env-var-注入-api-key-而不写入配置文件)
- [.env 文件加载顺序是什么](#env-文件加载顺序是什么)
- [我设置了 ANTHROPIC_API_KEY 但 gateway 找不到它](#我设置了-anthropic_api_key-但-gateway-找不到它)

**Sessions 和多个聊天**

- [什么是 session](#什么是-session)
- [如何开始新的 session](#如何开始新的-session)
- [我想要两个独立的 bot 用于不同场景](#我想要两个独立的-bot-用于不同场景)
- [我有 Discord 和 Telegram 同时运行。它们共享 session 吗](#我有-discord-和-telegram-同时运行它们共享-session-吗)
- [如何查看 session 历史](#如何查看-session-历史)
- [如何限制 session 的 context window](#如何限制-session-的-context-window)
- [compaction 何时触发](#compaction-何时触发)
- [如果我从不发送 /new，sessions 会自动重置吗](#如果我从不发送-new-sessions-会自动重置吗)
- [为什么 context 在任务中途被截断，如何防止](#为什么-context-在任务中途被截断如何防止)
- [如何完全重置 OpenClaw 但保持安装](#如何完全重置-openclaw-但保持安装)
- [我收到 context too large 错误——如何重置或压缩](#我收到-context-too-large-错误如何重置或压缩)
- [为什么我每 30 分钟收到心跳消息](#为什么我每-30-分钟收到心跳消息)
- [群组/线程与 DMs 共享 context 吗](#群组线程与-dms-共享-context-吗)

**Models：默认、选择、别名、切换**

- [默认 model 是什么，如何更改它](#默认-model-是什么如何更改它)
- [如何在聊天中切换 models](#如何在聊天中切换-models)
- [如何设置 model 别名](#如何设置-model-别名)
- [如何限制可用 models](#如何限制可用-models)
- [为什么切换 models 后没有回复](#为什么切换-models-后没有回复)
- [如何设置 image model](#如何设置-image-model)
- [扫描可以使用什么 models](#扫描可以使用什么-models)
- [如何配置 OpenRouter](#如何配置-openrouter)
- [如何使用免费 OpenRouter models](#如何使用免费-openrouter-models)
- [什么是 thinking 模式，如何启用它](#什么是-thinking-模式如何启用它)
- [如何为每个 agent 使用不同的 model](#如何为每个-agent-使用不同的-model)
- [你推荐什么 model](#你推荐什么-model)
- [如何即时切换 models（无需重启）](#如何即时切换-models无需重启)
- [opus / sonnet / gpt 是内置快捷方式吗](#opus--sonnet--gpt-是内置快捷方式吗)

**Model Failover 和"所有 models 失败"**

- [什么是 model failover](#什么是-model-failover)
- [所有 models 失败 是什么意思](#所有-models-失败-是什么意思)
- ["No credentials found for profile anthropic:default"是什么意思](#no-credentials-found-for-profile-anthropicdefault是什么意思)

**Auth Profiles**

- [什么是 auth profile](#什么是-auth-profile)
- [如何从 CLI 设置 auth profile](#如何从-cli-设置-auth-profile)
- [我可以控制先尝试哪个 auth profile 吗](#我可以控制先尝试哪个-auth-profile-吗)
- [OAuth vs API key——有什么区别](#oauth-vs-api-key有什么区别)

**Gateway 端口、"已在运行"和远程模式**

- [如何更改 gateway 端口](#如何更改-gateway-端口)
- [gateway 已经在运行是什么意思](#gateway-已经在运行是什么意思)
- [在同一机器上运行多个 gateway 实例](#在同一机器上运行多个-gateway-实例)
- [什么是 invalid handshake / code 1008](#什么是-invalid-handshake--code-1008)
- [Gateway 使用什么端口](#gateway-使用什么端口)
- [为什么 openclaw gateway status 显示 Runtime running 但 RPC probe failed](#为什么-openclaw-gateway-status-显示-runtime-running-但-rpc-probe-failed)
- [如何以远程模式运行 OpenClaw](#如何以远程模式运行-openclaw)
- [Control UI 显示 unauthorized，怎么办](#control-ui-显示-unauthorized怎么办)

**日志和调试**

- [日志在哪里](#日志在哪里)
- [如何启动/停止/重启 Gateway 服务](#如何启动停止重启-gateway-服务)
- [我关闭了 Windows 终端，如何重启 OpenClaw](#我关闭了-windows-终端如何重启-openclaw)
- [Gateway 正在运行但回复从未到达，检查什么](#gateway-正在运行但回复从未到达检查什么)
- [无原因断开 gateway 连接，怎么办](#无原因断开-gateway-连接怎么办)
- [Telegram setMyCommands 失败，检查什么](#telegram-setmycommands-失败检查什么)
- [TUI 没有显示输出，检查什么](#tui-没有显示输出检查什么)
- [如何完全停止然后启动 Gateway](#如何完全停止然后启动-gateway)
- [ELI5：openclaw gateway restart 和 openclaw gateway 的区别](#eli5openclaw-gateway-restart-和-openclaw-gateway-的区别)
- [当出错时最快获取更多详情的方法是什么](#当出错时最快获取更多详情的方法是什么)

**Media 和附件**

- [我的 skill 生成了 imagePDF 但什么都没有发送](#我的-skill-生成了-imagepdf-但什么都没有发送)

**安全和访问控制**

- [将 OpenClaw 暴露给入站 DMs 安全吗](#将-openclaw-暴露给入站-dms-安全吗)
- [Prompt injection 只是公共 bot 的问题吗](#prompt-injection-只是公共-bot-的问题吗)
- [我的 bot 应该有自己的 email、GitHub 账户或电话号码吗](#我的-bot-应该有自己的-emailgithub-账户或电话号码吗)
- [我可以给它对我短信的自主权吗，这安全吗](#我可以给它对我短信的自主权吗这安全吗)
- [我可以为个人助手任务使用更便宜的 models 吗](#我可以为个人助手任务使用更便宜的-models-吗)
- [我在 Telegram 中运行了 start 但没有收到配对码](#我在-telegram-中运行了-start-但没有收到配对码)
- [WhatsApp 会给我的联系人发消息吗，配对是如何工作的](#whatsapp-会给我的联系人发消息吗配对是如何工作的)

**聊天命令、中止任务和"它不会停止"**

- [如何阻止内部系统消息在聊天中显示](#如何阻止内部系统消息在聊天中显示)
- [如何停止/取消正在运行的任务](#如何停止取消正在运行的任务)
- [如何从 Telegram 发送 Discord 消息——跨 context 消息被拒绝](#如何从-telegram-发送-discord-消息跨-context-消息被拒绝)
- [为什么 bot 感觉像在忽略快速连发消息](#为什么-bot-感觉像在忽略快速连发消息)

**杂项**

- [Anthropic 使用 API key 的默认 model 是什么](#anthropic-使用-api-key-的默认-model-是什么)

---

## 前 60 秒调试

### 什么都不起作用，从哪里开始

从快速状态检查开始：

```bash
openclaw status
openclaw models status
openclaw channels status
openclaw logs --follow
```

如果任何一项显示错误：

1. **没有 model 凭据**：运行 `openclaw onboard` 设置 API key 或 OAuth 登录。
2. **Gateway 未运行**：运行 `openclaw gateway status`；如果已停止，运行 `openclaw gateway restart`（已安装服务）或 `openclaw gateway run`（前台模式）。
3. **Channel 未配对**：运行 `openclaw pairing list`，批准待处理的配对码。

如果仍然卡住，尾随日志：

```bash
openclaw logs --follow
```

然后发送一条测试消息并查看日志中显示的内容。

参见 [调试](/help/debugging)、[Gateway](/gateway)、[Channels](/channels)。

---

## 快速入门

### OpenClaw 最快的入门方式是什么

运行引导向导：

```bash
openclaw onboard
```

向导将引导你配置 API key（或 OAuth 登录）、安装 gateway 服务并连接到第一个 channel。请参阅 [入门](/start)。

### 我安装了 OpenClaw。下一步是什么

运行引导向导：

```bash
openclaw onboard
```

它会引导你完成：连接到 AI provider、启动 gateway 并将 bot 添加到 Telegram、Discord、WhatsApp 等。

参见 [入门](/start)。

### 我运行了 openclaw onboard 但没有 Anthropic 密钥。我可以用 OpenAI 或 OpenRouter 吗

可以。向导支持多个 providers。在 provider 选择步骤，选择：

- **OpenAI Code（Codex）**——通过 OAuth 的免费订阅（无需 API key）
- **OpenAI API** — API key
- **OpenRouter** — 一个 key 访问多个 models
- **Anthropic** — API key 或 `claude setup-token`

参见 [Model Providers](/concepts/model-providers)。

### onboard 给了我 OpenAI Code 登录——那是什么

OpenAI Code（也称为 Codex）是 OpenAI 提供的免费层，允许你通过 OAuth 访问 AI models，无需 API key 或付费计划。OpenClaw 支持这种登录流程作为快速入门方式。

参见 [Model Providers](/concepts/model-providers)。

### 向导完成后 gateway 没有运行怎么办

手动启动：

```bash
openclaw gateway run
```

或者，如果你想将其作为服务安装：

```bash
openclaw gateway install
openclaw gateway start
```

参见 [Gateway](/gateway)。

### 向导要求 phone number——为什么

这是针对 WhatsApp 的：你的 phone number 被设置为你的**所有者/允许列表**身份，这样你自己的 DMs 就被自动允许，而不需要配对码。它**不**用于自动发送消息。

如果你不使用 WhatsApp，你可以跳过这一步。

### 我想跳过向导直接使用。最小配置是什么

最小 `openclaw.json`：

```json5
{
  gateway: { mode: "local" },
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-5" },
    },
  },
}
```

加上你的 API key（在 `config set` 中或通过 env var）。然后运行 `openclaw gateway run`。

参见 [配置](/gateway/configuration)。

### 我更新了 openclaw.json 但什么都没变

Gateway 在启动时读取配置。要应用更改：

```bash
openclaw gateway restart
```

或者在前台运行时，Ctrl-C 然后重新运行 `openclaw gateway run`。

### Gateway 无法启动、立即崩溃或找不到配置

1. 检查配置有效性：`openclaw config validate`
2. 检查端口是否被占用：`openclaw gateway status`
3. 用 `--verbose` 查看完整错误：`openclaw gateway run --verbose`
4. 运行 `openclaw doctor` 检查常见配置问题。

参见 [Gateway 故障排除](/gateway/troubleshooting)。

### openclaw onboard 和 openclaw setup 有什么区别

- **`openclaw onboard`**：完整向导，从头开始——设置 model、auth、gateway 服务、channels。第一次使用时推荐。
- **`openclaw setup`**：较轻的命令，针对特定设置步骤（例如连接单个 channel 或添加 API key）。

### 我应该使用 WSL2 还是 Native Windows

**WSL2 是推荐路径**。它在 Windows 上运行一个真正的 Linux 环境，所有 Linux 文档和工具直接适用。

Native Windows 是支持的但不太经过测试。如果你知道你在做什么，可以使用 native Windows；否则坚持使用 WSL2。

参见 [Windows 平台](/platforms/windows)。

### 什么都不起作用

按顺序尝试：

1. `openclaw doctor`——检查常见配置问题
2. `openclaw status`——查看 gateway + auth + channel 状态
3. `openclaw logs --follow`——实时尾随日志
4. 如果有疑问，重新运行 `openclaw onboard`

在 [Discord](https://discord.com/invite/clawd) 社区寻求帮助，或打开 [GitHub 讨论](https://github.com/openclaw/openclaw/discussions)。

### 我卡住了，最快的解决方法是什么

使用能够**看到你的机器**的本地 AI agent。这比在 Discord 中询问有效得多，因为大多数"我卡住了"的情况都是**本地配置或环境问题**，远程帮助者无法检查。

- **Claude Code**: [https://www.anthropic.com/claude-code/](https://www.anthropic.com/claude-code/)
- **OpenAI Codex**: [https://openai.com/codex/](https://openai.com/codex/)

这些工具可以读取代码库、运行命令、检查日志，并帮助修复你的机器级设置（PATH、服务、权限、auth 文件）。通过 hackable (git) 安装为它们提供**完整的源代码检出**：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

这会从 git checkout 安装 OpenClaw，这样 agent 就可以读取代码和文档，并推断你正在运行的确切版本。

提示：让 agent **计划并监督**修复（逐步执行），然后只执行必要的命令。这样可以保持更改小且易于审计。

从这些命令开始（寻求帮助时分享输出）：

```bash
openclaw status
openclaw models status
openclaw doctor
```

其他有用的 CLI 检查：`openclaw status --all`、`openclaw logs --follow`、`openclaw gateway status`、`openclaw health --verbose`。

快速调试循环：[出问题后的前 60 秒](#前-60-秒调试)。安装文档：[Install](/install)、[Installer flags](/install/installer)、[Updating](/install/updating)。

### 安装和设置 OpenClaw 的推荐方式

推荐从源代码运行并使用 onboarding：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
openclaw onboard --install-daemon
```

向导还可以自动构建 UI 资源。Onboarding 完成后，你通常在端口 **18789** 上运行 Gateway。

从源代码（贡献者/开发模式）：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build # 第一次运行时自动安装 UI 依赖
openclaw onboard
```

### onboarding 后如何打开 dashboard

向导在 onboarding 完成后立即用干净的（非 token 化的）dashboard URL 打开浏览器，并在摘要中打印链接。保持该标签页打开；如果没有启动，在同一台机器上复制/粘贴打印的 URL。

### 如何在本地与远程验证 dashboard（token）

**本地（同一台机器）：**

- 打开 `http://127.0.0.1:18789/`。
- 如果要求 auth，将 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）的 token 粘贴到 Control UI 设置中。
- 从 gateway 主机获取：`openclaw config get gateway.auth.token`（或生成一个：`openclaw doctor --generate-gateway-token`）。

**不在 localhost 上：**

- **Tailscale Serve**（推荐）：保持 bind loopback，运行 `openclaw gateway --tailscale serve`，打开 `https://<magicdns>/`。
- **Tailnet bind**：运行 `openclaw gateway --bind tailnet --token "<token>"`，打开 `http://<tailscale-ip>:18789/`，在 dashboard 设置中粘贴 token。
- **SSH 隧道**：`ssh -N -L 18789:127.0.0.1:18789 user@host` 然后打开 `http://127.0.0.1:18789/` 并在 Control UI 设置中粘贴 token。

参见 [Dashboard](/web/dashboard) 和 [Web surfaces](/web)。

### 我需要什么运行时

需要 Node **>= 22**。推荐使用 `pnpm`。不推荐在 Gateway 中使用 Bun。

### 它能在 Raspberry Pi 上运行吗

可以。Gateway 很轻量——文档列出 **512MB-1GB RAM**、**1 核**和约 **500MB** 磁盘就足够个人使用，并指出 **Raspberry Pi 4 可以运行它**。

如果你想要额外空间（日志、媒体、其他服务），**推荐 2GB**，但这不是硬性最低要求。

提示：小型 Pi/VPS 可以托管 Gateway，你可以在笔记本/手机上配对 **nodes** 进行本地屏幕/相机/canvas 或命令执行。参见 [Nodes](/nodes)。

### Raspberry Pi 安装有什么提示

简短版本：它能运行，但预计会有一些粗糙的地方。

- 使用 **64 位** OS 并保持 Node >= 22。
- 优先使用 **hackable (git) 安装**，这样你可以查看日志并快速更新。
- 从没有 channels/skills 开始，然后逐个添加。
- 如果遇到奇怪的二进制问题，通常是 **ARM 兼容性**问题。

文档：[Linux](/platforms/linux)、[Install](/install)。

### 它卡在"唤醒我的朋友"/ onboarding 不会启动，怎么办

该屏幕取决于 Gateway 是否可达且已通过身份验证。TUI 也会在第一次启动时自动发送"Wake up, my friend!"。如果你看到该行**没有回复**且 token 保持为 0，则 agent 从未运行。

1. 重启 Gateway：

```bash
openclaw gateway restart
```

2. 检查状态和 auth：

```bash
openclaw status
openclaw models status
openclaw logs --follow
```

3. 如果仍然挂起，运行：

```bash
openclaw doctor
```

如果 Gateway 是远程的，请确保隧道/Tailscale 连接正常，并且 UI 指向正确的 Gateway。参见 [远程访问](/gateway/remote)。

### 我可以将设置迁移到新机器而不重新进行 onboarding 吗

可以。复制**状态目录**和**工作区**，然后运行 Doctor 一次。只要你复制**两个**位置，这就能保持你的 bot "完全相同"（memory、session 历史、auth 和 channel 状态）：

1. 在新机器上安装 OpenClaw。
2. 从旧机器复制 `$OPENCLAW_STATE_DIR`（默认：`~/.openclaw`）。
3. 复制你的工作区（默认：`~/.openclaw/workspace`）。
4. 运行 `openclaw doctor` 并重启 Gateway 服务。

这会保留配置、auth profiles、WhatsApp 凭证、sessions 和 memory。

**重要：** 如果你只将工作区提交/推送到 GitHub，你是在备份 **memory + bootstrap 文件**，但**不是** session 历史或 auth。这些保存在 `~/.openclaw/` 下。

参见 [迁移](/install/migrating)、[磁盘上的文件位置](#磁盘上的文件位置)。

### 在哪里查看最新版本的新功能

查看 GitHub 更新日志：[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

最新条目在顶部。如果顶部部分标记为 **Unreleased**，则下一个带日期的部分是最新发布版本。

### 无法访问 docs.openclaw.ai（SSL 错误）

一些 Comcast/Xfinity 连接通过 Xfinity Advanced Security 错误地阻止了 `docs.openclaw.ai`。禁用它或将 `docs.openclaw.ai` 加入白名单，然后重试。

如果仍然无法访问该站点，文档在 GitHub 上有镜像：[https://github.com/openclaw/openclaw/tree/main/docs](https://github.com/openclaw/openclaw/tree/main/docs)

### stable 和 beta 的区别

**Stable** 和 **beta** 是 **npm dist-tags**，不是单独的代码分支：

- `latest` = stable
- `beta` = 早期构建用于测试

我们将构建发送到 **beta**，测试它们，一旦构建稳定，就将**相同版本提升到 `latest`**。这就是为什么 beta 和 stable 可以指向**相同版本**。

更新日志：[https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md](https://github.com/openclaw/openclaw/blob/main/CHANGELOG.md)

### 如何安装 beta 版本，beta 和 dev 有什么区别

**Beta** 是 npm dist-tag `beta`（可能与 `latest` 相同）。**Dev** 是 `main` 的移动头（git）；发布时使用 npm dist-tag `dev`。

一行命令（macOS/Linux）：

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --beta
```

```bash
curl -fsSL --proto '=https' --tlsv1.2 https://openclaw.ai/install.sh | bash -s -- --install-method git
```

更多详情：[Development channels](/install/development-channels) 和 [Installer flags](/install/installer)。

### 如何尝试最新版本

两种选项：

1. **Dev channel（git checkout）：**

```bash
openclaw update --channel dev
```

这会切换到 `main` 分支并从源代码更新。

2. **Hackable 安装（从安装站点）：**

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method git
```

这给你一个可以编辑的本地代码库，然后通过 git 更新。

文档：[Update](/cli/update)、[Development channels](/install/development-channels)、[Install](/install)。

### 安装和 onboarding 通常需要多长时间

粗略指南：

- **安装：** 2-5 分钟
- **Onboarding：** 5-15 分钟，取决于你配置多少 channels/models

### 安装程序卡住了？如何获得更多反馈

使用**详细输出**重新运行安装程序：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --verbose
```

Beta 安装加详细输出：

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --beta --verbose
```

更多选项：[Installer flags](/install/installer)。

### Windows 安装提示说找不到 git 或无法识别 openclaw

两个常见的 Windows 问题：

**1) npm error spawn git / git not found**

- 安装 **Git for Windows** 并确保 `git` 在你的 PATH 中。
- 关闭并重新打开 PowerShell，然后重新运行安装程序。

**2) 安装后无法识别 openclaw**

- 你的 npm global bin 文件夹不在 PATH 中。
- 检查路径：

  ```powershell
  npm config get prefix
  ```

- 将该目录添加到你的用户 PATH（在 Windows 上通常是 `%AppData%\npm`）。
- 更新 PATH 后关闭并重新打开 PowerShell。

如果你想要最顺畅的 Windows 设置，使用 **WSL2** 而不是原生 Windows。文档：[Windows](/platforms/windows)。

### Windows exec 输出显示乱码中文——怎么办

这通常是原生 Windows shell 上的控制台代码页不匹配问题。

在 PowerShell 中的快速解决方法：

```powershell
chcp 65001
[Console]::InputEncoding = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
```

然后重启 Gateway 并重试你的命令：

```powershell
openclaw gateway restart
```

### 文档没有回答我的问题——如何获得更好的答案

使用 **hackable (git) 安装**，这样你就有完整的源代码和文档在本地，然后从该文件夹向你的 bot（或 Claude/Codex）提问，这样它就可以读取代码库并精确回答。

### 如何在 Linux 上安装 OpenClaw

简短答案：遵循 Linux 指南，然后运行 onboarding。

- Linux 快速路径 + 服务安装：[Linux](/platforms/linux)。
- 完整演练：[Getting Started](/start/getting-started)。
- 安装和更新：[Install & updates](/install/updating)。

### 如何在 VPS 上安装 OpenClaw

任何 Linux VPS 都可以。在服务器上安装，然后使用 SSH/Tailscale 访问 Gateway。

指南：[exe.dev](/install/exe-dev)、[Hetzner](/install/hetzner)、[Fly.io](/install/fly)。远程访问：[Gateway remote](/gateway/remote)。

### 云/VPS 安装指南在哪里

我们维护一个**托管中心**，包含常见提供商。选择一个并遵循指南：

- [VPS hosting](/vps)（所有提供商在一个地方）
- [Fly.io](/install/fly)
- [Hetzner](/install/hetzner)
- [exe.dev](/install/exe-dev)

云中的工作原理：**Gateway 在服务器上运行**，你通过 Control UI（或 Tailscale/SSH）从笔记本/手机访问它。你的状态和工作区保存在服务器上，所以把主机视为真实来源并备份它。

### 我可以让 OpenClaw 自我更新吗

简短答案：**可以，但不推荐**。更新流程可以重启 Gateway（这会断开活动 session），可能需要干净的 git checkout，并且可以提示确认。更安全：从 shell 以操作员身份运行更新。

使用 CLI：

```bash
openclaw update
openclaw update status
openclaw update --channel stable|beta|dev
openclaw update --tag <dist-tag|version>
openclaw update --no-restart
```

文档：[Update](/cli/update)、[Updating](/install/updating)。

### onboarding 实际上做了什么

`openclaw onboard` 是推荐的设置路径。在**本地模式**下，它引导你完成：

- **Model/auth 设置**（支持 provider OAuth/setup-token 流程和 API keys，以及 LM Studio 等本地 model 选项）
- **工作区**位置和 bootstrap 文件
- **Gateway 设置**（bind/port/auth/tailscale）
- **Providers**（WhatsApp、Telegram、Discord、Mattermost（插件）、Signal、iMessage）
- **Daemon 安装**（macOS 上的 LaunchAgent；Linux/WSL2 上的 systemd 用户单元）
- **健康检查**和 **skills** 选择

如果你配置的 model 未知或缺少 auth，它也会发出警告。

### 我需要 Claude 或 OpenAI 订阅才能运行吗

不需要。你可以使用 **API keys**（Anthropic/OpenAI/其他）或使用**仅本地 models** 运行 OpenClaw，这样你的数据就保留在你的设备上。订阅（Claude Pro/Max 或 OpenAI Codex）是验证这些提供商的可选方式。

对于 OpenClaw 中的 Anthropic，实际区别是：

- **Anthropic API key**：正常的 Anthropic API 计费
- **OpenClaw 中的 Claude 订阅 auth**：Anthropic 于 **2026 年 4 月 4 日 PT 时间下午 12:00 / BST 晚上 8:00** 通知 OpenClaw 用户，这需要单独计费的**额外使用**

我们本地的复现也显示，当追加的提示标识了 OpenClaw 时，`claude -p --append-system-prompt ...` 会触发相同的额外使用限制，而在 Anthropic SDK + API key 路径上使用相同的提示字符串**不会**触发该限制。OpenAI Codex OAuth 明确支持在 OpenClaw 等外部工具中使用。

OpenClaw 还支持其他托管订阅式选项，包括 **Qwen Cloud Coding Plan**、**MiniMax Coding Plan** 和 **Z.AI / GLM Coding Plan**。

文档：[Anthropic](/providers/anthropic)、[OpenAI](/providers/openai)、[Qwen Cloud](/providers/qwen)、[MiniMax](/providers/minimax)、[GLM Models](/providers/glm)、[Local models](/gateway/local-models)、[Models](/concepts/models)。

### 我可以在没有 API key 的情况下使用 Claude Max 订阅吗

可以，但将其视为**需要额外使用的 Claude 订阅 auth**。

Claude Pro/Max 订阅不包括 API key。在 OpenClaw 中，这意味着 Anthropic 特定的计费通知适用：订阅流量需要**额外使用**。如果你想要没有额外使用路径的 Anthropic 流量，请改用 Anthropic API key。

### 你支持 Claude 订阅 auth（Claude Pro 或 Max）吗

是的，但现在支持的解释是：

- OpenClaw 中使用订阅的 Anthropic 意味着**额外使用**
- OpenClaw 中不使用该路径的 Anthropic 意味着 **API key**

Anthropic setup-token 仍然作为旧版/手动的 OpenClaw 路径可用，Anthropic 的 OpenClaw 特定计费通知仍然适用。我们还本地复现了直接使用 `claude -p --append-system-prompt ...` 时出现的相同计费限制，当追加的提示标识了 OpenClaw 时，而在 Anthropic SDK + API key 路径上使用相同的提示字符串则**没有**出现该限制。

对于生产环境或多用户工作负载，Anthropic API key auth 是更安全、推荐的选择。如果你想要 OpenClaw 中其他订阅式托管选项，请参阅 [OpenAI](/providers/openai)、[Qwen / Model Cloud](/providers/qwen)、[MiniMax](/providers/minimax) 和 [GLM Models](/providers/glm)。

### 为什么我看到来自 Anthropic 的 HTTP 429 rate_limit_error

这意味着你的 **Anthropic 配额/速率限制**在当前窗口内已耗尽。如果你使用 **Claude CLI**，等待窗口重置或升级你的计划。如果你使用 **Anthropic API key**，请检查 Anthropic Console 的使用/账单并根据需要提高限制。

如果消息具体是：`Extra usage is required for long context requests`，则请求正在尝试使用 Anthropic 的 1M 上下文 beta（`context1m: true`）。这仅在你的凭证符合长上下文计费资格时才有效（API key 计费或带额外使用的 OpenClaw Claude 登录路径）。

提示：设置**备用 model**，这样 OpenClaw 在 provider 受到速率限制时可以继续回复。参见 [Models](/cli/models)、[OAuth](/concepts/oauth) 和 [/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context](/gateway/troubleshooting#anthropic-429-extra-usage-required-for-long-context)。

### 支持 AWS Bedrock 吗

是的。OpenClaw 有一个捆绑的 **Amazon Bedrock (Converse)** provider。有 AWS 环境标记时，OpenClaw 可以自动发现流式/文本 Bedrock 目录并将其合并为隐式的 `amazon-bedrock` provider；否则你可以明确启用 `plugins.entries.amazon-bedrock.config.discovery.enabled` 或添加手动 provider 条目。参见 [Amazon Bedrock](/providers/bedrock) 和 [Model providers](/providers/models)。如果你偏好托管的密钥流程，在 Bedrock 前放一个 OpenAI 兼容代理仍然是有效的选项。

### Codex auth 如何工作

OpenClaw 通过 OAuth（ChatGPT 登录）支持 **OpenAI Code (Codex)**。Onboarding 可以运行 OAuth 流程，并在适当时将默认 model 设置为 `openai-codex/gpt-5.4`。参见 [Model providers](/concepts/model-providers) 和 [Onboarding (CLI)](/start/wizard)。

### 你支持 OpenAI 订阅 auth（Codex OAuth）吗

是的。OpenClaw 完全支持 **OpenAI Code (Codex) 订阅 OAuth**。OpenAI 明确允许在 OpenClaw 等外部工具/工作流中使用订阅 OAuth。Onboarding 可以为你运行 OAuth 流程。

参见 [OAuth](/concepts/oauth)、[Model providers](/concepts/model-providers) 和 [Onboarding (CLI)](/start/wizard)。

### 如何设置 Gemini CLI OAuth

Gemini CLI 使用**插件 auth 流程**，而不是 `openclaw.json` 中的 client id 或 secret。

步骤：

1. 启用插件：`openclaw plugins enable google`
2. 登录：`openclaw models auth login --provider google-gemini-cli --set-default`

这将 OAuth tokens 存储在 gateway 主机的 auth profiles 中。详情：[Model providers](/concepts/model-providers)。

### 本地 model 适合日常聊天吗

通常不适合。OpenClaw 需要大上下文和强大的安全性；小型 model 会截断并泄漏。如果必须，在本地运行你能运行的**最大** MiniMax M2.5 构建（LM Studio），并参见 [/gateway/local-models](/gateway/local-models)。较小/量化的 models 会增加 prompt injection 风险——参见 [Security](/gateway/security)。

### 我必须购买 Mac Mini 才能安装吗

不。OpenClaw 在 macOS 或 Linux（通过 WSL2 的 Windows）上运行。Mac mini 是可选的——有些人把它作为始终开启的主机，但小型 VPS、家庭服务器或 Raspberry Pi 级别的设备也可以。

只有在需要 **macOS 专用工具**时才需要 Mac。对于 iMessage，使用 [BlueBubbles](/channels/bluebubbles)（推荐）——BlueBubbles 服务器在任何 Mac 上运行，而 Gateway 可以在 Linux 或其他地方运行。

文档：[BlueBubbles](/channels/bluebubbles)、[Nodes](/nodes)、[Mac remote mode](/platforms/mac/remote)。

### 我需要 Mac mini 来支持 iMessage 吗

你需要**某个登录了 Messages 的 macOS 设备**。它**不必**是 Mac mini——任何 Mac 都可以。对于 iMessage，推荐使用 **[BlueBubbles](/channels/bluebubbles)**——BlueBubbles 服务器在 macOS 上运行，而 Gateway 可以在 Linux 或其他地方运行。

常见设置：

- 在 Linux/VPS 上运行 Gateway，在登录了 Messages 的任何 Mac 上运行 BlueBubbles 服务器。
- 如果你想要最简单的单机设置，在 Mac 上运行所有内容。

文档：[BlueBubbles](/channels/bluebubbles)、[Nodes](/nodes)、[Mac remote mode](/platforms/mac/remote)。

### 如果我购买了 Mac mini 来运行 OpenClaw，可以将其连接到我的 MacBook Pro 吗

可以。**Mac mini 可以运行 Gateway**，你的 MacBook Pro 可以作为**node**（伴随设备）连接。Nodes 不运行 Gateway——它们在该设备上提供额外的功能，如屏幕/相机/canvas 和 `system.run`。

常见模式：

- Gateway 在 Mac mini 上（始终开启）。
- MacBook Pro 运行 macOS 应用或 node host 并配对到 Gateway。
- 使用 `openclaw nodes status` / `openclaw nodes list` 查看它。

文档：[Nodes](/nodes)、[Nodes CLI](/cli/nodes)。

### 我可以使用 Bun 吗

**不推荐**使用 Bun。我们看到运行时错误，特别是在 WhatsApp 和 Telegram 中。对于稳定的 gateways，使用 **Node**。

### Telegram：allowFrom 里放什么

`channels.telegram.allowFrom` 是**人类发件人的 Telegram 用户 ID**（数字）。它不是 bot 用户名。

Onboarding 接受 `@username` 输入并将其解析为数字 ID，但 OpenClaw 授权只使用数字 ID。

更安全的方式（不需要第三方 bot）：

- 给你的 bot 发 DM，然后运行 `openclaw logs --follow` 并读取 `from.id`。

官方 Bot API：

- 给你的 bot 发 DM，然后调用 `https://api.telegram.org/bot<bot_token>/getUpdates` 并读取 `message.from.id`。

参见 [/channels/telegram](/channels/telegram#access-control-and-activation)。

### 多人可以使用一个 WhatsApp 号码配合不同的 OpenClaw 实例吗

可以，通过**多 agent 路由**。将每个发件人的 WhatsApp **DM**（peer `kind: "direct"`，发件人 E.164 如 `+15551234567`）绑定到不同的 `agentId`，这样每个人都有自己的工作区和 session store。回复仍然来自**同一个 WhatsApp 账户**。参见 [Multi-Agent Routing](/concepts/multi-agent) 和 [WhatsApp](/channels/whatsapp)。

### 我可以运行"快速聊天"agent 和"Opus 用于编程"agent 吗

可以。使用多 agent 路由：给每个 agent 自己的默认 model，然后将入站路由（provider 账户或特定 peers）绑定到每个 agent。示例配置在 [Multi-Agent Routing](/concepts/multi-agent) 中。参见 [Models](/concepts/models) 和 [Configuration](/gateway/configuration)。

### Homebrew 在 Linux 上可以工作吗

可以。Homebrew 支持 Linux（Linuxbrew）。快速设置：

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.profile
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
brew install <formula>
```

如果你通过 systemd 运行 OpenClaw，请确保服务 PATH 包含 `/home/linuxbrew/.linuxbrew/bin`（或你的 brew 前缀），这样 `brew` 安装的工具在非登录 shell 中也能解析。

### hackable git 安装和 npm 安装的区别

- **Hackable (git) 安装：** 完整的源代码检出，可编辑，最适合贡献者。你在本地运行构建，可以修补代码/文档。
- **npm 安装：** 全局 CLI 安装，没有代码库，最适合"直接运行"。更新来自 npm dist-tags。

文档：[Getting started](/start/getting-started)、[Updating](/install/updating)。

### 我以后可以在 npm 和 git 安装之间切换吗

可以。安装另一种方式，然后运行 Doctor，这样 gateway 服务就指向新的入口点。这**不会删除你的数据**——它只更改 OpenClaw 代码安装。你的状态（`~/.openclaw`）和工作区（`~/.openclaw/workspace`）保持不变。

从 npm 切换到 git：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
openclaw doctor
openclaw gateway restart
```

从 git 切换到 npm：

```bash
npm install -g openclaw@latest
openclaw doctor
openclaw gateway restart
```

Doctor 检测到 gateway 服务入口点不匹配，并提供重写服务配置以匹配当前安装（在自动化中使用 `--repair`）。

### 我应该在笔记本上还是 VPS 上运行 Gateway

简短答案：**如果你想要 24/7 可靠性，使用 VPS**。如果你可以接受睡眠/重启，在本地运行。

**笔记本（本地 Gateway）**

- **优点：** 无服务器成本，直接访问本地文件，实时浏览器窗口。
- **缺点：** 睡眠/网络断开 = 断开连接，OS 更新/重启会中断，必须保持唤醒。

**VPS / 云**

- **优点：** 始终开启，稳定网络，无笔记本睡眠问题，更容易保持运行。
- **缺点：** 通常无头运行（使用截图），只能远程访问文件，必须通过 SSH 进行更新。

**推荐默认：** 如果你之前有 gateway 断开连接，使用 VPS。当你积极使用 Mac 并想要本地文件访问或带可见浏览器的 UI 自动化时，本地很好。

### 在专用机器上运行 OpenClaw 有多重要

不是必需的，但**推荐用于可靠性和隔离性**。

- **专用主机（VPS/Mac mini/Pi）：** 始终开启，睡眠/重启中断更少，权限更简洁，更容易保持运行。
- **共享笔记本/台式机：** 完全适合测试和主动使用，但当机器睡眠或更新时预计会有停顿。

如果你想两全其美，在专用主机上保留 Gateway，并将笔记本配对为**node** 以使用本地屏幕/相机/exec 工具。参见 [Nodes](/nodes)。

### 最低 VPS 要求和推荐 OS 是什么

OpenClaw 很轻量。对于基本 Gateway + 一个聊天 channel：

- **绝对最低：** 1 vCPU、1GB RAM、~500MB 磁盘。
- **推荐：** 1-2 vCPU、2GB RAM 或更多以留有余量（日志、媒体、多个 channels）。Node 工具和浏览器自动化可能会消耗大量资源。

OS：使用 **Ubuntu LTS**（或任何现代 Debian/Ubuntu）。Linux 安装路径在那里测试得最好。

文档：[Linux](/platforms/linux)、[VPS hosting](/vps)。

### 我可以在 VM 中运行 OpenClaw 吗，要求是什么

可以。将 VM 与 VPS 同等对待：它需要始终开启、可访问，并且有足够的 RAM 用于 Gateway 和你启用的任何 channels。

基准指导：

- **绝对最低：** 1 vCPU、1GB RAM。
- **推荐：** 2GB RAM 或更多，如果你运行多个 channels、浏览器自动化或媒体工具。
- **OS：** Ubuntu LTS 或其他现代 Debian/Ubuntu。

如果你在 Windows 上，**WSL2 是最简单的 VM 风格设置**，具有最好的工具兼容性。参见 [Windows](/platforms/windows)、[VPS hosting](/vps)。

---

## OpenClaw 是什么

### OpenClaw 和 pi-coding-agent 有什么区别

pi-coding-agent 是 Anthropic 的 CLI（命令行工具），在你的终端中运行一次性编码会话。

OpenClaw 在其上构建，并增加：

- **持久的 Gateway**，保持 24/7 运行并通过多个 channels 路由消息
- **Channels**：Telegram、Discord、WhatsApp、iMessage、Signal 等
- **多 agent 支持**、skills、memory、工作流
- **配置驱动的**行为，可自定义的 system prompt、工具策略、沙盒

把 pi-coding-agent 想象成引擎；OpenClaw 是围绕它的完整 bot 平台。

### Gateway 是什么，为什么需要它

Gateway 是保持运行的核心服务进程，它：

- 通过 channels 路由入站消息到 AI agent
- 将 AI 回复发回给发送者
- 管理 sessions、memory、工具执行

你不需要它来运行 `openclaw tui`，但如果你想要始终在线的 bot（通过 Telegram、Discord 等可访问），你需要它。

参见 [Gateway](/gateway)。

### 什么是 Channels

Channels 是 OpenClaw 接收和发送消息的位置：Telegram、Discord、WhatsApp、iMessage、Signal、Web（内置）等。

你可以连接多个 channels，每个都有自己的配置（配对策略、允许列表等）。

参见 [Channels](/channels)。

### 我可以不用 Telegram、Discord 或 WhatsApp 吗

可以。内置的 **TUI**（终端界面）和 **Web UI**（Dashboard）无需任何外部 channel 账户即可工作。

```bash
openclaw tui
openclaw dashboard
```

你甚至可以在没有任何 channel 配置的情况下以"仅本地"模式运行 OpenClaw。

### OpenClaw 需要 VPS 吗

不需要。你可以在笔记本上或任何始终开机的机器上在本地运行它。如果你想要始终可访问的 bot，VPS 或家用服务器非常适合，但这不是必需的。

### 用一段话介绍 OpenClaw

OpenClaw 是一个运行在你自己设备上的个人 AI 助手。它在你已经使用的消息平台上回复（WhatsApp、Telegram、Slack、Mattermost（插件）、Discord、Google Chat、Signal、iMessage、WebChat），在支持的平台上还可以进行语音和实时 Canvas。**Gateway** 是始终开启的控制平面；助手是产品。

### OpenClaw 的价值主张

OpenClaw 不是"只是一个 Claude 包装器"。它是一个**本地优先的控制平面**，让你在**自己的硬件**上运行强大的助手，可从你已经使用的聊天应用访问，具有有状态 sessions、memory 和工具——无需将你的工作流控制权交给托管 SaaS。

亮点：

- **你的设备，你的数据：** 在任何地方运行 Gateway（Mac、Linux、VPS）并将工作区和 session 历史保存在本地。
- **真实 channels，而不是 web 沙盒：** WhatsApp/Telegram/Slack/Discord/Signal/iMessage 等，以及支持平台上的移动语音和 Canvas。
- **模型无关：** 使用 Anthropic、OpenAI、MiniMax、OpenRouter 等，支持每个 agent 的路由和 failover。
- **仅本地选项：** 运行本地 models，这样**所有数据都可以保留在你的设备上**（如果你想要）。
- **多 agent 路由：** 每个 channel、账户或任务都有独立的 agent，每个都有自己的工作区和默认值。
- **开源和可定制：** 无供应商锁定地检查、扩展和自托管。

文档：[Gateway](/gateway)、[Channels](/channels)、[Multi-agent](/concepts/multi-agent)、[Memory](/concepts/memory)。

### 我刚设置好——首先应该做什么

好的第一个项目：

- 构建一个网站（WordPress、Shopify 或简单的静态站点）。
- 原型化一个移动应用（大纲、屏幕、API 计划）。
- 整理文件和文件夹（清理、命名、标记）。
- 连接 Gmail 并自动化摘要或跟进。

它可以处理大型任务，但当你将它们分割成阶段并使用子 agents 进行并行工作时效果最好。

### OpenClaw 最常见的五大日常用例是什么

日常胜利通常看起来像：

- **个人简报：** 收件箱、日历和你关心的新闻摘要。
- **研究和起草：** 快速研究、摘要和电子邮件或文档的初稿。
- **提醒和跟进：** cron 或心跳驱动的提示和清单。
- **浏览器自动化：** 填写表单、收集数据和重复 web 任务。
- **跨设备协调：** 从手机发送任务，让 Gateway 在服务器上运行它，并在聊天中获得结果。

### OpenClaw 可以帮助 SaaS 的线索生成、外展、广告和博客吗

可以用于**研究、资质评估和起草**。它可以扫描网站、构建候选名单、总结潜在客户，并撰写外展或广告文案草稿。

对于**外展或广告运行**，保持人工参与循环。避免垃圾邮件，遵守当地法律和平台政策，并在发送之前审查任何内容。最安全的模式是让 OpenClaw 起草，你来批准。

文档：[Security](/gateway/security)。

### 与 Claude Code 相比，OpenClaw 在 web 开发方面有什么优势

OpenClaw 是一个**个人助手**和协调层，而不是 IDE 替代品。在 repo 内使用 Claude Code 或 Codex 进行最快的直接编码循环。当你想要持久 memory、跨设备访问和工具编排时使用 OpenClaw。

优势：

- **跨 sessions 的持久 memory 和工作区**
- **多平台访问**（WhatsApp、Telegram、TUI、WebChat）
- **工具编排**（浏览器、文件、调度、hooks）
- **始终开启的 Gateway**（在 VPS 上运行，从任何地方交互）
- **Nodes** 用于本地浏览器/屏幕/相机/exec

展示：[https://openclaw.ai/showcase](https://openclaw.ai/showcase)

---

## Skills 和自动化

### 什么是 Skills，它们如何工作

Skills 是给 agent 额外能力的指令包。当你运行 `/skill load foo` 时，OpenClaw 将 `foo.md` 的内容注入到 system prompt 中，使 agent 知道如何执行特定工作流或行为。

Skills 存储在 workspace 中（通常是 `~/.openclaw/workspace/skills/`）或通过 ClawHub 管理。

参见 [Skills](/tools/skills)。

### 我在哪里找到 Skills

- **ClawHub**：[https://clawhub.com](https://clawhub.com)——Skills 的社区目录
- **本地**：在你的 workspace 中创建 `skills/` 目录并添加 `.md` 文件

要安装一个 skill：

```bash
openclaw skill install <skill-name>
openclaw skill install <url>
```

参见 [Skills](/tools/skills)。

### 什么是 Workflow Skills

Workflow Skills 是定义多步骤自动化流程的 Skills，通常跨多个工具或 agents。它们使用 YAML 风格的前置元数据来声明输入、步骤和输出。

参见 [Skills](/tools/skills)。

### 如何创建自定义 Slash Command

创建一个 `.md` 文件放在 workspace 的 `commands/` 目录中。文件名成为命令名。

示例：`~/.openclaw/workspace/commands/summarize.md`

```markdown
Summarize the last N messages in this conversation.
```

然后在聊天中运行 `/summarize`。

参见 [Slash Commands](/tools/slash-commands)。

### Slash Commands 和 Skills 有什么区别

- **Slash Commands**（`/command`）：简单的快捷方式，通常将模板文本注入到对话中。
- **Skills**：更复杂，包括指令、工具访问声明以及可能的工作流步骤。

Skills 可以通过 slash commands 触发，但它们是独立的概念。

参见 [Slash Commands](/tools/slash-commands)、[Skills](/tools/skills)。

### 如何在不让 repo 变脏的情况下自定义 skills

使用托管覆盖而不是编辑 repo 副本。将你的更改放在 `~/.openclaw/skills/<name>/SKILL.md` 中（或通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加文件夹）。优先级是 `<workspace>/skills` > `~/.openclaw/skills` > 内置，所以托管覆盖在不触碰 git 的情况下优先。

### 我可以从自定义文件夹加载 skills 吗

可以。通过 `~/.openclaw/openclaw.json` 中的 `skills.load.extraDirs` 添加额外目录（最低优先级）。默认优先级保持不变：`<workspace>/skills` → `~/.openclaw/skills` → 内置 → `skills.load.extraDirs`。`clawhub` 默认安装到 `./skills`，OpenClaw 在下一个 session 中将其视为 `<workspace>/skills`。

### 如何为不同任务使用不同 models

目前支持的模式：

- **Cron jobs**：隔离的作业可以为每个作业设置 `model` 覆盖。
- **Sub-agents**：将任务路由到具有不同默认 models 的独立 agents。
- **按需切换**：使用 `/model` 随时切换当前 session model。

参见 [Cron jobs](/automation/cron-jobs)、[Multi-Agent Routing](/concepts/multi-agent) 和 [Slash commands](/tools/slash-commands)。

### bot 在繁重工作时卡住了，如何卸载

使用 **sub-agents** 处理长时间或并行任务。Sub-agents 在自己的 session 中运行，返回摘要，并保持你的主聊天响应。

让你的 bot "为此任务生成一个 sub-agent" 或使用 `/subagents`。使用 `/status` 在聊天中查看 Gateway 当前在做什么（以及它是否忙碌）。

文档：[Sub-agents](/tools/subagents)。

### Discord 上线程绑定的 subagent sessions 如何工作

使用线程绑定。你可以将 Discord 线程绑定到 subagent 或 session 目标，这样该线程中的后续消息就会保留在该绑定的 session 上。

基本流程：

- 使用 `sessions_spawn` 生成，带 `thread: true`（以及可选的 `mode: "session"` 用于持久跟进）。
- 或手动使用 `/focus <target>` 绑定。
- 使用 `/agents` 检查绑定状态。
- 使用 `/session idle <duration|off>` 和 `/session max-age <duration|off>` 控制自动取消焦点。
- 使用 `/unfocus` 分离线程。

所需配置：

- 全局默认：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- Discord 覆盖：`channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours`。

文档：[Sub-agents](/tools/subagents)、[Discord](/channels/discord)、[Slash commands](/tools/slash-commands)。

### Cron 或提醒不触发，检查什么

Cron 在 Gateway 进程内运行。如果 Gateway 没有持续运行，计划作业就不会运行。

检查清单：

- 确认 cron 已启用（`cron.enabled`）且未设置 `OPENCLAW_SKIP_CRON`。
- 检查 Gateway 是否 24/7 运行（无睡眠/重启）。
- 验证作业的时区设置（`--tz` 与主机时区）。

调试：

```bash
openclaw cron run <jobId> --force
openclaw cron runs --id <jobId> --limit 50
```

文档：[Cron jobs](/automation/cron-jobs)、[Cron vs Heartbeat](/automation/cron-vs-heartbeat)。

### 如何在 Linux 上安装 skills

使用原生 `openclaw skills` 命令或将 skills 放入你的工作区。macOS Skills UI 在 Linux 上不可用。在 [https://clawhub.com](https://clawhub.com) 浏览 skills。

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

### OpenClaw 可以按计划或在后台持续运行任务吗

可以。使用 Gateway 调度器：

- **Cron jobs** 用于计划或重复任务（跨重启持久）。
- **Heartbeat** 用于"主 session"周期性检查。
- **隔离作业** 用于发布摘要或向聊天交付内容的自主 agents。

文档：[Cron jobs](/automation/cron-jobs)、[Cron vs Heartbeat](/automation/cron-vs-heartbeat)、[Heartbeat](/gateway/heartbeat)。

### 我可以从 Linux 运行仅 Apple macOS 的 skills 吗

不能直接运行。macOS skills 由 `metadata.openclaw.os` 加上所需二进制文件控制，skills 只有在 **Gateway 主机**上符合条件时才会出现在 system prompt 中。在 Linux 上，`darwin` 专用 skills（如 `apple-notes`、`apple-reminders`、`things-mac`）不会加载，除非你覆盖条件。

支持三种模式：

**选项 A——在 Mac 上运行 Gateway（最简单）。**
在 macOS 二进制文件所在的位置运行 Gateway，然后在[远程模式](#gateway-端口已在运行和远程模式)下或通过 Tailscale 从 Linux 连接。Skills 正常加载，因为 Gateway 主机是 macOS。

**选项 B——使用 macOS node（无需 SSH）。**
在 Linux 上运行 Gateway，配对一个 macOS node（菜单栏应用），并在 Mac 上将 **Node Run Commands** 设置为"Always Ask"或"Always Allow"。

**选项 C——通过 SSH 代理 macOS 二进制文件（高级）。**
在 Linux 上保留 Gateway，但让所需的 CLI 二进制文件解析为在 Mac 上运行的 SSH 包装器。

### 你有 Notion 或 HeyGen 集成吗

今天没有内置集成。

选项：

- **自定义 skill / 插件：** 最适合可靠的 API 访问（Notion/HeyGen 都有 API）。
- **浏览器自动化：** 无需代码但速度较慢且更脆弱。

---

## 沙盒

### 什么是沙盒，如何启用它

沙盒将 agent 可以运行的代码/命令限制在一个隔离环境中，防止工具执行接触你的真实文件系统。

在 config 中启用：

```json5
{
  agents: {
    defaults: {
      sandbox: { enabled: true },
    },
  },
}
```

OpenClaw 支持通过 `sandbox.type` 选择不同的沙盒后端（`docker`、`seatbelt` 等）。

参见 [沙盒](/gateway/sandbox)。

### 有专门的沙盒文档吗

有。参见 [Sandboxing](/gateway/sandboxing)。对于 Docker 特定设置（Docker 中的完整 gateway 或沙盒镜像），参见 [Docker](/install/docker)。

### Docker 感觉受限——如何启用完整功能

默认镜像以安全为优先，以 `node` 用户运行，因此不包含系统包、Homebrew 或内置浏览器。对于更完整的设置：

- 使用 `OPENCLAW_HOME_VOLUME` 持久化 `/home/node`，以便缓存在重启后保留。
- 使用 `OPENCLAW_DOCKER_APT_PACKAGES` 将系统依赖项内置到镜像中。
- 通过内置 CLI 安装 Playwright 浏览器：`node /app/node_modules/playwright-core/cli.js install chromium`

文档：[Docker](/install/docker)、[Browser](/tools/browser)。

### 我可以让 DMs 保持私密但让群组公开/沙盒化吗

可以——如果你的私人流量是 **DMs**，你的公共流量是**群组**。

使用 `agents.defaults.sandbox.mode: "non-main"`，这样群组/频道 sessions（非主键）在 Docker 中运行，而主 DM session 保留在主机上。然后通过 `tools.sandbox.tools` 限制沙盒 sessions 中可用的工具。

### 如何将主机文件夹绑定到沙盒中

将 `agents.defaults.sandbox.docker.binds` 设置为 `["host:path:mode"]`（例如，`"/home/user/src:/src:ro"`）。全局和每个 agent 的绑定会合并；当 `scope: "shared"` 时，每个 agent 的绑定会被忽略。对于敏感内容使用 `:ro`，记住绑定会绕过沙盒文件系统墙。参见 [Sandboxing](/gateway/sandboxing#custom-bind-mounts)。

---

## Memory

### Memory 如何工作

OpenClaw memory 只是 agent 工作区中的 Markdown 文件：

- 每日笔记在 `memory/YYYY-MM-DD.md`
- 精心策划的长期笔记在 `MEMORY.md`（仅主/私人 sessions）

OpenClaw 还会运行**静默的预压缩 memory 刷新**，以提醒模型在自动压缩前写入持久笔记。这只有当工作区可写时才运行（只读沙盒跳过它）。参见 [Memory](/concepts/memory)。

### 如何关闭 memory 摘要

```json5
{
  agents: {
    defaults: {
      memory: { summarize: false },
    },
  },
}
```

这禁用自动 memory 摘要写入。仍然存在的任何 `MEMORY.md` 仍将在每次 session 中注入。

参见 [Memory](/concepts/memory)。

### Memory 一直在忘记事情，如何让它记住

让 bot **将事实写入 memory**。长期笔记属于 `MEMORY.md`，短期 context 进入 `memory/YYYY-MM-DD.md`。

这仍然是我们正在改进的领域。提醒模型存储记忆会有帮助；它会知道该怎么做。如果它一直忘记，请验证 Gateway 在每次运行时都使用相同的工作区。

文档：[Memory](/concepts/memory)、[Agent workspace](/concepts/agent-workspace)。

### Memory 会永远持久吗？有什么限制

Memory 文件保存在磁盘上，直到你删除它们。限制是你的存储，而不是模型。**session context** 仍然受模型 context 窗口限制，所以长对话可能会压缩或截断。这就是为什么存在 memory 搜索——它只将相关部分拉回 context 中。

文档：[Memory](/concepts/memory)、[Context](/concepts/context)。

### 语义 memory 搜索需要 OpenAI API key 吗

只有当你使用 **OpenAI embeddings** 时才需要。Codex OAuth 覆盖 chat/completions，**不**授予 embeddings 访问权限，所以**使用 Codex 登录不能用于语义 memory 搜索**。OpenAI embeddings 仍然需要真实的 API key（`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`）。

如果你不想使用远程 key，设置 `memorySearch.provider = "local"`。我们支持 **OpenAI、Gemini、Voyage、Mistral、Ollama 或本地** embedding models——参见 [Memory](/concepts/memory) 了解设置详情。

---

## 磁盘上的文件位置

### 状态文件在哪里

默认目录：`~/.openclaw/`

- 配置：`~/.openclaw/openclaw.json`
- 日志：`~/.openclaw/logs/`
- 凭据/auth：`~/.openclaw/credentials/`（或 `auth-profiles.json`）
- Agent 状态：`~/.openclaw/agents/<agentId>/`
- Sessions：`~/.openclaw/agents/<agentId>/sessions/`
- Workspace：配置中的 `agent.workspace`（默认：`~/.openclaw/workspace`）

Profile 状态使用 `~/.openclaw-<profile>/`。

### 如何更改 gateway 状态目录

设置 `OPENCLAW_STATE_DIR` env var 或使用 profile：

```bash
OPENCLAW_STATE_DIR=/data/openclaw openclaw gateway run
```

或在配置中：

```json5
{
  gateway: { stateDir: "/data/openclaw" },
}
```

### 使用 OpenClaw 的所有数据都保存在本地吗

不——**OpenClaw 的状态是本地的**，但**外部服务仍然能看到你发送给它们的内容**。

- **默认本地：** sessions、memory 文件、配置和工作区保存在 Gateway 主机上（`~/.openclaw` + 你的工作区目录）。
- **必须远程：** 你发送给模型提供商（Anthropic/OpenAI 等）的消息去往他们的 API，聊天平台（WhatsApp/Telegram/Slack 等）在其服务器上存储消息数据。
- **你控制足迹：** 使用本地 models 将 prompts 保留在你的机器上，但 channel 流量仍然通过 channel 的服务器传输。

### OpenClaw 将其数据存储在哪里

所有内容保存在 `$OPENCLAW_STATE_DIR` 下（默认：`~/.openclaw`）：

| 路径 | 用途 |
| --- | --- |
| `$OPENCLAW_STATE_DIR/openclaw.json` | 主配置（JSON5） |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/agent/auth-profiles.json` | Auth profiles（OAuth、API keys） |
| `$OPENCLAW_STATE_DIR/credentials/` | Provider 状态（例如 `whatsapp/<accountId>/creds.json`） |
| `$OPENCLAW_STATE_DIR/agents/` | 每个 agent 的状态（agentDir + sessions） |
| `$OPENCLAW_STATE_DIR/agents/<agentId>/sessions/` | 对话历史和状态（每个 agent） |

你的**工作区**（AGENTS.md、memory 文件、skills 等）是独立的，通过 `agents.defaults.workspace` 配置（默认：`~/.openclaw/workspace`）。

### AGENTS.md / SOUL.md / USER.md / MEMORY.md 应该放在哪里

这些文件保存在 **agent 工作区**中，而不是 `~/.openclaw`。

- **工作区（每个 agent）：** `AGENTS.md`、`SOUL.md`、`IDENTITY.md`、`USER.md`、`MEMORY.md`、`memory/YYYY-MM-DD.md`、可选的 `HEARTBEAT.md`。
- **状态目录（`~/.openclaw`）：** 配置、凭证、auth profiles、sessions、日志和共享 skills（`~/.openclaw/skills`）。

默认工作区是 `~/.openclaw/workspace`，可通过以下方式配置：

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

如果 bot 在重启后"忘记"，请确认 Gateway 在每次启动时使用相同的工作区。

参见 [Agent workspace](/concepts/agent-workspace) 和 [Memory](/concepts/memory)。

### 推荐的备份策略

将你的 **agent 工作区**放在**私有** git repo 中并在私密的地方备份（例如 GitHub private）。这会捕获 memory + AGENTS/SOUL/USER 文件，让你以后能恢复助手的"记忆"。

**不要**提交 `~/.openclaw` 下的任何内容（凭证、sessions、tokens 或加密的 secrets payload）。

文档：[Agent workspace](/concepts/agent-workspace)。

### 如何完全卸载 OpenClaw

参见专用指南：[Uninstall](/install/uninstall)。

### agents 可以在工作区外工作吗

可以。工作区是**默认的 cwd** 和 memory 锚点，而不是硬性沙盒。相对路径在工作区内解析，但绝对路径可以访问其他主机位置，除非启用了沙盒。如果你需要隔离，使用 `agents.defaults.sandbox` 或每个 agent 的沙盒设置。

### 我在远程模式下——session store 在哪里

Session 状态归 **gateway 主机**所有。如果你在远程模式下，你关心的 session store 在远程机器上，而不是你的本地笔记本。参见 [Session management](/concepts/session)。

---

## 配置基础

### 配置文件在哪里

默认：`~/.openclaw/openclaw.json`

可通过 `OPENCLAW_CONFIG_PATH` env var 覆盖。

使用 `openclaw config edit` 在编辑器中打开它，或使用 `openclaw config set <key> <value>` 更改单个值。

### config set 和 config edit 有什么区别

- **`config set <key> <value>`**：将单个 key 设置为值，直接写入配置文件。适用于脚本或单个更改。
- **`config edit`**：在系统编辑器中打开整个配置文件进行手动编辑。

两者都写入同一个 `openclaw.json` 文件。

### 我可以对 config 使用环境变量吗

可以。通过 `secretref` 语法引用 env vars：

```json5
{
  agents: {
    defaults: {
      model: {
        providers: {
          anthropic: {
            apiKey: { $env: "ANTHROPIC_API_KEY" },
          },
        },
      },
    },
  },
}
```

或使用简写的 `$env:VAR_NAME` 语法。

参见 [SecretRef 凭据](/reference/secretref-credential-surface)。

### 什么是 profile，如何在多个 bot 账户之间切换

Profile 是独立的状态目录，让你运行多个隔离的 OpenClaw 实例。

```bash
OPENCLAW_PROFILE=work openclaw gateway run
OPENCLAW_PROFILE=personal openclaw gateway run
```

每个 profile 获得自己的 `~/.openclaw-<profile>/` 目录，包括单独的配置、凭据、sessions 等。

参见 [Profiles](/gateway/profiles)。

### 配置格式是什么？在哪里

OpenClaw 从 `$OPENCLAW_CONFIG_PATH`（默认：`~/.openclaw/openclaw.json`）读取可选的 **JSON5** 配置。

如果文件缺失，它会使用安全的默认值（包括默认工作区 `~/.openclaw/workspace`）。

### 我设置了 gateway.bind "lan"（或 "tailnet"）但现在什么都没有监听 / UI 说未授权

非 loopback binds **需要 auth**。配置 `gateway.auth.mode` + `gateway.auth.token`（或使用 `OPENCLAW_GATEWAY_TOKEN`）。

```json5
{
  gateway: {
    bind: "lan",
    auth: {
      mode: "token",
      token: "replace-me",
    },
  },
}
```

### 为什么我现在需要 localhost 上的 token

OpenClaw 默认强制 token auth，包括 loopback。如果没有配置 token，gateway 启动时会自动生成一个并保存到 `gateway.auth.token`，所以**本地 WS 客户端必须进行身份验证**。

如果你**真的**想要开放的 loopback，在你的配置中明确设置 `gateway.auth.mode: "none"`。Doctor 可以随时为你生成 token：`openclaw doctor --generate-gateway-token`。

### 更改配置后必须重启吗

Gateway 监视配置并支持热重载：

- `gateway.reload.mode: "hybrid"`（默认）：热应用安全更改，对关键更改重启
- `hot`、`restart`、`off` 也支持

### 如何禁用有趣的 CLI 标语

在配置中设置 `cli.banner.taglineMode`：

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `off`：隐藏标语文字但保留横幅标题/版本行。
- `default`：每次使用 `All your chats, one OpenClaw.`。
- `random`：旋转有趣/季节性标语（默认行为）。
- 如果你想完全没有横幅，设置 env `OPENCLAW_HIDE_BANNER=1`。

### 如何启用网络搜索（和 web fetch）

`web_fetch` 无需 API key 即可工作。`web_search` 需要你选择的提供商（Brave、Gemini、Grok、Kimi 或 Perplexity）的 key。**推荐：** 运行 `openclaw configure --section web` 并选择提供商。

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        maxResults: 5,
      },
      fetch: {
        enabled: true,
      },
    },
  },
}
```

文档：[Web tools](/tools/web)。

### config.apply 清除了我的配置，如何恢复和避免这种情况

`config.apply` 替换**整个配置**。如果你发送一个部分对象，其他所有内容都会被删除。

恢复：

- 从备份恢复（git 或复制的 `~/.openclaw/openclaw.json`）。
- 如果没有备份，重新运行 `openclaw doctor` 并重新配置 channels/models。

避免：

- 对小更改使用 `openclaw config set`。
- 对交互式编辑使用 `openclaw configure`。

文档：[Config](/cli/config)、[Configure](/cli/configure)、[Doctor](/gateway/doctor)。

### 如何在设备间运行具有专业 workers 的中央 Gateway

常见模式是**一个 Gateway**（例如 Raspberry Pi）加上 **nodes** 和 **agents**：

- **Gateway（中央）：** 拥有 channels（Signal/WhatsApp）、路由和 sessions。
- **Nodes（设备）：** Mac/iOS/Android 作为外围设备连接，暴露本地工具（`system.run`、`canvas`、`camera`）。
- **Agents（workers）：** 用于特殊角色的独立大脑/工作区（例如"Hetzner ops"、"个人数据"）。
- **Sub-agents：** 当你想要并行性时，从主 agent 生成后台工作。

文档：[Nodes](/nodes)、[Remote access](/gateway/remote)、[Multi-Agent Routing](/concepts/multi-agent)、[Sub-agents](/tools/subagents)。

### OpenClaw 浏览器可以无头运行吗

可以。这是一个配置选项：

```json5
{
  browser: { headless: true },
  agents: {
    defaults: {
      sandbox: { browser: { headless: true } },
    },
  },
}
```

默认是 `false`（有头）。无头模式在某些网站上更容易触发反机器人检查。参见 [Browser](/tools/browser)。

### 如何使用 Brave 进行浏览器控制

将 `browser.executablePath` 设置为你的 Brave 二进制文件（或任何基于 Chromium 的浏览器）并重启 Gateway。参见 [Browser](/tools/browser#use-brave-or-another-chromium-based-browser) 中的完整配置示例。

---

## 远程 Gateways 和 Nodes

### 什么是 Node

Node 是 OpenClaw 可以通过网络连接到的远程 Gateway 实例。你可以在 VPS 或家用服务器上运行 Gateway，然后从笔记本上连接到它。

参见 [Nodes](/nodes)。

### 如何从笔记本连接到远程 gateway

在你的笔记本上配置 node：

```json5
{
  nodes: [
    {
      name: "myserver",
      url: "http://user@gateway-host:18788",
      token: { $env: "OPENCLAW_REMOTE_TOKEN" },
    },
  ],
}
```

然后 `openclaw tui --node myserver` 或在 Dashboard 中选择该 node。

参见 [远程访问](/gateway/remote)、[Nodes](/nodes)。

### 如何在没有 VPN 的情况下安全地远程访问 gateway

推荐选项：

1. **Tailscale**（最简单）：在两台机器上安装 Tailscale，通过 Tailscale IP 连接。
2. **SSH 隧道**：`ssh -L 18788:localhost:18788 user@gateway-host`，然后连接到 `localhost:18788`。
3. **反向代理**（Nginx/Caddy）：在 HTTPS 后面加上 token 认证。

避免将 Gateway 端口直接暴露到互联网上而不进行认证。

参见 [远程访问](/gateway/remote)、[安全](/gateway/security)。

### 什么是 Tailscale 以及何时使用它

Tailscale 是一个基于 WireGuard 的 VPN，提供安全的机器间连接，不需要打开防火墙端口。当你想从任何地方访问你的 gateway 时，它是最简单的选项。

安装 Tailscale，登录到同一账户（在 gateway 主机和笔记本上），然后使用 Tailscale IP 地址连接。

参见 [远程访问](/gateway/remote)。

### 命令如何在 Telegram、gateway 和 nodes 之间传播

Telegram 消息由 **gateway** 处理。当需要 node 工具时，gateway 运行 agent，然后才通过 **Gateway WebSocket** 调用 nodes：

Telegram → Gateway → Agent → `node.*` → Node → Gateway → Telegram

Nodes 不看入站 provider 流量；它们只接收 node RPC 调用。

### 如果 Gateway 远程托管，我的 agent 如何访问我的电脑

简短答案：**将你的电脑配对为 node**。Gateway 在别处运行，但它可以通过 Gateway WebSocket 在你的本地机器上调用 `node.*` 工具（屏幕、相机、系统）。

典型设置：

1. 在始终开启的主机（VPS/家庭服务器）上运行 Gateway。
2. 将 Gateway 主机和你的电脑放在同一个 tailnet 上。
3. 确保 Gateway WS 可达（tailnet bind 或 SSH 隧道）。
4. 在本地打开 macOS 应用并以**通过 SSH 远程**模式连接，使其可以注册为 node。
5. 在 Gateway 上批准 node：

```bash
openclaw devices list
openclaw devices approve <requestId>
```

文档：[Nodes](/nodes)、[macOS remote mode](/platforms/mac/remote)、[Security](/gateway/security)。

### Tailscale 已连接但我没有收到回复，怎么办

检查基础知识：

- Gateway 正在运行：`openclaw gateway status`
- Gateway 健康：`openclaw status`
- Channel 健康：`openclaw channels status`

然后验证 auth 和路由：

- 如果你使用 Tailscale Serve，确保 `gateway.auth.allowTailscale` 设置正确。
- 确认你的允许列表（DM 或群组）包含你的账户。

文档：[Tailscale](/gateway/tailscale)、[Remote access](/gateway/remote)、[Channels](/channels)。

### 两个 OpenClaw 实例可以互相交流吗（本地 + VPS）

可以。没有内置的"bot 到 bot"桥接，但你可以通过几种可靠方式连接：

**最简单：** 使用两个 bots 都可以访问的普通聊天 channel（Telegram/Slack/WhatsApp）。让 Bot A 向 Bot B 发送消息，然后让 Bot B 像往常一样回复。

**CLI 桥接（通用）：** 运行一个脚本，使用 `openclaw agent --message ... --deliver` 调用另一个 Gateway，目标是另一个 bot 监听的聊天。

文档：[Remote access](/gateway/remote)、[Agent CLI](/cli/agent)。

### 多个 agents 需要单独的 VPS 吗

不需要。一个 Gateway 可以托管多个 agents，每个都有自己的工作区、model 默认值和路由。这是正常设置，比每个 agent 运行一个 VPS 便宜得多、简单得多。

### 在个人笔记本上使用 node 相比从 VPS 通过 SSH 连接有什么好处

有——nodes 是从远程 Gateway 访问笔记本的第一类方式，它们解锁的不仅仅是 shell 访问：

- **不需要入站 SSH。** Nodes 连出到 Gateway WebSocket 并使用设备配对。
- **更安全的执行控制。** `system.run` 由该笔记本上的 node 允许列表/批准控制。
- **更多设备工具。** Nodes 除了 `system.run` 还暴露 `canvas`、`camera` 和 `screen`。

文档：[Nodes](/nodes)、[Nodes CLI](/cli/nodes)、[Browser](/tools/browser)。

### Nodes 运行 gateway 服务吗

不运行。每台主机只应运行**一个 gateway**，除非你有意运行隔离 profiles。Nodes 是连接到 gateway 的外围设备（iOS/Android nodes，或 macOS 菜单栏应用中的"node 模式"）。

### 如何在 VPS 上设置 Tailscale 并从 Mac 连接

最小步骤：

1. **在 VPS 上安装并登录**

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up
   ```

2. **在 Mac 上安装并登录**——使用 Tailscale 应用并登录到同一 tailnet。

3. **启用 MagicDNS（推荐）**——在 Tailscale 管理控制台中启用 MagicDNS，使 VPS 有稳定的名称。

4. **使用 tailnet 主机名**——`ssh user@your-vps.tailnet-xxxx.ts.net`

如果你想要不通过 SSH 的 Control UI，在 VPS 上使用 Tailscale Serve：

```bash
openclaw gateway --tailscale serve
```

参见 [Tailscale](/gateway/tailscale)。

### 我应该在第二台笔记本上安装还是添加 node

如果你只需要在第二台笔记本上使用**本地工具**（屏幕/相机/exec），将其添加为 **node**。这保持单一 Gateway 并避免重复配置。

只有当你需要**硬隔离**或两个完全独立的 bots 时，才安装第二个 Gateway。

文档：[Nodes](/nodes)、[Nodes CLI](/cli/nodes)。

---

## 环境变量和 .env 加载

### OpenClaw 加载哪些环境变量

OpenClaw 从以下位置加载 env vars：

1. 你的 shell 环境（启动时存在的任何内容）
2. 工作目录中的 `.env` 文件（如果存在）
3. 配置文件中的 `secretref` 表达式（`$env:VAR_NAME`）

Gateway 读取在其启动时设置的 env vars，以及任何 `.env` 文件（如果已配置）。

参见 [环境变量](/help/environment)。

### 如何通过 env var 注入 API key 而不写入配置文件

在你的 shell `~/.profile` 或 `.env` 文件中设置 env var：

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

然后在 `openclaw.json` 中引用它：

```json5
{
  models: {
    providers: {
      anthropic: { apiKey: { $env: "ANTHROPIC_API_KEY" } },
    },
  },
}
```

参见 [SecretRef](/reference/secretref-credential-surface)、[环境变量](/help/environment)。

### .env 文件加载顺序是什么

OpenClaw 从以下位置加载 `.env` 文件（按优先级顺序，最后加载的获胜）：

1. Gateway 工作目录（`~/.openclaw/` 或配置的 `stateDir`）
2. 项目目录（如果已配置 workspace）

参见 [环境变量](/help/environment)。

### 我设置了 ANTHROPIC_API_KEY 但 gateway 找不到它

常见原因：

1. **Env var 在 gateway 启动时未设置**：如果 gateway 作为服务（launchd/systemd）运行，它可能不会从你的 shell 继承 env vars。在服务定义中设置 env var，或在 `openclaw.json` 中使用 `secretref` 引用它。
2. **Config 不引用它**：在 `models.providers.anthropic.apiKey` 中添加 `{ $env: "ANTHROPIC_API_KEY" }`。
3. **Profile 隔离**：如果你使用 profile，env var 可能对该 profile 不可用。

参见 [SecretRef](/reference/secretref-credential-surface)、[Auth Profiles](/concepts/auth-profiles)。

---

## Sessions 和多个聊天

### 什么是 session

Session 是一个对话 context——消息历史、当前 model、工具状态——在单个聊天线程中。每次你开始新对话时，通常会创建新 session。

Sessions 存储在 `~/.openclaw/agents/<agentId>/sessions/`。

参见 [Session](/concepts/session)。

### 如何开始新的 session

发送 `/new` 或 `/reset` 开始新 session。

```
/new
/reset
```

这会清除对话历史并开始新 context。

参见 [Slash Commands](/tools/slash-commands)。

### 我想要两个独立的 bot 用于不同场景

使用多个 **agents**（不同的 bot 身份，每个都有自己的 workspace、memory 和配置）或多个 **profiles**（完全独立的 OpenClaw 实例）。

对于单 gateway 上的独立 bot：在 `agents.list` 中添加多个 agent，每个都有自己的 `name`、`model`、`workspace` 等。

参见 [Multi-agent](/concepts/multi-agent)。

### 我有 Discord 和 Telegram 同时运行。它们共享 session 吗

这取决于你的配置：

- **默认**：每个 channel 上的每个用户/聊天都有自己的 session。Discord 和 Telegram 上的会话是分开的。
- **共享 session**：你可以通过配置 `dmScope` 或 `sessionKeys` 让 channels 共享 session。

参见 [Session](/concepts/session)。

### 如何查看 session 历史

```bash
openclaw sessions list
openclaw sessions view <sessionId>
```

或者在聊天中：

```
/sessions
```

参见 [Session](/concepts/session)。

### 如何限制 session 的 context window

设置 `agents.defaults.maxTokens` 或在会话中使用 `/compact` 手动压缩。

你也可以通过以下方式配置自动压缩：

```json5
{
  agents: {
    defaults: {
      compaction: { enabled: true, threshold: 0.8 },
    },
  },
}
```

参见 [Context](/concepts/context)。

### compaction 何时触发

当 context 窗口使用率超过 `compaction.threshold`（默认：80%）时，自动压缩触发。它创建一个摘要，替换旧消息，保留重要 context 的同时释放空间。

你也可以手动触发：`/compact`

参见 [Context](/concepts/context)。

### 如果我从不发送 /new，sessions 会自动重置吗

是的。Sessions 在 `session.idleMinutes`（默认 **60**）后过期。下一条消息为该聊天键开始一个新的 session id。这不会删除记录——它只是开始一个新 session。

```json5
{
  session: {
    idleMinutes: 240,
  },
}
```

### 有办法创建 OpenClaw 实例团队吗（一个 CEO 和多个 agents）

可以，通过**多 agent 路由**和 **sub-agents**。你可以创建一个协调 agent 和几个有自己工作区和 models 的 worker agents。

话虽如此，这最好被视为一个**有趣的实验**。它消耗大量 tokens，通常比使用一个 bot 加独立 sessions 效率低。

文档：[Multi-agent routing](/concepts/multi-agent)、[Sub-agents](/tools/subagents)、[Agents CLI](/cli/agents)。

### 为什么 context 在任务中途被截断？如何防止

Session context 受模型窗口限制。长对话、大型工具输出或许多文件可能触发压缩或截断。

有帮助的做法：

- 让 bot 总结当前状态并将其写入文件。
- 在长任务前使用 `/compact`，切换主题时使用 `/new`。
- 将重要 context 保留在工作区中，并让 bot 重新读取它。
- 使用 sub-agents 处理长时间或并行工作，使主聊天保持较小。
- 如果经常发生，选择具有更大 context 窗口的 model。

### 如何完全重置 OpenClaw 但保持安装

使用 reset 命令：

```bash
openclaw reset
```

非交互式完全重置：

```bash
openclaw reset --scope full --yes --non-interactive
```

然后重新运行设置：

```bash
openclaw onboard --install-daemon
```

### 我收到"context too large"错误——如何重置或压缩

使用以下之一：

- **Compact**（保留对话但总结旧对话）：

  ```
  /compact
  ```

  或 `/compact <instructions>` 来指导摘要。

- **Reset**（相同聊天键的新 session ID）：

  ```
  /new
  /reset
  ```

如果继续发生：

- 启用或调整 **session pruning**（`agents.defaults.contextPruning`）来修剪旧工具输出。
- 使用具有更大 context 窗口的 model。

文档：[Compaction](/concepts/compaction)、[Session management](/concepts/session)。

### 为什么我看到"LLM request rejected: messages.content.tool_use.input field required"

这通常是工具 use 块的**格式错误**，在某些 provider/model 组合中更频繁出现。常见原因：

- `tool_use` 块存在于 session 历史中，但没有对应的 `tool_result`。
- Model 版本更改了预期格式。

快速修复：`/compact` 或 `/new` 来重置 session。如果仍然发生，将问题报告到 GitHub 并附上日志。

### 为什么我每 30 分钟收到心跳消息

这是**Heartbeat**功能——你的 agent 在后台的周期性检查。心跳消息是其进度报告。

你可以在配置中调整或禁用心跳：

```json5
{
  agents: {
    defaults: {
      heartbeat: { enabled: false },
    },
  },
}
```

文档：[Heartbeat](/gateway/heartbeat)。

### 我需要在 WhatsApp 群组中添加"bot 账户"吗

不需要。你的 WhatsApp 账户就是 bot——你配对的是你自己的 WhatsApp 账户。只需将 bot 的 WhatsApp 号码添加到群组（就像添加任何联系人一样），或直接向 bot 的号码发送 DM。

### 如何获取 WhatsApp 群组的 JID

发送消息到群组，然后检查日志：

```bash
openclaw logs --follow
```

查找包含 `jid`、`groupJid` 或 `chat` 的日志行。JID 看起来像 `123456789-1234567890@g.us`。

### 为什么 OpenClaw 不在群组中回复

常见原因：

1. **允许列表：** 检查 `channels.<provider>.groups.allowFrom` 是否包含该群组的 JID/ID。
2. **激活：** 群组可能需要配对码或启用命令。
3. **Channel 特定配置：** 一些 channels 的群组消息有单独的设置。

参见 [Channels](/channels) 和特定 channel 文档。

### 群组/线程与 DMs 共享 context 吗

不共享——默认情况下，每个聊天键（用户、群组、线程）都有自己独立的 session 和 context。

### 我可以创建多少工作区和 agents

没有硬性限制。创建你需要的任意数量。一个单一 Gateway 可以托管许多 agents，每个都有自己的工作区和配置。

### 我可以同时运行多个 bots 或聊天吗（Slack），如何设置

是的。使用多 agent 路由：将不同的 Slack 频道或 DMs 绑定到不同的 agent IDs，每个都有自己的工作区和 model 默认值。参见 [Multi-Agent Routing](/concepts/multi-agent) 和 [Slack](/channels/slack)。

---

## Models：默认、选择、别名、切换

### 默认 model 是什么，如何更改它

默认 model 在 `agents.defaults.model.primary` 中设置：

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-5" },
    },
  },
}
```

或通过 CLI：

```bash
openclaw models set anthropic/claude-sonnet-4-5
```

参见 [Models](/concepts/models)。

### 如何在聊天中切换 models

```
/model list
/model 3
/model anthropic/claude-opus-4-6
```

更改仅在当前 session 中生效。

参见 [Slash Commands](/tools/slash-commands)、[Models](/concepts/models)。

### 如何设置 model 别名

```bash
openclaw models aliases add Sonnet anthropic/claude-sonnet-4-5
openclaw models aliases add Opus anthropic/claude-opus-4-6
```

然后在聊天中使用 `/model Sonnet`。

参见 [Models](/concepts/models)。

### 如何限制可用 models

在 config 中设置 `agents.defaults.models` 允许列表：

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
}
```

只有这些 models 可以通过 `/model` 选择。

参见 [Models](/concepts/models)。

### 为什么切换 models 后没有回复

最可能的原因：所选 model 不在 `agents.defaults.models` 允许列表中（如果已配置）。OpenClaw 返回"Model not allowed"并停止。

修复：将 model 添加到允许列表，或清除允许列表（删除 `agents.defaults.models`）。

参见 [Models](/concepts/models)。

### 如何设置 image model

```bash
openclaw models set-image openai/gpt-4o
```

或在 config 中：

```json5
{
  agents: {
    defaults: {
      imageModel: { primary: "openai/gpt-4o" },
    },
  },
}
```

仅在主 model 不支持图像时使用。

参见 [Models](/concepts/models)。

### 扫描可以使用什么 models

```bash
openclaw models scan
```

扫描 OpenRouter 的免费 model catalog，可选地探测 tool 和 image 支持，并帮助你选择 fallbacks。需要 OpenRouter API key。

参见 [Models](/concepts/models)。

### 如何配置 OpenRouter

在 `openclaw.json` 中添加 OpenRouter provider：

```json5
{
  models: {
    providers: {
      openrouter: {
        apiKey: { $env: "OPENROUTER_API_KEY" },
      },
    },
  },
}
```

然后将 model 设置为：`openrouter/moonshotai/kimi-k2`（包含 provider 前缀）。

参见 [Model Providers](/concepts/model-providers)。

### 如何使用免费 OpenRouter models

运行 `openclaw models scan` 发现和选择免费 models。没有 API key 时使用 `--no-probe`：

```bash
openclaw models scan --no-probe
```

参见 [Models](/concepts/models)。

### 什么是 thinking 模式，如何启用它

Thinking 模式激活支持 models 的扩展推理（例如 Claude 的 thinking 或 o3 风格推理）。

在聊天中切换：

```
/thinking on
/thinking off
/thinking low
/thinking high
```

或在 config 中：

```json5
{
  agents: {
    defaults: {
      thinking: { enabled: true, level: "medium" },
    },
  },
}
```

参见 [Thinking](/tools/thinking)。

### 如何为每个 agent 使用不同的 model

在 `agents.list` 中按 agent 配置：

```json5
{
  agents: {
    list: [
      {
        name: "coder",
        model: { primary: "anthropic/claude-opus-4-6" },
      },
      {
        name: "assistant",
        model: { primary: "openai/gpt-4.1" },
      },
    ],
  },
}
```

参见 [Multi-agent](/concepts/multi-agent)。

### "default model"是什么

OpenClaw 的默认 model 是你设置为以下值的任何内容：

```
agents.defaults.model.primary
```

Models 以 `provider/model` 引用（例如：`anthropic/claude-opus-4-6`）。

### 你推荐什么 model

**推荐默认：** 使用你的 provider 栈中最强的最新一代 model。**对于启用工具或不受信任输入的 agents：** 优先考虑模型强度而非成本。**对于常规/低风险聊天：** 使用更便宜的备用 models 并按 agent 角色路由。

经验法则：对高风险工作使用**你能负担得起的最好 model**，对常规聊天或摘要使用更便宜的 model。参见 [Models](/concepts/models) 和 [Sub-agents](/tools/subagents)。

强烈警告：较弱/过量化的 models 更容易受到 prompt injection 和不安全行为的影响。参见 [Security](/gateway/security)。

### 如何不清除配置地切换 models

使用 **model commands** 或只编辑 **model** 字段。避免完整配置替换。

安全选项：

- `/model` 在聊天中（快速，每 session）
- `openclaw models set ...`（只更新 model 配置）
- `openclaw configure --section model`（交互式）
- 编辑 `~/.openclaw/openclaw.json` 中的 `agents.defaults.model`

文档：[Models](/concepts/models)、[Configure](/cli/configure)、[Config](/cli/config)。

### 我可以使用自托管 models 吗（llama.cpp、vLLM、Ollama）

可以。Ollama 是本地 models 最简单的路径。

最快设置：

1. 从 `https://ollama.com/download` 安装 Ollama
2. 拉取本地 model，例如 `ollama pull glm-4.7-flash`
3. 如果你也想要 Ollama Cloud，运行 `ollama signin`
4. 运行 `openclaw onboard` 并选择 `Ollama`

安全说明：较小或大量量化的 models 更容易受到 prompt injection 影响。我们强烈推荐**大型 models** 用于任何可以使用工具的 bot。

文档：[Ollama](/providers/ollama)、[Local models](/gateway/local-models)、[Security](/gateway/security)。

### 如何即时切换 models（无需重启）

使用 `/model` 命令作为独立消息：

```
/model sonnet
/model haiku
/model opus
/model gpt
/model gpt-mini
/model gemini
/model gemini-flash
```

你可以使用 `/model`、`/model list` 或 `/model status` 列出可用 models。

`/model`（和 `/model list`）显示紧凑的编号选择器。按编号选择：

```
/model 3
```

你也可以为 provider 强制指定特定的 auth profile（每 session）：

```
/model opus@anthropic:default
/model opus@anthropic:work
```

### 我可以对日常任务使用 GPT 5.2，对编程使用 Codex 5.3 吗

可以。将一个设置为默认，根据需要切换：

- **快速切换（每 session）：** 日常任务用 `/model gpt-5.2`，Codex OAuth 编程用 `/model openai-codex/gpt-5.4`。
- **默认 + 切换：** 将 `agents.defaults.model.primary` 设置为 `openai/gpt-5.2`，然后在编程时切换到 `openai-codex/gpt-5.4`。
- **Sub-agents：** 将编程任务路由到具有不同默认 model 的 sub-agents。

参见 [Models](/concepts/models) 和 [Slash commands](/tools/slash-commands)。

### 为什么我看到"Model ... is not allowed"然后没有回复

如果设置了 `agents.defaults.models`，它就成为 `/model` 和任何 session 覆盖的**允许列表**。选择不在该列表中的 model 会返回：

```
Model "provider/model" is not allowed. Use /model to list available models.
```

修复：将 model 添加到 `agents.defaults.models`，删除允许列表，或从 `/model list` 中选择 model。

### 为什么我看到"Unknown model: minimax/MiniMax-M2.7"

这意味着**未配置 provider**（未找到 MiniMax provider 配置或 auth profile），因此 model 无法解析。

修复检查清单：

1. 升级到当前 OpenClaw 发行版（或从源代码 `main` 运行），然后重启 gateway。
2. 确保 MiniMax 已配置（向导或 JSON），或者 env/auth profiles 中存在 MiniMax API key。
3. 使用确切的 model id（区分大小写）：`minimax/MiniMax-M2.7`、`minimax/MiniMax-M2.7-highspeed` 等。

参见 [MiniMax](/providers/minimax) 和 [Models](/concepts/models)。

### 我可以使用 MiniMax 作为默认，使用 OpenAI 处理复杂任务吗

可以。使用 **MiniMax 作为默认**，在需要时按 **session** 切换 models。Fallbacks 用于**错误**，而非"困难任务"，所以使用 `/model` 或单独的 agent。

**选项 A：按 session 切换**

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "minimax" },
        "openai/gpt-5.2": { alias: "gpt" },
      },
    },
  },
}
```

然后：`/model gpt`

**选项 B：独立 agents**

- Agent A 默认：MiniMax
- Agent B 默认：OpenAI
- 按 agent 路由或使用 `/agent` 切换

文档：[Models](/concepts/models)、[Multi-Agent Routing](/concepts/multi-agent)、[MiniMax](/providers/minimax)、[OpenAI](/providers/openai)。

### opus / sonnet / gpt 是内置快捷方式吗

是的。OpenClaw 提供一些默认简写（仅在 model 存在于 `agents.defaults.models` 中时应用）：

- `opus` → `anthropic/claude-opus-4-6`
- `sonnet` → `anthropic/claude-sonnet-4-6`
- `gpt` → `openai/gpt-5.4`
- `gpt-mini` → `openai/gpt-5-mini`
- `gemini` → `google/gemini-3.1-pro-preview`
- `gemini-flash` → `google/gemini-3-flash-preview`

如果你用同名设置自己的别名，你的值优先。

### 如何从 OpenRouter 或 Z.AI 等其他 providers 添加 models

OpenRouter（按 token 付费；许多 models）：

```json5
{
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
      models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
    },
  },
  env: { OPENROUTER_API_KEY: "sk-or-..." },
}
```

Z.AI（GLM models）：

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-5" },
      models: { "zai/glm-5": {} },
    },
  },
  env: { ZAI_API_KEY: "..." },
}
```

---

## Model Failover 和"所有 models 失败"

### 什么是 model failover

当主 model 失败（速率限制、网络错误、认证失败）时，OpenClaw 自动移动到配置的 fallback models 列表中的下一个。

配置 fallbacks：

```bash
openclaw models fallbacks add openai/gpt-4.1
openclaw models fallbacks add openrouter/anthropic/claude-3.5-sonnet
```

参见 [Model Failover](/concepts/model-failover)。

### 所有 models 失败 是什么意思

"所有 models 失败"意味着主 model 和所有 fallbacks 在此轮次中都失败了。

常见原因：

- 所有 providers 的 API key 无效或过期
- 速率限制影响所有配置的 models
- 网络问题阻止到达所有 providers

检查每个 provider 的凭据：

```bash
openclaw models status
```

参见 [Model Failover](/concepts/model-failover)。

### "No credentials found for profile anthropic:default"是什么意思

这意味着系统尝试使用 auth profile ID `anthropic:default`，但在预期的 auth store 中找不到它的凭据。

**修复检查清单：**

- **确认 auth profiles 的位置**（新路径 vs 旧路径）
  - 当前：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
  - 旧版：`~/.openclaw/agent/*`（由 `openclaw doctor` 迁移）
- **确认你的 env var 被 Gateway 加载**
  - 如果你在 shell 中设置了 `ANTHROPIC_API_KEY` 但通过 systemd/launchd 运行 Gateway，它可能不会继承它。将其放入 `~/.openclaw/.env` 或启用 `env.shellEnv`。
- **使用 setup-token**
  - 运行 `claude setup-token`，然后使用 `openclaw models auth setup-token --provider anthropic` 粘贴它。
- **确认你在 gateway 主机上运行命令**
  - 在远程模式下，auth profiles 保存在 gateway 机器上，而不是你的笔记本上。

### 为什么它也尝试了 Google Gemini 并失败了

如果你的 model 配置包含 Google Gemini 作为 fallback（或你切换到了 Gemini 简写），OpenClaw 将在 model fallback 期间尝试它。如果你没有配置 Google 凭证，你会看到 `No API key found for provider "google"`。

修复：提供 Google auth，或从 `agents.defaults.model.fallbacks` / 别名中删除/避免 Google models，这样 fallback 就不会路由到那里。

---

## Auth Profiles

### 什么是 auth profile

Auth profile 是一个命名的凭据记录（OAuth 或 API key），与 provider 绑定。Profiles 保存在：

```
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

### 典型的 profile ID 是什么

OpenClaw 使用 provider 前缀的 ID，例如：

- `anthropic:default`（当没有 email 身份时常见）
- `anthropic:<email>` 用于 OAuth 身份
- 你选择的自定义 ID（例如 `anthropic:work`）

### 我可以控制先尝试哪个 auth profile 吗

可以。配置支持可选的 profiles 元数据和每个 provider 的排序（`auth.order.<provider>`）。这**不**存储 secrets；它将 ID 映射到 provider/mode 并设置轮换顺序。

你可以通过 CLI 设置**每个 agent** 的排序覆盖：

```bash
# 只尝试这一个 profile
openclaw models auth order set --provider anthropic anthropic:default

# 或设置明确的顺序
openclaw models auth order set --provider anthropic anthropic:work anthropic:default

# 清除覆盖（回退到配置的 auth.order / 轮询）
openclaw models auth order clear --provider anthropic
```

### OAuth vs API key——有什么区别

OpenClaw 支持两者：

- **OAuth** 通常利用订阅访问（在适用的情况下）。
- **API keys** 使用按 token 付费计费。

向导明确支持 Anthropic setup-token 和 OpenAI Codex OAuth，并可以为你存储 API keys。

### 如何从 CLI 设置 auth profile

```bash
openclaw auth add anthropic --key sk-ant-...
openclaw auth add openai --key sk-...
openclaw auth list
```

或使用向导：

```bash
openclaw onboard
```

参见 [Auth Profiles](/concepts/auth-profiles)。

---

## Gateway 端口、"已在运行"和远程模式

### 如何更改 gateway 端口

```bash
openclaw config set gateway.port 19000
```

或在 `openclaw.json` 中：

```json5
{
  gateway: { port: 19000 },
}
```

重启 gateway 应用更改。

参见 [Gateway 配置](/gateway/configuration)。

### gateway 已经在运行是什么意思

这意味着另一个 OpenClaw gateway 进程已经在使用同一端口。选项：

1. 连接到已运行的 gateway（不要启动第二个）
2. 强制重启：`openclaw gateway restart`
3. 用 `--force` 强制新实例接管端口：`openclaw gateway run --force`

### 在同一机器上运行多个 gateway 实例

使用不同的 profiles（它们会自动获得不同的端口）：

```bash
OPENCLAW_PROFILE=work openclaw gateway run
OPENCLAW_PROFILE=personal openclaw gateway run
```

默认端口：`18788`；dev profile 端口：`19001`；其他 profiles 在此范围内递增。

参见 [Profiles](/gateway/profiles)。

### 什么是 invalid handshake / code 1008

这是 WebSocket 错误，通常意味着连接 gateway 的客户端使用了错误的 auth token。

Gateway 是一个 **WebSocket 服务器**，它期望第一条消息是 `connect` 帧。如果收到其他内容，它会以 **code 1008**（策略违反）关闭连接。

检查：

- 你的 TUI/Dashboard 指向正确的 gateway URL 和 token
- 运行 `openclaw dashboard` 生成正确的已认证 URL
- 如果远程，确认 Tailscale/隧道正在工作

Protocol 详情：[Gateway 协议](/gateway/protocol)。

### Gateway 使用什么端口

`gateway.port` 控制用于 WebSocket + HTTP（Control UI、hooks 等）的单一多路复用端口。

优先级：

```
--port > OPENCLAW_GATEWAY_PORT > gateway.port > 默认 18789
```

### 为什么 openclaw gateway status 显示"Runtime: running"但"RPC probe: failed"

因为"running"是**supervisor**的视图（launchd/systemd/schtasks）。RPC probe 是 CLI 实际连接到 gateway WebSocket 并调用 `status`。

使用 `openclaw gateway status` 并信任这些行：

- `Probe target:`（probe 实际使用的 URL）
- `Listening:`（实际绑定在端口上的内容）
- `Last gateway error:`（进程活着但端口没有监听时的常见根本原因）

### 为什么 openclaw gateway status 显示"Config (cli)"和"Config (service)"不同

你在编辑一个配置文件，而服务正在运行另一个（通常是 `--profile` / `OPENCLAW_STATE_DIR` 不匹配）。

修复：

```bash
openclaw gateway install --force
```

从你希望服务使用的相同 `--profile` / 环境中运行。

### 如何以远程模式运行 OpenClaw（客户端连接到别处的 Gateway）

设置 `gateway.mode: "remote"` 并指向远程 WebSocket URL，可选地带有 token/password：

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://gateway.tailnet:18789",
      token: "your-token",
      password: "your-password",
    },
  },
}
```

注意：`openclaw gateway` 只在 `gateway.mode` 为 `local` 时启动（或你传递覆盖标志时）。

### Control UI 显示"unauthorized"（或一直重连），怎么办

你的 gateway 启用了 auth（`gateway.auth.*`），但 UI 没有发送匹配的 token/password。

修复：

- 最快：`openclaw dashboard`（打印 + 复制 dashboard URL，尝试打开；如果无头则显示 SSH 提示）。
- 如果你还没有 token：`openclaw doctor --generate-gateway-token`。
- 如果远程，先建立隧道：`ssh -N -L 18789:127.0.0.1:18789 user@host` 然后打开 `http://127.0.0.1:18789/`。
- 在 gateway 主机上设置 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 在 Control UI 设置中粘贴相同的 token。

参见 [Dashboard](/web/dashboard) 了解 auth 详情。

### 我设置了 gateway.bind tailnet 但无法绑定且没有任何监听

`tailnet` bind 从你的网络接口选择 Tailscale IP（100.64.0.0/10）。如果机器不在 Tailscale 上（或接口已关闭），就没有可绑定的地址。

修复：

- 在该主机上启动 Tailscale（使其有一个 100.x 地址），或
- 切换到 `gateway.bind: "loopback"` / `"lan"`。

---

## 日志和调试

### 日志在哪里

文件日志（结构化）：

```
/tmp/openclaw/openclaw-YYYY-MM-DD.log
```

你可以通过 `logging.file` 设置稳定路径。文件日志级别由 `logging.level` 控制。控制台详细程度由 `--verbose` 和 `logging.consoleLevel` 控制。

最快的日志尾随：

```bash
openclaw logs --follow
```

服务/supervisor 日志（gateway 通过 launchd/systemd 运行时）：

- macOS：`$OPENCLAW_STATE_DIR/logs/gateway.log` 和 `gateway.err.log`（默认：`~/.openclaw/logs/...`；profiles 使用 `~/.openclaw-<profile>/logs/...`）
- Linux：`journalctl --user -u openclaw-gateway[-<profile>].service -n 200 --no-pager`
- Windows：`schtasks /Query /TN "OpenClaw Gateway (<profile>)" /V /FO LIST`

参见 [故障排除](/gateway/troubleshooting#log-locations)。

### 如何启动/停止/重启 Gateway 服务

使用 gateway helpers：

```bash
openclaw gateway status
openclaw gateway restart
```

如果你手动运行 gateway，`openclaw gateway --force` 可以重新占用端口。参见 [Gateway](/gateway)。

### 我关闭了 Windows 终端，如何重启 OpenClaw

有**两种 Windows 安装模式**：

**1) WSL2（推荐）：** Gateway 在 Linux 内部运行。

打开 PowerShell，进入 WSL，然后重启：

```powershell
wsl
openclaw gateway status
openclaw gateway restart
```

如果你从未安装服务，在前台启动：

```bash
openclaw gateway run
```

**2) Native Windows（不推荐）：** Gateway 直接在 Windows 中运行。

打开 PowerShell 并运行：

```powershell
openclaw gateway status
openclaw gateway restart
```

如果你手动运行它（无服务），使用：

```powershell
openclaw gateway run
```

文档：[Windows（WSL2）](/platforms/windows)、[Gateway 服务手册](/gateway)。

### Gateway 正在运行但回复从未到达，检查什么

从快速健康检查开始：

```bash
openclaw status
openclaw models status
openclaw channels status
openclaw logs --follow
```

常见原因：

- Model auth 未在 **gateway 主机**上加载（检查 `models status`）
- Channel 配对/允许列表阻止回复（检查 channel 配置 + 日志）
- WebChat/Dashboard 打开时使用了错误的 token

如果你是远程访问，确认隧道/Tailscale 连接正常，Gateway WebSocket 可达。

文档：[Channels](/channels)、[故障排除](/gateway/troubleshooting)、[远程访问](/gateway/remote)。

### 无原因断开 gateway 连接，怎么办

这通常意味着 UI 丢失了 WebSocket 连接。检查：

1. Gateway 是否在运行？`openclaw gateway status`
2. Gateway 是否健康？`openclaw status`
3. UI 是否有正确的 token？`openclaw dashboard`
4. 如果是远程，隧道/Tailscale 链接是否正常？

然后尾随日志：

```bash
openclaw logs --follow
```

文档：[Dashboard](/web/dashboard)、[远程访问](/gateway/remote)、[故障排除](/gateway/troubleshooting)。

### Telegram setMyCommands 失败，检查什么

从日志和 channel 状态开始：

```bash
openclaw channels status
openclaw channels logs --channel telegram
```

然后匹配错误：

- `BOT_COMMANDS_TOO_MUCH`：Telegram 菜单条目太多。OpenClaw 已经修剪到 Telegram 限制并用更少的命令重试，但仍需要删除一些菜单条目。减少 plugin/skill/自定义命令，或者如果你不需要菜单，禁用 `channels.telegram.commands.native`。
- `TypeError: fetch failed`、`Network request for 'setMyCommands' failed!` 或类似网络错误：如果你在 VPS 或代理后面，确认允许出站 HTTPS 并且 DNS 对 `api.telegram.org` 有效。

如果 Gateway 是远程的，确保你查看的是 Gateway 主机上的日志。

文档：[Telegram](/channels/telegram)、[Channel 故障排除](/channels/troubleshooting)。

### TUI 没有显示输出，检查什么

首先确认 Gateway 可达且 agent 可以运行：

```bash
openclaw status
openclaw models status
openclaw logs --follow
```

在 TUI 中，使用 `/status` 查看当前状态。如果你期望在 chat channel 中有回复，确保启用了投递（`/deliver on`）。

文档：[TUI](/web/tui)、[Slash Commands](/tools/slash-commands)。

### 如何完全停止然后启动 Gateway

如果你安装了服务：

```bash
openclaw gateway stop
openclaw gateway start
```

这会停止/启动**受监督的服务**（macOS 上的 launchd，Linux 上的 systemd）。当 Gateway 作为守护进程在后台运行时使用这个。

如果你在前台运行，用 Ctrl-C 停止，然后：

```bash
openclaw gateway run
```

文档：[Gateway 服务手册](/gateway)。

### ELI5：openclaw gateway restart 和 openclaw gateway 的区别

- `openclaw gateway restart`：重启**后台服务**（launchd/systemd）。
- `openclaw gateway`：在前台为当前终端 session 运行 gateway。

如果你安装了服务，使用 gateway 命令。当你想要一次性、前台运行时使用 `openclaw gateway`。

### 当出错时最快获取更多详情的方法是什么

用 `--verbose` 启动 Gateway 以获得更多控制台详情。然后检查日志文件中的 channel auth、model 路由和 RPC 错误。

---

## Media 和附件

### 我的 skill 生成了 imagePDF 但什么都没有发送

来自 agent 的出站附件必须包含 `MEDIA:<path-or-url>` 行（单独一行）。参见 [OpenClaw assistant 设置](/start/openclaw) 和 [Agent send](/tools/agent-send)。

CLI 发送：

```bash
openclaw message send --target +15555550123 --message "Here you go" --media /path/to/file.png
```

也检查：

- 目标 channel 支持出站 media 且未被允许列表阻止
- 文件在 provider 的大小限制内（图像被调整为最大 2048px）

参见 [Images](/nodes/images)。

---

## 安全和访问控制

### 将 OpenClaw 暴露给入站 DMs 安全吗

将入站 DMs 视为不受信任的输入。默认设计为降低风险：

- DM 能力 channels 的默认行为是**配对**：
  - 未知发件人收到配对码；bot 不处理他们的消息。
  - 通过以下方式批准：`openclaw pairing approve --channel <channel> [--account <id>] <code>`
  - 待处理请求上限为**每个 channel 3 个**；如果代码没有到达，检查 `openclaw pairing list --channel <channel> [--account <id>]`。
- 公开开放 DMs 需要明确的选择加入（`dmPolicy: "open"` 和允许列表 `"*"`）。

运行 `openclaw doctor` 发现有风险的 DM 策略。

### Prompt injection 只是公共 bot 的问题吗

不。Prompt injection 是关于**不受信任的内容**，不只是谁可以 DM bot。
如果你的助手读取外部内容（网页搜索/fetch、浏览器页面、电子邮件、文档、附件、粘贴的日志），该内容可以包含试图劫持 model 的指令。**即使你是唯一的发送者**，这也可能发生。

当启用工具时风险最大：model 可能被诱骗代表你泄露 context 或调用工具。通过以下方式减小爆炸半径：

- 使用只读或工具禁用的"reader" agent 来摘要不受信任的内容
- 对于启用工具的 agents 关闭 `web_search` / `web_fetch` / `browser`
- 沙盒和严格的工具允许列表

详情：[安全](/gateway/security)。

### 我的 bot 应该有自己的 email、GitHub 账户或电话号码吗

是的，对于大多数设置。用单独的账户和电话号码隔离 bot 可以在出错时减小爆炸半径。这也使得在不影响个人账户的情况下轮换凭据或撤销访问变得更容易。

从小处开始。只给予你实际需要的工具和账户的访问权限，如果需要，以后再扩展。

文档：[安全](/gateway/security)、[配对](/channels/pairing)。

### 我可以给它对我短信的自主权吗，这安全吗

我们**不**推荐对你的个人消息完全自主。最安全的模式是：

- 将 DMs 保持在**配对模式**或严格的允许列表中
- 如果你想让它代表你发消息，使用**单独的号码或账户**
- 让它起草，然后**批准后再发送**

如果你想实验，在专用账户上进行并保持隔离。参见 [安全](/gateway/security)。

### 我可以为个人助手任务使用更便宜的 models 吗

可以，**如果** agent 只进行聊天且输入是受信任的。较小的层级更容易受到指令劫持，所以对于启用工具的 agents 或阅读不受信任内容时避免使用它们。如果必须使用较小的 model，锁定工具并在沙盒内运行。参见 [安全](/gateway/security)。

### 我在 Telegram 中运行了 start 但没有收到配对码

配对码**仅**在未知发件人给 bot 发消息且 `dmPolicy: "pairing"` 已启用时发送。`/start` 本身不生成代码。

检查待处理请求：

```bash
openclaw pairing list telegram
```

如果你想立即访问，将你的发件人 id 加入白名单或为该账户设置 `dmPolicy: "open"`。

### WhatsApp 会给我的联系人发消息吗，配对是如何工作的

不会。默认 WhatsApp DM 策略是**配对**。未知发件人只收到配对码，他们的消息**不被处理**。OpenClaw 只回复它收到的聊天或你触发的显式发送。

通过以下方式批准配对：

```bash
openclaw pairing approve whatsapp <code>
```

列出待处理请求：

```bash
openclaw pairing list whatsapp
```

向导电话号码提示：它用于设置你的**允许列表/所有者**，这样你自己的 DMs 被允许。它不用于自动发送。如果你在你的个人 WhatsApp 号码上运行，使用该号码并启用 `channels.whatsapp.selfChatMode`。

---

## 聊天命令、中止任务和"它不会停止"

### 如何阻止内部系统消息在聊天中显示

大多数内部或工具消息只在该 session 启用了 **verbose** 或 **reasoning** 时出现。

在你看到它的聊天中修复：

```
/verbose off
/reasoning off
```

如果仍然嘈杂，检查 Control UI 中的 session 设置并将 verbose 设置为 **inherit**。还确认你没有使用 bot profile，其中 `verboseDefault` 在 config 中设置为 `on`。

文档：[Thinking 和 verbose](/tools/thinking)、[安全](/gateway/security#reasoning--verbose-output-in-groups)。

### 如何停止/取消正在运行的任务

**单独发送**以下任意内容（不带 slash）：

```
stop
stop action
stop current action
stop run
stop current run
stop agent
stop the agent
stop openclaw
openclaw stop
stop don't do anything
stop do not do anything
stop doing anything
please stop
stop please
abort
esc
wait
exit
interrupt
```

这些是中止触发词（不是 slash commands）。

对于后台进程（来自 exec 工具），你可以让 agent 运行：

```
process action:kill sessionId:XXX
```

Slash commands 概述：参见 [Slash Commands](/tools/slash-commands)。

大多数命令必须作为以 `/` 开头的**独立**消息发送，但少数快捷方式（如 `/status`）也可以内联用于允许列表中的发件人。

### 如何从 Telegram 发送 Discord 消息——跨 context 消息被拒绝

OpenClaw 默认阻止**跨 provider** 消息。如果工具调用绑定到 Telegram，它不会发送到 Discord，除非你明确允许。

为 agent 启用跨 provider 消息：

```json5
{
  agents: {
    defaults: {
      tools: {
        message: {
          crossContext: {
            allowAcrossProviders: true,
            marker: { enabled: true, prefix: "[from {channel}] " },
          },
        },
      },
    },
  },
}
```

编辑 config 后重启 gateway。如果你只想针对单个 agent，在 `agents.list[].tools.message` 下设置。

### 为什么 bot 感觉像在忽略快速连发消息

Queue 模式控制新消息如何与正在运行中的任务交互。使用 `/queue` 更改模式：

- `steer` - 新消息重定向当前任务
- `followup` - 一次运行一条消息
- `collect` - 批量消息并回复一次（默认）
- `steer-backlog` - 现在引导，然后处理积压
- `interrupt` - 中止当前运行并重新开始

你可以添加选项如 `debounce:2s cap:25 drop:summarize` 用于 followup 模式。

---

## 杂项

### Anthropic 使用 API key 的默认 model 是什么

在 OpenClaw 中，凭据和 model 选择是分开的。设置 `ANTHROPIC_API_KEY`（或在 auth profiles 中存储 Anthropic API key）启用身份验证，但实际的默认 model 是你在 `agents.defaults.model.primary` 中配置的任何内容（例如，`anthropic/claude-sonnet-4-6` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，这意味着 Gateway 在正在运行的 agent 的预期 `auth-profiles.json` 中找不到 Anthropic 凭据。

---

还是卡住了？在 [Discord](https://discord.com/invite/clawd) 中询问或打开 [GitHub 讨论](https://github.com/openclaw/openclaw/discussions)。
