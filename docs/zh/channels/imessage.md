---
title: "iMessage (imsg)"
sidebarTitle: "iMessage"
mmh3_hash: "9359a0c9086652b4e5ae37e598b6e23f"
summary: "通过 imsg (基于 stdio 的 JSON-RPC) 实现 iMessage 支持，包括设置和 chat_id 路由"
read_when: ["设置 iMessage 支持","调试 iMessage 发送/接收"]
---
# iMessage (imsg)


状态：外部 CLI 集成。Gateway 生成 `imsg rpc` 进程(基于 stdio 的 JSON-RPC)。

## 快速设置(新手)
1) 确保 Messages 已在此 Mac 上登录。
2) 安装 `imsg`:
   - `brew install steipete/tap/imsg`
3) 配置 OpenClaw 的 `channels.imessage.cliPath` 和 `channels.imessage.dbPath`。
4) 启动 gateway 并批准任何 macOS 提示(自动化 + 完全磁盘访问权限)。

最小配置:
```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db"
    }
  }
}
```

## 它是什么
- 基于 macOS 上的 `imsg` 的 iMessage 频道。
- 确定性路由：回复始终返回到 iMessage。
- DM 共享 agent 的主会话；群组是隔离的(`agent:<agentId>:imessage:group:<chat_id>`)。
- 如果收到 `is_group=false` 的多参与者线程，您仍可以使用 `channels.imessage.groups` 通过 `chat_id` 隔离它(请参见下面的"类群组线程")。

## 配置写入
默认情况下，iMessage 允许写入由 `/config set|unset` 触发的配置更新(需要 `commands.config: true`)。

禁用方式:
```json5
{
  channels: { imessage: { configWrites: false } }
}
```

## 要求
- 已登录 Messages 的 macOS。
- OpenClaw + `imsg` 的完全磁盘访问权限(Messages DB 访问)。
- 发送时的自动化权限。
- `channels.imessage.cliPath` 可以指向任何代理 stdin/stdout 的命令(例如，通过 SSH 连接到另一台 Mac 并运行 `imsg rpc` 的包装脚本)。

## 设置(快速路径)
1) 确保 Messages 已在此 Mac 上登录。
2) 配置 iMessage 并启动 gateway。

### 专用 bot macOS 用户(用于隔离身份)
如果您希望 bot 从**独立的 iMessage 身份**发送(并保持您的个人 Messages 干净)，请使用专用的 Apple ID + 专用的 macOS 用户。

1) 创建专用 Apple ID(例如: `my-cool-bot@icloud.com`)。
   - Apple 可能需要电话号码进行验证 / 2FA。
2) 创建 macOS 用户(例如: `openclawhome`)并登录。
3) 在该 macOS 用户中打开 Messages，并使用 bot Apple ID 登录 iMessage。
4) 启用远程登录(系统设置 → 通用 → 共享 → 远程登录)。
5) 安装 `imsg`:
   - `brew install steipete/tap/imsg`
6) 设置 SSH，使 `ssh <bot-macos-user>@localhost true` 无需密码即可工作。
7) 将 `channels.imessage.accounts.bot.cliPath` 指向以 bot 用户身份运行 `imsg` 的 SSH 包装器。

首次运行注意事项：发送/接收可能需要在 *bot macOS 用户*中进行 GUI 批准(自动化 + 完全磁盘访问)。如果 `imsg rpc` 看起来卡住或退出，请登录该用户(屏幕共享有帮助)，运行一次性 `imsg chats --limit 1` / `imsg send ...`，批准提示，然后重试。

示例包装器(`chmod +x`)。将 `<bot-macos-user>` 替换为您的实际 macOS 用户名:
```bash
#!/usr/bin/env bash
set -euo pipefail

# 首次运行交互式 SSH 以接受主机密钥:
#   ssh <bot-macos-user>@localhost true
exec /usr/bin/ssh -o BatchMode=yes -o ConnectTimeout=5 -T <bot-macos-user>@localhost \
  "/usr/local/bin/imsg" "$@"
```

