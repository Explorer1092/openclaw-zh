---
read_when:
  - 设置 iMessage 支持
  - 调试 iMessage 发送/接收
summary: 通过 imsg（基于 stdio 的 JSON-RPC）实现旧版 iMessage 支持。新部署应使用 BlueBubbles。
title: iMessage
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: 6ab656a7a044ce9b95627d24e6a5e159a853b341ab7e5a070f901d10fd5d5fce
  source_path: channels/imessage.md
  workflow: 15
---

# iMessage（旧版：imsg）

> **警告**：对于新的 iMessage 部署，请使用 [BlueBubbles](/channels/bluebubbles)。
>
> `imsg` 集成为旧版，可能在未来版本中移除。

状态：旧版外部 CLI 集成。Gateway 网关生成 `imsg rpc`，通过 stdio 上的 JSON-RPC 通信（无独立守护进程/端口）。

## 快速设置

### 本地 Mac（快速路径）

1. 安装并验证 imsg：

   ```bash
   brew install steipete/tap/imsg
   imsg rpc --help
   ```

2. 配置 OpenClaw：

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/usr/local/bin/imsg",
         dbPath: "/Users/<you>/Library/Messages/chat.db",
       },
     },
   }
   ```

3. 启动 Gateway 网关：

   ```bash
   openclaw gateway
   ```

4. 批准首次私信配对（默认 dmPolicy）：

   ```bash
   openclaw pairing list imessage
   openclaw pairing approve imessage <CODE>
   ```

   配对请求 1 小时后过期。

### 通过 SSH 连接远程 Mac

OpenClaw 只需要一个 stdio 兼容的 `cliPath`，所以你可以将 `cliPath` 指向一个通过 SSH 连接到远程 Mac 并运行 `imsg` 的包装脚本：

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

启用附件时的推荐配置：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // 用于 SCP 附件获取
      includeAttachments: true,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

如果未设置 `remoteHost`，OpenClaw 会尝试通过解析 SSH 包装脚本自动检测。
`remoteHost` 必须为 `host` 或 `user@host`（不含空格或 SSH 选项）。
OpenClaw 对 SCP 使用严格的主机密钥检查，因此中继主机密钥必须已存在于 `~/.ssh/known_hosts` 中。
附件路径根据允许的根目录（`attachmentRoots`/`remoteAttachmentRoots`）进行验证。

## 要求和权限（macOS）

- 运行 `imsg` 的 Mac 上必须已登录"信息"。
- 运行 OpenClaw/`imsg` 的进程上下文需要完全磁盘访问权限（访问"信息"数据库）。
- 发送消息时需要自动化权限。

> **提示**：权限按进程上下文授予。如果 Gateway 网关以无头模式运行（LaunchAgent/SSH），请在同一上下文中运行一次交互式命令以触发权限提示：
>
> ```bash
> imsg chats --limit 1
> # 或
> imsg send <handle> "test"
> ```

## 访问控制和路由

### 私信策略

`channels.imessage.dmPolicy` 控制私信：

- `pairing`（默认）
- `allowlist`
- `open`（需要 `allowFrom` 包含 `"*"`）
- `disabled`

Allowlist 字段：`channels.imessage.allowFrom`。

Allowlist 条目可以是 handle 或聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。

### 群组策略和提及

`channels.imessage.groupPolicy` 控制群组处理：

- `allowlist`（配置后的默认值）
- `open`
- `disabled`

群组发送者 allowlist：`channels.imessage.groupAllowFrom`。

运行时回退：如果 `groupAllowFrom` 未设置，iMessage 群组发送者检查会回退到 `allowFrom`（如果可用）。
运行时注意：如果 `channels.imessage` 完全缺失，运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使 `channels.defaults.groupPolicy` 已设置）。

群组提及门控：

- iMessage 没有原生提及元数据
- 提及检测使用正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
- 未配置模式时，提及门控无法强制执行

来自授权发送者的控制命令可以绕过群组中的提及门控。

### 会话和确定性回复

- 私信使用直接路由；群组使用群组路由。
- 使用默认 `session.dmScope=main` 时，iMessage 私信合并到智能体主会话。
- 群组会话是隔离的（`agent:<agentId>:imessage:group:<chat_id>`）。
- 回复通过发起渠道/目标元数据路由回 iMessage。

类群组线程行为：

某些多参与者 iMessage 线程可能以 `is_group=false` 到达。
如果该 `chat_id` 在 `channels.imessage.groups` 下显式配置，OpenClaw 将其视为群组流量（群组门控 + 群组会话隔离）。

## ACP 会话绑定

旧版 iMessage 聊天也可以绑定到 ACP 会话。

快速操作流程：

- 在私信或已授权的群聊中运行 `/acp spawn codex --bind here`。
- 该 iMessage 对话中的后续消息将路由到已生成的 ACP 会话。
- `/new` 和 `/reset` 会就地重置同一个绑定的 ACP 会话。
- `/acp close` 关闭 ACP 会话并移除绑定。

通过顶层 `bindings[]` 条目配置持久绑定也受支持，其中 `type: "acp"` 且 `match.channel: "imessage"`。

`match.peer.id` 可以使用：

- 标准化的私信 handle，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`（推荐用于稳定的群组绑定）
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

