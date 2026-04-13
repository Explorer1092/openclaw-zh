---
mmh3_hash: "35cc91eb0b80aaadaa164b5b40cbf526"
title: "OpenAI"
summary: "在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI"
read_when:
  - 您想在 OpenClaw 中使用 OpenAI 模型
  - 您想使用 Codex 订阅身份验证而不是 API 密钥
  - 您需要更严格的 GPT-5 Agent 执行行为
---

# OpenAI

OpenAI 为 GPT 模型提供开发者 API。OpenClaw 支持两种身份验证方式：

- **API 密钥** — 直接访问 OpenAI Platform，按使用量计费（`openai/*` 模型）
- **Codex 订阅** — ChatGPT/Codex 登录，订阅式访问（`openai-codex/*` 模型）

OpenAI 明确支持在 OpenClaw 等外部工具/工作流中使用订阅 OAuth。

## 快速开始

选择您偏好的身份验证方式并按照设置步骤操作。

<Tabs>
  <Tab title="API 密钥（OpenAI Platform）">
    **适合：** 直接 API 访问和按使用量计费。

    <Steps>
      <Step title="获取 API 密钥">
        从 [OpenAI Platform 仪表板](https://platform.openai.com/api-keys) 创建或复制 API 密钥。
      </Step>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或直接传递密钥：

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用 | 路由 | 身份验证 |
    |-----------|-------|------|
    | `openai/gpt-5.4` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-pro` | 直接 OpenAI Platform API | `OPENAI_API_KEY` |

    <Note>
    ChatGPT/Codex 登录通过 `openai-codex/*` 路由，而非 `openai/*`。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.4" } } },
    }
    ```

    <Warning>
    OpenClaw **不**在直接 API 路径上公开 `openai/gpt-5.3-codex-spark`。实际 OpenAI API 请求会拒绝该模型。Spark 仅限 Codex 使用。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **适合：** 使用 ChatGPT/Codex 订阅而不是单独的 API 密钥。Codex 云需要 ChatGPT 登录。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.4
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用 | 路由 | 身份验证 |
    |-----------|-------|------|
    | `openai-codex/gpt-5.4` | ChatGPT/Codex OAuth | Codex 登录 |
    | `openai-codex/gpt-5.3-codex-spark` | ChatGPT/Codex OAuth | Codex 登录（受权限限制） |

    <Note>
    此路由与 `openai/gpt-5.4` 有意分开。使用 `openai/*` 加 API 密钥进行直接 Platform 访问，使用 `openai-codex/*` 进行 Codex 订阅访问。
    </Note>

    ### 配置示例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.4" } } },
    }
    ```

    <Tip>
    如果入门重用了现有的 Codex CLI 登录，这些凭据将由 Codex CLI 管理。到期时，OpenClaw 首先重新读取外部 Codex 源，并将刷新的凭据写回 Codex 存储。
    </Tip>

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为独立的值。

    对于 `openai-codex/gpt-5.4`：

    - 原生 `contextWindow`：`1050000`
    - 默认运行时 `contextTokens` 上限：`272000`

    较小的默认上限在实践中具有更好的延迟和质量特性。通过 `contextTokens` 覆盖：

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.4", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    使用 `contextWindow` 声明原生模型元数据。使用 `contextTokens` 限制运行时上下文预算。
    </Note>

  </Tab>
</Tabs>

## 图像生成

内置的 `openai` Plugin 通过 `image_generate` 工具注册图像生成。

| 能力                | 值                                 |
| ----------------------- | ---------------------------------- |
| 默认模型            | `openai/gpt-image-1`               |
| 每次请求最大图像数  | 4                                  |
| 编辑模式            | 已启用（最多 5 张参考图像）        |
| 尺寸覆盖            | 支持                               |
| 宽高比/分辨率       | 不转发给 OpenAI Images API         |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-1" },
    },
  },
}
```

<Note>
有关共享工具参数、Provider 选择和故障转移行为，请参见[图像生成](/tools/image-generation)。
</Note>

## 视频生成

内置的 `openai` Plugin 通过 `video_generate` 工具注册视频生成。

| 能力          | 值                                                                             |
| ---------------- | --------------------------------------------------------------------------------- |
| 默认模型      | `openai/sora-2`                                                                   |
| 模式          | 文本到视频、图像到视频、单视频编辑                                                |
| 参考输入      | 1 张图像或 1 个视频                                                               |
| 尺寸覆盖      | 支持                                                                              |
| 其他覆盖      | `aspectRatio`、`resolution`、`audio`、`watermark` 被忽略并作为工具警告报告        |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
有关共享工具参数、Provider 选择和故障转移行为，请参见[视频生成](/tools/video-generation)。
</Note>

## 个性叠加层

OpenClaw 为 `openai/*` 和 `openai-codex/*` 运行添加小型 OpenAI 特定提示叠加层。该叠加层使助手保持热情、协作、简洁，并且在不替换基本系统提示的情况下更具情感表达力。

| 值                     | 效果                               |
| ---------------------- | ---------------------------------- |
| `"friendly"`（默认）   | 启用 OpenAI 特定叠加层             |
| `"on"`                 | `"friendly"` 的别名               |
| `"off"`                | 仅使用基本 OpenClaw 提示           |

<Tabs>
  <Tab title="配置">
    ```json5
    {
      plugins: {
        entries: {
          openai: { config: { personality: "friendly" } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set plugins.entries.openai.config.personality off
    ```
  </Tab>
</Tabs>

<Tip>
值在运行时不区分大小写，因此 `"Off"` 和 `"off"` 都可以禁用叠加层。
</Tip>

## 语音和语音合成

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置的 `openai` Plugin 为 `messages.tts` 接口注册语音合成。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `messages.tts.providers.openai.model` | `gpt-4o-mini-tts` |
    | 音色 | `messages.tts.providers.openai.voice` | `coral` |
    | 速度 | `messages.tts.providers.openai.speed` | （未设置） |
    | 指令 | `messages.tts.providers.openai.instructions` | （未设置，仅 `gpt-4o-mini-tts`） |
    | 格式 | `messages.tts.providers.openai.responseFormat` | 语音备注为 `opus`，文件为 `mp3` |
    | API 密钥 | `messages.tts.providers.openai.apiKey` | 回退到 `OPENAI_API_KEY` |
    | Base URL | `messages.tts.providers.openai.baseUrl` | `https://api.openai.com/v1` |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用音色：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS Base URL 而不影响聊天 API 端点。
    </Note>

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` Plugin 为 Voice Call Plugin 注册实时转录。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，采用 G.711 u-law 音频。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` Plugin 为 Voice Call Plugin 注册实时语音。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime` |
    | 音色 | `...openai.voice` | `alloy` |
    | 温度 | `...openai.temperature` | `0.8` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | 静音时长 | `...openai.silenceDurationMs` | `500` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    通过 `azureEndpoint` 和 `azureDeployment` 配置键支持 Azure OpenAI。支持双向工具调用。使用 G.711 u-law 音频格式。
    </Note>

  </Accordion>
</AccordionGroup>

## 高级配置

<AccordionGroup>
  <Accordion title="传输方式（WebSocket vs SSE）">
    OpenClaw 对 `openai/*` 和 `openai-codex/*` 都使用 WebSocket 优先、SSE 回退（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw：
    - 在回退到 SSE 之前重试一次早期的 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级约 60 秒，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的 Session 和轮次标识标头
    - 跨传输变体规范化使用计数器（`input_tokens` / `prompt_tokens`）

    | 值 | 行为 |
    |-------|----------|
    | `"auto"`（默认） | WebSocket 优先，SSE 回退 |
    | `"sse"` | 强制仅使用 SSE |
    | `"websocket"` | 强制仅使用 WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai-codex/gpt-5.4": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    相关 OpenAI 文档：
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="WebSocket 预热">
    OpenClaw 默认为 `openai/*` 启用 WebSocket 预热，以减少第一轮延迟。

    ```json5
    // 禁用预热
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": {
              params: { openaiWsWarmup: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="快速模式">
    OpenClaw 为 `openai/*` 和 `openai-codex/*` 提供共享的快速模式切换：

    - **聊天/UI：** `/fast status|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用时，OpenClaw 将快速模式映射到 OpenAI 优先处理（`service_tier = "priority"`）。现有的 `service_tier` 值会被保留，快速模式不重写 `reasoning` 或 `text.verbosity`。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { fastMode: true } },
            "openai-codex/gpt-5.4": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Session 覆盖优先于配置。在 Sessions UI 中清除 Session 覆盖会将 Session 恢复为配置的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 公开优先处理。在 OpenClaw 中按模型设置：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.4": { params: { serviceTier: "priority" } },
            "openai-codex/gpt-5.4": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    支持的值：`auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` 仅转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果您通过代理路由任一 Provider，OpenClaw 不会修改 `service_tier`。
    </Warning>

  </Accordion>

  <Accordion title="服务器端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenClaw 自动启用服务器端压缩：

    - 强制 `store: true`（除非模型兼容设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    <Tabs>
      <Tab title="显式启用">
        适用于 Azure OpenAI Responses 等兼容端点：

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.4": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="自定义阈值">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
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
      </Tab>
      <Tab title="禁用">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.4": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` 仅控制 `context_management` 注入。直接 OpenAI Responses 模型仍然强制 `store: true`，除非兼容设置了 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="严格 Agent GPT 模式">
    对于 `openai/*` 和 `openai-codex/*` 上的 GPT-5 系列运行，OpenClaw 可以使用更严格的嵌入式执行契约：

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    使用 `strict-agentic` 时，OpenClaw：
    - 当有工具操作可用时，不再将仅计划的轮次视为成功进展
    - 使用立即行动的引导重试该轮次
    - 为重要工作自动启用 `update_plan`
    - 如果模型持续计划而不行动，则显示明确的阻塞状态

    <Note>
    仅限于 OpenAI 和 Codex GPT-5 系列运行。其他 Provider 和旧模型系列保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生路由与 OpenAI 兼容路由">
    OpenClaw 对直接 OpenAI、Codex 和 Azure OpenAI 端点的处理方式与通用 OpenAI 兼容 `/v1` 代理不同：

    **原生路由**（`openai/*`、`openai-codex/*`、Azure OpenAI）：
    - 当推理被显式禁用时，保持 `reasoning: { effort: "none" }` 不变
    - 默认工具 Schema 为严格模式
    - 仅在已验证的原生主机上附加隐藏的归因标头
    - 保留 OpenAI 专属请求塑形（`service_tier`、`store`、推理兼容、提示缓存提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 不强制严格工具 Schema 或原生专属标头

    Azure OpenAI 使用原生传输和兼容行为，但不接收隐藏的归因标头。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="图像生成" href="/tools/image-generation" icon="image">
    共享图像工具参数和 Provider 选择。
  </Card>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    共享视频工具参数和 Provider 选择。
  </Card>
  <Card title="OAuth 和身份验证" href="/gateway/authentication" icon="key">
    身份验证详情和凭据重用规则。
  </Card>
</CardGroup>
