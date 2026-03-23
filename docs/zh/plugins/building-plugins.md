---
mmh3_hash: "159c81ae0105aa72a20ee2ba634a4564"
title: "构建 Plugin"
sidebarTitle: "入门指南"
summary: "几分钟内创建您的第一个 OpenClaw Plugin"
read_when:
  - 您想创建新的 OpenClaw Plugin
  - 您需要 Plugin 开发的快速入门指南
  - 您正在向 OpenClaw 添加新的 Channel、Provider、Tool 或其他能力
---

# 构建 Plugin

Plugin 通过以下能力扩展 OpenClaw：Channel、模型 Provider、语音、图像生成、Web 搜索、Agent Tool 或任意组合。

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
        "extensions": ["./index.ts"]
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

    每个 Plugin 都需要一个清单，即使没有配置也是如此。完整模式请参见 [清单](/plugins/manifest)。

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

    **外部 Plugin：** 发布到 [ClawHub](/tools/clawhub) 或 npm，然后安装：

    ```bash
    openclaw plugins install @myorg/openclaw-my-plugin
    ```

    OpenClaw 首先检查 ClawHub，然后回退到 npm。

    **仓库内 Plugin：** 放在 `extensions/` 下 — 自动发现。

    ```bash
    pnpm test -- extensions/my-plugin/
    ```

  </Step>
</Steps>

## Plugin 能力

单个 Plugin 可以通过 `api` 对象注册任意数量的能力：

| 能力                | 注册方法                                          | 详细指南                                                                          |
| ------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------- |
| 文本推理 (LLM)      | `api.registerProvider(...)`                       | [Provider Plugin](/plugins/sdk-provider-plugins)                                  |
| Channel / 消息      | `api.registerChannel(...)`                        | [Channel Plugin](/plugins/sdk-channel-plugins)                                    |
| 语音 (TTS/STT)      | `api.registerSpeechProvider(...)`                 | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 媒体理解            | `api.registerMediaUnderstandingProvider(...)`     | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| 图像生成            | `api.registerImageGenerationProvider(...)`        | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Web 搜索            | `api.registerWebSearchProvider(...)`              | [Provider Plugin](/plugins/sdk-provider-plugins#step-5-add-extra-capabilities)    |
| Agent Tool          | `api.registerTool(...)`                           | 下方                                                                              |
| 自定义命令          | `api.registerCommand(def)`                        | [入口点](/plugins/sdk-entrypoints)                                                |
| 事件 Hook           | `api.registerHook(...)`                           | [入口点](/plugins/sdk-entrypoints)                                                |
| HTTP 路由           | `api.registerHttpRoute(...)`                      | [内部架构](/plugins/architecture#gateway-http-routes)                             |
| CLI 子命令          | `api.registerCli(...)`                            | [入口点](/plugins/sdk-entrypoints)                                                |

完整注册 API 请参见 [SDK 概览](/plugins/sdk-overview#registration-api)。

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

## 提交前检查清单

<Check>**package.json** 包含正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** 清单存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入使用专注的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而不是 SDK 自导入</Check>
<Check>测试通过（`pnpm test -- extensions/my-plugin/`）</Check>
<Check>仓库内 Plugin 通过 `pnpm check`</Check>

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
