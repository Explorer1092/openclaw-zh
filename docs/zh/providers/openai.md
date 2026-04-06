---
mmh3_hash: "fb7f42fcd87f3b6708c09cbc3a907b05"
title: "OpenAI"
sidebarTitle: "OpenAI"
summary: "在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI"
read_when:
  - 您想在 OpenClaw 中使用 OpenAI 模型
  - 您想使用 Codex 订阅身份验证而不是 API 密钥
---

# OpenAI

OpenAI 为 GPT 模型提供开发者 API。Codex 支持 **ChatGPT 登录**进行订阅访问，或 **API 密钥**登录进行基于使用量的访问。Codex 云需要 ChatGPT 登录。OpenAI 明确支持在 OpenClaw 等外部工具/工作流中使用订阅 OAuth。

## 默认交互风格

OpenClaw 可以为 `openai/*` 和 `openai-codex/*` 运行添加小型 OpenAI 特定提示叠加层。默认情况下，叠加层使助手保持热情、协作、简洁、直接，并且在不替换基本 OpenClaw 系统提示的情况下更具情感表达力。友好叠加层也允许偶尔使用适合自然表达的表情符号，同时保持整体输出简洁。

配置键：

`plugins.entries.openai.config.personality`

允许的值：

- `"friendly"`：默认；启用 OpenAI 特定叠加层。
- `"off"`：禁用叠加层，仅使用基本 OpenClaw 提示。

范围：

- 适用于 `openai/*` 模型。
- 适用于 `openai-codex/*` 模型。
- 不影响其他 Provider。

此行为默认开启。如果您希望在未来的本地配置变更中保留该配置，请显式保留 `"friendly"`：

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "friendly",
        },
      },
    },
  },
}
```

### 禁用 OpenAI 提示叠加层

如果您想使用未修改的基本 OpenClaw 提示，请将叠加层设置为 `"off"`：

```json5
{
  plugins: {
    entries: {
      openai: {
        config: {
          personality: "off",
        },
      },
    },
  },
}
```

您也可以直接使用配置 CLI 设置：

```bash
openclaw config set plugins.entries.openai.config.personality off
```

## 选项 A：OpenAI API 密钥（OpenAI Platform）

**适用于：** 直接 API 访问和基于使用量的计费。从 OpenAI 仪表板获取您的 API 密钥。

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
  agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
}
```

OpenAI 当前的 API 模型文档列出了 `gpt-5.4` 和 `gpt-5.4-pro` 用于直接 OpenAI API 使用。OpenClaw 通过 `openai/*` Responses 路径转发两者。

## 图像生成

内置的 `openai` 插件也通过共享的 `image_generate` 工具注册图像生成。

- 默认图像模型：`openai/gpt-image-1`
- 每次请求最多生成 4 张图像
- 编辑模式：已启用，最多 5 张参考图像
- 支持 `size`
- 当前 OpenAI 特定注意事项：OpenClaw 目前不向 OpenAI Images API 转发 `aspectRatio` 或 `resolution` 覆盖

将 OpenAI 设置为默认图像 Provider：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

请参阅[图像生成](/tools/image-generation)了解共享工具参数、Provider 选择和故障转移行为。

## 视频生成

内置的 `openai` 插件也通过共享的 `video_generate` 工具注册视频生成。

- 默认视频模型：`openai/sora-2`
- 模式：文本到视频、图像到视频和单视频参考/编辑流程
- 当前限制：1 张图像或 1 个视频参考输入
- 当前 OpenAI 特定注意事项：OpenClaw 目前仅为原生 OpenAI 视频生成转发 `size` 覆盖。不支持的可选覆盖如 `aspectRatio`、`resolution`、`audio` 和 `watermark` 会被忽略并作为工具警告报告。

将 OpenAI 设置为默认视频 Provider：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openai/sora-2",
      },
    },
  },
}
```

请参阅[视频生成](/tools/video-generation)了解共享工具参数、Provider 选择和故障转移行为。

## 选项 B：OpenAI Code（Codex）订阅

**适用于：** 使用 ChatGPT/Codex 订阅访问而不是 API 密钥。Codex 云需要 ChatGPT 登录，而 Codex CLI 支持 ChatGPT 或 API 密钥登录。

### CLI 设置（Codex OAuth）

```bash
# 在向导中运行 Codex OAuth
openclaw onboard --auth-choice openai-codex

