---
mmh3_hash: "0a3f4dd966cada1d8a7e69b596d29bb4"
summary: "`openclaw message` 的 CLI 参考（发送 + Channel 操作）"
read_when:
  - 添加或修改消息 CLI 操作
  - 更改出站 Channel 行为
title: "Message"
---

# `openclaw message`

用于发送消息和 Channel 操作的单一出站命令
（Discord/Google Chat/iMessage/Matrix/Mattermost（Plugin）/Microsoft Teams/Signal/Slack/Telegram/WhatsApp）。

## 用法

```
openclaw message <subcommand> [flags]
```

Channel 选择：

- 如果配置了多个 Channel，则需要 `--channel`。
- 如果只配置了一个 Channel，它将成为默认值。
- 可选值：`discord|googlechat|imessage|matrix|mattermost|msteams|signal|slack|telegram|whatsapp`（Mattermost 需要 Plugin）
- 当 `--channel` 存在或存在 Channel 前缀目标时，`openclaw message` 将选定的 Channel 解析为其所属 Plugin；否则加载已配置的 Channel Plugin 以推断默认 Channel。

目标格式（`--target`）：

- WhatsApp：E.164、群组 JID 或 WhatsApp Channel/Newsletter JID（`...@newsletter`）
- Telegram：聊天 ID、`@username` 或论坛主题目标（`-1001234567890:topic:42`，或 `--thread-id 42`）
- Discord：`channel:<id>` 或 `user:<id>`（或 `<@id>` 提及；纯数字 ID 被视为 Channel）
- Google Chat：`spaces/<spaceId>` 或 `users/<userId>`
- Slack：`channel:<id>` 或 `user:<id>`（接受原始 Channel ID）
- Mattermost（Plugin）：`channel:<id>`、`user:<id>` 或 `@username`（裸 ID 被视为 Channel）
- Signal：`+E.164`、`group:<id>`、`signal:+E.164`、`signal:group:<id>` 或 `username:<name>`/`u:<name>`
- iMessage：句柄、`chat_id:<id>`、`chat_guid:<guid>` 或 `chat_identifier:<id>`
- Matrix：`@user:server`、`!room:server` 或 `#alias:server`
- Microsoft Teams：会话 ID（`19:...@thread.tacv2`）或 `conversation:<id>` 或 `user:<aad-object-id>`

名称查找：

- 对于支持的 Provider（Discord/Slack 等），Channel 名称如 `Help` 或 `#help` 通过目录缓存解析。
- 缓存未命中时，如果 Provider 支持，OpenClaw 将尝试实时目录查找。

## 常用标志

- `--channel <name>`
- `--account <id>`
- `--target <dest>`（用于 send/poll/read 等的目标 Channel 或用户）
- `--targets <name>`（重复；仅广播）
- `--json`
- `--dry-run`
- `--verbose`

## SecretRef 行为

- `openclaw message` 在运行选定操作之前解析支持的 Channel SecretRef。
- 在可能的情况下将解析范围限定为活动操作目标：
  - 当设置（或从 `discord:...` 等前缀目标推断）`--channel` 时，范围限定为 Channel
  - 当设置 `--account` 时，范围限定为账户（Channel 全局 + 选定账户界面）
  - 省略 `--account` 时，OpenClaw 不强制使用 `default` 账户 SecretRef 范围
- 无关 Channel 上未解析的 SecretRef 不会阻止目标消息操作。
- 如果选定 Channel/账户的 SecretRef 未解析，命令将为该操作关闭失败。

## 操作

### 核心

- `send`
  - Channel：WhatsApp/Telegram/Discord/Google Chat/Slack/Mattermost（Plugin）/Signal/iMessage/Matrix/Microsoft Teams
  - 必需：`--target`，加上 `--message`、`--media` 或 `--presentation`
  - 可选：`--media`、`--presentation`、`--delivery`、`--pin`、`--reply-to`、`--thread-id`、`--gif-playback`、`--force-document`、`--silent`
  - 共享展示有效载荷：`--presentation` 发送语义块（`text`、`context`、`divider`、`buttons`、`select`），核心通过选定 Channel 的声明能力进行渲染。请参阅[消息展示](/plugins/message-presentation)。
  - 通用交付偏好：`--delivery` 接受交付提示，如 `{ "pin": true }`；`--pin` 是 Channel 支持时固定交付的简写。
  - Telegram + WhatsApp：`--force-document`（将图片、GIF 和视频作为文档发送以避免 Channel 压缩）
  - 仅 Telegram：`--thread-id`（论坛主题 ID）
  - 仅 Slack：`--thread-id`（线程时间戳；`--reply-to` 使用相同字段）
  - Telegram + Discord：`--silent`
  - 仅 WhatsApp：`--gif-playback`；WhatsApp Channel/Newsletter 使用其原生 `@newsletter` JID 寻址。

