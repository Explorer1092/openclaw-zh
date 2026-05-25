---
mmh3_hash: "5473345f5f560fafc5b6067a3383ac21"
summary: "跨界面（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）的群聊行为"
read_when:
  - 更改群聊行为或提及门控
title: "Groups"
sidebarTitle: "Groups"
---

OpenClaw 在各界面中一致处理群聊：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

如需了解应提供安静上下文的常驻房间（除非 Agent 显式发送可见消息），请参阅[环境房间事件](/channels/ambient-room-events)。

## 初学者介绍（2 分钟）

OpenClaw"生活"在您自己的消息账户中。没有单独的 WhatsApp 机器人用户。如果**您**在一个群组中，OpenClaw 可以看到该群组并在那里回复。

默认行为：

- 群组是受限的（`groupPolicy: "allowlist"`）。
- 回复需要提及，除非您明确禁用提及门控。
- 默认情况下，群组/频道中的可见回复使用 `message` 工具。

简单来说：在 allowlist 中的发送者可以通过提及 OpenClaw 来触发它。

<Note>
**简要说明**

- **私信访问**由 `*.allowFrom` 控制。
- **群组访问**由 `*.groupPolicy` + allowlist（`*.groups`、`*.groupAllowFrom`）控制。
- **回复触发**由提及门控（`requireMention`、`/activation`）控制。

</Note>

快速流程（群组消息发生了什么）：

```
groupPolicy? disabled -> 丢弃
groupPolicy? allowlist -> 群组被允许? 否 -> 丢弃
requireMention? yes -> 被提及? 否 -> 仅作为上下文存储
提及/回复/命令/私信 -> 用户请求
始终开启的群组闲聊 -> 用户请求，或在配置时作为房间事件
```

## 可见回复

对于正常的群组/频道请求，OpenClaw 默认使用 `messages.groupChat.visibleReplies: "automatic"`。最终 assistant 文本通过传统可见回复路径发布，除非您将房间选择为仅 message-tool 输出。

当共享房间应该让 Agent 通过调用 `message(action=send)` 来决定何时发言时，使用 `messages.groupChat.visibleReplies: "message_tool"`。这最适合由最新一代、工具可靠性高的模型（如 GPT 5.5）支持的群组房间。如果模型错过了该工具并返回实质性的最终文本，OpenClaw 会将该最终文本保持私有而不是发布到房间中。

如果在活动工具策略下 message 工具不可用，OpenClaw 会回退到自动可见回复，而不是静默地抑制响应。`openclaw doctor` 会警告此不匹配情况。

对于直接聊天和其他任何源事件，使用 `messages.visibleReplies: "message_tool"` 在全局范围内应用相同的仅工具可见回复行为。包括 Codex 在内的某些 Harness 在未设置时也会将直接/源聊天默认为 message-tool 传递。设置 `messages.visibleReplies: "automatic"` 可强制使用旧的自动最终回复路径。`messages.groupChat.visibleReplies` 仍然是针对群组/频道房间的更具体的覆盖。

这取代了强制模型对大多数潜伏模式轮次回答 `NO_REPLY` 的旧模式。在仅工具模式下，不做可见操作仅意味着不调用 message 工具。

对于直接的群组请求，仍然发送打字指示器。当启用时，环境常驻房间事件保持严格且安静，除非 Agent 调用 message 工具。

要将未被提及的常驻群组闲聊作为安静的房间上下文而不是用户请求提交，使用[环境房间事件](/channels/ambient-room-events)：

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

默认值为 `unmentionedInbound: "user_request"`。

被提及的消息、命令、中止请求和私信仍为用户请求。

要求群组/频道请求的可见输出通过 message 工具：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Gateway 在文件保存后热重载 `messages` 配置。仅当部署中禁用文件监视或配置重载时才需要重启。

要求每个源聊天的可见输出通过 message 工具：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

