---
mmh3_hash: "d67fd0293e8016793d7755bebf1ee511"
title: 出站会话镜像重构(Issue #1520)
description: 跟踪出站会话镜像重构说明、决定、测试和待解决项目。
---

# 出站会话镜像重构(Issue #1520)

## 状态
- 进行中。
- 核心 + 插件通道路由已更新为出站镜像。
- 网关发送现在在省略 sessionKey 时派生目标会话。

## 背景
出站发送被镜像到*当前*代理会话(工具会话键)而不是目标通道会话。入站路由使用通道/对等会话键,因此出站响应落在错误的会话中,首次联系目标通常缺少会话条目。

## 目标
- 将出站消息镜像到目标通道会话键。
- 在出站时创建缺失的会话条目。
- 使线程/主题范围与入站会话键对齐。
- 涵盖核心通道加捆绑扩展。

## 实施摘要
- 新的出站会话路由助手:
  - `src/infra/outbound/outbound-session.ts`
  - `resolveOutboundSessionRoute` 使用 `buildAgentSessionKey` 构建目标 sessionKey(dmScope + identityLinks)。
  - `ensureOutboundSessionEntry` 通过 `recordSessionMetaFromInbound` 写入最小 `MsgContext`。
- `runMessageAction`(send)派生目标 sessionKey 并将其传递给 `executeSendAction` 以进行镜像。
- `message-tool` 不再直接镜像;它仅从当前会话键解析 agentId。
- 插件发送路径使用派生的 sessionKey 通过 `appendAssistantMessageToSessionTranscript` 镜像。
- 网关发送在未提供时派生目标会话键(默认代理),并确保会话条目。

## 线程/主题处理
- Slack: replyTo/threadId -> `resolveThreadSessionKeys`(后缀)。
- Discord: threadId/replyTo -> `resolveThreadSessionKeys` with `useSuffix=false` 以匹配入站(线程通道 id 已经范围会话)。
- Telegram: 主题 ID 通过 `buildTelegramGroupPeerId` 映射到 `chatId:topic:<id>`。

## 涵盖的扩展
- Matrix、MS Teams、Mattermost、BlueBubbles、Nextcloud Talk、Zalo、Zalo Personal、Nostr、Tlon。
- 注意事项:
  - Mattermost 目标现在为 DM 会话键路由剥离 `@`。
  - Zalo Personal 对 1:1 目标使用 DM 对等类型(仅当存在 `group:` 时为组)。
  - BlueBubbles 组目标剥离 `chat_*` 前缀以匹配入站会话键。
  - Slack 自动线程镜像不区分大小写地匹配通道 id。
  - 网关发送在镜像之前将提供的会话键小写。

## 决定
- **网关发送会话派生**: 如果提供了 `sessionKey`,则使用它。如果省略,则从目标 + 默认代理派生 sessionKey 并在那里镜像。
- **会话条目创建**: 始终使用 `recordSessionMetaFromInbound` with `Provider/From/To/ChatType/AccountId/Originating*` 与入站格式对齐。
- **目标规范化**: 出站路由使用已解析的目标(post `resolveChannelTarget`)(如果可用)。
- **会话键大小写**: 在写入和迁移期间将会话键规范化为小写。

## 添加/更新的测试
- `src/infra/outbound/outbound-session.test.ts`
  - Slack 线程会话键。
  - Telegram 主题会话键。
  - 带有 Discord 的 dmScope identityLinks。
- `src/agents/tools/message-tool.test.ts`
  - 从会话键派生 agentId(未传递 sessionKey)。
- `src/gateway/server-methods/send.test.ts`
  - 在省略时派生会话键并创建会话条目。

## 待解决项目 / 后续步骤
- voice-call 插件使用自定义 `voice:<phone>` 会话键。出站映射在这里不标准化;如果 message-tool 应该支持 voice-call 发送,添加显式映射。
- 确认任何外部插件是否使用超出捆绑集的非标准 `From/To` 格式。

## 触及的文件
- `src/infra/outbound/outbound-session.ts`
- `src/infra/outbound/outbound-send-service.ts`
- `src/infra/outbound/message-action-runner.ts`
- `src/agents/tools/message-tool.ts`
- `src/gateway/server-methods/send.ts`
- 测试在:
  - `src/infra/outbound/outbound-session.test.ts`
  - `src/agents/tools/message-tool.test.ts`
  - `src/gateway/server-methods/send.test.ts`
