---
mmh3_hash: "bedaf668006bd06e70b2e7b43f1007b2"
title: "Mattermost"
sidebarTitle: "Mattermost"
summary: "Mattermost bot 设置和 OpenClaw 配置"
read_when:
  - 设置 Mattermost
  - 调试 Mattermost 路由
---

状态：内置插件（bot token + WebSocket 事件）。支持 Channel、群组和私信。
Mattermost 是一个可自托管的团队消息平台；产品详情和下载请访问官方网站
[mattermost.com](https://mattermost.com)。

## 内置插件

<Note>
Mattermost 作为内置插件随当前 OpenClaw 版本提供，正常打包的构建无需单独安装。
</Note>

如果您使用的是旧版本或不包含 Mattermost 的自定义安装，请手动安装：

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="本地检出">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

详情：[插件](/tools/plugin)

## 快速设置

<Steps>
  <Step title="确认插件可用">
    当前打包的 OpenClaw 版本已内置该插件。旧版/自定义安装可使用上方命令手动添加。
  </Step>
  <Step title="创建 Mattermost bot">
    创建 Mattermost bot 账户并复制 **bot token**。
  </Step>
  <Step title="复制 base URL">
    复制 Mattermost **base URL**（例如，`https://chat.example.com`）。
  </Step>
  <Step title="配置 OpenClaw 并启动 Gateway">
    最小配置：

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

  </Step>
</Steps>

## 原生 Slash 命令

原生 slash 命令为可选启用。启用后，OpenClaw 通过 Mattermost API 注册 `oc_*` slash 命令，并在 Gateway HTTP 服务器上接收回调 POST 请求。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 当 Mattermost 无法直接访问 Gateway 时使用（反向代理/公共 URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="行为说明">
    - `native: "auto"` 对 Mattermost 默认禁用。设置 `native: true` 以启用。
    - 如果省略 `callbackUrl`，OpenClaw 根据 Gateway 主机/端口 + `callbackPath` 派生。
    - 在多账户设置中，`commands` 可以在顶层或 `channels.mattermost.accounts.<id>.commands` 下设置（账户值覆盖顶层字段）。
    - 命令回调通过每个命令注册时 Mattermost 返回的 token 进行验证。
    - 当注册失败、启动不完整或回调 token 不匹配已注册命令时，slash 回调失败关闭。
  </Accordion>
  <Accordion title="可达性要求">
    回调端点必须可以从 Mattermost 服务器访问。

    - 除非 Mattermost 与 OpenClaw 在同一主机/网络命名空间上运行，否则不要将 `callbackUrl` 设置为 `localhost`。
    - 不要将 `callbackUrl` 设置为您的 Mattermost base URL，除非该 URL 将 `/api/channels/mattermost/command` 反向代理到 OpenClaw。
    - 快速检查：`curl https://<gateway-host>/api/channels/mattermost/command`；GET 应该从 OpenClaw 返回 `405 Method Not Allowed`，而不是 `404`。

  </Accordion>
  <Accordion title="Mattermost 出站 allowlist">
    如果您的回调目标是私有/tailnet/内部地址，请将 Mattermost 的 `ServiceSettings.AllowedUntrustedInternalConnections` 设置为包含回调主机/域。

    使用主机/域条目，而非完整 URL。

    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## 环境变量（默认账户）

如果您偏好使用环境变量，请在 Gateway 主机上设置这些变量：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
环境变量仅适用于**默认**账户（`default`）。其他账户必须使用配置值。

`MATTERMOST_URL` 不能从工作区 `.env` 设置；参见 [工作区 `.env` 文件](/gateway/security)。
</Note>

## 聊天模式

Mattermost 会自动响应私信。Channel 行为由 `chatmode` 控制：

<Tabs>
  <Tab title="oncall（默认）">
    仅在 Channel 中被 @提及时响应。
  </Tab>
  <Tab title="onmessage">
    响应每条 Channel 消息。
  </Tab>
  <Tab title="onchar">
    当消息以触发前缀开头时响应。
  </Tab>
</Tabs>

配置示例：

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

注意：

- `onchar` 仍会响应显式的 @提及。
- 对于旧配置，`channels.mattermost.requireMention` 仍然有效，但推荐使用 `chatmode`。

## 话题串和 Session

使用 `channels.mattermost.replyToMode` 控制 Channel 和群组回复是保留在主 Channel 中还是在触发帖子下开启话题串。

- `off`（默认）：仅在入站帖子已在话题串中时才在话题串中回复。
- `first`：对于顶级 Channel/群组帖子，在该帖子下开启话题串并将对话路由到话题串范围的 Session。
- `all`：目前与 `first` 行为相同。
- 私信忽略此设置，保持无话题串状态。

配置示例：

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

注意：

- 话题串范围的 Session 使用触发帖子 id 作为话题串根。
- `first` 和 `all` 目前等效，因为一旦 Mattermost 有了话题串根，后续的分块和媒体都在同一个话题串中继续。

## 访问控制（私信）

- 默认：`channels.mattermost.dmPolicy = "pairing"`（未知发送者会获得配对码）。
- 批准方式：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`。

## Channel（群组）

- 默认：`channels.mattermost.groupPolicy = "allowlist"`（需提及才能触发）。
- 使用 `channels.mattermost.groupAllowFrom` 将发送者加入 allowlist（推荐使用用户 ID）。
- 每 Channel 提及覆盖位于 `channels.mattermost.groups.<channelId>.requireMention` 下，或使用 `channels.mattermost.groups["*"].requireMention` 设置默认值。
- `@username` 匹配是可变的，仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 公开 Channel：`channels.mattermost.groupPolicy="open"`（需提及才能触发）。
- 运行时注意：如果完全没有 `channels.mattermost` 块，运行时群组策略回退为 `allowlist`（即使设置了 `channels.defaults.groupPolicy`）。

示例：

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## 出站投递目标

在使用 `openclaw message send` 或 cron/webhooks 时，使用以下目标格式：

- `channel:<id>` 用于 Channel
- `user:<id>` 用于私信
- `@username` 用于私信（通过 Mattermost API 解析）

<Warning>
裸的不透明 ID（如 `64ifufp...`）在 Mattermost 中是**模糊的**（用户 ID 与 Channel ID）。

OpenClaw 按**用户优先**解析：

- 如果该 ID 作为用户存在（`GET /api/v4/users/<id>` 成功），OpenClaw 通过 `/api/v4/channels/direct` 解析直接 Channel 来发送**私信**。
- 否则该 ID 被视为 **Channel ID**。

如果您需要确定性行为，请始终使用明确的前缀（`user:<id>` / `channel:<id>`）。
</Warning>

## 私信 Channel 重试

当 OpenClaw 向 Mattermost 私信目标发送消息且需要先解析直接 Channel 时，默认情况下会重试临时的直接 Channel 创建失败。

使用 `channels.mattermost.dmChannelRetry` 为 Mattermost 插件全局调整该行为，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 针对单个账户调整。

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

注意：

- 这仅适用于私信 Channel 创建（`/api/v4/channels/direct`），而非每个 Mattermost API 调用。
- 重试适用于临时故障，如速率限制、5xx 响应以及网络或超时错误。
- 除 `429` 以外的 4xx 客户端错误被视为永久错误，不会重试。

## 预览流式传输

Mattermost 将思考过程、工具活动和部分回复文本流式传输到单个**草稿预览帖子**中，当最终答案可以安全发送时就地完成。预览在同一帖子 id 上更新，而不是向 Channel 发送每个分块的消息。媒体/错误最终答案取消待处理的预览编辑，并使用正常传递而非刷新临时预览帖子。

通过 `channels.mattermost.streaming` 启用：

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="流式传输模式">
    - `partial` 是常用选择：一个预览帖子，随着回复增长被编辑，然后以完整答案完成。
    - `block` 在预览帖子内使用追加式草稿分块。
    - `progress` 在生成时显示状态预览，仅在完成时发布最终答案。
    - `off` 禁用预览流式传输。
  </Accordion>
  <Accordion title="流式传输行为说明">
    - 如果流式传输无法就地完成（例如帖子在流式传输过程中被删除），OpenClaw 回退到发送新的最终帖子，确保回复不会丢失。
    - 纯推理载荷被从 Channel 帖子中抑制，包括以 `> Reasoning:` 引用块形式到达的文本。设置 `/reasoning on` 可在其他界面查看思考过程；Mattermost 最终帖子只保留答案。
    - 参见 [Streaming](/concepts/streaming#preview-streaming-modes) 了解 Channel 映射矩阵。
  </Accordion>
</AccordionGroup>

## Reactions（message 工具）

- 使用 `message action=react` 配合 `channel=mattermost`。
- `messageId` 是 Mattermost post id。
- `emoji` 接受 `thumbsup` 或 `:+1:` 等名称（冒号可选）。
- 设置 `remove=true`（布尔值）以移除 reaction。
- Reaction 添加/移除事件作为系统事件转发到路由的 Agent Session。

示例：

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用/禁用 reaction 操作（默认 true）。
- 每账户覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 交互按钮（message 工具）

发送带有可点击按钮的消息。当用户点击按钮时，Agent 收到所选内容并可以响应。

通过在 Channel 功能中添加 `inlineButtons` 来启用按钮：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

使用带有 `buttons` 参数的 `message action=send`。按钮是二维数组（按钮的行）：

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

按钮字段：

<ParamField path="text" type="string" required>
  显示标签。
</ParamField>
<ParamField path="callback_data" type="string" required>
  点击时返回的值（用作操作 ID）。
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  按钮样式。
</ParamField>

当用户点击按钮时：

<Steps>
  <Step title="按钮被替换为确认行">
    所有按钮被替换为确认行（例如 "✓ **Yes** selected by @user"）。
  </Step>
  <Step title="Agent 收到所选内容">
    Agent 收到所选内容作为入站消息并响应。
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="实现说明">
    - 按钮回调使用 HMAC-SHA256 验证（自动，无需配置）。
    - Mattermost 从其 API 响应中剥离回调数据（安全功能），因此点击时所有按钮都会被移除——不可能只移除部分按钮。
    - 包含连字符或下划线的操作 ID 会自动清理（Mattermost 路由限制）。
  </Accordion>
  <Accordion title="配置和可达性">
    - `channels.mattermost.capabilities`：功能字符串数组。添加 `"inlineButtons"` 以在 Agent 系统提示中启用按钮工具描述。
    - `channels.mattermost.interactions.callbackBaseUrl`：按钮回调的可选外部基础 URL（例如 `https://gateway.example.com`）。当 Mattermost 无法直接访问 Gateway 绑定主机时使用。
    - 在多账户设置中，也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置同一字段。
    - 如果省略 `interactions.callbackBaseUrl`，OpenClaw 从 `gateway.customBindHost` + `gateway.port` 派生回调 URL，然后回退到 `http://localhost:<port>`。
    - 可达性规则：按钮回调 URL 必须可以从 Mattermost 服务器访问。仅当 Mattermost 和 OpenClaw 在同一主机/网络命名空间上运行时，`localhost` 才有效。
    - 如果您的回调目标是私有/tailnet/内部地址，请将其主机/域添加到 Mattermost 的 `ServiceSettings.AllowedUntrustedInternalConnections`。
  </Accordion>
</AccordionGroup>

### 直接 API 集成（外部脚本）

外部脚本和 Webhook 可以直接通过 Mattermost REST API 发布按钮，而不是通过 Agent 的 `message` 工具。尽量使用扩展中的 `buildButtonAttachments()`；如果发布原始 JSON，请遵循以下规则：

**载荷结构：**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // 仅字母数字——见下文
            type: "button", // 必需，否则点击被静默忽略
            name: "Approve", // 显示标签
            style: "primary", // 可选："default"、"primary"、"danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // 必须与按钮 id 匹配（用于名称查找）
                action: "approve",
                // ... 任何自定义字段 ...
                _token: "<hmac>", // 见下方 HMAC 部分
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**关键规则**

1. 附件放在 `props.attachments` 中，而不是顶级 `attachments`（静默忽略）。
2. 每个操作需要 `type: "button"`——没有它，点击被静默吞掉。
3. 每个操作需要 `id` 字段——Mattermost 忽略没有 ID 的操作。
4. 操作 `id` 必须**仅包含字母数字字符**（`[a-zA-Z0-9]`）。连字符和下划线会破坏 Mattermost 服务器端的操作路由（返回 404）。使用前请剥离。
5. `context.action_id` 必须与按钮的 `id` 匹配，以便确认消息显示按钮名称（例如 "Approve"）而不是原始 ID。
6. `context.action_id` 是必需的——没有它，交互处理程序返回 400。
</Warning>

**HMAC token 生成**

Gateway 使用 HMAC-SHA256 验证按钮点击。外部脚本必须生成与 Gateway 验证逻辑匹配的 token：

<Steps>
  <Step title="从 bot token 派生密钥">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="构建 context 对象">
    构建**不含** `_token` 的所有字段的 context 对象。
  </Step>
  <Step title="使用排序键序列化">
    使用**排序键**和**无空格**序列化（Gateway 使用带排序键的 `JSON.stringify`，产生紧凑输出）。
  </Step>
  <Step title="签名载荷">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="添加 token">
    将得到的十六进制摘要添加为 context 中的 `_token`。
  </Step>
</Steps>

Python 示例：

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="常见 HMAC 陷阱">
    - Python 的 `json.dumps` 默认添加空格（`{"key": "val"}`）。使用 `separators=(",", ":")` 匹配 JavaScript 的紧凑输出（`{"key":"val"}`）。
    - 始终签名**所有** context 字段（减去 `_token`）。Gateway 剥离 `_token` 后签名其余所有内容。签名子集会导致静默验证失败。
    - 使用 `sort_keys=True`——Gateway 在签名前排序键，Mattermost 在存储载荷时可能重新排序 context 字段。
    - 从 bot token 派生密钥（确定性），而不是随机字节。密钥在创建按钮的进程和验证的 Gateway 之间必须相同。
  </Accordion>
</AccordionGroup>

## 目录适配器

Mattermost 插件包含一个目录适配器，通过 Mattermost API 解析 Channel 和用户名称。这使 `openclaw message send` 和 cron/webhook 投递中的 `#channel-name` 和 `@username` 目标成为可能。

无需配置——适配器使用账户配置中的 bot token。

## 多账户

Mattermost 支持在 `channels.mattermost.accounts` 下配置多个账户：

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## 故障排除

<AccordionGroup>
  <Accordion title="Channel 中无回复">
    确保 bot 在 Channel 中并提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
  </Accordion>
  <Accordion title="认证或多账户错误">
    - 检查 bot token、base URL 以及账户是否已启用。
    - 多账户问题：环境变量仅适用于 `default` 账户。
  </Accordion>
  <Accordion title="原生 slash 命令失败">
    - `Unauthorized: invalid command token.`：OpenClaw 未接受回调 token。常见原因：
      - slash 命令注册失败或启动时仅部分完成
      - 回调命中了错误的 gateway/账户
      - Mattermost 仍有指向旧回调目标的旧命令
      - gateway 重启后未重新激活 slash 命令
    - 如果原生 slash 命令停止工作，检查日志中是否有 `mattermost: failed to register slash commands` 或 `mattermost: native slash commands enabled but no commands could be registered`。
    - 如果省略了 `callbackUrl` 且日志警告回调解析为 `http://127.0.0.1:18789/...`，该 URL 可能只在 Mattermost 与 OpenClaw 在同一主机/网络命名空间运行时才可访问。请改为设置显式的外部可访问 `commands.callbackUrl`。
  </Accordion>
  <Accordion title="按钮问题">
    - 按钮显示为白色方块：Agent 可能发送了格式错误的按钮数据。检查每个按钮是否同时具有 `text` 和 `callback_data` 字段。
    - 按钮渲染但点击无效：验证 Mattermost 服务器配置中 `AllowedUntrustedInternalConnections` 包含 `127.0.0.1 localhost`，以及 `ServiceSettings` 中的 `EnablePostActionIntegration` 为 `true`。
    - 按钮点击返回 404：按钮 `id` 可能包含连字符或下划线。Mattermost 的操作路由器在非字母数字 ID 上会中断。仅使用 `[a-zA-Z0-9]`。
    - Gateway 日志显示 `invalid _token`：HMAC 不匹配。检查您是否签名了所有 context 字段（不是子集），使用了排序键，并使用了紧凑 JSON（无空格）。参见上方 HMAC 部分。
    - Gateway 日志显示 `missing _token in context`：`_token` 字段不在按钮的 context 中。构建集成载荷时确保包含它。
    - 确认显示原始 ID 而非按钮名称：`context.action_id` 与按钮的 `id` 不匹配。将两者设置为相同的清理后值。
    - Agent 不知道按钮：在 Mattermost Channel 配置中添加 `capabilities: ["inlineButtons"]`。
  </Accordion>
</AccordionGroup>

## 相关

- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Channels 概述](/channels) — 所有支持的 Channels
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Security](/gateway/security) — 访问模型和安全加固
