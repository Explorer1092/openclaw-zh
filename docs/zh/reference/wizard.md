---
mmh3_hash: "e09b9b342e692a3d78da52d430f705a2"
summary: "CLI 引导向导的完整参考：每个步骤、标志和配置字段"
read_when:
  - 查找特定的向导步骤或标志
  - 使用非交互式模式自动化引导
  - 调试向导行为
title: "引导向导参考"
sidebarTitle: "向导参考"
---

# 引导向导参考

这是 `openclaw onboard` CLI 向导的完整参考。有关高级概述，请参阅[引导向导](/start/wizard)。

## 流程详细信息（本地模式）

<Steps>
  <Step title="现有配置检测">
    - 如果 `~/.openclaw/openclaw.json` 存在，选择 **Keep / Modify / Reset**。
    - 重新运行向导**不会**清除任何内容，除非您明确选择 **Reset**（或传递 `--reset`）。
    - CLI `--reset` 默认为 `config+creds+sessions`；使用 `--reset-scope full` 也删除工作空间。
    - 如果配置无效或包含旧密钥，向导会停止并要求您在继续之前运行 `openclaw doctor`。
    - Reset 使用 `trash`（从不使用 `rm`）并提供范围：
      - 仅配置
      - 配置 + 凭据 + 会话
      - 完全重置（还删除工作空间）
  </Step>
  <Step title="模型/身份验证">
    - **Anthropic API 密钥**：如果存在则使用 `ANTHROPIC_API_KEY`，或提示输入密钥，然后保存以供守护程序使用。
    - **Anthropic API 密钥**：引导/配置中首选的 Anthropic 助手选项。
    - **Anthropic 安装令牌（旧版/手动）**：在引导/配置中再次可用，但 Anthropic 告知 OpenClaw 用户，OpenClaw Claude 登录路径算作第三方工具使用，需要 Claude 账户的 **Extra Usage**。
    - **OpenAI Code（Codex）订阅（Codex CLI）**：如果 `~/.codex/auth.json` 存在，向导可以重用它。重用的 Codex CLI 凭据继续由 Codex CLI 管理；到期时 OpenClaw 首先重新读取该来源，当 Provider 可以刷新时，将刷新的凭据写回 Codex 存储，而不是自行接管。
    - **OpenAI Code（Codex）订阅（OAuth）**：浏览器流程；粘贴 `code#state`。
      - 当模型未设置或为 `openai/*` 时，设置 `agents.defaults.model` 为 `openai-codex/gpt-5.4`。
    - **OpenAI API 密钥**：如果存在则使用 `OPENAI_API_KEY`，或提示输入密钥，然后将其存储在身份验证配置文件中。
      - 当模型未设置、为 `openai/*` 或 `openai-codex/*` 时，设置 `agents.defaults.model` 为 `openai/gpt-5.4`。
    - **xAI（Grok）API 密钥**：提示输入 `XAI_API_KEY` 并将 xAI 配置为模型 Provider。
    - **OpenCode**：提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`，在 https://opencode.ai/auth 获取），并让您选择 Zen 或 Go 目录。
    - **API 密钥**：为您存储密钥。
    - **Vercel AI Gateway（多模型代理）**：提示输入 `AI_GATEWAY_API_KEY`。
    - 更多详情：[Vercel AI Gateway](/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**：提示输入帐户 ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    - 更多详情：[Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
    - **MiniMax**：配置自动写入；托管默认为 `MiniMax-M2.7`，API 密钥使用 `minimax/...`，OAuth 使用 `minimax-portal/...`。
    - 更多详情：[MiniMax](/providers/minimax)
    - **StepFun**：为 StepFun 标准版或 Step Plan（中国或全球端点）自动写入配置。
    - 标准版目前包含 `step-3.5-flash`，Step Plan 还包含 `step-3.5-flash-2603`。
    - 更多详情：[StepFun](/providers/stepfun)
    - **Synthetic（Anthropic 兼容）**：提示输入 `SYNTHETIC_API_KEY`。
    - 更多详情：[Synthetic](/providers/synthetic)
    - **Moonshot（Kimi K2）**：配置自动写入。
    - **Kimi Coding**：配置自动写入。
    - 更多详情：[Moonshot AI（Kimi + Kimi Coding）](/providers/moonshot)
    - **Ollama**：提示输入 Ollama base URL，提供 **Cloud + Local** 或 **Local** 模式，发现可用模型，并在需要时自动拉取所选本地模型。
    - 更多详情：[Ollama](/providers/ollama)
    - **Skip**：尚未配置身份验证。
    - 从检测到的选项中选择默认模型（或手动输入 Provider/模型）。为了获得最佳质量和降低提示注入风险，请选择您 Provider 堆栈中可用的最强最新一代模型。
    - 向导运行模型检查，如果配置的模型未知或缺少身份验证，则发出警告。
    - API 密钥存储模式默认为明文身份验证配置文件值。使用 `--secret-input-mode ref` 改为存储环境支持的引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）。
    - 身份验证配置文件位于 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`（API 密钥 + OAuth）。`~/.openclaw/credentials/oauth.json` 仅作为旧版导入来源。
    - 更多详情：[/concepts/oauth](/concepts/oauth)
    <Note>
    无头/服务器提示：在具有浏览器的机器上完成 OAuth，然后将该 Agent 的 `auth-profiles.json`（例如 `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或匹配的 `$OPENCLAW_STATE_DIR/...` 路径）复制到 Gateway 主机。`credentials/oauth.json` 仅作为旧版导入来源。
    </Note>
  </Step>
  <Step title="工作空间">
    - 默认 `~/.openclaw/workspace`（可配置）。
    - 为 Agent 引导仪式播种所需的工作空间文件。
    - 完整的工作空间布局 + 备份指南：[Agent 工作空间](/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - 端口、绑定、身份验证模式、Tailscale 暴露。
    - 身份验证建议：即使对于回环也保持 **Token**，以便本地 WS 客户端必须进行身份验证。
    - 在 Token 模式下，交互式引导提供：
      - **生成/存储明文 Token**（默认）
      - **使用 SecretRef**（选择加入）
      - 快速开始跨 `env`、`file` 和 `exec` Provider 重用现有 `gateway.auth.token` SecretRef，用于引导探测/仪表板引导。
      - 如果该 SecretRef 已配置但无法解析，引导会提前失败，并给出明确的修复消息，而不是静默降级运行时身份验证。
    - 在密码模式下，交互式引导也支持明文或 SecretRef 存储。
    - 非交互式 Token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求引导进程环境中有非空的环境变量。
      - 不能与 `--gateway-token` 一起使用。
    - 仅当您完全信任每个本地进程时才禁用身份验证。
    - 非回环绑定仍然需要身份验证。
  </Step>
  <Step title="Channels">
    - [WhatsApp](/channels/whatsapp)：可选的 QR 登录。
    - [Telegram](/channels/telegram)：机器人令牌。
    - [Discord](/channels/discord)：机器人令牌。
    - [Google Chat](/channels/googlechat)：服务帐户 JSON + Webhook 受众。
    - [Mattermost](/channels/mattermost)（Plugin）：机器人令牌 + Base URL。
    - [Signal](/channels/signal)：可选的 `signal-cli` 安装 + 帐户配置。
    - [BlueBubbles](/channels/bluebubbles)：**推荐用于 iMessage**；服务器 URL + 密码 + Webhook。
    - [iMessage](/channels/imessage)：旧版 `imsg` CLI 路径 + DB 访问。
    - DM 安全性：默认为配对。第一个 DM 发送代码；通过 `openclaw pairing approve <channel> <code>` 批准或使用白名单。
  </Step>
  <Step title="Web 搜索">
    - 选择支持的 Provider，如 Brave、DuckDuckGo、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax Search、Ollama Web Search、Perplexity、SearXNG 或 Tavily（或跳过）。
    - 支持 API 的 Provider 可以使用环境变量或现有配置快速设置；无需密钥的 Provider 使用其 Provider 特定的前提条件。
    - 使用 `--skip-search` 跳过。
    - 稍后配置：`openclaw configure --section web`。
  </Step>
  <Step title="守护程序安装">
    - macOS：LaunchAgent
      - 需要已登录的用户会话；对于无头，使用自定义 LaunchDaemon（未提供）。
    - Linux（和 Windows 通过 WSL2）：systemd 用户单元
      - 向导尝试通过 `loginctl enable-linger <user>` 启用 lingering，以便 Gateway 在注销后保持运行。
      - 可能提示输入 sudo（写入 `/var/lib/systemd/linger`）；它首先尝试不使用 sudo。
    - **运行时选择：**Node（推荐；WhatsApp/Telegram 需要）。**不推荐** Bun。
    - 如果 Token 身份验证需要 Token 且 `gateway.auth.token` 由 SecretRef 管理，守护程序安装会验证它，但不会将解析的明文 Token 值持久化到守护进程服务环境元数据中。
    - 如果 Token 身份验证需要 Token 且配置的 Token SecretRef 未解析，守护程序安装将被阻止，并提供可操作的指导。
    - 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置且 `gateway.auth.mode` 未设置，守护程序安装将被阻止，直到明确设置模式。
  </Step>
  <Step title="健康检查">
    - 启动 Gateway（如果需要）并运行 `openclaw health`。
    - 提示：`openclaw status --deep` 将 Gateway 健康探测添加到状态输出（需要可访问的 Gateway）。
  </Step>
  <Step title="Skills（推荐）">
    - 读取可用的 Skills 并检查要求。
    - 让您选择节点管理器：**npm / pnpm**（不推荐 bun）。
    - 安装可选依赖项（有些在 macOS 上使用 Homebrew）。
  </Step>
  <Step title="完成">
    - 摘要 + 后续步骤，包括 iOS/Android/macOS 应用程序以获得额外功能。
  </Step>
</Steps>

<Note>
如果未检测到 GUI，向导会打印 SSH 端口转发指令以访问 Control UI，而不是打开浏览器。如果缺少 Control UI 资产，向导会尝试构建它们；回退是 `pnpm ui:build`（自动安装 UI 依赖项）。
</Note>

## 非交互式模式

使用 `--non-interactive` 自动化或脚本化引导：

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

添加 `--json` 以获得机器可读的摘要。

非交互式模式下的 Gateway Token SecretRef：

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` 和 `--gateway-token-ref-env` 互斥。

