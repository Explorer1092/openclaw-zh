---
mmh3_hash: "cea98ad0de0a680acd7089cfde5b5d01"
title: Voice Call 插件
summary: Voice Call 插件：通过 Twilio/Telnyx/Plivo 的外拨和接听通话（插件安装 + 配置 + CLI）
read_when:
  - 你想通过 OpenClaw 发起外拨语音通话
  - 你正在配置或开发 voice-call 插件
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/voice-call.md
  workflow: 15
---

# Voice Call（插件）

通过插件为 OpenClaw 提供语音通话功能。支持外拨通知和具备接听策略的多轮对话。

当前支持的 Provider：

- `twilio`（Programmable Voice + Media Streams）
- `telnyx`（Call Control v2）
- `plivo`（Voice API + XML transfer + GetInput speech）
- `mock`（开发/无网络）

快速概览：

- 安装插件
- 重启 Gateway
- 在 `plugins.entries.voice-call.config` 下配置
- 使用 `openclaw voicecall ...` 或 `voice_call` 工具

## 运行位置（本地 vs 远程）

Voice Call 插件运行在 **Gateway 进程内部**。

如果你使用远程 Gateway，在**运行 Gateway 的机器**上安装和配置插件，然后重启 Gateway 以加载它。

## 安装

### 选项 A：从 npm 安装（推荐）

```bash
openclaw plugins install @openclaw/voice-call
```

安装后重启 Gateway。

### 选项 B：从本地文件夹安装（开发，无需复制）

```bash
PLUGIN_SRC=./path/to/local/voice-call-plugin
openclaw plugins install "$PLUGIN_SRC"
cd "$PLUGIN_SRC" && pnpm install
```

安装后重启 Gateway。

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
            // Telnyx Mission Control Portal 中的 Telnyx Webhook 公钥
            // （Base64 字符串；也可通过 TELNYX_PUBLIC_KEY 设置）
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

          // Webhook 安全（推荐用于隧道/代理）
          webhookSecurity: {
            allowedHosts: ["voice.example.com"],
            trustedProxyIPs: ["100.64.0.1"],
          },

          // 公开暴露（选择其一）
          // publicUrl: "https://example.ngrok.app/voice/webhook",
          // tunnel: { provider: "ngrok" },
          // tailscale: { mode: "funnel", path: "/voice/webhook" }

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: {
            enabled: true,
            streamPath: "/voice/stream",
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

- Twilio/Telnyx 需要**可公开访问**的 Webhook URL。
- Plivo 需要**可公开访问**的 Webhook URL。
- `mock` 是本地开发 Provider（无网络调用）。
- 除非 `skipSignatureVerification` 为 true，否则 Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`）。
- `skipSignatureVerification` 仅用于本地测试。
- 如果使用 ngrok 免费版，将 `publicUrl` 设置为精确的 ngrok URL；始终强制执行签名验证。
- `tunnel.allowNgrokFreeTierLoopbackBypass: true` 允许签名无效的 Twilio Webhook，**仅**当 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地 Agent）时生效。仅用于本地开发。
- Ngrok 免费版 URL 可能会改变或添加插页行为；如果 `publicUrl` 发生偏移，Twilio 签名将失败。生产环境推荐使用稳定域名或 Tailscale funnel。
- 流式安全默认值：
  - `streaming.preStartTimeoutMs` 关闭从未发送有效 `start` 帧的 Socket。
  - `streaming.maxPendingConnections` 限制未认证的 pre-start Socket 总数。
  - `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 的未认证 pre-start Socket 数。
  - `streaming.maxConnections` 限制总打开的媒体流 Socket 数（pending + active）。

## 僵尸通话清理器

使用 `staleCallReaperSeconds` 结束从未收到终止 Webhook 的通话（例如，从未完成的通知模式通话）。默认值为 `0`（禁用）。

推荐范围：

- **生产环境：** 通知类流程 `120`–`300` 秒。
- 保持此值**高于 `maxDurationSeconds`**，以便正常通话可以完成。一个好的起点是 `maxDurationSeconds + 30–60` 秒。

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

## Webhook 安全

当代理或隧道位于 Gateway 前面时，插件重建公开 URL 以进行签名验证。这些选项控制哪些转发头是受信任的。

`webhookSecurity.allowedHosts` 对转发头中的主机进行白名单过滤。

`webhookSecurity.trustForwardingHeaders` 在没有白名单的情况下信任转发头。

`webhookSecurity.trustedProxyIPs` 仅当请求的远程 IP 匹配列表时才信任转发头。

Twilio 和 Plivo 已启用 Webhook 重放保护。重放的有效 Webhook 请求会被确认但跳过副作用。

Twilio 对话轮次在 `<Gather>` 回调中包含每轮令牌，因此过时/重放的语音回调无法满足较新的待处理转录轮次。

当 Provider 所需的签名头缺失时，未认证的 Webhook 请求在请求体读取前被拒绝。

Voice Call Webhook 使用共享的预认证请求体配置（64 KB / 5 秒），以及签名验证前的每 IP 并发上限。

使用稳定公开主机的示例：

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

## 通话 TTS

Voice Call 使用核心 `messages.tts` 配置进行通话中的流式语音。你可以在插件配置下以**相同结构**覆盖它——它与 `messages.tts` 进行深度合并。

```json5
{
  tts: {
    provider: "elevenlabs",
    elevenlabs: {
      voiceId: "pMsXgVXv3BLzUgSXRplE",
      modelId: "eleven_multilingual_v2",
    },
  },
}
```

注意事项：

- **Microsoft 语音在语音通话中被忽略**（电话音频需要 PCM；当前 Microsoft 传输不暴露电话 PCM 输出）。
- 启用 Twilio 媒体流时使用核心 TTS；否则通话回退到 Provider 原生语音。
- 如果 Twilio 媒体流已激活，Voice Call 不会回退到 TwiML `<Say>`。如果在该状态下电话 TTS 不可用，播放请求会失败，而非混合两条播放路径。

### 更多示例

仅使用核心 TTS（无覆盖）：

```json5
{
  messages: {
    tts: {
      provider: "openai",
      openai: { voice: "alloy" },
    },
  },
}
```

仅为通话覆盖为 ElevenLabs（保留其他地方的核心默认值）：

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
              modelId: "eleven_multilingual_v2",
            },
          },
        },
      },
    },
  },
}
```

仅覆盖通话的 OpenAI 模型（深度合并示例）：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          tts: {
            openai: {
              model: "gpt-4o-mini-tts",
              voice: "marin",
            },
          },
        },
      },
    },
  },
}
```

