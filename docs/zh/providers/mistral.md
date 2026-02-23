---
mmh3_hash: "c228d87545e04339ff1272c708dd9703"
title: "Mistral"
summary: "在 OpenClaw 中使用 Mistral 模型和 Voxtral 转录"
read_when:
  - 希望在 OpenClaw 中使用 Mistral 模型
  - 需要 Mistral API 密钥入门和模型参考
---

# Mistral

OpenClaw 支持 Mistral 用于文本/图像模型路由（`mistral/...`）以及通过 Voxtral 在媒体理解中进行音频转录。
Mistral 也可用于记忆嵌入（`memorySearch.provider = "mistral"`）。

## CLI 设置

```bash
openclaw onboard --auth-choice mistral-api-key
# 或非交互式
openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
```

## 配置片段（LLM Provider）

```json5
{
  env: { MISTRAL_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
}
```

## 配置片段（使用 Voxtral 进行音频转录）

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

## 说明

- Mistral 认证使用 `MISTRAL_API_KEY`。
- Provider 基础 URL 默认为 `https://api.mistral.ai/v1`。
- 入门默认模型为 `mistral/mistral-large-latest`。
- Mistral 的媒体理解默认音频模型为 `voxtral-mini-latest`。
- 媒体转录路径使用 `/v1/audio/transcriptions`。
- 记忆嵌入路径使用 `/v1/embeddings`（默认模型：`mistral-embed`）。
