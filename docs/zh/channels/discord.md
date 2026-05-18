---
mmh3_hash: "e81c33a70c9780a2db6403e09f195a3d"
summary: "Discord bot 支持状态、功能和配置"
read_when:
  - 使用 Discord channel 功能时
title: "Discord"
---

通过官方 Discord gateway 支持 DM 和公会频道。

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

    下方将出现 **Bot Permissions** 部分。至少启用：

    **General Permissions**
      - View Channels
    **Text Permissions**
      - Send Messages
      - Read Message History
      - Embed Links
      - Attach Files
      - Add Reactions（可选）

    这是普通文本频道的基本配置。如果你计划在 Discord 线程中发帖，包括创建或继续线程的论坛或媒体频道工作流，还需启用 **Send Messages in Threads**。
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
cat > discord.patch.json5 <<'JSON5'
{
  channels: {
    discord: {
      enabled: true,
      token: { source: "env", provider: "default", id: "DISCORD_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./discord.patch.json5 --dry-run
openclaw config patch --file ./discord.patch.json5
openclaw gateway
```

    如果 OpenClaw 已经作为后台服务运行，请通过 OpenClaw Mac 应用重启，或停止并重新启动 `openclaw gateway run` 进程。
    对于托管服务安装，请从存在 `DISCORD_BOT_TOKEN` 的 shell 中运行 `openclaw gateway install`，或将变量存储在 `~/.openclaw/.env` 中，以便服务在重启后可以解析 env SecretRef。
    如果你的主机被 Discord 启动应用查找阻止或限流，从 Developer Portal 设置 Discord 应用/客户端 ID 以便启动可以跳过该 REST 调用。使用 `channels.discord.applicationId` 作为默认账户，或在运行多个 Discord bot 时使用 `channels.discord.accounts.<accountId>.applicationId`。

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

        对于脚本或远程设置，使用 `openclaw config patch --file ./discord.patch.json5 --dry-run` 写入相同的 JSON5 块，然后不带 `--dry-run` 重新运行。支持明文 `token` 值。`channels.discord.token` 也支持 SecretRef 值（env/file/exec 提供者）。参见 [Secrets Management](/gateway/secrets)。

        对于多个 Discord bot，每个 bot token 和应用 ID 放在各自的账户下。顶层 `channels.discord.applicationId` 被各账户继承，因此只有当每个账户都应使用同一应用 ID 时才在顶层设置。

```json5
{
  channels: {
    discord: {
      enabled: true,
      accounts: {
        personal: {
          token: { source: "env", provider: "default", id: "DISCORD_PERSONAL_TOKEN" },
          applicationId: "111111111111111111",
        },
        work: {
          token: { source: "env", provider: "default", id: "DISCORD_WORK_TOKEN" },
          applicationId: "222222222222222222",
        },
      },
    },
  },
}
```

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
如果两个已启用的 Discord 账户解析为相同的 bot token，OpenClaw 仅为该 token 启动一个 gateway 监视器。配置来源的 token 优先于默认 env 回退；否则第一个已启用的账户获胜，重复账户被报告为已禁用。
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

    在公会频道中，普通 assistant 最终回复默认是私密的。可见的 Discord 输出必须通过 `message` 工具显式发送，因此 agent 默认可以潜伏，只在决定频道回复有用时才发帖。

    这意味着所选模型必须能可靠地调用工具。如果 Discord 显示正在输入但日志显示有 token 使用但没有发出消息，请检查会话日志中 `didSendViaMessagingTool: false` 的 assistant 文本。这意味着模型给出了私密最终答案而不是调用 `message(action=send)`。切换到更强的工具调用模型，或使用下面的配置恢复旧版自动最终回复。

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

        要为群组/频道房间恢复旧版自动最终回复，设置 `messages.groupChat.visibleReplies: "automatic"`。

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
- Discord 公会/频道元数据作为不可信上下文添加到模型提示中，而非用户可见的回复前缀。如果模型将该信封复制回来，OpenClaw 会从出站回复和未来重放上下文中剥除复制的元数据。
- 默认情况下（`session.dmScope=main`），直接聊天共享 agent 主会话（`agent:main:main`）。
- 公会频道是隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 群组 DM 默认被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生 slash 命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍将 `CommandTargetSessionKey` 携带到路由的会话。
- 仅文本的 cron/heartbeat 公告传递到 Discord 时使用最终 assistant 可见答案一次。媒体和结构化组件负载在 agent 发出多个可传递负载时仍然是多消息的。

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

`/model` 和 `/models` slash 命令会打开一个带有提供商、模型和兼容运行时下拉菜单以及提交步骤的交互式模型选择器。`/models add` 已弃用，现在返回弃用消息而不是从聊天注册模型。选择器回复是临时的，只有调用用户可以使用。Discord 选择菜单限制为 25 个选项，所以当你想让选择器仅为所选提供商（如 `openai-codex` 或 `vllm`）动态发现模型时，在 `agents.defaults.models` 中添加 `provider/*` 条目。

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
    `channels.discord.dmPolicy` 控制 DM 访问。`channels.discord.allowFrom` 是规范的 DM allowlist。

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`）
    - `disabled`

    如果 DM 策略不是 open，未知用户会被阻止（或在 `pairing` 模式下提示配对）。

    多账户优先级：

    - `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 对于一个账户，`allowFrom` 优先于旧版 `dm.allowFrom`。
    - 命名账户在未设置自己的 `allowFrom` 和旧版 `dm.allowFrom` 时继承 `channels.discord.allowFrom`。
    - 命名账户不继承 `channels.discord.accounts.default.allowFrom`。

    旧版 `channels.discord.dm.policy` 和 `channels.discord.dm.allowFrom` 仍可读取以保持兼容性。`openclaw doctor --fix` 在可以不更改访问权限的情况下将它们迁移到 `dmPolicy` 和 `allowFrom`。

    传递的 DM 目标格式：

    - `user:<id>`
    - `<@id>` 提及

    裸数字 ID 通常在激活频道默认时解析为频道 ID，但 allowlist 中列出的 ID 为兼容性被视为用户 DM 目标。

  </Tab>

  <Tab title="访问组">
    Discord DM 和文本命令授权可以在 `channels.discord.allowFrom` 中使用动态 `accessGroup:<name>` 条目。

    访问组名称在消息 Channel 之间共享。使用 `type: "message.senders"` 表示成员以每个 Channel 正常 `allowFrom` 语法表达的静态组，或使用 `type: "discord.channelAudience"` 使 Discord 频道的当前 `ViewChannel` 受众动态定义成员资格。共享访问组行为文档：[访问组](/channels/access-groups)。

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

    Discord 文本频道没有单独的成员列表。`type: "discord.channelAudience"` 将成员资格建模为：DM 发送者是已配置公会的成员，并且在应用角色和频道覆盖后对已配置频道具有有效的 `ViewChannel` 权限。

    示例：允许任何可以看到 `#maintainers` 的人向 bot 发送 DM，同时对其他人关闭 DM。

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

    你可以混合动态和静态条目：

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers", "discord:123456789012345678"],
    },
  },
}
```

    查找失败时关闭。如果 Discord 返回 `Missing Access`、成员查找失败或频道属于不同公会，DM 发送者被视为未授权。

    使用频道受众访问组时，在 Discord Developer Portal 为 bot 启用 **Server Members Intent**。DM 不包含公会成员状态，因此 OpenClaw 在授权时通过 Discord REST 解析成员。

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
    - 直接名称/标签匹配默认禁用；仅作为紧急兼容模式启用 `channels.discord.dangerouslyAllowNameMatching: true`
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

    在写出站 Discord 消息时，使用规范提及语法：用户用 `<@USER_ID>`，频道用 `<#CHANNEL_ID>`，角色用 `<@&ROLE_ID>`。不要使用旧版 `<@!USER_ID>` 昵称提及格式。

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

## 原生命令和命令授权

- `commands.native` 默认为 `"auto"`，为 Discord 启用。
- 每频道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 跳过启动时的 Discord slash 命令注册和清理。之前注册的命令可能在 Discord 中保持可见，直到你从 Discord 应用中移除它们。
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
    OpenClaw 可以通过发送临时消息并在文本到达时编辑来流式传输草稿回复。`channels.discord.streaming` 接受 `off` | `partial` | `block` | `progress`（默认）。`progress` 保留一个可编辑的状态草稿并用工具进度更新它，直到最终传递；共享起始标签是一个滚动行，因此一旦出现足够多的工作就像其余内容一样滚动消失。`streamMode` 是旧版运行时别名。运行 `openclaw doctor --fix` 将持久化的配置重写为规范键。

    设置 `channels.discord.streaming.mode` 为 `off` 以禁用 Discord 预览编辑。如果显式启用了 Discord 块流式传输，OpenClaw 跳过预览流以避免双重流式传输。

```json5
{
  channels: {
    discord: {
      streaming: {
        mode: "progress",
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
        },
      },
    },
  },
}
```

    - `partial` 在 token 到达时编辑单个预览消息。
    - `block` 发出草稿大小的块（使用 `draftChunk` 调整大小和断点，限制在 `textChunkLimit` 以内）。
    - 媒体、错误和显式回复的最终结果会取消待处理的预览编辑。
    - `streaming.preview.toolProgress`（默认 `true`）控制工具/进度更新是否重用预览消息。
    - 工具/进度行在可用时以紧凑的表情符号+标题+详情渲染，例如 `🛠️ Bash: run tests` 或 `🔎 Web Search: for "query"`。
    - `streaming.preview.commandText` / `streaming.progress.commandText` 控制紧凑进度行中的命令/执行详情：`raw`（默认）或 `status`（仅工具标签）。

    隐藏原始命令/执行文本同时保留紧凑进度行：

    ```json
    {
      "channels": {
        "discord": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    预览流式传输仅限文本；媒体回复回退到正常传递。当显式启用 `block` 流式传输时，OpenClaw 跳过预览流以避免双重流式传输。

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

    - Discord 线程作为频道会话路由，并继承父频道配置，除非被覆盖。
    - 线程会话继承父频道的会话级 `/model` 选择作为仅模型回退；线程本地 `/model` 选择仍然优先，父记录历史不会被复制，除非启用了记录继承。
    - `channels.discord.thread.inheritParent`（默认 `false`）将新的自动线程选择为从父记录播种。每账户覆盖位于 `channels.discord.accounts.<id>.thread.inheritParent`。
    - 消息工具 reaction 可以解析 `user:<id>` DM 目标。
    - `guilds.<guild>.channels.<channel>.requireMention: false` 在回复阶段激活回退期间得以保留。

    频道主题作为**不可信**上下文注入。allowlist 控制谁可以触发 agent，而不是完整的补充上下文编辑边界。

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
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
    },
  },
}
```

    注意：

    - `session.threadBindings.*` 设置全局默认值。
    - `channels.discord.threadBindings.*` 覆盖 Discord 行为。
    - `spawnSessions` 控制 `sessions_spawn({ thread: true })` 和 ACP 线程生成的自动创建/绑定线程。默认：`true`。
    - `defaultSpawnContext` 控制线程绑定生成的原生子 agent 上下文。默认：`"fork"`。
    - 已弃用的 `spawnSubagentSessions`/`spawnAcpSessions` 键由 `openclaw doctor --fix` 迁移。
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

    - `/acp spawn codex --bind here` 就地绑定当前频道或线程，并将未来消息路由到同一 ACP 会话。线程消息继承父频道绑定。
    - 在绑定的频道或线程中，`/new` 和 `/reset` 就地重置同一个 ACP 会话。临时线程绑定在活跃期间仍然可以覆盖目标解析。
    - `spawnSessions` 控制通过 `--thread auto|here` 创建/绑定子线程。

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

  <Accordion title="出站提及别名">
    当 agent 需要为已知 Discord 用户提供确定性出站提及时，使用 `mentionAliases`。键是不带前导 `@` 的句柄；值是 Discord 用户 ID。未知句柄、`@everyone`、`@here` 以及 Markdown 代码段内的提及保持不变。

```json5
{
  channels: {
    discord: {
      mentionAliases: {
        Vladislava: "123456789012345678",
      },
      accounts: {
        ops: {
          mentionAliases: {
            OpsLead: "234567890123456789",
          },
        },
      },
    },
  },
}
```

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
    - 4: Custom（使用活动文本作为状态文本；表情符号可选）
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
    - `channels.discord.execApprovals.approvers`（可选；在可能时回退到 `commands.ownerAllowFrom`）
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `enabled` 未设置或为 `"auto"` 且至少有一个审批者可以解析时，Discord 自动启用原生 exec 审批——来自 `execApprovals.approvers` 或 `commands.ownerAllowFrom`。Discord 不从频道 `allowFrom`、旧版 `dm.allowFrom` 或直接消息 `defaultTo` 推断 exec 审批者。显式设置 `enabled: false` 以禁用 Discord 作为原生审批客户端。

    对于 `/diagnostics` 和 `/export-trajectory` 等敏感的仅所有者群组命令，OpenClaw 私密发送审批提示和最终结果。当调用所有者有 Discord 所有者路由时，优先尝试 Discord DM；如果不可用，回退到 `commands.ownerAllowFrom` 中的第一个可用所有者路由（如 Telegram）。

    当 `target` 为 `channel` 或 `both` 时，审批提示在频道中可见。只有解析的审批者可以使用按钮；其他用户收到临时拒绝。审批提示包含命令文本，所以仅在可信频道中启用频道传递。如果无法从会话键推导出频道 ID，OpenClaw 回退到 DM 传递。

    Discord 还呈现其他聊天 Channel 使用的共享审批按钮。原生 Discord 适配器主要添加审批者 DM 路由和频道扇出。
    当这些按钮存在时，它们是主要的审批 UX；OpenClaw 只有在工具结果显示聊天审批不可用或手动审批是唯一路径时才包含手动 `/approve` 命令。
    如果 Discord 原生审批运行时未激活，OpenClaw 保持本地确定性的 `/approve <id> <decision>` 提示可见。如果运行时激活但无法将原生卡传递到任何目标，OpenClaw 发送一个同聊天回退通知，其中包含待处理审批的确切 `/approve` 命令。

    Gateway 认证和审批解析遵循共享 Gateway 客户端合约（`plugin:` ID 通过 `plugin.approval.resolve` 解析；其他 ID 通过 `exec.approval.resolve`）。审批默认在 30 分钟后过期。

    参见 [Exec approvals](/tools/exec-approvals)。

  </Accordion>
</AccordionGroup>

## 工具和操作门控

Discord 消息操作包括消息传递、频道管理、审核、presence 和元数据操作。

核心示例：

- 消息传递：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- reaction：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- presence：`setPresence`

`event-create` 操作接受可选的 `image` 参数（URL 或本地文件路径）来设置计划活动的封面图片。

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组                                                                                                                                                                     | 默认 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| reactions、messages、threads、pins、polls、search、memberInfo、roleInfo、channelInfo、channels、voiceStatus、events、stickers、emojiUploads、stickerUploads、permissions | 启用 |
| roles                                                                                                                                                                      | 禁用 |
| moderation                                                                                                                                                                 | 禁用 |
| presence                                                                                                                                                                   | 禁用 |

## 组件 v2 UI

OpenClaw 使用 Discord 组件 v2 进行 exec 审批和跨上下文标记。Discord 消息操作也可以接受 `components` 用于自定义 UI（高级；需要通过 discord 工具构建组件负载），而旧版 `embeds` 仍然可用，但不推荐。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（十六进制）。
- 使用 `channels.discord.accounts.<id>.ui.components.accentColor` 按账户设置。
- 当存在组件 v2 时，`embeds` 被忽略。
- 纯 URL 预览默认被抑制。在消息操作上设置 `suppressEmbeds: false` 以允许单条出站链接展开。

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

## 语音

Discord 有两个不同的语音界面：实时**语音频道**（持续对话）和**语音消息附件**（波形预览格式）。Gateway 都支持。

### 语音频道

设置清单：

1. 在 Discord Developer Portal 中启用 Message Content Intent。
2. 使用角色/用户 allowlist 时启用 Server Members Intent。
3. 邀请 bot 时使用 `bot` 和 `applications.commands` 权限范围。
4. 在目标语音频道中授予 Connect、Speak、Send Messages 和 Read Message History 权限。
5. 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
6. 配置 `channels.discord.voice`。

使用 `/vc join|leave|status` 控制会话。该命令使用账户默认 agent，并遵循与其他 Discord 命令相同的 allowlist 和群组策略规则。

```bash
/vc join channel:<voice-channel-id>
/vc status
/vc leave
```

在加入前检查 bot 的有效权限：

```bash
openclaw channels capabilities --channel discord --target channel:<voice-channel-id>
```

自动加入示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        allowedChannels: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

注意：

- `voice.tts` 仅覆盖 `stt-tts` 语音播放的 `messages.tts`。实时模式使用 `voice.realtime.voice`。
- `voice.mode` 控制对话路径。默认为 `agent-proxy`：实时语音前端处理轮次计时、打断和播放，通过 `openclaw_agent_consult` 将实质性工作委托给路由的 OpenClaw agent，并将结果视为来自该发言者的 Discord 提示。`stt-tts` 保留旧版批量 STT 加 TTS 流程。`bidi` 让实时模型直接对话，同时暴露 `openclaw_agent_consult` 作为 OpenClaw 大脑。
- `voice.agentSession` 控制哪个 OpenClaw 对话接收语音轮次。留空时使用语音频道自己的会话，或设置 `{ mode: "target", target: "channel:<text-channel-id>" }` 使语音频道作为现有 Discord 文本频道会话（如 `#maintainers`）的麦克风/扬声器扩展。
- `voice.model` 覆盖 Discord 语音响应和实时咨询的 OpenClaw agent 大脑。留空时继承路由的 agent 模型。它与 `voice.realtime.model` 是分开的。
- `agent-proxy` 通过 `discord-voice` 路由语音，保留发言者和目标会话的正常所有者/工具授权，但隐藏 agent `tts` 工具，因为 Discord 语音拥有播放权。默认情况下，`agent-proxy` 为所有者发言者授予完整所有者级工具访问权限（`voice.realtime.toolPolicy: "owner"`），并强烈倾向于在给出实质性答案之前咨询 OpenClaw agent（`voice.realtime.consultPolicy: "always"`）。在该默认 `always` 模式下，实时层不会在咨询回复之前自动播放填充语；它会捕获和转录语音，然后播放路由的 OpenClaw 答案。如果在 Discord 仍在播放第一个回答时有多个强制咨询答案完成，后续的精确语音回答会排队等待播放空闲，而不是在播放中途替换。
- 在 `stt-tts` 模式下，STT 使用 `tools.media.audio`；`voice.model` 不影响转录。
- 在实时模式下，`voice.realtime.provider`、`voice.realtime.model` 和 `voice.realtime.voice` 配置实时音频会话。对于 OpenAI Realtime 2 加 Codex 大脑，使用 `voice.realtime.model: "gpt-realtime-2"` 和 `voice.model: "openai-codex/gpt-5.5"`。
- OpenAI 实时 Provider 接受当前的 Realtime 2 事件名称以及旧版 Codex 兼容别名，以便兼容的 provider 快照漂移时不会丢失 assistant 音频。
- `voice.realtime.bargeIn` 控制 Discord 发言者开始事件是否打断活跃实时播放。未设置时遵循实时 provider 的输入音频打断设置。
- `voice.realtime.minBargeInAudioEndMs` 控制 OpenAI 实时打断截断音频之前的最小 assistant 播放时长。默认：`250`。在低回声房间设置 `0` 以实现即时打断，或在回声严重的扬声器环境中提高该值。
- 对于 Discord 播放的 OpenAI 语音，设置 `voice.tts.provider: "openai"` 并在 `voice.tts.openai.voice` 或 `voice.tts.providers.openai.voice` 下选择 Text-to-speech 声音。
- 每频道 Discord `systemPrompt` 覆盖适用于该语音频道的语音转录轮次。
- 语音转录轮次从 Discord `allowFrom`（或 `dm.allowFrom`）中推导所有者状态；非所有者发言者无法访问仅所有者工具（例如 `gateway` 和 `cron`）。
- Discord 语音对仅文本配置为选择启用；设置 `channels.discord.voice.enabled=true` 以启用 `/vc` 命令、语音运行时和 `GuildVoiceStates` gateway intent。
- `channels.discord.intents.voiceStates` 可以显式覆盖语音状态 intent 订阅。
- 如果 `voice.autoJoin` 对同一公会有多个条目，OpenClaw 加入该公会最后配置的频道。
- `voice.allowedChannels` 是可选的驻留 allowlist。留空时允许 `/vc join` 进入任何已授权的 Discord 语音频道。设置后，`/vc join`、启动自动加入和 bot 语音状态移动将限制在列出的 `{ guildId, channelId }` 条目中。设置为空数组以拒绝所有 Discord 语音加入。如果 Discord 将 bot 移出 allowlist 范围，OpenClaw 将离开该频道，并在有自动加入目标时重新加入。
- `voice.daveEncryption` 和 `voice.decryptionFailureTolerance` 传递给 `@discordjs/voice` 加入选项。
- `@discordjs/voice` 默认值为 `daveEncryption=true` 和 `decryptionFailureTolerance=24`（未设置时）。
- OpenClaw 默认使用纯 JS `opusscript` 解码器。可选的原生 `@discordjs/opus` 包被 repo pnpm 安装策略忽略，因此普通安装、Docker 通道和无关测试不会编译原生插件。专用语音性能主机可以在安装原生插件后通过 `OPENCLAW_DISCORD_OPUS_DECODER=native` 选择启用。
- `voice.connectTimeoutMs` 控制 `/vc join` 和自动加入尝试的初始 `@discordjs/voice` Ready 等待时间。默认：`30000`。
- `voice.reconnectGraceMs` 控制在销毁断开连接的语音会话之前等待开始重新连接的时间。默认：`15000`。
- 在 `stt-tts` 模式下，语音播放不会因为另一个用户开始说话而停止。为避免反馈回路，OpenClaw 在 TTS 播放期间忽略新的语音捕获；播放结束后说话以进行下一轮。实时模式将发言者开始作为打断信号转发给实时 provider。
- 在实时模式下，扬声器中的回声进入开放的麦克风可能看起来像打断并中止播放。对于回声严重的 Discord 房间，设置 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false` 以阻止 OpenAI 在输入音频时自动打断。如果你仍然希望 Discord 发言者开始事件打断活跃播放，添加 `voice.realtime.bargeIn: true`。
- `voice.captureSilenceGraceMs` 控制 Discord 报告发言者停止后 OpenClaw 等待多久才最终确定该音频片段用于 STT。默认：`2500`；如果 Discord 将正常停顿分割成断断续续的部分转录，请提高此值。
- 当 ElevenLabs 是所选 TTS provider 时，Discord 语音播放使用流式 TTS 并从 provider 响应流开始。不支持流式传输的 provider 回退到合成临时文件路径。
- OpenClaw 还监视接收解密失败，并在短时间内重复失败后通过离开/重新加入语音频道自动恢复。
- 如果接收日志反复显示更新后出现 `DecryptionFailed(UnencryptedWhenPassthroughDisabled)`，请收集依赖项报告和日志。捆绑的 `@discordjs/voice` 版本包含来自 discord.js PR #11449 的上游 padding 修复，该修复关闭了 discord.js issue #11419。
- `The operation was aborted` 接收事件在 OpenClaw 最终确定捕获的发言者片段时是预期的；它们是详细诊断，不是警告。
- 详细 Discord 语音日志为每个被接受的发言者片段包含一行有界 STT 转录预览，因此调试时可以看到用户侧和 agent 回复侧，而无需转储无界的转录文本。
- 在 `agent-proxy` 模式下，强制咨询回退会跳过可能不完整的转录片段，例如以 `...` 或后置连接词如 `and` 结尾的文本，以及明显无操作性的结束语如"be right back"或"bye"。日志在此类情况防止过时排队答案时显示 `forced agent consult skipped reason=...`。

原生 opus 设置（源码检出）：

```bash
pnpm install
mise exec node@22 -- pnpm discord:opus:install
```

如果需要上游 macOS arm64 预构建原生插件，请使用 Node 22 运行 gateway。如果使用其他 Node 运行时，选择启用的安装程序可能需要本地 `node-gyp` 源码构建工具链。

安装原生插件后，启动 Gateway：

```bash
OPENCLAW_DISCORD_OPUS_DECODER=native pnpm gateway:watch
```

详细语音日志应显示 `discord voice: opus decoder: @discordjs/opus`。未设置 env 选择启用，或原生插件缺失或无法在主机上加载时，OpenClaw 日志显示 `discord voice: opus decoder: opusscript` 并通过纯 JS 回退继续接收语音。

STT 加 TTS 流程：

- Discord PCM 捕获转换为 WAV 临时文件。
- `tools.media.audio` 处理 STT，例如 `openai/gpt-4o-mini-transcribe`。
- 转录通过 Discord 入站和路由发送，同时响应 LLM 以语音输出策略运行，该策略隐藏 agent `tts` 工具并要求返回文本，因为 Discord 语音拥有最终 TTS 播放。
- `voice.model`（如果设置）仅覆盖此语音频道轮次的响应 LLM。
- `voice.tts` 合并在 `messages.tts` 之上；具有流式传输能力的提供者直接馈送播放器，否则生成的音频文件在已加入的频道中播放。

默认 agent-proxy 语音频道会话示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

没有 `voice.agentSession` 块时，每个语音频道有自己路由的 OpenClaw 会话。例如，`/vc join channel:234567890123456789` 与该 Discord 语音频道的会话对话。实时模型只是语音前端；实质性请求被移交给配置的 OpenClaw agent。如果实时模型在未调用咨询工具的情况下产生最终转录，OpenClaw 强制将咨询作为回退，使默认行为仍像与 agent 对话。

旧版 STT 加 TTS 示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "stt-tts",
        model: "openai/gpt-5.4-mini",
        tts: {
          provider: "openai",
          openai: {
            model: "gpt-4o-mini-tts",
            voice: "cedar",
          },
        },
      },
    },
  },
}
```

实时 bidi 示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          toolPolicy: "safe-read-only",
          consultPolicy: "always",
        },
      },
    },
  },
}
```

语音作为现有 Discord 频道会话的扩展：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "agent-proxy",
        model: "openai-codex/gpt-5.5",
        agentSession: {
          mode: "target",
          target: "channel:123456789012345678",
        },
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
    },
  },
}
```

在 `agent-proxy` 模式下，bot 加入配置的语音频道，但 OpenClaw agent 轮次使用目标频道的正常路由会话和 agent。实时语音会话将返回的结果播报回语音频道。监督 agent 仍然可以根据其工具策略使用正常的消息工具，包括在合适时发送单独的 Discord 消息。

有用的目标形式：

- `target: "channel:123456789012345678"` 通过 Discord 文本频道会话路由。
- `target: "123456789012345678"` 被视为频道目标。
- `target: "dm:123456789012345678"` 或 `target: "user:123456789012345678"` 通过该私信会话路由。

回声严重的 OpenAI Realtime 示例：

```json5
{
  channels: {
    discord: {
      voice: {
        enabled: true,
        mode: "bidi",
        model: "openai-codex/gpt-5.5",
        realtime: {
          provider: "openai",
          model: "gpt-realtime-2",
          voice: "cedar",
          bargeIn: true,
          minBargeInAudioEndMs: 500,
          consultPolicy: "always",
          providers: {
            openai: {
              interruptResponseOnInputAudio: false,
            },
          },
        },
      },
    },
  },
}
```

当模型通过开放的麦克风听到自己的 Discord 播放，但你仍然希望通过说话来打断它时使用此配置。OpenClaw 阻止 OpenAI 在原始输入音频时自动打断，而 `bargeIn: true` 让 Discord 发言者开始事件和已激活的发言者音频在下一个捕获的轮次到达 OpenAI 之前取消活跃的实时响应。`audioEndMs` 低于 `minBargeInAudioEndMs` 的极早期打断信号被视为可能的回声/噪音而被忽略，以防止模型在第一个播放帧处被切断。

预期的语音日志：

- 加入时：`discord voice: joining ... voiceSession=... supervisorSession=... agentSessionMode=... voiceModel=... realtimeModel=...`
- 实时启动时：`discord voice: realtime bridge starting ... autoRespond=false interruptResponse=false bargeIn=false minBargeInAudioEndMs=...`
- 发言者音频时：`discord voice: realtime speaker turn opened ...`、`discord voice: realtime input audio started ... outputAudioMs=... outputActive=...` 和 `discord voice: realtime speaker turn closed ... chunks=... discordBytes=... realtimeBytes=... interruptedPlayback=...`
- 跳过过时语音时：`discord voice: realtime forced agent consult skipped reason=incomplete-transcript ...` 或 `reason=non-actionable-closing ...`
- 实时响应完成时：`discord voice: realtime audio playback finishing reason=response.done ... audioMs=... chunks=...`
- 播放停止/重置时：`discord voice: realtime audio playback stopped reason=... audioMs=... elapsedMs=... chunks=...`
- 实时咨询时：`discord voice: realtime consult requested ... voiceSession=... supervisorSession=... question=...`
- agent 回答时：`discord voice: agent turn answer ...`
- 排队精确语音时：`discord voice: realtime exact speech queued ... queued=... outputAudioMs=... outputActive=...`，随后 `discord voice: realtime exact speech dequeued reason=player-idle ...`
- 打断检测时：`discord voice: realtime barge-in detected source=speaker-start ...` 或 `discord voice: realtime barge-in detected source=active-speaker-audio ...`，随后 `discord voice: realtime barge-in requested reason=... outputAudioMs=... outputActive=...`
- 实时打断时：`discord voice: realtime model interrupt requested client:response.cancel reason=barge-in`，随后 `discord voice: realtime model audio truncated client:conversation.item.truncate reason=barge-in audioEndMs=...` 或 `discord voice: realtime model interrupt confirmed server:response.done status=cancelled ...`
- 忽略回声/噪音时：`discord voice: realtime model interrupt ignored client:conversation.item.truncate.skipped reason=barge-in audioEndMs=0 minAudioEndMs=250`
- 打断禁用时：`discord voice: realtime capture ignored during playback (barge-in disabled) ...`
- 播放空闲时：`discord voice: realtime barge-in ignored reason=... outputActive=false ... playbackChunks=0`

调试切断音频时，将实时语音日志作为时间线阅读：

1. `realtime audio playback started` 表示 Discord 已开始播放 assistant 音频。bridge 从此点开始计数 assistant 输出块、Discord PCM 字节、provider 实时字节和合成音频时长。
2. `realtime speaker turn opened` 标记 Discord 发言者变为活跃状态。如果播放已经活跃且启用了 `bargeIn`，这之后可能出现 `barge-in detected source=speaker-start`。
3. `realtime input audio started` 标记该发言者轮次收到的第一个实际音频帧。此处 `outputActive=true` 或非零 `outputAudioMs` 表示麦克风在 assistant 播放仍活跃时发送输入。
4. `barge-in detected source=active-speaker-audio` 表示 OpenClaw 在 assistant 播放活跃时看到了实时发言者音频。这有助于区分真实打断与没有有用音频的 Discord 发言者开始事件。
5. `barge-in requested reason=...` 表示 OpenClaw 要求实时 provider 取消或截断活跃响应。包含 `outputAudioMs`、`outputActive` 和 `playbackChunks`，可以看到打断前实际播放了多少 assistant 音频。
6. `realtime audio playback stopped reason=...` 是本地 Discord 播放重置点。reason 说明谁停止了播放：`barge-in`、`player-idle`、`provider-clear-audio`、`forced-agent-consult`、`stream-close` 或 `session-close`。
7. `realtime speaker turn closed` 总结捕获的输入轮次。`chunks=0` 或 `hasAudio=false` 表示发言者轮次开始但没有可用音频到达实时 bridge。`interruptedPlayback=true` 表示该输入轮次与 assistant 输出重叠并触发了打断逻辑。

有用字段：

- `outputAudioMs`：日志行之前实时 provider 生成的 assistant 音频时长。
- `audioMs`：OpenClaw 在播放停止之前计数的 assistant 音频时长。
- `elapsedMs`：打开和关闭播放流或发言者轮次之间的挂钟时间。
- `discordBytes`：发送到或从 Discord 语音接收的 48 kHz 立体声 PCM 字节。
- `realtimeBytes`：发送到或从实时 provider 接收的 provider 格式 PCM 字节。
- `playbackChunks`：为活跃响应转发给 Discord 的 assistant 音频块。
- `sinceLastAudioMs`：最后一个捕获的发言者音频帧与发言者轮次关闭之间的间隔。

常见模式：

- `source=active-speaker-audio` 立即切断、小 `outputAudioMs`，以及附近相同用户通常指向发言者回声进入麦克风。提高 `voice.realtime.minBargeInAudioEndMs`，降低扬声器音量，使用耳机，或设置 `voice.realtime.providers.openai.interruptResponseOnInputAudio: false`。
- `source=speaker-start` 后跟 `speaker turn closed ... hasAudio=false` 表示 Discord 报告了发言者开始但没有音频到达 OpenClaw。这可能是瞬时 Discord 语音事件、噪音门行为，或客户端短暂启用了麦克风。
- 没有附近打断或 `provider-clear-audio` 的 `audio playback stopped reason=stream-close` 表示本地 Discord 播放流意外结束。检查前面的 provider 和 Discord 播放器日志。
- `capture ignored during playback (barge-in disabled)` 表示 OpenClaw 在 assistant 音频活跃时故意丢弃了输入。如果希望语音打断播放，启用 `voice.realtime.bargeIn`。
- `barge-in ignored ... outputActive=false` 表示 Discord 或 provider VAD 报告了语音，但 OpenClaw 没有活跃播放可以打断。这不应该切断音频。

各组件的凭据按各自解析：LLM 路由认证用于 `voice.model`，STT 认证用于 `tools.media.audio`，TTS 认证用于 `messages.tts`/`voice.tts`，实时 provider 认证用于 `voice.realtime.providers` 或 provider 的正常认证配置。

### 语音消息

Discord 语音消息显示波形预览，需要 OGG/Opus 音频。OpenClaw 自动生成波形，但需要 gateway 主机上可用的 `ffmpeg` 和 `ffprobe` 来检查和转换。

- 提供**本地文件路径**（URL 被拒绝）。
- 省略文本内容（Discord 不允许在同一负载中包含文本 + 语音消息）。
- 接受任何音频格式；需要时 OpenClaw 会转换为 OGG/Opus。

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

  <Accordion title="长时间运行的 Discord 轮次或重复回复">

    典型日志：

    - `Slow listener detected ...`
    - `stuck session: sessionKey=agent:...:discord:... state=processing ...`

    Discord gateway 队列调节：

    - 单账户：`channels.discord.eventQueue.listenerTimeout`
    - 多账户：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`
    - 这仅控制 Discord gateway 监听器工作，不是 agent 轮次生命周期

    Discord 不对排队的 agent 轮次应用频道拥有的超时。消息监听器立即移交，排队的 Discord 运行保持每会话顺序，直到会话/工具/运行时生命周期完成或中止工作。

```json5
{
  channels: {
    discord: {
      accounts: {
        default: {
          eventQueue: {
            listenerTimeout: 120000,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="Gateway 元数据查找超时警告">
    OpenClaw 在连接前获取 Discord `/gateway/bot` 元数据。暂时性失败回退到 Discord 的默认 gateway URL，并在日志中限速。

    元数据超时调节：

    - 单账户：`channels.discord.gatewayInfoTimeoutMs`
    - 多账户：`channels.discord.accounts.<accountId>.gatewayInfoTimeoutMs`
    - 未设置配置时的 env 回退：`OPENCLAW_DISCORD_GATEWAY_INFO_TIMEOUT_MS`
    - 默认：`30000`（30 秒），最大：`120000`

  </Accordion>

  <Accordion title="Gateway READY 超时重启">
    OpenClaw 在启动和运行时重新连接期间等待 Discord gateway 的 `READY` 事件。具有启动错位的多账户设置可能需要比默认更长的启动 READY 等待时间。

    READY 超时调节：

    - 启动单账户：`channels.discord.gatewayReadyTimeoutMs`
    - 启动多账户：`channels.discord.accounts.<accountId>.gatewayReadyTimeoutMs`
    - 启动 env 回退：`OPENCLAW_DISCORD_READY_TIMEOUT_MS`
    - 启动默认：`15000`（15 秒），最大：`120000`
    - 运行时单账户：`channels.discord.gatewayRuntimeReadyTimeoutMs`
    - 运行时多账户：`channels.discord.accounts.<accountId>.gatewayRuntimeReadyTimeoutMs`
    - 运行时 env 回退：`OPENCLAW_DISCORD_RUNTIME_READY_TIMEOUT_MS`
    - 运行时默认：`30000`（30 秒），最大：`120000`

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

    OpenClaw 还附带共享 [bot 循环保护](/channels/bot-loop-protection)。每当 `allowBots` 让 bot 发出的消息到达调度时，Discord 将入站事件映射到 `(account, channel, bot pair)` 事实，通用配对守卫在配对跨越配置的事件预算后抑制该配对。守卫可防止之前必须依靠 Discord 限流才能停止的失控双 bot 循环；它不影响单 bot 部署或保持在预算内的一次性 bot 回复。

    默认设置（`allowBots` 设置时激活）：

    - `maxEventsPerWindow: 20` -- bot 配对在滑动窗口内可以交换 20 条消息
    - `windowSeconds: 60` -- 滑动窗口长度
    - `cooldownSeconds: 60` -- 一旦预算触发，任一方向的每条额外 bot 对 bot 消息都会被丢弃一分钟

    在 `channels.defaults.botLoopProtection` 下配置一次共享默认值，然后在合法工作流需要更多空间时覆盖 Discord。优先级为：

    - `channels.discord.accounts.<account>.botLoopProtection`
    - `channels.discord.botLoopProtection`
    - `channels.defaults.botLoopProtection`
    - 内置默认值

    Discord 使用通用的 `maxEventsPerWindow`、`windowSeconds` 和 `cooldownSeconds` 键。

```json5
{
  channels: {
    defaults: {
      botLoopProtection: {
        maxEventsPerWindow: 20,
        windowSeconds: 60,
        cooldownSeconds: 60,
      },
    },
    discord: {
      // 可选的 Discord 范围覆盖。账户块覆盖单个字段，并从此处继承省略的字段。
      botLoopProtection: {
        maxEventsPerWindow: 4,
      },
      accounts: {
        mantis: {
          // Mantis 只在其他 bot 提及她时才监听。
          allowBots: "mentions",
        },
        molty: {
          // Molty 监听所有 bot 发出的 Discord 消息。
          allowBots: true,
          mentionAliases: {
            // 让 Molty 写 "@Mantis" 并发送真正的 Discord 提及。
            Mantis: "MANTIS_DISCORD_USER_ID",
          },
          botLoopProtection: {
            // 每分钟最多允许五条消息，然后抑制该配对。
            maxEventsPerWindow: 5,
            windowSeconds: 60,
            cooldownSeconds: 90,
          },
        },
      },
    },
  },
}
```

  </Accordion>

  <Accordion title="语音 STT 出现 DecryptionFailed(...) 丢失">

    - 保持 OpenClaw 更新（`openclaw update`）以确保 Discord 语音接收恢复逻辑存在
    - 确认 `channels.discord.voice.daveEncryption=true`（默认）
    - 从 `channels.discord.voice.decryptionFailureTolerance=24`（上游默认值）开始，仅在必要时调整
    - 监视日志中的：
      - `discord voice: DAVE decrypt failures detected`
      - `discord voice: repeated decrypt failures; attempting rejoin`
    - 如果自动重新加入后失败继续，收集日志并与上游 DAVE 接收历史对比 [discord.js #11419](https://github.com/discordjs/discord.js/issues/11419) 和 [discord.js #11449](https://github.com/discordjs/discord.js/pull/11449)

  </Accordion>
</AccordionGroup>

## 配置参考

主要参考：[配置参考 - Discord](/gateway/config-channels#discord)。

<Accordion title="Discord 高优先级字段">

- 启动/认证：`enabled`、`token`、`accounts.*`、`allowBots`
- 策略：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件队列：`eventQueue.listenerTimeout`（监听器预算）、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- gateway：`gatewayInfoTimeoutMs`、`gatewayReadyTimeoutMs`、`gatewayRuntimeReadyTimeoutMs`
- 回复/历史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 传递：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 流式传输：`streaming`（旧版别名：`streamMode`）、`streaming.preview.toolProgress`、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒体/重试：`mediaMaxMb`（限制出站 Discord 上传，默认 `100MB`）、`retry`
- 操作：`actions.*`
- presence：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

</Accordion>

## 安全和运维

- 将 bot token 视为密钥（在受监督的环境中优先使用 `DISCORD_BOT_TOKEN`）。
- 授予最小权限的 Discord 权限。
- 如果命令部署/状态过时，重启 gateway 并用 `openclaw channels status --probe` 重新检查。

## 相关

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    将 Discord 用户与 Gateway 配对。
  </Card>
  <Card title="Groups" icon="users" href="/channels/groups">
    群聊和 allowlist 行为。
  </Card>
  <Card title="Channel routing" icon="route" href="/channels/channel-routing">
    将入站消息路由到 Agents。
  </Card>
  <Card title="Security" icon="shield" href="/gateway/security">
    威胁模型和安全加固。
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/concepts/multi-agent">
    将公会和频道映射到 Agents。
  </Card>
  <Card title="Slash commands" icon="terminal" href="/tools/slash-commands">
    原生命令行为。
  </Card>
</CardGroup>
