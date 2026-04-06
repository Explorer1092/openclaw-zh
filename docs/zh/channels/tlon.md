---
title: "Tlon"
mmh3_hash: "f36b0e039a631377ab681afe3e99663f"
summary: "Tlon/Urbit 支持状态、功能和配置"
read_when:
  - Working on Tlon/Urbit channel features
---

# Tlon

Tlon 是一个基于 Urbit 构建的去中心化通讯工具。OpenClaw 可以连接到您的 Urbit ship 并响应私信和群组聊天消息。群组回复默认需要 @ 提及，并且可以通过允许列表进一步限制。

状态：内置插件。支持私信、群组提及、帖子回复、富文本格式化和图片上传。通过[捆绑技能](#捆绑技能)支持反应。尚不支持投票。

## 内置插件

Tlon 在当前 OpenClaw 版本中作为内置插件提供，因此正常的打包构建无需单独安装。

如果您使用的是较旧的构建版本或不包含 Tlon 的自定义安装，请手动安装：

通过 CLI 安装（npm registry）：

```bash
openclaw plugins install @openclaw/tlon
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

详情：[插件](/tools/plugin)

## 设置

1. 确保 Tlon 插件可用。
   - 当前打包的 OpenClaw 版本已内置。
   - 较旧/自定义安装可使用上述命令手动添加。
2. 获取您的 ship URL 和登录代码。
3. 配置 `channels.tlon`。
4. 重启 gateway。
5. 向 bot 发送私信或在群组频道中提及它。

最小配置（单账户）：

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // 推荐：您的 ship，始终被允许
    },
  },
}
```

## 私有/局域网 Ship

默认情况下，OpenClaw 会阻止私有/内部主机名和 IP 范围以防止 SSRF 攻击。
如果您的 ship 运行在私有网络（localhost、局域网 IP 或内部主机名），
您必须显式选择加入：

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

⚠️ 仅当您信任本地网络时才启用此选项。此设置会禁用对 ship URL 请求的 SSRF 保护。

## 群组频道

默认启用自动发现。您也可以手动固定频道：

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

私信允许列表（空 = 不允许 DM，使用 `ownerShip` 进行审批流程）：

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

## 所有者和审批系统

设置所有者 ship 以在未授权用户尝试交互时接收审批请求：

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

所有者 ship **在任何地方自动获得授权**——私信邀请自动接受，频道消息始终被允许。您无需将所有者添加到 `dmAllowlist` 或 `defaultAuthorizedShips`。

设置后，所有者会收到以下情况的私信通知：

- 不在允许列表中的 ship 的私信请求
- 在没有授权的频道中的提及
- 群组邀请请求

## 自动接受设置

自动接受来自 dmAllowlist 中 ship 的私信邀请：

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

配合 `openclaw message send` 或 cron 投递使用：

- 私信：`~sampel-palnet` 或 `dm/~sampel-palnet`
- 群组：`chat/~host-ship/channel` 或 `group:~host-ship/channel`

## 捆绑技能

Tlon 插件包含一个捆绑技能（[`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill)），提供对 Tlon 操作的 CLI 访问：

- **联系人**：获取/更新个人资料、列出联系人
- **频道**：列表、创建、发布消息、获取历史记录
- **群组**：列表、创建、管理成员
- **私信**：发送消息、对消息做出反应
- **反应**：添加/移除帖子和私信的表情反应
- **设置**：通过 slash 命令管理插件权限

插件安装后技能自动可用。

## 功能

| 功能         | 状态                                      |
| ----------- | ----------------------------------------- |
| 私信         | ✅ 支持                                   |
| 群组/频道    | ✅ 支持（默认需要提及）                    |
| 帖子         | ✅ 支持（自动在帖子内回复）                |
| 富文本       | ✅ Markdown 转换为 Tlon 格式              |
| 图片         | ✅ 上传到 Tlon 存储                       |
| 反应         | ✅ 通过[捆绑技能](#捆绑技能)支持          |
| 投票         | ❌ 尚不支持                               |
| 原生命令     | ✅ 支持（默认仅所有者）                   |

## 故障排除

首先运行以下命令：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

常见问题：

- **私信被忽略**：发送者不在 `dmAllowlist` 中且未配置 `ownerShip` 用于审批流程。
- **群组消息被忽略**：频道未被发现或发送者未被授权。
- **连接错误**：检查 ship URL 是否可达；对本地 ship 启用 `allowPrivateNetwork`。
- **认证错误**：验证登录代码是否为最新（代码会轮换）。

## 配置参考

完整配置：[Configuration](/gateway/configuration)

Provider 选项：

- `channels.tlon.enabled`：启用/禁用频道启动。
- `channels.tlon.ship`：bot 的 Urbit ship 名称（例如 `~sampel-palnet`）。
- `channels.tlon.url`：ship URL（例如 `https://sampel-palnet.tlon.network`）。
- `channels.tlon.code`：ship 登录代码。
- `channels.tlon.allowPrivateNetwork`：允许 localhost/局域网 URL（SSRF 绕过）。
- `channels.tlon.ownerShip`：用于审批系统的所有者 ship（始终被授权）。
- `channels.tlon.dmAllowlist`：允许私信的 ship（空 = 无）。
- `channels.tlon.autoAcceptDmInvites`：自动接受来自允许列表 ship 的私信。
- `channels.tlon.autoAcceptGroupInvites`：自动接受所有群组邀请。
- `channels.tlon.autoDiscoverChannels`：自动发现群组频道（默认：true）。
- `channels.tlon.groupChannels`：手动固定的频道嵌套。
- `channels.tlon.defaultAuthorizedShips`：在所有频道中授权的 ship。
- `channels.tlon.authorization.channelRules`：每频道认证规则。
- `channels.tlon.showModelSignature`：在消息后附加模型名称。

## 注意事项

- 群组回复需要提及（例如 `~your-bot-ship`）才能响应。
- 帖子回复：如果接收到的消息在帖子中，OpenClaw 将在帖子内回复。
- 富文本：Markdown 格式（粗体、斜体、代码、标题、列表）被转换为 Tlon 的原生格式。
- 图片：URL 被上传到 Tlon 存储并作为图片块嵌入。

## 相关

- [Channels 概述](/channels) — 所有支持的 Channels
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Channel Routing](/channels/channel-routing) — 消息的 Session 路由
- [Security](/gateway/security) — 访问模型和安全加固
