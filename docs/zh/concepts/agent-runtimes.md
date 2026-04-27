---
mmh3_hash: "0a2935579ea2bd7882d3d38fc3fa1a34"
summary: "OpenClaw 如何区分 model Provider、model、Channel 和 Agent runtime"
title: "Agent runtimes"
read_when:
  - 你需要在 PI、Codex、ACP 或其他原生 Agent runtime 之间做出选择
  - 你对 status 或配置中的 provider/model/runtime 标签感到困惑
  - 你正在记录原生 harness 的支持对等性
---

**Agent runtime** 是拥有一个已准备好的 model loop 的组件：它接收 prompt、驱动 model 输出、处理原生工具调用，并将完成的轮次返回给 OpenClaw。

Runtime 容易与 Provider 混淆，因为两者都出现在 model 配置附近。它们是不同的层级：

| 层级           | 示例                                  | 含义                                                                |
| -------------- | ------------------------------------- | ------------------------------------------------------------------- |
| Provider       | `openai`, `anthropic`, `openai-codex` | OpenClaw 如何进行认证、发现 model 并命名 model 引用。               |
| Model          | `gpt-5.5`, `claude-opus-4-6`          | 为 Agent 轮次选择的 model。                                         |
| Agent runtime  | `pi`, `codex`, `claude-cli`           | 执行已准备轮次的底层 loop 或后端。                                  |
| Channel        | Telegram, Discord, Slack, WhatsApp    | 消息进出 OpenClaw 的地方。                                          |

代码中也会看到 **harness** 这个词。harness 是提供 Agent runtime 的实现。例如，捆绑的 Codex harness 实现了 `codex` runtime。公开配置使用 `agentRuntime.id`；`openclaw doctor --fix` 会将较旧的 runtime-policy 键重写为该形式。

Runtime 分为两个系列：

- **嵌入式 harness** 在 OpenClaw 准备好的 Agent loop 内部运行。目前包括内置的 `pi` runtime，以及注册的 Plugin harness（如 `codex`）。
- **CLI 后端** 在保持 model 引用规范的同时运行本地 CLI 进程。例如，`anthropic/claude-opus-4-7` 配合 `agentRuntime.id: "claude-cli"` 表示"选择 Anthropic model，通过 Claude CLI 执行"。`claude-cli` 不是嵌入式 harness id，不得传递给 AgentHarness 选择。

## 三个名为 Codex 的东西

大多数混淆来自三个不同的表面共享 Codex 名称：

| 表面                                                  | OpenClaw 名称/配置                   | 功能                                                                                               |
| ----------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Codex OAuth Provider 路由                             | `openai-codex/*` model 引用          | 通过正常的 OpenClaw PI 运行器使用 ChatGPT/Codex 订阅 OAuth。                                       |
| 原生 Codex app-server runtime                         | `agentRuntime.id: "codex"`           | 通过捆绑的 Codex app-server harness 运行嵌入式 Agent 轮次。                                        |
| Codex ACP 适配器                                      | `runtime: "acp"`, `agentId: "codex"` | 通过外部 ACP/acpx 控制平面运行 Codex。仅在明确请求 ACP/acpx 时使用。                              |
| 原生 Codex 聊天控制命令集                             | `/codex ...`                         | 从聊天中绑定、恢复、引导、停止和检查 Codex app-server 线程。                                       |
| 用于 GPT/Codex 风格 model 的 OpenAI Platform API 路由 | `openai/*` model 引用                | 使用 OpenAI API-key 认证，除非 runtime 覆盖（如 `runtime: "codex"`）运行该轮次。                   |

这些表面是有意独立的。启用 `codex` Plugin 使原生 app-server 功能可用；它不会将 `openai-codex/*` 重写为 `openai/*`，不会更改现有 Session，也不会使 ACP 成为 Codex 默认值。选择 `openai-codex/*` 表示"使用 Codex OAuth Provider 路由"，除非你单独强制 runtime。

常见的 Codex 设置使用 `openai` Provider 配合 `codex` runtime：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

这意味着 OpenClaw 选择 OpenAI model 引用，然后请求 Codex app-server runtime 运行嵌入式 Agent 轮次。这不意味着 Channel、model Provider 目录或 OpenClaw Session 存储变成 Codex。

