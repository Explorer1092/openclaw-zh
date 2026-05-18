---
mmh3_hash: "ff6f8608ce90ad77442fde15b973d795"
title: "Plugin SDK 子路径目录"
sidebarTitle: "SDK 子路径"
summary: "Plugin SDK 子路径目录：哪些导入在哪里，按区域分组"
read_when:
  - 为 Plugin 导入选择正确的 plugin-sdk 子路径
  - 审查捆绑 Plugin 子路径和辅助函数表面
doc-schema-version: 1
---

Plugin SDK 作为一组 `openclaw/plugin-sdk/` 下的窄公共子路径对外暴露。本页按用途对常用子路径进行分组。生成的编译器入口点清单存放于 `scripts/lib/plugin-sdk-entrypoints.json`；从该清单中减去 `scripts/lib/plugin-sdk-private-local-only-subpaths.json` 中列出的仓库本地测试/内部子路径后，即为包导出的公共子集。维护者可以通过 `pnpm plugin-sdk:surface` 审查公共导出数量，通过 `pnpm plugins:boundary-report:summary` 审查活跃的保留辅助函数子路径；未使用的保留辅助函数导出会导致 CI 报告失败，而不是以休眠的兼容性债务形式留在公共 SDK 中。

有关 Plugin 编写指南，请参见 [Plugin SDK 概述](/plugins/sdk-overview)。

## Plugin 入口

| 子路径                         | 主要导出                                                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`      | `definePluginEntry`                                                                                                                                                    |
| `plugin-sdk/core`              | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema`, `buildJsonChannelConfigSchema` |
| `plugin-sdk/config-schema`     | `OpenClawSchema`                                                                                                                                                       |
| `plugin-sdk/provider-entry`    | `defineSingleProviderPluginEntry`                                                                                                                                      |
| `plugin-sdk/migration`         | 迁移 Provider 条目辅助函数，如 `createMigrationItem`、原因常量、条目状态标记、脱敏辅助函数和 `summarizeMigrationItems`                                                 |
| `plugin-sdk/migration-runtime` | 运行时迁移辅助函数，如 `copyMigrationFileItem`、`withCachedMigrationConfigRuntime` 和 `writeMigrationReport`                                                           |

### 已弃用的兼容性和测试辅助函数

以下子路径作为旧版 Plugin 和 OpenClaw 测试套件的包导出继续保留，但新代码不应从中添加导入：`agent-runtime-test-contracts`、`channel-contract-testing`、`channel-target-testing`、`channel-test-helpers`、`plugin-test-api`、`plugin-test-contracts`、`provider-http-test-mocks`、`provider-test-contracts`、`test-env`、`test-fixtures`、`test-node-mocks`、`testing`、`channel-runtime`、`compat`、`config-types`、`infra-runtime`、`text-runtime` 和 `zod`。新 Plugin 代码请直接从 `zod` 导入。`plugin-test-runtime` 仍然是活跃的专用测试辅助函数子路径。

### 保留的捆绑 Plugin 辅助函数子路径

以下子路径是为其所属捆绑 Plugin 保留的 Plugin 拥有兼容性表面，不是通用 SDK API：`plugin-sdk/codex-mcp-projection` 和 `plugin-sdk/codex-native-task-runtime`。包契约守护措施会阻止跨所有者的扩展导入。

### 已弃用的未使用公共子路径

以下公共子路径已存在至少一个月，目前没有任何捆绑扩展的生产导入。它们仍可导入以保持兼容性，但新 Plugin 代码应使用专注于活跃使用的 SDK 子路径：`agent-config-primitives`、`channel-config-schema-legacy`、`channel-reply-pipeline`、`channel-runtime`、`channel-secret-runtime`、`command-auth`、`compat`、`config-runtime`、`config-schema`、`discord`、`group-access`、`infra-runtime`、`matrix`、`mattermost`、`media-generation-runtime-shared`、`memory-core-engine-runtime`、`memory-core-host-multimodal`、`memory-core-host-query`、`music-generation-core`、`self-hosted-provider-setup`、`telegram-account`、`telegram-command-config` 和 `zalouser`。

### 已弃用的稀少公共子路径

目前仅被一两个捆绑 Plugin 所有者使用的公共子路径对于新 Plugin 代码也已弃用。它们作为包导出保留以保持兼容性，但新代码应优先使用活跃共享的 SDK 接缝或 Plugin 拥有的包 API。维护者在 `scripts/lib/plugin-sdk-deprecated-public-subpaths.json` 中跟踪确切集合，并通过 `pnpm plugin-sdk:surface` 跟踪当前预算。

