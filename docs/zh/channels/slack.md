---
mmh3_hash: "38d01c5ec672640f1994c0e49f596172"
summary: "Slack setup and runtime behavior (Socket Mode + HTTP Events API)"
read_when:
  - 设置 Slack 或调试 Slack socket/HTTP 模式
title: "Slack"
---

# Slack

状态：通过 Slack 应用集成支持私信 + Channel，生产环境可用。默认模式为 Socket Mode；同时支持 HTTP Events API 模式。

<CardGroup cols={3}>
  <Card title="配对" icon="link" href="/channels/pairing">
    Slack 私信默认使用配对模式。
  </Card>
  <Card title="Slash 命令" icon="terminal" href="/tools/slash-commands">
    原生命令行为和命令目录。
  </Card>
  <Card title="Channel 故障排除" icon="wrench" href="/channels/troubleshooting">
    跨 Channel 诊断和修复手册。
  </Card>
</CardGroup>

## 快速设置

<Tabs>
  <Tab title="Socket Mode（默认）">
    <Steps>
      <Step title="创建 Slack 应用和 token">
        在 Slack 应用设置中：

        - 启用 **Socket Mode**
        - 创建 **App Token**（`xapp-...`）并授予 `connections:write` 权限
        - 安装应用并复制 **Bot Token**（`xoxb-...`）
      </Step>

      <Step title="配置 OpenClaw">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        环境变量回退（仅默认账户）：

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="订阅应用事件">
        订阅 bot 事件：

        - `app_mention`
        - `message.channels`, `message.groups`, `message.im`, `message.mpim`
        - `reaction_added`, `reaction_removed`
        - `member_joined_channel`, `member_left_channel`
        - `channel_rename`
        - `pin_added`, `pin_removed`

        同时启用 App Home 的 **Messages Tab** 以支持私信。
      </Step>

      <Step title="启动 Gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Events API 模式">
    <Steps>
      <Step title="为 HTTP 配置 Slack 应用">

        - 设置模式为 HTTP（`channels.slack.mode="http"`）
        - 复制 Slack **Signing Secret**
        - 将 Event Subscriptions + Interactivity + Slash command Request URL 设置为同一个 Webhook 路径（默认 `/slack/events`）

      </Step>

      <Step title="配置 OpenClaw HTTP 模式">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```

      </Step>

      <Step title="多账户 HTTP 使用唯一 Webhook 路径">
        支持按账户的 HTTP 模式。

        为每个账户提供不同的 `webhookPath` 以避免注册冲突。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Token 模型

- Socket Mode 需要 `botToken` + `appToken`。
- HTTP 模式需要 `botToken` + `signingSecret`。
- 配置中的 token 会覆盖环境变量回退。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账户。
- `userToken`（`xoxp-...`）仅在配置中设置（无环境变量回退）且默认为只读行为（`userTokenReadOnly: true`）。
- 可选：添加 `chat:write.customize` 权限以使出站消息使用活动 Agent 身份（自定义 `username` 和图标）。`icon_emoji` 使用 `:emoji_name:` 语法。

<Tip>
对于操作/目录读取，配置了 user token 时可以优先使用。对于写入，bot token 仍然优先；仅当 `userTokenReadOnly: false` 且 bot token 不可用时才允许 user-token 写入。
</Tip>

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.slack.dmPolicy` 控制私信访问（旧版：`channels.slack.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `channels.slack.allowFrom` 包含 `"*"`；旧版：`channels.slack.dm.allowFrom`）
    - `disabled`

    私信标志：

    - `dm.enabled`（默认 true）
    - `channels.slack.allowFrom`（推荐）
    - `dm.allowFrom`（旧版）
    - `dm.groupEnabled`（群组私信默认 false）
    - `dm.groupChannels`（可选 MPIM allowlist）

    多账户优先级：

    - `channels.slack.accounts.default.allowFrom` 仅适用于 `default` 账户。
    - 命名账户在未设置自身 `allowFrom` 时继承 `channels.slack.allowFrom`。
    - 命名账户不继承 `channels.slack.accounts.default.allowFrom`。

    私信配对使用 `openclaw pairing approve slack <code>`。

  </Tab>

  <Tab title="Channel 策略">
    `channels.slack.groupPolicy` 控制 Channel 处理：

    - `open`
    - `allowlist`
    - `disabled`

    Channel allowlist 位于 `channels.slack.channels`，应使用稳定的 Channel ID。

    运行时注意：如果完全没有 `channels.slack`（仅环境变量设置），运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    名称/ID 解析：

    - 在启动时解析 Channel allowlist 条目和私信 allowlist 条目（当 token 访问允许时）
    - 未解析的 Channel 名称条目保持配置状态，但默认情况下路由时被忽略
    - 入站授权和 Channel 路由默认以 ID 为优先；直接 username/slug 匹配需要 `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="提及和 Channel 用户">
    Channel 消息默认需要提及才能触发。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 提及正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退到 `messages.groupChat.mentionPatterns`）
    - 隐式回复-bot-线程行为

    按 Channel 控制（`channels.slack.channels.<id>`；名称仅通过启动解析或 `dangerouslyAllowNameMatching`）：

    - `requireMention`
    - `users`（allowlist）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - `toolsBySender` 键格式：`id:`、`e164:`、`username:`、`name:` 或 `"*"` 通配符
      （旧版无前缀键仍映射到 `id:` 匹配）

  </Tab>
