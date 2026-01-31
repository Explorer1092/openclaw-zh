---
title: "输入指示器"
sidebarTitle: "输入指示器"
mmh3_hash: "8052acceb1883d04413d41870877a4c0"
summary: "OpenClaw 何时显示 typing indicators 以及如何调整它们"
read_when:
  - 更改 typing indicator 行为或默认值
---
# 输入指示器

Typing indicators 在运行处于活动状态时发送到 chat channel。使用 `agents.defaults.typingMode` 控制 **何时** typing 开始,使用 `typingIntervalSeconds` 控制 **多久** 刷新一次。

## 默认值
当 `agents.defaults.typingMode` **未设置** 时,OpenClaw 保持传统行为:
- **直接聊天**: 一旦 model loop 开始,typing 立即开始。
- **带有 mention 的 group chats**: typing 立即开始。
- **没有 mention 的 group chats**: 仅当消息文本开始 streaming 时 typing 才开始。
- **Heartbeat 运行**: typing 被禁用。

## 模式
将 `agents.defaults.typingMode` 设置为以下之一:
- `never` — 永远不显示 typing indicator。
- `instant` — **model loop 开始后** 立即开始 typing,即使运行后来仅返回静默回复 token。
- `thinking` — 在 **第一个 reasoning delta** 上开始 typing(运行需要 `reasoningLevel: "stream"`)。
- `message` — 在 **第一个非静默文本 delta** 上开始 typing(忽略 `NO_REPLY` 静默 token)。

"触发多早"的顺序:
`never` → `message` → `thinking` → `instant`

## 配置
```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6
  }
}
```

你可以按 session 覆盖模式或节奏:
```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4
  }
}
```

## 注意
- `message` 模式不会为仅静默回复(例如用于抑制输出的 `NO_REPLY` token)显示 typing。
- `thinking` 仅在运行 streams reasoning (`reasoningLevel: "stream"`)时触发。如果 model 不发出 reasoning deltas,typing 不会开始。
- Heartbeats 永远不会显示 typing,无论模式如何。
- `typingIntervalSeconds` 控制 **刷新节奏**,而不是开始时间。默认值为 6 秒。
