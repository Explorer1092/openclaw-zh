---
mmh3_hash: "0df6de4d249962c703575461bcc16ee0"
title: "配置参考"
description: "~/.openclaw/openclaw.json 的完整字段级参考文档"
summary: "核心 OpenClaw 键、默认值以及专项子系统参考链接的 Gateway 配置参考"
read_when:
  - 需要精确的字段级配置语义或默认值时
  - 验证 Channel、模型、Gateway 或工具配置块时
---

# 配置参考

`~/.openclaw/openclaw.json` 的核心配置参考。如需面向任务的概览，请参阅 [配置](/gateway/configuration)。

本页面涵盖 OpenClaw 的主要配置接口，并在子系统有自己更深入的参考文档时提供链接。本页**不**尝试将每个 Channel/插件拥有的命令目录或每个深层内存/QMD 配置项都内联到一页中。

代码事实来源：

- `openclaw config schema` 输出用于验证和控制 UI 的实时 JSON Schema（在可用时合并捆绑/插件/Channel 元数据）
- `config.schema.lookup` 返回路径范围内的 schema 节点，供深入工具使用
- `pnpm config:docs:check` / `pnpm config:docs:gen` 根据当前 schema 表面验证配置文档的基准哈希

专项深度参考：

- [内存配置参考](/reference/memory-config)，用于 `agents.defaults.memorySearch.*`、`memory.qmd.*`、`memory.citations` 和 `plugins.entries.memory-core.config.dreaming` 下的 dreaming 配置
- [Slash Commands](/tools/slash-commands)，用于当前内置 + 捆绑命令目录
- 拥有 Channel/插件页面，用于各 Channel 专用命令接口

配置格式为 **JSON5**（支持注释和末尾逗号）。所有字段均为可选 —— 省略时 OpenClaw 使用安全默认值。

---

## Channels

每个 Channel 在其配置节存在时自动启动（除非设置 `enabled: false`）。

### 私聊与群组访问

所有 Channel 均支持私聊策略和群组策略：

| 私聊策略            | 行为                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（默认）   | 未知发送者获得一次性配对码；所有者必须批准                      |
| `allowlist`         | 仅允许 `allowFrom` 中的发送者（或已配对的允许列表存储）         |
| `open`              | 允许所有入站私聊（需设置 `allowFrom: ["*"]`）                   |
| `disabled`          | 忽略所有入站私聊                                                |

| 群组策略              | 行为                                               |
| --------------------- | -------------------------------------------------- |
| `allowlist`（默认）   | 仅允许符合已配置允许列表的群组                     |
| `open`                | 绕过群组允许列表（@提及限制仍然生效）              |
| `disabled`            | 屏蔽所有群组/房间消息                              |

<Note>
`channels.defaults.groupPolicy` 用于设置当 Provider 的 `groupPolicy` 未设置时的默认值。
配对码 1 小时后过期。待处理的私聊配对请求每个 Channel 上限为 **3 个**。
如果 Provider 块完全缺失（`channels.<provider>` 不存在），运行时群组策略回退为 `allowlist`（安全关闭），并在启动时发出警告。
</Note>

### Channel 模型覆盖

使用 `channels.modelByChannel` 将特定 Channel ID 绑定到某个模型。值接受 `provider/model` 格式或已配置的模型别名。当 Session 尚未设置模型覆盖（例如通过 `/model` 设置）时，Channel 映射生效。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Channel 默认值与心跳

使用 `channels.defaults` 设置跨 Provider 共享的群组策略和心跳行为：

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`：当 Provider 级别的 `groupPolicy` 未设置时的回退群组策略。
- `channels.defaults.contextVisibility`：所有 Channel 的默认补充上下文可见性模式。值：`all`（默认，包含所有引用/线程/历史上下文）、`allowlist`（仅包含来自白名单发送者的上下文）、`allowlist_quote`（与 allowlist 相同，但保留显式引用/回复上下文）。每 Channel 覆盖：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在心跳输出中包含健康的 Channel 状态。
- `channels.defaults.heartbeat.showAlerts`：在心跳输出中包含降级/错误状态。
- `channels.defaults.heartbeat.useIndicator`：渲染紧凑指示器样式的心跳输出。

### WhatsApp

WhatsApp 通过 Gateway 的 web Channel（Baileys Web）运行。当已关联 Session 存在时自动启动。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 蓝色已读标记（自聊模式下为 false）
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp 多账户">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- 出站命令默认使用账户 `default`（如存在）；否则使用第一个已配置的账户 ID（按排序）。
- 可选的 `channels.whatsapp.defaultAccount` 在与已配置账户 ID 匹配时，覆盖该回退默认账户选择。
- 旧版单账户 Baileys 认证目录由 `openclaw doctor` 迁移到 `whatsapp/default`。
- 每账户覆盖：`channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress（默认：off）
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（仅普通文件；拒绝符号链接），默认账户环境变量回退为 `TELEGRAM_BOT_TOKEN`。
- 可选的 `channels.telegram.defaultAccount` 在与已配置账户 ID 匹配时，覆盖默认账户选择。
- 在多账户设置中（2 个以上账户 ID），设置明确的默认值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免回退路由；`openclaw doctor` 会在缺失或无效时发出警告。
- `configWrites: false` 阻止 Telegram 发起的配置写入（超级群组 ID 迁移、`/config set|unset`）。
- 带有 `type: "acp"` 的顶级 `bindings[]` 条目为论坛话题配置持久 ACP 绑定（在 `match.peer.id` 中使用规范的 `chatId:topic:topicId`）。字段语义见 [ACP Agents](/tools/acp-agents#channel-specific-settings)。
- Telegram 流式预览使用 `sendMessage` + `editMessageText`（在私聊和群聊中均可使用）。
- 重试策略：参见 [重试策略](/concepts/retry)。

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
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
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress（progress 在 Discord 上映射为 partial）
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // sessions_spawn({ thread: true }) 的可选开关
      },
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
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token：`channels.discord.token`，默认账户环境变量回退为 `DISCORD_BOT_TOKEN`。
- 直接出站调用若提供了显式的 Discord `token`，则使用该 token 进行调用；账户重试/策略设置仍来自活跃运行时快照中选定的账户。
- 可选的 `channels.discord.defaultAccount` 在与已配置账户 ID 匹配时，覆盖默认账户选择。
- 投递目标使用 `user:<id>`（私聊）或 `channel:<id>`（服务器频道）；裸数字 ID 会被拒绝。
- 服务器 slug 为小写，空格替换为 `-`；频道键使用 slug 化名称（不含 `#`）。建议优先使用服务器 ID。
- Bot 发出的消息默认被忽略。`allowBots: true` 可启用；使用 `allowBots: "mentions"` 仅接受提及 Bot 的 Bot 消息（自身消息仍会被过滤）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（及频道覆盖）会丢弃提及其他用户或身份组但未提及 Bot 的消息（排除 @everyone/@here）。
- `maxLinesPerMessage`（默认 17）会在消息未超过 2000 字符时拆分高行数消息。
- `channels.discord.threadBindings` 控制 Discord 线程绑定路由：
  - `enabled`：Discord 线程绑定 Session 功能的开关（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 及绑定投递/路由）
  - `idleHours`：Discord 覆盖的空闲自动取消焦点小时数（`0` 禁用）
  - `maxAgeHours`：Discord 覆盖的硬性最大存活小时数（`0` 禁用）
  - `spawnSubagentSessions`：`sessions_spawn({ thread: true })` 自动创建/绑定线程的可选开关
