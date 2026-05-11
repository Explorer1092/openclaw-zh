---
title: "Google (Gemini)"
mmh3_hash: "af9d5eee9cec78b815a5813c2b285b74"
summary: "Google Gemini 设置（API 密钥 + OAuth、图像生成、媒体理解、TTS、Web 搜索）"
read_when:
  - 您想在 OpenClaw 中使用 Google Gemini 模型
  - 您需要 API 密钥或 OAuth 身份验证流程
---

Google 插件通过 Google AI Studio 提供对 Gemini 模型的访问，以及图像生成、媒体理解（图像/音频/视频）、文本转语音和通过 Gemini Grounding 实现的 Web 搜索。

- Provider：`google`
- 身份验证：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API
- 运行时选项：Provider/模型 `agentRuntime.id: "google-gemini-cli"` 复用 Gemini CLI OAuth，同时将模型引用保持为规范的 `google/*` 形式。

## 快速开始

选择您首选的身份验证方式并按照设置步骤操作。

<Tabs>
  <Tab title="API 密钥">
    **最适合：** 通过 Google AI Studio 的标准 Gemini API 访问。

    <Steps>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice gemini-api-key
        ```

        或直接传递密钥：

        ```bash
        openclaw onboard --non-interactive \
          --mode local \
          --auth-choice gemini-api-key \
          --gemini-api-key "$GEMINI_API_KEY"
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "google/gemini-3.1-pro-preview" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    <Tip>
    环境变量 `GEMINI_API_KEY` 和 `GOOGLE_API_KEY` 均可接受。使用您已配置的任意一个。
    </Tip>

  </Tab>

  <Tab title="Gemini CLI（OAuth）">
    **最适合：** 通过 PKCE OAuth 复用现有的 Gemini CLI 登录，而不需要单独的 API 密钥。

    <Warning>
    `google-gemini-cli` Provider 是非官方集成。部分用户反映以这种方式使用 OAuth 会导致账户受限。使用风险自担。
    </Warning>

    <Steps>
      <Step title="安装 Gemini CLI">
        本地 `gemini` 命令必须在 `PATH` 中可用。

        ```bash
        # Homebrew
        brew install gemini-cli

        # 或 npm
        npm install -g @google/gemini-cli
        ```

        OpenClaw 支持 Homebrew 安装和全局 npm 安装，包括常见的 Windows/npm 布局。
      </Step>
      <Step title="通过 OAuth 登录">
        ```bash
        openclaw models auth login --provider google-gemini-cli --set-default
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider google
        ```
      </Step>
    </Steps>

    - 默认模型：`google/gemini-3.1-pro-preview`
    - 运行时：`google-gemini-cli`
    - 别名：`gemini-cli`

    Gemini 3.1 Pro 的 Gemini API 模型 id 为 `gemini-3.1-pro-preview`。OpenClaw 接受较短的 `google/gemini-3.1-pro` 作为便捷别名，并在调用 Provider 前将其规范化。

    **环境变量：**

    - `OPENCLAW_GEMINI_OAUTH_CLIENT_ID`
    - `OPENCLAW_GEMINI_OAUTH_CLIENT_SECRET`

    （或 `GEMINI_CLI_*` 变体。）

    <Note>
    如果 Gemini CLI OAuth 请求在登录后失败，请在 Gateway 主机上设置 `GOOGLE_CLOUD_PROJECT` 或 `GOOGLE_CLOUD_PROJECT_ID` 并重试。
    </Note>

    <Note>
    如果登录在浏览器流程启动前失败，请确保本地 `gemini` 命令已安装并在 `PATH` 中。
    </Note>

    `google-gemini-cli/*` 模型引用是旧版兼容别名。新配置应使用 `google/*` 模型引用，并在需要本地 Gemini CLI 执行时添加 `google-gemini-cli` 运行时。

  </Tab>
</Tabs>

## 能力

| 能力                   | 支持                          |
| ---------------------- | ----------------------------- |
| 聊天补全               | 是                            |
| 图像生成               | 是                            |
| 音乐生成               | 是                            |
| 文本转语音             | 是                            |
| 实时语音               | 是（Google Live API）         |
| 图像理解               | 是                            |
| 音频转录               | 是                            |
| 视频理解               | 是                            |
| Web 搜索（Grounding）  | 是                            |
| 思考/推理              | 是（Gemini 2.5+ / Gemini 3+） |
| Gemma 4 模型           | 是                            |

## Web 搜索

