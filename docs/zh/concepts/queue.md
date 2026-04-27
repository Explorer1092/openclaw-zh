---
title: "Command queue"
sidebarTitle: "Command queue"
mmh3_hash: "4d56afdb629822190fa8063a70a20ce3"
summary: "序列化入站自动回复运行的命令队列设计"
read_when:
  - 更改自动回复执行或并发
---

我们通过一个微小的进程内队列序列化入站自动回复运行（所有 channels），以防止多个 agent 运行冲突，同时仍允许跨 sessions 的安全并行性。

## 为什么

- 自动回复运行可能很昂贵（LLM 调用），当多个入站消息同时到达时可能会冲突。
- 序列化避免竞争共享资源（session 文件、日志、CLI stdin）并减少上游速率限制的可能性。

## 工作原理

- lane 感知的 FIFO 队列以可配置的并发上限排空每个 lane（未配置 lanes 的默认值为 1；main 默认为 4，subagent 为 8）。
- `runEmbeddedPiAgent` 按 **session key** 入队（lane `session:<key>`）以保证每个 session 只有一个活动运行。
- 然后将每个 session 运行排队到 **global lane**（`main` 默认情况下），因此总体并行性由 `agents.defaults.maxConcurrent` 限制。
- 启用 verbose 日志记录时，如果排队的运行在开始之前等待超过 ~2s，则会发出简短通知。
- Typing indicators 仍在入队时立即触发（在 channel 支持时），因此用户体验在我们等待轮到我们时保持不变。

## 队列模式（每个 channel）

入站消息可以引导当前运行、等待 followup 回合或两者都做：

- `steer`：立即注入到当前运行中（在下一个 tool 边界后取消待处理的 tool 调用）。如果不是 streaming，则退回到 followup。
- `followup`：在当前运行结束后为下一个 agent 回合入队。
- `collect`：将所有排队的消息合并到 **单个** followup 回合中（默认）。如果消息针对不同的 channels/threads，它们会单独排空以保留路由。
- `steer-backlog`（aka `steer+backlog`）：现在引导 **并** 保留消息以供 followup 回合。
- `interrupt`（传统）：中止该 session 的活动运行，然后运行最新消息。
- `queue`（传统别名）：与 `steer` 相同。

Steer-backlog 意味着你可以在引导运行后获得 followup 响应，因此 streaming surfaces 可能看起来像重复。如果你希望每个入站消息一个响应，请首选 `collect`/`steer`。
发送 `/queue collect` 作为独立命令（每个 session）或设置 `messages.queue.byChannel.discord: "collect"`。

默认值（在配置中未设置时）：

- 所有 surfaces → `collect`

通过 `messages.queue` 全局或按 channel 配置：

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## 队列选项

选项适用于 `followup`、`collect` 和 `steer-backlog`（以及 `steer` 退回到 followup 时）：

- `debounceMs`：在开始 followup 回合之前等待安静（防止"继续，继续"）。
- `cap`：每个 session 的最大排队消息数。
- `drop`：溢出 policy（`old`、`new`、`summarize`）。

Summarize 保留已删除消息的简短项目符号列表，并将其作为合成 followup prompt 注入。
默认值：`debounceMs: 1000`、`cap: 20`、`drop: summarize`。

## 每个 session 的覆盖

- 发送 `/queue <mode>` 作为独立命令以存储当前 session 的模式。
- 选项可以组合：`/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 清除 session 覆盖。

## 范围和保证

- 适用于使用 gateway 回复管道的所有入站 channels 的自动回复 agent 运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认 lane（`main`）是进程范围的，用于入站 + main heartbeats；设置 `agents.defaults.maxConcurrent` 以允许多个 sessions 并行。
- 可能存在其他 lanes（例如 `cron`、`cron-nested`、`nested`、`subagent`），因此后台作业可以并行运行而不会阻止入站回复。隔离的 cron agent 回合在其内部 agent 执行使用 `cron-nested` 时持有 `cron` 槽；两者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流保持其自己的 lane 行为。这些分离的运行被跟踪为[后台任务](/automation/tasks)。
- 每个 session 的 lanes 保证一次只有一个 agent 运行触摸给定的 session。
- 没有外部依赖项或后台工作线程；纯 TypeScript + promises。

## 故障排除

- 如果命令似乎卡住，启用 verbose 日志并查找"queued for ...ms"行以确认队列正在排空。
- 如果你需要队列深度，启用 verbose 日志并观察队列计时行。

## Related

- [Session management](/concepts/session)
- [Retry policy](/concepts/retry)
