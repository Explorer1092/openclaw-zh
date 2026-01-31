---
title: "插件代理工具"
mmh3_hash: "9f181a3992afeffe4249195e738d6112"
summary: "在插件中编写代理工具(架构、可选工具、允许列表)"
read_when:
  - 您想在插件中添加新的代理工具
  - 您需要通过允许列表使工具选择加入
---
# 插件代理工具

OpenClaw 插件可以注册**代理工具**(JSON-schema 函数),这些工具在代理运行期间暴露给 LLM。工具可以是**必需的**(始终可用)或**可选的**(选择加入)。

代理工具在主配置的 `tools` 下配置,或在 `agents.list[].tools` 下按代理配置。允许列表/拒绝列表策略控制代理可以调用哪些工具。

## 基本工具

```ts
import { Type } from "@sinclair/typebox";

export default function (api) {
  api.registerTool({
    name: "my_tool",
    description: "Do a thing",
    parameters: Type.Object({
      input: Type.String(),
    }),
    async execute(_id, params) {
      return { content: [{ type: "text", text: params.input }] };
    },
  });
}
```

## 可选工具(选择加入)

可选工具**从不**自动启用。用户必须将它们添加到代理允许列表。

```ts
export default function (api) {
  api.registerTool(
    {
      name: "workflow_tool",
      description: "Run a local workflow",
      parameters: {
        type: "object",
        properties: {
          pipeline: { type: "string" },
        },
        required: ["pipeline"],
      },
      async execute(_id, params) {
        return { content: [{ type: "text", text: params.pipeline }] };
      },
    },
    { optional: true },
  );
}
```

在 `agents.list[].tools.allow`(或全局 `tools.allow`)中启用可选工具:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: [
            "workflow_tool",  // 特定工具名称
            "workflow",       // 插件 id(启用该插件的所有工具)
            "group:plugins"   // 所有插件工具
          ]
        }
      }
    ]
  }
}
```

影响工具可用性的其他配置旋钮:
- 仅命名插件工具的允许列表被视为插件选择加入;核心工具仍然启用,除非您还在允许列表中包括核心工具或组。
- `tools.profile` / `agents.list[].tools.profile`(基础允许列表)
- `tools.byProvider` / `agents.list[].tools.byProvider`(提供程序特定的允许/拒绝)
- `tools.sandbox.tools.*`(沙箱时的沙箱工具策略)

## 规则 + 提示

- 工具名称**不得**与核心工具名称冲突;冲突的工具将被跳过。
- 允许列表中使用的插件 id 不得与核心工具名称冲突。
- 对于触发副作用或需要额外二进制文件/凭证的工具,首选 `optional: true`。
