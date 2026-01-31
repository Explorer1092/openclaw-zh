---
title: "配对"
mmh3_hash: "718eaa9f6f5e2ed5a9476b20d6f35ceb"
summary: "配对概览：批准谁可以私信你 + 哪些节点可以加入"
read_when:
  - 设置私信访问控制
  - 配对新的 iOS/Android 节点
  - 审查 OpenClaw 安全姿态
---

# 配对

“配对”是 OpenClaw 的显式 **所有者批准** 步骤。
它用在两个地方：

1) **私信配对** (谁被允许与机器人交谈)
2) **节点配对** (哪些设备/节点被允许加入网关网络)

安全上下文：[安全](/gateway/security)

## 1) 私信配对 (入站聊天访问)

当频道配置了私信策略 `pairing` 时，未知发送者会收到一个简短的代码，且他们的消息 **不会被处理**，直到你批准。

默认私信策略记录在：[安全](/gateway/security)

配对码：
- 8 个字符，大写，无歧义字符 (`0O1I`)。
- **1 小时后过期**。机器人仅在创建新请求时发送配对消息（每个发送者大约每小时一次）。
- 默认情况下，待处理的私信配对请求上限为 **每个频道 3 个**；额外的请求会被忽略，直到有一个过期或被批准。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

支持的频道：`telegram`, `whatsapp`, `signal`, `imessage`, `discord`, `slack`。

### 状态存储位置

存储在 `~/.openclaw/credentials/` 下：
- 待处理请求：`<channel>-pairing.json`
- 已批准白名单存储：`<channel>-allowFrom.json`

将这些视为敏感信息（它们控制着对你的助手的访问）。


## 2) 节点设备配对 (iOS/Android/macOS/无头节点)

节点作为带有 `role: node` 的 **设备** 连接到网关。网关创建一个必须被批准的设备配对请求。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

### 状态存储位置

存储在 `~/.openclaw/devices/` 下：
- `pending.json` (短寿命；待处理请求会过期)
- `paired.json` (已配对设备 + 令牌)

### 说明

- 旧版的 `node.pair.*` API (CLI: `openclaw nodes pending/approve`) 是一个独立的网关拥有的配对存储。WS 节点仍然需要设备配对。


## 相关文档

- 安全模型 + 提示注入：[安全](/gateway/security)
- 安全更新 (运行 doctor)：[更新](/install/updating)
- 频道配置：
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - iMessage: [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
