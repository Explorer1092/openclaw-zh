---
title: "LINE (插件)"
sidebarTitle: "LINE"
mmh3_hash: "b9f2aadda7544eaf1b4d2cc74ae33ba9"
summary: "LINE Messaging API 插件设置、配置和使用"
read_when:
  - 连接 OpenClaw 到 LINE
  - 配置 LINE webhook + 凭据
  - 使用 LINE 特有的消息选项
---

# LINE (插件)

LINE 通过 LINE Messaging API 连接到 OpenClaw。该插件在 Gateway 上作为 Webhook 接收器运行，并使用您的 Channel access token + Channel secret 进行身份验证。

状态：通过插件支持。支持私聊、群聊、媒体、位置、Flex 消息、模板消息和快速回复。不支持反应和主题。

## 需要安装插件

安装 LINE 插件：

```bash
openclaw plugins install @openclaw/line
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./extensions/line
```

## 设置

1. 创建 LINE Developers 账号并打开控制台：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 创建（或选择）一个 Provider 并添加 **Messaging API** Channel。
3. 从 Channel 设置中复制 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 设置中启用 **Use webhook**。
5. 将 Webhook URL 设置为您的 Gateway 端点（需要 HTTPS）：

```
https://gateway-host/line/webhook
```

Gateway 会响应 LINE 的 Webhook 验证（GET）和入站事件（POST）。
如果您需要自定义路径，请设置 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath` 并相应更新 URL。

安全注意：

- LINE 签名验证依赖于请求体（对原始请求体进行 HMAC 计算），因此 OpenClaw 在验证之前会应用严格的预认证请求体限制和超时。
- OpenClaw 从经过验证的原始请求字节中处理 Webhook 事件。上游中间件转换后的 `req.body` 值会被忽略，以确保签名完整性。

## 配置

最小配置：

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

环境变量（仅默认账号）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/secret 文件：

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` 和 `secretFile` 必须指向普通文件。符号链接会被拒绝。

多账号：

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## 访问控制

私信默认使用配对模式。未知发送者会收到配对码，在批准之前其消息会被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist 和策略：

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: 私信 allowlist 中的 LINE 用户 ID
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: 群组 allowlist 中的 LINE 用户 ID
- 每个群组的覆盖设置：`channels.line.groups.<groupId>.allowFrom`
- 运行时注意：如果 `channels.line` 完全缺失，运行时会回退到 `groupPolicy="allowlist"` 进行群组检查（即使设置了 `channels.defaults.groupPolicy`）。

LINE ID 区分大小写。有效 ID 格式如下：

- 用户：`U` + 32 个十六进制字符
- 群组：`C` + 32 个十六进制字符
- 聊天室：`R` + 32 个十六进制字符

## 消息行为

- 文本在 5000 个字符处分块。
- Markdown 格式会被剥离；代码块和表格会在可能的情况下转换为 Flex 卡片。
- 流式响应会被缓冲；LINE 在 Agent 工作时接收完整的分块并显示加载动画。
- 媒体下载受 `channels.line.mediaMaxMb`（默认 10）限制。

## Channel data（富消息）

使用 `channelData.line` 发送快速回复、位置、Flex 卡片或模板消息。

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE 插件还提供了 `/card` 命令用于 Flex 消息预设：

```
/card info "Welcome" "Thanks for joining!"
```

## 故障排除

- **Webhook 验证失败：** 确保 Webhook URL 是 HTTPS，且 `channelSecret` 与 LINE 控制台中的匹配。
- **没有入站事件：** 确认 Webhook 路径与 `channels.line.webhookPath` 匹配，且 Gateway 可从 LINE 访问。
- **媒体下载错误：** 如果媒体超出默认限制，请提高 `channels.line.mediaMaxMb`。
