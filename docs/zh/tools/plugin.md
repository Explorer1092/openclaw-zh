---
mmh3_hash: "96e714ca232a07e1dadc12e373a521d0"
summary: "OpenClaw Plugins/Extensions：发现、配置和安全"
read_when:
  - 添加或修改 Plugins/Extensions
  - 记录 Plugin 安装或加载规则
title: "Plugins"
---

# Plugins（Extensions）

## 快速入门（Plugin 新手？）

Plugin 只是一个**小代码模块**，通过额外功能（命令、工具和 Gateway RPC）扩展 OpenClaw。

大多数时候，当您需要尚未内置到核心 OpenClaw 中的功能（或您想将可选功能保留在主安装之外）时，您将使用 Plugins。

快速路径：

1. 查看已加载的内容：

```bash
openclaw plugins list
```

2. 安装官方 Plugin（示例：Voice Call）：

```bash
openclaw plugins install @openclaw/voice-call
```

Npm 规范**仅限注册表**（包名 + 可选版本/标签）。Git/URL/文件规范被拒绝。

3. 重启 Gateway，然后在 `plugins.entries.<id>.config` 下配置。

参见 [Voice Call](/plugins/voice-call) 获取具体的 Plugin 示例。

## 可用的 Plugins（官方）

- Microsoft Teams 自 2026.1.15 起仅为 Plugin；如果您使用 Teams，请安装 `@openclaw/msteams`。
- Memory（Core）— 内置内存搜索 Plugin（默认通过 `plugins.slots.memory` 启用）
- Memory（LanceDB）— 内置长期内存 Plugin（自动召回/捕获；设置 `plugins.slots.memory = "memory-lancedb"`）
- [Voice Call](/plugins/voice-call) — `@openclaw/voice-call`
- [Zalo Personal](/plugins/zalouser) — `@openclaw/zalouser`
- [Matrix](/channels/matrix) — `@openclaw/matrix`
- [Nostr](/channels/nostr) — `@openclaw/nostr`
- [Zalo](/channels/zalo) — `@openclaw/zalo`
- [Microsoft Teams](/channels/msteams) — `@openclaw/msteams`
- Google Antigravity OAuth（Provider 身份验证）— 内置为 `google-antigravity-auth`（默认禁用）
- Gemini CLI OAuth（Provider 身份验证）— 内置为 `google-gemini-cli-auth`（默认禁用）
- Qwen OAuth（Provider 身份验证）— 内置为 `qwen-portal-auth`（默认禁用）
- Copilot Proxy（Provider 身份验证）— 本地 VS Code Copilot Proxy 桥接；与内置 `github-copilot` 设备登录不同（内置，默认禁用）

OpenClaw Plugins 是通过 jiti 在运行时加载的 **TypeScript 模块**。**配置验证不执行 Plugin 代码**；它使用 Plugin 清单和 JSON Schema。参见 [Plugin 清单](/plugins/manifest)。

Plugins 可以注册：

- Gateway RPC 方法
- Gateway HTTP 处理程序
- Agent 工具
- CLI 命令
- 后台服务
- 可选配置验证
- **Skills**（通过在 Plugin 清单中列出 `skills` 目录）
- **自动回复命令**（无需调用 AI Agent 即可执行）

Plugins 在 Gateway **进程内**运行，因此将它们视为受信任的代码。工具编写指南：[Plugin Agent 工具](/plugins/agent-tools)。

## 运行时助手

Plugins 可以通过 `api.runtime` 访问选定的核心助手。对于电话 TTS：

```ts
const result = await api.runtime.tts.textToSpeechTelephony({
  text: "Hello from OpenClaw",
  cfg: api.config,
});
```

注意：

- 使用核心 `messages.tts` 配置（OpenAI 或 ElevenLabs）。
- 返回 PCM 音频缓冲区 + 采样率。Plugins 必须为 Providers 重新采样/编码。
- 电话不支持 Edge TTS。

## 发现和优先级

OpenClaw 按顺序扫描：

1. 配置路径

- `plugins.load.paths`（文件或目录）

2. 工作空间扩展

- `<workspace>/.openclaw/extensions/*.ts`
- `<workspace>/.openclaw/extensions/*/index.ts`

3. 全局扩展

- `~/.openclaw/extensions/*.ts`
- `~/.openclaw/extensions/*/index.ts`

