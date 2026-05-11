---
mmh3_hash: "b207c407622c9653f3c6a260143542c3"
summary: "面向外部应用、脚本、仪表板、CI 任务和 IDE 扩展的公开 OpenClaw App SDK"
title: "OpenClaw App SDK"
sidebarTitle: "App SDK"
read_when:
  - 您正在构建与 OpenClaw 通信的外部应用、脚本、仪表板、CI 任务或 IDE 扩展
  - 您在 App SDK 和 Plugin SDK 之间做选择
  - 您正在集成 Gateway Agent 运行、Session、事件、审批、模型或工具
---

**OpenClaw App SDK** 是供 OpenClaw 进程外部应用使用的公开客户端 API。当脚本、仪表板、CI 任务、IDE 扩展或其他外部应用需要连接 Gateway、启动 Agent 运行、流式传输事件、等待结果、取消工作或检查 Gateway 资源时，请使用 `@openclaw/sdk`。

<Note>
  App SDK 与 [Plugin SDK](/plugins/sdk-overview) 不同。
  `@openclaw/sdk` 从 OpenClaw 外部与 Gateway 通信。
  `openclaw/plugin-sdk/*` 仅供在 OpenClaw 内部运行并注册 Provider、Channel、工具、Hook 或受信任运行时的 Plugin 使用。
</Note>

## 当前可用功能

`@openclaw/sdk` 包含：

| 接口                      | 状态    | 功能说明                                                                          |
| ------------------------- | ------- | --------------------------------------------------------------------------------- |
| `OpenClaw`                | 可用    | 主客户端入口。负责传输、连接、请求和事件。                                        |
| `GatewayClientTransport`  | 可用    | 由 Gateway 客户端支持的 WebSocket 传输。                                          |
| `oc.agents`               | 可用    | 列出、创建、更新、删除和获取 Agent 句柄。                                         |
| `Agent.run()`             | 可用    | 启动一个 Gateway `agent` 运行并返回 `Run`。                                       |
| `oc.runs`                 | 可用    | 创建、获取、等待、取消和流式传输运行。                                            |
| `Run.events()`            | 可用    | 流式传输每个运行的规范化事件，支持快速运行的重播。                                |
| `Run.wait()`              | 可用    | 调用 `agent.wait` 并返回稳定的 `RunResult`。                                      |
| `Run.cancel()`            | 可用    | 按运行 ID 调用 `sessions.abort`，有 Session 键时附带。                            |
| `oc.sessions`             | 可用    | 创建、解析、发送、修补、压缩和获取 Session 句柄。                                 |
| `Session.send()`          | 可用    | 调用 `sessions.send` 并返回 `Run`。                                               |
| `oc.tasks`                | 可用    | 列出、读取和取消 Gateway 任务账本条目。                                           |
| `oc.models`               | 可用    | 调用 `models.list` 和当前的 `models.authStatus` 状态 RPC。                        |
| `oc.tools`                | 可用    | 通过策略流水线列出、限定范围和调用 Gateway 工具。                                 |
| `oc.artifacts`            | 可用    | 列出、获取和下载 Gateway 转录产物。                                               |
| `oc.approvals`            | 可用    | 通过 Gateway 审批 RPC 列出和解决执行审批。                                        |
| `oc.environments`         | 部分    | 列出 Gateway 本地和 Node 环境候选；创建/删除尚未接入。                            |
| `oc.rawEvents()`          | 可用    | 为高级消费者暴露原始 Gateway 事件。                                               |
| `normalizeGatewayEvent()` | 可用    | 将原始 Gateway 事件转换为稳定的 SDK 事件形状。                                    |

SDK 还导出这些接口使用的核心类型：
`AgentRunParams`、`RunResult`、`RunStatus`、`OpenClawEvent`、
`OpenClawEventType`、`GatewayEvent`、`OpenClawTransport`、
`GatewayRequestOptions`、`SessionCreateParams`、`SessionSendParams`、
`ArtifactSummary`、`ArtifactQuery`、`ArtifactsListResult`、
`ArtifactsGetResult`、`ArtifactsDownloadResult`、
`TaskSummary`、`TaskStatus`、`TasksListParams`、`TasksListResult`、
`TasksGetResult`、`TasksCancelResult`、`RuntimeSelection`、
`EnvironmentSelection`、`WorkspaceSelection`、`ApprovalMode` 以及相关结果类型。

## 连接 Gateway

使用显式 Gateway URL 创建客户端，或为测试和嵌入式应用运行时注入自定义传输。

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })` 等同于 `url`。构造函数接受 `gateway: "auto"` 选项，但自动 Gateway 发现尚不是独立的 SDK 功能；当应用不知道如何发现 Gateway 时，请传入 `url`。

对于测试，传入实现 `OpenClawTransport` 的对象：

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## 运行 Agent

当应用需要 Agent 句柄时，使用 `oc.agents.get(id)`，然后调用 `agent.run()`。

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

`openai/gpt-5.5` 这样带 Provider 前缀的模型引用会被拆分为 Gateway 的 `provider` 和 `model` 覆盖项。`timeoutMs` 在 SDK 中保持毫秒单位，并在传给 `agent` RPC 时转换为 Gateway 超时秒数。

`run.wait()` 使用 Gateway 的 `agent.wait` RPC。等待截止时间在运行仍活跃时到期，返回 `status: "accepted"` 而不是假装运行本身超时了。运行时超时、中止的运行和取消的运行会规范化为 `timed_out` 或 `cancelled`。

## 创建和复用 Session

当应用需要持久的对话记录状态时，使用 Session。

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()` 调用 `sessions.send` 并返回 `Run`。Session 句柄还支持：

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## 流式传输事件

