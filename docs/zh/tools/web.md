---
title: "Web 工具"
sidebarTitle: "Web 工具"
mmh3_hash: "b7b9da932434cb6a8ace8e2aecbcaaa6"
summary: "Web 搜索 + 获取工具(Brave Search API、Perplexity 直接/OpenRouter)"
read_when: ["您想启用 web_search 或 web_fetch","您需要 Brave Search API 密钥设置","您想使用 Perplexity Sonar 进行 Web 搜索"]
---

# Web 工具

OpenClaw 提供两个轻量级 Web 工具:

- `web_search` — 通过 Brave Search API(默认)或 Perplexity Sonar(直接或通过 OpenRouter)搜索网络。
- `web_fetch` — HTTP 获取 + 可读提取(HTML → markdown/text)。

这些**不是**浏览器自动化。对于 JS 密集型网站或登录,使用 [浏览器工具](/tools/browser)。

## 工作原理

- `web_search` 调用您配置的提供商并返回结果。
  - **Brave**(默认): 返回结构化结果(标题、URL、片段)。
  - **Perplexity**: 返回 AI 综合答案,带有来自实时网络搜索的引用。
- 结果按查询缓存 15 分钟(可配置)。
- `web_fetch` 执行普通的 HTTP GET 并提取可读内容(HTML → markdown/text)。它**不**执行 JavaScript。
- `web_fetch` 默认启用(除非明确禁用)。

## 选择搜索提供商

| 提供商 | 优点 | 缺点 | API 密钥 |
|----------|------|------|---------|
| **Brave**(默认) | 快速、结构化结果、免费层 | 传统搜索结果 | `BRAVE_API_KEY` |
| **Perplexity** | AI 综合答案、引用、实时 | 需要 Perplexity 或 OpenRouter 访问 | `OPENROUTER_API_KEY` 或 `PERPLEXITY_API_KEY` |

有关特定提供商的详细信息,请参见 [Brave Search 设置](/brave-search) 和 [Perplexity Sonar](/perplexity)。

在配置中设置提供商:

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave"  // 或 "perplexity"
      }
    }
  }
}
```

示例: 切换到 Perplexity Sonar(直接 API):

```json5
{
  tools: {
    web: {
      search: {
        provider: "perplexity",
        perplexity: {
          apiKey: "pplx-...",
          baseUrl: "https://api.perplexity.ai",
          model: "perplexity/sonar-pro"
        }
      }
    }
  }
}
```

## 获取 Brave API 密钥

1) 在 https://brave.com/search/api/ 创建 Brave Search API 账户
2) 在仪表板中,选择 **Data for Search** 计划(不是"Data for AI")并生成 API 密钥。
3) 运行 `openclaw configure --section web` 将密钥存储在配置中(推荐),或在环境中设置 `BRAVE_API_KEY`。

Brave 提供免费层加付费计划;查看 Brave API 门户了解当前限制和定价。

### 在哪里设置密钥(推荐)

**推荐:** 运行 `openclaw configure --section web`。它将密钥存储在 `~/.openclaw/openclaw.json` 的 `tools.web.search.apiKey` 下。

**环境替代方案:** 在网关进程环境中设置 `BRAVE_API_KEY`。对于网关安装,将其放在 `~/.openclaw/.env` 中(或您的服务环境)。参见 [环境变量](/help/faq#how-does-openclaw-load-environment-variables)。

## 使用 Perplexity(直接或通过 OpenRouter)

Perplexity Sonar 模型具有内置的 Web 搜索功能,并返回带有引用的 AI 综合答案。您可以通过 OpenRouter 使用它们(无需信用卡 - 支持加密货币/预付)。

### 获取 OpenRouter API 密钥

1) 在 https://openrouter.ai/ 创建账户
2) 添加积分(支持加密货币、预付或信用卡)
3) 在您的账户设置中生成 API 密钥

### 设置 Perplexity 搜索

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        provider: "perplexity",
        perplexity: {
          // API 密钥(如果设置了 OPENROUTER_API_KEY 或 PERPLEXITY_API_KEY 则可选)
          apiKey: "sk-or-v1-...",
          // 基础 URL(如果省略,则密钥感知默认值)
          baseUrl: "https://openrouter.ai/api/v1",
          // 模型(默认为 perplexity/sonar-pro)
          model: "perplexity/sonar-pro"
        }
      }
    }
  }
}
```

