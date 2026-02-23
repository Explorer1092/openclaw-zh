---
mmh3_hash: "38d958d2e2208e660b28900dbc8f6b4a"
summary: "通过 imsg 实现传统 iMessage 支持（基于 stdio 的 JSON-RPC）。新设置应使用 BlueBubbles。"
read_when:
  - 设置 iMessage 支持
  - 调试 iMessage 发送/接收
title: "iMessage"
---

# iMessage (传统: imsg)

<Warning>
对于新的 iMessage 部署，使用 <a href="/channels/bluebubbles">BlueBubbles</a>。

`imsg` 集成是传统的，可能在未来版本中被移除。
</Warning>

状态：传统外部 CLI 集成。Gateway 生成 `imsg rpc` 并通过 stdio 上的 JSON-RPC 通信（无单独守护进程/端口）。

<CardGroup cols={3}>
  <Card title="BlueBubbles（推荐）" icon="message-circle" href="/channels/bluebubbles">
    新设置的首选 iMessage 路径。
  </Card>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    iMessage DM 默认为 pairing 模式。
  </Card>
  <Card title="Configuration reference" icon="settings" href="/gateway/configuration-reference#imessage">
    完整的 iMessage 字段参考。
  </Card>
</CardGroup>

## 快速设置

<Tabs>
  <Tab title="本地 Mac（快速路径）">
    <Steps>
      <Step title="安装并验证 imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="配置 OpenClaw">

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

      </Step>

      <Step title="启动 gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="批准首次 DM pairing（默认 dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Pairing 请求 1 小时后过期。
      </Step>
    </Steps>

  </Tab>

  <Tab title="通过 SSH 远程 Mac">
    OpenClaw 只需要与 stdio 兼容的 `cliPath`，因此你可以将 `cliPath` 指向一个包装脚本，该脚本通过 SSH 连接到远程 Mac 并运行 `imsg`。

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
      // 可选：覆盖允许的附件根目录。
      // 默认包含 /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    如果未设置 `remoteHost`，OpenClaw 会尝试通过解析 SSH 包装脚本自动检测它。
    `remoteHost` 必须为 `host` 或 `user@host` 格式（不含空格或 SSH 选项）。
    OpenClaw 对 SCP 使用严格主机密钥检查，因此中继主机密钥必须已存在于 `~/.ssh/known_hosts` 中。
    附件路径会根据允许的根目录（`attachmentRoots` / `remoteAttachmentRoots`）进行验证。

  </Tab>
</Tabs>

## 要求和权限（macOS）

- Messages 必须在运行 `imsg` 的 Mac 上登录。
- 运行 OpenClaw/`imsg` 的进程上下文需要完全磁盘访问权限（Messages DB 访问）。
- 需要自动化权限才能通过 Messages.app 发送消息。

<Tip>
权限按进程上下文授予。如果 gateway 无头运行（LaunchAgent/SSH），在同一上下文中运行一次性交互式命令以触发提示：

```bash
imsg chats --limit 1
# 或
imsg send <handle> "test"
```

</Tip>

