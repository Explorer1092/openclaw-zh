---
mmh3_hash: "6bf93a9eb32a9aac2f0c2320ec5b3017"
summary: "配对概述：批准谁可以私信您 + 哪些节点可以加入"
read_when:
  - 设置 DM 访问控制
  - 配对新的 iOS/Android 节点
  - 审查 OpenClaw 安全态势
title: "Pairing"
---

"配对"是 OpenClaw 的显式访问批准步骤。它用于两个地方：

1. **DM 配对**（谁被允许与 bot 交谈）
2. **节点配对**（哪些设备/节点被允许加入 Gateway 网络）

安全上下文：[Security](/gateway/security)

## 1) DM 配对（入站聊天访问）

当 Channel 配置为 DM 策略 `pairing` 时，未知发送者获得一个短代码，并且在您批准之前他们的消息**不会被处理**。

默认 DM 策略记录在：[Security](/gateway/security)

`dmPolicy: "open"` 仅在有效 DM 白名单包含 `"*"` 时才是公开的。
设置和验证要求公开配置的通配符。如果现有
状态包含带有具体 `allowFrom` 条目的 `open`，运行时仍然只允许
那些发送者，配对存储批准不会扩展 `open` 访问。

配对码：

- 8 个字符，大写，无歧义字符（`0O1I`）。
- **1 小时后过期**。Bot 仅在创建新请求时发送配对消息（每个发送者大约每小时一次）。
- 待处理的 DM 配对请求默认上限为每个 Channel **3 个**；额外的请求会被忽略，直到其中一个过期或被批准。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

如果尚未配置命令所有者，批准 DM 配对码也会将
`commands.ownerAllowFrom` 引导至已批准的发送者，例如 `telegram:123456789`。
这为首次设置提供了一个用于特权命令和执行
批准提示的显式所有者。所有者存在后，后续配对批准只授予私信
访问权限；它们不会添加更多所有者。

支持的 Channel：`discord`、`feishu`、`googlechat`、`imessage`、`irc`、`line`、`matrix`、`mattermost`、`msteams`、`nextcloud-talk`、`nostr`、`openclaw-weixin`、`signal`、`slack`、`synology-chat`、`telegram`、`twitch`、`whatsapp`、`zalo`、`zalouser`。

### 可复用发送者组

当相同的受信任发送者集应应用于
多个消息 Channel 或同时应用于私信和群组白名单时，使用顶级 `accessGroups`。

静态组使用 `type: "message.senders"` 并从 Channel 白名单中以
`accessGroup:<name>` 引用：

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
- 已批准白名单存储：
  - 默认账户：`<channel>-allowFrom.json`
  - 非默认账户：`<channel>-<accountId>-allowFrom.json`

账户范围行为：

- 非默认账户只读/写其范围内的白名单文件。
- 默认账户使用 Channel 范围的未范围白名单文件。

将这些视为敏感文件（它们控制对您助手的访问）。

<Note>
配对白名单存储用于私信访问。群组授权是分开的。
批准私信配对码不会自动允许该发送者运行群组
命令或在群组中控制 bot。首次所有者引导是 `commands.ownerAllowFrom` 中的单独配置
状态，群组聊天投递仍然遵循 Channel 的群组白名单（例如
`groupAllowFrom`、`groups`、或根据 Channel 的每群组或每主题覆盖）。
</Note>

## 2) 节点设备配对（iOS/Android/macOS/无头节点）

节点以 `role: node` 作为**设备**连接到 Gateway。Gateway
创建一个必须批准的设备配对请求。

### 通过 Telegram 配对（iOS 推荐）

如果您使用 `device-pair` Plugin，可以完全通过 Telegram 进行首次设备配对：

1. 在 Telegram 中，给您的 bot 发消息：`/pair`
2. Bot 回复两条消息：一条说明消息和一条单独的**设置码**消息（在 Telegram 中易于复制/粘贴）。
3. 在您的手机上，打开 OpenClaw iOS 应用 → 设置 → Gateway。
4. 扫描二维码或粘贴设置码并连接。
5. 返回 Telegram：`/pair pending`（查看请求 ID、角色和权限范围），然后批准。

设置码是一个 base64 编码的 JSON 载荷，包含：

- `url`：Gateway WebSocket URL（`ws://...` 或 `wss://...`）
- `bootstrapToken`：用于初始配对握手的短期单设备引导 token

该引导 token 携带内置的配对引导配置：

- 主要移交的 `node` token 保持 `scopes: []`
- 任何移交的 `operator` token 保持有界于引导白名单：
  `operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`
- 引导范围检查带有角色前缀，不是一个扁平的范围池：
  operator 范围条目只满足 operator 请求，非 operator 角色
  仍必须在其自己的角色前缀下请求范围
- 后续 token 轮换/撤销仍然受设备已批准的
  角色合同和调用者 Session 的 operator 范围两者约束

在有效期内，将设置码视为密码。

对于 Tailscale、公共或其他远程移动配对，使用 Tailscale Serve/Funnel
或另一个 `wss://` Gateway URL。明文 `ws://` 设置码只被
环回、私有 LAN 地址、`.local` Bonjour 主机和 Android
模拟器主机接受。Tailnet CGNAT 地址、`.ts.net` 名称和公共主机在二维码/设置码发行之前仍然失败关闭。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

当因为批准配对设备 Session 以仅配对范围打开而明确批准被拒绝时，
CLI 以 `operator.admin` 重试相同的请求。这让现有的具有管理员能力的配对设备
可以恢复新的控制 UI/浏览器配对，而无需手动编辑 `devices/paired.json`。
Gateway 仍然验证重试的连接；无法以 `operator.admin` 认证的 token 仍然被阻止。

如果同一设备以不同的身份验证详情重试（例如不同的
角色/范围/公钥），之前的待处理请求将被替换，并创建新的 `requestId`。

<Note>
已配对的设备不会静默获得更广泛的访问权限。如果它重新连接并请求更多范围或更广泛的角色，OpenClaw 保持现有批准不变并创建新的待处理升级请求。在批准之前，使用 `openclaw devices list` 比较当前已批准的访问与新请求的访问。
</Note>

### 可选的受信任 CIDR 节点自动批准

设备配对默认保持手动。对于严格控制的节点网络，
您可以通过显式 CIDR 或精确 IP 选择加入首次节点自动批准：

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

这仅适用于没有请求范围的新 `role: node` 配对请求。
Operator、浏览器、控制 UI 和 WebChat 客户端仍然需要手动批准。
角色、范围、元数据和公钥更改仍然需要手动批准。

### 节点配对状态存储

存储在 `~/.openclaw/devices/` 下：

- `pending.json`（短期的；待处理请求会过期）
- `paired.json`（已配对设备 + token）

### 说明

- 旧版 `node.pair.*` API（CLI：`openclaw nodes pending|approve|reject|remove|rename`）是
  一个单独的 Gateway 拥有的配对存储。WS 节点仍然需要设备配对。
- 配对记录是已批准角色的持久事实来源。活跃的
  设备 token 保持有界于该已批准的角色集；批准角色之外的杂散 token 条目
  不会创建新的访问。

## 相关文档

- 安全模型 + 提示注入：[Security](/gateway/security)
- 安全更新（运行 doctor）：[Updating](/install/updating)
- Channel 配置：
  - Telegram：[Telegram](/channels/telegram)
  - WhatsApp：[WhatsApp](/channels/whatsapp)
  - Signal：[Signal](/channels/signal)
  - iMessage：[iMessage](/channels/imessage)
  - Discord：[Discord](/channels/discord)
  - Slack：[Slack](/channels/slack)
