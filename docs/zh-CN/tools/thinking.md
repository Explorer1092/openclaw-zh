---
mmh3_hash: "638dc3abc03e0ca563cc90fb0ca93223"
read_when:
  - 调整思考、快速模式或详细模式指令解析或默认值时
summary: /think、/fast、/verbose 和推理可见性的指令语法
title: 思考级别
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/thinking.md
  workflow: 15
---

# 思考级别（/think 指令）

## 功能说明

- 在任何入站消息正文中使用内联指令：`/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别（别名）：`off | minimal | low | medium | high | xhigh | adaptive`
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink"（最大预算）
  - xhigh → "ultrathink+"（仅 GPT-5.2 + Codex 模型）
  - adaptive → 提供商管理的自适应推理预算（支持 Anthropic Claude 4.6 模型系列）
  - `x-high`、`x_high`、`extra-high`、`extra high` 和 `extra_high` 映射为 `xhigh`。
  - `highest`、`max` 映射为 `high`。
- 提供商说明：
  - Anthropic Claude 4.6 模型在未设置显式思考级别时默认为 `adaptive`。
  - Z.AI（`zai/*`）仅支持二元思考（`on`/`off`）。任何非 `off` 级别均视为 `on`（映射为 `low`）。
  - Moonshot（`moonshot/*`）将 `/think off` 映射为 `thinking: { type: "disabled" }`，任何非 `off` 级别映射为 `thinking: { type: "enabled" }`。当思考启用时，Moonshot 只接受 `tool_choice` `auto|none`；OpenClaw 将不兼容的值规范化为 `auto`。

## 解析优先顺序

1. 消息上的内联指令（仅适用于该条消息）。
2. Session 覆盖（通过发送仅包含指令的消息设置）。
3. 每智能体默认值（配置中的 `agents.list[].thinkingDefault`）。
4. 全局默认值（配置中的 `agents.defaults.thinkingDefault`）。
5. 回退：Anthropic Claude 4.6 模型为 `adaptive`，其他具备推理能力的模型为 `low`，否则为 `off`。

## 设置 Session 默认值

- 发送一条**仅包含**指令的消息（允许空白），例如 `/think:medium` 或 `/t high`。
- 该设置在当前 Session 中持续生效（默认按发送者）；通过 `/think:off` 或 Session 空闲重置来清除。
- 会发送确认回复（`Thinking level set to high.` / `Thinking disabled.`）。如果级别无效（例如 `/thinking big`），命令将被拒绝并给出提示，Session 状态保持不变。
- 不带参数发送 `/think`（或 `/think:`）可查看当前思考级别。

## 按智能体应用

- **内嵌 Pi**：解析后的级别传递给进程内的 Pi 智能体运行时。

## 快速模式（/fast）

- 级别：`on|off`。
- 仅包含指令的消息切换 Session 快速模式覆盖并回复 `Fast mode enabled.` / `Fast mode disabled.`。
- 不带模式发送 `/fast`（或 `/fast status`）可查看当前有效的快速模式状态。
- OpenClaw 按以下顺序解析快速模式：
  1. 内联/仅指令 `/fast on|off`
  2. Session 覆盖
  3. 每智能体默认值（`agents.list[].fastModeDefault`）
  4. 每模型配置：`agents.defaults.models["<provider>/<model>"].params.fastMode`
  5. 回退：`off`
- 对于 `openai/*`，快速模式通过在支持的 Responses 请求上发送 `service_tier=priority` 映射为 OpenAI 优先处理。
- 对于 `openai-codex/*`，快速模式在 Codex Responses 上发送相同的 `service_tier=priority` 标志。OpenClaw 在两个认证路径上保持一个共享的 `/fast` 切换。
- 对于直接公共 `anthropic/*` 请求（包括发送到 `api.anthropic.com` 的 OAuth 认证流量），快速模式映射到 Anthropic service tier：`/fast on` 设置 `service_tier=auto`，`/fast off` 设置 `service_tier=standard_only`。
- 当两者都设置时，显式的 Anthropic `serviceTier` / `service_tier` 模型参数会覆盖快速模式默认值。

## 详细模式指令（/verbose 或 /v）

- 级别：`on`（最小）| `full` | `off`（默认）。
- 仅包含指令的消息切换 Session 详细模式并回复 `Verbose logging enabled.` / `Verbose logging disabled.`；无效级别返回提示且不改变状态。
- `/verbose off` 存储一个显式的 Session 覆盖；通过 Session UI 选择 `inherit` 来清除。
- 内联指令仅影响该条消息；否则应用 Session/全局默认值。
- 不带参数发送 `/verbose`（或 `/verbose:`）可查看当前详细模式级别。
- 启用详细模式后，发出结构化工具结果的智能体（Pi 及其他 JSON 智能体）会将每个工具调用作为独立的元数据消息发回，可用时以 `<emoji> <tool-name>: <arg>` 为前缀（路径/命令）。
- 工具失败摘要在普通模式下仍然可见，但原始错误详情后缀会隐藏，除非详细模式为 `on` 或 `full`。
- 当详细模式为 `full` 时，工具输出也会在完成后转发（独立气泡，截断至安全长度）。

## 推理可见性（/reasoning）

- 级别：`on|off|stream`。
- 仅包含指令的消息切换回复中是否显示思考块。
- 启用时，推理内容作为**独立消息**发送，以 `Reasoning:` 为前缀。
- `stream`（仅 Telegram）：在回复生成期间将推理内容流式输出到 Telegram 草稿气泡中，然后发送不包含推理的最终回答。
- 别名：`/reason`。
- 不带参数发送 `/reasoning`（或 `/reasoning:`）可查看当前推理级别。
- 解析顺序：内联指令，然后是 Session 覆盖，然后是每智能体默认值（`agents.list[].reasoningDefault`），然后是回退（`off`）。

## 相关内容

- 提权模式文档位于[提权模式](/tools/elevated)。

## 心跳

- 心跳探测正文为配置的心跳提示词（默认：`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`）。
- 心跳投递默认仅包含最终负载。要同时发送单独的 `Reasoning:` 消息（如果可用），请设置 `agents.defaults.heartbeat.includeReasoning: true` 或按智能体 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI

- Web 聊天的思考选择器在页面加载时从入站 Session 存储/配置中读取并反映 Session 的已存储级别。
- 选择另一个级别仅应用于下一条消息（`thinkingOnce`）；发送后，选择器会回到已存储的 Session 级别。
- 要更改 Session 默认值，请发送 `/think:<level>` 指令（和之前一样）；选择器将在下次刷新后反映该设置。