原生斜杠命令（Discord、Telegram 及其他支持原生命令的界面）绕过 `visibleReplies: "message_tool"` 并始终可见地回复，以便频道原生命令 UI 获得预期的响应。这仅适用于经验证的原生命令轮次；文字输入的 `/...` 命令和普通聊天轮次仍遵循配置的群组默认值。

## 上下文可见性和 allowlist

群组安全涉及两种不同的控制：

- **触发授权**：谁可以触发 Agent（`groupPolicy`、`groups`、`groupAllowFrom`、Channel 特定 allowlist）。
- **上下文可见性**：向模型注入哪些补充上下文（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先保持正常的聊天行为，并尽可能按原样保留上下文。这意味着 allowlist 主要决定谁可以触发操作，而不是对每个引用或历史片段的通用编辑边界。

<AccordionGroup>
  <Accordion title="当前行为因 Channel 而异">
    - 某些 Channel 已经在特定路径中对补充上下文应用基于发送者的过滤（例如 Slack 线程种子、Matrix 回复/线程查找）。
    - 其他 Channel 仍然按原样传递引用/回复/转发上下文。

  </Accordion>
  <Accordion title="加固方向（计划中）">
    - `contextVisibility: "all"`（默认）保持当前的按原样接收行为。
    - `contextVisibility: "allowlist"` 将补充上下文过滤为 allowlist 中的发送者。
    - `contextVisibility: "allowlist_quote"` 是 `allowlist` 加上一个显式引用/回复例外。

    在此加固模型在各 Channel 中一致实现之前，预期不同界面之间存在差异。

  </Accordion>
</AccordionGroup>

![群组消息流程](/images/groups-flow.svg)

如果您想要…

| 目标                             | 设置方式                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| 允许所有群组但仅在 @提及时回复   | `groups: { "*": { requireMention: true } }`                 |
| 禁用所有群组回复                 | `groupPolicy: "disabled"`                                   |
| 仅特定群组                       | `groups: { "<group-id>": { ... } }`（无 `"*"` 键）          |
| 仅允许您在群组中触发             | `groupPolicy: "allowlist"`，`groupAllowFrom: ["+1555..."]`  |
| 跨 Channel 复用同一可信发送者集  | `groupAllowFrom: ["accessGroup:operators"]`                 |

有关可复用发送者 allowlist，请参阅[访问组](/channels/access-groups)。

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/频道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛话题在群组 ID 后追加 `:topic:<threadId>`，使每个话题拥有自己的会话。
- 直接聊天使用主会话（或在配置时按发送者分别保存）。
- 心跳为群组会话跳过。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公共群组（单 Agent）

是的——如果您的"个人"流量是**私信**，您的"公共"流量是**群组**，这种模式效果很好。

原因：在单 Agent 模式下，私信通常落在**主**会话键（`agent:main:main`）中，而群组始终使用**非主**会话键（`agent:main:<channel>:group:<id>`）。如果您使用 `mode: "non-main"` 启用沙箱，这些群组会话在配置的沙箱后端运行，而您的主私信会话保持在主机上。Docker 是默认后端（如果您没有选择其他）。

这给了您一个 Agent"大脑"（共享工作区 + 记忆），但两种执行姿态：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具

