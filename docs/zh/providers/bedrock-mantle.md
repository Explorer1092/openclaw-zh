---
mmh3_hash: "39cfc14b7eaf041da2b545a3410270fa"
summary: "在 OpenClaw 中使用 Amazon Bedrock Mantle（OpenAI 兼容）模型"
read_when:
  - 您想在 OpenClaw 中使用 Bedrock Mantle 托管的开源模型
  - 您需要用于 GPT-OSS、Qwen、Kimi 或 GLM 的 Mantle OpenAI 兼容端点
title: "Amazon Bedrock Mantle"
---

# Amazon Bedrock Mantle

OpenClaw 内置了 **Amazon Bedrock Mantle** Provider，连接到 Mantle OpenAI 兼容端点。Mantle 通过标准 `/v1/chat/completions` 接口托管开源和第三方模型（GPT-OSS、Qwen、Kimi、GLM 等），由 Bedrock 基础设施提供支持。

## OpenClaw 支持什么

- Provider：`amazon-bedrock-mantle`
- API：`openai-completions`（OpenAI 兼容）
- 身份验证：显式 `AWS_BEARER_TOKEN_BEDROCK` 或 IAM 凭据链 Bearer 令牌生成
- 区域：`AWS_REGION` 或 `AWS_DEFAULT_REGION`（默认：`us-east-1`）

## 自动模型发现

当设置了 `AWS_BEARER_TOKEN_BEDROCK` 时，OpenClaw 直接使用它。否则，OpenClaw 会尝试从 AWS 默认凭据链（包括共享凭据/配置文件、SSO、Web 身份以及实例或任务角色）生成 Mantle Bearer 令牌。然后通过查询该区域的 `/v1/models` 端点来发现可用的 Mantle 模型。发现结果缓存 1 小时，IAM 派生的 Bearer 令牌每小时刷新一次。

支持的区域：`us-east-1`、`us-east-2`、`us-west-2`、`ap-northeast-1`、`ap-south-1`、`ap-southeast-3`、`eu-central-1`、`eu-west-1`、`eu-west-2`、`eu-south-1`、`eu-north-1`、`sa-east-1`。

## 入门

1. 在**网关主机**上选择一种身份验证方式：

显式 Bearer 令牌：

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# 可选（默认为 us-east-1）：
export AWS_REGION="us-west-2"
```

IAM 凭据：

```bash
# 这里可以使用任何与 AWS SDK 兼容的身份验证源，例如：
export AWS_PROFILE="default"
export AWS_REGION="us-west-2"
```

2. 验证模型已被发现：

```bash
openclaw models list
```

发现的模型显示在 `amazon-bedrock-mantle` Provider 下。除非您想覆盖默认值，否则不需要额外配置。

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

## 注意事项

- 当未设置 `AWS_BEARER_TOKEN_BEDROCK` 时，OpenClaw 可以从 AWS SDK 兼容的 IAM 凭据为您生成 Mantle Bearer 令牌。
- Bearer 令牌与标准 [Amazon Bedrock](/providers/bedrock) Provider 使用的 `AWS_BEARER_TOKEN_BEDROCK` 相同。
- 推理支持根据模型 ID 中包含 `thinking`、`reasoner` 或 `gpt-oss-120b` 等模式来推断。
- 如果 Mantle 端点不可用或不返回任何模型，该 Provider 将被静默跳过。
