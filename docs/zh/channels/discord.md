---
title: "Discord (Bot API)"
sidebarTitle: "Discord"
mmh3_hash: "ca6656560bfb61d2e830e49094a6f771"
summary: "Discord bot 支持状态、功能和配置"
read_when: ["使用 Discord 频道功能时"]
---
# Discord (Bot API)

状态：通过官方 Discord bot gateway 支持 DM 和公会文本频道。

## 快速设置（新手）
1) 创建一个 Discord bot 并复制 bot token。
2) 在 Discord 应用设置中，启用 **Message Content Intent**（如果计划使用白名单或名称查找，还需启用 **Server Members Intent**）。
3) 为 OpenClaw 设置 token：
   - 环境变量：`DISCORD_BOT_TOKEN=...`
   - 或配置：`channels.discord.token: "..."`。
   - 如果两者都设置，配置优先（环境变量回退仅用于默认账户）。
4) 使用消息权限邀请 bot 到服务器（如果只想要 DM，可以创建一个私人服务器）。
5) 启动 gateway。
6) DM 访问默认使用配对模式；首次联系时批准配对码。

最小配置：
```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN"
    }
  }
}
```

## 目标
- 通过 Discord DM 或公会频道与 OpenClaw 对话。
- 直接聊天会合并到 agent 的主会话（默认 `agent:main:main`）；公会频道保持隔离为 `agent:<agentId>:discord:channel:<channelId>`（显示名称使用 `discord:<guildSlug>#<channelSlug>`）。
- 群组 DM 默认被忽略；通过 `channels.discord.dm.groupEnabled` 启用，并可选择性地通过 `channels.discord.dm.groupChannels` 限制。
- 保持路由确定性：回复始终返回到消息来源频道。

## 工作原理
1. 创建 Discord 应用程序 → Bot，启用所需的 intents（DM + 公会消息 + 消息内容），获取 bot token。
2. 使用所需权限将 bot 邀请到服务器，以便在需要的地方读取/发送消息。
3. 使用 `channels.discord.token`（或 `DISCORD_BOT_TOKEN` 作为回退）配置 OpenClaw。
4. 运行 gateway；当 token 可用（配置优先，环境变量回退）且 `channels.discord.enabled` 不为 `false` 时，会自动启动 Discord 频道。
   - 如果更喜欢环境变量，设置 `DISCORD_BOT_TOKEN`（配置块是可选的）。
5. 直接聊天：投递时使用 `user:<id>`（或 `<@id>` 提及）；所有轮次都落在共享的 `main` 会话中。裸数字 ID 有歧义会被拒绝。
6. 公会频道：投递时使用 `channel:<channelId>`。默认需要提及，可以按公会或频道设置。
7. 直接聊天：通过 `channels.discord.dm.policy` 默认安全（默认：`"pairing"`）。未知发送者会收到配对码（1 小时后过期）；通过 `openclaw pairing approve discord <code>` 批准。
   - 保持旧的"对所有人开放"行为：设置 `channels.discord.dm.policy="open"` 和 `channels.discord.dm.allowFrom=["*"]`。
   - 使用硬白名单：设置 `channels.discord.dm.policy="allowlist"` 并在 `channels.discord.dm.allowFrom` 中列出发送者。
   - 忽略所有 DM：设置 `channels.discord.dm.enabled=false` 或 `channels.discord.dm.policy="disabled"`。
8. 群组 DM 默认被忽略；通过 `channels.discord.dm.groupEnabled` 启用，并可选择性地通过 `channels.discord.dm.groupChannels` 限制。
9. 可选的公会规则：设置 `channels.discord.guilds`，按公会 id（首选）或 slug 键入，包含每个频道的规则。
10. 可选的原生命令：`commands.native` 默认为 `"auto"`（Discord/Telegram 开启，Slack 关闭）。使用 `channels.discord.commands.native: true|false|"auto"` 覆盖；`false` 会清除先前注册的命令。文本命令由 `commands.text` 控制，必须作为独立的 `/...` 消息发送。使用 `commands.useAccessGroups: false` 绕过命令的访问组检查。
    - 完整命令列表 + 配置：[Slash commands](/tools/slash-commands)