- 带有 `type: "acp"` 的顶级 `bindings[]` 条目为频道和线程配置持久 ACP 绑定（在 `match.peer.id` 中使用频道/线程 ID）。字段语义见 [ACP Agents](/tools/acp-agents#channel-specific-settings)。
- `channels.discord.ui.components.accentColor` 设置 Discord components v2 容器的强调色。
- `channels.discord.voice` 启用 Discord 语音频道对话及可选的自动加入和 TTS 覆盖。
- `channels.discord.voice.daveEncryption` 和 `channels.discord.voice.decryptionFailureTolerance` 传递给 `@discordjs/voice` DAVE 选项（默认分别为 `true` 和 `24`）。
- OpenClaw 在多次解密失败后会通过离开/重新加入语音 Session 来尝试恢复接收。
- `channels.discord.streaming` 是规范的流式模式键。旧版 `streamMode` 和布尔 `streaming` 值会自动迁移。
- `channels.discord.autoPresence` 将运行时可用性映射到 Bot presence（healthy => online，degraded => idle，exhausted => dnd），并允许可选的状态文本覆盖。
- `channels.discord.dangerouslyAllowNameMatching` 重新启用可变名称/标签匹配（紧急兼容模式）。
- `channels.discord.execApprovals`：Discord 原生 exec 审批投递和审批者授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。auto 模式下，当可从 `approvers` 或 `commands.ownerAllowFrom` 解析出审批者时，exec 审批激活。
  - `approvers`：允许审批 exec 请求的 Discord 用户 ID。省略时回退到 `commands.ownerAllowFrom`。
  - `agentFilter`：可选的 Agent ID 允许列表。省略表示转发所有 Agent 的审批。
  - `sessionFilter`：可选的 Session 键模式（子字符串或正则表达式）。
  - `target`：发送审批提示的位置。`"dm"`（默认）发送到审批者私聊，`"channel"` 发送到发起频道，`"both"` 两者均发送。当目标包含 `"channel"` 时，按钮仅供已解析的审批者使用。
  - `cleanupAfterResolve`：为 `true` 时，审批、拒绝或超时后删除审批私聊消息。

**反应通知模式：** `off`（无），`own`（Bot 消息，默认），`all`（所有消息），`allowlist`（来自所有消息中 `guilds.<id>.users` 的用户）。

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- 服务账户 JSON：内联（`serviceAccount`）或基于文件（`serviceAccountFile`）。
- 也支持服务账户 SecretRef（`serviceAccountRef`）。
- 环境变量回退：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 投递目标使用 `spaces/<spaceId>` 或 `users/<userId>`。
- `channels.googlechat.dangerouslyAllowNameMatching` 重新启用可变 email 主体匹配（紧急兼容模式）。

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // mode=partial 时使用 Slack 原生流式 API
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket 模式** 需要同时提供 `botToken` 和 `appToken`（默认账户环境变量回退：`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP 模式** 需要 `botToken` 加上 `signingSecret`（根级别或每账户）。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受纯文本字符串或 SecretRef 对象。
- Slack 账户快照公开每凭据的来源/状态字段，如 `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及 HTTP 模式下的 `signingSecretStatus`。`configured_unavailable` 表示账户通过 SecretRef 配置，但当前命令/运行时路径无法解析密钥值。
- `configWrites: false` 阻止 Slack 发起的配置写入。
- 可选的 `channels.slack.defaultAccount` 在与已配置账户 ID 匹配时，覆盖默认账户选择。
- `channels.slack.streaming.mode` 是规范的 Slack 流式模式键。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生流式传输。旧版 `streamMode`、布尔 `streaming` 和 `nativeStreaming` 值会自动迁移。
- 投递目标使用 `user:<id>`（私聊）或 `channel:<id>`。

**反应通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

**线程 Session 隔离：** `thread.historyScope` 为每线程独立（默认）或在频道内共享。`thread.inheritParent` 将父频道对话记录复制到新线程。

- Slack 原生流式传输加上 Slack 助手风格的"正在输入..."线程状态需要一个回复线程目标。顶级私聊默认保持非线程状态，因此使用 `typingReaction` 或普通投递，而非线程样式预览。
- `typingReaction` 在处理回复时向入站 Slack 消息临时添加一个反应，完成后移除。使用 Slack 表情符号简码，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生 exec 审批投递和审批者授权。与 Discord 相同的 schema：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 用户 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。

| 操作组       | 默认   | 说明                   |
| ------------ | ------ | ---------------------- |
| reactions    | 启用   | 添加反应 + 列出反应    |
| messages     | 启用   | 读取/发送/编辑/删除    |
| pins         | 启用   | 固定/取消固定/列出     |
| memberInfo   | 启用   | 成员信息               |
| emojiList    | 启用   | 自定义表情列表         |

### Mattermost

Mattermost 以插件形式提供：`openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      commands: {
        native: true, // 需要选择启用
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 反向代理/公共部署的可选显式 URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

聊天模式：`oncall`（@提及时响应，默认）、`onmessage`（每条消息）、`onchar`（以触发前缀开头的消息）。

启用 Mattermost 原生命令时：

- `commands.callbackPath` 必须是路径（例如 `/api/channels/mattermost/command`），而非完整 URL。
- `commands.callbackUrl` 必须解析到 OpenClaw Gateway 端点，并可从 Mattermost 服务器访问。
- 对于私有/tailnet/内部回调主机，Mattermost 可能需要 `ServiceSettings.AllowedUntrustedInternalConnections` 包含回调主机/域名。请使用主机/域名值，而非完整 URL。
- `channels.mattermost.configWrites`：允许或拒绝 Mattermost 发起的配置写入。
- `channels.mattermost.requireMention`：在频道中回复前是否需要 `@提及`。
- 可选的 `channels.mattermost.defaultAccount` 在与已配置账户 ID 匹配时，覆盖默认账户选择。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // 可选账户绑定
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**反应通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

- `channels.signal.account`：将 Channel 启动绑定到特定 Signal 账户身份。
- `channels.signal.configWrites`：允许或拒绝 Signal 发起的配置写入。
- 可选的 `channels.signal.defaultAccount` 在与已配置账户 ID 匹配时，覆盖默认账户选择。

### BlueBubbles

BlueBubbles 是推荐的 iMessage 路径（Plugin 支持，在 `channels.bluebubbles` 下配置）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl、password、webhookPath、群组控制及高级操作：
      // 参见 /channels/bluebubbles
    },
  },
}
```

- 此处涵盖的核心键路径：`channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 可选的 `channels.bluebubbles.defaultAccount` 在与已配置账户 ID 匹配时，覆盖默认账户选择。
- 完整 BlueBubbles Channel 配置文档：[BlueBubbles](/channels/bluebubbles)。

### iMessage

OpenClaw 通过 stdio 的 JSON-RPC 调用 `imsg rpc`。无需守护进程或端口。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- 可选的 `channels.imessage.defaultAccount` 在与已配置账户 ID 匹配时，覆盖默认账户选择。

- 需要 Messages 数据库的完全磁盘访问权限。
- 建议使用 `chat_id:<id>` 作为目标。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可指向 SSH 包装器；设置 `remoteHost`（`host` 或 `user@host`）用于 SCP 附件拉取。
- `attachmentRoots` 和 `remoteAttachmentRoots` 限制入站附件路径（默认：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用严格主机密钥检查，需确保中继主机密钥已存在于 `~/.ssh/known_hosts`。
- `channels.imessage.configWrites`：允许或拒绝 iMessage 发起的配置写入。
- 带有 `type: "acp"` 的顶级 `bindings[]` 条目可将 iMessage 对话绑定到持久 ACP Session。在 `match.peer.id` 中使用规范化的联系方式或显式聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义：[ACP Agents](/tools/acp-agents#channel-specific-settings)。

<Accordion title="iMessage SSH 包装器示例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix 由扩展支持，在 `channels.matrix` 下配置。

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Token 认证使用 `accessToken`；密码认证使用 `userId` + `password`。
- `channels.matrix.proxy` 通过显式 HTTP(S) 代理路由 Matrix HTTP 流量。命名账户可通过 `channels.matrix.accounts.<id>.proxy` 覆盖。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允许私有/内部 homeserver。`proxy` 和此网络选项是独立控制项。
- `channels.matrix.defaultAccount` 在多账户设置中选择首选账户。
- `channels.matrix.execApprovals`：Matrix 原生 exec 审批投递和审批者授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在 auto 模式下，当能从 `approvers` 或 `commands.ownerAllowFrom` 解析审批者时，exec 审批自动激活。
  - `approvers`：允许审批 exec 请求的 Matrix 用户 ID（例如 `@owner:example.org`）。
  - `agentFilter`：可选的 Agent ID 允许列表。省略则转发所有 Agent 的审批。
  - `sessionFilter`：可选的 Session key 模式（子字符串或正则表达式）。
  - `target`：发送审批提示的位置。`"dm"`（默认）、`"channel"`（发起房间）或 `"both"`。
  - 每账户覆盖：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix 私信如何分组到 Session：`per-user`（默认）按路由对等方共享，`per-room` 隔离每个私信房间。
- Matrix 状态探测和实时目录查询使用与运行时流量相同的代理策略。
- 完整 Matrix 配置、定向规则和设置示例文档：[Matrix](/channels/matrix)。

### Microsoft Teams

Microsoft Teams 由扩展支持，在 `channels.msteams` 下配置。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId、appPassword、tenantId、webhook、团队/频道策略：
      // 参见 /channels/msteams
    },
  },
}
```

- 此处涵盖的核心键路径：`channels.msteams`、`channels.msteams.configWrites`。
- 完整 Teams 配置（凭据、webhook、私聊/群组策略、每团队/每频道覆盖）文档：[Microsoft Teams](/channels/msteams)。

### IRC

IRC 由扩展支持，在 `channels.irc` 下配置。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- 此处涵盖的核心键路径：`channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 可选的 `channels.irc.defaultAccount` 在与已配置账户 ID 匹配时，覆盖默认账户选择。
- 完整 IRC Channel 配置（主机/端口/TLS/频道/允许列表/提及限制）文档：[IRC](/channels/irc)。

### 多账户（所有 Channel）

每个 Channel 可运行多个账户（每个账户有自己的 `accountId`）：

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- 省略 `accountId` 时（CLI + 路由）使用 `default`。
- 环境变量 token 仅适用于 **default** 账户。
- 基础 Channel 设置适用于所有账户，除非每账户覆盖。
- 使用 `bindings[].match.accountId` 将每个账户路由到不同的 Agent。
- 如果在仍处于单账户顶级 Channel 配置时通过 `openclaw channels add`（或 Channel 引导）添加非默认账户，OpenClaw 会先将账户级别的顶级单账户值移入 `channels.<channel>.accounts.default`，确保原账户继续工作。
- 现有的仅 Channel 绑定（无 `accountId`）继续匹配默认账户；账户级绑定为可选。
- `openclaw doctor --fix` 还会通过将账户级顶级单账户值移入 `accounts.default` 来修复混合形态（当存在命名账户但缺少 `default` 时）。

### 其他扩展 Channel

许多扩展 Channel 以 `channels.<id>` 形式配置，并在各自专属 Channel 页面中记录（例如飞书、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat 和 Twitch）。
完整 Channel 索引：[Channels](/channels)。

### 群聊提及限制

群组消息默认**需要提及**（元数据提及或正则表达式模式）。适用于 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群聊。

**提及类型：**

- **元数据提及**：平台原生 @-提及。在 WhatsApp 自聊模式下忽略。
- **文本模式**：`agents.list[].groupChat.mentionPatterns` 中的正则表达式模式。始终检查。
- 仅当检测可行时（原生提及或至少一个模式）才强制执行提及限制。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` 设置全局默认值。各 Channel 可通过 `channels.<channel>.historyLimit`（或每账户）���盖。设为 `0` 禁用。

#### 私聊历史记录限制

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解析优先级：每个私聊覆盖 → Provider 默认 → 无限制（全部保留）。

支持：`telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### 自聊模式

在 `allowFrom` 中包含你自己的号码以启用自聊模式（忽略原生 @-提及，仅响应文本模式）：

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### 命令（聊天命令处理）

```json5
{
  commands: {
    native: "auto", // 支持时注册原生命令
    nativeSkills: "auto", // 支持时注册原生技能命令
    text: true, // 解析聊天消息中的 /命令
    bash: false, // 允许 !（别名：/bash）
    bashForegroundMs: 2000,
    config: false, // 允许 /config
    mcp: false, // 允许 /mcp
    plugins: false, // 允许 /plugins
    debug: false, // 允许 /debug
    restart: true, // 允许 /restart 及 Gateway 重启工具
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="命令详情">

- 此块配置命令接口。当前内置 + 捆绑命令目录，请参见 [Slash Commands](/tools/slash-commands)。
- 本页是**配置键参考**，而非完整命令目录。Channel/插件拥有的命令（如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、设备配对 `/pair`、内存 `/dreaming`、手机控制 `/phone` 和 Talk `/voice`）在各自的 Channel/插件页面及 [Slash Commands](/tools/slash-commands) 中记录。
- 文本命令必须是以 `/` 开头的**独立**消息。
- `native: "auto"` 为 Discord/Telegram 启用原生命令，Slack 保持关闭。
- `nativeSkills: "auto"` 为 Discord/Telegram 启用原生技能命令，Slack 保持关闭。
- 每个 Channel 覆盖：`channels.discord.commands.native`（布尔值或 `"auto"`）。`false` 清除之前注册的命令。
- 通过 `channels.<provider>.commands.nativeSkills` 覆盖每 Channel 的原生技能注册。
- `channels.telegram.customCommands` 添加额外的 Telegram Bot 菜单条目。
- `bash: true` 为主机 Shell 启用 `! <cmd>`。需要 `tools.elevated.enabled` 且发送者在 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 启用 `/config`（读写 `openclaw.json`）。对于 Gateway `chat.send` 客户端，持久化 `/config set|unset` 写入还需要 `operator.admin`；只读 `/config show` 对普通写作用域的 operator 客户端仍然可用。
- `mcp: true` 为 `mcp.servers` 下由 OpenClaw 管理的 MCP 服务器配置启用 `/mcp`。
- `plugins: true` 为插件发现、安装及启用/禁用控制启用 `/plugins`。
- `channels.<provider>.configWrites` 按 Channel 控制配置修改（默认：true）。
- 对于多账户 Channel，`channels.<provider>.accounts.<id>.configWrites` 还控制针对该账户的写入。
- `restart: false` 禁用 `/restart` 和 Gateway 重启工具操作。默认：`true`。
- `ownerAllowFrom` 是仅限所有者命令/工具的显式所有者允许列表，与 `allowFrom` 分开。
- `ownerDisplay: "hash"` 对系统提示中的所有者 ID 进行哈希。设置 `ownerDisplaySecret` 控制哈希。
- `allowFrom` 按 Provider 设置。设置后，它是**唯一**的授权来源（Channel 允许列表/配对和 `useAccessGroups` 被忽略）。
- `useAccessGroups: false` 在未设置 `allowFrom` 时，允许命令绕过访问组策略。

</Accordion>

---

## Agent 默认值

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

系统提示 Runtime 行中显示的可选仓库根目录。如未设置，OpenClaw 从工作区向上自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

未设置 `agents.list[].skills` 的 Agent 的可选默认技能允许列表。

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // 继承 github、weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无技能
    ],
  },
}
```

- 省略 `agents.defaults.skills` 则默认不限制技能。
- 省略 `agents.list[].skills` 则继承默认值。
- 设置 `agents.list[].skills: []` 则无技能。
- 非空的 `agents.list[].skills` 列表是该 Agent 的最终集合；不与默认值合并。

### `agents.defaults.skipBootstrap`

禁用工作区引导文件（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）的自动创建。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

控制工作区引导文件注入系统提示的时机。默认值：`"always"`。

- `"continuation-skip"`：安全的续写轮次（在完成的助手响应后）跳过工作区引导重新注入，减小提示大小。Heartbeat 运行和压缩后重试仍会重建上下文。

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

每个工作区引导文件截断前的最大字符数。默认值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

所有工作区引导文件注入的最大总字符数。默认值：`150000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

