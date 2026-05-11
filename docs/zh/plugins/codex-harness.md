---
mmh3_hash: "0c65683aac90bd5bec99306c94d8d8f8"
summary: "通过捆绑的 Codex 应用服务器 harness 运行 OpenClaw 嵌入式 Agent 轮次"
title: "Codex harness"
read_when:
  - 您想使用捆绑的 Codex 应用服务器 harness
  - 您需要 Codex harness 配置示例
  - 您希望仅 Codex 部署失败而不是回退到 PI
---

捆绑的 `codex` Plugin 让 OpenClaw 通过 Codex 应用服务器而不是内置 PI harness 运行嵌入式 OpenAI Agent 轮次。

当您希望 Codex 拥有低级 Agent Session 时使用 Codex harness：原生线程恢复、原生工具继续、原生压缩和应用服务器执行。OpenClaw 仍然拥有聊天 Channel、Session 文件、模型选择、OpenClaw 动态工具、审批、媒体投递和可见的转录镜像。

正常设置使用规范的 OpenAI 模型引用，如 `openai/gpt-5.5`。不要配置 `openai-codex/gpt-*` 模型引用。`openai-codex` 是 Codex OAuth 或 Codex API 密钥配置文件的认证配置文件 Provider，而不是新 Agent 配置的模型 Provider 前缀。

OpenClaw 以 Codex 原生代码模式和仅代码模式启动 Codex 应用服务器线程。这使可推迟/可搜索的 OpenClaw 动态工具保留在 Codex 自己的代码执行和工具搜索界面中，而不是在 Codex 之上添加 PI 风格的工具搜索包装器。

有关更广泛的模型/Provider/运行时划分，请从 [Agent 运行时](/concepts/agent-runtimes) 开始。简而言之：`openai/gpt-5.5` 是模型引用，`codex` 是运行时，Telegram、Discord、Slack 或其他 Channel 仍然是通信界面。

## 要求

- 带有捆绑 `codex` Plugin 的 OpenClaw。
- 如果您的配置使用 `plugins.allow`，请包含 `codex`。
- Codex 应用服务器 `0.125.0` 或更新版本。捆绑的 Plugin 默认管理兼容的 Codex 应用服务器二进制文件，因此 `PATH` 上的本地 `codex` 命令不影响正常的 harness 启动。
- 通过 `openclaw models auth login --provider openai-codex`、Agent 的 Codex home 中的应用服务器账户或显式的 Codex API 密钥认证配置文件提供 Codex 认证。

有关认证优先级、环境隔离、自定义应用服务器命令、模型发现和所有配置字段，请参见 [Codex harness 参考](/plugins/codex-harness-reference)。

## 快速开始

大多数希望在 OpenClaw 中使用 Codex 的用户选择此路径：使用 ChatGPT/Codex 订阅登录，启用捆绑的 `codex` Plugin，并使用规范的 `openai/gpt-*` 模型引用。

使用 Codex OAuth 登录：

```bash
openclaw models auth login --provider openai-codex
```

