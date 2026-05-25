---
mmh3_hash: "6b08b217ca5763c4f1e388fb0dbd2db2"
summary: "Plugin Manifest + JSON Schema 要求（严格配置验证）"
read_when:
  - 您正在构建 OpenClaw Plugin
  - 您需要发布 Plugin 配置 Schema 或调试 Plugin 验证错误
title: "Plugin Manifest"
---

本页面仅针对**原生 OpenClaw Plugin Manifest**。

有关兼容的 Bundle 布局，请参见 [Plugin Bundle](/plugins/bundles)。

兼容的 Bundle 格式使用不同的 Manifest 文件：

- Codex Bundle：`.codex-plugin/plugin.json`
- Claude Bundle：`.claude-plugin/plugin.json` 或不带 Manifest 的默认 Claude 组件布局
- Cursor Bundle：`.cursor-plugin/plugin.json`

OpenClaw 也自动检测这些 Bundle 布局，但不会针对此处描述的 `openclaw.plugin.json` Schema 进行验证。

对于兼容的 Bundle，OpenClaw 目前读取 Bundle 元数据加上已声明的 Skill 根、Claude 命令根、Claude Bundle `settings.json` 默认值、Claude Bundle LSP 默认值，以及当布局匹配 OpenClaw 运行时预期时支持的 Hook Pack。

每个原生 OpenClaw Plugin **必须**在 **Plugin 根目录**中附带 `openclaw.plugin.json` 文件。OpenClaw 使用此 Manifest **在不执行 Plugin 代码的情况下**验证配置。缺失或无效的 Manifest 被视为 Plugin 错误，会阻止配置验证。

