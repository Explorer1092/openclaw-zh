---
mmh3_hash: "03c1a0f080155276cdd1e060befa16b0"
summary: "针对非精确提醒的后续跟进推断 Memory"
title: "推断承诺"
sidebarTitle: "Commitments"
read_when:
  - 您希望 OpenClaw 记住自然的后续跟进
  - 您想了解推断的签入与提醒有何不同
  - 您想查看或解除后续跟进 Commitment
---

Commitment 是短期后续跟进 Memory。启用后，OpenClaw 可以注意到对话创建了未来签入的时机，并在之后适时提起。

示例：

- 您提到明天有面试。OpenClaw 可能会在之后询问结果。
- 您说您精疲力竭。OpenClaw 可能会稍后询问您是否睡好了。
- Agent 表示将在某件事变化后跟进。OpenClaw 可能会追踪这个未结事项。

Commitment 不是像 `MEMORY.md` 那样的持久事实，也不是精确的提醒。它介于 Memory 和自动化之间：OpenClaw 记住对话绑定的待办事项，然后通过心跳在到期时传递。

## 启用 Commitment

Commitment 默认关闭。在配置中启用：

```bash
openclaw config set commitments.enabled true
openclaw config set commitments.maxPerDay 3
```

等效的 `openclaw.json`：

```json
{
  "commitments": {
    "enabled": true,
    "maxPerDay": 3
  }
}
```

`commitments.maxPerDay` 限制每天可以向 Agent Session 传递的推断后续跟进数量（滚动统计）。默认值为 `3`。

## 工作原理

Agent 回复后，OpenClaw 可能会在独立的上下文中运行一个隐藏的后台提取过程。该过程仅查找推断的后续跟进 Commitment，不会写入可见的对话，也不会要求主 Agent 参与提取推理。

当找到高置信度的候选项时，OpenClaw 会存储一个包含以下内容的 Commitment：

- Agent ID
- Session 键
- 原始 Channel 和传递目标
- 到期窗口
- 简短的建议签入内容
- 供心跳决定是否发送的非指令性元数据

传递通过心跳进行。当 Commitment 到期时，心跳会将其添加到相同 Agent 和 Channel 范围的心跳轮次中。模型可以发送一个自然的签入，或回复 `HEARTBEAT_OK` 来解除。如果心跳配置了 `target: "none"`，到期的 Commitment 会保持内部状态，不会发送外部签入。Commitment 传递提示不会重播原始对话文本，到期 Commitment 的心跳轮次在不使用 OpenClaw 工具的情况下运行。

OpenClaw 不会在写入推断 Commitment 后立即传递。到期时间至少被限制为 Commitment 创建后的一个心跳间隔，因此后续跟进不会在推断的同一时刻回显。

## 范围

Commitment 的范围限定于创建它们的确切 Agent 和 Channel 上下文。在 Discord 的某个 Agent 对话中推断的后续跟进，不会由另一个 Agent、另一个 Channel 或不相关的 Session 传递。

这个范围是功能设计的一部分。自然的签入应该感觉像同一对话的延续，而不是全局提醒系统。

## Commitment vs 提醒

| 需求                           | 使用                                     |
| ------------------------------ | ---------------------------------------- |
| "下午 3 点提醒我"              | [定时任务](/automation/cron-jobs)        |
| "20 分钟后通知我"              | [定时任务](/automation/cron-jobs)        |
| "每个工作日运行这个报告"       | [定时任务](/automation/cron-jobs)        |
| "我明天有面试"                 | Commitment                               |
| "我昨晚通宵了"                 | Commitment                               |
| "如果我没有回复这个未结问题则跟进" | Commitment                           |

精确的用户请求应走调度器路径。Commitment 仅用于推断的后续跟进：用户没有明确要求提醒，但对话明显创造了有用的未来签入时机。

## 管理 Commitment

使用 CLI 检查和清除已存储的 Commitment：

```bash
openclaw commitments
openclaw commitments --all
openclaw commitments --agent main
openclaw commitments --status snoozed
openclaw commitments dismiss cm_abc123
```

命令参考请参见 [`openclaw commitments`](/cli/commitments)。

## 隐私和费用

Commitment 提取使用 LLM 过程，因此启用后会在符合条件的轮次结束后增加后台模型使用量。该过程对用户可见的对话是隐藏的，但它可以读取近期的对话交流以判断是否存在后续跟进。

已存储的 Commitment 是 OpenClaw 本地状态，属于操作性 Memory，而非长期 Memory。通过以下命令禁用：

```bash
openclaw config set commitments.enabled false
```

## 故障排查

如果预期的后续跟进没有出现：

- 确认 `commitments.enabled` 为 `true`。
- 检查 `openclaw commitments --all` 中是否有待处理、已解除、已推迟或已过期的记录。
- 确保该 Agent 的心跳正在运行。
- 检查该 Agent Session 的 `commitments.maxPerDay` 是否已达到上限。
- 请记住，精确的提醒会被 Commitment 提取跳过，应在[定时任务](/automation/cron-jobs)下查找。

## 相关

- [Memory 概述](/concepts/memory)
- [Active Memory](/concepts/active-memory)
- [心跳](/gateway/heartbeat)
- [定时任务](/automation/cron-jobs)
- [`openclaw commitments`](/cli/commitments)
- [配置参考](/gateway/configuration-reference#commitments)