</Tabs>

## 命令和 slash 行为

- Slack 的原生命令自动模式默认**关闭**（`commands.native: "auto"` 不会启用 Slack 原生命令）。
- 使用 `channels.slack.commands.native: true`（或全局 `commands.native: true`）启用原生 Slack 命令处理器。
- 当原生命令启用时，在 Slack 中注册匹配的 slash 命令（`/<command>` 名称），但有一个例外：
  - 为 status 命令注册 `/agentstatus`（Slack 保留了 `/status`）
- 如果未启用原生命令，您可以通过 `channels.slack.slashCommand` 运行单个配置的 slash 命令。
- 原生参数菜单现在会自适应渲染策略：
  - 最多 5 个选项：按钮块
  - 6-100 个选项：静态选择菜单
  - 超过 100 个选项：当 interactivity 选项处理器可用时使用带异步选项过滤的外部选择
  - 如果编码的选项值超过 Slack 限制，回退到按钮
- 对于长选项负载，Slash 命令参数菜单在派发所选值之前使用确认对话框。

## 交互式回复

Slack 可以渲染 Agent 编写的交互式回复控件，但此功能默认禁用。

全局启用：

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

或仅为一个 Slack 账户启用：

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

启用后，Agent 可以发出 Slack 专用回复指令：

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

这些指令编译为 Slack Block Kit，并将点击或选择路由回现有的 Slack 交互事件路径。

注意：

- 这是 Slack 专用 UI。其他 Channel 不会将 Slack Block Kit 指令转换为自己的按钮系统。
- 交互式回调值是 OpenClaw 生成的不透明 token，而不是 Agent 编写的原始值。
- 如果生成的交互式块会超过 Slack Block Kit 限制，OpenClaw 会回退到原始文本回复，而不是发送无效的 blocks 负载。

默认 slash 命令设置：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

Slash Session 使用隔离的键：

- `agent:<agentId>:slack:slash:<userId>`

并仍然针对目标对话 Session 路由命令执行（`CommandTargetSessionKey`）。

## 线程、Session 和回复标签

- 私信路由为 `direct`；Channel 路由为 `channel`；MPIM 路由为 `group`。
- 使用默认 `session.dmScope=main` 时，Slack 私信合并到 Agent 主 Session。
- Channel Session：`agent:<agentId>:slack:channel:<channelId>`。
- 线程回复可以在适用时创建线程 Session 后缀（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认为 `thread`；`thread.inheritParent` 默认为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程 Session 启动时获取多少现有线程消息（默认 `20`；设置 `0` 禁用）。

