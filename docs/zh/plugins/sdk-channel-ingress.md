---
mmh3_hash: "971a7dd82e47b0980ced9dbff30bcba0"
summary: "用于入站消息授权的实验性 Channel Ingress API"
read_when:
  - 构建或迁移消息 Channel Plugin
  - 更改 DM 或群组允许列表、路由门控、命令认证、事件认证或提及激活
  - 审查 Channel Ingress 编辑保护标记或 SDK 兼容性边界
title: "Channel Ingress API"
sidebarTitle: "Channel Ingress"
---

# Channel Ingress API

Channel Ingress 是入站 Channel 事件的实验性访问控制边界。对接收路径使用 `openclaw/plugin-sdk/channel-ingress-runtime`。旧版 `openclaw/plugin-sdk/channel-ingress` 子路径作为第三方 Plugin 的已弃用兼容性门面保持导出。

Plugin 拥有平台事实和副作用。Core 拥有通用策略：DM/群组允许列表、配对存储 DM 条目、路由门控、命令门控、事件认证、提及激活、编辑保护诊断和准入。

## 运行时 Resolver

```ts
import {
  defineStableChannelIngressIdentity,
  resolveChannelMessageIngress,
} from "openclaw/plugin-sdk/channel-ingress-runtime";

const identity = defineStableChannelIngressIdentity({
  key: "platform-user-id",
  normalize: normalizePlatformUserId,
  sensitivity: "pii",
});

const result = await resolveChannelMessageIngress({
  channelId: "my-channel",
  accountId,
  identity,
  subject: { stableId: platformUserId },
  conversation: { kind: isGroup ? "group" : "direct", id: conversationId },
  event: { kind: "message", authMode: "inbound", mayPair: !isGroup },
  policy: {
    dmPolicy: config.dmPolicy,
    groupPolicy: config.groupPolicy,
    groupAllowFromFallbackToAllowFrom: true,
  },
  allowFrom: config.allowFrom,
  groupAllowFrom: config.groupAllowFrom,
  accessGroups: cfg.accessGroups,
  route,
  readStoreAllowFrom,
  command: hasControlCommand ? { allowTextCommands: true, hasControlCommand } : undefined,
});
```

不要预先计算有效允许列表、命令所有者或命令组。Resolver 从原始允许列表、存储回调、路由描述符、访问组、策略和会话类型中派生它们。

## 结果

Bundle Plugin 应直接使用现代投影：

- `ingress`：有序的门控决策和准入
- `senderAccess`：仅发送者/会话授权
- `routeAccess`：路由和路由发送者投影
- `commandAccess`：命令授权；当没有命令门控运行时为 false
- `activationAccess`：提及/激活结果

事件授权仍在有序的 `ingress.graph` 和决定性的 `ingress.reasonCode` 上可用；不会发出单独的事件投影。

已弃用的第三方 SDK 辅助函数可能会在内部重建旧版形状。新 Bundle 接收路径不应将现代结果转换回本地 DTO。

## 访问组

`accessGroup:<name>` 条目保持已编辑保护状态。Core 自己解析静态 `message.senders` 组，并仅对需要平台查找的动态组调用 `resolveAccessGroupMembership`。缺失、不支持和失败的组以关闭方式失败。

## 事件模式

| `authMode`       | 含义                                             |
| ---------------- | ------------------------------------------------ |
| `inbound`        | 正常入站发送者门控                               |
| `command`        | 回调或范围按钮的命令门控                         |
| `origin-subject` | Actor 必须与原始消息主体匹配                     |
| `route-only`     | 仅路由门控，用于路由范围的可信事件               |
| `none`           | Plugin 拥有的内部事件绕过共享认证                |

对反应、按钮、回调和原生命令使用 `mayPair: false`。

## 路由和激活

对房间、话题、群组、线程或嵌套路由策略使用路由描述符：

```ts
route: {
  id: "room",
  allowed: roomAllowed,
  enabled: roomEnabled,
  senderPolicy: "replace",
  senderAllowFrom: roomAllowFrom,
  blockReason: "room_sender_not_allowlisted",
}
```

当 Plugin 有多个可选路由描述符时使用 `channelIngressRoutes(...)`；它在保持路由事实通用且按每个描述符的 `precedence` 排序的同时过滤禁用的分支。

提及门控是激活门控。提及未命中返回 `admission: "skip"`，因此轮次内核不处理仅观察的轮次。大多数 Channel 应将激活保留在发送者和命令门控之后。在禁用文本命令绕过的情况下，必须在发送者允许列表噪声之前静默未提及流量的公共聊天界面可以选择 `activation.order: "before-sender"`。具有隐式激活（例如机器人线程中的回复）的 Channel 可以传递 `activation.allowedImplicitMentionKinds`；当命令或隐式激活绕过了显式提及时，投影的 `activationAccess.shouldBypassMention` 会报告此情况。

## 编辑保护标记

原始发送者值和原始允许列表条目仅为 Resolver 输入。它们不得出现在已解析状态、决策、诊断、快照或兼容性事实中。使用不透明的主体 ID、条目 ID、路由 ID 和诊断 ID。

## 验证

```bash
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts
pnpm plugin-sdk:api:check
```
