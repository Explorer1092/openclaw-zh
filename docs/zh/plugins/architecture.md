---
mmh3_hash: "3cff1887b9f835f59f440926c9728fda"
summary: "Plugin 内部架构：能力模型、所有权、契约、加载管道和运行时辅助工具"
read_when:
  - 构建或调试原生 OpenClaw Plugin
  - 了解 Plugin 能力模型或所有权边界
  - 研究 Plugin 加载管道或注册表
  - 实现 Provider 运行时 Hook 或 Channel Plugin
title: "Plugin 内部架构"
sidebarTitle: "内部架构"
---

这是 OpenClaw Plugin 系统的**深度架构参考文档**。如需实操指南，请从以下专题页面开始。

<CardGroup cols={2}>
  <Card title="安装和使用 Plugin" icon="plug" href="/tools/plugin">
    用于添加、启用和排查 Plugin 问题的用户指南。
  </Card>
  <Card title="构建 Plugin" icon="rocket" href="/plugins/building-plugins">
    包含最小可用清单的第一个 Plugin 教程。
  </Card>
  <Card title="Channel Plugin" icon="comments" href="/plugins/sdk-channel-plugins">
    构建消息 Channel Plugin。
  </Card>
  <Card title="Provider Plugin" icon="microchip" href="/plugins/sdk-provider-plugins">
    构建模型 Provider Plugin。
  </Card>
  <Card title="SDK 概览" icon="book" href="/plugins/sdk-overview">
    导入映射和注册 API 参考。
  </Card>
</CardGroup>

## 公共能力模型

能力是 OpenClaw 内部原生 Plugin 的公共模型。每个原生 OpenClaw Plugin 都向一个或多个能力类型注册：

| 能力               | 注册方法                                              | 示例 Plugin                          |
| ------------------ | ----------------------------------------------------- | ------------------------------------ |
| 文本推理           | `api.registerProvider(...)`                           | `openai`, `anthropic`                |
| CLI 推理后端       | `api.registerCliBackend(...)`                         | `openai`, `anthropic`                |
| Embeddings         | `api.registerEmbeddingProvider(...)`                  | Provider 所属的向量 Plugin           |
| 语音               | `api.registerSpeechProvider(...)`                     | `elevenlabs`, `microsoft`            |
| 实时转录           | `api.registerRealtimeTranscriptionProvider(...)`      | `openai`                             |
| 实时语音           | `api.registerRealtimeVoiceProvider(...)`              | `openai`                             |
| 媒体理解           | `api.registerMediaUnderstandingProvider(...)`         | `openai`, `google`                   |
| 会议纪要来源       | `api.registerMeetingNotesSourceProvider(...)`         | `discord`, `meeting-notes`           |
| 图像生成           | `api.registerImageGenerationProvider(...)`            | `openai`, `google`, `fal`, `minimax` |
| 音乐生成           | `api.registerMusicGenerationProvider(...)`            | `google`, `minimax`                  |
| 视频生成           | `api.registerVideoGenerationProvider(...)`            | `qwen`                               |
| Web 抓取           | `api.registerWebFetchProvider(...)`                   | `firecrawl`                          |
| Web 搜索           | `api.registerWebSearchProvider(...)`                  | `google`                             |
| Channel / 消息     | `api.registerChannel(...)`                            | `msteams`, `matrix`                  |
| Gateway 发现       | `api.registerGatewayDiscoveryService(...)`            | `bonjour`                            |

<Note>
注册零个能力但提供 Hook、Tool、发现服务或后台服务的 Plugin 是**旧版仅 Hook** Plugin。该模式仍然完全受支持。
</Note>

### 外部兼容性立场

能力模型已落地于核心并被打包/原生 Plugin 使用，但外部 Plugin 的兼容性仍需要比"已导出即已冻结"更严格的标准。

| Plugin 情况                           | 指导原则                                                                                      |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| 现有外部 Plugin                       | 保持基于 Hook 的集成正常工作；将此视为兼容性基线。                                           |
| 新的打包/原生 Plugin                  | 优先选择显式能力注册而非特定厂商的直接访问或新的仅 Hook 设计。                               |
| 采用能力注册的外部 Plugin             | 允许，但将能力特定的辅助功能接口视为不断演进的，除非文档明确将其标记为稳定。                 |

