---
title: "Streaming and chunking"
mmh3_hash: "a2be1509c2de2e9f097f46ec5f2f746f"
summary: "Streaming + chunking 行为（block 回复、channel 预览 streaming、模式映射）"
read_when:
  - 解释 streaming 或 chunking 在 channel 上的工作方式
  - 更改 block streaming 或 channel chunking 行为
  - 调试重复/提前的 block 回复或 channel 预览 streaming
---

OpenClaw 有两个独立的 streaming 层：

- **Block streaming（channel）：** 在 assistant 写作时发出已完成的 **block**。这些是普通的 channel 消息（不是 token 增量）。
- **预览 streaming（Telegram/Discord/Slack）：** 在生成过程中更新临时**预览消息**。

目前对 channel 消息**没有真正的 token 增量 streaming**。预览 streaming 基于消息（发送 + 编辑/追加）。

## Block streaming（channel 消息）

Block streaming 在输出可用时以粗粒度块发送 assistant 输出。

```
Model 输出
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker 在缓冲区增长时发出 block
       └─ (blockStreamingBreak=message_end)
            └─ chunker 在 message_end 时刷新
                   └─ channel 发送（block 回复）
```

图例：

- `text_delta/events`：model stream 事件（非 streaming model 可能稀疏）。
- `chunker`：应用最小/最大边界 + 断行偏好的 `EmbeddedBlockChunker`。
- `channel send`：实际的出站消息（block 回复）。

**控制项：**

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认关闭）。
- Channel 覆盖：`*.blockStreaming`（以及 per-account 变体）强制每个 channel 为 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（在发送前合并 streaming 块）。
- Channel 硬限制：`*.textChunkLimit`（如 `channels.whatsapp.textChunkLimit`）。
- Channel 分块模式：`*.chunkMode`（`length` 默认，`newline` 在长度分块之前按空行（段落边界）分割）。
- Discord 软限制：`channels.discord.maxLinesPerMessage`（默认 17）将高度较大的回复分割以避免 UI 裁剪。

**边界语义：**

- `text_end`：chunker 发出时立即 stream block；在每个 `text_end` 时刷新。
- `message_end`：等待 assistant 消息完成，然后刷新缓冲的输出。

如果缓冲文本超过 `maxChars`，`message_end` 仍使用 chunker，因此可以在最后发出多个块。

### 带 block streaming 的媒体投递

`MEDIA:` 指令是普通的投递元数据。当 block streaming 提前发送媒体块时，OpenClaw 记住该轮次的投递。如果最终 assistant 载荷重复相同的媒体 URL，最终投递会剥除重复的媒体而不是再次发送附件。

完全重复的最终载荷会被抑制。如果最终载荷在已 streaming 的媒体周围添加了不同的文本，OpenClaw 仍发送新文本同时保持媒体单次投递。这防止在 Telegram 等 channel 上出现重复的语音笔记或文件，当 agent 在 streaming 过程中发出 `MEDIA:` 且 provider 也在已完成的回复中包含它时。

## Chunking 算法（低/高边界）

Block chunking 由 `EmbeddedBlockChunker` 实现：

- **低边界：** 缓冲区 >= `minChars` 之前不发出（除非强制）。
- **高边界：** 优先在 `maxChars` 之前分割；如果强制，在 `maxChars` 处分割。
- **断行偏好：** `paragraph` → `newline` → `sentence` → `whitespace` → 硬断行。
- **代码围栏：** 永不在围栏内分割；当在 `maxChars` 处强制时，关闭 + 重新打开围栏以保持 Markdown 有效。

`maxChars` 被限制在 channel `textChunkLimit` 内，因此不能超过 per-channel 上限。

## 合并（合并 streaming block）

启用 block streaming 时，OpenClaw 可以在发送前**合并连续的 block 块**。这减少了"单行刷屏"，同时仍提供渐进式输出。

- 合并等待**空闲间隔**（`idleMs`）后再刷新。
- 缓冲区受 `maxChars` 限制，超过时会刷新。
- `minChars` 防止微小片段发送，直到积累足够多的文本（最终刷新始终发送剩余文本）。
- Joiner 从 `blockStreamingChunk.breakPreference` 派生（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- Channel 覆盖可通过 `*.blockStreamingCoalesce` 获得（包括 per-account 配置）。
- 默认合并 `minChars` 对 Signal/Slack/Discord 提升到 1500，除非被覆盖。

## block 间的类人节奏

启用 block streaming 时，可以在 block 回复之间添加**随机化暂停**（在第一个 block 之后）。这让多气泡响应感觉更自然。

