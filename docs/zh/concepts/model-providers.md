---
mmh3_hash: "67edcf0a10f6413983bfd0bcf60394cf"
summary: "Model provider 概述，包含示例配置 + CLI 流程"
read_when:
  - 你需要按 provider 的 model 设置参考
  - 你想要 model providers 的示例配置或 CLI onboarding 命令
title: "Model providers"
sidebarTitle: "Model providers"
---

本页面涵盖 **LLM/model providers**（不是像 WhatsApp/Telegram 这样的聊天 channels）。有关 model 选择规则，请参见 [Models](/concepts/models)。

## 快速规则

<AccordionGroup>
  <Accordion title="Model refs 和 CLI helpers">
    - Model refs 使用 `provider/model`（例如：`opencode/claude-opus-4-6`）。
    - 如果设置了 `agents.defaults.models`，则作为允许列表。
    - CLI helpers: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
    - `models.providers.*.contextWindow` / `contextTokens` / `maxTokens` 设置 provider 级别默认值；`models.providers.*.models[].contextWindow` / `contextTokens` / `maxTokens` 按 model 覆盖。
    - Fallback 规则、cooldown 探测和 Session 覆盖持久化：[Model failover](/concepts/model-failover)。
  </Accordion>
  <Accordion title="OpenAI provider/runtime 分离">
    OpenAI 系列路由是前缀特定的：

    - `openai/<model>` 在 PI 中使用直接 OpenAI API key provider。
    - `openai-codex/<model>` 在 PI 中使用 Codex OAuth。
    - `openai/<model>` 加上 `agents.defaults.agentRuntime.id: "codex"` 使用原生 Codex app-server harness。

    参见 [OpenAI](/providers/openai) 和 [Codex harness](/plugins/codex-harness)。如果 provider/runtime 分离令人困惑，请先阅读 [Agent runtimes](/concepts/agent-runtimes)。

    Plugin 自动启用遵循相同的边界：`openai-codex/<model>` 属于 OpenAI plugin，而 Codex plugin 由 `agentRuntime.id: "codex"` 或旧版 `codex/<model>` refs 启用。

    GPT-5.5 可通过 `openai/gpt-5.5` 用于直接 API key 流量，`openai-codex/gpt-5.5` 在 PI 中用于 Codex OAuth，以及在设置 `agentRuntime.id: "codex"` 时通过原生 Codex app-server harness。

  </Accordion>
  <Accordion title="CLI runtimes">
    CLI runtimes 使用相同的分离方式：选择规范的 model refs，如 `anthropic/claude-*`、`google/gemini-*` 或 `openai/gpt-*`，然后在需要本地 CLI 后端时将 `agents.defaults.agentRuntime.id` 设置为 `claude-cli`、`google-gemini-cli` 或 `codex-cli`。

    旧版 `claude-cli/*`、`google-gemini-cli/*` 和 `codex-cli/*` refs 会迁移回规范的 provider refs，并单独记录 runtime。

  </Accordion>
</AccordionGroup>

## Plugin 拥有的 provider 行为

大多数 provider 特定逻辑位于 provider plugins (`registerProvider(...)`) 中，而 OpenClaw 保留通用推理循环。Plugin 拥有 onboarding、model catalogs、auth env-var 映射、传输/配置规范化、tool-schema 清理、failover 分类、OAuth 刷新、usage 报告、thinking/reasoning profiles 等。

完整的 provider SDK hooks 列表和捆绑 plugin 示例位于 [Provider plugins](/plugins/sdk-provider-plugins)。需要完全自定义请求执行器的 provider 是一个单独的、更深层的扩展表面。

