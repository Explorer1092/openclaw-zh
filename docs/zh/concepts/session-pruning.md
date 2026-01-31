---
title: "会话修剪"
sidebarTitle: "会话修剪"
mmh3_hash: "f699150e26132c0100ebf771d59d090e"
summary: "Session pruning: tool-result 修剪以减少 context 膨胀"
read_when: ["你想减少来自 tool 输出的 LLM context 增长","你正在调整 agents.defaults.contextPruning"]
---
# 会话修剪

Session pruning 在每次 LLM 调用之前从内存中的 context 中修剪 **旧的 tool results**。它 **不** 重写磁盘上的 session 历史记录(`*.jsonl`)。

## 何时运行
- 当 `mode: "cache-ttl"` 启用且该 session 的最后一次 Anthropic 调用早于 `ttl` 时。
- 仅影响为该请求发送到 model 的消息。
 - 仅对 Anthropic API 调用(和 OpenRouter Anthropic models)有效。
 - 为获得最佳结果,将 `ttl` 与你的 model `cacheControlTtl` 匹配。
 - 修剪后,TTL 窗口重置,因此后续请求保持缓存,直到 `ttl` 再次过期。

## 智能默认值(Anthropic)
- **OAuth 或 setup-token** profiles: 启用 `cache-ttl` pruning 并将 heartbeat 设置为 `1h`。
- **API key** profiles: 启用 `cache-ttl` pruning,将 heartbeat 设置为 `30m`,并在 Anthropic models 上将默认 `cacheControlTtl` 设置为 `1h`。
- 如果你明确设置任何这些值,OpenClaw **不会** 覆盖它们。

## 这改善了什么(成本 + cache 行为)
- **为什么修剪:** Anthropic prompt caching 仅在 TTL 内适用。如果 session 空闲超过 TTL,下一个请求会重新缓存完整 prompt,除非你先修剪它。
- **什么变得更便宜:** 修剪减少了 TTL 过期后第一个请求的 **cacheWrite** 大小。
- **为什么 TTL 重置很重要:** 一旦修剪运行,缓存窗口重置,因此后续请求可以重用新缓存的 prompt,而不是再次重新缓存完整历史记录。
- **它不做什么:** 修剪不会添加 tokens 或"双倍"成本;它只改变在该第一个 TTL 后请求上缓存的内容。

## 可以修剪什么
- 仅 `toolResult` 消息。
- User + assistant 消息 **永远不会** 修改。
- 保护最后 `keepLastAssistants` assistant 消息;该截止点之后的 tool results 不会被修剪。
- 如果没有足够的 assistant 消息来建立截止点,则跳过修剪。
- 包含 **image blocks** 的 Tool results 被跳过(永远不会修剪/清除)。

## Context window 估算
Pruning 使用估计的 context window (chars ≈ tokens × 4)。窗口大小按以下顺序解析:
1) Model 定义 `contextWindow`(来自 model registry)。
2) `models.providers.*.models[].contextWindow` 覆盖。
3) `agents.defaults.contextTokens`。
4) 默认 `200000` tokens。

## 模式
### cache-ttl
- 仅当最后一次 Anthropic 调用早于 `ttl`(默认 `5m`)时才运行 Pruning。
- 运行时:与以前相同的 soft-trim + hard-clear 行为。

## Soft vs hard pruning
- **Soft-trim**: 仅用于过大的 tool results。
  - 保留头 + 尾,插入 `...`,并附加带有原始大小的注释。
  - 跳过带有 image blocks 的结果。
- **Hard-clear**: 用 `hardClear.placeholder` 替换整个 tool result。

## Tool 选择
- `tools.allow` / `tools.deny` 支持 `*` 通配符。
- Deny 获胜。
- 匹配不区分大小写。
- 空 allow 列表 => 允许所有 tools。

## 与其他限制的交互
- 内置 tools 已经截断了它们自己的输出;session pruning 是一个额外的层,可以防止长时间运行的聊天在 model context 中累积过多的 tool 输出。
- Compaction 是分开的:compaction 总结并持久化,pruning 是每个请求的瞬态。参见 [/concepts/compaction](/zh/concepts/compaction)。

## 默认值(启用时)
- `ttl`: `"5m"`
- `keepLastAssistants`: `3`
- `softTrimRatio`: `0.3`
- `hardClearRatio`: `0.5`
- `minPrunableToolChars`: `50000`
- `softTrim`: `{ maxChars: 4000, headChars: 1500, tailChars: 1500 }`
- `hardClear`: `{ enabled: true, placeholder: "[Old tool result content cleared]" }`

## 示例
默认(关闭):
```json5
{
  agent: {
    contextPruning: { mode: "off" }
  }
}
```

启用 TTL 感知 pruning:
```json5
{
  agent: {
    contextPruning: { mode: "cache-ttl", ttl: "5m" }
  }
}
```

将 pruning 限制为特定 tools:
```json5
{
  agent: {
    contextPruning: {
      mode: "cache-ttl",
      tools: { allow: ["exec", "read"], deny: ["*image*"] }
    }
  }
}
```

参见配置参考:[Gateway Configuration](/zh/gateway/configuration)
