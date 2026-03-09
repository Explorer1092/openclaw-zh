---
title: "Web 工具"
sidebarTitle: "Web 工具"
mmh3_hash: "67fc26f53b086ac516c9ee625250c0c6"
summary: "Web 搜索 + 获取工具（Brave、Gemini、Grok、Kimi 和 Perplexity Provider）"
read_when:
  - 您想启用 web_search 或 web_fetch
  - 您需要 Brave 或 Perplexity Search API 密钥设置
  - 您想使用 Gemini 配合 Google Search grounding
---

# Web 工具

OpenClaw 提供两个轻量级 Web 工具:

- `web_search` — 使用 Brave Search API、Gemini 配合 Google Search grounding、Grok、Kimi 或 Perplexity Search API 搜索网络。
- `web_fetch` — HTTP 获取 + 可读提取（HTML → markdown/text）。

这些**不是**浏览器自动化。对于 JS 密集型网站或登录，使用 [浏览器工具](/tools/browser)。

## 工作原理

- `web_search` 调用您配置的 Provider 并返回结果。
- 结果按查询缓存 15 分钟（可配置）。
- `web_fetch` 执行普通的 HTTP GET 并提取可读内容（HTML → markdown/text）。它**不**执行 JavaScript。
- `web_fetch` 默认启用（除非明确禁用）。

有关特定 Provider 的详细信息，请参见 [Brave Search 设置](/brave-search) 和 [Perplexity Search 设置](/perplexity)。

## 选择搜索 Provider

| Provider                  | 结果类型                          | Provider 专属过滤器                          | 备注                                                                           | API 密钥                                     |
| ------------------------- | --------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| **Brave Search API**      | 带摘要的结构化结果                | `country`、`language`、`ui_lang`、时间       | 支持 Brave `llm-context` 模式                                                  | `BRAVE_API_KEY`                             |
| **Gemini**                | AI 综合答案 + 引用                | —                                            | 使用 Google Search grounding                                                   | `GEMINI_API_KEY`                            |
| **Grok**                  | AI 综合答案 + 引用                | —                                            | 使用 xAI Web 接地响应                                                          | `XAI_API_KEY`                               |
| **Kimi**                  | AI 综合答案 + 引用                | —                                            | 使用 Moonshot 网络搜索                                                         | `KIMI_API_KEY` / `MOONSHOT_API_KEY`         |
| **Perplexity Search API** | 带摘要的结构化结果                | `country`、`language`、时间、`domain_filter` | 支持内容提取控制；OpenRouter 使用 Sonar 兼容路径                               | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` |

### 自动检测

上表按字母顺序排列。如果未明确设置 `provider`，运行时自动检测按以下顺序检查 Provider：

1. **Brave** — `BRAVE_API_KEY` 环境变量或 `tools.web.search.apiKey` 配置
2. **Gemini** — `GEMINI_API_KEY` 环境变量或 `tools.web.search.gemini.apiKey` 配置
3. **Grok** — `XAI_API_KEY` 环境变量或 `tools.web.search.grok.apiKey` 配置
4. **Kimi** — `KIMI_API_KEY` / `MOONSHOT_API_KEY` 环境变量或 `tools.web.search.kimi.apiKey` 配置
5. **Perplexity** — `PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `tools.web.search.perplexity.apiKey` 配置

如果未找到密钥，则回退到 Brave（您将收到缺少密钥错误，提示您配置一个）。

## 设置 Web 搜索

使用 `openclaw configure --section web` 设置您的 API 密钥并选择 Provider。

### Brave Search

