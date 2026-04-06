---
summary: "Agent loop 生命周期、流和等待语义"
read_when:
  - 你需要了解 agent loop 或生命周期事件的详细流程
title: "Agent Loop"
---

# Agent Loop (OpenClaw)

agentic loop 是 Agent 的完整"真实"运行过程：接收输入 → 上下文组装 → model 推理 →
工具执行 → 流式回复 → 持久化。它是将消息转换为操作和最终回复的权威路径，同时保持 Session 状态的一致性。

在 OpenClaw 中，loop 是每个 Session 的单次序列化运行，在 model 思考、调用工具和流式输出时会发出生命周期和流事件。本文档解释了这个真实 loop 是如何端到端连接的。

## 入口点

- Gateway RPC：`agent` 和 `agent.wait`。
- CLI：`agent` 命令。

## 工作原理（高层次）

1. `agent` RPC 验证参数，解析 Session（sessionKey/sessionId），持久化 Session 元数据，立即返回 `{ runId, acceptedAt }`。
2. `agentCommand` 运行 Agent：
   - 解析 model + thinking/verbose 默认值
   - 加载 skills 快照
   - 调用 `runEmbeddedPiAgent`（pi-agent-core runtime）
   - 如果嵌入式 loop 未发出生命周期事件，则发出 **lifecycle end/error**
3. `runEmbeddedPiAgent`：
   - 通过每个 Session + 全局队列序列化运行
   - 解析 model + auth profile 并构建 pi session
   - 订阅 pi 事件并流式传输 assistant/tool deltas
   - 强制执行超时 -> 如果超时则中止运行
   - 返回 payloads + usage 元数据
4. `subscribeEmbeddedPiSession` 将 pi-agent-core 事件桥接到 OpenClaw `agent` 流：
   - tool 事件 => `stream: "tool"`
   - assistant deltas => `stream: "assistant"`
   - lifecycle 事件 => `stream: "lifecycle"` (`phase: "start" | "end" | "error"`)
5. `agent.wait` 使用 `waitForAgentRun`：
   - 等待 `runId` 的 **lifecycle end/error**
   - 返回 `{ status: ok|error|timeout, startedAt, endedAt, error? }`

## 队列和并发

- 运行按 Session key（Session lane）序列化，并可选地通过全局 lane。
- 这可以防止 tool/Session 竞争并保持 Session 历史一致性。
- 消息 Channel 可以选择队列模式（collect/steer/followup）来馈送此 lane 系统。
  参见 [Command Queue](/concepts/queue)。

## Session + workspace 准备

- Workspace 被解析和创建；沙盒运行可能重定向到沙盒 workspace root。
- Skills 被加载（或从快照重用）并注入到 env 和 prompt 中。
- Bootstrap/context 文件被解析并注入到 system prompt 报告中。
- 获取 Session 写锁；`SessionManager` 在流式传输之前被打开和准备。

## Prompt 组装 + system prompt

- System prompt 由 OpenClaw 的基础 prompt、skills prompt、bootstrap context 和每次运行的覆盖构建。
- 强制执行特定于 model 的限制和 compaction reserve tokens。
- 参见 [System prompt](/concepts/system-prompt) 了解 model 看到的内容。

## Hook 点（可拦截的位置）

OpenClaw 有两个 hook 系统：

- **Internal hooks**（Gateway hooks）：用于命令和生命周期事件的事件驱动脚本。
- **Plugin hooks**：Agent/tool 生命周期和 Gateway 管道内的扩展点。

### Internal hooks（Gateway hooks）

- **`agent:bootstrap`**：在 system prompt 最终确定之前构建 bootstrap 文件时运行。
  使用它来添加/删除 bootstrap context 文件。
- **Command hooks**：`/new`、`/reset`、`/stop` 和其他命令事件（参见 Hooks 文档）。

参见 [Hooks](/automation/hooks) 了解设置和示例。

### Plugin hooks（Agent + Gateway 生命周期）

这些运行在 Agent loop 或 Gateway 管道内：

