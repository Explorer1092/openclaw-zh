---
title: "OpenAI"
sidebarTitle: "OpenAI"
mmh3_hash: "3e1d72c154d9d9bc6d4e5d61c9196727"
summary: "在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI"
read_when: ["您想在 OpenClaw 中使用 OpenAI 模型","您想使用 Codex 订阅身份验证而不是 API 密钥"]
---
# OpenAI

OpenAI 为 GPT 模型提供开发者 API。Codex 支持**ChatGPT 登录**以进行订阅访问，或**API 密钥**登录以进行基于使用量的访问。Codex cloud 需要 ChatGPT 登录。

## 选项 A: OpenAI API 密钥 (OpenAI Platform)

**适用于:** 直接 API 访问和基于使用量的计费。
从 OpenAI 仪表板获取您的 API 密钥。

### CLI 设置

```bash
openclaw onboard --auth-choice openai-api-key
# 或非交互式
openclaw onboard --openai-api-key "$OPENAI_API_KEY"
```

### 配置片段

```json5
{
  env: { OPENAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "openai/gpt-5.2" } } },
}
```

## 选项 B: OpenAI Code (Codex) 订阅

**适用于:** 使用 ChatGPT/Codex 订阅访问而不是 API 密钥。
Codex cloud 需要 ChatGPT 登录，而 Codex CLI 支持 ChatGPT 或 API 密钥登录。

### CLI 设置 (Codex OAuth)

```bash
# 在向导中运行 Codex OAuth
openclaw onboard --auth-choice openai-codex

# 或直接运行 OAuth
openclaw models auth login --provider openai-codex
```

### 配置片段 (Codex 订阅)

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.3-codex" } } },
}
```

### 传输默认值

OpenClaw 使用 `pi-ai` 进行模型流式传输。对于 `openai/*` 和 `openai-codex/*`，默认传输为 `"auto"`（WebSocket 优先，然后 SSE 回退）。

您可以设置 `agents.defaults.models.<provider/model>.params.transport`：

- `"sse"`：强制 SSE
- `"websocket"`：强制 WebSocket
- `"auto"`：尝试 WebSocket，然后回退到 SSE

对于 `openai/*`（Responses API），OpenClaw 在使用 WebSocket 传输时默认启用 WebSocket 预热（`openaiWsWarmup: true`）。

相关 OpenAI 文档：

- [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
- [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

```json5
{
  agents: {
    defaults: {
      model: { primary: "openai-codex/gpt-5.3-codex" },
      models: {
        "openai-codex/gpt-5.3-codex": {
          params: {
            transport: "auto",
          },
        },
      },
    },
  },
}
```

### OpenAI WebSocket 预热

OpenAI 文档将预热描述为可选。OpenClaw 默认为 `openai/*` 启用预热，以在使用 WebSocket 传输时减少首轮延迟。

### 禁用预热

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.2": {
          params: {
            openaiWsWarmup: false,
          },
        },
      },
    },
  },
}
```

### 显式启用预热

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.2": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### OpenAI Responses 服务端压缩

对于直接 OpenAI Responses 模型（使用 `api.openai.com` 上 `baseUrl` 的 `api: "openai-responses"` 的 `openai/*`），OpenClaw 现在自动启用 OpenAI 服务端压缩有效负载提示：

- 强制 `store: true`（除非模型兼容性设置 `supportsStore: false`）
- 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`

默认情况下，`compact_threshold` 为模型 `contextWindow` 的 `70%`（或不可用时为 `80000`）。

### 显式启用服务端压缩

在您想强制在兼容的 Responses 模型上注入 `context_management` 时使用此选项（例如 Azure OpenAI Responses）：

```json5
{
  agents: {
    defaults: {
      models: {
        "azure-openai-responses/gpt-5.2": {
          params: {
            responsesServerCompaction: true,
          },
        },
      },
    },
  },
}
```

### 使用自定义阈值启用

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.2": {
          params: {
            responsesServerCompaction: true,
            responsesCompactThreshold: 120000,
          },
        },
      },
    },
  },
}
```

### 禁用服务端压缩

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.2": {
          params: {
            responsesServerCompaction: false,
          },
        },
      },
    },
  },
}
```

`responsesServerCompaction` 仅控制 `context_management` 注入。
直接 OpenAI Responses 模型仍然强制 `store: true`，除非兼容性设置 `supportsStore: false`。

## 注意事项

- 模型引用始终使用 `provider/model`（参见 [/concepts/models](/concepts/models)）。
- 身份验证详细信息 + 重用规则在 [/concepts/oauth](/concepts/oauth) 中。
