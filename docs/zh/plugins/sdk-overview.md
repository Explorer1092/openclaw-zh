---
mmh3_hash: "588edaa0f0ed9b8297a21f5f7a7fab63"
title: "Plugin SDK 概览"
sidebarTitle: "SDK 概览"
summary: "导入映射、注册 API 参考和 SDK 架构"
read_when:
  - 您需要知道从哪个 SDK 子路径导入
  - 您需要 OpenClawPluginApi 上所有注册方法的参考
  - 您正在查找特定的 SDK 导出
---

# Plugin SDK 概览

Plugin SDK 是 Plugin 与核心之间的类型化契约。本页是**导入什么**和**可以注册什么**的参考文档。

<Tip>
  **正在寻找操作指南？**

- 第一个 Plugin？从 [入门指南](/plugins/building-plugins) 开始。
- Channel Plugin？参见 [Channel Plugin](/plugins/sdk-channel-plugins)。
- Provider Plugin？参见 [Provider Plugin](/plugins/sdk-provider-plugins)。
- Tool 或生命周期 Hook Plugin？参见 [Plugin Hook](/plugins/hooks)。
  </Tip>

## 导入规范

始终从特定子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型自包含模块。这保持了启动速度并防止循环依赖问题。对于 Channel 特定的入口/构建辅助工具，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留用于更广泛的伞形接口和共享辅助工具，如 `buildChannelConfigSchema`。

对于 Channel 配置，通过 `openclaw.plugin.json#channelConfigs` 发布 Channel 自有的 JSON Schema。`plugin-sdk/channel-config-schema` 子路径用于共享 Schema 原语和通用构建器。该子路径上任何捆绑 Channel 命名的 Schema 导出都是旧版兼容性导出，不是新 Plugin 的模式。

<Warning>
  不要导入 Provider 或 Channel 品牌的便利接缝（例如 `openclaw/plugin-sdk/slack`、`.../discord`、`.../signal`、`.../whatsapp`）。捆绑 Plugin 在自己的 `api.ts` / `runtime-api.ts` barrel 中组合通用 SDK 子路径；核心消费者应使用那些 Plugin 本地 barrel，或在需求真正是跨 Channel 时添加窄向通用 SDK 契约。

少量捆绑 Plugin 辅助接缝（`plugin-sdk/feishu`、`plugin-sdk/zalo`、`plugin-sdk/matrix*` 等）仍出现在生成的导出映射中。它们仅用于捆绑 Plugin 维护，不是新第三方 Plugin 的推荐导入路径。
</Warning>

## 子路径参考

Plugin SDK 以按区域分组的窄子路径集合暴露（Plugin 入口、Channel、Provider、认证、运行时、能力、内存和保留的捆绑 Plugin 辅助工具）。完整目录（分组并链接）请参见 [Plugin SDK 子路径](/plugins/sdk-subpaths)。

200+ 子路径的生成列表位于 `scripts/lib/plugin-sdk-entrypoints.json`。

## 注册 API

`register(api)` 回调接收具有以下方法的 `OpenClawPluginApi` 对象：

### 能力注册

| 方法                                             | 注册内容                     |
| ------------------------------------------------ | ---------------------------- |
| `api.registerProvider(...)`                      | 文本推断（LLM）              |
| `api.registerAgentHarness(...)`                  | 实验性低级 Agent 执行器      |
| `api.registerCliBackend(...)`                    | 本地 CLI 推断后端            |
| `api.registerChannel(...)`                       | 消息 Channel                 |
| `api.registerSpeechProvider(...)`                | 文本转语音 / STT 合成        |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录                 |
| `api.registerRealtimeVoiceProvider(...)`         | 双工实时语音 Session         |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析           |
| `api.registerImageGenerationProvider(...)`       | 图像生成                     |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                     |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                     |
| `api.registerWebFetchProvider(...)`              | Web 抓取 Provider            |
| `api.registerWebSearchProvider(...)`             | Web 搜索                     |

### Tool 和命令

| 方法                            | 注册内容                                        |
| ------------------------------- | ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent Tool（必需或 `{ optional: true }`）       |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                          |

### 基础设施

| 方法                                           | 注册内容                        |
| ---------------------------------------------- | ------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件 Hook                       |
| `api.registerHttpRoute(params)`                | Gateway HTTP 端点               |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 方法                |
| `api.registerGatewayDiscoveryService(service)` | 本地 Gateway 发现广播器         |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                      |
| `api.registerService(service)`                 | 后台服务                        |
| `api.registerInteractiveHandler(registration)` | 交互式处理程序                  |
| `api.registerAgentToolResultMiddleware(...)`   | 运行时工具结果中间件            |
| `api.registerMemoryPromptSupplement(builder)`  | 附加的内存相邻提示部分          |
| `api.registerMemoryCorpusSupplement(adapter)`  | 附加的内存搜索/读取语料库       |

