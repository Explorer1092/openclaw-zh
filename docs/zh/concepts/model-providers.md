---
mmh3_hash: "d5160ad1ed6efd30ec6dc73d825d53e9"
summary: "Model provider 概述，包含示例配置 + CLI 流程"
read_when:
  - 需要按 provider 的 model 设置参考
  - 需要 model provider 的示例配置或 CLI 引导命令
title: "Model providers"
sidebarTitle: "Model providers"
---

**LLM/model providers** 参考（不包括 WhatsApp/Telegram 等聊天 channel）。model 选择规则见 [Models](/concepts/models)。

## 快速规则

<AccordionGroup>
  <Accordion title="Model 引用和 CLI 助手">
    - Model 引用使用 `provider/model`（示例：`opencode/claude-opus-4-6`）。
    - 设置后，`agents.defaults.models` 充当允许列表。
    - CLI 助手：`openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` 设置 provider 级别默认值；`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` 按 model 覆盖。
    - 故障转移规则、冷却探测和 Session 覆盖持久化：[Model failover](/concepts/model-failover)。

  </Accordion>
  <Accordion title="添加 provider auth 不会改变你的主 model">
    `openclaw configure` 在你添加或重新认证 provider 时保留现有的 `agents.defaults.model.primary`。`openclaw models auth login` 也同样，除非传递 `--set-default`。Provider Plugin 可能仍然在其 auth 配置补丁中返回推荐的默认 model，但当已存在主 model 时，OpenClaw 将其视为"使该 model 可用"，而不是"替换当前主 model"。

    要有意切换默认 model，使用 `openclaw models set <provider/model>` 或 `openclaw models auth login --provider <id> --set-default`。

  </Accordion>
  <Accordion title="OpenAI provider/runtime 分离">
    OpenAI 系列路由按前缀区分：

    - `openai/<model>` 默认为 agent 轮次使用原生 Codex app-server 运行。这是通常的 ChatGPT/Codex 订阅设置。
    - `openai-codex/<model>` 是 doctor 重写为 `openai/<model>` 的传统配置。
    - `openai/<model>` 加上 provider/model `agentRuntime.id: "pi"` 用于明确的 API 密钥或兼容性路由。

    见 [OpenAI](/providers/openai) 和 [Codex harness](/plugins/codex-harness)。如果 provider/runtime 分离令人困惑，先阅读 [Agent runtimes](/concepts/agent-runtimes)。

    Plugin 自动启用遵循相同边界：`openai/*` agent 引用为默认路由启用 Codex Plugin，明确的 provider/model `agentRuntime.id: "codex"` 或传统 `codex/<model>` 引用也需要它。

    GPT-5.5 默认通过 `openai/gpt-5.5` 上的原生 Codex app-server 运行，仅当 provider/model runtime 策略明确选择 `pi` 时才通过 PI。

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI runtimes 使用相同的分离：选择规范 model 引用，如 `anthropic/claude-*` 或 `google/gemini-*`，然后在需要本地 CLI 后端时将 provider/model runtime 策略设置为 `claude-cli` 或 `google-gemini-cli`。

    传统 `claude-cli/*` 和 `google-gemini-cli/*` 引用迁回规范 provider 引用，runtime 单独记录。传统 `codex-cli/*` 引用迁移到 `openai/*` 并使用 Codex app-server 路由；OpenClaw 不再保留捆绑的 Codex CLI 后端。

  </Accordion>
</AccordionGroup>

## Plugin 拥有的 provider 行为

大多数 provider 特定逻辑存在于 provider Plugin（`registerProvider(...)`）中，而 OpenClaw 保持通用推理循环。Plugin 拥有引导、model 目录、auth 环境变量映射、传输/配置规范化、工具 schema 清理、故障转移分类、OAuth 刷新、使用报告、thinking/reasoning 配置文件等。

provider SDK hook 的完整列表和捆绑 Plugin 示例存在于 [Provider plugins](/plugins/sdk-provider-plugins) 中。需要完全自定义请求执行器的 provider 是一个单独的、更深层的扩展表面。

<Note>
Provider 拥有的运行器行为存在于明确的 provider hook 上，如回放策略、工具 schema 规范化、流封装和传输/请求助手。传统 `ProviderPlugin.capabilities` 静态包仅用于兼容性，不再被共享运行器逻辑读取。
</Note>

## API 密钥轮换

