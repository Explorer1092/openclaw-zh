---
mmh3_hash: "1392a459787b2a820cb7a4e9b903bf56"
title: "Codex Harness"
summary: "通过捆绑的 Codex 应用服务器测试框架运行 OpenClaw 嵌入式 Agent 轮次"
read_when:
  - 您想使用捆绑的 Codex 应用服务器测试框架
  - 您需要 Codex 测试框架配置示例
  - 您希望仅 Codex 部署失败而不是回退到 PI
---

捆绑的 `codex` Plugin 让 OpenClaw 通过 Codex 应用服务器而不是内置 PI 测试框架运行嵌入式 Agent 轮次。

当您希望 Codex 拥有低级 Agent Session 时使用此功能：模型发现、原生线程恢复、原生压缩和应用服务器执行。OpenClaw 仍然拥有聊天 Channel、Session 文件、模型选择、工具、审批、媒体投递和可见的转录镜像。

如果您想了解概况，请从 [Agent 运行时](/concepts/agent-runtimes) 开始。简而言之：`openai/gpt-5.5` 是模型引用，`codex` 是运行时，Telegram、Discord、Slack 或其他 Channel 仍然是通信界面。

## 此 Plugin 的变更内容

捆绑的 `codex` Plugin 贡献了几项独立能力：

| 能力                          | 使用方式                                            | 作用                                                                              |
| ----------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| 原生嵌入式运行时              | `agentRuntime.id: "codex"`                          | 通过 Codex 应用服务器运行 OpenClaw 嵌入式 Agent 轮次。                            |
| 原生聊天控制命令              | `/codex bind`、`/codex resume`、`/codex steer`、... | 从消息对话中绑定和控制 Codex 应用服务器线程。                                     |
| Codex 应用服务器 Provider/目录 | `codex` 内部，通过测试框架暴露                      | 让运行时发现和验证应用服务器模型。                                                |
| Codex 媒体理解路径            | `codex/*` 图像模型兼容路径                          | 为支持的图像理解模型运行有限的 Codex 应用服务器轮次。                             |
| 原生 Hook 中继                | 围绕 Codex 原生事件的 Plugin Hook                   | 让 OpenClaw 观察/阻止支持的 Codex 原生工具/最终化事件。                           |

启用 Plugin 使这些能力可用。它**不会**：

- 对每个 OpenAI 模型使用 Codex
- 将 `openai-codex/*` 模型引用转换为原生运行时
- 将 ACP/acpx 设为默认 Codex 路径
- 热切换已记录 PI 运行时的现有 Session
- 替换 OpenClaw Channel 投递、Session 文件、认证配置存储或消息路由

同一 Plugin 还拥有原生 `/codex` 聊天控制命令界面。如果 Plugin 已启用且用户要求从聊天中绑定、恢复、引导、停止或检查 Codex 线程，Agent 应优先使用 `/codex ...` 而不是 ACP。当用户明确要求 ACP/acpx 或正在测试 ACP Codex 适配器时，ACP 仍然是显式的回退方式。

原生 Codex 轮次将 OpenClaw Plugin Hook 保留为公共兼容性层。这些是进程内 OpenClaw Hook，而不是 Codex `hooks.json` 命令 Hook：

- `before_prompt_build`
- `before_compaction`、`after_compaction`
- `llm_input`、`llm_output`
- `before_tool_call`、`after_tool_call`
- `before_message_write`（用于镜像转录记录）
- `before_agent_finalize`（通过 Codex `Stop` 中继）
- `agent_end`

Plugin 还可以注册运行时中立的工具结果中间件，在 OpenClaw 执行工具后、将结果返回给 Codex 之前重写 OpenClaw 动态工具结果。这与公共 `tool_result_persist` Plugin Hook 是分开的，后者转换 OpenClaw 拥有的转录工具结果写入。

关于 Plugin Hook 语义本身，请参见 [Plugin Hook](/plugins/hooks) 和 [Plugin 守护行为](/tools/plugin)。