回复线程控制：

- `channels.slack.replyToMode`：`off|first|all`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 设置
- 私聊的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注意：`replyToMode="off"` 禁用 Slack 中**所有**回复线程，包括显式 `[[reply_to_*]]` 标签。这与 Telegram 不同，在 Telegram 中显式标签在 `"off"` 模式下仍然有效。差异反映了平台线程模型的不同：Slack 线程会将消息从 Channel 中隐藏，而 Telegram 回复在主聊天流中仍然可见。

## 媒体、分块和传递

<AccordionGroup>
  <Accordion title="入站附件">
    Slack 文件附件从 Slack 托管的私有 URL 下载（token 认证请求流）并在获取成功且大小限制允许时写入媒体存储。

    运行时入站大小上限默认为 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  </Accordion>

  <Accordion title="出站文本和文件">
    - 文本块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用段落优先分割
    - 文件发送使用 Slack 上传 API 且可以包含线程回复（`thread_ts`）
    - 出站媒体上限遵循配置的 `channels.slack.mediaMaxMb`；否则 Channel 发送使用媒体管道的 MIME 类型默认值
  </Accordion>

  <Accordion title="传递目标">
    推荐的显式目标：

    - `user:<id>` 用于私信
    - `channel:<id>` 用于 Channel

    发送到用户目标时，Slack 私信通过 Slack conversation API 打开。

  </Accordion>
</AccordionGroup>

## 操作和门控

Slack 操作通过 `channels.slack.actions.*` 控制。

当前 Slack 工具中可用的操作组：

| 组 | 默认 |
| --- | --- |
| messages | 启用 |
| reactions | 启用 |
| pins | 启用 |
| memberInfo | 启用 |
| emojiList | 启用 |

## 事件和操作行为

- 消息编辑/删除/线程广播映射到系统事件。
- 反应添加/移除事件映射到系统事件。
- 成员加入/离开、Channel 创建/重命名、置顶添加/移除事件映射到系统事件。
- 助手线程状态更新（线程中的"正在输入..."指示器）使用 `assistant.threads.setStatus`，需要 bot 权限 `assistant:write`。
- `channel_id_changed` 可以在 `configWrites` 启用时迁移 Channel 配置键。
- Channel 主题/目的元数据被视为不可信上下文，可以注入到路由上下文中。
- Block actions 和 modal 交互会触发结构化的 `Slack interaction: ...` 系统事件，包含丰富的负载字段：
  - block actions：所选值、标签、选择器值和 `workflow_*` 元数据
  - modal `view_submission` 和 `view_closed` 事件，包含路由 Channel 元数据和表单输入

## 确认反应

`ackReaction` 在 OpenClaw 处理入站消息时发送确认表情符号。

解析顺序：

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Agent 身份表情符号回退（`agents.list[].identity.emoji`，否则 "👀"）

注意：

- Slack 期望 shortcode（例如 `"eyes"`）。
- 使用 `""` 禁用 Channel 或账户的反应。

## 输入反应回退

`typingReaction` 在 OpenClaw 处理回复时，向入站 Slack 消息添加临时反应，运行完成后再移除该反应。这是 Slack 原生 assistant 输入不可用时（尤其在私信中）的有效备选方案。

解析顺序：

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

注意：

- Slack 期望 shortcode（例如 `"hourglass_flowing_sand"`）。
- 反应是尽力而为的，回复或失败路径完成后会自动尝试清理。

## Manifest 和权限检查清单

