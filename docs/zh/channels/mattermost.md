---
title: "Mattermost (插件)"
sidebarTitle: "Mattermost"
mmh3_hash: "98b7c2449b81e0ecc3909dbe912bb9a2"
summary: "Mattermost bot 设置和 OpenClaw 配置"
read_when:
  - 设置 Mattermost
  - 调试 Mattermost 路由
---

# Mattermost (插件)

状态：通过插件支持（bot token + WebSocket 事件）。支持 Channel、群组和私信。
Mattermost 是一个可自托管的团队消息平台；产品详情和下载请访问官方网站
[mattermost.com](https://mattermost.com)。

## 需要插件

Mattermost 作为插件提供，不包含在核心安装中。

通过 CLI 安装（npm registry）：

```bash
openclaw plugins install @openclaw/mattermost
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./extensions/mattermost
```

如果您在配置/引导过程中选择 Mattermost 且检测到 git 检出，
OpenClaw 会自动提供本地安装路径。

详情：[插件](/tools/plugin)

## 快速设置

1. 安装 Mattermost 插件。
2. 创建 Mattermost bot 账户并复制 **bot token**。
3. 复制 Mattermost **base URL**（例如，`https://chat.example.com`）。
4. 配置 OpenClaw 并启动 Gateway。

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

注意：

- `native: "auto"` 对 Mattermost 默认禁用。设置 `native: true` 以启用。
- 如果省略 `callbackUrl`，OpenClaw 根据 Gateway 主机/端口 + `callbackPath` 派生。
- 在多账户设置中，`commands` 可以在顶层或 `channels.mattermost.accounts.<id>.commands` 下设置（账户值覆盖顶层字段）。
- 命令回调通过每个命令的 token 进行验证，token 检查失败时失败关闭。
- 可达性要求：回调端点必须可以从 Mattermost 服务器访问。
  - 除非 Mattermost 与 OpenClaw 在同一主机/网络命名空间上运行，否则不要将 `callbackUrl` 设置为 `localhost`。
  - 不要将 `callbackUrl` 设置为您的 Mattermost base URL，除非该 URL 将 `/api/channels/mattermost/command` 反向代理到 OpenClaw。
  - 快速检查：`curl https://<gateway-host>/api/channels/mattermost/command`；GET 应该从 OpenClaw 返回 `405 Method Not Allowed`，而不是 `404`。
- Mattermost 出站 allowlist 要求：
  - 如果您的回调目标是私有/tailnet/内部地址，请将 Mattermost 的 `ServiceSettings.AllowedUntrustedInternalConnections` 设置为包含回调主机/域。
  - 使用主机/域条目，而非完整 URL。
    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

## 环境变量（默认账户）

如果您偏好使用环境变量，请在 Gateway 主机上设置这些变量：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

环境变量仅适用于**默认**账户（`default`）。其他账户必须使用配置值。

## 聊天模式

Mattermost 会自动响应私信。Channel 行为由 `chatmode` 控制：

- `oncall`（默认）：仅在 Channel 中被 @提及时响应。
- `onmessage`：响应每条 Channel 消息。
- `onchar`：当消息以触发前缀开头时响应。

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
- `@username` 匹配是可变的，仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 公开 Channel：`channels.mattermost.groupPolicy="open"`（需提及才能触发）。
- 运行时注意：如果完全没有 `channels.mattermost` 块，运行时群组策略回退为 `allowlist`（即使设置了 `channels.defaults.groupPolicy`）。

## 出站投递目标

在使用 `openclaw message send` 或 cron/webhooks 时，使用以下目标格式：

- `channel:<id>` 用于 Channel
- `user:<id>` 用于私信
- `@username` 用于私信（通过 Mattermost API 解析）

裸的不透明 ID（如 `64ifufp...`）在 Mattermost 中是**模糊的**（用户 ID 与 Channel ID）。

OpenClaw 按**用户优先**解析：

- 如果该 ID 作为用户存在（`GET /api/v4/users/<id>` 成功），OpenClaw 通过 `/api/v4/channels/direct` 解析直接 Channel 来发送**私信**。
- 否则该 ID 被视为 **Channel ID**。

如果您需要确定性行为，请始终使用明确的前缀（`user:<id>` / `channel:<id>`）。

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

- `text`（必需）：显示标签。
- `callback_data`（必需）：点击时返回的值（用作操作 ID）。
- `style`（可选）：`"default"`、`"primary"` 或 `"danger"`。

当用户点击按钮时：

1. 所有按钮被替换为确认行（例如 "✓ **Yes** selected by @user"）。
2. Agent 收到所选内容作为入站消息并响应。

注意：

- 按钮回调使用 HMAC-SHA256 验证（自动，无需配置）。
- Mattermost 从其 API 响应中剥离回调数据（安全功能），因此点击时所有按钮都会被移除——不可能只移除部分按钮。
- 包含连字符或下划线的操作 ID 会自动清理（Mattermost 路由限制）。

配置：

- `channels.mattermost.capabilities`：功能字符串数组。添加 `"inlineButtons"` 以在 Agent 系统提示中启用按钮工具描述。
- `channels.mattermost.interactions.callbackBaseUrl`：按钮回调的可选外部基础 URL（例如 `https://gateway.example.com`）。当 Mattermost 无法直接访问 Gateway 绑定主机时使用。
- 在多账户设置中，也可以在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置同一字段。
- 如果省略 `interactions.callbackBaseUrl`，OpenClaw 从 `gateway.customBindHost` + `gateway.port` 派生回调 URL，然后回退到 `http://localhost:<port>`。
- 可达性规则：按钮回调 URL 必须可以从 Mattermost 服务器访问。仅当 Mattermost 和 OpenClaw 在同一主机/网络命名空间上运行时，`localhost` 才有效。
- 如果您的回调目标是私有/tailnet/内部地址，请将其主机/域添加到 Mattermost 的 `ServiceSettings.AllowedUntrustedInternalConnections`。

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

**关键规则：**

1. 附件放在 `props.attachments` 中，而不是顶级 `attachments`（静默忽略）。
2. 每个操作需要 `type: "button"`——没有它，点击被静默吞掉。
3. 每个操作需要 `id` 字段——Mattermost 忽略没有 ID 的操作。
4. 操作 `id` 必须**仅包含字母数字字符**（`[a-zA-Z0-9]`）。连字符和下划线会破坏
   Mattermost 服务器端的操作路由（返回 404）。使用前请剥离。
5. `context.action_id` 必须与按钮的 `id` 匹配，以便确认消息显示按钮名称（例如 "Approve"）而不是原始 ID。
6. `context.action_id` 是必需的——没有它，交互处理程序返回 400。

**HMAC token 生成：**

Gateway 使用 HMAC-SHA256 验证按钮点击。外部脚本必须生成与 Gateway 验证逻辑匹配的 token：

1. 从 bot token 派生密钥：
   `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
2. 构建**不含** `_token` 的所有字段的 context 对象。
3. 使用**排序键**和**无空格**序列化（Gateway 使用带排序键的 `JSON.stringify`，产生紧凑输出）。
4. 签名：`HMAC-SHA256(key=secret, data=serializedContext)`
5. 将得到的十六进制摘要添加为 context 中的 `_token`。

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

常见 HMAC 陷阱：

- Python 的 `json.dumps` 默认添加空格（`{"key": "val"}`）。使用
  `separators=(",", ":")` 匹配 JavaScript 的紧凑输出（`{"key":"val"}`）。
- 始终签名**所有** context 字段（减去 `_token`）。Gateway 剥离 `_token` 后签名其余所有内容。签名子集会导致静默验证失败。
- 使用 `sort_keys=True`——Gateway 在签名前排序键，Mattermost 在存储载荷时可能重新排序 context 字段。
- 从 bot token 派生密钥（确定性），而不是随机字节。密钥在创建按钮的进程和验证的 Gateway 之间必须相同。

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

- Channel 中无回复：确保 bot 在 Channel 中并提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
- 认证错误：检查 bot token、base URL 以及账户是否已启用。
- 多账户问题：环境变量仅适用于 `default` 账户。
- 按钮显示为白色方块：Agent 可能发送了格式错误的按钮数据。检查每个按钮是否同时具有 `text` 和 `callback_data` 字段。
- 按钮渲染但点击无效：验证 Mattermost 服务器配置中 `AllowedUntrustedInternalConnections` 包含 `127.0.0.1 localhost`，以及 `ServiceSettings` 中的 `EnablePostActionIntegration` 为 `true`。
- 按钮点击返回 404：按钮 `id` 可能包含连字符或下划线。Mattermost 的操作路由器在非字母数字 ID 上会中断。仅使用 `[a-zA-Z0-9]`。
- Gateway 日志显示 `invalid _token`：HMAC 不匹配。检查您是否签名了所有 context 字段（不是子集），使用了排序键，并使用了紧凑 JSON（无空格）。参见上方 HMAC 部分。
- Gateway 日志显示 `missing _token in context`：`_token` 字段不在按钮的 context 中。构建集成载荷时确保包含它。
- 确认显示原始 ID 而非按钮名称：`context.action_id` 与按钮的 `id` 不匹配。将两者设置为相同的清理后值。
- Agent 不知道按钮：在 Mattermost Channel 配置中添加 `capabilities: ["inlineButtons"]`。