内置的 `gemini` Web 搜索 Provider 使用 Gemini Google Search Grounding。在 `plugins.entries.google.config.webSearch` 下配置专用搜索密钥，或让其在 `GEMINI_API_KEY` 之后复用 `models.providers.google.apiKey`：

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // 如果已设置 GEMINI_API_KEY 或 models.providers.google.apiKey，则此项可选
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // 回退到 models.providers.google.baseUrl
            model: "gemini-2.5-flash",
          },
        },
      },
    },
  },
}
```

凭据优先级依次为：专用 `webSearch.apiKey`、`GEMINI_API_KEY`、`models.providers.google.apiKey`。`webSearch.baseUrl` 可选，适用于运营商代理或兼容的 Gemini API 端点；省略时，Gemini Web 搜索将复用 `models.providers.google.baseUrl`。有关 Provider 特定的工具行为，请参见 [Gemini 搜索](/tools/gemini-search)。

<Tip>
Gemini 3 模型使用 `thinkingLevel` 而非 `thinkingBudget`。OpenClaw 将 Gemini 3、Gemini 3.1 及 `gemini-*-latest` 别名的推理控制映射到 `thinkingLevel`，以便默认/低延迟运行不发送已禁用的 `thinkingBudget` 值。

`/think adaptive` 保留 Google 的动态思考语义，而不是选择固定的 OpenClaw 级别。Gemini 3 和 Gemini 3.1 省略固定的 `thinkingLevel`，让 Google 选择级别；Gemini 2.5 发送 Google 的动态哨兵值 `thinkingBudget: -1`。

Gemma 4 模型（例如 `gemma-4-26b-a4b-it`）支持思考模式。OpenClaw 将 `thinkingBudget` 重写为 Gemma 4 支持的 Google `thinkingLevel`。将思考设置为 `off` 会保留禁用思考，而不是映射到 `MINIMAL`。
</Tip>

## 图像生成

内置的 `google` 图像生成 Provider 默认使用 `google/gemini-3.1-flash-image-preview`。

- 也支持 `google/gemini-3-pro-image-preview`
- 每次请求最多生成 4 张图像
- 编辑模式：已启用，最多 5 张输入图像
- 几何控件：`size`、`aspectRatio` 和 `resolution`

将 Google 设置为默认图像 Provider：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

<Note>
请参阅[图像生成](/tools/image-generation)了解共享工具参数、Provider 选择和故障转移行为。
</Note>

## 视频生成

内置的 `google` 插件也通过共享的 `video_generate` 工具注册视频生成。

- 默认视频模型：`google/veo-3.1-fast-generate-preview`
- 模式：文本到视频、图像到视频和单视频参考流程
- 支持 `aspectRatio`（`16:9`、`9:16`）和 `resolution`（`720P`、`1080P`）；Veo 目前不支持音频输出
- 支持的时长：**4、6 或 8 秒**（其他值将自动对齐到最近的允许值）

将 Google 设置为默认视频 Provider：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

<Note>
请参阅[视频生成](/tools/video-generation)了解共享工具参数、Provider 选择和故障转移行为。
</Note>

## 音乐生成

内置的 `google` 插件也通过共享的 `music_generate` 工具注册音乐生成。

- 默认音乐模型：`google/lyria-3-clip-preview`
- 也支持 `google/lyria-3-pro-preview`
- 提示控制：`lyrics` 和 `instrumental`
- 输出格式：默认 `mp3`，`google/lyria-3-pro-preview` 还支持 `wav`
- 参考输入：最多 10 张图像
- 基于 Session 的运行通过共享任务/状态流程分离，包括 `action: "status"`

将 Google 设置为默认音乐 Provider：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

<Note>
请参阅[音乐生成](/tools/music-generation)了解共享工具参数、Provider 选择和故障转移行为。
</Note>

## 文本转语音

内置的 `google` 语音 Provider 使用 Gemini API TTS 路径，模型为 `gemini-3.1-flash-tts-preview`。

- 默认语音：`Kore`
- 身份验证：`messages.tts.providers.google.apiKey`、`models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- 输出：常规 TTS 附件为 WAV，语音笔记目标为 Opus，Talk/电话为 PCM
- 语音笔记输出：Google PCM 被封装为 WAV，并使用 `ffmpeg` 转码为 48 kHz Opus

Google 的批量 Gemini TTS 路径在已完成的 `generateContent` 响应中返回生成的音频。对于延迟最低的语音对话，请使用由 Gemini Live API 支持的 Google 实时语音 Provider，而非批量 TTS。

将 Google 设置为默认 TTS Provider：

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          audioProfile: "Speak professionally with a calm tone.",
        },
      },
    },
  },
}
```

Gemini API TTS 使用自然语言提示进行风格控制。设置 `audioProfile` 可在朗读文本前添加可复用的风格提示。当提示文本引用命名讲话者时，请设置 `speakerName`。

Gemini API TTS 接受文本中的表达性方括号音频标签，例如 `[whispers]` 或 `[laughs]`。若要在将标签发送到 TTS 的同时让其不出现在可见的聊天回复中，请将其放在 `[[tts:text]]...[[/tts:text]]` 块内：

```text
Here is the clean reply text.

