---
mmh3_hash: "45cd2527cf3874e0a492d8f3cccc881a"
summary: "WhatsApp 群组消息处理的行为和配置（mentionPatterns 在各界面间共享）"
read_when:
  - 更改群组消息规则或提及
title: "群组消息"
---

# 群组消息（WhatsApp Web Channel）

目标：让 Clawd 待在 WhatsApp 群组中，仅在被 ping 时唤醒，并将该线程与个人 DM 会话分开。

注意：`agents.list[].groupChat.mentionPatterns` 现在也被 Telegram/Discord/Slack/iMessage 使用；本文档专注于 WhatsApp 特定的行为。对于多 Agent 设置，为每个 Agent 设置 `agents.list[].groupChat.mentionPatterns`（或使用 `messages.groupChat.mentionPatterns` 作为全局回退）。

## 已实现的内容（2025-12-03）

- 激活模式：`mention`（默认）或 `always`。`mention` 需要 ping（通过 `mentionedJids` 的真实 WhatsApp @提及、正则表达式模式或文本中任何地方的机器人 E.164）。`always` 在每条消息上唤醒 Agent，但它应仅在可以增加有意义的价值时回复；否则返回静默令牌 `NO_REPLY`。可以在配置（`channels.whatsapp.groups`）中设置默认值，并通过 `/activation` 按群组覆盖。当设置 `channels.whatsapp.groups` 时，它也充当群组白名单（包含 `"*"` 以允许全部）。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退：显式 `channels.whatsapp.allowFrom`）。默认值为 `allowlist`（被阻止，直到您添加发送者）。
- 每个群组的会话：会话键看起来像 `agent:<agentId>:whatsapp:group:<jid>`，因此诸如 `/verbose on` 或 `/think high`（作为独立消息发送）之类的命令作用于该群组；个人 DM 状态不受影响。群组线程跳过 Heartbeats。
- 上下文注入：**仅待处理**的群组消息（默认 50 条）_未_触发运行的消息在 `[Chat messages since your last reply - for context]` 下前缀，触发行在 `[Current message - respond to this]` 下。已在会话中的消息不会重新注入。
- 发送者显示：现在每个群组批次以 `[from: Sender Name (+E164)]` 结束，以便 Pi 知道是谁在说话。
- 短暂/仅查看一次：我们在提取文本/提及之前解包这些内容，因此其中的 ping 仍会触发。
- 群组系统提示：在群组会话的第一轮（以及每当 `/activation` 更改模式时），我们将一个简短的说明注入系统提示，如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 如果元数据不可用，我们仍会告诉 Agent 这是群聊。

## 配置示例（WhatsApp）

向 `~/.openclaw/openclaw.json` 添加 `groupChat` 块，以便即使 WhatsApp 在文本正文中删除视觉 `@`，显示名称 ping 也能工作：

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

- 正则表达式不区分大小写；它们涵盖了显示名称 ping（如 `@openclaw`）和带有或不带有 `+`/空格的原始号码。
- 当有人点击联系人时，WhatsApp 仍通过 `mentionedJids` 发送规范提及，因此号码回退很少需要，但这是一个有用的安全网。

### 激活命令（仅所有者）

使用群聊命令：

- `/activation mention`
- `/activation always`

只有所有者号码（来自 `channels.whatsapp.allowFrom`，或未设置时机器人自己的 E.164）才能更改此设置。在群组中作为独立消息发送 `/status` 以查看当前激活模式。

## 如何使用

1. 将您的 WhatsApp 帐户（运行 OpenClaw 的帐户）添加到群组。
2. 说 `@openclaw …`（或包含号码）。只有白名单发送者才能触发它，除非您设置 `groupPolicy: "open"`。
3. Agent 提示将包括最近的群组上下文加上尾随的 `[from: …]` 标记，以便它可以向正确的人发表讲话。
4. 会话级指令（`/verbose on`、`/think high`、`/new` 或 `/reset`、`/compact`）仅适用于该群组的会话；将它们作为独立消息发送以便它们注册。您的个人 DM 会话保持独立。

## 测试/验证

- 手动冒烟测试：
  - 在群组中发送 `@openclaw` ping 并确认引用发送者名称的回复。
  - 发送第二个 ping 并验证历史块包含然后在下一轮清除。
- 检查 Gateway 日志（使用 `--verbose` 运行）以查看显示 `from: <groupJid>` 和 `[from: …]` 后缀的 `inbound web message` 条目。

## 已知注意事项

- 有意跳过群组的 Heartbeats 以避免嘈杂的广播。
- 回声抑制使用组合批次字符串；如果您两次发送相同的文本而没有提及，只有第一个会得到响应。
- 会话存储条目将在会话存储（默认为 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）中显示为 `agent:<agentId>:whatsapp:group:<jid>`；缺失条目只是意味着群组尚未触发运行。
- 群组中的输入指示器遵循 `agents.defaults.typingMode`（未提及时默认为 `message`）。
