---
mmh3_hash: "dc7076ba4946138ff2a43292b14c3fe8"
title: "构建 Provider Plugin"
sidebarTitle: "Provider Plugin"
summary: "构建 OpenClaw 模型 Provider Plugin 的分步指南"
read_when:
  - 您正在构建新的模型 Provider Plugin
  - 您想向 OpenClaw 添加 OpenAI 兼容代理或自定义 LLM
  - 您需要了解 Provider 身份验证、目录和运行时 Hook
---

# 构建 Provider Plugin

本指南演示如何构建向 OpenClaw 添加模型 Provider (LLM) 的 Provider Plugin。完成后，您将拥有一个具有模型目录、API 密钥身份验证和动态模型解析的 Provider。

<Info>
  如果您之前没有构建过任何 OpenClaw Plugin，请先阅读
  [入门指南](/plugins/building-plugins) 了解基本包结构和清单设置。
</Info>

<Tip>
  Provider Plugin 将模型添加到 OpenClaw 的正常推理循环。如果模型必须通过拥有线程、压缩或 Tool 事件的原生 Agent 守护进程运行，请将 Provider 与 [agent harness](/plugins/sdk-agent-harness) 配对，而不是将守护进程协议详情放入核心。
</Tip>

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"],
        "compat": {
          "pluginApi": ">=2026.3.24-beta.2",
          "minGatewayVersion": "2026.3.24-beta.2"
        },
        "build": {
          "openclawVersion": "2026.3.24-beta.2",
          "pluginSdkVersion": "2026.3.24-beta.2"
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-ai",
      "name": "Acme AI",
      "description": "Acme AI model provider",
      "providers": ["acme-ai"],
      "modelSupport": {
        "modelPrefixes": ["acme-"]
      },
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
      },
      "providerAuthAliases": {
        "acme-ai-coding": "acme-ai"
      },
      "providerAuthChoices": [
        {
          "provider": "acme-ai",
          "method": "api-key",
          "choiceId": "acme-ai-api-key",
          "choiceLabel": "Acme AI API key",
          "groupId": "acme-ai",
          "groupLabel": "Acme AI",
          "cliFlag": "--acme-ai-api-key",
          "cliOption": "--acme-ai-api-key <key>",
          "cliDescription": "Acme AI API key"
        }
      ],
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    清单声明 `providerAuthEnvVars`，这样 OpenClaw 可以在不加载 Plugin 运行时的情况下检测凭证。当 Provider 变体应该复用另一个 Provider id 的认证时，添加 `providerAuthAliases`。`modelSupport` 是可选的，让 OpenClaw 在运行时 Hook 存在之前就能从简写模型 id（如 `acme-large`）自动加载您的 Provider Plugin。如果您在 ClawHub 上发布 Provider，`package.json` 中的 `openclaw.compat` 和 `openclaw.build` 字段是必需的。

  </Step>

  <Step title="注册 Provider">
    最小 Provider 需要 `id`、`label`、`auth` 和 `catalog`：

    ```typescript index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { createProviderApiKeyAuthMethod } from "openclaw/plugin-sdk/provider-auth";

    export default definePluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      register(api) {
        api.registerProvider({
          id: "acme-ai",
          label: "Acme AI",
          docsPath: "/providers/acme-ai",
          envVars: ["ACME_AI_API_KEY"],

          auth: [
            createProviderApiKeyAuthMethod({
              providerId: "acme-ai",
              methodId: "api-key",
              label: "Acme AI API key",
              hint: "API key from your Acme AI dashboard",
              optionKey: "acmeAiApiKey",
              flagName: "--acme-ai-api-key",
              envVar: "ACME_AI_API_KEY",
              promptMessage: "Enter your Acme AI API key",
              defaultModel: "acme-ai/acme-large",
            }),
          ],

          catalog: {
            order: "simple",
            run: async (ctx) => {
              const apiKey =
                ctx.resolveProviderApiKey("acme-ai").apiKey;
              if (!apiKey) return null;
              return {
                provider: {
                  baseUrl: "https://api.acme-ai.com/v1",
                  apiKey,
                  api: "openai-completions",
                  models: [
                    {
                      id: "acme-large",
                      name: "Acme Large",
                      reasoning: true,
                      input: ["text", "image"],
                      cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
                      contextWindow: 200000,
                      maxTokens: 32768,
                    },
                    {
                      id: "acme-small",
                      name: "Acme Small",
                      reasoning: false,
                      input: ["text"],
                      cost: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
                      contextWindow: 128000,
                      maxTokens: 8192,
                    },
                  ],
                },
              };
            },
          },
        });
      },
    });
    ```

    这是一个可工作的 Provider。用户现在可以使用 `openclaw onboard --acme-ai-api-key <key>` 并选择 `acme-ai/acme-large` 作为模型。

    如果上游 Provider 使用与 OpenClaw 不同的控制令牌，添加一个小型双向文本转换，而不是替换流路径：

    ```typescript
    api.registerTextTransforms({
      input: [
        { from: /red basket/g, to: "blue basket" },
        { from: /paper ticket/g, to: "digital ticket" },
        { from: /left shelf/g, to: "right shelf" },
      ],
      output: [
        { from: /blue basket/g, to: "red basket" },
        { from: /digital ticket/g, to: "paper ticket" },
        { from: /right shelf/g, to: "left shelf" },
      ],
    });
    ```

    `input` 在传输前重写最终系统 Prompt 和文本消息内容。`output` 在 OpenClaw 解析自己的控制标记或 Channel 交付之前重写助手文本增量和最终文本。

    对于只注册一个带 API 密钥认证和单一目录支持运行时的文本 Provider 的捆绑 Provider，优先使用更窄的 `defineSingleProviderPluginEntry(...)` 辅助工具：

    ```typescript
    import { defineSingleProviderPluginEntry } from "openclaw/plugin-sdk/provider-entry";

    export default defineSingleProviderPluginEntry({
      id: "acme-ai",
      name: "Acme AI",
      description: "Acme AI model provider",
      provider: {
        label: "Acme AI",
        docsPath: "/providers/acme-ai",
        auth: [
          {
            methodId: "api-key",
            label: "Acme AI API key",
            hint: "API key from your Acme AI dashboard",
            optionKey: "acmeAiApiKey",
            flagName: "--acme-ai-api-key",
            envVar: "ACME_AI_API_KEY",
            promptMessage: "Enter your Acme AI API key",
            defaultModel: "acme-ai/acme-large",
          },
        ],
        catalog: {
          buildProvider: () => ({
            api: "openai-completions",
            baseUrl: "https://api.acme-ai.com/v1",
            models: [{ id: "acme-large", name: "Acme Large" }],
          }),
        },
      },
    });
    ```

    如果您的认证流程还需要在入门期间修补 `models.providers.*`、别名和 Agent 默认模型，请使用来自 `openclaw/plugin-sdk/provider-onboard` 的预设辅助工具。最窄的辅助工具是 `createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)` 和 `createModelCatalogPresetAppliers(...)`。

    当 Provider 的原生端点支持在普通 `openai-completions` 传输上使用流式使用块时，优先使用来自 `openclaw/plugin-sdk/provider-catalog-shared` 的共享目录辅助工具，而不是硬编码 Provider id 检查。`supportsNativeStreamingUsageCompat(...)` 和 `applyProviderNativeStreamingUsageCompat(...)` 从端点能力映射中检测支持，因此即使 Plugin 使用自定义 Provider id，原生 Moonshot/DashScope 风格的端点仍然可以加入。

  </Step>

  <Step title="添加动态模型解析">
    如果您的 Provider 接受任意模型 ID（如代理或路由器），请添加 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog（来自上方）

      resolveDynamicModel: (ctx) => ({
        id: ctx.modelId,
        name: ctx.modelId,
        provider: "acme-ai",
        api: "openai-completions",
        baseUrl: "https://api.acme-ai.com/v1",
        reasoning: false,
        input: ["text"],
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128000,
        maxTokens: 8192,
      }),
    });
    ```

    如果解析需要网络调用，使用 `prepareDynamicModel` 进行异步预热 — `resolveDynamicModel` 在其完成后再次运行。

  </Step>

  <Step title="按需添加运行时 Hook">
    大多数 Provider 只需要 `catalog` + `resolveDynamicModel`。根据您的 Provider 需求逐步添加 Hook。

    共享辅助工具构建器现在涵盖最常见的重播/工具兼容家族，因此 Plugin 通常不需要逐一手动连接每个 Hook：

    ```typescript
    import { buildProviderReplayFamilyHooks } from "openclaw/plugin-sdk/provider-model-shared";
    import { buildProviderStreamFamilyHooks } from "openclaw/plugin-sdk/provider-stream";
    import { buildProviderToolCompatFamilyHooks } from "openclaw/plugin-sdk/provider-tools";

    const GOOGLE_FAMILY_HOOKS = {
      ...buildProviderReplayFamilyHooks({ family: "google-gemini" }),
      ...buildProviderStreamFamilyHooks("google-thinking"),
      ...buildProviderToolCompatFamilyHooks("gemini"),
    };

    api.registerProvider({
      id: "acme-gemini-compatible",
      // ...
      ...GOOGLE_FAMILY_HOOKS,
    });
    ```

    当前可用的重播家族：

    | 家族 | 连接内容 |
    | --- | --- |
    | `openai-compatible` | 共享 OpenAI 风格重播策略，用于 OpenAI 兼容传输，包括 Tool 调用 ID 消毒、助手优先排序修复，以及传输需要时的通用 Gemini 轮次验证 |
    | `anthropic-by-model` | 由 `modelId` 选择的 Claude 感知重播策略，因此仅当解析的模型确实是 Claude id 时，Anthropic 消息传输才会进行 Claude 特定的思维块清理 |
    | `google-gemini` | 原生 Gemini 重播策略加上引导重播消毒和标记推理输出模式 |
    | `passthrough-gemini` | 通过 OpenAI 兼容代理传输运行的 Gemini 模型的 Gemini 思想签名消毒；不启用原生 Gemini 重播验证或引导重写 |
    | `hybrid-anthropic-openai` | 用于在一个 Plugin 中混合 Anthropic 消息和 OpenAI 兼容模型界面的 Provider 的混合策略；可选的仅 Claude 思维块删除范围限定在 Anthropic 侧 |

    真实捆绑示例：

    - `google` 和 `google-gemini-cli`：`google-gemini`
    - `openrouter`、`kilocode`、`opencode` 和 `opencode-go`：`passthrough-gemini`
    - `amazon-bedrock` 和 `anthropic-vertex`：`anthropic-by-model`
    - `minimax`：`hybrid-anthropic-openai`
    - `moonshot`、`ollama`、`xai` 和 `zai`：`openai-compatible`

    当前可用的流家族：

    | 家族 | 连接内容 |
    | --- | --- |
    | `google-thinking` | 共享流路径上的 Gemini 思维有效载荷规范化 |
    | `kilocode-thinking` | 共享代理流路径上的 Kilo 推理包装器，`kilo/auto` 和不支持的代理推理 id 跳过注入的思维 |
    | `moonshot-thinking` | 来自配置 + `/think` 级别的 Moonshot 二进制原生思维有效载荷映射 |
    | `minimax-fast-mode` | 共享流路径上的 MiniMax 快速模式模型重写 |
    | `openai-responses-defaults` | 共享原生 OpenAI/Codex Responses 包装器：归因标头、`/fast`/`serviceTier`、文本详细度、原生 Codex Web 搜索、推理兼容有效载荷整形和 Responses 上下文管理 |
    | `openrouter-thinking` | 代理路由的 OpenRouter 推理包装器，不支持的模型/`auto` 跳过在中央处理 |
    | `tool-stream-default-on` | 用于 Z.AI 等希望工具流除非显式禁用否则默认开启的 Provider 的默认开启 `tool_stream` 包装器 |

    真实捆绑示例：

    - `google` 和 `google-gemini-cli`：`google-thinking`
    - `kilocode`：`kilocode-thinking`
    - `moonshot`：`moonshot-thinking`
    - `minimax` 和 `minimax-portal`：`minimax-fast-mode`
    - `openai` 和 `openai-codex`：`openai-responses-defaults`
    - `openrouter`：`openrouter-thinking`
    - `zai`：`tool-stream-default-on`

    `openclaw/plugin-sdk/provider-model-shared` 还导出重播家族枚举以及这些家族所基于的共享辅助工具。常用公共导出包括：

    - `ProviderReplayFamily`
    - `buildProviderReplayFamilyHooks(...)`
    - 共享重播构建器，如 `buildOpenAICompatibleReplayPolicy(...)`、`buildAnthropicReplayPolicyForModel(...)`、`buildGoogleGeminiReplayPolicy(...)` 和 `buildHybridAnthropicOrOpenAIReplayPolicy(...)`
    - Gemini 重播辅助工具，如 `sanitizeGoogleGeminiReplayHistory(...)` 和 `resolveTaggedReasoningOutputMode()`
    - 端点/模型辅助工具，如 `resolveProviderEndpoint(...)`、`normalizeProviderId(...)`、`normalizeGooglePreviewModelId(...)` 和 `normalizeNativeXaiModelId(...)`

    `openclaw/plugin-sdk/provider-stream` 暴露了家族构建器以及这些家族复用的公共包装辅助工具。常用公共导出包括：

    - `ProviderStreamFamily`
    - `buildProviderStreamFamilyHooks(...)`
    - `composeProviderStreamWrappers(...)`
    - 共享 OpenAI/Codex 包装器，如 `createOpenAIAttributionHeadersWrapper(...)`、`createOpenAIFastModeWrapper(...)`、`createOpenAIServiceTierWrapper(...)`、`createOpenAIResponsesContextManagementWrapper(...)` 和 `createCodexNativeWebSearchWrapper(...)`
    - 共享代理/Provider 包装器，如 `createOpenRouterWrapper(...)`、`createToolStreamWrapper(...)` 和 `createMinimaxFastModeWrapper(...)`

    一些流辅助工具有意保留在 Provider 本地。当前捆绑示例：`@openclaw/anthropic-provider` 从其公共 `api.ts` / `contract-api.ts` 接缝导出 `wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier` 和底层 Anthropic 包装构建器。这些辅助工具保持 Anthropic 特定，因为它们还编码了 Claude OAuth beta 处理和 `context1m` 门控。

    其他捆绑 Provider 也在行为无法跨家族干净共享时将传输特定的包装器保留在本地。当前示例：捆绑的 xAI Plugin 在其自己的 `wrapStreamFn` 中保留原生 xAI Responses 整形，包括 `/fast` 别名重写、默认 `tool_stream`、不支持的严格工具清理和 xAI 特定的推理有效载荷删除。

    `openclaw/plugin-sdk/provider-tools` 目前暴露一个共享工具 Schema 家族加上共享 Schema/兼容辅助工具：

    - `ProviderToolCompatFamily` 记录当前的共享家族清单。
    - `buildProviderToolCompatFamilyHooks("gemini")` 为需要 Gemini 安全工具 Schema 的 Provider 连接 Gemini Schema 清理 + 诊断。
    - `normalizeGeminiToolSchemas(...)` 和 `inspectGeminiToolSchemas(...)` 是底层公共 Gemini Schema 辅助工具。
    - `resolveXaiModelCompatPatch()` 返回捆绑的 xAI 兼容补丁：`toolSchemaProfile: "xai"`、不支持的 Schema 关键字、原生 `web_search` 支持和 HTML 实体工具调用参数解码。
    - `applyXaiModelCompat(model)` 在解析的模型到达运行器之前应用相同的 xAI 兼容补丁。

    真实捆绑示例：xAI Plugin 使用 `normalizeResolvedModel` 加上 `contributeResolvedModelCompat` 让该兼容元数据由 Provider 拥有，而不是在核心中硬编码 xAI 规则。

    同样的包根模式也支持其他捆绑 Provider：

    - `@openclaw/openai-provider`：`api.ts` 导出 Provider 构建器、默认模型辅助工具和实时 Provider 构建器
    - `@openclaw/openrouter-provider`：`api.ts` 导出 Provider 构建器加上入门/配置辅助工具

    <Tabs>
      <Tab title="令牌交换">
        用于每次推理调用之前需要令牌交换的 Provider：

        ```typescript
        prepareRuntimeAuth: async (ctx) => {
          const exchanged = await exchangeToken(ctx.apiKey);
          return {
            apiKey: exchanged.token,
            baseUrl: exchanged.baseUrl,
            expiresAt: exchanged.expiresAt,
          };
        },
        ```
      </Tab>
      <Tab title="自定义标头">
        用于需要自定义请求标头或正文修改的 Provider：

        ```typescript
        // wrapStreamFn 返回从 ctx.streamFn 派生的 StreamFn
        wrapStreamFn: (ctx) => {
          if (!ctx.streamFn) return undefined;
          const inner = ctx.streamFn;
          return async (params) => {
            params.headers = {
              ...params.headers,
              "X-Acme-Version": "2",
            };
            return inner(params);
          };
        },
        ```
      </Tab>
      <Tab title="原生传输身份">
        用于在通用 HTTP 或 WebSocket 传输上需要原生请求/Session 标头或元数据的 Provider：

        ```typescript
        resolveTransportTurnState: (ctx) => ({
          headers: {
            "x-request-id": ctx.turnId,
          },
          metadata: {
            session_id: ctx.sessionId ?? "",
            turn_id: ctx.turnId,
          },
        }),
        resolveWebSocketSessionPolicy: (ctx) => ({
          headers: {
            "x-session-id": ctx.sessionId ?? "",
          },
          degradeCooldownMs: 60_000,
        }),
        ```
      </Tab>
      <Tab title="使用量和计费">
        用于暴露使用量/计费数据的 Provider：

        ```typescript
        resolveUsageAuth: async (ctx) => {
          const auth = await ctx.resolveOAuthToken();
          return auth ? { token: auth.token } : null;
        },
        fetchUsageSnapshot: async (ctx) => {
          return await fetchAcmeUsage(ctx.token, ctx.timeoutMs);
        },
        ```
      </Tab>
    </Tabs>

    <Accordion title="所有可用的 Provider Hook">
      OpenClaw 按此顺序调用 Hook。大多数 Provider 只使用 2-3 个：

      | # | Hook | 何时使用 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或基础 URL 默认值 |
      | 2 | `applyConfigDefaults` | 配置实体化期间 Provider 自有的全局默认值 |
      | 3 | `normalizeModelId` | 查找前的旧版/预览模型 ID 别名清理 |
      | 4 | `normalizeTransport` | 通用模型组装前的 Provider 家族 `api` / `baseUrl` 清理 |
      | 5 | `normalizeConfig` | 规范化 `models.providers.<id>` 配置 |
      | 6 | `applyNativeStreamingUsageCompat` | 配置 Provider 的原生流式使用兼容重写 |
      | 7 | `resolveConfigApiKey` | Provider 自有的环境标记认证解析 |
      | 8 | `resolveSyntheticAuth` | 本地/自托管或配置支持的合成认证 |
      | 9 | `shouldDeferSyntheticProfileAuth` | 将合成存储配置文件占位符置于环境/配置认证之后 |
      | 10 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 11 | `prepareDynamicModel` | 解析前的异步元数据获取 |
      | 12 | `normalizeResolvedModel` | 到达运行器前的传输重写 |

      运行时回退说明：

      - `normalizeConfig` 首先检查匹配的 Provider，然后检查其他支持 Hook 的 Provider Plugin，直到有一个实际更改了配置。如果没有 Provider Hook 重写受支持的 Google 家族配置条目，捆绑的 Google 配置规范化器仍然适用。
      - `resolveConfigApiKey` 在暴露时使用 Provider Hook。捆绑的 `amazon-bedrock` 路径在此处还有内置的 AWS 环境标记解析器，即使 Bedrock 运行时认证本身仍使用 AWS SDK 默认链。

      | 13 | `contributeResolvedModelCompat` | 在另一个兼容传输后面的厂商模型的兼容标志 |
      | 14 | `capabilities` | 旧版静态能力包；仅用于兼容性 |
      | 15 | `normalizeToolSchemas` | 注册前 Provider 自有的工具 Schema 清理 |
      | 16 | `inspectToolSchemas` | Provider 自有的工具 Schema 诊断 |
      | 17 | `resolveReasoningOutputMode` | 标记与原生推理输出契约 |
      | 18 | `prepareExtraParams` | 默认请求参数 |
      | 19 | `createStreamFn` | 完全自定义 StreamFn 传输 |
      | 20 | `wrapStreamFn` | 正常流路径上的自定义标头/正文包装器 |
      | 21 | `resolveTransportTurnState` | 原生每轮标头/元数据 |
      | 22 | `resolveWebSocketSessionPolicy` | 原生 WS Session 标头/冷却 |
      | 23 | `formatApiKey` | 自定义运行时令牌形状 |
      | 24 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 25 | `buildAuthDoctorHint` | 认证修复指导 |
      | 26 | `matchesContextOverflowError` | Provider 自有的溢出检测 |
      | 27 | `classifyFailoverReason` | Provider 自有的速率限制/过载分类 |
      | 28 | `isCacheTtlEligible` | Prompt 缓存 TTL 门控 |
      | 29 | `buildMissingAuthMessage` | 自定义缺失认证提示 |
      | 30 | `suppressBuiltInModel` | 隐藏过时的上游行 |
      | 31 | `augmentModelCatalog` | 合成前向兼容行 |
      | 32 | `isBinaryThinking` | 二进制思维开/关 |
      | 33 | `supportsXHighThinking` | `xhigh` 推理支持 |
      | 34 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略 |
      | 35 | `isModernModelRef` | 实时/冒烟模型匹配 |
      | 36 | `prepareRuntimeAuth` | 推理前的令牌交换 |
      | 37 | `resolveUsageAuth` | 自定义使用凭证解析 |
      | 38 | `fetchUsageSnapshot` | 自定义使用端点 |
      | 39 | `createEmbeddingProvider` | 用于内存/搜索的 Provider 自有嵌入适配器 |
      | 40 | `buildReplayPolicy` | 自定义对话重播/压缩策略 |
      | 41 | `sanitizeReplayHistory` | 通用清理后的 Provider 特定重播重写 |
      | 42 | `validateReplayTurns` | 嵌入运行器前的严格重播轮次验证 |
      | 43 | `onModelSelected` | 选择后回调（例如遥测） |

      Prompt 调整说明：

      - `resolveSystemPromptContribution` 让 Provider 为模型家族注入缓存感知的系统 Prompt 指导。当行为属于某个 Provider/模型家族并且应该保留稳定/动态缓存分割时，优先使用它而不是 `before_prompt_build`。

      有关详细描述和真实示例，请参见 [内部架构：Provider 运行时 Hook](/plugins/architecture#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    <a id="step-5-add-extra-capabilities"></a>
    Provider Plugin 可以在文本推理旁边注册语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索：

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM data */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
        }),
      });

      api.registerRealtimeTranscriptionProvider({
        id: "acme-ai",
        label: "Acme Realtime Transcription",
        isConfigured: () => true,
        createSession: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerRealtimeVoiceProvider({
        id: "acme-ai",
        label: "Acme Realtime Voice",
        isConfigured: ({ providerConfig }) => Boolean(providerConfig.apiKey),
        createBridge: (req) => ({
          connect: async () => {},
          sendAudio: () => {},
          setMediaTimestamp: () => {},
          submitToolResult: () => {},
          acknowledgeMark: () => {},
          close: () => {},
          isConnected: () => true,
        }),
      });

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });

      api.registerImageGenerationProvider({
        id: "acme-ai",
        label: "Acme Images",
        generate: async (req) => ({ /* image result */ }),
      });

      api.registerVideoGenerationProvider({
        id: "acme-ai",
        label: "Acme Video",
        capabilities: {
          generate: {
            maxVideos: 1,
            maxDurationSeconds: 10,
            supportsResolution: true,
          },
          imageToVideo: {
            enabled: true,
            maxVideos: 1,
            maxInputImages: 1,
            maxDurationSeconds: 5,
          },
          videoToVideo: {
            enabled: false,
          },
        },
        generateVideo: async (req) => ({ videos: [] }),
      });

      api.registerWebFetchProvider({
        id: "acme-ai-fetch",
        label: "Acme Fetch",
        hint: "Fetch pages through Acme's rendering backend.",
        envVars: ["ACME_FETCH_API_KEY"],
        placeholder: "acme-...",
        signupUrl: "https://acme.example.com/fetch",
        credentialPath: "plugins.entries.acme.config.webFetch.apiKey",
        getCredentialValue: (fetchConfig) => fetchConfig?.acme?.apiKey,
        setCredentialValue: (fetchConfigTarget, value) => {
          const acme = (fetchConfigTarget.acme ??= {});
          acme.apiKey = value;
        },
        createTool: () => ({
          description: "Fetch a page through Acme Fetch.",
          parameters: {},
          execute: async (args) => ({ content: [] }),
        }),
      });

      api.registerWebSearchProvider({
        id: "acme-ai-search",
        label: "Acme Search",
        search: async (req) => ({ content: [] }),
      });
    }
    ```

    OpenClaw 将此分类为 **hybrid-capability** Plugin。这是公司 Plugin 的推荐模式（每个厂商一个 Plugin）。请参见 [内部架构：能力所有权](/plugins/architecture#capability-ownership-model)。

    对于视频生成，优先使用上面展示的模式感知能力形状：`generate`、`imageToVideo` 和 `videoToVideo`。`maxInputImages`、`maxInputVideos` 和 `maxDurationSeconds` 等扁平聚合字段不足以干净地宣传变换模式支持或禁用的模式。

    音乐生成 Provider 应遵循相同的模式：`generate` 用于仅 Prompt 的生成，`edit` 用于基于参考图像的生成。`maxInputImages`、`supportsLyrics` 和 `supportsFormat` 等扁平聚合字段不足以宣传编辑支持；显式的 `generate` / `edit` 块是预期的契约。

  </Step>

  <Step title="测试">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // 从 index.ts 或专用文件导出您的 Provider 配置对象
    import { acmeProvider } from "./provider.js";

    describe("acme-ai provider", () => {
      it("resolves dynamic models", () => {
        const model = acmeProvider.resolveDynamicModel!({
          modelId: "acme-beta-v3",
        } as any);
        expect(model.id).toBe("acme-beta-v3");
        expect(model.provider).toBe("acme-ai");
      });

      it("returns catalog when key is available", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: "test-key" }),
        } as any);
        expect(result?.provider?.models).toHaveLength(2);
      });

      it("returns null catalog when no key", async () => {
        const result = await acmeProvider.catalog!.run({
          resolveProviderApiKey: () => ({ apiKey: undefined }),
        } as any);
        expect(result).toBeNull();
      });
    });
    ```

  </Step>
</Steps>

## 发布到 ClawHub

Provider Plugin 的发布方式与任何其他外部代码 Plugin 相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

不要在此处使用旧版仅 Skill 发布别名；Plugin 包应使用 `clawhub package publish`。

## 文件结构

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 元数据
├── openclaw.plugin.json      # 带 providerAuthEnvVars 的清单
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 测试
    └── usage.ts              # 使用端点（可选）
```

## 目录顺序参考

`catalog.order` 控制您的目录相对于内置 Provider 何时合并：

| 顺序      | 时机            | 用例                                             |
| --------- | --------------- | ------------------------------------------------ |
| `simple`  | 第一轮          | 普通 API 密钥 Provider                           |
| `profile` | simple 之后     | 以身份验证配置文件为门控的 Provider              |
| `paired`  | profile 之后    | 合成多个相关条目                                 |
| `late`    | 最后一轮        | 覆盖现有 Provider（在冲突时获胜）                |

## 后续步骤

- [Channel Plugin](/plugins/sdk-channel-plugins) — 如果您的 Plugin 还提供 Channel
- [SDK 运行时](/plugins/sdk-runtime) — `api.runtime` 辅助工具（TTS、搜索、子 Agent）
- [SDK 概览](/plugins/sdk-overview) — 完整子路径导入参考
- [Plugin 内部架构](/plugins/architecture#provider-runtime-hooks) — Hook 详情和内置示例
