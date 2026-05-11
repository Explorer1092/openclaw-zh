---
mmh3_hash: "e109155412ec1783d2f89d931ec8bc00"
summary: "元宝 bot 概述、功能和配置"
read_when:
  - 您想连接元宝 bot
  - 您正在配置元宝 channel
title: 元宝
---

腾讯元宝是腾讯的 AI 助手平台。OpenClaw channel Plugin 通过 WebSocket 将元宝 bot 连接到 OpenClaw，使其可以通过私信和群聊与用户互动。

**状态：** bot 私信 + 群聊生产可用。WebSocket 是唯一支持的连接模式。

---

## 快速开始

> **需要 OpenClaw 2026.4.10 或更高版本。** 运行 `openclaw --version` 检查。通过 `openclaw update` 升级。

<Steps>
  <Step title="使用您的凭据添加元宝 channel">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` 值使用冒号分隔的 `appKey:appSecret` 格式。您可以通过在元宝应用的应用设置中创建机器人来获取这些信息。
  </Step>

  <Step title="设置完成后，重启 gateway 以应用更改">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### 交互式设置（备选方案）

您也可以使用交互式向导：

```bash
openclaw channels login --channel yuanbao
```

按照提示输入您的 App ID 和 App Secret。

---

## 访问控制

### 私信

配置 `dmPolicy` 控制谁可以私信 bot：

- `"pairing"` - 未知用户收到配对码；通过 CLI 批准
- `"allowlist"` - 只有 `allowFrom` 中列出的用户可以聊天
- `"open"` - 允许所有用户（默认）
- `"disabled"` - 禁用所有私信

**批准配对请求：**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### 群聊

**提及要求**（`channels.yuanbao.requireMention`）：

- `true` - 需要 @提及（默认）
- `false` - 无需 @提及即可响应

在群聊中回复 bot 的消息被视为隐式提及。

---

## 配置示例

### 基本设置，开放私信策略

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### 限制私信到特定用户

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### 禁用群组中的 @提及要求

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### 优化出站消息投递

```json5
{
  channels: {
    yuanbao: {
      // 立即发送每个块，不缓冲
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### 调整合并文本策略

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // 缓冲到此字符数
      maxChars: 3000, // 超过此限制强制分割
      idleMs: 5000, // 空闲超时后自动刷新（毫秒）
    },
  },
}
```

---

## 常用命令

| 命令       | 描述                 |
| ---------- | -------------------- |
| `/help`    | 显示可用命令         |
| `/status`  | 显示 bot 状态        |
| `/new`     | 开始新 Session       |
| `/stop`    | 停止当前运行         |
| `/restart` | 重启 OpenClaw        |
| `/compact` | 压缩 Session 上下文  |

> 元宝支持原生斜杠命令菜单。命令在 gateway 启动时自动同步到平台。

---

## 故障排除

### Bot 在群聊中不响应

1. 确保 bot 已添加到群组
2. 确保您 @提及了 bot（默认必须）
3. 检查日志：`openclaw logs --follow`

### Bot 不接收消息

1. 确保 bot 已在元宝应用中创建并获批
2. 确保 `appKey` 和 `appSecret` 配置正确
3. 确保 gateway 正在运行：`openclaw gateway status`
4. 检查日志：`openclaw logs --follow`

### Bot 发送空回复或备用回复

1. 检查 AI 模型是否返回有效内容
2. 默认备用回复为："暂时无法解答，你可以换个问题问问我哦"
3. 通过 `channels.yuanbao.fallbackReply` 自定义

### App Secret 泄露

1. 在元宝 APP 中重置 App Secret
2. 更新配置中的值
3. 重启 gateway：`openclaw gateway restart`

---

## 高级配置

### 多账户

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` 控制在出站 API 不指定 `accountId` 时使用哪个账户。

### 消息限制

- `maxChars` - 单条消息最大字符数（默认：`3000` 字符）
- `mediaMaxMb` - 媒体上传/下载限制（默认：`20` MB）
- `overflowPolicy` - 消息超出限制时的行为：`"split"`（默认）或 `"stop"`

### 流式输出

元宝支持块级流式输出。启用后，bot 在生成时分块发送文本。

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // 块流式输出已启用（默认）
    },
  },
}
```

设置 `disableBlockStreaming: true` 以一条消息发送完整回复。

### 群聊历史上下文

控制群聊 AI 上下文中包含多少历史消息：

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // 默认：100，设置 0 禁用
    },
  },
}
```

