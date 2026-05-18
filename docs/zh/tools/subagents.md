---
title: "子 Agent"
sidebarTitle: "子 Agent"
mmh3_hash: "4e705e94d5e0f8d5327bd2a23a001ec3"
summary: "子 Agent：生成隔离的 Agent 运行，将结果公告回请求者聊天"
read_when:
  - 您想通过 Agent 进行后台/并行工作
  - 您正在更改 sessions_spawn 或子 Agent 工具策略
  - 您正在实现或排查线程绑定子 Agent Session 故障
---

子 Agent 是从现有 Agent 运行生成的后台 Agent 运行。它们在自己的 Session（`agent:<agentId>:subagent:<uuid>`）中运行，完成后，将其结果**公告**回请求者聊天 Channel。每个子 Agent 运行都作为[后台任务](/automation/tasks)被追踪。

主要目标：

- 并行化"研究/长任务/慢工具"工作，而不阻塞主运行。
- 默认保持子 Agent 隔离（Session 分离 + 可选沙盒）。
- 保持工具表面难以滥用：子 Agent 默认**不**获取 Session 工具。
- 支持可配置的嵌套深度以实现编排器模式。

<Note>
**成本说明：** 每个子 Agent 默认有其自己的上下文和令牌使用量。对于繁重或重复的任务，为子 Agent 设置更便宜的模型，并将主 Agent 保持在更高质量的模型上。通过 `agents.defaults.subagents.model` 或每个 Agent 的覆盖进行配置。当子 Agent 真正需要请求者的当前转录时，Agent 可以在该次生成上请求 `context: "fork"`。线程绑定子 Agent Session 默认为 `context: "fork"`，因为它们将当前对话分支到后续线程中。
</Note>

## 斜杠命令

使用 `/subagents` 检查或控制**当前 Session** 的子 Agent 运行：

```text
/subagents list
/subagents kill <id|#|all>
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
/subagents send <id|#> <message>
/subagents steer <id|#> <message>
/subagents spawn <agentId> <task> [--model <model>] [--thinking <level>]
```

使用顶层 [`/steer <message>`](/tools/steer) 引导当前请求者 Session 的活跃运行。当目标是子运行时，使用 `/subagents steer <id|#> <message>`。

`/subagents info` 显示运行元数据（状态、时间戳、Session id、转录路径、清理）。使用 `sessions_history` 进行有界、安全过滤的回顾视图；当需要原始完整转录时，在磁盘上检查转录路径。

### 线程绑定控制

