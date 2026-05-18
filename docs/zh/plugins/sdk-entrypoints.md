---
mmh3_hash: "93b1104fb59cc8a8196c06c22df2f655"
title: "Plugin 入口点"
sidebarTitle: "入口点"
summary: "definePluginEntry、defineChannelPluginEntry 和 defineSetupPluginEntry 的参考文档"
read_when:
  - 您需要 defineToolPlugin、definePluginEntry 或 defineChannelPluginEntry 的确切类型签名
  - 您想了解注册模式（完整模式 vs 设置模式 vs CLI 元数据模式）
  - 您正在查阅入口点选项
doc-schema-version: 1
---

每个 Plugin 都会导出一个默认入口对象。SDK 提供了用于创建这些对象的辅助函数。

对于已安装的 Plugin，`package.json` 应在可用时将运行时加载指向已构建的 JavaScript：

```json
{
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "setupEntry": "./src/setup-entry.ts",
    "runtimeSetupEntry": "./dist/setup-entry.js"
  }
}
```

`extensions` 和 `setupEntry` 对于工作区和 git checkout 开发仍然是有效的源入口。当 OpenClaw 加载已安装的包时，`runtimeExtensions` 和 `runtimeSetupEntry` 更受优先，允许 npm 包避免运行时 TypeScript 编译。显式运行时入口是必需的：`runtimeSetupEntry` 需要 `setupEntry`，缺少 `runtimeExtensions` 或 `runtimeSetupEntry` 工件会导致安装/发现失败，而不是静默回退到源。如果已安装的包仅声明了 TypeScript 源入口，OpenClaw 将在存在匹配的已构建 `dist/*.js` 对等文件时使用它，然后回退到 TypeScript 源。

所有入口路径必须保留在 Plugin 包目录内。运行时入口和推断的已构建 JavaScript 对等文件不会使逃逸的 `extensions` 或 `setupEntry` 源路径变为有效。

<Tip>
  **寻找演练文档？** 请参见 [Tool Plugin](/plugins/tool-plugins)、[Channel Plugin](/plugins/sdk-channel-plugins) 或 [Provider Plugin](/plugins/sdk-provider-plugins) 以获取分步指南。
</Tip>

## `defineToolPlugin`

**导入：** `openclaw/plugin-sdk/tool-plugin`

用于仅添加 Agent 工具的简单 Plugin。`defineToolPlugin` 使编写源码保持精简，从 TypeBox Schema 推断配置和工具参数类型，将普通返回值包装为 OpenClaw 工具结果格式，并公开 `openclaw plugins build` 写入 Plugin Manifest 的静态元数据。

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quotes.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "API key." })),
  }),
  tools: (tool) => [
    tool({
      name: "quote",
      label: "Quote",
      description: "Fetch a quote.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol." }),
      }),
      execute: async ({ symbol }, config) => ({ symbol, hasKey: Boolean(config.apiKey) }),
    }),
  ],
});
```

- `configSchema` 是可选的。省略时，OpenClaw 使用严格的空对象 Schema，生成的 Manifest 仍然包含 `configSchema`。
- `execute` 返回普通字符串或 JSON 可序列化的值。辅助函数将其包装为带有 `details` 的文本工具结果。
- 工具名称是静态的。`openclaw plugins build` 从声明的工具派生 `contracts.tools`，因此作者无需手动重复名称。
- 运行时加载保持严格。已安装的 Plugin 仍然需要 `openclaw.plugin.json` 和 `package.json` 中的 `openclaw.extensions`；OpenClaw 不执行 Plugin 代码来推断缺失的 Manifest 数据。

## `definePluginEntry`

**导入：** `openclaw/plugin-sdk/plugin-entry`

用于 Provider Plugin、高级 Tool Plugin、Hook Plugin 以及任何**非**消息 Channel 的插件。

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
| `id`           | `string`                                                         | 是   | -                   |
| `name`         | `string`                                                         | 是   | -                   |
| `description`  | `string`                                                         | 是   | -                   |
| `kind`         | `string`                                                         | 否   | -                   |
| `configSchema` | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象 Schema       |
| `register`     | `(api: OpenClawPluginApi) => void`                               | 是   | -                   |

- `id` 必须与您的 `openclaw.plugin.json` Manifest 匹配。
- `kind` 用于独占插槽：`"memory"` 或 `"context-engine"`。
- `configSchema` 可以是用于延迟求值的函数。
- OpenClaw 在首次访问时解析并记忆该 Schema，因此昂贵的 Schema 构建器只运行一次。

## `defineChannelPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

