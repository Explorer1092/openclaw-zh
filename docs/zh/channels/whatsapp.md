---
title: "WhatsApp (Web 频道)"
sidebarTitle: "WhatsApp"
mmh3_hash: "9032626cbfda016cc1907a33ef26d6a1"
summary: "WhatsApp（web 渠道）集成：登录、收件箱、回复、媒体和操作"
read_when: ["Working on WhatsApp/web channel behavior or inbox routing"]
---
# WhatsApp (Web 频道)

状态：通过 Baileys 使用 WhatsApp Web。Gateway 拥有会话。

## 快速设置（新手）
1) 如果可能，使用**单独的手机号码**（推荐）。
2) 在 `~/.openclaw/openclaw.json` 中配置 WhatsApp。
3) 运行 `openclaw channels login` 扫描二维码（关联设备）。
4) 启动 gateway。

最小配置：
```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"]
    }
  }
}
```

## 目标
- 在一个 Gateway 进程中支持多个 WhatsApp 账号（多账号）。
- 确定性路由：回复返回 WhatsApp，无模型路由。
- 模型获得足够的上下文来理解引用回复。

## 配置写入
默认情况下，WhatsApp 允许通过 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

禁用方式：
```json5
{
  channels: { whatsapp: { configWrites: false } }
}
```

## 架构（谁拥有什么）
- **Gateway** 拥有 Baileys socket 和收件箱循环。
- **CLI / macOS 应用**与 gateway 通信；不直接使用 Baileys。
- **活动监听器**是出站发送所必需的；否则发送快速失败。

## 获取手机号码（两种模式）

WhatsApp 需要真实的手机号码进行验证。VoIP 和虚拟号码通常被阻止。有两种支持的方式在 WhatsApp 上运行 OpenClaw：

### 专用号码（推荐）
为 OpenClaw 使用**单独的手机号码**。最佳用户体验，清晰的路由，无自聊怪异行为。理想设置：**备用/旧 Android 手机 + eSIM**。让它保持 Wi‑Fi 连接和供电，并通过二维码关联。

**WhatsApp Business：** 您可以在同一设备上使用不同号码的 WhatsApp Business。非常适合将您的个人 WhatsApp 分开 — 安装 WhatsApp Business 并在那里注册 OpenClaw 号码。

**示例配置（专用号码，单用户白名单）：**
```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"]
    }
  }
}
```

**配对模式（可选）：**
如果您想使用配对而不是白名单，将 `channels.whatsapp.dmPolicy` 设置为 `pairing`。未知发送者将获得配对代码；通过以下方式批准：
`openclaw pairing approve whatsapp <code>`

### 个人号码（备用）
快速备用方案：在**您自己的号码**上运行 OpenClaw。给自己发消息（WhatsApp "给自己发消息"）进行测试，这样就不会打扰联系人。在设置和实验期间，预计需要在主手机上读取验证码。**必须启用自聊模式。**
当向导询问您的个人 WhatsApp 号码时，输入您将从中发送消息的手机（所有者/发送者），而不是助手号码。

**示例配置（个人号码，自聊）：**
```json
{
  "whatsapp": {
    "selfChatMode": true,
    "dmPolicy": "allowlist",
    "allowFrom": ["+15551234567"]
  }
}
```

当设置了 `{identity.name}` 时，自聊回复默认使用 `[{identity.name}]`（否则使用 `[openclaw]`），
前提是未设置 `messages.responsePrefix`。显式设置它以自定义或禁用
前缀（使用 `""` 删除它）。

