---
mmh3_hash: "f4af4d712ae0f2b4d46f9c0305e3fa0d"
summary: "工具配置（策略、实验性开关、Provider 支持的工具）和自定义 provider/base-URL 设置"
read_when:
  - 配置 `tools.*` 策略、允许列表或实验性功能
  - 注册自定义 Provider 或覆盖 base URL
  - 设置 OpenAI 兼容的自托管端点
title: "Configuration — tools and custom providers"
sidebarTitle: "工具和自定义 Provider"
---

`tools.*` 配置键和自定义 provider / base-URL 设置。关于 Agent、Channel 和其他顶级配置键，请参见 [配置参考](/gateway/configuration-reference)。

## 工具

### 工具配置文件

`tools.profile` 在 `tools.allow`/`tools.deny` 之前设置基础允许列表：

<Note>
本地入门时，在未设置的情况下将新本地配置默认为 `tools.profile: "coding"`（保留现有显式配置文件）。
</Note>

| 配置文件    | 包含                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 仅 `session_status`                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | 无限制（与未设置相同）                                                                                                          |

### 工具组

| 组                 | 工具                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution`（`bash` 作为 `exec` 的别名被接受）                                                 |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | 所有内置工具（不包括 Provider Plugin）                                                                                  |

### `tools.allow` / `tools.deny`

全局工具允许/拒绝策略（拒绝优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙盒关闭也会应用。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` 和 `apply_patch` 是独立的工具 id。`allow: ["write"]` 也为兼容模型启用 `apply_patch`，但 `deny: ["write"]` 不拒绝 `apply_patch`。要阻止所有文件变更，拒绝 `group:fs` 或明确列出每个变更工具：

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

进一步限制特定 Provider 或 model 的工具。顺序：基础配置文件 → Provider 配置文件 → 允许/拒绝。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

限制特定请求者身份的工具。这是在 Channel 访问控制之上的纵深防御；发送者值必须来自 Channel 适配器，而不是消息文本。

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

键使用显式前缀：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 或 `"*"`。Channel id 是规范的 OpenClaw id；`teams` 等别名规范化为 `msteams`。旧版无前缀键仅作为 `id:` 接受。匹配顺序为 channel+id、id、e164、username、name，然后是通配符。

每 Agent 的 `agents.list[].tools.toolsBySender` 在匹配时覆盖全局发送者匹配，即使策略为空 `{}`。

### `tools.elevated`

控制沙盒外的提升 exec 访问：

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- 每 Agent 覆盖（`agents.list[].tools.elevated`）只能进一步限制。
- `/elevated on|off|ask|full` 按 Session 存储状态；内联指令适用于单条消息。
- 提升的 `exec` 绕过沙盒，使用配置的逃逸路径（默认为 `gateway`，或 exec 目标为 `node` 时为 `node`）。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

工具循环安全检查**默认禁用**。设置 `enabled: true` 以激活检测。设置可以在 `tools.loopDetection` 中全局定义，并在 `agents.list[].tools.loopDetection` 中每 Agent 覆盖。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  为循环分析保留的最大工具调用历史记录。
</ParamField>
<ParamField path="warningThreshold" type="number">
  警告的重复无进展模式阈值。
</ParamField>
<ParamField path="criticalThreshold" type="number">
  阻止严重循环的较高重复阈值。
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  任何无进展运行的硬停止阈值。
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  对重复的相同工具/相同参数调用发出警告。
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  对已知轮询工具（`process.poll`、`command_status` 等）发出警告/阻止。
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  对交替的无进展配对模式发出警告/阻止。
</ParamField>

<Warning>
如果 `warningThreshold >= criticalThreshold` 或 `criticalThreshold >= globalCircuitBreakerThreshold`，验证将失败。
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // 或 BRAVE_API_KEY 环境变量
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // 可选；省略则自动检测
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

