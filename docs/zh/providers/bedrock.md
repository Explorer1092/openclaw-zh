---
mmh3_hash: "7354ba95fdee991dc440e41db8ad4cc8"
summary: "在 OpenClaw 中使用 Amazon Bedrock（Converse API）模型"
read_when:
  - 您想要在 OpenClaw 中使用 Amazon Bedrock 模型
  - 您需要为模型调用设置 AWS 凭据/区域
title: "Amazon Bedrock"
---

# Amazon Bedrock

OpenClaw 可以通过 pi-ai 的 **Bedrock Converse** 流式 Provider 使用 **Amazon Bedrock** 模型。Bedrock 身份验证使用 **AWS SDK 默认凭据链**，而不是 API 密钥。

## pi-ai 支持什么

- Provider：`amazon-bedrock`
- API：`bedrock-converse-stream`
- 身份验证：AWS 凭据（环境变量、共享配置或实例角色）
- 区域：`AWS_REGION` 或 `AWS_DEFAULT_REGION`（默认：`us-east-1`）

## 自动模型发现

OpenClaw 可以自动发现支持**流式传输**和**文本输出**的 Bedrock 模型。发现使用 `bedrock:ListFoundationModels` 和 `bedrock:ListInferenceProfiles`，结果被缓存（默认：1 小时）。

隐式 Provider 的启用方式：

- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 为 `true`，即使没有 AWS 环境标记，OpenClaw 也会尝试发现。
- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 未设置，OpenClaw 仅在检测到以下 AWS 身份验证标记之一时才会自动添加隐式 Bedrock Provider：`AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 或 `AWS_PROFILE`。
- 实际的 Bedrock 运行时身份验证路径仍使用 AWS SDK 默认链，因此即使发现需要 `enabled: true` 才能选择加入，共享配置、SSO 和 IMDS 实例角色身份验证也能正常工作。

配置选项位于 `plugins.entries.amazon-bedrock.config.discovery` 下：

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          discovery: {
            enabled: true,
            region: "us-east-1",
            providerFilter: ["anthropic", "amazon"],
            refreshInterval: 3600,
            defaultContextWindow: 32000,
            defaultMaxTokens: 4096,
          },
        },
      },
    },
  },
}
```

注意事项：

- `enabled` 默认为自动模式。在自动模式下，OpenClaw 仅在检测到支持的 AWS 环境标记时才启用隐式 Bedrock Provider。
- `region` 默认为 `AWS_REGION` 或 `AWS_DEFAULT_REGION`，然后是 `us-east-1`。
- `providerFilter` 匹配 Bedrock Provider 名称（例如 `anthropic`）。
- `refreshInterval` 以秒为单位；设置为 `0` 可禁用缓存。
- `defaultContextWindow`（默认：`32000`）和 `defaultMaxTokens`（默认：`4096`）用于发现的模型（如果您知道模型限制，请覆盖）。
- 对于显式的 `models.providers["amazon-bedrock"]` 条目，OpenClaw 仍可以从 `AWS_BEARER_TOKEN_BEDROCK` 等 AWS 环境标记中提前解析 Bedrock 环境标记身份验证，而无需强制加载完整的运行时身份验证。实际的模型调用身份验证路径仍使用 AWS SDK 默认链。

## 入门

1. 确保 AWS 凭据在**网关主机**上可用：

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# 可选：
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# 可选（Bedrock API 密钥/Bearer 令牌）：
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. 将 Bedrock Provider 和模型添加到您的配置（不需要 `apiKey`）：

```json5
{
  models: {
    providers: {
      "amazon-bedrock": {
        baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
        api: "bedrock-converse-stream",
        auth: "aws-sdk",
        models: [
          {
            id: "us.anthropic.claude-opus-4-6-v1:0",
            name: "Claude Opus 4.6 (Bedrock)",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
    },
  },
}
```

## EC2 实例角色

在附加了 IAM 角色的 EC2 实例上运行 OpenClaw 时，AWS SDK 可以使用实例元数据服务（IMDS）进行身份验证。对于 Bedrock 模型发现，OpenClaw 仅从 AWS 环境标记自动启用隐式 Provider，除非您显式设置 `plugins.entries.amazon-bedrock.config.discovery.enabled: true`。

针对 IMDS 支持主机的推荐设置：

- 将 `plugins.entries.amazon-bedrock.config.discovery.enabled` 设置为 `true`。
- 设置 `plugins.entries.amazon-bedrock.config.discovery.region`（或导出 `AWS_REGION`）。
- **不需要**虚假的 API 密钥。
- 仅当您专门想要一个用于自动模式或状态界面的环境标记时，才需要 `AWS_PROFILE=default`。

```bash
# 推荐：显式启用发现 + 区域
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 可选：如果您想在没有显式启用的情况下使用自动模式，添加环境标记
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**EC2 实例角色所需的 IAM 权限：**

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels`（用于自动发现）
- `bedrock:ListInferenceProfiles`（用于推理配置文件发现）