4. 内置扩展（随 OpenClaw 一起提供，**默认禁用**）

- `<openclaw>/extensions/*`

内置 Plugins 必须通过 `plugins.entries.<id>.enabled` 或 `openclaw plugins enable <id>` 显式启用。已安装的 Plugins 默认启用，但可以以相同方式禁用。

每个 Plugin 必须在其根目录中包含一个 `openclaw.plugin.json` 文件。如果路径指向文件，则 Plugin 根目录是文件的目录，并且必须包含清单。

如果多个 Plugins 解析为相同的 ID，则上述顺序中的第一个匹配项获胜，较低优先级的副本将被忽略。

### 包集合

Plugin 目录可能包含带有 `openclaw.extensions` 的 `package.json`：

```json
{
  "name": "my-pack",
  "openclaw": {
    "extensions": ["./src/safety.ts", "./src/tools.ts"]
  }
}
```

每个条目都成为一个 Plugin。如果包列出多个扩展，则 Plugin ID 变为 `name/<fileBase>`。

如果您的 Plugin 导入 npm 依赖项，请在该目录中安装它们，以便 `node_modules` 可用（`npm install` / `pnpm install`）。

安全说明：`openclaw plugins install` 使用 `npm install --ignore-scripts` 安装 Plugin 依赖项（不运行生命周期脚本）。保持 Plugin 依赖树为"纯 JS/TS"，避免需要 `postinstall` 构建的包。

### Channel 目录元数据

Channel Plugins 可以通过 `openclaw.channel` 发布引导元数据，并通过 `openclaw.install` 发布安装提示。这使核心目录保持无数据。

示例：

```json
{
  "name": "@openclaw/nextcloud-talk",
  "openclaw": {
    "extensions": ["./index.ts"],
    "channel": {
      "id": "nextcloud-talk",
      "label": "Nextcloud Talk",
      "selectionLabel": "Nextcloud Talk (self-hosted)",
      "docsPath": "/channels/nextcloud-talk",
      "docsLabel": "nextcloud-talk",
      "blurb": "Self-hosted chat via Nextcloud Talk webhook bots.",
      "order": 65,
      "aliases": ["nc-talk", "nc"]
    },
    "install": {
      "npmSpec": "@openclaw/nextcloud-talk",
      "localPath": "extensions/nextcloud-talk",
      "defaultChoice": "npm"
    }
  }
}
```

OpenClaw 还可以合并**外部 Channel 目录**（例如，MPM 注册表导出）。在以下位置之一放置 JSON 文件：

- `~/.openclaw/mpm/plugins.json`
- `~/.openclaw/mpm/catalog.json`
- `~/.openclaw/plugins/catalog.json`

或将 `OPENCLAW_PLUGIN_CATALOG_PATHS`（或 `OPENCLAW_MPM_CATALOG_PATHS`）指向一个或多个 JSON 文件（逗号/分号/`PATH` 分隔）。每个文件应包含 `{ "entries": [ { "name": "@scope/pkg", "openclaw": { "channel": {...}, "install": {...} } } ] }`。

## Plugin ID

默认 Plugin ID：

- 包集合：`package.json` `name`
- 独立文件：文件基本名称（`~/.../voice-call.ts` → `voice-call`）

如果 Plugin 导出 `id`，OpenClaw 使用它，但在它与配置的 ID 不匹配时发出警告。

## 配置

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-extension"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

字段：

- `enabled`：主开关（默认：true）
- `allow`：白名单（可选）
- `deny`：黑名单（可选；拒绝优先）
- `load.paths`：额外的 Plugin 文件/目录
- `entries.<id>`：每个 Plugin 的切换 + 配置

配置更改**需要重启 Gateway**。

验证规则（严格）：

- `entries`、`allow`、`deny` 或 `slots` 中的未知 Plugin ID 是**错误**。
- 未知的 `channels.<id>` 键是**错误**，除非 Plugin 清单声明了 Channel ID。
- Plugin 配置使用 `openclaw.plugin.json`（`configSchema`）中嵌入的 JSON Schema 进行验证。
- 如果禁用 Plugin，则保留其配置并发出**警告**。

## Plugin 插槽（独占类别）

