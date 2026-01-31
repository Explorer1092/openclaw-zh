---
mmh3_hash: "13785b47a1b930145a4bc8a7c620cf42"
summary: "Nextcloud Talk 支持状态、功能和配置"
read_when:
  - Working on Nextcloud Talk channel features
---
# Nextcloud Talk (插件)

状态：通过插件支持 (webhook bot)。支持私信、聊天室、反应和 markdown 消息。

## 需要插件
Nextcloud Talk 作为插件提供，不包含在核心安装中。

通过 CLI 安装 (npm registry)：
```bash
openclaw plugins install @openclaw/nextcloud-talk
```

本地检出安装 (从 git 仓库运行时)：
```bash
openclaw plugins install ./extensions/nextcloud-talk
```

如果您在配置/初始化过程中选择 Nextcloud Talk 且检测到 git 检出，
OpenClaw 将自动提供本地安装路径。

详情：[插件](/plugin)

## 快速设置 (入门)
1) 安装 Nextcloud Talk 插件。
2) 在您的 Nextcloud 服务器上创建一个 bot：
   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```
3) 在目标聊天室设置中启用该 bot。
4) 配置 OpenClaw：
   - 配置：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或环境变量：`NEXTCLOUD_TALK_BOT_SECRET` (仅默认账户)
5) 重启 gateway (或完成初始化)。

最小配置：
```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing"
    }
  }
}
```

## 注意事项
- Bot 无法主动发起私信。用户必须先向 bot 发消息。
- Webhook URL 必须可被 Gateway 访问；如果在代理后面，请设置 `webhookPublicUrl`。
- Bot API 不支持媒体上传；媒体以 URL 形式发送。
- Webhook 载荷无法区分私信和聊天室；设置 `apiUser` + `apiPassword` 以启用聊天室类型查询 (否则私信会被视为聊天室)。

## 访问控制 (私信)
- 默认：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知发送者将获得配对码。
- 批准方式：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公开私信：`channels.nextcloud-talk.dmPolicy="open"` 加上 `channels.nextcloud-talk.allowFrom=["*"]`。

## 聊天室 (群组)
- 默认：`channels.nextcloud-talk.groupPolicy = "allowlist"` (需要提及)。
- 使用 `channels.nextcloud-talk.rooms` 将聊天室加入允许列表：
```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true }
      }
    }
  }
}
```
- 要禁止所有聊天室，保持允许列表为空或设置 `channels.nextcloud-talk.groupPolicy="disabled"`。

## 功能
| 功能 | 状态 |
|---------|--------|
| 私信 | 支持 |
| 聊天室 | 支持 |
| 话题 | 不支持 |
| 媒体 | 仅 URL |
| 反应 | 支持 |
| 原生命令 | 不支持 |

## 配置参考 (Nextcloud Talk)
完整配置：[配置](/gateway/configuration)

提供商选项：
- `channels.nextcloud-talk.enabled`: 启用/禁用频道启动。
- `channels.nextcloud-talk.baseUrl`: Nextcloud 实例 URL。
- `channels.nextcloud-talk.botSecret`: bot 共享密钥。
- `channels.nextcloud-talk.botSecretFile`: 密钥文件路径。
- `channels.nextcloud-talk.apiUser`: 用于聊天室查询的 API 用户 (私信检测)。
- `channels.nextcloud-talk.apiPassword`: 用于聊天室查询的 API/应用密码。
- `channels.nextcloud-talk.apiPasswordFile`: API 密码文件路径。
- `channels.nextcloud-talk.webhookPort`: webhook 监听端口 (默认: 8788)。
- `channels.nextcloud-talk.webhookHost`: webhook 主机 (默认: 0.0.0.0)。
- `channels.nextcloud-talk.webhookPath`: webhook 路径 (默认: /nextcloud-talk-webhook)。
- `channels.nextcloud-talk.webhookPublicUrl`: 外部可访问的 webhook URL。
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`: 私信允许列表 (用户 ID)。`open` 需要 `"*"`。
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`: 群组允许列表 (用户 ID)。
- `channels.nextcloud-talk.rooms`: 每个聊天室的设置和允许列表。
- `channels.nextcloud-talk.historyLimit`: 群组历史记录限制 (0 禁用)。
- `channels.nextcloud-talk.dmHistoryLimit`: 私信历史记录限制 (0 禁用)。
- `channels.nextcloud-talk.dms`: 每个私信的覆盖设置 (historyLimit)。
- `channels.nextcloud-talk.textChunkLimit`: 出站文本块大小 (字符)。
- `channels.nextcloud-talk.chunkMode`: `length` (默认) 或 `newline` 以在空白行 (段落边界) 处分割，然后再按长度分块。
- `channels.nextcloud-talk.blockStreaming`: 为此频道禁用块流式传输。
- `channels.nextcloud-talk.blockStreamingCoalesce`: 块流式传输合并调优。
- `channels.nextcloud-talk.mediaMaxMb`: 入站媒体上限 (MB)。