### 已弃用的宽泛桶导出

以下宽泛的重导出桶对于 OpenClaw 源码和兼容性检查仍可构建，但新代码应优先使用专注的 SDK 子路径：`agent-runtime`、`channel-lifecycle`、`channel-runtime`、`cli-runtime`、`compat`、`config-types`、`conversation-runtime`、`hook-runtime`、`infra-runtime`、`media-runtime`、`plugin-runtime`、`security-runtime` 和 `text-runtime`。`channel-runtime`、`compat`、`config-types`、`infra-runtime` 和 `text-runtime` 仅为向后兼容性保留为包导出；请改用专注的 channel/runtime 子路径、`config-contracts`、`string-coerce-runtime`、`text-chunking`、`text-utility-runtime` 和 `logging-core`。

<AccordionGroup>
  <Accordion title="Channel 子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/json-schema-runtime` | Plugin 拥有 schema 的缓存 JSON Schema 验证辅助函数 |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助函数、设置翻译器、允许列表提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | 已弃用的兼容性别名；使用 `plugin-sdk/setup-runtime` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账户配置/操作门控辅助函数、默认账户回退辅助函数 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账户 ID 规范化辅助函数 |
    | `plugin-sdk/account-resolution` | 账户查找和默认回退辅助函数 |
    | `plugin-sdk/account-helpers` | 窄账户列表/账户操作辅助函数 |
    | `plugin-sdk/access-groups` | 访问组允许列表解析和脱敏组诊断辅助函数 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | 旧版回复管道辅助函数。新的 Channel 回复管道代码应使用 `plugin-sdk/channel-message` 中的 `createChannelMessageReplyPipeline` 和 `resolveChannelMessageSourceReplyDeliveryMode`。 |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
    | `plugin-sdk/channel-config-schema` | 共享 Channel 配置 schema 原语以及 Zod 和直接 JSON/TypeBox 构建器 |
    | `plugin-sdk/bundled-channel-config-schema` | 仅供维护的捆绑 Plugin 使用的捆绑 OpenClaw Channel 配置 schema |
    | `plugin-sdk/channel-config-schema-legacy` | 捆绑 Channel 配置 schema 的已弃用兼容性别名 |
    | `plugin-sdk/telegram-command-config` | Telegram 自定义命令规范化/验证辅助函数，带有捆绑契约回退 |
    | `plugin-sdk/command-gating` | 窄命令授权门控辅助函数 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-ingress` | 已弃用的低级 Channel 入口兼容性外观。新的接收路径应使用 `plugin-sdk/channel-ingress-runtime`。 |
    | `plugin-sdk/channel-ingress-runtime` | 实验性高级 Channel 入口运行时解析器和路由事实构建器，用于迁移后的 Channel 接收路径。优先使用此方式，而不是在每个 Plugin 中组装有效允许列表、命令允许列表和旧版投影。请参见 [Channel ingress API](/plugins/sdk-channel-ingress)。 |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`, `createChannelRunQueue` 和旧版草稿流生命周期辅助函数。新的预览最终化代码应使用 `plugin-sdk/channel-message`。 |
    | `plugin-sdk/channel-message` | 廉价的消息生命周期契约辅助函数，如 `defineChannelMessageAdapter`, `createChannelMessageAdapterFromOutbound`, `createChannelMessageReplyPipeline`, `createReplyPrefixContext`, `resolveChannelMessageSourceReplyDeliveryMode`，持久最终能力派生，发送/接收/副作用能力的能力证明辅助函数，`MessageReceiveContext`，接收确认策略证明，`defineFinalizableLivePreviewAdapter`, `deliverWithFinalizableLivePreviewAdapter`，实时预览和实时最终化能力证明，持久恢复状态，`RenderedMessageBatch`，消息接收类型和接收 ID 辅助函数。请参见 [Channel message API](/plugins/sdk-channel-message)。旧版回复分发外观仅为已弃用的兼容性保留。 |
    | `plugin-sdk/channel-message-runtime` | 可能加载出站传递的运行时传递辅助函数，包括 `deliverInboundReplyWithMessageSendContext`, `sendDurableMessageBatch` 和 `withDurableMessageSendContext`。已弃用的回复分发桥接仅供兼容性分发器导入。请从监控/发送运行时模块使用，而不是热 Plugin 引导文件。 |
    | `plugin-sdk/inbound-envelope` | 共享入站路由和信封构建器辅助函数 |
    | `plugin-sdk/inbound-reply-dispatch` | 旧版共享入站记录和分发辅助函数、可见/最终分发谓词，以及已准备 Channel 分发器的已弃用 `deliverDurableInboundReplyPayload` 兼容性。新的 Channel 接收/分发代码应从 `plugin-sdk/channel-message-runtime` 导入运行时生命周期辅助函数。 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配辅助函数 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载辅助函数 |
    | `plugin-sdk/outbound-send-deps` | Channel 适配器的轻量级出站发送依赖项查找 |
    | `plugin-sdk/outbound-runtime` | 出站身份、发送委托、Session、格式化和负载规划辅助函数。直接传递辅助函数如 `deliverOutboundPayloads` 是已弃用的兼容性底层；新的发送路径使用 `plugin-sdk/channel-message-runtime`。 |
    | `plugin-sdk/poll-runtime` | 窄轮询规范化辅助函数 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助函数 |
    | `plugin-sdk/agent-media-payload` | 旧版 Agent 媒体负载构建器 |
    | `plugin-sdk/conversation-runtime` | 会话/线程绑定、配对和已配置绑定辅助函数 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照辅助函数 |
    | `plugin-sdk/runtime-group-policy` | 运行时组策略解析辅助函数 |
    | `plugin-sdk/channel-status` | 共享 Channel 状态快照/摘要辅助函数 |
    | `plugin-sdk/channel-config-primitives` | 窄 Channel 配置 schema 原语 |
    | `plugin-sdk/channel-config-writes` | Channel 配置写入授权辅助函数 |
    | `plugin-sdk/channel-plugin-common` | 共享 Channel Plugin 前置导出 |
    | `plugin-sdk/allowlist-config-edit` | 允许列表配置编辑/读取辅助函数 |
    | `plugin-sdk/group-access` | 共享组访问决策辅助函数 |
    | `plugin-sdk/direct-dm` | 共享直接 DM 认证/守护辅助函数 |
    | `plugin-sdk/discord` | 已弃用的 Discord 兼容性外观，适用于已发布的 `@openclaw/discord@2026.3.13` 和跟踪的所有者兼容性；新 Plugin 应使用通用 Channel SDK 子路径 |
    | `plugin-sdk/telegram-account` | 已弃用的 Telegram 账户解析兼容性外观，适用于跟踪的所有者兼容性；新 Plugin 应使用注入的运行时辅助函数或通用 Channel SDK 子路径 |
    | `plugin-sdk/zalouser` | 已弃用的 Zalo Personal 兼容性外观，适用于仍导入发送方命令授权的已发布 Lark/Zalo 包；新 Plugin 应使用 `plugin-sdk/command-auth` |
    | `plugin-sdk/interactive-runtime` | 语义消息展示、传递和旧版交互式回复辅助函数。请参见[消息展示](/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 用于事件分类、上下文构建、防抖、提及匹配、提及策略和信封格式化的共享入站辅助函数 |
    | `plugin-sdk/channel-inbound-debounce` | 窄入站防抖辅助函数 |
    | `plugin-sdk/channel-mention-gating` | 窄提及策略、提及标记和提及文本辅助函数，不包含更广泛的入站运行时表面 |
    | `plugin-sdk/channel-envelope` | 窄入站信封格式化辅助函数 |
    | `plugin-sdk/channel-location` | Channel 位置上下文和格式化辅助函数 |
    | `plugin-sdk/channel-logging` | 入站丢弃和输入/确认失败的 Channel 日志辅助函数 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | Channel 消息操作辅助函数，以及为 Plugin 兼容性保留的已弃用原生 schema 辅助函数 |
    | `plugin-sdk/channel-route` | 共享路由规范化、解析器驱动的目标解析、线程 ID 字符串化、去重/压缩路由键、解析目标类型和路由/目标比较辅助函数 |
    | `plugin-sdk/channel-targets` | 目标解析辅助函数；路由比较调用方应使用 `plugin-sdk/channel-route` |
    | `plugin-sdk/channel-contract` | Channel 契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/反应连接 |
    | `plugin-sdk/channel-secret-runtime` | 窄秘密契约辅助函数，如 `collectSimpleChannelFieldAssignments`, `getChannelSurface`, `pushAssignment` 和秘密目标类型 |
  </Accordion>

  <Accordion title="Provider 子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/lmstudio` | 支持 LM Studio Provider 的外观，用于设置、目录发现和运行时模型准备 |
    | `plugin-sdk/lmstudio-runtime` | 支持 LM Studio 运行时的外观，用于本地服务器默认值、模型发现、请求标头和已加载模型辅助函数 |
    | `plugin-sdk/provider-setup` | 精心整理的本地/自托管 Provider 设置辅助函数 |
    | `plugin-sdk/self-hosted-provider-setup` | 专注的 OpenAI 兼容自托管 Provider 设置辅助函数 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值和看门狗常量 |
    | `plugin-sdk/provider-auth-runtime` | Provider Plugin 的运行时 API 密钥解析辅助函数 |
    | `plugin-sdk/provider-auth-api-key` | API 密钥入门/配置文件写入辅助函数，如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 认证结果构建器 |
    | `plugin-sdk/provider-env-vars` | Provider 认证环境变量查找辅助函数 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile`, `upsertApiKeyProfile`, `writeOAuthCredentials`，已弃用的 `resolveOpenClawAgentDir` 兼容性导出 |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`，共享重放策略构建器，Provider 端点辅助函数和共享模型 ID 规范化辅助函数 |
    | `plugin-sdk/provider-catalog-runtime` | Provider 目录增强运行时 Hook 和 Plugin-Provider 注册表接缝，用于契约测试 |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用 Provider HTTP/端点能力辅助函数、Provider HTTP 错误和音频转录多部分表单辅助函数 |
    | `plugin-sdk/provider-web-fetch-contract` | 窄 web-fetch 配置/选择契约辅助函数，如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | web-fetch Provider 注册/缓存辅助函数 |
    | `plugin-sdk/provider-web-search-config-contract` | 不需要 Plugin 启用连接的 Provider 的窄 web-search 配置/凭据辅助函数 |
    | `plugin-sdk/provider-web-search-contract` | 窄 web-search 配置/凭据契约辅助函数，如 `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` 和作用域凭据设置/获取器 |
    | `plugin-sdk/provider-web-search` | web-search Provider 注册/缓存/运行时辅助函数 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` 以及 Gemini schema 清理和诊断 |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 等 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`，流包装器类型，以及共享 Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助函数 |
    | `plugin-sdk/provider-transport-runtime` | 原生 Provider 传输辅助函数，如受保护的 fetch、传输消息转换和可写传输事件流 |
    | `plugin-sdk/provider-onboard` | 入门配置补丁辅助函数 |
    | `plugin-sdk/global-singleton` | 进程本地单例/映射/缓存辅助函数 |
    | `plugin-sdk/group-activation` | 窄组激活模式和命令解析辅助函数 |
  </Accordion>

  <Accordion title="认证和安全子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`，命令注册表辅助函数（包括动态参数菜单格式化），发送方授权辅助函数 |
    | `plugin-sdk/command-status` | 命令/帮助消息构建器，如 `buildCommandsMessagePaginated` 和 `buildHelpMessage` |
    | `plugin-sdk/approval-auth-runtime` | 审批者解析和同聊天操作认证辅助函数 |
    | `plugin-sdk/approval-client-runtime` | 原生执行审批配置文件/过滤器辅助函数 |
    | `plugin-sdk/approval-delivery-runtime` | 原生审批能力/传递适配器 |
    | `plugin-sdk/approval-gateway-runtime` | 共享审批 Gateway 解析辅助函数 |
    | `plugin-sdk/approval-handler-adapter-runtime` | 用于热 Channel 入口点的轻量级原生审批适配器加载辅助函数 |
    | `plugin-sdk/approval-handler-runtime` | 更广泛的审批处理器运行时辅助函数；当窄适配器/Gateway 接缝足够时优先使用 |
    | `plugin-sdk/approval-native-runtime` | 原生审批目标和账户绑定辅助函数 |
    | `plugin-sdk/approval-reply-runtime` | 执行/Plugin 审批回复负载辅助函数 |
    | `plugin-sdk/approval-runtime` | 执行/Plugin 审批负载辅助函数，原生审批路由/运行时辅助函数，以及结构化审批显示辅助函数（如 `formatApprovalDisplayPath`） |
    | `plugin-sdk/reply-dedupe` | 窄入站回复去重重置辅助函数 |
    | `plugin-sdk/channel-contract-testing` | 窄 Channel 契约测试辅助函数，不包含宽泛的测试桶 |
    | `plugin-sdk/command-auth-native` | 原生命令认证、动态参数菜单格式化和原生 Session 目标辅助函数 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助函数 |
    | `plugin-sdk/command-primitives-runtime` | 用于热 Channel 路径的轻量级命令文本谓词 |
    | `plugin-sdk/command-surface` | 命令体规范化和命令表面辅助函数 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/channel-secret-runtime` | 用于 Channel/Plugin 秘密表面的窄秘密契约收集辅助函数 |
    | `plugin-sdk/secret-ref-runtime` | 用于秘密契约/配置解析的窄 `coerceSecretRef` 和 SecretRef 类型辅助函数 |
    | `plugin-sdk/security-runtime` | 共享信任、DM 门控、根绑定文件/路径辅助函数（包括仅创建写入、同步/异步原子文件替换、兄弟临时写入、跨设备移动回退、私有文件存储辅助函数、符号链接父级守护、外部内容、敏感文本脱敏、恒定时间秘密比较和秘密收集辅助函数） |
    | `plugin-sdk/ssrf-policy` | 主机允许列表和私有网络 SSRF 策略辅助函数 |
    | `plugin-sdk/ssrf-dispatcher` | 不包含宽泛基础设施运行时表面的窄固定分发器辅助函数 |
    | `plugin-sdk/ssrf-runtime` | 固定分发器、SSRF 保护的 fetch、SSRF 错误和 SSRF 策略辅助函数 |
    | `plugin-sdk/secret-input` | 秘密输入解析辅助函数 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助函数和原始 WebSocket/正文强制转换 |
    | `plugin-sdk/webhook-request-guards` | 请求正文大小/超时辅助函数 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 宽泛的运行时/日志/备份/Plugin 安装辅助函数 |
    | `plugin-sdk/runtime-env` | 窄运行时环境、日志记录器、超时、重试和退避辅助函数 |
    | `plugin-sdk/browser-config` | 支持的浏览器配置外观，用于规范化配置文件/默认值、CDP URL 解析和浏览器控制认证辅助函数 |
    | `plugin-sdk/codex-mcp-projection` | 保留的捆绑 Codex 辅助函数，用于将用户 MCP 服务器配置投影到 Codex 线程配置中；不适用于第三方 Plugin |
    | `plugin-sdk/codex-native-task-runtime` | 保留的捆绑 Codex 辅助函数，用于原生任务镜像/运行时连接；不适用于第三方 Plugin |
    | `plugin-sdk/channel-runtime-context` | 通用 Channel 运行时上下文注册和查找辅助函数 |
    | `plugin-sdk/matrix` | 已弃用的 Matrix 兼容性外观，适用于旧版第三方 Channel 包；新 Plugin 应直接导入 `plugin-sdk/run-command` |
    | `plugin-sdk/mattermost` | 已弃用的 Mattermost 兼容性外观，适用于旧版第三方 Channel 包；新 Plugin 应直接导入通用 SDK 子路径 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享 Plugin 命令/Hook/HTTP/交互式辅助函数 |
    | `plugin-sdk/hook-runtime` | 共享 Webhook/内部 Hook 管道辅助函数 |
    | `plugin-sdk/lazy-runtime` | 懒加载运行时导入/绑定辅助函数，如 `createLazyRuntimeModule`, `createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程执行辅助函数 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、参数调用和懒加载命令组辅助函数 |
    | `plugin-sdk/gateway-method-runtime` | 保留的 Gateway 方法分发辅助函数，用于声明 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的 Plugin HTTP 路由 |
    | `plugin-sdk/gateway-runtime` | Gateway 客户端、事件循环就绪客户端启动辅助函数、Gateway CLI RPC、Gateway 协议错误和 Channel 状态补丁辅助函数 |
    | `plugin-sdk/config-contracts` | 专注的仅类型配置表面，用于 Plugin 配置形状，如 `OpenClawConfig` 和 Channel/Provider 配置类型 |
    | `plugin-sdk/plugin-config-runtime` | 运行时 Plugin 配置查找辅助函数，如 `requireRuntimeConfig`, `resolvePluginConfigObject` 和 `resolveLivePluginConfigObject` |
    | `plugin-sdk/config-mutation` | 事务性配置变更辅助函数，如 `mutateConfigFile`, `replaceConfigFile` 和 `logConfigUpdated` |
    | `plugin-sdk/runtime-config-snapshot` | 当前进程配置快照辅助函数，如 `getRuntimeConfig`, `getRuntimeConfigSnapshot` 和测试快照设置器 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称/描述规范化和重复/冲突检查，即使捆绑 Telegram 契约表面不可用时也有效 |
    | `plugin-sdk/text-autolink-runtime` | 不包含宽泛文本桶的文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | 执行/Plugin 审批辅助函数、审批能力构建器、认证/配置文件辅助函数、原生路由/运行时辅助函数和结构化审批显示路径格式化 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时辅助函数、分块、分发、心跳、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 窄回复分发/最终化和会话标签辅助函数 |
    | `plugin-sdk/reply-history` | 共享短窗口回复历史辅助函数。新消息轮次代码应使用 `createChannelHistoryWindow`；低级映射辅助函数仅保留为已弃用的兼容性导出 |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 窄文本/Markdown 分块辅助函数 |
    | `plugin-sdk/session-store-runtime` | Session 存储路径、Session 键、更新时间和存储变更辅助函数 |
    | `plugin-sdk/cron-store-runtime` | Cron 存储路径/加载/保存辅助函数 |
    | `plugin-sdk/state-paths` | 状态/OAuth 目录路径辅助函数 |
    | `plugin-sdk/routing` | 路由/Session 键/账户绑定辅助函数，如 `resolveAgentRoute`, `buildAgentSessionKey` 和 `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享 Channel/账户状态摘要辅助函数、运行时状态默认值和问题元数据辅助函数 |
    | `plugin-sdk/target-resolver-runtime` | 共享目标解析器辅助函数 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字符串规范化辅助函数 |
    | `plugin-sdk/request-url` | 从 fetch/类请求输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带规范化 stdout/stderr 结果的定时命令运行器 |
    | `plugin-sdk/param-readers` | 常用工具/CLI 参数读取器 |
    | `plugin-sdk/tool-plugin` | 定义简单类型化 Agent 工具 Plugin 并公开用于 Manifest 生成的静态元数据 |
    | `plugin-sdk/tool-payload` | 从工具结果对象中提取规范化负载 |
    | `plugin-sdk/tool-send` | 从工具参数中提取规范发送目标字段 |
    | `plugin-sdk/temp-path` | 共享临时下载路径辅助函数和私有安全临时工作区 |
    | `plugin-sdk/logging-core` | 子系统日志记录器和脱敏辅助函数 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和转换辅助函数 |
    | `plugin-sdk/model-session-runtime` | 模型/Session 覆盖辅助函数，如 `applyModelOverrideToSessionEntry` 和 `resolveAgentMaxConcurrent` |
    | `plugin-sdk/talk-config-runtime` | Talk Provider 配置解析辅助函数 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读写辅助函数 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助函数 |
    | `plugin-sdk/persistent-dedupe` | 基于磁盘的去重缓存辅助函数 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/Session 和回复分发辅助函数 |
    | `plugin-sdk/acp-runtime-backend` | 用于启动加载 Plugin 的轻量级 ACP 后端注册和回复分发辅助函数 |
    | `plugin-sdk/acp-binding-resolve-runtime` | 不包含生命周期启动导入的只读 ACP 绑定解析 |
    | `plugin-sdk/agent-config-primitives` | 窄 Agent 运行时配置 schema 原语 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助函数 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌辅助函数 |
    | `plugin-sdk/extension-shared` | 共享被动 Channel、状态和环境代理辅助函数原语 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/Provider 回复辅助函数 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列表辅助函数 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表/构建/序列化辅助函数 |
    | `plugin-sdk/agent-harness` | 实验性受信任 Plugin 表面，用于低级 Agent 线束：线束类型、活跃运行转向/中止辅助函数、OpenClaw 工具桥辅助函数、运行时计划工具策略辅助函数、终端结果分类、工具进度格式化/详细辅助函数和尝试结果工具类 |
    | `plugin-sdk/provider-zai-endpoint` | 已弃用的 Z.AI Provider 拥有的端点检测外观；使用 Z.AI Plugin 公共 API |
    | `plugin-sdk/async-lock-runtime` | 用于小型运行时状态文件的进程本地异步锁辅助函数 |
    | `plugin-sdk/channel-activity-runtime` | Channel 活动遥测辅助函数 |
    | `plugin-sdk/concurrency-runtime` | 有界异步任务并发辅助函数 |
    | `plugin-sdk/dedupe-runtime` | 内存中去重缓存辅助函数 |
    | `plugin-sdk/delivery-queue-runtime` | 出站待传递排空辅助函数 |
    | `plugin-sdk/file-access-runtime` | 安全的本地文件和媒体源路径辅助函数 |
    | `plugin-sdk/heartbeat-runtime` | 心跳唤醒、事件和可见性辅助函数 |
    | `plugin-sdk/number-runtime` | 数值强制转换辅助函数 |
    | `plugin-sdk/secure-random-runtime` | 安全令牌/UUID 辅助函数 |
    | `plugin-sdk/system-event-runtime` | 系统事件队列辅助函数 |
    | `plugin-sdk/transport-ready-runtime` | 传输就绪等待辅助函数 |
    | `plugin-sdk/infra-runtime` | 已弃用的兼容性垫片；使用上面的专注运行时子路径 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助函数 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志、事件和追踪上下文辅助函数 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助函数、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包装的 fetch、代理、EnvHttpProxyAgent 选项和固定查找辅助函数 |
    | `plugin-sdk/runtime-fetch` | 无代理/保护 fetch 导入的分发器感知运行时 fetch |
    | `plugin-sdk/response-limit-runtime` | 不包含宽泛媒体运行时表面的有界响应体读取器 |
    | `plugin-sdk/session-binding-runtime` | 当前会话绑定状态，不包含已配置绑定路由或配对存储 |
    | `plugin-sdk/session-store-runtime` | 不包含宽泛配置写入/维护导入的 Session 存储辅助函数 |
    | `plugin-sdk/context-visibility-runtime` | 上下文可见性解析和补充上下文过滤，不包含宽泛的配置/安全导入 |
    | `plugin-sdk/string-coerce-runtime` | 不包含 Markdown/日志导入的窄原始记录/字符串强制转换和规范化辅助函数 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助函数 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助函数 |
    | `plugin-sdk/agent-runtime` | Agent 目录/身份/工作区辅助函数，包括 `resolveAgentDir`, `resolveDefaultAgentDir` 和已弃用的 `resolveOpenClawAgentDir` 兼容性导出 |
    | `plugin-sdk/directory-runtime` | 配置支持的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体 fetch/转换/存储辅助函数，包括 `saveRemoteMedia`, `saveResponseMedia`, `readRemoteMediaBuffer` 和已弃用的 `fetchRemoteMedia`；当 URL 应成为 OpenClaw 媒体时，优先使用存储辅助函数而不是缓冲区读取 |
    | `plugin-sdk/media-mime` | 窄 MIME 规范化、文件扩展名映射、MIME 检测和媒体类型辅助函数 |
    | `plugin-sdk/media-store` | 窄媒体存储辅助函数，如 `saveMediaBuffer` 和 `saveMediaStream` |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障转移辅助函数、候选选择和缺少模型消息 |
    | `plugin-sdk/media-understanding` | 媒体理解 Provider 类型以及面向 Provider 的图像/音频/结构化提取辅助函数导出 |
    | `plugin-sdk/text-chunking` | 文本和 Markdown 分块/渲染辅助函数、Markdown 表格转换、指令标签去除和安全文本工具类 |
    | `plugin-sdk/speech` | 语音 Provider 类型以及面向 Provider 的指令、注册表、验证、OpenAI 兼容 TTS 构建器和语音辅助函数导出 |
    | `plugin-sdk/speech-core` | 共享语音 Provider 类型、注册表、指令、规范化和语音辅助函数导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录 Provider 类型、注册表辅助函数和共享 WebSocket Session 辅助函数 |
    | `plugin-sdk/realtime-voice` | 实时语音 Provider 类型和注册表辅助函数 |
    | `plugin-sdk/image-generation` | 图像生成 Provider 类型以及图像资产/数据 URL 辅助函数和 OpenAI 兼容图像 Provider 构建器 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障转移、认证和注册表辅助函数 |
    | `plugin-sdk/music-generation` | 音乐生成 Provider/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障转移辅助函数、Provider 查找和模型引用解析 |
    | `plugin-sdk/video-generation` | 视频生成 Provider/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障转移辅助函数、Provider 查找和模型引用解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助函数 |
    | `plugin-sdk/webhook-path` | 已弃用的兼容性别名；使用 `plugin-sdk/webhook-ingress` |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载辅助函数 |
    | `plugin-sdk/zod` | 已弃用的兼容性重导出；直接从 `zod` 导入 |
    | `plugin-sdk/testing` | 旧版 OpenClaw 测试的仓库本地已弃用兼容性桶。新仓库测试应改为导入专注的本地测试子路径，如 `plugin-sdk/agent-runtime-test-contracts`, `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/test-env` 或 `plugin-sdk/test-fixtures` |
    | `plugin-sdk/plugin-test-api` | 仓库本地最小 `createTestPluginApi` 辅助函数，用于直接 Plugin 注册单元测试，不导入仓库测试辅助函数桥接 |
    | `plugin-sdk/agent-runtime-test-contracts` | 仓库本地原生 Agent 运行时适配器契约固定数据，用于认证、传递、回退、工具 Hook、提示覆盖、schema 和转录投影测试 |
    | `plugin-sdk/channel-test-helpers` | 仓库本地面向 Channel 的测试辅助函数，用于通用操作/设置/状态契约、目录断言、账户启动生命周期、发送配置线程、运行时模拟、状态问题、出站传递和 Hook 注册 |
    | `plugin-sdk/channel-target-testing` | 仓库本地用于 Channel 测试的共享目标解析错误案例套件 |
    | `plugin-sdk/plugin-test-contracts` | 仓库本地 Plugin 包、注册、公共构件、直接导入、运行时 API 和导入副作用契约辅助函数 |
    | `plugin-sdk/provider-test-contracts` | 仓库本地 Provider 运行时、认证、发现、入门、目录、向导、媒体能力、重放策略、实时 STT 实时音频、web-search/fetch 和流契约辅助函数 |
    | `plugin-sdk/provider-http-test-mocks` | 仓库本地可选加入的 Vitest HTTP/认证模拟，用于测试 `plugin-sdk/provider-http` 的 Provider 测试 |
    | `plugin-sdk/test-fixtures` | 仓库本地通用 CLI 运行时捕获、沙箱上下文、Skill 写入器、Agent 消息、系统事件、模块重新加载、捆绑 Plugin 路径、终端文本、分块、认证令牌和类型化案例固定数据 |
    | `plugin-sdk/test-node-mocks` | 仓库本地专注的 Node 内置模拟辅助函数，用于 Vitest `vi.mock("node:*")` 工厂内部 |
  </Accordion>

  <Accordion title="内存子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 捆绑内存核心辅助函数表面，用于管理器/配置/文件/CLI 辅助函数 |
    | `plugin-sdk/memory-core-engine-runtime` | 内存索引/搜索运行时外观 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 内存主机基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 内存主机嵌入契约、注册表访问、本地 Provider 和通用批量/远程辅助函数 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 内存主机 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 内存主机存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 内存主机多模态辅助函数 |
    | `plugin-sdk/memory-core-host-query` | 内存主机查询辅助函数 |
    | `plugin-sdk/memory-core-host-secret` | 内存主机秘密辅助函数 |
    | `plugin-sdk/memory-core-host-events` | 已弃用的兼容性别名；使用 `plugin-sdk/memory-host-events` |
    | `plugin-sdk/memory-core-host-status` | 内存主机状态辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 内存主机 CLI 运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-core` | 内存主机核心运行时辅助函数 |
    | `plugin-sdk/memory-core-host-runtime-files` | 内存主机文件/运行时辅助函数 |
    | `plugin-sdk/memory-host-core` | 内存主机核心运行时辅助函数的供应商中立别名 |
    | `plugin-sdk/memory-host-events` | 内存主机事件日志辅助函数的供应商中立别名 |
    | `plugin-sdk/memory-host-files` | 已弃用的兼容性别名；使用 `plugin-sdk/memory-core-host-runtime-files` |
    | `plugin-sdk/memory-host-markdown` | 内存相邻 Plugin 的共享托管 Markdown 辅助函数 |
    | `plugin-sdk/memory-host-search` | 用于搜索管理器访问的活跃内存运行时外观 |
    | `plugin-sdk/memory-host-status` | 已弃用的兼容性别名；使用 `plugin-sdk/memory-core-host-status` |
  </Accordion>

  <Accordion title="保留的捆绑辅助函数子路径">
    保留的捆绑辅助函数 SDK 子路径是捆绑 Plugin 代码的窄所有者特定表面。它们在 SDK 清单中跟踪，以保持包构建和别名确定性，但不是通用的 Plugin 编写 API。新的可复用主机契约应使用通用 SDK 子路径，如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

    | 子路径 | 所有者和用途 |
    | --- | --- |
    | `plugin-sdk/codex-mcp-projection` | 捆绑 Codex Plugin 辅助函数，用于将用户 MCP 服务器配置投影到 Codex 应用服务器线程配置中 |
    | `plugin-sdk/codex-native-task-runtime` | 捆绑 Codex Plugin 辅助函数，用于将 Codex 应用服务器原生子 Agent 镜像到 OpenClaw 任务状态中 |

  </Accordion>
</AccordionGroup>

## 相关

- [Plugin SDK 概述](/plugins/sdk-overview)
- [Plugin 设置和配置](/plugins/sdk-setup)
- [构建 Plugin](/plugins/building-plugins)
