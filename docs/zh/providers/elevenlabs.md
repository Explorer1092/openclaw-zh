---
mmh3_hash: "b8bf0a1a8576a7025301d4a89d1236fb"
summary: "在 OpenClaw 中使用 ElevenLabs 语音、Scribe STT 和实时转录"
read_when:
  - 您希望在 OpenClaw 中使用 ElevenLabs 文字转语音
  - 您希望使用 ElevenLabs Scribe 语音转文字处理音频附件
  - 您希望为 Voice Call 或 Google Meet 使用 ElevenLabs 实时转录
title: "ElevenLabs"
---

OpenClaw 使用 ElevenLabs 进行文字转语音、使用 Scribe v2 进行批量语音转文字，以及使用 Scribe v2 Realtime 进行 Voice Call 流式 STT。

| 功能               | OpenClaw 界面                                                        | 默认                     |
| ------------------ | -------------------------------------------------------------------- | ------------------------ |
| 文字转语音         | `messages.tts` / `talk`                                              | `eleven_multilingual_v2` |
| 批量语音转文字     | `tools.media.audio`                                                  | `scribe_v2`              |
| 流式语音转文字     | Voice Call 流式传输或 Google Meet `realtime.transcriptionProvider`   | `scribe_v2_realtime`     |

## 认证

在环境中设置 `ELEVENLABS_API_KEY`。`XI_API_KEY` 也被接受，以兼容现有的 ElevenLabs 工具。

```bash
export ELEVENLABS_API_KEY="..."
```

## 文字转语音

```json5
{
  messages: {
    tts: {
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          voiceId: "pMsXgVXv3BLzUgSXRplE",
          modelId: "eleven_multilingual_v2",
        },
      },
    },
  },
}
```

将 `modelId` 设置为 `eleven_v3` 以使用 ElevenLabs v3 TTS。OpenClaw 为现有安装保持 `eleven_multilingual_v2` 作为默认值。

Discord 语音频道在 ElevenLabs 被选为 `voice.tts`/`messages.tts` Provider 时使用 ElevenLabs 的流式 TTS 端点。播放从返回的音频流开始，而不是等待 OpenClaw 先下载并写入完整音频文件。`latencyTier` 映射到 ElevenLabs 的 `optimize_streaming_latency` 查询参数（适用于接受该参数的模型）；OpenClaw 对 `eleven_v3` 省略该参数，因为后者会拒绝它。

## 语音转文字

使用 Scribe v2 处理入站音频附件和短录制语音片段：

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "elevenlabs", model: "scribe_v2" }],
      },
    },
  },
}
```

OpenClaw 将多部分音频发送到 ElevenLabs `/v1/speech-to-text`，使用 `model_id: "scribe_v2"`。语言提示在存在时映射到 `language_code`。

## Voice Call 流式 STT

捆绑的 `elevenlabs` Plugin 为 Voice Call 流式转录注册了 Scribe v2 Realtime。

| 设置         | 配置路径                                                                  | 默认                                              |
| ------------ | ------------------------------------------------------------------------- | ------------------------------------------------- |
| API 密钥     | `plugins.entries.voice-call.config.streaming.providers.elevenlabs.apiKey` | 回退到 `ELEVENLABS_API_KEY` / `XI_API_KEY`        |
| 模型         | `...elevenlabs.modelId`                                                   | `scribe_v2_realtime`                              |
| 音频格式     | `...elevenlabs.audioFormat`                                               | `ulaw_8000`                                       |
| 采样率       | `...elevenlabs.sampleRate`                                                | `8000`                                            |
| 提交策略     | `...elevenlabs.commitStrategy`                                            | `vad`                                             |
| 语言         | `...elevenlabs.languageCode`                                              | （未设置）                                        |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "${ELEVENLABS_API_KEY}",
                audioFormat: "ulaw_8000",
                commitStrategy: "vad",
                languageCode: "en",
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
Voice Call 以 8 kHz G.711 u-law 格式接收 Twilio 媒体。ElevenLabs 实时 Provider 默认为 `ulaw_8000`，因此电话帧可以直接转发而无需转码。
</Note>

对于 Google Meet Agent 模式，将 `plugins.entries.google-meet.config.realtime.transcriptionProvider` 设置为 `"elevenlabs"`，并在 `plugins.entries.google-meet.config.realtime.providers.elevenlabs` 下配置相同的 Provider 块。

## 相关

- [文字转语音](/tools/tts)
- [Google Meet](/plugins/google-meet)
- [模型选择](/concepts/model-providers)
