---
mmh3_hash: "cb7c95af78b047992dee045e7b2a3605"
summary: "Tool Search：将大型 PI 工具目录压缩为搜索、描述和调用接口"
title: "Tool Search"
read_when:
  - 希望 PI Agent 在不将每个工具 schema 加入提示词的情况下使用大型工具目录
  - 希望通过一个紧凑的 PI 接口暴露 OpenClaw 工具、MCP 工具和客户端工具
  - 正在为 PI 运行实现或调试工具发现功能
---

Tool Search 是 OpenClaw PI Agent 的一项实验性功能。它为 PI Agent 提供了一种紧凑的方式来发现和调用大型工具目录。当运行中有许多可用工具但模型可能只需要其中少数几个时，此功能非常有用。

本页记录的是 OpenClaw PI Tool Search，而非 Codex 原生工具搜索或动态工具接口。Codex 原生代码模式、工具搜索、延迟动态工具和嵌套工具调用是稳定的 Codex harness 接口，不依赖于 `tools.toolSearch`。

为 PI 启用后，模型默认会收到一个 `tool_search_code` 工具。该工具在一个隔离的 Node 子进程中运行一小段 JavaScript，并提供 `openclaw.tools` 桥接：

```js
const hits = await openclaw.tools.search("create a GitHub issue");
const tool = await openclaw.tools.describe(hits[0].id);
return await openclaw.tools.call(tool.id, {
  title: "Crash on startup",
  body: "Steps to reproduce...",
});
```

目录可以包含 OpenClaw 工具、Plugin 工具、MCP 工具和客户端提供的工具。模型不会预先看到每个完整的 schema。相反，它搜索紧凑的描述符，在需要确切 schema 时描述所选工具，然后通过 OpenClaw 调用该工具。

Codex harness 运行不会收到这些实验性的 OpenClaw Tool Search 控制。OpenClaw 以动态工具形式将产品能力传递给 Codex，而 Codex 拥有稳定的原生代码模式、原生工具搜索、延迟动态工具和嵌套工具调用。

## 轮次运行流程

在规划阶段，PI 嵌入式运行器为当前运行构建有效目录：

1. 解析 Agent、Profile、Sandbox 和 Session 的活跃工具策略。
2. 列出符合条件的 OpenClaw 和 Plugin 工具。
3. 通过 Session MCP 运行时列出符合条件的 MCP 工具。
4. 添加当前运行提供的符合条件的客户端工具。
5. 为搜索建立紧凑描述符索引。
6. 向模型暴露 PI 代码桥接或结构化回退工具。

在执行阶段，每个真实工具调用都会返回到 OpenClaw。隔离的 Node 运行时不持有 Plugin 实现、MCP 客户端对象或密钥。`openclaw.tools.call(...)` 跨越桥接回到 Gateway，在那里正常的策略、审批、Hook、日志记录和结果处理仍然适用。

## 模式

`tools.toolSearch` 有两种面向模型的模式：

- `code`：暴露 `tool_search_code`，即默认的紧凑 JavaScript 桥接。
- `tools`：将 `tool_search`、`tool_describe` 和 `tool_call` 暴露为普通结构化工具，适用于不应接收代码的 Provider。

两种模式使用相同的目录和执行路径。唯一的区别是模型看到的形式。如果当前运行时无法启动隔离的 Node 代码模式子进程，默认的 `code` 模式会在目录压缩之前回退到 `tools` 模式。

两种模式均为实验性。对于小型 PI 工具目录，优先使用直接工具暴露；对于 Codex harness 运行，优先使用 Codex 原生稳定接口。

没有单独的来源选择配置。启用 Tool Search 后，目录在经过正常策略过滤后包含符合条件的 OpenClaw、MCP 和客户端工具。

## 存在的原因

大型目录有用但开销昂贵。将每个工具 schema 发送给模型会使请求变大、减慢规划速度，并增加意外工具选择的可能性。

Tool Search 改变了这一形态：

- 直接工具：模型在生成第一个 token 前就看到每个选定的 schema
- Tool Search 代码模式：模型看到一个紧凑的代码工具和一个简短的 API 契约
- Tool Search 工具模式：模型看到三个紧凑的结构化回退工具
- 在轮次过程中：模型只加载它实际需要的工具 schema

对于小型目录，直接工具暴露仍然是正确的默认选择。Tool Search 最适合一次运行可以看到许多工具的情况，尤其是来自 MCP 服务器或客户端提供的应用工具。

