---
read_when:
  - 设置私信访问控制
  - 配对新的 iOS/Android 节点
  - 审查 OpenClaw 安全态势
summary: 配对概述：批准谁可以向你发送私信 + 哪些节点可以加入
title: 配对
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: 92a1dd972eaa344d67034bdc62ffe01fd297a97fa1a763a2dc9107e441bf0835
  source_path: channels/pairing.md
  workflow: 15
---

# 配对

"配对"是 OpenClaw 的显式**所有者批准**步骤。它用于两个地方：

1. **私信配对**（谁被允许与机器人对话）
2. **节点配对**（哪些设备/节点被允许加入 Gateway 网关网络）

安全上下文：[安全](/gateway/security)

## 1）私信配对（入站聊天访问）

当渠道配置为私信策略 `pairing` 时，未知发送者会收到一个短代码，他们的消息**不会被处理**，直到你批准。

默认私信策略记录在：[安全](/gateway/security)

配对代码：

- 8 个字符，大写，无歧义字符（`0O1I`）。
- **1 小时后过期**。机器人仅在创建新请求时发送配对消息（大约每个发送者每小时一次）。
- 待处理的私信配对请求默认上限为**每个渠道 3 个**；在一个过期或被批准之前，额外的请求将被忽略。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

支持的渠道：`bluebubbles`、`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 状态存储位置

存储在 `~/.openclaw/credentials/` 下：

- 待处理请求：`<channel>-pairing.json`
- 已批准允许列表存储：
  - 默认账户：`<channel>-allowFrom.json`
  - 非默认账户：`<channel>-<accountId>-allowFrom.json`

账户作用域行为：

- 非默认账户只读写其专属的带账户 ID 的允许列表文件。
- 默认账户使用渠道范围的无作用域允许列表文件。

将这些视为敏感信息（它们控制对你助手的访问）。

## 2）节点设备配对（iOS/Android/macOS/无头节点）

节点作为 `role: node` 的**设备**连接到 Gateway 网关。Gateway 网关创建一个必须被批准的设备配对请求。

### 通过 Telegram 配对（iOS 推荐方式）

如果你使用 `device-pair` 插件，可以完全从 Telegram 完成首次设备配对：

1. 在 Telegram 中向你的机器人发送：`/pair`
2. 机器人回复两条消息：一条说明消息和一条单独的**设置码**消息（在 Telegram 中便于复制/粘贴）。
3. 在手机上打开 OpenClaw iOS 应用 → 设置 → Gateway 网关。
4. 粘贴设置码并连接。
5. 返回 Telegram：`/pair pending`（查看请求 ID、角色和作用域），然后批准。

设置码是一个 base64 编码的 JSON 负载，包含：

- `url`：Gateway 网关 WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用于初始配对握手的短期单设备引导令牌

在有效期内请将设置码视为密码。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

### 状态存储位置

存储在 `~/.openclaw/devices/` 下：

- `pending.json`（短期；待处理请求会过期）
- `paired.json`（已配对设备 + 令牌）

### 说明

- 旧版 `node.pair.*` API（CLI：`openclaw nodes pending/approve`）是一个单独的 Gateway 网关拥有的配对存储。WS 节点仍然需要设备配对。

## 相关文档

- 安全模型 + 提示注入：[安全](/gateway/security)
- 安全更新（运行 doctor）：[更新](/install/updating)
- 渠道配置：
  - Telegram：[Telegram](/channels/telegram)
  - WhatsApp：[WhatsApp](/channels/whatsapp)
  - Signal：[Signal](/channels/signal)
  - BlueBubbles（iMessage）：[BlueBubbles](/channels/bluebubbles)
  - iMessage（旧版）：[iMessage](/channels/imessage)
  - Discord：[Discord](/channels/discord)
  - Slack：[Slack](/channels/slack)
