---
read_when:
  - 开发 Tlon/Urbit 渠道功能
summary: Tlon/Urbit 支持状态、功能和配置
title: Tlon
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: 128b12640fecf78745196472081d548e6051b2e5b02869df5a94c0c338061ab3
  source_path: channels/tlon.md
  workflow: 15
---

# Tlon（插件）

Tlon 是一个基于 Urbit 构建的去中心化即时通讯工具。OpenClaw 连接到你的 Urbit ship，可以响应私信和群聊消息。群组回复默认需要 @ 提及，并可通过允许列表进一步限制。

状态：通过插件支持。支持私信、群组提及、话题回复、富文本格式和图片上传。不支持表情回应和投票。

## 需要插件

Tlon 作为插件提供，不包含在核心安装中。

通过 CLI 安装（npm 仓库）：

```bash
openclaw plugins install @openclaw/tlon
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

详情：[插件](/tools/plugin)

## 设置

1. 安装 Tlon 插件。
2. 获取你的 ship URL 和登录代码。
3. 配置 `channels.tlon`。
4. 重启 Gateway 网关。
5. 私信机器人或在群组频道中提及它。

最小配置（单账户）：

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // 推荐：你的 ship，始终被允许
    },
  },
}
```

## 私有/局域网 ship

默认情况下，OpenClaw 会屏蔽私有/内网主机名和 IP 范围以防止 SSRF 攻击。
如果你的 ship 运行在私有网络（localhost、局域网 IP 或内网主机名），必须显式启用：

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

适用于以下 URL：

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

仅在你信任本地网络时启用此设置。该设置会禁用对 ship URL 请求的 SSRF 保护。

## 群组频道

默认启用自动发现。你也可以手动固定频道：

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

禁用自动发现：

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## 访问控制

私信允许列表（空 = 不允许私信，使用 `ownerShip` 进行审批流程）：

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
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
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

## 所有者与审批系统

设置所有者 ship，以便在未授权用户尝试互动时接收审批请求：

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

所有者 ship **在所有地方自动获得授权**——私信邀请自动接受，频道消息始终被允许。你不需要将所有者添加到 `dmAllowlist` 或 `defaultAuthorizedShips`。

设置后，所有者会收到以下情况的私信通知：

- 不在允许列表中的 ship 发来的私信请求
- 在未授权频道中的提及
- 群组邀请请求

## 自动接受设置

自动接受来自 `dmAllowlist` 中 ship 的私信邀请：

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

自动接受群组邀请：

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## 投递目标（CLI/cron）

与 `openclaw message send` 或 cron 投递一起使用：

- 私信：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群组：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 内置 Skill

Tlon 插件包含一个内置 Skill（[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)），提供对 Tlon 操作的 CLI 访问：

- **联系人**：获取/更新个人资料、列出联系人
- **频道**：列出、创建、发布消息、获取历史记录
- **群组**：列出、创建、管理成员
- **私信**：发送消息、对消息作出回应
- **回应**：对帖子和私信添加/移除表情回应
- **设置**：通过斜杠命令管理插件权限

安装插件后，Skill 会自动可用。

## 功能

| 功能     | 状态                             |
| -------- | -------------------------------- |
| 私信     | ✅ 支持                          |
| 群组/频道 | ✅ 支持（默认需要提及）          |
| 话题     | ✅ 支持（自动在话题内回复）      |
| 富文本   | ✅ Markdown 转换为 Tlon 格式     |
| 图片     | ✅ 上传到 Tlon 存储              |
| 回应     | ✅ 通过[内置 Skill](#内置-skill) |
| 投票     | ❌ 尚不支持                      |
| 原生命令 | ✅ 支持（默认仅所有者）          |

## 故障排除

先运行以下命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常见问题：

- **私信被忽略**：发送者不在 `dmAllowlist` 中且未配置 `ownerShip` 用于审批流程。
- **群组消息被忽略**：频道未被发现或发送者未获授权。
- **连接错误**：检查 ship URL 是否可达；对本地 ship 启用 `allowPrivateNetwork`。
- **认证错误**：验证登录代码是否是最新的（代码会轮换）。

## 配置参考

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.tlon.enabled`：启用/禁用渠道启动。
- `channels.tlon.ship`：机器人的 Urbit ship 名称（例如 `~sampel-palnet`）。
- `channels.tlon.url`：ship URL（例如 `https://sampel-palnet.tlon.network`）。
- `channels.tlon.code`：ship 登录代码。
- `channels.tlon.allowPrivateNetwork`：允许 localhost/局域网 URL（SSRF 绕过）。
- `channels.tlon.ownerShip`：审批系统的所有者 ship（始终获得授权）。
- `channels.tlon.dmAllowlist`：允许发送私信的 ship（空 = 无）。
- `channels.tlon.autoAcceptDmInvites`：自动接受来自允许列表中 ship 的私信。
- `channels.tlon.autoAcceptGroupInvites`：自动接受所有群组邀请。
- `channels.tlon.autoDiscoverChannels`：自动发现群组频道（默认：true）。
- `channels.tlon.groupChannels`：手动固定的频道嵌套。
- `channels.tlon.defaultAuthorizedShips`：对所有频道授权的 ship。
- `channels.tlon.authorization.channelRules`：每频道认证规则。
- `channels.tlon.showModelSignature`：在消息中附加模型名称。

## 注意事项

- 群组回复需要提及（例如 `~your-bot-ship`）才能响应。
- 话题回复：如果入站消息在话题中，OpenClaw 会在话题内回复。
- 富文本：Markdown 格式（粗体、斜体、代码、标题、列表）会转换为 Tlon 原生格式。
- 图片：URL 上传到 Tlon 存储并嵌入为图片块。
