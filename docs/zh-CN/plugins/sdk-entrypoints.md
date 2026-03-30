---
mmh3_hash: "ae122341db9f31c42a48712625fd09c9"
title: Plugin Entry Points
sidebarTitle: Entry Points
summary: definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 参考
read_when:
  - 你需要 definePluginEntry 或 defineChannelPluginEntry 的精确类型签名
  - 你想了解注册模式（full vs setup vs CLI 元数据）
  - 你在查找 Entry Point 选项
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/sdk-entrypoints.md
  workflow: 15
---

# Plugin Entry Points

每个插件都导出一个默认 Entry 对象。SDK 提供了三个辅助工具来创建它们。

<Tip>
  **在找操作演练？** 请参阅 [Channel 插件](/plugins/sdk-channel-plugins) 或 [Provider 插件](/plugins/sdk-provider-plugins) 的分步指南。
</Tip>

## `definePluginEntry`

**导入路径：** `openclaw/plugin-sdk/plugin-entry`

适用于 Provider 插件、工具插件、Hook 插件，以及**非**消息 Channel 的所有插件。

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  description: "Short summary",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
  },
});
```

| 字段           | 类型                                                             | 必填 | 默认值              |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`           | `string`                                                         | 是   | —                   |
| `name`         | `string`                                                         | 是   | —                   |
| `description`  | `string`                                                         | 是   | —                   |
| `kind`         | `string`                                                         | 否   | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空 object schema    |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是   | —                   |

- `id` 必须与你的 `openclaw.plugin.json` Manifest 匹配。
- `kind` 用于独占 Slot：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是函数，用于延迟求值。

## `defineChannelPluginEntry`

**导入路径：** `openclaw/plugin-sdk/core`

对 `definePluginEntry` 的包装，添加了 Channel 特定接入。自动调用 `api.registerChannel({ plugin })`，暴露可选的根帮助 CLI 元数据接口，并根据注册模式门控 `registerFull`。

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerCliMetadata(api) {
    api.registerCli(/* ... */);
  },
  registerFull(api) {
    api.registerGatewayMethod(/* ... */);
  },
});
```

| 字段                  | 类型                                                             | 必填 | 默认值              |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`                  | `string`                                                         | 是   | —                   |
| `name`                | `string`                                                         | 是   | —                   |
| `description`         | `string`                                                         | 是   | —                   |
| `plugin`              | `ChannelPlugin`                                                  | 是   | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空 object schema    |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | —                   |

- `setRuntime` 在注册期间被调用，用于存储运行时引用（通常通过 `createPluginRuntimeStore`）。在 CLI 元数据捕获期间会被跳过。
- `registerCliMetadata` 在 `api.registrationMode === "cli-metadata"` 和 `api.registrationMode === "full"` 两种情况下都会运行。将其作为 Channel 拥有的 CLI 描述符的规范位置，这样根帮助在正常 CLI 命令注册与完整插件加载兼容的同时，保持非激活状态。
- `registerFull` 仅在 `api.registrationMode === "full"` 时运行。在仅设置加载期间会被跳过。
- 对于插件拥有的根 CLI 命令，如果希望命令在不从根 CLI 解析树中消失的情况下保持懒加载，优先使用 `api.registerCli(..., { descriptors: [...] })`。对于 Channel 插件，优先在 `registerCliMetadata(...)` 中注册这些描述符，保持 `registerFull(...)` 专注于仅运行时的工作。

## `defineSetupPluginEntry`

**导入路径：** `openclaw/plugin-sdk/core`

适用于轻量级 `setup-entry.ts` 文件。仅返回 `{ plugin }`，不进行运行时或 CLI 接入。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";

export default defineSetupPluginEntry(myChannelPlugin);
```

当 Channel 被禁用、未配置或启用延迟加载时，OpenClaw 会加载此文件而非完整 Entry。具体情况请参阅 [设置和配置](/plugins/sdk-setup#setup-entry)。

## 注册模式

`api.registrationMode` 告诉插件它是如何被加载的：

| 模式              | 时机                          | 应注册的内容              |
| ----------------- | ----------------------------- | ------------------------- |
| `"full"`          | 正常 Gateway 启动             | 所有内容                  |
| `"setup-only"`    | 已禁用/未配置的 Channel        | 仅 Channel 注册           |
| `"setup-runtime"` | 运行时可用的设置流程           | Channel + 轻量级运行时    |
| `"cli-metadata"`  | 根帮助 / CLI 元数据捕获       | 仅 CLI 描述符             |

`defineChannelPluginEntry` 自动处理这种分离。如果你直接使用 `definePluginEntry` 处理 Channel，需要自行检查模式：

```typescript
register(api) {
  if (api.registrationMode === "cli-metadata" || api.registrationMode === "full") {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 仅运行时的重量级注册
  api.registerService(/* ... */);
}
```

对于 CLI 注册器，具体来说：

- 当注册器拥有一个或多个根命令且希望 OpenClaw 在首次调用时懒加载实际 CLI 模块时，使用 `descriptors`
- 确保这些描述符覆盖该注册器暴露的每个顶级命令根
- 仅在急加载兼容路径时单独使用 `commands`

## 插件形态

OpenClaw 根据注册行为对已加载的插件进行分类：

| 形态                  | 描述                                           |
| --------------------- | ---------------------------------------------- |
| **plain-capability**  | 一种能力类型（如仅 Provider）                   |
| **hybrid-capability** | 多种能力类型（如 Provider + 语音）              |
| **hook-only**         | 仅有 Hook，没有能力                             |
| **non-capability**    | 有工具/命令/服务，但没有能力                    |

使用 `openclaw plugins inspect <id>` 查看插件的形态。

## 相关文档

- [SDK Overview](/plugins/sdk-overview) — 注册 API 和子路径参考
- [运行时辅助工具](/plugins/sdk-runtime) — `api.runtime` 和 `createPluginRuntimeStore`
- [设置和配置](/plugins/sdk-setup) — Manifest、Setup Entry、延迟加载
- [Channel 插件](/plugins/sdk-channel-plugins) — 构建 `ChannelPlugin` 对象
- [Provider 插件](/plugins/sdk-provider-plugins) — Provider 注册和 Hook
