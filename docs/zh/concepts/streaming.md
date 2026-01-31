---
title: "流式与分片"
sidebarTitle: "流式与分片"
mmh3_hash: "52b179bd13b5e61c109e925df097d1ab"
summary: "Streaming + chunking 行为(block 回复、draft streaming、限制)"
read_when:
  - 解释 streaming 或 chunking 在 channels 上如何工作
  - 更改 block streaming 或 channel chunking 行为
  - 调试重复/早期 block 回复或 draft streaming
---
# 流式与分片

OpenClaw 有两个单独的"streaming"层:
- **Block streaming (channels):** 当 assistant 写入时发出完成的 **blocks**。这些是正常的 channel 消息(不是 token deltas)。
- **Token-ish streaming (仅 Telegram):** 在生成时用部分文本更新 **draft bubble**;最终消息在结束时发送。

今天 **没有真正的 token streaming** 到外部 channel 消息。Telegram draft streaming 是唯一的部分流表面。

## Block streaming (channel 消息)

Block streaming 在可用时以粗块发送 assistant 输出。

```
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```
图例:
- `text_delta/events`: model 流事件(对于非 streaming models 可能稀疏)。
- `chunker`: `EmbeddedBlockChunker` 应用 min/max 界限 + 中断偏好。
- `channel send`: 实际出站消息(block 回复)。

**控制:**
- `agents.defaults.blockStreamingDefault`: `"on"`/`"off"` (默认 off)。
- Channel 覆盖:`*.blockStreaming` (和每个账户变体)以按 channel 强制 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`: `"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`: `{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`: `{ minChars?, maxChars?, idleMs? }` (在发送前合并流式块)。
- Channel 硬上限:`*.textChunkLimit` (例如,`channels.whatsapp.textChunkLimit`)。
- Channel chunk 模式:`*.chunkMode` (`length` 默认,`newline` 在长度分块之前在空行(段落边界)上拆分)。
- Discord 软上限:`channels.discord.maxLinesPerMessage` (默认 17)拆分高回复以避免 UI 剪切。

**边界语义:**
- `text_end`: 一旦 chunker 发出就流式传输块;在每个 `text_end` 上刷新。
- `message_end`: 等到 assistant 消息完成,然后刷新缓冲的输出。

如果缓冲的文本超过 `maxChars`,`message_end` 仍使用 chunker,因此它可以在结束时发出多个块。

## Chunking 算法(低/高界限)

Block chunking 由 `EmbeddedBlockChunker` 实现:
- **低界限:** 在 buffer >= `minChars` 之前不发出(除非强制)。
- **高界限:** 在 `maxChars` 之前首选拆分;如果强制,在 `maxChars` 拆分。
- **中断偏好:** `paragraph` → `newline` → `sentence` → `whitespace` → 硬中断。
- **代码围栏:** 永远不要在围栏内拆分;在 `maxChars` 强制时,关闭 + 重新打开围栏以保持 Markdown 有效。

`maxChars` 被钳位到 channel `textChunkLimit`,因此你不能超过每个 channel 的上限。

## Coalescing (合并流式块)

启用 block streaming 时,OpenClaw 可以在发送之前 **合并连续的 block chunks**。这减少了"单行垃圾信息",同时仍提供渐进式输出。

- Coalescing 在刷新之前等待 **空闲间隙** (`idleMs`)。
- 缓冲区由 `maxChars` 限制,如果超过它将刷新。
- `minChars` 防止微小片段发送,直到累积足够的文本(最终刷新始终发送剩余文本)。
- Joiner 从 `blockStreamingChunk.breakPreference` 派生(`paragraph` → `\n\n`, `newline` → `\n`, `sentence` → space)。
- Channel 覆盖可通过 `*.blockStreamingCoalesce` 获得(包括每个账户配置)。
- Signal/Slack/Discord 的默认 coalesce `minChars` 增加到 1500,除非覆盖。

## Blocks 之间的类人节奏

启用 block streaming 时,你可以在 block 回复之间添加 **随机暂停**(在第一个 block 之后)。这使多气泡响应感觉更自然。

- 配置:`agents.defaults.humanDelay` (通过 `agents.list[].humanDelay` 按 agent 覆盖)。
- 模式:`off` (默认)、`natural` (800–2500ms)、`custom` (`minMs`/`maxMs`)。
- 仅适用于 **block 回复**,不适用于最终回复或 tool 摘要。

## "Stream chunks 或 everything"

这映射到:
- **Stream chunks:** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"` (在你前进时发出)。非 Telegram channels 还需要 `*.blockStreaming: true`。
- **在结束时 Stream everything:** `blockStreamingBreak: "message_end"` (刷新一次,如果很长可能是多个块)。
- **无 block streaming:** `blockStreamingDefault: "off"` (仅最终回复)。

**Channel 注意:** 对于非 Telegram channels,block streaming **关闭,除非** `*.blockStreaming` 明确设置为 `true`。Telegram 可以 stream drafts (`channels.telegram.streamMode`) 而无需 block 回复。

配置位置提醒:`blockStreaming*` 默认值位于 `agents.defaults` 下,而不是根配置。

## Telegram draft streaming (token-ish)

Telegram 是唯一具有 draft streaming 的 channel:
- 在 **带有 topics 的私人聊天** 中使用 Bot API `sendMessageDraft`。
- `channels.telegram.streamMode: "partial" | "block" | "off"`。
  - `partial`: draft 使用最新流文本更新。
  - `block`: draft 在分块块中更新(相同的 chunker 规则)。
  - `off`: 无 draft streaming。
- Draft chunk 配置(仅用于 `streamMode: "block"`):`channels.telegram.draftChunk` (默认值:`minChars: 200`, `maxChars: 800`)。
- Draft streaming 与 block streaming 分开;block 回复默认关闭,仅由非 Telegram channels 上的 `*.blockStreaming: true` 启用。
- 最终回复仍是正常消息。
- `/reasoning stream` 将 reasoning 写入 draft bubble (仅 Telegram)。

当 draft streaming 处于活动状态时,OpenClaw 禁用该回复的 block streaming 以避免双重 streaming。

```
Telegram (private + topics)
  └─ sendMessageDraft (draft bubble)
       ├─ streamMode=partial → update latest text
       └─ streamMode=block   → chunker updates draft
  └─ final reply → normal message
```
图例:
- `sendMessageDraft`: Telegram draft bubble (不是真正的消息)。
- `final reply`: 正常 Telegram 消息发送。