# 或直接运行 OAuth
openclaw models auth login --provider openai-codex
```

### 配置片段（Codex 订阅）

```json5
{
  agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
}
```

如果入门重用了现有的 Codex CLI 登录，这些凭据将由 Codex CLI 管理。到期时，OpenClaw 首先重新读取外部 Codex 源，当 Provider 可以刷新时，将刷新的凭据写回 Codex 存储，而不是在单独的 OpenClaw 专用副本中取得所有权。

### Codex 上下文窗口上限

OpenClaw 将 Codex 模型元数据和运行时上下文上限视为独立的值。

对于 `openai-codex/gpt-5.4`：

- 原生 `contextWindow`：`1050000`
- 默认运行时 `contextTokens` 上限：`272000`

这样可以保持模型元数据的真实性，同时保留在实践中具有更好延迟和质量特性的较小默认运行时窗口。

如果您想要不同的有效上限，请设置 `models.providers.<provider>.models[].contextTokens`：

```json5
{
  models: {
    providers: {
      "openai-codex": {
        models: [
          {
            id: "gpt-5.4",
            contextTokens: 160000,
          },
        ],
      },
    },
  },
}
```

仅在声明或覆盖原生模型元数据时使用 `contextWindow`。当您想限制运行时上下文预算时使用 `contextTokens`。

### 传输默认值

OpenClaw 使用 `pi-ai` 进行模型流式传输。对于 `openai/*` 和 `openai-codex/*`，默认传输为 `"auto"`（WebSocket 优先，然后 SSE 回退）。

在 `"auto"` 模式下，OpenClaw 在回退到 SSE 之前还会重试一次早期的可重试 WebSocket 失败。强制 `"websocket"` 模式仍然直接暴露传输错误，而不是将其隐藏在回退之后。

在 `"auto"` 模式下连接或早期轮次 WebSocket 失败后，OpenClaw 将该 Session 的 WebSocket 路径标记为降级约 60 秒，并在冷却期间通过 SSE 发送后续轮次，而不是在传输之间反复切换。

您可以设置 `agents.defaults.models.<provider/model>.params.transport`：

- `"sse"`：强制 SSE
- `"websocket"`：强制 WebSocket
- `"auto"`：尝试 WebSocket，然后回退到 SSE

对于 `openai/*`（Responses API），当使用 WebSocket 传输时，OpenClaw 默认启用 WebSocket 预热（`openaiWsWarmup: true`）。

### OpenAI WebSocket 预热

OpenAI 文档描述预热为可选。OpenClaw 默认为 `openai/*` 启用它，以减少使用 WebSocket 传输时第一轮的延迟。

### 禁用预热

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
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
        "openai/gpt-5.4": {
          params: {
            openaiWsWarmup: true,
          },
        },
      },
    },
  },
}
```

### OpenAI 和 Codex 优先处理

OpenAI 的 API 通过 `service_tier=priority` 暴露优先处理。在 OpenClaw 中，设置 `agents.defaults.models["<provider>/<model>"].params.serviceTier` 以在原生 OpenAI/Codex Responses 端点上传递该字段。

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
        "openai-codex/gpt-5.4": {
          params: {
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

支持的值为 `auto`、`default`、`flex` 和 `priority`。

### OpenAI 快速模式

OpenClaw 为 `openai/*` 和 `openai-codex/*` Session 公开共享的快速模式切换：

- 聊天/UI：`/fast status|on|off`
- 配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`

启用快速模式时，OpenClaw 将其映射到 OpenAI 优先处理：

- 对 `api.openai.com` 的直接 `openai/*` Responses 调用发送 `service_tier = "priority"`
- 对 `chatgpt.com/backend-api` 的 `openai-codex/*` Responses 调用也发送 `service_tier = "priority"`
- 现有的负载 `service_tier` 值会被保留
- 快速模式不重写 `reasoning` 或 `text.verbosity`

### OpenAI Responses 服务器端压缩

对于直接 OpenAI Responses 模型（使用 `api.openai.com` 上 `baseUrl` 的 `api: "openai-responses"` 的 `openai/*`），OpenClaw 现在自动启用 OpenAI 服务器端压缩负载提示：

- 强制 `store: true`（除非模型兼容设置了 `supportsStore: false`）
- 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`

默认情况下，`compact_threshold` 为模型 `contextWindow` 的 70%（不可用时为 `80000`）。

## 注意事项

- 模型引用始终使用 `provider/model`（参见 [/concepts/models](/concepts/models)）。
- 身份验证详细信息 + 重用规则在 [/concepts/oauth](/concepts/oauth) 中。
