---
mmh3_hash: "36b4ec54df1713cbe1e1b5c99fdcce5f"
title: "Session tools"
sidebarTitle: "Session tools"
summary: "Agent 跨 Session 状态、召回、消息传递和子 Agent 编排工具"
read_when:
  - 你想了解 Agent 拥有哪些 Session 工具
  - 你想配置跨 Session 访问或子 Agent 生成
  - 你想检查状态或控制已生成的子 Agent
---

OpenClaw 为 Agent 提供跨 Session 工作、检查状态和编排子 Agent 的工具。

## 可用工具

| 工具               | 功能                                                                |
| ------------------ | ------------------------------------------------------------------- |
| `sessions_list`    | 列出带有可选过滤器（类型、标签、Agent、近期性、预览）的 Session      |
| `sessions_history` | 读取特定 Session 的 transcript                                      |
| `sessions_send`    | 向另一个 Session 发送消息，并可选择等待                             |
| `sessions_spawn`   | 生成一个隔离的子 Agent Session 用于后台工作                         |
| `sessions_yield`   | 结束当前回合并等待后续子 Agent 结果                                 |
| `subagents`        | 列出、引导或终止此 Session 的已生成子 Agent                         |
| `session_status`   | 显示 `/status` 风格的卡片，并可选择设置每个 Session 的 model 覆盖  |

## 列出和读取 Session

`sessions_list` 返回带有键、agentId、类型、Channel、model、token 计数和时间戳的 Session。按类型（`main`、`group`、`cron`、`hook`、`node`）、精确 `label`、精确 `agentId`、搜索文本或近期性（`activeMinutes`）过滤。需要邮箱风格分类时，它还可以请求可见性范围派生的标题、最后消息预览片段或每行有界最近消息。派生的标题和预览仅为调用者在配置的 Session 工具可见性策略下已经可以看到的 Session 生成，因此不相关的 Session 保持隐藏。

`sessions_history` 获取特定 Session 的对话 transcript。默认情况下，工具结果被排除——传递 `includeTools: true` 可以查看它们。返回的视图有意地有边界和安全过滤：

- assistant 文本在召回前进行规范化：
  - thinking 标签被剥离
  - `<relevant-memories>` / `<relevant_memories>` 脚手架块被剥离
  - 纯文本工具调用 XML payload 块，如 `<tool_call>...</tool_call>`、`<function_call>...</function_call>`、`<tool_calls>...</tool_calls>` 和 `<function_calls>...</function_calls>` 被剥离，包括从未正确关闭的截断 payload
  - 降级的工具调用/结果脚手架，如 `[Tool Call: ...]`、`[Tool Result ...]` 和 `[Historical context ...]` 被剥离
  - 泄露的 model 控制令牌，如 `<|assistant|>`、其他 ASCII `<|...|>` 令牌和全角 `<｜...｜>` 变体被剥离
  - 格式错误的 MiniMax 工具调用 XML，如 `<invoke ...>` / `</minimax:tool_call>` 被剥离
- 凭据/令牌类文本在返回前被编辑
- 长文本块被截断
- 非常大的历史记录可能会删除旧行，或用 `[sessions_history omitted: message too large]` 替换过大的行
- 工具报告摘要标志，如 `truncated`、`droppedMessages`、`contentTruncated`、`contentRedacted` 和 `bytes`

两个工具都接受**Session key**（如 `"main"`）或来自先前列表调用的**Session ID**。

如果你需要精确的逐字节 transcript，请直接检查磁盘上的 transcript 文件，而不是将 `sessions_history` 视为原始转储。

## 发送跨 Session 消息

`sessions_send` 向另一个 Session 传递消息，并可选择等待响应：

- **发送后不等待：** 设置 `timeoutSeconds: 0` 入队后立即返回。
- **等待回复：** 设置超时并内联获取响应。

目标响应后，OpenClaw 可以运行**回复循环**，Agent 交替发送消息（最多 5 轮）。目标 Agent 可以回复 `REPLY_SKIP` 提前停止。

## 状态和编排辅助

`session_status` 是当前或另一个可见 Session 的轻量 `/status` 等效工具。它报告使用量、时间、model/runtime 状态，以及存在时的关联后台任务上下文。像 `/status` 一样，它可以从最新的 transcript 使用条目回填稀疏的 token/缓存计数器，`model=default` 可以清除每个 Session 的覆盖。使用 `sessionKey="current"` 获取调用者的当前 Session；像 `openclaw-tui` 这样的可见客户端标签不是 Session keys。

`sessions_yield` 有意结束当前回合，以便下一条消息可以是你等待的后续事件。在生成子 Agent 后使用它，当你希望完成结果作为下一条消息到达，而不是构建轮询循环时。

`subagents` 是已生成 OpenClaw 子 Agent 的控制平面辅助工具。它支持：

- `action: "list"` 检查活动/近期运行
- `action: "steer"` 向正在运行的子 Agent 发送后续指导
- `action: "kill"` 停止一个子 Agent 或 `all`

## 生成子 Agent

`sessions_spawn` 为后台任务创建隔离 Session。它始终是非阻塞的——立即返回 `runId` 和 `childSessionKey`。

关键选项：

- `runtime: "subagent"`（默认）或 `"acp"` 用于外部 harness Agent。
- 子 Session 的 `model` 和 `thinking` 覆盖。
- `thread: true` 将生成绑定到聊天线程（Discord、Slack 等）。
- `sandbox: "require"` 对子 Session 强制沙盒。
- `context: "fork"` 用于原生子 Agent，当子 Agent 需要当前请求者 transcript 时；省略或使用 `context: "isolated"` 获得干净的子 Agent。

默认的叶子子 Agent 不获得 Session 工具。当 `maxSpawnDepth >= 2` 时，深度为 1 的编排子 Agent 还会获得 `sessions_spawn`、`subagents`、`sessions_list` 和 `sessions_history`，以便它们可以管理自己的子 Agent。叶子运行仍然不获得递归编排工具。

完成后，宣告步骤将结果发布到请求者的 Channel。完成传递在可用时保留绑定的线程/主题路由，如果完成来源只标识一个 Channel，OpenClaw 仍然可以重用请求者 Session 存储的路由（`lastChannel` / `lastTo`）进行直接传递。

关于 ACP 特定行为，参见 [ACP Agents](/tools/acp-agents)。

## 可见性

Session 工具的作用域限制了 Agent 可以看到的内容：

| 级别    | 作用域                                   |
| ------- | ---------------------------------------- |
| `self`  | 仅当前 Session                           |
| `tree`  | 当前 Session + 已生成的子 Agent          |
| `agent` | 此 Agent 的所有 Session                  |
| `all`   | 所有 Session（如果配置则跨 Agent）       |

默认为 `tree`。无论配置如何，沙盒 Session 都被限制为 `tree`。

## 延伸阅读

- [Session Management](/concepts/session) — 路由、生命周期、维护
- [ACP Agents](/tools/acp-agents) — 外部 harness 生成
- [Multi-agent](/concepts/multi-agent) — 多 Agent 架构
- [Gateway Configuration](/gateway/configuration) — Session 工具配置项

## Related

- [Session management](/concepts/session)
- [Session pruning](/concepts/session-pruning)
