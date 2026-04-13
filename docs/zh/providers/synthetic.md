---
title: "Synthetic"
sidebarTitle: "Synthetic"
mmh3_hash: "92de6f23ad5bf02da137470492156958"
summary: "在 OpenClaw 中使用 Synthetic 的 Anthropic 兼容 API"
read_when:
  - 您想使用 Synthetic 作为模型 Provider
  - 您需要 Synthetic API 密钥或 Base URL 设置
---

# Synthetic

[Synthetic](https://synthetic.new) 公开 Anthropic 兼容的端点。
OpenClaw 将其注册为 `synthetic` Provider，并使用 Anthropic Messages API。

| 属性     | 值                                    |
| -------- | ------------------------------------- |
| Provider | `synthetic`                           |
| 身份验证 | `SYNTHETIC_API_KEY`                   |
| API      | Anthropic Messages                    |
| Base URL | `https://api.synthetic.new/anthropic` |

## 快速开始

<Steps>
  <Step title="获取 API 密钥">
    从您的 Synthetic 账户获取 `SYNTHETIC_API_KEY`，或让入门向导提示您输入。
  </Step>
  <Step title="运行入门">
    ```bash
    openclaw onboard --auth-choice synthetic-api-key
    ```
  </Step>
  <Step title="验证默认模型">
    入门后，默认模型设置为：
    ```
    synthetic/hf:MiniMaxAI/MiniMax-M2.5
    ```
  </Step>
</Steps>

<Warning>
OpenClaw 的 Anthropic 客户端会自动将 `/v1` 附加到 Base URL，因此请使用
`https://api.synthetic.new/anthropic`（而不是 `/anthropic/v1`）。如果 Synthetic 更改其 Base URL，请覆盖 `models.providers.synthetic.baseUrl`。
</Warning>

## 配置示例

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

## 模型目录

以下所有 Synthetic 模型使用成本 `0`（输入/输出/缓存）。

| 模型 ID                                                | 上下文窗口 | 最大令牌 | 推理  | 输入         |
| ------------------------------------------------------ | ---------- | -------- | ----- | ------------ |
| `hf:MiniMaxAI/MiniMax-M2.5`                            | 192,000    | 65,536   | 否    | text         |
| `hf:moonshotai/Kimi-K2-Thinking`                       | 256,000    | 8,192    | 是    | text         |
| `hf:zai-org/GLM-4.7`                                   | 198,000    | 128,000  | 否    | text         |
| `hf:deepseek-ai/DeepSeek-R1-0528`                      | 128,000    | 8,192    | 否    | text         |
| `hf:deepseek-ai/DeepSeek-V3-0324`                      | 128,000    | 8,192    | 否    | text         |
| `hf:deepseek-ai/DeepSeek-V3.1`                         | 128,000    | 8,192    | 否    | text         |
| `hf:deepseek-ai/DeepSeek-V3.1-Terminus`                | 128,000    | 8,192    | 否    | text         |
| `hf:deepseek-ai/DeepSeek-V3.2`                         | 159,000    | 8,192    | 否    | text         |
| `hf:meta-llama/Llama-3.3-70B-Instruct`                 | 128,000    | 8,192    | 否    | text         |
| `hf:meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | 524,000    | 8,192    | 否    | text         |
| `hf:moonshotai/Kimi-K2-Instruct-0905`                  | 256,000    | 8,192    | 否    | text         |
| `hf:moonshotai/Kimi-K2.5`                              | 256,000    | 8,192    | 是    | text + image |
| `hf:openai/gpt-oss-120b`                               | 128,000    | 8,192    | 否    | text         |
| `hf:Qwen/Qwen3-235B-A22B-Instruct-2507`                | 256,000    | 8,192    | 否    | text         |
| `hf:Qwen/Qwen3-Coder-480B-A35B-Instruct`               | 256,000    | 8,192    | 否    | text         |
| `hf:Qwen/Qwen3-VL-235B-A22B-Instruct`                  | 250,000    | 8,192    | 否    | text + image |
| `hf:zai-org/GLM-4.5`                                   | 128,000    | 128,000  | 否    | text         |
| `hf:zai-org/GLM-4.6`                                   | 198,000    | 128,000  | 否    | text         |
| `hf:zai-org/GLM-5`                                     | 256,000    | 128,000  | 是    | text + image |
| `hf:deepseek-ai/DeepSeek-V3`                           | 128,000    | 8,192    | 否    | text         |
| `hf:Qwen/Qwen3-235B-A22B-Thinking-2507`                | 256,000    | 8,192    | 是    | text         |

<Tip>
模型引用使用 `synthetic/<modelId>` 形式。使用
`openclaw models list --provider synthetic` 查看您账户上所有可用的模型。
</Tip>

<AccordionGroup>
  <Accordion title="模型允许列表">
    如果您启用了模型允许列表（`agents.defaults.models`），请添加您计划使用的每个
    Synthetic 模型。不在允许列表中的模型将对 Agent 隐藏。
  </Accordion>

  <Accordion title="Base URL 覆盖">
    如果 Synthetic 更改其 API 端点，请在配置中覆盖 Base URL：

    ```json5
    {
      models: {
        providers: {
          synthetic: {
            baseUrl: "https://new-api.synthetic.new/anthropic",
          },
        },
      },
    }
    ```

    请记住，OpenClaw 会自动附加 `/v1`。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型 Provider" href="/concepts/model-providers" icon="layers">
    Provider 规则、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    包含 Provider 设置的完整配置 Schema。
  </Card>
  <Card title="Synthetic" href="https://synthetic.new" icon="arrow-up-right-from-square">
    Synthetic 仪表板和 API 文档。
  </Card>
</CardGroup>
