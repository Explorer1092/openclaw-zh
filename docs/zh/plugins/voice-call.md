---
mmh3_hash: "50c5e5e96acad8ed475e408f0e724ffe"
title: "语音通话 Plugin"
sidebarTitle: "语音通话"
summary: "通过 Twilio、Telnyx 或 Plivo 拨打出站和接受入站语音通话，支持可选的实时语音和流式转录"
read_when:
  - 您想从 OpenClaw 拨打出站语音电话
  - 您正在配置或开发 voice-call Plugin
  - 您需要在电话上使用实时语音或流式转录
---

通过 Plugin 为 OpenClaw 提供语音通话。支持出站通知、多轮对话、全双工实时语音、流式转录和带允许列表策略的入站通话。

**当前 Provider：** `twilio`（可编程语音 + 媒体流）、`telnyx`（呼叫控制 v2）、`plivo`（语音 API + XML 传输 + GetInput 语音）、`mock`（开发/无网络）。

<Note>
语音通话 Plugin 在 **Gateway 进程内**运行。如果您使用远程 Gateway，请在运行 Gateway 的机器上安装和配置 Plugin，然后重启 Gateway 以加载它。
</Note>

## 快速入门

<Steps>
  <Step title="安装 Plugin">
    <Tabs>
      <Tab title="从 npm 安装">
        ```bash
        openclaw plugins install @openclaw/voice-call
        ```
      </Tab>
      <Tab title="从本地文件夹安装（开发）">
        ```bash
        PLUGIN_SRC=./path/to/local/voice-call-plugin
        openclaw plugins install "$PLUGIN_SRC"
        cd "$PLUGIN_SRC" && pnpm install
        ```
      </Tab>
    </Tabs>

    使用裸包跟踪当前官方发布标签。仅在需要可重现安装时固定确切版本。

    之后重启 Gateway 以加载 Plugin。

  </Step>
  <Step title="配置 Provider 和 webhook">
    在 `plugins.entries.voice-call.config` 下设置配置（完整形状请参见下面的[配置](#配置)）。至少需要：`provider`、Provider 凭证、`fromNumber` 以及公开可访问的 webhook URL。
  </Step>
  <Step title="验证设置">
    ```bash
    openclaw voicecall setup
    ```

    默认输出可在聊天日志和终端中读取。它检查 Plugin 启用状态、Provider 凭证、webhook 暴露，以及是否只有一种音频模式（`streaming` 或 `realtime`）处于激活状态。使用 `--json` 用于脚本。

  </Step>
  <Step title="冒烟测试">
    ```bash
    openclaw voicecall smoke
    openclaw voicecall smoke --to "+15555550123"
    ```

    两者默认都是试运行。添加 `--yes` 以实际拨打一个短暂的出站通知通话：

    ```bash
    openclaw voicecall smoke --to "+15555550123" --yes
    ```

  </Step>
</Steps>

<Warning>
对于 Twilio、Telnyx 和 Plivo，设置必须解析到**公开的 webhook URL**。如果 `publicUrl`、隧道 URL、Tailscale URL 或 serve 回退解析到 loopback 或私有网络空间，设置将失败，而不是启动一个无法接收运营商 webhook 的 Provider。
</Warning>

## 配置

如果 `enabled: true` 但所选 Provider 缺少凭证，Gateway 启动时会记录一条设置未完成的警告，其中包含缺失的键，并跳过启动运行时。命令、RPC 调用和 Agent Tool 在使用时仍会返回确切缺失的 Provider 配置。

<Note>
语音通话凭证接受 SecretRef。`plugins.entries.voice-call.config.twilio.authToken`、`plugins.entries.voice-call.config.realtime.providers.*.apiKey`、`plugins.entries.voice-call.config.streaming.providers.*.apiKey` 和 `plugins.entries.voice-call.config.tts.providers.*.apiKey` 通过标准 SecretRef 界面解析；请参见 [SecretRef 凭证界面](/reference/secretref-credential-surface)。
</Note>

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio", // 或 "telnyx" | "plivo" | "mock"
          fromNumber: "+15550001234", // 或 Twilio 的 TWILIO_FROM_NUMBER
          toNumber: "+15550005678",
          sessionScope: "per-phone", // per-phone | per-call
          numbers: {
            "+15550009999": {
              inboundGreeting: "Silver Fox Cards, how can I help?",
              responseSystemPrompt: "You are a concise baseball card specialist.",
              tts: {
                providers: {
                  openai: { voice: "alloy" },
                },
              },
            },
          },

          twilio: {
            accountSid: "ACxxxxxxxx",
            authToken: "...",
          },
          telnyx: {
            apiKey: "...",
            connectionId: "...",
            // 来自 Mission Control Portal 的 Telnyx webhook 公钥
            // (Base64；也可以通过 TELNYX_PUBLIC_KEY 设置)。
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
          // tailscale: { mode: "funnel", path: "/voice/webhook" },

          outbound: {
            defaultMode: "notify", // notify | conversation
          },

          streaming: { enabled: true /* 参见流式转录 */ },
          realtime: { enabled: false /* 参见实时语音 */ },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Provider 暴露和安全说明">
    - Twilio、Telnyx 和 Plivo 都需要**公开可访问的** webhook URL。
    - `mock` 是本地开发 Provider（无网络调用）。
    - Telnyx 需要 `telnyx.publicKey`（或 `TELNYX_PUBLIC_KEY`），除非 `skipSignatureVerification` 为 true。
    - `skipSignatureVerification` 仅用于本地测试。
    - 在 ngrok 免费层上，将 `publicUrl` 设置为确切的 ngrok URL；始终强制执行签名验证。
    - `tunnel.allowNgrokFreeTierLoopbackBypass: true` 允许仅当 `tunnel.provider="ngrok"` 且 `serve.bind` 为 loopback（ngrok 本地 Agent）时具有无效签名的 Twilio webhook。仅用于本地开发。
    - Ngrok 免费层 URL 可能会更改或添加间隙行为；如果 `publicUrl` 漂移，Twilio 签名将失败。对于生产，首选稳定域或 Tailscale funnel。

  </Accordion>
  <Accordion title="流式连接上限">
    - `streaming.preStartTimeoutMs` 关闭从未发送有效 `start` 帧的套接字。
    - `streaming.maxPendingConnections` 限制未认证的预启动套接字总数。
    - `streaming.maxPendingConnectionsPerIp` 限制每个源 IP 的未认证预启动套接字数。
    - `streaming.maxConnections` 限制总打开媒体流套接字数（待处理 + 活跃）。

  </Accordion>
  <Accordion title="旧版配置迁移">
    使用 `provider: "log"`、`twilio.from` 或旧版 `streaming.*` OpenAI 键的旧版配置由 `openclaw doctor --fix` 重写。运行时回退目前仍接受旧版 voice-call 键，但重写路径是 `openclaw doctor --fix`，兼容性垫片是临时的。

    自动迁移的流式键：

    - `streaming.sttProvider` → `streaming.provider`
    - `streaming.openaiApiKey` → `streaming.providers.openai.apiKey`
    - `streaming.sttModel` → `streaming.providers.openai.model`
    - `streaming.silenceDurationMs` → `streaming.providers.openai.silenceDurationMs`
    - `streaming.vadThreshold` → `streaming.providers.openai.vadThreshold`

  </Accordion>
</AccordionGroup>

## Session 范围

默认情况下，语音通话使用 `sessionScope: "per-phone"`，因此来自同一来电者的重复来电保留对话记忆。当每次运营商通话应以全新上下文开始时，设置 `sessionScope: "per-call"`，例如接待、预约、IVR 或 Google Meet 桥接流，其中同一电话号码可能代表不同会议。

## 实时语音对话

`realtime` 为实时通话音频选择全双工实时语音 Provider。它与 `streaming` 分离，`streaming` 只将音频转发给实时转录 Provider。

<Warning>
`realtime.enabled` 不能与 `streaming.enabled` 组合。每次通话只能选择一种音频模式。
</Warning>

当前运行时行为：

- `realtime.enabled` 支持 Twilio 媒体流。
- `realtime.provider` 是可选的。如果未设置，语音通话使用第一个注册的实时语音 Provider。
- 捆绑的实时语音 Provider：Google Gemini Live（`google`）和 OpenAI（`openai`），由其 Provider Plugin 注册。
- Provider 自有的原始配置位于 `realtime.providers.<providerId>` 下。
- 语音通话默认暴露共享的 `openclaw_agent_consult` 实时 Tool。当来电者要求更深层推理、当前信息或正常 OpenClaw Tool 时，实时模型可以调用它。
- `realtime.consultPolicy` 可选地为实时模型何时应调用 `openclaw_agent_consult` 添加指导。
- `realtime.agentContext.enabled` 默认关闭。启用后，语音通话在 Session 设置时将有界的 Agent 身份、系统 Prompt 覆盖和选定的工作区文件胶囊注入实时 Provider 指令。
- `realtime.fastContext.enabled` 默认关闭。启用后，语音通话首先在 `realtime.fastContext.timeoutMs` 内搜索 consult 问题的已索引记忆/Session 上下文并将这些片段返回给实时模型，然后仅在 `realtime.fastContext.fallbackToConsult` 为 true 时才回退到完整 consult Agent。
- 如果 `realtime.provider` 指向未注册的 Provider，或根本没有注册实时语音 Provider，语音通话记录警告并跳过实时媒体，而不是使整个 Plugin 失败。
- Consult Session 键复用已存储的通话 Session（如果可用），然后回退到已配置的 `sessionScope`（默认 `per-phone`，或隔离通话的 `per-call`）。

### Tool 策略

`realtime.toolPolicy` 控制 consult 运行：

| 策略             | 行为                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `safe-read-only` | 暴露 consult Tool，并将常规 Agent 限制为 `read`、`web_search`、`web_fetch`、`x_search`、`memory_search` 和 `memory_get`。 |
| `owner`          | 暴露 consult Tool，并让常规 Agent 使用正常的 Agent Tool 策略。                                                                      |
| `none`           | 不暴露 consult Tool。自定义 `realtime.tools` 仍然传递给实时 Provider。                                               |

`realtime.consultPolicy` 仅控制实时模型指令：

| 策略          | 指导                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| `auto`        | 保留默认提示，让 Provider 决定何时调用 consult Tool。                                  |
| `substantive` | 直接回答简单的对话粘合问题，在事实、记忆、Tool 或上下文之前先 consult。                |
| `always`      | 在每个实质性回答之前 consult。                                                         |

### Agent 语音上下文

当语音桥接应像已配置的 OpenClaw Agent 一样响应而无需为普通轮次付出完整 Agent consult 往返时，启用 `realtime.agentContext`。上下文胶囊在实时 Session 创建时添加一次，因此不增加每轮延迟。调用 `openclaw_agent_consult` 仍然运行完整的 OpenClaw Agent，应用于 Tool 工作、当前信息、记忆查找或工作区状态。

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          agentId: "main",
          realtime: {
            enabled: true,
            provider: "google",
            toolPolicy: "safe-read-only",
            consultPolicy: "substantive",
            agentContext: {
              enabled: true,
              maxChars: 6000,
              includeIdentity: true,
              includeSystemPrompt: true,
              includeWorkspaceFiles: true,
              files: ["SOUL.md", "IDENTITY.md", "USER.md"],
            },
          },
        },
      },
    },
  },
}
```

### 实时 Provider 示例

<Tabs>
  <Tab title="Google Gemini Live">
    默认值：API 密钥来自 `realtime.providers.google.apiKey`、`GEMINI_API_KEY` 或 `GOOGLE_GENERATIVE_AI_API_KEY`；模型 `gemini-2.5-flash-native-audio-preview-12-2025`；语音 `Kore`。`sessionResumption` 和 `contextWindowCompression` 默认开启，用于更长、可重连的通话。使用 `silenceDurationMs`、`startSensitivity` 和 `endSensitivity` 调整电话音频上更快的轮次切换。

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              provider: "twilio",
              inboundPolicy: "allowlist",
              allowFrom: ["+15550005678"],
              realtime: {
                enabled: true,
                provider: "google",
                instructions: "Speak briefly. Call openclaw_agent_consult before using deeper tools.",
                toolPolicy: "safe-read-only",
                consultPolicy: "substantive",
                consultThinkingLevel: "low",
                consultFastMode: true,
                agentContext: { enabled: true },
                providers: {
                  google: {
                    apiKey: "${GEMINI_API_KEY}",
                    model: "gemini-2.5-flash-native-audio-preview-12-2025",
                    voice: "Kore",
                    silenceDurationMs: 500,
                    startSensitivity: "high",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="OpenAI">
    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              realtime: {
                enabled: true,
                provider: "openai",
                providers: {
                  openai: { apiKey: "${OPENAI_API_KEY}" },
                },
              },
            },
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

有关 Provider 特定的实时语音选项，请参见 [Google Provider](/providers/google) 和 [OpenAI Provider](/providers/openai)。

## 流式转录

`streaming` 为实时通话音频选择一个实时转录 Provider。

当前运行时行为：

- `streaming.provider` 是可选的。如果未设置，语音通话使用第一个注册的实时转录 Provider。
- 捆绑的实时转录 Provider：Deepgram（`deepgram`）、ElevenLabs（`elevenlabs`）、Mistral（`mistral`）、OpenAI（`openai`）和 xAI（`xai`），由其 Provider Plugin 注册。
- Provider 自有的原始配置位于 `streaming.providers.<providerId>` 下。
- Twilio 发送接受的流 `start` 消息后，语音通话立即注册流，在 Provider 连接时通过转录 Provider 排队入站媒体，并仅在实时转录准备好后才开始初始问候语。
- 如果 `streaming.provider` 指向未注册的 Provider，或根本没有注册实时转录 Provider，语音通话记录警告并跳过媒体流，而不是使整个 Plugin 失败。

### 流式 Provider 示例

<Tabs>
  <Tab title="OpenAI">
    默认值：API 密钥 `streaming.providers.openai.apiKey` 或 `OPENAI_API_KEY`；模型 `gpt-4o-transcribe`；`silenceDurationMs: 800`；`vadThreshold: 0.5`。

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

  </Tab>
  <Tab title="xAI">
    默认值：API 密钥 `streaming.providers.xai.apiKey` 或 `XAI_API_KEY`；端点 `wss://api.x.ai/v1/stt`；编码 `mulaw`；采样率 `8000`；`endpointingMs: 800`；`interimResults: true`。

    ```json5
    {
      plugins: {
        entries: {
          "voice-call": {
            config: {
              streaming: {
                enabled: true,
                provider: "xai",
                streamPath: "/voice/stream",
                providers: {
                  xai: {
                    apiKey: "${XAI_API_KEY}", // 如果设置了 XAI_API_KEY 则可选
                    endpointingMs: 800,
                    language: "en",
                  },
                },
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

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

<Warning>
**语音通话忽略 Microsoft 语音。** 电话音频需要 PCM；当前 Microsoft 传输不暴露电话 PCM 输出。
</Warning>

行为说明：

- Plugin 配置内的旧版 `tts.<provider>` 键（`openai`、`elevenlabs`、`microsoft`、`edge`）由 `openclaw doctor --fix` 修复；已提交的配置应使用 `tts.providers.<provider>`。
- 启用 Twilio 媒体流时使用核心 TTS；否则通话回退到 Provider 本机语音。
- 如果 Twilio 媒体流已经激活，语音通话不会回退到 TwiML `<Say>`。如果在该状态下电话 TTS 不可用，播放请求将失败，而不是混合两个播放路径。
- 当电话 TTS 回退到辅助 Provider 时，语音通话记录包含 Provider 链（`from`、`to`、`attempts`）的警告以供调试。
- 当 Twilio 插话或流拆除清除待处理的 TTS 队列时，已排队的播放请求会完成而不是挂起等待播放完成的来电者。

### TTS 示例

<Tabs>
  <Tab title="仅核心 TTS">
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
  </Tab>
  <Tab title="仅通话覆盖到 ElevenLabs">
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
  </Tab>
  <Tab title="OpenAI 模型覆盖（深度合并）">
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
  </Tab>
</Tabs>

## 入站通话

入站策略默认为 `disabled`。要启用入站通话，设置：

```json5
{
  inboundPolicy: "allowlist",
  allowFrom: ["+15550001234"],
  inboundGreeting: "Hello! How can I help?",
}
```

<Warning>
`inboundPolicy: "allowlist"` 是低保证的主叫方 ID 屏蔽。Plugin 规范化 Provider 提供的 `From` 值并将其与 `allowFrom` 进行比较。Webhook 验证对 Provider 交付和有效载荷完整性进行认证，但**不能**证明 PSTN/VoIP 主叫方号码所有权。将 `allowFrom` 视为主叫方 ID 过滤，而非强主叫方身份。
</Warning>

自动响应使用 Agent 系统。使用 `responseModel`、`responseSystemPrompt` 和 `responseTimeoutMs` 进行调整。

### 按号码路由

当一个语音通话 Plugin 接收多个电话号码的来电且每个号码应表现得像不同线路时，使用 `numbers`。例如，一个号码可以使用随意的个人助手，而另一个使用商务角色、不同的响应 Agent 和不同的 TTS 语音。

路由从 Provider 提供的拨打 `To` 号码中选择。键必须是 E.164 号码。来电到达时，语音通话解析一次匹配路由，将匹配的路由存储在通话记录上，并将该有效配置复用于问候语、经典自动响应路径、实时 consult 路径和 TTS 播放。如果没有路由匹配，则使用全局语音通话配置。出站通话不使用 `numbers`；启动通话时显式传递出站目标、消息和 Session。

路由覆盖目前支持：

- `inboundGreeting`
- `tts`
- `agentId`
- `responseModel`
- `responseSystemPrompt`
- `responseTimeoutMs`

`tts` 路由值在全局语音通话 `tts` 配置上深度合并，因此通常只需覆盖 Provider 语音：

```json5
{
  inboundGreeting: "Hello from the main line.",
  responseSystemPrompt: "You are the default voice assistant.",
  tts: {
    provider: "openai",
    providers: {
      openai: { voice: "coral" },
    },
  },
  numbers: {
    "+15550001111": {
      inboundGreeting: "Silver Fox Cards, how can I help?",
      responseSystemPrompt: "You are a concise baseball card specialist.",
      tts: {
        providers: {
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

### 语音输出契约

对于自动响应，语音通话向系统 Prompt 附加严格的语音输出契约：

```text
{"spoken":"..."}
```

语音通话防御性地提取语音文本：

- 忽略标记为推理/错误内容的有效载荷。
- 解析直接 JSON、围栏 JSON 或内联 `"spoken"` 键。
- 回退到纯文本并删除可能的规划/元引导段落。

这使语音播放专注于面向来电者的文本，避免将规划文本泄漏到音频中。

### 对话启动行为

对于出站 `conversation` 通话，首次消息处理与实时播放状态绑定：

- 仅在初始问候语正在主动播放时才抑制插话队列清除和自动响应。
- 如果初始播放失败，通话返回到 `listening` 状态，初始消息保持排队等待重试。
- Twilio 流式传输的初始播放在流连接时开始，无额外延迟。
- 插话中止活跃播放并清除已排队但尚未播放的 Twilio TTS 条目。已清除的条目解析为已跳过，因此后续响应逻辑可以继续，而无需等待永远不会播放的音频。
- 实时语音对话使用实时流自己的开场轮次。语音通话**不会**为该初始消息发布旧版 `<Say>` TwiML 更新，因此出站 `<Connect><Stream>` Session 保持连接。

### Twilio 流断开宽限期

当 Twilio 媒体流断开时，语音通话在自动结束通话之前等待 **2000 ms**：

- 如果在该窗口期间流重新连接，自动结束将被取消。
- 如果宽限期后没有重新注册流，通话将结束以防止卡住的活跃通话。

## 陈旧通话清理器

使用 `staleCallReaperSeconds` 结束从未收到终止 webhook 的通话（例如，从未完成的通知模式通话）。默认值为 `0`（禁用）。

推荐范围：

- **生产：** 通知式流程使用 `120`–`300` 秒。
- 将此值保持**高于 `maxDurationSeconds`**，以便正常通话可以完成。好的起始点是 `maxDurationSeconds + 30–60` 秒。

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

当代理或隧道位于 Gateway 前面时，Plugin 重建用于签名验证的公共 URL。这些选项控制信任哪些转发头：

<ParamField path="webhookSecurity.allowedHosts" type="string[]">
  将转发头中的主机加入允许列表。
</ParamField>
<ParamField path="webhookSecurity.trustForwardingHeaders" type="boolean">
  在没有允许列表的情况下信任转发头。
</ParamField>
<ParamField path="webhookSecurity.trustedProxyIPs" type="string[]">
  仅在请求远程 IP 与列表匹配时才信任转发头。
</ParamField>

附加保护：

- Twilio 和 Plivo 启用了 webhook **重放保护**。重放的有效 webhook 请求会被确认，但跳过副作用。
- Twilio 对话轮次在 `<Gather>` 回调中包含每轮令牌，因此陈旧/重放的语音回调无法满足较新的待处理转录轮次。
- 当 Provider 所需的签名标头缺失时，未认证的 webhook 请求在正文读取之前就会被拒绝。
- voice-call webhook 在签名验证之前使用共享的预认证正文配置文件（64 KB / 5 秒）以及每 IP 的并发上限。

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

## CLI

```bash
openclaw voicecall call --to "+15555550123" --message "Hello from OpenClaw"
openclaw voicecall start --to "+15555550123"   # call 的别名
openclaw voicecall continue --call-id <id> --message "Any questions?"
openclaw voicecall speak --call-id <id> --message "One moment"
openclaw voicecall dtmf --call-id <id> --digits "ww123456#"
openclaw voicecall end --call-id <id>
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw voicecall latency                      # 从日志中汇总轮次延迟
openclaw voicecall expose --mode funnel
```

当 Gateway 已经运行时，操作性 `voicecall` 命令委托给 Gateway 拥有的语音通话运行时，这样 CLI 不会绑定第二个 webhook 服务器。如果没有 Gateway 可达，命令回退到独立 CLI 运行时。

`latency` 从默认语音通话存储路径读取 `calls.jsonl`。使用 `--file <path>` 指向不同的日志，使用 `--last <n>` 将分析限制为最后 N 条记录（默认 200）。输出包括轮次延迟和等待侦听时间的 p50/p90/p99。

## Agent Tool

Tool 名称：`voice_call`。

| 操作            | 参数                                       |
| --------------- | ------------------------------------------ |
| `initiate_call` | `message`, `to?`, `mode?`, `dtmfSequence?` |
| `continue_call` | `callId`, `message`                        |
| `speak_to_user` | `callId`, `message`                        |
| `send_dtmf`     | `callId`, `digits`                         |
| `end_call`      | `callId`                                   |
| `get_status`    | `callId`                                   |

此仓库在 `skills/voice-call/SKILL.md` 提供匹配的 Skill 文档。

## Gateway RPC

| 方法                 | 参数                                       |
| -------------------- | ------------------------------------------ |
| `voicecall.initiate` | `to?`, `message`, `mode?`, `dtmfSequence?` |
| `voicecall.continue` | `callId`, `message`                        |
| `voicecall.speak`    | `callId`, `message`                        |
| `voicecall.dtmf`     | `callId`, `digits`                         |
| `voicecall.end`      | `callId`                                   |
| `voicecall.status`   | `callId`                                   |

`dtmfSequence` 仅对 `mode: "conversation"` 有效。通知模式通话在通话建立后需要拨号后续按键时应使用 `voicecall.dtmf`。

## 故障排除

### 设置未能暴露 webhook

从运行 Gateway 的同一环境运行设置：

```bash
openclaw voicecall setup
openclaw voicecall setup --json
```

对于 `twilio`、`telnyx` 和 `plivo`，`webhook-exposure` 必须为绿色。已配置的 `publicUrl` 在指向本地或私有网络空间时仍会失败，因为运营商无法回调这些地址。不要将 `localhost`、`127.0.0.1`、`0.0.0.0`、`10.x`、`172.16.x`-`172.31.x`、`192.168.x`、`169.254.x`、`fc00::/7` 或 `fd00::/8` 用作 `publicUrl`。

Twilio 通知模式出站通话在创建通话请求中直接发送其初始 `<Say>` TwiML，因此第一条语音消息不依赖 Twilio 获取 webhook TwiML。状态回调、对话通话、预连接 DTMF、实时流和连接后通话控制仍然需要公开 webhook。

使用一个公开暴露路径：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          publicUrl: "https://voice.example.com/voice/webhook",
          // 或
          tunnel: { provider: "ngrok" },
          // 或
          tailscale: { mode: "funnel", path: "/voice/webhook" },
        },
      },
    },
  },
}
```

更改配置后，重启或重新加载 Gateway，然后运行：

```bash
openclaw voicecall setup
openclaw voicecall smoke
```

`voicecall smoke` 是试运行，除非您传入 `--yes`。

### Provider 凭证失败

检查所选 Provider 和所需的凭证字段：

- Twilio：`twilio.accountSid`、`twilio.authToken` 和 `fromNumber`，或 `TWILIO_ACCOUNT_SID`、`TWILIO_AUTH_TOKEN` 和 `TWILIO_FROM_NUMBER`。
- Telnyx：`telnyx.apiKey`、`telnyx.connectionId`、`telnyx.publicKey` 和 `fromNumber`。
- Plivo：`plivo.authId`、`plivo.authToken` 和 `fromNumber`。

凭证必须存在于 Gateway 主机上。编辑本地 shell 配置文件不会影响已经运行的 Gateway，直到它重启或重新加载其环境。

### 通话已开始但 Provider webhook 未到达

确认 Provider 控制台指向确切的公开 webhook URL：

```text
https://voice.example.com/voice/webhook
```

然后检查运行时状态：

```bash
openclaw voicecall status --call-id <id>
openclaw voicecall tail
openclaw logs --follow
```

常见原因：

- `publicUrl` 指向与 `serve.path` 不同的路径。
- Gateway 启动后隧道 URL 发生更改。
- 代理转发请求但剥离或重写 host/proto 标头。
- 防火墙或 DNS 将公共主机名路由到 Gateway 以外的地方。
- Gateway 在未启用语音通话 Plugin 的情况下重启。

当反向代理或隧道位于 Gateway 前面时，将 `webhookSecurity.allowedHosts` 设置为公共主机名，或对已知代理地址使用 `webhookSecurity.trustedProxyIPs`。仅在代理边界在您的控制之下时才使用 `webhookSecurity.trustForwardingHeaders`。

### 签名验证失败

Provider 签名根据 OpenClaw 从传入请求重建的公共 URL 进行检查。如果签名失败：

- 确认 Provider webhook URL 与 `publicUrl` 完全匹配，包括方案、主机和路径。
- 对于 ngrok 免费层 URL，在隧道主机名更改时更新 `publicUrl`。
- 确保代理保留原始 host 和 proto 标头，或配置 `webhookSecurity.allowedHosts`。
- 不要在本地测试之外启用 `skipSignatureVerification`。

### Google Meet Twilio 加入失败

Google Meet 使用此 Plugin 进行 Twilio 拨入加入。首先验证语音通话：

```bash
openclaw voicecall setup
openclaw voicecall smoke --to "+15555550123"
```

然后明确验证 Google Meet 传输：

```bash
openclaw googlemeet setup --transport twilio
```

如果语音通话正常但 Meet 参与者从未加入，请检查 Meet 拨入号码、PIN 和 `--dtmf-sequence`。电话通话可以正常进行，而会议拒绝或忽略不正确的 DTMF 序列。

Google Meet 通过带有预连接 DTMF 序列的 `voicecall.start` 启动 Twilio 电话腿。PIN 派生序列包含 Google Meet Plugin 的 `voiceCall.dtmfDelayMs` 作为前导 Twilio 等待数字。默认为 12 秒，因为 Meet 拨入提示可能迟到。语音通话随后在请求开场问候语之前重定向回实时处理。

使用 `openclaw logs --follow` 进行实时阶段跟踪。健康的 Twilio Meet 加入按此顺序记录：

- Google Meet 将 Twilio 加入委托给语音通话。
- 语音通话存储预连接 DTMF TwiML。
- 在实时处理之前消费并提供 Twilio 初始 TwiML。
- 语音通话为 Twilio 通话提供实时 TwiML。
- Google Meet 在 DTMF 后延迟后通过 `voicecall.speak` 请求开场语音。

`openclaw voicecall tail` 仍然显示持久化的通话记录；它对通话状态和转录有用，但并非每个 webhook/实时转换都出现在那里。

### 实时通话没有语音

确认只有一种音频模式已启用。`realtime.enabled` 和 `streaming.enabled` 不能同时为 true。

对于实时 Twilio 通话，还要验证：

- 实时 Provider Plugin 已加载并注册。
- `realtime.provider` 未设置或命名了已注册的 Provider。
- Provider API 密钥对 Gateway 进程可用。
- `openclaw logs --follow` 显示实时 TwiML 已提供、实时桥接已启动以及初始问候语已排队。

## 相关

- [Talk 模式](/nodes/talk)
- [文字转语音](/tools/tts)
- [语音唤醒](/nodes/voicewake)
