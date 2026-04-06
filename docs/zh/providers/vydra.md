---
mmh3_hash: "c1f2c05d57a719af71e0922514d4185d"
summary: "在 OpenClaw 中使用 Vydra 图像、视频和语音"
read_when:
  - 您想在 OpenClaw 中使用 Vydra 媒体生成
  - 您需要 Vydra API 密钥设置指导
title: "Vydra"
---

# Vydra

内置的 Vydra 插件添加了：

- 通过 `vydra/grok-imagine` 进行图像生成
- 通过 `vydra/veo3` 和 `vydra/kling` 进行视频生成
- 通过 Vydra 的 ElevenLabs 支持的 TTS 路由进行语音合成

OpenClaw 对所有三种功能使用相同的 `VYDRA_API_KEY`。

## 重要的 Base URL

使用 `https://www.vydra.ai/api/v1`。

Vydra 的顶级域名（`https://vydra.ai/api/v1`）目前重定向到 `www`。某些 HTTP 客户端在跨主机重定向时会丢弃 `Authorization` 标头，这会将有效的 API 密钥变成误导性的身份验证失败。内置插件直接使用 `www` Base URL 来避免这个问题。

## 设置

交互式入门：

```bash
openclaw onboard --auth-choice vydra-api-key
```

或直接设置环境变量：

```bash
export VYDRA_API_KEY="vydra_live_..."
```

## 图像生成

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

当前内置支持仅限文本到图像。Vydra 的托管编辑路由需要远程图像 URL，而内置插件目前尚未添加 Vydra 特定的上传桥接。

请参阅[图像生成](/tools/image-generation)了解共享工具行为。

## 视频生成

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
- 内置插件保守处理，不转发未记录的样式参数，例如宽高比、分辨率、水印或生成的音频。

请参阅[视频生成](/tools/video-generation)了解共享工具行为。

## 语音合成

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

内置插件目前公开一个已知可用的默认语音，并返回 MP3 音频文件。

## 相关链接

- [Provider 目录](/providers/index)
- [图像生成](/tools/image-generation)
- [视频生成](/tools/video-generation)
