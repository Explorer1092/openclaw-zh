---
summary: "参考: 提供程序特定的转录清理和修复规则"
read_when:
  - 您正在调试与转录形状相关的提供程序请求拒绝
  - 您正在更改转录清理或工具调用修复逻辑
  - 您正在调查跨提供程序的工具调用 id 不匹配
---
# 转录卫生(提供程序修复)

本文档描述了在运行之前(构建模型上下文)应用于转录的**提供程序特定修复**。这些是**内存中**调整,用于满足严格的提供程序要求。它们**不会**重写磁盘上存储的 JSONL 转录。

范围包括:
- 工具调用 id 清理
- 工具结果配对修复
- 轮次验证 / 排序
- 思考签名清理
- 图像负载清理

如果您需要转录存储详细信息,请参见:
- [/reference/session-management-compaction](/reference/session-management-compaction)

---

## 这在哪里运行

所有转录卫生都集中在嵌入式运行器中:
- 策略选择: `src/agents/transcript-policy.ts`
- 清理/修复应用: `src/agents/pi-embedded-runner/google.ts` 中的 `sanitizeSessionHistory`

策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用什么。

---

## 全局规则: 图像清理

图像负载始终被清理以防止由于大小限制而导致提供程序端拒绝(缩小/重新压缩超大的 base64 图像)。

实现:
- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`

---

## 提供程序矩阵(当前行为)

**OpenAI / OpenAI Codex**
- 仅图像清理。
- 在模型切换到 OpenAI Responses/Codex 时,删除孤立的推理签名(没有后续内容块的独立推理项)。
- 无工具调用 id 清理。
- 无工具结果配对修复。
- 无轮次验证或重新排序。
- 无合成工具结果。
- 无思考签名剥离。

**Google(Generative AI / Gemini CLI / Antigravity)**
- 工具调用 id 清理: 严格字母数字。
- 工具结果配对修复和合成工具结果。
- 轮次验证(Gemini 风格轮次交替)。
- Google 轮次排序修复(如果历史以助手开头,则前置一个微小的用户引导)。
- Antigravity Claude: 规范化思考签名;删除未签名的思考块。

**Anthropic / Minimax(Anthropic 兼容)**
- 工具结果配对修复和合成工具结果。
- 轮次验证(合并连续的用户轮次以满足严格交替)。

**Mistral(包括基于 model-id 的检测)**
- 工具调用 id 清理: strict9(字母数字长度 9)。

**OpenRouter Gemini**
- 思考签名清理: 剥离非 base64 `thought_signature` 值(保留 base64)。

**其他所有内容**
- 仅图像清理。

---

## 历史行为(2026.1.22 之前)

在 2026.1.22 发布之前,OpenClaw 应用了多层转录卫生:

- **transcript-sanitize 扩展**在每个上下文构建时运行,可以:
  - 修复工具使用/结果配对。
  - 清理工具调用 id(包括保留 `_`/`-` 的非严格模式)。
- 运行器还执行提供程序特定的清理,这重复了工作。
- 其他变异发生在提供程序策略之外,包括:
  - 在持久化之前从助手文本中剥离 `<final>` 标签。
  - 删除空的助手错误轮次。
  - 在工具调用后修剪助手内容。

这种复杂性导致跨提供程序回归(特别是 `openai-responses`
`call_id|fc_id` 配对)。2026.1.22 清理移除了扩展,将逻辑集中在运行器中,并使 OpenAI **no-touch**(除图像清理外)。
