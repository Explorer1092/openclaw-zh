---
mmh3_hash: "da25955bca60f9d7eb713b5595e8faa8"
summary: "Socket 或 HTTP webhook 模式的 Slack 设置"
read_when: "设置 Slack 或调试 Slack socket/HTTP 模式时"
---

# Slack

## Socket 模式 (默认)

### 快速设置 (初学者)
1) 创建一个 Slack 应用并启用 **Socket Mode**。
2) 创建一个 **App Token** (`xapp-...`) 和 **Bot Token** (`xoxb-...`)。
3) 为 OpenClaw 设置 token 并启动 gateway。

最小配置:
```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-..."
    }
  }
}
```

### 设置步骤
1) 在 https://api.slack.com/apps 创建一个 Slack 应用 (From scratch)。
2) **Socket Mode** → 开启。然后前往 **Basic Information** → **App-Level Tokens** → **Generate Token and Scopes**,添加 `connections:write` 权限。复制 **App Token** (`xapp-...`)。
3) **OAuth & Permissions** → 添加 bot token scopes (使用下面的 manifest)。点击 **Install to Workspace**。复制 **Bot User OAuth Token** (`xoxb-...`)。
4) 可选: **OAuth & Permissions** → 添加 **User Token Scopes** (查看下面的只读列表)。重新安装应用并复制 **User OAuth Token** (`xoxp-...`)。
5) **Event Subscriptions** → 启用事件并订阅:
   - `message.*` (包括编辑/删除/主题广播)
   - `app_mention`
   - `reaction_added`, `reaction_removed`
   - `member_joined_channel`, `member_left_channel`
   - `channel_rename`
   - `pin_added`, `pin_removed`
6) 邀请 bot 加入你希望它读取的频道。
7) Slash Commands → 如果使用 `channels.slack.slashCommand`,创建 `/openclaw`。如果启用原生命令,为每个内置命令添加一个 slash command (与 `/help` 中的名称相同)。除非设置 `channels.slack.commands.native: true`,否则 Slack 的原生命令默认关闭 (全局 `commands.native` 为 `"auto"`,Slack 保持关闭)。
8) App Home → 启用 **Messages Tab**,以便用户可以私信 bot。

使用下面的 manifest 以保持 scopes 和 events 同步。

多账户支持: 使用 `channels.slack.accounts`,为每个账户配置 token 和可选的 `name`。查看 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) 了解共享模式。

### OpenClaw 配置 (最小)

通过环境变量设置 token (推荐):
- `SLACK_APP_TOKEN=xapp-...`
- `SLACK_BOT_TOKEN=xoxb-...`

或通过配置文件:

```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-..."
    }
  }
}
```

### User token (可选)
OpenClaw 可以使用 Slack user token (`xoxp-...`) 进行读取操作 (历史记录、
置顶、反应、emoji、成员信息)。默认情况下保持只读: 存在 user token 时读取操作优先使用它,
写入操作仍使用 bot token,除非你明确选择启用。即使设置 `userTokenReadOnly: false`,
当 bot token 可用时,写入操作仍优先使用它。

User token 在配置文件中配置 (不支持环境变量)。对于多账户,
设置 `channels.slack.accounts.<id>.userToken`。

使用 bot + app + user tokens 的示例:
```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-...",
      userToken: "xoxp-..."
    }
  }
}
```

显式设置 userTokenReadOnly 的示例 (允许 user token 写入):
```json5
{
  channels: {
    slack: {
      enabled: true,
      appToken: "xapp-...",
      botToken: "xoxb-...",
      userToken: "xoxp-...",
      userTokenReadOnly: false
    }
  }
}
```

#### Token 使用规则
- 读取操作 (历史记录、反应列表、置顶列表、emoji 列表、成员信息、
  搜索) 在配置了 user token 时优先使用它,否则使用 bot token。
- 写入操作 (发送/编辑/删除消息、添加/移除反应、置顶/取消置顶、
  文件上传) 默认使用 bot token。如果 `userTokenReadOnly: false` 且
  没有可用的 bot token,OpenClaw 会回退到 user token。

### 历史上下文
- `channels.slack.historyLimit` (或 `channels.slack.accounts.*.historyLimit`) 控制提示词中包含多少条最近的频道/群组消息。
- 回退到 `messages.groupChat.historyLimit`。设置 `0` 禁用 (默认 50)。

## HTTP 模式 (Events API)
当你的 Gateway 可通过 HTTPS 被 Slack 访问时使用 HTTP webhook 模式 (典型的服务器部署)。
HTTP 模式使用 Events API + Interactivity + Slash Commands,共享同一个请求 URL。

