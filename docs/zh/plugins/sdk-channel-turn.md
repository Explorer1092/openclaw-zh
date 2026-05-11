---
mmh3_hash: "195ce43c808cb68e8a337515e7f89e56"
summary: "runtime.channel.turn -- Bundle 和第三方 Channel Plugin 用于记录、分发和终结 Agent 轮次的共享入站轮次内核"
title: "Channel 轮次内核"
sidebarTitle: "Channel 轮次"
read_when:
  - 您正在构建 Channel Plugin 并希望使用共享入站轮次生命周期
  - 您正在将 Channel 监控从手写的记录/分发胶水迁移出去
  - 您需要了解准入、ingest、classify、preflight、resolve、record、dispatch 和 finalize 阶段
---

Channel 轮次内核是共享的入站状态机，将规范化的平台事件转换为 Agent 轮次。Channel Plugin 提供平台事实和交付回调。Core 拥有编排：ingest、classify、preflight、resolve、authorize、assemble、record、dispatch 和 finalize。

当您的 Plugin 处于入站消息热路径上时使用此功能。对于非消息事件（斜杠命令、模态框、按钮交互、生命周期事件、反应、语音状态），请将它们保持为 Plugin 本地。内核只拥有可能成为 Agent 文本轮次的事件。

<Info>
  内核通过注入的 Plugin 运行时以 `runtime.channel.turn.*` 的形式访问。Plugin 运行时类型从 `openclaw/plugin-sdk/core` 导出，因此第三方原生 Plugin 可以使用与 Bundle Channel Plugin 相同的入口点。
</Info>

## 为什么需要共享内核

Channel Plugin 重复相同的入站流程：规范化、路由、门控、构建上下文、记录 Session 元数据、分发 Agent 轮次、终结交付状态。没有共享内核，对提及门控、仅 Tool 可见回复、Session 元数据、待处理历史记录或分发终结的更改必须逐 Channel 应用。

内核有意保持四个概念分离：

- `ConversationFacts`：消息来自何处
- `RouteFacts`：哪个 Agent 和 Session 应处理它
- `ReplyPlanFacts`：可见回复应去往何处
- `MessageFacts`：Agent 应看到的消息体和补充上下文

Slack DM、Telegram 话题、Matrix 线程和飞书话题 Session 在实践中都区分这些。将它们视为一个标识符会随着时间推移产生漂移。

## 阶段生命周期

无论 Channel 如何，内核运行相同的固定管道：

1. `ingest` -- 适配器将原始平台事件转换为 `NormalizedTurnInput`
2. `classify` -- 适配器声明此事件是否可以启动 Agent 轮次
3. `preflight` -- 适配器进行去重、自回显、水化、防抖、解密、部分事实预填充
4. `resolve` -- 适配器返回完整组装的轮次（路由、回复计划、消息、交付）
5. `authorize` -- 对组装的事实应用 DM、群组、提及和命令策略
6. `assemble` -- 通过 `buildContext` 从事实构建 `FinalizedMsgContext`
7. `record` -- 持久化入站 Session 元数据和最后路由
8. `dispatch` -- 通过缓冲块分发器执行 Agent 轮次
9. `finalize` -- 即使在分发错误时也运行适配器 `onFinalize`