- `poll`
  - Channel：WhatsApp/Telegram/Discord/Matrix/Microsoft Teams
  - 必需：`--target`、`--poll-question`、`--poll-option`（重复）
  - 可选：`--poll-multi`
  - 仅 Discord：`--poll-duration-hours`、`--silent`、`--message`
  - 仅 Telegram：`--poll-duration-seconds`（5-600）、`--silent`、`--poll-anonymous` / `--poll-public`、`--thread-id`

- `react`
  - Channel：Discord/Google Chat/Matrix/Nextcloud Talk/Signal/Slack/Telegram/WhatsApp
  - 必需：`--message-id`、`--target`
  - 可选：`--emoji`、`--remove`、`--participant`、`--from-me`、`--target-author`、`--target-author-uuid`
  - 注意：`--remove` 需要 `--emoji`（省略 `--emoji` 在支持的情况下清除自己的反应；请参阅 /tools/reactions）
  - 仅 WhatsApp：`--participant`、`--from-me`
  - Signal 群组反应：需要 `--target-author` 或 `--target-author-uuid`
  - Nextcloud Talk：仅支持添加反应；`--remove` 会被拒绝并带有明确错误（请参阅 /tools/reactions）

- `reactions`
  - Channel：Discord/Google Chat/Slack/Matrix
  - 必需：`--message-id`、`--target`
  - 可选：`--limit`

- `read`
  - Channel：Discord/Slack/Matrix
  - 必需：`--target`
  - 可选：`--limit`、`--message-id`、`--before`、`--after`
  - 仅 Slack：`--message-id` 读取特定 Slack 消息时间戳；与 `--thread-id` 结合以读取确切的线程回复。
  - 仅 Discord：`--around`

- `edit`
  - Channel：Discord/Slack/Matrix
  - 必需：`--message-id`、`--message`、`--target`

- `delete`
  - Channel：Discord/Slack/Telegram/Matrix
  - 必需：`--message-id`、`--target`

- `pin` / `unpin`
  - Channel：Discord/Slack/Matrix
  - 必需：`--message-id`、`--target`

- `pins`（列表）
  - Channel：Discord/Slack/Matrix
  - 必需：`--target`

- `permissions`
  - Channel：Discord/Matrix
  - 必需：`--target`
  - 仅 Matrix：当启用 Matrix 加密且允许验证操作时可用

- `search`
  - Channel：Discord
  - 必需：`--guild-id`、`--query`
  - 可选：`--channel-id`、`--channel-ids`（重复）、`--author-id`、`--author-ids`（重复）、`--limit`

### 线程

- `thread create`
  - Channel：Discord
  - 必需：`--thread-name`、`--target`（Channel ID）
  - 可选：`--message-id`、`--message`、`--auto-archive-min`

- `thread list`
  - Channel：Discord
  - 必需：`--guild-id`
  - 可选：`--channel-id`、`--include-archived`、`--before`、`--limit`

- `thread reply`
  - Channel：Discord
  - 必需：`--target`（线程 ID）、`--message`
  - 可选：`--media`、`--reply-to`

### 表情

- `emoji list`
  - Discord：`--guild-id`
  - Slack：无额外标志

- `emoji upload`
  - Channel：Discord
  - 必需：`--guild-id`、`--emoji-name`、`--media`
  - 可选：`--role-ids`（重复）

### 贴纸

- `sticker send`
  - Channel：Discord
  - 必需：`--target`、`--sticker-id`（重复）
  - 可选：`--message`

- `sticker upload`
  - Channel：Discord
  - 必需：`--guild-id`、`--sticker-name`、`--sticker-desc`、`--sticker-tags`、`--media`

### 角色 / Channel / 成员 / 语音

