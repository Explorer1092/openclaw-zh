---
mmh3_hash: "7c39f39dc290dc8aa9cfd6fda340f253"
read_when:
  - 构建或调试原生 OpenClaw 插件
  - 理解插件能力模型或所有权边界
  - 处理插件加载流水线或注册表
  - 实现提供商运行时 Hook 或 Channel 插件
summary: 插件内部机制：能力模型、所有权、契约、加载流水线和运行时辅助工具
title: 插件内部机制
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/architecture.md
  workflow: 15
---

# 插件内部机制

<Info>
  这是**深度架构参考文档**。如需实用指南，请参阅：
  - [安装和使用插件](/tools/plugin) — 用户指南
  - [快速入门](/plugins/building-plugins) — 第一个插件教程
  - [Channel 插件](/plugins/sdk-channel-plugins) — 构建消息渠道
  - [Provider 插件](/plugins/sdk-provider-plugins) — 构建模型提供商
  - [SDK 概览](/plugins/sdk-overview) — 导入映射和注册 API
</Info>

本页介绍 OpenClaw 插件系统的内部架构。

## 公共能力模型

能力（Capability）是 OpenClaw 内部原生插件的公共模型。每个原生 OpenClaw 插件都会针对一种或多种能力类型进行注册：

| 能力           | 注册方法                                          | 示例插件                      |
| -------------- | ------------------------------------------------- | ----------------------------- |
| 文本推理       | `api.registerProvider(...)`                       | `openai`、`anthropic`         |
| CLI 推理后端   | `api.registerCliBackend(...)`                     | `openai`、`anthropic`         |
| 语音           | `api.registerSpeechProvider(...)`                 | `elevenlabs`、`microsoft`     |
| 媒体理解       | `api.registerMediaUnderstandingProvider(...)`     | `openai`、`google`            |
| 图像生成       | `api.registerImageGenerationProvider(...)`        | `openai`、`google`            |
| 网络搜索       | `api.registerWebSearchProvider(...)`              | `google`                      |
| Channel / 消息 | `api.registerChannel(...)`                        | `msteams`、`matrix`           |

一个注册了零个能力但提供了 Hook、工具或服务的插件是**仅含 Hook 的遗留**插件。该模式仍完全受支持。

### 外部兼容性立场

能力模型已落地于核心并被内置/原生插件使用，但外部插件兼容性仍需比"已导出即已冻结"更严格的标准。

当前指导原则：

- **现有外部插件：** 保持基于 Hook 的集成工作；将其视为兼容基准
- **新的内置/原生插件：** 优先使用显式能力注册，而非特定厂商的直接访问或新的仅 Hook 设计
- **采用能力注册的外部插件：** 允许，但除非文档明确将契约标记为稳定，否则请将特定能力的辅助接口视为演进中的

实用规则：

- 能力注册 API 是预期方向
- 遗留 Hook 在过渡期间仍是外部插件最安全的无破坏路径
- 导出的辅助子路径并非全部等价；优先使用文档化的窄契约，而非偶然的辅助导出

### 插件形状

OpenClaw 根据实际注册行为（而非仅静态元数据）将每个加载的插件分类为一种形状：

- **plain-capability** — 注册恰好一种能力类型（例如仅含 Provider 的插件，如 `mistral`）
- **hybrid-capability** — 注册多种能力类型（例如 `openai` 拥有文本推理、语音、媒体理解和图像生成）
- **hook-only** — 仅注册 Hook（有类型或自定义），无能力、工具、命令或服务
- **non-capability** — 注册工具、命令、服务或路由，但无能力

