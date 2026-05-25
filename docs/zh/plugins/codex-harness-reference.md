---
mmh3_hash: "92768e3db7b4e3219f0bebd22994dc0b"
summary: "Codex Harness 的配置、身份验证、发现和 app-server 参考"
title: "Codex Harness 参考"
read_when:
  - 您需要了解 Codex Harness 的每个配置字段
  - 您正在更改 app-server 传输、身份验证、发现或超时行为
  - 您正在调试 Codex Harness 启动、模型发现或环境隔离
---

本参考涵盖 Bundle `codex` Plugin 的详细配置。有关设置和路由决策，请从 [Codex Harness](/plugins/codex-harness) 开始。

## Plugin 配置表面

所有 Codex Harness 设置位于 `plugins.entries.codex.config` 下。

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
          appServer: {
            mode: "guardian",
          },
        },
      },
    },
  },
}
```

支持的顶层字段：

| 字段                       | 默认值                   | 含义                                                                                                                                   |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已启用                  | Codex app-server `model/list` 的模型发现设置。                                                                               |
| `appServer`                | 托管 stdio app-server | 传输、命令、身份验证、批准、沙盒和超时设置。                                                                        |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 将 OpenClaw 动态工具直接放入初始 Codex 工具上下文中。                                                                  |
| `codexDynamicToolsExclude` | `[]`                     | 要从 Codex app-server 轮次中省略的额外 OpenClaw 动态工具名称。                                                               |
| `codexPlugins`             | 已禁用                 | 已迁移源安装的精选 Plugin 的原生 Codex Plugin/应用支持。请参见 [原生 Codex Plugin](/plugins/codex-native-plugins)。 |
| `computerUse`              | 已禁用                  | Codex Computer Use 设置。请参见 [Codex Computer Use](/plugins/codex-computer-use)。                                                          |

## App-server 传输

默认情况下，OpenClaw 启动与 Bundle Plugin 一起提供的托管 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

这将 app-server 版本绑定到 Bundle `codex` Plugin，而不是本地碰巧安装的任何单独 Codex CLI。仅当您有意要运行不同的可执行文件时，才设置 `appServer.command`。

对于已运行的 app-server，请使用 WebSocket 传输：

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
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

支持的 `appServer` 字段：

| 字段                          | 默认值                                                 | 含义                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `transport`                   | `"stdio"`                                              | `"stdio"` 生成 Codex；`"websocket"` 连接到 `url`。                                                                                                                                                  |
| `command`                     | 托管 Codex 二进制文件                                   | stdio 传输的可执行文件。不设置则使用托管二进制文件。                                                                                                                                                    |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输的参数。                                                                                                                                                                                            |
| `url`                         | 未设置                                                  | WebSocket app-server URL。                                                                                                                                                                                 |
| `authToken`                   | 未设置                                                  | WebSocket 传输的承载令牌。                                                                                                                                                                                     |
| `headers`                     | `{}`                                                   | 额外的 WebSocket 头。                                                                                                                                                                                  |
| `clearEnv`                    | `[]`                                                   | 在 OpenClaw 构建其继承环境后从生成的 stdio app-server 进程中删除的额外环境变量名称。                                                                       |
| `requestTimeoutMs`            | `60000`                                                | app-server 控制平面调用的超时。                                                                                                                                                                               |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | Codex 接受轮次后或轮次范围的 app-server 请求后 OpenClaw 等待 `turn/completed` 时的静默窗口。                                                                              |
| `postToolRawAssistantCompletionIdleTimeoutMs` | 未设置                                | 工具交接后当 Codex 发出原始助手完成或进度但不发送 `turn/completed` 时使用的完成空闲守护。未设置时默认为助手完成空闲超时。对于工具后合成可以比最终助手释放预算更长时间保持静默的受信任或繁重工作负载使用此选项。 |
| `mode`                        | `"yolo"`（除非本地 Codex 要求不允许 YOLO） | YOLO 或 guardian 审查执行的预设。                                                                                                                                           |
| `approvalPolicy`              | `"never"` 或允许的 guardian 批准策略       | 发送到线程开始、恢复和轮次的原生 Codex 批准策略。                                                                                                                                                      |
| `sandbox`                     | `"danger-full-access"` 或允许的 guardian 沙盒  | 发送到线程开始和恢复的原生 Codex 沙盒模式。活动的 OpenClaw 沙盒将 `danger-full-access` 轮次缩小为 Codex `workspace-write`；轮次网络标志遵循 OpenClaw 沙盒出口。 |
| `approvalsReviewer`           | `"user"` 或允许的 guardian 审查者               | 使用 `"auto_review"` 让 Codex 在允许时审查原生批准提示。                                                                                                                             |
| `defaultWorkspaceDir`         | 当前进程目录                              | 省略 `--cwd` 时 `/codex bind` 使用的工作区。                                                                                                                                                  |
| `serviceTier`                 | 未设置                                                  | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求弹性处理，`null` 清除覆盖。旧版 `"fast"` 被接受为 `"priority"`。           |
| `experimental.sandboxExecServer` | `false`                                             | 预览选择加入，向 Codex app-server 0.132.0 或更新版本注册由 OpenClaw 沙盒支持的 Codex 环境，使原生 Codex 执行可以在活动的 OpenClaw 沙盒内运行。          |

Plugin 阻止较旧或未版本化的 app-server 握手。Codex app-server 必须报告稳定版本 `0.125.0` 或更新版本。

## 批准和沙盒模式

本地 stdio app-server Session 默认为 YOLO 模式：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和 `sandbox: "danger-full-access"`。这种受信任的本地操作员姿态允许无人值守的 OpenClaw 轮次和心跳在没有原生批准提示的情况下取得进展。

如果 Codex 的本地系统要求文件不允许隐式 YOLO 批准、审查者或沙盒值，OpenClaw 将隐式默认值视为 guardian，并选择允许的 guardian 权限。同一要求文件中的主机名匹配 `[[remote_sandbox_config]]` 条目对沙盒默认决策有效。

设置 `appServer.mode: "guardian"` 以进行 Codex guardian 审查批准：

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

当这些值被允许时，`guardian` 预设展开为 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。各个策略字段覆盖 `mode`。旧版 `guardian_subagent` 审查者值仍被接受为兼容性别名，但新配置应使用 `auto_review`。

当 OpenClaw 沙盒处于活动状态时，本地 Codex app-server 进程仍在 Gateway 主机上运行。因此，OpenClaw 禁用该轮次的 Codex 原生代码模式、用户 MCP 服务器和应用支持的 Plugin 执行，而不是将 Codex 主机端沙盒视为等同于 OpenClaw 沙盒后端。当正常的 exec/process 工具可用时，Shell 访问通过 OpenClaw 沙盒支持的动态工具（如 `sandbox_exec` 和 `sandbox_process`）暴露。

在 Ubuntu/AppArmor 主机上，当您有意在没有活动 OpenClaw 沙盒的情况下运行原生 Codex `workspace-write` 时，Codex bwrap 可能会在 Shell 命令启动前在 `workspace-write` 下失败。如果您看到 `bwrap: setting up uid map: Permission denied` 或 `bwrap: loopback: Failed RTM_NEWADDR: Operation not permitted`，请运行 `openclaw doctor` 并修复报告的 OpenClaw 服务用户的主机命名空间策略，而不是授予更广泛的 Docker 容器权限。优先为服务进程使用有范围的 AppArmor 配置文件；`kernel.apparmor_restrict_unprivileged_userns=0` 回退是主机范围的，存在安全权衡。

## 沙盒化原生执行

稳定默认为失败关闭：活动的 OpenClaw 沙盒禁用原本会从 Codex app-server 主机运行的原生 Codex 执行界面。仅当您希望尝试将 Codex 的远程环境支持与 OpenClaw 的沙盒后端配合使用时，才使用 `appServer.experimental.sandboxExecServer: true`。此预览路径需要 Codex app-server 0.132.0 或更新版本。

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            experimental: {
              sandboxExecServer: true,
            },
          },
        },
      },
    },
  },
}
```

