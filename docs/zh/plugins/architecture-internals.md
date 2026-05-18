---
mmh3_hash: "cc798aa01a13632be4423001fe08973e"
summary: "Plugin 架构内部机制：加载流程、注册表、运行时 Hook、HTTP 路由和参考表"
read_when:
  - 实现 Provider 运行时 Hook、Channel 生命周期或 Package Pack
  - 调试 Plugin 加载顺序或注册表状态
  - 添加新的 Plugin 功能或 Context Engine Plugin
title: "Plugin 架构内部机制"
---

关于公开的能力模型、Plugin 形态及所有权/执行契约，请参见 [Plugin 架构](/plugins/architecture)。本页是内部机制的参考文档：加载流程、注册表、运行时 Hook、Gateway HTTP 路由、导入路径和 Schema 表。

## 加载流程

启动时，OpenClaw 大致执行以下操作：

1. 发现候选 Plugin 根目录
2. 读取原生或兼容的 Bundle Manifest 及 Package 元数据
3. 拒绝不安全的候选项
4. 规范化 Plugin 配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 为每个候选项决定启用状态
6. 加载已启用的原生模块：已构建的 Bundle 模块使用原生加载器；第三方本地 TypeScript 源码使用紧急 Jiti 回退
7. 调用原生 `register(api)` Hook 并将注册项收集到 Plugin 注册表中
8. 将注册表暴露给命令/运行时表面

<Note>
`activate` 是 `register` 的历史别名——加载器会解析两者中存在的那个（`def.register ?? def.activate`）并在相同位置调用它。所有 Bundle Plugin 均使用 `register`；新 Plugin 请优先使用 `register`。
</Note>

安全检查在运行时执行**之前**发生。当入口点逃出 Plugin 根目录、路径具有全局可写权限，或对于非 Bundle Plugin 路径所有权可疑时，候选项将被阻止。

被阻止的候选项仍与其 Plugin id 绑定以供诊断使用。如果配置仍然引用该 id，验证会将 Plugin 报告为存在但已被阻止，并指向路径安全警告，而不是将配置条目视为过时。

### Manifest 优先行为

Manifest 是控制平面的事实来源。OpenClaw 使用它来：

- 标识 Plugin
- 发现声明的 Channel/Skill/配置 Schema 或 Bundle 能力
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/目录元数据
- 在不加载 Plugin 运行时的情况下保留廉价的激活和设置描述符

对于原生 Plugin，运行时模块是数据平面部分。它注册实际行为，例如 Hook、工具、命令或 Provider 流程。

可选的 Manifest `activation` 和 `setup` 块保留在控制平面上。它们是用于激活规划和设置发现的纯元数据描述符；它们不替代运行时注册、`register(...)` 或 `setupEntry`。第一批实时激活消费者现在使用 Manifest 命令、Channel 和 Provider 提示来在更广泛的注册表实例化之前缩小 Plugin 加载范围：

- CLI 加载缩小到拥有所请求主命令的 Plugin
- Channel 设置/Plugin 解析缩小到拥有所请求 Channel id 的 Plugin
- 显式 Provider 设置/运行时解析缩小到拥有所请求 Provider id 的 Plugin
- Gateway 启动规划使用 `activation.onStartup` 进行显式启动导入和启动退出；没有启动元数据的 Plugin 仅通过更窄的激活触发器加载

请求时运行时预加载请求广泛的 `all` 范围时，仍会从配置、启动规划、已配置 Channel、插槽和自动启用规则中派生出明确的有效 Plugin id 集合。如果派生集合为空，OpenClaw 会加载空的运行时注册表，而不是扩展到每个可发现的 Plugin。

激活规划器为现有调用者提供仅 id 的 API，并为新诊断提供计划 API。计划条目报告 Plugin 被选择的原因，将显式 `activation.*` 规划器提示与 Manifest 所有权回退（例如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 Hook）区分开来。该原因拆分是兼容性边界：现有 Plugin 元数据继续工作，而新代码可以检测广泛提示或回退行为，而不改变运行时加载语义。

设置发现现在优先使用描述符拥有的 id，例如 `setup.providers` 和 `setup.cliBackends`，在回退到 `setup-api`（用于仍需要设置时运行时 Hook 的 Plugin）之前缩小候选 Plugin 范围。Provider 设置列表使用 Manifest `providerAuthChoices`、描述符派生的设置选项和安装目录元数据，而不加载 Provider 运行时。显式 `setup.requiresRuntime: false` 是仅描述符的截断点；省略 `requiresRuntime` 保持旧版 setup-api 回退以保持兼容性。如果多个发现的 Plugin 声明相同的规范化设置 Provider 或 CLI 后端 id，设置查找拒绝模糊的所有者，而不是依赖发现顺序。当设置运行时确实执行时，注册表诊断报告 `setup.providers` / `setup.cliBackends` 与 setup-api 注册的 Provider 或 CLI 后端之间的漂移，而不阻止旧版 Plugin。

### Plugin 缓存边界

OpenClaw 不在时钟窗口后面缓存 Plugin 发现结果或直接 Manifest 注册表数据。安装、Manifest 编辑和加载路径更改必须在下次显式元数据读取或快照重建时变得可见。Manifest 文件解析器可以保留以打开的 Manifest 路径、inode、大小和时间戳为键的有界文件签名缓存；该缓存仅避免重新解析未更改的字节，不得缓存发现、注册表、所有者或策略答案。

安全的元数据快速路径是显式的对象所有权，而不是隐藏缓存。Gateway 启动热路径应通过调用链传递当前的 `PluginMetadataSnapshot`、派生的 `PluginLookUpTable` 或显式 Manifest 注册表。配置验证、启动自动启用、Plugin 引导和 Provider 选择可以在这些对象代表当前配置和 Plugin 清单时重用它们。设置查找仍然按需重建 Manifest 元数据，除非特定设置路径接收到显式 Manifest 注册表；将其保持为冷路径回退，而不是添加隐藏查找缓存。当输入更改时，重建并替换快照，而不是修改它或保留历史副本。

