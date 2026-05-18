---
mmh3_hash: "8454ddcb75dca8e146b32f68f5e28835"
title: "Plugin 设置和配置"
sidebarTitle: "设置和配置"
summary: "设置向导、setup-entry.ts、配置模式和 package.json 元数据"
read_when:
  - 您正在向 Plugin 添加设置向导
  - 您需要了解 setup-entry.ts 与 index.ts 的区别
  - 您正在定义 Plugin 配置模式或 package.json openclaw 元数据
doc-schema-version: 1
---

Plugin 打包（`package.json` 元数据）、Manifest（`openclaw.plugin.json`）、设置入口和配置模式的参考文档。

<Tip>
**寻找演练文档？** 操作指南在上下文中涵盖打包：[Channel Plugin](/plugins/sdk-channel-plugins#step-1-package-and-manifest) 和 [Provider Plugin](/plugins/sdk-provider-plugins#step-1-package-and-manifest)。
</Tip>

## 包元数据

您的 `package.json` 需要一个 `openclaw` 字段，告诉 Plugin 系统您的 Plugin 提供什么：

<Tabs>
  <Tab title="Channel Plugin">
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
  </Tab>
  <Tab title="Provider Plugin / ClawHub 基准">
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
  </Tab>
</Tabs>

<Note>
如果您在 ClawHub 上外部发布 Plugin，这些 `compat` 和 `build` 字段是必填的。规范发布片段位于 `docs/snippets/plugin-publish/`。
</Note>

### `openclaw` 字段

<ParamField path="extensions" type="string[]">
  入口点文件（相对于包根目录）。
</ParamField>
<ParamField path="setupEntry" type="string">
  轻量级仅设置入口（可选）。
</ParamField>
<ParamField path="channel" type="object">
  用于设置、选择器、快速入门和状态表面的 Channel 目录元数据。
</ParamField>
<ParamField path="providers" type="string[]">
  此 Plugin 注册的 Provider ID。
</ParamField>
<ParamField path="install" type="object">
  安装提示：`npmSpec`、`localPath`、`defaultChoice`、`minHostVersion`、`expectedIntegrity`、`allowInvalidConfigRecovery`。
</ParamField>
<ParamField path="startup" type="object">
  启动行为标志。
</ParamField>

### `openclaw.channel`

`openclaw.channel` 是运行时加载之前用于 Channel 发现和设置表面的廉价包元数据。

| 字段                                   | 类型       | 含义                                                                |
| -------------------------------------- | ---------- | ------------------------------------------------------------------- |
| `id`                                   | `string`   | 规范 Channel ID。                                                   |
| `label`                                | `string`   | 主要 Channel 标签。                                                 |
| `selectionLabel`                       | `string`   | 选择器/设置标签，当应与 `label` 不同时使用。                        |
| `detailLabel`                          | `string`   | 更丰富的 Channel 目录和状态表面的辅助详细标签。                     |
| `docsPath`                             | `string`   | 用于设置和选择链接的文档路径。                                      |
| `docsLabel`                            | `string`   | 文档链接的覆盖标签，当应与 Channel ID 不同时使用。                  |
| `blurb`                                | `string`   | 简短的入门/目录描述。                                               |
| `order`                                | `number`   | Channel 目录中的排序顺序。                                          |
| `aliases`                              | `string[]` | Channel 选择的额外查找别名。                                        |
| `preferOver`                           | `string[]` | 此 Channel 应优先于的低优先级 Plugin/Channel ID。                  |
| `systemImage`                          | `string`   | Channel UI 目录的可选图标/系统图像名称。                            |
| `selectionDocsPrefix`                  | `string`   | 选择表面中文档链接前的前缀文本。                                    |
| `selectionDocsOmitLabel`               | `boolean`  | 在选择文案中直接显示文档路径而不是带标签的文档链接。                |
| `selectionExtras`                      | `string[]` | 在选择文案中附加的额外简短字符串。                                  |
| `markdownCapable`                      | `boolean`  | 将 Channel 标记为 markdown 能力，用于出站格式化决策。               |
| `exposure`                             | `object`   | 用于设置、已配置列表和文档表面的 Channel 可见性控制。               |
| `quickstartAllowFrom`                  | `boolean`  | 将此 Channel 选择加入标准快速入门 `allowFrom` 设置流程。            |
| `forceAccountBinding`                  | `boolean`  | 即使只存在一个账户也需要显式账户绑定。                              |
| `preferSessionLookupForAnnounceTarget` | `boolean`  | 在解析此 Channel 的公告目标时优先使用 Session 查找。                |

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

- `configured`：在已配置/状态样式列表表面中包含 Channel
- `setup`：在交互式设置/配置选择器中包含 Channel
- `docs`：将 Channel 标记为文档/导航表面中的面向公众内容

<Note>
`showConfigured` 和 `showInSetup` 作为旧版别名仍然受支持。优先使用 `exposure`。
</Note>

### `openclaw.install`

`openclaw.install` 是包元数据，而不是 Manifest 元数据。

| 字段                         | 类型                                | 含义                                                                           |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ |
| `clawhubSpec`                | `string`                            | 用于安装/更新和入门按需安装流程的规范 ClawHub 规格。                           |
| `npmSpec`                    | `string`                            | 用于安装/更新回退流程的规范 npm 规格。                                         |
| `localPath`                  | `string`                            | 本地开发或捆绑安装路径。                                                       |
| `defaultChoice`              | `"clawhub"` \| `"npm"` \| `"local"` | 多个来源可用时的首选安装来源。                                                 |
| `minHostVersion`             | `string`                            | 最低支持的 OpenClaw 版本，格式为 `>=x.y.z` 或 `>=x.y.z-prerelease`。          |
| `expectedIntegrity`          | `string`                            | 预期的 npm dist 完整性字符串，通常为 `sha512-...`，用于固定安装。              |
| `allowInvalidConfigRecovery` | `boolean`                           | 允许捆绑 Plugin 重新安装流程从特定的过时配置失败中恢复。                       |

<AccordionGroup>
  <Accordion title="入门行为">
    交互式入门还将 `openclaw.install` 用于按需安装表面。如果您的 Plugin 在运行时加载之前公开了 Provider 认证选择或 Channel 设置/目录元数据，入门可以显示该选择，提示选择 ClawHub、npm 或本地安装，安装或启用 Plugin，然后继续所选流程。ClawHub 入门选择使用 `clawhubSpec`，在存在时优先；npm 选择需要具有注册表 `npmSpec` 的受信任目录元数据；确切版本和 `expectedIntegrity` 是可选的 npm 固定。如果存在 `expectedIntegrity`，安装/更新流程将对 npm 强制执行它。将"显示什么"元数据保留在 `openclaw.plugin.json` 中，将"如何安装"元数据保留在 `package.json` 中。
  </Accordion>
  <Accordion title="minHostVersion 强制执行">
    如果设置了 `minHostVersion`，安装和非捆绑 Manifest 注册表加载都会强制执行它。旧版主机跳过外部 Plugin；无效的版本字符串被拒绝。假设捆绑源 Plugin 与主机签出具有相同版本。
  </Accordion>
  <Accordion title="固定 npm 安装">
    对于固定 npm 安装，将确切版本保留在 `npmSpec` 中并添加预期的工件完整性：

    ```json
    {
      "openclaw": {
        "install": {
          "npmSpec": "@wecom/wecom-openclaw-plugin@1.2.3",
          "expectedIntegrity": "sha512-REPLACE_WITH_NPM_DIST_INTEGRITY",
          "defaultChoice": "npm"
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="allowInvalidConfigRecovery 范围">
    `allowInvalidConfigRecovery` 不是损坏配置的通用绕过。它仅用于窄捆绑 Plugin 恢复，以便重新安装/设置可以修复已知的升级遗留问题，如同一 Plugin 缺少捆绑 Plugin 路径或过时的 `channels.<id>` 条目。如果配置因不相关原因损坏，安装仍然关闭失败并告知运营商运行 `openclaw doctor --fix`。
  </Accordion>
</AccordionGroup>

### 延迟完整加载

Channel Plugin 可以通过以下方式选择延迟加载：

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

启用后，OpenClaw 在预监听启动阶段仅加载 `setupEntry`，即使对于已配置的 Channel 也是如此。完整入口在 Gateway 开始监听后加载。

<Warning>
仅当您的 `setupEntry` 在 Gateway 开始监听之前注册了 Gateway 所需的一切（Channel 注册、HTTP 路由、Gateway 方法）时才启用延迟加载。如果完整入口拥有必需的启动能力，请保持默认行为。
</Warning>

如果您的设置/完整入口注册了 Gateway RPC 方法，请将它们保留在 Plugin 特定的前缀上。保留的核心管理命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持 Core 拥有并始终解析为 `operator.admin`。

## Plugin Manifest

每个原生 Plugin 必须在包根目录中附带 `openclaw.plugin.json`。OpenClaw 使用它来验证配置而不执行 Plugin 代码。

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

即使没有配置的 Plugin 也必须附带 Schema。空 Schema 是有效的：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

有关完整 Schema 参考，请参见 [Plugin Manifest](/plugins/manifest)。

## ClawHub 发布

对于 Plugin 包，使用特定于包的 ClawHub 命令：

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
```

<Note>
旧版仅限 Skill 的发布别名用于 Skill。Plugin 包应始终使用 `clawhub package publish`。
</Note>

## 设置入口

`setup-entry.ts` 文件是 `index.ts` 的轻量级替代品，当 OpenClaw 只需要设置表面（入门、配置修复、禁用 Channel 检查）时加载。

```typescript
// setup-entry.ts
import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
import { myChannelPlugin } from "./src/channel.js";

export default defineSetupPluginEntry(myChannelPlugin);
```

这避免了在设置流程中加载重型运行时代码（加密库、CLI 注册、后台服务）。

在附属模块中保留设置安全导出的捆绑工作区 Channel 可以使用 `openclaw/plugin-sdk/channel-entry-contract` 中的 `defineBundledChannelSetupEntry(...)` 代替 `defineSetupPluginEntry(...)`。该捆绑契约还支持可选的 `runtime` 导出，以便设置时间的运行时连接可以保持轻量级和显式。

<AccordionGroup>
  <Accordion title="OpenClaw 何时使用 setupEntry 而不是完整入口">
    - Channel 被禁用但需要设置/入门表面。
    - Channel 已启用但未配置。
    - 已启用延迟加载（`deferConfiguredChannelFullLoadUntilAfterListen`）。

  </Accordion>
  <Accordion title="setupEntry 必须注册什么">
    - Channel Plugin 对象（通过 `defineSetupPluginEntry`）。
    - Gateway 监听之前所需的任何 HTTP 路由。
    - 启动期间所需的任何 Gateway 方法。

    这些启动 Gateway 方法仍然应该避免保留的核心管理命名空间，如 `config.*` 或 `update.*`。

  </Accordion>
  <Accordion title="setupEntry 不应包含什么">
    - CLI 注册。
    - 后台服务。
    - 重型运行时导入（加密、SDK）。
    - 仅在启动后需要的 Gateway 方法。

  </Accordion>
</AccordionGroup>

### 窄设置辅助函数导入

对于热设置专用路径，当您只需要设置表面的一部分时，优先使用窄设置辅助函数接缝而不是更宽的 `plugin-sdk/setup` 总体：

| 导入路径                           | 使用场景                                                                  | 主要导出                                                                                                                                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `plugin-sdk/setup-runtime`         | 在 `setupEntry` / 延迟 Channel 启动中保持可用的设置时间运行时辅助函数    | `createSetupTranslator`, `createPatchedAccountSetupAdapter`, `createEnvPatchedAccountSetupAdapter`, `createSetupInputPresenceValidator`, `noteChannelLookupFailure`, `noteChannelLookupSummary`, `promptResolvedAllowFrom`, `splitSetupEntries`, `createAllowlistSetupWizardProxy`, `createDelegatedSetupWizardProxy` |
| `plugin-sdk/setup-adapter-runtime` | 已弃用的兼容性别名；使用 `plugin-sdk/setup-runtime`                       | `createEnvPatchedAccountSetupAdapter`                                                                                                                                                                                                                                                                                 |
| `plugin-sdk/setup-tools`           | 设置/安装 CLI/存档/文档辅助函数                                           | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR`                                                                                                                                                                                                         |

当您需要完整的共享设置工具箱（包括配置补丁辅助函数，如 `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，使用更宽的 `plugin-sdk/setup` 接缝。

对于固定的设置向导文案，使用 `createSetupTranslator(...)`。它遵循 CLI 向导语言环境（`OPENCLAW_LOCALE`，然后是系统语言环境变量）并回退到英语。将 Plugin 特定的设置文本保留在 Plugin 拥有的代码中，仅对通用设置标签、状态文本和官方捆绑 Plugin 设置文案使用共享目录键。

设置补丁适配器在导入时保持热路径安全。它们的捆绑单账户推广契约表面查找是延迟的，因此导入 `plugin-sdk/setup-runtime` 不会在适配器实际使用之前急切加载捆绑契约表面发现。

### Channel 拥有的单账户推广

当 Channel 从单账户顶级配置升级到 `channels.<id>.accounts.*` 时，默认的共享行为是将推广的账户范围值移动到 `accounts.default`。

捆绑 Channel 可以通过其设置契约表面缩小或覆盖该推广：

- `singleAccountKeysToMove`：应移动到推广账户的额外顶级键
- `namedAccountPromotionKeys`：当已存在命名账户时，只有这些键移动到推广账户；共享策略/交付键保留在 Channel 根
- `resolveSingleAccountPromotionTarget(...)`：选择哪个现有账户接收推广值

<Note>
Matrix 是当前捆绑示例。如果恰好已经存在一个命名 Matrix 账户，或者 `defaultAccount` 指向现有的非规范键（如 `Ops`），推广将保留该账户，而不是创建新的 `accounts.default` 条目。
</Note>

## 配置 Schema

Plugin 配置根据 Manifest 中的 JSON Schema 进行验证。用户通过以下方式配置 Plugin：

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

您的 Plugin 在注册期间将此配置作为 `api.pluginConfig` 接收。

对于 Channel 特定的配置，请改用 Channel 配置部分：

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

使用 `buildChannelConfigSchema` 将 Zod Schema 转换为 Plugin 拥有的配置工件使用的 `ChannelConfigSchema` 包装器：

```typescript
import { z } from "zod";
import { buildChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const accountSchema = z.object({
  token: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  accounts: z.object({}).catchall(z.any()).optional(),
  defaultAccount: z.string().optional(),
});

const configSchema = buildChannelConfigSchema(accountSchema);
```

如果您已经将契约编写为 JSON Schema 或 TypeBox，请使用直接辅助函数，以便 OpenClaw 可以在元数据路径上跳过 Zod 到 JSON Schema 的转换：

```typescript
import { Type } from "typebox";
import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const configSchema = buildJsonChannelConfigSchema(
  Type.Object({
    token: Type.Optional(Type.String()),
    allowFrom: Type.Optional(Type.Array(Type.String())),
  }),
);
```

对于第三方 Plugin，冷路径契约仍然是 Plugin Manifest：将生成的 JSON Schema 镜像到 `openclaw.plugin.json#channelConfigs` 中，以便配置 Schema、设置和 UI 表面可以在不加载运行时代码的情况下检查 `channels.<id>`。

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

`ChannelSetupWizard` 类型支持 `credentials`、`textInputs`、`dmPolicy`、`allowFrom`、`groupAccess`、`prepare`、`finalize` 等。有关完整示例，请参见捆绑 Plugin 包（例如 Discord Plugin 的 `src/channel.setup.ts`）。

<AccordionGroup>
  <Accordion title="共享 allowFrom 提示">
    对于只需要标准 `note -> prompt -> parse -> merge -> patch` 流程的 DM 允许列表提示，优先使用 `openclaw/plugin-sdk/setup` 中的共享设置辅助函数：`createPromptParsedAllowFromForAccount(...)`、`createTopLevelChannelParsedAllowFromPrompt(...)` 和 `createNestedChannelParsedAllowFromPrompt(...)`。
  </Accordion>
  <Accordion title="标准 Channel 设置状态">
    对于只在标签、评分和可选额外行上有所不同的 Channel 设置状态块，优先使用 `openclaw/plugin-sdk/setup` 中的 `createStandardChannelSetupStatus(...)`，而不是在每个 Plugin 中手动编写相同的 `status` 对象。
  </Accordion>
  <Accordion title="可选 Channel 设置表面">
    对于只应在某些上下文中出现的可选设置表面，使用 `openclaw/plugin-sdk/channel-setup` 中的 `createOptionalChannelSetupSurface`：

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

    `plugin-sdk/channel-setup` 还公开了较低级别的 `createOptionalChannelSetupAdapter(...)` 和 `createOptionalChannelSetupWizard(...)` 构建器，当您只需要该可选安装表面的一半时使用。

    生成的可选适配器/向导在真实配置写入时关闭失败。它们在 `validateInput`、`applyAccountConfig` 和 `finalize` 中重用一条需要安装的消息，并在设置 `docsPath` 时附加文档链接。

  </Accordion>
  <Accordion title="二进制支持的设置辅助函数">
    对于二进制支持的设置 UI，优先使用共享的委托辅助函数，而不是将相同的二进制/状态粘合代码复制到每个 Channel：

    - `createDetectedBinaryStatus(...)` 用于只在标签、提示、评分和二进制检测上有所不同的状态块
    - `createCliPathTextInput(...)` 用于路径支持的文本输入
    - `createDelegatedSetupWizardStatusResolvers(...)`、`createDelegatedPrepare(...)`、`createDelegatedFinalize(...)` 和 `createDelegatedResolveConfigured(...)` 当 `setupEntry` 需要延迟转发到更重的完整向导时
    - `createDelegatedTextInputShouldPrompt(...)` 当 `setupEntry` 只需要委托 `textInputs[*].shouldPrompt` 决策时

  </Accordion>
</AccordionGroup>

## 发布和安装

**外部 Plugin：** 发布到 [ClawHub](/clawhub)，然后安装：

<Tabs>
  <Tab title="npm">
    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    裸包规格在发布切换期间从 npm 安装。

  </Tab>
  <Tab title="仅 ClawHub">
    ```bash
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```
  </Tab>
  <Tab title="npm 包规格">
    当包尚未迁移到 ClawHub 时，或者在迁移期间需要直接 npm 安装路径时，使用 npm：

    ```bash
    openclaw plugins install npm:@myorg/openclaw-my-plugin
    ```

  </Tab>
</Tabs>

**仓库内 Plugin：** 放在捆绑 Plugin 工作区树下，它们在构建期间自动发现。

**用户可以安装：**

```bash
openclaw plugins install <package-name>
```

<Info>
对于 npm 来源的安装，`openclaw plugins install` 在 `~/.openclaw/npm` 下安装包，禁用生命周期脚本。保持 Plugin 依赖树为纯 JS/TS，避免需要 `postinstall` 构建的包。
</Info>

<Note>
Gateway 启动不安装 Plugin 依赖项。npm/git/ClawHub 安装流程拥有依赖项收敛；本地 Plugin 必须已经安装了它们的依赖项。
</Note>

捆绑包元数据是显式的，而不是在 Gateway 启动时从构建的 JavaScript 推断的。运行时依赖项属于拥有它们的 Plugin 包；打包的 OpenClaw 启动永远不会修复或镜像 Plugin 依赖项。

## 相关

- [构建 Plugin](/plugins/building-plugins) — 分步入门指南
- [Plugin Manifest](/plugins/manifest) — 完整 Manifest Schema 参考
- [SDK 入口点](/plugins/sdk-entrypoints) — `definePluginEntry` 和 `defineChannelPluginEntry`
