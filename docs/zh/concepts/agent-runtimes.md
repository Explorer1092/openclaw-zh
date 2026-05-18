---
mmh3_hash: "eb66906e96c7f8056bab0a05464d6464"
summary: "OpenClaw 如何区分模型 Provider、模型、Channel 和 Agent 运行时"
title: "Agent 运行时"
read_when:
  - 您在 PI、Codex、ACP 或其他原生 Agent 运行时之间进行选择
  - 您对状态或配置中的 provider/model/runtime 标签感到困惑
  - 您正在为原生 harness 记录支持对等性
---

**Agent 运行时**是拥有一个准备好的模型循环的组件：它接收提示、驱动模型输出、处理原生工具调用，并将完成的轮次返回给 OpenClaw。

运行时容易与 Provider 混淆，因为两者都出现在模型配置附近。它们是不同的层次：

| 层次         | 示例                                  | 含义                                                                  |
| ------------ | ------------------------------------- | --------------------------------------------------------------------- |
| Provider     | `openai`, `anthropic`, `openai-codex` | OpenClaw 如何进行身份验证、发现模型并命名模型引用。                   |
| 模型         | `gpt-5.5`, `claude-opus-4-6`          | 为 Agent 轮次选择的模型。                                             |
| Agent 运行时 | `pi`, `codex`, `claude-cli`           | 执行准备好的轮次的低级循环或后端。                                    |
| Channel      | Telegram, Discord, Slack, WhatsApp    | 消息进出 OpenClaw 的地方。                                            |

您还会在代码中看到 **harness** 这个词。Harness 是提供 Agent 运行时的实现。例如，捆绑的 Codex harness 实现了 `codex` 运行时。公共配置在 Provider 或模型条目上使用 `agentRuntime.id`；整个 Agent 运行时键是旧版配置，会被忽略。`openclaw doctor --fix` 会删除旧的整个 Agent 运行时固定项，并在需要时将旧版运行时模型引用重写为规范的 provider/model 引用加上模型范围的运行时策略。

有两个运行时系列：

- **嵌入式 harness** 在 OpenClaw 准备好的 Agent 循环内运行。目前是内置的 `pi` 运行时加上注册的 Plugin harness（如 `codex`）。
- **CLI 后端** 在保持模型引用规范的同时运行本地 CLI 进程。例如，`anthropic/claude-opus-4-7` 带有模型范围的 `agentRuntime.id: "claude-cli"` 意味着"选择 Anthropic 模型，通过 Claude CLI 执行"。`claude-cli` 不是嵌入式 harness id，不能传递给 AgentHarness 选择。

## Codex 界面

大多数混乱来自多个不同的界面共享 Codex 名称：

| 界面                                             | OpenClaw 名称/配置                   | 功能                                                                                                           |
| ------------------------------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| 原生 Codex 应用服务器运行时                      | `openai/*` 模型引用                  | 通过 Codex 应用服务器运行 OpenAI 嵌入式 Agent 轮次。这是通常的 ChatGPT/Codex 订阅设置。                       |
| Codex OAuth auth profiles                        | `openai-codex` auth provider         | 存储 Codex 应用服务器 harness 使用的 ChatGPT/Codex 订阅身份验证。                                             |
| Codex ACP 适配器                                 | `runtime: "acp"`, `agentId: "codex"` | 通过外部 ACP/acpx 控制平面运行 Codex。仅在明确要求 ACP/acpx 时使用。                                          |
| 原生 Codex 聊天控制命令集                        | `/codex ...`                         | 从聊天中绑定、恢复、引导、停止和检查 Codex 应用服务器线程。                                                    |
| 非 Agent 界面的 OpenAI Platform API 路由         | `openai/*` 加 API 密钥身份验证       | 用于直接 OpenAI API，如图像、嵌入、语音和实时。                                                                |

这些界面是有意独立的。启用 `codex` Plugin 使原生应用服务器功能可用；`openclaw doctor --fix` 负责旧版 `openai-codex/*` 路由修复和陈旧 Session 固定项清理。现在为 Agent 模型选择 `openai/*` 意味着"通过 Codex 运行此模型"，除非正在使用非 Agent OpenAI API 界面。

常见的 ChatGPT/Codex 订阅设置使用 Codex OAuth 进行身份验证，但将模型引用保留为 `openai/*` 并选择 `codex` 运行时：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

这意味着 OpenClaw 选择一个 OpenAI 模型引用，然后请求 Codex 应用服务器运行时运行嵌入式 Agent 轮次。这不意味着"使用 API 计费"，也不意味着 Channel、模型 Provider 目录或 OpenClaw Session 存储变成 Codex。

