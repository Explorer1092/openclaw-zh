---
mmh3_hash: "445f95a51b8c0b9e0f4be8a0c35125dc"
title: "Codex Harness"
summary: "通过捆绑的 Codex 应用服务器测试框架运行 OpenClaw 嵌入式 Agent 轮次"
read_when:
  - 您想使用捆绑的 Codex 应用服务器测试框架
  - 您需要 Codex 模型引用和配置示例
  - 您想为仅 Codex 部署禁用 PI 回退
---

# Codex Harness

捆绑的 `codex` Plugin 让 OpenClaw 通过 Codex 应用服务器而不是内置 PI 测试框架运行嵌入式 Agent 轮次。

当您希望 Codex 拥有低级 Agent Session 时使用此功能：模型发现、原生线程恢复、原生压缩和应用服务器执行。OpenClaw 仍然拥有聊天 Channel、Session 文件、模型选择、工具、审批、媒体投递和可见的转录镜像。

测试框架默认关闭。只有当 `codex` Plugin 启用且解析的模型是 `codex/*` 模型时，或者当您显式强制 `embeddedHarness.runtime: "codex"` 或 `OPENCLAW_AGENT_RUNTIME=codex` 时，才会选择它。如果您从不配置 `codex/*`，现有的 PI、OpenAI、Anthropic、Gemini、本地和自定义 Provider 运行将保持其当前行为。

## 选择正确的模型前缀

OpenClaw 有单独的 OpenAI 和 Codex 形状访问路由：

| 模型引用               | 运行时路径                                    | 使用时机                                                              |
| ---------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| `openai/gpt-5.4`       | 通过 OpenClaw/PI 管道的 OpenAI Provider       | 您想通过 `OPENAI_API_KEY` 直接访问 OpenAI Platform API。              |
| `openai-codex/gpt-5.4` | 通过 PI 的 OpenAI Codex OAuth Provider        | 您想使用 ChatGPT/Codex OAuth 而不使用 Codex 应用服务器测试框架。      |
| `codex/gpt-5.4`        | 捆绑的 Codex Provider 加上 Codex 测试框架     | 您想要本地 Codex 应用服务器执行嵌入式 Agent 轮次。                   |

Codex 测试框架只声明 `codex/*` 模型引用。现有的 `openai/*`、`openai-codex/*`、Anthropic、Gemini、xAI、本地和自定义 Provider 引用保持其正常路径。

## 要求

- 带有捆绑 `codex` Plugin 的 OpenClaw。
- Codex 应用服务器 `0.118.0` 或更新版本。
- 应用服务器进程可用的 Codex 认证。

Plugin 阻止旧版或未版本化的应用服务器握手。这使 OpenClaw 保持在已测试的协议接口上。

对于实时和 Docker 冒烟测试，认证通常来自 `OPENAI_API_KEY`，加上可选的 Codex CLI 文件，如 `~/.codex/auth.json` 和 `~/.codex/config.toml`。使用与本地 Codex 应用服务器相同的认证材料。

## 最小配置

使用 `codex/gpt-5.4`，启用捆绑 Plugin，并强制 `codex` 测试框架：

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
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
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

将 `agents.defaults.model` 或 Agent 模型设置为 `codex/<model>` 也会自动启用捆绑的 `codex` Plugin。显式 Plugin 条目在共享配置中仍然有用，因为它使部署意图明确。

## 在不替换其他模型的情况下添加 Codex

