---
title: "模型提供方"
sidebarTitle: "模型提供方"
mmh3_hash: "e3c077d21cdb46bcd8c08d140b2189dd"
summary: "Model provider 概述,包含示例配置 + CLI 流程"
read_when: ["你需要按 provider 的 model 设置参考","你想要 model providers 的示例配置或 CLI onboarding 命令"]
---
# 模型提供方

本页面涵盖 **LLM/model providers**(不是像 WhatsApp/Telegram 这样的聊天 channels)。有关 model 选择规则,请参见 [/concepts/models](/zh/concepts/models)。

## 快速规则

- Model refs 使用 `provider/model`(例如:`opencode/claude-opus-4-5`)。
- 如果你设置 `agents.defaults.models`,它将成为允许列表。
- CLI helpers: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。

## 内置 providers (pi-ai catalog)

OpenClaw 附带 pi‑ai catalog。这些 providers **不需要** `models.providers` 配置;只需设置 auth + 选择 model。

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- 示例 model: `openai/gpt-5.2`
- CLI: `openclaw onboard --auth-choice openai-api-key`

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.2" } } }
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY` 或 `claude setup-token`
- 示例 model: `anthropic/claude-opus-4-5`
- CLI: `openclaw onboard --auth-choice token` (粘贴 setup-token) 或 `openclaw models auth paste-token --provider anthropic`

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } }
}
```

### OpenAI Code (Codex)

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- 示例 model: `openai-codex/gpt-5.2`
- CLI: `openclaw onboard --auth-choice openai-codex` 或 `openclaw models auth login --provider openai-codex`

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.2" } } }
}
```

### OpenCode Zen

- Provider: `opencode`
- Auth: `OPENCODE_API_KEY` (或 `OPENCODE_ZEN_API_KEY`)
- 示例 model: `opencode/claude-opus-4-5`
- CLI: `openclaw onboard --auth-choice opencode-zen`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-5" } } }
}
```

### Google Gemini (API key)

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- 示例 model: `google/gemini-3-pro-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`

### Google Vertex / Antigravity / Gemini CLI

- Providers: `google-vertex`、`google-antigravity`、`google-gemini-cli`
- Auth: Vertex 使用 gcloud ADC;Antigravity/Gemini CLI 使用它们各自的 auth 流程
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
- 示例 model: `zai/glm-4.7`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 别名:`z.ai/*` 和 `z-ai/*` 规范化为 `zai/*`

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- 示例 model: `vercel-ai-gateway/anthropic/claude-opus-4.5`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### 其他内置 providers

- OpenRouter: `openrouter` (`OPENROUTER_API_KEY`)
- 示例 model: `openrouter/anthropic/claude-sonnet-4-5`
- xAI: `xai` (`XAI_API_KEY`)
- Groq: `groq` (`GROQ_API_KEY`)
- Cerebras: `cerebras` (`CEREBRAS_API_KEY`)
  - Cerebras 上的 GLM models 使用 ids `zai-glm-4.7` 和 `zai-glm-4.6`。
  - OpenAI 兼容 base URL: `https://api.cerebras.ai/v1`。
- Mistral: `mistral` (`MISTRAL_API_KEY`)
- GitHub Copilot: `github-copilot` (`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`)

## 通过 `models.providers` 的 Providers (自定义/base URL)

使用 `models.providers`(或 `models.json`)添加 **自定义** providers 或 OpenAI/Anthropic‑兼容 proxies。

### Moonshot AI (Kimi)

Moonshot 使用 OpenAI 兼容端点,因此将其配置为自定义 provider:

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- 示例 model: `moonshot/kimi-k2.5`
- Kimi K2 model IDs:
  {/* moonshot-kimi-k2-model-refs:start */}
  - `moonshot/kimi-k2.5`
  - `moonshot/kimi-k2-0905-preview`
  - `moonshot/kimi-k2-turbo-preview`
  - `moonshot/kimi-k2-thinking`
  - `moonshot/kimi-k2-thinking-turbo`
  {/* moonshot-kimi-k2-model-refs:end */}
```json5
{
  agents: {
    defaults: { model: { primary: "moonshot/kimi-k2.5" } }
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-k2.5", name: "Kimi K2.5" }]
      }
    }
  }
}
```

### Kimi Code

Kimi Code 使用专用端点和 key(与 Moonshot 分开):

- Provider: `kimi-code`
- Auth: `KIMICODE_API_KEY`
- 示例 model: `kimi-code/kimi-for-coding`

```json5
{
  env: { KIMICODE_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi-code/kimi-for-coding" } }
  },
  models: {
    mode: "merge",
    providers: {
      "kimi-code": {
        baseUrl: "https://api.kimi.com/coding/v1",
        apiKey: "${KIMICODE_API_KEY}",
        api: "openai-completions",
        models: [{ id: "kimi-for-coding", name: "Kimi For Coding" }]
      }
    }
  }
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

参见 [/providers/qwen](/zh/providers/qwen) 了解设置详细信息和注释。

### Synthetic

Synthetic 在 `synthetic` provider 后面提供 Anthropic 兼容的 models:

- Provider: `synthetic`
- Auth: `SYNTHETIC_API_KEY`
- 示例 model: `synthetic/hf:MiniMaxAI/MiniMax-M2.1`
- CLI: `openclaw onboard --auth-choice synthetic-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.1" } }
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [{ id: "hf:MiniMaxAI/MiniMax-M2.1", name: "MiniMax M2.1" }]
      }
    }
  }
}
```

### MiniMax

MiniMax 通过 `models.providers` 配置,因为它使用自定义端点:

- MiniMax (Anthropic‑兼容): `--auth-choice minimax-api`
- Auth: `MINIMAX_API_KEY`

参见 [/providers/minimax](/zh/providers/minimax) 了解设置详细信息、model 选项和配置片段。

### Ollama

Ollama 是一个本地 LLM runtime,提供 OpenAI 兼容的 API:

- Provider: `ollama`
- Auth: 不需要(本地 server)
- 示例 model: `ollama/llama3.3`
- 安装: https://ollama.ai

```bash
# 安装 Ollama,然后 pull model:
ollama pull llama3.3
```

```json5
{
  agents: {
    defaults: { model: { primary: "ollama/llama3.3" } }
  }
}
```

Ollama 在本地 `http://127.0.0.1:11434/v1` 运行时自动检测。参见 [/providers/ollama](/zh/providers/ollama) 了解 model 推荐和自定义配置。

### 本地 proxies (LM Studio、vLLM、LiteLLM 等)

示例(OpenAI‑兼容):

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.1-gs32" },
      models: { "lmstudio/minimax-m2.1-gs32": { alias: "Minimax" } }
    }
  },
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "LMSTUDIO_KEY",
        api: "openai-completions",
        models: [
          {
            id: "minimax-m2.1-gs32",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192
          }
        ]
      }
    }
  }
}
```

注意:
- 对于自定义 providers,`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 是可选的。省略时,OpenClaw 默认为:
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 推荐:设置与你的 proxy/model 限制匹配的显式值。

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-5
openclaw models list
```

另见:[/gateway/configuration](/zh/gateway/configuration) 了解完整配置示例。
