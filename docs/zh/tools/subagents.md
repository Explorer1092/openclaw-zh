---
title: "子 Agent"
sidebarTitle: "子 Agent"
mmh3_hash: "ed1e88c3adcc70c343a1e850bebe2d50"
summary: "子 Agent：生成隔离的 Agent 运行，将结果公告回请求者聊天"
read_when:
  - 您想通过 Agent 进行后台/并行工作
  - 您正在更改 sessions_spawn 或子 Agent 工具策略
  - 您正在实现或排查线程绑定子 Agent Session 故障
---

# 子 Agent

子 Agent 是从现有 Agent 运行生成的后台 Agent 运行。它们在自己的 Session（`agent:<agentId>:subagent:<uuid>`）中运行，完成后，将其结果**公告**回请求者聊天 Channel。每个子 Agent 运行都作为[后台任务](/automation/tasks)被追踪。

## 斜杠命令

使用 `/subagents` 检查或控制**当前 Session**的子 Agent 运行：

- `/subagents list`
- `/subagents kill <id|#|all>`
- `/subagents log <id|#> [limit] [tools]`
- `/subagents info <id|#>`
- `/subagents send <id|#> <message>`
- `/subagents steer <id|#> <message>`
- `/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]`

线程绑定控制：

这些命令适用于支持持久线程绑定的 Channel。参见下方的**支持线程的 Channel**。

- `/focus <subagent-label|session-key|session-id|session-label>`
- `/unfocus`
- `/agents`
- `/session idle <duration|off>`
- `/session max-age <duration|off>`

`/subagents info` 显示运行元数据（状态、时间戳、Session id、转录路径、清理）。使用 `sessions_history` 进行有界、安全过滤的回顾视图；当需要原始完整转录时，在磁盘上检查转录路径。

### 生成行为

`/subagents spawn` 以用户命令（而非内部中继）启动后台子 Agent，并在运行完成后向请求者聊天发送一条最终完成更新。

- 生成命令是非阻塞的；它立即返回运行 id。
- 完成时，子 Agent 将摘要/结果消息公告回请求者聊天 Channel。
- 完成是推送式的。一旦生成，不要在循环中轮询 `/subagents list`、`sessions_list` 或 `sessions_history` 只是为了等待它完成；仅在需要调试或干预时按需检查状态。
- 完成时，OpenClaw 在公告清理流程继续之前，尽力关闭该子 Agent Session 打开的已追踪浏览器标签页/进程。
- 对于手动生成，投递是弹性的：
  - OpenClaw 首先使用稳定的幂等键尝试直接 `agent` 投递。
  - 如果直接投递失败，则回退到队列路由。
  - 如果队列路由仍不可用，则以短指数退避重试公告，然后最终放弃。
- 完成投递保留已解析的请求者路由：
  - 线程绑定或对话绑定的完成路由在可用时优先
  - 如果完成来源仅提供 Channel，OpenClaw 从请求者 Session 的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）中填充缺失的目标/账户，使直接投递仍然有效
- 完成移交给请求者 Session 的内容是运行时生成的内部上下文（非用户编写的文本），包括：
  - `Result`（最新可见的 `assistant` 回复文本，否则为经过处理的最新工具/toolResult 文本）
  - `Status`（`completed successfully` / `failed` / `timed out` / `unknown`）
  - 紧凑的运行时/令牌统计
  - 一条投递指令，告诉请求者 Agent 以正常 assistant 语气重写（不转发原始内部元数据）
