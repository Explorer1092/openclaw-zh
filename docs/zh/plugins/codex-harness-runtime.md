---
mmh3_hash: "696cf71da4c4e6f644ec0da1a47fd2a5"
summary: "Codex Harness 的运行时边界、Hook、Tool、权限和诊断"
title: "Codex Harness 运行时"
read_when:
  - 您需要 Codex Harness 运行时支持契约
  - 您正在调试原生 Codex Tool、Hook、压缩或反馈上传
  - 您正在更改跨 Pi 和 Codex Harness 轮次的 Plugin 行为
---

本页记录 Codex Harness 轮次的运行时契约。有关设置和路由，请从 [Codex Harness](/plugins/codex-harness) 开始。有关配置字段，请参见 [Codex Harness 参考](/plugins/codex-harness-reference)。

## 概览

Codex 模式不是使用不同模型调用的 Pi。Codex 拥有更多原生模型循环，OpenClaw 围绕该边界调整其 Plugin、Tool、Session 和诊断界面。

OpenClaw 仍然拥有 Channel 路由、Session 文件、可见消息交付、OpenClaw 动态 Tool、审批、媒体交付和转录镜像。Codex 拥有规范原生线程、原生模型循环、原生 Tool 延续和原生压缩。

## 线程绑定和模型更改

当 OpenClaw Session 附加到现有 Codex 线程时，下一次轮次将当前选择的 OpenAI 模型、审批策略、沙箱和服务层级再次发送到 app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 保持线程绑定，但要求 Codex 使用新选择的模型继续。

## 可见回复和心跳

当源聊天轮次通过 Codex Harness 运行时，如果部署没有显式配置 `messages.visibleReplies`，可见回复默认使用 OpenClaw `message` Tool。Agent 仍然可以私下完成其 Codex 轮次；它只在调用 `message(action="send")` 时才发布到 Channel。设置 `messages.visibleReplies: "automatic"` 以保持直接聊天最终回复在旧版自动交付路径上。

Codex 心跳轮次默认也在可搜索的 OpenClaw Tool 目录中获得 `heartbeat_respond`，因此 Agent 可以记录唤醒是否应保持安静或通知，而无需在最终文本中编码该控制流。

心跳特定的主动性指导作为 Codex 协作模式开发者指令发送到心跳轮次本身。普通聊天轮次恢复 Codex 默认模式，而不是在其正常运行时提示中携带心跳理念。

## Hook 边界

Codex Harness 有三个 Hook 层：

| 层级                                  | 所有者                    | 用途                                                             |
| ------------------------------------- | ------------------------- | ---------------------------------------------------------------- |
| OpenClaw Plugin Hook                  | OpenClaw                  | 跨 Pi 和 Codex Harness 的产品/Plugin 兼容性。                   |
| Codex app-server 扩展中间件           | OpenClaw Bundle Plugin    | 围绕 OpenClaw 动态 Tool 的每轮适配器行为。                       |
| Codex 原生 Hook                       | Codex                     | Codex 生命周期和来自 Codex 配置的原生 Tool 策略。                |

OpenClaw 不使用项目或全局 Codex `hooks.json` 文件来路由 OpenClaw Plugin 行为。对于支持的原生 Tool 和权限桥接，OpenClaw 为 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入每线程 Codex 配置。

当 Codex app-server 审批已启用（即 `approvalPolicy` 不是 `"never"`）时，默认注入的原生 Hook 配置省略 `PermissionRequest`，以便 Codex 的 app-server 审核者和 OpenClaw 的审批桥接在审核后处理真实升级。操作员可以在需要兼容性 Relay 时显式将 `permission_request` 添加到 `nativeHookRelay.events`。

其他 Codex Hook（如 `SessionStart` 和 `UserPromptSubmit`）仍然是 Codex 级别的控制。它们在 v1 契约中不作为 OpenClaw Plugin Hook 暴露。

对于 OpenClaw 动态 Tool，OpenClaw 在 Codex 要求调用后执行该 Tool，因此 OpenClaw 在 Harness 适配器中触发其拥有的 Plugin 和中间件行为。对于 Codex 原生 Tool，Codex 拥有规范 Tool 记录。OpenClaw 可以镜像选定的事件，但不能重写原生 Codex 线程，除非 Codex 通过 app-server 或原生 Hook 回调暴露该操作。

