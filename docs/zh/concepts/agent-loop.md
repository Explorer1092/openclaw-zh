---
mmh3_hash: "821825f716d70aec58abaa869d80b941"
summary: "Agent Loop 生命周期、流和等待语义"
read_when:
  - 您需要 Agent Loop 或生命周期事件的精确演练
  - 您正在修改 Session 排队、转录写入或 Session 写锁行为
title: "Agent Loop"
---

agentic loop 是 Agent 的完整"真实"运行过程：接收输入 → 上下文组装 → 模型推理 →
工具执行 → 流式回复 → 持久化。它是将消息转换为操作和最终回复的权威路径，同时保持 Session 状态的一致性。

在 OpenClaw 中，loop 是每个 Session 的单次序列化运行，在模型思考、调用工具和流式输出时会发出生命周期和流事件。本文档解释了这个真实 loop 是如何端到端连接的。

## 入口点

- Gateway RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作原理（高层次）

1. `agent` RPC 验证参数，解析 Session（sessionKey/sessionId），持久化 Session 元数据，立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行 Agent：
   - 解析模型 + thinking/verbose/trace 默认值
   - 加载 Skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core runtime）
   - 如果嵌入式 loop 未发出生命周期事件，则发出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 通过每个 Session + 全局队列序列化运行
   - 解析模型 + auth profile 并构建 pi session
   - 订阅 pi 事件并流式传输助手/工具增量
   - 强制超时 -> 超时时中止运行
   - 对于 Codex 应用服务器轮次，中止在终止事件前停止产生应用服务器进度的已接受轮次
   - 返回有效载荷 + 使用元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - 工具事件 => `stream: "tool"`
   - 助手增量 => `stream: "assistant"`
   - 生命周期事件 => `stream: "lifecycle"`（`phase: "start" | "end" | "error"`）
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 排队 + 并发

- 运行按 Session 键（Session 通道）序列化，可选择通过全局通道。
- 这防止了工具/Session 竞争并保持 Session 历史的一致性。
- 消息 Channel 可以选择喂入此通道系统的队列模式（collect/steer/followup）。参见[命令队列](/concepts/queue)。
- 转录写入也受 Session 文件写锁保护。该锁具有进程感知能力且基于文件，因此可以捕获绕过进程内队列或来自其他进程的写入者。Session 转录写入者在报告 Session 繁忙前等待最长 `session.writeLock.acquireTimeoutMs`；默认值为 `60000` 毫秒。
- Session 写锁默认不可重入。如果辅助工具有意在保留一个逻辑写入者的同时嵌套获取同一锁，必须使用 `allowReentrant: true` 明确选择加入。

## Session + 工作区准备

- 工作区被解析和创建；沙盒化的运行可能会重定向到沙盒工作区根目录。
- Skills 被加载（或从快照重用）并注入到环境和提示中。
- Bootstrap/上下文文件被解析并注入到系统提示报告中。
- 获取 Session 写锁；`SessionManager` 在流式传输前打开并准备好。任何后续的转录重写、压缩或截断路径必须在打开或修改转录文件前获取相同的锁。

## 提示组装 + 系统提示

- 系统提示由 OpenClaw 基础提示、Skills 提示、Bootstrap 上下文和每次运行的覆盖项构建。
- 强制执行模型特定限制和压缩保留 token。
- 参见[系统提示](/concepts/system-prompt)了解模型看到的内容。

## Hook 点（可拦截的位置）

OpenClaw 有两个 Hook 系统：

- **内部 Hook**（Gateway Hook）：命令和生命周期事件的事件驱动脚本。
- **Plugin Hook**：Agent/工具生命周期和 Gateway 流水线内的扩展点。

### 内部 Hook（Gateway Hook）

- **`agent:bootstrap`**：在系统提示最终化之前构建 bootstrap 文件时运行。用于添加/移除 bootstrap 上下文文件。
- **命令 Hook**：`/new`、`/reset`、`/stop` 和其他命令事件（参见 Hook 文档）。

参见[Hook](/automation/hooks)了解设置和示例。

### Plugin Hook（Agent + Gateway 生命周期）

这些在 Agent Loop 或 Gateway 流水线内运行：

- **`before_model_resolve`**：在会话前运行（无 `messages`），用于在模型解析前确定性地覆盖 provider/model。
- **`before_prompt_build`**：在会话加载后运行（有 `messages`），用于在提交提示前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。对每次轮次的动态文本使用 `prependContext`，对应位于系统提示空间中的稳定指导使用系统上下文字段。
- **`before_agent_start`**：可在任一阶段运行的旧版兼容性 Hook；优先使用上述明确的 Hook。
- **`before_agent_reply`**：在内联操作后和 LLM 调用前运行，让 Plugin 可以主张该轮次并返回合成回复或完全静默该轮次。
- **`agent_end`**：在完成后检查最终消息列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或注解压缩周期。
- **`before_tool_call` / `after_tool_call`**：拦截工具参数/结果。
- **`before_install`**：检查内置扫描结果并可选择阻止 Skill 或 Plugin 安装。
- **`tool_result_persist`**：在工具结果写入 OpenClaw 拥有的 Session 转录前同步转换它们。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站消息 Hook。
- **`session_start` / `session_end`**：Session 生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 生命周期事件。

