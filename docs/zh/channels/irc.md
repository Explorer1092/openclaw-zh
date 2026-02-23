---
mmh3_hash: "ed41a647ed25a27d661123e4a989c31a"
title: IRC
description: 将 OpenClaw 连接到 IRC Channels 和直接消息。
summary: "IRC 插件设置、访问控制和故障排除"
read_when:
  - 连接 OpenClaw 到 IRC 频道或私信
  - 配置 IRC allowlist、群组策略或提及门控
---

当您想要 OpenClaw 在经典 Channels（`#room`）和直接消息中时，请使用 IRC。IRC 作为扩展 Plugin 提供，但在主配置中的 `channels.irc` 下配置。

## 快速开始

1. 在 `~/.openclaw/openclaw.json` 中启用 IRC 配置。
2. 至少设置：

```json
{
  "channels": {
    "irc": {
      "enabled": true,
      "host": "irc.libera.chat",
      "port": 6697,
      "tls": true,
      "nick": "openclaw-bot",
      "channels": ["#openclaw"]
    }
  }
}
```

3. 启动/重启 Gateway：

```bash
openclaw gateway run
```

## 安全默认值

- `channels.irc.dmPolicy` 默认为 `"pairing"`。
- `channels.irc.groupPolicy` 默认为 `"allowlist"`。
- 使用 `groupPolicy="allowlist"` 时，设置 `channels.irc.groups` 以定义允许的 Channels。
- 使用 TLS（`channels.irc.tls=true`），除非您有意接受明文传输。

## 访问控制

IRC Channels 有两个单独的"门"：

1. **Channel 访问**（`groupPolicy` + `groups`）：机器人是否完全接受来自 Channel 的消息。
2. **发送者访问**（`groupAllowFrom` / 每个 Channel `groups["#channel"].allowFrom`）：谁被允许在该 Channel 内触发机器人。

配置键：

- DM 白名单（DM 发送者访问）：`channels.irc.allowFrom`
- 群组发送者白名单（Channel 发送者访问）：`channels.irc.groupAllowFrom`
- 每个 Channel 控制（Channel + 发送者 + 提及规则）：`channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` 允许未配置的 Channels（**默认情况下仍然有提及门控**）

白名单条目可以使用昵称或 `nick!user@host` 形式。

### 常见问题：`allowFrom` 用于 DM，不是 Channels

如果您看到这样的日志：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...这意味着发送者不被允许用于**群组/Channel** 消息。通过以下任一方式修复：

- 设置 `channels.irc.groupAllowFrom`（所有 Channels 的全局），或
- 设置每个 Channel 的发送者白名单：`channels.irc.groups["#channel"].allowFrom`

示例（允许 `#tuirc-dev` 中的任何人与机器人交谈）：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## 回复触发（提及）

即使允许 Channel（通过 `groupPolicy` + `groups`）并且允许发送者，OpenClaw 在群组上下文中默认为**提及门控**。

这意味着您可能会看到类似 `drop channel … (missing-mention)` 的日志，除非消息包含与机器人匹配的提及模式。

要使机器人在 IRC Channel 中**无需提及即可回复**，请为该 Channel 禁用提及门控：

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

或允许**所有** IRC Channels（无每个 Channel 白名单）并且仍然无需提及即可回复：

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## 安全注意事项（推荐用于公共 Channels）

如果您在公共 Channel 中允许 `allowFrom: ["*"]`，任何人都可以提示机器人。为了降低风险，请限制该 Channel 的工具。

### Channel 中每个人的相同工具

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### 每个发送者的不同工具（所有者获得更多权力）

使用 `toolsBySender` 对 `"*"` 应用更严格的策略，对您的昵称应用更宽松的策略：

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

注意：

- `toolsBySender` 键应使用 `id:` 前缀作为 IRC 发送者身份值：
  `id:eigen` 或 `id:eigen!~eigen@174.127.248.171`（后者实现更强的身份匹配）。
- 旧版无前缀键仍被接受，仅匹配 `id:`。
- 第一个匹配的发送者策略获胜；`"*"` 是通配符回退。

有关群组访问 vs 提及门控（以及它们如何交互）的更多信息，请参见：[/channels/groups](/channels/groups)。

## NickServ

要在连接后使用 NickServ 进行身份验证：

```json
{
  "channels": {
    "irc": {
      "nickserv": {
        "enabled": true,
        "service": "NickServ",
        "password": "your-nickserv-password"
      }
    }
  }
}
```

连接时可选的一次性注册：

```json
{
  "channels": {
    "irc": {
      "nickserv": {
        "register": true,
        "registerEmail": "bot@example.com"
      }
    }
  }
}
```

在昵称注册后禁用 `register` 以避免重复的 REGISTER 尝试。

## 环境变量

默认帐户支持：

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS`（逗号分隔）
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

## 故障排除

- 如果机器人连接但从不在 Channels 中回复，请验证 `channels.irc.groups` **以及**提及门控是否正在丢弃消息（`missing-mention`）。如果您希望它无需 ping 即可回复，请为 Channel 设置 `requireMention:false`。
- 如果登录失败，请验证昵称可用性和服务器密码。
- 如果 TLS 在自定义网络上失败，请验证主机/端口和证书设置。