当您希望 `codex/*` 模型使用 Codex，其他所有模型使用 PI 时，保持 `runtime: "auto"`：

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
      model: {
        primary: "codex/gpt-5.4",
        fallbacks: ["openai/gpt-5.4", "anthropic/claude-opus-4-6"],
      },
      models: {
        "codex/gpt-5.4": { alias: "codex" },
        "codex/gpt-5.4-mini": { alias: "codex-mini" },
        "openai/gpt-5.4": { alias: "gpt" },
        "anthropic/claude-opus-4-6": { alias: "opus" },
      },
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
  },
}
```

使用此形状：

- `/model codex` 或 `/model codex/gpt-5.4` 使用 Codex 应用服务器测试框架。
- `/model gpt` 或 `/model openai/gpt-5.4` 使用 OpenAI Provider 路径。
- `/model opus` 使用 Anthropic Provider 路径。
- 如果选择非 Codex 模型，PI 仍然是兼容性测试框架。

## 仅 Codex 部署

当您需要证明每个嵌入式 Agent 轮次都使用 Codex 测试框架时，禁用 PI 回退：

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

环境覆盖：

```bash
OPENCLAW_AGENT_RUNTIME=codex \
OPENCLAW_AGENT_HARNESS_FALLBACK=none \
openclaw gateway run
```

禁用回退后，如果 Codex Plugin 被禁用、请求的模型不是 `codex/*` 引用、应用服务器太旧或应用服务器无法启动，OpenClaw 会提前失败。

## 每个 Agent 的 Codex

您可以让一个 Agent 仅使用 Codex，而默认 Agent 保持正常自动选择：

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
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
        model: "codex/gpt-5.4",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

使用正常的 Session 命令切换 Agent 和模型。`/new` 创建新的 OpenClaw Session，Codex 测试框架根据需要创建或恢复其伴随的应用服务器线程。`/reset` 清除该线程的 OpenClaw Session 绑定。

## 模型发现

默认情况下，Codex Plugin 向应用服务器请求可用模型。如果发现失败或超时，它使用捆绑的回退目录：

- `codex/gpt-5.4`
- `codex/gpt-5.4-mini`
- `codex/gpt-5.2`

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

默认情况下，Plugin 使用以下命令在本地启动 Codex：

```bash
codex app-server --listen stdio://
```

您可以保留该默认值并只调整 Codex 原生策略：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            sandbox: "workspace-write",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

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

| 字段                | 默认值                                   | 含义                                                             |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` 生成 Codex；`"websocket"` 连接到 `url`。              |
| `command`           | `"codex"`                                | stdio 传输的可执行文件。                                         |
| `args`              | `["app-server", "--listen", "stdio://"]` | stdio 传输的参数。                                               |
| `url`               | 未设置                                   | WebSocket 应用服务器 URL。                                       |
| `authToken`         | 未设置                                   | WebSocket 传输的 Bearer token。                                  |
| `headers`           | `{}`                                     | 额外的 WebSocket 头部。                                          |
| `requestTimeoutMs`  | `60000`                                  | 应用服务器控制平面调用的超时。                                   |
| `approvalPolicy`    | `"never"`                                | 发送给线程启动/恢复/轮次的原生 Codex 审批策略。                  |
| `sandbox`           | `"workspace-write"`                      | 发送给线程启动/恢复的原生 Codex 沙盒模式。                       |
| `approvalsReviewer` | `"user"`                                 | 使用 `"guardian_subagent"` 让 Codex guardian 审查原生审批。     |
| `serviceTier`       | 未设置                                   | 可选的 Codex 服务层，例如 `"priority"`。                         |

在匹配的配置字段未设置时，旧版环境变量仍然作为本地测试的回退：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`
- `OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1`

对于可重现的部署，首选配置方式。

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

禁用 PI 回退的 Codex 专用测试框架验证：

```json5
{
  embeddedHarness: {
    fallback: "none",
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

guardian 审查的 Codex 审批：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            approvalPolicy: "on-request",
            approvalsReviewer: "guardian_subagent",
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

模型切换保持 OpenClaw 控制。当 OpenClaw Session 附加到现有 Codex 线程时，下一轮次再次将当前选择的 `codex/*` 模型、Provider、审批策略、沙盒和服务层发送给应用服务器。从 `codex/gpt-5.4` 切换到 `codex/gpt-5.2` 保持线程绑定，但要求 Codex 继续使用新选择的模型。

## Codex 命令

捆绑的 Plugin 将 `/codex` 注册为授权的斜杠命令。它是通用的，在支持 OpenClaw 文本命令的任何 Channel 上都有效。

常见形式：

- `/codex status` 显示实时应用服务器连接性、模型、账户、速率限制、MCP 服务器和 Skill。
- `/codex models` 列出实时 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw Session 附加到现有 Codex 线程。
- `/codex compact` 要求 Codex 应用服务器压缩附加的线程。
- `/codex review` 启动附加线程的 Codex 原生审查。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器 Skill。

`/codex resume` 写入测试框架用于正常轮次的相同伴随绑定文件。在下一条消息时，OpenClaw 恢复该 Codex 线程，将当前选择的 OpenClaw `codex/*` 模型传递给应用服务器，并保持扩展历史记录启用。

命令界面需要 Codex 应用服务器 `0.118.0` 或更新版本。如果未来或自定义应用服务器不公开该 JSON-RPC 方法，单个控制方法将报告为 `unsupported by this Codex app-server`。

## 工具、媒体和压缩

Codex 测试框架只更改低级嵌入式 Agent 执行器。

OpenClaw 仍然构建工具列表并从测试框架接收动态工具结果。文本、图像、视频、音乐、TTS、审批和消息工具输出继续通过正常的 OpenClaw 投递路径。

当选定的模型使用 Codex 测试框架时，原生线程压缩委托给 Codex 应用服务器。OpenClaw 保留用于 Channel 历史、搜索、`/new`、`/reset` 以及未来模型或测试框架切换的转录镜像。镜像包括用户提示、最终助手文本，以及应用服务器发出时的轻量级 Codex 推理或计划记录。

媒体生成不需要 PI。图像、视频、音乐、PDF、TTS 和媒体理解继续使用匹配的 Provider/模型设置，如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

## 故障排除

**Codex 未出现在 `/model` 中：** 启用 `plugins.entries.codex.enabled`，设置 `codex/*` 模型引用，或检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 回退到 PI：** 在测试时设置 `embeddedHarness.fallback: "none"` 或 `OPENCLAW_AGENT_HARNESS_FALLBACK=none`。

**应用服务器被拒绝：** 升级 Codex，使应用服务器握手报告版本 `0.118.0` 或更新版本。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`，以及远程应用服务器是否使用相同的 Codex 应用服务器协议版本。

**非 Codex 模型使用 PI：** 这是预期行为。Codex 测试框架只声明 `codex/*` 模型引用。

## 相关

- [Agent Harness Plugins](/plugins/sdk-agent-harness)
- [Model Providers](/concepts/model-providers)
- [配置参考](/gateway/configuration-reference)
- [测试](/help/testing#live-codex-app-server-harness-smoke)
