---
mmh3_hash: "996d8944aa07e19273425a32b0d16d25"
summary: "Channel 配置：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等的访问控制、配对和每 Channel 键"
read_when:
  - 配置 Channel Plugin（认证、访问控制、多账户）
  - 排查每 Channel 配置键
  - 审计 DM 策略、群组策略或提及门控
title: "Configuration — channels"
---

`channels.*` 下的每 Channel 配置键。涵盖 DM 和群组访问、多账户设置、提及门控，以及 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他捆绑 Channel Plugin 的每 Channel 键。

关于 Agent、工具、Gateway runtime 和其他顶级键，请参见 [配置参考](/gateway/configuration-reference)。

## Channel

每个 Channel 在其配置部分存在时自动启动（除非 `enabled: false`）。

### DM 和群组访问

所有 Channel 都支持 DM 策略和群组策略：

| DM 策略             | 行为                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（默认）   | 未知发送者获得一次性配对码；所有者必须批准                      |
| `allowlist`         | 仅 `allowFrom` 中的发送者（或配对允许存储）                    |
| `open`              | 允许所有入站 DM（需要 `allowFrom: ["*"]`）                      |
| `disabled`          | 忽略所有入站 DM                                                 |

| 群组策略              | 行为                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（默认）   | 仅匹配配置的允许列表的群组                             |
| `open`                | 绕过群组允许列表（提及门控仍然适用）                   |
| `disabled`            | 阻止所有群组/房间消息                                  |

<Note>
`channels.defaults.groupPolicy` 在 Provider 的 `groupPolicy` 未设置时设置默认值。
配对码在 1 小时后过期。待处理的 DM 配对请求每个 Channel 最多 **3 个**。
如果 Provider 块完全缺失（`channels.<provider>` 不存在），runtime 群组策略回退到 `allowlist`（失败关闭），并显示启动警告。
</Note>

### Channel model 覆盖

使用 `channels.modelByChannel` 将特定 Channel ID 固定到 model。值接受 `provider/model` 或配置的 model 别名。当 Session 还没有 model 覆盖时（例如通过 `/model` 设置），Channel 映射才会应用。

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

### Channel 默认值和 heartbeat

使用 `channels.defaults` 在各 Provider 间共享群组策略和 heartbeat 行为：

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

- `channels.defaults.groupPolicy`：Provider 级别 `groupPolicy` 未设置时的回退群组策略。
- `channels.defaults.contextVisibility`：所有 Channel 的默认补充上下文可见性模式。值：`all`（默认，包括所有引用/线程/历史上下文）、`allowlist`（仅包括来自允许列表发送者的上下文）、`allowlist_quote`（与 allowlist 相同，但保留显式引用/回复上下文）。每 Channel 覆盖：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在 heartbeat 输出中包含健康 Channel 状态。
- `channels.defaults.heartbeat.showAlerts`：在 heartbeat 输出中包含降级/错误状态。
- `channels.defaults.heartbeat.useIndicator`：渲染紧凑指示器风格的 heartbeat 输出。

### WhatsApp

WhatsApp 通过 Gateway 的 Web Channel（Baileys Web）运行。当链接的 Session 存在时自动启动。

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 蓝色对勾（自聊模式下为 false）
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

<Accordion title="多账户 WhatsApp">

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

