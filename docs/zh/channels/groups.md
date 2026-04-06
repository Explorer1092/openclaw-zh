---
mmh3_hash: "99dca46d04452ca80df86e4b811d614a"
summary: "跨界面（WhatsApp/Telegram/Discord/Slack/Signal/iMessage/Microsoft Teams/Zalo）的群聊行为"
read_when:
  - 更改群聊行为或提及门控
title: "群组"
---

# 群组

OpenClaw 在各界面中一致处理群聊：WhatsApp、Telegram、Discord、Slack、Signal、iMessage、Microsoft Teams、Zalo。

## 新手入门（2 分钟）

OpenClaw"生活"在您自己的消息账户中。没有单独的 WhatsApp 机器人用户。
如果**您**在一个群组中，OpenClaw 可以看到该群组并在那里响应。

默认行为：

- 群组受限（`groupPolicy: "allowlist"`）。
- 回复需要提及，除非您明确禁用提及门控。

翻译：allowlist 中的发送者可以通过提及来触发 OpenClaw。

> TL;DR
>
> - **私信访问**由 `*.allowFrom` 控制。
> - **群组访问**由 `*.groupPolicy` + allowlist（`*.groups`、`*.groupAllowFrom`）控制。
> - **回复触发**由提及门控（`requireMention`、`/activation`）控制。

快速流程（群组消息发生了什么）：

```
groupPolicy? disabled -> 丢弃
groupPolicy? allowlist -> 群组允许？ 否 -> 丢弃
requireMention? yes -> 被提及？ 否 -> 仅存储为上下文
否则 -> 回复
```

## 上下文可见性和 allowlist

群组安全涉及两个不同的控制：

- **触发授权**：谁可以触发 Agent（`groupPolicy`、`groups`、`groupAllowFrom`、特定 Channel 的 allowlist）。
- **上下文可见性**：哪些补充上下文被注入到模型中（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先考虑正常聊天行为，并保持上下文基本上按接收到的状态。这意味着 allowlist 主要决定谁可以触发操作，而不是对每条引用或历史片段的通用编辑边界。

当前行为是特定于 Channel 的：

- 某些 Channel 已在特定路径中对补充上下文应用基于发送者的过滤（例如 Slack 线程播种、Matrix 回复/线程查找）。
- 其他 Channel 仍按接收到的状态传递引用/回复/转发上下文。

加固方向（计划中）：

- `contextVisibility: "all"`（默认）保持当前的按接收状态行为。
- `contextVisibility: "allowlist"` 将补充上下文过滤为 allowlist 中的发送者。
- `contextVisibility: "allowlist_quote"` 是 `allowlist` 加上一个显式的引用/回复例外。

在此加固模型在各 Channel 中一致实施之前，预期不同平台之间会有差异。

![群组消息流程](/images/groups-flow.svg)

如果您想...

| 目标 | 设置什么 |
| --- | --- |
| 允许所有群组但只在 @提及时回复 | `groups: { "*": { requireMention: true } }` |
| 禁用所有群组回复 | `groupPolicy: "disabled"` |
| 仅特定群组 | `groups: { "<group-id>": { ... } }`（不含 `"*"` 键） |
| 只有您能在群组中触发 | `groupPolicy: "allowlist"`，`groupAllowFrom: ["+1555..."]` |

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/频道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛主题在群组 ID 中添加 `:topic:<threadId>`，使每个主题有自己的会话。
- 直接聊天使用主会话（或配置了的每发送者会话）。
- 群组会话跳过心跳。

## 模式：个人私信 + 公共群组（单 agent）

是的——如果您的"个人"流量是**私信**而"公共"流量是**群组**，这种方式效果很好。

原因：在单 agent 模式下，私信通常落在 **main** 会话键（`agent:main:main`）中，而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果您使用 `mode: "non-main"` 启用沙箱，这些群组会话在 Docker 中运行，而您的主私信会话保持在主机上。

这给您一个 agent"大脑"（共享工作区 + 记忆），但有两种执行姿态：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具（Docker）

> 如果您需要真正独立的工作区/角色（"个人"和"公共"绝不混用），使用第二个 agent + 绑定。参见 [Multi-Agent Routing](/concepts/multi-agent)。

示例（私信在主机，群组沙箱化 + 仅消息工具）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // 群组/频道是非主 -> 沙箱化
        scope: "session", // 最强隔离（每个群组/频道一个容器）
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // 如果 allow 非空，其他一切都被阻止（deny 仍然优先）。
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

想要"群组只能看到文件夹 X"而不是"没有主机访问"？保持 `workspaceAccess: "none"` 并只将 allowlist 中的路径挂载到沙箱中：

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
            // 主机路径:容器路径:模式
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

相关：

