---
mmh3_hash: "93c3c2ee719cc6392b4a253bcc13e0b4"
title: "Plugin SDK 迁移"
sidebarTitle: "迁移至 SDK"
summary: "从旧版向后兼容层迁移到现代 Plugin SDK"
read_when:
  - 您看到 OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED 警告
  - 您看到 OPENCLAW_EXTENSION_API_DEPRECATED 警告
  - 您正在将 Plugin 更新到现代 Plugin 架构
  - 您维护外部 OpenClaw Plugin
---

# Plugin SDK 迁移

OpenClaw 已从宽泛的向后兼容层迁移到具有专注文档化导入的现代 Plugin 架构。如果您的 Plugin 是在新架构之前构建的，本指南可帮助您迁移。

## 正在改变什么

旧版 Plugin 系统提供了两个开放接口，让 Plugin 可以从单个入口点导入所需的任何内容：

- **`openclaw/plugin-sdk/compat`** — 重新导出数十个辅助工具的单一导入。它被引入是为了在构建新 Plugin 架构期间保持基于 Hook 的旧版 Plugin 正常工作。
- **`openclaw/extension-api`** — 给予 Plugin 直接访问宿主端辅助工具（如嵌入式 Agent 运行器）的桥接层。

这两个接口现在都**已弃用**。它们在运行时仍然可以工作，但新 Plugin 不得使用它们，现有 Plugin 应在下一个主要版本删除它们之前迁移。

<Warning>
  向后兼容层将在未来的主要版本中删除。仍然从这些接口导入的 Plugin 在那时将会失败。
</Warning>

## 为什么改变

旧方法导致了问题：

- **启动缓慢** — 导入一个辅助工具会加载数十个不相关的模块
- **循环依赖** — 宽泛的重新导出使创建导入循环变得容易
- **API 接口不清晰** — 无法判断哪些导出是稳定的，哪些是内部的

现代 Plugin SDK 解决了这个问题：每个导入路径（`openclaw/plugin-sdk/<subpath>`）都是一个小型自包含模块，具有明确目的和文档化契约。

## 如何迁移

<Steps>
  <Step title="查找已弃用的导入">
    在您的 Plugin 中搜索来自任一已弃用接口的导入：

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
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

  <Step title="构建和测试">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## 导入路径参考

<Accordion title="完整导入路径表">
  | 导入路径 | 目的 | 主要导出 |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | 规范 Plugin 入口辅助工具 | `definePluginEntry` |
  | `plugin-sdk/core` | Channel 入口定义、Channel 构建器、基础类型 | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface` |
  | `plugin-sdk/channel-pairing` | DM 配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀 + 输入连接 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 配置模式构建器 | Channel 配置模式类型 |
  | `plugin-sdk/channel-policy` | 群组/DM 策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账户状态跟踪 | `createAccountStatusSink` |
  | `plugin-sdk/channel-runtime` | 运行时连接辅助工具 | Channel 运行时工具 |
  | `plugin-sdk/channel-send-result` | 发送结果类型 | 回复结果类型 |
  | `plugin-sdk/runtime-store` | 持久化 Plugin 存储 | `createPluginRuntimeStore` |
  | `plugin-sdk/allow-from` | 允许列表格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允许列表输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控 | `resolveControlCommandGate` |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助工具 | Webhook 目标工具 |
  | `plugin-sdk/reply-payload` | 消息回复类型 | 回复有效载荷类型 |
  | `plugin-sdk/provider-onboard` | Provider 入门补丁 | 入门配置辅助工具 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/testing` | 测试工具 | 测试辅助工具和模拟 |
</Accordion>

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