### 号码来源提示
- 来自您所在国家移动运营商的**本地 eSIM**（最可靠）
  - 奥地利：[hot.at](https://www.hot.at)
  - 英国：[giffgaff](https://www.giffgaff.com) — 免费 SIM 卡，无合约
- **预付费 SIM 卡** — 便宜，只需要接收一条验证短信

**避免：** TextNow、Google Voice、大多数"免费短信"服务 — WhatsApp 会大力阻止这些。

**提示：** 号码只需要接收一条验证短信。之后，WhatsApp Web 会话通过 `creds.json` 持久化。

## 为什么不使用 Twilio？
- 早期的 OpenClaw 版本支持 Twilio 的 WhatsApp Business 集成。
- WhatsApp Business 号码不适合个人助手。
- Meta 强制执行 24 小时回复窗口；如果您在过去 24 小时内没有回复，商业号码无法发起新消息。
- 大量或"频繁"使用会触发激进的封禁，因为商业账号不适合发送数十条个人助手消息。
- 结果：交付不可靠且经常被封禁，因此删除了支持。

## 登录 + 凭据
- 登录命令：`openclaw channels login`（通过关联设备的二维码）。
- 多账号登录：`openclaw channels login --account <id>`（`<id>` = `accountId`）。
- 默认账号（当省略 `--account` 时）：如果存在则为 `default`，否则为第一个配置的账号 id（已排序）。
- 凭据存储在 `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`。
- 备份副本位于 `creds.json.bak`（损坏时恢复）。
- 旧版兼容性：旧安装直接将 Baileys 文件存储在 `~/.openclaw/credentials/` 中。
- 登出：`openclaw channels logout`（或 `--account <id>`）删除 WhatsApp 认证状态（但保留共享的 `oauth.json`）。
- 登出的 socket => 错误指示重新关联。

## 入站流程（DM + 群组）
- WhatsApp 事件来自 `messages.upsert`（Baileys）。
- 收件箱监听器在关闭时分离，以避免在测试/重启中累积事件处理程序。
- 状态/广播聊天被忽略。
- 直接聊天使用 E.164；群组使用群组 JID。
- **DM 策略**：`channels.whatsapp.dmPolicy` 控制直接聊天访问（默认：`pairing`）。
  - 配对：未知发送者获得配对代码（通过 `openclaw pairing approve whatsapp <code>` 批准；代码 1 小时后过期）。
  - 开放：需要 `channels.whatsapp.allowFrom` 包含 `"*"`。
  - 您关联的 WhatsApp 号码是隐式信任的，因此自我消息会跳过 `channels.whatsapp.dmPolicy` 和 `channels.whatsapp.allowFrom` 检查。

### 个人号码模式（备用）
如果您在**个人 WhatsApp 号码**上运行 OpenClaw，请启用 `channels.whatsapp.selfChatMode`（参见上面的示例）。

行为：
- 出站 DM 永远不会触发配对回复（防止向联系人发送垃圾邮件）。
- 入站未知发送者仍遵循 `channels.whatsapp.dmPolicy`。
- 自聊模式（allowFrom 包含您的号码）避免自动已读回执并忽略提及 JID。
- 为非自聊 DM 发送已读回执。

## 已读回执
默认情况下，gateway 会将入站 WhatsApp 消息标记为已读（蓝色勾号），一旦它们被接受。

全局禁用：
```json5
{
  channels: { whatsapp: { sendReadReceipts: false } }
}
```

按账号禁用：
```json5
{
  channels: {
    whatsapp: {
      accounts: {
        personal: { sendReadReceipts: false }
      }
    }
  }
}
```

注意：
- 自聊模式始终跳过已读回执。

## WhatsApp 常见问题：发送消息 + 配对

**当我关联 WhatsApp 时，OpenClaw 会向随机联系人发送消息吗？**  
不会。默认 DM 策略是 **pairing**，因此未知发送者只会获得配对代码，并且他们的消息**不会被处理**。OpenClaw 只会回复它收到的聊天，或者您显式触发的发送（agent/CLI）。

**WhatsApp 上的配对如何工作？**  
配对是未知发送者的 DM 门禁：
- 来自新发送者的第一条 DM 返回一个短代码（消息不会被处理）。
- 批准方式：`openclaw pairing approve whatsapp <code>`（使用 `openclaw pairing list whatsapp` 列出）。
- 代码 1 小时后过期；待处理请求每个渠道上限为 3 个。

**多个人可以在一个 WhatsApp 号码上使用不同的 OpenClaw 实例吗？**  
可以，通过 `bindings` 将每个发送者路由到不同的 agent（peer `kind: "dm"`，发送者 E.164 如 `+15551234567`）。回复仍然来自**同一个 WhatsApp 账号**，并且直接聊天会合并到每个 agent 的主会话中，因此请**为每个人使用一个 agent**。DM 访问控制（`dmPolicy`/`allowFrom`）对每个 WhatsApp 账号都是全局的。参见 [多 Agent 路由](/concepts/multi-agent)。

**为什么向导会询问我的手机号码？**  
向导使用它来设置您的**白名单/所有者**，以便允许您自己的 DM。它不用于自动发送。如果您在个人 WhatsApp 号码上运行，请使用相同的号码并启用 `channels.whatsapp.selfChatMode`。

## 消息规范化（模型看到的内容）
- `Body` 是包含信封的当前消息正文。
- 引用回复上下文**始终附加**：
  ```
  [Replying to +1555 id:ABC123]
  <quoted text or <media:...>>
  [/Replying]
  ```
- 回复元数据也已设置：
  - `ReplyToId` = stanzaId
  - `ReplyToBody` = 引用正文或媒体占位符
  - `ReplyToSender` = 已知时为 E.164
- 仅媒体的入站消息使用占位符：
  - `<media:image|video|audio|document|sticker>`

## 群组
- 群组映射到 `agent:<agentId>:whatsapp:group:<jid>` 会话。
- 群组策略：`channels.whatsapp.groupPolicy = open|disabled|allowlist`（默认 `allowlist`）。
- 激活模式：
  - `mention`（默认）：需要 @提及 或正则匹配。
  - `always`：始终触发。
- `/activation mention|always` 仅限所有者，必须作为独立消息发送。
- 所有者 = `channels.whatsapp.allowFrom`（如果未设置，则为自我 E.164）。
- **历史注入**（仅待处理）：
  - 最近的*未处理*消息（默认 50）插入到：
    `[Chat messages since your last reply - for context]`（会话中已存在的消息不会重新注入）
  - 当前消息插入到：
    `[Current message - respond to this]`
  - 发送者后缀附加：`[from: Name (+E164)]`
- 群组元数据缓存 5 分钟（主题 + 参与者）。

## 回复传递（线程）
- WhatsApp Web 发送标准消息（当前 gateway 中没有引用回复线程）。
- 此渠道忽略回复标签。

## 确认反应（收到消息时自动反应）

WhatsApp 可以在收到消息后立即自动发送表情符号反应，在机器人生成回复之前。这为用户提供即时反馈，表明他们的消息已收到。

**配置：**
```json
{
  "whatsapp": {
    "ackReaction": {
      "emoji": "👀",
      "direct": true,
      "group": "mentions"
    }
  }
}
```

**选项：**
- `emoji`（字符串）：用于确认的表情符号（例如，"👀"、"✅"、"📨"）。空或省略 = 禁用功能。
- `direct`（布尔值，默认：`true`）：在直接/DM 聊天中发送反应。
- `group`（字符串，默认：`"mentions"`）：群组聊天行为：
  - `"always"`：对所有群组消息做出反应（即使没有 @提及）
  - `"mentions"`：仅在机器人被 @提及时做出反应
  - `"never"`：从不在群组中做出反应

**按账号覆盖：**
```json
{
  "whatsapp": {
    "accounts": {
      "work": {
        "ackReaction": {
          "emoji": "✅",
          "direct": false,
          "group": "always"
        }
      }
    }
  }
}
```

**行为说明：**
- 反应在消息接收后**立即**发送，在打字指示器或机器人回复之前。
- 在具有 `requireMention: false`（激活：always）的群组中，`group: "mentions"` 将对所有消息做出反应（不仅仅是 @提及）。
- 发送后不管：反应失败会被记录，但不会阻止机器人回复。
- 参与者 JID 自动包含在群组反应中。
- WhatsApp 忽略 `messages.ackReaction`；请使用 `channels.whatsapp.ackReaction`。

## Agent 工具（反应）
- 工具：`whatsapp`，带有 `react` 操作（`chatJid`、`messageId`、`emoji`，可选 `remove`）。
- 可选：`participant`（群组发送者）、`fromMe`（对您自己的消息做出反应）、`accountId`（多账号）。
- 反应移除语义：参见 [/tools/reactions](/tools/reactions)。
- 工具门禁：`channels.whatsapp.actions.reactions`（默认：已启用）。

## 限制
- 出站文本被分块到 `channels.whatsapp.textChunkLimit`（默认 4000）。
- 可选的换行分块：设置 `channels.whatsapp.chunkMode="newline"` 以在长度分块之前在空白行（段落边界）上分割。
- 入站媒体保存由 `channels.whatsapp.mediaMaxMb` 限制（默认 50 MB）。
- 出站媒体项由 `agents.defaults.mediaMaxMb` 限制（默认 5 MB）。

## 出站发送（文本 + 媒体）
- 使用活动 web 监听器；如果 gateway 未运行则报错。
- 文本分块：每条消息最多 4k（可通过 `channels.whatsapp.textChunkLimit` 配置，可选 `channels.whatsapp.chunkMode`）。
- 媒体：
  - 支持图像/视频/音频/文档。
  - 音频作为 PTT 发送；`audio/ogg` => `audio/ogg; codecs=opus`。
  - 仅在第一个媒体项上添加标题。
  - 媒体获取支持 HTTP(S) 和本地路径。
  - 动画 GIF：WhatsApp 期望带有 `gifPlayback: true` 的 MP4 以进行内联循环。
    - CLI：`openclaw message send --media <mp4> --gif-playback`
    - Gateway：`send` 参数包括 `gifPlayback: true`

## 语音笔记（PTT 音频）
WhatsApp 将音频作为**语音笔记**（PTT 气泡）发送。
- 最佳结果：OGG/Opus。OpenClaw 将 `audio/ogg` 重写为 `audio/ogg; codecs=opus`。
- WhatsApp 忽略 `[[audio_as_voice]]`（音频已作为语音笔记发送）。

## 媒体限制 + 优化
- 默认出站上限：5 MB（每个媒体项）。
- 覆盖：`agents.defaults.mediaMaxMb`。
- 图像自动优化为 JPEG 以符合上限（调整大小 + 质量扫描）。
- 超大媒体 => 错误；媒体回复回退到文本警告。

## 心跳
- **Gateway 心跳**记录连接健康状况（`web.heartbeatSeconds`，默认 60 秒）。
- **Agent 心跳**可以按 agent 配置（`agents.list[].heartbeat`）或全局
  通过 `agents.defaults.heartbeat` 配置（当未设置按 agent 条目时回退）。
  - 使用配置的心跳提示（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）+ `HEARTBEAT_OK` 跳过行为。
  - 传递默认为最后使用的渠道（或配置的目标）。

## 重连行为
- 退避策略：`web.reconnect`：
  - `initialMs`、`maxMs`、`factor`、`jitter`、`maxAttempts`。
- 如果达到 maxAttempts，web 监控停止（降级）。
- 登出 => 停止并要求重新关联。

## 配置快速映射
- `channels.whatsapp.dmPolicy`（DM 策略：pairing/allowlist/open/disabled）。
- `channels.whatsapp.selfChatMode`（同手机设置；机器人使用您的个人 WhatsApp 号码）。
- `channels.whatsapp.allowFrom`（DM 白名单）。WhatsApp 使用 E.164 电话号码（无用户名）。
- `channels.whatsapp.mediaMaxMb`（入站媒体保存上限）。
- `channels.whatsapp.ackReaction`（消息接收时自动反应：`{emoji, direct, group}`）。
- `channels.whatsapp.accounts.<accountId>.*`（按账号设置 + 可选 `authDir`）。
- `channels.whatsapp.accounts.<accountId>.mediaMaxMb`（按账号入站媒体上限）。
- `channels.whatsapp.accounts.<accountId>.ackReaction`（按账号确认反应覆盖）。
- `channels.whatsapp.groupAllowFrom`（群组发送者白名单）。
- `channels.whatsapp.groupPolicy`（群组策略）。
- `channels.whatsapp.historyLimit` / `channels.whatsapp.accounts.<accountId>.historyLimit`（群组历史上下文；`0` 禁用）。
- `channels.whatsapp.dmHistoryLimit`（用户轮次中的 DM 历史限制）。按用户覆盖：`channels.whatsapp.dms["<phone>"].historyLimit`。
- `channels.whatsapp.groups`（群组白名单 + 提及门禁默认值；使用 `"*"` 允许所有）
- `channels.whatsapp.actions.reactions`（WhatsApp 工具反应门禁）。
- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）
- `messages.groupChat.historyLimit`
- `channels.whatsapp.messagePrefix`（入站前缀；按账号：`channels.whatsapp.accounts.<accountId>.messagePrefix`；已弃用：`messages.messagePrefix`）
- `messages.responsePrefix`（出站前缀）
- `agents.defaults.mediaMaxMb`
- `agents.defaults.heartbeat.every`
- `agents.defaults.heartbeat.model`（可选覆盖）
- `agents.defaults.heartbeat.target`
- `agents.defaults.heartbeat.to`
- `agents.defaults.heartbeat.session`
- `agents.list[].heartbeat.*`（按 agent 覆盖）
- `session.*`（范围、空闲、存储、mainKey）
- `web.enabled`（为 false 时禁用渠道启动）
- `web.heartbeatSeconds`
- `web.reconnect.*`

## 日志 + 故障排除
- 子系统：`whatsapp/inbound`、`whatsapp/outbound`、`web-heartbeat`、`web-reconnect`。
- 日志文件：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`（可配置）。
- 故障排除指南：[Gateway 故障排除](/gateway/troubleshooting)。

## 故障排除（快速）

**未关联 / 需要二维码登录**
- 症状：`channels status` 显示 `linked: false` 或警告"未关联"。
- 修复：在 gateway 主机上运行 `openclaw channels login` 并扫描二维码（WhatsApp → 设置 → 关联设备）。

**已关联但断开连接 / 重连循环**
- 症状：`channels status` 显示 `running, disconnected` 或警告"已关联但断开连接"。
- 修复：`openclaw doctor`（或重启 gateway）。如果持续存在，通过 `channels login` 重新关联并检查 `openclaw logs --follow`。

**Bun 运行时**
- **不推荐** Bun。WhatsApp（Baileys）和 Telegram 在 Bun 上不可靠。
  使用 **Node** 运行 gateway。（参见入门运行时说明。）
