---
mmh3_hash: "58c624e496b665f798aa8997de968cd4"
summary: "使用 defineToolPlugin 和 openclaw plugins init/build/validate 构建简单的类型化 Agent 工具"
title: "Tool plugins"
sidebarTitle: "Tool Plugins"
read_when:
  - 你想构建一个仅添加 Agent 工具的简单 OpenClaw 插件时
  - 你想使用 defineToolPlugin 而不是手写插件 Manifest 元数据时
  - 你需要脚手架、生成、验证、测试或发布仅包含工具的插件时
---

Tool 插件向 OpenClaw 添加 Agent 可调用的工具，而无需添加 Channel、模型 Provider、Hook、服务或设置后端。当插件拥有固定的工具列表，并且你希望 OpenClaw 生成 Manifest 元数据以使这些工具无需加载运行时代码即可被发现时，请使用 `defineToolPlugin`。

推荐流程为：

1. 使用 `openclaw plugins init` 脚手架一个包。
2. 使用 `defineToolPlugin` 编写工具。
3. 构建 JavaScript。
4. 使用 `openclaw plugins build` 生成 `openclaw.plugin.json` 和 `package.json` 元数据。
5. 在发布或安装前验证生成的元数据。

对于 Provider、Channel、Hook、服务或混合能力插件，请改从[构建插件](/plugins/building-plugins)、[Channel Plugins](/plugins/sdk-channel-plugins) 或 [Provider Plugins](/plugins/sdk-provider-plugins) 开始。

## 要求

- Node >= 22。
- TypeScript ESM 包输出。
- 用于配置和工具参数 Schema 的 `typebox`。
- `openclaw >=2026.5.17`，这是第一个导出 `openclaw/plugin-sdk/tool-plugin` 的 OpenClaw 版本。
- 能够包含 `dist/`、`openclaw.plugin.json` 和 `package.json` 的包根目录。

生成的插件在运行时导入 `typebox`，因此请将 `typebox` 放在 `dependencies` 中，而非仅放在 `devDependencies` 中。

## 快速开始

创建一个新插件包：

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm install
npm run plugin:build
npm run plugin:validate
npm test
```

脚手架会创建：

- `src/index.ts`：包含 `echo` 工具的 `defineToolPlugin` 入口。
- `src/index.test.ts`：小型元数据测试。
- `tsconfig.json`：NodeNext TypeScript 输出到 `dist/`。
- `package.json`：脚本、运行时依赖项以及 `openclaw.extensions: ["./dist/index.js"]`。
- `openclaw.plugin.json`：初始工具的生成 Manifest 元数据。

预期验证输出：

```text
Plugin stock-quotes is valid.
```

## 编写工具

`defineToolPlugin` 接受插件身份、可选的配置 Schema 以及静态工具列表。参数和配置类型从 TypeBox Schema 推断。

```typescript
import { Type } from "typebox";
import { defineToolPlugin } from "openclaw/plugin-sdk/tool-plugin";

