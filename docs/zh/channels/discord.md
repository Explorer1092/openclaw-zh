---
mmh3_hash: "e42cde9253bc009a35490f2fbcdfed6e"
summary: "Discord bot 支持状态、功能和配置"
read_when:
  - 使用 Discord channel 功能时
title: "Discord"
---

# Discord (Bot API)

状态：通过官方 Discord gateway 支持 DM 和公会频道。

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    Discord DM 默认为 pairing 模式。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/channels/troubleshooting">
    跨 channel 诊断和修复流程。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="创建 Discord bot 并启用 intents">
    在 Discord Developer Portal 中创建应用程序，添加 bot，然后启用：

    - **Message Content Intent**
    - **Server Members Intent**（角色 allowlist 和基于角色的路由所需；推荐用于名称到 ID 的 allowlist 匹配）

  </Step>

  <Step title="配置 token">

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN",
    },
  },
}
```

    默认账户的环境变量回退：

```bash
DISCORD_BOT_TOKEN=...
```

  </Step>

  <Step title="邀请 bot 并启动 gateway">
    使用消息权限将 bot 邀请到你的服务器。

```bash
openclaw gateway
```

  </Step>

  <Step title="批准首次 DM pairing">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

    配对代码 1 小时后过期。

  </Step>
</Steps>

<Note>
Token 解析支持账户。配置 token 值优先于环境变量回退。`DISCORD_BOT_TOKEN` 仅用于默认账户。
</Note>

## 运行时模型

- Gateway 拥有 Discord 连接。
- 回复路由是确定性的：Discord 入站回复返回到 Discord。
- 默认情况下（`session.dmScope=main`），直接聊天共享 agent 主会话（`agent:main:main`）。
- 公会频道是隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 群组 DM 默认被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生 slash 命令在隔离的命令会话（`agent:<agentId>:discord:slash:<userId>`）中运行，同时仍然携带 `CommandTargetSessionKey` 到路由的对话会话。

## 交互组件

OpenClaw 支持 Discord components v2 容器用于 agent 消息。使用带有 `components` 载荷的消息工具。交互结果作为正常入站消息路由回 agent，并遵循现有的 Discord `replyToMode` 设置。

支持的块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行允许最多 5 个按钮或单个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

文件附件：

- `file` 块必须指向附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单个文件）；对于多个文件使用 `media-gallery`
- 使用 `filename` 在上传名称应匹配附件引用时覆盖它

模态表单：

- 添加最多 5 个字段的 `components.modal`
- 字段类型：`text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw 自动添加触发按钮

