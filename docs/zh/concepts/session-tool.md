---
mmh3_hash: "5d1bad4c6bfd60940de274279417a629"
summary: "Agent 跨 Session 状态、召回、消息传递和子 Agent 编排工具"
read_when:
  - 需要了解 Agent 拥有哪些 Session 工具
  - 需要配置跨 Session 访问或子 Agent 派生
  - 需要检查状态或控制已派生的子 Agent
title: "Session tools"
---

OpenClaw 为 agent 提供工具，以便跨 session 工作、检查状态和编排子 agent。

## 可用工具

| 工具 | 功能 |
| --- | --- |
| `sessions_list` | 列出 session，支持可选过滤器（kind、label、agent、recency、preview） |
| `sessions_history` | 读取特定 session 的转录 |
| `sessions_send` | 向另一个 session 发送消息，可选等待响应 |
| `sessions_spawn` | 派生隔离的子 agent session 用于后台工作 |
| `sessions_yield` | 结束当前轮次并等待后续子 agent 结果 |
| `subagents` | 列出、引导或终止该 session 的已派生子 agent |
| `session_status` | 显示类 `/status` 卡片，可选设置 per-session model 覆盖 |

这些工具仍受活跃工具 profile 和允许/拒绝 policy 约束。`tools.profile: "coding"` 包含完整的 session 编排集，包括 `sessions_spawn`、`sessions_yield` 和 `subagents`。`tools.profile: "messaging"` 包含跨 session 消息传递工具（`sessions_list`、`sessions_history`、`sessions_send`、`session_status`），但不包含子 agent 派生。要保留 messaging profile 同时允许原生委托，添加：

```json5
{
  tools: {
    profile: "messaging",
    alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"],
  },
}
```

群组、provider、沙箱和 per-agent 策略仍可在 profile 阶段之后移除这些工具。从受影响的 session 使用 `/tools` 检查有效工具列表。

## 列出和读取 session

`sessions_list` 返回 session 及其键、agentId、kind、channel、model、token 计数和时间戳。按 kind（`main`、`group`、`cron`、`hook`、`node`）、精确 `label`、精确 `agentId`、搜索文本或近期性（`activeMinutes`）过滤。需要邮件箱式分类时，还可以请求可见性范围内的派生标题、最后一条消息预览片段，或每行有限的最近消息。派生标题和预览仅为调用者在配置的 session 工具可见性策略下已可见的 session 生成，因此不相关的 session 保持隐藏。

`sessions_history` 获取特定 session 的会话转录。默认不包含工具结果——传递 `includeTools: true` 可查看。返回的视图是有意限制和安全过滤的：

- assistant 文本在召回前被规范化：
  - 思考标签被剥除
  - `<relevant-memories>` / `<relevant_memories>` 脚手架块被剥除
  - 纯文本工具调用 XML 载荷块如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>` 被剥除，包括从未干净关闭的截断载荷
  - 降级的工具调用/结果脚手架如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]` 被剥除
  - 泄露的 model 控制 token 如 `<|assistant|>`、其他 ASCII `<|...|>` token 和全角 `<｜...｜>` 变体被剥除
  - 格式错误的 MiniMax 工具调用 XML 如 `<invoke ...>` / `</minimax:tool_call>` 被剥除
