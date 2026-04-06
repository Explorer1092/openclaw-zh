---
mmh3_hash: "c83c06ea6e2c7f697ab3b676e8effb7f"
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

你需要创建一个带有 bot 的新应用程序，将 bot 添加到你的服务器，并将其与 OpenClaw 配对。我们建议将你的 bot 添加到你自己的私人服务器。如果你还没有，[先创建一个](https://support.discord.com/hc/en-us/articles/204849977-How-do-I-create-a-server)（选择 **Create My Own > For me and my friends**）。

<Steps>
  <Step title="创建 Discord 应用程序和 bot">
    前往 [Discord Developer Portal](https://discord.com/developers/applications) 并点击 **New Application**。将其命名为"OpenClaw"之类的名称。

    点击侧栏中的 **Bot**。将 **Username** 设置为你的 OpenClaw agent 的名称。

  </Step>

  <Step title="启用特权 intents">
    仍然在 **Bot** 页面，向下滚动到 **Privileged Gateway Intents** 并启用：

    - **Message Content Intent**（必需）
    - **Server Members Intent**（推荐；角色 allowlist 和名称到 ID 匹配所需）
    - **Presence Intent**（可选；仅在你需要接收 presence 更新时才需要）

  </Step>

  <Step title="复制你的 bot token">
    在 **Bot** 页面向上滚动并点击 **Reset Token**。

    <Note>
    尽管名字如此，这会生成你的第一个 token——没有什么被"重置"。
    </Note>

    复制 token 并保存到安全的地方。这是你的 **Bot Token**，稍后你会需要它。

  </Step>

  <Step title="生成邀请 URL 并将 bot 添加到服务器">
    点击侧栏中的 **OAuth2**。你将生成一个带有正确权限的邀请 URL 来将 bot 添加到服务器。

    向下滚动到 **OAuth2 URL Generator** 并启用：

    - `bot`
    - `applications.commands`

    下方将出现 **Bot Permissions** 部分。启用：

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（可选）

    复制底部生成的 URL，粘贴到浏览器中，选择你的服务器，然后点击 **Continue** 连接。你现在应该可以在 Discord 服务器中看到你的 bot。

  </Step>

  <Step title="启用开发者模式并收集你的 ID">
    回到 Discord 应用，你需要启用开发者模式以便复制内部 ID。

    1. 点击 **User Settings**（头像旁边的齿轮图标）→ **Advanced** → 开启 **Developer Mode**
    2. 右键点击侧栏中的**服务器图标** → **Copy Server ID**
    3. 右键点击**你自己的头像** → **Copy User ID**

    将你的 **Server ID** 和 **User ID** 与 Bot Token 一起保存——下一步你需要将这三项都发送给 OpenClaw。

  </Step>

  <Step title="允许服务器成员向你发送 DM">
    要让配对正常工作，Discord 需要允许你的 bot 向你发送 DM。右键点击**服务器图标** → **Privacy Settings** → 开启 **Direct Messages**。

    这允许服务器成员（包括 bot）向你发送 DM。如果你想与 OpenClaw 使用 Discord DM，请保持此选项启用。如果你只打算使用公会频道，可以在配对后禁用 DM。

  </Step>

  <Step title="安全设置你的 bot token（不要在聊天中发送）">
    你的 Discord bot token 是一个密钥（类似密码）。在向你的 agent 发送消息之前，先在运行 OpenClaw 的机器上设置它。

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

    如果 OpenClaw 已经作为后台服务运行，请改用 `openclaw gateway restart`。

  </Step>

  <Step title="配置 OpenClaw 并配对">

    <Tabs>
      <Tab title="询问你的 agent">
        通过任何现有频道（例如 Telegram）与你的 OpenClaw agent 聊天并告知它。如果 Discord 是你的第一个频道，请改用 CLI/配置标签。

        > "我已经在配置中设置了我的 Discord bot token。请用用户 ID `<user_id>` 和服务器 ID `<server_id>` 完成 Discord 设置。"
      </Tab>
      <Tab title="CLI / 配置">
        如果你更喜欢基于文件的配置，设置：

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: {
        source: "env",
        provider: "default",
        id: "DISCORD_BOT_TOKEN",
      },
    },
  },
}
```

        默认账户的环境变量回退：

```bash
DISCORD_BOT_TOKEN=...
```

        支持明文 `token` 值。`channels.discord.token` 也支持 SecretRef 值（env/file/exec 提供者）。参见 [Secrets Management](/gateway/secrets)。

      </Tab>
    </Tabs>

  </Step>

  <Step title="批准首条 DM 配对">
    等待 gateway 运行后，在 Discord 中向你的 bot 发送 DM。它会回复一个配对码。

    <Tabs>
      <Tab title="询问你的 agent">
        将配对码发送给你现有频道上的 agent：

        > "批准这个 Discord 配对码：`<CODE>`"
      </Tab>
      <Tab title="CLI">

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

      </Tab>
    </Tabs>

    配对码 1 小时后过期。

    你现在应该可以通过 DM 在 Discord 中与你的 agent 聊天了。

  </Step>
</Steps>

<Note>
Token 解析是账户感知的。配置 token 值优先于环境变量回退。`DISCORD_BOT_TOKEN` 仅用于默认账户。
对于高级出站调用（消息工具/频道操作），该调用使用显式的每次调用 `token`。这适用于发送和读取/探测类操作（例如读取/搜索/获取/线程/置顶/权限）。账户策略/重试设置仍来自活动运行时快照中的所选账户。
</Note>

## 推荐：设置公会工作区

一旦 DM 正常工作，你可以将 Discord 服务器设置为完整工作区，其中每个频道都有自己的 agent 会话和上下文。这对于只有你和 bot 的私人服务器是推荐的。

<Steps>
  <Step title="将你的服务器添加到公会 allowlist">
    这使你的 agent 能够在服务器的任何频道中响应，而不仅仅是 DM。

    <Tabs>
      <Tab title="询问你的 agent">
        > "将我的 Discord 服务器 ID `<server_id>` 添加到公会 allowlist"
      </Tab>
      <Tab title="配置">

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: true,
          users: ["YOUR_USER_ID"],
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="允许不需要 @mention 的响应">
    默认情况下，你的 agent 只在被 @提及时才在公会频道中响应。对于私人服务器，你可能希望它响应每条消息。

    <Tabs>
      <Tab title="询问你的 agent">
        > "允许我的 agent 在这个服务器上响应，而无需被 @提及"
      </Tab>
      <Tab title="配置">
        在你的公会配置中设置 `requireMention: false`：

```json5
{
  channels: {
    discord: {
      guilds: {
        YOUR_SERVER_ID: {
          requireMention: false,
        },
      },
    },
  },
}
```

      </Tab>
    </Tabs>

  </Step>

  <Step title="规划公会频道中的记忆">
    默认情况下，长期记忆（MEMORY.md）只在 DM 会话中加载。公会频道不会自动加载 MEMORY.md。

    <Tabs>
      <Tab title="询问你的 agent">
        > "当我在 Discord 频道中提问时，如果需要来自 MEMORY.md 的长期上下文，请使用 memory_search 或 memory_get。"
      </Tab>
      <Tab title="手动">
        如果你需要在每个频道中共享上下文，将稳定的指令放在 `AGENTS.md` 或 `USER.md` 中（它们会在每次会话中注入）。将长期笔记保存在 `MEMORY.md` 中，并按需使用记忆工具访问。
      </Tab>
    </Tabs>

  </Step>
</Steps>

现在在你的 Discord 服务器上创建一些频道并开始聊天。你的 agent 可以看到频道名称，每个频道都有自己独立的会话——所以你可以设置 `#coding`、`#home`、`#research` 或任何适合你工作流程的频道。

