---
title: "Firecrawl"
mmh3_hash: "d8eab7d5acc5637ad53c14edd834db8f"
summary: "Firecrawl 搜索、抓取和 web_fetch 回退"
read_when:
  - 需要 Firecrawl 支持的网页提取
  - 需要 Firecrawl API 密钥
  - 希望将 Firecrawl 用作 web_search 提供商
  - 需要 web_fetch 的反机器人提取
---

# Firecrawl

OpenClaw 可以通过三种方式使用 **Firecrawl**：

- 作为 `web_search` 提供商
- 作为显式 Plugin 工具：`firecrawl_search` 和 `firecrawl_scrape`
- 作为 `web_fetch` 的回退提取器

它是一个托管的提取/搜索服务，支持机器人绕过和缓存，对 JS 密集型网站或阻止普通 HTTP 抓取的页面很有帮助。

## 获取 API 密钥

1. 创建 Firecrawl 账号并生成 API 密钥。
2. 将其存储在配置中或在 Gateway 环境中设置 `FIRECRAWL_API_KEY`。

## 配置 Firecrawl 搜索

```json5
{
  tools: {
    web: {
      search: {
        provider: "firecrawl",
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webSearch: {
            apiKey: "FIRECRAWL_API_KEY_HERE",
            baseUrl: "https://api.firecrawl.dev",
          },
        },
      },
    },
  },
}
```

注意事项：

- 在引导程序或 `openclaw configure --section web` 中选择 Firecrawl 会自动启用捆绑的 Firecrawl Plugin。
- 使用 Firecrawl 的 `web_search` 支持 `query` 和 `count`。
- 对于 Firecrawl 特定的控制（如 `sources`、`categories` 或结果抓取），使用 `firecrawl_search`。

## 配置 Firecrawl 抓取 + web_fetch 回退

```json5
{
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
      },
    },
  },
  tools: {
    web: {
      fetch: {
        firecrawl: {
          apiKey: "FIRECRAWL_API_KEY_HERE",
          baseUrl: "https://api.firecrawl.dev",
          onlyMainContent: true,
          maxAgeMs: 172800000,
          timeoutSeconds: 60,
        },
      },
    },
  },
}
```

注意事项：

- `firecrawl.enabled` 默认为 `true`，除非显式设为 `false`。
- Firecrawl 回退尝试仅在 API 密钥可用时运行（`tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY`）。
- `maxAgeMs` 控制缓存结果的最大存活时间（毫秒）。默认为 2 天。

`firecrawl_scrape` 复用相同的 `tools.web.fetch.firecrawl.*` 设置和环境变量。

## Firecrawl Plugin 工具

### `firecrawl_search`

当需要 Firecrawl 特定的搜索控制而非通用 `web_search` 时使用此工具。

核心参数：

- `query`
- `count`
- `sources`
- `categories`
- `scrapeResults`
- `timeoutSeconds`

### `firecrawl_scrape`

用于普通 `web_fetch` 效果较差的 JS 密集型或受机器人保护的页面。

核心参数：

- `url`
- `extractMode`
- `maxChars`
- `onlyMainContent`
- `maxAgeMs`
- `proxy`
- `storeInCache`
- `timeoutSeconds`

## 隐身/机器人绕过

Firecrawl 暴露了一个用于机器人绕过的**代理模式**参数（`basic`、`stealth` 或 `auto`）。
OpenClaw 始终对 Firecrawl 请求使用 `proxy: "auto"` 加 `storeInCache: true`。
如果省略代理，Firecrawl 默认为 `auto`。`auto` 在基本尝试失败时使用隐身代理重试，这可能比仅使用 basic 消耗更多积分。

## `web_fetch` 如何使用 Firecrawl

`web_fetch` 提取顺序：

1. Readability（本地）
2. Firecrawl（若已配置）
3. 基本 HTML 清理（最后回退）

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Web Fetch](/tools/web-fetch) -- 带 Firecrawl 回退的 web_fetch 工具
- [Tavily](/tools/tavily) -- 搜索 + 提取工具
