---
title: "Cron 作业"
sidebarTitle: "Cron 作业"
mmh3_hash: "8cd58910c54a982b92a0d53f1e584728"
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
  - **Isolated**: 在 `cron:<jobId>` 或自定义 session 中运行专用的 Agent 回合,带有传递(默认为 announce 或 none)。
  - **Current session**: 绑定到创建 cron 时所在的 session（`sessionTarget: "current"`）。
  - **Custom session**: 在持久化命名 session 中运行（`sessionTarget: "session:custom-id"`）。
- 唤醒是一等公民: 作业可以请求"现在唤醒"与"下次心跳"。
- Webhook 发布是每个作业的可选功能: 通过 `delivery.mode = "webhook"` + `delivery.to = "<url>"` 设置。
- 旧版回退仍适用于存储了 `notify: true` 且设置了 `cron.webhook` 的作业；请将这些作业迁移到 webhook delivery 模式。
- 升级时，`openclaw doctor --fix` 可以在调度器处理旧版 cron 存储字段前对其进行规范化。

## 快速开始（可操作）

创建一次性提醒，验证其存在，然后立即运行：

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

调度一个带有传递的周期性隔离作业：

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

## 工具调用等效（Gateway cron 工具）

关于规范的 JSON 形状和示例,请参见 [工具调用的 JSON schema](/automation/cron-jobs#json-schema-for-tool-calls)。

## Cron 作业的存储位置

Cron 作业默认持久化在 Gateway 主机的 `~/.openclaw/cron/jobs.json`。
Gateway 将文件加载到内存中,并在发生更改时写回,因此手动编辑
仅在 Gateway 停止时才是安全的。推荐使用 `openclaw cron add/edit` 或 cron
工具调用 API 进行更改。

## 新手友好的概述

把 cron 作业想象成：**何时**运行 + **做什么**。

1. **选择计划**
   - 一次性提醒 → `schedule.kind = "at"`（CLI: `--at`）
   - 周期性作业 → `schedule.kind = "every"` 或 `schedule.kind = "cron"`
   - 如果 ISO 时间戳省略时区，则视为 **UTC**。

2. **选择运行位置**
   - `sessionTarget: "main"` → 在下一次心跳期间以主上下文运行。
   - `sessionTarget: "isolated"` → 在 `cron:<jobId>` 中运行专用的 Agent 回合。
   - `sessionTarget: "current"` → 绑定到当前 session（在创建时解析为 `session:<sessionKey>`）。
   - `sessionTarget: "session:custom-id"` → 在跨运行保持上下文的持久化命名 session 中运行。

   默认行为（不变）：
   - `systemEvent` 负载默认为 `main`
   - `agentTurn` 负载默认为 `isolated`

   要使用当前 session 绑定，请显式设置 `sessionTarget: "current"`。

3. **选择负载**
   - Main session → `payload.kind = "systemEvent"`
   - Isolated session → `payload.kind = "agentTurn"`

可选：一次性作业（`schedule.kind = "at"`）在成功后默认删除。设置
`deleteAfterRun: false` 以保留它们（成功后将禁用）。

## 概念

### 作业

Cron 作业是一条包含以下内容的存储记录：

- **计划**（何时运行），
- **负载**（做什么），
- 可选的 **传递模式**（`announce`、`webhook` 或 `none`）。
- 可选的 **agent 绑定**（`agentId`）：在特定 agent 下运行作业；如果
  缺失或未知，gateway 回退到默认 agent。

作业由稳定的 `jobId` 标识（由 CLI/Gateway API 使用）。
在 agent 工具调用中，`jobId` 是规范的；旧版 `id` 可接受以保持兼容性。
一次性作业在成功后默认自动删除；设置 `deleteAfterRun: false` 以保留它们。

### 计划

Cron 支持三种计划类型：

- `at`：通过 `schedule.at`（ISO 8601）的一次性时间戳。
- `every`：固定间隔（毫秒）。
- `cron`：带可选 IANA 时区的 5 字段 cron 表达式（或带秒的 6 字段）。

Cron 表达式使用 `croner`。如果省略时区，则使用 Gateway 主机的
本地时区。

为减少多个 gateway 的整点负载峰值，OpenClaw 对周期性
整点表达式（例如 `0 * * * *`、`0 */2 * * *`）应用最多 5 分钟的
确定性每作业错开窗口。固定小时表达式如 `0 7 * * *` 保持精确。

对于任何 cron 计划，可以使用 `schedule.staggerMs` 设置显式错开窗口
（`0` 保持精确时间）。CLI 快捷方式：

- `--stagger 30s`（或 `1m`、`5m`）设置显式错开窗口。
- `--exact` 强制 `staggerMs = 0`。

### Main vs Isolated 执行

#### Main session 作业（系统事件）

Main 作业将系统事件排队，并可选择唤醒心跳运行器。
它们必须使用 `payload.kind = "systemEvent"`。

- `wakeMode: "now"`（默认）：事件触发立即心跳运行。
- `wakeMode: "next-heartbeat"`：事件等待下一次计划的心跳。

这最适合你希望正常心跳提示 + 主 session 上下文的情况。
参见 [Heartbeat](/gateway/heartbeat)。

#### Isolated 作业（专用 cron session）

Isolated 作业在 session `cron:<jobId>` 或自定义 session 中运行专用的 Agent 回合。

主要行为：

- 提示以 `[cron:<jobId> <job name>]` 为前缀，便于追踪。
- 每次运行启动一个 **全新的 session id**（无先前对话延续），除非使用自定义 session。
- 自定义 session（`session:xxx`）跨运行持久化上下文，支持如每日站会这样构建在之前摘要上的工作流。
- 默认行为：如果省略 `delivery`，隔离作业会通知摘要（`delivery.mode = "announce"`）。
- `delivery.mode` 选择发生的事情：
  - `announce`：向目标 channel 传递摘要，并向主 session 发布简短摘要。
  - `webhook`：当完成事件包含摘要时，将完成事件负载 POST 到 `delivery.to`。
  - `none`：仅内部（无传递，无主 session 摘要）。
- `wakeMode` 控制主 session 摘要何时发布：
  - `now`：立即心跳。
  - `next-heartbeat`：等待下一次计划的心跳。

将 isolated 作业用于嘈杂、频繁或"后台杂务"，这些不应该充斥
你的主聊天历史。

### 负载形状（运行什么）

支持两种负载类型：

- `systemEvent`：仅 main session，通过心跳提示路由。
- `agentTurn`：仅 isolated session，运行专用的 Agent 回合。

常见的 `agentTurn` 字段：

- `message`：必需的文本提示。
- `model` / `thinking`：可选的覆盖（见下文）。
- `timeoutSeconds`：可选的超时覆盖。
- `lightContext`：可选的轻量级引导模式，适用于不需要工作区引导文件注入的作业。

传递配置：

- `delivery.mode`：`none` | `announce` | `webhook`。
- `delivery.channel`：`last` 或特定 channel。
- `delivery.to`：channel 特定目标（announce）或 webhook URL（webhook 模式）。
- `delivery.bestEffort`：如果 announce 传递失败，避免使作业失败。

Announce 传递会抑制运行的消息工具发送；使用 `delivery.channel`/`delivery.to`
来定向聊天。当 `delivery.mode = "none"` 时，不向主 session 发布摘要。

如果对 isolated 作业省略 `delivery`，OpenClaw 默认为 `announce`。

#### Announce 传递流程

当 `delivery.mode = "announce"` 时，cron 直接通过出站 channel 适配器传递。
主 agent 不会启动来制作或转发消息。

行为细节：

- 内容：传递使用 isolated 运行的出站负载（文本/媒体），带有正常的分块和
  channel 格式化。
- 仅心跳响应（`HEARTBEAT_OK` 无实际内容）不会被传递。
- 如果 isolated 运行已经通过 message 工具向同一目标发送了消息，则跳过传递以避免重复。
- 缺失或无效的传递目标会使作业失败，除非 `delivery.bestEffort = true`。
- 只有当 `delivery.mode = "announce"` 时，才向主 session 发布简短摘要。
- 主 session 摘要遵从 `wakeMode`：`now` 触发立即心跳，
  `next-heartbeat` 等待下一次计划的心跳。

#### Webhook 传递流程

当 `delivery.mode = "webhook"` 时，当完成事件包含摘要时，cron 将完成事件负载 POST 到 `delivery.to`。

行为细节：

- 端点必须是有效的 HTTP(S) URL。
- 在 webhook 模式下不尝试 channel 传递。
- 在 webhook 模式下不发布主 session 摘要。
- 如果设置了 `cron.webhookToken`，auth 标头为 `Authorization: Bearer <cron.webhookToken>`。
- 已废弃的回退：存储了 `notify: true` 的旧版作业仍然 POST 到 `cron.webhook`（如果已配置），并带有警告，以便你可以迁移到 `delivery.mode = "webhook"`。

### 模型和 thinking 覆盖

Isolated 作业（`agentTurn`）可以覆盖模型和 thinking 级别：

- `model`：Provider/模型字符串（例如，`anthropic/claude-sonnet-4-20250514`）或别名（例如，`opus`）
- `thinking`：Thinking 级别（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`；仅 GPT-5.2 + Codex 模型）

注意：你也可以在 main session 作业上设置 `model`，但这会更改共享的主
session 模型。建议仅对 isolated 作业使用模型覆盖，以避免
意外的上下文转变。

解析优先级：

1. 作业负载覆盖（最高）
2. Hook 特定的默认值（例如，`hooks.gmail.model`）
3. Agent 配置默认值

### 轻量级引导上下文

Isolated 作业（`agentTurn`）可以设置 `lightContext: true` 以使用轻量级引导上下文运行。

- 对于不需要工作区引导文件注入的计划任务使用此选项。
- 实际上，嵌入式运行时以 `bootstrapContextMode: "lightweight"` 运行，这有意保持 cron 引导上下文为空。
- CLI 等效：`openclaw cron add --light-context ...` 和 `openclaw cron edit --light-context`。

### 传递（channel + 目标）

Isolated 作业可以通过顶层 `delivery` 配置将输出传递到 channel：

- `delivery.mode`：`announce`（channel 传递）、`webhook`（HTTP POST）或 `none`。
- `delivery.channel`：`whatsapp` / `telegram` / `discord` / `slack` / `signal` / `imessage` / `irc` / `googlechat` / `line` / `last`，以及扩展 channels，如 `msteams` / `mattermost`（插件）。
- `delivery.to`：channel 特定的接收者目标。

`announce` 传递仅对 isolated 作业（`sessionTarget: "isolated"`）有效。
`webhook` 传递对 main 和 isolated 作业均有效。

如果省略 `delivery.channel` 或 `delivery.to`，cron 可以回退到主 session 的
"last route"（agent 最后回复的地方）。

目标格式提醒：

- Slack/Discord/Mattermost（插件）目标应使用显式前缀（例如 `channel:<id>`、`user:<id>`）以避免歧义。
  Mattermost 裸 26 字符 ID 解析为 **user-first**（如果 user 存在则 DM，否则 channel）—— 使用 `user:<id>` 或 `channel:<id>` 进行确定性路由。
- Telegram 主题应使用 `:topic:` 形式（见下文）。

#### Telegram 传递目标（主题/论坛线程）

Telegram 通过 `message_thread_id` 支持论坛主题。对于 cron 传递，可以将
主题/线程编码到 `to` 字段中：

- `-1001234567890`（仅 chat id）
- `-1001234567890:topic:123`（推荐：显式主题标记）
- `-1001234567890:123`（简写：数字后缀）

带前缀的目标如 `telegram:...` / `telegram:group:...` 也被接受：

- `telegram:group:-1001234567890:topic:123`

## 工具调用的 JSON schema

使用这些形状直接调用 Gateway `cron.*` 工具（agent 工具调用或 RPC）时。
CLI 标志接受人类可读的持续时间如 `20m`，但工具调用应使用 ISO 8601 字符串
表示 `schedule.at`，使用毫秒表示 `schedule.everyMs`。

### cron.add 参数

一次性的、main session 作业（系统事件）：

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

周期性的、带有传递的 isolated 作业：

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

绑定到当前 session 的周期性作业（在创建时自动解析）：

```json
{
  "name": "Daily standup",
  "schedule": { "kind": "cron", "expr": "0 9 * * *" },
  "sessionTarget": "current",
  "payload": {
    "kind": "agentTurn",
    "message": "Summarize yesterday's progress."
  }
}
```

在自定义持久化 session 中的周期性作业：

```json
{
  "name": "Project monitor",
  "schedule": { "kind": "every", "everyMs": 300000 },
  "sessionTarget": "session:project-alpha-monitor",
  "payload": {
    "kind": "agentTurn",
    "message": "Check project status and update the running log."
  }
}
```

注意：

- `schedule.kind`：`at`（`at`）、`every`（`everyMs`）或 `cron`（`expr`，可选 `tz`）。
- `schedule.at` 接受 ISO 8601（时区可选；省略时视为 UTC）。
- `everyMs` 为毫秒。
- `sessionTarget`：`"main"`、`"isolated"`、`"current"` 或 `"session:<custom-id>"`。
- `"current"` 在创建时解析为 `"session:<sessionKey>"`。
- 自定义 session（`session:xxx`）在运行间保持持久化上下文。
- 可选字段：`agentId`、`description`、`enabled`、`deleteAfterRun`（`at` 的默认值为 true）、
  `delivery`。
- `wakeMode` 省略时默认为 `"now"`。

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

注意：

- `jobId` 是规范的；`id` 可接受以保持兼容性。
- 在 patch 中使用 `agentId: null` 清除 agent 绑定。

### cron.run 和 cron.remove 参数

```json
{ "jobId": "job-123", "mode": "force" }
```

```json
{ "jobId": "job-123" }
```

## 存储 & 历史

- 作业存储：`~/.openclaw/cron/jobs.json`（Gateway 管理的 JSON）。
- 运行历史：`~/.openclaw/cron/runs/<jobId>.jsonl`（JSONL，按大小和行数自动修剪）。
- `sessions.json` 中的 isolated cron 运行 session 由 `cron.sessionRetention` 修剪（默认 `24h`；设置 `false` 禁用）。
- 覆盖存储路径：配置中的 `cron.store`。

## 重试策略

当作业失败时，OpenClaw 将错误分类为**瞬时**（可重试）或**永久**（立即禁用）。

### 瞬时错误（重试）

- 速率限制（429，too many requests，resource exhausted）
- Provider 过载（例如 Anthropic `529 overloaded_error`，过载回退摘要）
- 网络错误（timeout、ECONNRESET、fetch failed、socket）
- 服务器错误（5xx）
- Cloudflare 相关错误

### 永久错误（不重试）

- 认证失败（无效的 API key，unauthorized）
- 配置或验证错误
- 其他非瞬时错误

### 默认行为（无配置）

**一次性作业（`schedule.kind: "at"`）：**

- 瞬时错误：使用指数退避重试最多 3 次（30s → 1m → 5m）。
- 永久错误：立即禁用。
- 成功或跳过：禁用（如果 `deleteAfterRun: true` 则删除）。

**周期性作业（`cron` / `every`）：**

- 任何错误：在下一次计划运行前应用指数退避（30s → 1m → 5m → 15m → 60m）。
- 作业保持启用；退避在下一次成功运行后重置。

配置 `cron.retry` 以覆盖这些默认值（参见 [配置](/automation/cron-jobs#configuration)）。

## 配置

```json5
{
  cron: {
    enabled: true, // 默认 true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1, // 默认 1
    // 可选：覆盖一次性作业的重试策略
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhook: "https://example.invalid/legacy", // 存储了 notify:true 作业的已废弃回退
    webhookToken: "replace-with-dedicated-webhook-token", // webhook 模式的可选 bearer token
    sessionRetention: "24h", // 持续时间字符串或 false
    runLog: {
      maxBytes: "2mb", // 默认 2_000_000 字节
      keepLines: 2000, // 默认 2000
    },
  },
}
```

运行日志修剪行为：

- `cron.runLog.maxBytes`：修剪前的最大运行日志文件大小。
- `cron.runLog.keepLines`：修剪时，仅保留最新的 N 行。
- 两者都适用于 `cron/runs/<jobId>.jsonl` 文件。

Webhook 行为：

- 推荐：按作业设置 `delivery.mode: "webhook"` 与 `delivery.to: "https://..."` 。
- Webhook URL 必须是有效的 `http://` 或 `https://` URL。
- 发布时，负载为 cron 完成事件 JSON。
- 如果设置了 `cron.webhookToken`，auth 标头为 `Authorization: Bearer <cron.webhookToken>`。
- 如果未设置 `cron.webhookToken`，则不发送 `Authorization` 标头。
- 已废弃的回退：存储了 `notify: true` 的旧版作业在存在时仍使用 `cron.webhook`。

完全禁用 cron：

- `cron.enabled: false`（配置）
- `OPENCLAW_SKIP_CRON=1`（环境变量）

## 维护

Cron 有两个内置维护路径：isolated 运行 session 保留和运行日志修剪。

### 默认值

- `cron.sessionRetention`：`24h`（设置 `false` 禁用运行 session 修剪）
- `cron.runLog.maxBytes`：`2_000_000` 字节
- `cron.runLog.keepLines`：`2000`

### 工作原理

- Isolated 运行创建 session 条目（`...:cron:<jobId>:run:<uuid>`）和 transcript 文件。
- Reaper 删除早于 `cron.sessionRetention` 的过期运行 session 条目。
- 对于 session 存储不再引用的已删除运行 session，OpenClaw 归档 transcript 文件并在同一保留窗口内清除旧的已删除存档。
- 每次运行追加后，对 `cron/runs/<jobId>.jsonl` 进行大小检查：
  - 如果文件大小超过 `runLog.maxBytes`，则修剪为最新的 `runLog.keepLines` 行。

### 高容量调度器的性能注意事项

高频 cron 设置可能会产生大量的运行 session 和运行日志占用。维护是内置的，但宽松的限制仍然会造成可避免的 IO 和清理工作。

需要关注的事项：

- 有许多 isolated 运行的长 `cron.sessionRetention` 窗口
- 高 `cron.runLog.keepLines` 与大 `runLog.maxBytes` 结合
- 许多嘈杂的周期性作业写入同一个 `cron/runs/<jobId>.jsonl`

应对措施：

- 将 `cron.sessionRetention` 保持尽可能短，以满足调试/审计需求
- 使用适度的 `runLog.maxBytes` 和 `runLog.keepLines` 来限制运行日志
- 将嘈杂的后台作业移至 isolated 模式，并配置传递规则以避免不必要的干扰
- 定期使用 `openclaw cron runs` 检查增长情况，并在日志变大前调整保留策略

### 自定义示例

将运行 session 保留一周并允许更大的运行日志：

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

禁用 isolated 运行 session 修剪但保留运行日志修剪：

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

针对高容量 cron 使用的调优（示例）：

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

一次性提醒（main session，立即唤醒）：

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

周期性 isolated 作业（通知到 WhatsApp）：

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

带有显式 30 秒错开的周期性 cron 作业：

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

周期性 isolated 作业（传递到 Telegram 主题）：

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

带有模型和 thinking 覆盖的 isolated 作业：

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

Agent 选择（多 agent 设置）：

```bash
# 将作业固定到 agent "ops"（如果该 agent 缺失则回退到默认值）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# 切换或清除现有作业上的 agent
openclaw cron edit <jobId> --agent ops
openclaw cron edit <jobId> --clear-agent
```

手动运行（force 为默认值，使用 `--due` 仅在到期时运行）：

```bash
openclaw cron run <jobId>
openclaw cron run <jobId> --due
```

`cron.run` 现在在手动运行排队后立即确认，而不是等待作业完成。成功的队列响应如 `{ ok: true, enqueued: true, runId }`。如果作业已在运行或 `--due` 发现无到期内容，响应保持为 `{ ok: true, ran: false, reason }`。使用 `openclaw cron runs --id <jobId>` 或 `cron.runs` gateway 方法检查最终的完成条目。

编辑现有作业（patch 字段）：

```bash
openclaw cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
```

强制现有 cron 作业按计划精确运行（无错开）：

```bash
openclaw cron edit <jobId> --exact
```

运行历史：

```bash
openclaw cron runs --id <jobId> --limit 50
```

不创建作业的立即系统事件：

```bash
openclaw system event --mode now --text "Next heartbeat: check battery."
```

## Gateway API 接口

- `cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`
- `cron.run`（force 或 due）、`cron.runs`
  对于不带作业的立即系统事件，使用 [`openclaw system event`](/cli/system)。

## 故障排除

### "什么都不运行"

- 检查 cron 是否启用：`cron.enabled` 和 `OPENCLAW_SKIP_CRON`。
- 检查 Gateway 是否持续运行（cron 在 Gateway 进程内运行）。
- 对于 `cron` 计划：确认时区（`--tz`）与主机时区。

### 周期性作业在失败后持续延迟

- OpenClaw 对周期性作业在连续错误后应用指数重试退避：
  30s、1m、5m、15m，然后重试之间间隔 60m。
- 退避在下一次成功运行后自动重置。
- 一次性（`at`）作业对瞬时错误（rate limit、overloaded、network、server_error）最多重试 3 次并退避；永久错误立即禁用。参见 [重试策略](/automation/cron-jobs#retry-policy)。

### Telegram 传递到错误的位置

- 对于论坛主题，使用 `-100…:topic:<id>` 以明确无歧义。
- 如果在日志或存储的"last route"目标中看到 `telegram:...` 前缀，这是正常的；
  cron 传递接受它们并仍然正确解析主题 ID。

### Subagent announce 传递重试

- 当 subagent 运行完成时，gateway 向请求者 session 通知结果。
- 如果 announce 流程返回 `false`（例如请求者 session 繁忙），gateway 通过 `announceRetryCount` 追踪最多重试 3 次。
- 超过 `endedAt` 后 5 分钟以上的通知会被强制过期，以防止陈旧条目无限循环。
- 如果在日志中看到重复的 announce 传递，请检查 subagent 注册表中 `announceRetryCount` 值较高的条目。
