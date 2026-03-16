---
mmh3_hash: "0dd6527ebb8c72814d7b0ae34a6c26c0"
summary: "OpenClaw Plugins/Extensions：发现、配置和安全"
read_when:
  - 添加或修改 Plugins/Extensions
  - 记录 Plugin 安装或加载规则
  - 使用与 Codex/Claude 兼容的 Plugin 包
title: "Plugins"
---

# Plugins（Extensions）

## 快速入门（Plugin 新手？）

Plugin 可以是：

- 原生 **OpenClaw Plugin**（`openclaw.plugin.json` + 运行时模块），或
- 兼容的**包**（`.codex-plugin/plugin.json` 或 `.claude-plugin/plugin.json`）

两者都在 `openclaw plugins` 下显示，但只有原生 OpenClaw Plugin 会在进程内执行运行时代码。

大多数时候，当您需要尚未内置到核心 OpenClaw 中的功能（或您想将可选功能保留在主安装之外）时，您将使用 Plugins。

快速路径：

1. 查看已加载的内容：

```bash
openclaw plugins list
```

2. 安装官方 Plugin（示例：Voice Call）：

```bash
openclaw plugins install @openclaw/voice-call
```

Npm 规范**仅限注册表**（包名 + 可选的**确切版本**或**dist-tag**）。Git/URL/文件规范和语义版本范围被拒绝。

裸规范和 `@latest` 保持在稳定版本轨道上。如果 npm 将其中任一解析为预发布版本，OpenClaw 会停止并要求您使用预发布标签（如 `@beta`/`@rc` 或确切的预发布版本）明确选择。

3. 重启 Gateway，然后在 `plugins.entries.<id>.config` 下配置。

参见 [Voice Call](/plugins/voice-call) 获取具体的 Plugin 示例。
寻找第三方列表？请参见 [社区 Plugins](/plugins/community)。
需要包兼容性详情？请参见 [Plugin 包](/plugins/bundles)。

对于兼容包，从本地目录或归档文件安装：

```bash
openclaw plugins install ./my-bundle
openclaw plugins install ./my-bundle.tgz
```

对于 Claude 市场安装，先列出市场，然后按市场条目名称安装：

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

OpenClaw 从 `~/.claude/plugins/known_marketplaces.json` 解析已知的 Claude 市场名称。您也可以使用 `--marketplace` 传递明确的市场来源。

## 架构

OpenClaw 的 Plugin 系统有四个层次：

1. **清单 + 发现**
   OpenClaw 从配置路径、工作区根目录、全局扩展根目录和内置扩展中找到候选 Plugin。发现首先读取原生 `openclaw.plugin.json` 清单以及支持的包清单。
2. **启用 + 验证**
   核心决定发现的 Plugin 是启用、禁用、阻止还是为独占插槽（如 memory）选择。
3. **运行时加载**
   原生 OpenClaw Plugin 通过 jiti 在进程内加载，并将功能注册到中央注册表。兼容包被规范化为注册表记录，而不导入运行时代码。
4. **表面消费**
   OpenClaw 的其余部分读取注册表以公开工具、Channel、Provider 设置、Hook、HTTP 路由、CLI 命令和服务。

重要的设计边界：

- 发现 + 配置验证应该从**清单/Schema 元数据**工作，而不执行 Plugin 代码
- 原生运行时行为来自 Plugin 模块的 `register(api)` 路径

这种分离让 OpenClaw 在完整运行时激活之前验证配置、解释缺失/禁用的 Plugin 并构建 UI/Schema 提示。

## 兼容包

OpenClaw 还识别两种兼容的外部包布局：

- Codex 风格的包：`.codex-plugin/plugin.json`
- Claude 风格的包：`.claude-plugin/plugin.json` 或没有清单的默认 Claude 组件布局
- Cursor 风格的包：`.cursor-plugin/plugin.json`

Claude 市场条目可以指向这些兼容包中的任何一个，或原生 OpenClaw Plugin 来源。OpenClaw 首先解析市场条目，然后为已解析的来源运行正常的安装路径。

它们在 Plugin 列表中显示为 `format=bundle`，在详细/信息输出中带有 `codex` 或 `claude` 的子类型。

有关确切的检测规则、映射行为和当前支持矩阵，请参见 [Plugin 包](/plugins/bundles)。

目前，OpenClaw 将这些视为**功能包**，而不是原生运行时 Plugin：

- 现支持：内置 `skills`
- 现支持：Claude `commands/` Markdown 根目录，映射到正常的 OpenClaw Skill 加载器
- 现支持：Claude 包 `settings.json` 默认值，用于嵌入式 Pi Agent 设置（已清理 Shell 覆盖键）
- 现支持：Cursor `.cursor/commands/*.md` 根目录，映射到正常的 OpenClaw Skill 加载器
- 现支持：使用 OpenClaw Hook-pack 布局（`HOOK.md` + `handler.ts`/`handler.js`）的 Codex 包 Hook 目录
- 已检测但尚未接入：其他声明的包功能，如 Agent、Claude Hook 自动化、Cursor 规则/Hook/MCP 元数据、MCP/应用/LSP 元数据、输出样式

这意味着包的安装/发现/列表/信息/启用都能正常工作，且当包启用时，包 Skill、Claude 命令-Skill、Claude 包设置默认值和兼容的 Codex Hook 目录都会加载，但包运行时代码不会在进程内执行。

包 Hook 支持仅限于正常的 OpenClaw Hook 目录格式（`HOOK.md` 加上声明 Hook 根目录下的 `handler.ts`/`handler.js`）。供应商特定的 Shell/JSON Hook 运行时（包括 Claude `hooks.json`）目前仅被检测，不会直接执行。

## 执行模型

原生 OpenClaw Plugin 与 Gateway **在进程内**运行。它们没有沙箱。已加载的原生 Plugin 与核心代码具有相同的进程级信任边界。

含义：

- 原生 Plugin 可以注册工具、网络处理程序、Hook 和服务
- 原生 Plugin 的错误可能导致 Gateway 崩溃或不稳定
- 恶意原生 Plugin 等同于在 OpenClaw 进程内任意执行代码

兼容包在默认情况下更安全，因为 OpenClaw 目前将它们视为元数据/内容包。在当前版本中，这主要意味着内置 Skill。

对非内置 Plugin 使用允许列表和明确的安装/加载路径。将工作区 Plugin 视为开发时代码，而不是生产默认值。

重要的信任说明：

- `plugins.allow` 信任的是 **Plugin ID**，而不是来源出处。
- 与内置 Plugin 具有相同 ID 的工作区 Plugin，在该工作区 Plugin 启用/列入允许列表时会有意地覆盖内置副本。
- 这对于本地开发、补丁测试和热修复来说是正常且有用的。

## 可用的 Plugins（官方）

- Microsoft Teams 自 2026.1.15 起仅为 Plugin；如果您使用 Teams，请安装 `@openclaw/msteams`。
- Memory（Core）— 内置内存搜索 Plugin（默认通过 `plugins.slots.memory` 启用）
- Memory（LanceDB）— 内置长期内存 Plugin（自动召回/捕获；设置 `plugins.slots.memory = "memory-lancedb"`）
- [Voice Call](/plugins/voice-call) — `@openclaw/voice-call`
- [Zalo Personal](/plugins/zalouser) — `@openclaw/zalouser`
- [Matrix](/channels/matrix) — `@openclaw/matrix`
- [Nostr](/channels/nostr) — `@openclaw/nostr`
- [Zalo](/channels/zalo) — `@openclaw/zalo`
- [Microsoft Teams](/channels/msteams) — `@openclaw/msteams`
- Anthropic Provider 运行时 — 内置为 `anthropic`（默认启用）
- BytePlus Provider 目录 — 内置为 `byteplus`（默认启用）
- Cloudflare AI Gateway Provider 目录 — 内置为 `cloudflare-ai-gateway`（默认启用）
- Google 网页搜索 + Gemini CLI OAuth — 内置为 `google`（web_search 自动加载；Provider 身份验证保持选择加入）
- GitHub Copilot Provider 运行时 — 内置为 `github-copilot`（默认启用）
- Hugging Face Provider 目录 — 内置为 `huggingface`（默认启用）
- Kilo Gateway Provider 运行时 — 内置为 `kilocode`（默认启用）
- Kimi Coding Provider 目录 — 内置为 `kimi-coding`（默认启用）
- MiniMax Provider 目录 + 用量 + OAuth — 内置为 `minimax`（默认启用；拥有 `minimax` 和 `minimax-portal`）
- Mistral Provider 功能 — 内置为 `mistral`（默认启用）
- Model Studio Provider 目录 — 内置为 `modelstudio`（默认启用）
- Moonshot Provider 运行时 — 内置为 `moonshot`（默认启用）
- NVIDIA Provider 目录 — 内置为 `nvidia`（默认启用）
- OpenAI Provider 运行时 — 内置为 `openai`（默认启用；拥有 `openai` 和 `openai-codex`）
- OpenCode Go Provider 功能 — 内置为 `opencode-go`（默认启用）
- OpenCode Zen Provider 功能 — 内置为 `opencode`（默认启用）
- OpenRouter Provider 运行时 — 内置为 `openrouter`（默认启用）
- Qianfan Provider 目录 — 内置为 `qianfan`（默认启用）
- Qwen OAuth（Provider 身份验证 + 目录）— 内置为 `qwen-portal-auth`（默认启用）
- Synthetic Provider 目录 — 内置为 `synthetic`（默认启用）
- Together Provider 目录 — 内置为 `together`（默认启用）
- Venice Provider 目录 — 内置为 `venice`（默认启用）
- Vercel AI Gateway Provider 目录 — 内置为 `vercel-ai-gateway`（默认启用）
- Volcengine Provider 目录 — 内置为 `volcengine`（默认启用）
- Xiaomi Provider 目录 + 用量 — 内置为 `xiaomi`（默认启用）
- Z.AI Provider 运行时 — 内置为 `zai`（默认启用）
- Copilot Proxy（Provider 身份验证）— 本地 VS Code Copilot Proxy 桥接；与内置 `github-copilot` 设备登录不同（内置，默认禁用）

