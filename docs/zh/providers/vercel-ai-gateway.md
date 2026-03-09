---
mmh3_hash: "07862d691e3dbb2a93ca6c3fd5e5aa7d"
title: "Vercel AI Gateway"
sidebarTitle: "Vercel AI Gateway"
summary: "Vercel AI Gateway 设置 (身份验证 + 模型选择)"
read_when: ["您想将 Vercel AI Gateway 与 OpenClaw 一起使用","您需要 API 密钥环境变量或 CLI 身份验证选择"]
---
# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) 提供统一的 API，通过单个端点访问数百个模型。

- 提供商: `vercel-ai-gateway`
- 身份验证: `AI_GATEWAY_API_KEY`
- API: Anthropic Messages 兼容
- OpenClaw 自动发现 Gateway `/v1/models` 目录，因此 `/models vercel-ai-gateway`
  包含当前模型引用，如 `vercel-ai-gateway/openai/gpt-5.4`。

## 快速开始

1. 设置 API 密钥（推荐：为 Gateway 存储它）：

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. 设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 环境注意事项

如果 Gateway 作为守护进程（launchd/systemd）运行，请确保该进程可以访问 `AI_GATEWAY_API_KEY`（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。

## 模型 ID 简写

OpenClaw 接受 Vercel Claude 简写模型引用，并在运行时将其标准化：

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
