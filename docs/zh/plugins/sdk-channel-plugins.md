---
mmh3_hash: "0b9f920f7491468136af450c6b3bd361"
title: "构建 Channel Plugin"
sidebarTitle: "Channel Plugin"
summary: "构建 OpenClaw 消息 Channel Plugin 的分步指南"
read_when:
  - 您正在构建新的消息 Channel Plugin
  - 您想将 OpenClaw 连接到消息平台
  - 您需要了解 ChannelPlugin 适配器表面
doc-schema-version: 1
---

本指南介绍如何构建将 OpenClaw 连接到消息平台的 Channel Plugin。完成后，您将拥有一个具有 DM 安全性、配对、回复线程和出站消息的可用 Channel。

<Info>
  如果您之前没有构建过任何 OpenClaw Plugin，请先阅读[入门](/plugins/building-plugins)了解基本的包结构和 Manifest 设置。
</Info>

## Channel Plugin 的工作原理

Channel Plugin 不需要自己的发送/编辑/反应工具。OpenClaw 在 Core 中保留一个共享的 `message` 工具。您的 Plugin 拥有：

- **Config** - 账户解析和设置向导
- **Security** - DM 策略和白名单
- **Pairing** - DM 审批流
- **Session 语法** - Provider 特定的会话 ID 如何映射到基础聊天、线程 ID 和父级回退
- **Outbound** - 向平台发送文本、媒体和投票
- **Threading** - 回复如何线程化
- **Heartbeat 输入** - 可选的输入/忙碌信号，用于心跳交付目标

Core 拥有共享消息工具、提示连接、外部 Session 键形状、通用 `:thread:` 记录和调度。

新的 Channel Plugin 还应该使用 `openclaw/plugin-sdk/channel-message` 中的 `defineChannelMessageAdapter` 公开 `message` 适配器。适配器声明原生传输实际支持的哪些持久最终发送能力，并将文本/媒体发送指向与旧版 `outbound` 适配器相同的传输函数。仅当契约测试证明原生副作用和返回的收据时才声明能力。有关完整的 API 契约、示例、能力矩阵、收据规则、实时预览最终化、接收确认策略、测试和迁移表，请参见 [Channel message API](/plugins/sdk-channel-message)。如果现有的 `outbound` 适配器已经具有正确的发送方法和能力元数据，请使用 `createChannelMessageAdapterFromOutbound(...)` 从中派生 `message` 适配器，而不是手工编写另一个桥接。适配器发送应返回 `MessageReceipt` 值。当兼容性代码仍然需要旧版 ID 时，使用 `listMessageReceiptPlatformIds(...)` 或 `resolveMessageReceiptPrimaryId(...)` 派生它们，而不是在新生命周期代码中保留并行的 `messageIds` 字段。具有预览能力的 Channel 还应该用它们拥有的确切实时生命周期声明 `message.live.capabilities`，例如 `draftPreview`、`previewFinalization`、`progressUpdates`、`nativeStreaming` 或 `quietFinalization`。就地最终化草稿预览的 Channel 还应该声明 `message.live.finalizer.capabilities`，例如 `finalEdit`、`normalFallback`、`discardPending`、`previewReceipt` 和 `retainOnAmbiguousFailure`，并通过 `defineFinalizableLivePreviewAdapter(...)` 加 `deliverWithFinalizableLivePreviewAdapter(...)` 路由运行时逻辑。通过 `verifyChannelMessageLiveCapabilityAdapterProofs(...)` 和 `verifyChannelMessageLiveFinalizerProofs(...)` 测试支持这些能力，以便原生预览、进度、编辑、回退/保留、清理和收据行为不会无声漂移。延迟平台确认的入站接收器应该声明 `message.receive.defaultAckPolicy` 和 `supportedAckPolicies`，而不是将确认时序隐藏在监控器本地状态中。用 `verifyChannelMessageReceiveAckPolicyAdapterProofs(...)` 覆盖每个声明的策略。

