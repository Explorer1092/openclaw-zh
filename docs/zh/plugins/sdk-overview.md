---
mmh3_hash: "f032b6136ecf16442f7bd7318db7b1c4"
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
  - 第一个 Plugin？从 [入门指南](/plugins/building-plugins) 开始
  - Channel Plugin？参见 [Channel Plugin](/plugins/sdk-channel-plugins)
  - Provider Plugin？参见 [Provider Plugin](/plugins/sdk-provider-plugins)
</Tip>

## 导入规范

始终从特定子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";

// 已弃用 — 将在下一个主要版本中删除
import { definePluginEntry } from "openclaw/plugin-sdk";
```

每个子路径都是一个小型自包含模块。这保持了启动速度并防止循环依赖问题。

## 子路径参考

按用途分组的最常用子路径。完整的 100+ 子路径列表在 `scripts/lib/plugin-sdk-entrypoints.json` 中。

### Plugin 入口

| 子路径                    | 主要导出                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `plugin-sdk/plugin-entry` | `definePluginEntry`                                                                                                                                    |
| `plugin-sdk/core`         | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`                 |

<AccordionGroup>
  <Accordion title="Channel 子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface` |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel 配置模式类型 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/channel-inbound` | 防抖、提及匹配、信封辅助工具 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | `createMessageToolButtonsSchema`, `createMessageToolCardSchema` |
    | `plugin-sdk/channel-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/channel-contract` | Channel 契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/反应连接 |
  </Accordion>

  <Accordion title="Provider 子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-models` | `normalizeModelCompat` |
    | `plugin-sdk/provider-catalog` | 目录类型重新导出 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 等 |
    | `plugin-sdk/provider-stream` | 流包装类型 |
    | `plugin-sdk/provider-onboard` | 入门配置补丁辅助工具 |
  </Accordion>

  <Accordion title="身份验证和安全子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate` |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/secret-input` | 密钥输入解析辅助工具 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助工具 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/config-runtime` | 配置加载/写入辅助工具 |
    | `plugin-sdk/infra-runtime` | 系统事件/心跳辅助工具 |
    | `plugin-sdk/agent-runtime` | Agent 目录/身份/工作区辅助工具 |
    | `plugin-sdk/directory-runtime` | 配置支持的目录查询/去重 |
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

`register(api)` 回调接收具有以下方法的 `OpenClawPluginApi` 对象：

### 能力注册

| 方法                                          | 注册内容                    |
| --------------------------------------------- | --------------------------- |
| `api.registerProvider(...)`                   | 文本推理 (LLM)              |
| `api.registerChannel(...)`                    | 消息 Channel                |
| `api.registerSpeechProvider(...)`             | 文字转语音 / STT 合成       |
| `api.registerMediaUnderstandingProvider(...)` | 图像/音频/视频分析          |
| `api.registerImageGenerationProvider(...)`    | 图像生成                    |
| `api.registerWebSearchProvider(...)`          | Web 搜索                    |

### Tool 和命令

| 方法                            | 注册内容                                       |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent Tool（必需或 `{ optional: true }`）      |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                         |

### 基础设施

| 方法                                           | 注册内容              |
| ---------------------------------------------- | --------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件 Hook             |
| `api.registerHttpRoute(params)`                | Gateway HTTP 端点     |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 方法      |
| `api.registerCli(registrar, opts?)`            | CLI 子命令            |
| `api.registerService(service)`                 | 后台服务              |
| `api.registerInteractiveHandler(registration)` | 交互式处理程序        |

### 专有槽

| 方法                                       | 注册内容                        |
| ------------------------------------------ | ------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次一个活跃）      |
| `api.registerMemoryPromptSection(builder)` | 内存 Prompt 部分构建器          |

### API 对象字段

| 字段                     | 类型                      | 描述                                                          |
| ------------------------ | ------------------------- | ------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                     |
| `api.name`               | `string`                  | 显示名称                                                      |
| `api.version`            | `string?`                 | Plugin 版本（可选）                                           |
| `api.description`        | `string?`                 | Plugin 描述（可选）                                           |
| `api.source`             | `string`                  | Plugin 来源路径                                               |
| `api.rootDir`            | `string?`                 | Plugin 根目录（可选）                                         |
| `api.config`             | `OpenClawConfig`          | 当前配置快照                                                  |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的 Plugin 特定配置         |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助工具](/plugins/sdk-runtime)                        |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`、`info`、`warn`、`error`）          |
| `api.registrationMode`   | `PluginRegistrationMode`  | `"full"`、`"setup-only"` 或 `"setup-runtime"`                 |
| `api.resolvePath(input)` | `(string) => string`      | 相对于 Plugin 根目录解析路径                                  |

## 内部模块规范

在您的 Plugin 中，使用本地 barrel 文件进行内部导入：

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

## 相关

- [入口点](/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry` 选项
- [运行时辅助工具](/plugins/sdk-runtime) — 完整 `api.runtime` 命名空间参考
- [设置和配置](/plugins/sdk-setup) — 打包、清单、配置模式
- [测试](/plugins/sdk-testing) — 测试工具和 lint 规则
- [SDK 迁移](/plugins/sdk-migration) — 从已弃用接口迁移
- [Plugin 内部架构](/plugins/architecture) — 深度架构和能力模型
