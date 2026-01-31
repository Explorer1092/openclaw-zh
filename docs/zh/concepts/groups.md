---
title: "群组"
sidebarTitle: "群组"
mmh3_hash: "7d2aebdfffde8173646be283472338b1"
summary: "跨表面的 group chat 行为(WhatsApp/Telegram/Discord/Slack/Signal/iMessage/Microsoft Teams)"
read_when:
  - 更改 group chat 行为或 mention gating
---
# 群组

OpenClaw 在各个表面上一致地处理 group chats:WhatsApp、Telegram、Discord、Slack、Signal、iMessage、Microsoft Teams。

## 初学者介绍(2 分钟)
OpenClaw "生活"在你自己的消息账户上。没有单独的 WhatsApp bot 用户。如果 **你** 在一个 group 中,OpenClaw 可以看到该 group 并在那里响应。

默认行为:
- Groups 受限制(`groupPolicy: "allowlist"`)。
- 回复需要 mention,除非你明确禁用 mention gating。

翻译:允许列表中的发送者可以通过提及来触发 OpenClaw。

> TL;DR
> - **DM 访问** 由 `*.allowFrom` 控制。
> - **Group 访问** 由 `*.groupPolicy` + 允许列表(`*.groups`、`*.groupAllowFrom`)控制。
> - **回复触发** 由 mention gating(`requireMention`、`/activation`)控制。

快速流程(group 消息会发生什么):
```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

![Group message flow](/images/groups-flow.svg)

如果你想...
| 目标 | 设置什么 |
|------|-------------|
| 允许所有 groups 但仅在 @mentions 时回复 | `groups: { "*": { requireMention: true } }` |
| 禁用所有 group 回复 | `groupPolicy: "disabled"` |
| 仅特定 groups | `groups: { "<group-id>": { ... } }` (无 `"*"` 键) |
| 仅你可以在 groups 中触发 | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Session keys
- Group sessions 使用 `agent:<agentId>:<channel>:group:<id>` session keys(rooms/channels 使用 `agent:<agentId>:<channel>:channel:<id>`)。
- Telegram forum topics 将 `:topic:<threadId>` 添加到 group id,以便每个 topic 都有自己的 session。
- 直接聊天使用 main session(或按发送者配置)。
- Heartbeats 对 group sessions 跳过。

## 模式: 个人 DMs + 公共 groups(单个 agent)

是的 — 如果你的"个人"流量是 **DMs**,而你的"公共"流量是 **groups**,这很有效。

原因:在单 agent 模式下,DMs 通常落在 **main** session key(`agent:main:main`)中,而 groups 始终使用 **非 main** session keys(`agent:main:<channel>:group:<id>`)。如果使用 `mode: "non-main"` 启用沙盒,这些 group sessions 在 Docker 中运行,而你的 main DM session 保持在主机上。

这为你提供了一个 agent "大脑"(共享 workspace + memory),但有两种执行姿态:
- **DMs**: 完整工具(主机)
- **Groups**: sandbox + 受限工具(Docker)

> 如果你需要真正分离的 workspaces/personas("个人"和"公共"绝不能混合),请使用第二个 agent + bindings。参见 [Multi-Agent Routing](/zh/concepts/multi-agent)。

示例(主机上的 DMs,沙盒 + 仅消息工具的 groups):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // groups/channels 是非 main -> 沙盒
        scope: "session", // 最强隔离(每个 group/channel 一个容器)
        workspaceAccess: "none"
      }
    }
  },
  tools: {
    sandbox: {
      tools: {
        // 如果 allow 非空,其他所有内容都被阻止(deny 仍然获胜)。
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"]
      }
    }
  }
}
```

想要"groups 只能看到文件夹 X"而不是"没有主机访问"?保持 `workspaceAccess: "none"` 并仅将允许列表中的路径挂载到 sandbox:

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
            "~/FriendsShared:/data:ro"
          ]
        }
      }
    }
  }
}
```

相关:
- 配置键和默认值:[Gateway configuration](/zh/gateway/configuration#agentsdefaultssandbox)
- 调试为什么工具被阻止:[Sandbox vs Tool Policy vs Elevated](/zh/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bind mounts 详细信息:[Sandboxing](/zh/gateway/sandboxing#custom-bind-mounts)

## 显示标签
- UI 标签在可用时使用 `displayName`,格式为 `<channel>:<token>`。
- `#room` 保留给 rooms/channels;group chats 使用 `g-<slug>`(小写,空格 -> `-`,保留 `#@+._-`)。

