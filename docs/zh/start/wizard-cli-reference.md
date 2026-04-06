---
mmh3_hash: "439cde9014ac2a2ee58db70f0e8bed36"
summary: "CLI 引导流程、认证/模型设置、输出和内部的完整参考"
read_when:
  - 您需要 openclaw onboard 的详细行为
  - 您正在调试引导结果或集成引导客户端
title: "CLI 引导参考"
sidebarTitle: "CLI 参考"
---

# CLI 引导参考

此页面是 `openclaw onboard` 的完整参考。有关简短指南，请参阅[引导向导（CLI）](/start/wizard)。

## 向导的作用

本地模式（默认）引导您完成：

- 模型和认证设置（OpenAI Code 订阅 OAuth、Anthropic Claude CLI 或 API 密钥，以及 MiniMax、GLM、Ollama、Moonshot、StepFun 和 AI Gateway 选项）
- 工作区位置和引导文件
- Gateway 设置（端口、绑定、认证、Tailscale）
- Channel 和 Provider（Telegram、WhatsApp、Discord、Google Chat、Mattermost、Signal、BlueBubbles 及其他捆绑 Channel 插件）
- 守护程序安装（LaunchAgent、systemd 用户单元，或原生 Windows 计划任务，带 Startup 文件夹回退）
- 健康检查
- Skill 设置

远程模式将此机器配置为连接到其他地方的 Gateway。它不会在远程主机上安装或修改任何内容。

## 本地流程详细信息