启用捆绑的 `codex` Plugin 并选择 OpenAI Agent 模型：

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
    },
  },
}
```

如果您的配置使用 `plugins.allow`，也在那里添加 `codex`：

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

更改 Plugin 配置后重启 Gateway。如果现有聊天已经有 Session，在测试运行时更改之前使用 `/new` 或 `/reset`，以便下一个轮次从当前配置解析 harness。

## 配置

快速开始配置是最小可行的 Codex harness 配置。在 OpenClaw 配置中设置 Codex harness 选项，仅将 CLI 用于 Codex 认证：

| 需求                              | 设置                                                               | 位置                      |
| --------------------------------- | ------------------------------------------------------------------ | ------------------------- |
| 启用 harness                      | `plugins.entries.codex.enabled: true`                              | OpenClaw 配置             |
| 保留允许列表 Plugin 安装          | 在 `plugins.allow` 中包含 `codex`                                  | OpenClaw 配置             |
| 通过 Codex 路由 OpenAI Agent 轮次 | `agents.defaults.model` 或 `agents.list[].model` 为 `openai/gpt-*` | OpenClaw Agent 配置       |
| 使用 Codex OAuth 登录             | `openclaw models auth login --provider openai-codex`               | CLI 认证配置文件          |
| Codex 不可用时失败关闭            | Provider 或模型 `agentRuntime.id: "codex"`                         | OpenClaw 模型/Provider 配置 |
| 使用直接 OpenAI API 流量          | Provider 或模型 `agentRuntime.id: "pi"` 加普通 OpenAI 认证         | OpenClaw 模型/Provider 配置 |
| 调整应用服务器行为                | `plugins.entries.codex.config.appServer.*`                         | Codex Plugin 配置         |
| 启用原生 Codex Plugin 应用        | `plugins.entries.codex.config.codexPlugins.*`                      | Codex Plugin 配置         |
| 启用 Codex Computer Use           | `plugins.entries.codex.config.computerUse.*`                       | Codex Plugin 配置         |

对 Codex 支持的 OpenAI Agent 轮次使用 `openai/gpt-*` 模型引用。`openai-codex` 仅是 Codex OAuth 和 Codex API 密钥配置文件的认证配置文件 Provider 名称。不要编写新的 `openai-codex/gpt-*` 模型引用。

本页其余部分涵盖用户必须在其中选择的常见变体：部署形状、失败关闭路由、guardian 审批策略、原生 Codex Plugin 和 Computer Use。有关完整选项列表、默认值、枚举、发现、环境隔离、超时和应用服务器传输字段，请参见 [Codex harness 参考](/plugins/codex-harness-reference)。

## 验证 Codex 运行时

在您期望 Codex 的聊天中使用 `/status`。Codex 支持的 OpenAI Agent 轮次显示：

```text
Runtime: OpenAI Codex
```

然后检查 Codex 应用服务器状态：

```text
/codex status
/codex models
```

`/codex status` 报告应用服务器连接性、账户、速率限制、MCP 服务器和 Skill。`/codex models` 列出 harness 和账户的实时 Codex 应用服务器目录。如果 `/status` 令人意外，请参见[故障排除](#故障排除)。

## 路由和模型选择

保持 Provider 引用和运行时策略分离：

- 对通过 Codex 的 OpenAI Agent 轮次使用 `openai/gpt-*`。
- 不要在配置中使用 `openai-codex/gpt-*`。运行 `openclaw doctor --fix` 修复旧版引用和过时的 Session 路由固定。
- `agentRuntime.id: "codex"` 对于正常的 OpenAI 自动模式是可选的，但在部署应该在 Codex 不可用时失败关闭时很有用。
- `agentRuntime.id: "pi"` 在有意时将 Provider 或模型选择加入直接 PI 行为。
- `/codex ...` 从聊天控制原生 Codex 应用服务器对话。
- ACP/acpx 是一个独立的外部 harness 路径。仅在用户请求 ACP/acpx 或外部 harness 适配器时使用它。

常见命令路由：

| 用户意图                        | 使用                                      |
| ------------------------------- | ----------------------------------------- |
| 附加当前聊天                    | `/codex bind [--cwd <path>]`              |
| 恢复现有 Codex 线程             | `/codex resume <thread-id>`               |
| 列出或筛选 Codex 线程           | `/codex threads [filter]`                 |
| 仅发送 Codex 反馈               | `/codex diagnostics [note]`               |
| 启动 ACP/acpx 任务              | ACP/acpx Session 命令，不是 `/codex`      |

| 使用场景                                           | 配置                                                             | 验证                                    | 说明                               |
| -------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| 带原生 Codex 运行时的 ChatGPT/Codex 订阅           | `openai/gpt-*` 加已启用的 `codex` Plugin                         | `/status` 显示 `Runtime: OpenAI Codex`  | 推荐路径                           |
| Codex 不可用时失败关闭                             | Provider 或模型 `agentRuntime.id: "codex"`                       | 轮次失败而不是 PI 回退                  | 用于仅 Codex 部署                  |
| 通过 PI 的直接 OpenAI API 密钥流量                 | Provider 或模型 `agentRuntime.id: "pi"` 加普通 OpenAI 认证       | `/status` 显示 PI 运行时                | 仅在 PI 是有意时使用               |
| 旧版配置                                           | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` 重写它          | 不要以这种方式编写新配置           |
| ACP/acpx Codex 适配器                              | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP 任务/Session 状态                   | 独立于原生 Codex harness           |

