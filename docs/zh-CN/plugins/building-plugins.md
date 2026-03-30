---
mmh3_hash: "67dfa1c1aa25adc483cf1a19e997bdb6"
title: 构建插件
sidebarTitle: 入门
summary: 快速创建你的第一个 OpenClaw 插件
read_when:
  - 你想创建一个新的 OpenClaw 插件
  - 你需要插件开发的快速入门指南
  - 你正在为 OpenClaw 添加新的 Channel、Provider、工具或其他能力
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/building-plugins.md
  workflow: 15
---

# 构建插件

插件为 OpenClaw 扩展新能力：Channel、模型 Provider、语音、图像生成、网络搜索、Agent 工具或以上任意组合。

你无需将插件添加到 OpenClaw 代码仓库。发布到 [ClawHub](/tools/clawhub) 或 npm 后，用户可通过 `openclaw plugins install <package-name>` 安装。OpenClaw 会优先尝试 ClawHub，若未找到则自动回退到 npm。

## 前置条件

- Node >= 22 及包管理器（npm 或 pnpm）
- 熟悉 TypeScript（ESM）
- 对于仓库内插件：已克隆仓库并完成 `pnpm install`

## 你要构建哪种插件？

<CardGroup cols={3}>
  <Card title="Channel 插件" icon="messages-square" href="/plugins/sdk-channel-plugins">
    将 OpenClaw 连接到消息平台（Discord、IRC 等）
  </Card>
  <Card title="Provider 插件" icon="cpu" href="/plugins/sdk-provider-plugins">
    添加模型 Provider（LLM、代理或自定义端点）
  </Card>
  <Card title="工具 / Hook 插件" icon="wrench">
    注册 Agent 工具、事件 Hook 或服务——继续阅读下文
  </Card>
</CardGroup>

## 快速入门：工具插件

本演练将创建一个注册 Agent 工具的最小插件。Channel 和 Provider 插件有专属指南，链接见上方。

<Steps>
  <Step title="创建包和 Manifest">
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

    每个插件都需要一个 Manifest，即使没有配置项也不例外。完整 Schema 请参阅 [Manifest](/plugins/manifest)。ClawHub 发布的标准代码片段位于 `docs/snippets/plugin-publish/`。

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

    `definePluginEntry` 适用于非 Channel 插件。对于 Channel，请使用 `defineChannelPluginEntry`——参见 [Channel 插件](/plugins/sdk-channel-plugins)。完整的入口点选项请参阅 [Entry Points](/plugins/sdk-entrypoints)。

  </Step>

  <Step title="测试和发布">

    **外部插件：** 通过 ClawHub 验证和发布，然后安装：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    openclaw plugins install clawhub:@myorg/openclaw-my-plugin
    ```

    对于裸包名如 `@myorg/openclaw-my-plugin`，OpenClaw 也会在 npm 之前先检查 ClawHub。

    **仓库内插件：** 放置在已捆绑插件工作区树中——会自动被发现。

    ```bash
    pnpm test -- <bundled-plugin-root>/my-plugin/
    ```

  </Step>
</Steps>

## 插件能力

一个插件可以通过 `api` 对象注册任意数量的能力：

| 能力                  | 注册方法                                          | 详细指南                                                                            |
| --------------------- | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 文本推理（LLM）       | `api.registerProvider(...)`                       | [Provider 插件](/plugins/sdk-provider-plugins)                                      |
| CLI 推理后端          | `api.registerCliBackend(...)`                     | [CLI Backends](/gateway/cli-backends)                                               |
| Channel / 消息        | `api.registerChannel(...)`                        | [Channel 插件](/plugins/sdk-channel-plugins)                                        |
| 语音（TTS/STT）       | `api.registerSpeechProvider(...)`                 | [Provider 插件](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)        |
| 媒体理解              | `api.registerMediaUnderstandingProvider(...)`     | [Provider 插件](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)        |
| 图像生成              | `api.registerImageGenerationProvider(...)`        | [Provider 插件](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)        |
| 网络搜索              | `api.registerWebSearchProvider(...)`              | [Provider 插件](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)        |
| Agent 工具            | `api.registerTool(...)`                           | 下文                                                                                |
| 自定义命令            | `api.registerCommand(...)`                        | [Entry Points](/plugins/sdk-entrypoints)                                            |
| 事件 Hook             | `api.registerHook(...)`                           | [Entry Points](/plugins/sdk-entrypoints)                                            |
| HTTP 路由             | `api.registerHttpRoute(...)`                      | [内部机制](/plugins/architecture#gateway-http-routes)                               |
| CLI 子命令            | `api.registerCli(...)`                            | [Entry Points](/plugins/sdk-entrypoints)                                            |

完整的注册 API 请参阅 [SDK Overview](/plugins/sdk-overview#registration-api)。

需要注意的 Hook 守卫语义：

- `before_tool_call`：`{ block: true }` 是终止性的，会阻止低优先级处理程序执行。
- `before_tool_call`：`{ block: false }` 被视为无决策。
- `before_tool_call`：`{ requireApproval: true }` 暂停 Agent 执行，通过 exec 审批覆盖层、Telegram 按钮、Discord 交互或任意 Channel 上的 `/approve` 命令提示用户审批。
- `before_install`：`{ block: true }` 是终止性的，会阻止低优先级处理程序执行。
- `before_install`：`{ block: false }` 被视为无决策。
- `message_sending`：`{ cancel: true }` 是终止性的，会阻止低优先级处理程序执行。
- `message_sending`：`{ cancel: false }` 被视为无决策。

`/approve` 命令同时处理 exec 和插件审批，并支持自动回退。插件审批转发可通过配置中的 `approvals.plugin` 独立配置。

详细语义请参阅 [SDK Overview Hook 决策语义](/plugins/sdk-overview#hook-decision-semantics)。

## 注册 Agent 工具

工具是 LLM 可以调用的有类型的函数。它们可以是必选的（始终可用）或可选的（用户手动启用）：

```typescript
register(api) {
  // 必选工具——始终可用
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({ input: Type.String() }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });

  // 可选工具——用户必须将其添加到允许列表
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