压缩和 LLM 生命周期投影来自 Codex app-server 通知和 OpenClaw 适配器状态，而非原生 Codex Hook 命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是适配器级别的观察，不是 Codex 内部请求或压缩载荷的逐字节捕获。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知被投影为 `codex_app_server.hook` Agent 事件，用于轨迹和调试。它们不调用 OpenClaw Plugin Hook。

## V1 支持契约

Codex 运行时 v1 中支持的内容：

| 界面                                          | 支持                                                                             | 原因                                                                                                                                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 通过 Codex 的 OpenAI 模型循环                  | 支持                                                                             | Codex app-server 拥有 OpenAI 轮次、原生线程恢复和原生 Tool 延续。                                                                                                                         |
| OpenClaw Channel 路由和交付                    | 支持                                                                             | Telegram、Discord、Slack、WhatsApp、iMessage 和其他 Channel 保留在模型运行时之外。                                                                                                         |
| OpenClaw 动态 Tool                             | 支持                                                                             | Codex 要求 OpenClaw 执行这些 Tool，因此 OpenClaw 保留在执行路径中。                                                                                                                        |
| 提示和上下文 Plugin                            | 支持                                                                             | OpenClaw 在启动或恢复线程之前将提示覆盖层和上下文投影到 Codex 轮次中。                                                                                                                      |
| 上下文引擎生命周期                             | 支持                                                                             | Codex 轮次运行组装、摄取、轮次后维护和上下文引擎压缩协调。                                                                                                                                 |
| 动态 Tool Hook                                | 支持                                                                             | `before_tool_call`、`after_tool_call` 和工具结果中间件围绕 OpenClaw 拥有的动态 Tool 运行。                                                                                                  |
| 生命周期 Hook                                  | 作为适配器观察支持                                                                | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 使用诚实的 Codex 模式载荷触发。                                                                           |
| 最终答案修订门                                 | 通过原生 Hook Relay 支持                                                          | Codex `Stop` 被 Relay 到 `before_agent_finalize`；`revise` 要求 Codex 在最终确定之前再进行一次模型传递。                                                                                    |
| 原生 Shell、补丁和 MCP 阻止或观察              | 通过原生 Hook Relay 支持                                                          | Codex `PreToolUse` 和 `PostToolUse` 被 Relay 用于已提交的原生 Tool 界面，包括 Codex app-server `0.125.0` 或更高版本上的 MCP 载荷。支持阻止；不支持参数重写。                                  |
| 原生权限策略                                   | 通过 Codex app-server 审批和兼容性原生 Hook Relay 支持                            | Codex app-server 审批请求在 Codex 审核后通过 OpenClaw 路由。`PermissionRequest` 原生 Hook Relay 对于原生审批模式是可选的，因为 Codex 在 guardian 审核前就发出它。                              |
| App-server 轨迹捕获                            | 支持                                                                             | OpenClaw 记录发送到 app-server 的请求和接收到的 app-server 通知。                                                                                                                           |

Codex 运行时 v1 中不支持的内容：

| 界面                                                | V1 边界                                                                                                                                         | 未来路径                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 原生 Tool 参数变更                                   | Codex 原生预 Tool Hook 可以阻止，但 OpenClaw 不重写 Codex 原生 Tool 参数。                                                                      | 需要 Codex Hook/Schema 支持来替换 Tool 输入。                                          |
| 可编辑的 Codex 原生转录历史                          | Codex 拥有规范原生线程历史。OpenClaw 拥有镜像并可以投影未来上下文，但不应修改不支持的内部结构。                                                  | 如果需要原生线程手术，请添加显式 Codex app-server API。                                 |
| Codex 原生 Tool 记录的 `tool_result_persist`         | 该 Hook 转换 OpenClaw 拥有的转录写入，而非 Codex 原生 Tool 记录。                                                                               | 可以镜像转换后的记录，但规范重写需要 Codex 支持。                                       |
| 丰富的原生压缩元数据                                 | OpenClaw 观察压缩开始和完成，但不接收稳定的保留/丢弃列表、令牌增量或摘要载荷。                                                                   | 需要更丰富的 Codex 压缩事件。                                                          |
| 压缩干预                                             | 当前 OpenClaw 压缩 Hook 在 Codex 模式下是通知级别的。                                                                                           | 如果 Plugin 需要否决或重写原生压缩，请添加 Codex 预/后压缩 Hook。                       |
| 逐字节模型 API 请求捕获                              | OpenClaw 可以捕获 app-server 请求和通知，但 Codex 核心在内部构建最终 OpenAI API 请求。                                                           | 需要 Codex 模型请求跟踪事件或调试 API。                                                 |