<Note>
  保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终保持 `operator.admin`，即使 Plugin 尝试分配更窄的 Gateway 方法范围。优先使用 Plugin 特定的前缀来处理 Plugin 自有的方法。
</Note>

<Accordion title="何时使用工具结果中间件">
  捆绑 Plugin 可以使用 `api.registerAgentToolResultMiddleware(...)` 在工具执行后、运行时将该结果反馈给模型之前重写工具结果。这是用于异步输出缩减器（如 tokenjuice）的受信任运行时中立接缝。

捆绑 Plugin 必须为每个目标运行时声明 `contracts.agentToolResultMiddleware`，例如 `["pi", "codex"]`。外部 Plugin 无法注册此中间件；对于不需要模型前工具结果时序的工作，请保持使用正常的 OpenClaw Plugin Hook。旧版仅 Pi 的嵌入式扩展工厂注册路径已被移除。
</Accordion>

### Gateway 发现注册

`api.registerGatewayDiscoveryService(...)` 让 Plugin 在本地发现传输（如 mDNS/Bonjour）上广播活跃的 Gateway。OpenClaw 在启用本地发现时的 Gateway 启动期间调用该服务，传递当前 Gateway 端口和非秘密 TXT 提示数据，并在 Gateway 关闭期间调用返回的 `stop` 处理程序。

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

Gateway 发现 Plugin 不得将广播的 TXT 值视为机密或认证凭据。发现是路由提示；Gateway 认证和 TLS 固定仍然拥有信任。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两种类型的顶级元数据：

- `commands`：注册器拥有的显式命令根
- `descriptors`：用于根 CLI 帮助、路由和延迟 Plugin CLI 注册的解析时命令描述符

如果您希望 Plugin 命令在正常根 CLI 路径中保持延迟加载，请提供覆盖该注册器暴露的每个顶级命令根的 `descriptors`。

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

仅当您不需要延迟根 CLI 注册时才单独使用 `commands`。该急切兼容路径仍然受支持，但它不安装描述符支持的占位符用于解析时延迟加载。

### CLI 后端注册

`api.registerCliBackend(...)` 让 Plugin 拥有本地 AI CLI 后端（如 `codex-cli`）的默认配置。

- 后端 `id` 成为模型引用中的 Provider 前缀，如 `codex-cli/gpt-5`。
- 后端 `config` 使用与 `agents.defaults.cliBackends.<id>` 相同的形状。
- 用户配置仍然优先。OpenClaw 在运行 CLI 之前将 `agents.defaults.cliBackends.<id>` 合并到 Plugin 默认值之上。
- 当后端在合并后需要兼容性重写时（例如规范化旧标志形状），使用 `normalizeConfig`。

### 专有槽

| 方法                                       | 注册内容                                                                                                                           |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次激活一个）。`assemble()` 回调接收 `availableTools` 和 `citationsMode`，以便引擎可以定制提示添加内容。             |
| `api.registerMemoryCapability(capability)` | 统一内存能力                                                                                                                       |
| `api.registerMemoryPromptSection(builder)` | 内存提示部分构建器                                                                                                                 |
| `api.registerMemoryFlushPlan(resolver)`    | 内存刷新计划解析器                                                                                                                 |
| `api.registerMemoryRuntime(runtime)`       | 内存运行时适配器                                                                                                                   |

### 内存嵌入适配器

| 方法                                           | 注册内容                                |
| ---------------------------------------------- | --------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活跃 Plugin 的内存嵌入适配器           |

- `registerMemoryCapability` 是首选的专有内存 Plugin API。
- `registerMemoryCapability` 也可以暴露 `publicArtifacts.listArtifacts(...)`，以便伴侣 Plugin 可以通过 `openclaw/plugin-sdk/memory-host-core` 使用导出的内存工件，而不是访问特定内存 Plugin 的私有布局。
- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和 `registerMemoryRuntime` 是旧版兼容的专有内存 Plugin API。
- `registerMemoryEmbeddingProvider` 让活跃内存 Plugin 注册一个或多个嵌入适配器 id（例如 `openai`、`gemini` 或自定义 Plugin 定义的 id）。
- 用户配置（如 `agents.defaults.memorySearch.provider` 和 `agents.defaults.memorySearch.fallback`）对这些注册的适配器 id 进行解析。

### 事件和生命周期

| 方法                                         | 作用                      |
| -------------------------------------------- | ------------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期 Hook       |
| `api.onConversationBindingResolved(handler)` | 会话绑定回调              |

有关示例、常见 Hook 名称和守卫语义，请参见 [Plugin Hook](/plugins/hooks)。

### Hook 决策语义

