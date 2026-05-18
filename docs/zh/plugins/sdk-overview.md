---
mmh3_hash: "01d9095dec7af8b3b04e4ac3149dc946"
title: "Plugin SDK 概览"
sidebarTitle: "SDK 概览"
summary: "导入映射、注册 API 参考和 SDK 架构"
read_when:
  - 您需要知道从哪个 SDK 子路径导入
  - 您需要 OpenClawPluginApi 上所有注册方法的参考
  - 您正在查找特定的 SDK 导出
doc-schema-version: 1
---

Plugin SDK 是 Plugin 与 Core 之间的类型化契约。本页是**导入什么**和**可以注册什么**的参考。

<Note>
  本页面面向在 OpenClaw 内使用 `openclaw/plugin-sdk/*` 的 Plugin 作者。对于希望通过 Gateway 运行 Agent 的外部应用、脚本、仪表板、CI 任务和 IDE 扩展，请改用 [OpenClaw App SDK](/concepts/openclaw-sdk) 和 `@openclaw/sdk` 包。
</Note>

<Tip>
寻找操作指南？从[构建 Plugin](/plugins/building-plugins) 开始，Channel Plugin 使用 [Channel Plugin](/plugins/sdk-channel-plugins)，Provider Plugin 使用 [Provider Plugin](/plugins/sdk-provider-plugins)，本地 AI CLI 后端使用 [CLI 后端 Plugin](/plugins/cli-backend-plugins)，工具或生命周期 Hook Plugin 使用 [Plugin Hook](/plugins/hooks)。
</Tip>

## 导入约定

始终从特定子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型、自包含的模块。这使启动保持快速并防止循环依赖问题。对于特定于 Channel 的入口/构建辅助函数，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留给更广泛的总体表面和共享辅助函数，如 `buildChannelConfigSchema`。

对于 Channel 配置，通过 `openclaw.plugin.json#channelConfigs` 发布 Channel 拥有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路径用于共享 Schema 原语和通用构建器。OpenClaw 的捆绑 Plugin 使用 `plugin-sdk/bundled-channel-config-schema` 保留捆绑 Channel Schema。已弃用的兼容性导出保留在 `plugin-sdk/channel-config-schema-legacy`；这两个捆绑 Schema 子路径都不是新 Plugin 的模式。

