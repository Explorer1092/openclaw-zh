---
mmh3_hash: "33779eee9f4aac90ac5eee8bf329254d"
title: "Plugin SDK 迁移"
sidebarTitle: "迁移至 SDK"
summary: "从旧版向后兼容层迁移到现代 Plugin SDK"
read_when:
  - 您看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
  - 您看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
  - 您在 OpenClaw 2026.4.25 之前使用过 api.registerEmbeddedExtensionFactory
  - 您正在将 Plugin 更新为现代 Plugin 架构
  - 您维护着一个外部 OpenClaw Plugin
doc-schema-version: 1
---

OpenClaw 已从广泛的向后兼容层迁移到具有专注、有文档记录的导入的现代 Plugin 架构。如果您的 Plugin 是在新架构之前构建的，本指南可帮助您进行迁移。

## 正在改变什么

旧的 Plugin 系统提供了两个宽泛的开放表面，让 Plugin 可以从单个入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** - 重新导出数十个辅助函数的单一导入。它的引入是为了在构建新 Plugin 架构时保持旧版基于 Hook 的 Plugin 正常工作。
- **`openclaw/plugin-sdk/infra-runtime`** - 一个宽泛的运行时辅助函数桶，混合了系统事件、心跳状态、交付队列、fetch/代理辅助函数、文件辅助函数、审批类型和无关的实用程序。
- **`openclaw/plugin-sdk/config-runtime`** - 一个宽泛的配置兼容性桶，在迁移窗口期间仍然携带已弃用的直接加载/写入辅助函数。
- **`openclaw/extension-api`** - 一个给 Plugin 直接访问主机端辅助函数（如嵌入式 Agent 运行器）的桥接。
- **`api.registerEmbeddedExtensionFactory(...)`** - 一个已删除的仅限 Pi 的捆绑扩展 Hook，可以观察嵌入式运行器事件，如 `tool_result`。

宽泛的导入表面现在已**弃用**。它们在运行时仍然有效，但新 Plugin 不得使用它们，现有 Plugin 应在下一个主要版本删除它们之前完成迁移。仅限 Pi 的嵌入式扩展工厂注册 API 已被删除；请改用工具结果中间件。

OpenClaw 不会在同一次引入替代方案的变更中删除或重新解释已记录的 Plugin 行为。破坏性契约变更必须首先经过兼容性适配器、诊断、文档和弃用窗口。这适用于 SDK 导入、Manifest 字段、设置 API、Hook 和运行时注册行为。

<Warning>
  向后兼容层将在未来的主要版本中删除。在此之后，仍从这些表面导入的 Plugin 将会中断。仅限 Pi 的嵌入式扩展工厂注册已不再加载。
</Warning>

## 为何改变

旧方法导致了以下问题：

- **启动缓慢** - 导入一个辅助函数会加载数十个不相关的模块
- **循环依赖** - 宽泛的重新导出使得容易创建导入循环
- **不清晰的 API 表面** - 无法分辨哪些导出是稳定的，哪些是内部的

现代 Plugin SDK 解决了这个问题：每个导入路径（`openclaw/plugin-sdk/<子路径>`）都是一个小型、自包含的模块，具有明确的目的和有文档记录的契约。

捆绑 Channel 的旧版 Provider 便利接缝也已消失。Channel 品牌辅助接缝是私有单体仓库快捷方式，而不是稳定的 Plugin 契约。请改用窄泛型 SDK 子路径。在捆绑 Plugin 工作区内，将 Provider 拥有的辅助函数保留在该 Plugin 自己的 `api.ts` 或 `runtime-api.ts` 中。

当前捆绑 Provider 示例：

- Anthropic 将 Claude 特定的流辅助函数保留在其自己的 `api.ts` / `contract-api.ts` 接缝中
- OpenAI 将 Provider 构建器、默认模型辅助函数和实时 Provider 构建器保留在其自己的 `api.ts` 中
- OpenRouter 将 Provider 构建器和入门/配置辅助函数保留在其自己的 `api.ts` 中

## Talk 和实时语音迁移计划

实时语音、电话、会议和浏览器 Talk 代码正在从表面本地轮次记账迁移到由 `openclaw/plugin-sdk/realtime-voice` 导出的共享 Talk Session 控制器。新控制器拥有通用 Talk 事件封包、活跃轮次状态、捕获状态、输出音频状态、最近事件历史记录和过时轮次拒绝。Provider Plugin 应继续拥有供应商特定的实时 Session；表面 Plugin 应继续拥有捕获、播放、电话和会议细节。

此 Talk 迁移故意采用干净的破坏性方式：

1. 在 `plugin-sdk/realtime-voice` 中保留共享控制器/运行时原语。
2. 将捆绑表面迁移到共享控制器：浏览器中继、托管房间切换、语音通话实时、语音通话流式 STT、Google Meet 实时和原生按压通话。
3. 将旧版 Talk RPC 族替换为最终的 `talk.session.*` 和 `talk.client.*` API。
4. 在 Gateway `hello-ok.features.events` 中发布一个实时 Talk 事件 Channel：`talk.event`。
5. 删除旧的实时 HTTP 端点和任何请求时指令覆盖路径。

除非您正在实现低级适配器或测试固件，否则新代码不应直接调用 `createTalkEventSequencer(...)`。优先使用共享控制器，以便不能在没有轮次 ID 的情况下发出轮次范围的事件，过时的 `turnEnd` / `turnCancel` 调用不能清除更新的活跃轮次，并且输出音频生命周期事件在电话、会议、浏览器中继、托管房间切换和原生 Talk 客户端之间保持一致。

