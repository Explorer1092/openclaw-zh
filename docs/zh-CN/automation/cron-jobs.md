---
read_when:
  - 调度后台任务或唤醒
  - 配置需要与心跳一起或并行运行的自动化
  - 在心跳和定时任务之间做选择
summary: Gateway 网关调度器的定时任务与唤醒
title: 定时任务
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: dc249f932eae38dad73efa95a78680e4ed6a9b1e65712ad4361d6ed496a89309
  source_path: automation/cron-jobs.md
  workflow: 15
---

# 定时任务（Gateway 网关调度器）

> **定时任务还是心跳？** 请参阅[定时任务与心跳对比](/automation/cron-vs-heartbeat)了解何时使用哪种方式。

定时任务是 Gateway 网关内置的调度器。它持久化任务、在合适的时间唤醒智能体，并可选择将输出发送回聊天。

所有定时任务执行均会创建[后台任务](/automation/tasks)记录。关键区别在于可见性：

- `sessionTarget: "main"` 创建带 `silent` 通知策略的任务——它为主会话和心跳流调度一个系统事件，但不产生通知。
- `sessionTarget: "isolated"` 或 `sessionTarget: "session:..."` 创建可见任务，显示在 `openclaw tasks` 中并带有投递通知。

如果你想要 _"每天早上运行"_ 或 _"20 分钟后提醒智能体"_，定时任务就是对应的机制。

故障排除：[/automation/troubleshooting](/automation/troubleshooting)

## 简要概述

- 定时任务运行在 **Gateway 网关内部**（而非模型内部）。
- 任务持久化存储在 `~/.openclaw/cron/` 下，因此重启不会丢失计划。
- 两种执行方式：
  - **主会话**：入队一个系统事件，然后在下一次心跳时运行。
  - **隔离式**：在 `cron:<jobId>` 或自定义会话中运行专用智能体轮次，可投递摘要（默认 announce）或不投递。
  - **当前会话**：绑定到创建定时任务时的会话 (`sessionTarget: "current"`)。
  - **自定义会话**：在持久化的命名会话中运行 (`sessionTarget: "session:custom-id"`)。
- 唤醒是一等功能：任务可以请求"立即唤醒"或"下次心跳时"。
- Webhook 投递通过 `delivery.mode = "webhook"` + `delivery.to = "<url>"` 按任务配置。
- 旧版兼容：存储了 `notify: true` 且设置了 `cron.webhook` 的旧任务仍有回退支持，建议将这些任务迁移到 webhook 投递模式。
- 升级时，`openclaw doctor --fix` 可在调度器访问前规范化旧版 cron 存储字段。

## 快速开始（可操作）

创建一个一次性提醒，验证其存在，然后立即运行：

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

调度一个带投递功能的周期性隔离任务：

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

## 工具调用等价形式（Gateway 网关定时任务工具）

