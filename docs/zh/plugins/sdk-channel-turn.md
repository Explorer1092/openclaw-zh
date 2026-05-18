---
mmh3_hash: "0fa832a87efb845be614cd9c248d8b63"
summary: "runtime.channel.turn -- 捆绑和第三方 Channel Plugin 用于记录、分发和终结 Agent 轮次的共享入站事件内核"
title: "Channel 轮次内核"
sidebarTitle: "Channel 轮次"
read_when:
  - 您正在构建 Channel Plugin 并需要共享入站事件生命周期
  - 您正在将 Channel 监控器从手动记录/分发粘合代码迁移
  - 您需要了解准入、摄取、分类、预检、解析、记录、分发和最终化阶段
doc-schema-version: 1
---

Channel 轮次内核是将规范化平台事件转换为 Agent 轮次的共享入站状态机。Channel Plugin 提供平台事实和交付回调。Core 拥有编排：摄取、分类、预检、解析、授权、组装、记录、分发和最终化。

当您的 Plugin 在入站消息热路径上时，请使用此方法。对于非消息事件（斜杠命令、模态框、按钮交互、生命周期事件、反应、语音状态），请将它们保留在 Plugin 本地。内核仅拥有可能成为 Agent 文本轮次的事件。

<Info>
  内核通过注入的 Plugin 运行时以 `runtime.channel.turn.*` 访问。Plugin 运行时类型从 `openclaw/plugin-sdk/core` 导出，因此第三方原生 Plugin 可以像捆绑 Channel Plugin 一样使用这些入口点。
</Info>

## 为何使用共享内核

Channel Plugin 重复相同的入站流：规范化、路由、门控、构建上下文、记录 Session 元数据、分发 Agent 轮次、最终化交付状态。没有共享内核，提及门控、工具专用可见回复、Session 元数据、待处理历史记录或分发最终化的更改必须按 Channel 应用。

内核刻意将四个概念分开：

- `ConversationFacts`：消息来自哪里
- `RouteFacts`：哪个 Agent 和 Session 应该处理它
- `ReplyPlanFacts`：可见回复应该去哪里
- `MessageFacts`：Agent 应该看到的正文和补充上下文

Slack DM、Telegram 话题、Matrix 线程和 Feishu 话题 Session 在实践中都区分这些内容。将它们视为一个标识符会随着时间推移导致漂移。

## 阶段生命周期

内核运行相同的固定管道，无论 Channel 如何：

1. `ingest` -- 适配器将原始平台事件转换为 `NormalizedTurnInput`
2. `classify` -- 适配器声明此事件是否可以启动 Agent 轮次
3. `preflight` -- 适配器执行去重、自我回声、水化、防抖、解密、部分事实预填充
4. `resolve` -- 适配器返回完全组装的轮次（路由、回复计划、消息、交付）
5. `authorize` -- DM、组、提及和命令策略应用于组装的事实
6. `assemble` -- 通过 `buildContext` 从事实构建 `FinalizedMsgContext`
7. `record` -- 入站 Session 元数据和最后路由持久化
8. `dispatch` -- Agent 轮次通过缓冲块调度器执行
9. `finalize` -- 适配器 `onFinalize` 即使在分发错误时也运行

