---
mmh3_hash: "9bb182f74cca304dc6d21b5f892f3387"
title: "Plugin SDK 迁移"
sidebarTitle: "迁移至 SDK"
summary: "从旧版向后兼容层迁移到现代 Plugin SDK"
read_when:
  - 您看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
  - 您看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
  - 您在 OpenClaw 2026.4.25 之前使用了 api.registerEmbeddedExtensionFactory
  - 您正在将 Plugin 更新到现代 Plugin 架构
  - 您维护外部 OpenClaw Plugin
---

OpenClaw 已从宽泛的向后兼容层迁移到具有专注文档化导入的现代 Plugin 架构。如果您的 Plugin 是在新架构之前构建的，本指南可帮助您迁移。

## 正在改变什么

旧版 Plugin 系统提供了两个开放接口，让 Plugin 可以从单个入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** — 重新导出数十个辅助工具的单一导入。它被引入是为了在构建新 Plugin 架构期间保持基于 Hook 的旧版 Plugin 正常工作。
- **`openclaw/plugin-sdk/infra-runtime`** — 混合了系统事件、心跳状态、投递队列、Fetch/代理辅助工具、文件辅助工具、批准类型和不相关工具的宽泛运行时辅助工具桶。
- **`openclaw/plugin-sdk/config-runtime`** — 在迁移窗口期间仍包含已弃用的直接加载/写入辅助工具的宽泛配置兼容桶。
- **`openclaw/extension-api`** — 给予 Plugin 直接访问宿主端辅助工具（如嵌入式 Agent 运行器）的桥接层。
- **`api.registerEmbeddedExtensionFactory(...)`** — 已移除的仅 Pi 捆绑扩展 Hook，可观察嵌入式运行器事件，如 `tool_result`。

这些宽泛的导入接口现在都**已弃用**。它们在运行时仍然可以工作，但新 Plugin 不得使用它们，现有 Plugin 应在下一个主要版本删除它们之前迁移。仅 Pi 的嵌入式扩展工厂注册 API 已被移除；请改用工具结果中间件。

OpenClaw 不会在引入替代方案的同一次变更中删除或重新解释文档化的 Plugin 行为。重大契约变更必须首先经过兼容性适配器、诊断、文档和弃用窗口。这适用于 SDK 导入、清单字段、设置 API、Hook 和运行时注册行为。

<Warning>
  向后兼容层将在未来的主要版本中删除。仍然从这些接口导入的 Plugin 在那时将会失败。仅 Pi 的嵌入式扩展工厂注册已不再加载。
</Warning>

## 为什么改变

旧方法导致了问题：

- **启动缓慢** — 导入一个辅助工具会加载数十个不相关的模块
- **循环依赖** — 宽泛的重新导出使创建导入循环变得容易
- **API 接口不清晰** — 无法判断哪些导出是稳定的，哪些是内部的

现代 Plugin SDK 解决了这个问题：每个导入路径（`openclaw/plugin-sdk/<subpath>`）都是一个小型自包含模块，具有明确目的和文档化契约。

捆绑 Channel 的旧版 Provider 便利接缝也已移除。`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、Channel 品牌辅助工具接缝以及 `openclaw/plugin-sdk/telegram-core` 等导入是私有 mono-repo 快捷方式，而非稳定的 Plugin 契约。请改用窄向通用 SDK 子路径。在捆绑 Plugin 工作区内，将 Provider 自有的辅助工具保留在该 Plugin 自己的 `api.ts` 或 `runtime-api.ts` 中。

当前捆绑 Provider 示例：

- Anthropic 在其自己的 `api.ts` / `contract-api.ts` 接缝中保留 Claude 特定的流辅助工具
- OpenAI 在其自己的 `api.ts` 中保留 Provider 构建器、默认模型辅助工具和实时 Provider 构建器
- OpenRouter 在其自己的 `api.ts` 中保留 Provider 构建器以及入门/配置辅助工具

## Talk 和实时语音迁移计划

实时语音、电话、会议和浏览器 Talk 代码正从界面本地的轮次记账迁移到由 `openclaw/plugin-sdk/realtime-voice` 导出的共享 Talk Session 控制器。新控制器拥有通用 Talk 事件信封、活跃轮次状态、捕获状态、输出音频状态、近期事件历史和陈旧轮次拒绝。Provider Plugin 应继续拥有厂商特定的实时 Session；界面 Plugin 应继续拥有捕获、播放、电话和会议特有问题。

此 Talk 迁移有意地做到破坏性清晰：

1. 将共享控制器/运行时原语保留在 `plugin-sdk/realtime-voice` 中。
2. 将捆绑界面迁移到共享控制器：浏览器中继、托管房间切换、语音通话实时、语音通话流式 STT、Google Meet 实时和原生一键通话。
3. 将旧 Talk RPC 族替换为最终的 `talk.session.*` 和 `talk.client.*` API。
4. 在 Gateway `hello-ok.features.events` 中宣布一个实时 Talk 事件 Channel：`talk.event`。
5. 删除旧的实时 HTTP 端点和任何请求时的指令覆盖路径。

新代码不应直接调用 `createTalkEventSequencer(...)`，除非它正在实现低级适配器或测试夹具。优先使用共享控制器，以便轮次范围的事件无法在没有轮次 id 的情况下发出，陈旧的 `turnEnd`/`turnCancel` 调用无法清除较新的活跃轮次，并且输出音频生命周期事件在电话、会议、浏览器中继、托管房间切换和原生 Talk 客户端之间保持一致。

目标公共 API 形态为：

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

浏览器拥有的 WebRTC/Provider-websocket Session 使用 `talk.client.create`，因为浏览器拥有 Provider 协商和媒体传输，而 Gateway 拥有凭据、指令和工具策略。`talk.session.*` 是 Gateway 托管中继实时、Gateway 托管中继转录和托管房间原生 STT/TTS Session 的通用 Gateway 托管界面。

将实时选择器放在 `talk.provider`/`talk.providers` 旁边的旧版配置应使用 `openclaw doctor --fix` 修复；运行时 Talk 不会将语音/TTS Provider 配置重新解释为实时 Provider 配置。

支持的 `talk.session.create` 组合有意地较小：

| 模式            | 传输            | Brain           | 所有者              | 说明                                                                                                               |
| --------------- | --------------- | --------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway             | 通过 Gateway 桥接的全双工 Provider 音频；工具调用通过 Agent 咨询工具路由。                                          |
| `transcription` | `gateway-relay` | `none`          | Gateway             | 仅流式 STT；调用方发送输入音频并接收转录事件。                                                                      |
| `stt-tts`       | `managed-room`  | `agent-consult` | 原生/客户端房间     | 一键通话和对讲机风格的房间，客户端拥有捕获/播放，Gateway 拥有轮次状态。                                             |
| `stt-tts`       | `managed-room`  | `direct-tools`  | 原生/客户端房间     | 仅限管理员的房间模式，适用于直接执行 Gateway 工具操作的受信任第一方界面。                                            |

已移除方法映射：

| 旧方法                           | 新方法                                                     |
| -------------------------------- | ---------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                       |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                     |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                                 |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` 或 `talk.session.cancelTurn`   |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                            |
| `talk.realtime.relayStop`        | `talk.session.close`                                       |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`           |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                                 |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                  |
| `talk.transcription.relayStop`   | `talk.session.close`                                       |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`       |
| `talk.handoff.join`              | `talk.session.join`                                        |
| `talk.handoff.revoke`            | `talk.session.close`                                       |

