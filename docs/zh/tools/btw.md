---
summary: "使用 /btw 提出临时旁问"
read_when:
  - 您想对当前 Session 提出一个快速的旁边问题
  - 您正在实现或调试 BTW 在不同 Client 上的行为
title: "BTW 旁问"
mmh3_hash: "3b41a41abbc2eb7c09d33c41e78cbdda"
---

`/btw` 让您对**当前 Session** 提出一个快速的旁边问题，而不会将该问题变成普通的对话历史。

它以 Claude Code 的 `/btw` 行为为蓝本，但针对 OpenClaw 的 Gateway 和多 Channel 架构进行了适配。

## 它做什么

当您发送：

```text
/btw what changed?
```

OpenClaw：

1. 对当前 Session 上下文创建快照，
2. 运行一个单独的**无工具**模型调用，
3. 只回答旁边的问题，
4. 不干扰主运行，
5. **不**将 BTW 问题或答案写入 Session 历史，
6. 以**实时旁结果**而非普通助手消息的形式发出答案。

重要的思维模型是：

- 相同的 Session 上下文
- 单独的一次性旁查询
- 不调用工具
- 不污染未来上下文
- 不持久化到对话记录

## 它不做什么

`/btw` **不**：

- 创建新的持久 Session，
- 继续未完成的主任务，
- 运行工具或 Agent 工具循环，
- 将 BTW 问题/答案数据写入对话记录历史，
- 出现在 `chat.history` 中，
- 在重新加载后保留。

它是故意设计为**临时**的。

## 上下文如何工作

BTW 仅将当前 Session 用作**背景上下文**。

如果主运行当前处于活动状态，OpenClaw 会对当前消息状态创建快照，并将正在进行的主提示词作为背景上下文包含进来，同时明确告知模型：

- 只回答旁边的问题，
- 不要恢复或完成未完成的主任务，
- 不要发出工具调用或伪工具调用。

这使 BTW 与主运行保持隔离，同时仍使其了解 Session 的内容。

## 传递模型

BTW **不**作为普通助手对话消息传递。

在 Gateway 协议层面：

- 普通助手聊天使用 `chat` 事件
- BTW 使用 `chat.side_result` 事件

这种分离是有意为之的。如果 BTW 复用普通 `chat` 事件路径，Client 会将其视为常规对话历史。

由于 BTW 使用单独的实时事件且不从 `chat.history` 重放，它在重新加载后会消失。

## 界面行为

### TUI

在 TUI 中，BTW 在当前 Session 视图中内联呈现，但仍保持临时性：

- 在视觉上与普通助手回复明显区分
- 可用 `Enter` 或 `Esc` 关闭
- 重新加载时不重放

### 外部 Channel

在 Telegram、WhatsApp 和 Discord 等 Channel 上，BTW 以明确标记的一次性回复形式传递，因为这些界面没有本地临时覆盖层的概念。

答案仍被视为旁结果，而非普通 Session 历史。

### 控制 UI / Web

Gateway 正确地将 BTW 作为 `chat.side_result` 发出，且 BTW 不包含在 `chat.history` 中，因此 Web 的持久化契约已经正确。

当前控制 UI 仍需要专用的 `chat.side_result` 消费者，以便在浏览器中实时呈现 BTW。在该客户端支持落地之前，BTW 是 Gateway 层级的功能，具备完整的 TUI 和外部 Channel 行为，但浏览器 UX 尚未完整。

## 何时使用 BTW

当您需要以下内容时，使用 `/btw`：

- 对当前工作的快速澄清，
- 在长时间运行仍在进行时的事实性旁答案，
- 不应成为未来 Session 上下文一部分的临时答案。

示例：

```text
/btw what file are we editing?
/btw what does this error mean?
/btw summarize the current task in one sentence
/btw what is 17 * 19?
```

## 何时不使用 BTW

当您希望答案成为 Session 未来工作上下文的一部分时，不要使用 `/btw`。

在这种情况下，直接在主 Session 中正常提问，而不是使用 BTW。

## 相关

- [Slash 指令](/tools/slash-commands)
- [思考级别](/tools/thinking)
- [Session](/concepts/session)
