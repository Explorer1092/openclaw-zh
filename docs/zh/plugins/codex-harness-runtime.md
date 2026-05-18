---
mmh3_hash: "91b68d3eeac30ec551fbf78deaa124a4"
summary: "Codex Harness 的运行时边界、Hook、Tool、权限和诊断"
title: "Codex Harness 运行时"
read_when:
  - 您需要了解 Codex Harness 运行时支持契约
  - 您正在调试原生 Codex Tool、Hook、Compaction 或反馈上传
  - 您正在跨 PI 和 Codex Harness 轮次更改 Plugin 行为
---

本页面记录 Codex Harness 轮次的运行时契约。有关设置和路由，请从 [Codex Harness](/plugins/codex-harness) 开始。有关配置字段，请参见 [Codex Harness 参考](/plugins/codex-harness-reference)。

## 概览

Codex 模式不是底层换了不同模型调用的 PI。Codex 拥有更多原生模型循环，而 OpenClaw 围绕该边界适配其 Plugin、Tool、Session 和诊断界面。

OpenClaw 仍然拥有 Channel 路由、Session 文件、可见消息投递、OpenClaw 动态 Tool、审批、媒体投递和转录镜像。Codex 拥有规范原生线程、原生模型循环、原生 Tool 延续，以及原生 Compaction（除非活跃的 OpenClaw 上下文引擎声明其拥有 Compaction）。

## 线程绑定和模型更改

当 OpenClaw Session 附加到现有 Codex 线程时，下一个轮次会将当前选定的 OpenAI 模型、审批策略、沙盒和服务层级再次发送到 app-server。从 `openai/gpt-5.5` 切换到 `openai/gpt-5.2` 会保持线程绑定，但要求 Codex 使用新选定的模型继续。

## 可见回复和心跳

当源 Chat 轮次通过 Codex Harness 运行时，如果部署未显式配置 `messages.visibleReplies`，可见回复默认使用 OpenClaw `message` Tool。Agent 仍然可以私下完成其 Codex 轮次；只有在调用 `message(action="send")` 时才向 Channel 发布内容。设置 `messages.visibleReplies: "automatic"` 可将直接 Chat 的最终回复保留在旧版自动投递路径上。

Codex 心跳轮次默认在可搜索的 OpenClaw Tool 目录中也获得 `heartbeat_respond`，因此 Agent 可以记录唤醒是否应保持静默或发出通知，而无需在最终文本中编码该控制流。

心跳特定的主动性指导作为 Codex 协作模式开发者指令发送到心跳轮次本身。普通 Chat 轮次会恢复 Codex 默认模式，而不是在其正常运行时提示中携带心跳策略。

## Hook 边界

Codex Harness 有三个 Hook 层：

| 层级                                   | 所有者                  | 用途                                                              |
| -------------------------------------- | ----------------------- | ----------------------------------------------------------------- |
| OpenClaw Plugin Hook                   | OpenClaw                | 跨 PI 和 Codex Harness 的产品/Plugin 兼容性。                     |
| Codex app-server 扩展中间件            | OpenClaw 捆绑 Plugin    | OpenClaw 动态 Tool 周围的每轮适配器行为。                         |
| Codex 原生 Hook                        | Codex                   | Codex 配置中的低级 Codex 生命周期和原生 Tool 策略。               |

OpenClaw 不使用项目或全局 Codex `hooks.json` 文件来路由 OpenClaw Plugin 行为。对于支持的原生 Tool 和权限桥接，OpenClaw 为 `PreToolUse`、`PostToolUse`、`PermissionRequest` 和 `Stop` 注入每线程 Codex 配置。

当 Codex app-server 审批已启用（即 `approvalPolicy` 不是 `"never"`）时，默认注入的原生 Hook 配置会省略 `PermissionRequest`，以便 Codex 的 app-server 审查者和 OpenClaw 的审批桥接在审查后处理真实上报。操作员可以在需要兼容性中继时将 `permission_request` 明确添加到 `nativeHookRelay.events`。

其他 Codex Hook（如 `SessionStart` 和 `UserPromptSubmit`）仍然是 Codex 级别的控制。它们在 V1 契约中不作为 OpenClaw Plugin Hook 暴露。

对于 OpenClaw 动态 Tool，OpenClaw 在 Codex 请求调用后执行该 Tool，因此 OpenClaw 在 Harness 适配器中触发其拥有的 Plugin 和中间件行为。对于 Codex 原生 Tool，Codex 拥有规范 Tool 记录。OpenClaw 可以镜像选定的事件，但不能重写原生 Codex 线程，除非 Codex 通过 app-server 或原生 Hook 回调暴露该操作。

Codex app-server 项目通知还为原生 Tool 完成提供异步 `after_tool_call` 观测，这些完成未被原生 `PostToolUse` 中继覆盖。这些观测仅用于遥测和 Plugin 兼容性；它们不能阻止、延迟或改变原生 Tool 调用。

