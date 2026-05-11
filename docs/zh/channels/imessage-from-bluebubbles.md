---
mmh3_hash: "e7d4450c5c79624ceb620bc69989c2f9"
summary: "将旧版 BlueBubbles 配置迁移到捆绑的 iMessage Plugin，不丢失配对、白名单或群组绑定。"
read_when:
  - 计划从 BlueBubbles 迁移到捆绑的 iMessage Plugin
  - 将 BlueBubbles 配置键转换为 iMessage 等效项
  - 在启用 iMessage Plugin 之前验证 imsg
title: "从 BlueBubbles 迁移"
---

捆绑的 `imessage` Plugin 现在通过 JSON-RPC 驱动 [`steipete/imsg`](https://github.com/steipete/imsg) 来访问与 BlueBubbles 相同的私有 API 接口（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、群组管理、附件）。如果您已经在 Mac 上运行了 `imsg`，可以停用 BlueBubbles 服务器，让 Plugin 直接与 Messages.app 通信。

BlueBubbles 支持已被移除。OpenClaw 仅通过 `imsg` 支持 iMessage。本指南适用于将旧版 `channels.bluebubbles` 配置迁移到 `channels.imessage`；没有其他受支持的迁移路径。

## 何时适合进行此迁移

- 您已经在运行 Messages.app 的同一台 Mac 上（或通过 SSH 可访问的 Mac 上）运行了 `imsg`。
- 您希望减少活动部件——无需单独的 BlueBubbles 服务器、无需验证的 REST 端点、无需 webhook 管道。只需一个 CLI 二进制文件，而不是服务器 + 客户端应用 + 辅助程序。
- 您使用的是[受支持的 macOS / `imsg` 构建版本](/channels/imessage#requirements-and-permissions-macos)，其中私有 API 探测报告 `available: true`。

## imsg 的功能

`imsg` 是 Messages 的本地 macOS CLI。OpenClaw 将 `imsg rpc` 作为子进程启动，并通过 stdin/stdout 进行 JSON-RPC 通信。没有 HTTP 服务器、webhook URL、后台守护进程、启动代理或需要暴露的端口。

- 读取来自 `~/Library/Messages/chat.db`，使用只读 SQLite 句柄。
- 实时入站消息来自 `imsg watch` / `watch.subscribe`，它通过文件系统事件跟踪 `chat.db`，并有轮询回退。
- 发送使用 Messages.app 自动化进行普通文本和文件发送。
- 高级操作使用 `imsg launch` 将 `imsg` 辅助程序注入 Messages.app。这解锁了已读回执、正在输入指示器、富文本发送、编辑、撤回、线程回复、tapback 和群组管理。
- Linux 构建可以检查复制的 `chat.db`，但无法发送、监视实时 Mac 数据库或驱动 Messages.app。对于 OpenClaw iMessage，请在已登录的 Mac 上运行 `imsg` 或通过 SSH 包装器访问该 Mac。

## 开始之前

1. 在运行 Messages.app 的 Mac 上安装 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   如果 `imsg chats` 失败并出现 `unable to open database file`、空输出或 `authorization denied`，请向启动 `imsg` 的终端、编辑器、Node 进程、Gateway 服务或 SSH 父进程授予完全磁盘访问权限，然后重新打开该父进程。

2. 在更改 OpenClaw 配置之前，验证读取、监视、发送和 RPC 接口：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   将 `42` 替换为 `imsg chats` 中的真实聊天 id。发送需要 Messages.app 的自动化权限。如果 OpenClaw 将通过 SSH 运行，请通过 OpenClaw 将使用的相同 SSH 包装器或用户上下文运行这些命令。

3. 当您需要高级操作时，启用私有 API 桥接：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 需要禁用 SIP。基本发送、历史记录和监视无需 `imsg launch` 即可工作；高级操作则需要。

4. 通过 OpenClaw 验证桥接：

   ```bash
   openclaw channels status --probe
   ```

   您需要 `imessage.privateApi.available: true`。如果报告 `false`，请先修复该问题——请参阅[功能检测](/channels/imessage#private-api-actions)。

5. 备份您的配置：

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 配置转换

iMessage 和 BlueBubbles 共享大量 channel 级别的配置。更改的键主要是传输部分（REST 服务器 vs 本地 CLI）。行为键（`dmPolicy`、`groupPolicy`、`allowFrom` 等）保持相同的含义。

| BlueBubbles                                                | 捆绑的 iMessage                                   | 说明                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 相同语义。                                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.serverUrl`                           | _（已移除）_                               | 无 REST 服务器——Plugin 通过 stdio 生成 `imsg rpc`。                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.password`                            | _（已移除）_                               | 无需 webhook 身份验证。                                                                                                                                                                                                                                                                                                                            |
| _（隐式）_                                                  | `channels.imessage.cliPath`               | `imsg` 的路径（默认 `imsg`）；用于 SSH 的包装脚本。                                                                                                                                                                                                                                                                                               |
| _（隐式）_                                                  | `channels.imessage.dbPath`                | 可选的 Messages.app `chat.db` 覆盖；省略时自动检测。                                                                                                                                                                                                                                                                                             |
| _（隐式）_                                                  | `channels.imessage.remoteHost`            | `host` 或 `user@host`——仅当 `cliPath` 是 SSH 包装器且您需要 SCP 附件获取时才需要。                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 相同值（`pairing` / `allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                         |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 配对批准按句柄传递，而不是按 token。                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 相同值（`allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                     |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。                                                                                                                                                                                                                                                                                                                                          |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **逐字复制此内容，包括任何 `groups: { "*": { ... } }` 通配符条目。** 每组的 `requireMention`、`tools`、`toolsBySender` 均传递。使用 `groupPolicy: "allowlist"` 时，空或缺失的 `groups` 块会静默丢弃所有群组消息——请参阅下面的"群组注册表陷阱"。                                                                                                   |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 默认 `true`。使用捆绑的 Plugin 时，仅当私有 API 探测正常运行时才触发。                                                                                                                                                                                                                                                                           |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 相同形状，**同样默认关闭**。如果您在 BlueBubbles 上启用了附件，则必须在 iMessage 块上重新显式设置此项——它不会隐式传递，在您执行此操作之前，入站照片/媒体将被静默丢弃，日志中不会出现 `Inbound message` 行。                                                                                                                                         |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本地根目录；相同的通配符规则。                                                                                                                                                                                                                                                                                                                   |
| _（不适用）_                                                | `channels.imessage.remoteAttachmentRoots` | 仅当 `remoteHost` 设置用于 SCP 获取时使用。                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 默认 16 MB（BlueBubbles 默认为 8 MB）。如果您想保持较低上限，请显式设置。                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 两者默认均为 4000。                                                                                                                                                                                                                                                                                                                              |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 相同的选择加入。仅限私信——群聊在两个 channel 上都保持即时的逐消息分发。在未设置显式 `messages.inbound.byChannel.imessage` 的情况下启用时，将默认入站防抖扩展至 2500 毫秒。参见 [iMessage 文档 § 合并拆分发送的私信](/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。                                               |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _（不适用）_                               | iMessage 已从 `chat.db` 读取发送者显示名称。                                                                                                                                                                                                                                                                                                    |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 每个操作的开关：`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`。                                                                                                                                                                   |

多账户配置（`channels.bluebubbles.accounts.*`）与 `channels.imessage.accounts.*` 一一对应。

## 群组注册表陷阱

捆绑的 iMessage Plugin 会**依次**运行两个单独的群组白名单门控。两者都必须通过，群组消息才能到达 agent：

1. **发送者 / 聊天目标白名单**（`channels.imessage.groupAllowFrom`）——由 `isAllowedIMessageSender` 检查。按发送者句柄、`chat_guid`、`chat_identifier` 或 `chat_id` 匹配入站消息。与 BlueBubbles 形状相同。
2. **群组注册表**（`channels.imessage.groups`）——由 `inbound-processing.ts:199` 中的 `resolveChannelGroupPolicy` 检查。使用 `groupPolicy: "allowlist"` 时，此门控需要：
   - 一个 `groups: { "*": { ... } }` 通配符条目（设置 `allowAll = true`），或
   - `groups` 下的显式每 `chat_id` 条目。

如果门控 1 通过但门控 2 失败，消息将被丢弃。Plugin 会发出两个 `warn` 级别的信号，因此在默认日志级别下不再是静默的：

- 在默认日志级别下，如果设置了 `groupPolicy: "allowlist"` 但 `channels.imessage.groups` 为空（无 `"*"` 通配符，无每 `chat_id` 条目），则在每个账户首次启动时发出一次 `warn`——在任何消息到达之前触发。
- 在运行时第一次为特定群组丢弃消息时，发出一次每 `chat_id` 的 `warn`，命名 chat_id 以及添加到 `groups` 以允许它的确切键。

私信继续工作，因为它们采用不同的代码路径。

这是最常见的 BlueBubbles → 捆绑 iMessage 迁移失败模式：运营商复制了 `groupAllowFrom` 和 `groupPolicy` 但跳过了 `groups` 块，因为 BlueBubbles 的 `groups: { "*": { "requireMention": true } }` 看起来像一个不相关的提及设置。它实际上是注册表门控的关键部分。

使用 `groupPolicy: "allowlist"` 后保持群组消息流动的最小配置：

```json5
{
  channels: {
    imessage: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123", "chat_guid:any;-;..."],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
}
```

`"*"` 下的 `requireMention: true` 在没有配置提及模式时无害：运行时设置 `canDetectMention = false` 并在 `inbound-processing.ts:512` 短路提及丢弃。配置了提及模式（`agents.list[].groupChat.mentionPatterns`）时，它按预期工作。

如果 gateway 日志显示 `imessage: dropping group message from chat_id=<id>` 或启动行 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`，则门控 2 正在丢弃消息——添加 `groups` 块。

## 逐步操作

1. 在现有 BlueBubbles 块旁边添加 iMessage 块。在验证新路径之前，仅将旧块作为复制来源保留：

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... 现有配置 ...
       },
       imessage: {
         enabled: false, // 在下面的演练之后启用
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // 从 bluebubbles.allowFrom 复制
         groupPolicy: "allowlist",
         groupAllowFrom: [], // 从 bluebubbles.groupAllowFrom 复制
         groups: { "*": { requireMention: true } }, // 从 bluebubbles.groups 复制——如果缺失，会静默丢弃群组，参见上面的"群组注册表陷阱"
         actions: {
           reactions: true,
           edit: true,
           unsend: true,
           reply: true,
           sendWithEffect: true,
           sendAttachment: true,
         },
       },
     },
   }
   ```

2. **演练探测**——启动 gateway 并确认 iMessage 报告健康：

   ```bash
   openclaw gateway
   openclaw channels status
   openclaw channels status --probe   # 期望 imessage.privateApi.available: true
   ```

   因为 `imessage.enabled` 仍为 `false`，所以还没有入站 iMessage 流量被路由——但 `--probe` 会测试桥接，以便在切换之前发现权限/安装问题。

3. **切换。** 在一次配置编辑中删除 BlueBubbles 配置并启用 iMessage：

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   重启 gateway。入站 iMessage 流量现在通过捆绑的 Plugin 流动。

4. **验证私信。** 向 agent 发送私信；确认回复到达。

5. **单独验证群组。** 私信和群组采用不同的代码路径——私信成功并不能证明群组正在路由。在已配对的群聊中向 agent 发送消息并确认回复到达。如果群组无响应（无 agent 回复，无错误），请检查 gateway 日志中的 `imessage: dropping group message from chat_id=<id>` 或启动行 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`——两者都在默认日志级别触发。如果出现，您的 `groups` 块缺失或为空——请参阅上面的"群组注册表陷阱"。

6. **验证操作接口**——从已配对的私信中，请求 agent 进行反应、编辑、撤回、回复、发送照片，以及（在群组中）重命名群组 / 添加或删除参与者。每个操作都应在 Messages.app 中原生落地。如果任何操作抛出"iMessage `<action>` requires the imsg private API bridge"，请再次运行 `imsg launch` 并刷新 `channels status --probe`。

7. 一旦 iMessage 私信、群组和操作都已验证，**删除 BlueBubbles 服务器和配置**。OpenClaw 不会使用 `channels.bluebubbles`。

## 操作功能对比

| 操作                                                        | 旧版 BlueBubbles                     | 捆绑的 iMessage                                                                                                          |
| ---------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 发送文本 / SMS 回退                                           | ✅                                  | ✅                                                                                                                      |
| 发送媒体（照片、视频、文件、语音）                              | ✅                                  | ✅                                                                                                                      |
| 线程回复（`reply_to_guid`）                                  | ✅                                  | ✅（关闭 [#51892](https://github.com/openclaw/openclaw/issues/51892)）                                                  |
| Tapback（`react`）                                          | ✅                                  | ✅                                                                                                                      |
| 编辑 / 撤回（macOS 13+ 接收方）                               | ✅                                  | ✅                                                                                                                      |
| 带屏幕效果发送                                               | ✅                                  | ✅（部分关闭 [#9394](https://github.com/openclaw/openclaw/issues/9394)）                                                |
| 富文本粗体 / 斜体 / 下划线 / 删除线                            | ✅                                  | ✅（通过 attributedBody 的类型运行格式化）                                                                               |
| 重命名群组 / 设置群组图标                                     | ✅                                  | ✅                                                                                                                      |
| 添加 / 删除参与者，退出群组                                   | ✅                                  | ✅                                                                                                                      |
| 已读回执和正在输入指示器                                      | ✅                                  | ✅（受私有 API 探测限制）                                                                                               |
| 同发送者私信合并                                             | ✅                                  | ✅（仅限私信；通过 `channels.imessage.coalesceSameSenderDms` 选择加入）                                                  |
| 捕获 gateway 停机时收到的入站消息                             | ✅（webhook 重放 + 历史获取）          | ✅（通过 `channels.imessage.catchup.enabled` 选择加入；关闭 [#78649](https://github.com/openclaw/openclaw/issues/78649)）|

iMessage 追赶功能现在作为捆绑 Plugin 的选择加入功能提供。在 gateway 启动时，如果 `channels.imessage.catchup.enabled` 为 `true`，gateway 会对 `imsg watch` 使用的同一 JSON-RPC 客户端运行一次 `chats.list` + 每个聊天的 `messages.history` 遍历，通过实时分发路径（白名单、群组策略、防抖器、回声缓存）重放每个错过的入站行，并持久化每账户游标，以便后续启动从中断处继续。请参阅[在 gateway 停机后追赶](/channels/imessage#catching-up-after-gateway-downtime)了解调优。

## 配对、Session 和 ACP 绑定

- **配对批准**按句柄传递。您无需重新批准已知发送者——`channels.imessage.allowFrom` 识别与 BlueBubbles 使用的相同 `+15555550123` / `user@example.com` 字符串。
- **Session** 保持按 agent + 聊天为范围。私信在默认 `session.dmScope=main` 下折叠到 agent 主 Session；群组 Session 按 `chat_id` 保持隔离。Session 键不同（`agent:<id>:imessage:group:<chat_id>` vs BlueBubbles 等效项）——BlueBubbles Session 键下的旧对话历史不会传入 iMessage Session。
- 引用 `match.channel: "bluebubbles"` 的 **ACP 绑定**需要更新为 `"imessage"`。`match.peer.id` 形状（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸句柄）相同。

## 无回退 channel

没有受支持的 BlueBubbles 运行时可以切换回去。如果 iMessage 验证失败，将 `channels.imessage.enabled: false`，重启 Gateway，修复 `imsg` 阻塞问题，然后重试切换。

回复缓存位于 `~/.openclaw/state/imessage/reply-cache.jsonl`（模式 `0600`，父目录 `0700`）。如果您需要全新开始，可以安全删除它。

## 相关

- [iMessage](/channels/imessage)——完整的 iMessage channel 参考，包括 `imsg launch` 设置和功能检测。
- `/channels/bluebubbles`——重定向到本迁移指南的旧版 URL。
- [Pairing](/channels/pairing)——私信身份验证和配对流程。
- [Channel Routing](/channels/channel-routing)——gateway 如何为出站回复选择 channel。
