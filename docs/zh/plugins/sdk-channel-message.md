---
mmh3_hash: "f490f1bf55d5a16945a4e74836f6c6a1"
summary: "Channel Plugin 的消息生命周期 API，包括持久发送、回执、实时预览、接收确认策略和遗留迁移"
title: "Channel 消息 API"
read_when:
  - 您正在构建或重构消息 Channel Plugin
  - 您需要持久最终回复交付、回执、实时预览终结或接收确认策略
  - 您正在从遗留回复管道或入站回复分发辅助函数迁移
---

Channel Plugin 应从 `openclaw/plugin-sdk/channel-message` 暴露一个 `message` 适配器。适配器描述平台支持的原生消息生命周期：

```text
receive -> route and record -> agent turn -> durable final send
send -> render batch -> platform I/O -> receipt -> lifecycle side effects
live preview -> final edit or fallback -> receipt
```

Core 拥有排队、持久性、通用重试策略、Hook、回执和共享 `message` Tool。Plugin 拥有原生发送/编辑/删除调用、目标规范化、平台线程、选定引用、通知标志、账户状态和平台特定副作用。

本页面与[构建 Channel Plugin](/plugins/sdk-channel-plugins) 配合使用。

`channel-message` 子路径有意设计得足够轻量，可用于热 Plugin 引导文件（如 `channel.ts`）：它暴露适配器契约、能力证明、回执和兼容性门面，无需加载出站交付。运行时交付辅助函数可从 `openclaw/plugin-sdk/channel-message-runtime` 获取，用于已在进行异步消息 I/O 的监控/发送代码路径。

新的 Channel 和 Plugin 发送代码应使用 `openclaw/plugin-sdk/channel-message-runtime` 中的消息生命周期辅助函数：`sendDurableMessageBatch`、`withDurableMessageSendContext` 或 `deliverInboundReplyWithMessageSendContext`。`openclaw/plugin-sdk/outbound-runtime` 中较旧的 `deliverOutboundPayloads(...)` 辅助函数是出站内部、恢复和遗留适配器的已弃用兼容性/运行时基底。不要将其用于新的 Channel 或 Plugin 发送路径。

`sendDurableMessageBatch(...)` 返回明确的生命周期结果：

- `sent` - 至少发送了一条可见的平台消息。
- `suppressed` - 没有平台消息应被视为缺失。稳定的原因包括 `cancelled_by_message_sending_hook`、`empty_after_message_sending_hook`、`no_visible_payload`、`adapter_returned_no_identity` 和遗留的 `no_visible_result`。
- `partial_failed` - 至少一条平台消息在后续有效载荷或副作用失败之前已交付。结果包括已交付的回执前缀加上失败信息。
- `failed` - 没有产生平台回执。

当批次混合发送、抑制和失败的有效载荷时使用 `payloadOutcomes`。不要通过检查旧的直接交付数组是否为空来推断 Hook 取消。

仍然需要缓冲回复分发器的兼容性分发器应使用 `openclaw/plugin-sdk/channel-message` 中的 `createChannelMessageReplyPipeline(...)` 构建回复前缀选项，然后调用运行时的 `channel.turn.runPrepared(...)`。这样可以在共享轮次生命周期上保留 Session 记录和分发排序，而无需添加另一个公共轮次包装器。

## 最小适配器

大多数新 Channel Plugin 可以从小型适配器开始：

```typescript
import {
  defineChannelMessageAdapter,
  createMessageReceiptFromOutboundResults,
} from "openclaw/plugin-sdk/channel-message";

export const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  durableFinal: {
    capabilities: {
      text: true,
      replyTo: true,
      thread: true,
      messageSendingHooks: true,
    },
  },
  send: {
    text: async ({ cfg, to, text, accountId, replyToId, threadId, signal }) => {
      const sent = await sendDemoMessage({
        cfg,
        to,
        text,
        accountId: accountId ?? undefined,
        replyToId: replyToId ?? undefined,
        threadId: threadId == null ? undefined : String(threadId),
        signal,
      });

      return {
        receipt: createMessageReceiptFromOutboundResults({
          results: [{ channel: "demo", messageId: sent.id, conversationId: to }],
          kind: "text",
          threadId: threadId == null ? undefined : String(threadId),
          replyToId: replyToId ?? undefined,
        }),
      };
    },
  },
});
```

然后将其附加到 Channel Plugin：

```typescript
export const demoPlugin = createChatChannelPlugin({
  base: {
    id: "demo",
    message: demoMessageAdapter,
    // other channel plugin fields
  },
});
```

只声明适配器真正保留的能力。每个声明的能力都应有契约测试。

## 出站桥接

如果 Channel 已有兼容的 `outbound` 适配器，优先派生消息适配器而不是复制发送代码：

