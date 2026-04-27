---
mmh3_hash: "def06e89f20f88aeed1da38de878690d"
summary: "通过 BlueBubbles macOS 服务器使用 iMessage（REST 发送/接收、输入中、反应、配对、高级操作）。"
read_when:
  - 设置 BlueBubbles Channel
  - 排查 webhook 配对问题
  - 在 macOS 上配置 iMessage
title: "BlueBubbles"
sidebarTitle: "BlueBubbles"
---

状态：内置插件，通过 HTTP 与 BlueBubbles macOS 服务器通信。**推荐用于 iMessage 集成**，因为其 API 更丰富，设置比传统的 imsg Channel 更简单。

<Note>
当前 OpenClaw 版本内置了 BlueBubbles，因此正常打包的版本无需单独的 `openclaw plugins install` 步骤。
</Note>

## 概述

- 通过 BlueBubbles 辅助应用在 macOS 上运行（[bluebubbles.app](https://bluebubbles.app)）。
- 推荐/已测试：macOS Sequoia (15)。macOS Tahoe (26) 可用；编辑功能在 Tahoe 上目前损坏，群组图标更新可能显示成功但不会同步。
- OpenClaw 通过其 REST API 与之通信（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）。
- 传入消息通过 webhook 到达；传出回复、输入中指示器、已读回执和点赞反应是 REST 调用。
- 附件和贴纸作为入站媒体获取（并在可能时呈现给 Agent）。
- 自动 TTS 回复（合成 MP3 或 CAF 音频）作为 iMessage 语音备忘录气泡发送，而不是普通文件附件。
- 配对/allowlist 的工作方式与其他 Channel 相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + 配对代码。
- 反应作为系统事件呈现，就像 Slack/Telegram 一样，因此 Agent 可以在回复前"提及"它们。
- 高级功能：编辑、撤回、回复线程、消息效果、群组管理。

## 快速开始

<Steps>
  <Step title="安装 BlueBubbles">
    在你的 Mac 上安装 BlueBubbles 服务器（按照 [bluebubbles.app/install](https://bluebubbles.app/install) 的说明操作）。
  </Step>
  <Step title="启用 web API">
    在 BlueBubbles 配置中，启用 web API 并设置密码。
  </Step>
  <Step title="配置 OpenClaw">
    运行 `openclaw onboard` 并选择 BlueBubbles，或手动配置：

    ```json5
    {
      channels: {
        bluebubbles: {
          enabled: true,
          serverUrl: "http://192.168.1.100:1234",
          password: "example-password",
          webhookPath: "/bluebubbles-webhook",
        },
      },
    }
    ```

  </Step>
  <Step title="将 webhook 指向 Gateway">
    将 BlueBubbles webhook 指向你的 Gateway（示例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
  </Step>
  <Step title="启动 Gateway">
    启动 Gateway；它将注册 webhook 处理器并开始配对。
  </Step>
</Steps>

<Warning>
**安全性**

- 始终设置 webhook 密码。
- Webhook 身份验证始终是必需的。OpenClaw 会拒绝 BlueBubbles webhook 请求，除非它们包含与 `channels.bluebubbles.password` 匹配的 password/guid（例如 `?password=<password>` 或 `x-password`），无论 loopback/代理拓扑如何。
- 密码验证在读取/解析完整 webhook 请求体之前进行。
  </Warning>

## 保持 Messages.app 运行（VM / 无头设置）

某些 macOS VM / 常开设置可能导致 Messages.app 进入"空闲"状态（传入事件停止，直到应用被打开/置于前台）。一个简单的解决方法是**每 5 分钟使用 AppleScript + LaunchAgent 唤醒 Messages**。

<Steps>
  <Step title="保存 AppleScript">
    将此保存为 `~/Scripts/poke-messages.scpt`：

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="安装 LaunchAgent">
    将此保存为 `~/Library/LaunchAgents/com.user.poke-messages.plist`：

    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
      <dict>
        <key>Label</key>
        <string>com.user.poke-messages</string>

        <key>ProgramArguments</key>
        <array>
          <string>/bin/bash</string>
          <string>-lc</string>
          <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
        </array>

        <key>RunAtLoad</key>
        <true/>

        <key>StartInterval</key>
        <integer>300</integer>

        <key>StandardOutPath</key>
        <string>/tmp/poke-messages.log</string>
        <key>StandardErrorPath</key>
        <string>/tmp/poke-messages.err</string>
      </dict>
    </plist>
    ```

    此配置**每 300 秒**运行一次，**并在登录时**运行。首次运行可能触发 macOS **Automation** 提示（`osascript` → Messages）。在运行 LaunchAgent 的同一用户会话中批准它们。

  </Step>
  <Step title="加载它">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## Onboarding

BlueBubbles 在交互式设置向导中可用：

```
openclaw onboard
```

向导会提示输入：

<ParamField path="Server URL" type="string" required>
  BlueBubbles 服务器地址（例如 `http://192.168.1.100:1234`）。
</ParamField>
<ParamField path="Password" type="string" required>
  来自 BlueBubbles Server 设置的 API 密码。
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Webhook 端点路径。
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`、`allowlist`、`open` 或 `disabled`。
</ParamField>
<ParamField path="Allow list" type="string[]">
  电话号码、电子邮件或聊天目标。
</ParamField>

你也可以通过 CLI 添加 BlueBubbles：

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## 访问控制（DM + 群组）

<Tabs>
  <Tab title="DM">
    - 默认：`channels.bluebubbles.dmPolicy = "pairing"`。
    - 未知发送者会收到配对代码；消息在批准前被忽略（代码 1 小时后过期）。
    - 通过以下方式批准：
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - 配对是默认的令牌交换。详情：[Pairing](/channels/pairing)
  </Tab>
  <Tab title="群组">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认：`allowlist`）。
    - `channels.bluebubbles.groupAllowFrom` 控制当设置为 `allowlist` 时谁可以在群组中触发。
  </Tab>
</Tabs>

### 联系人名称丰富（macOS，可选）

BlueBubbles 群组 webhook 通常只包含原始参与者地址。如果你希望 `GroupMembers` 上下文显示本地联系人名称而非原始地址，可以在 macOS 上选择启用本地联系人丰富：

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` 启用查找。默认：`false`。
- 查找仅在群组访问、命令授权和提及门控允许消息通过后运行。
- 仅丰富未命名的电话参与者。
- 当没有找到本地匹配时，原始电话号码作为回退。

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### 提及门控（群组）

BlueBubbles 支持群聊的提及门控，匹配 iMessage/WhatsApp 行为：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）检测提及。
- 当为群组启用 `requireMention` 时，Agent 仅在被提及时响应。
- 来自授权发送者的控制命令绕过提及门控。

每个群组的配置：

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // 所有群组的默认值
        "iMessage;-;chat123": { requireMention: false }, // 特定群组的覆盖
      },
    },
  },
}
```

### 命令门控

- 控制命令（例如 `/config`、`/model`）需要授权。
- 使用 `allowFrom` 和 `groupAllowFrom` 确定命令授权。
- 授权发送者可以运行控制命令，即使在群组中没有提及。

### 每个群组的系统提示词

`channels.bluebubbles.groups.*` 下的每个条目接受一个可选的 `systemPrompt` 字符串。该值会在处理该群组消息的每次对话轮次中注入到 Agent 的系统提示词中，因此你可以设置每个群组的角色或行为规则，而无需编辑 Agent 提示词：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

键匹配 BlueBubbles 为群组报告的 `chatGuid` / `chatIdentifier` / 数字 `chatId`，`"*"` 通配符条目为所有没有精确匹配的群组提供默认值（与 `requireMention` 和每个群组工具策略使用的相同模式）。精确匹配始终优先于通配符。DM 忽略此字段；请改用 Agent 级别或账户级别的提示词自定义。

#### 示例：线程回复和点赞反应（Private API）

启用 BlueBubbles Private API 后，入站消息会带有短消息 ID（例如 `[[reply_to:5]]`），Agent 可以调用 `action=reply` 将回复线程插入特定消息，或调用 `action=react` 添加点赞反应。每个群组的 `systemPrompt` 是让 Agent 选择正确工具的可靠方式：

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

点赞反应和线程回复都需要 BlueBubbles Private API；参见[高级操作](#advanced-actions)和[消息 ID](#message-ids-short-vs-full)了解底层机制。

## ACP 会话绑定

BlueBubbles 聊天可以转换为持久的 ACP 工作区，而无需更改传输层。

快速操作流程：

- 在 DM 或允许的群聊中运行 `/acp spawn codex --bind here`。
- 该 BlueBubbles 会话中的后续消息路由到已创建的 ACP Session。
- `/new` 和 `/reset` 就地重置同一个绑定的 ACP Session。
- `/acp close` 关闭 ACP Session 并移除绑定。

还支持通过顶级 `bindings[]` 条目配置持久绑定，其中 `type: "acp"` 和 `match.channel: "bluebubbles"`。

`match.peer.id` 可以使用任何支持的 BlueBubbles 目标形式：

- 标准化的 DM 句柄，例如 `+15555550123` 或 `user@example.com`
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

对于稳定的群组绑定，优先使用 `chat_id:*` 或 `chat_identifier:*`。

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
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

参见 [ACP Agents](/tools/acp-agents) 了解共享的 ACP 绑定行为。

## 输入中 + 已读回执

- **输入中指示器**：在响应生成之前和期间自动发送。
- **已读回执**：由 `channels.bluebubbles.sendReadReceipts` 控制（默认：`true`）。
- **输入中指示器**：OpenClaw 发送输入开始事件；BlueBubbles 在发送时或超时时自动清除输入中（通过 DELETE 手动停止不可靠）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // 禁用已读回执
    },
  },
}
```