## 访问控制和路由

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` 控制私聊：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    Allowlist 字段：`channels.imessage.allowFrom`。

    Allowlist 条目可以是 handle 或聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（配置时默认）
    - `open`
    - `disabled`

    群组发送者 allowlist：`channels.imessage.groupAllowFrom`。

    运行时回退：如果未设置 `groupAllowFrom`，iMessage 群组发送者检查在可用时回退到 `allowFrom`。
    运行时注意：如果 `channels.imessage` 完全缺失，运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    群组的提及门控：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
    - 如果没有配置模式，无法强制执行提及门控

    来自授权发送者的控制命令可以绕过群组中的提及门控。

  </Tab>

  <Tab title="会话和确定性回复">
    - DM 使用直接路由；群组使用群组路由。
    - 使用默认 `session.dmScope=main`，iMessage DM 折叠到 agent 主会话。
    - 群组会话是隔离的（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复使用原始 channel/target 元数据路由回 iMessage。

    类群组线程行为：

    某些多参与者 iMessage 线程可能以 `is_group=false` 到达。
    如果该 `chat_id` 在 `channels.imessage.groups` 下显式配置，OpenClaw 将其视为群组流量（群组门控 + 群组会话隔离）。

  </Tab>
</Tabs>

## 部署模式

<AccordionGroup>
  <Accordion title="专用 bot macOS 用户（独立 iMessage 身份）">
    使用专用 Apple ID 和 macOS 用户，以便 bot 流量与你的个人 Messages 配置文件隔离。

    典型流程：

    1. 创建/登录专用 macOS 用户。
    2. 在该用户中使用 bot Apple ID 登录 Messages。
    3. 在该用户中安装 `imsg`。
    4. 创建 SSH 包装器，以便 OpenClaw 可以在该用户上下文中运行 `imsg`。
    5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户配置文件。

    首次运行可能需要在该 bot 用户会话中进行 GUI 批准（自动化 + 完全磁盘访问）。

  </Accordion>

  <Accordion title="通过 Tailscale 远程 Mac（示例）">
    常见拓扑：

    - gateway 在 Linux/VM 上运行
    - iMessage + `imsg` 在你的 tailnet 中的 Mac 上运行
    - `cliPath` 包装器使用 SSH 运行 `imsg`
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

    使用 SSH 密钥，以便 SSH 和 SCP 都是非交互式的。
    事先确保主机密钥被信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`），以填充 `known_hosts`。

  </Accordion>

  <Accordion title="多账户模式">
    iMessage 支持 `channels.imessage.accounts` 下的每账户配置。

    每个账户可以覆盖字段，如 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、历史设置和附件根目录 allowlist。

  </Accordion>
</AccordionGroup>

## 媒体、分块和投递目标

<AccordionGroup>
  <Accordion title="附件和媒体">
    - 入站附件摄取是可选的：`channels.imessage.includeAttachments`
    - 当设置 `remoteHost` 时，可以通过 SCP 获取远程附件路径
    - 附件路径必须匹配允许的根目录：
      - `channels.imessage.attachmentRoots`（本地）
      - `channels.imessage.remoteAttachmentRoots`（远程 SCP 模式）
      - 默认根目录模式：`/Users/*/Library/Messages/Attachments`
    - SCP 使用严格主机密钥检查（`StrictHostKeyChecking=yes`）
    - 出站媒体大小使用 `channels.imessage.mediaMaxMb`（默认 16 MB）
  </Accordion>

  <Accordion title="出站分块">
    - 文本块限制：`channels.imessage.textChunkLimit`（默认 4000）
    - 块模式：`channels.imessage.chunkMode`
      - `length`（默认）
      - `newline`（段落优先拆分）
  </Accordion>

  <Accordion title="寻址格式">
    首选显式目标：

    - `chat_id:123`（推荐用于稳定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle 目标也受支持：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## 配置写入

iMessage 默认允许 channel 发起的配置写入（用于 `/config set|unset`，当 `commands.config: true` 时）。

禁用：

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

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支持 RPC">
    验证二进制文件和 RPC 支持：

```bash
imsg rpc --help
openclaw channels status --probe
```

    如果探测报告不支持 RPC，请更新 `imsg`。

  </Accordion>

  <Accordion title="DM 被忽略">
    检查：

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - pairing 批准（`openclaw pairing list imessage`）

  </Accordion>

  <Accordion title="群组消息被忽略">
    检查：

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - `channels.imessage.groups` allowlist 行为
    - 提及模式配置（`agents.list[].groupChat.mentionPatterns`）

  </Accordion>

  <Accordion title="远程附件失败">
    检查：

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - 从 gateway 主机进行 SSH/SCP 密钥认证
    - 主机密钥存在于 gateway 主机的 `~/.ssh/known_hosts` 中
    - 运行 Messages 的 Mac 上的远程路径可读性

  </Accordion>

  <Accordion title="错过了 macOS 权限提示">
    在同一用户/会话上下文中的交互式 GUI 终端中重新运行并批准提示：

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    确认为运行 OpenClaw/`imsg` 的进程上下文授予了完全磁盘访问 + 自动化权限。

  </Accordion>
</AccordionGroup>

## 配置参考指针

- [Configuration reference - iMessage](/gateway/configuration-reference#imessage)
- [Gateway configuration](/gateway/configuration)
- [Pairing](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)
