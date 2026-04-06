---
mmh3_hash: "bdea0df0cc88a580d49465e2ed808cc5"
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

捆绑 Channel 的旧版 Provider 便利接缝也已移除。`openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp`、Channel 品牌辅助工具接缝以及 `openclaw/plugin-sdk/telegram-core` 等导入是私有 mono-repo 快捷方式，而非稳定的 Plugin 契约。请改用窄向通用 SDK 子路径。在捆绑 Plugin 工作区内，将 Provider 自有的辅助工具保留在该 Plugin 自己的 `api.ts` 或 `runtime-api.ts` 中。

当前捆绑 Provider 示例：

- Anthropic 在其自己的 `api.ts` / `contract-api.ts` 接缝中保留 Claude 特定的流辅助工具
- OpenAI 在其自己的 `api.ts` 中保留 Provider 构建器、默认模型辅助工具和实时 Provider 构建器
- OpenRouter 在其自己的 `api.ts` 中保留 Provider 构建器以及入门/配置辅助工具

## 如何迁移

<Steps>
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
  | `plugin-sdk/setup-adapter-runtime` | 设置适配器辅助工具 | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | 设置工具辅助工具 | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | 多账户辅助工具 | 账户列表/配置/操作门控辅助工具 |
  | `plugin-sdk/account-id` | 账户 ID 辅助工具 | `DEFAULT_ACCOUNT_ID`、账户 ID 规范化 |
  | `plugin-sdk/account-resolution` | 账户查找辅助工具 | 账户查找 + 默认回退辅助工具 |
  | `plugin-sdk/account-helpers` | 窄向账户辅助工具 | 账户列表/账户操作辅助工具 |
  | `plugin-sdk/channel-setup` | 设置向导适配器 | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | DM 配对原语 | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | 回复前缀 + 输入连接 | `createChannelReplyPipeline` |
  | `plugin-sdk/channel-config-helpers` | 配置适配器工厂 | `createHybridChannelConfigAdapter` |
  | `plugin-sdk/channel-config-schema` | 配置 Schema 构建器 | Channel 配置 Schema 类型 |
  | `plugin-sdk/telegram-command-config` | Telegram 命令配置辅助工具 | 命令名称规范化、描述截断、重复/冲突验证 |
  | `plugin-sdk/channel-policy` | 群组/DM 策略解析 | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | 账户状态跟踪 | `createAccountStatusSink` |
  | `plugin-sdk/inbound-envelope` | 入站信封辅助工具 | 共享路由 + 信封构建器辅助工具 |
  | `plugin-sdk/inbound-reply-dispatch` | 入站回复辅助工具 | 共享记录和调度辅助工具 |
  | `plugin-sdk/messaging-targets` | 消息目标解析 | 目标解析/匹配辅助工具 |
  | `plugin-sdk/outbound-media` | 出站媒体辅助工具 | 共享出站媒体加载 |
  | `plugin-sdk/outbound-runtime` | 出站运行时辅助工具 | 出站身份/发送委托辅助工具 |
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
  | `plugin-sdk/gateway-runtime` | Gateway 辅助工具 | Gateway 客户端和 Channel 状态补丁辅助工具 |
  | `plugin-sdk/config-runtime` | 配置辅助工具 | 配置加载/写入辅助工具 |
  | `plugin-sdk/approval-runtime` | 批准提示辅助工具 | Exec/Plugin 批准有效载荷、批准能力/配置文件辅助工具、原生批准路由/运行时辅助工具 |
  | `plugin-sdk/approval-auth-runtime` | 批准认证辅助工具 | 批准者解析、同聊天操作认证 |
  | `plugin-sdk/approval-client-runtime` | 批准客户端辅助工具 | 原生 Exec 批准配置文件/过滤器辅助工具 |
  | `plugin-sdk/approval-delivery-runtime` | 批准交付辅助工具 | 原生批准能力/交付适配器 |
  | `plugin-sdk/approval-native-runtime` | 批准目标辅助工具 | 原生批准目标/账户绑定辅助工具 |
  | `plugin-sdk/approval-reply-runtime` | 批准回复辅助工具 | Exec/Plugin 批准回复有效载荷辅助工具 |
  | `plugin-sdk/security-runtime` | 安全辅助工具 | 共享信任、DM 门控、外部内容和密钥收集辅助工具 |
  | `plugin-sdk/ssrf-policy` | SSRF 策略辅助工具 | 主机允许列表和私有网络策略辅助工具 |
  | `plugin-sdk/ssrf-runtime` | SSRF 运行时辅助工具 | 固定调度器、守卫获取、SSRF 策略辅助工具 |
  | `plugin-sdk/collection-runtime` | 有界缓存辅助工具 | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | 诊断门控辅助工具 | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | 错误格式化辅助工具 | `formatUncaughtError`, `isApprovalNotFoundError`、错误图辅助工具 |
  | `plugin-sdk/fetch-runtime` | 包装的 Fetch/代理辅助工具 | `resolveFetch`、代理辅助工具 |
  | `plugin-sdk/host-runtime` | 主机规范化辅助工具 | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | 重试辅助工具 | `RetryConfig`, `retryAsync`、策略运行器 |
  | `plugin-sdk/allow-from` | 允许列表格式化 | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | 允许列表输入映射 | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | 命令门控和命令界面辅助工具 | `resolveControlCommandGate`、发送者授权辅助工具、命令注册表辅助工具 |
  | `plugin-sdk/secret-input` | 密钥输入解析 | 密钥输入辅助工具 |
  | `plugin-sdk/webhook-ingress` | Webhook 请求辅助工具 | Webhook 目标工具 |
  | `plugin-sdk/webhook-request-guards` | Webhook 正文守卫辅助工具 | 请求正文读取/限制辅助工具 |
  | `plugin-sdk/reply-runtime` | 共享回复运行时 | 入站调度、心跳、回复规划器、分块 |
  | `plugin-sdk/reply-dispatch-runtime` | 窄向回复调度辅助工具 | 最终化 + Provider 调度辅助工具 |
  | `plugin-sdk/reply-history` | 回复历史辅助工具 | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | 回复引用规划 | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | 回复分块辅助工具 | 出站文本分块辅助工具 |
  | `plugin-sdk/session-store-runtime` | Session 存储辅助工具 | 存储路径 + 更新时间辅助工具 |
  | `plugin-sdk/state-paths` | 状态路径辅助工具 | 状态和 OAuth 目录辅助工具 |
  | `plugin-sdk/routing` | 路由/Session 键辅助工具 | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`、Session 键规范化辅助工具 |
  | `plugin-sdk/status-helpers` | Channel 状态辅助工具 | Channel/账户状态摘要构建器、运行时状态默认值、问题元数据辅助工具 |
  | `plugin-sdk/target-resolver-runtime` | 目标解析器辅助工具 | 共享目标解析器辅助工具 |
  | `plugin-sdk/string-normalization-runtime` | 字符串规范化辅助工具 | 短标识符/字符串规范化辅助工具 |
  | `plugin-sdk/request-url` | 请求 URL 辅助工具 | 从类请求输入中提取字符串 URL |
  | `plugin-sdk/run-command` | 定时命令辅助工具 | 带规范化 stdout/stderr 的定时命令运行器 |
  | `plugin-sdk/param-readers` | 参数读取器 | 常用 Tool/CLI 参数读取器 |
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
  | `plugin-sdk/provider-env-vars` | Provider 环境变量辅助工具 | Provider 认证环境变量查找辅助工具 |
  | `plugin-sdk/provider-model-shared` | 共享 Provider 模型/重播辅助工具 | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`、共享重播策略构建器、Provider 端点辅助工具和模型 ID 规范化辅助工具 |
  | `plugin-sdk/provider-catalog-shared` | 共享 Provider 目录辅助工具 | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Provider 入门补丁 | 入门配置辅助工具 |
  | `plugin-sdk/provider-http` | Provider HTTP 辅助工具 | 通用 Provider HTTP/端点能力辅助工具 |
  | `plugin-sdk/provider-web-fetch` | Provider Web 抓取辅助工具 | Web 抓取 Provider 注册/缓存辅助工具 |
  | `plugin-sdk/provider-web-search` | Provider Web 搜索辅助工具 | Web 搜索 Provider 注册/缓存/配置辅助工具 |
  | `plugin-sdk/provider-tools` | Provider Tool/Schema 兼容辅助工具 | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`、Gemini Schema 清理 + 诊断，以及 xAI 兼容辅助工具（如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat`） |
  | `plugin-sdk/provider-usage` | Provider 使用辅助工具 | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` 及其他 Provider 使用辅助工具 |
  | `plugin-sdk/provider-stream` | Provider 流包装辅助工具 | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`、流包装类型，以及共享的 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装辅助工具 |
  | `plugin-sdk/keyed-async-queue` | 有序异步队列 | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | 共享媒体辅助工具 | 媒体获取/变换/存储辅助工具以及媒体有效载荷构建器 |
  | `plugin-sdk/media-generation-runtime` | 共享媒体生成辅助工具 | 共享故障转移辅助工具、候选选择以及图像/视频/音乐生成的缺失模型消息 |
  | `plugin-sdk/media-understanding` | 媒体理解辅助工具 | 媒体理解 Provider 类型以及面向 Provider 的图像/音频辅助工具导出 |
  | `plugin-sdk/text-runtime` | 共享文本辅助工具 | Assistant 可见文本提取、Markdown 渲染/分块/表格辅助工具、编辑辅助工具、指令标签辅助工具、安全文本工具及相关文本/日志辅助工具 |
  | `plugin-sdk/text-chunking` | 文本分块辅助工具 | 出站文本分块辅助工具 |
  | `plugin-sdk/speech` | 语音辅助工具 | 语音 Provider 类型以及面向 Provider 的指令、注册表和验证辅助工具 |
  | `plugin-sdk/speech-core` | 共享语音核心 | 语音 Provider 类型、注册表、指令、规范化 |
  | `plugin-sdk/realtime-transcription` | 实时转录辅助工具 | Provider 类型和注册表辅助工具 |
  | `plugin-sdk/realtime-voice` | 实时语音辅助工具 | Provider 类型和注册表辅助工具 |
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
  | `plugin-sdk/webhook-path` | Webhook 路径辅助工具 | Webhook 路径规范化辅助工具 |
  | `plugin-sdk/web-media` | 共享 Web 媒体辅助工具 | 远程/本地媒体加载辅助工具 |
  | `plugin-sdk/zod` | Zod 重导出 | 为 Plugin SDK 消费者重导出的 `zod` |
  | `plugin-sdk/memory-core` | 捆绑的 memory-core 辅助工具 | 内存管理器/配置/文件/CLI 辅助工具界面 |
  | `plugin-sdk/memory-core-engine-runtime` | 内存引擎运行时外观 | 内存索引/搜索运行时外观 |
  | `plugin-sdk/memory-core-host-engine-foundation` | 内存宿主基础引擎 | 内存宿主基础引擎导出 |
  | `plugin-sdk/memory-core-host-engine-embeddings` | 内存宿主嵌入引擎 | 内存宿主嵌入引擎导出 |
  | `plugin-sdk/memory-core-host-engine-qmd` | 内存宿主 QMD 引擎 | 内存宿主 QMD 引擎导出 |
  | `plugin-sdk/memory-core-host-engine-storage` | 内存宿主存储引擎 | 内存宿主存储引擎导出 |
  | `plugin-sdk/memory-core-host-multimodal` | 内存宿主多模态辅助工具 | 内存宿主多模态辅助工具 |
  | `plugin-sdk/memory-core-host-query` | 内存宿主查询辅助工具 | 内存宿主查询辅助工具 |
  | `plugin-sdk/memory-core-host-secret` | 内存宿主密钥辅助工具 | 内存宿主密钥辅助工具 |
  | `plugin-sdk/memory-core-host-events` | 内存宿主事件日志辅助工具 | 内存宿主事件日志辅助工具 |
  | `plugin-sdk/memory-core-host-status` | 内存宿主状态辅助工具 | 内存宿主状态辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-cli` | 内存宿主 CLI 运行时 | 内存宿主 CLI 运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-core` | 内存宿主核心运行时 | 内存宿主核心运行时辅助工具 |
  | `plugin-sdk/memory-core-host-runtime-files` | 内存宿主文件/运行时辅助工具 | 内存宿主文件/运行时辅助工具 |
  | `plugin-sdk/memory-host-core` | 内存宿主核心运行时别名 | 内存宿主核心运行时辅助工具的厂商中性别名 |
  | `plugin-sdk/memory-host-events` | 内存宿主事件日志别名 | 内存宿主事件日志辅助工具的厂商中性别名 |
  | `plugin-sdk/memory-host-files` | 内存宿主文件/运行时别名 | 内存宿主文件/运行时辅助工具的厂商中性别名 |
  | `plugin-sdk/memory-host-markdown` | 托管 Markdown 辅助工具 | 内存相邻 Plugin 的共享托管 Markdown 辅助工具 |
  | `plugin-sdk/memory-host-search` | 活跃内存搜索外观 | 懒加载的活跃内存搜索管理器运行时外观 |
  | `plugin-sdk/memory-host-status` | 内存宿主状态别名 | 内存宿主状态辅助工具的厂商中性别名 |
  | `plugin-sdk/memory-lancedb` | 捆绑的 memory-lancedb 辅助工具 | Memory-lancedb 辅助工具界面 |
  | `plugin-sdk/testing` | 测试工具 | 测试辅助工具和模拟 |
</Accordion>

此表格是常用迁移子集，而非完整的 SDK 界面。完整的 200+ 入口点列表位于 `scripts/lib/plugin-sdk-entrypoints.json`。

该列表仍然包括一些捆绑 Plugin 辅助工具接缝，如 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 和 `plugin-sdk/matrix*`。这些仍然为捆绑 Plugin 维护和兼容性而导出，但它们有意从常用迁移表中省略，不是新 Plugin 代码的推荐目标。

同样的规则适用于其他捆绑辅助工具家族，如：

- 浏览器支持辅助工具：`plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support`
- Matrix：`plugin-sdk/matrix*`
- LINE：`plugin-sdk/line*`
- IRC：`plugin-sdk/irc*`
- 捆绑辅助工具/Plugin 界面：`plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles*`, `plugin-sdk/mattermost*`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch`, `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership` 和 `plugin-sdk/voice-call`

`plugin-sdk/github-copilot-token` 目前暴露了窄向 Token 辅助工具界面：`DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken`。

使用最窄的导入来匹配工作。如果找不到导出，请查看 `src/plugin-sdk/` 中的源代码或在 Discord 中提问。

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
