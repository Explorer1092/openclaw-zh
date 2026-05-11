---
mmh3_hash: "93d7f4f1fc698a57387cccc618d8f234"
summary: "参考：Provider 特定的转录清理和修复规则"
read_when:
  - 您正在调试与转录形状相关的 Provider 请求拒绝
  - 您正在更改转录清理或 Tool 调用修复逻辑
  - 您正在调查跨 Provider 的 Tool 调用 ID 不匹配
title: "转录卫生"
---

OpenClaw 在运行之前（构建模型上下文）对转录应用 **Provider 特定的修复**。这些大多数是**内存中**的调整，用于满足严格的 Provider 要求。在 Session 加载之前，还可能有一个单独的 Session 文件修复过程重写存储的 JSONL，但仅针对格式错误的行或属于无效持久化记录的持久化轮次。已交付的助手回复保留在磁盘上；Provider 特定的助手预填剥离仅在构建出站 payload 时发生。当发生修复时，原始文件会与 Session 文件一起备份。

范围包括：

- 运行时专用提示上下文不进入用户可见的转录轮次
- Tool 调用 ID 清理
- Tool 调用输入验证
- Tool 结果配对修复
- 轮次验证 / 排序
- 思考签名清理
- Thinking 签名清理
- 图像负载清理
- Provider 重放前的空文本块清理
- 用户输入溯源标记（用于跨 Session 路由的提示词）
- Bedrock Converse 重放的空助手错误轮次修复

如果您需要转录存储详细信息，请参见：

- [Session 管理深度解析](/reference/session-management-compaction)

---

## 全局规则：运行时上下文不是用户转录

运行时/系统上下文可以添加到某个轮次的模型提示中，但它不是最终用户创作的内容。OpenClaw 为 Gateway 回复、排队的后续内容、ACP、CLI 和嵌入式 Pi 运行保留了一个单独的面向转录的提示正文。存储的可见用户轮次使用该转录正文，而不是运行时丰富的提示。

对于已经持久化了运行时包装器的遗留 Session，Gateway 历史界面在向 WebChat、TUI、REST 或 SSE 客户端返回消息之前会应用显示投影。

---

## 这在哪里运行

所有转录卫生都集中在嵌入式运行器中：

- 策略选择：`src/agents/transcript-policy.ts`
- 清理/修复应用：`src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory`

策略使用 `provider`、`modelApi` 和 `modelId` 来决定应用什么。

与转录卫生分开，Session 文件在加载前会（如需要）进行修复：

- `src/agents/session-file-repair.ts` 中的 `repairSessionFileIfNeeded`
- 从 `run/attempt.ts` 和 `compact.ts`（嵌入式运行器）调用

---

## 全局规则：图像清理

图像负载始终被清理以防止由于大小限制而导致 Provider 端拒绝（缩小/重新压缩超大的 base64 图像）。

这也有助于控制支持视觉的模型的图像驱动 Token 压力。较低的最大尺寸通常减少 Token 使用；较高的尺寸保留细节。

实现：

- `src/agents/pi-embedded-helpers/images.ts` 中的 `sanitizeSessionMessagesImages`
- `src/agents/tool-images.ts` 中的 `sanitizeContentBlocksImages`
- 最大图像边长可通过 `agents.defaults.imageMaxDimensionPx` 配置（默认值：`1200`）。
- 该遍历重放内容时会移除空文本块。变为空的助手轮次从重放副本中丢弃；变为空的用户和 Tool 结果轮次会收到一个非空的省略内容占位符。

---

## 全局规则：格式错误的 Tool 调用

缺少 `input` 和 `arguments` 的助手 Tool 调用块在构建模型上下文之前会被丢弃。这可以防止因部分持久化的 Tool 调用（例如，在速率限制失败后）而导致的 Provider 拒绝。

实现：

- `src/agents/session-transcript-repair.ts` 中的 `sanitizeToolCallInputs`
- 在 `src/agents/pi-embedded-runner/replay-history.ts` 中的 `sanitizeSessionHistory` 中应用

---

## 全局规则：跨 Session 输入溯源

当 Agent 通过 `sessions_send` 向另一个 Session 发送提示词（包括 Agent 间回复/公告步骤）时，OpenClaw 使用以下内容持久化创建的用户轮次：

- `message.provenance.kind = "inter_session"`

此元数据在转录追加时写入，不会改变角色（`role: "user"` 为了 Provider 兼容性保持不变）。转录读取器可以使用此元数据来避免将路由的内部提示词视为最终用户创作的指令。

OpenClaw 还会在路由提示词文本之前预置一个同轮次的 `[Inter-session message ... isUser=false]` 标记，以便活跃的模型调用能够将外部 Session 输出与最终用户指令区分开来。该标记包含来源 Session、Channel 和 Tool（如可获取）。转录仍使用 `role: "user"` 以兼容 Provider，但可见文本和溯源元数据均将该轮次标记为跨 Session 数据。

在上下文重建期间，OpenClaw 还会对仅有溯源元数据的旧版持久化跨 Session 用户轮次应用相同的标记。

---

## Provider 矩阵（当前行为）