**环境替代方案:** 在网关环境中设置 `OPENROUTER_API_KEY` 或 `PERPLEXITY_API_KEY`。对于网关安装,将其放在 `~/.openclaw/.env` 中。

如果未设置基础 URL,OpenClaw 根据 API 密钥源选择默认值:

- `PERPLEXITY_API_KEY` 或 `pplx-...` → `https://api.perplexity.ai`
- `OPENROUTER_API_KEY` 或 `sk-or-...` → `https://openrouter.ai/api/v1`
- 未知密钥格式 → OpenRouter(安全回退)

### 可用的 Perplexity 模型

| 模型 | 描述 | 最适合 |
|-------|-------------|----------|
| `perplexity/sonar` | 快速问答,带 Web 搜索 | 快速查找 |
| `perplexity/sonar-pro`(默认) | 多步推理,带 Web 搜索 | 复杂问题 |
| `perplexity/sonar-reasoning-pro` | 思维链分析 | 深度研究 |

## web_search

使用您配置的提供商搜索网络。

### 要求

- `tools.web.search.enabled` 不能为 `false`(默认: 启用)
- 您选择的提供商的 API 密钥:
  - **Brave**: `BRAVE_API_KEY` 或 `tools.web.search.apiKey`
  - **Perplexity**: `OPENROUTER_API_KEY`、`PERPLEXITY_API_KEY` 或 `tools.web.search.perplexity.apiKey`

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
        cacheTtlMinutes: 15
      }
    }
  }
}
```

### 工具参数

- `query`(必需)
- `count`(1–10;默认来自配置)
- `country`(可选): 用于特定区域结果的 2 字母国家代码(例如,"DE"、"US"、"ALL")。如果省略,Brave 选择其默认区域。
- `search_lang`(可选): 搜索结果的 ISO 语言代码(例如,"de"、"en"、"fr")
- `ui_lang`(可选): UI 元素的 ISO 语言代码
- `freshness`(可选,仅 Brave): 按发现时间过滤(`pd`、`pw`、`pm`、`py` 或 `YYYY-MM-DDtoYYYY-MM-DD`)

**示例:**

```javascript
// 德国特定搜索
await web_search({
  query: "TV online schauen",
  count: 10,
  country: "DE",
  search_lang: "de"
});

// 法语搜索,带法语 UI
await web_search({
  query: "actualités",
  country: "FR",
  search_lang: "fr",
  ui_lang: "fr"
});

// 最近结果(过去一周)
await web_search({
  query: "TMBG interview",
  freshness: "pw"
});
```

## web_fetch

获取 URL 并提取可读内容。

### 要求

- `tools.web.fetch.enabled` 不能为 `false`(默认: 启用)
- 可选的 Firecrawl 回退: 设置 `tools.web.fetch.firecrawl.apiKey` 或 `FIRECRAWL_API_KEY`。

### 配置

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true,
        maxChars: 50000,
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
          maxAgeMs: 86400000, // ms(1 天)
          timeoutSeconds: 60
        }
      }
    }
  }
}
```

### 工具参数

- `url`(必需,仅 http/https)
- `extractMode`(`markdown` | `text`)
- `maxChars`(截断长页面)

注意:
- `web_fetch` 首先使用 Readability(主要内容提取),然后是 Firecrawl(如果配置)。如果两者都失败,工具返回错误。
- Firecrawl 请求使用规避机器人模式并默认缓存结果。
- `web_fetch` 默认发送类似 Chrome 的 User-Agent 和 `Accept-Language`;如果需要,覆盖 `userAgent`。
- `web_fetch` 阻止私有/内部主机名并重新检查重定向(使用 `maxRedirects` 限制)。
- `web_fetch` 是尽力而为的提取;某些网站需要浏览器工具。
- 有关密钥设置和服务详细信息,请参见 [Firecrawl](/tools/firecrawl)。
- 响应被缓存(默认 15 分钟)以减少重复获取。
- 如果您使用工具配置文件/允许列表,添加 `web_search`/`web_fetch` 或 `group:web`。
- 如果缺少 Brave 密钥,`web_search` 返回带有文档链接的简短设置提示。

