---
mmh3_hash: "1e4d6cefabeec4089255afa7452886f3"
summary: "Telegram bot 支持状态、功能和配置"
read_when:
  - 开发 Telegram 功能或 webhook
title: "Telegram"
---

状态：通过 grammY 支持 bot 私信 + 群组，生产环境可用。默认使用长轮询；可选 webhook 模式。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/channels/pairing">
    Telegram 的默认私信策略为配对模式。
  </Card>
  <Card title="频道故障排除" icon="wrench" href="/channels/troubleshooting">
    跨频道诊断和修复手册。
  </Card>
  <Card title="Gateway 配置" icon="settings" href="/gateway/configuration">
    完整的频道配置模式和示例。
  </Card>
</CardGroup>

## 快速设置

<Steps>
  <Step title="在 BotFather 中创建 bot token">
    打开 Telegram 并与 **@BotFather** 聊天（确认 handle 为 `@BotFather`）。

    运行 `/newbot`，按照提示操作，并保存 token。

  </Step>

  <Step title="配置 token 和私信策略">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    环境变量回退：`TELEGRAM_BOT_TOKEN=...`（仅默认账户）。
    Telegram **不使用** `openclaw channels login telegram`；在配置/环境中设置 token，然后启动 gateway。

  </Step>

  <Step title="启动 gateway 并批准首条私信">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    配对码 1 小时后过期。

  </Step>

  <Step title="将 bot 添加到群组">
    将 bot 添加到您的群组，然后设置 `channels.telegram.groups` 和 `groupPolicy` 以匹配您的访问模型。
  </Step>
</Steps>

<Note>
Token 解析顺序为账户感知。实际上，配置值优先于环境变量回退，`TELEGRAM_BOT_TOKEN` 仅适用于默认账户。
</Note>

## Telegram 端设置

<AccordionGroup>
  <Accordion title="隐私模式和群组可见性">
    Telegram bot 默认启用**隐私模式**，限制其接收的群组消息。

    如果 bot 必须看到所有群组消息，可以：

    - 通过 `/setprivacy` 禁用隐私模式，或
    - 将 bot 设为群组管理员。

    切换隐私模式后，需要从每个群组中移除并重新添加 bot 以使更改生效。

  </Accordion>

  <Accordion title="群组权限">
    管理员状态在 Telegram 群组设置中控制。

    管理员 bot 接收所有群组消息，适合需要始终响应的群组行为。

  </Accordion>

  <Accordion title="BotFather 实用设置">

    - `/setjoingroups` 允许/禁止添加到群组
    - `/setprivacy` 控制群组可见性行为

  </Accordion>
</AccordionGroup>

## 访问控制和激活