## API

`openclaw.tools.search(query, options?)`

搜索当前运行的有效目录。结果紧凑，可安全放回提示词上下文。

```js
const hits = await openclaw.tools.search("calendar event", { limit: 5 });
```

`openclaw.tools.describe(id)`

加载一个搜索结果的完整元数据，包括确切的输入 schema。

```js
const calendarCreate = await openclaw.tools.describe("mcp:calendar:create_event");
```

`openclaw.tools.call(id, args)`

通过 OpenClaw 调用选定的工具。

```js
await openclaw.tools.call(calendarCreate.id, {
  summary: "Planning",
  start: "2026-05-09T14:00:00Z",
});
```

结构化回退模式将相同操作暴露为工具：

- `tool_search`
- `tool_describe`
- `tool_call`

## 运行时边界

代码桥接在一个短期 Node 子进程中运行。该子进程启动时启用了 Node 权限模式，环境为空，没有文件系统或网络权限，也没有子进程或 worker 权限。OpenClaw 会强制执行父进程挂钟超时，并在超时时（包括异步续体之后）终止子进程。

运行时仅暴露：

- `console.log`、`console.warn` 和 `console.error`
- `openclaw.tools.search`
- `openclaw.tools.describe`
- `openclaw.tools.call`

最终调用仍然适用正常的 OpenClaw 行为：

- 工具允许和拒绝策略
- 每个 Agent 和每个 Sandbox 的工具限制
- 仅限所有者的门控
- 审批 Hook
- Plugin `before_tool_call` Hook
- Session 身份、日志和遥测

## 配置

使用默认代码桥接为 PI 运行启用 Tool Search：

```bash
openclaw config set tools.toolSearch true
```

等效 JSON：

```json5
{
  tools: {
    toolSearch: true,
  },
}
```

为 PI 运行使用结构化回退工具：

```json5
{
  tools: {
    toolSearch: {
      mode: "tools",
    },
  },
}
```

调整代码模式超时和搜索结果限制：

```json5
{
  tools: {
    toolSearch: {
      mode: "code",
      codeTimeoutMs: 10000,
      searchDefaultLimit: 8,
      maxSearchLimit: 20,
    },
  },
}
```

禁用：

```json5
{
  tools: {
    toolSearch: false,
  },
}
```

## 提示词与遥测

Tool Search 记录足够的遥测数据以便与直接工具暴露进行比较：

- 发送给 harness 的工具和提示词序列化字节总数
- 目录大小和来源细分
- 搜索、描述和调用次数
- 通过 OpenClaw 执行的最终工具调用
- 所选工具的 id 和来源

Session 日志应能回答：

- 模型预先看到了多少工具 schema
- 它执行了多少次搜索和描述操作
- 最终调用了哪个工具
- 结果来自 OpenClaw、MCP 还是客户端工具

## 端到端验证

Gateway 端到端测试器通过 PI harness 验证两条路径：

```bash
node --import tsx scripts/tool-search-gateway-e2e.ts
```

它会创建一个带有大型工具目录的临时假 Plugin，启动模拟 OpenAI Provider，在直接模式和启用 Tool Search 的模式下各启动一次 Gateway，然后比较 Provider 请求载荷和 Session 日志。

回归测试验证：

1. 直接模式可以调用假 Plugin 工具。
2. Tool Search 可以调用同一个假 Plugin 工具。
3. 直接模式将假 Plugin 工具 schema 直接暴露给 Provider。
4. Tool Search 仅暴露紧凑桥接。
5. 对于大型假目录，Tool Search 请求载荷更小。
6. Session 日志显示预期的工具调用次数和桥接调用遥测。

## 失败行为

Tool Search 应该采用失败关闭策略：

- 如果某个工具不在有效策略中，搜索不应返回它
- 如果所选工具变得不可用，`tool_call` 应该失败
- 如果策略或审批阻止执行，调用结果应报告该阻止而非绕过它
- 如果代码桥接无法创建隔离运行时，请使用 `mode: "tools"` 或为该部署禁用 Tool Search

## 相关

- [工具和 Plugin](/tools)
- [多 Agent Sandbox 与工具](/tools/multi-agent-sandbox-tools)
- [Exec 工具](/tools/exec)
- [ACP Agent 设置](/tools/acp-agents-setup)
- [构建 Plugin](/plugins/building-plugins)