当捆绑的 `codex` Plugin 启用时，自然语言 Codex 控制应使用原生 `/codex` 命令表面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`）而非 ACP。仅当用户明确要求 ACP/acpx 或测试 ACP 适配器路径时，才对 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 和类似的外部 harness 仍然使用 ACP。

这是面向 Agent 的决策树：

1. 如果用户要求 **Codex 绑定/控制/线程/恢复/引导/停止**，在捆绑的 `codex` Plugin 启用时使用原生 `/codex` 命令表面。
2. 如果用户要求 **Codex 作为嵌入式 runtime**，使用 `openai/<model>` 配合 `agentRuntime.id: "codex"`。
3. 如果用户要求 **在正常 OpenClaw 运行器上使用 Codex OAuth/订阅认证**，使用 `openai-codex/<model>` 并将 runtime 保留为 PI。
4. 如果用户明确说 **ACP**、**acpx** 或 **Codex ACP 适配器**，使用 ACP 配合 `runtime: "acp"` 和 `agentId: "codex"`。
5. 如果请求是针对 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 harness**，使用 ACP/acpx，而非原生子 Agent runtime。

| 你的意图...                          | 使用...                                        |
| ------------------------------------ | ---------------------------------------------- |
| Codex app-server 聊天/线程控制       | 来自捆绑 `codex` Plugin 的 `/codex ...`        |
| Codex app-server 嵌入式 Agent runtime | `agentRuntime.id: "codex"`                    |
| PI 运行器上的 OpenAI Codex OAuth     | `openai-codex/*` model 引用                    |
| Claude Code 或其他外部 harness       | ACP/acpx                                       |

关于 OpenAI 系列前缀拆分，请参见 [OpenAI](/providers/openai) 和 [Model providers](/concepts/model-providers)。关于 Codex runtime 支持契约，请参见 [Codex harness](/plugins/codex-harness#v1-support-contract)。

## Runtime 所有权

不同的 runtime 拥有不同数量的 loop。

| 表面                      | OpenClaw PI 嵌入式                          | Codex app-server                                                            |
| ------------------------- | ------------------------------------------- | --------------------------------------------------------------------------- |
| Model loop 所有者         | OpenClaw 通过 PI 嵌入式运行器               | Codex app-server                                                            |
| 规范线程状态              | OpenClaw 转录                               | Codex 线程，加上 OpenClaw 转录镜像                                          |
| OpenClaw 动态工具         | 原生 OpenClaw 工具 loop                     | 通过 Codex 适配器桥接                                                       |
| 原生 Shell 和文件工具     | PI/OpenClaw 路径                            | Codex 原生工具，在支持的情况下通过原生 hook 桥接                            |
| 上下文引擎                | 原生 OpenClaw 上下文组装                    | OpenClaw 项目将上下文组装到 Codex 轮次中                                    |
| 压缩                      | OpenClaw 或选定的上下文引擎                 | Codex 原生压缩，配合 OpenClaw 通知和镜像维护                                |
| Channel 投递              | OpenClaw                                    | OpenClaw                                                                    |

这种所有权划分是主要的设计规则：

- 如果 OpenClaw 拥有该表面，OpenClaw 可以提供正常的 Plugin hook 行为。
- 如果原生 runtime 拥有该表面，OpenClaw 需要 runtime 事件或原生 hook。
- 如果原生 runtime 拥有规范线程状态，OpenClaw 应该镜像和投影上下文，而不是重写不支持的内部。

## Runtime 选择

OpenClaw 在 Provider 和 model 解析后选择嵌入式 runtime：

1. Session 记录的 runtime 优先。配置更改不会将现有转录热切换到不同的原生线程系统。
2. `OPENCLAW_AGENT_RUNTIME=<id>` 为新 Session 或重置 Session 强制该 runtime。
3. `agents.defaults.agentRuntime.id` 或 `agents.list[].agentRuntime.id` 可以设置 `auto`、`pi`、注册的嵌入式 harness id（如 `codex`），或支持的 CLI 后端别名（如 `claude-cli`）。
4. 在 `auto` 模式下，注册的 Plugin runtime 可以声明支持的 provider/model 对。
5. 如果在 `auto` 模式下没有 runtime 声明某轮次，且设置了 `fallback: "pi"`（默认值），OpenClaw 使用 PI 作为兼容性回退。设置 `fallback: "none"` 可使不匹配的 `auto` 模式选择失败。

显式 Plugin runtime 默认失败关闭。例如，`runtime: "codex"` 表示 Codex 或明确的选择错误，除非你在同一覆盖范围内设置 `fallback: "pi"`。runtime 覆盖不继承更广泛的 fallback 设置，因此 Agent 级别的 `runtime: "codex"` 不会仅仅因为默认值使用了 `fallback: "pi"` 就被静默路由回 PI。

CLI 后端别名与嵌入式 harness id 不同。首选的 Claude CLI 形式是：

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      agentRuntime: { id: "claude-cli" },
    },
  },
}
```

`claude-cli/claude-opus-4-7` 等旧版引用仍然支持以保持兼容性，但新配置应保持 provider/model 规范，并将执行后端放在 `agentRuntime.id` 中。

`auto` 模式有意保守。Plugin runtime 可以声明它们理解的 provider/model 对，但 Codex Plugin 在 `auto` 模式下不声明 `openai-codex` Provider。这使 `openai-codex/*` 保持为显式 PI Codex OAuth 路由，并避免将订阅认证配置静默迁移到原生 app-server harness。

如果 `openclaw doctor` 警告 `codex` Plugin 已启用但 `openai-codex/*` 仍通过 PI 路由，请将其视为诊断，而非迁移。当 PI Codex OAuth 是你想要的时，保持配置不变。仅当你想要原生 Codex app-server 执行时，才切换到 `openai/<model>` 加 `agentRuntime.id: "codex"`。

## 兼容性契约

当 runtime 不是 PI 时，它应该记录它支持哪些 OpenClaw 表面。对 runtime 文档使用以下形式：

| 问题                               | 重要原因                                                                                       |
| ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| 谁拥有 model loop？                | 决定重试、工具延续和最终答案决策在哪里发生。                                                   |
| 谁拥有规范线程历史？               | 决定 OpenClaw 是否可以编辑历史或只能镜像它。                                                   |
| OpenClaw 动态工具是否有效？        | 消息、Session、cron 和 OpenClaw 拥有的工具依赖于此。                                           |
| 动态工具 hook 是否有效？           | Plugin 期望 `before_tool_call`、`after_tool_call` 和围绕 OpenClaw 拥有工具的中间件。           |
| 原生工具 hook 是否有效？           | Shell、补丁和 runtime 拥有的工具需要原生 hook 支持以实现策略和观察。                           |
| 上下文引擎生命周期是否运行？       | 内存和上下文 Plugin 依赖于组装、摄取、轮次后和压缩生命周期。                                   |
| 暴露了哪些压缩数据？               | 某些 Plugin 只需要通知，而其他 Plugin 需要保留/丢弃的元数据。                                  |
| 什么是有意不支持的？               | 用户不应该在原生 runtime 拥有更多状态的地方假定 PI 等效性。                                    |

Codex runtime 支持契约记录在 [Codex harness](/plugins/codex-harness#v1-support-contract) 中。

## Status 标签

Status 输出可能同时显示 `Execution` 和 `Runtime` 标签。将它们视为诊断信息，而非 Provider 名称。

- 像 `openai/gpt-5.5` 这样的 model 引用告诉你选定的 provider/model。
- 像 `codex` 这样的 runtime id 告诉你哪个 loop 正在执行该轮次。
- 像 Telegram 或 Discord 这样的 Channel 标签告诉你对话在哪里进行。

如果 Session 在更改 runtime 配置后仍然显示 PI，请使用 `/new` 开始新 Session，或使用 `/reset` 清除当前 Session。现有 Session 保留其记录的 runtime，这样转录就不会通过两个不兼容的原生 Session 系统重放。

## 相关文档

- [Codex harness](/plugins/codex-harness)
- [OpenAI](/providers/openai)
- [Agent harness plugins](/plugins/sdk-agent-harness)
- [Agent loop](/concepts/agent-loop)
- [Models](/concepts/models)
- [Status](/cli/status)