- `role info`（Discord）：`--guild-id`
- `role add` / `role remove`（Discord）：`--guild-id`、`--user-id`、`--role-id`
- `channel info`（Discord）：`--target`
- `channel list`（Discord）：`--guild-id`
- `member info`（Discord/Slack）：`--user-id`（Discord 还需 `--guild-id`）
- `voice status`（Discord）：`--guild-id`、`--user-id`

### 活动

- `event list`（Discord）：`--guild-id`
- `event create`（Discord）：`--guild-id`、`--event-name`、`--start-time`
  - 可选：`--end-time`、`--desc`、`--channel-id`、`--location`、`--event-type`

### 管理（Discord）

- `timeout`：`--guild-id`、`--user-id`（可选 `--duration-min` 或 `--until`；两者均省略以清除超时）
- `kick`：`--guild-id`、`--user-id`（加 `--reason`）
- `ban`：`--guild-id`、`--user-id`（加 `--delete-days`、`--reason`）
  - `timeout` 也支持 `--reason`

### 广播

- `broadcast`
  - Channel：任何已配置的 Channel；使用 `--channel all` 定向所有 Provider
  - 必需：`--targets <target...>`
  - 可选：`--message`、`--media`、`--dry-run`

## 示例

发送 Discord 回复：

```
openclaw message send --channel discord \
  --target channel:123 --message "hi" --reply-to 456
```

发送带语义按钮的消息：

```
openclaw message send --channel discord \
  --target channel:123 --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Approve","value":"approve","style":"success"},{"label":"Decline","value":"decline","style":"danger"}]}]}'
```

核心根据 Channel 能力将相同的 `presentation` 有效载荷渲染为 Discord 组件、Slack 块、Telegram 内联按钮、Mattermost 属性或 Teams/Feishu 卡片。请参阅[消息展示](/plugins/message-presentation)了解完整契约和回退规则。

发送更丰富的展示有效载荷：

```bash
openclaw message send --channel googlechat --target spaces/AAA... \
  --message "Choose:" \
  --presentation '{"title":"Deploy approval","tone":"warning","blocks":[{"type":"text","text":"Choose a path"},{"type":"buttons","buttons":[{"label":"Approve","value":"approve"},{"label":"Decline","value":"decline"}]}]}'
```

创建 Discord 投票：

```
openclaw message poll --channel discord \
  --target channel:123 \
  --poll-question "Snack?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-multi --poll-duration-hours 48
```

创建 Telegram 投票（2 分钟后自动关闭）：

```
openclaw message poll --channel telegram \
  --target @mychat \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi \
  --poll-duration-seconds 120 --silent
```

发送 Teams 主动消息：

```
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 --message "hi"
```

创建 Teams 投票：

```
openclaw message poll --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --poll-question "Lunch?" \
  --poll-option Pizza --poll-option Sushi
```

在 Slack 中反应：

```
openclaw message react --channel slack \
  --target C123 --message-id 456 --emoji "✅"
```

在 Signal 群组中反应：

```
openclaw message react --channel signal \
  --target signal:group:abc123 --message-id 1737630212345 \
  --emoji "✅" --target-author-uuid 123e4567-e89b-12d3-a456-426614174000
```

通过通用展示发送 Telegram 内联按钮：

```
openclaw message send --channel telegram --target @mychat --message "Choose:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Yes","value":"cmd:yes"},{"label":"No","value":"cmd:no"}]}]}'
```

通过通用展示发送 Telegram Mini App 按钮：

```
openclaw message send --channel telegram --target 123456789 --message "Open app:" \
  --presentation '{"blocks":[{"type":"buttons","buttons":[{"label":"Launch","webApp":{"url":"https://example.com/app"}}]}]}'
```

Telegram web app 按钮仅支持用户与机器人之间的私聊。旧版使用 `web_app` 的 JSON 有效载荷仍可解析，但 `webApp` 是规范的展示字段。

通过通用展示发送 Teams 卡片：

```bash
openclaw message send --channel msteams \
  --target conversation:19:abc@thread.tacv2 \
  --presentation '{"title":"Status update","blocks":[{"type":"text","text":"Build completed"}]}'
```

将 Telegram 或 WhatsApp 图片作为文档发送以避免压缩：

```bash
openclaw message send --channel telegram --target @mychat \
  --media ./diagram.png --force-document
```

## 相关

- [CLI 参考](/cli)
- [Agent 发送](/tools/agent-send)