当标志启用且当前 OpenClaw Session 已沙盒化时，OpenClaw 启动由活动沙盒支持的本地回环 exec-server，将其注册到 Codex app-server，并使用该 OpenClaw 拥有的环境启动 Codex 线程和轮次。如果 app-server 无法注册该环境，运行会失败关闭，而不是静默回退到主机执行。

此预览路径仅限本地。远程 WebSocket app-server 无法访问回环 exec-server，除非它在同一主机上运行，因此 OpenClaw 会拒绝该组合。

## 身份验证和环境隔离

身份验证按以下顺序选择：

1. Agent 的显式 OpenClaw Codex 身份验证配置文件。
2. 该 Agent Codex 主目录中 app-server 的现有账户。
3. 仅对本地 stdio app-server 启动，当没有 app-server 账户且仍需要 OpenAI 身份验证时，依次使用 `CODEX_API_KEY`，然后 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅样式的 Codex 身份验证配置文件时，它会从生成的 Codex 子进程中删除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这使 Gateway 级别的 API 密钥可用于嵌入或直接 OpenAI 模型，而不会意外地通过 API 计费原生 Codex app-server 轮次。

显式 Codex API 密钥配置文件和本地 stdio 环境密钥回退使用 app-server 登录，而不是继承的子进程环境。WebSocket app-server 连接不接收 Gateway 环境 API 密钥回退；请使用显式身份验证配置文件或远程 app-server 自己的账户。

