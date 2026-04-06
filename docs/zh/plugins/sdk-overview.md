---
mmh3_hash: "5cc14deaa71cbb2de0c577d15257ab14"
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
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
```

每个子路径都是一个小型自包含模块。这保持了启动速度并防止循环依赖问题。对于 Channel 特定的入口/构建辅助工具，优先使用 `openclaw/plugin-sdk/channel-core`；将 `openclaw/plugin-sdk/core` 保留用于更广泛的伞形接口和共享辅助工具，如 `buildChannelConfigSchema`。

不要添加或依赖 Provider 命名的便利接口，如 `openclaw/plugin-sdk/slack`、`openclaw/plugin-sdk/discord`、`openclaw/plugin-sdk/signal`、`openclaw/plugin-sdk/whatsapp` 或 Channel 品牌的辅助接口。打包 Plugin 应该在自己的 `api.ts` 或 `runtime-api.ts` barrel 中组合通用 SDK 子路径，核心应该使用那些 Plugin 本地 barrel 或在需求真正是跨 Channel 时添加窄泛型 SDK 契约。

生成的导出映射仍然包含少量打包 Plugin 辅助接口，如 `plugin-sdk/feishu`、`plugin-sdk/feishu-setup`、`plugin-sdk/zalo`、`plugin-sdk/zalo-setup` 和 `plugin-sdk/matrix*`。这些子路径仅用于打包 Plugin 维护和兼容性；它们有意从下面的常用表中省略，不是新第三方 Plugin 的推荐导入路径。

## 子路径参考

按用途分组的最常用子路径。完整的 200+ 子路径生成列表在 `scripts/lib/plugin-sdk-entrypoints.json` 中。

保留的打包 Plugin 辅助子路径仍然出现在该生成列表中。将这些视为实现细节/兼容性接口，除非文档页面明确将其提升为公共接口。

### Plugin 入口

| 子路径                      | 主要导出                                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/plugin-entry`   | `definePluginEntry`                                                                                                                    |
| `plugin-sdk/core`           | `defineChannelPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase`, `defineSetupPluginEntry`, `buildChannelConfigSchema` |
| `plugin-sdk/config-schema`  | `OpenClawSchema`                                                                                                                       |
| `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry`                                                                                                      |