11. 可选的公会上下文历史：设置 `channels.discord.historyLimit`（默认 20，回退到 `messages.groupChat.historyLimit`）以在回复提及时包含最后 N 条公会消息作为上下文。设置 `0` 禁用。
12. Reactions：agent 可以通过 `discord` 工具触发 reactions（由 `channels.discord.actions.*` 控制）。
    - Reaction 移除语义：参见 [/tools/reactions](/tools/reactions)。
    - `discord` 工具仅在当前频道是 Discord 时暴露。
13. 原生命令使用独立的会话键（`agent:<agentId>:discord:slash:<userId>`）而不是共享的 `main` 会话。

注意：名称 → id 解析使用公会成员搜索，需要 Server Members Intent；如果 bot 无法搜索成员，请使用 id 或 `<@id>` 提及。
注意：Slug 是小写的，空格替换为 `-`。频道名称转换为 slug 时不带前导 `#`。
注意：公会上下文 `[from:]` 行包含 `author.tag` + `id`，以便轻松进行 ping 就绪的回复。

## 配置写入
默认情况下，Discord 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

禁用方式：
```json5
{
  channels: { discord: { configWrites: false } }
}
```

## 如何创建自己的 bot

这是在服务器（公会）频道（如 `#help`）中运行 OpenClaw 的"Discord Developer Portal"设置。

### 1) 创建 Discord 应用 + bot 用户
1. Discord Developer Portal → **Applications** → **New Application**
2. 在您的应用中：
   - **Bot** → **Add Bot**
   - 复制 **Bot Token**（这是您放入 `DISCORD_BOT_TOKEN` 的内容）

### 2) 启用 OpenClaw 需要的 gateway intents
Discord 阻止"特权 intents"，除非您明确启用它们。

在 **Bot** → **Privileged Gateway Intents** 中启用：
- **Message Content Intent**（在大多数公会中读取消息文本所需；没有它您会看到"Used disallowed intents"或 bot 会连接但不响应消息）
- **Server Members Intent**（推荐；公会中某些成员/用户查找和白名单匹配所需）

通常**不**需要 **Presence Intent**。

### 3) 生成邀请 URL（OAuth2 URL Generator）
在您的应用中：**OAuth2** → **URL Generator**

**Scopes**
- ✅ `bot`
- ✅ `applications.commands`（原生命令所需）

**Bot Permissions**（最小基准）
- ✅ View Channels
- ✅ Send Messages
- ✅ Read Message History
- ✅ Embed Links
- ✅ Attach Files
- ✅ Add Reactions（可选但推荐）
- ✅ Use External Emojis / Stickers（可选；仅当您想要它们时）

避免 **Administrator**，除非您正在调试并完全信任该 bot。

复制生成的 URL，打开它，选择您的服务器，并安装 bot。

### 4) 获取 id（guild/user/channel）
Discord 到处都使用数字 id；OpenClaw 配置首选 id。

1. Discord（桌面/网页）→ **用户设置** → **高级** → 启用**开发者模式**
2. 右键单击：
   - 服务器名称 → **复制服务器 ID**（guild id）
   - 频道（例如 `#help`）→ **复制频道 ID**
   - 您的用户 → **复制用户 ID**

### 5) 配置 OpenClaw

#### Token
通过环境变量设置 bot token（在服务器上推荐）：
- `DISCORD_BOT_TOKEN=...`

