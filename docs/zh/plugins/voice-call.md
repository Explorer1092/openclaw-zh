---
mmh3_hash: "4a6f1497f00d6a72241a92c40445fe41"
title: "语音通话 Plugin"
summary: "语音通话 Plugin: 通过 Twilio/Telnyx/Plivo 的出站 + 入站通话(Plugin 安装 + 配置 + CLI)"
read_when:
  - 您想从 OpenClaw 拨打出站语音电话
  - 您正在配置或开发 voice-call Plugin
---

# 语音通话(Plugin)

通过 Plugin 为 OpenClaw 提供语音通话。支持出站通知和多轮对话，带有入站策略。

当前 Provider：

- `twilio`（可编程语音 + 媒体流）
- `telnyx`（呼叫控制 v2）
- `plivo`（语音 API + XML 传输 + GetInput 语音）
- `mock`（开发/无网络）

快速心智模型：

- 安装 Plugin
- 重启 Gateway
- 在 `plugins.entries.voice-call.config` 下配置
- 使用 `openclaw voicecall ...` 或 `voice_call` Tool

## 它在哪里运行（本地 vs 远程）

语音通话 Plugin 在 **Gateway 进程内**运行。

如果您使用远程 Gateway，请在**运行 Gateway 的机器**上安装/配置 Plugin，然后重启 Gateway 以加载它。

## 安装

### 选项 A：从 npm 安装（推荐）

```bash
openclaw plugins install @openclaw/voice-call
```

之后重启 Gateway。

### 选项 B：从本地文件夹安装（开发，无复制）

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

之后重启 Gateway。

## 配置

在 `plugins.entries.voice-call.config` 下设置配置：

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
            authToken: "...",
          },

          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // 来自 Telnyx Mission Control Portal 的 Telnyx webhook 公钥
            // (Base64 字符串；也可以通过 TELNYX_PUBLIC_KEY 设置)。
            publicKey: "...",
          },

          plivo: {
            authId: "MAxxxxxxxxxxxxxxxxxxxx",
            authToken: "...",
          },

          // Webhook 服务器
          serve: {
            port: 3334,
            path: "/voice/webhook",
          },

          // Webhook 安全性（推荐用于隧道/代理）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 公共暴露（选择一个）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            provider: "openai", // 可选；未设置时使用第一个注册的实时转录 Provider
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // 如果设置了 OPENAI_API_KEY 则可选
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
            preStartTimeoutMs: 5000,
            maxPendingConnections: 32,
            maxPendingConnectionsPerIp: 4,
            maxConnections: 128,
          },
        },
      },
    },
  },
}
```

注意事项：

- Twilio/Telnyx 需要**公开可访问的** webhook URL。
- Plivo 需要**公开可访问的** webhook URL。
- `mock` 是本地开发 Provider（无网络调用）。
- 如果旧版配置仍然使用 `provider: "log"`、`twilio.from` 或旧版 `streaming.*` OpenAI 键，请运行 `openclaw doctor --fix` 重写它们。
- Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 为 true。
- `skipSignatureVerification` 仅用于本地测试。
- 如果您使用 ngrok 免费层，将 `publicUrl` 设置为确切的 ngrok URL；始终强制执行签名验证。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` 允许**仅当** `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地 Agent）时具有无效签名的 Twilio webhook。仅用于本地开发。
- Ngrok 免费层 URL 可能会更改或添加间隙行为；如果 `publicUrl` 漂移，Twilio 签名将失败。对于生产，首选稳定域或 Tailscale funnel。
- 流式传输安全默认值：
  - `streaming.preStartTimeoutMs` 关闭从未发送有效 `start` 帧的套接字。
- `streaming.maxPendingConnections` 限制未认证的预启动套接字总数。
- `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 的未认证预启动套接字数。
- `streaming.maxConnections` 限制总打开媒体流套接字数（待处理 + 活跃）。
- 运行时回退目前仍接受那些旧版 voice-call 键，但重写路径是 `openclaw doctor --fix`，兼容性垫片是临时的。

## 流式转录

`streaming` 为实时通话音频选择一个实时转录 Provider。

当前运行时行为：

- `streaming.provider` 是可选的。如果未设置，语音通话使用第一个注册的实时转录 Provider。
- 今天捆绑的 Provider 是 OpenAI，由捆绑的 `openai` Plugin 注册。
- Provider 自有的原始配置位于 `streaming.providers.<providerId>` 下。
- 如果 `streaming.provider` 指向未注册的 Provider，或根本没有注册实时转录 Provider，语音通话记录警告并跳过媒体流而不是使整个 Plugin 失败。

OpenAI 流式转录默认值：

- API 密钥：`streaming.providers.openai.apiKey` 或 `OPENAI_API_KEY`
- model：`gpt-4o-transcribe`
- `silenceDurationMs`：`800`
- `vadThreshold`：`0.5`

示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "openai",
            streamPath: "/voice/stream",
            providers: {
              openai: {
                apiKey: "sk-...", // 如果设置了 OPENAI_API_KEY 则可选
                model: "gpt-4o-transcribe",
                silenceDurationMs: 800,
                vadThreshold: 0.5,
              },
            },
          },
        },
      },
    },
  },
}
```

旧版键仍会被 `openclaw doctor --fix` 自动迁移：

- `streaming.sttProvider` → `streaming.provider`
- `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
- `streaming.sttModel` → `streaming.providers.openai.model`
- `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
- `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

## 陈旧通话清理器

使用 `staleCallReaperSeconds` 结束从未收到终止 webhook 的通话（例如，从未完成的通知模式通话）。默认值为 `0`（禁用）。

推荐范围：

- **生产：** 通知式流程使用 `120`–`300` 秒。
- 将此值保持**高于 `maxDurationSeconds`**，以便正常通话可以完成。好的起始点是 `maxDurationSeconds + 30–60` 秒。