- 配置键和默认值：[Gateway 配置](/gateway/configuration-reference#agentsdefaultssandbox)
- 调试工具为何被阻止：[Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
- `#room` 为房间/频道保留；群聊使用 `g-<slug>`（小写，空格 -> `-`，保留 `#@+._-`）。

## 群组策略

控制每个 Channel 如何处理群组/房间消息：

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

| 策略 | 行为 |
| --- | --- |
| `"open"` | 群组绕过 allowlist；提及门控仍然适用。 |
| `"disabled"` | 完全阻止所有群组消息。 |
| `"allowlist"` | 只允许匹配配置 allowlist 的群组/房间。 |

注意：

- `groupPolicy` 与提及门控（需要 @提及）是分开的。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退：显式的 `allowFrom`）。
- 私信配对批准（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权保持对群组 allowlist 明确。
- Discord：allowlist 使用 `channels.discord.guilds.<id>.channels`。
- Slack：allowlist 使用 `channels.slack.channels`。
- Matrix：allowlist 使用 `channels.matrix.groups`（房间 ID、别名或名称）。使用 `channels.matrix.groupAllowFrom` 限制发送者；也支持每房间 `users` allowlist。
- 群组私信分开控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
- Telegram allowlist 可以匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
- 默认为 `groupPolicy: "allowlist"`；如果您的群组 allowlist 为空，群组消息被阻止。
- 运行时安全：当 provider 块完全缺失（`channels.<provider>` 不存在）时，群组策略回退到失败关闭模式（通常为 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

群组消息的快速评估顺序：

1. `groupPolicy`（open/disabled/allowlist）
2. 群组 allowlist（`*.groups`、`*.groupAllowFrom`、特定 Channel 的 allowlist）
3. 提及门控（`requireMention`、`/activation`）

## 提及门控（默认）

群组消息需要提及，除非按群组覆盖。默认值在每个子系统的 `*.groups."*"` 下。

回复 bot 消息算作隐式提及（当 Channel 支持回复元数据时）。这适用于 Telegram、WhatsApp、Slack、Discord 和 Microsoft Teams。

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

- `mentionPatterns` 是不区分大小写的安全正则表达式模式；无效模式和不安全的嵌套重复形式会被忽略。
- 提供显式提及的界面仍然通过；模式是回退。
- 每 agent 覆盖：`agents.list[].groupChat.mentionPatterns`（当多个 agent 共享一个群组时很有用）。
- 只有当提及检测可能时（原生提及或 `mentionPatterns` 已配置），才强制执行提及门控。
- Discord 默认在 `channels.discord.guilds."*"` 中（可按公会/频道覆盖）。
- 群组历史上下文在各 Channel 中一致包装，且**仅限待处理**（因提及门控而跳过的消息）；使用 `messages.groupChat.historyLimit` 作为全局默认值，使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设置 `0` 禁用。

## 群组/频道工具限制（可选）

某些 Channel 配置支持限制**特定群组/房间/频道**内可用的工具。

- `tools`：允许/拒绝整个群组的工具。
- `toolsBySender`：群组内每发送者的覆盖。
  使用显式键前缀：
  `id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 通配符。
  旧版无前缀键仍然接受，仅作为 `id:` 匹配。

解析顺序（最具体的优先）：

1. 群组/频道 `toolsBySender` 匹配
2. 群组/频道 `tools`
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

- 群组/频道工具限制在全局/agent 工具策略之外应用（deny 仍然优先）。
- 某些 Channel 对房间/频道使用不同的嵌套（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。

## 群组 allowlist

配置 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，键充当群组 allowlist。使用 `"*"` 允许所有群组，同时仍设置默认提及行为。

常见混淆：DM 配对批准与群组授权不同。
对于支持 DM 配对的 Channel，配对存储仅解锁 DM。群组命令仍需要来自配置 allowlist（如 `groupAllowFrom` 或该 Channel 的文档化配置回退）的显式群组发送者授权。

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

3. 允许所有群组但需要提及（明确）

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. 只有所有者能在群组中触发（WhatsApp）

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

群组所有者可以切换每群组的激活：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 确定（未设置时使用 bot 自身的 E.164）。将命令作为独立消息发送。其他界面目前忽略 `/activation`。

## 上下文字段

群组入站负载设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛主题还包含 `MessageThreadId` 和 `IsForum`。

特定 Channel 说明：

- BlueBubbles 可以选择在正常群组门控通过后从本地联系人数据库丰富未命名的 macOS 群组参与者，然后填充 `GroupMembers`。这默认关闭，仅在正常群组门控通过后运行。

Agent 系统提示在新群组会话的第一轮中包含群组介绍。它提醒模型像人一样响应，避免 Markdown 表格，最小化空行并遵循正常的聊天间距，避免输入字面 `\n` 序列。

## iMessage 特性

- 路由或 allowlist 时优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终返回到同一个 `chat_id`。

## WhatsApp 特性

参见 [群组消息](/channels/group-messages) 了解 WhatsApp 专用行为（历史注入、提及处理详情）。
