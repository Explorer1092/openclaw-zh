---
mmh3_hash: "c400063912fa3d112978afbdd374740c"
summary: "Context window + compaction: OpenClaw 如何将 sessions 保持在 model 限制内"
read_when:
  - 你想了解自动 compaction 和 /compact
  - 你正在调试达到 context 限制的长 sessions
---
# Context Window & Compaction

每个 model 都有一个 **context window**(它可以看到的最大 tokens)。长时间运行的聊天会累积消息和工具结果;一旦窗口紧张,OpenClaw 会 **compact** 较旧的历史记录以保持在限制内。

## Compaction 是什么
Compaction **将较旧的对话总结** 为紧凑的摘要条目,并保持最近的消息完整。摘要存储在 session 历史记录中,因此未来的请求使用:
- Compaction 摘要
- Compaction 点之后的最近消息

Compaction **持久化** 在 session 的 JSONL 历史记录中。

## 配置
参见 [Compaction config & modes](/zh/concepts/compaction) 了解 `agents.defaults.compaction` 设置。

## 自动 compaction(默认开启)
当 session 接近或超过 model 的 context window 时,OpenClaw 会触发自动 compaction,并可能使用压缩的 context 重试原始请求。

你会看到:
- 在 verbose 模式下看到 `🧹 Auto-compaction complete`
- `/status` 显示 `🧹 Compactions: <count>`

在 compaction 之前,OpenClaw 可以运行 **静默内存刷新** 回合以将持久注释存储到磁盘。参见 [Memory](/zh/concepts/memory) 了解详细信息和配置。

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

参见 [/concepts/session-pruning](/zh/concepts/session-pruning) 了解 pruning 详细信息。

## 提示
- 当 sessions 感觉陈旧或 context 臃肿时使用 `/compact`。
- 大型工具输出已经被截断;pruning 可以进一步减少工具结果的堆积。
- 如果需要全新的开始,`/new` 或 `/reset` 会启动新的 session id。
