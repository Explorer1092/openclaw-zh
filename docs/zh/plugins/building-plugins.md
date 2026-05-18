---
mmh3_hash: "b7c154ce67c7925816bce15f907427e9"
title: "构建 Plugin"
sidebarTitle: "入门指南"
summary: "几分钟内创建您的第一个 OpenClaw Plugin"
doc-schema-version: 1
read_when:
  - 您想创建新的 OpenClaw Plugin
  - 您需要 Plugin 开发的快速入门
  - 您正在 Channel、Provider、CLI 后端、工具或 Hook 文档之间做选择
---

Plugin 无需修改核心即可扩展 OpenClaw。Plugin 可以添加消息 Channel、模型 Provider、本地 CLI 后端、Agent 工具、Hook、媒体 Provider 或其他 Plugin 拥有的能力。

您无需将外部 Plugin 添加到 OpenClaw 仓库。将包发布到 [ClawHub](/clawhub)，用户使用以下命令安装：

```bash
openclaw plugins install clawhub:<package-name>
```

裸包规格在发布切换期间仍从 npm 安装。当您希望使用 ClawHub 解析时，请使用 `clawhub:` 前缀。

## 要求

- 使用 Node 22.19 或更新版本以及 `npm` 或 `pnpm` 等包管理器。
- 熟悉 TypeScript ESM 模块。
- 对于仓库内的 Bundle Plugin 工作，克隆仓库并运行 `pnpm install`。源代码检出 Plugin 开发仅限于 pnpm，因为 OpenClaw 从 `extensions/*` 工作区包加载 Bundle Plugin。

## 选择 Plugin 形态

<CardGroup cols={2}>
  <Card title="Channel Plugin" icon="messages-square" href="/plugins/sdk-channel-plugins">
    将 OpenClaw 连接到消息平台。
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/plugins/sdk-provider-plugins">
    添加模型、媒体、搜索、获取、语音或实时 Provider。
  </Card>
  <Card title="CLI 后端 Plugin" icon="terminal" href="/plugins/cli-backend-plugins">
    通过 OpenClaw 模型回退运行本地 AI CLI。
  </Card>
  <Card title="工具 Plugin" icon="wrench" href="/plugins/tool-plugins">
    注册 Agent 工具。
  </Card>
</CardGroup>

## 快速入门

通过注册一个必需的 Agent 工具来构建最小的工具 Plugin。这是最短的有用 Plugin 形态，展示了包、Manifest、入口点和本地验证。