示例配置:
```json5
{
  channels: {
    imessage: {
      enabled: true,
      accounts: {
        bot: {
          name: "Bot",
          enabled: true,
          cliPath: "/path/to/imsg-bot",
          dbPath: "/Users/<bot-macos-user>/Library/Messages/chat.db"
        }
      }
    }
  }
}
```

对于单账户设置，使用扁平选项(`channels.imessage.cliPath`、`channels.imessage.dbPath`)而不是 `accounts` 映射。

### 远程/SSH 变体(可选)
如果您希望在另一台 Mac 上使用 iMessage，请将 `channels.imessage.cliPath` 设置为通过 SSH 在远程 macOS 主机上运行 `imsg` 的包装器。OpenClaw 只需要 stdio。

示例包装器:
```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

**远程附件:** 当 `cliPath` 通过 SSH 指向远程主机时，Messages 数据库中的附件路径引用远程机器上的文件。OpenClaw 可以通过设置 `channels.imessage.remoteHost` 自动通过 SCP 获取这些文件:

```json5
{
  channels: {
    imessage: {
      cliPath: "~/imsg-ssh",                     // 到远程 Mac 的 SSH 包装器
      remoteHost: "user@gateway-host",           // 用于 SCP 文件传输
      includeAttachments: true
    }
  }
}
```

如果未设置 `remoteHost`，OpenClaw 会尝试通过解析包装脚本中的 SSH 命令来自动检测它。建议使用显式配置以确保可靠性。

#### 通过 Tailscale 的远程 Mac(示例)
如果 Gateway 运行在 Linux 主机/VM 上但 iMessage 必须在 Mac 上运行，Tailscale 是最简单的桥接方式：Gateway 通过 tailnet 与 Mac 通信，通过 SSH 运行 `imsg`，并通过 SCP 传回附件。

架构:
```
┌──────────────────────────────┐          SSH (imsg rpc)          ┌──────────────────────────┐
│ Gateway 主机 (Linux/VM)      │──────────────────────────────────▶│ Mac with Messages + imsg │
│ - openclaw gateway           │          SCP (附件)               │ - Messages 已登录         │
│ - channels.imessage.cliPath  │◀──────────────────────────────────│ - 已启用远程登录          │
└──────────────────────────────┘                                   └──────────────────────────┘
              ▲
              │ Tailscale tailnet (主机名或 100.x.y.z)
              ▼
        user@gateway-host
```

具体配置示例(Tailscale 主机名):
```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db"
    }
  }
}
```

示例包装器(`~/.openclaw/scripts/imsg-ssh`):
```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

注意事项:
- 确保 Mac 已登录 Messages，并且已启用远程登录。
- 使用 SSH 密钥，使 `ssh bot@mac-mini.tailnet-1234.ts.net` 无需提示即可工作。
- `remoteHost` 应与 SSH 目标匹配，以便 SCP 可以获取附件。

多账户支持：使用 `channels.imessage.accounts` 配置每个账户并设置可选的 `name`。请参阅 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) 了解共享模式。不要提交 `~/.openclaw/openclaw.json`(通常包含 token)。

## 访问控制(DM + 群组)
DM:
- 默认: `channels.imessage.dmPolicy = "pairing"`。
- 未知发送者收到配对码；在批准之前消息被忽略(码在 1 小时后过期)。
- 通过以下方式批准:
  - `openclaw pairing list imessage`
  - `openclaw pairing approve imessage <CODE>`
- 配对是 iMessage DM 的默认 token 交换。详情: [配对](/start/pairing)

群组:
- `channels.imessage.groupPolicy = open | allowlist | disabled`。
- 当设置为 `allowlist` 时，`channels.imessage.groupAllowFrom` 控制谁可以在群组中触发。
- 提及门控使用 `agents.list[].groupChat.mentionPatterns`(或 `messages.groupChat.mentionPatterns`)，因为 iMessage 没有原生提及元数据。
- 多 agent 覆盖：在 `agents.list[].groupChat.mentionPatterns` 上设置每个 agent 的模式。