- 凭据/类 token 文本在返回前被编辑
- 长文本块被截断
- 非常大的历史可能删除较旧的行，或将过大的行替换为 `[sessions_history omitted: message too large]`
- 工具报告摘要标志，如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted` 和 `bytes`

两个工具都接受**session 键**（如 `"main"`）或来自上一次列出调用的 **session ID**。

如果需要逐字节的精确转录，请直接检查磁盘上的转录文件，而不是将 `sessions_history` 视为原始导出。

## 发送跨 session 消息

`sessions_send` 向另一个 session 投递消息，可选等待响应：

- **发后即忘：** 设置 `timeoutSeconds: 0` 入队后立即返回。
- **等待回复：** 设置超时并内联获取响应。

线程范围的聊天 session（如以 `:thread:<id>` 结尾的 Slack 或 Discord 键）不是有效的 `sessions_send` 目标。使用父 channel session 键进行 inter-agent 协调，以避免工具路由的消息出现在活跃的面向用户的线程中。

消息和 A2A 后续回复在接收提示（`[Inter-session message ... isUser=false]`）和转录来源中被标记为 inter-session 数据。接收 agent 应将其视为工具路由的数据，而非直接的最终用户指令。

目标响应后，OpenClaw 可以运行一个**回复循环**，agent 轮流发送消息（最多 `session.agentToAgent.maxPingPongTurns` 次，范围 0-20，默认 5）。目标 agent 可以回复 `REPLY_SKIP` 提前停止。

## 状态和编排辅助工具

`session_status` 是当前或另一个可见 session 的轻量级 `/status` 等效工具。它报告使用情况、时间、model/runtime 状态，以及存在时的关联后台任务上下文。与 `/status` 一样，它可以从最新的转录使用条目回填稀疏的 token/缓存计数器，`model=default` 清除 per-session 覆盖。使用 `sessionKey="current"` 获取调用者当前 session；`openclaw-tui` 等可见客户端标签不是 session 键。

`sessions_yield` 有意结束当前轮次，以便下一条消息可以是你正在等待的后续事件。在派生子 agent 后使用它，以便完成结果作为下一条消息到达，而不是构建轮询循环。

`subagents` 是已派生 OpenClaw 子 agent 的控制平面辅助工具。它支持：

- `action: "list"` 检查活跃/最近的运行
- `action: "steer"` 向运行中的子 agent 发送后续指导
- `action: "kill"` 停止一个子 agent 或 `all`

## 派生子 agent

`sessions_spawn` 默认为后台任务创建隔离的 session。它始终是非阻塞的——立即返回 `runId` 和 `childSessionKey`。原生子 Agent 运行在子 session 的第一条可见 `[Subagent Task]` 消息中接收委托的任务，而系统提示仅携带子 Agent 运行时规则和路由上下文。

主要选项：

- `runtime: "subagent"`（默认）或 `"acp"` 用于外部 harness agent。
- 子 session 的 `model` 和 `thinking` 覆盖。
- `thread: true` 将派生绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 在子 session 上强制执行沙箱。
- `context: "fork"` 用于原生子 agent 当子 agent 需要当前请求者转录时；省略它或使用 `context: "isolated"` 可获得干净的子 agent。线程绑定的原生子 agent 默认为 `context: "fork"`，除非 `threadBindings.defaultSpawnContext` 另有说明。

默认叶子子 agent 不获取 session 工具。当 `maxSpawnDepth >= 2` 时，深度 1 的协调器子 agent 还会收到 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便它们可以管理自己的子 agent。叶子运行仍不获得递归编排工具。

完成后，公告步骤将结果发布到请求者的 channel。完成投递在可用时保留绑定的线程/话题路由，如果完成来源只标识了一个 channel，OpenClaw 仍可复用请求者 session 存储的路由（`lastChannel` / `lastTo`）进行直接投递。

有关 ACP 特定行为，参见 [ACP Agents](/tools/acp-agents)。

## 可见性

Session 工具有范围限制 agent 可以看到的内容：

| 级别 | 范围 |
| --- | --- |
| `self` | 仅当前 session |
| `tree` | 当前 session + 已派生的子 agent |
| `agent` | 该 agent 的所有 session |
| `all` | 所有 session（如已配置则跨 agent） |

默认为 `tree`。沙箱化的 session 无论配置如何都被限制到 `tree`。

## 延伸阅读

- [Session 管理](/concepts/session) — 路由、生命周期、维护
- [ACP Agents](/tools/acp-agents) — 外部 harness 派生
- [Multi-agent](/concepts/multi-agent) — multi-agent 架构
- [Gateway Configuration](/gateway/configuration) — session 工具配置旋钮

## 相关

- [Session 管理](/concepts/session)
- [Session 清理](/concepts/session-pruning)
