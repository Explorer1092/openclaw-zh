---
mmh3_hash: "fad6f3a81ac86e02e5bcf880129d2ea2"
title: "Memory"
summary: "OpenClaw memory 如何工作(workspace 文件 + 自动内存刷新)"
read_when:
  - 你想了解内存文件布局和工作流程
  - 你想调整自动预 compaction 内存刷新
---

# Memory

OpenClaw memory 是 **agent workspace 中的纯 Markdown**。文件是真相的来源;model 只"记住"写入磁盘的内容。

Memory search tools 由活动 memory plugin 提供(默认:`memory-core`)。使用 `plugins.slots.memory = "none"` 禁用 memory plugins。

## Memory 文件(Markdown)

默认 workspace 布局使用两个内存层:

- `memory/YYYY-MM-DD.md`
  - 每日日志(仅追加)。
  - 在 session 开始时读取今天 + 昨天。
- `MEMORY.md` (可选)
  - 精选的长期内存。
  - 如果 workspace 根目录下同时存在 `MEMORY.md` 和 `memory.md`,OpenClaw 会加载两者(通过 realpath 去重,因此指向同一文件的 symlinks 不会被注入两次)。
  - **仅在主要私有 session 中加载**(从不在 group contexts 中)。

这些文件位于 workspace 下(`agents.defaults.workspace`,默认 `~/.openclaw/workspace`)。参见 [Agent workspace](/concepts/agent-workspace) 了解完整布局。

## Memory tools

OpenClaw 为这些 Markdown 文件提供两个面向 agent 的工具:

- `memory_search` — 对已索引片段进行语义召回。
- `memory_get` — 对特定 Markdown 文件/行范围进行目标读取。

当文件不存在时(例如,第一次写入之前的今天的每日日志),`memory_get` 现在会**优雅降级**。内置管理器和 QMD 后端都会返回 `{ text: "", path }` 而不是抛出 `ENOENT`,因此 agent 可以处理"尚无记录"的情况,而无需将工具调用包在 try/catch 逻辑中。

## 何时写入 memory

- 决策、偏好和持久事实进入 `MEMORY.md`。
- 日常注释和运行 context 进入 `memory/YYYY-MM-DD.md`。
- 如果有人说"记住这个",写下来(不要保存在 RAM 中)。
- 这个领域仍在发展。提醒 model 存储 memories 有帮助;它会知道该怎么做。
- 如果你想让某些东西坚持,**要求 bot 将其写入** memory。

## 自动 memory flush(预 compaction ping)

当 session **接近自动 compaction** 时,OpenClaw 触发 **静默的 agentic 回合**,提醒 model 在 context 被压缩 **之前** 写入持久 memory。默认 prompts 明确说 model *可以回复*,但通常 `NO_REPLY` 是正确的响应,因此用户永远不会看到这个回合。

这由 `agents.defaults.compaction.memoryFlush` 控制:

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

详细信息:

- **软阈值**: 当 session token 估计值超过 `contextWindow - reserveTokensFloor - softThresholdTokens` 时触发 flush。
- **默认静默**: prompts 包含 `NO_REPLY`,因此不会传递任何内容。
- **两个 prompts**: 用户 prompt 加上 system prompt 附加提醒。
- **每个 compaction 周期一次 flush**(在 `sessions.json` 中跟踪)。
- **Workspace 必须可写**: 如果 session 在沙盒中运行,并且 `workspaceAccess: "ro"` 或 `"none"`,则跳过 flush。

有关完整的 compaction 生命周期,请参见 [Session management + compaction](/reference/session-management-compaction)。

## Vector memory search

OpenClaw 可以在 `MEMORY.md` 和 `memory/*.md` 上构建小型向量索引,以便语义查询即使在措辞不同时也能找到相关注释。支持混合搜索(BM25 + 向量)以结合语义匹配与精确关键词查找。

Memory search 支持多个 embedding provider(OpenAI、Gemini、Voyage、Mistral、Ollama 和本地 GGUF models)、可选的 QMD sidecar 后端用于高级检索,以及 MMR 多样性重排序和时间衰减等后处理功能。

有关完整的配置参考——包括 embedding provider 设置、QMD 后端、混合搜索调优、多模态内存和所有配置选项——请参见[内存配置参考](/reference/memory-config)。
