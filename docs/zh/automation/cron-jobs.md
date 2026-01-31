---
title: "Cron 作业 (网关调度器)"
sidebarTitle: "Cron 作业"
mmh3_hash: "6e8db07cfc03adcc327fbfdb4010440b"
sunmary: "网关调度器的 Cron 作业 + 唤醒"
read_when:
  - 调度后台作业或唤醒时
  - 连接应与心跳一起或并行运行的自动化时
  - 在心跳和 cron 之间决定调度任务时
---
# Cron 作业 (网关调度器)

> **Cron vs 心跳?** 关于何时使用哪种机制的指导，请参见 [Cron vs 心跳](/automation/cron-vs-heartbeat)。

Cron 是网关内置的调度器。它持久化作业，在正确的时间唤醒智能体，并可以选择将输出传递回聊天。

如果你想要 *“每天早上运行这个”* 或 *“20 分钟后提醒智能体”*，cron 就是这种机制。

## 摘要 (TL;DR)
- Cron 在 **网关内部** 运行（而不是在模型内部）。
- 作业持久化在 `~/.openclaw/cron/` 下，因此重启不会丢失计划。
- 两种执行风格：
  - **主会话 (Main session)**: 将系统事件排队，然后在下一次心跳时运行。
  - **隔离 (Isolated)**: 在 `cron:<jobId>` 中运行专用的智能体回合，可选传递输出。
- 唤醒是一等公民：作业可以请求“现在唤醒”与“下次心跳”。

## 初学者友好概览
将 cron 作业视为：**何时** 运行 + **做** 什么。

1) **选择计划**
   - 一次性提醒 → `schedule.kind = "at"` (CLI: `--at`)
   - 重复作业 → `schedule.kind = "every"` 或 `schedule.kind = "cron"`
   - 如果你的 ISO 时间戳省略了时区，它将被视为 **UTC**。

2) **选择运行位置**
   - `sessionTarget: "main"` → 在下一次心跳期间使用主上下文运行。
   - `sessionTarget: "isolated"` → 在 `cron:<jobId>` 中运行专用的智能体回合。

3) **选择载荷**
   - 主会话 → `payload.kind = "systemEvent"`
   - 隔离会话 → `payload.kind = "agentTurn"`

可选：`deleteAfterRun: true` 从存储中删除成功的一次性作业。

## 概念

### 作业 (Jobs)
Cron 作业是一个存储记录，包含：
- **计划 (schedule)** (何时应该运行)，
- **载荷 (payload)** (它应该做什么)，
- 可选的 **传递 (delivery)** (输出应该发送到哪里)。
- 可选的 **智能体绑定 (agent binding)** (`agentId`): 在特定智能体下运行作业；如果丢失或未知，网关将回退到默认智能体。

作业由稳定的 `jobId` 标识（供 CLI/Gateway API 使用）。
在智能体工具调用中，`jobId` 是规范的；为了兼容性接受旧版 `id`。
作业可以通过 `deleteAfterRun: true` 选择在成功的一次性运行后自动删除。

### 计划 (Schedules)
Cron 支持三种计划类型：
- `at`: 一次性时间戳（自纪元以来的毫秒数）。网关接受 ISO 8601 并强制转换为 UTC。
- `every`: 固定间隔（毫秒）。
- `cron`: 带有可选 IANA 时区的 5 字段 cron 表达式。

Cron 表达式使用 `croner`. 如果省略时区，则使用网关主机的本地时区。

### 主会话 vs 隔离执行

#### 主会话作业 (系统事件)
主作业将系统事件排队，并可选地唤醒心跳运行器。
它们必须使用 `payload.kind = "systemEvent"`.

- `wakeMode: "next-heartbeat"` (默认): 事件等待下一次预定的心跳。
- `wakeMode: "now"`: 事件触发立即的心跳运行。

当你想要正常的心跳提示词 + 主会话上下文时，这是最合适的。
参见 [心跳](/gateway/heartbeat)。

#### 隔离作业 (专用 cron 会话)
隔离作业在会话 `cron:<jobId>` 中运行专用的智能体回合。

主要行为：
- 提示词以 `[cron:<jobId> <job name>]` 为前缀以进行追踪。
- 每次运行都开始一个 **新的会话 id**（没有先前的对话结转）。
- 摘要会发布到主会话（前缀 `Cron`，可配置）。
- `wakeMode: "now"` 在发布摘要后触发立即的心跳。
- 如果 `payload.deliver: true`，输出将传递到频道；否则保持内部。

将隔离作业用于嘈杂、频繁或不应向主聊天历史记录发送垃圾邮件的“后台杂务”。

### 载荷形状 (运行内容)
支持两种载荷类型：
- `systemEvent`: 仅主会话，通过心跳提示词路由。
- `agentTurn`: 仅隔离会话，运行专用的智能体回合。

常见的 `agentTurn` 字段：
- `message`: 必需的文本提示词。
- `model` / `thinking`: 可选覆盖（见下文）。
- `timeoutSeconds`: 可选超时覆盖。
- `deliver`: `true` 以将输出发送到频道目标。
- `channel`: `last` 或特定频道。
- `to`: 频道特定目标（电话/聊天/频道 id）。
- `bestEffortDeliver`: 避免在传递失败时使作业失败。