或通过配置：

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN"
    }
  }
}
```

多账户支持：使用 `channels.discord.accounts`，包含每个账户的 token 和可选的 `name`。参见 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) 了解共享模式。

#### 白名单 + 频道路由
示例"单个服务器，只允许我，只允许 #help"：

```json5
{
  channels: {
    discord: {
      enabled: true,
      dm: { enabled: false },
      guilds: {
        "YOUR_GUILD_ID": {
          users: ["YOUR_USER_ID"],
          requireMention: true,
          channels: {
            help: { allow: true, requireMention: true }
          }
        }
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1
      }
    }
  }
}
```

注意：
- `requireMention: true` 表示 bot 仅在被提及时回复（推荐用于共享频道）。
- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）也算作公会消息的提及。
- 多 agent 覆盖：在 `agents.list[].groupChat.mentionPatterns` 上设置每个 agent 的模式。
- 如果存在 `channels`，未列出的任何频道默认被拒绝。
- 使用 `"*"` 频道条目在所有频道上应用默认值；显式频道条目覆盖通配符。
- 线程继承父频道配置（白名单、`requireMention`、技能、提示等），除非您显式添加线程频道 id。
- Bot 创作的消息默认被忽略；设置 `channels.discord.allowBots=true` 允许它们（自己的消息仍被过滤）。
- 警告：如果允许回复其他 bot（`channels.discord.allowBots=true`），请使用 `requireMention`、`channels.discord.guilds.*.channels.<id>.users` 白名单和/或在 `AGENTS.md` 和 `SOUL.md` 中清除护栏来防止 bot 间回复循环。

### 6) 验证其工作
1. 启动 gateway。
2. 在您的服务器频道中发送：`@Krill hello`（或您的 bot 名称）。
3. 如果没有反应：查看下面的**故障排除**。

### 故障排除
- 首先：运行 `openclaw doctor` 和 `openclaw channels status --probe`（可操作的警告 + 快速审计）。
- **"Used disallowed intents"**：在 Developer Portal 中启用 **Message Content Intent**（可能还需要 **Server Members Intent**），然后重启 gateway。
- **Bot 连接但从不在公会频道中回复**：
  - 缺少 **Message Content Intent**，或
  - Bot 缺少频道权限（View/Send/Read History），或
  - 您的配置需要提及但您没有提及它，或
  - 您的公会/频道白名单拒绝了该频道/用户。
- **`requireMention: false` 但仍然没有回复**：
- `channels.discord.groupPolicy` 默认为 **allowlist**；将其设置为 `"open"` 或在 `channels.discord.guilds` 下添加公会条目（可选择在 `channels.discord.guilds.<id>.channels` 下列出频道以进行限制）。
  - 如果只设置 `DISCORD_BOT_TOKEN` 而从未创建 `channels.discord` 部分，运行时会将 `groupPolicy` 默认为 `open`。添加 `channels.discord.groupPolicy`、`channels.defaults.groupPolicy` 或公会/频道白名单来锁定它。
- `requireMention` 必须位于 `channels.discord.guilds` 下（或特定频道下）。顶层的 `channels.discord.requireMention` 会被忽略。
- **权限审计**（`channels status --probe`）仅检查数字频道 ID。如果使用 slug/名称作为 `channels.discord.guilds.*.channels` 键，审计无法验证权限。
- **DM 不工作**：`channels.discord.dm.enabled=false`、`channels.discord.dm.policy="disabled"`，或您尚未被批准（`channels.discord.dm.policy="pairing"`）。

## 功能和限制
- DM 和公会文本频道（线程被视为单独频道；不支持语音）。
- 尽力发送输入指示器；消息分块使用 `channels.discord.textChunkLimit`（默认 2000）并按行数分割高回复（`channels.discord.maxLinesPerMessage`，默认 17）。
- 可选的换行分块：设置 `channels.discord.chunkMode="newline"` 在长度分块之前按空行（段落边界）分割。
- 支持文件上传，最大可达配置的 `channels.discord.mediaMaxMb`（默认 8 MB）。
- 默认情况下，公会回复需要提及以避免嘈杂的 bot。
- 当消息引用另一条消息时，会注入回复上下文（引用内容 + id）。
- 原生回复线程**默认关闭**；使用 `channels.discord.replyToMode` 和回复标签启用。

## 重试策略
出站 Discord API 调用在速率限制（429）时重试，当可用时使用 Discord `retry_after`，使用指数退避和抖动。通过 `channels.discord.retry` 配置。参见[重试策略](/concepts/retry)。

## 配置

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "abc.123",
      groupPolicy: "allowlist",
      guilds: {
        "*": {
          channels: {
            general: { allow: true }
          }
        }
      },
      mediaMaxMb: 8,
      actions: {
        reactions: true,
        stickers: true,
        emojiUploads: true,
        stickerUploads: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        channels: true,
        voiceStatus: true,
        events: true,
        moderation: false
      },
      replyToMode: "off",
      dm: {
        enabled: true,
        policy: "pairing", // pairing | allowlist | open | disabled
        allowFrom: ["123456789012345678", "steipete"],
        groupEnabled: false,
        groupChannels: ["openclaw-dm"]
      },
      guilds: {
        "*": { requireMention: true },
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          reactionNotifications: "own",
          users: ["987654321098765432", "steipete"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["search", "docs"],
              systemPrompt: "Keep answers short."
            }
          }
        }
      }
    }
  }
}
```

确认 reactions 通过 `messages.ackReaction` + `messages.ackReactionScope` 全局控制。使用 `messages.removeAckAfterReply` 在 bot 回复后清除确认 reaction。

