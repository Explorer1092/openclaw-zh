---
mmh3_hash: "a2b5b4825189f2e23f8512d9ce3e3c36"
summary: "Plugin 架构内部机制：加载流程、注册表、运行时 Hook、HTTP 路由和参考表"
read_when:
  - 实现 Provider 运行时 Hook、Channel 生命周期或 Package Pack
  - 调试 Plugin 加载顺序或注册表状态
  - 添加新的 Plugin 功能或 Context Engine Plugin
title: "Plugin 架构内部机制"
---

公开的能力模型、Plugin 形态及所有权/执行契约，请参见 [Plugin 架构](/plugins/architecture)。本页是内部机制的参考文档：加载流程、注册表、运行时 Hook、Gateway HTTP 路由、导入路径和 Schema 表。

## 加载流程

启动时，OpenClaw 大致执行以下操作：

1. 发现候选 Plugin 根目录
2. 读取原生或兼容的 Bundle Manifest 及 Package 元数据
3. 拒绝不安全的候选项
4. 规范化 Plugin 配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定每个候选项的启用状态
6. 加载已启用的原生模块：内置 Bundle 模块使用原生加载器；未构建的原生 Plugin 使用 jiti
7. 调用原生 `register(api)` Hook 并将注册信息收集到 Plugin 注册表
8. 将注册表暴露给命令/运行时界面

<Note>
`activate` 是 `register` 的旧版别名——加载器会解析其中存在的那个（`def.register ?? def.activate`），并在相同节点调用。所有 Bundle Plugin 使用 `register`；新 Plugin 请优先使用 `register`。
</Note>

安全检查发生在**运行时执行之前**。当入口逃逸出 Plugin 根目录、路径对所有人可写，或对于非 Bundle Plugin 路径所有权存在可疑时，候选项将被阻止。

### Manifest 优先行为

Manifest 是控制平面的事实来源。OpenClaw 使用它来：

- 识别 Plugin
- 发现已声明的 Channel/Skill/配置 Schema 或 Bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/目录元数据
- 在不加载 Plugin 运行时的情况下保留廉价的激活和设置描述符

对于原生 Plugin，运行时模块是数据平面部分。它注册钩子、工具、命令或 Provider 流程等实际行为。

可选的 Manifest `activation` 和 `setup` 块保留在控制平面。它们是仅用于元数据的描述符，用于激活规划和设置发现；它们不替代运行时注册、`register(...)` 或 `setupEntry`。首批实时激活消费者现在使用 Manifest 命令、Channel 和 Provider 提示，在更广泛的注册表实体化之前缩小 Plugin 加载范围：

- CLI 加载缩小到拥有所请求主命令的 Plugin
- Channel 设置/Plugin 解析缩小到拥有所请求 Channel id 的 Plugin
- 显式 Provider 设置/运行时解析缩小到拥有所请求 Provider id 的 Plugin

激活规划器为现有调用者提供仅 ids API，为新诊断提供计划 API。计划条目报告 Plugin 被选中的原因，将显式 `activation.*` 规划器提示与来自 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 Hook 的 Manifest 所有权回退分离。该原因分离是兼容性边界：现有 Plugin 元数据继续工作，而新代码可以检测广泛提示或回退行为，而无需更改运行时加载语义。

设置发现现在优先使用描述符拥有的 id（如 `setup.providers` 和 `setup.cliBackends`）来缩小候选 Plugin，然后才回退到仍需要设置时运行时 Hook 的 Plugin 的 `setup-api`。Provider 设置列表使用 Manifest `providerAuthChoices`、描述符派生的设置选项和安装目录元数据，而无需加载 Provider 运行时。显式 `setup.requiresRuntime: false` 是仅描述符的截止；省略的 `requiresRuntime` 保留传统 setup-api 回退以确保兼容性。如果多个发现的 Plugin 声明相同的规范化设置 Provider 或 CLI 后端 id，设置查找将拒绝不明确的所有者，而不是依赖发现顺序。当设置运行时确实执行时，注册表诊断会报告 `setup.providers`/`setup.cliBackends` 与 setup-api 注册的 Provider 或 CLI 后端之间的漂移，而不会阻止旧版 Plugin。

### 加载器缓存的内容

OpenClaw 为以下内容保留短期进程内缓存：

- 发现结果
- Manifest 注册表数据
- 已加载的 Plugin 注册表

这些缓存减少了突发启动和重复命令的开销。可将其视为短期性能缓存，而非持久化存储。

性能说明：

- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 可禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 注册表模型

已加载的 Plugin 不会直接修改随机的核心全局变量。它们注册到中央 Plugin 注册表。

注册表跟踪：

- Plugin 记录（身份、来源、原始来源、状态、诊断）
- 工具
- 旧版 Hook 和类型化 Hook
- Channel
- Provider
- Gateway RPC 处理程序
- HTTP 路由
- CLI 注册器
- 后台服务
- Plugin 拥有的命令

核心功能随后从注册表读取，而不是直接与 Plugin 模块通信。这使加载保持单向：

- Plugin 模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性至关重要。这意味着大多数核心界面只需要一个集成点："读取注册表"，而不是"对每个 Plugin 模块进行特殊处理"。

## 对话绑定回调

绑定对话的 Plugin 可以在审批解析后做出响应。

使用 `api.onConversationBindingResolved(...)` 在绑定请求被批准或拒绝后接收回调：