<Tabs>
  <Tab title="私信策略">
    `channels.telegram.dmPolicy` 控制私信访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `channels.telegram.allowFrom` 接受数字 Telegram 用户 ID。`telegram:` / `tg:` 前缀被接受并规范化。
    `dmPolicy: "allowlist"` 时空的 `allowFrom` 会阻止所有私信，且会被配置验证拒绝。
    设置向导仅接受数字用户 ID。
    如果您升级后配置中含有 `@username` allowlist 条目，运行 `openclaw doctor --fix` 解析它们（尽力而为；需要 Telegram bot token）。
    如果之前依赖配对存储 allowlist 文件，`openclaw doctor --fix` 可以在 allowlist 迁移流程中将条目恢复到 `channels.telegram.allowFrom`（例如当 `dmPolicy: "allowlist"` 尚无显式 ID 时）。

    对于单用户 bot，推荐使用 `dmPolicy: "allowlist"` 配合显式数字 `allowFrom` ID，以便将访问策略持久化在配置中（而不是依赖之前的配对审批）。

    常见误解：DM 配对批准不等于"此发送者在所有地方都已授权"。配对仅授予 DM 访问权限。群组发送者授权仍然来自显式配置 allowlist。如果您希望"我已授权一次，DM 和群组命令均可使用"，请将您的数字 Telegram 用户 ID 放在 `channels.telegram.allowFrom` 中。

    ### 查找您的 Telegram 用户 ID

    更安全的方式（无需第三方 bot）：

    1. 私信您的 bot。
    2. 运行 `openclaw logs --follow`。
    3. 读取 `from.id`。

    官方 Bot API 方式：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方式（隐私较差）：`@userinfobot` 或 `@getidsbot`。

  </Tab>

  <Tab title="群组策略和 allowlist">
    有两个独立的控制：

    1. **允许哪些群组**（`channels.telegram.groups`）
       - 无 `groups` 配置：
         - `groupPolicy: "open"` 时：任何群组均可通过群组 ID 检查
         - `groupPolicy: "allowlist"`（默认）时：群组被阻止，直到添加 `groups` 条目（或 `"*"`）
       - 配置了 `groups`：作为 allowlist（使用显式 ID 或 `"*"`）

    2. **群组中允许哪些发送者**（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（默认）
       - `disabled`

    `groupAllowFrom` 用于群组发送者过滤。如果未设置，Telegram 回退到 `allowFrom`。
    `groupAllowFrom` 条目应使用数字 Telegram 用户 ID（`telegram:` / `tg:` 前缀被规范化）。
    不要将 Telegram 群组或超级群组的聊天 ID 放在 `groupAllowFrom` 中。负数聊天 ID 应放在 `channels.telegram.groups` 下。
    非数字条目在发送者授权时被忽略。
    安全边界（`2026.2.25+`）：群组发送者授权**不**继承 DM 配对存储批准。配对仅用于 DM。对于群组，请设置 `groupAllowFrom` 或每群组/每主题 `allowFrom`。
    运行时注意：如果 `channels.telegram` 完全缺失，运行时会回退到 `groupPolicy="allowlist"` 进行群组策略评估（即使 `channels.defaults.groupPolicy` 已设置）。

    示例：在一个特定群组中允许任何成员：

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    示例：在一个特定群组中只允许特定用户：

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      常见错误：`groupAllowFrom` 不是 Telegram 群组 allowlist。

      - 将负数 Telegram 群组或超级群组聊天 ID（如 `-1001234567890`）放在 `channels.telegram.groups` 下。
      - 将 Telegram 用户 ID（如 `8734062810`）放在 `groupAllowFrom` 下，用于限制哪些成员可以在允许的群组中触发 bot。
      - 只有当您希望允许群组内的任何成员与 bot 交互时，才使用 `groupAllowFrom: ["*"]`。
    </Warning>

  </Tab>

  <Tab title="提及行为">
    群组回复默认需要提及。

    提及可以来自：

    - 原生 `@botusername` 提及，或
    - 以下位置的提及模式：
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    会话级命令切换：

    - `/activation always`
    - `/activation mention`

    这些仅更新会话状态。使用配置进行持久化。

    持久化配置示例：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    获取群组聊天 ID：

    - 将群组消息转发到 `@userinfobot` / `@getidsbot`
    - 或从 `openclaw logs --follow` 读取 `chat.id`
    - 或检查 Bot API `getUpdates`

  </Tab>
</Tabs>

## 运行时行为

- Telegram 由 gateway 进程拥有。
- 路由是确定性的：Telegram 入站消息回复到 Telegram（模型不选择频道）。
- 入站消息规范化为共享频道信封，包含回复元数据和媒体占位符。
- 群组会话按群组 ID 隔离。论坛主题附加 `:topic:<threadId>` 保持主题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 使用线程感知会话键路由，并为回复保留线程 ID。
- 长轮询使用 grammY runner，按聊天/线程顺序处理。总并发由 `agents.defaults.maxConcurrent` 控制。
- 长轮询在每个 Gateway 进程内受到保护，确保同一时间只有一个活跃的轮询器可以使用 bot token。如果仍然出现 `getUpdates` 409 冲突，说明另一个 OpenClaw Gateway、脚本或外部轮询器可能在使用相同的 token。
- 长轮询看门狗默认在 120 秒内没有完成 `getUpdates` 存活检查时触发重启。仅当您的部署在长时间运行的工作期间仍然出现误报轮询停滞重启时，才增大 `channels.telegram.pollingStallThresholdMs`。该值以毫秒为单位，允许范围为 `30000` 到 `600000`；支持每账户覆盖。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

## 功能参考

