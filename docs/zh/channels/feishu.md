---
mmh3_hash: "64829654c4f23056a1f1c60e43bd9e8a"
summary: "Feishu 机器人概述、功能和配置"
read_when:
  - 您想连接 Feishu/Lark 机器人
  - 您正在配置 Feishu Channel
title: Feishu
---

# Feishu / Lark

Feishu（Lark）是一体化协作平台，团队可在其中聊天、共享文档、管理日历并协同完成工作。

**状态：** 机器人私信 + 群聊生产可用。WebSocket 为默认模式；webhook 模式可选。

---

## 快速开始

> **需要 OpenClaw 2026.4.10 或更高版本。** 运行 `openclaw --version` 检查。通过 `openclaw update` 升级。

<Steps>
  <Step title="运行 Channel 设置向导">
  ```bash
  openclaw channels login --channel feishu
  ```
  使用 Feishu/Lark 移动应用扫描二维码，自动创建 Feishu/Lark 机器人。
  </Step>
  
  <Step title="设置完成后，重启 Gateway 以应用更改">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## 访问控制

### 私信

配置 `dmPolicy` 控制谁可以私信机器人：

- `"pairing"` — 未知用户收到配对码；通过 CLI 批准
- `"allowlist"` — 只有 `allowFrom` 中列出的用户可以聊天（默认：仅机器人所有者）
- `"open"` — 允许所有用户
- `"disabled"` — 禁用所有私信

**批准配对请求：**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### 群聊

**群组策略**（`channels.feishu.groupPolicy`）：

| 值            | 行为                          |
| ------------- | ----------------------------- |
| `"open"`      | 响应群组中的所有消息          |
| `"allowlist"` | 仅响应 `groupAllowFrom` 中的群组 |
| `"disabled"`  | 禁用所有群组消息              |

默认：`allowlist`

**提及要求**（`channels.feishu.requireMention`）：

- `true` — 需要 @提及（默认）
- `false` — 无需 @提及即可响应
- 每群组覆盖：`channels.feishu.groups.<chat_id>.requireMention`

---

## 群组配置示例

### 允许所有群组，无需 @提及

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### 允许所有群组，但仍需要 @提及

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### 仅允许特定群组

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // 群组 ID 格式如：oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### 限制群组内的发送者

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // 用户 open_id 格式如：ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

## 获取群组/用户 ID

### 群组 ID（`chat_id`，格式：`oc_xxx`）

在 Feishu/Lark 中打开群组，点击右上角菜单图标，进入**设置**。群组 ID（`chat_id`）列在设置页面上。

![获取群组 ID](/images/feishu-get-group-id.png)

### 用户 ID（`open_id`，格式：`ou_xxx`）

启动 Gateway，向机器人发送私信，然后查看日志：

```bash
openclaw logs --follow
```

在日志输出中查找 `open_id`。也可以查看待处理的配对请求：

```bash
openclaw pairing list feishu
```

---

## 常用命令

| 命令      | 描述              |
| --------- | ----------------- |
| `/status` | 显示机器人状态    |
| `/reset`  | 重置当前会话      |
| `/model`  | 显示或切换 AI 模型 |

> Feishu/Lark 不支持原生斜杠命令菜单，因此这些命令作为纯文本消息发送。

---

## 故障排除

### 机器人在群聊中不响应

1. 确保机器人已添加到群组
2. 确保您 @提及了机器人（默认要求）
3. 验证 `groupPolicy` 未设置为 `"disabled"`
4. 检查日志：`openclaw logs --follow`

### 机器人未接收消息

1. 确保机器人在 Feishu 开放平台 / Lark Developer 中已发布并通过审批
2. 确保事件订阅包含 `im.message.receive_v1`
3. 确保已选择**持续连接**（WebSocket）
4. 确保已授予所有必要的权限范围
5. 确保 Gateway 正在运行：`openclaw gateway status`
6. 检查日志：`openclaw logs --follow`

### App Secret 泄露

1. 在 Feishu 开放平台 / Lark Developer 中重置 App Secret
2. 更新配置中的值
3. 重启 Gateway：`openclaw gateway restart`

---

## 高级配置

