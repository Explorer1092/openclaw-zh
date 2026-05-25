---
mmh3_hash: "c59c48bb8dec662c82693050e159bb2d"
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
    将 bot 添加到您的群组，然后获取群组访问所需的两个 ID：

    - 您的 Telegram 用户 ID，用于 `allowFrom` / `groupAllowFrom`
    - Telegram 群组聊天 ID，用作 `channels.telegram.groups` 下的键

    首次设置时，从 `openclaw logs --follow`、转发 ID bot 或 Bot API `getUpdates` 获取群组聊天 ID。群组被允许后，`/whoami@<bot_username>` 可以确认用户和群组 ID。

    以 `-100` 开头的负数 Telegram 超级群组 ID 是群组聊天 ID。将它们放在 `channels.telegram.groups` 下，而不是 `groupAllowFrom` 下。

  </Step>
</Steps>

<Note>
Token 解析顺序为账户感知。实际上，配置值优先于环境变量回退，`TELEGRAM_BOT_TOKEN` 仅适用于默认账户。
启动成功后，OpenClaw 将 bot 身份缓存在状态目录中最多 24 小时，以便重启时避免额外的 Telegram `getMe` 调用；更改或删除 token 会清除该缓存。
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

    `dmPolicy: "open"` 配合 `allowFrom: ["*"]` 让任何找到或猜到 bot 用户名的 Telegram 账户都可以控制 bot。仅对有意公开的 bot 使用，且工具需严格限制；单用户 bot 应使用带数字用户 ID 的 `allowlist`。

    `channels.telegram.allowFrom` 接受数字 Telegram 用户 ID。`telegram:` / `tg:` 前缀被接受并规范化。
    在多账户配置中，限制性的顶层 `channels.telegram.allowFrom` 被视为安全边界：账户级 `allowFrom: ["*"]` 条目不会使该账户公开，除非合并后的有效账户 allowlist 仍包含显式通配符。
    `dmPolicy: "allowlist"` 时空的 `allowFrom` 会阻止所有私信，且会被配置验证拒绝。
    设置向导仅接受数字用户 ID。
    如果您升级后配置中含有 `@username` allowlist 条目，运行 `openclaw doctor --fix` 解析它们（尽力而为；需要 Telegram bot token）。
    如果之前依赖配对存储 allowlist 文件，`openclaw doctor --fix` 可以在 allowlist 迁移流程中将条目恢复到 `channels.telegram.allowFrom`（例如当 `dmPolicy: "allowlist"` 尚无显式 ID 时）。

    对于单用户 bot，推荐使用 `dmPolicy: "allowlist"` 配合显式数字 `allowFrom` ID，以便将访问策略持久化在配置中（而不是依赖之前的配对审批）。

    常见误解：DM 配对批准不等于"此发送者在所有地方都已授权"。配对仅授予 DM 访问权限。如果尚无命令 owner，第一个批准的配对还会设置 `commands.ownerAllowFrom`，使 owner 独占命令和 exec 审批拥有显式运营者账户。群组发送者授权仍然来自显式配置 allowlist。如果您希望"我已授权一次，DM 和群组命令均可使用"，请将您的数字 Telegram 用户 ID 放在 `channels.telegram.allowFrom` 中；对于 owner 独占命令，请确保 `commands.ownerAllowFrom` 包含 `telegram:<您的用户 ID>`。

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

    `groupAllowFrom` 用于群组发送者过滤。如果未设置，Telegram 回退到配置 `allowFrom`，而不是配对存储。
    `groupAllowFrom` 条目应使用数字 Telegram 用户 ID（`telegram:` / `tg:` 前缀被规范化）。
    不要将 Telegram 群组或超级群组的聊天 ID 放在 `groupAllowFrom` 中。负数聊天 ID 应放在 `channels.telegram.groups` 下。
    非数字条目在发送者授权时被忽略。
    安全边界（`2026.2.25+`）：群组发送者授权**不**继承 DM 配对存储批准。配对仅用于 DM。对于群组，请设置 `groupAllowFrom` 或每群组/每主题 `allowFrom`。
    单用户 bot 的实用模式：将您的用户 ID 放在 `channels.telegram.allowFrom` 中，不设置 `groupAllowFrom`，并在 `channels.telegram.groups` 下允许目标群组。
    运行时注意：如果 `channels.telegram` 完全缺失，运行时会回退到失败关闭的 `groupPolicy="allowlist"`，除非 `channels.defaults.groupPolicy` 已明确设置。

    单用户群组设置：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    从群组中使用 `@<bot_username> ping` 测试。`requireMention: true` 时，普通群组消息不会触发 bot。

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
    - 群组被允许后，如果启用了原生命令，运行 `/whoami@<bot_username>` 可以确认用户和群组 ID

  </Tab>