## 高级操作

BlueBubbles 在配置中启用时支持高级消息操作：

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // 点赞反应（默认：true）
        edit: true, // 编辑已发送消息（macOS 13+，在 macOS 26 Tahoe 上损坏）
        unsend: true, // 撤回消息（macOS 13+）
        reply: true, // 通过消息 GUID 回复线程
        sendWithEffect: true, // 消息效果（slam、loud 等）
        renameGroup: true, // 重命名群聊
        setGroupIcon: true, // 设置群聊图标/照片（在 macOS 26 Tahoe 上不稳定）
        addParticipant: true, // 向群组添加参与者
        removeParticipant: true, // 从群组移除参与者
        leaveGroup: true, // 离开群聊
        sendAttachment: true, // 发送附件/媒体
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="可用操作">
    - **react**：添加/移除点赞反应（`messageId`、`emoji`、`remove`）。iMessage 的原生点赞集合是 `love`、`like`、`dislike`、`laugh`、`emphasize` 和 `question`。当 Agent 选择该集合之外的表情符号（例如 `👀`）时，反应工具会回退到 `love`，以便点赞仍然渲染而不是整个请求失败。已配置的确认反应仍然严格验证并在未知值时报错。
    - **edit**：编辑已发送消息（`messageId`、`text`）。
    - **unsend**：撤回消息（`messageId`）。
    - **reply**：回复特定消息（`messageId`、`text`、`to`）。
    - **sendWithEffect**：使用 iMessage 效果发送（`text`、`to`、`effectId`）。
    - **renameGroup**：重命名群聊（`chatGuid`、`displayName`）。
    - **setGroupIcon**：设置群聊的图标/照片（`chatGuid`、`media`）—— 在 macOS 26 Tahoe 上不稳定（API 可能返回成功但图标不同步）。
    - **addParticipant**：向群组添加某人（`chatGuid`、`address`）。
    - **removeParticipant**：从群组移除某人（`chatGuid`、`address`）。
    - **leaveGroup**：离开群聊（`chatGuid`）。
    - **upload-file**：发送媒体/文件（`to`、`buffer`、`filename`、`asVoice`）。
      - 语音备忘录：使用 **MP3** 或 **CAF** 音频设置 `asVoice: true`，作为 iMessage 语音消息发送。BlueBubbles 在发送语音备忘录时将 MP3 转换为 CAF。
    - 旧版别名：`sendAttachment` 仍然有效，但 `upload-file` 是规范操作名称。
  </Accordion>
