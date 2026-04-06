---
mmh3_hash: "9e76a5d1c60c3a81bd9a6270295a4cc0"
summary: "Message 流程、sessions、queueing 和 reasoning 可见性"
read_when:
  - 解释入站消息如何变成回复
  - 澄清 sessions、queueing 模式或 streaming 行为
  - 记录 reasoning 可见性和 usage 含义
title: "Messages"
---

# Messages

本页面将 OpenClaw 如何处理入站消息、sessions、queueing、streaming 和 reasoning 可见性联系在一起。

## Message 流程(高层次)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (如果运行处于活动状态)
  -> agent run (streaming + tools)
  -> outbound replies (channel 限制 + chunking)
```

关键旋钮位于配置中:
- `messages.*` 用于前缀、queueing 和 group 行为。
- `agents.defaults.*` 用于 block streaming 和 chunking 默认值。
- Channel 覆盖(`channels.whatsapp.*`、`channels.telegram.*` 等)用于 caps 和 streaming 切换。

参见 [Configuration](/gateway/configuration) 了解完整 schema。

## 入站去重

Channels 可以在重新连接后重新传递相同的消息。OpenClaw 保留一个短期缓存,按 channel/account/peer/session/message id 键控,以便重复传递不会触发另一个 agent 运行。

## 入站去抖动

来自 **同一发送者** 的快速连续消息可以通过 `messages.inbound` 批量处理到单个 agent 回合中。去抖动的作用域是每个 channel + conversation,并使用最新消息进行回复线程/IDs。

配置(全局默认 + 每个 channel 覆盖):
```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500
      }
    }
  }
}
```

注意:
- 去抖动适用于 **仅文本** 消息;媒体/附件立即刷新。
- Control commands 绕过去抖动,以便它们保持独立。

## Sessions 和 devices

Sessions 由 gateway 拥有,而不是由 clients 拥有。
- 直接聊天折叠到 agent main session key 中。
- Groups/channels 获得自己的 session keys。
- Session store 和 transcripts 位于 gateway 主机上。

多个 devices/channels 可以映射到同一 session,但历史记录不会完全同步回每个客户端。建议:使用一个主要设备进行长时间对话,以避免发散的 context。Control UI 和 TUI 始终显示 gateway 支持的 session transcript,因此它们是真相的来源。

详细信息:[Session management](/concepts/session)。

## 入站 bodies 和 history context

OpenClaw 将 **prompt body** 与 **command body** 分开:
- `Body`: 发送到 agent 的 prompt 文本。这可能包括 channel envelopes 和可选的 history wrappers。
- `CommandBody`: 用于 directive/command 解析的原始用户文本。
- `RawBody`: `CommandBody` 的传统别名(为兼容性保留)。

当 channel 提供 history 时,它使用共享 wrapper:
- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于 **非直接聊天**(groups/channels/rooms),**当前消息 body** 以发送者标签为前缀(与用于 history 条目的样式相同)。这使实时和排队/history 消息在 agent prompt 中保持一致。

History buffers 是 **仅待处理**:它们包括 *未* 触发运行的 group 消息(例如,mention-gated 消息),并 **排除** 已在 session transcript 中的消息。

Directive 剥离仅适用于 **当前消息** 部分,因此 history 保持完整。包装 history 的 Channels 应将 `CommandBody`(或 `RawBody`)设置为原始消息文本,并将 `Body` 保持为组合 prompt。History buffers 可通过 `messages.groupChat.historyLimit`(全局默认值)和每个 channel 覆盖(如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`)配置(设置 `0` 以禁用)。

## Queueing 和 followups

如果运行已处于活动状态,入站消息可以排队、引导到当前运行中或为 followup 回合收集。

- 通过 `messages.queue`(和 `messages.queue.byChannel`)配置。
- 模式:`interrupt`、`steer`、`followup`、`collect`,加上 backlog 变体。

详细信息:[Queueing](/concepts/queue)。

## Streaming、chunking 和 batching

Block streaming 在 model 生成文本块时发送部分回复。Chunking 尊重 channel 文本限制并避免拆分围栏代码。

关键设置:
- `agents.defaults.blockStreamingDefault` (`on|off`,默认 off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (基于空闲的 batching)
- `agents.defaults.humanDelay` (block 回复之间的类人暂停)
- Channel 覆盖:`*.blockStreaming` 和 `*.blockStreamingCoalesce`(非 Telegram channels 需要显式 `*.blockStreaming: true`)

详细信息:[Streaming + chunking](/concepts/streaming)。

## Reasoning 可见性和 tokens

OpenClaw 可以公开或隐藏 model reasoning:
- `/reasoning on|off|stream` 控制可见性。
- 当 model 生成时,Reasoning 内容仍计入 token usage。
- Telegram 支持 reasoning stream 到草稿气泡中。

详细信息:[Thinking + reasoning directives](/tools/thinking) 和 [Token use](/reference/token-use)。

## 前缀、threading 和 replies

出站消息格式化集中在 `messages` 中:

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`(出站前缀级联),加上 `channels.whatsapp.messagePrefix`(WhatsApp 入站前缀)
- 通过 `replyToMode` 和每个 channel 默认值进行回复 threading

详细信息：[Configuration](/gateway/configuration-reference#messages) 和 channel 文档。

## 相关链接

- [Streaming](/concepts/streaming) — 实时消息传递
- [Retry](/concepts/retry) — 消息传递重试行为
- [Queue](/concepts/queue) — 消息处理队列
- [Channels](/channels) — 消息平台集成
