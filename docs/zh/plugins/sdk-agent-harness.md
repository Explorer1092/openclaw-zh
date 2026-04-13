---
mmh3_hash: "0fb54f097b04c2819b6437912c1670f2"
title: "Agent Harness Plugins"
sidebarTitle: "Agent Harness"
summary: "用于替换低级嵌入式 Agent 执行器的 Plugin 的实验性 SDK 接口"
read_when:
  - 您正在更改嵌入式 Agent 运行时或测试框架注册表
  - 您正在从捆绑或受信任 Plugin 注册 Agent 测试框架
  - 您需要了解 Codex Plugin 与 Model Provider 的关系
---

# Agent Harness Plugins

**Agent 测试框架**是一个准备好的 OpenClaw Agent 轮次的低级执行器。它不是 Model Provider，不是 Channel，也不是工具注册表。

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

1. `OPENCLAW_AGENT_RUNTIME=<id>` 强制使用具有该 ID 的已注册测试框架。
2. `OPENCLAW_AGENT_RUNTIME=pi` 强制使用内置 PI 测试框架。
3. `OPENCLAW_AGENT_RUNTIME=auto` 询问已注册的测试框架是否支持解析的 Provider/模型。
4. 如果没有已注册的测试框架匹配，OpenClaw 使用 PI，除非 PI 回退被禁用。

强制 Plugin 测试框架失败会作为运行失败呈现。在 `auto` 模式下，当所选 Plugin 测试框架在轮次产生副作用之前失败时，OpenClaw 可能会回退到 PI。将 `OPENCLAW_AGENT_HARNESS_FALLBACK=none` 或 `embeddedHarness.fallback: "none"` 设置为使该回退成为硬失败而不是自动回退。

捆绑的 Codex Plugin 将 `codex` 注册为其测试框架 ID。核心将其视为普通 Plugin 测试框架 ID；Codex 特定别名属于 Plugin 或操作员配置，而不属于共享运行时选择器。

## Provider 加测试框架配对

大多数测试框架也应该注册 Provider。Provider 使模型引用、认证状态、模型元数据和 `/model` 选择对 OpenClaw 的其余部分可见。测试框架然后在 `supports(...)` 中声明该 Provider。

捆绑的 Codex Plugin 遵循此模式：

- Provider ID：`codex`
- 用户模型引用：`codex/gpt-5.4`、`codex/gpt-5.2` 或 Codex 应用服务器返回的另一个模型
- 测试框架 ID：`codex`
- 认证：合成 Provider 可用性，因为 Codex 测试框架拥有原生 Codex 登录/Session
- 应用服务器请求：OpenClaw 将裸模型 ID 发送给 Codex，让测试框架与原生应用服务器协议通信

Codex Plugin 是附加的。普通的 `openai/gpt-*` 引用仍然是 OpenAI Provider 引用，并继续使用正常的 OpenClaw Provider 路径。当您想要 Codex 管理的认证、Codex 模型发现、原生线程和 Codex 应用服务器执行时，选择 `codex/gpt-*`。`/model` 可以在 Codex 应用服务器返回的 Codex 模型之间切换，而无需 OpenAI Provider 凭据。

有关操作员设置、模型前缀示例和仅 Codex 配置，请参见 [Codex Harness](/plugins/codex-harness)。

OpenClaw 需要 Codex 应用服务器 `0.118.0` 或更新版本。Codex Plugin 检查应用服务器初始化握手，并阻止旧版或未版本化的服务器，因此 OpenClaw 只针对已测试的协议接口运行。

### 原生 Codex 测试框架模式

捆绑的 `codex` 测试框架是嵌入式 OpenClaw Agent 轮次的原生 Codex 模式。首先启用捆绑的 `codex` Plugin，如果您的配置使用限制性允许列表，则在 `plugins.allow` 中包含 `codex`。它与 `openai-codex/*` 不同：

- `openai-codex/*` 通过正常的 OpenClaw Provider 路径使用 ChatGPT/Codex OAuth。
- `codex/*` 使用捆绑的 Codex Provider 并通过 Codex 应用服务器路由轮次。

当此模式运行时，Codex 拥有原生线程 ID、恢复行为、压缩和应用服务器执行。OpenClaw 仍然拥有聊天 Channel、可见转录镜像、工具策略、审批、媒体投递和 Session 选择。当您需要证明正在使用 Codex 应用服务器路径且 PI 回退不隐藏损坏的原生测试框架时，使用 `embeddedHarness.runtime: "codex"` 与 `embeddedHarness.fallback: "none"`。

## 禁用 PI 回退

默认情况下，OpenClaw 将 `agents.defaults.embeddedHarness` 设置为 `{ runtime: "auto", fallback: "pi" }` 来运行嵌入式 Agent。在 `auto` 模式下，已注册的 Plugin 测试框架可以声明 Provider/模型对。如果没有匹配，或者如果自动选择的 Plugin 测试框架在产生输出之前失败，OpenClaw 回退到 PI。

当您需要证明 Plugin 测试框架是唯一被测试的运行时时，设置 `fallback: "none"`。这禁用自动 PI 回退；它不阻止显式的 `runtime: "pi"` 或 `OPENCLAW_AGENT_RUNTIME=pi`。

对于仅 Codex 嵌入式运行：

```json
{
  "agents": {
    "defaults": {
      "model": "codex/gpt-5.4",
      "embeddedHarness": {
        "runtime": "codex",
        "fallback": "none"
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
      "embeddedHarness": {
        "runtime": "auto",
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
      "embeddedHarness": {
        "runtime": "auto",
        "fallback": "pi"
      }
    },
    "list": [
      {
        "id": "codex-only",
        "model": "codex/gpt-5.4",
        "embeddedHarness": {
          "runtime": "codex",
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

测试框架可以保持原生 Session ID、线程 ID 或守护进程侧恢复令牌。将该绑定明确地与 OpenClaw Session 关联，并继续将用户可见的助手/工具输出镜像到 OpenClaw 转录中。

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