`agents.defaults.imageModel` 遵循相同的前缀划分。对正常的 OpenAI 路由使用 `openai/gpt-*`，仅在图像理解应通过有限的 Codex 应用服务器轮次运行时使用 `codex/gpt-*`。不要使用 `openai-codex/gpt-*`；doctor 将该旧版前缀重写为 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

当所有 OpenAI Agent 轮次都应默认使用 Codex 时，使用快速开始配置。

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
    },
  },
}
```

### 混合 Provider 部署

此形状将 Claude 保持为默认 Agent 并添加一个命名的 Codex Agent：

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
      model: "anthropic/claude-opus-4-6",
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
      },
    ],
  },
}
```

使用此配置，`main` Agent 使用其正常的 Provider 路径，`codex` Agent 使用 Codex 应用服务器。

### 失败关闭 Codex 部署

对于 OpenAI Agent 轮次，`openai/gpt-*` 在捆绑 Plugin 可用时已经解析为 Codex。当您需要写入的失败关闭规则时，添加显式运行时策略：

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: {
          id: "codex",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
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

强制 Codex 后，如果 Codex Plugin 被禁用、应用服务器太旧或应用服务器无法启动，OpenClaw 会提前失败。

## 应用服务器策略

默认情况下，Plugin 使用 stdio 传输在本地启动 OpenClaw 管理的 Codex 二进制文件。仅在您有意运行不同的可执行文件时才设置 `appServer.command`。仅在应用服务器已在其他地方运行时才使用 WebSocket 传输：

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
            authToken: "${CODEX_APP_SERVER_TOKEN}",
          },
        },
      },
    },
  },
}
```

本地 stdio 应用服务器 Session 默认采用受信任的本地操作员姿态：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和 `sandbox: "danger-full-access"`。如果本地 Codex 要求不允许该隐式 YOLO 姿态，OpenClaw 改为选择允许的 guardian 权限。

当您希望在沙盒逃逸或额外权限之前进行 Codex 原生自动审查时，使用 guardian 模式：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "priority",
          },
        },
      },
    },
  },
}
```

Guardian 模式扩展为 Codex 应用服务器审批，通常在本地要求允许时为 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。

有关每个应用服务器字段、认证顺序、环境隔离、发现和超时行为，请参见 [Codex harness 参考](/plugins/codex-harness-reference)。

## 命令和诊断

捆绑的 Plugin 将 `/codex` 注册为支持 OpenClaw 文本命令的任何 Channel 上的斜杠命令。

常见形式：

- `/codex status` 检查应用服务器连接性、模型、账户、速率限制、MCP 服务器和 Skill。
- `/codex models` 列出实时 Codex 应用服务器模型。
- `/codex threads [filter]` 列出最近的 Codex 应用服务器线程。
- `/codex resume <thread-id>` 将当前 OpenClaw Session 附加到现有 Codex 线程。
- `/codex compact` 要求 Codex 应用服务器压缩附加的线程。
- `/codex review` 为附加的线程启动 Codex 原生审查。
- `/codex diagnostics [note]` 在要求之前，要求对附加线程发送 Codex 反馈。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex 应用服务器 MCP 服务器状态。
- `/codex skills` 列出 Codex 应用服务器 Skill。

对于大多数支持报告，请从发生错误的对话中的 `/diagnostics [note]` 开始。它创建一个 Gateway 诊断报告，对于 Codex harness Session，会要求批准发送相关的 Codex 反馈包。有关隐私模型和群聊行为，请参见[诊断导出](/gateway/diagnostics)。

仅在您特别想要当前附加线程的 Codex 反馈上传而不需要完整 Gateway 诊断包时，才使用 `/codex diagnostics [note]`。

### 本地检查 Codex 线程

检查不良 Codex 运行的最快方式通常是直接打开原生 Codex 线程：

```bash
codex resume <thread-id>
```

从完成的 `/diagnostics` 回复、`/codex binding` 或 `/codex threads [filter]` 获取线程 id。