## 运行时模型

- Gateway 拥有 Discord 连接。
- 回复路由是确定性的：Discord 入站消息回复到 Discord。
- 默认情况下（`session.dmScope=main`），直接聊天共享 agent 主会话（`agent:main:main`）。
- 公会频道是隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 群组 DM 默认被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生 slash 命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍将 `CommandTargetSessionKey` 携带到路由的会话。

## 论坛频道

Discord 论坛和媒体频道只接受线程帖子。OpenClaw 支持两种创建方式：

- 向论坛父级（`channel:<forumId>`）发送消息以自动创建线程。线程标题使用消息的第一个非空行。
- 使用 `openclaw message thread create` 直接创建线程。论坛频道不要传递 `--message-id`。

示例：向论坛父级发送消息以创建线程

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "Topic title\nBody of the post"
```

示例：显式创建论坛线程

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "Topic title" --message "Body of the post"
```

论坛父级不接受 Discord 组件。如果你需要组件，请发送到线程本身（`channel:<threadId>`）。

## 交互式组件

OpenClaw 支持 Discord 组件 v2 容器用于 agent 消息。使用消息工具配合 `components` 负载。交互结果作为普通入站消息路由回 agent，并遵循现有的 Discord `replyToMode` 设置。

支持的块：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- 操作行最多允许 5 个按钮或一个选择菜单
- 选择类型：`string`、`user`、`role`、`mentionable`、`channel`