<AccordionGroup>
  <Accordion title="密钥来源和优先级">
    通过以下方式配置多个密钥：

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单一实时覆盖，最高优先级）
    - `<PROVIDER>_API_KEYS`（逗号或分号分隔列表）
    - `<PROVIDER>_API_KEY`（主密钥）
    - `<PROVIDER>_API_KEY_*`（编号列表，例如 `<PROVIDER>_API_KEY_1`）

    对于 Google provider，`GOOGLE_API_KEY` 也作为回退包含在内。密钥选择顺序保留优先级并去重值。

  </Accordion>
  <Accordion title="轮换触发时机">
    - 仅在速率限制响应时用下一个密钥重试请求（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 或周期性使用限制消息）。
    - 非速率限制故障立即失败；不尝试密钥轮换。
    - 当所有候选密钥都失败时，从最后一次尝试返回最终错误。

  </Accordion>
</AccordionGroup>

## 内置 provider（pi-ai 目录）

OpenClaw 附带 pi-ai 目录。这些 provider **无需** `models.providers` 配置；只需设置 auth + 选择一个 model。

### OpenAI

- Provider：`openai`
- Auth：`OPENAI_API_KEY`
- 可选轮换：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，加上 `OPENCLAW_LIVE_OPENAI_KEY`（单一覆盖）
- 示例 model：`openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 如特定安装或 API 密钥行为不同，用 `openclaw models list --provider openai` 验证账户/model 可用性
- CLI：`openclaw onboard --auth-choice openai-api-key`
- 默认传输为 `auto`；OpenClaw 将传输选择传递给 pi-ai
- 通过 `agents.defaults.models["openai/<model>"].params.transport` 按 model 覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- OpenAI 优先处理可通过 `agents.defaults.models["openai/<model>"].params.serviceTier` 启用
- `/fast` 和 `params.fastMode` 将直接 `openai/*` Responses 请求映射到 `api.openai.com` 上的 `service_tier=priority`
- 当想要明确的层级而不是共享的 `/fast` 开关时使用 `params.serviceTier`
- 隐藏的 OpenClaw 归属标头（`originator`、`version`、`User-Agent`）仅适用于到 `api.openai.com` 的原生 OpenAI 流量，不适用于通用 OpenAI 兼容代理
- 原生 OpenAI 路由也保留 Responses `store`、prompt 缓存提示和 OpenAI reasoning-compat 载荷整形；代理路由不保留
- `openai/gpt-5.3-codex-spark` 在 OpenClaw 中被有意抑制，因为实时 OpenAI API 请求拒绝它，且当前 Codex 目录不暴露它

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider：`anthropic`
- Auth：`ANTHROPIC_API_KEY`
- 可选轮换：`ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`，加上 `OPENCLAW_LIVE_ANTHROPIC_KEY`（单一覆盖）
- 示例 model：`anthropic/claude-opus-4-6`
- CLI：`openclaw onboard --auth-choice apiKey`
- 发送到 `api.anthropic.com` 的直接公共 Anthropic 请求支持共享的 `/fast` 开关和 `params.fastMode`，包括 API 密钥和 OAuth 认证流量；OpenClaw 将其映射到 Anthropic `service_tier`（`auto` 对 `standard_only`）
- 首选 Claude CLI 配置保持 model 引用规范，并单独选择 CLI 后端：`anthropic/claude-opus-4-7` 加上 model 范围的 `agentRuntime.id: "claude-cli"`。传统 `claude-cli/claude-opus-4-7` 引用仍可兼容。

<Note>
Anthropic 员工告诉我们 OpenClaw 风格的 Claude CLI 使用再次被允许，因此 OpenClaw 将 Claude CLI 重用和 `claude -p` 使用视为此集成的获批行为，除非 Anthropic 发布新策略。Anthropic setup-token 仍作为支持的 OpenClaw token 路径可用，但 OpenClaw 现在在可用时优先选择 Claude CLI 重用和 `claude -p`。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider：`openai-codex`
- Auth：OAuth（ChatGPT）
- 传统 PI model 引用：`openai-codex/gpt-5.5`
- 原生 Codex app-server harness 引用：`openai/gpt-5.5`
- 原生 Codex app-server harness 文档：[Codex harness](/plugins/codex-harness)
- 传统 model 引用：`codex/gpt-*`
- Plugin 边界：`openai-codex/*` 加载 OpenAI Plugin；原生 Codex app-server Plugin 仅由 Codex harness runtime 或传统 `codex/*` 引用选择
- CLI：`openclaw onboard --auth-choice openai-codex` 或 `openclaw models auth login --provider openai-codex`
- 默认传输为 `auto`（WebSocket 优先，SSE 回退）
- 通过 `agents.defaults.models["openai-codex/<model>"].params.transport` 按 PI model 覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- `params.serviceTier` 也在原生 Codex Responses 请求（`chatgpt.com/backend-api`）上转发
- 隐藏的 OpenClaw 归属标头（`originator`、`version`、`User-Agent`）仅附加在到 `chatgpt.com/backend-api` 的原生 Codex 流量上，不附加在通用 OpenAI 兼容代理上
- 与直接 `openai/*` 共享相同的 `/fast` 开关和 `params.fastMode` 配置；OpenClaw 将其映射到 `service_tier=priority`
- `openai-codex/gpt-5.5` 使用 Codex 目录原生 `contextWindow = 400000` 和默认运行时 `contextTokens = 272000`；通过 `models.providers.openai-codex.models[].contextTokens` 覆盖运行时上限
- 策略说明：OpenAI Codex OAuth 明确支持在 OpenClaw 等外部工具/工作流中使用
- 对于常见的订阅加原生 Codex runtime 路由，使用 `openai-codex` auth 登录但配置 `openai/gpt-5.5`；OpenAI agent 轮次默认选择 Codex
- 仅当想要通过 PI 的兼容性路由时使用 provider/model `agentRuntime.id: "pi"`；否则保持 `openai/gpt-5.5` 在默认 Codex harness 上
- `openai-codex/gpt-*` 引用仍是传统 PI 路由。新的 agent 配置优先使用原生 Codex runtime 上的 `openai/gpt-5.5`，并在想要将旧的 `openai-codex/*` 引用迁移到规范 `openai/*` 引用时运行 `openclaw doctor --fix`

```json5
{
  plugins: { entries: { codex: { enabled: true } } },
  agents: {
    defaults: {
      model: { primary: "openai/gpt-5.5" },
    },
  },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.5", contextTokens: 160000 }],
      },
    },
  },
}
```

### 其他订阅式托管选项

<CardGroup cols={3}>
  <Card title="Z.AI (GLM)" href="/providers/zai">
    Z.AI Coding Plan 或通用 API 端点。
  </Card>
  <Card title="MiniMax" href="/providers/minimax">
    MiniMax Coding Plan OAuth 或 API 密钥访问。
  </Card>
  <Card title="Qwen Cloud" href="/providers/qwen">
    Qwen Cloud provider 界面加上阿里巴巴 DashScope 和 Coding Plan 端点映射。
  </Card>
</CardGroup>

### OpenCode

- Auth：`OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）
- Zen runtime provider：`opencode`
- Go runtime provider：`opencode-go`
- 示例 model：`opencode/claude-opus-4-6`、`opencode-go/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API 密钥）

- Provider：`google`
- Auth：`GEMINI_API_KEY`
- 可选轮换：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 回退，以及 `OPENCLAW_LIVE_GEMINI_KEY`（单一覆盖）
- 示例 model：`google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 兼容性：使用 `google/gemini-3.1-flash-preview` 的传统 OpenClaw 配置被规范化为 `google/gemini-3-flash-preview`
- 别名：`google/gemini-3.1-pro` 被接受并规范化为 Google 实时 Gemini API id `google/gemini-3.1-pro-preview`
- CLI：`openclaw onboard --auth-choice gemini-api-key`
- Thinking：`/think adaptive` 使用 Google 动态 thinking。Gemini 3/3.1 省略固定的 `thinkingLevel`；Gemini 2.5 发送 `thinkingBudget: -1`
- 直接 Gemini 运行也接受 `agents.defaults.models["google/<model>"].params.cachedContent`（或传统 `cached_content`）来转发 provider 原生 `cachedContents/...` 句柄；Gemini 缓存命中呈现为 OpenClaw `cacheRead`

### Google Vertex 和 Gemini CLI

- Provider：`google-vertex`、`google-gemini-cli`
- Auth：Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程

<Warning>
OpenClaw 中的 Gemini CLI OAuth 是非官方集成。部分用户报告在使用第三方客户端后账户受到 Google 限制。如果选择继续，请审查 Google 条款并使用非关键账户。
</Warning>

Gemini CLI OAuth 作为捆绑 `google` Plugin 的一部分发布。

<Steps>
  <Step title="安装 Gemini CLI">
    <Tabs>
      <Tab title="brew">
        ```bash
        brew install gemini-cli
        ```
      </Tab>
      <Tab title="npm">
        ```bash
        npm install -g @google/gemini-cli
        ```
      </Tab>
    </Tabs>
  </Step>
  <Step title="启用 Plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="登录">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    默认 model：`google-gemini-cli/gemini-3-flash-preview`。**无需**将 client id 或 secret 粘贴到 `openclaw.json`。CLI 登录流程将 token 存储在 Gateway 主机上的 auth profiles 中。

  </Step>
  <Step title="设置项目（如需要）">
    如果登录后请求失败，在 Gateway 主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  </Step>
</Steps>

Gemini CLI JSON 回复从 `response` 解析；用量回退到 `stats`，`stats.cached` 规范化为 OpenClaw `cacheRead`。

### Z.AI (GLM)

- Provider：`zai`
- Auth：`ZAI_API_KEY`
- 示例 model：`zai/glm-5.1`
- CLI：`openclaw onboard --auth-choice zai-api-key`
  - 别名：`z.ai/*` 和 `z-ai/*` 规范化为 `zai/*`
  - `zai-api-key` 自动检测匹配的 Z.AI 端点；`zai-coding-global`、`zai-coding-cn`、`zai-global` 和 `zai-cn` 强制特定表面

### Vercel AI Gateway

- Provider：`vercel-ai-gateway`
- Auth：`AI_GATEWAY_API_KEY`
- 示例 model：`vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider：`kilocode`
- Auth：`KILOCODE_API_KEY`
- 示例 model：`kilocode/kilo/auto`
- CLI：`openclaw onboard --auth-choice kilocode-api-key`
- 基础 URL：`https://api.kilo.ai/api/gateway/`
- 静态回退目录附带 `kilocode/kilo/auto`；实时 `https://api.kilo.ai/api/gateway/models` 发现可进一步扩展运行时目录
- `kilocode/kilo/auto` 背后的确切上游路由由 Kilo Gateway 拥有，不在 OpenClaw 中硬编码

见 [/providers/kilocode](/providers/kilocode) 了解设置详情。

### 其他捆绑 provider Plugin

| Provider                | Id                               | Auth 环境变量                                                     | 示例 model                                 |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`               |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                        |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | -                                             |
| DeepInfra               | `deepinfra`                      | `DEEPINFRA_API_KEY`                                          | `deepinfra/deepseek-ai/DeepSeek-V3.2`         |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                  |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | -                                             |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | -                                             |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`         |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                          |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` 或 `KIMICODE_API_KEY`                         | `kimi/kimi-for-coding`                        |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                        |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                          |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/nemotron-3-super-120b-a12b`    |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                             |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                       |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                           |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                      |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`               |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | -                                             |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`             |
| xAI                     | `xai`                            | SuperGrok/X Premium OAuth 或 `XAI_API_KEY`                   | `xai/grok-4.3`                                |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                        |

#### 值得了解的细节

<AccordionGroup>
  <Accordion title="OpenRouter">
    仅在已验证的 `openrouter.ai` 路由上应用其 app 归属标头和 Anthropic `cache_control` 标记。DeepSeek、Moonshot 和 ZAI 引用有 OpenRouter 管理的 prompt 缓存的缓存 TTL 资格，但不接收 Anthropic 缓存标记。作为代理式 OpenAI 兼容路径，它跳过原生 OpenAI 独有整形（`serviceTier`、Responses `store`、prompt 缓存提示、OpenAI reasoning-compat）。Gemini 支持的引用仅保留代理 Gemini thought-signature 净化。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini 支持的引用遵循相同的代理 Gemini 净化路径；`kilocode/kilo/auto` 和其他不支持代理 reasoning 的引用跳过代理 reasoning 注入。
  </Accordion>
  <Accordion title="MiniMax">
    API 密钥引导写入明确的纯文本 M2.7 聊天 model 定义；图像理解保持在 Plugin 拥有的 `MiniMax-VL-01` 媒体 provider 上。
  </Accordion>
  <Accordion title="NVIDIA">
    Model id 使用 `nvidia/<vendor>/<model>` 命名空间（例如 `nvidia/nvidia/nemotron-...` 与 `nvidia/moonshotai/kimi-k2.5`）；选择器保留字面 `<provider>/<model-id>` 组合，而发送到 API 的规范键保持单前缀。
  </Accordion>
  <Accordion title="xAI">
    使用 xAI Responses 路径。推荐的路径是 SuperGrok/X Premium OAuth；API 密钥仍可通过 `XAI_API_KEY` 或 Plugin 配置使用，Grok `web_search` 在 API 密钥回退之前复用相同的认证配置文件。`grok-4.3` 是捆绑的默认聊天 model，`grok-build-0.1` 可供以构建/编码为重点的工作选用。`/fast` 或 `params.fastMode: true` 将 `grok-3`、`grok-3-mini`、`grok-4` 和 `grok-4-0709` 重写为其 `*-fast` 变体。`tool_stream` 默认开启；通过 `agents.defaults.models["xai/<model>"].params.tool_stream=false` 禁用。
  </Accordion>
  <Accordion title="Cerebras">
    作为捆绑的 `cerebras` provider Plugin 发布。GLM 使用 `zai-glm-4.7`；OpenAI 兼容基础 URL 为 `https://api.cerebras.ai/v1`。
  </Accordion>
</AccordionGroup>

## 通过 `models.providers` 使用 provider（自定义/基础 URL）

使用 `models.providers`（或 `models.json`）添加**自定义** provider 或 OpenAI/Anthropic 兼容代理。

下面许多捆绑 provider Plugin 已经发布了默认目录。仅当想覆盖默认基础 URL、标头或 model 列表时才使用明确的 `models.providers.<id>` 条目。

Gateway model 能力检查也读取明确的 `models.providers.<id>.models[]` 元数据。如果自定义或代理 model 接受图像，在该 model 上设置 `input: ["text", "image"]`，以便 WebChat 和 node-origin 附件路径将图像作为原生 model 输入而不是纯文本媒体引用传递。

`agents.defaults.models["provider/model"]` 仅控制 agent 的 model 可见性、别名和按 model 元数据。它本身不注册新的运行时 model。对于自定义 provider model，还需在 `models.providers.<provider>.models[]` 中至少添加匹配的 `id`。

### Moonshot AI (Kimi)

Moonshot 作为捆绑 provider Plugin 发布。默认使用内置 provider，仅在需要覆盖基础 URL 或 model 元数据时添加明确的 `models.providers.moonshot` 条目：

- Provider：`moonshot`
- Auth：`MOONSHOT_API_KEY`
- 示例 model：`moonshot/kimi-k2.6`
- CLI：`openclaw onboard --auth-choice moonshot-api-key` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 model ID：

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.6`
- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.6" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.6", name: "Kimi K2.6" }],
      },
    },
  },
}
```

### Kimi coding

Kimi Coding 使用 Moonshot AI 的 Anthropic 兼容端点：

- Provider：`kimi`
- Auth：`KIMI_API_KEY`
- 示例 model：`kimi/kimi-for-coding`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-for-coding" } },
  },
}
```

传统 `kimi/kimi-code` 和 `kimi/k2p5` 仍作为兼容 model id 被接受并规范化为 Kimi 的稳定 API model id。

### Volcano Engine（火山引擎/Doubao）

火山引擎为中国用户提供 Doubao 和其他 model 的访问。

- Provider：`volcengine`（coding：`volcengine-plan`）
- Auth：`VOLCANO_ENGINE_API_KEY`
- 示例 model：`volcengine-plan/ark-code-latest`
- CLI：`openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

引导默认使用 coding 表面，但通用 `volcengine/*` 目录同时注册。

在引导/configure model 选择器中，Volcengine auth 选择优先显示 `volcengine/*` 和 `volcengine-plan/*` 行。如果这些 model 尚未加载，OpenClaw 回退到未过滤的目录，而不是显示空的 provider 范围选择器。

<Tabs>
  <Tab title="标准 model">
    - `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127`（Kimi K2.5）
    - `volcengine/glm-4-7-251222`（GLM 4.7）
    - `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2 128K）

  </Tab>
  <Tab title="Coding model（volcengine-plan）">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`

  </Tab>
</Tabs>

### BytePlus（国际版）

BytePlus ARK 为国际用户提供与火山引擎相同 model 的访问。

- Provider：`byteplus`（coding：`byteplus-plan`）
- Auth：`BYTEPLUS_API_KEY`
- 示例 model：`byteplus-plan/ark-code-latest`
- CLI：`openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

引导默认使用 coding 表面，但通用 `byteplus/*` 目录同时注册。

在引导/configure model 选择器中，BytePlus auth 选择优先显示 `byteplus/*` 和 `byteplus-plan/*` 行。如果这些 model 尚未加载，OpenClaw 回退到未过滤的目录，而不是显示空的 provider 范围选择器。

<Tabs>
  <Tab title="标准 model">
    - `byteplus/seed-1-8-251228`（Seed 1.8）
    - `byteplus/kimi-k2-5-260127`（Kimi K2.5）
    - `byteplus/glm-4-7-251222`（GLM 4.7）

  </Tab>
  <Tab title="Coding model（byteplus-plan）">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`

  </Tab>
</Tabs>

### Synthetic

Synthetic 在 `synthetic` provider 后提供 Anthropic 兼容 model：

- Provider：`synthetic`
- Auth：`SYNTHETIC_API_KEY`
- 示例 model：`synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI：`openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.5", name: "MiniMax M2.5" }],
      },
    },
  },
}
```

### MiniMax

MiniMax 通过 `models.providers` 配置，因为它使用自定义端点：

- MiniMax OAuth（全球）：`--auth-choice minimax-global-oauth`
- MiniMax OAuth（中国）：`--auth-choice minimax-cn-oauth`
- MiniMax API 密钥（全球）：`--auth-choice minimax-global-api`
- MiniMax API 密钥（中国）：`--auth-choice minimax-cn-api`
- Auth：`minimax` 用 `MINIMAX_API_KEY`；`minimax-portal` 用 `MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY`

见 [/providers/minimax](/providers/minimax) 了解设置详情、model 选项和配置片段。

<Note>
在 MiniMax 的 Anthropic 兼容 streaming 路径上，OpenClaw 默认禁用 thinking，除非明确设置，且 `/fast on` 将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
</Note>

Plugin 拥有的能力分离：

- 文本/聊天默认保持在 `minimax/MiniMax-M2.7`
- 图像生成为 `minimax/image-01` 或 `minimax-portal/image-01`
- 图像理解为两种 MiniMax auth 路径上 Plugin 拥有的 `MiniMax-VL-01`
- 网络搜索保持在 provider id `minimax`

### LM Studio

LM Studio 作为使用原生 API 的捆绑 provider Plugin 发布：

- Provider：`lmstudio`
- Auth：`LM_API_TOKEN`
- 默认推理基础 URL：`http://localhost:1234/v1`

然后设置 model（替换为 `http://localhost:1234/api/v1/models` 返回的 ID 之一）：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw 使用 LM Studio 的原生 `/api/v1/models` 和 `/api/v1/models/load` 进行发现 + 自动加载，默认使用 `/v1/chat/completions` 进行推理。如果想让 LM Studio JIT 加载、TTL 和自动驱逐管理 model 生命周期，设置 `models.providers.lmstudio.params.preload: false`。见 [/providers/lmstudio](/providers/lmstudio) 了解设置和故障排除。

### Ollama

Ollama 作为捆绑 provider Plugin 发布，使用 Ollama 原生 API：

- Provider：`ollama`
- Auth：无需（本地服务器）
- 示例 model：`ollama/llama3.3`
- 安装：[https://ollama.com/download](https://ollama.com/download)

```bash
# 安装 Ollama，然后拉取 model：
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

使用 `OLLAMA_API_KEY` 选择加入时，Ollama 在 `http://127.0.0.1:11434` 本地检测，捆绑 provider Plugin 将 Ollama 直接添加到 `openclaw onboard` 和 model 选择器。见 [/providers/ollama](/providers/ollama) 了解引导、云/本地模式和自定义配置。

### vLLM

vLLM 作为本地/自托管 OpenAI 兼容服务器的捆绑 provider Plugin 发布：

- Provider：`vllm`
- Auth：可选（取决于你的服务器）
- 默认基础 URL：`http://127.0.0.1:8000/v1`

选择加入本地自动发现（如果服务器不强制 auth，任何值都可以）：

```bash
export VLLM_API_KEY="vllm-local"
```

然后设置 model（替换为 `/v1/models` 返回的 ID 之一）：

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

见 [/providers/vllm](/providers/vllm) 了解详情。

### SGLang

SGLang 作为快速自托管 OpenAI 兼容服务器的捆绑 provider Plugin 发布：

- Provider：`sglang`
- Auth：可选（取决于你的服务器）
- 默认基础 URL：`http://127.0.0.1:30000/v1`

选择加入本地自动发现（如果服务器不强制 auth，任何值都可以）：

```bash
export SGLANG_API_KEY="sglang-local"
```

然后设置 model（替换为 `/v1/models` 返回的 ID 之一）：

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

见 [/providers/sglang](/providers/sglang) 了解详情。

### 本地代理（LM Studio、vLLM、LiteLLM 等）

示例（OpenAI 兼容）：

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: { "lmstudio/my-local-model": { alias: "Local" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="默认可选字段">
    对于自定义 provider，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 是可选的。省略时，OpenClaw 默认为：

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    建议：设置与代理/model 限制匹配的明确值。

  </Accordion>
  <Accordion title="代理路由整形规则">
    - 对于非原生端点上的 `api: "openai-completions"`（任何主机不是 `api.openai.com` 的非空 `baseUrl`），OpenClaw 强制 `compat.supportsDeveloperRole: false` 以避免不支持 `developer` 角色的 provider 400 错误。
    - 代理式 OpenAI 兼容路由也跳过原生 OpenAI 独有请求整形：无 `service_tier`、无 Responses `store`、无 Completions `store`、无 prompt 缓存提示、无 OpenAI reasoning-compat 载荷整形，以及无隐藏 OpenClaw 归属标头。
    - 对于需要供应商特定字段的 OpenAI 兼容 Completions 代理，设置 `agents.defaults.models["provider/model"].params.extra_body`（或 `extraBody`）将额外 JSON 合并到出站请求主体。
    - 对于 vLLM 聊天模板控制，设置 `agents.defaults.models["provider/model"].params.chat_template_kwargs`。捆绑的 vLLM Plugin 在 session thinking 级别关闭时自动为 `vllm/nemotron-3-*` 发送 `enable_thinking: false` 和 `force_nonempty_content: true`。
    - 对于慢速本地 model 或远程 LAN/tailnet 主机，设置 `models.providers.<id>.timeoutSeconds`。这扩展了 provider model HTTP 请求处理，包括连接、标头、主体 streaming 和总的受保护 fetch 中止，而不增加整个 agent 运行时超时。
    - Model provider HTTP 调用仅对已配置的 provider `baseUrl` 主机名允许 Surge、Clash 和 sing-box fake-IP DNS 答案在 `198.18.0.0/15` 和 `fc00::/7` 中。自定义/本地 provider 端点也信任已配置的精确 `scheme://host:port` 源用于受保护的 model 请求，包括环回、LAN 和 tailnet 主机。这不是新的配置选项；你配置的 `baseUrl` 仅为该源扩展请求策略。Fake-IP 主机名允许和精确源信任是独立机制。其他私有、环回、链路本地、元数据目标以及不同端口仍需要明确的 `models.providers.<id>.request.allowPrivateNetwork: true` 选择加入。设置 `models.providers.<id>.request.allowPrivateNetwork: false` 可选择退出精确源信任。
    - 如果 `baseUrl` 为空/省略，OpenClaw 保留默认 OpenAI 行为（解析到 `api.openai.com`）。
    - 为安全起见，明确的 `compat.supportsDeveloperRole: true` 在非原生 `openai-completions` 端点上仍然被覆盖。
    - 对于非直接端点上的 `api: "anthropic-messages"`（任何不是规范 `anthropic` 的 provider，或主机不是公共 `api.anthropic.com` 端点的自定义 `models.providers.anthropic.baseUrl`），OpenClaw 抑制隐式 Anthropic beta 标头，如 `claude-code-20250219`、`interleaved-thinking-2025-05-14` 和 OAuth 标记，以便自定义 Anthropic 兼容代理不拒绝不支持的 beta 标志。如果代理需要特定 beta 功能，明确设置 `models.providers.<id>.headers["anthropic-beta"]`。

  </Accordion>
</AccordionGroup>

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另见：[Configuration](/gateway/configuration) 了解完整配置示例。

## 相关

- [配置参考](/gateway/config-agents#agent-defaults) - model 配置键
- [Model failover](/concepts/model-failover) - 故障转移链和重试行为
- [Models](/concepts/models) - model 配置和别名
- [Providers](/providers) - 按 provider 设置指南
