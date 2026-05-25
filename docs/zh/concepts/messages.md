---
mmh3_hash: "472c74bee5f2c5b095b917c66046cfb9"
summary: "消息流程、Session、queueing 和 reasoning 可见性"
read_when:
  - 解释入站消息如何变成回复
  - 说明 Session、queueing 模式或 streaming 行为
  - 记录 reasoning 可见性和使用影响
title: "Messages"
---

OpenClaw 通过 Session 解析、queueing、streaming、工具执行和 reasoning 可见性组成的管道处理入站消息。本页梳理从入站消息到回复的完整路径。

## 消息流程（高层概述）

```
入站消息
  -> routing/bindings -> session key
  -> queue（如有运行活跃）
  -> agent run（streaming + tools）
  -> 出站回复（channel 限制 + 分块）
```

关键配置旋钮：

- `messages.*`：前缀、queueing 和群组行为。
- `agents.defaults.*`：block streaming 和分块默认值。
- Channel 覆盖（`channels.whatsapp.*`、`channels.telegram.*` 等）：上限和 streaming 开关。

完整 schema 见 [Configuration](/gateway/configuration)。

## 入站去重

Channel 在重连后可能重发相同消息。OpenClaw 维护一个以 channel/account/peer/session/message id 为键的短期缓存，防止重复投递触发新的 agent 运行。

## 入站防抖

来自**同一发件人**的连续快速消息可通过 `messages.inbound` 合并为单个 agent 轮次。防抖作用范围为每个 channel + 对话，并使用最新消息作为回复线程/ID。

配置（全局默认 + 按 channel 覆盖）：

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

注意事项：

- 防抖仅适用于**纯文本**消息；媒体/附件立即触发。
- 控制命令绕过防抖，保持独立。对同一发件人的 DM 合并明确选择加入的 channel，可将 DM 命令保留在防抖窗口内，使拆分发送的载荷能加入同一 agent 轮次。

## Session 与设备

Session 归 Gateway 所有，而非客户端。

- 私信折叠到 agent 主 Session 键。
- 群组/Channel 拥有各自的 Session 键。
- Session 存储和记录位于 Gateway 主机上。

多个设备/channel 可映射到同一 Session，但历史记录不会完全同步回每个客户端。建议：长对话使用一个主设备以避免上下文分叉。Control UI 和 TUI 始终显示 Gateway 端 Session 记录，是真相来源。

详情见 [Session 管理](/concepts/session)。

## 工具结果元数据

工具结果 `content` 是模型可见的结果。工具结果 `details` 是用于 UI 渲染、诊断、媒体投递和 Plugin 的运行时元数据。

OpenClaw 明确保持这一边界：

- `toolResult.details` 在 provider 回放和压缩输入之前被剥除。
- 持久化的 Session 记录仅保留有界 `details`；超大元数据被替换为标有 `persistedDetailsTruncated: true` 的紧凑摘要。
- Plugin 和工具应将模型必须读取的文本放入 `content`，而不仅仅放在 `details` 中。

## 入站主体和历史上下文

OpenClaw 将**提示主体**与**命令主体**分开：

- `BodyForAgent`：当前消息面向模型的主要文本。Channel Plugin 应将其聚焦于发件人当前携带提示的文本。
- `Body`：传统提示回退。可能包含 channel 信封和可选历史封装，但当 `BodyForAgent` 可用时，当前 channel 不应将其作为主要模型输入。
- `CommandBody`：用于指令/命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的传统别名（保留以兼容）。

当 channel 提供历史时，使用共享封装：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于**非私信聊天**（群组/Channel/房间），**当前消息主体**以发件人标签为前缀（与历史条目使用相同格式）。这使实时消息和已排队/历史消息在 agent 提示中保持一致。

历史缓冲区是**待处理的**：包含未触发运行的群组消息（例如需要 @提及的消息），**不包括**已在 Session 记录中的消息。