对活动 Plugin 注册表和 Bundle Channel 引导助手的视图应从当前注册表/根重新计算。一次调用中的短期 Map 用于去重工作或防止重入是可以的；它们不得成为进程元数据缓存。

对于 Plugin 加载，持久缓存层是运行时加载。当代码或已安装的工件实际加载时，它可以重用加载器状态，例如：

- `PluginLoaderCacheState` 和兼容的活动运行时注册表
- Jiti/模块缓存和公共表面加载器缓存，用于避免重复导入相同的运行时表面
- 已安装 Plugin 工件的文件系统缓存
- 路径规范化或重复解析的短期每次调用 Map

这些缓存是数据平面实现细节。它们不得回答控制平面问题，例如"哪个 Plugin 拥有此 Provider？"，除非调用者明确要求运行时加载。

不要为以下内容添加持久或时钟缓存：

- 发现结果
- 直接 Manifest 注册表
- 从已安装 Plugin 索引重建的 Manifest 注册表
- Provider 所有者查找、模型抑制、Provider 策略或公共工件元数据
- 任何其他 Manifest 派生的答案，其中更改的 Manifest、已安装索引或加载路径应在下次元数据读取时可见

从持久化的已安装 Plugin 索引重建 Manifest 元数据的调用者按需重建该注册表。已安装索引是持久的源平面状态；它不是隐藏的进程内元数据缓存。

## 注册表模型

已加载的 Plugin 不直接修改随机的核心全局变量。它们注册到中央 Plugin 注册表中。

注册表跟踪：

- Plugin 记录（身份、来源、原点、状态、诊断）
- 工具
- 旧版 Hook 和类型化 Hook
- Channel
- Provider
- Gateway RPC 处理程序
- HTTP 路由
- CLI 注册器
- 后台服务
- Plugin 拥有的命令

核心功能然后从该注册表读取，而不是直接与 Plugin 模块通信。这保持了加载的单向性：

- Plugin 模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对于可维护性很重要。这意味着大多数核心表面只需要一个集成点："读取注册表"，而不是"对每个 Plugin 模块进行特殊处理"。

## 对话绑定回调

