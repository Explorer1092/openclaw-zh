---
mmh3_hash: "b32a66632fc6809fdf308000a5b82a31"
summary: "WhatsApp 群组消息处理——激活、allowlist、Session 和上下文注入"
read_when:
  - 专门配置 WhatsApp 群组消息时
title: "WhatsApp 群组消息"
---

本页面详细说明 WhatsApp 的群组消息行为。如需跨 Channel 的群组消息信息，请参阅[群组](/channels/groups)。

## 激活模式

群组消息的激活模式通过会话级别的 `/activation` 命令控制：

- `/activation mention` — 仅在提及机器人时激活（默认）
- `/activation always` — 始终激活，无需提及

`activation` 更新会话状态，而非全局配置，并且只有所有者可以更改。

## 群组 allowlist 和发送者控制

WhatsApp 群组访问分为两层：

1. **群组成员 allowlist**（`channels.whatsapp.groups`）：控制哪些群组有资格触发机器人。如果省略 `groups`，所有群组均符合条件。
2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）：控制哪些发送者在已准入群组中被接受。

在 allowlist 模式下，您可以在每个群组下配置 `allowFrom` 以限制群组内的发送者：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groups: {
        "120363406415684625@g.us": {
          allowFrom: ["+15551234567"],
          requireMention: false,
          systemPrompt: "专注于项目管理。",
        },
      },
    },
  },
}
```

## 会话键

WhatsApp 群组使用隔离的会话键：

```
agent:<agentId>:whatsapp:group:<jid>
```

每个群组都有自己独立的会话。与合并为 `main` 会话的私信不同，群组会话始终是隔离的，无论 `session.dmScope` 如何设置。

## 待处理群组历史注入

当机器人被触发时，未处理的群组消息会作为上下文被缓冲并注入：

```json5
{
  channels: {
    whatsapp: {
      historyLimit: 50, // 默认
    },
  },
}
```

- 默认限制：`50` 条消息
- 回退：`messages.groupChat.historyLimit`
- 设置为 `0` 禁用

注入时使用以下标记：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

## 语音笔记转录

已授权群组消息的入站语音笔记在提及门控之前进行转录。如果转录内容仍未提及机器人，转录内容会保留在待处理群组历史记录中，而不是显示为原始占位符。

## 提及检测

WhatsApp 的提及检测包括：

- 对机器人身份的显式 WhatsApp 提及
- 配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
- 已授权群组消息的入站语音笔记转录
- 隐式回复-机器人检测（回复发送者匹配机器人身份）

安全注意：引用/回复仅满足提及门控；它**不**授予发送者授权。在 `groupPolicy: "allowlist"` 下，非 allowlist 发送者仍然被阻止，即使他们回复了 allowlist 用户的消息。

## 相关

- [WhatsApp](/channels/whatsapp)
- [Groups](/channels/groups)
- [Pairing](/channels/pairing)
