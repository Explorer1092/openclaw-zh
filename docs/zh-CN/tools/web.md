---
mmh3_hash: "63d05b83eb19709b42f67f04d6dbd133"
read_when:
  - 你想启用或配置 web_search
  - 你想启用或配置 x_search
  - 你需要选择搜索提供商
  - 你想了解自动检测和提供商回退
sidebarTitle: Web Search
summary: web_search、x_search 和 web_fetch -- 搜索网络、搜索 X 帖子或获取页面内容
title: Web 搜索
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/web.md
  workflow: 15
---

# Web 搜索

`web_search` 工具使用你配置的提供商搜索网络并返回结果。结果按查询缓存 15 分钟（可配置）。

OpenClaw 还包括用于 X（前身为 Twitter）帖子的 `x_search` 和用于轻量级 URL 获取的 `web_fetch`。

`web_search` 是一个轻量级 HTTP 工具，不是浏览器自动化。对于 JS 密集型网站或登录，使用 [Web 浏览器](/tools/browser)。对于获取特定 URL，使用 [Web Fetch](/tools/web-fetch)。

## 快速开始

1. 选择提供商并获取 API key（参见下方各提供商页面的注册链接）。
2. 配置：`openclaw configure --section web`
   这会存储 key 并设置提供商。你也可以设置环境变量（例如 `BRAVE_API_KEY`）并跳过此步骤。
3. 智能体现在可以调用 `web_search`。

## 选择提供商

| 提供商                                         | 结果风格               | 过滤器                                          | API key                                     |
| ---------------------------------------------- | ---------------------- | ----------------------------------------------- | ------------------------------------------- |
| [Brave](/tools/brave-search)                   | 结构化摘要             | 国家、语言、时间、`llm-context` 模式            | `BRAVE_API_KEY`                             |
| [DuckDuckGo](/tools/duckduckgo-search)         | 结构化摘要             | --                                              | 无（免 key）                                |
| [Exa](/tools/exa-search)                       | 结构化 + 提取          | 神经/关键词模式、日期、内容提取                 | `EXA_API_KEY`                               |
| [Firecrawl](/tools/firecrawl)                  | 结构化摘要             | 通过 `firecrawl_search` 工具                    | `FIRECRAWL_API_KEY`                         |
| [Gemini](/tools/gemini-search)                 | AI 合成 + 引用         | --                                              | `GEMINI_API_KEY`                            |
| [Grok](/tools/grok-search)                     | AI 合成 + 引用         | --                                              | `XAI_API_KEY`                               |
| [Kimi](/tools/kimi-search)                     | AI 合成 + 引用         | --                                              | `KIMI_API_KEY` / `MOONSHOT_API_KEY`         |
| [Perplexity](/tools/perplexity-search)         | 结构化摘要             | 国家、语言、时间、域名、内容限制                | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` |
| [Tavily](/tools/tavily)                        | 结构化摘要             | 通过 `tavily_search` 工具                       | `TAVILY_API_KEY`                            |

## 自动检测

如果未设置 `provider`，OpenClaw 按以下顺序检查 API key 并使用第一个找到的：

1. **Brave** -- `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
2. **Gemini** -- `GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
3. **Grok** -- `XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
4. **Kimi** -- `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
5. **Perplexity** -- `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
6. **Firecrawl** -- `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
7. **Tavily** -- `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`

如果未找到 key，回退到 Brave（你会收到缺少 key 的错误，提示你配置一个）。

## 配置

```json5
{
  tools: {
    web: {
      search: {
        enabled: true, // 默认：true
        provider: "brave", // 或省略以自动检测
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

特定提供商的配置（API key、base URL、模式）位于 `plugins.entries.<plugin>.config.webSearch.*` 下。

对于 `x_search`，直接配置 `tools.web.x_search.*`。它使用与 Grok 网络搜索相同的 `XAI_API_KEY` 回退。

### 存储 API key

通过配置文件：

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "YOUR_KEY",
          },
        },
      },
    },
  },
}
```

通过环境变量：在 Gateway 进程环境中设置 `BRAVE_API_KEY="YOUR_KEY"`。对于 Gateway 安装，放入 `~/.openclaw/.env`。

## 工具参数

| 参数                  | 描述                                               |
| --------------------- | -------------------------------------------------- |
| `query`               | 搜索查询（必填）                                   |
| `count`               | 返回结果数（1-10，默认：5）                        |
| `country`             | 两字母 ISO 国家代码（例如 "US"、"DE"）             |
| `language`            | ISO 639-1 语言代码（例如 "en"、"de"）              |
| `freshness`           | 时间过滤：`day`、`week`、`month` 或 `year`         |
| `date_after`          | 此日期后的结果（YYYY-MM-DD）                       |
| `date_before`         | 此日期前的结果（YYYY-MM-DD）                       |
| `ui_lang`             | UI 语言代码（仅 Brave）                            |
| `domain_filter`       | 域名允许/拒绝列表数组（仅 Perplexity）             |
| `max_tokens`          | 总内容预算，默认 25000（仅 Perplexity）            |
| `max_tokens_per_page` | 每页 token 限制，默认 2048（仅 Perplexity）        |

并非所有参数都适用于所有提供商。Brave `llm-context` 模式拒绝 `ui_lang`、`freshness`、`date_after` 和 `date_before`。Firecrawl 和 Tavily 通过 `web_search` 只支持 `query` 和 `count`。

## x_search

`x_search` 使用 xAI 查询 X（前身为 Twitter）帖子，返回带引用的 AI 合成答案。OpenClaw 仅在服务此工具调用的请求上启用内置 xAI `x_search` 工具。

对于每帖子互动统计（如转发、回复、书签或浏览量），优先使用精确帖子 URL 或状态 ID 进行目标查找。

### x_search 配置

```json5
{
  tools: {
    web: {
      x_search: {
        enabled: true,
        apiKey: "xai-...", // 如果设置了 XAI_API_KEY 则可选
        model: "grok-4-1-fast-non-reasoning",
        inlineCitations: false,
        maxTurns: 2,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
    },
  },
}
```

### x_search 参数

| 参数                         | 描述                                             |
| ---------------------------- | ------------------------------------------------ |
| `query`                      | 搜索查询（必填）                                 |
| `allowed_x_handles`          | 将结果限制为特定 X 账号                          |
| `excluded_x_handles`         | 排除特定 X 账号                                  |
| `from_date`                  | 仅包含此日期或之后的帖子（YYYY-MM-DD）           |
| `to_date`                    | 仅包含此日期或之前的帖子（YYYY-MM-DD）           |
| `enable_image_understanding` | 让 xAI 检查附加到匹配帖子的图片                  |
| `enable_video_understanding` | 让 xAI 检查附加到匹配帖子的视频                  |

## 工具配置文件

如果使用工具配置文件或允许列表，添加 `web_search`、`x_search` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // 或：allow: ["group:web"]（包括 web_search、x_search 和 web_fetch）
  },
}
```

## 相关

- [Web Fetch](/tools/web-fetch) -- 获取 URL 并提取可读内容
- [Web 浏览器](/tools/browser) -- 用于 JS 密集型网站的完整浏览器自动化
- [Grok Search](/tools/grok-search) -- 将 Grok 作为 `web_search` 提供商
