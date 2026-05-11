---
mmh3_hash: "20e75f79f509e5591d32633131d62333"
summary: "运行时边界处活跃运行的 Steering 队列如何工作"
read_when:
  - 解释 Agent 使用工具时 Steer 的行为
  - 更改活跃运行的队列行为或运行时 Steering 集成
  - 比较 Steer、queue、collect 和 followup 模式
title: "Steering 队列"
---

当消息在 Session 运行已经流式传输时到达，OpenClaw 可以将该消息注入活跃的运行时，而不是为同一 Session 启动另一个运行。公开模式与运行时无关；Pi 和原生 Codex 应用服务器 Harness 以不同方式实现传递细节。

## 运行时边界

Steering 不会中断已经在运行的工具调用。Pi 在模型边界处检查已排队的 Steering 消息：

1. 助手请求工具调用。
2. Pi 执行当前助手消息的工具调用批次。
3. Pi 发出轮次结束事件。
4. Pi 清空已排队的 Steering 消息。
5. Pi 在下一次 LLM 调用之前将这些消息作为用户消息追加。

这使工具结果与请求它们的助手消息配对，然后让下一次模型调用看到最新的用户输入。

原生 Codex 应用服务器 Harness 暴露 `turn/steer` 而不是 Pi 的内部 Steering 队列。OpenClaw 在那里适配相同的模式：

- `steer` 在配置的静默窗口内批处理排队的消息，然后发送一个包含所有已收集用户输入（按到达顺序）的单个 `turn/steer` 请求。
- `queue` 通过发送单独的 `turn/steer` 请求保留旧版序列化形状。
- `followup`、`collect`、`steer-backlog` 和 `interrupt` 保留 OpenClaw 拥有的活跃 Codex 轮次周围的队列行为。

Codex 审查和手动压缩轮次拒绝同轮次 Steering。当运行时无法接受 Steering 时，OpenClaw 在该模式允许的情况下回退到 followup 队列。

本页解释正常入站消息的队列模式 Steering。有关显式 `/steer <message>` 命令，请参见 [Steer](/tools/steer)。

## 模式

| 模式            | 活跃运行行为                                                                                                           | 后续 followup 行为                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `steer`         | 在下一个运行时边界将所有排队的 Steering 消息一起注入。这是默认值。                                                     | 仅在 Steering 不可用时回退到 followup。                                                     |
| `queue`         | 旧版逐一 Steering。Pi 每个模型边界注入一条排队消息；Codex 发送单独的 `turn/steer` 请求。                               | 仅在 Steering 不可用时回退到 followup。                                                     |
| `steer-backlog` | 与 `steer` 相同的活跃运行 Steering 行为。                                                                              | 同时保留相同消息用于后续 followup 轮次。                                                    |
| `followup`      | 不 Steer 当前运行。                                                                                                    | 稍后运行排队的消息。                                                                        |
| `collect`       | 不 Steer 当前运行。                                                                                                    | 在 debounce 窗口后将兼容的排队消息合并为一个后续轮次。                                      |
| `interrupt`     | 中止活跃运行，然后启动最新消息。                                                                                       | 无。                                                                                        |

## 突发示例

如果四个用户在 Agent 执行工具调用时发送消息：

- `steer`：活跃运行时在下一次模型决策前按到达顺序接收所有四条消息。Pi 在下一个模型边界清空它们；Codex 将它们作为一个批次 `turn/steer` 接收。
- `queue`：旧版序列化 Steering。Pi 一次注入一条排队消息；Codex 接收单独的 `turn/steer` 请求。
- `collect`：OpenClaw 等待活跃运行结束，然后在 debounce 窗口后创建一个包含兼容排队消息的 followup 轮次。

## 范围

Steering 始终针对当前活跃的 Session 运行。它不创建新 Session，不更改活跃运行的工具策略，也不按发送方拆分消息。在多用户 Channel 中，入站提示已包含发送方和路由上下文，因此下一次模型调用可以看到每条消息的发送者。

当您希望 OpenClaw 构建一个可以合并兼容消息并保留 followup 队列丢弃策略的后续 followup 轮次时，使用 `collect`。仅在需要旧版逐一 Steering 行为时使用 `queue`。

## Debounce

`messages.queue.debounceMs` 适用于 followup 传递，包括 `collect`、`followup`、`steer-backlog` 以及活跃运行 Steering 不可用时的 `steer` 回退。对于 Pi，活跃的 `steer` 本身不使用 debounce 计时器，因为 Pi 自然会将消息批处理到下一个模型边界。对于原生 Codex Harness，OpenClaw 使用与静默窗口相同的 debounce 值，然后再发送批处理的 `turn/steer`。

## 相关

- [命令队列](/concepts/queue)
- [Steer](/tools/steer)
- [消息](/concepts/messages)
- [Agent Loop](/concepts/agent-loop)