<Note>
Provider runtime `capabilities` 是共享的 runner 元数据（provider 系列、transcript/工具特性、传输/缓存提示）。这与描述插件注册内容（文本推理、语音等）的[公共能力模型](/plugins/architecture#public-capability-model)不同。
</Note>

## API key 轮换

<AccordionGroup>
  <Accordion title="Key 来源和优先级">
    通过以下方式配置多个 keys：

    - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个实时覆盖，最高优先级）
    - `<PROVIDER>_API_KEYS`（逗号或分号列表）
    - `<PROVIDER>_API_KEY`（主 key）
    - `<PROVIDER>_API_KEY_*`（编号列表，例如 `<PROVIDER>_API_KEY_1`）

    对于 Google providers，`GOOGLE_API_KEY` 也作为备用包含在内。Key 选择顺序保持优先级并删除重复值。

  </Accordion>
  <Accordion title="轮换触发时机">
    - 仅在速率限制响应（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 或定期使用限制消息）时，用下一个 key 重试请求。
    - 非速率限制失败立即失败；不尝试 key 轮换。
    - 当所有候选 keys 失败时，从最后一次尝试返回最终错误。
  </Accordion>
</AccordionGroup>

## 内置 providers（pi-ai catalog）

OpenClaw 附带 pi-ai catalog。这些 providers **不需要** `models.providers` 配置；只需设置 auth + 选择 model。

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- 可选轮换：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，加上 `OPENCLAW_LIVE_OPENAI_KEY`（单个覆盖）
- 示例 models: `openai/gpt-5.5`、`openai/gpt-5.4-mini`
- 通过 `openclaw models list --provider openai` 验证账户/model 可用性（如果特定安装或 API key 行为不同）。
- CLI: `openclaw onboard --auth-choice openai-api-key`
- 默认传输为 `auto`（WebSocket 优先，SSE 回退）
- 通过 `agents.defaults.models["openai/<model>"].params.transport` 按 model 覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- OpenAI Responses WebSocket 预热通过 `params.openaiWsWarmup`（`true`/`false`）默认启用
- OpenAI 优先处理可通过 `agents.defaults.models["openai/<model>"].params.serviceTier` 启用
- `/fast` 和 `params.fastMode` 将直接 `openai/*` Responses 请求映射到 `api.openai.com` 上的 `service_tier=priority`
- 当你需要明确的 tier 而不是共享的 `/fast` 切换时，使用 `params.serviceTier`
- 隐藏的 OpenClaw 归属 headers（`originator`、`version`、`User-Agent`）仅适用于到 `api.openai.com` 的原生 OpenAI 流量，不适用于通用 OpenAI 兼容代理
- 原生 OpenAI 路由还保留 Responses `store`、prompt-cache 提示和 OpenAI reasoning-compat payload 整形；代理路由不保留
- `openai/gpt-5.3-codex-spark` 在 OpenClaw 中被有意抑制，因为实时 OpenAI API 拒绝它，且当前 Codex catalog 不公开它

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- 可选轮换：`ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`，加上 `OPENCLAW_LIVE_ANTHROPIC_KEY`（单个覆盖）
- 示例 model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接公共 Anthropic 请求支持共享的 `/fast` 切换和 `params.fastMode`，包括发送到 `api.anthropic.com` 的 API key 和 OAuth 认证流量；OpenClaw 将其映射到 Anthropic `service_tier`（`auto` 与 `standard_only`）
- 首选的 Claude CLI 配置保持 model ref 规范并单独选择 CLI 后端：`anthropic/claude-opus-4-7` 加上 `agents.defaults.agentRuntime.id: "claude-cli"`。旧版 `claude-cli/claude-opus-4-7` refs 仍可兼容使用。

<Note>
Anthropic 工作人员告诉我们 OpenClaw 风格的 Claude CLI 使用再次被允许，因此 OpenClaw 将 Claude CLI 重用和 `claude -p` 使用视为此集成的授权，除非 Anthropic 发布新政策。Anthropic setup-token 仍作为受支持的 OpenClaw token 路径提供，但 OpenClaw 现在在可用时优先使用 Claude CLI 重用和 `claude -p`。
</Note>

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

### OpenAI Codex OAuth

- Provider: `openai-codex`
- Auth: OAuth (ChatGPT)
- PI model ref: `openai-codex/gpt-5.5`
- 原生 Codex app-server harness ref: `openai/gpt-5.5` 加上 `agents.defaults.agentRuntime.id: "codex"`
- 原生 Codex app-server harness 文档：[Codex harness](/plugins/codex-harness)
- 旧版 model refs: `codex/gpt-*`
- Plugin 边界：`openai-codex/*` 加载 OpenAI plugin；原生 Codex app-server plugin 仅由 Codex harness runtime 或旧版 `codex/*` refs 选择。
- CLI: `openclaw onboard --auth-choice openai-codex` 或 `openclaw models auth login --provider openai-codex`
- 默认传输为 `auto`（WebSocket 优先，SSE 回退）
- 通过 `agents.defaults.models["openai-codex/<model>"].params.transport` 按 PI model 覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- `params.serviceTier` 也在原生 Codex Responses 请求（`chatgpt.com/backend-api`）上转发
- 隐藏的 OpenClaw 归属 headers（`originator`、`version`、`User-Agent`）仅附加在到 `chatgpt.com/backend-api` 的原生 Codex 流量上，不适用于通用 OpenAI 兼容代理
- 与直接 `openai/*` 共享相同的 `/fast` 切换和 `params.fastMode` 配置；OpenClaw 将其映射到 `service_tier=priority`
- `openai-codex/gpt-5.5` 使用 Codex catalog 原生 `contextWindow = 400000` 和默认运行时 `contextTokens = 272000`；使用 `models.providers.openai-codex.models[].contextTokens` 覆盖运行时上限
- 策略说明：OpenAI Codex OAuth 明确支持外部工具/工作流（如 OpenClaw）使用。
- 当需要 Codex OAuth/订阅路由时使用 `openai-codex/gpt-5.5`；当你的 API key 设置和本地 catalog 公开公共 API 路由时使用 `openai/gpt-5.5`。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
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
  <Card title="GLM models" href="/providers/glm">
    Z.AI Coding Plan 或通用 API 端点。
  </Card>
  <Card title="MiniMax" href="/providers/minimax">
    MiniMax Coding Plan OAuth 或 API key 访问。
  </Card>
  <Card title="Qwen Cloud" href="/providers/qwen">
    Qwen Cloud provider 表面加 Alibaba DashScope 和 Coding Plan 端点映射。
  </Card>
</CardGroup>

### OpenCode

- Auth: `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）
- Zen runtime provider: `opencode`
- Go runtime provider: `opencode-go`
- 示例 models: `opencode/claude-opus-4-6`、`opencode-go/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`

```json5
{
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

### Google Gemini（API key）

- Provider: `google`
- Auth: `GEMINI_API_KEY`
- 可选轮换：`GEMINI_API_KEYS`、`GEMINI_API_KEY_1`、`GEMINI_API_KEY_2`、`GOOGLE_API_KEY` 备用，以及 `OPENCLAW_LIVE_GEMINI_KEY`（单个覆盖）
- 示例 models: `google/gemini-3.1-pro-preview`、`google/gemini-3-flash-preview`
- 兼容性：使用 `google/gemini-3.1-flash-preview` 的旧版 OpenClaw 配置被规范化为 `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- Thinking: `/think adaptive` 使用 Google 动态 thinking。Gemini 3/3.1 省略固定的 `thinkingLevel`；Gemini 2.5 发送 `thinkingBudget: -1`。
- 直接 Gemini 运行还接受 `agents.defaults.models["google/<model>"].params.cachedContent`（或旧版 `cached_content`）来转发 provider 原生 `cachedContents/...` 句柄；Gemini 缓存命中显示为 OpenClaw `cacheRead`

### Google Vertex 和 Gemini CLI

- Providers: `google-vertex`、`google-gemini-cli`
- Auth: Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程

<Warning>
OpenClaw 中的 Gemini CLI OAuth 是非官方集成。一些用户报告说在使用第三方客户端后 Google 账户受到限制。查看 Google 条款，如果你选择继续，请使用非关键账户。
</Warning>

Gemini CLI OAuth 作为捆绑的 `google` plugin 的一部分提供。

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
  <Step title="启用 plugin">
    ```bash
    openclaw plugins enable google
    ```
  </Step>
  <Step title="登录">
    ```bash
    openclaw models auth login --provider google-gemini-cli --set-default
    ```

    默认 model: `google-gemini-cli/gemini-3-flash-preview`。你**不**将 client id 或 secret 粘贴到 `openclaw.json` 中。CLI 登录流程将令牌存储在 gateway 主机上的 auth profiles 中。

  </Step>
  <Step title="设置项目（如需要）">
    如果登录后请求失败，在 gateway 主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  </Step>
</Steps>

Gemini CLI JSON 回复从 `response` 解析；usage 回退到 `stats`，`stats.cached` 规范化为 OpenClaw `cacheRead`。

### Z.AI (GLM)

- Provider: `zai`
- Auth: `ZAI_API_KEY`
- 示例 model: `zai/glm-5.1`
- CLI: `openclaw onboard --auth-choice zai-api-key`
  - 别名：`z.ai/*` 和 `z-ai/*` 规范化为 `zai/*`
  - `zai-api-key` 自动检测匹配的 Z.AI 端点；`zai-coding-global`、`zai-coding-cn`、`zai-global` 和 `zai-cn` 强制指定特定表面

### Vercel AI Gateway

- Provider: `vercel-ai-gateway`
- Auth: `AI_GATEWAY_API_KEY`
- 示例 models: `vercel-ai-gateway/anthropic/claude-opus-4.6`、`vercel-ai-gateway/moonshotai/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice ai-gateway-api-key`

### Kilo Gateway

- Provider: `kilocode`
- Auth: `KILOCODE_API_KEY`
- 示例 model: `kilocode/kilo/auto`
- CLI: `openclaw onboard --auth-choice kilocode-api-key`
- Base URL: `https://api.kilo.ai/api/gateway/`
- 静态备用 catalog 附带 `kilocode/kilo/auto`；实时 `https://api.kilo.ai/api/gateway/models` 发现可以进一步扩展运行时 catalog。
- `kilocode/kilo/auto` 背后的确切上游路由由 Kilo Gateway 拥有，而非在 OpenClaw 中硬编码。

参见 [/providers/kilocode](/providers/kilocode) 了解设置详情。

### 其他捆绑 provider plugins

| Provider                | ID                               | Auth 环境变量                                                 | 示例 model                                      |
| ----------------------- | -------------------------------- | ------------------------------------------------------------ | ----------------------------------------------- |
| BytePlus                | `byteplus` / `byteplus-plan`     | `BYTEPLUS_API_KEY`                                           | `byteplus-plan/ark-code-latest`                 |
| Cerebras                | `cerebras`                       | `CEREBRAS_API_KEY`                                           | `cerebras/zai-glm-4.7`                          |
| Cloudflare AI Gateway   | `cloudflare-ai-gateway`          | `CLOUDFLARE_AI_GATEWAY_API_KEY`                              | —                                               |
| DeepSeek                | `deepseek`                       | `DEEPSEEK_API_KEY`                                           | `deepseek/deepseek-v4-flash`                    |
| GitHub Copilot          | `github-copilot`                 | `COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`         | —                                               |
| Groq                    | `groq`                           | `GROQ_API_KEY`                                               | —                                               |
| Hugging Face Inference  | `huggingface`                    | `HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`                        | `huggingface/deepseek-ai/DeepSeek-R1`           |
| Kilo Gateway            | `kilocode`                       | `KILOCODE_API_KEY`                                           | `kilocode/kilo/auto`                            |
| Kimi Coding             | `kimi`                           | `KIMI_API_KEY` 或 `KIMICODE_API_KEY`                         | `kimi/kimi-code`                                |
| MiniMax                 | `minimax` / `minimax-portal`     | `MINIMAX_API_KEY` / `MINIMAX_OAUTH_TOKEN`                    | `minimax/MiniMax-M2.7`                          |
| Mistral                 | `mistral`                        | `MISTRAL_API_KEY`                                            | `mistral/mistral-large-latest`                  |
| Moonshot                | `moonshot`                       | `MOONSHOT_API_KEY`                                           | `moonshot/kimi-k2.6`                            |
| NVIDIA                  | `nvidia`                         | `NVIDIA_API_KEY`                                             | `nvidia/nvidia/llama-3.1-nemotron-70b-instruct` |
| OpenRouter              | `openrouter`                     | `OPENROUTER_API_KEY`                                         | `openrouter/auto`                               |
| Qianfan                 | `qianfan`                        | `QIANFAN_API_KEY`                                            | `qianfan/deepseek-v3.2`                         |
| Qwen Cloud              | `qwen`                           | `QWEN_API_KEY` / `MODELSTUDIO_API_KEY` / `DASHSCOPE_API_KEY` | `qwen/qwen3.5-plus`                             |
| StepFun                 | `stepfun` / `stepfun-plan`       | `STEPFUN_API_KEY`                                            | `stepfun/step-3.5-flash`                        |
| Together                | `together`                       | `TOGETHER_API_KEY`                                           | `together/moonshotai/Kimi-K2.5`                 |
| Venice                  | `venice`                         | `VENICE_API_KEY`                                             | —                                               |
| Vercel AI Gateway       | `vercel-ai-gateway`              | `AI_GATEWAY_API_KEY`                                         | `vercel-ai-gateway/anthropic/claude-opus-4.6`   |
| Volcano Engine (Doubao) | `volcengine` / `volcengine-plan` | `VOLCANO_ENGINE_API_KEY`                                     | `volcengine-plan/ark-code-latest`               |
| xAI                     | `xai`                            | `XAI_API_KEY`                                                | `xai/grok-4`                                    |
| Xiaomi                  | `xiaomi`                         | `XIAOMI_API_KEY`                                             | `xiaomi/mimo-v2-flash`                          |

#### 值得了解的特性

<AccordionGroup>
  <Accordion title="OpenRouter">
    仅在经过验证的 `openrouter.ai` 路由上应用其应用归属 headers 和 Anthropic `cache_control` 标记。DeepSeek、Moonshot 和 ZAI refs 具备 OpenRouter 管理的 prompt caching 的 cache-TTL 资格，但不接受 Anthropic cache 标记。作为代理式 OpenAI 兼容路径，它跳过原生 OpenAI 专用整形（`serviceTier`、Responses `store`、prompt-cache 提示、OpenAI reasoning-compat）。Gemini 支持的 refs 仅保留代理 Gemini thought-signature 清理。
  </Accordion>
  <Accordion title="Kilo Gateway">
    Gemini 支持的 refs 遵循相同的代理 Gemini 清理路径；`kilocode/kilo/auto` 和其他代理 reasoning 不支持的 refs 跳过代理 reasoning 注入。
  </Accordion>
  <Accordion title="MiniMax">
    API key onboarding 写入带有仅文本 M2.7 聊天 model 定义；图像理解保留在 plugin 拥有的 `MiniMax-VL-01` 媒体 provider 上。
  </Accordion>
  <Accordion title="xAI">
    使用 xAI Responses 路径。`/fast` 或 `params.fastMode: true` 将 `grok-3`、`grok-3-mini`、`grok-4` 和 `grok-4-0709` 重写为其 `*-fast` 变体。`tool_stream` 默认开启；通过 `agents.defaults.models["xai/<model>"].params.tool_stream=false` 禁用。
  </Accordion>
  <Accordion title="Cerebras">
    作为捆绑的 `cerebras` provider plugin 提供。GLM 使用 `zai-glm-4.7`；OpenAI 兼容 base URL 为 `https://api.cerebras.ai/v1`。
  </Accordion>
</AccordionGroup>

## 通过 `models.providers` 配置的 providers（自定义/base URL）

使用 `models.providers`（或 `models.json`）添加**自定义** providers 或 OpenAI/Anthropic 兼容代理。

下面许多捆绑的 provider plugins 已经发布了默认 catalog。仅当你想覆盖默认 base URL、headers 或 model 列表时，才使用显式的 `models.providers.<id>` 条目。

### Moonshot AI (Kimi)

Moonshot 作为捆绑的 provider plugin 提供。默认使用内置 provider，仅当你需要覆盖 base URL 或 model 元数据时才添加显式 `models.providers.moonshot` 条目：

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- 示例 model: `moonshot/kimi-k2.6`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 model IDs：

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

- Provider: `kimi`
- Auth: `KIMI_API_KEY`
- 示例 model: `kimi/kimi-code`

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: { model: { primary: "kimi/kimi-code" } },
  },
}
```

旧版 `kimi/k2p5` 仍作为兼容 model id 接受。

### Volcano Engine（火山引擎）

Volcano Engine（火山引擎）在中国提供对 Doubao 和其他 models 的访问。

- Provider: `volcengine`（编码：`volcengine-plan`）
- Auth: `VOLCANO_ENGINE_API_KEY`
- 示例 model: `volcengine-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice volcengine-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "volcengine-plan/ark-code-latest" } },
  },
}
```

Onboarding 默认为编码表面，但通用 `volcengine/*` catalog 同时注册。

在 onboarding/configure model picker 中，Volcengine auth 选项优先显示 `volcengine/*` 和 `volcengine-plan/*` 行。如果这些 models 尚未加载，OpenClaw 回退到未过滤的 catalog 而不是显示空的 provider 范围 picker。

<Tabs>
  <Tab title="标准 models">
    - `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
    - `volcengine/doubao-seed-code-preview-251028`
    - `volcengine/kimi-k2-5-260127`（Kimi K2.5）
    - `volcengine/glm-4-7-251222`（GLM 4.7）
    - `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2 128K）
  </Tab>
  <Tab title="编码 models (volcengine-plan)">
    - `volcengine-plan/ark-code-latest`
    - `volcengine-plan/doubao-seed-code`
    - `volcengine-plan/kimi-k2.5`
    - `volcengine-plan/kimi-k2-thinking`
    - `volcengine-plan/glm-4.7`
  </Tab>
</Tabs>

### BytePlus（国际版）

BytePlus ARK 为国际用户提供对与 Volcano Engine 相同 models 的访问。

- Provider: `byteplus`（编码：`byteplus-plan`）
- Auth: `BYTEPLUS_API_KEY`
- 示例 model: `byteplus-plan/ark-code-latest`
- CLI: `openclaw onboard --auth-choice byteplus-api-key`

```json5
{
  agents: {
    defaults: { model: { primary: "byteplus-plan/ark-code-latest" } },
  },
}
```

Onboarding 默认为编码表面，但通用 `byteplus/*` catalog 同时注册。

在 onboarding/configure model picker 中，BytePlus auth 选项优先显示 `byteplus/*` 和 `byteplus-plan/*` 行。如果这些 models 尚未加载，OpenClaw 回退到未过滤的 catalog 而不是显示空的 provider 范围 picker。

<Tabs>
  <Tab title="标准 models">
    - `byteplus/seed-1-8-251228`（Seed 1.8）
    - `byteplus/kimi-k2-5-260127`（Kimi K2.5）
    - `byteplus/glm-4-7-251222`（GLM 4.7）
  </Tab>
  <Tab title="编码 models (byteplus-plan)">
    - `byteplus-plan/ark-code-latest`
    - `byteplus-plan/doubao-seed-code`
    - `byteplus-plan/kimi-k2.5`
    - `byteplus-plan/kimi-k2-thinking`
    - `byteplus-plan/glm-4.7`
  </Tab>
</Tabs>

### Synthetic

Synthetic 在 `synthetic` provider 下提供 Anthropic 兼容的 models：

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

MiniMax 通过 `models.providers` 配置，因为它使用自定义端点：

- MiniMax OAuth（全球）：`--auth-choice minimax-global-oauth`
- MiniMax OAuth（中国）：`--auth-choice minimax-cn-oauth`
- MiniMax API key（全球）：`--auth-choice minimax-global-api`
- MiniMax API key（中国）：`--auth-choice minimax-cn-api`
- Auth: `MINIMAX_API_KEY` 用于 `minimax`；`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY` 用于 `minimax-portal`

参见 [/providers/minimax](/providers/minimax) 了解设置详情、model 选项和配置片段。

<Note>
在 MiniMax 的 Anthropic 兼容 streaming 路径上，OpenClaw 默认禁用 thinking，除非你明确设置它；`/fast on` 将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
</Note>

Plugin 拥有的 capability 分工：

- 文本/聊天默认保留在 `minimax/MiniMax-M2.7`
- 图像生成为 `minimax/image-01` 或 `minimax-portal/image-01`
- 图像理解为两种 MiniMax auth 路径上 plugin 拥有的 `MiniMax-VL-01`
- 网络搜索保留在 provider id `minimax`

### LM Studio

LM Studio 作为捆绑的 provider plugin 提供，使用原生 API：

- Provider: `lmstudio`
- Auth: `LM_API_TOKEN`
- 默认推理 base URL: `http://localhost:1234/v1`

然后设置 model（替换为 `http://localhost:1234/api/v1/models` 返回的 ID 之一）：

```json5
{
  agents: {
    defaults: { model: { primary: "lmstudio/openai/gpt-oss-20b" } },
  },
}
```

OpenClaw 使用 LM Studio 的原生 `/api/v1/models` 和 `/api/v1/models/load` 进行发现 + 自动加载，默认使用 `/v1/chat/completions` 进行推理。参见 [/providers/lmstudio](/providers/lmstudio) 了解设置和故障排除。

### Ollama

Ollama 作为捆绑的 provider plugin 提供，并使用 Ollama 的原生 API：

- Provider: `ollama`
- Auth: 无需（本地服务器）
- 示例 model: `ollama/llama3.3`
- 安装: [https://ollama.com/download](https://ollama.com/download)

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

当你使用 `OLLAMA_API_KEY` 选择加入时，Ollama 在 `http://127.0.0.1:11434` 本地检测，捆绑的 provider plugin 直接将 Ollama 添加到 `openclaw onboard` 和 model picker 中。参见 [/providers/ollama](/providers/ollama) 了解 onboarding、cloud/local 模式和自定义配置。

### vLLM

vLLM 作为捆绑的 provider plugin 为本地/自托管 OpenAI 兼容服务器提供：

- Provider: `vllm`
- Auth: 可选（取决于你的服务器）
- 默认 base URL: `http://127.0.0.1:8000/v1`

要在本地选择加入自动发现（如果你的服务器不强制执行 auth，任何值都有效）：

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

参见 [/providers/vllm](/providers/vllm) 了解详情。

### SGLang

SGLang 作为捆绑的 provider plugin 为快速自托管 OpenAI 兼容服务器提供：

- Provider: `sglang`
- Auth: 可选（取决于你的服务器）
- 默认 base URL: `http://127.0.0.1:30000/v1`

要在本地选择加入自动发现（如果你的服务器不强制执行 auth，任何值都有效）：

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

参见 [/providers/sglang](/providers/sglang) 了解详情。

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
    对于自定义 providers，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 是可选的。省略时，OpenClaw 默认为：

    - `reasoning: false`
    - `input: ["text"]`
    - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
    - `contextWindow: 200000`
    - `maxTokens: 8192`

    建议：设置与你的 proxy/model 限制匹配的显式值。

  </Accordion>
  <Accordion title="代理路由整形规则">
    - 对于非原生端点上的 `api: "openai-completions"`（任何主机不是 `api.openai.com` 的非空 `baseUrl`），OpenClaw 强制 `compat.supportsDeveloperRole: false` 以避免不支持的 `developer` 角色导致的 provider 400 错误。
    - 代理式 OpenAI 兼容路由还跳过原生 OpenAI 专用请求整形：无 `service_tier`、无 Responses `store`、无 Completions `store`、无 prompt-cache 提示、无 OpenAI reasoning-compat payload 整形，也无隐藏的 OpenClaw 归属 headers。
    - 对于需要厂商特定字段的 OpenAI 兼容 Completions 代理，将 `agents.defaults.models["provider/model"].params.extra_body`（或 `extraBody`）设置为合并到出站请求体中的额外 JSON。
    - 对于 vLLM 聊天模板控制，设置 `agents.defaults.models["provider/model"].params.chat_template_kwargs`。OpenClaw 在 session thinking 级别关闭时，自动为 `vllm/nemotron-3-*` 发送 `enable_thinking: false` 和 `force_nonempty_content: true`。
    - 对于速度较慢的本地 model 或远程 LAN/tailnet 主机，设置 `models.providers.<id>.timeoutSeconds`。这延长了 provider model HTTP 请求处理（包括连接、headers、body streaming 和总体受保护的 fetch 中止），而不会增加整个 agent runtime 超时。
    - 如果 `baseUrl` 为空/省略，OpenClaw 保持默认 OpenAI 行为（解析为 `api.openai.com`）。
    - 为了安全起见，在非原生 `openai-completions` 端点上，显式的 `compat.supportsDeveloperRole: true` 仍然会被覆盖。
  </Accordion>
</AccordionGroup>

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另请参见：[Configuration](/gateway/configuration) 了解完整的配置示例。

## 相关链接

- [配置参考](/gateway/config-agents#agent-defaults) — model 配置键
- [Model failover](/concepts/model-failover) — fallback 链和重试行为
- [Models](/concepts/models) — model 配置和别名
- [Providers](/providers) — 每个 provider 的设置指南
