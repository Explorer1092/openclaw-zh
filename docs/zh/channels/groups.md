---
mmh3_hash: "e824db5cf1dc2c84d3f1aaf889d0cad7"
summary: "跨界面（WhatsApp/Telegram/Discord/Slack/Signal/iMessage/Microsoft Teams/Zalo）的群聊行为"
read_when:
  - 更改群聊行为或提及门控
title: "群组"
---

# 群组

OpenClaw 在各个界面上一致地处理群聊：WhatsApp、Telegram、Discord、Slack、Signal、iMessage、Microsoft Teams、Zalo。

## 初学者介绍（2 分钟）

OpenClaw "居住"在您自己的消息帐户上。没有单独的 WhatsApp 机器人用户。如果**您**在群组中，OpenClaw 可以看到该群组并在那里响应。

默认行为：

- 群组受限制（`groupPolicy: "allowlist"`）。
- 除非您明确禁用提及门控，否则回复需要提及。

翻译：白名单发送者可以通过提及它来触发 OpenClaw。

> TL;DR
>
> - **DM 访问**由 `*.allowFrom` 控制。
> - **群组访问**由 `*.groupPolicy` + 白名单（`*.groups`、`*.groupAllowFrom`）控制。
> - **回复触发**由提及门控（`requireMention`、`/activation`）控制。

快速流程（群组消息会发生什么）：

```
groupPolicy? disabled -> 丢弃
groupPolicy? allowlist -> 群组允许吗？ no -> 丢弃
requireMention? yes -> 被提及吗？ no -> 仅存储以供上下文使用
否则 -> 回复
```

![群组消息流程](/images/groups-flow.svg)

如果您想要...

| 目标                                       | 要设置的内容                                               |
| ------------------------------------------ | ---------------------------------------------------------- |
| 允许所有群组但仅在 @提及时回复             | `groups: { "*": { requireMention: true } }`                |
| 禁用所有群组回复                           | `groupPolicy: "disabled"`                                  |
| 仅特定群组                                 | `groups: { "<group-id>": { ... } }`（无 `"*"` 键）         |
| 仅您可以在群组中触发                       | `groupPolicy: "allowlist"`，`groupAllowFrom: ["+1555..."]` |

## Session 键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/Channels 使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛主题将 `:topic:<threadId>` 添加到群组 ID，以便每个主题都有自己的会话。
- 直接聊天使用 main 会话（或如果配置则每个发送者）。
- 群组会话跳过 Heartbeats。

## 模式：个人 DM + 公共群组（单个 Agent）

是的 — 如果您的"个人"流量是 **DM**，而您的"公共"流量是**群组**，这很有效。

为什么：在单 Agent 模式下，DM 通常落在 **main** 会话键（`agent:main:main`）中，而群组始终使用**非 main** 会话键（`agent:main:<channel>:group:<id>`）。如果您使用 `mode: "non-main"` 启用沙箱，这些群组会话在 Docker 中运行，而您的 main DM 会话保持在主机上。

这为您提供一个 Agent"大脑"（共享工作空间 + 内存），但两种执行姿态：

- **DM**：完整工具（主机）
- **群组**：沙箱 + 受限工具（Docker）

> 如果您需要真正独立的工作空间/角色（"个人"和"公共"永远不能混合），请使用第二个 Agent + 绑定。参见 [多 Agent 路由](/concepts/multi-agent)。

示例（主机上的 DM，沙箱化的群组 + 仅消息工具）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // 群组/Channels 是非 main -> 沙箱化
        scope: "session", // 最强隔离（每个群组/Channel 一个容器）
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // 如果 allow 非空，则阻止其他所有内容（deny 仍然获胜）。
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

想要"群组只能看到文件夹 X"而不是"无主机访问"？保持 `workspaceAccess: "none"` 并仅将白名单路径挂载到沙箱中：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

相关：