export default defineToolPlugin({
  id: "stock-quotes",
  name: "Stock Quotes",
  description: "Fetch stock quote snapshots.",
  configSchema: Type.Object({
    apiKey: Type.Optional(Type.String({ description: "Quote API key." })),
    baseUrl: Type.Optional(Type.String({ description: "Quote API base URL." })),
  }),
  tools: (tool) => [
    tool({
      name: "stock_quote",
      label: "Stock Quote",
      description: "Fetch a stock quote snapshot.",
      parameters: Type.Object({
        symbol: Type.String({ description: "Ticker symbol, for example OPEN." }),
      }),
      async execute({ symbol }, config, context) {
        context.signal?.throwIfAborted();
        return {
          symbol: symbol.toUpperCase(),
          configured: Boolean(config.apiKey),
          baseUrl: config.baseUrl ?? "https://api.example.com",
        };
      },
    }),
  ],
});
```

工具名称是稳定的 API。选择唯一、小写、足够具体以避免与核心工具或其他插件冲突的名称。

## 可选工具和工厂工具

当用户应在工具发送给模型之前明确将其加入白名单时，设置 `optional: true`：

```typescript
tool({
  name: "workflow_run",
  description: "Run an external workflow.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  execute: ({ goal }) => ({ queued: true, goal }),
});
```

`openclaw plugins build` 会写入匹配的 `toolMetadata.<tool>.optional` Manifest 条目，以便 OpenClaw 无需加载插件运行时代码即可发现工具。

当工具在创建之前需要运行时工具上下文时，使用 `factory`。工厂保持元数据静态，同时允许工具针对特定运行选择退出、检查沙箱状态或绑定运行时辅助函数。

```typescript
tool({
  name: "local_workflow",
  description: "Run a local workflow outside sandboxed sessions.",
  parameters: Type.Object({ goal: Type.String() }),
  optional: true,
  factory({ api, toolContext }) {
    if (toolContext.sandboxed) {
      return null;
    }
    return createLocalWorkflowTool(api);
  },
});
```

工厂仍用于固定工具名称。当插件动态计算工具名称或将工具与 Hook、服务、Provider、命令或其他运行时界面组合时，请直接使用 `definePluginEntry`。

## 返回值

`defineToolPlugin` 将普通返回值包装为 OpenClaw 工具结果格式：

- 当模型应看到精确文本时，返回字符串。
- 当你希望模型看到格式化 JSON 且 OpenClaw 在 `details` 中保留原始值时，返回 JSON 兼容值。

```typescript
tool({
  name: "echo_text",
  description: "Echo input text.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => input,
});
```

```typescript
tool({
  name: "echo_json",
  description: "Echo input as structured JSON.",
  parameters: Type.Object({
    input: Type.String(),
  }),
  execute: ({ input }) => ({ input, length: input.length }),
});
```

当需要返回自定义 `AgentToolResult` 或复用现有的 `api.registerTool` 实现时，使用工厂工具。需要完全动态工具或混合插件能力时，使用 `definePluginEntry` 代替 `defineToolPlugin`。

## 配置

`configSchema` 是可选的。如果省略，OpenClaw 使用严格的空对象 Schema，生成的 Manifest 仍会包含 `configSchema`。

```typescript
export default defineToolPlugin({
  id: "no-config-tools",
  name: "No Config Tools",
  description: "Adds tools that do not need configuration.",
  tools: () => [],
});
```

包含 `configSchema` 时，`execute` 的第二个参数从 Schema 推断类型：

```typescript
const configSchema = Type.Object({
  apiKey: Type.String(),
});

