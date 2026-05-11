---
mmh3_hash: "60261251931cd59afe28edbc9940ca8e"
summary: "Agent 默认值、多 Agent 路由、Session、消息和 Talk 配置"
read_when:
  - 调整 Agent 默认值（model、thinking、workspace、heartbeat、media、skills）
  - 配置多 Agent 路由和绑定
  - 调整 Session、消息投递和 Talk 模式行为
title: "Configuration — agents"
---

Agent 范围的 `agents.*`、`multiAgent.*`、`session.*`、`messages.*` 和 `talk.*` 配置键。关于 Channel、工具、Gateway runtime 和其他顶级键，请参见 [Configuration reference](/gateway/configuration-reference)。

## Agent 默认值

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

在系统 prompt 的 Runtime 行中显示的可选仓库根目录。如果未设置，OpenClaw 会从 workspace 向上遍历自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

未设置 `agents.list[].skills` 的 Agent 的可选默认 skill 允许列表。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // 继承 github, weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无 skills
    ],
  },
}
```

- 省略 `agents.defaults.skills` 表示默认不限制 skills。
- 省略 `agents.list[].skills` 表示继承默认值。
- 设置 `agents.list[].skills: []` 表示无 skills。
- 非空的 `agents.list[].skills` 列表是该 Agent 的最终集合；不与默认值合并。

### `agents.defaults.skipBootstrap`

禁用 workspace 引导文件的自动创建（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

控制 workspace 引导文件何时被注入到系统 prompt 中。默认值：`"always"`。

- `"continuation-skip"`：安全的延续轮次（在已完成的 assistant 响应后）跳过 workspace 引导重新注入，从而减少 prompt 大小。Heartbeat 运行和压缩后重试仍会重建上下文。
- `"never"`：禁用每轮的 workspace 引导和上下文文件注入。仅用于完全拥有其 prompt 生命周期的 Agent（自定义上下文引擎、构建自己上下文的原生 runtime，或专门的无引导工作流）。Heartbeat 和压缩恢复轮次也会跳过注入。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

截断前每个 workspace 引导文件的最大字符数。默认值：`12000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

