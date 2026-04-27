---
mmh3_hash: "f06a592f392d07c156a36d93c6d5bcf8"
summary: "在 OpenClaw 中使用 Amazon Bedrock Mantle（OpenAI 兼容）模型"
read_when:
  - 您想在 OpenClaw 中使用 Bedrock Mantle 托管的开源模型
  - 您需要用于 GPT-OSS、Qwen、Kimi 或 GLM 的 Mantle OpenAI 兼容端点
title: "Amazon Bedrock Mantle"
---

# Amazon Bedrock Mantle

OpenClaw 内置了 **Amazon Bedrock Mantle** Provider，连接到 Mantle OpenAI 兼容端点。Mantle 通过标准 `/v1/chat/completions` 接口托管开源和第三方模型（GPT-OSS、Qwen、Kimi、GLM 等），由 Bedrock 基础设施提供支持。

| 属性             | 值                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------- |
| Provider ID      | `amazon-bedrock-mantle`                                                             |
| API              | `openai-completions`（OpenAI 兼容）或 `anthropic-messages`（Anthropic Messages 路由） |
| 身份验证         | 显式 `AWS_BEARER_TOKEN_BEDROCK` 或 IAM 凭据链 Bearer 令牌生成                       |
| 默认区域         | `us-east-1`（通过 `AWS_REGION` 或 `AWS_DEFAULT_REGION` 覆盖）                       |

## 快速开始

选择您首选的身份验证方式并按照设置步骤操作。

<Tabs>
  <Tab title="显式 Bearer 令牌">
    **适用于：** 您已拥有 Mantle Bearer 令牌的环境。

    <Steps>
      <Step title="在 Gateway 主机上设置 Bearer 令牌">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        可选设置区域（默认为 `us-east-1`）：

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="验证模型已被发现">
        ```bash
        openclaw models list
        ```

        发现的模型显示在 `amazon-bedrock-mantle` Provider 下。除非您想覆盖默认值，否则不需要额外配置。
      </Step>
    </Steps>

  </Tab>

  <Tab title="IAM 凭据">
    **适用于：** 使用 AWS SDK 兼容凭据（共享配置、SSO、Web 身份、实例或任务角色）。

    <Steps>
      <Step title="在 Gateway 主机上配置 AWS 凭据">
        任何与 AWS SDK 兼容的身份验证源都可以：

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="验证模型已被发现">
        ```bash
        openclaw models list
        ```

        OpenClaw 自动从凭据链生成 Mantle Bearer 令牌。
      </Step>
    </Steps>

    <Tip>
    当未设置 `AWS_BEARER_TOKEN_BEDROCK` 时，OpenClaw 从 AWS 默认凭据链（包括共享凭据/配置文件、SSO、Web 身份以及实例或任务角色）为您生成 Bearer 令牌。
    </Tip>

  </Tab>
</Tabs>

## 自动模型发现

当设置了 `AWS_BEARER_TOKEN_BEDROCK` 时，OpenClaw 直接使用它。否则，OpenClaw 尝试从 AWS 默认凭据链生成 Mantle Bearer 令牌。然后通过查询该区域的 `/v1/models` 端点来发现可用的 Mantle 模型。

| 行为             | 详情                      |
| ---------------- | ------------------------- |
| 发现缓存         | 结果缓存 1 小时           |
| IAM 令牌刷新     | 每小时                    |

<Note>
Bearer 令牌与标准 [Amazon Bedrock](/providers/bedrock) Provider 使用的 `AWS_BEARER_TOKEN_BEDROCK` 相同。
</Note>

### 支持的区域

`us-east-1`、`us-east-2`、`us-west-2`、`ap-northeast-1`、
`ap-south-1`、`ap-southeast-3`、`eu-central-1`、`eu-west-1`、`eu-west-2`、
`eu-south-1`、`eu-north-1`、`sa-east-1`。

## 手动配置

如果您偏好显式配置而不是自动发现：

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="推理支持">
    推理支持根据模型 ID 中包含 `thinking`、`reasoner` 或 `gpt-oss-120b` 等模式来推断。OpenClaw 在发现过程中自动为匹配模型设置 `reasoning: true`。
  </Accordion>

  <Accordion title="端点不可用">
    如果 Mantle 端点不可用或不返回任何模型，该 Provider 将被静默跳过。OpenClaw 不会报错；其他配置的 Provider 继续正常工作。
  </Accordion>

  <Accordion title="通过 Anthropic Messages 路由使用 Claude Opus 4.7">
    Mantle 还提供了一个 Anthropic Messages 路由，通过相同的 Bearer 令牌认证流式传输路径承载 Claude 模型。Claude Opus 4.7（`amazon-bedrock-mantle/claude-opus-4.7`）可通过此路由调用，并使用 Provider 自有的流式传输，因此 AWS Bearer 令牌不会被当作 Anthropic API 密钥处理。

    当您在 Mantle Provider 上固定 Anthropic Messages 模型时，OpenClaw 将为该模型使用 `anthropic-messages` API 接口而非 `openai-completions`。身份验证仍来自 `AWS_BEARER_TOKEN_BEDROCK`（或生成的 IAM Bearer 令牌）。

    ```json5
    {
      models: {
        providers: {
          "amazon-bedrock-mantle": {
            models: [
              {
                id: "claude-opus-4.7",
                name: "Claude Opus 4.7",
                api: "anthropic-messages",
                reasoning: true,
                input: ["text", "image"],
                contextWindow: 1000000,
                maxTokens: 32000,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="与 Amazon Bedrock Provider 的关系">
    Bedrock Mantle 是与标准 [Amazon Bedrock](/providers/bedrock) Provider 分开的 Provider。Mantle 使用 OpenAI 兼容的 `/v1` 接口，而标准 Bedrock Provider 使用原生 Bedrock API。

    两个 Provider 在存在时共享相同的 `AWS_BEARER_TOKEN_BEDROCK` 凭据。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/providers/bedrock" icon="cloud">
    用于 Anthropic Claude、Titan 和其他模型的原生 Bedrock Provider。
  </Card>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="OAuth 和身份验证" href="/gateway/authentication" icon="key">
    身份验证详情和凭据复用规则。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常见问题及解决方法。
  </Card>
</CardGroup>
