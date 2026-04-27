---
mmh3_hash: "9110bd27068f8552e26c3692176c2d97"
title: "OpenAI"
summary: "在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI"
read_when:
  - 您想在 OpenClaw 中使用 OpenAI 模型
  - 您想使用 Codex 订阅身份验证而不是 API 密钥
  - 您需要更严格的 GPT-5 Agent 执行行为
---

OpenAI 为 GPT 模型提供开发者 API，Codex 也可作为 OpenAI Codex 客户端的 ChatGPT Plan 编程 Agent 使用。OpenClaw 将这些接口分开，以保持配置的可预测性。

OpenClaw 支持三条 OpenAI 系列路由。模型前缀选择 Provider/身份验证路由；独立的运行时设置选择执行嵌入式 Agent 循环的方式：

- **API 密钥** — 直接访问 OpenAI Platform，按使用量计费（`openai/*` 模型）
- **Codex 订阅（通过 PI）** — ChatGPT/Codex 登录，订阅式访问（`openai-codex/*` 模型）
- **Codex app-server 套件** — 原生 Codex app-server 执行（`openai/*` 模型加 `agents.defaults.agentRuntime.id: "codex"`）

OpenAI 明确支持在 OpenClaw 等外部工具/工作流中使用订阅 OAuth。

Provider、模型、运行时和 Channel 是独立的层。如果这些标签混淆在一起，请在更改配置前阅读 [Agent 运行时](/concepts/agent-runtimes)。

## 快速选择

| 目标                                          | 使用                                              | 备注                                                                        |
| --------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| 直接 API 密钥计费                             | `openai/gpt-5.5`                                 | 设置 `OPENAI_API_KEY` 或运行 OpenAI API 密钥入门。                           |
| 通过 ChatGPT/Codex 订阅使用 GPT-5.5           | `openai-codex/gpt-5.5`                           | Codex OAuth 的默认 PI 路由。订阅设置的首选。                                 |
| 使用原生 Codex app-server 行为的 GPT-5.5      | `openai/gpt-5.5` 加 `agentRuntime.id: "codex"`   | 为该模型引用强制使用 Codex app-server 套件。                                 |
| 图像生成或编辑                                | `openai/gpt-image-2`                             | 支持 `OPENAI_API_KEY` 或 OpenAI Codex OAuth。                                |
| 透明背景图像                                  | `openai/gpt-image-1.5`                           | 使用 `outputFormat=png` 或 `webp` 加 `openai.background=transparent`。       |

## 命名映射

以下名称相似但不可互换：

| 您看到的名称                       | 层级             | 含义                                                                                           |
| ---------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `openai`                           | Provider 前缀    | 直接 OpenAI Platform API 路由。                                                                |
| `openai-codex`                     | Provider 前缀    | 通过普通 OpenClaw PI 运行器的 OpenAI Codex OAuth/订阅路由。                                     |
| `codex` Plugin                     | Plugin           | 提供原生 Codex app-server 运行时和 `/codex` 聊天控制的内置 OpenClaw Plugin。                   |
| `agentRuntime.id: codex`           | Agent 运行时     | 为嵌入式轮次强制使用原生 Codex app-server 套件。                                               |
| `/codex ...`                       | 聊天命令集       | 从对话中绑定/控制 Codex app-server 线程。                                                      |
| `runtime: "acp", agentId: "codex"` | ACP Session 路由 | 通过 ACP/acpx 运行 Codex 的显式回退路径。                                                      |

这意味着一个配置可以同时包含 `openai-codex/*` 和 `codex` Plugin。当您既想通过 PI 使用 Codex OAuth，又想使用原生 `/codex` 聊天控制时，这是有效的。`openclaw doctor` 会警告这种组合，以便您确认是否有意为之；它不会重写配置。

<Note>
GPT-5.5 可通过直接 OpenAI Platform API 密钥访问和订阅/OAuth 路由使用。使用 `openai/gpt-5.5` 进行直接 `OPENAI_API_KEY` 流量，使用 `openai-codex/gpt-5.5` 进行 PI 的 Codex OAuth，或使用 `openai/gpt-5.5` 加 `agentRuntime.id: "codex"` 进行原生 Codex app-server 套件。
</Note>