[[tts:text]][whispers] Here is the spoken version.[[/tts:text]]
```

<Note>
限制为 Gemini API 的 Google Cloud Console API 密钥对此 Provider 有效。这不是单独的 Cloud Text-to-Speech API 路径。
</Note>

## 实时语音

内置的 `google` 插件通过 Gemini Live API 注册实时语音 Provider，用于 Voice Call 和 Google Meet 等后端音频桥接。

| 设置                | 配置路径                                                            | 默认值                                                                                |
| ------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 模型                | `plugins.entries.voice-call.config.realtime.providers.google.model` | `gemini-2.5-flash-native-audio-preview-12-2025`                                       |
| 语音                | `...google.voice`                                                   | `Kore`                                                                                |
| 温度                | `...google.temperature`                                             | （未设置）                                                                            |
| VAD 开始灵敏度      | `...google.startSensitivity`                                        | （未设置）                                                                            |
| VAD 结束灵敏度      | `...google.endSensitivity`                                          | （未设置）                                                                            |
| 静音时长            | `...google.silenceDurationMs`                                       | （未设置）                                                                            |
| 活动处理            | `...google.activityHandling`                                        | Google 默认，`start-of-activity-interrupts`                                           |
| 轮次覆盖            | `...google.turnCoverage`                                            | Google 默认，`only-activity`                                                          |
| 禁用自动 VAD        | `...google.automaticActivityDetectionDisabled`                      | `false`                                                                               |
| 会话恢复            | `...google.sessionResumption`                                       | `true`                                                                                |
| 上下文压缩          | `...google.contextWindowCompression`                                | `true`                                                                                |
| API 密钥            | `...google.apiKey`                                                  | 回退到 `models.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`        |

Voice Call 实时配置示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          realtime: {
            enabled: true,
            provider: "google",
            providers: {
              google: {
                model: "gemini-2.5-flash-native-audio-preview-12-2025",
                voice: "Kore",
                activityHandling: "start-of-activity-interrupts",
                turnCoverage: "only-activity",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Google Live API 通过 WebSocket 使用双向音频和函数调用。OpenClaw 将电话/Meet 桥接音频适配到 Gemini 的 PCM Live API 流，并将工具调用保留在共享实时语音协议上。除非需要更改采样，否则请将 `temperature` 保持未设置状态；OpenClaw 会省略非正值，因为 Google Live 在 `temperature: 0` 时可能返回无音频的转录文本。Gemini API 转录在没有 `languageCodes` 的情况下启用；当前的 Google SDK 会拒绝此 API 路径上的语言代码提示。
</Note>

<Note>
Control UI Talk 支持带有受限一次性令牌的 Google Live 浏览器会话。仅后端实时语音 Provider 也可以通过通用 Gateway 中继传输运行，从而将 Provider 凭据保留在 Gateway 上。
</Note>

如需维护者实时验证，请运行
`OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts`。
该脚本同时覆盖 OpenAI 后端/WebRTC 路径；Google 部分将创建与 Control UI Talk 使用的相同受限 Live API 令牌形状，打开浏览器 WebSocket 端点，发送初始设置载荷，并等待 `setupComplete`。

## 高级配置

<AccordionGroup>
  <Accordion title="直接 Gemini 缓存复用">
    对于直接 Gemini API 运行（`api: "google-generative-ai"`），OpenClaw 将配置的 `cachedContent` 句柄透传到 Gemini 请求。

    - 可以通过 `cachedContent` 或旧版 `cached_content` 为每个模型或全局参数配置
    - 如果两者都存在，`cachedContent` 优先
    - 示例值：`cachedContents/prebuilt-context`
    - Gemini 缓存命中使用量从上游 `cachedContentTokenCount` 归一化为 OpenClaw `cacheRead`

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "google/gemini-2.5-pro": {
              params: {
                cachedContent: "cachedContents/prebuilt-context",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Gemini CLI JSON 使用注意事项">
    使用 `google-gemini-cli` OAuth Provider 时，OpenClaw 按如下方式规范化 CLI JSON 输出：

    - 回复文本来自 CLI JSON `response` 字段。
    - 当 CLI 将 `usage` 留空时，使用量回退到 `stats`。
    - `stats.cached` 归一化为 OpenClaw `cacheRead`。
    - 如果 `stats.input` 缺失，OpenClaw 从 `stats.input_tokens - stats.cached` 推导输入令牌数。

  </Accordion>

  <Accordion title="环境和守护进程设置">
    如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `GEMINI_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
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
  <Card title="音乐生成" href="/tools/music-generation" icon="music">
    共享音乐工具参数和 Provider 选择。
  </Card>
</CardGroup>
