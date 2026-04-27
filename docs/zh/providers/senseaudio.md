---
mmh3_hash: "56ce2c481fecc4b04fd5329060549627"
summary: "SenseAudio 批量语音转文字，用于入站语音笔记"
read_when:
  - 您希望使用 SenseAudio 语音转文字处理音频附件
  - 您需要 SenseAudio API 密钥环境变量或音频配置路径
title: "SenseAudio"
---

# SenseAudio

SenseAudio 可以通过 OpenClaw 共享的 `tools.media.audio` 管道转录入站音频/语音笔记附件。OpenClaw 将多部分音频发送到 OpenAI 兼容的转录端点，并将返回的文本注入为 `{{Transcript}}` 加上 `[Audio]` 块。

| 详情        | 值                                               |
| ----------- | ------------------------------------------------ |
| 网站        | [senseaudio.cn](https://senseaudio.cn)           |
| 文档        | [senseaudio.cn/docs](https://senseaudio.cn/docs) |
| 认证        | `SENSEAUDIO_API_KEY`                             |
| 默认模型    | `senseaudio-asr-pro-1.5-260319`                  |
| 默认 URL    | `https://api.senseaudio.cn/v1`                   |

## 入门

<Steps>
  <Step title="设置您的 API 密钥">
    ```bash
    export SENSEAUDIO_API_KEY="..."
    ```
  </Step>
  <Step title="启用音频 Provider">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "senseaudio", model: "senseaudio-asr-pro-1.5-260319" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="发送语音笔记">
    通过任何已连接的 Channel 发送音频消息。OpenClaw 将音频上传到 SenseAudio，并在回复管道中使用转录结果。
  </Step>
</Steps>

## 选项

| 选项       | 路径                                  | 描述                          |
| ---------- | ------------------------------------- | ----------------------------- |
| `model`    | `tools.media.audio.models[].model`    | SenseAudio ASR 模型 id        |
| `language` | `tools.media.audio.models[].language` | 可选的语言提示                |
| `prompt`   | `tools.media.audio.prompt`            | 可选的转录提示                |
| `baseUrl`  | `tools.media.audio.baseUrl` 或模型    | 覆盖 OpenAI 兼容基础 URL      |
| `headers`  | `tools.media.audio.request.headers`   | 额外的请求头                  |

<Note>
SenseAudio 在 OpenClaw 中仅支持批量 STT。Voice Call 实时转录继续使用支持流式 STT 的 Provider。
</Note>