原生 OpenClaw Plugin 是通过 jiti 在运行时加载的 **TypeScript 模块**。**配置验证不执行 Plugin 代码**；它使用 Plugin 清单和 JSON Schema。参见 [Plugin 清单](/plugins/manifest)。

原生 OpenClaw Plugin 可以注册：

- Gateway RPC 方法
- Gateway HTTP 路由
- Agent 工具
- CLI 命令
- 后台服务
- 上下文引擎
- Provider 身份验证流程和模型目录
- Provider 运行时 Hook（用于动态模型 ID、传输规范化、功能元数据、流包装、缓存 TTL 策略、缺失身份验证提示、内置模型抑制、目录增强、运行时身份验证交换以及用量/计费身份验证 + 快照解析）
- 可选配置验证
- **Skills**（通过在 Plugin 清单中列出 `skills` 目录）
- **自动回复命令**（无需调用 AI Agent 即可执行）

原生 OpenClaw Plugin 与 Gateway **在进程内**运行，因此将它们视为受信任的代码。
工具编写指南：[Plugin Agent 工具](/plugins/agent-tools)。

## Provider 运行时 Hook

Provider Plugin 现在有两层：

- 清单元数据：`providerAuthEnvVars` 用于在运行时加载前进行廉价的环境身份验证查找，加上 `providerAuthChoices` 用于在运行时加载前提供廉价的引导/身份验证选择标签和 CLI 标志元数据
- 配置时 Hook：`catalog` / 旧版 `discovery`
- 运行时 Hook：`resolveDynamicModel`、`prepareDynamicModel`、`normalizeResolvedModel`、`capabilities`、`prepareExtraParams`、`wrapStreamFn`、`formatApiKey`、`refreshOAuth`、`buildAuthDoctorHint`、`isCacheTtlEligible`、`buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`isBinaryThinking`、`supportsXHighThinking`、`resolveDefaultThinkingLevel`、`isModernModelRef`、`prepareRuntimeAuth`、`resolveUsageAuth`、`fetchUsageSnapshot`

OpenClaw 仍然拥有通用的 Agent 循环、故障转移、转录处理和工具策略。这些 Hook 是针对 Provider 特定行为的接缝，无需完整的自定义推理传输。

在 Provider 有基于环境的凭据时使用清单 `providerAuthEnvVars`，这些凭据应在不加载 Plugin 运行时的情况下让通用的身份验证/状态/模型选择器路径可见。在引导/身份验证选择 CLI 表面应该知道 Provider 的选择 ID、组标签和简单的单标志身份验证接线而不加载 Provider 运行时时，使用清单 `providerAuthChoices`。将 Provider 运行时 `envVars` 保留给操作员面向的提示，如引导标签或 OAuth 客户端 ID/客户端密钥设置变量。

### Hook 顺序

对于模型/Provider Plugin，OpenClaw 按以下大致顺序使用 Hook：

1. `catalog`
   在 `models.json` 生成期间将 Provider 配置发布到 `models.providers`。
2. 内置/发现的模型查找
   OpenClaw 首先尝试正常的注册表/目录路径。
3. `resolveDynamicModel`
   针对本地注册表中尚未存在的 Provider 拥有的模型 ID 的同步回退。
4. `prepareDynamicModel`
   仅在异步模型解析路径上进行异步预热，然后再次运行 `resolveDynamicModel`。
5. `normalizeResolvedModel`
   在嵌入式运行器使用已解析模型之前进行最终重写。
6. `capabilities`
   由共享核心逻辑使用的 Provider 拥有的转录/工具元数据。
7. `prepareExtraParams`
   在通用流选项包装器之前进行 Provider 拥有的请求参数规范化。
8. `wrapStreamFn`
   在应用通用包装器后进行 Provider 拥有的流包装。
9. `formatApiKey`
   在存储的身份验证配置文件需要成为运行时 `apiKey` 字符串时使用的 Provider 拥有的身份验证配置文件格式化程序。
10. `refreshOAuth`
    针对自定义刷新端点或刷新失败策略的 Provider 拥有的 OAuth 刷新覆盖。
11. `buildAuthDoctorHint`
    OAuth 刷新失败时追加的 Provider 拥有的修复提示。
12. `isCacheTtlEligible`
    针对代理/回程 Provider 的 Provider 拥有的提示缓存策略。
13. `buildMissingAuthMessage`
    Provider 拥有的替代通用缺失身份验证恢复消息的替换。
14. `suppressBuiltInModel`
    Provider 拥有的过时上游模型抑制，加上直接解析失败的可选用户面向错误提示。
15. `augmentModelCatalog`
    发现后追加的 Provider 拥有的合成/最终目录行。
16. `isBinaryThinking`
    针对二进制思考 Provider 的 Provider 拥有的开/关推理切换。
17. `supportsXHighThinking`
    针对选定模型的 Provider 拥有的 `xhigh` 推理支持。
18. `resolveDefaultThinkingLevel`
    特定模型系列的 Provider 拥有的默认 `/think` 级别。
19. `isModernModelRef`
    由实时配置文件过滤器和烟雾选择使用的 Provider 拥有的现代模型匹配器。
20. `prepareRuntimeAuth`
    在推理之前将已配置的凭据交换为实际的运行时令牌/密钥。
21. `resolveUsageAuth`
    解析 `/usage` 和相关状态表面的用量/计费凭据。
22. `fetchUsageSnapshot`
    在身份验证解析后获取并规范化 Provider 特定的用量/配额快照。

### 使用哪个 Hook

- `catalog`：将 Provider 配置和模型目录发布到 `models.providers`
- `resolveDynamicModel`：处理本地注册表中尚不存在的直通或向前兼容模型 ID
- `prepareDynamicModel`：重试动态解析前的异步预热（例如刷新 Provider 元数据缓存）
- `normalizeResolvedModel`：在推理前重写已解析模型的传输/基础 URL/兼容性
- `capabilities`：发布 Provider 系列和转录/工具特性，而无需在核心中硬编码 Provider ID
- `prepareExtraParams`：在通用流包装之前设置 Provider 默认值或规范化 Provider 特定的每模型参数
- `wrapStreamFn`：在仍使用正常 `pi-ai` 执行路径的情况下，添加 Provider 特定的头部/有效负载/模型兼容补丁
- `formatApiKey`：将存储的身份验证配置文件转换为运行时 `apiKey` 字符串，而无需在核心中硬编码 Provider 令牌结构
- `refreshOAuth`：为不适合共享 `pi-ai` 刷新器的 Provider 拥有 OAuth 刷新
- `buildAuthDoctorHint`：刷新失败时追加 Provider 拥有的身份验证修复指南
- `isCacheTtlEligible`：决定 Provider/模型对是否应使用缓存 TTL 元数据
- `buildMissingAuthMessage`：将通用身份验证存储错误替换为 Provider 特定的恢复提示
- `suppressBuiltInModel`：隐藏过时的上游行，并可选地为直接解析失败返回 Provider 拥有的错误
- `augmentModelCatalog`：在发现和配置合并后追加合成/最终目录行
- `isBinaryThinking`：暴露二进制开/关推理 UX，而无需在 `/think` 中硬编码 Provider ID
- `supportsXHighThinking`：将特定模型选择加入 `xhigh` 推理级别
- `resolveDefaultThinkingLevel`：将 Provider/模型默认推理策略保留在核心之外
- `isModernModelRef`：将实时/烟雾首选模型系列包含规则保留在 Provider 内
- `prepareRuntimeAuth`：将已配置的凭据交换为用于请求的实际短期运行时令牌/密钥
- `resolveUsageAuth`：解析 Provider 拥有的用量/计费端点凭据，而无需在核心中硬编码令牌解析
- `fetchUsageSnapshot`：拥有 Provider 特定的用量端点获取/解析，而核心保持摘要扇出和格式化

经验法则：

- Provider 拥有目录或基础 URL 默认值：使用 `catalog`
- Provider 接受任意上游模型 ID：使用 `resolveDynamicModel`
- Provider 在解析未知 ID 之前需要网络元数据：添加 `prepareDynamicModel`
- Provider 需要传输重写但仍使用核心传输：使用 `normalizeResolvedModel`
- Provider 需要转录/Provider 系列特性：使用 `capabilities`
- Provider 需要默认请求参数或每 Provider 参数清理：使用 `prepareExtraParams`
- Provider 需要请求头/正文/模型兼容包装器，而无需自定义传输：使用 `wrapStreamFn`
- Provider 在身份验证配置文件中存储额外元数据，并需要自定义运行时令牌形状：使用 `formatApiKey`
- Provider 需要自定义 OAuth 刷新端点或刷新失败策略：使用 `refreshOAuth`
- Provider 在刷新失败后需要 Provider 拥有的身份验证修复指南：使用 `buildAuthDoctorHint`
- Provider 需要代理特定的缓存 TTL 门控：使用 `isCacheTtlEligible`
- Provider 需要 Provider 特定的缺失身份验证恢复提示：使用 `buildMissingAuthMessage`
- Provider 需要隐藏过时的上游行或用供应商提示替换它们：使用 `suppressBuiltInModel`
- Provider 需要在 `models list` 和选择器中使用合成向前兼容行：使用 `augmentModelCatalog`
- Provider 只暴露二进制思考开/关：使用 `isBinaryThinking`
- Provider 希望仅在模型子集上使用 `xhigh`：使用 `supportsXHighThinking`
- Provider 拥有模型系列的默认 `/think` 策略：使用 `resolveDefaultThinkingLevel`
- Provider 拥有实时/烟雾首选模型匹配：使用 `isModernModelRef`
- Provider 需要令牌交换或短期请求凭据：使用 `prepareRuntimeAuth`
- Provider 需要自定义用量/配额令牌解析或不同的用量凭据：使用 `resolveUsageAuth`
- Provider 需要 Provider 特定的用量端点或有效负载解析器：使用 `fetchUsageSnapshot`

如果 Provider 需要完全自定义的有线协议或自定义请求执行器，这是一种不同类型的扩展。这些 Hook 用于仍在 OpenClaw 正常推理循环上运行的 Provider 行为。

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

- Anthropic 使用 `resolveDynamicModel`、`capabilities`、`buildAuthDoctorHint`、`resolveUsageAuth`、`fetchUsageSnapshot`、`isCacheTtlEligible`、`resolveDefaultThinkingLevel` 和 `isModernModelRef`，因为它拥有 Claude 4.6 向前兼容性、Provider 系列提示、身份验证修复指南、用量端点集成、提示缓存资格和 Claude 默认/自适应思考策略。
- OpenAI 使用 `resolveDynamicModel`、`normalizeResolvedModel` 和 `capabilities` 加上 `buildMissingAuthMessage`、`suppressBuiltInModel`、`augmentModelCatalog`、`supportsXHighThinking` 和 `isModernModelRef`，因为它拥有 GPT-5.4 向前兼容性、直接 OpenAI `openai-completions` -> `openai-responses` 规范化、Codex 感知身份验证提示、Spark 抑制、合成 OpenAI 列表行和 GPT-5 思考/实时模型策略。
- OpenRouter 使用 `catalog` 加上 `resolveDynamicModel` 和 `prepareDynamicModel`，因为 Provider 是直通的，可能在 OpenClaw 的静态目录更新之前公开新的模型 ID。
- GitHub Copilot 使用 `catalog`、`auth`、`resolveDynamicModel` 和 `capabilities` 加上 `prepareRuntimeAuth` 和 `fetchUsageSnapshot`，因为它需要 Provider 拥有的设备登录、模型回退行为、Claude 转录特性、GitHub 令牌 -> Copilot 令牌交换以及 Provider 拥有的用量端点。
- OpenAI Codex 使用 `catalog`、`resolveDynamicModel`、`normalizeResolvedModel`、`refreshOAuth` 和 `augmentModelCatalog` 加上 `prepareExtraParams`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它仍在核心 OpenAI 传输上运行，但拥有其传输/基础 URL 规范化、OAuth 刷新回退策略、默认传输选择、合成 Codex 目录行和 ChatGPT 用量端点集成。
- Google AI Studio 和 Gemini CLI OAuth 使用 `resolveDynamicModel` 和 `isModernModelRef`，因为它们拥有 Gemini 3.1 向前兼容回退和现代模型匹配；Gemini CLI OAuth 还使用 `formatApiKey`、`resolveUsageAuth` 和 `fetchUsageSnapshot` 用于令牌格式化、令牌解析和配额端点接线。
- OpenRouter 使用 `capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，以将 Provider 特定的请求头、路由元数据、推理补丁和提示缓存策略保留在核心之外。
- Moonshot 使用 `catalog` 加上 `wrapStreamFn`，因为它仍使用共享的 OpenAI 传输，但需要 Provider 拥有的思考有效负载规范化。
- Kilocode 使用 `catalog`、`capabilities`、`wrapStreamFn` 和 `isCacheTtlEligible`，因为它需要 Provider 拥有的请求头、推理有效负载规范化、Gemini 转录提示和 Anthropic 缓存 TTL 门控。
- Z.AI 使用 `resolveDynamicModel`、`prepareExtraParams`、`wrapStreamFn`、`isCacheTtlEligible`、`isBinaryThinking`、`isModernModelRef`、`resolveUsageAuth` 和 `fetchUsageSnapshot`，因为它拥有 GLM-5 回退、`tool_stream` 默认值、二进制思考 UX、现代模型匹配以及用量身份验证 + 配额获取。
- Mistral、OpenCode Zen 和 OpenCode Go 仅使用 `capabilities` 以将转录/工具特性保留在核心之外。
- 仅目录的内置 Provider（如 `byteplus`、`cloudflare-ai-gateway`、`huggingface`、`kimi-coding`、`modelstudio`、`nvidia`、`qianfan`、`synthetic`、`together`、`venice`、`vercel-ai-gateway` 和 `volcengine`）仅使用 `catalog`。
- Qwen Portal 使用 `catalog`、`auth` 和 `refreshOAuth`。
- MiniMax 和 Xiaomi 使用 `catalog` 加上用量 Hook，因为它们的 `/usage` 行为是 Plugin 拥有的，即使推理仍通过共享传输运行。

