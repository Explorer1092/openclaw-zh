---
mmh3_hash: "40141b27936c67991005005b3e3b336f"
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

## API key 轮换

- 支持针对选定 providers 的通用 provider 轮换。
- 通过以下方式配置多个 keys:
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`(单个实时覆盖,最高优先级)
  - `<PROVIDER>_API_KEYS`(逗号或分号列表)
  - `<PROVIDER>_API_KEY`(主 key)
  - `<PROVIDER>_API_KEY_*`(编号列表,例如 `<PROVIDER>_API_KEY_1`)
- 对于 Google providers,`GOOGLE_API_KEY` 也作为后备包含在内。
- Key 选择顺序保留优先级并去重值。
- 仅在速率限制响应(例如 `429`、`rate_limit`、`quota`、`resource exhausted`)时使用下一个 key 重试请求。
- 非速率限制失败立即失败;不尝试 key 轮换。
- 当所有候选 keys 都失败时,从最后一次尝试返回最终错误。

## 内置 providers (pi-ai catalog)

OpenClaw 附带 pi‑ai catalog。这些 providers **不需要** `models.providers` 配置;只需设置 auth + 选择 model。

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- 可选轮换: `OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`,以及 `OPENCLAW_LIVE_OPENAI_KEY`(单个覆盖)
- 示例 model: `openai/gpt-5.4`、`openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- 默认 transport 为 `auto`(WebSocket 优先,SSE 后备)
- 通过 `agents.defaults.models["openai/<model>"].params.transport` 按 model 覆盖(`"sse"`、`"websocket"` 或 `"auto"`)
- OpenAI Responses WebSocket 预热默认通过 `params.openaiWsWarmup`(`true`/`false`)启用
- 可通过 `agents.defaults.models["openai/<model>"].params.serviceTier` 启用 OpenAI 优先处理

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY` 或 `claude setup-token`
- 可选轮换: `ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`,以及 `OPENCLAW_LIVE_ANTHROPIC_KEY`(单个覆盖)
- 示例 model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice token` (粘贴 setup-token) 或 `openclaw models auth paste-token --provider anthropic`
- 政策说明:setup-token 支持是技术兼容性,而非政策保证。Anthropic 过去曾限制 Claude Code 之外的某些订阅使用。请自行验证 Anthropic 当前条款,并根据你的风险承受能力做出决定。
- 建议:对于生产环境,Anthropic API key 认证是比订阅 setup-token 认证更安全的推荐路径。

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
- 默认 transport 为 `auto`(WebSocket 优先,SSE 后备)
- 通过 `agents.defaults.models["openai-codex/<model>"].params.transport` 按 model 覆盖(`"sse"`、`"websocket"` 或 `"auto"`)
- 政策说明:OpenAI Codex OAuth 明确支持在外部工具/工作流(如 OpenClaw)中使用。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

### OpenCode Zen

- Provider: `opencode`
- Auth: `OPENCODE_API_KEY` (或 `OPENCODE_ZEN_API_KEY`)
- 示例 model: `opencode/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice opencode-zen`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini (API key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- 可选轮换: `GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 后备,以及 `OPENCLAW_LIVE_GEMINI_KEY`(单个覆盖)
- 示例 model: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`、`google/gemini-3.1-flash-lite-preview`
- 兼容性:使用 `google/gemini-3.1-flash-preview` 的旧版 OpenClaw 配置会规范化为 `google/gemini-3-flash-preview`,裸 `google/gemini-3.1-flash-lite` 会规范化为 `google/gemini-3.1-flash-lite-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`

### Google Vertex, Antigravity, and Gemini CLI

- Providers: `google-vertex`、`google-antigravity`、`google-gemini-cli`
- Auth: Vertex 使用 gcloud ADC;Antigravity/Gemini CLI 使用它们各自的 auth 流程
- 注意: Antigravity 和 Gemini CLI OAuth 在 OpenClaw 中属于非官方集成。有用户报告在使用第三方客户端后 Google 账户受到限制。请查看 Google 条款,若选择继续请使用非关键账户。
- Antigravity OAuth 作为捆绑 plugin 提供(`google-antigravity-auth`,默认禁用)。
  - 启用: `openclaw plugins enable google-antigravity-auth`
  - 登录: `openclaw models auth login --provider google-antigravity --set-default`
- Gemini CLI OAuth 作为捆绑 plugin 提供(`google-gemini-cli-auth`,默认禁用)。
  - 启用: `openclaw plugins enable google-gemini-cli-auth`
  - 登录: `openclaw models auth login --provider google-gemini-cli --set-default`
  - 注意:你 **不** 将 client id 或 secret 粘贴到 `openclaw.json` 中。CLI 登录流程将 tokens 存储在 gateway 主机上的 auth profiles 中。

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
- 扩展内置 catalog 包含 GLM-5 Free、MiniMax M2.5 Free、GPT-5.2、Gemini 3 Pro Preview、Gemini 3 Flash Preview、Grok Code Fast 1 和 Kimi K2.5。

参见 [/providers/kilocode](/providers/kilocode) 了解设置详细信息。

### 其他内置 providers

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- 示例 model: `openrouter/anthropic/claude-sonnet-4-5`
- Kilo Gateway: `kilocode` (`KILOCODE_API_KEY`)
- 示例 model: `kilocode/anthropic/claude-opus-4.6`
- xAI: `xai` (`XAI_API_KEY`)
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- 示例 model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Cerebras 上的 GLM models 使用 ids `zai-glm-4.7` 和 `zai-glm-4.6`。
  - OpenAI 兼容 base URL: `https://api.cerebras.ai/v1`。
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)
- Hugging Face Inference: `huggingface` (`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`) — OpenAI 兼容 router;示例 model: `huggingface/deepseek-ai/DeepSeek-R1`;CLI: `openclaw onboard --auth-choice huggingface-api-key`。参见 [Hugging Face (Inference)](/providers/huggingface)。