## Group policy
控制每个 channel 如何处理 group/room 消息:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"]
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789", "@username"]
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"]
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"]
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"]
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "GUILD_ID": { channels: { help: { allow: true } } }
      }
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } }
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true }
      }
    }
  }
}
```

| Policy | 行为 |
|--------|----------|
| `"open"` | Groups 绕过允许列表;mention-gating 仍然适用。 |
| `"disabled"` | 完全阻止所有 group 消息。 |
| `"allowlist"` | 仅允许匹配配置的允许列表的 groups/rooms。 |

注意:
- `groupPolicy` 与 mention-gating(需要 @mentions)分开。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams: 使用 `groupAllowFrom`(后备:显式 `allowFrom`)。
- Discord: 允许列表使用 `channels.discord.guilds.<id>.channels`。
- Slack: 允许列表使用 `channels.slack.channels`。
- Matrix: 允许列表使用 `channels.matrix.groups`(room IDs、aliases 或 names)。使用 `channels.matrix.groupAllowFrom` 限制发送者;也支持每个 room 的 `users` 允许列表。
- Group DMs 单独控制(`channels.discord.dm.*`、`channels.slack.dm.*`)。
- Telegram 允许列表可以匹配用户 IDs(`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`)或 usernames(`"@alice"` 或 `"alice"`);前缀不区分大小写。
- 默认为 `groupPolicy: "allowlist"`;如果你的 group 允许列表为空,则 group 消息被阻止。

快速心智模型(group 消息的评估顺序):
1) `groupPolicy` (open/disabled/allowlist)
2) group 允许列表(`*.groups`、`*.groupAllowFrom`、channel 特定的允许列表)
3) mention gating(`requireMention`、`/activation`)

## Mention gating (默认)
Group 消息需要 mention,除非按 group 覆盖。默认值位于 `*.groups."*"` 下的每个子系统中。

回复 bot 消息算作隐式 mention(当 channel 支持 reply 元数据时)。这适用于 Telegram、WhatsApp、Slack、Discord 和 Microsoft Teams。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false }
      }
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false }
      }
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false }
      }
    }
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50
        }
      }
    ]
  }
}
```

注意:
- `mentionPatterns` 是不区分大小写的 regexes。
- 提供显式 mentions 的表面仍然通过;patterns 是后备。
- Per-agent 覆盖:`agents.list[].groupChat.mentionPatterns`(当多个 agents 共享一个 group 时很有用)。
- Mention gating 仅在可以进行 mention 检测时强制执行(配置了 native mentions 或 `mentionPatterns`)。
- Discord 默认值位于 `channels.discord.guilds."*"`(可按 guild/channel 覆盖)。
- Group history context 在 channels 之间统一包装,并且是 **仅待处理**(由于 mention gating 而跳过的消息);使用 `messages.groupChat.historyLimit` 作为全局默认值,使用 `channels.<channel>.historyLimit`(或 `channels.<channel>.accounts.*.historyLimit`)进行覆盖。设置 `0` 以禁用。

## Group/channel tool 限制(可选)
某些 channel 配置支持限制 **特定 group/room/channel 内** 可用的工具。

- `tools`: 允许/拒绝整个 group 的工具。
- `toolsBySender`: group 内的每个发送者覆盖(键是发送者 IDs/usernames/emails/phone numbers,具体取决于 channel)。使用 `"*"` 作为通配符。

解析顺序(最具体的获胜):
1) group/channel `toolsBySender` 匹配
2) group/channel `tools`
3) 默认(`"*"`) `toolsBySender` 匹配
4) 默认(`"*"`) `tools`

示例(Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "123456789": { alsoAllow: ["exec"] }
          }
        }
      }
    }
  }
}
```

注意:
- Group/channel tool 限制除了全局/agent tool policy 之外应用(deny 仍然获胜)。
- 某些 channels 对 rooms/channels 使用不同的嵌套(例如,Discord `guilds.*.channels.*`、Slack `channels.*`、MS Teams `teams.*.channels.*`)。

## Group 允许列表
当配置 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时,键充当 group 允许列表。使用 `"*"` 允许所有 groups,同时仍设置默认 mention 行为。

常见意图(复制/粘贴):

1) 禁用所有 group 回复
```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } }
}
```

2) 仅允许特定 groups(WhatsApp)
```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false }
      }
    }
  }
}
```

3) 允许所有 groups 但需要 mention(显式)
```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } }
    }
  }
}
```

4) 仅所有者可以在 groups 中触发(WhatsApp)
```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } }
    }
  }
}
```

## Activation(仅所有者)
Group 所有者可以切换每个 group 的 activation:
- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom`(或未设置时 bot 的自身 E.164)确定。将命令作为独立消息发送。其他表面目前忽略 `/activation`。

## Context 字段
Group 入站 payloads 设置:
- `ChatType=group`
- `GroupSubject`(如果已知)
- `GroupMembers`(如果已知)
- `WasMentioned` (mention gating 结果)
- Telegram forum topics 还包括 `MessageThreadId` 和 `IsForum`。

Agent system prompt 在新 group session 的第一个回合中包含 group 介绍。它提醒 model 像人类一样响应,避免 Markdown 表格,并避免输入文字 `\n` 序列。

## iMessage 特定信息
- 路由或允许列表时更喜欢 `chat_id:<id>`。
- 列出聊天:`imsg chats --limit 20`。
- Group 回复始终返回相同的 `chat_id`。

## WhatsApp 特定信息
参见 [Group messages](/zh/concepts/group-messages) 了解 WhatsApp 特有的行为(history 注入、mention 处理详细信息)。
