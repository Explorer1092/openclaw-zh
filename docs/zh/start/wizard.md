---
title: "引导向导(CLI)"
sidebarTitle: "向导"
mmh3_hash: "de05552de0231eb953e575b3274503f8"
summary: "CLI 引导向导:网关、工作空间、频道和技能的引导式设置"
read_when:
  - 运行或配置引导向导
  - 设置新机器
---

# 引导向导(CLI)

引导向导是在 macOS、Linux 或 Windows(通过 WSL2;强烈推荐)上设置 OpenClaw 的**推荐**方式。
它在一个引导式流程中配置本地网关或远程网关连接,以及频道、技能和工作空间默认值。

主要入口点:

```bash
openclaw onboard
```

最快的第一次聊天:打开控制 UI(无需频道设置)。运行
`openclaw dashboard` 并在浏览器中聊天。文档:[仪表板](/web/dashboard)。

后续重新配置:

```bash
openclaw configure
```

推荐:设置 Brave Search API 密钥,以便代理可以使用 `web_search`
(`web_fetch` 无需密钥即可工作)。最简单的路径:`openclaw configure --section web`
它存储 `tools.web.search.apiKey`。文档:[Web 工具](/tools/web)。

## 快速开始 vs 高级

向导从**快速开始**(默认值)vs **高级**(完全控制)开始。

**快速开始**保留默认值:
- 本地网关(loopback)
- 工作空间默认值(或现有工作空间)
- 网关端口 **18789**
- 网关身份验证 **令牌**(自动生成,即使在 loopback 上)
- Tailscale 暴露 **关闭**
- Telegram + WhatsApp DM 默认为 **allowlist**(您将被提示输入您的电话号码)

**高级**公开每个步骤(模式、工作空间、网关、频道、守护进程、技能)。

## 向导做什么

**本地模式(默认)**引导您完成:
  - 模型/身份验证(OpenAI Code (Codex) 订阅 OAuth、Anthropic API 密钥(推荐)或 setup-token(粘贴),以及 MiniMax/GLM/Moonshot/AI Gateway 选项)
- 工作空间位置 + 引导文件
- 网关设置(端口/绑定/身份验证/tailscale)
- 提供者(Telegram、WhatsApp、Discord、Google Chat、Mattermost(插件)、Signal)
- 守护进程安装(LaunchAgent / systemd 用户单元)
- 健康检查
- 技能(推荐)

**远程模式**仅配置本地客户端以连接到其他地方的网关。
它**不**在远程主机上安装或更改任何内容。

要添加更多隔离的代理(单独的工作空间 + 会话 + 身份验证),请使用:

```bash
openclaw agents add <name>
```

提示:`--json` **不**暗示非交互式模式。使用 `--non-interactive`(和 `--workspace`)用于脚本。

## 流程详细信息(本地)

1) **现有配置检测**
   - 如果 `~/.openclaw/openclaw.json` 存在,选择 **保留 / 修改 / 重置**。
   - 重新运行向导**不会**擦除任何内容,除非您明确选择 **重置**
     (或传递 `--reset`)。
   - 如果配置无效或包含遗留密钥,向导会停止并要求
     您在继续之前运行 `openclaw doctor`。
   - 重置使用 `trash`(从不 `rm`)并提供作用域:
     - 仅配置
     - 配置 + 凭据 + 会话
     - 完全重置(还删除工作空间)

