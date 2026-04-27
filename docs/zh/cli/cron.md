---
mmh3_hash: "5cbc45a3dcfda5122ba8f59d19c718d9"
title: "`openclaw cron`"
sidebarTitle: "openclaw cron"
summary: "`openclaw cron` 的 CLI 参考(安排和运行后台作业)"
read_when:
  - 您想要计划任务和唤醒
  - 您正在调试 cron 执行和日志
---

# `openclaw cron`

管理 Gateway 调度程序的 cron 作业。

<Tip>
运行 `openclaw cron --help` 查看完整的命令界面。参见 [Cron 作业](/automation/cron-jobs) 了解概念指南。
</Tip>

## Session

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

- `main` 绑定到 Agent 的主 Session。
- `isolated` 为每次运行创建新的转录和 Session ID。
- `current` 在创建时绑定到活动 Session。
- `session:<id>` 固定到显式持久 Session 密钥。

隔离运行会重置环境对话上下文。Channel 和群组路由、发送/队列策略、提升、来源和 ACP 运行时绑定会为新运行重置。安全偏好设置以及用户显式选择的模型或认证覆盖可以跨运行保留。

## Delivery

`openclaw cron list` 和 `openclaw cron show <job-id>` 预览已解析的传递路由。对于 `channel: "last"`，预览会显示路由是从主 Session 还是当前 Session 解析的，或者是否会失败关闭。

<Note>
隔离的 `cron add` 作业默认使用 `--announce` 传递。使用 `--no-deliver` 保持输出内部。`--deliver` 仍作为 `--announce` 的已弃用别名保留。
</Note>

### Delivery 所有权

隔离 cron 聊天 delivery 由 Agent 和运行器共享：

- Agent 可以在聊天路由可用时使用 `message` 工具直接发送。
- `announce` 仅在 Agent 未直接发送到已解析目标时作为最终回复的回退传递。
- `webhook` 将完成的负载发布到 URL。
- `none` 禁用运行器回退传递。

`--announce` 是最终回复的运行器回退传递。`--no-deliver` 禁用该回退，但在聊天路由可用时不会移除 Agent 的 `message` 工具。

从活动聊天创建的提醒会为回退通知传递保留实时聊天传递目标。内部 Session 密钥可能是小写的；不要将其用作区分大小写的 Provider ID（如 Matrix 房间 ID）的真实来源。

### 失败传递

失败通知按以下顺序解析：

1. 作业上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 作业的主要通知目标（未设置显式失败目标时）。

<Note>
主 Session 作业仅在主传递模式为 `webhook` 时才能使用 `delivery.failureDestination`。隔离作业在所有模式下均可接受。
</Note>

注意：隔离 cron 运行将运行级别的 Agent 失败视为作业错误，即使未产生回复负载，因此模型/Provider 失败仍会增加错误计数器并触发失败通知。

## 调度

### 一次性作业

`--at <datetime>` 安排一次性运行。无偏移量的日期时间被视为 UTC，除非您还传递 `--tz <iana>`，这会在给定时区中解释本地挂钟时间。

<Note>
一次性作业默认在成功后删除。使用 `--keep-after-run` 来保留它们。
</Note>

### 重复作业

重复作业在连续错误后使用指数重试退避：30秒、1分钟、5分钟、15分钟、60分钟。下次成功运行后恢复正常计划。

跳过的运行与执行错误分开跟踪。它们不影响重试退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以将失败警报加入重复跳过运行通知。

注意：cron 作业定义存储在 `jobs.json` 中，待处理的运行时状态存储在 `jobs-state.json` 中。如果 `jobs.json` 被外部编辑，Gateway 会重新加载更改的计划并清除过时的待处理时段；仅格式化的重写不会清除待处理时段。

### 手动运行

`openclaw cron run` 在手动运行排队后立即返回。成功响应包括 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 跟踪最终结果。

<Note>
`openclaw cron run <job-id>` 默认强制运行。使用 `--due` 保持旧的"仅在到期时运行"行为。
</Note>

## 模型

`cron add|edit --model <ref>` 为作业选择一个允许的模型。

<Warning>
如果模型不被允许，cron 会警告并回退到作业的 Agent 或默认模型选择。配置的回退链仍然适用，但没有显式每作业回退列表的普通模型覆盖不再将 Agent 主模型作为隐藏的额外重试目标附加。
</Warning>

### 隔离 cron 模型优先级

隔离 cron 按以下顺序解析活动模型：

1. Gmail hook 覆盖。
2. 每作业 `--model`。
3. 存储的 cron-Session 模型覆盖（用户已选择时）。
4. Agent 或默认模型选择。

### 快速模式

隔离 cron 快速模式遵循已解析的实时模型选择。模型配置 `params.fastMode` 默认应用，但存储的 Session `fastMode` 覆盖仍优先于配置。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 在重试前会持久化切换的 Provider 和模型（以及切换的认证配置文件覆盖，如果存在）。外部重试循环在初始尝试后限制为两次切换重试，然后中止而不是无限循环。

## 运行输出和拒绝

### 过时确认抑制

隔离 cron 轮次会抑制过时的仅确认回复。如果第一个结果只是中间状态更新且没有后代子 Agent 运行负责最终答案，cron 在传递前会重新提示一次获取真实结果。

### 静默令牌抑制

如果隔离 cron 运行仅返回静默令牌（`NO_REPLY` 或 `no_reply`），cron 会抑制直接出站传递以及回退排队摘要路径，因此不会向聊天发布任何内容。

### 结构化拒绝

隔离 cron 运行优先使用嵌入式运行中的结构化执行拒绝元数据，然后回退到最终输出中的已知拒绝标记，如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和批准绑定拒绝短语。

`cron list` 和运行历史显示拒绝原因，而非将被阻止的命令报告为 `ok`。

## 保留

保留和清理由配置控制：

- `cron.sessionRetention`（默认 `24h`）清理已完成的隔离运行 Session。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 迁移旧版作业

<Note>
如果您有当前传递和存储格式之前的旧版 cron 作业，请运行 `openclaw doctor --fix`。Doctor 规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层传递字段（包括旧版 `threadId`）、payload `provider` 传递别名），并在配置了 `cron.webhook` 的情况下将简单的 `notify: true` webhook 回退作业迁移为显式 webhook 传递。
</Note>

## 常见编辑

在不更改消息的情况下更新传递设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离作业禁用传递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离作业启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定 Channel 通知：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

使用轻量级引导上下文创建隔离作业：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离的 Agent 轮次作业。对于 cron 运行，轻量级模式将引导上下文保持为空，而不是注入完整的工作区引导集。

## 常见管理命令

手动运行和检查：

```bash
openclaw cron list
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`cron runs` 条目包括传递诊断信息，包括预期的 cron 目标、已解析的目标、消息工具发送、回退使用情况和已传递状态。

Agent 和 Session 重新定向：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

传递调整：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关

- [CLI 参考](/cli)
- [计划任务](/automation/cron-jobs)