export default defineToolPlugin({
  id: "configured-tools",
  name: "Configured Tools",
  description: "Adds configured tools.",
  configSchema,
  tools: (tool) => [
    tool({
      name: "configured_ping",
      description: "Check whether configuration is available.",
      parameters: Type.Object({}),
      execute: (_params, config) => ({ hasKey: config.apiKey.length > 0 }),
    }),
  ],
});
```

OpenClaw 从 Gateway 配置中的插件条目读取插件配置。不要在源代码或文档示例中硬编码密钥。根据插件的安全模型，使用配置、环境变量或 SecretRef。

## 生成的元数据

OpenClaw 从冷元数据发现已安装插件。在导入插件运行时代码之前，它必须能够读取插件 Manifest。因此 `defineToolPlugin` 暴露静态元数据，而 `openclaw plugins build` 将该元数据写入包中。

更改插件 ID、名称、描述、配置 Schema、激活或工具名称后运行生成器：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

对于单工具插件，生成的 Manifest 如下所示：

```json
{
  "id": "stock-quotes",
  "name": "Stock Quotes",
  "description": "Fetch stock quote snapshots.",
  "version": "0.1.0",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  },
  "activation": {
    "onStartup": true
  },
  "contracts": {
    "tools": ["stock_quote"]
  }
}
```

`contracts.tools` 是重要的发现合约。它告诉 OpenClaw 哪个插件拥有每个工具，而无需加载每个已安装插件的运行时。如果 Manifest 过时，工具可能从发现中消失，或错误的插件可能被归咎于注册错误。

## 包元数据

对于简单的 tool-plugin 工作流，`openclaw plugins build` 将 `package.json` 对齐到所选的单运行时入口：

```json
{
  "type": "module",
  "files": ["dist", "openclaw.plugin.json", "README.md"],
  "dependencies": {
    "typebox": "^1.1.38"
  },
  "peerDependencies": {
    "openclaw": ">=2026.5.17"
  },
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

对于已安装的包，使用构建后的 JavaScript（如 `./dist/index.js`）。源入口在工作区开发中有用，但已发布的包不应依赖 TypeScript 运行时加载。

## 在 CI 中验证

使用 `plugins build --check` 在不重写文件的情况下，当生成的元数据过时时让 CI 失败：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
npm test
```

`plugins validate` 检查：

- `openclaw.plugin.json` 存在并通过正常的 Manifest 加载器。
- 当前入口导出 `defineToolPlugin` 元数据。
- 生成的 Manifest 字段与入口元数据匹配。
- `contracts.tools` 与声明的工具名称匹配。
- `package.json` 在 `openclaw.extensions` 中指向所选的运行时入口。

## 本地安装和检查

从独立的 OpenClaw 检出或已安装的 CLI，安装包路径：

```bash
openclaw plugins install ./stock-quotes
openclaw plugins inspect stock-quotes --runtime
```

对于打包冒烟测试，先打包再安装 tarball：

```bash
npm pack
openclaw plugins install npm-pack:./openclaw-plugin-stock-quotes-0.1.0.tgz
openclaw plugins inspect stock-quotes --runtime --json
```

安装后，启动或重启 Gateway 并要求 Agent 使用该工具。如果你在调试工具可见性，请在更改代码之前检查插件运行时和有效工具目录。

## 发布

通过 ClawHub 发布包准备就绪时：

```bash
clawhub package publish your-org/stock-quotes --dry-run
clawhub package publish your-org/stock-quotes
```

使用明确的 ClawHub 定位器安装：

```bash
openclaw plugins install clawhub:your-org/stock-quotes
```

在启动截止期间，裸 npm 包规格仍受支持，但 ClawHub 是 OpenClaw 插件的首选发现和分发界面。

## 故障排除

### `plugin entry not found: ./dist/index.js`

所选入口文件不存在。运行 `npm run build`，然后重新运行 `openclaw plugins build --entry ./dist/index.js` 或 `openclaw plugins validate --entry ./dist/index.js`。

### `plugin entry does not expose defineToolPlugin metadata`

入口未导出由 `defineToolPlugin` 创建的值。检查模块默认导出是否为 `defineToolPlugin(...)` 结果，或使用 `--entry` 传入正确的入口。

### `openclaw.plugin.json generated metadata is stale`

Manifest 不再与入口元数据匹配。运行：

```bash
npm run build
openclaw plugins build --entry ./dist/index.js
```

同时提交 `openclaw.plugin.json` 和 `package.json` 更改。

### `package.json openclaw.extensions must include ./dist/index.js`

包元数据指向了不同的运行时入口。运行 `openclaw plugins build --entry ./dist/index.js`，使生成器将包元数据与你打算发布的入口对齐。

### `Cannot find package 'typebox'`

构建后的插件在运行时导入 `typebox`。将 `typebox` 放在 `dependencies` 中，重新安装包依赖项，重新构建，然后重新运行验证。

### 安装后工具不出现

按顺序检查：

1. `openclaw plugins inspect <plugin-id> --runtime`
2. `openclaw plugins validate --root <plugin-root> --entry ./dist/index.js`
3. `openclaw.plugin.json` 的 `contracts.tools` 包含预期的工具名称。
4. `package.json` 的 `openclaw.extensions: ["./dist/index.js"]`。
5. 安装插件后 Gateway 已重启或重载。

## 另请参阅

- [构建插件](/plugins/building-plugins)
- [插件入口点](/plugins/sdk-entrypoints)
- [Plugin SDK 子路径](/plugins/sdk-subpaths)
- [插件 Manifest](/plugins/manifest)
- [插件 CLI](/cli/plugins)
- [ClawHub 发布](/clawhub/publishing)