## 原生权限和 MCP 征询

对于 `PermissionRequest`，OpenClaw 仅在策略决定时返回明确的允许或拒绝决策。无决策结果不是允许。Codex 将其视为无 Hook 决策，并回退到其自己的 guardian 或用户审批路径。

Codex app-server 审批模式默认省略此原生 Hook。当 `permission_request` 显式包含在 `nativeHookRelay.events` 中或兼容性运行时安装它时，此行为才适用。

当操作员对 Codex 原生权限请求选择 `allow-always` 时，OpenClaw 在有界 Session 窗口内记住该精确的 Provider/Session/Tool 输入/cwd 指纹。记住的决策有意仅精确匹配：更改的命令、参数、Tool 载荷或 cwd 会创建新的审批。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP Tool 审批征询通过 OpenClaw 的 Plugin 审批流程路由。Codex `request_user_input` 提示会发回到源聊天，下一个排队的后续消息会响应该原生服务器请求，而不是作为额外上下文转向。其他 MCP 征询请求关闭失败。

## 队列转向

活动运行队列转向映射到 Codex app-server `turn/steer`。使用默认的 `messages.queue.mode: "steer"`，OpenClaw 为配置的静默窗口批量处理排队的聊天消息，并按到达顺序将它们作为一个 `turn/steer` 请求发送。旧版 `queue` 模式发送单独的 `turn/steer` 请求。

Codex 审核和手动压缩轮次可以拒绝同轮次转向。在这种情况下，当所选模式允许回退时，OpenClaw 使用后续队列。请参见[转向队列](/concepts/queue-steering)。

## Codex 反馈上传

当 `/diagnostics [note]` 获得使用原生 Codex Harness 的 Session 的批准时，OpenClaw 还为相关 Codex 线程调用 Codex app-server `feedback/upload`。该上传要求 app-server 在可用时包含每个列出的线程和已启动的 Codex 子线程的日志。

上传通过 Codex 的正常反馈路径发送到 OpenAI 服务器。如果该 app-server 中禁用了 Codex 反馈，命令将返回 app-server 错误。完成的诊断回复列出了发送的线程的 Channel、OpenClaw Session id、Codex 线程 id 和本地 `codex resume <thread-id>` 命令。

如果您拒绝或忽略审批，OpenClaw 不会打印这些 Codex id，也不会发送 Codex 反馈。上传不会替换本地 Gateway 诊断导出。有关审批、隐私、本地 Bundle 和群聊行为，请参见[诊断导出](/gateway/diagnostics)。

仅在您专门需要当前附加线程的 Codex 反馈上传而不需要完整 Gateway 诊断 Bundle 时，才使用 `/codex diagnostics [note]`。

## 压缩和转录镜像

当所选模型使用 Codex Harness 时，原生线程压缩委托给 Codex app-server。OpenClaw 保留转录镜像，用于 Channel 历史、搜索、`/new`、`/reset` 和未来的模型或 Harness 切换。

镜像包括用户提示、最终助手文本，以及当 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 只记录原生压缩开始和完成信号。它还没有暴露人类可读的压缩摘要或 Codex 压缩后保留哪些条目的可审计列表。

因为 Codex 拥有规范原生线程，`tool_result_persist` 目前不重写 Codex 原生 Tool 结果记录。它仅在 OpenClaw 写入 OpenClaw 拥有的 Session 转录工具结果时适用。

## 媒体和交付

OpenClaw 继续拥有媒体交付和媒体 Provider 选择。图像、视频、音乐、PDF、TTS 和媒体理解使用匹配的 Provider/模型设置，如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

文本、图像、视频、音乐、TTS、审批和消息工具输出继续通过正常 OpenClaw 交付路径。媒体生成不需要 Pi。当 Codex 发出带有 `savedPath` 的原生图像生成项时，OpenClaw 通过正常回复媒体路径转发该确切文件，即使 Codex 轮次没有助手文本。

## 相关

- [Codex Harness](/plugins/codex-harness)
- [Codex Harness 参考](/plugins/codex-harness-reference)
- [原生 Codex Plugin](/plugins/codex-native-plugins)
- [Plugin Hook](/plugins/hooks)
- [Agent Harness Plugin](/plugins/sdk-agent-harness)
- [诊断导出](/gateway/diagnostics)
- [轨迹导出](/tools/trajectory)
