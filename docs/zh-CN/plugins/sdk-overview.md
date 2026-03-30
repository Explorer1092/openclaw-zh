---
mmh3_hash: "6faa7bbcf1f7da8b9eb337861f52b96f"
title: Plugin SDK Overview
sidebarTitle: SDK Overview
summary: 导入映射、注册 API 参考和 SDK 架构
read_when:
  - 你需要知道应该从哪个 SDK 子路径导入
  - 你想参考 OpenClawPluginApi 上的所有注册方法
  - 你在查找某个具体的 SDK 导出
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/sdk-overview.md
  workflow: 15
---

# Plugin SDK Overview

Plugin SDK 是插件与核心之间的类型化契约。本页是**导入什么**和**可以注册什么**的参考文档。

<Tip>
  **在找操作指南？**
  - 第一个插件？从 [入门指南](/plugins/building-plugins) 开始
  - Channel 插件？参阅 [Channel 插件](/plugins/sdk-channel-plugins)
  - Provider 插件？参阅 [Provider 插件](/plugins/sdk-provider-plugins)
</Tip>

## 导入约定

始终从具体的子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
```

每个子路径都是小型、自包含的模块。这样可以保持启动速度快，并避免循环依赖问题。

## 子路径参考

按用途分组的最常用子路径。包含 100+ 个子路径的完整列表位于 `scripts/lib/plugin-sdk-entrypoints.json`。

### 插件入口

| 子路径                    | 主要导出                                                                                                                               |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry` | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |

<AccordionGroup>
  <Accordion title="Channel 子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface` |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel 配置 Schema 类型 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/channel-inbound` | 防抖、提及匹配、信封辅助工具 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/channel-contract` | Channel 契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/反应接入 |
  </Accordion>

  <Accordion title="Provider 子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + 看门狗常量 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `normalizeModelCompat` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog` |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 等 |
    | `plugin-sdk/provider-stream` | 流封装类型 |
    | `plugin-sdk/provider-onboard` | 引导配置补丁辅助工具 |
    | `plugin-sdk/global-singleton` | 进程本地单例/映射/缓存辅助工具 |
  </Accordion>

  <Accordion title="认证和安全子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate` |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/secret-input` | 秘密输入解析辅助工具 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助工具 |
    | `plugin-sdk/webhook-request-guards` | 请求体大小/超时辅助工具 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/config-runtime` | 配置加载/写入辅助工具 |
    | `plugin-sdk/approval-runtime` | Exec 和插件审批辅助工具 |
    | `plugin-sdk/infra-runtime` | 系统事件/心跳辅助工具 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助工具 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志和事件辅助工具 |
    | `plugin-sdk/error-runtime` | 错误图和格式化辅助工具 |
    | `plugin-sdk/fetch-runtime` | 封装 fetch、代理和固定查找辅助工具 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助工具 |
    | `plugin-sdk/retry-runtime` | 重试配置和运行器辅助工具 |
    | `plugin-sdk/agent-runtime` | Agent 目录/标识/工作区辅助工具 |
    | `plugin-sdk/directory-runtime` | 基于配置的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/image-generation` | 图像生成 Provider 类型 |
    | `plugin-sdk/media-understanding` | 媒体理解 Provider 类型 |
    | `plugin-sdk/speech` | 语音 Provider 类型 |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>
</AccordionGroup>

## 注册 API

`register(api)` 回调接收一个包含以下方法的 `OpenClawPluginApi` 对象：

### 能力注册

| 方法                                          | 注册内容                 |
| --------------------------------------------- | ------------------------ |
| `api.registerProvider(...)`                   | 文本推理（LLM）          |
| `api.registerCliBackend(...)`                 | 本地 CLI 推理后端        |
| `api.registerChannel(...)`                    | 消息 Channel             |
| `api.registerSpeechProvider(...)`             | 文本转语音 / STT 合成    |
| `api.registerMediaUnderstandingProvider(...)` | 图像/音频/视频分析       |
| `api.registerImageGenerationProvider(...)`    | 图像生成                 |
| `api.registerWebSearchProvider(...)`          | 网络搜索                 |

### 工具和命令

| 方法                            | 注册内容                                        |
| ------------------------------- | ----------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent 工具（必选或 `{ optional: true }`）        |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                          |

### 基础设施

| 方法                                           | 注册内容              |
| ---------------------------------------------- | --------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件 Hook             |
| `api.registerHttpRoute(params)`                | Gateway HTTP 端点     |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 方法      |
| `api.registerCli(registrar, opts?)`            | CLI 子命令            |
| `api.registerService(service)`                 | 后台服务              |
| `api.registerInteractiveHandler(registration)` | 交互式处理程序        |

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两种顶级元数据：

- `commands`：注册器拥有的显式命令根
- `descriptors`：用于根 CLI 帮助、路由和懒加载插件 CLI 注册的解析时命令描述符

如果你希望插件命令在普通根 CLI 路径中保持懒加载，请提供覆盖该注册器暴露的每个顶级命令根的 `descriptors`。

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

