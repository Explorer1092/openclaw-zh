---
title: "Tlon (插件)"
mmh3_hash: "aae561c7a56348c22ab5a267c73e0cd1"
summary: "Tlon/Urbit 支持状态、功能和配置"
read_when: ["Working on Tlon/Urbit channel features"]
---
# Tlon (插件)

Tlon 是一个基于 Urbit 构建的去中心化通讯工具。OpenClaw 可以连接到您的 Urbit ship 并响应私信和群组聊天消息。群组回复默认需要 @ 提及，并且可以通过允许列表进一步限制。

状态：通过插件支持。支持私信、群组提及、帖子回复和纯文本媒体回退（URL 附加到说明文字）。不支持反应、投票和原生媒体上传。

## 需要插件

Tlon 作为插件提供，不包含在核心安装中。

通过 CLI 安装（npm registry）：

```bash
openclaw plugins install @openclaw/tlon
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./extensions/tlon
```

详情：[插件](/plugin)

## 设置

1) 安装 Tlon 插件。
2) 获取您的 ship URL 和登录代码。
3) 配置 `channels.tlon`。
4) 重启 gateway。
5) 向 bot 发送私信或在群组频道中提及它。

最小配置（单账户）：

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup"
    }
  }
}
```

## 群组频道

默认启用自动发现。您也可以手动固定频道：

```json5
{
  channels: {
    tlon: {
      groupChannels: [
        "chat/~host-ship/general",
        "chat/~host-ship/support"
      ]
    }
  }
}
```

禁用自动发现：

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false
    }
  }
}
```

## 访问控制

私信允许列表（空 = 允许所有）：

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"]
    }
  }
}
```

群组授权（默认受限）：

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"]
          },
          "chat/~host-ship/announcements": {
            mode: "open"
          }
        }
      }
    }
  }
}
```

## 投递目标（CLI/cron）

配合 `openclaw message send` 或 cron 投递使用：

- 私信：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群组：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 注意事项

- 群组回复需要提及（例如 `~your-bot-ship`）才能响应。
- 帖子回复：如果接收到的消息在帖子中，OpenClaw 将在帖子内回复。
- 媒体：`sendMedia` 回退到文本 + URL（无原生上传）。