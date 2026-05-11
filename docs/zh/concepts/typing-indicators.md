---
title: "Typing indicators"
sidebarTitle: "Typing indicators"
mmh3_hash: "3ace254078a2020a5c4754b59f9049b6"
summary: "OpenClaw 何时显示 typing indicators 以及如何调整它们"
read_when:
  - 更改 typing indicator 行为或默认值
---

在运行活跃期间，typing indicators 会发送到聊天 channel。使用 `agents.defaults.typingMode` 控制 typing 的**开始时间**，使用 `typingIntervalSeconds` 控制**刷新频率**。

## 默认值

当 `agents.defaults.typingMode` **未设置**时，OpenClaw 保持旧版行为：

- **私信**：model 循环开始后立即开始 typing。
- **有提及的群聊**：立即开始 typing。
- **无提及的群聊**：仅当消息文本开始 streaming 时才开始 typing。
- **Heartbeat 运行**：如果解析的 heartbeat 目标是支持 typing 的聊天且 typing 未禁用，则在 heartbeat 运行开始时启动 typing。

## 模式

将 `agents.defaults.typingMode` 设置为以下之一：

- `never` - 永不显示 typing indicator。
- `instant` - **model 循环一开始就**开始 typing，即使运行最终只返回静默回复 token。
- `thinking` - 在**第一个推理增量**时开始 typing（运行时需要 `reasoningLevel: "stream"`）。
- `message` - 在**第一个非静默文本增量**时开始 typing（忽略 `NO_REPLY` 静默 token）。

触发时间顺序（从晚到早）：
`never` → `message` → `thinking` → `instant`

## 配置

设置 agent 级别默认值：

```json5
{
  agents: {
    defaults: {
      typingMode: "thinking",
      typingIntervalSeconds: 6,
    },
  },
}
```

按 session 覆盖模式或节奏：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

## 注意事项

- 当整个载荷是精确的静默 token（例如 `NO_REPLY` / `no_reply`，不区分大小写匹配）时，`message` 模式不会为纯静默回复显示 typing。
- `thinking` 仅在运行 streaming 推理时触发（`reasoningLevel: "stream"`）。如果 model 不发出推理增量，typing 不会开始。
- Heartbeat typing 是解析的投递目标的存活信号。它在 heartbeat 运行开始时启动，而不是跟随 `message` 或 `thinking` stream 时机。设置 `typingMode: "never"` 可禁用它。
- 当 `target: "none"`、目标无法解析、heartbeat 的聊天投递被禁用或 channel 不支持 typing 时，heartbeat 不显示 typing。
- `typingIntervalSeconds` 控制**刷新节奏**，而非开始时间。默认值为 6 秒。

## 相关

<CardGroup cols={2}>
  <Card title="Presence" href="/concepts/presence" icon="signal">
    Gateway 如何跟踪已连接客户端并在 macOS Instances 选项卡中显示它们。
  </Card>
  <Card title="Streaming and chunking" href="/concepts/streaming" icon="bars-staggered">
    出站 streaming 行为、块边界和特定 channel 的投递。
  </Card>
</CardGroup>
