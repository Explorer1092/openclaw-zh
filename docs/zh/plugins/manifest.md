---
mmh3_hash: "937a23110f9a4ff8bd02bb01affb9e3f"
summary: "插件清单 + JSON 架构要求(严格配置验证)"
read_when:
  - 您正在构建 OpenClaw 插件
  - 您需要提供插件配置架构或调试插件验证错误
---
# 插件清单(openclaw.plugin.json)

每个插件**必须**在**插件根目录**中提供 `openclaw.plugin.json` 文件。
OpenClaw 使用此清单在**不执行插件代码**的情况下验证配置。缺少或无效的清单被视为插件错误并阻止配置验证。

请参见完整的插件系统指南: [插件](/plugin)。

## 必需字段

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

必需键:
- `id`(字符串): 规范插件 id。
- `configSchema`(对象): 插件配置的 JSON Schema(内联)。

可选键:
- `kind`(字符串): 插件类型(示例: `"memory"`)。
- `channels`(数组): 此插件注册的通道 id(示例: `["matrix"]`)。
- `providers`(数组): 此插件注册的提供程序 id。
- `skills`(数组): 要加载的技能目录(相对于插件根目录)。
- `name`(字符串): 插件的显示名称。
- `description`(字符串): 简短的插件摘要。
- `uiHints`(对象): 用于 UI 呈现的配置字段标签/占位符/敏感标志。
- `version`(字符串): 插件版本(信息性)。

## JSON Schema 要求

- **每个插件都必须提供 JSON Schema**,即使它不接受配置。
- 空架构是可接受的(例如 `{ "type": "object", "additionalProperties": false }`)。
- 架构在配置读/写时验证,而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**,除非通道 id 由插件清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的**插件 id。未知 id 是**错误**。
- 如果插件已安装但清单或架构损坏或缺失,验证失败,Doctor 报告插件错误。
- 如果插件配置存在但插件**已禁用**,配置将保留,并在 Doctor + 日志中显示**警告**。

## 注意事项

- 清单对**所有插件都是必需的**,包括本地文件系统加载。
- 运行时仍然单独加载插件模块;清单仅用于发现 + 验证。
- 如果您的插件依赖于本机模块,请记录构建步骤和任何包管理器允许列表要求(例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`)。