<Steps>
  <Step title="创建包元数据">
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
  "description": "向 OpenClaw 添加自定义工具",
  "contracts": {
    "tools": ["my_tool"]
  },
  "activation": {
    "onStartup": true
  },
  "configSchema": {
    "type": "object",
    "additionalProperties": false
  }
}
```

    </CodeGroup>

    已发布的外部 Plugin 应将运行时入口指向已构建的 JavaScript 文件。请参见 [SDK 入口点](/plugins/sdk-entrypoints) 了解完整的入口点契约。

    每个 Plugin 都需要 Manifest，即使没有配置。运行时工具必须出现在 `contracts.tools` 中，以便 OpenClaw 在不急切加载每个 Plugin 运行时的情况下发现所有权。请有意地设置 `activation.onStartup`。此示例在 Gateway 启动时启动。

    有关每个 Manifest 字段，请参见 [Plugin Manifest](/plugins/manifest)。

  </Step>

  <Step title="注册工具">
    ```typescript index.ts
    import { Type } from "typebox";
    import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

    export default definePluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "向 OpenClaw 添加自定义工具",
      register(api) {
        api.registerTool({
          name: "my_tool",
          description: "回显一个输入值",
          parameters: Type.Object({ input: Type.String() }),
          async execute(_id, params) {
            return {
              content: [{ type: "text", text: `Got: ${params.input}` }],
            };
          },
        });
      },
    });
    ```

    对于非 Channel Plugin，使用 `definePluginEntry`。Channel Plugin 使用 `defineChannelPluginEntry`。

  </Step>

  <Step title="测试运行时">
    对于已安装或外部的 Plugin，检查已加载的运行时：

    ```bash
    openclaw plugins inspect my-plugin --runtime --json
    ```

    如果 Plugin 注册了 CLI 命令，也运行该命令。例如，演示命令应该有一个执行证明，如 `openclaw demo-plugin ping`。

    对于此仓库中的 Bundle Plugin，OpenClaw 从 `extensions/*` 工作区发现源代码检出 Plugin 包。运行最接近的目标测试：

    ```bash
    pnpm test -- extensions/my-plugin/
    pnpm check
    ```

  </Step>

  <Step title="发布">
    在发布之前验证包：

    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    ```

    规范的 ClawHub 代码片段位于 `docs/snippets/plugin-publish/`。

  </Step>

  <Step title="安装">
    通过 ClawHub 安装已发布的包：

    ```bash
    openclaw plugins install clawhub:your-org/your-plugin
    ```

  </Step>
</Steps>

<a id="registering-agent-tools"></a>

## 注册工具

工具可以是必需的或可选的。必需工具在 Plugin 启用时始终可用。可选工具需要用户选择加入。

```typescript
register(api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "运行工作流",
      parameters: Type.Object({ pipeline: Type.String() }),
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

使用 `api.registerTool(...)` 注册的每个工具也必须在 Plugin Manifest 中声明：

```json
{
  "contracts": {
    "tools": ["workflow_tool"]
  },
  "toolMetadata": {
    "workflow_tool": {
      "optional": true
    }
  }
}
```

用户使用 `tools.allow` 选择加入：

```json5
{
  tools: { allow: ["workflow_tool"] }, // 或 ["my-plugin"] 表示来自一个 Plugin 的所有工具
}
```

对于副作用、不常见的二进制文件或默认情况下不应暴露的能力，请使用可选工具。工具名称不得与核心工具冲突；冲突会被跳过并在 Plugin 诊断中报告。格式错误的注册（包括没有 `parameters` 的工具描述符）会以相同方式被跳过并报告。已注册的工具是模型在策略和允许列表检查通过后可以调用的类型化函数。

工具工厂接收运行时提供的上下文对象。当工具需要记录、显示或适应当前轮次的活动模型时，请使用 `ctx.activeModel`。该对象可以包含 `provider`、`modelId` 和 `modelRef`。将其视为信息性的运行时元数据，而不是针对本地操作员、已安装 Plugin 代码或修改过的 OpenClaw 运行时的安全边界。敏感的本地工具仍应需要显式的 Plugin 或操作员选择加入，并在活动模型元数据缺失或不适合时快速失败。

Manifest 声明所有权和发现；执行仍然调用实时注册的工具实现。保持 `toolMetadata.<tool>.optional: true` 与 `api.registerTool(..., { optional: true })` 对齐，以便 OpenClaw 可以避免加载该 Plugin 运行时，直到工具被明确加入允许列表。

## 导入约定

从聚焦的 SDK 子路径导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
```

不要从已弃用的根 Barrel 导入：

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk";
```

在您的 Plugin 包中，使用本地 Barrel 文件（如 `api.ts` 和 `runtime-api.ts`）进行内部导入。不要通过 SDK 路径导入您自己的 Plugin。Provider 特定的助手应保留在 Provider 包中，除非接缝真正是通用的。

自定义 Gateway RPC 方法是高级入口点。将它们保留在 Plugin 特定的前缀上；核心管理员命名空间，如 `config.*`、`exec.approvals.*`、`operator.admin.*`、`wizard.*` 和 `update.*` 保持保留状态并解析为 `operator.admin`。`openclaw/plugin-sdk/gateway-method-runtime` 桥接专用于声明 `contracts.gatewayMethodDispatch: ["authenticated-request"]` 的 Plugin HTTP 路由。

有关完整的导入映射，请参见 [Plugin SDK 概览](/plugins/sdk-overview)。

## 提交前检查清单

<Check>**package.json** 具有正确的 `openclaw` 元数据</Check>
<Check>**openclaw.plugin.json** Manifest 存在且有效</Check>
<Check>入口点使用 `defineChannelPluginEntry` 或 `definePluginEntry`</Check>
<Check>所有导入使用聚焦的 `plugin-sdk/<subpath>` 路径</Check>
<Check>内部导入使用本地模块，而不是 SDK 自导入</Check>
<Check>测试通过（`pnpm test -- <bundled-plugin-root>/my-plugin/`）</Check>
<Check>`pnpm check` 通过（仓库内 Plugin）</Check>

## 对 Beta 版本进行测试

1. 在 [openclaw/openclaw](https://github.com/openclaw/openclaw/releases) 上关注 GitHub 发布标签，并通过 `Watch` > `Releases` 订阅。Beta 标签看起来像 `v2026.3.N-beta.1`。您也可以打开官方 OpenClaw X 账号 [@openclaw](https://x.com/openclaw) 的通知以获取发布公告。
2. 标签出现后立即针对 Beta 标签测试您的 Plugin。稳定版发布前的窗口通常只有几个小时。
3. 使用 `all good` 或出现的问题在 `plugin-forum` Discord Channel 中您的 Plugin 线程中发布测试结果。如果您还没有线程，请创建一个。
4. 如果出现问题，打开或更新标题为 `Beta blocker: <plugin-name> - <summary>` 的 Issue 并应用 `beta-blocker` 标签。将 Issue 链接放入您的线程。
5. 向 `main` 打开标题为 `fix(<plugin-id>): beta blocker - <summary>` 的 PR，并在 PR 和您的 Discord 线程中链接该 Issue。贡献者无法为 PR 添加标签，因此标题是维护者和自动化的 PR 端信号。有 PR 的 Blocker 会被合并；没有 PR 的 Blocker 可能仍然会发布。维护者在 Beta 测试期间关注这些线程。
6. 沉默意味着正常。如果您错过了窗口，您的修复可能会在下一个周期中发布。

## 下一步

<CardGroup cols={2}>
  <Card title="Channel Plugin" icon="messages-square" href="/plugins/sdk-channel-plugins">
    构建消息 Channel Plugin
  </Card>
  <Card title="Provider Plugin" icon="cpu" href="/plugins/sdk-provider-plugins">
    构建模型 Provider Plugin
  </Card>
  <Card title="CLI 后端 Plugin" icon="terminal" href="/plugins/cli-backend-plugins">
    注册本地 AI CLI 后端
  </Card>
  <Card title="SDK 概览" icon="book-open" href="/plugins/sdk-overview">
    导入映射和注册 API 参考
  </Card>
  <Card title="运行时助手" icon="settings" href="/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、搜索、子 Agent
  </Card>
  <Card title="测试" icon="test-tubes" href="/plugins/sdk-testing">
    测试工具和模式
  </Card>
  <Card title="Plugin Manifest" icon="file-json" href="/plugins/manifest">
    完整 Manifest Schema 参考
  </Card>
</CardGroup>

## 相关

- [Plugin Hook](/plugins/hooks)
- [Plugin 架构](/plugins/architecture)
