---
mmh3_hash: "f398ec8a02465bb68918e695df6237aa"
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

目标不变量比 Telegram 更广泛：一旦核心决定某个可见出站消息应该存在，该意图必须在尝试平台发送之前持久化，且平台回执必须在成功后提交。这给了 OpenClaw 至少一次的恢复能力。精确一次的行为仅适用于能够证明原生幂等性或在重播前针对平台状态调和未知发送尝试的适配器。

这是本次重构的最终状态，而不是对每条现有路径的描述。在迁移期间，当持久队列写入失败时，现有出站辅助工具仍然可以回退到直接发送。只有当持久最终发送以关闭方式失败或明确选择带有文档说明的非持久策略时，重构才算完成。

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

## 非目标

- 不在第一阶段移除 `runtime.channel.turn.*`。
- 不强迫每个 Channel 采用相同的原生传输行为。
- 不教核心 Telegram 话题、Slack 原生流、Matrix 消息撤回、Feishu 卡片、QQ 语音或 Teams 活动。
- 不将所有内部迁移辅助工具发布为稳定的 SDK API。
- 不让重试重播已完成的非幂等平台操作。

## 参考模型

Vercel Chat 有一个好的公开思维模型：

- `Chat`
- `Thread`
- `Channel`
- `Message`
- 适配器方法，如 `postMessage`、`editMessage`、`deleteMessage`、`stream`、`startTyping` 和历史获取
- 用于去重、锁、队列和持久化的状态适配器

OpenClaw 应该借鉴其词汇，而不是复制其接口。

OpenClaw 在该模型之外还需要：

- 在直接传输调用之前持久化出站发送意图。
- 带有 begin、commit 和 fail 的显式发送上下文。
- 知晓平台确认策略的接收上下文。
- 在重启后仍存在且可以驱动编辑、删除、恢复和重复抑制的回执。
- 更小的公开 SDK。捆绑 Plugin 可以使用内部运行时辅助工具，但第三方 Plugin 应该看到一个一致的消息 API。
- Agent 特定行为：Session、转录、块流式传输、工具进度、审批、媒体指令、静默回复和群组提及历史。

`thread.post()` 风格的 Promise 对于 OpenClaw 来说是不够的。它们隐藏了决定发送是否可恢复的事务边界。

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

### Target

Target 描述了消息所在的位置：

```typescript
type MessageTarget = {
  kind: "direct" | "group" | "channel" | "thread";
  id: string;
  label?: string;
  spaceId?: string;
  parentId?: string;
  threadId?: string;
  nativeChannelId?: string;
};
```

### Relation

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

这让同一个发送路径可以处理普通回复、Cron 通知、审批提示、任务完成、消息工具发送、CLI 或 Control UI 发送、子 Agent 结果以及自动化发送。

### Origin

Origin 描述了谁产生了消息以及 OpenClaw 应该如何处理该消息的回声。它与 Relation 是分开的：一条消息可以是对用户的回复，同时仍然是 OpenClaw 产生的操作输出。

```typescript
type MessageOrigin =
  | {
      source: "openclaw";
      schemaVersion: 1;
      kind: "gateway_failure";
      code: "agent_failed_before_reply" | "missing_api_key" | "model_login_expired";
      echoPolicy: "drop_bot_room_echo";
    }
  | {
      source: "user" | "external_bot" | "platform" | "unknown";
    };
```

核心拥有 OpenClaw 产生输出的含义。Channel 拥有该 Origin 如何编码到它们的传输中。

第一个必需的用例是 Gateway 失败输出。人类仍然应该看到诸如"Agent 在回复前失败"或"缺少 API 密钥"之类的消息，但当启用 `allowBots` 时，标记的 OpenClaw 操作输出不得在共享房间中被接受为 bot 编写的输入。

### Receipt

回执是一等公民：

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  sentAt: number;
  raw?: unknown;
};