## 加载管道

在启动时，OpenClaw 大致执行以下操作：

1. 发现候选 Plugin 根目录
2. 读取原生或兼容包清单和包元数据
3. 拒绝不安全的候选项
4. 规范化 Plugin 配置（`plugins.enabled`、`allow`、`deny`、`entries`、`slots`、`load.paths`）
5. 决定每个候选项的启用状态
6. 通过 jiti 加载启用的原生模块
7. 调用原生 `register(api)` Hook 并将注册收集到 Plugin 注册表中
8. 将注册表公开给命令/运行时表面

安全门在**运行时执行之前**发生。当条目逃出 Plugin 根目录、路径对所有人可写，或非内置 Plugin 的路径所有权看起来可疑时，候选项会被阻止。

### 清单优先行为

清单是控制平面的真相来源。OpenClaw 使用它来：

- 识别 Plugin
- 发现声明的 Channel/Skill/配置 Schema 或包功能
- 验证 `plugins.entries.<id>.config`
- 增强 Control UI 标签/占位符
- 显示安装/目录元数据

对于原生 Plugin，运行时模块是数据平面部分。它注册实际行为，如 Hook、工具、命令或 Provider 流程。

### 加载器缓存的内容

OpenClaw 为以下内容保留短期进程内缓存：

- 发现结果
- 清单注册表数据
- 已加载的 Plugin 注册表