### 设置步骤
1) 创建一个 Slack 应用并**禁用 Socket Mode** (如果只使用 HTTP 则可选)。
2) **Basic Information** → 复制 **Signing Secret**。
3) **OAuth & Permissions** → 安装应用并复制 **Bot User OAuth Token** (`xoxb-...`)。
4) **Event Subscriptions** → 启用事件并将 **Request URL** 设置为你的 gateway webhook 路径 (默认 `/slack/events`)。
5) **Interactivity & Shortcuts** → 启用并设置相同的 **Request URL**。
6) **Slash Commands** → 为你的命令设置相同的 **Request URL**。

示例请求 URL:
`https://gateway-host/slack/events`

### OpenClaw 配置 (最小)
```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events"
    }
  }
}
```

多账户 HTTP 模式: 设置 `channels.slack.accounts.<id>.mode = "http"` 并为每个账户提供唯一的
`webhookPath`,以便每个 Slack 应用可以指向其自己的 URL。

### Manifest (可选)
使用此 Slack 应用 manifest 快速创建应用 (如需要可调整名称/命令)。如果计划配置 user token,
请包含 user scopes。

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": false
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "channels:history",
        "channels:read",
        "groups:history",
        "groups:read",
        "groups:write",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "users:read",
        "app_mentions:read",
        "reactions:read",
        "reactions:write",
        "pins:read",
        "pins:write",
        "emoji:read",
        "commands",
        "files:read",
        "files:write"
      ],
      "user": [
        "channels:history",
        "channels:read",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "users:read",
        "reactions:read",
        "pins:read",
        "emoji:read",
        "search:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "reaction_added",
        "reaction_removed",
        "member_joined_channel",
        "member_left_channel",
        "channel_rename",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

如果启用原生命令,为每个要公开的命令添加一个 `slash_commands` 条目 (匹配 `/help` 列表)。使用 `channels.slack.commands.native` 覆盖。

## Scopes (当前 vs 可选)
Slack 的 Conversations API 按类型划分权限范围: 你只需要实际使用的会话类型
(channels, groups, im, mpim) 的权限。查看
https://docs.slack.dev/apis/web-api/using-the-conversations-api/ 了解概述。

### Bot token scopes (必需)
- `chat:write` (通过 `chat.postMessage` 发送/更新/删除消息)
  https://docs.slack.dev/reference/methods/chat.postMessage
- `im:write` (通过 `conversations.open` 打开用户私信)
  https://docs.slack.dev/reference/methods/conversations.open
- `channels:history`, `groups:history`, `im:history`, `mpim:history`
  https://docs.slack.dev/reference/methods/conversations.history
- `channels:read`, `groups:read`, `im:read`, `mpim:read`
  https://docs.slack.dev/reference/methods/conversations.info
- `users:read` (用户查询)
  https://docs.slack.dev/reference/methods/users.info
- `reactions:read`, `reactions:write` (`reactions.get` / `reactions.add`)
  https://docs.slack.dev/reference/methods/reactions.get
  https://docs.slack.dev/reference/methods/reactions.add
- `pins:read`, `pins:write` (`pins.list` / `pins.add` / `pins.remove`)
  https://docs.slack.dev/reference/scopes/pins.read
  https://docs.slack.dev/reference/scopes/pins.write
- `emoji:read` (`emoji.list`)
  https://docs.slack.dev/reference/scopes/emoji.read
- `files:write` (通过 `files.uploadV2` 上传)
  https://docs.slack.dev/messaging/working-with-files/#upload

### User token scopes (可选,默认只读)
如果配置 `channels.slack.userToken`,在 **User Token Scopes** 下添加这些权限。

- `channels:history`, `groups:history`, `im:history`, `mpim:history`
- `channels:read`, `groups:read`, `im:read`, `mpim:read`
- `users:read`
- `reactions:read`
- `pins:read`
- `emoji:read`
- `search:read`

### 目前不需要 (但可能在未来需要)
- `mpim:write` (仅当我们添加通过 `conversations.open` 打开群组私信/开始私信时)
- `groups:write` (仅当我们添加私有频道管理: 创建/重命名/邀请/归档时)
- `chat:write.public` (仅当我们想发送到 bot 未加入的频道时)
  https://docs.slack.dev/reference/scopes/chat.write.public
- `users:read.email` (仅当我们需要从 `users.info` 获取邮箱字段时)
  https://docs.slack.dev/changelog/2017-04-narrowing-email-access
- `files:read` (仅当我们开始列出/读取文件元数据时)

## 配置
Slack 仅使用 Socket Mode (无 HTTP webhook 服务器)。提供两个 token:

```json
{
  "slack": {
    "enabled": true,
    "botToken": "xoxb-...",
    "appToken": "xapp-...",
    "groupPolicy": "allowlist",
    "dm": {
      "enabled": true,
      "policy": "pairing",
      "allowFrom": ["U123", "U456", "*"],
      "groupEnabled": false,
      "groupChannels": ["G123"],
      "replyToMode": "all"
    },
    "channels": {
      "C123": { "allow": true, "requireMention": true },
      "#general": {
        "allow": true,
        "requireMention": true,
        "users": ["U123"],
        "skills": ["search", "docs"],
        "systemPrompt": "Keep answers short."
      }
    },
    "reactionNotifications": "own",
    "reactionAllowlist": ["U123"],
    "replyToMode": "off",
    "actions": {
      "reactions": true,
      "messages": true,
      "pins": true,
      "memberInfo": true,
      "emojiList": true
    },
    "slashCommand": {
      "enabled": true,
      "name": "openclaw",
      "sessionPrefix": "slack:slash",
      "ephemeral": true
    },
    "textChunkLimit": 4000,
    "mediaMaxMb": 20
  }
}
```

Token 也可以通过环境变量提供:
- `SLACK_BOT_TOKEN`
- `SLACK_APP_TOKEN`

确认反应通过 `messages.ackReaction` +
`messages.ackReactionScope` 全局控制。使用 `messages.removeAckAfterReply`
在 bot 回复后清除确认反应。

## 限制
- 出站文本分块为 `channels.slack.textChunkLimit` (默认 4000)。
- 可选换行分块: 设置 `channels.slack.chunkMode="newline"` 以在长度分块之前按空行 (段落边界) 分割。
- 媒体上传受 `channels.slack.mediaMaxMb` 限制 (默认 20)。

## 回复线程
默认情况下,OpenClaw 在主频道中回复。使用 `channels.slack.replyToMode` 控制自动线程:

| 模式 | 行为 |
| --- | --- |
| `off` | **默认。** 在主频道回复。仅当触发消息已在线程中时才使用线程。 |
| `first` | 首次回复进入线程 (在触发消息下),后续回复进入主频道。适用于保持上下文可见同时避免线程混乱。 |
| `all` | 所有回复进入线程。保持对话集中但可能降低可见性。 |

该模式适用于自动回复和 agent tool 调用 (`slack sendMessage`)。

### 按聊天类型的线程设置
你可以通过设置 `channels.slack.replyToModeByChatType` 为每种聊天类型配置不同的线程行为:

```json5
{
  channels: {
    slack: {
      replyToMode: "off",        // 频道的默认值
      replyToModeByChatType: {
        direct: "all",           // 私信始终使用线程
        group: "first"           // 群组私信/MPIM 首次回复使用线程
      },
    }
  }
}
```

支持的聊天类型:
- `direct`: 1对1私信 (Slack `im`)
- `group`: 群组私信 / MPIM (Slack `mpim`)
- `channel`: 标准频道 (公开/私有)

优先级:
1) `replyToModeByChatType.<chatType>`
2) `replyToMode`
3) 提供商默认值 (`off`)