<AccordionGroup>
  <Accordion title="Channel 子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/channel-core` | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
    | `plugin-sdk/config-schema` | 根 `openclaw.json` Zod 模式导出（`OpenClawSchema`） |
    | `plugin-sdk/channel-setup` | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, 以及 `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
    | `plugin-sdk/setup` | 共享设置向导辅助工具，允许列表提示，设置状态构建器 |
    | `plugin-sdk/setup-runtime` | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
    | `plugin-sdk/setup-adapter-runtime` | `createEnvPatchedAccountSetupAdapter` |
    | `plugin-sdk/setup-tools` | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
    | `plugin-sdk/account-core` | 多账户配置/动作门辅助工具，默认账户回退辅助工具 |
    | `plugin-sdk/account-id` | `DEFAULT_ACCOUNT_ID`，账户 id 规范化辅助工具 |
    | `plugin-sdk/account-resolution` | 账户查找 + 默认回退辅助工具 |
    | `plugin-sdk/account-helpers` | 窄账户列表/账户动作辅助工具 |
    | `plugin-sdk/channel-pairing` | `createChannelPairingController` |
    | `plugin-sdk/channel-reply-pipeline` | `createChannelReplyPipeline` |
    | `plugin-sdk/channel-config-helpers` | `createHybridChannelConfigAdapter` |
    | `plugin-sdk/channel-config-schema` | Channel 配置模式类型 |
    | `plugin-sdk/telegram-command-config` | Telegram 自定义命令规范化/验证辅助工具，带打包契约回退 |
    | `plugin-sdk/channel-policy` | `resolveChannelGroupRequireMention` |
    | `plugin-sdk/channel-lifecycle` | `createAccountStatusSink` |
    | `plugin-sdk/inbound-envelope` | 共享入站路由 + 信封构建器辅助工具 |
    | `plugin-sdk/inbound-reply-dispatch` | 共享入站记录和分发辅助工具 |
    | `plugin-sdk/messaging-targets` | 目标解析/匹配辅助工具 |
    | `plugin-sdk/outbound-media` | 共享出站媒体加载辅助工具 |
    | `plugin-sdk/outbound-runtime` | 出站身份/发送委托辅助工具 |
    | `plugin-sdk/thread-bindings-runtime` | 线程绑定生命周期和适配器辅助工具 |
    | `plugin-sdk/agent-media-payload` | 旧版 Agent 媒体有效载荷构建器 |
    | `plugin-sdk/conversation-runtime` | 对话/线程绑定、配对和已配置绑定辅助工具 |
    | `plugin-sdk/runtime-config-snapshot` | 运行时配置快照辅助工具 |
    | `plugin-sdk/runtime-group-policy` | 运行时组策略解析辅助工具 |
    | `plugin-sdk/channel-status` | 共享 Channel 状态快照/摘要辅助工具 |
    | `plugin-sdk/channel-config-primitives` | 窄 Channel 配置模式原语 |
    | `plugin-sdk/channel-config-writes` | Channel 配置写入授权辅助工具 |
    | `plugin-sdk/channel-plugin-common` | 共享 Channel Plugin 前导导出 |
    | `plugin-sdk/allowlist-config-edit` | 允许列表配置编辑/读取辅助工具 |
    | `plugin-sdk/group-access` | 共享组访问决策辅助工具 |
    | `plugin-sdk/direct-dm` | 共享直接 DM 身份验证/守护辅助工具 |
    | `plugin-sdk/interactive-runtime` | 交互式回复有效载荷规范化/减少辅助工具 |
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
    | `plugin-sdk/provider-entry` | `defineSingleProviderPluginEntry` |
    | `plugin-sdk/provider-setup` | 精选的本地/自托管 Provider 设置辅助工具 |
    | `plugin-sdk/self-hosted-provider-setup` | 专注的 OpenAI 兼容自托管 Provider 设置辅助工具 |
    | `plugin-sdk/provider-auth-runtime` | Provider Plugin 的运行时 API 密钥解析辅助工具 |
    | `plugin-sdk/provider-auth-api-key` | API 密钥入门/配置文件写入辅助工具 |
    | `plugin-sdk/provider-auth-result` | 标准 OAuth 身份验证结果构建器 |
    | `plugin-sdk/provider-auth-login` | Provider Plugin 的共享交互式登录辅助工具 |
    | `plugin-sdk/provider-env-vars` | Provider 身份验证环境变量查找辅助工具 |
    | `plugin-sdk/provider-auth` | `createProviderApiKeyAuthMethod`, `ensureApiKeyFromOptionEnvOrPrompt`, `upsertAuthProfile` |
    | `plugin-sdk/provider-model-shared` | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, 共享重放策略构建器，Provider 端点辅助工具，以及模型 id 规范化辅助工具（如 `normalizeNativeXaiModelId`） |
    | `plugin-sdk/provider-catalog-shared` | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
    | `plugin-sdk/provider-http` | 通用 Provider HTTP/端点能力辅助工具 |
    | `plugin-sdk/provider-web-fetch` | Web 抓取 Provider 注册/缓存辅助工具 |
    | `plugin-sdk/provider-web-search` | Web 搜索 Provider 注册/缓存/配置辅助工具 |
    | `plugin-sdk/provider-tools` | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, Gemini 模式清理 + 诊断，以及 xAI 兼容辅助工具（如 `resolveXaiModelCompatPatch` / `applyXaiModelCompat`） |
    | `plugin-sdk/provider-usage` | `fetchClaudeUsage` 等 |
    | `plugin-sdk/provider-stream` | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, 流包装类型，以及共享的 Anthropic/Bedrock/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot 包装器辅助工具 |
    | `plugin-sdk/provider-onboard` | 入门配置补丁辅助工具 |
    | `plugin-sdk/global-singleton` | 进程本地单例/映射/缓存辅助工具 |
  </Accordion>

  <Accordion title="身份验证和安全子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/command-auth` | `resolveControlCommandGate`, 命令注册表辅助工具，发送者授权辅助工具 |
    | `plugin-sdk/approval-auth-runtime` | 审批者解析和同聊动作身份验证辅助工具 |
    | `plugin-sdk/approval-client-runtime` | 原生执行批准配置文件/过滤器辅助工具 |
    | `plugin-sdk/approval-delivery-runtime` | 原生批准能力/传递适配器 |
    | `plugin-sdk/approval-native-runtime` | 原生批准目标 + 账户绑定辅助工具 |
    | `plugin-sdk/approval-reply-runtime` | 执行/Plugin 批准回复有效载荷辅助工具 |
    | `plugin-sdk/command-auth-native` | 原生命令身份验证 + 原生会话目标辅助工具 |
    | `plugin-sdk/command-detection` | 共享命令检测辅助工具 |
    | `plugin-sdk/command-surface` | 命令体规范化和命令接口辅助工具 |
    | `plugin-sdk/allow-from` | `formatAllowFromLowercase` |
    | `plugin-sdk/security-runtime` | 共享信任、DM 门控、外部内容和密钥收集辅助工具 |
    | `plugin-sdk/ssrf-policy` | 主机允许列表和私有网络 SSRF 策略辅助工具 |
    | `plugin-sdk/ssrf-runtime` | 固定分发器、SSRF 受保护获取和 SSRF 策略辅助工具 |
    | `plugin-sdk/secret-input` | 密钥输入解析辅助工具 |
    | `plugin-sdk/webhook-ingress` | Webhook 请求/目标辅助工具 |
    | `plugin-sdk/webhook-request-guards` | 请求体大小/超时辅助工具 |
  </Accordion>

  <Accordion title="运行时和存储子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/runtime` | 广泛的运行时/日志记录/备份/Plugin 安装辅助工具 |
    | `plugin-sdk/runtime-env` | 窄运行时环境、日志记录器、超时、重试和退避辅助工具 |
    | `plugin-sdk/runtime-store` | `createPluginRuntimeStore` |
    | `plugin-sdk/plugin-runtime` | 共享 Plugin 命令/Hook/HTTP/交互辅助工具 |
    | `plugin-sdk/hook-runtime` | 共享 Webhook/内部 Hook 管道辅助工具 |
    | `plugin-sdk/lazy-runtime` | 延迟运行时导入/绑定辅助工具，如 `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeSurface` |
    | `plugin-sdk/process-runtime` | 进程执行辅助工具 |
    | `plugin-sdk/cli-runtime` | CLI 格式化、等待和版本辅助工具 |
    | `plugin-sdk/gateway-runtime` | Gateway 客户端和 Channel 状态补丁辅助工具 |
    | `plugin-sdk/config-runtime` | 配置加载/写入辅助工具 |
    | `plugin-sdk/telegram-command-config` | Telegram 命令名称/描述规范化和重复/冲突检查，即使打包的 Telegram 契约接口不可用 |
    | `plugin-sdk/approval-runtime` | 执行/Plugin 批准辅助工具，批准能力构建器，身份验证/配置文件辅助工具，原生路由/运行时辅助工具 |
    | `plugin-sdk/reply-runtime` | 共享入站/回复运行时辅助工具、分块、分发、心跳、回复规划器 |
    | `plugin-sdk/reply-dispatch-runtime` | 窄回复分发/最终化辅助工具 |
    | `plugin-sdk/reply-history` | 共享短窗口回复历史辅助工具，如 `buildHistoryContext`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
    | `plugin-sdk/reply-reference` | `createReplyReferencePlanner` |
    | `plugin-sdk/reply-chunking` | 窄文本/Markdown 分块辅助工具 |
    | `plugin-sdk/session-store-runtime` | 会话存储路径 + 更新时间辅助工具 |
    | `plugin-sdk/state-paths` | 状态/OAuth 目录路径辅助工具 |
    | `plugin-sdk/routing` | 路由/会话键/账户绑定辅助工具，如 `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId` |
    | `plugin-sdk/status-helpers` | 共享 Channel/账户状态摘要辅助工具、运行时状态默认值和问题元数据辅助工具 |
    | `plugin-sdk/target-resolver-runtime` | 共享目标解析器辅助工具 |
    | `plugin-sdk/string-normalization-runtime` | Slug/字符串规范化辅助工具 |
    | `plugin-sdk/request-url` | 从 fetch/请求类输入中提取字符串 URL |
    | `plugin-sdk/run-command` | 带规范化 stdout/stderr 结果的定时命令运行器 |
    | `plugin-sdk/param-readers` | 常用 Tool/CLI 参数读取器 |
    | `plugin-sdk/tool-send` | 从 Tool 参数中提取规范发送目标字段 |
    | `plugin-sdk/temp-path` | 共享临时下载路径辅助工具 |
    | `plugin-sdk/logging-core` | 子系统日志记录器和编辑辅助工具 |
    | `plugin-sdk/markdown-table-runtime` | Markdown 表格模式辅助工具 |
    | `plugin-sdk/json-store` | 小型 JSON 状态读/写辅助工具 |
    | `plugin-sdk/file-lock` | 可重入文件锁辅助工具 |
    | `plugin-sdk/persistent-dedupe` | 磁盘支持的去重缓存辅助工具 |
    | `plugin-sdk/acp-runtime` | ACP 运行时/会话和回复分发辅助工具 |
    | `plugin-sdk/agent-config-primitives` | 窄 Agent 运行时配置模式原语 |
    | `plugin-sdk/boolean-param` | 宽松布尔参数读取器 |
    | `plugin-sdk/dangerous-name-runtime` | 危险名称匹配解析辅助工具 |
    | `plugin-sdk/device-bootstrap` | 设备引导和配对令牌辅助工具 |
    | `plugin-sdk/extension-shared` | 共享被动 Channel 和状态辅助原语 |
    | `plugin-sdk/models-provider-runtime` | `/models` 命令/Provider 回复辅助工具 |
    | `plugin-sdk/skill-commands-runtime` | Skill 命令列表辅助工具 |
    | `plugin-sdk/native-command-registry` | 原生命令注册表/构建/序列化辅助工具 |
    | `plugin-sdk/provider-zai-endpoint` | Z.AI 端点检测辅助工具 |
    | `plugin-sdk/infra-runtime` | 系统事件/心跳辅助工具 |
    | `plugin-sdk/collection-runtime` | 小型有界缓存辅助工具 |
    | `plugin-sdk/diagnostic-runtime` | 诊断标志和事件辅助工具 |
    | `plugin-sdk/error-runtime` | 错误图、格式化、共享错误分类辅助工具、`isApprovalNotFoundError` |
    | `plugin-sdk/fetch-runtime` | 包装的 fetch、代理和固定查找辅助工具 |
    | `plugin-sdk/host-runtime` | 主机名和 SCP 主机规范化辅助工具 |
    | `plugin-sdk/retry-runtime` | 重试配置和重试运行器辅助工具 |
    | `plugin-sdk/agent-runtime` | Agent 目录/身份/工作区辅助工具 |
    | `plugin-sdk/directory-runtime` | 配置支持的目录查询/去重 |
    | `plugin-sdk/keyed-async-queue` | `KeyedAsyncQueue` |
  </Accordion>

  <Accordion title="能力和测试子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/media-runtime` | 共享媒体获取/转换/存储辅助工具以及媒体有效载荷构建器 |
    | `plugin-sdk/media-generation-runtime` | 共享媒体生成故障转移辅助工具、候选选择和缺失模型消息 |
    | `plugin-sdk/media-understanding` | 媒体理解 Provider 类型以及面向 Provider 的图像/音频辅助工具导出 |
    | `plugin-sdk/text-runtime` | 共享文本/Markdown/日志记录辅助工具，如助手可见文本删除、Markdown 渲染/分块/表格辅助工具、编辑辅助工具、指令标签辅助工具和安全文本工具 |
    | `plugin-sdk/text-chunking` | 出站文本分块辅助工具 |
    | `plugin-sdk/speech` | 语音 Provider 类型以及面向 Provider 的指令、注册表和验证辅助工具 |
    | `plugin-sdk/speech-core` | 共享语音 Provider 类型、注册表、指令和规范化辅助工具 |
    | `plugin-sdk/realtime-transcription` | 实时转录 Provider 类型和注册表辅助工具 |
    | `plugin-sdk/realtime-voice` | 实时语音 Provider 类型和注册表辅助工具 |
    | `plugin-sdk/image-generation` | 图像生成 Provider 类型 |
    | `plugin-sdk/image-generation-core` | 共享图像生成类型、故障转移、身份验证和注册表辅助工具 |
    | `plugin-sdk/music-generation` | 音乐生成 Provider/请求/结果类型 |
    | `plugin-sdk/music-generation-core` | 共享音乐生成类型、故障转移辅助工具、Provider 查找和模型引用解析 |
    | `plugin-sdk/video-generation` | 视频生成 Provider/请求/结果类型 |
    | `plugin-sdk/video-generation-core` | 共享视频生成类型、故障转移辅助工具、Provider 查找和模型引用解析 |
    | `plugin-sdk/webhook-targets` | Webhook 目标注册表和路由安装辅助工具 |
    | `plugin-sdk/webhook-path` | Webhook 路径规范化辅助工具 |
    | `plugin-sdk/web-media` | 共享远程/本地媒体加载辅助工具 |
    | `plugin-sdk/zod` | 为 Plugin SDK 消费者重新导出 `zod` |
    | `plugin-sdk/testing` | `installCommonResolveTargetErrorCases`, `shouldAckReaction` |
  </Accordion>

  <Accordion title="内存子路径">
    | 子路径 | 主要导出 |
    | --- | --- |
    | `plugin-sdk/memory-core` | 打包的内存核心辅助接口，用于管理器/配置/文件/CLI 辅助工具 |
    | `plugin-sdk/memory-core-engine-runtime` | 内存索引/搜索运行时外观 |
    | `plugin-sdk/memory-core-host-engine-foundation` | 内存主机基础引擎导出 |
    | `plugin-sdk/memory-core-host-engine-embeddings` | 内存主机嵌入引擎导出 |
    | `plugin-sdk/memory-core-host-engine-qmd` | 内存主机 QMD 引擎导出 |
    | `plugin-sdk/memory-core-host-engine-storage` | 内存主机存储引擎导出 |
    | `plugin-sdk/memory-core-host-multimodal` | 内存主机多模态辅助工具 |
    | `plugin-sdk/memory-core-host-query` | 内存主机查询辅助工具 |
    | `plugin-sdk/memory-core-host-secret` | 内存主机密钥辅助工具 |
    | `plugin-sdk/memory-core-host-events` | 内存主机事件日志辅助工具 |
    | `plugin-sdk/memory-core-host-status` | 内存主机状态辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-cli` | 内存主机 CLI 运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-core` | 内存主机核心运行时辅助工具 |
    | `plugin-sdk/memory-core-host-runtime-files` | 内存主机文件/运行时辅助工具 |
    | `plugin-sdk/memory-host-core` | 内存主机核心运行时辅助工具的厂商中立别名 |
    | `plugin-sdk/memory-host-events` | 内存主机事件日志辅助工具的厂商中立别名 |
    | `plugin-sdk/memory-host-files` | 内存主机文件/运行时辅助工具的厂商中立别名 |
    | `plugin-sdk/memory-host-markdown` | 内存相邻 Plugin 的共享托管 Markdown 辅助工具 |
    | `plugin-sdk/memory-host-search` | 搜索管理器访问的活跃内存运行时外观 |
    | `plugin-sdk/memory-host-status` | 内存主机状态辅助工具的厂商中立别名 |
    | `plugin-sdk/memory-lancedb` | 打包的 memory-lancedb 辅助接口 |
  </Accordion>

  <Accordion title="保留的打包辅助子路径">
    | 系列 | 当前子路径 | 预期用途 |
    | --- | --- | --- |
    | 浏览器 | `plugin-sdk/browser-cdp`, `plugin-sdk/browser-config-runtime`, `plugin-sdk/browser-config-support`, `plugin-sdk/browser-control-auth`, `plugin-sdk/browser-node-runtime`, `plugin-sdk/browser-profiles`, `plugin-sdk/browser-security-runtime`, `plugin-sdk/browser-setup-tools`, `plugin-sdk/browser-support` | 打包浏览器 Plugin 支持辅助工具（`browser-support` 保留为兼容性 barrel） |
    | Matrix | `plugin-sdk/matrix`, `plugin-sdk/matrix-helper`, `plugin-sdk/matrix-runtime-heavy`, `plugin-sdk/matrix-runtime-shared`, `plugin-sdk/matrix-runtime-surface`, `plugin-sdk/matrix-surface`, `plugin-sdk/matrix-thread-bindings` | 打包 Matrix 辅助/运行时接口 |
    | LINE | `plugin-sdk/line`, `plugin-sdk/line-core`, `plugin-sdk/line-runtime`, `plugin-sdk/line-surface` | 打包 LINE 辅助/运行时接口 |
    | IRC | `plugin-sdk/irc`, `plugin-sdk/irc-surface` | 打包 IRC 辅助接口 |
    | Channel 特定辅助工具 | `plugin-sdk/googlechat`, `plugin-sdk/zalouser`, `plugin-sdk/bluebubbles`, `plugin-sdk/bluebubbles-policy`, `plugin-sdk/mattermost`, `plugin-sdk/mattermost-policy`, `plugin-sdk/feishu-conversation`, `plugin-sdk/msteams`, `plugin-sdk/nextcloud-talk`, `plugin-sdk/nostr`, `plugin-sdk/tlon`, `plugin-sdk/twitch` | 打包 Channel 兼容/辅助接口 |
    | 身份验证/Plugin 特定辅助工具 | `plugin-sdk/github-copilot-login`, `plugin-sdk/github-copilot-token`, `plugin-sdk/diagnostics-otel`, `plugin-sdk/diffs`, `plugin-sdk/llm-task`, `plugin-sdk/thread-ownership`, `plugin-sdk/voice-call` | 打包功能/Plugin 辅助接口；`plugin-sdk/github-copilot-token` 目前导出 `DEFAULT_COPILOT_API_BASE_URL`, `deriveCopilotApiBaseUrlFromToken` 和 `resolveCopilotApiToken` |
  </Accordion>
