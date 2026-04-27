---
title: "对讲模式"
sidebarTitle: "对讲模式"
mmh3_hash: "0700aea0ab9c56a93db06f68b8e56064"
summary: "对讲模式: 使用配置的 TTS provider 的连续语音对话"
read_when:
  - 在 macOS/iOS/Android 上实现对讲模式
  - 更改语音/TTS/打断行为
---

对讲模式是一个连续的语音对话循环:

1. 监听语音
2. 发送转录给模型（主 Session，chat.send）
3. 等待回复
4. 通过配置的 Talk provider（`talk.speak`）朗读

## 行为 (macOS)

- 当对讲模式启用时，**始终开启叠加层**。
- **监听 (Listening) → 思考 (Thinking) → 说话 (Speaking)** 阶段转换。
- 在 **短暂暂停**（静默窗口）时，发送当前转录。
- 回复被 **写入 WebChat**（与打字相同）。
- **说话时打断**（默认开启）：如果用户在助手说话时开始说话，我们停止播放并记录打断时间戳以用于下一个提示。

## 回复中的语音指令

助手可以在其回复前加上 **单行 JSON** 来控制语音:

```json
{ "voice": "<voice-id>", "once": true }
```

规则:

- 仅限第一个非空行。
- 未知键被忽略。
- `once: true` 仅适用于当前回复。
- 没有 `once`，语音将成为对讲模式的新默认语音。
- JSON 行在 TTS 播放前被剥离。

支持的键:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## 配置 (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

默认值:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: 未设置时，Talk 保持平台默认暂停窗口后再发送转录（macOS 和 Android 上为 `700 ms`，iOS 上为 `900 ms`）
- `provider`: 选择活动 Talk provider。使用 `elevenlabs`、`mlx` 或 `system` 作为 macOS 本地播放路径。
- `providers.<provider>.voiceId`: 回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或当 API 密钥可用时的第一个 ElevenLabs 语音）。
- `providers.elevenlabs.modelId`: 未设置时默认为 `eleven_v3`。
- `providers.mlx.modelId`: 未设置时默认为 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`: 回退到 `ELEVENLABS_API_KEY`（或 Gateway shell 配置文件，如果可用）。
- `speechLocale`: 可选的 BCP 47 语言区域 id，用于 iOS/macOS 上的设备端 Talk 语音识别。留空使用设备默认值。
- `outputFormat`: macOS/iOS 上默认为 `pcm_44100`，Android 上默认为 `pcm_24000`（设置 `mp3_*` 以强制 MP3 流式传输）

## macOS UI

- 菜单栏切换: **Talk**
- 配置标签页: **Talk Mode** 组（语音 id + 打断开关）
- 叠加层:
  - **监听**: 云朵随麦克风电平脉动
  - **思考**: 下沉动画
  - **说话**: 辐射环
  - 点击云朵: 停止说话
  - 点击 X: 退出对讲模式

## Android UI

- Voice 标签页切换: **Talk**
- 手动**麦克风**和 **Talk** 是互斥的运行时捕获模式。
- 手动麦克风在应用离开前台或用户离开 Voice 标签页时停止。
- 对讲模式保持运行直到切换关闭或 Android node 断开连接，并在活跃时使用 Android 的麦克风前台服务类型。

## 说明

- 需要语音 + 麦克风权限。
- 对 Session 键 `main` 使用 `chat.send`。
- Gateway 通过 `talk.speak` 使用活动 Talk provider 解析对讲模式播放。当该 RPC 不可用时，Android 回退到本地系统 TTS。
- macOS 本地 MLX 播放在存在时使用捆绑的 `openclaw-mlx-tts` 助手，或使用 `PATH` 上的可执行文件。设置 `OPENCLAW_MLX_TTS_BIN` 以在开发期间指向自定义助手二进制文件。
- `eleven_v3` 的 `stability` 验证为 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- `latency_tier` 设置时验证为 `0..4`。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，用于低延迟 AudioTrack 流式传输。

## 相关文档

- [语音唤醒](/nodes/voicewake)
- [音频与语音笔记](/nodes/audio)
- [媒体理解](/nodes/media-understanding)