stdio app-server 启动默认继承 OpenClaw 的进程环境。OpenClaw 拥有 Codex app-server 账户桥接，并将 `CODEX_HOME` 设置为该 Agent 的 OpenClaw 状态下的每个 Agent 目录。这将 Codex 配置、账户、Plugin 缓存/数据和线程状态范围限定到 OpenClaw Agent，而不是从操作员的个人 `~/.codex` 主目录中泄漏。

OpenClaw 不会为正常本地 app-server 启动重写 `HOME`。Codex 运行的子进程，如 `openclaw`、`gh`、`git`、云 CLI 和 Shell 命令，会看到正常的进程主目录，并可以找到用户主目录配置和令牌。Codex 还可能发现 `$HOME/.agents/skills` 和 `$HOME/.agents/plugins/marketplace.json`；该 `.agents` 发现故意与操作员主目录共享，与隔离的 `~/.codex` 状态分开。

OpenClaw Plugin 和 OpenClaw Skill 快照仍然通过 OpenClaw 自己的 Plugin 注册表和 Skill 加载器流动。个人 Codex `~/.codex` 资产则不会。如果您有来自 Codex 主目录的有用 Codex CLI Skill 或 Plugin，应该成为 OpenClaw Agent 的一部分，请明确清单它们：

```bash
openclaw migrate codex --dry-run
openclaw migrate apply codex --yes
```

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

## 动态工具

Codex 动态工具默认为 `searchable` 加载。OpenClaw 不公开复制 Codex 原生工作区操作的动态工具：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

大多数其余的 OpenClaw 集成工具，如消息、媒体、Cron、浏览器、节点、Gateway、`heartbeat_respond` 和 `web_search`，可通过 `openclaw` 命名空间下的 Codex 工具搜索获得。这使初始模型上下文更小。`sessions_yield` 和仅消息工具源回复保持直接，因为这些是轮次控制契约。`sessions_spawn` 保持可搜索，以便 Codex 的原生 `spawn_agent` 仍然是主要的 Codex 子 Agent 表面，而显式 OpenClaw 或 ACP 委托仍然通过 `openclaw` 动态工具命名空间可用。

仅在连接到无法搜索延迟动态工具的自定义 Codex app-server 时，或在调试完整工具载荷时，才将 `codexDynamicToolsLoading: "direct"` 设置为 `"direct"`。

## 超时

OpenClaw 拥有的动态工具调用独立于 `appServer.requestTimeoutMs` 进行限制。每个 Codex `item/tool/call` 请求按此顺序使用第一个可用超时：

- 正数的每次调用 `timeoutMs` 参数。
- 对于 `image_generate`，使用 `agents.defaults.imageGenerationModel.timeoutMs`。
- 对于媒体理解 `image` 工具，使用 `tools.media.image.timeoutSeconds` 转换为毫秒，或 60 秒媒体默认值。
- 30 秒动态工具默认值。

