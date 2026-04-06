---
mmh3_hash: "f481034e57d09e1669e3a7bfb5295884"
title: "内存概述"
summary: "OpenClaw 如何跨 Session 记忆内容"
read_when:
  - 你想了解内存如何工作
  - 你想知道应该写哪些内存文件
---

# 内存概述

OpenClaw 通过在 Agent 工作区中写入**纯 Markdown 文件**来记忆内容。model 只"记住"保存到磁盘的内容——没有隐藏状态。

## 工作原理

你的 Agent 有三个与内存相关的文件：

- **`MEMORY.md`** — 长期内存。持久的事实、偏好和决策。在每次私信 Session 开始时加载。
- **`memory/YYYY-MM-DD.md`** — 每日笔记。运行时上下文和观察记录。今天和昨天的笔记会自动加载。
- **`DREAMS.md`**（实验性，可选）— 梦境日记和 dreaming 扫描摘要，供人类审阅。

这些文件位于 Agent workspace 中（默认 `~/.openclaw/workspace`）。

<Tip>
如果你想让 Agent 记住某些内容，直接告诉它："记住我偏好 TypeScript。"它会将其写入相应的文件。
</Tip>

## 内存工具

Agent 有两个用于处理内存的工具：

- **`memory_search`** — 使用语义搜索找到相关笔记，即使措辞与原文不同。
- **`memory_get`** — 读取特定内存文件或行范围。

两个工具都由活动内存插件（默认：`memory-core`）提供。

## 内存搜索

当配置了 embedding 提供商时，`memory_search` 使用**混合搜索**——结合向量相似性（语义含义）和关键词匹配（精确术语如 ID 和代码符号）。配置了任何受支持提供商的 API 密钥后，此功能即可开箱即用。

<Info>
OpenClaw 从可用的 API 密钥自动检测你的 embedding 提供商。如果你配置了 OpenAI、Gemini、Voyage 或 Mistral 密钥，内存搜索会自动启用。
</Info>

关于搜索工作原理、调优选项和提供商设置的详细信息，参见[内存搜索](/concepts/memory-search)。

## 内存后端

<CardGroup cols={3}>
<Card title="内置（默认）" icon="database" href="/concepts/memory-builtin">
基于 SQLite。支持关键词搜索、向量相似性和混合搜索，无需额外依赖，开箱即用。
</Card>
<Card title="QMD" icon="search" href="/concepts/memory-qmd">
本地优先的辅助程序，支持重排序、查询扩展，以及索引工作区外目录的能力。
</Card>
<Card title="Honcho" icon="brain" href="/concepts/memory-honcho">
AI 原生的跨 Session 内存，支持用户建模、语义搜索和多 Agent 感知。需要插件安装。
</Card>
</CardGroup>

## 自动内存刷新

在 [compaction](/concepts/compaction) 总结你的对话之前，OpenClaw 会运行一个静默回合，提醒 Agent 将重要上下文保存到内存文件。此功能默认开启——你不需要配置任何内容。

<Tip>
内存刷新可以防止 compaction 期间的上下文丢失。如果你的 Agent 在对话中有尚未写入文件的重要事实，它们会在总结发生之前自动保存。
</Tip>

## Dreaming（实验性）

Dreaming 是内存的可选后台整合过程。它收集短期信号，为候选项评分，并仅将符合条件的项目提升到长期内存（`MEMORY.md`）。

它旨在保持长期内存的高信噪比：

- **可选开启**：默认禁用。
- **定时执行**：启用后，`memory-core` 自动管理一个完整 dreaming 扫描的周期性定时任务。
- **有阈值限制**：升级必须通过分数、召回频率和查询多样性门控。
- **可审阅**：阶段摘要和日记条目写入 `DREAMS.md` 供人类审阅。

关于阶段行为、评分信号和梦境日记详情，参见 [Dreaming（实验性）](/concepts/dreaming)。

## CLI

```bash
openclaw memory status          # 检查索引状态和提供商
openclaw memory search "query"  # 从命令行搜索
openclaw memory index --force   # 重建索引
```

## 延伸阅读

- [内置内存引擎](/concepts/memory-builtin) — 默认 SQLite 后端
- [QMD 内存引擎](/concepts/memory-qmd) — 高级本地优先辅助程序
- [Honcho 内存](/concepts/memory-honcho) — AI 原生跨 Session 内存
- [内存搜索](/concepts/memory-search) — 搜索管道、提供商和调优
- [Dreaming（实验性）](/concepts/dreaming) — 从短期召回到长期内存的后台提升
- [内存配置参考](/reference/memory-config) — 所有配置项
- [Compaction](/concepts/compaction) — compaction 如何与内存交互
