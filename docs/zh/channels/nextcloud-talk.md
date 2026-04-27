---
mmh3_hash: "0577ae8566e2aa83a2903dd6213ce304"
summary: "Nextcloud Talk 支持状态、功能和配置"
read_when:
  - 开发 Nextcloud Talk Channel 功能
title: "Nextcloud Talk"
---

状态：内置插件（Webhook bot）。支持私信、聊天室、反应和 markdown 消息。

## 内置插件

Nextcloud Talk 在当前 OpenClaw 版本中作为内置插件提供，因此正常的打包构建无需单独安装。

如果您使用的是较旧的构建版本或不包含 Nextcloud Talk 的自定义安装，请手动安装：

通过 CLI 安装（npm registry）：

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

详情：[插件](/tools/plugin)

## 快速设置（入门）

1. 确保 Nextcloud Talk 插件可用。
   - 当前打包的 OpenClaw 版本已内置。
   - 较旧/自定义安装可使用上述命令手动添加。
2. 在您的 Nextcloud 服务器上创建一个 bot：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 在目标聊天室设置中启用该 bot。
4. 配置 OpenClaw：
   - 配置：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或环境变量：`NEXTCLOUD_TALK_BOT_SECRET`（仅默认账户）

   CLI 设置：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   等效的显式字段：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   文件支持的密钥：

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. 重启 Gateway（或完成初始化）。

最小配置：

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## 注意事项

- Bot 无法主动发起私信。用户必须先向 bot 发消息。
- Webhook URL 必须可被 Gateway 访问；如果在代理后面，请设置 `webhookPublicUrl`。
- Bot API 不支持媒体上传；媒体以 URL 形式发送。
- Webhook 载荷无法区分私信和聊天室；设置 `apiUser` + `apiPassword` 以启用聊天室类型查询（否则私信会被视为聊天室）。

## 访问控制（私信）

- 默认：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知发送者将获得配对码。
- 批准方式：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公开私信：`channels.nextcloud-talk.dmPolicy="open"` 加上 `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` 仅匹配 Nextcloud 用户 ID；显示名称被忽略。

## 聊天室（群组）

- 默认：`channels.nextcloud-talk.groupPolicy = "allowlist"`（需要提及）。
- 使用 `channels.nextcloud-talk.rooms` 将聊天室加入 allowlist：

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- 要禁止所有聊天室，保持 allowlist 为空或设置 `channels.nextcloud-talk.groupPolicy="disabled"`。

## 功能

| 功能       | 状态    |
| ---------- | ------- |
| 私信       | 支持    |
| 聊天室     | 支持    |
| 话题串     | 不支持  |
| 媒体       | 仅 URL  |
| 反应       | 支持    |
| 原生命令   | 不支持  |

## 配置参考（Nextcloud Talk）

完整配置：[配置](/gateway/configuration)

Provider 选项：

- `channels.nextcloud-talk.enabled`：启用/禁用 Channel 启动。
- `channels.nextcloud-talk.baseUrl`：Nextcloud 实例 URL。
- `channels.nextcloud-talk.botSecret`：bot 共享密钥。
- `channels.nextcloud-talk.botSecretFile`：密钥文件路径（普通文件）。符号链接会被拒绝。
- `channels.nextcloud-talk.apiUser`：用于聊天室查询的 API 用户（私信检测）。
- `channels.nextcloud-talk.apiPassword`：用于聊天室查询的 API/应用密码。
- `channels.nextcloud-talk.apiPasswordFile`：API 密码文件路径。
- `channels.nextcloud-talk.webhookPort`：Webhook 监听端口（默认：8788）。
- `channels.nextcloud-talk.webhookHost`：Webhook 主机（默认：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：Webhook 路径（默认：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：外部可访问的 Webhook URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`：私信 allowlist（用户 ID）。`open` 需要 `"*"`。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`：群组 allowlist（用户 ID）。
- `channels.nextcloud-talk.rooms`：每个聊天室的设置和 allowlist。
- `channels.nextcloud-talk.historyLimit`：群组历史记录限制（0 禁用）。
- `channels.nextcloud-talk.dmHistoryLimit`：私信历史记录限制（0 禁用）。
- `channels.nextcloud-talk.dms`：每个私信的覆盖设置（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`：出站文本块大小（字符）。
- `channels.nextcloud-talk.chunkMode`：`length`（默认）或 `newline`，在空白行（段落边界）处分割，然后再按长度分块。
- `channels.nextcloud-talk.blockStreaming`：为此 Channel 禁用块流式传输。
- `channels.nextcloud-talk.blockStreamingCoalesce`：块流式传输合并调优。
- `channels.nextcloud-talk.mediaMaxMb`：入站媒体上限（MB）。

## 相关

- [Channels 概述](/channels) — 所有支持的 Channels
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
