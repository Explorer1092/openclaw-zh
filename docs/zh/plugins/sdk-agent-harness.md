---
mmh3_hash: "23669e90f4be51a49a96e2a4c8c2c545"
title: "Agent Harness Plugins"
sidebarTitle: "Agent Harness"
summary: "用于替换低级嵌入式 Agent 执行器的 Plugin 的实验性 SDK 接口"
read_when:
  - 您正在更改嵌入式 Agent 运行时或测试框架注册表
  - 您正在从捆绑或受信任 Plugin 注册 Agent 测试框架
  - 您需要了解 Codex Plugin 与 Model Provider 的关系
---

# Agent Harness Plugins

**Agent 测试框架**是一个准备好的 OpenClaw Agent 轮次的低级执行器。它不是 Model Provider，不是 Channel，也不是工具注册表。有关面向用户的概念模型，请参见 [Agent 运行时](/concepts/agent-runtimes)。

仅将此接口用于捆绑或受信任的原生 Plugin。由于参数类型有意镜像当前嵌入式运行器，合同仍处于实验阶段。

## 何时使用测试框架

当模型系列有其自己的原生 Session 运行时，且正常 OpenClaw Provider 传输是错误抽象时，注册 Agent 测试框架。

示例：

- 拥有线程和压缩的原生编码 Agent 服务器
- 必须流式传输原生计划/推理/工具事件的本地 CLI 或守护进程
- 除了 OpenClaw Session 转录外，还需要自己的恢复 ID 的模型运行时

**不要**只为添加新的 LLM API 而注册测试框架。对于普通 HTTP 或 WebSocket 模型 API，请构建 [Provider Plugin](/plugins/sdk-provider-plugins)。

## 核心仍然拥有的内容

在选择测试框架之前，OpenClaw 已经解析了：

- Provider 和模型
- 运行时认证状态
- 思考级别和上下文预算
- OpenClaw 转录/Session 文件
- 工作区、沙盒和工具策略
- Channel 回复回调和流式传输回调
- 模型回退和实时模型切换策略

这种分离是有意为之的。测试框架运行准备好的尝试；它不选择 Provider，不替换 Channel 投递，也不静默切换模型。

准备好的尝试还包括 `params.runtimePlan`，一个 OpenClaw 拥有的策略包，用于必须在 PI 和原生测试框架之间共享的运行时决策：

- `runtimePlan.tools.normalize(...)` 和 `runtimePlan.tools.logDiagnostics(...)` 用于 Provider 感知的工具模式策略
- `runtimePlan.transcript.resolvePolicy(...)` 用于转录清理和工具调用修复策略
- `runtimePlan.delivery.isSilentPayload(...)` 用于共享的 `NO_REPLY` 和媒体投递抑制
- `runtimePlan.outcome.classifyRunResult(...)` 用于模型回退分类
- `runtimePlan.observability` 用于解析的 Provider/模型/测试框架元数据

测试框架可以使用该计划来做出需要匹配 PI 行为的决策，但仍应将其视为主机拥有的尝试状态。不要变更它或使用它在轮次内切换 Provider/模型。

## 注册测试框架

**导入：** `openclaw/plugin-sdk/agent-harness`

```typescript
import type { AgentHarness } from "openclaw/plugin-sdk/agent-harness";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

const myHarness: AgentHarness = {
  id: "my-harness",
  label: "My native agent harness",

  supports(ctx) {
    return ctx.provider === "my-provider"
      ? { supported: true, priority: 100 }
      : { supported: false };
  },

  async runAttempt(params) {
    // 启动或恢复您的原生线程。
    // 使用 params.prompt、params.tools、params.images、params.onPartialReply、
    // params.onAgentEvent 和其他准备好的尝试字段。
    return await runMyNativeTurn(params);
  },
};

export default definePluginEntry({
  id: "my-native-agent",
  name: "My Native Agent",
  description: "Runs selected models through a native agent daemon.",
  register(api) {
    api.registerAgentHarness(myHarness);
  },
});
```

## 选择策略

OpenClaw 在 Provider/模型解析后选择测试框架：

1. 现有 Session 记录的测试框架 id 获胜，因此配置/环境变更不会将该转录热切换到另一个运行时。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 对未已锁定的 Session 强制使用具有该 id 的已注册测试框架。
3. `OPENCLAW_AGENT_RUNTIME=pi` 强制使用内置 PI 测试框架。
4. `OPENCLAW_AGENT_RUNTIME=auto` 询问已注册的测试框架是否支持解析的 Provider/模型。
5. 如果没有已注册的测试框架匹配，OpenClaw 使用 PI，除非 PI 回退被禁用。