- 出站命令默认为账户 `default`（如果存在）；否则为第一个配置的账户 id（已排序）。
- 可选的 `channels.whatsapp.defaultAccount` 在匹配配置的账户 id 时覆盖该回退默认账户选择。
- 旧版单账户 Baileys auth 目录由 `openclaw doctor` 迁移到 `whatsapp/default`。
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
          systemPrompt: "保持答案简洁。",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "保持主题。",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git 备份" },
        { command: "generate", description: "创建图像" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress（默认：off；显式选择加入以避免预览编辑速率限制）
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
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（仅普通文件；拒绝符号链接），默认账户使用 `TELEGRAM_BOT_TOKEN` 作为回退。
- `apiRoot` 仅是 Telegram Bot API 根路径。使用 `https://api.telegram.org` 或你的自托管/代理根路径，而不是 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 会删除意外添加的尾部 `/bot<TOKEN>` 后缀。
- 可选的 `channels.telegram.defaultAccount` 在匹配配置的账户 id 时覆盖默认账户选择。
- 在多账户设置（2+ 个账户 id）中，设置明确的默认值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免回退路由；缺少或无效时 `openclaw doctor` 会警告。
- `configWrites: false` 阻止 Telegram 发起的配置写入（超级群组 ID 迁移、`/config set|unset`）。
- 带 `type: "acp"` 的顶级 `bindings[]` 条目为论坛话题配置持久 ACP 绑定（在 `match.peer.id` 中使用规范 `chatId:topic:topicId`）。字段语义在 [ACP Agent](/tools/acp-agents#persistent-channel-bindings) 中共享。
- Telegram 流预览使用 `sendMessage` + `editMessageText`（在直接聊天和群聊中有效）。
- 重试策略：请参见 [重试策略](/concepts/retry)。

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
              systemPrompt: "只给简短答案。",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress（Discord 默认：progress）
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
        },
      },
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
        spawnSessions: true,
        defaultSpawnContext: "fork",
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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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