这些缓存减少了突发性启动和重复命令开销。可以将它们视为短期性能缓存，而不是持久化存储。

## 运行时助手

Plugin 可以通过 `api.runtime` 访问选定的核心助手。对于电话 TTS：

```ts
const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});
```

注意：

- 使用核心 `messages.tts` 配置（OpenAI 或 ElevenLabs）。
- 返回 PCM 音频缓冲区 + 采样率。Plugin 必须为 Provider 重新采样/编码。
- 电话不支持 Edge TTS。

对于 STT/语音转录，Plugin 可以调用：

```ts
const { text } = await api.runtime.stt.transcribeAudioFile({
  filePath: "/tmp/inbound-audio.ogg",
  cfg: api.config,
  // 当无法可靠推断 MIME 类型时可选填写：
  mime: "audio/ogg",
});
```

注意：

- 使用核心媒体理解音频配置（`tools.media.audio`）和 Provider 回退顺序。
- 当没有产生转录输出时（例如跳过/不支持的输入），返回 `{ text: undefined }`。

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
- `auth`：必填。使用 `"gateway"` 要求正常的 Gateway 身份验证，或使用 `"plugin"` 进行 Plugin 管理的身份验证/Webhook 验证。
- `match`：可选。`"exact"`（默认）或 `"prefix"`。
- `replaceExisting`：可选。允许同一 Plugin 替换其自己的现有路由注册。
- `handler`：当路由处理了请求时返回 `true`。

注意：

- `api.registerHttpHandler(...)` 已过时。使用 `api.registerHttpRoute(...)`。
- Plugin 路由必须明确声明 `auth`。
- 精确的 `path + match` 冲突将被拒绝，除非 `replaceExisting: true`，并且一个 Plugin 不能替换另一个 Plugin 的路由。
- 具有不同 `auth` 级别的重叠路由将被拒绝。仅在相同的 `auth` 级别上保留 `exact`/`prefix` 回退链。

## Plugin SDK 导入路径

在编写 Plugin 时，使用 SDK 子路径而不是整体 `openclaw/plugin-sdk` 导入：

- `openclaw/plugin-sdk/core`：用于通用 Plugin API、Provider 身份验证类型和共享助手，如路由/Session 实用程序和基于日志器的运行时。
- `openclaw/plugin-sdk/compat`：用于需要比 `core` 更广泛的共享运行时助手的内置/内部 Plugin 代码。
- `openclaw/plugin-sdk/telegram`：用于 Telegram Channel Plugin 类型和共享的 Channel 面向助手。
- `openclaw/plugin-sdk/discord`：用于 Discord Channel Plugin 类型和共享的 Channel 面向助手。
- `openclaw/plugin-sdk/slack`：用于 Slack Channel Plugin 类型和共享的 Channel 面向助手。
- `openclaw/plugin-sdk/signal`：用于 Signal Channel Plugin 类型和共享的 Channel 面向助手。
- `openclaw/plugin-sdk/imessage`：用于 iMessage Channel Plugin 类型和共享的 Channel 面向助手。
- `openclaw/plugin-sdk/whatsapp`：用于 WhatsApp Channel Plugin 类型和共享的 Channel 面向助手。
- `openclaw/plugin-sdk/line`：用于 LINE Channel Plugin。
- `openclaw/plugin-sdk/msteams`：用于内置 Microsoft Teams Plugin 表面。
- 内置扩展特定的子路径也可用：`openclaw/plugin-sdk/acpx`、`openclaw/plugin-sdk/bluebubbles`、`openclaw/plugin-sdk/copilot-proxy`、`openclaw/plugin-sdk/device-pair`、`openclaw/plugin-sdk/diagnostics-otel`、`openclaw/plugin-sdk/diffs`、`openclaw/plugin-sdk/feishu`、`openclaw/plugin-sdk/googlechat`、`openclaw/plugin-sdk/irc`、`openclaw/plugin-sdk/llm-task`、`openclaw/plugin-sdk/lobster`、`openclaw/plugin-sdk/matrix`、`openclaw/plugin-sdk/mattermost`、`openclaw/plugin-sdk/memory-core`、`openclaw/plugin-sdk/memory-lancedb`、`openclaw/plugin-sdk/minimax-portal-auth`、`openclaw/plugin-sdk/nextcloud-talk`、`openclaw/plugin-sdk/nostr`、`openclaw/plugin-sdk/open-prose`、`openclaw/plugin-sdk/phone-control`、`openclaw/plugin-sdk/qwen-portal-auth`、`openclaw/plugin-sdk/synology-chat`、`openclaw/plugin-sdk/talk-voice`、`openclaw/plugin-sdk/test-utils`、`openclaw/plugin-sdk/thread-ownership`、`openclaw/plugin-sdk/tlon`、`openclaw/plugin-sdk/twitch`、`openclaw/plugin-sdk/voice-call`、`openclaw/plugin-sdk/zalo` 和 `openclaw/plugin-sdk/zalouser`。

## Provider 目录

Provider Plugin 可以使用 `registerProvider({ catalog: { run(...) { ... } } })` 为推理定义模型目录。

`catalog.run(...)` 返回 OpenClaw 写入 `models.providers` 的相同形状：

- `{ provider }` 用于一个 Provider 条目
- `{ providers }` 用于多个 Provider 条目

在 Plugin 拥有 Provider 特定的模型 ID、基础 URL 默认值或受身份验证限制的模型元数据时使用 `catalog`。

`catalog.order` 控制 Plugin 目录相对于 OpenClaw 内置隐式 Provider 合并的时机：

- `simple`：普通 API 密钥或环境驱动的 Provider
- `profile`：当身份验证配置文件存在时出现的 Provider
- `paired`：合成多个相关 Provider 条目的 Provider
- `late`：最后一次，在其他隐式 Provider 之后

后续 Provider 在键冲突时获胜，因此 Plugin 可以有意覆盖具有相同 Provider ID 的内置 Provider 条目。

兼容性：

- `discovery` 仍作为旧版别名工作
- 如果同时注册了 `catalog` 和 `discovery`，OpenClaw 使用 `catalog`

兼容性说明：

- `openclaw/plugin-sdk` 对现有外部 Plugin 仍然受支持。
- 新的和已迁移的内置 Plugin 应使用 Channel 或扩展特定的子路径；对通用表面使用 `core`，仅在需要更广泛的共享助手时使用 `compat`。

## 只读 Channel 检查

如果您的 Plugin 注册了一个 Channel，建议在 `resolveAccount(...)` 旁边实现 `plugin.config.inspectAccount(cfg, accountId)`。

原因：

- `resolveAccount(...)` 是运行时路径。它被允许假设凭据已完全实例化，并在所需密钥缺失时快速失败。
- 只读命令路径，如 `openclaw status`、`openclaw status --all`、`openclaw channels status`、`openclaw channels resolve` 以及医生/配置修复流程，不应为了描述配置而需要实例化运行时凭据。

推荐的 `inspectAccount(...)` 行为：

- 仅返回描述性账户状态。
- 保留 `enabled` 和 `configured`。
- 在相关时包含凭据来源/状态字段，例如：
  - `tokenSource`、`tokenStatus`
  - `botTokenSource`、`botTokenStatus`
  - `appTokenSource`、`appTokenStatus`
  - `signingSecretSource`、`signingSecretStatus`
- 您不需要仅为了报告只读可用性而返回原始令牌值。返回 `tokenStatus: "available"`（和匹配的来源字段）对于状态类命令来说就足够了。
- 当凭据通过 SecretRef 配置但在当前命令路径中不可用时，使用 `configured_unavailable`。

这让只读命令报告"已配置但在此命令路径中不可用"，而不是崩溃或错误报告账户未配置。

性能说明：

- Plugin 发现和清单元数据使用短期进程内缓存来减少突发性启动/重新加载工作。
- 设置 `OPENCLAW_DISABLE_PLUGIN_DISCOVERY_CACHE=1` 或 `OPENCLAW_DISABLE_PLUGIN_MANIFEST_CACHE=1` 以禁用这些缓存。
- 使用 `OPENCLAW_PLUGIN_DISCOVERY_CACHE_MS` 和 `OPENCLAW_PLUGIN_MANIFEST_CACHE_MS` 调整缓存窗口。

## 发现和优先级