能力注册是预期方向。旧版 Hook 在过渡期间仍是外部 Plugin 最安全的无破坏性路径。导出的辅助子路径并非全部相同——优先使用文档化的窄契约，而非偶然的辅助导出。

### Plugin 形态

OpenClaw 根据实际注册行为（而非仅静态元数据）将每个已加载的 Plugin 分类为一种形态：

<AccordionGroup>
  <Accordion title="plain-capability">
    恰好注册一种能力类型（例如仅 Provider 的 Plugin 如 `mistral`）。
  </Accordion>
  <Accordion title="hybrid-capability">
    注册多种能力类型（例如 `openai` 拥有文本推理、语音、媒体理解和图像生成）。
  </Accordion>
  <Accordion title="hook-only">
    仅注册 Hook（类型化或自定义），没有能力、Tool、命令或服务。
  </Accordion>
  <Accordion title="non-capability">
    注册 Tool、命令、服务或路由，但没有能力。
  </Accordion>
</AccordionGroup>

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

`hook-only` 和 `before_agent_start` 今天都不会破坏您的 Plugin——`hook-only` 是建议性的，`before_agent_start` 只触发警告。这些信号也出现在 `openclaw status --all` 和 `openclaw plugins doctor` 中。

## 架构概览

OpenClaw 的 Plugin 系统有四层：

<Steps>
  <Step title="清单 + 发现">
    OpenClaw 从配置路径、工作区根目录、全局 Plugin 根目录和打包 Plugin 中查找候选 Plugin。发现首先读取原生 `openclaw.plugin.json` 清单以及受支持的 Bundle 清单。
  </Step>
  <Step title="启用 + 验证">
    核心决定已发现的 Plugin 是启用、禁用、阻止还是选择为专有槽（如内存）。
  </Step>
  <Step title="运行时加载">
    原生 OpenClaw Plugin 在进程内加载并将能力注册到中央注册表。已打包的 JavaScript 通过原生 `require` 加载；第三方本地源 TypeScript 是紧急 Jiti 回退方案。兼容的 Bundle 被规范化为注册表记录，而不导入运行时代码。
  </Step>
  <Step title="接口消费">
    OpenClaw 的其余部分读取注册表以暴露 Tool、Channel、Provider 设置、Hook、HTTP 路由、CLI 命令和服务。
  </Step>
</Steps>

对于 Plugin CLI 而言，根命令发现分为两个阶段：

- 解析时元数据来自 `registerCli(..., { descriptors: [...] })`
- 真正的 Plugin CLI 模块可以保持延迟加载，并在首次调用时注册

这样 Plugin 自有的 CLI 代码保留在 Plugin 内部，同时仍然可以让 OpenClaw 在解析之前预留根命令名称。

重要设计边界：

- 清单/配置验证应该在**不执行 Plugin 代码**的情况下从清单/模式元数据工作
- 原生能力发现可以加载受信任的 Plugin 入口代码以构建非激活的注册表快照
- 原生运行时行为来自 Plugin 模块的 `register(api)` 路径，其中 `api.registrationMode === "full"`

这种分离允许 OpenClaw 在完整运行时激活之前验证配置、解释缺失/禁用的 Plugin 并构建 UI/模式提示。

### Plugin 元数据快照和查找表

Gateway 启动时为当前配置快照构建一个 `PluginMetadataSnapshot`。快照仅包含元数据：存储已安装的 Plugin 索引、清单注册表、清单诊断、所有者映射、Plugin id 规范化器以及清单记录。它不保存已加载的 Plugin 模块、Provider SDK、包内容或运行时导出。

Plugin 感知的配置验证、启动自动启用和 Gateway Plugin 引导使用该快照，而不是独立重建清单/索引元数据。`PluginLookUpTable` 从同一快照派生，并添加当前运行时配置的启动 Plugin 计划。

