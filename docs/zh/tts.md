---
title: "文本转语音(TTS)"
mmh3_hash: "e938f03d2db8055f41232e23e40aa636"
summary: "用于出站回复的文本转语音(TTS)"
read_when:
  - 为回复启用文本转语音
  - 配置 TTS 提供程序或限制
  - 使用 /tts 命令
---

# 文本转语音(TTS)

OpenClaw 可以使用 ElevenLabs、Microsoft、MiniMax 或 OpenAI 将出站回复转换为音频。
它在 OpenClaw 可以发送音频的任何地方工作。

## 支持的服务

- **ElevenLabs**（主要或回退提供程序）
- **Microsoft**（主要或回退提供程序；当前捆绑实现使用 `node-edge-tts`）
- **MiniMax**（主要或回退提供程序；使用 T2A v2 API）
- **OpenAI**（主要或回退提供程序；也用于摘要）

### Microsoft 语音注意事项

捆绑的 Microsoft 语音提供程序目前通过 `node-edge-tts` 库使用 Microsoft Edge 的在线
神经 TTS 服务。它是一个托管服务（非本地），使用 Microsoft 的端点，不需要 API 密钥。
`node-edge-tts` 公开语音配置选项和输出格式，但服务并不支持所有选项。使用 `edge` 的
旧版配置和指令输入仍然有效，并会被规范化为 `microsoft`。

因为此路径是一个没有发布 SLA 或配额的公共 Web 服务，请将其视为尽力而为。如果您需要
保证的限制和支持，请使用 OpenAI 或 ElevenLabs。

## 可选密钥

如果您想要 OpenAI、ElevenLabs 或 MiniMax：

- `ELEVENLABS_API_KEY`（或 `XI_API_KEY`）
- `MINIMAX_API_KEY`
- `OPENAI_API_KEY`

Microsoft 语音**不**需要 API 密钥。

如果配置了多个提供程序，则首先使用所选提供程序，其他提供程序是回退选项。
自动摘要使用配置的 `summaryModel`（或 `agents.defaults.model.primary`），因此如果启用
摘要，该提供程序也必须经过身份验证。

## 服务链接