<Note>
如果您需要真正独立的工作区/角色（"个人"和"公共"绝对不能混合），请使用第二个 Agent + bindings。参见[多 Agent 路由](/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="主机上的私信，沙箱中的群组">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // 群组/频道是非主 -> 沙箱
            scope: "session", // 最强隔离（每个群组/频道一个容器）
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // 如果 allow 非空，则其他所有内容被阻止（deny 仍然优先）。
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="群组只能看到 allowlist 文件夹">
    想要"群组只能看到文件夹 X"而不是"无主机访问"？保持 `workspaceAccess: "none"` 并仅将 allowlist 路径挂载到沙箱中：

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

  </Tab>
</Tabs>

相关：

- 配置键和默认值：[Gateway 配置](/gateway/config-agents#agentsdefaultssandbox)
- 调试工具为何被阻止：[沙箱与工具策略与提升权限](/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱](/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
- `#room` 保留用于房间/频道；群聊使用 `g-<slug>`（小写，空格 -> `-`，保留 `#@+._-`）。

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
      groupAllowFrom: ["123456789"], // 数字 Telegram 用户 ID（向导可解析 @username）
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
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| 策略          | 行为                                             |
| ------------- | ------------------------------------------------ |
| `"open"`      | 群组绕过 allowlist；提及门控仍然适用。           |
| `"disabled"`  | 完全阻止所有群组消息。                           |
| `"allowlist"` | 仅允许匹配配置 allowlist 的群组/房间。           |

<AccordionGroup>
  <Accordion title="每 Channel 注意事项">
    - `groupPolicy` 与提及门控（需要 @提及）是分开的。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退：显式 `allowFrom`）。
    - Signal：`groupAllowFrom` 可以匹配入站 Signal 群组 ID 或发送者电话/UUID。
    - 私信配对批准（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权对群组 allowlist 保持显式。
    - Discord：allowlist 使用 `channels.discord.guilds.<id>.channels`。
    - Slack：allowlist 使用 `channels.slack.channels`。
    - Matrix：allowlist 使用 `channels.matrix.groups`。优先使用房间 ID 或别名；已加入房间的名称查找是尽力而为的，运行时忽略未解析的名称。使用 `channels.matrix.groupAllowFrom` 限制发送者；也支持每房间 `users` allowlist。
    - 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram allowlist 可以匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
    - 默认为 `groupPolicy: "allowlist"`；如果您的群组 allowlist 为空，群组消息将被阻止。
    - 运行时安全：当 Provider 块完全缺失（`channels.<provider>` 不存在）时，群组策略回退到失败关闭模式（通常为 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

  </Accordion>
</AccordionGroup>

群组消息的快速心理模型（评估顺序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="群组 allowlist">
    群组 allowlist（`*.groups`、`*.groupAllowFrom`、Channel 特定 allowlist）。
  </Step>
  <Step title="提及门控">
    提及门控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及门控（默认）

群组消息需要提及，除非按群组覆盖。默认值位于 `*.groups."*"` 下的每个子系统中。

在 Channel 支持回复元数据时，回复机器人消息算作隐式提及。在暴露引用元数据的 Channel 上，引用机器人消息也可以算作隐式提及。当前内置情况包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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

<AccordionGroup>
  <Accordion title="提及门控注意事项">
    - `mentionPatterns` 是不区分大小写的安全正则模式；无效模式和不安全的嵌套重复形式将被忽略。
    - 提供显式提及的界面仍然通过；模式是回退。
    - 每 Agent 覆盖：`agents.list[].groupChat.mentionPatterns`（当多个 Agent 共享一个群组时很有用）。
    - 仅在提及检测可行时才强制执行提及门控（配置了原生提及或 `mentionPatterns`）。
    - 将群组或发送者加入 allowlist 不会禁用提及门控；当所有消息都应该触发时，将该群组的 `requireMention` 设为 `false`。
    - 自动群聊提示上下文每轮都携带已解析的静默回复指令；工作区文件不应重复 `NO_REPLY` 机制。
    - 允许自动静默回复的群组将干净的空回复或仅推理的模型轮次视为静默，等效于 `NO_REPLY`。直接聊天从不接收 `NO_REPLY` 指导，仅工具消息的群组回复通过不调用 `message(action=send)` 保持安静。
    - 默认情况下，环境常驻群组闲聊使用用户请求语义。设置 `messages.groupChat.unmentionedInbound: "room_event"` 将其作为安静上下文提交。参见[环境房间事件](/channels/ambient-room-events)获取设置示例。
    - 房间事件不以假用户请求存储，来自无 message 工具房间事件的私有 assistant 文本不作为聊天历史重放。
    - Discord 默认值位于 `channels.discord.guilds."*"` 中（可按服务器/频道覆盖）。
    - 群组历史上下文在各 Channel 中统一包装。提及门控的群组保留待处理的已跳过消息；常驻群组在 Channel 支持时也可能保留最近处理的房间消息。使用 `messages.groupChat.historyLimit` 作为全局默认值，使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设置 `0` 禁用。

  </Accordion>
</AccordionGroup>

## 群组/频道工具限制（可选）

某些 Channel 配置支持限制**特定群组/房间/频道内**可用的工具。

- `tools`：允许/拒绝整个群组的工具。
- `toolsBySender`：群组内的每发送者覆盖。使用显式键前缀：`channel:<channelId>:<senderId>`、`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 通配符。Channel ID 使用规范的 OpenClaw Channel ID；`teams` 等别名规范化为 `msteams`。旧版无前缀键仍被接受，仅作为 `id:` 匹配。

解析顺序（最具体的优先）：

<Steps>
  <Step title="群组 toolsBySender">
    群组/频道 `toolsBySender` 匹配。
  </Step>
  <Step title="群组 tools">
    群组/频道 `tools`。
  </Step>
  <Step title="默认 toolsBySender">
    默认（`"*"`）`toolsBySender` 匹配。
  </Step>
  <Step title="默认 tools">
    默认（`"*"`）`tools`。
  </Step>
</Steps>

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

<Note>
群组/频道工具限制在全局/Agent 工具策略的基础上应用（deny 仍然优先）。某些 Channel 对房间/频道使用不同的嵌套方式（例如 Discord 的 `guilds.*.channels.*`、Slack 的 `channels.*`、Microsoft Teams 的 `teams.*.channels.*`）。
</Note>

## 群组 allowlist

当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，键充当群组 allowlist。使用 `"*"` 允许所有群组，同时仍设置默认提及行为。

<Warning>
常见混淆：私信配对批准与群组授权不同。对于支持私信配对的 Channel，配对存储仅解锁私信。群组命令仍然需要来自配置 allowlist（如 `groupAllowFrom` 或该 Channel 的记录配置回退）的显式群组发送者授权。
</Warning>

常用意图（可复制粘贴）：

<Tabs>
  <Tab title="禁用所有群组回复">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="仅允许特定群组（WhatsApp）">
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
  </Tab>
  <Tab title="允许所有群组但需要提及">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="仅所有者触发（WhatsApp）">
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
  </Tab>
</Tabs>

## 激活（仅所有者）

群组所有者可以切换每个群组的激活模式：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 确定（未设置时为机器人自身的 E.164）。以独立消息发送命令。其他界面目前忽略 `/activation`。

## 上下文字段

群组入站负载设置：

- `ChatType=group`
- `GroupSubject`（如已知）
- `GroupMembers`（如已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛话题还包括 `MessageThreadId` 和 `IsForum`。

Agent 系统提示在新群组会话的第一轮包含群组介绍。它提醒模型像人类一样回应，避免 Markdown 表格，尽量减少空行并遵循正常的聊天间距，以及避免输入字面量 `\n` 序列。Channel 来源的群组名称和参与者标签以受保护的不可信元数据形式呈现，而不是内联系统指令。

## iMessage 特性

- 路由或 allowlist 时优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终返回到同一 `chat_id`。

## WhatsApp 系统提示

有关规范的 WhatsApp 系统提示规则，包括群组和直接提示解析、通配符行为和账户覆盖语义，请参阅 [WhatsApp](/channels/whatsapp#system-prompts)。

## WhatsApp 特性

有关 WhatsApp 专有行为（历史注入、提及处理详情），请参阅[群组消息](/channels/group-messages)。

## 相关

- [Broadcast groups](/channels/broadcast-groups)
- [Channel routing](/channels/channel-routing)
- [Group messages](/channels/group-messages)
- [Pairing](/channels/pairing)