默认情况下，组件是一次性的。设置 `components.reusable=true` 允许按钮、选择和表单在过期前多次使用。

要限制谁可以点击按钮，在该按钮上设置 `allowedUsers`（Discord 用户 ID、标签或 `*`）。配置后，不匹配的用户会收到临时拒绝。

`/model` 和 `/models` slash 命令会打开一个带有提供商和模型下拉菜单以及提交步骤的交互式模型选择器。选择器回复是临时的，只有调用用户可以使用。

文件附件：

- `file` 块必须指向附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单个文件）；对于多个文件使用 `media-gallery`
- 使用 `filename` 在上传名称应匹配附件引用时覆盖它

Modal 表单：

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
    reusable: true,
    text: "Choose a path",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "Approve",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
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
  <Tab title="DM 策略">
    `channels.discord.dmPolicy` 控制 DM 访问（旧版：`channels.discord.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`；旧版：`channels.discord.dm.allowFrom`）
    - `disabled`

    如果 DM 策略不是 open，未知用户会被阻止（或在 `pairing` 模式下提示配对）。

    多账户优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 命名账户在未设置自己的 `allowFrom` 时继承 `channels.discord.allowFrom`。
    - 命名账户不继承 `channels.discord.accounts.default.allowFrom`。

    传递的 DM 目标格式：

    - `user:<id>`
    - `<@id>` 提及

    裸数字 ID 是模糊的，除非提供了显式的用户/频道目标类型，否则会被拒绝。

  </Tab>

  <Tab title="公会策略">
    公会处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当 `channels.discord` 存在时，安全基线为 `allowlist`。

    `allowlist` 行为：

    - 公会必须匹配 `channels.discord.guilds`（优先使用 `id`，接受 slug）
    - 可选发送者 allowlist：`users`（建议使用稳定 ID）和 `roles`（仅角色 ID）；如果任一已配置，发送者匹配 `users` 或 `roles` 时被允许
    - 直接名称/标签匹配默认禁用；仅在紧急情况下启用 `channels.discord.dangerouslyAllowNameMatching: true`
    - `users` 支持名称/标签，但 ID 更安全；`openclaw security audit` 在使用名称/标签条目时发出警告
    - 如果公会配置了 `channels`，未列出的频道将被拒绝
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
          ignoreOtherMentions: true,
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

    如果你只设置了 `DISCORD_BOT_TOKEN` 而没有创建 `channels.discord` 块，运行时回退为 `groupPolicy="allowlist"`（日志中有警告），即使 `channels.defaults.groupPolicy` 为 `open`。

  </Tab>

  <Tab title="提及和群组 DM">
    公会消息默认需要提及才能触发。

    提及检测包括：

    - 显式 bot 提及
    - 配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
    - 支持的情况下的隐式回复-bot 行为

    `requireMention` 按公会/频道配置（`channels.discord.guilds...`）。
    `ignoreOtherMentions` 可选地丢弃提及了其他用户/角色但没有提及 bot 的消息（不包括 @everyone/@here）。

    群组 DM：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可选 allowlist 通过 `dm.groupChannels`（频道 ID 或 slug）

  </Tab>