OpenClaw 按顺序扫描：

1. 配置路径

- `plugins.load.paths`（文件或目录）

2. 工作区扩展

- `<workspace>/.openclaw/extensions/*.ts`
- `<workspace>/.openclaw/extensions/*/index.ts`

3. 全局扩展

- `~/.openclaw/extensions/*.ts`
- `~/.openclaw/extensions/*/index.ts`

4. 内置扩展（随 OpenClaw 一起提供；混合默认开/默认关）

- `<openclaw>/extensions/*`

许多内置 Provider Plugin 默认启用，因此模型目录/运行时 Hook 无需额外设置即可使用。其他仍然需要通过 `plugins.entries.<id>.enabled` 或 `openclaw plugins enable <id>` 明确启用。

默认开启的内置 Plugin 示例：

- `byteplus`
- `cloudflare-ai-gateway`
- `device-pair`
- `github-copilot`
- `huggingface`
- `kilocode`
- `kimi-coding`
- `minimax`
- `modelstudio`
- `moonshot`
- `nvidia`
- `ollama`
- `openai`
- `openrouter`
- `phone-control`
- `qianfan`
- `qwen-portal-auth`
- `sglang`
- `synthetic`
- `talk-voice`
- `together`
- `venice`
- `vercel-ai-gateway`
- `vllm`
- `volcengine`
- `xiaomi`
- 活动内存插槽 Plugin（默认插槽：`memory-core`）

已安装的 Plugin 默认启用，但可以以相同方式禁用。

工作区 Plugin **默认禁用**，除非您明确启用它们或将其列入允许列表。这是有意为之：检出的仓库不应悄悄成为生产 Gateway 代码。

安全强化说明：

- 如果 `plugins.allow` 为空且非内置 Plugin 可被发现，OpenClaw 会在启动时记录带有 Plugin ID 和来源的警告。
- 候选路径在发现准入前经过安全检查。OpenClaw 在以下情况下阻止候选项：
  - 扩展入口解析到 Plugin 根目录之外（包括符号链接/路径遍历逃逸），
  - Plugin 根/来源路径对所有人可写，
  - 非内置 Plugin 的路径所有权可疑（POSIX 所有者既不是当前 uid 也不是 root）。
- 没有安装/加载路径来源的已加载非内置 Plugin 会发出警告，以便您可以固定信任（`plugins.allow`）或安装跟踪（`plugins.installs`）。

每个原生 OpenClaw Plugin 必须在其根目录中包含一个 `openclaw.plugin.json` 文件。如果路径指向文件，则 Plugin 根目录是文件的目录，并且必须包含清单。

兼容包可以提供以下之一：

- `.codex-plugin/plugin.json`
- `.claude-plugin/plugin.json`

包目录从与原生 Plugin 相同的根目录发现。

如果多个 Plugin 解析为相同的 ID，则上述顺序中的第一个匹配项获胜，较低优先级的副本将被忽略。

这意味着：

- 工作区 Plugin 有意覆盖具有相同 ID 的内置 Plugin
- `plugins.allow: ["foo"]` 按 ID 授权活动 `foo` Plugin，即使活动副本来自工作区而不是内置扩展根目录
- 如果您需要更严格的来源控制，请使用明确的安装/加载路径，并在启用之前检查已解析的 Plugin 来源

### 启用规则

启用在发现后解析：

- `plugins.enabled: false` 禁用所有 Plugin
- `plugins.deny` 始终获胜
- `plugins.entries.<id>.enabled: false` 禁用该 Plugin
- 工作区来源的 Plugin 默认禁用
- 当 `plugins.allow` 非空时，允许列表限制活动集
- 允许列表是**基于 ID 的**，而不是基于来源的
- 内置 Plugin 默认禁用，除非：
  - 内置 ID 在内置默认开启集合中，或
  - 您明确启用它，或
  - Channel 配置隐式启用内置 Channel Plugin
- 独占插槽可以强制启用该插槽的选定 Plugin

在当前核心中，内置默认开启的 ID 包括上面的本地/Provider 助手以及活动内存插槽 Plugin。

### 包集合

Plugin 目录可能包含带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"],
    "setupEntry": "./src/setup-entry.ts"
  }
}
```

每个条目都成为一个 Plugin。如果包列出多个扩展，则 Plugin ID 变为 `name/<fileBase>`。

如果您的 Plugin 导入 npm 依赖项，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全防护：`openclaw.extensions` 的每个条目在符号链接解析后必须保持在 Plugin 目录内。逃出包目录的条目将被拒绝。

安全说明：`openclaw plugins install` 使用 `npm install --ignore-scripts` 安装 Plugin 依赖项（不运行生命周期脚本）。保持 Plugin 依赖树为"纯 JS/TS"，避免需要 `postinstall` 构建的包。

可选：`openclaw.setupEntry` 可以指向一个轻量级的仅设置模块。当 OpenClaw 需要为禁用的 Channel Plugin 提供设置表面时，或当 Channel Plugin 已启用但仍未配置时，它加载 `setupEntry` 而不是完整的 Plugin 条目。当您的主 Plugin 条目还接入工具、Hook 或其他仅运行时代码时，这可以使启动和设置更轻量。

### Channel 目录元数据

Channel Plugin 可以通过 `openclaw.channel` 发布设置/发现元数据，并通过 `openclaw.install` 发布安装提示。这使核心目录保持无数据。

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
      "localPath": "extensions/nextcloud-talk",
      "defaultChoice": "npm"
    }
  }
}
```

OpenClaw 还可以合并**外部 Channel 目录**（例如，MPM 注册表导出）。在以下位置之一放置 JSON 文件：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。

## Plugin ID

默认 Plugin ID：

- 包集合：`package.json` `name`
- 独立文件：文件基本名称（`~/.../voice-call.ts` → `voice-call`）

如果 Plugin 导出 `id`，OpenClaw 使用它，但在它与配置的 ID 不匹配时发出警告。

## 注册表模型

已加载的 Plugin 不会直接改变随机的核心全局变量。它们注册到中央 Plugin 注册表。

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

核心功能然后从该注册表读取，而不是直接与 Plugin 模块通信。这使加载保持单向：

- Plugin 模块 -> 注册表注册
- 核心运行时 -> 注册表消费

这种分离对可维护性很重要。这意味着大多数核心表面只需要一个集成点："读取注册表"，而不是"针对每个 Plugin 模块进行特殊处理"。

## 配置

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

字段：

- `enabled`：主开关（默认：true）
- `allow`：允许列表（可选）
- `deny`：拒绝列表（可选；拒绝优先）
- `load.paths`：额外的 Plugin 文件/目录
- `slots`：独占插槽选择器，例如 `memory` 和 `contextEngine`
- `entries.<id>`：每个 Plugin 的切换 + 配置

配置更改**需要重启 Gateway**。

验证规则（严格）：

- `entries`、`allow`、`deny` 或 `slots` 中的未知 Plugin ID 是**错误**。
- 未知的 `channels.<id>` 键是**错误**，除非 Plugin 清单声明了 Channel ID。
- 原生 Plugin 配置使用 `openclaw.plugin.json`（`configSchema`）中嵌入的 JSON Schema 进行验证。
- 兼容包目前不公开原生 OpenClaw 配置 Schema。
- 如果禁用 Plugin，则保留其配置并发出**警告**。

### 禁用 vs 缺失 vs 无效

这些状态是有意不同的：

- **禁用**：Plugin 存在，但启用规则将其关闭
- **缺失**：配置引用了发现未找到的 Plugin ID
- **无效**：Plugin 存在，但其配置与声明的 Schema 不匹配

OpenClaw 为禁用的 Plugin 保留配置，因此重新打开它们不会造成破坏性影响。

## Plugin 插槽（独占类别）

