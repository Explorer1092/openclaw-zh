---
mmh3_hash: "88b951ae1042cfcf7237350b5b9f14ab"
summary: "Plugin 内部架构：能力模型、所有权、契约、加载管道和运行时辅助工具"
read_when:
  - 构建或调试原生 OpenClaw Plugin
  - 了解 Plugin 能力模型或所有权边界
  - 研究 Plugin 加载管道或注册表
  - 实现 Provider 运行时 Hook 或 Channel Plugin
title: "Plugin 内部架构"
sidebarTitle: "内部架构"
---

# Plugin 内部架构

<Info>
  这是**深度架构参考文档**。如需实操指南，请参见：
  - [安装和使用 Plugin](/tools/plugin) — 用户指南
  - [入门指南](/plugins/building-plugins) — 第一个 Plugin 教程
  - [Channel Plugin](/plugins/sdk-channel-plugins) — 构建消息频道
  - [Provider Plugin](/plugins/sdk-provider-plugins) — 构建模型提供商
  - [SDK 概览](/plugins/sdk-overview) — 导入映射和注册 API
</Info>

本页介绍 OpenClaw Plugin 系统的内部架构。

## 公共能力模型

能力是 OpenClaw 内部原生 Plugin 的公共模型。每个原生 OpenClaw Plugin 都向一个或多个能力类型注册：

| 能力               | 注册方法                                              | 示例 Plugin                      |
| ------------------ | ----------------------------------------------------- | -------------------------------- |
| 文本推理           | `api.registerProvider(...)`                           | `openai`, `anthropic`            |
| 语音               | `api.registerSpeechProvider(...)`                     | `elevenlabs`, `microsoft`        |
| 实时转录           | `api.registerRealtimeTranscriptionProvider(...)`      | `openai`                         |
| 实时语音           | `api.registerRealtimeVoiceProvider(...)`              | `openai`                         |
| 媒体理解           | `api.registerMediaUnderstandingProvider(...)`         | `openai`, `google`               |
| 图像生成           | `api.registerImageGenerationProvider(...)`            | `openai`, `google`, `fal`, `minimax` |
| 音乐生成           | `api.registerMusicGenerationProvider(...)`            | `google`, `minimax`              |
| 视频生成           | `api.registerVideoGenerationProvider(...)`            | `qwen`                           |
| Web 抓取           | `api.registerWebFetchProvider(...)`                   | `firecrawl`                      |
| Web 搜索           | `api.registerWebSearchProvider(...)`                  | `google`                         |
| Channel / 消息     | `api.registerChannel(...)`                            | `msteams`, `matrix`              |

注册零个能力但提供 Hook、Tool 或服务的 Plugin 是**旧版仅 Hook** Plugin。该模式仍然完全受支持。

### 外部兼容性立场

能力模型已落地于核心并被打包/原生 Plugin 使用，但外部 Plugin 的兼容性仍需要比"已导出即已冻结"更严格的标准。

当前指导原则：

- **现有外部 Plugin：** 保持基于 Hook 的集成正常工作；将此视为兼容性基线
- **新的打包/原生 Plugin：** 优先选择显式能力注册而非特定厂商的直接访问或新的仅 Hook 设计
- **采用能力注册的外部 Plugin：** 允许，但将能力特定的辅助功能接口视为不断演进的，除非文档明确将契约标记为稳定

实际规则：

- 能力注册 API 是预期方向
- 旧版 Hook 在过渡期间仍是外部 Plugin 最安全的无破坏性路径
- 导出的辅助子路径并非全部相同；优先使用文档化的窄契约，而非偶然的辅助导出

### Plugin 形态

OpenClaw 根据实际注册行为（而非仅静态元数据）将每个已加载的 Plugin 分类为一种形态：

- **plain-capability** — 恰好注册一种能力类型（例如仅 Provider 的 Plugin 如 `mistral`）
- **hybrid-capability** — 注册多种能力类型（例如 `openai` 拥有文本推理、语音、媒体理解和图像生成）
- **hook-only** — 仅注册 Hook（类型化或自定义），没有能力、Tool、命令或服务
- **non-capability** — 注册 Tool、命令、服务或路由，但没有能力

