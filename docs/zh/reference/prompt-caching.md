---
mmh3_hash: "1dae035ac4394dbc8f6465f0412ce225"
title: "Prompt Caching"
summary: "Prompt caching 配置项、合并顺序、Provider 行为及调优模式"
read_when:
  - 希望通过缓存保留来降低 prompt token 成本
  - 需要在多 Agent 环境中为每个 Agent 单独配置缓存行为
  - 正在同时调优心跳（heartbeat）与 cache-ttl 清理策略
---

# Prompt caching

Prompt caching 是指模型 Provider 可以在多轮对话中复用未发生变化的 prompt 前缀（通常是系统/开发者指令及其他稳定上下文），而无需每次重新处理。第一个匹配请求会写入缓存 token（`cacheWrite`），后续匹配请求则可读取已缓存的内容（`cacheRead`）。

为何重要：降低 token 成本、加快响应速度，并提升长会话的性能稳定性。若不使用缓存，即使每轮输入几乎没有变化，重复的 prompt 也会在每次对话时支付完整的 prompt 费用。

本页涵盖所有影响 prompt 复用和 token 成本的缓存相关配置项。

有关 Anthropic 定价详情，请参阅：
[https://docs.anthropic.com/docs/build-with-claude/prompt-caching](https://docs.anthropic.com/docs/build-with-claude/prompt-caching)

## 主要配置项

### `cacheRetention`（模型级别及 Agent 级别）

在模型参数中设置缓存保留策略：

```yaml
agents:
  defaults:
    models:
      "anthropic/claude-opus-4-6":
        params:
          cacheRetention: "short" # none | short | long
```

Agent 级别覆盖：

```yaml
agents:
  list:
    - id: "alerts"
      params:
        cacheRetention: "none"
```

配置合并顺序：

1. `agents.defaults.models["provider/model"].params`
2. `agents.list[].params`（匹配 Agent id；按 key 覆盖）

### 旧版 `cacheControlTtl`

旧版值仍受支持，并会自动映射：

- `5m` -> `short`
- `1h` -> `long`

新配置建议使用 `cacheRetention`。

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

心跳（Heartbeat）可以在缓存窗口内保持缓存活跃，减少空闲间隔后重复写缓存的次数。

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

### Amazon Bedrock

- Anthropic Claude 模型引用（`amazon-bedrock/*anthropic.claude*`）支持显式 `cacheRetention` 透传。
- 非 Anthropic 的 Bedrock 模型在运行时会强制设为 `cacheRetention: "none"`。

### OpenRouter Anthropic 模型

对于 `openrouter/anthropic/*` 模型引用，OpenClaw 会在系统/开发者 prompt 块中注入 Anthropic `cache_control`，以提升 prompt 缓存复用率。

### 其他 Provider

若 Provider 不支持此缓存模式，`cacheRetention` 不会产生任何效果。

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

## 快速排错

- 大多数轮次出现高 `cacheWrite`：检查系统 prompt 输入是否存在易变内容，并确认模型/Provider 支持当前缓存设置。
- `cacheRetention` 无效：确认模型 key 与 `agents.defaults.models["provider/model"]` 匹配。
- 带有缓存设置的 Bedrock Nova/Mistral 请求：预期行为是在运行时强制设为 `none`。

相关文档：

- [Anthropic](/providers/anthropic)
- [Token Use and Costs](/reference/token-use)
- [Session Pruning](/concepts/session-pruning)
- [Gateway Configuration Reference](/gateway/configuration-reference)