测试框架默认关闭。新配置应将 OpenAI 模型引用保持为 `openai/gpt-*` 的规范形式，并在需要原生应用服务器执行时显式设置 `agentRuntime.id: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex`。旧版 `codex/*` 模型引用仍然自动选择测试框架以保持兼容性，但运行时支持的旧版 Provider 前缀不作为正常模型/Provider 选项显示。

如果 `codex` Plugin 已启用但主要模型仍然是 `openai-codex/*`，`openclaw doctor` 会发出警告而不是更改路由。这是有意的：`openai-codex/*` 仍然是 PI Codex OAuth/订阅路径，原生应用服务器执行仍然是显式的运行时选择。

## 路由图

在更改配置之前使用此表：

| 期望行为                            | 模型引用               | 运行时配置                             | Plugin 要求                 | 预期状态标签                   |
| ----------------------------------- | ---------------------- | -------------------------------------- | --------------------------- | ------------------------------ |
| 通过正常 OpenClaw 运行器使用 OpenAI API | `openai/gpt-*`         | 省略或 `runtime: "pi"`                 | OpenAI Provider             | `Runtime: OpenClaw Pi Default` |
| 通过 PI 使用 Codex OAuth/订阅       | `openai-codex/gpt-*`   | 省略或 `runtime: "pi"`                 | OpenAI Codex OAuth Provider | `Runtime: OpenClaw Pi Default` |
| 原生 Codex 应用服务器嵌入式轮次    | `openai/gpt-*`         | `agentRuntime.id: "codex"`             | `codex` Plugin              | `Runtime: OpenAI Codex`        |
| 混合 Provider 加保守自动模式        | 特定于 Provider 的引用 | `agentRuntime.id: "auto"`              | 可选 Plugin 运行时          | 取决于选定的运行时             |
| 显式 Codex ACP 适配器 Session       | 依赖 ACP 提示/模型     | `sessions_spawn` 带 `runtime: "acp"`   | 健康的 `acpx` 后端          | ACP 任务/Session 状态          |

关键区别是 Provider 与运行时：

- `openai-codex/*` 回答"PI 应该使用哪个 Provider/认证路由？"
- `agentRuntime.id: "codex"` 回答"哪个循环应该执行这个嵌入式轮次？"
- `/codex ...` 回答"这个聊天应该绑定或控制哪个原生 Codex 对话？"
- ACP 回答"acpx 应该启动哪个外部测试框架进程？"

## 选择正确的模型前缀

OpenAI 系列路由是特定于前缀的。当您希望 Codex OAuth 通过 PI 时使用 `openai-codex/*`；当您希望直接访问 OpenAI API 或强制使用原生 Codex 应用服务器测试框架时使用 `openai/*`：

| 模型引用                                        | 运行时路径                                    | 使用时机                                                                |
| ----------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `openai/gpt-5.4`                                | 通过 OpenClaw/PI 管道的 OpenAI Provider       | 您想通过 `OPENAI_API_KEY` 直接访问当前的 OpenAI Platform API。          |
| `openai-codex/gpt-5.5`                          | 通过 OpenClaw/PI 的 OpenAI Codex OAuth        | 您想使用 ChatGPT/Codex 订阅认证加默认 PI 运行器。                       |
| `openai/gpt-5.5` + `agentRuntime.id: "codex"`  | Codex 应用服务器测试框架                      | 您想为嵌入式 Agent 轮次使用原生 Codex 应用服务器执行。                  |

GPT-5.5 目前在 OpenClaw 中仅限订阅/OAuth。使用 `openai-codex/gpt-5.5` 进行 PI OAuth，或使用带 Codex 应用服务器测试框架的 `openai/gpt-5.5`。一旦 OpenAI 在公共 API 上启用 GPT-5.5，就支持 `openai/gpt-5.5` 的直接 API 密钥访问。

旧版 `codex/gpt-*` 引用仍然作为兼容性别名被接受。Doctor 兼容性迁移将旧版主要运行时引用重写为规范模型引用，并单独记录运行时策略，而仅用于回退的旧版引用保持不变，因为运行时是为整个 Agent 容器配置的。新的 PI Codex OAuth 配置应使用 `openai-codex/gpt-*`；新的原生应用服务器测试框架配置应使用 `openai/gpt-*` 加上 `agentRuntime.id: "codex"`。