- Token：`channels.discord.token`，默认账户使用 `DISCORD_BOT_TOKEN` 作为回退。
- 提供显式 Discord `token` 的直接出站调用使用该 token 进行调用；账户重试/策略设置仍来自活跃 runtime 快照中选定的账户。
- 可选的 `channels.discord.defaultAccount` 在匹配配置的账户 id 时覆盖默认账户选择。
- 投递目标使用 `user:<id>`（DM）或 `channel:<id>`（公会 Channel）；纯数字 ID 被拒绝。
- 公会 slug 为小写，空格替换为 `-`；Channel 键使用 slug 名称（无 `#`）。首选公会 ID。
- Bot 发送的消息默认被忽略。`allowBots: true` 启用它们；使用 `allowBots: "mentions"` 只接受提及 bot 的 bot 消息（自己的消息仍然被过滤）。
- 支持 bot 发送的入站消息的 Channel 可以使用共享的 [bot 循环保护](/channels/bot-loop-protection)。为基准配对预算设置 `channels.defaults.botLoopProtection`，然后只在一个表面需要不同限制时覆盖 Channel 或账户。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（及 Channel 覆盖）丢弃提及了另一个用户或角色但没有提及 bot 的消息（不包括 @everyone/@here）。
- `channels.discord.mentionAliases` 将稳定的出站 `@handle` 文本映射到 Discord 用户 ID，以便在瞬态目录缓存为空时也能确定性地提及已知队友。每账户覆盖位于 `channels.discord.accounts.<accountId>.mentionAliases`。
- `maxLinesPerMessage`（默认 17）即使在 2000 字符以内也会分割高行数消息。
- `channels.discord.suppressEmbeds` 默认为 `true`，因此出站 URL 不会展开为 Discord 链接预览，除非禁用。显式 `embeds` 负载仍会正常发送；每消息工具调用可以使用 `suppressEmbeds` 覆盖。
- `channels.discord.threadBindings` 控制 Discord 线程绑定路由：
  - `enabled`：线程绑定 Session 功能的 Discord 覆盖（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age` 和绑定投递/路由）
  - `idleHours`：非活跃自动取消聚焦的 Discord 覆盖（小时）（`0` 禁用）
  - `maxAgeHours`：硬性最大年龄的 Discord 覆盖（小时）（`0` 禁用）
  - `spawnSessions`：`sessions_spawn({ thread: true })` 和 ACP 线程生成自动线程创建/绑定的开关（默认：`true`）
  - `defaultSpawnContext`：线程绑定生成的原生子 Agent 上下文（默认 `"fork"`）
- 带 `type: "acp"` 的顶级 `bindings[]` 条目为 Channel 和线程配置持久 ACP 绑定（在 `match.peer.id` 中使用 Channel/线程 id）。字段语义在 [ACP Agent](/tools/acp-agents#persistent-channel-bindings) 中共享。
- `channels.discord.ui.components.accentColor` 为 Discord components v2 容器设置强调色。
- `channels.discord.voice` 启用 Discord 语音频道对话和可选的自动加入 + LLM + TTS 覆盖。仅文本 Discord 配置默认关闭语音；设置 `channels.discord.voice.enabled=true` 以选择加入。
- `channels.discord.voice.model` 可选地覆盖用于 Discord 语音频道响应的 LLM model。
- `channels.discord.voice.daveEncryption` 和 `channels.discord.voice.decryptionFailureTolerance` 透传到 `@discordjs/voice` DAVE 选项（默认 `true` 和 `24`）。
- `channels.discord.voice.connectTimeoutMs` 控制 `/vc join` 和自动加入尝试的初始 `@discordjs/voice` Ready 等待时间（默认 `30000`）。
- `channels.discord.voice.reconnectGraceMs` 控制断开的语音 Session 在 OpenClaw 销毁它之前进入重连信号的时间（默认 `15000`）。
- Discord 语音播放不会被其他用户的发言开始事件中断。为避免反馈循环，OpenClaw 在 TTS 播放时忽略新的语音捕获。
- OpenClaw 还通过在重复解密失败后离开/重新加入语音 Session 来尝试语音接收恢复。
- `channels.discord.streaming` 是规范的流模式键。Discord 默认使用 `streaming.mode: "progress"`，使工具/工作进度显示在一条编辑的预览消息中；设置 `streaming.mode: "off"` 禁用它。旧版 `streamMode` 和布尔 `streaming` 值仍为运行时别名；运行 `openclaw doctor --fix` 重写持久化配置。
- `channels.discord.autoPresence` 将 runtime 可用性映射到 bot presence（健康 => online，降级 => idle，耗尽 => dnd），并允许可选的状态文本覆盖。
- `channels.discord.dangerouslyAllowNameMatching` 重新启用可变名称/标签匹配（紧急兼容性模式）。
- `channels.discord.execApprovals`：Discord 原生 exec 批准投递和批准者授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在 auto 模式下，当可以从 `approvers` 或 `commands.ownerAllowFrom` 解析批准者时，exec 批准会激活。
  - `approvers`：允许批准 exec 请求的 Discord 用户 ID。省略时回退到 `commands.ownerAllowFrom`。
  - `agentFilter`：可选的 Agent ID 允许列表。省略以转发所有 Agent 的批准。
  - `sessionFilter`：可选的 Session 键模式（子字符串或正则表达式）。
  - `target`：发送批准提示的位置。`"dm"`（默认）发送到批准者 DM，`"channel"` 发送到原始 Channel，`"both"` 同时发送。当 target 包含 `"channel"` 时，按钮只能由已解析的批准者使用。
  - `cleanupAfterResolve`：为 `true` 时，在批准、拒绝或超时后删除批准 DM。

**反应通知模式：** `off`（无）、`own`（bot 的消息，默认）、`all`（所有消息）、`allowlist`（来自所有消息上 `guilds.<id>.users` 的）。

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
- `channels.googlechat.dangerouslyAllowNameMatching` 重新启用可变电子邮件主体匹配（紧急兼容性模式）。

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
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
          systemPrompt: "只给简短答案。",
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

- **Socket 模式**需要 `botToken` 和 `appToken`（默认账户环境变量回退为 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP 模式**需要 `botToken` 加 `signingSecret`（在根级别或每账户）。
- `socketMode` 将 Slack SDK Socket Mode 传输调优透传到公开的 Bolt receiver API。仅在排查 ping/pong 超时或陈旧 WebSocket 行为时使用。`clientPingTimeout` 默认为 `15000`；仅在配置时才传递 `serverPingTimeout` 和 `pingPongLoggingEnabled`。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受明文字符串或 SecretRef 对象。
- Slack 账户快照暴露每个凭据的来源/状态字段，如 `botTokenSource`、`botTokenStatus`、`appTokenStatus`，在 HTTP 模式下还有 `signingSecretStatus`。`configured_unavailable` 表示账户通过 SecretRef 配置，但当前命令/runtime 路径无法解析 secret 值。
- `configWrites: false` 阻止 Slack 发起的配置写入。
- 可选的 `channels.slack.defaultAccount` 在匹配配置的账户 id 时覆盖默认账户选择。
- `channels.slack.streaming.mode` 是规范的 Slack 流模式键。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生流式传输。旧版 `streamMode`、布尔 `streaming` 和 `nativeStreaming` 值仍为运行时别名；运行 `openclaw doctor --fix` 重写持久化配置。
- `unfurlLinks` 和 `unfurlMedia` 透传 Slack 的 `chat.postMessage` 链接和媒体展开布尔值用于 bot 回复。`unfurlLinks` 默认为 `false`，因此出站 bot 链接不会内联展开，除非启用；`unfurlMedia` 除非配置否则省略。在 `channels.slack.accounts.<accountId>` 处设置任一值以覆盖该账户的顶级值。
- 投递目标使用 `user:<id>`（DM）或 `channel:<id>`。

**反应通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

**线程 Session 隔离：** `thread.historyScope` 是每线程（默认）或在 Channel 间共享。`thread.inheritParent` 将父 Channel 转录复制到新线程。

- Slack 原生流式传输加上 Slack assistant 风格的"正在输入..."线程状态需要回复线程目标。顶级 DM 默认不在线程中，因此它们仍然可以通过 Slack draft post-and-edit 预览进行流式传输，而不是显示线程风格的原生流/状态预览。
- `typingReaction` 在运行回复时向入站 Slack 消息添加临时反应，完成时删除它。使用 Slack 表情代码，如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生 exec 批准投递和批准者授权。与 Discord 相同的架构：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 用户 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。

| 操作组       | 默认   | 说明                   |
| ------------ | ------ | ---------------------- |
| reactions    | 启用   | 添加和列出反应         |
| messages     | 启用   | 读取/发送/编辑/删除    |
| pins         | 启用   | 固定/取消固定/列出     |
| memberInfo   | 启用   | 成员信息               |
| emojiList    | 启用   | 自定义表情列表         |

### Mattermost

Mattermost 作为捆绑 Plugin 随当前 OpenClaw 版本提供。旧版或自定义构建可以通过 `openclaw plugins install @openclaw/mattermost` 安装当前 npm 包。固定版本前请在 [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) 查看当前 dist-tags。

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
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // 选择加入
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 反向代理/公开部署的可选显式 URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

聊天模式：`oncall`（在 @-提及时响应，默认）、`onmessage`（每条消息）、`onchar`（以触发前缀开头的消息）。

启用 Mattermost 原生命令时：

- `commands.callbackPath` 必须是路径（例如 `/api/channels/mattermost/command`），不是完整 URL。
- `commands.callbackUrl` 必须解析为 OpenClaw gateway 端点，并可从 Mattermost 服务器访问。
- 原生斜杠回调使用 Mattermost 在斜杠命令注册期间返回的每命令 token 进行认证。如果注册失败或没有命令被激活，OpenClaw 以 `Unauthorized: invalid command token.` 拒绝回调。
- 对于私有/tailnet/内部回调主机，Mattermost 可能需要 `ServiceSettings.AllowedUntrustedInternalConnections` 包含回调主机/域。使用主机/域值，而不是完整 URL。
- `channels.mattermost.configWrites`：允许或拒绝 Mattermost 发起的配置写入。
- `channels.mattermost.requireMention`：在 Channel 中回复前需要 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：每 Channel 提及门控覆盖（`"*"` 为默认）。
- 可选的 `channels.mattermost.defaultAccount` 在匹配配置的账户 id 时覆盖默认账户选择。

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

- `channels.signal.account`：将 Channel 启动固定到特定 Signal 账户身份。
- `channels.signal.configWrites`：允许或拒绝 Signal 发起的配置写入。
- 可选的 `channels.signal.defaultAccount` 在匹配配置的账户 id 时覆盖默认账户选择。

### iMessage

OpenClaw 生成 `imsg rpc`（通过 stdio 的 JSON-RPC）。不需要守护进程或端口。这是新的 OpenClaw iMessage 设置的首选路径，前提是主机可以授予 Messages 数据库和自动化权限。

BlueBubbles 支持已移除。将 `channels.bluebubbles` 配置迁移到 `channels.imessage`；OpenClaw 仅通过 `imsg` 支持 iMessage。

如果 Gateway 不在已登录 Messages 的 Mac 上运行，保持 `channels.imessage.enabled=true` 并将 `channels.imessage.cliPath` 设置为在该 Mac 上运行 `imsg "$@"` 的 SSH 包装器。默认的本地 `imsg` 路径仅限 macOS。

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
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
      catchup: {
        enabled: false,
      },
    },
  },
}
```

