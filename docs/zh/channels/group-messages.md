---
mmh3_hash: "0b4f23beac57057138d7068c8e4b90d6"
summary: "WhatsApp 群组消息处理——激活、白名单、Session 和上下文注入"
read_when:
  - 专门配置 WhatsApp 群组
  - 更改 WhatsApp 激活模式（`mention` vs `always`）
  - 调整 WhatsApp 群组 Session 键或待处理消息上下文
title: "WhatsApp 群组消息"
sidebarTitle: "WhatsApp 群组"
---

有关跨 Channel 群组模型（Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo），请参阅 [Groups](/channels/groups)。本页面介绍该模型之上的 WhatsApp 特定行为：激活、群组白名单、每群组 Session 键和待处理消息上下文注入。

目标：让 OpenClaw 坐在 WhatsApp 群组中，只在被 ping 时唤醒，并将该线程与个人私信 Session 分开。

<Note>
`agents.list[].groupChat.mentionPatterns` 也被 Telegram、Discord、Slack 和 iMessage 使用。对于多 Agent 设置，请按 Agent 设置，或使用 `messages.groupChat.mentionPatterns` 作为全局回退。
</Note>

## 行为

- 激活模式：`mention`（默认）或 `always`。`mention` 需要 ping（通过 `mentionedJids` 的真实 WhatsApp @提及、安全的正则表达式模式，或文本中任意位置的 bot E.164 号码）。`always` 在每条消息上唤醒 agent，但只有在能添加有意义价值时才回复；否则返回确切的静默 token `NO_REPLY` / `no_reply`。默认值可在配置中设置（`channels.whatsapp.groups`），并可通过 `/activation` 按群组覆盖。设置 `channels.whatsapp.groups` 时，它也充当群组白名单（包含 `"*"` 以允许所有群组）。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退：显式的 `channels.whatsapp.allowFrom`）。默认为 `allowlist`（添加发送者之前被阻止）。
- 每群组 Session：Session 键格式为 `agent:<agentId>:whatsapp:group:<jid>`，因此 `/verbose on`、`/trace on` 或 `/think high` 等命令（作为独立消息发送）的作用域限于该群组；个人私信状态不受影响。群组线程跳过心跳。
- 上下文注入：**仅待处理的**群组消息（默认 50 条）——那些_没有_触发运行的消息——以 `[Chat messages since your last reply - for context]` 为前缀，触发行在 `[Current message - respond to this]` 下。已在 Session 中的消息不会重新注入。
- 发送者展示：每个群组批次现在以 `[from: Sender Name (+E164)]` 结尾，以便 Pi 知道谁在说话。
- 临时/仅查看一次消息：我们在提取文本/提及之前展开这些消息，因此其中的 ping 仍然会触发。
- 群组系统提示：在群组 Session 的第一轮次（以及每当 `/activation` 更改模式时），我们在系统提示中注入一段简短说明，如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), ... Activation: trigger-only ... Address the specific sender noted in the message context.` 如果元数据不可用，我们仍然告诉 agent 这是一个群聊。

## 配置示例（WhatsApp）

在 `~/.openclaw/openclaw.json` 中添加 `groupChat` 块，以便即使 WhatsApp 在文本正文中删除了视觉 `@` 符号，显示名称 ping 也能工作：

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

说明：

- 正则表达式不区分大小写，并使用与其他配置正则表达式界面相同的安全正则表达式保护；无效模式和不安全的嵌套重复会被忽略。
- 当有人点击联系人时，WhatsApp 仍通过 `mentionedJids` 发送规范提及，因此数字回退很少需要，但是一个有用的安全网。

### 激活命令（仅所有者）

使用群聊命令：

- `/activation mention`
- `/activation always`

只有所有者号码（来自 `channels.whatsapp.allowFrom`，或在未设置时使用 bot 自己的 E.164）可以更改此设置。在群组中发送 `/status` 作为独立消息以查看当前激活模式。

## 使用方法

1. 将您的 WhatsApp 账户（运行 OpenClaw 的那个）添加到群组。
2. 说 `@openclaw …`（或包含号码）。除非您设置 `groupPolicy: "open"`，否则只有白名单中的发送者才能触发它。
3. Agent 提示将包含最近的群组上下文加上结尾的 `[from: …]` 标记，以便它可以向正确的人发送。
4. Session 级别的指令（`/verbose on`、`/trace on`、`/think high`、`/new` 或 `/reset`、`/compact`）仅适用于该群组的 Session；将它们作为独立消息发送以便注册。您的个人私信 Session 保持独立。

## 测试/验证

- 手动冒烟测试：
  - 在群组中发送 `@openclaw` ping，并确认引用发送者名称的回复。
  - 发送第二个 ping 并验证历史块已包含，然后在下一轮次被清除。
- 检查 Gateway 日志（使用 `--verbose` 运行）以查看显示 `from: <groupJid>` 和 `[from: …]` 后缀的 `inbound web message` 条目。

## 已知注意事项

- 心跳对群组是故意跳过的，以避免嘈杂的广播。
- 回声抑制使用合并的批次字符串；如果您在没有提及的情况下发送相同文本两次，只有第一条会得到响应。
- Session 存储条目将在 Session 存储（默认 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）中显示为 `agent:<agentId>:whatsapp:group:<jid>`；缺少条目只意味着该群组尚未触发运行。
- 群组中的输入指示器遵循 `agents.defaults.typingMode`。当可见回复使用默认的仅 message 工具模式时，默认情况下输入会立即开始，这样群组成员即使没有自动最终回复也能看到 agent 正在工作。显式输入模式配置仍然优先。

## 相关

- [Groups](/channels/groups)
- [Channel 路由](/channels/channel-routing)
- [广播组](/channels/broadcast-groups)