<Steps>
  <Step title="现有配置检测">
    - 如果 `~/.openclaw/openclaw.json` 存在，选择 Keep、Modify 或 Reset。
    - 重新运行向导不会清除任何内容，除非您明确选择 Reset（或传递 `--reset`）。
    - CLI `--reset` 默认为 `config+creds+sessions`；使用 `--reset-scope full` 也删除工作区。
    - 如果配置无效或包含旧密钥，向导会停止并要求您在继续之前运行 `openclaw doctor`。
    - Reset 使用 `trash` 并提供范围：
      - 仅配置
      - 配置 + 凭据 + Session
      - 完全重置（还删除工作区）
  </Step>
  <Step title="模型和认证">
    - 完整选项矩阵在[认证和模型选项](#认证和模型选项)中。
  </Step>
  <Step title="工作区">
    - 默认 `~/.openclaw/workspace`（可配置）。
    - 为首次运行引导仪式播种所需的工作区文件。
    - 工作区布局：[Agent 工作区](/concepts/agent-workspace)。
  </Step>
  <Step title="Gateway">
    - 提示端口、绑定、认证模式和 Tailscale 暴露。
    - 建议：即使对于回环也保持令牌认证启用，以便本地 WS 客户端必须进行身份验证。
    - 在 Token 模式下，交互式引导提供：
      - **生成/存储明文 Token**（默认）
      - **使用 SecretRef**（选择加入）
    - 在密码模式下，交互式引导也支持明文或 SecretRef 存储。
    - 非交互式 Token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
      - 要求引导进程环境中有非空的环境变量。
      - 不能与 `--gateway-token` 一起使用。
    - 仅当您完全信任每个本地进程时才禁用认证。
    - 非回环绑定仍然需要认证。
  </Step>
  <Step title="Channel">
    - [WhatsApp](/channels/whatsapp)：可选的 QR 登录
    - [Telegram](/channels/telegram)：机器人令牌
    - [Discord](/channels/discord)：机器人令牌
    - [Google Chat](/channels/googlechat)：服务账号 JSON + Webhook 受众
    - [Mattermost](/channels/mattermost)：机器人令牌 + Base URL
    - [Signal](/channels/signal)：可选的 `signal-cli` 安装 + 账号配置
    - [BlueBubbles](/channels/bluebubbles)：推荐用于 iMessage；服务器 URL + 密码 + Webhook
    - [iMessage](/channels/imessage)：旧版 `imsg` CLI 路径 + DB 访问
    - DM 安全性：默认为配对。第一个 DM 发送代码；通过 `openclaw pairing approve <channel> <code>` 批准或使用白名单。
  </Step>
  <Step title="守护程序安装">
    - macOS：LaunchAgent
      - 需要已登录的用户 Session；对于无头，使用自定义 LaunchDaemon（未提供）。
    - Linux 和 Windows 通过 WSL2：systemd 用户单元
      - 向导尝试 `loginctl enable-linger <user>`，以便 Gateway 在注销后保持运行。
      - 可能提示输入 sudo（写入 `/var/lib/systemd/linger`）；它首先尝试不使用 sudo。
    - 原生 Windows：优先使用计划任务
      - 如果任务创建被拒绝，OpenClaw 回退到每用户 Startup 文件夹登录项，并立即启动 Gateway。
      - 计划任务仍是优选，因为它提供更好的监督状态。
    - 运行时选择：Node（推荐；WhatsApp 和 Telegram 需要）。不推荐 Bun。
  </Step>
  <Step title="健康检查">
    - 启动 Gateway（如果需要）并运行 `openclaw health`。
    - `openclaw status --deep` 将实时 Gateway 健康探测添加到状态输出，支持时包含 Channel 探针。
  </Step>
  <Step title="Skill">
    - 读取可用的 Skill 并检查要求。
    - 让您选择节点管理器：npm、pnpm 或 bun。
    - 安装可选依赖项（有些在 macOS 上使用 Homebrew）。
  </Step>
  <Step title="完成">
    - 摘要和后续步骤，包括 iOS、Android 和 macOS 应用程序选项。
  </Step>
</Steps>

<Note>
如果未检测到 GUI，向导会打印 SSH 端口转发指令以访问 Control UI，而不是打开浏览器。
如果缺少 Control UI 资产，向导会尝试构建它们；回退是 `pnpm ui:build`（自动安装 UI 依赖项）。
</Note>

## 远程模式详细信息

远程模式将此机器配置为连接到其他地方的 Gateway。

<Info>
远程模式不会在远程主机上安装或修改任何内容。
</Info>

您设置的内容：

- 远程 Gateway URL（`ws://...`）
- 如果需要远程 Gateway 认证，则使用令牌（推荐）

<Note>
- 如果 Gateway 仅限回环，请使用 SSH 隧道或 tailnet。
- 发现提示：
  - macOS：Bonjour（`dns-sd`）
  - Linux：Avahi（`avahi-browse`）
</Note>

## 认证和模型选项

<AccordionGroup>
  <Accordion title="Anthropic API 密钥">
    如果存在则使用 `ANTHROPIC_API_KEY`，或提示输入密钥，然后保存以供守护程序使用。
  </Accordion>
  <Accordion title="OpenAI Code 订阅（Codex CLI 重用）">
    如果 `~/.codex/auth.json` 存在，向导可以重用它。
    重用的 Codex CLI 凭据仍由 Codex CLI 管理；到期时 OpenClaw
    首先重新读取该来源，当 Provider 可以刷新时，将刷新的凭据写回
    Codex 存储，而不是自己接管。
  </Accordion>
  <Accordion title="OpenAI Code 订阅（OAuth）">
    浏览器流程；粘贴 `code#state`。

    当模型未设置或为 `openai/*` 时，设置 `agents.defaults.model` 为 `openai-codex/gpt-5.4`。

  </Accordion>
  <Accordion title="OpenAI API 密钥">
    如果存在则使用 `OPENAI_API_KEY`，或提示输入密钥，然后将凭据存储在认证配置文件中。

    当模型未设置、为 `openai/*` 或 `openai-codex/*` 时，设置 `agents.defaults.model` 为 `openai/gpt-5.4`。

  </Accordion>
  <Accordion title="xAI（Grok）API 密钥">
    提示输入 `XAI_API_KEY` 并将 xAI 配置为模型 Provider。
  </Accordion>
  <Accordion title="OpenCode">
    提示输入 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`），并让您选择 Zen 或 Go 目录。
    设置 URL：[opencode.ai/auth](https://opencode.ai/auth)。
  </Accordion>
  <Accordion title="API 密钥（通用）">
    为您存储密钥。
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    提示输入 `AI_GATEWAY_API_KEY`。
    更多详情：[Vercel AI Gateway](/providers/vercel-ai-gateway)。
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    提示输入账号 ID、Gateway ID 和 `CLOUDFLARE_AI_GATEWAY_API_KEY`。
    更多详情：[Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)。
  </Accordion>
  <Accordion title="MiniMax">
    配置自动写入。托管默认为 `MiniMax-M2.7`；API 密钥设置使用
    `minimax/...`，OAuth 设置使用 `minimax-portal/...`。
    更多详情：[MiniMax](/providers/minimax)。
  </Accordion>
  <Accordion title="StepFun">
    针对中国或全球端点上的 StepFun 标准或 Step Plan 自动写入配置。
    标准目前包括 `step-3.5-flash`，Step Plan 还包括 `step-3.5-flash-2603`。
    更多详情：[StepFun](/providers/stepfun)。
  </Accordion>
  <Accordion title="Synthetic（Anthropic 兼容）">
    提示输入 `SYNTHETIC_API_KEY`。
    更多详情：[Synthetic](/providers/synthetic)。
  </Accordion>
  <Accordion title="Ollama（云端和本地开源模型）">
    提示输入 Base URL（默认 `http://127.0.0.1:11434`），然后提供云端 + 本地或仅本地模式。
    发现可用模型并建议默认值。
    更多详情：[Ollama](/providers/ollama)。
  </Accordion>
  <Accordion title="Moonshot 和 Kimi Coding">
    Moonshot（Kimi K2）和 Kimi Coding 配置自动写入。
    更多详情：[Moonshot AI（Kimi + Kimi Coding）](/providers/moonshot)。
  </Accordion>
  <Accordion title="自定义 Provider">
    适用于 OpenAI 兼容和 Anthropic 兼容的端点。

    交互式引导支持与其他 Provider API 密钥流程相同的 API 密钥存储选择：
    - **立即粘贴 API 密钥**（明文）
    - **使用密钥引用**（环境引用或配置的 Provider 引用，带预检验证）

    非交互式标志：
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key`（可选；回退到 `CUSTOM_API_KEY`）
    - `--custom-provider-id`（可选）
    - `--custom-compatibility <openai|anthropic>`（可选；默认 `openai`）

  </Accordion>
  <Accordion title="Skip">
    保持认证未配置。
  </Accordion>
</AccordionGroup>

模型行为：

- 从检测到的选项中选择默认模型，或手动输入 Provider 和模型。
- 当引导从 Provider 认证选择开始时，模型选择器会自动偏向该 Provider。对于 Volcengine 和 BytePlus，同样的偏向也匹配其编码计划变体（`volcengine-plan/*`、`byteplus-plan/*`）。
- 如果该偏向 Provider 过滤器结果为空，选择器会回退到完整目录，而不是显示无模型。
- 向导运行模型检查，如果配置的模型未知或缺少认证，则发出警告。

凭据和配置文件路径：

- 认证配置文件（API 密钥 + OAuth）：`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- 旧版 OAuth 导入：`~/.openclaw/credentials/oauth.json`

凭据存储模式：

- 默认引导行为将 API 密钥作为明文值保存在认证配置文件中。
- `--secret-input-mode ref` 启用引用模式，而不是明文密钥存储。
  在交互式引导中，您可以选择以下任一方式：
  - 环境变量引用（例如 `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`）
  - 配置的 Provider 引用（`file` 或 `exec`），带 Provider 别名 + id
- 交互式引用模式在保存之前运行快速预检验证。
  - 环境引用：验证变量名 + 当前引导环境中的非空值。
  - Provider 引用：验证 Provider 配置并解析请求的 id。
  - 如果预检失败，引导显示错误并允许您重试。
- 在非交互式模式中，`--secret-input-mode ref` 仅支持环境支持。
  - 在引导进程环境中设置 Provider 环境变量。
  - 内联密钥标志（例如 `--openai-api-key`）需要设置该环境变量；否则引导快速失败。
  - 对于自定义 Provider，非交互式 `ref` 模式将 `models.providers.<id>.apiKey` 存储为 `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`。
  - 在该自定义 Provider 的情况下，`--custom-api-key` 需要设置 `CUSTOM_API_KEY`；否则引导快速失败。
- Gateway 认证凭据在交互式引导中支持明文和 SecretRef 选择：
  - Token 模式：**生成/存储明文 Token**（默认）或**使用 SecretRef**。
  - 密码模式：明文或 SecretRef。
- 非交互式 Token SecretRef 路径：`--gateway-token-ref-env <ENV_VAR>`。
- 现有的明文设置继续正常工作。

<Note>
无头和服务器提示：在具有浏览器的机器上完成 OAuth，然后将该 Agent 的 `auth-profiles.json`（例如
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`，或匹配的
`$OPENCLAW_STATE_DIR/...` 路径）复制到 Gateway 主机。`credentials/oauth.json`
仅是旧版导入来源。
</Note>

## 输出和内部

`~/.openclaw/openclaw.json` 中的典型字段：

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers`（如果选择 Minimax）
- `tools.profile`（本地引导在未设置时默认为 `"coding"`；现有显式值会被保留）
- `gateway.*`（模式、绑定、认证、Tailscale）
- `session.dmScope`（本地引导在未设置时将此默认为 `per-channel-peer`；现有显式值会被保留）
- `channels.telegram.botToken`、`channels.discord.token`、`channels.matrix.*`、`channels.signal.*`、`channels.imessage.*`
- Channel 白名单（Slack、Discord、Matrix、Microsoft Teams），当您在提示期间选择加入时（名称在可能的情况下解析为 ID）
- `skills.install.nodeManager`
  - `setup --node-manager` 标志接受 `npm`、`pnpm` 或 `bun`。
  - 手动配置之后仍可设置 `skills.install.nodeManager: "yarn"`。
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` 写入 `agents.list[]` 和可选的 `bindings`。

WhatsApp 凭据位于 `~/.openclaw/credentials/whatsapp/<accountId>/` 下。Session 存储在 `~/.openclaw/agents/<agentId>/sessions/` 下。

<Note>
某些 Channel 作为插件交付。在引导期间选择时，向导会提示安装插件（npm 或本地路径），然后才能进行 Channel 配置。
</Note>

Gateway 向导 RPC：

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

客户端（macOS 应用和 Control UI）可以渲染步骤，而无需重新实现引导逻辑。

Signal 设置行为：

- 下载适当的发布资产
- 将其存储在 `~/.openclaw/tools/signal-cli/<version>/` 下
- 在配置中写入 `channels.signal.cliPath`
- JVM 构建需要 Java 21
- 可用时使用本机构建
- Windows 使用 WSL2 并在 WSL 内遵循 Linux signal-cli 流程

## 相关文档

- 引导中心：[引导向导（CLI）](/start/wizard)
- 自动化和脚本：[CLI 自动化](/start/wizard-cli-automation)
- 命令参考：[`openclaw onboard`](/cli/onboard)
