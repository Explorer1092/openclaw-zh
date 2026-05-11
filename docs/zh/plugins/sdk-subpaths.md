---
mmh3_hash: "b770c483ff4ecb44eed16ca4705e9c4e"
summary: "Plugin SDK 子路径目录：哪些导入在哪里，按区域分组"
read_when:
  - 为 Plugin 导入选择正确的 plugin-sdk 子路径
  - 审计 Bundle Plugin 子路径和助手界面
title: "Plugin SDK 子路径"
---

Plugin SDK 以 `openclaw/plugin-sdk/` 下的一组窄子路径形式公开。本页按目的对常用子路径进行目录分类。生成的编译器入口点清单存在于 `scripts/lib/plugin-sdk-entrypoints.json`；在减去 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的仓库本地测试/内部子路径后，包导出是公开子集。维护人员可以使用 `pnpm plugin-sdk:surface` 审计公开导出数量，使用 `pnpm plugins:boundary-report:summary` 审计活跃保留助手子路径；未使用的保留助手导出在 CI 报告中失败，而不是作为休眠兼容性债务保留在公开 SDK 中。

有关 Plugin 编写指南，请参见 [Plugin SDK 概览](/plugins/sdk-overview)。

## Plugin 入口

| 子路径 | 关键导出 |
| --- | --- |
| `plugin-sdk/plugin-entry` | `definePluginEntry` |
| `plugin-sdk/core` | `defineChannelPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`defineSetupPluginEntry`、`buildChannelConfigSchema`、`buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema` |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
| `plugin-sdk/migration` | 迁移 Provider 项目助手，如 `createMigrationItem`、原因常量、项目状态标记、编辑助手和 `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | 运行时迁移助手，如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime` 和 `writeMigrationReport` |

### 已弃用的兼容性和测试助手

这些子路径对旧版 Plugin 和 OpenClaw 测试套件仍然是包导出，但新代码不应从它们添加导入：`agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-test-api`、`plugin-test-contracts`、`provider-http-test-mocks`、`provider-test-contracts`、`test-env`、`test-fixtures`、`test-node-mocks`、`testing`、`channel-runtime`、`compat`、`config-types`、`infra-runtime`、`text-runtime` 和 `zod`。在新 Plugin 代码中直接从 `zod` 导入。`plugin-test-runtime` 仍然是活跃的聚焦测试助手子路径。

### 已弃用的未使用公开子路径

这些公开子路径存在至少一个月，目前没有捆绑扩展生产导入。它们对于兼容性仍然可以导入，但新 Plugin 代码应使用聚焦的、被积极消费的 SDK 子路径：`agent-config-primitives`、`channel-config-schema-legacy`、`channel-reply-pipeline`、`channel-runtime`、`channel-secret-runtime`、`command-auth`、`compat`、`config-runtime`、`config-schema`、`discord`、`group-access`、`infra-runtime`、`matrix`、`mattermost`、`media-generation-runtime-shared`、`memory-core-engine-runtime`、`memory-core-host-multimodal`、`memory-core-host-query`、`music-generation-core`、`self-hosted-provider-setup`、`telegram-account`、`telegram-command-config` 和 `zalouser`。

### 已弃用的稀少使用公开子路径

目前仅由一两个捆绑 Plugin 所有者使用的公开子路径对于新 Plugin 代码也已弃用。它们对于兼容性仍然是包导出，但新代码应优先使用被积极共享的 SDK 接缝或 Plugin 自有的包 API。维护人员在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中跟踪确切集合，并使用 `pnpm plugin-sdk:surface` 跟踪当前预算。

### 已弃用的宽泛桶

这些宽泛的重新导出桶对于 OpenClaw 源代码和兼容性检查仍然可构建，但新代码应优先使用聚焦的 SDK 子路径：`agent-runtime`、`channel-lifecycle`、`channel-runtime`、`cli-runtime`、`compat`、`config-types`、`conversation-runtime`、`hook-runtime`、`infra-runtime`、`media-runtime`、`plugin-runtime`、`security-runtime` 和 `text-runtime`。`channel-runtime`、`compat`、`config-types`、`infra-runtime` 和 `text-runtime` 仅为向后兼容而保留为包导出；请使用聚焦的 Channel/运行时子路径、`config-contracts`、`string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core` 代替。

<AccordionGroup>
  <Accordion title="Channel 子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod Schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/json-schema-runtime` | Plugin 自有 Schema 的缓存 JSON Schema 验证助手 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，加上 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导助手、允许列表提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已弃用兼容性别名；使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账户配置/操作门控助手、默认账户回退助手 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账户 id 规范化助手 |
    | `plugin-sdk/account-resolution` | 账户查找 + 默认回退助手 |
    | `plugin-sdk/account-helpers` | 窄账户列表/账户操作助手 |
    | `plugin-sdk/access-groups` | 访问组允许列表解析和已编辑组诊断助手 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 旧版回复管道助手。新 Channel 回复管道代码应使用来自 `plugin-sdk/channel-message` 的 `createChannelMessageReplyPipeline` 和 `resolveChannelMessageSourceReplyDeliveryMode`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`、`resolveChannelDmAccess`、`resolveChannelDmAllowFrom`、`resolveChannelDmPolicy`、`normalizeChannelDmPolicy`、`normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共享 Channel 配置 Schema 原语加上 Zod 和直接 JSON/TypeBox 构建器 |
    | `plugin-sdk/bundled-channel-config-schema` | 仅用于维护的捆绑 Plugin 的 Bundle OpenClaw Channel 配置 Schema |
    | `plugin-sdk/channel-config-schema-legacy` | 捆绑 Channel 配置 Schema 的已弃用兼容性别名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自定义命令规范化/验证助手，带有捆绑契约回退 |
    | `plugin-sdk/command-gating` | 窄命令授权门控助手 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 已弃用的低级 Channel 入站兼容性外观。新接收路径应使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 实验性的高级 Channel 入站运行时解析器和路由事实构建器，用于迁移的 Channel 接收路径。优先使用此选项而非在每个 Plugin 中组装有效允许列表、命令允许列表和旧版投影。请参见[Channel 入站 API](/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、`createChannelRunQueue` 和旧版草稿流生命周期助手。新预览最终确定代码应使用 `plugin-sdk/channel-message`。 |
    | `plugin-sdk/channel-message` | 廉价消息生命周期契约助手，如 `defineChannelMessageAdapter`、`createChannelMessageAdapterFromOutbound`、`createChannelMessageReplyPipeline`、`createReplyPrefixContext`、`resolveChannelMessageSourceReplyDeliveryMode`、持久最终能力派生、发送/接收/副作用能力的能力证明助手、`MessageReceiveContext`、接收确认策略证明、`defineFinalizableLivePreviewAdapter`、`deliverWithFinalizableLivePreviewAdapter`、实时预览和实时最终确定器能力证明、持久恢复状态、`RenderedMessageBatch`、消息接收类型和接收 id 助手。请参见[Channel 消息 API](/plugins/sdk-channel-message)。旧版回复调度外观仅用于已弃用的兼容性。 |
    | `plugin-sdk/channel-message-runtime` | 可能加载出站交付的运行时交付助手，包括 `deliverInboundReplyWithMessageSendContext`、`sendDurableMessageBatch` 和 `withDurableMessageSendContext`。已弃用的回复调度桥接仅对兼容调度器保持可导入。从监控/发送运行时模块使用，而不是热 Plugin 启动文件。 |
    | `plugin-sdk/inbound-envelope` | 共享入站路由 + 包络构建器助手 |
    | `plugin-sdk/inbound-reply-dispatch` | 旧版共享入站记录和调度助手、可见/最终调度谓词，以及用于已准备好的 Channel 调度器的已弃用 `deliverDurableInboundReplyPayload` 兼容性。新 Channel 接收/调度代码应从 `plugin-sdk/channel-message-runtime` 导入运行时生命周期助手。 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配助手 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载助手 |
    | `plugin-sdk/outbound-send-deps` | Channel 适配器的轻量级出站发送依赖项查找 |
    | `plugin-sdk/outbound-runtime` | 出站身份、发送委托、Session、格式化和有效负载规划助手。直接交付助手如 `deliverOutboundPayloads` 是已弃用的兼容性基底；对于新发送路径使用 `plugin-sdk/channel-message-runtime`。 |
    | `plugin-sdk/poll-runtime` | 窄轮询规范化助手 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器助手 |
    | `plugin-sdk/agent-media-payload` | 旧版 Agent 媒体有效负载构建器 |
    | `plugin-sdk/conversation-runtime` | 对话/线程绑定、配对和已配置绑定助手 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照助手 |
    | `plugin-sdk/runtime-group-policy` | 运行时群组策略解析助手 |
    | `plugin-sdk/channel-status` | 共享 Channel 状态快照/摘要助手 |
    | `plugin-sdk/channel-config-primitives` | 窄 Channel 配置 Schema 原语 |
    | `plugin-sdk/channel-config-writes` | Channel 配置写入授权助手 |
    | `plugin-sdk/channel-plugin-common` | 共享 Channel Plugin 前置导出 |
    | `plugin-sdk/allowlist-config-edit` | 允许列表配置编辑/读取助手 |
    | `plugin-sdk/group-access` | 共享群组访问决策助手 |
    | `plugin-sdk/direct-dm` | 共享直接 DM 身份验证/防护助手 |
    | `plugin-sdk/discord` | 用于已发布的 `@openclaw/discord@2026.3.13` 和跟踪所有者兼容性的已弃用 Discord 兼容性外观；新 Plugin 应使用通用 Channel SDK 子路径 |
    | `plugin-sdk/telegram-account` | 用于跟踪所有者兼容性的已弃用 Telegram 账户解析兼容性外观；新 Plugin 应使用注入的运行时助手或通用 Channel SDK 子路径 |
    | `plugin-sdk/zalouser` | 用于仍导入发送者命令授权的已发布 Lark/Zalo 包的已弃用 Zalo Personal 兼容性外观；新 Plugin 应使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 语义消息呈现、交付和旧版交互式回复助手。请参见[消息呈现](/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 入站防抖、提及匹配、提及策略助手和包络助手的兼容性桶 |
    | `plugin-sdk/channel-inbound-debounce` | 窄入站防抖助手 |
    | `plugin-sdk/channel-mention-gating` | 不带更广泛入站运行时界面的窄提及策略、提及标记和提及文本助手 |
    | `plugin-sdk/channel-envelope` | 窄入站包络格式化助手 |
    | `plugin-sdk/channel-location` | Channel 位置上下文和格式化助手 |
    | `plugin-sdk/channel-logging` | 入站丢弃和打字/确认失败的 Channel 日志助手 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | Channel 消息操作助手，加上为 Plugin 兼容性保留的已弃用原生 Schema 助手 |
    | `plugin-sdk/channel-route` | 共享路由规范化、解析器驱动的目标解析、线程 id 字符串化、去重/紧凑路由键、已解析目标类型和路由/目标比较助手 |
    | `plugin-sdk/channel-targets` | 目标解析助手；路由比较调用者应使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Channel 契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/反应接线 |
    | `plugin-sdk/channel-secret-runtime` | 窄密钥契约助手，如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment` 和密钥目标类型 |
  </Accordion>

  <Accordion title="Provider 子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支持的 LM Studio Provider 外观，用于设置、目录发现和运行时模型准备 |
    | `plugin-sdk/lmstudio-runtime` | 支持的 LM Studio 运行时外观，用于本地服务器默认值、模型发现、请求标头和已加载模型助手 |
    | `plugin-sdk/provider-setup` | 精心策划的本地/自托管 Provider 设置助手 |
    | `plugin-sdk/self-hosted-provider-setup` | 面向 OpenAI 兼容的自托管 Provider 设置助手 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + 看门狗常量 |
    | `plugin-sdk/provider-auth-runtime` | Provider Plugin 的运行时 API 密钥解析助手 |
    | `plugin-sdk/provider-auth-api-key` | API 密钥引导/配置写入助手，如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 身份验证结果构建器 |
    | `plugin-sdk/provider-env-vars` | Provider 身份验证环境变量查找助手 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials`、已弃用的 `resolveOpenClawAgentDir` 兼容性导出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、Provider 端点助手和共享模型 id 规范化助手 |
    | `plugin-sdk/provider-catalog-runtime` | Provider 目录扩充运行时 Hook 和 Plugin-Provider 注册表接缝，用于契约测试 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`buildManifestModelProviderConfig`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用 Provider HTTP/端点能力助手、Provider HTTP 错误和音频转录多部分表单助手 |
    | `plugin-sdk/provider-web-fetch-contract` | 窄网络获取配置/选择契约助手，如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 网络获取 Provider 注册/缓存助手 |
    | `plugin-sdk/provider-web-search-config-contract` | 不需要 Plugin 启用接线的 Provider 的窄网络搜索配置/凭据助手 |
    | `plugin-sdk/provider-web-search-contract` | 窄网络搜索配置/凭据契约助手，如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 和范围凭据设置器/获取器 |
    | `plugin-sdk/provider-web-search` | 网络搜索 Provider 注册/缓存/运行时助手 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`，以及 Gemini Schema 清理 + 诊断 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 及类似助手 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`、`buildProviderStreamFamilyHooks`、`composeProviderStreamWrappers`、流包装器类型和共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器助手 |
    | `plugin-sdk/provider-transport-runtime` | 原生 Provider 传输助手，如有防护的获取、传输消息转换和可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 引导配置补丁助手 |
    | `plugin-sdk/global-singleton` | 进程本地单例/映射/缓存助手 |
    | `plugin-sdk/group-activation` | 窄群组激活模式和命令解析助手 |
  </Accordion>

  <Accordion title="身份验证和安全子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`、命令注册表助手，包括动态参数菜单格式化、发送者授权助手 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批者解析和同一聊天操作身份验证助手 |
    | `plugin-sdk/approval-client-runtime` | 原生执行审批配置文件/过滤器助手 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/交付适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 解析助手 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 热 Channel 入口点的轻量级原生审批适配器加载助手 |
    | `plugin-sdk/approval-handler-runtime` | 更广泛的审批处理程序运行时助手；当窄适配器/Gateway 接缝足够时优先使用它们 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标 + 账户绑定助手 |
    | `plugin-sdk/approval-reply-runtime` | 执行/Plugin 审批回复有效负载助手 |
    | `plugin-sdk/approval-runtime` | 执行/Plugin 审批有效负载助手、原生审批路由/运行时助手和结构化审批显示助手，如 `formatApprovalDisplayPath` |
    | `plugin-sdk/reply-dedupe` | 窄入站回复去重重置助手 |
    | `plugin-sdk/channel-contract-testing` | 不带广泛测试桶的窄 Channel 契约测试助手 |
    | `plugin-sdk/command-auth-native` | 原生命令身份验证、动态参数菜单格式化和原生 Session 目标助手 |
    | `plugin-sdk/command-detection` | 共享命令检测助手 |
    | `plugin-sdk/command-primitives-runtime` | 热 Channel 路径的轻量级命令文本谓词 |
    | `plugin-sdk/command-surface` | 命令正文规范化和命令界面助手 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | Channel/Plugin 密钥界面的窄密钥契约收集助手 |
    | `plugin-sdk/secret-ref-runtime` | 密钥契约/配置解析的窄 `coerceSecretRef` 和 SecretRef 类型助手 |
    | `plugin-sdk/security-runtime` | 共享信任、DM 门控、根绑定文件/路径助手，包括仅创建写入、同步/异步原子文件替换、兄弟临时写入、跨设备移动回退、私有文件存储助手、符号链接父防护、外部内容、敏感文本编辑、常量时间密钥比较和密钥收集助手 |
    | `plugin-sdk/ssrf-policy` | 主机允许列表和私有网络 SSRF 策略助手 |
    | `plugin-sdk/ssrf-dispatcher` | 不带广泛基础设施运行时界面的窄固定调度器助手 |
    | `plugin-sdk/ssrf-runtime` | 固定调度器、有 SSRF 防护的获取、SSRF 错误和 SSRF 策略助手 |
    | `plugin-sdk/secret-input` | 密钥输入解析助手 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标助手和原始 WebSocket/正文强制转换 |
    | `plugin-sdk/webhook-request-guards` | 请求正文大小/超时助手 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 广泛的运行时/日志/备份/Plugin 安装助手 |
    | `plugin-sdk/runtime-env` | 窄运行时环境、日志记录器、超时、重试和退避助手 |
    | `plugin-sdk/browser-config` | 支持的浏览器配置外观，用于规范化的配置文件/默认值、CDP URL 解析和浏览器控制身份验证助手 |
    | `plugin-sdk/channel-runtime-context` | 通用 Channel 运行时上下文注册和查找助手 |
    | `plugin-sdk/matrix` | 用于旧版第三方 Channel 包的已弃用 Matrix 兼容性外观；新 Plugin 应直接导入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 用于旧版第三方 Channel 包的已弃用 Mattermost 兼容性外观；新 Plugin 应直接导入通用 SDK 子路径 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享 Plugin 命令/Hook/HTTP/交互助手 |
    | `plugin-sdk/hook-runtime` | 共享 Webhook/内部 Hook 管道助手 |
    | `plugin-sdk/lazy-runtime` | 懒加载运行时导入/绑定助手，如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程执行助手 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、参数调用和懒加载命令组助手 |
    | `plugin-sdk/gateway-runtime` | Gateway 客户端、事件循环就绪客户端启动助手、Gateway CLI RPC、Gateway 协议错误和 Channel 状态补丁助手 |
    | `plugin-sdk/config-contracts` | Plugin 配置形状的聚焦仅类型配置界面，如 `OpenClawConfig` 和 Channel/Provider 配置类型 |
    | `plugin-sdk/plugin-config-runtime` | 运行时 Plugin 配置查找助手，如 `requireRuntimeConfig`、`resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 事务性配置变更助手，如 `mutateConfigFile`、`replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 当前进程配置快照助手，如 `getRuntimeConfig`、`getRuntimeConfigSnapshot` 和测试快照设置器 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名/描述规范化和重复/冲突检查，即使捆绑 Telegram 契约界面不可用 |
    | `plugin-sdk/text-autolink-runtime` | 不带广泛文本桶的文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | 执行/Plugin 审批助手、审批能力构建器、身份验证/配置文件助手、原生路由/运行时助手和结构化审批显示路径格式化 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时助手、分块、调度、心跳、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 窄回复调度/最终确定和对话标签助手 |
    | `plugin-sdk/reply-history` | 共享短窗口回复历史助手和标记，如 `buildHistoryContext`、`HISTORY_CONTEXT_MARKER`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 窄文本/Markdown 分块助手 |
    | `plugin-sdk/session-store-runtime` | Session 存储路径、Session 键、更新时间和存储变更助手 |
    | `plugin-sdk/cron-store-runtime` | Cron 存储路径/加载/保存助手 |
    | `plugin-sdk/state-paths` | 状态/OAuth 目录路径助手 |
    | `plugin-sdk/routing` | 路由/Session 键/账户绑定助手，如 `resolveAgentRoute`、`buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享 Channel/账户状态摘要助手、运行时状态默认值和问题元数据助手 |
    | `plugin-sdk/target-resolver-runtime` | 共享目标解析器助手 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字符串规范化助手 |
    | `plugin-sdk/request-url` | 从获取/请求类输入提取字符串 URL |
    | `plugin-sdk/run-command` | 带有规范化 stdout/stderr 结果的定时命令运行器 |
    | `plugin-sdk/param-readers` | 常用工具/CLI 参数读取器 |
    | `plugin-sdk/tool-payload` | 从工具结果对象提取规范化有效负载 |
    | `plugin-sdk/tool-send` | 从工具参数提取规范发送目标字段 |
    | `plugin-sdk/temp-path` | 共享临时下载路径助手和私有安全临时工作区 |
    | `plugin-sdk/logging-core` | 子系统日志记录器和编辑助手 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和转换助手 |
    | `plugin-sdk/model-session-runtime` | 模型/Session 覆盖助手，如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk Provider 配置解析助手 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读/写助手 |
    | `plugin-sdk/file-lock` | 可重入文件锁助手 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存助手 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/Session 和回复调度助手 |
    | `plugin-sdk/acp-runtime-backend` | 启动加载 Plugin 的轻量级 ACP 后端注册和回复调度助手 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不带生命周期启动导入的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 窄 Agent 运行时配置 Schema 原语 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析助手 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌助手 |
    | `plugin-sdk/extension-shared` | 共享被动 Channel、状态和环境代理助手原语 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/Provider 回复助手 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列表助手 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表/构建/序列化助手 |
    | `plugin-sdk/agent-harness` | 用于低级 Agent 线束的实验性受信任 Plugin 界面：线束类型、活动运行引导/中止助手、OpenClaw 工具桥接助手、运行时计划工具策略助手、终端结果分类、工具进度格式化/详情助手和尝试结果工具 |
    | `plugin-sdk/provider-zai-endpoint` | 已弃用的 Z.AI Provider 自有端点检测外观；使用 Z.AI Plugin 公开 API |
    | `plugin-sdk/async-lock-runtime` | 小型运行时状态文件的进程本地异步锁助手 |
    | `plugin-sdk/channel-activity-runtime` | Channel 活动遥测助手 |
    | `plugin-sdk/concurrency-runtime` | 有界异步任务并发助手 |
    | `plugin-sdk/dedupe-runtime` | 内存去重缓存助手 |
    | `plugin-sdk/delivery-queue-runtime` | 出站待交付排空助手 |
    | `plugin-sdk/file-access-runtime` | 安全本地文件和媒体来源路径助手 |
    | `plugin-sdk/heartbeat-runtime` | 心跳唤醒、事件和可见性助手 |
    | `plugin-sdk/number-runtime` | 数值强制转换助手 |
    | `plugin-sdk/secure-random-runtime` | 安全令牌/UUID 助手 |
    | `plugin-sdk/system-event-runtime` | 系统事件队列助手 |
    | `plugin-sdk/transport-ready-runtime` | 传输就绪等待助手 |
    | `plugin-sdk/infra-runtime` | 已弃用兼容性垫片；使用上面的聚焦运行时子路径 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存助手 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志、事件和跟踪上下文助手 |
    | `plugin-sdk/error-runtime` | 错误图形、格式化、共享错误分类助手、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包装获取、代理、EnvHttpProxyAgent 选项和固定查找助手 |
    | `plugin-sdk/runtime-fetch` | 不带代理/有防护获取导入的调度器感知运行时获取 |
    | `plugin-sdk/response-limit-runtime` | 不带广泛媒体运行时界面的有界响应正文读取器 |
    | `plugin-sdk/session-binding-runtime` | 不带已配置绑定路由或配对存储的当前对话绑定状态 |
    | `plugin-sdk/session-store-runtime` | 不带广泛配置写入/维护导入的 Session 存储助手 |
    | `plugin-sdk/context-visibility-runtime` | 不带广泛配置/安全导入的上下文可见性解析和补充上下文过滤 |
    | `plugin-sdk/string-coerce-runtime` | 不带 Markdown/日志导入的窄原语记录/字符串强制和规范化助手 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化助手 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器助手 |
    | `plugin-sdk/agent-runtime` | Agent 目录/身份/工作区助手，包括 `resolveAgentDir`、`resolveDefaultAgentDir` 和已弃用的 `resolveOpenClawAgentDir` 兼容性导出 |
    | `plugin-sdk/directory-runtime` | 配置支持的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储助手、ffprobe 支持的视频尺寸探测和媒体有效负载构建器 |
    | `plugin-sdk/media-mime` | 窄 MIME 规范化、文件扩展名映射、MIME 检测和媒体类型助手 |
    | `plugin-sdk/media-store` | 窄媒体存储助手，如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障转移助手、候选选择和缺失模型消息 |
    | `plugin-sdk/media-understanding` | 媒体理解 Provider 类型加上 Provider 面向的图像/音频/结构化提取助手导出 |
    | `plugin-sdk/text-chunking` | 文本和 Markdown 分块/渲染助手、Markdown 表格转换、指令标签剥离和安全文本工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块助手 |
    | `plugin-sdk/speech` | 语音 Provider 类型加上 Provider 面向的指令、注册表、验证、OpenAI 兼容 TTS 构建器和语音助手导出 |
    | `plugin-sdk/speech-core` | 共享语音 Provider 类型、注册表、指令、规范化和语音助手导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录 Provider 类型、注册表助手和共享 WebSocket Session 助手 |
    | `plugin-sdk/realtime-voice` | 实时语音 Provider 类型和注册表助手 |
    | `plugin-sdk/image-generation` | 图像生成 Provider 类型加上图像资产/数据 URL 助手和 OpenAI 兼容图像 Provider 构建器 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障转移、身份验证和注册表助手 |
    | `plugin-sdk/music-generation` | 音乐生成 Provider/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障转移助手、Provider 查找和模型引用解析 |
    | `plugin-sdk/video-generation` | 视频生成 Provider/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障转移助手、Provider 查找和模型引用解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装助手 |
    | `plugin-sdk/webhook-path` | 已弃用兼容性别名；使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载助手 |
    | `plugin-sdk/zod` | 已弃用兼容性重导出；在新 Plugin 代码中直接从 `zod` 导入 |
    | `plugin-sdk/testing` | 用于旧版 OpenClaw 测试的仓库本地已弃用兼容性桶。新仓库测试应导入聚焦的本地测试子路径，如 `plugin-sdk/agent-runtime-test-contracts`、`plugin-sdk/plugin-test-runtime`、`plugin-sdk/channel-test-helpers`、`plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 仓库本地最小 `createTestPluginApi` 助手，用于直接 Plugin 注册单元测试，无需导入仓库测试助手桥接 |
    | `plugin-sdk/agent-runtime-test-contracts` | 仓库本地原生 Agent 运行时适配器契约固件，用于身份验证、交付、回退、工具 Hook、提示覆盖、Schema 和转录投影测试 |
    | `plugin-sdk/channel-test-helpers` | 仓库本地 Channel 导向测试助手，用于通用操作/设置/状态契约、目录断言、账户启动生命周期、发送配置线程、运行时模拟、状态问题、出站交付和 Hook 注册 |
    | `plugin-sdk/channel-target-testing` | 仓库本地共享目标解析错误案例套件，用于 Channel 测试 |
    | `plugin-sdk/plugin-test-contracts` | 仓库本地 Plugin 包、注册、公开工件、直接导入、运行时 API 和导入副作用契约助手 |
    | `plugin-sdk/provider-test-contracts` | 仓库本地 Provider 运行时、身份验证、发现、引导、目录、向导、媒体能力、重放策略、实时 STT 实时音频、网络搜索/获取和流契约助手 |
    | `plugin-sdk/provider-http-test-mocks` | 仓库本地可选 Vitest HTTP/身份验证模拟，用于测试 `plugin-sdk/provider-http` 的 Provider 测试 |
    | `plugin-sdk/test-fixtures` | 仓库本地通用 CLI 运行时捕获、沙箱上下文、Skill 写入器、Agent 消息、系统事件、模块重新加载、捆绑 Plugin 路径、终端文本、分块、身份验证令牌和类型化案例固件 |
    | `plugin-sdk/test-node-mocks` | 仓库本地聚焦 Node 内置模拟助手，用于 Vitest `vi.mock("node:*")` 工厂内部 |
  </Accordion>

  <Accordion title="内存子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 捆绑内存核心助手界面，用于管理器/配置/文件/CLI 助手 |
    | `plugin-sdk/memory-core-engine-runtime` | 内存索引/搜索运行时外观 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 内存主机基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 内存主机嵌入契约、注册表访问、本地 Provider 和通用批处理/远程助手 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 内存主机 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 内存主机存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 内存主机多模态助手 |
    | `plugin-sdk/memory-core-host-query` | 内存主机查询助手 |
    | `plugin-sdk/memory-core-host-secret` | 内存主机密钥助手 |
    | `plugin-sdk/memory-core-host-events` | 已弃用兼容性别名；使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 内存主机状态助手 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 内存主机 CLI 运行时助手 |
    | `plugin-sdk/memory-core-host-runtime-core` | 内存主机核心运行时助手 |
    | `plugin-sdk/memory-core-host-runtime-files` | 内存主机文件/运行时助手 |
    | `plugin-sdk/memory-host-core` | 内存主机核心运行时助手的供应商中立别名 |
    | `plugin-sdk/memory-host-events` | 内存主机事件日志助手的供应商中立别名 |
    | `plugin-sdk/memory-host-files` | 已弃用兼容性别名；使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 内存相邻 Plugin 的共享托管 Markdown 助手 |
    | `plugin-sdk/memory-host-search` | 用于搜索管理器访问的活跃内存运行时外观 |
    | `plugin-sdk/memory-host-status` | 已弃用兼容性别名；使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的捆绑助手子路径">
    目前没有保留的捆绑助手 SDK 子路径。所有者特定的助手存在于拥有 Plugin 包内，而可重用的宿主契约使用通用 SDK 子路径，如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。
  </Accordion>
</AccordionGroup>

## 相关

- [Plugin SDK 概览](/plugins/sdk-overview)
- [Plugin SDK 设置](/plugins/sdk-setup)
- [构建 Plugin](/plugins/building-plugins)