```ts
export default {
  id: "my-plugin",
  register(api) {
    api.onConversationBindingResolved(async (event) => {
      if (event.status === "approved") {
        // 此 Plugin + 对话现在存在绑定。
        console.log(event.binding?.conversationId);
        return;
      }

      // 请求被拒绝；清除任何本地待处理状态。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调负载字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id 和对话元数据

此回调仅用于通知。它不会更改允许绑定对话的人员，并在核心审批处理完成后运行。

## Provider 运行时 Hook

Provider Plugin 有三层：

- **Manifest 元数据**用于廉价的预运行时查找：`setup.providers[].envVars`、已弃用的兼容性 `providerAuthEnvVars`、`providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置时 Hook**：`catalog`（旧版 `discovery`）加上 `applyConfigDefaults`。
- **运行时 Hook**：40+ 个可选 Hook，涵盖身份验证、模型解析、流包装、思考级别、重放策略和使用端点。请参见 [Hook 顺序和用法](#hook-顺序和用法) 下的完整列表。

OpenClaw 仍然拥有通用 Agent 循环、故障转移、转录处理和工具策略。这些 Hook 是特定于 Provider 的行为扩展界面，无需整个自定义推理传输。

当 Provider 具有基于环境的凭据，且通用身份验证/状态/模型选择器路径在不加载 Plugin 运行时的情况下应看到这些凭据时，使用 Manifest `setup.providers[].envVars`。已弃用的 `providerAuthEnvVars` 在弃用窗口期间仍由兼容性适配器读取，使用它的非 Bundle Plugin 会收到 Manifest 诊断。当一个 Provider id 应重用另一个 Provider id 的环境变量、身份验证配置文件、配置支持的身份验证和 API 密钥引导选项时，使用 Manifest `providerAuthAliases`。当引导/身份验证选择 CLI 界面应在不加载 Provider 运行时的情况下知道 Provider 的选项 id、组标签和简单的单标志身份验证配置时，使用 Manifest `providerAuthChoices`。将 Provider 运行时 `envVars` 保留用于面向操作员的提示，例如引导标签或 OAuth 客户端 id/客户端密钥设置变量。

当 Channel 具有基于环境的身份验证或设置，且通用 shell 环境回退、配置/状态检查或设置提示应在不加载 Channel 运行时的情况下看到这些内容时，使用 Manifest `channelEnvVars`。

### Hook 顺序和用法

对于模型/Provider Plugin，OpenClaw 大致按以下顺序调用 Hook。"何时使用"列是快速决策指南。

| # | Hook | 功能 | 何时使用 |
| --- | --- | --- | --- |
| 1 | `catalog` | 在 `models.json` 生成期间将 Provider 配置发布到 `models.providers` | Provider 拥有目录或基础 URL 默认值 |
| 2 | `applyConfigDefaults` | 在配置实体化期间应用 Provider 拥有的全局配置默认值 | 默认值取决于身份验证模式、环境或 Provider 模型系列语义 |
| -- | _(内置模型查找)_ | OpenClaw 首先尝试正常的注册表/目录路径 | _(非 Plugin Hook)_ |
| 3 | `normalizeModelId` | 在查找之前规范化旧版或预览模型 id 别名 | Provider 拥有规范模型解析之前的别名清理 |
| 4 | `normalizeTransport` | 在通用模型组装之前规范化 Provider 系列 `api`/`baseUrl` | Provider 拥有同一传输系列中自定义 Provider id 的传输清理 |
| 5 | `normalizeConfig` | 在运行时/Provider 解析之前规范化 `models.providers.<id>` | Provider 需要应随 Plugin 一起存在的配置清理；Bundle Google 系列助手也支持受支持的 Google 配置条目 |
| 6 | `applyNativeStreamingUsageCompat` | 对配置 Provider 应用原生流式使用兼容性重写 | Provider 需要端点驱动的原生流式使用元数据修复 |
| 7 | `resolveConfigApiKey` | 在运行时身份验证加载之前解析配置 Provider 的环境标记身份验证 | Provider 具有 Provider 拥有的环境标记 API 密钥解析；`amazon-bedrock` 在此处也有内置的 AWS 环境标记解析器 |
| 8 | `resolveSyntheticAuth` | 在不持久化明文的情况下显示本地/自托管或配置支持的身份验证 | Provider 可以使用合成/本地凭据标记运行 |
| 9 | `resolveExternalAuthProfiles` | 覆盖 Provider 拥有的外部身份验证配置文件；CLI/应用程序拥有的凭据的默认 `persistence` 为 `runtime-only` | Provider 重用外部身份验证凭据而不持久化复制的刷新令牌；在 Manifest 中声明 `contracts.externalAuthProviders` |
| 10 | `shouldDeferSyntheticProfileAuth` | 将存储的合成配置文件占位符放在环境/配置支持的身份验证之后 | Provider 存储不应获得优先权的合成占位符配置文件 |
| 11 | `resolveDynamicModel` | Provider 拥有的尚未在本地注册表中的模型 id 的同步回退 | Provider 接受任意上游模型 id |
| 12 | `prepareDynamicModel` | 异步预热，然后 `resolveDynamicModel` 再次运行 | Provider 在解析未知 id 之前需要网络元数据 |
| 13 | `normalizeResolvedModel` | 嵌入式运行器使用已解析模型之前的最终重写 | Provider 需要传输重写但仍使用核心传输 |
| 14 | `contributeResolvedModelCompat` | 为另一种兼容传输背后的供应商模型贡献兼容标志 | Provider 在代理传输上识别自己的模型而不接管 Provider |
| 15 | `capabilities` | 共享核心逻辑使用的 Provider 拥有的转录/工具元数据 | Provider 需要转录/Provider 系列特性 |
| 16 | `normalizeToolSchemas` | 在嵌入式运行器看到工具 Schema 之前进行规范化 | Provider 需要传输系列 Schema 清理 |
| 17 | `inspectToolSchemas` | 规范化后显示 Provider 拥有的 Schema 诊断 | Provider 希望在不向核心传授 Provider 特定规则的情况下发出关键字警告 |
| 18 | `resolveReasoningOutputMode` | 选择原生与标记的推理输出契约 | Provider 需要标记的推理/最终输出而不是原生字段 |
| 19 | `prepareExtraParams` | 通用流选项包装器之前的请求参数规范化 | Provider 需要默认请求参数或每个 Provider 的参数清理 |
| 20 | `createStreamFn` | 用自定义传输完全替换正常流路径 | Provider 需要自定义线协议，而不仅仅是包装器 |
| 21 | `wrapStreamFn` | 应用通用包装器后的流包装器 | Provider 需要请求头/正文/模型兼容包装器而无需自定义传输 |
| 22 | `resolveTransportTurnState` | 附加原生每轮传输头或元数据 | Provider 希望通用传输发送 Provider 原生轮次标识 |
| 23 | `resolveWebSocketSessionPolicy` | 附加原生 WebSocket 头或 Session 冷却策略 | Provider 希望通用 WS 传输调整 Session 头或回退策略 |
| 24 | `formatApiKey` | 身份验证配置文件格式化器：存储的配置文件变为运行时 `apiKey` 字符串 | Provider 存储额外的身份验证元数据并需要自定义运行时令牌形式 |
| 25 | `refreshOAuth` | 用于自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖 | Provider 不适合共享的 `pi-ai` 刷新器 |
| 26 | `buildAuthDoctorHint` | OAuth 刷新失败时附加的修复提示 | Provider 在刷新失败后需要 Provider 拥有的身份验证修复指导 |
| 27 | `matchesContextOverflowError` | Provider 拥有的上下文窗口溢出匹配器 | Provider 有通用启发式会遗漏的原始溢出错误 |
| 28 | `classifyFailoverReason` | Provider 拥有的故障转移原因分类 | Provider 可以将原始 API/传输错误映射到速率限制/过载等 |
| 29 | `isCacheTtlEligible` | 代理/回程 Provider 的提示缓存策略 | Provider 需要特定于代理的缓存 TTL 门控 |
| 30 | `buildMissingAuthMessage` | 替换通用缺少身份验证恢复消息 | Provider 需要特定于 Provider 的缺少身份验证恢复提示 |
| 31 | `suppressBuiltInModel` | 过时的上游模型抑制加上可选的面向用户的错误提示 | Provider 需要隐藏过时的上游行或用供应商提示替换它们 |
| 32 | `augmentModelCatalog` | 发现后附加的合成/最终目录行 | Provider 在 `models list` 和选择器中需要合成的前向兼容行 |
| 33 | `resolveThinkingProfile` | 模型特定的 `/think` 级别集、显示标签和默认值 | Provider 为选定模型公开自定义思考梯级或二元标签 |
| 34 | `isBinaryThinking` | 开/关推理切换兼容性 Hook | Provider 仅公开二元思考开/关 |
| 35 | `supportsXHighThinking` | `xhigh` 推理支持兼容性 Hook | Provider 希望仅在模型子集上使用 `xhigh` |
| 36 | `resolveDefaultThinkingLevel` | 默认 `/think` 级别兼容性 Hook | Provider 拥有模型系列的默认 `/think` 策略 |
| 37 | `isModernModelRef` | 用于实时配置文件过滤器和烟雾选择的现代模型匹配器 | Provider 拥有实时/烟雾首选模型匹配 |
| 38 | `prepareRuntimeAuth` | 在推理之前将配置的凭据交换为实际的运行时令牌/密钥 | Provider 需要令牌交换或短期请求凭据 |
| 39 | `resolveUsageAuth` | 解析 `/usage` 和相关状态界面的使用/计费凭据 | Provider 需要自定义使用/配额令牌解析或不同的使用凭据 |
| 40 | `fetchUsageSnapshot` | 在解析身份验证后获取并规范化特定于 Provider 的使用/配额快照 | Provider 需要特定于 Provider 的使用端点或有效负载解析器 |
| 41 | `createEmbeddingProvider` | 为内存/搜索构建 Provider 拥有的嵌入适配器 | 内存嵌入行为属于 Provider Plugin |
| 42 | `buildReplayPolicy` | 返回控制 Provider 转录处理的重放策略 | Provider 需要自定义转录策略（例如，思考块剥离） |
| 43 | `sanitizeReplayHistory` | 通用转录清理后重写重放历史记录 | Provider 需要超出共享压缩助手的特定于 Provider 的重放重写 |
| 44 | `validateReplayTurns` | 嵌入式运行器之前的最终重放轮次验证或重新整形 | Provider 传输在通用净化后需要更严格的轮次验证 |
| 45 | `onModelSelected` | 运行 Provider 拥有的选择后副作用 | Provider 在模型激活时需要遥测或 Provider 拥有的状态 |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 首先检查匹配的 Provider Plugin，然后通过其他具有 Hook 能力的 Provider Plugin 进行回退，直到其中一个实际更改模型 id 或传输/配置。这使别名/兼容 Provider Shim 无需调用者知道哪个 Bundle Plugin 拥有重写就可以工作。如果没有 Provider Hook 重写受支持的 Google 系列配置条目，Bundle Google 配置规范化器仍会应用该兼容性清理。

如果 Provider 需要完全自定义的线协议或自定义请求执行器，那是另一类扩展。这些 Hook 用于仍在 OpenClaw 正常推理循环上运行的 Provider 行为。

### Provider 示例

```ts
api.registerProvider({
  id: "example-proxy",
  label: "Example Proxy",
  auth: [],
  catalog: {
    order: "simple",
    run: async (ctx) => {
      const apiKey = ctx.resolveProviderApiKey("example-proxy").apiKey;
      if (!apiKey) {
        return null;
      }
      return {
        provider: {
          baseUrl: "https://proxy.example.com/v1",
          apiKey,
          api: "openai-completions",
          models: [{ id: "auto", name: "Auto" }],
        },
      };
    },
  },
  resolveDynamicModel: (ctx) => ({
    id: ctx.modelId,
    name: ctx.modelId,
    provider: "example-proxy",
    api: "openai-completions",
    baseUrl: "https://proxy.example.com/v1",
    reasoning: false,
    input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 128000,
    maxTokens: 8192,
  }),
  prepareRuntimeAuth: async (ctx) => {
    const exchanged = await exchangeToken(ctx.apiKey);
    return {
      apiKey: exchanged.token,
      baseUrl: exchanged.baseUrl,
      expiresAt: exchanged.expiresAt,
    };
  },
  resolveUsageAuth: async (ctx) => {
    const auth = await ctx.resolveOAuthToken();
    return auth ? { token: auth.token } : null;
  },
  fetchUsageSnapshot: async (ctx) => {
    return await fetchExampleProxyUsage(ctx.token, ctx.timeoutMs, ctx.fetchFn);
  },
});
```

### 内置示例

Bundle Provider Plugin 结合上述 Hook 以满足每个供应商的目录、身份验证、思考、重放和使用需求。权威 Hook 集与 `extensions/` 下的每个 Plugin 一起存在；本页说明这些形式而不是镜像列表。

<AccordionGroup>
  <Accordion title="直通目录 Provider">
    OpenRouter、Kilocode、Z.AI、xAI 注册 `catalog` 加上 `resolveDynamicModel`/`prepareDynamicModel`，以便它们可以在 OpenClaw 静态目录之前显示上游模型 id。
  </Accordion>
  <Accordion title="OAuth 和使用端点 Provider">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 将 `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` + `fetchUsageSnapshot` 配对，以拥有令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重放和转录清理系列">
    共享命名系列（`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`）让 Provider 通过 `buildReplayPolicy` 选择加入转录策略，而不是每个 Plugin 重新实现清理。
  </Accordion>
  <Accordion title="仅目录 Provider">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine` 仅注册 `catalog` 并使用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 特定流助手">
    Beta 头、`/fast`/`serviceTier` 和 `context1m` 存在于 Anthropic Plugin 的公共 `api.ts`/`contract-api.ts` 接缝（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）中，而不是在通用 SDK 中。
  </Accordion>
</AccordionGroup>

## 运行时助手

Plugin 可以通过 `api.runtime` 访问选定的核心助手。对于 TTS：

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

说明：

- `textToSpeech` 返回用于文件/语音注释界面的正常核心 TTS 输出有效负载。
- 使用核心 `messages.tts` 配置和 Provider 选择。
- 返回 PCM 音频缓冲区 + 采样率。Plugin 必须为 Provider 重采样/编码。
- `listVoices` 对每个 Provider 是可选的。用于供应商拥有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，如区域设置、性别和个性标签，用于 Provider 感知选择器。
- OpenAI 和 ElevenLabs 今天支持电话。Microsoft 不支持。

Plugin 也可以通过 `api.registerSpeechProvider(...)` 注册语音 Provider。

```ts
api.registerSpeechProvider({
  id: "acme-speech",
  label: "Acme Speech",
  isConfigured: ({ config }) => Boolean(config.messages?.tts),
  synthesize: async (req) => {
    return {
      audioBuffer: Buffer.from([]),
      outputFormat: "mp3",
      fileExtension: ".mp3",
      voiceCompatible: false,
    };
  },
});
```

说明：

- 将 TTS 策略、回退和回复交付保留在核心中。
- 将供应商拥有的合成行为用于语音 Provider。
- 旧版 Microsoft `edge` 输入被规范化为 `microsoft` Provider id。
- 首选的所有权模型是以公司为导向的：一个供应商 Plugin 可以拥有文本、语音、图像和未来的媒体 Provider，随着 OpenClaw 添加这些能力契约。

对于图像/音频/视频理解，Plugin 注册一个类型化的媒体理解 Provider，而不是通用的键/值包：

```ts
api.registerMediaUnderstandingProvider({
  id: "google",
  capabilities: ["image", "audio", "video"],
  describeImage: async (req) => ({ text: "..." }),
  transcribeAudio: async (req) => ({ text: "..." }),
  describeVideo: async (req) => ({ text: "..." }),
});
```

说明：

- 将编排、回退、配置和 Channel 接线保留在核心中。
- 将供应商行为保留在 Provider Plugin 中。
- 加法扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
- 视频生成已遵循相同的模式：
  - 核心拥有能力契约和运行时助手
  - 供应商 Plugin 注册 `api.registerVideoGenerationProvider(...)`
  - 功能/Channel Plugin 消费 `api.runtime.videoGeneration.*`

对于媒体理解运行时助手，Plugin 可以调用：

```ts
const image = await api.runtime.mediaUnderstanding.describeImageFile({
  filePath: "/tmp/inbound-photo.jpg",
  cfg: api.config,
  agentDir: "/tmp/agent",
});

const video = await api.runtime.mediaUnderstanding.describeVideoFile({
  filePath: "/tmp/inbound-video.mp4",
  cfg: api.config,
});
```

对于音频转录，Plugin 可以使用媒体理解运行时或旧版 STT 别名：

```ts
const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // 当无法可靠推断 MIME 时可选：
  mime: "audio/ogg",
});
```

说明：

- `api.runtime.mediaUnderstanding.*` 是图像/音频/视频理解的首选共享界面。
- 使用核心媒体理解音频配置（`tools.media.audio`）和 Provider 回退顺序。
- 当未产生转录输出时（例如跳过/不支持的输入）返回 `{ text: undefined }`。
- `api.runtime.stt.transcribeAudioFile(...)` 保留为兼容性别名。

Plugin 也可以通过 `api.runtime.subagent` 启动后台 Subagent 运行：

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "Expand this query into focused follow-up searches.",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

说明：

- `provider` 和 `model` 是可选的每次运行覆盖，而不是持久的 Session 更改。
- OpenClaw 仅对受信任的调用者接受这些覆盖字段。
- 对于 Plugin 拥有的回退运行，操作员必须使用 `plugins.entries.<id>.subagent.allowModelOverride: true` 选择加入。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任的 Plugin 限制到特定的规范 `provider/model` 目标，或使用 `"*"` 明确允许任何目标。
- 不受信任的 Plugin Subagent 运行仍然有效，但覆盖请求将被拒绝，而不是静默回退。
- Plugin 创建的 Subagent Session 标记有创建的 Plugin id。回退 `api.runtime.subagent.deleteSession(...)` 只能删除那些拥有的 Session；任意 Session 删除仍然需要管理员范围的 Gateway 请求。

对于网络搜索，Plugin 可以消费共享运行时助手，而不是接入 Agent 工具配线：

```ts
const providers = api.runtime.webSearch.listProviders({
  config: api.config,
});