- 可选的 `channels.imessage.defaultAccount` 在匹配配置的账户 id 时覆盖默认账户选择。

- 需要对 Messages DB 的完整磁盘访问权限。
- 首选 `chat_id:<id>` 目标。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可以指向 SSH 包装器；设置 `remoteHost`（`host` 或 `user@host`）用于 SCP 附件获取。
- `attachmentRoots` 和 `remoteAttachmentRoots` 限制入站附件路径（默认：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用严格的主机密钥检查，因此确保中继主机密钥已存在于 `~/.ssh/known_hosts` 中。
- `channels.imessage.configWrites`：允许或拒绝 iMessage 发起的配置写入。
- `channels.imessage.actions.*`：启用私有 API 操作，这些操作也受 `imsg status` / `openclaw channels status --probe` 门控。
- `channels.imessage.includeAttachments` 默认关闭；设置为 `true` 之后才能在 Agent 轮次中收到入站媒体。
- `channels.imessage.catchup.enabled`：选择加入以重放 Gateway 宕机期间到达的入站消息。
- `channels.imessage.groups`：群组注册表和每群组设置。使用 `groupPolicy: "allowlist"` 时，配置显式的 `chat_id` 键或 `"*"` 通配符条目，以便群组消息可以通过注册表门控。
- 带 `type: "acp"` 的顶级 `bindings[]` 条目可以将 iMessage 对话绑定到持久 ACP Session。在 `match.peer.id` 中使用规范化句柄或显式聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享字段语义：[ACP Agent](/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH 包装器示例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix 由 Plugin 支持，在 `channels.matrix` 下配置。

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
- `channels.matrix.proxy` 通过显式 HTTP(S) 代理路由 Matrix HTTP 流量。命名账户可以使用 `channels.matrix.accounts.<id>.proxy` 覆盖它。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允许私有/内部 homeserver。`proxy` 和此网络选择加入是独立控制。
- `channels.matrix.defaultAccount` 在多账户设置中选择首选账户。
- `channels.matrix.autoJoin` 默认为 `off`，因此受邀房间和新鲜 DM 风格邀请会被忽略，直到你设置 `autoJoin: "allowlist"` 配合 `autoJoinAllowlist` 或 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生 exec 批准投递和批准者授权。
  - `enabled`：`true`、`false` 或 `"auto"`（默认）。在 auto 模式下，当可以从 `approvers` 或 `commands.ownerAllowFrom` 解析批准者时，exec 批准会激活。
  - `approvers`：允许批准 exec 请求的 Matrix 用户 ID（例如 `@owner:example.org`）。
  - `agentFilter`：可选的 Agent ID 允许列表。省略以转发所有 Agent 的批准。
  - `sessionFilter`：可选的 Session 键模式（子字符串或正则表达式）。
  - `target`：发送批准提示的位置。`"dm"`（默认）、`"channel"`（原始房间）或 `"both"`。
  - 每账户覆盖：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix DM 如何分组到 Session：`per-user`（默认）按路由的 peer 共享，而 `per-room` 隔离每个 DM 房间。
- Matrix status 探测和实时目录查找使用与 runtime 流量相同的代理策略。
- 完整 Matrix 配置、目标规则和设置示例记录在 [Matrix](/channels/matrix) 中。

### Microsoft Teams

Microsoft Teams 由 Plugin 支持，在 `channels.msteams` 下配置。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, 团队/Channel 策略：
      // 请参见 /channels/msteams
    },
  },
}
```

- 此处涵盖的核心键路径：`channels.msteams`、`channels.msteams.configWrites`。
- 完整 Teams 配置（凭据、webhook、DM/群组策略、每团队/每 Channel 覆盖）记录在 [Microsoft Teams](/channels/msteams) 中。

### IRC

IRC 由 Plugin 支持，在 `channels.irc` 下配置。

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
- 可选的 `channels.irc.defaultAccount` 在匹配配置的账户 id 时覆盖默认账户选择。
- 完整 IRC Channel 配置（主机/端口/TLS/Channel/允许列表/提及门控）记录在 [IRC](/channels/irc) 中。

### 多账户（所有 Channel）

每 Channel 运行多个账户（每个账户有自己的 `accountId`）：

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "主 bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "告警 bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- 省略 `accountId` 时使用 `default`（CLI + 路由）。
- 环境 token 只适用于 **default** 账户。
- 基础 Channel 设置适用于所有账户，除非每账户覆盖。
- 使用 `bindings[].match.accountId` 将每个账户路由到不同的 Agent。
- 如果你在仍处于单账户顶级 Channel 配置时通过 `openclaw channels add`（或 Channel 入门）添加非默认账户，OpenClaw 会首先将账户范围的顶级单账户值提升到 Channel 账户映射中，以便原始账户继续工作。大多数 Channel 将它们移到 `channels.<channel>.accounts.default`；Matrix 可以保留现有的匹配命名/默认目标。
- 现有的仅 Channel 绑定（无 `accountId`）继续匹配默认账户；账户范围绑定仍然是可选的。
- `openclaw doctor --fix` 还通过将账户范围的顶级单账户值移到该 Channel 选择的提升账户来修复混合形状。大多数 Channel 使用 `accounts.default`；Matrix 可以保留现有的匹配命名/默认目标。

### 其他 Plugin Channel

许多 Plugin Channel 配置为 `channels.<id>`，并记录在其专用 Channel 页面中（例如 Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat 和 Twitch）。
请参见完整 Channel 索引：[Channel](/channels)。

### 群聊提及门控

群组消息默认**需要提及**（元数据提及或安全正则表达式模式）。适用于 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群聊。

可见回复单独控制。正常群组/Channel 请求默认使用 `messages.groupChat.visibleReplies: "automatic"`：最终助手文本通过旧版可见回复路径发送。在共享房间中如果只希望 Agent 调用 `message(action=send)` 后才发送可见输出，请设置 `"message_tool"`。如果模型返回最终文本而没有调用消息工具，该最终文本保持私有，Gateway 详细日志记录抑制的负载元数据。若要对直接聊天也应用相同的仅工具可见回复行为，设置 `messages.visibleReplies: "message_tool"`；Codex 运行时也将该仅工具行为作为其未设置的直接聊天默认值。

仅工具可见回复需要能可靠调用工具的模型/运行时，建议在最新一代模型（如 GPT 5.5）的共享环境房间中使用。如果 Session 日志显示带有 `didSendViaMessagingTool: false` 的助手文本，说明模型生成了私有最终文本而不是调用消息工具。为该 Channel 切换到更强的工具调用模型，检查 Gateway 详细日志中的抑制负载摘要，或设置 `messages.groupChat.visibleReplies: "automatic"` 以对每个群组/Channel 请求使用可见最终回复。

如果消息工具在当前工具策略下不可用，OpenClaw 回退到自动可见回复，而不是静默抑制响应。`openclaw doctor` 会对此不匹配发出警告。

Gateway 在文件保存后热重载 `messages` 配置。仅在部署中禁用文件监视或配置重载时才需要重启。

**提及类型：**

- **元数据提及**：原生平台 @-提及。在 WhatsApp 自聊模式下被忽略。
- **文本模式**：`agents.list[].groupChat.mentionPatterns` 中的安全正则表达式模式。无效模式和不安全的嵌套重复被忽略。
- 只有在检测可能时才强制执行提及门控（原生提及或至少一个模式）。

```json5
{
  messages: {
    visibleReplies: "automatic", // 直接/源聊天的全局默认；Codex 运行时将未设置的直接聊天默认为 message_tool
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // 始终开启的未提及房间闲聊变成安静上下文
      visibleReplies: "message_tool", // 选择加入；要求 message(action=send) 才能获得可见房间回复
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` 设置全局默认值。Channel 可以使用 `channels.<channel>.historyLimit`（或每账户）覆盖。设置 `0` 禁用。

`messages.groupChat.unmentionedInbound: "room_event"` 在支持的 Channel 上将未提及的始终开启群组/Channel 消息作为安静房间上下文提交。被提及的消息、命令和直接消息仍为用户请求。参见 [环境房间事件](/channels/ambient-room-events) 获取完整的 Discord、Slack 和 Telegram 示例。

`messages.visibleReplies` 是全局源事件默认；`messages.groupChat.visibleReplies` 为群组/Channel 源事件覆盖它。当 `messages.visibleReplies` 未设置时，运行时可以提供自己的直接/源默认；Codex 运行时默认为 `message_tool`。Channel 允许列表和提及门控仍然决定事件是否被处理。

#### DM 历史记录限制

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

解析：每 DM 覆盖 → Provider 默认 → 无限制（全部保留）。

支持：`telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### 自聊模式

在 `allowFrom` 中包含你自己的号码以启用自聊模式（忽略原生 @-提及，只响应文本模式）：

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
    native: "auto", // 在支持时注册原生命令
    nativeSkills: "auto", // 在支持时注册原生 skill 命令
    text: true, // 解析聊天消息中的 /commands
    bash: false, // 允许 !（别名：/bash）
    bashForegroundMs: 2000,
    config: false, // 允许 /config
    mcp: false, // 允许 /mcp
    plugins: false, // 允许 /plugins
    debug: false, // 允许 /debug
    restart: true, // 允许 /restart + gateway 重启工具
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

- 此块配置命令表面。当前内置和捆绑命令目录请参见 [斜杠命令](/tools/slash-commands)。
- 此页面是**配置键参考**，而非完整命令目录。Channel/Plugin 拥有的命令（如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、设备配对 `/pair`、内存 `/dreaming`、手机控制 `/phone` 和 Talk `/voice`）记录在其 Channel/Plugin 页面以及 [斜杠命令](/tools/slash-commands) 中。
- 文本命令必须是以 `/` 开头的**独立**消息。
- `native: "auto"` 为 Discord/Telegram 开启原生命令，让 Slack 关闭。
- `nativeSkills: "auto"` 为 Discord/Telegram 开启原生 skill 命令，让 Slack 关闭。
- 每 Channel 覆盖：`channels.discord.commands.native`（布尔或 `"auto"`）。`false` 清除之前注册的命令。
- 使用 `channels.<provider>.commands.nativeSkills` 覆盖每 Channel 的原生 skill 注册。
- `channels.telegram.customCommands` 添加额外的 Telegram bot 菜单条目。
- `bash: true` 启用主机 Shell 的 `! <cmd>`。需要 `tools.elevated.enabled` 且发送者在 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 启用 `/config`（读取/写入 `openclaw.json`）。对于 gateway `chat.send` 客户端，持久 `/config set|unset` 写入也需要 `operator.admin`；只读 `/config show` 仍然对普通写作用域的 operator 客户端可用。
- `mcp: true` 启用 `/mcp` 用于 `mcp.servers` 下的 OpenClaw 管理的 MCP 服务器配置。
- `plugins: true` 启用 `/plugins` 用于 Plugin 发现、安装和启用/禁用控制。
- `channels.<provider>.configWrites` 控制每 Channel 的配置变更（默认：true）。
- 对于多账户 Channel，`channels.<provider>.accounts.<id>.configWrites` 也控制针对该账户的写入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 禁用 `/restart` 和 gateway 重启工具操作。默认值：`true`。
- `ownerAllowFrom` 是所有者专属命令/工具的显式所有者允许列表。它与 `allowFrom` 分开。
- `ownerDisplay: "hash"` 在系统 prompt 中散列所有者 id。设置 `ownerDisplaySecret` 控制散列。
- `allowFrom` 是每 Provider 的。设置后，它是**唯一的**授权来源（Channel 允许列表/配对和 `useAccessGroups` 被忽略）。
- `useAccessGroups: false` 允许命令在未设置 `allowFrom` 时绕过访问组策略。
- 命令文档映射：
  - 内置和捆绑目录：[斜杠命令](/tools/slash-commands)
  - Channel 特定命令表面：[Channel](/channels)
  - QQ Bot 命令：[QQ Bot](/channels/qqbot)
  - 配对命令：[配对](/channels/pairing)
  - LINE 卡片命令：[LINE](/channels/line)
  - 内存 dreaming：[Dreaming](/concepts/dreaming)

</Accordion>

---

## 相关文档

- [配置参考](/gateway/configuration-reference) — 顶级键
- [配置 — agents](/gateway/config-agents)
- [Channel 概述](/channels)
