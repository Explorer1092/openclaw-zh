---
title: "会话管理"
sidebarTitle: "会话管理"
mmh3_hash: "3ecb7b9b1f6d2d577514292c93eba8ef"
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
  使用 `session.identityLinks` 将 provider 前缀的 peer ids 映射到规范身份,以便在使用 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 时同一人在不同 channels 共享 DM session。

## 安全 DM 模式(推荐用于多用户设置)

> **安全警告:** 如果你的 agent 可以接收来自**多人**的 DMs,你应该强烈考虑启用安全 DM 模式。没有它,所有用户共享相同的对话 context,这可能会在用户之间泄露私人信息。

**默认设置的问题示例:**

- Alice(`<SENDER_A>`)向你的 agent 发送关于私人主题的消息(例如,预约医疗)
- Bob(`<SENDER_B>`)向你的 agent 询问"我们在聊什么?"
- 因为两个 DMs 共享相同的 session,model 可能会使用 Alice 的先前 context 回答 Bob。

**修复方法:** 将 `dmScope` 设置为按用户隔离 sessions:

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    // 安全 DM 模式:按 channel + 发送者隔离 DM context。
    dmScope: "per-channel-peer",
  },
}
```

**何时启用:**

- 你有超过一个发送者的配对批准
- 你使用有多个条目的 DM 允许列表
- 你设置了 `dmPolicy: "open"`
- 多个电话号码或账户可以向你的 agent 发送消息

注意:

- 默认为 `dmScope: "main"` 以保持连续性(所有 DMs 共享 main session)。这对单用户设置来说是没问题的。
- 本地 CLI onboarding 在未设置时默认写入 `session.dmScope: "per-channel-peer"`(保留现有的显式值)。
- 对于同一 channel 上的多账户收件箱,优先使用 `per-account-channel-peer`。
- 如果同一人在多个 channels 与你联系,使用 `session.identityLinks` 将他们的 DM sessions 折叠到一个规范身份中。
- 你可以用 `openclaw security audit` 验证你的 DM 设置(参见 [security](/cli/security))。

## Gateway 是真相的来源

所有 session 状态由 **gateway**("主" OpenClaw)拥有。UI 客户端(macOS 应用、WebChat 等)必须向 gateway 查询 session 列表和 token 计数,而不是读取本地文件。

- 在**远程模式**下,你关心的 session store 位于远程 gateway 主机上,而不是你的 Mac 上。
- UIs 中显示的 token 计数来自 gateway store 字段(`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`)。客户端不解析 JSONL transcripts 来"修正"总数。

## 状态存储位置

- 在 **gateway 主机**上:
  - Store 文件:`~/.openclaw/agents/<agentId>/sessions/sessions.json`(每个 agent)。
- Transcripts: `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`(Telegram topic sessions 使用 `.../<SessionId>-topic-<threadId>.jsonl`)。
- Store 是一个映射 `sessionKey -> { sessionId, updatedAt, ... }`。删除条目是安全的;它们按需重新创建。
- Group 条目可能包括 `displayName`、`channel`、`subject`、`room` 和 `space` 以在 UIs 中标记 sessions。
- Session 条目包括 `origin` 元数据(标签 + 路由提示),以便 UIs 可以解释 session 来自哪里。
- OpenClaw **不**读取传统 Pi/Tau session 文件夹。

## 维护

OpenClaw 对 session store 应用维护,以使 `sessions.json` 和 transcript 工件随时间保持有界。

### 默认值

- `session.maintenance.mode`: `warn`
- `session.maintenance.pruneAfter`: `30d`
- `session.maintenance.maxEntries`: `500`
- `session.maintenance.rotateBytes`: `10mb`
- `session.maintenance.resetArchiveRetention`: 默认为 `pruneAfter`(`30d`)
- `session.maintenance.maxDiskBytes`: 未设置(禁用)
- `session.maintenance.highWaterBytes`: 启用预算时默认为 `maxDiskBytes` 的 `80%`

### 工作原理

维护在 session store 写入期间运行,你可以用 `openclaw sessions cleanup` 按需触发它。

- `mode: "warn"`:报告将被驱逐的内容,但不改变条目/transcripts。
- `mode: "enforce"`:按以下顺序应用清理:
  1. 清除超过 `pruneAfter` 的过时条目
  2. 将条目数上限设置为 `maxEntries`(最旧的优先)
  3. 存档不再被引用的已删除条目的 transcript 文件
  4. 通过保留策略清除旧的 `*.deleted.<timestamp>` 和 `*.reset.<timestamp>` 存档
  5. 当 `sessions.json` 超过 `rotateBytes` 时轮换它
  6. 如果设置了 `maxDiskBytes`,将磁盘预算强制执行到 `highWaterBytes`(最旧的工件优先,然后最旧的 sessions)

### 大型 store 的性能注意事项

大型 session stores 在高容量设置中很常见。维护工作是写路径工作,因此非常大的 store 可能会增加写入延迟。

最增加成本的是:

- 非常高的 `session.maintenance.maxEntries` 值
- 长 `pruneAfter` 窗口使过时条目保持存在
- `~/.openclaw/agents/<agentId>/sessions/` 中的许多 transcript/存档工件
- 在没有合理的清除/上限限制的情况下启用磁盘预算(`maxDiskBytes`)

应对措施:

- 在生产中使用 `mode: "enforce"`,以便增长自动受限
- 设置时间和计数限制(`pruneAfter` + `maxEntries`),而不只是一个
- 为大型部署中的硬上限设置 `maxDiskBytes` + `highWaterBytes`
- 将 `highWaterBytes` 保持在 `maxDiskBytes` 以下(默认为 80%)
- 配置更改后运行 `openclaw sessions cleanup --dry-run --json` 以在强制执行前验证预计影响
- 对于频繁活跃的 sessions,在运行手动清理时传递 `--active-key`

### 自定义示例

使用保守的 enforce 策略:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "45d",
      maxEntries: 800,
      rotateBytes: "20mb",
      resetArchiveRetention: "14d",
    },
  },
}
```

