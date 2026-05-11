---
mmh3_hash: "fe3623eae736b9fb8b8511a5f2eaf957"
summary: "OpenClaw 可以连接的消息平台"
read_when:
  - 选择 OpenClaw 的聊天 Channel
  - 需要支持的消息平台快速概览
title: "聊天 Channel"
---

OpenClaw 可以在你已经使用的任何聊天应用上与你对话。每个 Channel 通过 Gateway 连接。
文本在所有平台都支持；媒体和反应功能因 Channel 而异。

## 投递说明

- 包含 Markdown 图片语法（如 `![alt](url)`）的 Telegram 回复在可能的情况下会在最终出站路径上转换为媒体回复。
- Slack 多人私信作为群聊路由，因此群组策略、提及行为和群组 Session 规则适用于 MPIM 对话。
- WhatsApp 设置是按需安装的：在 Plugin 包安装之前，入门引导可以显示设置流程，并且 Gateway 只在 Channel 实际激活时才加载 WhatsApp 运行时。

## 支持的 Channel

- [Discord](/channels/discord) — Discord Bot API + Gateway；支持服务器、频道和私信。
- [Feishu](/channels/feishu) — 通过 WebSocket 的 Feishu/Lark bot（捆绑 Plugin）。
- [Google Chat](/channels/googlechat) — 通过 HTTP webhook 使用 Google Chat API 应用（可下载 Plugin）。
- [iMessage](/channels/imessage) — 通过已登录 Mac 上的 `imsg` 桥接进行原生 macOS 集成（或 Gateway 运行在其他位置时使用 SSH 包装器），包括用于回复、tapback、效果、附件和群组管理的私有 API 操作。适合在主机权限和 Messages 访问条件满足时的新 OpenClaw iMessage 设置。
- [IRC](/channels/irc) — 经典 IRC 服务器；频道 + 私信，具有配对/白名单控制。
- [LINE](/channels/line) — LINE Messaging API bot（可下载 Plugin）。
- [Matrix](/channels/matrix) — Matrix 协议（可下载 Plugin）。
- [Mattermost](/channels/mattermost) — Bot API + WebSocket；频道、群组、私信（可下载 Plugin）。
- [Microsoft Teams](/channels/msteams) — Bot Framework；企业支持（捆绑 Plugin）。
- [Nextcloud Talk](/channels/nextcloud-talk) — 通过 Nextcloud Talk 自托管聊天（捆绑 Plugin）。
- [Nostr](/channels/nostr) — 通过 NIP-04 去中心化私信（捆绑 Plugin）。
- [QQ Bot](/channels/qqbot) — QQ Bot API；私聊、群聊和丰富媒体（捆绑 Plugin）。
- [Signal](/channels/signal) — signal-cli；注重隐私。
- [Slack](/channels/slack) — Bolt SDK；工作区应用。
- [Synology Chat](/channels/synology-chat) — 通过 outgoing+incoming webhook 连接 Synology NAS Chat（捆绑 Plugin）。
- [Telegram](/channels/telegram) — 通过 grammY 使用 Bot API；支持群组。
- [Tlon](/channels/tlon) — 基于 Urbit 的即时通讯（捆绑 Plugin）。
- [Twitch](/channels/twitch) — 通过 IRC 连接的 Twitch 聊天（捆绑 Plugin）。
- [Voice Call](/plugins/voice-call) — 通过 Plivo 或 Twilio 的电话（Plugin，需单独安装）。
- [WebChat](/web/webchat) — 通过 WebSocket 的 Gateway WebChat UI。
- [WeChat](/channels/wechat) — 通过二维码登录的腾讯 iLink Bot Plugin；仅支持私聊（外部 Plugin）。
- [WhatsApp](/channels/whatsapp) — 最流行；使用 Baileys 并需要二维码配对。
- [元宝](/channels/yuanbao) — 腾讯元宝 bot（外部 Plugin）。
- [Zalo](/channels/zalo) — Zalo Bot API；越南流行的即时通讯（捆绑 Plugin）。
- [Zalo Personal](/channels/zalouser) — 通过二维码登录的 Zalo 个人账户（捆绑 Plugin）。

## 注意事项

- Channel 可以同时运行；配置多个后 OpenClaw 将按聊天路由。
- 最快的设置通常是 **Telegram**（简单的 bot token）。WhatsApp 需要二维码配对并且在磁盘上存储更多状态。
- 群组行为因 Channel 而异；参见 [Groups](/channels/groups)。
- 为安全起见会强制执行私信配对和白名单；参见 [Security](/gateway/security)。
- 故障排除：[Channel 故障排除](/channels/troubleshooting)。
- 模型 Provider 单独记录；参见[模型 Provider](/providers/models)。