指令剥除仅适用于**当前消息**部分，因此历史保持完整。封装历史的 channel 应将 `CommandBody`（或 `RawBody`）设置为原始消息文本，并将 `Body` 保留为组合提示。结构化历史、回复、转发和 channel 元数据在提示组装期间被渲染为用户角色的不可信上下文块。

历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认）和按 channel 覆盖（如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`，设为 `0` 可禁用）进行配置。

## Queueing 和后续

如果某个运行已活跃，入站消息可以排队、引导到当前运行，或收集以用于后续轮次。

- 通过 `messages.queue`（及 `messages.queue.byChannel`）配置。
- 默认模式为 `steer`，steering 回退到排队后续投递时，500ms 后续防抖。
- 模式：`steer`、`followup`、`collect` 和 `interrupt`。

详情见 [Command queue](/concepts/queue) 和 [Steering queue](/concepts/queue-steering)。

## Channel 运行所有权

Channel Plugin 可以在消息进入 Session 队列之前保留顺序、防抖输入并施加传输背压。它们不应对 agent 轮次本身施加单独的超时。一旦消息被路由到 Session，长时间运行的工作由 Session、工具和运行时生命周期管理，以便所有 channel 都能一致地报告和恢复缓慢的轮次。

## Streaming、分块和批处理

Block streaming 在模型生成文本块时发送部分回复。分块遵守 channel 文本限制，避免分割围栏代码。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认关闭）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲的批处理）
- `agents.defaults.humanDelay`（block 回复之间类人停顿）
- Channel 覆盖：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram channel 需明确设置 `*.blockStreaming: true`）

详情见 [Streaming + chunking](/concepts/streaming)。

## Reasoning 可见性与 token

OpenClaw 可以显示或隐藏模型 reasoning：

- `/reasoning on|off|stream` 控制可见性。
- Reasoning 内容在模型生成时仍计入 token 用量。
- Telegram 支持将 reasoning 流式写入临时草稿气泡（最终投递后删除）；使用 `/reasoning on` 可获得持久 reasoning 输出。

详情见 [Thinking + reasoning 指令](/tools/thinking) 和 [Token 使用](/reference/token-use)。

## 前缀、线程和回复

出站消息格式在 `messages` 中集中管理：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），以及 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 和按 channel 默认值实现回复线程

详情见 [Configuration](/gateway/config-agents#messages) 和 channel 文档。

## 静默回复

精确的静默 token `NO_REPLY` / `no_reply` 表示"不投递用户可见的回复"。当某个轮次还有待处理的工具媒体（如生成的 TTS 音频）时，OpenClaw 剥除静默文本但仍然投递媒体附件。

OpenClaw 按对话类型解析该行为：

- 私信对话从不收到 `NO_REPLY` 提示指导。如果私信运行意外返回裸静默 token，OpenClaw 抑制它而不是改写或投递。
- 群组/Channel 默认只为自动群组回复允许静默。在 `message_tool` 可见回复模式下，静默意味着模型不调用 `message(action=send)`。
- 内部编排默认允许静默。

OpenClaw 也对非私信聊天中在任何 assistant 回复之前发生的内部运行器故障使用静默回复，以防群组/Channel 看到 Gateway 错误样板文本。私信显示紧凑的失败提示；仅当 `/verbose` 为 `on` 或 `full` 时才显示原始运行器详情。

默认值在 `agents.defaults.silentReply` 下；`surfaces.<id>.silentReply` 可按表面覆盖群组/内部策略。

裸静默回复在所有表面上都会被丢弃，让父 Session 保持静默，而不是将哨兵文本改写为回退消息。

## 相关

- [消息生命周期重构](/concepts/message-lifecycle-refactor) - 目标持久发送和接收设计
- [Streaming](/concepts/streaming) — 实时消息投递
- [Retry](/concepts/retry) — 消息投递重试行为
- [Queue](/concepts/queue) — 消息处理队列
- [Channels](/channels) — 消息平台集成
