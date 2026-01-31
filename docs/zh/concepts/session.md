---
title: "会话管理"
sidebarTitle: "会话管理"
mmh3_hash: "612ded7a8cffad72f923b285c3783907"
summary: "Session 管理规则、keys 和聊天持久化"
read_when:
  - 修改 session 处理或存储
---
# 会话管理

OpenClaw 将 **每个 agent 一个直接聊天 session** 视为主要。直接聊天折叠到 `agent:<agentId>:<mainKey>`(默认 `main`),而 group/channel 聊天获得自己的 keys。遵守 `session.mainKey`。

使用 `session.dmScope` 控制 **直接消息** 的分组方式:
- `main` (默认):所有 DMs 共享 main session 以保持连续性。
- `per-peer`: 按发送者 id 跨 channels 隔离。
- `per-channel-peer`: 按 channel + 发送者隔离(推荐用于多用户收件箱)。
- `per-account-channel-peer`: 按 account + channel + 发送者隔离(推荐用于多账户收件箱)。
使用 `session.identityLinks` 将 provider 前缀的 peer ids 映射到规范身份,以便在使用 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 时,同一个人跨 channels 共享 DM session。

## Gateway 是真相来源
所有 session 状态由 **gateway 拥有**("master" OpenClaw)。UI 客户端(macOS app、WebChat 等)必须查询 gateway 以获取 session 列表和 token 计数,而不是读取本地文件。

- 在 **远程模式** 下,你关心的 session store 位于远程 gateway 主机上,而不是你的 Mac。
- UIs 中显示的 Token 计数来自 gateway 的 store 字段(`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`)。客户端不解析 JSONL transcripts 来"修复"总计。

## State 位于何处
- 在 **gateway host** 上:
  - Store 文件:`~/.openclaw/agents/<agentId>/sessions/sessions.json` (每个 agent)。
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl` (Telegram topic sessions 使用 `.../<SessionId>-topic-<threadId>.jsonl`)。
- Store 是映射 `sessionKey -> { sessionId, updatedAt, ... }`。删除条目是安全的;它们会按需重新创建。
- Group 条目可能包括 `displayName`、`channel`、`subject`、`room` 和 `space` 以在 UIs 中标记 sessions。
- Session 条目包括 `origin` 元数据(标签 + 路由提示),以便 UIs 可以解释 session 来自哪里。
- OpenClaw **不** 读取传统的 Pi/Tau session 文件夹。

## Session pruning
OpenClaw 默认在 LLM 调用之前从内存中的 context 中修剪 **旧的 tool results**。这 **不** 重写 JSONL 历史记录。参见 [/concepts/session-pruning](/zh/concepts/session-pruning)。

## Pre-compaction memory flush
当 session 接近自动 compaction 时,OpenClaw 可以运行 **静默 memory flush** 回合,提醒 model 将持久注释写入磁盘。这仅在 workspace 可写时运行。参见 [Memory](/zh/concepts/memory) 和 [Compaction](/zh/concepts/compaction)。

## 将 transports 映射到 session keys
- 直接聊天遵循 `session.dmScope`(默认 `main`)。
  - `main`: `agent:<agentId>:<mainKey>` (跨设备/channels 的连续性)。
    - 多个电话号码和 channels 可以映射到同一 agent main key;它们充当进入一个对话的 transports。
  - `per-peer`: `agent:<agentId>:dm:<peerId>`。
  - `per-channel-peer`: `agent:<agentId>:<channel>:dm:<peerId>`。
  - `per-account-channel-peer`: `agent:<agentId>:<channel>:<accountId>:dm:<peerId>` (accountId 默认为 `default`)。
  - 如果 `session.identityLinks` 匹配 provider 前缀的 peer id(例如 `telegram:123`),规范键替换 `<peerId>`,以便同一个人跨 channels 共享 session。
- Group chats 隔离 state:`agent:<agentId>:<channel>:group:<id>` (rooms/channels 使用 `agent:<agentId>:<channel>:channel:<id>`)。
  - Telegram forum topics 将 `:topic:<threadId>` 附加到 group id 以进行隔离。
  - 传统 `group:<id>` keys 仍被识别用于迁移。
- 入站 contexts 可能仍使用 `group:<id>`;channel 从 `Provider` 推断并规范化为规范 `agent:<agentId>:<channel>:group:<id>` 形式。
- 其他来源:
  - Cron jobs: `cron:<job.id>`
  - Webhooks: `hook:<uuid>` (除非由 hook 明确设置)
  - Node runs: `node-<nodeId>`

## 生命周期
- Reset policy: sessions 被重用,直到它们过期,并在下一条入站消息时评估过期。
- 每日 reset: 默认为 **gateway 主机本地时间 4:00 AM**。一旦其最后更新早于最近的每日 reset 时间,session 就变陈旧了。
- Idle reset (可选):`idleMinutes` 添加滑动空闲窗口。当配置每日和空闲 resets 时,**哪个先过期** 强制新 session。
- 传统仅空闲:如果你在没有任何 `session.reset`/`resetByType` 配置的情况下设置 `session.idleMinutes`,OpenClaw 保持仅空闲模式以实现向后兼容性。
- 每种类型的覆盖(可选):`resetByType` 允许你覆盖 `dm`、`group` 和 `thread` sessions 的 policy (thread = Slack/Discord threads、Telegram topics、连接器提供的 Matrix threads)。
- 每个 channel 的覆盖(可选):`resetByChannel` 覆盖 channel 的 reset policy(适用于该 channel 的所有 session 类型,优先于 `reset`/`resetByType`)。
- Reset 触发器:精确 `/new` 或 `/reset`(加上 `resetTriggers` 中的任何额外内容)启动新的 session id 并传递消息的其余部分。`/new <model>` 接受 model 别名、`provider/model` 或 provider 名称(模糊匹配)以设置新 session model。如果单独发送 `/new` 或 `/reset`,OpenClaw 运行简短的"hello"问候回合以确认 reset。
- 手动 reset: 从 store 中删除特定 keys 或删除 JSONL transcript;下一条消息重新创建它们。
- 隔离的 cron jobs 始终为每次运行铸造新的 `sessionId`(无空闲重用)。

## Send policy (可选)
阻止特定 session 类型的传递,而无需列出单个 ids。

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } }
      ],
      default: "allow"
    }
  }
}
```

