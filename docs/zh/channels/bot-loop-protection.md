---
mmh3_hash: "6b96496a709a0553daef7b5c5c313272"
summary: "Bot 间循环保护的默认值和 Channel 覆盖"
read_when:
  - 配置机器人创作的 Channel 消息时
  - 调整 bot 间循环保护时
title: "Bot loop protection"
sidebarTitle: "Bot loop protection"
---

# Bot loop protection

OpenClaw 可以在支持 `allowBots` 的 Channel 上接受其他机器人发送的消息。
启用该路径后，配对循环保护会防止两个机器人身份无限互相回复。

该守卫由核心 Channel 轮次内核强制执行。每个支持的 Channel 将自身的入站事件映射为通用事实：账户或范围、对话 ID、发送方机器人 ID 和接收方机器人 ID。核心随后在两个方向跟踪参与者配对，应用滑动窗口预算，并在预算耗尽后在冷却期内抑制该配对。

## 默认值

当 Channel 允许机器人创作的消息到达分发时，配对循环保护即为活跃状态。内置默认值为：

- `maxEventsPerWindow: 20` - 一对机器人可在窗口内交换 20 个事件
- `windowSeconds: 60` - 滑动窗口时长
- `cooldownSeconds: 60` - 超出预算后的抑制时间

该守卫不影响正常的人工创作消息、单机器人部署、自消息过滤，或保持在预算内的一次性机器人回复。

## 配置共享默认值

设置一次 `channels.defaults.botLoopProtection`，即可为所有支持的 Channel 提供相同的基准值。Channel 和账户级别的覆盖仍可调整各个界面。

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
  },
}
```

仅当你的 Channel 策略有意允许无自动抑制的 bot 间对话时，才设置 `enabled: false`。

## 按 Channel 或账户覆盖

支持的 Channel 会在共享默认值之上叠加自身配置。优先级为：

- `channels.<channel>.<room-or-space>.botLoopProtection`，当 Channel 支持按对话覆盖时
- `channels.<channel>.accounts.<account>.botLoopProtection`，当 Channel 支持账户时
- `channels.<channel>.botLoopProtection`，当 Channel 支持顶级默认值时
- `channels.defaults.botLoopProtection`
- 内置默认值

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
      },
    },
    discord: {
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
      accounts: {
        molty: {
          allowBots: "mentions",
          botLoopProtection: {
            maxEventsPerWindow: 5,
            cooldownSeconds: 90,
          },
        },
      },
    },
    slack: {
      allowBots: "mentions",
      botLoopProtection: {
        maxEventsPerWindow: 8,
      },
    },
    matrix: {
      allowBots: "mentions",
      groups: {
        "!roomid:example.org": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
    googlechat: {
      allowBots: true,
      groups: {
        "spaces/AAAA": {
          botLoopProtection: {
            maxEventsPerWindow: 5,
          },
        },
      },
    },
  },
}
```

## Channel 支持情况

- Discord：原生 `author.bot` 事实，按 Discord 账户、Channel 和机器人配对键控。
- Slack：已接受的机器人创作消息的原生 `bot_id` 事实，按 Slack 账户、Channel 和机器人配对键控。
- Matrix：配置的 Matrix 机器人账户，按 Matrix 账户、房间和配置的机器人配对键控。
- Google Chat：已接受的机器人创作消息的原生 `sender.type=BOT` 事实，按账户、空间和机器人配对键控。

无法公开可靠入站机器人身份的 Channel 继续使用其正常的自消息和访问策略过滤。在能够识别机器人配对中的两个参与者之前，不应选择加入此守卫。

参见 [SDK runtime](/plugins/sdk-runtime#reusable-runtime-utilities) 了解插件实现详情。
