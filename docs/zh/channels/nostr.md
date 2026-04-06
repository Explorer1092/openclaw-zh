---
title: "Nostr"
mmh3_hash: "fc8715fadac943903f6b0da0cf913ac2"
summary: "通过 NIP-04 加密消息实现的 Nostr DM Channel"
read_when:
  - 您希望 OpenClaw 通过 Nostr 接收私信
  - 您正在设置去中心化消息传递
---

# Nostr

**状态：** 可选内置插件（配置前默认禁用）。

Nostr 是一个去中心化的社交网络协议。此 Channel 使 OpenClaw 能够通过 NIP-04 接收和回复加密的私信（DM）。

## 内置插件

当前 OpenClaw 版本将 Nostr 作为内置插件提供，因此正常的打包构建无需单独安装。

### 较旧/自定义安装

- 引导向导（`openclaw onboard`）和 `openclaw channels add` 仍会从共享 Channel 目录中列出 Nostr。
- 如果您的构建不包含内置 Nostr，请手动安装。

```bash
openclaw plugins install @openclaw/nostr
```

使用本地检出（开发工作流）：

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

安装或启用插件后需要重启 Gateway。

### 非交互式设置

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

使用 `--use-env` 将 `NOSTR_PRIVATE_KEY` 保留在环境变量中，而不是将密钥存储在配置中。

## 快速设置

1. 生成 Nostr 密钥对（如果需要）：

```bash
# 使用 nak
nak key generate
```

2. 添加到配置：

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. 导出密钥：

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. 重启 Gateway。

## 配置参考

| 键 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `privateKey` | string | 必填 | `nsec` 或十六进制格式的私钥 |
| `relays` | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | 中继 URL（WebSocket） |
| `dmPolicy` | string | `pairing` | DM 访问策略 |
| `allowFrom` | string[] | `[]` | 允许的发送者公钥 |
| `enabled` | boolean | `true` | 启用/禁用 Channel |
| `name` | string | - | 显示名称 |
| `profile` | object | - | NIP-01 个人资料元数据 |

## 个人资料元数据

个人资料数据作为 NIP-01 `kind:0` 事件发布。您可以从控制界面（Channel -> Nostr -> 个人资料）管理它，或直接在配置中设置。

示例：

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

注意：

- 个人资料 URL 必须使用 `https://`。
- 从中继导入会合并字段并保留本地覆盖。

## 访问控制

### DM 策略

- **pairing**（默认）：未知发送者获得配对码。
- **allowlist**：仅 `allowFrom` 中的公钥可以发送 DM。
- **open**：公开接收 DM（需要 `allowFrom: ["*"]`）。
- **disabled**：忽略入站 DM。

执行注意事项：

- 入站事件签名在发送者策略和 NIP-04 解密之前验证，因此伪造的事件会被提前拒绝。
- 配对回复在不处理原始 DM 内容的情况下发送。
- 入站 DM 有速率限制，解密前会丢弃超大载荷。

### Allowlist 示例

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## 密钥格式

接受的格式：

- **私钥：** `nsec...` 或 64 字符十六进制
- **公钥（`allowFrom`）：** `npub...` 或十六进制

## 中继

默认值：`relay.damus.io` 和 `nos.lol`。

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

提示：

- 使用 2-3 个中继以实现冗余。
- 避免使用过多中继（延迟、重复）。
- 付费中继可以提高可靠性。
- 本地中继适合测试（`ws://localhost:7777`）。

## 协议支持

| NIP | 状态 | 描述 |
| --- | --- | --- |
| NIP-01 | 已支持 | 基本事件格式 + 个人资料元数据 |
| NIP-04 | 已支持 | 加密 DM（`kind:4`） |
| NIP-17 | 计划中 | 礼品包装 DM |
| NIP-44 | 计划中 | 版本化加密 |

## 测试

### 本地中继

```bash
# 启动 strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### 手动测试

1. 从日志中记录 bot 公钥（npub）。
2. 打开 Nostr 客户端（Damus、Amethyst 等）。
3. 向 bot 公钥发送 DM。
4. 验证响应。

## 故障排除

### 未接收消息

- 验证私钥有效。
- 确保中继 URL 可访问并使用 `wss://`（本地使用 `ws://`）。
- 确认 `enabled` 不是 `false`。
- 检查 Gateway 日志中的中继连接错误。

### 未发送响应

- 检查中继是否接受写入。
- 验证出站连接。
- 注意中继速率限制。

### 重复响应

- 使用多个中继时这是正常现象。
- 消息通过事件 ID 去重；仅第一次传递触发响应。

## 安全性

- 永远不要提交私钥。
- 使用环境变量存储密钥。
- 生产环境的 bot 考虑使用 `allowlist`。
- 签名在发送者策略之前验证，发送者策略在解密之前执行，因此伪造的事件会被提前拒绝，未知发送者无法强制进行完整的加密工作。

## 限制（MVP）

- 仅支持私信（不支持群聊）。
- 不支持媒体附件。
- 仅支持 NIP-04（计划支持 NIP-17 礼品包装）。

## 相关

- [Channels 概述](/channels) — 所有支持的 Channels
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