</Tabs>

## 运行时行为

- Telegram 由 gateway 进程拥有。
- 路由是确定性的：Telegram 入站消息回复到 Telegram（模型不选择频道）。
- 入站消息规范化为共享频道信封，包含回复元数据、媒体占位符和 Gateway 已观察到的 Telegram 回复的持久化回复链上下文。
- 群组会话按群组 ID 隔离。论坛主题附加 `:topic:<threadId>` 保持主题隔离。
- 私信消息可以携带 `message_thread_id`；默认情况下 OpenClaw 保留线程 ID 用于回复但将私信保持在平坦会话上。当您有意希望私信主题会话隔离时，配置 `channels.telegram.dm.threadReplies: "inbound"`、`channels.telegram.direct.<chatId>.threadReplies: "inbound"`、`requireTopic: true` 或匹配的主题配置。
- 长轮询使用 grammY runner，按聊天/线程顺序处理。总并发由 `agents.defaults.maxConcurrent` 控制。
- 多账户启动会限制并发 Telegram `getMe` 探测，使大型 bot 集群不会同时扇出所有账户探测。
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
    - `progress` 为工具进度保留一个可编辑的状态草稿，完成时清除，并将最终答案作为普通消息发送
    - `streaming.preview.toolProgress` 控制工具/进度更新是否复用同一已编辑的预览消息（默认：当预览流式传输启动时为 `true`）
    - `streaming.preview.commandText` 控制工具进度行内的命令/exec 详情：`raw`（默认，保留已发布行为）或 `status`（仅显示工具标签）
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

    保留工具进度可见但隐藏命令/exec 文本，设置：

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    当您希望工具进度可见但不将最终答案编辑到同一消息时，使用 `progress` 模式。在 `streaming.progress` 下设置命令文本策略：

    ```json
    {
      "channels": {
        "telegram": {
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

    仅当您希望最终只传递时才使用 `streaming.mode: "off"`：Telegram 预览编辑被禁用，通用工具/进度消息被抑制而不是作为独立状态消息发送。审批提示、媒体负载和错误仍通过正常最终传递路由。仅禁用工具进度状态行时，使用 `streaming.preview.toolProgress: false`。

    <Note>
      Telegram 选中引文回复是例外。当 `replyToMode` 为 `"first"`、`"all"` 或 `"batched"` 且入站消息包含选中引文文本时，OpenClaw 通过 Telegram 的原生引文回复路径发送最终答案，而不是编辑答案预览，因此 `streaming.preview.toolProgress` 无法在该轮次中显示简短状态行。没有选中引文文本的当前消息回复仍保留预览流式传输。当工具进度可见性比原生引文回复更重要时设置 `replyToMode: "off"`，或设置 `streaming.preview.toolProgress: false` 来认可这个权衡。
    </Note>

    对于纯文本回复：

    - 较短的私信/群组/主题预览：OpenClaw 保留相同的预览消息并在原地进行最终编辑
    - 约一分钟前创建的预览：OpenClaw 以新的最终消息发送完成的回复，然后清理预览，使 Telegram 的可见时间戳反映完成时间而非预览创建时间

    对于复杂回复（例如媒体负载），OpenClaw 回退到正常最终传递，然后清理预览消息。

    预览流式传输与块流式传输分离。当为 Telegram 显式启用块流式传输时，OpenClaw 跳过预览流以避免双重流式传输。

    仅 Telegram 的推理流：

    - `/reasoning stream` 在生成时将推理发送到实时预览
    - 推理预览在最终传递后删除；当推理应保持可见时使用 `/reasoning on`
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
    - `deleteWebhook`、`deleteMyCommands` 或 `setMyCommands` 在直接 Bot API curl 命令正常工作时失败并返回 `404: Not Found`，可能意味着 `channels.telegram.apiRoot` 被设置为完整的 `/bot<TOKEN>` 端点。`apiRoot` 必须只是 Bot API 根目录，`openclaw doctor --fix` 会删除意外的尾部 `/bot<TOKEN>`。
    - `getMe returned 401` 表示 Telegram 拒绝了配置的 bot token。在 BotFather 中更新 `botToken`、`tokenFile` 或 `TELEGRAM_BOT_TOKEN`；OpenClaw 在轮询前停止，因此这不会作为 webhook 清理失败报告。
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

    设置码携带一个短期引导 token。内置引导切换将主节点 token 保持在 `scopes: []`；任何切换的运营者 token 仍然限定在 `operator.approvals`、`operator.read`、`operator.talk.secrets` 和 `operator.write`。引导范围检查带有角色前缀，因此该运营者 allowlist 只满足运营者请求；非运营者角色仍需要在自己的角色前缀下的范围。

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

    **持久化 ACP 主题绑定**：论坛主题可以通过顶层类型化 ACP 绑定（`bindings[]` 中使用 `type: "acp"`、`match.channel: "telegram"`、`peer.kind: "group"` 和主题限定 ID 如 `-1001234567890:topic:42`）固定 ACP 会话。目前仅限于群组/超级群组中的论坛主题。参见 [ACP Agents](/tools/acp-agents)。

    示例：

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

    **从聊天生成线程绑定 ACP**：`/acp spawn <agent> --thread here|auto` 将当前主题绑定到新的 ACP 会话；后续消息直接路由到该会话。OpenClaw 在主题内固定生成确认消息。需要 `channels.telegram.threadBindings.spawnSessions` 保持启用（默认：`true`）。

    模板上下文暴露 `MessageThreadId` 和 `IsForum`。含 `message_thread_id` 的私信默认保持私信路由和平坦会话上的回复元数据；仅在以下情况使用线程感知会话键：配置了 `threadReplies: "inbound"`、`threadReplies: "always"`、`requireTopic: true` 或匹配的主题配置。对账户默认使用顶层 `channels.telegram.dm.threadReplies`，对单个私信使用 `direct.<chatId>.threadReplies`。

  </Accordion>

  <Accordion title="音频、视频和贴纸">
    ### 音频消息

    Telegram 区分语音笔记和音频文件。

    - 默认：音频文件行为
    - 在 agent 回复中添加 `[[audio_as_voice]]` 标签强制使用语音笔记发送
    - 入站语音笔记转录在 agent 上下文中被标记为机器生成的不可信文本；提及检测仍使用原始转录，因此提及门控的语音消息继续有效

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
    默认使用长轮询。对于 webhook 模式，设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`；可选 `webhookPath`、`webhookHost`、`webhookPort`（默认 `/telegram-webhook`、`127.0.0.1`、`8787`）。

    在长轮询模式下，OpenClaw 仅在更新成功派发后才持久化重启水印。如果处理器失败，该更新在同一进程中仍可重试，不会被写入为已完成以用于重启去重。

    本地监听器绑定到 `127.0.0.1:8787`。对于公共入口，在本地端口前放置反向代理，或故意设置 `webhookHost: "0.0.0.0"`。

    Webhook 模式在返回 `200` 给 Telegram 之前会验证请求守卫、Telegram 密钥 token 和 JSON 主体。OpenClaw 然后通过与长轮询相同的每聊天/每主题 bot 通道异步处理更新，因此缓慢的 agent 轮次不会占用 Telegram 的传递 ACK。

  </Accordion>

  <Accordion title="限制、重试和 CLI 目标">
    - `channels.telegram.textChunkLimit` 默认为 4000。
    - `channels.telegram.chunkMode="newline"` 在长度分割之前优先考虑段落边界（空行）。
    - `channels.telegram.mediaMaxMb`（默认 100）限制入站和出站 Telegram 媒体大小。
    - `channels.telegram.mediaGroupFlushMs`（默认 500）控制 Telegram 相册/媒体组在 OpenClaw 将其作为一条入站消息派发之前的缓冲时间。如果相册部分到达较晚则增大；如果要减少相册回复延迟则减小。
    - `channels.telegram.timeoutSeconds` 覆盖 Telegram API 客户端超时（如果未设置，使用 grammY 默认值）。Bot 客户端将配置值限制在 60 秒出站文本/输入请求守卫以下，以避免 grammY 在 OpenClaw 的传输守卫和回退运行之前中止可见的回复传递。长轮询仍使用 45 秒 `getUpdates` 请求守卫，以避免空闲轮询无限期被放弃。
    - `channels.telegram.pollingStallThresholdMs` 默认为 `120000`；仅在误报轮询停滞重启时在 `30000` 到 `600000` 之间调整。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 禁用。
    - 私信历史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` 配置适用于 Telegram 发送助手（CLI/工具/操作）的可恢复出站 API 错误。

    CLI 和消息工具发送目标可以是数字聊天 ID、用户名或论坛主题目标：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
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
    - `deleteMyCommands`、`setMyCommands` 启动调用和 `sendChatAction` 输入调用是有界的，并在请求超时时通过 Telegram 的传输回退重试一次。持续的网络/fetch 错误通常表示到 `api.telegram.org` 的 DNS/HTTPS 可达性问题

  </Accordion>

  <Accordion title="启动报告 token 未授权">

    - `getMe returned 401` 是 Telegram 对配置的 bot token 的认证失败。
    - 在 BotFather 中重新复制或重新生成 bot token，然后更新 `channels.telegram.botToken`、`channels.telegram.tokenFile`、`channels.telegram.accounts.<id>.botToken` 或默认账户的 `TELEGRAM_BOT_TOKEN`。
    - 启动期间的 `deleteWebhook 401 Unauthorized` 也是认证失败；将其视为"没有 webhook 存在"只会将相同的 token 失败推迟到后续 API 调用。

  </Accordion>

  <Accordion title="轮询或网络不稳定">

    - Node 22+ + 自定义 fetch/代理如果 AbortSignal 类型不匹配可能触发立即中止行为。
    - 一些主机首先将 `api.telegram.org` 解析为 IPv6；损坏的 IPv6 出口可能导致间歇性的 Telegram API 失败。
    - 如果日志包含 `TypeError: fetch failed` 或 `Network request for 'getUpdates' failed!`，OpenClaw 现在将这些作为可恢复的网络错误重试。
    - 轮询启动期间，OpenClaw 将成功的启动 `getMe` 探测复用给 grammY，以避免 runner 在第一次 `getUpdates` 之前需要第二次 `getMe`。
    - 如果 `deleteWebhook` 在轮询启动期间因瞬态网络错误失败，OpenClaw 继续进入长轮询而不是再次进行控制平面调用。仍然活跃的 webhook 会以 `getUpdates` 冲突的形式出现；OpenClaw 然后重建 Telegram 传输并重试 webhook 清理。
    - 如果 Telegram socket 以固定的短周期回收，检查是否设置了较低的 `channels.telegram.timeoutSeconds`；bot 客户端将配置值限制在出站和 `getUpdates` 请求守卫以下，但旧版本在设置低于这些守卫时可能会在每次轮询或回复时中止。
    - 如果日志包含 `Polling stall detected`，OpenClaw 在默认 120 秒内没有完成长轮询存活检查后重启轮询并重建 Telegram 传输。
    - `openclaw channels status --probe` 和 `openclaw doctor` 在以下情况发出警告：运行中的轮询账户在启动宽限期后未完成 `getUpdates`、运行中的 webhook 账户在启动宽限期后未完成 `setWebhook`，或最后一次成功的轮询传输活动已过期。
    - 仅当长时间运行的 `getUpdates` 调用正常但主机仍然报告误报轮询停滞重启时，才增大 `channels.telegram.pollingStallThresholdMs`。持续停滞通常指向主机与 `api.telegram.org` 之间的代理、DNS、IPv6 或 TLS 出口问题。
    - Telegram 还遵守进程代理环境变量用于 Bot API 传输，包括 `HTTP_PROXY`、`HTTPS_PROXY`、`ALL_PROXY` 及其小写变体。`NO_PROXY` / `no_proxy` 仍可绕过 `api.telegram.org`。
    - 如果通过 `OPENCLAW_PROXY_URL` 为服务环境配置了 OpenClaw 托管代理且没有标准代理环境变量，Telegram 也会将该 URL 用于 Bot API 传输。
    - 在出口/TLS 不稳定的 VPS 主机上，通过 `channels.telegram.proxy` 路由 Telegram API 调用：

```yaml
channels:
  telegram:
    proxy: socks5://user:pass@proxy-host:1080
```

    - Node 22+ 默认 `autoSelectFamily=true`（WSL2 除外）。Telegram DNS 结果顺序遵循 `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`，然后是 `channels.telegram.network.dnsResultOrder`，然后是进程默认值（如 `NODE_OPTIONS=--dns-result-order=ipv4first`）；如果均未设置，Node 22+ 回退到 `ipv4first`。
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
- 线程/回复：`replyToMode`、`dm.threadReplies`、`direct.*.threadReplies`
- 流式传输：`streaming`（预览）、`streaming.preview.toolProgress`、`blockStreaming`
- 格式化/传递：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`mediaGroupFlushMs`、`timeoutSeconds`、`pollingStallThresholdMs`、`retry`、`network.autoSelectFamily`、`network.dangerouslyAllowPrivateNetwork`、`proxy`
- 自定义 API 根：`apiRoot`（仅 Bot API 根目录；不要包含 `/bot<TOKEN>`）
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