<Warning>
  不要导入 Provider 或 Channel 品牌便利接缝（例如 `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。捆绑 Plugin 在其自己的 `api.ts` / `runtime-api.ts` 桶中组合通用 SDK 子路径；Core 消费者应该使用这些 Plugin 本地桶，或者在需求真正跨 Channel 时添加窄泛型 SDK 契约。

当某些捆绑 Plugin 辅助函数接缝具有跟踪的所有者使用情况时，仍然会出现在生成的导出映射中。它们仅用于捆绑 Plugin 维护，不是新第三方 Plugin 的推荐导入路径。

`openclaw/plugin-sdk/discord` 和 `openclaw/plugin-sdk/telegram-account` 也作为已弃用的兼容性门面保留，用于跟踪的所有者使用情况。不要将这些导入路径复制到新 Plugin 中；改用注入的运行时辅助函数和通用 Channel SDK 子路径。
</Warning>

## 子路径参考

Plugin SDK 作为一组按区域分组的窄子路径公开（Plugin 入口、Channel、Provider、认证、运行时、能力、内存和保留的捆绑 Plugin 辅助函数）。有关完整目录（分组和链接），请参见 [Plugin SDK 子路径](/plugins/sdk-subpaths)。

编译器入口点清单位于 `scripts/lib/plugin-sdk-entrypoints.json`；包导出从公共子集生成，减去 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的仓库本地测试/内部子路径。运行 `pnpm plugin-sdk:surface` 审计公共导出计数。被捆绑扩展生产代码足够旧且未使用的已弃用公共子路径在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中跟踪；宽泛的已弃用重导出桶在 `scripts/lib/plugin-sdk-deprecated-barrel-subpaths.json` 中跟踪。

## 注册 API

`register(api)` 回调接收带有以下方法的 `OpenClawPluginApi` 对象：

### 能力注册

| 方法                                             | 注册内容                    |
| ------------------------------------------------ | --------------------------- |
| `api.registerProvider(...)`                      | 文本推理（LLM）             |
| `api.registerAgentHarness(...)`                  | 实验性低级 Agent 执行器     |
| `api.registerCliBackend(...)`                    | 本地 CLI 推理后端           |
| `api.registerChannel(...)`                       | 消息 Channel                |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成       |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录                |
| `api.registerRealtimeVoiceProvider(...)`         | 双工实时语音 Session        |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析          |
| `api.registerImageGenerationProvider(...)`       | 图像生成                    |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                    |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                    |
| `api.registerWebFetchProvider(...)`              | Web fetch / 抓取 Provider   |
| `api.registerWebSearchProvider(...)`             | Web 搜索                    |

### 工具和命令

对于具有固定工具名称的简单纯工具 Plugin，使用 [`defineToolPlugin`](/plugins/tool-plugins)。对于混合 Plugin 或完全动态的工具注册，直接使用 `api.registerTool(...)`。

| 方法                            | 注册内容                                    |
| ------------------------------- | ------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent 工具（必填或 `{ optional: true }`）   |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                      |

当 Agent 需要简短的命令拥有的路由提示时，Plugin 命令可以设置 `agentPromptGuidance`。将该文本保持关于命令本身；不要向 Core 提示构建器添加特定于 Provider 或 Plugin 的策略。

### 基础设施

| 方法                                           | 注册内容                            |
| ---------------------------------------------- | ----------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件 Hook                           |
| `api.registerHttpRoute(params)`                | Gateway HTTP 端点                   |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 方法                    |
| `api.registerGatewayDiscoveryService(service)` | 本地 Gateway 发现广告器             |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                          |
| `api.registerNodeCliFeature(registrar, opts?)` | `openclaw nodes` 下的节点功能 CLI   |
| `api.registerService(service)`                 | 后台服务                            |
| `api.registerInteractiveHandler(registration)` | 交互式处理程序                      |
| `api.registerAgentToolResultMiddleware(...)`   | 运行时工具结果中间件                |
| `api.registerMemoryPromptSupplement(builder)`  | 附加内存相邻提示部分                |
| `api.registerMemoryCorpusSupplement(adapter)`  | 附加内存搜索/读取语料库             |

### 工作流 Plugin 的主机 Hook

主机 Hook 是需要参与主机生命周期而不仅仅是添加 Provider、Channel 或工具的 Plugin 的 SDK 接缝。它们是通用契约；计划模式可以使用它们，但审批工作流、工作区策略门、后台监控、设置向导和 UI 伴侣 Plugin 也可以。

| 方法                                                                                 | 拥有的契约                                                                                            |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `api.session.state.registerSessionExtension(...)`                                    | Plugin 拥有的、JSON 兼容的 Session 状态通过 Gateway Session 投影                                     |
| `api.session.workflow.enqueueNextTurnInjection(...)`                                 | 持久的精确一次性上下文，注入到一个 Session 的下一个 Agent 轮次                                       |
| `api.registerTrustedToolPolicy(...)`                                                 | 可以阻止或重写工具参数的捆绑/受信任的预 Plugin 工具策略                                              |
| `api.registerToolMetadata(...)`                                                      | 工具目录显示元数据，不改变工具实现                                                                    |
| `api.registerCommand(...)`                                                           | 范围化的 Plugin 命令；命令结果可以设置 `continueAgent: true`；Discord 原生命令支持 `descriptionLocalizations` |
| `api.session.controls.registerControlUiDescriptor(...)`                              | Session、工具、运行或设置表面的控制 UI 贡献描述符                                                    |
| `api.lifecycle.registerRuntimeLifecycle(...)`                                        | Plugin 拥有的运行时资源在重置/删除/重新加载路径上的清理回调                                          |
| `api.agent.events.registerAgentEventSubscription(...)`                               | 用于工作流状态和监控的净化事件订阅                                                                    |
| `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`  | 每次运行的 Plugin 临时状态，在终端运行生命周期时清除                                                  |
| `api.session.workflow.registerSessionSchedulerJob(...)`                              | Plugin 拥有的调度器作业的清理元数据；不调度工作或创建任务记录                                        |
| `api.session.workflow.sendSessionAttachment(...)`                                    | 仅限捆绑的主机中介文件附件交付到活跃直接出站 Session 路由                                            |
| `api.session.workflow.scheduleSessionTurn(...)` / `unscheduleSessionTurnsByTag(...)` | 仅限捆绑的 Cron 支持的定期 Session 轮次加上基于标签的清理                                            |
| `api.session.controls.registerSessionAction(...)`                                    | 客户端可以通过 Gateway 分发的类型化 Session 操作                                                     |

对于新 Plugin 代码，使用分组命名空间：

- `api.session.state.registerSessionExtension(...)`
- `api.session.workflow.enqueueNextTurnInjection(...)`
- `api.session.workflow.registerSessionSchedulerJob(...)`
- `api.session.workflow.sendSessionAttachment(...)`
- `api.session.workflow.scheduleSessionTurn(...)`
- `api.session.workflow.unscheduleSessionTurnsByTag(...)`
- `api.session.controls.registerSessionAction(...)`
- `api.session.controls.registerControlUiDescriptor(...)`
- `api.agent.events.registerAgentEventSubscription(...)`
- `api.agent.events.emitAgentEvent(...)`
- `api.runContext.setRunContext(...)` / `getRunContext(...)` / `clearRunContext(...)`
- `api.lifecycle.registerRuntimeLifecycle(...)`

等效的扁平方法作为现有 Plugin 的已弃用兼容性别名仍然可用。不要添加调用 `api.registerSessionExtension`、`api.enqueueNextTurnInjection`、`api.registerControlUiDescriptor`、`api.registerRuntimeLifecycle`、`api.registerAgentEventSubscription`、`api.emitAgentEvent`、`api.setRunContext`、`api.getRunContext`、`api.clearRunContext`、`api.registerSessionSchedulerJob`、`api.registerSessionAction`、`api.sendSessionAttachment`、`api.scheduleSessionTurn` 或 `api.unscheduleSessionTurnsByTag` 的新 Plugin 代码。

`scheduleSessionTurn(...)` 是 Gateway Cron 调度器上 Session 范围的便利包装。Cron 拥有时序并在轮次运行时创建后台任务记录；Plugin SDK 只约束目标 Session、Plugin 拥有的命名和清理。当工作本身需要持久的多步骤 Task Flow 状态时，在已调度轮次内使用 `api.runtime.tasks.managedFlows`。

契约有意分离权限：

- 外部 Plugin 可以拥有 Session 扩展、UI 描述符、命令、工具元数据、下一轮注入和普通 Hook。
- 受信任的工具策略在普通的 `before_tool_call` Hook 之前运行，并且仅限捆绑，因为它们参与主机安全策略。
- 保留的命令所有权仅限捆绑。外部 Plugin 应使用其自己的命令名称或别名。
- `allowPromptInjection=false` 禁用提示变更 Hook，包括 `agent_turn_prepare`、`before_prompt_build`、`heartbeat_prompt_contribution`、旧版 `before_agent_start` 中的提示字段和 `enqueueNextTurnInjection`。

非计划消费者的示例：

| Plugin 原型                | 使用的 Hook                                                                                                              |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 审批工作流                 | Session 扩展、命令延续、下一轮注入、UI 描述符                                                                           |
| 预算/工作区策略门          | 受信任的工具策略、工具元数据、Session 投影                                                                               |
| 后台生命周期监控器         | 运行时生命周期清理、Agent 事件订阅、Session 调度器所有权/清理、心跳提示贡献、UI 描述符                                  |
| 设置或入门向导             | Session 扩展、范围化命令、控制 UI 描述符                                                                                 |

<Note>
  保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终保持 `operator.admin`，即使 Plugin 尝试分配更窄的 Gateway 方法范围。Plugin 拥有的方法优先使用特定于 Plugin 的前缀。
</Note>

<Accordion title="何时使用工具结果中间件">
  当捆绑 Plugin 需要在执行后和运行时将结果反馈给模型之前重写工具结果时，可以使用 `api.registerAgentToolResultMiddleware(...)`。这是异步输出缩减器（如 tokenjuice）的受信任运行时中立接缝。

捆绑 Plugin 必须为每个目标运行时声明 `contracts.agentToolResultMiddleware`，例如 `["pi", "codex"]`。外部 Plugin 无法注册此中间件；对于不需要预模型工具结果时序的工作，保留普通 OpenClaw Plugin Hook。旧版仅限 Pi 的嵌入式扩展工厂注册路径已被删除。
</Accordion>

### Gateway 发现注册

`api.registerGatewayDiscoveryService(...)` 允许 Plugin 在本地发现传输（如 mDNS/Bonjour）上通告活跃的 Gateway。OpenClaw 在启用本地发现时在 Gateway 启动期间调用服务，传递当前 Gateway 端口和非密钥 TXT 提示数据，并在 Gateway 关闭期间调用返回的 `stop` 处理程序。

```typescript
api.registerGatewayDiscoveryService({
  id: "my-discovery",
  async advertise(ctx) {
    const handle = await startMyAdvertiser({
      gatewayPort: ctx.gatewayPort,
      tls: ctx.gatewayTlsEnabled,
      displayName: ctx.machineDisplayName,
    });
    return { stop: () => handle.stop() };
  },
});
```

Gateway 发现 Plugin 不得将通告的 TXT 值视为密钥或认证。发现是路由提示；Gateway 认证和 TLS 固定仍然拥有信任。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两种命令元数据：

- `commands`：注册器拥有的显式命令名称
- `descriptors`：用于 CLI 帮助、路由和延迟 Plugin CLI 注册的解析时命令描述符
- `parentPath`：嵌套命令组的可选父命令路径，例如 `["nodes"]`

对于配对节点功能，优先使用 `api.registerNodeCliFeature(registrar, opts?)`。它是 `api.registerCli(..., { parentPath: ["nodes"] })` 的小包装，使 `openclaw nodes canvas` 等命令成为显式 Plugin 拥有的节点功能。

如果您希望 Plugin 命令在普通根 CLI 路径中保持延迟加载，请提供覆盖该注册器公开的每个顶级命令根的 `descriptors`。

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerMatrixCli } = await import("./src/cli.js");
    registerMatrixCli({ program });
  },
  {
    descriptors: [
      {
        name: "matrix",
        description: "Manage Matrix accounts, verification, devices, and profile state",
        hasSubcommands: true,
      },
    ],
  },
);
```