有关上传机制和运行时级诊断边界，请参见 [Codex harness 运行时](/plugins/codex-harness-runtime#codex-feedback-upload)。

认证按此顺序选择：

1. Agent 的显式 OpenClaw Codex 认证配置文件。
2. 该 Agent 的 Codex home 中应用服务器的现有账户。
3. 仅对本地 stdio 应用服务器启动，当没有应用服务器账户且仍需要 OpenAI 认证时，使用 `CODEX_API_KEY`，然后是 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅风格的 Codex 认证配置文件时，它从生成的 Codex 子进程中删除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这使 Gateway 级 API 密钥可用于嵌入或直接 OpenAI 模型，而不会意外地通过 API 计费原生 Codex 应用服务器轮次。显式 Codex API 密钥配置文件和本地 stdio 环境密钥回退使用应用服务器登录，而不是继承的子进程环境。WebSocket 应用服务器连接不接收 Gateway 环境 API 密钥回退；使用显式认证配置文件或远程应用服务器自己的账户。

如果部署需要额外的环境隔离，请将这些变量添加到 `appServer.clearEnv`：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            clearEnv: ["CODEX_API_KEY", "OPENAI_API_KEY"],
          },
        },
      },
    },
  },
}
```

`appServer.clearEnv` 仅影响生成的 Codex 应用服务器子进程。

Codex 动态工具默认为 `searchable` 加载。OpenClaw 不暴露重复 Codex 原生工作区操作的动态工具：`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。剩余的 OpenClaw 集成工具（如消息传递、Session、媒体、cron、浏览器、节点、Gateway、`heartbeat_respond` 和 `web_search`）通过 Codex 工具搜索在 `openclaw` 命名空间下可用，使初始模型上下文更小。`sessions_yield` 和仅消息工具源回复保持直接，因为这些是轮次控制契约。心跳协作指令告诉 Codex 在结束心跳轮次时（如果工具尚未加载）搜索 `heartbeat_respond`。

仅在连接到无法搜索推迟的动态工具的自定义 Codex 应用服务器时，或在调试完整工具负载时，才设置 `codexDynamicToolsLoading: "direct"`。

支持的顶级 Codex Plugin 字段：

