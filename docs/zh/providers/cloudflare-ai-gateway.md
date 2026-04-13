---
mmh3_hash: "d7e5e0416b528fa7d6df610bb92c39e0"
title: "Cloudflare AI Gateway"
summary: "Cloudflare AI Gateway 设置（身份验证 + 模型选择）"
read_when:
  - 您想要在 OpenClaw 中使用 Cloudflare AI Gateway
  - 您需要帐户 ID、Gateway ID 或 API 密钥环境变量
---

# Cloudflare AI Gateway

Cloudflare AI Gateway 位于 Provider API 前面，让您可以添加分析、缓存和控制。对于 Anthropic，OpenClaw 通过您的 Gateway 端点使用 Anthropic Messages API。

| 属性     | 值                                                                                       |
| -------- | ---------------------------------------------------------------------------------------- |
| Provider | `cloudflare-ai-gateway`                                                                  |
| Base URL | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| 默认模型 | `cloudflare-ai-gateway/claude-sonnet-4-5`                                                |
| API 密钥 | `CLOUDFLARE_AI_GATEWAY_API_KEY`（您通过 Gateway 发送请求的 Provider API 密钥）           |

<Note>
对于通过 Cloudflare AI Gateway 路由的 Anthropic 模型，请使用您的 **Anthropic API 密钥**作为 Provider 密钥。
</Note>

## 快速开始

<Steps>
  <Step title="设置 Provider API 密钥和 Gateway 详细信息">
    运行入门并选择 Cloudflare AI Gateway 身份验证选项：

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    这会提示您输入帐户 ID、Gateway ID 和 API 密钥。

  </Step>
  <Step title="设置默认模型">
    将模型添加到您的 OpenClaw 配置：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
        },
      },
    }
    ```

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## 非交互式示例

对于脚本化或 CI 设置，在命令行上传递所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## 高级配置

<AccordionGroup>
  <Accordion title="已认证的 Gateway">
    如果您在 Cloudflare 中启用了 Gateway 身份验证，请添加 `cf-aig-authorization` 标头。这是在您的 Provider API 密钥**之外**添加的。

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    `cf-aig-authorization` 标头用于向 Cloudflare Gateway 本身进行身份验证，而 Provider API 密钥（例如您的 Anthropic 密钥）用于向上游 Provider 进行身份验证。
    </Tip>

  </Accordion>

  <Accordion title="环境注意事项">
    如果 Gateway 作为守护程序（launchd/systemd）运行，请确保 `CLOUDFLARE_AI_GATEWAY_API_KEY` 对该进程可用。

    <Warning>
    仅存在于 `~/.profile` 中的密钥不会帮助 launchd/systemd 守护进程，除非该环境也被导入其中。在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 设置密钥，以确保 Gateway 进程可以读取它。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常规故障排除和 FAQ。
  </Card>
</CardGroup>
