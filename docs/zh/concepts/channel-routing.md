---
title: "频道与路由"
sidebarTitle: "频道与路由"
mmh3_hash: "5cdd0deca841ce23fb6bd6e7e01aeba8"
summary: "每个 channel 的路由规则(WhatsApp、Telegram、Discord、Slack)和共享 context"
read_when: ["更改 channel 路由或收件箱行为"]
---
# 频道与路由

OpenClaw 将回复 **路由回消息来源的 channel**。model 不选择 channel;路由是确定性的,由主机配置控制。

## 关键术语

- **Channel**: `whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`、`webchat`。
- **AccountId**: 每个 channel 的账户实例(在支持时)。
- **AgentId**: 隔离的 workspace + session store("大脑")。
- **SessionKey**: 用于存储 context 和控制并发的桶键。

## Session key 形状(示例)

直接消息折叠到 agent 的 **main** session:

- `agent:<agentId>:<mainKey>` (默认: `agent:main:main`)

Groups 和 channels 按 channel 保持隔离:

- Groups: `agent:<agentId>:<channel>:group:<id>`
- Channels/rooms: `agent:<agentId>:<channel>:channel:<id>`

Threads:

- Slack/Discord threads 将 `:thread:<threadId>` 附加到基础键。
- Telegram forum topics 将 `:topic:<topicId>` 嵌入到 group 键中。

示例:

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

## 路由规则(如何选择 agent)

路由为每个入站消息选择 **一个 agent**:

1. **精确 peer 匹配**(`bindings` 与 `peer.kind` + `peer.id`)。
2. **Guild 匹配**(Discord)通过 `guildId`。
3. **Team 匹配**(Slack)通过 `teamId`。
4. **Account 匹配**(channel 上的 `accountId`)。
5. **Channel 匹配**(该 channel 上的任何账户)。
6. **默认 agent**(`agents.list[].default`,否则第一个列表条目,后备为 `main`)。

匹配的 agent 确定使用哪个 workspace 和 session store。

## Broadcast groups(运行多个 agents)

Broadcast groups 允许你为同一 peer **运行多个 agents** **当 OpenClaw 通常会回复时**(例如:在 WhatsApp groups 中,在提及/激活门控之后)。

配置:

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"]
  }
}
```

参见:[Broadcast Groups](/zh/broadcast-groups)。

## 配置概述

- `agents.list`: 命名的 agent 定义(workspace、model 等)。
- `bindings`: 将入站 channels/accounts/peers 映射到 agents。

示例:

```json5
{
  agents: {
    list: [
      { id: "support", name: "Support", workspace: "~/.openclaw/workspace-support" }
    ]
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" }
  ]
}
```

## Session 存储

Session stores 位于 state 目录下(默认 `~/.openclaw`):

- `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- JSONL transcripts 与 store 并列

你可以通过 `session.store` 和 `{agentId}` 模板化覆盖 store 路径。

## WebChat 行为

WebChat 附加到 **选定的 agent** 并默认为 agent 的 main session。因此,WebChat 允许你在一个地方看到该 agent 的跨 channel context。

## 回复 context

入站回复包括:
- `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`(在可用时)。
- 引用的 context 作为 `[Replying to ...]` 块附加到 `Body`。

这在所有 channels 中都是一致的。
