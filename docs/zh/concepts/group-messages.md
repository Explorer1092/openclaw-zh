---
title: "群组消息 (WhatsApp web 频道)"
sidebarTitle: "群组消息"
mmh3_hash: "45cd2527cf3874e0a492d8f3cccc881a"
summary: "WhatsApp group 消息处理的行为和配置(mentionPatterns 在各个表面之间共享)"
read_when: ["更改 group 消息规则或 mentions"]
---
# 群组消息 (WhatsApp web 频道)

目标:让 Clawd 坐在 WhatsApp groups 中,仅在被 ping 时唤醒,并将该线程与个人 DM session 分开。

注意:`agents.list[].groupChat.mentionPatterns` 现在也被 Telegram/Discord/Slack/iMessage 使用;本文档重点介绍 WhatsApp 特定的行为。对于 multi-agent 设置,为每个 agent 设置 `agents.list[].groupChat.mentionPatterns`(或使用 `messages.groupChat.mentionPatterns` 作为全局后备)。

## 已实现的功能(2025-12-03)
- 激活模式:`mention`(默认)或 `always`。`mention` 需要 ping(通过 `mentionedJids` 的真实 WhatsApp @-mentions、regex patterns 或文本中任何位置的 bot 的 E.164)。`always` 在每条消息上唤醒 agent,但它应该仅在可以添加有意义的价值时回复;否则返回静默 token `NO_REPLY`。可以在配置(`channels.whatsapp.groups`)中设置默认值,并通过 `/activation` 按 group 覆盖。当设置 `channels.whatsapp.groups` 时,它也充当 group 允许列表(包括 `"*"` 以允许所有)。
- Group policy: `channels.whatsapp.groupPolicy` 控制是否接受 group 消息(`open|disabled|allowlist`)。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`(后备:显式 `channels.whatsapp.allowFrom`)。默认为 `allowlist`(阻止,直到你添加发送者)。
- Per-group sessions: session keys 看起来像 `agent:<agentId>:whatsapp:group:<jid>`,因此诸如 `/verbose on` 或 `/think high`(作为独立消息发送)等命令作用于该 group;个人 DM 状态不受影响。Heartbeats 对 group threads 跳过。
- Context 注入:**仅待处理** 的 group 消息(默认 50)(*未* 触发运行)在 `[Chat messages since your last reply - for context]` 下加前缀,触发行在 `[Current message - respond to this]` 下。已在 session 中的消息不会重新注入。
- Sender 显示:每个 group batch 现在以 `[from: Sender Name (+E164)]` 结尾,因此 Pi 知道谁在说话。
- Ephemeral/view-once: 我们在提取文本/mentions 之前解包这些,因此其中的 pings 仍然会触发。
- Group system prompt: 在 group session 的第一个回合(以及每当 `/activation` 更改模式时),我们将一个简短的说明注入到 system prompt 中,如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 如果元数据不可用,我们仍然告诉 agent 这是 group chat。

## 配置示例(WhatsApp)
将 `groupChat` 块添加到 `~/.openclaw/openclaw.json`,以便即使 WhatsApp 在文本正文中剥离视觉 `@`,display-name pings 也能工作:

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true }
      }
    }
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: [
            "@?openclaw",
            "\\+?15555550123"
          ]
        }
      }
    ]
  }
}
```

注意:
- Regexes 不区分大小写;它们覆盖像 `@openclaw` 这样的 display-name ping 和带或不带 `+`/spaces 的原始数字。
- 当有人点击联系人时,WhatsApp 仍通过 `mentionedJids` 发送规范 mentions,因此数字后备很少需要,但它是一个有用的安全网。

### 激活命令(仅所有者)

使用 group chat 命令:
- `/activation mention`
- `/activation always`

只有所有者号码(来自 `channels.whatsapp.allowFrom`,或未设置时 bot 自己的 E.164)可以更改此设置。在 group 中作为独立消息发送 `/status` 以查看当前激活模式。

## 如何使用
1) 将你的 WhatsApp 账户(运行 OpenClaw 的账户)添加到 group。
2) 说 `@openclaw …`(或包含号码)。只有允许列表中的发送者可以触发它,除非你设置 `groupPolicy: "open"`。
3) Agent prompt 将包括最近的 group context 加上尾随的 `[from: …]` 标记,以便它可以向正确的人发送消息。
4) Session 级别的 directives(`/verbose on`、`/think high`、`/new` 或 `/reset`、`/compact`)仅适用于该 group 的 session;将它们作为独立消息发送,以便它们注册。你的个人 DM session 保持独立。

## 测试/验证
- 手动冒烟:
  - 在 group 中发送 `@openclaw` ping 并确认引用发送者名称的回复。
  - 发送第二个 ping 并验证历史记录块被包含,然后在下一回合清除。
- 检查 gateway 日志(使用 `--verbose` 运行)以查看显示 `from: <groupJid>` 和 `[from: …]` 后缀的 `inbound web message` 条目。

## 已知考虑
- Heartbeats 有意跳过 groups 以避免嘈杂的广播。
- Echo 抑制使用组合批处理字符串;如果你发送两次相同的文本而没有 mentions,只有第一个会得到响应。
- Session store 条目将显示为 session store 中的 `agent:<agentId>:whatsapp:group:<jid>`(`~/.openclaw/agents/<agentId>/sessions/sessions.json` 默认情况下);缺少的条目只是意味着 group 尚未触发运行。
- Groups 中的 typing indicators 遵循 `agents.defaults.typingMode`(默认:未提及时为 `message`)。