某些 Plugin 类别是**独占的**（一次只有一个活动）。使用 `plugins.slots` 选择哪个 Plugin 拥有插槽：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 或 "none" 以禁用内存 Plugin
      contextEngine: "legacy", // 或 Plugin ID，例如 "lossless-claw"
    },
  },
}
```

支持的独占插槽：

- `memory`：活动内存 Plugin（`"none"` 禁用内存 Plugin）
- `contextEngine`：活动上下文引擎 Plugin（`"legacy"` 是内置默认值）

如果多个 Plugin 声明 `kind: "memory"` 或 `kind: "context-engine"`，则只加载选定的 Plugin 用于该插槽。其他将被禁用并带有诊断信息。

### 上下文引擎 Plugin

上下文引擎 Plugin 负责 Session 上下文的摄取、组装和压缩编排。从 Plugin 中通过 `api.registerContextEngine(id, factory)` 注册，然后使用 `plugins.slots.contextEngine` 选择活动引擎。

当您的 Plugin 需要替换或扩展默认上下文管道（而不仅仅是添加内存搜索或 Hook）时使用此功能。

## Control UI（Schema + 标签）

Control UI 使用 `config.schema`（JSON Schema + `uiHints`）来呈现更好的表单。

OpenClaw 根据发现的 Plugin 在运行时增强 `uiHints`：

- 为 `plugins.entries.<id>` / `.enabled` / `.config` 添加每个 Plugin 的标签
- 在以下位置合并可选的 Plugin 提供的配置字段提示：`plugins.entries.<id>.config.<field>`

如果您希望 Plugin 配置字段显示良好的标签/占位符（并将密钥标记为敏感），请在 Plugin 清单中的 JSON Schema 旁边提供 `uiHints`。

示例：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": { "type": "string" },
      "region": { "type": "string" }
    }
  },
  "uiHints": {
    "apiKey": { "label": "API Key", "sensitive": true },
    "region": { "label": "Region", "placeholder": "us-east-1" }
  }
}
```

## CLI

```bash
openclaw plugins list
openclaw plugins info <id>
openclaw plugins install <path>                 # 将本地文件/目录复制到 ~/.openclaw/extensions/<id>
openclaw plugins install ./extensions/voice-call # 相对路径可以
openclaw plugins install ./plugin.tgz           # 从本地 tarball 安装
openclaw plugins install ./plugin.zip           # 从本地 zip 安装
openclaw plugins install -l ./extensions/voice-call # 链接（不复制）用于开发
openclaw plugins install @openclaw/voice-call # 从 npm 安装
openclaw plugins install @openclaw/voice-call --pin # 存储确切解析的 name@version
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins doctor
```

`openclaw plugins list` 将顶级格式显示为 `openclaw` 或 `bundle`。详细列表/信息输出还显示包子类型（`codex` 或 `claude`）以及检测到的包功能。

`plugins update` 仅适用于在 `plugins.installs` 下跟踪的 npm 安装。如果存储的完整性元数据在更新之间发生变化，OpenClaw 会发出警告并要求确认（使用全局 `--yes` 绕过提示）。

Plugin 也可以注册自己的顶级命令（示例：`openclaw voicecall`）。

## Plugin API（概述）

Plugin 导出：

- 函数：`(api) => { ... }`
- 对象：`{ id, name, configSchema, register(api) { ... } }`

`register(api)` 是 Plugin 附加行为的地方。常见的注册包括：

- `registerTool`
- `registerHook`
- `on(...)` 用于类型化的生命周期 Hook
- `registerChannel`
- `registerProvider`
- `registerHttpRoute`
- `registerCommand`
- `registerCli`
- `registerContextEngine`
- `registerService`

上下文引擎 Plugin 也可以注册运行时拥有的上下文管理器：

```ts
export default function (api) {
  api.registerContextEngine("lossless-claw", () => ({
    info: { id: "lossless-claw", name: "Lossless Claw", ownsCompaction: true },
    async ingest() {
      return { ingested: true };
    },
    async assemble({ messages }) {
      return { messages, estimatedTokens: 0 };
    },
    async compact() {
      return { ok: true, compacted: false };
    },
  }));
}
```

然后在配置中启用它：

```json5
{
  plugins: {
    slots: {
      contextEngine: "lossless-claw",
    },
  },
}
```

## Plugin Hook

Plugin 可以在运行时注册 Hook。这使 Plugin 能够捆绑事件驱动的自动化，而无需单独的 Hook 包安装。

### 示例

```ts
export default function register(api) {
  api.registerHook(
    "command:new",
    async () => {
      // Hook 逻辑在这里。
    },
    {
      name: "my-plugin.command-new",
      description: "Runs when /new is invoked",
    },
  );
}
```

注意：

- 通过 `api.registerHook(...)` 显式注册 Hook。
- Hook 资格规则仍然适用（OS/bins/env/config 要求）。
- Plugin 管理的 Hook 在 `openclaw hooks list` 中显示为 `plugin:<id>`。
- 您无法通过 `openclaw hooks` 启用/禁用 Plugin 管理的 Hook；改为启用/禁用 Plugin。

### Agent 生命周期 Hook（`api.on`）

对于类型化的运行时生命周期 Hook，使用 `api.on(...)`：

```ts
export default function register(api) {
  api.on(
    "before_prompt_build",
    (event, ctx) => {
      return {
        prependSystemContext: "Follow company style guide.",
      };
    },
    { priority: 10 },
  );
}
```

提示构建的重要 Hook：

- `before_model_resolve`：在 Session 加载前运行（`messages` 不可用）。用于确定性地覆盖 `modelOverride` 或 `providerOverride`。
- `before_prompt_build`：在 Session 加载后运行（`messages` 可用）。用于调整提示输入。
- `before_agent_start`：旧版兼容 Hook。优先使用上述两个明确的 Hook。

核心强制 Hook 策略：

- 操作员可以通过 `plugins.entries.<id>.hooks.allowPromptInjection: false` 按 Plugin 禁用提示修改 Hook。
- 禁用时，OpenClaw 阻止 `before_prompt_build`，并忽略旧版 `before_agent_start` 返回的提示修改字段，同时保留旧版 `modelOverride` 和 `providerOverride`。

`before_prompt_build` 结果字段：

- `prependContext`：将文本前置到此次运行的用户提示。最适合每轮或动态内容。
- `systemPrompt`：完整系统提示覆盖。
- `prependSystemContext`：将文本前置到当前系统提示。
- `appendSystemContext`：将文本追加到当前系统提示。

嵌入式运行时中的提示构建顺序：

1. 将 `prependContext` 应用到用户提示。
2. 提供时应用 `systemPrompt` 覆盖。
3. 应用 `prependSystemContext + 当前系统提示 + appendSystemContext`。

合并和优先级说明：

- Hook 处理程序按优先级运行（越高越先）。
- 对于合并的上下文字段，值按执行顺序连接。
- `before_prompt_build` 的值在旧版 `before_agent_start` 回退值之前应用。

迁移指南：

- 将静态指导从 `prependContext` 移至 `prependSystemContext`（或 `appendSystemContext`），以便 Provider 可以缓存稳定的系统前缀内容。
- 将 `prependContext` 保留用于应与用户消息绑定的每轮动态上下文。

## Provider Plugin（模型身份验证）

Plugin 可以注册**模型 Provider**，以便用户可以在 OpenClaw 内运行 OAuth 或 API 密钥设置，在引导/模型选择器中显示 Provider 设置，并提供隐式 Provider 发现。

Provider Plugin 是模型-Provider 设置的模块化扩展接缝。它们不再只是"OAuth 助手"。

### Provider Plugin 生命周期

Provider Plugin 可以参与五个不同的阶段：

1. **身份验证**
   `auth[].run(ctx)` 执行 OAuth、API 密钥捕获、设备代码或自定义设置，并返回身份验证配置文件以及可选的配置补丁。
2. **非交互式设置**
   `auth[].runNonInteractive(ctx)` 处理 `openclaw onboard --non-interactive`，无需提示。当 Provider 需要超出内置简单 API 密钥路径的自定义无头设置时使用此功能。
3. **向导集成**
   `wizard.setup` 向 `openclaw onboard` 添加条目。`wizard.modelPicker` 向模型选择器添加设置条目。
4. **隐式发现**
   `discovery.run(ctx)` 可以在模型解析/列出期间自动提供 Provider 配置。
5. **选择后跟进**
   `onModelSelected(ctx)` 在选择模型后运行。用于 Provider 特定的工作，如下载本地模型。

这是推荐的分离，因为这些阶段有不同的生命周期要求：

- 身份验证是交互式的，写入凭据/配置
- 非交互式设置是标志/环境驱动的，不能提示
- 向导元数据是静态的，面向 UI
- 发现应该快速、尽力而为且对失败有容忍度
- 选择后 Hook 是与所选模型绑定的副作用

### Provider 身份验证契约

`auth[].run(ctx)` 返回：

- `profiles`：要写入的身份验证配置文件
- `configPatch`：可选的 `openclaw.json` 更改
- `defaultModel`：可选的 `provider/model` 引用
- `notes`：可选的用户面向说明

核心然后：

1. 写入返回的身份验证配置文件
2. 应用身份验证配置文件配置接线
3. 合并配置补丁
4. 可选地应用默认模型
5. 在适当时运行 Provider 的 `onModelSelected` Hook

