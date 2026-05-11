---
mmh3_hash: "ba4ff4a912e899db78138b45f09a6cae"
summary: "跨界面（Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo）的群聊行为"
read_when:
  - 更改群聊行为或提及门控
title: "群组"
sidebarTitle: "Groups"
---

OpenClaw 在各界面中一致处理群聊：Discord、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo。

## 新手入门（2 分钟）

OpenClaw"生活"在您自己的消息账户中。没有单独的 WhatsApp 机器人用户。如果**您**在一个群组中，OpenClaw 可以看到该群组并在那里响应。

默认行为：

- 群组受限（`groupPolicy: "allowlist"`）。
- 回复需要提及，除非您明确禁用提及门控。
- 群组/Channel 中的普通最终回复默认是私密的。可见的房间输出使用 `message` 工具。

翻译：白名单中的发送者可以通过提及来触发 OpenClaw。

<Note>
**TL;DR**

- **私信访问**由 `*.allowFrom` 控制。
- **群组访问**由 `*.groupPolicy` + 白名单（`*.groups`、`*.groupAllowFrom`）控制。
- **回复触发**由提及门控（`requireMention`、`/activation`）控制。

</Note>

快速流程（群组消息的处理流程）：

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## 可见回复

对于群组/Channel 房间，OpenClaw 默认使用 `messages.groupChat.visibleReplies: "message_tool"`。
`openclaw doctor --fix` 会将此默认值写入已配置 channel 的配置中（如果省略了此项）。
这意味着 agent 仍然处理该轮对话并可以更新内存/Session 状态，但其普通最终答案不会自动发布回房间。要可见地发言，agent 使用 `message(action=send)`。

此默认设置依赖于可靠调用工具的模型/运行时。如果日志显示
agent 文本但 `didSendViaMessagingTool: false`，说明模型给出了私密答案而不是
调用 message 工具。这不是 Discord/Slack/Telegram 发送失败。对群组/Channel
Session 使用可靠调用工具的模型，或设置
`messages.groupChat.visibleReplies: "automatic"` 以恢复旧版可见最终回复。

如果在当前工具策略下 message 工具不可用，OpenClaw 会
回退到自动可见回复，而不是静默抑制响应。
`openclaw doctor` 会对这种不匹配发出警告。

对于私信和任何其他来源的轮次，使用 `messages.visibleReplies: "message_tool"` 可全局应用相同的仅工具可见回复行为。Harness 也可以选择此作为其未设置的默认值；Codex harness 对 Codex 模式的直接聊天执行此操作。`messages.groupChat.visibleReplies` 仍然是群组/Channel 房间更具体的覆盖。

这替换了旧模式，不再强制模型对大多数潜伏模式轮次回答 `NO_REPLY`。在仅工具模式下，不做任何可见操作只需不调用 message 工具即可。

在仅工具模式下，当 agent 工作时仍会发送正在输入指示器。这些轮次的默认群组输入模式从"message"升级为"instant"，因为在 agent 决定是否调用 message 工具之前可能永远不会有普通 agent 消息文本。显式输入模式配置仍然优先。

恢复群组/Channel 房间的旧版自动最终回复：

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway 在保存文件后热重载 `messages` 配置。仅当部署中禁用了文件监视或配置重载时才需要重启。

要求所有来源聊天的可见输出都通过 message 工具：

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

原生斜杠命令（Discord、Telegram 和其他支持原生命令的界面）绕过 `visibleReplies: "message_tool"` 并始终可见地回复，以便 Channel 原生命令 UI 获得预期的响应。这仅适用于已验证的原生命令轮次；文本输入的 `/...` 命令和普通聊天轮次仍遵循配置的群组默认值。

## 上下文可见性和白名单

群组安全涉及两种不同的控制：

- **触发授权**：谁可以触发 agent（`groupPolicy`、`groups`、`groupAllowFrom`、Channel 特定白名单）。
- **上下文可见性**：注入模型的补充上下文内容（回复文本、引用、线程历史、转发元数据）。

默认情况下，OpenClaw 优先考虑正常的聊天行为，并保持上下文基本上与接收到的一样。这意味着白名单主要决定谁可以触发操作，而不是对每个引用或历史片段的通用编辑边界。

<AccordionGroup>
  <Accordion title="当前行为因 Channel 而异">
    - 某些 Channel 已经在特定路径中对补充上下文应用基于发送者的过滤（例如 Slack 线程播种、Matrix 回复/线程查找）。
    - 其他 Channel 仍然按接收到的方式传递引用/回复/转发上下文。

  </Accordion>
  <Accordion title="加固方向（计划中）">
    - `contextVisibility: "all"`（默认）保持当前按接收到的行为。
    - `contextVisibility: "allowlist"` 将补充上下文过滤为白名单发送者。
    - `contextVisibility: "allowlist_quote"` 是 `allowlist` 加上一个显式引用/回复例外。

    在此加固模型跨 Channel 一致实施之前，预期各界面之间存在差异。

  </Accordion>