配置入站媒体理解（图像/音频/视频）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // 已废弃：完成项保持 agent 中介
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="媒体 model 条目字段">
    **Provider 条目**（`type: "provider"` 或省略）：

    - `provider`：API Provider id（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
    - `model`：model id 覆盖
    - `profile` / `preferredProfile`：`auth-profiles.json` 配置文件选择

    **CLI 条目**（`type: "cli"`）：

    - `command`：要运行的可执行文件
    - `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等；`openclaw doctor --fix` 将已废弃的 `{input}` 占位符迁移到 `{{MediaPath}}`）

    **通用字段：**

    - `capabilities`：可选列表（`image`、`audio`、`video`）。默认值：`openai`/`anthropic`/`minimax` → 图像，`google` → 图像+音频+视频，`groq` → 音频。
    - `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：每条目覆盖。
    - `tools.media.image.timeoutSeconds` 和匹配的图像 model `timeoutSeconds` 条目也在 Agent 调用显式 `image` 工具时应用。
    - 失败回退到下一个条目。

    Provider 认证遵循标准顺序：`auth-profiles.json` → 环境变量 → `models.providers.*.apiKey`。

    **异步完成字段：**

    - `asyncCompletion.directSend`：已废弃的兼容性标志。完成的异步媒体任务保持请求者 Session 中介，以便 Agent 接收结果、决定如何告知用户，并在源投递需要时使用 message 工具。

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

控制哪些 Session 可以被 Session 工具（`sessions_list`、`sessions_history`、`sessions_send`）作为目标。

默认：`tree`（当前 Session + 由其生成的 Session，如子 Agent）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="可见性范围">
    - `self`：仅当前 Session 键。
    - `tree`：当前 Session + 由当前 Session 生成的 Session（子 Agent）。
    - `agent`：属于当前 Agent id 的任何 Session（如果你在同一 Agent id 下运行每发送者 Session，可能包括其他用户）。
    - `all`：任何 Session。跨 Agent 目标仍然需要 `tools.agentToAgent`。
    - 沙盒夹紧：当当前 Session 被沙盒化且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"` 时，即使 `tools.sessions.visibility="all"` 也强制可见性为 `tree`。
  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

控制 `sessions_spawn` 的内联附件支持。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // 选择加入：设置 true 以允许内联文件附件
        maxTotalBytes: 5242880, // 所有文件总计 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 每个文件 1 MB
        retainOnSessionKeep: false, // cleanup="keep" 时保留附件
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="附件注意事项">
    - 附件仅支持 `runtime: "subagent"`。ACP runtime 拒绝它们。
    - 文件被实例化到子 workspace 的 `.openclaw/attachments/<uuid>/`，并附有 `.manifest.json`。
    - 附件内容自动从转录持久化中编辑。
    - Base64 输入使用严格的字母/填充检查和预解码大小保护进行验证。
    - 文件权限对目录为 `0700`，对文件为 `0600`。
    - 清理遵循 `cleanup` 策略：`delete` 始终删除附件；`keep` 仅在 `retainOnSessionKeep: true` 时保留它们。
  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

实验性内置工具标志。默认关闭，除非适用严格 agentic GPT-5 自动启用规则。

```json5
{
  tools: {
    experimental: {
      planTool: true, // 启用实验性 update_plan
    },
  },
}
```

