---
mmh3_hash: "ce83edb658cdf621af4b775571255ad6"
summary: "Plugin SDK 子路径目录：哪些导入在哪里，按区域分组"
read_when:
  - 为 Plugin 导入选择正确的 plugin-sdk 子路径
  - 审计 Bundle Plugin 子路径和助手界面
title: "Plugin SDK 子路径"
---

Plugin SDK 以 `openclaw/plugin-sdk/` 下的一组窄子路径形式公开。本页按目的对常用子路径进行目录分类。包含 200+ 子路径的完整列表存在于 `scripts/lib/plugin-sdk-entrypoints.json`；保留的 Bundle Plugin 助手子路径会在那里出现，但除非文档页面明确推广它们，否则它们是实现细节。

有关 Plugin 编写指南，请参见 [Plugin SDK 概览](/plugins/sdk-overview)。

## Plugin 入口

| 子路径 | 关键导出 |
| --- | --- |
| `plugin-sdk/plugin-entry` | `definePluginEntry` |
| `plugin-sdk/core` | `defineChannelPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase`、`defineSetupPluginEntry`、`buildChannelConfigSchema` |
| `plugin-sdk/config-schema` | `OpenClawSchema` |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
| `plugin-sdk/migration` | 迁移 Provider 项目助手，如 `createMigrationItem`、原因常量、项目状态标记、编辑助手和 `summarizeMigrationItems` |
| `plugin-sdk/migration-runtime` | 运行时迁移助手，如 `copyMigrationFileItem` 和 `writeMigrationReport` |

