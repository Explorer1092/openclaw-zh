---
mmh3_hash: "c6fa6ebd318fbda49ae6870d2861a558"
summary: "通过捆绑的 Codex app-server Harness 运行 OpenClaw 嵌入式 Agent 轮次"
title: "Codex Harness"
read_when:
  - 您想使用捆绑的 Codex app-server Harness
  - 您需要 Codex Harness 配置示例
  - 您希望仅限 Codex 的部署在不可用时失败而不是回退到 PI
---

捆绑的 `codex` Plugin 让 OpenClaw 通过 Codex app-server 而不是内置的 PI Harness 运行嵌入式 OpenAI Agent 轮次。

当您希望 Codex 拥有低级 Agent Session 时使用 Codex Harness：原生线程恢复、原生 Tool 延续、原生 Compaction 和 app-server 执行。OpenClaw 仍然拥有 Chat Channel、Session 文件、模型选择、OpenClaw 动态 Tool、审批、媒体投递和可见转录镜像。

正常设置使用规范的 OpenAI 模型引用，如 `openai/gpt-5.5`。不要配置 `openai-codex/gpt-*` 模型引用。将 OpenAI Agent 身份验证顺序放在 `auth.order.openai` 下；旧版 `openai-codex:*` 配置文件和 `auth.order.openai-codex` 条目对于现有安装仍然受支持。

OpenClaw 以 Codex 原生代码模式和仅代码模式启动 Codex app-server 线程。这使可延迟/可搜索的 OpenClaw 动态 Tool 保留在 Codex 自己的代码执行和 Tool 搜索界面内，而不是在 Codex 之上添加 PI 风格的 Tool 搜索包装器。

有关更广泛的模型/Provider/运行时拆分，请从 [Agent 运行时](/concepts/agent-runtimes) 开始。简短版本是：`openai/gpt-5.5` 是模型引用，`codex` 是运行时，而 Telegram、Discord、Slack 或其他 Channel 仍然是通信界面。

## 要求

- 带有可用捆绑 `codex` Plugin 的 OpenClaw。
- 如果您的配置使用 `plugins.allow`，请包含 `codex`。
- Codex app-server `0.125.0` 或更新版本。捆绑 Plugin 默认管理兼容的 Codex app-server 二进制文件，因此 `PATH` 上的本地 `codex` 命令不影响正常的 Harness 启动。
- 通过 `openclaw models auth login --provider openai-codex`、Agent Codex 主目录中 app-server 的现有账户或显式 Codex API 密钥身份验证配置文件提供 Codex 身份验证。

有关身份验证优先级、环境隔离、自定义 app-server 命令、模型发现和所有配置字段，请参见 [Codex Harness 参考](/plugins/codex-harness-reference)。

## 快速入门

大多数希望在 OpenClaw 中使用 Codex 的用户都想走这条路：使用 ChatGPT/Codex 订阅登录，启用捆绑的 `codex` Plugin，并使用规范的 `openai/gpt-*` 模型引用。

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

如果您的配置使用 `plugins.allow`，也请在那里添加 `codex`：

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

更改 Plugin 配置后重启 Gateway。如果现有 Chat 已有 Session，请在测试运行时更改之前使用 `/new` 或 `/reset`，以便下一个轮次从当前配置解析 Harness。

## 配置

快速入门配置是最小可行的 Codex Harness 配置。在 OpenClaw 配置中设置 Codex Harness 选项，仅将 CLI 用于 Codex 身份验证：

