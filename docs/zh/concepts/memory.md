---
mmh3_hash: "c9f1dd76dbde0bf073e405710d150f3d"
summary: "OpenClaw 如何跨 Session 记忆事物"
title: "内存概述"
read_when:
  - 您想了解内存的工作原理
  - 您想知道该写什么内存文件
---

OpenClaw 通过在 Agent 的工作区中写入**纯 Markdown 文件**来记住事物。模型只"记住"保存到磁盘的内容——没有隐藏状态。

## 工作原理

您的 Agent 有三个与内存相关的文件：

- **`MEMORY.md`**——长期内存。持久事实、偏好和决策。在每次 DM Session 开始时加载。
- **`memory/YYYY-MM-DD.md`**（或 **`memory/YYYY-MM-DD-<slug>.md`**）——每日笔记。运行上下文和观察。今天和昨天的笔记会自动加载，由捆绑 Session 内存 Hook 在 `/new` 或 `/reset` 时写入的带 slug 变体现在也与仅日期文件一起被提取。
- **`DREAMS.md`**（可选）——梦境日记和 dreaming 扫描摘要，供人类审查，包括有据可查的历史回填条目。

这些文件位于 Agent 工作区（默认 `~/.openclaw/workspace`）。

## 写入位置

`MEMORY.md` 是紧凑的、精选的层。用于持久事实、偏好、持续决策和简短摘要，这些应在每次主要私人 Session 开始时可用。它不适合作为原始记录、每日日志或详尽的存档。

`memory/YYYY-MM-DD.md` 文件是工作层。用于详细每日笔记、观察、Session 摘要以及以后可能仍有用的原始上下文。这些文件为 `memory_search` 和 `memory_get` 建立索引，但不会在每次轮次的普通启动提示词中注入。

随着时间推移，Agent 应将每日笔记中的有用材料提炼到 `MEMORY.md` 中，并删除过时的长期条目。生成的工作区指令和心跳流程可以定期执行此操作；您不需要手动编辑 `MEMORY.md` 来记录每个细节。

如果 `MEMORY.md` 超过启动文件预算，OpenClaw 保持磁盘上的文件完整，但截断注入到模型上下文中的副本。将此视为信号：将详细材料移回 `memory/*.md`，仅在 `MEMORY.md` 中保留持久摘要，或者如果您明确想要花费更多提示词预算，则提高启动限制。使用 `/context list`、`/context detail` 或 `openclaw doctor` 查看原始大小与注入大小以及截断状态。

<Tip>
如果您想让 Agent 记住某件事，只需询问它："记住我更喜欢 TypeScript。"它会将其写入适当的文件。
</Tip>

## 推断的承诺

某些未来的后续事项不是持久事实。如果您提到明天有面试，有用的内存可能是"面试后检入"，而非"永久存储在 `MEMORY.md` 中"。

[承诺](/concepts/commitments)是这种情况下的可选短期后续内存。OpenClaw 在隐藏的后台通道中推断它们，将其限定在相同的 Agent 和 Channel，并通过心跳传递到期的检入。显式提醒仍使用[计划任务](/automation/cron-jobs)。

## 内存工具

Agent 有两个用于内存的工具：

- **`memory_search`**——使用语义搜索查找相关笔记，即使措辞与原始内容不同。
- **`memory_get`**——读取特定内存文件或行范围。

两个工具都由活跃内存插件（默认：`memory-core`）提供。

## Memory Wiki 配套插件

如果您希望持久内存的行为更像维护的知识库而非原始笔记，请使用捆绑的 `memory-wiki` 插件。

`memory-wiki` 将持久知识编译为 wiki 存储库，包含：

- 确定性页面结构
- 结构化声明和证据
- 矛盾和新鲜度追踪
- 生成的仪表板
- 供 Agent/运行时使用的编译摘要
- wiki 原生工具，如 `wiki_search`、`wiki_get`、`wiki_apply` 和 `wiki_lint`

它不替代活跃内存插件。活跃内存插件仍拥有召回、升级和 dreaming。`memory-wiki` 在其旁边添加一个具有来源追溯的知识层。

请参阅 [Memory Wiki](/plugins/memory-wiki)。

## 内存搜索

当配置了嵌入 Provider 时，`memory_search` 使用**混合搜索**——结合向量相似性（语义含义）和关键词匹配（精确术语如 ID 和代码符号）。一旦您为任何支持的 Provider 配置了 API 密钥，这就会开箱即用。

<Info>
OpenClaw 从可用 API 密钥自动检测您的嵌入 Provider。如果您配置了 OpenAI、Gemini、Voyage 或 Mistral 密钥，内存搜索会自动启用。
</Info>

有关搜索工作原理、调整选项和 Provider 设置的详细信息，请参阅[内存搜索](/concepts/memory-search)。

