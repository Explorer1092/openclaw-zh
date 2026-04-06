---
mmh3_hash: "32419c69d5e6123046391680918873f0"
summary: "Model provider 概述,包含示例配置 + CLI 流程"
read_when:
  - 你需要按 provider 的 model 设置参考
  - 你想要 model providers 的示例配置或 CLI onboarding 命令
title: "Model Providers"
---

# Model providers

本页面涵盖 **LLM/model providers**(不是像 WhatsApp/Telegram 这样的聊天 channels)。有关 model 选择规则,请参见 [/concepts/models](/concepts/models)。

## 快速规则

- Model refs 使用 `provider/model`(例如:`opencode/claude-opus-4-6`)。
- 如果你设置 `agents.defaults.models`,它将成为允许列表。
- CLI helpers: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
- Provider plugins 可以通过 `registerProvider({ catalog })` 注入 model catalogs;OpenClaw 在写入 `models.json` 之前将该输出合并到 `models.providers` 中。
- Provider manifests 可以声明 `providerAuthEnvVars`,以便通用基于 env 的 auth probes 不需要加载 plugin runtime。其余的核心 env-var 映射现在仅用于非 plugin/core providers 以及一些通用优先级情况,例如 Anthropic API-key-first onboarding。
- Provider plugins 也可以通过 `normalizeModelId`、`normalizeTransport`、`normalizeConfig`、`applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、`resolveSyntheticAuth`、`shouldDeferSyntheticProfileAuth`、`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`contributeResolvedModelCompat`、`capabilities`、`normalizeToolSchemas`、`inspectToolSchemas`、`resolveReasoningOutputMode`、`prepareExtraParams`、`createStreamFn`、`wrapStreamFn`、`resolveTransportTurnState`、`resolveWebSocketSessionPolicy`、`createEmbeddingProvider`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`matchesContextOverflowError`、`classifyFailoverReason`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot` 和 `onModelSelected` 来拥有 provider runtime 行为。
- 注意：provider runtime `capabilities` 是共享的 runner 元数据（provider 系列、transcript/工具特性、传输/缓存提示）。这与描述插件注册内容（文本推理、语音等）的[公共能力模型](/plugins/architecture#public-capability-model)不同。

## Plugin 拥有的 provider 行为

Provider plugins 现在可以拥有大多数 provider 特定逻辑,而 OpenClaw 保留通用推理循环。

典型分工:

- `auth[].run` / `auth[].runNonInteractive`:provider 拥有 `openclaw onboard`、`openclaw models auth` 和无头设置的 onboarding/login 流程
- `wizard.setup` / `wizard.modelPicker`:provider 拥有 auth-choice 标签、传统别名、onboarding 允许列表提示以及 onboarding/model picker 中的设置条目
- `catalog`:provider 出现在 `models.providers` 中
- `resolveDynamicModel`:provider 接受本地静态 catalog 中尚不存在的 model ids
- `prepareDynamicModel`:provider 在重试动态解析之前需要元数据刷新
- `normalizeResolvedModel`:provider 需要传输或 base URL 重写
- `capabilities`:provider 发布 transcript/tooling/provider-family 特性
- `prepareExtraParams`:provider 默认或规范化每个 model 的请求参数
- `wrapStreamFn`:provider 应用请求 headers/body/model compat wrappers
- `formatApiKey`:provider 将存储的 auth profiles 格式化为传输期望的运行时 `apiKey` 字符串
- `refreshOAuth`:当共享的 `pi-ai` refreshers 不够时,provider 拥有 OAuth 刷新
- `buildAuthDoctorHint`:当 OAuth 刷新失败时,provider 附加修复指导
- `isCacheTtlEligible`:provider 决定哪些上游 model ids 支持 prompt-cache TTL
- `buildMissingAuthMessage`:provider 用 provider 特定的恢复提示替换通用 auth-store 错误
- `suppressBuiltInModel`:provider 隐藏过时的上游行并可以为直接解析失败返回 vendor 拥有的错误
- `augmentModelCatalog`:provider 在发现和配置合并后附加合成/最终 catalog 行
- `isBinaryThinking`:provider 拥有二进制开/关 thinking UX
- `supportsXHighThinking`:provider 将选定的 models 选择加入 `xhigh`
- `resolveDefaultThinkingLevel`:provider 拥有 model 系列的默认 `/think` 策略
- `isModernModelRef`:provider 拥有 live/smoke 首选 model 匹配
- `prepareRuntimeAuth`:provider 将已配置的凭据转换为短暂的运行时令牌
- `resolveUsageAuth`:provider 解析 `/usage` 和相关 status/reporting 表面的 usage/quota 凭据
- `fetchUsageSnapshot`:provider 拥有 usage 端点 fetch/解析,而 core 仍拥有摘要 shell 和格式化

当前捆绑示例:

- `anthropic`:Claude 4.6 forward-compat fallback、auth 修复提示、usage 端点获取以及 cache-TTL/provider-family 元数据
- `openrouter`:透传 model ids、请求 wrappers、provider capability 提示以及 cache-TTL 策略
- `github-copilot`:onboarding/device login、forward-compat model fallback、Claude-thinking transcript 提示、runtime token 交换以及 usage 端点获取
- `openai`:GPT-5.4 forward-compat fallback、直接 OpenAI 传输规范化、Codex-aware missing-auth 提示、Spark 抑制、合成 OpenAI/Codex catalog 行、thinking/live-model 策略以及 provider-family 元数据
- `google` 和 `google-gemini-cli`:Gemini 3.1 forward-compat fallback 和现代 model 匹配;Gemini CLI OAuth 还拥有 auth-profile token 格式化、usage-token 解析以及 usage surfaces 的 quota 端点获取
- `moonshot`:共享传输、plugin 拥有的 thinking payload 规范化
- `kilocode`:共享传输、plugin 拥有的请求 headers、reasoning payload 规范化、Gemini transcript 提示以及 cache-TTL 策略
- `zai`:GLM-5 forward-compat fallback、`tool_stream` 默认值、cache-TTL 策略、binary-thinking/live-model 策略以及 usage auth + quota 获取
- `mistral`、`opencode` 和 `opencode-go`:plugin 拥有的 capability 元数据
- `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`modelstudio`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine`:仅 plugin 拥有的 catalogs
- `qwen-portal`:plugin 拥有的 catalog、OAuth login 和 OAuth refresh
- `minimax` 和 `xiaomi`:plugin 拥有的 catalogs 加 usage auth/snapshot 逻辑

捆绑的 `openai` plugin 现在拥有两个 provider ids:`openai` 和 `openai-codex`。

这涵盖了仍然适合 OpenClaw 正常传输的 providers。需要完全自定义请求执行器的 provider 是一个单独的、更深层的扩展表面。

## API key 轮换

- 支持对选定 providers 的通用 provider 轮换。
- 通过以下方式配置多个 keys:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`(单个实时覆盖,最高优先级)
  - `<PROVIDER>_API_KEYS`(逗号或分号列表)
  - `<PROVIDER>_API_KEY`(主 key)
  - `<PROVIDER>_API_KEY_*`(编号列表,例如 `<PROVIDER>_API_KEY_1`)
