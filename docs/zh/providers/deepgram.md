---
title: "Deepgram"
sidebarTitle: "Deepgram"
mmh3_hash: "4246b46f0eebd53bde93f58118840406"
summary: "用于入站语音笔记的 Deepgram 转录"
read_when:
  - 您想要用于音频附件的 Deepgram 语音转文本
  - 您想要用于 Voice Call 的 Deepgram 流式转录
  - 您需要快速的 Deepgram 配置示例
---

Deepgram 是一个语音转文本 API。在 OpenClaw 中，它通过 `tools.media.audio` 用于入站音频/语音笔记转录，并通过 `plugins.entries.voice-call.config.streaming` 用于 Voice Call 流式 STT。

对于批量转录，OpenClaw 将完整的音频文件上传到 Deepgram，并将转录注入回复管道（`{{Transcript}}` + `[Audio]` 块）。对于 Voice Call 流式传输，OpenClaw 通过 Deepgram 的 WebSocket `listen` 端点转发实时 G.711 u-law 帧，并在 Deepgram 返回结果时发出部分或最终转录。

| 详情          | 值                                                         |
| ------------- | ---------------------------------------------------------- |
| 网站          | [deepgram.com](https://deepgram.com)                       |
| 文档          | [developers.deepgram.com](https://developers.deepgram.com) |
| 身份验证      | `DEEPGRAM_API_KEY`                                         |
| 默认模型      | `nova-3`                                                   |

## 快速开始

<Steps>
  <Step title="设置 API 密钥">
    将您的 Deepgram API 密钥添加到环境变量：

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="启用音频 Provider">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="发送语音笔记">
    通过任何已连接的 Channel 发送音频消息。OpenClaw 通过 Deepgram 进行转录，并将转录注入回复管道。
  </Step>
</Steps>

## 配置选项

| 选项              | 路径                                                         | 描述                              |
| ----------------- | ------------------------------------------------------------ | --------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | Deepgram 模型 id（默认：`nova-3`）|
| `language`        | `tools.media.audio.models[].language`                        | 语言提示（可选）                  |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | 启用语言检测（可选）              |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | 启用标点符号（可选）              |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | 启用智能格式化（可选）            |

<Tabs>
  <Tab title="带语言提示">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="带 Deepgram 选项">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Voice Call 流式 STT

内置的 `deepgram` 插件还为 Voice Call 插件注册了实时转录 Provider。

| 设置            | 配置路径                                                                | 默认值                              |
| --------------- | ----------------------------------------------------------------------- | ----------------------------------- |
| API 密钥        | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | 回退至 `DEEPGRAM_API_KEY`           |
| 模型            | `...deepgram.model`                                                     | `nova-3`                            |
| 语言            | `...deepgram.language`                                                  | （未设置）                          |
| 编码            | `...deepgram.encoding`                                                  | `mulaw`                             |
| 采样率          | `...deepgram.sampleRate`                                                | `8000`                              |
| 端点检测        | `...deepgram.endpointingMs`                                             | `800`                               |
| 中间结果        | `...deepgram.interimResults`                                            | `true`                              |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
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
Voice Call 以 8 kHz G.711 u-law 接收电话音频。Deepgram 流式 Provider 默认使用 `encoding: "mulaw"` 和 `sampleRate: 8000`，因此 Twilio 媒体帧可以直接转发。
</Note>

## 注意事项

<AccordionGroup>
  <Accordion title="身份验证">
    身份验证遵循标准 Provider 身份验证顺序。`DEEPGRAM_API_KEY` 是最简单的路径。
  </Accordion>
  <Accordion title="代理和自定义端点">
    使用代理时，通过 `tools.media.audio.baseUrl` 和 `tools.media.audio.headers` 覆盖端点或标头。
  </Accordion>
  <Accordion title="输出行为">
    输出遵循与其他 Provider 相同的音频规则（大小上限、超时、转录注入）。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="媒体工具" href="/tools/media-overview" icon="photo-film">
    音频、图像和视频处理管道概述。
  </Card>
  <Card title="配置" href="/gateway/configuration" icon="gear">
    完整配置参考，包括媒体工具设置。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
  <Card title="FAQ" href="/help/faq" icon="circle-question">
    关于 OpenClaw 设置的常见问题。
  </Card>
</CardGroup>
