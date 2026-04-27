---
mmh3_hash: "af20448f451e3420d0d5633db4a4b982"
summary: "Plugin 清单 + JSON Schema 要求（严格配置验证）"
read_when:
  - 您正在构建 OpenClaw Plugin
  - 您需要提供 Plugin 配置模式或调试 Plugin 验证错误
title: "Plugin 清单"
---

# Plugin 清单（openclaw.plugin.json）

本页仅针对**原生 OpenClaw Plugin 清单**。

对于兼容的 Bundle 布局，请参见 [Plugin Bundle](/plugins/bundles)。

兼容的 Bundle 格式使用不同的清单文件：

- Codex Bundle：`.codex-plugin/plugin.json`
- Claude Bundle：`.claude-plugin/plugin.json` 或默认 Claude 组件布局（无清单）
- Cursor Bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 Bundle 布局，但不会针对此处描述的 `openclaw.plugin.json` 模式对它们进行验证。

对于兼容 Bundle，OpenClaw 目前在布局与 OpenClaw 运行时期望匹配时读取 Bundle 元数据以及声明的 Skill 根、Claude 命令根、Claude Bundle `settings.json` 默认值、Claude Bundle LSP 默认值和支持的 Hook 包。

每个原生 OpenClaw Plugin **必须**在 **Plugin 根目录**中提供 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行 Plugin 代码**的情况下验证配置。缺少或无效的清单被视为 Plugin 错误并阻止配置验证。