当提供 `log` 回调时，每个阶段发出结构化日志事件。参见[可观察性](#可观察性)。

## 准入类型

当轮次被门控时内核不抛出异常。它返回 `ChannelTurnAdmission`：

| 类型          | 时机                                                                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `dispatch`    | 轮次被准入。Agent 轮次运行且可见回复路径被执行。                                                                                       |
| `observeOnly` | 轮次端到端运行，但交付适配器不发送任何可见内容。用于广播观察者 Agent 和其他被动多 Agent 流程。                                         |
| `handled`     | 平台事件被本地消费（生命周期、反应、按钮、模态框）。内核跳过分发。                                                                     |
| `drop`        | 跳过路径。可选的 `recordHistory: true` 将消息保留在待处理群组历史记录中，以便未来的提及有上下文。                                       |

准入可以来自 `classify`（事件类别说它无法启动轮次）、来自 `preflight`（去重、自回显、缺少带历史记录的提及），或来自 `resolveTurn` 本身。

## 入口点

运行时暴露三个首选入口点，以便适配器可以在与 Channel 匹配的级别选择加入。

```typescript
runtime.channel.turn.run(...)             // adapter-driven full pipeline
runtime.channel.turn.runAssembled(...)    // already-built context + delivery adapter
runtime.channel.turn.runPrepared(...)     // channel owns dispatch; kernel runs record + finalize
runtime.channel.turn.buildContext(...)    // pure facts to FinalizedMsgContext mapping
```

两个较旧的运行时辅助函数仍可用于 Plugin SDK 兼容性：

```typescript
runtime.channel.turn.runResolved(...)      // deprecated compatibility alias; prefer run
runtime.channel.turn.dispatchAssembled(...) // deprecated compatibility alias; prefer runAssembled
```

### run

当您的 Channel 可以将其入站流程表达为 `ChannelTurnAdapter<TRaw>` 时使用。适配器有 `ingest`、可选 `classify`、可选 `preflight`、必须 `resolveTurn` 和可选 `onFinalize` 的回调。

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

当 Channel 有小型适配器逻辑并从通过 Hook 拥有生命周期中受益时，`run` 是正确的形状。

### runAssembled

当 Channel 已解析路由、构建了 `FinalizedMsgContext`，只需要共享记录、回复管道、分发和终结顺序时使用。这是简单 Bundle 入站路径的首选形状，否则会重复 `createChannelMessageReplyPipeline(...)` 和 `runPrepared(...)` 样板代码。

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

当唯一的 Channel 拥有分发行为是最终有效载荷交付加上可选的打字、回复选项、持久交付或错误日志时，选择 `runAssembled` 而不是 `runPrepared`。

### runPrepared

当 Channel 有复杂的本地分发器，带有预览、重试、编辑或线程引导，必须保持 Channel 拥有时使用。内核仍在分发前记录入站 Session 并呈现统一的 `DispatchedChannelTurnResult`。

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

富 Channel（Matrix、Mattermost、Microsoft Teams、飞书、QQ Bot）使用 `runPrepared`，因为它们的分发器编排内核不应了解的平台特定行为。

### buildContext

将事实包映射到 `FinalizedMsgContext` 的纯函数。当您的 Channel 手写管道的一部分但希望保持一致的上下文形状时使用。

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

在 `resolveTurn` 回调中为 `run` 组装轮次时，`buildContext` 也很有用。

<Note>
  诸如 `dispatchInboundReplyWithBase` 之类的已弃用 SDK 辅助函数仍通过组装轮次辅助函数桥接。新 Plugin 代码应使用 `run` 或 `runPrepared`。
</Note>

## 事实类型

内核从您的适配器消费的事实是平台无关的。在将平台对象交给内核之前，将其翻译为这些形状。

### NormalizedTurnInput

| 字段              | 用途                                                               |
| ----------------- | ------------------------------------------------------------------ |
| `id`              | 用于去重和日志的稳定消息 ID                                        |
| `timestamp`       | 可选的纪元毫秒                                                     |
| `rawText`         | 从平台接收的消息体                                                 |
| `textForAgent`    | 可选的清理后消息体（提及剥离、打字修剪）                           |
| `textForCommands` | 用于 `/command` 解析的可选消息体                                   |
| `raw`             | 需要原始内容的适配器回调的可选直通引用                             |

### ChannelEventClass

| 字段                   | 用途                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| `kind`                 | `message`、`command`、`interaction`、`reaction`、`lifecycle`、`unknown` |
| `canStartAgentTurn`    | 如果为 false，内核返回 `{ kind: "handled" }`                            |
| `requiresImmediateAck` | 需要在分发前 ACK 的适配器提示                                           |

### SenderFacts

| 字段           | 用途                                                   |
| -------------- | ------------------------------------------------------ |
| `id`           | 稳定的平台发送者 ID                                    |
| `name`         | 显示名称                                               |
| `username`     | 与 `name` 不同时的句柄                                 |
| `tag`          | Discord 风格的鉴别器或平台标签                         |
| `roles`        | 角色 ID，用于成员角色允许列表匹配                      |
| `isBot`        | 当发送者是已知机器人时为 true（内核用于丢弃）          |
| `isSelf`       | 当发送者是配置的 Agent 本身时为 true                   |
| `displayLabel` | 信封文本的预渲染标签                                   |

### ConversationFacts

| 字段              | 用途                                                               |
| ----------------- | ------------------------------------------------------------------ |
| `kind`            | `direct`、`group` 或 `channel`                                     |
| `id`              | 用于路由的会话 ID                                                  |
| `label`           | 信封的人类可读标签                                                 |
| `spaceId`         | 可选的外部空间标识符（Slack 工作区、Matrix 家庭服务器）            |
| `parentId`        | 此线程的外部会话 ID                                                |
| `threadId`        | 此消息在线程内时的线程 ID                                          |
| `nativeChannelId` | 与路由 ID 不同时的平台原生 Channel ID                              |
| `routePeer`       | 用于 `resolveAgentRoute` 查找的对等体                              |

### RouteFacts

| 字段                    | 用途                                                       |
| ----------------------- | ---------------------------------------------------------- |
| `agentId`               | 应处理此轮次的 Agent                                       |
| `accountId`             | 可选覆盖（多账户 Channel）                                 |
| `routeSessionKey`       | 用于路由的 Session 键                                      |
| `dispatchSessionKey`    | 与路由键不同时分发时使用的 Session 键                      |
| `persistedSessionKey`   | 写入持久化 Session 元数据的 Session 键                     |
| `parentSessionKey`      | 分支/线程 Session 的父级                                   |
| `modelParentSessionKey` | 分支 Session 的模型侧父级                                  |
| `mainSessionKey`        | 直接会话的主 DM 所有者固定                                 |
| `createIfMissing`       | 允许记录步骤创建缺失的 Session 行                          |

### ReplyPlanFacts

| 字段                      | 用途                                                    |
| ------------------------- | ------------------------------------------------------- |
| `to`                      | 写入上下文 `To` 的逻辑回复目标                          |
| `originatingTo`           | 起源上下文目标（`OriginatingTo`）                       |
| `nativeChannelId`         | 用于交付的平台原生 Channel ID                           |
| `replyTarget`             | 与 `to` 不同时的最终可见回复目的地                      |
| `deliveryTarget`          | 较低级别的交付覆盖                                      |
| `replyToId`               | 引用/锚定的消息 ID                                      |
| `replyToIdFull`           | 平台同时有两者时的完整形式引用 ID                       |
| `messageThreadId`         | 交付时的线程 ID                                         |
| `threadParentId`          | 线程的父消息 ID                                         |
| `sourceReplyDeliveryMode` | `thread`、`reply`、`channel`、`direct` 或 `none`        |

### AccessFacts

`AccessFacts` 携带 authorize 阶段需要的布尔值。身份匹配留在 Channel 中：内核只消费结果。

| 字段       | 用途                                                                      |
| ---------- | ------------------------------------------------------------------------- |
| `dm`       | DM 允许/配对/拒绝决策和 `allowFrom` 列表                                  |
| `group`    | 群组策略、路由允许、发送者允许、允许列表、提及要求                        |
| `commands` | 跨已配置授权者的命令授权                                                  |
| `mentions` | 是否可以进行提及检测以及 Agent 是否被提及                                 |

### MessageFacts

| 字段             | 用途                                                         |
| ---------------- | ------------------------------------------------------------ |
| `body`           | 最终信封体（已格式化）                                       |
| `rawBody`        | 原始入站体                                                   |
| `bodyForAgent`   | Agent 看到的消息体                                           |
| `commandBody`    | 用于命令解析的消息体                                         |
| `envelopeFrom`   | 信封的预渲染发送者标签                                       |
| `senderLabel`    | 渲染发送者的可选覆盖                                         |
| `preview`        | 用于日志的简短编辑保护预览                                   |
| `inboundHistory` | Channel 保留缓冲区时的最近入站历史条目                       |

### SupplementalContextFacts

补充上下文涵盖引用、转发和线程引导上下文。内核应用配置的 `contextVisibility` 策略。Channel 适配器只提供事实和 `senderAllowed` 标志，以保持跨 Channel 策略一致。

### InboundMediaFacts

媒体是事实形状的。平台下载、身份验证、SSRF 策略、CDN 规则和解密保持 Channel 本地。内核将事实映射到 `MediaPath`、`MediaUrl`、`MediaType`、`MediaPaths`、`MediaUrls`、`MediaTypes` 和 `MediaTranscribedIndexes`。

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

`resolveTurn` 返回 `ChannelTurnResolved`，它是带有可选准入类型的 `AssembledChannelTurn`。返回 `{ admission: { kind: "observeOnly" } }` 会在不产生可见输出的情况下运行轮次。适配器仍然拥有交付回调；对于该轮次它只是变成空操作。

`onFinalize` 在每个结果上运行，包括分发错误。使用它清除待处理群组历史记录、移除确认反应、停止状态指示器并刷新本地状态。

## 交付适配器

内核不直接调用平台。Channel 将 `ChannelTurnDeliveryAdapter` 交给内核：

```typescript
type ChannelTurnDeliveryAdapter = {
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

`deliver` 每个缓冲回复块被调用一次。在消息生命周期迁移期间，组装的 Channel 轮次交付默认由 Channel 拥有：省略的 `durable` 字段意味着内核必须直接调用 `deliver`，不得通过通用出站交付路由。仅在审计 Channel 证明通用发送路径保留旧交付行为（包括回复/线程目标、媒体处理、已发送消息/自回显缓存、状态清理和返回的消息 ID）后才设置 `durable`。`durable: false` 仍是"使用 Channel 拥有的回调"的兼容性拼写，但未迁移的 Channel 不需要添加它。当 Channel 有平台消息 ID 时返回它们，以便分发器可以保留线程锚点并稍后编辑块；较新的交付路径也应返回 `receipt`，以便恢复、预览终结和重复抑制可以移出 `messageIds`。对于仅观察的轮次，返回 `{ visibleReplySent: false }` 或使用 `createNoopChannelTurnDeliveryAdapter()`。

使用完全由 Channel 拥有的分发器的 `runPrepared` Channel 没有 `ChannelTurnDeliveryAdapter`。这些分发器默认不是持久的。它们应保持其直接交付路径，直到它们明确选择带有完整目标、可重放安全适配器、回执契约和 Channel 副作用 Hook 的新发送上下文。

公共兼容性辅助函数（如 `recordInboundSessionAndDispatchReply`、`dispatchInboundReplyWithBase` 和直接 DM 辅助函数）必须在迁移期间保持行为保留。它们不应在调用者拥有的 `deliver` 或 `reply` 回调之前调用通用持久交付。

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

分发器等待记录阶段。如果记录抛出异常，内核运行 `onPreDispatchFailure`（当提供给 `runPrepared` 时）并重新抛出。

## 可观察性

当提供 `log` 回调时，每个阶段发出结构化事件：

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

记录的阶段：`ingest`、`classify`、`preflight`、`resolve`、`authorize`、`assemble`、`record`、`dispatch`、`finalize`。避免记录原始消息体；使用 `MessageFacts.preview` 进行简短的编辑保护预览。

## 保持 Channel 本地的内容

内核拥有编排。Channel 仍然拥有：

- 平台传输（Gateway、REST、WebSocket、轮询、Webhook）
- 身份解析和显示名称匹配
- 原生命令、斜杠命令、自动完成、模态框、按钮、语音状态
- 卡片、模态框和自适应卡片渲染
- 媒体身份验证、CDN 规则、加密媒体、转录
- 编辑、反应、编辑保护和存在 API
- 回填和平台侧历史获取
- 需要平台特定验证的配对流程

如果两个 Channel 开始需要相同的辅助函数来处理这些内容之一，请提取共享 SDK 辅助函数，而不是将其推入内核。

## 稳定性

`runtime.channel.turn.*` 是公共 Plugin 运行时界面的一部分。事实类型（`SenderFacts`、`ConversationFacts`、`RouteFacts`、`ReplyPlanFacts`、`AccessFacts`、`MessageFacts`、`SupplementalContextFacts`、`InboundMediaFacts`）和准入形状（`ChannelTurnAdmission`、`ChannelEventClass`）可通过 `openclaw/plugin-sdk/core` 中的 `PluginRuntime` 访问。

向后兼容规则适用：新事实字段是累加的，准入类型不重命名，入口点名称保持稳定。需要非累加更改的新 Channel 需求必须经过 Plugin SDK 迁移过程。

## 相关

- [消息生命周期重构](/concepts/message-lifecycle-refactor) — 将包装此内核的计划发送/接收/实时生命周期
- [构建 Channel Plugin](/plugins/sdk-channel-plugins) — 更广泛的 Channel Plugin 契约
- [Plugin 运行时辅助函数](/plugins/sdk-runtime) — 其他 `runtime.*` 界面
- [Plugin 内部结构](/plugins/architecture-internals) — 加载管道和注册表机制