Runtime 覆盖(仅所有者):
- `/send on` → 允许此 session
- `/send off` → 拒绝此 session
- `/send inherit` → 清除覆盖并使用配置规则
将这些作为独立消息发送,以便它们注册。

## 配置(可选重命名示例)
```json5
// ~/.openclaw/openclaw.json
{
  session: {
    scope: "per-sender",      // 保持 group keys 分开
    dmScope: "main",          // DM 连续性(为共享收件箱设置 per-channel-peer/per-account-channel-peer)
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"]
    },
    reset: {
      // 默认值: mode=daily, atHour=4 (gateway host 本地时间)。
      // 如果你还设置了 idleMinutes,哪个先过期就获胜。
      mode: "daily",
      atHour: 4,
      idleMinutes: 120
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      dm: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 }
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 }
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    mainKey: "main",
  }
}
```

## 检查
- `openclaw status` — 显示 store 路径和最近的 sessions。
- `openclaw sessions --json` — 转储每个条目(使用 `--active <minutes>` 过滤)。
- `openclaw gateway call sessions.list --params '{}'` — 从运行的 gateway 获取 sessions(使用 `--url`/`--token` 进行远程 gateway 访问)。
- 在聊天中发送 `/status` 作为独立消息,以查看 agent 是否可达,使用了多少 session context,当前 thinking/verbose 切换,以及上次刷新 WhatsApp web creds 的时间(有助于发现重新链接需求)。
- 发送 `/context list` 或 `/context detail` 以查看 system prompt 和注入的 workspace 文件中的内容(以及最大的 context 贡献者)。
- 发送 `/stop` 作为独立消息以中止当前运行,清除该 session 的排队 followups,并停止从中生成的任何 sub-agent 运行(回复包括停止的计数)。
- 发送 `/compact`(可选说明)作为独立消息以总结较旧的 context 并释放窗口空间。参见 [/concepts/compaction](/zh/concepts/compaction)。
- JSONL transcripts 可以直接打开以查看完整回合。

## 提示
- 保持主 key 专用于 1:1 流量;让 groups 保留自己的 keys。
- 在自动化清理时,删除单个 keys 而不是整个 store,以在其他地方保留 context。

## Session origin 元数据
每个 session 条目记录它来自哪里(尽力而为)在 `origin` 中:
- `label`: 人类标签(从对话标签 + group subject/channel 解析)
- `provider`: 规范化的 channel id(包括 extensions)
- `from`/`to`: 来自入站信封的原始路由 ids
- `accountId`: provider account id(当多账户时)
- `threadId`: 当 channel 支持时的 thread/topic id
origin 字段为直接消息、channels 和 groups 填充。如果连接器仅更新传递路由(例如,保持 DM main session 新鲜),它仍应提供入站 context,以便 session 保留其解释器元数据。Extensions 可以通过在入站 context 中发送 `ConversationLabel`、`GroupSubject`、`GroupChannel`、`GroupSpace` 和 `SenderName` 并调用 `recordSessionMetaFromInbound`(或将相同的 context 传递给 `updateLastRoute`)来做到这一点。