<AccordionGroup>
  <Accordion title="实时流式预览（消息编辑）">
    OpenClaw 可以实时流式传输部分回复：

    - 私聊：预览消息 + `editMessageText`
    - 群组/主题：预览消息 + `editMessageText`

    要求：

    - `channels.telegram.streaming` 为 `off | partial | block | progress`（默认：`partial`）
    - `progress` 在 Telegram 上映射到 `partial`（与跨频道命名兼容）
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一已编辑的预览消息（默认：当预览流式传输启动时为 `true`）
    - 旧版 `channels.telegram.streamMode` 和布尔值 `streaming` 会被检测到；运行 `openclaw doctor --fix` 将其迁移到 `channels.telegram.streaming.mode`

    工具进度预览更新是工具运行时显示的简短"Working..."行，例如命令执行、文件读取、计划更新或补丁摘要。Telegram 默认启用这些功能，与 `v2026.4.22` 及更高版本的 OpenClaw 行为一致。如果您希望保留答案文本的编辑预览但隐藏工具进度行，请设置：

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    仅当您想完全禁用 Telegram 预览编辑时，才使用 `streaming.mode: "off"`。仅禁用工具进度状态行时，使用 `streaming.preview.toolProgress: false`。

    对于纯文本回复：

    - 较短的私信/群组/主题预览：OpenClaw 保留相同的预览消息并在原地进行最终编辑
    - 约一分钟前创建的预览：OpenClaw 以新的最终消息发送完成的回复，然后清理预览，使 Telegram 的可见时间戳反映完成时间而非预览创建时间

    对于复杂回复（例如媒体负载），OpenClaw 回退到正常最终传递，然后清理预览消息。

    预览流式传输与块流式传输分离。当为 Telegram 显式启用块流式传输时，OpenClaw 跳过预览流以避免双重流式传输。

    仅 Telegram 的推理流：

    - `/reasoning stream` 在生成时将推理发送到实时预览
    - 最终答案不含推理文本发送

  </Accordion>

  <Accordion title="格式化和 HTML 回退">
    出站文本使用 Telegram `parse_mode: "HTML"`。

    - 类 Markdown 文本渲染为 Telegram 安全 HTML。
    - 原始模型 HTML 被转义以减少 Telegram 解析失败。
    - 如果 Telegram 拒绝解析的 HTML，OpenClaw 以纯文本重试。

    链接预览默认启用，可以通过 `channels.telegram.linkPreview: false` 禁用。

  </Accordion>

  <Accordion title="原生命令和自定义命令">
    Telegram 命令菜单注册在启动时通过 `setMyCommands` 处理。

    原生命令默认：

    - `commands.native: "auto"` 为 Telegram 启用原生命令

    添加自定义命令菜单条目：

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    规则：

    - 名称被规范化（去除前导 `/`，小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突/重复被跳过并记录

    注意：

    - 自定义命令仅是菜单条目；它们不自动实现行为
    - 即使未显示在 Telegram 菜单中，插件/技能命令在输入时仍可工作

    如果原生命令被禁用，内置命令被移除。自定义/插件命令如果已配置仍可注册。

    常见设置失败：

    - `setMyCommands failed` 带 `BOT_COMMANDS_TOO_MUCH` 表示修剪后 Telegram 菜单仍然溢出；减少插件/技能/自定义命令，或禁用 `channels.telegram.commands.native`。
    - `setMyCommands failed` 带网络/fetch 错误通常意味着到 `api.telegram.org` 的出站 DNS/HTTPS 被阻止。

    ### 设备配对命令（`device-pair` 插件）

    安装 `device-pair` 插件后：

    1. `/pair` 生成设置码
    2. 在 iOS 应用中粘贴代码
    3. `/pair pending` 列出待处理请求（包括角色/权限范围）
    4. 批准请求：
       - `/pair approve <requestId>` 明确批准
       - `/pair approve` 当只有一个待处理请求时
       - `/pair approve latest` 批准最新的

    如果设备以更改后的认证详情重试（例如角色/权限范围/公钥），之前的待处理请求会被取代，新请求使用不同的 `requestId`。批准前重新运行 `/pair pending`。

    更多详情：[配对](/channels/pairing#pair-via-telegram-recommended-for-ios)。

  </Accordion>

  <Accordion title="内联按钮">
    配置内联键盘范围：

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    每账户覆盖：

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    范围：

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist`（默认）

    旧版 `capabilities: ["inlineButtons"]` 映射到 `inlineButtons: "all"`。

    消息操作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    回调点击作为文本传递给 agent：
    `callback_data: <value>`

  </Accordion>

  <Accordion title="agent 和自动化的 Telegram 消息操作">
    Telegram 工具操作包括：

    - `sendMessage`（`to`、`content`、可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）
    - `createForumTopic`（`chatId`、`name`、可选 `iconColor`、`iconCustomEmojiId`）

    频道消息操作提供人性化别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`、`topic-create`）。

    门控控制：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    注意：`edit` 和 `topic-create` 目前默认启用，没有单独的 `channels.telegram.actions.*` 开关。
    运行时发送使用激活的配置/密钥快照（启动/重载），因此操作路径不会在每次发送时执行临时 SecretRef 重新解析。

    Reaction 移除语义：[/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="回复线程标签">
    Telegram 支持生成输出中的显式回复线程标签：

    - `[[reply_to_current]]` 回复触发消息
    - `[[reply_to:<id>]]` 回复特定 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理：

    - `off`（默认）
    - `first`
    - `all`

    当启用回复线程且原始 Telegram 文本或标题可用时，OpenClaw 会自动包含原生 Telegram 引用摘录。Telegram 将原生引用文本限制为 1024 个 UTF-16 代码单元，因此较长的消息从开头截断引用，如果 Telegram 拒绝该引用则回退到普通回复。

    注意：`off` 禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍然有效。

  </Accordion>

  <Accordion title="论坛主题和线程行为">
    论坛超级群组：

    - 主题会话键追加 `:topic:<threadId>`
    - 回复和输入以主题线程为目标
    - 主题配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    通用主题（`threadId=1`）特殊情况：

    - 消息发送省略 `message_thread_id`（Telegram 拒绝 `sendMessage(...thread_id=1)`）
    - 输入操作仍包含 `message_thread_id`

    主题继承：主题条目继承群组设置，除非被覆盖（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。
    `agentId` 仅适用于主题级别，不从群组默认值继承。

    **每主题 Agent 路由**：每个主题可以通过在主题配置中设置 `agentId` 路由到不同的 agent。这使每个主题拥有自己独立的工作区、记忆和会话。示例：

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // 通用主题 → main agent
                "3": { agentId: "zu" },        // 开发主题 → zu agent
                "5": { agentId: "coder" }      // 代码审查 → coder agent
              }
            }
          }
        }
      }
    }
    ```

    每个主题拥有自己的会话键：`agent:zu:telegram:group:-1001234567890:topic:3`

    **持久化 ACP 主题绑定**：论坛主题可以通过顶层类型化 ACP 绑定固定 ACP 工具会话：

    - `bindings[]` 中使用 `type: "acp"` 和 `match.channel: "telegram"`

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
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    此功能目前仅限于群组和超级群组中的论坛主题。

    **从聊天生成线程绑定 ACP**：

    - `/acp spawn <agent> --thread here|auto` 可将当前 Telegram 主题绑定到新的 ACP 会话。
    - 后续主题消息直接路由到绑定的 ACP 会话（无需 `/acp steer`）。
    - 成功绑定后，OpenClaw 在主题内固定生成确认消息。
    - 需要 `channels.telegram.threadBindings.spawnAcpSessions=true`。

    模板上下文包括：

    - `MessageThreadId`
    - `IsForum`

    私信线程行为：

    - 含 `message_thread_id` 的私聊保持私信路由，但使用线程感知会话键/回复目标。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 区分语音笔记和音频文件。

    - 默认：音频文件行为
    - 在 agent 回复中添加 `[[audio_as_voice]]` 标签强制使用语音笔记发送

    消息操作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### 视频消息

    Telegram 区分视频文件和视频笔记。

    消息操作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    视频笔记不支持标题；提供的消息文本单独发送。

    ### 贴纸

    入站贴纸处理：

    - 静态 WEBP：下载并处理（占位符 `<media:sticker>`）
    - 动画 TGS：跳过
    - 视频 WEBM：跳过

    贴纸上下文字段：

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    贴纸缓存文件：

    - `~/.openclaw/telegram/sticker-cache.json`

    贴纸在可能时被描述一次并缓存，以减少重复的视觉调用。

    启用贴纸操作：

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    发送贴纸操作：

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    搜索缓存的贴纸：

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Reaction 通知">
    Telegram reaction 以 `message_reaction` 更新到达（与消息负载分离）。

    启用后，OpenClaw 排队系统事件，例如：

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    注意：

    - `own` 表示仅用户对 bot 发送消息的 reaction（通过已发送消息缓存尽力而为）。
    - Reaction 事件仍遵守 Telegram 访问控制（`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`）；未授权的发送者被丢弃。
    - Telegram 在 reaction 更新中不提供线程 ID。
      - 非论坛群组路由到群组聊天会话
      - 论坛群组路由到群组通用主题会话（`:topic:1`），而非确切的原始主题

    轮询/webhook 的 `allowed_updates` 自动包含 `message_reaction`。

  </Accordion>

  <Accordion title="Ack reaction">
    `ackReaction` 在 OpenClaw 处理入站消息时发送确认表情符号。

    解析顺序：

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent 身份表情符号回退（`agents.list[].identity.emoji`，否则 "👀"）

    注意：

    - Telegram 期望 Unicode 表情符号（例如 "👀"）。
    - 使用 `""` 禁用频道或账户的 reaction。

  </Accordion>

  <Accordion title="Exec 审批">
    Telegram 支持在审批者私信中进行 exec 审批，也可以选择在发起聊天或主题中发布审批提示。

    配置路径：

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers`
    - `channels.telegram.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`

    审批者必须是数字 Telegram 用户 ID。当 `enabled` 未设置或为 `"auto"` 且至少一个审批者可以解析时（来自 `execApprovals.approvers` 或账户数字所有者配置），Telegram 自动启用原生 exec 审批。设置 `enabled: false` 可明确禁用 Telegram 作为原生审批客户端。否则审批请求回退到其他已配置的审批路由或 exec 审批后备策略。

    Telegram 还渲染其他聊天 Channel 使用的共享审批按钮。当这些按钮存在时，它们是主要的审批 UX；仅在工具结果表明聊天审批不可用或手动审批是唯一路径时，OpenClaw 才应包含手动 `/approve` 命令。

    传递规则：

    - `target: "dm"` 仅向已配置的审批者私信发送审批提示
    - `target: "channel"` 将提示发回到发起的 Telegram 聊天/主题
    - `target: "both"` 同时发送到审批者私信和发起的聊天/主题

    只有已配置的审批者才能批准或拒绝。非审批者无法使用 `/approve`，也无法使用 Telegram 审批按钮。

    审批解析行为：

    - 带 `plugin:` 前缀的 ID 始终通过插件审批解析。
    - 其他审批 ID 首先尝试 `exec.approval.resolve`。
    - 如果 Telegram 也被授权用于插件审批，且 Gateway 返回 exec 审批未知/过期，Telegram 通过 `plugin.approval.resolve` 重试一次。
    - 真正的 exec 审批拒绝/错误不会静默地降级到插件审批解析。

    频道传递在聊天中显示命令文本，因此仅在受信任的群组/主题中启用 `channel` 或 `both`。当提示落在论坛主题中时，OpenClaw 为审批提示和审批后续跟进保留该主题。Exec 审批默认在 30 分钟后过期。

    内联审批按钮还取决于 `channels.telegram.capabilities.inlineButtons` 是否允许目标表面（`dm`、`group` 或 `all`）。

    相关文档：[Exec 审批](/tools/exec-approvals)

  </Accordion>

  <Accordion title="来自 Telegram 事件和命令的配置写入">
    频道配置写入默认启用（`configWrites !== false`）。

    Telegram 触发的写入包括：

    - 群组迁移事件（`migrate_to_chat_id`）以更新 `channels.telegram.groups`
    - `/config set` 和 `/config unset`（需要命令启用）

    禁用：

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="长轮询 vs webhook">
    默认：长轮询。

    Webhook 模式：

    - 设置 `channels.telegram.webhookUrl`
    - 设置 `channels.telegram.webhookSecret`（当设置了 webhook URL 时必填）
    - 可选 `channels.telegram.webhookPath`（默认 `/telegram-webhook`）
    - 可选 `channels.telegram.webhookHost`（默认 `127.0.0.1`）
    - 可选 `channels.telegram.webhookPort`（默认 `8787`）

    Webhook 模式的默认本地监听器绑定到 `127.0.0.1:8787`。对于公共入口，可以在本地端口前面放置反向代理，或故意设置 `webhookHost: "0.0.0.0"`。

    Webhook 模式在返回 `200` 给 Telegram 之前会验证请求守卫、Telegram 密钥 token 和 JSON 主体。OpenClaw 然后通过与长轮询相同的每聊天/每主题 bot 通道异步处理更新，因此缓慢的 agent 轮次不会占用 Telegram 的传递 ACK。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认为 4000。
    - `channels.telegram.chunkMode="newline"` 在长度分割之前优先考虑段落边界（空行）。
    - `channels.telegram.mediaMaxMb`（默认 100）限制入站和出站 Telegram 媒体大小。
    - `channels.telegram.timeoutSeconds` 覆盖 Telegram API 客户端超时（如果未设置，使用 grammY 默认值）。
    - `channels.telegram.pollingStallThresholdMs` 默认为 `120000`；仅当长时间运行的 `getUpdates` 调用正常但主机仍然报告误报轮询停滞重启时，才在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 禁用。
    - 私信历史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - 出站 Telegram API 重试可通过 `channels.telegram.retry` 配置。

    CLI 发送目标可以是数字聊天 ID 或用户名：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram 轮询使用 `openclaw message poll` 并支持论坛主题：

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    仅 Telegram 的轮询标志：

    - `--poll-duration-seconds`（5-600）
    - `--poll-anonymous`
    - `--poll-public`
    - `--thread-id` 用于论坛主题（或使用 `:topic:` 目标）

    Telegram 发送还支持：

    - `--presentation` 配合 `buttons` 块，当 `channels.telegram.capabilities.inlineButtons` 允许时用于内联键盘
    - `--pin` 或 `--delivery '{"pin":true}'`，当 bot 在该聊天中有置顶权限时请求置顶传递
    - `--force-document` 将出站图片和 GIF 作为文档发送，而非压缩照片或动画媒体上传

    操作门控：

    - `channels.telegram.actions.sendMessage=false` 禁用出站 Telegram 消息，包括轮询
    - `channels.telegram.actions.poll=false` 禁用 Telegram 轮询创建，同时保留常规发送

  </Accordion>
