---
mmh3_hash: "446447f75b006d1f4df0aa13422b9c60"
summary: "Plugin Hook：拦截 Agent、工具、消息、Session 和 Gateway 生命周期事件"
title: "Plugin Hook"
read_when:
  - 您正在构建需要 before_tool_call、before_agent_reply、消息 Hook 或生命周期 Hook 的 Plugin
  - 您需要通过 Plugin 阻止、重写或要求审批 Tool 调用
  - 您正在选择内部 Hook 和 Plugin Hook 之间
---

Plugin Hook 是 OpenClaw Plugin 的进程内扩展点。当 Plugin 需要检查或更改 Agent 运行、Tool 调用、消息流、Session 生命周期、子 Agent 路由、安装或 Gateway 启动时使用它们。

当您想要用于命令和 Gateway 事件（如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`）的小型操作员安装 `HOOK.md` 脚本时，请改用[内部 Hook](/automation/hooks)。

## 快速入门

使用 Plugin 入口点中的 `api.on(...)` 注册类型化 Plugin Hook：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "运行网络搜索",
            description: `允许搜索查询：${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Hook 处理程序按 `priority` 降序顺序运行。相同优先级的 Hook 保持注册顺序。

`api.on(name, handler, opts?)` 接受：

- `priority` - 处理程序排序（较高的先运行）。
- `timeoutMs` - 可选的每个 Hook 预算。设置后，Hook 运行器在预算耗尽时中止该处理程序并继续下一个，而不是让缓慢的设置或召回工作消耗调用者配置的模型超时。省略以使用 Hook 运行器通用应用的默认观测/决策超时。

操作员也可以在不修补 Plugin 代码的情况下设置 Hook 预算：

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "timeoutMs": 30000,
          "timeouts": {
            "before_prompt_build": 90000,
            "agent_end": 60000
          }
        }
      }
    }
  }
}
```

`hooks.timeouts.<hookName>` 覆盖 `hooks.timeoutMs`，后者覆盖 Plugin 编写的 `api.on(..., { timeoutMs })` 值。每个配置值必须是不超过 600000 毫秒的正整数。对于已知的慢速 Hook，优先使用每个 Hook 的覆盖，以免一个 Plugin 在所有地方都获得更长的预算。

每个 Hook 接收 `event.context.pluginConfig`，即注册该处理程序的 Plugin 的已解析配置。将其用于需要当前 Plugin 选项的 Hook 决策；OpenClaw 每个处理程序注入一次，而不改变其他 Plugin 看到的共享事件对象。

## Hook 目录

Hook 按其扩展的界面分组。**粗体**名称接受决策结果（阻止、取消、覆盖或要求审批）；其他全部仅供观测。

**Agent 轮次**

- `before_model_resolve` - 在 Session 消息加载之前覆盖 Provider 或模型
- `agent_turn_prepare` - 消耗排队的 Plugin 轮次注入并在 Prompt Hook 之前添加同轮次上下文
- `before_prompt_build` - 在模型调用之前添加动态上下文或系统提示文本
- `before_agent_start` - 仅兼容性的组合阶段；优先使用上面两个 Hook
- **`before_agent_run`** - 在模型提交之前检查最终提示和 Session 消息，并可选择阻止运行
- **`before_agent_reply`** - 用合成回复或静默短路模型轮次
- **`before_agent_finalize`** - 检查自然最终答案并请求再进行一次模型处理
- `agent_end` - 观测最终消息、成功状态和运行持续时间
- `heartbeat_prompt_contribution` - 为后台监控和生命周期 Plugin 添加仅心跳上下文

**对话观测**

- `model_call_started` / `model_call_ended` - 观测经过净化的 Provider/模型调用元数据、时间、结果和有界请求 ID 哈希，不含提示或响应内容
- `llm_input` - 观测 Provider 输入（系统提示、提示、历史记录）
- `llm_output` - 观测 Provider 输出、使用量，以及可用时的已解析 `contextTokenBudget`

**Tool**

- **`before_tool_call`** - 重写 Tool 参数、阻止执行或要求审批
- `after_tool_call` - 观测 Tool 结果、错误和持续时间
- **`tool_result_persist`** - 重写从 Tool 结果产生的助手消息
- **`before_message_write`** - 检查或阻止进行中的消息写入（少见）

**消息和投递**

- **`inbound_claim`** - 在 Agent 路由之前声明入站消息（合成回复）
- `message_received` - 观测入站内容、发送者、线程和元数据
- **`message_sending`** - 重写出站内容或取消投递
- `message_sent` - 观测出站投递成功或失败
- **`before_dispatch`** - 在 Channel 交接之前检查或重写出站调度
- **`reply_dispatch`** - 参与最终回复调度管道

**Session 和 Compaction**

- `session_start` / `session_end` - 跟踪 Session 生命周期边界。事件的 `reason` 是 `new`、`reset`、`idle`、`daily`、`compaction`、`deleted`、`shutdown`、`restart` 或 `unknown` 之一。当进程在 Session 仍然活跃时被停止或重启时，`shutdown` 和 `restart` 值从 Gateway 关闭终结器触发，以便下游 Plugin（如内存或转录存储）可以最终化否则在重启后会处于开放状态的幽灵行。终结器有时间限制，因此慢速 Plugin 不能阻止 SIGTERM/SIGINT。
- `before_compaction` / `after_compaction` - 观测或注释 Compaction 周期
- `before_reset` - 观测 Session 重置事件（`/reset`、程序化重置）

**子 Agent**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` - 协调子 Agent 路由和完成投递