所有 workspace 引导文件注入的最大总字符数。默认值：`60000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制引导上下文被截断时对 Agent 可见的警告文本。默认值：`"once"`。

- `"off"`：从不向系统 prompt 注入警告文本。
- `"once"`：每个唯一截断签名注入一次警告（推荐）。
- `"always"`：当存在截断时每次运行都注入警告。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### 上下文预算所有权映射

OpenClaw 有多个高容量的 prompt/上下文预算，它们有意按子系统拆分，而不是通过一个通用旋钮统一处理。

- `agents.defaults.bootstrapMaxChars` / `agents.defaults.bootstrapTotalMaxChars`：普通 workspace 引导注入。
- `agents.defaults.startupContext.*`：一次性 `/new` 和 `/reset` 启动序言，包括最近的每日 `memory/*.md` 文件。
- `skills.limits.*`：注入到系统 prompt 中的精简 skills 列表。
- `agents.defaults.contextLimits.*`：有界 runtime 摘录和注入的 runtime 拥有块。
- `memory.qmd.limits.*`：索引内存搜索片段和注入大小。

仅当一个 Agent 需要不同的预算时，使用匹配的每 Agent 覆盖：

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

控制在裸 `/new` 和 `/reset` 运行时注入的第一轮启动序言。

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

有界 runtime 上下文表面的共享默认值。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`：截断元数据和延续通知添加之前的默认 `memory_get` 摘录上限。
- `memoryGetDefaultLines`：省略 `lines` 时的默认 `memory_get` 行窗口。
- `toolResultMaxChars`：用于持久化结果和溢出恢复的实时工具结果上限。
- `postCompactionMaxChars`：压缩后刷新注入期间使用的 AGENTS.md 摘录上限。

#### `agents.list[].contextLimits`

共享 `contextLimits` 旋钮的每 Agent 覆盖。省略的字段从 `agents.defaults.contextLimits` 继承。

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

注入到系统 prompt 中的精简 skills 列表的全局上限。这不影响按需读取 `SKILL.md` 文件。

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

skills prompt 预算的每 Agent 覆盖。

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

在 Provider 调用之前，转录/工具图像块中最长图像边的最大像素大小。默认值：`1200`。

较小的值通常会减少视觉 token 使用量和截图密集运行的请求有效负载大小。较大的值保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

系统 prompt 上下文的时区（不是消息时间戳）。回退到主机时区。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系统 prompt 中的时间格式。默认值：`auto`（OS 偏好）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // 全局默认 provider 参数
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 字符串形式只设置主 model。
  - 对象形式同时设置主 model 和有序故障转移 model。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 被 `image` 工具路径用作视觉 model 配置。
  - 当所选/默认 model 无法接受图像输入时，也用作回退路由。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 被共享图像生成能力和任何未来工具/Plugin 表面用于生成图像。
  - 典型值：用于原生 Gemini 图像生成的 `google/gemini-3.1-flash-image-preview`，用于 fal 的 `fal/fal-ai/flux/dev`，用于 OpenAI Images 的 `openai/gpt-image-2`，或用于透明背景 OpenAI PNG/WebP 输出的 `openai/gpt-image-1.5`。
  - 如果你直接选择 provider/model，也需要配置匹配的 Provider 认证（例如，对 `google/*` 需要 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，对 `openai/gpt-image-2` / `openai/gpt-image-1.5` 需要 `OPENAI_API_KEY` 或 OpenAI Codex OAuth，对 `fal/*` 需要 `FAL_KEY`）。
  - 如果省略，`image_generate` 仍然可以推断有认证支持的 Provider 默认值。它先尝试当前默认 Provider，然后按 provider-id 顺序尝试其余注册的图像生成 Provider。
- `musicGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 被共享音乐生成能力和内置 `music_generate` 工具使用。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.6`。
  - 如果省略，`music_generate` 仍然可以推断有认证支持的 Provider 默认值。它先尝试当前默认 Provider，然后按 provider-id 顺序尝试其余注册的音乐生成 Provider。
  - 如果你直接选择 provider/model，也需要配置匹配的 Provider 认证/API 密钥。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 被共享视频生成能力和内置 `video_generate` 工具使用。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如果省略，`video_generate` 仍然可以推断有认证支持的 Provider 默认值。它先尝试当前默认 Provider，然后按 provider-id 顺序尝试其余注册的视频生成 Provider。
  - 如果你直接选择 provider/model，也需要配置匹配的 Provider 认证/API 密钥。
  - 捆绑的 Qwen 视频生成 Provider 最多支持 1 个输出视频、1 个输入图像、4 个输入视频、10 秒时长，以及 Provider 级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 被 `pdf` 工具用于 model 路由。
  - 如果省略，PDF 工具回退到 `imageModel`，然后回退到解析的 Session/默认 model。
- `pdfMaxBytesMb`：`pdf` 工具调用时未传入 `maxBytesMb` 时的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具中提取回退模式考虑的默认最大页数。
- `verboseDefault`：Agent 的默认详细级别。值：`"off"`、`"on"`、`"full"`。默认值：`"off"`。
- `toolProgressDetail`：`/verbose` 工具摘要和进度草稿工具行的详细模式。值：`"explain"`（默认，紧凑人类标签）或 `"raw"`（可用时附加原始命令/详情）。每 Agent 的 `agents.list[].toolProgressDetail` 覆盖此默认值。
- `reasoningDefault`：Agent 的默认推理可见性。值：`"off"`、`"on"`、`"stream"`。每 Agent 的 `agents.list[].reasoningDefault` 覆盖此默认值。配置的推理默认值仅在没有每消息或 Session 推理覆盖的情况下，为所有者、授权发送者或操作员管理 Gateway 上下文应用。
- `elevatedDefault`：Agent 的默认提升输出级别。值：`"off"`、`"on"`、`"ask"`、`"full"`。默认值：`"on"`。
- `model.primary`：格式 `provider/model`（例如，OpenAI API 密钥访问使用 `openai/gpt-5.5`）。如果省略 Provider，OpenClaw 先尝试别名，然后对该确切 model id 进行唯一配置 Provider 匹配，最后才回退到配置的默认 Provider（已弃用的兼容性行为，因此首选显式 `provider/model`）。如果该 Provider 不再公开配置的默认 model，OpenClaw 回退到第一个配置的 provider/model，而不是显示过时的已删除 Provider 默认值。
- `models`：`/model` 的配置 model 目录和允许列表。每个条目可以包含 `alias`（快捷方式）和 `params`（Provider 特定参数，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`、`responsesServerCompaction`、`responsesCompactThreshold`、`chat_template_kwargs`、`extra_body`/`extraBody`）。
  - 安全编辑：使用 `openclaw config set agents.defaults.models '<json>' --strict-json --merge` 添加条目。`config set` 拒绝会删除现有允许列表条目的替换，除非你传入 `--replace`。
  - Provider 范围的配置/入门流程将选定的 Provider model 合并到此映射中，并保留已配置的不相关 Provider。
  - 对于直接 OpenAI Responses model，服务器端压缩会自动启用。使用 `params.responsesServerCompaction: false` 停止注入 `context_management`，或使用 `params.responsesCompactThreshold` 覆盖阈值。请参见 [OpenAI 服务器端压缩](/providers/openai#server-side-compaction-responses-api)。
- `params`：应用于所有 model 的全局默认 Provider 参数。设置在 `agents.defaults.params`（例如 `{ cacheRetention: "long" }`）。
- `params` 合并优先级（配置）：`agents.defaults.params`（全局基础）被 `agents.defaults.models["provider/model"].params`（每 model）覆盖，然后 `agents.list[].params`（匹配 agent id）按键覆盖。详情请参见 [Prompt 缓存](/reference/prompt-caching)。
- `params.extra_body`/`params.extraBody`：高级透传 JSON，合并到 `api: "openai-completions"` 请求体中，用于 OpenAI 兼容代理。如果与生成的请求键冲突，额外体优先；非原生 completions 路由仍会在之后剥离 OpenAI 专有的 `store`。
- `params.chat_template_kwargs`：vLLM/OpenAI 兼容的聊天模板参数，合并到顶级 `api: "openai-completions"` 请求体中。对于 thinking 关闭的 `vllm/nemotron-3-*`，OpenClaw 自动发送 `enable_thinking: false` 和 `force_nonempty_content: true`；显式 `chat_template_kwargs` 覆盖这些默认值，`extra_body.chat_template_kwargs` 仍具有最终优先级。
- `params.preserveThinking`：Z.AI 专有的保留 thinking 选项。启用且 thinking 开启时，OpenClaw 发送 `thinking.clear_thinking: false` 并重放之前的 `reasoning_content`；请参见 [Z.AI thinking 和保留 thinking](/providers/zai#thinking-and-preserved-thinking)。
- `compat.thinkingFormat`：OpenAI 兼容的 thinking 有效负载样式。对 Qwen 风格的顶级 `enable_thinking` 使用 `"qwen"`，对 vLLM 等支持请求级聊天模板 kwargs 的 Qwen 系列后端使用 `"qwen-chat-template"` 配合 `chat_template_kwargs.enable_thinking`。
- `compat.supportedReasoningEfforts`：每 model 的 OpenAI 兼容推理力度列表。包含 `"xhigh"` 用于真正接受它的自定义端点。
- `localService`：可选的 provider 级进程管理器，用于本地/自托管 model 服务器。详情请参见 [Local model services](/gateway/local-model-services)。
- Runtime 策略属于 Provider 或 model，而非 `agents.defaults`。使用 `models.providers.<provider>.agentRuntime` 用于 Provider 范围规则，或使用 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` 用于 model 特定规则。
- 改变这些字段的配置写入器（例如 `/models set`、`/models set-image` 和 fallback 添加/删除命令）保存规范的对象形式，并在可能时保留现有的 fallback 列表。
- `maxConcurrent`：Session 间的最大并行 Agent 运行数（每个 Session 仍然序列化）。默认值：4。

### Runtime 策略

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`：`"auto"`、`"pi"`、注册的 Plugin harness id 或支持的 CLI 后端别名。捆绑的 Codex Plugin 注册 `codex`；捆绑的 Anthropic Plugin 提供 `claude-cli` CLI 后端。
- `id: "auto"` 让注册的 Plugin harness 声明支持的轮次，当没有 harness 匹配时使用 PI。显式 Plugin runtime（如 `id: "codex"`）需要该 harness，如果不可用或失败则直接失败。
- 整 Agent runtime 键已是旧版。`agents.defaults.agentRuntime`、`agents.list[].agentRuntime`、Session runtime 固定和 `OPENCLAW_AGENT_RUNTIME` 在 runtime 选择中被忽略。运行 `openclaw doctor --fix` 删除旧版值。
- OpenAI agent model 默认使用 Codex harness；当你想明确表达时，provider/model 的 `agentRuntime.id: "codex"` 仍然有效。
- 对于 Claude CLI 部署，首选 `model: "anthropic/claude-opus-4-7"` 加 model 范围的 `agentRuntime.id: "claude-cli"`。旧版 `claude-cli/claude-opus-4-7` model 引用仍然有效以保持兼容性，但新配置应保持 provider/model 选择规范，并将执行后端放在 provider/model runtime 策略中。
- 这只控制文本 Agent 轮次执行。Media 生成、视觉、PDF、音乐、视频和 TTS 仍使用其 provider/model 设置。

**内置别名简写**（仅当 model 在 `agents.defaults.models` 中时适用）：

| 别名                | Model                                          |
| ------------------- | ---------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                    |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                  |
| `gpt`               | `openai/gpt-5.5`                               |
| `gpt-mini`          | `openai/gpt-5.4-mini`                          |
| `gpt-nano`          | `openai/gpt-5.4-nano`                          |
| `gemini`            | `google/gemini-3.1-pro-preview`                |
| `gemini-flash`      | `google/gemini-3-flash-preview`                |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`         |

你配置的别名始终优先于默认值。

Z.AI GLM-4.x model 自动启用 thinking 模式，除非你设置 `--thinking off` 或自行定义 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI model 默认启用 `tool_stream` 以进行工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设置为 `false` 以禁用。
Anthropic Claude 4.6 model 在未设置明确 thinking 级别时默认为 `adaptive` thinking。

### `agents.defaults.cliBackends`

仅文本回退运行的可选 CLI 后端（无工具调用）。当 API Provider 失败时作为备份很有用。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // 或者当 CLI 接受 prompt 文件标志时使用 systemPromptFileArg。
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 后端以文本为优先；工具始终被禁用。
- 设置 `sessionArg` 时支持 Session。
- `imageArg` 接受文件路径时支持图像透传。
- `reseedFromRawTranscriptWhenUncompacted: true` 允许 backend 从第一次压缩摘要存在之前的有界原始 OpenClaw 转录尾部恢复安全失效的 Session。auth profile 或凭证 epoch 变更永远不会原始重播。

### `agents.defaults.systemPromptOverride`

用固定字符串替换整个 OpenClaw 组装的系统 prompt。在默认级别（`agents.defaults.systemPromptOverride`）或每 Agent（`agents.list[].systemPromptOverride`）设置。每 Agent 值优先；空或仅空白值被忽略。适用于受控 prompt 实验。

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

按 model 系列应用的与 Provider 无关的 prompt 覆盖层。GPT-5 系列 model id 跨 Provider 接收共享行为契约；`personality` 只控制友好互动风格层。

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"`（默认）和 `"on"` 启用友好互动风格层。
- `"off"` 只禁用友好层；标记的 GPT-5 行为契约仍然启用。
- 当此共享设置未设置时，仍会读取旧版 `plugins.entries.openai.config.personality`。

### `agents.defaults.heartbeat`

周期性 heartbeat 运行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m 禁用
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // 默认值：true；false 从系统 prompt 中省略 Heartbeat 部分
        lightContext: false, // 默认值：false；true 在 workspace 引导文件中只保留 HEARTBEAT.md
        isolatedSession: false, // 默认值：false；true 在新鲜 Session 中运行每次 heartbeat（无对话历史）
        skipWhenBusy: false, // 默认值：false；true 也等待子 Agent/嵌套通道
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（默认）| block
        target: "none", // 默认：none | 选项：last | whatsapp | telegram | discord | ...
        prompt: "如果 HEARTBEAT.md 存在则读取...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`：持续时间字符串（ms/s/m/h）。默认值：`30m`（API 密钥认证）或 `1h`（OAuth 认证）。设置为 `0m` 禁用。
- `includeSystemPromptSection`：为 false 时，从系统 prompt 中省略 Heartbeat 部分并跳过将 `HEARTBEAT.md` 注入到引导上下文。默认值：`true`。
- `suppressToolErrorWarnings`：为 true 时，在 heartbeat 运行期间禁止工具错误警告有效负载。
- `timeoutSeconds`：heartbeat Agent 轮次被中止之前允许的最大秒数。留空使用 `agents.defaults.timeoutSeconds`。
- `directPolicy`：直接/DM 投递策略。`allow`（默认）允许直接目标投递。`block` 禁止直接目标投递并发出 `reason=dm-blocked`。
- `lightContext`：为 true 时，heartbeat 运行使用轻量级引导上下文，在 workspace 引导文件中只保留 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次 heartbeat 在没有之前对话历史的新鲜 Session 中运行。与 cron `sessionTarget: "isolated"` 的相同隔离模式。将每次 heartbeat 的 token 成本从约 10 万减少到约 2000-5000。
- `skipWhenBusy`：为 true 时，heartbeat 运行在额外繁忙的通道推迟：子 Agent 或嵌套命令工作。即使没有此标志，Cron 通道也始终推迟 heartbeat。
- 每 Agent：设置 `agents.list[].heartbeat`。当任何 Agent 定义 `heartbeat` 时，**只有这些 Agent** 运行 heartbeat。
- Heartbeat 运行完整的 Agent 轮次——较短的间隔消耗更多 token。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // 注册的压缩 provider plugin 的 id（可选）
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "精确保留部署 ID、工单 ID 和 host:port 对。", // identifierPolicy=custom 时使用
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // 可选的 Pi 工具循环压力检查
        postCompactionSections: ["Session Startup", "Red Lines"], // [] 禁用重注入
        model: "openrouter/anthropic/claude-sonnet-4-6", // 可选的仅压缩 model 覆盖
        truncateAfterCompaction: true, // 压缩后轮换到较小的后继 JSONL
        maxActiveTranscriptBytes: "20mb", // 可选的预检本地压缩触发
        notifyUser: true, // 压缩开始和完成时发送简短通知（默认值：false）
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // 可选的仅内存刷新 model 覆盖
          softThresholdTokens: 6000,
          systemPrompt: "Session 即将压缩。立即存储持久内存。",
          prompt: "将任何持久笔记写入 memory/YYYY-MM-DD.md；如果没有要存储的内容，请回复确切的静默 token NO_REPLY。",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（长历史的分块摘要）。请参见 [压缩](/concepts/compaction)。
- `provider`：注册的压缩 Provider Plugin 的 id。设置后，Provider 的 `summarize()` 被调用而不是内置 LLM 摘要。失败时回退到内置。设置 Provider 会强制 `mode: "safeguard"`。请参见 [压缩](/concepts/compaction)。
- `timeoutSeconds`：OpenClaw 中止之前单个压缩操作允许的最大秒数。默认值：`900`。
- `keepRecentTokens`：Pi 切割点预算，用于逐字保留最近的转录尾部。手动 `/compact` 在明确设置时遵循此规则；否则手动压缩是一个硬检查点。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 在压缩摘要期间在前面加上内置的不透明标识符保留指导。
- `identifierInstructions`：`identifierPolicy=custom` 时使用的可选自定义标识符保留文本。
- `qualityGuard`：针对格式错误输出的重试检查，用于 safeguard 摘要。在 safeguard 模式下默认启用；设置 `enabled: false` 跳过审计。
- `midTurnPrecheck`：可选的 Pi 工具循环压力检查。当 `enabled: true` 时，OpenClaw 在追加工具结果后和下一次 model 调用之前检查上下文压力。如果上下文不再适合，它会在提交提示之前中止当前尝试，并重用现有的预检恢复路径来截断工具结果或压缩后重试。与 `default` 和 `safeguard` 压缩模式都能工作。默认：禁用。
- `postCompactionSections`：压缩后重新注入的可选 AGENTS.md H2/H3 部分名称。默认为 `["Session Startup", "Red Lines"]`；设置 `[]` 禁用重注入。未设置或明确设置为该默认对时，也接受旧版 `Every Session`/`Safety` 标题作为旧版回退。
- `model`：仅用于压缩摘要的可选 `provider/model-id` 覆盖。当主 Session 应保留一个 model 但压缩摘要应在另一个上运行时使用；未设置时，压缩使用 Session 的主 model。
- `maxActiveTranscriptBytes`：可选字节阈值（`number` 或像 `"20mb"` 这样的字符串），当活跃 JSONL 超过该阈值时在运行前触发正常的本地压缩。需要 `truncateAfterCompaction`，以便成功的压缩可以轮换到较小的后继转录。未设置或 `0` 时禁用。
- `notifyUser`：为 `true` 时，在压缩开始和完成时向用户发送简短通知（例如，"正在压缩上下文..."和"压缩完成"）。默认禁用以保持压缩静默。
- `memoryFlush`：自动压缩前的静默 agentic 轮次，用于存储持久内存。将 `model` 设置为精确的 provider/model（如 `ollama/qwen3:8b`），当此内务轮次应保持在本地 model 上时；覆盖不继承活跃 Session 回退链。当 workspace 只读时跳过。

### `agents.defaults.contextPruning`

在发送到 LLM 之前从内存上下文中修剪**旧工具结果**。**不会**修改磁盘上的 Session 历史。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 持续时间（ms/s/m/h），默认单位：分钟
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[旧工具结果内容已清除]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 模式行为">

- `mode: "cache-ttl"` 启用修剪过程。
- `ttl` 控制修剪可以再次运行的频率（在最后一次缓存接触后）。
- 修剪先软修剪过大的工具结果，然后在需要时硬清除旧工具结果。

**软修剪** 保留开头和结尾，并在中间插入 `...`。

**硬清除** 用占位符替换整个工具结果。

注意：

- 图像块从不被修剪/清除。
- 比例基于字符（近似值），不是精确的 token 数。
- 如果存在少于 `keepLastAssistants` 条 assistant 消息，则跳过修剪。

</Accordion>

请参见 [Session 修剪](/concepts/session-pruning) 了解行为详情。

### 块流式传输

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（使用 minMs/maxMs）
    },
  },
}
```

- 非 Telegram Channel 需要显式 `*.blockStreaming: true` 才能启用块回复。
- Channel 覆盖：`channels.<channel>.blockStreamingCoalesce`（及每账户变体）。Signal/Slack/Discord/Google Chat 默认 `minChars: 1500`。
- `humanDelay`：块回复之间的随机暂停。`natural` = 800-2500ms。每 Agent 覆盖：`agents.list[].humanDelay`。

请参见 [流式传输](/concepts/streaming) 了解行为和分块详情。

### 输入指示器

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 默认值：直接聊天/提及为 `instant`，未提及的群聊为 `message`。
- 每 Session 覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

请参见 [输入指示器](/concepts/typing-indicators)。

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

嵌入式 Agent 的可选沙盒。完整指南请参见 [沙盒](/gateway/sandboxing)。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // 也支持 SecretRefs / 内联内容：
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="沙盒详情">

**后端：**

- `docker`：本地 Docker runtime（默认）
- `ssh`：通用 SSH 支持的远程 runtime
- `openshell`：OpenShell runtime

当选择 `backend: "openshell"` 时，runtime 特定设置移至 `plugins.entries.openshell.config`。

**SSH 后端配置：**

- `target`：`user@host[:port]` 格式的 SSH 目标
- `command`：SSH 客户端命令（默认：`ssh`）
- `workspaceRoot`：用于每范围 workspace 的绝对远程根目录
- `identityFile` / `certificateFile` / `knownHostsFile`：传递给 OpenSSH 的现有本地文件
- `identityData` / `certificateData` / `knownHostsData`：OpenClaw 在 runtime 时实例化到临时文件的内联内容或 SecretRef

**SSH 认证优先级：**

- `identityData` 优先于 `identityFile`
- `certificateData` 优先于 `certificateFile`
- `knownHostsData` 优先于 `knownHostsFile`
- SecretRef 支持的 `*Data` 值在沙盒 Session 启动前从活跃 secret runtime 快照中解析

**SSH 后端行为：**

- 创建或重新创建后一次性播种远程 workspace
- 然后保持远程 SSH workspace 为规范
- 通过 SSH 路由 `exec`、文件工具和媒体路径
- 不自动将远程更改同步回主机
- 不支持沙盒浏览器容器

**Workspace 访问：**

- `none`：`~/.openclaw/sandboxes` 下的每范围沙盒 workspace
- `ro`：`/workspace` 处的沙盒 workspace，Agent workspace 以只读方式挂载在 `/agent`
- `rw`：Agent workspace 以读/写方式挂载在 `/workspace`

**范围：**

- `session`：每 Session 的容器 + workspace
- `agent`：每 Agent 一个容器 + workspace（默认）
- `shared`：共享容器和 workspace（无跨 Session 隔离）

**OpenShell Plugin 配置：**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // 可选
          gatewayEndpoint: "https://lab.example", // 可选
          policy: "strict", // 可选 OpenShell 策略 id
          providers: ["openai"], // 可选
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell 模式：**

- `mirror`：执行前从本地播种远程，执行后同步回来；本地 workspace 保持规范
- `remote`：创建沙盒时一次性播种远程，然后保持远程 workspace 规范

在 `remote` 模式下，在播种步骤后，在 OpenClaw 外部进行的主机本地编辑不会自动同步到沙盒中。传输是 SSH 进入 OpenShell 沙盒，但 Plugin 拥有沙盒生命周期和可选的镜像同步。

**`setupCommand`** 在容器创建后运行一次（通过 `sh -lc`）。需要网络出口、可写根目录和 root 用户。

**容器默认使用 `network: "none"`** — 如果 Agent 需要出站访问，设置为 `"bridge"`（或自定义 bridge 网络）。`"host"` 被阻止。`"container:<id>"` 默认被阻止，除非你显式设置 `sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（紧急解除）。

**入站附件** 暂存到活跃 workspace 的 `media/inbound/*` 中。

**`docker.binds`** 挂载额外的主机目录；全局和每 Agent 的绑定被合并。

**沙盒浏览器**（`sandbox.browser.enabled`）：容器中的 Chromium + CDP。noVNC URL 注入到系统 prompt 中。不需要在 `openclaw.json` 中启用 `browser.enabled`。noVNC 观察者访问默认使用 VNC 认证，OpenClaw 发出短期 token URL（而不是在共享 URL 中暴露密码）。

- `allowHostControl: false`（默认）阻止沙盒 Session 以主机浏览器为目标。
- `network` 默认为 `openclaw-sandbox-browser`（专用 bridge 网络）。只有在你明确想要全局 bridge 连接时才设置为 `bridge`。
- `cdpSourceRange` 可选地将 CDP 入口限制在容器边缘的 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 仅将额外的主机目录挂载到沙盒浏览器容器中。设置时（包括 `[]`），它替换浏览器容器的 `docker.binds`。

</Accordion>

浏览器沙盒和 `sandbox.docker.binds` 仅限 Docker。

构建镜像：

```bash
scripts/sandbox-setup.sh           # 主沙盒镜像
scripts/sandbox-browser-setup.sh   # 可选浏览器镜像
```

### `agents.list`（每 Agent 覆盖）

使用 `agents.list[].tts` 给 Agent 自己的 TTS provider、声音、model、风格或自动 TTS 模式。Agent 块深度合并到全局 `messages.tts` 之上，因此共享凭据可以保留在一个地方，而各个 Agent 只覆盖它们需要的声音或 Provider 字段。活跃 Agent 的覆盖适用于自动语音回复、`/tts audio`、`/tts status` 和 `tts` Agent 工具。Provider 示例和优先级请参见 [文字转语音](/tools/tts#per-agent-voice-overrides)。

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // 或 { primary, fallbacks }
        thinkingDefault: "high", // 每 Agent thinking 级别覆盖
        reasoningDefault: "on", // 每 Agent 推理可见性覆盖
        fastModeDefault: false, // 每 Agent 快速模式覆盖
        params: { cacheRetention: "none" }, // 按键覆盖匹配的 defaults.models 参数
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // 设置时替换 agents.defaults.skills
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`：稳定的 Agent id（必填）。
- `default`：当设置了多个时，第一个优先（记录警告）。如果未设置，则第一个列表条目为默认值。
- `model`：字符串形式只覆盖 `primary`；对象形式 `{ primary, fallbacks }` 覆盖两者（`[]` 禁用全局 fallback）。只覆盖 `primary` 的 Cron 作业仍然继承默认 fallback，除非你设置 `fallbacks: []`。
- `params`：每 Agent 流参数，合并到 `agents.defaults.models` 中选定的 model 条目之上。用于特定 Agent 覆盖，如 `cacheRetention`、`temperature` 或 `maxTokens`，而不复制整个 model 目录。
- `tts`：可选的每 Agent 文字转语音覆盖。该块深度合并到 `messages.tts` 之上，因此将共享 Provider 凭据和回退策略保留在 `messages.tts` 中，只在此处设置特定角色的值，如 provider、声音、model、风格或自动模式。
- `skills`：可选的每 Agent skill 允许列表。如果省略，Agent 在设置时继承 `agents.defaults.skills`；显式列表替换默认值而不是合并，`[]` 表示无 skills。
- `thinkingDefault`：可选的每 Agent 默认 thinking 级别（`off | minimal | low | medium | high | xhigh | adaptive | max`）。在没有每消息或 Session 覆盖的情况下覆盖该 Agent 的 `agents.defaults.thinkingDefault`。所选 provider/model 配置文件控制哪些值有效；对于 Google Gemini，`adaptive` 保持 Provider 拥有的动态 thinking（在 Gemini 3/3.1 上省略 `thinkingLevel`，在 Gemini 2.5 上 `thinkingBudget: -1`）。
- `reasoningDefault`：可选的每 Agent 默认推理可见性（`on | off | stream`）。在没有每消息或 Session 推理覆盖的情况下应用。
- `fastModeDefault`：可选的每 Agent 快速模式默认值（`true | false`）。在没有每消息或 Session 快速模式覆盖的情况下应用。
- `models`：可选的每 Agent model 目录/runtime 覆盖，以完整 `provider/model` id 为键。使用 `models["provider/model"].agentRuntime` 处理每 Agent runtime 例外。
- `runtime`：可选的每 Agent runtime 描述符。当 Agent 应默认使用 ACP harness Session 时，使用 `type: "acp"` 配合 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：workspace 相对路径、`http(s)` URL 或 `data:` URI。
- `identity` 派生默认值：`ackReaction` 来自 `emoji`，`mentionPatterns` 来自 `name`/`emoji`。
- `subagents.allowAgents`：`sessions_spawn` 的 Agent id 允许列表（`["*"]` = 任意；默认：仅同一 Agent）。
- 沙盒继承保护：如果请求者 Session 被沙盒化，`sessions_spawn` 拒绝会运行未沙盒化的目标。
- `subagents.requireAgentId`：为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式配置文件选择；默认值：false）。

---

## 多 Agent 路由

在一个 Gateway 内运行多个隔离的 Agent。请参见 [多 Agent](/concepts/multi-agent)。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 绑定匹配字段

- `type`（可选）：正常路由为 `route`（缺少 type 默认为 route），持久 ACP 对话绑定为 `acp`。
- `match.channel`（必填）
- `match.accountId`（可选；`*` = 任意账户；省略 = 默认账户）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；Channel 特定）
- `acp`（可选；仅用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确，无 peer/guild/team）
5. `match.accountId: "*"`（Channel 范围）
6. 默认 Agent

在每个层级内，第一个匹配的 `bindings` 条目优先。

对于 `type: "acp"` 条目，OpenClaw 通过精确的对话身份（`match.channel` + 账户 + `match.peer.id`）解析，不使用上面的路由绑定层级顺序。

### 每 Agent 访问配置文件

<Accordion title="完全访问（无沙盒）">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="只读工具 + workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="无文件系统访问（仅消息）">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

优先级详情请参见 [多 Agent 沙盒和工具](/tools/multi-agent-sandbox-tools)。

---

## Session

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // 持续时间或 false
      maxDiskBytes: "500mb", // 可选硬盘预算
      highWaterBytes: "400mb", // 可选清理目标
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 默认非活跃自动取消聚焦（小时）（`0` 禁用）
      maxAgeHours: 0, // 默认硬性最大年龄（小时）（`0` 禁用）
    },
    mainKey: "main", // 旧版（runtime 始终使用 "main"）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Session 字段详情">

- **`scope`**：群聊上下文的基本 Session 分组策略。
  - `per-sender`（默认）：每个发送者在 Channel 上下文中获得一个隔离的 Session。
  - `global`：Channel 上下文中的所有参与者共享一个 Session（仅在有意共享上下文时使用）。
- **`dmScope`**：DM 的分组方式。
  - `main`：所有 DM 共享主 Session。
  - `per-peer`：跨 Channel 按发送者 id 隔离。
  - `per-channel-peer`：按 Channel + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账户 + Channel + 发送者隔离（推荐用于多账户）。
- **`identityLinks`**：将规范 id 映射到带 Provider 前缀的 peer，用于跨 Channel Session 共享。
- **`reset`**：主重置策略。`daily` 在本地时间 `atHour` 重置；`idle` 在 `idleMinutes` 后重置。两者都配置时，先到期的优先。每日重置新鲜度使用 Session 行的 `sessionStartedAt`；空闲重置新鲜度使用 `lastInteractionAt`。后台/系统事件写入（如 heartbeat、cron 唤醒、exec 通知和 gateway 记账）可以更新 `updatedAt`，但不会保持每日/空闲 Session 的新鲜度。
- **`resetByType`**：每类型覆盖（`direct`、`group`、`thread`）。`dm` 接受为 `direct` 的旧版别名。
- **`mainKey`**：旧版字段。Runtime 始终使用 `"main"` 作为主直接聊天桶。
- **`agentToAgent.maxPingPongTurns`**：Agent 间交换期间 Agent 之间的最大回复轮次（整数，范围：`0`-`20`，默认：`5`）。`0` 禁用 ping-pong 链接。
- **`sendPolicy`**：通过 `channel`、`chatType`（`direct|group|channel`，旧版 `dm` 别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。第一个 deny 优先。
- **`maintenance`**：Session 存储清理和保留控制。
  - `mode`：`warn` 仅发出警告；`enforce` 应用清理。
  - `pruneAfter`：过期条目的年龄截止日期（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大条目数（默认 `500`）。Runtime 写入以小型高水位缓冲区批量清理以用于生产级上限；`openclaw sessions cleanup --enforce` 立即应用上限。
  - `rotateBytes`：已弃用且被忽略；`openclaw doctor --fix` 从旧配置中删除它。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 转录存档的保留时间。默认为 `pruneAfter`；设置 `false` 禁用。
  - `maxDiskBytes`：可选的 sessions 目录磁盘预算。在 `warn` 模式下记录警告；在 `enforce` 模式下先删除最旧的工件/Session。
  - `highWaterBytes`：预算清理后的可选目标。默认为 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定 Session 功能的全局默认值。
  - `enabled`：主控默认开关（Provider 可以覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认非活跃自动取消聚焦（小时）（`0` 禁用；Provider 可以覆盖）
  - `maxAgeHours`：默认硬性最大年龄（小时）（`0` 禁用；Provider 可以覆盖）
  - `spawnSessions`：从 `sessions_spawn` 和 ACP 线程生成创建线程绑定工作 Session 的默认门控。当线程绑定启用时默认为 `true`；Provider/账户可以覆盖。
  - `defaultSpawnContext`：线程绑定生成的默认原生子 Agent 上下文（`"fork"` 或 `"isolated"`）。默认为 `"fork"`。

</Accordion>

---

## 消息

```json5
{
  messages: {
    responsePrefix: "🦞", // 或 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 禁用
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 响应前缀

每 Channel/账户覆盖：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析（最具体优先）：账户 → Channel → 全局。`""` 禁用并停止级联。`"auto"` 派生 `[{identity.name}]`。

**模板变量：**

| 变量              | 描述               | 示例                        |
| ----------------- | ------------------ | --------------------------- |
| `{model}`         | 简短 model 名称    | `claude-opus-4-6`           |
| `{modelFull}`     | 完整 model 标识符  | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider 名称      | `anthropic`                 |
| `{thinkingLevel}` | 当前 thinking 级别 | `high`, `low`, `off`        |
| `{identity.name}` | Agent 身份名称     | （与 `"auto"` 相同）        |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### Ack 反应

- 默认为活跃 Agent 的 `identity.emoji`，否则为 `"👀"`。设置 `""` 禁用。
- 每 Channel 覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账户 → Channel → `messages.ackReaction` → identity 回退。
- 范围：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：在支持反应的 Channel（如 Slack、Discord、Telegram、WhatsApp 和 BlueBubbles）上回复后删除 ack。
- `messages.statusReactions.enabled`：在 Slack、Discord 和 Telegram 上启用生命周期状态反应。在 Slack 和 Discord 上，未设置时在 ack 反应活跃时保持状态反应启用。在 Telegram 上，将其显式设置为 `true` 以启用生命周期状态反应。

### 入站防抖

将来自同一发送者的快速纯文本消息批量合并为单个 Agent 轮次。媒体/附件立即刷新。控制命令绕过防抖。

### TTS（文字转语音）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
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
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` 控制默认自动 TTS 模式：`off`、`always`、`inbound` 或 `tagged`。`/tts on|off` 可以覆盖本地偏好，`/tts status` 显示有效状态。
- `summaryModel` 覆盖 `agents.defaults.model.primary` 用于自动摘要。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认为 `false`（需要选择加入）。
- API 密钥回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。
- 捆绑的语音 Provider 由 Plugin 拥有。如果设置了 `plugins.allow`，请包含你想使用的每个 TTS Provider Plugin，例如 Edge TTS 的 `microsoft`。旧版 `edge` Provider id 被接受为 `microsoft` 的别名。
- `providers.openai.baseUrl` 覆盖 OpenAI TTS 端点。解析顺序为配置，然后 `OPENAI_TTS_BASE_URL`，然后 `https://api.openai.com/v1`。
- 当 `providers.openai.baseUrl` 指向非 OpenAI 端点时，OpenClaw 将其视为 OpenAI 兼容的 TTS 服务器并放宽 model/声音验证。

---

## Talk

Talk 模式（macOS/iOS/Android）的默认值。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
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

- 配置了多个 Talk Provider 时，`talk.provider` 必须与 `talk.providers` 中的键匹配。
- 旧版扁平 Talk 键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容性，会自动迁移到 `talk.providers.<provider>`。
- 声音 ID 回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受明文字符串或 SecretRef 对象。
- `ELEVENLABS_API_KEY` 回退仅在未配置 Talk API 密钥时适用。
- `providers.*.voiceAliases` 让 Talk 指令使用友好名称。
- `providers.mlx.modelId` 选择 macOS 本地 MLX 助手使用的 Hugging Face 仓库。如果省略，macOS 使用 `mlx-community/Soprano-80M-bf16`。
- macOS MLX 播放通过捆绑的 `openclaw-mlx-tts` 助手（如果存在）或 `PATH` 上的可执行文件运行；`OPENCLAW_MLX_TTS_BIN` 覆盖助手路径用于开发。
- `consultThinkingLevel` 控制 Control UI Talk 实时 `openclaw_agent_consult` 调用后面的完整 OpenClaw agent 运行的 thinking 级别。留空以保留正常 Session/model 行为。
- `consultFastMode` 为 Control UI Talk 实时咨询设置一次性快速模式覆盖，而不更改 Session 的正常快速模式设置。
- `speechLocale` 设置 iOS/macOS Talk 语音识别使用的 BCP 47 区域 id。留空使用设备默认值。
- `silenceTimeoutMs` 控制 Talk 模式在用户沉默后等待多长时间再发送转录。未设置时保留平台默认暂停窗口（`macOS 和 Android 上 700ms，iOS 上 900ms`）。
- `realtime.instructions` 向 OpenClaw 内置实时提示追加 Provider 面向的系统指令，因此可以配置声音风格而不丢失默认的 `openclaw_agent_consult` 指导。

---

## 相关文档

- [配置参考](/gateway/configuration-reference) — 其他所有配置键
- [配置](/gateway/configuration) — 常见任务和快速设置
- [配置示例](/gateway/configuration-examples)
