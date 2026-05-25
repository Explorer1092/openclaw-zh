---
mmh3_hash: "ced6deabc856b9ebeb49bd60b4760767"
summary: "配对概述：批准谁可以私信您 + 哪些节点可以加入"
read_when:
  - 设置私信访问控制
  - 配对新的 iOS/Android 节点
  - 审查 OpenClaw 安全状态
title: "Pairing"
---

"配对"是 OpenClaw 的显式访问批准步骤。
它用于两个地方：

1. **私信配对**（谁被允许与机器人通信）
2. **节点配对**（哪些设备/节点被允许加入 Gateway 网络）

安全上下文：[Security](/gateway/security)

## 1) 私信配对（入站聊天访问）

当 Channel 配置了私信策略 `pairing` 时，未知发送者会收到一个短码，并且他们的消息**不会被处理**，直到您批准为止。

默认私信策略记录在：[Security](/gateway/security)

`dmPolicy: "open"` 仅在有效私信 allowlist 包含 `"*"` 时才是公开的。设置和验证需要通配符才能进行公开配置。如果现有状态包含带有具体 `allowFrom` 条目的 `open`，运行时仍然只允许这些发送者，配对存储批准不会扩展 `open` 访问。

配对码：

- 8 个字符，大写，无歧义字符（`0O1I`）。
- **1 小时后过期**。机器人仅在创建新请求时才发送配对消息（每个发送者大约每小时一次）。
- 待处理的私信配对请求默认每个 Channel **上限为 3 个**；在一个过期或被批准之前，其他请求将被忽略。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未配置命令所有者，批准私信配对码也会将 `commands.ownerAllowFrom` 引导到已批准的发送者，例如 `telegram:123456789`。这为首次设置提供了用于特权命令和执行批准提示的显式所有者。所有者存在后，后续配对批准仅授予私信访问；不会添加更多所有者。

支持的 Channel：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可复用发送者组

当同一组可信发送者应适用于多个消息 Channel 或同时适用于私信和群组 allowlist 时，使用顶级 `accessGroups`。

静态组使用 `type: "message.senders"` 并从 Channel allowlist 中使用 `accessGroup:<name>` 引用：

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

访问组详细记录在：[访问组](/channels/access-groups)

### 状态存储位置

存储在 `~/.openclaw/credentials/` 下：

- 待处理请求：`<channel>-pairing.json`
- 已批准的 allowlist 存储：
  - 默认账户：`<channel>-allowFrom.json`
  - 非默认账户：`<channel>-<accountId>-allowFrom.json`

账户范围行为：

- 非默认账户仅读写其范围内的 allowlist 文件。
- 默认账户使用 Channel 范围的无范围 allowlist 文件。

将这些视为敏感信息（它们控制对您助手的访问）。

<Note>
配对 allowlist 存储用于私信访问。群组授权是独立的。批准私信配对码不会自动允许该发送者在群组中运行命令或控制机器人。首次所有者引导是 `commands.ownerAllowFrom` 中的独立配置状态，群聊传递仍遵循 Channel 的群组 allowlist（例如 `groupAllowFrom`、`groups` 或根据 Channel 的每群组或每话题覆盖）。
</Note>

## 2) 节点设备配对（iOS/Android/macOS/无头节点）

节点以 `role: node` 作为**设备**连接到 Gateway。Gateway 创建必须批准的设备配对请求。

### 通过 Telegram 配对（推荐用于 iOS）

如果您使用 `device-pair` Plugin，可以完全从 Telegram 完成首次设备配对：

1. 在 Telegram 中，向您的机器人发消息：`/pair`
2. 机器人回复两条消息：一条指令消息和一条单独的**设置码**消息（在 Telegram 中易于复制/粘贴）。
3. 在手机上，打开 OpenClaw iOS 应用 → 设置 → Gateway。
4. 扫描二维码或粘贴设置码并连接。
5. 返回 Telegram：`/pair pending`（查看请求 ID、角色和权限范围），然后批准。

设置码是包含以下内容的 base64 编码 JSON 负载：

- `url`：Gateway WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用于初始配对握手的短期单设备引导 Token

该引导 Token 携带内置配对引导配置：

- 内置设置配置仅允许新鲜的二维码/设置码基线：`node` 加上有限的 `operator` 移交
- 移交的 `node` Token 保持 `scopes: []`
- 移交的 `operator` Token 仅限于 `operator.approvals`、`operator.read` 和 `operator.write`
- `operator.admin` 和 `operator.pairing` 不通过二维码/设置码引导授予；需要单独批准的运维员配对或 Token 流程
- 后续 Token 轮换/撤销仍受设备已批准角色合约和调用者会话运维员权限范围的双重约束

在设置码有效期间，将其视为密码。

对于 Tailscale、公共或其他远程移动配对，使用 Tailscale Serve/Funnel 或其他 `wss://` Gateway URL。纯文本 `ws://` 设置码仅接受回环地址、私有 LAN 地址、`.local` Bonjour 主机和 Android 模拟器主机。Tailnet CGNAT 地址、`.ts.net` 名称和公共主机在发布二维码/设置码之前仍会失败关闭。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

当显式批准被拒绝（因为批准配对设备的会话是以仅配对范围打开的）时，CLI 使用 `operator.admin` 重试同一请求。这让现有管理员能力的已配对设备无需手动编辑 `devices/paired.json` 即可恢复新的 Control UI/浏览器配对。Gateway 仍然验证重试的连接；无法通过 `operator.admin` 认证的 Token 仍然被阻止。

如果同一设备使用不同的认证详情重试（例如不同的角色/权限范围/公钥），之前的待处理请求将被取代并创建新的 `requestId`。

<Note>
已配对设备不会静默获得更广泛的访问权限。如果它重新连接时请求更多权限范围或更广泛的角色，OpenClaw 保持现有批准不变并创建新的待处理升级请求。在批准之前，使用 `openclaw devices list` 比较当前已批准的访问和新请求的访问。
</Note>

### 可选的可信 CIDR 节点自动批准

设备配对默认是手动的。对于严格控制的节点网络，您可以通过显式 CIDR 或精确 IP 选择加入首次节点自动批准：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

这仅适用于没有请求权限范围的新 `role: node` 配对请求。运维员、浏览器、Control UI 和 WebChat 客户端仍然需要手动批准。角色、权限范围、元数据和公钥更改仍然需要手动批准。

### 节点配对状态存储

存储在 `~/.openclaw/devices/` 下：

- `pending.json`（短期；待处理请求会过期）
- `paired.json`（已配对设备 + Token）

### 注意事项

- 旧版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）是一个独立的 Gateway 拥有的配对存储。WS 节点仍然需要设备配对。
- 配对记录是已批准角色的持久事实来源。活动设备 Token 受限于该已批准的角色集；已批准角色之外的杂散 Token 条目不会创建新的访问。

## 相关文档

- 安全模型 + 提示注入：[Security](/gateway/security)
- 安全更新（运行 doctor）：[更新](/install/updating)
- Channel 配置：
  - Telegram：[Telegram](/channels/telegram)
  - WhatsApp：[WhatsApp](/channels/whatsapp)
  - Signal：[Signal](/channels/signal)
  - iMessage：[iMessage](/channels/imessage)
  - Discord：[Discord](/channels/discord)
  - Slack：[Slack](/channels/slack)
