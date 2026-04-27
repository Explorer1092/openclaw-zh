---
mmh3_hash: "faf54a44a7e18f0576671d59b3faa353"
title: "Session pruning"
sidebarTitle: "Session pruning"
summary: "修剪旧的 tool results 以保持 context 精简和缓存高效"
read_when:
  - 你想减少来自 tool 输出的 context 增长
  - 你想了解 Anthropic prompt cache 优化
---

Session 修剪在每次 LLM 调用之前从 context 中修剪**旧的 tool results**。它减少因累积的工具输出（exec 结果、文件读取、搜索结果）而导致的 context 膨胀，而不重写正常的对话文本。

<Info>
修剪仅在内存中进行——它不会修改磁盘上的 Session transcript。你的完整历史记录始终保留。
</Info>

## 为什么重要

长 Session 会累积工具输出，使 context window 膨胀。这会增加成本，并可能比必要时更早强制触发 [compaction](/concepts/compaction)。

修剪对于 **Anthropic prompt caching** 特别有价值。缓存 TTL 到期后，下一次请求会重新缓存完整 prompt。修剪减少了缓存写入大小，直接降低成本。

## 工作原理

1. 等待缓存 TTL 到期（默认 5 分钟）。
2. 找到旧的 tool results 进行正常修剪（对话文本保持不变）。
3. **软修剪**过大的结果——保留头部和尾部，插入 `...`。
4. **硬清除**其余部分——用占位符替换。
5. 重置 TTL，以便后续请求重用新缓存。

## 旧版图像清理

OpenClaw 还为在历史记录中持久化了原始图像块或 prompt-hydration 媒体标记的 Sessions 构建单独的幂等 replay 视图。

- 它逐字节保留**3 个最近完成的回合**，以保持近期后续请求的 prompt 缓存前缀稳定。
- 在 replay 视图中，来自 `user` 或 `toolResult` 历史记录的已处理旧图像块可以被替换为 `[image data removed - already processed by model]`。
- 旧版文本媒体引用，如 `[media attached: ...]`、`[Image: source: ...]` 和 `media://inbound/...` 可以被替换为 `[media reference removed - already processed by model]`。当前回合的附件标记保持完整，以便视觉模型仍然可以 hydrate 新图像。
- 原始 Session transcript 不被重写，因此历史记录查看器仍然可以渲染原始消息条目及其图像。
- 这与正常的 cache-TTL 修剪是分开的。它的存在是为了防止重复的图像 payload 或过时的媒体引用在后续回合中破坏 prompt 缓存。

## 智能默认值

OpenClaw 对 Anthropic 配置文件自动启用修剪：

| 配置文件类型                                             | 修剪已启用 | 心跳       |
| -------------------------------------------------------- | ---------- | ---------- |
| Anthropic OAuth/token auth（包括 Claude CLI 重用）       | 是         | 1 小时     |
| API key                                                  | 是         | 30 分钟    |

如果你设置了显式值，OpenClaw 不会覆盖它们。

## 启用或禁用

非 Anthropic provider 默认禁用修剪。要启用：

```json5
{
  agents: {
    defaults: {
      contextPruning: { mode: "cache-ttl", ttl: "5m" },
    },
  },
}
```

要禁用：设置 `mode: "off"`。

## 修剪 vs compaction

|            | 修剪               | Compaction          |
| ---------- | ------------------ | ------------------- |
| **功能**   | 修剪 tool results  | 总结对话             |
| **是否保存？** | 否（每次请求）  | 是（在 transcript 中）|
| **范围**   | 仅 tool results    | 整个对话             |

它们相互补充——修剪在 compaction 周期之间保持工具输出精简。

## 延伸阅读

- [Compaction](/concepts/compaction) — 基于总结的 context 减少
- [Gateway Configuration](/gateway/configuration) — 所有修剪配置项（`contextPruning.*`）

## Related

- [Session management](/concepts/session)
- [Session tools](/concepts/session-tool)
- [Context engine](/concepts/context-engine)
