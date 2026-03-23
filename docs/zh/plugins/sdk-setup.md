---
mmh3_hash: "48433f1f302599990fb271f8441a5e91"
title: "Plugin 设置和配置"
sidebarTitle: "设置和配置"
summary: "设置向导、setup-entry.ts、配置模式和 package.json 元数据"
read_when:
  - 您正在向 Plugin 添加设置向导
  - 您需要了解 setup-entry.ts 与 index.ts 的区别
  - 您正在定义 Plugin 配置模式或 package.json openclaw 元数据
---

# Plugin 设置和配置

Plugin 打包（`package.json` 元数据）、清单（`openclaw.plugin.json`）、设置入口和配置模式的参考文档。

<Tip>
  **正在寻找演练？** 操作指南在上下文中涵盖打包：[Channel Plugin](/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和 [Provider Plugin](/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 包元数据

您的 `package.json` 需要一个 `openclaw` 字段，告诉 Plugin 系统您的 Plugin 提供什么：

**Channel Plugin：**

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

**Provider Plugin：**

```json
{
  "name": "@myorg/openclaw-my-provider",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "providers": ["my-provider"]
  }
}
```

### `openclaw` 字段

| 字段         | 类型       | 描述                                                                                           |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | 入口点文件（相对于包根目录）                                                                   |
| `setupEntry` | `string`   | 轻量级仅设置入口（可选）                                                                       |
| `channel`    | `object`   | Channel 元数据：`id`、`label`、`blurb`、`selectionLabel`、`docsPath`、`order`、`aliases`       |
| `providers`  | `string[]` | 此 Plugin 注册的 Provider id                                                                   |
| `install`    | `object`   | 安装提示：`npmSpec`、`localPath`、`defaultChoice`                                              |
| `startup`    | `object`   | 启动行为标志                                                                                   |

### 延迟完整加载

Channel Plugin 可以使用以下选项启用延迟加载：

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

启用后，OpenClaw 在监听前的启动阶段仅加载 `setupEntry`，即使对于已配置的 Channel 也是如此。完整入口在 Gateway 开始监听后加载。

<Warning>
  仅当您的 `setupEntry` 在 Gateway 开始监听之前注册了 Gateway 所需的所有内容（Channel 注册、HTTP 路由、Gateway 方法）时才启用延迟加载。如果完整入口拥有必需的启动能力，请保持默认行为。
</Warning>

## Plugin 清单

每个原生 Plugin 必须在包根目录中附带 `openclaw.plugin.json`。OpenClaw 使用它在不执行 Plugin 代码的情况下验证配置。

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

对于 Channel Plugin，添加 `kind` 和 `channels`：

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

即使没有配置的 Plugin 也必须提供模式。空模式是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

完整模式参考请参见 [Plugin 清单](/plugins/manifest)。

## 设置入口

`setup-entry.ts` 文件是 `index.ts` 的轻量级替代，当 OpenClaw 只需要设置接口（入门、配置修复、禁用 Channel 检查）时加载它。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这避免在设置流程中加载重量级运行时代码（加密库、CLI 注册、后台服务）。

**OpenClaw 使用 `setupEntry` 而不是完整入口的时机：**

- Channel 被禁用但需要设置/入门接口
- Channel 已启用但未配置
- 启用了延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry` 必须注册的内容：**

- Channel Plugin 对象（通过 `defineSetupPluginEntry`）
- Gateway 监听之前所需的任何 HTTP 路由
- 启动期间所需的任何 Gateway 方法

**`setupEntry` 不应包含的内容：**

- CLI 注册
- 后台服务
- 重量级运行时导入（加密、SDK）
- 仅在启动后需要的 Gateway 方法

## 配置模式

Plugin 配置针对清单中的 JSON Schema 进行验证。用户通过以下方式配置 Plugin：

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

您的 Plugin 在注册期间以 `api.pluginConfig` 的形式接收此配置。

### 构建 Channel 配置模式

使用来自 `openclaw/plugin-sdk/core` 的 `buildChannelConfigSchema` 将 Zod 模式转换为 OpenClaw 验证的 `ChannelConfigSchema` 包装器：

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

Channel Plugin 可以为 `openclaw onboard` 提供交互式设置向导。向导是 `ChannelPlugin` 上的 `ChannelSetupWizard` 对象：

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

## 发布和安装

**外部 Plugin：** 发布到 [ClawHub](/tools/clawhub) 或 npm，然后安装：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw 首先尝试 ClawHub，然后自动回退到 npm。您也可以强制指定来源：

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # 仅 ClawHub
openclaw plugins install npm:@myorg/openclaw-my-plugin       # 仅 npm
```

**仓库内 Plugin：** 放在 `extensions/` 下，在构建期间自动发现。

**用户可以浏览和安装：**

```bash
openclaw plugins search <query>
openclaw plugins install <package-name>
```

## 相关

- [SDK 入口点](/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
- [Plugin 清单](/plugins/manifest) — 完整清单模式参考
- [构建 Plugin](/plugins/building-plugins) — 分步入门指南
