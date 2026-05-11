---
mmh3_hash: "761e2a2c17470f3b9dfb12c7044aa546"
summary: "在 OpenClaw 中使用 Gradium 文字转语音"
read_when:
  - 您希望使用 Gradium 进行文字转语音
  - 您需要 Gradium API 密钥、语音或指令令牌配置
title: "Gradium"
---

[Gradium](https://gradium.ai) 是 OpenClaw 的捆绑文字转语音 Provider。该 Plugin 可以生成普通音频回复（WAV）、与语音笔记兼容的 Opus 输出，以及用于电话界面的 8 kHz u-law 音频。

| 属性          | 值                                     |
| ------------- | -------------------------------------- |
| Provider id   | `gradium`                              |
| 身份验证      | `GRADIUM_API_KEY` 或配置 `apiKey`      |
| Base URL      | `https://api.gradium.ai`（默认）       |
| 默认语音      | `Emma`（`YTpq7expH9539ERJ`）           |

## 设置

创建 Gradium API 密钥，然后通过环境变量或配置密钥将其提供给 OpenClaw。

<Tabs>
  <Tab title="环境变量">
    ```bash
    export GRADIUM_API_KEY="gsk_..."
    ```
  </Tab>

  <Tab title="配置密钥">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "gradium",
          providers: {
            gradium: {
              apiKey: "${GRADIUM_API_KEY}",
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

Plugin 优先检查已解析的 `apiKey`，然后回退到 `GRADIUM_API_KEY` 环境变量。

## 配置

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          voiceId: "YTpq7expH9539ERJ",
          // apiKey: "${GRADIUM_API_KEY}",
          // baseUrl: "https://api.gradium.ai",
        },
      },
    },
  },
}
```

| 键                                       | 类型   | 描述                                                                                      |
| ---------------------------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `messages.tts.providers.gradium.apiKey`  | string | 已解析的 API 密钥。支持 `${ENV}` 和 Secret 引用。                                         |
| `messages.tts.providers.gradium.baseUrl` | string | 覆盖 API 源地址。末尾斜杠会被去除。默认为 `https://api.gradium.ai`。                      |
| `messages.tts.providers.gradium.voiceId` | string | 没有指令覆盖时使用的默认语音 id。                                                         |

输出音频格式由运行时根据目标界面自动选择，无法通过 `openclaw.json` 配置。请参见下方[输出](#输出)部分。

## 语音

| 名称      | 语音 ID            |
| --------- | ------------------ |
| Emma      | `YTpq7expH9539ERJ` |
| Kent      | `LFZvm12tW_z0xfGo` |
| Tiffany   | `Eu9iL_CYe8N-Gkx_` |
| Christina | `2H4HY2CBNyJHBCrP` |
| Sydney    | `jtEKaLYNn6iif5PR` |
| John      | `KWJiFWu2O9nMPYcR` |
| Arthur    | `3jUdJyOi9pgbxBTK` |

默认语音：Emma。

### 逐条消息语音覆盖

当激活的语音策略允许语音覆盖时，您可以使用指令令牌内联切换语音。以下所有方式均可解析为同一 `voiceId` 覆盖：

```text
/voice:LFZvm12tW_z0xfGo
/voice_id:LFZvm12tW_z0xfGo
/voiceid:LFZvm12tW_z0xfGo
/gradium_voice:LFZvm12tW_z0xfGo
/gradiumvoice:LFZvm12tW_z0xfGo
```

如果语音策略禁用了语音覆盖，指令将被消费但忽略。

## 输出

运行时根据目标界面选择输出格式。目前 Provider 不合成其他格式。

| 目标         | 格式        | 文件扩展名 | 采样率   | 语音兼容标志 |
| ------------ | ----------- | ---------- | -------- | ------------ |
| 标准音频     | `wav`       | `.wav`     | provider | 否           |
| 语音笔记     | `opus`      | `.opus`    | provider | 是           |
| 电话         | `ulaw_8000` | 无         | 8 kHz    | 无           |

## 自动选择顺序

在已配置的 TTS Provider 中，Gradium 的自动选择优先级为 `30`。有关 OpenClaw 在 `messages.tts.provider` 未固定时如何选择活动 Provider，请参见[文字转语音](/tools/tts)。

## 相关

- [文字转语音](/tools/tts)
- [媒体概览](/tools/media-overview)
