---
title: "Cron 作业"
sidebarTitle: "Cron 作业"
mmh3_hash: "576cb6604aa4c90331c7aa91d89bda2c"
summary: "Gateway 调度器的 Cron 作业 + 唤醒"
read_when:
  - 调度后台作业或唤醒时
  - 连接应与心跳一起或并行运行的自动化时
  - 在心跳和 cron 之间决定调度任务时
---

# Cron 作业 (Gateway 调度器)

> **Cron vs 心跳?** 关于何时使用哪种机制的指导,请参见 [Cron vs 心跳](/automation/cron-vs-heartbeat)。

Cron 是 Gateway 内置的调度器。它持久化作业,在正确的时间唤醒 Agent,并可以选择将输出传递回聊天。

如果你想要 *"每天早上运行这个"* 或 *"20 分钟后提醒 Agent"*,cron 就是这种机制。

故障排除: [/automation/troubleshooting](/automation/troubleshooting)

## TL;DR

- Cron 在 **Gateway 内部** 运行(而不是在模型内部)。
- 作业持久化在 `~/.openclaw/cron/` 下,因此重启不会丢失计划。
- 两种执行风格:
  - **Main session**: 将系统事件排队,然后在下一次心跳时运行。
  - **Isolated**: 在 `cron:<jobId>` 中运行专用的 Agent 回合,带有传递(默认为 announce 或 none)。
- 唤醒是一等公民: 作业可以请求"现在唤醒"与"下次心跳"。
- Webhook 发布是每个作业的可选功能: 通过 `delivery.mode = "webhook"` + `delivery.to = "<url>"` 设置。
- 旧版回退: 存储的带有 `notify: true` 的旧版作业在设置了 `cron.webhook` 时仍会发布,请将这些作业迁移到 webhook 传递模式。

## 快速开始 (可操作)

创建一次性提醒,验证它存在,并立即运行它:

```bash
openclaw cron add \
  --name "Reminder" \
  --at "2026-02-01T16:00:00Z" \
  --session main \
  --system-event "Reminder: check the cron docs draft" \
  --wake now \
  --delete-after-run

openclaw cron list
openclaw cron run <job-id>
openclaw cron runs --id <job-id>
```

安排一个带有传递的重复隔离作业:

