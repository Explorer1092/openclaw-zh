---
title: "Web Search"
sidebarTitle: "Web Search"
mmh3_hash: "ec4dee24ffd6e4e5fdecdb6efd0c5da8"
summary: "web_search 工具 — 使用 Brave、Firecrawl、Gemini、Grok、Kimi、Perplexity 或 Tavily 搜索网络"
read_when:
  - 您想启用或配置 web_search
  - 您需要选择搜索 Provider
  - 您想了解自动检测和 Provider 回退
---

# Web Search

`web_search` 工具使用您配置的 Provider 搜索网络并返回结果。结果按查询缓存 15 分钟（可配置）。

<Info>
  `web_search` 是轻量级 HTTP 工具，不是浏览器自动化。对于 JS 密集型网站或需要登录的场景，请使用 [Web Browser](/tools/browser)。如需获取特定 URL，请使用 [Web Fetch](/tools/web-fetch)。
</Info>

## 快速入门

<Steps>
  <Step title="获取 API 密钥">
    选择一个 Provider 并获取 API 密钥。请参见下方各 Provider 页面的注册链接。
  </Step>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    ```
    这将存储密钥并设置 Provider。您也可以设置环境变量（如 `BRAVE_API_KEY`）跳过此步骤。
  </Step>
  <Step title="使用">
    Agent 现在可以调用 `web_search`：

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

  </Step>
</Steps>

## 选择 Provider

<CardGroup cols={2}>
  <Card title="Brave Search" icon="shield" href="/tools/brave-search">
    带摘要的结构化结果。支持 `llm-context` 模式、国家/语言过滤。提供免费套餐。
  </Card>
  <Card title="DuckDuckGo" icon="bird" href="/tools/duckduckgo-search">
    无需 API 密钥的回退方案。无需 API 密钥。基于非官方 HTML 的集成。
  </Card>
  <Card title="Exa" icon="brain" href="/tools/exa-search">
    神经 + 关键词搜索，含内容提取（摘要、文本、高亮）。
  </Card>
  <Card title="Firecrawl" icon="flame" href="/tools/firecrawl">
    结构化结果。最适合与 `firecrawl_search` 和 `firecrawl_scrape` 配合进行深度提取。
  </Card>
  <Card title="Gemini" icon="sparkles" href="/tools/gemini-search">
    通过 Google Search grounding 提供带引用的 AI 综合答案。
  </Card>
  <Card title="Grok" icon="zap" href="/tools/grok-search">
    通过 xAI 网络接地提供带引用的 AI 综合答案。
  </Card>
  <Card title="Kimi" icon="moon" href="/tools/kimi-search">
    通过 Moonshot 网络搜索提供带引用的 AI 综合答案。
  </Card>
  <Card title="Perplexity" icon="search" href="/tools/perplexity-search">
    带内容提取控制和域名过滤的结构化结果。
  </Card>
  <Card title="Tavily" icon="globe" href="/tools/tavily">
    带搜索深度、主题过滤和 `tavily_extract` URL 提取的结构化结果。
  </Card>
</CardGroup>

### Provider 对比

| Provider                               | 结果类型               | 过滤器                                             | API 密钥                                     |
| -------------------------------------- | ---------------------- | -------------------------------------------------- | -------------------------------------------- |
| [Brave](/tools/brave-search)           | 结构化摘要             | 国家、语言、时间、`llm-context` 模式               | `BRAVE_API_KEY`                              |
| [DuckDuckGo](/tools/duckduckgo-search) | 结构化摘要             | --                                                 | 无需（无密钥）                               |
| [Exa](/tools/exa-search)               | 结构化 + 提取          | 神经/关键词模式、日期、内容提取                    | `EXA_API_KEY`                                |
| [Firecrawl](/tools/firecrawl)          | 结构化摘要             | 通过 `firecrawl_search` 工具                       | `FIRECRAWL_API_KEY`                          |
| [Gemini](/tools/gemini-search)         | AI 综合 + 引用         | --                                                 | `GEMINI_API_KEY`                             |
| [Grok](/tools/grok-search)             | AI 综合 + 引用         | --                                                 | `XAI_API_KEY`                                |
| [Kimi](/tools/kimi-search)             | AI 综合 + 引用         | --                                                 | `KIMI_API_KEY` / `MOONSHOT_API_KEY`          |
| [Perplexity](/tools/perplexity-search) | 结构化摘要             | 国家、语言、时间、域名、内容限制                   | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`  |
| [Tavily](/tools/tavily)                | 结构化摘要             | 通过 `tavily_search` 工具                          | `TAVILY_API_KEY`                             |