某些 Plugin 类别是**独占的**（一次只有一个活动）。使用 `plugins.slots` 选择哪个 Plugin 拥有插槽：

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // 或 "none" 以禁用内存 Plugins
    },
  },
}
```

如果多个 Plugins 声明 `kind: "memory"`，则只加载选定的一个。其他将被禁用并带有诊断信息。

## Control UI（Schema + 标签）

Control UI 使用 `config.schema`（JSON Schema + `uiHints`）来呈现更好的表单。

OpenClaw 根据发现的 Plugins 在运行时增强 `uiHints`：

- 为 `plugins.entries.<id>` / `.enabled` / `.config` 添加每个 Plugin 的标签
- 在以下位置合并可选的 Plugin 提供的配置字段提示：`plugins.entries.<id>.config.<field>`

如果您希望 Plugin 配置字段显示良好的标签/占位符（并将密钥标记为敏感），请在 Plugin 清单中的 JSON Schema 旁边提供 `uiHints`。

示例：

```json
{
  "id": "my-plugin",
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": { "type": "string" },
      "region": { "type": "string" }
    }
  },
  "uiHints": {
    "apiKey": { "label": "API Key", "sensitive": true },
    "region": { "label": "Region", "placeholder": "us-east-1" }
  }
}
```

## CLI

```bash
openclaw plugins list
openclaw plugins info <id>
openclaw plugins install <path>                 # 将本地文件/目录复制到 ~/.openclaw/extensions/<id>
openclaw plugins install ./extensions/voice-call # 相对路径可以
openclaw plugins install ./plugin.tgz           # 从本地 tarball 安装
openclaw plugins install ./plugin.zip           # 从本地 zip 安装
openclaw plugins install -l ./extensions/voice-call # 链接（不复制）用于开发
openclaw plugins install @openclaw/voice-call # 从 npm 安装
openclaw plugins update <id>
openclaw plugins update --all
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins doctor
```

`plugins update` 仅适用于在 `plugins.installs` 下跟踪的 npm 安装。

Plugins 也可以注册自己的顶级命令（示例：`openclaw voicecall`）。

## Plugin API（概述）

Plugins 导出：

- 函数：`(api) => { ... }`
- 对象：`{ id, name, configSchema, register(api) { ... } }`

## Plugin Hooks

Plugins 可以提供 Hooks 并在运行时注册它们。这使 Plugin 能够捆绑事件驱动的自动化，而无需单独的 Hook 包安装。

### 示例

```
import { registerPluginHooksFromDir } from "openclaw/plugin-sdk";

export default function register(api) {
  registerPluginHooksFromDir(api, "./hooks");
}
```

注意：

- Hook 目录遵循正常的 Hook 结构（`HOOK.md` + `handler.ts`）。
- Hook 资格规则仍然适用（OS/bins/env/config 要求）。
- Plugin 管理的 Hooks 在 `openclaw hooks list` 中显示为 `plugin:<id>`。
- 您无法通过 `openclaw hooks` 启用/禁用 Plugin 管理的 Hooks；改为启用/禁用 Plugin。

## Provider Plugins（模型身份验证）

Plugins 可以注册**模型 Provider 身份验证**流程，以便用户可以在 OpenClaw 内运行 OAuth 或 API 密钥设置（不需要外部脚本）。

通过 `api.registerProvider(...)` 注册 Provider。每个 Provider 公开一种或多种身份验证方法（OAuth、API 密钥、设备代码等）。这些方法支持：

- `openclaw models auth login --provider <id> [--method <id>]`

示例：

```ts
api.registerProvider({
  id: "acme",
  label: "AcmeAI",
  auth: [
    {
      id: "oauth",
      label: "OAuth",
      kind: "oauth",
      run: async (ctx) => {
        // 运行 OAuth 流程并返回身份验证配置文件。
        return {
          profiles: [
            {
              profileId: "acme:default",
              credential: {
                type: "oauth",
                provider: "acme",
                access: "...",
                refresh: "...",
                expires: Date.now() + 3600 * 1000,
              },
            },
          ],
          defaultModel: "acme/opus-1",
        };
      },
    },
  ],
});
```

注意：

- `run` 接收带有 `prompter`、`runtime`、`openUrl` 和 `oauth.createVpsAwareHandlers` 助手的 `ProviderAuthContext`。
- 当您需要添加默认模型或 Provider 配置时，返回 `configPatch`。
- 返回 `defaultModel`，以便 `--set-default` 可以更新 Agent 默认值。

### 注册消息 Channel

Plugins 可以注册行为类似内置 Channels（WhatsApp、Telegram 等）的 **Channel Plugins**。Channel 配置位于 `channels.<id>` 下，并由您的 Channel Plugin 代码验证。

```ts
const myChannel = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "demo channel plugin.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async () => ({ ok: true }),
  },
};

