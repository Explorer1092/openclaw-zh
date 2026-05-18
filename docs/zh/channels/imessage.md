---
mmh3_hash: "dc00de95653807a08284634aa860ce4d"
summary: "通过 imsg 实现原生 iMessage 支持（基于 stdio 的 JSON-RPC），支持私有 API 动作：回复、tapback、效果、附件和群组管理。适合满足主机要求的新 OpenClaw iMessage 设置。"
read_when:
  - 设置 iMessage 支持
  - 调试 iMessage 收发
title: "iMessage"
---

<Note>
对于 OpenClaw iMessage 部署，在已登录的 macOS Messages 主机上使用 `imsg`。如果您的 Gateway 运行在 Linux 或 Windows 上，将 `channels.imessage.cliPath` 指向一个 SSH 包装脚本，在 Mac 上运行 `imsg`。

**Gateway 停机后追赶为可选项。** 启用后（`channels.imessage.catchup.enabled: true`），Gateway 在下次启动时重放 Gateway 离线（崩溃、重启、Mac 睡眠）期间落入 `chat.db` 的入站消息。默认禁用——参见[Gateway 停机后追赶](#gateway-停机后追赶)。
</Note>

<Warning>
BlueBubbles 支持已移除。将 `channels.bluebubbles` 配置迁移到 `channels.imessage`；OpenClaw 仅通过 `imsg` 支持 iMessage。请先阅读 [BlueBubbles 移除和 imsg iMessage 路径](/announcements/bluebubbles-imessage)了解简短公告，或阅读[来自 BlueBubbles](/channels/imessage-from-bluebubbles)了解完整迁移表。
</Warning>

状态：原生外部 CLI 集成。Gateway 派生 `imsg rpc` 并通过 stdio 上的 JSON-RPC 进行通信（无需独立的守护进程/端口）。高级操作需要 `imsg launch` 和成功的私有 API 探测。

<CardGroup cols={3}>
  <Card title="私有 API 操作" icon="wand-sparkles" href="#私有-api-操作">
    回复、tapback、效果、附件和群组管理。
  </Card>
  <Card title="Pairing" icon="link" href="/channels/pairing">
    iMessage 私信默认使用配对模式。
  </Card>
  <Card title="远程 Mac" icon="terminal" href="#通过-ssh-使用远程-mac">
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

      <Step title="批准首个私信配对（默认 dmPolicy）">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        配对请求在 1 小时后过期。
      </Step>
    </Steps>

  </Tab>

  <Tab title="通过 SSH 使用远程 Mac">
    OpenClaw 只需要一个兼容 stdio 的 `cliPath`，因此您可以将 `cliPath` 指向通过 SSH 连接到远程 Mac 并运行 `imsg` 的包装脚本。

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
    `remoteHost` 必须是 `host` 或 `user@host`（不含空格或 SSH 选项）。
    OpenClaw 对 SCP 使用严格主机密钥检查，因此中继主机密钥必须已存在于 `~/.ssh/known_hosts` 中。
    附件路径根据允许的根目录进行验证（`attachmentRoots` / `remoteAttachmentRoots`）。

  </Tab>
</Tabs>

## 要求和权限（macOS）

- Messages 必须在运行 `imsg` 的 Mac 上登录。
- 运行 OpenClaw/`imsg` 的进程上下文需要完全磁盘访问权限（Messages 数据库访问）。
- 通过 Messages.app 发送消息需要自动化权限。
- 对于高级操作（react / edit / unsend / 线程回复 / 效果 / 群组操作），必须禁用系统完整性保护——参见下方[启用 imsg 私有 API](#启用-imsg-私有-api)。基本文本和媒体收发无需禁用。

<Tip>
权限按进程上下文授予。如果 Gateway 无头运行（LaunchAgent/SSH），在同一上下文中运行一次交互式命令以触发提示：

```bash
imsg chats --limit 1
# 或
imsg send <handle> "test"
```

</Tip>

## 启用 imsg 私有 API

`imsg` 以两种操作模式发布：

- **基本模式**（默认，无需更改 SIP）：通过 `send` 发送出站文本和媒体，入站监视/历史，聊天列表。这是从新的 `brew install steipete/tap/imsg` 加上上述标准 macOS 权限开箱即用的内容。
- **私有 API 模式**：`imsg` 将辅助 dylib 注入 `Messages.app` 以调用内部 `IMCore` 函数。这解锁了 `react`、`edit`、`unsend`、`reply`（线程）、`sendWithEffect`、`renameGroup`、`setGroupIcon`、`addParticipant`、`removeParticipant`、`leaveGroup`，以及正在输入指示器和已读回执。

要访问本 Channel 页面记录的高级操作界面，需要私有 API 模式。`imsg` README 明确说明了这一要求：

> 高级功能（如 `read`、`typing`、`launch`、桥接支持的富发送、消息变更和聊天管理）是可选启用的。它们需要禁用 SIP，并将辅助 dylib 注入 `Messages.app`。当 SIP 启用时，`imsg launch` 拒绝注入。

辅助注入技术使用 `imsg` 自己的 dylib 访问 Messages 私有 API。OpenClaw iMessage 路径中没有第三方服务器或 BlueBubbles 运行时。

<Warning>
**禁用 SIP 是真实的安全权衡。** SIP 是 macOS 防止运行修改后系统代码的核心保护之一；全系统关闭它会带来额外的攻击面和副作用。值得注意的是，**在 Apple Silicon Mac 上禁用 SIP 也会禁用在 Mac 上安装和运行 iOS 应用的能力**。

将其视为有意识的运维选择，而非默认设置。如果您的威胁模型无法容忍 SIP 关闭，捆绑的 iMessage 仅限于基本模式——仅文本和媒体收发，无 Reaction / edit / unsend / 效果 / 群组操作。
</Warning>

### 设置

1. **在运行 Messages.app 的 Mac 上安装（或升级）`imsg`：**

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg status --json
   ```

   `imsg status --json` 输出报告 `bridge_version`、`rpc_methods` 和每方法的 `selectors`，以便您在开始之前查看当前构建支持的内容。

2. **禁用系统完整性保护。** 这是特定于 macOS 版本的，因为底层 Apple 要求取决于操作系统和硬件：
   - **macOS 10.13–10.15（Sierra–Catalina）：** 通过 Terminal 禁用库验证，重启到恢复模式，运行 `csrutil disable`，重启。
   - **macOS 11+（Big Sur 及更高版本），Intel：** 恢复模式（或互联网恢复），`csrutil disable`，重启。
   - **macOS 11+，Apple Silicon：** 电源键启动序列进入恢复模式；在最近的 macOS 版本上，点击"继续"时按住 **左 Shift** 键，然后 `csrutil disable`。虚拟机设置遵循单独的流程——先拍摄虚拟机快照。
   - **macOS 26 / Tahoe：** 库验证策略和 `imagent` 私有权限检查进一步收紧；`imsg` 可能需要更新的构建来跟上。如果 macOS 主要升级后 `imsg launch` 注入或特定 `selectors` 开始返回 false，在假设 SIP 步骤成功之前请检查 `imsg` 的发行说明。

   在运行 `imsg launch` 之前，按照 Mac 的 Apple 恢复模式流程禁用 SIP。

3. **注入辅助程序。** SIP 禁用且 Messages.app 已登录后：

   ```bash
   imsg launch
   ```

   当 SIP 仍然启用时，`imsg launch` 拒绝注入，因此这也作为确认步骤 2 成功的确认。

4. **从 OpenClaw 验证桥接：**

   ```bash
   openclaw channels status --probe
   ```

   iMessage 条目应报告 `works`，`imsg status --json | jq '.selectors'` 应显示 `retractMessagePart: true` 加上您的 macOS 构建暴露的任何 edit / typing / read 选择器。`actions.ts` 中的 OpenClaw Plugin 每方法门控仅通告底层选择器为 `true` 的操作，因此您在 Agent 工具列表中看到的操作界面反映了此主机上桥接实际能做的事情。

如果 `openclaw channels status --probe` 报告 Channel 为 `works` 但特定操作在调度时抛出"iMessage `<action>` requires the imsg private API bridge"，请再次运行 `imsg launch`——辅助程序可能已脱落（Messages.app 重启、操作系统更新等），缓存的 `available: true` 状态会继续通告操作，直到下次探测刷新。

### 当无法禁用 SIP 时

如果禁用 SIP 不符合您的威胁模型：

- `imsg` 回退到基本模式——仅文本 + 媒体 + 接收。
- OpenClaw Plugin 仍然通告文本/媒体发送和入站监视；它只是从操作界面隐藏 `react`、`edit`、`unsend`、`reply`、`sendWithEffect` 和群组操作（根据每方法功能门控）。
- 您可以运行一台独立的非 Apple Silicon Mac（或专用的 bot Mac），SIP 关闭用于 iMessage 工作负载，同时在主要设备上保持 SIP 启用。参见下方[专用 bot macOS 用户（独立 iMessage 身份）](#部署模式)。

## 访问控制和路由

<Tabs>
  <Tab title="私信策略">
    `channels.imessage.dmPolicy` 控制私信：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    Allowlist 字段：`channels.imessage.allowFrom`。

    Allowlist 条目必须标识发送者：句柄或静态发送者访问组（`accessGroup:<name>`）。使用 `channels.imessage.groupAllowFrom` 用于聊天目标，如 `chat_id:*`、`chat_guid:*` 或 `chat_identifier:*`；使用 `channels.imessage.groups` 用于数字 `chat_id` 注册表键。

  </Tab>

  <Tab title="群组策略 + 提及">
    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（配置时默认）
    - `open`
    - `disabled`

    群组发送者 allowlist：`channels.imessage.groupAllowFrom`。

    `groupAllowFrom` 条目也可以引用静态发送者访问组（`accessGroup:<name>`）。

    运行时回退：如果未设置 `groupAllowFrom`，iMessage 群组发送者检查使用 `allowFrom`；当私信和群组准入应不同时，设置 `groupAllowFrom`。
    运行时注意：如果 `channels.imessage` 完全缺失，运行时回退到 `groupPolicy="allowlist"` 并记录警告（即使设置了 `channels.defaults.groupPolicy`）。

    <Warning>
    群组路由有**两个** allowlist 门连续运行，两个都必须通过：

    1. **发送者/聊天目标 allowlist**（`channels.imessage.groupAllowFrom`）——句柄、`chat_guid`、`chat_identifier` 或 `chat_id`。
    2. **群组注册表**（`channels.imessage.groups`）——使用 `groupPolicy: "allowlist"` 时，此门需要 `groups: { "*": { ... } }` 通配符条目（设置 `allowAll = true`），或 `groups` 下的显式每 `chat_id` 条目。

    如果门 2 中没有任何内容，所有群组消息都会被丢弃。Plugin 在默认日志级别发出两个 `warn` 级别信号：

    - 启动时每账户一次：`imessage: groupPolicy="allowlist" but channels.imessage.groups is empty for account "<id>"`
    - 运行时每 `chat_id` 一次：`imessage: dropping group message from chat_id=<id> ...`

    私信继续工作，因为它们走不同的代码路径。

    在 `groupPolicy: "allowlist"` 下保持群组流通的最小配置：

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

    如果这些 `warn` 行出现在 Gateway 日志中，门 2 正在丢弃——添加 `groups` 块。
    </Warning>

    群组的提及门控：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
    - 没有配置的模式，提及门控无法强制执行

    来自已授权发送者的控制命令可以在群组中绕过提及门控。

    每群组 `systemPrompt`：

    `channels.imessage.groups.*` 下的每个条目接受可选的 `systemPrompt` 字符串。该值在处理该群组消息的每次轮次中注入到 Agent 的系统提示中。解析方式与 `channels.whatsapp.groups` 使用的每群组提示解析相同：

    1. **群组特定系统提示**（`groups["<chat_id>"].systemPrompt`）：当映射中存在特定群组条目**且**定义了其 `systemPrompt` 键时使用。如果 `systemPrompt` 是空字符串（`""`），则抑制通配符，不向该群组应用系统提示。
    2. **群组通配符系统提示**（`groups["*"].systemPrompt`）：当特定群组条目完全不在映射中，或存在但未定义 `systemPrompt` 键时使用。

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
              // 显式抑制：通配符 "Use British spelling." 在这里不适用
              systemPrompt: "",
            },
          },
        },
      },
    }
    ```

    每群组提示仅适用于群组消息——此 Channel 中的私信不受影响。

  </Tab>

  <Tab title="Session 和确定性回复">
    - 私信使用直接路由；群组使用群组路由。
    - 使用默认 `session.dmScope=main`，iMessage 私信折叠到 Agent 主 Session 中。
    - 群组 Session 是隔离的（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复使用源 Channel/目标元数据路由回 iMessage。

    类似群组的线程行为：

    某些多参与者 iMessage 线程可能以 `is_group=false` 到达。
    如果该 `chat_id` 在 `channels.imessage.groups` 下显式配置，OpenClaw 将其视为群组流量（群组门控 + 群组 Session 隔离）。

  </Tab>
</Tabs>

## ACP 对话绑定

旧版 iMessage 聊天也可以绑定到 ACP Session。

快速运维员流程：

- 在私信或允许的群组聊天中运行 `/acp spawn codex --bind here`。
- 该 iMessage 对话中的未来消息路由到派生的 ACP Session。
- `/new` 和 `/reset` 就地重置同一绑定的 ACP Session。
- `/acp close` 关闭 ACP Session 并移除绑定。

通过带 `type: "acp"` 和 `match.channel: "imessage"` 的顶层 `bindings[]` 条目支持已配置的持久绑定。

`match.peer.id` 可以使用：

- 规范化的私信句柄，如 `+15555550123` 或 `user@example.com`
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
    使用专用 Apple ID 和 macOS 用户，将 bot 流量与您的个人 Messages 配置文件隔离。

    典型流程：

    1. 创建/登录专用 macOS 用户。
    2. 在该用户中使用 bot Apple ID 登录 Messages。
    3. 在该用户中安装 `imsg`。
    4. 创建 SSH 包装器，使 OpenClaw 可以在该用户上下文中运行 `imsg`。
    5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户配置文件。

    首次运行可能需要在该 bot 用户会话中进行 GUI 批准（自动化 + 完全磁盘访问）。

  </Accordion>

  <Accordion title="通过 Tailscale 的远程 Mac（示例）">
    常见拓扑：

    - Gateway 运行在 Linux/VM 上
    - iMessage + `imsg` 运行在您的 tailnet 中的 Mac 上
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

    使用 SSH 密钥使 SSH 和 SCP 都是非交互式的。
    先确保主机密钥受信任（例如 `ssh bot@mac-mini.tailnet-1234.ts.net`）以填充 `known_hosts`。

  </Accordion>

  <Accordion title="多账户模式">
    iMessage 支持 `channels.imessage.accounts` 下的每账户配置。

    每个账户可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb`、历史设置和附件根目录 allowlist 等字段。

  </Accordion>
</AccordionGroup>

## 媒体、分块和传递目标

<AccordionGroup>
  <Accordion title="附件和媒体">
    - 入站附件摄入**默认关闭**——设置 `channels.imessage.includeAttachments: true` 将照片、语音备忘录、视频和其他附件转发给 Agent。禁用时，仅含附件的 iMessage 在到达 Agent 之前被丢弃，可能根本不产生 `Inbound message` 日志行。
    - 设置 `remoteHost` 后，远程附件路径可以通过 SCP 获取
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
      - `newline`（段落优先分割）

  </Accordion>

  <Accordion title="寻址格式">
    推荐的显式目标：

    - `chat_id:123`（推荐用于稳定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    也支持句柄目标：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

    ```bash
    imsg chats --limit 20
    ```

  </Accordion>
</AccordionGroup>

## 私有 API 操作

当 `imsg launch` 运行且 `openclaw channels status --probe` 报告 `privateApi.available: true` 时，message 工具除了普通文本发送外还可以使用 iMessage 原生操作。

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
  <Accordion title="可用操作">
    - **react**：添加/移除 iMessage tapback（`messageId`、`emoji`、`remove`）。支持的 tapback 映射到 love、like、dislike、laugh、emphasize 和 question。
    - **reply**：向现有消息发送线程回复（`messageId`、`text` 或 `message`，加上 `chatGuid`、`chatId`、`chatIdentifier` 或 `to`）。
    - **sendWithEffect**：发送带 iMessage 效果的文本（`text` 或 `message`、`effect` 或 `effectId`）。
    - **edit**：在支持的 macOS/私有 API 版本上编辑已发送的消息（`messageId`、`text` 或 `newText`）。
    - **unsend**：在支持的 macOS/私有 API 版本上撤回已发送的消息（`messageId`）。
    - **upload-file**：发送媒体/文件（`buffer` 作为 base64 或已填充的 `media`/`path`/`filePath`，`filename`，可选 `asVoice`）。旧版别名：`sendAttachment`。
    - **renameGroup**、**setGroupIcon**、**addParticipant**、**removeParticipant**、**leaveGroup**：当当前目标是群组对话时管理群组聊天。

  </Accordion>

  <Accordion title="消息 ID">
    入站 iMessage 上下文包含短的 `MessageSid` 值和完整消息 GUID（如果可用）。短 ID 作用域为最近的内存中回复缓存，并在使用前根据当前聊天进行检查。如果短 ID 已过期或属于另一个聊天，请使用完整的 `MessageSidFull` 重试。

  </Accordion>

  <Accordion title="功能检测">
    仅当缓存的探测状态显示桥接不可用时，OpenClaw 才隐藏私有 API 操作。如果状态未知，操作保持可见并懒惰地探测，使得第一个操作可以在无需单独手动状态刷新的情况下在 `imsg launch` 后成功。

  </Accordion>

  <Accordion title="已读回执和正在输入">
    当私有 API 桥接正常运行时，已接受的入站聊天在调度前被标记为已读，并在 Agent 生成时向发送者显示正在输入气泡。使用以下方式禁用已读标记：

    ```json5
    {
      channels: {
        imessage: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    在每方法功能列表之前的旧版 `imsg` 构建将静默关闭输入/已读；OpenClaw 每次重启记录一次警告，使缺失的回执可追踪。

  </Accordion>

  <Accordion title="入站 tapback">
    OpenClaw 订阅 iMessage tapback，并将已接受的 Reaction 作为系统事件而非普通消息文本路由，因此用户 tapback 不会触发普通回复循环。

    通知模式由 `channels.imessage.reactionNotifications` 控制：

    - `"own"`（默认）：仅在用户对 bot 发布的消息做出 Reaction 时通知。
    - `"all"`：通知来自已授权发送者的所有入站 tapback。
    - `"off"`：忽略入站 tapback。

    每账户覆盖使用 `channels.imessage.accounts.<id>.reactionNotifications`。

  </Accordion>
</AccordionGroup>

## 配置写入

iMessage 默认允许 Channel 发起的配置写入（`/config set|unset` 当 `commands.config: true` 时）。

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

## 合并分割发送的私信（同一消息中的命令 + URL）

当用户一起输入命令和 URL 时——例如 `Dump https://example.com/article`——Apple 的 Messages 应用将发送拆分为**两个独立的 `chat.db` 行**：

1. 文本消息（`"Dump"`）。
2. 带有 OG 预览图像附件的 URL 预览气球（`"https://..."`）。

两行在大多数设置上相差约 0.8-2.0 秒到达 OpenClaw。没有合并，Agent 在第 1 轮单独接收命令，回复（通常是"请发给我 URL"），只在第 2 轮才看到 URL——此时命令上下文已丢失。这是 Apple 的发送管道，不是 OpenClaw 或 `imsg` 引入的。

`channels.imessage.coalesceSameSenderDms` 将私信选择加入合并连续的相同发送者行为单个 Agent 轮次。群组聊天继续按消息调度，以保留多用户轮次结构。

<Tabs>
  <Tab title="何时启用">
    在以下情况启用：

    - 您发布的 Skill 期望在一条消息中接收 `命令 + 载荷`（dump、paste、save、queue 等）。
    - 您的用户在命令旁边粘贴 URL、图像或长内容。
    - 您可以接受增加的私信轮次延迟（见下文）。

    在以下情况保持禁用：

    - 您需要单词私信触发器的最小命令延迟。
    - 您的所有流程都是没有载荷跟进的一次性命令。

  </Tab>
  <Tab title="启用">
    ```json5
    {
      channels: {
        imessage: {
          coalesceSameSenderDms: true, // 选择加入（默认：false）
        },
      },
    }
    ```

    当标志开启且没有显式的 `messages.inbound.byChannel.imessage` 时，防抖窗口扩大到 **2500 毫秒**（旧版默认为 0 毫秒——无防抖）。更宽的窗口是必需的，因为 Apple 的 0.8-2.0 秒拆分发送节奏不适合更短的默认值。

    自行调整窗口：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 毫秒适用于大多数设置；如果 Mac 运行缓慢
            // 或内存不足（观察到的间隙可能超过 2 秒），则提高到 4000 毫秒。
            imessage: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="权衡">
    - **增加私信消息的延迟。** 标志开启时，每条私信（包括独立的控制命令和单文本跟进）在调度之前等待最多防抖窗口，以防载荷行即将到来。群组聊天消息保持即时调度。
    - **合并输出有界。** 合并文本上限为 4000 个字符，带有显式的 `…[truncated]` 标记；附件上限为 20 个；源条目上限为 10 个（超出后保留第一个和最新的）。每个源 GUID 在 `coalescedMessageGuids` 中跟踪，用于下游遥测。
    - **仅限私信。** 群组聊天通过每消息调度，使 bot 在多人同时输入时保持响应。
    - **可选，按 Channel。** 其他 Channel（Telegram、WhatsApp、Slack 等）不受影响。设置了 `channels.bluebubbles.coalesceSameSenderDms` 的旧版 BlueBubbles 配置应将该值迁移到 `channels.imessage.coalesceSameSenderDms`。

  </Tab>
</Tabs>

### 场景及 Agent 看到的内容

| 用户编写内容                                                         | `chat.db` 产生       | 标志关闭（默认）                        | 标志开启 + 2500 毫秒窗口                                                   |
| -------------------------------------------------------------------- | -------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                               | 2 行，约 1 秒间隔    | 两次 Agent 轮次："Dump" 独立，然后 URL  | 一次轮次：合并文本 `Dump https://example.com`                              |
| `Save this 📎image.jpg caption`（附件 + 文本）                      | 2 行                 | 两次轮次（附件在合并时丢弃）            | 一次轮次：保留文本 + 图像                                                  |
| `/status`（独立命令）                                                | 1 行                 | 即时调度                                | **等待最多窗口，然后调度**                                                 |
| 单独粘贴 URL                                                         | 1 行                 | 即时调度                                | 即时调度（桶中只有一个条目）                                               |
| 文本 + URL 作为两条有意分开的消息发送，相隔几分钟                    | 窗口外的 2 行        | 两次轮次                                | 两次轮次（它们之间的窗口过期）                                             |
| 快速洪流（窗口内 >10 条小私信）                                      | N 行                 | N 次轮次                                | 一次轮次，有界输出（第一个 + 最新的，文本/附件上限已应用）                 |
| 两人在群组聊天中输入                                                 | M 个发送者的 N 行    | M+ 次轮次（每个发送者桶一次）           | M+ 次轮次——群组聊天不合并                                                  |

## Gateway 停机后追赶

当 Gateway 离线时（崩溃、重启、Mac 睡眠、机器关闭），`imsg watch` 在 Gateway 恢复后从当前 `chat.db` 状态恢复——默认情况下，间隙期间到达的任何内容都不会被看到。追赶在下次启动时重放这些消息，使 Agent 不会静默错过入站流量。

追赶**默认禁用**。按 Channel 启用：

```ts
channels: {
  imessage: {
    catchup: {
      enabled: true,             // 主开关（默认：false）
      maxAgeMinutes: 120,        // 跳过超过 now - 2h 的行（默认：120，范围 1..720）
      perRunLimit: 50,           // 每次启动最多重放的行数（默认：50，范围 1..500）
      firstRunLookbackMinutes: 30, // 无游标的首次运行：回顾 30 分钟（默认：30）
      maxFailureRetries: 10,     // 10 次调度失败后放弃卡住的 guid（默认：10）
    },
  },
}
```

### 运行方式

每次 `monitorIMessageProvider` 启动一次通道，顺序为：`imsg launch` 就绪 → `watch.subscribe` → `performIMessageCatchup` → 实时调度循环。追赶本身对同一个 JSON-RPC 客户端使用 `chats.list` + 每聊天 `messages.history`，与 `imsg watch` 使用的相同。追赶期间到达的任何内容都正常流经实时调度；现有的入站去重缓存吸收与重放行的任何重叠。

每个重放行通过实时调度路径（`evaluateIMessageInbound` + `dispatchInboundMessage`）馈送，因此 allowlist、群组策略、防抖器、回声缓存和已读回执在重放和实时消息上的行为完全相同。

### 游标和重试语义

追赶在 `<openclawStateDir>/imessage/catchup/<account>__<hash>.json` 保留每账户游标（OpenClaw 状态目录默认为 `~/.openclaw`，可通过 `OPENCLAW_STATE_DIR` 覆盖）：

```json
{
  "lastSeenMs": 1717900800000,
  "lastSeenRowid": 482910,
  "updatedAt": 1717900801234,
  "failureRetries": { "<guid>": 1 }
}
```

- 游标在每次成功调度时推进，当行调度抛出时保持——下次启动从保持的游标重试同一行。
- 对同一 `guid` 连续 `maxFailureRetries` 次抛出后，追赶记录 `warn` 并强制推进游标越过卡住的消息，使后续启动可以继续。
- 已放弃的 guid 在后续运行中见到时被跳过（不尝试调度），并在运行摘要中的 `skippedGivenUp` 下计数。

### 运维员可见信号

```
imessage catchup: replayed=N skippedFromMe=… skippedGivenUp=… failed=… givenUp=… fetchedCount=…
imessage catchup: giving up on guid=<guid> after <N> failures; advancing cursor past it
imessage catchup: fetched <X> rows across chats, capped to perRunLimit=<Y>
```

`WARN ... capped to perRunLimit` 行表示单次启动未能清空完整积压。如果您的间隙经常超过默认的 50 行通道，提高 `perRunLimit`（最大 500）。

### 何时保持关闭

- Gateway 持续运行，带有看门狗自动重启，间隙始终 < 几秒——默认关闭是可以的。
- 私信量低，错过的消息不会改变 Agent 行为——`firstRunLookbackMinutes` 初始窗口可以在首次启用时调度出乎意料的旧上下文。

当您开启追赶时，没有游标的第一次启动只回顾 `firstRunLookbackMinutes`（默认 30 分钟），而不是完整的 `maxAgeMinutes` 窗口——这避免了重放启用前的长历史消息。

## 故障排除

<AccordionGroup>
  <Accordion title="imsg 未找到或 RPC 不支持">
    验证二进制文件和 RPC 支持：

    ```bash
    imsg rpc --help
    imsg status --json
    openclaw channels status --probe
    ```

    如果探测报告 RPC 不支持，更新 `imsg`。如果私有 API 操作不可用，在已登录的 macOS 用户会话中运行 `imsg launch` 并再次探测。如果 Gateway 不在 macOS 上运行，使用上面的 SSH 远程 Mac 设置，而不是默认的本地 `imsg` 路径。

  </Accordion>

  <Accordion title="Gateway 不在 macOS 上运行">
    默认 `cliPath: "imsg"` 必须在登录了 Messages 的 Mac 上运行。在 Linux 或 Windows 上，将 `channels.imessage.cliPath` 设置为通过 SSH 连接到该 Mac 并运行 `imsg "$@"` 的包装脚本。

```bash
#!/usr/bin/env bash
exec ssh -T messages-mac imsg "$@"
```

    然后运行：

```bash
openclaw channels status --probe --channel imessage
```

  </Accordion>

  <Accordion title="私信被忽略">
    检查：

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - 配对批准（`openclaw pairing list imessage`）

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
    - 从 Gateway 主机到 Mac 的 SSH/SCP 密钥认证
    - 主机密钥在 Gateway 主机的 `~/.ssh/known_hosts` 中存在
    - 运行 Messages 的 Mac 上远程路径的可读性

  </Accordion>

  <Accordion title="macOS 权限提示被错过">
    在相同用户/会话上下文的交互式 GUI 终端中重新运行并批准提示：

    ```bash
    imsg chats --limit 1
    imsg send <handle> "test"
    ```

    确认运行 OpenClaw/`imsg` 的进程上下文已获得完全磁盘访问 + 自动化权限。

  </Accordion>
</AccordionGroup>

## 配置参考指针

- [配置参考 - iMessage](/gateway/config-channels#imessage)
- [Gateway 配置](/gateway/configuration)
- [Pairing](/channels/pairing)

## 相关

- [Channels 概述](/channels) — 所有支持的 Channel
- [BlueBubbles 移除和 imsg iMessage 路径](/announcements/bluebubbles-imessage) — 公告和迁移摘要
- [来自 BlueBubbles](/channels/imessage-from-bluebubbles) — 配置转换表和分步切换
- [Pairing](/channels/pairing) — 私信认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