嵌套命令接收解析的父命令作为 `program`：

```typescript
api.registerCli(
  async ({ program }) => {
    const { registerNodesCanvasCommands } = await import("./src/cli.js");
    registerNodesCanvasCommands(program);
  },
  {
    parentPath: ["nodes"],
    descriptors: [
      {
        name: "canvas",
        description: "Capture or render canvas content from a paired node",
        hasSubcommands: true,
      },
    ],
  },
);
```

只有在不需要延迟根 CLI 注册时才单独使用 `commands`。该急切兼容路径仍然受支持，但它不安装用于解析时延迟加载的描述符支持占位符。

### CLI 后端注册

`api.registerCliBackend(...)` 允许 Plugin 拥有本地 AI CLI 后端（如 `claude-cli` 或 `my-cli`）的默认配置。

- 后端 `id` 成为模型引用中的 Provider 前缀，如 `my-cli/gpt-5`。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的形状。
- 用户配置仍然优先。OpenClaw 在运行 CLI 之前将 `agents.defaults.cliBackends.<id>` 合并到 Plugin 默认值上。
- 当后端在合并后需要兼容性重写时（例如规范化旧标志形状），使用 `normalizeConfig`。
- 对于属于 CLI 方言的请求范围的 argv 重写（如将 OpenClaw 思考级别映射到原生努力标志），使用 `resolveExecutionArgs`。