统一的控制词汇表也有意较窄：

| 方法                            | 适用范围                                                    | 契约                                                                                                                                                                                     |
| ------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay`     | 将 base64 PCM 音频块追加到由同一 Gateway 连接拥有的 Provider Session。                                                                                                                   |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                      | 开始托管房间用户轮次。                                                                                                                                                                   |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                      | 经陈旧轮次验证后结束活跃轮次。                                                                                                                                                           |
| `talk.session.cancelTurn`       | 所有 Gateway 拥有的 Session                                 | 取消轮次的活跃捕获/Provider/Agent/TTS 工作。                                                                                                                                             |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                                    | 停止 Assistant 音频输出，不必结束用户轮次。                                                                                                                                              |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                                    | 完成中继发出的 Provider 工具调用；传递 `options.willContinue` 用于中间输出，或传递 `options.suppressResponse` 以满足调用而不获得另一个 Assistant 响应。                                   |
| `talk.session.close`            | 所有统一 Session                                            | 停止中继 Session 或撤销托管房间状态，然后遗忘统一 Session id。                                                                                                                           |

不要在核心中引入 Provider 或平台特例来使其工作。核心拥有 Talk Session 语义。Provider Plugin 拥有厂商 Session 设置。语音通话和 Google Meet 拥有电话/会议适配器。浏览器和原生应用拥有设备捕获/播放 UX。

## 兼容性策略

对于外部 Plugin，兼容性工作遵循以下顺序：

1. 添加新契约
2. 通过兼容性适配器保持旧行为
3. 发出诊断或警告，指明旧路径和替代路径
4. 在测试中涵盖两个路径
5. 记录弃用和迁移路径
6. 仅在宣布的迁移窗口之后删除，通常在主要版本中

维护人员可以使用 `pnpm plugins:boundary-report` 审计当前迁移队列。使用 `pnpm plugins:boundary-report:summary` 获取紧凑计数，`--owner <id>` 获取一个 Plugin 或兼容性所有者的报告，当 CI 门控应该在到期兼容记录、跨所有者保留 SDK 导入或未使用的保留 SDK 子路径上失败时使用 `pnpm plugins:boundary-report:ci`。报告按删除日期对已弃用的兼容记录分组，计算本地代码/文档引用数量，显示跨所有者保留 SDK 导入，并汇总私有内存宿主 SDK 桥，以便兼容性清理保持明确，而不是依赖临时搜索。保留的 SDK 子路径必须有被跟踪的所有者使用；未使用的保留辅助工具导出应从公共 SDK 中删除。

如果清单字段仍然被接受，Plugin 作者可以继续使用它，直到文档和诊断另有说明。新代码应优先使用文档化的替代方案，但现有 Plugin 在普通小版本发布期间不应中断。

## 如何迁移

<Steps>
  <Step title="迁移运行时配置加载/写入辅助工具">
    捆绑 Plugin 应停止直接调用 `api.runtime.config.loadConfig()` 和 `api.runtime.config.writeConfigFile(...)`。优先使用已传入活跃调用路径的配置。需要当前进程快照的长期处理程序可以使用 `api.runtime.config.current()`。长期 Agent 工具应在 `execute` 内使用工具上下文的 `ctx.getRuntimeConfig()`，以便在配置写入之前创建的工具仍能看到刷新后的运行时配置。

    配置写入必须通过事务性辅助工具并选择写后策略：

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    当调用方知道更改需要清洁 Gateway 重启时使用 `afterWrite: { mode: "restart", reason: "..." }`，仅当调用方拥有后续操作且有意抑制重新加载规划器时使用 `afterWrite: { mode: "none", reason: "..." }`。变更结果包含用于测试和日志记录的类型化 `followUp` 摘要；Gateway 仍然负责应用或调度重启。`loadConfig` 和 `writeConfigFile` 在迁移窗口期间保留为外部 Plugin 的已弃用兼容性辅助工具，并以 `runtime-config-load-write` 兼容性代码警告一次。捆绑 Plugin 和 repo 运行时代码受 `pnpm check:deprecated-api-usage` 和 `pnpm check:no-runtime-action-load-config` 中的扫描器护栏保护：新的生产 Plugin 使用直接失败，直接配置写入失败，Gateway 服务器方法必须使用请求运行时快照，运行时 Channel 发送/操作/客户端辅助工具必须从其边界接收配置，长期运行时模块有零个允许的环境 `loadConfig()` 调用。

    新 Plugin 代码也应避免导入宽泛的 `openclaw/plugin-sdk/config-runtime` 兼容桶。使用与工作匹配的窄向 SDK 子路径：

    | 需求 | 导入 |
    | --- | --- |
    | 配置类型，如 `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | 已加载配置断言和 Plugin 入口配置查找 | `openclaw/plugin-sdk/plugin-config-runtime` |
    | 当前运行时快照读取 | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | 配置写入 | `openclaw/plugin-sdk/config-mutation` |
    | Session 存储辅助工具 | `openclaw/plugin-sdk/session-store-runtime` |
    | Markdown 表格配置 | `openclaw/plugin-sdk/markdown-table-runtime` |
    | 群组策略运行时辅助工具 | `openclaw/plugin-sdk/runtime-group-policy` |
    | 密钥输入解析 | `openclaw/plugin-sdk/secret-input-runtime` |
    | 模型/Session 覆盖 | `openclaw/plugin-sdk/model-session-runtime` |

    捆绑 Plugin 及其测试受扫描器对宽泛桶的保护，因此导入和模拟保持在其所需行为的本地范围内。宽泛桶仍存在于外部兼容性，但新代码不应依赖它。

  </Step>

  <Step title="将 Pi 工具结果扩展迁移到中间件">
    捆绑 Plugin 必须将仅 Pi 的 `api.registerEmbeddedExtensionFactory(...)` 工具结果处理程序替换为运行时中立的中间件。

    ```typescript
    // Pi 和 Codex 运行时动态工具
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    同时更新 Plugin 清单：

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    外部 Plugin 无法注册工具结果中间件，因为它可以在模型看到之前重写高信任的工具输出。

  </Step>

  <Step title="将批准原生处理程序迁移到能力事实">
    支持批准的 Channel Plugin 现在通过 `approvalCapability.nativeRuntime` 加上共享运行时上下文注册表暴露原生批准行为。

    关键变更：

    - 将 `approvalCapability.handler.loadRuntime(...)` 替换为 `approvalCapability.nativeRuntime`
    - 将批准特定的认证/传递从旧版 `plugin.auth` / `plugin.approvals` 连接移到 `approvalCapability`
    - `ChannelPlugin.approvals` 已从公共 Channel Plugin 契约中移除；将传递/原生/渲染字段移到 `approvalCapability`
    - `plugin.auth` 仅保留用于 Channel 登录/注销流程；核心不再读取其中的批准认证 Hook
    - 通过 `openclaw/plugin-sdk/channel-runtime-context` 注册 Channel 自有的运行时对象（如客户端、令牌或 Bolt 应用）
    - 不要从原生批准处理程序发送 Plugin 自有的重路由通知；核心现在拥有来自实际传递结果的路由到其他地方通知
    - 将 `channelRuntime` 传递给 `createChannelManager(...)` 时，提供真实的 `createPluginRuntime().channel` 界面。部分存根会被拒绝。

    关于当前批准能力布局，请参见 [Channel Plugin](/plugins/sdk-channel-plugins)。

  </Step>

  <Step title="审计 Windows 包装器回退行为">
    如果您的 Plugin 使用 `openclaw/plugin-sdk/windows-spawn`，未解析的 Windows `.cmd`/`.bat` 包装器现在将失败关闭，除非您明确传递 `allowShellFallback: true`。

    ```typescript
    // 之前
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // 之后
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // 仅当调用方确实有意接受 Shell 中介的回退时才设置此项
      allowShellFallback: true,
    });
    ```

    如果您的调用方并非有意依赖 Shell 回退，请不要设置 `allowShellFallback`，而是处理抛出的错误。

  </Step>

  <Step title="查找已弃用的导入">
    在您的 Plugin 中搜索来自任一已弃用接口的导入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替换为专注导入">
    旧接口的每个导出都映射到特定的现代导入路径：

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

    对于宿主端辅助工具，使用注入的 Plugin 运行时而不是直接导入：

    ```typescript
    // 之前（已弃用的 extension-api 桥接）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // 之后（注入的运行时）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    其他旧版桥接辅助工具的相同模式：

    | 旧导入                              | 现代等效                                           |
    | ----------------------------------- | -------------------------------------------------- |
    | `resolveAgentDir`                   | `api.runtime.agent.resolveAgentDir`                |
    | `resolveAgentWorkspaceDir`          | `api.runtime.agent.resolveAgentWorkspaceDir`       |
    | `resolveAgentIdentity`              | `api.runtime.agent.resolveAgentIdentity`           |
    | `resolveThinkingDefault`            | `api.runtime.agent.resolveThinkingDefault`         |
    | `resolveAgentTimeoutMs`             | `api.runtime.agent.resolveAgentTimeoutMs`          |
    | `ensureAgentWorkspace`              | `api.runtime.agent.ensureAgentWorkspace`           |
    | 会话存储辅助工具                    | `api.runtime.agent.session.*`                      |

  </Step>

  <Step title="替换宽泛的 infra-runtime 导入">
    `openclaw/plugin-sdk/infra-runtime` 仍然存在以保持外部兼容性，但新代码应导入其实际需要的专注辅助工具界面：

    | 需求 | 导入 |
    | --- | --- |
    | 系统事件队列辅助工具 | `openclaw/plugin-sdk/system-event-runtime` |
    | 心跳唤醒、事件和可见性辅助工具 | `openclaw/plugin-sdk/heartbeat-runtime` |
    | 待处理投递队列清空 | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Channel 活动遥测 | `openclaw/plugin-sdk/channel-activity-runtime` |
    | 内存去重缓存 | `openclaw/plugin-sdk/dedupe-runtime` |
    | 安全本地文件/媒体路径辅助工具 | `openclaw/plugin-sdk/file-access-runtime` |
    | 调度器感知的 Fetch | `openclaw/plugin-sdk/runtime-fetch` |
    | 代理和守卫 Fetch 辅助工具 | `openclaw/plugin-sdk/fetch-runtime` |
    | SSRF 调度器策略类型 | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | 批准请求/解析类型 | `openclaw/plugin-sdk/approval-runtime` |
    | 批准回复有效载荷和命令辅助工具 | `openclaw/plugin-sdk/approval-reply-runtime` |
    | 错误格式化辅助工具 | `openclaw/plugin-sdk/error-runtime` |
    | 传输就绪等待 | `openclaw/plugin-sdk/transport-ready-runtime` |
    | 安全令牌辅助工具 | `openclaw/plugin-sdk/secure-random-runtime` |
    | 有界异步任务并发 | `openclaw/plugin-sdk/concurrency-runtime` |
    | 数值强制转换 | `openclaw/plugin-sdk/number-runtime` |
    | 进程本地异步锁 | `openclaw/plugin-sdk/async-lock-runtime` |
    | 文件锁 | `openclaw/plugin-sdk/file-lock` |

    捆绑 Plugin 受扫描器对 `infra-runtime` 的保护，因此 repo 代码无法退回到宽泛桶。

  </Step>

  <Step title="迁移 Channel 路由辅助工具">
    新的 Channel 路由代码应使用 `openclaw/plugin-sdk/channel-route`。旧的路由键和可比较目标名称在迁移窗口期间仍作为兼容性别名存在，但新 Plugin 应使用直接描述行为的路由名称：

    | 旧辅助工具 | 现代辅助工具 |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    现代路由辅助工具在原生批准、回复抑制、入站去重、Cron 投递和 Session 路由中一致规范化 `{ channel, to, accountId, threadId }`。如果您的 Plugin 拥有自定义目标语法，使用 `resolveChannelRouteTargetWithParser(...)` 将该解析器适配到同一路由目标契约中。

  </Step>

  <Step title="构建和测试">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

