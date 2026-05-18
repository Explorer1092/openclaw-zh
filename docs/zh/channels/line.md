---
mmh3_hash: "4cac8a4eb45c21db655796bbddb48c32"
summary: "LINE Messaging API Plugin 设置、配置和使用"
read_when:
  - 连接 OpenClaw 到 LINE
  - 需要 LINE Webhook + 凭据设置
  - 需要 LINE 特定的消息选项
title: LINE
---

LINE 通过 LINE Messaging API 连接到 OpenClaw。Plugin 在 Gateway 上作为 Webhook 接收器运行，并使用您的 Channel Access Token + Channel Secret 进行认证。

状态：可下载 Plugin。支持私信、群聊、媒体、位置、Flex 消息、模板消息和快速回复。不支持 Reaction 和线程。

## 安装

安装 LINE 后再配置 Channel：

```bash
openclaw plugins install @openclaw/line
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 设置

1. 创建 LINE Developers 账户并打开控制台：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 创建（或选择）一个 Provider，并添加一个 **Messaging API** Channel。
3. 从 Channel 设置中复制 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 设置中启用 **Use webhook**。
5. 将 Webhook URL 设置为您的 Gateway 端点（需要 HTTPS）：

```
https://gateway-host/line/webhook
```

Gateway 响应 LINE 的 Webhook 验证（GET）并在签名和负载验证后立即确认已签名的入站事件（POST）；Agent 处理异步继续。
如果您需要自定义路径，设置 `channels.line.webhookPath` 或 `channels.line.accounts.<id>.webhookPath` 并相应更新 URL。

安全注意事项：

- LINE 签名验证依赖于请求体（对原始请求体进行 HMAC），因此 OpenClaw 在验证之前应用严格的预认证请求体限制和超时。
- OpenClaw 从验证后的原始请求字节处理 Webhook 事件。为签名完整性安全，上游中间件转换的 `req.body` 值被忽略。

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

公开私信配置：

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

环境变量（仅默认账户）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/Secret 文件：

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

多账户：

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

私信默认使用配对模式。未知发送者收到配对码，其消息在批准之前被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlist 和策略：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`：私信的 LINE 用户 ID allowlist；`dmPolicy: "open"` 需要 `["*"]`
- `channels.line.groupPolicy`：`allowlist | open | disabled`
- `channels.line.groupAllowFrom`：群组的 LINE 用户 ID allowlist
- 每群组覆盖：`channels.line.groups.<groupId>.allowFrom`
- 可以使用 `accessGroup:<name>` 从 `allowFrom`、`groupAllowFrom` 和每群组 `allowFrom` 引用静态发送者访问组。
- 运行时注意：如果 `channels.line` 完全缺失，运行时回退到 `groupPolicy="allowlist"` 进行群组检查（即使设置了 `channels.defaults.groupPolicy`）。

LINE ID 区分大小写。有效 ID 如下：

- 用户：`U` + 32 个十六进制字符
- 群组：`C` + 32 个十六进制字符
- 房间：`R` + 32 个十六进制字符

## 消息行为

- 文本在 5000 个字符处分块。
- Markdown 格式被去除；代码块和表格在可能时转换为 Flex 卡片。
- 流式回复被缓冲；LINE 在 Agent 处理期间通过加载动画接收完整块。
- 媒体下载受 `channels.line.mediaMaxMb` 限制（默认 10）。
- 入站媒体在传递给 Agent 之前保存在 `~/.openclaw/media/inbound/` 下，与其他捆绑 Channel Plugin 使用的共享媒体存储匹配。

## Channel 数据（富消息）

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
          /* Flex 负载 */
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

LINE Plugin 还附带一个用于 Flex 消息预设的 `/card` 命令：

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 支持

LINE 支持 ACP（Agent Communication Protocol）对话绑定：

- `/acp spawn <agent> --bind here` 将当前 LINE 聊天绑定到 ACP 会话，而不创建子线程。
- 配置的 ACP 绑定和活动的对话绑定 ACP 会话在 LINE 上与其他对话 Channel 一样工作。

详情参见 [ACP Agents](/tools/acp-agents)。

## 出站媒体

LINE Plugin 支持通过 Agent message 工具发送图像、视频和音频文件。媒体通过 LINE 特定的传递路径发送，具有适当的预览和跟踪处理：

- **图像**：以 LINE 图像消息发送，自动生成预览。
- **视频**：使用显式预览和内容类型处理发送。
- **音频**：以 LINE 音频消息发送。

出站媒体 URL 必须是公共 HTTPS URL。OpenClaw 在将 URL 传递给 LINE 之前验证目标主机名，并拒绝回环、链路本地和私有网络目标。

当 LINE 特定路径不可用时，通用媒体发送回退到现有的仅图像路由。

## 故障排除

- **Webhook 验证失败：** 确保 Webhook URL 是 HTTPS 且 `channelSecret` 与 LINE 控制台匹配。
- **没有入站事件：** 确认 Webhook 路径与 `channels.line.webhookPath` 匹配，且 Gateway 可从 LINE 访问。
- **媒体下载错误：** 如果媒体超过默认限制，提高 `channels.line.mediaMaxMb`。

## 相关

- [Channel 概述](/channels) — 所有支持的 Channel
- [Pairing](/channels/pairing) — 私信认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