- 配置：`agents.defaults.humanDelay`（通过 `agents.list[].humanDelay` 按 agent 覆盖）。
- 模式：`off`（默认）、`natural`（800-2500ms）、`custom`（`minMs`/`maxMs`）。
- 仅适用于 **block 回复**，不适用于最终回复或工具摘要。

## "Stream 块或所有内容"

这对应于：

- **Stream 块：** `blockStreamingDefault: "on"` + `blockStreamingBreak: "text_end"`（随写随发）。非 Telegram channel 还需要 `*.blockStreaming: true`。
- **最后 Stream 所有内容：** `blockStreamingBreak: "message_end"`（一次性刷新，如果很长可能是多个块）。
- **无 block streaming：** `blockStreamingDefault: "off"`（仅最终回复）。

**Channel 注意：** Block streaming **默认关闭**，除非 `*.blockStreaming` 明确设置为 `true`。Channel 可以流式传输实时预览（`channels.<channel>.streaming`）而不使用 block 回复。

配置位置提示：`blockStreaming*` 默认值位于 `agents.defaults` 下，而非根配置。

## 预览 streaming 模式

规范键：`channels.<channel>.streaming`

模式：

- `off`：禁用预览 streaming。
- `partial`：替换为最新文本的单个预览。
- `block`：以分块/追加步骤更新预览。
- `progress`：生成期间的进度/状态预览，完成时显示最终答案。

`streaming.mode: "block"` 是用于可编辑 channel（如 Discord 和 Telegram）的预览 streaming 模式。它不会在那里启用 channel block 投递。当需要普通的 block 回复时，使用 `streaming.block.enabled` 或传统的 `blockStreaming` channel 键。Microsoft Teams 是例外：它没有草稿预览 block 传输，因此 `streaming.mode: "block"` 映射到 Teams block 投递，而不是原生的 partial/progress streaming。

### Channel 映射

| Channel | `off` | `partial` | `block` | `progress` |
| --- | --- | --- | --- | --- |
| Telegram | ✅ | ✅ | ✅ | 可编辑进度草稿 |
| Discord | ✅ | ✅ | ✅ | 可编辑进度草稿 |
| Slack | ✅ | ✅ | ✅ | ✅ |
| Mattermost | ✅ | ✅ | ✅ | ✅ |
| MS Teams | ✅ | ✅ | ✅ | 原生进度 stream |

仅 Slack：

- `channels.slack.streaming.nativeTransport` 在 `channels.slack.streaming.mode="partial"` 时切换 Slack 原生 streaming API 调用（默认：`true`）。
- Slack 原生 streaming 和 Slack assistant thread 状态需要回复 thread 目标。顶级 DM 不显示 thread 风格预览，但仍可使用 Slack 草稿预览帖子和编辑。

传统键迁移：

- Telegram：传统 `streamMode` 和标量/布尔值 `streaming` 值被 doctor/config 兼容性路径检测并迁移到 `streaming.mode`。
- Discord：`streamMode` + 布尔值 `streaming` 仍是 `streaming` 枚举的运行时别名；运行 `openclaw doctor --fix` 以重写持久化配置。
- Slack：`streamMode` 仍是 `streaming.mode` 的运行时别名；布尔值 `streaming` 仍是 `streaming.mode` 加 `streaming.nativeTransport` 的运行时别名；传统 `nativeStreaming` 仍是 `streaming.nativeTransport` 的运行时别名。运行 `openclaw doctor --fix` 以重写持久化配置。

### 运行时行为

Telegram：

- 在 DM 和群组/话题中使用 `sendMessage` + `editMessageText` 预览更新。
- 最终文本就地编辑活跃预览；长最终回复将该消息复用为第一个块并仅发送剩余块。
- `progress` 模式在可编辑状态草稿中保留工具进度，完成时清除该草稿，并通过正常投递发送最终答案。
- 如果在确认已完成文本之前最终编辑失败，OpenClaw 使用正常的最终投递并清理过时的预览。
- 当 Telegram block streaming 明确启用时，预览 streaming 会被跳过（以避免双重 streaming）。
- `/reasoning stream` 可以将推理写入一个在最终投递后删除的临时预览。

Discord：

- 使用发送 + 编辑预览消息。
- `block` 模式使用草稿分块（`draftChunk`）。
- 当 Discord block streaming 明确启用时，预览 streaming 会被跳过。
- 最终媒体、错误和明确回复载荷在不刷新新草稿的情况下取消待处理的预览，然后使用正常投递。