1. 在 [brave.com/search/api](https://brave.com/search/api/) 创建 Brave Search API 账户
2. 在仪表板中，选择 **Search** 计划并生成 API 密钥。
3. 运行 `openclaw configure --section web` 将密钥存储在配置中，或在环境中设置 `BRAVE_API_KEY`。

每个 Brave 计划包含**每月 $5 免费积分**（循环）。Search 计划每 1,000 次请求收费 $5，因此积分可覆盖每月 1,000 次查询。在 Brave 仪表板中设置使用上限以避免意外费用。有关当前计划和定价，请参见 [Brave API 门户](https://brave.com/search/api/)。

### Perplexity Search

1. 在 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 创建 Perplexity 账户
2. 在仪表板中生成 API 密钥
3. 运行 `openclaw configure --section web` 将密钥存储在配置中，或设置 `PERPLEXITY_API_KEY`。

对于旧版 Sonar/OpenRouter 兼容性，设置 `OPENROUTER_API_KEY`，或使用 `sk-or-...` 密钥配置 `tools.web.search.perplexity.apiKey`。设置 `tools.web.search.perplexity.baseUrl` 或 `model` 也会将 Perplexity 切换回聊天补全兼容路径。

有关更多详情，请参见 [Perplexity Search API 文档](https://docs.perplexity.ai/guides/search-quickstart)。

### 在哪里存储密钥

**通过配置：** 运行 `openclaw configure --section web`。根据 Provider，密钥存储在 `tools.web.search.apiKey` 或 `tools.web.search.perplexity.apiKey` 下。

**通过环境：** 在 Gateway 进程环境中设置 `PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `BRAVE_API_KEY`。对于 Gateway 安装，将其放在 `~/.openclaw/.env` 中（或您的服务环境）。参见 [环境变量](/help/faq#how-does-openclaw-load-environment-variables)。

### 配置示例

**Brave Search：**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        apiKey: "YOUR_BRAVE_API_KEY", // 如果设置了 BRAVE_API_KEY 则可选 // pragma: allowlist secret
      },
    },
  },
}
```

**Brave LLM Context 模式：**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "brave",
        apiKey: "YOUR_BRAVE_API_KEY", // 如果设置了 BRAVE_API_KEY 则可选 // pragma: allowlist secret
        brave: {
          mode: "llm-context",
        },
      },
    },
  },
}
```

`llm-context` 返回提取的页面片段用于接地，而非标准 Brave 摘要。在此模式下，`country` 和 `language` / `search_lang` 仍然有效，但 `ui_lang`、`freshness`、`date_after` 和 `date_before` 会被拒绝。

**Perplexity Search：**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
        perplexity: {
          apiKey: "pplx-...", // 如果设置了 PERPLEXITY_API_KEY 则可选
        },
      },
    },
  },
}
```

**Perplexity 通过 OpenRouter / Sonar 兼容：**

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
        perplexity: {
          apiKey: "<openrouter-api-key>", // 如果设置了 OPENROUTER_API_KEY 则可选
          baseUrl: "https://openrouter.ai/api/v1",
          model: "perplexity/sonar-pro",
        },
      },
    },
  },
}
```

## 使用 Gemini（Google Search grounding）

Gemini 模型支持内置的 [Google Search grounding](https://ai.google.dev/gemini-api/docs/grounding)，可返回以实时 Google Search 结果为基础的 AI 综合答案，并带引用。

### 获取 Gemini API 密钥

1. 前往 [Google AI Studio](https://aistudio.google.com/apikey)
2. 创建 API 密钥
3. 在 Gateway 环境中设置 `GEMINI_API_KEY`，或配置 `tools.web.search.gemini.apiKey`

### 设置 Gemini 搜索

```json5
{
  tools: {
    web: {
      search: {
        provider: "gemini",
        gemini: {
          // API 密钥（如果设置了 GEMINI_API_KEY 则可选）
          apiKey: "AIza...",
          // 模型（默认为 "gemini-2.5-flash"）
          model: "gemini-2.5-flash",
        },
      },
    },
  },
}
```

**环境替代方案：** 在 Gateway 环境中设置 `GEMINI_API_KEY`。对于 Gateway 安装，将其放在 `~/.openclaw/.env` 中。

### 注意事项

- 来自 Gemini grounding 的引用 URL 会自动从 Google 的重定向 URL 解析为直接 URL。
- 重定向解析使用 SSRF 守卫路径（HEAD + 重定向检查 + http/https 验证）后返回最终引用 URL。
- 重定向解析使用严格的 SSRF 默认值，因此到私有/内部目标的重定向被阻止。
- 默认模型（`gemini-2.5-flash`）速度快且具有成本效益。任何支持 grounding 的 Gemini 模型都可以使用。

## web_search

使用您配置的 Provider 搜索网络。

### 要求

- `tools.web.search.enabled` 不能为 `false`（默认：启用）
- 您选择的 Provider 的 API 密钥：
  - **Brave**: `BRAVE_API_KEY` 或 `tools.web.search.apiKey`
  - **Gemini**: `GEMINI_API_KEY` 或 `tools.web.search.gemini.apiKey`
  - **Grok**: `XAI_API_KEY` 或 `tools.web.search.grok.apiKey`
  - **Kimi**: `KIMI_API_KEY`、`MOONSHOT_API_KEY` 或 `tools.web.search.kimi.apiKey`
  - **Perplexity**: `PERPLEXITY_API_KEY`、`OPENROUTER_API_KEY` 或 `tools.web.search.perplexity.apiKey`

### 配置

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "BRAVE_API_KEY_HERE", // 如果设置了 BRAVE_API_KEY 则可选
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

### 工具参数

所有参数适用于 Brave 和原生 Perplexity Search API（除非另有说明）。

Perplexity 的 OpenRouter / Sonar 兼容路径仅支持 `query` 和 `freshness`。如果您设置了 `tools.web.search.perplexity.baseUrl` / `model`，使用 `OPENROUTER_API_KEY`，或配置了 `sk-or-...` 密钥，仅 Search API 的过滤器会返回明确错误。

| 参数                  | 描述                                                    |
| --------------------- | ------------------------------------------------------- |
| `query`               | 搜索查询（必需）                                        |
| `count`               | 返回结果数（1-10，默认：5）                             |
| `country`             | 2 字母 ISO 国家代码（例如，"US"、"DE"）                 |
| `language`            | ISO 639-1 语言代码（例如，"en"、"de"）                  |
| `freshness`           | 时间过滤：`day`、`week`、`month` 或 `year`              |
| `date_after`          | 此日期之后的结果（YYYY-MM-DD）                          |
| `date_before`         | 此日期之前的结果（YYYY-MM-DD）                          |
| `ui_lang`             | UI 语言代码（仅限 Brave）                               |
| `domain_filter`       | 域名允许/拒绝列表数组（仅限 Perplexity）                |
| `max_tokens`          | 总内容预算，默认 25000（仅限 Perplexity）               |
| `max_tokens_per_page` | 每页令牌限制，默认 2048（仅限 Perplexity）              |

**示例：**

```javascript
// 德国特定搜索
await web_search({
  query: "TV online schauen",
  country: "DE",
  language: "de",
});

