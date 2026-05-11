---
mmh3_hash: "ee42899a8d38d64c0a05a363fd6df01b"
summary: "在已关联的聊天 Channel 之间移动某个 OpenClaw Session 的回复路由"
title: "Channel Docking"
read_when:
  - 您希望某个活跃 Session 的回复从 Telegram 切换到 Discord、Slack、Mattermost 或其他已关联的 Channel
  - 您正在为跨 Channel 私信配置 session.identityLinks
  - /dock 命令提示发送方未关联或不存在活跃 Session
---

Channel docking 是针对单个 OpenClaw Session 的呼叫转移功能。

它保留相同的对话上下文，但会更改该 Session 未来回复的传递目的地。

## 示例

Alice 可以通过 Telegram 和 Discord 给 OpenClaw 发送消息：

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

如果 Alice 从 Telegram 发送以下内容：

```text
/dock_discord
```

OpenClaw 会保留当前 Session 的上下文，并更改回复路由：

| Docking 前               | 执行 `/dock_discord` 后    |
| ------------------------ | -------------------------- |
| 回复发送到 Telegram `123` | 回复发送到 Discord `456`   |

Session 不会重新创建，对话记录历史仍附加到同一 Session 中。

## 使用场景

当任务在某个聊天应用中开始，但后续回复应出现在其他地方时，使用 docking。

常见流程：

1. 在 Telegram 中启动 Agent 任务。
2. 切换到用于协调工作的 Discord。
3. 从 Telegram Session 发送 `/dock_discord`。
4. 保持相同的 OpenClaw Session，但在 Discord 中接收后续回复。

## 所需配置

Docking 需要 `session.identityLinks`。来源发送方和目标对端必须在同一个身份组中：

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

值为带 Channel 前缀的对端 ID：

| 值              | 含义                      |
| --------------- | ------------------------- |
| `telegram:123`  | Telegram 发送方 ID `123`  |
| `discord:456`   | Discord 私信对端 ID `456` |
| `slack:U123`    | Slack 用户 ID `U123`      |

规范键（上例中的 `alice`）仅为共享身份组名称。Dock 命令使用带 Channel 前缀的值来证明来源发送方和目标对端是同一个人。

## 命令

Dock 命令由已加载的、支持原生命令的 Channel Plugin 生成。当前内置命令：

| 目标 Channel | 命令                 | 别名                 |
| ------------ | -------------------- | -------------------- |
| Discord      | `/dock-discord`      | `/dock_discord`      |
| Mattermost   | `/dock-mattermost`   | `/dock_mattermost`   |
| Slack        | `/dock-slack`        | `/dock_slack`        |
| Telegram     | `/dock-telegram`     | `/dock_telegram`     |

下划线别名在 Telegram 等原生命令界面上很有用。

## 变更内容

Docking 会更新活跃 Session 的传递字段：

| Session 字段    | `/dock_discord` 后的示例                  |
| --------------- | ----------------------------------------- |
| `lastChannel`   | `discord`                                 |
| `lastTo`        | `456`                                     |
| `lastAccountId` | 目标 Channel 账户，或 `default`            |

这些字段会持久化到 Session 存储中，并用于该 Session 后续的回复传递。

## 不变的内容

Docking 不会：

- 创建 Channel 账户
- 连接新的 Discord、Telegram、Slack 或 Mattermost 机器人
- 授予用户访问权限
- 绕过 Channel 允许列表或私信策略
- 将对话记录历史移至另一个 Session
- 让不相关的用户共享一个 Session

它只会更改当前 Session 的传递路由。

## 故障排查

**命令提示发送方未关联。**

将当前发送方和目标对端都添加到同一个 `session.identityLinks` 组中。例如，如果 Telegram 发送方 `123` 应 dock 到 Discord 对端 `456`，则同时包含 `telegram:123` 和 `discord:456`。

**命令提示不存在活跃 Session。**

从已有的私信 Session 中执行 dock。该命令需要一个活跃的 Session 条目才能持久化新路由。

**回复仍发送到旧 Channel。**

检查命令是否已回复成功消息，并确认目标对端 ID 与该 Channel 使用的 ID 一致。Docking 只会更改活跃 Session 的路由；另一个 Session 可能仍在路由到其他地方。

**我需要切换回去。**

从已关联的发送方发送原始 Channel 的对应命令，例如 `/dock_telegram` 或 `/dock-telegram`。