Compaction 和 LLM 生命周期预测来自 Codex app-server 通知和 OpenClaw 适配器状态，而不是原生 Codex Hook 命令。OpenClaw 的 `before_compaction`、`after_compaction`、`llm_input` 和 `llm_output` 事件是适配器级别的观测，而不是逐字节捕获 Codex 内部请求或 Compaction 载荷。

Codex 原生 `hook/started` 和 `hook/completed` app-server 通知被投影为 `codex_app_server.hook` Agent 事件，用于轨迹和调试。它们不调用 OpenClaw Plugin Hook。

## V1 支持契约

Codex 运行时 V1 支持：

| 界面                                        | 支持                                         | 原因                                                                                                                                                                          |
| ------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 通过 Codex 的 OpenAI 模型循环               | 支持                                         | Codex app-server 拥有 OpenAI 轮次、原生线程恢复和原生 Tool 延续。                                                                                                             |
| OpenClaw Channel 路由和投递                 | 支持                                         | Telegram、Discord、Slack、WhatsApp、iMessage 和其他 Channel 保持在模型运行时之外。                                                                                            |
| OpenClaw 动态 Tool                          | 支持                                         | Codex 请求 OpenClaw 执行这些 Tool，因此 OpenClaw 保持在执行路径中。                                                                                                           |
| 提示和上下文 Plugin                         | 支持                                         | OpenClaw 构建提示覆盖层，并在启动或恢复线程之前将上下文投影到 Codex 轮次中。                                                                                                 |
| 上下文引擎生命周期                          | 支持                                         | 组装、摄取、轮次后维护和上下文引擎 Compaction 协调针对 Codex 轮次运行。                                                                                                       |
| 动态 Tool Hook                              | 支持                                         | `before_tool_call`、`after_tool_call` 和 Tool 结果中间件围绕 OpenClaw 拥有的动态 Tool 运行。                                                                                  |
| 生命周期 Hook                               | 作为适配器观测支持                           | `llm_input`、`llm_output`、`agent_end`、`before_compaction` 和 `after_compaction` 以诚实的 Codex 模式载荷触发。                                                               |
| 最终答案修订门                              | 通过原生 Hook 中继支持                       | Codex `Stop` 被中继到 `before_agent_finalize`；`revise` 要求 Codex 在最终确定前再进行一次模型处理。                                                                          |
| 原生 Shell、补丁和 MCP 阻止或观测           | 通过原生 Hook 中继支持                       | Codex `PreToolUse` 和 `PostToolUse` 针对已提交的原生 Tool 界面进行中继，包括 Codex app-server `0.125.0` 或更新版本上的 MCP 载荷。支持阻止；不支持参数重写。                  |
| 原生权限策略                                | 通过 Codex app-server 审批和兼容性原生 Hook 中继支持 | Codex app-server 审批请求在 Codex 审查后通过 OpenClaw 路由。`PermissionRequest` 原生 Hook 中继对原生审批模式是可选加入的，因为 Codex 在 guardian 审查之前发出它。           |
| App-server 轨迹捕获                         | 支持                                         | OpenClaw 记录发送到 app-server 的请求和接收到的 app-server 通知。                                                                                                            |

Codex 运行时 V1 不支持：

| 界面                                          | V1 边界                                                                                                         | 未来路径                                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 原生 Tool 参数变更                            | Codex 原生预 Tool Hook 可以阻止，但 OpenClaw 不重写 Codex 原生 Tool 参数。                                      | 需要 Codex Hook/Schema 支持替换 Tool 输入。                                           |
| 可编辑的 Codex 原生转录历史                   | Codex 拥有规范的原生线程历史。OpenClaw 拥有镜像并可以投影未来上下文，但不应改变不支持的内部状态。               | 如果需要原生线程手术，需添加显式 Codex app-server API。                               |
| Codex 原生 Tool 记录的 `tool_result_persist`  | 该 Hook 转换 OpenClaw 拥有的转录写入，而不是 Codex 原生 Tool 记录。                                             | 可以镜像转换后的记录，但规范重写需要 Codex 支持。                                    |
| 丰富的原生 Compaction 元数据                  | OpenClaw 观测 Compaction 开始和完成，但不接收稳定的保留/丢弃列表、Token 增量或摘要载荷。                        | 需要更丰富的 Codex Compaction 事件。                                                  |
| Compaction 干预                               | 当前 OpenClaw Compaction Hook 在 Codex 模式下是通知级别的。                                                     | 如果 Plugin 需要否决或重写原生 Compaction，需添加 Codex 预/后 Compaction Hook。       |
| 逐字节模型 API 请求捕获                       | OpenClaw 可以捕获 app-server 请求和通知，但 Codex 核心在内部构建最终的 OpenAI API 请求。                        | 需要 Codex 模型请求追踪事件或调试 API。                                               |

## 原生权限和 MCP 触发

对于 `PermissionRequest`，OpenClaw 仅在策略决定时返回明确的允许或拒绝决定。无决定结果不是允许。Codex 将其视为无 Hook 决定，并落入其自己的 guardian 或用户审批路径。

