---
mmh3_hash: "239b742f9c7594f40e6f26ea57f43fa9"
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

**OpenClaw 是什么**

- [OpenClaw 和 pi-coding-agent 有什么区别](#openclaw-和-pi-coding-agent-有什么区别)
- [Gateway 是什么，为什么需要它](#gateway-是什么为什么需要它)
- [什么是 Channels](#什么是-channels)
- [我可以不用 Telegram、Discord 或 WhatsApp 吗](#我可以不用-telegramdiscord-或-whatsapp-吗)
- [OpenClaw 需要 VPS 吗](#openclaw-需要-vps-吗)

**Skills 和自动化**

- [什么是 Skills，它们如何工作](#什么是-skills它们如何工作)
- [我在哪里找到 Skills](#我在哪里找到-skills)
- [什么是 Workflow Skills](#什么是-workflow-skills)
- [如何创建自定义 Slash Command](#如何创建自定义-slash-command)
- [Slash Commands 和 Skills 有什么区别](#slash-commands-和-skills-有什么区别)

**沙盒**

- [什么是沙盒，如何启用它](#什么是沙盒如何启用它)

**Memory**

- [Memory 如何工作](#memory-如何工作)
- [如何关闭 memory 摘要](#如何关闭-memory-摘要)

**磁盘上的文件位置**

- [状态文件在哪里](#状态文件在哪里)
- [如何更改 gateway 状态目录](#如何更改-gateway-状态目录)

**配置基础**

- [配置文件在哪里](#配置文件在哪里)
- [config set 和 config edit 有什么区别](#config-set-和-config-edit-有什么区别)
- [我可以对 config 使用环境变量吗](#我可以对-config-使用环境变量吗)
- [什么是 profile，如何在多个 bot 账户之间切换](#什么是-profile如何在多个-bot-账户之间切换)

**远程 Gateways 和 Nodes**

- [什么是 Node](#什么是-node)
- [如何从笔记本连接到远程 gateway](#如何从笔记本连接到远程-gateway)
- [如何在没有 VPN 的情况下安全地远程访问 gateway](#如何在没有-vpn-的情况下安全地远程访问-gateway)
- [什么是 Tailscale 以及何时使用它](#什么是-tailscale-以及何时使用它)

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

**Model Failover 和"所有 models 失败"**

- [什么是 model failover](#什么是-model-failover)
- [所有 models 失败 是什么意思](#所有-models-失败-是什么意思)

**Auth Profiles**

- [什么是 auth profile](#什么是-auth-profile)
- [如何从 CLI 设置 auth profile](#如何从-cli-设置-auth-profile)

**Gateway 端口、"已在运行"和远程模式**

- [如何更改 gateway 端口](#如何更改-gateway-端口)
- [gateway 已经在运行是什么意思](#gateway-已经在运行是什么意思)
- [在同一机器上运行多个 gateway 实例](#在同一机器上运行多个-gateway-实例)
- [什么是 invalid handshake / code 1008](#什么是-invalid-handshake--code-1008)

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

---

## Memory

### Memory 如何工作

OpenClaw 在 session 结束或触发时运行**memory 摘要**。摘要（存储在 `MEMORY.md` 或 `memory/YYYY-MM-DD.md` 每日文件中）在后续 sessions 中注入，使 agent 记住过去的 context。

向量搜索（当启用时）让 agent 在许多记忆中搜索相关 context，而无需将所有内容放入 context 窗口。

参见 [Memory](/concepts/memory)。

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

---

## Auth Profiles

### 什么是 auth profile

Auth profile 是一组凭据（API key、OAuth token 等），用于向特定 AI provider 进行身份验证。你可以有多个 profiles（例如，同一 provider 的不同账户），OpenClaw 使用它们进行 failover 或负载均衡。

参见 [Auth Profiles](/concepts/auth-profiles)。

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

检查：

- 你的 TUI/Dashboard 指向正确的 gateway URL 和 token
- 运行 `openclaw dashboard` 生成正确的已认证 URL
- 如果远程，确认 Tailscale/隧道正在工作

Protocol 详情：[Gateway 协议](/gateway/protocol)。

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

**Q："Anthropic 使用 API key 的默认 model 是什么？"**

**A：** 在 OpenClaw 中，凭据和 model 选择是分开的。设置 `ANTHROPIC_API_KEY`（或在 auth profiles 中存储 Anthropic API key）启用身份验证，但实际的默认 model 是你在 `agents.defaults.model.primary` 中配置的任何内容（例如，`anthropic/claude-sonnet-4-5` 或 `anthropic/claude-opus-4-6`）。如果你看到 `No credentials found for profile "anthropic:default"`，这意味着 Gateway 在正在运行的 agent 的预期 `auth-profiles.json` 中找不到 Anthropic 凭据。

---

还是卡住了？在 [Discord](https://discord.com/invite/clawd) 中询问或打开 [GitHub 讨论](https://github.com/openclaw/openclaw/discussions)。