2) **模型/身份验证**
   - **Anthropic API 密钥(推荐)**:如果存在则使用 `ANTHROPIC_API_KEY`,或提示输入密钥,然后保存以供守护进程使用。
   - **Anthropic OAuth(Claude Code CLI)**:在 macOS 上,向导检查钥匙串项目"Claude Code-credentials"(选择"始终允许",以便 launchd 启动不会阻塞);在 Linux/Windows 上,如果存在则重用 `~/.claude/.credentials.json`。
   - **Anthropic 令牌(粘贴 setup-token)**:在任何机器上运行 `claude setup-token`,然后粘贴令牌(您可以命名它;空白 = 默认)。
   - **OpenAI Code (Codex) 订阅(Codex CLI)**:如果 `~/.codex/auth.json` 存在,向导可以重用它。
   - **OpenAI Code (Codex) 订阅(OAuth)**:浏览器流程;粘贴 `code#state`。
     - 当模型未设置或 `openai/*` 时,将 `agents.defaults.model` 设置为 `openai-codex/gpt-5.2`。
   - **OpenAI API 密钥**:如果存在则使用 `OPENAI_API_KEY`,或提示输入密钥,然后保存到 `~/.openclaw/.env`,以便 launchd 可以读取它。
   - **OpenCode Zen(多模型代理)**:提示输入 `OPENCODE_API_KEY`(或 `OPENCODE_ZEN_API_KEY`,在 https://opencode.ai/auth 获取)。
   - **API 密钥**:为您存储密钥。
   - **Vercel AI Gateway(多模型代理)**:提示输入 `AI_GATEWAY_API_KEY`。
   - 更多详细信息:[Vercel AI Gateway](/providers/vercel-ai-gateway)
   - **MiniMax M2.1**:自动写入配置。
   - 更多详细信息:[MiniMax](/providers/minimax)
   - **Synthetic(Anthropic 兼容)**:提示输入 `SYNTHETIC_API_KEY`。
   - 更多详细信息:[Synthetic](/providers/synthetic)
   - **Moonshot(Kimi K2)**:自动写入配置。
   - **Kimi Coding**:自动写入配置。
   - 更多详细信息:[Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
   - **跳过**:尚未配置身份验证。
   - 从检测到的选项中选择默认模型(或手动输入提供者/模型)。
   - 向导运行模型检查,如果配置的模型未知或缺少身份验证,则发出警告。
  - OAuth 凭据存放在 `~/.openclaw/credentials/oauth.json` 中;身份验证配置文件存放在 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 中(API 密钥 + OAuth)。
   - 更多详细信息:[/concepts/oauth](/concepts/oauth)

3) **工作空间**
   - 默认 `~/.openclaw/workspace`(可配置)。
   - 为代理引导仪式所需的工作空间文件设定种子。
   - 完整的工作空间布局 + 备份指南:[代理工作空间](/concepts/agent-workspace)

4) **网关**
   - 端口、绑定、身份验证模式、tailscale 暴露。
   - 身份验证建议:即使对于 loopback,也保留 **令牌**,以便本地 WS 客户端必须进行身份验证。
   - 仅当您完全信任每个本地进程时才禁用身份验证。
   - 非 loopback 绑定仍需要身份验证。

5) **频道**
   - [WhatsApp](/channels/whatsapp):可选的 QR 登录。
   - [Telegram](/channels/telegram):机器人令牌。
   - [Discord](/channels/discord):机器人令牌。
   - [Google Chat](/channels/googlechat):服务账户 JSON + webhook 受众。
   - [Mattermost](/channels/mattermost)(插件):机器人令牌 + 基础 URL。
   - [Signal](/channels/signal):可选的 `signal-cli` 安装 + 账户配置。
   - [iMessage](/channels/imessage):本地 `imsg` CLI 路径 + DB 访问。
   - DM 安全:默认为配对。第一个 DM 发送代码;通过 `openclaw pairing approve <channel> <code>` 批准或使用 allowlist。

6) **守护进程安装**
   - macOS:LaunchAgent
     - 需要登录的用户会话;对于无头,使用自定义 LaunchDaemon(未提供)。
   - Linux(和通过 WSL2 的 Windows):systemd 用户单元
     - 向导尝试通过 `loginctl enable-linger <user>` 启用持久性,以便网关在注销后保持运行。
     - 可能提示输入 sudo(写入 `/var/lib/systemd/linger`);它首先尝试不使用 sudo。
   - **运行时选择:**Node(推荐;WhatsApp/Telegram 需要)。**不推荐** Bun。

7) **健康检查**
   - 启动网关(如果需要)并运行 `openclaw health`。
   - 提示:`openclaw status --deep` 将网关健康探测添加到状态输出(需要可访问的网关)。