Codex app-server 审批模式默认省略此原生 Hook。当 `permission_request` 明确包含在 `nativeHookRelay.events` 中，或兼容性运行时安装了它时，此行为适用。

当操作员为 Codex 原生权限请求选择 `allow-always` 时，OpenClaw 会在有界 Session 窗口内记住该精确的 provider/session/tool 输入/cwd 指纹。记住的决定是故意的精确匹配：更改的命令、参数、Tool 载荷或 cwd 会创建新的审批。

当 Codex 将 `_meta.codex_approval_kind` 标记为 `"mcp_tool_call"` 时，Codex MCP Tool 审批触发通过 OpenClaw 的 Plugin 审批流路由。Codex `request_user_input` 提示被发送回原始 Chat，而下一个排队的后续消息会回答该原生服务器请求，而不是作为额外上下文被引导。其他 MCP 触发请求会以关闭方式失败。

## 队列引导

活跃运行队列引导映射到 Codex app-server `turn/steer`。在默认的 `messages.queue.mode: "steer"` 下，OpenClaw 在配置的静默窗口内批处理引导模式 Chat 消息，并按到达顺序将它们作为一个 `turn/steer` 请求发送。

Codex 审查和手动 Compaction 轮次可以拒绝同轮次引导。在这种情况下，OpenClaw 会等待活跃运行完成后再开始提示。当消息默认应排队而不是引导时，使用 `/queue followup` 或 `/queue collect`。请参见[引导队列](/concepts/queue-steering)。

## Codex 反馈上传

当 `/diagnostics [note]` 针对使用原生 Codex Harness 的 Session 被批准时，OpenClaw 还会为相关 Codex 线程调用 Codex app-server `feedback/upload`。上传要求 app-server 在可用时包含每个列出的线程和生成的 Codex 子线程的日志。

上传通过 Codex 的正常反馈路径进入 OpenAI 服务器。如果该 app-server 中 Codex 反馈被禁用，命令会返回 app-server 错误。已完成的诊断回复会列出 Channel、OpenClaw Session ID、Codex 线程 ID，以及发送的线程的本地 `codex resume <thread-id>` 命令。

如果您拒绝或忽略审批，OpenClaw 不会打印这些 Codex ID，也不会发送 Codex 反馈。上传不会替代本地 Gateway 诊断导出。有关审批、隐私、本地捆绑包和群聊行为，请参见[诊断导出](/gateway/diagnostics)。

仅当您专门希望当前附加线程的 Codex 反馈上传而不需要完整的 Gateway 诊断捆绑包时，才使用 `/codex diagnostics [note]`。

## Compaction 和转录镜像

当选定的模型使用 Codex Harness 时，原生线程 Compaction 委托给 Codex app-server，除非活跃的上下文引擎声明 `ownsCompaction: true`。拥有所有权的上下文引擎先进行 Compaction，并导致 OpenClaw 放弃旧的 Codex 后端线程，以便下一个轮次可以从引擎管理的上下文中重新水化新线程。OpenClaw 为 Channel 历史、搜索、`/new`、`/reset` 和未来的模型或 Harness 切换保留转录镜像。

当上下文引擎请求 Codex 线程引导投影时，OpenClaw 将 Tool 调用名称和 ID、输入形状和经过编辑的 Tool 结果内容投影到新的 Codex 线程中。它不会将原始 Tool 调用参数值复制到该投影中。

镜像包括用户提示、最终助手文本，以及 app-server 发出时的轻量级 Codex 推理或计划记录。目前，OpenClaw 仅记录原生 Compaction 开始和完成信号。它尚未暴露人类可读的 Compaction 摘要或 Codex 在 Compaction 后保留了哪些条目的可审计列表。

由于 Codex 拥有规范的原生线程，`tool_result_persist` 目前不重写 Codex 原生 Tool 结果记录。它仅在 OpenClaw 写入 OpenClaw 拥有的 Session 转录 Tool 结果时适用。

## 媒体和投递

OpenClaw 继续拥有媒体投递和媒体 Provider 选择。图像、视频、音乐、PDF、TTS 和媒体理解使用匹配的 provider/model 设置，如 `agents.defaults.imageGenerationModel`、`videoGenerationModel`、`pdfModel` 和 `messages.tts`。

文本、图像、视频、音乐、TTS、审批和消息 Tool 输出继续通过正常的 OpenClaw 投递路径。媒体生成不需要 PI。当 Codex 发出带有 `savedPath` 的原生图像生成项目时，即使 Codex 轮次没有助手文本，OpenClaw 也会通过正常的回复媒体路径转发该确切文件。

## 相关

- [Codex Harness](/plugins/codex-harness)
- [Codex Harness 参考](/plugins/codex-harness-reference)
- [原生 Codex Plugin](/plugins/codex-native-plugins)
- [Plugin Hook](/plugins/hooks)
- [Agent Harness Plugin](/plugins/sdk-agent-harness)
- [诊断导出](/gateway/diagnostics)
- [轨迹导出](/tools/trajectory)
