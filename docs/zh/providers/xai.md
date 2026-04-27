---
mmh3_hash: "702ec52463e915a6a3d1494b014df6a0"
title: "xAI"
summary: "在 OpenClaw 中使用 xAI Grok 模型"
read_when:
  - 您想在 OpenClaw 中使用 Grok 模型
  - 您正在配置 xAI 身份验证或模型 ID
---

OpenClaw 内置了 `xai` Provider Plugin，用于 Grok 模型。

## 快速开始

<Steps>
  <Step title="创建 API 密钥">
    在 [xAI 控制台](https://console.x.ai/)中创建 API 密钥。
  </Step>
  <Step title="设置 API 密钥">
    设置 `XAI_API_KEY`，或运行：

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="选择模型">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
OpenClaw 使用 xAI Responses API 作为内置 xAI 传输。同一个
`XAI_API_KEY` 还可以驱动 Grok 支持的 `web_search`、一级 `x_search`
和远程 `code_execution`。
如果您在 `plugins.entries.xai.config.webSearch.apiKey` 下存储了 xAI 密钥，
内置 xAI 模型 Provider 也会将其作为回退密钥。
`code_execution` 调优在 `plugins.entries.xai.config.codeExecution` 下配置。
</Note>

## 内置目录

OpenClaw 开箱即包含以下 xAI 模型系列：

| 系列           | 模型 ID                                                                  |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`、`grok-3-fast`、`grok-3-mini`、`grok-3-mini-fast`               |
| Grok 4         | `grok-4`、`grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`、`grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`、`grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`、`grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

Plugin 还会前向解析遵循相同 API 形态的新版 `grok-4*` 和 `grok-code-fast*` ID。

<Tip>
`grok-4-fast`、`grok-4-1-fast` 和 `grok-4.20-beta-*` 变体是
内置目录中当前支持图像的 Grok 引用。
</Tip>

## OpenClaw 功能覆盖

内置 Plugin 将 xAI 当前公开的 API 接口映射到 OpenClaw 的共享 Provider 和工具合约上。不符合共享合约的功能（例如流式 TTS 和实时语音）不对外暴露——详见下表。

| xAI 功能             | OpenClaw 接口                             | 状态                                                              |
| -------------------- | ----------------------------------------- | ----------------------------------------------------------------- |
| Chat / Responses     | `xai/<model>` 模型 Provider               | 是                                                                |
| 服务端 Web 搜索      | `web_search` Provider `grok`              | 是                                                                |
| 服务端 X 搜索        | `x_search` 工具                           | 是                                                                |
| 服务端代码执行       | `code_execution` 工具                     | 是                                                                |
| 图像                 | `image_generate`                          | 是                                                                |
| 视频                 | `video_generate`                          | 是                                                                |
| 批量文本转语音       | `messages.tts.provider: "xai"` / `tts`    | 是                                                                |
| 流式 TTS             | —                                         | 未暴露；OpenClaw 的 TTS 合约在回复投递前需要完整音频缓冲区        |
| 批量语音转文字       | `tools.media.audio` / 媒体理解            | 是                                                                |
| 流式语音转文字       | Voice Call `streaming.provider: "xai"`    | 是                                                                |
| 实时语音             | —                                         | 尚未暴露；需要不同的 Session/WebSocket 合约                       |
| 文件 / 批处理        | 仅通用模型 API 兼容性                     | 非一级 OpenClaw 工具                                              |

<Note>
OpenClaw 使用 xAI 的 REST 图像/视频/TTS/STT API 进行媒体生成、语音和批量转录，使用 xAI 的流式 STT WebSocket 进行实时语音通话转录，使用 Responses API 进行模型、搜索和代码执行工具。需要不同 OpenClaw 合约的功能（如实时语音 Session）在此作为上游能力记录，而不是隐藏的 Plugin 行为。
</Note>

### 快速模式映射

`/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true`
按如下方式重写原生 xAI 请求：

| 源模型        | 快速模式目标       |
| ------------- | ------------------ |
| `grok-3`      | `grok-3-fast`      |
| `grok-3-mini` | `grok-3-mini-fast` |
| `grok-4`      | `grok-4-fast`      |
| `grok-4-0709` | `grok-4-fast`      |

### 旧版兼容别名

旧版别名仍会规范化到内置的规范 ID：

| 旧版别名                  | 规范 ID                               |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## 功能

<AccordionGroup>
  <Accordion title="Web 搜索">
    内置的 `grok` Web 搜索 Provider 同样使用 `XAI_API_KEY`：

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="视频生成">
    内置的 `xai` Plugin 通过共享的 `video_generate` 工具注册视频生成。

    - 默认视频模型：`xai/grok-imagine-video`
    - 模式：文本到视频、图像到视频、参考图像生成、远程视频编辑和远程视频延长
    - 纵横比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`3:2`、`2:3`
    - 分辨率：`480P`、`720P`
    - 时长：生成/图像到视频为 1-15 秒，使用 `reference_image` 角色时为 1-10 秒，延长时为 2-10 秒
    - 参考图像生成：将每张提供图像的 `imageRoles` 设置为 `reference_image`；xAI 最多接受 7 张此类图像

    <Warning>
    不接受本地视频缓冲区。视频编辑/延长输入请使用远程 `http(s)` URL。图像到视频接受本地图像缓冲区，因为 OpenClaw 可以将其编码为 data URL 发送给 xAI。
    </Warning>

    将 xAI 设置为默认视频 Provider：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    请参见[视频生成](/tools/video-generation)了解共享工具参数、Provider 选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="图像生成">
    内置的 `xai` Plugin 通过共享的 `image_generate` 工具注册图像生成。

    - 默认图像模型：`xai/grok-imagine-image`
    - 附加模型：`xai/grok-imagine-image-pro`
    - 模式：文本到图像和参考图像编辑
    - 参考输入：一张 `image` 或最多五张 `images`
    - 纵横比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 数量：最多 4 张图像

    OpenClaw 向 xAI 请求 `b64_json` 图像响应，使生成的媒体可以通过正常的 Channel 附件路径存储和投递。本地参考图像会被转换为 data URL；远程 `http(s)` 引用则直接传递。

    将 xAI 设置为默认图像 Provider：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "xai/grok-imagine-image",
          },
        },
      },
    }
    ```

    <Note>
    xAI 还记录了 `quality`、`mask`、`user` 以及其他原生比例如 `1:2`、`2:1`、`9:20` 和 `20:9`。OpenClaw 目前仅转发共享的跨 Provider 图像控制参数；不支持的原生专用旋钮不通过 `image_generate` 暴露。
    </Note>

  </Accordion>

  <Accordion title="文本转语音">
    内置的 `xai` Plugin 通过共享的 `tts` Provider 接口注册文本转语音。

    - 声音：`eve`、`ara`、`rex`、`sal`、`leo`、`una`
    - 默认声音：`eve`
    - 格式：`mp3`、`wav`、`pcm`、`mulaw`、`alaw`
    - 语言：BCP-47 代码或 `auto`
    - 速度：Provider 原生速度覆盖
    - 不支持原生 Opus 语音备注格式

    将 xAI 设置为默认 TTS Provider：

    ```json5
    {
      messages: {
        tts: {
          provider: "xai",
          providers: {
            xai: {
              voiceId: "eve",
            },
          },
        },
      },
    }
    ```

    <Note>
    OpenClaw 使用 xAI 的批量 `/v1/tts` 端点。xAI 还通过 WebSocket 提供流式 TTS，但 OpenClaw 语音 Provider 合约目前在回复投递前需要完整的音频缓冲区。
    </Note>

  </Accordion>

  <Accordion title="语音转文字">
    内置的 `xai` Plugin 通过 OpenClaw 的媒体理解转录接口注册批量语音转文字。

    - 默认模型：`grok-stt`
    - 端点：xAI REST `/v1/stt`
    - 输入路径：multipart 音频文件上传
    - OpenClaw 中使用 `tools.media.audio` 的入站音频转录均支持，包括 Discord 语音频道片段和 Channel 音频附件

    强制 xAI 处理入站音频转录：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "xai",
                model: "grok-stt",
              },
            ],
          },
        },
      },
    }
    ```

    语言可通过共享的音频媒体配置或每次调用的转录请求提供。OpenClaw 共享接口接受提示词提示，但 xAI REST STT 集成仅转发文件、模型和语言，因为这些参数能清晰映射到当前公开的 xAI 端点。

  </Accordion>

  <Accordion title="流式语音转文字">
    内置的 `xai` Plugin 还为实时语音通话音频注册了实时转录 Provider。

    - 端点：xAI WebSocket `wss://api.x.ai/v1/stt`
    - 默认编码：`mulaw`
    - 默认采样率：`8000`
    - 默认端点检测：`800ms`
    - 中间转录：默认启用

    Voice Call 的 Twilio 媒体流发送 G.711 µ-law 音频帧，因此 xAI Provider 可以直接转发这些帧而无需转码：

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}",
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

    Provider 专属配置位于 `plugins.entries.voice-call.config.streaming.providers.xai`。支持的键包括 `apiKey`、`baseUrl`、`sampleRate`、`encoding`（`pcm`、`mulaw` 或 `alaw`）、`interimResults`、`endpointingMs` 和 `language`。

    <Note>
    此流式 Provider 用于 Voice Call 的实时转录路径。Discord 语音目前录制短片段，并使用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="x_search 配置">
    内置 xAI Plugin 将 `x_search` 作为 OpenClaw 工具公开，用于通过 Grok 搜索
    X（原 Twitter）内容。

    配置路径：`plugins.entries.xai.config.xSearch`

    | 键                 | 类型    | 默认值             | 描述                                 |
    | ------------------ | ------- | ------------------ | ------------------------------------ |
    | `enabled`          | boolean | —                  | 启用或禁用 x_search                  |
    | `model`            | string  | `grok-4-1-fast`    | 用于 x_search 请求的模型             |
    | `inlineCitations`  | boolean | —                  | 在结果中包含内联引用                 |
    | `maxTurns`         | number  | —                  | 最大对话轮次                         |
    | `timeoutSeconds`   | number  | —                  | 请求超时（秒）                       |
    | `cacheTtlMinutes`  | number  | —                  | 缓存有效时间（分钟）                 |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="代码执行配置">
    内置 xAI Plugin 将 `code_execution` 作为 OpenClaw 工具公开，用于在
    xAI 沙箱环境中远程执行代码。

    配置路径：`plugins.entries.xai.config.codeExecution`

    | 键                | 类型    | 默认值                    | 描述                                     |
    | ----------------- | ------- | ------------------------- | ---------------------------------------- |
    | `enabled`         | boolean | `true`（密钥可用时）       | 启用或禁用代码执行                        |
    | `model`           | string  | `grok-4-1-fast`           | 用于代码执行请求的模型                   |
    | `maxTurns`        | number  | —                         | 最大对话轮次                             |
    | `timeoutSeconds`  | number  | —                         | 请求超时（秒）                           |

    <Note>
    这是远程 xAI 沙箱执行，不是本地 [`exec`](/tools/exec)。
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="已知限制">
    - 目前仅支持 API 密钥身份验证，OpenClaw 尚未实现 xAI OAuth 或设备码流程。
    - `grok-4.20-multi-agent-experimental-beta-0304` 不支持常规 xAI Provider 路径，
      因为它需要与标准 OpenClaw xAI 传输不同的上游 API 接口。
    - xAI 实时语音尚未注册为 OpenClaw Provider。它需要与批量 STT 或流式转录不同的双向语音 Session 合约。
    - xAI 图像 `quality`、图像 `mask` 和额外的原生专用纵横比在共享 `image_generate` 工具具备对应的跨 Provider 控制之前不对外暴露。
  </Accordion>

  <Accordion title="高级说明">
    - OpenClaw 会在共享运行路径上自动应用 xAI 专属的工具 Schema 和工具调用兼容性修复。
    - 原生 xAI 请求默认启用 `tool_stream: true`。将 `agents.defaults.models["xai/<model>"].params.tool_stream` 设置为 `false` 可禁用它。
    - 内置 xAI 封装器在发送原生 xAI 请求前会剥离不支持的严格工具 Schema 标志和推理负载键。
    - `web_search`、`x_search` 和 `code_execution` 作为 OpenClaw 工具公开。OpenClaw 在每次工具请求中启用所需的具体 xAI 内置工具，而不是在每次聊天轮次中附加所有原生工具。
    - `x_search` 和 `code_execution` 由内置 xAI Plugin 管理，而非硬编码到核心模型运行时中。
    - `code_execution` 是远程 xAI 沙箱执行，不是本地 [`exec`](/tools/exec)。
  </Accordion>
</AccordionGroup>

## 实时测试

xAI 媒体路径由单元测试和可选加入的实时测试套件覆盖。实时命令在探测 `XAI_API_KEY` 之前从您的登录 Shell（包括 `~/.profile`）加载密钥。

```bash
pnpm test extensions/xai
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 pnpm test:live -- extensions/xai/xai.live.test.ts
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_TEST_QUIET=1 OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS=xai pnpm test:live -- test/image-generation.runtime.live.test.ts
```

Provider 专属实时文件会合成普通 TTS、电话友好的 PCM TTS，通过 xAI 批量 STT 转录音频，通过 xAI 实时 STT 流式传输相同的 PCM，生成文本到图像输出，并编辑参考图像。共享图像实时文件通过 OpenClaw 的运行时选择、回退、规范化和媒体附件路径验证同一 xAI Provider。

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    共享视频工具参数和 Provider 选择。
  </Card>
  <Card title="所有 Provider" href="/providers/index" icon="grid-2">
    更广泛的 Provider 概览。
  </Card>
  <Card title="故障排查" href="/help/troubleshooting" icon="wrench">
    常见问题和修复方法。
  </Card>
</CardGroup>
