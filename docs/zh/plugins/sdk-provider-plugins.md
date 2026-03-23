---
mmh3_hash: "6c2902ee7e7ed3843cc889c7ec67d42f"
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

## 演练

<Steps>
  <Step title="包和清单">
    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-ai",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "providers": ["acme-ai"]
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

    清单声明 `providerAuthEnvVars`，这样 OpenClaw 可以在不加载 Plugin 运行时的情况下检测凭证。

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

  </Step>

  <Step title="添加动态模型解析">
    如果您的 Provider 接受任意模型 ID（如代理或路由器），请添加 `resolveDynamicModel`：

    ```typescript
    api.registerProvider({
      // ... id, label, auth, catalog

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

  </Step>

  <Step title="按需添加运行时 Hook">
    大多数 Provider 只需要 `catalog` + `resolveDynamicModel`。根据您的 Provider 需求逐步添加 Hook。

    <Tabs>
      <Tab title="令牌交换">
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
        ```typescript
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
      <Tab title="使用量和计费">
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

    完整的可用 Provider Hook 列表请参见 [内部架构：Provider 运行时 Hook](/plugins/architecture#provider-runtime-hooks)。

  </Step>

  <Step title="添加额外能力（可选）">
    Provider Plugin 可以在文本推理旁边注册语音、媒体理解、图像生成和 Web 搜索：

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

      api.registerMediaUnderstandingProvider({
        id: "acme-ai",
        capabilities: ["image", "audio"],
        describeImage: async (req) => ({ text: "A photo of..." }),
        transcribeAudio: async (req) => ({ text: "Transcript..." }),
      });
    }
    ```

    OpenClaw 将此分类为 **hybrid-capability** Plugin。这是公司 Plugin 的推荐模式（每个厂商一个 Plugin）。

  </Step>

  <Step title="测试">
    ```typescript src/provider.test.ts
    import { describe, it, expect } from "vitest";
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
    });
    ```

  </Step>
</Steps>

## 文件结构

```
extensions/acme-ai/
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
