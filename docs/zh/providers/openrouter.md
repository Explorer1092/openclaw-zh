---
summary: "使用 OpenRouter 的统一 API 在 OpenClaw 中访问多个模型"
read_when:
  - 您想为多个 LLM 使用单个 API 密钥
  - 您想通过 OpenRouter 在 OpenClaw 中运行模型
---
# OpenRouter

OpenRouter 提供**统一 API**,将请求路由到单个端点和 API 密钥后面的多个模型。它与 OpenAI 兼容,因此大多数 OpenAI SDK 通过切换基础 URL 即可工作。

## CLI 设置

```bash
openclaw onboard --auth-choice apiKey --token-provider openrouter --token "$OPENROUTER_API_KEY"
```

## 配置片段

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/anthropic/claude-sonnet-4-5" }
    }
  }
}
```

## 注意事项

- 模型引用为 `openrouter/<provider>/<model>`。
- 有关更多模型/提供商选项,请参见 [/concepts/model-providers](/concepts/model-providers)。
- OpenRouter 在底层使用带有您的 API 密钥的 Bearer 令牌。
<\!-- source-hash: b1f5893a5fbcb31135629f5013f92a52 -->