<AccordionGroup>
  <Accordion title="Channel 子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`、`defineSetupPluginEntry`、`createChatChannelPlugin`、`createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod Schema 导出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`，加上 `DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled`、`splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导助手、允许列表提示、设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`、`noteChannelLookupFailure`、`noteChannelLookupSummary`、`promptResolvedAllowFrom`、`splitSetupEntries`、`createAllowlistSetupWizardProxy`、`createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`、`detectBinary`、`extractArchive`、`resolveBrewExecutable`、`formatDocsLink`、`CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账户配置/操作门控助手、默认账户回退助手 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`、账户 id 规范化助手 |
    | `plugin-sdk/account-resolution` | 账户查找 + 默认回退助手 |
    | `plugin-sdk/account-helpers` | 窄账户列表/账户操作助手 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel 配置 Schema 类型 |
    | `plugin-sdk/telegram-command-config` | Telegram 自定义命令规范化/验证助手，带有 Bundle 契约回退 |
    | `plugin-sdk/command-gating` | 窄命令授权门控助手 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink`、草稿流生命周期/最终确定助手 |
    | `plugin-sdk/inbound-envelope` | 共享入站路由 + 包络构建器助手 |
    | `plugin-sdk/inbound-reply-dispatch` | 共享入站记录和调度助手 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配助手 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载助手 |
    | `plugin-sdk/outbound-send-deps` | Channel 适配器的轻量级出站发送依赖项查找 |
    | `plugin-sdk/outbound-runtime` | 出站交付、身份、发送委托、Session、格式化和有效负载规划助手 |
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
    | `plugin-sdk/interactive-runtime` | 语义消息呈现、交付和旧版交互式回复助手。请参见[消息呈现](/plugins/message-presentation) |
    | `plugin-sdk/channel-inbound` | 入站防抖、提及匹配、提及策略助手和包络助手的兼容性桶 |
    | `plugin-sdk/channel-inbound-debounce` | 窄入站防抖助手 |
    | `plugin-sdk/channel-mention-gating` | 不带更广泛入站运行时界面的窄提及策略和提及文本助手 |
    | `plugin-sdk/channel-envelope` | 窄入站包络格式化助手 |
    | `plugin-sdk/channel-location` | Channel 位置上下文和格式化助手 |
    | `plugin-sdk/channel-logging` | 入站丢弃和打字/确认失败的 Channel 日志助手 |
    | `plugin-sdk/channel-send-result` | 回复结果类型 |
    | `plugin-sdk/channel-actions` | Channel 消息操作助手，加上为 Plugin 兼容性保留的已弃用原生 Schema 助手 |
    | `plugin-sdk/channel-targets` | 目标解析/匹配助手 |
    | `plugin-sdk/channel-contract` | Channel 契约类型 |
    | `plugin-sdk/channel-feedback` | 反馈/反应接线 |
    | `plugin-sdk/channel-secret-runtime` | 窄密钥契约助手，如 `collectSimpleChannelFieldAssignments`、`getChannelSurface`、`pushAssignment` 和密钥目标类型 |
  </Accordion>

  <Accordion title="Provider 子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 精心策划的本地/自托管 Provider 设置助手 |
    | `plugin-sdk/self-hosted-provider-setup` | 面向 OpenAI 兼容的自托管 Provider 设置助手 |
    | `plugin-sdk/cli-backend` | CLI 后端默认值 + 看门狗常量 |
    | `plugin-sdk/provider-auth-runtime` | Provider Plugin 的运行时 API 密钥解析助手 |
    | `plugin-sdk/provider-auth-api-key` | API 密钥引导/配置写入助手，如 `upsertApiKeyProfile` |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 身份验证结果构建器 |
    | `plugin-sdk/provider-auth-login` | Provider Plugin 的共享交互式登录助手 |
    | `plugin-sdk/provider-env-vars` | Provider 身份验证环境变量查找助手 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`、`ensureApiKeyFromOptionEnvOrPrompt`、`upsertAuthProfile`、`upsertApiKeyProfile`、`writeOAuthCredentials` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`、`buildProviderReplayFamilyHooks`、`normalizeModelCompat`、共享重放策略构建器、Provider 端点助手和模型 id 规范化助手，如 `normalizeNativeXaiModelId` |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`、`buildSingleProviderApiKeyCatalog`、`supportsNativeStreamingUsageCompat`、`applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用 Provider HTTP/端点能力助手、Provider HTTP 错误和音频转录多部分表单助手 |
    | `plugin-sdk/provider-web-fetch-contract` | 窄网络获取配置/选择契约助手，如 `enablePluginInConfig` 和 `WebFetchProviderPlugin` |
    | `plugin-sdk/provider-web-fetch` | 网络获取 Provider 注册/缓存助手 |
    | `plugin-sdk/provider-web-search-config-contract` | 不需要 Plugin 启用接线的 Provider 的窄网络搜索配置/凭据助手 |
    | `plugin-sdk/provider-web-search-contract` | 窄网络搜索配置/凭据契约助手，如 `createWebSearchProviderContractFields`、`enablePluginInConfig`、`resolveProviderWebSearchPluginConfig` 和范围凭据设置器/获取器 |
    | `plugin-sdk/provider-web-search` | 网络搜索 Provider 注册/缓存/运行时助手 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`、`buildProviderToolCompatFamilyHooks`、Gemini Schema 清理 + 诊断和 xAI 兼容助手，如 `resolveXaiModelCompatPatch`/`applyXaiModelCompat` |
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
    | `plugin-sdk/security-runtime` | 共享信任、DM 门控、外部内容和密钥收集助手 |
    | `plugin-sdk/ssrf-policy` | 主机允许列表和私有网络 SSRF 策略助手 |
    | `plugin-sdk/ssrf-dispatcher` | 不带广泛基础设施运行时界面的窄固定调度器助手 |
    | `plugin-sdk/ssrf-runtime` | 固定调度器、有 SSRF 防护的获取和 SSRF 策略助手 |
    | `plugin-sdk/secret-input` | 密钥输入解析助手 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标助手 |
    | `plugin-sdk/webhook-request-guards` | 请求正文大小/超时助手 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 广泛的运行时/日志/备份/Plugin 安装助手 |
    | `plugin-sdk/runtime-env` | 窄运行时环境、日志记录器、超时、重试和退避助手 |
    | `plugin-sdk/channel-runtime-context` | 通用 Channel 运行时上下文注册和查找助手 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享 Plugin 命令/Hook/HTTP/交互助手 |
    | `plugin-sdk/hook-runtime` | 共享 Webhook/内部 Hook 管道助手 |
    | `plugin-sdk/lazy-runtime` | 懒惰运行时导入/绑定助手，如 `createLazyRuntimeModule`、`createLazyRuntimeMethod` 和 `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程执行助手 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待、版本、参数调用和懒惰命令组助手 |
    | `plugin-sdk/gateway-runtime` | Gateway 客户端和 Channel 状态补丁助手 |
    | `plugin-sdk/config-runtime` | 配置加载/写入助手和 Plugin 配置查找助手 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名/描述规范化和重复/冲突检查，即使 Bundle Telegram 契约界面不可用 |
    | `plugin-sdk/text-autolink-runtime` | 不带广泛文本运行时桶的文件引用自动链接检测 |
    | `plugin-sdk/approval-runtime` | 执行/Plugin 审批助手、审批能力构建器、身份验证/配置文件助手、原生路由/运行时助手和结构化审批显示路径格式化 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时助手、分块、调度、心跳、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 窄回复调度/最终确定和对话标签助手 |
    | `plugin-sdk/reply-history` | 共享短窗口回复历史助手，如 `buildHistoryContext`、`recordPendingHistoryEntry` 和 `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 窄文本/Markdown 分块助手 |
    | `plugin-sdk/session-store-runtime` | Session 存储路径 + 更新时间助手 |
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
    | `plugin-sdk/temp-path` | 共享临时下载路径助手 |
    | `plugin-sdk/logging-core` | 子系统日志记录器和编辑助手 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式和转换助手 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读/写助手 |
    | `plugin-sdk/file-lock` | 可重入文件锁助手 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存助手 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/Session 和回复调度助手 |
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
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 端点检测助手 |
    | `plugin-sdk/infra-runtime` | 系统事件/心跳助手 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存助手 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志和事件助手 |
    | `plugin-sdk/error-runtime` | 错误图形、格式化、共享错误分类助手、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包装获取、代理和固定查找助手 |
    | `plugin-sdk/runtime-fetch` | 不带代理/有防护获取导入的调度器感知运行时获取 |
    | `plugin-sdk/response-limit-runtime` | 不带广泛媒体运行时界面的有界响应正文读取器 |
    | `plugin-sdk/session-binding-runtime` | 不带已配置绑定路由或配对存储的当前对话绑定状态 |
    | `plugin-sdk/session-store-runtime` | 不带广泛配置写入/维护导入的 Session 存储读取助手 |
    | `plugin-sdk/context-visibility-runtime` | 不带广泛配置/安全导入的上下文可见性解析和补充上下文过滤 |
    | `plugin-sdk/string-coerce-runtime` | 不带 Markdown/日志导入的窄原语记录/字符串强制和规范化助手 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化助手 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器助手 |
    | `plugin-sdk/agent-runtime` | Agent 目录/身份/工作区助手 |
    | `plugin-sdk/directory-runtime` | 配置支持的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储助手加上媒体有效负载构建器 |
    | `plugin-sdk/media-store` | 窄媒体存储助手，如 `saveMediaBuffer` |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障转移助手、候选选择和缺失模型消息 |
    | `plugin-sdk/media-understanding` | 媒体理解 Provider 类型加上 Provider 面向的图像/音频助手导出 |
    | `plugin-sdk/text-runtime` | 共享文本/Markdown/日志助手，如助手可见文本剥离、Markdown 渲染/分块/表格助手、编辑助手、指令标签助手和安全文本工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块助手 |
    | `plugin-sdk/speech` | 语音 Provider 类型加上 Provider 面向的指令、注册表、验证和语音助手导出 |
    | `plugin-sdk/speech-core` | 共享语音 Provider 类型、注册表、指令、规范化和语音助手导出 |
    | `plugin-sdk/realtime-transcription` | 实时转录 Provider 类型、注册表助手和共享 WebSocket Session 助手 |
    | `plugin-sdk/realtime-voice` | 实时语音 Provider 类型和注册表助手 |
    | `plugin-sdk/image-generation` | 图像生成 Provider 类型 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障转移、身份验证和注册表助手 |
    | `plugin-sdk/music-generation` | 音乐生成 Provider/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障转移助手、Provider 查找和模型引用解析 |
    | `plugin-sdk/video-generation` | 视频生成 Provider/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障转移助手、Provider 查找和模型引用解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装助手 |
    | `plugin-sdk/webhook-path` | Webhook 路径规范化助手 |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载助手 |
    | `plugin-sdk/zod` | 为 Plugin SDK 消费者重新导出的 `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`、`shouldAckReaction` |
  </Accordion>

  <Accordion title="内存子路径">
    | 子路径 | 关键导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | Bundle 内存核心助手界面，用于管理器/配置/文件/CLI 助手 |
    | `plugin-sdk/memory-core-engine-runtime` | 内存索引/搜索运行时外观 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 内存主机基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 内存主机嵌入契约、注册表访问、本地 Provider 和通用批处理/远程助手 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 内存主机 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 内存主机存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 内存主机多模态助手 |
    | `plugin-sdk/memory-core-host-query` | 内存主机查询助手 |
    | `plugin-sdk/memory-core-host-secret` | 内存主机密钥助手 |
    | `plugin-sdk/memory-core-host-events` | 内存主机事件日志助手 |
    | `plugin-sdk/memory-core-host-status` | 内存主机状态助手 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 内存主机 CLI 运行时助手 |
    | `plugin-sdk/memory-core-host-runtime-core` | 内存主机核心运行时助手 |
    | `plugin-sdk/memory-core-host-runtime-files` | 内存主机文件/运行时助手 |
    | `plugin-sdk/memory-host-core` | 内存主机核心运行时助手的供应商中立别名 |
    | `plugin-sdk/memory-host-events` | 内存主机事件日志助手的供应商中立别名 |
    | `plugin-sdk/memory-host-files` | 内存主机文件/运行时助手的供应商中立别名 |
    | `plugin-sdk/memory-host-markdown` | 内存相邻 Plugin 的共享托管 Markdown 助手 |
    | `plugin-sdk/memory-host-search` | 用于搜索管理器访问的活动内存运行时外观 |
    | `plugin-sdk/memory-host-status` | 内存主机状态助手的供应商中立别名 |
    | `plugin-sdk/memory-lancedb` | Bundle 内存 lancedb 助手界面 |
  </Accordion>

  <Accordion title="保留的 Bundle 助手子路径">
    | 系列 | 当前子路径 | 预期用途 |
    | --- | --- | --- |
    | 浏览器 | `plugin-sdk/browser-cdp`、`plugin-sdk/browser-config-runtime`、`plugin-sdk/browser-config-support`、`plugin-sdk/browser-control-auth`、`plugin-sdk/browser-node-runtime`、`plugin-sdk/browser-profiles`、`plugin-sdk/browser-security-runtime`、`plugin-sdk/browser-setup-tools`、`plugin-sdk/browser-support` | Bundle 浏览器 Plugin 支持助手。`browser-profiles` 导出 `resolveBrowserConfig`、`resolveProfile`、`ResolvedBrowserConfig`、`ResolvedBrowserProfile` 和 `ResolvedBrowserTabCleanupConfig`，用于规范化的 `browser.tabCleanup` 形态。`browser-support` 保留为兼容性桶。 |
    | Matrix | `plugin-sdk/matrix`、`plugin-sdk/matrix-helper`、`plugin-sdk/matrix-runtime-heavy`、`plugin-sdk/matrix-runtime-shared`、`plugin-sdk/matrix-runtime-surface`、`plugin-sdk/matrix-surface`、`plugin-sdk/matrix-thread-bindings` | Bundle Matrix 助手/运行时界面 |
    | Line | `plugin-sdk/line`、`plugin-sdk/line-core`、`plugin-sdk/line-runtime`、`plugin-sdk/line-surface` | Bundle LINE 助手/运行时界面 |
    | IRC | `plugin-sdk/irc`、`plugin-sdk/irc-surface` | Bundle IRC 助手界面 |
    | Channel 特定助手 | `plugin-sdk/googlechat`、`plugin-sdk/zalouser`、`plugin-sdk/bluebubbles`、`plugin-sdk/bluebubbles-policy`、`plugin-sdk/mattermost`、`plugin-sdk/mattermost-policy`、`plugin-sdk/feishu-conversation`、`plugin-sdk/msteams`、`plugin-sdk/nextcloud-talk`、`plugin-sdk/nostr`、`plugin-sdk/tlon`、`plugin-sdk/twitch` | Bundle Channel 兼容/助手接缝 |
    | 身份验证/Plugin 特定助手 | `plugin-sdk/github-copilot-login`、`plugin-sdk/github-copilot-token`、`plugin-sdk/diagnostics-otel`、`plugin-sdk/diagnostics-prometheus`、`plugin-sdk/diffs`、`plugin-sdk/llm-task`、`plugin-sdk/thread-ownership`、`plugin-sdk/voice-call` | Bundle 功能/Plugin 助手接缝；`plugin-sdk/github-copilot-token` 当前导出 `DEFAULT_COPILOT_API_BASE_URL`、`deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## 相关

- [Plugin SDK 概览](/plugins/sdk-overview)
- [Plugin SDK 设置](/plugins/sdk-setup)
- [构建 Plugin](/plugins/building-plugins)