export default function (api) {
  api.registerChannel({ plugin: myChannel });
}
```

注意：

- 将配置放在 `channels.<id>` 下（不是 `plugins.entries`）。
- `meta.label` 用于 CLI/UI 列表中的标签。
- `meta.aliases` 为规范化和 CLI 输入添加备用 ID。
- `meta.preferOver` 列出当两者都配置时跳过自动启用的 Channel ID。
- `meta.detailLabel` 和 `meta.systemImage` 让 UI 显示更丰富的 Channel 标签/图标。

### 编写新的消息 Channel（分步指南）

当您想要**新的聊天界面**（"消息 Channel"）而不是模型 Provider 时使用此方法。模型 Provider 文档位于 `/providers/*` 下。

1. 选择 ID + 配置形状

- 所有 Channel 配置都位于 `channels.<id>` 下。
- 对于多帐户设置，更喜欢 `channels.<id>.accounts.<accountId>`。

2. 定义 Channel 元数据

- `meta.label`、`meta.selectionLabel`、`meta.docsPath`、`meta.blurb` 控制 CLI/UI 列表。
- `meta.docsPath` 应指向像 `/channels/<id>` 这样的文档页面。
- `meta.preferOver` 让 Plugin 替换另一个 Channel（自动启用优先它）。
- `meta.detailLabel` 和 `meta.systemImage` 由 UI 用于详细文本/图标。

3. 实现所需的适配器

- `config.listAccountIds` + `config.resolveAccount`
- `capabilities`（聊天类型、媒体、线程等）
- `outbound.deliveryMode` + `outbound.sendText`（用于基本发送）

4. 根据需要添加可选适配器

- `setup`（向导）、`security`（DM 策略）、`status`（健康/诊断）
- `gateway`（启动/停止/登录）、`mentions`、`threading`、`streaming`
- `actions`（消息操作）、`commands`（原生命令行为）

5. 在您的 Plugin 中注册 Channel

- `api.registerChannel({ plugin })`

最小配置示例：

```json5
{
  channels: {
    acmechat: {
      accounts: {
        default: { token: "ACME_TOKEN", enabled: true },
      },
    },
  },
}
```

最小 Channel Plugin（仅出站）：

```ts
const plugin = {
  id: "acmechat",
  meta: {
    id: "acmechat",
    label: "AcmeChat",
    selectionLabel: "AcmeChat (API)",
    docsPath: "/channels/acmechat",
    blurb: "AcmeChat messaging channel.",
    aliases: ["acme"],
  },
  capabilities: { chatTypes: ["direct"] },
  config: {
    listAccountIds: (cfg) => Object.keys(cfg.channels?.acmechat?.accounts ?? {}),
    resolveAccount: (cfg, accountId) =>
      cfg.channels?.acmechat?.accounts?.[accountId ?? "default"] ?? {
        accountId,
      },
  },
  outbound: {
    deliveryMode: "direct",
    sendText: async ({ text }) => {
      // 在此处将 `text` 传递到您的 Channel
      return { ok: true };
    },
  },
};

export default function (api) {
  api.registerChannel({ plugin });
}
```

加载 Plugin（扩展目录或 `plugins.load.paths`），重启 Gateway，然后在您的配置中配置 `channels.<id>`。

### Agent 工具

参见专门指南：[Plugin Agent 工具](/plugins/agent-tools)。

### 注册 Gateway RPC 方法

```ts
export default function (api) {
  api.registerGatewayMethod("myplugin.status", ({ respond }) => {
    respond(true, { ok: true });
  });
}
```

### 注册 CLI 命令

```ts
export default function (api) {
  api.registerCli(
    ({ program }) => {
      program.command("mycmd").action(() => {
        console.log("Hello");
      });
    },
    { commands: ["mycmd"] },
  );
}
```

### 注册自动回复命令

Plugins 可以注册**无需调用 AI Agent** 即可执行的自定义斜杠命令。这对于切换命令、状态检查或不需要 LLM 处理的快速操作很有用。

```ts
export default function (api) {
  api.registerCommand({
    name: "mystatus",
    description: "Show plugin status",
    handler: (ctx) => ({
      text: `Plugin is running! Channel: ${ctx.channel}`,
    }),
  });
}
```

命令处理程序上下文：

- `senderId`：发送者的 ID（如果可用）
- `channel`：发送命令的 Channel
- `isAuthorizedSender`：发送者是否为授权用户
- `args`：命令后传递的参数（如果 `acceptsArgs: true`）
- `commandBody`：完整的命令文本
- `config`：当前 OpenClaw 配置

命令选项：

- `name`：命令名称（不带前导 `/`）
- `description`：命令列表中显示的帮助文本
- `acceptsArgs`：命令是否接受参数（默认：false）。如果为 false 并提供参数，则命令不会匹配，消息会传递给其他处理程序
- `requireAuth`：是否需要授权发送者（默认：true）
- `handler`：返回 `{ text: string }` 的函数（可以是异步的）

带授权和参数的示例：

```ts
api.registerCommand({
  name: "setmode",
  description: "Set plugin mode",
  acceptsArgs: true,
  requireAuth: true,
  handler: async (ctx) => {
    const mode = ctx.args?.trim() || "default";
    await saveMode(mode);
    return { text: `Mode set to: ${mode}` };
  },
});
```

注意：

- Plugin 命令在内置命令和 AI Agent **之前**处理
- 命令全局注册并在所有 Channels 上工作
- 命令名称不区分大小写（`/MyStatus` 匹配 `/mystatus`）
- 命令名称必须以字母开头，仅包含字母、数字、连字符和下划线
- 保留的命令名称（如 `help`、`status`、`reset` 等）不能被 Plugins 覆盖
- 跨 Plugins 的重复命令注册将失败并显示诊断错误

### 注册后台服务

```ts
export default function (api) {
  api.registerService({
    id: "my-service",
    start: () => api.logger.info("ready"),
    stop: () => api.logger.info("bye"),
  });
}
```

## 命名约定

- Gateway 方法：`pluginId.action`（示例：`voicecall.status`）
- 工具：`snake_case`（示例：`voice_call`）
- CLI 命令：kebab 或 camel，但避免与核心命令冲突

## Skills

Plugins 可以在仓库中提供 Skill（`skills/<name>/SKILL.md`）。使用 `plugins.entries.<id>.enabled`（或其他配置门控）启用它，并确保它存在于您的工作空间/托管 Skills 位置。

## 分发（npm）

推荐的打包：

- 主包：`openclaw`（此仓库）
- Plugins：`@openclaw/*` 下的单独 npm 包（示例：`@openclaw/voice-call`）

发布合同：

- Plugin `package.json` 必须包含带有一个或多个入口文件的 `openclaw.extensions`。
- 入口文件可以是 `.js` 或 `.ts`（jiti 在运行时加载 TS）。
- `openclaw plugins install <npm-spec>` 使用 `npm pack`，提取到 `~/.openclaw/extensions/<id>/`，并在配置中启用它。
- 配置键稳定性：作用域包被规范化为 `plugins.entries.*` 的**无作用域** ID。

## 示例 Plugin：Voice Call

此仓库包含一个语音通话 Plugin（Twilio 或日志回退）：

- 源代码：`extensions/voice-call`
- Skill：`skills/voice-call`
- CLI：`openclaw voicecall start|status`
- 工具：`voice_call`
- RPC：`voicecall.start`、`voicecall.status`
- 配置（twilio）：`provider: "twilio"` + `twilio.accountSid/authToken/from`（可选 `statusCallbackUrl`、`twimlUrl`）
- 配置（dev）：`provider: "log"`（无网络）

参见 [Voice Call](/plugins/voice-call) 和 `extensions/voice-call/README.md` 以获取设置和使用。

## 安全注意事项

Plugins 在 Gateway 进程内运行。将它们视为受信任的代码：

- 仅安装您信任的 Plugins。
- 更喜欢 `plugins.allow` 白名单。
- 更改后重启 Gateway。

## 测试 Plugins

Plugins 可以（并且应该）附带测试：

- 仓库内 Plugins 可以在 `src/**` 下保留 Vitest 测试（示例：`src/plugins/voice-call.plugin.test.ts`）。
- 单独发布的 Plugins 应该运行自己的 CI（lint/build/test）并验证 `openclaw.extensions` 指向构建的入口点（`dist/index.js`）。
