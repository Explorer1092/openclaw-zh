---
mmh3_hash: "928584fd4a197ca7408b218f986b41c7"
title: "内置内存引擎"
summary: "默认的基于 SQLite 的内存后端，支持关键词、向量和混合搜索"
read_when:
  - 你想了解默认内存后端
  - 你想配置 embedding 提供商或混合搜索
---

# 内置内存引擎

内置引擎是默认的内存后端。它将内存索引存储在每个 Agent 的 SQLite 数据库中，无需任何额外依赖即可开始使用。

## 提供的功能

- **关键词搜索**：通过 FTS5 全文索引（BM25 评分）。
- **向量搜索**：通过任何支持的提供商的 embedding。
- **混合搜索**：结合两者以获得最佳结果。
- **CJK 支持**：通过三元组分词，支持中文、日文和韩文。
- **sqlite-vec 加速**：用于数据库内向量查询（可选）。

## 入门指南

如果你有 OpenAI、Gemini、Voyage 或 Mistral 的 API 密钥，内置引擎会自动检测并启用向量搜索，无需任何配置。

显式设置提供商：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
      },
    },
  },
}
```

没有 embedding 提供商时，只有关键词搜索可用。

## 支持的 embedding 提供商

| 提供商   | ID        | 自动检测 | 备注                                |
| -------- | --------- | -------- | ----------------------------------- |
| OpenAI   | `openai`  | 是       | 默认：`text-embedding-3-small`      |
| Gemini   | `gemini`  | 是       | 支持多模态（图像 + 音频）           |
| Voyage   | `voyage`  | 是       |                                     |
| Mistral  | `mistral` | 是       |                                     |
| Ollama   | `ollama`  | 否       | 本地，需显式设置                    |
| 本地     | `local`   | 是（优先）| GGUF 模型，约 0.6 GB 下载           |

自动检测会按照显示顺序选取第一个可解析 API 密钥的提供商。设置 `memorySearch.provider` 可覆盖此行为。

## 索引工作原理

OpenClaw 将 `MEMORY.md` 和 `memory/*.md` 分块（约 400 个 token，80 token 重叠），并将其存储在每个 Agent 的 SQLite 数据库中。

- **索引位置：** `~/.openclaw/memory/<agentId>.sqlite`
- **文件监视：** 内存文件变更会触发去抖重新索引（1.5 秒）。
- **自动重新索引：** 当 embedding 提供商、模型或分块配置变更时，整个索引会自动重建。
- **按需重新索引：** `openclaw memory index --force`

<Info>
你也可以通过 `memorySearch.extraPaths` 索引工作区外的 Markdown 文件。参见[配置参考](/reference/memory-config#additional-memory-paths)。
</Info>

## 适用场景

内置引擎适合大多数用户：

- 无需额外依赖，开箱即用。
- 关键词和向量搜索效果良好。
- 支持所有 embedding 提供商。
- 混合搜索结合了两种检索方式的优点。

如果你需要重排序、查询扩展，或希望索引工作区外的目录，可考虑切换到 [QMD](/concepts/memory-qmd)。

如果你想要跨 Session 内存并自动构建用户模型，可考虑 [Honcho](/concepts/memory-honcho)。

## 故障排除

**内存搜索已禁用？** 运行 `openclaw memory status` 检查。如果未检测到提供商，请显式设置或添加 API 密钥。

**结果过时？** 运行 `openclaw memory index --force` 重建。监视器在极少数情况下可能遗漏变更。

**sqlite-vec 加载失败？** OpenClaw 会自动回退到进程内余弦相似度计算。检查日志以获取具体加载错误。

## 配置

关于 embedding 提供商设置、混合搜索调优（权重、MMR、时间衰减）、批量索引、多模态内存、sqlite-vec、额外路径及所有其他配置项，请参见[内存配置参考](/reference/memory-config)。