**生命周期**

- `gateway_start` / `gateway_stop` - 随 Gateway 启动或停止 Plugin 拥有的服务
- `deactivate` - `gateway_stop` 的已弃用兼容性别名；新 Plugin 中使用 `gateway_stop`
- `cron_changed` - 观测 Gateway 拥有的 Cron 生命周期变更（添加、更新、删除、启动、完成、调度）
- **`before_install`** - 检查 Skill 或 Plugin 安装扫描并可选择阻止

## 调试运行时 Hook

当 Plugin 需要为 Agent 轮次切换 Provider 或模型时，使用 `before_model_resolve`。它在模型解析之前运行；`llm_output` 仅在模型尝试产生助手输出后运行。

有关有效的 Session 模型证明，请检查运行时注册，然后使用 `openclaw sessions` 或 Gateway Session/状态界面。在调试 Provider 载荷时，使用 `--raw-stream` 和 `--raw-stream-path <path>` 启动 Gateway；这些标志将原始模型流事件写入 jsonl 文件。

## Tool 调用策略

`before_tool_call` 接收：

- `event.toolName`
- `event.params`
- 可选的 `event.toolKind` 和 `event.toolInputKind`，是专为有意共享名称的 Tool 提供的主机权威鉴别器；例如，外层代码模式 `exec` 调用使用 `toolKind: "code_mode_exec"`，并在已知输入语言时包含 `toolInputKind: "javascript" | "typescript"`
- 可选的 `event.derivedPaths`，包含对已知 Tool 信封（如 `apply_patch`）的尽力主机派生目标路径提示；存在时，这些路径可能不完整或可能过度近似 Tool 实际将触及的内容（例如，对于格式错误或部分输入）
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- 上下文字段，如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 Cron 驱动的运行上设置）、`ctx.toolKind`、`ctx.toolInputKind` 和诊断 `ctx.trace`

它可以返回：

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    allowedDecisions?: Array<"allow-once" | "allow-always" | "deny">;
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

类型化生命周期 Hook 的 Hook 守护行为：

