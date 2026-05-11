---
mmh3_hash: "f66c3989f5a183d7809650d016841502"
summary: "Codex Harness 的配置、身份验证、发现和 app-server 参考"
title: "Codex Harness 参考"
read_when:
  - 您需要每个 Codex Harness 配置字段
  - 您正在更改 app-server 传输、身份验证、发现或超时行为
  - 您正在调试 Codex Harness 启动、模型发现或环境隔离
---

本参考涵盖 Bundle `codex` Plugin 的详细配置。有关设置和路由决策，请从 [Codex Harness](/plugins/codex-harness) 开始。

## Plugin 配置界面

所有 Codex Harness 设置都位于 `plugins.entries.codex.config` 下。

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

支持的顶级字段：

| 字段                       | 默认值                   | 含义                                                                                                                                      |
| -------------------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `discovery`                | 已启用                   | Codex app-server `model/list` 的模型发现设置。                                                                                            |
| `appServer`                | 托管 stdio app-server    | 传输、命令、身份验证、审批、沙箱和超时设置。                                                                                               |
| `codexDynamicToolsLoading` | `"searchable"`           | 使用 `"direct"` 将 OpenClaw 动态 Tool 直接放在初始 Codex Tool 上下文中。                                                                  |
| `codexDynamicToolsExclude` | `[]`                     | 从 Codex app-server 轮次中省略的额外 OpenClaw 动态 Tool 名称。                                                                            |
| `codexPlugins`             | 已禁用                   | 原生 Codex Plugin/应用支持，用于已迁移的源安装精选 Plugin。请参见[原生 Codex Plugin](/plugins/codex-native-plugins)。                      |
| `computerUse`              | 已禁用                   | Codex Computer Use 设置。请参见 [Codex Computer Use](/plugins/codex-computer-use)。                                                       |

## App-server 传输

默认情况下，OpenClaw 启动随 Bundle Plugin 一起提供的托管 Codex 二进制文件：

```bash
codex app-server --listen stdio://
```

这使 app-server 版本与 Bundle `codex` Plugin 绑定，而不是本地安装的任何 Codex CLI。仅当您有意运行不同的可执行文件时才设置 `appServer.command`。

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

| 字段                          | 默认值                                                 | 含义                                                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `transport`                   | `"stdio"`                                              | `"stdio"` 启动 Codex；`"websocket"` 连接到 `url`。                                                                                                                                              |
| `command`                     | 托管 Codex 二进制文件                                   | stdio 传输的可执行文件。留空以使用托管二进制文件。                                                                                                                                                |
| `args`                        | `["app-server", "--listen", "stdio://"]`               | stdio 传输的参数。                                                                                                                                                                               |
| `url`                         | 未设置                                                 | WebSocket app-server URL。                                                                                                                                                                       |
| `authToken`                   | 未设置                                                 | WebSocket 传输的 Bearer Token。                                                                                                                                                                  |
| `headers`                     | `{}`                                                   | 额外的 WebSocket 头。                                                                                                                                                                            |
| `clearEnv`                    | `[]`                                                   | OpenClaw 构建继承环境后从已启动的 stdio app-server 进程中删除的额外环境变量名称。                                                                                                                  |
| `requestTimeoutMs`            | `60000`                                                | app-server 控制平面调用的超时。                                                                                                                                                                  |
| `turnCompletionIdleTimeoutMs` | `60000`                                                | 轮次范围的 app-server 请求后 OpenClaw 等待 `turn/completed` 的静默窗口。                                                                                                                         |
| `mode`                        | `"yolo"`，除非本地 Codex 要求禁止 YOLO                  | YOLO 或 guardian 审核执行的预设。                                                                                                                                                                |
| `approvalPolicy`              | `"never"` 或允许的 guardian 审批策略                    | 发送到线程启动、恢复和轮次的原生 Codex 审批策略。                                                                                                                                                |
| `sandbox`                     | `"danger-full-access"` 或允许的 guardian 沙箱           | 发送到线程启动和恢复的原生 Codex 沙箱模式。                                                                                                                                                      |
| `approvalsReviewer`           | `"user"` 或允许的 guardian 审核者                       | 使用 `"auto_review"` 让 Codex 在允许时审核原生审批提示。                                                                                                                                         |
| `defaultWorkspaceDir`         | 当前进程目录                                            | 省略 `--cwd` 时 `/codex bind` 使用的工作区。                                                                                                                                                    |
| `serviceTier`                 | 未设置                                                 | 可选的 Codex app-server 服务层级。`"priority"` 启用快速模式路由，`"flex"` 请求弹性处理，`null` 清除覆盖。旧版 `"fast"` 被接受为 `"priority"`。                                                    |