请参见完整的 Plugin 系统指南：[Plugins](/tools/plugin)。
原生能力模型和当前外部兼容性指导：[能力模型](/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载 Plugin 代码之前**读取的元数据。以下所有内容必须足够轻量，可以在不启动 Plugin 运行时的情况下检查。

**用于：**

- Plugin 身份标识、配置验证和配置 UI 提示
- 身份验证、入门和设置元数据（别名、自动启用、Provider 环境变量、身份验证选择）
- 控制平面接口的激活提示
- 简写模型系列所有权
- 静态能力所有权快照（`contracts`）
- 共享 `openclaw qa` 主机可以检查的 QA 运行器元数据
- 合并到目录和验证接口中的 Channel 特定配置元数据

**不用于：** 注册运行时行为、声明代码入口点或 npm 安装元数据。这些内容属于您的 Plugin 代码和 `package.json`。

## 最小示例

```json
{
  "id": "voice-call",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

## 丰富示例

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "modelSupport": {
    "modelPrefixes": ["router-"]
  },
  "modelIdNormalization": {
    "providers": {
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  },
  "providerEndpoints": [
    {
      "endpointClass": "openrouter",
      "hostSuffixes": ["openrouter.ai"]
    }
  ],
  "providerRequest": {
    "providers": {
      "openrouter": {
        "family": "openrouter"
      }
    }
  },
  "cliBackends": ["openrouter-cli"],
  "syntheticAuthRefs": ["openrouter-cli"],
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
  },
  "providerAuthAliases": {
    "openrouter-coding": "openrouter"
  },
  "channelEnvVars": {
    "openrouter-chatops": ["OPENROUTER_CHATOPS_TOKEN"]
  },
  "providerAuthChoices": [
    {
      "provider": "openrouter",
      "method": "api-key",
      "choiceId": "openrouter-api-key",
      "choiceLabel": "OpenRouter API key",
      "groupId": "openrouter",
      "groupLabel": "OpenRouter",
      "optionKey": "openrouterApiKey",
      "cliFlag": "--openrouter-api-key",
      "cliOption": "--openrouter-api-key <key>",
      "cliDescription": "OpenRouter API key",
      "onboardingScopes": ["text-inference"]
    }
  ],
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string"
      }
    }
  }
}
```

## 顶级字段参考

| 字段                                | 必需 | 类型                             | 含义                                                                                                                                                                                                                                    |
| ----------------------------------- | ---- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                | 是   | `string`                         | 规范 Plugin id，用于 `plugins.entries.<id>` 中。                                                                                                                                                                                        |
| `configSchema`                      | 是   | `object`                         | 此 Plugin 配置的内联 JSON Schema。                                                                                                                                                                                                      |
| `enabledByDefault`                  | 否   | `true`                           | 将打包 Plugin 标记为默认启用。省略或设置任何非 `true` 值，Plugin 默认禁用。                                                                                                                                                             |
| `legacyPluginIds`                   | 否   | `string[]`                       | 规范化到此规范 Plugin id 的旧版 id。                                                                                                                                                                                                    |
| `autoEnableWhenConfiguredProviders` | 否   | `string[]`                       | 当身份验证、配置或模型引用提到这些 Provider id 时应自动启用此 Plugin 的 Provider id。                                                                                                                                                   |
| `kind`                              | 否   | `"memory"` \| `"context-engine"` | 声明 `plugins.slots.*` 使用的专有 Plugin 类型。                                                                                                                                                                                         |
| `channels`                          | 否   | `string[]`                       | 此 Plugin 拥有的 Channel id，用于发现和配置验证。                                                                                                                                                                                       |
| `providers`                         | 否   | `string[]`                       | 此 Plugin 拥有的 Provider id。                                                                                                                                                                                                          |
| `providerDiscoveryEntry`            | 否   | `string`                         | 轻量级 Provider 发现模块路径（相对于 Plugin 根目录），用于可在不激活完整 Plugin 运行时的情况下加载的清单范围 Provider 目录元数据。                                                                                                       |
| `modelSupport`                      | 否   | `object`                         | 清单拥有的简写模型系列元数据，用于在运行时之前自动加载 Plugin。                                                                                                                                                                         |
| `modelCatalog`                      | 否   | `object`                         | 此 Plugin 拥有 Provider 的声明式模型目录元数据。这是用于未来只读列表、入门、模型选择器、别名和抑制的控制平面契约，无需加载 Plugin 运行时。                                                                                              |
| `modelPricing`                      | 否   | `object`                         | Provider 拥有的外部定价查找策略。用于将本地/自托管 Provider 排除在远程定价目录之外，或将 Provider 引用映射到 OpenRouter/LiteLLM 目录 id，而无需在核心中硬编码 Provider id。                                                             |
| `modelIdNormalization`              | 否   | `object`                         | Provider 拥有的模型 id 别名/前缀清理，必须在 Provider 运行时加载之前运行。                                                                                                                                                              |
| `providerEndpoints`                 | 否   | `object[]`                       | 清单拥有的端点主机/baseUrl 元数据，用于核心在 Provider 运行时加载之前必须分类的 Provider 路由。                                                                                                                                          |
| `providerRequest`                   | 否   | `object`                         | 通用请求策略在 Provider 运行时加载之前使用的廉价 Provider 系列和请求兼容性元数据。                                                                                                                                                      |
| `cliBackends`                       | 否   | `string[]`                       | 此 Plugin 拥有的 CLI 推理后端 id，用于从显式配置引用启动自动激活。                                                                                                                                                                      |
| `syntheticAuthRefs`                 | 否   | `string[]`                       | Provider 或 CLI 后端引用，其 Plugin 拥有的合成身份验证 Hook 应在运行时加载之前的冷模型发现期间被探测。                                                                                                                                  |
| `nonSecretAuthMarkers`              | 否   | `string[]`                       | 打包 Plugin 拥有的占位符 API 密钥值，代表非机密本地、OAuth 或环境凭据状态。                                                                                                                                                             |
| `commandAliases`                    | 否   | `object[]`                       | 此 Plugin 拥有的命令名称，在运行时加载之前应生成 Plugin 感知的配置和 CLI 诊断。                                                                                                                                                         |
| `providerAuthEnvVars`               | 否   | `Record<string, string[]>`       | 已弃用的 Provider 身份验证/状态查找兼容性环境元数据。新 Plugin 优先使用 `setup.providers[].envVars`；OpenClaw 在弃用窗口期间仍然读取此字段。                                                                                            |
| `providerAuthAliases`               | 否   | `Record<string, string>`         | 应重用另一个 Provider id 进行身份验证查找的 Provider id，例如共享基础 Provider API 密钥和身份验证配置文件的编码 Provider。                                                                                                              |
| `channelEnvVars`                    | 否   | `Record<string, string[]>`       | 廉价 Channel 环境元数据，OpenClaw 可以在不加载 Plugin 代码的情况下检查。用于通用启动/配置辅助工具应看到的环境驱动的 Channel 设置或身份验证接口。                                                                                        |
| `providerAuthChoices`               | 否   | `object[]`                       | 用于入门选择器、首选 Provider 解析和简单 CLI 标志连接的廉价身份验证选择元数据。                                                                                                                                                         |
| `activation`                        | 否   | `object`                         | 用于 Provider、命令、Channel、路由和能力触发加载的廉价激活规划器元数据。仅元数据；Plugin 运行时仍然拥有实际行为。                                                                                                                        |
| `setup`                             | 否   | `object`                         | 发现和设置接口在不加载 Plugin 运行时的情况下可以检查的廉价设置/入门描述符。                                                                                                                                                             |
| `qaRunners`                         | 否   | `object[]`                       | 共享 `openclaw qa` 主机在 Plugin 运行时加载之前使用的廉价 QA 运行器描述符。                                                                                                                                                             |
| `contracts`                         | 否   | `object`                         | 用于外部身份验证 Hook、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、Web 抓取、Web 搜索和 Tool 所有权的静态打包能力快照。                                                                                           |
| `mediaUnderstandingProviderMetadata`| 否   | `Record<string, object>`         | 在 `contracts.mediaUnderstandingProviders` 中声明的 Provider id 的廉价媒体理解默认值。                                                                                                                                                  |
| `channelConfigs`                    | 否   | `Record<string, object>`         | 在运行时加载之前合并到发现和验证接口的清单拥有 Channel 配置元数据。                                                                                                                                                                     |
| `skills`                            | 否   | `string[]`                       | 要加载的 Skill 目录，相对于 Plugin 根目录。                                                                                                                                                                                             |
| `name`                              | 否   | `string`                         | 人类可读的 Plugin 名称。                                                                                                                                                                                                                |
| `description`                       | 否   | `string`                         | Plugin 接口中显示的简短摘要。                                                                                                                                                                                                           |
| `version`                           | 否   | `string`                         | 信息性 Plugin 版本。                                                                                                                                                                                                                    |
| `uiHints`                           | 否   | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                                                                                |

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一个入门或身份验证选择。OpenClaw 在 Provider 运行时加载之前读取此内容。Provider 设置列表使用这些清单选择、描述符派生的设置选择和安装目录元数据，而无需加载 Provider 运行时。

| 字段                  | 必需 | 类型                                            | 含义                                                                                                  |
| --------------------- | ---- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                        | 此选择所属的 Provider id。                                                                            |
| `method`              | 是   | `string`                                        | 要分发到的身份验证方法 id。                                                                           |
| `choiceId`            | 是   | `string`                                        | 入门和 CLI 流程使用的稳定身份验证选择 id。                                                            |
| `choiceLabel`         | 否   | `string`                                        | 面向用户的标签。省略时，OpenClaw 回退到 `choiceId`。                                                  |
| `choiceHint`          | 否   | `string`                                        | 选择器的简短辅助文本。                                                                                |
| `assistantPriority`   | 否   | `number`                                        | 较低的值在助手驱动的交互选择器中排序较早。                                                            |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                  | 在助手选择器中隐藏选择，同时仍允许手动 CLI 选择。                                                     |
| `deprecatedChoiceIds` | 否   | `string[]`                                      | 应将用户重定向到此替换选择的旧版选择 id。                                                             |
| `groupId`             | 否   | `string`                                        | 用于分组相关选择的可选组 id。                                                                         |
| `groupLabel`          | 否   | `string`                                        | 该组的面向用户标签。                                                                                  |
| `groupHint`           | 否   | `string`                                        | 该组的简短辅助文本。                                                                                  |
| `optionKey`           | 否   | `string`                                        | 简单单标志身份验证流程的内部选项键。                                                                  |
| `cliFlag`             | 否   | `string`                                        | CLI 标志名称，例如 `--openrouter-api-key`。                                                           |
| `cliOption`           | 否   | `string`                                        | 完整 CLI 选项形状，例如 `--openrouter-api-key <key>`。                                                |
| `cliDescription`      | 否   | `string`                                        | CLI 帮助中使用的描述。                                                                                |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation">` | 此选择应出现在哪些入门接口中。省略时，默认为 `["text-inference"]`。                                   |

## commandAliases 参考

当 Plugin 拥有用户可能错误放在 `plugins.allow` 中或尝试作为根 CLI 命令运行的运行时命令名时，使用 `commandAliases`。OpenClaw 使用此元数据进行诊断，而无需导入 Plugin 运行时代码。

```json
{
  "commandAliases": [
    {
      "name": "dreaming",
      "kind": "runtime-slash",
      "cliCommand": "memory"
    }
  ]
}
```

| 字段          | 必需 | 类型              | 含义                                                          |
| ------------ | ---- | ----------------- | ------------------------------------------------------------- |
| `name`       | 是   | `string`          | 属于此 Plugin 的命令名称。                                    |
| `kind`       | 否   | `"runtime-slash"` | 将别名标记为聊天斜杠命令而不是根 CLI 命令。                   |
| `cliCommand` | 否   | `string`          | 如果存在，用于建议 CLI 操作的相关根 CLI 命令。                |

## activation 参考

当 Plugin 可以廉价地声明哪些控制平面事件应将其包含在激活/加载计划中时，使用 `activation`。

此块是规划器元数据，不是生命周期 API。它不注册运行时行为，不替换 `register(...)`，也不承诺 Plugin 代码已经执行。激活规划器使用这些字段在回退到现有清单所有权元数据（如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 Hook）之前缩小候选 Plugin。

优先使用已描述所有权的最窄元数据。当 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts` 字段表达该关系时，使用它们。将 `activation` 用于那些所有权字段无法表示的额外规划器提示。对于 CLI 运行时别名（如 `claude-cli`、`codex-cli` 或 `google-gemini-cli`），使用顶级 `cliBackends`；`activation.onAgentHarnesses` 仅用于还没有所有权字段的嵌入式 Agent 测试框架 id。

此块仅为元数据。它不注册运行时行为，也不替换 `register(...)`、`setupEntry` 或其他运行时/Plugin 入口点。当前使用者在更广泛的 Plugin 加载之前将其用作缩小提示，因此缺少激活元数据通常只影响性能；在旧版清单所有权回退仍然存在的情况下，不应改变正确性。

```json
{
  "activation": {
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| 字段               | 必需 | 类型                                                 | 含义                                                                                                                                 |
| ------------------ | ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `onProviders`      | 否   | `string[]`                                           | 应将此 Plugin 包含在激活/加载计划中的 Provider id。                                                                                  |
| `onAgentHarnesses` | 否   | `string[]`                                           | 应将此 Plugin 包含在激活/加载计划中的嵌入式 Agent 测试框架运行时 id。对于 CLI 后端别名，使用顶级 `cliBackends`。                      |
| `onCommands`       | 否   | `string[]`                                           | 应将此 Plugin 包含在激活/加载计划中的命令 id。                                                                                       |
| `onChannels`       | 否   | `string[]`                                           | 应将此 Plugin 包含在激活/加载计划中的 Channel id。                                                                                   |
| `onRoutes`         | 否   | `string[]`                                           | 应将此 Plugin 包含在激活/加载计划中的路由类型。                                                                                      |
| `onConfigPaths`    | 否   | `string[]`                                           | 当路径存在且未明确禁用时，应将此 Plugin 包含在启动/加载计划中的根相对配置路径。                                                      |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的广泛能力提示。在可能的情况下优先使用更窄的字段。                                                               |

当前活跃的使用者：

- 命令触发的 CLI 规划回退到旧版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- Agent 运行时启动规划对嵌入式测试框架使用 `activation.onAgentHarnesses`，对 CLI 运行时别名使用顶级 `cliBackends[]`
- Channel 触发的设置/Channel 规划在缺少显式 Channel 激活元数据时回退到旧版 `channels[]` 所有权
- 启动 Plugin 规划对非 Channel 根配置接口（如捆绑浏览器 Plugin 的 `browser` 块）使用 `activation.onConfigPaths`
- Provider 触发的设置/运行时规划在缺少显式 Provider 激活元数据时回退到旧版 `providers[]` 和顶级 `cliBackends[]` 所有权

规划器诊断可以区分显式激活提示和清单所有权回退。例如，`activation-command-hint` 表示 `activation.onCommands` 匹配，而 `manifest-command-alias` 表示规划器改用了 `commandAliases` 所有权。这些原因标签用于主机诊断和测试；Plugin 作者应继续声明最能描述所有权的元数据。

## qaRunners 参考

当 Plugin 在共享 `openclaw qa` 根下贡献一个或多个传输运行器时，使用 `qaRunners`。保持此元数据廉价且静态；Plugin 运行时仍然通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 接口拥有实际 CLI 注册。

```json
{
  "qaRunners": [
    {
      "commandName": "matrix",
      "description": "Run the Docker-backed Matrix live QA lane against a disposable homeserver"
    }
  ]
}
```

| 字段          | 必需 | 类型     | 含义                                                             |
| ------------- | ---- | -------- | ---------------------------------------------------------------- |
| `commandName` | 是   | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。                 |
| `description` | 否   | `string` | 当共享主机需要存根命令时使用的回退帮助文本。                     |

## setup 参考

当设置和入门接口在运行时加载之前需要廉价 Plugin 拥有的元数据时，使用 `setup`。

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

顶级 `cliBackends` 保持有效，并继续描述 CLI 推理后端。`setup.cliBackends` 是应保持仅元数据的控制平面/设置流程的特定于设置的描述符接口。

当存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现的首选描述符优先查找接口。如果描述符仅缩小候选 Plugin，而设置仍然需要更丰富的设置时运行时 Hook，则设置 `requiresRuntime: true` 并将 `setup-api` 保留为回退执行路径。

OpenClaw 还在通用 Provider 身份验证和环境变量查找中包含 `setup.providers[].envVars`。`providerAuthEnvVars` 在弃用窗口期间通过兼容性适配器仍然受支持，但仍然使用它的非打包 Plugin 会收到清单诊断。新 Plugin 应将设置/状态环境元数据放在 `setup.providers[].envVars` 上。

当没有设置条目可用时，或者当 `setup.requiresRuntime: false` 声明设置运行时不必要时，OpenClaw 还可以从 `setup.providers[].authMethods` 派生简单的设置选择。对于自定义标签、CLI 标志、入门范围和助手元数据，显式 `providerAuthChoices` 条目仍然是首选。

仅当这些描述符足以用于设置接口时，才设置 `requiresRuntime: false`。OpenClaw 将显式 `false` 视为仅描述符契约，不会为设置查找执行 `setup-api` 或 `openclaw.setupEntry`。如果仅描述符 Plugin 仍然提供这些设置运行时条目之一，OpenClaw 报告附加诊断并继续忽略它。省略 `requiresRuntime` 保持旧版回退行为，这样添加了描述符但没有该标志的现有 Plugin 不会中断。

由于设置查找可以执行 Plugin 拥有的 `setup-api` 代码，规范化的 `setup.providers[].id` 和 `setup.cliBackends[]` 值必须在已发现 Plugin 中保持唯一。模糊的所有权失败关闭，而不是从发现顺序中选择获胜者。

当设置运行时确实执行时，设置注册表诊断在 `setup-api` 注册了清单描述符未声明的 Provider 或 CLI 后端时，或者描述符没有匹配的运行时注册时，报告描述符漂移。这些诊断是附加的，不拒绝旧版 Plugin。

### setup.providers 参考

| 字段          | 必需 | 类型       | 含义                                                                                  |
| ------------- | ---- | ---------- | ------------------------------------------------------------------------------------- |
| `id`          | 是   | `string`   | 设置或入门期间暴露的 Provider id。保持规范化 id 全局唯一。                            |
| `authMethods` | 否   | `string[]` | 此 Provider 支持的设置/身份验证方法 id，无需加载完整运行时。                          |
| `envVars`     | 否   | `string[]` | Plugin 运行时加载之前通用设置/状态接口可以检查的环境变量。                            |

### setup 字段

| 字段               | 必需 | 类型       | 含义                                                                                         |
| ------------------ | ---- | ---------- | -------------------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 设置和入门期间暴露的 Provider 设置描述符。                                                   |
| `cliBackends`      | 否   | `string[]` | 用于描述符优先设置查找的设置时后端 id。保持规范化 id 全局唯一。                              |
| `configMigrations` | 否   | `string[]` | 此 Plugin 设置接口拥有的配置迁移 id。                                                        |
| `requiresRuntime`  | 否   | `boolean`  | 设置在描述符查找后是否仍然需要 `setup-api` 执行。                                            |

## uiHints 参考

`uiHints` 是从配置字段名到小型渲染提示的映射。

```json
{
  "uiHints": {
    "apiKey": {
      "label": "API key",
      "help": "Used for OpenRouter requests",
      "placeholder": "sk-or-v1-...",
      "sensitive": true
    }
  }
}
```

每个字段提示可以包括：

| 字段          | 类型       | 含义                        |
| ------------- | ---------- | --------------------------- |
| `label`       | `string`   | 面向用户的字段标签。        |
| `help`        | `string`   | 简短辅助文本。              |
| `tags`        | `string[]` | 可选 UI 标签。              |
| `advanced`    | `boolean`  | 将字段标记为高级。          |
| `sensitive`   | `boolean`  | 将字段标记为密钥或敏感。    |
| `placeholder` | `string`   | 表单输入的占位符文本。      |

## contracts 参考

仅将 `contracts` 用于 OpenClaw 可以在不导入 Plugin 运行时的情况下读取的静态能力所有权元数据。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每个列表都是可选的：

| 字段                             | 类型       | 含义                                                                   |
| -------------------------------- | ---------- | ---------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex 应用服务器扩展工厂 id，目前为 `codex-app-server`。               |
| `agentToolResultMiddleware`      | `string[]` | 打包 Plugin 可以为其注册工具结果中间件的运行时 id。                    |
| `externalAuthProviders`          | `string[]` | 此 Plugin 拥有其外部身份验证配置文件 Hook 的 Provider id。             |
| `speechProviders`                | `string[]` | 此 Plugin 拥有的语音 Provider id。                                     |
| `realtimeTranscriptionProviders` | `string[]` | 此 Plugin 拥有的实时转录 Provider id。                                 |
| `realtimeVoiceProviders`         | `string[]` | 此 Plugin 拥有的实时语音 Provider id。                                 |
| `memoryEmbeddingProviders`       | `string[]` | 此 Plugin 拥有的内存嵌入 Provider id。                                 |
| `mediaUnderstandingProviders`    | `string[]` | 此 Plugin 拥有的媒体理解 Provider id。                                 |
| `imageGenerationProviders`       | `string[]` | 此 Plugin 拥有的图像生成 Provider id。                                 |
| `videoGenerationProviders`       | `string[]` | 此 Plugin 拥有的视频生成 Provider id。                                 |
| `webFetchProviders`              | `string[]` | 此 Plugin 拥有的 Web 抓取 Provider id。                                |
| `webSearchProviders`             | `string[]` | 此 Plugin 拥有的 Web 搜索 Provider id。                                |
| `migrationProviders`             | `string[]` | 此 Plugin 拥有的用于 `openclaw migrate` 的导入 Provider id。           |
| `tools`                          | `string[]` | 此 Plugin 拥有的 Agent Tool 名称，用于打包契约检查。                   |

`contracts.embeddedExtensionFactories` 保留用于打包的 Codex 应用服务器专用扩展工厂。打包的工具结果转换应声明 `contracts.agentToolResultMiddleware` 并用 `api.registerAgentToolResultMiddleware(...)` 注册。外部 Plugin 无法注册工具结果中间件，因为该接缝可以在模型看到输出之前重写高信任工具输出。

实现 `resolveExternalAuthProfiles` 的 Provider Plugin 应声明 `contracts.externalAuthProviders`。没有声明的 Plugin 仍然通过已弃用的兼容性回退运行，但该回退更慢，将在迁移窗口后被移除。

打包内存嵌入 Provider 应为其暴露的每个适配器 id 声明 `contracts.memoryEmbeddingProviders`，包括内置适配器（如 `local`）。独立 CLI 路径使用此清单契约在完整 Gateway 运行时注册 Provider 之前只加载拥有的 Plugin。

## mediaUnderstandingProviderMetadata 参考

当媒体理解 Provider 具有通用核心辅助工具在运行时加载之前需要的默认模型、自动身份验证回退优先级或原生文档支持时，使用 `mediaUnderstandingProviderMetadata`。键还必须在 `contracts.mediaUnderstandingProviders` 中声明。

```json
{
  "contracts": {
    "mediaUnderstandingProviders": ["example"]
  },
  "mediaUnderstandingProviderMetadata": {
    "example": {
      "capabilities": ["image", "audio"],
      "defaultModels": {
        "image": "example-vision-latest",
        "audio": "example-transcribe-latest"
      },
      "autoPriority": {
        "image": 40
      },
      "nativeDocumentInputs": ["pdf"]
    }
  }
}
```

每个 Provider 条目可以包括：

| 字段                  | 类型                                | 含义                                                                          |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此 Provider 暴露的媒体能力。                                                  |
| `defaultModels`        | `Record<string, string>`            | 当配置未指定模型时使用的能力到模型默认值。                                    |
| `autoPriority`         | `Record<string, number>`            | 较小的数字在基于凭据的自动 Provider 回退中排序较早。                          |
| `nativeDocumentInputs` | `"pdf"[]`                           | Provider 支持的原生文档输入。                                                 |

## channelConfigs 参考

当 Channel Plugin 在运行时加载之前需要廉价配置元数据时，使用 `channelConfigs`。只读 Channel 设置/状态发现可以在没有设置条目可用时，或者当 `setup.requiresRuntime: false` 声明设置运行时不必要时，直接使用此元数据用于已配置的外部 Channel。

`channelConfigs` 是 Plugin 清单元数据，不是新的顶级用户配置部分。用户仍然在 `channels.<channel-id>` 下配置 Channel 实例。OpenClaw 读取清单元数据以决定在 Plugin 运行时代码执行之前哪个 Plugin 拥有该已配置的 Channel。

对于 Channel Plugin，`configSchema` 和 `channelConfigs` 描述不同的路径：

- `configSchema` 验证 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 验证 `channels.<channel-id>`

声明了 `channels[]` 的非打包 Plugin 也应声明匹配的 `channelConfigs` 条目。没有它们，OpenClaw 仍然可以加载 Plugin，但冷路径配置模式、设置和控制 UI 接口在 Plugin 运行时执行之前无法知道 Channel 拥有的选项形状。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以为在 Channel 运行时加载之前运行的命令配置检查声明静态 `auto` 默认值。打包 Channel 还可以通过 `package.json#openclaw.channel.commands` 发布相同的默认值，以及其他包拥有的 Channel 目录元数据。

```json
{
  "channelConfigs": {
    "matrix": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "homeserverUrl": { "type": "string" }
        }
      },
      "uiHints": {
        "homeserverUrl": {
          "label": "Homeserver URL",
          "placeholder": "https://matrix.example.com"
        }
      },
      "label": "Matrix",
      "description": "Matrix homeserver connection",
      "commands": {
        "nativeCommandsAutoEnabled": true,
        "nativeSkillsAutoEnabled": true
      },
      "preferOver": ["matrix-legacy"]
    }
  }
}
```

每个 Channel 条目可以包括：

| 字段          | 类型                     | 含义                                                                                    |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个声明的 Channel 配置条目必需。                       |
| `uiHints`     | `Record<string, object>` | 该 Channel 配置部分的可选 UI 标签/占位符/敏感性提示。                                   |
| `label`       | `string`                 | 当运行时元数据尚未准备好时合并到选择器和检查接口中的 Channel 标签。                     |
| `description` | `string`                 | 用于检查和目录接口的简短 Channel 描述。                                                 |
| `commands`    | `object`                 | 用于运行时前配置检查的静态原生命令和原生 Skill 自动默认值。                             |
| `preferOver`  | `string[]`               | 此 Channel 在选择接口中应优先于的旧版或较低优先级 Plugin id。                           |

### 替换另一个 Channel Plugin

当您的 Plugin 是另一个 Plugin 也可以提供的 Channel id 的首选所有者时，使用 `preferOver`。常见情况是重命名的 Plugin id、取代打包 Plugin 的独立 Plugin，或保持相同 Channel id 以实现配置兼容性的维护分支。

```json
{
  "id": "acme-chat",
  "channels": ["chat"],
  "channelConfigs": {
    "chat": {
      "schema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "webhookUrl": { "type": "string" }
        }
      },
      "preferOver": ["chat"]
    }
  }
}
```

当配置了 `channels.chat` 时，OpenClaw 同时考虑 Channel id 和首选 Plugin id。如果较低优先级的 Plugin 仅因为它是打包的或默认启用而被选择，OpenClaw 在有效运行时配置中禁用它，这样一个 Plugin 拥有该 Channel 及其工具。显式用户选择仍然获胜：如果用户显式启用了两个 Plugin，OpenClaw 保留该选择并报告重复的 Channel/Tool 诊断，而不是静默更改请求的 Plugin 集。

将 `preferOver` 的范围限制在真正可以提供相同 Channel 的 Plugin id。它不是通用优先级字段，也不重命名用户配置键。

## modelSupport 参考

当 OpenClaw 应该在 Plugin 运行时加载之前从简写模型 id（如 `gpt-5.5` 或 `claude-sonnet-4.6`）推断您的 Provider Plugin 时，使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 应用此优先级：

- 显式的 `provider/model` 引用使用拥有 `providers` 清单元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非打包 Plugin 和一个打包 Plugin 都匹配，非打包 Plugin 获胜
- 剩余的歧义将被忽略，直到用户或配置指定 Provider

字段：

| 字段             | 类型       | 含义                                                                    |
| ---------------- | ---------- | ----------------------------------------------------------------------- |
| `modelPrefixes`  | `string[]` | 针对简写模型 id 使用 `startsWith` 匹配的前缀。                          |
| `modelPatterns`  | `string[]` | 在配置文件后缀删除后针对简写模型 id 匹配的正则表达式源。                |

## modelCatalog 参考

当 OpenClaw 应该在加载 Plugin 运行时之前了解 Provider 模型元数据时，使用 `modelCatalog`。这是固定目录行、Provider 别名、抑制规则和发现模式的清单拥有来源。运行时刷新仍然属于 Provider 运行时代码，但清单告诉核心何时需要运行时。

```json
{
  "providers": ["openai"],
  "modelCatalog": {
    "providers": {
      "openai": {
        "baseUrl": "https://api.openai.com/v1",
        "api": "openai-responses",
        "models": [
          {
            "id": "gpt-5.4",
            "name": "GPT-5.4",
            "input": ["text", "image"],
            "reasoning": true,
            "contextWindow": 256000,
            "maxTokens": 128000,
            "cost": {
              "input": 1.25,
              "output": 10,
              "cacheRead": 0.125
            },
            "status": "available",
            "tags": ["default"]
          }
        ]
      }
    },
    "aliases": {
      "azure-openai-responses": {
        "provider": "openai",
        "api": "azure-openai-responses"
      }
    },
    "suppressions": [
      {
        "provider": "azure-openai-responses",
        "model": "gpt-5.3-codex-spark",
        "reason": "not available on Azure OpenAI Responses"
      }
    ],
    "discovery": {
      "openai": "static"
    }
  }
}
```

顶级字段：

| 字段          | 类型                                                     | 含义                                                                                                        |
| -------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `providers`    | `Record<string, object>`                                 | 此 Plugin 拥有的 Provider id 的目录行。键也应出现在顶级 `providers` 中。                                    |
| `aliases`      | `Record<string, object>`                                 | 应解析为拥有 Provider 用于目录或抑制规划的 Provider 别名。                                                  |
| `suppressions` | `object[]`                                               | 此 Plugin 为 Provider 特定原因抑制的来自另一来源的模型行。                                                  |
| `discovery`    | `Record<string, "static" \| "refreshable" \| "runtime">` | Provider 目录是否可以从清单元数据读取、刷新到缓存或需要运行时。                                             |

Provider 字段：

| 字段     | 类型                     | 含义                                                          |
| --------- | ------------------------ | ------------------------------------------------------------- |
| `baseUrl` | `string`                 | 此 Provider 目录中模型的可选默认基础 URL。                    |
| `api`     | `ModelApi`               | 此 Provider 目录中模型的可选默认 API 适配器。                 |
| `headers` | `Record<string, string>` | 适用于此 Provider 目录的可选静态头部。                        |
| `models`  | `object[]`               | 必需的模型行。没有 `id` 的行被忽略。                          |

模型字段：

| 字段           | 类型                                                           | 含义                                                                          |
| --------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`            | `string`                                                       | Provider 本地模型 id，不带 `provider/` 前缀。                                 |
| `name`          | `string`                                                       | 可选显示名称。                                                                |
| `api`           | `ModelApi`                                                     | 可选每模型 API 覆盖。                                                         |
| `baseUrl`       | `string`                                                       | 可选每模型基础 URL 覆盖。                                                     |
| `headers`       | `Record<string, string>`                                       | 可选每模型静态头部。                                                          |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模态。                                                              |
| `reasoning`     | `boolean`                                                      | 模型是否暴露推理行为。                                                        |
| `contextWindow` | `number`                                                       | 原生 Provider 上下文窗口。                                                    |
| `contextTokens` | `number`                                                       | 与 `contextWindow` 不同时的可选有效运行时上下文上限。                         |
| `maxTokens`     | `number`                                                       | 已知时的最大输出 Token 数。                                                   |
| `cost`          | `object`                                                       | 可选的 USD/百万 Token 定价，包括可选的 `tieredPricing`。                      |
| `compat`        | `object`                                                       | 与 OpenClaw 模型配置兼容性匹配的可选兼容性标志。                              |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表状态。仅在行根本不应出现时才抑制。                                        |
| `statusReason`  | `string`                                                       | 非可用状态显示的可选原因。                                                    |
| `replaces`      | `string[]`                                                     | 此模型取代的旧版 Provider 本地模型 id。                                       |
| `replacedBy`    | `string`                                                       | 已弃用行的替换 Provider 本地模型 id。                                         |
| `tags`          | `string[]`                                                     | 选择器和过滤器使用的稳定标签。                                                |

不要将仅运行时数据放在 `modelCatalog` 中。如果 Provider 需要账户状态、API 请求或本地进程发现来了解完整的模型集，在 `discovery` 中将该 Provider 声明为 `refreshable` 或 `runtime`。

## modelIdNormalization 参考

对于必须在 Provider 运行时加载之前发生的廉价 Provider 拥有的模型 id 清理，使用 `modelIdNormalization`。这将短模型名、Provider 本地旧版 id 和代理前缀规则等别名保留在拥有的 Plugin 清单中，而不是核心模型选择表中。

```json
{
  "providers": ["anthropic", "openrouter"],
  "modelIdNormalization": {
    "providers": {
      "anthropic": {
        "aliases": {
          "sonnet-4.6": "claude-sonnet-4-6"
        }
      },
      "openrouter": {
        "prefixWhenBare": "openrouter"
      }
    }
  }
}
```

Provider 字段：

| 字段                                | 类型                    | 含义                                                                                   |
| ------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不区分大小写的精确模型 id 别名。值按原样返回。                                         |
| `stripPrefixes`                      | `string[]`              | 在别名查找之前删除的前缀，用于旧版 Provider/模型重复。                                 |
| `prefixWhenBare`                     | `string`                | 当规范化的模型 id 尚不包含 `/` 时添加的前缀。                                          |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 别名查找后的条件裸 id 前缀规则，以 `modelPrefix` 和 `prefix` 为键。                    |

## providerEndpoints 参考

对于通用请求策略在 Provider 运行时加载之前必须了解的端点分类，使用 `providerEndpoints`。核心仍然拥有每个 `endpointClass` 的含义；Plugin 清单拥有主机和基础 URL 元数据。

端点字段：

| 字段                          | 类型       | 含义                                                                                             |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------------------ |
| `endpointClass`                | `string`   | 已知的核心端点类，如 `openrouter`、`moonshot-native` 或 `google-vertex`。                        |
| `hosts`                        | `string[]` | 映射到端点类的精确主机名。                                                                       |
| `hostSuffixes`                 | `string[]` | 映射到端点类的主机后缀。以 `.` 为前缀仅用于域后缀匹配。                                          |
| `baseUrls`                     | `string[]` | 映射到端点类的精确规范化 HTTP(S) 基础 URL。                                                      |
| `googleVertexRegion`           | `string`   | 精确全局主机的静态 Google Vertex 区域。                                                          |
| `googleVertexRegionHostSuffix` | `string`   | 从匹配主机中删除以暴露 Google Vertex 区域前缀的后缀。                                            |

## providerRequest 参考

对于通用请求策略在不加载 Provider 运行时的情况下需要的廉价请求兼容性元数据，使用 `providerRequest`。将行为特定的有效载荷重写保留在 Provider 运行时 Hook 或共享 Provider 系列辅助工具中。

```json
{
  "providers": ["vllm"],
  "providerRequest": {
    "providers": {
      "vllm": {
        "family": "vllm",
        "openAICompletions": {
          "supportsStreamingUsage": true
        }
      }
    }
  }
}
```

Provider 字段：

| 字段                 | 类型         | 含义                                                                              |
| --------------------- | ------------ | --------------------------------------------------------------------------------- |
| `family`              | `string`     | 通用请求兼容性决策和诊断使用的 Provider 系列标签。                                |
| `compatibilityFamily` | `"moonshot"` | 共享请求辅助工具的可选 Provider 系列兼容性桶。                                    |
| `openAICompletions`   | `object`     | OpenAI 兼容的 completions 请求标志，目前为 `supportsStreamingUsage`。             |

## modelPricing 参考

当 Provider 在运行时加载之前需要控制平面定价行为时，使用 `modelPricing`。Gateway 定价缓存在不导入 Provider 运行时代码的情况下读取此元数据。

```json
{
  "providers": ["ollama", "openrouter"],
  "modelPricing": {
    "providers": {
      "ollama": {
        "external": false
      },
      "openrouter": {
        "openRouter": {
          "passthroughProviderModel": true
        },
        "liteLLM": false
      }
    }
  }
}
```

Provider 字段：

| 字段        | 类型              | 含义                                                                                             |
| ------------ | ----------------- | ------------------------------------------------------------------------------------------------ |
| `external`   | `boolean`         | 对于永远不应获取 OpenRouter 或 LiteLLM 定价的本地/自托管 Provider，设置为 `false`。             |
| `openRouter` | `false \| object` | OpenRouter 定价查找映射。`false` 禁用此 Provider 的 OpenRouter 查找。                           |
| `liteLLM`    | `false \| object` | LiteLLM 定价查找映射。`false` 禁用此 Provider 的 LiteLLM 查找。                                 |

来源字段：

| 字段                      | 类型               | 含义                                                                                                                    |
| -------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 与 OpenClaw Provider id 不同时的外部目录 Provider id，例如 `zai` Provider 的 `z-ai`。                                   |
| `passthroughProviderModel` | `boolean`          | 将包含斜杠的模型 id 视为嵌套的 provider/model 引用，适用于 OpenRouter 等代理 Provider。                                 |
| `modelIdTransforms`        | `"version-dots"[]` | 额外的外部目录模型 id 变体。`version-dots` 尝试像 `claude-opus-4.6` 这样的带点版本 id。                                 |

### OpenClaw Provider Index

OpenClaw Provider Index 是 OpenClaw 拥有的预览元数据，用于可能尚未安装 Plugin 的 Provider。它不是 Plugin 清单的一部分。Plugin 清单仍然是已安装 Plugin 的权威。Provider Index 是未来可安装 Provider 和预安装模型选择器接口在 Provider Plugin 未安装时将消费的内部回退契约。

目录权威顺序：

1. 用户配置。
2. 已安装 Plugin 清单 `modelCatalog`。
3. 从显式刷新的模型目录缓存。
4. OpenClaw Provider Index 预览行。

Provider Index 不得包含密钥、启用状态、运行时 Hook 或实时账户特定模型数据。其预览目录使用与 Plugin 清单相同的 `modelCatalog` Provider 行形状，但应限于稳定的显示元数据，除非运行时适配器字段（如 `api`、`baseUrl`、定价或兼容性标志）有意与已安装 Plugin 清单保持一致。具有实时 `/models` 发现的 Provider 应通过显式模型目录缓存路径写入刷新的行，而不是让正常列表或入门调用 Provider API。

Provider Index 条目还可以携带可安装 Plugin 元数据，用于其 Plugin 已移出核心或尚未安装的 Provider。此元数据镜像 Channel 目录模式：包名、npm 安装规格、预期完整性和廉价身份验证选择标签足以显示可安装的设置选项。一旦 Plugin 安装完成，其清单获胜，该 Provider 的 Provider Index 条目将被忽略。

旧版顶级能力键已弃用。使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移到 `contracts` 下；普通清单加载不再将这些顶级字段视为能力所有权。

## 清单与 package.json

这两个文件服务于不同的目的：

| 文件                   | 用途                                                                                                                                   |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 在 Plugin 代码运行之前必须存在的发现、配置验证、身份验证选择元数据和 UI 提示                                                           |
| `package.json`         | npm 元数据、依赖项安装以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 块                                                       |

如果您不确定某段元数据属于哪里，使用以下规则：

- 如果 OpenClaw 必须在加载 Plugin 代码之前知道它，将其放在 `openclaw.plugin.json` 中
- 如果它关于打包、入口文件或 npm 安装行为，将其放在 `package.json` 中

### 影响发现的 package.json 字段

某些预运行时 Plugin 元数据有意放在 `package.json` 的 `openclaw` 块下，而不是 `openclaw.plugin.json` 中。

重要示例：

| 字段                                                              | 含义                                                                                                                                          |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | 声明原生 Plugin 入口点。必须保留在 Plugin 包目录内。                                                                                          |
| `openclaw.runtimeExtensions`                                      | 声明已安装包的内置 JavaScript 运行时入口点。必须保留在 Plugin 包目录内。                                                                      |
| `openclaw.setupEntry`                                             | 在入门、延迟 Channel 启动和只读 Channel 状态/SecretRef 发现期间使用的轻量级仅设置入口点。必须保留在 Plugin 包目录内。                         |
| `openclaw.runtimeSetupEntry`                                      | 声明已安装包的内置 JavaScript 设置入口点。必须保留在 Plugin 包目录内。                                                                        |
| `openclaw.channel`                                                | 廉价 Channel 目录元数据，如标签、文档路径、别名和选择副本。                                                                                   |
| `openclaw.channel.commands`                                       | 在 Channel 运行时加载之前，配置、审计和命令列表接口使用的静态原生命令和原生 Skill 自动默认元数据。                                            |
| `openclaw.channel.configuredState`                                | 轻量级已配置状态检查器元数据，可以在不加载完整 Channel 运行时的情况下回答"是否已存在仅环境设置？"                                            |
| `openclaw.channel.persistedAuthState`                             | 轻量级持久化身份验证状态检查器元数据，可以在不加载完整 Channel 运行时的情况下回答"是否有任何已登录内容？"                                     |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 打包和外部发布 Plugin 的安装/更新提示。                                                                                                       |
| `openclaw.install.defaultChoice`                                  | 当多个安装来源可用时的首选安装路径。                                                                                                          |
| `openclaw.install.minHostVersion`                                 | 最低支持的 OpenClaw 主机版本，使用类似 `>=2026.3.22` 的 semver 下限。                                                                         |
| `openclaw.install.expectedIntegrity`                              | 预期的 npm dist 完整性字符串，如 `sha512-...`；安装和更新流程将获取的工件与其进行验证。                                                       |
| `openclaw.install.allowInvalidConfigRecovery`                     | 允许在配置无效时采用窄的打包 Plugin 重新安装恢复路径。                                                                                        |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 让仅设置的 Channel 接口在启动期间在完整 Channel Plugin 之前加载。                                                                             |

清单元数据决定在运行时加载之前哪些 Provider/Channel/设置选择出现在入门中。`package.json#openclaw.install` 告诉入门在用户选择其中一个选择时如何获取或启用该 Plugin。不要将安装提示移到 `openclaw.plugin.json` 中。

`openclaw.install.minHostVersion` 在安装和清单注册表加载期间强制执行。无效值被拒绝；较新但有效的值会跳过旧主机上的 Plugin。

精确的 npm 版本锁定已存在于 `npmSpec` 中，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确规格与 `expectedIntegrity` 配对，以便获取的 npm 工件不再匹配锁定版本时更新流程失败关闭。交互式入门仍然提供受信任的注册表 npm 规格（包括裸包名和 dist 标签），以保持兼容性。目录诊断可以区分精确、浮动、完整性锁定、缺少完整性、包名不匹配和无效默认选择来源。它们还会在 `expectedIntegrity` 存在但没有有效 npm 来源可以锁定时发出警告。当 `expectedIntegrity` 存在时，安装/更新流程强制执行它；当省略时，注册表解析在没有完整性锁定的情况下被记录。

Channel Plugin 应在状态、Channel 列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别已配置账户时提供 `openclaw.setupEntry`。设置条目应暴露 Channel 元数据以及设置安全的配置、状态和密钥适配器；将网络客户端、Gateway 监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不覆盖源入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 无法使转义的 `openclaw.extensions` 路径可加载。

`openclaw.install.allowInvalidConfigRecovery` 是有意设计的窄范围。它不会使任意损坏的配置可安装。目前它只允许安装流程从特定的陈旧打包 Plugin 升级失败中恢复，例如缺少打包 Plugin 路径或同一打包 Plugin 的陈旧 `channels.<id>` 条目。不相关的配置错误仍然会阻止安装，并将操作员发送到 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是一个微小检查器模块的包元数据：

```json
{
  "openclaw": {
    "channel": {
      "id": "whatsapp",
      "persistedAuthState": {
        "specifier": "./auth-presence",
        "exportName": "hasAnyWhatsAppAuth"
      }
    }
  }
}
```

当设置、doctor 或已配置状态流程需要廉价的是/否身份验证探测（在完整 Channel Plugin 加载之前）时使用它。目标导出应该是一个只读取持久化状态的小函数；不要通过完整 Channel 运行时 barrel 路由它。

`openclaw.channel.configuredState` 遵循相同的形状用于廉价的仅环境已配置检查：

```json
{
  "openclaw": {
    "channel": {
      "id": "telegram",
      "configuredState": {
        "specifier": "./configured-state",
        "exportName": "hasTelegramConfiguredState"
      }
    }
  }
}
```

当 Channel 可以从环境或其他微小非运行时输入回答已配置状态时使用它。如果检查需要完整配置解析或真正的 Channel 运行时，请改为将该逻辑保留在 Plugin `config.hasConfiguredState` Hook 中。

## 发现优先级（重复 Plugin id）

OpenClaw 从多个根发现 Plugin（打包的、全局安装的、工作区的、显式配置选择的路径）。如果两个发现共享相同的 `id`，只保留**最高优先级**的清单；较低优先级的重复项被丢弃，而不是在其旁边加载。

优先级从高到低：

1. **配置选择** — 在 `plugins.entries.<id>` 中显式锁定的路径
2. **打包** — 与 OpenClaw 一起提供的 Plugin
3. **全局安装** — 安装到全局 OpenClaw Plugin 根目录的 Plugin
4. **工作区** — 相对于当前工作区发现的 Plugin

影响：

- 工作区中打包 Plugin 的分支或陈旧副本不会遮蔽打包构建。
- 要真正用本地 Plugin 覆盖打包 Plugin，请通过 `plugins.entries.<id>` 锁定它，使其按优先级获胜，而不是依赖工作区发现。
- 重复丢弃会被记录，因此 Doctor 和启动诊断可以指向被丢弃的副本。

## JSON Schema 要求

- **每个 Plugin 都必须提供 JSON Schema**，即使它不接受配置。
- 空模式是可接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 在配置读/写时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非 Channel id 由 Plugin 清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的** Plugin id。未知 id 是**错误**。
- 如果 Plugin 已安装但清单或模式损坏或缺失，验证失败，Doctor 报告 Plugin 错误。
- 如果 Plugin 配置存在但 Plugin **已禁用**，配置将保留，并在 Doctor + 日志中显示**警告**。

完整的 `plugins.*` 模式请参见 [配置参考](/gateway/configuration)。

## 注意事项

- 清单对**原生 OpenClaw Plugin 都是必需的**，包括本地文件系统加载。运行时仍然单独加载 Plugin 模块；清单仅用于发现 + 验证。
- 原生清单使用 JSON5 解析，因此只要最终值仍然是对象，注释、尾随逗号和不带引号的键都是允许的。
- 清单加载器只读取已记录的清单字段。避免自定义顶级键。
- `channels`、`providers`、`cliBackends` 和 `skills` 在 Plugin 不需要它们时都可以省略。
- `providerDiscoveryEntry` 必须保持轻量级，不应导入广泛的运行时代码；将其用于静态 Provider 目录元数据或窄发现描述符，而不是请求时执行。
- 专属 Plugin 类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory`，`kind: "context-engine"` 通过 `plugins.slots.contextEngine`（默认 `legacy`）。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅是声明性的。状态、审计、Cron 投递验证和其他只读接口在将环境变量视为已配置之前仍然应用 Plugin 信任和有效激活策略。
- 关于需要 Provider 代码的运行时向导元数据，请参见 [Provider 运行时 Hook](/plugins/architecture-internals#provider-runtime-hooks)。
- 如果您的 Plugin 依赖于本机模块，请记录构建步骤和任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相关

<CardGroup cols={3}>
  <Card title="构建 Plugin" href="/plugins/building-plugins" icon="rocket">
    Plugin 入门指南。
  </Card>
  <Card title="Plugin 架构" href="/plugins/architecture" icon="diagram-project">
    内部架构和能力模型。
  </Card>
  <Card title="SDK 概览" href="/plugins/sdk-overview" icon="book">
    Plugin SDK 参考和子路径导入。
  </Card>
</CardGroup>
