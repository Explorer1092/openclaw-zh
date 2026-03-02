---
title: "Mattermost (插件)"
sidebarTitle: "Mattermost"
mmh3_hash: "225b35823464218b6b0b14c06e12421d"
summary: "Mattermost bot 设置和 OpenClaw 配置"
read_when:
  - 设置 Mattermost
  - 调试 Mattermost 路由
---

# Mattermost (插件)

状态：通过插件支持（bot token + WebSocket 事件）。支持频道、群组和私信。
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

详情：[Plugins](/tools/plugin)

## 快速设置
1) 安装 Mattermost 插件。
2) 创建 Mattermost bot 账户并复制 **bot token**。
3) 复制 Mattermost **base URL**（例如，`https://chat.example.com`）。
4) 配置 OpenClaw 并启动 gateway。

最小配置：
```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing"
    }
  }
}
```

## 环境变量（默认账户）
如果您偏好使用环境变量，请在 gateway 主机上设置这些变量：

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

环境变量仅适用于**默认**账户（`default`）。其他账户必须使用配置值。

## 聊天模式
Mattermost 会自动响应私信。频道行为由 `chatmode` 控制：

- `oncall`（默认）：仅在频道中被 @提及时响应。
- `onmessage`：响应每条频道消息。
- `onchar`：当消息以触发前缀开头时响应。

配置示例：
```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"]
    }
  }
}
```

注意：
- `onchar` 仍会响应显式的 @提及。
- 对于旧配置，`channels.mattermost.requireMention` 仍然有效，但推荐使用 `chatmode`。

## 访问控制（私信）
- 默认：`channels.mattermost.dmPolicy = "pairing"`（未知发送者会获得配对码）。
- 批准方式：
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- 公开私信：`channels.mattermost.dmPolicy="open"` 加上 `channels.mattermost.allowFrom=["*"]`。

## 频道（群组）
- 默认：`channels.mattermost.groupPolicy = "allowlist"`（需提及才能触发）。
- 使用 `channels.mattermost.groupAllowFrom` 将发送者加入白名单（推荐使用用户 ID）。
- `@username` 匹配是可变的，仅在 `channels.mattermost.dangerouslyAllowNameMatching: true` 时启用。
- 公开频道：`channels.mattermost.groupPolicy="open"`（需提及才能触发）。
- 运行时注意：如果完全没有 `channels.mattermost` 块，运行时群组策略回退为 `allowlist`（即使设置了 `channels.defaults.groupPolicy`）。

## 出站投递目标
在使用 `openclaw message send` 或 cron/webhooks 时，使用以下目标格式：

- `channel:<id>` 用于频道
- `user:<id>` 用于私信
- `@username` 用于私信（通过 Mattermost API 解析）

单独的 ID 会被视为频道。

## Reactions（message 工具）

- 使用 `message action=react` 配合 `channel=mattermost`。
- `messageId` 是 Mattermost post id。
- `emoji` 接受 `thumbsup` 或 `:+1:` 等名称（冒号可选）。
- 设置 `remove=true`（布尔值）以移除 reaction。
- Reaction 添加/移除事件作为系统事件转发到路由的 agent 会话。

示例：

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

配置：

- `channels.mattermost.actions.reactions`：启用/禁用 reaction 操作（默认 true）。
- 每账户覆盖：`channels.mattermost.accounts.<id>.actions.reactions`。

## 多账户
Mattermost 支持在 `channels.mattermost.accounts` 下配置多个账户：

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" }
      }
    }
  }
}
```

## 故障排查
- 频道中无回复：确保 bot 在频道中并提及它（oncall），使用触发前缀（onchar），或设置 `chatmode: "onmessage"`。
- 认证错误：检查 bot token、base URL 以及账户是否已启用。
- 多账户问题：环境变量仅适用于 `default` 账户。
