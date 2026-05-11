---
mmh3_hash: "808887a2fcdb5a27494fbfc414c60441"
summary: "Plugin Hook：拦截 Agent、工具、消息、Session 和 Gateway 生命周期事件"
title: "Plugin Hook"
read_when:
  - 您正在构建需要 before_tool_call、before_agent_reply、消息 Hook 或生命周期 Hook 的 Plugin
  - 您需要从 Plugin 阻止、重写或要求批准工具调用
  - 您在决定使用内部 Hook 还是 Plugin Hook
---

Plugin Hook 是 OpenClaw Plugin 的进程内扩展点。当 Plugin 需要检查或更改 Agent 运行、工具调用、消息流、Session 生命周期、Subagent 路由、安装或 Gateway 启动时使用它们。

当您需要为命令和 Gateway 事件（如 `/new`、`/reset`、`/stop`、`agent:bootstrap` 或 `gateway:startup`）安装小型操作员 `HOOK.md` 脚本时，请改用[内部 Hook](/automation/hooks)。

## 快速开始

使用插件入口中的 `api.on(...)` 注册类型化 Plugin Hook：

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
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
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

Hook 处理程序按降序 `priority` 顺序依次运行。相同优先级的 Hook 保持注册顺序。

`api.on(name, handler, opts?)` 接受：

- `priority` — 处理程序排序（值越高越先运行）。
- `timeoutMs` — 可选的每个 Hook 预算。设置后，Hook 运行器在预算耗尽后中止该处理程序并继续下一个，而不是让缓慢的设置或召回工作消耗调用方配置的模型超时。省略则使用 Hook 运行器通用应用的默认观察/决策超时。

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

`hooks.timeouts.<hookName>` 覆盖 `hooks.timeoutMs`，后者覆盖 Plugin 编写的 `api.on(..., { timeoutMs })` 值。每个配置值必须是不超过 600000 毫秒的正整数。对已知缓慢的 Hook 使用每 Hook 覆盖，以避免单个 Plugin 在所有地方获得更长的预算。

每个 Hook 接收 `event.context.pluginConfig`，即注册该处理程序的 Plugin 的已解析配置。将其用于需要当前 Plugin 选项的 Hook 决策；OpenClaw 按处理程序注入它，而不会更改其他 Plugin 看到的共享事件对象。

## Hook 目录

Hook 按其扩展的界面分组。**粗体**名称接受决策结果（阻止、取消、覆盖或要求审批）；所有其他的仅用于观察。

**Agent 轮次**

- `before_model_resolve` — 在 Session 消息加载之前覆盖 Provider 或模型
- `agent_turn_prepare` — 消费排队的 Plugin 轮次注入，并在提示 Hook 之前添加同轮次上下文
- `before_prompt_build` — 在模型调用之前添加动态上下文或系统提示文本
- `before_agent_start` — 仅兼容性的组合阶段；优先使用上面两个 Hook
- **`before_agent_run`** — 在模型提交之前检查最终提示和 Session 消息，并可选地阻止运行
- **`before_agent_reply`** — 用合成回复或静默短路模型轮次
- **`before_agent_finalize`** — 检查自然最终答案并请求再次模型传递
- `agent_end` — 观察最终消息、成功状态和运行持续时间
- `heartbeat_prompt_contribution` — 仅为心跳轮次添加心跳专用上下文，用于后台监控和生命周期 Plugin

**对话观察**

- `model_call_started`/`model_call_ended` — 观察已净化的 Provider/模型调用元数据、计时、结果和有界请求 id 哈希，不含提示或响应内容
- `llm_input` — 观察 Provider 输入（系统提示、提示、历史记录）
- `llm_output` — 观察 Provider 输出

**工具**

- **`before_tool_call`** — 重写工具参数、阻止执行或要求审批
- `after_tool_call` — 观察工具结果、错误和持续时间
- **`tool_result_persist`** — 重写工具结果生成的助手消息
- **`before_message_write`** — 检查或阻止正在进行的消息写入（少见）

**消息和交付**

- **`inbound_claim`** — 在 Agent 路由之前声明入站消息（合成回复）
- `message_received` — 观察入站内容、发送者、线程和元数据
- **`message_sending`** — 重写出站内容或取消交付
- `message_sent` — 观察出站交付成功或失败
- **`before_dispatch`** — 在 Channel 切换之前检查或重写出站调度
- **`reply_dispatch`** — 参与最终回复调度管道

**Session 和压缩**

- `session_start`/`session_end` — 跟踪 Session 生命周期边界
- `before_compaction`/`after_compaction` — 观察或注释压缩周期
- `before_reset` — 观察 Session 重置事件（`/reset`、程序化重置）

**Subagent**

- `subagent_spawning`/`subagent_delivery_target`/`subagent_spawned`/`subagent_ended` — 协调 Subagent 路由和完成交付

**生命周期**

- `gateway_start`/`gateway_stop` — 随 Gateway 启动或停止 Plugin 拥有的服务
- `cron_changed` — 观察 Gateway 拥有的 Cron 生命周期变更（添加、更新、移除、启动、完成、计划）
- **`before_install`** — 检查 Skill 或 Plugin 安装扫描并可选地阻止