当捆绑的 `codex` Plugin 启用时，自然语言 Codex 控制应使用原生 `/codex` 命令界面（`/codex bind`、`/codex threads`、`/codex resume`、`/codex steer`、`/codex stop`）而不是 ACP。仅在用户明确要求 ACP/acpx 或测试 ACP 适配器路径时，才对 Codex 使用 ACP。Claude Code、Gemini CLI、OpenCode、Cursor 和类似的外部 harness 仍使用 ACP。

以下是面向 Agent 的决策树：

1. 如果用户要求 **Codex bind/control/thread/resume/steer/stop**，当捆绑的 `codex` Plugin 启用时，使用原生 `/codex` 命令界面。
2. 如果用户要求 **Codex 作为嵌入式运行时**或想要正常的订阅支持的 Codex Agent 体验，使用 `openai/<model>`。
3. 如果用户明确选择 **PI 用于 OpenAI 模型**，将模型引用保留为 `openai/<model>` 并将 provider/model 运行时策略设置为 `agentRuntime.id: "pi"`。选定的 `openai-codex` auth profile 在内部通过 PI 的旧版 Codex-auth 传输路由。
4. 如果旧版配置仍包含 **`openai-codex/*` 模型引用**，使用 `openclaw doctor --fix` 将其修复为 `openai/<model>`；doctor 通过在旧模型引用暗示的位置添加 provider/model 范围的 `agentRuntime.id: "codex"` 来保留 Codex auth 路由。
   旧版 **`codex-cli/*` 模型引用**修复为相同的 `openai/<model>` Codex 应用服务器路由；OpenClaw 不再保留捆绑的 Codex CLI 后端。
5. 如果用户明确说 **ACP**、**acpx** 或 **Codex ACP 适配器**，使用带有 `runtime: "acp"` 和 `agentId: "codex"` 的 ACP。
6. 如果请求是 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 harness**，使用 ACP/acpx，而不是原生子 Agent 运行时。

| 您的意图...                             | 使用...                                        |
| --------------------------------------- | ---------------------------------------------- |
| Codex 应用服务器聊天/线程控制           | 来自捆绑 `codex` Plugin 的 `/codex ...`        |
| Codex 应用服务器嵌入式 Agent 运行时     | `openai/*` Agent 模型引用                      |
| OpenAI Codex OAuth                      | `openai-codex` auth profiles                   |
| Claude Code 或其他外部 harness          | ACP/acpx                                       |