## 自动检测

Provider 列表在文档和设置流程中按字母顺序排列。自动检测保持独立的优先级顺序：

如果未设置 `provider`，OpenClaw 按以下顺序检查 API 密钥，并使用第一个找到的：

1. **Brave** — `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`
2. **Gemini** — `GEMINI_API_KEY` 或 `plugins.entries.google.config.webSearch.apiKey`
3. **Grok** — `XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`
4. **Kimi** — `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`
5. **Perplexity** — `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`
6. **Firecrawl** — `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`
7. **Tavily** — `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`

如果未找到密钥，则回退到 Brave（您将收到缺少密钥错误，提示您配置一个）。

<Note>
  所有 Provider 密钥字段都支持 SecretRef 对象。在自动检测模式下，OpenClaw 仅解析所选 Provider 的密钥 — 未选中的 SecretRef 保持非活动状态。
</Note>

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

Provider 专属配置（API 密钥、base URL、模式）位于 `plugins.entries.<plugin>.config.webSearch.*` 下。请参见各 Provider 页面的示例。

### 存储 API 密钥

<Tabs>
  <Tab title="配置文件">
    运行 `openclaw configure --section web` 或直接设置密钥：

    ```json5
    {
      plugins: {
        entries: {
          brave: {
            config: {
              webSearch: {
                apiKey: "YOUR_KEY", // pragma: allowlist secret
              },
            },
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="环境变量">
    在 Gateway 进程环境中设置 Provider 环境变量：

    ```bash
    export BRAVE_API_KEY="YOUR_KEY"
    ```

    对于 Gateway 安装，将其放在 `~/.openclaw/.env` 中。
    参见 [环境变量](/help/faq#env-vars-and-env-loading)。

  </Tab>
</Tabs>

## 工具参数

| 参数                  | 描述                                                    |
| --------------------- | ------------------------------------------------------- |
| `query`               | 搜索查询（必需）                                        |
| `count`               | 返回结果数（1-10，默认：5）                             |
| `country`             | 2 字母 ISO 国家代码（如 "US"、"DE"）                    |
| `language`            | ISO 639-1 语言代码（如 "en"、"de"）                     |
| `freshness`           | 时间过滤：`day`、`week`、`month` 或 `year`              |
| `date_after`          | 此日期之后的结果（YYYY-MM-DD）                          |
| `date_before`         | 此日期之前的结果（YYYY-MM-DD）                          |
| `ui_lang`             | UI 语言代码（仅限 Brave）                               |
| `domain_filter`       | 域名允许/拒绝列表数组（仅限 Perplexity）                |
| `max_tokens`          | 总内容预算，默认 25000（仅限 Perplexity）               |
| `max_tokens_per_page` | 每页 token 限制，默认 2048（仅限 Perplexity）           |

<Warning>
  并非所有参数都适用于所有 Provider。Brave `llm-context` 模式拒绝 `ui_lang`、`freshness`、`date_after` 和 `date_before`。Firecrawl 和 Tavily 通过 `web_search` 仅支持 `query` 和 `count` — 使用它们的专用工具获取高级选项。
</Warning>

## 示例

```javascript
// 基础搜索
await web_search({ query: "OpenClaw plugin SDK" });

// 德语特定搜索
await web_search({ query: "TV online schauen", country: "DE", language: "de" });

// 最近结果（过去一周）
await web_search({ query: "AI developments", freshness: "week" });

// 日期范围
await web_search({
  query: "climate research",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});

// 域名过滤（仅限 Perplexity）
await web_search({
  query: "product reviews",
  domain_filter: ["-reddit.com", "-pinterest.com"],
});
```

## 工具配置文件

如果您使用工具配置文件或允许列表，添加 `web_search` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_search"],
    // 或：allow: ["group:web"]  （同时包含 web_search 和 web_fetch）
  },
}
```

## 相关

- [Web Fetch](/tools/web-fetch) — 获取 URL 并提取可读内容
- [Web Browser](/tools/browser) — 适用于 JS 密集型网站的完整浏览器自动化