示例：

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

共享 ACP 绑定行为请参见 [ACP 智能体](/tools/acp-agents)。

## 部署模式

### 专用机器人 macOS 用户（独立 iMessage 身份）

使用专用 Apple ID 和 macOS 用户，使机器人流量与你的个人"信息"档案隔离。

典型流程：

1. 创建/登录专用 macOS 用户。
2. 在该用户中使用机器人 Apple ID 登录"信息"。
3. 在该用户中安装 `imsg`。
4. 创建 SSH 包装脚本，使 OpenClaw 可以在该用户上下文中运行 `imsg`。
5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户档案。

首次运行可能需要在机器人用户会话中进行 GUI 审批（自动化 + 完全磁盘访问权限）。

### 通过 Tailscale 连接远程 Mac（示例）

常见拓扑：

- Gateway 网关运行在 Linux/虚拟机
- iMessage + `imsg` 运行在你的 tailnet 中的 Mac 上
- `cliPath` 包装脚本使用 SSH 运行 `imsg`
- `remoteHost` 启用 SCP 附件获取

示例：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

使用 SSH 密钥使 SSH 和 SCP 均为非交互式。首先确保信任主机密钥（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），以便填充 `known_hosts`。

### 多账户模式

iMessage 支持 `channels.imessage.accounts` 下的每账户配置。

每个账户可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、历史设置和附件根目录 allowlist 等字段。

## 媒体、分块和投递目标

### 附件和媒体

- 入站附件摄取为可选：`channels.imessage.includeAttachments`
- 设置 `remoteHost` 后，远程附件路径可以通过 SCP 获取
- 附件路径必须匹配允许的根目录：
  - `channels.imessage.attachmentRoots`（本地）
  - `channels.imessage.remoteAttachmentRoots`（远程 SCP 模式）
  - 默认根目录模式：`/Users/*/Library/Messages/Attachments`
- SCP 使用严格的主机密钥检查（`StrictHostKeyChecking=yes`）
- 出站媒体大小使用 `channels.imessage.mediaMaxMb`（默认 16 MB）

### 出站分块

- 文本分块限制：`channels.imessage.textChunkLimit`（默认 4000）
- 分块模式：`channels.imessage.chunkMode`
  - `length`（默认）
  - `newline`（段落优先分割）

### 寻址格式

优先使用显式目标：

- `chat_id:123`（推荐用于稳定路由）
- `chat_guid:...`
- `chat_identifier:...`

也支持 handle 目标：

- `imessage:+1555...`
- `sms:+1555...`
- `user@example.com`

```bash
imsg chats --limit 20
```

## 配置写入

默认情况下，iMessage 允许写入由 `/config set|unset` 触发的配置更新（需要 `commands.config: true`）。

禁用方式：

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## 故障排除

**imsg 未找到或不支持 RPC**：

```bash
imsg rpc --help
openclaw channels status --probe
```

如果探测报告不支持 RPC，请更新 `imsg`。

**私信被忽略**：

检查：

- `channels.imessage.dmPolicy`
- `channels.imessage.allowFrom`
- 配对审批（`openclaw pairing list imessage`）

**群组消息被忽略**：

检查：

- `channels.imessage.groupPolicy`
- `channels.imessage.groupAllowFrom`
- `channels.imessage.groups` allowlist 行为
- 提及模式配置（`agents.list[].groupChat.mentionPatterns`）

**远程附件失败**：

检查：

- `channels.imessage.remoteHost`
- `channels.imessage.remoteAttachmentRoots`
- 从 Gateway 网关主机到远程 Mac 的 SSH/SCP 密钥认证
- Gateway 网关主机 `~/.ssh/known_hosts` 中存在主机密钥
- 运行"信息"的 Mac 上远程路径的可读性

**macOS 权限提示被错过**：

在同一用户/会话上下文的交互式 GUI 终端中重新运行并批准提示：

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

确认运行 OpenClaw/`imsg` 的进程上下文已授予完全磁盘访问权限 + 自动化权限。

## 配置参考

- [配置参考 - iMessage](/gateway/configuration-reference#imessage)
- [Gateway 网关配置](/gateway/configuration)
- [配对](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)