</AccordionGroup>

![群组消息流程](/images/groups-flow.svg)

如果您想要...

| 目标                               | 设置什么                                                      |
| ---------------------------------- | ------------------------------------------------------------- |
| 允许所有群组但只在 @提及时回复     | `groups: { "*": { requireMention: true } }`                   |
| 禁用所有群组回复                   | `groupPolicy: "disabled"`                                     |
| 只允许特定群组                     | `groups: { "<group-id>": { ... } }`（无 `"*"` 键）            |
| 只有您可以在群组中触发             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`    |
| 跨 Channel 复用一个受信任发送者集  | `groupAllowFrom: ["accessGroup:operators"]`                   |

有关可复用发送者白名单，请参阅[访问组](/channels/access-groups)。

## Session 键

- 群组 Session 使用 `agent:<agentId>:<channel>:group:<id>` Session 键（房间/Channel 使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛主题在群组 id 后添加 `:topic:<threadId>`，以便每个主题都有自己的 Session。
- 私信使用主 Session（或每发送者，如果已配置）。
- 群组 Session 跳过心跳。

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## 模式：个人私信 + 公共群组（单 Agent）

是的——如果您的"个人"流量是**私信**而您的"公共"流量是**群组**，这种方式效果很好。

原因：在单 agent 模式下，私信通常进入**主** Session 键（`agent:main:main`），而群组始终使用**非主** Session 键（`agent:main:<channel>:group:<id>`）。如果您使用 `mode: "non-main"` 启用沙箱，这些群组 Session 将在配置的沙箱后端中运行，而您的主私信 Session 保持在主机上。Docker 是您不选择时的默认后端。

这给您一个 agent"大脑"（共享工作区 + 内存），但有两种执行姿态：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具

<Note>
如果您需要真正独立的工作区/角色（"个人"和"公共"绝不能混合），请使用第二个 agent + 绑定。参见[多 Agent 路由](/concepts/multi-agent)。
</Note>

<Tabs>
  <Tab title="私信在主机，群组沙箱化">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // 群组/Channel 是非主 -> 沙箱化
            scope: "session", // 最强隔离（每个群组/Channel 一个容器）
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
  </Tab>
  <Tab title="群组只能看到白名单文件夹">
    想要"群组只能看到文件夹 X"而不是"无主机访问"？保持 `workspaceAccess: "none"` 并只将白名单路径挂载到沙箱中：

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

  </Tab>
</Tabs>

相关：

- 配置键和默认值：[Gateway 配置](/gateway/config-agents#agentsdefaultssandbox)
- 调试工具被阻止的原因：[Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱化](/gateway/sandboxing#custom-bind-mounts)

## 显示标签

- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
- `#room` 为房间/Channel 保留；群聊使用 `g-<slug>`（小写，空格 -> `-`，保留 `#@+._-`）。

## 群组策略

控制每个 Channel 的群组/房间消息处理方式：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // 数字 Telegram 用户 id（向导可以解析 @username）
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

| 策略          | 行为                                                    |
| ------------- | ------------------------------------------------------- |
| `"open"`      | 群组绕过白名单；提及门控仍然适用。                      |
| `"disabled"`  | 完全阻止所有群组消息。                                  |
| `"allowlist"` | 只允许匹配配置白名单的群组/房间。                       |

<AccordionGroup>
  <Accordion title="每 Channel 说明">
    - `groupPolicy` 与提及门控（需要 @提及）是分开的。
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo：使用 `groupAllowFrom`（回退：显式 `allowFrom`）。
    - Signal：`groupAllowFrom` 可以匹配入站 Signal 群组 id 或发送者电话/UUID。
    - 私信配对批准（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权仍需从配置白名单（如 `groupAllowFrom`）或该 Channel 记录的配置回退中显式授权。
    - Discord：白名单使用 `channels.discord.guilds.<id>.channels`。
    - Slack：白名单使用 `channels.slack.channels`。
    - Matrix：白名单使用 `channels.matrix.groups`。优先使用房间 ID 或别名；已加入房间的名称查找是尽力而为的，运行时会忽略未解析的名称。使用 `channels.matrix.groupAllowFrom` 限制发送者；也支持每房间 `users` 白名单。
    - 群组私信单独控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
    - Telegram 白名单可以匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
    - 默认为 `groupPolicy: "allowlist"`；如果您的群组白名单为空，群组消息将被阻止。
    - 运行时安全：当 Provider 块完全缺失（`channels.<provider>` 不存在）时，群组策略回退到失败关闭模式（通常为 `allowlist`），而不是继承 `channels.defaults.groupPolicy`。

  </Accordion>
</AccordionGroup>

快速思维模型（群组消息的评估顺序）：

<Steps>
  <Step title="groupPolicy">
    `groupPolicy`（open/disabled/allowlist）。
  </Step>
  <Step title="群组白名单">
    群组白名单（`*.groups`、`*.groupAllowFrom`、Channel 特定白名单）。
  </Step>
  <Step title="提及门控">
    提及门控（`requireMention`、`/activation`）。
  </Step>