- `--model` 和 `--thinking` 为该特定运行覆盖默认值。
- 使用 `info`/`log` 检查完成后的详细信息和输出。
- `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久的线程绑定 Session，使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
- 对于 ACP 运行时 Session（Codex、Claude Code、Gemini CLI），使用带有 `runtime: "acp"` 的 `sessions_spawn` 并参见 [ACP Agents](/tools/acp-agents)。

主要目标：

- 并行化"研究/长任务/慢工具"工作，而不阻塞主运行。
- 默认保持子 Agent 隔离（Session 分离 + 可选沙盒）。
- 保持工具表面难以滥用：子 Agent 默认**不**获取 Session 工具。
- 支持可配置的嵌套深度以实现编排器模式。

成本说明：每个子 Agent 都有其**自己的**上下文和令牌使用量。对于繁重或重复的任务，为子 Agent 设置更便宜的模型，并将主 Agent 保持在更高质量的模型上。您可以通过 `agents.defaults.subagents.model` 或每个 Agent 的覆盖来配置这一点。

## 工具

使用 `sessions_spawn`：

- 启动子 Agent 运行（`deliver: false`，全局通道：`subagent`）
- 然后运行公告步骤并将公告回复发布到请求者聊天 Channel
- 默认模型：继承调用者，除非您设置 `agents.defaults.subagents.model`（或每个 Agent 的 `agents.list[].subagents.model`）；显式 `sessions_spawn.model` 仍然优先。
- 默认思考：继承调用者，除非您设置 `agents.defaults.subagents.thinking`（或每个 Agent 的 `agents.list[].subagents.thinking`）；显式 `sessions_spawn.thinking` 仍然优先。
- 默认运行超时：如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 在设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。

工具参数：

- `task`（必需）
- `label?`（可选）
- `agentId?`（可选；如果允许则在另一个 Agent id 下生成）
- `model?`（可选；覆盖子 Agent 模型；无效值被跳过，子 Agent 在默认模型上运行并在工具结果中发出警告）
- `thinking?`（可选；覆盖子 Agent 运行的思考级别）
- `runTimeoutSeconds?`（设置时默认为 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`；设置时，子 Agent 运行在 N 秒后中止）
- `thread?`（默认 `false`；为 `true` 时，请求此子 Agent Session 的 Channel 线程绑定）
- `mode?`（`run|session`）
  - 默认为 `run`
  - 如果 `thread: true` 且省略 `mode`，则默认变为 `session`
  - `mode: "session"` 需要 `thread: true`
- `cleanup?`（`delete|keep`，默认 `keep`）
- `sandbox?`（`inherit|require`，默认 `inherit`；`require` 在目标子运行时未被沙盒化时拒绝生成）
- `sessions_spawn` **不**接受 Channel 投递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。对于投递，从生成的运行中使用 `message`/`sessions_send`。

## 线程绑定 Session

当为 Channel 启用线程绑定时，子 Agent 可以保持绑定到线程，这样该线程中的后续用户消息就会继续路由到同一子 Agent Session。

### 支持线程的 Channel

- Discord（目前唯一支持的 Channel）：支持持久线程绑定子 Agent Session（带有 `thread: true` 的 `sessions_spawn`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSubagentSessions`。

快速流程：

1. 使用带有 `thread: true`（以及可选的 `mode: "session"`）的 `sessions_spawn` 生成。
2. OpenClaw 在活动 Channel 中为该 Session 目标创建或绑定线程。
3. 该线程中的回复和后续消息路由到绑定 Session。
4. 使用 `/session idle` 检查/更新非活动自动取消聚焦，使用 `/session max-age` 控制硬上限。
5. 使用 `/unfocus` 手动分离。

手动控制：

- `/focus <target>` 将当前线程（或创建一个）绑定到子 Agent/Session 目标。
- `/unfocus` 删除当前绑定线程的绑定。
- `/agents` 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）。
- `/session idle` 和 `/session max-age` 仅适用于聚焦的绑定线程。

配置开关：

- 全局默认：`session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`
- Channel 覆盖和生成自动绑定键是适配器特定的。参见上方**支持线程的 Channel**。

参见 [配置参考](/gateway/configuration-reference) 和 [斜杠命令](/tools/slash-commands) 了解当前适配器详情。

允许列表：

- `agents.list[].subagents.allowAgents`：可以通过 `agentId` 定位的 Agent id 列表（`["*"]` 表示允许任何）。默认：仅请求者 Agent。
- `agents.defaults.subagents.allowAgents`：当请求者 Agent 没有设置自己的 `subagents.allowAgents` 时使用的默认目标 Agent 允许列表。
- 沙盒继承守卫：如果请求者 Session 被沙盒化，`sessions_spawn` 拒绝会在未沙盒化的情况下运行的目标。
- `agents.defaults.subagents.requireAgentId` / `agents.list[].subagents.requireAgentId`：为 true 时，阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式配置文件选择）。默认：false。

发现：

- 使用 `agents_list` 查看当前 Session 允许 `sessions_spawn` 定位哪些 Agent id。

自动归档：

- 子 Agent Session 在 `agents.defaults.subagents.archiveAfterMinutes`（默认：60）后自动归档。
- 归档使用 `sessions.delete` 并将脚本重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 在公告后立即归档（仍通过重命名保留脚本）。
- 自动归档是尽力而为的；如果 Gateway 重启，待处理的计时器将丢失。
- `runTimeoutSeconds` **不**自动归档；它只停止运行。Session 保持直到自动归档。
- 自动归档同样适用于深度 1 和深度 2 Session。
- 浏览器清理与归档清理是独立的：即使转录/Session 记录保留，已追踪的浏览器标签页/进程也会在运行完成时尽力关闭。

## 嵌套子 Agent

默认情况下，子 Agent 不能生成自己的子 Agent（`maxSpawnDepth: 1`）。您可以通过设置 `maxSpawnDepth: 2` 启用一级嵌套，这允许**编排器模式**：主 → 编排器子 Agent → 工作者子子 Agent。

### 如何启用

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子 Agent 生成子 Agent（默认：1）
        maxChildrenPerAgent: 5, // 每个 Agent Session 的最大活动子 Agent 数（默认：5）
        maxConcurrent: 8, // 全局并发通道上限（默认：8）
        runTimeoutSeconds: 900, // sessions_spawn 省略时的默认超时（0 = 无超时）
      },
    },
  },
}
```

