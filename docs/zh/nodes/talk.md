---
title: "对讲模式"
sidebarTitle: "对讲模式"
mmh3_hash: "ec12b67e4449bb02d6003778de2bacf8"
summary: "对讲模式：通过本地 STT/TTS 和实时语音实现的持续语音对话"
read_when:
  - 在 macOS/iOS/Android 上实现对讲模式
  - 更改语音/TTS/中断行为
---

对讲模式有两种运行时形态：

- 原生 macOS/iOS/Android 对讲使用本地语音识别、Gateway 聊天和 `talk.speak` TTS。Node 公开 `talk` 能力并声明它们支持的 `talk.*` 命令。
- 浏览器对讲使用 `talk.client.create` 处理客户端拥有的 `webrtc` 和 `provider-websocket` 会话，或使用 `talk.session.create` 处理 Gateway 拥有的 `gateway-relay` 会话。`managed-room` 保留用于 Gateway 切换和对讲机房间。
- 仅转录客户端使用 `talk.session.create({ mode: "transcription", transport: "gateway-relay", brain: "none" })`，然后使用 `talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`，当它们需要字幕或听写而不需要助手语音回应时。

原生对讲是持续的语音对话循环：

1. 监听语音
2. 通过活动会话将转录发送给模型
3. 等待回应
4. 通过配置的对讲 provider（`talk.speak`）朗读回应

浏览器实时对讲通过 `talk.client.toolCall` 转发 provider 工具调用；浏览器客户端不直接调用 `chat.send` 进行实时咨询。
当实时咨询处于活跃状态时，Talk 客户端可以使用 `talk.client.steer` 或 `talk.session.steer` 将语音输入分类为 `status`、`steer`、`cancel` 或 `followup`。已接受的引导被排入活动嵌入式运行；被拒绝的引导返回结构化原因，例如 `no_active_run`、`not_streaming` 或 `compacting`。

仅转录对讲与实时和 STT/TTS 会话发出相同的通用对讲事件信封，但使用 `mode: "transcription"` 和 `brain: "none"`。它用于字幕、听写和仅观察语音捕获；一次性上传的语音笔记仍然使用媒体/音频路径。

## 行为（macOS）

- 对讲模式启用时始终显示**叠加层**。
- **监听 → 思考 → 说话**阶段转换。
- **短暂停顿**（静音窗口）时，发送当前转录。
- 回复被**写入 WebChat**（与打字相同）。
- **检测到语音时中断**（默认开启）：如果用户在助手说话时开始说话，我们停止播放并为下一个提示记录中断时间戳。

## 回复中的语音指令

助手可以在其回复前面加上**单个 JSON 行**来控制语音：

```json
{ "voice": "<voice-id>", "once": true }
```

规则：

- 仅第一个非空行。
- 未知键被忽略。
- `once: true` 仅应用于当前回复。
- 没有 `once` 时，语音成为对讲模式的新默认值。
- JSON 行在 TTS 播放之前被剥离。

