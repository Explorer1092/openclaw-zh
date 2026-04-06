---
mmh3_hash: "03b370d56e5921175046607d16b438f4"
title: "Mistral"
summary: "在 OpenClaw 中使用 Mistral 模型和 Voxtral 转录"
read_when:
  - 希望在 OpenClaw 中使用 Mistral 模型
  - 需要 Mistral API 密钥入门和模型参考
---

# Mistral

OpenClaw 支持 Mistral 用于文本/图像模型路由（`mistral/...`）和通过媒体理解中的 Voxtral 进行音频转录。Mistral 也可用于内存嵌入（`memorySearch.provider = "mistral"`）。

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

## 内置 LLM 目录

OpenClaw 目前提供以下内置 Mistral 目录：

| 模型引用                         | 输入        | 上下文  | 最大输出 | 备注                     |
| -------------------------------- | ----------- | ------- | -------- | ------------------------ |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384   | 默认模型                 |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192    | Mistral Medium 3.1       |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384   | 较小的多模态模型         |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768   | Pixtral                  |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096    | 编码                     |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768   | Devstral 2               |
| `mistral/magistral-small`        | text        | 128,000 | 40,000   | 启用推理                 |

## 配置片段（Voxtral 音频转录）

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

## 注意事项

- Mistral 身份验证使用 `MISTRAL_API_KEY`。
- Provider Base URL 默认为 `https://api.mistral.ai/v1`。
- 入门默认模型为 `mistral/mistral-large-latest`。
- Mistral 的媒体理解默认音频模型为 `voxtral-mini-latest`。
- 媒体转录路径使用 `/v1/audio/transcriptions`。
- 内存嵌入路径使用 `/v1/embeddings`（默认模型：`mistral-embed`）。
