---
mmh3_hash: "7588b05140e96c56d8fb02cbf3d29516"
title: "SGLang"
sidebarTitle: "SGLang"
summary: "使用 SGLang（OpenAI 兼容自托管服务器）运行 OpenClaw"
read_when:
  - 您想针对本地 SGLang 服务器运行 OpenClaw
  - 您想使用 OpenAI 兼容的 /v1 端点运行自己的模型
---

# SGLang

SGLang 可以通过 **OpenAI 兼容** HTTP API 提供开源模型服务。
OpenClaw 可以使用 `openai-completions` API 连接到 SGLang。

OpenClaw 还可以在您使用 `SGLANG_API_KEY` 选择加入时（如果您的服务器不强制身份验证，任何值都有效）
且不定义显式的 `models.providers.sglang` 条目时，**自动发现** SGLang 中的可用模型。

## 快速开始

1. 启动带有 OpenAI 兼容服务器的 SGLang。

您的基础 URL 应公开 `/v1` 端点（例如 `/v1/models`、
`/v1/chat/completions`）。SGLang 通常运行在：

- `http://127.0.0.1:30000/v1`

2. 选择加入（如果未配置身份验证，任何值都有效）：

```bash
export SGLANG_API_KEY="sglang-local"
```

3. 运行引导并选择 `SGLang`，或直接设置模型：

```bash
openclaw onboard
```

```json5
{
  agents: {
    defaults: {
      model: { primary: "sglang/your-model-id" },
    },
  },
}
```

## 模型发现（隐式提供商）

当设置了 `SGLANG_API_KEY`（或存在身份验证配置文件）且您**不**
定义 `models.providers.sglang` 时，OpenClaw 将查询：

- `GET http://127.0.0.1:30000/v1/models`

并将返回的 ID 转换为模型条目。

如果您显式设置 `models.providers.sglang`，则跳过自动发现，
您必须手动定义模型。

## 显式配置（手动模型）

在以下情况下使用显式配置：

- SGLang 在不同的主机/端口上运行。
- 您想固定 `contextWindow`/`maxTokens` 值。
- 您的服务器需要真实的 API 密钥（或您想控制标头）。

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 故障排除

- 检查服务器是否可访问：

```bash
curl http://127.0.0.1:30000/v1/models
```

- 如果请求因身份验证错误而失败，请设置与您的服务器配置匹配的真实 `SGLANG_API_KEY`，
  或在 `models.providers.sglang` 下显式配置提供商。
