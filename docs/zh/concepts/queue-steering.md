---
mmh3_hash: "76abdc0e63517a02906789e504d768fa"
summary: "活跃运行时边界处的 Steering 队列如何工作"
read_when:
  - 解释 Agent 使用工具时 Steer 的行为
  - 更改活跃运行的队列行为或运行时 Steering 集成
  - 比较 Steer、followup、collect 和 interrupt 队列模式
title: "Steering 队列"
---

当正常提示在 Session 运行已经流式传输时到达，队列模式为 `steer` 时，OpenClaw 默认尝试将该提示发送到活跃运行时中。此默认行为不需要任何配置条目和队列指令。Pi 和原生 Codex 应用服务器 Harness 以不同方式实现传递细节。

## 运行时边界

Steering 不会中断已经在运行的工具调用。Pi 在模型边界处检查已排队的 Steering 消息：

1. 助手请求工具调用。
2. Pi 执行当前助手消息的工具调用批次。
3. Pi 发出轮次结束事件。
4. Pi 清空已排队的 Steering 消息。
5. Pi 在下一次 LLM 调用之前将这些消息作为用户消息追加。

这使工具结果与请求它们的助手消息配对，然后让下一次模型调用看到最新的用户输入。

原生 Codex 应用服务器 Harness 暴露 `turn/steer` 而不是 Pi 的内部 Steering 队列。OpenClaw 批处理在配置的静默窗口内排队的提示，然后发送一个包含所有已收集用户输入（按到达顺序）的单个 `turn/steer` 请求。

Codex 审查和手动压缩轮次拒绝同轮次 Steering。当运行时在 `steer` 模式下无法接受 Steering 时，OpenClaw 等待活跃运行结束后才启动提示。

本页解释正常入站消息在模式为 `steer` 时的队列模式 Steering。如果模式为 `followup` 或 `collect`，正常消息不进入此 Steering 路径；它们等待活跃运行结束。有关显式 `/steer <message>` 命令，请参见 [Steer](/tools/steer)。

## 模式

| 模式        | 活跃运行行为                                    | 后续行为                                                                      |
| ----------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `steer`     | 在可能时将提示 Steer 到活跃运行时中。 | 如果 Steering 不可用则等待活跃运行结束。                      |
| `followup`  | 不 Steer。                                        | 在活跃运行结束后稍后运行排队的消息。                               |
| `collect`   | 不 Steer。                                        | 在 debounce 窗口后将兼容的排队消息合并为一个后续轮次。 |
| `interrupt` | 中止活跃运行而非 Steer。          | 中止后启动最新消息。                                           |

## 突发示例

如果四个用户在 Agent 执行工具调用时发送消息：

- 使用默认行为，活跃运行时在下一次模型决策前按到达顺序接收所有四条消息。Pi 在下一个模型边界清空它们；Codex 将它们作为一个批次 `turn/steer` 接收。
- 使用 `/queue collect`，OpenClaw 不 Steer。它等待活跃运行结束，然后在 debounce 窗口后创建一个包含兼容排队消息的 followup 轮次。
- 使用 `/queue interrupt`，OpenClaw 中止活跃运行并启动最新消息，而不是 Steer。

## 范围

Steering 始终针对当前活跃的 Session 运行。它不创建新 Session，不更改活跃运行的工具策略，也不按发送方拆分消息。在多用户 Channel 中，入站提示已包含发送方和路由上下文，因此下一次模型调用可以看到每条消息的发送者。

当您希望消息默认入队而不是 Steer 活跃运行时，使用 `followup` 或 `collect`。当最新提示应替换活跃运行时，使用 `interrupt`。

## Debounce

`messages.queue.debounceMs` 适用于排队的 `followup` 和 `collect` 传递。对于原生 Codex Harness 的 `steer` 模式，它还设置发送批处理 `turn/steer` 之前的静默窗口。对于 Pi，活跃 Steering 本身不使用 debounce 计时器，因为 Pi 自然会将消息批处理到下一个模型边界。

## 相关

- [命令队列](/concepts/queue)
- [Steer](/tools/steer)
- [消息](/concepts/messages)
- [Agent Loop](/concepts/agent-loop)
