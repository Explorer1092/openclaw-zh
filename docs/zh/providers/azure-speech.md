---
mmh3_hash: "8c83939960c7e49ebe410aadf0198ae3"
summary: "Azure AI Speech 文字转语音，用于 OpenClaw 回复"
read_when:
  - 您希望使用 Azure Speech 合成功能处理出站回复
  - 您需要 Azure Speech 的原生 Ogg Opus 语音笔记输出
title: "Azure Speech"
---

Azure Speech 是 Azure AI Speech 的文字转语音 Provider。在 OpenClaw 中，它将出站回复音频合成为 MP3（默认），为语音笔记生成原生 Ogg/Opus 格式，以及为 Voice Call 等电话 Channel 生成 8 kHz mulaw 音频。

OpenClaw 直接使用 Azure Speech REST API 与 SSML，并通过 `X-Microsoft-OutputFormat` 发送 Provider 拥有的输出格式。

| 详情                    | 值                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| 网站                    | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| 文档                    | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| 认证                    | `AZURE_SPEECH_KEY` 加 `AZURE_SPEECH_REGION`                                                                    |
| 默认语音                | `en-US-JennyNeural`                                                                                            |
| 默认文件输出            | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| 默认语音笔记文件        | `ogg-24khz-16bit-mono-opus`                                                                                    |

## 入门

<Steps>
  <Step title="创建 Azure Speech 资源">
    在 Azure 门户中创建一个 Speech 资源。从"资源管理 > 密钥和端点"复制 **KEY 1**，并复制资源位置，例如 `eastus`。

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="在 messages.tts 中选择 Azure Speech">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="发送消息">
    通过任何已连接的 Channel 发送回复。OpenClaw 使用 Azure Speech 合成音频，并为标准音频提供 MP3，或在 Channel 期望语音笔记时提供 Ogg/Opus。
  </Step>
</Steps>

## 配置选项

| 选项                    | 路径                                                        | 描述                                                                                                 |
| ----------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | Azure Speech 资源密钥。回退到 `AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。           |
| `region`                | `messages.tts.providers.azure-speech.region`                | Azure Speech 资源区域。回退到 `AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。                             |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | 可选的 Azure Speech 端点/基础 URL 覆盖。                                                             |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | 可选的 Azure Speech 基础 URL 覆盖。                                                                  |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | Azure 语音 ShortName（默认 `en-US-JennyNeural`）。                                                   |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | SSML 语言代码（默认 `en-US`）。                                                                      |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | 音频文件输出格式（默认 `audio-24khz-48kbitrate-mono-mp3`）。                                         |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | 语音笔记输出格式（默认 `ogg-24khz-16bit-mono-opus`）。                                               |

## 说明

<AccordionGroup>
  <Accordion title="认证">
    Azure Speech 使用 Speech 资源密钥，而不是 Azure OpenAI 密钥。密钥以 `Ocp-Apim-Subscription-Key` 形式发送；OpenClaw 根据 `region` 派生 `https://<region>.tts.speech.microsoft.com`，除非您提供 `endpoint` 或 `baseUrl`。
  </Accordion>
  <Accordion title="语音名称">
    使用 Azure Speech 语音的 `ShortName` 值，例如 `en-US-JennyNeural`。捆绑的 Provider 可以通过相同的 Speech 资源列出语音，并过滤标记为已弃用或已停用的语音。
  </Accordion>
  <Accordion title="音频输出">
    Azure 接受的输出格式包括 `audio-24khz-48kbitrate-mono-mp3`、`ogg-24khz-16bit-mono-opus` 和 `riff-24khz-16bit-mono-pcm`。OpenClaw 为 `voice-note` 目标请求 Ogg/Opus，以便 Channel 可以发送原生语音气泡而无需额外的 MP3 转换。
  </Accordion>
  <Accordion title="别名">
    `azure` 被接受为 Provider 别名，用于现有 PR 和用户配置，但新配置应使用 `azure-speech` 以避免与 Azure OpenAI 模型 Provider 混淆。
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
