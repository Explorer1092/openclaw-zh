---
mmh3_hash: "da22e1c5aa23073c987a63a8176e7ed9"
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

**Provider Plugin / ClawHub 发布基准：**

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

如果您在 ClawHub 上外部发布 Plugin，这些 `compat` 和 `build` 字段是必需的。规范发布代码片段位于 `docs/snippets/plugin-publish/`。

### `openclaw` 字段

| 字段         | 类型       | 描述                                                                                                     |
| ------------ | ---------- | -------------------------------------------------------------------------------------------------------- |
| `extensions` | `string[]` | 入口点文件（相对于包根目录）                                                                             |
| `setupEntry` | `string`   | 轻量级仅设置入口（可选）                                                                                 |
| `channel`    | `object`   | Channel 目录元数据，用于设置、选择器、快速入门和状态界面                                                 |
| `providers`  | `string[]` | 此 Plugin 注册的 Provider id                                                                             |
| `install`    | `object`   | 安装提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`allowInvalidConfigRecovery`        |
| `startup`    | `object`   | 启动行为标志                                                                                             |

### `openclaw.channel`

`openclaw.channel` 是廉价的包元数据，用于在运行时加载之前的 Channel 发现和设置界面。

| 字段                                   | 类型       | 含义                                                                          |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`                                   | `string`   | 规范 Channel id。                                                             |
| `label`                                | `string`   | 主要 Channel 标签。                                                           |
| `selectionLabel`                       | `string`   | 选择器/设置标签，当其应与 `label` 不同时使用。                                |
| `detailLabel`                          | `string`   | 丰富 Channel 目录和状态界面的辅助详细标签。                                   |
| `docsPath`                             | `string`   | 设置和选择链接的文档路径。                                                    |
| `docsLabel`                            | `string`   | 文档链接使用的覆盖标签，当其应与 Channel id 不同时使用。                      |
| `blurb`                                | `string`   | 简短的入门/目录描述。                                                         |
| `order`                                | `number`   | Channel 目录中的排序顺序。                                                    |
| `aliases`                              | `string[]` | Channel 选择的额外查找别名。                                                  |
| `preferOver`                           | `string[]` | 此 Channel 应优先于的低优先级 Plugin/Channel id。                             |
| `systemImage`                          | `string`   | Channel UI 目录的可选图标/系统图像名称。                                      |
| `selectionDocsPrefix`                  | `string`   | 选择界面中文档链接之前的前缀文本。                                            |
| `selectionDocsOmitLabel`               | `boolean`  | 在选择文案中直接显示文档路径而非有标签的文档链接。                            |
| `selectionExtras`                      | `string[]` | 在选择文案中附加的额外短字符串。                                              |
| `markdownCapable`                      | `boolean`  | 将 Channel 标记为支持 Markdown 以用于出站格式化决策。                         |
| `exposure`                             | `object`   | Channel 在设置、已配置列表和文档界面中的可见性控制。                          |
| `quickstartAllowFrom`                  | `boolean`  | 将此 Channel 加入标准快速入门 `allowFrom` 设置流程。                          |
| `forceAccountBinding`                  | `boolean`  | 即使只有一个账户存在，也要求明确的账户绑定。                                  |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 为此 Channel 解析公告目标时优先使用 Session 查找。                            |

示例：

```json
{
  "openclaw": {
    "channel": {
      "id": "my-channel",
      "label": "My Channel",
      "selectionLabel": "My Channel (self-hosted)",
      "detailLabel": "My Channel Bot",
      "docsPath": "/channels/my-channel",
      "docsLabel": "my-channel",
      "blurb": "Webhook-based self-hosted chat integration.",
      "order": 80,
      "aliases": ["mc"],
      "preferOver": ["my-channel-legacy"],
      "selectionDocsPrefix": "Guide:",
      "selectionExtras": ["Markdown"],
      "markdownCapable": true,
      "exposure": {
        "configured": true,
        "setup": true,
        "docs": true
      },
      "quickstartAllowFrom": true
    }
  }
}
```

`exposure` 支持：

- `configured`：将 Channel 包含在已配置/状态样式的列表界面中
- `setup`：将 Channel 包含在交互式设置/配置选择器中
- `docs`：在文档/导航界面中将 Channel 标记为面向公众

`showConfigured` 和 `showInSetup` 作为旧版别名仍受支持。优先使用 `exposure`。

### `openclaw.install`

`openclaw.install` 是包元数据，而非清单元数据。

| 字段                         | 类型                 | 含义                                                                             |
| ---------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `npmSpec`                    | `string`             | 安装/更新流程的规范 npm 规格。                                                   |
| `localPath`                  | `string`             | 本地开发或捆绑安装路径。                                                         |
| `defaultChoice`              | `"npm"` \| `"local"` | 两者都可用时的首选安装来源。                                                     |
| `minHostVersion`             | `string`             | 支持的最低 OpenClaw 版本，格式为 `>=x.y.z`。                                     |
| `allowInvalidConfigRecovery` | `boolean`            | 让捆绑 Plugin 的重安装流程能够从特定的旧配置失败中恢复。                         |

如果设置了 `minHostVersion`，安装和清单注册表加载都会强制执行它。较旧的宿主会跳过该 Plugin；无效的版本字符串会被拒绝。

`allowInvalidConfigRecovery` 不是损坏配置的通用旁路。它仅用于窄向的捆绑 Plugin 恢复，以便重安装/设置可以修复已知的升级遗留问题，如缺失的捆绑 Plugin 路径或同一 Plugin 的旧 `channels.<id>` 条目。如果配置因无关原因损坏，安装仍会失败关闭并告知操作员运行 `openclaw doctor --fix`。

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

如果您的设置/完整入口注册了 Gateway RPC 方法，请将它们保持在 Plugin 特定的前缀下。保留的核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）仍归核心所有，始终解析为 `operator.admin`。

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

## ClawHub 发布

对于 Plugin 包，使用特定于包的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

旧版仅 Skill 发布别名用于 Skill。Plugin 包应始终使用 `clawhub package publish`。

## 设置入口

`setup-entry.ts` 文件是 `index.ts` 的轻量级替代，当 OpenClaw 只需要设置界面（入门、配置修复、禁用 Channel 检查）时加载它。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这避免在设置流程中加载重量级运行时代码（加密库、CLI 注册、后台服务）。

**OpenClaw 使用 `setupEntry` 而不是完整入口的时机：**

- Channel 被禁用但需要设置/入门界面
- Channel 已启用但未配置
- 启用了延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）

**`setupEntry` 必须注册的内容：**

- Channel Plugin 对象（通过 `defineSetupPluginEntry`）
- Gateway 监听之前所需的任何 HTTP 路由
- 启动期间所需的任何 Gateway 方法

这些启动 Gateway 方法仍应避免保留的核心管理员命名空间，如 `config.*` 或 `update.*`。

**`setupEntry` 不应包含的内容：**

- CLI 注册
- 后台服务
- 重量级运行时导入（加密、SDK）
- 仅在启动后需要的 Gateway 方法

### 窄向设置辅助工具导入

对于热路径的仅设置路径，当您只需要设置界面的一部分时，优先使用窄向设置辅助工具接缝而非更宽泛的 `plugin-sdk/setup` 综合接缝：

| 导入路径                           | 用途                                                                              | 主要导出                                                                                                                                                                                                                                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry` / 延迟 Channel 启动中保持可用的设置时运行时辅助工具 | `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 环境感知的账户设置适配器                                                          | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                         |
| `plugin-sdk/setup-tools`           | 设置/安装 CLI/存档/文档辅助工具                                                   | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                  |

当您需要完整的共享设置工具箱（包括配置补丁辅助工具如 `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，使用更宽泛的 `plugin-sdk/setup` 接缝。