`agents.defaults.imageModel` 遵循相同的前缀分割。当图像理解应通过 OpenAI Codex OAuth Provider 路径运行时，使用 `openai-codex/gpt-*`。当图像理解应通过有限的 Codex 应用服务器轮次运行时，使用 `codex/gpt-*`。Codex 应用服务器模型必须宣传图像输入支持；仅文本的 Codex 模型会在媒体轮次开始前失败。

使用 `/status` 确认当前 Session 的有效测试框架。如果选择令人意外，请为 `agents/harness` 子系统启用调试日志记录，并检查 Gateway 的结构化 `agent harness selected` 记录。它包括选定的测试框架 id、选择原因、运行时/回退策略，以及在 `auto` 模式下每个 Plugin 候选的支持结果。

### Doctor 警告的含义

当以下所有条件为真时，`openclaw doctor` 会发出警告：

- 捆绑的 `codex` Plugin 已启用或被允许
- Agent 的主要模型是 `openai-codex/*`
- 该 Agent 的有效运行时不是 `codex`

该警告的存在是因为用户经常期望"Codex Plugin 已启用"意味着"原生 Codex 应用服务器运行时"。OpenClaw 不做这种假设。该警告的含义是：

- 如果您打算通过 PI 使用 ChatGPT/Codex OAuth，**无需任何更改**。
- 如果您打算使用原生应用服务器执行，请将模型更改为 `openai/<model>` 并设置 `agentRuntime.id: "codex"`。
- 运行时更改后，现有 Session 仍然需要 `/new` 或 `/reset`，因为 Session 运行时锁定是粘性的。

测试框架选择不是实时 Session 控制。当嵌入式轮次运行时，OpenClaw 在该 Session 上记录所选的测试框架 id，并在同一 Session id 的后续轮次中继续使用它。当您希望未来的 Session 使用另一个测试框架时，更改 `agentRuntime` 配置或 `OPENCLAW_AGENT_RUNTIME`；使用 `/new` 或 `/reset` 在将现有对话从 PI 切换到 Codex 之前开始新的 Session。这避免了通过两个不兼容的原生 Session 系统重放一个转录。

在测试框架锁定之前创建的旧版 Session 一旦有转录历史记录，就被视为 PI 锁定的。在更改配置后使用 `/new` 或 `/reset` 将该对话加入 Codex。

`/status` 显示有效的模型运行时。默认 PI 测试框架显示为 `Runtime: OpenClaw Pi Default`，Codex 应用服务器测试框架显示为 `Runtime: OpenAI Codex`。

## 要求

- 带有捆绑 `codex` Plugin 的 OpenClaw。
- Codex 应用服务器 `0.125.0` 或更新版本。捆绑的 Plugin 默认管理兼容的 Codex 应用服务器二进制文件，因此 `PATH` 上的本地 `codex` 命令不影响正常的测试框架启动。
- 应用服务器进程可用的 Codex 认证。

Plugin 阻止旧版或未版本化的应用服务器握手。这使 OpenClaw 保持在已测试的协议接口上。

对于实时和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，加上可选的 Codex CLI 文件，如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。使用与本地 Codex 应用服务器相同的认证材料。

## 最小配置

使用 `openai/gpt-5.5`，启用捆绑 Plugin，并强制 `codex` 测试框架：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
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

如果您的配置使用 `plugins.allow`，也在那里包含 `codex`：

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

将 `agents.defaults.model` 或 Agent 模型设置为 `codex/<model>` 的旧版配置仍然自动启用捆绑的 `codex` Plugin。新配置应优先使用 `openai/<model>` 加上上述显式 `agentRuntime` 条目。

## 在不替换其他模型的情况下添加 Codex

如果同一 Agent 应该在 Codex 和非 Codex Provider 模型之间自由切换，不要全局设置 `agentRuntime.id: "codex"`。强制的运行时适用于该 Agent 或 Session 的每个嵌入式轮次。如果您在强制该运行时的情况下选择 Anthropic 模型，OpenClaw 仍然尝试 Codex 测试框架并失败关闭，而不是静默地将该轮次路由到 PI。

改用以下形状之一：