或附加托管策略 `AmazonBedrockFullAccess`。

## 快速设置（AWS 路径）

```bash
# 1. 创建 IAM 角色和实例配置文件
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. 附加到您的 EC2 实例
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. 在 EC2 实例上，显式启用发现
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. 可选：如果您想在没有显式启用的情况下使用自动模式，添加环境标记
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. 验证模型已被发现
openclaw models list
```

## 推理配置文件

OpenClaw 与基础模型一起发现**区域和全局推理配置文件**。当配置文件映射到已知的基础模型时，该配置文件会继承该模型的功能（上下文窗口、最大令牌数、推理、视觉），并自动注入正确的 Bedrock 请求区域。这意味着跨区域 Claude 配置文件无需手动 Provider 覆盖即可工作。

推理配置文件 ID 类似于 `us.anthropic.claude-opus-4-6-v1:0`（区域性）或 `anthropic.claude-opus-4-6-v1:0`（全局）。如果支持模型已在发现结果中，该配置文件会继承其完整功能集；否则应用安全默认值。

无需额外配置。只要发现已启用且 IAM 主体具有 `bedrock:ListInferenceProfiles`，配置文件就会与基础模型一起出现在 `openclaw models list` 中。

## 注意事项

- Bedrock 需要在您的 AWS 帐户/区域中启用**模型访问**。
- 自动发现需要 `bedrock:ListFoundationModels` 和 `bedrock:ListInferenceProfiles` 权限。
- 如果您依赖自动模式，请在网关主机上设置受支持的 AWS 身份验证环境标记之一。如果您偏好没有环境标记的 IMDS/共享配置身份验证，请设置 `plugins.entries.amazon-bedrock.config.discovery.enabled: true`。
- OpenClaw 按以下顺序显示凭据源：`AWS_BEARER_TOKEN_BEDROCK`，然后 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，然后 `AWS_PROFILE`，然后是默认的 AWS SDK 链。
- 推理支持取决于模型；请查看 Bedrock 模型卡以了解当前功能。
- 如果您更喜欢托管密钥流程，您还可以在 Bedrock 前面放置一个 OpenAI 兼容的代理，并将其配置为 OpenAI Provider。

## 护栏（Guardrails）

您可以通过向 `amazon-bedrock` 插件配置添加 `guardrail` 对象，将 [Amazon Bedrock 护栏](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)应用于所有 Bedrock 模型调用。护栏允许您实施内容过滤、主题拒绝、词语过滤、敏感信息过滤和上下文基础检查。

```json5
{
  plugins: {
    entries: {
      "amazon-bedrock": {
        config: {
          guardrail: {
            guardrailIdentifier: "abc123", // 护栏 ID 或完整 ARN
            guardrailVersion: "1", // 版本号或 "DRAFT"
            streamProcessingMode: "sync", // 可选："sync" 或 "async"
            trace: "enabled", // 可选："enabled"、"disabled" 或 "enabled_full"
          },
        },
      },
    },
  },
}
```

- `guardrailIdentifier`（必需）接受护栏 ID（例如 `abc123`）或完整 ARN（例如 `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。
- `guardrailVersion`（必需）指定要使用的已发布版本，或 `"DRAFT"` 表示工作草稿。
- `streamProcessingMode`（可选）控制流式传输期间护栏评估是同步（`"sync"`）还是异步（`"async"`）运行。如果省略，Bedrock 使用其默认行为。
- `trace`（可选）在 API 响应中启用护栏跟踪输出。设置为 `"enabled"` 或 `"enabled_full"` 进行调试；省略或设置 `"disabled"` 用于生产。

网关使用的 IAM 主体除标准调用权限外，还必须具有 `bedrock:ApplyGuardrail` 权限。

## 内存搜索的嵌入

Bedrock 也可以作为[内存搜索](/concepts/memory-search)的嵌入 Provider。这与推理 Provider 分开配置——将 `agents.defaults.memorySearch.provider` 设置为 `"bedrock"`：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "bedrock",
        model: "amazon.titan-embed-text-v2:0", // 默认值
      },
    },
  },
}
```

Bedrock 嵌入使用与推理相同的 AWS SDK 凭据链（实例角色、SSO、访问密钥、共享配置和 Web 身份）。不需要 API 密钥。当 `provider` 为 `"auto"` 时，如果该凭据链成功解析，Bedrock 会被自动检测到。

支持的嵌入模型包括 Amazon Titan Embed（v1、v2）、Amazon Nova Embed、Cohere Embed（v3、v4）和 TwelveLabs Marengo。请参阅[内存配置参考 — Bedrock](/reference/memory-config#bedrock-embedding-config) 获取完整的模型列表和维度选项。