有关端到端创作指南，请参见 [CLI 后端 Plugin](/plugins/cli-backend-plugins)。

### 独占插槽

| 方法                                       | 注册内容                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次只有一个活跃）。`assemble()` 回调接收 `availableTools` 和 `citationsMode`，使引擎可以定制提示添加。 |
| `api.registerMemoryCapability(capability)` | 统一内存能力                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | 内存提示部分构建器                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | 内存刷新计划解析器                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | 内存运行时适配器                                                                                                   |

### 内存嵌入适配器

| 方法                                           | 注册内容                           |
| ---------------------------------------------- | ---------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活跃 Plugin 的内存嵌入适配器       |

- `registerMemoryCapability` 是首选的独占内存 Plugin API。
- `registerMemoryCapability` 还可以公开 `publicArtifacts.listArtifacts(...)`，使伴侣 Plugin 可以通过 `openclaw/plugin-sdk/memory-host-core` 消费导出的内存工件，而不是深入特定内存 Plugin 的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和 `registerMemoryRuntime` 是旧版兼容的独占内存 Plugin API。
- `MemoryFlushPlan.model` 可以将刷新轮次固定到确切的 `provider/model` 引用，如 `ollama/qwen3:8b`，而不继承活跃的回退链。
- `registerMemoryEmbeddingProvider` 允许活跃的内存 Plugin 注册一个或多个嵌入适配器 ID（例如 `openai`、`gemini` 或自定义 Plugin 定义的 ID）。
- 用户配置（如 `agents.defaults.memorySearch.provider` 和 `agents.defaults.memorySearch.fallback`）针对这些已注册的适配器 ID 进行解析。