支持的键：

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`、`rate`（WPM）、`stability`、`similarity`、`style`、`speakerBoost`
- `seed`、`normalize`、`lang`、`output_format`、`latency_tier`
- `once`

## 配置（`~/.openclaw/openclaw.json`）

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          apiKey: "openai_api_key",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

默认值：

- `interruptOnSpeech`：true
- `silenceTimeoutMs`：未设置时，对讲使用平台默认的停顿窗口后发送转录（`macOS 和 Android 上为 700 ms，iOS 上为 900 ms`）
- `provider`：选择活动的对讲 provider。对 macOS 本地播放路径使用 `elevenlabs`、`mlx` 或 `system`。
- `providers.<provider>.voiceId`：对 ElevenLabs 回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID`（或 API 密钥可用时的第一个 ElevenLabs 语音）。
- `providers.elevenlabs.modelId`：未设置时默认为 `eleven_v3`。
- `providers.mlx.modelId`：未设置时默认为 `mlx-community/Soprano-80M-bf16`。
- `providers.elevenlabs.apiKey`：回退到 `ELEVENLABS_API_KEY`（或 Gateway shell 配置文件，如果可用）。
- `consultThinkingLevel`：实时 `openclaw_agent_consult` 调用的完整 OpenClaw agent 运行的可选思考级别覆盖。
- `consultFastMode`：实时 `openclaw_agent_consult` 调用的可选快速模式覆盖。
- `realtime.provider`：选择活动的浏览器/服务器实时语音 provider。对 WebRTC 使用 `openai`，对 provider WebSocket 使用 `google`，或通过 Gateway relay 使用仅桥接的 provider。
- `realtime.providers.<provider>` 存储 provider 拥有的实时配置。浏览器只接收临时或受限的会话凭据，而不是标准 API 密钥。
- `realtime.providers.openai.voice`：内置 OpenAI Realtime 语音 ID。当前 `gpt-realtime-2` 语音有 `alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin` 和 `cedar`；推荐 `marin` 和 `cedar` 以获得最佳质量。
- `realtime.transport`：`webrtc` 和 `provider-websocket` 是浏览器实时传输。Android 仅当此设置为 `gateway-relay` 时才使用实时 relay；否则 Android Talk 使用其原生 STT/TTS 循环。
- `realtime.brain`：`agent-consult` 通过 Gateway 策略路由实时工具调用；`direct-tools` 是旧版直接工具兼容行为；`none` 用于转录或外部编排。
- `realtime.consultRouting`：`provider-direct` 在 provider 跳过 `openclaw_agent_consult` 时保留其直接回复；`force-agent-consult` 使 Gateway relay 将最终用户转录通过 OpenClaw 路由。
- `realtime.instructions`：向 OpenClaw 内置的实时提示附加面向 provider 的系统指令。用于语音风格和语气；OpenClaw 保留默认的 `openclaw_agent_consult` 指导。
- `talk.catalog` 公开每个 provider 的有效模式、传输、brain 策略、实时音频格式和能力标志，以便第一方对讲客户端可以避免不支持的组合。
- 流式转录 provider 通过 `talk.catalog.transcription` 发现。当前 Gateway relay 使用语音通话流式传输 provider 配置，直到添加专用对讲转录配置界面。
- `speechLocale`：iOS/macOS 上设备端对讲语音识别的可选 BCP 47 语言标识符。不设置则使用设备默认值。
- `outputFormat`：在 macOS/iOS 上默认为 `pcm_44100`，在 Android 上默认为 `pcm_24000`（设置 `mp3_*` 以强制 MP3 流式传输）

## macOS UI

- 菜单栏切换：**对讲**
- 配置标签：**对讲模式**组（语音 ID + 中断切换）
- 叠加层：
  - **监听**：云随麦克风级别脉冲
  - **思考**：下沉动画
  - **说话**：辐射环
  - 点击云：停止说话
  - 点击 X：退出对讲模式

## Android UI

- 语音标签切换：**对讲**
- 手动**麦克风**和**对讲**是互斥的运行时捕获模式。
- 当应用离开前台或用户离开语音标签时，手动麦克风停止。
- 对讲模式保持运行直到切换关闭或 Android node 断开连接，并在活动时使用 Android 的麦克风前台服务类型。

## 说明

- 需要语音 + 麦克风权限。
- 原生对讲使用活动 Gateway 会话，只有在响应事件不可用时才回退到历史轮询。
- 浏览器实时对讲使用 `talk.client.toolCall` 处理 `openclaw_agent_consult`，而不是向 provider 拥有的浏览器会话公开 `chat.send`。
- 仅转录对讲使用 `talk.session.create`、`talk.session.appendAudio`、`talk.session.cancelTurn` 和 `talk.session.close`；客户端订阅 `talk.event` 以获取部分/最终转录更新。
- Gateway 通过使用活动对讲 provider 的 `talk.speak` 解析对讲播放。当该 RPC 不可用时，Android 仅回退到本地系统 TTS。
- macOS 本地 MLX 播放在存在时使用捆绑的 `openclaw-mlx-tts` 辅助工具，或 `PATH` 上的可执行文件。在开发过程中，设置 `OPENCLAW_MLX_TTS_BIN` 指向自定义辅助工具二进制文件。
- `eleven_v3` 的 `stability` 验证为 `0.0`、`0.5` 或 `1.0`；其他模型接受 `0..1`。
- 设置时 `latency_tier` 验证为 `0..4`。
- Android 支持 `pcm_16000`、`pcm_22050`、`pcm_24000` 和 `pcm_44100` 输出格式，用于低延迟 AudioTrack 流式传输。

## 相关文档

- [语音唤醒](/nodes/voicewake)
- [音频与语音笔记](/nodes/audio)
- [媒体理解](/nodes/media-understanding)
