---
mmh3_hash: "0bb9dc42b842eb03636b4e24afebfbfd"
summary: "消息 channel 的可复用发送者白名单"
read_when:
  - 跨多个消息 channel 配置相同的白名单
  - 共享私信和群组发送者访问规则
  - 审查消息 channel 的访问控制
title: "访问组"
---

访问组是您一次定义、通过 `accessGroup:<name>` 在 channel 白名单中引用的命名发送者列表。

当相同的人员需要在多个消息 channel 中获得授权时，或者当一个受信任的集合需要同时应用于私信和群组发送者授权时，请使用访问组。

访问组本身不授予访问权限。只有当白名单字段引用某个组时，该组才有意义。

## 静态消息发送者组

静态发送者组使用 `type: "message.senders"`。

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

成员列表以消息 channel id 为键：

| 键         | 含义                                                   |
| ---------- | ------------------------------------------------------ |
| `"*"`      | 对每个引用该组的消息 channel 都进行检查的共享条目。    |
| `discord`  | 仅在 Discord 白名单匹配时检查的条目。                  |
| `telegram` | 仅在 Telegram 白名单匹配时检查的条目。                 |
| `whatsapp` | 仅在 WhatsApp 白名单匹配时检查的条目。                 |

条目与目标 channel 的正常 `allowFrom` 规则匹配。OpenClaw 不会在 channel 之间转换发送者 id。如果 Alice 同时有 Telegram id 和 Discord id，请在相应的键下分别列出两个 id。

## 从白名单引用组

在消息 channel 路径支持发送者白名单的任何位置，使用 `accessGroup:<name>` 引用组。

私信白名单示例：

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

群组发送者白名单示例：

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

您可以混合使用组和直接条目：

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## 支持的消息 channel 路径

访问组可用于共享的消息 channel 授权路径，包括：

- 私信发送者白名单，例如 `channels.<channel>.allowFrom`
- 群组发送者白名单，例如 `channels.<channel>.groupAllowFrom`
- 使用相同发送者匹配规则的特定 channel 每房间发送者白名单
- 复用消息 channel 发送者白名单的命令授权路径

Channel 支持取决于该 channel 是否通过共享的 OpenClaw 发送者授权帮助程序进行连接。当前捆绑支持包括 Discord、Feishu、Google Chat、iMessage、LINE、Mattermost、Microsoft Teams、Nextcloud Talk、Nostr、QQBot、Signal、WhatsApp、Zalo 和 Zalo Personal。静态 `message.senders` 组设计为与 channel 无关，因此新的消息 channel 应通过使用共享的 Plugin SDK 帮助程序而不是自定义白名单扩展来支持它们。

## Plugin 诊断

Plugin 作者可以检查结构化访问组状态，而无需将其展开回扁平白名单：

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

结果报告已引用、已匹配、缺失、不支持和失败的组。当您需要诊断或一致性测试时使用此方法。仅在需要仍期望扁平 `allowFrom` 数组的兼容路径时才使用 `expandAllowFromWithAccessGroups(...)`。

## Discord channel 受众

Discord 还支持动态访问组类型：

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` 的含义是"允许当前可以查看此公会 channel 的 Discord 私信发送者"。OpenClaw 在授权时通过 Discord 解析发送者，并应用 Discord 的 `ViewChannel` 权限规则。

当 Discord channel 已经是团队的信息来源时（例如 `#maintainers` 或 `#on-call`），请使用此功能。

要求和失败行为：

- Bot 需要访问公会和 channel。
- Bot 需要 Discord Developer Portal 的 **Server Members Intent**。
- 当 Discord 返回 `Missing Access`、发送者无法解析为公会成员或 channel 属于另一个公会时，访问组以拒绝方式失败。

更多 Discord 特定示例：[Discord 访问控制](/channels/discord#access-control-and-routing)

## 安全说明

- 访问组是白名单别名，不是角色。它们本身不会创建所有者、批准配对请求或授予工具权限。
- `dmPolicy: "open"` 仍然需要在有效私信白名单中包含 `"*"`。引用访问组不等同于公开访问。
- 缺失的组名以拒绝方式失败。如果 `allowFrom` 包含 `accessGroup:operators` 但 `accessGroups.operators` 不存在，该条目不授权任何人。
- 保持 channel id 稳定。当 channel 同时支持数字/用户 id 和显示名称时，优先使用前者。

## 故障排除

如果发送者应该匹配但被阻止：

1. 确认白名单字段包含确切的 `accessGroup:<name>` 引用。
2. 确认 `accessGroups.<name>.type` 正确。
3. 确认发送者 id 列在匹配的 channel 键下，或在 `"*"` 下。
4. 确认条目使用该 channel 的正常白名单语法。
5. 对于 Discord channel 受众，确认 bot 可以看到公会 channel 并启用了 Server Members Intent。

编辑访问控制配置后运行 `openclaw doctor`。它在运行时之前捕获许多无效的白名单和策略组合。
