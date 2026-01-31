---
title: "聊天频道"
sidebarTitle: "聊天频道"
mmh3_hash: "a31cf88a6d5a6d6fd2095e50eefdb199"
summary: "OpenClaw 可以连接的消息平台"
read_when: ["You want to choose a chat channel for OpenClaw","You need a quick overview of supported messaging platforms"]
---
# 聊天频道

OpenClaw 可以在你已经使用的任何聊天应用上与你对话。每个 channel 通过 Gateway 连接。
文本在所有平台都支持；媒体和反应功能因 channel 而异。

## 支持的 channels

- [WhatsApp](/channels/whatsapp) — 最流行；使用 Baileys 并需要二维码配对。
- [Telegram](/channels/telegram) — 通过 grammY 使用 Bot API；支持群组。
- [Discord](/channels/discord) — Discord Bot API + Gateway；支持服务器、频道和私信。
- [Slack](/channels/slack) — Bolt SDK；工作区应用。
- [Google Chat](/channels/googlechat) — 通过 HTTP webhook 使用 Google Chat API 应用。
- [Mattermost](/channels/mattermost) — Bot API + WebSocket；频道、群组、私信（插件，需单独安装）。
- [Signal](/channels/signal) — signal-cli；注重隐私。
- [BlueBubbles](/channels/bluebubbles) — **推荐用于 iMessage**；使用 BlueBubbles macOS 服务器 REST API，功能完整支持（编辑、撤回、效果、反应、群组管理 — 编辑功能目前在 macOS 26 Tahoe 上损坏）。
- [iMessage](/channels/imessage) — 仅限 macOS；通过 imsg 原生集成（旧版，新部署建议使用 BlueBubbles）。
- [Microsoft Teams](/channels/msteams) — Bot Framework；企业支持（插件，需单独安装）。
- [LINE](/channels/line) — LINE Messaging API bot（插件，需单独安装）。
- [Nextcloud Talk](/channels/nextcloud-talk) — 通过 Nextcloud Talk 自托管聊天（插件，需单独安装）。
- [Matrix](/channels/matrix) — Matrix 协议（插件，需单独安装）。
- [Nostr](/channels/nostr) — 通过 NIP-04 去中心化私信（插件，需单独安装）。
- [Tlon](/channels/tlon) — 基于 Urbit 的即时通讯（插件，需单独安装）。
- [Twitch](/channels/twitch) — 通过 IRC 连接的 Twitch 聊天（插件，需单独安装）。
- [Zalo](/channels/zalo) — Zalo Bot API；越南流行的即时通讯（插件，需单独安装）。
- [Zalo Personal](/channels/zalouser) — 通过二维码登录的 Zalo 个人账户（插件，需单独安装）。
- [WebChat](/web/webchat) — 通过 WebSocket 的 Gateway WebChat UI。

## 注意事项

- Channels 可以同时运行；配置多个后 OpenClaw 将按聊天路由。
- 最快的设置通常是 **Telegram**（简单的 bot token）。WhatsApp 需要二维码配对并且
  在磁盘上存储更多状态。
- 群组行为因 channel 而异；参见[群组](/concepts/groups)。
- 为安全起见会强制执行私信配对和白名单；参见[安全](/gateway/security)。
- Telegram 内部机制：[grammY 注释](/channels/grammy)。
- 故障排除：[Channel 故障排除](/channels/troubleshooting)。
- 模型提供商单独记录；参见[模型提供商](/providers/models)。