控制 bootstrap 上下文被截断时 Agent 可见的警告文本。
默认值：`"once"`。

- `"off"`：从不向系统提示中注入警告文本。
- `"once"`：每个唯一截断签名注入一次警告（推荐）。
- `"always"`：当存在截断时每次运行都注入警告。

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

在 Provider 调用前，对话记录/工具图像块中最长边的最大像素尺寸。
默认值：`1200`。

较低的值通常可减少截图密集运行中的视觉 Token 用量和请求载荷大小。
较高的值可保留更多视觉细节。

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

系统提示上下文的时区（非消息时间戳）。回退到主机时区。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系统提示中的时间格式。默认值：`auto`（操作系统偏好）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5-mini"],
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 字符串形式仅设置主模型。
  - 对象形式设置主模型及有序故障转移模型。
- `imageModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用作 `image` 工具路径的视觉模型配置。
  - 当所选/默认模型无法接受图像输入时，也用作回退路由。
- `imageGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于共享图像生成能力及任何未来生成图像的工具/插件接口。
  - 典型值：`google/gemini-3.1-flash-image-preview`（原生 Gemini 图像生成）、`fal/fal-ai/flux/dev`（fal）或 `openai/gpt-image-1`（OpenAI Images）。
  - 如果直接选择 Provider/模型，还需配置相应的 Provider 认证/API key（例如 Google 的 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，OpenAI 的 `OPENAI_API_KEY`，fal 的 `FAL_KEY`）。
  - 如省略，`image_generate` 仍可推断出有认证支持的 Provider 默认值。先尝试当前默认 Provider，再按 provider-id 顺序尝试其余已注册的图像生成 Provider。
- `musicGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于共享音乐生成能力和内置 `music_generate` 工具。
  - 典型值：`google/lyria-3-clip-preview`、`google/lyria-3-pro-preview` 或 `minimax/music-2.5+`。
  - 如省略，`music_generate` 仍可推断出有认证支持的 Provider 默认值。
  - 如果直接选择 Provider/模型，还需配置相应的 Provider 认证/API key。
- `videoGenerationModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于共享视频生成能力和内置 `video_generate` 工具。
  - 典型值：`qwen/wan2.6-t2v`、`qwen/wan2.6-i2v`、`qwen/wan2.6-r2v`、`qwen/wan2.6-r2v-flash` 或 `qwen/wan2.7-r2v`。
  - 如省略，`video_generate` 仍可推断出有认证支持的 Provider 默认值。
  - 如果直接选择 Provider/模型，还需配置相应的 Provider 认证/API key。
  - 内置 Qwen 视频生成 Provider 目前支持最多 1 个输出视频、1 个输入图像、4 个输入视频、10 秒时长，以及 Provider 级别的 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark` 选项。
- `pdfModel`：接受字符串（`"provider/model"`）或对象（`{ primary, fallbacks }`）。
  - 用于 `pdf` 工具的模型路由。
  - 如省略，PDF 工具回退到 `imageModel`，再回退到最优 Provider 默认值。
- `pdfMaxBytesMb`：调用时未传入 `maxBytesMb` 时，`pdf` 工具的默认 PDF 大小限制。
- `pdfMaxPages`：`pdf` 工具提取回退模式中默认的最大页数。
- `model.primary`：格式为 `provider/model`（例如 `anthropic/claude-opus-4-6`）。如省略 Provider，OpenClaw 默认使用 `anthropic`（已弃用）。
- `models`：为 `/model` 配置的模型目录和允许列表。每个条目可包含 `alias`（快捷方式）和 `params`（Provider 专用，例如 `temperature`、`maxTokens`、`cacheRetention`、`context1m`）。
- `params` 合并优先级（配置）：`agents.defaults.models["provider/model"].params` 为基础，然后 `agents.list[].params`（匹配 Agent id）按键覆盖。
- 修改这些字段的配置写入器（例如 `/models set`、`/models set-image` 及回退添加/删除命令）以规范对象形式保存，并尽可能保留现有回退列表。
- `maxConcurrent`：跨 Session 的最大并行 Agent 运行数（每个 Session 仍串行化）。默认值：1。

**内置别名快捷方式**（仅当模型在 `agents.defaults.models` 中时有效）：

| 别名                | 模型                                   |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

你配置的别名始终优先于默认别名。

Z.AI GLM-4.x 模型会自动启用思考模式，除非你设置 `--thinking off` 或自行定义 `agents.defaults.models["zai/<model>"].params.thinking`。
Z.AI 模型默认启用 `tool_stream` 用于工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设为 `false` 可禁用。
Anthropic Claude 4.6 模型在未设置明确思考级别时，默认使用 `adaptive` 思考模式。

### `agents.defaults.cliBackends`

仅用于纯文本回退运行（无工具调用）的可选 CLI 后端。在 API Provider 失败时作为备用方案。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 后端以文本为主；工具始终禁用。
- 设置 `sessionArg` 后支持 Session。
- 设置 `imageArg` 接受文件路径时支持图像传递。

### `agents.defaults.systemPromptOverride`

用固定字符串替换整个 OpenClaw 组装的系统提示。可在默认级别（`agents.defaults.systemPromptOverride`）或每 Agent（`agents.list[].systemPromptOverride`）设置。每 Agent 值优先；空白值被忽略。用于受控提示实验。

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

定期心跳运行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m 禁用
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // 默认：true；false 从系统提示中省略 Heartbeat 节
        lightContext: false, // 默认：false；true 仅从 workspace bootstrap 文件中保留 HEARTBEAT.md
        isolatedSession: false, // 默认：false；true 在全新 Session 中运行每次心跳（无对话历史）
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow（默认）| block
        target: "none", // 默认：none | 选项：last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`：持续时间字符串（ms/s/m/h）。默认值：`30m`（API key 认证）或 `1h`（OAuth 认证）。设为 `0m` 禁用。