<Note>
启用 OpenAI Plugin 或选择 `openai-codex/*` 模型，并不会启用内置的 Codex app-server Plugin。OpenClaw 仅在您通过 `agentRuntime.id: "codex"` 明确选择原生 Codex 套件或使用旧版 `codex/*` 模型引用时才启用该 Plugin。如果内置 `codex` Plugin 已启用但 `openai-codex/*` 仍通过 PI 解析，`openclaw doctor` 会发出警告并保持路由不变。
</Note>

## OpenClaw 功能覆盖

| OpenAI 功能               | OpenClaw 接口                                              | 状态                                                 |
| ------------------------- | ---------------------------------------------------------- | ------------------------------------------------------ |
| 聊天 / Responses          | `openai/<model>` 模型 Provider                             | 是                                                    |
| Codex 订阅模型            | `openai-codex/<model>` 加 `openai-codex` OAuth             | 是                                                    |
| Codex app-server 套件     | `openai/<model>` 加 `agentRuntime.id: codex`               | 是                                                    |
| 服务器端网络搜索          | 原生 OpenAI Responses 工具                                  | 是（启用网络搜索且未固定 Provider 时）                |
| 图像                      | `image_generate`                                           | 是                                                    |
| 视频                      | `video_generate`                                           | 是                                                    |
| 文本转语音                | `messages.tts.provider: "openai"` / `tts`                  | 是                                                    |
| 批量语音转文字            | `tools.media.audio` / 媒体理解                              | 是                                                    |
| 流式语音转文字            | Voice Call `streaming.provider: "openai"`                  | 是                                                    |
| 实时语音                  | Voice Call `realtime.provider: "openai"` / Control UI Talk | 是                                                    |
| 嵌入                      | 内存嵌入 Provider                                           | 是                                                    |

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

    | 模型引用 | 运行时配置 | 路由 | 身份验证 |
    | ---------------------- | -------------------------- | --------------------------- | ---------------- |
    | `openai/gpt-5.5`       | 省略 / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.4-mini`  | 省略 / `agentRuntime.id: "pi"`    | 直接 OpenAI Platform API  | `OPENAI_API_KEY` |
    | `openai/gpt-5.5`       | `agentRuntime.id: "codex"`        | Codex app-server 套件     | Codex app-server |

    <Note>
    `openai/*` 是直接 OpenAI API 密钥路由，除非您明确强制使用 Codex app-server 套件。使用 `openai-codex/*` 通过默认 PI 运行器进行 Codex OAuth，或使用 `openai/gpt-5.5` 加 `agentRuntime.id: "codex"` 进行原生 Codex app-server 执行。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    <Warning>
    OpenClaw **不**公开 `openai/gpt-5.3-codex-spark`。实际 OpenAI API 请求会拒绝该模型，当前 Codex 目录也不公开它。
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

        对于无头或回调受限的设置，添加 `--device-code` 以使用 ChatGPT 设备代码流代替本地浏览器回调进行登录：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="设置默认模型">
        ```bash
        openclaw config set agents.defaults.model.primary openai-codex/gpt-5.5
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider openai-codex
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用 | 运行时配置 | 路由 | 身份验证 |
    |-----------|----------------|-------|------|
    | `openai-codex/gpt-5.5` | 省略 / `runtime: "pi"` | ChatGPT/Codex OAuth 通过 PI | Codex 登录 |
    | `openai-codex/gpt-5.5` | `runtime: "auto"` | 仍为 PI，除非 Plugin 明确声明 `openai-codex` | Codex 登录 |
    | `openai/gpt-5.5` | `agentRuntime.id: "codex"` | Codex app-server 套件 | Codex app-server 身份验证 |

    <Note>
    继续为身份验证/配置文件命令使用 `openai-codex` provider id。`openai-codex/*` 模型前缀也是 Codex OAuth 的显式 PI 路由。它不会选择或自动启用内置的 Codex app-server 套件。
    </Note>

    ### 配置示例

    ```json5
    {
      agents: { defaults: { model: { primary: "openai-codex/gpt-5.5" } } },
    }
    ```

    <Note>
    入门不再从 `~/.codex` 导入 OAuth 材料。使用浏览器 OAuth（默认）或上方的设备代码流登录——OpenClaw 在自己的 Agent 身份验证存储中管理生成的凭据。
    </Note>

    ### 状态指示器

    聊天 `/status` 显示当前 Session 的活动模型运行时。默认 PI 套件显示为 `Runtime: OpenClaw Pi Default`。选择内置 Codex app-server 套件时，`/status` 显示 `Runtime: OpenAI Codex`。现有 Session 保留其记录的套件 id，因此如果您希望 `/status` 反映新的 PI/Codex 选择，请在更改 `agentRuntime` 后使用 `/new` 或 `/reset`。

    ### Doctor 警告

    如果内置 `codex` Plugin 在选择此选项卡的 `openai-codex/*` 路由时已启用，`openclaw doctor` 会警告模型仍通过 PI 解析。当这是预期的订阅身份验证路由时，保持配置不变。仅在您需要原生 Codex app-server 执行时，才切换到 `openai/<model>` 加 `agentRuntime.id: "codex"`。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为独立的值。

    对于通过 Codex OAuth 使用 `openai-codex/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    较小的默认上限在实践中具有更好的延迟和质量特性。通过 `contextTokens` 覆盖：

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    使用 `contextWindow` 声明原生模型元数据。使用 `contextTokens` 限制运行时上下文预算。
    </Note>

    ### 目录恢复

    当 `gpt-5.5` 的上游 Codex 目录元数据存在时，OpenClaw 使用它。如果实时 Codex 发现在账户已认证的情况下省略了 `openai-codex/gpt-5.5` 行，OpenClaw 会合成该 OAuth 模型行，以避免 cron、子 Agent 和配置的默认模型运行因 `Unknown model` 而失败。

  </Tab>
</Tabs>

## 图像生成

内置的 `openai` Plugin 通过 `image_generate` 工具注册图像生成。它同时支持 OpenAI API 密钥图像生成和通过相同 `openai/gpt-image-2` 模型引用的 Codex OAuth 图像生成。

| 功能                | OpenAI API 密钥                     | Codex OAuth                          |
| ----------------------- | ---------------------------------- | ------------------------------------ |
| 模型引用            | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| 身份验证            | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登录              |
| 传输                | OpenAI Images API                  | Codex Responses 后端                 |
| 每次请求最大图像数  | 4                                  | 4                                    |
| 编辑模式            | 已启用（最多 5 张参考图像）        | 已启用（最多 5 张参考图像）          |
| 尺寸覆盖            | 支持，包括 2K/4K 尺寸              | 支持，包括 2K/4K 尺寸               |
| 宽高比/分辨率       | 不转发给 OpenAI Images API         | 安全时映射到支持的尺寸              |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
有关共享工具参数、Provider 选择和故障转移行为，请参见[图像生成](/tools/image-generation)。
</Note>

`gpt-image-2` 是 OpenAI 文本到图像生成和图像编辑的默认模型。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为显式模型覆盖使用。使用 `openai/gpt-image-1.5` 输出透明背景的 PNG/WebP；当前 `gpt-image-2` API 拒绝 `background: "transparent"`。

对于透明背景请求，Agent 应使用 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"` 以及 `background: "transparent"` 调用 `image_generate`；旧版 `openai.background` Provider 选项仍被接受。OpenClaw 还通过将默认的 `openai/gpt-image-2` 透明请求重写为 `gpt-image-1.5` 来保护公共 OpenAI 和 OpenAI Codex OAuth 路由；Azure 和自定义 OpenAI 兼容端点保留其配置的部署/模型名称。

CLI 运行的同样设置：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

对于 Codex OAuth 安装，保留相同的 `openai/gpt-image-2` 引用。当配置了 `openai-codex` OAuth 配置文件时，OpenClaw 解析存储的 OAuth 访问令牌并通过 Codex Responses 后端发送图像请求。它不会先尝试 `OPENAI_API_KEY` 或静默回退到 API 密钥。若需要直接 OpenAI Images API 路由，请使用 API 密钥、自定义 base URL 或 Azure 端点显式配置 `models.providers.openai`。如果该自定义图像端点位于受信任的 LAN/私有地址，还需设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；OpenClaw 默认阻止私有/内部 OpenAI 兼容图像端点，除非存在此选项。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

生成透明 PNG：

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

编辑：

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 视频生成

内置的 `openai` Plugin 通过 `video_generate` 工具注册视频生成。

| 功能          | 值                                                                             |
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

## GPT-5 提示贡献

OpenClaw 为跨 Provider 的 GPT-5 系列运行添加共享的 GPT-5 提示贡献。它按模型 id 应用，因此 `openai-codex/gpt-5.5`、`openai/gpt-5.5`、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 和其他兼容的 GPT-5 引用都会收到相同的叠加层。较旧的 GPT-4.x 模型则不会。

内置的原生 Codex 套件通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和心跳叠加层，因此通过 `agentRuntime.id: "codex"` 强制使用的 `openai/gpt-5.x` Session 即使在 Codex 拥有套件提示的其余部分时，也保持相同的后续和主动心跳指导。

GPT-5 贡献为角色持久性、执行安全、工具规范、输出形状、完成检查和验证添加了带标签的行为契约。Channel 特定的回复和静默消息行为保留在共享的 OpenClaw 系统提示和出站传递策略中。GPT-5 指导对匹配的模型始终启用。友好的交互风格层是独立且可配置的。

| 值                     | 效果                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"`（默认）   | 启用友好交互风格层                          |
| `"on"`                 | `"friendly"` 的别名                        |
| `"off"`                | 仅禁用友好风格层                           |

<Tabs>
  <Tab title="配置">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
值在运行时不区分大小写，因此 `"Off"` 和 `"off"` 都可以禁用友好风格层。
</Tip>

<Note>
旧版 `plugins.entries.openai.config.personality` 在未设置共享 `agents.defaults.promptOverlays.gpt5.personality` 设置时，仍作为兼容性回退读取。
</Note>

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

  <Accordion title="语音转文字">
    内置的 `openai` Plugin 通过 OpenClaw 的媒体理解转录接口注册批量语音转文字。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - OpenClaw 在使用 `tools.media.audio` 的入站音频转录场景中支持，包括 Discord 语音频道片段和 Channel 音频附件

    强制 OpenAI 用于入站音频转录：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    语言和提示提示在由共享音频媒体配置或每次调用的转录请求提供时，会转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` Plugin 为 Voice Call Plugin 注册实时转录。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | 语言 | `...openai.language` | （未设置） |
    | 提示 | `...openai.prompt` | （未设置） |
    | 静音时长 | `...openai.silenceDurationMs` | `800` |
    | VAD 阈值 | `...openai.vadThreshold` | `0.5` |
    | API 密钥 | `...openai.apiKey` | 回退到 `OPENAI_API_KEY` |

    <Note>
    使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，采用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。此流式 Provider 用于 Voice Call 的实时转录路径；Discord 语音目前录制短片段并使用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` Plugin 为 Voice Call Plugin 注册实时语音。

    | 设置 | 配置路径 | 默认值 |
    |---------|------------|---------|
    | 模型 | `plugins.entries.voice-call.config.realtime.providers.openai.model` | `gpt-realtime-1.5` |
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

## Azure OpenAI 端点

内置的 `openai` Provider 可以通过覆盖 base URL 将图像生成目标指向 Azure OpenAI 资源。在图像生成路径上，OpenClaw 检测 `models.providers.openai.baseUrl` 上的 Azure 主机名并自动切换到 Azure 的请求形状。

<Note>
实时语音使用独立的配置路径（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），不受 `models.providers.openai.baseUrl` 影响。有关其 Azure 设置，请参见[语音和语音合成](#voice-and-speech)下的**实时语音** Accordion。
</Note>

在以下情况下使用 Azure OpenAI：

- 您已有 Azure OpenAI 订阅、配额或企业协议
- 您需要 Azure 提供的区域数据驻留或合规控制
- 您希望在现有 Azure 租户内保持流量

### 配置

对于通过内置 `openai` Provider 的 Azure 图像生成，将 `models.providers.openai.baseUrl` 指向您的 Azure 资源，并将 `apiKey` 设置为 Azure OpenAI 密钥（而非 OpenAI Platform 密钥）：

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw 识别以下 Azure 主机后缀用于 Azure 图像生成路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于已识别 Azure 主机上的图像生成请求，OpenClaw：

- 发送 `api-key` 标头而非 `Authorization: Bearer`
- 使用部署范围路径（`/openai/deployments/{deployment}/...`）
- 为每个请求附加 `?api-version=...`
- 对 Azure 图像生成调用使用 600 秒默认请求超时。每次调用的 `timeoutMs` 值仍可覆盖此默认值。

其他 base URL（公共 OpenAI、OpenAI 兼容代理）保留标准 OpenAI 图像请求形状。

<Note>
`openai` Provider 图像生成路径的 Azure 路由需要 OpenClaw 2026.4.22 或更高版本。早期版本将任何自定义 `openai.baseUrl` 视为公共 OpenAI 端点，对 Azure 图像部署会失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION` 为 Azure 图像生成路径固定特定的 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未设置变量时，默认为 `2024-12-01-preview`。

### 模型名称即部署名称

Azure OpenAI 将模型绑定到部署。对于通过内置 `openai` Provider 路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段必须是您在 Azure 门户中配置的**Azure 部署名称**，而非公共 OpenAI 模型 id。

如果您创建了一个名为 `gpt-image-2-prod` 的部署来提供 `gpt-image-2`：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的部署名称规则适用于通过内置 `openai` Provider 路由的图像生成调用。

### 区域可用性

Azure 图像生成目前仅在部分区域可用（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`）。在创建部署之前，请查看 Microsoft 当前的区域列表，并确认特定模型在您的区域中提供。

### 参数差异

Azure OpenAI 和公共 OpenAI 并不总是接受相同的图像参数。Azure 可能拒绝公共 OpenAI 允许的选项（例如 `gpt-image-2` 上的某些 `background` 值），或仅在特定模型版本上公开这些选项。这些差异来自 Azure 和底层模型，而非 OpenClaw。如果 Azure 请求因验证错误而失败，请在 Azure 门户中检查您特定部署和 API 版本支持的参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不接收 OpenClaw 的隐藏归因标头——请参见[高级配置](#advanced-configuration)下的**原生路由与 OpenAI 兼容路由** Accordion。

对于 Azure 上的聊天或 Responses 流量（超出图像生成），请使用入门流程或专用的 Azure Provider 配置——单独的 `openai.baseUrl` 不会选取 Azure API/身份验证形状。存在独立的 `azure-openai-responses/*` Provider；请参见下方的服务器端压缩 Accordion。
</Note>

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
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
            "openai-codex/gpt-5.5": {
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
    OpenClaw 默认为 `openai/*` 和 `openai-codex/*` 启用 WebSocket 预热，以减少第一轮延迟。

    ```json5
    // 禁用预热
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
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
            "openai/gpt-5.5": { params: { fastMode: true } },
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
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
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
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI Plugin 的 Pi 套件流包装器自动启用服务器端压缩：

    - 强制 `store: true`（除非模型兼容设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    这适用于内置 Pi 套件路径和嵌入式运行使用的 OpenAI Provider 钩子。原生 Codex app-server 套件通过 Codex 管理自己的上下文，并通过 `agents.defaults.agentRuntime.id` 单独配置。

    <Tabs>
      <Tab title="显式启用">
        适用于 Azure OpenAI Responses 等兼容端点：

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
                "openai/gpt-5.5": {
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
    对于 `openai/*` 上的 GPT-5 系列运行，OpenClaw 可以使用更严格的嵌入式执行契约：

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

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对拒绝 `reasoning.effort: "none"` 的模型或代理省略禁用的推理
    - 默认工具 Schema 为严格模式
    - 仅在已验证的原生主机上附加隐藏的归因标头
    - 保留 OpenAI 专属请求塑形（`service_tier`、`store`、推理兼容、提示缓存提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` 负载中剥离 Completions `store`
    - 接受高级 `params.extra_body`/`params.extraBody` 透传 JSON，用于 OpenAI 兼容 Completions 代理
    - 接受 `params.chat_template_kwargs`，用于 vLLM 等 OpenAI 兼容 Completions 代理
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