- `planTool`：为非平凡的多步骤工作跟踪启用结构化 `update_plan` 工具。
- 默认：`false`，除非 `agents.defaults.embeddedPi.executionContract`（或每 Agent 覆盖）对 OpenAI 或 OpenAI Codex GPT-5 系列运行设置为 `"strict-agentic"`。设置 `true` 在该范围之外强制开启工具，或设置 `false` 即使对严格 agentic GPT-5 运行也保持关闭。
- 启用后，系统 prompt 还会添加使用指导，使 model 只在实质性工作时使用它，并最多保持一步 `in_progress`。

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`：生成的子 Agent 的默认 model。如果省略，子 Agent 继承调用者的 model。
- `allowAgents`：当请求者 Agent 未设置自己的 `subagents.allowAgents` 时，`sessions_spawn` 的默认目标 Agent id 允许列表（`["*"]` = 任意；默认：仅同一 Agent）。
- `runTimeoutSeconds`：工具调用省略 `runTimeoutSeconds` 时 `sessions_spawn` 的默认超时（秒）。`0` 表示无超时。
- `announceTimeoutMs`：每次调用的 Gateway `agent` 公告投递尝试超时（毫秒）。默认：`120000`。瞬时重试可能使总公告等待时间超过一个配置的超时。
- 每子 Agent 工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义 Provider 和 base URL

OpenClaw 使用内置 model 目录。通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义 Provider。

配置自定义/本地 Provider 的 `baseUrl` 也是 model HTTP 请求的网络信任决策：OpenClaw 通过受保护的 fetch 路径允许该精确的 `scheme://host:port` 来源，无需添加单独的配置选项或信任其他私有来源。