```bash
openclaw cron add \
  --name "Morning brief" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize overnight updates." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

## 工具调用等价物 (Gateway cron tool)

对于规范的 JSON 形状和示例,请参见 [工具调用的 JSON schema](/automation/cron-jobs#json-schema-for-tool-calls)。

## cron 作业存储位置

Cron 作业默认持久化在 Gateway 主机的 `~/.openclaw/cron/jobs.json`。Gateway 将文件加载到内存中并在更改时写回,因此手动编辑仅在 Gateway 停止时才安全。对于更改,请优先使用 `openclaw cron add/edit` 或 cron 工具调用 API。

## 初学者友好概览

将 cron 作业视为: **何时** 运行 + **做** 什么。

1. **选择计划**
   - 一次性提醒 → `schedule.kind = "at"` (CLI: `--at`)
   - 重复作业 → `schedule.kind = "every"` 或 `schedule.kind = "cron"`
   - 如果你的 ISO 时间戳省略了时区,它将被视为 **UTC**。

2. **选择运行位置**
   - `sessionTarget: "main"` → 在下一次心跳期间使用 main 上下文运行。
   - `sessionTarget: "isolated"` → 在 `cron:<jobId>` 中运行专用的 Agent 回合。

3. **选择载荷**
   - Main session → `payload.kind = "systemEvent"`
   - Isolated session → `payload.kind = "agentTurn"`

可选: 一次性作业 (`schedule.kind = "at"`) 成功后默认删除。设置 `deleteAfterRun: false` 以保留它们(它们将在成功后禁用)。

## 概念

### 作业

Cron 作业是一个存储记录,包含:

- **schedule** (何时应该运行),
- **payload** (它应该做什么),
- 可选的 **delivery 模式** (`announce`、`webhook` 或 `none`)。
- 可选的 **Agent 绑定** (`agentId`): 在特定 Agent 下运行作业;如果丢失或未知,Gateway 将回退到默认 Agent。

作业由稳定的 `jobId` 标识(供 CLI/Gateway API 使用)。
在 Agent 工具调用中,`jobId` 是规范的;为了兼容性接受旧版 `id`。
一次性作业成功后默认自动删除;设置 `deleteAfterRun: false` 以保留它们。

### 计划

Cron 支持三种计划类型:

- `at`: 通过 `schedule.at` 的一次性时间戳(ISO 8601)。
- `every`: 固定间隔(毫秒)。
- `cron`: 带有可选 IANA 时区的 5 字段 cron 表达式(或带秒的 6 字段)。

Cron 表达式使用 `croner`。如果省略时区,则使用 Gateway 主机的本地时区。

为了减少多个 Gateway 的整点负载峰值,OpenClaw 对重复整点表达式(例如 `0 * * * *`、`0 */2 * * *`)应用最长 5 分钟的确定性每作业错峰窗口。固定时间表达式(例如 `0 7 * * *`)保持精确。

对于任何 cron 计划,你可以使用 `schedule.staggerMs` 设置显式错峰窗口(`0` 保持精确时序)。CLI 快捷方式:

- `--stagger 30s`(或 `1m`、`5m`)设置显式错峰窗口。
- `--exact` 强制 `staggerMs = 0`。

### Main vs isolated 执行

#### Main session 作业 (系统事件)

Main 作业将系统事件排队,并可选地唤醒心跳运行器。
它们必须使用 `payload.kind = "systemEvent"`。

- `wakeMode: "now"` (默认): 事件触发立即的心跳运行。
- `wakeMode: "next-heartbeat"`: 事件等待下一次预定的心跳。

当你想要正常的心跳提示词 + main session 上��文时,这是最合适的。
参见 [心跳](/gateway/heartbeat)。

#### Isolated 作业 (专用 cron 会话)

Isolated 作业在 session `cron:<jobId>` 中运行专用的 Agent 回合。

主要行为:

- 提示词以 `[cron:<jobId> <job name>]` 为前缀以进行追踪。
- 每次运行都开始一个 **新的 session id** (没有先前的对话结转)。
- 默认行为: 如果省略 `delivery`,isolated 作业会发布摘要 (`delivery.mode = "announce"`)。
- `delivery.mode` 选择发生什么:
  - `announce`: 将摘要传递到目标 Channel,并向 main session 发布简短摘要。
  - `webhook`: 当完成事件包含摘要时,将已完成事件载荷 POST 到 `delivery.to`。
  - `none`: 仅内部(无传递,无 main session 摘要)。
- `wakeMode` 控制 main session 摘要何时发布:
  - `now`: 立即心跳。
  - `next-heartbeat`: 等待下一次预定的心跳。

将 isolated 作业用于嘈杂、频繁或不应向 main 聊天历史记录发送垃圾邮件的"后台杂务"。

### 载荷形状 (运行内容)

支持两种载荷类型:

- `systemEvent`: 仅 main session,通过心跳提示词路由。
- `agentTurn`: 仅 isolated session,运行专用的 Agent 回合。

常见的 `agentTurn` 字段:

- `message`: 必需的文本提示词。
- `model` / `thinking`: 可选覆盖(见下文)。
- `timeoutSeconds`: 可选超时覆盖。
- `lightContext`: 可选轻量级引导模式，适用于不需要工作区引导文件注入的作业。

传递配置:

- `delivery.mode`: `none` | `announce` | `webhook`。
- `delivery.channel`: `last` 或特定 Channel(announce 模式)。
- `delivery.to`: Channel 特定目标(announce)或 webhook URL(webhook 模式)。
- `delivery.bestEffort`: 避免在 announce 传递失败时使作业失败。

Announce 传递会抑制运行的消息工具发送;使用 `delivery.channel`/`delivery.to` 来定向聊天。当 `delivery.mode = "none"` 时,不会向 main session 发布摘要。

如果 isolated 作业省略 `delivery`,OpenClaw 默认为 `announce`。

#### Announce 传递流程

当 `delivery.mode = "announce"` 时,cron 通过出站 Channel 适配器直接传递。
不会启动 main Agent 来制作或转发消息。

行为细节:

- 内容: 传递使用 isolated 运行的出站载荷(文本/媒体),具有正常的分块和 Channel 格式。
- 仅心跳响应 (没有真实内容的 `HEARTBEAT_OK`) 不会传递。
- 如果 isolated 运行已通过消息工具向同一目标发送消息,则跳过传递以避免重复。
- 缺少或无效的传递目标会使作业失败,除非 `delivery.bestEffort = true`。
- 仅当 `delivery.mode = "announce"` 时,才会向 main session 发布简短摘要。
- Main session 摘要遵守 `wakeMode`: `now` 触发立即心跳,`next-heartbeat` 等待下一次预定的心跳。

#### Webhook 传递流程

当 `delivery.mode = "webhook"` 时,当完成事件包含摘要时,cron 将已完成事件载荷 POST 到 `delivery.to`。

行为细节:

- 端点必须是有效的 HTTP(S) URL。
- Webhook 模式中不会尝试 Channel 传递。
- Webhook 模式中不会向 main session 发布摘要。
- 如果设置了 `cron.webhookToken`,认证标头是 `Authorization: Bearer <cron.webhookToken>`。
- 旧版回退: 存储的带有 `notify: true` 的旧版作业仍会发布到 `cron.webhook`(如果已配置),并附带警告以便你迁移到 `delivery.mode = "webhook"`。

### 模型和思考覆盖

Isolated 作业 (`agentTurn`) 可以覆盖模型和思考级别:

- `model`: 提供商/模型字符串(例如 `anthropic/claude-sonnet-4-20250514`) 或别名(例如 `opus`)
- `thinking`: 思考级别(`off`, `minimal`, `low`, `medium`, `high`, `xhigh`;仅限 GPT-5.2 + Codex 模型)

注意: 你也可以在 main session 作业上设置 `model`,但这会改变共享的 main session 模型。我们建议仅对 isolated 作业使用模型覆盖,以避免意外的上下文切换。

解析优先级:

1. 作业载荷覆盖(最高)
2. Hook 特定默认值(例如 `hooks.gmail.model`)
3. Agent 配置默认值

### 轻量级引导上下文

Isolated 作业 (`agentTurn`) 可以设置 `lightContext: true` 以使用轻量级引导上下文运行。

- 适用于不需要工作区引导文件注入的计划任务。
- 在实践中，嵌入式运行时使用 `bootstrapContextMode: "lightweight"` 运行，这有意保持 cron 引导上下文为空。
- CLI 等价命令：`openclaw cron add --light-context ...` 和 `openclaw cron edit --light-context`。

### 传递 (Channel + 目标)

Isolated 作业可以通过顶层 `delivery` 配置将输出传递到 Channel:

- `delivery.mode`: `announce` (Channel 传递)、`webhook` (HTTP POST) 或 `none`。
- `delivery.channel`: `whatsapp` / `telegram` / `discord` / `slack` / `mattermost` (插件) / `signal` / `imessage` / `last`。
- `delivery.to`: Channel 特定的接收者目标。

`announce` 传递仅对 isolated 作业 (`sessionTarget: "isolated"`) 有效。
`webhook` 传递对 main 和 isolated 作业都有效。

如果省略 `delivery.channel` 或 `delivery.to`,cron 可以回退到 main session 的"最后路由"(Agent 最后回复的地方)。

目标格式提醒:

- Slack/Discord/Mattermost (插件) 目标应使用显式前缀(例如 `channel:<id>`, `user:<id>`) 以避免歧义。
- Telegram 主题应使用 `:topic:` 形式(见下文)。

#### Telegram 传递目标 (主题 / 论坛线程)

Telegram 通过 `message_thread_id` 支持论坛主题。对于 cron 传递,你可以将主题/线程编码到 `to` 字段中:

- `-1001234567890` (仅聊天 id)
- `-1001234567890:topic:123` (首选: 显式主题标记)
- `-1001234567890:123` (简写: 数字后缀)

也接受带前缀的目标,如 `telegram:...` / `telegram:group:...`:

- `telegram:group:-1001234567890:topic:123`

## 工具调用的 JSON schema

当直接调用 Gateway `cron.*` 工具(Agent 工具调用或 RPC) 时使用这些形状。CLI 标志接受人类持续时间,如 `20m`,但工具调用应对 `schedule.at` 使用 ISO 8601 字符串,对 `schedule.everyMs` 使用毫秒。

### cron.add 参数

一次性,main session 作业(系统事件):

```json
{
  "name": "Reminder",
  "schedule": { "kind": "at", "at": "2026-02-01T16:00:00Z" },
  "sessionTarget": "main",
  "wakeMode": "now",
  "payload": { "kind": "systemEvent", "text": "Reminder text" },
  "deleteAfterRun": true
}
```

重复,isolated 作业带传递:

```json
{
  "name": "Morning brief",
  "schedule": { "kind": "cron", "expr": "0 7 * * *", "tz": "America/Los_Angeles" },
  "sessionTarget": "isolated",
  "wakeMode": "next-heartbeat",
  "payload": {
    "kind": "agentTurn",
    "message": "Summarize overnight updates.",
    "lightContext": true
  },
  "delivery": {
    "mode": "announce",
    "channel": "slack",
    "to": "channel:C1234567890",
    "bestEffort": true
  }
}
```

注意:

- `schedule.kind`: `at` (`at`), `every` (`everyMs`), 或 `cron` (`expr`, 可选 `tz`)。
- `schedule.at` 接受 ISO 8601(时区可选;省略时视为 UTC)。
- `everyMs` 是毫秒。
- `sessionTarget` 必须是 `"main"` 或 `"isolated"` 并且必须匹配 `payload.kind`。
- 可选字段: `agentId`, `description`, `enabled`, `deleteAfterRun` (对于 `at` 默认为 true),
  `delivery`。
- 省略时 `wakeMode` 默认为 `"now"`。

### cron.update 参数

```json
{
  "jobId": "job-123",
  "patch": {
    "enabled": false,
    "schedule": { "kind": "every", "everyMs": 3600000 }
  }
}
```

注意:

- `jobId` 是规范的;为了兼容性接受 `id`。
- 在 patch 中使用 `agentId: null` 以清除 Agent 绑定。

### cron.run 和 cron.remove 参数

```json
{ "jobId": "job-123", "mode": "force" }
```

```json
{ "jobId": "job-123" }
```

## 存储 & 历史

- 作业存储: `~/.openclaw/cron/jobs.json` (Gateway 管理的 JSON)。
- 运行历史: `~/.openclaw/cron/runs/<jobId>.jsonl` (JSONL, 自动按大小和行数修剪)。
- `sessions.json` 中的 isolated cron 运行会话按 `cron.sessionRetention` 修剪(默认 `24h`;设置 `false` 以禁用)。
- 覆盖存储路径: 配置中的 `cron.store`。

## 重试策略

当作业失败时,OpenClaw 将错误分类为 **瞬时** (可重试) 或 **永久** (立即禁用)。

### 瞬时错误 (重试)

- 速率限制 (429, 请求过多, 资源耗尽)
- Provider 过载（例如 Anthropic `529 overloaded_error`，过载回退摘要）
- 网络错误 (超时, ECONNRESET, 获取失败, socket)
- 服务器错误 (5xx)
- 与 Cloudflare 相关的错误

### 永久错误 (不重试)

- 认证失败 (无效 API 密钥, 未授权)
- 配置或验证错误
- 其他非瞬时错误

### 默认行为 (无配置)

**一次性作业 (`schedule.kind: "at"`):**

- 瞬时错误: 以指数退避 (30秒 → 1分钟 → 5分钟) 重试最多 3 次。
- 永久错误: 立即禁用。
- 成功或跳过: 禁用 (如果 `deleteAfterRun: true` 则删除)。

**重复作业 (`cron` / `every`):**

- 任何错误: 在下一次预定运行前应用指数退避 (30秒 → 1分钟 → 5分钟 → 15分钟 → 60分钟)。
- 作业保持启用状态;退避在下次成功运行后重置。

配置 `cron.retry` 以覆盖这些默认值 (参见 [配置](/automation/cron-jobs#configuration))。

## 配置

```json5
{
  cron: {
    enabled: true, // 默认 true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1, // 默认 1
    // 可选: 覆盖一次性作业的重试策略
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhook: "https://example.invalid/legacy", // 已弃用: 存储的 notify:true 旧版作业的回退
    webhookToken: "replace-with-dedicated-webhook-token", // 可选: webhook 模式的 bearer token
    sessionRetention: "24h", // 持续时间字符串或 false
    runLog: {
      maxBytes: "2mb", // 默认 2_000_000 字节
      keepLines: 2000, // 默认 2000
    },
  },
}
```

运行日志修剪行为:

- `cron.runLog.maxBytes`: 修剪前的最大运行日志文件大小。
- `cron.runLog.keepLines`: 修剪时,仅保留最新的 N 行。
- 两者都适用于 `cron/runs/<jobId>.jsonl` 文件。

Webhook 行为:

- 推荐: 按作业设置 `delivery.mode: "webhook"` 和 `delivery.to: "https://..."`。
- Webhook URL 必须是有效的 `http://` 或 `https://` URL。
- 发布时,载荷是 cron 已完成事件 JSON。
- 如果设置了 `cron.webhookToken`,认证标头是 `Authorization: Bearer <cron.webhookToken>`。
- 如果未设置 `cron.webhookToken`,则不发送 `Authorization` 标头。
- 已弃用回退: 存储的带有 `notify: true` 的旧版作业在存在 `cron.webhook` 时仍会使用它。