使用 `openclaw plugins inspect <id>` 查看插件的形状和能力明细。详见 [CLI 参考](/cli/plugins#inspect)。

### 遗留 Hook

`before_agent_start` Hook 作为仅含 Hook 插件的兼容路径仍受支持。现实中的遗留插件仍依赖它。

方向：

- 保持其正常工作
- 将其记录为遗留
- 对于模型/提供商覆盖工作，优先使用 `before_model_resolve`
- 对于 Prompt 变更工作，优先使用 `before_prompt_build`
- 仅在真实使用量下降且测试覆盖率证明迁移安全后才移除

### 兼容性信号

运行 `openclaw doctor` 或 `openclaw plugins inspect <id>` 时，你可能会看到以下标签：

| 信号                       | 含义                                                       |
| -------------------------- | ---------------------------------------------------------- |
| **config valid**           | 配置解析正常，插件解析成功                                 |
| **compatibility advisory** | 插件使用了受支持但较旧的模式（例如 `hook-only`）           |
| **legacy warning**         | 插件使用了已弃用的 `before_agent_start`                    |
| **hard error**             | 配置无效或插件加载失败                                     |

`hook-only` 和 `before_agent_start` 目前不会破坏你的插件 — `hook-only` 仅为建议，`before_agent_start` 只会触发警告。这些信号也会出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的插件系统有四层：

1. **清单 + 发现**
   OpenClaw 从配置的路径、工作区根目录、全局扩展根目录和内置扩展中查找候选插件。发现过程首先读取原生 `openclaw.plugin.json` 清单及受支持的捆绑包清单。
2. **启用 + 验证**
   核心决定已发现的插件是否启用、禁用、阻止，或选入排他性插槽（如 memory）。
3. **运行时加载**
   原生 OpenClaw 插件通过 jiti 在进程内加载，并将能力注册到中央注册表中。兼容的捆绑包在不导入运行时代码的情况下被规范化为注册表记录。
4. **接口消费**
   OpenClaw 的其余部分读取注册表以暴露工具、Channel、Provider 设置、Hook、HTTP 路由、CLI 命令和服务。

对于插件 CLI，根命令发现分两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的插件 CLI 模块可以保持懒加载，并在首次调用时注册

这使插件拥有的 CLI 代码保留在插件内部，同时让 OpenClaw 在解析前预留根命令名称。

重要设计边界：

- 发现 + 配置验证应从**清单/Schema 元数据**完成，无需执行插件代码
- 原生运行时行为来自插件模块的 `register(api)` 路径

这种分离让 OpenClaw 在完整运行时激活之前就能验证配置、解释缺失/禁用的插件，并构建 UI/Schema 提示。

### Channel 插件与共享消息工具

Channel 插件不需要为普通聊天操作注册单独的发送/编辑/反应工具。OpenClaw 在核心中保留一个共享的 `message` 工具，Channel 插件拥有其背后的特定 Channel 发现和执行逻辑。

当前边界：

- 核心拥有共享 `message` 工具宿主、Prompt 连接、Session/线程记账和执行分发
- Channel 插件拥有范围化的动作发现、能力发现，以及任何特定 Channel 的 Schema 片段
- Channel 插件通过其动作适配器执行最终动作

对于 Channel 插件，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用让插件可以一起返回其可见动作、能力和 Schema 贡献，从而避免这些部分偏离。

核心将运行时范围传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 可信入站的 `requesterSenderId`

这对于上下文敏感的插件很重要。Channel 可以根据活跃账户、当前房间/线程/消息或可信请求者身份来隐藏或暴露消息动作，而无需在核心 `message` 工具中硬编码特定 Channel 的分支。

请参见 [加载流水线](#load-pipeline) 了解完整启动序列。

## 能力所有权模型

OpenClaw 将原生插件视为**公司**或**功能**的所有权边界，而不是无关集成的大杂烩。

这意味着：

- 公司插件通常应拥有该公司面向 OpenClaw 的所有接口
- 功能插件通常应拥有其引入的完整功能接口
- Channel 应消费共享的核心能力，而不是临时重新实现提供商行为

示例：

- 内置 `openai` 插件拥有 OpenAI 模型提供商行为，以及 OpenAI 语音 + 媒体理解 + 图像生成行为
- 内置 `elevenlabs` 插件拥有 ElevenLabs 语音行为
- 内置 `microsoft` 插件拥有 Microsoft 语音行为
- 内置 `google` 插件拥有 Google 模型提供商行为，以及 Google 媒体理解 + 图像生成 + 网络搜索行为
- 内置 `minimax`、`mistral`、`moonshot` 和 `zai` 插件拥有各自的媒体理解后端
- `voice-call` 插件是功能插件：它拥有通话传输、工具、CLI、路由和运行时，但消费核心 TTS/STT 能力，而不是发明第二个语音栈

预期最终状态：

- OpenAI 位于一个插件中，即使它横跨文本模型、语音、图像和未来视频
- 另一家厂商可以对其自己的接口做同样的事
- Channel 不关心哪个厂商插件拥有提供商；它们消费核心暴露的共享能力契约

关键区别：

- **插件** = 所有权边界
- **能力** = 多个插件可以实现或消费的核心契约

### 能力分层

决定代码归属时使用此心智模型：

- **核心能力层**：共享编排、策略、回退、配置合并规则、交付语义和类型化契约
- **厂商插件层**：厂商特定 API、认证、模型目录、语音合成、图像生成、未来视频后端、用量端点
- **Channel/功能插件层**：Slack/Discord/voice-call 等集成，消费核心能力并在接口上呈现

例如，TTS 遵循此形状：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和 Channel 交付
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

未来能力应优先使用相同模式。

### 多能力公司插件示例

公司插件从外部看应感觉内聚。如果 OpenClaw 拥有模型、语音、媒体理解和网络搜索的共享契约，厂商可以在一个地方拥有其所有接口：

```ts
import type { OpenClawPluginDefinition } from "openclaw/plugin-sdk/plugin-entry";
import {
  describeImageWithModel,
  transcribeOpenAiCompatibleAudio,
} from "openclaw/plugin-sdk/media-understanding";

const plugin: OpenClawPluginDefinition = {
  id: "exampleai",
  name: "ExampleAI",
  register(api) {
    api.registerProvider({
      id: "exampleai",
      // 认证/模型目录/运行时 Hook
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // 厂商语音配置 — 直接实现 SpeechProviderPlugin 接口
    });

    api.registerMediaUnderstandingProvider({
      id: "exampleai",
      capabilities: ["image", "audio", "video"],
      async describeImage(req) {
        return describeImageWithModel({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
      async transcribeAudio(req) {
        return transcribeOpenAiCompatibleAudio({
          provider: "exampleai",
          model: req.model,
          input: req.input,
        });
      },
    });

    api.registerWebSearchProvider(
      createPluginBackedWebSearchProvider({
        id: "exampleai-search",
        // 凭证 + 获取逻辑
      }),
    );
  },
};

export default plugin;
```

重要的不是确切的辅助名称，而是形状：

- 一个插件拥有厂商接口
- 核心仍然拥有能力契约
- Channel 和功能插件消费 `api.runtime.*` 辅助工具，而非厂商代码
- 契约测试可以断言插件注册了其声明拥有的能力

## 契约与执行

插件 API 接口有意地进行了类型化，并集中在 `OpenClawPluginApi` 中。该契约定义了受支持的注册点以及插件可以依赖的运行时辅助工具。

为什么这很重要：

- 插件作者获得一个稳定的内部标准
- 核心可以拒绝重复所有权，例如两个插件注册相同的 Provider ID
- 启动时可以为格式错误的注册提供可操作的诊断
- 契约测试可以强制内置插件所有权并防止静默漂移

有两层执行：

1. **运行时注册执行**
   插件注册表在插件加载时验证注册。例如，重复的 Provider ID、重复的语音 Provider ID 和格式错误的注册会产生插件诊断，而非未定义行为。
2. **契约测试**
   内置插件在测试运行期间被捕获到契约注册表中，以便 OpenClaw 可以显式断言所有权。目前用于模型 Provider、语音 Provider、网络搜索 Provider 和内置注册所有权。

实际效果是 OpenClaw 预先知道哪个插件拥有哪个接口。这让核心和 Channel 可以无缝组合，因为所有权是声明的、类型化的和可测试的，而非隐式的。

## 执行模型

原生 OpenClaw 插件与 Gateway 网关**在进程内**运行。它们不是沙箱化的。已加载的原生插件具有与核心代码相同的进程级信任边界。

影响：

- 原生插件可以注册工具、网络处理器、Hook 和服务
- 原生插件错误可能崩溃或破坏稳定 Gateway 网关
- 恶意原生插件相当于在 OpenClaw 进程内任意执行代码

兼容的捆绑包默认更安全，因为 OpenClaw 目前将它们视为元数据/内容包。在当前版本中，这主要意味着内置 Skills。

对非内置插件使用允许列表和显式安装/加载路径。将工作区插件视为开发时代码，而非生产默认值。

## 加载流水线

启动时，OpenClaw 大致执行以下操作：

1. 发现候选插件根目录
2. 读取原生或兼容的捆绑包清单和包元数据
3. 拒绝不安全的候选
4. 规范化插件配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定每个候选的启用状态
6. 通过 jiti 加载启用的原生模块
7. 调用原生 `register(api)`（或 `activate(api)` — 遗留别名）Hook 并将注册收集到插件注册表中
8. 将注册表暴露给命令/运行时接口

<Note>
`activate` 是 `register` 的遗留别名 — 加载器解析存在的那个（`def.register ?? def.activate`）并在相同位置调用它。所有内置插件都使用 `register`；新插件请优先使用 `register`。
</Note>

安全门在**运行时执行之前**发生。当入口点逃出插件根目录、路径为全局可写，或对于非内置插件路径所有权看起来可疑时，候选会被阻止。

### 清单优先行为

清单是控制平面的事实来源。OpenClaw 使用它来：

- 识别插件
- 发现声明的 Channel/Skills/配置 Schema 或捆绑包能力
- 验证 `plugins.entries.<id>.config`
- 增强控制 UI 标签/占位符
- 显示安装/目录元数据

对于原生插件，运行时模块是数据平面部分。它注册实际行为，如 Hook、工具、命令或 Provider 流。

### 加载器缓存内容

OpenClaw 保留短暂的进程内缓存：

- 发现结果
- 清单注册表数据
- 已加载的插件注册表

这些缓存减少了突发启动和重复命令的开销。可以将它们视为短暂的性能缓存，而非持久化。

性能注意事项：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的插件不直接修改随机的核心全局状态。它们注册到中央插件注册表中。

注册表跟踪：

- 插件记录（身份、来源、状态、诊断）
- 工具
- 遗留 Hook 和类型化 Hook
- Channel
- Provider
- Gateway 网关 RPC 处理器
- HTTP 路由
- CLI 注册器
- 后台服务
- 插件拥有的命令

核心功能然后从该注册表读取，而不是直接与插件模块通信。这使加载单向进行：

- 插件模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性很重要。这意味着大多数核心接口只需要一个集成点："读取注册表"，而不是"为每个插件模块特殊处理"。

## 对话绑定回调

绑定对话的插件可以在审批解决时做出反应。

使用 `api.onConversationBindingResolved(...)` 在绑定请求被批准或拒绝后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 此插件 + 对话现在存在绑定。
        console.log(event.binding?.conversationId);
        return;
      }

      // 请求被拒绝；清除任何本地挂起状态。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调负载字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求的解析绑定
- `request`：原始请求摘要、分离提示、发送者 ID 和对话元数据

此回调仅供通知。它不改变允许绑定对话的人员，并在核心审批处理完成后运行。

## Provider 运行时 Hook

Provider 插件现在有两层：

- 清单元数据：`providerAuthEnvVars` 用于运行时加载前的廉价环境认证查找，以及 `providerAuthChoices` 用于运行时加载前的廉价引导/认证选择标签和 CLI 标志元数据
- 配置时 Hook：`catalog` / 遗留 `discovery`
- 运行时 Hook：`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`capabilities`、`prepareExtraParams`、`wrapStreamFn`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`

OpenClaw 仍然拥有通用 Agent 循环、故障转移、转录处理和工具策略。这些 Hook 是特定于 Provider 行为的扩展接口，无需整个自定义推理传输。

### Hook 顺序与用法

对于模型/Provider 插件，OpenClaw 按以下大致顺序调用 Hook。"使用时机"列是快速决策指南。

| #   | Hook                          | 功能                                                               | 使用时机                                                           |
| --- | ----------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 1   | `catalog`                     | 在 `models.json` 生成期间将 Provider 配置发布到 `models.providers` | Provider 拥有目录或基础 URL 默认值                                 |
| 2   | `resolveDynamicModel`         | 本地注册表中尚未存在的 Provider 拥有模型 ID 的同步回退             | Provider 接受任意上游模型 ID                                       |
| 3   | `prepareDynamicModel`         | 异步预热，然后再次运行 `resolveDynamicModel`                       | Provider 在解析未知 ID 前需要网络元数据                            |
| 4   | `normalizeResolvedModel`      | 嵌入式运行器使用已解析模型前的最终重写                             | Provider 需要传输重写但仍使用核心传输                              |
| 5   | `capabilities`                | 共享核心逻辑使用的 Provider 拥有的转录/工具元数据                 | Provider 需要转录/Provider 家族特性                               |
| 6   | `prepareExtraParams`          | 通用流选项包装器之前的请求参数规范化                               | Provider 需要默认请求参数或每 Provider 参数清理                    |
| 7   | `wrapStreamFn`                | 应用通用包装器后的流包装器                                         | Provider 需要请求头/主体/模型兼容包装器，无需自定义传输            |
| 8   | `formatApiKey`                | 认证配置格式化器：存储的配置成为运行时 `apiKey` 字符串             | Provider 存储额外认证元数据并需要自定义运行时令牌形状              |
| 9   | `refreshOAuth`                | 自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖                      | Provider 不符合共享 `pi-ai` 刷新器                                 |
| 10  | `buildAuthDoctorHint`         | OAuth 刷新失败时附加的修复提示                                     | Provider 在刷新失败后需要 Provider 拥有的认证修复指导              |
| 11  | `isCacheTtlEligible`          | 代理/回程 Provider 的 Prompt 缓存策略                              | Provider 需要代理特定的缓存 TTL 门控                               |
| 12  | `buildMissingAuthMessage`     | 通用缺失认证恢复消息的替代                                         | Provider 需要特定于 Provider 的缺失认证恢复提示                    |
| 13  | `suppressBuiltInModel`        | 过时的上游模型抑制加上可选的用户可见错误提示                       | Provider 需要隐藏过时的上游行或用厂商提示替换它们                  |
| 14  | `augmentModelCatalog`         | 发现后附加的合成/最终目录行                                        | Provider 需要在 `models list` 和选择器中的合成前向兼容行           |
| 15  | `isBinaryThinking`            | 二进制思考 Provider 的开/关推理切换                                | Provider 仅暴露二进制思考开/关                                     |
| 16  | `supportsXHighThinking`       | 选定模型的 `xhigh` 推理支持                                        | Provider 希望仅在模型子集上使用 `xhigh`                            |
| 17  | `resolveDefaultThinkingLevel` | 特定模型家族的默认 `/think` 级别                                   | Provider 拥有模型家族的默认 `/think` 策略                          |
| 18  | `isModernModelRef`            | 实时配置文件过滤器和烟雾测试选择的现代模型匹配器                   | Provider 拥有实时/烟雾优选模型匹配                                 |
| 19  | `prepareRuntimeAuth`          | 推理前将已配置凭证交换为实际运行时令牌/密钥                        | Provider 需要令牌交换或短期请求凭证                                |
| 20  | `resolveUsageAuth`            | 解析 `/usage` 和相关状态接口的用量/账单凭证                        | Provider 需要自定义用量/配额令牌解析或不同的用量凭证               |
| 21  | `fetchUsageSnapshot`          | 认证解析后获取并规范化特定于 Provider 的用量/配额快照              | Provider 需要特定于 Provider 的用量端点或负载解析器                |

如果 Provider 需要完全自定义的线路协议或自定义请求执行器，那是另一类扩展。这些 Hook 适用于仍在 OpenClaw 正常推理循环上运行的 Provider 行为。

## 运行时辅助工具

插件可以通过 `api.runtime` 访问选定的核心辅助工具。对于 TTS：

```ts
const clip = await api.runtime.tts.textToSpeech({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});

const voices = await api.runtime.tts.listVoices({
  provider: "elevenlabs",
  cfg: api.config,
});
```

注意事项：

- `textToSpeech` 返回用于文件/语音便签接口的正常核心 TTS 输出负载。
- 使用核心 `messages.tts` 配置和 Provider 选择。
- 返回 PCM 音频缓冲区 + 采样率。插件必须为 Provider 重新采样/编码。
- `listVoices` 对每个 Provider 是可选的。将其用于厂商拥有的语音选择器或设置流。
- 语音列表可以包含更丰富的元数据，如语言区域、性别和个性标签，供支持 Provider 的选择器使用。
- OpenAI 和 ElevenLabs 目前支持电话。Microsoft 不支持。

插件也可以通过 `api.registerSpeechProvider(...)` 注册语音 Provider。

对于图像/音频/视频理解，插件注册一个类型化的媒体理解 Provider，而非通用的键/值包：

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

注意事项：

- 将编排、回退、配置和 Channel 连接保留在核心。
- 将厂商行为保留在 Provider 插件中。
- 加法式扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。

## Gateway 网关 HTTP 路由

插件可以使用 `api.registerHttpRoute(...)` 暴露 HTTP 端点。

```ts
api.registerHttpRoute({
  path: "/acme/webhook",
  auth: "plugin",
  match: "exact",
  handler: async (_req, res) => {
    res.statusCode = 200;
    res.end("ok");
    return true;
  },
});
```

路由字段：

- `path`：Gateway 网关 HTTP 服务器下的路由路径。
- `auth`：必需。使用 `"gateway"` 要求正常 Gateway 网关认证，或使用 `"plugin"` 进行插件管理的认证/Webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一插件替换其自己的现有路由注册。
- `handler`：当路由处理请求时返回 `true`。

注意事项：

- `api.registerHttpHandler(...)` 已移除，会导致插件加载错误。请改用 `api.registerHttpRoute(...)`。
- 插件路由必须显式声明 `auth`。
- 除非 `replaceExisting: true`，否则相同的 `path + match` 冲突会被拒绝，且一个插件不能替换另一个插件的路由。
- 具有不同 `auth` 级别的重叠路由会被拒绝。仅在相同 auth 级别上保留 `exact`/`prefix` 回退链。

## 插件 SDK 导入路径

在编写插件时，使用 SDK 子路径而非单体的 `openclaw/plugin-sdk` 导入：

- `openclaw/plugin-sdk/plugin-entry`：用于插件注册原语。
- `openclaw/plugin-sdk/core`：用于通用共享面向插件的契约。
- 稳定的 Channel 原语，如 `openclaw/plugin-sdk/channel-setup`、`openclaw/plugin-sdk/channel-pairing`、`openclaw/plugin-sdk/channel-contract`、`openclaw/plugin-sdk/channel-feedback`、`openclaw/plugin-sdk/channel-inbound`、`openclaw/plugin-sdk/channel-lifecycle`、`openclaw/plugin-sdk/channel-reply-pipeline`、`openclaw/plugin-sdk/command-auth`、`openclaw/plugin-sdk/secret-input` 和 `openclaw/plugin-sdk/webhook-ingress`：用于共享设置/认证/回复/Webhook 连接。
- 兼容性说明：避免对新代码使用根 `openclaw/plugin-sdk` 桶。优先使用更窄的稳定原语。

## 消息工具 Schema

插件应拥有特定于 Channel 的 `describeMessageTool(...)` Schema 贡献。将特定于 Provider 的字段保留在插件中，而非在共享核心中。

对于共享的可移植 Schema 片段，请重用通过 `openclaw/plugin-sdk/channel-actions` 导出的通用辅助工具：

- `createMessageToolButtonsSchema()`：用于按钮网格样式的负载
- `createMessageToolCardSchema()`：用于结构化卡片负载

如果 Schema 形状只对一个 Provider 有意义，请在该插件自己的源代码中定义它，而不是将其推广到共享 SDK 中。
