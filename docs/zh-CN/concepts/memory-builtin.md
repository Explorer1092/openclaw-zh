---
mmh3_hash: "928584fd4a197ca7408b218f986b41c7"
title: "内置记忆引擎"
summary: "默认的基于 SQLite 的记忆后端，支持关键词、向量和混合搜索"
read_when:
  - 您想了解默认记忆后端
  - 您想配置嵌入 Provider 或混合搜索
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: placeholder
  source_path: "concepts/memory-builtin.md"
  workflow: 15
---

# 内置记忆引擎

内置引擎是默认的记忆后端。它将您的记忆索引存储在每个 Agent 的 SQLite 数据库中，无需额外依赖即可开始使用。

## 提供的功能

- **关键词搜索**：通过 FTS5 全文索引（BM25 评分）。
- **向量搜索**：通过任何支持 Provider 的嵌入。
- **混合搜索**：结合两者以获得最佳结果。
- **CJK 支持**：通过 trigram 分词支持中文、日文和韩文。
- **sqlite-vec 加速**：用于数据库内向量查询（可选）。

## 入门

如果您有 OpenAI、Gemini、Voyage 或 Mistral 的 API key，内置引擎会自动检测并启用向量搜索。无需配置。

要明确设置 Provider：

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

## 支持的嵌入 Provider

| Provider | ID        | 自动检测   | 备注                               |
| -------- | --------- | ------------- | ----------------------------------- |
| OpenAI   | `openai`  | 是            | 默认：`text-embedding-3-small`     |
| Gemini   | `gemini`  | 是            | 支持多模态（图像 + 音频）           |
| Voyage   | `voyage`  | 是            |                                     |
| Mistral  | `mistral` | 是            |                                     |
| Ollama   | `ollama`  | 否            | 本地，需明确设置                    |
| Local    | `local`   | 是（首选）    | GGUF 模型，约 0.6 GB 下载           |

自动检测按显示顺序选择第一个可以解析 API key 的 Provider。设置 `memorySearch.provider` 可覆盖此行为。

## 索引工作原理

OpenClaw 将 `MEMORY.md` 和 `memory/*.md` 索引为块（约 400 个 token，80 个 token 重叠），并存储在每个 Agent 的 SQLite 数据库中。

- **索引位置：** `~/.openclaw/memory/<agentId>.sqlite`
- **文件监视：** 记忆文件的更改会触发防抖重建索引（1.5 秒）。
- **自动重建索引：** 当嵌入 Provider、模型或分块配置更改时，整个索引会自动重建。
- **按需重建索引：** `openclaw memory index --force`

<Info>
您也可以使用 `memorySearch.extraPaths` 索引工作区外的 Markdown 文件。
参见 [配置参考](/reference/memory-config#additional-memory-paths)。
</Info>

## 使用场景

内置引擎是大多数用户的正确选择：

- 无需额外依赖，开箱即用。
- 很好地处理关键词和向量搜索。
- 支持所有嵌入 Provider。
- 混合搜索结合了两种检索方法的优点。

如果您需要重排序、查询扩展或想要索引工作区外的目录，可以考虑切换到 [QMD](/concepts/memory-qmd)。

如果您想要具有自动用户建模的跨 Session 记忆，可以考虑 [Honcho](/concepts/memory-honcho)。

## 故障排除

**记忆搜索已禁用？** 运行 `openclaw memory status`。如果未检测到 Provider，请明确设置一个或添加 API key。

**结果陈旧？** 运行 `openclaw memory index --force` 重建。监视器在极少数边缘情况下可能会遗漏更改。

**sqlite-vec 未加载？** OpenClaw 会自动回退到进程内余弦相似度。检查日志以了解具体的加载错误。

## 配置

有关嵌入 Provider 设置、混合搜索调整（权重、MMR、时间衰减）、批量索引、多模态记忆、sqlite-vec、额外路径和所有其他配置选项，请参见
[记忆配置参考](/reference/memory-config)。