| 需求                                   | 设置                                                                              | 位置                              |
| -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------- |
| 启用 Harness                           | `plugins.entries.codex.enabled: true`                                            | OpenClaw 配置                    |
| 保留允许列表的 Plugin 安装             | 在 `plugins.allow` 中包含 `codex`                                                | OpenClaw 配置                    |
| 通过 Codex 路由 OpenAI Agent 轮次      | `agents.defaults.model` 或 `agents.list[].model` 为 `openai/gpt-*`              | OpenClaw Agent 配置              |
| 使用 Codex OAuth 登录                  | `openclaw models auth login --provider openai-codex`                             | CLI 身份验证配置文件             |
| 为 Codex 运行添加 API 密钥备份         | `openai:*` API 密钥配置文件在 `auth.order.openai` 中排在订阅身份验证之后        | CLI 身份验证配置文件 + OpenClaw 配置 |
| 当 Codex 不可用时以关闭方式失败        | Provider 或模型 `agentRuntime.id: "codex"`                                       | OpenClaw 模型/Provider 配置     |
| 使用直接 OpenAI API 流量               | Provider 或模型 `agentRuntime.id: "pi"` 加普通 OpenAI 身份验证                  | OpenClaw 模型/Provider 配置     |
| 调整 app-server 行为                   | `plugins.entries.codex.config.appServer.*`                                       | Codex Plugin 配置               |
| 启用原生 Codex Plugin 应用             | `plugins.entries.codex.config.codexPlugins.*`                                    | Codex Plugin 配置               |
| 启用 Codex Computer Use                | `plugins.entries.codex.config.computerUse.*`                                     | Codex Plugin 配置               |

对 Codex 支持的 OpenAI Agent 轮次使用 `openai/gpt-*` 模型引用。优先使用 `auth.order.openai` 进行订阅优先/API 密钥备份排序。现有的 `openai-codex:*` 身份验证配置文件和 `auth.order.openai-codex` 仍然有效，但不要写入新的 `openai-codex/gpt-*` 模型引用。

不要在 Codex 支持的 Agent 上设置 `compaction.model` 或 `compaction.provider`，除非选定的上下文引擎拥有 Compaction。没有拥有所有权的上下文引擎，Codex 通过其原生 app-server 线程状态进行 Compaction，因此 OpenClaw 在运行时忽略那些本地汇总器覆盖，当 Agent 使用 Codex 时，`openclaw doctor --fix` 会删除它们。

Lossless 作为上下文引擎仍受支持。通过 `plugins.slots.contextEngine: "lossless-claw"` 和 `plugins.entries.lossless-claw.config.summaryModel` 配置它，而不是通过 `agents.defaults.compaction.provider`。当 Codex 是活跃运行时时，`openclaw doctor --fix` 将旧的 `compaction.provider: "lossless-claw"` 形状迁移到 Lossless 上下文引擎 Slot。

当活跃的上下文引擎报告 `ownsCompaction: true` 时，`/compact` 运行该引擎的 Compaction 生命周期并使绑定的 Codex app-server 线程失效。下一个 Codex 轮次启动新的后端线程，并从上下文引擎重新水化，而不是在引擎拥有的语义摘要之上叠加 Codex 原生 Compaction。

```json5
{
  auth: {
    order: {
      openai: ["openai-codex:user@example.com", "openai:api-key-backup"],
    },
  },
}
```

在这种形状中，两个配置文件仍然通过 Codex 运行 `openai/gpt-*` Agent 轮次。API 密钥只是身份验证备用，不是切换到 PI 或纯 OpenAI Responses 的请求。

本页面的其余部分涵盖用户必须在之间选择的常见变体：部署形状、关闭失败路由、guardian 审批策略、原生 Codex Plugin 和 Computer Use。有关完整的选项列表、默认值、枚举、发现、环境隔离、超时和 app-server 传输字段，请参见 [Codex Harness 参考](/plugins/codex-harness-reference)。

## 验证 Codex 运行时

在您期望 Codex 的 Chat 中使用 `/status`。Codex 支持的 OpenAI Agent 轮次显示：

```text
Runtime: OpenAI Codex
```

然后检查 Codex app-server 状态：

```text
/codex status
/codex models
```