示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          maxDurationSeconds: 300,
          staleCallReaperSeconds: 360,
        },
      },
    },
  },
}
```

## Webhook 安全性

当代理或隧道位于 Gateway 前面时，Plugin 重建用于签名验证的公共 URL。这些选项控制信任哪些转发头。

`webhookSecurity.allowedHosts` 将转发头中的主机加入允许列表。

`webhookSecurity.trustForwardingHeaders` 在没有允许列表的情况下信任转发头。

`webhookSecurity.trustedProxyIPs` 仅在请求远程 IP 与列表匹配时才信任转发头。

Twilio 和 Plivo 启用了 webhook 重放保护。重放的有效 webhook 请求会被确认，但跳过副作用。

Twilio 对话轮次在 `<Gather>` 回调中包含每轮令牌，因此陈旧/重放的语音回调无法满足较新的待处理转录轮次。

当 Provider 所需的签名标头缺失时，未认证的 webhook 请求在正文读取之前就会被拒绝。

voice-call webhook 在签名验证之前使用共享的预认证正文配置文件（64 KB / 5 秒）以及每 IP 的并发上限。

使用稳定公共主机的示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
          },
        },
      },
    },
  },
}
```

## 通话的 TTS

语音通话使用核心 `messages.tts` 配置在通话中流式传输语音。您可以在 Plugin 配置下使用**相同的形状**覆盖它 — 它与 `messages.tts` 深度合并。

```json5
{
  tts: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "pMsXgVXv3BLzUgSXRplE",
        modelId: "eleven_multilingual_v2",
      },
    },
  },
}
```

注意事项：

- Plugin 配置内的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）在加载时自动迁移到 `tts.providers.<provider>`。在提交的配置中优先使用 `providers` 形状。
- **语音通话忽略 Microsoft 语音**（电话音频需要 PCM；当前 Microsoft 传输不暴露电话 PCM 输出）。
- 启用 Twilio 媒体流时使用核心 TTS；否则通话回退到 Provider 本机语音。
- 如果 Twilio 媒体流已经激活，语音通话不会回退到 TwiML `<Say>`。如果在该状态下电话 TTS 不可用，播放请求将失败，而不是混合两个播放路径。
- 当电话 TTS 回退到辅助 Provider 时，语音通话记录包含 Provider 链（`from`、`to`、`attempts`）的警告以供调试。

### 更多示例

仅使用核心 TTS（无覆盖）：

```json5
{
  messages: {
    tts: {
      provider: "openai",
      providers: {
        openai: { voice: "alloy" },
      },
    },
  },
}
```

仅针对通话覆盖到 ElevenLabs（在其他地方保留核心默认值）：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            provider: "elevenlabs",
            providers: {
              elevenlabs: {
                apiKey: "elevenlabs_key",
                voiceId: "pMsXgVXv3BLzUgSXRplE",
                modelId: "eleven_multilingual_v2",
              },
            },
          },
        },
      },
    },
  },
}
```

仅针对通话覆盖 OpenAI 模型（深度合并示例）：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            providers: {
              openai: {
                model: "gpt-4o-mini-tts",
                voice: "marin",
              },
            },
          },
        },
      },
    },
  },
}
```

## 入站通话

入站策略默认为 `disabled`。要启用入站通话，设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` 是低保证的主叫方 ID 屏蔽。Plugin 规范化 Provider 提供的 `From` 值并将其与 `allowFrom` 进行比较。Webhook 验证对 Provider 交付和有效载荷完整性进行认证，但不能证明 PSTN/VoIP 主叫方号码所有权。将 `allowFrom` 视为主叫方 ID 过滤，而非强主叫方身份。

自动响应使用 Agent 系统。使用以下进行调整：

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 语音输出契约

对于自动响应，语音通话向系统 Prompt 附加严格的语音输出契约：

- `{"spoken":"..."}`

然后语音通话防御性地提取语音文本：

- 忽略标记为推理/错误内容的有效载荷。
- 解析直接 JSON、围栏 JSON 或内联 `"spoken"` 键。
- 回退到纯文本并删除可能的规划/元引导段落。

这使语音播放专注于面向来电者的文本，避免将规划文本泄漏到音频中。

### 对话启动行为

对于出站 `conversation` 通话，首次消息处理与实时播放状态绑定：

- 仅在初始问候语正在主动播放时才抑制插话队列清除和自动响应。
- 如果初始播放失败，通话返回到 `listening` 状态，初始消息保持排队等待重试。
- Twilio 流式传输的初始播放在流连接时开始，无额外延迟。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，语音通话在自动结束通话之前等待 `2000ms`：

- 如果在该窗口期间流重新连接，自动结束将被取消。
- 如果宽限期后没有重新注册流，通话将结束以防止卡住的活跃通话。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call 的别名
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # 从日志中汇总轮次延迟
openclaw voicecall expose --mode funnel
```

`latency` 从默认语音通话存储路径读取 `calls.jsonl`。使用 `--file <path>` 指向不同的日志，使用 `--last <n>` 将分析限制为最后 N 条记录（默认 200）。输出包括轮次延迟和等待侦听时间的 p50/p90/p99。

## Agent Tool

Tool 名称：`voice_call`

操作：

- `initiate_call`（message, to?, mode?）
- `continue_call`（callId, message）
- `speak_to_user`（callId, message）
- `end_call`（callId）
- `get_status`（callId）

此仓库在 `skills/voice-call/SKILL.md` 提供匹配的 Skill 文档。

## Gateway RPC

- `voicecall.initiate`（`to?`, `message`, `mode?`）
- `voicecall.continue`（`callId`, `message`）
- `voicecall.speak`（`callId`, `message`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）