```typescript
import { createChannelMessageAdapterFromOutbound } from "openclaw/plugin-sdk/channel-message";

const demoMessageAdapter = createChannelMessageAdapterFromOutbound({
  id: "demo",
  outbound: demoOutboundAdapter,
});
```

桥接将旧的出站发送结果转换为 `MessageReceipt` 值。新代码应端到端传递回执，仅在兼容性边界使用 `listMessageReceiptPlatformIds(...)` 或 `resolveMessageReceiptPrimaryId(...)` 派生遗留 ID。如果没有提供接收策略，`createChannelMessageAdapterFromOutbound(...)` 使用 `manual` 接收确认策略。这使 Plugin 拥有的平台确认变得明确，而不会更改在通用接收上下文之外确认 Webhook、Socket 或轮询偏移的 Channel。

## 消息 Tool 发送

共享 `message(action="send")` 路径应使用与最终回复相同的 Core 交付生命周期。如果 Channel 需要 Tool 发送的 Provider 特定塑形，请实现 `actions.prepareSendPayload(...)` 而不是从 `actions.handleAction(...)` 发送。

`prepareSendPayload(...)` 接收规范化的 Core `ReplyPayload` 加上完整的操作上下文。返回一个在 `payload.channelData.<channel>` 中包含 Channel 特定数据的有效载荷，让 Core 调用 `sendMessage(...)`、消息生命周期运行时、预写队列、消息发送 Hook、重试、恢复和确认清理。生命周期运行时内部可能会调用 `deliverOutboundPayloads(...)` 作为兼容性基底，但 Channel Plugin 不应直接为新发送行为调用它。

仅当发送无法表示为持久有效载荷时返回 `null`，例如因为它包含不可序列化的组件工厂。Core 将保留遗留 Plugin 操作回退以保持兼容性，但新 Channel 发送功能应可表示为持久有效载荷数据。

```typescript
export const demoActions: ChannelMessageActionAdapter = {
  describeMessageTool: () => ({ actions: ["send"], capabilities: ["presentation"] }),
  prepareSendPayload: ({ ctx, payload }) => {
    if (ctx.action !== "send") {
      return null;
    }
    return {
      ...payload,
      channelData: {
        ...payload.channelData,
        demo: {
          ...(payload.channelData?.demo as object | undefined),
          nativeCard: ctx.params.card,
        },
      },
    };
  },
};
```

出站适配器然后在 `sendPayload` 内部读取 `payload.channelData.demo`。这样可以将平台特定渲染保留在 Plugin 中，同时 Core 仍然拥有持久化、重试、恢复、Hook 和确认。

准备好的 `message(action="send")` 有效载荷和通用最终回复交付默认使用带尽力排队的 Core 交付。必须的持久排队仅在 Core 验证 Channel 可以协调崩溃后结果未知的发送时才有效。如果适配器无法实现 `reconcileUnknownSend`，请保持准备好的发送路径为尽力方式；Core 仍会尝试预写队列，但队列持久性或不确定的崩溃恢复不是必须交付契约的一部分。

## 持久最终能力

持久最终交付是按副作用选择加入的。Core 仅在适配器声明有效载荷和交付选项所需的每项能力时使用通用持久交付。

| 能力                   | 声明时机                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ |
| `text`                 | 适配器可以发送文本并返回回执。                                                       |
| `media`                | 媒体发送为每条可见的平台消息返回回执。                                               |
| `payload`              | 适配器保留丰富的回复有效载荷语义，而不仅仅是文本和一个媒体 URL。                     |
| `replyTo`              | 原生回复目标到达平台。                                                               |
| `thread`               | 原生线程、话题或 Channel 线程目标到达平台。                                          |
| `silent`               | 通知抑制到达平台。                                                                   |
| `nativeQuote`          | 选定的引用元数据到达平台。                                                           |
| `messageSendingHooks`  | Core 消息发送 Hook 可以在平台 I/O 之前取消或重写内容。                               |
| `batch`                | 多部分渲染批次可作为一个持久计划重放。                                               |
| `reconcileUnknownSend` | 适配器可以在不盲目重放的情况下解析 `unknown_after_send` 恢复。                       |
| `afterSendSuccess`     | Channel 本地的发送后副作用只运行一次。                                               |
| `afterCommit`          | Channel 本地的提交后副作用只运行一次。                                               |

尽力最终交付不需要 `reconcileUnknownSend`；当适配器保留有效载荷的可见语义时使用共享生命周期，如果队列持久性不可用则回退到直接平台 I/O。必须的持久最终交付必须明确要求 `reconcileUnknownSend`。如果适配器无法确定已开始/未知的发送是否到达平台，请不要声明该能力；Core 将在排队之前拒绝必须的持久交付。