### 深度级别

| 深度 | Session 键形式                                  | 角色                                    | 可以生成？                  |
| ---- | ----------------------------------------------- | --------------------------------------- | --------------------------- |
| 0    | `agent:<id>:main`                               | 主 Agent                                | 始终                        |
| 1    | `agent:<id>:subagent:<uuid>`                    | 子 Agent（当允许深度 2 时为编排器）     | 仅当 `maxSpawnDepth >= 2`  |
| 2    | `agent:<id>:subagent:<uuid>:subagent:<uuid>`    | 子子 Agent（叶子工作者）                | 从不                        |

### 公告链

结果沿链向上流动：

1. 深度 2 工作者完成 → 向其父 Agent（深度 1 编排器）公告
2. 深度 1 编排器接收公告，综合结果，完成 → 向主 Agent 公告
3. 主 Agent 接收公告并投递给用户

每个级别只看到来自其直接子 Agent 的公告。

操作指南：

- 一次启动子 Agent 工作并等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。
- 如果子 Agent 完成事件在您已经发送最终答案之后到达，正确的后续动作是精确的静默令牌 `NO_REPLY` / `no_reply`。

### 按深度划分的工具策略

- 角色和控制范围在生成时写入 Session 元数据。这防止扁平或还原的 Session 键意外重新获得编排器权限。
- **深度 1（编排器，当 `maxSpawnDepth >= 2`）**：获取 `sessions_spawn`、`subagents`、`sessions_list`、`sessions_history`，以便管理其子 Agent。其他 Session/系统工具仍被拒绝。
- **深度 1（叶子，当 `maxSpawnDepth == 1`）**：无 Session 工具（当前默认行为）。
- **深度 2（叶子工作者）**：无 Session 工具 — `sessions_spawn` 在深度 2 始终被拒绝。不能生成更多子 Agent。

### 每个 Agent 的生成限制

每个 Agent Session（任何深度）同时最多可以有 `maxChildrenPerAgent`（默认：5）个活动子 Agent。这防止了来自单个编排器的失控扇出。

### 级联停止

停止深度 1 编排器会自动停止其所有深度 2 子 Agent：

- 在主聊天中 `/stop` 停止所有深度 1 Agent 并级联到其深度 2 子 Agent。
- `/subagents kill <id>` 停止特定子 Agent 并级联到其子 Agent。
- `/subagents kill all` 停止请求者的所有子 Agent 并级联。

## 身份验证

子 Agent 身份验证按 **Agent id** 解析，而不是按 Session 类型：

- 子 Agent Session 键是 `agent:<agentId>:subagent:<uuid>`。
- 身份验证存储从该 Agent 的 `agentDir` 加载。
- 主 Agent 的身份验证配置文件作为**回退**合并进来；Agent 配置文件在冲突时覆盖主 Agent 配置文件。

注意：合并是累加的，因此主 Agent 配置文件始终作为回退可用。尚不支持每个 Agent 完全隔离的身份验证。

## 公告

子 Agent 通过公告步骤报告结果：