<Note>
`--json` **不**意味着非交互式模式。对于脚本，使用 `--non-interactive`（和 `--workspace`）。
</Note>

Provider 特定的命令示例位于 [CLI 自动化](/start/wizard-cli-automation#provider-specific-examples)。
使用此参考页面了解标志语义和步骤顺序。

### 添加 Agent（非交互式）

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## Gateway 向导 RPC

Gateway 通过 RPC 暴露向导流程（`wizard.start`、`wizard.next`、`wizard.cancel`、`wizard.status`）。客户端（macOS 应用程序、Control UI）可以渲染步骤，而无需重新实现引导逻辑。

## Signal 设置（signal-cli）

向导可以从 GitHub releases 安装 `signal-cli`：

- 下载适当的发布资产。
- 将其存储在 `~/.openclaw/tools/signal-cli/<version>/` 下。
- 将 `channels.signal.cliPath` 写入您的配置。

注意事项：

- JVM 构建需要 **Java 21**。
- 可用时使用本机构建。
- Windows 使用 WSL2；signal-cli 安装遵循 WSL 内的 Linux 流程。

## 向导写入的内容

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果选择 Minimax）
- `tools.profile`（本地引导默认为 `"coding"` 如果未设置；保留现有的显式值）
- `gateway.*`（模式、绑定、身份验证、Tailscale）
- `session.dmScope`（行为详情：[CLI 引导参考](/start/wizard-cli-reference#outputs-and-internals)）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- Channel 白名单（Slack/Discord/Matrix/Microsoft Teams），当您在提示期间选择加入时（名称在可能的情况下解析为 ID）。
- `skills.install.nodeManager`
  - `setup --node-manager` 接受 `npm`、`pnpm` 或 `bun`。
  - 手动配置仍可以通过直接设置 `skills.install.nodeManager` 使用 `yarn`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 写入 `agents.list[]` 和可选的 `bindings`。

WhatsApp 凭据位于 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。会话存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

某些 Channels 作为 Plugins 交付。当您在引导期间选择一个时，向导会提示安装它（npm 或本地路径），然后才能配置它。

## 相关文档

- 向导概述：[引导向导](/start/wizard)
- macOS 应用程序引导：[引导](/start/onboarding)
- 配置参考：[Gateway 配置](/gateway/configuration)
- Providers：[WhatsApp](/channels/whatsapp)、[Telegram](/channels/telegram)、[Discord](/channels/discord)、[Google Chat](/channels/googlechat)、[Signal](/channels/signal)、[BlueBubbles](/channels/bluebubbles)（iMessage）、[iMessage](/channels/imessage)（旧版）
- Skills：[Skills](/tools/skills)、[Skills 配置](/tools/skills-config)
