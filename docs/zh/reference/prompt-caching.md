---
mmh3_hash: "e004310841d503abae188609041f1665"
title: "Prompt Caching"
summary: "Prompt caching 配置项、合并顺序、Provider 行为及调优模式"
read_when:
  - 希望通过缓存保留来降低 prompt token 成本
  - 需要在多 Agent 环境中为每个 Agent 单独配置缓存行为
  - 正在同时调优心跳（heartbeat）与 cache-ttl 清理策略
---

# Prompt caching

Prompt caching 是指模型 Provider 可以在多轮对话中复用未发生变化的 prompt 前缀（通常是系统/开发者指令及其他稳定上下文），而无需每次重新处理。OpenClaw 将提供商使用量规范化为 `cacheRead` 和 `cacheWrite`（当上游 API 直接提供这些计数器时）。

状态界面还可以从最近的转录使用日志中恢复缓存计数器，即使在实时 Session 快照缺失这些计数器时，`/status` 也能持续显示缓存行。现有的非零实时缓存值仍然优先于转录回退值。

为何重要：降低 token 成本、加快响应速度，并提升长会话的性能稳定性。若不使用缓存，即使每轮输入几乎没有变化，重复的 prompt 也会在每次对话时支付完整的 prompt 费用。

本页涵盖所有影响 prompt 复用和 token 成本的缓存相关配置项。

Provider 参考：