8) **技能(推荐)**
   - 读取可用技能并检查要求。
   - 让您选择节点管理器:**npm / pnpm**(不推荐 bun)。
   - 安装可选依赖项(一些在 macOS 上使用 Homebrew)。

9) **完成**
   - 摘要 + 后续步骤,包括 iOS/Android/macOS 应用以获取额外功能。
  - 如果未检测到 GUI,向导会打印控制 UI 的 SSH 端口转发说明,而不是打开浏览器。
  - 如果缺少控制 UI 资产,向导尝试构建它们;后备是 `pnpm ui:build`(自动安装 UI 依赖项)。

## 远程模式

远程模式配置本地客户端以连接到其他地方的网关。

您将设置什么:
- 远程网关 URL(`ws://...`)
- 如果远程网关需要身份验证(推荐),则需要令牌

注意:
- 不执行远程安装或守护进程更改。
- 如果网关仅为 loopback,请使用 SSH 隧道或 tailnet。
- 发现提示:
  - macOS:Bonjour(`dns-sd`)
  - Linux:Avahi(`avahi-browse`)

## 添加另一个代理

使用 `openclaw agents add <name>` 创建一个单独的代理,拥有自己的工作空间、
会话和身份验证配置文件。在没有 `--workspace` 的情况下运行会启动向导。

它设置什么:
- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

注意:
- 默认工作空间遵循 `~/.openclaw/workspace-<agentId>`。
- 添加 `bindings` 以路由入站消息(向导可以执行此操作)。
- 非交互式标志:`--model`、`--agent-dir`、`--bind`、`--non-interactive`。

## 非交互式模式

使用 `--non-interactive` 自动化或脚本化引导:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

添加 `--json` 以获取机器可读的摘要。

Gemini 示例:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

Z.AI 示例:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice zai-api-key \
  --zai-api-key "$ZAI_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

Vercel AI Gateway 示例:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

Moonshot 示例:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice moonshot-api-key \
  --moonshot-api-key "$MOONSHOT_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

Synthetic 示例:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice synthetic-api-key \
  --synthetic-api-key "$SYNTHETIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

OpenCode Zen 示例:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice opencode-zen \
  --opencode-zen-api-key "$OPENCODE_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback
```

添加代理(非交互式)示例:

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.2 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## 网关向导 RPC

网关通过 RPC 公开向导流程(`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`)。
客户端(macOS 应用、控制 UI)可以渲染步骤,而无需重新实现引导逻辑。

## Signal 设置(signal-cli)

向导可以从 GitHub 发布版本安装 `signal-cli`:
- 下载适当的发布资产。
- 将其存储在 `~/.openclaw/tools/signal-cli/<version>/` 下。
- 将 `channels.signal.cliPath` 写入您的配置。

注意:
- JVM 构建需要 **Java 21**。
- 在可用时使用原生构建。
- Windows 使用 WSL2;signal-cli 安装遵循 WSL 内部的 Linux 流程。

## 向导写入什么

`~/.openclaw/openclaw.json` 中的典型字段:
- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`(如果选择 Minimax)
- `gateway.*`(模式、绑定、身份验证、tailscale)
- `channels.telegram.botToken`、`channels.discord.token`、`channels.signal.*`、`channels.imessage.*`
- 频道 allowlist(Slack/Discord/Matrix/Microsoft Teams),当您在提示期间选择加入时(名称在可能时解析为 ID)。
- `skills.install.nodeManager`
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 写入 `agents.list[]` 和可选的 `bindings`。

WhatsApp 凭据位于 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。
会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

某些频道作为插件交付。当您在引导期间选择一个时,向导
将提示安装它(npm 或本地路径),然后才能配置它。

## 相关文档

- macOS 应用引导:[引导](/start/onboarding)
- 配置参考:[网关配置](/gateway/configuration)
- 提供者:[WhatsApp](/channels/whatsapp)、[Telegram](/channels/telegram)、[Discord](/channels/discord)、[Google Chat](/channels/googlechat)、[Signal](/channels/signal)、[iMessage](/channels/imessage)
- 技能:[技能](/tools/skills)、[技能配置](/tools/skills-config)
