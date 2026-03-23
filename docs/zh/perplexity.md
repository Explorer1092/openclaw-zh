---
mmh3_hash: "d86dc4e149e7a6922a7cb0860831e563"
summary: "用于 web_search 的 Perplexity Search API 和 Sonar/OpenRouter 兼容性"
read_when:
  - 您想使用 Perplexity Search 进行网络搜索
  - 您需要 PERPLEXITY_API_KEY 或 OPENROUTER_API_KEY 设置
title: "Perplexity Search（旧版路径）"
---

# Perplexity Search API

OpenClaw 支持 Perplexity Search API 作为 `web_search` 提供程序。
它返回带有 `title`、`url` 和 `snippet` 字段的结构化结果。

为了兼容性，OpenClaw 也支持旧版 Perplexity Sonar/OpenRouter 设置。
如果您使用 `OPENROUTER_API_KEY`、`plugins.entries.perplexity.config.webSearch.apiKey` 中的 `sk-or-...` 密钥，或设置了 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，Provider 会切换到 chat-completions 路径，返回带引用的 AI 合成答案而非结构化 Search API 结果。

## 获取 Perplexity API 密钥

1. 在 <https://www.perplexity.ai/settings/api> 创建 Perplexity 账户
2. 在仪表板中生成 API 密钥
3. 将密钥存储在配置中或在 Gateway 环境中设置 `PERPLEXITY_API_KEY`。

## OpenRouter 兼容性

如果您已经在使用 OpenRouter 进行 Perplexity Sonar，保持 `provider: "perplexity"` 并在 Gateway 环境中设置 `OPENROUTER_API_KEY`，或在 `plugins.entries.perplexity.config.webSearch.apiKey` 中存储 `sk-or-...` 密钥。

可选的兼容性控制：

- `plugins.entries.perplexity.config.webSearch.baseUrl`
- `plugins.entries.perplexity.config.webSearch.model`

## 配置示例

### 原生 Perplexity Search API

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "pplx-...",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

### OpenRouter / Sonar 兼容性

```json5
{
  plugins: {
    entries: {
      perplexity: {
        config: {
          webSearch: {
            apiKey: "<openrouter-api-key>",
            baseUrl: "https://openrouter.ai/api/v1",
            model: "perplexity/sonar-pro",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "perplexity",
      },
    },
  },
}
```

## 密钥设置位置

**通过配置：** 运行 `openclaw configure --section web`。它将密钥存储在 `~/.openclaw/openclaw.json` 的 `plugins.entries.perplexity.config.webSearch.apiKey` 下。
该字段也接受 SecretRef 对象。

**通过环境：** 在 Gateway 进程环境中设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`。对于 Gateway 安装，将其放在 `~/.openclaw/.env`（或您的服务环境中）。请参阅 [环境变量](/help/faq#env-vars-and-env-loading)。

如果配置了 `provider: "perplexity"` 且 Perplexity 密钥 SecretRef 无法解析且没有环境变量回退，启动/重载将快速失败。

## 工具参数

这些参数适用于原生 Perplexity Search API 路径。

| 参数 | 描述 |
| --------------------- | ---------------------------------------------------- |
| `query` | 搜索查询（必填） |
| `count` | 返回结果数量（1-10，默认：5） |
| `country` | 2 字母 ISO 国家代码（例如 "US"、"DE"） |
| `language` | ISO 639-1 语言代码（例如 "en"、"de"、"fr"） |
| `freshness` | 时间过滤：`day`（24h）、`week`、`month` 或 `year` |
| `date_after` | 仅显示此日期之后发布的结果（YYYY-MM-DD） |
| `date_before` | 仅显示此日期之前发布的结果（YYYY-MM-DD） |
| `domain_filter` | 域名允许/拒绝列表数组（最多 20 个） |
| `max_tokens` | 总内容预算（默认：25000，最大：1000000） |
| `max_tokens_per_page` | 每页令牌限制（默认：2048） |

对于旧版 Sonar/OpenRouter 兼容路径，只支持 `query` 和 `freshness`。
仅适用于 Search API 的过滤器（如 `country`、`language`、`date_after`、`date_before`、`domain_filter`、`max_tokens` 和 `max_tokens_per_page`）会返回明确的错误。

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

// 域名过滤（允许列表）
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// 域名过滤（拒绝列表 - 以 - 为前缀）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// 更多内容提取
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

### 域名过滤规则

- 每个过滤器最多 20 个域名
- 同一请求中不能混用允许列表和拒绝列表
- 拒绝列表条目使用 `-` 前缀（例如 `["-reddit.com"]`）

## 注意事项

- Perplexity Search API 返回结构化网络搜索结果（`title`、`url`、`snippet`）
- OpenRouter 或显式 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 会将 Perplexity 切换回 Sonar chat completions 以保持兼容性
- 默认情况下，结果缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）

有关完整的 web_search 配置，请参阅 [Web 工具](/tools/web)。
有关更多详细信息，请参阅 [Perplexity Search API 文档](https://docs.perplexity.ai/docs/search/quickstart)。
