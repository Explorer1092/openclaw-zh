---
mmh3_hash: "f8709d4b30b46a696bb18870a1565577"
summary: "在不改变队列模式的情况下引导活跃运行"
read_when:
  - 在 Agent 已运行时使用 /steer 或 /tell
  - 比较 /steer 与 /queue steer
  - 决定是引导当前运行、子 Agent，还是 ACP Session
title: "Steer"
sidebarTitle: "Steer"
---

`/steer` 首先尝试向已激活的运行发送引导。它适用于"在运行过程中调整方向"的场景。如果当前运行时无法接受引导，OpenClaw 会将消息作为正常提示发送，而非丢弃它。

## 当前 Session

使用顶层 `/steer` 来针对当前 Session 的活跃运行：

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

行为说明：

- 仅针对当前 Session 的活跃运行。
- 独立于 Session 的 `/queue` 模式运行。
- 当 Session 空闲或活跃运行无法接受引导时，使用相同消息开始正常轮次。
- 使用活跃运行时的引导路径，因此模型会在下一个受支持的运行时边界处看到该引导。

## Steer 与 queue 的区别

`/queue steer` 使正常入站消息在运行活跃期间抵达时尝试引导活跃运行。`/steer <message>` 是一个显式命令，无论存储的 `/queue` 设置如何，它都会尝试在下一个受支持的运行时边界将该命令的消息注入活跃运行。当注入不可用时，命令前缀被剥离，`<message>` 作为正常提示继续。

使用场景：

- `/steer <message>`：当你想立即引导活跃运行时。
- `/queue steer`：当你希望未来的普通消息默认引导活跃运行时。
- `/queue collect` 或 `/queue followup`：当未来的普通消息应该等待后续轮次而非引导活跃运行时。
- `/queue interrupt`：当最新消息应该替换活跃运行而非引导它时。

有关队列模式和回退行为，请参见[命令队列](/concepts/queue)和[引导队列](/concepts/queue-steering)。

## 子 Agent

当目标是子运行时，请使用 `/subagents steer`：

```text
/subagents steer 2 focus only on the API surface
```

顶层 `/steer` 不能通过 id 或列表索引选择子 Agent。它始终针对当前 Session 的活跃运行。有关子 Agent 的 id、标签和控制命令，请参见[子 Agent](/tools/subagents)。

## ACP Session

当目标是 ACP harness Session 时，请使用 `/acp steer`：

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

有关 ACP Session 的选择和运行时行为，请参见 [ACP Agent](/tools/acp-agents)。

## 相关

- [Slash 命令](/tools/slash-commands)
- [命令队列](/concepts/queue)
- [引导队列](/concepts/queue-steering)
- [子 Agent](/tools/subagents)
