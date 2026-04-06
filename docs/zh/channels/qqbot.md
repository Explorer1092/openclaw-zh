---
mmh3_hash: "2a2b137f3031ae5a2fa11931d8e9559a"
summary: "QQ Bot 设置、配置和使用"
read_when:
  - 想将 OpenClaw 连接到 QQ
  - 需要 QQ Bot 凭据设置
  - 想要 QQ Bot 群聊或私聊支持
title: QQ Bot
---

# QQ Bot

QQ Bot 通过官方 QQ Bot API（WebSocket 网关）连接到 OpenClaw。
该插件支持 C2C 私聊、群组 @消息和公会频道消息，支持
丰富媒体（图片、语音、视频、文件）。

状态：内置插件。支持私信、群聊、公会频道和
媒体。不支持反应和线程。

## 内置插件

当前 OpenClaw 版本内置了 QQ Bot，因此正常打包的版本无需
单独的 `openclaw plugins install` 步骤。

## 设置

1. 前往 [QQ 开放平台](https://q.qq.com/) 并使用手机 QQ 扫描二维码注册/登录。
2. 点击**创建机器人**创建新的 QQ 机器人。
3. 在机器人设置页面找到 **AppID** 和 **AppSecret** 并复制。

> AppSecret 不以明文存储——如果在未保存的情况下离开页面，
> 您需要重新生成一个新的。

4. 添加 Channel：

```bash
openclaw channels add --channel qqbot --token "AppID:AppSecret"
```

5. 重启 Gateway。

交互式设置路径：

```bash
openclaw channels add
openclaw configure --section channels
```

## 配置

最小配置：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecret: "YOUR_APP_SECRET",
    },
  },
}
```

默认账户环境变量：

- `QQBOT_APP_ID`
- `QQBOT_CLIENT_SECRET`

文件存储的 AppSecret：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "YOUR_APP_ID",
      clientSecretFile: "/path/to/qqbot-secret.txt",
    },
  },
}
```

注意：

- 环境变量回退仅适用于默认 QQ Bot 账户。
- `openclaw channels add --channel qqbot --token-file ...` 仅提供
  AppSecret；AppID 必须已在配置或 `QQBOT_APP_ID` 中设置。
- `clientSecret` 也接受 SecretRef 输入，不仅限于明文字符串。

### 多账户设置

在单个 OpenClaw 实例下运行多个 QQ 机器人：

```json5
{
  channels: {
    qqbot: {
      enabled: true,
      appId: "111111111",
      clientSecret: "secret-of-bot-1",
      accounts: {
        bot2: {
          enabled: true,
          appId: "222222222",
          clientSecret: "secret-of-bot-2",
        },
      },
    },
  },
}
```

每个账户都会启动自己的 WebSocket 连接，并维护独立的
token 缓存（按 `appId` 隔离）。

通过 CLI 添加第二个机器人：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 语音（STT / TTS）

STT 和 TTS 支持两级配置，带优先级回退：

| 设置 | 插件特定 | 框架回退 |
| --- | --- | --- |
| STT | `channels.qqbot.stt` | `tools.media.audio.models[0]` |
| TTS | `channels.qqbot.tts` | `messages.tts` |

```json5
{
  channels: {
    qqbot: {
      stt: {
        provider: "your-provider",
        model: "your-stt-model",
      },
      tts: {
        provider: "your-provider",
        model: "your-tts-model",
        voice: "your-voice",
      },
    },
  },
}
```

在任一项上设置 `enabled: false` 可禁用。

出站音频上传/转码行为也可以通过
`channels.qqbot.audioFormatPolicy` 调整：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目标格式

| 格式 | 描述 |
| --- | --- |
| `qqbot:c2c:OPENID` | 私聊（C2C） |
| `qqbot:group:GROUP_OPENID` | 群聊 |
| `qqbot:channel:CHANNEL_ID` | 公会频道 |

> 每个机器人都有自己的用户 OpenID 集合。Bot A 收到的 OpenID **不能**
> 用于通过 Bot B 发送消息。

## Slash 命令

在 AI 队列之前拦截的内置命令：

| 命令 | 描述 |
| --- | --- |
| `/bot-ping` | 延迟测试 |
| `/bot-version` | 显示 OpenClaw 框架版本 |
| `/bot-help` | 列出所有命令 |
| `/bot-upgrade` | 显示 QQBot 升级指南链接 |
| `/bot-logs` | 将最近的 Gateway 日志导出为文件 |

在任何命令后附加 `?` 可获取使用帮助（例如 `/bot-upgrade ?`）。

## 故障排除

- **Bot 回复"gone to Mars"：** 凭据未配置或 Gateway 未启动。
- **没有入站消息：** 验证 `appId` 和 `clientSecret` 是否正确，以及
  机器人是否在 QQ 开放平台上启用。
- **使用 `--token-file` 设置仍显示未配置：** `--token-file` 仅设置
  AppSecret。您仍需要配置中的 `appId` 或 `QQBOT_APP_ID`。
- **主动消息未到达：** 如果用户最近没有互动，QQ 可能会拦截机器人发起的消息。
- **语音未转录：** 确保 STT 已配置且 provider 可访问。
