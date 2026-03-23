---
mmh3_hash: "db8cfd7fc1ea444dc44912432ac1d70c"
title: "Plugin 入口点"
sidebarTitle: "入口点"
summary: "definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 的参考文档"
read_when:
  - 您需要 definePluginEntry 或 defineChannelPluginEntry 的确切类型签名
  - 您想了解注册模式（full vs setup）
  - 您正在查找入口点选项
---

# Plugin 入口点

每个 Plugin 导出一个默认入口对象。SDK 提供三个辅助工具来创建它们。

<Tip>
  **正在寻找演练？** 请参见 [Channel Plugin](/plugins/sdk-channel-plugins) 或 [Provider Plugin](/plugins/sdk-provider-plugins) 获取分步指南。
</Tip>

## `definePluginEntry`

**导入：** `openclaw/plugin-sdk/plugin-entry`

用于 Provider Plugin、Tool Plugin、Hook Plugin 以及**非**消息 Channel 的任何其他 Plugin。

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

| 字段           | 类型                                                             | 必需 | 默认值              |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`           | `string`                                                         | 是   | —                   |
| `name`         | `string`                                                         | 是   | —                   |
| `description`  | `string`                                                         | 是   | —                   |
| `kind`         | `string`                                                         | 否   | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象模式          |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是   | —                   |

- `id` 必须与 `openclaw.plugin.json` 清单匹配。
- `kind` 用于专有槽：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是函数以进行延迟求值。

## `defineChannelPluginEntry`

**导入：** `openclaw/plugin-sdk/core`

包装 `definePluginEntry` 并添加 Channel 特定的连接。自动调用 `api.registerChannel({ plugin })` 并在注册模式上对 `registerFull` 进行门控。

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";

export default defineChannelPluginEntry({
  id: "my-channel",
  name: "My Channel",
  description: "Short summary",
  plugin: myChannelPlugin,
  setRuntime: setMyRuntime,
  registerFull(api) {
    api.registerCli(/* ... */);
    api.registerGatewayMethod(/* ... */);
  },
});
```

| 字段           | 类型                                                             | 必需 | 默认值              |
| -------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`           | `string`                                                         | 是   | —                   |
| `name`         | `string`                                                         | 是   | —                   |
| `description`  | `string`                                                         | 是   | —                   |
| `plugin`       | `ChannelPlugin`                                                  | 是   | —                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象模式          |
| `setRuntime`   | `(runtime: PluginRuntime) => void`                               | 否   | —                   |
| `registerFull` | `(api: OpenClawPluginApi) => void`                               | 否   | —                   |

- `setRuntime` 在注册期间被调用，以便您可以存储运行时引用（通常通过 `createPluginRuntimeStore`）。
- `registerFull` 仅在 `api.registrationMode === "full"` 时运行。在仅设置加载期间会被跳过。

## `defineSetupPluginEntry`

**导入：** `openclaw/plugin-sdk/core`

用于轻量级 `setup-entry.ts` 文件。只返回 `{ plugin }`，没有运行时或 CLI 连接。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";

export default defineSetupPluginEntry(myChannelPlugin);
```

当 Channel 被禁用、未配置或启用延迟加载时，OpenClaw 加载此文件而不是完整入口。详见 [设置和配置](/plugins/sdk-setup#setup-entry)。

## 注册模式

`api.registrationMode` 告诉 Plugin 它是如何加载的：

| 模式              | 时机                          | 注册内容                          |
| ----------------- | ----------------------------- | --------------------------------- |
| `"full"`          | 正常 Gateway 启动             | 所有内容                          |
| `"setup-only"`    | 禁用/未配置的 Channel         | 仅 Channel 注册                   |
| `"setup-runtime"` | 具有可用运行时的设置流程      | Channel + 轻量运行时              |

`defineChannelPluginEntry` 自动处理此分割。如果您直接将 `definePluginEntry` 用于 Channel，请自行检查模式：

```typescript
register(api) {
  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 仅运行时的重量级注册
  api.registerCli(/* ... */);
  api.registerService(/* ... */);
}
```

## Plugin 形态

OpenClaw 根据注册行为对加载的 Plugin 进行分类：

| 形态                  | 描述                                               |
| --------------------- | -------------------------------------------------- |
| **plain-capability**  | 一种能力类型（例如仅 Provider）                    |
| **hybrid-capability** | 多种能力类型（例如 Provider + 语音）               |
| **hook-only**         | 仅 Hook，无能力                                    |
| **non-capability**    | Tool/命令/服务但无能力                             |

使用 `openclaw plugins inspect <id>` 查看 Plugin 的形态。

## 相关

- [SDK 概览](/plugins/sdk-overview) — 注册 API 和子路径参考
- [运行时辅助工具](/plugins/sdk-runtime) — `api.runtime` 和 `createPluginRuntimeStore`
- [设置和配置](/plugins/sdk-setup) — 清单、设置入口、延迟加载
- [Channel Plugin](/plugins/sdk-channel-plugins) — 构建 `ChannelPlugin` 对象
- [Provider Plugin](/plugins/sdk-provider-plugins) — Provider 注册和 Hook