Plugin 测试框架失败作为运行失败呈现。在 `auto` 模式下，PI 回退仅在没有已注册的 Plugin 测试框架支持解析的 Provider/模型时使用。一旦 Plugin 测试框架声明了运行，OpenClaw 不会通过 PI 重放相同的轮次，因为这可能会改变认证/运行时语义或重复副作用。

所选的测试框架 id 在嵌入式运行后与 Session id 一起持久化。在测试框架锁定之前创建的旧版 Session 一旦有转录历史记录，就被视为 PI 锁定的。在 PI 和原生 Plugin 测试框架之间切换时，使用新建/重置的 Session。`/status` 在 `Fast` 旁边显示非默认测试框架 id（如 `codex`）；PI 保持隐藏，因为它是默认的兼容性路径。如果选择的测试框架令人意外，请启用 `agents/harness` 调试日志记录并检查 Gateway 的结构化 `agent harness selected` 记录。它包括选定的测试框架 id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个 Plugin 候选的支持结果。

捆绑的 Codex Plugin 将 `codex` 注册为其测试框架 id。核心将其视为普通 Plugin 测试框架 id；Codex 特定别名属于 Plugin 或操作员配置，而不属于共享运行时选择器。

## Provider 加测试框架配对

大多数测试框架也应该注册 Provider。Provider 使模型引用、认证状态、模型元数据和 `/model` 选择对 OpenClaw 的其余部分可见。测试框架然后在 `supports(...)` 中声明该 Provider。

捆绑的 Codex Plugin 遵循此模式：

- 首选用户模型引用：`openai/gpt-5.5` 加上 `agentRuntime.id: "codex"`
- 兼容性引用：旧版 `codex/gpt-*` 引用仍然被接受，但新配置不应将其用作正常的 Provider/模型引用
- 测试框架 id：`codex`
- 认证：合成 Provider 可用性，因为 Codex 测试框架拥有原生 Codex 登录/Session
- 应用服务器请求：OpenClaw 将裸模型 id 发送给 Codex，让测试框架与原生应用服务器协议通信

Codex Plugin 是附加的。普通的 `openai/gpt-*` 引用继续使用正常的 OpenClaw Provider 路径，除非您用 `agentRuntime.id: "codex"` 强制使用 Codex 测试框架。旧版 `codex/gpt-*` 引用仍然为兼容性选择 Codex Provider 和测试框架。

有关操作员设置、模型前缀示例和仅 Codex 配置，请参见 [Codex Harness](/plugins/codex-harness)。

OpenClaw 需要 Codex 应用服务器 `0.125.0` 或更新版本。Codex Plugin 检查应用服务器初始化握手，并阻止旧版或未版本化的服务器，因此 OpenClaw 只针对已测试的协议接口运行。`0.125.0` 底线包括 Codex `0.124.0` 中落地的原生 MCP Hook 有效载荷支持，同时将 OpenClaw 锁定到较新的已测试稳定线。

### 工具结果中间件

打包 Plugin 可以通过 `api.registerAgentToolResultMiddleware(...)` 附加运行时中立的工具结果中间件，前提是其清单在 `contracts.agentToolResultMiddleware` 中声明了目标运行时 id。此受信任接缝用于必须在 PI 或 Codex 将工具输出反馈给模型之前运行的异步工具结果转换。

旧版打包 Plugin 仍然可以使用 `api.registerCodexAppServerExtensionFactory(...)` 用于仅 Codex 应用服务器的中间件，但新的结果转换应使用运行时中立的 API。仅 PI 的 `api.registerEmbeddedExtensionFactory(...)` Hook 已被移除；PI 工具结果转换必须使用运行时中立的中间件。

### 终端结果分类

拥有自己协议投影的原生测试框架可以在完成的轮次没有产生可见的助手文本时，从 `openclaw/plugin-sdk/agent-harness-runtime` 使用 `classifyAgentHarnessTerminalOutcome(...)`。该辅助工具返回 `empty`、`reasoning-only` 或 `planning-only`，以便 OpenClaw 的回退策略可以决定是否在不同模型上重试。它有意将提示错误、进行中的轮次和有意的静默回复（如 `NO_REPLY`）留为未分类。

### 原生 Codex 测试框架模式

捆绑的 `codex` 测试框架是嵌入式 OpenClaw Agent 轮次的原生 Codex 模式。首先启用捆绑的 `codex` Plugin，如果您的配置使用限制性允许列表，则在 `plugins.allow` 中包含 `codex`。原生应用服务器配置应使用 `openai/gpt-*` 加上 `agentRuntime.id: "codex"`。改用 `openai-codex/*` 通过 PI 进行 Codex OAuth。旧版 `codex/*` 模型引用仍然是原生测试框架的兼容性别名。

