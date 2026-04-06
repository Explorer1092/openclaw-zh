---
mmh3_hash: "195254a98a19929731e64138d261e92c"
title: "构建 Plugin"
sidebarTitle: "入门指南"
summary: "几分钟内创建您的第一个 OpenClaw Plugin"
read_when:
  - 您想创建新的 OpenClaw Plugin
  - 您需要 Plugin 开发的快速入门指南
  - 您正在向 OpenClaw 添加新的 Channel、Provider、Tool 或其他能力
---

# 构建 Plugin

Plugin 通过以下能力扩展 OpenClaw：Channel、模型 Provider、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取、Web 搜索、Agent Tool 或任意组合。

您无需将 Plugin 添加到 OpenClaw 仓库。发布到 [ClawHub](/tools/clawhub) 或 npm，用户使用以下命令安装：

```bash
openclaw plugins install <package-name>
```

OpenClaw 首先尝试 ClawHub，然后自动回退到 npm。

## 前提条件

- Node >= 22 和包管理器（npm 或 pnpm）
- 熟悉 TypeScript (ESM)
- 对于仓库内 Plugin：已克隆仓库并完成 `pnpm install`

## 您要构建哪种 Plugin？

<CardGroup cols={3}>
  <Card title="Channel Plugin" icon="messages-square" href="/plugins/sdk-channel-plugins">
    将 OpenClaw 连接到消息平台（Discord、IRC 等）
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/plugins/sdk-provider-plugins">
    添加模型 Provider（LLM、代理或自定义端点）
  </Card>
  <Card title="Tool / Hook Plugin" icon="wrench">
    注册 Agent Tool、事件 Hook 或服务 — 继续阅读下方内容
  </Card>
</CardGroup>

如果 Channel Plugin 是可选的，且在入门/设置运行时可能未安装，请使用来自 `openclaw/plugin-sdk/channel-setup` 的 `createOptionalChannelSetupSurface(...)`。它会生成一个设置适配器 + 向导对，宣传安装要求，并在真正的配置写入之前在 Plugin 未安装时失败关闭。

## 快速入门：Tool Plugin

此演练创建一个注册 Agent Tool 的最小 Plugin。Channel 和 Provider Plugin 有上方链接的专门指南。

