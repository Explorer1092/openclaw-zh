---
summary: "/think + /verbose 的指令语法以及它们如何影响模型推理"
read_when:
  - 调整 thinking 或 verbose 指令解析或默认值
---
# Thinking 级别(/think 指令)

## 它做什么
- 任何入站正文中的内联指令: `/t <level>`、`/think:<level>` 或 `/thinking <level>`。
- 级别(别名): `off | minimal | low | medium | high | xhigh`(仅 GPT-5.2 + Codex 模型)
  - minimal → "think"
  - low → "think hard"
  - medium → "think harder"
  - high → "ultrathink"(最大预算)
  - xhigh → "ultrathink+"(仅 GPT-5.2 + Codex 模型)
  - `highest`、`max` 映射到 `high`。
- 提供商注意事项:
  - Z.AI(`zai/*`)仅支持二进制 thinking(`on`/`off`)。任何非 `off` 级别都被视为 `on`(映射到 `low`)。

## 解析顺序
1. 消息上的内联指令(仅适用于该消息)。
2. 会话覆盖(通过发送仅指令消息设置)。
3. 全局默认值(配置中的 `agents.defaults.thinkingDefault`)。
4. 回退: 对于支持推理的模型为 low;否则为 off。

## 设置会话默认值
- 发送一条**仅**包含指令的消息(允许空格),例如 `/think:medium` 或 `/t high`。
- 这对当前会话(默认每个发送者)有效;通过 `/think:off` 或会话空闲重置清除。
- 发送确认回复(`Thinking level set to high.` / `Thinking disabled.`)。如果级别无效(例如 `/thinking big`),命令被拒绝并提示,会话状态保持不变。
- 发送不带参数的 `/think`(或 `/think:`)以查看当前的 thinking 级别。

## 按 agent 应用
- **嵌入式 Pi**: 解析的级别传递给进程内 Pi agent 运行时。

## Verbose 指令(/verbose 或 /v)
- 级别: `on`(最小) | `full` | `off`(默认)。
- 仅指令消息切换会话 verbose 并回复 `Verbose logging enabled.` / `Verbose logging disabled.`;无效级别返回提示而不更改状态。
- `/verbose off` 存储显式会话覆盖;通过 Sessions UI 选择 `inherit` 清除它。
- 内联指令仅影响该消息;否则应用会话/全局默认值。
- 发送不带参数的 `/verbose`(或 `/verbose:`)以查看当前的 verbose 级别。
- 当 verbose 开启时,发出结构化工具结果的 agent(Pi、其他 JSON agent)将每个工具调用作为其自己的仅元数据消息发送,在可用时以 `<emoji> <tool-name>: <arg>` 为前缀(路径/命令)。这些工具摘要在每个工具启动时立即发送(单独的气泡),而不是作为流式增量。
- 当 verbose 为 `full` 时,工具输出也在完成后转发(单独的气泡,截断到安全长度)。如果您在运行进行中切换 `/verbose on|full|off`,后续的工具气泡遵守新设置。

## 推理可见性(/reasoning)
- 级别: `on|off|stream`。
- 仅指令消息切换 thinking 块是否在回复中显示。
- 启用时,推理作为**单独的消息**发送,以 `Reasoning:` 为前缀。
- `stream`(仅 Telegram): 在回复生成时将推理流式传输到 Telegram 草稿气泡中,然后发送没有推理的最终答案。
- 别名: `/reason`。
- 发送不带参数的 `/reasoning`(或 `/reasoning:`)以查看当前的 reasoning 级别。

## 相关
- 提升模式文档位于 [提升模式](/tools/elevated)。

## 心跳
- 心跳探测正文是配置的心跳提示(默认: `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`)。心跳消息中的内联指令照常应用(但避免从心跳更改会话默认值)。
- 心跳投递默认仅发送最终负载。要在可用时也发送单独的 `Reasoning:` 消息,设置 `agents.defaults.heartbeat.includeReasoning: true` 或每个 agent 的 `agents.list[].heartbeat.includeReasoning: true`。

## Web 聊天 UI
- Web 聊天 thinking 选择器在页面加载时从入站会话存储/配置镜像会话的存储级别。
- 选择另一个级别仅适用于下一条消息(`thinkingOnce`);发送后,选择器会回到存储的会话级别。
- 要更改会话默认值,发送 `/think:<level>` 指令(如前所述);选择器将在下一次重新加载后反映它。

<!-- i18n-hash:85fdc75dda8f4f44e508c13392330923 -->
