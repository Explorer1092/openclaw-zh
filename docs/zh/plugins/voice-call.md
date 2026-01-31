---
summary: "语音通话插件: 通过 Twilio/Telnyx/Plivo 的出站 + 入站通话(插件安装 + 配置 + CLI)"
read_when:
  - 您想从 OpenClaw 拨打出站语音电话
  - 您正在配置或开发 voice-call 插件
---

# 语音通话(插件)

通过插件为 OpenClaw 提供语音通话。支持出站通知和多轮对话,带有入站策略。

当前提供程序:
- `twilio`(可编程语音 + 媒体流)
- `telnyx`(呼叫控制 v2)
- `plivo`(语音 API + XML 传输 + GetInput 语音)
- `mock`(开发/无网络)

快速心智模型:
- 安装插件
- 重启网关
- 在 `plugins.entries.voice-call.config` 下配置
- 使用 `openclaw voicecall ...` 或 `voice_call` 工具

## 它在哪里运行(本地 vs 远程)

语音通话插件在**网关进程内**运行。

如果您使用远程网关,请在**运行网关的机器**上安装/配置插件,然后重启网关以加载它。

## 安装

### 选项 A: 从 npm 安装(推荐)

```bash
openclaw plugins install @openclaw/voice-call
```

之后重启网关。

### 选项 B: 从本地文件夹安装(开发,无复制)

```bash
openclaw plugins install ./extensions/voice-call
cd ./extensions/voice-call && pnpm install
```

之后重启网关。

## 配置

在 `plugins.entries.voice-call.config` 下设置配置:

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // 或 "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234",
          toNumber: "+15550005678",

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "..."
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "..."
          },

          // Webhook 服务器
          serve: {
            port: 3334,
            path: "/voice/webhook"
          },

          // 公共暴露(选择一个)
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify" // notify | conversation
          },

          streaming: {
            enabled: true,
            streamPath: "/voice/stream"
          }
        }
      }
    }
  }
}
```

注意事项:
- Twilio/Telnyx 需要**公开可访问的** webhook URL。
- Plivo 需要**公开可访问的** webhook URL。
- `mock` 是本地开发提供程序(无网络调用)。
- `skipSignatureVerification` 仅用于本地测试。
- 如果您使用 ngrok 免费层,将 `publicUrl` 设置为确切的 ngrok URL;始终强制执行签名验证。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` 允许**仅当** `tunnel.provider="ngrok"` 且 `serve.bind` 为环回(ngrok 本地代理)时具有无效签名的 Twilio webhook。仅用于本地开发。
- Ngrok 免费层 URL 可能会更改或添加间隙行为;如果 `publicUrl` 漂移,Twilio 签名将失败。对于生产,首选稳定域或 Tailscale funnel。

## 通话的 TTS

语音通话使用核心 `messages.tts` 配置(OpenAI 或 ElevenLabs)在通话中流式传输语音。您可以在插件配置下使用**相同的形状**覆盖它 - 它与 `messages.tts` 深度合并。

```json5
{
  tts: {
    provider: "elevenlabs",
    elevenlabs: {
      voiceId: "pMsXgVXv3BLzUgSXRplE",
      modelId: "eleven_multilingual_v2"
    }
  }
}
```

注意事项:
- **语音通话忽略 Edge TTS**(电话音频需要 PCM;Edge 输出不可靠)。
- 启用 Twilio 媒体流时使用核心 TTS;否则通话回退到提供程序本机语音。

### 更多示例

仅使用核心 TTS(无覆盖):

```json5
{
  messages: {
    tts: {
      provider: "openai",
      openai: { voice: "alloy" }
    }
  }
}
```

仅针对通话覆盖到 ElevenLabs(在其他地方保留核心默认值):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            elevenlabs: {
              apiKey: "elevenlabs_key",
              voiceId: "pMsXgVXv3BLzUgSXRplE",
              modelId: "eleven_multilingual_v2"
            }
          }
        }
      }
    }
  }
}
```

仅针对通话覆盖 OpenAI 模型(深度合并示例):

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            openai: {
              model: "gpt-4o-mini-tts",
              voice: "marin"
            }
          }
        }
      }
    }
  }
}
```

## 入站通话

入站策略默认为 `disabled`。要启用入站通话,设置:

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?"
}
```

自动响应使用代理系统。使用以下进行调整:
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall expose --mode funnel
```

## 代理工具

工具名称: `voice_call`

操作:
- `initiate_call`(message, to?, mode?)
- `continue_call`(callId, message)
- `speak_to_user`(callId, message)
- `end_call`(callId)
- `get_status`(callId)

此仓库在 `skills/voice-call/SKILL.md` 提供匹配的技能文档。

## 网关 RPC

- `voicecall.initiate`(`to?`, `message`, `mode?`)
- `voicecall.continue`(`callId`, `message`)
- `voicecall.speak`(`callId`, `message`)
- `voicecall.end`(`callId`)
- `voicecall.status`(`callId`)