- `suppressToolErrorWarnings`：为 true 时，在心跳运行期间抑制工具错误警告载荷。
- `directPolicy`：直接/私聊投递策略。`allow`（默认）允许直接目标投递。`block` 抑制直接目标投递并发出 `reason=dm-blocked`。
- `lightContext`：为 true 时，心跳运行使用轻量级 bootstrap 上下文，仅从 workspace bootstrap 文件中保留 `HEARTBEAT.md`。
- `isolatedSession`：为 true 时，每次心跳在无先前对话历史的全新 Session 中运行。与 cron `sessionTarget: "isolated"` 相同的隔离模式。将每次心跳的 Token 成本从约 10 万降低至约 2000-5000。
- 每 Agent：设置 `agents.list[].heartbeat`。当任意 Agent 定义了 `heartbeat`，**只有那些 Agent** 运行心跳。
- 心跳运行完整的 Agent 轮次 —— 间隔越短，Token 消耗越多。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // 当 identifierPolicy=custom 时使用
        postCompactionSections: ["Session Startup", "Red Lines"], // [] 禁用重新注入
        model: "openrouter/anthropic/claude-sonnet-4-6", // 可选的仅压缩模型覆盖
        notifyUser: true, // 压缩开始时发送简短通知（默认：false）
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（对长历史记录进行分块摘要）。参见 [压缩](/concepts/compaction)。
- `timeoutSeconds`：单次压缩操作在 OpenClaw 中止前允许的最大秒数。默认值：`900`。
- `identifierPolicy`：`strict`（默认）、`off` 或 `custom`。`strict` 在压缩摘要期间前置内置的不透明标识符保留指导。
- `identifierInstructions`：`identifierPolicy=custom` 时使用的可选自定义标识符保留文本。
- `postCompactionSections`：压缩后重新注入的可选 AGENTS.md H2/H3 节名称。默认为 `["Session Startup", "Red Lines"]`；设为 `[]` 禁用重新注入。
- `model`：仅用于压缩摘要的可选 `provider/model-id` 覆盖。当主 Session 应保留一个模型但压缩摘要应在另一个模型上运行时使用；未设置时，压缩使用 Session 的主模型。
- `notifyUser`：为 `true` 时，在压缩开始时向用户发送简短通知（例如"正在压缩上下文..."）。默认禁用以保持压缩静默。
- `memoryFlush`：自动压缩前的静默代理轮次，用于存储持久记忆。当工作区为只读时跳过。

### `agents.defaults.contextPruning`

在发送到 LLM 之前，从内存上下文中裁剪**旧工具结果**。**不会**修改磁盘上的 Session 历史记录。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 持续时间（ms/s/m/h），默认单位：分钟
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl 模式行为">

- `mode: "cache-ttl"` 启用裁剪过程。
- `ttl` 控制裁剪下次运行的频率（在最后一次缓存触碰之后）。
- 裁剪先软裁剪过大的工具结果，如需要则硬清除较旧的工具结果。

**软裁剪**保留开头和结尾，并在中间插入 `...`。

**硬清除**用占位符替换整个工具结果。

注意事项：

- 图像块永远不会被裁剪/清除。
- 比例基于字符数（近似值），而非精确的 Token 计数。
- 如果存在少于 `keepLastAssistants` 条助手消息，则跳过裁剪。

</Accordion>

参见 [Session 裁剪](/concepts/session-pruning) 了解行为详情。

### 块流式传输

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（使用 minMs/maxMs）
    },
  },
}
```

- 非 Telegram Channel 需要显式设置 `*.blockStreaming: true` 才能启用块式回复。
- Channel 覆盖：`channels.<channel>.blockStreamingCoalesce`（及每账户变体）。Signal/Slack/Discord/Google Chat 默认 `minChars: 1500`。
- `humanDelay`：块式回复之间的随机暂停。`natural` = 800–2500ms。每 Agent 覆盖：`agents.list[].humanDelay`。

参见 [流式传输](/concepts/streaming) 了解行为和分块详情。

### 正在输入指示器

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 默认值：私聊/提及为 `instant`，未被提及的群聊为 `message`。
- 每 Session 覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

参见 [正在输入指示器](/concepts/typing-indicators)。

### `agents.defaults.sandbox`

嵌入式 Agent 的可选 **Docker 沙箱**。完整指南参见 [沙箱](/gateway/sandboxing)。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="沙箱详情">

**工作区访问：**

- `none`：在 `~/.openclaw/sandboxes` 下使用每作用域的沙箱工作区
- `ro`：沙箱工作区位于 `/workspace`，Agent 工作区以只读方式挂载到 `/agent`
- `rw`：Agent 工作区以读写方式挂载到 `/workspace`

**作用域：**

- `session`：每 Session 独立容器和工作区
- `agent`：每 Agent 一个容器和工作区（默认）
- `shared`：共享容器和工作区（无跨 Session 隔离）

**`setupCommand`** 在容器创建后运行一次（通过 `sh -lc`）。需要网络出口、可写根目录、root 用户。

**容器默认为 `network: "none"`** —— 如果 Agent 需要出站访问，设置为 `"bridge"`（或自定义桥接网络）。
`"host"` 被阻止。`"container:<id>"` 默认被阻止，除非你显式设置
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`（紧急模式）。

**入站附件**在活动工作区的 `media/inbound/*` 中暂存。

**`docker.binds`** 挂载额外的主机目录；全局和每 Agent 的绑定会合并。

**沙箱浏览器**（`sandbox.browser.enabled`）：容器中的 Chromium + CDP。noVNC URL 注入到系统提示中。不需要主配置中的 `browser.enabled`。
noVNC 观察者访问默认使用 VNC 认证，OpenClaw 发出一个短期 token URL，提供一个本地引导页面；noVNC 密码通过 URL 片段传递（而非 URL 查询参数）。

- `allowHostControl: false`（默认）阻止沙箱 Session 控制主机浏览器。
- `network` 默认为 `openclaw-sandbox-browser`（专用桥接网络）。仅在明确需要全局桥接连接时才设置为 `bridge`。
- `cdpSourceRange` 可选择性地将容器边缘的 CDP 入口限制为 CIDR 范围（例如 `172.21.0.1/32`）。
- `sandbox.browser.binds` 仅向沙箱浏览器容器挂载额外的主机目录。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`。

</Accordion>

构建镜像：

```bash
scripts/sandbox-setup.sh           # 主沙箱镜像
scripts/sandbox-browser-setup.sh   # 可选浏览器镜像
```

### `agents.list`（每 Agent 覆盖）

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // 或 { primary, fallbacks }
        thinkingDefault: "high", // 每 Agent 思考级别覆盖
        reasoningDefault: "on", // 每 Agent 推理可见性覆盖
        fastModeDefault: false, // 每 Agent 快速模式覆盖
        params: { cacheRetention: "none" }, // 按键覆盖匹配的 defaults.models params
        skills: ["docs-search"], // 设置时替换 agents.defaults.skills
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`：稳定的 Agent ID（必填）。
- `default`：设置多个时，第一个生效（记录警告）。如无设置，列表第一项为默认。
- `model`：字符串形式仅覆盖 `primary`；对象形式 `{ primary, fallbacks }` 同时覆盖两者（`[]` 禁用全局回退）。仅覆盖 `primary` 的 Cron 任务仍继承默认回退，除非你设置 `fallbacks: []`。
- `params`：每 Agent 的流式参数，合并到 `agents.defaults.models` 中所选模型条目之上。用于 Agent 专用覆盖（如 `cacheRetention`、`temperature` 或 `maxTokens`），无需复制整个模型目录。
- `skills`：可选的每 Agent 技能允许列表。省略时，Agent 继承 `agents.defaults.skills`（如已设置）；显式列表替换默认值而非合并，`[]` 表示无技能。
- `thinkingDefault`：可选的每 Agent 默认思考级别（`off | minimal | low | medium | high | xhigh | adaptive`）。未设置每消息或 Session 覆盖时，覆盖此 Agent 的 `agents.defaults.thinkingDefault`。
- `reasoningDefault`：可选的每 Agent 默认推理可见性（`on | off | stream`）。未设置每消息或 Session 推理覆盖时应用。
- `fastModeDefault`：可选的每 Agent 快速模式默认值（`true | false`）。未设置每消息或 Session 快速模式覆盖时应用。
- `runtime`：可选的每 Agent 运行时描述符。当 Agent 应默认使用 ACP 运行时 Session 时，使用 `type: "acp"` 和 `runtime.acp` 默认值（`agent`、`backend`、`mode`、`cwd`）。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- `identity` 推导默认值：`ackReaction` 来自 `emoji`，`mentionPatterns` 来自 `name`/`emoji`。
- `subagents.allowAgents`：`sessions_spawn` 的 Agent ID 允许列表（`["*"]` = 任意；默认：仅同一 Agent）。
- 沙箱继承保护：如果请求方 Session 处于沙箱中，`sessions_spawn` 拒绝会运行在非沙箱环境中的目标。
- `subagents.requireAgentId`：为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式配置选择；默认：false）。

---

## 多 Agent 路由

在一个 Gateway 中运行多个隔离的 Agent。参见 [多 Agent](/concepts/multi-agent)。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 绑定匹配字段