当未设置聊天类型覆盖时,旧版 `channels.slack.dm.replyToMode` 仍作为 `direct` 的回退值接受。

示例:

仅私信使用线程:
```json5
{
  channels: {
    slack: {
      replyToMode: "off",
      replyToModeByChatType: { direct: "all" }
    }
  }
}
```

群组私信使用线程但频道保持在根级别:
```json5
{
  channels: {
    slack: {
      replyToMode: "off",
      replyToModeByChatType: { group: "first" }
    }
  }
}
```

频道使用线程,私信保持在根级别:
```json5
{
  channels: {
    slack: {
      replyToMode: "first",
      replyToModeByChatType: { direct: "off", group: "off" }
    }
  }
}
```

### 手动线程标签
为了精细控制,在 agent 响应中使用这些标签:
- `[[reply_to_current]]` — 回复触发消息 (开始/继续线程)。
- `[[reply_to:<id>]]` — 回复特定消息 id。

## Sessions + 路由
- 私信共享 `main` session (类似 WhatsApp/Telegram)。
- 频道映射到 `agent:<agentId>:slack:channel:<channelId>` sessions。
- Slash commands 使用 `agent:<agentId>:slack:slash:<userId>` sessions (前缀可通过 `channels.slack.slashCommand.sessionPrefix` 配置)。
- 如果 Slack 未提供 `channel_type`,OpenClaw 根据频道 ID 前缀 (`D`, `C`, `G`) 推断,默认为 `channel` 以保持 session key 稳定。
- 原生命令注册使用 `commands.native` (全局默认 `"auto"` → Slack 关闭),可通过 `channels.slack.commands.native` 按工作空间覆盖。文本命令需要独立的 `/...` 消息,可通过 `commands.text: false` 禁用。Slack slash commands 在 Slack 应用中管理,不会自动移除。使用 `commands.useAccessGroups: false` 绕过命令的访问组检查。
- 完整命令列表 + 配置: [Slash commands](/tools/slash-commands)