绑定对话的 Plugin 可以在批准解析时做出反应。

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

      // 请求被拒绝；清除任何本地挂起状态。
      console.log(event.request.conversation.conversationId);
    });
  },
};
```

回调载荷字段：

- `status`：`"approved"` 或 `"denied"`
- `decision`：`"allow-once"`、`"allow-always"` 或 `"deny"`
- `binding`：已批准请求的已解析绑定
- `request`：原始请求摘要、分离提示、发送者 id 和对话元数据

此回调仅用于通知。它不改变谁被允许绑定对话，并且在核心批准处理完成后运行。

## Provider 运行时 Hook

Provider Plugin 有三个层次：

- **Manifest 元数据**用于廉价的预运行时查找：`setup.providers[].envVars`、已弃用的兼容性 `providerAuthEnvVars`、`providerAuthAliases`、`providerAuthChoices` 和 `channelEnvVars`。
- **配置时 Hook**：`catalog`（旧版 `discovery`）加上 `applyConfigDefaults`。
- **运行时 Hook**：40+ 个可选 Hook，涵盖身份验证、模型解析、流封装、思考级别、重播策略和使用端点。请参见 [Hook 顺序和使用](#hook-order-and-usage) 下的完整列表。

OpenClaw 仍然拥有通用的 Agent 循环、故障转移、转录处理和工具策略。这些 Hook 是 Provider 特定行为的扩展表面，无需完整的自定义推理传输。

当 Provider 具有通用身份验证/状态/模型选择器路径应在不加载 Plugin 运行时的情况下查看的基于环境的凭据时，请使用 Manifest `setup.providers[].envVars`。已弃用的 `providerAuthEnvVars` 在弃用窗口期间仍被兼容性适配器读取，使用它的非 Bundle Plugin 会收到 Manifest 诊断。当一个 Provider id 应该重用另一个 Provider id 的环境变量、身份验证配置文件、配置支持的身份验证和 API 密钥加入选项时，使用 Manifest `providerAuthAliases`。当加入/身份验证选项 CLI 表面应该知道 Provider 的选项 id、组标签和简单的单标志身份验证接线而无需加载 Provider 运行时时，使用 Manifest `providerAuthChoices`。将 Provider 运行时 `envVars` 保留用于面向操作员的提示，例如加入标签或 OAuth 客户端 id/客户端密钥设置变量。

当 Channel 具有通用 Shell 环境回退、配置/状态检查或设置提示应在不加载 Channel 运行时的情况下查看的环境驱动的身份验证或设置时，使用 Manifest `channelEnvVars`。

### Hook 顺序和使用

对于模型/Provider Plugin，OpenClaw 大致按此顺序调用 Hook。"何时使用"列是快速决策指南。OpenClaw 不再调用的兼容性专用 Provider 字段，例如 `ProviderPlugin.capabilities` 和 `suppressBuiltInModel`，在此处有意不列出。

| #   | Hook                              | 功能                                                                                                   | 何时使用                                                                                                                                   |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `catalog`                         | 在 `models.json` 生成期间将 Provider 配置发布到 `models.providers`                                | Provider 拥有目录或 base URL 默认值                                                                                                          |
| 2   | `applyConfigDefaults`             | 在配置实例化期间应用 Provider 拥有的全局配置默认值                                                | 默认值取决于身份验证模式、环境或 Provider 模型系列语义                                                                                 |
| --  | _(内置模型查找)_                  | OpenClaw 首先尝试正常的注册表/目录路径                                                                | _(不是 Plugin Hook)_                                                                                                                         |
| 3   | `normalizeModelId`                | 在查找之前规范化旧版或预览模型 id 别名                                                                | Provider 拥有规范模型解析之前的别名清理                                                                                                   |
| 4   | `normalizeTransport`              | 在通用模型组装之前规范化 Provider 系列 `api` / `baseUrl`                                             | Provider 拥有相同传输系列中自定义 Provider id 的传输清理                                                                                |
| 5   | `normalizeConfig`                 | 在运行时/Provider 解析之前规范化 `models.providers.<id>`                                              | Provider 需要应与 Plugin 一起存在的配置清理；Bundle Google 系列助手也支持 Google 配置条目                                              |
| 6   | `applyNativeStreamingUsageCompat` | 对配置 Provider 应用原生流式使用兼容性重写                                                            | Provider 需要端点驱动的原生流式使用元数据修复                                                                                            |
| 7   | `resolveConfigApiKey`             | 在运行时身份验证加载之前解析配置 Provider 的环境标记身份验证                                         | Provider 具有 Provider 拥有的环境标记 API 密钥解析；`amazon-bedrock` 也在此处有内置 AWS 环境标记解析器                                  |
| 8   | `resolveSyntheticAuth`            | 无需持久化明文即可显示本地/自托管或配置支持的身份验证                                                | Provider 可以使用合成/本地凭据标记运行                                                                                                   |
| 9   | `resolveExternalAuthProfiles`     | 叠加 Provider 拥有的外部身份验证配置文件；CLI/应用拥有的凭据默认 `persistence` 为 `runtime-only`  | Provider 重用外部身份验证凭据而不持久化复制的刷新令牌；在 Manifest 中声明 `contracts.externalAuthProviders`                           |
| 10  | `shouldDeferSyntheticProfileAuth` | 将存储的合成配置文件占位符置于环境/配置支持的身份验证之后                                            | Provider 存储不应获得优先权的合成占位符配置文件                                                                                          |
| 11  | `resolveDynamicModel`             | 对于尚未在本地注册表中的 Provider 拥有模型 id 的同步回退                                             | Provider 接受任意上游模型 id                                                                                                              |
| 12  | `prepareDynamicModel`             | 异步预热，然后再次运行 `resolveDynamicModel`                                                          | Provider 在解析未知 id 之前需要网络元数据                                                                                               |
| 13  | `normalizeResolvedModel`          | 在嵌入式运行器使用已解析模型之前进行最终重写                                                          | Provider 需要传输重写但仍使用核心传输                                                                                                    |
| 14  | `contributeResolvedModelCompat`   | 为另一个兼容传输后面的供应商模型贡献兼容标志                                                          | Provider 在代理传输上识别自己的模型，而不接管 Provider                                                                                  |
| 15  | `normalizeToolSchemas`            | 在嵌入式运行器看到工具 Schema 之前对其进行规范化                                                      | Provider 需要传输系列 Schema 清理                                                                                                        |
| 16  | `inspectToolSchemas`              | 在规范化后显示 Provider 拥有的 Schema 诊断                                                            | Provider 希望关键字警告而不教核心 Provider 特定规则                                                                                     |
| 17  | `resolveReasoningOutputMode`      | 选择原生与标记的推理输出契约                                                                           | Provider 需要标记的推理/最终输出，而不是原生字段                                                                                        |
| 18  | `prepareExtraParams`              | 在通用流选项封装器之前进行请求参数规范化                                                               | Provider 需要默认请求参数或每个 Provider 的参数清理                                                                                     |
| 19  | `createStreamFn`                  | 用自定义传输完全替换正常的流路径                                                                       | Provider 需要自定义线路协议，而不仅仅是封装器                                                                                           |
| 20  | `wrapStreamFn`                    | 在应用通用封装器后的流封装器                                                                           | Provider 需要请求头/正文/模型兼容封装器，而无需自定义传输                                                                              |
| 21  | `resolveTransportTurnState`       | 附加原生每轮传输头或元数据                                                                             | Provider 希望通用传输发送 Provider 原生的轮次身份                                                                                      |
| 22  | `resolveWebSocketSessionPolicy`   | 附加原生 WebSocket 头或 Session 冷却策略                                                              | Provider 希望通用 WS 传输调整 Session 头或回退策略                                                                                     |
| 23  | `formatApiKey`                    | 身份验证配置文件格式化器：存储的配置文件变成运行时 `apiKey` 字符串                                    | Provider 存储额外的身份验证元数据并需要自定义运行时令牌形状                                                                            |
| 24  | `refreshOAuth`                    | 自定义刷新端点或刷新失败策略的 OAuth 刷新覆盖                                                         | Provider 不适合共享的 `pi-ai` 刷新器                                                                                                   |
| 25  | `buildAuthDoctorHint`             | OAuth 刷新失败时附加的修复提示                                                                         | Provider 在刷新失败后需要 Provider 拥有的身份验证修复指导                                                                              |
| 26  | `matchesContextOverflowError`     | Provider 拥有的上下文窗口溢出匹配器                                                                   | Provider 具有通用启发式方法会遗漏的原始溢出错误                                                                                        |
| 27  | `classifyFailoverReason`          | Provider 拥有的故障转移原因分类                                                                        | Provider 可以将原始 API/传输错误映射到速率限制/过载等                                                                                  |
| 28  | `isCacheTtlEligible`              | 代理/回程 Provider 的提示缓存策略                                                                     | Provider 需要代理特定的缓存 TTL 门控                                                                                                   |
| 29  | `buildMissingAuthMessage`         | 替换通用缺失身份验证恢复消息                                                                           | Provider 需要 Provider 特定的缺失身份验证恢复提示                                                                                     |
| 30  | `augmentModelCatalog`             | 发现后附加的合成/最终目录行                                                                            | Provider 需要在 `models list` 和选择器中合成向前兼容行                                                                                 |
| 31  | `resolveThinkingProfile`          | 模型特定的 `/think` 级别集、显示标签和默认值                                                          | Provider 为所选模型公开自定义思考阶梯或二进制标签                                                                                      |
| 32  | `isBinaryThinking`                | 开/关推理切换兼容性 Hook                                                                               | Provider 仅公开二进制思考开/关                                                                                                          |
| 33  | `supportsXHighThinking`           | `xhigh` 推理支持兼容性 Hook                                                                           | Provider 希望 `xhigh` 仅在模型子集上                                                                                                  |
| 34  | `resolveDefaultThinkingLevel`     | 默认 `/think` 级别兼容性 Hook                                                                         | Provider 拥有模型系列的默认 `/think` 策略                                                                                              |
| 35  | `isModernModelRef`                | 用于实时配置文件过滤器和烟雾选择的现代模型匹配器                                                      | Provider 拥有实时/烟雾首选模型匹配                                                                                                     |
| 36  | `prepareRuntimeAuth`              | 在推理前将配置的凭据交换为实际的运行时令牌/密钥                                                      | Provider 需要令牌交换或短期请求凭据                                                                                                    |
| 37  | `resolveUsageAuth`                | 为 `/usage` 和相关状态表面解析使用/计费凭据                                                           | Provider 需要自定义使用/配额令牌解析或不同的使用凭据                                                                                  |
| 38  | `fetchUsageSnapshot`              | 在身份验证解析后获取并规范化 Provider 特定的使用/配额快照                                             | Provider 需要 Provider 特定的使用端点或有效载荷解析器                                                                                 |
| 39  | `createEmbeddingProvider`         | 为内存/搜索构建 Provider 拥有的嵌入适配器                                                             | 内存嵌入行为属于 Provider Plugin                                                                                                       |
| 40  | `buildReplayPolicy`               | 返回控制 Provider 转录处理的重播策略                                                                   | Provider 需要自定义转录策略（例如，思考块剥离）                                                                                       |
| 41  | `sanitizeReplayHistory`           | 在通用转录清理后重写重播历史                                                                           | Provider 需要超出共享压缩助手的 Provider 特定重播重写                                                                                 |
| 42  | `validateReplayTurns`             | 在嵌入式运行器之前进行最终重播轮次验证或整形                                                          | Provider 传输在通用净化后需要更严格的轮次验证                                                                                         |
| 43  | `onModelSelected`                 | 运行 Provider 拥有的选择后副作用                                                                      | Provider 在模型变为活动时需要遥测或 Provider 拥有的状态                                                                               |

`normalizeModelId`、`normalizeTransport` 和 `normalizeConfig` 首先检查匹配的 Provider Plugin，然后通过其他具有 Hook 能力的 Provider Plugin 回退，直到有一个实际更改模型 id 或传输/配置。这使得别名/兼容性 Provider 垫片工作，而无需调用者知道哪个 Bundle Plugin 拥有重写。如果没有 Provider Hook 重写受支持的 Google 系列配置条目，Bundle Google 配置规范化器仍然应用该兼容性清理。

如果 Provider 需要完全自定义的线路协议或自定义请求执行器，那是不同类的扩展。这些 Hook 用于仍然在 OpenClaw 正常推理循环上运行的 Provider 行为。

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

Bundle Provider Plugin 将上述 Hook 组合起来以适应每个供应商的目录、身份验证、思考、重播和使用需求。权威的 Hook 集与 `extensions/` 下的每个 Plugin 一起存在；本页说明形状而不是镜像列表。

<AccordionGroup>
  <Accordion title="透传目录 Provider">
    OpenRouter、Kilocode、Z.AI、xAI 注册 `catalog` 加上 `resolveDynamicModel` / `prepareDynamicModel`，以便它们可以在 OpenClaw 的静态目录之前显示上游模型 id。
  </Accordion>
  <Accordion title="OAuth 和使用端点 Provider">
    GitHub Copilot、Gemini CLI、ChatGPT Codex、MiniMax、Xiaomi、z.ai 将 `prepareRuntimeAuth` 或 `formatApiKey` 与 `resolveUsageAuth` + `fetchUsageSnapshot` 配对，以拥有令牌交换和 `/usage` 集成。
  </Accordion>
  <Accordion title="重播和转录清理系列">
    共享的命名系列（`google-gemini`、`passthrough-gemini`、`anthropic-by-model`、`hybrid-anthropic-openai`）让 Provider 通过 `buildReplayPolicy` 选择转录策略，而不是每个 Plugin 重新实现清理。
  </Accordion>
  <Accordion title="仅目录 Provider">
    `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine` 仅注册 `catalog` 并使用共享推理循环。
  </Accordion>
  <Accordion title="Anthropic 特定流助手">
    Beta 头、`/fast` / `serviceTier` 和 `context1m` 存在于 Anthropic Plugin 的公共 `api.ts` / `contract-api.ts` 接缝（`wrapAnthropicProviderStream`、`resolveAnthropicBetas`、`resolveAnthropicFastMode`、`resolveAnthropicServiceTier`）中，而不是在通用 SDK 中。
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

注意事项：

- `textToSpeech` 返回用于文件/语音备忘录表面的正常核心 TTS 输出载荷。
- 使用核心 `messages.tts` 配置和 Provider 选择。
- 返回 PCM 音频缓冲区 + 采样率。Plugin 必须为 Provider 重新采样/编码。
- `listVoices` 对每个 Provider 是可选的。用于供应商拥有的语音选择器或设置流程。
- 语音列表可以包含更丰富的元数据，例如语言区域设置、性别和人格标签，用于支持 Provider 的选择器。
- 今天 OpenAI 和 ElevenLabs 支持电话语音。Microsoft 不支持。

Plugin 还可以通过 `api.registerSpeechProvider(...)` 注册语音 Provider。

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

注意事项：

- 将 TTS 策略、回退和回复交付保留在核心中。
- 将语音 Provider 用于供应商拥有的合成行为。
- 旧版 Microsoft `edge` 输入规范化为 `microsoft` Provider id。
- 首选的所有权模型是以公司为导向的：一个供应商 Plugin 可以拥有文本、语音、图像和未来的媒体 Provider，因为 OpenClaw 添加了这些能力契约。

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

注意事项：

- 将编排、回退、配置和 Channel 接线保留在核心中。
- 将供应商行为保留在 Provider Plugin 中。
- 增量扩展应保持类型化：新的可选方法、新的可选结果字段、新的可选能力。
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

const extraction = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
  provider: "codex",
  model: "gpt-5.5",
  input: [
    {
      type: "image",
      buffer: receiptImageBuffer,
      fileName: "receipt.png",
      mime: "image/png",
    },
    { type: "text", text: "使用打印字段作为事实来源。" },
  ],
  instructions: "返回实体和可搜索标签。",
  schemaName: "example.evidence",
  jsonSchema: {
    type: "object",
    properties: {
      entities: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
    },
  },
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

注意事项：

- `api.runtime.mediaUnderstanding.*` 是图像/音频/视频理解的首选共享表面。
- `extractStructuredWithModel(...)` 是面向 Plugin 的有界 Provider 拥有的图像优先提取接缝。至少包含一个图像输入；文本输入是补充上下文。产品 Plugin 拥有其路由和 Schema，而 OpenClaw 拥有 Provider/运行时边界。
- 使用核心媒体理解音频配置（`tools.media.audio`）和 Provider 回退顺序。
- 当不产生转录输出时返回 `{ text: undefined }`（例如跳过/不支持的输入）。
- `api.runtime.stt.transcribeAudioFile(...)` 保留为兼容性别名。

Plugin 还可以通过 `api.runtime.subagent` 启动后台子 Agent 运行：

```ts
const result = await api.runtime.subagent.run({
  sessionKey: "agent:main:subagent:search-helper",
  message: "将此查询扩展为集中的后续搜索。",
  provider: "openai",
  model: "gpt-4.1-mini",
  deliver: false,
});
```

注意事项：

- `provider` 和 `model` 是可选的每次运行覆盖，而不是持久的 Session 更改。
- OpenClaw 仅对受信任的调用者执行这些覆盖字段。
- 对于 Plugin 拥有的回退运行，操作员必须使用 `plugins.entries.<id>.subagent.allowModelOverride: true` 选择加入。
- 使用 `plugins.entries.<id>.subagent.allowedModels` 将受信任的 Plugin 限制为特定的规范 `provider/model` 目标，或 `"*"` 以明确允许任何目标。
- 不受信任的 Plugin 子 Agent 运行仍然有效，但覆盖请求被拒绝，而不是静默回退。
- Plugin 创建的子 Agent Session 标记有创建 Plugin id。回退 `api.runtime.subagent.deleteSession(...)` 只能删除这些拥有的 Session；任意 Session 删除仍然需要管理员范围的 Gateway 请求。

对于网络搜索，Plugin 可以使用共享的运行时助手，而不是进入 Agent 工具接线：

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

Plugin 还可以通过 `api.registerWebSearchProvider(...)` 注册网络搜索 Provider。

注意事项：

- 将 Provider 选择、凭据解析和共享请求语义保留在核心中。
- 将供应商特定的搜索传输保留在网络搜索 Provider 中。
- `api.runtime.webSearch.*` 是功能/Channel Plugin 需要搜索行为而不依赖 Agent 工具包装器的首选共享表面。

### `api.runtime.imageGeneration`

```ts
const result = await api.runtime.imageGeneration.generate({
  config: api.config,
  args: { prompt: "一只友好的龙虾吉祥物", size: "1024x1024" },
});