// 最近结果（过去一周）
await web_search({
  query: "TMBG interview",
  freshness: "week",
});

// 日期范围搜索
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 域名过滤（仅限 Perplexity）
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// 排除域名（仅限 Perplexity）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});

// 更多内容提取（仅限 Perplexity）
await web_search({
  query: "detailed AI research",
  max_tokens: 50000,
  max_tokens_per_page: 4096,
});
```

当 Brave `llm-context` 模式启用时，不支持 `ui_lang`、`freshness`、`date_after` 和 `date_before`。对于这些过滤器，请使用 Brave `web` 模式。

## web_fetch

获取 URL 并提取可读内容。

### web_fetch 要求

- `tools.web.fetch.enabled` 不能为 `false`（默认：启用）
- 可选的 Firecrawl 回退：设置 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY`。

### web_fetch 配置

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        readability: true,
        firecrawl: {
          enabled: true,
          apiKey: "FIRECRAWL_API_KEY_HERE", // 如果设置了 FIRECRAWL_API_KEY 则可选
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 86400000, // ms（1 天）
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

### web_fetch 工具参数

- `url`（必需，仅 http/https）
- `extractMode`（`markdown` | `text`）
- `maxChars`（截断长页面）

注意：

- `web_fetch` 首先使用 Readability（主要内容提取），然后是 Firecrawl（如果配置）。如果两者都失败，工具返回错误。
- Firecrawl 请求使用规避机器人模式并默认缓存结果。
- `web_fetch` 默认发送类似 Chrome 的 User-Agent 和 `Accept-Language`；如果需要，覆盖 `userAgent`。
- `web_fetch` 阻止私有/内部主机名并重新检查重定向（使用 `maxRedirects` 限制）。
- `maxChars` 被限制为 `tools.web.fetch.maxCharsCap`。
- `web_fetch` 在解析前将下载的响应正文大小限制为 `tools.web.fetch.maxResponseBytes`；超大响应被截断并包含警告。
- `web_fetch` 是尽力而为的提取；某些网站需要浏览器工具。
- 有关密钥设置和服务详细信息，请参见 [Firecrawl](/tools/firecrawl)。
- 响应被缓存（默认 15 分钟）以减少重复获取。
- 如果您使用工具配置文件/允许列表，添加 `web_search`/`web_fetch` 或 `group:web`。
- 如果 API 密钥缺失，`web_search` 返回带有文档链接的简短设置提示。