- `type`（可选）：`route` 用于普通路由（缺少 type 默认为 route），`acp` 用于持久 ACP 对话绑定。
- `match.channel`（必填）
- `match.accountId`（可选；`*` = 任意账户；省略 = 默认账户）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；Channel 专用）
- `acp`（可选；仅用于 `type: "acp"`）：`{ mode, label, cwd, backend }`

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确，无 peer/guild/team）
5. `match.accountId: "*"`（Channel 范围）
6. 默认 Agent

在每个层级内，第一个匹配的 `bindings` 条目生效。

### 每 Agent 访问配置

<Accordion title="完全访问（无沙箱）">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="只读工具和工作区">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="无文件系统访问（仅消息）">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

参见 [多 Agent 沙箱和工具](/tools/multi-agent-sandbox-tools) 了解优先级详情。

---

## Session

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // 超过此 Token 数时跳过父线程 fork（0 禁用）
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // 持续时间或 false
      maxDiskBytes: "500mb", // 可选硬性磁盘预算
      highWaterBytes: "400mb", // 可选清理目标
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // 默认空闲自动取消焦点小时数（`0` 禁用）
      maxAgeHours: 0, // 默认硬性最大存活小时数（`0` 禁用）
    },
    mainKey: "main", // 旧版（运行时始终使用 "main"）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Session 字段详情">

- **`dmScope`**：私聊的分组方式。
  - `main`：所有私聊共享主 Session。
  - `per-peer`：按发送者 ID 跨 Channel 隔离。
  - `per-channel-peer`：按 Channel + 发送者隔离（多用户收件箱推荐）。
  - `per-account-channel-peer`：按账户 + Channel + 发送者隔离（多账户推荐）。
- **`identityLinks`**：将规范 ID 映射到带 Provider 前缀的 peer，用于跨 Channel Session 共享。
- **`reset`**：主重置策略。`daily` 在本地时间 `atHour` 重置；`idle` 在 `idleMinutes` 后重置。两者均配置时，先到期者生效。
- **`resetByType`**：每类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 作为 `direct` 的别名接受。
- **`parentForkMaxTokens`**：创建 fork 线程 Session 时允许的父 Session 最大 `totalTokens`（默认 `100000`）。
  - 如果父 Session `totalTokens` 超过此值，OpenClaw 将启动全新线程 Session 而非继承父对话历史。
  - 设为 `0` 禁用此保护，始终允许父 fork。
- **`mainKey`**：旧版字段。运行时现始终使用 `"main"` 作为主直接聊天桶。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，旧版 `dm` 别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。第一个 deny 规则生效。
- **`maintenance`**：Session 存储清理和保留控制。
  - `mode`：`warn` 仅发出警告；`enforce` 应用清理。
  - `pruneAfter`：过期条目的年龄截止（默认 `30d`）。
  - `maxEntries`：`sessions.json` 中的最大条目数（默认 `500`）。
  - `rotateBytes`：`sessions.json` 超过此大小时轮转（默认 `10mb`）。
  - `resetArchiveRetention`：`*.reset.<timestamp>` 对话归档的保留期。默认为 `pruneAfter`；设为 `false` 禁用。
  - `maxDiskBytes`：可选的 Sessions 目录磁盘预算。`warn` 模式下记录警告；`enforce` 模式下优先删除最旧的工件/Session。
  - `highWaterBytes`：预算清理后的可选目标。默认为 `maxDiskBytes` 的 `80%`。
- **`threadBindings`**：线程绑定 Session 功能的全局默认值。
  - `enabled`：主默认开关（Provider 可覆盖；Discord 使用 `channels.discord.threadBindings.enabled`）
  - `idleHours`：默认空闲自动取消焦点小时数（`0` 禁用；Provider 可覆盖）
  - `maxAgeHours`：默认硬性最大存活小时数（`0` 禁用；Provider 可覆盖）

</Accordion>

---

## 消息

```json5
{
  messages: {
    responsePrefix: "🦞", // 或 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 禁用
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 回复前缀

每 Channel/账户覆盖：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析规则（最具体的优先）：账户 → Channel → 全局。`""` 禁用并停止级联。`"auto"` 派生 `[{identity.name}]`。

**模板变量：**

| 变量              | 描述               | 示例                        |
| ----------------- | ------------------ | --------------------------- |
| `{model}`         | 简短模型名称       | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型标识符     | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider 名称      | `anthropic`                 |
| `{thinkingLevel}` | 当前思考级别       | `high`、`low`、`off`        |
| `{identity.name}` | Agent 身份名称     | （与 `"auto"` 相同）        |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认反应

- 默认使用活动 Agent 的 `identity.emoji`，否则为 `"👀"`。设为 `""` 禁用。
- 每 Channel 覆盖：`channels.<channel>.ackReaction`、`channels.<channel>.accounts.<id>.ackReaction`。
- 解析顺序：账户 → Channel → `messages.ackReaction` → 身份回退。
- 范围：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：回复后移除确认（仅 Slack/Discord/Telegram/Google Chat）。

### 入站消息防抖

将来自同一发送者的快速纯文本消息批量合并为单个 Agent 轮次。媒体/附件立即刷新。控制命令绕过防抖。

### TTS（文字转语音）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` 控制自动 TTS。`/tts off|always|inbound|tagged` 按 Session 覆盖。
- `summaryModel` 为自动摘要覆盖 `agents.defaults.model.primary`。
- `modelOverrides` 默认启用；`modelOverrides.allowProvider` 默认为 `false`（需显式开启）。
- API 密钥回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。

---

## Talk

Talk 模式的默认值（macOS/iOS/Android）。

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- 配置多个 Talk Provider 时，`talk.provider` 必须与 `talk.providers` 中的某个键匹配。
- 旧版 Talk 平铺键（`talk.voiceId`、`talk.voiceAliases`、`talk.modelId`、`talk.outputFormat`、`talk.apiKey`）仅用于兼容，会自动迁移到 `talk.providers.<provider>`。
- 语音 ID 回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `providers.*.apiKey` 接受明文字符串或 SecretRef 对象。
- 仅在未配置 Talk API key 时才应用 `ELEVENLABS_API_KEY` 回退。
- `providers.*.voiceAliases` 允许 Talk 指令使用友好名称。
- `silenceTimeoutMs` 控制 Talk 模式在用户静默后等待多长时间再发送转录。未设置时保留平台默认暂停窗口（macOS 和 Android 为 `700 ms`，iOS 为 `900 ms`）。

---

## 工具

### 工具配置文件

`tools.profile` 在 `tools.allow`/`tools.deny` 之前设置基础允许列表：

本地引导在未设置时将新的本地配置默认为 `tools.profile: "coding"`（现有显式配置文件保留）。

| 配置文件    | 包含内容                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | 仅 `session_status`                                                                                                                   |
| `coding`    | `group:fs`、`group:runtime`、`group:web`、`group:sessions`、`group:memory`、`cron`、`image`、`image_generate`、`video_generate`        |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`                                             |
| `full`      | 无限制（与未设置相同）                                                                                                                |

### 工具���

| 组                 | 工具                                                                                                                    |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`、`code_execution`（`bash` 作为 `exec` 的别名接受）                                                    |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`sessions_yield`、`subagents`、`session_status` |
| `group:memory`     | `memory_search`、`memory_get`                                                                                           |
| `group:web`        | `web_search`、`x_search`、`web_fetch`                                                                                   |
| `group:ui`         | `browser`、`canvas`                                                                                                     |
| `group:automation` | `cron`、`gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`、`image_generate`、`video_generate`、`tts`                                                                      |
| `group:openclaw`   | 所有内置工具（不含 Provider 插件）                                                                                      |

### `tools.allow` / `tools.deny`

全局工具允许/拒绝策略（拒绝优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙箱关闭也会应用。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

进一步限制特定 Provider 或模型的工具。顺序：基础配置文件 → Provider 配置文件 → allow/deny。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

控制提升（主机）exec 访问：

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- 每 Agent 覆盖（`agents.list[].tools.elevated`）只能进一步限制。
- `/elevated on|off|ask|full` 按 Session 存储状态；内联指令应用于单条消息。
- 提升的 `exec` 在主机上运行，绕过沙箱。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.loopDetection`

工具循环安全检查**默认禁用**。设置 `enabled: true` 激活检测。
可在 `tools.loopDetection` 中全局定义设置，并在 `agents.list[].tools.loopDetection` 处按 Agent 覆盖。

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`：为循环分析保留的最大工具调用历史记录数。
- `warningThreshold`：触发警告的重复无进展模式阈值。
- `criticalThreshold`：阻止严重循环的更高重复阈值。
- `globalCircuitBreakerThreshold`：任何无进展运行的硬性停止阈值。
- `detectors.genericRepeat`：对重复相同工具/相同参数调用发出警告。
- `detectors.knownPollNoProgress`：对已知轮询工具（`process.poll`、`command_status` 等）发出警告/阻止。
- `detectors.pingPong`：对交替无进展对模式发出警告/阻止。
- 如果 `warningThreshold >= criticalThreshold` 或 `criticalThreshold >= globalCircuitBreakerThreshold`，验证将失败。

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // 或 BRAVE_API_KEY 环境变量
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

配置入站媒体理解（图像/音频/视频）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // 选项：将完成的异步音乐/视频直接发送到 Channel
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="媒体模型条目字段">

**Provider 条目**（`type: "provider"` 或省略）：

- `provider`：API Provider ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
- `model`：模型 ID 覆盖
- `profile` / `preferredProfile`：认证配置文件选择

**CLI 条目**（`type: "cli"`）：

- `command`：要运行的可执行文件
- `args`：模板化参数（支持 `{{MediaPath}}`、`{{Prompt}}`、`{{MaxChars}}` 等）

**通用字段：**