当提供 `log` 回调时，每个阶段都会发出结构化日志事件。请参见[可观测性](#observability)。

## 准入类型

当轮次被门控时，内核不会抛出。它返回 `ChannelTurnAdmission`：

| 类型          | 时机                                                                                                                                         |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | 轮次被接受。Agent 轮次运行，可见回复路径被执行。                                                                                             |
| `observeOnly` | 轮次端到端运行但交付适配器不发送任何可见内容。用于广播观察者 Agent 和其他被动多 Agent 流。                                                   |
| `handled`     | 平台事件被本地消耗（生命周期、反应、按钮、模态框）。内核跳过分发。                                                                           |
| `drop`        | 跳过路径。可选的 `recordHistory: true` 将消息保留在待处理组历史记录中，以便未来的提及有上下文。                                              |

准入可以来自 `classify`（事件类说它不能启动轮次）、来自 `preflight`（去重、自我回声、缺少带历史记录的提及），或来自 `resolveTurn` 本身。

## 入口点

运行时公开三个首选入口点，以便适配器可以在与 Channel 匹配的级别选择加入。

```typescript
runtime.channel.turn.run(...)             // 适配器驱动的完整管道
runtime.channel.turn.runAssembled(...)    // 已构建的上下文 + 交付适配器
runtime.channel.turn.runPrepared(...)     // Channel 拥有分发；内核运行记录 + 最终化
runtime.channel.turn.buildContext(...)    // 纯事实到 FinalizedMsgContext 映射
```

两个旧版运行时助手保持可用以实现 Plugin SDK 兼容性：

```typescript
runtime.channel.turn.runResolved(...)      // 已弃用的兼容性别名；优先使用 run
runtime.channel.turn.dispatchAssembled(...) // 已弃用的兼容性别名；优先使用 runAssembled
```

### run

当您的 Channel 可以将其入站流表达为 `ChannelTurnAdapter<TRaw>` 时使用。适配器有用于 `ingest`、可选 `classify`、可选 `preflight`、强制 `resolveTurn` 和可选 `onFinalize` 的回调。

```typescript
await runtime.channel.turn.run({
  channel: "tlon",
  accountId,
  raw: platformEvent,
  adapter: {
    ingest(raw) {
      return {
        id: raw.messageId,
        timestamp: raw.timestamp,
        rawText: raw.body,
        textForAgent: raw.body,
      };
    },
    classify(input) {
      return { kind: "message", canStartAgentTurn: input.rawText.length > 0 };
    },
    async preflight(input, eventClass) {
      if (await isDuplicate(input.id)) {
        return { admission: { kind: "drop", reason: "dedupe" } };
      }
      return {};
    },
    resolveTurn(input) {
      return buildAssembledTurn(input);
    },
    onFinalize(result) {
      clearPendingGroupHistory(result);
    },
  },
});
```

当 Channel 有小型适配器逻辑并且通过钩子拥有生命周期时，`run` 是正确的形状。

### runAssembled

当 Channel 已经解析了路由、构建了 `FinalizedMsgContext`，并且只需要共享记录、回复管道、分发和最终化排序时使用。这是简单捆绑入站路径的首选形状，否则会重复 `createChannelMessageReplyPipeline(...)` 和 `runPrepared(...)` 样板代码。

```typescript
await runtime.channel.turn.runAssembled({
  cfg,
  channel: "irc",
  accountId,
  agentId: route.agentId,
  routeSessionKey: route.sessionKey,
  storePath,
  ctxPayload,
  recordInboundSession: runtime.channel.session.recordInboundSession,
  dispatchReplyWithBufferedBlockDispatcher:
    runtime.channel.reply.dispatchReplyWithBufferedBlockDispatcher,
  delivery: {
    deliver: async (payload) => {
      await sendPlatformReply(payload);
    },
    onError: (err, info) => {
      runtime.error?.(`reply ${info.kind} failed: ${String(err)}`);
    },
  },
});
```

当唯一的 Channel 拥有的分发行为是最终载荷交付加上可选的输入、回复选项、持久交付或错误日志时，选择 `runAssembled` 而不是 `runPrepared`。

### runPrepared

当 Channel 有具有预览、重试、编辑或必须保持 Channel 拥有的线程引导的复杂本地调度器时使用。内核仍然在分发之前记录入站 Session，并提供统一的 `DispatchedChannelTurnResult`。

```typescript
const { dispatchResult } = await runtime.channel.turn.runPrepared({
  channel: "matrix",
  accountId,
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  record: {
    onRecordError,
    updateLastRoute,
  },
  onPreDispatchFailure: async (err) => {
    await stopStatusReactions();
  },
  runDispatch: async () => {
    return await runMatrixOwnedDispatcher();
  },
});
```

丰富 Channel（Matrix、Mattermost、Microsoft Teams、Feishu、QQ Bot）使用 `runPrepared`，因为它们的调度器编排内核不应了解的特定于平台的行为。

### buildContext

将事实包映射到 `FinalizedMsgContext` 的纯函数。当您的 Channel 手动构建管道的一部分但需要一致的上下文形状时使用它。

```typescript
const ctxPayload = runtime.channel.turn.buildContext({
  channel: "googlechat",
  accountId,
  messageId,
  timestamp,
  from,
  sender,
  conversation,
  route,
  reply,
  message,
  access,
  media,
  supplemental,
});
```

`buildContext` 在为 `run` 组装轮次时，在 `resolveTurn` 回调中也很有用。

<Note>
  已弃用的 SDK 助手，如 `dispatchInboundReplyWithBase` 仍然通过组装轮次助手桥接。新 Plugin 代码应该使用 `run` 或 `runPrepared`。
</Note>

## 事实类型

内核从适配器消耗的事实是平台无关的。在将平台对象移交给内核之前，将其转换为这些形状。

### NormalizedTurnInput

| 字段              | 用途                                                                      |
| ----------------- | -------------------------------------------------------------------------- |
| `id`              | 用于去重和日志的稳定消息 ID                                               |
| `timestamp`       | 可选的 epoch 毫秒                                                         |
| `rawText`         | 从平台收到的正文                                                          |
| `textForAgent`    | 可选的 Agent 清理正文（提及剥离、输入修剪）                               |
| `textForCommands` | 可选的用于 `/command` 解析的正文                                          |
| `raw`             | 需要原始内容的适配器回调的可选传递引用                                    |

### ChannelEventClass

| 字段                   | 用途                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`、`command`、`interaction`、`reaction`、`lifecycle`、`unknown` |
| `canStartAgentTurn`    | 如果为 false，内核返回 `{ kind: "handled" }`                            |
| `requiresImmediateAck` | 需要在分发前确认的适配器提示                                            |

### SenderFacts

| 字段           | 用途                                                          |
| -------------- | ------------------------------------------------------------- |
| `id`           | 稳定的平台发送者 ID                                           |
| `name`         | 显示名称                                                      |
| `username`     | 不同于 `name` 时的句柄                                        |
| `tag`          | Discord 风格的鉴别器或平台标签                                |
| `roles`        | 角色 ID，用于成员角色白名单匹配                               |
| `isBot`        | 当发送者是已知机器人时为 true（内核用于丢弃）                 |
| `isSelf`       | 当发送者是配置的 Agent 本身时为 true                          |
| `displayLabel` | 用于信封文本的预渲染标签                                      |

### ConversationFacts

| 字段              | 用途                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `kind`            | `direct`、`group` 或 `channel`                                       |
| `id`              | 用于路由的会话 ID                                                    |
| `label`           | 信封的人性化标签                                                     |
| `spaceId`         | 可选的外部空间标识符（Slack 工作区、Matrix 主服务器）                |
| `parentId`        | 当这是线程时的外部会话 ID                                            |
| `threadId`        | 当此消息在线程内时的线程 ID                                          |
| `nativeChannelId` | 与路由 ID 不同时的平台原生 Channel ID                               |
| `routePeer`       | 用于 `resolveAgentRoute` 查找的对等方                                |

### RouteFacts

| 字段                    | 用途                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | 应该处理此轮次的 Agent                                     |
| `accountId`             | 可选的覆盖（多账户 Channel）                               |
| `routeSessionKey`       | 用于路由的 Session 键                                      |
| `dispatchSessionKey`    | 与路由键不同时在分发时使用的 Session 键                    |
| `persistedSessionKey`   | 写入持久 Session 元数据的 Session 键                       |
| `parentSessionKey`      | 分支/线程 Session 的父级                                   |
| `modelParentSessionKey` | 分支 Session 的模型侧父级                                  |
| `mainSessionKey`        | 直接对话的主要 DM 所有者固定                               |
| `createIfMissing`       | 允许记录步骤创建缺少的 Session 行                          |

### ReplyPlanFacts

| 字段                      | 用途                                                    |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | 写入上下文 `To` 的逻辑回复目标                          |
| `originatingTo`           | 发起上下文目标（`OriginatingTo`）                       |
| `nativeChannelId`         | 用于交付的平台原生 Channel ID                           |
| `replyTarget`             | 与 `to` 不同时的最终可见回复目的地                     |
| `deliveryTarget`          | 较低级别的交付覆盖                                      |
| `replyToId`               | 引用/锚定的消息 ID                                      |
| `replyToIdFull`           | 当平台有两者时的完整形式引用 ID                         |
| `messageThreadId`         | 交付时的线程 ID                                         |
| `threadParentId`          | 线程的父消息 ID                                         |
| `sourceReplyDeliveryMode` | `thread`、`reply`、`channel`、`direct` 或 `none`        |

### AccessFacts

`AccessFacts` 携带授权阶段需要的布尔值。身份匹配保留在 Channel 中：内核只消耗结果。

| 字段       | 用途                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | DM 允许/配对/拒绝决策和 `allowFrom` 列表                                 |
| `group`    | 组策略、路由允许、发送者允许、白名单、提及要求                            |
| `commands` | 跨配置授权者的命令授权                                                    |
| `mentions` | 是否可以检测提及以及 Agent 是否被提及                                     |

### MessageFacts

| 字段             | 用途                                                          |
| ---------------- | ------------------------------------------------------------- |
| `body`           | 最终信封正文（已格式化）                                      |
| `rawBody`        | 原始入站正文                                                  |
| `bodyForAgent`   | Agent 看到的正文                                              |
| `commandBody`    | 用于命令解析的正文                                            |
| `envelopeFrom`   | 信封的预渲染发送者标签                                        |
| `senderLabel`    | 渲染发送者的可选覆盖                                          |
| `preview`        | 用于日志的短修订预览                                          |
| `inboundHistory` | Channel 保留缓冲区时的最近入站历史记录条目                    |

### SupplementalContextFacts

补充上下文涵盖引用、转发和线程引导上下文。内核应用配置的 `contextVisibility` 策略。Channel 适配器只提供事实和 `senderAllowed` 标志，以便跨 Channel 策略保持一致。

### InboundMediaFacts

媒体是事实形状的。平台下载、认证、SSRF 策略、CDN 规则和解密保留在 Channel 本地。内核将事实映射到 `MediaPath`、`MediaUrl`、`MediaType`、`MediaPaths`、`MediaUrls`、`MediaTypes` 和 `MediaTranscribedIndexes`。

当您的 Channel 有已解析的媒体列表并且只需要附加通用事实时，使用 `openclaw/plugin-sdk/channel-inbound` 中的 `toInboundMediaFacts(...)`：

```typescript
media: toInboundMediaFacts(resolvedMedia, {
  kind: "image",
  messageId: input.id,
});
```

如果媒体混合了本地文件和仅 URL 条目，请将列表保留为媒体事实。Core 在写入旧版上下文字段时保留数组索引，以便下游媒体理解、转录标记和提示注释继续引用相同的附件。

对于应该对以后的提及可用的跳过的组消息，通过轮次 `preflight.media` 字段传递媒体事实。内核在记录之前将这些事实转换为有界历史记录媒体条目：

```typescript
preflight(input) {
  return {
    admission: { kind: "drop", reason: "missing_mention", recordHistory: true },
    media: () => toInboundMediaFacts(resolveLocalImages(input), {
      kind: "image",
      messageId: input.id,
    }),
    history: {
      key: historyKey,
      limit: historyLimit,
      mediaLimit: 4,
      shouldRecord: () => stillCurrent(input),
    },
  };
}
```

历史记录媒体是故意保守的：今天只有图像、仅本地可读路径、受配置媒体限制的边界，并且仍然与 Channel 历史记录键绑定。认证的 Provider URL 应该在成为模型可见媒体之前由 Plugin 下载。

## 历史窗口

消息轮次代码应该使用 `createChannelHistoryWindow(...)` 而不是直接调用低级 `reply-history` 映射助手。旧版映射助手作为已弃用的兼容性导出仍然可导入，但新 Plugin 运行时代码不应该调用它们。窗口门面将文本上下文、结构化 `InboundHistory`、历史媒体规范化和清除保持在一个 Core 拥有的 API 后面，同时仍然让 Channel 选择历史记录行的渲染方式。

```typescript
const history = createChannelHistoryWindow({ historyMap: groupHistories });

await history.recordWithMedia({
  historyKey,
  limit: historyLimit,
  entry,
  media: () =>
    toInboundMediaFacts(resolvedImages, {
      kind: "image",
      messageId: entry.messageId,
    }),
});

const combinedBody = history.buildPendingContext({
  historyKey,
  limit: historyLimit,
  currentMessage,
  formatEntry: (entry) => `${entry.sender}: ${entry.body}`,
});
```

旧版 `buildPendingHistoryContextFromMap`、`buildInboundHistoryFromMap`、`recordPendingHistoryEntry*` 和 `clearHistoryEntries*` 导出作为尚未迁移的 Plugin 的已弃用兼容性保留。新 Channel 工作应该使用窗口或轮次内核记录/最终化选项。

## 常见消息模式

需要提及的仅文本组：

```typescript
preflight(input) {
  const decision = resolveInboundMentionDecision({ facts, policy });
  if (decision.shouldSkip) {
    return {
      admission: { kind: "drop", reason: "missing_mention", recordHistory: true },
      history: { key: historyKey, limit: historyLimit },
    };
  }
  return { access: { mentions: decision } };
}
```

仅图像消息，后跟稍后的提及：

```typescript
preflight(input) {
  if (!wasMentioned && resolvedImages.length > 0) {
    return {
      admission: { kind: "drop", reason: "missing_mention", recordHistory: true },
      media: () => toInboundMediaFacts(resolvedImages, {
        kind: "image",
        messageId: input.id,
      }),
      history: { key: historyKey, limit: historyLimit, mediaLimit: 4 },
    };
  }
  return {};
}
```

显式回复到图像：

```typescript
resolveTurn(input, _eventClass, preflight) {
  return {
    ...assembled,
    media: toInboundMediaFacts([...currentMedia, ...referencedReplyMedia]),
    supplemental: {
      quote: preflight.supplemental?.quote,
    },
  };
}
```

带历史记录的直接消息：

```typescript
resolveTurn(input) {
  return {
    ...assembled,
    history: undefined,
    message: {
      rawBody: input.rawText,
      bodyForAgent: input.textForAgent,
    },
  };
}
```

## 适配器契约

对于完整的 `run`，适配器形状为：

```typescript
type ChannelTurnAdapter<TRaw> = {
  ingest(raw: TRaw): Promise<NormalizedTurnInput | null> | NormalizedTurnInput | null;
  classify?(input: NormalizedTurnInput): Promise<ChannelEventClass> | ChannelEventClass;
  preflight?(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
  ): Promise<PreflightFacts | ChannelTurnAdmission | null | undefined>;
  resolveTurn(
    input: NormalizedTurnInput,
    eventClass: ChannelEventClass,
    preflight: PreflightFacts,
  ): Promise<ChannelTurnResolved> | ChannelTurnResolved;
  onFinalize?(result: ChannelTurnResult): Promise<void> | void;
};
```

`resolveTurn` 返回 `ChannelTurnResolved`，这是带有可选准入类型的 `AssembledChannelTurn`。返回 `{ admission: { kind: "observeOnly" } }` 在不产生可见输出的情况下运行轮次。适配器仍然拥有交付回调；对于该轮次，它只是成为无操作。

`onFinalize` 在每个结果上运行，包括分发错误。使用它来清除待处理的组历史记录、移除确认反应、停止状态指示器和刷新本地状态。

## 交付适配器

内核不直接调用平台。Channel 将 `ChannelEventDeliveryAdapter` 传递给内核：

```typescript
type ChannelEventDeliveryAdapter = {
  deliver(payload: ReplyPayload, info: ChannelDeliveryInfo): Promise<ChannelDeliveryResult | void>;
  onError?(err: unknown, info: { kind: string }): void;
  durable?: false | DurableInboundReplyDeliveryOptions;
};

type ChannelDeliveryResult = {
  messageIds?: string[];
  receipt?: MessageReceipt;
  threadId?: string;
  replyToId?: string;
  visibleReplySent?: boolean;
};
```

`deliver` 在每个缓冲的回复块调用一次。在消息生命周期迁移期间，组装的 Channel 事件交付默认是 Channel 拥有的：省略的 `durable` 字段意味着内核必须直接调用 `deliver`，而不是通过通用出站交付路由。仅在 Channel 经过审计以证明通用发送路径保留旧版交付行为（包括回复/线程目标、媒体处理、已发送消息/自我回声缓存、状态清理和返回的消息 ID）之后才设置 `durable`。`durable: false` 仍然是"使用 Channel 拥有的回调"的兼容性拼写，但未迁移的 Channel 不应该需要添加它。当 Channel 有消息 ID 时返回平台消息 ID，以便调度器可以保留线程锚点并稍后编辑块；较新的交付路径还应该返回 `receipt`，以便恢复、预览最终化和重复抑制可以从 `messageIds` 迁移。对于仅观察的轮次，返回 `{ visibleReplySent: false }` 或使用 `createNoopChannelEventDeliveryAdapter()`。

使用具有完全 Channel 拥有的调度器的 `runPrepared` 的 Channel 没有 `ChannelEventDeliveryAdapter`。这些调度器默认不持久。它们应该保留直接交付路径，直到它们明确选择加入具有完整目标、重放安全适配器、收据契约和 Channel 副作用钩子的新发送上下文。

公共兼容性助手，如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 和直接 DM 助手，在迁移期间必须保持行为保留。在调用者拥有的 `deliver` 或 `reply` 回调之前，它们不应该调用通用持久交付。

## 记录选项

记录阶段包装 `recordInboundSession`。大多数 Channel 可以使用默认值。通过 `record` 覆盖：

```typescript
record: {
  groupResolution,
  createIfMissing: true,
  updateLastRoute,
  onRecordError: (err) => log.warn("record failed", err),
  trackSessionMetaTask: (task) => pendingTasks.push(task),
}
```

调度器等待记录阶段。如果记录抛出，内核运行 `onPreDispatchFailure`（当提供给 `runPrepared` 时）并重新抛出。

## 可观测性

当提供 `log` 回调时，每个阶段都会发出结构化事件：

```typescript
await runtime.channel.turn.run({
  channel: "twitch",
  accountId,
  raw,
  adapter,
  log: (event) => {
    runtime.log?.debug?.(`turn.${event.stage}:${event.event}`, {
      channel: event.channel,
      accountId: event.accountId,
      messageId: event.messageId,
      sessionKey: event.sessionKey,
      admission: event.admission,
      reason: event.reason,
    });
  },
});
```

已记录的阶段：`ingest`、`classify`、`preflight`、`resolve`、`authorize`、`assemble`、`record`、`dispatch`、`finalize`。避免记录原始正文；使用 `MessageFacts.preview` 进行短修订预览。

## 什么保留在 Channel 本地

内核拥有编排。Channel 仍然拥有：

- 平台传输（Gateway、REST、WebSocket、轮询、Webhook）
- 身份解析和显示名称匹配
- 原生命令、斜杠命令、自动完成、模态框、按钮、语音状态
- 卡片、模态框和自适应卡片渲染
- 媒体认证、CDN 规则、加密媒体、转录
- 编辑、反应、修订和存在 API
- 回填和平台侧历史记录获取
- 需要特定于平台验证的配对流

如果两个 Channel 开始需要这些中的一个相同助手，请提取共享 SDK 助手，而不是将其推入内核。

## 稳定性

`runtime.channel.turn.*` 是公共 Plugin 运行时表面的一部分。事实类型（`SenderFacts`、`ConversationFacts`、`RouteFacts`、`ReplyPlanFacts`、`AccessFacts`、`MessageFacts`、`SupplementalContextFacts`、`InboundMediaFacts`）和准入形状（`ChannelTurnAdmission`、`ChannelEventClass`）可通过 `openclaw/plugin-sdk/core` 中的 `PluginRuntime` 访问。

向后兼容性规则适用：新事实字段是添加性的，准入类型不会重命名，入口点名称保持稳定。需要非添加性更改的新 Channel 需求必须通过 Plugin SDK 迁移过程。

## 相关

- [消息生命周期重构](/concepts/message-lifecycle-refactor) 用于计划包装此内核的发送/接收/实时生命周期
- [构建 Channel Plugin](/plugins/sdk-channel-plugins) 用于更广泛的 Channel Plugin 契约
- [Plugin 运行时助手](/plugins/sdk-runtime) 用于其他 `runtime.*` 表面
- [Plugin 内部](/plugins/architecture-internals) 用于加载管道和注册表机制