const result = await api.runtime.webSearch.search({
  config: api.config,
  args: {
    query: "OpenClaw plugin runtime helpers",
    count: 5,
  },
});
```

Plugin 也可以通过 `api.registerWebSearchProvider(...)` 注册网络搜索 Provider。

说明：

- 将 Provider 选择、凭据解析和共享请求语义保留在核心中。
- 将特定于供应商的搜索传输用于网络搜索 Provider。
- `api.runtime.webSearch.*` 是功能/Channel Plugin 需要搜索行为而不依赖 Agent 工具包装器的首选共享界面。

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "A friendly lobster mascot", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`：使用配置的图像生成 Provider 链生成图像。
- `listProviders(...)`：列出可用的图像生成 Provider 及其能力。

## Gateway HTTP 路由

Plugin 可以使用 `api.registerHttpRoute(...)` 暴露 HTTP 端点。

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

- `path`：Gateway HTTP 服务器下的路由路径。
- `auth`：必填。使用 `"gateway"` 需要正常的 Gateway 身份验证，或使用 `"plugin"` 进行 Plugin 管理的身份验证/Webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一 Plugin 替换其自己的现有路由注册。
- `handler`：当路由处理请求时返回 `true`。

说明：

- `api.registerHttpHandler(...)` 已被删除，会导致 Plugin 加载错误。请改用 `api.registerHttpRoute(...)`。
- Plugin 路由必须显式声明 `auth`。
- 精确的 `path + match` 冲突将被拒绝，除非 `replaceExisting: true`，并且一个 Plugin 不能替换另一个 Plugin 的路由。
- 具有不同 `auth` 级别的重叠路由将被拒绝。仅在同一身份验证级别上保持 `exact`/`prefix` 回退链。
- `auth: "plugin"` 路由不会**自动**接收操作员运行时范围。它们用于 Plugin 管理的 Webhook/签名验证，而不是特权 Gateway 助手调用。
- `auth: "gateway"` 路由在 Gateway 请求运行时范围内运行，但该范围是有意保守的：
  - 共享密钥持有者身份验证（`gateway.auth.mode = "token"`/`"password"`）将 Plugin 路由运行时范围固定到 `operator.write`，即使调用者发送 `x-openclaw-scopes`
  - 受信任的身份承载 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅在标头明确存在时才接受 `x-openclaw-scopes`
  - 如果这些身份承载 Plugin 路由请求上没有 `x-openclaw-scopes`，运行时范围回退到 `operator.write`