- 将 Codex 放在专用的 Agent 上，设置 `agentRuntime.id: "codex"`。
- 对于正常混合 Provider 使用，将默认 Agent 保持在 `agentRuntime.id: "auto"` 加 PI 回退。
- 仅为兼容性使用旧版 `codex/*` 引用。新配置应优先使用 `openai/*` 加显式 Codex 运行时策略。

例如，这将默认 Agent 保持在正常自动选择，并添加一个单独的 Codex Agent：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
        },
      },
    ],
  },
}
```

使用此形状：

- 默认 `main` Agent 使用正常的 Provider 路径和 PI 兼容性回退。
- `codex` Agent 使用 Codex 应用服务器测试框架。
- 如果 Codex 对 `codex` Agent 缺失或不支持，轮次会失败而不是静默使用 PI。

## Agent 命令路由

Agent 应该按意图而不仅仅按"Codex"这个词来路由用户请求：

| 用户要求...                                       | Agent 应该使用...                                  |
| ------------------------------------------------- | -------------------------------------------------- |
| "将此聊天绑定到 Codex"                            | `/codex bind`                                      |
| "在此处恢复 Codex 线程 `<id>`"                    | `/codex resume <id>`                               |
| "显示 Codex 线程"                                 | `/codex threads`                                   |
| "将 Codex 用作此 Agent 的运行时"                  | 配置更改为 `agentRuntime.id`                       |
| "将我的 ChatGPT/Codex 订阅与正常 OpenClaw 一起使用" | `openai-codex/*` 模型引用                          |
| "通过 ACP/acpx 运行 Codex"                        | ACP `sessions_spawn({ runtime: "acp", ... })`      |
| "在线程中启动 Claude Code/Gemini/OpenCode/Cursor" | ACP/acpx，不是 `/codex`，也不是原生子 Agent        |

只有当 ACP 已启用、可调度且由加载的运行时后端支持时，OpenClaw 才向 Agent 宣传 ACP 生成指南。如果 ACP 不可用，系统提示和 Plugin Skill 不应教 Agent 关于 ACP 路由的知识。

## 仅 Codex 部署

当您需要证明每个嵌入式 Agent 轮次都使用 Codex 时，强制 Codex 测试框架。显式 Plugin 运行时默认没有 PI 回退，因此 `fallback: "none"` 是可选的，但通常作为文档很有用：

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

环境覆盖：

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

强制 Codex 后，如果 Codex Plugin 被禁用、应用服务器太旧或应用服务器无法启动，OpenClaw 会提前失败。仅在您有意希望 PI 处理缺失的测试框架选择时，才设置 `OPENCLAW_AGENT_HARNESS_FALLBACK=pi`。

## 每个 Agent 的 Codex

您可以让一个 Agent 仅使用 Codex，而默认 Agent 保持正常自动选择：

```json5
{
  agents: {
    defaults: {
      agentRuntime: {
        id: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        agentRuntime: {
          id: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

使用正常的 Session 命令切换 Agent 和模型。`/new` 创建新的 OpenClaw Session，Codex 测试框架根据需要创建或恢复其伴随的应用服务器线程。`/reset` 清除该线程的 OpenClaw Session 绑定，并让下一轮次从当前配置重新解析测试框架。

## 模型发现

默认情况下，Codex Plugin 向应用服务器请求可用模型。如果发现失败或超时，它使用捆绑的回退目录：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

您可以在 `plugins.entries.codex.config.discovery` 下调整发现：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

当您希望启动避免探测 Codex 并坚持使用回退目录时，禁用发现：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## 应用服务器连接和策略

默认情况下，Plugin 使用 OpenClaw 管理的 Codex 二进制文件在本地启动：

```bash
codex app-server --listen stdio://
```

管理的二进制文件被声明为捆绑 Plugin 运行时依赖项，并与其余的 `codex` Plugin 依赖项一起暂存。这使应用服务器版本与捆绑 Plugin 绑定，而不是与本地安装的任何单独 Codex CLI 绑定。仅当您有意运行不同的可执行文件时，才设置 `appServer.command`。

默认情况下，OpenClaw 以 YOLO 模式启动本地 Codex 测试框架 Session：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和 `sandbox: "danger-full-access"`。这是用于自主心跳的受信任本地操作员姿态：Codex 可以使用 shell 和网络工具，而不会停在没有人在场回答的原生审批提示上。

要选择 Codex guardian 审查的审批，设置 `appServer.mode: "guardian"`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

Guardian 模式使用 Codex 的原生自动审查审批路径。当 Codex 要求离开沙盒、在工作区外写入或添加网络访问等权限时，Codex 将该审批请求路由到原生审阅者而不是人工提示。审阅者应用 Codex 的风险框架并批准或拒绝特定请求。当您希望比 YOLO 模式有更多的护栏但仍需要无人值守的 Agent 取得进展时，使用 Guardian。

`guardian` 预设扩展为 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。单独的策略字段仍然覆盖 `mode`，因此高级部署可以将预设与显式选择混合。旧版 `guardian_subagent` 审阅者值仍然作为兼容性别名被接受，但新配置应使用 `auto_review`。

对于已运行的应用服务器，使用 WebSocket 传输：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

支持的 `appServer` 字段：

| 字段                | 默认值                                   | 含义                                                                                                         |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `transport`         | `"stdio"`                                | `"stdio"` 生成 Codex；`"websocket"` 连接到 `url`。                                                           |
| `command`           | 管理的 Codex 二进制文件                  | stdio 传输的可执行文件。保持未设置以使用管理的二进制文件；仅在显式覆盖时设置。                               |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 传输的参数。                                                                                           |
| `url`               | 未设置                                   | WebSocket 应用服务器 URL。                                                                                   |
| `authToken`         | 未设置                                   | WebSocket 传输的 Bearer token。                                                                              |
| `headers`           | `{}`                                     | 额外的 WebSocket 头部。                                                                                      |
| `requestTimeoutMs`  | `60000`                                  | 应用服务器控制平面调用的超时。                                                                               |
| `mode`              | `"yolo"`                                 | YOLO 或 guardian 审查执行的预设。                                                                            |
| `approvalPolicy`    | `"never"`                                | 发送给线程启动/恢复/轮次的原生 Codex 审批策略。                                                              |
| `sandbox`           | `"danger-full-access"`                   | 发送给线程启动/恢复的原生 Codex 沙盒模式。                                                                   |
| `approvalsReviewer` | `"user"`                                 | 使用 `"auto_review"` 让 Codex 审查原生审批提示。`guardian_subagent` 仍然是旧版别名。                         |
| `serviceTier`       | 未设置                                   | 可选的 Codex 应用服务器服务层：`"fast"`、`"flex"` 或 `null`。无效的旧版值被忽略。                            |

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` 在 `appServer.command` 未设置时绕过管理的二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 进行一次性本地测试。配置是可重复部署的首选方式，因为它将 Plugin 行为保留在与其余 Codex 测试框架设置相同的已审查文件中。

## Computer Use

Computer Use 是一个 Codex 原生 MCP Plugin。OpenClaw 不自己提供桌面控制应用程序或执行桌面操作；它启用 Codex 应用服务器 Plugin，在请求时安装配置的 Codex 市场 Plugin，检查 `computer-use` MCP 服务器是否可用，然后让 Codex 在 Codex 模式轮次期间处理原生 MCP 工具调用。

当您希望 Codex 模式轮次需要 Computer Use 时，设置 `plugins.entries.codex.config.computerUse`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

没有市场字段时，OpenClaw 要求 Codex 应用服务器使用其发现的市场。在全新的 Codex home 上，应用服务器会种子化官方精选市场，OpenClaw 遵循与 Codex 相同的加载形状：它在将 Computer Use 视为不可用之前，在安装期间轮询 `plugin/list`。默认发现等待时间为 60 秒，可以用 `marketplaceDiscoveryTimeoutMs` 调整。如果多个已知 Codex 市场包含 Computer Use，OpenClaw 在未知的模糊匹配失败关闭之前使用 Codex 市场偏好顺序。

对于应用服务器可以添加的非默认 Codex 市场来源，使用 `marketplaceSource`；对于机器上已存在的本地市场文件，使用 `marketplacePath`。如果市场已经在 Codex 应用服务器中注册，改用 `marketplaceName`。默认值为 `pluginName: "computer-use"` 和 `mcpServerName: "computer-use"`。出于安全考虑，轮次开始自动安装仅使用应用服务器已发现的市场。对于来自配置的 `marketplaceSource` 或 `marketplacePath` 的显式安装，使用 `/codex computer-use install`。

同样的设置可以从命令界面检查或安装：

- `/codex computer-use status`
- `/codex computer-use install`
- `/codex computer-use install --source <marketplace-source>`
- `/codex computer-use install --marketplace-path <path>`

Computer Use 是 macOS 特定的，可能需要本地 OS 权限才能让 Codex MCP 服务器控制应用程序。如果 `computerUse.enabled` 为 true 且 MCP 服务器不可用，Codex 模式轮次会在线程启动前失败，而不是静默地运行而没有原生 Computer Use 工具。

## 常见配方

使用默认 stdio 传输的本地 Codex：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Codex 专用测试框架验证：

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
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Guardian 审查的 Codex 审批：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

带有显式头部的远程应用服务器：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

模型切换保持 OpenClaw 控制。当 OpenClaw Session 附加到现有 Codex 线程时，下一轮次再次将当前选择的 OpenAI 模型、Provider、审批策略、沙盒和服务层发送给应用服务器。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 保持线程绑定，但要求 Codex 继续使用新选择的模型。

## Codex 命令

捆绑的 Plugin 将 `/codex` 注册为授权的斜杠命令。它是通用的，在支持 OpenClaw 文本命令的任何 Channel 上都有效。

常见形式：

- `/codex status` 显示实时应用服务器连接性、模型、账户、速率限制、MCP 服务器和 Skill。
- `/codex models` 列出实时 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw Session 附加到现有 Codex 线程。
- `/codex compact` 要求 Codex 应用服务器压缩附加的线程。
- `/codex review` 启动附加线程的 Codex 原生审查。
- `/codex computer-use status` 检查配置的 Computer Use Plugin 和 MCP 服务器。
- `/codex computer-use install` 安装配置的 Computer Use Plugin 并重新加载 MCP 服务器。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器 Skill。

`/codex resume` 写入测试框架用于正常轮次的相同伴随绑定文件。在下一条消息时，OpenClaw 恢复该 Codex 线程，将当前选择的 OpenClaw 模型传递给应用服务器，并保持扩展历史记录启用。

命令界面需要 Codex 应用服务器 `0.125.0` 或更新版本。如果未来或自定义应用服务器不公开该 JSON-RPC 方法，单个控制方法将报告为 `unsupported by this Codex app-server`。

## Hook 边界

Codex 测试框架有三个 Hook 层：

| 层                                   | 所有者              | 目的                                                           |
| ------------------------------------- | ------------------- | -------------------------------------------------------------- |
| OpenClaw Plugin Hook                  | OpenClaw            | 跨 PI 和 Codex 测试框架的产品/Plugin 兼容性。                  |
| Codex 应用服务器扩展中间件            | OpenClaw 捆绑 Plugin | 围绕 OpenClaw 动态工具的每轮适配器行为。                       |
| Codex 原生 Hook                       | Codex               | Codex 生命周期和来自 Codex 配置的原生工具策略。                |

OpenClaw 不使用项目或全局 Codex `hooks.json` 文件来路由 OpenClaw Plugin 行为。对于支持的原生工具和权限桥，OpenClaw 为 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入每个线程的 Codex 配置。其他 Codex Hook（如 `SessionStart` 和 `UserPromptSubmit`）仍然是 Codex 级别的控制；它们在 v1 合同中不作为 OpenClaw Plugin Hook 暴露。

对于 OpenClaw 动态工具，OpenClaw 在 Codex 请求调用后执行工具，因此 OpenClaw 在测试框架适配器中触发它拥有的 Plugin 和中间件行为。对于 Codex 原生工具，Codex 拥有规范的工具记录。OpenClaw 可以镜像选定的事件，但无法重写原生 Codex 线程，除非 Codex 通过应用服务器或原生 Hook 回调暴露该操作。

压缩和 LLM 生命周期投影来自 Codex 应用服务器通知和 OpenClaw 适配器状态，而不是原生 Codex Hook 命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是适配器级别的观察，不是 Codex 内部请求或压缩有效载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` 应用服务器通知被投影为 `codex_app_server.hook` Agent 事件，用于轨迹和调试。它们不调用 OpenClaw Plugin Hook。

## V1 支持合同

Codex 模式不是带不同模型调用的 PI。Codex 拥有更多的原生模型循环，OpenClaw 围绕该边界调整其 Plugin 和 Session 界面。

Codex 运行时 v1 中支持的内容：

| 界面                                          | 支持                                    | 原因                                                                                                                                                          |
| --------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环                 | 支持                                    | Codex 应用服务器拥有 OpenAI 轮次、原生线程恢复和原生工具继续。                                                                                                |
| OpenClaw Channel 路由和投递                   | 支持                                    | Telegram、Discord、Slack、WhatsApp、iMessage 和其他 Channel 保持在模型运行时之外。                                                                            |
| OpenClaw 动态工具                             | 支持                                    | Codex 要求 OpenClaw 执行这些工具，所以 OpenClaw 保持在执行路径中。                                                                                            |
| Prompt 和上下文 Plugin                        | 支持                                    | OpenClaw 在启动或恢复线程之前构建 Prompt 覆盖并将上下文投影到 Codex 轮次中。                                                                                  |
| Context Engine 生命周期                       | 支持                                    | 组装、摄取或轮次后维护，以及 Context Engine 压缩协调为 Codex 轮次运行。                                                                                       |
| 动态工具 Hook                                 | 支持                                    | `before_tool_call`、`after_tool_call` 和工具结果中间件围绕 OpenClaw 拥有的动态工具运行。                                                                      |
| 生命周期 Hook                                 | 作为适配器观察支持                      | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 以诚实的 Codex 模式有效载荷触发。                                           |
| 最终答案修订门                                | 通过原生 Hook 中继支持                  | Codex `Stop` 被中继到 `before_agent_finalize`；`revise` 在最终化之前要求 Codex 进行一次额外的模型传递。                                                       |
| 原生 shell、patch 和 MCP 阻止或观察           | 通过原生 Hook 中继支持                  | Codex `PreToolUse` 和 `PostToolUse` 被中继用于已提交的原生工具界面，包括 Codex 应用服务器 `0.125.0` 或更新版本上的 MCP 有效载荷。支持阻止；不支持参数重写。   |
| 原生权限策略                                  | 通过原生 Hook 中继支持                  | 在运行时暴露的情况下，Codex `PermissionRequest` 可以通过 OpenClaw 策略路由。如果 OpenClaw 不返回决策，Codex 通过其正常的 guardian 或用户审批路径继续。         |
| 应用服务器轨迹捕获                            | 支持                                    | OpenClaw 记录它发送给应用服务器的请求以及它接收到的应用服务器通知。                                                                                           |

Codex 运行时 v1 中不支持的内容：

| 界面                                              | V1 边界                                                                                                          | 未来路径                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 原生工具参数变更                                  | Codex 原生预工具 Hook 可以阻止，但 OpenClaw 不重写 Codex 原生工具参数。                                          | 需要 Codex Hook/模式支持替换工具输入。                                              |
| 可编辑的 Codex 原生转录历史                       | Codex 拥有规范的原生线程历史。OpenClaw 拥有镜像并可以投影未来的上下文，但不应变更不支持的内部结构。             | 如果需要原生线程手术，添加显式 Codex 应用服务器 API。                               |
| Codex 原生工具记录的 `tool_result_persist`        | 该 Hook 转换 OpenClaw 拥有的转录写入，而不是 Codex 原生工具记录。                                               | 可以镜像转换的记录，但规范重写需要 Codex 支持。                                     |
| 丰富的原生压缩元数据                              | OpenClaw 观察压缩开始和完成，但不接收稳定的保留/丢弃列表、令牌增量或摘要有效载荷。                              | 需要更丰富的 Codex 压缩事件。                                                       |
| 压缩干预                                          | 当前 OpenClaw 压缩 Hook 在 Codex 模式下是通知级别的。                                                           | 如果 Plugin 需要否决或重写原生压缩，添加 Codex 压缩前/后 Hook。                     |
| 逐字节模型 API 请求捕获                           | OpenClaw 可以捕获应用服务器请求和通知，但 Codex 核心在内部构建最终的 OpenAI API 请求。                          | 需要 Codex 模型请求跟踪事件或调试 API。                                             |

## 工具、媒体和压缩

Codex 测试框架只更改低级嵌入式 Agent 执行器。

OpenClaw 仍然构建工具列表并从测试框架接收动态工具结果。文本、图像、视频、音乐、TTS、审批和消息工具输出继续通过正常的 OpenClaw 投递路径。

原生 Hook 中继在本质上是通用的，但 v1 支持合同仅限于 OpenClaw 测试的 Codex 原生工具和权限路径。在 Codex 运行时中，这包括 shell、patch 和 MCP `PreToolUse`、`PostToolUse` 和 `PermissionRequest` 有效载荷。在运行时合同命名之前，不要假设每个未来的 Codex Hook 事件都是 OpenClaw Plugin 界面。

对于 `PermissionRequest`，OpenClaw 仅在策略决定时返回显式允许或拒绝决策。无决策结果不是允许。Codex 将其视为无 Hook 决策，并通过其自身的 guardian 或用户审批路径继续。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP 工具审批请求通过 OpenClaw 的 Plugin 审批流程路由。Codex `request_user_input` 提示被发回给发起聊天，下一个排队的后续消息回答该原生服务器请求，而不是作为额外上下文被引导。其他 MCP 请求仍然失败关闭。

当选定的模型使用 Codex 测试框架时，原生线程压缩委托给 Codex 应用服务器。OpenClaw 保留用于 Channel 历史、搜索、`/new`、`/reset` 以及未来模型或测试框架切换的转录镜像。镜像包括用户提示、最终助手文本，以及应用服务器发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它尚未暴露人类可读的压缩摘要或 Codex 压缩后保留了哪些条目的可审计列表。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 目前不重写 Codex 原生工具结果记录。它仅在 OpenClaw 写入 OpenClaw 拥有的 Session 转录工具结果时适用。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解继续使用匹配的 Provider/模型设置，如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 未出现为正常的 `/model` Provider：** 这对新配置是预期的。使用 `agentRuntime.id: "codex"` 选择 `openai/gpt-*` 模型（或旧版 `codex/*` 引用），启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** `agentRuntime.id: "auto"` 在没有 Codex 测试框架声明运行时仍然可以使用 PI 作为兼容性后端。在测试时设置 `agentRuntime.id: "codex"` 强制 Codex 选择。强制的 Codex 运行时现在失败而不是回退到 PI，除非您显式设置 `agentRuntime.fallback: "pi"`。一旦 Codex 应用服务器被选择，其失败会直接浮现而不需要额外的回退配置。

**应用服务器被拒绝：** 升级 Codex，使应用服务器握手报告版本 `0.125.0` 或更新版本。同版本预发布版本或带构建后缀的版本（如 `0.125.0-alpha.2` 或 `0.125.0+custom`）会被拒绝，因为稳定的 `0.125.0` 协议底线是 OpenClaw 测试的版本。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程应用服务器是否使用相同的 Codex 应用服务器协议版本。

**非 Codex 模型使用 PI：** 这是预期行为，除非您为该 Agent 强制 `agentRuntime.id: "codex"` 或选择了旧版 `codex/*` 引用。在 `auto` 模式下，普通的 `openai/gpt-*` 和其他 Provider 引用保持其正常的 Provider 路径。如果您强制 `agentRuntime.id: "codex"`，该 Agent 的每个嵌入式轮次必须是 Codex 支持的 OpenAI 模型。

## 相关

- [Agent Harness Plugin](/plugins/sdk-agent-harness)
- [Agent 运行时](/concepts/agent-runtimes)
- [模型 Provider](/concepts/model-providers)
- [OpenAI Provider](/providers/openai)
- [状态](/cli/status)
- [Plugin Hook](/plugins/hooks)
- [配置参考](/gateway/configuration-reference)
- [测试](/help/testing-live#live-codex-app-server-harness-smoke)