为 sessions 目录启用硬磁盘预算:

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      maxDiskBytes: "1gb",
      highWaterBytes: "800mb",
    },
  },
}
```

为较大安装调整(示例):

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "14d",
      maxEntries: 2000,
      rotateBytes: "25mb",
      maxDiskBytes: "2gb",
      highWaterBytes: "1.6gb",
    },
  },
}
```

从 CLI 预览或强制维护:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --enforce
```

## Session 清除

OpenClaw 默认在 LLM 调用之前从内存 context 中修剪**旧的 tool 结果**。
这**不会**重写 JSONL 历史。参见 [/concepts/session-pruning](/concepts/session-pruning)。

## 预 compaction memory flush

当 session 接近自动 compaction 时,OpenClaw 可以运行一个**静默 memory flush** 回合,提醒 model 将持久笔记写入磁盘。这仅在 workspace 可写时运行。参见 [Memory](/concepts/memory) 和 [Compaction](/concepts/compaction)。

## 传输 → session keys 映射

- 直接聊天遵循 `session.dmScope`(默认 `main`)。
  - `main`: `agent:<agentId>:<mainKey>`(跨设备/channels 保持连续性)。
    - 多个电话号码和 channels 可以映射到同一 agent main key;它们作为传输进入一个对话。
  - `per-peer`: `agent:<agentId>:direct:<peerId>`。
  - `per-channel-peer`: `agent:<agentId>:<channel>:direct:<peerId>`。
  - `per-account-channel-peer`: `agent:<agentId>:<channel>:<accountId>:direct:<peerId>`(accountId 默认为 `default`)。
  - 如果 `session.identityLinks` 匹配 provider 前缀的 peer id(例如 `telegram:123`),规范 key 替换 `<peerId>`,以便同一人在 channels 之间共享一个 session。
- Group 聊天隔离状态:`agent:<agentId>:<channel>:group:<id>`(rooms/channels 使用 `agent:<agentId>:<channel>:channel:<id>`)。
  - Telegram forum topics 将 `:topic:<threadId>` 附加到 group id 以进行隔离。
  - 传统的 `group:<id>` keys 仍被识别以进行迁移。
- 入站 contexts 可能仍使用 `group:<id>`;channel 从 `Provider` 推断并规范化为规范的 `agent:<agentId>:<channel>:group:<id>` 形式。
- 其他来源:
  - Cron 任务:`cron:<job.id>`(隔离)或自定义 `session:<custom-id>`(持久)
  - Webhooks:`hook:<uuid>`(除非由 hook 显式设置)
  - Node 运行:`node-<nodeId>`

## 生命周期

- 重置策略:sessions 被重用直到过期,过期在下一条入站消息时评估。
- 每日重置:默认在 **gateway 主机本地时间的凌晨 4:00**。一旦 session 的最后更新早于最近的每日重置时间,它就会过时。
- 空闲重置(可选):`idleMinutes` 添加一个滑动空闲窗口。当每日和空闲重置都配置时,**无论哪个先过期**都会强制新 session。
- 传统仅空闲:如果你设置 `session.idleMinutes` 而没有任何 `session.reset`/`resetByType` 配置,为了向后兼容,OpenClaw 保持仅空闲模式。
- 每类型覆盖(可选):`resetByType` 允许你为 `direct`、`group` 和 `thread` sessions 覆盖策略(thread = Slack/Discord threads、Telegram topics、connector 提供的 Matrix threads)。
- 每 channel 覆盖(可选):`resetByChannel` 覆盖 channel 的重置策略(适用于该 channel 的所有 session 类型,优先于 `reset`/`resetByType`)。
- 重置触发器:确切的 `/new` 或 `/reset`(加上 `resetTriggers` 中的任何额外内容)开始一个新的 session id 并将消息的剩余部分传递。`/new <model>` 接受 model 别名、`provider/model` 或 provider 名称(模糊匹配)来设置新 session model。如果单独发送 `/new` 或 `/reset`,OpenClaw 运行一个简短的"hello"问候回合来确认重置。
- 手动重置:从 store 删除特定 keys 或删除 JSONL transcript;下一条消息重新创建它们。
- 隔离的 cron 任务始终为每次运行创建一个新的 `sessionId`(无空闲重用)。

## 发送策略(可选)

阻止特定 session 类型的传递,无需列出单个 ids。

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } },
        // 匹配原始 session key(包含 `agent:<id>:` 前缀)。
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ],
      default: "allow",
    },
  },
}
```