出站/工具守卫的 Hook 决策规则：

- `before_tool_call`：`{ block: true }` 是终止性的，停止低优先级处理器。
- `before_tool_call`：`{ block: false }` 是无操作，不会清除先前的阻止。
- `before_install`：`{ block: true }` 是终止性的，停止低优先级处理器。
- `before_install`：`{ block: false }` 是无操作，不会清除先前的阻止。
- `message_sending`：`{ cancel: true }` 是终止性的，停止低优先级处理器。
- `message_sending`：`{ cancel: false }` 是无操作，不会清除先前的取消。

参见[Plugin Hook](/plugins/hooks)了解 Hook API 和注册详情。

Harness 可能以不同方式适配这些 Hook。Codex 应用服务器 Harness 将 OpenClaw Plugin Hook 保持为文档化镜像界面的兼容性契约，而 Codex 原生 Hook 仍是独立的低级 Codex 机制。

## 流式传输 + 部分回复

- 助手增量从 pi-agent-core 流式传输并作为 `assistant` 事件发出。
- 块流式传输可以在 `text_end` 或 `message_end` 时发出部分回复。
- 推理流式传输可以作为独立流或块回复发出。
- 参见[流式传输](/concepts/streaming)了解分块和块回复行为。

## 工具执行 + 消息工具

- 工具开始/更新/结束事件在 `tool` 流上发出。
- 工具结果在记录/发出前按大小和图像有效载荷进行净化。
- 消息工具发送被跟踪以抑制重复的助手确认。

## 回复塑形 + 抑制

- 最终有效载荷从以下内容组装：
  - 助手文本（以及可选的推理）
  - 内联工具摘要（详细模式 + 允许时）
  - 模型出错时的助手错误文本
- 确切的静默 token `NO_REPLY` / `no_reply` 从出站有效载荷中过滤。
- 消息工具重复项从最终有效载荷列表中移除。
- 如果没有可渲染的有效载荷且工具出错，则发出回退工具错误回复（除非消息工具已发送用户可见的回复）。

## 压缩 + 重试

- 自动压缩发出 `compaction` 流事件并可触发重试。
- 重试时，内存缓冲区和工具摘要被重置以避免重复输出。
- 参见[压缩](/concepts/compaction)了解压缩流水线。

## 超时

- `agent.wait` 默认：30 秒（仅等待）。`timeoutMs` 参数覆盖。
- Agent 运行时：`agents.defaults.timeoutSeconds` 默认 172800 秒（48 小时）；在 `runEmbeddedPiAgent` 中通过中止计时器强制执行。
- Cron 运行时：隔离的 Agent 轮次 `timeoutSeconds` 由 cron 拥有。调度器在执行开始时启动该计时器，在配置的截止时间中止底层运行，然后在记录超时前运行有界清理，以防止陈旧的子 Session 让通道卡住。
- Session 存活诊断：启用诊断后，`diagnostics.stuckSessionWarnMs` 对没有观察到回复、工具、状态、块或 ACP 进度的长时间 `processing` Session 进行分类。活跃的嵌入式运行、模型调用和工具调用报告为 `session.long_running`；有活跃工作但近期无进度的报告为 `session.stalled`；`session.stuck` 保留用于无活跃工作的陈旧 Session 账务。
- 模型空闲超时：当在空闲窗口前没有响应块到达时，OpenClaw 中止模型请求。`models.providers.<id>.timeoutSeconds` 为慢速本地/自托管 Provider 扩展此空闲监视器。
- Provider HTTP 请求超时：`models.providers.<id>.timeoutSeconds` 适用于该 Provider 的模型 HTTP 获取，包括连接、标头、正文、SDK 请求超时、总守护获取中止处理和模型流空闲监视器。

## 提前结束的位置

- Agent 超时（中止）
- AbortSignal（取消）
- Gateway 断开或 RPC 超时
- `agent.wait` 超时（仅等待，不停止 Agent）

## 相关

- [工具](/tools) — 可用的 Agent 工具
- [Hook](/automation/hooks) — 由 Agent 生命周期事件触发的事件驱动脚本
- [压缩](/concepts/compaction) — 长对话如何总结
- [执行审批](/tools/exec-approvals) — Shell 命令的审批门控
- [思考](/tools/thinking) — 思考/推理级别配置
