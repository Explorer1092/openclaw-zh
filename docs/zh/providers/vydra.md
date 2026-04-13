---
mmh3_hash: "86731eb9280b509a6695e4f7210b167d"
summary: "在 OpenClaw 中使用 Vydra 图像、视频和语音"
read_when:
  - 您想在 OpenClaw 中使用 Vydra 媒体生成
  - 您需要 Vydra API 密钥设置指导
title: "Vydra"
---

# Vydra

内置的 Vydra Plugin 添加了：

- 通过 `vydra/grok-imagine` 进行图像生成
- 通过 `vydra/veo3` 和 `vydra/kling` 进行视频生成
- 通过 Vydra 的 ElevenLabs 支持的 TTS 路由进行语音合成

OpenClaw 对所有三种功能使用相同的 `VYDRA_API_KEY`。

<Warning>
使用 `https://www.vydra.ai/api/v1` 作为 Base URL。

Vydra 的顶级域名（`https://vydra.ai/api/v1`）目前重定向到 `www`。某些 HTTP 客户端在跨主机重定向时会丢弃 `Authorization` 标头，这会将有效的 API 密钥变成误导性的身份验证失败。内置 Plugin 直接使用 `www` Base URL 来避免这个问题。
</Warning>

## 设置

<Steps>
  <Step title="运行交互式入门">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    或直接设置环境变量：

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="选择默认功能">
    从以下功能中选择一项或多项（图像、视频或语音）并应用相应的配置。
  </Step>
</Steps>

## 功能

<AccordionGroup>
  <Accordion title="图像生成">
    默认图像模型：

    - `vydra/grok-imagine`

    将其设置为默认图像 Provider：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    当前内置支持仅限文本到图像。Vydra 的托管编辑路由需要远程图像 URL，而内置 Plugin 目前尚未添加 Vydra 特定的上传桥接。

    <Note>
    请参阅[图像生成](/tools/image-generation)了解共享工具参数、Provider 选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="视频生成">
    已注册的视频模型：

    - `vydra/veo3` 用于文本到视频
    - `vydra/kling` 用于图像到视频

    将 Vydra 设置为默认视频 Provider：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    注意事项：

    - `vydra/veo3` 仅支持文本到视频。
    - `vydra/kling` 目前需要远程图像 URL 参考。本地文件上传会被预先拒绝。
    - Vydra 当前的 `kling` HTTP 路由对于是否需要 `image_url` 或 `video_url` 表现不一致；内置 Provider 将相同的远程图像 URL 映射到两个字段中。
    - 内置 Plugin 保守处理，不转发未记录的样式参数，例如宽高比、分辨率、水印或生成的音频。

    <Note>
    请参阅[视频生成](/tools/video-generation)了解共享工具参数、Provider 选择和故障转移行为。
    </Note>

  </Accordion>

  <Accordion title="视频实时测试">
    Provider 特定的实时覆盖：

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    内置 Vydra 实时文件现在涵盖：

    - `vydra/veo3` 文本到视频
    - `vydra/kling` 使用远程图像 URL 的图像到视频

    需要时覆盖远程图像 fixture：

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="语音合成">
    将 Vydra 设置为语音 Provider：

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    默认值：

    - 模型：`elevenlabs/tts`
    - 语音 id：`21m00Tcm4TlvDq8ikWAM`

    内置 Plugin 目前公开一个已知可用的默认语音，并返回 MP3 音频文件。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Provider 目录" href="/providers/index" icon="list">
    浏览所有可用的 Provider。
  </Card>
  <Card title="图像生成" href="/tools/image-generation" icon="image">
    共享图像工具参数和 Provider 选择。
  </Card>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    共享视频工具参数和 Provider 选择。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference#agent-defaults" icon="gear">
    Agent 默认值和模型配置。
  </Card>
</CardGroup>