- 实际规则：不要假设 Gateway 身份验证 Plugin 路由是隐式管理员界面。如果您的路由需要仅管理员行为，请要求身份承载身份验证模式并记录显式 `x-openclaw-scopes` 标头契约。

## Plugin SDK 导入路径

在编写新 Plugin 时，使用窄 SDK 子路径而不是单一的 `openclaw/plugin-sdk` 根桶。核心子路径：

| 子路径 | 用途 |
| --- | --- |
| `openclaw/plugin-sdk/plugin-entry` | Plugin 注册原语 |
| `openclaw/plugin-sdk/channel-core` | Channel 入口/构建助手 |
| `openclaw/plugin-sdk/core` | 通用共享助手和总括契约 |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod Schema（`OpenClawSchema`） |

Channel Plugin 从一系列窄接缝中选择——`channel-setup`、`setup-runtime`、`setup-adapter-runtime`、`setup-tools`、`channel-pairing`、`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、`channel-targets` 和 `channel-actions`。审批行为应整合到一个 `approvalCapability` 契约上，而不是混合不相关的 Plugin 字段。请参见 [Channel Plugin](/plugins/sdk-channel-plugins)。

运行时和配置助手存在于匹配的 `*-runtime` 子路径下（`approval-runtime`、`config-runtime`、`infra-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store` 等）。

<Info>
`openclaw/plugin-sdk/channel-runtime` 已弃用——这是旧版 Plugin 的兼容性 Shim。新代码应导入更窄的通用原语。
</Info>

仓库内部入口点（每个 Bundle Plugin 包根）：

- `index.js` — Bundle Plugin 入口
- `api.js` — 助手/类型桶
- `runtime-api.js` — 仅运行时桶
- `setup-entry.js` — 设置 Plugin 入口

外部 Plugin 只能导入 `openclaw/plugin-sdk/*` 子路径。切勿从核心或另一个 Plugin 导入另一个 Plugin 包的 `src/*`。Facade 加载的入口点在存在时优先使用活动运行时配置快照，然后回退到磁盘上已解析的配置文件。

`image-generation`、`media-understanding` 和 `speech` 等特定于能力的子路径之所以存在，是因为 Bundle Plugin 今天使用它们。它们不是自动长期冻结的外部契约——在依赖它们时检查相关 SDK 参考页面。

## 消息工具 Schema

Plugin 应拥有特定于 Channel 的 `describeMessageTool(...)` Schema 贡献，用于反应、已读和轮询等非消息原语。共享发送演示应使用通用 `MessagePresentation` 契约，而不是 Provider 原生按钮、组件、块或卡片字段。请参见 [消息呈现](/plugins/message-presentation) 了解契约、回退规则、Provider 映射和 Plugin 作者清单。

具有发送能力的 Plugin 通过消息能力声明它们可以渲染的内容：

- `presentation` 用于语义演示块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用于固定交付请求

核心决定是否原生渲染演示或将其降级为文本。不要从通用消息工具中暴露 Provider 原生 UI 逃逸舱口。用于旧版原生 Schema 的已弃用 SDK 助手仍为现有第三方 Plugin 导出，但新 Plugin 不应使用它们。

## Channel 目标解析

Channel Plugin 应拥有特定于 Channel 的目标语义。保持共享的出站主机通用，并使用消息适配器界面处理 Provider 规则：

- `messaging.inferTargetChatType({ to })` 在目录查找之前决定规范化目标是否应被视为 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心输入是否应直接跳到类 id 解析而不是目录搜索。
- `messaging.targetResolver.resolveTarget(...)` 是核心在规范化后或目录未命中后需要最终 Provider 拥有的解析时的 Plugin 回退。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析后拥有特定于 Provider 的 Session 路由构建。

推荐的分割：

- 使用 `inferTargetChatType` 进行应在搜索对等点/群组之前发生的类别决策。
- 使用 `looksLikeId` 进行"将此视为显式/原生目标 id"检查。
- 使用 `resolveTarget` 进行特定于 Provider 的规范化回退，而不是广泛的目录搜索。
- 将聊天 id、线程 id、JID、句柄和房间 id 等 Provider 原生 id 保留在 `target` 值或特定于 Provider 的参数中，而不是在通用 SDK 字段中。

## 配置支持的目录

从配置派生目录条目的 Plugin 应将该逻辑保留在 Plugin 中，并重用 `openclaw/plugin-sdk/directory-runtime` 中的共享助手。

在 Channel 需要配置支持的对等点/群组时使用此功能，例如：

- 允许列表驱动的 DM 对等点
- 配置的 Channel/群组映射
- 账户范围的静态目录回退

`directory-runtime` 中的共享助手只处理通用操作：

- 查询过滤
- 限制应用
- 去重/规范化助手
- 构建 `ChannelDirectoryEntry[]`

特定于 Channel 的账户检查和 id 规范化应保留在 Plugin 实现中。

## Provider 目录

Provider Plugin 可以使用 `registerProvider({ catalog: { run(...) { ... } } })` 为推理定义模型目录。

`catalog.run(...)` 返回与 OpenClaw 写入 `models.providers` 相同的形式：

- `{ provider }` 用于一个 Provider 条目
- `{ providers }` 用于多个 Provider 条目

当 Plugin 拥有特定于 Provider 的模型 id、基础 URL 默认值或身份验证门控的模型元数据时，使用 `catalog`。

`catalog.order` 控制 Plugin 目录相对于 OpenClaw 内置隐式 Provider 合并的时间：

- `simple`：普通 API 密钥或环境驱动的 Provider
- `profile`：身份验证配置文件存在时出现的 Provider
- `paired`：合成多个相关 Provider 条目的 Provider
- `late`：最后一次，在其他隐式 Provider 之后

后面的 Provider 在键冲突时获胜，因此 Plugin 可以有意地用相同 Provider id 覆盖内置 Provider 条目。

兼容性：

- `discovery` 仍作为旧版别名工作
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 使用 `catalog`

## 只读 Channel 检查

如果您的 Plugin 注册了一个 Channel，最好在 `resolveAccount(...)` 旁边实现 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。允许它假设凭据已完全实体化，并在所需密钥缺失时可以快速失败。
- 只读命令路径（如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 和 doctor/config 修复流程）不应仅为了描述配置而需要实体化运行时凭据。

推荐的 `inspectAccount(...)` 行为：

- 仅返回描述性账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭据来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 您不需要仅为报告只读可用性而返回原始令牌值。返回 `tokenStatus: "available"`（以及匹配的来源字段）对于状态样式命令就足够了。
- 当凭据通过 SecretRef 配置但在当前命令路径中不可用时，使用 `configured_unavailable`。

这让只读命令能够报告"已配置但在此命令路径中不可用"，而不是崩溃或错误报告账户未配置。

## Package Pack

Plugin 目录可以包含带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都成为一个 Plugin。如果 Pack 列出多个扩展，Plugin id 将变为 `name/<fileBase>`。

如果您的 Plugin 导入 npm 依赖项，请在该目录中安装它们，以便 `node_modules` 可用（`npm install`/`pnpm install`）。

安全防护：每个 `openclaw.extensions` 条目在符号链接解析后必须保留在 Plugin 目录内。逃逸出包目录的条目将被拒绝。

安全说明：`openclaw plugins install` 使用项目本地 `npm install --omit=dev --ignore-scripts`（无生命周期脚本，运行时无开发依赖项）安装 Plugin 依赖项，忽略继承的全局 npm 安装设置。保持 Plugin 依赖树"纯 JS/TS"并避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向轻量级的仅设置模块。当 OpenClaw 需要禁用 Channel Plugin 的设置界面，或 Channel Plugin 已启用但仍未配置时，它会加载 `setupEntry` 而不是完整的 Plugin 入口。当您的主 Plugin 入口还连接工具、Hook 或其他仅运行时代码时，这使启动和设置更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` 可以选择将 Channel Plugin 纳入相同的 `setupEntry` 路径，甚至在 Channel 已配置时在 Gateway 预监听启动阶段也这样做。

仅当 `setupEntry` 完全覆盖启动前必须存在的启动界面时才使用此功能。实际上，这意味着设置入口必须注册启动所依赖的每个 Channel 拥有的能力，例如：

- Channel 注册本身
- 在 Gateway 开始监听之前必须可用的任何 HTTP 路由
- 在同一窗口期间必须存在的任何 Gateway 方法、工具或服务

如果您的完整入口仍然拥有任何必需的启动能力，请不要启用此标志。保持 Plugin 使用默认行为，让 OpenClaw 在启动期间加载完整入口。

Bundle Channel 也可以发布仅设置契约界面助手，核心可以在加载完整 Channel 运行时之前查询这些助手。当前设置提升界面是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

核心在需要将旧版单账户 Channel 配置提升到 `channels.<id>.accounts.*` 而不加载完整 Plugin 入口时使用该界面。Matrix 是当前的 Bundle 示例：当命名账户已存在时，它只将身份验证/引导密钥移动到命名的提升账户，并且它可以保留配置的非规范默认账户密钥，而不是总是创建 `accounts.default`。

这些设置补丁适配器保持 Bundle 契约界面发现的懒惰性。导入时间保持轻量；提升界面仅在第一次使用时加载，而不是在模块导入时重新进入 Bundle Channel 启动。

当这些启动界面包括 Gateway RPC 方法时，将它们保留在 Plugin 特定前缀上。核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持保留，并始终解析为 `operator.admin`，即使 Plugin 请求更窄的范围。

示例：

```json
{
  "name": "@scope/my-channel",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

### Channel 目录元数据

Channel Plugin 可以通过 `openclaw.channel` 发布设置/发现元数据，通过 `openclaw.install` 发布安装提示。这保持核心目录无数据。

示例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "<bundled-plugin-local-path>",
      "defaultChoice": "npm"
    }
  }
}
```

超出最小示例的有用 `openclaw.channel` 字段：

- `detailLabel`：用于更丰富的目录/状态界面的次要标签
- `docsLabel`：文档链接的覆盖链接文本
- `preferOver`：此目录条目应优先于的较低优先级 Plugin/Channel id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择界面文案控件
- `markdownCapable`：将 Channel 标记为支持 Markdown 的，用于出站格式化决策
- `exposure.configured`：设置为 `false` 时，从已配置的 Channel 列表界面隐藏 Channel
- `exposure.setup`：设置为 `false` 时，从交互式设置/配置选择器隐藏 Channel
- `exposure.docs`：将 Channel 标记为内部/私有用于文档导航界面
- `showConfigured`/`showInSetup`：旧版别名，仍接受以确保兼容性；优先使用 `exposure`
- `quickstartAllowFrom`：将 Channel 纳入标准快速开始 `allowFrom` 流程
- `forceAccountBinding`：即使只有一个账户存在，也需要显式账户绑定
- `preferSessionLookupForAnnounceTarget`：解析公告目标时优先使用 Session 查找

OpenClaw 也可以合并**外部 Channel 目录**（例如，MPM 注册表导出）。在以下位置放置 JSON 文件：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧版别名。

生成的 Channel 目录条目和 Provider 安装目录条目在原始 `openclaw.install` 块旁边公开规范化的安装源事实。规范化的事实标识 npm 规格是精确版本还是浮动选择器，预期的完整性元数据是否存在，以及本地源路径是否也可用。当已知目录/包标识时，规范化的事实会在解析的 npm 包名称与该标识漂移时发出警告。当 `defaultChoice` 无效或指向不可用的源时，以及当 npm 完整性元数据存在而没有有效的 npm 源时，它们也会发出警告。消费者应将 `installSource` 视为附加的可选字段，以便手工构建的条目和目录 Shim 不必合成它。这让引导和诊断能够解释源平面状态，而不导入 Plugin 运行时。

官方外部 npm 条目应优先使用精确的 `npmSpec` 加上 `expectedIntegrity`。裸包名和 dist-tag 仍然有效以确保兼容性，但它们会显示源平面警告，以便目录可以向固定的、经过完整性检查的安装迁移，而不会破坏现有 Plugin。当引导从本地目录路径安装时，它会记录一个管理 Plugin 索引条目，其中 `source: "path"` 和工作区相对 `sourcePath`（如果可能）。绝对操作加载路径保留在 `plugins.load.paths` 中；安装记录避免将本地工作站路径复制到长期配置中。这使本地开发安装对源平面诊断可见，而不添加第二个原始文件系统路径披露界面。持久化的 `plugins/installs.json` Plugin 索引是安装的事实来源，可以在不加载 Plugin 运行时模块的情况下刷新。即使 Plugin Manifest 缺失或无效，其 `installRecords` 映射也是持久的；其 `plugins` 数组是可重建的 Manifest/缓存视图。

## Context Engine Plugin

Context Engine Plugin 拥有用于摄取、组装和压缩的 Session 上下文编排。使用 `api.registerContextEngine(id, factory)` 从您的 Plugin 注册它们，然后使用 `plugins.slots.contextEngine` 选择活动引擎。

当您的 Plugin 需要替换或扩展默认上下文管道而不仅仅是添加内存搜索或 Hook 时，使用此功能。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

如果您的引擎**不**拥有压缩算法，保持 `compact()` 已实现并明确委托它：

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", () => ({
    info: {
      id: "my-memory-engine",
      name: "My Memory Engine",
      ownsCompaction: false,
    },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages, availableTools, citationsMode }) {
      return {
        messages,
        estimatedTokens: 0,
        systemPromptAddition: buildMemorySystemPromptAddition({
          availableTools: availableTools ?? new Set(),
          citationsMode,
        }),
      };
    },
    async compact(params) {
      return await delegateCompactionToRuntime(params);
    },
  }));
}
```

## 添加新能力

当 Plugin 需要当前 API 不支持的行为时，不要绕过 Plugin 系统进行私有访问。添加缺失的能力。

推荐步骤：

1. 定义核心契约
   决定核心应拥有哪些共享行为：策略、回退、配置合并、生命周期、面向 Channel 的语义和运行时助手形式。
2. 添加类型化的 Plugin 注册/运行时界面
   用最小的有用类型化能力界面扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 连接核心 + Channel/功能消费者
   Channel 和功能 Plugin 应通过核心消费新能力，而不是直接导入供应商实现。
4. 注册供应商实现
   供应商 Plugin 随后针对该能力注册其后端。
5. 添加契约覆盖
   添加测试，使所有权和注册形式随时间保持明确。

这就是 OpenClaw 如何保持主见而不硬编码到一个 Provider 世界观的方式。请参见 [能力食谱](/tools/capability-cookbook) 了解具体文件清单和工作示例。

### 能力清单

当您添加新能力时，实现通常应一起触及这些界面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心运行器/运行时助手
- `src/plugins/types.ts` 中的 Plugin API 注册界面
- `src/plugins/registry.ts` 中的 Plugin 注册表配线
- 当功能/Channel Plugin 需要消费时，在 `src/plugins/runtime/*` 中的 Plugin 运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获/测试助手
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中的操作员/Plugin 文档

如果其中一个界面缺失，通常表明该能力尚未完全集成。

### 能力模板

最小模式：

```ts
// 核心契约
export type VideoGenerationProviderPlugin = {
  id: string;
  label: string;
  generateVideo: (req: VideoGenerationRequest) => Promise<VideoGenerationResult>;
};

// Plugin API
api.registerVideoGenerationProvider({
  id: "openai",
  label: "OpenAI",
  async generateVideo(req) {
    return await generateOpenAiVideo(req);
  },
});

// 功能/Channel Plugin 的共享运行时助手
const clip = await api.runtime.videoGeneration.generate({
  prompt: "Show the robot walking through the lab.",
  cfg,
});
```

契约测试模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

这使规则保持简单：

- 核心拥有能力契约 + 编排
- 供应商 Plugin 拥有供应商实现
- 功能/Channel Plugin 消费运行时助手
- 契约测试使所有权保持明确

## 相关

- [Plugin 架构](/plugins/architecture) — 公开能力模型和形态
- [Plugin SDK 子路径](/plugins/sdk-subpaths)
- [Plugin SDK 设置](/plugins/sdk-setup)
- [构建 Plugin](/plugins/building-plugins)