</AccordionGroup>

### 消息 ID（短 vs 完整）

OpenClaw 可能呈现_短_消息 ID（例如 `1`、`2`）以节省 token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商的完整 ID。
- 短 ID 在内存中；它们可能在重启或缓存逐出时过期。
- 操作接受短或完整 `messageId`，但如果短 ID 不再可用会报错。

对于持久自动化和存储使用完整 ID：

- 模板：`{{MessageSidFull}}`、`{{ReplyToIdFull}}`
- 上下文：入站载荷中的 `MessageSidFull` / `ReplyToIdFull`

参见 [Configuration](/gateway/configuration) 了解模板变量。

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## 合并分段发送的 DM（命令 + URL 合为一次）

当用户在 iMessage 中同时输入命令和 URL——例如 `Dump https://example.com/article`——Apple 会将发送拆分为**两个独立的 webhook 投递**：

1. 一条文本消息（`"Dump"`）。
2. 带有 OG 预览图片附件的 URL 预览气泡（`"https://..."`）。

两个 webhook 在大多数设置上相隔约 0.8-2.0 秒到达 OpenClaw。如果没有合并，Agent 在第一轮单独收到命令，回复（通常是"请发送 URL"），而 URL 在第二轮才到达——此时命令上下文已经丢失。

`channels.bluebubbles.coalesceSameSenderDms` 将 DM 选择为将来自同一发送者的连续 webhook 合并为单个 Agent 轮次。群聊继续按每条消息键控，以保留多用户轮次结构。