- `before_tool_call`：返回 `{ block: true }` 是终止的。一旦任何处理程序设置它，较低优先级的处理程序就会被跳过。
- `before_tool_call`：返回 `{ block: false }` 被视为没有决策（与省略 `block` 相同），而不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止的。一旦任何处理程序设置它，较低优先级的处理程序就会被跳过。
- `before_install`：返回 `{ block: false }` 被视为没有决策（与省略 `block` 相同），而不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止的。一旦任何处理程序声明调度，较低优先级的处理程序和默认模型调度路径就会被跳过。
- `message_sending`：返回 `{ cancel: true }` 是终止的。一旦任何处理程序设置它，较低优先级的处理程序就会被跳过。
- `message_sending`：返回 `{ cancel: false }` 被视为没有决策（与省略 `cancel` 相同），而不是覆盖。
- `message_received`：当您需要入站线程/主题路由时，使用类型化的 `threadId` 字段。将 `metadata` 保留用于 Channel 特定的附加信息。
- `message_sending`：在回退到 Channel 特定的 `metadata` 之前，使用类型化的 `replyToId` / `threadId` 路由字段。
- `gateway_start`：使用 `ctx.config`、`ctx.workspaceDir` 和 `ctx.getCron?.()` 获取 Gateway 拥有的启动状态，而不是依赖内部 `gateway:startup` Hook。

### API 对象字段

| 字段                     | 类型                      | 描述                                                                                                 |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                                            |
| `api.name`               | `string`                  | 显示名称                                                                                             |
| `api.version`            | `string?`                 | Plugin 版本（可选）                                                                                  |
| `api.description`        | `string?`                 | Plugin 描述（可选）                                                                                  |
| `api.source`             | `string`                  | Plugin 源路径                                                                                        |
| `api.rootDir`            | `string?`                 | Plugin 根目录（可选）                                                                                |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活跃的内存运行时快照）                                                         |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的 Plugin 特定配置                                               |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助工具](/plugins/sdk-runtime)                                                               |
| `api.logger`             | `PluginLogger`            | 作用域日志器（`debug`、`info`、`warn`、`error`）                                                    |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是轻量级的完整入口前启动/设置窗口                                   |
| `api.resolvePath(input)` | `(string) => string`      | 相对于 Plugin 根解析路径                                                                             |

## 内部模块规范

在您的 Plugin 内，使用本地 barrel 文件进行内部导入：

```
my-plugin/
  api.ts            # 外部消费者的公共导出
  runtime-api.ts    # 仅内部运行时导出
  index.ts          # Plugin 入口点
  setup-entry.ts    # 轻量级仅设置入口（可选）
```

<Warning>
  永远不要在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>` 导入自己的 Plugin。通过 `./api.ts` 或 `./runtime-api.ts` 路由内部导入。SDK 路径仅是外部契约。
</Warning>

外观加载的捆绑 Plugin 公共界面（`api.ts`、`runtime-api.ts`、`index.ts`、`setup-entry.ts` 等公共入口文件）在 OpenClaw 已经运行时优先使用活跃的运行时配置快照。如果尚不存在运行时快照，则回退到磁盘上的已解析配置文件。

Provider Plugin 可以在辅助工具有意地是 Provider 特定的且尚不属于通用 SDK 子路径时暴露窄向 Plugin 本地契约 barrel。捆绑示例：

- **Anthropic**：公共 `api.ts` / `contract-api.ts` 接缝，用于 Claude beta 头部和 `service_tier` 流辅助工具。
- **`@openclaw/openai-provider`**：`api.ts` 导出 Provider 构建器、默认模型辅助工具和实时 Provider 构建器。
- **`@openclaw/openrouter-provider`**：`api.ts` 导出 Provider 构建器以及入门/配置辅助工具。

<Warning>
  扩展生产代码也应避免 `openclaw/plugin-sdk/<other-plugin>` 导入。如果辅助工具真正是共享的，请将其提升到中性的 SDK 子路径，如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或另一个面向能力的界面，而不是将两个 Plugin 耦合在一起。
</Warning>

## 相关

<CardGroup cols={2}>
  <Card title="入口点" icon="door-open" href="/plugins/sdk-entrypoints">
    `definePluginEntry` 和 `defineChannelPluginEntry` 选项。
  </Card>
  <Card title="运行时辅助工具" icon="gears" href="/plugins/sdk-runtime">
    完整的 `api.runtime` 命名空间参考。
  </Card>
  <Card title="设置和配置" icon="sliders" href="/plugins/sdk-setup">
    打包、清单和配置 Schema。
  </Card>
  <Card title="测试" icon="vial" href="/plugins/sdk-testing">
    测试工具和 lint 规则。
  </Card>
  <Card title="SDK 迁移" icon="arrows-turn-right" href="/plugins/sdk-migration">
    从已弃用接口迁移。
  </Card>
  <Card title="Plugin 内部架构" icon="diagram-project" href="/plugins/architecture">
    深度架构和能力模型。
  </Card>
</CardGroup>