旧版回复/轮次助手，如 `createChannelTurnReplyPipeline`、`dispatchInboundReplyWithBase` 和 `recordInboundSessionAndDispatchReply` 仍然适用于兼容性调度器。不要将这些名称用于新的 Channel 代码；新 Plugin 应该从 `openclaw/plugin-sdk/channel-message` 上的 `message` 适配器、收据和接收/发送生命周期助手开始。

迁移入站授权的 Channel 可以从运行时接收路径使用实验性的 `openclaw/plugin-sdk/channel-ingress-runtime` 子路径。该子路径将平台查找和副作用保留在 Plugin 中，同时共享白名单状态解析、路由/发送者/命令/事件/激活决策、修订诊断和轮次准入映射。将 Plugin 身份规范化保存在您传递给解析器的描述符中；不要从解析状态或决策中序列化原始匹配值。有关 API 设计、所有权边界和测试期望，请参见 [Channel ingress API](/plugins/sdk-channel-ingress)。

如果您的 Channel 支持入站回复之外的输入指示器，请在 Channel Plugin 上公开 `heartbeat.sendTyping(...)`。Core 在心跳模型运行开始之前使用解析的心跳交付目标调用它，并使用共享的输入保活/清理生命周期。当平台需要显式停止信号时，添加 `heartbeat.clearTyping(...)`。

如果您的 Channel 添加携带媒体源的消息工具参数，请通过 `describeMessageTool(...).mediaSourceParams` 公开这些参数名称。Core 将该显式列表用于沙箱路径规范化和出站媒体访问策略，因此 Plugin 不需要对特定于 Provider 的头像、附件或封面图片参数进行共享核心特殊处理。优先返回以操作为键的映射，例如 `{ "set-profile": ["avatarUrl", "avatarPath"] }`，以便不相关的操作不会继承另一个操作的媒体参数。如果参数有意在每个公开的操作中共享，则平面数组仍然有效。

如果您的 Channel 需要特定于 Provider 的 `message(action="send")` 整形，优先使用 `actions.prepareSendPayload(...)`。将原生卡片、块、嵌入或其他持久数据放在 `payload.channelData.<channel>` 下，让 Core 通过出站/消息适配器执行实际发送。仅将 `actions.handleAction(...)` 用于无法序列化和重试的载荷的兼容性回退发送。

如果您的平台在会话 ID 中存储额外的范围，请将该解析保留在 Plugin 中，使用 `messaging.resolveSessionConversation(...)`。这是将 `rawId` 映射到基础会话 ID、可选线程 ID、显式 `baseConversationId` 和任何 `parentConversationCandidates` 的规范钩子。当您返回 `parentConversationCandidates` 时，从最窄的父级到最宽/基础会话排序它们。

当 Plugin 代码需要规范化路由类字段、将子线程与其父路由进行比较，或从 `{ channel, to, accountId, threadId }` 构建稳定的去重键时，请使用 `openclaw/plugin-sdk/channel-route`。助手以与 Core 相同的方式规范化数字线程 ID，因此 Plugin 应该优先使用它，而不是临时的 `String(threadId)` 比较。具有特定于 Provider 的目标语法的 Plugin 可以将其解析器注入 `resolveChannelRouteTargetWithParser(...)` 中，并且仍然获得与 Core 使用的相同路由目标形状和线程回退语义。

在 Channel 注册表启动之前需要相同解析的捆绑 Plugin 还可以使用匹配的 `resolveSessionConversation(...)` 导出公开顶级 `session-key-api.ts` 文件。Core 仅在运行时 Plugin 注册表尚不可用时使用该引导安全表面。

当 Plugin 仅需要在通用/原始 ID 上的父级回退时，`messaging.resolveParentConversationCandidates(...)` 仍然作为旧版兼容性回退可用。如果两个钩子都存在，Core 首先使用 `resolveSessionConversation(...).parentConversationCandidates`，只有当规范钩子省略它们时才回退到 `resolveParentConversationCandidates(...)`。

