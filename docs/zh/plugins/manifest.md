---
mmh3_hash: "009ff0352d838097c3e0101176c41438"
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

`openclaw.plugin.json` 是 OpenClaw 在加载 Plugin 代码之前读取的元数据。

用于：

- Plugin 身份标识
- 配置验证
- 不启动 Plugin 运行时即可获取的身份验证和入门元数据
- 在 Plugin 运行时加载之前应解析的别名和自动启用元数据
- 应在运行时加载之前自动激活 Plugin 的简写模型系列所有权元数据
- 用于打包兼容连接和契约覆盖的静态能力所有权快照
- 在不加载运行时的情况下应合并到目录和验证接口中的 Channel 特定配置元数据
- 配置 UI 提示

不用于：

- 注册运行时行为
- 声明代码入口点
- npm 安装元数据

这些内容属于您的 Plugin 代码和 `package.json`。

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
  "providerAuthEnvVars": {
    "openrouter": ["OPENROUTER_API_KEY"]
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

| 字段                                | 必需 | 类型                             | 含义                                                                                                                                                                                                         |
| ----------------------------------- | ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `id`                                | 是   | `string`                         | 规范 Plugin id，用于 `plugins.entries.<id>` 中。                                                                                                                                                             |
| `configSchema`                      | 是   | `object`                         | 此 Plugin 配置的内联 JSON Schema。                                                                                                                                                                           |
| `enabledByDefault`                  | 否   | `true`                           | 将打包 Plugin 标记为默认启用。省略或设置任何非 `true` 值，Plugin 默认禁用。                                                                                                                                  |
| `legacyPluginIds`                   | 否   | `string[]`                       | 规范化到此规范 Plugin id 的旧版 id。                                                                                                                                                                         |
| `autoEnableWhenConfiguredProviders` | 否   | `string[]`                       | 当身份验证、配置或模型引用提到这些 Provider id 时应自动启用此 Plugin 的 Provider id。                                                                                                                        |
| `kind`                              | 否   | `"memory"` \| `"context-engine"` | 声明 `plugins.slots.*` 使用的专有 Plugin 类型。                                                                                                                                                              |
| `channels`                          | 否   | `string[]`                       | 此 Plugin 拥有的 Channel id，用于发现和配置验证。                                                                                                                                                            |
| `providers`                         | 否   | `string[]`                       | 此 Plugin 拥有的 Provider id。                                                                                                                                                                               |
| `modelSupport`                      | 否   | `object`                         | 清单拥有的简写模型系列元数据，用于在运行时之前自动加载 Plugin。                                                                                                                                              |
| `providerAuthEnvVars`               | 否   | `Record<string, string[]>`       | 廉价 Provider 身份验证环境变量元数据，OpenClaw 可以在不加载 Plugin 代码的情况下检查。                                                                                                                        |
| `providerAuthChoices`               | 否   | `object[]`                       | 用于入门选择器、首选 Provider 解析和简单 CLI 标志连接的廉价身份验证选择元数据。                                                                                                                              |
| `contracts`                         | 否   | `object`                         | 用于语音、实时转录、实时语音、媒体理解、图像生成、音乐生成、视频生成、Web 抓取、Web 搜索和 Tool 所有权的静态打包能力快照。                                                                                    |
| `channelConfigs`                    | 否   | `Record<string, object>`         | 在运行时加载之前合并到发现和验证接口的清单拥有 Channel 配置元数据。                                                                                                                                          |
| `skills`                            | 否   | `string[]`                       | 要加载的 Skill 目录，相对于 Plugin 根目录。                                                                                                                                                                  |
| `name`                              | 否   | `string`                         | 人类可读的 Plugin 名称。                                                                                                                                                                                     |
| `description`                       | 否   | `string`                         | Plugin 接口中显示的简短摘要。                                                                                                                                                                                |
| `version`                           | 否   | `string`                         | 信息性 Plugin 版本。                                                                                                                                                                                         |
| `uiHints`                           | 否   | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                                                                                                     |

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一个入门或身份验证选择。OpenClaw 在 Provider 运行时加载之前读取此内容。

| 字段                  | 必需 | 类型                                            | 含义                                                                                                |
| --------------------- | ---- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `provider`            | 是   | `string`                                        | 此选择所属的 Provider id。                                                                          |
| `method`              | 是   | `string`                                        | 要分发到的身份验证方法 id。                                                                         |
| `choiceId`            | 是   | `string`                                        | 入门和 CLI 流程使用的稳定身份验证选择 id。                                                          |
| `choiceLabel`         | 否   | `string`                                        | 面向用户的标签。省略时，OpenClaw 回退到 `choiceId`。                                                |
| `choiceHint`          | 否   | `string`                                        | 选择器的简短辅助文本。                                                                              |
| `assistantPriority`   | 否   | `number`                                        | 较低的值在助手驱动的交互选择器中排序较早。                                                          |
| `assistantVisibility` | 否   | `"visible"` \| `"manual-only"`                  | 在助手选择器中隐藏选择，同时仍允许手动 CLI 选择。                                                   |
| `deprecatedChoiceIds` | 否   | `string[]`                                      | 应将用户重定向到此替换选择的旧版选择 id。                                                           |
| `groupId`             | 否   | `string`                                        | 用于分组相关选择的可选组 id。                                                                       |
| `groupLabel`          | 否   | `string`                                        | 该组的面向用户标签。                                                                                |
| `groupHint`           | 否   | `string`                                        | 该组的简短辅助文本。                                                                                |
| `optionKey`           | 否   | `string`                                        | 简单单标志身份验证流程的内部选项键。                                                                |
| `cliFlag`             | 否   | `string`                                        | CLI 标志名称，例如 `--openrouter-api-key`。                                                         |
| `cliOption`           | 否   | `string`                                        | 完整 CLI 选项形状，例如 `--openrouter-api-key <key>`。                                              |
| `cliDescription`      | 否   | `string`                                        | CLI 帮助中使用的描述。                                                                              |
| `onboardingScopes`    | 否   | `Array<"text-inference" \| "image-generation">` | 此选择应出现在哪些入门接口中。省略时，默认为 `["text-inference"]`。                                  |

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
    "speechProviders": ["openai"],
    "realtimeTranscriptionProviders": ["openai"],
    "realtimeVoiceProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "videoGenerationProviders": ["qwen"],
    "webFetchProviders": ["firecrawl"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每个列表都是可选的：

| 字段                             | 类型       | 含义                                                           |
| -------------------------------- | ---------- | -------------------------------------------------------------- |
| `speechProviders`                | `string[]` | 此 Plugin 拥有的语音 Provider id。                             |
| `realtimeTranscriptionProviders` | `string[]` | 此 Plugin 拥有的实时转录 Provider id。                         |
| `realtimeVoiceProviders`         | `string[]` | 此 Plugin 拥有的实时语音 Provider id。                         |
| `mediaUnderstandingProviders`    | `string[]` | 此 Plugin 拥有的媒体理解 Provider id。                         |
| `imageGenerationProviders`       | `string[]` | 此 Plugin 拥有的图像生成 Provider id。                         |
| `videoGenerationProviders`       | `string[]` | 此 Plugin 拥有的视频生成 Provider id。                         |
| `webFetchProviders`              | `string[]` | 此 Plugin 拥有的 Web 抓取 Provider id。                        |
| `webSearchProviders`             | `string[]` | 此 Plugin 拥有的 Web 搜索 Provider id。                        |
| `tools`                          | `string[]` | 此 Plugin 拥有的 Agent Tool 名称，用于打包契约检查。           |

## channelConfigs 参考

当 Channel Plugin 在运行时加载之前需要廉价配置元数据时，使用 `channelConfigs`。

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
| `preferOver`  | `string[]`               | 此 Channel 在选择接口中应优先于的旧版或较低优先级 Plugin id。                           |

## modelSupport 参考

当 OpenClaw 应该在 Plugin 运行时加载之前从简写模型 id（如 `gpt-5.4` 或 `claude-sonnet-4.6`）推断您的 Provider Plugin 时，使用 `modelSupport`。

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

| 字段                                                              | 含义                                                                                                                                         |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `openclaw.extensions`                                             | 声明原生 Plugin 入口点。                                                                                                                     |
| `openclaw.setupEntry`                                             | 在入门和延迟 Channel 启动期间使用的轻量级仅设置入口点。                                                                                      |
| `openclaw.channel`                                                | 廉价 Channel 目录元数据，如标签、文档路径、别名和选择副本。                                                                                  |
| `openclaw.channel.configuredState`                                | 轻量级已配置状态检查器元数据，可以在不加载完整 Channel 运行时的情况下回答"是否已存在仅环境设置？"                                           |
| `openclaw.channel.persistedAuthState`                             | 轻量级持久化身份验证状态检查器元数据，可以在不加载完整 Channel 运行时的情况下回答"是否有任何已登录内容？"                                    |
| `openclaw.install.npmSpec` / `openclaw.install.localPath`         | 打包和外部发布 Plugin 的安装/更新提示。                                                                                                      |
| `openclaw.install.defaultChoice`                                  | 当多个安装来源可用时的首选安装路径。                                                                                                         |
| `openclaw.install.minHostVersion`                                 | 最低支持的 OpenClaw 主机版本，使用类似 `>=2026.3.22` 的 semver 下限。                                                                        |
| `openclaw.install.allowInvalidConfigRecovery`                     | 允许在配置无效时采用窄的打包 Plugin 重新安装恢复路径。                                                                                       |
| `openclaw.startup.deferConfiguredChannelFullLoadUntilAfterListen` | 让仅设置的 Channel 接口在启动期间在完整 Channel Plugin 之前加载。                                                                            |

`openclaw.install.minHostVersion` 在安装和清单注册表加载期间强制执行。无效值被拒绝；较新但有效的值会跳过旧主机上的 Plugin。

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

- 清单对**原生 OpenClaw Plugin 都是必需的**，包括本地文件系统加载。
- 运行时仍然单独加载 Plugin 模块；清单仅用于发现 + 验证。
- 原生清单使用 JSON5 解析，因此只要最终值仍然是对象，注释、尾随逗号和不带引号的键都是允许的。
- 清单加载器只读取已记录的清单字段。避免在此处添加自定义顶级键。
- `providerAuthEnvVars` 是用于身份验证探测、环境变量标记验证等不应启动 Plugin 运行时来检查环境变量名的 Provider 身份验证接口的廉价元数据路径。
- `providerAuthChoices` 是用于身份验证选择选择器、`--auth-choice` 解析、首选 Provider 映射和简单入门 CLI 标志注册的廉价元数据路径（在 Provider 运行时加载之前）。关于需要 Provider 代码的运行时向导元数据，请参见 [Provider 运行时 Hook](/plugins/architecture#provider-runtime-hooks)。
- 专属 Plugin 类型通过 `plugins.slots.*` 选择。
  - `kind: "memory"` 通过 `plugins.slots.memory` 选择。
  - `kind: "context-engine"` 通过 `plugins.slots.contextEngine` 选择（默认：内置 `legacy`）。
- 当 Plugin 不需要 `channels`、`providers` 和 `skills` 时，可以省略它们。
- 如果您的 Plugin 依赖于本机模块，请记录构建步骤和任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。

## 相关

- [构建 Plugin](/plugins/building-plugins) — Plugin 入门指南
- [Plugin 架构](/plugins/architecture) — 内部架构
- [SDK 概览](/plugins/sdk-overview) — Plugin SDK 参考