当调用者需要持久交付时，派生需求而不是手动构建映射：

```typescript
import { deriveDurableFinalDeliveryRequirements } from "openclaw/plugin-sdk/channel-message";

const requiredCapabilities = deriveDurableFinalDeliveryRequirements({
  payload,
  replyToId,
  threadId,
  silent,
  payloadTransport: true,
  extraCapabilities: {
    nativeQuote: hasSelectedQuote(payload),
  },
});
```

`messageSendingHooks` 默认是必须的。仅对有意无法运行全局消息发送 Hook 的路径设置 `messageSendingHooks: false`。

## 持久发送契约

持久最终发送比遗留 Channel 拥有的交付有更严格的语义：

- 在平台 I/O 之前创建持久意图。
- 如果持久交付返回已处理的结果，不要回退到遗留发送。
- 将 Hook 取消和无发送结果视为终态。
- 将 `unsupported` 视为仅意图前的结果。
- 对于必须的持久性，如果队列无法记录平台发送已开始，则在平台 I/O 之前失败。
- 对于必须的最终交付和必须的准备消息 Tool 发送，预检 `reconcileUnknownSend`；恢复必须能够确认已发送的消息，或仅在适配器证明原始发送未发生后重放。
- 对于 `best_effort`，队列写入失败可以回退到直接平台 I/O。
- 将中止信号转发到媒体加载和平台发送。
- 在队列确认后运行提交后 Hook；直接尽力回退在成功平台 I/O 后运行它们，因为没有持久队列提交。
- 为每个可见的平台消息 ID 返回回执。
- 当平台可以检查不确定的发送是否已到达用户时使用 `reconcileUnknownSend`。

此契约避免了崩溃后的重复发送，并避免绕过消息发送取消 Hook。

## 回执

`MessageReceipt` 是平台接受内容的新内部记录：

```typescript
type MessageReceipt = {
  primaryPlatformMessageId?: string;
  platformMessageIds: string[];
  parts: MessageReceiptPart[];
  threadId?: string;
  replyToId?: string;
  editToken?: string;
  deleteToken?: string;
  sentAt: number;
  raw?: readonly MessageReceiptSourceResult[];
};
```

在适配现有发送结果时使用 `createMessageReceiptFromOutboundResults(...)`。当实时预览消息成为最终回执时使用 `createPreviewMessageReceipt(...)`。避免添加新的所有者本地 `messageIds` 字段。遗留 `ChannelDeliveryResult.messageIds` 仍在兼容性边界产生。

## 实时预览

流式传输草稿预览或进度更新的 Channel 应声明实时能力：

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  live: {
    capabilities: {
      draftPreview: true,
      previewFinalization: true,
      progressUpdates: true,
      quietFinalization: true,
    },
    finalizer: {
      capabilities: {
        finalEdit: true,
        normalFallback: true,
        discardPending: true,
        previewReceipt: true,
        retainOnAmbiguousFailure: true,
      },
    },
  },
});
```

对运行时终结使用 `defineFinalizableLivePreviewAdapter(...)` 和 `deliverWithFinalizableLivePreviewAdapter(...)`。终结器决定最终回复是否就地编辑预览、发送正常回退、丢弃待处理的预览状态、在不复制消息的情况下保留模糊失败的编辑，并返回最终回执。

## 接收确认策略

控制平台确认时机的入站接收器应声明接收策略：

```typescript
const demoMessageAdapter = defineChannelMessageAdapter({
  id: "demo",
  receive: {
    defaultAckPolicy: "after_agent_dispatch",
    supportedAckPolicies: ["after_receive_record", "after_agent_dispatch"],
  },
});
```

不声明接收策略的适配器默认为：

```typescript
{
  receive: {
    defaultAckPolicy: "manual",
    supportedAckPolicies: ["manual"],
  },
}
```

当平台没有要延迟的确认、已在异步处理之前确认或需要协议特定响应语义时，使用默认值。仅当接收器实际使用接收上下文将平台确认移后时才声明分阶段策略之一。

策略：

| 策略                   | 使用时机                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `after_receive_record` | 入站事件被解析和记录后可以确认平台。                                                     |
| `after_agent_dispatch` | 平台应等待 Agent 分发被接受。                                                            |
| `after_durable_send`   | 平台应等待最终交付有持久决策。                                                           |
| `manual`               | Plugin 拥有确认，因为平台语义不符合通用阶段。                                            |

在延迟确认状态的接收器中使用 `createMessageReceiveContext(...)`，当接收器需要测试阶段是否满足配置的策略时使用 `shouldAckMessageAfterStage(...)`。

## 契约测试

能力声明是 Plugin 契约的一部分。用测试支撑它们：

```typescript
import {
  verifyChannelMessageAdapterCapabilityProofs,
  verifyChannelMessageLiveCapabilityAdapterProofs,
  verifyChannelMessageLiveFinalizerProofs,
  verifyChannelMessageReceiveAckPolicyAdapterProofs,
} from "openclaw/plugin-sdk/channel-message";