</AccordionGroup>

## 错误回复控制

当 Agent 遇到传递或 Provider 错误时，Telegram 可以回复错误文本或抑制错误。两个配置键控制此行为：

| 键                                  | 值                | 默认值  | 描述                                                                                       |
| ----------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`、`silent` | `reply` | `reply` 向聊天发送友好的错误消息。`silent` 完全抑制错误回复。                             |
| `channels.telegram.errorCooldownMs` | 数字（毫秒）      | `60000` | 向同一聊天发送错误回复之间的最短间隔时间。防止服务中断时的错误轰炸。                      |

支持每账户、每群组和每主题覆盖（与其他 Telegram 配置键相同的继承方式）。

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // 在此群组中抑制错误
        },
      },
    },
  },
}
```

## 故障排除

<AccordionGroup>
  <Accordion title="Bot 不响应群组中的非提及消息">

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完整可见性。
      - BotFather：`/setprivacy` -> Disable
      - 然后从群组中移除并重新添加 bot
    - 当配置期望未提及的群组消息时，`openclaw channels status` 会发出警告。
    - `openclaw channels status --probe` 可以检查显式数字群组 ID；通配符 `"*"` 无法进行成员资格探测。
    - 快速会话测试：`/activation always`。

  </Accordion>

  <Accordion title="Bot 完全看不到群组消息">

    - 当 `channels.telegram.groups` 存在时，群组必须被列出（或包含 `"*"`）
    - 验证 bot 在群组中的成员资格
    - 查看日志：`openclaw logs --follow` 了解跳过原因

  </Accordion>

  <Accordion title="命令部分工作或完全不工作">

    - 授权您的发送者身份（配对和/或数字 `allowFrom`）
    - 即使群组策略为 `open`，命令授权仍然适用
    - `setMyCommands failed` 带 `BOT_COMMANDS_TOO_MUCH` 表示原生菜单条目过多；减少插件/技能/自定义命令或禁用原生菜单
    - `setMyCommands failed` 带网络/fetch 错误通常表示到 `api.telegram.org` 的 DNS/HTTPS 可达性问题

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ + 自定义 fetch/代理如果 AbortSignal 类型不匹配可能触发立即中止行为。
    - 一些主机首先将 `api.telegram.org` 解析为 IPv6；损坏的 IPv6 出口可能导致间歇性的 Telegram API 失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在将这些作为可恢复的网络错误重试。
    - 如果日志包含 `Polling stall detected`，OpenClaw 在默认 120 秒内没有完成长轮询存活检查后重启轮询并重建 Telegram 传输。
    - 仅当长时间运行的 `getUpdates` 调用正常但主机仍然报告误报轮询停滞重启时，才增大 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向主机与 `api.telegram.org` 之间的代理、DNS、IPv6 或 TLS 出口问题。
    - 在出口/TLS 不稳定的 VPS 主机上，通过 `channels.telegram.proxy` 路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://user:pass@proxy-host:1080
