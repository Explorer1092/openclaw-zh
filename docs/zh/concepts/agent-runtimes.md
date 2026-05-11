---
mmh3_hash: "0005766b712a437844f8f9a27a0e2ac8"
summary: "OpenClaw 如何区分模型 Provider、模型、Channel 和 Agent 运行时"
title: "Agent 运行时"
read_when:
  - 您在 PI、Codex、ACP 或其他原生 Agent 运行时之间选择
  - 您对状态或配置中的 provider/model/runtime 标签感到困惑
  - 您正在记录原生 Harness 的支持对等性
---

**Agent 运行时**是拥有一个已准备好的模型循环的组件：它接收提示，驱动模型输出，处理原生工具调用，并将完成的轮次返回给 OpenClaw。

运行时容易与 Provider 混淆，因为两者都出现在模型配置附近。它们是不同的层：

| 层         | 示例                                  | 含义                                                                  |
| ---------- | ------------------------------------- | --------------------------------------------------------------------- |
| Provider   | `openai`、`anthropic`、`openai-codex` | OpenClaw 如何进行身份验证、发现模型和命名模型引用。                   |
| 模型       | `gpt-5.5`、`claude-opus-4-6`          | 为 Agent 轮次选择的模型。                                             |
| Agent 运行时 | `pi`、`codex`、`claude-cli`         | 执行已准备好的轮次的低级循环或后端。                                  |
| Channel    | Telegram、Discord、Slack、WhatsApp    | 消息进出 OpenClaw 的地方。                                            |

您还会在代码中看到 **Harness** 这个词。Harness 是提供 Agent 运行时的实现。例如，捆绑的 Codex Harness 实现了 `codex` 运行时。公开配置使用 Provider 或模型条目上的 `agentRuntime.id`；整个 Agent 的运行时键是旧版的，会被忽略。
`openclaw doctor --fix` 会移除旧版的整 Agent 运行时引脚，并在需要时将旧版运行时模型引用重写为规范的 provider/model 引用加上模型范围的运行时策略。

有两个运行时家族：

- **嵌入式 Harness** 在 OpenClaw 准备好的 Agent Loop 内运行。目前是内置的 `pi` 运行时加上已注册的 Plugin Harness（如 `codex`）。
- **CLI 后端** 在保持模型引用规范的同时运行本地 CLI 进程。例如，带有模型范围 `agentRuntime.id: "claude-cli"` 的 `anthropic/claude-opus-4-7` 表示"选择 Anthropic 模型，通过 Claude CLI 执行"。`claude-cli` 不是嵌入式 Harness ID，不得传递给 AgentHarness 选择。

## Codex 界面

大多数混淆来自共享 Codex 名称的几个不同界面：

| 界面                                          | OpenClaw 名称/配置                   | 功能                                                                                                        |
| --------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| 原生 Codex 应用服务器运行时                   | `openai/*` 模型引用                  | 通过 Codex 应用服务器运行 OpenAI 嵌入式 Agent 轮次。这是常见的 ChatGPT/Codex 订阅设置。                   |
| Codex OAuth 认证 Profile                      | `openai-codex` auth provider         | 存储 Codex 应用服务器 Harness 使用的 ChatGPT/Codex 订阅认证。                                              |
| Codex ACP 适配器                              | `runtime: "acp"`，`agentId: "codex"` | 通过外部 ACP/acpx 控制面运行 Codex。仅在明确请求 ACP/acpx 时使用。                                        |
| 原生 Codex 聊天控制命令集                     | `/codex ...`                         | 从聊天绑定、恢复、Steer、停止和检查 Codex 应用服务器线程。                                                 |
| 非 Agent 界面的 OpenAI 平台 API 路由           | `openai/*` 加 API 密钥认证           | 用于直接 OpenAI API，如图片、嵌入、语音和实时。                                                            |

这些界面是有意独立的。启用 `codex` Plugin 使原生应用服务器功能可用；`openclaw doctor --fix` 拥有旧版 `openai-codex/*` 路由修复和陈旧 Session 引脚清理。为 Agent 模型选择 `openai/*` 现在意味着"通过 Codex 运行这个"，除非正在使用非 Agent 的 OpenAI API 界面。