Plugin 会阻止较旧或无版本的 app-server 握手。Codex app-server 必须报告稳定版本 `0.125.0` 或更高版本。

## 审批和沙箱模式

本地 stdio app-server Session 默认为 YOLO 模式：`approvalPolicy: "never"`、`approvalsReviewer: "user"` 和 `sandbox: "danger-full-access"`。这种受信任的本地操作员姿态让无人值守的 OpenClaw 轮次和心跳在没有原生审批提示的情况下取得进展。

如果 Codex 的本地系统要求文件禁止隐式 YOLO 审批、审核者或沙箱值，OpenClaw 会将隐式默认值视为 guardian 并选择允许的 guardian 权限。同一要求文件中与主机名匹配的 `[[remote_sandbox_config]]` 条目会被用于沙箱默认决策。

为 Codex guardian 审核审批设置 `appServer.mode: "guardian"`：

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

当这些值被允许时，`guardian` 预设扩展为 `approvalPolicy: "on-request"`、`approvalsReviewer: "auto_review"` 和 `sandbox: "workspace-write"`。单独的策略字段会覆盖 `mode`。旧版 `guardian_subagent` 审核者值仍作为兼容性别名被接受，但新配置应使用 `auto_review`。

## 身份验证和环境隔离

身份验证按以下顺序选择：

1. Agent 的显式 OpenClaw Codex 身份验证配置文件。
2. 该 Agent 的 Codex 主目录中 app-server 的现有账户。
3. 仅用于本地 stdio app-server 启动，当没有 app-server 账户且仍需要 OpenAI 身份验证时，依次使用 `CODEX_API_KEY`，然后是 `OPENAI_API_KEY`。

当 OpenClaw 看到 ChatGPT 订阅式 Codex 身份验证配置文件时，它会从已启动的 Codex 子进程中删除 `CODEX_API_KEY` 和 `OPENAI_API_KEY`。这使 Gateway 级别的 API 密钥可用于嵌入或直接 OpenAI 模型，而不会意外地通过 API 计费原生 Codex app-server 轮次。

显式 Codex API 密钥配置文件和本地 stdio 环境密钥回退使用 app-server 登录，而不是继承的子进程环境。WebSocket app-server 连接不接收 Gateway 环境 API 密钥回退；请使用显式身份验证配置文件或远程 app-server 自己的账户。

Stdio app-server 启动默认继承 OpenClaw 的进程环境，但 OpenClaw 拥有 Codex app-server 账户桥接，并将 `CODEX_HOME` 和 `HOME` 都设置为该 Agent 的 OpenClaw 状态下的每个 Agent 目录。Codex 自己的 Skill 加载器读取 `$CODEX_HOME/skills` 和 `$HOME/.agents/skills`，因此对于本地 app-server 启动，这两个值都是隔离的。这使 Codex 原生 Skill、Plugin、配置、账户和线程状态作用于 OpenClaw Agent，而不是从操作员的个人 Codex CLI 主目录泄漏进来。

OpenClaw Plugin 和 OpenClaw Skill 快照仍通过 OpenClaw 自己的 Plugin 注册表和 Skill 加载器流动。个人 Codex CLI 资产则不会。如果您有希望成为 OpenClaw Agent 一部分的有用 Codex CLI Skill 或 Plugin，请明确清点它们：

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

`appServer.clearEnv` 仅影响已启动的 Codex app-server 子进程。`CODEX_HOME` 和 `HOME` 在本地启动时仍保留给 OpenClaw 的每个 Agent Codex 隔离。

## 动态 Tool

Codex 动态 Tool 默认为 `searchable` 加载。OpenClaw 不暴露与 Codex 原生工作区操作重复的动态 Tool：

- `read`
- `write`
- `edit`
- `apply_patch`
- `exec`
- `process`
- `update_plan`

其余 OpenClaw 集成 Tool，如消息传递、Session、媒体、Cron、浏览器、Node、Gateway、`heartbeat_respond` 和 `web_search`，可通过 Codex Tool 搜索在 `openclaw` 命名空间下获得。这使初始模型上下文更小。`sessions_yield` 和仅消息工具源回复保持直接，因为这些是轮次控制契约。

仅在连接到无法搜索延迟动态 Tool 的自定义 Codex app-server 时，或在调试完整 Tool 载荷时，才设置 `codexDynamicToolsLoading: "direct"`。

## 超时