## 私信安全 (配对)
- 默认: `channels.slack.dm.policy="pairing"` — 未知私信发送者获得配对码 (1小时后过期)。
- 通过以下方式批准: `openclaw pairing approve slack <code>`。
- 允许任何人: 设置 `channels.slack.dm.policy="open"` 和 `channels.slack.dm.allowFrom=["*"]`。
- `channels.slack.dm.allowFrom` 接受用户 ID、@handles 或邮箱 (在 token 允许时启动时解析)。配置向导接受用户名并在 token 允许时在设置期间将其解析为 id。

## 群组策略
- `channels.slack.groupPolicy` 控制频道处理 (`open|disabled|allowlist`)。
- `allowlist` 要求频道列在 `channels.slack.channels` 中。
 - 如果仅设置 `SLACK_BOT_TOKEN`/`SLACK_APP_TOKEN` 且从未创建 `channels.slack` 部分,
   运行时将 `groupPolicy` 默认为 `open`。添加 `channels.slack.groupPolicy`、
   `channels.defaults.groupPolicy` 或频道白名单来锁定它。
 - 配置向导接受 `#channel` 名称并在可能时将其解析为 ID
   (公开 + 私有); 如果存在多个匹配项,优先选择活动频道。
 - 启动时,OpenClaw 将白名单中的频道/用户名解析为 ID (当 token 允许时)
   并记录映射; 未解析的条目保持原样。
 - 要**不允许任何频道**,设置 `channels.slack.groupPolicy: "disabled"` (或保持空白名单)。

频道选项 (`channels.slack.channels.<id>` 或 `channels.slack.channels.<name>`):
- `allow`: 当 `groupPolicy="allowlist"` 时允许/拒绝频道。
- `requireMention`: 频道的提及门控。
- `tools`: 可选的每频道 tool 策略覆盖 (`allow`/`deny`/`alsoAllow`)。
- `toolsBySender`: 可选的频道内每发送者 tool 策略覆盖 (键为发送者 id/@handles/邮箱; 支持 `"*"` 通配符)。
- `allowBots`: 允许此频道中 bot 创作的消息 (默认: false)。
- `users`: 可选的每频道用户白名单。
- `skills`: 技能过滤器 (省略 = 所有技能,空 = 无)。
- `systemPrompt`: 频道的额外系统提示词 (与主题/目的结合)。
- `enabled`: 设置 `false` 禁用频道。

## 传递目标
在 cron/CLI 发送时使用:
- `user:<id>` 用于私信
- `channel:<id>` 用于频道

## Tool 操作
Slack tool 操作可通过 `channels.slack.actions.*` 门控:

| 操作组 | 默认 | 说明 |
| --- | --- | --- |
| reactions | 启用 | 反应 + 列出反应 |
| messages | 启用 | 读取/发送/编辑/删除 |
| pins | 启用 | 置顶/取消置顶/列出 |
| memberInfo | 启用 | 成员信息 |
| emojiList | 启用 | 自定义 emoji 列表 |

## 安全注意事项
- 写入默认使用 bot token,因此状态更改操作保持在应用的 bot 权限和身份范围内。
- 设置 `userTokenReadOnly: false` 允许在没有可用 bot token 时使用 user token 进行写入
  操作,这意味着操作以安装用户的访问权限运行。将 user token 视为高度特权并保持
  操作门控和白名单严格。
- 如果启用 user-token 写入,确保 user token 包含你期望的写入
  scopes (`chat:write`, `reactions:write`, `pins:write`,
  `files:write`),否则这些操作将失败。

## 注意事项
- 提及门控通过 `channels.slack.channels` 控制 (将 `requireMention` 设置为 `true`); `agents.list[].groupChat.mentionPatterns` (或 `messages.groupChat.mentionPatterns`) 也计为提及。
- 多 agent 覆盖: 在 `agents.list[].groupChat.mentionPatterns` 上设置每 agent 的模式。
- 反应通知遵循 `channels.slack.reactionNotifications` (在模式 `allowlist` 下使用 `reactionAllowlist`)。
- Bot 创作的消息默认被忽略; 通过 `channels.slack.allowBots` 或 `channels.slack.channels.<id>.allowBots` 启用。
- 警告: 如果允许回复其他 bot (`channels.slack.allowBots=true` 或 `channels.slack.channels.<id>.allowBots=true`),使用 `requireMention`、`channels.slack.channels.<id>.users` 白名单和/或 `AGENTS.md` 和 `SOUL.md` 中的明确防护措施来防止 bot 到 bot 的回复循环。
- 对于 Slack tool,反应移除语义在 [/tools/reactions](/tools/reactions) 中。
- 附件在允许且在大小限制内时下载到媒体存储。