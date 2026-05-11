---
mmh3_hash: "a5845f1bd6ba64e7ce62c1f4876ca6ac"
summary: "在 OpenClaw 中使用 Amazon Bedrock（Converse API）模型"
read_when:
  - 您想要在 OpenClaw 中使用 Amazon Bedrock 模型
  - 您需要为模型调用设置 AWS 凭据/区域
title: "Amazon Bedrock"
---

OpenClaw 可以通过 pi-ai 的 **Bedrock Converse** 流式 Provider 使用 **Amazon Bedrock** 模型。Bedrock 身份验证使用 **AWS SDK 默认凭据链**，而不是 API 密钥。

| 属性     | 值                                                          |
| -------- | ----------------------------------------------------------- |
| Provider | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| 身份验证 | AWS 凭据（环境变量、共享配置或实例角色）                    |
| 区域     | `AWS_REGION` 或 `AWS_DEFAULT_REGION`（默认：`us-east-1`）  |

## 快速开始

选择您首选的身份验证方式并按照设置步骤操作。

<Tabs>
  <Tab title="访问密钥 / 环境变量">
    **适用于：** 开发机器、CI，或直接管理 AWS 凭据的主机。

    <Steps>
      <Step title="在 Gateway 主机上设置 AWS 凭据">
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
      </Step>
      <Step title="将 Bedrock Provider 和模型添加到配置">
        不需要 `apiKey`。使用 `auth: "aws-sdk"` 配置 Provider：

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
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    通过环境标记身份验证（`AWS_ACCESS_KEY_ID`、`AWS_PROFILE` 或 `AWS_BEARER_TOKEN_BEDROCK`），OpenClaw 自动启用隐式 Bedrock Provider 进行模型发现，无需额外配置。
    </Tip>

  </Tab>

  <Tab title="EC2 实例角色（IMDS）">
    **适用于：** 附加了 IAM 角色的 EC2 实例，使用实例元数据服务进行身份验证。

    <Steps>
      <Step title="显式启用发现">
        使用 IMDS 时，OpenClaw 无法仅从环境标记检测 AWS 身份验证，因此您必须选择加入：

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="可选添加环境标记以使用自动模式">
        如果您还想让环境标记自动检测路径工作（例如用于 `openclaw status` 界面）：

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        您**不**需要虚假的 API 密钥。
      </Step>
      <Step title="验证模型已被发现">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    附加到您 EC2 实例的 IAM 角色必须具有以下权限：

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels`（用于自动发现）
    - `bedrock:ListInferenceProfiles`（用于推理配置文件发现）

    或附加托管策略 `AmazonBedrockFullAccess`。
    </Warning>

    <Note>
    只有在您专门想要自动模式或状态界面的环境标记时，才需要 `AWS_PROFILE=default`。实际的 Bedrock 运行时身份验证路径使用 AWS SDK 默认链，因此即使没有环境标记，IMDS 实例角色身份验证也能正常工作。
    </Note>

  </Tab>
</Tabs>

## 自动模型发现

OpenClaw 可以自动发现支持**流式传输**和**文本输出**的 Bedrock 模型。发现使用 `bedrock:ListFoundationModels` 和 `bedrock:ListInferenceProfiles`，结果被缓存（默认：1 小时）。

隐式 Provider 的启用方式：

- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 为 `true`，即使没有 AWS 环境标记，OpenClaw 也会尝试发现。
- 如果 `plugins.entries.amazon-bedrock.config.discovery.enabled` 未设置，OpenClaw 仅在检测到以下 AWS 身份验证标记之一时才会自动添加隐式 Bedrock Provider：`AWS_BEARER_TOKEN_BEDROCK`、`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` 或 `AWS_PROFILE`。
- 实际的 Bedrock 运行时身份验证路径仍使用 AWS SDK 默认链，因此即使发现需要 `enabled: true` 才能选择加入，共享配置、SSO 和 IMDS 实例角色身份验证也能正常工作。

<Note>
对于显式的 `models.providers["amazon-bedrock"]` 条目，OpenClaw 仍可以从 `AWS_BEARER_TOKEN_BEDROCK` 等 AWS 环境标记中提前解析 Bedrock 环境标记身份验证，而无需强制加载完整的运行时身份验证。实际的模型调用身份验证路径仍使用 AWS SDK 默认链。
</Note>

<AccordionGroup>
  <Accordion title="发现配置选项">
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

    | 选项 | 默认值 | 描述 |
    | ------ | ------- | ----------- |
    | `enabled` | 自动 | 在自动模式下，OpenClaw 仅在检测到支持的 AWS 环境标记时才启用隐式 Bedrock Provider。设置为 `true` 强制发现。 |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | 用于发现 API 调用的 AWS 区域。 |
    | `providerFilter` | （全部） | 匹配 Bedrock Provider 名称（例如 `anthropic`、`amazon`）。 |
    | `refreshInterval` | `3600` | 缓存持续时间（秒）。设置为 `0` 禁用缓存。 |
    | `defaultContextWindow` | `32000` | 用于发现模型的上下文窗口（如果您知道模型限制，请覆盖）。 |
    | `defaultMaxTokens` | `4096` | 用于发现模型的最大输出令牌数（如果您知道模型限制，请覆盖）。 |

  </Accordion>
</AccordionGroup>

## 快速设置（AWS 路径）

此演练创建 IAM 角色、附加 Bedrock 权限、关联实例配置文件，并在 EC2 主机上启用 OpenClaw 发现。

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

## 高级配置

<AccordionGroup>
  <Accordion title="推理配置文件">
    OpenClaw 与基础模型一起发现**区域和全局推理配置文件**。当配置文件映射到已知的基础模型时，该配置文件会继承该模型的功能（上下文窗口、最大令牌数、推理、视觉），并自动注入正确的 Bedrock 请求区域。这意味着跨区域 Claude 配置文件无需手动 Provider 覆盖即可工作。

    推理配置文件 ID 类似于 `us.anthropic.claude-opus-4-6-v1:0`（区域性）或 `anthropic.claude-opus-4-6-v1:0`（全局）。如果支持模型已在发现结果中，该配置文件会继承其完整功能集；否则应用安全默认值。

    无需额外配置。只要发现已启用且 IAM 主体具有 `bedrock:ListInferenceProfiles`，配置文件就会与基础模型一起出现在 `openclaw models list` 中。

  </Accordion>

  <Accordion title="服务层级">
    某些 Bedrock 模型支持 `service_tier` 参数，用于优化成本或延迟。以下层级可用：

    | 层级 | 描述 |
    |------|-------------|
    | `default` | 标准 Bedrock 层级 |
    | `flex` | 针对可容忍较高延迟的工作负载提供折扣处理 |
    | `priority` | 针对对延迟敏感的工作负载提供优先处理 |
    | `reserved` | 针对稳定状态工作负载的预留容量 |

    通过 `agents.defaults.params` 为 Bedrock 模型请求设置 `serviceTier`（或 `service_tier`），或在 `agents.defaults.models["<model-key>"].params` 中按模型设置：

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // 应用于所有模型
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // 按模型覆盖
              },
            },
          },
        },
      },
    }
    ```

    有效值为 `default`、`flex`、`priority` 和 `reserved`。并非所有模型都支持所有层级——如果请求不支持的层级，Bedrock 将返回验证错误。注意：错误消息可能有些误导；可能会显示"提供的模型标识符无效"，而不是指示不支持的服务层级。如果看到此错误，请检查模型是否支持所请求的层级。

  </Accordion>

  <Accordion title="Claude Opus 4.7 温度参数">
    Bedrock 拒绝 Claude Opus 4.7 的 `temperature` 参数。OpenClaw 自动为所有 Opus 4.7 Bedrock 引用省略 `temperature`，包括基础模型 id、命名推理配置文件、通过 `bedrock:GetInferenceProfile` 解析到 Opus 4.7 的应用推理配置文件，以及带有可选区域前缀（`us.`、`eu.`、`ap.`、`apac.`、`au.`、`jp.`、`global.`）的点分 `opus-4.7` 变体。无需配置，省略适用于请求选项对象和 `inferenceConfig` 有效载荷字段。
  </Accordion>

  <Accordion title="护栏（Guardrails）">
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

    | 选项 | 必需 | 描述 |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | 是 | 护栏 ID（例如 `abc123`）或完整 ARN（例如 `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`）。 |
    | `guardrailVersion` | 是 | 已发布的版本号，或 `"DRAFT"` 表示工作草稿。 |
    | `streamProcessingMode` | 否 | 流式传输期间护栏评估的 `"sync"` 或 `"async"`。如果省略，Bedrock 使用其默认值。 |
    | `trace` | 否 | 用于调试的 `"enabled"` 或 `"enabled_full"`；生产环境省略或设置 `"disabled"`。 |

    <Warning>
    Gateway 使用的 IAM 主体除标准调用权限外，还必须具有 `bedrock:ApplyGuardrail` 权限。
    </Warning>

  </Accordion>

  <Accordion title="内存搜索的嵌入">
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

  </Accordion>

  <Accordion title="注意事项">
    - Bedrock 需要在您的 AWS 帐户/区域中启用**模型访问**。
    - 自动发现需要 `bedrock:ListFoundationModels` 和 `bedrock:ListInferenceProfiles` 权限。
    - 如果您依赖自动模式，请在 Gateway 主机上设置受支持的 AWS 身份验证环境标记之一。如果您偏好没有环境标记的 IMDS/共享配置身份验证，请设置 `plugins.entries.amazon-bedrock.config.discovery.enabled: true`。
    - OpenClaw 按以下顺序显示凭据源：`AWS_BEARER_TOKEN_BEDROCK`，然后 `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`，然后 `AWS_PROFILE`，然后是默认的 AWS SDK 链。
    - 推理支持取决于模型；请查看 Bedrock 模型卡以了解当前功能。
    - 如果您更喜欢托管密钥流程，您还可以在 Bedrock 前面放置一个 OpenAI 兼容的代理，并将其配置为 OpenAI Provider。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="内存搜索" href="/concepts/memory-search" icon="magnifying-glass">
    内存搜索的 Bedrock 嵌入配置。
  </Card>
  <Card title="内存配置参考" href="/reference/memory-config#bedrock-embedding-config" icon="database">
    完整的 Bedrock 嵌入模型列表和维度选项。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常规故障排除和 FAQ。
  </Card>
</CardGroup>
