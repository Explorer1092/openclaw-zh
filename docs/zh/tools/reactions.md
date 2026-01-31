---
title: "反应工具"
mmh3_hash: "dd2951865471932d97abb6bd72e7874a"
summary: "跨频道共享的反应语义"
read_when:
  - 在任何频道中处理反应
---
# 反应工具

跨频道共享的反应语义:

- 添加反应时需要 `emoji`。
- `emoji=""` 在支持的情况下删除机器人的反应。
- `remove: true` 在支持的情况下删除指定的表情符号(需要 `emoji`)。

频道注意事项:

- **Discord/Slack**: 空 `emoji` 删除消息上机器人的所有反应;`remove: true` 仅删除该表情符号。
- **Google Chat**: 空 `emoji` 删除消息上应用的反应;`remove: true` 仅删除该表情符号。
- **Telegram**: 空 `emoji` 删除机器人的反应;`remove: true` 也删除反应,但仍需要非空 `emoji` 以进行工具验证。
- **WhatsApp**: 空 `emoji` 删除机器人反应;`remove: true` 映射到空表情符号(仍需要 `emoji`)。
- **Signal**: 当启用 `channels.signal.reactionNotifications` 时,入站反应通知会发出系统事件。

<!-- i18n-hash:4c73427fd47a42f4219a666db6cfa7b5 -->