## 审批和 Channel 能力

大多数 Channel Plugin 不需要特定于审批的代码。

- Core 拥有同聊天 `/approve`、共享审批按钮载荷和通用回退交付。
- 当 Channel 需要特定于审批的行为时，在 Channel Plugin 上优先使用一个 `approvalCapability` 对象。
- `ChannelPlugin.approvals` 已删除。将审批交付/原生/渲染/认证事实放在 `approvalCapability` 上。
- `plugin.auth` 仅用于登录/注销；Core 不再从该对象读取审批认证钩子。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的审批认证接缝。
- 将 `approvalCapability.getActionAvailabilityState` 用于同聊天审批认证可用性。
- 如果您的 Channel 公开原生 exec 审批，请将 `approvalCapability.getExecInitiatingSurfaceState` 用于与同聊天审批认证不同的发起表面/原生客户端状态。Core 使用该 exec 特定钩子来区分 `enabled` 与 `disabled`，决定发起 Channel 是否支持原生 exec 审批，并在原生客户端回退指导中包含该 Channel。`createApproverRestrictedNativeApprovalCapability(...)` 为常见情况填充此项。
- 将 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload` 用于特定于 Channel 的载荷生命周期行为，例如隐藏重复的本地审批提示或在交付之前发送输入指示器。
- 仅将 `approvalCapability.delivery` 用于原生审批路由或回退抑制。
- 将 `approvalCapability.nativeRuntime` 用于 Channel 拥有的原生审批事实。使用 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 在热 Channel 入口点上保持延迟，它可以按需导入您的运行时模块，同时仍然让 Core 组装审批生命周期。
- 仅当 Channel 真正需要自定义审批载荷而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当 Channel 希望禁用路径回复解释启用原生 exec 审批所需的确切配置旋钮时，使用 `approvalCapability.describeExecApprovalSetup`。钩子接收 `{ channel, channelLabel, accountId }`；具名账户 Channel 应该渲染账户范围的路径，例如 `channels.<channel>.accounts.<id>.execApprovals.*` 而不是顶级默认值。
- 如果 Channel 可以从现有配置推断稳定的类所有者 DM 身份，请使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同聊天 `/approve`，而无需添加特定于审批的 Core 逻辑。
- 如果 Channel 需要原生审批交付，请将 Channel 代码集中在目标规范化加传输/呈现事实上。使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将特定于 Channel 的事实放在 `approvalCapability.nativeRuntime` 后面，最好通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)`，以便 Core 可以组装处理程序并拥有请求过滤、路由、去重、过期、Gateway 订阅和路由到其他地方的通知。`nativeRuntime` 分为几个较小的接缝：
- `createChannelNativeOriginTargetResolver` 默认对 `{ to, accountId, threadId }` 目标使用共享 Channel 路由匹配器。仅当 Channel 具有特定于 Provider 的等价规则（例如 Slack 时间戳前缀匹配）时，才传递 `targetsMatch`。
- 当 Channel 需要在默认路由匹配器或自定义 `targetsMatch` 回调运行之前规范化 Provider ID，同时为交付保留原始目标时，将 `normalizeTargetForMatch` 传递给 `createChannelNativeOriginTargetResolver`。仅当解析的交付目标本身应该规范化时，才使用 `normalizeTarget`。
- `availability` - 账户是否已配置以及请求是否应该被处理
- `presentation` - 将共享审批视图模型映射到待处理/已解析/已过期的原生载荷或最终操作
- `transport` - 准备目标加发送/更新/删除原生审批消息
- `interactions` - 原生按钮或反应的可选绑定/解绑/清除操作钩子，加上可选的 `cancelDelivered` 钩子。当 `deliverPending` 注册进程内或持久状态（例如反应目标存储）时，实现 `cancelDelivered`，以便如果处理程序停止在 `bindPending` 运行之前取消交付，或当 `bindPending` 没有返回句柄时，可以释放该状态。
- `observe` - 可选的交付诊断钩子
- 如果 Channel 需要运行时拥有的对象，例如客户端、令牌、Bolt 应用或 Webhook 接收器，请通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表允许 Core 从 Channel 启动状态引导能力驱动的处理程序，而无需添加特定于审批的包装粘合代码。
- 仅当能力驱动的接缝尚不够表达时，才使用较低级别的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- 原生审批 Channel 必须通过这些助手路由 `accountId` 和 `approvalKind`。`accountId` 将多账户审批策略保持在正确的机器人账户范围内，`approvalKind` 使 exec 与 Plugin 审批行为对 Channel 可用，而无需 Core 中的硬编码分支。
- Core 现在也拥有审批重新路由通知。Channel Plugin 不应该从 `createChannelNativeApprovalRuntime` 发送自己的"审批去了 DM/另一个 Channel"跟进消息；而是通过共享审批能力助手公开准确的发起 + 审批者 DM 路由，让 Core 在向发起聊天发布任何通知之前聚合实际交付。
- 保持已交付审批 ID 类型的端到端一致性。原生客户端不应该从 Channel 本地状态猜测或重写 exec 与 Plugin 审批路由。
- 不同的审批类型可以故意公开不同的原生表面。当前捆绑示例：
  - Slack 为 exec 和 Plugin ID 保持原生审批路由可用。
  - Matrix 为 exec 和 Plugin 审批保持相同的原生 DM/Channel 路由和反应 UX，同时仍然允许认证因审批类型而异。