<Tabs>
  <Tab title="何时启用">
    在以下情况下启用：

    - 你部署了期望在一条消息中包含 `command + payload` 的技能（dump、paste、save、queue 等）。
    - 你的用户在命令旁边粘贴 URL、图片或长内容。
    - 你可以接受增加的 DM 轮次延迟（见下文）。

    在以下情况下保持禁用：

    - 你需要单字词 DM 触发器的最小命令延迟。
    - 你的所有流程都是不带后续载荷的单次命令。

  </Tab>
  <Tab title="启用">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // 选择启用（默认：false）
        },
      },
    }
    ```

    启用该标志且没有显式 `messages.inbound.byChannel.bluebubbles` 时，去抖动窗口扩大到 **2500 毫秒**（不合并的默认值是 500 毫秒）。需要更宽的窗口——Apple 的分段发送节奏为 0.8-2.0 秒，不适合更紧的默认值。

    自行调整窗口：

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 毫秒适用于大多数设置；如果你的 Mac 速度慢
            // 或内存压力大，可提高到 4000 毫秒（观察到的间隔可能超过 2 秒）。
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="权衡">
    - **DM 控制命令增加延迟。** 启用该标志后，DM 控制命令消息（如 `Dump`、`Save` 等）现在会等待到去抖动窗口结束再分发，以防载荷 webhook 即将到来。群聊命令保持即时分发。
    - **合并输出有界限**——合并文本上限为 4000 个字符，带有明确的 `…[truncated]` 标记；附件上限为 20 个；来源条目上限为 10 个（超出后保留第一个和最新的）。每个来源 `messageId` 仍然到达入站去重，因此后续 MessagePoller 对任何单个事件的重放都被识别为重复。
    - **选择性启用，按 Channel。** 其他 Channel（Telegram、WhatsApp、Slack 等）不受影响。
  </Tab>
</Tabs>

### 场景及 Agent 所见

| 用户输入                                                          | Apple 投递            | 标志关闭（默认）                        | 标志开启 + 2500 毫秒窗口                                                |
| ----------------------------------------------------------------- | --------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com`（一次发送）                            | 2 个 webhook，相隔约 1 秒 | 两个 Agent 轮次："Dump" 单独，然后 URL | 一个轮次：合并文本 `Dump https://example.com`                           |
| `Save this 📎image.jpg caption`（附件 + 文本）                    | 2 个 webhook          | 两个轮次                               | 一个轮次：文本 + 图片                                                   |
| `/status`（独立命令）                                             | 1 个 webhook          | 即时分发                               | **等待最多窗口时间，然后分发**                                          |
| 单独粘贴 URL                                                      | 1 个 webhook          | 即时分发                               | 即时分发（桶中只有一个条目）                                            |
| 文本 + URL 作为两条独立消息发送，相隔数分钟                       | 2 个 webhook，超出窗口 | 两个轮次                               | 两个轮次（窗口在两者之间过期）                                          |
| 快速刷屏（窗口内超过 10 条小 DM）                                 | N 个 webhook          | N 个轮次                               | 一个轮次，有界输出（第一个 + 最新的，应用文本/附件上限）                |

### 分段发送合并故障排除

如果标志已开启但分段发送仍作为两个轮次到达，请逐层检查：