</Tabs>

### 基于角色的 Agent 路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord 公会成员路由到不同的 agent。基于角色的绑定仅接受角色 ID，在对等体或父对等体绑定之后、仅公会绑定之前进行评估。如果绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），则所有配置的字段都必须匹配。

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

  <Accordion title="OAuth 范围和基本权限">
    OAuth URL 生成器：

    - 范围：`bot`、`applications.commands`

    典型基本权限：

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（可选）

    除非明确需要，否则避免 `Administrator`。

  </Accordion>

  <Accordion title="复制 ID">
    启用 Discord 开发者模式，然后复制：

    - 服务器 ID
    - 频道 ID
    - 用户 ID

    在 OpenClaw 配置中优先使用数字 ID，以便进行可靠的审计和探测。

  </Accordion>
</AccordionGroup>

## 原生命令和命令授权

- `commands.native` 默认为 `"auto"`，为 Discord 启用。
- 每频道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 显式清除之前注册的 Discord 原生命令。
- 原生命令授权使用与普通消息处理相同的 Discord allowlist/策略。
- 命令在 Discord UI 中对未授权用户可能仍然可见；执行仍会强制执行 OpenClaw 授权并返回"未授权"。

参见 [Slash commands](/tools/slash-commands) 了解命令目录和行为。

默认 slash 命令设置：

- `ephemeral: true`

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
    - `batched`

    注意：`off` 禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍然有效。
    `first` 始终将隐式原生回复引用附加到该轮次的第一条出站 Discord 消息。
    `batched` 仅在入站轮次是多条消息的防抖批次时附加 Discord 的隐式原生回复引用。这在你主要想为模糊的突发聊天而非每条单消息轮次使用原生回复时很有用。

    消息 ID 在上下文/历史中显示，以便 Agent 可以定位特定消息。

  </Accordion>

  <Accordion title="实时流式预览">
    OpenClaw 可以通过发送临时消息并在文本到达时编辑来流式传输草稿回复。

    - `channels.discord.streaming` 控制预览流式传输（`off` | `partial` | `block` | `progress`，默认：`off`）。
    - `progress` 接受用于跨频道一致性，在 Discord 上映射到 `partial`。
    - `channels.discord.streamMode` 是旧版别名，会自动迁移。
    - `partial` 在 token 到达时编辑单个预览消息。
    - `block` 发出草稿大小的块（使用 `draftChunk` 调整大小和断点）。

    示例：

```json5
{
  channels: {
    discord: {
      streaming: "partial",
    },
  },
}
```

    `block` 模式分块默认值（限制在 `channels.discord.textChunkLimit` 以内）：

