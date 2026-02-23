---
title: "子代理"
sidebarTitle: "子代理"
mmh3_hash: "ebdf80ed854875a0a76fed23a123a390"
summary: "子代理：生成隔离的代理运行，将结果公告回请求者聊天"
read_when:
  - 您想通过代理进行后台/并行工作
  - 您正在更改 sessions_spawn 或子代理工具策略
  - 您正在实现或排查线程绑定子代理会话故障
---

# 子代理

子代理是从现有代理运行生成的后台代理运行。它们在自己的会话（`agent:<agentId>:subagent:<uuid>`）中运行，完成后，将其结果**公告**回请求者聊天频道。

## 斜杠命令

使用 `/subagents` 检查或控制**当前会话**的子代理运行：

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

线程绑定控制：

这些命令适用于支持持久线程绑定的频道。参见下方的**支持线程的频道**。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session ttl <duration|off>`

`/subagents info` 显示运行元数据（状态、时间戳、会话 id、脚本路径、清理）。

### 生成行为

`/subagents spawn` 以用户命令（而非内部中继）启动后台子代理，并在运行完成后向请求者聊天发送一条最终完成更新。

- 生成命令是非阻塞的；它立即返回运行 id。
- 完成时，子代理将摘要/结果消息公告回请求者聊天频道。
- 对于手动生成，投递是弹性的：
  - OpenClaw 首先使用稳定的幂等键尝试直接 `agent` 投递。
  - 如果直接投递失败，则回退到队列路由。
  - 如果队列路由仍不可用，则以短指数退避重试公告，然后最终放弃。
- 完成消息是系统消息，包括：
  - `Result`（`assistant` 回复文本，或者如果代理回复为空则是最新的 `toolResult`）
  - `Status`（`completed successfully` / `failed` / `timed out`）
  - 紧凑的运行时/令牌统计
- `--model` 和 `--thinking` 为该特定运行覆盖默认值。
- 使用 `info`/`log` 检查完成后的详细信息和输出。
- `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久的线程绑定会话，使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。

主要目标：

- 并行化"研究/长任务/慢工具"工作，而不阻塞主运行。
- 默认保持子代理隔离（会话分离 + 可选沙盒）。
- 保持工具表面难以滥用：子代理默认**不**获取会话工具。
- 支持可配置的嵌套深度以实现编排器模式。

成本说明：每个子代理都有其**自己的**上下文和令牌使用量。对于繁重或重复的任务，为子代理设置更便宜的模型，并将主代理保持在更高质量的模型上。您可以通过 `agents.defaults.subagents.model` 或每个代理的覆盖来配置这一点。

## 工具

使用 `sessions_spawn`：

- 启动子代理运行（`deliver: false`，全局通道：`subagent`）
- 然后运行公告步骤并将公告回复发布到请求者聊天频道
- 默认模型：继承调用者，除非您设置 `agents.defaults.subagents.model`（或每个代理的 `agents.list[].subagents.model`）；显式 `sessions_spawn.model` 仍然优先。
- 默认思考：继承调用者，除非您设置 `agents.defaults.subagents.thinking`（或每个代理的 `agents.list[].subagents.thinking`）；显式 `sessions_spawn.thinking` 仍然优先。

工具参数：

- `task`（必需）
- `label?`（可选）
- `agentId?`（可选；如果允许则在另一个代理 id 下生成）
- `model?`（可选；覆盖子代理模型；无效值被跳过，子代理在默认模型上运行并在工具结果中发出警告）
- `thinking?`（可选；覆盖子代理运行的思考级别）
- `runTimeoutSeconds?`（默认 `0`；设置时，子代理运行在 N 秒后中止）
- `thread?`（默认 `false`；为 `true` 时，请求此子代理会话的频道线程绑定）
- `mode?`（`run|session`）
  - 默认为 `run`
  - 如果 `thread: true` 且省略 `mode`，则默认变为 `session`
  - `mode: "session"` 需要 `thread: true`
- `cleanup?`（`delete|keep`，默认 `keep`）

## 线程绑定会话

当为频道启用线程绑定时，子代理可以保持绑定到线程，这样该线程中的后续用户消息就会继续路由到同一子代理会话。

### 支持线程的频道

- Discord（目前唯一支持的频道）：支持持久线程绑定子代理会话（带有 `thread: true` 的 `sessions_spawn`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session ttl`）以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.ttlHours` 和 `channels.discord.threadBindings.spawnSubagentSessions`。

快速流程：

1. 使用带有 `thread: true`（以及可选的 `mode: "session"`）的 `sessions_spawn` 生成。
2. OpenClaw 在活动频道中为该会话目标创建或绑定线程。
3. 该线程中的回复和后续消息路由到绑定会话。
4. 使用 `/session ttl` 检查/更新自动取消聚焦 TTL。
5. 使用 `/unfocus` 手动分离。

手动控制：

- `/focus <target>` 将当前线程（或创建一个）绑定到子代理/会话目标。
- `/unfocus` 删除当前绑定线程的绑定。
- `/agents` 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）。
- `/session ttl` 仅适用于聚焦的绑定线程。

配置开关：

- 全局默认：`session.threadBindings.enabled`、`session.threadBindings.ttlHours`
- 频道覆盖和生成自动绑定键是适配器特定的。参见上方**支持线程的频道**。

参见 [配置参考](/gateway/configuration-reference) 和 [斜杠命令](/tools/slash-commands) 了解当前适配器详情。

允许列表：

- `agents.list[].subagents.allowAgents`：可以通过 `agentId` 定位的代理 id 列表（`["*"]` 表示允许任何）。默认：仅请求者代理。

发现：

- 使用 `agents_list` 查看当前会话允许 `sessions_spawn` 定位哪些代理 id。