动态工具预算上限为 600000 毫秒。超时时，OpenClaw 在支持的情况下中止工具信号，并向 Codex 返回失败的动态工具响应，以便轮次可以继续，而不是将 Session 留在 `processing` 中。

Codex 接受轮次后，以及 OpenClaw 响应轮次范围的 app-server 请求后，Harness 期望 Codex 取得当前轮次的进展，并最终以 `turn/completed` 完成原生轮次。如果 app-server 在 `appServer.turnCompletionIdleTimeoutMs` 期间变得静默，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw Session 通道，以便后续聊天消息不会在过时的原生轮次后面排队。

同一轮次的大多数非终端通知会解除该短看门狗，因为 Codex 已证明轮次仍然处于活动状态。原始 `custom_tool_call_output` 完成保持短的工具后看门狗处于活动状态，因为它们是轮次范围的工具结果交接。完成的 `agentMessage` 项目和工具前的原始助手 `rawResponseItem/completed` 项目激活助手输出释放：如果 Codex 随后变得静默而没有 `turn/completed`，OpenClaw 会尽力中断原生轮次并释放 Session 通道。工具后的原始助手进度继续等待 `turn/completed` 或终端看门狗。超时诊断包括最后一个 app-server 通知方法，以及对于原始助手响应项目，包括项目类型、角色、id 和有界助手文本预览。

## 模型发现

默认情况下，Codex Plugin 向 app-server 查询可用模型。模型可用性由 Codex app-server 拥有，因此当 OpenClaw 升级 Bundle `@openai/codex` 版本或当部署将 `appServer.command` 指向不同的 Codex 二进制文件时，列表可能会更改。可用性也可以是账户范围的。在运行中的 Gateway 上使用 `/codex models` 查看该 Harness 和账户的实时目录。

如果发现失败或超时，OpenClaw 使用捆绑的回退目录：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

当前捆绑的 Harness 是 `@openai/codex` `0.130.0`。针对该捆绑 app-server 的 `model/list` 探测返回：

| 模型 id              | 默认 | 隐藏 | 输入模态 | 推理工作量        |
| --------------------- | ------- | ------ | ---------------- | ------------------------ |
| `gpt-5.5`             | 是     | 否     | 文本、图像      | low, medium, high, xhigh |
| `gpt-5.4`             | 否      | 否     | 文本、图像      | low, medium, high, xhigh |
| `gpt-5.4-mini`        | 否      | 否     | 文本、图像      | low, medium, high, xhigh |
| `gpt-5.3-codex`       | 否      | 否     | 文本、图像      | low, medium, high, xhigh |
| `gpt-5.3-codex-spark` | 否      | 否     | 文本             | low, medium, high, xhigh |
| `gpt-5.2`             | 否      | 否     | 文本、图像      | low, medium, high, xhigh |

隐藏模型可以由 app-server 目录针对内部或专用流程返回，但它们不是普通的模型选择器选项。

在 `plugins.entries.codex.config.discovery` 下调整发现：

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

当您希望启动避免探测 Codex 并仅使用回退目录时，请禁用发现：

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

## 工作区引导文件

Codex 通过原生项目文档发现自行处理 `AGENTS.md`。OpenClaw 不写入合成 Codex 项目文档文件或依赖 Codex 回退文件名用于角色文件，因为 Codex 回退仅在 `AGENTS.md` 缺失时适用。

对于 OpenClaw 工作区对等，Codex Harness 解析其他引导文件，包括 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`（如果存在），并通过 `thread/start` 和 `thread/resume` 上的 Codex 开发者指令转发它们。这使工作区角色和配置文件上下文在原生 Codex 行为塑造通道上可见，而无需复制 `AGENTS.md`。

## 环境覆盖

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已被删除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 进行一次性本地测试。对于可重复的部署，首选配置，因为它将 Plugin 行为保留在与其余 Codex Harness 设置相同的经过审查的文件中。

## 相关

- [Codex Harness](/plugins/codex-harness)
- [Codex Harness 运行时](/plugins/codex-harness-runtime)
- [原生 Codex Plugin](/plugins/codex-native-plugins)
- [Codex Computer Use](/plugins/codex-computer-use)
- [OpenAI Provider](/providers/openai)
- [配置参考](/gateway/configuration-reference)
