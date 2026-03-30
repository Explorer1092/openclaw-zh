---
mmh3_hash: "97555af422257015f606ca05db232598"
title: 插件设置与配置
sidebarTitle: 设置与配置
summary: 设置向导、setup-entry.ts、配置 Schema 和 package.json 元数据
read_when:
  - 你正在为插件添加设置向导
  - 你需要了解 setup-entry.ts 与 index.ts 的区别
  - 你正在定义插件配置 Schema 或 package.json openclaw 元数据
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/sdk-setup.md
  workflow: 15
---

# 插件设置与配置

插件打包（`package.json` 元数据）、Manifest（`openclaw.plugin.json`）、Setup Entry 和配置 Schema 的参考文档。

<Tip>
  **在找操作演练？** 操作指南在上下文中涵盖了打包内容：[Channel 插件](/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和 [Provider 插件](/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 包元数据

你的 `package.json` 需要一个 `openclaw` 字段，告诉插件系统你的插件提供什么：

**Channel 插件：**

```json
{
  "name": "@myorg/openclaw-my-channel",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "blurb": "Short description of the channel."
    }
  }
}
```

**Provider 插件 / ClawHub 发布基准：**

```json openclaw-clawhub-package.json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

如果你在 ClawHub 上对外发布插件，`compat` 和 `build` 字段是必需的。标准发布代码片段位于 `docs/snippets/plugin-publish/`。

### `openclaw` 字段

| 字段         | 类型       | 描述                                                                                            |
| ------------ | ---------- | ----------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | 入口点文件（相对于包根目录）                                                                    |
| `setupEntry` | `string`   | 轻量级仅设置入口（可选）                                                                        |
| `channel`    | `object`   | Channel 元数据：`id`、`label`、`blurb`、`selectionLabel`、`docsPath`、`order`、`aliases`        |
| `providers`  | `string[]` | 此插件注册的 Provider id                                                                        |
| `install`    | `object`   | 安装提示：`npmSpec`、`localPath`、`defaultChoice`                                               |
| `startup`    | `object`   | 启动行为标志                                                                                    |

### 延迟完整加载

Channel 插件可以通过以下方式选择启用延迟加载：

```json
{
  "openclaw": {
    "extensions": ["./index.ts"],
    "setupEntry": "./setup-entry.ts",
    "startup": {
      "deferConfiguredChannelFullLoadUntilAfterListen": true
    }
  }
}
```

启用后，即使对于已配置的 Channel，OpenClaw 在监听前的启动阶段也只加载 `setupEntry`。完整 Entry 在 Gateway 开始监听后才加载。

<Warning>
  仅当你的 `setupEntry` 注册了 Gateway 开始监听前所需的一切内容（Channel 注册、HTTP 路由、Gateway 方法）时，才启用延迟加载。如果完整 Entry 拥有必需的启动能力，请保持默认行为。
</Warning>

## 插件 Manifest

每个原生插件必须在包根目录中附带 `openclaw.plugin.json`。OpenClaw 使用它在不执行插件代码的情况下验证配置。

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "Adds My Plugin capabilities to OpenClaw",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "webhookSecret": {
        "type": "string",
        "description": "Webhook verification secret"
      }
    }
  }
}
```

对于 Channel 插件，添加 `kind` 和 `channels`：

```json
{
  "id": "my-channel",
  "kind": "channel",
  "channels": ["my-channel"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

即使没有配置的插件也必须提供 Schema。空 Schema 是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整 Schema 参考请参阅 [Plugin Manifest](/plugins/manifest)。

## ClawHub 发布

对于插件包，使用包专属的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

旧版仅限 Skill 的发布别名适用于 Skills。插件包应始终使用 `clawhub package publish`。

## Setup Entry

`setup-entry.ts` 文件是 `index.ts` 的轻量级替代，OpenClaw 仅在需要设置界面（引导、配置修复、禁用 Channel 检查）时加载它。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这样可以避免在设置流程中加载重量级运行时代码（加密库、CLI 注册、后台服务）。

**OpenClaw 使用 `setupEntry` 而非完整 Entry 的时机：**

- Channel 已禁用但需要设置/引导界面
- Channel 已启用但未配置
- 已启用延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry` 必须注册：**

- Channel 插件对象（通过 `defineSetupPluginEntry`）
- Gateway 监听前所需的所有 HTTP 路由
- 启动期间所需的 Gateway 方法

**`setupEntry` 不应包含：**

- CLI 注册
- 后台服务
- 重量级运行时导入（加密库、SDK）
- 仅启动后才需要的 Gateway 方法

## 配置 Schema

插件配置根据 Manifest 中的 JSON Schema 进行验证。用户通过以下方式配置插件：

```json5
{
  plugins: {
    entries: {
      "my-plugin": {
        config: {
          webhookSecret: "abc123",
        },
      },
    },
  },
}
```

插件在注册期间通过 `api.pluginConfig` 接收此配置。

对于 Channel 专属配置，改用 Channel 配置节：

```json5
{
  channels: {
    "my-channel": {
      token: "bot-token",
      allowFrom: ["user1", "user2"],
    },
  },
}
```

### 构建 Channel 配置 Schema

使用 `openclaw/plugin-sdk/core` 中的 `buildChannelConfigSchema` 将 Zod Schema 转换为 OpenClaw 验证的 `ChannelConfigSchema` 封装：

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/core";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

## 设置向导

Channel 插件可以为 `openclaw onboard` 提供交互式设置向导。向导是 `ChannelPlugin` 上的 `ChannelSetupWizard` 对象：

```typescript
import type { ChannelSetupWizard } from "openclaw/plugin-sdk/channel-setup";

const setupWizard: ChannelSetupWizard = {
  channel: "my-channel",
  status: {
    configuredLabel: "Connected",
    unconfiguredLabel: "Not configured",
    resolveConfigured: ({ cfg }) => Boolean((cfg.channels as any)?.["my-channel"]?.token),
  },
  credentials: [
    {
      inputKey: "token",
      providerHint: "my-channel",
      credentialLabel: "Bot token",
      preferredEnvVar: "MY_CHANNEL_BOT_TOKEN",
      envPrompt: "Use MY_CHANNEL_BOT_TOKEN from environment?",
      keepPrompt: "Keep current token?",
      inputPrompt: "Enter your bot token:",
      inspect: ({ cfg, accountId }) => {
        const token = (cfg.channels as any)?.["my-channel"]?.token;
        return {
          accountConfigured: Boolean(token),
          hasConfiguredValue: Boolean(token),
        };
      },
    },
  ],
};
```

`ChannelSetupWizard` 类型支持 `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。完整示例请参阅捆绑的插件包（如 Discord 插件的 `src/channel.setup.ts`）。

对于只需要标准 `note -> prompt -> parse -> merge -> patch` 流程的 DM 允许列表提示，优先使用 `openclaw/plugin-sdk/setup` 中的共享设置辅助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。

对于仅在标签、评分和可选额外行上有差异的 Channel 设置状态块，优先使用 `openclaw/plugin-sdk/setup` 中的 `createStandardChannelSetupStatus(...)` 而非在每个插件中手动实现相同的 `status` 对象。

对于只在特定上下文中应出现的可选设置界面，使用 `openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface`：

```typescript
import { createOptionalChannelSetupSurface } from "openclaw/plugin-sdk/channel-setup";

const setupSurface = createOptionalChannelSetupSurface({
  channel: "my-channel",
  label: "My Channel",
  npmSpec: "@myorg/openclaw-my-channel",
  docsPath: "/channels/my-channel",
});
// 返回 { setupAdapter, setupWizard }
```

## 发布和安装

**外部插件：** 发布到 [ClawHub](/tools/clawhub) 或 npm，然后安装：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw 优先尝试 ClawHub，若未找到则自动回退到 npm。你也可以强制指定来源：

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # 仅 ClawHub
openclaw plugins install npm:@myorg/openclaw-my-plugin       # 仅 npm
```

**仓库内插件：** 放置在捆绑插件工作区树下，构建时会自动发现。

**用户可以浏览和安装：**

```bash
openclaw plugins search <query>
openclaw plugins install <package-name>
```

<Info>
  对于 npm 来源的安装，`openclaw plugins install` 运行 `npm install --ignore-scripts`（无生命周期脚本）。保持插件依赖树为纯 JS/TS，避免需要 `postinstall` 构建的包。
</Info>

## 相关文档

- [SDK Entry Points](/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
- [Plugin Manifest](/plugins/manifest) — 完整 Manifest Schema 参考
- [构建插件](/plugins/building-plugins) — 分步入门指南
