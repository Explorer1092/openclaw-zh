---
mmh3_hash: "da49a28f888cd52d8d3feda8009dc577"
summary: "Model provider 概述,包含示例配置 + CLI 流程"
read_when:
  - 你需要按 provider 的 model 设置参考
  - 你想要 model providers 的示例配置或 CLI onboarding 命令
title: "Model Providers"
---

# Model providers

本页面涵盖 **LLM/model providers**（不是像 WhatsApp/Telegram 这样的聊天 channels）。有关 model 选择规则，请参见 [/concepts/models](/concepts/models)。

## 快速规则

- Model refs 使用 `provider/model`（例如：`opencode/claude-opus-4-6`）。
- 如果你设置 `agents.defaults.models`，它将成为允许列表。
- CLI helpers: `openclaw onboard`、`openclaw models list`、`openclaw models set <provider/model>`。
- Fallback 运行时规则、cooldown 探测和 Session 覆盖持久化记录在 [/concepts/model-failover](/concepts/model-failover) 中。
- `models.providers.*.models[].contextWindow` 是原生 model 元数据；`models.providers.*.models[].contextTokens` 是有效的运行时上限。
- Provider plugins 可以通过 `registerProvider({ catalog })` 注入 model catalogs；OpenClaw 在写入 `models.json` 之前将该输出合并到 `models.providers` 中。
- Provider manifests 可以声明 `providerAuthEnvVars` 和 `providerAuthAliases`，以便通用基于 env 的 auth probes 和 provider 变体不需要加载 plugin runtime。其余的核心 env-var 映射现在仅用于非 plugin/core providers 以及一些通用优先级情况，例如 Anthropic API-key-first onboarding。
- Provider plugins 也可以通过 `normalizeModelId`、`normalizeTransport`、`normalizeConfig`、`applyNativeStreamingUsageCompat`、`resolveConfigApiKey`、`resolveSyntheticAuth`、`shouldDeferSyntheticProfileAuth`、`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`contributeResolvedModelCompat`、`capabilities`、`normalizeToolSchemas`、`inspectToolSchemas`、`resolveReasoningOutputMode`、`prepareExtraParams`、`createStreamFn`、`wrapStreamFn`、`resolveTransportTurnState`、`resolveWebSocketSessionPolicy`、`createEmbeddingProvider`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`matchesContextOverflowError`、`classifyFailoverReason`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`applyConfigDefaults`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot` 和 `onModelSelected` 来拥有 provider runtime 行为。
- 注意：provider runtime `capabilities` 是共享的 runner 元数据（provider 系列、transcript/工具特性、传输/缓存提示）。这与描述插件注册内容（文本推理、语音等）的[公共能力模型](/plugins/architecture#public-capability-model)不同。
- 捆绑的 `codex` provider 与捆绑的 Codex agent harness 配对。当你需要 Codex 拥有的登录、model 发现、原生线程恢复和应用服务器执行时，使用 `codex/gpt-*`。普通 `openai/gpt-*` refs 继续使用 OpenAI provider 和正常的 OpenClaw provider 传输。Codex 专用部署可以通过 `agents.defaults.embeddedHarness.fallback: "none"` 禁用自动 PI fallback；参见 [Codex Harness](/plugins/codex-harness)。

## Plugin 拥有的 provider 行为

Provider plugins 现在可以拥有大多数 provider 特定逻辑，而 OpenClaw 保留通用推理循环。

典型分工：

- `auth[].run` / `auth[].runNonInteractive`：provider 拥有 `openclaw onboard`、`openclaw models auth` 和无头设置的 onboarding/login 流程
- `wizard.setup` / `wizard.modelPicker`：provider 拥有 auth-choice 标签、传统别名、onboarding 允许列表提示以及 onboarding/model picker 中的设置条目
- `catalog`：provider 出现在 `models.providers` 中
- `normalizeModelId`：provider 在查找或规范化之前规范化传统/预览 model ids
- `normalizeTransport`：provider 在通用 model 组装之前规范化传输族 `api` / `baseUrl`；OpenClaw 首先检查匹配的 provider，然后检查其他具有 hook 能力的 provider plugins，直到有一个实际更改传输
- `normalizeConfig`：provider 在 runtime 使用之前规范化 `models.providers.<id>` 配置；OpenClaw 首先检查匹配的 provider，然后检查其他具有 hook 能力的 provider plugins，直到有一个实际更改配置。如果没有 provider hook 重写配置，捆绑的 Google 系列助手仍然规范化受支持的 Google provider 条目
- `applyNativeStreamingUsageCompat`：provider 为配置 providers 应用端点驱动的原生 streaming-usage compat 重写
- `resolveConfigApiKey`：provider 为配置 providers 解析 env-marker auth，无需强制完全 runtime auth 加载。`amazon-bedrock` 在此也有内置的 AWS env-marker 解析器，即使 Bedrock runtime auth 使用 AWS SDK 默认链
- `resolveSyntheticAuth`：provider 可以公开本地/自托管或其他基于配置的 auth 可用性，而无需持久化明文 secrets
- `shouldDeferSyntheticProfileAuth`：provider 可以将存储的合成 profile 占位符标记为低于 env/config 支持的 auth 的优先级
- `resolveDynamicModel`：provider 接受本地静态 catalog 中尚不存在的 model ids
- `prepareDynamicModel`：provider 在重试动态解析之前需要元数据刷新
- `normalizeResolvedModel`：provider 需要传输或 base URL 重写
- `contributeResolvedModelCompat`：provider 为其厂商 model 贡献 compat 标志，即使它们通过另一个兼容传输到达
- `capabilities`：provider 发布 transcript/tooling/provider-family 特性
- `normalizeToolSchemas`：provider 在嵌入式 runner 看到工具 schemas 之前清理它们
- `inspectToolSchemas`：provider 在规范化后显示传输特定的 schema 警告
- `resolveReasoningOutputMode`：provider 选择原生与标记的 reasoning-output 合约
- `prepareExtraParams`：provider 默认或规范化每个 model 的请求参数
- `createStreamFn`：provider 用完全自定义的传输替换正常的流路径
- `wrapStreamFn`：provider 应用请求 headers/body/model compat wrappers
- `resolveTransportTurnState`：provider 提供每回合原生传输 headers 或元数据
- `resolveWebSocketSessionPolicy`：provider 提供原生 WebSocket session headers 或 session 冷却策略
- `createEmbeddingProvider`：当 embedding 行为属于 provider plugin 而非核心 embedding switchboard 时，provider 拥有内存 embedding 行为
- `formatApiKey`：provider 将存储的 auth profiles 格式化为传输期望的运行时 `apiKey` 字符串
- `refreshOAuth`：当共享的 `pi-ai` refreshers 不够时，provider 拥有 OAuth 刷新
- `buildAuthDoctorHint`：当 OAuth 刷新失败时，provider 附加修复指导
- `matchesContextOverflowError`：provider 识别通用启发式方法会遗漏的 provider 特定 context-window 溢出错误
- `classifyFailoverReason`：provider 将 provider 特定的原始传输/API 错误映射到 failover 原因，如速率限制或过载
- `isCacheTtlEligible`：provider 决定哪些上游 model ids 支持 prompt-cache TTL
- `buildMissingAuthMessage`：provider 用 provider 特定的恢复提示替换通用 auth-store 错误
- `suppressBuiltInModel`：provider 隐藏过时的上游行，并可以为直接解析失败返回 vendor 拥有的错误
- `augmentModelCatalog`：provider 在发现和配置合并后附加合成/最终 catalog 行
- `isBinaryThinking`：provider 拥有二进制开/关 thinking UX
- `supportsXHighThinking`：provider 将选定的 models 选择加入 `xhigh`
- `resolveDefaultThinkingLevel`：provider 拥有 model 系列的默认 `/think` 策略
- `applyConfigDefaults`：provider 在配置实体化期间根据 auth 模式、env 或 model 系列应用 provider 特定的全局默认值
- `isModernModelRef`：provider 拥有 live/smoke 首选 model 匹配
- `prepareRuntimeAuth`：provider 将已配置的凭据转换为短暂的运行时令牌
- `resolveUsageAuth`：provider 解析 `/usage` 和相关 status/reporting 表面的 usage/quota 凭据
- `fetchUsageSnapshot`：provider 拥有 usage 端点 fetch/解析，而 core 仍拥有摘要 shell 和格式化
- `onModelSelected`：provider 运行选择后副作用，如遥测或 provider 拥有的 session 记录

当前捆绑示例：

- `anthropic`：Claude 4.6 forward-compat fallback、auth 修复提示、usage 端点获取、cache-TTL/provider-family 元数据以及 auth-aware 全局配置默认值
- `amazon-bedrock`：provider 拥有的 context-overflow 匹配和针对 Bedrock 特定 throttle/not-ready 错误的 failover 原因分类，加上用于 Anthropic 流量 Claude 专用重放策略保护的共享 `anthropic-by-model` 重放族
- `anthropic-vertex`：Anthropic 消息流量上的 Claude 专用重放策略保护
- `openrouter`：透传 model ids、请求 wrappers、provider capability 提示、代理 Gemini 流量上的 Gemini thought-signature 清理、通过 `openrouter-thinking` 流族进行代理 reasoning 注入、路由元数据转发以及 cache-TTL 策略
- `github-copilot`：onboarding/device login、forward-compat model fallback、Claude-thinking transcript 提示、runtime token 交换以及 usage 端点获取
- `openai`：GPT-5.4 forward-compat fallback、直接 OpenAI 传输规范化、Codex-aware missing-auth 提示、Spark 抑制、合成 OpenAI/Codex catalog 行、thinking/live-model 策略、usage-token 别名规范化（`input`/`output` 和 `prompt`/`completion` 族）、用于原生 OpenAI/Codex wrappers 的共享 `openai-responses-defaults` 流族、provider-family 元数据、`gpt-image-1` 的捆绑图像生成 provider 注册以及 `sora-2` 的捆绑视频生成 provider 注册
- `google` 和 `google-gemini-cli`：Gemini 3.1 forward-compat fallback、原生 Gemini 重放验证、bootstrap 重放清理、标记 reasoning-output 模式、现代 model 匹配、Gemini image-preview models 的捆绑图像生成 provider 注册，以及 Veo models 的捆绑视频生成 provider 注册；Gemini CLI OAuth 还拥有 auth-profile token 格式化、usage-token 解析以及 usage surfaces 的 quota 端点获取
- `moonshot`：共享传输、plugin 拥有的 thinking payload 规范化
- `kilocode`：共享传输、plugin 拥有的请求 headers、reasoning payload 规范化、代理 Gemini thought-signature 清理以及 cache-TTL 策略
- `zai`：GLM-5 forward-compat fallback、`tool_stream` 默认值、cache-TTL 策略、binary-thinking/live-model 策略以及 usage auth + quota 获取；未知 `glm-5*` ids 从捆绑的 `glm-4.7` 模板合成
- `xai`：原生 Responses 传输规范化、Grok fast 变体的 `/fast` 别名重写、默认 `tool_stream`、xAI 特定的工具 schema/reasoning-payload 清理以及 `grok-imagine-video` 的捆绑视频生成 provider 注册
- `mistral`：plugin 拥有的 capability 元数据
- `opencode` 和 `opencode-go`：plugin 拥有的 capability 元数据加代理 Gemini thought-signature 清理
- `alibaba`：直接 Wan model refs（如 `alibaba/wan2.6-t2v`）的 plugin 拥有的视频生成 catalog
- `byteplus`：plugin 拥有的 catalogs 加 Seedance text-to-video/image-to-video models 的捆绑视频生成 provider 注册
- `fal`：FLUX image models 的捆绑第三方图像生成 provider 注册，加托管第三方视频模型的捆绑视频生成 provider 注册
- `cloudflare-ai-gateway`、`huggingface`、`kimi`、`nvidia`、`qianfan`、`stepfun`、`synthetic`、`venice`、`vercel-ai-gateway` 和 `volcengine`：仅 plugin 拥有的 catalogs
- `qwen`：文本 models 的 plugin 拥有的 catalogs 加其多模态表面的共享媒体理解和视频生成 provider 注册；Qwen 视频生成使用标准 DashScope 视频端点，捆绑 Wan models 如 `wan2.6-t2v` 和 `wan2.7-r2v`
- `runway`：原生 Runway 基于任务的 models（如 `gen4.5`）的 plugin 拥有的视频生成 provider 注册
- `minimax`：plugin 拥有的 catalogs、Hailuo 视频 models 的捆绑视频生成 provider 注册、`image-01` 的捆绑图像生成 provider 注册、混合 Anthropic/OpenAI 重放策略选择以及 usage auth/snapshot 逻辑
- `together`：plugin 拥有的 catalogs 加 Wan 视频 models 的捆绑视频生成 provider 注册
- `xiaomi`：plugin 拥有的 catalogs 加 usage auth/snapshot 逻辑

捆绑的 `openai` plugin 现在拥有两个 provider ids：`openai` 和 `openai-codex`。

这涵盖了仍然适合 OpenClaw 正常传输的 providers。需要完全自定义请求执行器的 provider 是一个单独的、更深层的扩展表面。

## API key 轮换

- 支持对选定 providers 的通用 provider 轮换。
- 通过以下方式配置多个 keys：
  - `OPENCLAW_LIVE_<PROVIDER>_KEY`（单个实时覆盖，最高优先级）
  - `<PROVIDER>_API_KEYS`（逗号或分号列表）
  - `<PROVIDER>_API_KEY`（主 key）
  - `<PROVIDER>_API_KEY_*`（编号列表，例如 `<PROVIDER>_API_KEY_1`）
- 对于 Google providers，`GOOGLE_API_KEY` 也作为备用包含在内。
- Key 选择顺序保持优先级并删除重复值。
- 仅在速率限制响应（例如 `429`、`rate_limit`、`quota`、`resource exhausted`、`Too many concurrent requests`、`ThrottlingException`、`concurrency limit reached`、`workers_ai ... quota limit exceeded` 或定期使用限制消息）上用下一个 key 重试请求。
- 非速率限制失败立即失败；不尝试 key 轮换。
- 当所有候选 keys 失败时，从最后一次尝试返回最终错误。

## 内置 providers（pi-ai catalog）

OpenClaw 附带 pi-ai catalog。这些 providers **不需要** `models.providers` 配置；只需设置 auth + 选择 model。

### OpenAI

- Provider: `openai`
- Auth: `OPENAI_API_KEY`
- 可选轮换：`OPENAI_API_KEYS`、`OPENAI_API_KEY_1`、`OPENAI_API_KEY_2`，加上 `OPENCLAW_LIVE_OPENAI_KEY`（单个覆盖）
- 示例 models: `openai/gpt-5.4`、`openai/gpt-5.4-pro`
- CLI: `openclaw onboard --auth-choice openai-api-key`
- 默认传输为 `auto`（WebSocket 优先，SSE 回退）
- 通过 `agents.defaults.models["openai/<model>"].params.transport` 按 model 覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- OpenAI Responses WebSocket 预热通过 `params.openaiWsWarmup`（`true`/`false`）默认启用
- OpenAI 优先处理可通过 `agents.defaults.models["openai/<model>"].params.serviceTier` 启用
- `/fast` 和 `params.fastMode` 将直接 `openai/*` Responses 请求映射到 `api.openai.com` 上的 `service_tier=priority`
- 当你需要明确的 tier 而不是共享的 `/fast` 切换时，使用 `params.serviceTier`
- 隐藏的 OpenClaw 归属 headers（`originator`、`version`、`User-Agent`）仅适用于到 `api.openai.com` 的原生 OpenAI 流量，不适用于通用 OpenAI 兼容代理
- 原生 OpenAI 路由还保留 Responses `store`、prompt-cache 提示和 OpenAI reasoning-compat payload 整形；代理路由不保留
- `openai/gpt-5.3-codex-spark` 在 OpenClaw 中被有意抑制，因为实时 OpenAI API 拒绝它；Spark 被视为仅 Codex

```json5
{
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

### Anthropic

- Provider: `anthropic`
- Auth: `ANTHROPIC_API_KEY`
- 可选轮换：`ANTHROPIC_API_KEYS`、`ANTHROPIC_API_KEY_1`、`ANTHROPIC_API_KEY_2`，加上 `OPENCLAW_LIVE_ANTHROPIC_KEY`（单个覆盖）
- 示例 model: `anthropic/claude-opus-4-6`
- CLI: `openclaw onboard --auth-choice apiKey`
- 直接公共 Anthropic 请求支持共享的 `/fast` 切换和 `params.fastMode`，包括发送到 `api.anthropic.com` 的 API key 和 OAuth 认证流量；OpenClaw 将其映射到 Anthropic `service_tier`（`auto` 与 `standard_only`）
- Anthropic 说明：Anthropic 工作人员告诉我们 OpenClaw 风格的 Claude CLI 使用再次被允许，因此 OpenClaw 将 Claude CLI 重用和 `claude -p` 使用视为此集成的授权，除非 Anthropic 发布新政策。
- Anthropic setup-token 仍作为受支持的 OpenClaw token 路径提供，但 OpenClaw 现在在可用时优先使用 Claude CLI 重用和 `claude -p`。

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
- 默认传输为 `auto`（WebSocket 优先，SSE 回退）
- 通过 `agents.defaults.models["openai-codex/<model>"].params.transport` 按 model 覆盖（`"sse"`、`"websocket"` 或 `"auto"`）
- `params.serviceTier` 也在原生 Codex Responses 请求（`chatgpt.com/backend-api`）上转发
- 隐藏的 OpenClaw 归属 headers（`originator`、`version`、`User-Agent`）仅附加在到 `chatgpt.com/backend-api` 的原生 Codex 流量上，不适用于通用 OpenAI 兼容代理
- 与直接 `openai/*` 共享相同的 `/fast` 切换和 `params.fastMode` 配置；OpenClaw 将其映射到 `service_tier=priority`
- 当 Codex OAuth catalog 公开时，`openai-codex/gpt-5.3-codex-spark` 仍然可用；依赖于权限
- `openai-codex/gpt-5.4` 保留原生 `contextWindow = 1050000` 和默认运行时 `contextTokens = 272000`；使用 `models.providers.openai-codex.models[].contextTokens` 覆盖运行时上限
- 策略说明：OpenAI Codex OAuth 明确支持外部工具/工作流（如 OpenClaw）使用。

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [{ id: "gpt-5.4", contextTokens: 160000 }],
      },
    },
  },
}
```

### 其他订阅式托管选项

- [Qwen Cloud](/providers/qwen)：Qwen Cloud provider 表面加 Alibaba DashScope 和 Coding Plan 端点映射
- [MiniMax](/providers/minimax)：MiniMax Coding Plan OAuth 或 API key 访问
- [GLM Models](/providers/glm)：Z.AI Coding Plan 或通用 API 端点

### OpenCode

- Auth: `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）
- Zen runtime provider: `opencode`
- Go runtime provider: `opencode-go`
- 示例 models: `opencode/claude-opus-4-6`、`opencode-go/kimi-k2.5`
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
- 兼容性：使用 `google/gemini-3.1-flash-preview` 的传统 OpenClaw 配置被规范化为 `google/gemini-3-flash-preview`
- CLI: `openclaw onboard --auth-choice gemini-api-key`
- 直接 Gemini 运行还接受 `agents.defaults.models["google/<model>"].params.cachedContent`（或旧版 `cached_content`）来转发 provider 原生 `cachedContents/...` 句柄；Gemini 缓存命中显示为 OpenClaw `cacheRead`

### Google Vertex 和 Gemini CLI

- Providers: `google-vertex`、`google-gemini-cli`
- Auth: Vertex 使用 gcloud ADC；Gemini CLI 使用其 OAuth 流程
- 注意：OpenClaw 中的 Gemini CLI OAuth 是非官方集成。一些用户报告说在使用第三方客户端后 Google 账户受到限制。查看 Google 条款，如果你选择继续，请使用非关键账户。
- Gemini CLI OAuth 作为捆绑的 `google` plugin 的一部分提供。
  - 首先安装 Gemini CLI：
    - `brew install gemini-cli`
    - 或 `npm install -g @google/gemini-cli`
  - 启用: `openclaw plugins enable google`
  - 登录: `openclaw models auth login --provider google-gemini-cli --set-default`
  - 默认 model: `google-gemini-cli/gemini-3-flash-preview`
  - 注意：你**不**将 client id 或 secret 粘贴到 `openclaw.json` 中。CLI 登录流程将令牌存储在 gateway 主机上的 auth profiles 中。
  - 如果登录后请求失败，在 gateway 主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID`。
  - Gemini CLI JSON 回复从 `response` 解析；usage 回退到 `stats`，`stats.cached` 规范化为 OpenClaw `cacheRead`。

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
- 示例 model: `vercel-ai-gateway/anthropic/claude-opus-4.6`
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

- OpenRouter: `openrouter`（`OPENROUTER_API_KEY`）
- 示例 model: `openrouter/auto`
- OpenClaw 仅在请求实际指向 `openrouter.ai` 时应用 OpenRouter 的记录应用归属 headers
- OpenRouter 特定的 Anthropic `cache_control` 标记同样仅限于经过验证的 OpenRouter 路由，而非任意代理 URL
- OpenRouter 保留在代理式 OpenAI 兼容路径上，因此原生 OpenAI 专用请求整形（`serviceTier`、Responses `store`、prompt-cache 提示、OpenAI reasoning-compat payloads）不会转发
- Gemini 支持的 OpenRouter refs 仅保留代理 Gemini thought-signature 清理；原生 Gemini 重放验证和 bootstrap 重写保持关闭
- Kilo Gateway: `kilocode`（`KILOCODE_API_KEY`）
- 示例 model: `kilocode/kilo/auto`
- Gemini 支持的 Kilo refs 保留相同的代理 Gemini thought-signature 清理路径；`kilocode/kilo/auto` 和其他代理 reasoning 不支持的提示跳过代理 reasoning 注入
- MiniMax: `minimax`（API key）和 `minimax-portal`（OAuth）
- Auth: `MINIMAX_API_KEY` 用于 `minimax`；`MINIMAX_OAUTH_TOKEN` 或 `MINIMAX_API_KEY` 用于 `minimax-portal`
- 示例 model: `minimax/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7`
- MiniMax onboarding/API-key 设置写入带有 `input: ["text", "image"]` 的显式 M2.7 model 定义；捆绑的 provider catalog 在 provider config 实体化之前保持聊天 refs 仅文本
- Moonshot: `moonshot`（`MOONSHOT_API_KEY`）
- 示例 model: `moonshot/kimi-k2.5`
- Kimi Coding: `kimi`（`KIMI_API_KEY` 或 `KIMICODE_API_KEY`）
- 示例 model: `kimi/kimi-code`
- Qianfan: `qianfan`（`QIANFAN_API_KEY`）
- 示例 model: `qianfan/deepseek-v3.2`
- Qwen Cloud: `qwen`（`QWEN_API_KEY`、`MODELSTUDIO_API_KEY` 或 `DASHSCOPE_API_KEY`）
- 示例 model: `qwen/qwen3.5-plus`
- NVIDIA: `nvidia`（`NVIDIA_API_KEY`）
- 示例 model: `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`
- StepFun: `stepfun` / `stepfun-plan`（`STEPFUN_API_KEY`）
- 示例 models: `stepfun/step-3.5-flash`、`stepfun-plan/step-3.5-flash-2603`
- Together: `together`（`TOGETHER_API_KEY`）
- 示例 model: `together/moonshotai/Kimi-K2.5`
- Venice: `venice`（`VENICE_API_KEY`）
- Xiaomi: `xiaomi`（`XIAOMI_API_KEY`）
- 示例 model: `xiaomi/mimo-v2-flash`
- Vercel AI Gateway: `vercel-ai-gateway`（`AI_GATEWAY_API_KEY`）
- Hugging Face Inference: `huggingface`（`HUGGINGFACE_HUB_TOKEN` 或 `HF_TOKEN`）
- Cloudflare AI Gateway: `cloudflare-ai-gateway`（`CLOUDFLARE_AI_GATEWAY_API_KEY`）
- Volcengine: `volcengine`（`VOLCANO_ENGINE_API_KEY`）
- 示例 model: `volcengine-plan/ark-code-latest`
- BytePlus: `byteplus`（`BYTEPLUS_API_KEY`）
- 示例 model: `byteplus-plan/ark-code-latest`
- xAI: `xai`（`XAI_API_KEY`）
  - 原生捆绑的 xAI 请求使用 xAI Responses 路径
  - `/fast` 或 `params.fastMode: true` 将 `grok-3`、`grok-3-mini`、`grok-4` 和 `grok-4-0709` 重写为其 `*-fast` 变体
  - `tool_stream` 默认开启；将 `agents.defaults.models["xai/<model>"].params.tool_stream` 设为 `false` 可禁用
- Mistral: `mistral`（`MISTRAL_API_KEY`）
- 示例 model: `mistral/mistral-large-latest`
- CLI: `openclaw onboard --auth-choice mistral-api-key`
- Groq: `groq`（`GROQ_API_KEY`）
- Cerebras: `cerebras`（`CEREBRAS_API_KEY`）
  - Cerebras 上的 GLM models 使用 ids `zai-glm-4.7` 和 `zai-glm-4.6`。
  - OpenAI 兼容 base URL: `https://api.cerebras.ai/v1`。
- GitHub Copilot: `github-copilot`（`COPILOT_GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_TOKEN`）
- Hugging Face Inference 示例 model: `huggingface/deepseek-ai/DeepSeek-R1`；CLI: `openclaw onboard --auth-choice huggingface-api-key`。参见 [Hugging Face (Inference)](/providers/huggingface)。

## 通过 `models.providers` 配置的 providers（自定义/base URL）

使用 `models.providers`（或 `models.json`）添加**自定义** providers 或 OpenAI/Anthropic 兼容代理。

下面许多捆绑的 provider plugins 已经发布了默认 catalog。仅当你想覆盖默认 base URL、headers 或 model 列表时，才使用显式的 `models.providers.<id>` 条目。

### Moonshot AI (Kimi)

Moonshot 作为捆绑的 provider plugin 提供。默认使用内置 provider，仅当你需要覆盖 base URL 或 model 元数据时才添加显式 `models.providers.moonshot` 条目：

- Provider: `moonshot`
- Auth: `MOONSHOT_API_KEY`
- 示例 model: `moonshot/kimi-k2.5`
- CLI: `openclaw onboard --auth-choice moonshot-api-key` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`

Kimi K2 model IDs：

[//]: # "moonshot-kimi-k2-model-refs:start"

- `moonshot/kimi-k2.5`
- `moonshot/kimi-k2-thinking`
- `moonshot/kimi-k2-thinking-turbo`
- `moonshot/kimi-k2-turbo`

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

可用 models：

- `volcengine/doubao-seed-1-8-251228`（Doubao Seed 1.8）
- `volcengine/doubao-seed-code-preview-251028`
- `volcengine/kimi-k2-5-260127`（Kimi K2.5）
- `volcengine/glm-4-7-251222`（GLM 4.7）
- `volcengine/deepseek-v3-2-251201`（DeepSeek V3.2 128K）

编码 models（`volcengine-plan`）：

- `volcengine-plan/ark-code-latest`
- `volcengine-plan/doubao-seed-code`
- `volcengine-plan/kimi-k2.5`
- `volcengine-plan/kimi-k2-thinking`
- `volcengine-plan/glm-4.7`

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

可用 models：

- `byteplus/seed-1-8-251228`（Seed 1.8）
- `byteplus/kimi-k2-5-260127`（Kimi K2.5）
- `byteplus/glm-4-7-251222`（GLM 4.7）

编码 models（`byteplus-plan`）：

- `byteplus-plan/ark-code-latest`
- `byteplus-plan/doubao-seed-code`
- `byteplus-plan/kimi-k2.5`
- `byteplus-plan/kimi-k2-thinking`
- `byteplus-plan/glm-4.7`

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

在 MiniMax 的 Anthropic 兼容 streaming 路径上，OpenClaw 默认禁用 thinking，除非你明确设置它；`/fast on` 将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。

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

OpenClaw 使用 LM Studio 的原生 `/api/v1/models` 和 `/api/v1/models/load` 进行发现 + 自动加载，默认使用 `/v1/chat/completions` 进行推理。
参见 [/providers/lmstudio](/providers/lmstudio) 了解设置和故障排除。

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

注意：

- 对于自定义 providers，`reasoning`、`input`、`cost`、`contextWindow` 和 `maxTokens` 是可选的。
  省略时，OpenClaw 默认为：
  - `reasoning: false`
  - `input: ["text"]`
  - `cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }`
  - `contextWindow: 200000`
  - `maxTokens: 8192`
- 建议：设置与你的 proxy/model 限制匹配的显式值。
- 对于非原生端点上的 `api: "openai-completions"`（任何主机不是 `api.openai.com` 的非空 `baseUrl`），OpenClaw 强制 `compat.supportsDeveloperRole: false` 以避免不支持的 `developer` 角色导致的 provider 400 错误。
- 代理式 OpenAI 兼容路由还跳过原生 OpenAI 专用请求整形：无 `service_tier`、无 Responses `store`、无 prompt-cache 提示、无 OpenAI reasoning-compat payload 整形，也无隐藏的 OpenClaw 归属 headers。
- 如果 `baseUrl` 为空/省略，OpenClaw 保持默认 OpenAI 行为（解析为 `api.openai.com`）。
- 为了安全起见，在非原生 `openai-completions` 端点上，显式的 `compat.supportsDeveloperRole: true` 仍然会被覆盖。

## CLI 示例

```bash
openclaw onboard --auth-choice opencode-zen
openclaw models set opencode/claude-opus-4-6
openclaw models list
```

另请参见：[/gateway/configuration](/gateway/configuration) 了解完整的配置示例。

## 相关

- [Models](/concepts/models) — model 配置和别名
- [Model Failover](/concepts/model-failover) — fallback 链和重试行为
- [Configuration Reference](/gateway/configuration-reference#agent-defaults) — model 配置键
- [Providers](/providers) — 每个 provider 的设置指南