- `block: true` 是终止性的，跳过低优先级处理程序。
- `block: false` 被视为无决策。
- `params` 重写执行的 Tool 参数。
- `requireApproval` 暂停 Agent 运行，并通过 Plugin 审批询问用户。`/approve` 命令可以批准 exec 和 Plugin 审批。
- 低优先级的 `block: true` 在高优先级 Hook 请求审批后仍然可以阻止。
- `onResolution` 接收已解析的审批决定 - `allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要主机级别策略的捆绑 Plugin 可以使用 `api.registerTrustedToolPolicy(...)` 注册受信任的 Tool 策略。这些在普通 `before_tool_call` Hook 和外部 Plugin 决策之前运行。仅将它们用于主机受信任的门控，如工作区策略、预算执行或保留工作流安全。外部 Plugin 应使用普通的 `before_tool_call` Hook。

### Tool 结果持久化

Tool 结果可以包含用于 UI 渲染、诊断、媒体路由或 Plugin 拥有的元数据的结构化 `details`。将 `details` 视为运行时元数据，而不是提示内容：

- OpenClaw 在 Provider 重放和 Compaction 输入之前剥离 `toolResult.details`，以便元数据不会成为模型上下文。
- 持久化的 Session 条目仅保留有界的 `details`。过大的 details 被替换为紧凑的摘要和 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 在最终持久化上限之前运行。Hook 仍然应保持返回的 `details` 较小，并避免仅在 `details` 中放置与提示相关的文本；将模型可见的 Tool 输出放在 `content` 中。

## 提示和模型 Hook

对新 Plugin 使用特定阶段的 Hook：

- `before_model_resolve`：仅接收当前提示和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收当前提示、准备好的 Session 消息，以及为此 Session 排出的任何恰好一次的排队注入。返回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收当前提示和 Session 消息。返回 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：仅针对心跳轮次运行，并返回 `prependContext` 或 `appendContext`。它适用于需要在不更改用户发起的轮次的情况下汇总当前状态的后台监控器。

`before_agent_start` 保留用于兼容性。优先使用上面的显式 Hook，以便您的 Plugin 不依赖于旧版组合阶段。

`before_agent_run` 在提示构建之后和任何模型输入（包括提示本地图像加载和 `llm_input` 观测）之前运行。它接收当前用户输入作为 `prompt`，加上 `messages` 中加载的 Session 历史记录和活跃系统提示。返回 `{ outcome: "block", reason, message? }` 以在模型可以读取提示之前停止运行。`reason` 是内部的；`message` 是面向用户的替换。唯一支持的结果是 `pass` 和 `block`；不支持的决策形状以关闭方式失败。

当运行被阻止时，OpenClaw 仅在 `message.content` 中存储替换文本加上非敏感的阻止元数据，如阻止 Plugin ID 和时间戳。原始用户文本不会保留在转录或未来上下文中。内部阻止原因被视为敏感信息，排除在转录、历史记录、广播、日志和诊断载荷之外。可观测性应使用净化字段，如阻止者 ID、结果、时间戳或安全类别。

`before_agent_start` 和 `agent_end` 在 OpenClaw 可以识别活跃运行时包含 `event.runId`。相同的值也在 `ctx.runId` 上可用。Cron 驱动的运行还公开 `ctx.jobId`（原始 Cron 作业 ID），以便 Plugin Hook 可以将指标、副作用或状态范围限定到特定的计划作业。

对于 Channel 发起的运行，`ctx.messageProvider` 是 Provider 界面，如 `discord` 或 `telegram`，而 `ctx.channelId` 是当 OpenClaw 可以从 Session 键或投递元数据派生时的对话目标标识符。

`agent_end` 是观测 Hook。Gateway 和持久性 Harness 路径在轮次后以即发即忘方式运行它，而短暂的一次性 CLI 路径在进程清理之前等待 Hook Promise，以便受信任的 Plugin 可以刷新终端可观测性或捕获状态。Hook 运行器应用 30 秒超时，以便挂起的 Plugin 或嵌入端点不会让 Hook Promise 永远待定。超时会被记录，OpenClaw 继续；除非 Plugin 也使用自己的中止信号，否则它不取消 Plugin 拥有的网络工作。

使用 `model_call_started` 和 `model_call_ended` 进行不应接收原始提示、历史记录、响应、头、请求体或 Provider 请求 ID 的 Provider 调用遥测。这些 Hook 包含稳定的元数据，如 `runId`、`callId`、`provider`、`model`、可选的 `api`/`transport`、终止的 `durationMs`/`outcome`，以及当 OpenClaw 可以派生有界 Provider 请求 ID 哈希时的 `upstreamRequestIdHash`。当运行时已解析上下文窗口元数据时，Hook 事件和上下文还包含 `contextTokenBudget`（模型/配置/Agent 上限后的有效 Token 预算），以及应用了较低上限时的 `contextWindowSource` 和 `contextWindowReferenceTokens`。

`before_agent_finalize` 仅在 Harness 即将接受自然的最终助手答案时运行。它不是 `/stop` 取消路径，在用户中止轮次时不运行。返回 `{ action: "revise", reason }` 要求 Harness 在最终确定之前再进行一次模型处理，返回 `{ action: "finalize", reason? }` 强制最终确定，或省略结果以继续。Codex 原生 `Stop` Hook 作为 OpenClaw `before_agent_finalize` 决策被中继到此 Hook。

返回 `action: "revise"` 时，Plugin 可以包含 `retry` 元数据使额外的模型处理有界且重放安全：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 附加到发送给 Harness 的修订原因。`idempotencyKey` 让主机在等效的最终确定决策中计算同一 Plugin 请求的重试，`maxAttempts` 限制主机在继续自然最终答案之前允许的额外处理次数。

需要原始对话 Hook（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` 或 `before_agent_run`）的非捆绑 Plugin 必须设置：

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

