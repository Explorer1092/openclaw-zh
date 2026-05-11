---
mmh3_hash: "a4db75f35614635ec264e2f9397afeed"
summary: "用于出站回复的文本转语音 — Provider、Persona、斜杠命令和每 Channel 输出"
read_when:
  - 为回复启用文本转语音
  - 配置 TTS Provider、回退链或 Persona
  - 使用 /tts 命令或指令
title: "文本转语音"
sidebarTitle: "文本转语音（TTS）"
---

OpenClaw 可通过 **14 个语音 Provider** 将出站回复转换为音频，并在 Feishu、Matrix、Telegram 和 WhatsApp 上投递原生语音消息，在其他地方作为音频附件，以及为电话和 Talk 提供 PCM/Ulaw 流。

TTS 是 Talk 的 `stt-tts` 模式的语音输出半段。Provider 原生的 `realtime` Talk Session 在实时 Provider 内部合成语音，不走此 TTS 路径；`transcription` Session 不合成助手语音回复。

## 快速入门

<Steps>
  <Step title="选择 Provider">
    OpenAI 和 ElevenLabs 是最可靠的托管选项。Microsoft 和 Local CLI 无需 API 密钥。完整列表见[支持的 Provider](#supported-providers)。
  </Step>
  <Step title="设置 API 密钥">
    为您的 Provider 导出环境变量（例如 `OPENAI_API_KEY`、`ELEVENLABS_API_KEY`）。Microsoft 和 Local CLI 无需密钥。
  </Step>
  <Step title="在配置中启用">
    设置 `messages.tts.auto: "always"` 和 `messages.tts.provider`：

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

  </Step>
  <Step title="在聊天中试用">
    `/tts status` 显示当前状态。`/tts audio Hello from OpenClaw` 发送一次性音频回复。
  </Step>
</Steps>

<Note>
自动 TTS 默认**关闭**。当 `messages.tts.provider` 未设置时，OpenClaw 按注册表自动选择顺序选择第一个已配置的 Provider。内置的 `tts` Agent 工具仅用于显式意图：普通聊天保持文本形式，除非用户要求音频、使用 `/tts` 或启用自动 TTS/指令语音。
</Note>

## 支持的 Provider

| Provider          | 认证                                                                                                             | 备注                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Azure Speech**  | `AZURE_SPEECH_KEY` + `AZURE_SPEECH_REGION`（也支持 `AZURE_SPEECH_API_KEY`、`SPEECH_KEY`、`SPEECH_REGION`）      | 原生 Ogg/Opus 语音消息输出和电话。                                                     |
| **DeepInfra**     | `DEEPINFRA_API_KEY`                                                                                              | 兼容 OpenAI 的 TTS。默认使用 `hexgrad/Kokoro-82M`。                                    |
| **ElevenLabs**    | `ELEVENLABS_API_KEY` 或 `XI_API_KEY`                                                                             | 声音克隆、多语言、通过 `seed` 确定性；为 Discord 语音播放流式传输。                    |
| **Google Gemini** | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                                                                             | Gemini API 批量 TTS；通过 `promptTemplate: "audio-profile-v1"` 支持 Persona。           |
| **Gradium**       | `GRADIUM_API_KEY`                                                                                                | 语音消息和电话输出。                                                                   |
| **Inworld**       | `INWORLD_API_KEY`                                                                                                | 流式 TTS API。原生 Opus 语音消息和 PCM 电话。                                          |
| **Local CLI**     | 无                                                                                                               | 运行已配置的本地 TTS 命令。                                                            |
| **Microsoft**     | 无                                                                                                               | 通过 `node-edge-tts` 的公共 Edge 神经 TTS。尽力而为，无 SLA。                          |
| **MiniMax**       | `MINIMAX_API_KEY`（或 Token Plan：`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`）     | T2A v2 API。默认使用 `speech-2.8-hd`。                                                 |
| **OpenAI**        | `OPENAI_API_KEY`                                                                                                 | 也用于自动摘要；支持 Persona `instructions`。                                          |
| **OpenRouter**    | `OPENROUTER_API_KEY`（可复用 `models.providers.openrouter.apiKey`）                                              | 默认模型 `hexgrad/kokoro-82m`。                                                        |
| **Volcengine**    | `VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`（旧版 AppID/token：`VOLCENGINE_TTS_APPID`/`_TOKEN`） | BytePlus Seed Speech HTTP API。                                                        |
| **Vydra**         | `VYDRA_API_KEY`                                                                                                  | 共享图像、视频和语音 Provider。                                                        |
| **xAI**           | `XAI_API_KEY`                                                                                                    | xAI 批量 TTS。不支持原生 Opus 语音消息格式。                                           |
| **Xiaomi MiMo**   | `XIAOMI_API_KEY`                                                                                                 | 通过 Xiaomi 聊天补全的 MiMo TTS。                                                      |

如果配置了多个 Provider，优先使用所选 Provider，其他作为回退选项。自动摘要使用 `summaryModel`（或 `agents.defaults.model.primary`），因此如果启用摘要，该 Provider 也必须完成认证。

<Warning>
捆绑的 **Microsoft** Provider 通过 `node-edge-tts` 使用 Microsoft Edge 的在线神经 TTS 服务。这是没有已公布 SLA 或配额的公共 Web 服务——请将其视为尽力而为。旧版 Provider id `edge` 被归一化为 `microsoft`，`openclaw doctor --fix` 会重写持久化配置；新配置应始终使用 `microsoft`。
</Warning>

## 配置

TTS 配置位于 `~/.openclaw/openclaw.json` 中的 `messages.tts` 下。选择一个预设并适配 Provider 块：

<Tabs>
  <Tab title="Azure Speech">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "azure-speech",
      providers: {
        "azure-speech": {
          apiKey: "${AZURE_SPEECH_KEY}",
          region: "eastus",
          voice: "en-US-JennyNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          voiceNoteOutputFormat: "ogg-24khz-16bit-mono-opus",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Google Gemini">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "google",
      providers: {
        google: {
          apiKey: "${GEMINI_API_KEY}",
          model: "gemini-3.1-flash-tts-preview",
          voiceName: "Kore",
          // 可选的自然语言风格提示：
          // audioProfile: "Speak in a calm, podcast-host tone.",
          // speakerName: "Alex",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Gradium">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "gradium",
      providers: {
        gradium: {
          apiKey: "${GRADIUM_API_KEY}",
          voiceId: "YTpq7expH9539ERJ",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Inworld">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "inworld",
      providers: {
        inworld: {
          apiKey: "${INWORLD_API_KEY}",
          modelId: "inworld-tts-1.5-max",
          voiceId: "Sarah",
          temperature: 0.7,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Local CLI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "tts-local-cli",
      providers: {
        "tts-local-cli": {
          command: "say",
          args: ["-o", "{{OutputPath}}", "{{Text}}"],
          outputFormat: "wav",
          timeoutMs: 120000,
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Microsoft（无密钥）">
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
          rate: "+0%",
          pitch: "+0%",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="MiniMax">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "minimax",
      providers: {
        minimax: {
          apiKey: "${MINIMAX_API_KEY}",
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
  </Tab>
  <Tab title="OpenAI + ElevenLabs">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openai",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      providers: {
        openai: {
          apiKey: "${OPENAI_API_KEY}",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
        elevenlabs: {
          apiKey: "${ELEVENLABS_API_KEY}",
          model: "eleven_multilingual_v2",
          voiceId: "EXAVITQu4vr4xnSDxMaL",
          voiceSettings: { stability: 0.5, similarityBoost: 0.75, style: 0.0, useSpeakerBoost: true, speed: 1.0 },
          applyTextNormalization: "auto",
          languageCode: "en",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="OpenRouter">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          apiKey: "${OPENROUTER_API_KEY}",
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Volcengine">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "volcengine",
      providers: {
        volcengine: {
          apiKey: "${VOLCENGINE_TTS_API_KEY}",
          resourceId: "seed-tts-1.0",
          voice: "en_female_anna_mars_bigtts",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="xAI">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xai",
      providers: {
        xai: {
          apiKey: "${XAI_API_KEY}",
          voiceId: "eve",
          language: "en",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
  <Tab title="Xiaomi MiMo">
```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "${XIAOMI_API_KEY}",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
        },
      },
    },
  },
}
```
  </Tab>
</Tabs>

### 每 Agent 语音覆盖

当某个 Agent 需要使用不同的 Provider、语音、模型、Persona 或自动 TTS 模式时，使用 `agents.list[].tts`。Agent 块深度合并到 `messages.tts` 上，因此 Provider 凭据可以保留在全局 Provider 配置中：

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "elevenlabs",
      providers: {
        elevenlabs: { apiKey: "${ELEVENLABS_API_KEY}", model: "eleven_multilingual_v2" },
      },
    },
  },
  agents: {
    list: [
      {
        id: "reader",
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
      },
    ],
  },
}
```

要固定每 Agent Persona，在 Provider 配置旁设置 `agents.list[].tts.persona`——它仅对该 Agent 覆盖全局 `messages.tts.persona`。

自动回复、`/tts audio`、`/tts status` 和 `tts` Agent 工具的优先级顺序：

1. `messages.tts`
2. 活跃的 `agents.list[].tts`
3. Channel 覆盖（当 Channel 支持 `channels.<channel>.tts` 时）
4. 账户覆盖（当 Channel 传递 `channels.<channel>.accounts.<id>.tts` 时）
5. 此主机的本地 `/tts` 偏好
6. 内联 `[[tts:...]]` 指令（当[模型覆盖](#model-driven-directives)启用时）

Channel 和账户覆盖使用与 `messages.tts` 相同的结构，并深度合并到早期层，因此共享 Provider 凭据可以保留在 `messages.tts` 中，而 Channel 或 bot 账户只更改语音、模型、Persona 或自动模式。

## Persona

**Persona** 是一种稳定的语音身份，可以跨 Provider 确定性地应用。它可以偏好某个 Provider、定义 Provider 无关的提示意图，并为语音、模型、提示模板、seed 和语音设置携带 Provider 特定绑定。

### 最简 Persona

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "narrator",
      personas: {
        narrator: {
          label: "Narrator",
          provider: "elevenlabs",
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL", modelId: "eleven_multilingual_v2" },
          },
        },
      },
    },
  },
}
```

### 完整 Persona（Provider 无关提示）

```json5
{
  messages: {
    tts: {
      auto: "always",
      persona: "alfred",
      personas: {
        alfred: {
          label: "Alfred",
          description: "Dry, warm British butler narrator.",
          provider: "google",
          fallbackPolicy: "preserve-persona",
          prompt: {
            profile: "A brilliant British butler. Dry, witty, warm, charming, emotionally expressive, never generic.",
            scene: "A quiet late-night study. Close-mic narration for a trusted operator.",
            sampleContext: "The speaker is answering a private technical request with concise confidence and dry warmth.",
            style: "Refined, understated, lightly amused.",
            accent: "British English.",
            pacing: "Measured, with short dramatic pauses.",
            constraints: ["Do not read configuration values aloud.", "Do not explain the persona."],
          },
          providers: {
            google: {
              model: "gemini-3.1-flash-tts-preview",
              voiceName: "Algieba",
              promptTemplate: "audio-profile-v1",
            },
            openai: { model: "gpt-4o-mini-tts", voice: "cedar" },
            elevenlabs: {
              voiceId: "voice_id",
              modelId: "eleven_multilingual_v2",
              seed: 42,
              voiceSettings: {
                stability: 0.65,
                similarityBoost: 0.8,
                style: 0.25,
                useSpeakerBoost: true,
                speed: 0.95,
              },
            },
          },
        },
      },
    },
  },
}
```

### Persona 解析

活跃 Persona 的选择是确定性的：

1. `/tts persona <id>` 本地偏好（如已设置）。
2. `messages.tts.persona`（如已设置）。
3. 无 Persona。

Provider 选择显式优先：

1. 直接覆盖（CLI、Gateway、Talk、允许的 TTS 指令）。
2. `/tts provider <id>` 本地偏好。
3. 活跃 Persona 的 `provider`。
4. `messages.tts.provider`。
5. 注册表自动选择。

对于每次 Provider 尝试，OpenClaw 按以下顺序合并配置：

1. `messages.tts.providers.<id>`
2. `messages.tts.personas.<persona>.providers.<id>`
3. 受信任的请求覆盖
4. 允许的模型发出的 TTS 指令覆盖

### Provider 如何使用 Persona 提示

Persona 提示字段（`profile`、`scene`、`sampleContext`、`style`、`accent`、`pacing`、`constraints`）是 **Provider 无关的**。每个 Provider 决定如何使用它们：

<AccordionGroup>
  <Accordion title="Google Gemini">
    仅当有效的 Google Provider 配置设置了 `promptTemplate: "audio-profile-v1"` 或 `personaPrompt` 时，才将 Persona 提示字段包装在 Gemini TTS 提示结构中。旧版 `audioProfile` 和 `speakerName` 字段仍作为 Google 特定提示文本前置。`[[tts:text]]` 块内的内联音频标签（如 `[whispers]` 或 `[laughs]`）会被保留在 Gemini 转录中；OpenClaw 不会生成这些标签。
  </Accordion>
  <Accordion title="OpenAI">
    仅当没有显式配置 OpenAI `instructions` 时，才将 Persona 提示字段映射到请求的 `instructions` 字段。显式 `instructions` 始终优先。
  </Accordion>
  <Accordion title="其他 Provider">
    仅使用 `personas.<id>.providers.<provider>` 下的 Provider 特定 Persona 绑定。除非 Provider 实现了自己的 Persona 提示映射，否则 Persona 提示字段被忽略。
  </Accordion>
</AccordionGroup>

### 回退策略

`fallbackPolicy` 控制当 Persona **没有**所尝试 Provider 的绑定时的行为：

| 策略                | 行为                                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `preserve-persona`  | **默认。** Provider 无关提示字段保持可用；Provider 可以使用或忽略它们。                                                              |
| `provider-defaults` | 该次尝试中 Persona 从提示准备中省略；Provider 使用其中性默认值，同时继续回退到其他 Provider。                                       |
| `fail`              | 以 `reasonCode: "not_configured"` 和 `personaBinding: "missing"` 跳过该 Provider 尝试。仍然尝试回退 Provider。                       |

仅当**每个**尝试的 Provider 都被跳过或失败时，整个 TTS 请求才会失败。

## 模型驱动的指令

默认情况下，助手**可以**发出 `[[tts:...]]` 指令来覆盖单条回复的语音、模型或速度，以及可选的 `[[tts:text]]...[[/tts:text]]` 块，用于提供仅在音频中出现的富有表现力的提示：

```text
Here you go.

[[tts:voiceId=pMsXgVXv3BLzUgSXRplE model=eleven_v3 speed=1.1]]
[[tts:text]](laughs) Read the song once more.[[/tts:text]]
```

当 `messages.tts.auto` 为 `"tagged"` 时，**需要指令**来触发音频。流式块投递在 Channel 看到指令之前将其从可见文本中剥离，即使指令跨相邻块拆分也如此。

除非 `modelOverrides.allowProvider: true`，否则 `provider=...` 被忽略。当回复声明 `provider=...` 时，该指令中的其他键仅由该 Provider 解析；不支持的键被剥离并报告为 TTS 指令警告。

**可用的指令键：**

- `provider`（已注册的 Provider id；需要 `allowProvider: true`）
- `voice` / `voiceName` / `voice_name` / `google_voice` / `voiceId`
- `model` / `google_model`
- `stability`、`similarityBoost`、`style`、`speed`、`useSpeakerBoost`
- `vol` / `volume`（MiniMax 音量，0–10）
- `pitch`（MiniMax 整数音调，-12 到 12；小数值被截断）
- `emotion`（Volcengine 情感标签）
- `applyTextNormalization`（`auto|on|off`）
- `languageCode`（ISO 639-1）
- `seed`

**完全禁用模型覆盖：**

```json5
{ messages: { tts: { modelOverrides: { enabled: false } } } }
```

**允许 Provider 切换同时保持其他旋钮可配置：**

```json5
{ messages: { tts: { modelOverrides: { enabled: true, allowProvider: true, allowSeed: false } } } }
```

## 斜杠命令

单个命令 `/tts`。在 Discord 上，OpenClaw 也注册 `/voice`，因为 `/tts` 是 Discord 内置命令——文本 `/tts ...` 仍然有效。

```text
/tts off | on | status
/tts chat on | off | default
/tts latest
/tts provider <id>
/tts persona <id> | off
/tts limit <chars>
/tts summary off
/tts audio <text>
```

<Note>
命令需要授权发送者（允许列表/所有者规则适用），且必须启用 `commands.text` 或原生命令注册。
</Note>

行为说明：

- `/tts on` 将本地 TTS 偏好写入 `always`；`/tts off` 将其写入 `off`。
- `/tts chat on|off|default` 为当前聊天写入 Session 范围的自动 TTS 覆盖。
- `/tts persona <id>` 写入本地 Persona 偏好；`/tts persona off` 清除它。
- `/tts latest` 从当前 Session 转录读取最新的助手回复，并将其作为音频发送一次。它仅在 Session 条目上存储该回复的哈希以抑制重复语音发送。
- `/tts audio` 生成一次性音频回复（**不**切换 TTS 开启）。
- `limit` 和 `summary` 存储在**本地偏好**中，而非主配置中。
- `/tts status` 包含最近尝试的回退诊断——`Fallback: <primary> -> <used>`、`Attempts: ...` 和每次尝试详情（`provider:outcome(reasonCode) latency`）。
- `/status` 显示活跃 TTS 模式以及已配置的 Provider、模型、语音，以及启用 TTS 时的已清理自定义端点元数据。

## 每用户偏好

斜杠命令将本地覆盖写入 `prefsPath`。默认为 `~/.openclaw/settings/tts.json`；通过 `OPENCLAW_TTS_PREFS` 环境变量或 `messages.tts.prefsPath` 覆盖。

| 存储字段     | 效果                                        |
| ------------ | ------------------------------------------- |
| `auto`       | 本地自动 TTS 覆盖（`always`、`off`，…）    |
| `provider`   | 本地主 Provider 覆盖                        |
| `persona`    | 本地 Persona 覆盖                           |
| `maxLength`  | 摘要阈值（默认 `1500` 字符）                |
| `summarize`  | 摘要开关（默认 `true`）                     |

这些覆盖该主机的 `messages.tts` 加上活跃 `agents.list[].tts` 块的有效配置。

## 输出格式（固定）

TTS 语音投递由 Channel 能力驱动。Channel Plugin 声明语音风格 TTS 是否应向 Provider 请求原生 `voice-note` 目标或保持正常 `audio-file` 合成。

- **支持语音消息的 Channel**：语音消息回复偏好 Opus（ElevenLabs 的 `opus_48000_64`，OpenAI 的 `opus`）。
  - 48kHz / 64kbps 是语音消息的良好权衡。
- **Feishu / WhatsApp**：当语音消息回复以 MP3/WebM/WAV/M4A 或其他可能的音频文件形式产生时，Channel Plugin 在发送原生语音消息之前使用 `ffmpeg` 将其转码为 48kHz Ogg/Opus。WhatsApp 通过 Baileys `audio` 有效负载发送结果（`ptt: true` 和 `audio/ogg; codecs=opus`）。如果转换失败，Feishu 将原始文件作为附件接收；WhatsApp 发送失败，而不是发布不兼容的 PTT 有效负载。
- **其他 Channel**：MP3（ElevenLabs 的 `mp3_44100_128`，OpenAI 的 `mp3`）。
  - 44.1kHz / 128kbps 是语音清晰度的默认平衡点。
- **MiniMax**：MP3（`speech-2.8-hd` 模型，32kHz 采样率）用于普通音频附件。对于 Channel 声明的语音消息目标，当 Channel 声明转码时，OpenClaw 使用 `ffmpeg` 将 MiniMax MP3 转码为 48kHz Opus 后投递。
- **Xiaomi MiMo**：默认 MP3，或配置时为 WAV。对于 Channel 声明的语音消息目标，当 Channel 声明转码时，OpenClaw 使用 `ffmpeg` 将 Xiaomi 输出转码为 48kHz Opus 后投递。
- **Local CLI**：使用配置的 `outputFormat`。语音消息目标转换为 Ogg/Opus，电话输出使用 `ffmpeg` 转换为原始 16kHz 单声道 PCM。
- **Google Gemini**：Gemini API TTS 返回原始 24kHz PCM。OpenClaw 将其作为 WAV 封装用于音频附件，转码为 48kHz Opus 用于语音消息目标，并直接返回 PCM 用于 Talk/电话。
- **Gradium**：WAV 用于音频附件，Opus 用于语音消息目标，8kHz 的 `ulaw_8000` 用于电话。
- **Inworld**：MP3 用于普通音频附件，原生 `OGG_OPUS` 用于语音消息目标，22050Hz 的原始 `PCM` 用于 Talk/电话。
- **xAI**：默认 MP3；`responseFormat` 可以是 `mp3`、`wav`、`pcm`、`mulaw` 或 `alaw`。OpenClaw 使用 xAI 的批量 REST TTS 端点并返回完整音频附件；xAI 的流式 TTS WebSocket 不在此 Provider 路径中使用。此路径不支持原生 Opus 语音消息格式。
- **Microsoft**：使用 `microsoft.outputFormat`（默认 `audio-24khz-48kbitrate-mono-mp3`）。
  - 捆绑的传输层接受 `outputFormat`，但并非所有格式都可从服务获得。
  - 输出格式值遵循 Microsoft 语音输出格式（包括 Ogg/WebM Opus）。
  - Telegram `sendVoice` 接受 OGG/MP3/M4A；如需保证 Opus 语音消息，请使用 OpenAI/ElevenLabs。
  - 如果配置的 Microsoft 输出格式失败，OpenClaw 重试 MP3。

OpenAI/ElevenLabs 输出格式按 Channel 固定（见上文）。

## 自动 TTS 行为

当 `messages.tts.auto` 启用时，OpenClaw：

- 如果回复已包含媒体或 `MEDIA:` 指令，跳过 TTS。
- 跳过非常短的回复（< 10 个字符）。
- 启用时使用 `summaryModel`（或 `agents.defaults.model.primary`）摘要长回复。
- 将生成的音频附加到回复中。
- 在 `mode: "final"` 模式下，流式最终回复完成后仍发送纯音频 TTS；生成的媒体经过与普通回复附件相同的 Channel 媒体归一化处理。

如果回复超过 `maxLength` 且摘要关闭（或摘要模型无 API 密钥），则跳过音频并发送普通文本回复。

```text
回复 -> TTS 已启用？
  否  -> 发送文本
  是  -> 包含媒体 / MEDIA: / 太短？
          是  -> 发送文本
          否  -> 长度 > 限制？
                   否  -> TTS -> 附加音频
                   是  -> 摘要已启用？
                            否  -> 发送文本
                            是  -> 摘要 -> TTS -> 附加音频
```

## 按 Channel 的输出格式

| 目标                                  | 格式                                                                                                                                   |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Feishu / Matrix / Telegram / WhatsApp | 语音消息回复偏好 **Opus**（ElevenLabs 的 `opus_48000_64`，OpenAI 的 `opus`）。48kHz / 64kbps 兼顾清晰度和大小。                       |
| 其他 Channel                          | **MP3**（ElevenLabs 的 `mp3_44100_128`，OpenAI 的 `mp3`）。44.1kHz / 128kbps 语音的默认设置。                                        |
| Talk / 电话                           | Provider 原生 **PCM**（Inworld 22050Hz，Google 24kHz），或 Gradium 的 `ulaw_8000` 用于电话。                                           |

## 字段参考

<AccordionGroup>
  <Accordion title="顶层 messages.tts.*">
    <ParamField path="auto" type='"off" | "always" | "inbound" | "tagged"'>
      自动 TTS 模式。`inbound` 仅在入站语音消息后发送音频；`tagged` 仅在回复包含 `[[tts:...]]` 指令或 `[[tts:text]]` 块时发送音频。
    </ParamField>
    <ParamField path="enabled" type="boolean" deprecated>
      旧版开关。`openclaw doctor --fix` 将其迁移到 `auto`。
    </ParamField>
    <ParamField path="mode" type='"final" | "all"' default="final">
      `"all"` 除最终回复外还包括工具/块回复。
    </ParamField>
    <ParamField path="provider" type="string">
      语音 Provider id。未设置时，OpenClaw 按注册表自动选择顺序使用第一个已配置的 Provider。旧版 `provider: "edge"` 由 `openclaw doctor --fix` 重写为 `"microsoft"`。
    </ParamField>
    <ParamField path="persona" type="string">
      来自 `personas` 的活跃 Persona id。归一化为小写。
    </ParamField>
    <ParamField path="personas.<id>" type="object">
      稳定的语音身份。字段：`label`、`description`、`provider`、`fallbackPolicy`、`prompt`、`providers.<provider>`。见 [Persona](#persona)。
    </ParamField>
    <ParamField path="summaryModel" type="string">
      用于自动摘要的低成本模型；默认为 `agents.defaults.model.primary`。接受 `provider/model` 或已配置的模型别名。
    </ParamField>
    <ParamField path="modelOverrides" type="object">
      允许模型发出 TTS 指令。`enabled` 默认为 `true`；`allowProvider` 默认为 `false`。
    </ParamField>
    <ParamField path="providers.<id>" type="object">
      按语音 Provider id 键入的 Provider 专有设置。旧版直接块（`messages.tts.openai`、`.elevenlabs`、`.microsoft`、`.edge`）由 `openclaw doctor --fix` 重写；只提交 `messages.tts.providers.<id>`。
    </ParamField>
    <ParamField path="maxTextLength" type="number">
      TTS 输入字符的硬性上限。`/tts audio` 在超出时失败。
    </ParamField>
    <ParamField path="timeoutMs" type="number">
      请求超时（毫秒）。
    </ParamField>
    <ParamField path="prefsPath" type="string">
      覆盖本地偏好 JSON 路径（Provider/限制/摘要）。默认 `~/.openclaw/settings/tts.json`。
    </ParamField>
  </Accordion>

  <Accordion title="Azure Speech">
    <ParamField path="apiKey" type="string">环境变量：`AZURE_SPEECH_KEY`、`AZURE_SPEECH_API_KEY` 或 `SPEECH_KEY`。</ParamField>
    <ParamField path="region" type="string">Azure Speech 地区（如 `eastus`）。环境变量：`AZURE_SPEECH_REGION` 或 `SPEECH_REGION`。</ParamField>
    <ParamField path="endpoint" type="string">可选的 Azure Speech 端点覆盖（别名 `baseUrl`）。</ParamField>
    <ParamField path="voice" type="string">Azure 语音 ShortName。默认 `en-US-JennyNeural`。</ParamField>
    <ParamField path="lang" type="string">SSML 语言代码。默认 `en-US`。</ParamField>
    <ParamField path="outputFormat" type="string">标准音频的 Azure `X-Microsoft-OutputFormat`。默认 `audio-24khz-48kbitrate-mono-mp3`。</ParamField>
    <ParamField path="voiceNoteOutputFormat" type="string">语音消息输出的 Azure `X-Microsoft-OutputFormat`。默认 `ogg-24khz-16bit-mono-opus`。</ParamField>
  </Accordion>

  <Accordion title="ElevenLabs">
    <ParamField path="apiKey" type="string">回退到 `ELEVENLABS_API_KEY` 或 `XI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">模型 id（如 `eleven_multilingual_v2`、`eleven_v3`）。</ParamField>
    <ParamField path="voiceId" type="string">ElevenLabs 语音 id。</ParamField>
    <ParamField path="voiceSettings" type="object">
      `stability`、`similarityBoost`、`style`（各 `0..1`），`useSpeakerBoost`（`true|false`），`speed`（`0.5..2.0`，`1.0` = 正常）。
    </ParamField>
    <ParamField path="applyTextNormalization" type='"auto" | "on" | "off"'>文本归一化模式。</ParamField>
    <ParamField path="languageCode" type="string">2 位 ISO 639-1（如 `en`、`de`）。</ParamField>
    <ParamField path="seed" type="number">整数 `0..4294967295`，尽力实现确定性。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 ElevenLabs API base URL。</ParamField>
  </Accordion>

  <Accordion title="Google Gemini">
    <ParamField path="apiKey" type="string">回退到 `GEMINI_API_KEY` / `GOOGLE_API_KEY`。如省略，TTS 可在环境变量回退之前复用 `models.providers.google.apiKey`。</ParamField>
    <ParamField path="model" type="string">Gemini TTS 模型。默认 `gemini-3.1-flash-tts-preview`。</ParamField>
    <ParamField path="voiceName" type="string">Gemini 预置语音名称。默认 `Kore`。别名：`voice`。</ParamField>
    <ParamField path="audioProfile" type="string">在朗读文本前追加的自然语言风格提示。</ParamField>
    <ParamField path="speakerName" type="string">提示使用命名发言者时，在朗读文本前追加的可选发言者标签。</ParamField>
    <ParamField path="promptTemplate" type='"audio-profile-v1"'>设置为 `audio-profile-v1` 以将活跃 Persona 提示字段包装在确定性的 Gemini TTS 提示结构中。</ParamField>
    <ParamField path="personaPrompt" type="string">附加到模板导演注释的 Google 特定额外 Persona 提示文本。</ParamField>
    <ParamField path="baseUrl" type="string">仅接受 `https://generativelanguage.googleapis.com`。</ParamField>
  </Accordion>

  <Accordion title="Gradium">
    <ParamField path="apiKey" type="string">环境变量：`GRADIUM_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认 `https://api.gradium.ai`。</ParamField>
    <ParamField path="voiceId" type="string">默认 Emma（`YTpq7expH9539ERJ`）。</ParamField>
  </Accordion>

  <Accordion title="Inworld">
    <ParamField path="apiKey" type="string">环境变量：`INWORLD_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认 `https://api.inworld.ai`。</ParamField>
    <ParamField path="modelId" type="string">默认 `inworld-tts-1.5-max`。也支持：`inworld-tts-1.5-mini`、`inworld-tts-1-max`、`inworld-tts-1`。</ParamField>
    <ParamField path="voiceId" type="string">默认 `Sarah`。</ParamField>
    <ParamField path="temperature" type="number">采样温度 `0..2`。</ParamField>
  </Accordion>

  <Accordion title="Local CLI（tts-local-cli）">
    <ParamField path="command" type="string">CLI TTS 的本地可执行文件或命令字符串。</ParamField>
    <ParamField path="args" type="string[]">命令参数。支持 `{{Text}}`、`{{OutputPath}}`、`{{OutputDir}}`、`{{OutputBase}}` 占位符。</ParamField>
    <ParamField path="outputFormat" type='"mp3" | "opus" | "wav"'>预期的 CLI 输出格式。音频附件默认 `mp3`。</ParamField>
    <ParamField path="timeoutMs" type="number">命令超时（毫秒）。默认 `120000`。</ParamField>
    <ParamField path="cwd" type="string">可选命令工作目录。</ParamField>
    <ParamField path="env" type="Record<string, string>">命令的可选环境覆盖。</ParamField>
  </Accordion>

  <Accordion title="Microsoft（无 API 密钥）">
    <ParamField path="enabled" type="boolean" default="true">允许使用 Microsoft 语音。</ParamField>
    <ParamField path="voice" type="string">Microsoft 神经语音名称（如 `en-US-MichelleNeural`）。</ParamField>
    <ParamField path="lang" type="string">语言代码（如 `en-US`）。</ParamField>
    <ParamField path="outputFormat" type="string">Microsoft 输出格式。默认 `audio-24khz-48kbitrate-mono-mp3`。捆绑的 Edge 传输层不支持所有格式。</ParamField>
    <ParamField path="rate / pitch / volume" type="string">百分比字符串（如 `+10%`、`-5%`）。</ParamField>
    <ParamField path="saveSubtitles" type="boolean">将 JSON 字幕写入音频文件旁边。</ParamField>
    <ParamField path="proxy" type="string">Microsoft 语音请求的代理 URL。</ParamField>
    <ParamField path="timeoutMs" type="number">请求超时覆盖（毫秒）。</ParamField>
    <ParamField path="edge.*" type="object" deprecated>旧版别名。运行 `openclaw doctor --fix` 将持久化配置重写为 `providers.microsoft`。</ParamField>
  </Accordion>

  <Accordion title="MiniMax">
    <ParamField path="apiKey" type="string">回退到 `MINIMAX_API_KEY`。Token Plan 认证通过 `MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY` 或 `MINIMAX_CODING_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认 `https://api.minimax.io`。环境变量：`MINIMAX_API_HOST`。</ParamField>
    <ParamField path="model" type="string">默认 `speech-2.8-hd`。环境变量：`MINIMAX_TTS_MODEL`。</ParamField>
    <ParamField path="voiceId" type="string">默认 `English_expressive_narrator`。环境变量：`MINIMAX_TTS_VOICE_ID`。</ParamField>
    <ParamField path="speed" type="number">`0.5..2.0`。默认 `1.0`。</ParamField>
    <ParamField path="vol" type="number">`(0, 10]`。默认 `1.0`。</ParamField>
    <ParamField path="pitch" type="number">整数 `-12..12`。默认 `0`。小数值在请求前截断。</ParamField>
  </Accordion>

  <Accordion title="OpenAI">
    <ParamField path="apiKey" type="string">回退到 `OPENAI_API_KEY`。</ParamField>
    <ParamField path="model" type="string">OpenAI TTS 模型 id（如 `gpt-4o-mini-tts`）。</ParamField>
    <ParamField path="voice" type="string">语音名称（如 `alloy`、`cedar`）。</ParamField>
    <ParamField path="instructions" type="string">显式 OpenAI `instructions` 字段。设置后，Persona 提示字段**不会**自动映射。</ParamField>
    <ParamField path="extraBody / extra_body" type="Record<string, unknown>">合并到 `/audio/speech` 请求体中 OpenAI TTS 字段之后的额外 JSON 字段。用于需要 Provider 特定键（如 `lang`）的 OpenAI 兼容端点（如 Kokoro）；不安全的原型键被忽略。</ParamField>
    <ParamField path="baseUrl" type="string">
      覆盖 OpenAI TTS 端点。解析顺序：配置 → `OPENAI_TTS_BASE_URL` → `https://api.openai.com/v1`。非默认值被视为兼容 OpenAI 的 TTS 端点，因此接受自定义模型和语音名称。
    </ParamField>
  </Accordion>

  <Accordion title="OpenRouter">
    <ParamField path="apiKey" type="string">环境变量：`OPENROUTER_API_KEY`。可复用 `models.providers.openrouter.apiKey`。</ParamField>
    <ParamField path="baseUrl" type="string">默认 `https://openrouter.ai/api/v1`。旧版 `https://openrouter.ai/v1` 被归一化。</ParamField>
    <ParamField path="model" type="string">默认 `hexgrad/kokoro-82m`。别名：`modelId`。</ParamField>
    <ParamField path="voice" type="string">默认 `af_alloy`。别名：`voiceId`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "pcm"'>默认 `mp3`。</ParamField>
    <ParamField path="speed" type="number">Provider 原生速度覆盖。</ParamField>
  </Accordion>

  <Accordion title="Volcengine（BytePlus Seed Speech）">
    <ParamField path="apiKey" type="string">环境变量：`VOLCENGINE_TTS_API_KEY` 或 `BYTEPLUS_SEED_SPEECH_API_KEY`。</ParamField>
    <ParamField path="resourceId" type="string">默认 `seed-tts-1.0`。环境变量：`VOLCENGINE_TTS_RESOURCE_ID`。当项目有 TTS 2.0 授权时使用 `seed-tts-2.0`。</ParamField>
    <ParamField path="appKey" type="string">App key 头部。默认 `aGjiRDfUWi`。环境变量：`VOLCENGINE_TTS_APP_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">覆盖 Seed Speech TTS HTTP 端点。环境变量：`VOLCENGINE_TTS_BASE_URL`。</ParamField>
    <ParamField path="voice" type="string">语音类型。默认 `en_female_anna_mars_bigtts`。环境变量：`VOLCENGINE_TTS_VOICE`。</ParamField>
    <ParamField path="speedRatio" type="number">Provider 原生速度比。</ParamField>
    <ParamField path="emotion" type="string">Provider 原生情感标签。</ParamField>
    <ParamField path="appId / token / cluster" type="string" deprecated>旧版 Volcengine Speech Console 字段。环境变量：`VOLCENGINE_TTS_APPID`、`VOLCENGINE_TTS_TOKEN`、`VOLCENGINE_TTS_CLUSTER`（默认 `volcano_tts`）。</ParamField>
  </Accordion>

  <Accordion title="xAI">
    <ParamField path="apiKey" type="string">环境变量：`XAI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认 `https://api.x.ai/v1`。环境变量：`XAI_BASE_URL`。</ParamField>
    <ParamField path="voiceId" type="string">默认 `eve`。可用语音：`ara`、`eve`、`leo`、`rex`、`sal`、`una`。</ParamField>
    <ParamField path="language" type="string">BCP-47 语言代码或 `auto`。默认 `en`。</ParamField>
    <ParamField path="responseFormat" type='"mp3" | "wav" | "pcm" | "mulaw" | "alaw"'>默认 `mp3`。</ParamField>
    <ParamField path="speed" type="number">Provider 原生速度覆盖。</ParamField>
  </Accordion>

  <Accordion title="Xiaomi MiMo">
    <ParamField path="apiKey" type="string">环境变量：`XIAOMI_API_KEY`。</ParamField>
    <ParamField path="baseUrl" type="string">默认 `https://api.xiaomimimo.com/v1`。环境变量：`XIAOMI_BASE_URL`。</ParamField>
    <ParamField path="model" type="string">默认 `mimo-v2.5-tts`。环境变量：`XIAOMI_TTS_MODEL`。也支持 `mimo-v2-tts`。</ParamField>
    <ParamField path="voice" type="string">默认 `mimo_default`。环境变量：`XIAOMI_TTS_VOICE`。</ParamField>
    <ParamField path="format" type='"mp3" | "wav"'>默认 `mp3`。环境变量：`XIAOMI_TTS_FORMAT`。</ParamField>
    <ParamField path="style" type="string">可选的自然语言风格指令，作为用户消息发送；不被朗读。</ParamField>
  </Accordion>
</AccordionGroup>

## Agent 工具

`tts` 工具将文本转换为语音，并返回用于回复投递的音频附件。在 Feishu、Matrix、Telegram 和 WhatsApp 上，音频作为语音消息而非文件附件投递。Feishu 和 WhatsApp 可在 `ffmpeg` 可用时在此路径上对非 Opus TTS 输出进行转码。

WhatsApp 通过 Baileys 将音频作为 PTT 语音消息发送（`audio` 带 `ptt: true`），并将可见文本与 PTT 音频**分开**发送，因为客户端在语音消息上渲染字幕不一致。

该工具接受可选的 `channel` 和 `timeoutMs` 字段；`timeoutMs` 是每次调用的 Provider 请求超时（毫秒）。

## Gateway RPC

| 方法              | 目的                                   |
| ----------------- | -------------------------------------- |
| `tts.status`      | 读取当前 TTS 状态和最近尝试。          |
| `tts.enable`      | 将本地自动偏好设置为 `always`。        |
| `tts.disable`     | 将本地自动偏好设置为 `off`。           |
| `tts.convert`     | 一次性文本 → 音频。                    |
| `tts.setProvider` | 设置本地 Provider 偏好。               |
| `tts.setPersona`  | 设置本地 Persona 偏好。                |
| `tts.providers`   | 列出已配置的 Provider 和状态。         |

## 服务链接

- [OpenAI 文本转语音指南](https://platform.openai.com/docs/guides/text-to-speech)
- [OpenAI 音频 API 参考](https://platform.openai.com/docs/api-reference/audio)
- [Azure Speech REST 文本转语音](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech)
- [Azure Speech Provider](/providers/azure-speech)
- [ElevenLabs 文本转语音](https://elevenlabs.io/docs/api-reference/text-to-speech)
- [ElevenLabs 认证](https://elevenlabs.io/docs/api-reference/authentication)
- [Gradium](/providers/gradium)
- [Inworld TTS API](https://docs.inworld.ai/tts/tts)
- [MiniMax T2A v2 API](https://platform.minimaxi.com/document/T2A%20V2)
- [Volcengine TTS HTTP API](/providers/volcengine#text-to-speech)
- [Xiaomi MiMo 语音合成](/providers/xiaomi#text-to-speech)
- [node-edge-tts](https://github.com/SchneeHertz/node-edge-tts)
- [Microsoft 语音输出格式](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech#audio-outputs)
- [xAI 文本转语音](https://docs.x.ai/developers/rest-api-reference/inference/voice#text-to-speech-rest)

## 相关

- [媒体概览](/tools/media-overview)
- [音乐生成](/tools/music-generation)
- [视频生成](/tools/video-generation)
- [斜杠命令](/tools/slash-commands)
- [语音通话 Plugin](/plugins/voice-call)