这意味着 Provider Plugin 拥有 Provider 特定的设置逻辑，而核心拥有通用的持久化和配置合并路径。

### Provider 非交互式契约

`auth[].runNonInteractive(ctx)` 是可选的。在 Provider 需要通过内置通用 API 密钥流程无法表达的无头设置时实现它。

非交互式上下文包括：

- 当前和基础配置
- 已解析的引导 CLI 选项
- 运行时日志/错误助手
- Agent/工作区目录，以便 Provider 可以将身份验证持久化到引导其余部分使用的相同范围存储中
- `resolveApiKey(...)` 用于从标志、环境或现有身份验证配置文件读取 Provider 密钥，同时遵守 `--secret-input-mode`
- `toApiKeyCredential(...)` 用于将已解析的密钥转换为具有正确明文与 secret-ref 存储的身份验证配置文件凭据

将此表面用于以下 Provider：

- 需要 `--custom-base-url` + `--custom-model-id` 的自托管 OpenAI 兼容运行时
- Provider 特定的非交互式验证或配置合成

不要从 `runNonInteractive` 提示。改为以可操作的错误拒绝缺失的输入。

### Provider 向导元数据

Provider 身份验证/引导元数据可以存在于两层：

- 清单 `providerAuthChoices`：在运行时加载前可用的廉价标签、分组、`--auth-choice` ID 和简单 CLI 标志元数据
- 运行时 `wizard.setup` / `auth[].wizard`：依赖加载的 Provider 代码的更丰富行为

对静态标签/标志使用清单元数据。当设置依赖于动态身份验证方法、方法回退或运行时验证时使用运行时向导元数据。

`wizard.setup` 控制 Provider 在分组引导中的显示方式：

- `choiceId`：身份验证选择值
- `choiceLabel`：选项标签
- `choiceHint`：简短提示
- `groupId`：组桶 ID
- `groupLabel`：组标签
- `groupHint`：组提示
- `methodId`：要运行的身份验证方法
- `modelAllowlist`：可选的引导后允许列表策略（`allowedKeys`、`initialSelections`、`message`）

`wizard.modelPicker` 控制 Provider 在模型选择中作为"立即设置"条目的显示方式：

- `label`
- `hint`
- `methodId`

当 Provider 有多个身份验证方法时，向导可以指向一个明确的方法，或让 OpenClaw 合成每个方法的选择。

OpenClaw 在 Plugin 注册时验证 Provider 向导元数据：

- 重复或空白的身份验证方法 ID 被拒绝
- 当 Provider 没有身份验证方法时，向导元数据被忽略
- 无效的 `methodId` 绑定降级为警告，并回退到 Provider 的其余身份验证方法

### Provider 发现契约

`discovery.run(ctx)` 返回以下之一：

- `{ provider }`
- `{ providers }`
- `null`

使用 `{ provider }` 用于 Plugin 拥有一个 Provider ID 的常见情况。当 Plugin 发现多个 Provider 条目时使用 `{ providers }`。

发现上下文包括：

- 当前配置
- Agent/工作区目录
- 进程环境
- 解析 Provider API 密钥和发现安全的 API 密钥值的助手

发现应该：

- 快速
- 尽力而为
- 对失败可以安全跳过
- 注意副作用

它不应该依赖提示或长时间运行的设置。

### 发现顺序

Provider 发现按有序阶段运行：

- `simple`
- `profile`
- `paired`
- `late`

使用：

- `simple` 用于廉价的仅环境发现
- `profile` 当发现依赖于身份验证配置文件时
- `paired` 用于需要与另一个发现步骤协调的 Provider
- `late` 用于昂贵或本地网络探测

大多数自托管 Provider 应使用 `late`。

### 良好的 Provider Plugin 边界

适合 Provider Plugin 的情况：

- 具有自定义设置流程的本地/自托管 Provider
- Provider 特定的 OAuth/设备代码登录
- 本地模型服务器的隐式发现
- 选择后副作用，如模型拉取

不太适合的情况：

- 仅在环境变量、基础 URL 和一个默认模型上有所不同的琐碎仅 API 密钥 Provider

这些仍然可以成为 Plugin，但主要的模块化收益来自于首先提取行为丰富的 Provider。

通过 `api.registerProvider(...)` 注册 Provider。每个 Provider 公开一种或多种身份验证方法（OAuth、API 密钥、设备代码等）。这些方法可以支持：

- `openclaw models auth login --provider <id> [--method <id>]`
- `openclaw onboard`
- 模型选择器"自定义 Provider"设置条目
- 模型解析/列出期间的隐式 Provider 发现

示例：

```ts
api.registerProvider({
  id: "acme",
  label: "AcmeAI",
  auth: [
    {
      id: "oauth",
      label: "OAuth",
      kind: "oauth",
      run: async (ctx) => {
        // 运行 OAuth 流程并返回身份验证配置文件。
        return {
          profiles: [
            {
              profileId: "acme:default",
              credential: {
                type: "oauth",
                provider: "acme",
                access: "...",
                refresh: "...",
                expires: Date.now() + 3600 * 1000,
              },
            },
          ],
          defaultModel: "acme/opus-1",
        };
      },
    },
  ],
  wizard: {
    setup: {
      choiceId: "acme",
      choiceLabel: "AcmeAI",
      groupId: "acme",
      groupLabel: "AcmeAI",
      methodId: "oauth",
    },
    modelPicker: {
      label: "AcmeAI (custom)",
      hint: "Connect a self-hosted AcmeAI endpoint",
      methodId: "oauth",
    },
  },
  discovery: {
    order: "late",
    run: async () => ({
      provider: {
        baseUrl: "https://acme.example/v1",
        api: "openai-completions",
        apiKey: "${ACME_API_KEY}",
        models: [],
      },
    }),
  },
});
```

注意：

- `run` 接收带有 `prompter`、`runtime`、`openUrl`、`oauth.createVpsAwareHandlers`、`secretInputMode` 和 `allowSecretRefPrompt` 助手/状态的 `ProviderAuthContext`。引导/配置流程可以使用这些来遵守 `--secret-input-mode` 或提供环境/文件/exec secret-ref 捕获，而 `openclaw models auth` 保持更严格的提示表面。
- `runNonInteractive` 接收带有 `opts`、`agentDir`、`resolveApiKey` 和 `toApiKeyCredential` 助手的 `ProviderAuthMethodNonInteractiveContext`，用于无头引导。
- 当您需要添加默认模型或 Provider 配置时，返回 `configPatch`。
- 返回 `defaultModel`，以便 `--set-default` 可以更新 Agent 默认值。
- `wizard.setup` 向引导表面（如 `openclaw onboard` / `openclaw setup --wizard`）添加 Provider 选择。
- `wizard.setup.modelAllowlist` 让 Provider 在引导/配置期间缩小后续模型允许列表提示。
- `wizard.modelPicker` 向模型选择器添加"设置此 Provider"条目。
- `deprecatedProfileIds` 让 Provider 为已退休的身份验证配置文件 ID 拥有 `openclaw doctor` 清理。
- `discovery.run` 返回 `{ provider }`（用于 Plugin 自己的 Provider ID）或 `{ providers }`（用于多 Provider 发现）。
- `discovery.order` 控制 Provider 相对于内置发现阶段的运行时机：`simple`、`profile`、`paired` 或 `late`。
- `onModelSelected` 是 Provider 特定跟进工作（如拉取本地模型）的选择后 Hook。

### 注册消息 Channel

Plugin 可以注册行为类似内置 Channel（WhatsApp、Telegram 等）的 **Channel Plugin**。Channel 配置位于 `channels.<id>` 下，并由您的 Channel Plugin 代码验证。

```ts
const myChannel = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "demo channel plugin.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async () => ({ ok: true }),
  },
};

export default function (api) {
  api.registerChannel({ plugin: myChannel });
}
```

注意：

- 将配置放在 `channels.<id>` 下（不是 `plugins.entries`）。
- `meta.label` 用于 CLI/UI 列表中的标签。
- `meta.aliases` 为规范化和 CLI 输入添加备用 ID。
- `meta.preferOver` 列出当两者都配置时跳过自动启用的 Channel ID。
- `meta.detailLabel` 和 `meta.systemImage` 让 UI 显示更丰富的 Channel 标签/图标。

### Channel 设置 Hook

首选的设置分离：

- `plugin.setup` 负责账户 ID 规范化、验证和配置写入。
- `plugin.setupWizard` 让宿主运行通用向导流程，而 Channel 只提供状态、凭据、DM 允许列表和 Channel 访问描述符。

