---
mmh3_hash: "6899a7b14b1b6e51d915e2383a3aadcf"
summary: "在 OpenClaw 中使用 Kilo Gateway 的统一 API 访问多种模型"
read_when:
  - 您希望用一个 API 密钥访问多种 LLM
  - 您希望在 OpenClaw 中通过 Kilo Gateway 运行模型
---

# Kilo Gateway

Kilo Gateway 提供一个**统一 API**，通过单一端点和 API 密钥将请求路由到多种模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换 base URL 即可使用。

## 获取 API 密钥

1. 前往 [app.kilo.ai](https://app.kilo.ai)
2. 登录或创建账户
3. 进入 API Keys 并生成一个新密钥

## CLI 配置

```bash
openclaw onboard --kilocode-api-key <key>
```

或设置环境变量：

```bash
export KILOCODE_API_KEY="your-api-key"
```

## 配置片段

```json5
{
  env: { KILOCODE_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kilocode/anthropic/claude-opus-4.6" },
    },
  },
}
```

## 已收录的模型引用

内置 Kilo Gateway 目录目前收录以下模型引用：

- `kilocode/anthropic/claude-opus-4.6`（默认）
- `kilocode/z-ai/glm-5:free`
- `kilocode/minimax/minimax-m2.5:free`
- `kilocode/anthropic/claude-sonnet-4.5`
- `kilocode/openai/gpt-5.2`
- `kilocode/google/gemini-3-pro-preview`
- `kilocode/google/gemini-3-flash-preview`
- `kilocode/x-ai/grok-code-fast-1`
- `kilocode/moonshotai/kimi-k2.5`

## 注意事项

- 模型引用格式为 `kilocode/<provider>/<model>`（例如 `kilocode/anthropic/claude-opus-4.6`）。
- 默认模型：`kilocode/anthropic/claude-opus-4.6`
- Base URL：`https://api.kilo.ai/api/gateway/`
- 更多模型/Provider 选项，请参阅 [/concepts/model-providers](/concepts/model-providers)。
- Kilo Gateway 底层使用 Bearer token 携带您的 API 密钥。