用户在配置中启用可选工具：

```json5
{
  tools: { allow: ["workflow_tool"] },
}
```

- 工具名不能与核心工具冲突（冲突项会被跳过）
- 对有副作用或有额外二进制依赖的工具使用 `optional: true`
- 用户可通过将插件 id 添加到 `tools.allow` 来启用该插件的所有工具

## 导入约定

始终从具体的 `openclaw/plugin-sdk/<subpath>` 路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";

// 错误：单体根路径（已弃用，将被移除）
import { ... } from "openclaw/plugin-sdk";
```

完整的子路径参考请参阅 [SDK Overview](/plugins/sdk-overview)。

在插件内部，使用本地桶文件（`api.ts`、`runtime-api.ts`）进行内部导入——永远不要通过 SDK 路径导入自己的插件。

## 提交前检查清单

<Check>**package.json** 包含正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** Manifest 已存在且有效</Check>
<Check>入口点使用了 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入都使用具体的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而非 SDK 自我导入</Check>
<Check>测试通过（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通过（仓库内插件）</Check>

## Beta 版本测试

1. 关注 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 的 GitHub Release 标签，通过 `Watch` > `Releases` 订阅。Beta 标签格式为 `v2026.3.N-beta.1`。你也可以关注官方 OpenClaw X 账号 [@openclaw](https://x.com/openclaw) 获取发布通知。
2. Beta 标签出现后立即测试你的插件。稳定版发布前的窗口期通常只有几个小时。
3. 在 Discord 的 `plugin-forum` 频道中你的插件帖子里发布测试结果，写 `all good` 或描述出现了什么问题。如果还没有帖子，请新建一个。
4. 如果出现问题，创建或更新一个标题为 `Beta blocker: <plugin-name> - <summary>` 的 Issue，并添加 `beta-blocker` 标签。将 Issue 链接贴到你的帖子中。
5. 创建一个标题为 `fix(<plugin-id>): beta blocker - <summary>` 的 PR 到 `main`，并在 PR 和 Discord 帖子中关联 Issue。贡献者无法给 PR 打标签，因此标题是维护者和自动化流程的识别信号。有 PR 的 blocker 会被合并；没有 PR 的 blocker 可能会照常发布。维护者在 Beta 测试期间会关注这些帖子。
6. 沉默即代表绿灯。如果错过了窗口期，你的修复可能会进入下一个周期。

## 下一步

<CardGroup cols={2}>
  <Card title="Channel 插件" icon="messages-square" href="/plugins/sdk-channel-plugins">
    构建消息 Channel 插件
  </Card>
  <Card title="Provider 插件" icon="cpu" href="/plugins/sdk-provider-plugins">
    构建模型 Provider 插件
  </Card>
  <Card title="SDK Overview" icon="book-open" href="/plugins/sdk-overview">
    导入映射和注册 API 参考
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、搜索、子 Agent
  </Card>
  <Card title="测试" icon="test-tubes" href="/plugins/sdk-testing">
    测试工具和模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/plugins/manifest">
    完整 Manifest Schema 参考
  </Card>
</CardGroup>
