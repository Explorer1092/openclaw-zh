---
read_when:
  - 在 OpenClaw 中设置 Matrix
  - 配置 Matrix E2EE 和验证
summary: Matrix 支持状态、设置和配置示例
title: Matrix
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: 76c728ca0a4efee609b707da42f458b341634aaa4ab4f4898c4b8351b7234b4f
  source_path: channels/matrix.md
  workflow: 15
---

# Matrix（插件）

Matrix 是 OpenClaw 的 Matrix 渠道插件。
它使用官方 `matrix-js-sdk`，支持私信、房间、话题、媒体、表情回应、投票、位置和 E2EE。

## 需要插件

Matrix 以插件形式提供，不包含在核心安装中。

从 npm 安装：

```bash
openclaw plugins install @openclaw/matrix
```

从本地检出安装：

```bash
openclaw plugins install ./path/to/local/matrix-plugin
```

详情请参见 [插件](/tools/plugin)。

## 设置

1. 安装插件。
2. 在主服务器上创建 Matrix 账户。
3. 使用以下任一方式配置 `channels.matrix`：
   - `homeserver` + `accessToken`，或
   - `homeserver` + `userId` + `password`。
4. 重启 Gateway 网关。
5. 向机器人发起私信或邀请它加入房间。

交互式设置方式：

```bash
openclaw channels add
openclaw configure --section channels
```

Matrix 向导实际询问的内容：

- 主服务器 URL
- 认证方式：访问令牌或密码
- 选择密码认证时才需要用户 ID
- 可选的设备名称
- 是否启用 E2EE
- 是否现在配置 Matrix 房间访问权限

向导行为说明：

- 如果所选账户的 Matrix 认证环境变量已存在，且该账户的认证尚未保存在配置中，向导会提供环境变量快捷方式，仅为该账户写入 `enabled: true`。
- 通过交互方式添加另一个 Matrix 账户时，输入的账户名称会被规范化为配置和环境变量中使用的账户 ID。例如，`Ops Bot` 变为 `ops-bot`。
- 私信允许列表提示接受完整的 `@user:server` 值。显示名称仅在实时目录查找得到唯一精确匹配时才会解析为用户 ID；否则向导会要求你使用完整的 Matrix ID 重试。