```json5
{
  models: {
    mode: "merge", // merge（默认）| replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="认证和合并优先级">
    - 对于自定义认证需求，使用 `authHeader: true` + `headers`。
    - 使用 `OPENCLAW_AGENT_DIR`（或旧版环境变量别名 `PI_CODING_AGENT_DIR`）覆盖 Agent 配置根目录。
    - 匹配 Provider ID 的合并优先级：
      - 非空的 Agent `models.json` `baseUrl` 值优先。
      - 非空的 Agent `apiKey` 值仅在该 Provider 在当前配置/auth-profile 上下文中不受 SecretRef 管理时优先。
      - SecretRef 管理的 Provider `apiKey` 值从源标记（env ref 为 `ENV_VAR_NAME`，file/exec ref 为 `secretref-managed`）刷新，而不是持久化已解析的 secret。
      - SecretRef 管理的 Provider 头值从源标记（env ref 为 `secretref-env:ENV_VAR_NAME`，file/exec ref 为 `secretref-managed`）刷新。
      - 空或缺失的 Agent `apiKey`/`baseUrl` 回退到配置中的 `models.providers`。
      - 匹配 model 的 `contextWindow`/`maxTokens` 使用显式配置和隐式目录值中的较高值。
      - 匹配 model 的 `contextTokens` 在存在显式 runtime 上限时保留它；使用它来限制有效上下文而不更改原生 model 元数据。
      - 当你想要配置完全重写 `models.json` 时使用 `models.mode: "replace"`。
      - 标记持久化以源为权威：标记从活跃源配置快照（预解析）写入，而不是从已解析的 runtime secret 值写入。
  </Accordion>
</AccordionGroup>

### Provider 字段详情

<AccordionGroup>
  <Accordion title="顶级目录">
    - `models.mode`：Provider 目录行为（`merge` 或 `replace`）。
    - `models.providers`：按 Provider id 键控的自定义 Provider 映射。
      - 安全编辑：使用 `openclaw config set models.providers.<id> '<json>' --strict-json --merge` 或 `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` 进行加法更新。`config set` 拒绝破坏性替换，除非你传入 `--replace`。
  </Accordion>
  <Accordion title="Provider 连接和认证">
    - `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` 等）。
    - `models.providers.*.apiKey`：Provider 凭据（首选 SecretRef/env 替换）。
    - `models.providers.*.auth`：认证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
    - `models.providers.*.contextWindow`：当 model 条目不设置 `contextWindow` 时，该 Provider 下 model 的默认原生上下文窗口。
    - `models.providers.*.contextTokens`：当 model 条目不设置 `contextTokens` 时，该 Provider 下 model 的默认有效 runtime 上下文上限。
    - `models.providers.*.maxTokens`：当 model 条目不设置 `maxTokens` 时，该 Provider 下 model 的默认输出 token 上限。
    - `models.providers.*.timeoutSeconds`：可选的每 Provider model HTTP 请求超时（秒），包括连接、头、正文和总请求中止处理。
    - `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，将 `options.num_ctx` 注入请求（默认：`true`）。
    - `models.providers.*.authHeader`：需要时强制在 `Authorization` 头中传输凭据。
    - `models.providers.*.baseUrl`：上游 API base URL。
    - `models.providers.*.headers`：用于代理/租户路由的额外静态头。
  </Accordion>
  <Accordion title="请求传输覆盖">
    `models.providers.*.request`：model-Provider HTTP 请求的传输覆盖。

    - `request.headers`：额外头（与 Provider 默认值合并）。值接受 SecretRef。
    - `request.auth`：认证策略覆盖。模式：`"provider-default"`（使用 Provider 的内置认证）、`"authorization-bearer"`（配合 `token`）、`"header"`（配合 `headerName`、`value`、可选 `prefix`）。
    - `request.proxy`：HTTP 代理覆盖。模式：`"env-proxy"`（使用 `HTTP_PROXY`/`HTTPS_PROXY` 环境变量）、`"explicit-proxy"`（配合 `url`）。两种模式都接受可选的 `tls` 子对象。
    - `request.tls`：直连的 TLS 覆盖。字段：`ca`、`cert`、`key`、`passphrase`（均接受 SecretRef）、`serverName`、`insecureSkipVerify`。
    - `request.allowPrivateNetwork`：为 `true` 时，通过 Provider HTTP fetch 保护允许 model-Provider HTTP 请求到私有、CGNAT 或类似范围。自定义/本地 Provider base URL 已信任精确配置的来源（元数据/链路本地来源除外，这些在未显式选择加入时仍被阻止）。设置为 `false` 可退出精确来源信任。WebSocket 对头/TLS 使用相同的 `request`，但不使用 fetch SSRF 门。默认 `false`。

  </Accordion>
  <Accordion title="Model 目录条目">
    - `models.providers.*.models`：显式 Provider model 目录条目。
    - `models.providers.*.models.*.input`：model 输入模态。对于纯文本 model 使用 `["text"]`，对于原生图像/视觉 model 使用 `["text", "image"]`。仅当选定 model 标记为支持图像时，图像附件才会注入 Agent 轮次。
    - `models.providers.*.models.*.contextWindow`：原生 model 上下文窗口元数据。这覆盖该 model 的 Provider 级 `contextWindow`。
    - `models.providers.*.models.*.contextTokens`：可选的 runtime 上下文上限。这覆盖 Provider 级 `contextTokens`；当你想要比 model 的原生 `contextWindow` 更小的有效上下文预算时使用它；`openclaw models list` 在两者不同时显示两个值。
    - `models.providers.*.models.*.compat.supportsDeveloperRole`：可选的兼容性提示。对于非空非原生 `baseUrl`（主机不是 `api.openai.com`）的 `api: "openai-completions"`，OpenClaw 在 runtime 强制将其设置为 `false`。空/省略的 `baseUrl` 保持默认 OpenAI 行为。
    - `models.providers.*.models.*.compat.requiresStringContent`：仅字符串 OpenAI 兼容聊天端点的可选兼容性提示。为 `true` 时，OpenClaw 在发送请求前将纯文本 `messages[].content` 数组扁平化为纯字符串。
    - `models.providers.*.models.*.compat.strictMessageKeys`：严格 OpenAI 兼容聊天端点的可选兼容性提示。为 `true` 时，OpenClaw 在发送请求前将出站 Chat Completions 消息对象精简为 `role` 和 `content`。
    - `models.providers.*.models.*.compat.thinkingFormat`：可选的 thinking 负载提示。对 Together 风格的 `reasoning.enabled` 使用 `"together"`，对顶级 `enable_thinking` 使用 `"qwen"`，对支持请求级 chat-template kwargs 的 Qwen 系列 OpenAI 兼容服务器（如 vLLM）上的 `chat_template_kwargs.enable_thinking` 使用 `"qwen-chat-template"`。
  </Accordion>
  <Accordion title="Amazon Bedrock 发现">
    - `plugins.entries.amazon-bedrock.config.discovery`：Bedrock 自动发现设置根目录。
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`：开关隐式发现。
    - `plugins.entries.amazon-bedrock.config.discovery.region`：发现的 AWS 区域。
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`：针对性发现的可选 Provider id 过滤器。
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`：发现刷新的轮询间隔。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`：发现 model 的回退上下文窗口。
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`：发现 model 的回退最大输出 token。
  </Accordion>
</AccordionGroup>

交互式自定义 Provider 引导会为常见的视觉模型 ID（如 GPT-4o、Claude、Gemini、Qwen-VL、LLaVA、Pixtral、InternVL、Mllama、MiniCPM-V 和 GLM-4V）推断图像输入，并跳过对已知纯文本系列的额外询问。未知 model ID 仍会提示图像支持。非交互式引导使用相同的推断；传递 `--custom-image-input` 强制图像支持元数据，或传递 `--custom-text-input` 强制纯文本元数据。

### Provider 示例

<AccordionGroup>
  <Accordion title="Cerebras（GLM 4.7 / GPT OSS）">
    捆绑的 `cerebras` Provider Plugin 可以通过 `openclaw onboard --auth-choice cerebras-api-key` 配置此项。仅在覆盖默认值时使用显式 Provider 配置。

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    Cerebras 使用 `cerebras/zai-glm-4.7`；Z.AI 直连使用 `zai/glm-4.7`。

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    Anthropic 兼容，内置 Provider。快捷方式：`openclaw onboard --auth-choice kimi-code-api-key`。

  </Accordion>
  <Accordion title="本地 model（LM Studio）">
    请参见 [本地 Model](/gateway/local-models)。简而言之：在严肃硬件上通过 LM Studio Responses API 运行大型本地 model；保持托管 model 合并以备回退。
  </Accordion>
  <Accordion title="MiniMax M2.7（直连）">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    设置 `MINIMAX_API_KEY`。快捷方式：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。model 目录默认仅为 M2.7。在 Anthropic 兼容流式传输路径上，OpenClaw 默认禁用 MiniMax thinking，除非你自己显式设置 `thinking`。`/fast on` 或 `params.fastMode: true` 将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。

  </Accordion>
  <Accordion title="Moonshot AI（Kimi）">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    对于中国端点：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

    原生 Moonshot 端点在共享的 `openai-completions` 传输上公告流式使用兼容性，OpenClaw 根据端点能力而不仅仅是内置 Provider id 来判断。

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    设置 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。Zen 目录使用 `opencode/...` 引用，Go 目录使用 `opencode-go/...` 引用。快捷方式：`openclaw onboard --auth-choice opencode-zen` 或 `openclaw onboard --auth-choice opencode-go`。

  </Accordion>
  <Accordion title="Synthetic（Anthropic 兼容）">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    base URL 应省略 `/v1`（Anthropic 客户端会追加它）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

  </Accordion>
  <Accordion title="Z.AI（GLM-4.7）">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    设置 `ZAI_API_KEY`。`z.ai/*` 和 `z-ai/*` 被接受为别名。快捷方式：`openclaw onboard --auth-choice zai-api-key`。

    - 通用端点：`https://api.z.ai/api/paas/v4`
    - 编码端点（默认）：`https://api.z.ai/api/coding/paas/v4`
    - 对于通用端点，定义带有 base URL 覆盖的自定义 Provider。

  </Accordion>
</AccordionGroup>

---

## 相关文档

- [配置 — agents](/gateway/config-agents)
- [配置 — channels](/gateway/config-channels)
- [配置参考](/gateway/configuration-reference) — 其他顶级键
- [工具和 Plugin](/tools)