<AccordionGroup>
  <Accordion title="配置实际已加载">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    然后 `openclaw gateway restart`——该标志在去抖动注册表创建时读取。

  </Accordion>
  <Accordion title="去抖动窗口对你的设置足够宽">
    查看 `~/Library/Logs/bluebubbles-server/main.log` 下的 BlueBubbles 服务器日志：

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    测量 `"Dump"` 风格文本分发和随后的 `"https://..."; Attachments:` 分发之间的间隔。将 `messages.inbound.byChannel.bluebubbles` 提高到足以覆盖该间隔的值。

  </Accordion>
  <Accordion title="Session JSONL 时间戳不等于 webhook 到达时间">
    Session 事件时间戳（`~/.openclaw/agents/<id>/sessions/*.jsonl`）反映的是 Gateway 将消息移交给 Agent 的时间，**而非** webhook 到达的时间。标有 `[Queued messages while agent was busy]` 的排队第二条消息意味着第一个轮次在第二个 webhook 到达时仍在运行——合并桶已经刷新。根据 BB 服务器日志而非 Session 日志调整窗口。
  </Accordion>
  <Accordion title="内存压力减慢回复分发">
    在较小的机器上（8 GB），Agent 轮次可能耗时足够长，使合并桶在回复完成之前刷新，URL 作为排队的第二个轮次到达。检查 `memory_pressure` 和 `ps -o rss -p $(pgrep openclaw-gateway)`；如果 Gateway 超过约 500 MB RSS 且压缩器处于活动状态，请关闭其他重型进程或升级到更大的主机。
  </Accordion>
  <Accordion title="引用回复发送是不同的路径">
    如果用户将 `Dump` 作为**现有 URL 气泡的回复**发送（iMessage 在 Dump 气泡上显示"1 Reply"徽章），URL 位于 `replyToBody` 中，而不是第二个 webhook 中。合并不适用——这是技能/提示词的关注点，而不是去抖动器的关注点。
  </Accordion>
</AccordionGroup>

## Block streaming

