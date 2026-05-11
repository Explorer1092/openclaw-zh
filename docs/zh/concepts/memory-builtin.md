---
mmh3_hash: "78c32013a05c5d475f60fa4331d70c50"
summary: "基于 SQLite 的默认内存后端，支持关键词、向量和混合搜索"
title: "内置内存引擎"
read_when:
  - 您想了解默认内存后端
  - 您想配置嵌入 Provider 或混合搜索
---

内置引擎是默认内存后端。它将内存索引存储在每个 Agent 的 SQLite 数据库中，无需额外依赖即可开始使用。

## 提供的功能

- **关键词搜索**：通过 FTS5 全文索引（BM25 评分）。
- **向量搜索**：通过任何支持 Provider 的嵌入。
- **混合搜索**：结合两者以获得最佳结果。
- **CJK 支持**：通过三元组分词支持中文、日文和韩文。
- **sqlite-vec 加速**：用于数据库内向量查询（可选）。

## 入门

如果您有 OpenAI、Gemini、Voyage、Mistral 或 DeepInfra 的 API 密钥，内置引擎会自动检测并启用向量搜索。无需配置。

显式设置 Provider：

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

没有嵌入 Provider 时，只有关键词搜索可用。

要强制使用内置本地嵌入 Provider，请在 OpenClaw 旁边安装可选的 `node-llama-cpp` 运行时包，然后将 `local.modelPath` 指向 GGUF 文件：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "local",
        fallback: "none",
        local: {
          modelPath: "~/.node-llama-cpp/models/embeddinggemma-300m-qat-Q8_0.gguf",
        },
      },
    },
  },
}
```

## 支持的嵌入 Provider

| Provider | ID | 自动检测 | 备注 |
| --------- | ----------- | ------------- | ----------------------------------- |
| OpenAI | `openai` | 是 | 默认：`text-embedding-3-small` |
| Gemini | `gemini` | 是 | 支持多模态（图片 + 音频） |
| Voyage | `voyage` | 是 | |
| Mistral | `mistral` | 是 | |
| DeepInfra | `deepinfra` | 是 | 默认：`BAAI/bge-m3` |
| Ollama | `ollama` | 否 | 本地，需显式设置 |
| Local | `local` | 是（最先）| 可选的 `node-llama-cpp` 运行时 |

自动检测按顺序选择第一个能解析 API 密钥的 Provider。设置 `memorySearch.provider` 可覆盖。

## 索引工作原理

OpenClaw 将 `MEMORY.md` 和 `memory/*.md` 索引为块（约 400 个 token，80 个 token 重叠），并存储在每个 Agent 的 SQLite 数据库中。

- **索引位置：** `~/.openclaw/memory/<agentId>.sqlite`
- **存储维护：** SQLite WAL 附加文件通过定期和关闭时检查点来限制。
- **文件监视：** 内存文件的更改触发防抖重新索引（1.5 秒）。
- **自动重建索引：** 当嵌入 Provider、模型或分块配置发生变化时，整个索引会自动重建。
- **按需重建索引：** `openclaw memory index --force`

<Info>
您也可以使用 `memorySearch.extraPaths` 索引工作区外的 Markdown 文件。请参阅[配置参考](/reference/memory-config#additional-memory-paths)。
</Info>

## 何时使用

内置引擎适合大多数用户：

- 开箱即用，无需额外依赖。
- 关键词和向量搜索表现良好。
- 支持所有嵌入 Provider。
- 混合搜索结合了两种检索方式的优点。

如果您需要重排序、查询扩展或要索引工作区外的目录，请考虑切换到 [QMD](/concepts/memory-qmd)。

如果您需要跨 Session 内存和自动用户建模，请考虑 [Honcho](/concepts/memory-honcho)。

## 故障排除

**内存搜索已禁用？** 检查 `openclaw memory status`。如果未检测到 Provider，请显式设置一个或添加 API 密钥。

**未检测到本地 Provider？** 确认本地路径存在并运行：

```bash
openclaw memory status --deep --agent main
openclaw memory index --force --agent main
```

独立 CLI 命令和 Gateway 都使用相同的 `local` Provider ID。如果 Provider 设置为 `auto`，只有当 `memorySearch.local.modelPath` 指向现有本地文件时，才会优先考虑本地嵌入。

**结果过时？** 运行 `openclaw memory index --force` 重建。监视器在极少数情况下可能会遗漏更改。

**sqlite-vec 未加载？** OpenClaw 自动回退到进程内余弦相似度。`openclaw memory status --deep` 单独报告本地向量存储与嵌入 Provider，因此 `Vector store: unavailable` 指向 sqlite-vec 加载问题，而 `Embeddings: unavailable` 指向 Provider/认证或模型就绪问题。检查日志以了解具体加载错误。

## 配置

有关嵌入 Provider 设置、混合搜索调优（权重、MMR、时间衰减）、批量索引、多模态内存、sqlite-vec、额外路径和所有其他配置旋钮，请参阅[内存配置参考](/reference/memory-config)。

## 相关

- [内存概述](/concepts/memory)
- [内存搜索](/concepts/memory-search)
- [活跃内存](/concepts/active-memory)