</AccordionGroup>

## 注册 API

`register(api)` 回调接收具有以下方法的 `OpenClawPluginApi` 对象：

### 能力注册

| 方法                                             | 注册内容                   |
| ------------------------------------------------ | -------------------------- |
| `api.registerProvider(...)`                      | 文本推理 (LLM)             |
| `api.registerChannel(...)`                       | 消息 Channel               |
| `api.registerSpeechProvider(...)`                | 文字转语音 / STT 合成      |
| `api.registerRealtimeTranscriptionProvider(...)` | 流式实时转录               |
| `api.registerRealtimeVoiceProvider(...)`         | 双工实时语音会话           |
| `api.registerMediaUnderstandingProvider(...)`    | 图像/音频/视频分析         |
| `api.registerImageGenerationProvider(...)`       | 图像生成                   |
| `api.registerMusicGenerationProvider(...)`       | 音乐生成                   |
| `api.registerVideoGenerationProvider(...)`       | 视频生成                   |
| `api.registerWebFetchProvider(...)`              | Web 抓取/爬虫 Provider     |
| `api.registerWebSearchProvider(...)`             | Web 搜索                   |

### Tool 和命令

| 方法                            | 注册内容                                       |
| ------------------------------- | ---------------------------------------------- |
| `api.registerTool(tool, opts?)` | Agent Tool（必需或 `{ optional: true }`）      |
| `api.registerCommand(def)`      | 自定义命令（绕过 LLM）                         |