```

    - Node 22+ 默认 `autoSelectFamily=true`（WSL2 除外）和 `dnsResultOrder=ipv4first`。
    - 如果您的主机是 WSL2 或明确在仅 IPv4 行为下工作更好，强制家族选择：

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 基准范围响应（`198.18.0.0/15`）默认已对 Telegram 媒体下载放行。如果受信任的假 IP 或透明代理在媒体下载期间将 `api.telegram.org` 改写为其他私有/内部/特殊用途地址，您可以选择启用仅 Telegram 的绕过：

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - 同样的选项也可按账户设置：
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`。
    - 如果您的代理将 Telegram 媒体主机解析到 `198.18.x.x`，请先关闭危险标志。Telegram 媒体默认已允许 RFC 2544 基准范围。

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork` 会削弱 Telegram 媒体的 SSRF 保护。仅在受运营者信任控制的代理环境（如 Clash、Mihomo 或 Surge 假 IP 路由）中使用，且仅当它们将 Telegram 媒体主机解析为 RFC 2544 基准范围之外的私有或特殊用途地址时。正常公网 Telegram 访问请勿启用。
    </Warning>

    - 环境覆盖（临时）：
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - 验证 DNS 答案：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

更多帮助：[频道故障排除](/channels/troubleshooting)。

## 配置参考

主要参考：[配置参考 - Telegram](/gateway/config-channels#telegram)。

<Accordion title="Telegram 高优先级字段">

- 启动/认证：`enabled`、`botToken`、`tokenFile`、`accounts.*`（`tokenFile` 必须指向普通文件；符号链接被拒绝）
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`、顶层 `bindings[]`（`type: "acp"`）
- exec 审批：`execApprovals`、`accounts.*.execApprovals`
- 命令/菜单：`commands.native`、`commands.nativeSkills`、`customCommands`
- 线程/回复：`replyToMode`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式化/传递：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 操作/功能：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- reaction：`reactionNotifications`、`reactionLevel`
- 错误：`errorPolicy`、`errorCooldownMs`
- 写入/历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

</Accordion>

<Note>
多账户优先级：当配置了两个或更多账户 ID 时，设置 `channels.telegram.defaultAccount`（或包含 `channels.telegram.accounts.default`）以使默认路由明确。否则 OpenClaw 回退到第一个规范化账户 ID 且 `openclaw doctor` 会发出警告。命名账户继承 `channels.telegram.allowFrom` / `groupAllowFrom`，但不继承 `accounts.default.*` 的值。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    将 Telegram 用户配对到 Gateway。
  </Card>
  <Card title="Groups" icon="users" href="/channels/groups">
    群组和主题 allowlist 行为。
  </Card>
  <Card title="Channel 路由" icon="route" href="/channels/channel-routing">
    将入站消息路由到 Agent。
  </Card>
  <Card title="Security" icon="shield" href="/gateway/security">
    威胁模型和安全加固。
  </Card>
  <Card title="多 Agent 路由" icon="sitemap" href="/concepts/multi-agent">
    将群组和主题映射到 Agent。
  </Card>
  <Card title="故障排除" icon="wrench" href="/channels/troubleshooting">
    跨频道诊断。
  </Card>
</CardGroup>