it("backs declared message capabilities", async () => {
  await expect(
    verifyChannelMessageAdapterCapabilityProofs({
      adapterName: "demo",
      adapter: demoMessageAdapter,
      proofs: {
        text: async () => {
          const result = await demoMessageAdapter.send!.text!(textCtx);
          expect(result.receipt.platformMessageIds).toContain("msg-1");
        },
        replyTo: async () => {
          await demoMessageAdapter.send!.text!({ ...textCtx, replyToId: "parent-1" });
          expect(sendDemoMessage).toHaveBeenCalledWith(
            expect.objectContaining({
              replyToId: "parent-1",
            }),
          );
        },
        messageSendingHooks: () => {
          expect(demoMessageAdapter.durableFinal!.capabilities!.messageSendingHooks).toBe(true);
        },
      },
    }),
  ).resolves.toContainEqual({ capability: "text", status: "verified" });
});
```

当适配器声明这些功能时，添加实时和接收证明套件。缺失的证明应使测试失败，而不是静默扩大持久界面。

## 已弃用的兼容性 API

这些 API 仍可供第三方兼容性导入。不要将其用于新的 Channel 代码。

| 已弃用 API                                   | 替代方案                                                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openclaw/plugin-sdk/channel-reply-pipeline` | `openclaw/plugin-sdk/channel-message`                                                                                      |
| `createChannelTurnReplyPipeline(...)`        | `createChannelMessageReplyPipeline(...)` 用于兼容性分发器，或 `message` 适配器用于新 Channel 代码                          |
| `buildChannelMessageReplyDispatchBase(...)`  | `createChannelMessageReplyPipeline(...)` 加 `channel.turn.runPrepared(...)`，或 `message` 适配器用于新 Channel 代码        |
| `dispatchChannelMessageReplyWithBase(...)`   | `createChannelMessageReplyPipeline(...)` 加 `channel.turn.runPrepared(...)`，或 `message` 适配器用于新 Channel 代码        |
| `recordChannelMessageReplyDispatch(...)`     | `createChannelMessageReplyPipeline(...)` 加 `channel.turn.runPrepared(...)`，或 `message` 适配器用于新 Channel 代码        |
| `deliverOutboundPayloads(...)`               | `sendDurableMessageBatch(...)` 或 `channel-message-runtime` 中的 `deliverInboundReplyWithMessageSendContext(...)`          |
| `deliverDurableInboundReplyPayload(...)`     | `openclaw/plugin-sdk/channel-message-runtime` 中的 `deliverInboundReplyWithMessageSendContext(...)`                        |
| `dispatchInboundReplyWithBase(...)`          | `createChannelMessageReplyPipeline(...)` 加 `channel.turn.runPrepared(...)`，或 `message` 适配器用于新 Channel 代码        |
| `recordInboundSessionAndDispatchReply(...)`  | `createChannelMessageReplyPipeline(...)` 加 `channel.turn.runPrepared(...)`，或 `message` 适配器用于新 Channel 代码        |
| `resolveChannelSourceReplyDeliveryMode(...)` | `resolveChannelMessageSourceReplyDeliveryMode(...)`                                                                        |
| `deliverFinalizableDraftPreview(...)`        | `defineFinalizableLivePreviewAdapter(...)` 加 `deliverWithFinalizableLivePreviewAdapter(...)`                              |
| `DraftPreviewFinalizerDraft`                 | `LivePreviewFinalizerDraft`                                                                                                |
| `DraftPreviewFinalizerResult`                | `LivePreviewFinalizerResult`                                                                                               |

兼容性分发器仍可通过消息门面使用 `createReplyPrefixContext(...)`、`createReplyPrefixOptions(...)` 和 `createTypingCallbacks(...)`。新生命周期代码应避免使用旧的 `channel-reply-pipeline` 子路径。

## 迁移检查清单

1. 在 Channel Plugin 中添加 `message: defineChannelMessageAdapter(...)` 或 `message: createChannelMessageAdapterFromOutbound(...)`。
2. 从文本、媒体和有效载荷发送返回 `MessageReceipt`。
3. 只声明由原生行为和测试支撑的能力。
4. 用 `deriveDurableFinalDeliveryRequirements(...)` 替换手写的持久需求映射。
5. 当 Channel 就地编辑草稿消息时，通过实时预览辅助函数移动预览终结。
6. 只在接收器真正可以延迟平台确认时才声明接收确认策略。
7. 仅在兼容性边界保留遗留回复分发辅助函数。