```json5
{
  channels: {
    discord: {
      streaming: "block",
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph",
      },
    },
  },
}
```

    预览流式传输仅限文本；媒体回复回退到正常传递。

    注意：预览流式传输与块流式传输是分开的。当为 Discord 显式启用块流式传输时，OpenClaw 跳过预览流以避免双重流式传输。

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

    频道主题作为**不可信**上下文注入（不作为系统提示）。

  </Accordion>

  <Accordion title="子 agent 的线程绑定会话">
    Discord 可以将线程绑定到会话目标，使该线程中的后续消息持续路由到同一会话（包括子 agent 会话）。

    命令：

    - `/focus <target>` 将当前/新线程绑定到子 agent/会话目标
    - `/unfocus` 移除当前线程绑定
    - `/agents` 显示活动运行和绑定状态
    - `/session idle <duration|off>` 检查/更新已聚焦绑定的非活动自动取消聚焦时间
    - `/session max-age <duration|off>` 检查/更新已聚焦绑定的硬最大存在时间

    配置：

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // 需要选择启用
      },
    },
  },
}
```

    注意：

    - `session.threadBindings.*` 设置全局默认值。
    - `channels.discord.threadBindings.*` 覆盖 Discord 行为。
    - `spawnSubagentSessions` 必须为 true 才能为 `sessions_spawn({ thread: true })` 自动创建/绑定线程。
    - `spawnAcpSessions` 必须为 true 才能为 ACP 自动创建/绑定线程（`/acp spawn ... --thread ...` 或 `sessions_spawn({ runtime: "acp", thread: true })`）。
    - 如果某账户的线程绑定被禁用，`/focus` 和相关线程绑定操作将不可用。

    参见 [Sub-agents](/tools/subagents)、[ACP Agents](/tools/acp-agents) 和 [Configuration Reference](/gateway/configuration-reference)。

  </Accordion>

  <Accordion title="持久化 ACP 频道绑定">
    对于稳定的"始终在线"ACP 工作区，配置针对 Discord 会话的顶层类型化 ACP 绑定。

    配置路径：

    - `bindings[]` 中使用 `type: "acp"` 和 `match.channel: "discord"`

    示例：

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "discord",
        accountId: "default",
        peer: { kind: "channel", id: "222222222222222222" },
      },
      acp: { label: "codex-main" },
    },
  ],
  channels: {
    discord: {
      guilds: {
        "111111111111111111": {
          channels: {
            "222222222222222222": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

    注意：

    - `/acp spawn codex --bind here` 就地绑定当前 Discord 频道或线程，并将后续消息路由到同一 ACP 会话。
    - 这仍可能意味着"启动一个新的 Codex ACP 会话"，但它本身不会创建新的 Discord 线程。现有频道保持为聊天界面。
    - Codex 仍可以在磁盘上其自己的 `cwd` 或后端工作区中运行。该工作区是运行时状态，不是 Discord 线程。
    - 线程消息可以继承父频道的 ACP 绑定。
    - 在绑定的频道或线程中，`/new` 和 `/reset` 就地重置同一个 ACP 会话。
    - 临时线程绑定仍然有效，并可以在活跃期间覆盖目标解析。
    - 仅当 OpenClaw 需要通过 `--thread auto|here` 创建/绑定子线程时，才需要 `spawnAcpSessions`。在当前频道中使用 `/acp spawn ... --bind here` 不需要它。

    参见 [ACP Agents](/tools/acp-agents) 了解绑定行为详情。

  </Accordion>

  <Accordion title="Reaction 通知">
    每公会 reaction 通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    Reaction 事件转化为系统事件并附加到路由的 Discord 会话。

  </Accordion>

  <Accordion title="Ack reaction">
    `ackReaction` 在 OpenClaw 处理入站消息时发送确认表情符号。

    解析顺序：

    - `channels.discord.accounts.<accountId>.ackReaction`
    - `channels.discord.ackReaction`
    - `messages.ackReaction`
    - agent 身份表情符号回退（`agents.list[].identity.emoji`，否则 "👀"）

    注意：

    - Discord 接受 Unicode 表情符号或自定义表情符号名称。
    - 使用 `""` 禁用频道或账户的 reaction。

  </Accordion>

  <Accordion title="配置写入">
    频道发起的配置写入默认启用。

    这影响 `/config set|unset` 流程（当命令功能启用时）。

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

  <Accordion title="Gateway 代理">
    通过 `channels.discord.proxy` 将 Discord gateway WebSocket 流量和启动 REST 查找（应用 ID + allowlist 解析）路由到 HTTP(S) 代理。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    每账户覆盖：

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

    注意：

    - allowlist 可以使用 `pk:<memberId>`
    - 成员显示名称仅在 `channels.discord.dangerouslyAllowNameMatching: true` 时按名称/slug 匹配
    - 查找使用原始消息 ID 并受时间窗口约束
    - 如果查找失败，代理消息被视为 bot 消息并被丢弃，除非 `allowBots=true`

  </Accordion>

  <Accordion title="Presence 配置">
    设置状态或活动字段或启用自动 presence 时应用 presence 更新。

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

    流媒体示例：

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
    - 4: Custom（使用活动文本作为状态状态；表情符号可选）
    - 5: Competing

    自动 presence 示例（运行时健康信号）：

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token exhausted",
      },
    },
  },
}
```

    自动 presence 将运行时可用性映射到 Discord 状态：健康 => online，降级或未知 => idle，耗尽或不可用 => dnd。可选文本覆盖：

    - `autoPresence.healthyText`
    - `autoPresence.degradedText`
    - `autoPresence.exhaustedText`（支持 `{reason}` 占位符）

  </Accordion>

  <Accordion title="Discord 中的 Exec 审批">
    Discord 支持 DM 中基于按钮的 exec 审批，并可以选择在来源频道中发布审批提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `target` 为 `channel` 或 `both` 时，审批提示在频道中可见。只有配置的审批者可以使用按钮；其他用户收到临时拒绝。审批提示包含命令文本，所以仅在可信频道中启用频道传递。如果无法从会话键推导出频道 ID，OpenClaw 回退到 DM 传递。

    此处理程序的 Gateway 授权使用与其他 Gateway 客户端相同的共享凭据解析规约：

    - 环境变量优先的本地认证（`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD` 然后 `gateway.auth.*`）
    - 本地模式中，仅当 `gateway.auth.*` 未设置时，`gateway.remote.*` 可作为回退；已配置但未解析的本地 SecretRef 会关闭失败
    - 适用时通过 `gateway.remote.*` 支持远程模式
    - URL 覆盖是安全的：CLI 覆盖不重用隐式凭据，环境变量覆盖仅使用环境变量凭据

    如果审批因未知审批 ID 失败，请验证审批者列表和功能启用状态。

    相关文档：[Exec approvals](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## 工具和操作门控

Discord 消息操作包括消息传递、频道管理、审核、presence 和元数据操作。

核心示例：

- 消息传递：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- reaction：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- presence：`setPresence`

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组 | 默认 |
| --- | --- |
| reactions、messages、threads、pins、polls、search、memberInfo、roleInfo、channelInfo、channels、voiceStatus、events、stickers、emojiUploads、stickerUploads、permissions | 启用 |
| roles | 禁用 |
| moderation | 禁用 |
| presence | 禁用 |

## 组件 v2 UI

OpenClaw 使用 Discord 组件 v2 进行 exec 审批和跨上下文标记。Discord 消息操作也可以接受 `components` 用于自定义 UI（高级；需要 Carbon 组件实例），而旧版 `embeds` 仍然可用，但不推荐。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（十六进制）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 按账户设置。
- 当存在组件 v2 时，`embeds` 被忽略。

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

## 语音频道

OpenClaw 可以加入 Discord 语音频道进行实时、持续的对话。这与语音消息附件是分开的。

要求：

- 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
- 配置 `channels.discord.voice`。
- bot 需要在目标语音频道中拥有 Connect + Speak 权限。

使用 Discord 专用原生命令 `/vc join|leave|status` 控制会话。该命令使用账户默认 agent，并遵循与其他 Discord 命令相同的 allowlist 和群组策略规则。

自动加入示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
    },
  },
}
```

注意：

- `voice.tts` 仅覆盖语音播放的 `messages.tts`。
- 语音转录轮次从 Discord `allowFrom`（或 `dm.allowFrom`）中推导所有者状态；非所有者发言者无法访问仅所有者工具（例如 `gateway` 和 `cron`）。
- 语音默认启用；设置 `channels.discord.voice.enabled=false` 禁用。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 传递给 `@discordjs/voice` 加入选项。
- `@discordjs/voice` 默认值：未设置时 `daveEncryption=true` 和 `decryptionFailureTolerance=24`。
- OpenClaw 还监视接收解密失败，并在短时间内重复失败后通过离开/重新加入语音频道自动恢复。
- 如果接收日志反复显示 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，这可能是 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 中跟踪的上游 `@discordjs/voice` 接收错误。

## 语音消息

Discord 语音消息显示波形预览，需要 OGG/Opus 音频和元数据。OpenClaw 自动生成波形，但需要 gateway 主机上可用的 `ffmpeg` 和 `ffprobe` 来检查和转换音频文件。

要求和约束：

- 提供**本地文件路径**（URL 被拒绝）。
- 省略文本内容（Discord 不允许在同一负载中包含文本 + 语音消息）。
- 接受任何音频格式；需要时 OpenClaw 会转换为 OGG/Opus。

示例：

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排除

<AccordionGroup>
  <Accordion title="使用了不允许的 intents 或 bot 看不到公会消息">

    - 启用 Message Content Intent
    - 当依赖用户/成员解析时启用 Server Members Intent
    - 更改 intents 后重启 gateway

  </Accordion>

  <Accordion title="公会消息意外被阻止">

    - 验证 `groupPolicy`
    - 验证 `channels.discord.guilds` 下的公会 allowlist
    - 如果公会 `channels` 映射存在，只有列出的频道被允许
    - 验证 `requireMention` 行为和提及模式

    有用的检查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  </Accordion>

  <Accordion title="requireMention 为 false 但仍然被阻止">
    常见原因：

    - `groupPolicy="allowlist"` 没有匹配的公会/频道 allowlist
    - `requireMention` 配置在了错误的位置（必须在 `channels.discord.guilds` 或频道条目下）
    - 发送者被公会/频道 `users` allowlist 阻止

  </Accordion>

  <Accordion title="长时间运行的处理程序超时或重复回复">

    典型日志：

    - `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
    - `Slow listener detected ...`
    - `discord inbound worker timed out after ...`

    监听器预算调节：

    - 单账户：`channels.discord.eventQueue.listenerTimeout`
    - 多账户：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

    工作线程运行超时调节：

    - 单账户：`channels.discord.inboundWorker.runTimeoutMs`
    - 多账户：`channels.discord.accounts.<accountId>.inboundWorker.runTimeoutMs`
    - 默认：`1800000`（30 分钟）；设置 `0` 禁用

    推荐基线：

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
          inboundWorker: {
            runTimeoutMs: 1800000,
          },
        },
      },
    },
  },
}
```

    使用 `eventQueue.listenerTimeout` 处理慢监听器设置，仅在需要为排队的 agent 轮次设置独立安全阀时使用 `inboundWorker.runTimeoutMs`。

  </Accordion>

  <Accordion title="权限审计不匹配">
    `channels status --probe` 权限检查仅适用于数字频道 ID。

    如果你使用 slug 键，运行时匹配仍然可以工作，但探测无法完全验证权限。

  </Accordion>

  <Accordion title="DM 和配对问题">

    - DM 禁用：`channels.discord.dm.enabled=false`
    - DM 策略禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式下等待配对批准

  </Accordion>

  <Accordion title="Bot 到 Bot 循环">
    默认情况下 bot 发出的消息被忽略。

    如果你设置 `channels.discord.allowBots=true`，使用严格的提及和 allowlist 规则以避免循环行为。
    优先使用 `channels.discord.allowBots="mentions"` 仅接受提及了 bot 的 bot 消息。

  </Accordion>

  <Accordion title="语音 STT 出现 DecryptionFailed(...) 丢失">

    - 保持 OpenClaw 更新（`openclaw update`）以确保 Discord 语音接收恢复逻辑存在
    - 确认 `channels.discord.voice.daveEncryption=true`（默认）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，仅在必要时调整
    - 监视日志中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后失败继续，收集日志并与 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 对比

  </Accordion>
</AccordionGroup>

## 配置参考指针

主要参考：

- [配置参考 - Discord](/gateway/configuration-reference#discord)

Discord 高优先级字段：

- 启动/认证：`enabled`、`token`、`accounts.*`、`allowBots`
- 策略：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件队列：`eventQueue.listenerTimeout`（监听器预算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- 入站工作线程：`inboundWorker.runTimeoutMs`
- 回复/历史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 传递：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 流式传输：`streaming`（旧版别名：`streamMode`）、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒体/重试：`mediaMaxMb`、`retry`
  - `mediaMaxMb` 限制出站 Discord 上传（默认：`100MB`）
- 操作：`actions.*`
- presence：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

## 安全和运维

- 将 bot token 视为密钥（在受监督的环境中优先使用 `DISCORD_BOT_TOKEN`）。
- 授予最小权限的 Discord 权限。
- 如果命令部署/状态过时，重启 gateway 并用 `openclaw channels status --probe` 重新检查。

## 相关

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Channel 路由](/channels/channel-routing)
- [Security](/gateway/security)
- [多 Agent 路由](/concepts/multi-agent)
- [故障排除](/channels/troubleshooting)
- [Slash commands](/tools/slash-commands)