有关 OpenAI 系列前缀拆分，请参见 [OpenAI](/providers/openai) 和[模型 Provider](/concepts/model-providers)。有关 Codex 运行时支持契约，请参见 [Codex harness 运行时](/plugins/codex-harness-runtime#v1-support-contract)。

## 运行时所有权

不同的运行时拥有循环的不同部分。

| 界面                     | OpenClaw PI 嵌入式                      | Codex 应用服务器                                                            |
| ------------------------ | --------------------------------------- | --------------------------------------------------------------------------- |
| 模型循环所有者           | OpenClaw 通过 PI 嵌入式运行器           | Codex 应用服务器                                                            |
| 规范线程状态             | OpenClaw 转录                           | Codex 线程，加上 OpenClaw 转录镜像                                          |
| OpenClaw 动态工具        | 原生 OpenClaw 工具循环                  | 通过 Codex 适配器桥接                                                       |
| 原生 Shell 和文件工具    | PI/OpenClaw 路径                        | Codex 原生工具，在支持的地方通过原生 Hook 桥接                              |
| 上下文引擎               | 原生 OpenClaw 上下文组装                | OpenClaw 将组装好的上下文投影到 Codex 轮次中                                |
| 压缩                     | OpenClaw 或所选上下文引擎               | Codex 原生压缩，带有 OpenClaw 通知和镜像维护                                |
| Channel 传递             | OpenClaw                                | OpenClaw                                                                    |

这种所有权拆分是主要的设计规则：

- 如果 OpenClaw 拥有界面，OpenClaw 可以提供正常的 Plugin Hook 行为。
- 如果原生运行时拥有界面，OpenClaw 需要运行时事件或原生 Hook。
- 如果原生运行时拥有规范线程状态，OpenClaw 应该镜像和投影上下文，而不是重写不支持的内部结构。

## 运行时选择

OpenClaw 在 Provider 和模型解析后选择嵌入式运行时：

1. 模型范围的运行时策略优先。这可以位于已配置的 Provider 模型条目或 `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` 中。Provider 通配符（如 `agents.defaults.models["vllm/*"].agentRuntime`）在精确模型策略之后应用，因此动态发现的 Provider 模型可以共享一个运行时，而不覆盖精确的每个模型例外。
2. Provider 范围的运行时策略接下来在 `models.providers.<provider>.agentRuntime` 处。
3. 在 `auto` 模式下，注册的 Plugin 运行时可以声明支持的 provider/model 对。
4. 如果在 `auto` 模式下没有运行时声明轮次，OpenClaw 使用 PI 作为兼容性运行时。当运行必须严格时，使用明确的运行时 id。

整个 Session 和整个 Agent 运行时固定项被忽略。这包括 `OPENCLAW_AGENT_RUNTIME`、Session `agentHarnessId`/`agentRuntimeOverride` 状态、`agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。运行 `openclaw doctor --fix` 以删除陈旧的整个 Agent 运行时配置，并在 OpenClaw 可以保留意图的地方转换旧版运行时模型引用。

明确的 provider/model Plugin 运行时以封闭方式失败。例如，Provider 或模型上的 `agentRuntime.id: "codex"` 意味着 Codex 或明确的选择/运行时错误；它永远不会静默地路由回 PI。

CLI 后端别名与嵌入式 harness id 不同。首选的 Claude CLI 形式为：

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-7",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

旧版引用如 `claude-cli/claude-opus-4-7` 仍然支持向后兼容，但新配置应保持 provider/model 规范，并将执行后端放在 provider/model 运行时策略中。

旧版 `codex-cli/*` 引用不同：doctor 将它们迁移到 `openai/*`，使它们通过 Codex 应用服务器 harness 运行，而不是保留 Codex CLI 后端。

`auto` 模式对大多数 Provider 有意保守。OpenAI Agent 模型是例外：未设置的运行时和 `auto` 都解析为 Codex harness。明确的 PI 运行时配置对于 `openai/*` Agent 轮次仍然是一个可选的兼容性路由；当与选定的 `openai-codex` auth profile 配对时，OpenClaw 在内部通过旧版 Codex-auth 传输路由 PI，同时将公共模型引用保留为 `openai/*`。陈旧的 OpenAI PI Session 固定项被运行时选择忽略，可以使用 `openclaw doctor --fix` 清理。

如果 `openclaw doctor` 警告 `codex` Plugin 已启用而配置中仍然存在 `openai-codex/*`，则将其视为旧版路由状态。运行 `openclaw doctor --fix` 将其重写为带有 Codex 运行时的 `openai/*`。

## 兼容性契约

当运行时不是 PI 时，它应该记录它支持哪些 OpenClaw 界面。对运行时文档使用以下形式：

| 问题                                   | 重要性                                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 谁拥有模型循环？                       | 决定重试、工具延续和最终答案决策发生的位置。                                                      |
| 谁拥有规范线程历史？                   | 决定 OpenClaw 是否可以编辑历史或只能镜像它。                                                      |
| OpenClaw 动态工具是否有效？            | 消息、Session、cron 和 OpenClaw 拥有的工具依赖于此。                                              |
| 动态工具 Hook 是否有效？               | Plugin 期望 `before_tool_call`、`after_tool_call` 和围绕 OpenClaw 拥有工具的中间件。              |
| 原生工具 Hook 是否有效？               | Shell、补丁和运行时拥有的工具需要原生 Hook 支持以进行策略和观察。                                 |
| 上下文引擎生命周期是否运行？           | 内存和上下文 Plugin 依赖于组装、摄取、轮次后和压缩生命周期。                                      |
| 公开了哪些压缩数据？                   | 一些 Plugin 只需要通知，而其他 Plugin 需要保留/丢弃的元数据。                                     |
| 什么是有意不支持的？                   | 用户不应假设在原生运行时拥有更多状态的情况下与 PI 等同。                                          |

Codex 运行时支持契约记录在 [Codex harness 运行时](/plugins/codex-harness-runtime#v1-support-contract)。

## 状态标签

状态输出可能显示 `Execution` 和 `Runtime` 标签。将它们读作诊断信息，而不是 Provider 名称。

- 像 `openai/gpt-5.5` 这样的模型引用告诉您选择的 provider/model。
- 像 `codex` 这样的运行时 id 告诉您哪个循环在执行轮次。
- 像 Telegram 或 Discord 这样的 Channel 标签告诉您对话在哪里进行。

如果运行仍然显示意外的运行时，请先检查选定的 provider/model 运行时策略。旧版 Session 运行时固定项不再决定路由。

## 相关

- [Codex harness](/plugins/codex-harness)
- [Codex harness 运行时](/plugins/codex-harness-runtime)
- [OpenAI](/providers/openai)
- [Agent harness Plugin](/plugins/sdk-agent-harness)
- [Agent loop](/concepts/agent-loop)
- [模型](/concepts/models)
- [状态](/cli/status)
