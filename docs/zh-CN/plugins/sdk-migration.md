---
mmh3_hash: "7426089376ea3a8e19e1d43b5cdb29df"
title: Plugin SDK 迁移
sidebarTitle: 迁移到 SDK
summary: 从旧版向后兼容层迁移到现代 Plugin SDK
read_when:
  - 你看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
  - 你看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
  - 你正在将插件更新到现代插件架构
  - 你维护一个外部 OpenClaw 插件
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/sdk-migration.md
  workflow: 15
---

# Plugin SDK 迁移

OpenClaw 已从宽泛的向后兼容层迁移到具有精准、文档化导入的现代插件架构。如果你的插件是在新架构之前构建的，本指南将帮助你完成迁移。

## 变更内容

旧版插件系统提供了两个开放的接口，允许插件从单一入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** — 重新导出了数十个辅助工具的单一导入。它的引入是为了在构建新插件架构期间保持旧版基于 Hook 的插件正常运行。
- **`openclaw/extension-api`** — 一个桥接层，让插件可以直接访问宿主端辅助工具，如嵌入式 Agent 运行器。

两个接口现已**弃用**。它们在运行时仍然可以使用，但新插件不得使用它们，现有插件应在下一个主版本移除它们之前完成迁移。

<Warning>
  向后兼容层将在未来的主版本中移除。仍在使用这些接口的插件届时将会失效。
</Warning>

## 变更原因

旧方案导致了以下问题：

- **启动缓慢** — 导入一个辅助工具会加载数十个不相关的模块
- **循环依赖** — 宽泛的重新导出使得循环导入很容易产生
- **API 接口不清晰** — 无法判断哪些导出是稳定的，哪些是内部的

现代 Plugin SDK 解决了这些问题：每个导入路径（`openclaw/plugin-sdk/<subpath>`）都是一个小型、自包含的模块，有明确的用途和文档化的契约。

## 如何迁移

<Steps>
  <Step title="找到已弃用的导入">
    在插件中搜索来自任一弃用接口的导入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="替换为精准导入">
    旧接口的每个导出都映射到一个具体的现代导入路径：

    ```typescript
    // 之前（已弃用的向后兼容层）
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // 之后（现代精准导入）
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    对于宿主端辅助工具，使用注入的插件运行时，而非直接导入：

    ```typescript
    // 之前（已弃用的 extension-api 桥接层）
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // 之后（注入的运行时）
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    其他旧版桥接辅助工具同理：

    | 旧导入 | 现代等价方式 |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | session store 辅助工具 | `api.runtime.agent.session.*` |

  </Step>

  <Step title="构建并测试">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

<Accordion title="完整导入路径表">
  | 导入路径 | 用途 | 主要导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范插件入口辅助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | Channel 入口定义、Channel 构建器、基础类型 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface` |
  | `plugin-sdk/channel-pairing` | DM Pairing 原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀和输入中接入 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 配置 Schema 构建器 | Channel 配置 Schema 类型 |
  | `plugin-sdk/channel-policy` | 群组/DM 策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账号状态追踪 | `createAccountStatusSink` |
  | `plugin-sdk/channel-runtime` | 运行时接入辅助工具 | Channel 运行时工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化插件存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/approval-runtime` | 审批提示辅助工具 | Exec/插件审批载荷和回复辅助工具 |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助工具 | `formatUncaughtError`，错误图辅助工具 |
  | `plugin-sdk/fetch-runtime` | 封装的 fetch/代理辅助工具 | `resolveFetch`，代理辅助工具 |
  | `plugin-sdk/host-runtime` | 宿主规范化辅助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`, `retryAsync`，策略运行器 |
  | `plugin-sdk/allow-from` | 允许列表格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允许列表输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控 | `resolveControlCommandGate` |
  | `plugin-sdk/secret-input` | 秘密输入解析 | 秘密输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助工具 | Webhook 目标工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 请求体守卫辅助工具 | 请求体读取/限制辅助工具 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复载荷类型 |
  | `plugin-sdk/provider-onboard` | Provider 引导补丁 | 引导配置辅助工具 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/testing` | 测试工具 | 测试辅助工具和模拟对象 |
</Accordion>

使用最窄的导入路径。如果找不到某个导出，可查看 `src/plugin-sdk/` 的源码或在 Discord 中提问。

## 移除时间线

| 时间         | 发生的事情                                                         |
| ------------ | ------------------------------------------------------------------ |
| **现在**     | 已弃用接口发出运行时警告                                           |
| **下一主版本** | 已弃用接口将被移除；仍在使用它们的插件将失效                       |

所有核心插件已完成迁移。外部插件应在下一主版本之前迁移。

## 临时屏蔽警告

在迁移工作期间，可以设置以下环境变量屏蔽警告：

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

这是临时的应急出口，不是永久解决方案。

## 相关文档

- [入门指南](/plugins/building-plugins) — 构建你的第一个插件
- [SDK Overview](/plugins/sdk-overview) — 完整子路径导入参考
- [Channel 插件](/plugins/sdk-channel-plugins) — 构建 Channel 插件
- [Provider 插件](/plugins/sdk-provider-plugins) — 构建 Provider 插件
- [插件内部机制](/plugins/architecture) — 架构深度解析
- [Plugin Manifest](/plugins/manifest) — Manifest Schema 参考