示例：

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "Optional fallback text",
  components: {
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          { label: "Approve", style: "success" },
          { label: "Decline", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "Pick an option",
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "Details",
      triggerLabel: "Open form",
      fields: [
        { type: "text", label: "Requester" },
        {
          type: "select",
          label: "Priority",
          options: [
            { label: "Low", value: "low" },
            { label: "High", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## 访问控制和路由

<Tabs>
  <Tab title="DM policy">
    `channels.discord.dmPolicy` 控制 DM 访问（传统：`channels.discord.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`；传统：`channels.discord.dm.allowFrom`）
    - `disabled`

    如果 DM policy 不是 open，未知用户被阻止（或在 `pairing` 模式下提示 pairing）。

    投递的 DM 目标格式：

    - `user:<id>`
    - `<@id>` 提及

    裸数字 ID 有歧义并被拒绝，除非提供了显式的 user/channel 目标类型。

  </Tab>

  <Tab title="Guild policy">
    公会处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当 `channels.discord` 存在时的安全基线是 `allowlist`。

    `allowlist` 行为：

    - 公会必须匹配 `channels.discord.guilds`（首选 `id`，接受 slug）
    - 可选的发送者 allowlist：`users`（ID 或名称）和 `roles`（仅角色 ID）；如果配置了任一项，当发送者匹配 `users` 或 `roles` 时被允许
    - 如果公会配置了 `channels`，未列出的频道被拒绝
    - 如果公会没有 `channels` 块，该 allowlist 公会中的所有频道都被允许

    示例：

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    如果你只设置 `DISCORD_BOT_TOKEN` 并且不创建 `channels.discord` 块，运行时回退是 `groupPolicy="open"`（日志中有警告）。

  </Tab>

  <Tab title="Mentions and group DMs">
    公会消息默认门控提及。

    提及检测包括：

    - 显式 bot 提及
    - 配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
    - 在支持的情况下隐式回复到 bot 的行为

    `requireMention` 按公会/频道配置（`channels.discord.guilds...`）。

    群组 DM：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可选的 allowlist 通过 `dm.groupChannels`（频道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的 agent 路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord 公会成员路由到不同的 agent。基于角色的绑定仅接受角色 ID，并在 peer 或 parent-peer 绑定之后、仅公会绑定之前评估。如果绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），所有配置的字段都必须匹配。

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## Developer Portal 设置

<AccordionGroup>
  <Accordion title="创建应用和 bot">

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. 复制 bot token

  </Accordion>

  <Accordion title="特权 intents">
    在 **Bot -> Privileged Gateway Intents** 中，启用：

    - Message Content Intent
    - Server Members Intent（推荐）

    Presence intent 是可选的，仅在你想接收 presence 更新时才需要。设置 bot presence（`setPresence`）不需要为成员启用 presence 更新。

  </Accordion>

  <Accordion title="OAuth scopes 和基线权限">
    OAuth URL 生成器：

    - scopes: `bot`、`applications.commands`

    典型基线权限：

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（可选）

    避免 `Administrator`，除非明确需要。

  </Accordion>

  <Accordion title="复制 ID">
    启用 Discord Developer Mode，然后复制：

    - 服务器 ID
    - 频道 ID
    - 用户 ID

    在 OpenClaw 配置中首选数字 ID 以进行可靠的审计和探测。

  </Accordion>
</AccordionGroup>

## 原生命令和命令授权

- `commands.native` 默认为 `"auto"` 并为 Discord 启用。
- 按 channel 覆盖：`channels.discord.commands.native`。
- `commands.native=false` 显式清除先前注册的 Discord 原生命令。
- 原生命令授权使用与正常消息处理相同的 Discord allowlist/policy。
- 命令可能仍然在 Discord UI 中对未授权的用户可见；执行时仍然强制执行 OpenClaw 授权并返回"未授权"。

参见 [Slash commands](/tools/slash-commands) 了解命令目录和行为。

## 功能详情

<AccordionGroup>
  <Accordion title="回复标签和原生回复">
    Discord 支持 agent 输出中的回复标签：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（默认）
    - `first`
    - `all`

    注意：`off` 禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍然被遵守。

    消息 ID 在上下文/历史中呈现，因此 agent 可以定位特定消息。

  </Accordion>

  <Accordion title="历史、上下文和线程行为">
    公会历史上下文：

    - `channels.discord.historyLimit` 默认 `20`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 禁用

    DM 历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程作为频道会话路由
    - 父线程元数据可用于父会话链接
    - 线程配置继承父频道配置，除非存在线程特定条目

    频道主题作为**不受信任的**上下文注入（不作为系统提示）。

  </Accordion>

  <Accordion title="Reaction 通知">
    按公会 reaction 通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    Reaction 事件转换为系统事件并附加到路由的 Discord 会话。

  </Accordion>

  <Accordion title="Ack reactions">
    `ackReaction` 在 OpenClaw 处理入站消息时发送确认 emoji。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent 身份 emoji 回退（`agents.list[].identity.emoji`，否则"👀"）

    说明：

    - Discord 接受 unicode emoji 或自定义 emoji 名称。
    - 使用 `""` 禁用 channel 或账户的 reaction。

  </Accordion>

  <Accordion title="配置写入">
    Channel 发起的配置写入默认启用。

    这影响 `/config set|unset` 流程（当启用命令功能时）。

    禁用：

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway proxy">
    使用 `channels.discord.proxy` 通过 HTTP(S) 代理路由 Discord gateway WebSocket 流量。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    按账户覆盖：

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="PluralKit 支持">
    启用 PluralKit 解析以将代理消息映射到系统成员身份：

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // 可选；私有系统需要
      },
    },
  },
}
```

    说明：

    - allowlist 可以使用 `pk:<memberId>`
    - 成员显示名称按名称/slug 匹配
    - 查找使用原始消息 ID 并受时间窗口约束
    - 如果查找失败，代理消息被视为 bot 消息并丢弃，除非 `allowBots=true`

  </Accordion>

  <Accordion title="Presence 配置">
    仅当你设置状态或活动字段时才应用 presence 更新。

    仅状态示例：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    活动示例（自定义状态是默认活动类型）：

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    流式传输示例：

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    活动类型映射：

    - 0: Playing
    - 1: Streaming（需要 `activityUrl`）
    - 2: Listening
    - 3: Watching
    - 4: Custom（使用活动文本作为状态状态；emoji 是可选的）
    - 5: Competing

  </Accordion>

  <Accordion title="Discord 中的 Exec 批准">
    Discord 支持 DM 中基于按钮的 exec 批准，并可以选择在原始频道中发布批准提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `target` 是 `channel` 或 `both` 时，批准提示在频道中可见。只有配置的批准者可以使用按钮；其他用户收到临时拒绝。批准提示包括命令文本，因此仅在受信任的频道中启用频道投递。如果无法从会话键派生频道 ID，OpenClaw 回退到 DM 投递。

    如果批准失败并显示未知批准 ID，请验证批准者列表和功能启用。

    相关文档：[Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## 工具和操作门控

Discord 消息操作包括消息传递、频道管理、审核、presence 和元数据操作。

核心示例：

- 消息传递：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- reactions：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- presence：`setPresence`

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组                                                                                                                                                             | 默认  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions、messages、threads、pins、polls、search、memberInfo、roleInfo、channelInfo、channels、voiceStatus、events、stickers、emojiUploads、stickerUploads、permissions | 启用  |
| roles                                                                                                                                                                    | 禁用 |
| moderation                                                                                                                                                               | 禁用 |
| presence                                                                                                                                                                 | 禁用 |

## Components v2 UI

OpenClaw 使用 Discord components v2 进行 exec 批准和跨上下文标记。Discord 消息操作还可以接受自定义 UI 的 `components`（高级；需要 Carbon 组件实例），而传统 `embeds` 仍然可用但不推荐。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（hex）。
- 按账户设置 `channels.discord.accounts.<id>.ui.components.accentColor`。
- 当存在 components v2 时忽略 `embeds`。

示例：

```json5
{
  channels: {
    discord: {
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
    },
  },
}
```

## 语音消息

Discord 语音消息显示波形预览并需要 OGG/Opus 音频加元数据。OpenClaw 自动生成波形，但需要在 gateway 主机上提供 `ffmpeg` 和 `ffprobe` 来检查和转换音频文件。

要求和约束：

- 提供**本地文件路径**（URL 被拒绝）。
- 省略文本内容（Discord 不允许在同一载荷中使用文本 + 语音消息）。
- 接受任何音频格式；OpenClaw 在需要时转换为 OGG/Opus。

示例：

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排除

<AccordionGroup>
  <Accordion title="使用了不允许的 intents 或 bot 看不到公会消息">

    - 启用 Message Content Intent
    - 当你依赖 user/member 解析时启用 Server Members Intent
    - 更改 intents 后重启 gateway

  </Accordion>

  <Accordion title="公会消息意外被阻止">

    - 验证 `groupPolicy`
    - 验证 `channels.discord.guilds` 下的公会 allowlist
    - 如果公会 `channels` 映射存在，只允许列出的频道
    - 验证 `requireMention` 行为和提及模式

    有用的检查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="Require mention false 但仍然被阻止">
    常见原因：

    - `groupPolicy="allowlist"` 没有匹配的公会/频道 allowlist
    - `requireMention` 配置在错误的位置（必须在 `channels.discord.guilds` 或频道条目下）
    - 发送者被公会/频道 `users` allowlist 阻止

  </Accordion>

  <Accordion title="权限审计不匹配">
    `channels status --probe` 权限检查仅适用于数字频道 ID。

    如果你使用 slug 键，运行时匹配仍然可以工作，但探测无法完全验证权限。

  </Accordion>

  <Accordion title="DM 和 pairing 问题">

    - DM 禁用：`channels.discord.dm.enabled=false`
    - DM policy 禁用：`channels.discord.dmPolicy="disabled"`（传统：`channels.discord.dm.policy`）
    - 在 `pairing` 模式下等待 pairing 批准

  </Accordion>

  <Accordion title="Bot 到 bot 循环">
    默认情况下忽略 bot 创作的消息。

    如果你设置 `channels.discord.allowBots=true`，使用严格的提及和 allowlist 规则以避免循环行为。

  </Accordion>
</AccordionGroup>

## 配置参考指针

主要参考：

- [Configuration reference - Discord](/gateway/configuration-reference#discord)

高信号 Discord 字段：

- 启动/认证：`enabled`、`token`、`accounts.*`、`allowBots`
- policy：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`
- 回复/历史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 投递：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 媒体/重试：`mediaMaxMb`、`retry`
- 操作：`actions.*`
- presence：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

## 安全和运维

- 将 bot token 视为密钥（在受监督的环境中首选 `DISCORD_BOT_TOKEN`）。
- 授予最少权限的 Discord 权限。
- 如果命令部署/状态陈旧，重启 gateway 并使用 `openclaw channels status --probe` 重新检查。

## 相关

- [Pairing](/channels/pairing)
- [Channel routing](/channels/channel-routing)
- [Troubleshooting](/channels/troubleshooting)
- [Slash commands](/tools/slash-commands)