控制响应是作为单条消息发送还是以块形式流式传输：

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // 启用块流式传输（默认关闭）
    },
  },
}
```

## 媒体 + 限制

- 入站附件被下载并存储在媒体缓存中。
- 通过 `channels.bluebubbles.mediaMaxMb` 限制入站和出站媒体（默认：8 MB）。
- 出站文本分块为 `channels.bluebubbles.textChunkLimit`（默认：4000 个字符）。

## 配置参考

完整配置：[Configuration](/gateway/configuration)

<AccordionGroup>
  <Accordion title="连接和 webhook">
    - `channels.bluebubbles.enabled`：启用/禁用 Channel。
    - `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基础 URL。
    - `channels.bluebubbles.password`：API 密码。
    - `channels.bluebubbles.webhookPath`：Webhook 端点路径（默认：`/bluebubbles-webhook`）。
  </Accordion>
  <Accordion title="访问策略">
    - `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
    - `channels.bluebubbles.allowFrom`：DM allowlist（句柄、电子邮件、E.164 号码、`chat_id:*`、`chat_guid:*`）。
    - `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
    - `channels.bluebubbles.groupAllowFrom`：群组发送者 allowlist。
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`：在 macOS 上，可选在门控通过后从本地联系人丰富未命名的群组参与者。默认：`false`。
    - `channels.bluebubbles.groups`：每个群组的配置（`requireMention` 等）。
  </Accordion>
  <Accordion title="投递和分块">
    - `channels.bluebubbles.sendReadReceipts`：发送已读回执（默认：`true`）。
    - `channels.bluebubbles.blockStreaming`：启用块流式传输（默认：`false`；流式回复需要）。
    - `channels.bluebubbles.textChunkLimit`：出站块大小（字符）（默认：4000）。
    - `channels.bluebubbles.sendTimeoutMs`：通过 `/api/v1/message/text` 进行出站文本发送的每个请求超时时间（毫秒）（默认：30000）。在 macOS 26 设置上，Private API iMessage 发送可能在 iMessage 框架内卡顿 60 秒以上，可提高此值，例如 `45000` 或 `60000`。探测、聊天查找、反应、编辑和健康检查目前保持较短的 10 秒默认值；计划将覆盖范围扩展到反应和编辑。每账户覆盖：`channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`。
    - `channels.bluebubbles.chunkMode`：`length`（默认）仅在超过 `textChunkLimit` 时拆分；`newline` 在长度分块前在空行（段落边界）拆分。
  </Accordion>
  <Accordion title="媒体和历史记录">
    - `channels.bluebubbles.mediaMaxMb`：入站/出站媒体上限（MB）（默认：8）。
    - `channels.bluebubbles.mediaLocalRoots`：出站本地媒体路径允许的绝对本地目录的显式 allowlist。除非配置此项，否则默认拒绝本地路径发送。每账户覆盖：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
    - `channels.bluebubbles.coalesceSameSenderDms`：将来自同一发送者的连续 DM webhook 合并为一个 Agent 轮次，以便 Apple 的文本+URL 分段发送作为单条消息到达（默认：`false`）。参见[合并分段发送的 DM](#coalescing-split-send-dms-command--url-in-one-composition)了解场景、窗口调整和权衡。启用后且没有显式 `messages.inbound.byChannel.bluebubbles` 时，将默认入站去抖动窗口从 500 毫秒扩大到 2500 毫秒。
    - `channels.bluebubbles.historyLimit`：上下文的最大群组消息数（0 禁用）。
    - `channels.bluebubbles.dmHistoryLimit`：DM 历史记录限制。
  </Accordion>
  <Accordion title="操作和账户">
    - `channels.bluebubbles.actions`：启用/禁用特定操作。
    - `channels.bluebubbles.accounts`：多账户配置。
  </Accordion>
</AccordionGroup>

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

## 寻址 / 发送目标

优先使用 `chat_guid` 实现稳定路由：

- `chat_guid:iMessage;-;+15555550123`（群组的首选）
- `chat_id:123`
- `chat_identifier:...`
- 直接句柄：`+15555550123`、`user@example.com`
  - 如果直接句柄没有现有的 DM 聊天，OpenClaw 将通过 `POST /api/v1/chat/new` 创建一个。这需要启用 BlueBubbles Private API。

### iMessage vs SMS 路由

当同一句柄在 Mac 上同时有 iMessage 和 SMS 聊天（例如已注册 iMessage 的电话号码但也收到过绿色气泡回退），OpenClaw 优先选择 iMessage 聊天，永远不会静默降级到 SMS。要强制使用 SMS 聊天，请使用显式的 `sms:` 目标前缀（例如 `sms:+15555550123`）。没有匹配 iMessage 聊天的句柄仍通过 BlueBubbles 报告的任何聊天发送。

## 安全性

- Webhook 请求通过将 `guid`/`password` 查询参数或标头与 `channels.bluebubbles.password` 比较来进行身份验证。
- 保持 API 密码和 webhook 端点机密（将它们视为凭据）。
- BlueBubbles webhook 认证没有 localhost 绕过。如果你代理 webhook 流量，请在整个请求链路上保留 BlueBubbles 密码。`gateway.trustedProxies` 在此不能替代 `channels.bluebubbles.password`。参见 [Gateway security](/gateway/security#reverse-proxy-configuration)。
- 如果在 LAN 外部公开 BlueBubbles 服务器，启用 HTTPS + 防火墙规则。

## 故障排除

- 如果输入中/已读事件停止工作，检查 BlueBubbles webhook 日志并验证 Gateway 路径是否匹配 `channels.bluebubbles.webhookPath`。
- 配对代码在一小时后过期；使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 反应需要 BlueBubbles 私有 API（`POST /api/v1/message/react`）；确保服务器版本公开它。
- 编辑/撤回需要 macOS 13+ 和兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于私有 API 更改，编辑目前损坏。
- 群组图标更新在 macOS 26（Tahoe）上可能不稳定：API 可能返回成功但新图标不同步。
- OpenClaw 根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知损坏的操作。如果编辑在 macOS 26（Tahoe）上仍然出现，使用 `channels.bluebubbles.actions.edit=false` 手动禁用。
- `coalesceSameSenderDms` 已启用但分段发送（例如 `Dump` + URL）仍作为两个轮次到达：参见[分段发送合并故障排除](#split-send-coalescing-troubleshooting)检查清单——常见原因是去抖动窗口太紧、Session 日志时间戳被误读为 webhook 到达时间，或引用回复发送（使用 `replyToBody`，而不是第二个 webhook）。
- 对于状态/健康信息：`openclaw status --all` 或 `openclaw status --deep`。

有关一般 Channel 工作流参考，参见 [Channels](/channels) 和 [Plugins](/tools/plugin) 指南。

## 相关

- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Channels 概述](/channels) — 所有支持的 Channels
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Security](/gateway/security) — 访问模型和安全加固