自动归档：

- 子代理会话在 `agents.defaults.subagents.archiveAfterMinutes`（默认：60）后自动归档。
- 归档使用 `sessions.delete` 并将脚本重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 在公告后立即归档（仍通过重命名保留脚本）。
- 自动归档是尽力而为的；如果 Gateway 重启，待处理的计时器将丢失。
- `runTimeoutSeconds` **不**自动归档；它只停止运行。会话保持直到自动归档。
- 自动归档同样适用于深度 1 和深度 2 会话。

## 嵌套子代理

默认情况下，子代理不能生成自己的子代理（`maxSpawnDepth: 1`）。您可以通过设置 `maxSpawnDepth: 2` 启用一级嵌套，这允许**编排器模式**：主 → 编排器子代理 → 工作者子子代理。

### 如何启用

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子代理生成子代理（默认：1）
        maxChildrenPerAgent: 5, // 每个代理会话的最大活动子代理数（默认：5）
        maxConcurrent: 8, // 全局并发通道上限（默认：8）
      },
    },
  },
}
```

### 深度级别

| 深度 | 会话键形式                                    | 角色                                    | 可以生成？                  |
| ---- | -------------------------------------------- | --------------------------------------- | --------------------------- |
| 0    | `agent:<id>:main`                            | 主代理                                  | 始终                        |
| 1    | `agent:<id>:subagent:<uuid>`                 | 子代理（当允许深度 2 时为编排器）       | 仅当 `maxSpawnDepth >= 2`  |
| 2    | `agent:<id>:subagent:<uuid>:subagent:<uuid>` | 子子代理（叶子工作者）                  | 从不                        |

### 公告链

结果沿链向上流动：

1. 深度 2 工作者完成 → 向其父代理（深度 1 编排器）公告
2. 深度 1 编排器接收公告，综合结果，完成 → 向主代理公告
3. 主代理接收公告并投递给用户

每个级别只看到来自其直接子代理的公告。

### 按深度划分的工具策略

- **深度 1（编排器，当 `maxSpawnDepth >= 2`）**：获取 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子代理。其他会话/系统工具仍被拒绝。
- **深度 1（叶子，当 `maxSpawnDepth == 1`）**：无会话工具（当前默认行为）。
- **深度 2（叶子工作者）**：无会话工具 — `sessions_spawn` 在深度 2 始终被拒绝。不能生成更多子代理。

### 每个代理的生成限制

每个代理会话（任何深度）同时最多可以有 `maxChildrenPerAgent`（默认：5）个活动子代理。这防止了来自单个编排器的失控扇出。

### 级联停止

停止深度 1 编排器会自动停止其所有深度 2 子代理：

- 在主聊天中 `/stop` 停止所有深度 1 代理并级联到其深度 2 子代理。
- `/subagents kill <id>` 停止特定子代理并级联到其子代理。
- `/subagents kill all` 停止请求者的所有子代理并级联。

## 身份验证

子代理身份验证按**代理 id** 解析，而不是按会话类型：

- 子代理会话键是 `agent:<agentId>:subagent:<uuid>`。
- 身份验证存储从该代理的 `agentDir` 加载。
- 主代理的身份验证配置文件作为**回退**合并进来；代理配置文件在冲突时覆盖主代理配置文件。

注意：合并是累加的，因此主代理配置文件始终作为回退可用。尚不支持每个代理完全隔离的身份验证。

## 公告

子代理通过公告步骤报告结果：

- 公告步骤在子代理会话内运行（不在请求者会话中）。
- 如果子代理回复恰好是 `ANNOUNCE_SKIP`，则不发布任何内容。
- 否则，公告回复通过后续 `agent` 调用（`deliver=true`）发布到请求者聊天频道。
- 公告回复在频道适配器上可用时保留线程/主题路由。
- 公告消息被规范化为稳定模板：
  - `Status:` 从运行结果派生（`success`、`error`、`timeout` 或 `unknown`）。
  - `Result:` 来自公告步骤的摘要内容（或如果缺失则为 `(not available)`）。
  - `Notes:` 错误详情和其他有用的上下文。
- `Status` 不从模型输出推断；它来自运行时结果信号。

公告有效负载在末尾包含统计行（即使在包装时）：

- 运行时（例如 `runtime 5m12s`）
- 令牌使用量（输入/输出/总计）
- 配置了模型定价时的估计成本（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId` 和脚本路径（以便主代理可以通过 `sessions_history` 获取历史记录或在磁盘上检查文件）

## 工具策略（子代理工具）

默认情况下，子代理获取**除会话工具和系统工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

当 `maxSpawnDepth >= 2` 时，深度 1 编排器子代理额外接收 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子代理。

通过配置覆盖：

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 1,
      },
    },
  },
  tools: {
    subagents: {
      tools: {
        // 拒绝优先
        deny: ["gateway", "cron"],
        // 如果设置 allow，它变为仅允许（拒绝仍然优先）
        // allow: ["read", "exec", "process"]
      },
    },
  },
}
```

## 并发

子代理使用专用的进程内队列通道：

- 通道名称：`subagent`
- 并发：`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者会话并停止从中生成的任何活动子代理运行，级联到嵌套子代理。
- `/subagents kill <id>` 停止特定子代理并级联到其子代理。

## 限制

- 子代理公告是**尽力而为**的。如果 Gateway 重启，待处理的"公告返回"工作将丢失。
- 子代理仍然共享相同的 Gateway 进程资源；将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子代理上下文只注入 `AGENTS.md` + `TOOLS.md`（无 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。大多数用例推荐深度 2。
- `maxChildrenPerAgent` 限制每个会话的活动子代理数（默认：5，范围：1–20）。
