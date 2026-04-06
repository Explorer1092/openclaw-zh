---
mmh3_hash: "62803fdeffa6eb115cefa63c083aa078"
title: "Plugin 入口点"
sidebarTitle: "入口点"
summary: "definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 的参考文档"
read_when:
  - 您需要 definePluginEntry 或 defineChannelPluginEntry 的确切类型签名
  - 您想了解注册模式（full vs setup vs CLI metadata）
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
- OpenClaw 在第一次访问时解析并记忆该 Schema，因此昂贵的 Schema 构建器只运行一次。

## `defineChannelPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

包装 `definePluginEntry` 并添加 Channel 特定的连接。自动调用 `api.registerChannel({ plugin })`，暴露一个可选的根帮助 CLI 元数据接缝，并在注册模式上对 `registerFull` 进行门控。

```typescript
import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";

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

| 字段                  | 类型                                                             | 必需 | 默认值              |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`                  | `string`                                                         | 是   | —                   |
| `name`                | `string`                                                         | 是   | —                   |
| `description`         | `string`                                                         | 是   | —                   |
| `plugin`              | `ChannelPlugin`                                                  | 是   | —                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象模式          |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | —                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | —                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | —                   |

- `setRuntime` 在注册期间被调用，以便您可以存储运行时引用（通常通过 `createPluginRuntimeStore`）。在 CLI 元数据捕获期间会被跳过。
- `registerCliMetadata` 在 `api.registrationMode === "cli-metadata"` 和 `api.registrationMode === "full"` 期间都会运行。将其用作 Channel 自有 CLI 描述符的规范位置，使根帮助保持非激活状态，同时正常 CLI 命令注册与完整 Plugin 加载保持兼容。
- `registerFull` 仅在 `api.registrationMode === "full"` 时运行。在仅设置加载期间会被跳过。
- 与 `definePluginEntry` 一样，`configSchema` 可以是延迟工厂函数，OpenClaw 在第一次访问时记忆解析后的 Schema。
- 对于 Plugin 自有的根 CLI 命令，当您希望命令保持延迟加载而不从根 CLI 解析树中消失时，优先使用 `api.registerCli(..., { descriptors: [...] })`。对于 Channel Plugin，优先从 `registerCliMetadata(...)` 注册这些描述符，并让 `registerFull(...)` 专注于仅运行时的工作。
- 如果 `registerFull(...)` 也注册 Gateway RPC 方法，请将它们保持在 Plugin 特定的前缀下。保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终被强制转换为 `operator.admin`。

## `defineSetupPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

用于轻量级 `setup-entry.ts` 文件。只返回 `{ plugin }`，没有运行时或 CLI 连接。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

当 Channel 被禁用、未配置或启用延迟加载时，OpenClaw 加载此文件而不是完整入口。详见 [设置和配置](/plugins/sdk-setup#setup-entry)。

实际使用时，将 `defineSetupPluginEntry(...)` 与窄向设置辅助工具家族配合使用：

- `openclaw/plugin-sdk/setup-runtime` 用于运行时安全的设置辅助工具，如导入安全的设置补丁适配器、查找说明输出、`promptResolvedAllowFrom`、`splitSetupEntries` 和委托设置代理
- `openclaw/plugin-sdk/channel-setup` 用于可选安装的设置界面
- `openclaw/plugin-sdk/setup-tools` 用于设置/安装 CLI/存档/文档辅助工具

将重型 SDK、CLI 注册和长期运行时服务保留在完整入口中。

## 注册模式

`api.registrationMode` 告诉 Plugin 它是如何加载的：

| 模式              | 时机                          | 注册内容                                                                                  |
| ----------------- | ----------------------------- | ----------------------------------------------------------------------------------------- |
| `"full"`          | 正常 Gateway 启动             | 所有内容                                                                                  |
| `"setup-only"`    | 禁用/未配置的 Channel         | 仅 Channel 注册                                                                           |
| `"setup-runtime"` | 具有可用运行时的设置流程      | Channel 注册加上完整入口加载前所需的轻量运行时                                            |
| `"cli-metadata"`  | 根帮助 / CLI 元数据捕获       | 仅 CLI 描述符                                                                             |

`defineChannelPluginEntry` 自动处理此分割。如果您直接将 `definePluginEntry` 用于 Channel，请自行检查模式：

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

将 `"setup-runtime"` 视为设置专用启动界面必须存在而无需重新进入完整捆绑 Channel 运行时的窗口。适合的场景是：Channel 注册、设置安全的 HTTP 路由、设置安全的 Gateway 方法以及委托设置辅助工具。重型后台服务、CLI 注册器和 Provider/客户端 SDK 引导仍然属于 `"full"`。

对于 CLI 注册器：

- 当注册器拥有一个或多个根命令且您希望 OpenClaw 在首次调用时延迟加载真实 CLI 模块时，使用 `descriptors`
- 确保这些描述符覆盖注册器暴露的每个顶级命令根
- 仅对急切兼容路径单独使用 `commands`

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