使用 `openclaw plugins inspect <id>` 查看 Plugin 的形态和能力详情。详见 [CLI 参考](/cli/plugins#inspect)。

### 旧版 Hook

`before_agent_start` Hook 作为仅 Hook Plugin 的兼容性路径仍然受支持。现实世界中的旧版 Plugin 仍依赖它。

方向：

- 保持其正常工作
- 将其文档化为旧版
- 对于模型/Provider 覆盖工作，优先使用 `before_model_resolve`
- 对于 Prompt 修改工作，优先使用 `before_prompt_build`
- 仅在实际使用量下降且固件覆盖率证明迁移安全后才移除

### 兼容性信号

运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，您可能会看到以下标签之一：

| 信号                       | 含义                                                       |
| -------------------------- | ---------------------------------------------------------- |
| **config valid**           | 配置解析正常且 Plugin 可解析                               |
| **compatibility advisory** | Plugin 使用了受支持但较旧的模式（例如 `hook-only`）        |
| **legacy warning**         | Plugin 使用了已弃用的 `before_agent_start`                 |
| **hard error**             | 配置无效或 Plugin 加载失败                                 |

`hook-only` 和 `before_agent_start` 今天都不会破坏您的 Plugin — `hook-only` 是建议性的，`before_agent_start` 只触发警告。这些信号也出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的 Plugin 系统有四层：

1. **清单 + 发现**
   OpenClaw 从配置路径、工作区根目录、全局扩展根目录和打包扩展中查找候选 Plugin。发现首先读取原生 `openclaw.plugin.json` 清单以及受支持的 Bundle 清单。
2. **启用 + 验证**
   核心决定已发现的 Plugin 是启用、禁用、阻止还是选择为专有槽（如内存）。
3. **运行时加载**
   原生 OpenClaw Plugin 通过 jiti 在进程内加载并将能力注册到中央注册表。兼容的 Bundle 被规范化为注册表记录，而不导入运行时代码。
4. **接口消费**
   OpenClaw 的其余部分读取注册表以暴露 Tool、Channel、Provider 设置、Hook、HTTP 路由、CLI 命令和服务。

对于 Plugin CLI 而言，根命令发现分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的 Plugin CLI 模块可以保持延迟加载，并在首次调用时注册

这样插件自有的 CLI 代码保留在 Plugin 内部，同时仍然可以让 OpenClaw 在解析之前预留根命令名称。

重要设计边界：

- 发现 + 配置验证应该在**不执行 Plugin 代码**的情况下从清单/模式元数据工作
- 原生运行时行为来自 Plugin 模块的 `register(api)` 路径

这种分离允许 OpenClaw 在完整运行时激活之前验证配置、解释缺失/禁用的 Plugin 并构建 UI/模式提示。

### Channel Plugin 和共享消息 Tool

Channel Plugin 不需要为正常聊天操作注册单独的发送/编辑/反应 Tool。OpenClaw 在核心保留一个共享 `message` Tool，Channel Plugin 在其后面拥有 Channel 特定的发现和执行。

当前边界：

- 核心拥有共享 `message` Tool 宿主、Prompt 连接、会话/线程记录和执行分发
- Channel Plugin 拥有范围化的动作发现、能力发现以及任何 Channel 特定的模式片段
- Channel Plugin 拥有 Provider 特定的会话对话语法，例如对话 id 如何编码线程 id 或从父级对话继承
- Channel Plugin 通过其动作适配器执行最终动作

对于 Channel Plugin，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用让 Plugin 一起返回其可见动作、能力和模式贡献，这样这些部分就不会相互偏离。

核心将运行时作用域传入该发现步骤。重要字段包括：`accountId`、`currentChannelId`、`currentThreadTs`、`currentMessageId`、`sessionKey`、`sessionId`、`agentId`、受信任的入站 `requesterSenderId`。

这对于上下文敏感的 Plugin 很重要。Channel 可以根据活跃账户、当前房间/线程/消息或受信任的请求者身份隐藏或暴露消息动作，而无需在核心 `message` Tool 中硬编码 Channel 特定的分支。

## 能力所有权模型

OpenClaw 将原生 Plugin 视为**公司**或**功能**的所有权边界，而不是无关集成的集合。

这意味着：

- 公司 Plugin 通常应该拥有该公司所有面向 OpenClaw 的接口
- 功能 Plugin 通常应该拥有它引入的完整功能接口
- Channel 应该消费共享的核心能力，而不是临时重新实现 Provider 行为

示例：

- 打包的 `openai` Plugin 拥有 OpenAI 模型 Provider 行为以及 OpenAI 语音、实时语音、媒体理解和图像生成行为
- 打包的 `elevenlabs` Plugin 拥有 ElevenLabs 语音行为
- 打包的 `microsoft` Plugin 拥有 Microsoft 语音行为
- 打包的 `google` Plugin 拥有 Google 模型 Provider 行为以及 Google 媒体理解、图像生成和 Web 搜索行为
- 打包的 `firecrawl` Plugin 拥有 Firecrawl Web 抓取行为
- 打包的 `minimax`、`mistral`、`moonshot` 和 `zai` Plugin 拥有各自的媒体理解后端
- 打包的 `qwen` Plugin 拥有 Qwen 文本 Provider 行为以及媒体理解和视频生成行为
- `voice-call` Plugin 是功能 Plugin：它拥有通话传输、Tool、CLI、路由和 Twilio 媒体流桥接，但消费共享语音、实时转录和实时语音能力，而不是直接导入厂商 Plugin

预期的最终状态是：

- OpenAI 即使跨越文本模型、语音、图像和未来视频也保留在一个 Plugin 中
- 另一个厂商可以对其自己的接口面积做同样的事情
- Channel 不关心哪个厂商 Plugin 拥有 Provider；它们消费核心暴露的共享能力契约

这是关键区别：

- **Plugin** = 所有权边界
- **能力** = 多个 Plugin 可以实现或消费的核心契约

### 能力分层

在决定代码归属时，使用以下心智模型：

- **核心能力层**：共享编排、策略、回退、配置合并规则、传递语义和类型化契约
- **厂商 Plugin 层**：厂商特定 API、身份验证、模型目录、语音合成、图像生成、未来视频后端、使用端点
- **Channel/功能 Plugin 层**：Slack/Discord/voice-call/等 集成，消费核心能力并在接口上呈现它们

## 契约和执行

Plugin API 接口有意在 `OpenClawPluginApi` 中进行类型化和集中化。该契约定义了支持的注册点以及 Plugin 可以依赖的运行时辅助工具。

有两层执行：

1. **运行时注册执行** — Plugin 注册表在 Plugin 加载时验证注册。重复的 Provider id、重复的语音 Provider id 和格式错误的注册会产生 Plugin 诊断，而不是未定义行为。
2. **契约测试** — 打包的 Plugin 在测试运行期间被捕获到契约注册表中，以便 OpenClaw 可以明确断言所有权。目前用于模型 Provider、语音 Provider、Web 搜索 Provider 和打包注册所有权。

## 执行模型

原生 OpenClaw Plugin **在进程内**与 Gateway 运行。它们不是沙箱化的。已加载的原生 Plugin 与核心代码具有相同的进程级信任边界。

影响：

- 原生 Plugin 可以注册 Tool、网络处理程序、Hook 和服务
- 原生 Plugin 错误可能导致 Gateway 崩溃或不稳定
- 恶意原生 Plugin 等同于 OpenClaw 进程内的任意代码执行

兼容的 Bundle 默认更安全，因为 OpenClaw 目前将它们视为元数据/内容包。

对于非打包 Plugin，使用允许列表和显式安装/加载路径。将工作区 Plugin 视为开发时代码，而不是生产默认值。

## 导出边界

OpenClaw 导出能力，而不是实现便利性。

保持能力注册公开。修剪非契约辅助导出：

- 打包 Plugin 特定的辅助子路径
- 不作为公共 API 的运行时管道子路径
- 厂商特定的便利辅助工具
- 作为实现细节的设置/入门辅助工具

## 加载管道

启动时，OpenClaw 大致执行以下操作：

1. 发现候选 Plugin 根目录
2. 读取原生或兼容 Bundle 清单和包元数据
3. 拒绝不安全的候选项
4. 规范化 Plugin 配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定每个候选项的启用状态
6. 通过 jiti 加载已启用的原生模块
7. 调用原生 `register(api)` Hook 并将注册收集到 Plugin 注册表中
8. 将注册表暴露给命令/运行时接口

安全门在**运行时执行之前**发生。当入口点逃脱 Plugin 根目录、路径是全局可写的，或者路径所有权对非打包 Plugin 看起来可疑时，候选项会被阻止。

### 清单优先行为

清单是控制平面的真相来源。OpenClaw 使用它来：

- 识别 Plugin
- 发现声明的 Channel/Skill/配置模式或 Bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/目录元数据

对于原生 Plugin，运行时模块是数据平面部分。它注册实际行为，如 Hook、Tool、命令或 Provider 流。

## 注册表模型

已加载的 Plugin 不会直接修改随机核心全局变量。它们注册到中央 Plugin 注册表。

注册表跟踪：

- Plugin 记录（身份、来源、起源、状态、诊断）
- Tool
- 旧版 Hook 和类型化 Hook
- Channel
- Provider
- Gateway RPC 处理程序
- HTTP 路由
- CLI 注册器
- 后台服务
- Plugin 拥有的命令

核心功能从该注册表读取，而不是直接与 Plugin 模块通信。这保持了加载的单向性：Plugin 模块 -> 注册表注册，核心运行时 -> 注册表消费。

## Provider 运行时 Hook

Provider Plugin 现在有两层：

- 清单元数据：用于运行时加载前廉价环境变量身份验证查找的 `providerAuthEnvVars`，以及用于廉价入门/身份验证选择标签和 CLI 标志元数据的 `providerAuthChoices`
- 配置时 Hook：`catalog` / 旧版 `discovery`
- 运行时 Hook：`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`capabilities`、`prepareExtraParams`、`wrapStreamFn`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`

### Hook 顺序和用法

对于模型/Provider Plugin，OpenClaw 大致按以下顺序调用 Hook：

| #   | Hook                          | 作用                                                                   | 使用时机                                      |
| --- | ----------------------------- | ---------------------------------------------------------------------- | --------------------------------------------- |
| 1   | `catalog`                     | 在 `models.json` 生成期间将 Provider 配置发布到 `models.providers`     | Provider 拥有目录或基础 URL 默认值            |
| 2   | `resolveDynamicModel`         | 本地注册表中尚未有的 Provider 拥有模型 id 的同步回退                   | Provider 接受任意上游模型 id                  |
| 3   | `prepareDynamicModel`         | 异步预热，然后 `resolveDynamicModel` 再次运行                          | Provider 在解析未知 id 之前需要网络元数据     |
| 4   | `normalizeResolvedModel`      | 嵌入式运行器使用解析模型之前的最终重写                                 | Provider 需要传输重写但仍使用核心传输         |
| 5   | `capabilities`                | 共享核心逻辑使用的 Provider 拥有的转录/工具元数据                      | Provider 需要转录/Provider 系列特性           |
| 6   | `prepareExtraParams`          | 通用流选项包装器之前的请求参数规范化                                   | Provider 需要默认请求参数或每 Provider 参数清理 |
| 7   | `wrapStreamFn`                | 应用通用包装器后的流包装器                                             | Provider 需要请求标头/正文/模型兼容包装器     |
| 8   | `formatApiKey`                | 身份验证配置文件格式化器：存储的配置文件成为运行时 `apiKey` 字符串     | Provider 存储额外身份验证元数据               |
| 9   | `refreshOAuth`                | 自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖                          | Provider 不适合共享 `pi-ai` 刷新器            |
| 10  | `buildAuthDoctorHint`         | OAuth 刷新失败时附加的修复提示                                         | Provider 需要 Provider 拥有的身份验证修复指导 |
| 11  | `isCacheTtlEligible`          | 代理/回程 Provider 的 Prompt 缓存策略                                  | Provider 需要代理特定的缓存 TTL 门控          |
| 12  | `buildMissingAuthMessage`     | 替换通用缺失身份验证恢复消息                                           | Provider 需要 Provider 特定的缺失身份验证恢复提示 |
| 13  | `suppressBuiltInModel`        | 陈旧上游模型抑制以及可选的面向用户错误提示                             | Provider 需要隐藏陈旧的上游行或替换它们       |
| 14  | `augmentModelCatalog`         | 发现后附加的合成/最终目录行                                            | Provider 需要 `models list` 和选择器中的合成前向兼容行 |
| 15  | `isBinaryThinking`            | 二元思考 Provider 的开/关推理切换                                      | Provider 仅暴露二元思考开/关                  |
| 16  | `supportsXHighThinking`       | 所选模型的 `xhigh` 推理支持                                            | Provider 希望仅在模型子集上使用 `xhigh`       |
| 17  | `resolveDefaultThinkingLevel` | 特定模型系列的默认 `/think` 级别                                       | Provider 拥有模型系列的默认 `/think` 策略     |
| 18  | `isModernModelRef`            | 用于实时配置文件过滤器和 smoke 选择的现代模型匹配器                    | Provider 拥有实时/smoke 首选模型匹配          |
| 19  | `prepareRuntimeAuth`          | 在推理前将配置的凭证交换为实际运行时令牌/密钥                          | Provider 需要令牌交换或短期请求凭证           |
| 20  | `resolveUsageAuth`            | 解析 `/usage` 和相关状态接口的使用/计费凭证                            | Provider 需要自定义使用/配额令牌解析          |
| 21  | `fetchUsageSnapshot`          | 解析身份验证后获取并规范化 Provider 特定的使用/配额快照                | Provider 需要特定于 Provider 的使用端点       |

## 运行时辅助工具

Plugin 可以通过 `api.runtime` 访问选定的核心辅助工具。有关完整参考，请参见 [运行时辅助工具](/plugins/sdk-runtime)。

## Gateway HTTP 路由

Plugin 可以使用 `api.registerHttpRoute(...)` 暴露 HTTP 端点。

路由字段：

- `path`：Gateway HTTP 服务器下的路由路径
- `auth`：必需。使用 `"gateway"` 要求正常 Gateway 身份验证，或使用 `"plugin"` 进行 Plugin 管理的身份验证/Webhook 验证
- `match`：可选。`"exact"`（默认）或 `"prefix"`
- `replaceExisting`：可选。允许同一 Plugin 替换自己的现有路由注册
- `handler`：当路由处理了请求时返回 `true`

## 消息 Tool 模式

Plugin 应该拥有 Channel 特定的 `describeMessageTool(...)` 模式贡献。将 Provider 特定的字段保留在 Plugin 中，而不是共享核心中。

对于共享的可移植模式片段，重用通过 `openclaw/plugin-sdk/channel-actions` 导出的通用辅助工具：

- `createMessageToolButtonsSchema()` 用于按钮网格样式的有效载荷
- `createMessageToolCardSchema()` 用于结构化卡片有效载荷

## Channel 目标解析

Channel Plugin 应该拥有 Channel 特定的目标语义。保持共享出站主机通用，并使用消息适配器接口进行 Provider 规则：

- `messaging.inferTargetChatType({ to })` 在目录查找之前决定规范化目标是否应被视为 `direct`、`group` 或 `channel`
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心输入是否应该直接跳过到类 id 解析，而不是目录搜索
- `messaging.targetResolver.resolveTarget(...)` 是核心在规范化后或目录未命中后需要最终 Provider 拥有解析时的 Plugin 回退

## Plugin SDK 导入路径

在编写 Plugin 时，使用 SDK 子路径而不是单体 `openclaw/plugin-sdk` 导入：

- `openclaw/plugin-sdk/plugin-entry` 用于 Plugin 注册原语
- `openclaw/plugin-sdk/core` 用于通用共享 Plugin 面向契约
- 稳定的 Channel 原语，如 `openclaw/plugin-sdk/channel-setup`、`openclaw/plugin-sdk/channel-pairing`、`openclaw/plugin-sdk/channel-contract`、`openclaw/plugin-sdk/channel-feedback`、`openclaw/plugin-sdk/channel-inbound`、`openclaw/plugin-sdk/channel-lifecycle`、`openclaw/plugin-sdk/channel-reply-pipeline`、`openclaw/plugin-sdk/command-auth`、`openclaw/plugin-sdk/secret-input` 和 `openclaw/plugin-sdk/webhook-ingress`
- 领域子路径，如 `openclaw/plugin-sdk/runtime-store`、`openclaw/plugin-sdk/config-runtime`、`openclaw/plugin-sdk/agent-runtime`、`openclaw/plugin-sdk/directory-runtime` 等

## 相关

- [SDK 概览](/plugins/sdk-overview) — 注册 API 和子路径参考
- [SDK 入口点](/plugins/sdk-entrypoints) — `definePluginEntry` 选项
- [SDK 运行时辅助工具](/plugins/sdk-runtime) — `api.runtime` 完整参考
- [Plugin 清单](/plugins/manifest) — 清单模式参考
- [SDK 迁移](/plugins/sdk-migration) — 从旧版接口迁移