## 接听通话

接听策略默认为 `disabled`。要启用接听通话，设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

`inboundPolicy: "allowlist"` 是低保障度的来电显示筛选。插件将 Provider 提供的 `From` 值规范化后与 `allowFrom` 进行比较。Webhook 验证对 Provider 投递和载荷完整性进行认证，但不能证明 PSTN/VoIP 号码的归属权。将 `allowFrom` 视为来电显示过滤，而非强身份验证。

自动回复使用 Agent 系统。通过以下方式调整：

- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

### 语音输出契约

对于自动回复，Voice Call 在系统提示中附加严格的语音输出契约：

- `{"spoken":"..."}`

Voice Call 随后防御性地提取语音文本：

- 忽略标记为推理/错误内容的载荷。
- 解析直接 JSON、带围栏的 JSON 或内联 `"spoken"` 键。
- 回退到纯文本并删除可能的规划/元信息前导段落。

这使语音播放专注于面向来电者的文本，避免将规划文本泄漏到音频中。

### 对话启动行为

对于外拨 `conversation` 通话，第一条消息的处理与实时播放状态相关：

- 仅在初始问候正在播放时，才抑制插话队列清空和自动回复。
- 如果初始播放失败，通话返回 `listening` 状态，初始消息保持排队等待重试。
- Twilio 流式传输的初始播放在流连接时启动，无额外延迟。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，Voice Call 在自动结束通话前等待 `2000ms`：

- 如果流在该窗口期内重新连接，自动结束将被取消。
- 如果宽限期后没有重新注册流，通话将被结束以防止卡死的活跃通话。

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call 的别名
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                     # 从日志汇总轮次延迟
openclaw voicecall expose --mode funnel
```

`latency` 从默认的 voice-call 存储路径读取 `calls.jsonl`。使用 `--file <path>` 指向不同的日志，使用 `--last <n>` 将分析限制为最后 N 条记录（默认 200）。输出包括轮次延迟和监听等待时间的 p50/p90/p99。

## Agent 工具

工具名称：`voice_call`

动作：

- `initiate_call`（message、to?、mode?）
- `continue_call`（callId、message）
- `speak_to_user`（callId、message）
- `end_call`（callId）
- `get_status`（callId）

此仓库在 `skills/voice-call/SKILL.md` 提供了匹配的 Skill 文档。

## Gateway RPC

- `voicecall.initiate`（`to?`、`message`、`mode?`）
- `voicecall.continue`（`callId`、`message`）
- `voicecall.speak`（`callId`、`message`）
- `voicecall.end`（`callId`）
- `voicecall.status`（`callId`）