`/codex status` 报告 app-server 连接性、账户、速率限制、MCP 服务器和 Skill。`/codex models` 列出该 Harness 和账户的实时 Codex app-server 目录。如果 `/status` 令人意外，请参见[故障排除](#troubleshooting)。

## 路由和模型选择

保持 Provider 引用和运行时策略分离：

- 对通过 Codex 的 OpenAI Agent 轮次使用 `openai/gpt-*`。
- 不要在配置中使用 `openai-codex/gpt-*`。运行 `openclaw doctor --fix` 修复旧版引用和过时的 Session 路由固定。
- `agentRuntime.id: "codex"` 对于正常的 OpenAI 自动模式是可选的，但当部署在 Codex 不可用时应以关闭方式失败时很有用。
- `agentRuntime.id: "pi"` 在这是故意的时候，将 Provider 或模型选择为直接的 PI 行为。
- `/codex ...` 从 Chat 控制原生 Codex app-server 对话。
- ACP/acpx 是独立的外部 Harness 路径。仅在用户要求 ACP/acpx 或外部 Harness 适配器时使用它。

常见命令路由：

| 用户意图                                              | 使用                                                                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 附加当前 Chat                                         | `/codex bind [--cwd <path>]`                                                                          |
| 恢复现有 Codex 线程                                   | `/codex resume <thread-id>`                                                                           |
| 列出或过滤 Codex 线程                                 | `/codex threads [filter]`                                                                             |
| 在已配对节点上附加现有 Codex CLI Session              | `/codex sessions --host <node> [filter]`，然后 `/codex resume <session-id> --host <node> --bind here` |
| 仅发送 Codex 反馈                                     | `/codex diagnostics [note]`                                                                           |
| 启动 ACP/acpx 任务                                    | ACP/acpx Session 命令，而非 `/codex`                                                                  |

| 用例                                                 | 配置                                                             | 验证                                    | 说明                              |
| ---------------------------------------------------- | ---------------------------------------------------------------- | --------------------------------------- | ---------------------------------- |
| 带原生 Codex 运行时的 ChatGPT/Codex 订阅             | `openai/gpt-*` 加已启用的 `codex` Plugin                        | `/status` 显示 `Runtime: OpenAI Codex` | 推荐路径                          |
| 如果 Codex 不可用则以关闭方式失败                    | Provider 或模型 `agentRuntime.id: "codex"`                      | 轮次失败而不是 PI 回退                  | 用于仅限 Codex 的部署             |
| 通过 PI 的直接 OpenAI API 密钥流量                   | Provider 或模型 `agentRuntime.id: "pi"` 加普通 OpenAI 身份验证  | `/status` 显示 PI 运行时               | 仅在 PI 是故意时使用              |
| 旧版配置                                             | `openai-codex/gpt-*`                                             | `openclaw doctor --fix` 重写它          | 不要以这种方式写入新配置          |
| ACP/acpx Codex 适配器                                | ACP `sessions_spawn({ runtime: "acp" })`                         | ACP 任务/Session 状态                  | 独立于原生 Codex Harness          |

`agents.defaults.imageModel` 遵循相同的前缀拆分。对正常 OpenAI 路由使用 `openai/gpt-*`，仅当图像理解应通过有界 Codex app-server 轮次运行时才使用 `codex/gpt-*`。不要使用 `openai-codex/gpt-*`；doctor 将该旧版前缀重写为 `openai/gpt-*`。

## 部署模式

### 基本 Codex 部署

当所有 OpenAI Agent 轮次默认应使用 Codex 时，使用快速入门配置。

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

这种形状保留 Claude 作为默认 Agent，并添加命名的 Codex Agent：

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

使用此配置，`main` Agent 使用其正常的 Provider 路径，`codex` Agent 使用 Codex app-server。

### 关闭失败 Codex 部署

对于 OpenAI Agent 轮次，当捆绑 Plugin 可用时，`openai/gpt-*` 已经解析为 Codex。当您想要写入关闭失败规则时，添加显式运行时策略：

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

强制 Codex 后，如果 Codex Plugin 被禁用、app-server 太旧或 app-server 无法启动，OpenClaw 会提前失败。

## App-server 策略

默认情况下，Plugin 使用 stdio 传输在本地启动 OpenClaw 管理的 Codex 二进制文件。仅当您故意想运行不同的可执行文件时才设置 `appServer.command`。仅当 app-server 已在其他地方运行时才使用 WebSocket 传输：

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

本地 stdio app-server Session 默认为受信任的本地操作员姿态：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和 `sandbox: "danger-full-access"`。如果本地 Codex 要求不允许该隐式 YOLO 姿态，OpenClaw 会选择允许的 guardian 权限。当 Session 的 OpenClaw 沙盒处于活动状态时，OpenClaw 将 Codex `danger-full-access` 缩小到 Codex `workspace-write`，以便原生 Codex 代码模式轮次保持在沙盒工作区内。Codex 轮次网络标志遵循 OpenClaw 沙盒出口策略：Docker `network: "none"` 保持离线，而 `network: "bridge"` 或自定义 Docker 网络允许出站访问。显式 Codex `workspace-write` 轮次使用相同的出口派生网络标志。

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

当本地要求允许这些值时，guardian 模式展开为 Codex app-server 审批，通常为 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。

有关每个 app-server 字段、身份验证顺序、环境隔离、发现和超时行为，请参见 [Codex Harness 参考](/plugins/codex-harness-reference)。

## 命令和诊断

捆绑 Plugin 在任何支持 OpenClaw 文本命令的 Channel 上将 `/codex` 注册为斜杠命令。

常用形式：

- `/codex status` 检查 app-server 连接性、模型、账户、速率限制、MCP 服务器和 Skill。
- `/codex models` 列出实时 Codex app-server 模型。
- `/codex threads [filter]` 列出最近的 Codex app-server 线程。
- `/codex resume <thread-id>` 将当前 OpenClaw Session 附加到现有 Codex 线程。
- `/codex compact` 要求 Codex app-server 压缩附加的线程。
- `/codex review` 为附加的线程启动 Codex 原生审查。
- `/codex diagnostics [note]` 在为附加线程发送 Codex 反馈之前询问。
- `/codex account` 显示账户和速率限制状态。
- `/codex mcp` 列出 Codex app-server MCP 服务器状态。
- `/codex skills` 列出 Codex app-server Skill。

对于大多数支持报告，从发生错误的对话中的 `/diagnostics [note]` 开始。它创建一个 Gateway 诊断报告，对于 Codex Harness Session，在批准后要求发送相关的 Codex 反馈捆绑包。有关隐私模型和群聊行为，请参见[诊断导出](/gateway/diagnostics)。

仅当您专门希望当前附加线程的 Codex 反馈上传而不需要完整的 Gateway 诊断捆绑包时，才使用 `/codex diagnostics [note]`。

### 在本地检查 Codex 线程

检查错误 Codex 运行的最快方式通常是直接打开原生 Codex 线程：

```bash
codex resume <thread-id>
```

从已完成的 `/diagnostics` 回复、`/codex binding` 或 `/codex threads [filter]` 获取线程 ID。

有关上传机制和运行时级别的诊断边界，请参见 [Codex Harness 运行时](/plugins/codex-harness-runtime#codex-feedback-upload)。

身份验证按以下顺序选择：

1. Agent 的有序 OpenAI 身份验证配置文件，最好在 `auth.order.openai` 下。现有的 `openai-codex:*` 配置文件 ID 仍然有效。
2. 该 Agent Codex 主目录中 app-server 的现有账户。
3. 仅对本地 stdio app-server 启动，当没有 app-server 账户且仍需要 OpenAI 身份验证时，依次使用 `CODEX_API_KEY`，然后 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅样式的 Codex 身份验证配置文件时，它会从生成的 Codex 子进程中删除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这使 Gateway 级别的 API 密钥可用于嵌入或直接 OpenAI 模型，而不会意外地通过 API 计费原生 Codex app-server 轮次。显式 Codex API 密钥配置文件和本地 stdio 环境密钥回退使用 app-server 登录，而不是继承的子进程环境。WebSocket app-server 连接不接收 Gateway 环境 API 密钥回退；请使用显式身份验证配置文件或远程 app-server 自己的账户。

如果订阅配置文件达到 Codex 使用限制，OpenClaw 会在 Codex 报告重置时间时记录它，并为同一 Codex 运行尝试下一个有序身份验证配置文件。当重置时间过去后，订阅配置文件再次变为符合条件，而不更改选定的 `openai/gpt-*` 模型或 Codex 运行时。

对于本地 stdio app-server 启动，OpenClaw 将 `CODEX_HOME` 设置为每个 Agent 的目录，以便 Codex 配置、身份验证/账户文件、Plugin 缓存/数据和原生线程状态默认不读写操作员的个人 `~/.codex`。OpenClaw 保留正常的进程 `HOME`；Codex 运行的子进程仍然可以找到用户主目录配置和令牌，Codex 可能会发现共享的 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json` 条目。

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

`appServer.clearEnv` 只影响生成的 Codex app-server 子进程。OpenClaw 在本地启动规范化期间从此列表中删除 `CODEX_HOME` 和 `HOME`：`CODEX_HOME` 保持每个 Agent，`HOME` 保持继承，以便子进程可以使用正常的用户主目录状态。

Codex 动态 Tool 默认为 `searchable` 加载。OpenClaw 不公开复制 Codex 原生工作区操作的动态 Tool：`read`、`write`、`edit`、`apply_patch`、`exec`、`process` 和 `update_plan`。大多数其余的 OpenClaw 集成 Tool（如消息、媒体、Cron、浏览器、节点、Gateway、`heartbeat_respond` 和 `web_search`）可通过 `openclaw` 命名空间下的 Codex Tool 搜索获得，使初始模型上下文更小。`sessions_yield` 和仅消息 Tool 源回复保持直接，因为这些是轮次控制契约。`sessions_spawn` 保持可搜索，以便 Codex 的原生 `spawn_agent` 仍然是主要的 Codex 子 Agent 界面，而显式 OpenClaw 或 ACP 委托仍然通过 `openclaw` 动态 Tool 命名空间可用。心跳协作指令告诉 Codex 在结束心跳轮次前搜索 `heartbeat_respond`（当该 Tool 尚未加载时）。

仅在连接到无法搜索延迟动态 Tool 的自定义 Codex app-server 时，或在调试完整 Tool 载荷时，才将 `codexDynamicToolsLoading: "direct"` 设置为 `"direct"`。

支持的顶层 Codex Plugin 字段：

| 字段                       | 默认值          | 含义                                                                                  |
| -------------------------- | --------------- | ------------------------------------------------------------------------------------- |
| `codexDynamicToolsLoading` | `"searchable"`  | 使用 `"direct"` 将 OpenClaw 动态 Tool 直接放入初始 Codex Tool 上下文中。              |
| `codexDynamicToolsExclude` | `[]`            | 要从 Codex app-server 轮次中省略的额外 OpenClaw 动态 Tool 名称。                      |
| `codexPlugins`             | 已禁用          | 迁移的源安装精选 Plugin 的原生 Codex Plugin/应用支持。                                |

支持的 `appServer` 字段：

| 字段                          | 默认值                                                 | 含义                                                                                                                                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` 生成 Codex；`"websocket"` 连接到 `url`。                                                                                                                                                                                                                        |
| `command`                     | 托管 Codex 二进制文件                                  | stdio 传输的可执行文件。不设置则使用托管二进制文件；仅在需要显式覆盖时设置。                                                                                                                                                                                              |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输的参数。                                                                                                                                                                                                                                                         |
| `url`                         | 未设置                                                  | WebSocket app-server URL。                                                                                                                                                                                                                                                 |
| `authToken`                   | 未设置                                                  | WebSocket 传输的承载令牌。                                                                                                                                                                                                                                                 |
| `headers`                     | `{}`                                                   | 额外的 WebSocket 头。                                                                                                                                                                                                                                                     |
| `clearEnv`                    | `[]`                                                   | 在 OpenClaw 构建其继承环境后从生成的 stdio app-server 进程中删除的额外环境变量名称。OpenClaw 在本地启动时保留每个 Agent 的 `CODEX_HOME` 和继承的 `HOME`。                                                                                                                  |
| `requestTimeoutMs`            | `60000`                                                | app-server 控制平面调用的超时。                                                                                                                                                                                                                                            |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Codex 接受轮次后或 OpenClaw 响应轮次范围的 app-server 请求后等待 `turn/completed` 时的静默窗口。对于缓慢的工具后或仅状态综合阶段，请提高此值。                                                                                                                            |
| `mode`                        | `"yolo"`（除非本地 Codex 要求不允许 YOLO）             | YOLO 或 guardian 审查执行的预设。省略 `danger-full-access`、`never` 审批或 `user` 审查者的本地 stdio 要求使隐式默认值为 guardian。                                                                                                                                        |
| `approvalPolicy`              | `"never"` 或允许的 guardian 审批策略                   | 发送到线程开始/恢复/轮次的原生 Codex 审批策略。guardian 默认值在允许时优先选择 `"on-request"`。                                                                                                                                                                           |
| `sandbox`                     | `"danger-full-access"` 或允许的 guardian 沙盒          | 发送到线程开始/恢复的原生 Codex 沙盒模式。guardian 默认值在允许时优先选择 `"workspace-write"`，否则为 `"read-only"`。当 OpenClaw 沙盒处于活动状态时，`danger-full-access` 轮次使用 Codex `workspace-write`，网络访问从 OpenClaw 沙盒出口设置派生。                          |
| `approvalsReviewer`           | `"user"` 或允许的 guardian 审查者                      | 使用 `"auto_review"` 让 Codex 在允许时审查原生审批提示，否则使用 `guardian_subagent` 或 `user`。`guardian_subagent` 仍然是旧版别名。                                                                                                                                      |
| `serviceTier`                 | 未设置                                                  | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求弹性处理，`null` 清除覆盖，旧版 `"fast"` 被接受为 `"priority"`。                                                                                                                            |

OpenClaw 拥有的动态 Tool 调用独立于 `appServer.requestTimeoutMs` 进行限制：Codex `item/tool/call` 请求默认使用 30 秒 OpenClaw 看门狗。正数的每次调用 `timeoutMs` 参数会延长或缩短该特定 Tool 预算。`image_generate` Tool 在 Tool 调用不提供自己的超时时也使用 `agents.defaults.imageGenerationModel.timeoutMs`，媒体理解 `image` Tool 使用 `tools.media.image.timeoutSeconds` 或其 60 秒媒体默认值。动态 Tool 预算上限为 600000 毫秒。超时时，OpenClaw 在支持的情况下中止 Tool 信号，并向 Codex 返回失败的动态 Tool 响应，以便轮次可以继续，而不是将 Session 留在 `processing` 中。

Codex 接受轮次后，以及 OpenClaw 响应轮次范围的 app-server 请求后，Harness 期望 Codex 取得当前轮次的进展，并最终以 `turn/completed` 完成原生轮次。如果 app-server 在 `appServer.turnCompletionIdleTimeoutMs` 期间变得静默，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw Session 通道，以便后续 Chat 消息不会在过时的原生轮次后面排队。同一轮次的大多数非终端通知会解除该短看门狗，因为 Codex 已证明轮次仍然处于活动状态；原始 `custom_tool_call_output` 完成保持短的工具后看门狗处于活动状态，因为它们是轮次范围的工具结果交接。全局 app-server 通知（如速率限制更新）不重置轮次空闲进度。已完成的 `agentMessage` 项目和工具前的原始助手 `rawResponseItem/completed` 项目激活助手输出释放：如果 Codex 随后变得静默而没有 `turn/completed`，OpenClaw 会尽力中断原生轮次并释放 Session 通道。工具后的原始助手进度继续等待 `turn/completed` 或终端看门狗。超时诊断包括最后一个 app-server 通知方法，以及对于原始助手响应项目，包括项目类型、角色、ID 和有界助手文本预览。

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被删除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 进行一次性本地测试。对于可重复的部署，首选配置，因为它将 Plugin 行为保留在与其余 Codex Harness 设置相同的经过审查的文件中。

## 原生 Codex Plugin

原生 Codex Plugin 支持在与 OpenClaw Harness 轮次相同的 Codex 线程中使用 Codex app-server 自身的应用和 Plugin 能力。OpenClaw 不将 Codex Plugin 转换为合成的 `codex_plugin_*` OpenClaw 动态 Tool。

`codexPlugins` 只影响选择原生 Codex Harness 的 Session。它对 PI 运行、正常 OpenAI Provider 运行、ACP 对话绑定或其他 Harness 没有影响。

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
            allow_destructive_actions: true,
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

线程应用配置在 OpenClaw 建立 Codex Harness Session 或替换过时的 Codex 线程绑定时计算。它不会在每个轮次重新计算。更改 `codexPlugins` 后，使用 `/new`、`/reset` 或重启 Gateway，以便未来的 Codex Harness Session 以更新的应用集启动。

有关迁移资格、应用清单、破坏性操作策略、触发和原生 Plugin 诊断，请参见[原生 Codex Plugin](/plugins/codex-native-plugins)。

## Computer Use

Computer Use 在其专属设置指南中介绍：[Codex Computer Use](/plugins/codex-computer-use)。

简短版本：OpenClaw 不提供桌面控制应用或自行执行桌面操作。它准备 Codex app-server，验证 `computer-use` MCP 服务器是否可用，然后让 Codex 在 Codex 模式轮次期间拥有原生 MCP Tool 调用。

## 运行时边界

Codex Harness 只更改低级嵌入式 Agent 执行器。

- OpenClaw 动态 Tool 受支持。Codex 请求 OpenClaw 执行这些 Tool，因此 OpenClaw 保持在执行路径中。
- Codex 原生 Shell、补丁、MCP 和原生应用 Tool 由 Codex 拥有。OpenClaw 可以通过支持的中继观测或阻止选定的原生事件，但不重写原生 Tool 参数。
- Codex 拥有原生 Compaction，除非活跃的 OpenClaw 上下文引擎声明 `ownsCompaction: true`。OpenClaw 为 Channel 历史、搜索、`/new`、`/reset` 和未来的模型或 Harness 切换保留转录镜像。
- 媒体生成、媒体理解、TTS、审批和消息 Tool 输出继续通过匹配的 OpenClaw Provider/模型设置。
- `tool_result_persist` 适用于 OpenClaw 拥有的转录 Tool 结果，而不是 Codex 原生 Tool 结果记录。

有关 Hook 层、支持的 V1 界面、原生权限处理、队列引导、Codex 反馈上传机制和 Compaction 详情，请参见 [Codex Harness 运行时](/plugins/codex-harness-runtime)。

## 故障排除

**Codex 没有作为正常的 `/model` Provider 出现：** 这对于新配置是预期的。选择 `openai/gpt-*` 模型，启用 `plugins.entries.codex.enabled`，并检查 `plugins.allow` 是否排除了 `codex`。

**OpenClaw 使用 PI 而不是 Codex：** 确保模型引用在官方 OpenAI Provider 上是 `openai/gpt-*`，并且 Codex Plugin 已安装并启用。如果在测试时需要严格证明，请设置 Provider 或模型 `agentRuntime.id: "codex"`。强制的 Codex 运行时会失败而不是回退到 PI。

**OpenAI Codex 运行时回退到 API 密钥路径：** 收集显示模型、运行时、选定 Provider 和失败的经过编辑的 Gateway 摘录。要求受影响的协作者在其 OpenClaw 主机上运行此只读命令：

```bash
(
  pattern='openai/gpt-5\.[45]|agentRuntime(\.id)?|harnessRuntime|Runtime: OpenAI Codex|openai-codex|resolveSelectedOpenAIPiRuntimeProvider|candidateProvider[": ]+openai|status[": ]+401|Incorrect API key|No API key|api-key path|API-key path|OAuth'

  if ls /tmp/openclaw/openclaw-*.log >/dev/null 2>&1; then
    grep -E -i -n "$pattern" /tmp/openclaw/openclaw-*.log 2>/dev/null || true
  else
    journalctl --user -u openclaw-gateway --since today --no-pager 2>/dev/null \
      | grep -E -i "$pattern" || true
  fi
) | sed -E \
    -e 's/(Authorization: Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(Bearer )[A-Za-z0-9._~+\/-]+/\1[REDACTED]/Ig' \
    -e 's/(api[_ -]?key[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/(OPENAI_API_KEY[=: ]+)[^ ,}"]+/\1[REDACTED]/Ig' \
    -e 's/sk-[A-Za-z0-9_-]{12,}/sk-[REDACTED]/g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL-REDACTED]/g' \
  | tail -200
```

有用的摘录通常包括 `openai/gpt-5.5` 或 `openai/gpt-5.4`、`Runtime: OpenAI Codex`、`agentRuntime.id` 或 `harnessRuntime`、`candidateProvider: "openai"` 以及 `401`、`Incorrect API key` 或 `No API key` 结果。更正后的运行应该显示 `openai-codex` OAuth 路径，而不是纯 OpenAI API 密钥失败。

**旧版 `openai-codex/*` 配置仍然存在：** 运行 `openclaw doctor --fix`。Doctor 将旧版模型引用重写为 `openai/*`，删除过时的 Session 和整个 Agent 运行时固定，并保留现有的身份验证配置文件覆盖。

**app-server 被拒绝：** 使用 Codex app-server `0.125.0` 或更新版本。同版本预发布版或带构建后缀的版本（如 `0.125.0-alpha.2` 或 `0.125.0+custom`）会被拒绝，因为 OpenClaw 测试稳定的 `0.125.0` 协议下限。

**`/codex status` 无法连接：** 检查捆绑的 `codex` Plugin 是否已启用，当配置了允许列表时 `plugins.allow` 是否包含它，以及任何自定义的 `appServer.command`、`url`、`authToken` 或头是否有效。

**模型发现速度慢：** 降低 `plugins.entries.codex.config.discovery.timeoutMs` 或禁用发现。请参见 [Codex Harness 参考](/plugins/codex-harness-reference#model-discovery)。

**WebSocket 传输立即失败：** 检查 `appServer.url`、`authToken`、头以及远程 app-server 是否使用相同的 Codex app-server 协议版本。

**非 Codex 模型使用 PI：** 这是预期的，除非 Provider 或模型运行时策略将其路由到另一个 Harness。普通的非 OpenAI Provider 引用在 `auto` 模式下保持在其正常的 Provider 路径上。

**Computer Use 已安装但 Tool 不运行：** 从新的 Session 检查 `/codex computer-use status`。如果 Tool 报告 `Native hook relay unavailable`，使用 `/new` 或 `/reset`；如果仍然存在，重启 Gateway 以清除过时的原生 Hook 注册。请参见 [Codex Computer Use](/plugins/codex-computer-use#troubleshooting)。

## 相关

- [Codex Harness 参考](/plugins/codex-harness-reference)
- [Codex Harness 运行时](/plugins/codex-harness-runtime)
- [原生 Codex Plugin](/plugins/codex-native-plugins)
- [Codex Computer Use](/plugins/codex-computer-use)
- [Agent 运行时](/concepts/agent-runtimes)
- [模型 Provider](/concepts/model-providers)
- [OpenAI Provider](/providers/openai)
- [Agent Harness Plugin](/plugins/sdk-agent-harness)
- [Plugin Hook](/plugins/hooks)
- [诊断导出](/gateway/diagnostics)
- [Status](/cli/status)
- [测试](/help/testing-live#live-codex-app-server-harness-smoke)
