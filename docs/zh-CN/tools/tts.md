---
mmh3_hash: "dd66dd45c2e3b34aeddd180ec39f106a"
read_when:
  - 为回复启用文本转语音
  - 配置 TTS 提供商或限制
  - 使用 /tts 命令
summary: 用于出站回复的文本转语音（TTS）
title: 文本转语音
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/tts.md
  workflow: 15
---

# 文本转语音（TTS）

OpenClaw 可以使用 ElevenLabs、Microsoft 或 OpenAI 将出站回复转换为音频。适用于 OpenClaw 可以发送音频的任何地方。

## 支持的服务

- **ElevenLabs**（主要或回退提供商）
- **Microsoft**（主要或回退提供商；当前内置实现使用 `node-edge-tts`）
- **OpenAI**（主要或回退提供商；也用于摘要）

### Microsoft 语音说明

内置 Microsoft 语音提供商当前通过 `node-edge-tts` 库使用 Microsoft Edge 的在线神经 TTS 服务。这是一个托管服务（非本地），使用 Microsoft 端点，不需要 API key。`node-edge-tts` 暴露了语音配置选项和输出格式，但并非所有选项都受服务支持。使用 `edge` 的旧版配置和指令输入仍然有效，并已规范化为 `microsoft`。

由于此路径是一个公共网络服务，没有已发布的 SLA 或配额，请将其视为尽力而为。如果需要保证限制和支持，请使用 OpenAI 或 ElevenLabs。

## 可选 Key

如果需要 OpenAI 或 ElevenLabs：

- `ELEVENLABS_API_KEY`（或 `XI_API_KEY`）
- `OPENAI_API_KEY`

Microsoft 语音**不**需要 API key。

如果配置了多个提供商，优先使用所选提供商，其他作为回退选项。自动摘要使用配置的 `summaryModel`（或 `agents.defaults.model.primary`），因此如果启用摘要，该提供商也必须完成认证。

## 默认是否启用？

否。自动 TTS 默认**关闭**。通过配置中的 `messages.tts.auto` 或每 Session 使用 `/tts always`（别名：`/tts on`）启用。

当 `messages.tts.provider` 未设置时，OpenClaw 按注册表自动选择顺序选择第一个已配置的语音提供商。

## 配置

TTS 配置位于 `openclaw.json` 中的 `messages.tts` 下。完整 Schema 见 [Gateway 配置](/gateway/configuration)。

### 最小配置（启用 + 提供商）

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
    },
  },
}
```

### OpenAI 主要 + ElevenLabs 回退

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: {
        enabled: true,
      },
      providers: {
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
      },
    },
  },
}
```

### Microsoft 主要（无 API key）

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "microsoft",
      providers: {
        microsoft: {
          enabled: true,
          voice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          rate: "+10%",
          pitch: "-5%",
        },
      },
    },
  },
}
```

### 禁用 Microsoft 语音

```json5
{
  messages: {
    tts: {
      providers: {
        microsoft: {
          enabled: false,
        },
      },
    },
  },
}
```

### 自定义限制 + 偏好路径

```json5
{
  messages: {
    tts: {
      auto: "always",
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
    },
  },
}
```

### 仅在收到入站语音消息后回复音频

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 字段说明

- `auto`：自动 TTS 模式（`off`、`always`、`inbound`、`tagged`）。
  - `inbound` 仅在收到入站语音消息后发送音频。
  - `tagged` 仅当回复包含 `[[tts]]` 标签时发送音频。
- `mode`：`"final"`（默认）或 `"all"`（包括工具/块回复）。
- `provider`：语音提供商 id，如 `"elevenlabs"`、`"microsoft"` 或 `"openai"`（回退是自动的）。
- `summaryModel`：用于自动摘要的可选廉价模型；默认为 `agents.defaults.model.primary`。
- `modelOverrides`：允许模型发出 TTS 指令（默认开启）。
  - `allowProvider` 默认为 `false`（提供商切换需选择启用）。
- `maxTextLength`：TTS 输入的硬性上限（字符数）。
- `timeoutMs`：请求超时（毫秒）。
- `prefsPath`：覆盖本地偏好 JSON 路径。

## 模型驱动的覆盖（默认开启）

默认情况下，模型**可以**为单次回复发出 TTS 指令。当 `messages.tts.auto` 为 `tagged` 时，需要这些指令来触发音频。

启用后，模型可以发出 `[[tts:...]]` 指令来覆盖单次回复的语音，以及可选的 `[[tts:text]]...[[/tts:text]]` 块来提供只应出现在音频中的表达性标签（笑声、歌唱提示等）。

除非 `modelOverrides.allowProvider: true`，否则 `provider=...` 指令会被忽略。

可用指令键（启用时）：

- `provider`（需要 `allowProvider: true`）
- `voice`（OpenAI 声音）或 `voiceId`（ElevenLabs）
- `model`（OpenAI TTS 模型或 ElevenLabs 模型 id）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

## 自动 TTS 行为

启用时，OpenClaw：

- 如果回复已包含媒体或 `MEDIA:` 指令，则跳过 TTS。
- 跳过非常短的回复（< 10 字符）。
- 启用时使用 `agents.defaults.model.primary`（或 `summaryModel`）对长回复进行摘要。
- 将生成的音频附加到回复中。

## 流程图

```
回复 -> TTS 启用？
  否  -> 发送文本
  是  -> 有媒体 / MEDIA: / 太短？
          是 -> 发送文本
          否 -> 长度 > 限制？
                   否  -> TTS -> 附加音频
                   是  -> 摘要启用？
                            否  -> 发送文本
                            是  -> 摘要（summaryModel 或 agents.defaults.model.primary）
                                      -> TTS -> 附加音频
```

## Slash Command 用法

只有一个命令：`/tts`。参见 [Slash commands](/tools/slash-commands)。

Discord 注意事项：`/tts` 是 Discord 内置命令，因此 OpenClaw 在那里注册 `/voice` 作为原生命令。文本 `/tts ...` 仍然有效。

```
/tts off
/tts always
/tts inbound
/tts tagged
/tts status
/tts provider openai
/tts limit 2000
/tts summary off
/tts audio Hello from OpenClaw
```

## Agent 工具

`tts` 工具将文本转换为语音并返回音频附件用于回复投递。当 Channel 为 Feishu、Matrix、Telegram 或 WhatsApp 时，音频作为语音消息而非文件附件投递。

## Gateway RPC

Gateway 方法：

- `tts.status`、`tts.enable`、`tts.disable`、`tts.convert`、`tts.setProvider`、`tts.providers`
