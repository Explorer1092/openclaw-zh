---
mmh3_hash: "3965f012677574575f0d2519b6720151"
summary: "Plugin 清单 + JSON schema 要求(严格配置验证)"
read_when:
  - 您正在构建 OpenClaw Plugin
  - 您需要提供 Plugin 配置 schema 或调试 Plugin 验证错误
title: "Plugin 清单"
---

# Plugin 清单(openclaw.plugin.json)

每个 Plugin **必须**在 **Plugin 根目录**中提供 `openclaw.plugin.json` 文件。
OpenClaw 使用此清单在**不执行 Plugin 代码**的情况下验证配置。缺少或无效的清单被视为 Plugin 错误并阻止配置验证。

请参见完整的 Plugin 系统指南: [Plugin](/plugin)。

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

- `id`(字符串): 规范 Plugin id。
- `configSchema`(对象): Plugin 配置的 JSON Schema(内联)。

可选键:

- `kind`(字符串): Plugin 类型(示例: `"memory"`)。
- `channels`(数组): 此 Plugin 注册的 channel id(示例: `["matrix"]`)。
- `providers`(数组): 此 Plugin 注册的 provider id。
- `skills`(数组): 要加载的 skill 目录(相对于 Plugin 根目录)。
- `name`(字符串): Plugin 的显示名称。
- `description`(字符串): 简短的 Plugin 摘要。
- `uiHints`(对象): 用于 UI 呈现的配置字段标签/占位符/敏感标志。
- `version`(字符串): Plugin 版本(信息性)。

## JSON Schema 要求

- **每个 Plugin 都必须提供 JSON Schema**,即使它不接受配置。
- 空 schema 是可接受的(例如 `{ "type": "object", "additionalProperties": false }`)。
- Schema 在配置读/写时验证,而不是在运行时验证。

## 验证行为

- 未知的 `channels.*` 键是**错误**,除非 channel id 由 Plugin 清单声明。
- `plugins.entries.<id>`、`plugins.allow`、`plugins.deny` 和 `plugins.slots.*` 必须引用**可发现的** Plugin id。未知 id 是**错误**。
- 如果 Plugin 已安装但清单或 schema 损坏或缺失,验证失败,Doctor 报告 Plugin 错误。
- 如果 Plugin 配置存在但 Plugin **已禁用**,配置将保留,并在 Doctor + 日志中显示**警告**。

## 注意事项

- 清单对**所有 Plugin 都是必需的**,包括本地文件系统加载。
- 运行时仍然单独加载 Plugin 模块;清单仅用于发现 + 验证。
- 如果您的 Plugin 依赖于本机模块,请记录构建步骤和任何包管理器 allowlist 要求(例如 pnpm `allow-build-scripts` + `pnpm rebuild <package>`)。