### 基础设施

| 方法                                           | 注册内容                          |
| ---------------------------------------------- | --------------------------------- |
| `api.registerHook(events, handler, opts?)`     | 事件 Hook                         |
| `api.registerHttpRoute(params)`                | Gateway HTTP 端点                 |
| `api.registerGatewayMethod(name, handler)`     | Gateway RPC 方法                  |
| `api.registerCli(registrar, opts?)`            | CLI 子命令                        |
| `api.registerService(service)`                 | 后台服务                          |
| `api.registerInteractiveHandler(registration)` | 交互式处理程序                    |
| `api.registerMemoryPromptSupplement(builder)`  | 附加的内存相邻 Prompt 部分        |
| `api.registerMemoryCorpusSupplement(adapter)`  | 附加的内存搜索/读取语料库         |

保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终保持 `operator.admin`，即使 Plugin 尝试分配更窄的 Gateway 方法范围。对于 Plugin 拥有的方法，优先使用 Plugin 特定前缀。

### CLI 注册元数据

`api.registerCli(registrar, opts?)` 接受两种顶级元数据：

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

仅在不需要延迟根 CLI 注册时单独使用 `commands`。该急切兼容路径仍然受支持，但不会为解析时延迟加载安装描述符支持的占位符。

### 专有槽