`plugin.setupWizard` 最适合符合共享模式的 Channel：

- 由 `plugin.config.listAccountIds` 驱动的一个账户选择器
- 提示前的可选预检/准备步骤（例如安装程序/引导工作）
- 内置凭据集的可选环境快捷提示（例如配对的机器人/应用令牌）
- 一个或多个凭据提示，每个步骤通过 `plugin.setup.applyAccountConfig` 或 Channel 拥有的部分补丁写入
- 可选的非机密文本提示（例如 CLI 路径、基础 URL、账户 ID）
- 由宿主解析的可选 Channel/组访问允许列表提示
- 可选的 DM 允许列表解析（例如 `@username` -> 数字 ID）
- 设置完成后的可选完成说明

### 编写新的消息 Channel（分步指南）

当您想要**新的聊天界面**（"消息 Channel"）而不是模型 Provider 时使用此方法。模型 Provider 文档位于 `/providers/*` 下。

1. 选择 ID + 配置形状

- 所有 Channel 配置都位于 `channels.<id>` 下。
- 对于多账户设置，更喜欢 `channels.<id>.accounts.<accountId>`。

2. 定义 Channel 元数据

- `meta.label`、`meta.selectionLabel`、`meta.docsPath`、`meta.blurb` 控制 CLI/UI 列表。
- `meta.docsPath` 应指向像 `/channels/<id>` 这样的文档页面。
- `meta.preferOver` 让 Plugin 替换另一个 Channel（自动启用优先它）。
- `meta.detailLabel` 和 `meta.systemImage` 由 UI 用于详细文本/图标。

3. 实现所需的适配器

- `config.listAccountIds` + `config.resolveAccount`
- `capabilities`（聊天类型、媒体、线程等）
- `outbound.deliveryMode` + `outbound.sendText`（用于基本发送）

4. 根据需要添加可选适配器

- `setup`（验证 + 配置写入）、`setupWizard`（宿主拥有的向导）、`security`（DM 策略）、`status`（健康/诊断）
- `gateway`（启动/停止/登录）、`mentions`、`threading`、`streaming`
- `actions`（消息操作）、`commands`（原生命令行为）

5. 在您的 Plugin 中注册 Channel

- `api.registerChannel({ plugin })`

最小配置示例：

```json5
{
  channels: {
    acmechat: {
      accounts: {
        default: { token: "ACME_TOKEN", enabled: true },
      },
    },
  },
}
```

最小 Channel Plugin（仅出站）：

```ts
const plugin = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "AcmeChat messaging channel.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ text }) => {
      // 在此处将 `text` 传递到您的 Channel
      return { ok: true };
    },
  },
};

export default function (api) {
  api.registerChannel({ plugin });
}
```

加载 Plugin（扩展目录或 `plugins.load.paths`），重启 Gateway，然后在您的配置中配置 `channels.<id>`。

### Agent 工具

参见专门指南：[Plugin Agent 工具](/plugins/agent-tools)。

### 注册 Gateway RPC 方法

```ts
export default function (api) {
  api.registerGatewayMethod("myplugin.status", ({ respond }) => {
    respond(true, { ok: true });
  });
}
```

### 注册 CLI 命令

```ts
export default function (api) {
  api.registerCli(
    ({ program }) => {
      program.command("mycmd").action(() => {
        console.log("Hello");
      });
    },
    { commands: ["mycmd"] },
  );
}
```

### 注册自动回复命令

Plugin 可以注册**无需调用 AI Agent** 即可执行的自定义斜杠命令。这对于切换命令、状态检查或不需要 LLM 处理的快速操作很有用。

```ts
export default function (api) {
  api.registerCommand({
    name: "mystatus",
    description: "Show plugin status",
    handler: (ctx) => ({
      text: `Plugin is running! Channel: ${ctx.channel}`,
    }),
  });
}
```

命令处理程序上下文：

- `senderId`：发送者的 ID（如果可用）
- `channel`：发送命令的 Channel
- `isAuthorizedSender`：发送者是否为授权用户
- `args`：命令后传递的参数（如果 `acceptsArgs: true`）
- `commandBody`：完整的命令文本
- `config`：当前 OpenClaw 配置

命令选项：

- `name`：命令名称（不带前导 `/`）
- `nativeNames`：可选的原生命令别名，用于斜杠/菜单表面。使用 `default` 表示所有原生 Provider，或使用 Provider 特定的键，如 `discord`
- `description`：命令列表中显示的帮助文本
- `acceptsArgs`：命令是否接受参数（默认：false）。如果为 false 并提供参数，则命令不会匹配，消息会传递给其他处理程序
- `requireAuth`：是否需要授权发送者（默认：true）
- `handler`：返回 `{ text: string }` 的函数（可以是异步的）

带授权和参数的示例：

```ts
api.registerCommand({
  name: "setmode",
  description: "Set plugin mode",
  acceptsArgs: true,
  requireAuth: true,
  handler: async (ctx) => {
    const mode = ctx.args?.trim() || "default";
    await saveMode(mode);
    return { text: `Mode set to: ${mode}` };
  },
});
```

注意：

- Plugin 命令在内置命令和 AI Agent **之前**处理
- 命令全局注册并在所有 Channel 上工作
- 命令名称不区分大小写（`/MyStatus` 匹配 `/mystatus`）
- 命令名称必须以字母开头，仅包含字母、数字、连字符和下划线
- 保留的命令名称（如 `help`、`status`、`reset` 等）不能被 Plugin 覆盖
- 跨 Plugin 的重复命令注册将失败并显示诊断错误

### 注册后台服务

```ts
export default function (api) {
  api.registerService({
    id: "my-service",
    start: () => api.logger.info("ready"),
    stop: () => api.logger.info("bye"),
  });
}
```

## 命名约定

- Gateway 方法：`pluginId.action`（示例：`voicecall.status`）
- 工具：`snake_case`（示例：`voice_call`）
- CLI 命令：kebab 或 camel，但避免与核心命令冲突

## Skills

Plugin 可以在仓库中提供 Skill（`skills/<name>/SKILL.md`）。使用 `plugins.entries.<id>.enabled`（或其他配置门控）启用它，并确保它存在于您的工作区/托管 Skills 位置。

## 分发（npm）

推荐的打包：

- 主包：`openclaw`（此仓库）
- Plugin：`@openclaw/*` 下的单独 npm 包（示例：`@openclaw/voice-call`）

发布契约：

- Plugin `package.json` 必须包含带有一个或多个入口文件的 `openclaw.extensions`。
- 可选：`openclaw.setupEntry` 可以指向一个轻量级的仅设置条目，用于禁用或仍未配置的 Channel 设置。
- 入口文件可以是 `.js` 或 `.ts`（jiti 在运行时加载 TS）。
- `openclaw plugins install <npm-spec>` 使用 `npm pack`，提取到 `~/.openclaw/extensions/<id>/`，并在配置中启用它。
- 配置键稳定性：作用域包被规范化为 `plugins.entries.*` 的**无作用域** ID。

## 示例 Plugin：Voice Call

此仓库包含一个语音通话 Plugin（Twilio 或日志回退）：

- 源代码：`extensions/voice-call`
- Skill：`skills/voice-call`
- CLI：`openclaw voicecall start|status`
- 工具：`voice_call`
- RPC：`voicecall.start`、`voicecall.status`
- 配置（twilio）：`provider: "twilio"` + `twilio.accountSid/authToken/from`（可选 `statusCallbackUrl`、`twimlUrl`）
- 配置（dev）：`provider: "log"`（无网络）

参见 [Voice Call](/plugins/voice-call) 和 `extensions/voice-call/README.md` 以获取设置和使用。

## 安全注意事项

Plugin 在 Gateway 进程内运行。将它们视为受信任的代码：

- 仅安装您信任的 Plugin。
- 更喜欢 `plugins.allow` 允许列表。
- 请记住 `plugins.allow` 是基于 ID 的，因此启用的工作区 Plugin 可以有意覆盖具有相同 ID 的内置 Plugin。
- 更改后重启 Gateway。

## 测试 Plugin

Plugin 可以（并且应该）附带测试：

- 仓库内 Plugin 可以在 `src/**` 下保留 Vitest 测试（示例：`src/plugins/voice-call.plugin.test.ts`）。
- 单独发布的 Plugin 应该运行自己的 CI（lint/build/test）并验证 `openclaw.extensions` 指向构建的入口点（`dist/index.js`）。
