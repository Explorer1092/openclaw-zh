---
mmh3_hash: "2ed09a8544faee28571e5cb0b9d3c63e"
title: 构建 Provider 插件
sidebarTitle: Provider 插件
summary: 为 OpenClaw 构建模型 Provider 插件的分步指南
read_when:
  - 你正在构建新的模型 Provider 插件
  - 你想为 OpenClaw 添加 OpenAI 兼容代理或自定义 LLM
  - 你需要了解 Provider 认证、目录和运行时 Hook
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/sdk-provider-plugins.md
  workflow: 15
---

# 构建 Provider 插件

本指南演示如何构建一个为 OpenClaw 添加模型 Provider（LLM）的 Provider 插件。完成后你将拥有一个具备模型目录、API Key 认证和动态模型解析的 Provider。

<Info>
  如果你从未构建过任何 OpenClaw 插件，请先阅读 [入门指南](/plugins/building-plugins) 了解基本的包结构和 Manifest 设置。
</Info>

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和 Manifest">
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
      "providerAuthEnvVars": {
        "acme-ai": ["ACME_AI_API_KEY"]
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

    Manifest 声明了 `providerAuthEnvVars`，这样 OpenClaw 无需加载插件运行时就能检测凭证。如果你在 ClawHub 上发布 Provider，`package.json` 中的 `openclaw.compat` 和 `openclaw.build` 字段是必需的。

  </Step>

  <Step title="注册 Provider">
    一个最小 Provider 需要 `id`、`label`、`auth` 和 `catalog`：

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

    这是一个可用的 Provider。用户现在可以 `openclaw onboard --acme-ai-api-key <key>` 并将 `acme-ai/acme-large` 选为他们的模型。

    对于只注册一个带 API Key 认证和单一目录支持运行时的文本 Provider 的捆绑 Provider，优先使用更窄的 `defineSingleProviderPluginEntry(...)` 辅助工具：

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

    如果你的认证流程还需要在引导时修改 `models.providers.*`、别名和 Agent 默认模型，请使用 `openclaw/plugin-sdk/provider-onboard` 中的预设辅助工具。最窄的辅助工具是 `createDefaultModelPresetAppliers(...)`、`createDefaultModelsPresetAppliers(...)` 和 `createModelCatalogPresetAppliers(...)`。

  </Step>

  <Step title="添加动态模型解析">
    如果你的 Provider 接受任意模型 ID（如代理或路由器），添加 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog 如上

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

    如果解析需要网络调用，使用 `prepareDynamicModel` 进行异步预热——`resolveDynamicModel` 在其完成后再次运行。

  </Step>

  <Step title="添加运行时 Hook（按需）">
    大多数 Provider 只需要 `catalog` + `resolveDynamicModel`。按需逐步添加 Hook。

    <Tabs>
      <Tab title="令牌交换">
        对于每次推理调用前需要令牌交换的 Provider：

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
      <Tab title="自定义请求头">
        对于需要自定义请求头或请求体修改的 Provider：

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
      <Tab title="用量和计费">
        对于暴露用量/计费数据的 Provider：

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

    <Accordion title="所有可用 Provider Hook">
      OpenClaw 按此顺序调用 Hook。大多数 Provider 只使用其中 2-3 个：

      | # | Hook | 何时使用 |
      | --- | --- | --- |
      | 1 | `catalog` | 模型目录或基础 URL 默认值 |
      | 2 | `resolveDynamicModel` | 接受任意上游模型 ID |
      | 3 | `prepareDynamicModel` | 解析前的异步元数据获取 |
      | 4 | `normalizeResolvedModel` | 运行器前的传输重写 |
      | 5 | `capabilities` | 转录/工具元数据（数据，不可调用） |
      | 6 | `prepareExtraParams` | 默认请求参数 |
      | 7 | `wrapStreamFn` | 自定义请求头/请求体封装 |
      | 8 | `formatApiKey` | 自定义运行时令牌形状 |
      | 9 | `refreshOAuth` | 自定义 OAuth 刷新 |
      | 10 | `buildAuthDoctorHint` | 认证修复指导 |
      | 11 | `isCacheTtlEligible` | Prompt 缓存 TTL 门控 |
      | 12 | `buildMissingAuthMessage` | 自定义缺少认证的提示 |
      | 13 | `suppressBuiltInModel` | 隐藏过时的上游行 |
      | 14 | `augmentModelCatalog` | 合成向前兼容行 |
      | 15 | `isBinaryThinking` | 二元思考开关 |
      | 16 | `supportsXHighThinking` | `xhigh` 推理支持 |
      | 17 | `resolveDefaultThinkingLevel` | 默认 `/think` 策略 |
      | 18 | `isModernModelRef` | 实时/冒烟模型匹配 |
      | 19 | `prepareRuntimeAuth` | 推理前的令牌交换 |
      | 20 | `resolveUsageAuth` | 自定义用量凭证解析 |
      | 21 | `fetchUsageSnapshot` | 自定义用量端点 |
      | 22 | `onModelSelected` | 选择后回调（如遥测） |

      详细描述和实际示例请参阅 [内部机制：Provider 运行时 Hook](/plugins/architecture#provider-runtime-hooks)。
    </Accordion>

  </Step>

  <Step title="添加额外能力（可选）">
    <a id="step-5-add-extra-capabilities"></a>
    Provider 插件可以在文本推理的基础上注册语音、媒体理解、图像生成和网络搜索：

    ```typescript
    register(api) {
      api.registerProvider({ id: "acme-ai", /* ... */ });

      api.registerSpeechProvider({
        id: "acme-ai",
        label: "Acme Speech",
        isConfigured: ({ config }) => Boolean(config.messages?.tts),
        synthesize: async (req) => ({
          audioBuffer: Buffer.from(/* PCM 数据 */),
          outputFormat: "mp3",
          fileExtension: ".mp3",
          voiceCompatible: false,
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
        generate: async (req) => ({ /* 图像结果 */ }),
      });
    }
    ```

    OpenClaw 将其分类为 **hybrid-capability** 插件。这是公司插件的推荐模式（每个供应商一个插件）。参阅 [内部机制：能力归属](/plugins/architecture#capability-ownership-model)。

  </Step>

  <Step title="测试">
    <a id="step-6-test"></a>
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
    // 从 index.ts 或专用文件导出你的 Provider 配置对象
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

Provider 插件的发布方式与其他外部代码插件相同：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

不要在这里使用旧版仅限 Skill 的发布别名；插件包应使用 `clawhub package publish`。

## 文件结构

```
<bundled-plugin-root>/acme-ai/
├── package.json              # openclaw.providers 元数据
├── openclaw.plugin.json      # 包含 providerAuthEnvVars 的 Manifest
├── index.ts                  # definePluginEntry + registerProvider
└── src/
    ├── provider.test.ts      # 测试
    └── usage.ts              # 用量端点（可选）
```

## 目录顺序参考

`catalog.order` 控制你的目录相对于内置 Provider 何时合并：

| 顺序      | 时机          | 使用场景                           |
| --------- | ------------- | ---------------------------------- |
| `simple`  | 第一轮        | 普通 API Key Provider              |
| `profile` | simple 之后   | 基于认证 Profile 门控的 Provider   |
| `paired`  | profile 之后  | 合成多个相关条目                   |
| `late`    | 最后一轮      | 覆盖现有 Provider（冲突时优先）    |

## 下一步

- [Channel 插件](/plugins/sdk-channel-plugins) — 如果你的插件同时提供 Channel
- [SDK 运行时](/plugins/sdk-runtime) — `api.runtime` 辅助工具（TTS、搜索、子 Agent）
- [SDK Overview](/plugins/sdk-overview) — 完整子路径导入参考
- [插件内部机制](/plugins/architecture#provider-runtime-hooks) — Hook 详情和捆绑示例