OpenClaw 拥有的动态 Tool 调用与 `appServer.requestTimeoutMs` 独立地有界。每个 Codex `item/tool/call` 请求按以下顺序使用第一个可用超时：

- 正的每次调用 `timeoutMs` 参数。
- 对于 `image_generate`，`agents.defaults.imageGenerationModel.timeoutMs`。
- 对于媒体理解 `image` Tool，`tools.media.image.timeoutSeconds` 转换为毫秒，或 60 秒媒体默认值。
- 30 秒动态工具默认值。

动态 Tool 预算上限为 600000 毫秒。超时时，OpenClaw 在支持的情况下中止 Tool 信号，并向 Codex 返回失败的动态工具响应，使轮次可以继续，而不是将 Session 留在 `processing` 状态。

OpenClaw 响应 Codex 轮次范围的 app-server 请求后，Harness 还期望 Codex 用 `turn/completed` 完成原生轮次。如果 app-server 在响应后静默了 `appServer.turnCompletionIdleTimeoutMs` 时间，OpenClaw 会尽力中断 Codex 轮次，记录诊断超时，并释放 OpenClaw Session 通道，使后续聊天消息不会在过时的原生轮次后排队。

对于同一轮次的任何非终端通知（包括 `rawResponseItem/completed`），都会解除该短期看门狗，因为 Codex 已证明轮次仍然处于活动状态。较长的终端看门狗继续保护真正卡住的轮次。超时诊断包括最后的 app-server 通知方法，以及对于原始助手响应项，包括项目类型、角色、id 和有界助手文本预览。

## 模型发现

默认情况下，Codex Plugin 向 app-server 询问可用模型。模型可用性由 Codex app-server 拥有，因此当 OpenClaw 升级 Bundle `@openai/codex` 版本或部署将 `appServer.command` 指向不同的 Codex 二进制文件时，列表可能会更改。可用性也可能是账户范围的。在运行中的 Gateway 上使用 `/codex models` 查看该 Harness 和账户的实时目录。

如果发现失败或超时，OpenClaw 使用以下内置回退目录：

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

当前 Bundle Harness 是 `@openai/codex` `0.130.0`。针对该 Bundle app-server 的 `model/list` 探测返回：

| 模型 id               | 默认 | 隐藏 | 输入模态    | 推理努力程度                      |
| --------------------- | ---- | ---- | ----------- | --------------------------------- |
| `gpt-5.5`             | 是   | 否   | text, image | low, medium, high, xhigh          |
| `gpt-5.4`             | 否   | 否   | text, image | low, medium, high, xhigh          |
| `gpt-5.4-mini`        | 否   | 否   | text, image | low, medium, high, xhigh          |
| `gpt-5.3-codex`       | 否   | 否   | text, image | low, medium, high, xhigh          |
| `gpt-5.3-codex-spark` | 否   | 否   | text        | low, medium, high, xhigh          |
| `gpt-5.2`             | 否   | 否   | text, image | low, medium, high, xhigh          |

隐藏模型可以由 app-server 目录针对内部或专用流程返回，但它们不是正常的模型选择器选项。

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

Codex 通过原生项目文档发现自行处理 `AGENTS.md`。OpenClaw 不写入合成 Codex 项目文档文件，也不依赖 Codex 回退文件名用于人格文件，因为 Codex 回退仅在 `AGENTS.md` 缺失时适用。

为了 OpenClaw 工作区对等，Codex Harness 会解析其他引导文件，包括 `SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`（如果存在），并在 `thread/start` 和 `thread/resume` 时通过 Codex 开发者指令转发它们。这使工作区人格和配置文件上下文在原生 Codex 行为塑造通道上可见，而不复制 `AGENTS.md`。

## 环境覆盖

环境覆盖仍可用于本地测试：

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

当 `appServer.command` 未设置时，`OPENCLAW_CODEX_APP_SERVER_BIN` 绕过托管二进制文件。

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` 已删除。请改用 `plugins.entries.codex.config.appServer.mode: "guardian"`，或使用 `OPENCLAW_CODEX_APP_SERVER_MODE=guardian` 进行一次性本地测试。配置对于可重复的部署是首选，因为它将 Plugin 行为保存在与 Codex Harness 设置其余部分相同的经过审查的文件中。

## 相关

- [Codex Harness](/plugins/codex-harness)
- [Codex Harness 运行时](/plugins/codex-harness-runtime)
- [原生 Codex Plugin](/plugins/codex-native-plugins)
- [Codex Computer Use](/plugins/codex-computer-use)
- [OpenAI Provider](/providers/openai)
- [配置参考](/gateway/configuration-reference)