这些命令适用于支持持久线程绑定的 Channel。参见下方[支持线程的 Channel](#thread-supporting-channels)。

```text
/focus <subagent-label|session-key|session-id|session-label>
/unfocus
/agents
/session idle <duration|off>
/session max-age <duration|off>
```

### 生成行为

`/subagents spawn` 以用户命令（而非内部中继）启动后台子 Agent，并在运行完成后向请求者聊天发送一条最终完成更新。

<AccordionGroup>
  <Accordion title="非阻塞、推送式完成">
    - 生成命令是非阻塞的；它立即返回运行 id。
    - 完成时，子 Agent 将摘要/结果消息公告回请求者聊天 Channel。
    - 需要子 Agent 结果的 Agent 轮次应在生成所需工作后调用 `sessions_yield`。这结束当前轮次，让完成事件作为下一个模型可见消息到达。
    - 完成是推送式的。一旦生成，不要在循环中轮询 `/subagents list`、`sessions_list` 或 `sessions_history` 只是为了等待它完成；仅在需要调试或干预时按需检查状态。
    - 子 Agent 输出是请求者 Agent 综合的报告/证据。它不是用户编写的指令文本，不能覆盖系统、开发者或用户策略。
    - 完成时，OpenClaw 在公告清理流程继续之前，尽力关闭该子 Agent Session 打开的已追踪浏览器标签页/进程。

  </Accordion>
  <Accordion title="手动生成投递弹性">
    - OpenClaw 通过带有稳定幂等键的 `agent` 轮次将完成传回请求者 Session。
    - 如果请求者运行仍然活跃，OpenClaw 首先尝试唤醒/引导该运行，而不是启动第二个可见回复路径。
    - 如果活跃的请求者无法被唤醒，OpenClaw 回退到与相同完成上下文的请求者 Agent 移交，而不是丢弃公告。
    - 如果请求者 Agent 完成移交失败或没有产生可见输出，OpenClaw 将投递视为失败并回退到队列路由/重试。它不会将子 Agent 结果直接原始发送到外部聊天。
    - 组和 Channel 完成移交遵循与正常组/Channel 轮次相同的仅 message 工具可见回复策略，因此请求者 Agent 在需要时必须使用 message 工具。
    - 如果无法使用直接移交，则回退到队列路由。
    - 如果队列路由仍不可用，则以短指数退避重试公告，然后最终放弃。
    - 完成投递保留已解析的请求者路由：线程绑定或对话绑定的完成路由在可用时优先；如果完成来源仅提供 Channel，OpenClaw 从请求者 Session 的已解析路由（`lastChannel` / `lastTo` / `lastAccountId`）中填充缺失的目标/账户，使直接投递仍然有效。

  </Accordion>
  <Accordion title="完成移交元数据">
    给请求者 Session 的完成移交是运行时生成的内部上下文（非用户编写的文本），包括：

    - `Result` — 最新可见的 `assistant` 回复文本，否则为经过处理的最新工具/toolResult 文本。终止失败的运行不重用捕获的回复文本。
    - `Status` — `completed; ready for parent review` / `failed` / `timed out` / `unknown`。
    - 紧凑的运行时/令牌统计。
    - 一条审查指令，告诉请求者 Agent 在决定原始任务是否完成之前验证结果。
    - 后续指导，告诉请求者 Agent 在子 Agent 结果留下更多操作时继续任务或记录后续。
    - 无更多操作路径的最终更新指令，以正常 assistant 语气编写，不转发原始内部元数据。

  </Accordion>
  <Accordion title="模式和 ACP 运行时">
    - `--model` 和 `--thinking` 为该特定运行覆盖默认值。
    - 使用 `info`/`log` 检查完成后的详细信息和输出。
    - `/subagents spawn` 是一次性模式（`mode: "run"`）。对于持久的线程绑定 Session，使用带有 `thread: true` 和 `mode: "session"` 的 `sessions_spawn`。
    - 对于 ACP 框架 Session（Claude Code、Gemini CLI、OpenCode 或显式 Codex ACP/acpx），在工具声明该运行时时，使用带有 `runtime: "acp"` 的 `sessions_spawn`。调试完成或 Agent 间循环时参见 [ACP 投递模型](/tools/acp-agents#delivery-model)。当 `codex` Plugin 启用时，Codex 聊天/线程控制应优先使用 `/codex ...` 而非 ACP，除非用户明确要求 ACP/acpx。
    - OpenClaw 隐藏 `runtime: "acp"` 直到 ACP 启用、请求者未被沙盒化且后端 Plugin（如 `acpx`）已加载。`runtime: "acp"` 需要外部 ACP 框架 id，或 `runtime.type="acp"` 的 `agents.list[]` 条目；对于 `agents_list` 中的普通 OpenClaw 配置 Agent，使用默认子 Agent 运行时。

  </Accordion>
</AccordionGroup>

## 上下文模式

原生子 Agent 默认隔离启动，除非调用者明确要求分叉当前转录。

| 模式       | 使用时机                                                                                                                       | 行为                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `isolated` | 新鲜研究、独立实现、慢工具工作，或任何可以在任务文本中简报的内容                                                               | 创建干净的子转录。这是默认值，保持令牌使用量较低。                               |
| `fork`     | 依赖当前对话、先前工具结果或请求者转录中已有的细致指令的工作                                                                   | 在子 Agent 开始之前将请求者转录分支到子 Session 中。                             |

谨慎使用 `fork`。它适用于上下文敏感的委派，而不是替代编写清晰的任务提示。

## 工具：`sessions_spawn`

在全局 `subagent` 通道上启动子 Agent 运行（`deliver: false`），然后运行公告步骤并将公告回复发布到请求者聊天 Channel。

可用性取决于调用者的有效工具策略。`coding` 和 `full` 配置文件默认暴露 `sessions_spawn`。`messaging` 配置文件不暴露；为应该委派工作的 Agent 添加 `tools.alsoAllow: ["sessions_spawn", "sessions_yield", "subagents"]` 或使用 `tools.profile: "coding"`。Channel/组、Provider、沙盒和每个 Agent 的允许/拒绝策略在配置文件阶段后仍然可以删除该工具。从同一 Session 使用 `/tools` 确认有效工具列表。

**默认值：**

- **模型：** 继承调用者，除非您设置 `agents.defaults.subagents.model`（或每个 Agent 的 `agents.list[].subagents.model`）；显式 `sessions_spawn.model` 仍然优先。
- **思考：** 继承调用者，除非您设置 `agents.defaults.subagents.thinking`（或每个 Agent 的 `agents.list[].subagents.thinking`）；显式 `sessions_spawn.thinking` 仍然优先。
- **运行超时：** 如果省略 `sessions_spawn.runTimeoutSeconds`，OpenClaw 在设置时使用 `agents.defaults.subagents.runTimeoutSeconds`；否则回退到 `0`（无超时）。
- **任务投递：** 原生子 Agent 在其第一个可见的 `[Subagent Task]` 消息中接收委派的任务。子 Agent 系统提示携带运行时规则和路由上下文，而不是任务的隐藏副本。

### 委派提示模式

`agents.defaults.subagents.delegationMode` 仅控制提示指导；它不更改工具策略或强制委派。

- `suggest`（默认）：保留标准提示建议，对较大或较慢的工作使用子 Agent。
- `prefer`：告诉主 Agent 保持响应性，并通过 `sessions_spawn` 委派比直接回复更复杂的任何事情。

每个 Agent 的覆盖使用 `agents.list[].subagents.delegationMode`。

```json5
{
  agents: {
    defaults: {
      subagents: {
        delegationMode: "prefer",
        maxConcurrent: 4,
      },
    },
    list: [
      {
        id: "coordinator",
        subagents: { delegationMode: "prefer" },
      },
    ],
  },
}
```

### 工具参数

<ParamField path="task" type="string" required>
  子 Agent 的任务描述。
</ParamField>
<ParamField path="taskName" type="string">
  用于后续 `subagents` 定位的可选稳定句柄。必须匹配 `[a-z][a-z0-9_]{0,63}`，不能是 `last` 或 `all` 等保留目标。当编排器可能需要在生成多个子 Agent 后引导、终止或识别特定子 Agent 时，优先使用它。
</ParamField>
<ParamField path="label" type="string">
  可选的人类可读标签。
</ParamField>
<ParamField path="agentId" type="string">
  在 `subagents.allowAgents` 允许时在另一个 Agent id 下生成。
</ParamField>
<ParamField path="runtime" type='"subagent" | "acp"' default="subagent">
  `acp` 仅适用于外部 ACP 框架（`claude`、`droid`、`gemini`、`opencode` 或显式请求的 Codex ACP/acpx）以及 `runtime.type` 为 `acp` 的 `agents.list[]` 条目。
</ParamField>
<ParamField path="resumeSessionId" type="string">
  仅 ACP。当 `runtime: "acp"` 时恢复现有的 ACP 框架 Session；对原生子 Agent 生成忽略。
</ParamField>
<ParamField path="streamTo" type='"parent"'>
  仅 ACP。当 `runtime: "acp"` 时将 ACP 运行输出流式传输到父 Session；对原生子 Agent 生成省略。
</ParamField>
<ParamField path="model" type="string">
  覆盖子 Agent 模型。无效值被跳过，子 Agent 在默认模型上运行并在工具结果中发出警告。
</ParamField>
<ParamField path="thinking" type="string">
  覆盖子 Agent 运行的思考级别。
</ParamField>
<ParamField path="runTimeoutSeconds" type="number">
  设置时默认为 `agents.defaults.subagents.runTimeoutSeconds`，否则为 `0`。设置时，子 Agent 运行在 N 秒后中止。
</ParamField>
<ParamField path="thread" type="boolean" default="false">
  为 `true` 时，请求此子 Agent Session 的 Channel 线程绑定。
</ParamField>
<ParamField path="mode" type='"run" | "session"' default="run">
  如果 `thread: true` 且省略 `mode`，默认变为 `session`。`mode: "session"` 需要 `thread: true`。
</ParamField>
<ParamField path="cleanup" type='"delete" | "keep"' default="keep">
  `"delete"` 在公告后立即归档（仍通过重命名保留转录）。
</ParamField>
<ParamField path="sandbox" type='"inherit" | "require"' default="inherit">
  `require` 在目标子运行时未被沙盒化时拒绝生成。
</ParamField>
<ParamField path="context" type='"isolated" | "fork"' default="isolated">
  `fork` 将请求者的当前转录分支到子 Session 中。仅限原生子 Agent。线程绑定生成默认为 `fork`；非线程生成默认为 `isolated`。
</ParamField>

<Warning>
`sessions_spawn` **不**接受 Channel 投递参数（`target`、`channel`、`to`、`threadId`、`replyTo`、`transport`）。对于投递，从生成的运行中使用 `message`/`sessions_send`。
</Warning>

### 任务名称和定位

`taskName` 是用于编排的模型侧句柄，而非 Session 键。当编排器可能需要稍后引导或终止该子 Agent 时，使用它来设置稳定的子 Agent 名称，如 `review_subagents`、`linux_validation` 或 `docs_update`。

目标解析接受精确的 `taskName` 匹配和无歧义的前缀。匹配作用域限于与编号 `/subagents` 目标相同的活跃/最近目标窗口，因此过期的已完成子 Agent 不会使重用的句柄变得模糊。如果两个活跃或最近的子 Agent 共享相同的 `taskName`，目标是模糊的；改用列表索引、Session 键或运行 id。

保留目标 `last` 和 `all` 不是有效的 `taskName` 值，因为它们已经有控制含义。

## 工具：`sessions_yield`

结束当前模型轮次并等待运行时事件（主要是子 Agent 完成事件）作为下一条消息到达。在生成所需的子 Agent 工作后，当请求者在这些完成到达之前无法产生最终答案时使用它。

`sessions_yield` 是等待原语。不要用 `subagents`、`sessions_list`、`sessions_history`、Shell `sleep` 或进程轮询的轮询循环来替代它，仅仅是为了检测子 Agent 完成。

只有当 Session 的有效工具列表包含 `sessions_yield` 时才使用它。某些最小或自定义工具配置文件可能暴露 `sessions_spawn` 和 `subagents` 而不暴露 `sessions_yield`；在这种情况下，不要发明轮询循环只是为了等待完成。

当活跃子 Agent 存在时，OpenClaw 将紧凑的运行时生成的 `Active Subagents` 提示块注入到正常轮次中，以便请求者可以看到当前子 Session、运行 id、状态、标签、任务和 `taskName` 别名，而无需轮询。该块中的任务和标签字段被引用为数据，而非指令，因为它们可能来自用户/模型提供的生成参数。

## 工具：`subagents`

列出、引导或终止请求者 Session 拥有的已生成子 Agent 运行。它的作用域限于当前请求者；子 Agent 只能查看/控制自己控制的子 Agent。

使用 `subagents` 进行按需状态、调试、引导或终止。使用 `sessions_yield` 等待完成事件。

## 线程绑定 Session

当为 Channel 启用线程绑定时，子 Agent 可以保持绑定到线程，这样该线程中的后续用户消息就会继续路由到同一子 Agent Session。

### 支持线程的 Channel

**Discord** 目前是唯一支持的 Channel。它支持持久线程绑定子 Agent Session（带有 `thread: true` 的 `sessions_spawn`）、手动线程控制（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`）以及适配器键 `channels.discord.threadBindings.enabled`、`channels.discord.threadBindings.idleHours`、`channels.discord.threadBindings.maxAgeHours` 和 `channels.discord.threadBindings.spawnSessions`。

### 快速流程

<Steps>
  <Step title="生成">
    使用带有 `thread: true`（以及可选的 `mode: "session"`）的 `sessions_spawn`。
  </Step>
  <Step title="绑定">
    OpenClaw 在活动 Channel 中为该 Session 目标创建或绑定线程。
  </Step>
  <Step title="路由后续消息">
    该线程中的回复和后续消息路由到绑定 Session。
  </Step>
  <Step title="检查超时">
    使用 `/session idle` 检查/更新非活动自动取消聚焦，使用 `/session max-age` 控制硬上限。
  </Step>
  <Step title="分离">
    使用 `/unfocus` 手动分离。
  </Step>
</Steps>

### 手动控制

| 命令                | 效果                                                                   |
| ------------------- | ---------------------------------------------------------------------- |
| `/focus <target>`   | 将当前线程（或创建一个）绑定到子 Agent/Session 目标                    |
| `/unfocus`          | 移除当前绑定线程的绑定                                                 |
| `/agents`           | 列出活动运行和绑定状态（`thread:<id>` 或 `unbound`）                   |
| `/session idle`     | 检查/更新空闲自动取消聚焦（仅聚焦的绑定线程）                          |
| `/session max-age`  | 检查/更新硬上限（仅聚焦的绑定线程）                                    |

### 配置开关

- **全局默认：** `session.threadBindings.enabled`、`session.threadBindings.idleHours`、`session.threadBindings.maxAgeHours`。
- **Channel 覆盖和生成自动绑定键**是适配器特定的。参见上方[支持线程的 Channel](#thread-supporting-channels)。

参见 [配置参考](/gateway/configuration-reference) 和 [Slash 命令](/tools/slash-commands) 了解当前适配器详情。

### 允许列表

<ParamField path="agents.list[].subagents.allowAgents" type="string[]">
  可以通过显式 `agentId` 定位的 Agent id 列表（`["*"]` 表示允许任何）。默认：仅请求者 Agent。如果您设置了列表，并且仍然希望请求者使用 `agentId` 生成自身，请在列表中包含请求者 id。
</ParamField>
<ParamField path="agents.defaults.subagents.allowAgents" type="string[]">
  当请求者 Agent 没有设置自己的 `subagents.allowAgents` 时使用的默认目标 Agent 允许列表。
</ParamField>
<ParamField path="agents.defaults.subagents.requireAgentId" type="boolean" default="false">
  阻止省略 `agentId` 的 `sessions_spawn` 调用（强制显式配置文件选择）。每个 Agent 的覆盖：`agents.list[].subagents.requireAgentId`。
</ParamField>
<ParamField path="agents.defaults.subagents.announceTimeoutMs" type="number" default="120000">
  Gateway `agent` 公告投递尝试的每次调用超时。值为正整数毫秒，钳制到平台安全计时器最大值。瞬态重试可能使总公告等待时间长于一个配置的超时。
</ParamField>

如果请求者 Session 被沙盒化，`sessions_spawn` 拒绝会在未沙盒化的情况下运行的目标。

### 发现

使用 `agents_list` 查看当前 `sessions_spawn` 允许哪些 Agent id。响应包括每个列出的 Agent 的有效模型和嵌入的运行时元数据，以便调用者可以区分 PI、Codex 应用服务器和其他已配置的原生运行时。

### 自动归档

- 子 Agent Session 在 `agents.defaults.subagents.archiveAfterMinutes`（默认：60）后自动归档。
- 归档使用 `sessions.delete` 并将转录重命名为 `*.deleted.<timestamp>`（同一文件夹）。
- `cleanup: "delete"` 在公告后立即归档（仍通过重命名保留转录）。
- 自动归档是尽力而为的；如果 Gateway 重启，待处理的计时器将丢失。
- `runTimeoutSeconds` **不**自动归档；它只停止运行。Session 保持直到自动归档。
- 自动归档同样适用于深度 1 和深度 2 Session。
- 浏览器清理与归档清理是独立的：即使转录/Session 记录保留，已追踪的浏览器标签页/进程也会在运行完成时尽力关闭。

## 嵌套子 Agent

默认情况下，子 Agent 不能生成自己的子 Agent（`maxSpawnDepth: 1`）。将 `maxSpawnDepth` 设置为 `2` 以启用一级嵌套——**编排器模式**：主 → 编排器子 Agent → 工作者子子 Agent。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxSpawnDepth: 2, // 允许子 Agent 生成子 Agent（默认：1）
        maxChildrenPerAgent: 5, // 每个 Agent Session 的最大活动子 Agent 数（默认：5）
        maxConcurrent: 8, // 全局并发通道上限（默认：8）
        runTimeoutSeconds: 900, // sessions_spawn 省略时的默认超时（0 = 无超时）
        announceTimeoutMs: 120000, // 每次调用 Gateway 公告超时
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

1. 深度 2 工作者完成 → 向其父 Agent（深度 1 编排器）公告。
2. 深度 1 编排器接收公告，综合结果，完成 → 向主 Agent 公告。
3. 主 Agent 接收公告并投递给用户。

每个级别只看到来自其直接子 Agent 的公告。

<Note>
**操作指南：** 一次启动子 Agent 工作并等待完成事件，而不是围绕 `sessions_list`、`sessions_history`、`/subagents list` 或 `exec` sleep 命令构建轮询循环。`sessions_list` 和 `/subagents list` 将子 Session 关系聚焦于活跃工作——活跃子 Agent 保持附加，已结束子 Agent 在短暂的最近窗口内保持可见，而过期的仅存储子 Agent 链接在其新鲜度窗口后被忽略。这防止旧的 `spawnedBy` / `parentSessionKey` 元数据在重启后复活幽灵子 Agent。如果子 Agent 完成事件在您已经发送最终答案之后到达，正确的后续动作是精确的静默令牌 `NO_REPLY` / `no_reply`。
</Note>

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

合并是累加的，因此主 Agent 配置文件始终作为回退可用。尚不支持每个 Agent 完全隔离的身份验证。

## 公告

子 Agent 通过公告步骤报告结果：

- 公告步骤在子 Agent Session 内运行（不在请求者 Session 中）。
- 如果子 Agent 回复恰好是 `ANNOUNCE_SKIP`，则不发布任何内容。
- 如果最新的 assistant 文本是精确的静默令牌 `NO_REPLY` / `no_reply`，即使之前存在可见进度，公告输出也会被抑制。

投递取决于请求者深度：

- 顶层请求者 Session 使用带外部投递（`deliver=true`）的后续 `agent` 调用。
- 嵌套请求者子 Agent Session 接收内部后续注入（`deliver=false`），以便编排器可在 Session 内综合子 Agent 结果。
- 如果嵌套请求者子 Agent Session 已消失，OpenClaw 在可用时回退到该 Session 的请求者。

对于顶层请求者 Session，完成模式直接投递首先解析任何绑定的对话/线程路由和 hook 覆盖，然后从请求者 Session 的存储路由中填充缺失的 Channel 目标字段。即使完成来源仅标识 Channel，这也能使完成保持在正确的聊天/主题上。

子 Agent 完成聚合在构建嵌套完成结果时的作用域限于当前请求者运行，防止过期的先前运行子 Agent 输出泄漏到当前公告中。公告回复在 Channel 适配器上可用时保留线程/主题路由。

### 公告上下文

公告上下文被规范化为稳定的内部事件块：

| 字段          | 来源                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------- |
| Source         | `subagent` 或 `cron`                                                                                    |
| Session ids    | 子 Session 键/id                                                                                        |
| Type           | 公告类型 + 任务标签                                                                                     |
| Status         | 从运行时结果派生（`success`、`error`、`timeout` 或 `unknown`）— **不**从模型文本推断                    |
| Result content | 最新可见 assistant 文本，否则为经过处理的最新工具/toolResult 文本                                       |
| Follow-up      | 描述何时回复与保持静默的指令                                                                            |

终止失败的运行报告失败状态，不重放捕获的回复文本。超时时，如果子 Agent 只完成了工具调用，公告可以将该历史压缩为简短的部分进度摘要，而不是重放原始工具输出。

### 统计行

公告有效负载在末尾包含统计行（即使在包装时）：

- 运行时（例如 `runtime 5m12s`）。
- 令牌使用量（输入/输出/总计）。
- 配置了模型定价时的估计成本（`models.providers.*.models[].cost`）。
- `sessionKey`、`sessionId` 和转录路径，以便主 Agent 可以通过 `sessions_history` 获取历史记录或在磁盘上检查文件。

内部元数据仅供编排使用；面向用户的回复应以正常 assistant 语气重写。

### 为何优先使用 `sessions_history`

`sessions_history` 是更安全的编排路径：

- assistant 回顾首先被规范化：thinking 标签被剥离；`<relevant-memories>` / `<relevant_memories>` 脚手架块被剥离；纯文本工具调用 XML 有效载荷块（`<tool_call>`、`<function_call>`、`<tool_calls>`、`<function_calls>`）被剥离，包括从未正确闭合的截断有效载荷；降级的工具调用/结果脚手架和历史上下文标记被剥离；泄露的模型控制令牌（`<|assistant|>`、其他 ASCII `<|...|>`、全角 `<｜...｜>`）被剥离；格式错误的 MiniMax 工具调用 XML 被剥离。
- 凭据/令牌类文本被编辑。
- 长块可能被截断。
- 非常大的历史记录可以删除旧行或将超大行替换为 `[sessions_history omitted: message too large]`。
- 当需要完整的字节级转录时，原始磁盘上的转录检查是回退方案。

## 工具策略

子 Agent 首先使用与父 Agent 或目标 Agent 相同的配置文件和工具策略管道。之后，OpenClaw 应用子 Agent 限制层。

没有限制性 `tools.profile` 时，子 Agent 获取**除 Session 工具和系统工具之外的所有工具**：

- `sessions_list`
- `sessions_history`
- `sessions_send`
- `sessions_spawn`

此处 `sessions_history` 也保持有界、经过处理的回顾视图——不是原始转录转储。

当 `maxSpawnDepth >= 2` 时，深度 1 编排器子 Agent 额外接收 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便管理其子 Agent。

### 通过配置覆盖

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

`tools.subagents.tools.allow` 是最终的仅允许过滤器。它可以缩小已解析的工具集，但**不能添加回**被 `tools.profile` 删除的工具。例如，`tools.profile: "coding"` 包含 `web_search`/`web_fetch` 但不包含 `browser` 工具。要让编码配置文件的子 Agent 使用浏览器自动化，在配置文件阶段添加 browser：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

当只有一个 Agent 应该获得浏览器自动化时，使用每个 Agent 的 `agents.list[].tools.alsoAllow: ["browser"]`。

## 并发

子 Agent 使用专用的进程内队列通道：

- **通道名称：** `subagent`
- **并发：** `agents.defaults.subagents.maxConcurrent`（默认：8）

## 存活性和恢复

OpenClaw 不将缺少 `endedAt` 视为子 Agent 仍然存活的永久证明。早于过期运行窗口的未结束运行不再在 `/subagents list`、状态摘要、后代完成门控和每 Session 并发检查中计为活跃/待处理。

Gateway 重启后，过期的未结束已还原运行将被清除，除非其子 Session 标记了 `abortedLastRun: true`。那些重启中止的子 Session 仍可通过子 Agent 孤儿恢复流程恢复，该流程在清除中止标记之前发送合成的恢复消息。

自动重启恢复对每个子 Session 是有限的。如果同一子 Agent 在快速重复楔入窗口内多次被接受进行孤儿恢复，OpenClaw 在该 Session 上持久化一个恢复墓碑，并在以后的重启时停止自动恢复它。运行 `openclaw tasks maintenance --apply` 以协调任务记录，或运行 `openclaw doctor --fix` 以清除已墓碑化 Session 上的过期中止恢复标志。

<Note>
如果子 Agent 生成以 Gateway `PAIRING_REQUIRED` / `scope-upgrade` 失败，在编辑配对状态之前检查 RPC 调用者。内部 `sessions_spawn` 协调应通过直接回环共享令牌/密码认证以 `client.id: "gateway-client"` 和 `client.mode: "backend"` 连接；该路径不依赖 CLI 的配对设备范围基线。远程调用者、显式 `deviceIdentity`、显式设备令牌路径和浏览器/节点客户端仍需要正常的设备批准以进行范围升级。
</Note>

## 停止

- 在请求者聊天中发送 `/stop` 会中止请求者 Session 并停止从中生成的任何活动子 Agent 运行，级联到嵌套子 Agent。
- `/subagents kill <id>` 停止特定子 Agent 并级联到其子 Agent。

## 限制

- 子 Agent 公告是**尽力而为**的。如果 Gateway 重启，待处理的"公告返回"工作将丢失。
- 子 Agent 仍然共享相同的 Gateway 进程资源；将 `maxConcurrent` 视为安全阀。
- `sessions_spawn` 始终是非阻塞的：它立即返回 `{ status: "accepted", runId, childSessionKey }`。
- 子 Agent 上下文只注入 `AGENTS.md`、`TOOLS.md`、`SOUL.md`、`IDENTITY.md` 和 `USER.md`（无 `MEMORY.md`、`HEARTBEAT.md` 或 `BOOTSTRAP.md`）。
- 最大嵌套深度为 5（`maxSpawnDepth` 范围：1–5）。大多数用例推荐深度 2。
- `maxChildrenPerAgent` 限制每个 Session 的活动子 Agent 数（默认：5，范围：1–20）。

## 相关

- [ACP Agents](/tools/acp-agents)
- [Agent Send](/tools/agent-send)
- [后台任务](/automation/tasks)
- [多 Agent 沙盒工具](/tools/multi-agent-sandbox-tools)
