---
mmh3_hash: "5447c69efb1b2baa5909e8ee1cc644f5"
summary: "Inworld 流式文字转语音，用于 OpenClaw 回复"
read_when:
  - 您希望使用 Inworld 语音合成功能处理出站回复
  - 您需要 Inworld 的 PCM 电话或 OGG_OPUS 语音笔记输出
title: "Inworld"
---

Inworld 是一个流式文字转语音 (TTS) Provider。在 OpenClaw 中，它合成出站回复音频（默认为 MP3，语音笔记为 OGG_OPUS），以及为 Voice Call 等电话 Channel 生成 PCM 音频。

OpenClaw 向 Inworld 的流式 TTS 端点发送请求，将返回的 base64 音频块拼接成单个缓冲区，并将结果交给标准的回复音频管道。

| 属性          | 值                                                            |
| ------------- | ------------------------------------------------------------- |
| Provider id   | `inworld`                                                     |
| Plugin        | bundled, `enabledByDefault: true`                             |
| Contract      | `speechProviders`（仅 TTS）                                   |
| 认证环境变量  | `INWORLD_API_KEY`（HTTP Basic，Base64 仪表板凭据）            |
| Base URL      | `https://api.inworld.ai`                                      |
| 默认语音      | `Sarah`                                                       |
| 默认模型      | `inworld-tts-1.5-max`                                         |
| 输出          | MP3（默认）、OGG_OPUS（语音笔记）、PCM 22050 Hz（电话）       |
| 网站          | [inworld.ai](https://inworld.ai)                              |
| 文档          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)   |

## 入门

<Steps>
  <Step title="设置您的 API 密钥">
    从 Inworld 仪表板（工作区 > API 密钥）复制凭据，并将其设置为环境变量。该值按原样作为 HTTP Basic 凭据发送，因此不要再次进行 Base64 编码或将其转换为 Bearer 令牌。

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="在 messages.tts 中选择 Inworld">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="发送消息">
    通过任何已连接的 Channel 发送回复。OpenClaw 使用 Inworld 合成音频，并以 MP3 格式发送（或在 Channel 期望语音笔记时以 OGG_OPUS 格式发送）。
  </Step>
</Steps>

## 配置选项

| 选项          | 路径                                         | 描述                                                              |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | Base64 仪表板凭据。回退到 `INWORLD_API_KEY`。                     |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | 覆盖 Inworld API 基础 URL（默认 `https://api.inworld.ai`）。      |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | 语音标识符（默认 `Sarah`）。                                       |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | TTS 模型 id（默认 `inworld-tts-1.5-max`）。                       |
| `temperature` | `messages.tts.providers.inworld.temperature` | 采样温度 `0..2`（可选）。                                          |

## 说明

<AccordionGroup>
  <Accordion title="认证">
    Inworld 使用 HTTP Basic 认证，带有单个 Base64 编码的凭据字符串。从 Inworld 仪表板原样复制。Provider 将其以 `Authorization: Basic <apiKey>` 形式发送，不做任何进一步编码，因此不要自行进行 Base64 编码，也不要传递 Bearer 风格的令牌。请参见 [TTS 认证说明](/tools/tts#inworld-primary) 以获取相同的提示。
  </Accordion>
  <Accordion title="模型">
    支持的模型 id：`inworld-tts-1.5-max`（默认）、`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。
  </Accordion>
  <Accordion title="音频输出">
    回复默认使用 MP3。当 Channel 目标为 `voice-note` 时，OpenClaw 向 Inworld 请求 `OGG_OPUS`，以便音频作为原生语音气泡播放。电话合成使用原始 `PCM`，采样率为 22050 Hz，以供电话桥接器使用。
  </Accordion>
  <Accordion title="自定义端点">
    使用 `messages.tts.providers.inworld.baseUrl` 覆盖 API 主机。发送请求之前会去除尾部斜杠。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="文字转语音" href="/tools/tts" icon="waveform-lines">
    TTS 概览、Provider 和 `messages.tts` 配置。
  </Card>
  <Card title="配置" href="/gateway/configuration" icon="gear">
    包含 `messages.tts` 设置的完整配置参考。
  </Card>
  <Card title="Provider" href="/providers" icon="grid">
    所有捆绑的 OpenClaw Provider。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
</CardGroup>