## 工作原理(行为)
- `imsg` 流式传输消息事件；gateway 将它们规范化为共享频道信封。
- 回复始终路由回相同的 chat id 或 handle。

## 类群组线程(`is_group=false`)
某些 iMessage 线程可以有多个参与者，但根据 Messages 存储聊天标识符的方式，仍然以 `is_group=false` 到达。

如果您在 `channels.imessage.groups` 下显式配置 `chat_id`，OpenClaw 将该线程视为"群组"用于:
- 会话隔离(单独的 `agent:<agentId>:imessage:group:<chat_id>` 会话密钥)
- 群组白名单/提及门控行为

示例:
```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "42": { "requireMention": false }
      }
    }
  }
}
```
当您希望为特定线程提供隔离的个性/模型时，这很有用(请参阅[多 agent 路由](/concepts/multi-agent))。有关文件系统隔离，请参阅[沙箱](/gateway/sandboxing)。

## 媒体 + 限制
- 通过 `channels.imessage.includeAttachments` 可选的附件摄取。
- 通过 `channels.imessage.mediaMaxMb` 限制媒体大小。

## 限制
- 出站文本被分块为 `channels.imessage.textChunkLimit`(默认 4000)。
- 可选换行分块：设置 `channels.imessage.chunkMode="newline"` 以在长度分块之前按空白行(段落边界)拆分。
- 媒体上传受 `channels.imessage.mediaMaxMb` 限制(默认 16)。

## 寻址/传递目标
优先使用 `chat_id` 以实现稳定路由:
- `chat_id:123`(首选)
- `chat_guid:...`
- `chat_identifier:...`
- 直接 handle: `imessage:+1555` / `sms:+1555` / `user@example.com`

列出聊天:
```
imsg chats --limit 20
```

## 配置参考(iMessage)
完整配置: [配置](/gateway/configuration)

提供商选项:
- `channels.imessage.enabled`: 启用/禁用频道启动。
- `channels.imessage.cliPath`: `imsg` 的路径。
- `channels.imessage.dbPath`: Messages DB 路径。
- `channels.imessage.remoteHost`: 当 `cliPath` 指向远程 Mac 时用于 SCP 附件传输的 SSH 主机(例如 `user@gateway-host`)。如果未设置，则从 SSH 包装器自动检测。
- `channels.imessage.service`: `imessage | sms | auto`。
- `channels.imessage.region`: SMS 区域。
- `channels.imessage.dmPolicy`: `pairing | allowlist | open | disabled`(默认: pairing)。
- `channels.imessage.allowFrom`: DM 白名单(handle、电子邮件、E.164 号码或 `chat_id:*`)。`open` 需要 `"*"`。iMessage 没有用户名；使用 handle 或聊天目标。
- `channels.imessage.groupPolicy`: `open | allowlist | disabled`(默认: allowlist)。
- `channels.imessage.groupAllowFrom`: 群组发送者白名单。
- `channels.imessage.historyLimit` / `channels.imessage.accounts.*.historyLimit`: 作为上下文包含的最大群组消息数(0 禁用)。
- `channels.imessage.dmHistoryLimit`: DM 历史记录限制(用户轮次)。每用户覆盖: `channels.imessage.dms["<handle>"].historyLimit`。
- `channels.imessage.groups`: 每群组默认值 + 白名单(使用 `"*"` 作为全局默认值)。
- `channels.imessage.includeAttachments`: 将附件摄取到上下文中。
- `channels.imessage.mediaMaxMb`: 入站/出站媒体上限(MB)。
- `channels.imessage.textChunkLimit`: 出站分块大小(字符)。
- `channels.imessage.chunkMode`: `length`(默认)或 `newline` 以在长度分块之前按空白行(段落边界)拆分。

相关全局选项:
- `agents.list[].groupChat.mentionPatterns`(或 `messages.groupChat.mentionPatterns`)。
- `messages.responsePrefix`。