- **`before_model_resolve`**：在 pre-session 阶段运行（无 `messages`），在 model 解析之前确定性地覆盖 provider/model。
- **`before_prompt_build`**：在 Session 加载后运行（带 `messages`），在 prompt 提交之前注入 `prependContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。使用 `prependContext` 处理每轮动态文本，使用 system-context 字段处理应位于 system prompt 空间中的稳定指导。
- **`before_agent_start`**：旧版兼容性 hook，可能在任一阶段运行；优先使用上述显式 hook。
- **`before_agent_reply`**：在内联操作之后、LLM 调用之前运行，让插件接管回合并返回合成回复，或完全静默该回合。
- **`agent_end`**：完成后检查最终 message 列表和运行元数据。
- **`before_compaction` / `after_compaction`**：观察或注释 compaction 循环。
- **`before_tool_call` / `after_tool_call`**：拦截 tool 参数/结果。
- **`before_install`**：检查内置扫描结果，并可选地阻止 skill 或插件安装。
- **`tool_result_persist`**：在工具结果写入 Session transcript 之前同步转换它们。
- **`message_received` / `message_sending` / `message_sent`**：入站 + 出站 message hooks。
- **`session_start` / `session_end`**：Session 生命周期边界。
- **`gateway_start` / `gateway_stop`**：Gateway 生命周期事件。

出站/工具守卫的 hook 决策规则：

- `before_tool_call`：`{ block: true }` 是终止性的，会阻止优先级较低的处理程序。
- `before_tool_call`：`{ block: false }` 是空操作，不会清除先前的 block。
- `before_install`：`{ block: true }` 是终止性的，会阻止优先级较低的处理程序。
- `before_install`：`{ block: false }` 是空操作，不会清除先前的 block。
- `message_sending`：`{ cancel: true }` 是终止性的，会阻止优先级较低的处理程序。
- `message_sending`：`{ cancel: false }` 是空操作，不会清除先前的取消。

参见 [Plugin hooks](/plugins/architecture#provider-runtime-hooks) 了解 hook API 和注册详细信息。

## 流式传输 + 部分回复

- Assistant deltas 从 pi-agent-core 流式传输并作为 `assistant` 事件发出。
- Block 流式传输可以在 `text_end` 或 `message_end` 上发出部分回复。
- Reasoning 流式传输可以作为单独的流或作为 block 回复发出。
- 参见 [Streaming](/concepts/streaming) 了解分块和 block 回复行为。

## Tool 执行 + messaging tools

- Tool start/update/end 事件在 `tool` 流上发出。
- Tool 结果在记录/发出之前对大小和图像 payloads 进行清理。
- 跟踪 messaging tool 发送以抑制重复的 Assistant 确认。

## 回复塑形 + 抑制

- 最终 payloads 从以下内容组装：
  - assistant 文本（和可选的 reasoning）
  - 内联 tool 摘要（当 verbose + 允许时）
  - model 错误时的 Assistant 错误文本
- 精确的静默令牌 `NO_REPLY` / `no_reply` 从传出 payloads 中过滤。
- 从最终 payload 列表中删除 messaging tool 重复项。
- 如果没有可渲染的 payloads 并且工具出错，则发出回退工具错误回复
  （除非 messaging tool 已发送用户可见的回复）。

## Compaction + 重试

- 自动 compaction 发出 `compaction` 流事件并可以触发重试。
- 重试时，重置内存缓冲区和工具摘要以避免重复输出。
- 参见 [Compaction](/concepts/compaction) 了解 compaction 管道。

## 事件流（当前）

- `lifecycle`：由 `subscribeEmbeddedPiSession` 发出（并由 `agentCommand` 作为后备）
- `assistant`：从 pi-agent-core 流式传输的 deltas
- `tool`：从 pi-agent-core 流式传输的 tool 事件

## Chat channel 处理

- Assistant deltas 被缓冲到 chat `delta` 消息中。
- 在 **lifecycle end/error** 时发出 chat `final`。

## 超时

- `agent.wait` 默认值：30s（仅等待）。`timeoutMs` 参数覆盖。
- Agent runtime：`agents.defaults.timeoutSeconds` 默认 172800s（48 小时）；在 `runEmbeddedPiAgent` abort 计时器中强制执行。

## 可能提前结束的位置

- Agent 超时（中止）
- AbortSignal（取消）
- Gateway 断开连接或 RPC 超时
- `agent.wait` 超时（仅等待，不会停止 Agent）

## 相关链接

- [Tools](/tools) — 可用 Agent 工具
- [Hooks](/automation/hooks) — 由 Agent 生命周期事件触发的事件驱动脚本
- [Compaction](/concepts/compaction) — 长对话如何被总结
- [Exec Approvals](/tools/exec-approvals) — Shell 命令的审批门控
- [Thinking](/tools/thinking) — thinking/reasoning 级别配置