- `dm.enabled`：设置 `false` 忽略所有 DM（默认 `true`）。
- `dm.policy`：DM 访问控制（推荐 `pairing`）。`"open"` 需要 `dm.allowFrom=["*"]`。
- `dm.allowFrom`：DM 白名单（用户 id 或名称）。由 `dm.policy="allowlist"` 使用，并用于 `dm.policy="open"` 验证。向导接受用户名，并在 bot 可以搜索成员时将其解析为 id。
- `dm.groupEnabled`：启用群组 DM（默认 `false`）。
- `dm.groupChannels`：群组 DM 频道 id 或 slug 的可选白名单。
- `groupPolicy`：控制公会频道处理（`open|disabled|allowlist`）；`allowlist` 需要频道白名单。
- `guilds`：按公会 id（首选）或 slug 键入的每公会规则。
- `guilds."*"`：当不存在显式条目时应用的默认每公会设置。
- `guilds.<id>.slug`：用于显示名称的可选友好 slug。
- `guilds.<id>.users`：可选的每公会用户白名单（id 或名称）。
- `guilds.<id>.tools`：当缺少频道覆盖时使用的可选每公会工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `guilds.<id>.toolsBySender`：公会级别的可选每发送者工具策略覆盖（当缺少频道覆盖时应用；支持 `"*"` 通配符）。
- `guilds.<id>.channels.<channel>.allow`：当 `groupPolicy="allowlist"` 时允许/拒绝频道。
- `guilds.<id>.channels.<channel>.requireMention`：频道的提及门控。
- `guilds.<id>.channels.<channel>.tools`：可选的每频道工具策略覆盖（`allow`/`deny`/`alsoAllow`）。
- `guilds.<id>.channels.<channel>.toolsBySender`：频道内的可选每发送者工具策略覆盖（支持 `"*"` 通配符）。
- `guilds.<id>.channels.<channel>.users`：可选的每频道用户白名单。
- `guilds.<id>.channels.<channel>.skills`：技能过滤器（省略 = 所有技能，空 = 无）。
- `guilds.<id>.channels.<channel>.systemPrompt`：频道的额外系统提示（与频道主题组合）。
- `guilds.<id>.channels.<channel>.enabled`：设置 `false` 禁用频道。
- `guilds.<id>.channels`：频道规则（键是频道 slug 或 id）。
- `guilds.<id>.requireMention`：每公会提及要求（可按频道覆盖）。
- `guilds.<id>.reactionNotifications`：reaction 系统事件模式（`off`、`own`、`all`、`allowlist`）。
- `textChunkLimit`：出站文本块大小（字符）。默认：2000。
- `chunkMode`：`length`（默认）仅在超过 `textChunkLimit` 时分割；`newline` 在长度分块之前按空行（段落边界）分割。
- `maxLinesPerMessage`：每条消息的软最大行数。默认：17。
- `mediaMaxMb`：限制保存到磁盘的入站媒体。
- `historyLimit`：回复提及时包含的最近公会消息数量作为上下文（默认 20；回退到 `messages.groupChat.historyLimit`；`0` 禁用）。
- `dmHistoryLimit`：用户轮次中的 DM 历史限制。每用户覆盖：`dms["<user_id>"].historyLimit`。
- `retry`：出站 Discord API 调用的重试策略（尝试次数、minDelayMs、maxDelayMs、jitter）。
- `actions`：每操作工具门控；省略以允许所有（设置 `false` 禁用）。
  - `reactions`（涵盖 react + 读取 reactions）
  - `stickers`、`emojiUploads`、`stickerUploads`、`polls`、`permissions`、`messages`、`threads`、`pins`、`search`
  - `memberInfo`、`roleInfo`、`channelInfo`、`voiceStatus`、`events`
  - `channels`（创建/编辑/删除频道 + 类别 + 权限）
  - `roles`（角色添加/移除，默认 `false`）
  - `moderation`（超时/踢出/封禁，默认 `false`）

Reaction 通知使用 `guilds.<id>.reactionNotifications`：
- `off`：无 reaction 事件。
- `own`：bot 自己消息上的 reactions（默认）。
- `all`：所有消息上的所有 reactions。
- `allowlist`：来自 `guilds.<id>.users` 的 reactions 在所有消息上（空列表禁用）。

### 工具操作默认值