- Anthropic prompt caching：[https://platform.claude.com/docs/en/build-with-claude/prompt-caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- OpenAI prompt caching：[https://developers.openai.com/api/docs/guides/prompt-caching](https://developers.openai.com/api/docs/guides/prompt-caching)
- OpenAI API 头和请求 ID：[https://developers.openai.com/api/reference/overview](https://developers.openai.com/api/reference/overview)
- Anthropic 请求 ID 和错误：[https://platform.claude.com/docs/en/api/errors](https://platform.claude.com/docs/en/api/errors)

## 主要配置项

### `cacheRetention`（全局默认、模型和每个 Agent）

为所有模型设置全局默认缓存保留：

```yaml
agents:
  defaults:
    params:
      cacheRetention: "long" # none | short | long
```

按模型覆盖：

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

每个 Agent 覆盖：

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

配置合并顺序：

1. `agents.defaults.params`（全局默认 — 适用于所有模型）
2. `agents.defaults.models["provider/model"].params`（按模型覆盖）
3. `agents.list[].params`（匹配 Agent id；按 key 覆盖）

### `contextPruning.mode: "cache-ttl"`

在缓存 TTL 窗口过期后清理旧的工具结果上下文，避免空闲后的请求重新缓存过大的历史记录。

```yaml
agents:
  defaults:
    contextPruning:
      mode: "cache-ttl"
      ttl: "1h"
```

完整行为说明请参阅 [Session Pruning](/concepts/session-pruning)。

### 心跳保温（Heartbeat keep-warm）

心跳可以保持缓存窗口活跃，并减少空闲间隔后重复写缓存的次数。

```yaml
agents:
  defaults:
    heartbeat:
      every: "55m"
```

Agent 级别的心跳配置支持在 `agents.list[].heartbeat` 中设置。

## Provider 行为

### Anthropic（直接 API）

- 支持 `cacheRetention`。
- 使用 Anthropic API 密钥认证 Profile 时，当未设置缓存保留策略时，OpenClaw 会为 Anthropic 模型引用默认注入 `cacheRetention: "short"`。
- Anthropic 原生 Messages 响应同时提供 `cache_read_input_tokens` 和 `cache_creation_input_tokens`，因此 OpenClaw 可以同时显示 `cacheRead` 和 `cacheWrite`。
- 对于原生 Anthropic 请求，`cacheRetention: "short"` 映射到默认的 5 分钟临时缓存，`cacheRetention: "long"` 仅在直接 `api.anthropic.com` 主机上升级为 1 小时 TTL。

### OpenAI（直接 API）

- 支持的近期模型自动启用 prompt caching。OpenClaw 不需要注入块级缓存标记。
- OpenClaw 使用 `prompt_cache_key` 在各轮中保持缓存路由稳定，并仅在直接 OpenAI 主机上选择 `cacheRetention: "long"` 时使用 `prompt_cache_retention: "24h"`。
- OpenAI 响应通过 `usage.prompt_tokens_details.cached_tokens`（或 Responses API 事件上的 `input_tokens_details.cached_tokens`）暴露缓存的 prompt token。OpenClaw 将其映射为 `cacheRead`。
- OpenAI 不暴露单独的缓存写入 token 计数器，因此即使提供商正在预热缓存，OpenAI 路径上的 `cacheWrite` 也保持为 `0`。
- OpenAI 返回有用的追踪和速率限制头，如 `x-request-id`、`openai-processing-ms` 和 `x-ratelimit-*`，但缓存命中核算应来自使用量有效负载，而非头部。
- 在实际情况中，OpenAI 的行为更像初始前缀缓存，而非 Anthropic 风格的移动全历史复用。稳定的长前缀文本轮次在当前实时探测中可以接近 `4864` 个缓存 token 平台，而工具密集型或 MCP 风格的转录即使在精确重复时通常也在接近 `4608` 个缓存 token 处趋于平稳。

### Anthropic Vertex

- Vertex AI 上的 Anthropic 模型（`anthropic-vertex/*`）与直接 Anthropic 的方式相同支持 `cacheRetention`。
- `cacheRetention: "long"` 映射到 Vertex AI 端点上的真实 1 小时 prompt 缓存 TTL。
- `anthropic-vertex` 的默认缓存保留与直接 Anthropic 默认值匹配。
- Vertex 请求通过边界感知的缓存整形路由，以便缓存复用与提供商实际接收到的内容保持一致。

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`）支持显式 `cacheRetention` 透传。
- 非 Anthropic 的 Bedrock 模型在运行时会强制设为 `cacheRetention: "none"`。

### OpenRouter Anthropic 模型

对于 `openrouter/anthropic/*` 模型引用，OpenClaw 在系统/开发者 prompt 块上注入 Anthropic `cache_control`，以提升 prompt 缓存复用率，仅当请求仍然指向已验证的 OpenRouter 路由时（`openrouter` 在其默认端点上，或任何解析为 `openrouter.ai` 的提供商/基础 URL）。

如果您将模型重新指向任意 OpenAI 兼容代理 URL，OpenClaw 会停止注入这些 OpenRouter 特定的 Anthropic 缓存标记。

### 其他 Provider

若 Provider 不支持此缓存模式，`cacheRetention` 不会产生任何效果。

### Google Gemini 直接 API

- 直接 Gemini 传输（`api: "google-generative-ai"`）通过上游 `cachedContentTokenCount` 报告缓存命中；OpenClaw 将其映射为 `cacheRead`。
- 当在直接 Gemini 模型上设置 `cacheRetention` 时，OpenClaw 会在 Google AI Studio 运行中自动创建、重用和刷新系统 prompt 的 `cachedContents` 资源。这意味着您不再需要手动预创建缓存内容句柄。
- 您仍然可以通过模型上的 `params.cachedContent`（或旧版 `params.cached_content`）传递预先存在的 Gemini 缓存内容句柄。
- 这与 Anthropic/OpenAI prompt 前缀缓存是分开的。对于 Gemini，OpenClaw 管理提供商原生的 `cachedContents` 资源，而不是在请求中注入缓存标记。

### Gemini CLI JSON 使用量

- Gemini CLI JSON 输出也可以通过 `stats.cached` 显示缓存命中；OpenClaw 将其映射为 `cacheRead`。
- 如果 CLI 省略了直接的 `stats.input` 值，OpenClaw 从 `stats.input_tokens - stats.cached` 推导输入 token。
- 这仅是使用量规范化。这并不意味着 OpenClaw 正在为 Gemini CLI 创建 Anthropic/OpenAI 风格的 prompt 缓存标记。

## 系统 prompt 缓存边界

OpenClaw 将系统 prompt 分为**稳定前缀**和**可变后缀**，由内部缓存前缀边界分隔。边界以上的内容（工具定义、技能元数据、工作区文件和其他相对静态的上下文）会排序以在各轮中保持字节相同。边界以下的内容（例如 `HEARTBEAT.md`、运行时时间戳和其他每轮元数据）允许更改而不使缓存前缀失效。

关键设计选择：

- 稳定的工作区项目上下文文件排在 `HEARTBEAT.md` 之前，以便心跳变化不会破坏稳定前缀。
- 边界应用于 Anthropic 系列、OpenAI 系列、Google 和 CLI 传输整形，以便所有支持的提供商都能从相同的前缀稳定性中受益。
- Codex Responses 和 Anthropic Vertex 请求通过边界感知的缓存整形路由，以便缓存复用与提供商实际接收到的内容保持一致。
- 系统 prompt 指纹规范化（空白、行尾、hook 添加的上下文、运行时能力排序），以便语义上未更改的 prompt 在各轮中共享 KV/缓存。

如果您在配置或工作区更改后看到意外的 `cacheWrite` 峰值，请检查该更改是否落在缓存边界的上方或下方。将可变内容移至边界以下（或使其稳定）通常可以解决问题。

## OpenClaw 缓存稳定性保障

OpenClaw 还在请求到达提供商之前保持几个对缓存敏感的有效负载形状确定性：

- Bundle MCP 工具目录在工具注册之前确定性排序，以便 `listTools()` 顺序更改不会搅动工具块并破坏 prompt 缓存前缀。
- 具有持久化图像块的旧版 Session 保留**最近 3 个已完成的轮次**完整；较早的已处理图像块可能被标记替换，以便图像密集型后续不会持续重新发送大型过时有效负载。

## 调优模式

### 混合流量（推荐默认配置）

为主 Agent 保持较长的缓存基线，对突发性通知 Agent 禁用缓存：

```yaml
agents:
  defaults:
    model:
      primary: "anthropic/claude-opus-4-6"
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "long"
  list:
    - id: "research"
      default: true
      heartbeat:
        every: "55m"
    - id: "alerts"
      params:
        cacheRetention: "none"
```

### 成本优先基线

- 设置基线 `cacheRetention: "short"`。
- 启用 `contextPruning.mode: "cache-ttl"`。
- 仅对受益于热缓存的 Agent 将心跳频率保持在 TTL 以内。

## 缓存诊断

OpenClaw 为嵌入式 Agent 运行提供专用的缓存追踪诊断功能。

对于面向用户的普通诊断，`/status` 和其他使用量摘要可以使用最新的转录使用条目作为回退源，当实时 Session 条目没有 `cacheRead` / `cacheWrite` 计数器时使用。

## 实时回归测试

OpenClaw 为重复前缀、工具轮次、图像轮次、MCP 风格工具转录和 Anthropic 无缓存控制保留一个综合实时缓存回归门控。

- `src/agents/live-cache-regression.live.test.ts`
- `src/agents/live-cache-regression-baseline.ts`

使用以下命令运行窄实时门控：

```sh
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_CACHE_TEST=1 pnpm test:live:cache
```

基线文件存储最近观察到的实时数字以及测试使用的提供商特定回归底限。运行器还使用新的每运行 Session ID 和 prompt 命名空间，以便之前的缓存状态不会污染当前的回归样本。

这些测试有意不在各提供商间使用相同的成功标准。

### Anthropic 实时期望

- 通过 `cacheWrite` 期望明确的预热写入。
- 在重复轮次中期望接近完整的历史复用，因为 Anthropic 缓存控制通过对话推进缓存断点。
- 当前实时断言对稳定、工具和图像路径仍使用高命中率阈值。

### OpenAI 实时期望

- 仅期望 `cacheRead`。`cacheWrite` 保持为 `0`。
- 将重复轮次的缓存复用视为提供商特定的平台，而非 Anthropic 风格的移动全历史复用。
- 当前实时断言使用从 `gpt-5.4-mini` 观察到的实时行为推导的保守底限检查：
  - 稳定前缀：`cacheRead >= 4608`，命中率 `>= 0.90`
  - 工具转录：`cacheRead >= 4096`，命中率 `>= 0.85`
  - 图像转录：`cacheRead >= 3840`，命中率 `>= 0.82`
  - MCP 风格转录：`cacheRead >= 4096`，命中率 `>= 0.85`

2026-04-04 的新鲜综合实时验证结果：

- 稳定前缀：`cacheRead=4864`，命中率 `0.966`
- 工具转录：`cacheRead=4608`，命中率 `0.896`
- 图像转录：`cacheRead=4864`，命中率 `0.954`
- MCP 风格转录：`cacheRead=4608`，命中率 `0.891`

综合门控的最近本地挂钟时间约为 `88s`。

为什么断言不同：

- Anthropic 暴露明确的缓存断点和移动对话历史复用。
- OpenAI prompt caching 仍然对精确前缀敏感，但实时 Responses 流量中有效的可复用前缀可能比完整 prompt 更早趋于平稳。
- 因此，使用单一跨提供商百分比阈值比较 Anthropic 和 OpenAI 会产生误报回归。

### `diagnostics.cacheTrace` 配置

```yaml
diagnostics:
  cacheTrace:
    enabled: true
    filePath: "~/.openclaw/logs/cache-trace.jsonl" # 可选
    includeMessages: false # 默认 true
    includePrompt: false # 默认 true
    includeSystem: false # 默认 true
```

默认值：

- `filePath`：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`
- `includeMessages`：`true`
- `includePrompt`：`true`
- `includeSystem`：`true`

### 环境变量开关（一次性调试）

- `OPENCLAW_CACHE_TRACE=1`：启用缓存追踪。
- `OPENCLAW_CACHE_TRACE_FILE=/path/to/cache-trace.jsonl`：覆盖输出路径。
- `OPENCLAW_CACHE_TRACE_MESSAGES=0|1`：切换完整消息内容捕获。
- `OPENCLAW_CACHE_TRACE_PROMPT=0|1`：切换 prompt 文本捕获。
- `OPENCLAW_CACHE_TRACE_SYSTEM=0|1`：切换系统 prompt 捕获。

### 检查内容

- 缓存追踪事件为 JSONL 格式，包含分阶段快照，例如 `session:loaded`、`prompt:before`、`stream:context` 和 `session:after`。
- 每轮的缓存 token 影响可通过常规使用界面的 `cacheRead` 和 `cacheWrite` 查看（例如 `/usage full` 和 Session 使用摘要）。
- 对于 Anthropic，当缓存处于活动状态时，期望同时出现 `cacheRead` 和 `cacheWrite`。
- 对于 OpenAI，在缓存命中时期望 `cacheRead`，`cacheWrite` 保持 `0`；OpenAI 不发布单独的缓存写入 token 字段。
- 如果需要请求追踪，请将请求 ID 和速率限制头与缓存指标分开记录。OpenClaw 当前的缓存追踪输出专注于 prompt/session 形状和规范化 token 使用量，而非原始提供商响应头。

## 快速故障排除

- 大多数轮次出现高 `cacheWrite`：检查系统 prompt 输入是否存在易变内容，并确认模型/Provider 支持当前缓存设置。
- Anthropic 上出现高 `cacheWrite`：通常意味着缓存断点落在每次请求都会更改的内容上。
- OpenAI `cacheRead` 低：确认稳定前缀在最前面，重复前缀至少为 1024 个 token，并且应共享缓存的轮次重用了相同的 `prompt_cache_key`。
- `cacheRetention` 无效：确认模型 key 与 `agents.defaults.models["provider/model"]` 匹配。
- 带有缓存设置的 Bedrock Nova/Mistral 请求：预期行为是在运行时强制设为 `none`。

相关文档：

- [Anthropic](/providers/anthropic)
- [Token 使用与费用](/reference/token-use)
- [Session Pruning](/concepts/session-pruning)
- [Gateway 配置参考](/gateway/configuration-reference)