## 内存后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/concepts/memory-builtin">
基于 SQLite。开箱即用，支持关键词搜索、向量相似性和混合搜索。无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
本地优先辅助程序，支持重排序、查询扩展以及索引工作区外目录的能力。
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
AI 原生的跨 Session 内存，支持用户建模、语义搜索和多 Agent 感知。需安装插件。
</Card>
<Card title="LanceDB" icon="layers" href="/plugins/memory-lancedb">
捆绑的 LanceDB 支持的内存，具有 OpenAI 兼容嵌入、自动召回、自动捕获和本地 Ollama 嵌入支持。
</Card>
</CardGroup>

## 知识 wiki 层

<CardGroup cols={1}>
<Card title="Memory Wiki" icon="book" href="/plugins/memory-wiki">
将持久内存编译为具有声明、仪表板、桥接模式和 Obsidian 友好工作流的具有来源追溯的 wiki 存储库。
</Card>
</CardGroup>

## 自动内存刷新

在[压缩](/concepts/compaction)总结您的对话之前，OpenClaw 运行一个静默轮次，提醒 Agent 将重要上下文保存到内存文件。这是默认开启的——您不需要配置任何内容。

要在本地模型上保持该清理轮次，请设置精确的内存刷新模型覆盖：

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "memoryFlush": {
          "model": "ollama/qwen3:8b"
        }
      }
    }
  }
}
```

覆盖仅适用于内存刷新轮次，不继承活跃 Session 的回退链。

<Tip>
内存刷新防止压缩期间的上下文丢失。如果您的 Agent 在对话中有尚未写入文件的重要事实，它们会在摘要发生前自动保存。
</Tip>

## Dreaming

Dreaming 是内存的可选后台整合通道。它收集短期信号，对候选项评分，仅将合格的项目升级到长期内存（`MEMORY.md`）。

它旨在保持长期内存高信噪比：

- **可选**：默认禁用。
- **计划**：启用后，`memory-core` 自动管理一个用于完整 dreaming 扫描的定期 Cron 任务。
- **有阈值**：升级必须通过评分、召回频率和查询多样性门控。
- **可审查**：阶段摘要和日记条目写入 `DREAMS.md` 供人类审查。

有关阶段行为、评分信号和梦境日记详情，请参阅 [Dreaming](/concepts/dreaming)。

## 有据可查的回填和实时升级

dreaming 系统现在有两个密切相关的审查通道：

- **实时 dreaming** 从 `memory/.dreams/` 下的短期 dreaming 存储运行，这是普通 Deep 阶段在决定哪些内容可以升级到 `MEMORY.md` 时使用的。
- **有据可查的回填**将历史 `memory/YYYY-MM-DD.md` 笔记作为独立的日期文件读取，并将结构化审查输出写入 `DREAMS.md`。

当您想重放旧笔记并检查系统认为哪些内容是持久的，而无需手动编辑 `MEMORY.md` 时，有据可查的回填很有用。

当您使用：

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

有据可查的持久候选项不会直接升级。它们被暂存到普通 Deep 阶段已使用的相同短期 dreaming 存储中。这意味着：

- `DREAMS.md` 保持作为人类审查界面。
- 短期存储保持作为机器端排名界面。
- `MEMORY.md` 仍仅由深度升级写入。

如果您认为重放没有用，可以删除暂存的产物，而不影响普通日记条目或正常召回状态：

```bash
openclaw memory rem-backfill --rollback
openclaw memory rem-backfill --rollback-short-term
```

## CLI

```bash
openclaw memory status          # 检查索引状态和 Provider
openclaw memory search "query"  # 从命令行搜索
openclaw memory index --force   # 重建索引
```

## 延伸阅读

- [内置内存引擎](/concepts/memory-builtin)：默认 SQLite 后端。
- [QMD 内存引擎](/concepts/memory-qmd)：高级本地优先辅助程序。
- [Honcho 内存](/concepts/memory-honcho)：AI 原生跨 Session 内存。
- [内存 LanceDB](/plugins/memory-lancedb)：具有 OpenAI 兼容嵌入的 LanceDB 支持插件。
- [Memory Wiki](/plugins/memory-wiki)：编译知识存储库和 wiki 原生工具。
- [内存搜索](/concepts/memory-search)：搜索管道、Provider 和调整。
- [Dreaming](/concepts/dreaming)：从短期召回到长期内存的后台升级。
- [内存配置参考](/reference/memory-config)：所有配置旋钮。
- [压缩](/concepts/compaction)：压缩如何与内存交互。

## 相关

- [活跃内存](/concepts/active-memory)
- [内存搜索](/concepts/memory-search)
- [内置内存引擎](/concepts/memory-builtin)
- [Honcho 内存](/concepts/memory-honcho)
- [内存 LanceDB](/plugins/memory-lancedb)
- [承诺](/concepts/commitments)