包装 `definePluginEntry` 并添加特定于 Channel 的连接。自动调用 `api.registerChannel({ plugin })`，公开可选的根帮助 CLI 元数据接缝，并根据注册模式对 `registerFull` 进行门控。

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

| 字段                  | 类型                                                             | 必填 | 默认值              |
| --------------------- | ---------------------------------------------------------------- | ---- | ------------------- |
| `id`                  | `string`                                                         | 是   | -                   |
| `name`                | `string`                                                         | 是   | -                   |
| `description`         | `string`                                                         | 是   | -                   |
| `plugin`              | `ChannelPlugin`                                                  | 是   | -                   |
| `configSchema`        | `OpenClawPluginConfigSchema \| () => OpenClawPluginConfigSchema` | 否   | 空对象 Schema       |
| `setRuntime`          | `(runtime: PluginRuntime) => void`                               | 否   | -                   |
| `registerCliMetadata` | `(api: OpenClawPluginApi) => void`                               | 否   | -                   |
| `registerFull`        | `(api: OpenClawPluginApi) => void`                               | 否   | -                   |

- `setRuntime` 在注册期间被调用，以便您可以存储运行时引用（通常通过 `createPluginRuntimeStore`）。在 CLI 元数据捕获期间跳过。
- `registerCliMetadata` 在 `api.registrationMode === "cli-metadata"`、`api.registrationMode === "discovery"` 和 `api.registrationMode === "full"` 时运行。将其用作 Channel 拥有的 CLI 描述符的规范位置，以使根帮助保持非激活状态，发现快照包含静态命令元数据，并且普通 CLI 命令注册与完整 Plugin 加载保持兼容。
- 发现注册是非激活的，但不是无导入的。OpenClaw 可能会评估受信任的 Plugin 入口和 Channel Plugin 模块以构建快照，因此请保持顶层导入无副作用，并将套接字、客户端、Worker 和服务放在 `"full"` 专用路径后面。
- `registerFull` 仅在 `api.registrationMode === "full"` 时运行。在仅设置加载期间跳过。
- 与 `definePluginEntry` 一样，`configSchema` 可以是延迟工厂，OpenClaw 在首次访问时记忆已解析的 Schema。
- 对于 Plugin 拥有的根 CLI 命令，当您希望命令保持延迟加载而不从根 CLI 解析树中消失时，优先使用 `api.registerCli(..., { descriptors: [...] })`。对于配对节点功能命令，优先使用 `api.registerNodeCliFeature(...)` 使命令落在 `openclaw nodes` 下。对于其他嵌套 Plugin 命令，添加 `parentPath` 并在传递给注册器的 `program` 对象上注册命令；OpenClaw 在调用 Plugin 之前将其解析为父命令。对于 Channel Plugin，优先从 `registerCliMetadata(...)` 注册这些描述符，并使 `registerFull(...)` 专注于仅运行时工作。
- 如果 `registerFull(...)` 还注册了 Gateway RPC 方法，请将它们保留在特定于 Plugin 的前缀上。保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）始终被强制为 `operator.admin`。

## `defineSetupPluginEntry`

**导入：** `openclaw/plugin-sdk/channel-core`

用于轻量级的 `setup-entry.ts` 文件。仅返回 `{ plugin }`，没有运行时或 CLI 连接。

```typescript
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";

export default defineSetupPluginEntry(myChannelPlugin);
```

