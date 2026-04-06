---
mmh3_hash: "9565ae97a3c6d41426f92185bebda400"
title: "Kilo Gateway"
summary: "在 OpenClaw 中使用 Kilo Gateway 的统一 API 访问多种模型"
read_when:
  - 您希望用一个 API 密钥访问多种 LLM
  - 您想通过 Kilo Gateway 在 OpenClaw 中运行模型
---

# Kilo Gateway

Kilo Gateway 提供**统一 API**，通过单一端点和 API 密钥将请求路由到多种模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换 Base URL 即可工作。

## 获取 API 密钥

1. 访问 [app.kilo.ai](https://app.kilo.ai)
2. 登录或创建账户
3. 导航到 API Keys 并生成新密钥

## CLI 设置

```bash
openclaw onboard --auth-choice kilocode-api-key
```

或设置环境变量：

```bash
export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
```

## 配置片段

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

## 默认模型

默认模型是 `kilocode/kilo/auto`，这是由 Kilo Gateway 管理的 Provider 自有智能路由模型。

OpenClaw 将 `kilocode/kilo/auto` 视为稳定的默认引用，但不发布该路由的任务到上游模型的映射。

## 可用模型

OpenClaw 在启动时从 Kilo Gateway 动态发现可用模型。使用 `/models kilocode` 查看您账户可用的完整模型列表。

Gateway 上可用的任何模型都可以使用 `kilocode/` 前缀：

```
kilocode/kilo/auto              （默认 - 智能路由）
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.4
kilocode/google/gemini-3-pro-preview
...以及更多
```

## 注意事项

- 模型引用为 `kilocode/<model-id>`（例如，`kilocode/anthropic/claude-sonnet-4`）。
- 默认模型：`kilocode/kilo/auto`
- Base URL：`https://api.kilo.ai/api/gateway/`
- 内置回退目录始终包含 `kilocode/kilo/auto`（`Kilo Auto`），具有 `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000` 和 `maxTokens: 128000`
- 启动时，OpenClaw 尝试 `GET https://api.kilo.ai/api/gateway/models` 并将发现的模型合并到静态回退目录之前
- `kilocode/kilo/auto` 背后的确切上游路由由 Kilo Gateway 拥有，未在 OpenClaw 中硬编码
- Kilo Gateway 在源码中记录为与 OpenRouter 兼容，因此它保持代理样式的 OpenAI 兼容路径，而不是原生 OpenAI 请求塑形
- Gemini 支持的 Kilo 引用保持在代理 Gemini 路径上，因此 OpenClaw 在那里保持 Gemini 思维签名清理，而不启用原生 Gemini 回放验证或引导重写。
- Kilo 的共享流包装器为支持的具体模型引用添加 Provider 应用标头并规范化代理推理负载。`kilocode/kilo/auto` 和其他代理推理不支持的提示会跳过该推理注入。
- 有关更多模型/Provider 选项，请参见 [/concepts/model-providers](/concepts/model-providers)。
- Kilo Gateway 在底层使用 Bearer 令牌和您的 API 密钥。