| 方法                                       | 注册内容                        |
| ------------------------------------------ | ------------------------------- |
| `api.registerContextEngine(id, factory)`   | 上下文引擎（一次一个活跃）      |
| `api.registerMemoryPromptSection(builder)` | 内存 Prompt 部分构建器          |
| `api.registerMemoryFlushPlan(resolver)`    | 内存刷新计划解析器              |
| `api.registerMemoryRuntime(runtime)`       | 内存运行时适配器                |

### 内存嵌入适配器

| 方法                                           | 注册内容                                       |
| ---------------------------------------------- | ---------------------------------------------- |
| `api.registerMemoryEmbeddingProvider(adapter)` | 活跃 Plugin 的内存嵌入适配器                   |

- `registerMemoryPromptSection`、`registerMemoryFlushPlan` 和 `registerMemoryRuntime` 专属于内存 Plugin。
- `registerMemoryEmbeddingProvider` 让活跃内存 Plugin 注册一个或多个嵌入适配器 id（例如 `openai`、`gemini` 或自定义 Plugin 定义的 id）。
- 用户配置（如 `agents.defaults.memorySearch.provider` 和 `agents.defaults.memorySearch.fallback`）根据那些已注册的适配器 id 解析。

### 事件和生命周期

| 方法                                         | 功能                      |
| -------------------------------------------- | ------------------------- |
| `api.on(hookName, handler, opts?)`           | 类型化生命周期 Hook       |
| `api.onConversationBindingResolved(handler)` | 对话绑定回调              |