## 通过 `models.providers` 的 Providers (自定义/base URL)

使用 `models.providers`(或 `models.json`)添加 **自定义** providers 或 OpenAI/Anthropic‑兼容 proxies。

### Moonshot AI (Kimi)

Moonshot 使用 OpenAI 兼容端点,因此将其配置为自定义 provider:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- 示例 model: `moonshot/kimi-k2.5`

Kimi K2 model IDs:

{/_moonshot-kimi-k2-model-refs:start_/ && null}

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-0905-preview`
- `moonshot/kimi-k2-turbo-preview`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
  {/_moonshot-kimi-k2-model-refs:end_/ && null}

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

### Qwen OAuth (免费层)

Qwen 通过设备代码流程提供对 Qwen Coder + Vision 的 OAuth 访问。启用捆绑 plugin,然后登录:

```bash
openclaw plugins enable qwen-portal-auth
openclaw models auth login --provider qwen-portal --set-default
```

Model refs:

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

参见 [/providers/qwen](/providers/qwen) 了解设置详细信息和注释。

### Volcano Engine (Doubao)

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

- `volcengine/doubao-seed-1-8-251228`(Doubao Seed 1.8)
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127`(Kimi K2.5)
- `volcengine/glm-4-7-251222`(GLM 4.7)
- `volcengine/deepseek-v3-2-251201`(DeepSeek V3.2 128K)

编码 models(`volcengine-plan`):

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

### BytePlus(国际版)

BytePlus ARK 为国际用户提供与 Volcano Engine 相同的 models 访问。

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

- `byteplus/seed-1-8-251228`(Seed 1.8)
- `byteplus/kimi-k2-5-260127`(Kimi K2.5)
- `byteplus/glm-4-7-251222`(GLM 4.7)

编码 models(`byteplus-plan`):

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

### Synthetic

Synthetic 在 `synthetic` provider 后面提供 Anthropic 兼容的 models:

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

- MiniMax (Anthropic‑兼容): `--auth-choice minimax-api`
- Auth: `MINIMAX_API_KEY`

参见 [/providers/minimax](/providers/minimax) 了解设置详细信息、model 选项和配置片段。

### Ollama

Ollama 是一个本地 LLM runtime,提供 OpenAI 兼容的 API:

- Provider: `ollama`
- Auth: 不需要(本地 server)
- 示例 model: `ollama/llama3.3`
- 安装: [https://ollama.ai](https://ollama.ai)

```bash
# 安装 Ollama,然后 pull model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } },
  },
}
```

Ollama 在本地 `http://127.0.0.1:11434/v1` 运行时自动检测。参见 [/providers/ollama](/providers/ollama) 了解 model 推荐和自定义配置。

### vLLM

vLLM 是本地(或自托管的)OpenAI 兼容 server:

- Provider: `vllm`
- Auth: 可选(取决于你的 server)
- 默认 base URL: `http://127.0.0.1:8000/v1`

要选择在本地自动发现(如果你的 server 不强制执行 auth,任何值都可以):

```bash
export VLLM_API_KEY="vllm-local"
```

然后设置一个 model(替换为 `/v1/models` 返回的 IDs 之一):

```json5
{
  agents: {
    defaults: { model: { primary: "vllm/your-model-id" } },
  },
}
```

参见 [/providers/vllm](/providers/vllm) 了解详细信息。

### 本地 proxies (LM Studio、vLLM、LiteLLM 等)

示例(OpenAI‑兼容):

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

- 对于自定义 providers,`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 是可选的。
  省略时,OpenClaw 默认为:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推荐:设置与你的 proxy/model 限制匹配的显式值。
- 对于非原生端点上的 `api: "openai-completions"`(任何主机不是 `api.openai.com` 的非空 `baseUrl`),OpenClaw 强制设置 `compat.supportsDeveloperRole: false` 以避免不支持 `developer` 角色的 provider 返回 400 错误。
- 如果 `baseUrl` 为空/省略,OpenClaw 保持默认的 OpenAI 行为(解析为 `api.openai.com`)。
- 为了安全起见,在非原生 `openai-completions` 端点上,显式的 `compat.supportsDeveloperRole: true` 仍会被覆盖。

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另见:[/gateway/configuration](/gateway/configuration) 了解完整配置示例。