目标公共 API 形状为：

```typescript
// Gateway 拥有的 Talk Session API。
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// 客户端拥有的 Provider Session API。
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
```

浏览器拥有的 WebRTC/Provider WebSocket Session 使用 `talk.client.create`，因为浏览器拥有 Provider 协商和媒体传输，而 Gateway 拥有凭据、指令和工具策略。`talk.session.*` 是 Gateway 管理的实时中继、Gateway 管理的转录和托管房间原生 STT/TTS Session 的通用 Gateway 管理表面。

将实时选择器放在 `talk.provider` / `talk.providers` 旁边的旧版配置应使用 `openclaw doctor --fix` 修复；运行时 Talk 不会将语音/TTS Provider 配置重新解释为实时 Provider 配置。

支持的 `talk.session.create` 组合故意保持精简：

| 模式            | 传输            | Brain           | 所有者             | 备注                                                                                                                 |
| --------------- | --------------- | --------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | 通过 Gateway 桥接的全双工 Provider 音频；工具调用通过 agent-consult 工具路由。                                       |
| `transcription` | `gateway-relay` | `none`          | Gateway            | 仅流式 STT；调用者发送输入音频并接收转录事件。                                                                       |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生/客户端房间    | 推送通话和步话机风格的房间，客户端拥有捕获/播放，Gateway 拥有轮次状态。                                              |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生/客户端房间    | 仅限管理员的房间模式，用于直接执行 Gateway 工具操作的受信任第一方表面。                                              |

已删除的方法映射：

| 旧方法                           | 新方法                                                   |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` 或 `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

统一控制词汇也是故意精简的：