| 字段                         | 默认值           | 含义                                                                                   |
| ---------------------------- | ---------------- | -------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading`   | `"searchable"`   | 使用 `"direct"` 将 OpenClaw 动态工具直接放入初始 Codex 工具上下文中。                 |
| `codexDynamicToolsExclude`   | `[]`             | 要从 Codex 应用服务器轮次中省略的额外 OpenClaw 动态工具名称。                         |
| `codexPlugins`               | 禁用             | 为迁移的源安装精选 Plugin 提供原生 Codex Plugin/应用支持。                             |

支持的 `appServer` 字段：

| 字段                            | 默认值                                                 | 含义                                                                                                                                                                                                                                   |
| ------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                     | `"stdio"`                                              | `"stdio"` 生成 Codex；`"websocket"` 连接到 `url`。                                                                                                                                                                                     |
| `command`                       | 管理的 Codex 二进制文件                                | stdio 传输的可执行文件。保持未设置以使用管理的二进制文件；仅在显式覆盖时设置。                                                                                                                                                         |
| `args`                          | `["app-server", "--listen", "stdio://"]`               | stdio 传输的参数。                                                                                                                                                                                                                     |
| `url`                           | 未设置                                                 | WebSocket 应用服务器 URL。                                                                                                                                                                                                             |
| `authToken`                     | 未设置                                                 | WebSocket 传输的 Bearer token。                                                                                                                                                                                                        |
| `headers`                       | `{}`                                                   | 额外的 WebSocket 头部。                                                                                                                                                                                                                |
| `clearEnv`                      | `[]`                                                   | OpenClaw 构建其继承的环境后，从生成的 stdio 应用服务器进程中删除的额外环境变量名称。`CODEX_HOME` 和 `HOME` 保留用于 OpenClaw 在本地启动时的每 Agent Codex 隔离。                                                                       |
| `requestTimeoutMs`              | `60000`                                                | 应用服务器控制平面调用的超时。                                                                                                                                                                                                         |
| `turnCompletionIdleTimeoutMs`   | `60000`                                                | OpenClaw 等待 `turn/completed` 时，轮次范围的 Codex 应用服务器请求响应后的静默窗口。对于缓慢的工具后合成或仅状态合成阶段，请提高此值。                                                                                                  |
| `mode`                          | `"yolo"` 除非本地 Codex 要求不允许 YOLO               | YOLO 或 guardian 审查执行的预设。省略 `danger-full-access`、`never` 审批或 `user` 审阅者的本地 stdio 要求会使隐式默认值为 guardian。                                                                                                   |
| `approvalPolicy`                | `"never"` 或允许的 guardian 审批策略                   | 发送给线程启动/恢复/轮次的原生 Codex 审批策略。Guardian 默认偏好在允许时使用 `"on-request"`。                                                                                                                                          |
| `sandbox`                       | `"danger-full-access"` 或允许的 guardian 沙盒          | 发送给线程启动/恢复的原生 Codex 沙盒模式。Guardian 默认在允许时偏好 `"workspace-write"`，否则偏好 `"read-only"`。                                                                                                                      |
| `approvalsReviewer`             | `"user"` 或允许的 guardian 审阅者                      | 使用 `"auto_review"` 让 Codex 在允许时审查原生审批提示，否则使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍然是旧版别名。                                                                                                   |
| `serviceTier`                   | 未设置                                                 | 可选的 Codex 应用服务器服务层。`"priority"` 启用快速模式路由，`"flex"` 请求弹性处理，`null` 清除覆盖，旧版 `"fast"` 被接受为 `"priority"`。                                                                                            |

OpenClaw 拥有的动态工具调用独立于 `appServer.requestTimeoutMs` 进行约束：Codex `item/tool/call` 请求默认使用 30 秒的 OpenClaw 看门狗。正数的每调用 `timeoutMs` 参数延长或缩短该特定工具预算。`image_generate` 工具在工具调用不提供自己的超时时也使用 `agents.defaults.imageGenerationModel.timeoutMs`，媒体理解 `image` 工具使用 `tools.media.image.timeoutSeconds` 或其 60 秒媒体默认值。动态工具预算上限为 600000 毫秒。超时时，OpenClaw 在支持的地方中止工具信号，并向 Codex 返回失败的动态工具响应，以便轮次可以继续而不是让 Session 停留在 `processing` 状态。

OpenClaw 响应 Codex 轮次范围的应用服务器请求后，harness 还期望 Codex 用 `turn/completed` 完成原生轮次。如果应用服务器在该响应后 `appServer.turnCompletionIdleTimeoutMs` 时间内静默，OpenClaw 尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw Session 通道，以便后续聊天消息不会排队在过时的原生轮次后面。同一轮次的任何非终端通知（包括 `rawResponseItem/completed`）都会解除该短看门狗，因为 Codex 已证明轮次仍然存活；较长的终端看门狗继续保护真正卡住的轮次。超时诊断包括最后一个应用服务器通知方法，对于原始助手响应条目，还包括条目类型、角色、id 和有界的助手文本预览。

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_BIN` 在 `appServer.command` 未设置时绕过管理的二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被移除。改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 进行一次性本地测试。配置是可重复部署的首选，因为它将 Plugin 行为保留在与其余 Codex harness 设置相同的已审查文件中。

## 原生 Codex Plugin

原生 Codex Plugin 支持在与 OpenClaw harness 轮次相同的 Codex 线程中使用 Codex 应用服务器自己的应用和 Plugin 能力。OpenClaw 不会将 Codex Plugin 转换为合成的 `codex_plugin_*` OpenClaw 动态工具。

`codexPlugins` 仅影响选择原生 Codex harness 的 Session。它对 PI 运行、普通 OpenAI Provider 运行、ACP 对话绑定或其他 harness 没有影响。