<Steps>
  <Step title="创建包和清单">
    <CodeGroup>
    ```json package.json
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

    ```json openclaw.plugin.json
    {
      "id": "my-plugin",
      "name": "My Plugin",
      "description": "Adds a custom tool to OpenClaw",
      "configSchema": {
        "type": "object",
        "additionalProperties": false
      }
    }
    ```
    </CodeGroup>

    每个 Plugin 都需要一个清单，即使没有配置也是如此。完整模式请参见 [清单](/plugins/manifest)。ClawHub 发布代码片段的规范模板在 `docs/snippets/plugin-publish/` 中。

  </Step>

  <Step title="编写入口点">

    ```typescript
    // index.ts
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
    import { Type } from "@sinclair/typebox";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Adds a custom tool to OpenClaw",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "Do a thing",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return { content: [{ type: "text", text: `Got: ${params.input}` }] };
          },
        });
      },
    });
    ```

    `definePluginEntry` 用于非 Channel Plugin。对于 Channel，使用 `defineChannelPluginEntry` — 参见 [Channel Plugin](/plugins/sdk-channel-plugins)。完整入口点选项请参见 [入口点](/plugins/sdk-entrypoints)。

  </Step>

  <Step title="测试和发布">

    **外部 Plugin：** 使用 ClawHub 验证和发布，然后安装：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    对于不带前缀的包规格（如 `@myorg/openclaw-my-plugin`），OpenClaw 也会在 npm 之前检查 ClawHub。

    **仓库内 Plugin：** 放在打包 Plugin 工作区树下 — 自动发现。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 能力

单个 Plugin 可以通过 `api` 对象注册任意数量的能力：

| 能力                | 注册方法                                                 | 详细指南                                                                          |
| ------------------- | -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 文本推理 (LLM)      | `api.registerProvider(...)`                              | [Provider Plugin](/plugins/sdk-provider-plugins)                                  |
| Channel / 消息      | `api.registerChannel(...)`                               | [Channel Plugin](/plugins/sdk-channel-plugins)                                    |
| 语音 (TTS/STT)      | `api.registerSpeechProvider(...)`                        | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 实时转录            | `api.registerRealtimeTranscriptionProvider(...)`         | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 实时语音            | `api.registerRealtimeVoiceProvider(...)`                 | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 媒体理解            | `api.registerMediaUnderstandingProvider(...)`            | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 图像生成            | `api.registerImageGenerationProvider(...)`               | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 音乐生成            | `api.registerMusicGenerationProvider(...)`               | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 视频生成            | `api.registerVideoGenerationProvider(...)`               | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Web 抓取            | `api.registerWebFetchProvider(...)`                      | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Web 搜索            | `api.registerWebSearchProvider(...)`                     | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Agent Tool          | `api.registerTool(...)`                                  | 下方                                                                              |
| 自定义命令          | `api.registerCommand(...)`                               | [入口点](/plugins/sdk-entrypoints)                                                |
| 事件 Hook           | `api.registerHook(...)`                                  | [入口点](/plugins/sdk-entrypoints)                                                |
| HTTP 路由           | `api.registerHttpRoute(...)`                             | [内部架构](/plugins/architecture#gateway-http-routes)                             |
| CLI 子命令          | `api.registerCli(...)`                                   | [入口点](/plugins/sdk-entrypoints)                                                |

完整注册 API 请参见 [SDK 概览](/plugins/sdk-overview#registration-api)。

如果您的 Plugin 注册自定义 Gateway RPC 方法，请保持它们在 Plugin 特定的前缀下。核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持保留状态，始终解析为 `operator.admin`，即使 Plugin 请求更窄的范围。

需要记住的 Hook 守护语义：

- `before_tool_call`：`{ block: true }` 是终止的，停止较低优先级的处理程序。
- `before_tool_call`：`{ block: false }` 被视为无决策。
- `before_tool_call`：`{ requireApproval: true }` 暂停 Agent 执行，通过执行批准覆盖层、Telegram 按钮、Discord 交互或任何 Channel 上的 `/approve` 命令提示用户批准。
- `before_install`：`{ block: true }` 是终止的，停止较低优先级的处理程序。
- `before_install`：`{ block: false }` 被视为无决策。
- `message_sending`：`{ cancel: true }` 是终止的，停止较低优先级的处理程序。
- `message_sending`：`{ cancel: false }` 被视为无决策。

`/approve` 命令通过有限回退同时处理执行和 Plugin 批准：当找不到执行批准 id 时，OpenClaw 通过 Plugin 批准重试相同的 id。Plugin 批准转发可以通过配置中的 `approvals.plugin` 独立配置。

如果自定义批准管道需要检测相同的有限回退情况，优先使用来自 `openclaw/plugin-sdk/error-runtime` 的 `isApprovalNotFoundError`，而不是手动匹配批准到期字符串。

详见 [SDK 概览 Hook 决策语义](/plugins/sdk-overview#hook-decision-semantics)。

## 注册 Agent Tool

Tool 是 LLM 可以调用的类型化函数。它们可以是必需的（始终可用）或可选的（用户选择加入）：

```typescript
register(api) {
  // 必需 Tool — 始终可用
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // 可选 Tool — 用户必须添加到允许列表
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a workflow",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

用户在配置中启用可选 Tool：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- Tool 名称不得与核心 Tool 名称冲突（冲突的 Tool 会被跳过）
- 对于有副作用或需要额外二进制依赖的 Tool，使用 `optional: true`
- 用户可以通过将 Plugin id 添加到 `tools.allow` 来启用 Plugin 的所有 Tool

## 导入规范

始终从专注的 `openclaw/plugin-sdk/<subpath>` 路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// 错误：单体根（已弃用，将被移除）
import { ... } from "openclaw/plugin-sdk";
```

完整子路径参考请参见 [SDK 概览](/plugins/sdk-overview)。

在您的 Plugin 中，使用本地 barrel 文件进行内部导入（`api.ts`、`runtime-api.ts`）— 永远不要通过 SDK 路径导入自己的 Plugin。

对于 Provider Plugin，将 Provider 特定的辅助工具保留在那些包根 barrel 中，除非接口真的是通用的。当前打包示例：

- Anthropic：Claude 流包装器和 `service_tier`/beta 辅助工具
- OpenAI：Provider 构建器、默认模型辅助工具、实时 Provider
- OpenRouter：Provider 构建器加上入门/配置辅助工具

如果辅助工具仅在一个打包 Provider 包内有用，请将其保留在该包根接口上，而不是将其提升到 `openclaw/plugin-sdk/*` 中。

## 提交前检查清单

<Check>**package.json** 包含正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** 清单存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入使用专注的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而不是 SDK 自导入</Check>
<Check>测试通过（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>仓库内 Plugin 通过 `pnpm check`</Check>

## Beta 版测试

1. 关注 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上的 GitHub 发布标签，并通过 `Watch` > `Releases` 订阅。Beta 标签看起来像 `v2026.3.N-beta.1`。您也可以在官方 OpenClaw X 账号 [@openclaw](https://x.com/openclaw) 上开启发布公告通知。
2. 一旦 Beta 标签出现，立即针对它测试您的 Plugin。在稳定版之前的窗口期通常只有几个小时。
3. 测试后，在 Discord `plugin-forum` 频道中您的 Plugin 话题中发布 `all good` 或描述出现的问题。如果还没有话题，请创建一个。
4. 如果出现问题，请打开或更新一个标题为 `Beta blocker: <plugin-name> - <summary>` 的 Issue，并添加 `beta-blocker` 标签。在您的话题中放置 Issue 链接。
5. 向 `main` 打开一个标题为 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，并在 PR 和您的 Discord 话题中都链接该 Issue。贡献者无法标记 PR，所以标题是维护者和自动化的 PR 端信号。有 PR 的阻止问题会被合并；没有的可能还是会发布。维护者在 Beta 测试期间监视这些话题。
6. 沉默意味着通过。如果您错过了窗口，您的修复可能会在下一个周期中发布。

## 后续步骤

<CardGroup cols={2}>
  <Card title="Channel Plugin" icon="messages-square" href="/plugins/sdk-channel-plugins">
    构建消息 Channel Plugin
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/plugins/sdk-provider-plugins">
    构建模型 Provider Plugin
  </Card>
  <Card title="SDK 概览" icon="book-open" href="/plugins/sdk-overview">
    导入映射和注册 API 参考
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、搜索、子 Agent
  </Card>
  <Card title="测试" icon="test-tubes" href="/plugins/sdk-testing">
    测试工具和模式
  </Card>
  <Card title="Plugin 清单" icon="file-json" href="/plugins/manifest">
    完整清单模式参考
  </Card>
</CardGroup>

## 相关

- [Plugin 架构](/plugins/architecture) — 内部架构深度剖析
- [SDK 概览](/plugins/sdk-overview) — Plugin SDK 参考
- [清单](/plugins/manifest) — Plugin 清单格式
- [Channel Plugin](/plugins/sdk-channel-plugins) — 构建 Channel Plugin
- [Provider Plugin](/plugins/sdk-provider-plugins) — 构建 Provider Plugin