## 工具调用策略

`before_tool_call` 接收：

- `event.toolName`
- `event.params`
- 可选的 `event.derivedPaths`，包含对已知工具包络（如 `apply_patch`）进行最佳努力宿主派生的目标路径提示；如果存在，这些路径可能不完整或可能过度近似工具实际将触及的内容（例如，输入格式错误或不完整时）
- 可选的 `event.runId`
- 可选的 `event.toolCallId`
- 上下文字段，如 `ctx.agentId`、`ctx.sessionKey`、`ctx.sessionId`、`ctx.runId`、`ctx.jobId`（在 Cron 驱动的运行上设置）和诊断 `ctx.trace`

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
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

规则：

- `block: true` 是终端的，跳过较低优先级的处理程序。
- `block: false` 被视为无决策。
- `params` 重写工具参数以执行。
- `requireApproval` 暂停 Agent 运行并通过 Plugin 审批询问用户。`/approve` 命令可以批准执行和 Plugin 审批两者。
- 较低优先级的 `block: true` 仍然可以在较高优先级的 Hook 请求审批后阻止。
- `onResolution` 接收已解析的审批决策——`allow-once`、`allow-always`、`deny`、`timeout` 或 `cancelled`。

需要宿主级别策略的打包 Plugin 可以使用 `api.registerTrustedToolPolicy(...)` 注册受信任的工具策略。这些在普通的 `before_tool_call` Hook 和外部 Plugin 决策之前运行。仅将其用于受宿主信任的门控，如工作区策略、预算执行或保留的工作流安全。外部 Plugin 应使用普通的 `before_tool_call` Hook。

### 工具结果持久化

工具结果可以包含用于 UI 渲染、诊断、媒体路由或 Plugin 拥有的元数据的结构化 `details`。将 `details` 视为运行时元数据，而不是提示内容：

- OpenClaw 在 Provider 重放和压缩输入之前去除 `toolResult.details`，以便元数据不成为模型上下文。
- 持久化的 Session 条目仅保留有界的 `details`。超大的 details 被替换为紧凑摘要和 `persistedDetailsTruncated: true`。
- `tool_result_persist` 和 `before_message_write` 在最终持久化上限之前运行。Hook 仍应保持返回的 `details` 较小，避免仅将与提示相关的文本放在 `details` 中；将模型可见的工具输出放在 `content` 中。

## 提示和模型 Hook

对新 Plugin 使用特定阶段的 Hook：

- `before_model_resolve`：仅接收当前提示和附件元数据。返回 `providerOverride` 或 `modelOverride`。
- `agent_turn_prepare`：接收当前提示、准备好的 Session 消息以及为此 Session 排干的任何精确一次排队注入。返回 `prependContext` 或 `appendContext`。
- `before_prompt_build`：接收当前提示和 Session 消息。返回 `prependContext`、`appendContext`、`systemPrompt`、`prependSystemContext` 或 `appendSystemContext`。
- `heartbeat_prompt_contribution`：仅为心跳轮次运行，返回 `prependContext` 或 `appendContext`。适用于需要汇总当前状态而不更改用户发起轮次的后台监控器。

`before_agent_start` 保留用于兼容性。优先使用上面的显式 Hook，以便您的 Plugin 不依赖于旧版组合阶段。

`before_agent_run` 在提示构建之后和任何模型输入（包括提示本地图像加载和 `llm_input` 观察）之前运行。它将当前用户输入作为 `prompt` 接收，以及 `messages` 中加载的 Session 历史记录和活动系统提示。返回 `{ outcome: "block", reason, message? }` 在模型读取提示之前停止运行。`reason` 是内部的；`message` 是面向用户的替换。唯一支持的结果是 `pass` 和 `block`；不支持的决策形状以关闭方式失败。

当运行被阻止时，OpenClaw 仅将替换文本存储在 `message.content` 中，加上非敏感的阻止元数据，如阻止的 Plugin id 和时间戳。原始用户文本不会保留在转录或未来上下文中。内部阻止原因被视为敏感信息，从转录、历史记录、广播、日志和诊断有效载荷中排除。可观察性应使用净化字段，如阻止者 id、结果、时间戳或安全类别。

`before_agent_start` 和 `agent_end` 在 OpenClaw 可以识别活动运行时包含 `event.runId`。相同的值也可在 `ctx.runId` 上获得。Cron 驱动的运行还公开 `ctx.jobId`（原始 Cron 作业 id），以便 Plugin Hook 可以将指标、副作用或状态限定到特定的计划作业。

对于来自 Channel 的运行，`ctx.messageProvider` 是 Provider 界面，如 `discord` 或 `telegram`，而 `ctx.channelId` 是 OpenClaw 可以从 Session 键或交付元数据派生时的会话目标标识符。

