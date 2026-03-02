---
mmh3_hash: "7b52f2063faca1f73fb340d4ad7cd4b3"
summary: "每个 Channel（WhatsApp、Telegram、Discord、Slack）的路由规则和共享上下文"
read_when:
  - 更改 Channel 路由或收件箱行为
title: "Channel 路由"
---

# Channels 和路由

OpenClaw 将回复**路由回消息来源的 Channel**。模型不选择 Channel；路由是确定性的，由主机配置控制。

## 关键术语

- **Channel**：`whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`、`webchat`。
- **AccountId**：每个 Channel 的帐户实例（如果支持）。
- 可选的 Channel 默认账户：`channels.<channel>.defaultAccount` 选择在出站路径未指定 `accountId` 时使用哪个账户。
- **AgentId**：隔离的工作空间 + Session 存储（"大脑"）。
- **SessionKey**：用于存储上下文和控制并发的存储桶键。

## Session 键形状（示例）

直接消息折叠到 Agent 的 **main** 会话：

- `agent:<agentId>:<mainKey>`（默认：`agent:main:main`）

群组和 Channels 保持每个 Channel 隔离：

- 群组：`agent:<agentId>:<channel>:group:<id>`
- Channels/房间：`agent:<agentId>:<channel>:channel:<id>`

线程：

- Slack/Discord 线程将 `:thread:<threadId>` 追加到基础键。
- Telegram 论坛主题将 `:topic:<topicId>` 嵌入群组键。

示例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 路由规则（如何选择 Agent）

路由为每条入站消息选择**一个 Agent**：

1. **确切的对等体匹配**（带有 `peer.kind` + `peer.id` 的 `bindings`）。
2. **父对等体匹配**（线程继承）。
3. **公会 + 角色匹配**（Discord）通过 `guildId` + `roles`。
4. **公会匹配**（Discord）通过 `guildId`。
5. **团队匹配**（Slack）通过 `teamId`。
6. **帐户匹配**（Channel 上的 `accountId`）。
7. **Channel 匹配**（该 Channel 上的任何帐户，`accountId: "*"`）。
8. **默认 Agent**（`agents.list[].default`，否则第一个列表条目，回退到 `main`）。

当绑定包含多个匹配字段（`peer`、`guildId`、`teamId`、`roles`）时，**所有提供的字段必须匹配**才能应用该绑定。

匹配的 Agent 确定使用哪个工作空间和 Session 存储。

## 广播组（运行多个 Agents）

广播组允许您在 OpenClaw 通常回复时为同一对等体运行**多个 Agents**（例如：在 WhatsApp 群组中，在提及/激活门控后）。

配置：

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

参见：[广播组](/channels/broadcast-groups)。

## 配置概述

- `agents.list`：命名的 Agent 定义（工作空间、模型等）。
- `bindings`：将入站 Channels/帐户/对等体映射到 Agents。

示例：

```json5
{
  agents: {
    list: [{ id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }],
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

## Session 存储

Session 存储位于状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL 记录与存储并存

您可以通过 `session.store` 和 `{agentId}` 模板覆盖存储路径。

## WebChat 行为

WebChat 附加到**选定的 Agent**，并默认为 Agent 的 main 会话。因此，WebChat 允许您在一个地方查看该 Agent 的跨 Channel 上下文。

## 回复上下文

入站回复包括：

- `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`（如果可用）。
- 引用的上下文作为 `[Replying to ...]` 块追加到 `Body`。

这在 Channels 之间是一致的。
