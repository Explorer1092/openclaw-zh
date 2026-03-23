---
mmh3_hash: "6b76ea3236f8e752d397ec6953fcbe79"
title: "Synology Chat"
summary: "Synology Chat webhook 设置与 OpenClaw 配置"
read_when:
  - 使用 OpenClaw 配置 Synology Chat
  - 调试 Synology Chat webhook 路由问题
---

# Synology Chat（插件）

状态：通过插件支持，作为使用 Synology Chat webhook 的私信 Channel。
该插件接受来自 Synology Chat 外发 webhook 的入站消息，并通过 Synology Chat 传入 webhook 发送回复。

## 需要插件

Synology Chat 基于插件运行，不属于默认核心 Channel 安装。

从本地检出安装：

```bash
openclaw plugins install ./extensions/synology-chat
```

详情：[插件](/tools/plugin)

## 快速设置

1. 安装并启用 Synology Chat 插件。
   - `openclaw onboard` 现在会在 Channel 设置列表中显示 Synology Chat，与 `openclaw channels add` 相同。
   - 非交互式设置：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. 在 Synology Chat 集成中：
   - 创建一个传入 webhook 并复制其 URL。
   - 创建一个带有密钥令牌的外发 webhook。
3. 将外发 webhook URL 指向你的 OpenClaw Gateway：
   - 默认为 `https://gateway-host/webhook/synology`。
   - 或自定义的 `channels.synology-chat.webhookPath`。
4. 在 OpenClaw 中完成设置。
   - 引导式：`openclaw onboard`
   - 直接：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. 重启 Gateway 并向 Synology Chat 机器人发送私信。

最小配置：

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## 环境变量

对于默认账户，可以使用以下环境变量：

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（逗号分隔）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

配置值会覆盖环境变量。

## 私信策略与访问控制

- `dmPolicy: "allowlist"` 是推荐的默认设置。
- `allowedUserIds` 接受 Synology 用户 ID 的列表（或逗号分隔的字符串）。
- 在 `allowlist` 模式下，空的 `allowedUserIds` 列表被视为配置错误，webhook 路由将不会启动（使用 `dmPolicy: "open"` 允许所有人）。
- `dmPolicy: "open"` 允许任何发送者。
- `dmPolicy: "disabled"` 阻止私信。
- 回复接收者绑定默认使用稳定的数字 `user_id`。`channels.synology-chat.dangerouslyAllowNameMatching: true` 是一个应急兼容模式，重新启用可变用户名/昵称查找用于回复投递。
- 配对审批方式：
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 外发消息

使用 Synology Chat 数字用户 ID 作为目标。

示例：

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

支持通过基于 URL 的文件传递发送媒体。

## 多账户

支持在 `channels.synology-chat.accounts` 下配置多个 Synology Chat 账户。
每个账户可以覆盖 token、传入 URL、webhook 路径、私信策略和限制。
私信会话按账户和用户隔离，因此两个不同 Synology 账户上相同的数字 `user_id` 不共享对话状态。
为每个已启用的账户设置不同的 `webhookPath`。OpenClaw 现在会拒绝重复的精确路径，并拒绝在多账户设置中仅继承共享 webhook 路径的命名账户启动。
如果您明确需要命名账户的旧版继承行为，请在该账户或 `channels.synology-chat` 上设置 `dangerouslyAllowInheritedWebhookPath: true`，但重复的精确路径仍会被拒绝（失败关闭）。优先使用明确的每账户路径。

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## 安全说明

- 保持 `token` 机密，泄露后及时轮换。
- 除非明确信任自签名的本地 NAS 证书，否则保持 `allowInsecureSsl: false`。
- 入站 webhook 请求经过 token 验证，并按发送者限速。
- 生产环境推荐使用 `dmPolicy: "allowlist"`。
- 除非明确需要旧版基于用户名的回复投递，否则保持 `dangerouslyAllowNameMatching` 关闭。
- 除非明确接受多账户设置中的共享路径路由风险，否则保持 `dangerouslyAllowInheritedWebhookPath` 关闭。
