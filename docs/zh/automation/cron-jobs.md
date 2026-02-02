---
title: "Cron 作业"
sidebarTitle: "Cron 作业"
mmh3_hash: "19ebd7d865818e7deced3d17044e8864"
summary: "网关调度器的 Cron 作业 + 唤醒"
read_when: ["调度后台作业或唤醒时","连接应与心跳一起或并行运行的自动化时","在心跳和 cron 之间决定调度任务时"]
---

# Cron 作业 (Gateway 调度器)

> **Cron vs 心跳?** 关于何时使用哪种机制的指导,请参见 [Cron vs 心跳](/automation/cron-vs-heartbeat)。

Cron 是 Gateway 内置的调度器。它持久化作业,在正确的时间唤醒 Agent,并可以选择将输出传递回聊天。

如果你想要 *"每天早上运行这个"* 或 *"20 分钟后提醒 Agent"*,cron 就是这种机制。

## TL;DR

- Cron 在 **Gateway 内部** 运行(而不是在模型内部)。
- 作业持久化在 `~/.openclaw/cron/` 下,因此重启不会丢失计划。
- 两种执行风格:
  - **Main session**: 将系统事件排队,然后在下一次心跳时运行。
  - **Isolated**: 在 `cron:<jobId>` 中运行专用的 Agent 回合,可选传递输出。
- 唤醒是一等公民: 作业可以请求"现在唤醒"与"下次心跳"。

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
openclaw cron run <job-id> --force
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
  --deliver \
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

可选: `deleteAfterRun: true` 从存储中删除成功的一次性作业。

## 概念

### 作业

Cron 作业是一个存储记录,包含:

- **schedule** (何时应该运行),
- **payload** (它应该做什么),
- 可选的 **delivery** (输出应该发送到哪里)。
- 可选的 **Agent 绑定** (`agentId`): 在特定 Agent 下运行作业;如果丢失或未知,Gateway 将回退到默认 Agent。

作业由稳定的 `jobId` 标识(供 CLI/Gateway API 使用)。
在 Agent 工具调用中,`jobId` 是规范的;为了兼容性接受旧版 `id`。
作业可以通过 `deleteAfterRun: true` 选择在成功的一次性运行后自动删除。

### 计划

Cron 支持三种计划类型:

- `at`: 一次性时间戳(自纪元以来的毫秒数)。Gateway 接受 ISO 8601 并强制转换为 UTC。
- `every`: 固定间隔(毫秒)。
- `cron`: 带有可选 IANA 时区的 5 字段 cron 表达式。

Cron 表达式使用 `croner`。如果省略时区,则使用 Gateway 主机的本地时区。

### Main vs isolated 执行

#### Main session 作业 (系统事件)

Main 作业将系统事件排队,并可选地唤醒心跳运行器。
它们必须使用 `payload.kind = "systemEvent"`。

- `wakeMode: "next-heartbeat"` (默认): 事件等待下一次预定的心跳。
- `wakeMode: "now"`: 事件触发立即的心跳运行。

当你想要正常的心跳提示词 + main session 上下文时,这是最合适的。
参见 [心跳](/gateway/heartbeat)。

#### Isolated 作业 (专用 cron 会话)

Isolated 作业在 session `cron:<jobId>` 中运行专用的 Agent 回合。

主要行为:

- 提示词以 `[cron:<jobId> <job name>]` 为前缀以进行追踪。
- 每次运行都开始一个 **新的 session id** (没有先前的对话结转)。
- 摘要会发布到 main session (前缀 `Cron`,可配置)。
- `wakeMode: "now"` 在发布摘要后触发立即的心跳。
- 如果 `payload.deliver: true`,输出将传递到 Channel;否则保持内部。

将 isolated 作业用于嘈杂、频繁或不应向 main 聊天历史记录发送垃圾邮件的"后台杂务"。

### 载荷形状 (运行内容)

支持两种载荷类型:

- `systemEvent`: 仅 main session,通过心跳提示词路由。
- `agentTurn`: 仅 isolated session,运行专用的 Agent 回合。

常见的 `agentTurn` 字段:

- `message`: 必需的文本提示词。
- `model` / `thinking`: 可选覆盖(见下文)。
- `timeoutSeconds`: 可选超时覆盖。
- `deliver`: `true` 以将输出发送到 Channel 目标。
- `channel`: `last` 或特定 Channel。
- `to`: Channel 特定目标(电话/聊天/Channel id)。
- `bestEffortDeliver`: 避免在传递失败时使作业失败。