### Hook 决策语义

- `before_tool_call`：返回 `{ block: true }` 是终止的。一旦任何处理程序设置它，较低优先级的处理程序将被跳过。
- `before_tool_call`：返回 `{ block: false }` 被视为无决策（与省略 `block` 相同），不是覆盖。
- `before_install`：返回 `{ block: true }` 是终止的。一旦任何处理程序设置它，较低优先级的处理程序将被跳过。
- `before_install`：返回 `{ block: false }` 被视为无决策（与省略 `block` 相同），不是覆盖。
- `reply_dispatch`：返回 `{ handled: true, ... }` 是终止的。一旦任何处理程序声明分发，较低优先级的处理程序和默认模型分发路径将被跳过。
- `message_sending`：返回 `{ cancel: true }` 是终止的。一旦任何处理程序设置它，较低优先级的处理程序将被跳过。
- `message_sending`：返回 `{ cancel: false }` 被视为无决策（与省略 `cancel` 相同），不是覆盖。

### API 对象字段

| 字段                     | 类型                      | 描述                                                                                  |
| ------------------------ | ------------------------- | ------------------------------------------------------------------------------------- |
| `api.id`                 | `string`                  | Plugin id                                                                             |
| `api.name`               | `string`                  | 显示名称                                                                              |
| `api.version`            | `string?`                 | Plugin 版本（可选）                                                                   |
| `api.description`        | `string?`                 | Plugin 描述（可选）                                                                   |
| `api.source`             | `string`                  | Plugin 来源路径                                                                       |
| `api.rootDir`            | `string?`                 | Plugin 根目录（可选）                                                                 |
| `api.config`             | `OpenClawConfig`          | 当前配置快照（可用时为活跃的内存运行时快照）                                          |
| `api.pluginConfig`       | `Record<string, unknown>` | 来自 `plugins.entries.<id>.config` 的 Plugin 特定配置                                |
| `api.runtime`            | `PluginRuntime`           | [运行时辅助工具](/plugins/sdk-runtime)                                                |
| `api.logger`             | `PluginLogger`            | 作用域日志记录器（`debug`、`info`、`warn`、`error`）                                  |
| `api.registrationMode`   | `PluginRegistrationMode`  | 当前加载模式；`"setup-runtime"` 是完整入口启动/设置之前的轻量级窗口                   |
| `api.resolvePath(input)` | `(string) => string`      | 相对于 Plugin 根目录解析路径                                                          |

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