有关规范的 JSON 结构和示例，请参阅[工具调用的 JSON 模式](/automation/cron-jobs#json-schema-for-tool-calls)。

## 定时任务的存储位置

定时任务默认持久化存储在 Gateway 网关主机的 `~/.openclaw/cron/jobs.json` 中。Gateway 网关将文件加载到内存中，并在更改时写回，因此仅在 Gateway 网关停止时手动编辑才是安全的。请优先使用 `openclaw cron add/edit` 或定时任务工具调用 API 进行更改。

## 新手友好概述

将定时任务理解为：**何时**运行 + **做什么**。

1. **选择调度计划**
   - 一次性提醒 → `schedule.kind = "at"`（CLI：`--at`）
   - 重复任务 → `schedule.kind = "every"` 或 `schedule.kind = "cron"`
   - 如果你的 ISO 时间戳省略了时区，将被视为 **UTC**。

2. **选择运行位置**
   - `sessionTarget: "main"` → 在下一次心跳时使用主会话上下文运行。
   - `sessionTarget: "isolated"` → 在 `cron:<jobId>` 中运行专用智能体轮次。
   - `sessionTarget: "current"` → 绑定到当前会话（创建时解析为 `session:<sessionKey>`）。
   - `sessionTarget: "session:custom-id"` → 在持久化的命名会话中运行，跨运行保持上下文。

   默认行为（保持不变）：
   - `systemEvent` 负载默认使用 `main`
   - `agentTurn` 负载默认使用 `isolated`

   要使用当前会话绑定，需显式设置 `sessionTarget: "current"`。

3. **选择负载**
   - 主会话 → `payload.kind = "systemEvent"`
   - 隔离会话 → `payload.kind = "agentTurn"`

可选：一次性任务（`schedule.kind = "at"`）默认会在成功运行后删除。设置
`deleteAfterRun: false` 可保留它（成功后会禁用）。

## 概念

### 任务

定时任务是一条存储记录，包含：

- 一个**调度计划**（何时运行），
- 一个**负载**（做什么），
- 可选的**投递模式**（`announce`、`webhook` 或 `none`）。
- 可选的**智能体绑定**（`agentId`）：在指定智能体下运行任务；如果缺失或未知，Gateway 网关会回退到默认智能体。

任务通过稳定的 `jobId` 标识（用于 CLI/Gateway 网关 API）。
在智能体工具调用中，`jobId` 是规范字段；旧版 `id` 仍可兼容使用。
一次性任务默认会在成功运行后自动删除；设置 `deleteAfterRun: false` 可保留它。

### 调度计划

定时任务支持三种调度类型：

- `at`：一次性时间戳，通过 `schedule.at`（ISO 8601）指定。
- `every`：固定间隔（毫秒）。
- `cron`：5 字段 cron 表达式（或带秒的 6 字段），可选 IANA 时区。

Cron 表达式使用 `croner`。如果省略时区，将使用 Gateway 网关主机的本地时区。

为了减少多 Gateway 网关场景下整点时刻的负载峰值，OpenClaw 对周期性整点表达式（例如 `0 * * * *`、`0 */2 * * *`）应用最多 5 分钟的确定性每任务错峰窗口。固定小时表达式（如 `0 7 * * *`）保持精确。

对于任何 cron 调度，你可以通过 `schedule.staggerMs` 设置显式错峰窗口（`0` 表示精确定时）。CLI 快捷方式：

- `--stagger 30s`（或 `1m`、`5m`）设置显式错峰窗口。
- `--exact` 强制 `staggerMs = 0`。

### 主会话与隔离式执行

#### 主会话任务（系统事件）

主会话任务入队一个系统事件，并可选择唤醒心跳运行器。它们必须使用 `payload.kind = "systemEvent"`。

- `wakeMode: "now"`（默认）：事件触发立即心跳运行。
- `wakeMode: "next-heartbeat"`：事件等待下一次计划心跳。

当你需要正常的心跳提示 + 主会话上下文时，这是最佳选择。参见[心跳](/gateway/heartbeat)。

主会话定时任务创建带 `silent` 通知策略的[后台任务](/automation/tasks)记录（默认无通知）。它们显示在 `openclaw tasks list` 中，但不产生投递消息。

#### 隔离任务（专用定时会话）

隔离任务在会话 `cron:<jobId>` 或自定义会话中运行专用智能体轮次。

关键行为：

- 提示以 `[cron:<jobId> <任务名称>]` 为前缀，便于追踪。
- 每次运行都会启动一个**全新的会话 ID**（不继承之前的对话），除非使用自定义会话。
- 自定义会话（`session:xxx`）可跨运行保持上下文，适用于如每日站会等需要基于前次摘要的工作流。
- 默认行为：如果省略 `delivery`，隔离任务会以"announce"方式投递摘要（`delivery.mode = "announce"`）。
- `delivery.mode` 选择后续行为：
  - `announce`：将摘要投递到目标渠道，并在主会话中发布简短摘要。
  - `webhook`：当完成事件包含摘要时，将完成事件负载 POST 到 `delivery.to`。
  - `none`：仅内部运行（无投递，无主会话摘要）。
- `wakeMode` 控制主会话摘要的发布时机：
  - `now`：立即心跳。
  - `next-heartbeat`：等待下一次计划心跳。

对于嘈杂、频繁或"后台杂务"类任务，使用隔离任务可以避免污染你的主聊天记录。

这些分离运行会创建[后台任务](/automation/tasks)记录，在 `openclaw tasks` 中可见，并受任务审计和维护管理。

### 负载结构（运行内容）

支持两种负载类型：

- `systemEvent`：仅限主会话，通过心跳提示路由。
- `agentTurn`：仅限隔离会话，运行专用智能体轮次。

常用 `agentTurn` 字段：

- `message`：必填文本提示。
- `model` / `thinking`：可选覆盖（见下文）。
- `timeoutSeconds`：可选超时覆盖。
- `lightContext`：可选轻量引导模式，适用于不需要工作区引导文件注入的任务。

投递配置：

- `delivery.mode`：`none` | `announce` | `webhook`。
- `delivery.channel`：`last` 或指定渠道。
- `delivery.to`：渠道特定目标（announce）或 webhook URL（webhook 模式）。
- `delivery.bestEffort`：投递失败时避免任务失败。

announce 投递会抑制该运行的消息工具发送；请使用 `delivery.channel`/`delivery.to` 来指定目标。当 `delivery.mode = "none"` 时，不向主会话发布摘要。

如果省略隔离任务的 `delivery`，OpenClaw 默认使用 `announce`。

#### Announce 投递流程

当 `delivery.mode = "announce"` 时，定时任务直接通过出站渠道适配器投递。主智能体不会被启动来撰写或转发消息。

行为细节：

- 内容：投递使用隔离运行的出站负载（文本/媒体），带正常分块和渠道格式化。
- 仅 `HEARTBEAT_OK` 响应（无实际内容）不会被投递。
- 如果隔离运行已通过消息工具向相同目标发送了消息，则跳过投递以避免重复。
- 缺失或无效的投递目标会导致任务失败，除非 `delivery.bestEffort = true`。
- 仅在 `delivery.mode = "announce"` 时才会向主会话发布简短摘要。
- 主会话摘要遵循 `wakeMode`：`now` 触发立即心跳，`next-heartbeat` 等待下一次计划心跳。

#### Webhook 投递流程

当 `delivery.mode = "webhook"` 时，当完成事件包含摘要时，定时任务将完成事件负载 POST 到 `delivery.to`。

行为细节：

- 端点必须是有效的 HTTP(S) URL。
- Webhook 模式下不尝试渠道投递。
- Webhook 模式下不向主会话发布摘要。
- 如果设置了 `cron.webhookToken`，认证头为 `Authorization: Bearer <cron.webhookToken>`。
- 旧版回退：存储了 `notify: true` 的旧任务仍会（如已配置）发布到 `cron.webhook`，并附带警告以便迁移到 `delivery.mode = "webhook"`。

### 模型和思维覆盖

隔离任务（`agentTurn`）可以覆盖模型和思维级别：

- `model`：提供商/模型字符串（例如 `anthropic/claude-sonnet-4-20250514`）或别名（例如 `opus`）
- `thinking`：思维级别（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`；仅限 GPT-5.2 + Codex 模型）

注意：你也可以在主会话任务上设置 `model`，但这会更改共享的主会话模型。我们建议仅对隔离任务使用模型覆盖，以避免意外的上下文切换。

优先级解析顺序：

1. 任务负载覆盖（最高优先级）
2. Hook 特定默认值（例如 `hooks.gmail.model`）
3. 智能体配置默认值

### 轻量引导上下文

隔离任务（`agentTurn`）可以设置 `lightContext: true` 以使用轻量引导上下文运行。

- 适用于不需要工作区引导文件注入的计划性杂务。
- 实际上，嵌入式运行时以 `bootstrapContextMode: "lightweight"` 运行，这有意保持 cron 引导上下文为空。
- CLI 等价形式：`openclaw cron add --light-context ...` 和 `openclaw cron edit --light-context`。

### 投递（渠道 + 目标）

隔离任务可以通过顶层 `delivery` 配置投递输出：

- `delivery.mode`：`announce`（渠道投递）、`webhook`（HTTP POST）或 `none`。
- `delivery.channel`：`whatsapp` / `telegram` / `discord` / `slack` / `signal` / `imessage` / `irc` / `googlechat` / `line` / `last`，以及扩展渠道如 `msteams` / `mattermost`（插件）。
- `delivery.to`：渠道特定的接收目标。

`announce` 投递仅对隔离任务（`sessionTarget: "isolated"`）有效。
`webhook` 投递对主会话和隔离任务均有效。

如果省略 `delivery.channel` 或 `delivery.to`，定时任务可回退到主会话的"最后路由"（智能体最后回复的位置）。

目标格式提醒：

- Slack/Discord/Mattermost（插件）目标应使用明确前缀（例如 `channel:<id>`、`user:<id>`）以避免歧义。
  Mattermost 裸 26 字符 ID 按**用户优先**解析（用户存在则为私信，否则为频道）——使用 `user:<id>` 或 `channel:<id>` 实现确定性路由。
- Telegram 主题应使用 `:topic:` 格式（见下文）。

#### Telegram 投递目标（主题/论坛帖子）

Telegram 通过 `message_thread_id` 支持论坛主题。对于定时任务投递，你可以将主题/帖子编码到 `to` 字段中：

- `-1001234567890`（仅聊天 ID）
- `-1001234567890:topic:123`（推荐：明确的主题标记）
- `-1001234567890:123`（简写：数字后缀）

带前缀的目标如 `telegram:...` / `telegram:group:...` 也可接受：

- `telegram:group:-1001234567890:topic:123`

## 工具调用的 JSON 模式

直接调用 Gateway 网关 `cron.*` 工具（智能体工具调用或 RPC）时使用这些结构。CLI 标志接受人类可读的时间格式如 `20m`，但工具调用应使用 ISO 8601 字符串作为 `schedule.at`，并使用毫秒作为 `schedule.everyMs`。

### cron.add 参数

一次性主会话任务（系统事件）：

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

带投递的周期性隔离任务：

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

绑定到当前会话的周期性任务（创建时自动解析）：

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

在自定义持久化会话中运行的周期性任务：

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

说明：

- `schedule.kind`：`at`（`at`）、`every`（`everyMs`）或 `cron`（`expr`，可选 `tz`）。
- `schedule.at` 接受 ISO 8601。工具/API 值若无时区则按 UTC 处理；CLI 也接受 `openclaw cron add|edit --at "<offset-less-iso>" --tz <iana>` 形式的本地时钟一次性任务。
- `everyMs` 为毫秒数。
- `sessionTarget`：`"main"`、`"isolated"`、`"current"` 或 `"session:<custom-id>"`。
- `"current"` 在创建时解析为 `"session:<sessionKey>"`。
- 自定义会话（`session:xxx`）可跨运行保持持久化上下文。
- 可选字段：`agentId`、`description`、`enabled`、`deleteAfterRun`（`at` 类型默认为 true）、`delivery`。
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

说明：

- `jobId` 是规范字段；`id` 可兼容使用。
- 在补丁中使用 `agentId: null` 可清除智能体绑定。

### cron.run 和 cron.remove 参数

```json
{ "jobId": "job-123", "mode": "force" }
```

```json
{ "jobId": "job-123" }
```

## 存储与历史

- 任务存储：`~/.openclaw/cron/jobs.json`（Gateway 网关管理的 JSON）。
- 运行历史：`~/.openclaw/cron/runs/<jobId>.jsonl`（JSONL，按大小和行数自动清理）。
- 隔离 cron 运行会话在 `sessions.json` 中按 `cron.sessionRetention` 清理（默认 `24h`；设为 `false` 可禁用）。
- 覆盖存储路径：配置中的 `cron.store`。

## 重试策略

当任务失败时，OpenClaw 将错误分类为**瞬时**（可重试）或**永久**（立即禁用）。

### 瞬时错误（重试）

- 速率限制（429，请求过多，资源耗尽）
- 提供商过载（例如 Anthropic `529 overloaded_error`，过载回退摘要）
- 网络错误（超时、ECONNRESET、fetch 失败、socket）
- 服务器错误（5xx）
- Cloudflare 相关错误

### 永久错误（不重试）

- 认证失败（API 密钥无效，未授权）
- 配置或验证错误
- 其他非瞬时错误

### 默认行为（无配置）

**一次性任务（`schedule.kind: "at"`）：**

- 瞬时错误：以指数退避（30s → 1m → 5m）最多重试 3 次。
- 永久错误：立即禁用。
- 成功或跳过：禁用（或在 `deleteAfterRun: true` 时删除）。

**周期性任务（`cron` / `every`）：**

- 任何错误：在下次计划运行前应用指数退避（30s → 1m → 5m → 15m → 60m）。
- 任务保持启用状态；下次成功运行后退避重置。

通过 `cron.retry` 配置可覆盖这些默认值（参见[配置](/automation/cron-jobs#configuration)）。

## 配置

```json5
{
  cron: {
    enabled: true, // 默认 true
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 1, // 默认 1
    // 可选：覆盖一次性任务的重试策略
    retry: {
      maxAttempts: 3,
      backoffMs: [60000, 120000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "server_error"],
    },
    webhook: "https://example.invalid/legacy", // 已弃用：存储了 notify:true 的旧任务的回退
    webhookToken: "replace-with-dedicated-webhook-token", // webhook 模式的可选 Bearer token
    sessionRetention: "24h", // 时间字符串或 false
    runLog: {
      maxBytes: "2mb", // 默认 2_000_000 字节
      keepLines: 2000, // 默认 2000
    },
  },
}
```

运行日志清理行为：

- `cron.runLog.maxBytes`：清理前的最大运行日志文件大小。
- `cron.runLog.keepLines`：清理时，仅保留最新的 N 行。
- 两者均适用于 `cron/runs/<jobId>.jsonl` 文件。

Webhook 行为：

- 推荐：按任务设置 `delivery.mode: "webhook"` 和 `delivery.to: "https://..."`。
- Webhook URL 必须是有效的 `http://` 或 `https://` URL。
- 发布时，负载为 cron 完成事件 JSON。
- 如果设置了 `cron.webhookToken`，认证头为 `Authorization: Bearer <cron.webhookToken>`。
- 如果未设置 `cron.webhookToken`，则不发送 `Authorization` 头。
- 旧版回退：存储了 `notify: true` 的旧任务仍会（如存在）使用 `cron.webhook`。

完全禁用定时任务：

- `cron.enabled: false`（配置）
- `OPENCLAW_SKIP_CRON=1`（环境变量）

## 维护

Cron 有两条内置维护路径：隔离运行会话保留和运行日志清理。

### 默认值

- `cron.sessionRetention`：`24h`（设为 `false` 可禁用运行会话清理）
- `cron.runLog.maxBytes`：`2_000_000` 字节
- `cron.runLog.keepLines`：`2000`

### 工作原理

- 隔离运行会创建会话条目（`...:cron:<jobId>:run:<uuid>`）和转录文件。
- 清理程序删除早于 `cron.sessionRetention` 的过期运行会话条目。
- 对于不再被会话存储引用的已删除运行会话，OpenClaw 归档转录文件并在相同保留窗口内清理旧的已删除归档。
- 每次运行追加后，会对 `cron/runs/<jobId>.jsonl` 进行大小检查：
  - 如果文件大小超过 `runLog.maxBytes`，则裁剪至最新的 `runLog.keepLines` 行。

### 高频调度的性能注意事项

高频 cron 配置可能产生大量运行会话和运行日志。维护功能已内置，但宽松的限制仍可能造成不必要的 IO 和清理工作。

需要关注：

- 长 `cron.sessionRetention` 窗口加上大量隔离运行
- 高 `cron.runLog.keepLines` 配合大 `runLog.maxBytes`
- 多个嘈杂的周期性任务写入同一 `cron/runs/<jobId>.jsonl`

应对措施：

- 在满足调试/审计需求的前提下，尽量缩短 `cron.sessionRetention`
- 用适中的 `runLog.maxBytes` 和 `runLog.keepLines` 限制运行日志大小
- 将嘈杂的后台任务移至隔离模式，并配置避免不必要通知的投递规则
- 定期用 `openclaw cron runs` 检查增长情况，在日志变大之前调整保留策略

### 自定义示例

保留运行会话一周并允许更大的运行日志：

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

禁用隔离运行会话清理但保留运行日志清理：

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

针对高频 cron 使用的调优示例：

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

一次性提醒（主会话，立即唤醒）：

```bash
openclaw cron add \
  --name "Calendar check" \
  --at "20m" \
  --session main \
  --system-event "Next heartbeat: check calendar." \
  --wake now
```

周期性隔离任务（投递到 WhatsApp）：

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

带显式 30 秒错峰的周期性 cron 任务：

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

周期性隔离任务（投递到 Telegram 主题）：

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

带模型和思维覆盖的隔离任务：

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

智能体选择（多智能体配置）：

```bash
# 将任务绑定到智能体 "ops"（如果该智能体不存在则回退到默认智能体）
openclaw cron add --name "Ops sweep" --cron "0 6 * * *" --session isolated --message "Check ops queue" --agent ops

# 切换或清除现有任务的智能体
openclaw cron edit <jobId> --agent ops
openclaw cron edit <jobId> --clear-agent
```

手动运行（强制为默认，使用 `--due` 仅在到期时运行）：

```bash
openclaw cron run <jobId>
openclaw cron run <jobId> --due
```

`cron.run` 现在在手动运行入队时即返回确认，而非等待任务完成。成功入队的响应形如 `{ ok: true, enqueued: true, runId }`。如果任务已在运行或 `--due` 未发现到期任务，响应为 `{ ok: true, ran: false, reason }`。使用 `openclaw cron runs --id <jobId>` 或 `cron.runs` Gateway 方法检查最终的完成条目。

编辑现有任务（补丁字段）：

```bash
openclaw cron edit <jobId> \
  --message "Updated prompt" \
  --model "opus" \
  --thinking low
```

强制现有 cron 任务按精确计划运行（无错峰）：

```bash
openclaw cron edit <jobId> --exact
```

运行历史：

```bash
openclaw cron runs --id <jobId> --limit 50
```

不创建任务直接发送系统事件：

```bash
openclaw system event --mode now --text "Next heartbeat: check battery."
```

## Gateway 网关 API 接口

- `cron.list`、`cron.status`、`cron.add`、`cron.update`、`cron.remove`
- `cron.run`（强制或到期）、`cron.runs`
  如需不创建任务直接发送系统事件，请使用 [`openclaw system event`](/cli/system)。

## 故障排除

### "没有任何任务运行"

- 检查定时任务是否已启用：`cron.enabled` 和 `OPENCLAW_SKIP_CRON`。
- 检查 Gateway 网关是否持续运行（定时任务运行在 Gateway 网关进程内部）。
- 对于 `cron` 调度：确认时区（`--tz`）与主机时区的关系。

### 周期性任务在失败后持续延迟

- OpenClaw 对周期性任务在连续错误后应用指数重试退避：
  30s、1m、5m、15m，然后是 60m。
- 下次成功运行后退避自动重置。
- 一次性（`at`）任务对瞬时错误（速率限制、过载、网络、server_error）最多重试 3 次并退避；永久错误立即禁用。参见[重试策略](/automation/cron-jobs#retry-policy)。

### Telegram 投递到了错误的位置

- 对于论坛主题，使用 `-100…:topic:<id>` 以确保明确无歧义。
- 如果你在日志或存储的"最后路由"目标中看到 `telegram:...` 前缀，这是正常的；定时任务投递接受这些前缀并仍能正确解析主题 ID。

### 子智能体 announce 投递重试

- 子智能体运行完成后，Gateway 网关向请求会话通知结果。
- 如果 announce 流程返回 `false`（例如请求会话繁忙），Gateway 网关通过 `announceRetryCount` 跟踪最多重试 3 次。
- 超过 `endedAt` 后 5 分钟的通知会被强制过期，以防止陈旧条目无限循环。
- 如果你在日志中看到重复的 announce 投递，请检查子智能体注册表中 `announceRetryCount` 值较高的条目。
