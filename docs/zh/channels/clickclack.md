---
mmh3_hash: "7833f5a6e6e0f1d02939eb7782161d5c"
summary: "ClickClack bot-token channel 设置和目标语法"
read_when:
  - 将 OpenClaw 连接到 ClickClack 工作区
  - 测试 ClickClack bot 身份
title: "ClickClack"
---

ClickClack 通过原生 ClickClack bot token 将 OpenClaw 连接到自托管的 ClickClack 工作区。

当您希望 OpenClaw agent 以 ClickClack bot 用户身份出现时，请使用此功能。ClickClack 支持独立的服务 bot 和用户自有 bot；用户自有 bot 保留 `owner_user_id` 并仅接收您授予的 token 权限范围。

## 快速设置

在 ClickClack 中创建 bot token：

```bash
clickclack admin bot create \
  --workspace <workspace_id_or_slug> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

对于用户自有 bot，添加 `--owner <user_id>`。

配置 OpenClaw：

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
      agentId: "clickclack-bot",
      replyMode: "model",
    },
  },
}
```

然后运行：

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

## 多个 bot

每个账户都会打开自己的 ClickClack 实时连接并使用自己的 bot token。

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://app.clickclack.chat",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
          replyMode: "model",
        },
        peter: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_PETER_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "peter-bot",
          replyMode: "model",
        },
      },
    },
  },
}
```

`replyMode: "model"` 直接使用 `api.runtime.llm.complete` 进行简短的 bot 回复。
当账户设置了 `agentId` 时，OpenClaw 需要显式的
`plugins.entries.clickclack.llm.allowAgentIdOverride` 信任位，以便 Plugin
可以为该 bot agent 运行补全。如果您只使用默认 agent 路由，请关闭此设置。

## 目标

- `channel:<name-or-id>` 发送到工作区 channel。裸目标默认为 `channel:`。
- `dm:<user_id>` 与该用户创建或复用私信对话。
- `thread:<message_id>` 在现有线程中回复。

示例：

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## 权限

ClickClack token 范围由 ClickClack API 强制执行。

- `bot:read`：读取工作区/channel/消息/线程/私信/实时/个人资料数据。
- `bot:write`：`bot:read` 加上 channel 消息、线程回复、私信和上传。
- `bot:admin`：`bot:write` 加上 channel 创建。

OpenClaw 正常 agent 聊天只需要 `bot:write`。

## 故障排除

- `ClickClack is not configured`：设置 `channels.clickclack.token` 或 `CLICKCLACK_BOT_TOKEN`。
- `workspace not found`：将 `workspace` 设置为 ClickClack 返回的工作区 id 或 slug。
- 没有收到回复：确认 token 具有实时读取访问权限，且 bot 不会回复自己的消息。
- Channel 发送失败：验证 bot 是工作区成员并具有 `bot:write` 权限。