type MessageReceiptPart = {
  platformMessageId: string;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  index: number;
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  url?: string;
  raw?: unknown;
};
```

回执是从持久意图到未来编辑、删除、预览最终化、重复抑制和恢复的桥梁。

回执可以描述一条平台消息或多部分传递。分块文本、媒体加文本、语音加文本和卡片回退必须保留所有平台 id，同时仍为线程和后续编辑公开一个主 id。

## 接收上下文

接收不应该是一个简单的辅助工具调用。核心需要一个知晓去重、路由、Session 记录和平台确认策略的上下文。

```typescript
type MessageReceiveContext = {
  id: string;
  channel: string;
  accountId?: string;
  input: ChannelMessage;
  ack: ReceiveAckController;
  route: MessageRouteController;
  session: MessageSessionController;
  log: MessageLifecycleLogger;

  dedupe(): Promise<ReceiveDedupeResult>;
  resolve(): Promise<ResolvedInboundMessage>;
  record(resolved: ResolvedInboundMessage): Promise<RecordResult>;
  dispatch(recorded: RecordResult): Promise<DispatchResult>;
  commit(result: DispatchResult): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

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

确认不是一件事。接收合约必须将这些信号分开：

- **传输确认：** 告诉平台 webhook 或 socket OpenClaw 接受了事件信封。某些平台要求在分发前完成此操作。
- **轮询偏移确认：** 推进游标以避免重复获取相同事件。不能推进到无法恢复的工作之后。
- **入站记录确认：** 确认 OpenClaw 持久化了足够的入站元数据以去重和路由重新传递。
- **用户可见回执：** 可选的已读/状态/输入行为；永远不是持久性边界。

`ReceiveAckPolicy` 仅控制传输或轮询确认。不得重用于已读回执或状态反应。

在 bot 授权之前，接收必须在 Channel 可以解码消息 Origin 元数据时应用共享的 OpenClaw 回声策略：

```typescript
function shouldDropOpenClawEcho(params: {
  origin?: MessageOrigin;
  isBotAuthor: boolean;
  isRoomish: boolean;
}): boolean {
  return (
    params.isBotAuthor &&
    params.isRoomish &&
    params.origin?.source === "openclaw" &&
    params.origin.kind === "gateway_failure" &&
    params.origin.echoPolicy === "drop_bot_room_echo"
  );
}
```

这种丢弃是基于标签的，而不是基于文本的。具有相同可见 Gateway 失败文本但没有 OpenClaw Origin 元数据的 bot 编写的房间消息仍然通过正常的 `allowBots` 授权。

确认策略是显式的：

```typescript
type ReceiveAckPolicy =
  | { kind: "immediate"; reason: "webhook-timeout" | "platform-contract" }
  | { kind: "after-record" }
  | { kind: "after-durable-send" }
  | { kind: "manual" };
```

Telegram 轮询现在对其持久化的重启水位使用接收上下文确认策略。跟踪器仍然在中间件链中观察 grammY 更新，但 OpenClaw 在成功分发后只持久化安全的已完成更新 id，使失败或较低的待处理更新在重启后可重播。Telegram 的上游 `getUpdates` 获取偏移仍由轮询库控制，因此如果我们需要超出 OpenClaw 重启水位的平台级重新传递，剩余的更深层切割是一个完全持久化的轮询源。Webhook 平台可能需要立即的 HTTP 确认，但它们仍然需要入站去重和持久出站发送意图，因为 webhook 可以重新传递。

## 发送上下文

发送也是基于上下文的：

```typescript
type MessageSendContext = {
  id: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  intent: DurableSendIntent;
  attempt: number;
  signal: AbortSignal;
  previousReceipt?: MessageReceipt;
  preview?: LiveMessageState;
  log: MessageLifecycleLogger;

  render(): Promise<RenderedMessageBatch>;
  previewUpdate(rendered: RenderedMessageBatch): Promise<LiveMessageState>;
  send(rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit(receipt: MessageReceipt, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  delete(receipt: MessageReceipt): Promise<void>;
  commit(receipt: MessageReceipt): Promise<void>;
  fail(error: unknown): Promise<void>;
};
```

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

辅助工具展开为：

```text
开始持久意图
  -> 渲染
  -> 可选的预览/编辑/流式传输工作
  -> 标记发送中
  -> 最终平台发送或最终编辑
  -> 用原始回执标记提交中
  -> 提交回执
  -> 确认持久意图
  -> 在分类失败时失败持久意图
```

意图必须在传输 I/O 之前存在。begin 之后但 commit 之前的重启是可恢复的。

危险边界是在平台成功之后和回执提交之前。如果进程在那里死亡，除非适配器提供原生幂等性或回执调和路径，否则 OpenClaw 无法知道平台消息是否存在。那些尝试必须在 `unknown_after_send` 中恢复，而不是盲目重播。没有调和功能的 Channel 可以选择至少一次重播，前提是重复的可见消息对于该 Channel 和 Relation 是可接受的、有文档记录的权衡。当前 SDK 调和桥接需要适配器声明 `reconcileUnknownSend`，然后要求 `durableFinal.reconcileUnknownSend` 将未知条目分类为 `sent`、`not_sent` 或 `unresolved`；只有 `not_sent` 允许重播，未解决的条目保持终止状态或只重试调和检查。

持久性策略必须是显式的：

```typescript
type MessageDurabilityPolicy = "required" | "best_effort" | "disabled";
```

`required` 表示核心在无法写入持久意图时必须以关闭方式失败。`best_effort` 在持久化不可用时可以失败转移。`disabled` 保留旧的直接发送行为。在迁移期间，旧版包装器和公开兼容性辅助工具默认为 `disabled`；它们不得仅仅因为 Channel 有通用出站适配器就推断出 `required`。

发送上下文还拥有 Channel 本地的发送后效果。如果持久传递绕过了之前附加到 Channel 直接发送路径的本地行为，迁移就不安全。示例包括自我回声抑制缓存、线程参与标记、原生编辑锚点、模型签名渲染和平台特定的重复防护。这些效果必须在该 Channel 启用持久通用最终传递之前，要么移入发送适配器、渲染适配器，要么移入命名的发送上下文 Hook。

发送辅助工具必须将回执一路返回给其调用方。持久包装器不能吞掉消息 id 或用 `undefined` 替换 Channel 传递结果；缓冲分发器使用这些 id 作为线程锚点、后续编辑、预览最终化和重复抑制。

回退发送在批次上操作，而不是单个有效载荷。静默回复重写、媒体回退、卡片回退和块投影都可以产生多个可传递消息，因此发送上下文必须传递整个投影批次，或明确说明为何只有一个有效载荷有效。

```typescript
type RenderedMessageBatch = {
  units: RenderedMessageUnit[];
  atomicity: "all_or_retry_remaining" | "best_effort_parts";
  idempotencyKey: string;
};

type RenderedMessageUnit = {
  index: number;
  kind: "text" | "media" | "voice" | "card" | "preview" | "unknown";
  payload: unknown;
  required: boolean;
};
```

当这样的回退是持久化的时，整个投影批次必须由一个持久发送意图或另一个原子批次计划表示。逐一记录每个有效载荷是不够的：在有效载荷之间崩溃可能会留下一个部分可见的回退，而没有剩余有效载荷的持久记录。恢复必须知道哪些单元已经有回执，并且要么只重播缺失的单元，要么将批次标记为 `unknown_after_send`，直到适配器调和它。

## 实时上下文

预览、编辑、进度和流式传输行为应该是一个可选的生命周期。

```typescript
type MessageLiveAdapter = {
  begin?(ctx: MessageSendContext): Promise<LiveMessageState>;
  update?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    update: LiveMessageUpdate,
  ): Promise<LiveMessageState>;
  finalize?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    final: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  cancel?(
    ctx: MessageSendContext,
    state: LiveMessageState,
    reason: LiveCancelReason,
  ): Promise<void>;
};
```

实时状态足够持久以恢复或抑制重复：

```typescript
type LiveMessageState = {
  mode: "partial" | "block" | "progress" | "native";
  receipt?: MessageReceipt;
  visibleSince?: number;
  canFinalizeInPlace: boolean;
  lastRenderedHash?: string;
  staleAfterMs?: number;
};
```

这应该覆盖当前行为：

- Telegram 发送加编辑预览，以及在预览过期后重新最终发送。
- Discord 发送加编辑预览，在媒体/错误/显式回复时取消。
- Slack 原生流或草稿预览，取决于线程形状。
- Mattermost 草稿帖子最终化。
- Matrix 草稿事件最终化或不匹配时的撤回。
- Teams 原生进度流。
- QQ Bot 流或累积回退。

## 适配器接口

公开 SDK 目标应该是一个子路径：

```typescript
import { defineChannelMessageAdapter } from "openclaw/plugin-sdk/channel-message";
```

目标形状：

```typescript
type ChannelMessageAdapter = {
  receive?: MessageReceiveAdapter;
  send: MessageSendAdapter;
  live?: MessageLiveAdapter;
  origin?: MessageOriginAdapter;
  render?: MessageRenderAdapter;
  capabilities: MessageCapabilities;
};
```

发送适配器：

```typescript
type MessageSendAdapter = {
  send(ctx: MessageSendContext, rendered: RenderedMessageBatch): Promise<MessageReceipt>;
  edit?(
    ctx: MessageSendContext,
    receipt: MessageReceipt,
    rendered: RenderedMessageBatch,
  ): Promise<MessageReceipt>;
  delete?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  classifyError?(ctx: MessageSendContext, error: unknown): DeliveryFailureKind;
  reconcileUnknownSend?(ctx: MessageSendContext): Promise<MessageReceipt | null>;
  afterSendSuccess?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
  afterCommit?(ctx: MessageSendContext, receipt: MessageReceipt): Promise<void>;
};
```

接收适配器：

```typescript
type MessageReceiveAdapter<TRaw = unknown> = {
  normalize(raw: TRaw, ctx: MessageNormalizeContext): Promise<ChannelMessage>;
  classify?(message: ChannelMessage): Promise<MessageEventClass>;
  preflight?(message: ChannelMessage, event: MessageEventClass): Promise<MessagePreflightResult>;
  ackPolicy?(message: ChannelMessage, event: MessageEventClass): ReceiveAckPolicy;
};
```

在预检授权之前，每当 `origin.decode` 返回 OpenClaw Origin 元数据时，核心必须运行共享的 OpenClaw 回声断言。接收适配器提供平台事实，如 bot 作者和房间形状；核心拥有丢弃决策和排序，以避免 Channel 重新实现文本过滤器。

Origin 适配器：

```typescript
type MessageOriginAdapter<TRaw = unknown, TNative = unknown> = {
  encode?(origin: MessageOrigin): TNative | undefined;
  decode?(raw: TRaw): MessageOrigin | undefined;
};
```

核心设置 `MessageOrigin`。Channel 只将其翻译为原生传输元数据。Slack 将其映射到 `chat.postMessage({ metadata })` 和入站 `message.metadata`；Matrix 可以将其映射到额外的事件内容；没有原生元数据的 Channel 可以使用回执/出站注册表作为最佳近似。

能力：

```typescript
type MessageCapabilities = {
  text: { maxLength?: number; chunking?: boolean };
  attachments?: {
    upload: boolean;
    remoteUrl: boolean;
    voice?: boolean;
  };
  threads?: {
    reply: boolean;
    topic?: boolean;
    nativeThread?: boolean;
  };
  live?: {
    edit: boolean;
    delete: boolean;
    nativeStream?: boolean;
    progress?: boolean;
  };
  delivery?: {
    idempotencyKey?: boolean;
    retryAfter?: boolean;
    receiptRequired?: boolean;
  };
};
```

## 公开 SDK 精简

新公开接口应该吸收或弃用以下概念区域：

- `reply-runtime`
- `reply-dispatch-runtime`
- `reply-reference`
- `reply-chunking`
- `reply-payload`
- `inbound-reply-dispatch`
- `channel-reply-pipeline`
- 大多数公开的 `outbound-runtime` 用法
- 临时草稿流式生命周期辅助工具

兼容性子路径可以保留为包装器，但新的第三方 Plugin 不应该需要它们。

捆绑 Plugin 可以通过保留的运行时子路径保持内部辅助工具导入，同时进行迁移。公开文档应该在 `plugin-sdk/channel-message` 存在后引导 Plugin 作者使用它。

## 与 Channel 轮次的关系

`runtime.channel.turn.*` 应该在迁移期间保留。

它应该成为兼容性适配器：

```text
channel.turn.run
  -> messages.receive 上下文
  -> Session 分发
  -> 可见输出的 messages.send 上下文
```

`channel.turn.runPrepared` 也应该初始保留：

```text
Channel 拥有的分发器
  -> messages.receive 记录/最终化桥接
  -> 预览/进度的 messages.live
  -> 最终传递的 messages.send
```

所有捆绑 Plugin 和已知第三方兼容性路径都桥接后，`channel.turn` 可以被弃用。在有已发布的 SDK 迁移路径和证明旧 Plugin 仍然工作或以明确版本错误失败的合约测试之前，不应移除它。

## 兼容性护栏

在迁移期间，对于任何现有传递回调具有"发送此有效载荷"之外副作用的 Channel，通用持久传递是可选加入的。

旧版入口点默认为非持久：

- `channel.turn.run` 和 `dispatchAssembledChannelTurn` 使用 Channel 的传递回调，除非该 Channel 明确提供经过审计的持久策略/选项对象。
- `channel.turn.runPrepared` 保持 Channel 拥有，直到准备好的分发器显式调用发送上下文。
- 公开兼容性辅助工具，如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 和直接 DM 辅助工具，永远不会在调用方提供的 `deliver` 或 `reply` 回调之前注入通用持久传递。

对于迁移桥接类型，`durable: undefined` 表示"非持久"。持久路径仅由显式策略/选项值启用。`durable: false` 可以保留为兼容性拼写，但实现不应要求每个未迁移的 Channel 都添加它。

当前桥接代码必须保持持久性决策显式：

- 持久最终传递返回一个判别状态。`handled_visible` 和 `handled_no_send` 是终止的；`unsupported` 和 `not_applicable` 可以回退到 Channel 拥有的传递；`failed` 传播发送失败。
- 通用持久最终传递由适配器能力（如静默传递、回复目标保留、原生引用保留和消息发送 Hook）门控。缺失的对等性应选择 Channel 拥有的传递，而不是更改用户可见行为的通用发送。
- 队列支持的持久发送公开传递意图引用。现有的 `pendingFinalDelivery*` Session 字段可以在过渡期间携带意图 id；最终状态是 `MessageSendIntent` 存储，而不是冻结的回复文本加临时上下文字段。

在以下所有条件都为真之前，不要为 Channel 启用通用持久路径：

- 通用发送适配器执行与旧直接路径相同的渲染和传输行为。
- 本地发送后副作用通过发送上下文保留。
- 适配器返回包含所有平台消息 id 的回执或传递结果。
- 准备好的分发器路径要么调用新的发送上下文，要么保持文档化为持久保证之外。
- 回退传递处理每个投影有效载荷，而不仅仅是第一个。
- 持久回退传递将整个投影有效载荷数组记录为一个可重播意图或批次计划。

需要保留的具体迁移危险：

- iMessage 监控传递在成功发送后将已发送消息记录在回声缓存中。持久最终发送必须仍然填充该缓存，否则 OpenClaw 可能会将自己的最终回复重新摄取为入站用户消息。
- Tlon 在群组回复后附加可选的模型签名并记录参与的线程。通用持久传递不得绕过这些效果；要么将它们移入 Tlon 渲染/发送/最终化适配器，要么将 Tlon 保留在 Channel 拥有的路径上。
- Discord 和其他准备好的分发器已经拥有直接传递和预览行为。在其准备好的分发器明确通过发送上下文路由最终消息之前，它们不受组装轮次持久保证的覆盖。
- Telegram 静默回退传递必须传递整个投影有效载荷数组。单有效载荷快捷方式在投影后可能会丢弃额外的回退有效载荷。
- LINE、Zalo、Nostr 和其他现有组装/辅助路径可能有回复令牌处理、媒体代理、已发送消息缓存、加载/状态清理或仅回调目标。在这些语义由发送适配器表示并通过测试验证之前，它们保留在 Channel 拥有的传递上。
- 直接 DM 辅助工具可以有一个回调，它是唯一正确的传输目标。通用出站不得从 `OriginatingTo` 或 `To` 猜测并跳过该回调。
- OpenClaw Gateway 失败输出必须对人类保持可见，但标记的 bot 编写的房间回声必须在 `allowBots` 授权之前被丢弃。Channel 不得使用可见文本前缀过滤器实现这一点，除非作为短期紧急措施；持久合约是结构化的 Origin 元数据。

## 内部存储

持久队列应存储消息发送意图，而不是回复有效载荷。

```typescript
type DurableSendIntent = {
  id: string;
  idempotencyKey: string;
  channel: string;
  accountId?: string;
  message: ChannelMessage;
  batch?: RenderedMessageBatch;
  liveState?: LiveMessageState;
  status:
    | "pending"
    | "sending"
    | "committing"
    | "unknown_after_send"
    | "sent"
    | "failed"
    | "cancelled";
  attempt: number;
  nextAttemptAt?: number;
  receipt?: MessageReceipt;
  partialReceipt?: MessageReceipt;
  failure?: DeliveryFailure;
  createdAt: number;
  updatedAt: number;
};
```

恢复循环：

```text
加载待处理或发送中的意图
  -> 获取幂等性锁
  -> 如果回执已提交则跳过
  -> 重建发送上下文
  -> 如果需要则渲染
  -> 如果需要则调和 unknown_after_send
  -> 调用适配器发送/编辑/最终化
  -> 提交回执，标记 unknown_after_send，或安排重试
```

队列应保留足够的身份信息，以便在重启后通过相同的账户、线程、目标、格式策略和媒体规则重播。

## 失败类别

Channel 适配器将传输失败分类为封闭类别：

```typescript
type DeliveryFailureKind =
  | "transient"
  | "rate_limit"
  | "auth"
  | "permission"
  | "not_found"
  | "invalid_payload"
  | "conflict"
  | "cancelled"
  | "unknown";
```

核心策略：

- 重试 `transient` 和 `rate_limit`。
- 除非存在渲染回退，否则不重试 `invalid_payload`。
- 在配置更改之前不重试 `auth` 或 `permission`。
- 对于 `not_found`，当 Channel 声明安全时，让实时最终化从编辑回退到重新发送。
- 对于 `conflict`，使用回执/幂等性规则决定消息是否已经存在。
- 在适配器可能已完成平台 I/O 之后但回执提交之前的任何错误都变为 `unknown_after_send`，除非适配器可以证明平台操作没有发生。

## Channel 映射

| Channel         | 目标迁移                                                                                                                                                                                                                                                                                                                                                               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Telegram        | 接收确认策略加持久最终发送。实时适配器拥有发送加编辑预览、过期预览最终发送、话题、引用回复预览跳过、媒体回退和重试后处理。                                                                                                                                                                                                                                   |
| Discord         | 发送适配器包装现有的持久有效载荷传递。实时适配器拥有草稿编辑、进度草稿、媒体/错误预览取消、回复目标保留和消息 id 回执。审计共享房间中 bot 编写的 Gateway 失败回声；如果 Discord 无法在普通消息上携带 Origin 元数据，则使用出站注册表或其他原生等价物。 |
| Slack           | 发送适配器处理普通聊天帖子。实时适配器在线程形状支持时选择原生流，否则选择草稿预览。回执保留线程时间戳。Origin 适配器将 OpenClaw Gateway 失败映射到 Slack `chat.postMessage.metadata`，并在 `allowBots` 授权之前丢弃标记的 bot 房间回声。                                                                                                                  |
| WhatsApp        | 发送适配器拥有带持久最终意图的文本/媒体发送。接收适配器处理群组提及和发送者身份。在 WhatsApp 有可编辑传输之前，实时可以缺席。                                                                                                                                                                                                                                        |
| Matrix          | 实时适配器拥有草稿事件编辑、最终化、撤回、加密媒体约束和回复目标不匹配回退。接收适配器拥有加密事件水化和去重。Origin 适配器应将 OpenClaw Gateway 失败 Origin 编码到 Matrix 事件内容中，并在 `allowBots` 处理之前丢弃已配置 bot 的房间回声。              |
| Mattermost      | 实时适配器拥有一个草稿帖子、进度/工具折叠、就地最终化和重新发送回退。                                                                                                                                                                                                                                                                                       |
| Microsoft Teams | 实时适配器拥有原生进度和块流式传输行为。发送适配器拥有活动和附件/卡片回执。                                                                                                                                                                                                                                                                                        |
| Feishu          | 渲染适配器拥有文本/卡片/原始渲染。实时适配器拥有流式卡片和重复最终抑制。发送适配器拥有评论、话题 Session、媒体和语音抑制。                                                                                                                                                                                                                                      |
| QQ Bot          | 实时适配器拥有 C2C 流式传输、累积器超时和回退最终发送。渲染适配器拥有媒体标签和文本转语音。                                                                                                                                                                                                                                                               |
| Signal          | 简单的接收加发送适配器。除非 signal-cli 添加可靠的编辑支持，否则没有实时适配器。                                                                                                                                                                                                                                                                                |
| iMessage        | 简单的接收加发送适配器。iMessage 发送必须在持久最终消息能够绕过监控传递之前保留监控回声缓存填充。                                                                                                                                                                                                                                                                |
| Google Chat     | 简单的接收加发送适配器，线程关系映射到 space 和线程 id。在声明通用保护之前，审计 `allowBots=true` 房间行为中标记的 OpenClaw Gateway 失败回声。                                                                                                                                                                                                            |
| LINE            | 简单的接收加发送适配器，回复令牌约束建模为目标/关系能力。                                                                                                                                                                                                                                                                                                           |
| Nextcloud Talk  | SDK 接收桥接加发送适配器。                                                                                                                                                                                                                                                                                                                                          |
| IRC             | 简单的接收加发送适配器，无持久编辑回执。                                                                                                                                                                                                                                                                                                                            |
| Nostr           | 加密 DM 的接收加发送适配器；回执是事件 id。                                                                                                                                                                                                                                                                                                                        |
| QA Channel      | 用于接收、发送、实时、重试和恢复行为的合约测试适配器。                                                                                                                                                                                                                                                                                                              |
| Synology Chat   | 简单的接收加发送适配器。                                                                                                                                                                                                                                                                                                                                            |
| Tlon            | 在启用通用持久最终传递之前，发送适配器必须保留模型签名渲染和参与线程跟踪。                                                                                                                                                                                                                                                                                        |
| Twitch          | 简单的接收加发送适配器，带速率限制分类。                                                                                                                                                                                                                                                                                                                            |
| Zalo            | 简单的接收加发送适配器。                                                                                                                                                                                                                                                                                                                                            |
| Zalo Personal   | 简单的接收加发送适配器。                                                                                                                                                                                                                                                                                                                                            |

## 迁移计划

### 第一阶段：内部消息域

- 添加 `src/channels/message/*` 类型，用于消息、目标、关系、Origin、回执、能力、持久意图、接收上下文、发送上下文、实时上下文和失败类别。
- 将 `origin?: MessageOrigin` 添加到当前回复传递使用的迁移桥接有效载荷类型，然后随着重构替换回复有效载荷，将该字段移至 `ChannelMessage` 和渲染消息类型。
- 在适配器和测试证明形状之前保持内部。
- 为状态转换和序列化添加纯单元测试。

### 第二阶段：持久发送核心

- 将现有出站队列从回复有效载荷持久化迁移到持久消息发送意图。
- 让持久发送意图携带投影有效载荷数组或批次计划，而不仅仅是一个回复有效载荷。
- 通过兼容性转换保留当前队列恢复行为。
- 使 `deliverOutboundPayloads` 调用 `messages.send`。
- 在适配器声明重播安全性后，使最终发送持久化成为新消息生命周期中的默认值，并在无法写入持久意图时以关闭方式失败。现有 Channel 轮次和 SDK 兼容性路径在此阶段仍然默认直接发送。
- 一致地记录回执。
- 将回执和传递结果返回给原始分发器调用方，而不是将持久发送视为终止副作用。
- 通过持久发送意图保留消息 Origin，以便恢复、重播和分块发送保留 OpenClaw 操作来源。

### 第三阶段：Channel 轮次桥接

- 在 `messages.receive` 和 `messages.send` 之上重新实现 `channel.turn.run` 和 `dispatchAssembledChannelTurn`。
- 保持当前事实类型稳定。
- 默认保留旧版行为。只有当组装轮次 Channel 的适配器明确以重播安全持久化策略选择加入时，它才变为持久。
- 保留 `durable: false` 作为兼容性安全出口，用于最终化原生编辑且无法安全重播的路径，但不依赖 `false` 标记来保护未迁移的 Channel。
- 只有在新消息生命周期中，在 Channel 映射证明通用发送路径保留旧 Channel 传递语义之后，才默认组装轮次持久化。

### 第四阶段：准备分发器桥接

- 用发送上下文桥接替换 `deliverDurableInboundReplyPayload`。
- 将旧辅助工具保留为包装器。
- 首先移植 Telegram、WhatsApp、Slack、Signal、iMessage 和 Discord，因为它们已经有持久最终工作或更简单的发送路径。
- 将每个准备好的分发器视为未覆盖，直到它明确选择加入发送上下文。文档和变更日志条目必须说"组装 Channel 轮次"或命名迁移的 Channel 路径，而不是声明所有自动最终回复。
- 保持 `recordInboundSessionAndDispatchReply`、直接 DM 辅助工具和类似公开兼容性辅助工具的行为保留。它们以后可以公开显式的发送上下文选择加入，但不得在调用方拥有的传递回调之前自动尝试通用持久传递。

### 第五阶段：统一实时生命周期

- 使用两个证明适配器构建 `messages.live`：
  - Telegram 用于发送加编辑加过期最终发送。
  - Matrix 用于草稿最终化加撤回回退。
- 然后迁移 Discord、Slack、Mattermost、Teams、QQ Bot 和 Feishu。
- 只有在每个 Channel 有对等性测试之后才删除重复的预览最终化代码。

### 第六阶段：公开 SDK

- 添加 `openclaw/plugin-sdk/channel-message`。
- 将其记录为首选 Channel Plugin API。
- 更新包导出、入口点清单、生成的 API 基线和 Plugin SDK 文档。
- 在 Channel 消息 SDK 接口中包含 `MessageOrigin`、Origin 编码/解码 Hook 和共享的 `shouldDropOpenClawEcho` 断言。
- 为旧子路径保留兼容性包装器。
- 在捆绑 Plugin 迁移后，在文档中将回复命名的 SDK 辅助工具标记为弃用。

### 第七阶段：所有发送方

将所有非回复出站生产者迁移到 `messages.send`：

- Cron 和心跳通知
- 任务完成
- Hook 结果
- 审批提示和审批结果
- 消息工具发送
- 子 Agent 完成通告
- 显式 CLI 或 Control UI 发送
- 自动化/广播路径

这是模型从"Agent 回复"变成"OpenClaw 发送消息"的地方。

### 第八阶段：弃用轮次

- 将 `channel.turn` 保留为包装器至少一个兼容性窗口。
- 发布迁移说明。
- 针对旧导入运行 Plugin SDK 兼容性测试。
- 只有在没有捆绑 Plugin 需要旧内部辅助工具且第三方合约有稳定替换之后，才移除或隐藏它们。

## 测试计划

单元测试：

- 持久发送意图序列化和恢复。
- 幂等性密钥重用和重复抑制。
- 回执提交和重播跳过。
- 当适配器支持调和时，在重播前调和的 `unknown_after_send` 恢复。
- 失败分类策略。
- 接收确认策略排序。
- 回复、后续、系统和广播发送的关系映射。
- Gateway 失败 Origin 工厂和 `shouldDropOpenClawEcho` 断言。
- 通过有效载荷规范化、分块、持久队列序列化和恢复的 Origin 保留。

集成测试：

- `channel.turn.run` 简单适配器仍然记录和发送。
- 旧版组装事件传递不会变为持久，除非 Channel 明确选择加入。
- `channel.turn.runPrepared` 桥接仍然记录和最终化。
- 公开兼容性辅助工具默认调用调用方拥有的传递回调，不在这些回调之前进行通用发送。
- 持久回退传递在重启后重播整个投影有效载荷数组，且在早期崩溃后无法使后续有效载荷未记录。
- 持久组装事件传递将平台消息 id 返回给缓冲分发器。
- 自定义传递 Hook 在持久传递被禁用或不可用时仍返回平台消息 id。
- 最终回复在助手完成和平台发送之间的重启后仍然存在。
- 预览草稿在允许时就地最终化。
- 当媒体/错误/回复目标不匹配需要正常传递时，预览草稿被取消或撤回。
- 块流式传输和预览流式传输不会同时传递相同文本。
- 提前流式传输的媒体不会在最终传递中重复。

Channel 测试：

- 带轮询确认延迟的 Telegram 话题回复，直到接收上下文的安全完成水位。
- 接受但未传递的更新的 Telegram 轮询恢复，通过持久化的安全完成偏移模型覆盖。
- Telegram 过期预览发送重新最终发送并清理预览。
- Telegram 静默回退发送每个投影的回退有效载荷。
- Telegram 静默回退持久化以原子方式记录完整投影回退数组，而不是每次循环迭代一个单有效载荷持久意图。
- Discord 媒体/错误/显式回复时的预览取消。
- Discord 准备好的分发器最终消息在文档或变更日志声明 Discord 最终回复持久化之前通过发送上下文路由。
- iMessage 持久最终发送填充监控已发送消息回声缓存。
- LINE、Zalo 和 Nostr 旧版传递路径在其适配器对等性测试存在之前不被通用持久发送绕过。
- 直接 DM/Nostr 回调传递保持权威，除非明确迁移到完整消息目标和重播安全发送适配器。
- Slack 标记的 OpenClaw Gateway 失败消息在出站保持可见，标记的 bot 房间回声在 `allowBots` 之前丢弃，具有相同可见文本的未标记 bot 消息仍然遵循正常的 bot 授权。
- Slack 原生流在顶级 DM 中回退到草稿预览。
- Matrix 预览最终化和撤回回退。
- Matrix 已配置 bot 账户的标记 OpenClaw Gateway 失败房间回声在 `allowBots` 处理之前丢弃。
- Discord 和 Google Chat 共享房间 Gateway 失败级联审计在声明通用保护之前覆盖 `allowBots` 模式。
- Mattermost 草稿最终化和重新发送回退。
- Teams 原生进度最终化。
- Feishu 重复最终抑制。
- QQ Bot 累积器超时回退。
- Tlon 持久最终发送保留模型签名渲染和参与线程跟踪。
- WhatsApp、Signal、iMessage、Google Chat、LINE、IRC、Nostr、Nextcloud Talk、Synology Chat、Tlon、Twitch、Zalo 和 Zalo Personal 简单持久最终发送。

验证：

- 开发期间的目标 Vitest 文件。
- Testbox 中针对完整更改接口的 `pnpm check:changed`。
- 在登陆完整重构或公开 SDK/导出更改之后，Testbox 中更广泛的 `pnpm check`。
- 在移除兼容性包装器之前，对至少一个支持编辑的 Channel 和一个简单仅发送 Channel 进行实时或 QA Channel 冒烟测试。

## 未解决的问题

- Telegram 是否应该最终将 grammY 运行器源替换为完全持久化的轮询源，可以控制平台级重新传递，而不仅仅是 OpenClaw 的持久化重启水位。
- 持久实时预览状态是否应该存储在与最终发送意图相同的队列记录中，还是在相邻的实时状态存储中。
- 兼容性包装器在 `plugin-sdk/channel-message` 发布后保持文档记录多长时间。
- 第三方 Plugin 是否应该直接实现接收适配器，还是只通过 `defineChannelMessageAdapter` 提供规范化/发送/实时 Hook。
- 哪些回执字段可以安全地在公开 SDK 中公开，哪些是内部运行时状态。
- 自我回声缓存和参与线程标记等副作用是否应该建模为发送上下文 Hook、适配器拥有的最终化步骤或回执订阅者。
- 哪些 Channel 有原生 Origin 元数据，哪些需要持久化出站注册表，哪些无法提供可靠的跨 bot 回声抑制。

## 验收标准

- 每个捆绑消息 Channel 通过 `messages.send` 发送最终可见输出。
- 每个入站消息 Channel 通过 `messages.receive` 或文档化的兼容性包装器进入。
- 每个预览/编辑/流式传输 Channel 使用 `messages.live` 进行草稿状态和最终化。
- `channel.turn` 只是一个包装器。
- 回复命名的 SDK 辅助工具是兼容性导出，不是推荐路径。
- 持久恢复可以在重启后重播待处理的最终发送，而不会丢失最终响应或重复已提交的发送；平台结果未知的发送在重播前调和，或对该适配器记录为至少一次。
- 当无法写入持久意图时，持久最终发送以关闭方式失败，除非调用方明确选择了文档化的非持久模式。
- 旧版 Channel 轮次和 SDK 兼容性辅助工具默认为直接 Channel 拥有的传递；通用持久发送是明确的选择加入。
- 回执为多部分传递保留所有平台消息 id，并为线程/编辑方便提供主 id。
- 持久包装器在替换直接传递回调之前保留 Channel 本地副作用。
- 准备好的分发器在其最终传递路径明确使用发送上下文之前不计为持久。
- 回退传递处理每个投影有效载荷。
- 持久回退传递在一个可重播意图或批次计划中记录每个投影有效载荷。
- OpenClaw 产生的 Gateway 失败输出对人类可见，但标记的 bot 编写的房间回声在声明支持 Origin 合约的 Channel 上在 bot 授权之前被丢弃。
- 文档解释发送、接收、实时、状态、回执、关系、失败策略、迁移和测试覆盖。

## 相关

- [消息](/concepts/messages)
- [流式传输与分块](/concepts/streaming)
- [进度草稿](/concepts/progress-drafts)
- [重试策略](/concepts/retry)
- [Channel 轮次内核](/plugins/sdk-channel-turn)