设置补丁适配器在导入时保持热路径安全。它们的捆绑单账户提升契约界面查找是懒加载的，因此导入 `plugin-sdk/setup-runtime` 不会在适配器实际使用之前急切地加载捆绑契约界面发现。

### Channel 自有单账户提升

当 Channel 从单账户顶级配置升级到 `channels.<id>.accounts.*` 时，默认的共享行为是将提升的账户范围值移入 `accounts.default`。

捆绑 Channel 可以通过其设置契约界面缩窄或覆盖该提升：

- `singleAccountKeysToMove`：应移入提升账户的额外顶级键
- `namedAccountPromotionKeys`：当命名账户已存在时，只有这些键移入提升账户；共享的策略/交付键保留在 Channel 根目录
- `resolveSingleAccountPromotionTarget(...)`：选择哪个现有账户接收提升的值

Matrix 是当前的捆绑示例。如果恰好已经存在一个命名的 Matrix 账户，或者 `defaultAccount` 指向现有的非规范键（如 `Ops`），则提升会保留该账户而不是创建新的 `accounts.default` 条目。

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

对于 Channel 特定的配置，使用 Channel 配置部分代替：

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

`ChannelSetupWizard` 类型支持 `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。完整示例请参见捆绑 Plugin 包（例如 Discord Plugin 的 `src/channel.setup.ts`）。

对于仅需要标准 `note -> prompt -> parse -> merge -> patch` 流程的 DM 允许列表提示，优先使用来自 `openclaw/plugin-sdk/setup` 的共享设置辅助工具：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。

对于仅因标签、分数和可选额外行而变化的 Channel 设置状态块，优先使用来自 `openclaw/plugin-sdk/setup` 的 `createStandardChannelSetupStatus(...)` 而不是在每个 Plugin 中手工编写同样的 `status` 对象。

对于仅在特定上下文中出现的可选设置界面，使用来自 `openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface`：

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

`plugin-sdk/channel-setup` 还暴露了更底层的 `createOptionalChannelSetupAdapter(...)` 和 `createOptionalChannelSetupWizard(...)` 构建器，当您只需要该可选安装界面的一半时使用。

生成的可选适配器/向导在真实配置写入时会失败关闭。它们在 `validateInput`、`applyAccountConfig` 和 `finalize` 之间复用同一条需要安装的消息，并在设置了 `docsPath` 时附加文档链接。

对于二进制支持的设置 UI，优先使用共享的委托辅助工具，而不是将相同的二进制/状态胶水复制到每个 Channel：

- `createDetectedBinaryStatus(...)` 用于仅因标签、提示、分数和二进制检测而变化的状态块
- `createCliPathTextInput(...)` 用于路径支持的文本输入
- `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)`，当 `setupEntry` 需要懒加载地转发到更重量级的完整向导时
- `createDelegatedTextInputShouldPrompt(...)`，当 `setupEntry` 只需要委托 `textInputs[*].shouldPrompt` 决策时

## 发布和安装

**外部 Plugin：** 发布到 [ClawHub](/tools/clawhub) 或 npm，然后安装：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

OpenClaw 首先尝试 ClawHub，然后自动回退到 npm。您也可以显式强制使用 ClawHub：

```bash
openclaw plugins install clawhub:@myorg/openclaw-my-plugin   # 仅 ClawHub
```

没有匹配的 `npm:` 覆盖。当您希望在 ClawHub 回退后使用 npm 路径时，请使用普通的 npm 包规格：

```bash
openclaw plugins install @myorg/openclaw-my-plugin
```

**仓库内 Plugin：** 放在捆绑 Plugin 工作区树下，在构建期间自动发现。

**用户可以安装：**

```bash
openclaw plugins install <package-name>
```

<Info>
  对于 npm 来源的安装，`openclaw plugins install` 运行 `npm install --ignore-scripts`（无生命周期脚本）。保持 Plugin 依赖树为纯 JS/TS，避免需要 `postinstall` 构建的包。
</Info>

## 相关

- [SDK 入口点](/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
- [Plugin 清单](/plugins/manifest) — 完整清单模式参考
- [构建 Plugin](/plugins/building-plugins) — 分步入门指南
