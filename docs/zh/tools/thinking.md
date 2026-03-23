---
title: "思考级别（/think 指令）"
sidebarTitle: "思考级别"
mmh3_hash: "117290e5e30b48e2fdf41884000c9832"
summary: "/think、/fast、/verbose 和推理可见性的指令语法"
read_when:
  - 调整 thinking、fast 模式或 verbose 指令解析或默认值
---

# 思考级别（/think 指令）

## 它做什么

- 任何入站正文中的内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink"（最大预算）
  - xhigh → "ultrathink+"（仅 GPT-5.2 + Codex 模型）
  - adaptive → Provider 管理的自适应推理预算（支持 Anthropic Claude 4.6 模型系列）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 映射到 `xhigh`。
  - `highest`、`max` 映射到 `high`。
- Provider 注意事项：
  - Anthropic Claude 4.6 模型在未设置显式 thinking 级别时默认为 `adaptive`。
  - Z.AI（`zai/*`）仅支持二进制 thinking（`on`/`off`）。任何非 `off` 级别都被视为 `on`（映射到 `low`）。
  - Moonshot（`moonshot/*`）将 `/think off` 映射到 `thinking: { type: "disabled" }`，将任何非 `off` 级别映射到 `thinking: { type: "enabled" }`。当 thinking 启用时，Moonshot 只接受 `tool_choice` 为 `auto|none`；OpenClaw 会将不兼容的值标准化为 `auto`。

## 解析顺序

1. 消息上的内联指令（仅适用于该消息）。
2. Session 覆盖（通过发送仅指令消息设置）。
3. 每 Agent 默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：Anthropic Claude 4.6 模型为 `adaptive`，其他推理能力模型为 `low`，否则为 `off`。

## 设置 Session 默认值

- 发送一条**仅**包含指令的消息（允许空格），例如 `/think:medium` 或 `/t high`。
- 对于当前 Session（默认按发送者）持久化；通过 `/think:off` 或 Session 空闲重置清除。
- 发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令被拒绝并带有提示，Session 状态保持不变。
- 发送 `/think`（或 `/think:`）不带参数以查看当前思考级别。

## 按 Agent 应用

- **嵌入式 Pi**：解析的级别传递给进程内 Pi Agent 运行时。

## 快速模式（/fast）

- 级别：`on|off`。
- 仅指令消息切换 Session 快速模式覆盖，并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 发送 `/fast`（或 `/fast status`）不带模式参数以查看当前有效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. Session 覆盖
  3. 每 Agent 默认值（`agents.list[].fastModeDefault`）
  4. 每模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式应用 OpenAI 快速配置文件：在支持时 `service_tier=priority`，加上低推理效率和低文本冗长度。
- 对于 `openai-codex/*`，快速模式在 Codex Responses 上应用相同的低延迟配置文件。OpenClaw 在两种身份验证路径之间保持一个共享的 `/fast` 切换。
- 对于直接 `anthropic/*` API 密钥请求，快速模式映射到 Anthropic 服务层：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- Anthropic 快速模式仅限 API 密钥。OpenClaw 对 Claude setup-token / OAuth 身份验证和非 Anthropic 代理基础 URL 跳过 Anthropic 服务层注入。

## 详细指令（/verbose 或 /v）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅指令消息切换 Session 详细模式并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别返回提示而不更改状态。
- `/verbose off` 存储显式 Session 覆盖；通过 Sessions UI 选择 `inherit` 清除它。
- 内联指令仅影响该消息；否则应用 Session/全局默认值。
- 发送 `/verbose`（或 `/verbose:`）不带参数以查看当前详细级别。
- 当详细模式开启时，发出结构化工具结果的 Agent（Pi、其他 JSON Agent）将每次工具调用作为自己的元数据消息发回，前缀为 `<emoji> <tool-name>: <arg>`（路径/命令可用时）。这些工具摘要在每个工具开始时立即发送（单独的气泡），而不是作为流式增量。
- 工具失败摘要在正常模式下仍然可见，但原始错误详细后缀被隐藏，除非详细模式为 `on` 或 `full`。
- 当详细模式为 `full` 时，工具输出也在完成后转发（单独的气泡，截断为安全长度）。如果您在运行进行时切换 `/verbose on|full|off`，后续工具气泡遵循新设置。

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
- 选择另一个级别仅适用于下一条消息（`thinkingOnce`）；发送后，选择器返回到存储的 Session 级别。
- 要更改 Session 默认值，发送 `/think:<level>` 指令（如前）；选择器将在下次重新加载后反映它。