完全禁用 cron:

- `cron.enabled: false` (配置)
- `OPENCLAW_SKIP_CRON=1` (环境变量)

## 维护

Cron 有两个内置的维护路径: isolated 运行会话保留和运行日志修剪。

### 默认值

- `cron.sessionRetention`: `24h` (设置 `false` 以禁用运行会话修剪)
- `cron.runLog.maxBytes`: `2_000_000` 字节
- `cron.runLog.keepLines`: `2000`

### 工作原理

- Isolated 运行会创建会话条目 (`...:cron:<jobId>:run:<uuid>`) 和记录文件。
- 清理程序会删除早于 `cron.sessionRetention` 的过期运行会话条目。
- 对于不再被会话存储引用的已删除运行会话,OpenClaw 会归档记录文件并在相同的保留窗口内清除旧的已删除归档。
- 每次运行追加后,会检查 `cron/runs/<jobId>.jsonl` 的大小:
  - 如果文件大小超过 `runLog.maxBytes`,则将其修剪到最新的 `runLog.keepLines` 行。

### 高频调度器的性能注意事项

高频 cron 设置可能会产生大量运行会话和运行日志占用。维护已内置,但宽松的限制仍然会造成不必要的 IO 和清理工作。

需要关注的:

- 有许多 isolated 运行的长 `cron.sessionRetention` 窗口
- 与大 `runLog.maxBytes` 结合的高 `cron.runLog.keepLines`
- 许多嘈杂的重复作业写入相同的 `cron/runs/<jobId>.jsonl`