SDK 将原始 Gateway 事件规范化为稳定的 `OpenClawEvent` 信封：

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: GatewayEvent;
};
```

常见事件类型包括：

| 事件类型               | 对应 Gateway 事件                        |
| ---------------------- | ---------------------------------------- |
| `run.started`          | `agent` 生命周期开始                     |
| `run.completed`        | `agent` 生命周期结束                     |
| `run.failed`           | `agent` 生命周期错误                     |
| `run.cancelled`        | 中止/取消的生命周期结束                  |
| `run.timed_out`        | 超时的生命周期结束                       |
| `assistant.delta`      | 助手流式增量                             |
| `assistant.message`    | 助手消息                                 |
| `thinking.delta`       | 思考或计划流                             |
| `tool.call.started`    | 工具/条目/命令开始                       |
| `tool.call.delta`      | 工具/条目/命令更新                       |
| `tool.call.completed`  | 工具/条目/命令完成                       |
| `tool.call.failed`     | 工具/条目/命令失败或阻止状态             |
| `approval.requested`   | 执行或 Plugin 审批请求                   |
| `approval.resolved`    | 执行或 Plugin 审批解决                   |
| `session.created`      | `sessions.changed` 创建                  |
| `session.updated`      | `sessions.changed` 更新                  |
| `session.compacted`    | `sessions.changed` 压缩                  |
| `task.updated`         | 任务更新事件                             |
| `artifact.updated`     | 补丁流事件                               |
| `raw`                  | 任何尚无稳定 SDK 映射的事件              |

`Run.events()` 将事件过滤到一个运行 ID，并为快速运行重播已见事件。这意味着下面的文档化流程是安全的：

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

对于应用范围的流，使用 `oc.events()`。对于原始 Gateway 帧，使用 `oc.rawEvents()`。

## 模型、工具、产物和审批

模型辅助方法映射到当前 Gateway 方法：

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // 调用 models.authStatus
```

工具辅助方法暴露 Gateway 目录、有效工具视图和直接 Gateway 工具调用。`oc.tools.invoke()` 返回类型化信封，而不是在策略或审批拒绝时抛出异常。

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

产物辅助方法暴露 Session、运行或任务上下文的 Gateway 产物投影。每次调用需要一个明确的 `sessionKey`、`runId` 或 `taskId` 范围：

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

审批辅助方法使用执行审批 RPC：

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

任务辅助方法使用同样支撑 `openclaw tasks` 的持久任务账本：

```typescript
const tasks = await oc.tasks.list({ status: "running", sessionKey: "agent:main:main" });
const task = await oc.tasks.get(tasks.tasks[0].id);
await oc.tasks.cancel(task.task.id, { reason: "user stopped task" });
```

环境辅助方法暴露只读的 Gateway 本地和 Node 发现：

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## 当前明确不支持的功能

SDK 包含我们期望的产品模型名称，但不会静默地假装 Gateway RPC 存在。以下调用当前会抛出明确的不支持错误：

```typescript
await oc.environments.create({});
await oc.environments.delete("environment-id");
```

每个运行的 `workspace`、`runtime`、`environment` 和 `approvals` 字段作为未来形状进行类型化，但当前 Gateway 不支持在 `agent` RPC 上使用这些覆盖项。若调用方传入这些参数，SDK 在提交运行前会抛出异常，以避免工作在默认工作区、运行时、环境或审批行为下意外执行。

## App SDK vs Plugin SDK

当代码位于 OpenClaw 外部时使用 App SDK：

- 启动或观察 Agent 运行的 Node 脚本
- 调用 Gateway 的 CI 任务
- 仪表板和管理面板
- IDE 扩展
- 不需要成为 Channel Plugin 的外部桥接
- 使用假 Gateway 或真实 Gateway 传输的集成测试

当代码在 OpenClaw 内部运行时使用 Plugin SDK：

- Provider Plugin
- Channel Plugin
- 工具或生命周期 Hook
- Agent 运行时 Plugin
- 受信任的运行时辅助程序

App SDK 代码应从 `@openclaw/sdk` 导入。Plugin 代码应从文档化的 `openclaw/plugin-sdk/*` 子路径导入。不要混用这两个契约。

## 相关

- [OpenClaw App SDK API 设计](/reference/openclaw-sdk-api-design)
- [Gateway RPC 参考](/reference/rpc)
- [Agent Loop](/concepts/agent-loop)
- [Agent 运行时](/concepts/agent-runtimes)
- [Session](/concepts/session)
- [后台任务](/automation/tasks)
- [ACP Agent](/tools/acp-agents)
- [Plugin SDK 概述](/plugins/sdk-overview)