- `capabilities`：可选列表（`image`、`audio`、`video`）。默认值：`openai`/`anthropic`/`minimax` → image，`google` → image+audio+video，`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：每条目覆盖。
- 失败时回退到下一个条目。

Provider 认证遵循标准顺序：认证配置文件 → 环境变量 → `models.providers.*.apiKey`。

**异步完成字段：**

- `asyncCompletion.directSend`：为 `true` 时，已完成的异步 `music_generate` 和 `video_generate` 任务优先尝试直接向 Channel 投递。默认值：`false`（旧版请求方 Session 唤醒/模型投递路径）。

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

控制哪些 Session 可被 Session 工具（`sessions_list`、`sessions_history`、`sessions_send`）作为目标。

默认值：`tree`（当前 Session 及其派生的 Session，如子 Agent）。

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

注意事项：

- `self`：仅当前 Session 键。
- `tree`：当前 Session + 由当前 Session 派生的 Session（子 Agent）。
- `agent`：属于当前 Agent ID 的任意 Session（如果你在同一 Agent ID 下运行按发送者隔离的 Session，可能包括其他用户）。
- `all`：任意 Session。跨 Agent 目标仍需 `tools.agentToAgent`。
- 沙箱限制：当前 Session 处于沙箱中且 `agents.defaults.sandbox.sessionToolsVisibility="spawned"` 时，即使 `tools.sessions.visibility="all"`，可见性也会强制为 `tree`。

### `tools.sessions_spawn`

控制 `sessions_spawn` 的内联附件支持。

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // 可选开启：设为 true 允许内联文件附件
        maxTotalBytes: 5242880, // 所有文件总计 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 每个文件 1 MB
        retainOnSessionKeep: false, // cleanup="keep" 时保留附件
      },
    },
  },
}
```

注意事项：

- 附件仅支持 `runtime: "subagent"`。ACP 运行时拒绝附件。
- 文件在子工作区的 `.openclaw/attachments/<uuid>/` 中实体化，并附带 `.manifest.json`。
- 附件内容从对话记录持久化中自动编辑。
- Base64 输入使用严格字母表/填充检查和预解码大小保护进行验证。
- 文件权限：目录为 `0700`，文件为 `0600`。
- 清理遵循 `cleanup` 策略：`delete` 始终删除附件；`keep` 仅在 `retainOnSessionKeep: true` 时保留。

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`：派生子 Agent 的默认模型。如省略，子 Agent 继承调用者的模型。
- `allowAgents`：当请求方 Agent 未设置自己的 `subagents.allowAgents` 时，`sessions_spawn` 的默认目标 Agent ID 允许列表（`["*"]` = 任意；默认：仅同一 Agent）。
- `runTimeoutSeconds`：工具调用省略 `runTimeoutSeconds` 时 `sessions_spawn` 的默认超时（秒）。`0` 表示无超时。
- 每子 Agent 工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义 Provider 和 Base URL

OpenClaw 使用 pi-coding-agent 模型目录。通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义 Provider。

```json5
{
  models: {
    mode: "merge", // merge（默认）| replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- 使用 `authHeader: true` + `headers` 满足自定义认证需求。
- 使用 `OPENCLAW_AGENT_DIR`（或 `PI_CODING_AGENT_DIR`）覆盖 Agent 配置根目录。
- 匹配 Provider ID 的合并优先级：
  - 非空 Agent `models.json` 的 `apiKey`/`baseUrl` 优先。
  - 空或缺失的 Agent `apiKey`/`baseUrl` 回退到配置中的 `models.providers`。
  - 匹配模型的 `contextWindow`/`maxTokens` 使用显式配置和隐式目录值中的较大值。
  - 当你希望配置完全重写 `models.json` 时，使用 `models.mode: "replace"`。

### Provider 字段详情

- `models.mode`：Provider 目录行为（`merge` 或 `replace`）。
- `models.providers`：以 Provider ID 为键的自定义 Provider 映射。
- `models.providers.*.api`：请求适配器（`openai-completions`、`openai-responses`、`anthropic-messages`、`google-generative-ai` 等）。
- `models.providers.*.apiKey`：Provider 凭据（建议使用 SecretRef/环境变量替换）。
- `models.providers.*.auth`：认证策略（`api-key`、`token`、`oauth`、`aws-sdk`）。
- `models.providers.*.injectNumCtxForOpenAICompat`：对于 Ollama + `openai-completions`，在请求中注入 `options.num_ctx`（默认：`true`）。
- `models.providers.*.authHeader`：在需要时强制在 `Authorization` 标头中传输凭据。
- `models.providers.*.baseUrl`：上游 API Base URL。
- `models.providers.*.headers`：用于代理/租户路由的额外静态标头。
- `models.providers.*.models`：显式 Provider 模型目录条目。
- `models.bedrockDiscovery`：Bedrock 自动发现设置根节点。
- `models.bedrockDiscovery.enabled`：开启/关闭发现轮询。
- `models.bedrockDiscovery.region`：用于发现的 AWS 区域。
- `models.bedrockDiscovery.providerFilter`：用于目标发现的可选 Provider ID 过滤器。
- `models.bedrockDiscovery.refreshInterval`：发现刷新的轮询间隔。
- `models.bedrockDiscovery.defaultContextWindow`：已发现模型的回退上下文窗口。
- `models.bedrockDiscovery.defaultMaxTokens`：已发现模型的回退最大输出 Token 数。

### Provider 示例

<Accordion title="Cerebras（GLM 4.6 / 4.7）">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Cerebras 使用 `cerebras/zai-glm-4.7`；Z.AI 直连使用 `zai/glm-4.7`。

</Accordion>

<Accordion title="OpenCode Zen">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

设置 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。快捷方式：`openclaw onboard --auth-choice opencode-zen`。

</Accordion>

<Accordion title="Z.AI（GLM-4.7）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

设置 `ZAI_API_KEY`。`z.ai/*` 和 `z-ai/*` 作为别名接受。快捷方式：`openclaw onboard --auth-choice zai-api-key`。

- 通用端点：`https://api.z.ai/api/paas/v4`
- 编码端点（默认）：`https://api.z.ai/api/coding/paas/v4`
- 如需通用端点，使用 Base URL 覆盖定义自定义 Provider。

</Accordion>

<Accordion title="Moonshot AI（Kimi）">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

中国端点：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic 兼容，内置 Provider。快捷方式：`openclaw onboard --auth-choice kimi-code-api-key`。

</Accordion>

<Accordion title="Synthetic（Anthropic 兼容）">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Base URL 应省略 `/v1`（Anthropic 客户端会自动附加）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

</Accordion>

<Accordion title="MiniMax M2.7（直连）">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

设置 `MINIMAX_API_KEY`。快捷方式：`openclaw onboard --auth-choice minimax-global-api` 或 `openclaw onboard --auth-choice minimax-cn-api`。模型目录现在默认仅支持 M2.7。在 Anthropic 兼容流式传输路径上，OpenClaw 默认禁用 MiniMax 思考，除非你显式设置 `thinking`。`/fast on` 或 `params.fastMode: true` 将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。

</Accordion>

<Accordion title="本地模型（LM Studio）">

参见 [本地模型](/gateway/local-models)。摘要：在高性能硬件上通过 LM Studio Responses API 运行 MiniMax M2.7；保留托管模型合并以作回退。

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或纯文本字符串
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`：仅用于捆绑 Skill 的可选允许列表（受管/工作区 Skill 不受影响）。
- `entries.<skillKey>.enabled: false` 禁用 Skill，即使已捆绑/安装也不例外。
- `entries.<skillKey>.apiKey`：为声明主要环境变量的 Skill 提供便捷设置（纯文本字符串或 SecretRef 对象）。

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- 从 `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions` 以及 `plugins.load.paths` 加载。
- **配置更改需重启 Gateway。**
- `allow`：可选允许列表（只有列出的 Plugin 会加载）。`deny` 优先。
- `plugins.entries.<id>.apiKey`：Plugin 级别的 API 密钥便捷字段（当 Plugin 支持时）。
- `plugins.entries.<id>.env`：Plugin 作用域的环境变量映射。
- `plugins.entries.<id>.hooks.allowPromptInjection`：为 `false` 时，core 阻止 `before_prompt_build` 并忽略旧版 `before_agent_start` 中的 prompt 修改字段，同时保留旧版 `modelOverride` 和 `providerOverride`。
- `plugins.entries.<id>.config`：Plugin 定义的配置对象（由 Plugin 架构验证）。
- `plugins.slots.memory`：选择活动内存 Plugin ID，或设为 `"none"` 禁用内存 Plugin。
- `plugins.slots.contextEngine`：选择活动 context engine Plugin ID；默认为 `"legacy"`，除非你安装并选择了其他 engine。
- `plugins.installs`：由 `openclaw plugins update` 使用的 CLI 管理的安装元数据。
  - 包括 `source`、`spec`、`sourcePath`、`installPath`、`version`、`resolvedName`、`resolvedVersion`、`resolvedSpec`、`integrity`、`shasum`、`resolvedAt`、`installedAt`。
  - 将 `plugins.installs.*` 视为受管状态；建议使用 CLI 命令而非手动编辑。

参见 [Plugins](/tools/plugin)。

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    ssrfPolicy: {
      dangerouslyAllowPrivateNetwork: true, // 默认受信任网络模式
      // allowPrivateNetwork: true, // 旧版别名
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` 禁用 `act:evaluate` 和 `wait --fn`。
- 未设置时 `ssrfPolicy.dangerouslyAllowPrivateNetwork` 默认为 `true`（受信任网络模型）。
- 设置 `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` 可实现严格的仅公网浏览器导航。
- `ssrfPolicy.allowPrivateNetwork` 作为旧版别名继续受支持。
- 严格模式下，使用 `ssrfPolicy.hostnameAllowlist` 和 `ssrfPolicy.allowedHostnames` 设置显式例外。
- `profiles.*.cdpUrl` 接受 `http://`、`https://`、`ws://` 和 `wss://`。当你希望 OpenClaw 发现 `/json/version` 时使用 HTTP(S)；当 Provider 给你直接 DevTools WebSocket URL 时使用 WS(S)。
- `existing-session` 配置文件为仅主机模式，使用 Chrome MCP 而非 CDP。
- `existing-session` 配置文件可通过设置 `userDataDir` 指向特定的 Chromium 系浏览器配置文件（如 Brave 或 Edge）。
- `existing-session` 配置文件保留当前 Chrome MCP 路由限制：基于快照/ref 的操作而非 CSS 选择器定向、单文件上传钩子、无对话框超时覆盖、无 `wait --load networkidle`，以及无 `responsebody`、PDF 导出、下载拦截或批量操作。
- 远程配置文件为仅附加模式（禁用启动/停止/重置）。
- 自动检测顺序：Chromium 系默认浏览器 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 控制服务：仅本地回环（端口由 `gateway.port` 派生，默认 `18791`）。
- `extraArgs` 向本地 Chromium 启动追加额外的启动标志（例如 `--disable-gpu`、窗口大小或调试标志）。
- `relayBindHost` 更改 Chrome extension relay 的监听地址。保留不设置以仅本地回环访问；仅当 relay 必须跨命名空间边界（例如 WSL2）且主机网络已受信任时，才设置为非本地回环地址（如 `0.0.0.0`）。

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // 表情符号、短文本、图片 URL 或 data URI
    },
  },
}
```

- `seamColor`：原生应用 UI 外框的强调色（Talk 模式气泡色调等）。
- `assistant`：控制 UI 身份覆盖。回退到活动 Agent 身份。

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // 或 OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy 时使用；参见 /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowedOrigins: ["https://control.example.com"], // 非本地回环 Control UI 必填
      // dangerouslyAllowHostHeaderOriginFallback: false, // 危险的 Host 标头来源回退模式
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
    trustedProxies: ["10.0.0.1"],
    // 可选。默认 false。
    allowRealIpFallback: false,
    tools: {
      // 额外的 /tools/invoke HTTP 拒绝
      deny: ["browser"],
      // 从默认 HTTP 拒绝列表中移除工具
      allow: ["gateway"],
    },
  },
}
```