应对措施:

- 在调试/审计需求允许的范围内保持 `cron.sessionRetention` 尽量短
- 用适当的 `runLog.maxBytes` 和 `runLog.keepLines` 保持运行日志有界
- 将嘈杂的后台作业移至 isolated 模式,并使用避免不必要干扰的传递规则
- 定期使用 `openclaw cron runs` 检查增长情况,并在日志变大之前调整保留策略

### 自定义示例

将运行会话保留一周并允许更大的运行日志:

```json5
{
  cron: {
    sessionRetention: "7d",
    runLog: {
      maxBytes: "10mb",
      keepLines: 5000,
    },
  },
}
```

禁用 isolated 运行会话修剪但保持运行日志修剪:

```json5
{
  cron: {
    sessionRetention: false,
    runLog: {
      maxBytes: "5mb",
      keepLines: 3000,
    },
  },
}
```

针对高频 cron 使用调整(示例):

```json5
{
  cron: {
    sessionRetention: "12h",
    runLog: {
      maxBytes: "3mb",
      keepLines: 1500,
    },
  },
}
```

## CLI 快速开始

一次性提醒(UTC ISO,成功后自动删除):

```bash
openclaw cron add \
  --name "Send reminder" \
  --at "2026-01-12T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run
```

一次性提醒(main session,立即唤醒):

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