- `createApproverRestrictedNativeApprovalAdapter` 仍然作为兼容性包装器存在，但新代码应该优先使用能力构建器并在 Plugin 上公开 `approvalCapability`。

对于热 Channel 入口点，当您只需要该系列的一部分时，优先使用较窄的运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样，当您不需要更广泛的伞形表面时，优先使用 `openclaw/plugin-sdk/setup-runtime`、`openclaw/plugin-sdk/reply-runtime`、`openclaw/plugin-sdk/reply-dispatch-runtime`、`openclaw/plugin-sdk/reply-reference` 和 `openclaw/plugin-sdk/reply-chunking`。

对于特定的设置：

- `openclaw/plugin-sdk/setup-runtime` 涵盖运行时安全的设置助手：`createSetupTranslator`、导入安全的设置补丁适配器（`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`）、查找注意输出、`promptResolvedAllowFrom`、`splitSetupEntries` 和委派的设置代理构建器
- `openclaw/plugin-sdk/setup-runtime` 包含 `createEnvPatchedAccountSetupAdapter` 的环境感知适配器接缝
- `openclaw/plugin-sdk/channel-setup` 涵盖可选安装的设置构建器加上一些设置安全的原语：`createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`

如果您的 Channel 支持环境驱动的设置或认证，并且通用启动/配置流应该在运行时加载之前知道这些环境名称，请在 Plugin Manifest 中用 `channelEnvVars` 声明它们。将 Channel 运行时 `envVars` 或本地常量仅用于操作员面向的副本。

如果您的 Channel 可以在 `status`、`channels list`、`channels status` 或 SecretRef 扫描中显示，在 Plugin 运行时启动之前，请在 `package.json` 中添加 `openclaw.setupEntry`。该入口点应该可以在只读命令路径中安全导入，并应该返回这些摘要所需的 Channel 元数据、设置安全的配置适配器、状态适配器和 Channel 密钥目标元数据。不要从设置条目启动客户端、监听器或传输运行时。

