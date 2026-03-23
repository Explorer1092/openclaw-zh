---
mmh3_hash: "c45e07c3986c5a44432c20cabb1da78d"
title: "Cloudflare AI Gateway"
summary: "Cloudflare AI Gateway 设置（身份验证 + 模型选择）"
read_when:
  - 您想要在 OpenClaw 中使用 Cloudflare AI Gateway
  - 您需要帐户 ID、Gateway ID 或 API 密钥环境变量
---

# Cloudflare AI Gateway

Cloudflare AI Gateway 位于 Provider API 前面，让您可以添加分析、缓存和控制。对于 Anthropic，OpenClaw 通过您的 Gateway 端点使用 Anthropic Messages API。

- Provider：`cloudflare-ai-gateway`
- Base URL：`https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- 默认模型：`cloudflare-ai-gateway/claude-sonnet-4-6`
- API 密钥：`CLOUDFLARE_AI_GATEWAY_API_KEY`（您通过 Gateway 发送请求的 Provider API 密钥）

对于 Anthropic 模型，使用您的 Anthropic API 密钥。

## 快速开始

1. 设置 Provider API 密钥和 Gateway 详细信息：

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. 设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
    },
  },
}
```

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## 经过身份验证的 Gateway

如果您在 Cloudflare 中启用了 Gateway 身份验证，请添加 `cf-aig-authorization` 标头（这是您的 Provider API 密钥之外的）。

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

## 环境注意事项

如果 Gateway 作为守护程序运行（launchd/systemd），请确保 `CLOUDFLARE_AI_GATEWAY_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