- 公告步骤在子 Agent Session 内运行（不在请求者 Session 中）。
- 如果子 Agent 回复恰好是 `ANNOUNCE_SKIP`，则不发布任何内容。
- 如果最新的 assistant 文本是精确的静默令牌 `NO_REPLY` / `no_reply`，即使之前存在可见进度，公告输出也会被抑制。
- 否则投递取决于请求者深度：
  - 顶层请求者 Session 使用带外部投递的后续 `agent` 调用（`deliver=true`）
  - 嵌套请求者子 Agent Session 接收内部后续注入（`deliver=false`），以便编排器可在 Session 内综合子 Agent 结果
  - 如果嵌套请求者子 Agent Session 已消失，OpenClaw 在可用时回退到该 Session 的请求者
- 对于顶层请求者 Session，完成模式直接投递首先解析任何绑定的对话/线程路由和 hook 覆盖，然后从请求者 Session 的存储路由中填充缺失的 Channel 目标字段。即使完成来源仅标识 Channel，这也能使完成保持在正确的聊天/主题上。
- 子 Agent 完成聚合在构建嵌套完成结果时的作用域限于当前请求者运行，防止过期的先前运行子 Agent 输出泄漏到当前公告中。
- 公告回复在 Channel 适配器上可用时保留线程/主题路由。
- 公告上下文被规范化为稳定的内部事件块：
  - 来源（`subagent` 或 `cron`）
  - 子 Session 键/id
  - 公告类型 + 任务标签
  - 从运行时结果派生的状态行（`success`、`error`、`timeout` 或 `unknown`）
  - 从最新可见 assistant 文本中选取的结果内容，否则为经过处理的最新工具/toolResult 文本
  - 一条后续指令，描述何时回复与保持静默
- `Status` 不从模型输出推断；它来自运行时结果信号。
- 超时时，如果子 Agent 只完成了工具调用，公告可以将该历史压缩为简短的部分进度摘要，而不是重放原始工具输出。

公告有效负载在末尾包含统计行（即使在包装时）：

- 运行时（例如 `runtime 5m12s`）
- 令牌使用量（输入/输出/总计）
- 配置了模型定价时的估计成本（`models.providers.*.models[].cost`）
- `sessionKey`、`sessionId` 和脚本路径（以便主 Agent 可以通过 `sessions_history` 获取历史记录或在磁盘上检查文件）
- 内部元数据仅供编排使用；面向用户的回复应以正常 assistant 语气重写。

`sessions_history` 是更安全的编排路径：

- assistant 回顾首先被规范化：
  - thinking 标签被剥离
  - `<relevant-memories>` / `<relevant_memories>` 脚手架块被剥离
  - 纯文本工具调用 XML 有效载荷块（如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>`）被剥离，包括从未正确闭合的截断有效载荷
  - 降级的工具调用/结果脚手架和历史上下文标记被剥离
  - 泄露的模型控制令牌（如 `<|assistant|>`、其他 ASCII `<|...|>` 令牌和全角 `<｜...｜>` 变体）被剥离
  - 格式错误的 MiniMax 工具调用 XML 被剥离
- 凭据/令牌类文本被编辑
- 长块可能被截断
- 非常大的历史记录可以删除旧行或将超大行替换为 `[sessions_history omitted: message too large]`
- 当需要完整的字节级转录时，原始磁盘上的转录检查是回退方案

## 工具策略（子 Agent 工具）

默认情况下，子 Agent 获取**除 Session 工具和系统工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

此处 `sessions_history` 也保持有界、经过处理的回顾视图；不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 编排器子 Agent 额外接收 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子 Agent。

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

子 Agent 使用专用的进程内队列通道：

- 通道名称：`subagent`
- 并发：`agents.defaults.subagents.maxConcurrent`（默认 `8`）

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者 Session 并停止从中生成的任何活动子 Agent 运行，级联到嵌套子 Agent。
- `/subagents kill <id>` 停止特定子 Agent 并级联到其子 Agent。

## 限制

- 子 Agent 公告是**尽力而为**的。如果 Gateway 重启，待处理的"公告返回"工作将丢失。
- 子 Agent 仍然共享相同的 Gateway 进程资源；将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子 Agent 上下文只注入 `AGENTS.md` + `TOOLS.md`（无 `SOUL.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。大多数用例推荐深度 2。
- `maxChildrenPerAgent` 限制每个 Session 的活动子 Agent 数（默认：5，范围：1–20）。
