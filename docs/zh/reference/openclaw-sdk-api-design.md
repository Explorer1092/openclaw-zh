---
mmh3_hash: "6ae6777432df580be012e0a95389543b"
summary: "OpenClaw App SDK 公共 API 的参考设计，包括事件分类、产物、审批和包结构"
title: "OpenClaw App SDK API 设计"
sidebarTitle: "App SDK API 设计"
read_when:
  - 您正在实现提议的 OpenClaw 公共 App SDK
  - 您需要 App SDK 的草案命名空间、事件、结果、产物、审批或安全契约
  - 您正在比较 Gateway 协议资源与高级 OpenClaw App SDK 包装器
---

本页是公共 [OpenClaw App SDK](/concepts/openclaw-sdk) 的详细 API 参考设计，有意与 [Plugin SDK](/plugins/sdk-overview) 分开。

<Note>
  `@openclaw/sdk` 是用于与 Gateway 通信的外部 App/客户端包。`openclaw/plugin-sdk/*` 是进程内 Plugin 编写契约。请勿从只需运行 Agent 的 App 中导入 Plugin SDK 子路径。
</Note>

公共 App SDK 应分两层构建：

1. 低级生成的 Gateway 客户端。
2. 包含 `OpenClaw`、`Agent`、`Session`、`Run`、`Task`、`Artifact`、`Approval` 和 `Environment` 对象的高级易用包装器。

## 命名空间设计

低级命名空间应紧密遵循 Gateway 资源：

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list({ status: "running" });
oc.tasks.get(taskId);
oc.tasks.cancel(taskId, { reason });
oc.tasks.events(taskId, { after }); // 未来 API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // 未来 API：当前 SDK 抛出 unsupported
oc.environments.status(environmentId);
oc.environments.delete(environmentId); // 未来 API：当前 SDK 抛出 unsupported
```

高级包装器应返回让常见流程更简洁的对象：

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // 规范化事件流
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## 事件契约

公共 SDK 应公开版本化、可重放、规范化的事件。

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
  raw?: unknown;
};
```

`id` 是重放游标。消费者应能够使用 `events({ after: id })` 重新连接，并在保留期允许的情况下接收错过的事件。

推荐的规范化事件族：

| 事件 | 含义 |
| ---- | ---- |
| `run.created` | Run 已接受。 |
| `run.queued` | Run 正在等待 Session 通道、运行时或环境。 |
| `run.started` | 运行时开始执行。 |
| `run.completed` | Run 成功完成。 |
| `run.failed` | Run 以错误结束。 |
| `run.cancelled` | Run 被取消。 |
| `run.timed_out` | Run 超过其超时限制。 |
| `assistant.delta` | 助手文本 delta。 |
| `assistant.message` | 完整的助手消息或替换。 |
| `thinking.delta` | 推理或计划 delta（当策略允许公开时）。 |
| `tool.call.started` | Tool 调用开始。 |
| `tool.call.delta` | Tool 调用流式进度或部分输出。 |
| `tool.call.completed` | Tool 调用成功返回。 |
| `tool.call.failed` | Tool 调用失败。 |
| `approval.requested` | Run 或 Tool 需要审批。 |
| `approval.resolved` | 审批已批准、拒绝、过期或取消。 |
| `question.requested` | 运行时向用户或宿主 App 请求输入。 |
| `question.answered` | 宿主 App 提供了答案。 |
| `artifact.created` | 新产物可用。 |
| `artifact.updated` | 现有产物已更改。 |
| `session.created` | Session 已创建。 |
| `session.updated` | Session 元数据已更改。 |
| `session.compacted` | Session 压缩已发生。 |
| `task.updated` | 后台任务状态已更改。 |
| `git.branch` | 运行时观察或更改了分支状态。 |
| `git.diff` | 运行时生成或更改了 diff。 |
| `git.pr` | 运行时打开、更新或链接了 Pull Request。 |

运行时原生 payload 应通过 `raw` 获取，但 App 不应为正常 UI 解析 `raw`。

## 结果契约

`Run.wait()` 应返回稳定的结果信封：

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

结果应简洁稳定。时间戳值保留 Gateway 形状，因此当前生命周期支撑的 Run 通常报告 epoch 毫秒数，而适配器可能仍然返回 ISO 字符串。丰富的 UI、Tool 跟踪和运行时原生详情属于事件和产物。

`accepted` 是非终止的等待结果：表示 Gateway 等待截止时间在 Run 产生生命周期结束/错误之前到期。它不得被视为 `timed_out`；`timed_out` 保留给超过其自身运行时超时的 Run。

## 审批和问题