外观加载的打包 Plugin 公共接口（`api.ts`、`runtime-api.ts`、`index.ts`、`setup-entry.ts` 和类似公共入口文件）现在在 OpenClaw 已经运行时优先使用活跃的运行时配置快照。如果尚无运行时快照，它们回退到磁盘上解析的配置文件。

Provider Plugin 也可以在辅助工具有意针对 Provider 并尚未属于通用 SDK 子路径时暴露窄 Plugin 本地契约 barrel。当前打包示例：Anthropic Provider 将其 Claude 流辅助工具保留在自己的公共 `api.ts`/`contract-api.ts` 接口中，而不是将 Anthropic beta 标头和 `service_tier` 逻辑提升到通用 `plugin-sdk/*` 契约中。

其他当前打包示例：

- `@openclaw/openai-provider`：`api.ts` 导出 Provider 构建器、默认模型辅助工具和实时 Provider 构建器
- `@openclaw/openrouter-provider`：`api.ts` 导出 Provider 构建器以及入门/配置辅助工具

<Warning>
  扩展生产代码也应避免 `openclaw/plugin-sdk/<other-plugin>` 导入。如果辅助工具真正是共享的，请将其提升到中性 SDK 子路径，如 `openclaw/plugin-sdk/speech`、`.../provider-model-shared` 或其他面向能力的接口，而不是将两个 Plugin 耦合在一起。
</Warning>

## 相关

- [入口点](/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry` 选项
- [运行时辅助工具](/plugins/sdk-runtime) — 完整 `api.runtime` 命名空间参考
- [设置和配置](/plugins/sdk-setup) — 打包、清单、配置模式
- [测试](/plugins/sdk-testing) — 测试工具和 lint 规则
- [SDK 迁移](/plugins/sdk-migration) — 从已弃用接口迁移
- [Plugin 内部架构](/plugins/architecture) — 深度架构和能力模型