Gateway 启动后，将当前元数据快照保留为可替换的运行时产品。重复的运行时 Provider 发现可以借用该快照，而不是为每次 Provider 目录传递重建已安装索引和清单注册表。在 Gateway 关闭、配置/Plugin 清单变更、安装记录写入和持久化索引策略变更时清除或替换快照；当不存在兼容的当前快照时，调用方回退到冷清单/索引路径。兼容性检查必须包括 Plugin 发现根（如 `plugins.load.paths` 和默认 Agent 工作区），因为工作区 Plugin 是元数据范围的一部分。

快照和查找表使重复的启动决策保持在快速路径上：

- Channel 所有权
- 延迟 Channel 启动
- 启动 Plugin id
- Provider 和 CLI 后端所有权
- 设置 Provider、命令别名、模型目录 Provider 和清单契约所有权
- Plugin 配置模式和 Channel 配置模式验证
- 启动自动启用决策

安全边界是快照替换，而非变更。当配置、Plugin 清单、安装记录或持久化索引策略发生变化时重建快照。不要将其视为宽泛的可变全局注册表，也不要保留无限的历史快照。运行时 Plugin 加载与元数据快照保持分离，以便陈旧的运行时状态不会隐藏在元数据缓存后面。

缓存规则记录在 [Plugin 架构内部机制](/plugins/architecture-internals#plugin-cache-boundary) 中：除非调用方为当前流程持有显式快照、查找表或清单注册表，否则清单和发现元数据是新鲜的。隐藏的元数据缓存和挂钟 TTL 不属于 Plugin 加载的一部分。只有运行时加载器、模块和依赖工件缓存可以在代码或已安装工件实际加载后保留。

部分冷路径调用方仍然直接从持久化的已安装 Plugin 索引重建清单注册表，而不是接收 Gateway `PluginLookUpTable`。该路径现在按需重建注册表；当调用方已经拥有一个时，优先通过运行时流程传递当前查找表或显式清单注册表。

### 激活规划

激活规划是控制平面的一部分。调用者可以在加载更广泛的运行时注册表之前询问哪些 Plugin 与特定命令、Provider、Channel、路由、Agent 测试框架或能力相关。

规划器保持当前清单行为兼容：

- `activation.*` 字段是显式规划器提示
- `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 Hook 仍然是清单所有权回退
- 仅 id 的规划器 API 对现有调用者保持可用
- 计划 API 报告原因标签，以便诊断可以区分显式提示和所有权回退

<Warning>
不要将 `activation` 视为生命周期 Hook 或 `register(...)` 的替代品。它是用于缩小加载范围的元数据。当所有权字段已经描述关系时，优先使用所有权字段；仅对额外的规划器提示使用 `activation`。
</Warning>

### Channel Plugin 和共享消息 Tool

Channel Plugin 不需要为正常聊天操作注册单独的发送/编辑/反应 Tool。OpenClaw 在核心保留一个共享 `message` Tool，Channel Plugin 在其后面拥有 Channel 特定的发现和执行。

当前边界：

- 核心拥有共享 `message` Tool 宿主、Prompt 连接、Session/线程记录和执行分发
- Channel Plugin 拥有范围化的动作发现、能力发现以及任何 Channel 特定的模式片段
- Channel Plugin 拥有 Provider 特定的 Session 对话语法，例如对话 id 如何编码线程 id 或从父级对话继承
- Channel Plugin 通过其动作适配器执行最终动作

对于 Channel Plugin，SDK 接口是 `ChannelMessageActionAdapter.describeMessageTool(...)`。这个统一的发现调用让 Plugin 一起返回其可见动作、能力和模式贡献，这样这些部分就不会相互偏离。

当 Channel 特定的消息 Tool 参数携带媒体来源（例如本地路径或远程媒体 URL）时，Plugin 还应从 `describeMessageTool(...)` 返回 `mediaSourceParams`。核心使用该显式列表来应用沙箱路径规范化和出站媒体访问提示，而无需硬编码 Plugin 拥有的参数名称。优先使用动作范围映射，而非一个 Channel 范围的扁平列表，这样仅限配置文件的媒体参数就不会在不相关的动作（如 `send`）上被规范化。

核心将运行时作用域传入该发现步骤。重要字段包括：

- `accountId`
- `currentChannelId`
- `currentThreadTs`
- `currentMessageId`
- `sessionKey`
- `sessionId`
- `agentId`
- 受信任的入站 `requesterSenderId`

这对于上下文敏感的 Plugin 很重要。Channel 可以根据活跃账户、当前房间/线程/消息或受信任的请求者身份隐藏或暴露消息动作，而无需在核心 `message` Tool 中硬编码 Channel 特定的分支。

这就是为什么嵌入式运行器路由更改仍然是 Plugin 工作：运行器负责将当前聊天/Session 身份转发到 Plugin 发现边界，以便共享 `message` Tool 为当前轮次暴露正确的 Channel 拥有的接口。

对于 Channel 拥有的执行辅助工具，打包 Plugin 应将执行运行时保留在其自己的扩展模块中。核心不再在 `src/agents/tools` 下拥有 Discord、Slack、Telegram 或 WhatsApp 消息动作运行时。我们不发布单独的 `plugin-sdk/*-action-runtime` 子路径，打包 Plugin 应直接从其扩展拥有的模块导入自己的本地运行时代码。

同样的边界适用于一般的 Provider 命名 SDK 接缝：核心不应为 Slack、Discord、Signal、WhatsApp 或类似扩展导入特定 Channel 的便利 barrel。如果核心需要某个行为，要么消费打包 Plugin 自己的 `api.ts` / `runtime-api.ts` barrel，要么将需求提升为共享 SDK 中的通用能力。

对于投票，有两个执行路径：

- `outbound.sendPoll` 是适合通用投票模型的 Channel 的共享基线
- `actions.handleAction("poll")` 是 Channel 特定投票语义或额外投票参数的首选路径

核心现在将共享投票解析推迟到 Plugin 投票分发拒绝该动作之后，因此 Plugin 拥有的投票处理程序可以接受 Channel 特定的投票字段，而不会被通用投票解析器首先阻挡。

完整启动序列请参见 [Plugin 架构内部机制](/plugins/architecture-internals)。

## 能力所有权模型

OpenClaw 将原生 Plugin 视为**公司**或**功能**的所有权边界，而不是无关集成的集合。

这意味着：

- 公司 Plugin 通常应该拥有该公司所有面向 OpenClaw 的接口
- 功能 Plugin 通常应该拥有它引入的完整功能接口
- Channel 应该消费共享的核心能力，而不是临时重新实现 Provider 行为

<AccordionGroup>
  <Accordion title="厂商多能力">
    `openai` 拥有文本推理、语音、实时语音、媒体理解和图像生成。`google` 拥有文本推理以及媒体理解、图像生成和 Web 搜索。`qwen` 拥有文本推理以及媒体理解和视频生成。
  </Accordion>
  <Accordion title="厂商单能力">
    `elevenlabs` 和 `microsoft` 拥有语音；`firecrawl` 拥有 Web 抓取；`minimax` / `mistral` / `moonshot` / `zai` 拥有媒体理解后端。
  </Accordion>
  <Accordion title="功能 Plugin">
    `voice-call` 拥有通话传输、Tool、CLI、路由和 Twilio 媒体流桥接，但消费共享语音、实时转录和实时语音能力，而不是直接导入厂商 Plugin。
  </Accordion>
</AccordionGroup>

预期的最终状态是：

- OpenAI 即使跨越文本模型、语音、图像和未来视频也保留在一个 Plugin 中
- 另一个厂商可以对其自己的接口面积做同样的事情
- Channel 不关心哪个厂商 Plugin 拥有 Provider；它们消费核心暴露的共享能力契约

这是关键区别：

- **Plugin** = 所有权边界
- **能力** = 多个 Plugin 可以实现或消费的核心契约

因此，如果 OpenClaw 添加了视频等新领域，第一个问题不是"哪个 Provider 应该硬编码视频处理？"而是"核心视频能力契约是什么？"一旦该契约存在，厂商 Plugin 就可以向其注册，Channel/功能 Plugin 就可以消费它。

如果能力尚不存在，通常正确的做法是：

<Steps>
  <Step title="定义能力">
    在核心中定义缺失的能力。
  </Step>
  <Step title="通过 SDK 暴露">
    以类型化方式通过 Plugin API/运行时暴露它。
  </Step>
  <Step title="连接消费者">
    将 Channel/功能接入该能力。
  </Step>
  <Step title="厂商实现">
    让厂商 Plugin 注册实现。
  </Step>
</Steps>

这使所有权明确，同时避免核心行为依赖单一厂商或特定 Plugin 代码路径。

### 能力分层

在决定代码归属时，使用以下心智模型：

<Tabs>
  <Tab title="核心能力层">
    共享编排、策略、回退、配置合并规则、传递语义和类型化契约。
  </Tab>
  <Tab title="厂商 Plugin 层">
    厂商特定 API、身份验证、模型目录、语音合成、图像生成、未来视频后端、使用端点。
  </Tab>
  <Tab title="Channel/功能 Plugin 层">
    Slack/Discord/voice-call/等集成，消费核心能力并在接口上呈现它们。
  </Tab>
</Tabs>

例如，TTS 遵循以下形态：

- 核心拥有回复时 TTS 策略、回退顺序、偏好和 Channel 传递
- `openai`、`elevenlabs` 和 `microsoft` 拥有合成实现
- `voice-call` 消费电话 TTS 运行时辅助工具

同样的模式应该用于未来的能力。

### 多能力公司 Plugin 示例

公司 Plugin 从外部看应该是有凝聚力的。如果 OpenClaw 具有模型、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取和 Web 搜索的共享契约，厂商可以在一个地方拥有其所有接口：

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
      // auth/model catalog/runtime hooks
    });

    api.registerSpeechProvider({
      id: "exampleai",
      // vendor speech config — implement the SpeechProviderPlugin interface directly
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
        // credential + fetch logic
      }),
    );
  },
};

export default plugin;
```

重要的不是确切的辅助工具名称，而是形态：

- 一个 Plugin 拥有厂商接口
- 核心仍然拥有能力契约
- Channel 和功能 Plugin 消费 `api.runtime.*` 辅助工具，而不是厂商代码
- 契约测试可以断言 Plugin 注册了它声称拥有的能力

### 能力示例：视频理解

OpenClaw 已经将图像/音频/视频理解视为一个共享能力。同样的所有权模型适用于此：

<Steps>
  <Step title="核心定义契约">
    核心定义媒体理解契约。
  </Step>
  <Step title="厂商 Plugin 注册">
    厂商 Plugin 根据情况注册 `describeImage`、`transcribeAudio` 和 `describeVideo`。
  </Step>
  <Step title="消费者使用共享行为">
    Channel 和功能 Plugin 消费共享的核心行为，而不是直接接入厂商代码。
  </Step>
</Steps>

这避免了将某一个 Provider 的视频假设嵌入核心。Plugin 拥有厂商接口；核心拥有能力契约和回退行为。

视频生成已经使用了同样的序列：核心拥有类型化能力契约和运行时辅助工具，厂商 Plugin 向其注册 `api.registerVideoGenerationProvider(...)` 实现。

需要具体的推出检查清单？请参见 [能力手册](/tools/capability-cookbook)。

## 契约和执行

Plugin API 接口有意在 `OpenClawPluginApi` 中进行类型化和集中化。该契约定义了支持的注册点以及 Plugin 可以依赖的运行时辅助工具。

为什么这很重要：

- Plugin 作者获得一个稳定的内部标准
- 核心可以拒绝重复所有权，例如两个 Plugin 注册相同的 Provider id
- 启动可以为格式错误的注册提供可操作的诊断
- 契约测试可以强制执行打包 Plugin 所有权并防止静默漂移

有两层执行：

<AccordionGroup>
  <Accordion title="运行时注册执行">
    Plugin 注册表在 Plugin 加载时验证注册。例如：重复的 Provider id、重复的语音 Provider id 和格式错误的注册会产生 Plugin 诊断，而不是未定义行为。
  </Accordion>
  <Accordion title="契约测试">
    打包的 Plugin 在测试运行期间被捕获到契约注册表中，以便 OpenClaw 可以明确断言所有权。目前用于模型 Provider、语音 Provider、Web 搜索 Provider 和打包注册所有权。
  </Accordion>
</AccordionGroup>

实际效果是 OpenClaw 预先知道哪个 Plugin 拥有哪个接口。这使核心和 Channel 可以无缝组合，因为所有权是声明的、类型化的且可测试的，而非隐式的。

### 契约的内容

<Tabs>
  <Tab title="好的契约">
    - 类型化
    - 小巧
    - 能力特定
    - 由核心拥有
    - 可被多个 Plugin 重用
    - Channel/功能无需厂商知识即可消费
  </Tab>
  <Tab title="不好的契约">
    - 隐藏在核心中的厂商特定策略
    - 绕过注册表的一次性 Plugin 逃生舱
    - Channel 代码直接接入厂商实现
    - 不属于 `OpenClawPluginApi` 或 `api.runtime` 的临时运行时对象
  </Tab>
</Tabs>

如有疑问，提升抽象层级：先定义能力，然后让 Plugin 接入它。

## 执行模型

原生 OpenClaw Plugin **在进程内**与 Gateway 运行。它们不是沙箱化的。已加载的原生 Plugin 与核心代码具有相同的进程级信任边界。

<Warning>
原生 Plugin 的影响：Plugin 可以注册 Tool、网络处理程序、Hook 和服务；Plugin 错误可能导致 Gateway 崩溃或不稳定；恶意原生 Plugin 等同于 OpenClaw 进程内的任意代码执行。
</Warning>

兼容的 Bundle 默认更安全，因为 OpenClaw 目前将它们视为元数据/内容包。在当前版本中，这主要意味着打包的 Skill。

对于非打包 Plugin，使用允许列表和显式安装/加载路径。将工作区 Plugin 视为开发时代码，而不是生产默认值。

对于打包工作区包名，将 Plugin id 锚定在 npm 名称中：默认为 `@openclaw/<id>`，或者当包有意公开更窄的 Plugin 角色时，使用经过批准的类型化后缀，如 `-provider`、`-plugin`、`-speech`、`-sandbox` 或 `-media-understanding`。

<Note>
**信任说明：**

- `plugins.allow` 信任 **Plugin id**，而不是来源出处。
- 与打包 Plugin 具有相同 id 的工作区 Plugin 在启用/允许列表中时，有意遮蔽打包副本。
- 这对于本地开发、补丁测试和热修复是正常且有用的。
- 打包 Plugin 的信任从源快照解析——加载时磁盘上的清单和代码——而不是从安装元数据解析。损坏或被替换的安装记录不能静默地将打包 Plugin 的信任范围扩大到超出实际源声明的范围。
  </Note>

## 导出边界

OpenClaw 导出能力，而不是实现便利性。

保持能力注册公开。修剪非契约辅助导出：

- 打包 Plugin 特定的辅助子路径
- 不作为公共 API 的运行时管道子路径
- 厂商特定的便利辅助工具
- 作为实现细节的设置/入门辅助工具

保留的打包 Plugin 辅助子路径已从生成的 SDK 导出映射中撤回。将所有者特定的辅助工具保留在所属 Plugin 包内；仅将可重用的宿主行为提升为通用 SDK 契约，例如 `plugin-sdk/gateway-runtime`、`plugin-sdk/security-runtime` 和 `plugin-sdk/plugin-config-runtime`。

## 内部机制和参考

有关加载管道、注册表模型、Provider 运行时 Hook、Gateway HTTP 路由、消息 Tool 模式、Channel 目标解析、Provider 目录、Context Engine Plugin 以及添加新能力的指南，请参见 [Plugin 架构内部机制](/plugins/architecture-internals)。

## 相关

- [构建 Plugin](/plugins/building-plugins)
- [Plugin 清单](/plugins/manifest)
- [Plugin SDK 设置](/plugins/sdk-setup)