可以使用 `plugins.entries.<id>.hooks.allowPromptInjection=false` 按 Plugin 禁用提示变更 Hook 和持久的下一个轮次注入。

### Session 扩展和下一个轮次注入

工作流 Plugin 可以使用 `api.registerSessionExtension(...)` 持久化小型 JSON 兼容的 Session 状态，并通过 Gateway `sessions.pluginPatch` 方法更新它。Session 行通过 `pluginExtensions` 投影已注册的扩展状态，让控制 UI 和其他客户端渲染 Plugin 拥有的状态，而无需了解 Plugin 内部。

当 Plugin 需要持久上下文在下一个模型轮次中恰好到达一次时，使用 `api.enqueueNextTurnInjection(...)`。OpenClaw 在 Prompt Hook 之前排出排队的注入，丢弃过期的注入，并按每个 Plugin 的 `idempotencyKey` 去重。这是审批恢复、策略摘要、后台监控增量和命令延续的正确接缝，这些应该在下一个轮次对模型可见，但不应成为永久系统提示文本。

清理语义是契约的一部分。Session 扩展清理和运行时生命周期清理回调接收 `reset`、`delete`、`disable` 或 `restart`。主机删除拥有 Plugin 的持久 Session 扩展状态和 reset/delete/disable 的待处理下一个轮次注入；restart 保留持久的 Session 状态，而清理回调让 Plugin 释放调度器作业、运行上下文和旧运行时生成的其他带外资源。

## 消息 Hook

将消息 Hook 用于 Channel 级别的路由和投递策略：

- `message_received`：观测入站内容、发送者、`threadId`、`messageId`、`senderId`、可选的运行/Session 关联和元数据。
- `message_sending`：重写 `content` 或返回 `{ cancel: true }`。
- `message_sent`：观测最终成功或失败。

对于仅音频 TTS 回复，即使 Channel 载荷没有可见文本/标题，`content` 也可能包含隐藏的口语转录。重写该 `content` 仅更新 Hook 可见的转录；它不会渲染为媒体标题。

