---
mmh3_hash: "14872662b3bf3c77f071e79a0ada39be"
title: Plugin Manifest
summary: 插件 Manifest 及 JSON Schema 要求（严格配置验证）
read_when:
  - 你正在构建一个 OpenClaw 插件
  - 你需要发布插件配置 Schema 或调试插件验证错误
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/manifest.md
  workflow: 15
---

# Plugin Manifest（openclaw.plugin.json）

本页仅适用于**原生 OpenClaw 插件 Manifest**。

关于兼容 Bundle 布局，请参阅 [Plugin Bundles](/plugins/bundles)。

兼容的 Bundle 格式使用不同的 Manifest 文件：

- Codex Bundle：`.codex-plugin/plugin.json`
- Claude Bundle：`.claude-plugin/plugin.json` 或无 Manifest 的默认 Claude 组件布局
- Cursor Bundle：`.cursor-plugin/plugin.json`

OpenClaw 也会自动检测这些 Bundle 布局，但不会按本页描述的 `openclaw.plugin.json` Schema 对其进行验证。

对于兼容 Bundle，OpenClaw 当前读取 Bundle 元数据加上已声明的 Skill 根目录、Claude 命令根目录、Claude Bundle `settings.json` 默认值，以及布局符合 OpenClaw 运行时预期时支持的 Hook 包。

每个原生 OpenClaw 插件**必须**在**插件根目录**中附带 `openclaw.plugin.json` 文件。OpenClaw 使用此 Manifest 在**不执行插件代码**的情况下验证配置。缺失或无效的 Manifest 会被视为插件错误，并阻止配置验证。

