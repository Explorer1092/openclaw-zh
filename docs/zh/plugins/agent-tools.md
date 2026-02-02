---
mmh3_hash: "12d010b2b8dba11b8b247bb24f779f81"
summary: "在 Plugin 中编写 Agent Tool(schema、可选 Tool、allowlist)"
read_when:
  - 您想在 Plugin 中添加新的 Agent Tool
  - 您需要通过 allowlist 使 Tool 选择加入
title: "Plugin Agent Tool"
---

# Plugin Agent Tool

OpenClaw Plugin 可以注册 **Agent Tool**(JSON-schema 函数),这些 Tool 在 Agent 运行期间暴露给 LLM。Tool 可以是**必需的**(始终可用)或**可选的**(选择加入)。

Agent Tool 在主配置的 `tools` 下配置,或在 `agents.list[].tools` 下按 Agent 配置。allowlist/denylist 策略控制 Agent 可以调用哪些 Tool。

## 基本 Tool

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

## 可选 Tool(选择加入)

可选 Tool **从不**自动启用。用户必须将它们添加到 Agent allowlist。

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

在 `agents.list[].tools.allow`(或全局 `tools.allow`)中启用可选 Tool:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        tools: {
          allow: [
            "workflow_tool", // 特定 Tool 名称
            "workflow", // Plugin id(启用该 Plugin 的所有 Tool)
            "group:plugins", // 所有 Plugin Tool
          ],
        },
      },
    ],
  },
}
```

影响 Tool 可用性的其他配置选项:

- 仅命名 Plugin Tool 的 allowlist 被视为 Plugin 选择加入;核心 Tool 仍然启用,除非您还在 allowlist 中包括核心 Tool 或组。
- `tools.profile` / `agents.list[].tools.profile`(基础 allowlist)
- `tools.byProvider` / `agents.list[].tools.byProvider`(provider 特定的 allow/deny)
- `tools.sandbox.tools.*`(沙箱时的沙箱 Tool 策略)

## 规则 + 提示

- Tool 名称**不得**与核心 Tool 名称冲突;冲突的 Tool 将被跳过。
- allowlist 中使用的 Plugin id 不得与核心 Tool 名称冲突。
- 对于触发副作用或需要额外二进制文件/凭证的 Tool,首选 `optional: true`。
