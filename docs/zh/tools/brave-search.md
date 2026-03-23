---
mmh3_hash: "96225b1acfe9366d7f8c4199be1707a2"
summary: "Brave Search API 设置，用于 web_search"
read_when:
  - 希望将 Brave Search 用于 web_search
  - 需要 BRAVE_API_KEY 或了解套餐详情
title: "Brave Search"
---

# Brave Search API

OpenClaw 支持将 Brave Search API 作为 `web_search` 提供商。

## 获取 API 密钥

1. 在 [https://brave.com/search/api/](https://brave.com/search/api/) 创建 Brave Search API 账号
2. 在控制面板中选择 **Search** 套餐并生成 API 密钥。
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

提供商专属的 Brave 搜索设置现在位于 `plugins.entries.brave.config.webSearch.*` 下。
旧版 `tools.web.search.apiKey` 仍可通过兼容层加载，但已不再是规范配置路径。

## 工具参数

| 参数          | 描述                                                             |
| ------------- | ---------------------------------------------------------------- |
| `query`       | 搜索查询词（必填）                                               |
| `count`       | 返回结果数量（1-10，默认：5）                                    |
| `country`     | 2 位 ISO 国家代码（如 "US"、"DE"）                               |
| `language`    | 搜索结果的 ISO 639-1 语言代码（如 "en"、"de"、"fr"）             |
| `ui_lang`     | 界面元素的 ISO 语言代码                                          |
| `freshness`   | 时间过滤：`day`（24h）、`week`、`month` 或 `year`               |
| `date_after`  | 仅返回此日期后发布的结果（YYYY-MM-DD）                           |
| `date_before` | 仅返回此日期前发布的结果（YYYY-MM-DD）                           |

**示例：**

```javascript
// 按国家和语言搜索
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// 最新结果（过去一周）
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

- OpenClaw 使用 Brave **Search** 套餐。如果你有旧版订阅（如原始免费套餐，每月 2,000 次查询），它仍然有效，但不包含 LLM Context 或更高速率限制等新功能。
- 每个 Brave 套餐包含每月 **\$5 免费额度**（每月更新）。Search 套餐每 1,000 次请求收费 \$5，因此额度可覆盖每月 1,000 次查询。请在 Brave 控制面板中设置使用限额以避免意外费用。当前套餐详情请参见 [Brave API 门户](https://brave.com/search/api/)。
- Search 套餐包含 LLM Context 端点和 AI 推理权限。存储结果以训练或微调模型需要具有明确存储权限的套餐。请参见 Brave [服务条款](https://api-dashboard.search.brave.com/terms-of-service)。
- 结果默认缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）。

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Perplexity Search](/tools/perplexity-search) -- 支持域名过滤的结构化结果
- [Exa Search](/tools/exa-search) -- 神经网络搜索与内容提取
