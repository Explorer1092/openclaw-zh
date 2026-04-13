---
mmh3_hash: "4a08cc81ec87b7ac61b000dedcf34eb6"
title: "OpenRouter"
summary: "在 OpenClaw 中使用 OpenRouter 的统一 API 访问多种模型"
read_when:
  - 您想要用一个 API 密钥访问多种 LLM
  - 您想通过 OpenRouter 在 OpenClaw 中运行模型
---

# OpenRouter

OpenRouter 提供**统一 API**，通过单一端点和 API 密钥将请求路由到多种模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换 Base URL 即可工作。

## 快速开始

<Steps>
  <Step title="获取 API 密钥">
    在 [openrouter.ai/keys](https://openrouter.ai/keys) 创建 API 密钥。
  </Step>
  <Step title="运行入门">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（可选）切换到具体模型">
    入门默认为 `openrouter/auto`。稍后选择具体模型：

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## 配置示例

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

## 模型引用

<Note>
模型引用遵循 `openrouter/<provider>/<model>` 的格式。有关可用 Provider 和模型的完整列表，请参见 [/concepts/model-providers](/concepts/model-providers)。
</Note>

## 身份验证和标头

OpenRouter 在底层使用 Bearer 令牌和您的 API 密钥。

在真实的 OpenRouter 请求（`https://openrouter.ai/api/v1`）上，OpenClaw 还会添加 OpenRouter 记录的应用归因标头：

| 标头                      | 值                    |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai` |
| `X-OpenRouter-Title`      | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`           |

<Warning>
如果您将 OpenRouter Provider 重新指向其他代理或 Base URL，OpenClaw **不会**注入这些 OpenRouter 特定标头或 Anthropic 缓存标记。
</Warning>

## 高级说明

<AccordionGroup>
  <Accordion title="Anthropic 缓存标记">
    在已验证的 OpenRouter 路由上，Anthropic 模型引用保留 OpenRouter 特定的 Anthropic `cache_control` 标记，OpenClaw 使用这些标记在系统/开发者提示块上实现更好的提示缓存复用。
  </Accordion>

  <Accordion title="思考/推理注入">
    在支持的非 `auto` 路由上，OpenClaw 将所选思考级别映射到 OpenRouter 代理推理负载。不支持的模型提示和 `openrouter/auto` 跳过该推理注入。
  </Accordion>

  <Accordion title="OpenAI 专属请求塑形">
    OpenRouter 仍然通过代理风格的 OpenAI 兼容路径运行，因此原生 OpenAI 专属请求塑形（如 `serviceTier`、Responses `store`、OpenAI 推理兼容负载和提示缓存提示）不会被转发。
  </Accordion>

  <Accordion title="Gemini 支持路由">
    Gemini 支持的 OpenRouter 引用保持在代理 Gemini 路径上：OpenClaw 在那里保持 Gemini 思维签名清理，但不启用原生 Gemini 回放验证或引导重写。
  </Accordion>

  <Accordion title="Provider 路由元数据">
    如果您在模型参数下传递 OpenRouter Provider 路由，OpenClaw 在共享流包装器运行之前将其转发为 OpenRouter 路由元数据。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    Agent、模型和 Provider 的完整配置参考。
  </Card>
</CardGroup>