**OpenAI / OpenAI Codex**

- 仅图像清理。
- 对于 OpenAI Responses/Codex 转录，删除孤立的推理签名（没有后续内容块的独立推理项），并在模型路由切换后删除可重放的 OpenAI 推理。
- 保留可重放的 OpenAI Responses 推理项 payload（包括加密的空摘要项），以便手动/WebSocket 重放将所需的 `rs_*` 状态与助手输出项配对。
- Native ChatGPT Codex Responses 遵循 Codex 线路奇偶性，通过重放先前的 Responses 推理/消息/函数 payload（不含先前的 item ID）同时保留 Session `prompt_cache_key`。
- 无 Tool 调用 ID 清理。
- Tool 结果配对修复可能会移动真实匹配的输出，并为缺失的 Tool 调用合成 Codex 风格的 `aborted` 输出。
- 无轮次验证或重新排序。
- 缺失的 OpenAI Responses 系列 Tool 输出被合成为 `aborted` 以匹配 Codex 重放规范化。
- 无思考签名剥离。

**OpenAI 兼容 Chat Completions**

- 历史助手 thinking/reasoning 块在重放前被剥离，以便本地和代理式 OpenAI 兼容服务器不接收先前轮次的推理字段（如 `reasoning` 或 `reasoning_content`）。
- 当前同轮次 Tool 调用延续会将助手推理块附加到 Tool 调用，直到 Tool 结果被重放。
- 当 Provider 的线路协议需要重放推理元数据时，Provider 自有的例外情况可以选择退出。

**Google（Generative AI / Gemini CLI / Antigravity）**

- Tool 调用 ID 清理：严格字母数字。
- Tool 结果配对修复和合成 Tool 结果。
- 轮次验证（Gemini 风格轮次交替）。
- Google 轮次排序修复（如果历史以助手开头，则前置一个微小的用户引导）。
- Antigravity Claude：规范化 thinking 签名；删除未签名的 thinking 块。

**Anthropic / Minimax（Anthropic 兼容）**

- Tool 结果配对修复和合成 Tool 结果。
- 轮次验证（合并连续的用户轮次以满足严格交替）。
- 启用 thinking 时，尾随的助手预填轮次会从出站 Anthropic Messages payload 中剥离，包括 Cloudflare AI Gateway 路由。
- 缺少、空或空白重放签名的 thinking 块在 Provider 转换之前被剥离。如果这导致助手轮次为空，OpenClaw 会用非空的省略推理文本保持轮次形状。
- 必须被剥离的旧版 thinking-only 助手轮次会被替换为非空的省略推理文本，以便 Provider 适配器不会丢弃重放轮次。

**Amazon Bedrock（Converse API）**

- 空的助手流错误轮次在重放前被修复为非空的后备文本块。Bedrock Converse 拒绝 `content: []` 的助手消息，因此具有 `stopReason: "error"` 和空内容的持久化助手轮次在加载前也会在磁盘上修复。
- 仅包含空文本块的助手流错误轮次会从内存重放副本中丢弃，而不是重放无效的空块。
- 缺少、空或空白重放签名的 Claude thinking 块在 Converse 重放之前被剥离。如果这导致助手轮次为空，OpenClaw 会用非空的省略推理文本保持轮次形状。
- 必须被剥离的旧版 thinking-only 助手轮次会被替换为非空的省略推理文本，以便 Converse 重放保持严格的轮次形状。
- 重放过滤 OpenClaw 传递镜像和 Gateway 注入的助手轮次。
- 图像清理通过全局规则应用。

**Mistral（包括基于 model-id 的检测）**

- Tool 调用 ID 清理：strict9（字母数字长度 9）。

**OpenRouter Gemini**

- 思考签名清理：剥离非 base64 `thought_signature` 值（保留 base64）。

**OpenRouter Anthropic**

- 启用 reasoning 时，尾随的助手预填轮次会从已验证的 OpenRouter OpenAI 兼容 Anthropic 模型 payload 中剥离，与直接 Anthropic 和 Cloudflare Anthropic 重放行为保持一致。

**其他所有内容**

- 仅图像清理。

---

## 历史行为（2026.1.22 之前）

在 2026.1.22 发布之前，OpenClaw 应用了多层转录卫生：

- **transcript-sanitize 扩展**在每个上下文构建时运行，可以：
  - 修复 Tool 使用/结果配对。
  - 清理 Tool 调用 ID（包括保留 `_`/`-` 的非严格模式）。
- 运行器还执行 Provider 特定的清理，这重复了工作。
- 其他变异发生在 Provider 策略之外，包括：
  - 在持久化之前从助手文本中剥离 `<final>` 标签。
  - 删除空的助手错误轮次。
  - 在 Tool 调用后修剪助手内容。

这种复杂性导致跨 Provider 回归（特别是 `openai-responses` `call_id|fc_id` 配对）。2026.1.22 清理移除了扩展，将逻辑集中在运行器中，并使 OpenAI **no-touch**（除图像清理外）。

## 相关

- [Session 管理](/concepts/session)
- [Session 剪枝](/concepts/session-pruning)
