---
mmh3_hash: "55e8cf0ab758d27e9841649cf9c22912"
title: "Brave Search API（旧版路径）"
summary: "用于 web_search 的 Brave Search API 设置"
read_when:
  - 您想使用 Brave Search 进行 web_search
  - 您需要 BRAVE_API_KEY 或计划详细信息
---

# Brave Search API

OpenClaw 支持 Brave Search API 作为 `web_search` 提供程序。

## 获取 API 密钥

1. 在 [https://brave.com/search/api/](https://brave.com/search/api/) 创建 Brave Search API 账户
2. 在仪表板中，选择 **Search** 计划并生成 API 密钥。
3. 将密钥存储在配置中或在 Gateway 环境中设置 `BRAVE_API_KEY`。

## 配置示例

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // 或 "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

Provider 特定的 Brave 搜索设置现在位于 `plugins.entries.brave.config.webSearch.*` 下。
旧版 `tools.web.search.apiKey` 仍通过兼容性垫片加载，但它不再是规范的配置路径。

`webSearch.mode` 控制 Brave 传输方式：

- `web`（默认）：带标题、URL 和摘要的普通 Brave 网络搜索
- `llm-context`：Brave LLM Context API，带预提取的文本块和来源，用于基础化

## 工具参数

| 参数 | 描述 |
| ------------- | ------------------------------------------------------------------- |
| `query` | 搜索查询（必填） |
| `count` | 返回结果数量（1-10，默认：5） |
| `country` | 2 字母 ISO 国家代码（例如 "US"、"DE"） |
| `language` | 搜索结果的 ISO 639-1 语言代码（例如 "en"、"de"、"fr"） |
| `search_lang` | Brave 搜索语言代码（例如 `en`、`en-gb`、`zh-hans`） |
| `ui_lang` | UI 元素的 ISO 语言代码 |
| `freshness` | 时间过滤：`day`（24h）、`week`、`month` 或 `year` |
| `date_after` | 仅显示此日期之后发布的结果（YYYY-MM-DD） |
| `date_before` | 仅显示此日期之前发布的结果（YYYY-MM-DD） |

**示例：**

```javascript
// 按国家和语言搜索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最近结果（过去一周）
await web_search({
  query: "AI news",
  freshness: "week",
});

// 日期范围搜索
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## 注意事项

- OpenClaw 使用 Brave **Search** 计划。如果您有旧版订阅（例如每月 2,000 个查询的原始免费计划），它仍然有效，但不包括 LLM Context 或更高速率限制等新功能。
- 每个 Brave 计划每月包含 **\$5 的免费积分**（循环）。Search 计划每 1,000 个请求收费 \$5，因此积分涵盖每月 1,000 个查询。在 Brave 仪表板中设置使用限额以避免意外收费。请参阅 [Brave API 门户](https://brave.com/search/api/) 了解当前计划。
- Search 计划包含 LLM Context 端点和 AI 推理权限。将结果存储用于训练或调整模型需要具有明确存储权限的计划。请参阅 Brave [服务条款](https://api-dashboard.search.brave.com/terms-of-service)。
- `llm-context` 模式返回基础化的来源条目，而不是普通网络搜索的摘要形式。
- `llm-context` 模式不支持 `ui_lang`、`freshness`、`date_after` 或 `date_before`。
- `ui_lang` 必须包含区域子标签，如 `en-US`。
- 默认情况下，结果缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）。

有关完整的 web_search 配置，请参阅 [Web 工具](/tools/web)。