也保持主 Channel 条目导入路径狭窄。发现可以评估条目和 Channel Plugin 模块以注册能力，而无需激活 Channel。像 `channel-plugin-api.ts` 这样的文件应该导出 Channel Plugin 对象，而不导入设置向导、传输客户端、套接字监听器、子进程启动器或服务启动模块。将这些运行时部分放在从 `registerFull(...)` 加载的模块、运行时设置器或延迟能力适配器中。

`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和 `splitSetupEntries`

- 仅当您还需要更重的共享设置/配置助手（例如 `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，才使用更广泛的 `openclaw/plugin-sdk/setup` 接缝

如果您的 Channel 只想在设置表面宣传"先安装此 Plugin"，请优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导在配置写入和最终化时关闭失败，并且在验证、最终化和文档链接副本中重用相同的安装必需消息。

对于其他热 Channel 路径，优先使用较窄的助手而不是更广泛的旧版表面：

- `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、`openclaw/plugin-sdk/account-resolution` 和 `openclaw/plugin-sdk/account-helpers` 用于多账户配置和默认账户回退
- `openclaw/plugin-sdk/inbound-envelope` 和 `openclaw/plugin-sdk/inbound-reply-dispatch` 用于入站路由/信封和记录分发连接
- `openclaw/plugin-sdk/messaging-targets` 用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和 `openclaw/plugin-sdk/outbound-runtime` 用于媒体加载加上出站身份/发送委托和载荷规划
- `openclaw/plugin-sdk/channel-core` 中的 `buildThreadAwareOutboundSessionRoute(...)` 当出站路由应该保留显式 `replyToId`/`threadId` 或在基础 Session 键仍然匹配后恢复当前 `:thread:` Session 时。Provider Plugin 可以在其平台具有原生线程交付语义时覆盖优先级、后缀行为和线程 ID 规范化。
- `openclaw/plugin-sdk/thread-bindings-runtime` 用于线程绑定生命周期和适配器注册
- 仅当仍然需要旧版 Agent/媒体载荷字段布局时，才使用 `openclaw/plugin-sdk/agent-media-payload`
- `openclaw/plugin-sdk/telegram-command-config` 用于 Telegram 自定义命令规范化、重复/冲突验证和回退稳定的命令配置契约

仅具有认证功能的 Channel 通常可以在默认路径处停止：Core 处理审批，Plugin 只公开出站/认证能力。原生审批 Channel（如 Matrix、Slack、Telegram 和自定义聊天传输）应该使用共享的原生助手，而不是自己推出审批生命周期。

## 入站提及策略

将入站提及处理分为两层：

- Plugin 拥有的证据收集
- 共享策略评估

将 `openclaw/plugin-sdk/channel-mention-gating` 用于提及策略决策。仅当您需要更广泛的入站助手桶时，才使用 `openclaw/plugin-sdk/channel-inbound`。

适合 Plugin 本地逻辑的情况：

- 回复机器人检测
- 引用机器人检测
- 线程参与检查
- 服务/系统消息排除
- 证明机器人参与所需的平台原生缓存

适合共享助手的情况：

- `requireMention`
- 显式提及结果
- 隐式提及白名单
- 命令绕过
- 最终跳过决策

首选流程：

1. 计算本地提及事实。
2. 将这些事实传递给 `resolveInboundMentionDecision({ facts, policy })`。
3. 在您的入站门中使用 `decision.effectiveWasMentioned`、`decision.shouldBypassMention` 和 `decision.shouldSkip`。

```typescript
import {
  implicitMentionKindWhen,
  matchesMentionWithExplicit,
  resolveInboundMentionDecision,
} from "openclaw/plugin-sdk/channel-inbound";

const mentionMatch = matchesMentionWithExplicit(text, {
  mentionRegexes,
  mentionPatterns,
});

const facts = {
  canDetectMention: true,
  wasMentioned: mentionMatch.matched,
  hasAnyMention: mentionMatch.hasExplicitMention,
  implicitMentionKinds: [
    ...implicitMentionKindWhen("reply_to_bot", isReplyToBot),
    ...implicitMentionKindWhen("quoted_bot", isQuoteOfBot),
  ],
};

