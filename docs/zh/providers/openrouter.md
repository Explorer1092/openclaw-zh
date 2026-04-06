---
mmh3_hash: "50efa09a118e40c55c4b95ae5bce5f07"
title: "OpenRouter"
sidebarTitle: "OpenRouter"
summary: "在 OpenClaw 中使用 OpenRouter 的统一 API 访问多种模型"
read_when:
  - 您想要用一个 API 密钥访问多种 LLM
  - 您想通过 OpenRouter 在 OpenClaw 中运行模型
---

# OpenRouter

OpenRouter 提供**统一 API**，通过单一端点和 API 密钥将请求路由到多种模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换 Base URL 即可工作。

## CLI 设置

```bash
openclaw onboard --auth-choice openrouter-api-key
```

## 配置片段

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## 注意事项

- 模型引用为 `openrouter/<provider>/<model>`。
- 入门默认为 `openrouter/auto`。稍后使用 `openclaw models set openrouter/<provider>/<model>` 切换到具体模型。
- 有关更多模型/Provider 选项，请参见 [/concepts/model-providers](/concepts/model-providers)。
- OpenRouter 在底层使用 Bearer 令牌和您的 API 密钥。
- 在真实的 OpenRouter 请求（`https://openrouter.ai/api/v1`）上，OpenClaw 还会添加 OpenRouter 记录的应用归因标头：`HTTP-Referer: https://openclaw.ai`、`X-OpenRouter-Title: OpenClaw` 和 `X-OpenRouter-Categories: cli-agent`。
- 在验证的 OpenRouter 路由上，Anthropic 模型引用也保留 OpenRouter 特定的 Anthropic `cache_control` 标记，OpenClaw 使用这些标记在系统/开发者提示块上实现更好的提示缓存复用。
- 如果您将 OpenRouter Provider 重新指向其他代理/Base URL，OpenClaw 不会注入这些 OpenRouter 特定标头或 Anthropic 缓存标记。
- OpenRouter 仍然通过代理样式的 OpenAI 兼容路径运行，因此原生 OpenAI 独有的请求塑形如 `serviceTier`、Responses `store`、OpenAI 推理兼容负载和提示缓存提示不会被转发。
- Gemini 支持的 OpenRouter 引用保持在代理 Gemini 路径上：OpenClaw 在那里保持 Gemini 思维签名清理，但不启用原生 Gemini 回放验证或引导重写。
- 在支持的非 `auto` 路由上，OpenClaw 将所选思考级别映射到 OpenRouter 代理推理负载。不支持的模型提示和 `openrouter/auto` 跳过该推理注入。
- 如果您在模型参数下传递 OpenRouter Provider 路由，OpenClaw 在共享流包装器运行之前将其转发为 OpenRouter 路由元数据。