- 对于 Google providers,`GOOGLE_API_KEY` 也作为备用包含在内。
- Key 选择顺序保持优先级并删除重复值。
- 仅在速率限制响应(例如 `429`、`rate_limit`、`quota`、`resource exhausted`)上用下一个 key 重试请求。
- 非速率限制失败立即失败;不尝试 key 轮换。
- 当所有候选 keys 失败时,从最后一次尝试返回最终错误。

## 内置 providers(pi-ai catalog)

OpenClaw 附带 pi-ai catalog。这些 providers **不需要** `models.providers` 配置;只需设置 auth + 选择 model。

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- 可选轮换:`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`,加上 `OPENCLAW_LIVE_OPENAI_KEY`(单个覆盖)
- 示例 models: `openai/gpt-5.4`、`openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- 默认传输为 `auto`(WebSocket 优先,SSE 回退)
- 通过 `agents.defaults.models["openai/<model>"].params.transport` 按 model 覆盖(`"sse"`、`"websocket"` 或 `"auto"`)
- OpenAI Responses WebSocket 预热通过 `params.openaiWsWarmup`(`true`/`false`)默认启用
- OpenAI 优先处理可通过 `agents.defaults.models["openai/<model>"].params.serviceTier` 启用
- OpenAI 快速模式可通过 `agents.defaults.models["<provider>/<model>"].params.fastMode` 按 model 启用
- `openai/gpt-5.3-codex-spark` 在 OpenClaw 中被有意抑制,因为实时 OpenAI API 拒绝它;Spark 被视为仅 Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY` 或 `claude setup-token`
- 可选轮换:`ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`,加上 `OPENCLAW_LIVE_ANTHROPIC_KEY`(单个覆盖)
- 示例 model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice token`(粘贴 setup-token)或 `openclaw models auth paste-token --provider anthropic`
- 直接 API-key models 支持共享的 `/fast` 切换和 `params.fastMode`;OpenClaw 将其映射到 Anthropic `service_tier`(`auto` 与 `standard_only`)
- 策略说明:setup-token 支持是技术兼容性;Anthropic 过去曾阻止一些在 Claude Code 外使用订阅的情况。验证当前 Anthropic 条款并根据你的风险承受能力决定。
- 建议:Anthropic API key auth 是比订阅 setup-token auth 更安全、推荐的路径。

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Code (Codex)

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- 示例 model: `openai-codex/gpt-5.4`
- CLI: `openclaw onboard --auth-choice openai-codex` 或 `openclaw models auth login --provider openai-codex`
- 默认传输为 `auto`(WebSocket 优先,SSE 回退)
- 通过 `agents.defaults.models["openai-codex/<model>"].params.transport` 按 model 覆盖(`"sse"`、`"websocket"` 或 `"auto"`)
- 与直接 `openai/*` 共享相同的 `/fast` 切换和 `params.fastMode` 配置
- 当 Codex OAuth catalog 公开它时,`openai-codex/gpt-5.3-codex-spark` 仍然可用;依赖于权限
- 策略说明:OpenAI Codex OAuth 明确支持像 OpenClaw 这样的外部工具/工作流。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

### OpenCode

- Auth: `OPENCODE_API_KEY`(或 `OPENCODE_ZEN_API_KEY`)
- Zen runtime provider: `opencode`
- Go runtime provider: `opencode-go`
- 示例 models: `opencode/claude-opus-4-6`、`opencode-go/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- 可选轮换:`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 备用,以及 `OPENCLAW_LIVE_GEMINI_KEY`(单个覆盖)
- 示例 models: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 兼容性:使用 `google/gemini-3.1-flash-preview` 的传统 OpenClaw 配置被规范化为 `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`

### Google Vertex 和 Gemini CLI

- Providers: `google-vertex`、`google-gemini-cli`
- Auth: Vertex 使用 gcloud ADC;Gemini CLI 使用其 OAuth 流程
- 注意:OpenClaw 中的 Gemini CLI OAuth 是非官方集成。一些用户报告说在使用第三方客户端后 Google 账户受到限制。查看 Google 条款,如果你选择继续,请使用非关键账户。
- Gemini CLI OAuth 作为捆绑的 `google` plugin 的一部分提供。
  - 启用: `openclaw plugins enable google`
  - 登录: `openclaw models auth login --provider google-gemini-cli --set-default`
  - 注意:你**不**将 client id 或 secret 粘贴到 `openclaw.json` 中。CLI 登录流程将令牌存储在 gateway 主机上的 auth profiles 中。

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- 示例 model: `zai/glm-5`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 别名:`z.ai/*` 和 `z-ai/*` 规范化为 `zai/*`

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- 示例 model: `vercel-ai-gateway/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- 示例 model: `kilocode/anthropic/claude-opus-4.6`
- CLI: `openclaw onboard --kilocode-api-key <key>`
- Base URL: `https://api.kilo.ai/api/gateway/`
- 扩展的内置 catalog 包括 GLM-5 Free、MiniMax M2.5 Free、GPT-5.2、Gemini 3 Pro Preview、Gemini 3 Flash Preview、Grok Code Fast 1 和 Kimi K2.5。

参见 [/providers/kilocode](/providers/kilocode) 了解设置详情。

### 其他捆绑 provider plugins

- OpenRouter: `openrouter`(`OPENROUTER_API_KEY`)
- 示例 model: `openrouter/anthropic/claude-sonnet-4-6`
- Kilo Gateway: `kilocode`(`KILOCODE_API_KEY`)
- 示例 model: `kilocode/anthropic/claude-opus-4.6`
- MiniMax: `minimax`(`MINIMAX_API_KEY`)
- Moonshot: `moonshot`(`MOONSHOT_API_KEY`)
- Kimi Coding: `kimi-coding`(`KIMI_API_KEY` 或 `KIMICODE_API_KEY`)
- Qianfan: `qianfan`(`QIANFAN_API_KEY`)
- Model Studio: `modelstudio`(`MODELSTUDIO_API_KEY`)
- NVIDIA: `nvidia`(`NVIDIA_API_KEY`)
- Together: `together`(`TOGETHER_API_KEY`)
- Venice: `venice`(`VENICE_API_KEY`)
- Xiaomi: `xiaomi`(`XIAOMI_API_KEY`)
- Vercel AI Gateway: `vercel-ai-gateway`(`AI_GATEWAY_API_KEY`)
- Hugging Face Inference: `huggingface`(`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`)
- Cloudflare AI Gateway: `cloudflare-ai-gateway`(`CLOUDFLARE_AI_GATEWAY_API_KEY`)
- Volcengine: `volcengine`(`VOLCANO_ENGINE_API_KEY`)
- BytePlus: `byteplus`(`BYTEPLUS_API_KEY`)
- xAI: `xai`(`XAI_API_KEY`)
- Mistral: `mistral`(`MISTRAL_API_KEY`)
- 示例 model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq`(`GROQ_API_KEY`)
- Cerebras: `cerebras`(`CEREBRAS_API_KEY`)
  - Cerebras 上的 GLM models 使用 ids `zai-glm-4.7` 和 `zai-glm-4.6`。
  - OpenAI 兼容 base URL: `https://api.cerebras.ai/v1`。
- GitHub Copilot: `github-copilot`(`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Hugging Face Inference 示例 model: `huggingface/deepseek-ai/DeepSeek-R1`;CLI: `openclaw onboard --auth-choice huggingface-api-key`。参见 [Hugging Face (Inference)](/providers/huggingface)。

## 通过 `models.providers` 配置的 providers(自定义/base URL)

使用 `models.providers`(或 `models.json`)添加**自定义** providers 或 OpenAI/Anthropic 兼容代理。

下面许多捆绑的 provider plugins 已经发布了默认 catalog。仅当你想覆盖默认 base URL、headers 或 model 列表时,才使用显式的 `models.providers.<id>` 条目。

### Moonshot AI (Kimi)

Moonshot 使用 OpenAI 兼容端点,因此将其配置为自定义 provider:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- 示例 model: `moonshot/kimi-k2.5`

Kimi K2 model IDs:

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-0905-preview`
- `moonshot/kimi-k2-turbo-preview`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`

[//]: # "moonshot-kimi-k2-model-refs:end"

```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }],
      },
    },
  },
}
```

### Kimi Coding

Kimi Coding 使用 Moonshot AI 的 Anthropic 兼容端点:

- Provider: `kimi-coding`
- Auth: `KIMI_API_KEY`
- 示例 model: `kimi-coding/k2p5`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi-coding/k2p5" } },
  },
}
```

### Qwen OAuth(免费层)

Qwen 通过设备代码流程提供对 Qwen Coder + Vision 的 OAuth 访问。捆绑的 provider plugin 默认启用,只需登录:

```bash
openclaw models auth login --provider qwen-portal --set-default
```

Model refs:

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

参见 [/providers/qwen](/providers/qwen) 了解设置详情和说明。

### Volcano Engine(火山引擎)

Volcano Engine(火山引擎)在中国提供对 Doubao 和其他 models 的访问。

- Provider: `volcengine`(编码:`volcengine-plan`)
- Auth: `VOLCANO_ENGINE_API_KEY`
- 示例 model: `volcengine/doubao-seed-1-8-251228`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine/doubao-seed-1-8-251228" } },
  },
}
```

可用 models:

- `volcengine/doubao-seed-1-8-251228` (Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127` (Kimi K2.5)
- `volcengine/glm-4-7-251222` (GLM 4.7)
- `volcengine/deepseek-v3-2-251201` (DeepSeek V3.2 128K)

编码 models (`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus(国际版)

BytePlus ARK 为国际用户提供对与 Volcano Engine 相同 models 的访问。

- Provider: `byteplus`(编码:`byteplus-plan`)
- Auth: `BYTEPLUS_API_KEY`
- 示例 model: `byteplus/seed-1-8-251228`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus/seed-1-8-251228" } },
  },
}
```

可用 models:

- `byteplus/seed-1-8-251228` (Seed 1.8)
- `byteplus/kimi-k2-5-260127` (Kimi K2.5)
- `byteplus/glm-4-7-251222` (GLM 4.7)

编码 models (`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic 在 `synthetic` provider 下提供 Anthropic 兼容的 models:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- 示例 model: `synthetic/hf:MiniMaxAI/MiniMax-M2.5`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

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

MiniMax 通过 `models.providers` 配置,因为它使用自定义端点:

- MiniMax(Anthropic 兼容):`--auth-choice minimax-api`
- Auth: `MINIMAX_API_KEY`

参见 [/providers/minimax](/providers/minimax) 了解设置详情、model 选项和配置片段。

### Ollama

Ollama 作为捆绑的 provider plugin 提供,并使用 Ollama 的原生 API:

- Provider: `ollama`
- Auth: 无需(本地服务器)
- 示例 model: `ollama/llama3.3`
- 安装: [https://ollama.com/download](https://ollama.com/download)

```bash
# 安装 Ollama,然后拉取 model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

当你使用 `OLLAMA_API_KEY` 选择加入时,Ollama 在 `http://127.0.0.1:11434` 本地检测,捆绑的 provider plugin 直接将 Ollama 添加到 `openclaw onboard` 和 model picker 中。参见 [/providers/ollama](/providers/ollama) 了解 onboarding、cloud/local 模式和自定义配置。

### vLLM

vLLM 作为捆绑的 provider plugin 为本地/自托管 OpenAI 兼容服务器提供:

- Provider: `vllm`
- Auth: 可选(取决于你的服务器)
- 默认 base URL: `http://127.0.0.1:8000/v1`

要在本地选择加入自动发现(如果你的服务器不强制执行 auth,任何值都有效):

```bash
export VLLM_API_KEY="vllm-local"
```

然后设置 model(替换为 `/v1/models` 返回的 ID 之一):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

参见 [/providers/vllm](/providers/vllm) 了解详情。

### SGLang

SGLang 作为捆绑的 provider plugin 为快速自托管 OpenAI 兼容服务器提供:

- Provider: `sglang`
- Auth: 可选(取决于你的服务器)
- 默认 base URL: `http://127.0.0.1:30000/v1`

要在本地选择加入自动发现(如果你的服务器不强制执行 auth,任何值都有效):

```bash
export SGLANG_API_KEY="sglang-local"
```

然后设置 model(替换为 `/v1/models` 返回的 ID 之一):

```json5
{
  agents: {
    defaults: { model: { primary: "sglang/your-model-id" } },
  },
}
```

参见 [/providers/sglang](/providers/sglang) 了解详情。

### 本地代理(LM Studio、vLLM、LiteLLM 等)

示例(OpenAI 兼容):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: { "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" } },
    },
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5",
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

注意:

- 对于自定义 providers,`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 是可选的。省略时,OpenClaw 默认为:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 建议:设置与你的 proxy/model 限制匹配的显式值。
- 对于非原生端点上的 `api: "openai-completions"`(任何主机不是 `api.openai.com` 的非空 `baseUrl`),OpenClaw 强制 `compat.supportsDeveloperRole: false` 以避免不支持的 `developer` 角色导致的 provider 400 错误。
- 如果 `baseUrl` 为空/省略,OpenClaw 保持默认 OpenAI 行为(解析为 `api.openai.com`)。
- 为了安全起见,在非原生 `openai-completions` 端点上,显式的 `compat.supportsDeveloperRole: true` 仍然会被覆盖。

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另请参见:[/gateway/configuration](/gateway/configuration) 了解完整的配置示例。