完整的插件系统指南：[Plugins](/tools/plugin)。
原生能力模型和当前外部兼容性指南：[能力模型](/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在加载插件代码之前读取的元数据。

适合用于：

- 插件标识
- 配置验证
- 在启动插件运行时之前即需要的认证和引导元数据
- 用于捆绑兼容接入和契约覆盖的静态能力归属快照
- 配置 UI 提示

不适合用于：

- 注册运行时行为
- 声明代码入口点
- npm 安装元数据

这些内容属于你的插件代码和 `package.json`。

## 最简示例

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

## 完整示例

```json
{
  "id": "openrouter",
  "name": "OpenRouter",
  "description": "OpenRouter provider plugin",
  "version": "1.0.0",
  "providers": ["openrouter"],
  "cliBackends": ["openrouter-cli"],
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

| 字段                  | 必填 | 类型                             | 含义                                                                                                                       |
| --------------------- | ---- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `id`                  | 是   | `string`                         | 规范插件 id，即 `plugins.entries.<id>` 中使用的 id。                                                                       |
| `configSchema`        | 是   | `object`                         | 此插件配置的内联 JSON Schema。                                                                                             |
| `enabledByDefault`    | 否   | `true`                           | 将捆绑插件标记为默认启用。省略或设置非 `true` 值则默认禁用。                                                               |
| `kind`                | 否   | `"memory"` \| `"context-engine"` | 声明由 `plugins.slots.*` 使用的独占插件类型。                                                                              |
| `channels`            | 否   | `string[]`                       | 此插件归属的 Channel id，用于发现和配置验证。                                                                              |
| `providers`           | 否   | `string[]`                       | 此插件归属的 Provider id。                                                                                                 |
| `cliBackends`         | 否   | `string[]`                       | 此插件归属的 CLI 推理后端 id，用于从显式配置引用中自动激活。                                                               |
| `providerAuthEnvVars` | 否   | `Record<string, string[]>`       | OpenClaw 无需加载插件代码即可检查的 Provider 认证环境变量元数据。                                                          |
| `providerAuthChoices` | 否   | `object[]`                       | 用于引导选择器、首选 Provider 解析和简单 CLI Flag 接入的认证选项元数据。                                                   |
| `contracts`           | 否   | `object`                         | 用于语音、媒体理解、图像生成、网络搜索和工具归属的静态捆绑能力快照。                                                       |
| `skills`              | 否   | `string[]`                       | 要加载的 Skill 目录，相对于插件根目录。                                                                                    |
| `name`                | 否   | `string`                         | 用户可见的插件名称。                                                                                                       |
| `description`         | 否   | `string`                         | 在插件界面中显示的简短摘要。                                                                                               |
| `version`             | 否   | `string`                         | 插件版本（仅供参考）。                                                                                                     |
| `uiHints`             | 否   | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                                   |

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一个引导或认证选项。OpenClaw 在 Provider 运行时加载之前读取此内容。

| 字段               | 必填 | 类型                                            | 含义                                                                                |
| ------------------ | ---- | ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `provider`         | 是   | `string`                                        | 此选项所属的 Provider id。                                                          |
| `method`           | 是   | `string`                                        | 要分发到的认证方法 id。                                                             |
| `choiceId`         | 是   | `string`                                        | 引导和 CLI 流程使用的稳定认证选项 id。                                              |
| `choiceLabel`      | 否   | `string`                                        | 用户可见的标签。省略时 OpenClaw 回退到 `choiceId`。                                 |
| `choiceHint`       | 否   | `string`                                        | 选择器的简短提示文本。                                                              |
| `groupId`          | 否   | `string`                                        | 用于分组相关选项的可选组 id。                                                       |
| `groupLabel`       | 否   | `string`                                        | 该组的用户可见标签。                                                                |
| `groupHint`        | 否   | `string`                                        | 该组的简短提示文本。                                                                |
| `optionKey`        | 否   | `string`                                        | 用于简单单 Flag 认证流程的内部选项键。                                              |
| `cliFlag`          | 否   | `string`                                        | CLI Flag 名称，如 `--openrouter-api-key`。                                          |
| `cliOption`        | 否   | `string`                                        | 完整的 CLI 选项格式，如 `--openrouter-api-key <key>`。                              |
| `cliDescription`   | 否   | `string`                                        | CLI 帮助中使用的描述。                                                              |
| `onboardingScopes` | 否   | `Array<"text-inference" \| "image-generation">` | 此选项应出现在哪些引导界面中。省略时默认为 `["text-inference"]`。                   |

## uiHints 参考

`uiHints` 是从配置字段名到渲染提示的映射。

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

每个字段提示可以包含：

| 字段          | 类型       | 含义                     |
| ------------- | ---------- | ------------------------ |
| `label`       | `string`   | 用户可见的字段标签。     |
| `help`        | `string`   | 简短提示文本。           |
| `tags`        | `string[]` | 可选的 UI 标签。         |
| `advanced`    | `boolean`  | 将字段标记为高级选项。   |
| `sensitive`   | `boolean`  | 将字段标记为秘密或敏感。 |
| `placeholder` | `string`   | 表单输入的占位符文本。   |

## contracts 参考

`contracts` 仅用于 OpenClaw 无需导入插件运行时即可读取的静态能力归属元数据。

```json
{
  "contracts": {
    "speechProviders": ["openai"],
    "mediaUnderstandingProviders": ["openai", "openai-codex"],
    "imageGenerationProviders": ["openai"],
    "webSearchProviders": ["gemini"],
    "tools": ["firecrawl_search", "firecrawl_scrape"]
  }
}
```

每个列表都是可选的：

| 字段                          | 类型       | 含义                                             |
| ----------------------------- | ---------- | ------------------------------------------------ |
| `speechProviders`             | `string[]` | 此插件归属的语音 Provider id。                   |
| `mediaUnderstandingProviders` | `string[]` | 此插件归属的媒体理解 Provider id。               |
| `imageGenerationProviders`    | `string[]` | 此插件归属的图像生成 Provider id。               |
| `webSearchProviders`          | `string[]` | 此插件归属的网络搜索 Provider id。               |
| `tools`                       | `string[]` | 此插件归属的 Agent 工具名称，用于捆绑契约检查。  |

旧版顶级字段 `speechProviders`、`mediaUnderstandingProviders` 和 `imageGenerationProviders` 已弃用。使用 `openclaw doctor --fix` 将其移至 `contracts` 下；正常的 Manifest 加载不再将其视为能力归属。

## Manifest 与 package.json 的区别

两个文件有不同的用途：

| 文件                   | 用途                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `openclaw.plugin.json` | 发现、配置验证、在插件代码运行前必须存在的认证选项元数据和 UI 提示                                          |
| `package.json`         | npm 元数据、依赖安装，以及用于入口点和设置或目录元数据的 `openclaw` 块                                      |

如果不确定元数据应放在哪里，使用以下规则：

- 如果 OpenClaw 必须在加载插件代码之前知道，放到 `openclaw.plugin.json`
- 如果与打包、入口文件或 npm 安装行为有关，放到 `package.json`

## JSON Schema 要求

- **每个插件都必须提供 JSON Schema**，即使不接受任何配置。
- 空 Schema 是可以接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 在配置读写时验证，而非在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非 Channel id 已由某插件 Manifest 声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的**插件 id。未知 id 是**错误**。
- 如果插件已安装但 Manifest 或 Schema 损坏或缺失，验证失败，Doctor 会报告该插件错误。
- 如果插件配置存在但插件已**禁用**，配置会被保留，Doctor 和日志中会显示**警告**。

完整的 `plugins.*` Schema 请参阅 [配置参考](/gateway/configuration)。

## 注意事项

- Manifest 是**原生 OpenClaw 插件必需的**，包括本地文件系统加载的插件。
- 运行时仍会单独加载插件模块；Manifest 仅用于发现和验证。
- Manifest 加载器只读取有文档记录的 Manifest 字段。避免在此处添加自定义顶级键。
- `providerAuthEnvVars` 是认证探测、环境变量标记验证等不应启动插件运行时即可检查环境变量名的廉价元数据路径。
- `providerAuthChoices` 是认证选项选择器、`--auth-choice` 解析、首选 Provider 映射和简单引导 CLI Flag 注册在 Provider 运行时加载前的廉价元数据路径。对于需要 Provider 代码的运行时向导元数据，请参阅 [Provider 运行时 Hook](/plugins/architecture#provider-runtime-hooks)。
- 独占插件类型通过 `plugins.slots.*` 选择。
  - `kind: "memory"` 通过 `plugins.slots.memory` 选择。
  - `kind: "context-engine"` 通过 `plugins.slots.contextEngine` 选择（默认：内置 `legacy`）。
- 当插件不需要时，可以省略 `channels`、`providers`、`cliBackends` 和 `skills`。
- 如果你的插件依赖原生模块，请记录构建步骤和任何包管理器允许列表要求（例如 pnpm `allow-build-scripts` 及 `pnpm rebuild <package>`）。
