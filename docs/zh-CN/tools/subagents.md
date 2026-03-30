---
mmh3_hash: "3776412b36ca1e68a2cf225771f42b76"
read_when:
  - 你想通过智能体执行后台/并行工作
  - 你正在更改 sessions_spawn 或子智能体工具策略
  - 你正在实现或排查线程绑定子智能体 Session
summary: 子智能体：生成隔离的智能体运行，并将结果通告回请求者聊天
title: 子智能体
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/subagents.md
  workflow: 15
---

# 子智能体

子智能体是从现有智能体运行中生成的后台智能体运行。它们在自己的 Session 中运行（`agent:<agentId>:subagent:<uuid>`），完成后将结果**通告**回请求者的聊天 Channel。每次子智能体运行都作为[后台任务](/automation/tasks)跟踪。

## Slash Command

使用 `/subagents` 检查或控制**当前 Session**的子智能体运行：

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

线程绑定控制（适用于支持持久线程绑定的 Channel）：

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` 显示运行元数据（状态、时间戳、Session id、转录路径、清理）。

### 启动行为

`/subagents spawn` 以用户命令方式启动后台子智能体，任务完成后会向请求者聊天 Channel 回发一条最终完成消息。

主要目标：

- 并行化"研究 / 长任务 / 慢工具"工作，而不阻塞主运行。
- 默认保持子智能体隔离（Session 分离 + 可选沙箱）。
- 保持工具接口难以滥用：子智能体默认**不**获得 Session 工具。
- 支持可配置的嵌套深度以用于协调器模式。

成本说明：每个子智能体都有**自己的**上下文和 token 使用量。对于繁重或重复的任务，为子智能体设置更便宜的模型，而让主智能体使用更高质量的模型。可通过 `agents.defaults.subagents.model` 或每智能体覆盖配置。

## 工具

使用 `sessions_spawn`：

- 启动子智能体运行（`deliver: false`，全局通道：`subagent`）
- 然后运行通告步骤并将通告回复发布到请求者聊天 Channel
- 默认模型：继承调用者，除非设置了 `agents.defaults.subagents.model`（或每智能体 `agents.list[].subagents.model`）
- 默认思考：继承调用者，除非设置了 `agents.defaults.subagents.thinking`

工具参数：

- `task`（必填）
- `label?`（可选）
- `agentId?`（可选；如果允许，在另一个智能体 id 下创建）
- `model?`（可选；覆盖子智能体模型）
- `thinking?`（可选；覆盖子智能体运行的思考级别）
- `runTimeoutSeconds?`（默认为 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`）
- `thread?`（默认 `false`；为 `true` 时，请求此子智能体 Session 的 Channel 线程绑定）
- `mode?`（`run|session`；默认为 `run`；`mode: "session"` 需要 `thread: true`）
- `cleanup?`（`delete|keep`，默认 `keep`）
- `sandbox?`（`inherit|require`，默认 `inherit`）

## 线程绑定 Session

当 Channel 启用线程绑定时，子智能体可以保持绑定到线程，使该线程中的后续用户消息继续路由到同一子智能体 Session。

### 支持线程的 Channel

- Discord（当前唯一支持的 Channel）：支持持久线程绑定子智能体 Session（`sessions_spawn` with `thread: true`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`），以及适配器键 `channels.discord.threadBindings.enabled` 等。

快速流程：

1. 使用 `sessions_spawn` with `thread: true`（以及可选的 `mode: "session"`）创建。
2. OpenClaw 在活跃 Channel 中创建或绑定线程到该 Session 目标。
3. 该线程中的回复和后续消息路由到绑定的 Session。
4. 使用 `/session idle` 检查/更新空闲自动取消焦点，使用 `/session max-age` 控制硬性上限。
5. 使用 `/unfocus` 手动解绑。

手动控制：

- `/focus <target>` 将当前线程（或创建新线程）绑定到子智能体/Session 目标。
- `/unfocus` 移除当前绑定线程的绑定。
- `/agents` 列出活跃运行和绑定状态（`thread:<id>` 或 `unbound`）。
- `/session idle` 和 `/session max-age` 仅对已焦点的绑定线程有效。

## 嵌套子智能体

默认情况下，子智能体不能生成自己的子智能体（`maxSpawnDepth: 1`）。可以通过设置 `maxSpawnDepth: 2` 启用一级嵌套，实现**协调器模式**：主 → 协调器子智能体 → 工作者子子智能体。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2,       // 允许子智能体生成子代（默认：1）
        maxChildrenPerAgent: 5, // 每个智能体 Session 最大活跃子代数（默认：5）
        maxConcurrent: 8,       // 全局并发通道上限（默认：8）
        runTimeoutSeconds: 900, // sessions_spawn 省略时的默认超时（0 = 无超时）
      },
    },
  },
}
```

### 深度级别

| 深度 | Session Key 形状                              | 角色                         | 可以生成？                          |
| ---- | --------------------------------------------- | ---------------------------- | ----------------------------------- |
| 0    | `agent:<id>:main`                             | 主智能体                     | 始终可以                            |
| 1    | `agent:<id>:subagent:<uuid>`                  | 子智能体（深度 2 时为协调器）| 仅当 `maxSpawnDepth >= 2` 时         |
| 2    | `agent:<id>:subagent:<uuid>:subagent:<uuid>`  | 子子智能体（叶子工作者）     | 从不                                |

### 级联停止

停止深度 1 协调器会自动停止其所有深度 2 子代：

- `/stop` 在主聊天中停止所有深度 1 智能体并级联到其深度 2 子代。
- `/subagents kill <id>` 停止特定子智能体并级联到其子代。

## 通告

子智能体通过通告步骤报告结果：

- 通告步骤在子智能体 Session 内运行（不在请求者 Session 中）。
- 如果子智能体回复恰好是 `ANNOUNCE_SKIP`，则不发布任何内容。
- 通告负载在末尾包含一行统计信息（运行时、token 使用量、估计成本、Session Key/id 和转录路径）。

## 工具策略（子智能体工具）

默认情况下，子智能体获得**除 Session 工具和系统工具之外的所有工具**：

- `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn` 默认被拒绝。

当 `maxSpawnDepth >= 2` 时，深度 1 协调器子智能体额外获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子代。

配置覆盖：

```json5
{
  tools: {
    subagents: {
      tools: {
        deny: ["gateway", "cron"],
      },
    },
  },
}
```

## 并发

子智能体使用专用进程内队列通道：

- 通道名称：`subagent`
- 并发数：`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 停止

- 在请求者聊天中发送 `/stop` 中止请求者 Session 并停止从其生成的所有活跃子智能体运行，级联到嵌套子代。
- `/subagents kill <id>` 停止特定子智能体并级联到其子代。

## 限制

- 子智能体通告是**尽力而为**的。如果 Gateway 重启，待处理的"通告回传"工作会丢失。
- `sessions_spawn` 始终是非阻塞的：立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子智能体上下文只注入 `AGENTS.md` + `TOOLS.md`（无 `SOUL.md`、`IDENTITY.md` 等）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。大多数用例推荐深度 2。
- `maxChildrenPerAgent` 限制每个 Session 的活跃子代数（默认：5，范围：1–20）。
