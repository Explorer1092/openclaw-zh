---
title: "Command queue"
sidebarTitle: "Command queue"
mmh3_hash: "f975fbfd7048ff6d85803c1b4ab2e25a"
summary: "自动回复队列模式、默认值和 per-session 覆盖"
read_when:
  - 更改自动回复执行或并发设置
  - 解释 /queue 模式或消息 steering 行为
---

我们通过一个小型进程内队列对入站自动回复运行（所有 channel）进行序列化，以防止多个 agent 运行相互冲突，同时仍允许跨 session 的安全并行。

## 为什么

- 自动回复运行可能代价高昂（LLM 调用），当多条入站消息接近同时到达时可能发生冲突。
- 序列化避免了对共享资源（session 文件、日志、CLI stdin）的竞争，并降低了触发上游速率限制的可能性。

## 工作原理

- 通道感知的 FIFO 队列以可配置的并发上限处理每个通道（未配置通道默认为 1；main 默认为 4，subagent 为 8）。
- `runEmbeddedPiAgent` 按 **session 键**（通道 `session:<key>`）入队，以保证每个 session 同时只有一个活跃运行。
- 每个 session 运行随后进入**全局通道**（默认 `main`），以便 `agents.defaults.maxConcurrent` 限制整体并行度。
- 启用详细日志时，排队的运行在等待超过约 2 秒后会发出简短通知。
- Typing indicator 在入队时立即触发（当 channel 支持时），因此等待期间用户体验不受影响。

## 默认值

未设置时，所有入站 channel 界面使用：

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` 是默认值，因为它在不启动第二个 session 运行的情况下保持活跃 model 轮次的响应性。它在下一个 model 边界之前汇集所有到达的 steering 消息。如果当前运行无法接受 steering，OpenClaw 回退到 followup 队列条目。

## 队列模式

入站消息可以引导当前运行、等待后续轮次，或两者都做：

- `steer`：将 steering 消息排入活跃运行时。Pi 在**当前 assistant 轮次完成其工具调用后**投递所有待处理的 steering 消息，在下一次 LLM 调用之前；Codex app-server 接收一个批量 `turn/steer`。如果运行没有在活跃 streaming 中或 steering 不可用，OpenClaw 回退到 followup 队列条目。
- `queue`（传统）：旧的逐一 steering。Pi 在每个 model 边界投递一条排队的 steering 消息；Codex app-server 接收单独的 `turn/steer` 请求。除非需要之前的序列化行为，否则优先使用 `steer`。
- `followup`：将每条消息排队等待当前运行结束后的后续 agent 轮次。
- `collect`：在安静窗口后将排队的消息合并为**单个** followup 轮次。如果消息针对不同的 channel/thread，它们会单独排出以保留路由。
- `steer-backlog`（又称 `steer+backlog`）：立即 steer **并且**为 followup 轮次保留相同消息。
- `interrupt`（传统）：中止该 session 的活跃运行，然后运行最新消息。

Steer-backlog 意味着在 steered 运行后可以获得 followup 响应，因此在 streaming 界面上看起来像重复。如果需要每条入站消息一个响应，优先使用 `collect`/`steer`。

有关运行时特定的时序和依赖行为，参见 [Steering queue](/concepts/queue-steering)。有关显式 `/steer <message>` 命令，参见 [Steer](/tools/steer)。

通过 `messages.queue` 全局或按 channel 配置：

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## 队列选项

选项适用于 `followup`、`collect` 和 `steer-backlog`（以及 `steer` 或传统 `queue` 在 steering 回退到 followup 时）：

- `debounceMs`：排干排队 followup 前的安静窗口。裸数字为毫秒；`/queue` 选项接受 `ms`、`s`、`m`、`h` 和 `d` 单位。
- `cap`：每个 session 的最大排队消息数。低于 `1` 的值会被忽略。
- `drop: "summarize"`：默认值。根据需要删除最旧的排队条目，保留紧凑摘要，并将其注入为合成 followup 提示。
- `drop: "old"`：根据需要删除最旧的排队条目，不保留摘要。
- `drop: "new"`：当队列已满时拒绝最新消息。

默认值：`debounceMs: 500`、`cap: 20`、`drop: summarize`。

## 优先级

对于模式选择，OpenClaw 按以下顺序解析：

1. 内联或存储的 per-session `/queue` 覆盖。
2. `messages.queue.byChannel.<channel>`。
3. `messages.queue.mode`。
4. 默认 `steer`。

对于选项，内联或存储的 `/queue` 选项优先于配置。然后依次应用 channel 特定的 debounce（`messages.queue.debounceMsByChannel`）、插件 debounce 默认值、全局 `messages.queue` 选项和内置默认值。`cap` 和 `drop` 是全局/session 选项，不是 per-channel 配置键。

## Per-session 覆盖

- 以独立命令发送 `/queue <mode>` 来存储当前 session 的模式。
- 选项可以组合：`/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 清除 session 覆盖。

## 范围和保证

- 适用于所有使用 Gateway 回复管道的入站 channel 的自动回复 agent 运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认通道（`main`）是入站 + 主心跳的进程级别；设置 `agents.defaults.maxConcurrent` 允许多个 session 并行运行。
- 可能存在其他通道（如 `cron`、`cron-nested`、`nested`、`subagent`），以便后台作业可以并行运行而不阻塞入站回复。隔离的 cron agent 轮次在其内部 agent 执行使用 `cron-nested` 时持有一个 `cron` 槽；两者都使用 `cron.maxConcurrentRuns`。共享的非 cron `nested` 流保留其自己的通道行为。这些分离的运行被追踪为[后台任务](/automation/tasks)。
- Per-session 通道保证在给定时间只有一个 agent 运行接触某个 session。
- 无外部依赖或后台工作线程；纯 TypeScript + promises。

## 故障排除

- 如果命令似乎卡住了，启用详细日志并查找"queued for ...ms"行以确认队列正在排出。
- 如果需要队列深度，启用详细日志并观察队列时序行。
- 接受轮次后停止发出进度的 Codex app-server 运行会被 Codex 适配器中断，以便活跃 session 通道可以释放，而不是等待外部运行超时。
- 启用诊断时，在没有观察到回复、工具、状态、块或 ACP 进度的情况下，超过 `diagnostics.stuckSessionWarnMs` 仍处于 `processing` 状态的 session 按当前活动分类。活跃工作记录为 `session.long_running`；有活跃工作但近期无进度记录为 `session.stalled`；`session.stuck` 保留给无活跃工作的过时 session 簿记，只有该路径可以释放受影响的 session 通道，以便排队的工作排出。重复的 `session.stuck` 诊断在 session 保持不变时退避。

## 相关

- [Session 管理](/concepts/session)
- [Steering queue](/concepts/queue-steering)
- [Steer](/tools/steer)
- [Retry policy](/concepts/retry)