| 操作组 | 默认 | 注释 |
| --- | --- | --- |
| reactions | 启用 | React + 列出 reactions + emojiList |
| stickers | 启用 | 发送贴纸 |
| emojiUploads | 启用 | 上传表情符号 |
| stickerUploads | 启用 | 上传贴纸 |
| polls | 启用 | 创建投票 |
| permissions | 启用 | 频道权限快照 |
| messages | 启用 | 读取/发送/编辑/删除 |
| threads | 启用 | 创建/列出/回复 |
| pins | 启用 | 置顶/取消置顶/列出 |
| search | 启用 | 消息搜索（预览功能）|
| memberInfo | 启用 | 成员信息 |
| roleInfo | 启用 | 角色列表 |
| channelInfo | 启用 | 频道信息 + 列表 |
| channels | 启用 | 频道/类别管理 |
| voiceStatus | 启用 | 语音状态查找 |
| events | 启用 | 列出/创建计划事件 |
| roles | 禁用 | 角色添加/移除 |
| moderation | 禁用 | 超时/踢出/封禁 |
- `replyToMode`：`off`（默认）、`first` 或 `all`。仅当模型包含回复标签时应用。

## 回复标签
要请求线程回复，模型可以在其输出中包含一个标签：
- `[[reply_to_current]]` — 回复触发的 Discord 消息。
- `[[reply_to:<id>]]` — 回复上下文/历史中的特定消息 id。
当前消息 id 作为 `[message_id: …]` 附加到提示中；历史条目已包含 id。

行为由 `channels.discord.replyToMode` 控制：
- `off`：忽略标签。
- `first`：仅第一个出站块/附件是回复。
- `all`：每个出站块/附件都是回复。

白名单匹配注意事项：
- `allowFrom`/`users`/`groupChannels` 接受 id、名称、标签或提及，如 `<@id>`。
- 支持前缀，如 `discord:`/`user:`（用户）和 `channel:`（群组 DM）。
- 使用 `*` 允许任何发送者/频道。
- 当存在 `guilds.<id>.channels` 时，未列出的频道默认被拒绝。
- 当省略 `guilds.<id>.channels` 时，白名单公会中的所有频道都被允许。
- 要不允许**任何频道**，设置 `channels.discord.groupPolicy: "disabled"`（或保持空白名单）。
- 配置向导接受 `Guild/Channel` 名称（公共 + 私有），并在可能时将其解析为 ID。
- 启动时，OpenClaw 将白名单中的频道/用户名称解析为 ID（当 bot 可以搜索成员时）并记录映射；未解析的条目保持原样。

原生命令注意事项：
- 注册的命令镜像 OpenClaw 的聊天命令。
- 原生命令遵循与 DM/公会消息相同的白名单（`channels.discord.dm.allowFrom`、`channels.discord.guilds`、每频道规则）。
- Slash 命令可能仍在 Discord UI 中对未列入白名单的用户可见；OpenClaw 在执行时强制执行白名单并回复"未授权"。

## 工具操作
Agent 可以使用如下操作调用 `discord`：
- `react` / `reactions`（添加或列出 reactions）
- `sticker`、`poll`、`permissions`
- `readMessages`、`sendMessage`、`editMessage`、`deleteMessage`
- 读取/搜索/置顶工具有效载荷包括规范化的 `timestampMs`（UTC epoch ms）和 `timestampUtc`，以及原始 Discord `timestamp`。
- `threadCreate`、`threadList`、`threadReply`
- `pinMessage`、`unpinMessage`、`listPins`
- `searchMessages`、`memberInfo`、`roleInfo`、`roleAdd`、`roleRemove`、`emojiList`
- `channelInfo`、`channelList`、`voiceStatus`、`eventList`、`eventCreate`
- `timeout`、`kick`、`ban`

Discord 消息 id 在注入的上下文中显示（`[discord message id: …]` 和历史行），以便 agent 可以定位它们。
表情符号可以是 unicode（例如 `✅`）或自定义表情符号语法，如 `<:party_blob:1234567890>`。

## 安全和运维
- 将 bot token 视为密码；在受监督的主机上优先使用 `DISCORD_BOT_TOKEN` 环境变量，或锁定配置文件权限。
- 仅授予 bot 所需的权限（通常是读取/发送消息）。
- 如果 bot 卡住或受速率限制，在确认没有其他进程拥有 Discord 会话后重启 gateway（`openclaw gateway --force`）。