<Accordion title="常用导入路径表">
  | 导入路径 | 目的 | 主要导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范 Plugin 入口辅助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | Channel 入口定义/构建器的旧版综合重导出 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | 根配置 Schema 导出 | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | 单 Provider 入口辅助工具 | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | 专注的 Channel 入口定义和构建器 | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | 共享设置向导辅助工具 | 允许列表提示、设置状态构建器 |
  | `plugin-sdk/setup-runtime` | 设置时运行时辅助工具 | 导入安全的设置补丁适配器、查找说明辅助工具、`promptResolvedAllowFrom`、`splitSetupEntries`、委托设置代理 |
  | `plugin-sdk/setup-adapter-runtime` | 已弃用的设置适配器别名 | 使用 `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | 设置工具辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助工具 | 账户列表/配置/操作门控辅助工具 |
  | `plugin-sdk/account-id` | 账户 ID 辅助工具 | `DEFAULT_ACCOUNT_ID`、账户 ID 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助工具 | 账户查找 + 默认回退辅助工具 |
  | `plugin-sdk/account-helpers` | 窄向账户辅助工具 | 账户列表/账户操作辅助工具 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀、输入和源投递连接 | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂和 DM 访问辅助工具 | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | 配置 Schema 构建器 | 共享 Channel 配置 Schema 原语和通用构建器（仅限通用构建器） |
  | `plugin-sdk/bundled-channel-config-schema` | 捆绑的配置 Schema | 仅 OpenClaw 维护的捆绑 Plugin；新 Plugin 必须定义 Plugin 本地 Schema |
  | `plugin-sdk/channel-config-schema-legacy` | 已弃用的捆绑配置 Schema | 仅兼容性别名；为维护的捆绑 Plugin 使用 `plugin-sdk/bundled-channel-config-schema` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助工具 | 命令名称规范化、描述截断、重复/冲突验证 |
  | `plugin-sdk/channel-policy` | 群组/DM 策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账户状态和草稿流生命周期辅助工具 | `createAccountStatusSink`、草稿预览最终化辅助工具 |
  | `plugin-sdk/inbound-envelope` | 入站信封辅助工具 | 共享路由 + 信封构建器辅助工具 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助工具 | 共享记录和调度辅助工具 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析/匹配辅助工具 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助工具 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-send-deps` | 出站发送依赖辅助工具 | 不导入完整出站运行时的轻量级 `resolveOutboundSendDep` 查找 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助工具 | 出站投递、身份/发送委托、Session、格式化和有效载荷规划辅助工具 |
  | `plugin-sdk/thread-bindings-runtime` | 线程绑定辅助工具 | 线程绑定生命周期和适配器辅助工具 |
  | `plugin-sdk/agent-media-payload` | 旧版媒体有效载荷辅助工具 | 旧版字段布局的 Agent 媒体有效载荷构建器 |
  | `plugin-sdk/channel-runtime` | 已弃用的兼容性垫片 | 仅旧版 Channel 运行时工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化 Plugin 存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | 广泛的运行时辅助工具 | 运行时/日志/备份/Plugin 安装辅助工具 |
  | `plugin-sdk/runtime-env` | 窄向运行时环境辅助工具 | 日志器/运行时环境、超时、重试和退避辅助工具 |
  | `plugin-sdk/plugin-runtime` | 共享 Plugin 运行时辅助工具 | Plugin 命令/Hook/HTTP/交互式辅助工具 |
  | `plugin-sdk/hook-runtime` | Hook 管道辅助工具 | 共享 Webhook/内部 Hook 管道辅助工具 |
  | `plugin-sdk/lazy-runtime` | 懒加载运行时辅助工具 | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | 进程辅助工具 | 共享 exec 辅助工具 |
  | `plugin-sdk/cli-runtime` | CLI 运行时辅助工具 | 命令格式化、等待、版本辅助工具 |
  | `plugin-sdk/gateway-runtime` | Gateway 辅助工具 | Gateway 客户端、事件循环就绪启动辅助工具和 Channel 状态补丁辅助工具 |
  | `plugin-sdk/config-runtime` | 已弃用的配置兼容垫片 | 优先使用 `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Telegram 命令辅助工具 | 当捆绑 Telegram 契约界面不可用时的回退稳定 Telegram 命令验证辅助工具 |
  | `plugin-sdk/approval-runtime` | 批准提示辅助工具 | Exec/Plugin 批准有效载荷、批准能力/配置文件辅助工具、原生批准路由/运行时辅助工具以及结构化批准显示路径格式化 |
  | `plugin-sdk/approval-auth-runtime` | 批准认证辅助工具 | 批准者解析、同聊天操作认证 |
  | `plugin-sdk/approval-client-runtime` | 批准客户端辅助工具 | 原生 Exec 批准配置文件/过滤器辅助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 批准交付辅助工具 | 原生批准能力/交付适配器 |
  | `plugin-sdk/approval-gateway-runtime` | 批准 Gateway 辅助工具 | 共享批准 Gateway 解析辅助工具 |
  | `plugin-sdk/approval-handler-adapter-runtime` | 批准适配器辅助工具 | 热路径 Channel 入口点的轻量级原生批准适配器加载辅助工具 |
  | `plugin-sdk/approval-handler-runtime` | 批准处理程序辅助工具 | 更广泛的批准处理程序运行时辅助工具；当窄向适配器/Gateway 接缝足够时优先使用它们 |
  | `plugin-sdk/approval-native-runtime` | 批准目标辅助工具 | 原生批准目标/账户绑定辅助工具 |
  | `plugin-sdk/approval-reply-runtime` | 批准回复辅助工具 | Exec/Plugin 批准回复有效载荷辅助工具 |
  | `plugin-sdk/channel-runtime-context` | Channel 运行时上下文辅助工具 | 通用 Channel 运行时上下文注册/获取/监听辅助工具 |
  | `plugin-sdk/security-runtime` | 安全辅助工具 | 共享信任、DM 门控、根绑定文件/路径辅助工具、外部内容和密钥收集辅助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助工具 | 主机允许列表和私有网络策略辅助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助工具 | 固定调度器、守卫获取、SSRF 策略辅助工具 |
  | `plugin-sdk/system-event-runtime` | 系统事件辅助工具 | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | 心跳辅助工具 | 心跳唤醒、事件和可见性辅助工具 |
  | `plugin-sdk/delivery-queue-runtime` | 投递队列辅助工具 | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Channel 活动辅助工具 | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | 去重辅助工具 | 内存去重缓存 |
  | `plugin-sdk/file-access-runtime` | 文件访问辅助工具 | 安全本地文件/媒体路径辅助工具 |
  | `plugin-sdk/transport-ready-runtime` | 传输就绪辅助工具 | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助工具 |
  | `plugin-sdk/fetch-runtime` | 包装的 Fetch/代理辅助工具 | `resolveFetch`、代理辅助工具、EnvHttpProxyAgent 选项辅助工具 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`, `retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | 允许列表格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允许列表输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令界面辅助工具 | `resolveControlCommandGate`、发送者授权辅助工具、命令注册表辅助工具（包括动态参数菜单格式化） |
  | `plugin-sdk/command-status` | 命令状态/帮助渲染器 | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助工具 | Webhook 目标工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 正文守卫辅助工具 | 请求正文读取/限制辅助工具 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站调度、心跳、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄向回复调度辅助工具 | 最终化、Provider 调度和会话标签辅助工具 |
  | `plugin-sdk/reply-history` | 回复历史辅助工具 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助工具 | 文本/Markdown 分块辅助工具 |
  | `plugin-sdk/session-store-runtime` | Session 存储辅助工具 | 存储路径 + 更新时间辅助工具 |
  | `plugin-sdk/state-paths` | 状态路径辅助工具 | 状态和 OAuth 目录辅助工具 |
  | `plugin-sdk/routing` | 路由/Session 键辅助工具 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、Session 键规范化辅助工具 |
  | `plugin-sdk/status-helpers` | Channel 状态辅助工具 | Channel/账户状态摘要构建器、运行时状态默认值、问题元数据辅助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助工具 | 共享目标解析器辅助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助工具 | 短标识符/字符串规范化辅助工具 |
  | `plugin-sdk/request-url` | 请求 URL 辅助工具 | 从类请求输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助工具 | 带规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 常用 Tool/CLI 参数读取器 |
  | `plugin-sdk/tool-payload` | Tool 有效载荷提取 | 从 Tool 结果对象中提取规范化有效载荷 |
  | `plugin-sdk/tool-send` | Tool 发送提取 | 从 Tool 参数中提取规范发送目标字段 |
  | `plugin-sdk/temp-path` | 临时路径辅助工具 | 共享临时下载路径辅助工具 |
  | `plugin-sdk/logging-core` | 日志辅助工具 | 子系统日志器和编辑辅助工具 |
  | `plugin-sdk/markdown-table-runtime` | Markdown 表格辅助工具 | Markdown 表格模式辅助工具 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复有效载荷类型 |
  | `plugin-sdk/provider-setup` | 精心策划的本地/自托管 Provider 设置辅助工具 | 自托管 Provider 发现/配置辅助工具 |
  | `plugin-sdk/self-hosted-provider-setup` | 专注的 OpenAI 兼容自托管 Provider 设置辅助工具 | 同样的自托管 Provider 发现/配置辅助工具 |
  | `plugin-sdk/provider-auth-runtime` | Provider 运行时认证辅助工具 | 运行时 API 密钥解析辅助工具 |
  | `plugin-sdk/provider-auth-api-key` | Provider API 密钥设置辅助工具 | API 密钥入门/配置文件写入辅助工具 |
  | `plugin-sdk/provider-auth-result` | Provider 认证结果辅助工具 | 标准 OAuth 认证结果构建器 |
  | `plugin-sdk/provider-auth-login` | Provider 交互式登录辅助工具 | 共享交互式登录辅助工具 |
  | `plugin-sdk/provider-selection-runtime` | Provider 选择辅助工具 | 已配置或自动 Provider 选择以及原始 Provider 配置合并 |
  | `plugin-sdk/provider-env-vars` | Provider 环境变量辅助工具 | Provider 认证环境变量查找辅助工具 |
  | `plugin-sdk/provider-model-shared` | 共享 Provider 模型/重播辅助工具 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共享重播策略构建器、Provider 端点辅助工具和模型 ID 规范化辅助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共享 Provider 目录辅助工具 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider 入门补丁 | 入门配置辅助工具 |
  | `plugin-sdk/provider-http` | Provider HTTP 辅助工具 | 通用 Provider HTTP/端点能力辅助工具，包括音频转录多部分表单辅助工具 |
  | `plugin-sdk/provider-web-fetch` | Provider Web 抓取辅助工具 | Web 抓取 Provider 注册/缓存辅助工具 |
  | `plugin-sdk/provider-web-search-config-contract` | Provider Web 搜索配置辅助工具 | 不需要 Plugin 启用连接的 Provider 的窄向 Web 搜索配置/凭据辅助工具 |
  | `plugin-sdk/provider-web-search-contract` | Provider Web 搜索契约辅助工具 | 窄向 Web 搜索配置/凭据契约辅助工具，如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 和范围化凭据设置器/获取器 |
  | `plugin-sdk/provider-web-search` | Provider Web 搜索辅助工具 | Web 搜索 Provider 注册/缓存/运行时辅助工具 |
  | `plugin-sdk/provider-tools` | Provider Tool/Schema 兼容辅助工具 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、Gemini Schema 清理 + 诊断，以及 xAI 兼容辅助工具（如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat`） |
  | `plugin-sdk/provider-usage` | Provider 使用辅助工具 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 及其他 Provider 使用辅助工具 |
  | `plugin-sdk/provider-stream` | Provider 流包装辅助工具 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装类型，以及共享的 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装辅助工具 |
  | `plugin-sdk/provider-transport-runtime` | Provider 传输辅助工具 | 原生 Provider 传输辅助工具，如守卫获取、传输消息变换和可写传输事件流 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助工具 | 媒体获取/变换/存储辅助工具、ffprobe 支持的视频尺寸探测和媒体有效载荷构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助工具 | 共享故障转移辅助工具、候选选择以及图像/视频/音乐生成的缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助工具 | 媒体理解 Provider 类型以及面向 Provider 的图像/音频辅助工具导出 |
  | `plugin-sdk/text-runtime` | 已弃用的宽泛文本兼容导出 | 使用 `string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core` |
  | `plugin-sdk/text-chunking` | 文本分块辅助工具 | 出站文本分块辅助工具 |
  | `plugin-sdk/speech` | 语音辅助工具 | 语音 Provider 类型以及面向 Provider 的指令、注册表、验证辅助工具和 OpenAI 兼容 TTS 构建器 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音 Provider 类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助工具 | Provider 类型、注册表辅助工具和共享 WebSocket Session 辅助工具 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助工具 | Provider 类型、注册表/解析辅助工具、桥接 Session 辅助工具、共享 Agent 回话队列、转录/事件健康、回声抑制和快速上下文咨询辅助工具 |
  | `plugin-sdk/image-generation` | 图像生成辅助工具 | 图像生成 Provider 类型以及图像资产/数据 URL 辅助工具和 OpenAI 兼容图像 Provider 构建器 |
  | `plugin-sdk/image-generation-core` | 共享图像生成核心 | 图像生成类型、故障转移、认证和注册表辅助工具 |
  | `plugin-sdk/music-generation` | 音乐生成辅助工具 | 音乐生成 Provider/请求/结果类型 |
  | `plugin-sdk/music-generation-core` | 共享音乐生成核心 | 音乐生成类型、故障转移辅助工具、Provider 查找和模型引用解析 |
  | `plugin-sdk/video-generation` | 视频生成辅助工具 | 视频生成 Provider/请求/结果类型 |
  | `plugin-sdk/video-generation-core` | 共享视频生成核心 | 视频生成类型、故障转移辅助工具、Provider 查找和模型引用解析 |
  | `plugin-sdk/interactive-runtime` | 交互式回复辅助工具 | 交互式回复有效载荷规范化/缩减 |
  | `plugin-sdk/channel-config-primitives` | Channel 配置原语 | 窄向 Channel 配置 Schema 原语 |
  | `plugin-sdk/channel-config-writes` | Channel 配置写入辅助工具 | Channel 配置写入授权辅助工具 |
  | `plugin-sdk/channel-plugin-common` | 共享 Channel 前导 | 共享 Channel Plugin 前导导出 |
  | `plugin-sdk/channel-status` | Channel 状态辅助工具 | 共享 Channel 状态快照/摘要辅助工具 |
  | `plugin-sdk/allowlist-config-edit` | 允许列表配置辅助工具 | 允许列表配置编辑/读取辅助工具 |
  | `plugin-sdk/group-access` | 群组访问辅助工具 | 共享群组访问决策辅助工具 |
  | `plugin-sdk/direct-dm` | 直接 DM 辅助工具 | 共享直接 DM 认证/守卫辅助工具 |
  | `plugin-sdk/extension-shared` | 共享扩展辅助工具 | 被动 Channel/状态辅助原语 |
  | `plugin-sdk/webhook-targets` | Webhook 目标辅助工具 | Webhook 目标注册表和路由安装辅助工具 |
  | `plugin-sdk/webhook-path` | 已弃用的 Webhook 路径别名 | 使用 `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | 共享 Web 媒体辅助工具 | 远程/本地媒体加载辅助工具 |
  | `plugin-sdk/zod` | 已弃用的 Zod 兼容重导出 | 直接从 `zod` 导入 |
  | `plugin-sdk/memory-core` | 捆绑的 memory-core 辅助工具 | 内存管理器/配置/文件/CLI 辅助工具界面 |
  | `plugin-sdk/memory-core-engine-runtime` | 内存引擎运行时外观 | 内存索引/搜索运行时外观 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 内存宿主基础引擎 | 内存宿主基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 内存宿主嵌入引擎 | 内存嵌入契约、注册表访问、本地 Provider 以及通用批处理/远程辅助工具；具体的远程 Provider 位于其拥有的 Plugin 中 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 内存宿主 QMD 引擎 | 内存宿主 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 内存宿主存储引擎 | 内存宿主存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | 内存宿主多模态辅助工具 | 内存宿主多模态辅助工具 |
  | `plugin-sdk/memory-core-host-query` | 内存宿主查询辅助工具 | 内存宿主查询辅助工具 |
  | `plugin-sdk/memory-core-host-secret` | 内存宿主密钥辅助工具 | 内存宿主密钥辅助工具 |
  | `plugin-sdk/memory-core-host-events` | 已弃用的内存事件别名 | 使用 `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | 内存宿主状态辅助工具 | 内存宿主状态辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 内存宿主 CLI 运行时 | 内存宿主 CLI 运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 内存宿主核心运行时 | 内存宿主核心运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 内存宿主文件/运行时辅助工具 | 内存宿主文件/运行时辅助工具 |
  | `plugin-sdk/memory-host-core` | 内存宿主核心运行时别名 | 内存宿主核心运行时辅助工具的厂商中性别名 |
  | `plugin-sdk/memory-host-events` | 内存宿主事件日志别名 | 内存宿主事件日志辅助工具的厂商中性别名 |
  | `plugin-sdk/memory-host-files` | 已弃用的内存文件/运行时别名 | 使用 `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助工具 | 内存相邻 Plugin 的共享托管 Markdown 辅助工具 |
  | `plugin-sdk/memory-host-search` | 活跃内存搜索外观 | 懒加载的活跃内存搜索管理器运行时外观 |
  | `plugin-sdk/memory-host-status` | 已弃用的内存宿主状态别名 | 使用 `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/memory-lancedb` | 捆绑的 memory-lancedb 辅助工具 | Memory-lancedb 辅助工具界面 |
  | `plugin-sdk/testing` | 测试工具 | Repo 本地已弃用的兼容桶；使用专注的 repo 本地测试子路径，如 `plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/channel-target-testing`、`plugin-sdk/test-env` 和 `plugin-sdk/test-fixtures` |
</Accordion>

此表格有意是常用迁移子集，而非完整的 SDK 界面。编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；包导出从公共子集生成。

保留的捆绑 Plugin 辅助工具接缝已从公共 SDK 导出映射中退役，但明确记录的兼容性外观除外，如为已发布的 `@openclaw/discord@2026.3.13` 包保留的已弃用 `plugin-sdk/discord` 垫片。所有者特定的辅助工具位于拥有者 Plugin 包内；共享的宿主行为应通过通用 SDK 契约移动，如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

使用最窄的导入来匹配工作。如果找不到导出，请查看 `src/plugin-sdk/` 中的源代码或询问维护者哪个通用契约应该拥有它。

## 活跃的弃用项

适用于整个 Plugin SDK、Provider 契约、运行时接口和清单的较窄弃用项。每项今天仍然可以工作，但将在未来的主要版本中删除。每项下面的条目将旧 API 映射到其规范替代。

<AccordionGroup>
  <Accordion title="command-auth 帮助构建器 → command-status">
    **旧（`openclaw/plugin-sdk/command-auth`）**：`buildCommandsMessage`、`buildCommandsMessagePaginated`、`buildHelpMessage`。

    **新（`openclaw/plugin-sdk/command-status`）**：相同的签名、相同的导出 — 只是从更窄的子路径导入。`command-auth` 将它们作为兼容性存根重新导出。

    ```typescript
    // 之前
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // 之后
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="提及门控辅助工具 → resolveInboundMentionDecision">
    **旧**：来自 `openclaw/plugin-sdk/channel-inbound` 或 `openclaw/plugin-sdk/channel-mention-gating` 的 `resolveInboundMentionRequirement({ facts, policy })` 和 `shouldDropInboundForMention(...)`。

    **新**：`resolveInboundMentionDecision({ facts, policy })` — 返回单个决策对象，而不是两次分开调用。

    下游 Channel Plugin（Slack、Discord、Matrix、MS Teams）已经切换。

  </Accordion>

  <Accordion title="Channel 运行时垫片和 Channel 操作辅助工具">
    `openclaw/plugin-sdk/channel-runtime` 是旧版 Channel Plugin 的兼容性垫片。不要从新代码中导入它；使用 `openclaw/plugin-sdk/channel-runtime-context` 注册运行时对象。

    `openclaw/plugin-sdk/channel-actions` 中的 `channelActions*` 辅助工具与原始"操作"Channel 导出一起被弃用。改为通过语义 `presentation` 界面暴露能力 — Channel Plugin 声明它们渲染什么（卡片、按钮、选择器），而不是接受哪些原始操作名称。

  </Accordion>

  <Accordion title="Web 搜索 Provider tool() 辅助工具 → Plugin 上的 createTool()">
    **旧**：来自 `openclaw/plugin-sdk/provider-web-search` 的 `tool()` 工厂。

    **新**：直接在 Provider Plugin 上实现 `createTool(...)`。OpenClaw 不再需要 SDK 辅助工具来注册工具包装器。

  </Accordion>

  <Accordion title="纯文本 Channel 信封 → BodyForAgent">
    **旧**：`formatInboundEnvelope(...)（以及 `ChannelMessageForAgent.channelEnvelope`）用于从入站 Channel 消息构建平面纯文本提示信封。

    **新**：`BodyForAgent` 加上结构化用户上下文块。Channel Plugin 将路由元数据（线程、主题、回复到、反应）作为类型化字段附加，而不是将它们连接成提示字符串。`formatAgentEnvelope(...)` 辅助工具对于合成的面向 Assistant 的信封仍然受支持，但入站纯文本信封正在淘汰中。

    受影响的区域：`inbound_claim`、`message_received` 以及任何后处理 `channelEnvelope` 文本的自定义 Channel Plugin。

  </Accordion>

  <Accordion title="Provider 发现类型 → Provider 目录类型">
    四个发现类型别名现在是目录时代类型的薄包装器：

    | 旧别名                     | 新类型                    |
    | -------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`   | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext` | `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult`  | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery`  | `ProviderPluginCatalog`   |

    以及旧版 `ProviderCapabilities` 静态包 — Provider Plugin 应通过显式 Provider Hook 如 `buildReplayPolicy`、`normalizeToolSchemas` 和 `wrapStreamFn`，而不是静态对象。

  </Accordion>

  <Accordion title="思考策略 Hook → resolveThinkingProfile">
    **旧**（`ProviderThinkingPolicy` 上的三个独立 Hook）：`isBinaryThinking(ctx)`、`supportsXHighThinking(ctx)` 和 `resolveDefaultThinkingLevel(ctx)`。

    **新**：单个 `resolveThinkingProfile(ctx)`，返回带有规范 `id`、可选 `label` 和按排名的级别列表的 `ProviderThinkingProfile`。OpenClaw 自动按配置文件排名降级存储的旧值。

    实现一个 Hook 而不是三个。旧版 Hook 在弃用窗口内继续工作，但不与配置文件结果组合。

  </Accordion>

  <Accordion title="外部 OAuth Provider 回退 → contracts.externalAuthProviders">
    **旧**：实现 `resolveExternalOAuthProfiles(...)` 而不在 Plugin 清单中声明 Provider。

    **新**：在 Plugin 清单中声明 `contracts.externalAuthProviders` **并**实现 `resolveExternalAuthProfiles(...)`。旧的"认证回退"路径在运行时发出警告，将会被删除。

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider 环境变量查找 → setup.providers[].envVars">
    **旧**清单字段：`providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`。

    **新**：将相同的环境变量查找镜像到清单上的 `setup.providers[].envVars`。这将设置/状态环境元数据整合在一个地方，避免仅为回答环境变量查找而启动 Plugin 运行时。

    `providerAuthEnvVars` 通过兼容性适配器在弃用窗口关闭之前仍然受支持。

  </Accordion>

  <Accordion title="内存 Plugin 注册 → registerMemoryCapability">
    **旧**：三次独立调用 — `api.registerMemoryPromptSection(...)`、`api.registerMemoryFlushPlan(...)`、`api.registerMemoryRuntime(...)`。

    **新**：在内存状态 API 上一次调用 — `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`。

    相同的槽，单次注册调用。附加的内存辅助工具（`registerMemoryPromptSupplement`、`registerMemoryCorpusSupplement`、`registerMemoryEmbeddingProvider`）不受影响。

  </Accordion>

  <Accordion title="子 Agent Session 消息类型已重命名">
    仍从 `src/plugins/runtime/types.ts` 导出的两个旧版类型别名：

    | 旧                            | 新                                 |
    | ----------------------------- | ---------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    运行时方法 `readSession` 已弃用，改用 `getSessionMessages`。签名相同；旧方法调用新方法。

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **旧**：`runtime.tasks.flow`（单数）返回实时任务流访问器。

    **新**：`runtime.tasks.managedFlows` 为需要从流创建、更新、取消或运行子任务的 Plugin 保留托管 TaskFlow 变更运行时。当 Plugin 只需要基于 DTO 的读取时使用 `runtime.tasks.flows`。

    ```typescript
    // 之前
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // 之后
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="嵌入式扩展工厂 → Agent 工具结果中间件">
    已在上面"如何迁移 → 将 Pi 工具结果扩展迁移到中间件"中介绍。此处包含以示完整：已移除的仅 Pi `api.registerEmbeddedExtensionFactory(...)` 路径被 `api.registerAgentToolResultMiddleware(...)` 替换，在 `contracts.agentToolResultMiddleware` 中有明确的运行时列表。
  </Accordion>

  <Accordion title="OpenClawSchemaType 别名 → OpenClawConfig">
    从 `openclaw/plugin-sdk` 重导出的 `OpenClawSchemaType` 现在是 `OpenClawConfig` 的单行别名。优先使用规范名称。

    ```typescript
    // 之前
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // 之后
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
扩展级别的弃用（在 `extensions/` 下的捆绑 Channel/Provider Plugin 内部）在其自己的 `api.ts` 和 `runtime-api.ts` 桶中跟踪。它们不影响第三方 Plugin 契约，不在此处列出。如果您直接使用捆绑 Plugin 的本地桶，请在升级之前阅读该桶中的弃用注释。
</Note>

## 删除时间线

| 时机             | 发生什么                                                             |
| ---------------- | -------------------------------------------------------------------- |
| **现在**         | 已弃用的接口发出运行时警告                                           |
| **下一主要版本** | 已弃用的接口将被删除；仍在使用它们的 Plugin 将会失败                |

所有核心 Plugin 都已迁移。外部 Plugin 应在下一个主要版本之前迁移。

## 临时抑制警告

在迁移期间设置这些环境变量：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这是临时的应急出口，不是永久解决方案。

## 相关

- [入门指南](/plugins/building-plugins) — 构建您的第一个 Plugin
- [SDK 概览](/plugins/sdk-overview) — 完整子路径导入参考
- [Channel Plugin](/plugins/sdk-channel-plugins) — 构建 Channel Plugin
- [Provider Plugin](/plugins/sdk-provider-plugins) — 构建 Provider Plugin
- [Plugin 内部架构](/plugins/architecture) — 架构深度剖析
- [Plugin 清单](/plugins/manifest) — 清单模式参考