当 Channel 被禁用、未配置或启用了延迟加载时，OpenClaw 会加载此文件而不是完整入口。有关何时重要，请参见[设置和配置](/plugins/sdk-setup#setup-entry)。

实际上，将 `defineSetupPluginEntry(...)` 与窄设置辅助函数族配对：

- `openclaw/plugin-sdk/setup-runtime`：用于运行时安全的设置辅助函数，例如 `createSetupTranslator`、导入安全的设置补丁适配器、查找注释输出、`promptResolvedAllowFrom`、`splitSetupEntries` 和委托设置代理
- `openclaw/plugin-sdk/channel-setup`：用于可选安装的设置表面
- `openclaw/plugin-sdk/setup-tools`：用于设置/安装 CLI/存档/文档辅助函数

将重型 SDK、CLI 注册和长期运行的运行时服务保留在完整入口中。

拆分设置和运行时表面的捆绑工作区 Channel 可以改用 `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)`。该契约让设置入口保持设置安全的 Plugin/Secrets 导出，同时仍然公开运行时设置器：

```typescript
import { defineBundledChannelSetupEntry } from "openclaw/plugin-sdk/channel-entry-contract";

export default defineBundledChannelSetupEntry({
  importMetaUrl: import.meta.url,
  plugin: {
    specifier: "./channel-plugin-api.js",
    exportName: "myChannelPlugin",
  },
  runtime: {
    specifier: "./runtime-api.js",
    exportName: "setMyChannelRuntime",
  },
});
```

仅在设置流程确实需要在完整 Channel 入口加载之前的轻量级运行时设置器时才使用该捆绑契约。

## 注册模式

`api.registrationMode` 告诉您的 Plugin 它是如何被加载的：

| 模式              | 时机                              | 注册什么                                                                                                            |
| ----------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `"full"`          | 正常 Gateway 启动                 | 所有内容                                                                                                            |
| `"discovery"`     | 只读功能发现                      | Channel 注册加上静态 CLI 描述符；入口代码可以加载，但跳过套接字、Worker、客户端和服务                               |
| `"setup-only"`    | 已禁用/未配置的 Channel           | 仅 Channel 注册                                                                                                     |
| `"setup-runtime"` | 带有可用运行时的设置流程          | Channel 注册加上在完整入口加载之前所需的轻量级运行时                                                               |
| `"cli-metadata"`  | 根帮助 / CLI 元数据捕获           | 仅 CLI 描述符                                                                                                       |

`defineChannelPluginEntry` 自动处理这种拆分。如果您直接对 Channel 使用 `definePluginEntry`，请自行检查模式：

```typescript
register(api) {
  if (
    api.registrationMode === "cli-metadata" ||
    api.registrationMode === "discovery" ||
    api.registrationMode === "full"
  ) {
    api.registerCli(/* ... */);
    if (api.registrationMode === "cli-metadata") return;
  }

  api.registerChannel({ plugin: myPlugin });
  if (api.registrationMode !== "full") return;

  // 仅限运行时的重型注册
  api.registerService(/* ... */);
}
```

发现模式构建非激活的注册表快照。它仍然可能评估 Plugin 入口和 Channel Plugin 对象，以便 OpenClaw 可以注册 Channel 能力和静态 CLI 描述符。将发现中的模块评估视为受信任但轻量级的：顶层不应有网络客户端、子进程、监听器、数据库连接、后台 Worker、凭据读取或其他实时运行时副作用。

将 `"setup-runtime"` 视为设置专用启动表面必须存在而不重新进入完整捆绑 Channel 运行时的窗口。适合的情况是 Channel 注册、设置安全的 HTTP 路由、设置安全的 Gateway 方法和委托设置辅助函数。重型后台服务、CLI 注册器和 Provider/客户端 SDK 引导仍然属于 `"full"`。

对于 CLI 注册器，具体来说：

- 当注册器拥有一个或多个根命令并且您希望 OpenClaw 在首次调用时延迟加载真实 CLI 模块时，使用 `descriptors`
- 确保这些描述符覆盖注册器公开的每个顶级命令根
- 将描述符命令名称限制为字母、数字、连字符和下划线，以字母或数字开头；OpenClaw 拒绝超出该形状的描述符名称，并在渲染帮助之前从描述中去除终端控制序列
- 仅对急切兼容路径单独使用 `commands`

## Plugin 形状

OpenClaw 根据注册行为对已加载的 Plugin 进行分类：

| 形状                  | 描述                                        |
| --------------------- | ------------------------------------------- |
| **plain-capability**  | 一种能力类型（例如，仅 Provider）           |
| **hybrid-capability** | 多种能力类型（例如，Provider + 语音）       |
| **hook-only**         | 仅 Hook，无能力                             |
| **non-capability**    | 工具/命令/服务，但无能力                    |

使用 `openclaw plugins inspect <id>` 查看 Plugin 的形状。

## 相关

- [SDK 概述](/plugins/sdk-overview) - 注册 API 和子路径参考
- [运行时辅助函数](/plugins/sdk-runtime) - `api.runtime` 和 `createPluginRuntimeStore`
- [设置和配置](/plugins/sdk-setup) - Manifest、设置入口和延迟加载
- [Channel Plugin](/plugins/sdk-channel-plugins) - 构建 `ChannelPlugin` 对象
- [Provider Plugin](/plugins/sdk-provider-plugins) - Provider 注册和 Hook