### 事件和生命周期

| 方法                                         | 功能                    |
| -------------------------------------------- | ----------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期 Hook     |
| `api.onConversationBindingResolved(handler)` | 对话绑定回调            |

有关示例、常见 Hook 名称和守卫语义，请参见 [Plugin Hook](/plugins/hooks)。

### Hook 决策语义

- `before_tool_call`：返回 `{ block: true }` 是终止性的。一旦任何处理程序设置它，较低优先级的处理程序将被跳过。
- `before_tool_call`：返回 `{ block: false }` 被视为无决策（与省略 `block` 相同），而不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止性的。一旦任何处理程序设置它，较低优先级的处理程序将被跳过。
- `before_install`：返回 `{ block: false }` 被视为无决策（与省略 `block` 相同），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止性的。一旦任何处理程序声明分发，较低优先级的处理程序和默认模型分发路径将被跳过。
- `message_sending`：返回 `{ cancel: true }` 是终止性的。一旦任何处理程序设置它，较低优先级的处理程序将被跳过。
- `message_sending`：返回 `{ cancel: false }` 被视为无决策（与省略 `cancel` 相同），而不是覆盖。
- `message_received`：当您需要入站线程/话题路由时，使用类型化的 `threadId` 字段。将 `metadata` 保留给 Channel 特定的额外信息。
- `message_sending`：在回退到 Channel 特定的 `metadata` 之前使用类型化的 `replyToId` / `threadId` 路由字段。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 获取 Gateway 拥有的启动状态，而不是依赖内部 `gateway:startup` Hook。
- `cron_changed`：观察 Gateway 拥有的 Cron 生命周期变化。同步外部唤醒调度器时使用 `event.job?.state?.nextRunAtMs` 和 `ctx.getCron?.()`，并保持 OpenClaw 作为到期检查和执行的事实来源。