Slack：

- `partial` 在可用时可以使用 Slack 原生 streaming（`chat.startStream`/`append`/`stop`）。
- `block` 使用追加风格的草稿预览。
- `progress` 使用状态预览文本，然后是最终答案。
- 没有回复 thread 的顶级 DM 使用草稿预览帖子和编辑，而不是 Slack 原生 streaming。
- 原生和草稿预览 streaming 会抑制该轮次的 block 回复，因此 Slack 回复仅通过一个投递路径 streaming。
- 最终媒体/错误载荷和进度最终回复不创建一次性草稿消息；只有可以编辑预览的文本/block 最终回复才刷新待处理的草稿文本。

Mattermost：

- 将思考、工具活动和部分回复文本 streaming 到单个草稿预览帖子中，在最终答案可安全发送时就地完成。
- 如果预览帖子被删除或在最终确定时不可用，则回退到发送新的最终帖子。
- 最终媒体/错误载荷在正常投递之前取消待处理的预览更新，而不是刷新临时预览帖子。

Matrix：

- 当最终文本可以复用预览事件时，草稿预览就地完成。
- 仅媒体、错误和回复目标不匹配的最终回复在正常投递之前取消待处理的预览更新；已可见的过时预览会被撤销。

### 工具进度预览更新

预览 streaming 还可以包含**工具进度**更新——短状态行，如"正在搜索网络"、"正在读取文件"或"正在调用工具"——这些出现在同一预览消息中，工具运行时，在最终回复之前。在 Codex app-server 模式下，Codex 前言/评注消息使用相同的预览路径，因此简短的"我正在检查..."进度说明可以 streaming 到可编辑草稿中而不成为最终答案的一部分。这让多步骤工具轮次在第一次思考预览和最终答案之间保持视觉活跃而不是静默的。

支持的界面：

- **Discord**、**Slack**、**Telegram** 和 **Matrix** 在预览 streaming 活跃时默认将工具进度 streaming 到实时预览编辑中。Microsoft Teams 在个人聊天中使用其原生进度 stream。
- Telegram 自 `v2026.4.22` 起就已启用工具进度预览更新；保持启用可保留该已发布的行为。
- **Mattermost** 已将工具活动折入其单一草稿预览帖子（见上文）。
- 工具进度编辑遵循活跃的预览 streaming 模式；当预览 streaming 为 `off` 或 block streaming 已接管消息时，它们会被跳过。在 Telegram 上，`streaming.mode: "off"` 是仅最终回复模式：通用进度信息也会被抑制而不是作为独立状态消息投递，而审批提示、媒体载荷和错误仍正常路由。
- 要保留预览 streaming 但隐藏工具进度行，对该 channel 将 `streaming.preview.toolProgress` 设为 `false`。要保留工具进度行可见同时隐藏命令/exec 文本，将 `streaming.preview.commandText` 设为 `"status"` 或 `streaming.progress.commandText` 设为 `"status"`；默认为 `"raw"` 以保留已发布的行为。此策略由使用 OpenClaw 紧凑进度渲染器的草稿/进度 channel 共享，包括 Discord、Matrix、Microsoft Teams、Mattermost、Slack 草稿预览和 Telegram。要完全禁用预览编辑，将 `streaming.mode` 设为 `off`。
- Telegram 选定引用回复是一个例外：当 `replyToMode` 不是 `"off"` 且存在选定引用文本时，OpenClaw 会跳过该轮次的答案预览 stream，以避免工具进度预览行被渲染。没有选定引用文本的当前消息回复仍保留预览 streaming。详情参见 [Telegram channel 文档](/channels/telegram)。

保持进度行可见但隐藏原始命令/exec 文本：

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "partial",
        "preview": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

在其他紧凑进度 channel 键下使用相同形状，例如 `channels.discord`、`channels.matrix`、`channels.msteams`、`channels.mattermost` 或 Slack 草稿预览。对于进度草稿模式，将相同 policy 放在 `streaming.progress` 下：

```json
{
  "channels": {
    "telegram": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

## 相关

- [Message lifecycle refactor](/concepts/message-lifecycle-refactor) - 目标共享预览、编辑、stream 和最终确定设计
- [Progress drafts](/concepts/progress-drafts) - 在长轮次期间更新的可见进行中消息
- [Messages](/concepts/messages) - 消息生命周期和投递
- [Retry](/concepts/retry) - 投递失败时的重试行为
- [Channels](/channels) - per-channel streaming 支持
