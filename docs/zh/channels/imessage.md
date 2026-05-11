---
mmh3_hash: "7f6e66571a174aeb1aae453970c85c78"
summary: "通过 imsg 实现原生 iMessage 支持（基于 stdio 的 JSON-RPC），支持私有 API 动作：回复、tapback、效果、附件和群组管理。适合满足主机要求的新 OpenClaw iMessage 设置。"
read_when:
  - 设置 iMessage 支持
  - 调试 iMessage 发送/接收
title: "iMessage"
---

<Note>
对于 OpenClaw iMessage 部署，请在已登录的 macOS Messages 主机上使用 `imsg`。如果你的 Gateway 运行在 Linux 或 Windows 上，请将 `channels.imessage.cliPath` 指向一个在 Mac 上运行 `imsg` 的 SSH 包装脚本。

**Gateway 宕机后的追赶功能需要手动启用。** 启用后（`channels.imessage.catchup.enabled: true`），Gateway 在下次启动时会重放 Gateway 离线期间（崩溃、重启、Mac 休眠）已写入 `chat.db` 的入站消息。默认禁用——参见[Gateway 宕机后追赶](#catching-up-after-gateway-downtime)。
</Note>

<Warning>
BlueBubbles 支持已移除。请将 `channels.bluebubbles` 配置迁移到 `channels.imessage`；OpenClaw 仅通过 `imsg` 支持 iMessage。
</Warning>

状态：原生外部 CLI 集成。Gateway 生成 `imsg rpc` 并通过 stdio 上的 JSON-RPC 通信（无单独守护进程/端口）。高级动作需要 `imsg launch` 以及成功的私有 API 探测。

<CardGroup cols={3}>
  <Card title="私有 API 动作" icon="wand-sparkles" href="#private-api-actions">
    回复、tapback、效果、附件和群组管理。
  </Card>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    iMessage DM 默认为 pairing 模式。
  </Card>
  <Card title="远程 Mac" icon="terminal" href="#remote-mac-over-ssh">
    当 Gateway 不在 Messages Mac 上运行时使用 SSH 包装器。
  </Card>
  <Card title="配置参考" icon="settings" href="/gateway/config-channels#imessage">
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
imsg launch
openclaw channels status --probe
```

      </Step>

      <Step title="配置 OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="启动 Gateway">

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
    OpenClaw 只需要与 stdio 兼容的 `cliPath`，因此你可以将 `cliPath` 指向一个通过 SSH 连接到远程 Mac 并运行 `imsg` 的包装脚本。

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
- 对于高级动作（react / edit / unsend / 线程回复 / 效果 / 群组操作），必须禁用系统完整性保护——参见下方[启用 imsg 私有 API](#enabling-the-imsg-private-api)。基本文本和媒体发送/接收无需此操作。

<Tip>
权限按进程上下文授予。如果 Gateway 无头运行（LaunchAgent/SSH），在同一上下文中运行一次性交互式命令以触发提示：

```bash
imsg chats --limit 1
# 或
imsg send <handle> "test"
```

</Tip>

## 启用 imsg 私有 API

`imsg` 有两种运行模式：

- **基本模式**（默认，无需更改 SIP）：通过 `send` 进行出站文本和媒体传输、入站监听/历史记录、聊天列表。这是从全新 `brew install steipete/tap/imsg` 加上上述标准 macOS 权限开箱即得的功能。
- **私有 API 模式**：`imsg` 向 `Messages.app` 注入辅助 dylib，以调用内部 `IMCore` 函数。这可以解锁 `react`、`edit`、`unsend`、`reply`（线程）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及输入指示器和已读回执。

要使用本 Channel 页面记录的高级动作界面，需要私有 API 模式。`imsg` README 明确说明了这一要求：

> 高级功能，如 `read`、`typing`、`launch`、bridge 支持的富发送、消息变更和聊天管理，需要手动启用。它们需要禁用 SIP 并将辅助 dylib 注入 `Messages.app`。SIP 启用时 `imsg launch` 会拒绝注入。

辅助注入技术使用 `imsg` 自己的 dylib 来访问 Messages 私有 API。在 OpenClaw iMessage 路径中没有第三方服务器或 BlueBubbles 运行时。

<Warning>
**禁用 SIP 是一个真实的安全权衡。** SIP 是 macOS 防止运行修改后系统代码的核心保护之一；全系统关闭它会带来额外的攻击面和副作用。值得注意的是，**在 Apple Silicon Mac 上禁用 SIP 同时也会禁止在 Mac 上安装和运行 iOS 应用**。

请将此视为经过深思熟虑的运营选择，而非默认设置。如果你的威胁模型无法接受 SIP 关闭，捆绑的 iMessage 将限于基本模式——仅支持文本和媒体发送/接收，不支持 reactions / edit / unsend / effects / 群组操作。
</Warning>

### 设置

1. **在运行 Messages.app 的 Mac 上安装（或升级）`imsg`：**

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 的输出会报告 `bridge_version`、`rpc_methods` 和每个方法的 `selectors`，以便你在开始之前了解当前构建支持的内容。

2. **禁用系统完整性保护。** 这与 macOS 版本相关，因为底层的 Apple 要求取决于操作系统和硬件：
   - **macOS 10.13–10.15（Sierra–Catalina）：** 通过终端禁用库验证，重启进入恢复模式，运行 `csrutil disable`，重启。
   - **macOS 11+（Big Sur 及更高版本），Intel：** 恢复模式（或互联网恢复），`csrutil disable`，重启。
   - **macOS 11+，Apple Silicon：** 通过电源按钮启动进入恢复模式；在最近的 macOS 版本中，点击继续时按住**左 Shift** 键，然后 `csrutil disable`。虚拟机设置有单独的流程——请先创建虚拟机快照。
   - **macOS 26 / Tahoe：** 库验证策略和 `imagent` 私有权限检查进一步收紧；`imsg` 可能需要更新版本才能跟上。如果 macOS 主要版本升级后 `imsg launch` 注入或特定 `selectors` 开始返回 false，在假设 SIP 步骤成功之前先检查 `imsg` 的发布说明。

   按照你的 Mac 的 Apple 恢复模式流程在运行 `imsg launch` 之前禁用 SIP。

3. **注入辅助程序。** 禁用 SIP 且 Messages.app 已登录后：

   ```bash
   imsg launch
   ```

   SIP 仍然启用时 `imsg launch` 会拒绝注入，因此这也可以确认步骤 2 是否成功。

4. **从 OpenClaw 验证 bridge：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 条目应报告 `works`，而 `imsg status --json | jq '.selectors'` 应显示 `retractMessagePart: true` 以及你的 macOS 构建所暴露的 edit / typing / read selectors。OpenClaw Plugin 中 `actions.ts` 的每方法门控仅会发布底层 selector 为 `true` 的动作，因此你在 agent 工具列表中看到的动作界面反映了 bridge 在此主机上实际能做的事情。

如果 `openclaw channels status --probe` 报告 Channel 为 `works` 但特定动作在调度时抛出"iMessage `<action>` requires the imsg private API bridge"，请再次运行 `imsg launch`——辅助程序可能已失效（Messages.app 重启、系统更新等），缓存的 `available: true` 状态将持续发布动作，直到下次探测刷新为止。

### 无法禁用 SIP 时

如果你的威胁模型不允许关闭 SIP：

- `imsg` 回退到基本模式——仅支持文本 + 媒体 + 接收。
- OpenClaw Plugin 仍然发布文本/媒体发送和入站监听；它只是从动作界面隐藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 和群组操作（根据每方法能力门控）。
- 你可以运行一台单独的非 Apple Silicon Mac（或专用 bot Mac），在 SIP 关闭的情况下处理 iMessage 工作负载，同时在主要设备上保持 SIP 启用。参见下方[专用 bot macOS 用户（独立 iMessage 身份）](#deployment-patterns)。

## 访问控制和路由

<Tabs>
  <Tab title="DM policy">
    `channels.imessage.dmPolicy` 控制私聊：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    Allowlist 字段：`channels.imessage.allowFrom`。

    Allowlist 条目可以是 handle、静态发送者访问组（`accessGroup:<name>`），或聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。

  </Tab>

  <Tab title="Group policy + mentions">
    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（配置时默认）
    - `open`
    - `disabled`

    群组发送者 allowlist：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 条目也可以引用静态发送者访问组（`accessGroup:<name>`）。

    运行时回退：如果未设置 `groupAllowFrom`，iMessage 群组发送者检查在可用时回退到 `allowFrom`。
    运行时注意：如果 `channels.imessage` 完全缺失，运行时会回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    <Warning>
    群组路由有**两个** allowlist 门控依次运行，两者都必须通过：

    1. **发送者/聊天目标 allowlist**（`channels.imessage.groupAllowFrom`）——handle、`chat_guid`、`chat_identifier` 或 `chat_id`。
    2. **群组注册表**（`channels.imessage.groups`）——在 `groupPolicy: "allowlist"` 下，此门控需要 `groups: { "*": { ... } }` 通配符条目（设置 `allowAll = true`），或 `groups` 下显式的每 `chat_id` 条目。

    如果门控 2 中没有任何内容，则每条群组消息都会被丢弃。Plugin 在默认日志级别下会发出两个 `warn` 级别信号：

    - 启动时每账户一次：`imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 运行时每个 `chat_id` 一次：`imessage: dropping group message from chat_id=<id> ...`

    DM 继续工作，因为它们走不同的代码路径。

    在 `groupPolicy: "allowlist"` 下保持群组消息流通的最小配置：

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: { "*": { "requireMention": true } },
        },
      },
    }
    ```

    如果这些 `warn` 行出现在 Gateway 日志中，门控 2 正在丢弃——请添加 `groups` 块。
    </Warning>

    群组的提及门控：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则表达式模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
    - 如果没有配置模式，无法强制执行提及门控

    来自授权发送者的控制命令可以绕过群组中的提及门控。

    每群组 `systemPrompt`：

    `channels.imessage.groups.*` 下的每个条目接受一个可选的 `systemPrompt` 字符串。该值会在处理该群组消息的每个轮次中注入到 agent 的系统提示中。解析方式与 `channels.whatsapp.groups` 使用的每群组提示解析相同：

    1. **群组专用系统提示**（`groups["<chat_id>"].systemPrompt`）：当特定群组条目存在于映射中**且**定义了 `systemPrompt` 键时使用。如果 `systemPrompt` 为空字符串（`""`），则抑制通配符，不对该群组应用系统提示。
    2. **群组通配符系统提示**（`groups["*"].systemPrompt`）：当特定群组条目完全不在映射中时使用，或当它存在但未定义 `systemPrompt` 键时使用。

    ```json5
    {
      channels: {
        imessage: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15555550123"],
          groups: {
            "*": { systemPrompt: "Use British spelling." },
            "8421": {
              requireMention: true,
              systemPrompt: "This is the on-call rotation chat. Keep replies under 3 sentences.",
            },
            "9907": {
              // 显式抑制：通配符 "Use British spelling." 在此处不适用
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    每群组提示仅适用于群组消息——此 Channel 中的私聊不受影响。

  </Tab>

  <Tab title="会话和确定性回复">
    - DM 使用直接路由；群组使用群组路由。
    - 使用默认 `session.dmScope=main`，iMessage DM 折叠到 agent 主会话。
    - 群组会话是隔离的（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复使用原始 Channel/target 元数据路由回 iMessage。

    类群组线程行为：

    某些多参与者 iMessage 线程可能以 `is_group=false` 到达。
    如果该 `chat_id` 在 `channels.imessage.groups` 下显式配置，OpenClaw 将其视为群组流量（群组门控 + 群组会话隔离）。

  </Tab>
</Tabs>

## ACP 对话绑定

传统 iMessage 聊天也可以绑定到 ACP 会话。

快速操作流程：

- 在 DM 或允许的群聊中运行 `/acp spawn codex --bind here`。
- 该 iMessage 对话中的后续消息将路由到已生成的 ACP 会话。
- `/new` 和 `/reset` 会就地重置同一绑定的 ACP 会话。
- `/acp close` 关闭 ACP 会话并删除绑定。

支持通过顶级 `bindings[]` 条目（使用 `type: "acp"` 和 `match.channel: "imessage"`）配置持久绑定。

`match.peer.id` 可以使用：

- 规范化的 DM handle，例如 `+15555550123` 或 `user@example.com`
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

参见 [ACP Agents](/tools/acp-agents) 了解共享 ACP 绑定行为。

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

    - Gateway 在 Linux/VM 上运行
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
    - 入站附件摄取**默认关闭**——设置 `channels.imessage.includeAttachments: true` 可将照片、语音备忘录、视频和其他附件转发给 agent。禁用时，仅含附件的 iMessage 在到达 agent 之前就会被丢弃，可能完全不产生 `Inbound message` 日志行。
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

## 私有 API 动作

当 `imsg launch` 运行且 `openclaw channels status --probe` 报告 `privateApi.available: true` 时，消息工具除了普通文本发送外，还可以使用 iMessage 原生动作。

```json5
{
  channels: {
    imessage: {
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
        renameGroup: true,
        setGroupIcon: true,
        addParticipant: true,
        removeParticipant: true,
        leaveGroup: true,
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="可用动作">
    - **react**：添加/移除 iMessage tapback（`messageId`、`emoji`、`remove`）。支持的 tapback 映射到爱心、赞、踩、哈哈、感叹和问号。
    - **reply**：向现有消息发送线程回复（`messageId`、`text` 或 `message`，加上 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。
    - **sendWithEffect**：发送带有 iMessage 效果的文本（`text` 或 `message`、`effect` 或 `effectId`）。
    - **edit**：在支持的 macOS/私有 API 版本上编辑已发送的消息（`messageId`、`text` 或 `newText`）。
    - **unsend**：在支持的 macOS/私有 API 版本上撤回已发送的消息（`messageId`）。
    - **upload-file**：发送媒体/文件（`buffer` 为 base64 或已水化的 `media`/`path`/`filePath`、`filename`、可选 `asVoice`）。旧版别名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：当当前目标是群组对话时管理群聊。

  </Accordion>

  <Accordion title="消息 ID">
    入站 iMessage 上下文在可用时包含短 `MessageSid` 值和完整的消息 GUID。短 ID 的作用域限于最近的内存中回复缓存，在使用前会针对当前聊天进行检查。如果短 ID 已过期或属于另一个聊天，请用完整的 `MessageSidFull` 重试。

  </Accordion>

  <Accordion title="能力检测">
    仅当缓存的探测状态显示 bridge 不可用时，OpenClaw 才会隐藏私有 API 动作。如果状态未知，动作保持可见并延迟探测，以便在不需要单独手动刷新状态的情况下，`imsg launch` 后第一个动作就能成功。

  </Accordion>

  <Accordion title="已读回执和输入指示器">
    当私有 API bridge 运行时，已接受的入站聊天在调度前会被标记为已读，并在 agent 生成回复时向发送者显示输入气泡。使用以下配置禁用已读标记：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    早于每方法能力列表的旧版 `imsg` 构建会静默关闭输入/已读功能；OpenClaw 在每次重启时记录一次性警告，以便缺失的回执可追溯。

  </Accordion>
</AccordionGroup>

## 配置写入

iMessage 默认允许 Channel 发起的配置写入（用于 `/config set|unset`，当 `commands.config: true` 时）。

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

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合并分段发送的 DM（命令 + URL 在同一消息中）

当用户同时输入命令和 URL 时——例如 `Dump https://example.com/article`——Apple 的 Messages 应用会将发送拆分为**两条独立的 `chat.db` 行**：

1. 一条文本消息（`"Dump"`）。
2. 一条带有 OG 预览图片附件的 URL 预览气泡（`"https://..."`）。

这两行在大多数设置中相隔约 0.8-2.0 秒到达 OpenClaw。没有合并功能时，agent 在第 1 轮单独收到命令，回复（通常是"请发给我 URL"），然后才在第 2 轮看到 URL——此时命令上下文已经丢失。这是 Apple 的发送管道机制，不是 OpenClaw 或 `imsg` 引入的。

`channels.imessage.coalesceSameSenderDms` 可以将 DM 中来自同一发送者的连续行合并为单个 agent 轮次。群聊消息继续按每条消息调度，以保持多用户轮次结构。

<Tabs>
  <Tab title="何时启用">
    以下情况启用：

    - 你提供的 Skill 期望在同一消息中接收 `命令 + 载荷`（dump、paste、save、queue 等）。
    - 你的用户会在命令旁边粘贴 URL、图片或长内容。
    - 你可以接受增加的 DM 轮次延迟（见下文）。

    以下情况保持禁用：

    - 你需要单字 DM 触发的最低命令延迟。
    - 所有流程都是无载荷跟进的一次性命令。

  </Tab>
  <Tab title="启用方式">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // 启用（默认：false）
        },
      },
    }
    ```

    启用该标志且没有显式的 `messages.inbound.byChannel.imessage` 时，防抖窗口扩大到 **2500 毫秒**（旧版默认为 0 毫秒——无防抖）。需要更宽的窗口，因为 Apple 0.8-2.0 秒的分段发送节奏不适合更小的默认值。

    手动调整窗口：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 毫秒适用于大多数设置；如果 Mac 速度慢或内存压力大，
            // 可提高到 4000 毫秒（观察到的间隔有时会超过 2 秒）。
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="权衡">
    - **增加 DM 消息延迟。** 启用该标志后，每条 DM（包括独立控制命令和单条文本跟进）在调度前最多等待防抖窗口时间，以防后续载荷行到来。群聊消息保持即时调度。
    - **合并输出有上限。** 合并文本上限为 4000 个字符，附带明确的 `…[截断]` 标记；附件上限为 20 个；来源条目上限为 10 个（超出后保留第一条和最新条）。每个来源 GUID 都在 `coalescedMessageGuids` 中被追踪，供下游遥测使用。
    - **仅限 DM。** 群聊使用按消息调度，以便当多人在输入时 bot 保持响应。
    - **按 Channel 可选。** 其他 Channel（Telegram、WhatsApp、Slack 等）不受影响。设置了 `channels.bluebubbles.coalesceSameSenderDms` 的旧版 BlueBubbles 配置应将该值迁移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 场景及 agent 所见内容

| 用户操作 | `chat.db` 产生 | 标志关闭（默认） | 标志开启 + 2500 毫秒窗口 |
| --- | --- | --- | --- |
| `Dump https://example.com`（一次发送） | 2 行间隔约 1 秒 | 两个 agent 轮次："Dump"单独一条，然后是 URL | 一个轮次：合并文本 `Dump https://example.com` |
| `Save this 📎image.jpg caption`（附件 + 文本） | 2 行 | 两个轮次（附件在合并时丢弃） | 一个轮次：文本 + 图片均保留 |
| `/status`（独立命令） | 1 行 | 即时调度 | **等待最长窗口时间，然后调度** |
| 单独粘贴 URL | 1 行 | 即时调度 | 即时调度（桶中只有一条记录） |
| 文本 + URL 作为两条有意的独立消息发送，相隔数分钟 | 2 行，超出窗口 | 两个轮次 | 两个轮次（窗口在两者之间过期） |
| 快速大量发送（窗口内超过 10 条小 DM） | N 行 | N 个轮次 | 一个轮次，输出有上限（保留第一条 + 最新条，应用文本/附件上限） |
| 两人在群聊中输入 | 来自 M 个发送者的 N 行 | M+ 个轮次（每个发送者桶一个） | M+ 个轮次——群聊不合并 |

## Gateway 宕机后追赶

当 Gateway 离线时（崩溃、重启、Mac 休眠、关机），`imsg watch` 在 Gateway 重新上线后会从当前 `chat.db` 状态恢复——在此期间到达的任何内容默认情况下都不会被处理。追赶功能会在下次启动时重放这些消息，以确保 agent 不会静默地错过入站流量。

追赶**默认禁用**。按 Channel 启用：

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // 主开关（默认：false）
      maxAgeMinutes: 120,        // 跳过早于 now - 2h 的行（默认：120，范围 1..720）
      perRunLimit: 50,           // 每次启动最多重放的行数（默认：50，范围 1..500）
      firstRunLookbackMinutes: 30, // 无游标的首次运行：回溯 30 分钟（默认：30）
      maxFailureRetries: 10,     // 对卡住的 guid 在 10 次调度失败后放弃（默认：10）
    },
  },
}
```

### 运行方式

每次 `monitorIMessageProvider` 启动时运行一次，顺序为：`imsg launch` 就绪 → `watch.subscribe` → `performIMessageCatchup` → 实时调度循环。追赶本身使用 `chats.list` + 每聊天 `messages.history`，针对 `imsg watch` 使用的同一 JSON-RPC 客户端。追赶过程中到达的任何内容均正常通过实时调度流转；现有的入站去重缓存会吸收重放行与实时消息的任何重叠。

每条重放行都通过实时调度路径（`evaluateIMessageInbound` + `dispatchInboundMessage`）处理，因此 allowlist、群组策略、防抖器、回声缓存和已读回执在重放消息和实时消息上的行为完全相同。

### 游标和重试语义

追赶在 `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` 处维护每账户游标（OpenClaw 状态目录默认为 `~/.openclaw`，可通过 `OPENCLAW_STATE_DIR` 覆盖）：

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- 游标在每次成功调度后推进，当某行的调度抛出异常时保持不动——下次启动会从保持的游标重试同一行。
- 对同一 `guid` 连续抛出 `maxFailureRetries` 次后，追赶记录 `warn` 并强制将游标推进到卡住消息之后，以便后续启动可以继续处理。
- 已放弃的 guid 在后续运行中会被直接跳过（不尝试调度），并在运行摘要的 `skippedGivenUp` 中计数。

### 运营可见信号

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

`WARN ... capped to perRunLimit` 行表示单次启动未能清空全部积压。如果你的间隔通常超过默认的 50 行，请提高 `perRunLimit`（最大 500）。

### 何时保持关闭

- Gateway 持续运行，带有看门狗自动重启，间隔始终在几秒内——默认关闭即可。
- DM 量低，错过的消息不会改变 agent 行为——首次启用时 `firstRunLookbackMinutes` 初始窗口可能会调度出意外的旧上下文。

开启追赶后，没有游标的首次启动仅回溯 `firstRunLookbackMinutes`（默认 30 分钟），而不是完整的 `maxAgeMinutes` 窗口——这避免了重放启用前的大量历史消息。

## 故障排除

<AccordionGroup>
  <Accordion title="找不到 imsg 或不支持 RPC">
    验证二进制文件和 RPC 支持：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探测报告不支持 RPC，请更新 `imsg`。如果私有 API 动作不可用，请在已登录的 macOS 用户会话中运行 `imsg launch`，然后再次探测。如果 Gateway 不在 macOS 上运行，请使用上述通过 SSH 远程 Mac 的设置，而不是默认的本地 `imsg` 路径。

  </Accordion>

  <Accordion title="Gateway 不在 macOS 上运行">
    默认的 `cliPath: "imsg"` 必须在已登录 Messages 的 Mac 上运行。在 Linux 或 Windows 上，将 `channels.imessage.cliPath` 设置为通过 SSH 连接到该 Mac 并运行 `imsg "$@"` 的包装脚本。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    然后运行：

```bash
openclaw channels status --probe --channel imessage
```

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
    - 从 Gateway 主机进行 SSH/SCP 密钥认证
    - 主机密钥存在于 Gateway 主机的 `~/.ssh/known_hosts` 中
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

- [Configuration reference - iMessage](/gateway/config-channels#imessage)
- [Gateway configuration](/gateway/configuration)
- [Pairing](/channels/pairing)

## 相关

- [Channels 概述](/channels) — 所有支持的 Channel
- [从 BlueBubbles 迁移](/channels/imessage-from-bluebubbles) — 配置转换表和逐步迁移指南
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel 路由](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