### 多账户

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount` 控制当出站 API 未指定 `accountId` 时使用哪个账户。

### 消息限制

- `textChunkLimit` — 出站文本块大小（默认：`2000` 字符）
- `mediaMaxMb` — 媒体上传/下载限制（默认：`30` MB）

### 流式传输

Feishu/Lark 通过交互式卡片支持流式回复。启用后，机器人在生成文本时实时更新卡片。

```json5
{
  channels: {
    feishu: {
      streaming: true, // 启用流式卡片输出（默认：true）
      blockStreaming: true, // 启用块级流式传输（默认：true）
    },
  },
}
```

设置 `streaming: false` 以在一条消息中发送完整回复。

### 配额优化

通过两个可选标志减少 Feishu/Lark API 调用次数：

- `typingIndicator`（默认 `true`）：设为 `false` 跳过输入状态 reaction 调用
- `resolveSenderNames`（默认 `true`）：设为 `false` 跳过发送者资料查询

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### ACP 会话

Feishu/Lark 支持私信和群组话题消息的 ACP。Feishu/Lark ACP 由文本命令驱动——没有原生斜杠命令菜单，因此在对话中直接使用 `/acp ...` 消息。

#### 持久化 ACP 绑定

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### 从聊天生成 ACP

在 Feishu/Lark 私信或话题中：

```text
/acp spawn codex --thread here
```

`--thread here` 适用于私信和 Feishu/Lark 话题消息。绑定对话中的后续消息直接路由到该 ACP 会话。

### 多 Agent 路由

使用 `bindings` 将 Feishu/Lark 私信或群组路由到不同的 Agent。

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
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

路由字段：

- `match.channel`：`"feishu"`
- `match.peer.kind`：`"direct"`（私信）或 `"group"`（群聊）
- `match.peer.id`：用户 Open ID（`ou_xxx`）或群组 ID（`oc_xxx`）

查找方法参见[获取群组/用户 ID](#获取群组用户-id)。

---

## 配置参考

完整配置：[Gateway 配置](/gateway/configuration)

| 设置                                              | 描述                                    | 默认值           |
| ------------------------------------------------- | --------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | 启用/禁用 Channel                       | `true`           |
| `channels.feishu.domain`                          | API 域名（`feishu` 或 `lark`）          | `feishu`         |
| `channels.feishu.connectionMode`                  | 事件传输方式（`websocket` 或 `webhook`）| `websocket`      |
| `channels.feishu.defaultAccount`                  | 出站路由的默认账户                      | `default`        |
| `channels.feishu.verificationToken`               | Webhook 模式必填                        | —                |
| `channels.feishu.encryptKey`                      | Webhook 模式必填                        | —                |
| `channels.feishu.webhookPath`                     | Webhook 路由路径                        | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook 绑定主机                        | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook 绑定端口                        | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                  | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                              | —                |
| `channels.feishu.accounts.<id>.domain`            | 每账户域名覆盖                          | `feishu`         |
| `channels.feishu.dmPolicy`                        | 私信策略                                | `allowlist`      |
| `channels.feishu.allowFrom`                       | 私信 allowlist（open_id 列表）          | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | 群组策略                                | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | 群组 allowlist                          | —                |
| `channels.feishu.requireMention`                  | 群组中需要 @提及                        | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | 每群组 @提及覆盖                        | 继承             |
| `channels.feishu.groups.<chat_id>.enabled`        | 启用/禁用特定群组                       | `true`           |
| `channels.feishu.textChunkLimit`                  | 消息块大小                              | `2000`           |
| `channels.feishu.mediaMaxMb`                      | 媒体大小限制                            | `30`             |
| `channels.feishu.streaming`                       | 流式卡片输出                            | `true`           |
| `channels.feishu.blockStreaming`                  | 块级流式传输                            | `true`           |
| `channels.feishu.typingIndicator`                 | 发送输入状态 reaction                   | `true`           |
| `channels.feishu.resolveSenderNames`              | 解析发送者显示名称                      | `true`           |

---

## 支持的消息类型

### 接收

- ✅ 文本
- ✅ 富文本（post）
- ✅ 图片
- ✅ 文件
- ✅ 音频
- ✅ 视频/媒体
- ✅ 贴纸

### 发送

- ✅ 文本
- ✅ 图片
- ✅ 文件
- ✅ 音频
- ✅ 视频/媒体
- ✅ 交互式卡片（包含流式更新）
- ⚠️ 富文本（post 样式格式；不支持完整的 Feishu/Lark 创作功能）

### 话题和回复

- ✅ 内联回复
- ✅ 话题回复
- ✅ 回复话题消息时媒体回复保持话题感知

---

## 相关

- [Channel 概述](/channels) — 所有支持的 Channel
- [Pairing](/channels/pairing) — 私信认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
