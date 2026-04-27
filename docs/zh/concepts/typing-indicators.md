---
title: "Typing indicators"
sidebarTitle: "Typing indicators"
mmh3_hash: "ffe3bc49c6e1db738a730853ae35a3d9"
summary: "OpenClaw 何时显示 typing indicators 以及如何调整它们"
read_when:
  - 更改 typing indicator 行为或默认值
---

Typing indicators 在运行处于活动状态时发送到 chat channel。使用 `agents.defaults.typingMode` 控制**何时** typing 开始，使用 `typingIntervalSeconds` 控制**多久**刷新一次。

## 默认值

当 `agents.defaults.typingMode` **未设置**时，OpenClaw 保持传统行为：

- **直接聊天**：一旦 model loop 开始，typing 立即开始。
- **带有 mention 的 group chats**：typing 立即开始。
- **没有 mention 的 group chats**：仅当消息文本开始 streaming 时 typing 才开始。
- **Heartbeat 运行**：如果解析的 heartbeat 目标是支持 typing 的 chat 且 typing 未禁用，则 heartbeat 运行开始时 typing 开始。

## 模式

将 `agents.defaults.typingMode` 设置为以下之一：

- `never` — 永远不显示 typing indicator。
- `instant` — **model loop 开始后**立即开始 typing，即使运行后来仅返回静默回复 token。
- `thinking` — 在**第一个 reasoning delta** 上开始 typing（运行需要 `reasoningLevel: "stream"`）。
- `message` — 在**第一个非静默文本 delta** 上开始 typing（忽略 `NO_REPLY` 静默 token）。

"触发多早"的顺序：
`never` → `message` → `thinking` → `instant`

## 配置

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

你可以按 session 覆盖模式或节奏：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意

- `message` 模式不会为整个 payload 是精确静默 token 的静默专属回复（例如 `NO_REPLY` / `no_reply`，不区分大小写匹配）显示 typing。
- `thinking` 仅在运行 streams reasoning（`reasoningLevel: "stream"`）时触发。如果 model 不发出 reasoning deltas，typing 不会开始。
- Heartbeat typing 是解析的传递目标的存活信号。它在 heartbeat 运行开始时启动，而不是遵循 `message` 或 `thinking` stream 时序。设置 `typingMode: "never"` 可禁用它。
- 当 `target: "none"` 时、当目标无法解析时、当 heartbeat 的 chat 传递被禁用时，或当 channel 不支持 typing 时，Heartbeat 不会显示 typing。
- `typingIntervalSeconds` 控制**刷新节奏**，而不是开始时间。默认值为 6 秒。

## Related

- [Presence](/concepts/presence)
- [Streaming and chunking](/concepts/streaming)
