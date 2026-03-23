---
mmh3_hash: "47c8cff6a6b2e9676be3270c4007e4ab"
summary: "Tavily 搜索和提取工具"
read_when:
  - 需要 Tavily 支持的网页搜索
  - 需要 Tavily API 密钥
  - 希望将 Tavily 用作 web_search 提供商
  - 需要从 URL 提取内容
title: "Tavily"
---

# Tavily

OpenClaw 可以通过两种方式使用 **Tavily**：

- 作为 `web_search` 提供商
- 作为显式 Plugin 工具：`tavily_search` 和 `tavily_extract`

Tavily 是专为 AI 应用设计的搜索 API，返回针对 LLM 使用优化的结构化结果。它支持可配置的搜索深度、主题过滤、域名过滤、AI 生成的答案摘要，以及从 URL 提取内容（包括 JavaScript 渲染的页面）。

## 获取 API 密钥

1. 在 [tavily.com](https://tavily.com/) 创建 Tavily 账号。
2. 在控制面板中生成 API 密钥。
3. 将其存储在配置中或在 Gateway 环境中设置 `TAVILY_API_KEY`。

## 配置 Tavily 搜索

```json5
{
  plugins: {
    entries: {
      tavily: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "tvly-...", // 如果已设置 TAVILY_API_KEY 则可选
            baseUrl: "https://api.tavily.com",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "tavily",
      },
    },
  },
}
```

注意事项：

- 在引导程序或 `openclaw configure --section web` 中选择 Tavily 会自动启用捆绑的 Tavily Plugin。
- 将 Tavily 配置存储在 `plugins.entries.tavily.config.webSearch.*` 下。
- 使用 Tavily 的 `web_search` 支持 `query` 和 `count`（最多 20 条结果）。
- 对于 `search_depth`、`topic`、`include_answer` 或域名过滤等 Tavily 特定控制，请使用 `tavily_search`。

## Tavily Plugin 工具

### `tavily_search`

当需要 Tavily 特定的搜索控制而非通用 `web_search` 时使用此工具。

| 参数              | 描述                                                              |
| ----------------- | ----------------------------------------------------------------- |
| `query`           | 搜索查询词（保持在 400 个字符以内）                               |
| `search_depth`    | `basic`（默认，均衡）或 `advanced`（最高相关性，较慢）            |
| `topic`           | `general`（默认）、`news`（实时更新）或 `finance`                 |
| `max_results`     | 结果数量，1-20（默认：5）                                         |
| `include_answer`  | 包含 AI 生成的答案摘要（默认：false）                             |
| `time_range`      | 按时效过滤：`day`、`week`、`month` 或 `year`                      |
| `include_domains` | 限制结果来源的域名数组                                            |
| `exclude_domains` | 从结果中排除的域名数组                                            |

**搜索深度：**

| 深度       | 速度 | 相关性 | 最适合                           |
| ---------- | ---- | ------ | -------------------------------- |
| `basic`    | 较快 | 高     | 通用查询（默认）                 |
| `advanced` | 较慢 | 最高   | 精确查询、具体事实、研究         |

### `tavily_extract`

用于从一个或多个 URL 提取干净的内容。支持 JavaScript 渲染的页面，并支持针对目标提取的查询聚焦分块。

| 参数                | 描述                                                |
| ------------------- | --------------------------------------------------- |
| `urls`              | 要提取的 URL 数组（每次请求 1-20 个）               |
| `query`             | 按与此查询的相关性重新排列提取的分块                |
| `extract_depth`     | `basic`（默认，快速）或 `advanced`（适用于 JS 页面）|
| `chunks_per_source` | 每个 URL 的分块数，1-5（需要 `query`）              |
| `include_images`    | 在结果中包含图片 URL（默认：false）                 |

**提取深度：**

| 深度       | 适用场景                                  |
| ---------- | ----------------------------------------- |
| `basic`    | 简单页面 - 优先尝试                       |
| `advanced` | JS 渲染的 SPA、动态内容、表格             |

提示：

- 每次请求最多 20 个 URL。较大的列表需拆分为多次调用。
- 使用 `query` + `chunks_per_source` 仅获取相关内容，而非完整页面。
- 先尝试 `basic`；如果内容缺失或不完整，再回退到 `advanced`。

## 选择合适的工具

| 需求                               | 工具             |
| ---------------------------------- | ---------------- |
| 快速网页搜索，无特殊选项           | `web_search`     |
| 需要深度、主题、AI 答案的搜索      | `tavily_search`  |
| 从特定 URL 提取内容               | `tavily_extract` |

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Firecrawl](/tools/firecrawl) -- 搜索 + 抓取与内容提取
- [Exa Search](/tools/exa-search) -- 神经网络搜索与内容提取