审批必须是一等公民，因为编程 Agent 经常跨越安全边界。

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

审批事件应携带：

- 审批 ID
- Run ID 和 Session ID
- 请求类型
- 请求的操作摘要
- Tool 名称或环境操作
- 风险级别
- 可用决策
- 过期时间
- 决策是否可以复用

问题与审批不同。问题向用户或宿主 App 询问信息，审批请求执行操作的权限。

## ToolSpace 模型

App 需要了解 Tool 接口而无需导入 Plugin 内部实现。

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK 应公开：

- 规范化的 Tool 元数据
- 来源：OpenClaw、MCP、Plugin、Channel、运行时或 App
- Schema 摘要
- 审批策略
- 运行时兼容性
- Tool 是否隐藏、只读、具有写能力或具有宿主能力

通过 SDK 调用 Tool 应是显式且有作用域的。大多数 App 应运行 Agent，而不是直接调用任意 Tool。

## 产物模型

产物应涵盖的不只是文件。

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

常见示例：

- 文件编辑和生成的文件
- 补丁包
- VCS diff
- 截图和媒体输出
- 日志和跟踪包
- Pull Request 链接
- 运行时轨迹
- 托管环境工作区快照

产物访问应支持编辑、保留和下载 URL，而不假设每个产物都是普通的本地文件。

## 安全模型

App SDK 必须明确授权范围。

推荐的 Token 权限：

| 权限 | 允许的操作 |
| ---- | ---------- |
| `agent.read` | 列出并检查 Agent。 |
| `agent.run` | 启动 Run。 |
| `session.read` | 读取 Session 元数据和消息。 |
| `session.write` | 创建、发送、分叉、压缩和中止 Session。 |
| `task.read` | 读取后台任务状态。 |
| `task.write` | 取消或修改任务通知策略。 |
| `approval.respond` | 批准或拒绝请求。 |
| `tools.invoke` | 直接调用公开的 Tool。 |
| `artifacts.read` | 列出并下载产物。 |
| `environment.write` | 创建或销毁托管环境。 |
| `admin` | 管理操作。 |

默认值：

- 默认不转发密钥
- 不允许无限制的环境变量透传
- 使用密钥引用而非密钥值
- 明确的沙箱和网络策略
- 明确的远程环境保留
- 宿主执行需要审批，除非策略另有证明
- 原始运行时事件在离开 Gateway 前进行编辑，除非调用者具有更强的诊断权限

## 托管环境 Provider

托管 Agent 应作为环境 Provider 实现。

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

第一个实现不必是托管的 SaaS 服务。它可以针对现有节点主机、临时工作区、CI 风格运行器或 Testbox 风格环境。重要的契约是：

1. 准备工作区
2. 绑定安全环境和密钥
3. 启动 Run
4. 流式传输事件
5. 收集产物
6. 按策略清理或保留

一旦稳定，托管云服务可以实现相同的 Provider 契约。

## 包结构

推荐的包：

| 包 | 用途 |
| -- | ---- |
| `@openclaw/sdk` | 公共高级 SDK 和生成的低级 Gateway 客户端。 |
| `@openclaw/sdk-react` | 用于仪表板和 App 构建器的可选 React Hooks。 |
| `@openclaw/sdk-testing` | 用于 App 集成的测试辅助程序和伪 Gateway 服务器。 |

该仓库已有用于 Plugin 的 `openclaw/plugin-sdk/*`。保持该命名空间独立，避免混淆 Plugin 作者和 App 开发者。

## 生成客户端策略

低级客户端应从版本化的 Gateway 协议 Schema 生成，然后由手写的易用类包装。

分层：

1. Gateway Schema 作为事实来源。
2. 生成的低级 TypeScript 客户端。
3. 外部输入和事件 payload 的运行时验证器。
4. 高级 `OpenClaw`、`Agent`、`Session`、`Run`、`Task` 和 `Artifact` 包装器。
5. 示例代码和集成测试。

优势：

- 协议漂移可见
- 测试可以将生成的方法与 Gateway 导出进行比较
- App SDK 独立于 Plugin SDK 内部实现
- 低级消费者仍有完整的协议访问权限
- 高级消费者获得精简的产品 API

## 相关

- [OpenClaw App SDK](/concepts/openclaw-sdk)
- [Gateway RPC 参考](/reference/rpc)
- [Agent 循环](/concepts/agent-loop)
- [Agent 运行时](/concepts/agent-runtimes)
- [后台任务](/automation/tasks)
- [ACP Agent](/tools/acp-agents)
- [Plugin SDK 概述](/plugins/sdk-overview)