const decision = resolveInboundMentionDecision({
  facts,
  policy: {
    isGroup,
    requireMention,
    allowedImplicitMentionKinds: requireExplicitMention ? [] : ["reply_to_bot", "quoted_bot"],
    allowTextCommands,
    hasControlCommand,
    commandAuthorized,
  },
});

if (decision.shouldSkip) return;
```

`api.runtime.channel.mentions` 为已经依赖运行时注入的捆绑 Channel Plugin 公开相同的共享提及助手：

- `buildMentionRegexes`
- `matchesMentionPatterns`
- `matchesMentionWithExplicit`
- `implicitMentionKindWhen`
- `resolveInboundMentionDecision`

如果您只需要 `implicitMentionKindWhen` 和 `resolveInboundMentionDecision`，请从 `openclaw/plugin-sdk/channel-mention-gating` 导入，以避免加载不相关的入站运行时助手。

将 `resolveInboundMentionDecision({ facts, policy })` 用于提及门控。

## 操作步骤

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和 Manifest">
    创建标准 Plugin 文件。`package.json` 中的 `channel` 字段是使其成为 Channel Plugin 的原因。有关完整的包元数据表面，请参见 [Plugin 设置和配置](/plugins/sdk-setup#openclaw-channel)：

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {}
      },
      "channelConfigs": {
        "acme-chat": {
          "schema": {
            "type": "object",
            "additionalProperties": false,
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          },
          "uiHints": {
            "token": {
              "label": "Bot token",
              "sensitive": true
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

    `configSchema` 验证 `plugins.entries.acme-chat.config`。将其用于不属于 Channel 账户配置的 Plugin 拥有的设置。`channelConfigs` 验证 `channels.acme-chat`，并且是 Plugin 运行时加载之前配置 Schema、设置和 UI 表面使用的冷路径来源。

  </Step>

  <Step title="构建 Channel Plugin 对象">
    `ChannelPlugin` 接口有许多可选适配器表面。从最小值开始——`id` 和 `setup`——并根据需要添加适配器。

    创建 `src/channel.ts`：

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatApi } from "./client.js"; // 您的平台 API 客户端

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM 安全性：谁可以向机器人发送消息
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // 配对：新 DM 联系人的审批流
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading：如何交付回复
      threading: { topLevelReplyToMode: "reply" },

      // Outbound：向平台发送消息
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

    对于接受规范顶级 DM 键和旧版嵌套键的 Channel，请使用 `plugin-sdk/channel-config-helpers` 中的助手：`resolveChannelDmAccess`、`resolveChannelDmPolicy`、`resolveChannelDmAllowFrom` 和 `normalizeChannelDmPolicy` 将账户本地值保持在继承的根值之前。通过 `normalizeLegacyDmAliases` 将相同的解析器与医生修复配对，以便运行时和迁移读取相同的契约。

    <Accordion title="createChatChannelPlugin 为您做了什么">
      您传递声明性选项，而不是手动实现低级适配器接口，构建器会组合它们：

      | 选项 | 连接内容 |
      | --- | --- |
      | `security.dm` | 来自配置字段的范围 DM 安全解析器 |
      | `pairing.text` | 带代码交换的基于文本的 DM 配对流 |
      | `threading` | 回复模式解析器（固定、账户范围或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果您需要完全控制，也可以传递原始适配器对象，而不是声明性选项。

      原始出站适配器可以定义 `chunker(text, limit, ctx)` 函数。可选的 `ctx.formatting` 携带交付时格式化决策，例如 `maxLinesPerMessage`；在发送之前应用它，以便回复线程化和块边界由共享出站交付解析一次。当解析了原生回复目标时，发送上下文还包括 `replyToIdSource`（`implicit` 或 `explicit`），以便载荷助手可以在不消耗隐式一次性回复槽的情况下保留显式回复标签。
    </Accordion>

  </Step>

  <Step title="连接入口点">
    创建 `index.ts`：

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    将 Channel 拥有的 CLI 描述符放在 `registerCliMetadata(...)` 中，以便 OpenClaw 可以在根帮助中显示它们，而无需激活完整的 Channel 运行时，而普通的完整加载仍然会获取相同的描述符用于真正的命令注册。将 `registerFull(...)` 用于仅运行时的工作。如果 `registerFull(...)` 注册 Gateway RPC 方法，请使用 Plugin 特定的前缀。Core 管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并始终解析为 `operator.admin`。`defineChannelPluginEntry` 自动处理注册模式分割。有关所有选项，请参见[入口点](/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置条目">
    创建 `setup-entry.ts` 用于入职期间的轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当 Channel 被禁用或未配置时，OpenClaw 加载此项而不是完整条目。它避免在设置流期间引入繁重的运行时代码。有关详细信息，请参见[设置和配置](/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分为旁车模块的捆绑工作区 Channel 可以使用 `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)` 当它们还需要显式的设置时运行时设置器时。

  </Step>

  <Step title="处理入站消息">
    您的 Plugin 需要从平台接收消息并将其转发给 OpenClaw。典型模式是验证请求并通过您 Channel 的入站处理程序分发的 Webhook：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // Plugin 管理的认证（自己验证签名）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 您的入站处理程序将消息分发给 OpenClaw。
          // 确切的连接取决于您的平台 SDK——
          // 请参见捆绑的 Microsoft Teams 或 Google Chat Plugin 包中的真实示例。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      入站消息处理特定于 Channel。每个 Channel Plugin 拥有自己的入站管道。查看捆绑的 Channel Plugin（例如 Microsoft Teams 或 Google Chat Plugin 包）以了解真实模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="测试">
在 `src/channel.test.ts` 中编写同位置测试：

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    有关共享测试助手，请参见[测试](/plugins/sdk-testing)。

</Step>
</Steps>

## 文件结构

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 元数据
├── openclaw.plugin.json      # 带配置 Schema 的 Manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公共导出（可选）
├── runtime-api.ts            # 内部运行时导出（可选）
└── src/
    ├── channel.ts            # 通过 createChatChannelPlugin 的 ChannelPlugin
    ├── channel.test.ts       # 测试
    ├── client.ts             # 平台 API 客户端
    └── runtime.ts            # 运行时存储（如果需要）
```