隔离选项（仅适用于 `session=isolated`）：
- `postToMainPrefix` (CLI: `--post-prefix`): 主会话中系统事件的前缀。
- `postToMainMode`: `summary` (默认) 或 `full`.
- `postToMainMaxChars`: 当 `postToMainMode=full` 时的最大字符数 (默认 8000)。

### 模型和思考覆盖
隔离作业 (`agentTurn`) 可以覆盖模型和思考级别：
- `model`: 提供商/模型字符串 (例如 `anthropic/claude-sonnet-4-20250514`) 或别名 (例如 `opus`)
- `thinking`: 思考级别 (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`; 仅限 GPT-5.2 + Codex 模型)

注意：你也可以在主会话作业上设置 `model`，但这会改变共享的主会话模型。我们建议仅对隔离作业使用模型覆盖，以避免意外的上下文切换。

解析优先级：
1. 作业载荷覆盖（最高）
2. Hook 特定默认值 (例如 `hooks.gmail.model`)
3. 智能体配置默认值

### 传递 (频道 + 目标)
隔离作业可以将输出传递到频道。作业载荷可以指定：
- `channel`: `whatsapp` / `telegram` / `discord` / `slack` / `mattermost` (插件) / `signal` / `imessage` / `last`
- `to`: 频道特定的接收者目标

如果省略 `channel` 或 `to`，cron 可以回退到主会话的“最后路由”（智能体最后回复的地方）。

传递说明：
- 如果设置了 `to`，cron 会自动传递智能体的最终输出，即使省略了 `deliver`。
- 当你想要没有显式 `to` 的最后路由传递时，使用 `deliver: true`。
- 使用 `deliver: false` 以保持输出内部，即使存在 `to`。

目标格式提醒：
- Slack/Discord/Mattermost (插件) 目标应使用显式前缀（例如 `channel:<id>`, `user:<id>`）以避免歧义。
- Telegram 主题应使用 `:topic:` 形式（见下文）。

#### Telegram 传递目标 (主题 / 论坛线程)
Telegram 通过 `message_thread_id` 支持论坛主题。对于 cron 传递，你可以将主题/线程编码到 `to` 字段中：

- `-1001234567890` (仅聊天 id)
- `-1001234567890:topic:123` (首选：显式主题标记)
- `-1001234567890:123` (简写：数字后缀)

也接受带前缀的目标，如 `telegram:...` / `telegram:group:...`：
- `telegram:group:-1001234567890:topic:123`

## 存储 & 历史
- 作业存储: `~/.openclaw/cron/jobs.json` (网关管理的 JSON)。
- 运行历史: `~/.openclaw/cron/runs/<jobId>.jsonl` (JSONL, 自动修剪)。
- 覆盖存储路径: 配置中的 `cron.store`。

## 配置

```json5
{
  cron: {
    enabled: true, // 默认 true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1 // 默认 1
  }
}
```

完全禁用 cron：
- `cron.enabled: false` (配置)
- `OPENCLAW_SKIP_CRON=1` (环境变量)

## CLI 快速开始

一次性提醒（UTC ISO，成功后自动删除）：
```bash
openclaw cron add \
  --name "Send reminder" \
  --at "2026-01-12T18:00:00Z" \
  --session main \
  --system-event "Reminder: submit expense report." \
  --wake now \
  --delete-after-run
```

一次性提醒（主会话，立即唤醒）：
```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

重复的隔离作业（传递到 WhatsApp）：
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

重复的隔离作业（传递到 Telegram 主题）：
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

带有模型和思考覆盖的隔离作业：
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

智能体选择 (多智能体设置):
```bash
# 将作业固定到智能体 "ops" (如果该智能体丢失，则回退到默认值)
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# 切换或清除现有作业上的智能体
openclaw cron edit <jobId> --agent ops
openclaw cron edit <jobId> --clear-agent
```

手动运行 (调试):
```bash
openclaw cron run <jobId> --force
```

编辑现有作业 (修补字段):
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

不创建作业的立即系统事件：
```bash
openclaw system event --mode now --text "Next heartbeat: check battery."
```

## 网关 API 界面
- `cron.list`, `cron.status`, `cron.add`, `cron.update`, `cron.remove`
- `cron.run` (强制或到期), `cron.runs`
对于不带作业的立即系统事件，使用 [`openclaw system event`](/cli/system)。

## 故障排除

### “什么都没运行”
- 检查 cron 是否已启用: `cron.enabled` 和 `OPENCLAW_SKIP_CRON`。
- 检查网关是否持续运行（cron 在网关进程内运行）。
- 对于 `cron` 计划：确认时区 (`--tz`) vs 主机时区。

### Telegram 传递到了错误的地方
- 对于论坛主题，使用 `-100…:topic:<id>` 以便显式且无歧义。
- 如果你在日志或存储的“最后路由”目标中看到 `telegram:...` 前缀，这很正常；
  cron 传递接受它们并仍能正确解析主题 ID。