<Accordion title="Gateway 字段详情">

- `mode`：`local`（运行 Gateway）或 `remote`（连接到远程 Gateway）。除非为 `local`，否则 Gateway 拒绝启动。
- `port`：WS + HTTP 的单一复用端口。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **旧版 bind 别名**：在 `gateway.bind` 中使用 bind 模式值（`auto`、`loopback`、`lan`、`tailnet`、`custom`），而非主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。
- **Docker 说明**：默认 `loopback` bind 在容器内监听 `127.0.0.1`。使用 Docker 桥接网络（`-p 18789:18789`）时，流量到达 `eth0`，因此 Gateway 不可达。使用 `--network host`，或设置 `bind: "lan"`（或 `bind: "custom"` + `customBindHost: "0.0.0.0"`）以监听所有接口。
- **认证**：默认必填。非本地回环 bind 需要共享 token/密码。引导向导默认生成 token。
- 如果同时配置了 `gateway.auth.token` 和 `gateway.auth.password`（包括 SecretRef），请显式设置 `gateway.auth.mode` 为 `token` 或 `password`。当两者均已配置且 mode 未设置时，启动和服务安装/修复流程将失败。
- `gateway.auth.mode: "none"`：显式无认证模式。仅用于受信任的本地回环设置；引导提示有意不提供此选项。
- `gateway.auth.mode: "trusted-proxy"`：将认证委托给身份感知反向代理，并信任来自 `gateway.trustedProxies` 的身份标头（参见 [受信任代理认证](/gateway/trusted-proxy-auth)）。
- `gateway.auth.allowTailscale`：为 `true` 时，Tailscale Serve 身份标头可满足 Control UI/WebSocket 认证（通过 `tailscale whois` 验证）；HTTP API 端点仍需 token/密码认证。此无 token 流程假设 Gateway 主机受信任。当 `tailscale.mode = "serve"` 时默认为 `true`。
- `gateway.auth.rateLimit`：可选的失败认证限速器。按客户端 IP 和认证范围（共享密钥和设备 token 单独跟踪）应用。被阻止的尝试返回 `429` + `Retry-After`。
  - `gateway.auth.rateLimit.exemptLoopback` 默认为 `true`；如果你有意对 localhost 流量也限速（用于测试设置或严格代理部署），设为 `false`。
- 浏览器来源的 WS 认证尝试始终启用禁用本地回环豁免的限速（深度防御，防止基于浏览器的 localhost 暴力破解）。
- `tailscale.mode`：`serve`（仅 tailnet，本地回环 bind）或 `funnel`（公开，需认证）。
- `controlUi.allowedOrigins`：Gateway WebSocket 连接的显式浏览器来源允许列表。当来自非本地回环来源的浏览器客户端需要连接时必须设置。
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`：危险模式，为有意依赖 Host 标头来源策略的部署启用 Host 标头来源回退。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。`direct` 时，`remote.url` 必须为 `ws://` 或 `wss://`。
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`：客户端紧急覆盖，允许对受信任的私有网络 IP 使用明文 `ws://`；默认仍仅本地回环允许明文。
- `gateway.remote.token` / `.password` 是远程客户端凭据字段。它们本身不配置 Gateway 认证。
- `gateway.push.apns.relay.baseUrl`：官方/TestFlight iOS 构建在向 Gateway 发布 relay 支持的注册后所使用的外部 APNs relay 的 HTTPS 基础 URL。此 URL 必须与编译进 iOS 构建的 relay URL 匹配。
- `gateway.push.apns.relay.timeoutMs`：Gateway 到 relay 的发送超时（毫秒）。默认为 `10000`。
- Relay 支持的注册委托给特定的 Gateway 身份。配对的 iOS 应用获取 `gateway.identity.get`，在 relay 注册中包含该身份，并将注册范围的发送授权转发给 Gateway。其他 Gateway 无法重复使用该存储的注册。
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`：上述 relay 配置的临时环境变量覆盖。
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`：仅供开发使用的本地回环 HTTP relay URL 逃生舱。生产 relay URL 应保持 HTTPS。
- `gateway.channelHealthCheckMinutes`：Channel 健康监视器检查间隔（分钟）。设为 `0` 全局禁用健康监视器重启。默认值：`5`。
- `gateway.channelStaleEventThresholdMinutes`：陈旧 socket 阈值（分钟）。保持大于或等于 `gateway.channelHealthCheckMinutes`。默认值：`30`。
- `gateway.channelMaxRestartsPerHour`：每个 Channel/账户在滚动一小时内的最大健康监视器重启次数。默认值：`10`。
- `channels.<provider>.healthMonitor.enabled`：每 Channel 退出健康监视器重启，同时保持全局监视器启用。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`：多账户 Channel 的每账户覆盖。设置时优先于 Channel 级别覆盖。
- 当 `gateway.auth.*` 未设置时，本地 Gateway 调用路径可使用 `gateway.remote.*` 作为回退。
- 如果 `gateway.auth.token` / `gateway.auth.password` 通过 SecretRef 显式配置但未解析，解析失败关闭（无远程回退掩盖）。
- `trustedProxies`：终止 TLS 或注入转发客户端标头的反向代理 IP。只列出你控制的代理。本地回环条目在同主机代理/本地检测设置（例如 Tailscale Serve 或本地反向代理）中仍然有效，但它们**不会**使本地回环请求符合 `gateway.auth.mode: "trusted-proxy"` 的条件。
- `allowRealIpFallback`：为 `true` 时，当 `X-Forwarded-For` 缺失时 Gateway 接受 `X-Real-IP`。默认 `false`（安全关闭行为）。
- `gateway.tools.deny`：HTTP `POST /tools/invoke` 的额外阻止工具名称（扩展默认拒绝列表）。
- `gateway.tools.allow`：从默认 HTTP 拒绝列表中移除工具名称。

</Accordion>

### OpenAI 兼容端点

- Chat Completions：默认禁用。通过 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL 输入加固：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
- 可选响应加固标头：
  - `gateway.http.securityHeaders.strictTransportSecurity`（仅为你控制的 HTTPS 来源设置；参见 [受信任代理认证](/gateway/trusted-proxy-auth#tls-termination-and-hsts)）

### 多实例隔离

在一台主机上运行多个 Gateway，使用唯一端口和状态目录：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`），`--profile <name>`（使用 `~/.openclaw-<name>`）。

参见 [多 Gateway](/gateway/multiple-gateways)。

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