## 高级主题

<CardGroup cols={2}>
  <Card title="Threading 选项" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    固定、账户范围或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和操作发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/plugins/architecture-internals#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时助手" icon="settings" href="/plugins/sdk-runtime">
    通过 api.runtime 的 TTS、STT、媒体、子 Agent
  </Card>
  <Card title="Channel 轮次内核" icon="bolt" href="/plugins/sdk-channel-turn">
    共享入站事件生命周期：摄取、解析、记录、分发、最终化
  </Card>
</CardGroup>

<Note>
一些捆绑的助手接缝仍然用于捆绑 Plugin 维护和兼容性。除非您直接维护该捆绑 Plugin 系列，否则这些不是新 Channel Plugin 的推荐模式；优先使用通用 SDK 表面中的通用 Channel/设置/回复/运行时子路径。
</Note>

## 后续步骤

- [Provider Plugin](/plugins/sdk-provider-plugins) - 如果您的 Plugin 也提供模型
- [SDK 概览](/plugins/sdk-overview) - 完整的子路径导入参考
- [SDK 测试](/plugins/sdk-testing) - 测试工具和契约测试
- [Plugin Manifest](/plugins/manifest) - 完整的 Manifest Schema

## 相关

- [Plugin SDK 设置](/plugins/sdk-setup)
- [构建 Plugin](/plugins/building-plugins)
- [Agent Harness Plugin](/plugins/sdk-agent-harness)
