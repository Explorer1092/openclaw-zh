---
mmh3_hash: "901ab132228077c8bfde385b2e7f00cd"
summary: "Plugin 清单 + JSON Schema 要求（严格配置验证）"
read_when:
  - 您正在构建 OpenClaw Plugin
  - 您需要提供 Plugin 配置模式或调试 Plugin 验证错误
title: "Plugin 清单"
---

# Plugin 清单（openclaw.plugin.json）

本页仅针对**原生 OpenClaw Plugin 清单**。

对于兼容的 Bundle 布局，请参见 [Plugin Bundle](/plugins/bundles)。

每个原生 OpenClaw Plugin **必须**在 **Plugin 根目录**中提供 `openclaw.plugin.json` 文件。OpenClaw 使用此清单在**不执行 Plugin 代码**的情况下验证配置。缺少或无效的清单被视为 Plugin 错误并阻止配置验证。

请参见完整的 Plugin 系统指南：[Plugins](/tools/plugin)。
原生能力模型和当前外部兼容性指导：[能力模型](/plugins/architecture#public-capability-model)。

## 此文件的作用

`openclaw.plugin.json` 是 OpenClaw 在加载 Plugin 代码之前读取的元数据。

用于：

- Plugin 身份标识
- 配置验证
- 不启动 Plugin 运行时即可获取的身份验证和入门元数据
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

| 字段                  | 必需 | 类型                             | 含义                                                                                                       |
| --------------------- | ---- | -------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `id`                  | 是   | `string`                         | 规范 Plugin id，用于 `plugins.entries.<id>` 中。                                                           |
| `configSchema`        | 是   | `object`                         | 此 Plugin 配置的内联 JSON Schema。                                                                         |
| `enabledByDefault`    | 否   | `true`                           | 将打包 Plugin 标记为默认启用。省略或设置任何非 `true` 值，Plugin 默认禁用。                                |
| `kind`                | 否   | `"memory"` \| `"context-engine"` | 声明 `plugins.slots.*` 使用的专有 Plugin 类型。                                                            |
| `channels`            | 否   | `string[]`                       | 此 Plugin 拥有的 Channel id，用于发现和配置验证。                                                          |
| `providers`           | 否   | `string[]`                       | 此 Plugin 拥有的 Provider id。                                                                             |
| `providerAuthEnvVars` | 否   | `Record<string, string[]>`       | 廉价 Provider 身份验证环境变量元数据，OpenClaw 可以在不加载 Plugin 代码的情况下检查。                       |
| `providerAuthChoices` | 否   | `object[]`                       | 用于入门选择器、首选 Provider 解析和简单 CLI 标志连接的廉价身份验证选择元数据。                             |
| `skills`              | 否   | `string[]`                       | 要加载的 Skill 目录，相对于 Plugin 根目录。                                                                |
| `name`                | 否   | `string`                         | 人类可读的 Plugin 名称。                                                                                   |
| `description`         | 否   | `string`                         | Plugin 接口中显示的简短摘要。                                                                              |
| `version`             | 否   | `string`                         | 信息性 Plugin 版本。                                                                                       |
| `uiHints`             | 否   | `Record<string, object>`         | 配置字段的 UI 标签、占位符和敏感性提示。                                                                   |

## providerAuthChoices 参考

每个 `providerAuthChoices` 条目描述一个入门或身份验证选择。OpenClaw 在 Provider 运行时加载之前读取此内容。

| 字段               | 必需 | 类型                                            | 含义                                                                                                |
| ------------------ | ---- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `provider`         | 是   | `string`                                        | 此选择所属的 Provider id。                                                                          |
| `method`           | 是   | `string`                                        | 要分发到的身份验证方法 id。                                                                         |
| `choiceId`         | 是   | `string`                                        | 入门和 CLI 流程使用的稳定身份验证选择 id。                                                          |
| `choiceLabel`      | 否   | `string`                                        | 面向用户的标签。省略时，OpenClaw 回退到 `choiceId`。                                                |
| `choiceHint`       | 否   | `string`                                        | 选择器的简短辅助文本。                                                                              |
| `groupId`          | 否   | `string`                                        | 用于分组相关选择的可选组 id。                                                                       |
| `groupLabel`       | 否   | `string`                                        | 该组的面向用户标签。                                                                                |
| `groupHint`        | 否   | `string`                                        | 该组的简短辅助文本。                                                                                |
| `optionKey`        | 否   | `string`                                        | 简单单标志身份验证流程的内部选项键。                                                                |
| `cliFlag`          | 否   | `string`                                        | CLI 标志名称，例如 `--openrouter-api-key`。                                                         |
| `cliOption`        | 否   | `string`                                        | 完整 CLI 选项形状，例如 `--openrouter-api-key <key>`。                                              |
| `cliDescription`   | 否   | `string`                                        | CLI 帮助中使用的描述。                                                                              |
| `onboardingScopes` | 否   | `Array<"text-inference" \| "image-generation">` | 此选择应出现在哪些入门接口中。省略时，默认为 `["text-inference"]`。                                  |

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

## 清单与 package.json

这两个文件服务于不同的目的：

| 文件                   | 用途                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `openclaw.plugin.json` | 在 Plugin 代码运行之前必须存在的发现、配置验证、身份验证选择元数据和 UI 提示                                         |
| `package.json`         | npm 元数据、依赖项安装以及用于入口点和设置或目录元数据的 `openclaw` 块                                               |

## JSON Schema 要求

- **每个 Plugin 都必须提供 JSON Schema**，即使它不接受配置。
- 空模式是可接受的（例如 `{ "type": "object", "additionalProperties": false }`）。
- Schema 在配置读/写时验证，而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**，除非 Channel id 由 Plugin 清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的** Plugin id。未知 id 是**错误**。
- 如果 Plugin 已安装但清单或模式损坏或缺失，验证失败，Doctor 报告 Plugin 错误。
- 如果 Plugin 配置存在但 Plugin **已禁用**，配置将保留，并在 Doctor + 日志中显示**警告**。

## 注意事项

- 清单对**原生 OpenClaw Plugin 都是必需的**，包括本地文件系统加载。
- 运行时仍然单独加载 Plugin 模块；清单仅用于发现 + 验证。
- `providerAuthEnvVars` 是用于身份验证探测、环境变量标记验证等不应启动 Plugin 运行时来检查环境变量名的 Provider 身份验证接口的廉价元数据路径。
- `providerAuthChoices` 是用于身份验证选择选择器、`--auth-choice` 解析、首选 Provider 映射和简单入门 CLI 标志注册的廉价元数据路径（在 Provider 运行时加载之前）。
- 专属 Plugin 类型通过 `plugins.slots.*` 选择。
  - `kind: "memory"` 通过 `plugins.slots.memory` 选择。
  - `kind: "context-engine"` 通过 `plugins.slots.contextEngine` 选择（默认：内置 `legacy`）。
- 如果您的 Plugin 依赖于本机模块，请记录构建步骤和任何包管理器 allowlist 要求（例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`）。