### API 对象字段

| 字段                     | 类型                      | 描述                                                                                   |
| ------------------------ | ------------------------- | -------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin ID                                                                              |
| `api.name`               | `string`                  | 显示名称                                                                               |
| `api.version`            | `string?`                 | Plugin 版本（可选）                                                                    |
| `api.description`        | `string?`                 | Plugin 描述（可选）                                                                    |
| `api.source`             | `string`                  | Plugin 源路径                                                                          |
| `api.rootDir`            | `string?`                 | Plugin 根目录（可选）                                                                  |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活跃内存运行时快照）                                             |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的特定于 Plugin 的配置                             |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助函数](/plugins/sdk-runtime)                                                 |
| `api.logger`             | `PluginLogger`            | 范围化日志记录器（`debug`、`info`、`warn`、`error`）                                   |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是轻量级的预完整入口启动/设置窗口                     |
| `api.resolvePath(input)` | `(string) => string`      | 相对于 Plugin 根解析路径                                                               |

## 内部模块约定

在您的 Plugin 中，使用本地桶文件进行内部导入：

```
my-plugin/
  api.ts            # 外部消费者的公共导出
  runtime-api.ts    # 仅内部运行时导出
  index.ts          # Plugin 入口点
  setup-entry.ts    # 轻量级仅设置入口（可选）
```

<Warning>
  永远不要从生产代码通过 `openclaw/plugin-sdk/<your-plugin>` 导入您自己的 Plugin。通过 `./api.ts` 或 `./runtime-api.ts` 路由内部导入。SDK 路径仅是外部契约。
</Warning>

门面加载的捆绑 Plugin 公共表面（`api.ts`、`runtime-api.ts`、`index.ts`、`setup-entry.ts` 和类似的公共入口文件）在 OpenClaw 已经运行时优先使用活跃的运行时配置快照。如果还没有运行时快照，它们将回退到磁盘上已解析的配置文件。打包的捆绑 Plugin 门面应通过 OpenClaw 的 Plugin 门面加载器加载；直接从 `dist/extensions/...` 导入会绕过打包安装用于 Plugin 拥有代码的 Manifest 和运行时附属检查。

Provider Plugin 可以在辅助函数故意特定于 Provider 且尚不属于通用 SDK 子路径时公开窄 Plugin 本地契约桶。捆绑示例：

- **Anthropic**：公共 `api.ts` / `contract-api.ts` 接缝，用于 Claude beta 标头和 `service_tier` 流辅助函数。
- **`@openclaw/openai-provider`**：`api.ts` 导出 Provider 构建器、默认模型辅助函数和实时 Provider 构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出 Provider 构建器加上入门/配置辅助函数。

<Warning>
  扩展生产代码还应避免 `openclaw/plugin-sdk/<other-plugin>` 导入。如果辅助函数确实是共享的，将其推广到中立 SDK 子路径，如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他面向能力的表面，而不是将两个 Plugin 耦合在一起。
</Warning>

## 相关

<CardGroup cols={2}>
  <Card title="入口点" icon="door-open" href="/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 选项。
  </Card>
  <Card title="运行时辅助函数" icon="gears" href="/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空间参考。
  </Card>
  <Card title="设置和配置" icon="sliders" href="/plugins/sdk-setup">
    打包、Manifest 和配置 Schema。
  </Card>
  <Card title="测试" icon="vial" href="/plugins/sdk-testing">
    测试实用程序和 lint 规则。
  </Card>
  <Card title="SDK 迁移" icon="arrows-turn-right" href="/plugins/sdk-migration">
    从已弃用的表面迁移。
  </Card>
  <Card title="Plugin 内部" icon="diagram-project" href="/plugins/architecture">
    深入架构和能力模型。
  </Card>
</CardGroup>
