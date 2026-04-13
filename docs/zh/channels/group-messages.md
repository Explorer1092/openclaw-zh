---
mmh3_hash: "e35833f4f0e8e6aa12a0b2103be34293"
summary: "WhatsApp 群组消息处理的行为和配置（mentionPatterns 在各界面间共享）"
read_when:
  - 更改群组消息规则或提及
title: "群组消息"
---

# 群组消息（WhatsApp web Channel）

目标：让 OpenClaw 坐在 WhatsApp 群组中，只在被 ping 时唤醒，并将该线程与个人私信会话分开。

注意：`agents.list[].groupChat.mentionPatterns` 现在也被 Telegram/Discord/Slack/iMessage 使用；本文档聚焦于 WhatsApp 特定行为。对于多 agent 设置，请按 agent 设置 `agents.list[].groupChat.mentionPatterns`（或使用 `messages.groupChat.mentionPatterns` 作为全局回退）。

## 已实现内容（2025-12-03）

- 激活模式：`mention`（默认）或 `always`。`mention` 需要 ping（通过 `mentionedJids` 的真实 WhatsApp @提及、安全的正则表达式模式，或文本中任意位置的 bot E.164 号码）。`always` 在每条消息上唤醒 agent，但只有在能添加有意义价值时才回复；否则返回静默 token `NO_REPLY`。默认值可在配置中设置（`channels.whatsapp.groups`），并可通过 `/activation` 按群组覆盖。设置 `channels.whatsapp.groups` 时，它也充当群组 allowlist（包含 `"*"` 以允许所有群组）。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退：显式的 `channels.whatsapp.allowFrom`）。默认为 `allowlist`（添加发送者之前被阻止）。
- 每群组会话：会话键格式为 `agent:<agentId>:whatsapp:group:<jid>`，因此 `/verbose on`、`/trace on` 或 `/think high` 等命令（作为独立消息发送）的作用域限于该群组；个人私信状态不受影响。群组线程跳过心跳。
- 上下文注入：**仅待处理的**群组消息（默认 50 条）——那些_没有_触发运行的消息——以 `[Chat messages since your last reply - for context]` 为前缀，触发行在 `[Current message - respond to this]` 下。已在会话中的消息不会重新注入。
- 发送者显示：每个群组批次现在以 `[from: Sender Name (+E164)]` 结尾，让 agent 知道谁在发言。
- 临时/仅查看一次：在提取文本/提及之前解包这些消息，因此其中的 ping 仍会触发。
- 群组系统提示：在群组会话的第一轮（以及每次 `/activation` 更改模式时），向系统提示注入简短说明，如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.`。如果元数据不可用，仍会告知 agent 这是群聊。

## 配置示例（WhatsApp）

在 `~/.openclaw/openclaw.json` 中添加 `groupChat` 块，以便即使 WhatsApp 在文本正文中去掉可见的 `@` 时，显示名称 ping 也能工作：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

注意：

- 正则表达式不区分大小写，并使用与其他配置正则表达式界面相同的安全正则表达式保护；无效模式和不安全的嵌套重复会被忽略。
- 当有人点击联系人时，WhatsApp 仍会通过 `mentionedJids` 发送规范提及，因此号码回退很少需要，但作为安全网很有用。

### 激活命令（仅所有者）

使用群聊命令：

- `/activation mention`
- `/activation always`

只有所有者号码（来自 `channels.whatsapp.allowFrom`，未设置时使用 bot 自身的 E.164）可以更改此项。在群组中作为独立消息发送 `/status` 可查看当前激活模式。

## 使用方式

1. 将您的 WhatsApp 账户（运行 OpenClaw 的那个）添加到群组。
2. 说 `@openclaw …`（或包含号码）。除非设置 `groupPolicy: "open"`，否则只有在 allowlist 中的发送者才能触发它。
3. Agent 提示将包含最近的群组上下文以及末尾的 `[from: …]` 标记，以便它能向正确的人回复。
4. 会话级指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）仅适用于该群组的会话；将它们作为独立消息发送以使其生效。您的个人私信会话保持独立。

## 测试/验证

- 手动冒烟测试：
  - 在群组中发送 `@openclaw` ping 并确认回复引用了发送者名称。
  - 发送第二次 ping 并验证历史块已包含，然后在下一轮时清除。
- 检查 Gateway 日志（以 `--verbose` 运行）以查看 `inbound web message` 条目，显示 `from: <groupJid>` 和 `[from: …]` 后缀。

## 已知注意事项

- 心跳对群组故意跳过，以避免嘈杂的广播。
- 回声抑制使用合并的批次字符串；如果您连续发送两次相同文本而没有提及，只有第一次会得到响应。
- 会话存储条目将在会话存储中显示为 `agent:<agentId>:whatsapp:group:<jid>`（默认 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；缺少条目只意味着群组尚未触发运行。
- 群组中的输入状态指示遵循 `agents.defaults.typingMode`（默认：未提及时为 `message`）。
