---
read_when:
  - 设置 Mattermost
  - 调试 Mattermost 路由
summary: Mattermost 机器人设置和 OpenClaw 配置
title: Mattermost
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: 02cd1541f664ef73a335938a8a2e98ea44cacbbd97b57dcc7be6bc1efcdedd54
  source_path: channels/mattermost.md
  workflow: 15
---

# Mattermost（插件）

状态：通过插件支持（bot token + WebSocket 事件）。支持频道、群组和私信。
Mattermost 是一个可自托管的团队消息平台；有关产品详情和下载，请访问官方网站
[mattermost.com](https://mattermost.com)。

## 需要插件

Mattermost 以插件形式提供，不包含在核心安装中。

通过 CLI 安装（npm 注册表）：

```bash
openclaw plugins install @openclaw/mattermost
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/mattermost-plugin
```

如果你在配置/新手引导期间选择 Mattermost 并检测到 git 检出，OpenClaw 会自动提供本地安装路径。

详情：[插件](/tools/plugin)

## 快速设置

1. 安装 Mattermost 插件。
2. 创建 Mattermost bot 账户并复制 **bot token**。
3. 复制 Mattermost **基础 URL**（例如 `https://chat.example.com`）。
4. 配置 OpenClaw 并启动 Gateway 网关。

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

## 原生斜杠命令

原生斜杠命令为可选功能。启用后，OpenClaw 通过 Mattermost API 注册 `oc_*` 斜杠命令，并在 Gateway 网关 HTTP 服务器上接收回调 POST。

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // 当 Mattermost 无法直接访问 Gateway 网关时使用（反向代理/公共 URL）。
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

注意事项：

- `native: "auto"` 对 Mattermost 默认禁用。设置 `native: true` 以启用。
- 如果省略 `callbackUrl`，OpenClaw 会从 gateway 主机/端口 + `callbackPath` 推导。
- 多账户配置中，`commands` 可在顶层或 `channels.mattermost.accounts.<id>.commands` 下设置（账户值覆盖顶层字段）。
- 命令回调使用每命令令牌进行验证，令牌检查失败时会安全拒绝。
- 可访问性要求：回调端点必须可从 Mattermost 服务器访问。
  - 除非 Mattermost 与 OpenClaw 在同一主机/网络命名空间运行，否则不要将 `callbackUrl` 设为 `localhost`。
  - 除非该 URL 将 `/api/channels/mattermost/command` 反向代理到 OpenClaw，否则不要将 `callbackUrl` 设为你的 Mattermost 基础 URL。
  - 快速检查：`curl https://<gateway-host>/api/channels/mattermost/command`；GET 应从 OpenClaw 返回 `405 Method Not Allowed`，而非 `404`。
- Mattermost 出站允许列表要求：
  - 如果回调目标为私有/tailnet/内网地址，请在 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` 中添加回调主机/域名。
  - 使用主机/域名条目，而非完整 URL。
    - 正确：`gateway.tailnet-name.ts.net`
    - 错误：`https://gateway.tailnet-name.ts.net`

## 环境变量（默认账户）

如果你偏好使用环境变量，请在 Gateway 网关主机上设置：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

环境变量仅适用于**默认**账户（`default`）。其他账户必须使用配置值。

## 聊天模式

Mattermost 自动响应私信。频道行为由 `chatmode` 控制：

- `oncall`（默认）：仅在频道中被 @提及时响应。
- `onmessage`：响应每条频道消息。
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

注意事项：

- `onchar` 仍会响应显式 @提及。
- `channels.mattermost.requireMention` 对旧配置仍然有效，但推荐使用 `chatmode`。

## 话题与会话

使用 `channels.mattermost.replyToMode` 控制频道和群组回复是保持在主频道中，还是在触发帖子下开启话题。

- `off`（默认）：仅在入站帖子已在话题中时才在话题中回复。
- `first`：对顶层频道/群组帖子，在该帖子下开启话题，并将会话路由到话题范围的会话。
- `all`：目前与 `first` 行为相同。
- 私信忽略此设置，始终不开启话题。

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

## 访问控制（私信）

- 默认：`channels.mattermost.dmPolicy = "pairing"`（未知发送者会收到配对码）。
- 通过以下方式批准：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`。

## 频道（群组）

- 默认：`channels.mattermost.groupPolicy = "allowlist"`（提及限制）。
- 使用 `channels.mattermost.groupAllowFrom` 将发送者加入允许列表（推荐使用用户 ID）。
- `@username` 匹配是可变的，仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 开放频道：`channels.mattermost.groupPolicy="open"`（提及限制）。
- 运行时说明：如果 `channels.mattermost` 完全缺失，运行时会回退到 `groupPolicy="allowlist"` 进行群组检查（即使 `channels.defaults.groupPolicy` 已设置）。

## 出站投递目标

在 `openclaw message send` 或 cron/webhooks 中使用这些目标格式：

- `channel:<id>` 用于频道
- `user:<id>` 用于私信
- `@username` 用于私信（通过 Mattermost API 解析）

裸 ID（如 `64ifufp...`）在 Mattermost 中是**不明确的**（用户 ID vs 频道 ID）。

OpenClaw 优先解析为用户：

- 如果该 ID 存在于用户中（`GET /api/v4/users/<id>` 成功），OpenClaw 通过 `/api/v4/channels/direct` 解析直接频道，发送**私信**。
- 否则，该 ID 被视为**频道 ID**。

为确保行为确定，始终使用显式前缀（`user:<id>` / `channel:<id>`）。

## 私信频道重试

当 OpenClaw 向 Mattermost 私信目标发送消息且需要先解析直接频道时，默认情况下会重试创建直接频道的瞬态失败。

使用 `channels.mattermost.dmChannelRetry` 全局调整该行为，或使用 `channels.mattermost.accounts.<id>.dmChannelRetry` 针对单个账户调整。

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

注意事项：

- 仅适用于私信频道创建（`/api/v4/channels/direct`），不适用于每个 Mattermost API 调用。
- 重试适用于速率限制、5xx 响应以及网络或超时等瞬态错误。
- `429` 以外的 4xx 客户端错误被视为永久错误，不会重试。

## 表情回应（消息工具）

- 使用 `message action=react` 配合 `channel=mattermost`。
- `messageId` 为 Mattermost 帖子 ID。
- `emoji` 接受 `thumbsup` 或 `:+1:` 等名称（冒号可选）。
- 设置 `remove=true`（布尔值）以移除回应。
- 回应添加/移除事件作为系统事件转发到路由的智能体会话。

示例：

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用/禁用回应操作（默认 true）。
- 账户级覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 交互按钮（消息工具）

发送带有可点击按钮的消息。用户点击按钮时，智能体会收到选择并可作出响应。

通过将 `inlineButtons` 添加到渠道功能来启用按钮：

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

使用带 `buttons` 参数的 `message action=send`。按钮为二维数组（按钮行）：

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

按钮字段：

- `text`（必填）：显示标签。
- `callback_data`（必填）：点击时发回的值（用作操作 ID）。
- `style`（可选）：`"default"`、`"primary"` 或 `"danger"`。

用户点击按钮时：

1. 所有按钮替换为确认行（例如 "✓ **Yes** selected by @user"）。
2. 智能体收到选择作为入站消息并作出响应。

注意事项：

- 按钮回调使用 HMAC-SHA256 验证（自动，无需配置）。
- Mattermost 会从其 API 响应中删除回调数据（安全特性），因此点击时所有按钮都会被移除——无法部分移除。
- 包含连字符或下划线的操作 ID 会自动清理（Mattermost 路由限制）。

配置：

- `channels.mattermost.capabilities`：功能字符串数组。添加 `"inlineButtons"` 以在智能体系统提示中启用按钮工具描述。
- `channels.mattermost.interactions.callbackBaseUrl`：按钮回调的可选外部基础 URL（例如 `https://gateway.example.com`）。当 Mattermost 无法直接访问 Gateway 网关绑定主机时使用。
- 在多账户配置中，也可在 `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl` 下设置。
- 如果省略 `interactions.callbackBaseUrl`，OpenClaw 从 `gateway.customBindHost` + `gateway.port` 推导回调 URL，然后回退到 `http://localhost:<port>`。
- 可访问性规则：按钮回调 URL 必须可从 Mattermost 服务器访问。`localhost` 仅在 Mattermost 和 OpenClaw 在同一主机/网络命名空间运行时有效。
- 如果回调目标为私有/tailnet/内网，请将其主机/域名添加到 Mattermost `ServiceSettings.AllowedUntrustedInternalConnections`。

## 目录适配器

Mattermost 插件包含一个目录适配器，通过 Mattermost API 解析频道和用户名称。这使得在 `openclaw message send` 和 cron/webhook 投递中可以使用 `#channel-name` 和 `@username` 目标。

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

- 频道中无回复：确保 bot 在频道中并提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
- 认证错误：检查 bot token、基础 URL 以及账户是否已启用。
- 多账户问题：环境变量仅适用于 `default` 账户。
- 按钮显示为白色框：智能体可能发送了格式错误的按钮数据。检查每个按钮是否都有 `text` 和 `callback_data` 字段。
- 按钮渲染正常但点击无效：验证 Mattermost 服务器配置中 `AllowedUntrustedInternalConnections` 包含 `127.0.0.1 localhost`，且 `EnablePostActionIntegration` 在 ServiceSettings 中为 `true`。
- 按钮点击返回 404：按钮 `id` 可能包含连字符或下划线。Mattermost 的操作路由对非字母数字 ID 会出错。仅使用 `[a-zA-Z0-9]`。
- Gateway 网关日志记录 `invalid _token`：HMAC 不匹配。检查是否对所有上下文字段（而非子集）进行签名，使用排序键，以及使用紧凑 JSON（无空格）。
- Gateway 网关日志记录 `missing _token in context`：按钮上下文中缺少 `_token` 字段。确保在构建集成负载时已包含该字段。
- 确认显示原始 ID 而非按钮名称：`context.action_id` 与按钮的 `id` 不匹配。将两者设置为相同的清理后值。
- 智能体不了解按钮：在 Mattermost 渠道配置中添加 `capabilities: ["inlineButtons"]`。