最小配置（访问令牌，用户 ID 自动获取）：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      dm: { policy: "pairing" },
    },
  },
}
```

E2EE 配置（启用端到端加密）：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

## 加密（E2EE）

通过 Rust 加密 SDK **支持**端到端加密。

使用 `channels.matrix.encryption: true` 启用：

- 如果加密模块加载成功，加密房间会自动解密。
- 发送到加密房间时，出站媒体会被加密。
- 首次连接时，OpenClaw 会向你的其他会话请求设备验证。
- 在另一个 Matrix 客户端（Element 等）中验证设备以启用密钥共享。
- 如果无法加载加密模块，E2EE 将被禁用，加密房间将无法解密；OpenClaw 会记录警告。

加密状态按账户 + 访问令牌存储在 `~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/crypto/`（SQLite 数据库）。同步状态存储在同目录的 `bot-storage.json` 中。如果访问令牌（设备）更改，将创建新的存储，机器人必须重新验证才能访问加密房间。

**设备验证：**
启用 E2EE 时，机器人将在启动时向你的其他会话请求验证。打开 Element（或其他客户端）并批准验证请求以建立信任。验证后，机器人可以解密加密房间中的消息。

## 路由模型

- 回复始终返回到 Matrix。
- 私信共享智能体的主会话；房间映射到群组会话。

## 访问控制（私信）

- 默认：`channels.matrix.dm.policy = "pairing"`。未知发送者会收到配对码。
- 通过以下方式批准：
  - `openclaw pairing list matrix`
  - `openclaw pairing approve matrix <CODE>`
- 公开私信：`channels.matrix.dm.policy="open"` 加上 `channels.matrix.dm.allowFrom=["*"]`。
- `channels.matrix.dm.allowFrom` 仅接受完整 Matrix 用户 ID（例如 `@user:server`）。向导仅在目录搜索得到唯一精确匹配时将显示名称解析为用户 ID。
- 私信配对批准（`*-allowFrom` 存储条目）仅适用于私信访问；群组发送者授权对群组允许列表仍需显式设置。

## 房间（群组）

- 默认：`channels.matrix.groupPolicy = "allowlist"`（提及门控）。使用 `channels.defaults.groupPolicy` 在未设置时覆盖默认值。
- 使用 `channels.matrix.groups` 配置房间允许列表（房间 ID 或别名；名称仅在目录搜索得到唯一精确匹配时解析为 ID）：

```json5
{
  channels: {
    matrix: {
      groupPolicy: "allowlist",
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
      groupAllowFrom: ["@owner:example.org"],
    },
  },
}
```

- `requireMention: false` 启用该房间的自动回复。
- `groups."*"` 可以设置跨房间的提及门控默认值。
- `groupAllowFrom` 限制哪些发送者可以在房间中触发机器人（需完整 Matrix 用户 ID）。
- 每个房间的 `users` 允许列表可以进一步限制特定房间内的发送者（需完整 Matrix 用户 ID）。
- 配置向导会提示输入房间允许列表（房间 ID、别名或名称），仅在精确且唯一匹配时解析名称。
- 启动时，OpenClaw 将允许列表中的房间/用户名称解析为 ID 并记录映射；未解析的条目不会参与允许列表匹配。
- 默认自动加入邀请；使用 `channels.matrix.autoJoin` 和 `channels.matrix.autoJoinAllowlist` 控制。
- 要**禁止所有房间**，设置 `channels.matrix.groupPolicy: "disabled"`（或保持空的允许列表）。
- 旧版键名：`channels.matrix.rooms`（与 `groups` 相同的结构）。

## 话题

- 支持回复话题。
- `channels.matrix.threadReplies` 控制回复是否保持在话题中：
  - `off`、`inbound`（默认）、`always`
- `channels.matrix.replyToMode` 控制不在话题中回复时的 reply-to 元数据：
  - `off`（默认）、`first`、`all`

## 功能

| 功能     | 状态                                                   |
| -------- | ------------------------------------------------------ |
| 私信     | ✅ 支持                                                |
| 房间     | ✅ 支持                                                |
| 话题     | ✅ 支持                                                |
| 媒体     | ✅ 支持                                                |
| E2EE     | ✅ 支持（需要加密模块）                                |
| 表情回应 | ✅ 支持（通过工具发送/读取）                           |
| 投票     | ✅ 支持发送；入站投票开始转换为文本（响应/结束被忽略） |
| 位置     | ✅ 支持（geo URI；忽略海拔）                           |
| 原生命令 | ✅ 支持                                                |

## 配置参考（Matrix）

完整配置：[配置参考](/gateway/configuration-reference)

提供商选项：

- `channels.matrix.enabled`：启用/禁用渠道启动。
- `channels.matrix.homeserver`：主服务器 URL。
- `channels.matrix.userId`：Matrix 用户 ID（使用访问令牌时可选）。
- `channels.matrix.accessToken`：访问令牌。
- `channels.matrix.password`：登录密码（令牌会被存储）。
- `channels.matrix.deviceName`：设备显示名称。
- `channels.matrix.encryption`：启用 E2EE（默认：false）。
- `channels.matrix.initialSyncLimit`：初始同步限制。
- `channels.matrix.threadReplies`：`off | inbound | always`（默认：inbound）。
- `channels.matrix.textChunkLimit`：出站文本分块大小（字符）。
- `channels.matrix.chunkMode`：`length`（默认）或 `newline`，在长度分块前按空行（段落边界）分割。
- `channels.matrix.dm.policy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.matrix.dm.allowFrom`：私信允许列表（需完整 Matrix 用户 ID）。`open` 需要 `"*"`。向导在可能时将名称解析为 ID。
- `channels.matrix.groupPolicy`：`allowlist | open | disabled`（默认：allowlist）。
- `channels.matrix.groupAllowFrom`：群组消息的允许发送者列表（需完整 Matrix 用户 ID）。
- `channels.matrix.allowlistOnly`：强制私信 + 房间使用允许列表规则。
- `channels.matrix.groups`：群组允许列表 + 每个房间的设置映射。
- `channels.matrix.rooms`：旧版群组允许列表/配置。
- `channels.matrix.replyToMode`：话题/标签的 reply-to 模式。
- `channels.matrix.mediaMaxMb`：入站/出站媒体上限（MB）。
- `channels.matrix.autoJoin`：邀请处理（`always | allowlist | off`，默认：always）。
- `channels.matrix.autoJoinAllowlist`：自动加入的允许房间 ID/别名。
- `channels.matrix.actions`：每个操作的工具限制（reactions/messages/pins/memberInfo/channelInfo）。
