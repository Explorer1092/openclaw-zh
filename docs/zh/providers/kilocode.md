---
mmh3_hash: "6b49ca929c971adc7b988121d9856f36"
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

默认模型为 `kilocode/kilo/auto`，这是一个智能路由模型，会根据任务自动选择最合适的底层模型：

- 规划、调试和编排任务路由到 Claude Opus
- 代码编写和探索任务路由到 Claude Sonnet

## 可用模型

OpenClaw 在启动时从 Kilo Gateway 动态发现可用模型。使用 `/models kilocode` 查看您账户可用的完整模型列表。

网关上的任何模型都可以使用 `kilocode/` 前缀：

```
kilocode/kilo/auto              （默认 - 智能路由）
kilocode/anthropic/claude-sonnet-4
kilocode/openai/gpt-5.2
kilocode/google/gemini-3-pro-preview
...以及更多
```

## 注意事项

- 模型引用格式为 `kilocode/<model-id>`（例如 `kilocode/anthropic/claude-sonnet-4`）。
- 默认模型：`kilocode/kilo/auto`
- Base URL：`https://api.kilo.ai/api/gateway/`
- 更多模型/Provider 选项，请参阅 [/concepts/model-providers](/concepts/model-providers)。
- Kilo Gateway 底层使用 Bearer token 携带您的 API 密钥。