当此模式运行时，Codex 拥有原生线程 id、恢复行为、压缩和应用服务器执行。OpenClaw 仍然拥有聊天 Channel、可见转录镜像、工具策略、审批、媒体投递和 Session 选择。当您需要证明只有 Codex 应用服务器路径可以声明运行时，使用 `agentRuntime.id: "codex"` 而不带 `fallback` 覆盖。显式 Plugin 运行时默认已失败关闭。仅当您有意希望 PI 处理缺失的测试框架选择时，才设置 `fallback: "pi"`。Codex 应用服务器失败已经直接失败，而不是通过 PI 重试。

## 禁用 PI 回退

默认情况下，OpenClaw 将 `agents.defaults.agentRuntime` 设置为 `{ id: "auto", fallback: "pi" }` 来运行嵌入式 Agent。在 `auto` 模式下，已注册的 Plugin 测试框架可以声明 Provider/模型对。如果没有匹配，OpenClaw 回退到 PI。

在 `auto` 模式下，当您需要缺失的 Plugin 测试框架选择失败而不是使用 PI 时，设置 `fallback: "none"`。显式 Plugin 运行时（如 `runtime: "codex"`）默认已失败关闭，除非在同一配置或环境覆盖范围内设置了 `fallback: "pi"`。选定的 Plugin 测试框架失败总是硬失败。这不会阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅 Codex 嵌入式运行：

```json
{
  "agents": {
    "defaults": {
      "model": "openai/gpt-5.5",
      "agentRuntime": {
        "id": "codex"
      }
    }
  }
}
```

如果您希望任何已注册的 Plugin 测试框架声明匹配的模型，但永远不希望 OpenClaw 静默回退到 PI，保持 `runtime: "auto"` 并禁用回退：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "none"
      }
    }
  }
}
```

每个 Agent 覆盖使用相同的形状：

```json
{
  "agents": {
    "defaults": {
      "agentRuntime": {
        "id": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "openai/gpt-5.5",
        "agentRuntime": {
          "id": "codex",
          "fallback": "none"
        }
      }
    ]
  }
}
```

`OPENCLAW_AGENT_RUNTIME` 仍然覆盖配置的运行时。使用 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 从环境禁用 PI 回退。

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，当请求的测试框架未注册、不支持解析的 Provider/模型或在产生轮次副作用之前失败时，Session 会提前失败。这是仅 Codex 部署和必须证明 Codex 应用服务器路径实际在使用的实时测试的有意设计。

此设置只控制嵌入式 Agent 测试框架。它不禁用图像、视频、音乐、TTS、PDF 或其他 Provider 特定的模型路由。

## 原生 Session 和转录镜像

测试框架可以保持原生 Session id、线程 id 或守护进程侧恢复令牌。将该绑定明确地与 OpenClaw Session 关联，并继续将用户可见的助手/工具输出镜像到 OpenClaw 转录中。

OpenClaw 转录仍然是以下方面的兼容层：

- Channel 可见的 Session 历史
- 转录搜索和索引
- 在后续轮次切换回内置 PI 测试框架
- 通用的 `/new`、`/reset` 和 Session 删除行为

如果您的测试框架存储伴随绑定，请实现 `reset(...)`，以便 OpenClaw 在拥有的 OpenClaw Session 被重置时可以清除它。

## 工具和媒体结果

核心构建 OpenClaw 工具列表并将其传递到准备好的尝试中。当测试框架执行动态工具调用时，通过测试框架结果形状返回工具结果，而不是自己发送 Channel 媒体。

这使文本、图像、视频、音乐、TTS、审批和消息工具输出与 PI 支持的运行保持相同的投递路径。

## 当前限制

- 公共导入路径是通用的，但一些尝试/结果类型别名仍然携带 `Pi` 名称以保持兼容性。
- 第三方测试框架安装是实验性的。在您需要原生 Session 运行时之前，优先使用 Provider Plugin。
- 测试框架切换在轮次间受支持。在原生工具、审批、助手文本或消息发送已开始后，不要在轮次中间切换测试框架。

## 相关

- [SDK 概述](/plugins/sdk-overview)
- [运行时帮助器](/plugins/sdk-runtime)
- [Provider Plugin](/plugins/sdk-provider-plugins)
- [Codex Harness](/plugins/codex-harness)
- [Model Providers](/concepts/model-providers)
