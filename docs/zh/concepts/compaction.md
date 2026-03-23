---
mmh3_hash: "a3adc52602d0442c55e9d08517102e0f"
summary: "Context window + compaction: OpenClaw 如何将 sessions 保持在 model 限制内"
read_when:
  - 你想了解自动 compaction 和 /compact
  - 你正在调试达到 context 限制的长 sessions
title: "Compaction"
---

# Context Window & Compaction

每个 model 都有一个 **context window**(它可以看到的最大 tokens)。长时间运行的聊天会累积消息和工具结果;一旦窗口紧张,OpenClaw 会 **compact** 较旧的历史记录以保持在限制内。

## Compaction 是什么

Compaction **将较旧的对话总结** 为紧凑的摘要条目,并保持最近的消息完整。摘要存储在 session 历史记录中,因此未来的请求使用:

- Compaction 摘要
- Compaction 点之后的最近消息

Compaction **持久化** 在 session 的 JSONL 历史记录中。

## 配置

使用你的 `openclaw.json` 中的 `agents.defaults.compaction` 设置来配置 compaction 行为(模式、目标 tokens 等)。
Compaction 摘要默认保留不透明标识符(`identifierPolicy: "strict"`)。你可以通过 `identifierPolicy: "off"` 覆盖此设置,或通过 `identifierPolicy: "custom"` 和 `identifierInstructions` 提供自定义文本。

你可以通过 `agents.defaults.compaction.model` 为 compaction 摘要指定不同的模型。当你的主模型是本地或小型模型,而你希望 compaction 摘要由更强大的模型生成时,此功能非常有用。该覆盖接受任意 `provider/model-id` 字符串:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

这也适用于本地模型,例如专用于摘要的第二个 Ollama 模型或专门针对 compaction 微调的模型:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

未设置时,compaction 使用 agent 的主模型。

## 自动 compaction(默认开启)

当 session 接近或超过 model 的 context window 时,OpenClaw 会触发自动 compaction,并可能使用压缩的 context 重试原始请求。

你会看到:

- 在 verbose 模式下看到 `🧹 Auto-compaction complete`
- `/status` 显示 `🧹 Compactions: <count>`

在 compaction 之前,OpenClaw 可以运行 **静默内存刷新** 回合以将持久注释存储到磁盘。参见 [Memory](/concepts/memory) 了解详细信息和配置。

## 手动 compaction

使用 `/compact`(可选带有说明)强制进行 compaction 传递:

```
/compact Focus on decisions and open questions
```

## Context window 来源

Context window 特定于 model。OpenClaw 使用配置的 provider catalog 中的 model 定义来确定限制。

## Compaction vs pruning

- **Compaction**: 总结并 **持久化** 在 JSONL 中。
- **Session pruning**: 仅修剪旧的 **tool results**,**内存中**,每个请求。

参见 [/concepts/session-pruning](/concepts/session-pruning) 了解 pruning 详细信息。

## OpenAI 服务端 compaction

OpenClaw 还支持 OpenAI Responses 服务端 compaction 提示,适用于兼容的直接 OpenAI 模型。这与本地 OpenClaw compaction 是分开的,可以并行运行。

- 本地 compaction: OpenClaw 进行摘要并持久化到 session JSONL 中。
- 服务端 compaction: 当启用 `store` + `context_management` 时,OpenAI 在 provider 侧压缩 context。

参见 [OpenAI provider](/providers/openai) 了解 model 参数和覆盖设置。

## 自定义 context engines

Compaction 行为由活动的 [context engine](/concepts/context-engine) 拥有。Legacy engine 使用上面描述的内置摘要。Plugin engine(通过 `plugins.slots.contextEngine` 选择)可以实现任何 compaction 策略——DAG 摘要、向量检索、增量压缩等。

当 plugin engine 设置 `ownsCompaction: true` 时,OpenClaw 将所有 compaction 决策委托给该 engine,不运行内置自动 compaction。

当 `ownsCompaction` 为 `false` 或未设置时,OpenClaw 仍可能使用 Pi 的内置运行中自动 compaction,但活动 engine 的 `compact()` 方法仍处理 `/compact` 和溢出恢复。没有自动回退到 legacy engine 的 compaction 路径。

如果你正在构建非 owning context engine,通过从 `openclaw/plugin-sdk/core` 调用 `delegateCompactionToRuntime(...)` 来实现 `compact()`。

## 提示

- 当 sessions 感觉陈旧或 context 臃肿时使用 `/compact`。
- 大型工具输出��经被截断;pruning 可以进一步减少工具结果的堆积。
- 如果需要全新的开始,`/new` 或 `/reset` 会启动新的 session id。
