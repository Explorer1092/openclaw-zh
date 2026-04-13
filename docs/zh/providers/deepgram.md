---
title: "Deepgram"
sidebarTitle: "Deepgram"
mmh3_hash: "3b10e20008d8bd39185c6a036854ea61"
summary: "用于入站语音笔记的 Deepgram 转录"
read_when:
  - 您想要用于音频附件的 Deepgram 语音转文本
  - 您需要快速的 Deepgram 配置示例
---

# Deepgram（音频转录）

Deepgram 是一个语音转文本 API。在 OpenClaw 中，它通过 `tools.media.audio` 用于**入站音频/语音笔记转录**。

启用后，OpenClaw 将音频文件上传到 Deepgram 并将转录注入回复管道（`{{Transcript}}` + `[Audio]` 块）。这**不是流式**的；它使用预录制的转录端点。

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

<Note>
Deepgram 转录仅为**预录制**（非实时流式）。OpenClaw 上传完整的音频文件并等待完整的转录结果，然后再注入到对话中。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="媒体工具" href="/tools/media" icon="photo-film">
    音频、图像和视频处理管道概述。
  </Card>
  <Card title="配置" href="/configuration" icon="gear">
    完整配置参考，包括媒体工具设置。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
  <Card title="FAQ" href="/help/faq" icon="circle-question">
    关于 OpenClaw 设置的常见问题。
  </Card>
</CardGroup>
