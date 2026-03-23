---
mmh3_hash: "03a01256a61a820a9c7e1b4dbe7e6d76"
title: "Google (Gemini)"
summary: "Google Gemini 设置（API 密钥 + OAuth、图像生成、媒体理解、Web 搜索）"
read_when:
  - 您想在 OpenClaw 中使用 Google Gemini 模型
  - 您需要 API 密钥或 OAuth 身份验证流程
---

# Google (Gemini)

Google Plugin 通过 Google AI Studio 提供对 Gemini 模型的访问，以及图像生成、媒体理解（图像/音频/视频）和通过 Gemini Grounding 实现的 Web 搜索。

- Provider：`google`
- 身份验证：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 替代 Provider：`google-gemini-cli`（OAuth）

## 快速开始

1. 设置 API 密钥：

```bash
openclaw onboard --auth-choice google-api-key
```

2. 设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice google-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## OAuth（Gemini CLI）

替代 Provider `google-gemini-cli` 使用 PKCE OAuth 而不是 API 密钥。这是非官方集成；部分用户反映有账户限制。使用时请自行承担风险。

环境变量：

- `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
- `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

（或 `GEMINI_CLI_*` 变体。）

## 能力

| 能力                | 支持              |
| ------------------- | ----------------- |
| 聊天补全            | 是                |
| 图像生成            | 是                |
| 图像理解            | 是                |
| 音频转录            | 是                |
| 视频理解            | 是                |
| Web 搜索（Grounding）| 是               |
| 思考/推理           | 是（Gemini 3.1+） |

## 环境注意事项

如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `GEMINI_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