仅在不需要懒加载根 CLI 注册时才单独使用 `commands`。这种急加载兼容路径仍然受支持，但不会为解析时懒加载安装描述符支持的占位符。

### CLI 后端注册

`api.registerCliBackend(...)` 让插件拥有本地 AI CLI 后端（如 `claude-cli` 或 `codex-cli`）的默认配置。

- 后端 `id` 成为模型引用中的 Provider 前缀，如 `claude-cli/opus`。
- 后端 `config` 与 `agents.defaults.cliBackends.<id>` 形状相同。
- 用户配置优先。OpenClaw 在运行 CLI 前将 `agents.defaults.cliBackends.<id>` 合并到插件默认值之上。
- 当后端需要在合并后进行兼容性重写时（例如规范化旧 Flag 格式），使用 `normalizeConfig`。

### 独占 Slot

| 方法                                       | 注册内容                       |
| ------------------------------------------ | ------------------------------ |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（同时只有一个激活） |
| `api.registerMemoryPromptSection(builder)` | 记忆提示节构建器               |
| `api.registerMemoryFlushPlan(resolver)`    | 记忆刷新计划解析器             |
| `api.registerMemoryRuntime(runtime)`       | 记忆运行时适配器               |

### 记忆嵌入适配器

| 方法                                           | 注册内容                                          |
| ---------------------------------------------- | ------------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 为当前激活插件注册记忆嵌入适配器                  |

- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和 `registerMemoryRuntime` 仅限记忆插件使用。
- `registerMemoryEmbeddingProvider` 让当前激活的记忆插件注册一个或多个嵌入适配器 id（例如 `openai`、`gemini` 或自定义插件定义的 id）。
- 用户配置（如 `agents.defaults.memorySearch.provider` 和 `agents.defaults.memorySearch.fallback`）会针对这些已注册的适配器 id 进行解析。

### 事件和生命周期

| 方法                                         | 功能                 |
| -------------------------------------------- | -------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期 Hook  |
| `api.onConversationBindingResolved(handler)` | 会话绑定回调         |

### Hook 决策语义

- `before_tool_call`：返回 `{ block: true }` 是终止性的。一旦任何处理程序设置了它，低优先级处理程序会被跳过。
- `before_tool_call`：返回 `{ block: false }` 被视为无决策（与省略 `block` 相同），不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止性的。一旦任何处理程序设置了它，低优先级处理程序会被跳过。
- `before_install`：返回 `{ block: false }` 被视为无决策（与省略 `block` 相同），不是覆盖。
- `message_sending`：返回 `{ cancel: true }` 是终止性的。一旦任何处理程序设置了它，低优先级处理程序会被跳过。
- `message_sending`：返回 `{ cancel: false }` 被视为无决策（与省略 `cancel` 相同），不是覆盖。

### API 对象字段

| 字段                     | 类型                      | 描述                                                             |
| ------------------------ | ------------------------- | ---------------------------------------------------------------- |
| `api.id`                 | `string`                  | 插件 id                                                          |
| `api.name`               | `string`                  | 显示名称                                                         |
| `api.version`            | `string?`                 | 插件版本（可选）                                                 |
| `api.description`        | `string?`                 | 插件描述（可选）                                                 |
| `api.source`             | `string`                  | 插件源路径                                                       |
| `api.rootDir`            | `string?`                 | 插件根目录（可选）                                               |
| `api.config`             | `OpenClawConfig`          | 当前配置快照                                                     |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的插件专属配置                |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助工具](/plugins/sdk-runtime)                           |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`, `info`, `warn`, `error`）             |
| `api.registrationMode`   | `PluginRegistrationMode`  | `"full"`, `"setup-only"`, `"setup-runtime"` 或 `"cli-metadata"` |
| `api.resolvePath(input)` | `(string) => string`      | 解析相对于插件根目录的路径                                       |

## 内部模块约定

在插件内部，使用本地桶文件进行内部导入：

```
my-plugin/
  api.ts            # 供外部消费者的公共导出
  runtime-api.ts    # 仅内部使用的运行时导出
  index.ts          # 插件入口点
  setup-entry.ts    # 轻量级仅设置入口（可选）
```

<Warning>
  永远不要在生产代码中通过 `openclaw/plugin-sdk/<your-plugin>` 导入自己的插件。内部导入请通过 `./api.ts` 或 `./runtime-api.ts` 路由。SDK 路径仅供外部契约使用。
</Warning>

<Warning>
  扩展生产代码也应避免 `openclaw/plugin-sdk/<other-plugin>` 导入。如果某个辅助工具确实需要共享，应将其提升到中立的 SDK 子路径（如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他面向能力的接口），而非将两个插件耦合在一起。
</Warning>

## 相关文档

- [Entry Points](/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry` 选项
- [运行时辅助工具](/plugins/sdk-runtime) — 完整的 `api.runtime` 命名空间参考
- [设置和配置](/plugins/sdk-setup) — 打包、Manifest、配置 Schema
- [测试](/plugins/sdk-testing) — 测试工具和 Lint 规则
- [SDK 迁移](/plugins/sdk-migration) — 从已弃用接口迁移
- [插件内部机制](/plugins/architecture) — 深度架构和能力模型