### 回复模式

控制 bot 在群聊中回复时如何引用消息：

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all"（默认："first"）
    },
  },
}
```

| 值        | 行为                                               |
| --------- | -------------------------------------------------- |
| `"off"`   | 无引用回复                                         |
| `"first"` | 每条入站消息仅引用第一条回复（默认）               |
| `"all"`   | 引用每条回复                                       |

### Markdown 提示注入

默认情况下，bot 会在系统提示中注入指令，防止 AI 模型将整个回复包装在 markdown 代码块中。

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // 默认：true
    },
  },
}
```

### 调试模式

为特定 bot ID 启用未过滤的日志输出：

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### 多 Agent 路由

使用 `bindings` 将元宝私信或群组路由到不同的 agent。

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

路由字段：

- `match.channel`：`"yuanbao"`
- `match.peer.kind`：`"direct"`（私信）或 `"group"`（群聊）
- `match.peer.id`：用户 ID 或群组代码

---

## 配置参考

完整配置：[Gateway 配置](/gateway/configuration)

| 设置                                       | 描述                                               | 默认值                                   |
| ------------------------------------------ | -------------------------------------------------- | ---------------------------------------- |
| `channels.yuanbao.enabled`                 | 启用/禁用 channel                                  | `true`                                   |
| `channels.yuanbao.defaultAccount`          | 出站路由的默认账户                                 | `default`                                |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key（用于签名和票据生成）                       | -                                        |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret（用于签名）                             | -                                        |
| `channels.yuanbao.accounts.<id>.token`     | 预签名 token（跳过自动票据签名）                    | -                                        |
| `channels.yuanbao.accounts.<id>.name`      | 账户显示名称                                       | -                                        |
| `channels.yuanbao.accounts.<id>.enabled`   | 启用/禁用特定账户                                  | `true`                                   |
| `channels.yuanbao.dm.policy`               | 私信策略                                           | `open`                                   |
| `channels.yuanbao.dm.allowFrom`            | 私信白名单（用户 ID 列表）                          | -                                        |
| `channels.yuanbao.requireMention`          | 群组中需要 @提及                                   | `true`                                   |
| `channels.yuanbao.overflowPolicy`          | 长消息处理（`split` 或 `stop`）                    | `split`                                  |
| `channels.yuanbao.replyToMode`             | 群组引用回复策略（`off`、`first`、`all`）           | `first`                                  |
| `channels.yuanbao.outboundQueueStrategy`   | 出站策略（`merge-text` 或 `immediate`）             | `merge-text`                             |
| `channels.yuanbao.minChars`                | 合并文本：触发发送的最小字符数                      | `2800`                                   |
| `channels.yuanbao.maxChars`                | 合并文本：每条消息最大字符数                        | `3000`                                   |
| `channels.yuanbao.idleMs`                  | 合并文本：自动刷新前的空闲超时（毫秒）              | `5000`                                   |
| `channels.yuanbao.mediaMaxMb`              | 媒体大小限制（MB）                                 | `20`                                     |
| `channels.yuanbao.historyLimit`            | 群聊历史上下文条目数                               | `100`                                    |
| `channels.yuanbao.disableBlockStreaming`   | 禁用块级流式输出                                   | `false`                                  |
| `channels.yuanbao.fallbackReply`           | AI 无内容时的备用回复                              | `暂时无法解答，你可以换个问题问问我哦`   |
| `channels.yuanbao.markdownHintEnabled`     | 注入 markdown 防包装指令                           | `true`                                   |
| `channels.yuanbao.debugBotIds`             | 调试白名单 bot ID（未过滤日志）                    | `[]`                                     |

---

## 支持的消息类型

### 接收

- ✅ 文本
- ✅ 图片
- ✅ 文件
- ✅ 音频 / 语音
- ✅ 视频
- ✅ 贴纸 / 自定义表情
- ✅ 自定义元素（链接卡片等）

### 发送

- ✅ 文本（支持 markdown）
- ✅ 图片
- ✅ 文件
- ✅ 音频
- ✅ 视频
- ✅ 贴纸

### 线程和回复

- ✅ 引用回复（可通过 `replyToMode` 配置）
- ❌ 线程回复（平台不支持）

---

## 相关

- [Channels 概述](/channels) - 所有支持的 channel
- [Pairing](/channels/pairing) - 私信身份验证和配对流程
- [Groups](/channels/groups) - 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) - 消息的 Session 路由
- [Security](/gateway/security) - 访问模型和加固
