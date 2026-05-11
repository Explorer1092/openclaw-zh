---
title: "思考级别（/think 指令）"
sidebarTitle: "思考级别"
mmh3_hash: "e1b71eec10ce1b86c49a4cd362e03817"
summary: "/think、/fast、/verbose、/trace 和推理可见性的指令语法"
read_when:
  - 调整 thinking、fast 模式或 verbose 指令解析或默认值
---

## 它做什么

- 任何入站正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive | max`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink"（最大预算）
  - xhigh → "ultrathink+"（GPT-5.2+ 和 Codex 模型，以及 Anthropic Claude Opus 4.7 effort）
  - adaptive → Provider 管理的自适应推理（支持 Anthropic/Bedrock 上的 Claude 4.6、Anthropic Claude Opus 4.7 和 Google Gemini 动态 thinking）
  - max → Provider 最大推理（Anthropic Claude Opus 4.7；Ollama 将其映射到最高原生 `think` effort）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 映射到 `xhigh`。
  - `highest` 映射到 `high`。
- Provider 注意事项：
  - Thinking 菜单和选择器由 Provider 配置文件驱动。Provider Plugin 声明所选模型的确切级别集，包括二进制 `on` 等标签。
  - `adaptive`、`xhigh` 和 `max` 仅对支持它们的 Provider/模型配置文件进行宣传。不支持级别的类型化指令会被拒绝并显示该模型的有效选项。
  - 现有存储的不支持级别由 Provider 配置文件等级重新映射。`adaptive` 在非自适应模型上回退到 `medium`，而 `xhigh` 和 `max` 回退到所选模型最大支持的非 `off` 级别。
  - Anthropic Claude 4.6 模型在未设置显式 thinking 级别时默认为 `adaptive`。
  - Anthropic Claude Opus 4.7 不默认为自适应 thinking。其 API effort 默认值由 Provider 所有，除非您显式设置 thinking 级别。
  - Anthropic Claude Opus 4.7 将 `/think xhigh` 映射到自适应 thinking 加 `output_config.effort: "xhigh"`，因为 `/think` 是 thinking 指令，而 `xhigh` 是 Opus 4.7 的 effort 设置。
  - Anthropic Claude Opus 4.7 还开放 `/think max`；它映射到相同的 Provider 所有最大 effort 路径。
  - 直接 DeepSeek V4 模型开放 `/think xhigh|max`；两者都映射到 DeepSeek `reasoning_effort: "max"`，较低的非 `off` 级别映射到 `high`。
  - OpenRouter 路由的 DeepSeek V4 模型开放 `/think xhigh`，并发送 OpenRouter 支持的 `reasoning_effort` 值。存储的 `max` 覆盖回退到 `xhigh`。
  - 支持 thinking 的 Ollama 模型开放 `/think low|medium|high|max`；`max` 映射到原生 `think: "high"`，因为 Ollama 的原生 API 接受 `low`、`medium` 和 `high` effort 字符串。
  - OpenAI GPT 模型通过特定模型的 Responses API effort 支持映射 `/think`。`/think off` 仅在目标模型支持时发送 `reasoning.effort: "none"`；否则 OpenClaw 省略禁用的推理负载，而不是发送不支持的值。
  - 自定义 OpenAI 兼容目录条目可通过将 `models.providers.<provider>.models[].compat.supportedReasoningEfforts` 设置为包含 `"xhigh"` 来选择开放 `/think xhigh`。这使用与映射出站 OpenAI reasoning effort 有效负载相同的兼容元数据，因此菜单、Session 验证、Agent CLI 和 `llm-task` 与传输行为保持一致。
  - 过时的已配置 OpenRouter Hunter Alpha 引用跳过代理推理注入，因为该已停用路由可能通过推理字段返回最终答案文本。
  - Google Gemini 将 `/think adaptive` 映射到 Gemini 的 Provider 所有动态 thinking。Gemini 3 请求省略固定的 `thinkingLevel`，而 Gemini 2.5 请求发送 `thinkingBudget: -1`；固定级别仍然映射到该模型系列最近的 Gemini `thinkingLevel` 或预算。
  - MiniMax（`minimax/*`）在 Anthropic 兼容流式路径上默认为 `thinking: { type: "disabled" }`，除非您在模型参数或请求参数中显式设置 thinking。这避免了 MiniMax 非原生 Anthropic 流格式的 `reasoning_content` 增量泄漏。
  - Z.AI（`zai/*`）仅支持二进制 thinking（`on`/`off`）。任何非 `off` 级别都被视为 `on`（映射到 `low`）。
  - Moonshot（`moonshot/*`）将 `/think off` 映射到 `thinking: { type: "disabled" }`，将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。当 thinking 启用时，Moonshot 只接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值标准化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅适用于该消息）。
2. Session 覆盖（通过发送仅指令消息设置）。
3. 每 Agent 默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：可用时使用 Provider 声明的默认值；否则具有推理能力的模型解析为 `medium` 或该模型最近支持的非 `off` 级别，不具有推理能力的模型保持 `off`。

## 设置 Session 默认值

- 发送一条**仅**包含指令的消息（允许空格），例如 `/think:medium` 或 `/t high`。
- 对于当前 Session（默认按发送者）持久化。使用 `/think default` 清除 Session 覆盖并继承配置/Provider 默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- `/think off` 存储显式的关闭覆盖。它会禁用 thinking，直到您更改或清除 Session 覆盖。
- 发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令被拒绝并带有提示，Session 状态保持不变。
- 发送 `/think`（或 `/think:`）不带参数以查看当前思考级别。

## 按 Agent 应用

- **嵌入式 Pi**：解析的级别传递给进程内 Pi Agent 运行时。
- **Claude CLI 后端**：非 `off` 级别在使用 `claude-cli` 时作为 `--effort` 传递给 Claude Code；参见 [CLI 后端](/gateway/cli-backends)。

## 快速模式（/fast）

- 级别：`on|off|default`。
- 仅指令消息切换 Session 快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。使用 `/fast default` 清除 Session 覆盖并继承配置默认值；别名包括 `inherit`、`clear`、`reset` 和 `unpin`。
- 发送 `/fast`（或 `/fast status`）不带模式参数以查看当前有效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. Session 覆盖
  3. 每 Agent 默认值（`agents.list[].fastModeDefault`）
  4. 每模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式通过在支持的 Responses 请求上发送 `service_tier=priority` 映射到 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式在 Codex Responses 上发送相同的 `service_tier=priority` 标志。OpenClaw 在两种身份验证路径之间保持一个共享的 `/fast` 切换。
- 对于直接公共 `anthropic/*` 请求（包括发送到 `api.anthropic.com` 的 OAuth 认证流量），快速模式映射到 Anthropic 服务层：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 对于 Anthropic 兼容路径上的 `minimax/*`，`/fast on`（或 `params.fastMode: true`）将 `MiniMax-M2.7` 改写为 `MiniMax-M2.7-highspeed`。
- 显式 Anthropic `serviceTier` / `service_tier` 模型参数在同时设置时覆盖快速模式默认值。对于非 Anthropic 代理基础 URL，OpenClaw 仍然跳过 Anthropic 服务层注入。
- `/status` 仅在快速模式启用时显示 `Fast`。

## 详细指令（/verbose 或 /v）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅指令消息切换 Session 详细模式并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别返回提示而不更改状态。
- `/verbose off` 存储显式 Session 覆盖；通过 Sessions UI 选择 `inherit` 清除它。
- 内联指令仅影响该消息；否则应用 Session/全局默认值。
- 发送 `/verbose`（或 `/verbose:`）不带参数以查看当前详细级别。
- 当详细模式开启时，发出结构化工具结果的 Agent（Pi、其他 JSON Agent）将每次工具调用作为自己的元数据消息发回，前缀为 `<emoji> <tool-name>: <arg>`（路径/命令可用时）。这些工具摘要在每个工具开始时立即发送（单独的气泡），而不是作为流式增量。
- 工具失败摘要在正常模式下仍然可见，但原始错误详细后缀被隐藏，除非详细模式为 `on` 或 `full`。
- 当详细模式为 `full` 时，工具输出也在完成后转发（单独的气泡，截断为安全长度）。如果您在运行进行时切换 `/verbose on|full|off`，后续工具气泡遵循新设置。

## Plugin 跟踪指令（/trace）

- 级别：`on` | `off`（默认）。
- 仅指令消息切换 Session Plugin 跟踪输出并回复 `Plugin trace enabled.` / `Plugin trace disabled.`。
- 内联指令仅影响该消息；否则应用 Session/全局默认值。
- 发送 `/trace`（或 `/trace:`）不带参数以查看当前跟踪级别。
- `/trace` 比 `/verbose` 范围更窄：它只显示 Plugin 拥有的跟踪/调试行，例如 Active Memory 调试摘要。
- 跟踪行可以出现在 `/status` 中，以及在正常助手回复之后作为跟进诊断消息。

## 推理可见性（/reasoning）

- 级别：`on|off|stream`。
- 仅指令消息切换是否在回复中显示思考块。
- 启用时，推理以**单独消息**形式发送，前缀为 `Reasoning:`。
- `stream`（仅限 Telegram）：在生成回复时将推理流式传输到 Telegram 草稿气泡中，然后发送没有推理的最终答案。
- 别名：`/reason`。
- 发送 `/reasoning`（或 `/reasoning:`）不带参数以查看当前推理级别。
- 解析顺序：内联指令，然后 Session 覆盖，然后每 Agent 默认值（`agents.list[].reasoningDefault`），然后回退（`off`）。

## 相关

- 提升模式文档位于 [提升模式](/tools/elevated)。

## 心跳

- 心跳探测正文是配置的心跳提示（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。心跳消息中的内联指令照常应用（但避免从心跳中更改 Session 默认值）。
- 心跳投递默认仅为最终有效负载。要同时发送单独的 `Reasoning:` 消息（可用时），设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个 Agent 的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- 网络聊天思考选择器在页面加载时从入站 Session 存储/配置中镜像 Session 的存储级别。
- 选择另一个级别通过 `sessions.patch` 立即写入 Session 覆盖；它不等待下次发送，也不是一次性的 `thinkingOnce` 覆盖。
- 第一个选项始终是 clear-override 选项。当 Session 继承非 `off` 的有效默认值时显示 `Inherited: <resolved level>`，当继承的 thinking 被禁用时显示 `Off`。
- 选择器使用 Gateway Session 行/默认值返回的 `thinkingLevels`，`thinkingOptions` 保留为遗留标签列表。浏览器 UI 不保留自己的 Provider 正则表达式列表；Plugin 拥有特定模型的级别集。
- `/think:<level>` 仍然有效并更新相同的存储 Session 级别，因此聊天指令和选择器保持同步。

## Provider 配置文件

- Provider Plugin 可以暴露 `resolveThinkingProfile(ctx)` 来定义模型支持的级别和默认值。
- 代理 Claude 模型的 Provider Plugin 应复用 `openclaw/plugin-sdk/provider-model-shared` 中的 `resolveClaudeThinkingProfile(modelId)`，以使直接 Anthropic 和代理目录保持一致。
- 每个配置文件级别都有存储的规范 `id`（`off`、`minimal`、`low`、`medium`、`high`、`xhigh`、`adaptive` 或 `max`），并可能包含显示 `label`。二进制 Provider 使用 `{ id: "low", label: "on" }`。
- 需要验证显式 thinking 覆盖的工具 Plugin 应使用 `api.runtime.agent.resolveThinkingPolicy({ provider, model })` 加 `api.runtime.agent.normalizeThinkingLevel(...)`；它们不应保留自己的 Provider/模型级别列表。
- 可访问已配置自定义模型元数据的工具 Plugin 可以将 `catalog` 传入 `resolveThinkingPolicy`，以便 `compat.supportedReasoningEfforts` 选择在 Plugin 端验证中得到反映。
- 已发布的遗留钩子（`supportsXHighThinking`、`isBinaryThinking` 和 `resolveDefaultThinkingLevel`）保留为兼容性适配器，但新的自定义级别集应使用 `resolveThinkingProfile`。
- Gateway 行/默认值暴露 `thinkingLevels`、`thinkingOptions` 和 `thinkingDefault`，以便 ACP/聊天客户端渲染运行时验证使用的相同配置文件 ID 和标签。