常见的 ChatGPT/Codex 订阅设置使用 Codex OAuth 进行认证，但将模型引用保持为 `openai/*` 并选择 `codex` 运行时：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
    },
  },
}
```

这意味着 OpenClaw 选择 OpenAI 模型引用，然后要求 Codex 应用服务器运行时运行嵌入式 Agent 轮次。这不表示"使用 API 计费"，也不意味着 Channel、模型 Provider 目录或 OpenClaw Session 存储变成了 Codex。

这是面向 Agent 的决策树：

1. 如果用户请求 **Codex 绑定/控制/线程/恢复/Steer/停止**，当捆绑的 `codex` Plugin 启用时使用原生 `/codex` 命令界面。
2. 如果用户请求 **Codex 作为嵌入式运行时**或想要正常的订阅支持的 Codex Agent 体验，使用 `openai/<model>`。
3. 如果用户明确为 **OpenAI 模型选择 PI**，将模型引用保持为 `openai/<model>` 并设置 provider/model 运行时策略为 `agentRuntime.id: "pi"`。选定的 `openai-codex` auth Profile 通过 PI 的旧版 Codex 认证传输在内部路由。
4. 如果旧版配置仍包含 **`openai-codex/*` 模型引用**，使用 `openclaw doctor --fix` 修复为 `openai/<model>`；doctor 通过在旧版模型引用隐含的地方添加 provider/model 范围的 `agentRuntime.id: "codex"` 来保持 Codex 认证路由。
5. 如果用户明确说 **ACP**、**acpx** 或 **Codex ACP 适配器**，使用带有 `runtime: "acp"` 和 `agentId: "codex"` 的 ACP。
6. 如果请求是 **Claude Code、Gemini CLI、OpenCode、Cursor、Droid 或其他外部 Harness**，使用 ACP/acpx，而不是原生子 Agent 运行时。

| 您的意思...                          | 使用...                                          |
| ------------------------------------ | ------------------------------------------------ |
| Codex 应用服务器聊天/线程控制        | 来自捆绑 `codex` Plugin 的 `/codex ...`          |
| Codex 应用服务器嵌入式 Agent 运行时  | `openai/*` Agent 模型引用                        |
| OpenAI Codex OAuth                   | `openai-codex` auth Profile                      |
| Claude Code 或其他外部 Harness       | ACP/acpx                                         |

## 运行时所有权

不同的运行时拥有不同数量的循环。

| 界面                    | OpenClaw PI 嵌入式                      | Codex 应用服务器                                                            |
| ----------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| 模型循环所有者          | OpenClaw 通过 PI 嵌入式运行器           | Codex 应用服务器                                                            |
| 规范线程状态            | OpenClaw 转录                           | Codex 线程，加上 OpenClaw 转录镜像                                          |
| OpenClaw 动态工具       | 原生 OpenClaw 工具循环                  | 通过 Codex 适配器桥接                                                       |
| 原生 Shell 和文件工具   | PI/OpenClaw 路径                        | Codex 原生工具，支持时通过原生 Hook 桥接                                    |
| 上下文引擎              | 原生 OpenClaw 上下文组装                | OpenClaw 将组装的上下文投影到 Codex 轮次中                                  |
| 压缩                    | OpenClaw 或选定的上下文引擎             | Codex 原生压缩，带有 OpenClaw 通知和镜像维护                                |
| Channel 传递            | OpenClaw                                | OpenClaw                                                                    |

## 运行时选择

OpenClaw 在 Provider 和模型解析后选择嵌入式运行时：

1. 模型范围的运行时策略优先。
2. Provider 范围的运行时策略其次。
3. 在 `auto` 模式下，已注册的 Plugin 运行时可以主张支持的 provider/model 对。
4. 如果在 `auto` 模式下没有运行时主张轮次，OpenClaw 使用 PI 作为兼容性运行时。

整 Session 和整 Agent 的运行时引脚被忽略，包括 `OPENCLAW_AGENT_RUNTIME`、Session `agentHarnessId`/`agentRuntimeOverride` 状态、`agents.defaults.agentRuntime` 和 `agents.list[].agentRuntime`。运行 `openclaw doctor --fix` 以移除陈旧的整 Agent 运行时配置。

## 状态标签

状态输出可能同时显示 `Execution` 和 `Runtime` 标签。将它们读作诊断信息，而不是 Provider 名称。

- 模型引用（如 `openai/gpt-5.5`）告知您选定的 provider/model。
- 运行时 ID（如 `codex`）告知您哪个循环正在执行该轮次。
- Channel 标签（如 Telegram 或 Discord）告知您对话发生的地方。

## 相关

- [Codex Harness](/plugins/codex-harness)
- [Codex Harness 运行时](/plugins/codex-harness-runtime)
- [OpenAI](/providers/openai)
- [Agent Harness Plugin](/plugins/sdk-agent-harness)
- [Agent Loop](/concepts/agent-loop)
- [模型](/concepts/models)
- [状态](/cli/status)