最小迁移配置：

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          codexPlugins: {
            enabled: true,
            allow_destructive_actions: false,
            plugins: {
              "google-calendar": {
                enabled: true,
                marketplaceName: "openai-curated",
                pluginName: "google-calendar",
              },
            },
          },
        },
      },
    },
  },
}
```

线程应用配置在 OpenClaw 建立 Codex harness Session 或替换过时的 Codex 线程绑定时计算。它不会在每个轮次重新计算。更改 `codexPlugins` 后，使用 `/new`、`/reset` 或重启 Gateway，以便未来的 Codex harness Session 以更新的应用集启动。

有关迁移资格、应用清单、破坏性操作策略、引导和原生 Plugin 诊断，请参见[原生 Codex Plugin](/plugins/codex-native-plugins)。

## Computer Use

Computer Use 在其自己的设置指南中介绍：[Codex Computer Use](/plugins/codex-computer-use)。

简而言之：OpenClaw 不提供桌面控制应用或自己执行桌面操作。它准备 Codex 应用服务器，验证 `computer-use` MCP 服务器是否可用，然后让 Codex 在 Codex 模式轮次期间拥有原生 MCP 工具调用。

## 运行时边界

Codex harness 仅更改低级嵌入式 Agent 执行器。

- OpenClaw 动态工具受支持。Codex 要求 OpenClaw 执行这些工具，因此 OpenClaw 保持在执行路径中。
- Codex 原生 shell、patch、MCP 和原生应用工具由 Codex 拥有。OpenClaw 可以通过支持的中继观察或阻止选定的原生事件，但不重写原生工具参数。
- Codex 拥有原生压缩。OpenClaw 为 Channel 历史、搜索、`/new`、`/reset` 和未来的模型或 harness 切换保留转录镜像。
- 媒体生成、媒体理解、TTS、审批和消息工具输出继续通过匹配的 OpenClaw Provider/模型设置。
- `tool_result_persist` 适用于 OpenClaw 拥有的转录工具结果，而不是 Codex 原生工具结果记录。

有关 Hook 层、支持的 V1 界面、原生权限处理、队列引导、Codex 反馈上传机制和压缩详情，请参见 [Codex harness 运行时](/plugins/codex-harness-runtime)。

## 故障排除

**Codex 未显示为正常的 `/model` Provider：** 这对新配置是预期的。选择 `openai/gpt-*` 模型，启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 确保模型引用是官方 OpenAI Provider 上的 `openai/gpt-*`，且 Codex Plugin 已安装并启用。如果您需要在测试时进行严格证明，请设置 Provider 或模型 `agentRuntime.id: "codex"`。强制的 Codex 运行时会失败而不是回退到 PI。

**旧版 `openai-codex/*` 配置仍然存在：** 运行 `openclaw doctor --fix`。Doctor 将旧版模型引用重写为 `openai/*`，删除过时的 Session 和整个 Agent 运行时固定，并保留现有的认证配置文件覆盖。

**应用服务器被拒绝：** 使用 Codex 应用服务器 `0.125.0` 或更新版本。同版本预发布版本或带构建后缀的版本（如 `0.125.0-alpha.2` 或 `0.125.0+custom`）会被拒绝，因为 OpenClaw 测试稳定的 `0.125.0` 协议底线。

**`/codex status` 无法连接：** 检查捆绑的 `codex` Plugin 是否已启用，当配置了允许列表时 `plugins.allow` 是否包含它，以及任何自定义的 `appServer.command`、`url`、`authToken` 或头部是否有效。

**模型发现很慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。请参见 [Codex harness 参考](/plugins/codex-harness-reference#model-discovery)。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`、头部，以及远程应用服务器是否使用相同的 Codex 应用服务器协议版本。

**非 Codex 模型使用 PI：** 这是预期的，除非 Provider 或模型运行时策略将其路由到另一个 harness。在 `auto` 模式下，普通的非 OpenAI Provider 引用保持其正常的 Provider 路径。

**Computer Use 已安装但工具不运行：** 从新 Session 检查 `/codex computer-use status`。如果工具报告 `Native hook relay unavailable`，使用 `/new` 或 `/reset`；如果持续，重启 Gateway 以清除过时的原生 Hook 注册。请参见 [Codex Computer Use](/plugins/codex-computer-use#troubleshooting)。

## 相关

- [Codex harness 参考](/plugins/codex-harness-reference)
- [Codex harness 运行时](/plugins/codex-harness-runtime)
- [原生 Codex Plugin](/plugins/codex-native-plugins)
- [Codex Computer Use](/plugins/codex-computer-use)
- [Agent 运行时](/concepts/agent-runtimes)
- [模型 Provider](/concepts/model-providers)
- [OpenAI Provider](/providers/openai)
- [Agent harness Plugin](/plugins/sdk-agent-harness)
- [Plugin Hook](/plugins/hooks)
- [诊断导出](/gateway/diagnostics)
- [状态](/cli/status)
- [测试](/help/testing-live#live-codex-app-server-harness-smoke)