认证：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true`（默认：`false`）时，接受来自请求载荷的 `sessionKey`。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析

<Accordion title="映射详情">

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的载荷字段。
- `{{messages[0].subject}}` 等模板从载荷读取。
- `transform` 可指向返回 Hook 动作的 JS/TS 模块。
  - `transform.module` 必须是相对路径，且必须保持在 `hooks.transformsDir` 内（绝对路径和目录遍历被拒绝）。
- `agentId` 路由到特定 Agent；未知 ID 回退到默认 Agent。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 允许全部，`[]` = 全部拒绝）。
- `defaultSessionKey`：无显式 `sessionKey` 的 Hook Agent 运行的可选固定 Session 键。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用者设置 `sessionKey`（默认：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀允许列表，例如 `["hook:"]`。
- `deliver: true` 将最终回复发送到 Channel；`channel` 默认为 `last`。
- `model` 为此 Hook 运行覆盖 LLM（如果设置了模型目录，必须是允许的模型）。

</Accordion>

### Gmail 集成

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 配置完成后，Gateway 在启动时自动启动 `gog gmail watch serve`。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 可禁用。
- 不要在 Gateway 旁边单独运行 `gog gmail watch serve`。

---

## Canvas 宿主

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // 或 OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- 通过 Gateway 端口提供 Agent 可编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅本地：保持 `gateway.bind: "loopback"`（默认）。
- 非本地回环 bind：Canvas 路由需要 Gateway 认证（token/密码/受信任代理），与其他 Gateway HTTP 接口相同。
- Node WebView 通常不发送认证标头；Node 配对并连接后，Gateway 会为 Canvas/A2UI 访问发布 Node 范围的能力 URL。
- 能力 URL 绑定到活动 Node WS Session，很快失效。不使用基于 IP 的回退。
- 向提供的 HTML 注入实时重载客户端。
- 空目录时自动创建起始 `index.html`。
- 还在 `/__openclaw__/a2ui/` 提供 A2UI。
- 更改需重启 Gateway。
- 对于大型目录或 `EMFILE` 错误，禁用实时重载。

---

## 发现

### mDNS（Bonjour）

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（默认）：从 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`。
- 主机名默认为 `openclaw`。通过 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下写入单播 DNS-SD 区域。跨网络发现时，配合 DNS 服务器（推荐 CoreDNS）+ Tailscale 分割 DNS 使用。

设置：`openclaw dns setup --apply`。

---

## 环境变量

### `env`（内联环境变量）

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- 内联环境变量仅在进程环境缺少该键时才应用。
- `.env` 文件：CWD `.env` + `~/.openclaw/.env`（均不覆盖已有变量）。
- `shellEnv`：从你的登录 Shell 配置文件导入缺少的预期键。
- 完整优先级参见 [环境变量](/help/environment)。

### 环境变量替换

在任意配置字符串中用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺少/空变量在配置加载时抛出错误。
- 使用 `$${VAR}` 转义为字面量 `${VAR}`。
- 与 `$include` 配合使用。

---

## 密钥

密钥引用是附加性的：纯文本值仍然有效。

### `SecretRef`

使用以下对象形式之一：

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

验证：

- `provider` 模式：`^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id 模式：`^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id：绝对 JSON 指针（例如 `"/providers/openai/apiKey"`）
- `source: "exec"` id 模式：`^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`

### 支持的凭证字段

- 规范矩阵：[SecretRef 凭证字段](/reference/secretref-credential-surface)
- `secrets apply` 针对受支持的 `openclaw.json` 凭证路径。
- `auth-profiles.json` 引用包含在运行时解析和审计覆盖中。

### 密钥 Provider 配置

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // 可选显式 env Provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

注意事项：

- `file` Provider 支持 `mode: "json"` 和 `mode: "singleValue"`（singleValue 模式下 `id` 必须为 `"value"`）。
- `exec` Provider 需要绝对 `command` 路径，并通过 stdin/stdout 使用协议载荷。
- 默认情况下，符号链接命令路径被拒绝。设置 `allowSymlinkCommand: true` 允许符号链接路径，同时验证解析后的目标路径。
- 如果配置了 `trustedDirs`，受信任目录检查将应用于解析后的目标路径。
- `exec` 子环境默认最小化；使用 `passEnv` 显式传递所需变量。
- 密钥引用在激活时解析为内存快照，之后请求路径仅读取快照。
- 激活时应用活跃字段过滤：已启用字段上未解析的引用会导致启动/重载失败，非活跃字段则跳过并输出诊断信息。

---

## 认证存储

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- 每 Agent 认证配置文件存储在 `<agentDir>/auth-profiles.json`。
- `auth-profiles.json` 支持值级引用（api_key 用 `keyRef`，token 用 `tokenRef`）用于静态凭据模式。
- OAuth 模式配置文件（`auth.profiles.<id>.mode = "oauth"`）不支持 SecretRef 支持的认证配置文件凭据。
- 静态运行时凭据来自内存中的已解析快照；发现旧版静态 `auth.json` 条目时会清除。
- 旧版 OAuth 从 `~/.openclaw/credentials/oauth.json` 导入。
- 参见 [OAuth](/concepts/oauth)。
- 密钥运行时行为和 `audit/configure/apply` 工具：[密钥管理](/gateway/secrets)。

---

## 日志

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 默认日志文件：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 设置 `logging.file` 以使用固定路径。
- `--verbose` 时 `consoleLevel` 提升为 `debug`。
- `maxFileBytes`：写入被抑制前的最大日志文件大小（字节；正整数；默认：`524288000` = 500 MB）。生产部署请使用外部日志轮换。

---

## 诊断

```json5
{
  diagnostics: {
    enabled: true,
    sampleRate: 1.0,
    redactPayloads: true,
    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `diagnostics.enabled`：启用诊断数据收集。
- `diagnostics.sampleRate`：采样率（0.0–1.0）。
- `diagnostics.redactPayloads`：在诊断输出中编辑敏感载荷。
- `diagnostics.cacheTrace`：将 KV 缓存使用情况追踪记录到 JSONL 文件（仅供 Anthropic + 内部 OpenClaw Provider 使用）。启用后会记录 cache_read_input_tokens 和 cache_creation_input_tokens，并注解 Anthropic 提示标记。
- `cacheTrace.filePath`：缓存追踪 JSONL 的输出路径（默认：`$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`）。
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`：控制缓存追踪输出中包含的内容（默认全部为 `true`）。

---

## 更新

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
  },
}
```

- `update.channel`：自动更新检查的发布渠道。`stable`（默认）、`beta` 或 `dev`。

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` 控制 banner 标语样式：
  - `"random"`（默认）：轮换有趣/季节性标语。
  - `"default"`：固定中性标语（`All your chats, one OpenClaw.`）。
  - `"off"`：无标语文字（仍显示 banner 标题/版本）。
- 如需隐藏整个 banner（不只是标语），设置环境变量 `OPENCLAW_HIDE_BANNER=1`。

---

## Wizard

CLI 向导（`onboard`、`configure`、`doctor`）写入的元数据：

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## 身份

参见 [Agent 默认值](#agent-defaults) 下 `agents.list` 的 identity 字段。

---

## Bridge（旧版，已移除）

当前版本不再包含 TCP bridge。Node 通过 Gateway WebSocket 连接。`bridge.*` 键不再是配置架构的一部分（删除之前验证会失败；`openclaw doctor --fix` 可去除未知键）。

<Accordion title="旧版 bridge 配置（历史参考）">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // 已弃用的存储 notify:true 任务回退
    webhookToken: "replace-with-dedicated-token", // 出站 webhook 认证的可选 bearer token
    sessionRetention: "24h", // 持续时间字符串或 false
    runLog: {
      maxBytes: "2mb", // 默认 2_000_000 字节
      keepLines: 2000, // 默认 2000
    },
  },
}
```

- `sessionRetention`：已完成的隔离 Cron 运行 Session 在从 `sessions.json` 裁剪前保留的时长。也控制已存档的已删除 Cron 对话记录的清理。默认：`24h`；设为 `false` 禁用。
- `runLog.maxBytes`：每个运行日志文件（`cron/runs/<jobId>.jsonl`）裁剪前的最大大小。默认：`2_000_000` 字节。
- `runLog.keepLines`：触发运行日志裁剪时保留的最新行数。默认：`2000`。
- `webhookToken`：Cron webhook POST 投递（`delivery.mode = "webhook"`）使用的 bearer token；省略时不发送认证标头。
- `webhook`：已弃用的旧版回退 webhook URL（http/https），仅用于仍有 `notify: true` 的存储任务。

参见 [Cron 任务](/automation/cron-jobs)。

---

## 媒体模型模板变量

在 `tools.media.models[].args` 中展开的模板占位符：

| 变量               | 描述                                              |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | 完整入站消息正文                                  |
| `{{RawBody}}`      | 原始正文（无历史记录/发送者包装）                 |
| `{{BodyStripped}}` | 已剥离群组提及的正文                              |
| `{{From}}`         | 发送者标识符                                      |
| `{{To}}`           | 目标标识符                                        |
| `{{MessageSid}}`   | Channel 消息 ID                                   |
| `{{SessionId}}`    | 当前 Session UUID                                 |
| `{{IsNewSession}}` | 创建新 Session 时为 `"true"`                      |
| `{{MediaUrl}}`     | 入站媒体伪 URL                                    |
| `{{MediaPath}}`    | 本地媒体路径                                      |
| `{{MediaType}}`    | 媒体类型（image/audio/document/...）              |
| `{{Transcript}}`   | 音频转录文本                                      |
| `{{Prompt}}`       | CLI 条目的已解析媒体提示                          |
| `{{MaxChars}}`     | CLI 条目的已解析最大输出字符数                    |
| `{{ChatType}}`     | `"direct"` 或 `"group"`                           |
| `{{GroupSubject}}` | 群组主题（尽力而为）                              |
| `{{GroupMembers}}` | 群组成员预览（尽力而为）                          |
| `{{SenderName}}`   | 发送者显示名称（尽力而为）                        |
| `{{SenderE164}}`   | 发送者电话号码（尽力而为）                        |
| `{{Provider}}`     | Provider 提示（whatsapp、telegram、discord 等）   |

---

## 配置包含（`$include`）

将配置拆分为多个文件：

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**合并行为：**

- 单文件：替换包含它的对象。
- 文件数组：按顺序深度合并（后者覆盖前者）。
- 同级键：包含后合并（覆盖包含的值）。
- 嵌套包含：最多 10 层深。
- 路径：相对于包含文件解析，但必须保持在顶级配置目录内（主配置文件的 `dirname`）。仅当绝对路径/`../` 形式仍然解析到该边界内时才允许。
- 错误：对缺少的文件、解析错误和循环包含给出清晰的错误消息。

---

_相关：[配置](/gateway/configuration) · [配置示例](/gateway/configuration-examples) · [Doctor](/gateway/doctor)_