const providers = api.runtime.imageGeneration.listProviders({
  config: api.config,
});
```

- `generate(...)`：使用配置的图像生成 Provider 链生成图像。
- `listProviders(...)`：列出可用的图像生成 Provider 及其能力。

## Gateway HTTP 路由

Plugin 可以使用 `api.registerHttpRoute(...)` 公开 HTTP 端点。

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
- `auth`：必需。使用 `"gateway"` 要求正常的 Gateway 身份验证，或使用 `"plugin"` 进行 Plugin 管理的身份验证/Webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一 Plugin 替换其自己的现有路由注册。
- `handler`：当路由处理了请求时返回 `true`。

注意事项：

- `api.registerHttpHandler(...)` 已被删除，将导致 Plugin 加载错误。改用 `api.registerHttpRoute(...)`。
- Plugin 路由必须明确声明 `auth`。
- 精确的 `path + match` 冲突被拒绝，除非 `replaceExisting: true`，并且一个 Plugin 不能替换另一个 Plugin 的路由。
- 具有不同 `auth` 级别的重叠路由被拒绝。仅在相同 auth 级别上保留 `exact`/`prefix` 回退链。
- `auth: "plugin"` 路由**不**自动接收操作员运行时范围。它们用于 Plugin 管理的 Webhook/签名验证，而不是特权 Gateway 助手调用。
- `auth: "gateway"` 路由在 Gateway 请求运行时范围内运行，但该范围是有意保守的：
  - 共享密钥承载身份验证（`gateway.auth.mode = "token"` / `"password"`）将 Plugin 路由运行时范围固定在 `operator.write`，即使调用者发送 `x-openclaw-scopes`
  - 受信任的身份承载 HTTP 模式（例如 `trusted-proxy` 或私有入口上的 `gateway.auth.mode = "none"`）仅在头显式存在时执行 `x-openclaw-scopes`
  - 如果 `x-openclaw-scopes` 在这些身份承载 Plugin 路由请求上不存在，运行时范围回退到 `operator.write`
- 实际规则：不要假设 Gateway 身份验证 Plugin 路由是隐式管理员表面。如果您的路由需要仅管理员的行为，请要求身份承载的身份验证模式并记录显式的 `x-openclaw-scopes` 头契约。

## Plugin SDK 导入路径

在编写新 Plugin 时，请使用窄 SDK 子路径而不是单体 `openclaw/plugin-sdk` 根 Barrel。核心子路径：

| 子路径                              | 用途                                               |
| ----------------------------------- | -------------------------------------------------- |
| `openclaw/plugin-sdk/plugin-entry`  | Plugin 注册原语                                    |
| `openclaw/plugin-sdk/channel-core`  | Channel 入口/构建助手                              |
| `openclaw/plugin-sdk/core`          | 通用共享助手和伞形契约                             |
| `openclaw/plugin-sdk/config-schema` | 根 `openclaw.json` Zod Schema（`OpenClawSchema`）  |

Channel Plugin 从窄接缝系列中选择——`channel-setup`、`setup-runtime`、`setup-tools`、`channel-pairing`、`channel-contract`、`channel-feedback`、`channel-inbound`、`channel-lifecycle`、`channel-reply-pipeline`、`command-auth`、`secret-input`、`webhook-ingress`、`channel-targets` 和 `channel-actions`。批准行为应该合并到一个 `approvalCapability` 契约上，而不是混合跨不相关的 Plugin 字段。请参见 [Channel Plugin](/plugins/sdk-channel-plugins)。

运行时和配置助手位于匹配的聚焦 `*-runtime` 子路径下（`approval-runtime`、`agent-runtime`、`lazy-runtime`、`directory-runtime`、`text-runtime`、`runtime-store`、`system-event-runtime`、`heartbeat-runtime`、`channel-activity-runtime` 等）。优先使用 `config-contracts`、`plugin-config-runtime`、`runtime-config-snapshot` 和 `config-mutation`，而不是广泛的 `config-runtime` 兼容性 Barrel。

<Info>
`openclaw/plugin-sdk/channel-runtime`、`openclaw/plugin-sdk/config-runtime` 和 `openclaw/plugin-sdk/infra-runtime` 是旧版 Plugin 的已弃用兼容性垫片。新代码应该导入更窄的通用原语。
</Info>

仓库内部入口点（每个 Bundle Plugin 包根）：

- `index.js` — Bundle Plugin 入口
- `api.js` — 助手/类型 Barrel
- `runtime-api.js` — 仅运行时 Barrel
- `setup-entry.js` — 设置 Plugin 入口

外部 Plugin 应该只导入 `openclaw/plugin-sdk/*` 子路径。永远不要从核心或另一个 Plugin 导入另一个 Plugin 包的 `src/*`。Facade 加载的入口点在存在时优先使用活动运行时配置快照，然后回退到磁盘上的已解析配置文件。

能力特定的子路径，例如 `image-generation`、`media-understanding` 和 `speech` 存在，因为今天 Bundle Plugin 使用它们。它们不会自动成为长期冻结的外部契约——在依赖它们时请检查相关 SDK 参考页面。

## 消息工具 Schema

Plugin 应该拥有 Channel 特定的 `describeMessageTool(...)` Schema 贡献，用于非消息原语，例如反应、阅读和投票。共享发送呈现应该使用通用 `MessagePresentation` 契约，而不是 Provider 原生按钮、组件、块或卡片字段。请参见 [消息呈现](/plugins/message-presentation) 了解契约、回退规则、Provider 映射和 Plugin 作者检查清单。

能够发送的 Plugin 通过消息能力声明它们可以渲染的内容：

- `presentation` 用于语义呈现块（`text`、`context`、`divider`、`buttons`、`select`）
- `delivery-pin` 用于固定交付请求

核心决定是否原生渲染呈现或将其降级为文本。不要从通用消息工具公开 Provider 原生 UI 逃生舱口。旧版 SDK 助手用于旧版原生 Schema 仍然为现有第三方 Plugin 导出，但新 Plugin 不应使用它们。

## Channel 目标解析

Channel Plugin 应该拥有 Channel 特定的目标语义。保持共享的出站主机通用，并使用消息适配器表面处理 Provider 规则：

- `messaging.inferTargetChatType({ to })` 决定在目录查找之前规范化目标是否应该被视为 `direct`、`group` 或 `channel`。
- `messaging.targetResolver.looksLikeId(raw, normalized)` 告诉核心输入是否应该直接跳到类 id 解析，而不是目录搜索。
- `messaging.targetResolver.resolveTarget(...)` 是在规范化后或目录未命中后核心需要最终 Provider 拥有的解析时的 Plugin 回退。
- `messaging.resolveOutboundSessionRoute(...)` 在目标解析后拥有 Provider 特定的 Session 路由构建。

推荐的拆分：

- 对于应该在搜索对等点/组之前发生的类别决策，使用 `inferTargetChatType`。
- 对于"将此视为显式/原生目标 id"检查，使用 `looksLikeId`。
- 对于 Provider 特定的规范化回退，使用 `resolveTarget`，而不是用于广泛的目录搜索。
- 将聊天 id、线程 id、JID、句柄和房间 id 等 Provider 原生 id 保留在 `target` 值或 Provider 特定参数中，而不是通用 SDK 字段中。

## 配置支持的目录

从配置派生目录条目的 Plugin 应该将该逻辑保留在 Plugin 中，并从 `openclaw/plugin-sdk/directory-runtime` 重用共享助手。

当 Channel 需要配置支持的对等点/组时使用此功能，例如：

- 允许列表驱动的 DM 对等点
- 已配置的 Channel/组映射
- 账户范围的静态目录回退

`directory-runtime` 中的共享助手仅处理通用操作：

- 查询过滤
- 限制应用
- 去重/规范化助手
- 构建 `ChannelDirectoryEntry[]`

Channel 特定的账户检查和 id 规范化应该保留在 Plugin 实现中。

## Provider 目录

Provider Plugin 可以使用 `registerProvider({ catalog: { run(...) { ... } } })` 为推理定义模型目录。

`catalog.run(...)` 返回 OpenClaw 写入 `models.providers` 的相同形状：

- `{ provider }` 用于一个 Provider 条目
- `{ providers }` 用于多个 Provider 条目

当 Plugin 拥有 Provider 特定的模型 id、base URL 默认值或身份验证门控的模型元数据时，使用 `catalog`。

`catalog.order` 控制 Plugin 的目录何时相对于 OpenClaw 的内置隐式 Provider 合并：

- `simple`：纯 API 密钥或环境驱动的 Provider
- `profile`：在存在身份验证配置文件时出现的 Provider
- `paired`：合成多个相关 Provider 条目的 Provider
- `late`：最后一遍，在其他隐式 Provider 之后

后面的 Provider 在键冲突时获胜，因此 Plugin 可以故意使用相同的 Provider id 覆盖内置 Provider 条目。

Plugin 还可以通过 `api.registerModelCatalogProvider({ provider, kinds, staticCatalog, liveCatalog })` 发布只读模型行。这是列表/帮助/选择器表面的前向路径，支持 `text`、`image_generation`、`video_generation` 和 `music_generation` 行。Provider Plugin 仍然拥有实时端点调用、令牌交换和供应商响应映射；核心拥有公共行形状、来源标签和媒体工具帮助格式化。媒体生成 Provider 注册从 `defaultModel`、`models` 和 `capabilities` 自动合成静态目录行。

兼容性：

- `discovery` 仍然作为旧版别名工作，但会发出弃用警告
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 使用 `catalog`
- `augmentModelCatalog` 已弃用；Bundle Provider 应该通过 `registerModelCatalogProvider` 发布补充行

## 只读 Channel 检查

如果您的 Plugin 注册了 Channel，请优先在 `resolveAccount(...)` 旁边实现 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它被允许假设凭据已完全实例化，并且当所需密钥缺失时可以快速失败。
- 只读命令路径，例如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 和 doctor/配置修复流程，不应该只是为了描述配置就需要实例化运行时凭据。

推荐的 `inspectAccount(...)` 行为：

- 仅返回描述性账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭据来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 您不需要返回原始令牌值来报告只读可用性。返回 `tokenStatus: "available"`（以及匹配的来源字段）对于状态样式命令就足够了。
- 当凭据通过 SecretRef 配置但在当前命令路径中不可用时，使用 `configured_unavailable`。

这让只读命令报告"已配置但在此命令路径中不可用"，而不是崩溃或错误报告账户为未配置。

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

每个入口成为一个 Plugin。如果 Pack 列出多个扩展，Plugin id 变为 `name/<fileBase>`。

如果您的 Plugin 导入 npm 依赖项，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全护栏：每个 `openclaw.extensions` 入口在符号链接解析后必须保留在 Plugin 目录内。逃出包目录的入口将被拒绝。

安全说明：`openclaw plugins install` 使用项目本地 `npm install --omit=dev --ignore-scripts` 安装 Plugin 依赖项（无生命周期脚本，运行时无开发依赖项），忽略继承的全局 npm 安装设置。保持 Plugin 依赖树"纯 JS/TS"并避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向轻量级的仅设置模块。当 OpenClaw 需要禁用 Channel Plugin 的设置表面，或当 Channel Plugin 已启用但仍未配置时，它加载 `setupEntry` 而不是完整的 Plugin 入口。当您的主 Plugin 入口还接线了工具、Hook 或其他仅运行时代码时，这使启动和设置更轻量。

可选：`openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` 可以在 Gateway 的预监听启动阶段选择 Channel Plugin 进入相同的 `setupEntry` 路径，即使 Channel 已经配置。

仅在 `setupEntry` 完全覆盖必须在 Gateway 开始监听之前存在的启动表面时使用此功能。实际上，这意味着设置入口必须注册启动依赖的每个 Channel 拥有的能力，例如：

- Channel 注册本身
- 必须在 Gateway 开始监听之前可用的任何 HTTP 路由
- 在同一窗口期间必须存在的任何 Gateway 方法、工具或服务

如果您的完整入口仍然拥有任何必需的启动能力，请不要启用此标志。将 Plugin 保持在默认行为上，让 OpenClaw 在启动期间加载完整入口。

Bundle Channel 还可以发布仅设置的契约表面助手，核心在加载完整 Channel 运行时之前可以查询。当前设置提升表面是：

- `singleAccountKeysToMove`
- `namedAccountPromotionKeys`
- `resolveSingleAccountPromotionTarget(...)`

核心在需要将旧版单账户 Channel 配置提升到 `channels.<id>.accounts.*` 而不加载完整 Plugin 入口时使用该表面。Matrix 是当前的 Bundle 示例：当命名账户已经存在时，它只将身份验证/引导密钥移动到已命名的提升账户中，并且它可以保留已配置的非规范默认账户密钥，而不是总是创建 `accounts.default`。

这些设置补丁适配器保持 Bundle 契约表面发现懒惰。导入时间保持轻量；提升表面仅在首次使用时加载，而不是在模块导入时重新进入 Bundle Channel 启动。

当这些启动表面包含 Gateway RPC 方法时，将它们保留在 Plugin 特定的前缀上。核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持保留状态，并始终解析为 `operator.admin`，即使 Plugin 请求更窄的范围。

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

Channel Plugin 可以通过 `openclaw.channel` 公开设置/发现元数据，并通过 `openclaw.install` 公开安装提示。这保持核心目录无数据。

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
      "blurb": "通过 Nextcloud Talk Webhook 机器人进行自托管聊天。",
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

- `detailLabel`：更丰富的目录/状态表面的次要标签
- `docsLabel`：覆盖文档链接的链接文本
- `preferOver`：此目录条目应超过的较低优先级 Plugin/Channel id
- `selectionDocsPrefix`、`selectionDocsOmitLabel`、`selectionExtras`：选择表面复制控制
- `markdownCapable`：将 Channel 标记为 Markdown 功能的出站格式化决策
- `exposure.configured`：设置为 `false` 时从已配置 Channel 列表表面隐藏 Channel
- `exposure.setup`：设置为 `false` 时从交互式设置/配置选择器隐藏 Channel
- `exposure.docs`：将 Channel 标记为文档导航表面的内部/私有
- `showConfigured` / `showInSetup`：为兼容性仍然接受的旧版别名；优先使用 `exposure`
- `quickstartAllowFrom`：将 Channel 选择加入标准快速入门 `allowFrom` 流程
- `forceAccountBinding`：即使只有一个账户存在，也需要显式账户绑定
- `preferSessionLookupForAnnounceTarget`：在解析公告目标时优先使用 Session 查找

OpenClaw 还可以合并**外部 Channel 目录**（例如 MPM 注册表导出）。将 JSON 文件放置在以下位置之一：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。解析器也接受 `"packages"` 或 `"plugins"` 作为 `"entries"` 键的旧版别名。

生成的 Channel 目录条目和 Provider 安装目录条目在原始 `openclaw.install` 块旁边公开规范化的安装来源事实。规范化事实确定 npm 规范是精确版本还是浮动选择器、是否存在预期的完整性元数据以及本地源路径是否也可用。当目录/包身份已知时，规范化事实会警告解析的 npm 包名与该身份是否漂移。它们还警告 `defaultChoice` 无效或指向不可用的来源，以及存在 npm 完整性元数据但没有有效 npm 来源的情况。消费者应该将 `installSource` 视为附加的可选字段，以便手工构建的条目和目录垫片不必合成它。这使加入和诊断能够解释来源平面状态，而无需导入 Plugin 运行时。

官方外部 npm 条目应该优先使用精确的 `npmSpec` 加 `expectedIntegrity`。裸包名和 dist-tag 仍然可以兼容性工作，但它们会显示来源平面警告，以便目录可以向固定的、完整性检查的安装发展，而不破坏现有 Plugin。当加入从本地目录路径安装时，它会记录一个带有 `source: "path"` 的托管 Plugin 插件索引条目，以及尽可能使用工作区相对 `sourcePath`。绝对操作加载路径保留在 `plugins.load.paths` 中；安装记录避免将本地工作站路径复制到长期配置中。这使本地开发安装对来源平面诊断可见，而不添加第二个原始文件系统路径披露表面。持久化的 `plugins/installs.json` Plugin 索引是安装事实来源，可以在不加载 Plugin 运行时模块的情况下刷新。其 `installRecords` 映射即使在 Plugin Manifest 缺失或无效时也是持久的；其 `plugins` 数组是可重建的 Manifest 视图。

## Context Engine Plugin

Context Engine Plugin 拥有 Session 上下文编排，用于摄取、组装和压缩。使用 `api.registerContextEngine(id, factory)` 从您的 Plugin 注册它们，然后使用 `plugins.slots.contextEngine` 选择活动引擎。

当您的 Plugin 需要替换或扩展默认上下文流水线而不仅仅是添加内存搜索或 Hook 时，请使用此功能。

```ts
import { buildMemorySystemPromptAddition } from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("lossless-claw", (ctx) => ({
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

工厂 `ctx` 为构建时初始化公开可选的 `config`、`agentDir` 和 `workspaceDir` 值。

当活动 Harness 具有持久后端线程时，`assemble()` 可能返回 `contextProjection`。对于旧版每轮投影，省略它。当组装的上下文应该注入到后端线程一次并重用到 epoch 更改时，返回 `{ mode: "thread_bootstrap", epoch }`。在引擎语义上下文更改后更改 epoch，例如在引擎拥有的压缩过程之后。主机可以在线程引导投影中保留工具调用元数据、输入形状和已编辑的工具结果，以便新的后端线程保留工具连续性，而不复制原始的秘密承载有效载荷。

如果您的引擎**不**拥有压缩算法，请保持 `compact()` 实现并显式委托它：

```ts
import {
  buildMemorySystemPromptAddition,
  delegateCompactionToRuntime,
} from "openclaw/plugin-sdk/core";

export default function (api) {
  api.registerContextEngine("my-memory-engine", (ctx) => ({
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

当 Plugin 需要不适合当前 API 的行为时，不要通过私有访问绕过 Plugin 系统。添加缺失的能力。

推荐的顺序：

1. 定义核心契约
   决定核心应该拥有哪些共享行为：策略、回退、配置合并、生命周期、Channel 面向语义和运行时助手形状。
2. 添加类型化的 Plugin 注册/运行时表面
   使用最小有用的类型化能力表面扩展 `OpenClawPluginApi` 和/或 `api.runtime`。
3. 连接核心 + Channel/功能消费者
   Channel 和功能 Plugin 应该通过核心消费新能力，而不是直接导入供应商实现。
4. 注册供应商实现
   供应商 Plugin 然后根据能力注册其后端。
5. 添加契约覆盖
   添加测试，以便所有权和注册形状随着时间的推移保持明确。

这就是 OpenClaw 如何保持有主见而不硬编码到一个 Provider 的世界观。请参见 [能力 Cookbook](/tools/capability-cookbook) 了解具体的文件检查清单和工作示例。

### 能力检查清单

当您添加新能力时，实现通常应该一起接触这些表面：

- `src/<capability>/types.ts` 中的核心契约类型
- `src/<capability>/runtime.ts` 中的核心运行器/运行时助手
- `src/plugins/types.ts` 中的 Plugin API 注册表面
- `src/plugins/registry.ts` 中的 Plugin 注册表接线
- 当功能/Channel Plugin 需要消费它时，`src/plugins/runtime/*` 中的 Plugin 运行时暴露
- `src/test-utils/plugin-registration.ts` 中的捕获/测试助手
- `src/plugins/contracts/registry.ts` 中的所有权/契约断言
- `docs/` 中的操作员/Plugin 文档

如果其中一个表面缺失，这通常是能力尚未完全集成的信号。

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
  prompt: "展示机器人在实验室中行走。",
  cfg,
});
```

契约测试模式：

```ts
expect(findVideoGenerationProviderIdsForPlugin("openai")).toEqual(["openai"]);
```

这保持规则简单：

- 核心拥有能力契约 + 编排
- 供应商 Plugin 拥有供应商实现
- 功能/Channel Plugin 消费运行时助手
- 契约测试保持所有权明确

## 相关

- [Plugin 架构](/plugins/architecture) — 公开能力模型和形态
- [Plugin SDK 子路径](/plugins/sdk-subpaths)
- [Plugin SDK 设置](/plugins/sdk-setup)
- [构建 Plugin](/plugins/building-plugins)
