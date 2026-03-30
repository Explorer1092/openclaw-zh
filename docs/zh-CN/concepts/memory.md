---
read_when:
  - 你想了解记忆的工作原理
  - 你想知道应该写入哪些记忆文件
summary: OpenClaw 跨会话记忆的工作原理
title: 记忆概览
x-i18n:
  generated_at: "2026-02-03T07:47:38Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 73ae51d5617ca6448f502df2b4cb4fb0bed86f5d6dc5576737948c4286901db6
  source_path: concepts/memory.md
  workflow: 15
---

# 记忆概览

OpenClaw 通过在智能体工作区中写入**纯 Markdown 文件**来记住事物。模型只"记住"保存到磁盘的内容——没有隐藏状态。

## 工作原理

你的智能体有两个存储记忆的地方：

- **`MEMORY.md`** — 长期记忆。持久性的事实、偏好和决策。在每次私信会话开始时加载。
- **`memory/YYYY-MM-DD.md`** — 每日笔记。运行中的上下文和观察记录。今天和昨天的笔记会自动加载。

这些文件位于智能体工作区中（默认 `~/.openclaw/workspace`）。

<Tip>
如果你想让智能体记住某件事，直接告诉它："记住我更喜欢 TypeScript。"它会将其写入相应的文件。
</Tip>

## 记忆工具

智能体有两个用于处理记忆的工具：

- **`memory_search`** — 使用语义搜索查找相关笔记，即使措辞与原文不同也能找到。
- **`memory_get`** — 读取特定的记忆文件或指定行范围。

这两个工具由活动的记忆插件提供（默认：`memory-core`）。

## 记忆搜索

当配置了 Embedding 提供商时，`memory_search` 使用**混合搜索**——将向量相似度（语义含义）与关键词匹配（ID 和代码符号等精确术语）相结合。只要为任何支持的提供商配置了 API 密钥，即可开箱即用。

<Info>
OpenClaw 会从可用的 API 密钥自动检测你的 Embedding 提供商。如果你配置了 OpenAI、Gemini、Voyage 或 Mistral 密钥，记忆搜索会自动启用。
</Info>

有关搜索工作原理、调优选项和提供商设置的详细信息，请参阅[记忆搜索](/concepts/memory-search)。

## 记忆后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/concepts/memory-builtin">
基于 SQLite。开箱即用，支持关键词搜索、向量相似度和混合搜索。无需额外依赖。
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
本地优先的 sidecar，支持重排序、查询扩展，以及索引工作区外目录的能力。
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
AI 原生的跨会话记忆，支持用户建模、语义搜索和多智能体感知。需要插件安装。
</Card>
</CardGroup>

## 自动记忆刷写

在[压缩](/concepts/compaction)总结对话之前，OpenClaw 会运行一个静默轮次，提醒智能体将重要上下文保存到记忆文件。此功能默认开启——无需任何配置。

<Tip>
记忆刷写可防止压缩时的上下文丢失。如果你的智能体在对话中有尚未写入文件的重要事实，它们将在摘要生成之前自动保存。
</Tip>

## CLI

```bash
openclaw memory status          # 检查索引状态和提供商
openclaw memory search "query"  # 从命令行搜索
openclaw memory index --force   # 重建索引
```

## 延伸阅读

- [内置记忆引擎](/concepts/memory-builtin) — 默认 SQLite 后端
- [QMD 记忆引擎](/concepts/memory-qmd) — 高级本地优先 sidecar
- [Honcho 记忆](/concepts/memory-honcho) — AI 原生跨会话记忆
- [记忆搜索](/concepts/memory-search) — 搜索管道、提供商和调优
- [记忆配置参考](/reference/memory-config) — 所有配置选项
- [压缩](/concepts/compaction) — 压缩如何与记忆交互
