---
mmh3_hash: "12ab6554e5b0d6917f1346a6e7adf80a"
summary: "OpenClaw 如何构建提示词上下文并报告令牌使用情况 + 成本"
read_when:
  - 解释令牌使用情况、成本或上下文窗口
  - 调试上下文增长或压缩行为
title: "令牌使用和成本"
---

# 令牌使用和成本

OpenClaw 跟踪**令牌**，而不是字符。令牌是特定于模型的，但大多数 OpenAI 风格的模型对于英文文本平均约 4 个字符/令牌。

## 系统提示词如何构建

OpenClaw 在每次运行时组装自己的系统提示词。它包括：

- Tool 列表 + 简短描述
- Skills 列表（仅元数据；指令按需使用 `read` 加载）
- 自我更新指令
- 工作空间 + 引导文件（新建时为 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`，存在时为 `MEMORY.md`，当 `MEMORY.md` 不存在时回退到小写 `memory.md`）。大型文件被 `agents.defaults.bootstrapMaxChars`（默认：20000）截断，总引导注入由 `agents.defaults.bootstrapTotalMaxChars`（默认：150000）限制。`memory/*.md` 文件通过内存 Tools 按需提供，不会自动注入。
- 时间（UTC + 用户时区）
- 回复标签 + 心跳行为
- 运行时元数据（主机/OS/模型/思考）

有关完整细分，请参阅[系统提示词](/concepts/system-prompt)。

## 上下文窗口中计数的内容

模型接收的所有内容都计入上下文限制：

- 系统提示词（上面列出的所有部分）
- 对话历史（用户 + 助手消息）
- Tool 调用和 Tool 结果
- 附件/转录（图像、音频、文件）
- 压缩摘要和修剪工件
- Provider 包装器或安全标头（不可见，但仍计数）

对于图像，OpenClaw 在调用提供商之前对转录/工具图像有效负载进行缩小处理。
使用 `agents.defaults.imageMaxDimensionPx`（默认：`1200`）进行调整：

- 较低的值通常减少视觉令牌使用量和有效负载大小。
- 较高的值为 OCR/UI 密集型截图保留更多视觉细节。

有关每个注入文件、Tools、Skills 和系统提示词大小的实用细分，请使用 `/context list` 或 `/context detail`。参见[上下文](/concepts/context)。

## 如何查看当前令牌使用情况

在聊天中使用这些：

- `/status` → **富含表情符号的状态卡**，显示会话模型、上下文使用情况、上次响应输入/输出令牌和**估计成本**（仅 API 密钥）。
- `/usage off|tokens|full` → 将**每个响应的使用情况页脚**附加到每个回复。
  - 每个会话持久（存储为 `responseUsage`）。
  - OAuth 身份验证**隐藏成本**（仅令牌）。
- `/usage cost` → 显示来自 OpenClaw 会话日志的本地成本摘要。

其他界面：

- **TUI/Web TUI：**支持 `/status` + `/usage`。
- **CLI：**`openclaw status --usage` 和 `openclaw channels list` 显示 Provider 配额窗口（不是每个响应的成本）。

## 成本估算（显示时）

成本根据您的模型定价配置估算：

```
models.providers.<provider>.models[].cost
```

这些是 `input`、`output`、`cacheRead` 和 `cacheWrite` 的 **USD/百万令牌**。如果缺少定价，OpenClaw 仅显示令牌。OAuth 令牌永远不显示美元成本。

## 缓存 TTL 和修剪影响

Provider 提示词缓存仅在缓存 TTL 窗口内适用。OpenClaw 可以选择运行 **cache-ttl pruning**：它在缓存 TTL 过期后修剪会话，然后重置缓存窗口，以便后续请求可以重新使用新缓存的上下文，而不是重新缓存完整历史记录。这在会话空闲超过 TTL 时保持较低的缓存写入成本。

在 [Gateway 配置](/gateway/configuration)中配置它，并在[会话修剪](/concepts/session-pruning)中查看行为详细信息。

Heartbeat 可以在空闲间隙中保持缓存**温暖**。如果您的模型缓存 TTL 为 `1h`，将心跳间隔设置为略低于该值（例如 `55m`）可以避免重新缓存完整提示词，从而降低缓存写入成本。

在多 Agent 设置中，您可以保留一个共享模型配置，并使用 `agents.list[].params.cacheRetention` 按 Agent 调整缓存行为。

有关完整的逐项指南，请参阅[提示词缓存](/reference/prompt-caching)。

对于 Anthropic API 定价，缓存读取比输入令牌便宜得多，而缓存写入以更高的乘数计费。有关最新费率和 TTL 乘数，请参阅 Anthropic 的提示词缓存定价：[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

### 示例：使用 Heartbeat 保持 1h 缓存温暖

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
    heartbeat:
      every: "55m"
```

### 示例：混合流量的按 Agent 缓存策略

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long" # 大多数 Agent 的默认基准
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m" # 为深度会话保持长缓存温暖
    - id: "alerts"
      params:
        cacheRetention: "none" # 避免突发通知的缓存写入
```

`agents.list[].params` 合并在所选模型的 `params` 之上，因此您只能覆盖 `cacheRetention` 并继承其他模型默认值不变。

### 示例：启用 Anthropic 1M 上下文 beta 标头

Anthropic 的 1M 上下文窗口目前处于 beta 阶段。当您在支持的 Opus 或 Sonnet 模型上启用 `context1m` 时，OpenClaw 可以注入所需的 `anthropic-beta` 值。

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          context1m: true
```

这映射到 Anthropic 的 `context-1m-2025-08-07` beta 标头。

仅当在该模型条目上设置 `context1m: true` 时才适用。

要求：凭据必须符合长上下文使用条件（API 密钥计费，或启用了 Extra Usage 的订阅）。如果不符合，Anthropic 会响应 `HTTP 429: rate_limit_error: Extra usage is required for long context requests`。

如果您使用 OAuth/订阅令牌（`sk-ant-oat-*`）验证 Anthropic，OpenClaw 会跳过 `context-1m-*` beta 标头，因为 Anthropic 当前以 HTTP 401 拒绝该组合。

## 减少令牌压力的技巧

- 使用 `/compact` 总结长会话。
- 在工作流中修剪大型 Tool 输出。
- 对于截图密集型会话，降低 `agents.defaults.imageMaxDimensionPx`。
- 保持 Skill 描述简短（Skill 列表被注入到提示词中）。
- 对于冗长的探索性工作，优先使用较小的模型。

有关确切的 Skill 列表开销公式，请参阅 [Skills](/tools/skills)。