消息 Hook 上下文在可用时公开稳定的关联字段：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。在读取旧版元数据之前，优先使用这些一等字段。

优先使用类型化的 `threadId` 和 `replyToId` 字段，而不是使用 Channel 特定的元数据。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终止性的。
- 带有 `cancel: false` 的 `message_sending` 被视为无决策。
- 重写的 `content` 继续到低优先级 Hook，除非后来的 Hook 取消投递。
- `message_sending` 可以返回 `cancelReason` 和有界的 `metadata` 以及取消。新消息生命周期 API 将此公开为原因为 `cancelled_by_message_sending_hook` 的被抑制投递结果；旧版直接投递保持返回空结果数组以保持兼容性。
- `message_sent` 仅供观测。处理程序失败会被记录，不改变投递结果。

## 安装 Hook

`before_install` 在内置的 Skill 和 Plugin 安装扫描之后运行。返回额外的发现结果或 `{ block: true, blockReason }` 以停止安装。

`block: true` 是终止性的。`block: false` 被视为无决策。

## Gateway 生命周期

将 `gateway_start` 用于需要 Gateway 拥有状态的 Plugin 服务。上下文公开 `ctx.config`、`ctx.workspaceDir` 和用于 Cron 检查和更新的 `ctx.getCron?.()` 。使用 `gateway_stop` 清理长期运行的资源。

不要依赖内部 `gateway:startup` Hook 来获取 Plugin 拥有的运行时服务。

`cron_changed` 为 Gateway 拥有的 Cron 生命周期事件触发，带有覆盖 `added`、`updated`、`removed`、`started`、`finished` 和 `scheduled` 原因的类型化事件载荷。事件携带 `PluginHookGatewayCronJob` 快照（包括存在时的 `state.nextRunAtMs`、`state.lastRunStatus` 和 `state.lastError`）加上 `not-requested` | `delivered` | `not-delivered` | `unknown` 的 `PluginHookGatewayCronDeliveryStatus`。删除的事件仍携带已删除的作业快照，以便外部调度器可以协调状态。在同步外部唤醒调度器时使用运行时上下文中的 `ctx.getCron?.()` 和 `ctx.config`，并将 OpenClaw 作为到期检查和执行的真相来源。

## 即将到来的弃用

一些与 Hook 相邻的界面已弃用但仍受支持。在下一个主要发布之前迁移：

- **`inbound_claim` 和 `message_received` 处理程序中的明文 Channel 信封**。读取 `BodyForAgent` 和结构化用户上下文块，而不是解析平面信封文本。请参见[明文 Channel 信封 → BodyForAgent](/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 保留用于兼容性。新 Plugin 应使用 `before_model_resolve` 和 `before_prompt_build` 而不是组合阶段。
- **`deactivate`** 作为已弃用的清理兼容性别名保留，直到 2026-08-16 之后。新 Plugin 应使用 `gateway_stop`。
- **`before_tool_call` 中的 `onResolution`** 现在使用类型化的 `PluginApprovalResolution` 联合（`allow-once` / `allow-always` / `deny` / `timeout` / `cancelled`），而不是自由形式的 `string`。

有关完整列表 - 内存能力注册、Provider 思考配置文件、外部身份验证 Provider、Provider 发现类型、任务运行时访问器以及 `command-auth` → `command-status` 重命名 - 请参见 [Plugin SDK 迁移 → 活跃弃用](/plugins/sdk-migration#active-deprecations)。

## 相关

- [Plugin SDK 迁移](/plugins/sdk-migration) - 活跃弃用和删除时间表
- [构建 Plugin](/plugins/building-plugins)
- [Plugin SDK 概览](/plugins/sdk-overview)
- [Plugin 入口点](/plugins/sdk-entrypoints)
- [内部 Hook](/automation/hooks)
- [Plugin 架构内部](/plugins/architecture-internals)