对于不应接收原始提示、历史记录、响应、标头、请求正文或 Provider 请求 ID 的 Provider 调用遥测，使用 `model_call_started` 和 `model_call_ended`。这些 Hook 包含稳定的元数据，如 `runId`、`callId`、`provider`、`model`、可选的 `api`/`transport`、终端 `durationMs`/`outcome` 和 OpenClaw 可以派生有界 Provider 请求 id 哈希时的 `upstreamRequestIdHash`。

`before_agent_finalize` 仅在线束即将接受自然最终助手答案时运行。它不是 `/stop` 取消路径，当用户中止轮次时不会运行。返回 `{ action: "revise", reason }` 请求线束在最终确定之前再次传递模型，返回 `{ action: "finalize", reason? }` 强制最终确定，或省略结果以继续。Codex 原生 `Stop` Hook 作为 OpenClaw `before_agent_finalize` 决策中继到此 Hook。

返回 `action: "revise"` 时，Plugin 可以包含 `retry` 元数据，使额外的模型传递有界且可安全重放：

```typescript
type BeforeAgentFinalizeRetry = {
  instruction: string;
  idempotencyKey?: string;
  maxAttempts?: number;
};
```

`instruction` 附加到发送给线束的修订原因。`idempotencyKey` 让宿主跨等效的最终确定决策为同一 Plugin 请求计数重试，而 `maxAttempts` 限制宿主在继续使用自然最终答案之前允许的额外传递次数。

需要原始对话 Hook（`before_model_resolve`、`before_agent_reply`、`llm_input`、`llm_output`、`before_agent_finalize`、`agent_end` 或 `before_agent_run`）的非打包 Plugin 必须设置：

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

可以使用 `plugins.entries.<id>.hooks.allowPromptInjection=false` 按 Plugin 禁用提示修改 Hook。

## 消息 Hook

将消息 Hook 用于 Channel 级别的路由和交付策略：

- `message_received`：观察入站内容、发送者、`threadId`、`messageId`、`senderId`、可选的运行/Session 关联和元数据。
- `message_sending`：重写 `content` 或返回 `{ cancel: true }`。
- `message_sent`：观察最终成功或失败。

对于仅音频的 TTS 回复，即使 Channel 有效负载没有可见的文本/字幕，`content` 也可能包含隐藏的口语转录。重写该 `content` 仅更新 Hook 可见的转录；它不作为媒体字幕渲染。

消息 Hook 上下文在可用时公开稳定的关联字段：`ctx.sessionKey`、`ctx.runId`、`ctx.messageId`、`ctx.senderId`、`ctx.trace`、`ctx.traceId`、`ctx.spanId`、`ctx.parentSpanId` 和 `ctx.callDepth`。在使用旧版元数据之前，优先使用这些一级字段。

优先使用类型化的 `threadId` 和 `replyToId` 字段，而不是特定于 Channel 的元数据。

决策规则：

- 带有 `cancel: true` 的 `message_sending` 是终端的。
- 带有 `cancel: false` 的 `message_sending` 被视为无决策。
- 重写的 `content` 继续到较低优先级的 Hook，除非后续 Hook 取消交付。

## 安装 Hook

`before_install` 在 Skill 和 Plugin 安装的内置扫描后运行。返回额外的发现结果或 `{ block: true, blockReason }` 以停止安装。

`block: true` 是终端的。`block: false` 被视为无决策。

## Gateway 生命周期

将 `gateway_start` 用于需要 Gateway 拥有状态的 Plugin 服务。上下文公开 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 用于 Cron 检查和更新。使用 `gateway_stop` 清理长期运行的资源。

不要依赖内部 `gateway:startup` Hook 用于 Plugin 拥有的运行时服务。

## 即将到来的弃用

一些与 Hook 相邻的界面已弃用但仍受支持。在下一个主要版本之前迁移：

- **入站声明和消息接收处理程序中的纯文本 Channel 包络**。读取 `BodyForAgent` 和结构化用户上下文块，而不是解析平面包络文本。请参见[纯文本 Channel 包络 → BodyForAgent](/plugins/sdk-migration#active-deprecations)。
- **`before_agent_start`** 保留用于兼容性。新 Plugin 应使用 `before_model_resolve` 和 `before_prompt_build` 而不是组合阶段。
- **`before_tool_call` 中的 `onResolution`** 现在使用类型化的 `PluginApprovalResolution` 联合（`allow-once`/`allow-always`/`deny`/`timeout`/`cancelled`），而不是自由形式的 `string`。

有关完整列表——内存能力注册、Provider 思考配置文件、外部身份验证 Provider、Provider 发现类型、任务运行时访问器以及 `command-auth` → `command-status` 重命名——请参见 [Plugin SDK 迁移 → 活跃弃用](/plugins/sdk-migration#active-deprecations)。

## 相关

- [Plugin SDK 迁移](/plugins/sdk-migration) — 活跃弃用和删除时间表
- [构建 Plugin](/plugins/building-plugins)
- [Plugin SDK 概览](/plugins/sdk-overview)
- [Plugin 入口点](/plugins/sdk-entrypoints)
- [内部 Hook](/automation/hooks)
- [Plugin 架构内部机制](/plugins/architecture-internals)
