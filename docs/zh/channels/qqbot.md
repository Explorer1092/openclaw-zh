---
mmh3_hash: "bf30424c04a7e88760d1c2966a825a76"
summary: "QQ Bot 设置、配置和使用"
read_when:
  - 想将 OpenClaw 连接到 QQ
  - 需要 QQ Bot 凭据设置
  - 想要 QQ Bot 群聊或私聊支持
title: QQ bot
---

QQ Bot 通过官方 QQ Bot API（WebSocket 网关）连接到 OpenClaw。该插件支持 C2C 私聊、群组 @消息和公会频道消息，支持丰富媒体（图片、语音、视频、文件）。

状态：内置插件。支持私信、群聊、公会频道和媒体。不支持反应和线程。

## 内置插件

当前 OpenClaw 版本内置了 QQ Bot，因此正常打包的版本无需单独的 `openclaw plugins install` 步骤。

## 设置

1. 前往 [QQ 开放平台](https://q.qq.com/) 并使用手机 QQ 扫描二维码注册/登录。
2. 点击**创建机器人**创建新的 QQ 机器人。
3. 在机器人设置页面找到 **AppID** 和 **AppSecret** 并复制。

> AppSecret 不以明文存储——如果在未保存的情况下离开页面，您需要重新生成一个新的。

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
- `openclaw channels add --channel qqbot --token-file ...` 仅提供 AppSecret；AppID 必须已在配置或 `QQBOT_APP_ID` 中设置。
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

每个账户都会启动自己的 WebSocket 连接，并维护独立的 token 缓存（按 `appId` 隔离）。

通过 CLI 添加第二个机器人：

```bash
openclaw channels add --channel qqbot --account bot2 --token "222222222:secret-of-bot-2"
```

### 语音（STT / TTS）

STT 和 TTS 支持两级配置，带优先级回退：

| 设置 | 插件特定                                                   | 框架回退                      |
| ---- | ---------------------------------------------------------- | ----------------------------- |
| STT  | `channels.qqbot.stt`                                       | `tools.media.audio.models[0]` |
| TTS  | `channels.qqbot.tts`、`channels.qqbot.accounts.<id>.tts`  | `messages.tts`                |

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
      accounts: {
        "qq-main": {
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
      },
    },
  },
}
```

在任一项上设置 `enabled: false` 可禁用。账户级 TTS 覆盖使用与 `messages.tts` 相同的结构，并深度合并到 Channel/全局 TTS 配置之上。

入站 QQ 语音附件以音频媒体元数据的形式暴露给 Agent，同时将原始语音文件排除在通用 `MediaPaths` 之外。当配置了 TTS 时，`[[audio_as_voice]]` 纯文本回复会合成 TTS 并发送原生 QQ 语音消息。

出站音频上传/转码行为也可以通过 `channels.qqbot.audioFormatPolicy` 调整：

- `sttDirectFormats`
- `uploadDirectFormats`
- `transcodeEnabled`

## 目标格式

| 格式                       | 描述           |
| -------------------------- | -------------- |
| `qqbot:c2c:OPENID`         | 私聊（C2C）    |
| `qqbot:group:GROUP_OPENID` | 群聊           |
| `qqbot:channel:CHANNEL_ID` | 公会频道       |

> 每个机器人都有自己的用户 OpenID 集合。Bot A 收到的 OpenID **不能**用于通过 Bot B 发送消息。

## Slash 命令

在 AI 队列之前拦截的内置命令：

| 命令           | 描述                                                         |
| -------------- | ------------------------------------------------------------ |
| `/bot-ping`    | 延迟测试                                                     |
| `/bot-version` | 显示 OpenClaw 框架版本                                       |
| `/bot-help`    | 列出所有命令                                                 |
| `/bot-upgrade` | 显示 QQBot 升级指南链接                                      |
| `/bot-logs`    | 将最近的 Gateway 日志导出为文件                              |
| `/bot-approve` | 通过原生流程批准待处理的 QQ Bot 操作（例如确认 C2C 或群组上传）。|

在任何命令后附加 `?` 可获取使用帮助（例如 `/bot-upgrade ?`）。

## 引擎架构

QQ Bot 作为插件内部的自包含引擎提供：

- 每个账户拥有独立的资源栈（WebSocket 连接、API 客户端、token 缓存、媒体存储根目录），以 `appId` 为键。账户之间永不共享入站/出站状态。
- 多账户日志记录器为日志行标记所属账户，以便在单个 Gateway 下运行多个机器人时诊断信息保持可区分。
- 入站、出站和 Gateway 桥接路径共享 `~/.openclaw/media` 下的单一媒体负载根目录，因此上传、下载和转码缓存位于一个受保护的目录下，而非每个子系统各自的目录树。
- 凭据可以作为标准 OpenClaw 凭据快照的一部分进行备份和还原；引擎在还原时重新附加每个账户的资源栈，无需重新进行二维码配对。

## 二维码引导

作为手动粘贴 `AppID:AppSecret` 的替代方案，引擎支持将 QQ Bot 链接到 OpenClaw 的二维码引导流程：

1. 运行 QQ Bot 设置路径（例如 `openclaw channels add --channel qqbot`），并在提示时选择二维码流程。
2. 使用与目标 QQ Bot 绑定的手机应用扫描生成的二维码。
3. 在手机上批准配对。OpenClaw 将返回的凭据持久化到适当账户范围下的 `credentials/`。

机器人本身生成的批准提示（例如 QQ Bot API 暴露的"允许此操作？"流程）以原生 OpenClaw 提示的形式出现，您可以使用 `/bot-approve` 接受，而无需通过原始 QQ 客户端回复。

## 故障排除

- **Bot 回复"gone to Mars"：** 凭据未配置或 Gateway 未启动。
- **没有入站消息：** 验证 `appId` 和 `clientSecret` 是否正确，以及机器人是否在 QQ 开放平台上启用。
- **重复自回复：** OpenClaw 将 QQ 出站 ref 索引记录为 bot 发布，并忽略当前 `msgIdx` 与同一 bot 账户匹配的入站事件。这可以防止平台回声循环，同时仍允许用户引用或回复之前的 bot 消息。
- **使用 `--token-file` 设置仍显示未配置：** `--token-file` 仅设置 AppSecret。您仍需要配置中的 `appId` 或 `QQBOT_APP_ID`。
- **主动消息未到达：** 如果用户最近没有互动，QQ 可能会拦截机器人发起的消息。
- **语音未转录：** 确保 STT 已配置且 provider 可访问。

## 相关

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Channel 故障排除](/channels/troubleshooting)
