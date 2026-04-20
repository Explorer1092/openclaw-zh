---
title: "Reactions"
mmh3_hash: "c94326bb80d66941a27ea92a69d9fd2b"
summary: "跨所有支持 Channel 的 Reaction 工具语义"
read_when:
  - 在任何 Channel 中处理 Reaction
  - 了解 emoji 反应在不同平台间的差异
---

# Reactions

Agent 可以使用 `message` 工具的 `react` action 在消息上添加和移除 emoji 反应。Reaction 行为因 Channel 而异。

## 工作原理

```json
{
  "action": "react",
  "messageId": "msg-123",
  "emoji": "thumbsup"
}
```

- 添加反应时需要 `emoji`。
- 将 `emoji` 设置为空字符串（`""`）以移除机器人的反应。
- 设置 `remove: true` 以移除特定 emoji（需要非空 `emoji`）。

## Channel 行为

<AccordionGroup>
  <Accordion title="Discord 和 Slack">
    - 空 `emoji` 移除消息上机器人的所有反应。
    - `remove: true` 仅移除指定的 emoji。
  </Accordion>

  <Accordion title="Google Chat">
    - 空 `emoji` 移除消息上应用的反应。
    - `remove: true` 仅移除指定的 emoji。
  </Accordion>

  <Accordion title="Telegram">
    - 空 `emoji` 移除机器人的反应。
    - `remove: true` 也移除反应，但仍需要非空 `emoji` 以进行工具验证。
  </Accordion>

  <Accordion title="WhatsApp">
    - 空 `emoji` 移除机器人反应。
    - `remove: true` 在内部映射到空 emoji（工具调用中仍需要 `emoji`）。
  </Accordion>

  <Accordion title="Zalo Personal (zalouser)">
    - 需要非空 `emoji`。
    - `remove: true` 移除该特定 emoji 反应。
  </Accordion>

  <Accordion title="Feishu/Lark">
    - 使用 `feishu_reaction` 工具，支持 `add`、`remove` 和 `list` actions。
    - 添加/移除需要 `emoji_type`；移除还需要 `reaction_id`。
  </Accordion>

  <Accordion title="Signal">
    - 入站反应通知由 `channels.signal.reactionNotifications` 控制：`"off"` 禁用，`"own"`（默认）在用户对机器人消息做出反应时发出事件，`"all"` 对所有反应发出事件。
  </Accordion>
</AccordionGroup>

## Reaction 级别

每个 Channel 的 `reactionLevel` 配置控制 Agent 使用反应的范围。值通常为 `off`、`ack`、`minimal` 或 `extensive`。

- [Telegram reactionLevel](/channels/telegram#reaction-notifications) — `channels.telegram.reactionLevel`
- [WhatsApp reactionLevel](/channels/whatsapp#reaction-level) — `channels.whatsapp.reactionLevel`

在各个 Channel 上设置 `reactionLevel` 以调整 Agent 在每个平台上对消息做出反应的活跃程度。

## 相关

- [Agent Send](/tools/agent-send) — 包含 `react` action 的 `message` 工具
- [Channels](/channels) — 各 Channel 的专项配置
