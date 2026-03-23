---
title: "Xiaomi MiMo"
mmh3_hash: "46c4d22a19255b810cc7a78abea5a196"
summary: "将 Xiaomi MiMo 模型与 OpenClaw 一起使用"
read_when:
  - 您想在 OpenClaw 中使用 Xiaomi MiMo 模型
  - 您需要 XIAOMI_API_KEY 设置
---

# Xiaomi MiMo

Xiaomi MiMo 是 **MiMo** 模型的 API 平台。OpenClaw 使用 Xiaomi OpenAI 兼容端点和 API 密钥身份验证。在 [Xiaomi MiMo 控制台](https://platform.xiaomimimo.com/#/console/api-keys)中创建您的 API 密钥，然后使用该密钥配置内置的 `xiaomi` Provider。

## 模型概述

- **mimo-v2-flash**：默认文本模型，262144 Token 上下文窗口
- **mimo-v2-pro**：推理文本模型，1048576 Token 上下文窗口
- **mimo-v2-omni**：支持文本和图像输入的推理多模态模型，262144 Token 上下文窗口
- Base URL：`https://api.xiaomimimo.com/v1`
- API：`openai-completions`
- 授权：`Bearer $XIAOMI_API_KEY`

## CLI 设置

```bash
openclaw onboard --auth-choice xiaomi-api-key
# 或非交互式
openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
```

## 配置片段

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

## 注意事项

- 默认模型引用：`xiaomi/mimo-v2-flash`。
- 其他内置模型：`xiaomi/mimo-v2-pro`、`xiaomi/mimo-v2-omni`。
- 当设置 `XIAOMI_API_KEY`（或存在身份验证配置文件）时，Provider 会自动注入。
- 有关 Provider 规则，请参见 [/concepts/model-providers](/concepts/model-providers)。