- 配置键和默认值：[Gateway 配置](/gateway/configuration#agentsdefaultssandbox)
- 调试为何工具被阻止：[Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱](/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
- `#room` 保留给房间/Channels；群聊使用 `g-<slug>`（小写，空格 -> `-`，保留 `#@+._-`）。

## 群组策略

控制如何按 Channel 处理群组/房间消息：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // 数字 Telegram 用户 ID（向导可以解析 @username）
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| 策略          | 行为                                                     |
| ------------- | -------------------------------------------------------- |
| `"open"`      | 群组绕过白名单；提及门控仍然适用。                       |
| `"disabled"`  | 完全阻止所有群组消息。                                   |
| `"allowlist"` | 仅允许与配置的白名单匹配的群组/房间。                    |

注意：

- `groupPolicy` 与提及门控（需要 @提及）分开。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退：显式 `allowFrom`）。
- DM 配对审批（`*-allowFrom` 存储条目）仅适用于 DM 访问；群组发送者授权明确留给群组白名单。
- Discord：白名单使用 `channels.discord.guilds.<id>.channels`。
- Slack：白名单使用 `channels.slack.channels`。
- Matrix：白名单使用 `channels.matrix.groups`（房间 ID、别名或名称）。使用 `channels.matrix.groupAllowFrom` 限制发送者；也支持每个房间的 `users` 白名单。
- 群组 DM 单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
- Telegram 白名单可以匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
- 默认值为 `groupPolicy: "allowlist"`；如果您的群组白名单为空，则阻止群组消息。
- 运行时安全：当 provider 块完全缺失（`channels.<provider>` 不存在）时，群组策略回退到失败关闭模式（通常为 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

群组消息的快速心智模型（评估顺序）：

1. `groupPolicy`（open/disabled/allowlist）
2. 群组白名单（`*.groups`、`*.groupAllowFrom`、特定于 Channel 的白名单）
3. 提及门控（`requireMention`、`/activation`）

## 提及门控（默认）

除非按群组覆盖，否则群组消息需要提及。默认值位于 `*.groups."*"` 下的每个子系统中。

回复机器人消息算作隐式提及（当 Channel 支持回复元数据时）。这适用于 Telegram、WhatsApp、Slack、Discord 和 Microsoft Teams。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

注意：

- `mentionPatterns` 是不区分大小写的正则表达式。
- 提供显式提及的界面仍然通过；模式是回退。
- 每个 Agent 覆盖：`agents.list[].groupChat.mentionPatterns`（当多个 Agents 共享群组时很有用）。
- 仅在提及检测可能时（本机提及或配置了 `mentionPatterns`）强制执行提及门控。
- Discord 默认值位于 `channels.discord.guilds."*"` 中（可按公会/Channel 覆盖）。
- 群组历史上下文在 Channels 之间统一包装，并且是**仅待处理**的（由于提及门控而跳过的消息）；对于全局默认值使用 `messages.groupChat.historyLimit`，对于覆盖使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）。设置 `0` 以禁用。

## 群组/Channel 工具限制（可选）

某些 Channel 配置支持限制**特定群组/房间/Channel 内**可用的工具。

- `tools`：允许/拒绝整个群组的工具。
- `toolsBySender`：群组内的每个发送者覆盖。
  使用显式键前缀：
  `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 以及 `"*"` 通配符。
  旧版无前缀键仍被接受，仅匹配 `id:`。

解析顺序（最具体的获胜）：

1. 群组/Channel `toolsBySender` 匹配
2. 群组/Channel `tools`
3. 默认（`"*"`）`toolsBySender` 匹配
4. 默认（`"*"`）`tools`

示例（Telegram）：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

注意：

- 群组/Channel 工具限制除了全局/Agent 工具策略之外应用（deny 仍然获胜）。
- 某些 Channels 对房间/Channels 使用不同的嵌套（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、MS Teams `teams.*.channels.*`）。

## 群组白名单

当配置 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，键充当群组白名单。使用 `"*"` 允许所有群组，同时仍设置默认提及行为。

常见意图（复制/粘贴）：

1. 禁用所有群组回复

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 仅允许特定群组（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. 允许所有群组但需要提及（显式）

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. 仅所有者可以在群组中触发（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## 激活（仅所有者）

群组所有者可以切换每个群组的激活：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 确定（或未设置时为机器人自己的 E.164）。将命令作为独立消息发送。其他界面目前忽略 `/activation`。

## 上下文字段

群组入站负载设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛主题还包括 `MessageThreadId` 和 `IsForum`。

Agent 系统提示在新群组会话的第一轮包括群组介绍。它提醒模型像人类一样响应，避免 Markdown 表格，并避免键入文字 `\n` 序列。

## iMessage 特定

- 在路由或白名单时优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终返回到相同的 `chat_id`。

## WhatsApp 特定

有关 WhatsApp 特定行为（历史注入、提及处理详情），请参见 [群组消息](/channels/group-messages)。