运行时覆盖(仅 owner):

- `/send on` → 允许此 session
- `/send off` → 拒绝此 session
- `/send inherit` → 清除覆盖并使用 config 规则
  单独发送这些消息以便它们注册。

## 配置(可选重命名示例)

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    scope: "per-sender", // 保持 group keys 分离
    dmScope: "main", // DM 连续性(对共享收件箱设置 per-channel-peer/per-account-channel-peer)
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      // 默认值:mode=daily,atHour=4(gateway 主机本地时间)。
      // 如果你也设置了 idleMinutes,无论哪个先过期都赢。
      mode: "daily",
      atHour: 4,
      idleMinutes: 120,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    mainKey: "main",
  },
}
```

## 检查

- `openclaw status` — 显示 store 路径和最近的 sessions。
- `openclaw sessions --json` — 转储每个条目(用 `--active <minutes>` 过滤)。
- `openclaw gateway call sessions.list --params '{}'` — 从运行中的 gateway 获取 sessions(使用 `--url`/`--token` 进行远程 gateway 访问)。
- 在聊天中将 `/status` 作为独立消息发送,以查看 agent 是否可达、session context 使用了多少、当前的 thinking/fast/verbose 切换,以及你的 WhatsApp web 凭据上次刷新的时间(有助于发现重新链接需求)。
- 发送 `/context list` 或 `/context detail` 以查看 system prompt 中的内容和注入的 workspace 文件(以及最大的 context 贡献者)。
- 发送 `/stop`(或独立中止短语如 `stop`、`stop action`、`stop run`、`stop openclaw`)以中止当前运行,清除该 session 的排队后续内容,并停止从中生成的任何子 agent 运行(回复包含停止的计数)。
- 发送 `/compact`(可选指令)作为独立消息以摘要较旧的 context 并释放窗口空间。参见 [/concepts/compaction](/concepts/compaction)。
- JSONL transcripts 可以直接打开以查看完整回合。

## 提示

- 将主 key 专用于 1:1 流量;让 groups 保留自己的 keys。
- 在自动化清理时,删除单个 keys 而不是整个 store,以保留其他地方的 context。

## Session origin 元数据

每个 session 条目以尽力而为的方式在 `origin` 中记录它的来源:

- `label`:人类标签(从对话标签 + group subject/channel 解析)
- `provider`:规范化 channel id(包括扩展)
- `from`/`to`:来自入站 envelope 的原始路由 ids
- `accountId`:provider 账户 id(当多账户时)
- `threadId`:当 channel 支持时的 thread/topic id
  origin 字段为直接消息、channels 和 groups 填充。如果连接器只更新传递路由(例如,保持 DM main session 新鲜),它仍应提供入站 context 以便 session 保留其解释器元数据。扩展可以通过在入站 context 中发送 `ConversationLabel`、`GroupSubject`、`GroupChannel`、`GroupSpace` 和 `SenderName` 并调用 `recordSessionMetaFromInbound`(或将相同 context 传递给 `updateLastRoute`)来做到这一点。
