---
mmh3_hash: "ad7a4884efc83b24a222e8b90ede1835"
summary: "统一的持久消息接收、发送、预览、编辑和流式生命周期设计方案"
read_when:
  - 重构 Channel 发送或接收行为
  - 修改 Channel 轮次、回复分发、出站队列、预览流式传输或 Plugin SDK 消息 API
  - 设计需要持久发送、回执、预览、编辑或重试的新 Channel Plugin
title: "消息生命周期重构"
---

本页是用单一持久消息生命周期替换分散的 Channel 轮次、回复分发、预览流式传输和出站传递辅助工具的目标设计。

简要版本：

- 核心原语应该是**接收**和**发送**，而不是**回复**。
- 回复只是出站消息上的一种关系。
- 轮次是入站处理便利，而不是传递的所有者。
- 发送必须基于上下文：`begin`、渲染、预览或流式传输、最终发送、提交、失败。
- 接收也必须基于上下文：规范化、去重、路由、记录、分发、平台确认、失败。
- 公开 Plugin SDK 应该简化为一个小型 Channel 消息接口。

## 问题

当前 Channel 栈从几个有效的本地需求中成长起来：

- 简单入站适配器使用 `runtime.channel.turn.run`。
- 富适配器使用 `runtime.channel.turn.runPrepared`。
- 旧版辅助工具使用 `dispatchInboundReplyWithBase`、`recordInboundSessionAndDispatchReply`、回复有效载荷辅助工具、回复分块、回复引用和出站运行时辅助工具。
- 预览流式传输存在于特定 Channel 的分发器中。
- 最终传递持久化正在围绕现有回复有效载荷路径添加。

这种形状修复了本地 Bug，但让 OpenClaw 拥有太多公开概念和太多传递语义可能漂移的地方。

暴露这个可靠性问题的是：

```text
Telegram 轮询更新已确认
  -> 助手最终文本存在
  -> 进程在 sendMessage 成功前重启
  -> 最终响应丢失
```

## 目标

- 所有 Channel 消息接收和发送路径的单一核心生命周期。
- 适配器声明重播安全行为后，新消息生命周期中默认持久化最终发送。
- 共享的预览、编辑、流式传输、最终化、重试、恢复和回执语义。
- 第三方 Plugin 可以学习和维护的小型 Plugin SDK 接口。
- 迁移期间对现有 `channel.turn` 调用方的兼容性。
- 新 Channel 能力的清晰扩展点。
- 核心中无平台特定分支。
- 无令牌增量 Channel 消息。Channel 流式传输保持消息预览、编辑、追加或完成块传递。
- 为操作/系统输出提供结构化的 OpenClaw 来源元数据，避免可见的 Gateway 失败在启用 bot 的共享房间中重新作为新提示进入。

## 核心模型

新域应位于内部核心命名空间下，如 `src/channels/message/*`。

它有四个概念：

```typescript
core.messages.receive(...)
core.messages.send(...)
core.messages.live(...)
core.messages.state(...)
```

`receive` 拥有入站生命周期。

`send` 拥有出站生命周期。

`live` 拥有预览、编辑、进度和流式状态。

`state` 拥有持久意图存储、回执、幂等性、恢复、锁和去重。

## 消息术语

### 消息

规范化消息是平台中立的：

```typescript
type ChannelMessage = {
  id: string;
  channel: string;
  accountId?: string;
  direction: "inbound" | "outbound";
  target: MessageTarget;
  sender?: MessageActor;
  body?: MessageBody;
  attachments?: MessageAttachment[];
  relation?: MessageRelation;
  origin?: MessageOrigin;
  timestamp?: number;
  raw?: unknown;
};
```

### 关系

回复是一种关系，而不是 API 根：

```typescript
type MessageRelation =
  | {
      kind: "reply";
      inboundMessageId?: string;
      replyToId?: string;
      threadId?: string;
      quote?: MessageQuote;
    }
  | {
      kind: "followup";
      sessionKey?: string;
      previousMessageId?: string;
    }
  | {
      kind: "broadcast";
      reason?: string;
    }
  | {
      kind: "system";
      reason:
        | "approval"
        | "task"
        | "hook"
        | "cron"
        | "subagent"
        | "message_tool"
        | "cli"
        | "control_ui"
        | "automation"
        | "error";
    };
```

### 回执

回执是一等公民，是从持久意图到未来编辑、删除、预览最终化、重复抑制和恢复的桥梁。

## 接收上下文

接收流程：

```text
平台事件
  -> 开始接收上下文
  -> 规范化
  -> 分类
  -> 去重和自我回声门控
  -> 路由和授权
  -> 记录入站 Session 元数据
  -> 分发 Agent 运行
  -> 持久出站发送通过发送上下文进行
  -> 提交接收
  -> 策略允许时确认平台
```

## 发送上下文

首选编排：

```typescript
await core.messages.withSendContext(message, async (ctx) => {
  const rendered = await ctx.render();

  if (ctx.preview?.canFinalizeInPlace) {
    return await ctx.edit(ctx.preview.receipt, rendered);
  }

  return await ctx.send(rendered);
});
```

## 持久性策略

持久性策略必须是显式的：

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` 表示核心在无法写入持久意图时必须以关闭方式失败。
`best_effort` 在持久化不可用时可以失败转移。
`disabled` 保留旧的直接发送行为。

## 迁移计划

### 第一阶段：内部消息域

添加 `src/channels/message/*` 类型。

### 第二阶段：持久发送核心

将现有出站队列从回复有效载荷持久化迁移到持久消息发送意图。

### 第三阶段：Channel 轮次桥接

在 `messages.receive` 和 `messages.send` 上重新实现 `channel.turn.run`。

### 第四阶段：准备分发器桥接

用发送上下文桥接替换 `deliverDurableInboundReplyPayload`。

### 第五阶段：统一实时生命周期

构建 `messages.live` 并迁移 Discord、Slack、Mattermost、Teams、QQ Bot 和 Feishu。

### 第六阶段：公开 SDK

添加 `openclaw/plugin-sdk/channel-message`。

### 第七阶段：所有发送方

将所有非回复出站生产者迁移到 `messages.send`。

### 第八阶段：弃用轮次

将 `channel.turn` 保留为包装器至少一个兼容性窗口。

## 相关

- [消息](/concepts/messages)
- [流式传输与分块](/concepts/streaming)
- [进度草稿](/concepts/progress-drafts)
- [重试策略](/concepts/retry)
- [Channel 轮次内核](/plugins/sdk-channel-turn)