| 方法                            | 适用于                                                  | 契约                                                                                                                                                                       |
| ------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`、`transcription/gateway-relay` | 将 base64 PCM 音频块追加到由同一 Gateway 连接拥有的 Provider Session。                                                                                                     |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                  | 开始托管房间用户轮次。                                                                                                                                                     |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                  | 在过时轮次验证后结束活跃轮次。                                                                                                                                             |
| `talk.session.cancelTurn`       | 所有 Gateway 拥有的 Session                             | 取消轮次的活跃捕获/Provider/Agent/TTS 工作。                                                                                                                               |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | 停止助手音频输出，而不必结束用户轮次。                                                                                                                                     |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                | 完成由中继发出的 Provider 工具调用；传递 `options.willContinue` 用于临时输出，或传递 `options.suppressResponse` 以满足调用而不需要另一个助手响应。                          |
| `talk.session.close`            | 所有统一 Session                                        | 停止中继 Session 或撤销托管房间状态，然后忘记统一 Session ID。                                                                                                              |

不要在 Core 中引入 Provider 或平台特殊情况来使其工作。Core 拥有 Talk Session 语义。Provider Plugin 拥有供应商 Session 设置。语音通话和 Google Meet 拥有电话/会议适配器。浏览器和原生应用拥有设备捕获/播放 UX。

## 兼容性策略

对于外部 Plugin，兼容性工作遵循以下顺序：

1. 添加新契约
2. 通过兼容性适配器保持旧行为连接
3. 发出一个诊断或警告，命名旧路径和替代方案
4. 在测试中覆盖两个路径
5. 记录弃用和迁移路径
6. 仅在宣布的迁移窗口后才删除，通常在主要版本中

维护者可以使用 `pnpm plugins:boundary-report` 审计当前迁移队列。使用 `pnpm plugins:boundary-report:summary` 获取紧凑计数，`--owner <id>` 用于一个 Plugin 或兼容性所有者，`pnpm plugins:boundary-report:ci` 用于 CI 门控应在到期兼容性记录、跨所有者保留 SDK 导入或未使用的保留 SDK 子路径上失败时。该报告按删除日期对已弃用的兼容性记录进行分组，计算本地代码/文档引用，呈现跨所有者保留 SDK 导入，并汇总私有内存主机 SDK 桥，以便兼容性清理保持显式，而不是依赖临时搜索。保留的 SDK 子路径必须具有跟踪的所有者使用情况；未使用的保留辅助函数导出应从公共 SDK 中删除。

如果 Manifest 字段仍然被接受，Plugin 作者可以继续使用它，直到文档和诊断另有说明。新代码应优先使用有文档记录的替代方案，但现有 Plugin 在普通次要版本中不应中断。

## 如何迁移

<Steps>
  <Step title="迁移运行时配置加载/写入辅助函数">
    捆绑 Plugin 应停止直接调用 `api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)`。优先使用已传入活跃调用路径的配置。需要当前进程快照的长期处理程序可以使用 `api.runtime.config.current()`。需要当前配置的长期 Agent 工具应在 `execute` 内使用工具上下文的 `ctx.getRuntimeConfig()`，以便在配置写入之前创建的工具仍然可以看到刷新的运行时配置。

    配置写入必须通过事务性辅助函数并选择写入后策略：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当调用者知道更改需要干净的 Gateway 重启时，使用 `afterWrite: { mode: "restart", reason: "..." }`；仅当调用者拥有后续操作并故意想要抑制重新加载计划器时，才使用 `afterWrite: { mode: "none", reason: "..." }`。变更结果包括用于测试和日志记录的类型化 `followUp` 摘要；Gateway 负责应用或调度重启。`loadConfig` 和 `writeConfigFile` 在迁移窗口期间作为外部 Plugin 的已弃用兼容性辅助函数保留，并使用 `runtime-config-load-write` 兼容性代码警告一次。捆绑 Plugin 和仓库运行时代码受 `pnpm check:deprecated-api-usage` 和 `pnpm check:no-runtime-action-load-config` 中的扫描器护栏保护：新的生产 Plugin 使用直接失败，直接配置写入失败，Gateway 服务器方法必须使用请求运行时快照，运行时 Channel 发送/操作/客户端辅助函数必须从其边界接收配置，并且长期运行的运行时模块允许零个环境 `loadConfig()` 调用。

    新 Plugin 代码还应避免导入宽泛的 `openclaw/plugin-sdk/config-runtime` 兼容性桶。使用与工作匹配的窄 SDK 子路径：

    | 需求 | 导入 |
    | --- | --- |
    | 配置类型，如 `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | 已加载配置断言和 Plugin 入口配置查找 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 当前运行时快照读取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 配置写入 | `openclaw/plugin-sdk/config-mutation` |
    | Session 存储辅助函数 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表配置 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 组策略运行时辅助函数 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 密钥输入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型/Session 覆盖 | `openclaw/plugin-sdk/model-session-runtime` |

    捆绑 Plugin 及其测试受扫描器保护，防止宽泛桶，因此导入和模拟保持与其需要的行为局部。宽泛桶仍然存在以兼容外部，但新代码不应依赖它。

  </Step>

  <Step title="将 Pi 工具结果扩展迁移到中间件">
    捆绑 Plugin 必须用运行时中立的中间件替换仅限 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 工具结果处理程序。

    ```typescript
    // Pi 和 Codex 运行时动态工具
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同时更新 Plugin Manifest：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部 Plugin 无法注册工具结果中间件，因为它可以在模型看到之前重写高信任工具输出。

  </Step>

  <Step title="将审批原生处理程序迁移到能力事实">
    具有审批功能的 Channel Plugin 现在通过 `approvalCapability.nativeRuntime` 加上共享运行时上下文注册表公开原生审批行为。

    主要变化：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为 `approvalCapability.nativeRuntime`
    - 将审批特定的认证/交付从旧版 `plugin.auth` / `plugin.approvals` 连接移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公共 Channel Plugin 契约中删除；将交付/原生/渲染字段移到 `approvalCapability`
    - `plugin.auth` 仅保留用于 Channel 登录/注销流程；那里的审批认证 Hook 不再被 Core 读取
    - 通过 `openclaw/plugin-sdk/channel-runtime-context` 注册 Channel 拥有的运行时对象，如客户端、令牌或 Bolt 应用
    - 不要从原生审批处理程序发送 Plugin 拥有的重路由通知；Core 现在从实际交付结果拥有路由到其他地方的通知
    - 将 `channelRuntime` 传入 `createChannelManager(...)` 时，提供真实的 `createPluginRuntime().channel` 表面。不完整的存根会被拒绝。

    有关当前审批能力布局，请参见 `/plugins/sdk-channel-plugins`。

  </Step>

  <Step title="审计 Windows 包装器回退行为">
    如果您的 Plugin 使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows `.cmd`/`.bat` 包装器现在在没有显式传递 `allowShellFallback: true` 的情况下会关闭失败。

    ```typescript
    // 之前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 之后
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 仅为故意接受 shell 中介回退的受信任兼容性调用者设置此项。
      allowShellFallback: true,
    });
    ```

    如果您的调用者不故意依赖 shell 回退，请不要设置 `allowShellFallback` 并改为处理抛出的错误。

  </Step>

  <Step title="查找已弃用的导入">
    在您的 Plugin 中搜索来自任一已弃用表面的导入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替换为专注的导入">
    旧表面的每个导出都映射到特定的现代导入路径：

    ```typescript
    // 之前（已弃用的向后兼容层）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 之后（现代专注导入）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    对于主机端辅助函数，请使用注入的 Plugin 运行时而不是直接导入：

    ```typescript
    // 之前（已弃用的 extension-api 桥接）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // 之后（注入的运行时）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    相同的模式适用于其他旧版桥接辅助函数：

    | 旧导入 | 现代等效 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | Session 存储辅助函数 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="替换宽泛的 infra-runtime 导入">
    `openclaw/plugin-sdk/infra-runtime` 仍然存在以兼容外部，但新代码应导入它实际需要的专注辅助函数表面：

    | 需求 | 导入 |
    | --- | --- |
    | 系统事件队列辅助函数 | `openclaw/plugin-sdk/system-event-runtime` |
    | 心跳唤醒、事件和可见性辅助函数 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待处理交付队列清空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Channel 活动遥测 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 内存去重缓存 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全的本地文件/媒体路径辅助函数 | `openclaw/plugin-sdk/file-access-runtime` |
    | 调度器感知的 fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理和受保护的 fetch 辅助函数 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 调度器策略类型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 审批请求/解析类型 | `openclaw/plugin-sdk/approval-runtime` |
    | 审批回复载荷和命令辅助函数 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 错误格式化辅助函数 | `openclaw/plugin-sdk/error-runtime` |
    | 传输就绪等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全令牌辅助函数 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界异步任务并发 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数字强制转换 | `openclaw/plugin-sdk/number-runtime` |
    | 进程本地异步锁 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 文件锁 | `openclaw/plugin-sdk/file-lock` |

    捆绑 Plugin 受扫描器保护，防止 `infra-runtime`，因此仓库代码不能回退到宽泛桶。

  </Step>

  <Step title="迁移 Channel 路由辅助函数">
    新的 Channel 路由代码应使用 `openclaw/plugin-sdk/channel-route`。较旧的路由键和可比较目标名称在迁移窗口期间作为兼容性别名保留，但新 Plugin 应使用直接描述行为的路由名称：

    | 旧辅助函数 | 现代辅助函数 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    现代路由辅助函数在原生审批、回复抑制、入站去重、Cron 交付和 Session 路由中一致地规范化 `{ channel, to, accountId, threadId }`。如果您的 Plugin 拥有自定义目标语法，请使用 `resolveChannelRouteTargetWithParser(...)` 将该解析器适配到相同的路由目标契约。

  </Step>

  <Step title="构建和测试">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

<Accordion title="常见导入路径表">
  | 导入路径 | 用途 | 主要导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范 Plugin 入口辅助函数 | `definePluginEntry` |
  | `plugin-sdk/core` | 用于 Channel 入口定义/构建器的旧版总体重新导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置 Schema 导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单 Provider 入口辅助函数 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 专注的 Channel 入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助函数 | 设置翻译器、允许列表提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置时运行时辅助函数 | `createSetupTranslator`、导入安全的设置补丁适配器、查找注释辅助函数、`promptResolvedAllowFrom`、`splitSetupEntries`、委托设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已弃用的设置适配器别名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 设置工具辅助函数 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助函数 | 账户列表/配置/操作门辅助函数 |
  | `plugin-sdk/account-id` | 账户 ID 辅助函数 | `DEFAULT_ACCOUNT_ID`、账户 ID 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助函数 | 账户查找 + 默认回退辅助函数 |
  | `plugin-sdk/account-helpers` | 窄账户辅助函数 | 账户列表/账户操作辅助函数 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`，加上 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀、打字和源交付连接 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂和 DM 访问辅助函数 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 配置 Schema 构建器 | 共享 Channel 配置 Schema 原语和通用构建器 |
  | `plugin-sdk/bundled-channel-config-schema` | 捆绑配置 Schema | 仅限 OpenClaw 维护的捆绑 Plugin；新 Plugin 必须定义 Plugin 本地 Schema |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的捆绑配置 Schema | 仅兼容别名；维护的捆绑 Plugin 使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助函数 | 命令名称规范化、描述修剪、重复/冲突验证 |
  | `plugin-sdk/channel-policy` | 组/DM 策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账户状态和草稿流生命周期辅助函数 | `createAccountStatusSink`、草稿预览最终化辅助函数 |
  | `plugin-sdk/inbound-envelope` | 入站封包辅助函数 | 共享路由 + 封包构建器辅助函数 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助函数 | 共享记录和分发辅助函数 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析/匹配辅助函数 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助函数 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 出站发送依赖辅助函数 | 轻量级 `resolveOutboundSendDep` 查找，无需导入完整出站运行时 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助函数 | 出站交付、身份/发送委托、Session、格式化和载荷规划辅助函数 |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助函数 | 线程绑定生命周期和适配器辅助函数 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体载荷辅助函数 | 旧版字段布局的 Agent 媒体载荷构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性垫片 | 仅旧版 Channel 运行时实用程序 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化 Plugin 存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 宽泛运行时辅助函数 | 运行时/日志/备份/Plugin 安装辅助函数 |
  | `plugin-sdk/runtime-env` | 窄运行时环境辅助函数 | 日志/运行时环境、超时、重试和退避辅助函数 |
  | `plugin-sdk/plugin-runtime` | 共享 Plugin 运行时辅助函数 | Plugin 命令/Hook/HTTP/交互辅助函数 |
  | `plugin-sdk/hook-runtime` | Hook 管道辅助函数 | 共享 Webhook/内部 Hook 管道辅助函数 |
  | `plugin-sdk/lazy-runtime` | 延迟运行时辅助函数 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助函数 | 共享 exec 辅助函数 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助函数 | 命令格式化、等待、版本辅助函数 |
  | `plugin-sdk/gateway-runtime` | Gateway 辅助函数 | Gateway 客户端、事件循环就绪启动辅助函数和 Channel 状态补丁辅助函数 |
  | `plugin-sdk/config-runtime` | 已弃用的配置兼容性垫片 | 优先使用 `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助函数 | 当捆绑 Telegram 契约表面不可用时，回退稳定的 Telegram 命令验证辅助函数 |
  | `plugin-sdk/approval-runtime` | 审批提示辅助函数 | Exec/Plugin 审批载荷、审批能力/配置文件辅助函数、原生审批路由/运行时辅助函数和结构化审批显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 审批认证辅助函数 | 审批者解析、同聊天操作认证 |
  | `plugin-sdk/approval-client-runtime` | 审批客户端辅助函数 | 原生 exec 审批配置文件/过滤辅助函数 |
  | `plugin-sdk/approval-delivery-runtime` | 审批交付辅助函数 | 原生审批能力/交付适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 审批 Gateway 辅助函数 | 共享审批 Gateway 解析辅助函数 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 审批适配器辅助函数 | 用于热 Channel 入口点的轻量级原生审批适配器加载辅助函数 |
  | `plugin-sdk/approval-handler-runtime` | 审批处理程序辅助函数 | 更广泛的审批处理程序运行时辅助函数；当足够时优先使用窄适配器/Gateway 接缝 |
  | `plugin-sdk/approval-native-runtime` | 审批目标辅助函数 | 原生审批目标/账户绑定辅助函数 |
  | `plugin-sdk/approval-reply-runtime` | 审批回复辅助函数 | Exec/Plugin 审批回复载荷辅助函数 |
  | `plugin-sdk/channel-runtime-context` | Channel 运行时上下文辅助函数 | 通用 Channel 运行时上下文注册/获取/监视辅助函数 |
  | `plugin-sdk/security-runtime` | 安全辅助函数 | 共享信任、DM 门控、根限制文件/路径辅助函数、外部内容和密钥收集辅助函数 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助函数 | 主机允许列表和私有网络策略辅助函数 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助函数 | 固定调度器、受保护 fetch、SSRF 策略辅助函数 |
  | `plugin-sdk/system-event-runtime` | 系统事件辅助函数 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | 心跳辅助函数 | 心跳唤醒、事件和可见性辅助函数 |
  | `plugin-sdk/delivery-queue-runtime` | 交付队列辅助函数 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Channel 活动辅助函数 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重辅助函数 | 内存去重缓存 |
  | `plugin-sdk/file-access-runtime` | 文件访问辅助函数 | 安全的本地文件/媒体路径辅助函数 |
  | `plugin-sdk/transport-ready-runtime` | 传输就绪辅助函数 | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助函数 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助函数 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助函数 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助函数 |
  | `plugin-sdk/fetch-runtime` | 包装的 fetch/代理辅助函数 | `resolveFetch`、代理辅助函数、EnvHttpProxyAgent 选项辅助函数 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助函数 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助函数 | `RetryConfig`, `retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | 允许列表格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允许列表输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令表面辅助函数 | `resolveControlCommandGate`、发送者授权辅助函数、命令注册辅助函数（包括动态参数菜单格式化） |
  | `plugin-sdk/command-status` | 命令状态/帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助函数 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助函数 | Webhook 目标实用程序 |
  | `plugin-sdk/webhook-request-guards` | Webhook 体守卫辅助函数 | 请求体读取/限制辅助函数 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站分发、心跳、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄回复分发辅助函数 | 最终化、Provider 分发和对话标签辅助函数 |
  | `plugin-sdk/reply-history` | 回复历史辅助函数 | `createChannelHistoryWindow`；已弃用的映射辅助函数兼容性导出，如 `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复块辅助函数 | 文本/markdown 分块辅助函数 |
  | `plugin-sdk/session-store-runtime` | Session 存储辅助函数 | 存储路径 + 更新时间辅助函数 |
  | `plugin-sdk/state-paths` | 状态路径辅助函数 | 状态和 OAuth 目录辅助函数 |
  | `plugin-sdk/routing` | 路由/Session 键辅助函数 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、Session 键规范化辅助函数 |
  | `plugin-sdk/status-helpers` | Channel 状态辅助函数 | Channel/账户状态快照/摘要构建器、运行时状态默认值、问题元数据辅助函数 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助函数 | 共享目标解析器辅助函数 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助函数 | Slug/字符串规范化辅助函数 |
  | `plugin-sdk/request-url` | 请求 URL 辅助函数 | 从类请求输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助函数 | 带有规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 通用工具/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | 工具载荷提取 | 从工具结果对象中提取规范化载荷 |
  | `plugin-sdk/tool-send` | 工具发送提取 | 从工具参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助函数 | 共享临时下载路径辅助函数 |
  | `plugin-sdk/logging-core` | 日志辅助函数 | 子系统日志记录器和脱敏辅助函数 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表辅助函数 | Markdown 表模式辅助函数 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复载荷类型 |
  | `plugin-sdk/provider-setup` | 精选本地/自托管 Provider 设置辅助函数 | 自托管 Provider 发现/配置辅助函数 |
  | `plugin-sdk/self-hosted-provider-setup` | 专注的 OpenAI 兼容自托管 Provider 设置辅助函数 | 相同的自托管 Provider 发现/配置辅助函数 |
  | `plugin-sdk/provider-auth-runtime` | Provider 运行时认证辅助函数 | 运行时 API 密钥解析辅助函数 |
  | `plugin-sdk/provider-auth-api-key` | Provider API 密钥设置辅助函数 | API 密钥入门/配置写入辅助函数 |
  | `plugin-sdk/provider-auth-result` | Provider 认证结果辅助函数 | 标准 OAuth 认证结果构建器 |
  | `plugin-sdk/provider-selection-runtime` | Provider 选择辅助函数 | 已配置或自动 Provider 选择和原始 Provider 配置合并 |
  | `plugin-sdk/provider-env-vars` | Provider 环境变量辅助函数 | Provider 认证环境变量查找辅助函数 |
  | `plugin-sdk/provider-model-shared` | 共享 Provider 模型/重放辅助函数 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共享重放策略构建器、Provider 端点辅助函数和模型 ID 规范化辅助函数 |
  | `plugin-sdk/provider-catalog-shared` | 共享 Provider 目录辅助函数 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider 入门补丁 | 入门配置辅助函数 |
  | `plugin-sdk/provider-http` | Provider HTTP 辅助函数 | 通用 Provider HTTP/端点能力辅助函数，包括音频转录多部分表单辅助函数 |
  | `plugin-sdk/provider-web-fetch` | Provider Web fetch 辅助函数 | Web fetch Provider 注册/缓存辅助函数 |
  | `plugin-sdk/provider-web-search-config-contract` | Provider Web 搜索配置辅助函数 | 不需要 Plugin 启用连接的 Provider 的窄 Web 搜索配置/凭据辅助函数 |
  | `plugin-sdk/provider-web-search-contract` | Provider Web 搜索契约辅助函数 | 窄 Web 搜索配置/凭据契约辅助函数，如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` 和范围凭据设置/获取器 |
  | `plugin-sdk/provider-web-search` | Provider Web 搜索辅助函数 | Web 搜索 Provider 注册/缓存/运行时辅助函数 |
  | `plugin-sdk/provider-tools` | Provider 工具/Schema 兼容辅助函数 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` 和 Gemini Schema 清理 + 诊断 |
  | `plugin-sdk/provider-usage` | Provider 使用辅助函数 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 和其他 Provider 使用辅助函数 |
  | `plugin-sdk/provider-stream` | Provider 流包装辅助函数 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装类型和共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装辅助函数 |
  | `plugin-sdk/provider-transport-runtime` | Provider 传输辅助函数 | 原生 Provider 传输辅助函数，如受保护 fetch、传输消息转换和可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助函数 | 媒体 fetch/转换/存储辅助函数、基于 ffprobe 的视频尺寸探测和媒体载荷构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助函数 | 共享故障转移辅助函数、候选选择和图像/视频/音乐生成的缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助函数 | 媒体理解 Provider 类型加上面向 Provider 的图像/音频辅助函数导出 |
  | `plugin-sdk/text-runtime` | 已弃用的宽泛文本兼容导出 | 使用 `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` 和 `logging-core` |
  | `plugin-sdk/text-chunking` | 文本分块辅助函数 | 出站文本分块辅助函数 |
  | `plugin-sdk/speech` | 语音辅助函数 | 语音 Provider 类型加上面向 Provider 的指令、注册表、验证辅助函数和 OpenAI 兼容 TTS 构建器 |
  | `plugin-sdk/speech-core` | 共享语音 Core | 语音 Provider 类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助函数 | Provider 类型、注册表辅助函数和共享 WebSocket Session 辅助函数 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助函数 | Provider 类型、注册表/解析辅助函数、桥接 Session 辅助函数、共享 Agent 说话队列、转录/事件健康、回声抑制和快速上下文咨询辅助函数 |
  | `plugin-sdk/image-generation` | 图像生成辅助函数 | 图像生成 Provider 类型加上图像资源/数据 URL 辅助函数和 OpenAI 兼容图像 Provider 构建器 |
  | `plugin-sdk/image-generation-core` | 共享图像生成 Core | 图像生成类型、故障转移、认证和注册表辅助函数 |
  | `plugin-sdk/music-generation` | 音乐生成辅助函数 | 音乐生成 Provider/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成 Core | 音乐生成类型、故障转移辅助函数、Provider 查找和模型引用解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助函数 | 视频生成 Provider/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成 Core | 视频生成类型、故障转移辅助函数、Provider 查找和模型引用解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助函数 | 交互式回复载荷规范化/缩减 |
  | `plugin-sdk/channel-config-primitives` | Channel 配置原语 | 窄 Channel 配置 Schema 原语 |
  | `plugin-sdk/channel-config-writes` | Channel 配置写入辅助函数 | Channel 配置写入授权辅助函数 |
  | `plugin-sdk/channel-plugin-common` | 共享 Channel 前言 | 共享 Channel Plugin 前言导出 |
  | `plugin-sdk/channel-status` | Channel 状态辅助函数 | 共享 Channel 状态快照/摘要辅助函数 |
  | `plugin-sdk/allowlist-config-edit` | 允许列表配置辅助函数 | 允许列表配置编辑/读取辅助函数 |
  | `plugin-sdk/group-access` | 组访问辅助函数 | 共享组访问决策辅助函数 |
  | `plugin-sdk/direct-dm` | 直接 DM 辅助函数 | 共享直接 DM 认证/守卫辅助函数 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助函数 | 被动 Channel/状态和环境代理辅助函数原语 |
  | `plugin-sdk/webhook-targets` | Webhook 目标辅助函数 | Webhook 目标注册表和路由安装辅助函数 |
  | `plugin-sdk/webhook-path` | 已弃用的 Webhook 路径别名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共享 Web 媒体辅助函数 | 远程/本地媒体加载辅助函数 |
  | `plugin-sdk/zod` | 已弃用的 Zod 兼容重新导出 | 直接从 `zod` 导入 |
  | `plugin-sdk/memory-core` | 捆绑内存 Core 辅助函数 | 内存管理器/配置/文件/CLI 辅助函数表面 |
  | `plugin-sdk/memory-core-engine-runtime` | 内存引擎运行时门面 | 内存索引/搜索运行时门面 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 内存主机基础引擎 | 内存主机基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 内存主机嵌入引擎 | 内存嵌入契约、注册表访问、本地 Provider 和通用批处理/远程辅助函数；具体远程 Provider 位于其拥有的 Plugin 中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 内存主机 QMD 引擎 | 内存主机 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 内存主机存储引擎 | 内存主机存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | 内存主机多模态辅助函数 | 内存主机多模态辅助函数 |
  | `plugin-sdk/memory-core-host-query` | 内存主机查询辅助函数 | 内存主机查询辅助函数 |
  | `plugin-sdk/memory-core-host-secret` | 内存主机密钥辅助函数 | 内存主机密钥辅助函数 |
  | `plugin-sdk/memory-core-host-events` | 已弃用的内存事件别名 | 使用 `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | 内存主机状态辅助函数 | 内存主机状态辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 内存主机 CLI 运行时 | 内存主机 CLI 运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-core` | 内存主机 Core 运行时 | 内存主机 Core 运行时辅助函数 |
  | `plugin-sdk/memory-core-host-runtime-files` | 内存主机文件/运行时辅助函数 | 内存主机文件/运行时辅助函数 |
  | `plugin-sdk/memory-host-core` | 内存主机 Core 运行时别名 | 内存主机 Core 运行时辅助函数的供应商中立别名 |
  | `plugin-sdk/memory-host-events` | 内存主机事件日志别名 | 内存主机事件日志辅助函数的供应商中立别名 |
  | `plugin-sdk/memory-host-files` | 已弃用的内存文件/运行时别名 | 使用 `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助函数 | 内存相邻 Plugin 的共享托管 Markdown 辅助函数 |
  | `plugin-sdk/memory-host-search` | 活跃内存搜索门面 | 延迟活跃内存搜索管理器运行时门面 |
  | `plugin-sdk/memory-host-status` | 已弃用的内存主机状态别名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | 测试实用程序 | 仓库本地已弃用兼容性桶；使用专注的仓库本地测试子路径，如 `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

此表格故意是常见迁移子集，而不是完整的 SDK 表面。编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；包导出从公共子集生成。

保留的捆绑 Plugin 辅助函数接缝已从公共 SDK 导出映射中退出，但明确记录的兼容性门面除外，例如为已发布的 `@openclaw/discord@2026.3.13` 包保留的已弃用 `plugin-sdk/discord` 垫片。所有者特定的辅助函数位于拥有的 Plugin 包内；共享主机行为应通过通用 SDK 契约（如 `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`）进行。

使用与工作匹配的最窄导入。如果您找不到导出，请检查 `src/plugin-sdk/` 中的源代码或询问维护者哪个通用契约应该拥有它。

## 活跃的弃用

适用于整个 Plugin SDK、Provider 契约、运行时表面和 Manifest 的窄弃用。每个今天仍然有效，但将在未来的主要版本中删除。每个条目下面的内容将旧 API 映射到其规范替代方案。

<AccordionGroup>
  <Accordion title="command-auth 帮助构建器 → command-status">
    **旧版（`openclaw/plugin-sdk/command-auth`）**: `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage`。

    **新版（`openclaw/plugin-sdk/command-status`）**: 相同签名、相同导出 - 只是从更窄的子路径导入。`command-auth` 将它们重新导出为兼容性存根。

    ```typescript
    // 之前
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 之后
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及门控辅助函数 → resolveInboundMentionDecision">
    **旧版**: 来自 `openclaw/plugin-sdk/channel-inbound` 或 `openclaw/plugin-sdk/channel-mention-gating` 的 `resolveInboundMentionRequirement({ facts, policy })` 和 `shouldDropInboundForMention(...)`。

    **新版**: `resolveInboundMentionDecision({ facts, policy })` - 返回单个决策对象，而不是两个拆分调用。

    下游 Channel Plugin（Slack、Discord、Matrix、MS Teams）已经切换。

  </Accordion>

  <Accordion title="Channel 运行时垫片和 Channel 操作辅助函数">
    `openclaw/plugin-sdk/channel-runtime` 是旧版 Channel Plugin 的兼容性垫片。不要从新代码中导入它；使用 `openclaw/plugin-sdk/channel-runtime-context` 注册运行时对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 辅助函数随原始"操作"Channel 导出一起被弃用。通过语义 `presentation` 表面公开能力 - Channel Plugin 声明它们渲染什么（卡片、按钮、选择），而不是接受哪些原始操作名称。

  </Accordion>

  <Accordion title="Web 搜索 Provider tool() 辅助函数 → 在 Plugin 上的 createTool()">
    **旧版**: 来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` 工厂。

    **新版**: 直接在 Provider Plugin 上实现 `createTool(...)`。OpenClaw 不再需要 SDK 辅助函数来注册工具包装器。

  </Accordion>

  <Accordion title="纯文本 Channel 封包 → BodyForAgent">
    **旧版**: `formatInboundEnvelope(...)` (和 `ChannelMessageForAgent.channelEnvelope`) 从入站 Channel 消息构建扁平纯文本提示封包。

    **新版**: `BodyForAgent` 加上结构化用户上下文块。Channel Plugin 将路由元数据（线程、主题、回复到、反应）作为类型字段附加，而不是将它们连接到提示字符串中。对于合成的面向助手的封包，`formatAgentEnvelope(...)` 辅助函数仍然受支持，但入站纯文本封包正在退出。

    受影响的区域：`inbound_claim`、`message_received` 和任何后处理 `channelEnvelope` 文本的自定义 Channel Plugin。

  </Accordion>

  <Accordion title="deactivate Hook → gateway_stop">
    **旧版**: `api.on("deactivate", handler)`。

    **新版**: `api.on("gateway_stop", handler)`。事件和上下文是相同的关闭清理契约；只是 Hook 名称改变了。

    ```typescript
    // 之前
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // 之后
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` 保留为已弃用的兼容性别名，直到 2026-08-16 之后。

  </Accordion>

  <Accordion title="Provider 发现类型 → Provider 目录类型">
    四个发现类型别名现在是目录时代类型的薄包装：

    | 旧别名                    | 新类型                    |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    加上旧版 `ProviderCapabilities` 静态包 - Provider Plugin 应使用显式 Provider Hook，如 `buildReplayPolicy`、`normalizeToolSchemas` 和 `wrapStreamFn`，而不是静态对象。

  </Accordion>

  <Accordion title="思考策略 Hook → resolveThinkingProfile">
    **旧版**（`ProviderThinkingPolicy` 上的三个独立 Hook）：`isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和 `resolveDefaultThinkingLevel(ctx)`。

    **新版**：返回 `ProviderThinkingProfile` 的单个 `resolveThinkingProfile(ctx)`，带有规范 `id`、可选 `label` 和排名级别列表。OpenClaw 自动按配置文件等级降级陈旧的存储值。

    实现一个 Hook 而不是三个。旧版 Hook 在弃用窗口期间继续工作，但不与配置文件结果组合。

  </Accordion>

  <Accordion title="外部 OAuth Provider 回退 → contracts.externalAuthProviders">
    **旧版**: 在不在 Plugin Manifest 中声明 Provider 的情况下实现 `resolveExternalOAuthProfiles(...)`。

    **新版**: 在 Plugin Manifest 中声明 `contracts.externalAuthProviders` **并且**实现 `resolveExternalAuthProfiles(...)`。旧的"认证回退"路径在运行时发出警告，将被删除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider 环境变量查找 → setup.providers[].envVars">
    **旧版** Manifest 字段：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新版**：将相同的环境变量查找镜像到 Manifest 上的 `setup.providers[].envVars`。这将设置/状态环境元数据整合在一个地方，避免仅为了回答环境变量查找而启动 Plugin 运行时。

    `providerAuthEnvVars` 通过兼容性适配器保持支持，直到弃用窗口关闭。

  </Accordion>

  <Accordion title="内存 Plugin 注册 → registerMemoryCapability">
    **旧版**: 三个独立调用 - `api.registerMemoryPromptSection(...)`, `api.registerMemoryFlushPlan(...)`, `api.registerMemoryRuntime(...)`。

    **新版**: 内存状态 API 上的一个调用 - `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同的插槽，单个注册调用。附加内存辅助函数（`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、`registerMemoryEmbeddingProvider`）不受影响。

  </Accordion>

  <Accordion title="子 Agent Session 消息类型重命名">
    仍从 `src/plugins/runtime/types.ts` 导出的两个旧版类型别名：

    | 旧类型                        | 新类型                              |
    | ----------------------------- | ----------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams`  |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult`  |

    运行时方法 `readSession` 已弃用，支持 `getSessionMessages`。相同签名；旧方法通过调用新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧版**: `runtime.tasks.flow`（单数）返回实时任务流访问器。

    **新版**: `runtime.tasks.managedFlows` 为从流创建、更新、取消或运行子任务的 Plugin 保留托管 TaskFlow 变更运行时。当 Plugin 只需要基于 DTO 的读取时，使用 `runtime.tasks.flows`。

    ```typescript
    // 之前
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // 之后
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式扩展工厂 → Agent 工具结果中间件">
    已在上面的"如何迁移 → 将 Pi 工具结果扩展迁移到中间件"中介绍。为完整起见在此包含：已删除的仅限 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 路径被 `api.registerAgentToolResultMiddleware(...)` 替换，在 `contracts.agentToolResultMiddleware` 中有显式运行时列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType 别名 → OpenClawConfig">
    从 `openclaw/plugin-sdk` 重新导出的 `OpenClawSchemaType` 现在是 `OpenClawConfig` 的单行别名。优先使用规范名称。

    ```typescript
    // 之前
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 之后
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
扩展级别的弃用（在 `extensions/` 下的捆绑 Channel/Provider Plugin 内部）在其自己的 `api.ts` 和 `runtime-api.ts` 桶中跟踪。它们不影响第三方 Plugin 契约，因此不在此列出。如果您直接使用捆绑 Plugin 的本地桶，请在升级之前阅读该桶中的弃用注释。
</Note>

## 删除时间表

| 时间                   | 发生的事情                                                                |
| ---------------------- | ------------------------------------------------------------------------- |
| **现在**               | 已弃用的表面发出运行时警告                                                |
| **下一个主要版本**     | 已弃用的表面将被删除；仍使用它们的 Plugin 将失败                          |

所有 Core Plugin 已经迁移完毕。外部 Plugin 应在下一个主要版本之前完成迁移。

## 临时抑制警告

在迁移工作期间设置这些环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这是临时的紧急出口，不是永久解决方案。

## 相关

- [入门指南](/plugins/building-plugins) - 构建您的第一个 Plugin
- [SDK 概述](/plugins/sdk-overview) - 完整子路径导入参考
- [Channel Plugin](/plugins/sdk-channel-plugins) - 构建 Channel Plugin
- [Provider Plugin](/plugins/sdk-provider-plugins) - 构建 Provider Plugin
- [Plugin 内部](/plugins/architecture) - 架构深入探讨
- [Plugin Manifest](/plugins/manifest) - Manifest Schema 参考
