---
read_when:
  - 开发 Discord 渠道功能时
summary: Discord 机器人支持状态、功能和配置
title: Discord
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ba6759efde86577311dff3c069e0c96b02331ae7a29148c84c49f2ed606949cc
  source_path: channels/discord.md
  workflow: 15
---

# Discord（Bot API）

状态：已支持通过官方 Discord 机器人网关进行私信和服务器文字频道通信。

## 快速设置

你需要创建一个带有机器人的新应用，将机器人加入服务器，并与 OpenClaw 配对。建议将机器人添加到你自己的私人服务器。如果尚未创建服务器，请先创建一个（选择**创建我的服务器 > 仅供我和我的朋友使用**）。

### 1）创建 Discord 应用和机器人用户

1. 前往 [Discord 开发者门户](https://discord.com/developers/applications)，点击 **New Application**，命名为"OpenClaw"之类的名字。
2. 点击侧边栏中的 **Bot**。将 **Username** 设置为你对 OpenClaw 智能体的称呼。

### 2）启用特权网关意图

在 **Bot** → **Privileged Gateway Intents** 中启用：

- **Message Content Intent**（必填）
- **Server Members Intent**（推荐；角色 allowlist 和名称转 ID 匹配所需）
- **Presence Intent**（可选；仅在需要接收存在状态更新时需要）

### 3）复制机器人令牌

在 **Bot** 页面上点击 **Reset Token**，复制令牌并保存。这是你的**机器人令牌**。

### 4）生成邀请 URL 并将机器人加入服务器

点击侧边栏中的 **OAuth2** → **URL Generator**，启用：

- `bot`
- `applications.commands`

**Bot Permissions** 最小基线：

- View Channels
- Send Messages
- Read Message History
- Embed Links
- Attach Files
- Add Reactions（可选）

复制生成的 URL，在浏览器中打开，选择你的服务器，点击 **Continue** 连接。

### 5）启用开发者模式并收集 ID

1. Discord → **用户设置**（头像旁边的齿轮图标）→ **高级** → 开启**开发者模式**
2. 右键点击：
   - **服务器图标** → **复制服务器 ID**
   - **你的头像** → **复制用户 ID**

### 6）允许服务器成员发送私信

为了让配对正常工作，Discord 需要允许你的机器人向你发私信。右键点击**服务器图标** → **隐私设置** → 开启**直接消息**。

### 7）安全设置机器人令牌

你的 Discord 机器人令牌是密钥（类似密码）。在运行 OpenClaw 的机器上设置它：

```bash
export DISCORD_BOT_TOKEN="YOUR_BOT_TOKEN"
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN --dry-run
openclaw config set channels.discord.token --ref-provider default --ref-source env --ref-id DISCORD_BOT_TOKEN
openclaw config set channels.discord.enabled true --strict-json
openclaw gateway
```

如果 OpenClaw 已作为后台服务运行，请通过 OpenClaw Mac 应用重启，或停止并重启 `openclaw gateway run` 进程。

### 8）配置 OpenClaw 并配对

**通过智能体（推荐）**：在任意现有渠道（如 Telegram）与你的 OpenClaw 智能体对话，告知它：

> "我已在配置中设置了 Discord 机器人令牌。请用用户 ID `<user_id>` 和服务器 ID `<server_id>` 完成 Discord 设置。"

**或通过文件配置**：

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

环境变量回退（用于默认账户）：

```bash
DISCORD_BOT_TOKEN=...
```

明文 `token` 值也受支持。`channels.discord.token` 支持 env/file/exec 提供商的 SecretRef 值。参见[密钥管理](/gateway/secrets)。

### 9）批准首次私信配对

等待 Gateway 网关运行后，在 Discord 中私信你的机器人。它会回复一个配对码。

通过智能体批准（发送到现有渠道）：

> "批准此 Discord 配对码：`<CODE>`"

或通过 CLI：

```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

配对码 1 小时后过期。完成后你就可以在 Discord 私信中与智能体对话了。

> 注意：令牌解析感知账户。配置中的令牌值优先于环境变量回退。`DISCORD_BOT_TOKEN` 仅用于默认账户。

## 推荐：设置服务器工作区

私信正常后，你可以将 Discord 服务器设置为完整工作区，让每个频道拥有独立的智能体会话和上下文。

**添加服务器到服务器 allowlist**：

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

**允许无需 @提及即可响应**（私人服务器推荐）：

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

**关于服务器频道中的记忆**：默认情况下，长期记忆（MEMORY.md）仅在私信会话中加载。服务器频道不会自动加载 MEMORY.md。需要共享上下文时，将稳定指令放入 `AGENTS.md` 或 `USER.md`（每次会话都会注入）；长期笔记存入 `MEMORY.md`，按需使用记忆工具访问。

## 运行时模型

- Gateway 网关拥有 Discord 连接。
- 回复路由是确定性的：Discord 入站消息回复到 Discord。
- 默认情况下（`session.dmScope=main`），私信共享智能体主会话（`agent:main:main`）。
- 服务器频道使用隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 群组私信默认被忽略（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`）。

## 论坛频道

Discord 论坛和媒体频道仅接受帖子线程。OpenClaw 支持两种方式创建：

- 向论坛父频道（`channel:<forumId>`）发送消息，自动创建线程。线程标题使用消息的第一行非空内容。
- 使用 `openclaw message thread create` 直接创建线程。论坛频道不要传入 `--message-id`。

示例：向论坛父频道发送消息以创建线程

```bash
openclaw message send --channel discord --target channel:<forumId> \
  --message "主题标题\n帖子正文"
```

示例：显式创建论坛线程

```bash
openclaw message thread create --channel discord --target channel:<forumId> \
  --thread-name "主题标题" --message "帖子正文"
```

论坛父频道不接受 Discord 组件。如需组件，请发送到线程本身（`channel:<threadId>`）。

## 交互式组件

OpenClaw 支持智能体消息使用 Discord components v2 容器。通过消息工具传入 `components` 负载即可。交互结果作为普通入站消息路由回智能体，遵循现有的 Discord `replyToMode` 设置。

支持的块类型：

- `text`、`section`、`separator`、`actions`、`media-gallery`、`file`
- Action row 允许最多 5 个按钮或一个下拉菜单
- 下拉类型：`string`、`user`、`role`、`mentionable`、`channel`

默认组件为一次性使用。设置 `components.reusable=true` 允许按钮、下拉菜单和表单在过期前多次使用。

要限制谁可以点击按钮，在按钮上设置 `allowedUsers`（Discord 用户 ID、标签或 `*`）。配置后，不匹配的用户会收到隐性拒绝。

`/model` 和 `/models` 斜杠命令会打开带有提供商和模型下拉菜单的交互式模型选择器。选择器回复是隐性的，仅调用者可以使用。

文件附件：

- `file` 块必须指向附件引用（`attachment://<filename>`）
- 通过 `media`/`path`/`filePath` 提供附件（单文件）；多文件使用 `media-gallery`
- 使用 `filename` 覆盖上传名称（需与附件引用匹配时）

模态表单：

- 添加 `components.modal`，最多 5 个字段
- 字段类型：`text`、`checkbox`、`radio`、`select`、`role-select`、`user-select`
- OpenClaw 自动添加触发按钮

示例：

```json5
{
  channel: "discord",
  action: "send",
  to: "channel:123456789012345678",
  message: "可选的回退文本",
  components: {
    reusable: true,
    text: "选择一条路径",
    blocks: [
      {
        type: "actions",
        buttons: [
          {
            label: "批准",
            style: "success",
            allowedUsers: ["123456789012345678"],
          },
          { label: "拒绝", style: "danger" },
        ],
      },
      {
        type: "actions",
        select: {
          type: "string",
          placeholder: "选择一个选项",
          options: [
            { label: "选项 A", value: "a" },
            { label: "选项 B", value: "b" },
          ],
        },
      },
    ],
    modal: {
      title: "详情",
      triggerLabel: "打开表单",
      fields: [
        { type: "text", label: "申请人" },
        {
          type: "select",
          label: "优先级",
          options: [
            { label: "低", value: "low" },
            { label: "高", value: "high" },
          ],
        },
      ],
    },
  },
}
```

## 访问控制和路由

### 私信策略

`channels.discord.dmPolicy` 控制私信访问（旧版：`channels.discord.dm.policy`）：

- `pairing`（默认）
- `allowlist`
- `open`（需要 `channels.discord.allowFrom` 包含 `"*"`；旧版：`channels.discord.dm.allowFrom`）
- `disabled`

私信策略非 open 时，未知用户会被拦截（pairing 模式下提示配对）。

多账户优先级：

- `channels.discord.accounts.default.allowFrom` 仅适用于 `default` 账户。
- 命名账户在其自身 `allowFrom` 未设置时继承 `channels.discord.allowFrom`。
- 命名账户不继承 `channels.discord.accounts.default.allowFrom`。

私信投递目标格式：

- `user:<id>`
- `<@id>` 提及

裸数字 ID 存在歧义，除非提供了明确的用户/频道目标类型，否则会被拒绝。

### 服务器策略

服务器处理由 `channels.discord.groupPolicy` 控制：

- `open`
- `allowlist`
- `disabled`

当 `channels.discord` 存在时，安全基线为 `allowlist`。

`allowlist` 行为：

- 服务器必须匹配 `channels.discord.guilds`（优先使用 ID，也接受 slug）
- 可选发送者 allowlist：`users`（推荐使用稳定 ID）和 `roles`（仅接受角色 ID）；如果两者均已配置，发送者匹配 `users` 或 `roles` 任一即可通过
- 名称/标签直接匹配默认禁用；仅在兼容性应急情况下启用 `channels.discord.dangerouslyAllowNameMatching: true`
- 如果服务器配置了 `channels`，未列出的频道会被拒绝
- 如果服务器没有 `channels` 块，该服务器 allowlist 中的所有频道均被允许

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

如果你只设置了 `DISCORD_BOT_TOKEN` 而未创建 `channels.discord` 块，运行时回退为 `groupPolicy="allowlist"`（并在日志中发出警告），即使 `channels.defaults.groupPolicy` 设为 `open`。

### 提及和群组私信

服务器消息默认需要提及门控。

提及检测包括：

- 显式 @机器人提及
- 配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
- 支持的情况下的隐式"回复机器人"行为

`requireMention` 按服务器/频道配置（`channels.discord.guilds...`）。
`ignoreOtherMentions` 可选地丢弃提及了其他用户/角色但未提及机器人的消息（不含 @everyone/@here）。

群组私信：

- 默认：忽略（`dm.groupEnabled=false`）
- 通过 `dm.groupChannels`（频道 ID 或 slug）可选 allowlist

### 基于角色的智能体路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord 服务器成员路由到不同智能体。基于角色的绑定仅接受角色 ID，在 peer 或 parent-peer 绑定之后、仅服务器绑定之前评估。

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

- `commands.native` 默认为 `"auto"`，对 Discord 启用。
- 每渠道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 会清除之前注册的 Discord 原生命令。
- 原生命令授权与普通消息处理使用相同的 Discord allowlist/策略。
- 命令在 Discord UI 中对未授权用户仍可见；执行时 OpenClaw 仍会强制执行授权并返回"未授权"。

斜杠命令目录和行为参见[斜杠命令](/tools/slash-commands)。

默认斜杠命令设置：

- `ephemeral: true`

## 功能详情

### 回复标签和原生回复

Discord 支持智能体输出中的回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

由 `channels.discord.replyToMode` 控制：

- `off`（默认）：禁用隐式回复线程；显式 `[[reply_to_*]]` 标签仍然有效
- `first`：只有第一个出站块/附件是回复
- `all`：每个出站块/附件都是回复

消息 ID 在上下文/历史中呈现，便于智能体定位特定消息。

### 实时流式预览

OpenClaw 可以通过发送临时消息并随着文本到达进行编辑来流式传输草稿回复。

- `channels.discord.streaming` 控制预览流式传输（`off` | `partial` | `block` | `progress`，默认：`off`）。
- 默认保持 `off` 是因为 Discord 预览编辑可能很快触及速率限制。
- `progress` 为了跨渠道一致性被接受，在 Discord 上映射为 `partial`。
- `channels.discord.streamMode` 是旧版别名，会自动迁移。
- `partial` 随着 token 到达编辑单个预览消息。
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

`block` 模式分块默认值（受 `channels.discord.textChunkLimit` 限制）：

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

预览流式传输仅支持文本；媒体回复回退到正常投递。

### 历史记录、上下文和线程行为

服务器历史上下文：

- `channels.discord.historyLimit` 默认 `20`
- 回退：`messages.groupChat.historyLimit`
- `0` 禁用

私信历史控制：

- `channels.discord.dmHistoryLimit`
- `channels.discord.dms["<user_id>"].historyLimit`

线程行为：

- Discord 线程作为频道会话路由
- 线程配置继承父频道配置，除非有线程特定条目
- 频道话题作为**不受信任**的上下文注入（不作为系统提示词）

### 线程绑定会话（子智能体）

Discord 可以将线程绑定到会话目标，使该线程中的后续消息继续路由到同一会话（包括子智能体会话）。

命令：

- `/focus <target>` — 将当前/新线程绑定到子智能体/会话目标
- `/unfocus` — 移除当前线程绑定
- `/agents` — 显示活跃运行和绑定状态
- `/session idle <duration|off>` — 检查/更新焦点绑定的不活跃自动解绑设置
- `/session max-age <duration|off>` — 检查/更新焦点绑定的硬性最大存活时间

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
- `spawnSubagentSessions` 必须为 true 才能自动为 `sessions_spawn({ thread: true })` 创建/绑定线程。

参见[子智能体](/tools/subagents)、[ACP 智能体](/tools/acp-agents)和[配置参考](/gateway/configuration-reference)。

### 持久 ACP 渠道绑定

对于稳定的"始终在线"ACP 工作区，配置指向 Discord 对话的顶层类型化 ACP 绑定。

配置路径：

- `bindings[]`，其中 `type: "acp"` 且 `match.channel: "discord"`

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

- 在 Discord 频道或线程中运行 `/acp spawn codex --bind here`，将该对话与 ACP 会话绑定。
- 绑定频道/线程中的 `/new` 和 `/reset` 会就地重置同一 ACP 会话。
- 临时线程绑定仍然有效，在活跃期间可以覆盖目标解析。
- `spawnAcpSessions` 仅在需要 OpenClaw 通过 `--thread auto|here` 创建/绑定子线程时才需要。

绑定行为详情参见 [ACP 智能体](/tools/acp-agents)。

### 回应通知

每服务器回应通知模式：

- `off`
- `own`（默认）
- `all`
- `allowlist`（使用 `guilds.<id>.users`）

回应事件会转换为系统事件，附加到路由的 Discord 会话。

### 确认回应

`ackReaction` 在 OpenClaw 处理入站消息时发送确认表情。

解析顺序：

- `channels.discord.accounts.<accountId>.ackReaction`
- `channels.discord.ackReaction`
- `messages.ackReaction`
- 智能体身份表情回退（`agents.list[].identity.emoji`，否则"👀"）

注意：

- Discord 接受 unicode 表情或自定义表情名称。
- 使用 `""` 禁用特定渠道或账户的回应。

### 配置写入

默认允许渠道发起的配置写入。

禁用方式：

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

### Gateway 代理

通过 `channels.discord.proxy` 将 Discord Gateway WebSocket 流量和启动 REST 查找路由到 HTTP(S) 代理：

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

### PluralKit 支持

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

- allowlist 可使用 `pk:<memberId>`
- 仅在 `channels.discord.dangerouslyAllowNameMatching: true` 时，成员显示名称才按名称/slug 匹配
- 查找使用原始消息 ID，受时间窗口限制
- 查找失败时，代理消息被视为机器人消息并丢弃，除非设置了 `allowBots=true`

### 存在状态配置

示例（仅状态）：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

示例（自定义状态活动）：

```json5
{
  channels: {
    discord: {
      activity: "专注时间",
      activityType: 4,
    },
  },
}
```

示例（流式传输）：

```json5
{
  channels: {
    discord: {
      activity: "直播编程",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

活动类型映射：

- 0: Playing（游戏中）
- 1: Streaming（直播，需要 `activityUrl`）
- 2: Listening（收听中）
- 3: Watching（观看中）
- 4: Custom（自定义；activity 文本作为状态文字）
- 5: Competing（竞赛中）

自动存在状态示例（运行时健康信号）：

```json5
{
  channels: {
    discord: {
      autoPresence: {
        enabled: true,
        intervalMs: 30000,
        minUpdateIntervalMs: 15000,
        exhaustedText: "token 已耗尽",
      },
    },
  },
}
```

自动存在状态将运行时可用性映射到 Discord 状态：healthy => online，degraded 或 unknown => idle，exhausted 或 unavailable => dnd。

### Discord 中的执行审批

Discord 支持在私信中进行基于按钮的执行审批，也可以选择在来源频道中发布审批提示。

配置路径：

- `channels.discord.execApprovals.enabled`
- `channels.discord.execApprovals.approvers`（可选；当无法解析时，从 `allowFrom` 和显式私信 `defaultTo` 推断所有者 ID）
- `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
- `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

当 `target` 为 `channel` 或 `both` 时，审批提示在频道中可见。只有已解析的审批者才能使用按钮；其他用户会收到隐性拒绝。审批提示包含命令文本，因此仅在受信任的频道中启用频道投递。

执行审批默认 30 分钟后过期。如果审批失败并显示未知审批 ID，请验证审批者解析和功能启用情况。

相关文档：[执行审批](/tools/exec-approvals)

## 工具和操作门控

Discord 消息操作包括消息、频道管理、审核、存在状态和元数据操作。

核心示例：

- 消息：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 回应：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 存在状态：`setPresence`

操作门控位于 `channels.discord.actions.*`。

默认门控行为：

| 操作组 | 默认 |
| --- | --- |
| reactions, messages, threads, pins, polls, search, memberInfo, roleInfo, channelInfo, channels, voiceStatus, events, stickers, emojiUploads, stickerUploads, permissions | 启用 |
| roles | 禁用 |
| moderation | 禁用 |
| presence | 禁用 |

## Components v2 UI

OpenClaw 将 Discord components v2 用于执行审批和跨上下文标记。Discord 消息操作也可以接受 `components` 用于自定义 UI（高级用法）。

- `channels.discord.ui.components.accentColor` 设置 Discord 组件容器使用的强调色（十六进制）。
- 按账户设置：`channels.discord.accounts.<id>.ui.components.accentColor`。
- 当存在 components v2 时，`embeds` 会被忽略。

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

OpenClaw 可以加入 Discord 语音频道进行实时持续对话。这与语音消息附件不同。

要求：

- 启用原生命令（`commands.native` 或 `channels.discord.commands.native`）。
- 配置 `channels.discord.voice`。
- 机器人需要目标语音频道的 Connect + Speak 权限。

使用仅 Discord 支持的原生命令 `/vc join|leave|status` 控制会话。

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

- `voice.tts` 仅对语音播放覆盖 `messages.tts`。
- 语音转录轮次从 Discord `allowFrom`（或 `dm.allowFrom`）派生所有者状态。
- 语音默认启用；设置 `channels.discord.voice.enabled=false` 可禁用。
- OpenClaw 还会监视接收解密失败，并在短时间内重复失败后自动通过离开/重新加入语音频道来恢复。

## 语音消息

Discord 语音消息需要 OGG/Opus 音频和波形元数据。OpenClaw 自动生成波形，但需要 Gateway 网关主机上可用的 `ffmpeg` 和 `ffprobe`。

要求和限制：

- 提供**本地文件路径**（URL 会被拒绝）。
- 省略文本内容（Discord 不允许在同一负载中包含文本 + 语音消息）。
- 接受任何音频格式；OpenClaw 在需要时转换为 OGG/Opus。

示例：

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排除

**使用了不允许的意图或机器人看不到服务器消息**：

- 启用 Message Content Intent
- 依赖用户/成员解析时启用 Server Members Intent
- 更改意图后重启 Gateway 网关

**服务器消息意外被拦截**：

- 验证 `groupPolicy`
- 验证 `channels.discord.guilds` 下的服务器 allowlist
- 如果服务器 `channels` 映射存在，只有列出的频道被允许
- 验证 `requireMention` 行为和提及模式

有用的检查命令：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

**设置了 `requireMention: false` 但仍然被拦截**：

常见原因：

- `groupPolicy="allowlist"` 但没有匹配的服务器/频道 allowlist
- `requireMention` 配置位置错误（必须在 `channels.discord.guilds` 或频道条目下）
- 发送者被服务器/频道 `users` allowlist 拦截

**长时间运行的处理超时或重复回复**：

典型日志：

- `Listener DiscordMessageListener timed out after 30000ms for event MESSAGE_CREATE`
- `discord inbound worker timed out after ...`

调整监听器超时：

- 单账户：`channels.discord.eventQueue.listenerTimeout`
- 多账户：`channels.discord.accounts.<accountId>.eventQueue.listenerTimeout`

调整 Worker 运行超时：

- 单账户：`channels.discord.inboundWorker.runTimeoutMs`
- 默认：`1800000`（30 分钟）；设为 `0` 禁用

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

**权限审计不匹配**：

`channels status --probe` 权限检查仅对数字频道 ID 有效。使用 slug 键时，运行时匹配仍然有效，但探测无法完全验证权限。

**私信和配对问题**：

- 私信已禁用：`channels.discord.dm.enabled=false`
- 私信策略已禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
- 在 `pairing` 模式下等待配对批准

**机器人互相循环**：

默认情况下，机器人发送的消息会被忽略。如果设置了 `channels.discord.allowBots=true`，使用严格的提及和 allowlist 规则以避免循环行为。优先使用 `channels.discord.allowBots="mentions"` 仅接受提及机器人的机器人消息。

**语音 STT 出现 `DecryptionFailed(...)` 丢失**：

- 保持 OpenClaw 最新（`openclaw update`）以确保 Discord 语音接收恢复逻辑存在
- 确认 `channels.discord.voice.daveEncryption=true`（默认）
- 从 `channels.discord.voice.decryptionFailureTolerance=24` 开始，仅在需要时调整
- 观察日志：`discord voice: DAVE decrypt failures detected` 和 `discord voice: repeated decrypt failures; attempting rejoin`

## 配置参考

完整参考：[配置参考 - Discord](/gateway/configuration-reference#discord)

关键 Discord 字段：

- 启动/认证：`enabled`、`token`、`accounts.*`、`allowBots`
- 策略：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`、`slashCommand.*`
- 事件队列：`eventQueue.listenerTimeout`、`eventQueue.maxQueueSize`、`eventQueue.maxConcurrency`
- 入站 Worker：`inboundWorker.runTimeoutMs`
- 回复/历史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 投递：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 流式传输：`streaming`（旧版别名：`streamMode`）、`draftChunk`、`blockStreaming`、`blockStreamingCoalesce`
- 媒体/重试：`mediaMaxMb`（默认 `8MB`）、`retry`
- 操作：`actions.*`
- 存在状态：`activity`、`status`、`activityType`、`activityUrl`
- UI：`ui.components.accentColor`
- 功能：`threadBindings`、顶层 `bindings[]`（`type: "acp"`）、`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

## 安全与运维

- 将机器人令牌视为密钥（在受监督的环境中优先使用 `DISCORD_BOT_TOKEN`）。
- 授予机器人最小特权的 Discord 权限。
- 如果命令部署/状态陈旧，重启 Gateway 网关并用 `openclaw channels status --probe` 重新检查。

## 相关内容

- [配对](/channels/pairing)
- [渠道路由](/channels/channel-routing)
- [多智能体路由](/concepts/multi-agent)
- [故障排除](/channels/troubleshooting)
- [斜杠命令](/tools/slash-commands)
