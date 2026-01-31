---
mmh3_hash: "a56b419debab2567d1951dc6b01da440"
summary: "对讲模式：使用 ElevenLabs TTS 的连续语音对话"
read_when:
  - 在 macOS/iOS/Android 上实现对讲模式
  - 更改语音/TTS/打断行为
---
# 对讲模式 (Talk Mode)

对讲模式是一个连续的语音对话循环：
1) 监听语音
2) 发送转录给模型 (主会话, chat.send)
3) 等待回复
4) 通过 ElevenLabs 朗读 (流式播放)

## 行为 (macOS)
- 当对讲模式启用时，**始终开启叠加层**。
- **监听 (Listening) → 思考 (Thinking) → 说话 (Speaking)** 阶段转换。
- 在 **短暂暂停** (静默窗口) 时，发送当前转录。
- 回复被 **写入 WebChat** (与打字相同)。
- **说话时打断** (默认开启): 如果用户在助手说话时开始说话，我们停止播放并记录打断时间戳以用于下一个提示。

## 回复中的语音指令
助手可以在其回复前加上 **单行 JSON** 来控制语音：

```json
{"voice":"<voice-id>","once":true}
```

规则：
- 仅限第一个非空行。
- 未知键被忽略。
- `once: true` 仅适用于当前回复。
- 没有 `once`，语音将成为对讲模式的新默认语音。
- JSON 行在 TTS 播放前被剥离。

支持的键：
- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (WPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## 配置 (`~/.openclaw/openclaw.json`)
```json5
{
  "talk": {
    "voiceId": "elevenlabs_voice_id",
    "modelId": "eleven_v3",
    "outputFormat": "mp3_44100_128",
    "apiKey": "elevenlabs_api_key",
    "interruptOnSpeech": true
  }
}
```

默认值：
- `interruptOnSpeech`: true
- `voiceId`: 回退到 `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` (或当 API 密钥可用时的第一个 ElevenLabs 语音)
- `modelId`: 未设置时默认为 `eleven_v3`
- `apiKey`: 回退到 `ELEVENLABS_API_KEY` (或网关 shell 配置文件，如果可用)
- `outputFormat`: macOS/iOS 上默认为 `pcm_44100`，Android 上默认为 `pcm_24000` (设置 `mp3_*` 以强制 MP3 流式传输)

## macOS UI
- 菜单栏切换: **Talk**
- 配置标签页: **Talk Mode** 组 (语音 id + 打断开关)
- 叠加层:
  - **监听**: 云朵随麦克风电平脉动
  - **思考**:下沉动画
  - **说话**: 辐射环
  - 点击云朵: 停止说话
  - 点击 X: 退出对讲模式

## 说明
- 需要语音 + 麦克风权限。
- 对会话键 `main` 使用 `chat.send`。
- TTS 使用 ElevenLabs 流式 API，带有 `ELEVENLABS_API_KEY`，并在 macOS/iOS/Android 上进行增量播放以降低延迟。
- `eleven_v3` 的 `stability` 验证为 `0.0`, `0.5`, 或 `1.0`；其他模型接受 `0..1`。
- `latency_tier` 设置时验证为 `0..4`。
- Android 支持 `pcm_16000`, `pcm_22050`, `pcm_24000`, 和 `pcm_44100` 输出格式，用于低延迟 AudioTrack 流式传输。