- [OpenAI 文本转语音指南](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI 音频 API 参考](https://platform.openai.com/docs/api-reference/audio)
- [ElevenLabs 文本转语音](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs 身份验证](https://elevenlabs.io/docs/api-reference/authentication)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft 语音输出格式](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)

## 默认是否启用？

否。自动 TTS 默认**关闭**。在配置中使用 `messages.tts.auto` 启用它，或使用
`/tts always`（别名：`/tts on`）按会话启用。

当 `messages.tts.provider` 未设置时，OpenClaw 从注册表自动选择顺序中选取第一个已配置的语音提供程序。

## 配置

TTS 配置位于 `openclaw.json` 中的 `messages.tts` 下。
完整架构在[网关配置](/gateway/configuration)中。

### 最小配置（启用 + 提供程序）

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

### OpenAI 主要，ElevenLabs 回退

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

### Microsoft 主要（无 API 密钥）

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

### MiniMax 主要

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "minimax_api_key",
          baseUrl: "https://api.minimax.io",
          model: "speech-2.8-hd",
          voiceId: "English_expressive_narrator",
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
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

### 仅在入站语音笔记后使用音频回复

```json5
{
  messages: {
    tts: {
      auto: "inbound",
    },
  },
}
```

### 禁用长回复的自动摘要

```json5
{
  messages: {
    tts: {
      auto: "always",
    },
  },
}
```

然后运行：

```
/tts summary off
```

### 字段注意事项

- `auto`：自动 TTS 模式（`off`、`always`、`inbound`、`tagged`）。
  - `inbound` 仅在入站语音笔记后发送音频。
  - `tagged` 仅在回复包含 `[[tts]]` 标签时发送音频。
- `enabled`：旧切换（doctor 将其迁移到 `auto`）。
- `mode`：`"final"`（默认）或 `"all"`（包括工具/块回复）。
- `provider`：语音提供程序 ID，如 `"elevenlabs"`、`"microsoft"`、`"minimax"` 或 `"openai"`（回退是自动的）。
- 如果 `provider` **未设置**，OpenClaw 从注册表自动选择顺序中选取第一个已配置的语音提供程序。
- 旧版 `provider: "edge"` 仍然有效，并会被规范化为 `microsoft`。
- `summaryModel`：用于自动摘要的可选廉价模型；默认为 `agents.defaults.model.primary`。
  - 接受 `provider/model` 或配置的模型别名。
- `modelOverrides`：允许模型发出 TTS 指令（默认开启）。
  - `allowProvider` 默认为 `false`（Provider 切换需要选择加入）。
- `maxTextLength`：TTS 输入的硬上限（字符）。如果超过，`/tts audio` 失败。
- `timeoutMs`：请求超时（毫秒）。
- `prefsPath`：覆盖本地偏好 JSON 路径（提供程序/限制/摘要）。
- `apiKey` 值回退到环境变量（`ELEVENLABS_API_KEY`/`XI_API_KEY`、`MINIMAX_API_KEY`、`OPENAI_API_KEY`）。
- `providers.elevenlabs.baseUrl`：覆盖 ElevenLabs API 基础 URL。
- `providers.openai.baseUrl`：覆盖 OpenAI TTS 端点。
  - 解析顺序：`messages.tts.providers.openai.baseUrl` -> `OPENAI_TTS_BASE_URL` -> `https://api.openai.com/v1`
  - 非默认值被视为 OpenAI 兼容 TTS 端点，因此接受自定义模型和语音名称。
- `providers.elevenlabs.voiceSettings`：
  - `stability`、`similarityBoost`、`style`：`0..1`
  - `useSpeakerBoost`：`true|false`
  - `speed`：`0.5..2.0`（1.0 = 正常）
- `providers.elevenlabs.applyTextNormalization`：`auto|on|off`
- `providers.elevenlabs.languageCode`：2 字母 ISO 639-1（例如 `en`、`de`）
- `providers.elevenlabs.seed`：整数 `0..4294967295`（尽力确定性）
- `providers.minimax.baseUrl`：覆盖 MiniMax API 基础 URL（默认 `https://api.minimax.io`，环境变量：`MINIMAX_API_HOST`）。
- `providers.minimax.model`：TTS 模型（默认 `speech-2.8-hd`，环境变量：`MINIMAX_TTS_MODEL`）。
- `providers.minimax.voiceId`：语音标识符（默认 `English_expressive_narrator`，环境变量：`MINIMAX_TTS_VOICE_ID`）。
- `providers.minimax.speed`：播放速度 `0.5..2.0`（默认 1.0）。
- `providers.minimax.vol`：音量 `(0, 10]`（默认 1.0；必须大于 0）。
- `providers.minimax.pitch`：音调偏移 `-12..12`（默认 0）。
- `providers.microsoft.enabled`：允许 Microsoft 语音使用（默认 `true`；无 API 密钥）。
- `providers.microsoft.voice`：Microsoft 神经语音名称（例如 `en-US-MichelleNeural`）。
- `providers.microsoft.lang`：语言代码（例如 `en-US`）。
- `providers.microsoft.outputFormat`：Microsoft 输出格式（例如 `audio-24khz-48kbitrate-mono-mp3`）。
  - 请参阅 Microsoft 语音输出格式以获取有效值；捆绑的 Edge 支持的传输并非支持所有格式。
- `providers.microsoft.rate` / `providers.microsoft.pitch` / `providers.microsoft.volume`：百分比字符串（例如 `+10%`、`-5%`）。
- `providers.microsoft.saveSubtitles`：在音频文件旁边写入 JSON 字幕。
- `providers.microsoft.proxy`：Microsoft 语音请求的代理 URL。
- `providers.microsoft.timeoutMs`：请求超时覆盖（毫秒）。
- `edge.*`：相同 Microsoft 设置的旧版别名。

## 模型驱动的覆盖（默认开启）

默认情况下，模型**可以**为单个回复发出 TTS 指令。
当 `messages.tts.auto` 为 `tagged` 时，需要这些指令来触发音频。

启用时，模型可以发出 `[[tts:...]]` 指令来覆盖单个回复的语音，加上可选的
`[[tts:text]]...[[/tts:text]]` 块来提供表达性标签（笑声、唱歌提示等），这些标签应该
只出现在音频中。

除非 `modelOverrides.allowProvider: true`，否则 `provider=...` 指令会被忽略。

示例回复有效载荷：

```
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

可用的指令键（启用时）：

- `provider`（已注册的语音提供程序 ID，例如 `openai`、`elevenlabs`、`minimax` 或 `microsoft`；需要 `allowProvider: true`）
- `voice`（OpenAI 语音）或 `voiceId`（ElevenLabs / MiniMax）
- `model`（OpenAI TTS 模型、ElevenLabs 模型 id 或 MiniMax 模型）
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，0-10）
- `pitch`（MiniMax 音调，-12 至 12）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

禁用所有模型覆盖：

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: false,
      },
    },
  },
}
```

可选允许列表（启用 Provider 切换，同时保持其他旋钮可配置）：

```json5
{
  messages: {
    tts: {
      modelOverrides: {
        enabled: true,
        allowProvider: true,
        allowSeed: false,
      },
    },
  },
}
```

## 每用户偏好

斜杠命令将本地覆盖写入 `prefsPath`（默认：`~/.openclaw/settings/tts.json`，
使用 `OPENCLAW_TTS_PREFS` 或 `messages.tts.prefsPath` 覆盖）。

存储的字段：

- `enabled`
- `provider`
- `maxLength`（摘要阈值；默认 1500 字符）
- `summarize`（默认 `true`）

这些覆盖该主机的 `messages.tts.*`。

## 输出格式（固定）

- **Feishu / Matrix / Telegram / WhatsApp**：Opus 语音消息（来自 ElevenLabs 的 `opus_48000_64`，来自 OpenAI 的 `opus`）。
  - 48kHz / 64kbps 是语音消息的良好折衷方案。
- **其他通道**：MP3（来自 ElevenLabs 的 `mp3_44100_128`，来自 OpenAI 的 `mp3`）。
  - 44.1kHz / 128kbps 是语音清晰度的默认平衡。
- **MiniMax**：MP3（`speech-2.8-hd` 模型，32kHz 采样率）。原生不支持语音笔记格式；如需保证 Opus 语音消息请使用 OpenAI 或 ElevenLabs。
- **Microsoft**：使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - 捆绑的传输接受 `outputFormat`，但并非所有格式都可从服务获得。
  - 输出格式值遵循 Microsoft 语音输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如果您需要保证的 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果配置的 Microsoft 输出格式失败，OpenClaw 使用 MP3 重试。

OpenAI/ElevenLabs 输出格式按通道固定（见上文）。

## 自动 TTS 行为

启用时，OpenClaw：

- 如果回复已包含媒体或 `MEDIA:` 指令，则跳过 TTS。
- 跳过非常短的回复（< 10 个字符）。
- 使用 `agents.defaults.model.primary`（或 `summaryModel`）在启用时总结长回复。
- 将生成的音频附加到回复。

如果回复超过 `maxLength` 且摘要关闭（或摘要模型没有 API 密钥），则跳过音频并发送正常
文本回复。

## 流程图

```
回复 -> TTS 已启用?
  否  -> 发送文本
  是 -> 有媒体 / MEDIA: / 短?
          是 -> 发送文本
          否  -> 长度 > 限制?
                   否  -> TTS -> 附加音频
                   是 -> 摘要已启用?
                            否  -> 发送文本
                            是 -> 摘要(summaryModel 或 agents.defaults.model.primary)
                                      -> TTS -> 附加音频
```

## 斜杠命令用法

有一个命令：`/tts`。
有关启用详细信息，请参阅[斜杠命令](/tools/slash-commands)。

Discord 注意：`/tts` 是内置的 Discord 命令，因此 OpenClaw 在那里注册 `/voice` 作为
原生命令。文本 `/tts ...` 仍然有效。

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

注意：

- 命令需要授权发送者（允许列表/所有者规则仍然适用）。
- 必须启用 `commands.text` 或原生命令注册。
- `off|always|inbound|tagged` 是每会话切换（`/tts on` 是 `/tts always` 的别名）。
- `limit` 和 `summary` 存储在本地偏好中，而不是主配置中。
- `/tts audio` 生成一次性音频回复（不切换 TTS）。
- `/tts status` 包含最新尝试的回退可见性：
  - 成功回退：`Fallback: <primary> -> <used>` 加上 `Attempts: ...`
  - 失败：`Error: ...` 加上 `Attempts: ...`
  - 详细诊断：`Attempt details: provider:outcome(reasonCode) latency`
- OpenAI 和 ElevenLabs API 失败现在包含解析后的提供程序错误详情和请求 id（当由提供程序返回时），在 TTS 错误/日志中显示。

## Agent 工具

`tts` 工具将文本转换为语音并返回用于回复投递的音频附件。当 Channel 为 Feishu、Matrix、Telegram 或 WhatsApp 时，音频作为语音消息而非文件附件投递。

## 网关 RPC

网关方法：

- `tts.status`
- `tts.enable`
- `tts.disable`
- `tts.convert`
- `tts.setProvider`
- `tts.providers`