有关完整的 Plugin 系统指南，请参见：[Plugin](/tools/plugin)。
有关原生能力模型和当前外部兼容性指南：[能力模型](/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在**加载您的 Plugin 代码之前**读取的元数据。以下所有内容都必须足够轻量，可以在不启动 Plugin 运行时的情况下检查。

**使用它用于：**

- Plugin 标识、配置验证和配置 UI 提示
- 身份验证、入门和设置元数据（别名、自动启用、Provider 环境变量、身份验证选项）
- 控制平面界面的激活提示
- 速记模型族所有权
- 静态能力所有权快照（`contracts`）
- 共享 `openclaw qa` 主机可以检查的 QA 运行器元数据
- 合并到目录和验证界面的 Channel 特定配置元数据

**不要用它来：**注册运行时行为、声明代码入口点或 npm 安装元数据。这些属于您的 Plugin 代码和 `package.json`。

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

## 顶层字段参考

| 字段                                 | 必填 | 类型                             | 含义                                                                                                                                                                                                                               |
| ------------------------------------ | ---- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                 | 是   | `string`                         | 规范 Plugin ID。这是在 `plugins.entries.<id>` 中使用的 ID。                                                                                                                                                                          |
| `configSchema`                       | 是   | `object`                         | 此 Plugin 配置的内联 JSON Schema。                                                                                                                                                                                                   |
| `enabledByDefault`                   | 否   | `true`                           | 将捆绑 Plugin 标记为默认启用。省略它，或设置任何非 `true` 的值，可保持 Plugin 默认禁用。                                                                                                                                              |
| `enabledByDefaultOnPlatforms`        | 否   | `string[]`                       | 仅在列出的 Node.js 平台上将捆绑 Plugin 标记为默认启用，例如 `["darwin"]`。显式配置仍然优先。                                                                                                                                         |
| `legacyPluginIds`                    | 否   | `string[]`                       | 标准化为此规范 Plugin ID 的旧版 ID。                                                                                                                                                                                                 |
| `autoEnableWhenConfiguredProviders`  | 否   | `string[]`                       | 当身份验证、配置或模型引用提及这些 Provider ID 时，应自动启用此 Plugin 的 Provider ID。                                                                                                                                               |
| `kind`                               | 否   | `"memory"` \| `"context-engine"` | 声明 `plugins.slots.*` 使用的独占 Plugin 类型。                                                                                                                                                                                     |
| `channels`                           | 否   | `string[]`                       | 此 Plugin 拥有的 Channel ID。用于发现和配置验证。                                                                                                                                                                                   |
| `providers`                          | 否   | `string[]`                       | 此 Plugin 拥有的 Provider ID。                                                                                                                                                                                                      |
| `providerCatalogEntry`               | 否   | `string`                         | 相对于 Plugin 根目录的轻量级 Provider 目录模块路径，用于可在不激活完整 Plugin 运行时的情况下加载的 Manifest 范围 Provider 目录元数据。                                                                                                |
| `modelSupport`                       | 否   | `object`                         | Manifest 拥有的速记模型族元数据，用于在运行时之前自动加载 Plugin。                                                                                                                                                                   |
| `modelCatalog`                       | 否   | `object`                         | 此 Plugin 拥有的 Provider 的声明式模型目录元数据。这是未来只读列表、入门、模型选择器、别名和抑制的控制平面契约，无需加载 Plugin 运行时。                                                                                               |
| `modelPricing`                       | 否   | `object`                         | Provider 拥有的外部定价查询策略。用于将本地/自托管 Provider 排除在远程定价目录之外，或将 Provider 引用映射到 OpenRouter/LiteLLM 目录 ID，而无需在核心中硬编码 Provider ID。                                                          |
| `modelIdNormalization`               | 否   | `object`                         | Provider 拥有的模型 ID 别名/前缀清理，必须在 Provider 运行时加载之前运行。                                                                                                                                                          |
| `providerEndpoints`                  | 否   | `object[]`                       | Manifest 拥有的端点主机/baseUrl 元数据，用于核心在 Provider 运行时加载之前必须分类的 Provider 路由。                                                                                                                                 |
| `providerRequest`                    | 否   | `object`                         | 泛型请求策略在 Provider 运行时加载之前使用的廉价 Provider 族和请求兼容性元数据。                                                                                                                                                    |
| `cliBackends`                        | 否   | `string[]`                       | 此 Plugin 拥有的 CLI 推理后端 ID。用于从显式配置引用进行启动自动激活。                                                                                                                                                               |
| `syntheticAuthRefs`                  | 否   | `string[]`                       | 在运行时加载之前，应在冷模型发现期间探测 Plugin 拥有的合成身份验证 Hook 的 Provider 或 CLI 后端引用。                                                                                                                                 |
| `nonSecretAuthMarkers`               | 否   | `string[]`                       | 表示非密钥本地、OAuth 或环境凭据状态的捆绑 Plugin 拥有的占位符 API 密钥值。                                                                                                                                                         |
| `commandAliases`                     | 否   | `object[]`                       | 此 Plugin 拥有的命令名称，在运行时加载之前应产生 Plugin 感知的配置和 CLI 诊断。                                                                                                                                                      |
| `providerAuthEnvVars`                | 否   | `Record<string, string[]>`       | 用于 Provider 身份验证/状态查询的已弃用兼容性环境元数据。新 Plugin 优先使用 `setup.providers[].envVars`；OpenClaw 在弃用窗口期间仍读取此字段。                                                                                        |
| `providerAuthAliases`                | 否   | `Record<string, string>`         | 应重用另一个 Provider ID 进行身份验证查询的 Provider ID，例如共享基础 Provider API 密钥和身份验证配置文件的编码 Provider。                                                                                                            |
| `channelEnvVars`                     | 否   | `Record<string, string[]>`       | OpenClaw 无需加载 Plugin 代码即可检查的廉价 Channel 环境元数据。将其用于泛型启动/配置助手应查看的由环境驱动的 Channel 设置或身份验证界面。                                                                                            |
| `providerAuthChoices`                | 否   | `object[]`                       | 用于入门选择器、首选 Provider 解析和简单 CLI 标志连接的廉价身份验证选项元数据。                                                                                                                                                      |
| `activation`                         | 否   | `object`                         | 用于启动、Provider、命令、Channel、路由和能力触发加载的廉价激活规划器元数据。仅元数据；Plugin 运行时仍拥有实际行为。                                                                                                                  |
| `setup`                              | 否   | `object`                         | 发现和设置界面可以在不加载 Plugin 运行时的情况下检查的廉价设置/入门描述符。                                                                                                                                                          |
| `qaRunners`                          | 否   | `object[]`                       | 共享 `openclaw qa` 主机在 Plugin 运行时加载之前使用的廉价 QA 运行器描述符。                                                                                                                                                          |
| `contracts`                          | 否   | `object`                         | 外部身份验证 Hook、语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、网络获取、网络搜索和 Tool 所有权的静态能力所有权快照。                                                                                           |
| `mediaUnderstandingProviderMetadata` | 否   | `Record<string, object>`         | `contracts.mediaUnderstandingProviders` 中声明的 Provider ID 的廉价媒体理解默认值。                                                                                                                                                 |
| `imageGenerationProviderMetadata`    | 否   | `Record<string, object>`         | `contracts.imageGenerationProviders` 中声明的 Provider ID 的廉价图像生成身份验证元数据，包括 Provider 拥有的身份验证别名和基础 URL 守护。                                                                                            |
| `videoGenerationProviderMetadata`    | 否   | `Record<string, object>`         | `contracts.videoGenerationProviders` 中声明的 Provider ID 的廉价视频生成身份验证元数据，包括 Provider 拥有的身份验证别名和基础 URL 守护。                                                                                            |
| `musicGenerationProviderMetadata`    | 否   | `Record<string, object>`         | `contracts.musicGenerationProviders` 中声明的 Provider ID 的廉价音乐生成身份验证元数据，包括 Provider 拥有的身份验证别名和基础 URL 守护。                                                                                            |
| `toolMetadata`                       | 否   | `Record<string, object>`         | `contracts.tools` 中声明的 Plugin 拥有 Tool 的廉价可用性元数据。当 Tool 不应加载运行时除非配置、环境或身份验证证据存在时使用它。                                                                                                      |
| `channelConfigs`                     | 否   | `Record<string, object>`         | Manifest 拥有的 Channel 配置元数据，在运行时加载之前合并到发现和验证界面。                                                                                                                                                          |
| `skills`                             | 否   | `string[]`                       | 要加载的 Skill 目录，相对于 Plugin 根目录。                                                                                                                                                                                        |
| `name`                               | 否   | `string`                         | 人类可读的 Plugin 名称。                                                                                                                                                                                                            |
| `description`                        | 否   | `string`                         | 在 Plugin 界面中显示的简短摘要。                                                                                                                                                                                                    |
| `version`                            | 否   | `string`                         | 信息性 Plugin 版本。                                                                                                                                                                                                                |
| `uiHints`                            | 否   | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                                                                            |

## 生成 Provider 元数据参考

生成 Provider 元数据字段描述在匹配 `contracts.*GenerationProviders` 列表中声明的 Provider 的静态身份验证信号。OpenClaw 在 Provider 运行时加载之前读取这些字段，以便核心 Tool 可以决定生成 Provider 是否可用，而无需导入每个 Provider Plugin。

这些字段仅用于廉价的声明性事实。传输、请求转换、令牌刷新、凭据验证和实际生成行为保留在 Plugin 运行时中。

```json
{
  "contracts": {
    "imageGenerationProviders": ["example-image"]
  },
  "imageGenerationProviderMetadata": {
    "example-image": {
      "aliases": ["example-image-oauth"],
      "authProviders": ["example-image"],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example-image.config",
          "overlayPath": "image",
          "mode": {
            "path": "mode",
            "default": "local",
            "allowed": ["local"]
          },
          "requiredAny": ["workflow", "workflowPath"],
          "required": ["promptNodeId"]
        }
      ],
      "authSignals": [
        {
          "provider": "example-image"
        },
        {
          "provider": "example-image-oauth",
          "providerBaseUrl": {
            "provider": "example-image",
            "defaultBaseUrl": "https://api.example.com/v1",
            "allowedBaseUrls": ["https://api.example.com/v1"]
          }
        }
      ]
    }
  }
}
```

每个元数据条目支持：

| 字段                   | 必填 | 类型       | 含义                                                                                           |
| ---------------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------- |
| `aliases`              | 否   | `string[]` | 应计为生成 Provider 静态身份验证别名的额外 Provider ID。                                       |
| `authProviders`        | 否   | `string[]` | 其配置的身份验证配置文件应计为此生成 Provider 身份验证的 Provider ID。                         |
| `configSignals`        | 否   | `object[]` | 针对可以在没有身份验证配置文件或环境变量的情况下配置的本地或自托管 Provider 的廉价仅配置可用性信号。 |
| `authSignals`          | 否   | `object[]` | 显式身份验证信号。存在时，这些替换来自 Provider ID、`aliases` 和 `authProviders` 的默认信号集。|
| `referenceAudioInputs` | 否   | `boolean`  | 仅视频生成。当 Provider 接受参考音频资产时设置为 `true`；否则 `video_generate` 隐藏音频参考参数。 |

每个 `configSignals` 条目支持：

| 字段          | 必填 | 类型       | 含义                                                                                                                                     |
| ------------- | ---- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `rootPath`    | 是   | `string`   | 要检查的 Plugin 拥有的配置对象的点路径，例如 `plugins.entries.example.config`。                                                          |
| `overlayPath` | 否   | `string`   | 在评估信号之前，根配置内其对象应叠加根对象的点路径。用于能力特定的配置，如 `image`、`video` 或 `music`。                                  |
| `required`    | 否   | `string[]` | 有效配置内必须具有配置值的点路径。字符串必须非空；对象和数组不能为空。                                                                     |
| `requiredAny` | 否   | `string[]` | 有效配置内至少一个必须具有配置值的点路径。                                                                                                |
| `mode`        | 否   | `object`   | 有效配置内的可选字符串模式守护。仅在仅配置可用性适用于一种模式时使用它。                                                                  |

每个 `mode` 守护支持：

| 字段         | 必填 | 类型       | 含义                                                    |
| ------------ | ---- | ---------- | ------------------------------------------------------- |
| `path`       | 否   | `string`   | 有效配置内的点路径。默认为 `mode`。                      |
| `default`    | 否   | `string`   | 当配置省略路径时使用的模式值。                           |
| `allowed`    | 否   | `string[]` | 如果存在，仅当有效模式是这些值之一时，信号才通过。       |
| `disallowed` | 否   | `string[]` | 如果存在，当有效模式是这些值之一时，信号失败。           |

每个 `authSignals` 条目支持：

| 字段              | 必填 | 类型     | 含义                                                                                                                                  |
| ----------------- | ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string` | 在配置的身份验证配置文件中检查的 Provider ID。                                                                                       |
| `providerBaseUrl` | 否   | `object` | 可选守护，使信号仅在引用的配置 Provider 使用允许的基础 URL 时才计数。当身份验证别名仅对某些 API 有效时使用它。                        |

每个 `providerBaseUrl` 守护支持：

| 字段              | 必填 | 类型       | 含义                                                                                                  |
| ----------------- | ---- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `provider`        | 是   | `string`   | 应检查其 `baseUrl` 的 Provider 配置 ID。                                                              |
| `defaultBaseUrl`  | 否   | `string`   | 当 Provider 配置省略 `baseUrl` 时假设的基础 URL。                                                     |
| `allowedBaseUrls` | 是   | `string[]` | 此身份验证信号的允许基础 URL。当配置或默认基础 URL 与这些标准化值之一不匹配时，信号被忽略。           |

## Tool 元数据参考

`toolMetadata` 使用与生成 Provider 元数据相同的 `configSignals` 和 `authSignals` 形状，按 Tool 名称键控。`contracts.tools` 声明所有权。`toolMetadata` 声明廉价的可用性证据，以便 OpenClaw 可以避免仅仅为了让其 Tool 工厂返回 `null` 而导入 Plugin 运行时。

```json
{
  "providerAuthEnvVars": {
    "example": ["EXAMPLE_API_KEY"]
  },
  "contracts": {
    "tools": ["example_search"]
  },
  "toolMetadata": {
    "example_search": {
      "authSignals": [
        {
          "provider": "example"
        }
      ],
      "configSignals": [
        {
          "rootPath": "plugins.entries.example.config",
          "overlayPath": "search",
          "required": ["apiKey"]
        }
      ]
    }
  }
}
```

如果 Tool 没有 `toolMetadata`，OpenClaw 保留现有行为，并在 Tool 契约匹配策略时加载拥有的 Plugin。对于 Tool 工厂依赖身份验证/配置的热路径 Tool，Plugin 作者应声明 `toolMetadata`，而不是让核心导入运行时来询问。

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一个入门或身份验证选项。OpenClaw 在 Provider 运行时加载之前读取此内容。Provider 设置列表使用这些 Manifest 选项、描述符派生的设置选项和安装目录元数据，而无需加载 Provider 运行时。

| 字段                  | 必填 | 类型                                                                  | 含义                                                                                 |
| --------------------- | ---- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `provider`            | 是   | `string`                                                              | 此选项所属的 Provider ID。                                                           |
| `method`              | 是   | `string`                                                              | 要分派的身份验证方法 ID。                                                            |
| `choiceId`            | 是   | `string`                                                              | 入门和 CLI 流程使用的稳定身份验证选项 ID。                                           |
| `choiceLabel`         | 否   | `string`                                                              | 面向用户的标签。如果省略，OpenClaw 回退到 `choiceId`。                               |
| `choiceHint`          | 否   | `string`                                                              | 选择器的简短帮助文本。                                                               |
| `assistantPriority`   | 否   | `number`                                                              | 较低的值在助手驱动的交互选择器中排在前面。                                           |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                                        | 从助手选择器中隐藏选项，同时仍允许手动 CLI 选择。                                    |
| `deprecatedChoiceIds` | 否   | `string[]`                                                            | 应将用户重定向到此替换选项的旧版选项 ID。                                            |
| `groupId`             | 否   | `string`                                                              | 用于分组相关选项的可选组 ID。                                                        |
| `groupLabel`          | 否   | `string`                                                              | 该组的面向用户的标签。                                                               |
| `groupHint`           | 否   | `string`                                                              | 组的简短帮助文本。                                                                   |
| `optionKey`           | 否   | `string`                                                              | 简单单标志身份验证流程的内部选项键。                                                 |
| `cliFlag`             | 否   | `string`                                                              | CLI 标志名称，如 `--openrouter-api-key`。                                            |
| `cliOption`           | 否   | `string`                                                              | 完整的 CLI 选项形状，如 `--openrouter-api-key <key>`。                               |
| `cliDescription`      | 否   | `string`                                                              | CLI 帮助中使用的描述。                                                               |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation" \| "music-generation">` | 此选项应出现在哪些入门界面中。如果省略，默认为 `["text-inference"]`。                |

## commandAliases 参考

当 Plugin 拥有用户可能错误地放入 `plugins.allow` 或尝试作为根 CLI 命令运行的运行时命令名称时，使用 `commandAliases`。OpenClaw 使用此元数据进行诊断，而无需导入 Plugin 运行时代码。

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

| 字段         | 必填 | 类型              | 含义                                                         |
| ------------ | ---- | ----------------- | ------------------------------------------------------------ |
| `name`       | 是   | `string`          | 属于此 Plugin 的命令名称。                                   |
| `kind`       | 否   | `"runtime-slash"` | 将别名标记为 Chat 斜杠命令，而不是根 CLI 命令。              |
| `cliCommand` | 否   | `string`          | 相关的根 CLI 命令（如果存在），用于建议 CLI 操作。           |

## activation 参考

当 Plugin 可以廉价地声明哪些控制平面事件应将其包含在激活/加载计划中时，使用 `activation`。

此块是规划器元数据，不是生命周期 API。它不注册运行时行为，不替换 `register(...)`，也不承诺 Plugin 代码已经执行。激活规划器使用这些字段缩小候选 Plugin，然后回退到现有的 Manifest 所有权元数据，如 `providers`、`channels`、`commandAliases`、`setup.providers`、`contracts.tools` 和 Hook。

优先使用已经描述所有权的最窄元数据。当这些字段表达关系时，使用 `providers`、`channels`、`commandAliases`、设置描述符或 `contracts`。对那些无法由这些所有权字段表示的额外规划器提示使用 `activation`。对 CLI 运行时别名（如 `claude-cli`、`my-cli` 或 `google-gemini-cli`）使用顶层 `cliBackends`；`activation.onAgentHarnesses` 仅用于尚未有所有权字段的嵌入式 Agent Harness ID。

此块仅是元数据。它不注册运行时行为，也不替换 `register(...)`、`setupEntry` 或其他运行时/Plugin 入口点。当前使用者将其作为广泛 Plugin 加载之前的缩小提示，因此缺少非启动激活元数据通常只会影响性能；在 Manifest 所有权回退仍然存在的情况下，它不应改变正确性。

每个 Plugin 应有意地设置 `activation.onStartup`。仅当 Plugin 必须在 Gateway 启动期间运行时才将其设置为 `true`。当 Plugin 在启动时处于惰性状态且只应从更窄的触发器加载时，将其设置为 `false`。省略 `onStartup` 不再隐式地启动加载 Plugin；对启动、Channel、配置、Agent Harness、内存或其他更窄的激活触发器使用显式激活元数据。

```json
{
  "activation": {
    "onStartup": false,
    "onProviders": ["openai"],
    "onCommands": ["models"],
    "onChannels": ["web"],
    "onRoutes": ["gateway-webhook"],
    "onConfigPaths": ["browser"],
    "onCapabilities": ["provider", "tool"]
  }
}
```

| 字段               | 必填 | 类型                                                 | 含义                                                                                                                                                          |
| ------------------ | ---- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onStartup`        | 否   | `boolean`                                            | 显式 Gateway 启动激活。每个 Plugin 都应设置此项。`true` 在启动期间导入 Plugin；`false` 保持其启动惰性，除非另一个匹配的触发器需要加载。                        |
| `onProviders`      | 否   | `string[]`                                           | 应在激活/加载计划中包含此 Plugin 的 Provider ID。                                                                                                             |
| `onAgentHarnesses` | 否   | `string[]`                                           | 应在激活/加载计划中包含此 Plugin 的嵌入式 Agent Harness 运行时 ID。对 CLI 后端别名使用顶层 `cliBackends`。                                                    |
| `onCommands`       | 否   | `string[]`                                           | 应在激活/加载计划中包含此 Plugin 的命令 ID。                                                                                                                  |
| `onChannels`       | 否   | `string[]`                                           | 应在激活/加载计划中包含此 Plugin 的 Channel ID。                                                                                                              |
| `onRoutes`         | 否   | `string[]`                                           | 应在激活/加载计划中包含此 Plugin 的路由类型。                                                                                                                 |
| `onConfigPaths`    | 否   | `string[]`                                           | 当路径存在且未明确禁用时，应在启动/加载计划中包含此 Plugin 的根相对配置路径。                                                                                 |
| `onCapabilities`   | 否   | `Array<"provider" \| "channel" \| "tool" \| "hook">` | 控制平面激活规划使用的广泛能力提示。尽可能优先使用更窄的字段。                                                                                                |

当前实时使用者：

- Gateway 启动规划使用 `activation.onStartup` 进行显式启动导入
- 命令触发的 CLI 规划回退到旧版 `commandAliases[].cliCommand` 或 `commandAliases[].name`
- Agent 运行时启动规划使用 `activation.onAgentHarnesses` 用于嵌入式 Harness，使用顶层 `cliBackends[]` 用于 CLI 运行时别名
- Channel 触发的设置/Channel 规划在缺少显式 Channel 激活元数据时回退到旧版 `channels[]` 所有权
- 启动 Plugin 规划使用 `activation.onConfigPaths` 用于非 Channel 根配置界面，如捆绑浏览器 Plugin 的 `browser` 块
- Provider 触发的设置/运行时规划在缺少显式 Provider 激活元数据时回退到旧版 `providers[]` 和顶层 `cliBackends[]` 所有权

规划器诊断可以区分显式激活提示和 Manifest 所有权回退。例如，`activation-command-hint` 表示 `activation.onCommands` 匹配，而 `manifest-command-alias` 表示规划器使用了 `commandAliases` 所有权。这些原因标签用于主机诊断和测试；Plugin 作者应继续声明最能描述所有权的元数据。

## qaRunners 参考

当 Plugin 在共享 `openclaw qa` 根下贡献一个或多个传输运行器时，使用 `qaRunners`。保持此元数据廉价且静态；Plugin 运行时仍然通过导出 `qaRunnerCliRegistrations` 的轻量级 `runtime-api.ts` 界面拥有实际的 CLI 注册。

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

| 字段          | 必填 | 类型     | 含义                                                     |
| ------------- | ---- | -------- | -------------------------------------------------------- |
| `commandName` | 是   | `string` | 挂载在 `openclaw qa` 下的子命令，例如 `matrix`。         |
| `description` | 否   | `string` | 当共享主机需要存根命令时使用的回退帮助文本。             |

## setup 参考

当设置和入门界面需要在运行时加载之前获取廉价的 Plugin 拥有的元数据时，使用 `setup`。

```json
{
  "setup": {
    "providers": [
      {
        "id": "openai",
        "authMethods": ["api-key"],
        "envVars": ["OPENAI_API_KEY"],
        "authEvidence": [
          {
            "type": "local-file-with-env",
            "fileEnvVar": "OPENAI_CREDENTIALS_FILE",
            "requiresAllEnv": ["OPENAI_PROJECT"],
            "credentialMarker": "openai-local-credentials",
            "source": "openai local credentials"
          }
        ]
      }
    ],
    "cliBackends": ["openai-cli"],
    "configMigrations": ["legacy-openai-auth"],
    "requiresRuntime": false
  }
}
```

顶层 `cliBackends` 保持有效，继续描述 CLI 推理后端。`setup.cliBackends` 是应保持仅元数据的控制平面/设置流的设置特定描述符界面。

存在时，`setup.providers` 和 `setup.cliBackends` 是设置发现的首选描述符优先查询界面。如果描述符仅缩小候选 Plugin 且设置仍然需要更丰富的设置时间运行时 Hook，则设置 `requiresRuntime: true` 并将 `setup-api` 作为回退执行路径。

OpenClaw 还在泛型 Provider 身份验证和环境变量查询中包含 `setup.providers[].envVars`。`providerAuthEnvVars` 在弃用窗口期间通过兼容性适配器仍受支持，但仍使用它的非捆绑 Plugin 会收到 Manifest 诊断。新 Plugin 应将设置/状态环境元数据放在 `setup.providers[].envVars` 上。

当没有可用的设置条目时，或当 `setup.requiresRuntime: false` 声明设置运行时不必要时，OpenClaw 也可以从 `setup.providers[].authMethods` 派生简单的设置选项。显式的 `providerAuthChoices` 条目对于自定义标签、CLI 标志、入门范围和助手元数据仍然是首选。

仅当这些描述符足以满足设置界面时，才设置 `requiresRuntime: false`。OpenClaw 将显式 `false` 视为描述符唯一的契约，不会为设置查询执行 `setup-api` 或 `openclaw.setupEntry`。如果描述符唯一的 Plugin 仍然附带这些设置运行时条目之一，OpenClaw 会报告附加诊断并继续忽略它。省略的 `requiresRuntime` 保留旧版回退行为，因此添加了描述符而没有标志的现有 Plugin 不会中断。

由于设置查询可以执行 Plugin 拥有的 `setup-api` 代码，标准化的 `setup.providers[].id` 和 `setup.cliBackends[]` 值在发现的 Plugin 之间必须保持唯一。模糊的所有权以关闭方式失败，而不是从发现顺序中选择赢家。

当设置运行时确实执行时，如果 `setup-api` 注册了 Manifest 描述符未声明的 Provider 或 CLI 后端，或者描述符没有匹配的运行时注册，设置注册表诊断会报告描述符漂移。这些诊断是附加的，不会拒绝旧版 Plugin。

### setup.providers 参考

| 字段           | 必填 | 类型       | 含义                                                                                 |
| -------------- | ---- | ---------- | ------------------------------------------------------------------------------------ |
| `id`           | 是   | `string`   | 设置或入门期间公开的 Provider ID。保持标准化 ID 全局唯一。                           |
| `authMethods`  | 否   | `string[]` | 此 Provider 支持的设置/身份验证方法 ID，无需加载完整运行时。                         |
| `envVars`      | 否   | `string[]` | 泛型设置/状态界面可以在 Plugin 运行时加载之前检查的环境变量。                       |
| `authEvidence` | 否   | `object[]` | 用于可以通过非密钥标记进行身份验证的 Provider 的廉价本地身份验证证据检查。           |

`authEvidence` 用于可以在不加载运行时代码的情况下验证的 Provider 拥有的本地凭据标记。这些检查必须保持廉价且本地：无网络调用、无钥匙串或密钥管理器读取、无 Shell 命令、无 Provider API 探测。

支持的证据条目：

| 字段               | 必填 | 类型       | 含义                                                                                        |
| ------------------ | ---- | ---------- | ------------------------------------------------------------------------------------------- |
| `type`             | 是   | `string`   | 目前为 `local-file-with-env`。                                                              |
| `fileEnvVar`       | 否   | `string`   | 包含显式凭据文件路径的环境变量。                                                            |
| `fallbackPaths`    | 否   | `string[]` | 当 `fileEnvVar` 缺失或为空时检查的本地凭据文件路径。支持 `${HOME}` 和 `${APPDATA}`。       |
| `requiresAnyEnv`   | 否   | `string[]` | 证据有效之前，至少一个列出的环境变量必须非空。                                              |
| `requiresAllEnv`   | 否   | `string[]` | 证据有效之前，每个列出的环境变量必须非空。                                                  |
| `credentialMarker` | 是   | `string`   | 证据存在时返回的非密钥标记。                                                                |
| `source`           | 否   | `string`   | 身份验证/状态输出的面向用户的来源标签。                                                     |

### setup 字段

| 字段               | 必填 | 类型       | 含义                                                                              |
| ------------------ | ---- | ---------- | --------------------------------------------------------------------------------- |
| `providers`        | 否   | `object[]` | 在设置和入门期间公开的 Provider 设置描述符。                                      |
| `cliBackends`      | 否   | `string[]` | 用于描述符优先设置查询的设置时间后端 ID。保持标准化 ID 全局唯一。                |
| `configMigrations` | 否   | `string[]` | 此 Plugin 设置界面拥有的配置迁移 ID。                                             |
| `requiresRuntime`  | 否   | `boolean`  | 描述符查询后设置是否仍需要 `setup-api` 执行。                                     |

## uiHints 参考

`uiHints` 是从配置字段名称到小型渲染提示的映射。

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

| 字段          | 类型       | 含义                       |
| ------------- | ---------- | -------------------------- |
| `label`       | `string`   | 面向用户的字段标签。        |
| `help`        | `string`   | 简短帮助文本。              |
| `tags`        | `string[]` | 可选的 UI 标签。            |
| `advanced`    | `boolean`  | 将字段标记为高级。          |
| `sensitive`   | `boolean`  | 将字段标记为密钥或敏感。    |
| `placeholder` | `string`   | 表单输入的占位符文本。      |

## contracts 参考

仅将 `contracts` 用于 OpenClaw 无需导入 Plugin 运行时即可读取的静态能力所有权元数据。

```json
{
  "contracts": {
    "agentToolResultMiddleware": ["pi", "codex"],
    "externalAuthProviders": ["acme-ai"],
    "embeddingProviders": ["openai-compatible"],
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "memoryEmbeddingProviders": ["local"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "meetingNotesSourceProviders": ["discord"],
    "imageGenerationProviders": ["openai"],
    "musicGenerationProviders": ["example-music"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "migrationProviders": ["hermes"],
    "gatewayMethodDispatch": ["authenticated-request"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每个列表是可选的：

| 字段                             | 类型       | 含义                                                                                            |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| `embeddedExtensionFactories`     | `string[]` | Codex app-server 扩展工厂 ID，目前为 `codex-app-server`。                                      |
| `agentToolResultMiddleware`      | `string[]` | 捆绑 Plugin 可以为其注册 Tool 结果中间件的运行时 ID。                                          |
| `externalAuthProviders`          | `string[]` | 此 Plugin 拥有外部身份验证配置文件 Hook 的 Provider ID。                                       |
| `embeddingProviders`             | `string[]` | 此 Plugin 为内存之外的可重用向量嵌入用途拥有的通用嵌入 Provider ID。                           |
| `speechProviders`                | `string[]` | 此 Plugin 拥有的语音 Provider ID。                                                              |
| `realtimeTranscriptionProviders` | `string[]` | 此 Plugin 拥有的实时转录 Provider ID。                                                         |
| `realtimeVoiceProviders`         | `string[]` | 此 Plugin 拥有的实时语音 Provider ID。                                                         |
| `memoryEmbeddingProviders`       | `string[]` | 此 Plugin 拥有的内存嵌入 Provider ID。                                                         |
| `mediaUnderstandingProviders`    | `string[]` | 此 Plugin 拥有的媒体理解 Provider ID。                                                         |
| `meetingNotesSourceProviders`    | `string[]` | 此 Plugin 拥有的会议笔记来源 Provider ID。                                                     |
| `imageGenerationProviders`       | `string[]` | 此 Plugin 拥有的图像生成 Provider ID。                                                         |
| `musicGenerationProviders`       | `string[]` | 此 Plugin 拥有的音乐生成 Provider ID。                                                         |
| `videoGenerationProviders`       | `string[]` | 此 Plugin 拥有的视频生成 Provider ID。                                                         |
| `webFetchProviders`              | `string[]` | 此 Plugin 拥有的网络获取 Provider ID。                                                         |
| `webSearchProviders`             | `string[]` | 此 Plugin 拥有的网络搜索 Provider ID。                                                         |
| `migrationProviders`             | `string[]` | 此 Plugin 为 `openclaw migrate` 拥有的导入 Provider ID。                                       |
| `gatewayMethodDispatch`          | `string[]` | 在进程内分派 Gateway 方法的经身份验证的 Plugin HTTP 路由的保留权限。                           |
| `tools`                          | `string[]` | 此 Plugin 拥有的 Agent Tool 名称。                                                              |

`contracts.embeddedExtensionFactories` 保留用于仅限捆绑 Codex app-server 的扩展工厂。捆绑的 Tool 结果转换应声明 `contracts.agentToolResultMiddleware` 并使用 `api.registerAgentToolResultMiddleware(...)` 注册。外部 Plugin 无法注册 Tool 结果中间件，因为该接缝可以在模型看到之前重写高信任 Tool 输出。

运行时 `api.registerTool(...)` 注册必须与 `contracts.tools` 匹配。Tool 发现使用此列表仅加载可以拥有所请求 Tool 的 Plugin 运行时。

实现 `resolveExternalAuthProfiles` 的 Provider Plugin 应声明 `contracts.externalAuthProviders`。没有声明的 Plugin 仍然通过已弃用的兼容性回退运行，但该回退速度较慢，将在迁移窗口后删除。

捆绑的内存嵌入 Provider 应为其公开的每个适配器 ID（包括内置适配器如 `local`）声明 `contracts.memoryEmbeddingProviders`。独立 CLI 路径使用此 Manifest 契约在完整的 Gateway 运行时注册 Provider 之前仅加载拥有的 Plugin。

通用嵌入 Provider 应为使用 `api.registerEmbeddingProvider(...)` 注册的每个适配器声明 `contracts.embeddingProviders`。当向量旨在被多个功能、Tool 或 Plugin 使用时，使用通用契约。将 `contracts.memoryEmbeddingProviders` 保留给形状和生命周期特定于 OpenClaw 内存索引的适配器。

`contracts.gatewayMethodDispatch` 目前接受 `"authenticated-request"`。它是有意在进程内分派 Gateway 控制平面方法的原生 Plugin HTTP 路由的 API 卫生门控，而不是针对恶意原生 Plugin 的沙盒。仅将其用于已经需要 Gateway HTTP 身份验证的经过严格审查的捆绑/操作员界面。

## mediaUnderstandingProviderMetadata 参考

当媒体理解 Provider 具有泛型核心助手在运行时加载之前需要的默认模型、自动身份验证回退优先级或原生文档支持时，使用 `mediaUnderstandingProviderMetadata`。键也必须在 `contracts.mediaUnderstandingProviders` 中声明。

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

| 字段                   | 类型                                | 含义                                                         |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------ |
| `capabilities`         | `("image" \| "audio" \| "video")[]` | 此 Provider 公开的媒体能力。                                 |
| `defaultModels`        | `Record<string, string>`            | 配置未指定模型时使用的能力到模型默认值。                     |
| `autoPriority`         | `Record<string, number>`            | 较低数字在自动基于凭据的 Provider 回退中排在前面。           |
| `nativeDocumentInputs` | `"pdf"[]`                           | Provider 支持的原生文档输入。                                |

## channelConfigs 参考

当 Channel Plugin 需要在运行时加载之前获取廉价的配置元数据时，使用 `channelConfigs`。当没有可用的设置条目时，或当 `setup.requiresRuntime: false` 声明设置运行时不必要时，只读 Channel 设置/状态发现可以直接将此元数据用于配置的外部 Channel。

`channelConfigs` 是 Plugin Manifest 元数据，不是新的顶层用户配置部分。用户仍然在 `channels.<channel-id>` 下配置 Channel 实例。OpenClaw 读取 Manifest 元数据以在 Plugin 运行时代码执行之前决定哪个 Plugin 拥有该配置的 Channel。

对于 Channel Plugin，`configSchema` 和 `channelConfigs` 描述不同的路径：

- `configSchema` 验证 `plugins.entries.<plugin-id>.config`
- `channelConfigs.<channel-id>.schema` 验证 `channels.<channel-id>`

声明 `channels[]` 的非捆绑 Plugin 也应声明匹配的 `channelConfigs` 条目。没有它们，OpenClaw 仍然可以加载 Plugin，但冷路径配置 Schema、设置和控制 UI 界面在 Plugin 运行时执行之前无法知道 Channel 拥有的选项形状。

`channelConfigs.<channel-id>.commands.nativeCommandsAutoEnabled` 和 `nativeSkillsAutoEnabled` 可以为在 Channel 运行时加载之前运行的命令配置检查声明静态 `auto` 默认值。捆绑 Channel 还可以通过 `package.json#openclaw.channel.commands` 发布相同的默认值，以及其他包拥有的 Channel 目录元数据。

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

| 字段          | 类型                     | 含义                                                                                   |
| ------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| `schema`      | `object`                 | `channels.<id>` 的 JSON Schema。每个声明的 Channel 配置条目都必填。                   |
| `uiHints`     | `Record<string, object>` | 该 Channel 配置部分的可选 UI 标签/占位符/敏感性提示。                                 |
| `label`       | `string`                 | 当运行时元数据未就绪时合并到选择器和检查界面的 Channel 标签。                         |
| `description` | `string`                 | 检查和目录界面的简短 Channel 描述。                                                    |
| `commands`    | `object`                 | 预运行时配置检查的静态原生命令和原生 Skill 自动默认值。                                |
| `preferOver`  | `string[]`               | 此 Channel 在选择界面中应优先于的旧版或低优先级 Plugin ID。                            |

### 替换另一个 Channel Plugin

当您的 Plugin 是另一个 Plugin 也可以提供的 Channel ID 的首选所有者时，使用 `preferOver`。常见情况是重命名的 Plugin ID、取代捆绑 Plugin 的独立 Plugin，或为配置兼容性保留相同 Channel ID 的维护分支。

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

当配置了 `channels.chat` 时，OpenClaw 同时考虑 Channel ID 和首选 Plugin ID。如果低优先级 Plugin 仅因为是捆绑的或默认启用而被选择，OpenClaw 在有效运行时配置中禁用它，以便一个 Plugin 拥有该 Channel 及其 Tool。显式用户选择仍然优先：如果用户明确启用两个 Plugin，OpenClaw 保留该选择并报告重复 Channel/Tool 诊断，而不是悄悄更改请求的 Plugin 集。

将 `preferOver` 范围限制为真正可以提供相同 Channel 的 Plugin ID。它不是通用的优先级字段，也不重命名用户配置键。

## modelSupport 参考

当 OpenClaw 应该在 Plugin 运行时加载之前从速记模型 ID（如 `gpt-5.5` 或 `claude-sonnet-4.6`）推断您的 Provider Plugin 时，使用 `modelSupport`。

```json
{
  "modelSupport": {
    "modelPrefixes": ["gpt-", "o1", "o3", "o4"],
    "modelPatterns": ["^computer-use-preview"]
  }
}
```

OpenClaw 应用此优先级：

- 显式的 `provider/model` 引用使用拥有的 `providers` Manifest 元数据
- `modelPatterns` 优先于 `modelPrefixes`
- 如果一个非捆绑 Plugin 和一个捆绑 Plugin 都匹配，非捆绑 Plugin 获胜
- 剩余的歧义将被忽略，直到用户或配置指定 Provider

字段：

| 字段            | 类型       | 含义                                               |
| --------------- | ---------- | -------------------------------------------------- |
| `modelPrefixes` | `string[]` | 对速记模型 ID 使用 `startsWith` 匹配的前缀。       |
| `modelPatterns` | `string[]` | 在配置文件后缀删除后对速记模型 ID 匹配的正则表达式源。 |

## modelCatalog 参考

当 OpenClaw 应该在加载 Plugin 运行时之前知道 Provider 模型元数据时，使用 `modelCatalog`。这是固定目录行、Provider 别名、抑制规则和发现模式的 Manifest 拥有来源。运行时刷新仍属于 Provider 运行时代码，但 Manifest 告诉核心何时需要运行时。

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

顶层字段：

| 字段           | 类型                                                     | 含义                                                                                               |
| -------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `providers`      | `Record<string, object>`                                 | 此 Plugin 拥有的 Provider ID 的目录行。键也应出现在顶层 `providers` 中。                          |
| `aliases`        | `Record<string, object>`                                 | 应解析为拥有的 Provider 以进行目录或抑制规划的 Provider 别名。                                    |
| `suppressions`   | `object[]`                                               | 此 Plugin 为 Provider 特定原因抑制的来自另一个来源的模型行。                                      |
| `discovery`      | `Record<string, "static" \| "refreshable" \| "runtime">` | Provider 目录是否可以从 Manifest 元数据读取、刷新到缓存中，还是需要运行时。                       |
| `runtimeAugment` | `boolean`                                                | 仅当 Provider 运行时必须在 Manifest/配置规划之后追加目录行时，才设置为 `true`。                   |

`aliases` 参与模型目录规划的 Provider 所有权查询。别名目标必须是同一 Plugin 拥有的顶层 Provider。当 Provider 过滤的列表使用别名时，OpenClaw 可以读取拥有的 Manifest 并应用别名 API/基础 URL 覆盖，而无需加载 Provider 运行时。别名不扩展未过滤的目录列表；广泛的列表仅发出拥有的规范 Provider 行。

`suppressions` 替换旧的 Provider 运行时 `suppressBuiltInModel` Hook。抑制条目仅在 Provider 由 Plugin 拥有或声明为以拥有的 Provider 为目标的 `modelCatalog.aliases` 键时才被尊重。在模型解析期间不再调用运行时抑制 Hook。

Provider 字段：

| 字段      | 类型                     | 含义                                                |
| --------- | ------------------------ | --------------------------------------------------- |
| `baseUrl` | `string`                 | 此 Provider 目录中模型的可选默认基础 URL。          |
| `api`     | `ModelApi`               | 此 Provider 目录中模型的可选默认 API 适配器。       |
| `headers` | `Record<string, string>` | 应用于此 Provider 目录的可选静态头。                |
| `models`  | `object[]`               | 必填的模型行。没有 `id` 的行将被忽略。              |

模型字段：

| 字段            | 类型                                                           | 含义                                                      |
| --------------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| `id`            | `string`                                                       | Provider 本地模型 ID，不带 `provider/` 前缀。             |
| `name`          | `string`                                                       | 可选显示名称。                                            |
| `api`           | `ModelApi`                                                     | 可选的每模型 API 覆盖。                                   |
| `baseUrl`       | `string`                                                       | 可选的每模型基础 URL 覆盖。                               |
| `headers`       | `Record<string, string>`                                       | 可选的每模型静态头。                                      |
| `input`         | `Array<"text" \| "image" \| "document" \| "audio" \| "video">` | 模型接受的模态。                                          |
| `reasoning`     | `boolean`                                                      | 模型是否暴露推理行为。                                    |
| `contextWindow` | `number`                                                       | 原生 Provider 上下文窗口。                                |
| `contextTokens` | `number`                                                       | 当与 `contextWindow` 不同时的可选有效运行时上下文上限。   |
| `maxTokens`     | `number`                                                       | 已知时的最大输出 Token。                                  |
| `cost`          | `object`                                                       | 可选的每百万 Token USD 定价，包括可选的 `tieredPricing`。 |
| `compat`        | `object`                                                       | 匹配 OpenClaw 模型配置兼容性的可选兼容性标志。            |
| `status`        | `"available"` \| `"preview"` \| `"deprecated"` \| `"disabled"` | 列表状态。仅在该行根本不应出现时才抑制。                  |
| `statusReason`  | `string`                                                       | 非可用状态显示的可选原因。                                |
| `replaces`      | `string[]`                                                     | 此模型取代的旧版 Provider 本地模型 ID。                   |
| `replacedBy`    | `string`                                                       | 已弃用行的替换 Provider 本地模型 ID。                     |
| `tags`          | `string[]`                                                     | 选择器和过滤器使用的稳定标签。                            |

抑制字段：

| 字段                       | 类型       | 含义                                                                                  |
| -------------------------- | ---------- | ------------------------------------------------------------------------------------- |
| `provider`                 | `string`   | 要抑制的上游行的 Provider ID。必须由此 Plugin 拥有或声明为拥有的别名。               |
| `model`                    | `string`   | 要抑制的 Provider 本地模型 ID。                                                       |
| `reason`                   | `string`   | 直接请求被抑制行时显示的可选消息。                                                    |
| `when.baseUrlHosts`        | `string[]` | 抑制应用之前所需的有效 Provider 基础 URL 主机的可选列表。                             |
| `when.providerConfigApiIn` | `string[]` | 抑制应用之前所需的精确 Provider 配置 `api` 值的可选列表。                             |

不要在 `modelCatalog` 中放置仅运行时数据。仅当 Manifest 行对于 Provider 过滤列表和选择器界面来说足够完整可以跳过注册表/运行时发现时，才使用 `static`。当 Manifest 行是有用的可列出种子或补充，但刷新/缓存以后可以添加更多行时，使用 `refreshable`；refreshable 行本身不是权威的。当 OpenClaw 必须加载 Provider 运行时才能知道列表时，使用 `runtime`。

## modelIdNormalization 参考

对于必须在 Provider 运行时加载之前发生的廉价 Provider 拥有的模型 ID 清理，使用 `modelIdNormalization`。这将别名（如短模型名称、Provider 本地旧版 ID 和代理前缀规则）保留在拥有的 Plugin Manifest 中，而不是在核心模型选择表中。

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

| 字段                                 | 类型                    | 含义                                                                          |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------------------- |
| `aliases`                            | `Record<string,string>` | 不区分大小写的精确模型 ID 别名。值按原样返回。                                |
| `stripPrefixes`                      | `string[]`              | 别名查询前要删除的前缀，对旧版 provider/model 重复很有用。                    |
| `prefixWhenBare`                     | `string`                | 当标准化模型 ID 尚未包含 `/` 时要添加的前缀。                                 |
| `prefixWhenBareAfterAliasStartsWith` | `object[]`              | 别名查询后的条件裸 ID 前缀规则，按 `modelPrefix` 和 `prefix` 键控。           |

## providerEndpoints 参考

对于泛型请求策略在 Provider 运行时加载之前必须知道的端点分类，使用 `providerEndpoints`。核心仍拥有每个 `endpointClass` 的含义；Plugin Manifest 拥有主机和基础 URL 元数据。

端点字段：

| 字段                           | 类型       | 含义                                                                                 |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------------ |
| `endpointClass`                | `string`   | 已知的核心端点类，如 `openrouter`、`moonshot-native` 或 `google-vertex`。            |
| `hosts`                        | `string[]` | 映射到端点类的精确主机名。                                                           |
| `hostSuffixes`                 | `string[]` | 映射到端点类的主机后缀。在前面加 `.` 仅用于域后缀匹配。                              |
| `baseUrls`                     | `string[]` | 映射到端点类的精确标准化 HTTP(S) 基础 URL。                                          |
| `googleVertexRegion`           | `string`   | 精确全局主机的静态 Google Vertex 区域。                                              |
| `googleVertexRegionHostSuffix` | `string`   | 要从匹配主机中删除以公开 Google Vertex 区域前缀的后缀。                              |

## providerRequest 参考

对于泛型请求策略无需加载 Provider 运行时即可需要的廉价请求兼容性元数据，使用 `providerRequest`。将行为特定的载荷重写保留在 Provider 运行时 Hook 或共享 Provider 族助手中。

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

| 字段                  | 类型         | 含义                                                                      |
| --------------------- | ------------ | ------------------------------------------------------------------------- |
| `family`              | `string`     | 泛型请求兼容性决策和诊断使用的 Provider 族标签。                          |
| `compatibilityFamily` | `"moonshot"` | 共享请求助手的可选 Provider 族兼容性存储桶。                              |
| `openAICompletions`   | `object`     | OpenAI 兼容的完成请求标志，目前为 `supportsStreamingUsage`。              |

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

| 字段         | 类型              | 含义                                                                         |
| ------------ | ----------------- | ---------------------------------------------------------------------------- |
| `external`   | `boolean`         | 对本地/自托管 Provider 设置 `false`，这些 Provider 不应获取 OpenRouter 或 LiteLLM 定价。 |
| `openRouter` | `false \| object` | OpenRouter 定价查询映射。`false` 禁用此 Provider 的 OpenRouter 查询。        |
| `liteLLM`    | `false \| object` | LiteLLM 定价查询映射。`false` 禁用此 Provider 的 LiteLLM 查询。              |

来源字段：

| 字段                       | 类型               | 含义                                                                                                 |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| `provider`                 | `string`           | 当外部目录 Provider ID 与 OpenClaw Provider ID 不同时，例如 `zai` Provider 的 `z-ai`。               |
| `passthroughProviderModel` | `boolean`          | 将包含斜杠的模型 ID 视为嵌套的 provider/model 引用，对代理 Provider（如 OpenRouter）很有用。         |
| `modelIdTransforms`        | `"version-dots"[]` | 额外的外部目录模型 ID 变体。`version-dots` 尝试带点版本的 ID，如 `claude-opus-4.6`。                 |

### OpenClaw Provider 索引

OpenClaw Provider 索引是 OpenClaw 拥有的预览元数据，用于可能尚未安装其 Plugin 的 Provider。它不是 Plugin Manifest 的一部分。Plugin Manifest 仍然是已安装 Plugin 的权威。Provider 索引是内部回退契约，当 Provider Plugin 未安装时，未来的可安装 Provider 和预安装模型选择器界面将使用它。

目录权威顺序：

1. 用户配置。
2. 已安装 Plugin Manifest `modelCatalog`。
3. 来自显式刷新的模型目录缓存。
4. OpenClaw Provider 索引预览行。

Provider 索引不得包含密钥、启用状态、运行时 Hook 或实时账户特定的模型数据。其预览目录使用与 Plugin Manifest 相同的 `modelCatalog` Provider 行形状，但应仅限于稳定的显示元数据，除非像 `api`、`baseUrl`、定价或兼容性标志这样的运行时适配器字段有意与已安装的 Plugin Manifest 保持一致。具有实时 `/models` 发现的 Provider 应通过显式的模型目录缓存路径写入刷新的行，而不是让普通列表或入门调用 Provider API。

Provider 索引条目也可以携带其 Plugin 已移出核心或尚未安装的 Provider 的可安装 Plugin 元数据。此元数据反映 Channel 目录模式：包名称、npm 安装规格、预期完整性和廉价的身份验证选项标签足以显示可安装的设置选项。一旦安装了 Plugin，其 Manifest 获胜，该 Provider 的 Provider 索引条目将被忽略。

旧版顶层能力键已弃用。使用 `openclaw doctor --fix` 将 `speechProviders`、`realtimeTranscriptionProviders`、`realtimeVoiceProviders`、`mediaUnderstandingProviders`、`imageGenerationProviders`、`videoGenerationProviders`、`webFetchProviders` 和 `webSearchProviders` 移到 `contracts` 下；正常的 Manifest 加载不再将这些顶层字段视为能力所有权。

## Manifest 与 package.json

这两个文件服务于不同的工作：

| 文件                   | 用途                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 在 Plugin 代码运行之前必须存在的发现、配置验证、身份验证选项元数据和 UI 提示                                    |
| `package.json`         | npm 元数据、依赖项安装，以及用于入口点、安装门控、设置或目录元数据的 `openclaw` 块                              |

如果您不确定某个元数据属于哪里，请使用此规则：

- 如果 OpenClaw 必须在加载 Plugin 代码之前知道它，请将其放在 `openclaw.plugin.json` 中
- 如果它关于打包、入口文件或 npm 安装行为，请将其放在 `package.json` 中

### 影响发现的 package.json 字段

一些预运行时 Plugin 元数据有意地存在于 `package.json` 的 `openclaw` 块中，而不是 `openclaw.plugin.json` 中。`openclaw.bundle` 和 `openclaw.bundle.json` 不是 OpenClaw Plugin 契约；原生 Plugin 必须使用 `openclaw.plugin.json` 加上以下支持的 `package.json#openclaw` 字段。

重要示例：

| 字段                                                                                       | 含义                                                                                                                     |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `openclaw.extensions`                                                                      | 声明原生 Plugin 入口点。必须保留在 Plugin 包目录内。                                                                     |
| `openclaw.runtimeExtensions`                                                               | 声明已安装包的已构建 JavaScript 运行时入口点。必须保留在 Plugin 包目录内。                                               |
| `openclaw.setupEntry`                                                                      | 在入门、延迟 Channel 启动和只读 Channel 状态/SecretRef 发现期间使用的轻量级仅设置入口点。必须保留在 Plugin 包目录内。    |
| `openclaw.runtimeSetupEntry`                                                               | 声明已安装包的已构建 JavaScript 设置入口点。需要 `setupEntry`，必须存在，且必须保留在 Plugin 包目录内。                  |
| `openclaw.channel`                                                                         | 廉价的 Channel 目录元数据，如标签、文档路径、别名和选择文案。                                                           |
| `openclaw.channel.commands`                                                                | Channel 运行时加载之前配置、审计和命令列表界面使用的静态原生命令和原生 Skill 自动默认元数据。                            |
| `openclaw.channel.configuredState`                                                         | 可以回答"仅环境设置是否已存在？"的轻量级配置状态检查器元数据，无需加载完整的 Channel 运行时。                            |
| `openclaw.channel.persistedAuthState`                                                      | 可以回答"是否有任何已登录？"的轻量级持久化身份验证检查器元数据，无需加载完整的 Channel 运行时。                          |
| `openclaw.install.clawhubSpec` / `openclaw.install.npmSpec` / `openclaw.install.localPath` | 捆绑和外部发布 Plugin 的安装/更新提示。                                                                                  |
| `openclaw.install.defaultChoice`                                                           | 当多个安装来源可用时的首选安装路径。                                                                                     |
| `openclaw.install.minHostVersion`                                                          | 最低支持的 OpenClaw 主机版本，使用 semver 下限，如 `>=2026.3.22` 或 `>=2026.5.1-beta.1`。                               |
| `openclaw.install.expectedIntegrity`                                                       | 预期的 npm dist 完整性字符串，如 `sha512-...`；安装和更新流程对其验证获取的工件。                                       |
| `openclaw.install.allowInvalidConfigRecovery`                                              | 允许在配置无效时进行窄的捆绑 Plugin 重新安装恢复路径。                                                                   |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen`                          | 让仅设置的 Channel 界面在完整 Channel Plugin 启动之前加载。                                                              |

Manifest 元数据决定哪些 Provider/Channel/设置选项在运行时加载之前出现在入门中。`package.json#openclaw.install` 告诉入门当用户选择其中一个选项时如何获取或启用该 Plugin。不要将安装提示移到 `openclaw.plugin.json`。

对于非捆绑 Plugin 来源，`openclaw.install.minHostVersion` 在安装和 Manifest 注册表加载期间强制执行。无效值被拒绝；更新但有效的值在旧版主机上跳过外部 Plugin。假定捆绑源 Plugin 与主机检出是同版本的。

官方按需安装元数据应在 Plugin 在 ClawHub 上发布时使用 `clawhubSpec`；入门将其视为首选的远程来源，并在安装后记录 ClawHub 工件事实。`npmSpec` 仍然是尚未迁移到 ClawHub 的包的兼容性回退。

精确的 npm 版本固定已存在于 `npmSpec` 中，例如 `"npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3"`。官方外部目录条目应将精确规格与 `expectedIntegrity` 配对，以便在获取的 npm 工件不再匹配固定版本时更新流程以关闭方式失败。交互式入门仍然提供受信任的注册表 npm 规格（包括裸包名称和 dist-tag），以实现兼容性。目录诊断可以区分精确的、浮动的、完整性固定的、缺少完整性的、包名称不匹配和无效的默认选择来源。当 `expectedIntegrity` 存在但没有有效的 npm 来源可以固定时，它们也会发出警告。当 `expectedIntegrity` 存在时，安装/更新流程强制执行它；省略时，注册表解析在没有完整性固定的情况下记录。

当状态、Channel 列表或 SecretRef 扫描需要在不加载完整运行时的情况下识别配置的账户时，Channel Plugin 应提供 `openclaw.setupEntry`。设置条目应公开 Channel 元数据加上设置安全的配置、状态和密钥适配器；将网络客户端、Gateway 监听器和传输运行时保留在主扩展入口点中。

运行时入口点字段不覆盖源入口点字段的包边界检查。例如，`openclaw.runtimeExtensions` 不能使逃逸的 `openclaw.extensions` 路径可加载。

`openclaw.install.allowInvalidConfigRecovery` 是故意保持狭窄的。它不使任意损坏的配置可安装。今天它只允许安装流程从特定的过时捆绑 Plugin 升级失败中恢复，例如缺失的捆绑 Plugin 路径或同一捆绑 Plugin 的过时 `channels.<id>` 条目。不相关的配置错误仍然阻止安装，并将操作员发送到 `openclaw doctor --fix`。

`openclaw.channel.persistedAuthState` 是小型检查器模块的包元数据：

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

当设置、doctor、状态或只读存在流程需要在完整 Channel Plugin 加载之前进行廉价的是/否身份验证探测时使用它。持久化的身份验证状态不是已配置的 Channel 状态：不要使用此元数据自动启用 Plugin、修复运行时依赖项或决定 Channel 运行时是否应加载。目标导出应该是一个只读取持久化状态的小函数；不要通过完整的 Channel 运行时 barrel 路由它。

`openclaw.channel.configuredState` 遵循相同的形状，用于廉价的仅环境配置检查：

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

当 Channel 可以从环境或其他微小的非运行时输入回答配置状态时使用它。如果检查需要完整的配置解析或真正的 Channel 运行时，请将该逻辑保留在 Plugin `config.hasConfiguredState` Hook 中。

## 发现优先级（重复 Plugin ID）

OpenClaw 从多个根发现 Plugin。有关原始文件系统扫描顺序，请参见 [Plugin 扫描顺序](/gateway/configuration-reference#plugin-scan-order)。如果两个发现共享相同的 `id`，只保留**最高优先级**的 Manifest；优先级较低的重复项将被丢弃，而不是在其旁边加载。

优先级，从高到低：

1. **配置选择** — 在 `plugins.entries.<id>` 中明确固定的路径
2. **捆绑** — 随 OpenClaw 一起提供的 Plugin
3. **全局安装** — 安装到全局 OpenClaw Plugin 根目录的 Plugin
4. **工作区** — 相对于当前工作区发现的 Plugin

影响：

- 位于工作区中的捆绑 Plugin 的分叉或过时副本不会遮蔽捆绑构建。
- 要实际用本地 Plugin 覆盖捆绑 Plugin，请通过 `plugins.entries.<id>` 固定它，以便它通过优先级获胜，而不是依赖工作区发现。
- 重复丢弃会被记录，以便 Doctor 和启动诊断可以指向被丢弃的副本。
- 配置选择的重复覆盖在诊断中被措辞为显式覆盖，但仍然发出警告，以便过时的分叉和意外的遮蔽保持可见。

## JSON Schema 要求

- **每个 Plugin 都必须提供 JSON Schema**，即使它不接受任何配置。
- 空 Schema 是可接受的（例如，`{ "type": "object", "additionalProperties": false }`）。
- Schema 在配置读/写时验证，而不是在运行时。
- 当使用新配置键扩展或分叉捆绑 Plugin 时，同时更新该 Plugin 的 `openclaw.plugin.json` `configSchema`。捆绑 Plugin Schema 是严格的，因此在用户配置中添加 `plugins.entries.<id>.config.myNewKey` 而不将 `myNewKey` 添加到 `configSchema.properties` 将在 Plugin 运行时加载之前被拒绝。

示例 Schema 扩展：

```json
{
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "myNewKey": {
        "type": "string"
      }
    }
  }
}
```

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非 Channel ID 由 Plugin Manifest 声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的** Plugin ID。未知 ID 是**错误**。
- 如果 Plugin 已安装但具有损坏或缺失的 Manifest 或 Schema，验证失败，Doctor 报告 Plugin 错误。
- 如果 Plugin 配置存在但 Plugin **被禁用**，配置被保留，并且在 Doctor + 日志中出现**警告**。

有关完整的 `plugins.*` Schema，请参见[配置参考](/gateway/configuration)。

## 注意事项

- Manifest **对于原生 OpenClaw Plugin 是必需的**，包括本地文件系统加载。运行时仍然单独加载 Plugin 模块；Manifest 仅用于发现 + 验证。
- 原生 Manifest 使用 JSON5 解析，因此注释、尾随逗号和未引用的键是可接受的，只要最终值仍然是对象。
- Manifest 加载器仅读取已记录的 Manifest 字段。避免自定义顶层键。
- 当 Plugin 不需要时，`channels`、`providers`、`cliBackends` 和 `skills` 都可以省略。
- `providerCatalogEntry` 必须保持轻量级，不应导入宽泛的运行时代码；将其用于静态 Provider 目录元数据或窄发现描述符，而不是请求时执行。`providerDiscoveryEntry` 是旧版拼写，仍然适用于现有 Plugin。
- 独占 Plugin 类型通过 `plugins.slots.*` 选择：`kind: "memory"` 通过 `plugins.slots.memory`，`kind: "context-engine"` 通过 `plugins.slots.contextEngine`（默认 `legacy`）。
- 在此 Manifest 中声明独占 Plugin 类型。运行时入口 `OpenClawPluginDefinition.kind` 已弃用，仅作为旧版 Plugin 的兼容性回退保留。
- 环境变量元数据（`setup.providers[].envVars`、已弃用的 `providerAuthEnvVars` 和 `channelEnvVars`）仅是声明性的。状态、审计、Cron 投递验证和其他只读界面在将环境变量视为已配置之前仍然应用 Plugin 信任和有效激活策略。
- 有关需要 Provider 代码的运行时向导元数据，请参见 [Provider 运行时 Hook](/plugins/architecture-internals#provider-runtime-hooks)。
- 如果您的 Plugin 依赖于原生模块，请记录构建步骤和任何包管理器允许列表要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

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
