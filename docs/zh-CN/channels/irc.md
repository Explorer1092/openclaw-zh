---
title: IRC
summary: IRC 插件设置、访问控制和故障排除
read_when:
  - 你想将 OpenClaw 连接到 IRC 频道或私信
  - 你正在配置 IRC allowlist、群组策略或提及门控
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: 8807e2e3c0c4f5ea59b260a3ecc8bdd4a4fe45351692ce5afb4ab2009ea685ff
  source_path: channels/irc.md
  workflow: 15
---

# IRC

当你希望 OpenClaw 在经典频道（`#room`）和私信中使用时，可以使用 IRC。
IRC 作为扩展插件提供，但在主配置的 `channels.irc` 下进行配置。

## 快速开始

1. 在 `~/.openclaw/openclaw.json` 中启用 IRC 配置。
2. 至少设置以下内容：

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.libera.chat",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

3. 启动/重启 Gateway 网关：

```bash
openclaw gateway run
```

## 安全默认值

- `channels.irc.dmPolicy` 默认为 `"pairing"`。
- `channels.irc.groupPolicy` 默认为 `"allowlist"`。
- 使用 `groupPolicy="allowlist"` 时，设置 `channels.irc.groups` 以定义允许的频道。
- 使用 TLS（`channels.irc.tls=true`），除非你有意接受明文传输。

## 访问控制

IRC 频道有两个独立的"门控"：

1. **频道访问**（`groupPolicy` + `groups`）：机器人是否接受来自某频道的消息。
2. **发送者访问**（`groupAllowFrom` / 每频道 `groups["#channel"].allowFrom`）：谁可以在该频道内触发机器人。

配置键：

- 私信 allowlist（私信发送者访问）：`channels.irc.allowFrom`
- 群组发送者 allowlist（频道发送者访问）：`channels.irc.groupAllowFrom`
- 每频道控制（频道 + 发送者 + 提及规则）：`channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` 允许未配置的频道（**默认仍需提及门控**）

Allowlist 条目应使用稳定的发送者身份（`nick!user@host`）。
裸昵称匹配是可变的，仅在 `channels.irc.dangerouslyAllowNameMatching: true` 时启用。

### 常见误区：`allowFrom` 用于私信，不用于频道

如果你在日志中看到：

- `irc: drop group sender alice!ident@host (policy=allowlist)`

……这意味着该发送者没有被允许用于**群组/频道**消息。修复方法：

- 设置 `channels.irc.groupAllowFrom`（对所有频道生效），或
- 设置每频道发送者 allowlist：`channels.irc.groups["#channel"].allowFrom`

示例（允许 `#tuirc-dev` 中的任何人与机器人交互）：

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

即使频道已被允许（通过 `groupPolicy` + `groups`）且发送者也已被允许，OpenClaw 在群组上下文中仍默认使用**提及门控**。

这意味着除非消息中包含匹配机器人的提及模式，否则你可能会在日志中看到 `drop channel … (missing-mention)`。

要让机器人在 IRC 频道中**无需提及即可回复**，请为该频道禁用提及门控：

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

或者允许**所有** IRC 频道（无每频道 allowlist）且无需提及即可回复：

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

## 安全注意事项（公开频道推荐）

如果你在公开频道中允许 `allowFrom: ["*"]`，任何人都可以向机器人发送提示。
为降低风险，请限制该频道可用的工具。

### 频道内所有人使用相同工具

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

### 按发送者使用不同工具（所有者有更多权限）

使用 `toolsBySender` 对 `"*"` 应用更严格的策略，对你的昵称应用更宽松的策略：

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

注意事项：

- `toolsBySender` 键应使用 `id:` 前缀表示 IRC 发送者身份：
  `id:eigen` 或 `id:eigen!~eigen@174.127.248.171` 用于更强的匹配。
- 旧版无前缀键仍然被接受，仅作为 `id:` 匹配。
- 第一个匹配的发送者策略优先；`"*"` 是通配符回退。

有关群组访问与提及门控的更多信息（以及它们的交互方式），请参见：[/channels/groups](/channels/groups)。

## NickServ

连接后向 NickServ 认证：

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

连接时的可选一次性注册：

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

昵称注册后禁用 `register` 以避免重复的 REGISTER 尝试。

## 环境变量

默认账户支持：

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

- 如果机器人连接但从不在频道中回复，请验证 `channels.irc.groups`，**并**确认提及门控是否丢弃了消息（`missing-mention`）。如果你希望它无需 @ping 即可回复，请为该频道设置 `requireMention:false`。
- 如果登录失败，请验证昵称可用性和服务器密码。
- 如果 TLS 在自定义网络上失败，请验证主机/端口和证书设置。