</Steps>

## 提及门控（默认）

群组消息需要提及，除非每个群组覆盖。默认值位于 `*.groups."*"` 下的每个子系统中。

当 Channel 支持回复元数据时，回复 bot 消息被视为隐式提及。在公开引用元数据的 Channel 上，引用 bot 消息也可以算作隐式提及。当前内置案例包括 Telegram、WhatsApp、Slack、Discord、Microsoft Teams 和 ZaloUser。

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
  <Accordion title="提及门控说明">
    - `mentionPatterns` 是不区分大小写的安全正则表达式模式；无效模式和不安全的嵌套重复形式会被忽略。
    - 提供显式提及的界面仍然通过；模式是回退。
    - 每 agent 覆盖：`agents.list[].groupChat.mentionPatterns`（当多个 agent 共享一个群组时很有用）。
    - 只有在提及检测可能时才强制执行提及门控（配置了原生提及或 `mentionPatterns`）。
    - 将群组或发送者加入白名单不会禁用提及门控；当所有消息都应该触发时，将该群组的 `requireMention` 设置为 `false`。
    - 群聊提示上下文每次轮次都携带已解析的静默回复指令；工作区文件不应重复 `NO_REPLY` 机制。
    - 允许静默回复的群组将干净的空或仅推理的模型轮次视为静默，等同于 `NO_REPLY`。私信只有在显式允许直接静默回复时才会这样做；否则空回复仍然是失败的 agent 轮次。
    - Discord 默认值位于 `channels.discord.guilds."*"` 中（可每个公会/Channel 覆盖）。
    - 群组历史上下文在 Channel 间均匀包装。提及门控的群组保留待处理的跳过消息；始终开启的群组在 Channel 支持时也可能保留最近处理的房间消息。使用 `messages.groupChat.historyLimit` 作为全局默认值，使用 `channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设置 `0` 禁用。

  </Accordion>
</AccordionGroup>

## 群组/Channel 工具限制（可选）

某些 Channel 配置支持限制**特定群组/房间/Channel 内**可用的工具。

- `tools`：允许/拒绝整个群组的工具。
- `toolsBySender`：群组内每个发送者的覆盖。使用显式键前缀：`id:<senderId>`、`e164:<phone>`、`username:<handle>`、`name:<displayName>` 和 `"*"` 通配符。旧版无前缀键仍然被接受，仅作为 `id:` 匹配。

解析顺序（最具体的优先）：

<Steps>
  <Step title="群组 toolsBySender">
    群组/Channel `toolsBySender` 匹配。
  </Step>
  <Step title="群组 tools">
    群组/Channel `tools`。
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
群组/Channel 工具限制在全局/agent 工具策略之外应用（deny 仍然优先）。某些 Channel 对房间/Channel 使用不同的嵌套（例如 Discord `guilds.*.channels.*`、Slack `channels.*`、Microsoft Teams `teams.*.channels.*`）。
</Note>

## 群组白名单

当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，键充当群组白名单。使用 `"*"` 允许所有群组，同时仍然设置默认提及行为。

<Warning>
常见混淆：私信配对批准与群组授权不同。对于支持私信配对的 Channel，配对存储只解锁私信。群组命令仍然需要来自配置白名单（如 `groupAllowFrom` 或该 Channel 记录的配置回退）的显式群组发送者授权。
</Warning>

常见意图（复制/粘贴）：

<Tabs>
  <Tab title="禁用所有群组回复">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="只允许特定群组（WhatsApp）">
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
  <Tab title="仅所有者可触发（WhatsApp）">
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

群组所有者可以切换每个群组的激活：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 确定（或在未设置时由 bot 自己的 E.164 确定）。将命令作为独立消息发送。其他界面目前忽略 `/activation`。

## 上下文字段

群组入站载荷设置：

- `ChatType=group`
- `GroupSubject`（如果已知）
- `GroupMembers`（如果已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛主题还包括 `MessageThreadId` 和 `IsForum`。

Agent 系统提示在新群组 Session 的第一轮次包含群组介绍。它提醒模型像人类一样响应，避免 Markdown 表格，最小化空行并遵循正常聊天间距，以及避免输入字面 `\n` 序列。Channel 来源的群组名称和参与者标签被渲染为受保护的不信任元数据，而不是内联系统指令。

## iMessage 特定

- 路由或白名单时优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终返回到相同的 `chat_id`。

## WhatsApp 系统提示

有关规范的 WhatsApp 系统提示规则，包括群组和直接提示解析、通配符行为和账户覆盖语义，请参阅 [WhatsApp](/channels/whatsapp#system-prompts)。

## WhatsApp 特定

有关 WhatsApp 专属行为（历史注入、提及处理详情），请参阅[群组消息](/channels/group-messages)。

## 相关

- [广播组](/channels/broadcast-groups)
- [Channel 路由](/channels/channel-routing)
- [群组消息](/channels/group-messages)
- [Pairing](/channels/pairing)
