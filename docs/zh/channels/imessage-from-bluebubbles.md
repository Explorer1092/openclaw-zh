---
mmh3_hash: "93f6f067e374a4bead930a15d98a74d7"
summary: "将旧版 BlueBubbles 配置迁移到捆绑的 iMessage Plugin，不丢失配对、allowlist 或群组绑定。"
read_when:
  - 计划从 BlueBubbles 迁移到捆绑的 iMessage Plugin
  - 将 BlueBubbles 配置键翻译为 iMessage 等效键
  - 在启用 iMessage Plugin 之前验证 imsg
title: "从 BlueBubbles 迁移"
---

捆绑的 `imessage` Plugin 现在通过 JSON-RPC 驱动 [`steipete/imsg`](https://github.com/steipete/imsg) 来访问与 BlueBubbles 相同的私有 API 接口（`react`、`edit`、`unsend`、`reply`、`sendWithEffect`、群组管理、附件）。如果您已经在 Mac 上安装了 `imsg`，可以去掉 BlueBubbles 服务器，让 Plugin 直接与 Messages.app 通信。

BlueBubbles 支持已被移除。OpenClaw 仅通过 `imsg` 支持 iMessage。本指南用于将旧版 `channels.bluebubbles` 配置迁移到 `channels.imessage`；没有其他受支持的迁移路径。

<Note>
有关简短公告和运维摘要，请参阅 [BlueBubbles 移除和 imsg iMessage 路径](/announcements/bluebubbles-imessage)。
</Note>

## 迁移检查清单

当您已知道旧版 BlueBubbles 配置并想要最短安全路径时，使用此检查清单：

1. 直接在运行 Messages.app 的 Mac 上验证 `imsg`（`imsg chats`、`imsg history`、`imsg send` 和 `imsg rpc --help`）。
2. 将行为键从 `channels.bluebubbles` 复制到 `channels.imessage`：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`includeAttachments`、`attachmentRoots`、`mediaMaxMb`、`textChunkLimit`、`coalesceSameSenderDms` 和 `actions`。
3. 删除不再存在的传输键：`serverUrl`、`password`、webhook URL 和 BlueBubbles 服务器设置。
4. 如果 Gateway 不在 Messages Mac 上运行，将 `channels.imessage.cliPath` 设置为 SSH 包装器，并设置 `remoteHost` 用于远程附件获取。
5. 停止 Gateway 后，启用 `channels.imessage`，然后运行 `openclaw channels status --probe --channel imessage`。
6. 测试一条私信、一个已允许的群组、附件（如果启用）以及您期望 Agent 使用的每个私有 API 操作。
7. 在 iMessage 路径验证后删除 BlueBubbles 服务器和旧版 `channels.bluebubbles` 配置。

## 何时适合进行此迁移

- 您已在 Messages.app 登录的同一台 Mac（或通过 SSH 可访问的 Mac）上运行 `imsg`。
- 您希望减少一个活动部件——不需要单独的 BlueBubbles 服务器、不需要认证的 REST 端点、不需要 webhook 管道。只需单个 CLI 二进制文件，而不是服务器 + 客户端应用 + 辅助程序。
- 您在[支持的 macOS / `imsg` 构建](/channels/imessage#requirements-and-permissions-macos)上，私有 API 探测报告 `available: true`。

## imsg 的作用

`imsg` 是用于 Messages 的本地 macOS CLI。OpenClaw 将 `imsg rpc` 作为子进程启动，并通过 stdin/stdout 进行 JSON-RPC 通信。没有 HTTP 服务器、webhook URL、后台守护进程、launch agent 或需要暴露的端口。

- 读取来自使用只读 SQLite 句柄的 `~/Library/Messages/chat.db`。
- 实时入站消息来自 `imsg watch` / `watch.subscribe`，它通过轮询回退跟随 `chat.db` 文件系统事件。
- 发送使用 Messages.app 自动化进行普通文本和文件发送。
- 高级操作使用 `imsg launch` 将 `imsg` 辅助程序注入 Messages.app。这就是解锁已读回执、打字指示器、富媒体发送、编辑、撤回、线程回复、tapback 和群组管理的方式。
- Linux 构建可以检查已复制的 `chat.db`，但无法发送、监视实时 Mac 数据库或驱动 Messages.app。对于 OpenClaw iMessage，在已登录的 Mac 上运行 `imsg`，或通过 SSH 包装器访问该 Mac。

## 开始前

1. 在运行 Messages.app 的 Mac 上安装 `imsg`：

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   ```

   如果 `imsg chats` 以 `unable to open database file`、空输出或 `authorization denied` 失败，请向终端、编辑器、Node 进程、Gateway 服务或启动 `imsg` 的 SSH 父进程授予完全磁盘访问权限，然后重新打开该父进程。

2. 在更改 OpenClaw 配置之前验证读取、监视、发送和 RPC 接口：

   ```bash
   imsg chats --limit 10 --json | jq -s
   imsg history --chat-id 42 --limit 10 --attachments --json | jq -s
   imsg watch --chat-id 42 --reactions --json
   imsg send --chat-id 42 --text "OpenClaw imsg test"
   imsg rpc --help
   ```

   将 `42` 替换为来自 `imsg chats` 的真实聊天 ID。发送需要 Messages.app 的自动化权限。如果 OpenClaw 将通过 SSH 运行，通过 OpenClaw 将使用的相同 SSH 包装器或用户上下文运行这些命令。

3. 在需要高级操作时启用私有 API 桥接：

   ```bash
   imsg launch
   imsg status --json
   ```

   `imsg launch` 需要禁用 SIP。基本发送、历史和监视无需 `imsg launch`；高级操作则需要。

4. 添加已启用的 `channels.imessage` 配置后，通过 OpenClaw 验证桥接：

   ```bash
   openclaw channels status --probe
   ```

   您需要 `imessage.privateApi.available: true`。如果报告 `false`，请先修复——参见[能力检测](/channels/imessage#private-api-actions)。`channels status --probe` 仅探测已配置的已启用账户。

5. 快照您的配置：

   ```bash
   cp ~/.openclaw/openclaw.json5 ~/.openclaw/openclaw.json5.bak
   ```

## 配置对照

iMessage 和 BlueBubbles 共享许多 Channel 级别的配置。更改的键主要是传输相关的（REST 服务器与本地 CLI）。行为键（`dmPolicy`、`groupPolicy`、`allowFrom` 等）保持相同含义。

| BlueBubbles                                                | 捆绑的 iMessage                           | 注意                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.bluebubbles.enabled`                             | `channels.imessage.enabled`               | 相同语义。                                                                                                                                                                                                                                                                                                                                        |
| `channels.bluebubbles.serverUrl`                           | _（已移除）_                              | 没有 REST 服务器——Plugin 通过 stdio 生成 `imsg rpc`。                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.password`                            | _（已移除）_                              | 不需要 webhook 认证。                                                                                                                                                                                                                                                                                                                             |
| _（隐式）_                                                 | `channels.imessage.cliPath`               | `imsg` 的路径（默认 `imsg`）；使用 SSH 的包装器脚本。                                                                                                                                                                                                                                                                                            |
| _（隐式）_                                                 | `channels.imessage.dbPath`                | 可选的 Messages.app `chat.db` 覆盖；省略时自动检测。                                                                                                                                                                                                                                                                                             |
| _（隐式）_                                                 | `channels.imessage.remoteHost`            | `host` 或 `user@host`——仅在 `cliPath` 是 SSH 包装器且您需要 SCP 附件获取时才需要。                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.dmPolicy`                            | `channels.imessage.dmPolicy`              | 相同的值（`pairing` / `allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.allowFrom`                           | `channels.imessage.allowFrom`             | 配对批准按句柄而非 Token 转移。                                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groupPolicy`                         | `channels.imessage.groupPolicy`           | 相同的值（`allowlist` / `open` / `disabled`）。                                                                                                                                                                                                                                                                                                   |
| `channels.bluebubbles.groupAllowFrom`                      | `channels.imessage.groupAllowFrom`        | 相同。                                                                                                                                                                                                                                                                                                                                            |
| `channels.bluebubbles.groups`                              | `channels.imessage.groups`                | **逐字复制，包括任何 `groups: { "*": { ... } }` 通配符条目。** 每群组的 `requireMention`、`tools`、`toolsBySender` 会转移。使用 `groupPolicy: "allowlist"` 时，空的或缺失的 `groups` 块会静默丢弃每条群组消息——参见下面的"群组注册表陷阱"。                                                                                                     |
| `channels.bluebubbles.sendReadReceipts`                    | `channels.imessage.sendReadReceipts`      | 默认 `true`。使用捆绑 Plugin 时，这仅在私有 API 探测可用时触发。                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.includeAttachments`                  | `channels.imessage.includeAttachments`    | 相同格式，**同样默认关闭**。如果您在 BlueBubbles 上启用了附件流，必须在 iMessage 块上显式重新设置——它不会隐式转移，在您设置之前，入站照片/媒体将被静默丢弃，并且不会有 `Inbound message` 日志行。                                                                                                                                                  |
| `channels.bluebubbles.attachmentRoots`                     | `channels.imessage.attachmentRoots`       | 本地根目录；相同的通配符规则。                                                                                                                                                                                                                                                                                                                    |
| _（不适用）_                                               | `channels.imessage.remoteAttachmentRoots` | 仅在设置 `remoteHost` 进行 SCP 获取时使用。                                                                                                                                                                                                                                                                                                       |
| `channels.bluebubbles.mediaMaxMb`                          | `channels.imessage.mediaMaxMb`            | iMessage 上默认 16 MB（BlueBubbles 默认为 8 MB）。如果要保持较低上限，请明确设置。                                                                                                                                                                                                                                                               |
| `channels.bluebubbles.textChunkLimit`                      | `channels.imessage.textChunkLimit`        | 两者均默认 4000。                                                                                                                                                                                                                                                                                                                                 |
| `channels.bluebubbles.coalesceSameSenderDms`               | `channels.imessage.coalesceSameSenderDms` | 相同的选择加入。仅私信——两个 Channel 上的群聊都保持即时的每消息分发。在没有明确 `messages.inbound.byChannel.imessage` 的情况下启用时，将默认入站防抖扩展到 2500 ms。参见 [iMessage 文档 § 合并拆分发送私信](/channels/imessage#coalescing-split-send-dms-command--url-in-one-composition)。                                                      |
| `channels.bluebubbles.enrichGroupParticipantsFromContacts` | _（不适用）_                              | iMessage 已从 `chat.db` 读取发送者显示名称。                                                                                                                                                                                                                                                                                                      |
| `channels.bluebubbles.actions.*`                           | `channels.imessage.actions.*`             | 每操作开关：`reactions`、`edit`、`unsend`、`reply`、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`、`sendAttachment`。                                                                                                                                                                       |

多账户配置（`channels.bluebubbles.accounts.*`）一对一转换为 `channels.imessage.accounts.*`。

## 群组注册表陷阱

捆绑的 iMessage Plugin 依次运行**两个**独立的群组 allowlist 门控。两个都必须通过才能让群组消息到达 Agent：

1. **发送者/聊天目标 allowlist**（`channels.imessage.groupAllowFrom`）——由 `isAllowedIMessageSender` 检查。按发送者句柄、`chat_guid`、`chat_identifier` 或 `chat_id` 匹配入站消息。与 BlueBubbles 格式相同。
2. **群组注册表**（`channels.imessage.groups`）——由 `inbound-processing.ts:199` 的 `resolveChannelGroupPolicy` 检查。使用 `groupPolicy: "allowlist"` 时，此门控需要以下之一：
   - 一个 `groups: { "*": { ... } }` 通配符条目（设置 `allowAll = true`），或
   - `groups` 下的显式每 `chat_id` 条目。

如果门控 1 通过但门控 2 失败，消息将被丢弃。Plugin 发出两个 `warn` 级别的信号，因此在默认日志级别下不再是静默的：

- 当设置了 `groupPolicy: "allowlist"` 但 `channels.imessage.groups` 为空（没有 `"*"` 通配符，没有每 `chat_id` 条目）时，每个账户在启动时发出一次 `warn`——在任何消息到达之前触发。
- 当特定群组在运行时首次被丢弃时，每个 `chat_id` 发出一次 `warn`，命名 chat_id 和要添加到 `groups` 以允许它的确切键。

私信继续工作，因为它们采用不同的代码路径。

这是最常见的 BlueBubbles → 捆绑 iMessage 迁移失败模式：运维人员复制了 `groupAllowFrom` 和 `groupPolicy` 但跳过了 `groups` 块，因为 BlueBubbles 的 `groups: { "*": { "requireMention": true } }` 看起来像一个不相关的提及设置。实际上它对注册表门控起关键作用。

`groupPolicy: "allowlist"` 后保持群组消息流动的最小配置：

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

当没有配置提及模式时，`*` 下的 `requireMention: true` 是无害的：运行时设置 `canDetectMention = false` 并在 `inbound-processing.ts:512` 短路提及丢弃。配置了提及模式（`agents.list[].groupChat.mentionPatterns`）时，它按预期工作。

如果 Gateway 日志显示 `imessage: dropping group message from chat_id=<id>` 或启动行 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty`，则门控 2 正在丢弃消息——添加 `groups` 块。

## 分步骤操作

1. 在现有 BlueBubbles 块旁边添加 iMessage 块。在 Gateway 仍路由 BlueBubbles 流量时保持禁用：

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         // ... 现有配置 ...
       },
       imessage: {
         enabled: false,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"], // 从 bluebubbles.allowFrom 复制
         groupPolicy: "allowlist",
         groupAllowFrom: [], // 从 bluebubbles.groupAllowFrom 复制
         groups: { "*": { requireMention: true } }, // 从 bluebubbles.groups 复制——缺失时静默丢弃群组，参见上面的"群组注册表陷阱"
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

2. **在流量影响之前探测**——停止 Gateway，临时启用 iMessage 块，并从 CLI 确认 iMessage 报告健康：

   ```bash
   openclaw gateway stop
   # 编辑配置：channels.imessage.enabled = true
   openclaw channels status --probe --channel imessage   # 期望 imessage.privateApi.available: true
   ```

   `channels status --probe` 仅探测已配置的已启用账户。除非您有意想要两个 Channel 监视器同时运行，否则不要在同时启用 BlueBubbles 和 iMessage 的情况下重启 Gateway。如果您不打算立即切换，在重启 Gateway 之前将 `channels.imessage.enabled` 设回 `false`。在启用 OpenClaw 流量之前，使用[开始前](#before-you-start)中的直接 `imsg` 命令验证 Mac。

3. **切换。** 一旦已启用的 iMessage 账户报告健康，删除 BlueBubbles 配置并保持 iMessage 启用：

   ```json5
   {
     channels: {
       imessage: { enabled: true /* ... */ },
     },
   }
   ```

   重启 Gateway。入站 iMessage 流量现在通过捆绑 Plugin 流动。

4. **验证私信。** 向 Agent 发送一条私信；确认回复到达。

5. **单独验证群组。** 私信和群组采用不同的代码路径——私信成功不能证明群组正在路由。在已配对的群聊中向 Agent 发送消息，确认回复到达。如果群组沉默（没有 Agent 回复，没有错误），检查 Gateway 日志中的 `imessage: dropping group message from chat_id=<id>` 或启动时的 `imessage: groupPolicy="allowlist" but channels.imessage.groups is empty` 行——两者都在默认日志级别触发。如果出现任何一个，您的 `groups` 块缺失或为空——参见上面的"群组注册表陷阱"。

6. **验证操作接口**——从已配对的私信中，让 Agent 进行 react、edit、unsend、reply、发送照片，以及（在群组中）重命名群组 / 添加或删除参与者。每个操作都应该在 Messages.app 中以原生方式生效。如果任何操作抛出"iMessage `<action>` requires the imsg private API bridge"，再次运行 `imsg launch` 并刷新 `channels status --probe`。

7. **在验证 iMessage 私信、群组和操作后，删除 BlueBubbles 服务器和配置。** OpenClaw 将不会使用 `channels.bluebubbles`。

## 操作对等一览

| 操作                                       | 旧版 BlueBubbles                  | 捆绑的 iMessage                                                                                                         |
| ------------------------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 发送文本 / SMS 回退                        | ✅                                | ✅                                                                                                                      |
| 发送媒体（照片、视频、文件、语音）         | ✅                                | ✅                                                                                                                      |
| 线程回复（`reply_to_guid`）                | ✅                                | ✅（关闭 [#51892](https://github.com/openclaw/openclaw/issues/51892)）                                                  |
| Tapback（`react`）                         | ✅                                | ✅                                                                                                                      |
| 编辑 / 撤回（macOS 13+ 接收方）            | ✅                                | ✅                                                                                                                      |
| 带屏幕特效发送                             | ✅                                | ✅（部分关闭 [#9394](https://github.com/openclaw/openclaw/issues/9394)）                                                |
| 富文本粗体/斜体/下划线/删除线              | ✅                                | ✅（通过 attributedBody 的类型化运行格式）                                                                              |
| 重命名群组 / 设置群组图标                  | ✅                                | ✅                                                                                                                      |
| 添加/删除参与者、离开群组                  | ✅                                | ✅                                                                                                                      |
| 已读回执和打字指示器                       | ✅                                | ✅（依赖私有 API 探测）                                                                                                  |
| 同一发送者私信合并                         | ✅                                | ✅（仅私信；通过 `channels.imessage.coalesceSameSenderDms` 选择加入）                                                   |
| 追赶 Gateway 停机时收到的入站消息          | ✅（webhook 重放 + 历史获取）     | ✅（通过 `channels.imessage.catchup.enabled` 选择加入；关闭 [#78649](https://github.com/openclaw/openclaw/issues/78649)）|

iMessage catchup 现在可作为捆绑 Plugin 上的选择加入功能使用。Gateway 启动时，如果 `channels.imessage.catchup.enabled` 为 `true`，Gateway 会针对 `imsg watch` 使用的同一 JSON-RPC 客户端运行一次 `chats.list` + 每聊天 `messages.history` 操作，通过实时分发路径（allowlist、群组策略、防抖、回声缓存）重放每条错过的入站行，并持久化每账户游标，以便后续启动从上次停止的地方继续。有关调优，请参阅 [Gateway 停机后追赶](/channels/imessage#catching-up-after-gateway-downtime)。

## 配对、会话和 ACP 绑定

- **配对批准**按句柄转移。您不需要重新批准已知发送者——`channels.imessage.allowFrom` 识别 BlueBubbles 使用的相同 `+15555550123` / `user@example.com` 字符串。
- **会话**按 Agent + 聊天范围保持。私信在默认 `session.dmScope=main` 下折叠到 Agent 主会话；群组会话按 `chat_id` 保持隔离。会话键不同（`agent:<id>:imessage:group:<chat_id>` 与 BlueBubbles 等效键）——BlueBubbles 会话键下的旧会话历史不会转入 iMessage 会话。
- 引用 `match.channel: "bluebubbles"` 的 **ACP 绑定**需要更新为 `"imessage"`。`match.peer.id` 形状（`chat_id:`、`chat_guid:`、`chat_identifier:`、裸句柄）是相同的。

## 无回滚 Channel

没有受支持的 BlueBubbles 运行时可以切换回去。如果 iMessage 验证失败，设置 `channels.imessage.enabled: false`，重启 Gateway，修复 `imsg` 阻碍，然后重试切换。

回复缓存位于 `~/.openclaw/state/imessage/reply-cache.jsonl`（模式 `0600`，父目录 `0700`）。如果您想要干净的状态，删除它是安全的。

## 相关

- [BlueBubbles 移除和 imsg iMessage 路径](/announcements/bluebubbles-imessage) — 简短公告和运维摘要。
- [iMessage](/channels/imessage) — 完整的 iMessage Channel 参考，包括 `imsg launch` 设置和能力检测。
- `/channels/bluebubbles` — 重定向到此迁移指南的旧版 URL。
- [Pairing](/channels/pairing) — 私信认证和配对流程。
- [Channel Routing](/channels/channel-routing) — Gateway 如何为出站回复选择 Channel。