隔离选项(仅适用于 `session=isolated`):

- `postToMainPrefix` (CLI: `--post-prefix`): main session 中系统事件的前缀。
- `postToMainMode`: `summary` (默认) 或 `full`。
- `postToMainMaxChars`: 当 `postToMainMode=full` 时的最大字符数(默认 8000)。

### 模型和思考覆盖

Isolated 作业 (`agentTurn`) 可以覆盖模型和思考级别:

- `model`: 提供商/模型字符串(例如 `anthropic/claude-sonnet-4-20250514`) 或别名(例如 `opus`)
- `thinking`: 思考级别(`off`, `minimal`, `low`, `medium`, `high`, `xhigh`;仅限 GPT-5.2 + Codex 模型)

注意: 你也可以在 main session 作业上设置 `model`,但这会改变共享的 main session 模型。我们建议仅对 isolated 作业使用模型覆盖,以避免意外的上下文切换。

解析优先级:

1. 作业载荷覆盖(最高)
2. Hook 特定默认值(例如 `hooks.gmail.model`)
3. Agent 配置默认值

### 传递 (Channel + 目标)

Isolated 作业可以将输出传递到 Channel。作业载荷可以指定:

- `channel`: `whatsapp` / `telegram` / `discord` / `slack` / `mattermost` (插件) / `signal` / `imessage` / `last`
- `to`: Channel 特定的接收者目标

如果省略 `channel` 或 `to`,cron 可以回退到 main session 的"最后路由"(Agent 最后回复的地方)。

传递说明:

- 如果设置了 `to`,cron 会自动传递 Agent 的最终输出,即使省略了 `deliver`。
- 当你想要没有显式 `to` 的最后路由传递时,使用 `deliver: true`。
- 使用 `deliver: false` 以保持输出内部,即使存在 `to`。

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

当直接调用 Gateway `cron.*` 工具(Agent 工具调用或 RPC) 时使用这些形状。CLI 标志接受人类持续时间,如 `20m`,但工具调用使用纪元毫秒作为 `atMs` 和 `everyMs`(接受 ISO 时间戳作为 `at` 时间)。

### cron.add 参数

一次性,main session 作业(系统事件):

```json
{
  "name": "Reminder",
  "schedule": { "kind": "at", "atMs": 1738262400000 },
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
    "deliver": true,
    "channel": "slack",
    "to": "channel:C1234567890",
    "bestEffortDeliver": true
  },
  "isolation": { "postToMainPrefix": "Cron", "postToMainMode": "summary" }
}
```

注意:

- `schedule.kind`: `at` (`atMs`), `every` (`everyMs`), 或 `cron` (`expr`, 可选 `tz`)。
- `atMs` 和 `everyMs` 是纪元毫秒。
- `sessionTarget` 必须是 `"main"` 或 `"isolated"` 并且必须匹配 `payload.kind`。
- 可选字段: `agentId`, `description`, `enabled`, `deleteAfterRun`, `isolation`。
- 省略时 `wakeMode` 默认为 `"next-heartbeat"`。

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
- 运行历史: `~/.openclaw/cron/runs/<jobId>.jsonl` (JSONL, 自动修剪)。
- 覆盖存储路径: 配置中的 `cron.store`。

## 配置

```json5
{
  cron: {
    enabled: true, // 默认 true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1, // 默认 1
  },
}
```

完全禁用 cron:

- `cron.enabled: false` (配置)
- `OPENCLAW_SKIP_CRON=1` (环境变量)

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

重复的 isolated 作业(传递到 WhatsApp):

```bash
openclaw cron add \
  --name "Morning status" \
  --cron "0 7 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize inbox + calendar for today." \
  --deliver \
  --channel whatsapp \
  --to "+15551234567"
```

重复的 isolated 作业(传递到 Telegram 主题):

```bash
openclaw cron add \
  --name "Nightly summary (topic)" \
  --cron "0 22 * * *" \
  --tz "America/Los_Angeles" \
  --session isolated \
  --message "Summarize today; send to the nightly topic." \
  --deliver \
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
  --deliver \
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

手动运行(调试):

```bash
openclaw cron run <jobId> --force
```

编辑现有作业(修补字段):

```bash
openclaw cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
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

### Telegram 传递到了错误的地方

- 对于论坛主题,使用 `-100…:topic:<id>` 以便显式且无歧义。
- 如果你在日志或存储的"最后路由"目标中看到 `telegram:...` 前缀,这很正常;
  cron 传递接受它们并仍能正确解析主题 ID。
