---
mmh3_hash: "02fca18ca67769c242fc583f2fd8e564"
summary: "让受支持的群组房间在 Agent 不主动发送消息时提供静默上下文"
read_when:
  - 配置常驻群组或 Channel 房间时
  - 你希望 Agent 监听房间聊天而不自动发送最终文本时
  - 调试无可见房间消息时的正在输入状态和 Token 使用情况
title: "Ambient room events"
sidebarTitle: "Ambient room events"
---

Ambient room events 让 OpenClaw 将未@提及的群组或 Channel 聊天内容作为静默上下文处理。Agent 可以更新记忆和 Session 状态，但除非 Agent 明确调用 `message` 工具，否则房间保持静默。

对于常驻群组聊天，这是推荐模式：将 `messages.groupChat.unmentionedInbound: "room_event"` 与 `messages.groupChat.visibleReplies: "message_tool"` 结合使用。当 Agent 应该监听、决定何时回复有用，并避免回答 `NO_REPLY` 的旧提示模式时，请使用此配置。

目前支持的平台：Discord 服务器 Channel、Slack Channel 和私有 Channel、Slack 多人 DM，以及 Telegram 群组或超级群组。其他群组 Channel 保持其现有的群组行为，除非其 Channel 页面说明支持 ambient room events。

## 推荐设置

设置全局群组聊天行为：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

然后通过禁用该房间的@提及门控，将房间本身配置为常驻模式。Channel 仍需通过其正常的 `groupPolicy`、房间允许列表和发送者允许列表。

保存配置后，Gateway 会热重载 `messages` 设置。仅在文件监听或配置重载被禁用时才需要重启。

## 变化内容

启用 `messages.groupChat.unmentionedInbound: "room_event"` 后：

- 未@提及的已允许群组或 Channel 消息变为静默房间事件
- @提及的消息仍为用户请求
- 文本命令和原生命令仍为用户请求
- 中止或停止请求仍为用户请求
- 私信仍为用户请求

房间事件使用严格的可见交付。最终助手文本为私密。Agent 必须调用 `message(action=send)` 才能在房间中发布。

## Discord 示例

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

仅当一个 Channel 应为 ambient 时，使用 Discord 按 Channel 配置：

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Slack 示例

Slack Channel 允许列表以 ID 为优先。使用 Channel ID（如 `C12345678`），而非 `#channel-name`。

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Telegram 示例

对于 Telegram 群组，机器人必须能看到普通群组消息。如果设置了 `requireMention: false`，请在 BotFather 中禁用隐私模式，或使用其他能将完整群组流量传递给机器人的 Telegram 设置。

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Telegram 群组 ID 通常是负数，例如 `-1001234567890`。可从 `openclaw logs --follow` 读取 `chat.id`，将群组消息转发给 ID 辅助机器人，或检查 Bot API 的 `getUpdates`。

## 按 Agent 策略

当多个 Agent 共享同一房间但只有一个 Agent 应将未@提及的聊天视为 ambient 上下文时，使用 Agent 级别覆盖：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

Agent 专属的 `agents.list[].groupChat.unmentionedInbound` 值会覆盖该 Agent 的 `messages.groupChat.unmentionedInbound`。

## 可见回复模式

`messages.groupChat.visibleReplies` 对于普通群组/Channel 用户请求默认为 `"automatic"`。如果希望最终助手文本无需显式调用 message 工具就能可见发布，请保留该默认值。

对于常驻 ambient 房间，仍推荐使用 `messages.groupChat.visibleReplies: "message_tool"`，尤其是配合 GPT 5.5 等最新一代工具可靠模型。它让 Agent 通过调用 message 工具来决定何时发言。如果模型返回最终文本而未调用工具，OpenClaw 会将该最终文本保持私密，并记录受抑制的交付元数据。

即使其他群组请求使用自动回复，房间事件仍保持严格模式。未@提及的 ambient 房间事件仍需要 `message(action=send)` 才能可见输出。

## 历史记录

`messages.groupChat.historyLimit` 控制全局群组历史默认值。Channel 可以使用 `channels.<channel>.historyLimit` 覆盖它，部分 Channel 还支持按账户的历史限制。

设置 `historyLimit: 0` 可禁用群组历史上下文。

受支持的房间事件 Channel 会将最近的 ambient 房间消息保留为上下文。Discord 会保留房间事件历史，直到可见的 Discord 发送成功，因此在 message 工具交付之前不会丢失静默上下文。

## 故障排除

如果房间显示正在输入或 Token 使用但无可见消息：

1. 确认房间已通过 Channel 允许列表和发送者允许列表。
2. 确认在预期的房间级别设置了 `requireMention: false`。
3. 检查 `messages.groupChat.unmentionedInbound` 或 Agent 覆盖是否为 `"room_event"`。
4. 检查日志中受抑制的最终载荷元数据或 `didSendViaMessagingTool: false`。
5. 对于普通群组请求，如果希望最终回复自动发布，请保留或恢复 `messages.groupChat.visibleReplies: "automatic"`。对于使用 `message_tool` 的 ambient 房间，请使用能可靠调用工具的模型/运行时。

如果 Telegram ambient 房间完全不触发，请检查 BotFather 隐私模式并验证 Gateway 是否接收普通群组消息。

如果 Slack ambient 房间不触发，请验证 Channel 键是否为 Slack Channel ID，并检查应用是否具有该房间类型所需的 `channels:history` 或 `groups:history` 权限范围。

## 相关

- [Groups](/channels/groups)
- [Discord](/channels/discord)
- [Slack](/channels/slack)
- [Telegram](/channels/telegram)
- [Channel 故障排除](/channels/troubleshooting)
- [Channel 配置参考](/gateway/config-channels)