<AccordionGroup>
  <Accordion title="Slack 应用 manifest 示例">

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
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "users:read",
        "app_mentions:read",
        "assistant:write",
        "reactions:read",
        "reactions:write",
        "pins:read",
        "pins:write",
        "emoji:read",
        "commands",
        "files:read",
        "files:write"
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

  </Accordion>

  <Accordion title="可选 user-token 权限（读取操作）">
    如果配置了 `channels.slack.userToken`，典型的读取权限为：

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（如果依赖 Slack 搜索读取）

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="Channel 中没有回复">
    按顺序检查：

    - `groupPolicy`
    - Channel allowlist（`channels.slack.channels`）
    - `requireMention`
    - 按 Channel `users` allowlist

    有用的命令：

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="私信被忽略">
    检查：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（或旧版 `channels.slack.dm.policy`）
    - 配对批准 / allowlist 条目

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket 模式未连接">
    验证 bot + app token 以及 Slack 应用设置中的 Socket Mode 启用状态。
  </Accordion>

  <Accordion title="HTTP 模式未接收事件">
    验证：

    - signing secret
    - Webhook 路径
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账户唯一的 `webhookPath`

  </Accordion>

  <Accordion title="原生/slash 命令未触发">
    验证您是否想要：

    - 原生命令模式（`channels.slack.commands.native: true`）并在 Slack 中注册匹配的 slash 命令
    - 或单个 slash 命令模式（`channels.slack.slashCommand.enabled: true`）

    同时检查 `commands.useAccessGroups` 和 Channel/用户 allowlist。

  </Accordion>
</AccordionGroup>

## 文本流式传输

OpenClaw 通过 Agents and AI Apps API 支持 Slack 原生文本流式传输。

`channels.slack.streaming` 控制实时预览行为：

- `off`：禁用实时预览流式传输。
- `partial`（默认）：用最新的部分输出替换预览文本。
- `block`：以分块预览更新追加。
- `progress`：生成时显示进度状态文本，然后发送最终文本。

`channels.slack.nativeStreaming` 控制 Slack 的原生流式传输 API（`chat.startStream` / `chat.appendStream` / `chat.stopStream`），当 `streaming` 为 `partial` 时使用（默认：`true`）。

禁用 Slack 原生流式传输（保留草稿预览行为）：

```yaml
channels:
  slack:
    streaming: partial
    nativeStreaming: false
```

旧版键：

- `channels.slack.streamMode`（`replace | status_final | append`）自动迁移到 `channels.slack.streaming`。
- 布尔值 `channels.slack.streaming` 自动迁移到 `channels.slack.nativeStreaming`。

### 要求

1. 在 Slack 应用设置中启用 **Agents and AI Apps**。
2. 确保应用拥有 `assistant:write` 权限。
3. 该消息必须有可用的回复线程。线程选择仍遵循 `replyToMode`。

### 行为

- 第一个文本块开始流式传输（`chat.startStream`）。
- 后续文本块追加到同一流中（`chat.appendStream`）。
- 回复结束时完成流（`chat.stopStream`）。
- 媒体和非文本负载回退到正常传递。
- 如果流式传输在回复中途失败，OpenClaw 对剩余负载回退到正常传递。

## 配置参考指针

主要参考：

- [配置参考 - Slack](/gateway/configuration-reference#slack)

  重点 Slack 字段：
  - 模式/认证：`mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - 私信访问：`dm.enabled`, `dmPolicy`, `allowFrom`（旧版：`dm.policy`, `dm.allowFrom`）, `dm.groupEnabled`, `dm.groupChannels`
  - 兼容性开关：`dangerouslyAllowNameMatching`（紧急模式；非必要保持关闭）
  - Channel 访问：`groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - 线程/历史：`replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - 传递：`textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `nativeStreaming`
  - 操作/功能：`configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## 相关

- [配对](/channels/pairing)
- [Channel 路由](/channels/channel-routing)
- [故障排除](/channels/troubleshooting)
- [配置](/gateway/configuration)
- [Slash 命令](/tools/slash-commands)