重复的 isolated 作业(announce 到 WhatsApp):

```bash
openclaw cron add \
  --name "Morning status" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize inbox + calendar for today." \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

带有显式 30 秒错峰的重复 cron 作业:

```bash
openclaw cron add \
  --name "Minute watcher" \
  --cron "0 * * * * *" \
  --tz "UTC" \
  --stagger 30s \
  --session isolated \
  --message "Run minute watcher checks." \
  --announce
```

重复的 isolated 作业(传递到 Telegram 主题):

```bash
openclaw cron add \
  --name "Nightly summary (topic)" \
  --cron "0 22 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize today; send to the nightly topic." \
  --announce \
  --channel telegram \
  --to "-1001234567890:topic:123"
```

带有模型和思考覆盖的 isolated 作业:

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 1" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Weekly deep analysis of project progress." \
  --model "opus" \
  --thinking high \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

Agent 选择(多 Agent 设置):

```bash
# 将作业固定到 Agent "ops" (如果该 Agent 丢失,则回退到默认值)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# 切换或清除现有作业上的 Agent
openclaw cron edit <jobId> --agent ops
openclaw cron edit <jobId> --clear-agent
```

手动运行(强制是默认,使用 `--due` 仅在到期时运行):

```bash
openclaw cron run <jobId>
openclaw cron run <jobId> --due
```

`cron.run` 在手动运行加入队列后立即确认，而不是等到作业完成。成功的队列响应形如 `{ ok: true, enqueued: true, runId }`。如果作业已在运行或 `--due` 发现没有到期的作业，响应保持为 `{ ok: true, ran: false, reason }`。使用 `openclaw cron runs --id <jobId>` 或 `cron.runs` Gateway 方法来查看最终的完成条目。

编辑现有作业(修补字段):

```bash
openclaw cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
```

强制现有 cron 作业精确按计划运行(无错峰):

```bash
openclaw cron edit <jobId> --exact
```

运行历史:

```bash
openclaw cron runs --id <jobId> --limit 50
```

不创建作业的立即系统事件:

```bash
openclaw system event --mode now --text "Next heartbeat: check battery."
```

## Gateway API 界面

- `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`
- `cron.run` (强制或到期), `cron.runs`
  对于不带作业的立即系统事件,使用 [`openclaw system event`](/cli/system)。

## 故障排除

### "什么都没运行"

- 检查 cron 是否已启用: `cron.enabled` 和 `OPENCLAW_SKIP_CRON`。
- 检查 Gateway 是否持续运行(cron 在 Gateway 进程内运行)。
- 对于 `cron` 计划: 确认时区(`--tz`) vs 主机时区。

### 重复作业在失败后持续延迟

- OpenClaw 在连续错误后对重复作业应用指数重试退避:
  30秒、1分钟、5分钟、15分钟,然后重试之间 60 分钟。
- 退避在下次成功运行后自动重置。
- 一次性 (`at`) 作业对瞬时错误(速率限制、网络、server_error)进行最多 3 次带退避的重试;永久错误立即禁用。参见 [重试策略](/automation/cron-jobs#retry-policy)。

### Telegram 传递到了错误的地方

- 对于论坛主题,使用 `-100…:topic:<id>` 以便显式且无歧义。
- 如果你在日志或存储的"最后路由"目标中看到 `telegram:...` 前缀,这很正常;
  cron 传递接受它们并仍能正确解析主题 ID。

### Subagent announce 传递重试

- 当 subagent 运行完成时,Gateway 会向请求方 session 公告结果。
- 如果 announce 流程返回 `false`(例如请求方 session 忙),Gateway 会通过 `announceRetryCount` 跟踪最多重试 3 次。
- 距 `endedAt` 超过 5 分钟的公告会被强制过期,以防止陈旧条目无限循环。
- 如果你在日志中看到重复的 announce 传递,请检查 subagent 注册表中 `announceRetryCount` 值较高的条目。
