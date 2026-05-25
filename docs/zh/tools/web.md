---
title: "Web Search"
sidebarTitle: "Web Search"
mmh3_hash: "ce2d081f06fb8893ef958ccb3c5295a3"
summary: "web_search、x_search 和 web_fetch — 搜索网络、搜索 X 帖子或获取页面内容"
read_when:
  - 您想启用或配置 web_search
  - 您想启用或配置 x_search
  - 您需要选择搜索 Provider
  - 您想了解自动检测和 Provider 回退
---

# Web Search

`web_search` 工具使用您配置的 Provider 搜索网络并返回结果。结果按查询缓存 15 分钟（可配置）。

OpenClaw 还包含用于搜索 X（前 Twitter）帖子的 `x_search` 和用于轻量级 URL 获取的 `web_fetch`。在此阶段，`web_fetch` 保持本地化，而 `web_search` 和 `x_search` 可在底层使用 xAI Responses。

<Info>
  `web_search` 是轻量级 HTTP 工具，不是浏览器自动化。对于 JS 密集型网站或需要登录的场景，请使用 [Web Browser](/tools/browser)。如需获取特定 URL，请使用 [Web Fetch](/tools/web-fetch)。
</Info>

## 快速入门

<Steps>
  <Step title="选择 Provider">
    选择一个 Provider 并完成所需设置。部分 Provider 无需密钥，其他需要 API 密钥。详见下方的 Provider 页面。
  </Step>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    ```
    这将存储 Provider 和所需凭据。对于 API 支持的 Provider，您也可以设置环境变量（如 `BRAVE_API_KEY`）跳过此步骤。
  </Step>
  <Step title="使用">
    Agent 现在可以调用 `web_search`：

    ```javascript
    await web_search({ query: "OpenClaw plugin SDK" });
    ```

    对于 X 帖子，使用：

    ```javascript
    await x_search({ query: "dinner recipes" });
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
    神经 + 关键词搜索，含内容提取（高亮、文本、摘要）。
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
  <Card title="MiniMax Search" icon="globe" href="/tools/minimax-search">
    通过 MiniMax Coding Plan 搜索 API 提供结构化结果。
  </Card>
  <Card title="Ollama Web Search" icon="globe" href="/tools/ollama-search">
    通过您配置的 Ollama 主机进行无需密钥的搜索。需要 `ollama signin`。
  </Card>
  <Card title="Perplexity" icon="search" href="/tools/perplexity-search">
    带内容提取控制和域名过滤的结构化结果。
  </Card>
  <Card title="SearXNG" icon="server" href="/tools/searxng-search">
    自托管的元搜索。无需 API 密钥。聚合 Google、Bing、DuckDuckGo 等。
  </Card>
  <Card title="Tavily" icon="globe" href="/tools/tavily">
    带搜索深度、主题过滤和 `tavily_extract` URL 提取的结构化结果。
  </Card>
</CardGroup>

### Provider 对比

| Provider                                          | 结果类型               | 过滤器                                             | API 密钥                                                                         |
| ------------------------------------------------- | ---------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| [Brave](/tools/brave-search)                      | 结构化摘要             | 国家、语言、时间、`llm-context` 模式               | `BRAVE_API_KEY`                                                                  |
| [DuckDuckGo](/tools/duckduckgo-search)            | 结构化摘要             | --                                                 | 无需（无密钥）                                                                   |
| [Exa](/tools/exa-search)                          | 结构化 + 提取          | 神经/关键词模式、日期、内容提取                    | `EXA_API_KEY`                                                                    |
| [Firecrawl](/tools/firecrawl)                     | 结构化摘要             | 通过 `firecrawl_search` 工具                       | `FIRECRAWL_API_KEY`                                                              |
| [Gemini](/tools/gemini-search)                    | AI 综合 + 引用         | --                                                 | `GEMINI_API_KEY`                                                                 |
| [Grok](/tools/grok-search)                        | AI 综合 + 引用         | --                                                 | xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`       |
| [Kimi](/tools/kimi-search)                        | AI 综合 + 引用         | --                                                 | `KIMI_API_KEY` / `MOONSHOT_API_KEY`                                              |
| [MiniMax Search](/tools/minimax-search)           | 结构化摘要             | 地区（`global` / `cn`）                            | `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN`       |
| [Ollama Web Search](/tools/ollama-search)         | 结构化摘要             | --                                                 | 默认无需；需要 `ollama signin`，可复用 Ollama Provider 的 bearer 认证            |
| [Perplexity](/tools/perplexity-search)            | 结构化摘要             | 国家、语言、时间、域名、内容限制                   | `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY`                                      |
| [SearXNG](/tools/searxng-search)                  | 结构化摘要             | 类别、语言                                         | 无需（自托管）                                                                   |
| [Tavily](/tools/tavily)                           | 结构化摘要             | 通过 `tavily_search` 工具                          | `TAVILY_API_KEY`                                                                 |

## 原生 OpenAI 网络搜索

当 OpenClaw 网络搜索已启用且未固定托管 Provider 时，直接 OpenAI Responses 模型会自动使用 OpenAI 托管的 `web_search` 工具。这是捆绑的 OpenAI Plugin 中的 Provider 拥有行为，仅适用于原生 OpenAI API 流量，不适用于兼容 OpenAI 的代理 base URL 或 Azure 路由。将 `tools.web.search.provider` 设置为其他 Provider（如 `brave`）以保持 OpenAI 模型使用托管的 `web_search` 工具，或设置 `tools.web.search.enabled: false` 以同时禁用托管搜索和原生 OpenAI 搜索。

## 原生 Codex 网络搜索

支持 Codex 的模型可以选择使用 Provider 原生的 Responses `web_search` 工具，而非 OpenClaw 托管的 `web_search` 函数。

- 在 `tools.web.search.openaiCodex` 下配置
- 仅对支持 Codex 的模型（`openai-codex/*` 或使用 `api: "openai-codex-responses"` 的 Provider）激活
- 托管的 `web_search` 仍适用于非 Codex 模型
- `mode: "cached"` 是默认且推荐的设置
- `tools.web.search.enabled: false` 同时禁用托管和原生搜索

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        openaiCodex: {
          enabled: true,
          mode: "cached",
          allowedDomains: ["example.com"],
          contextSize: "high",
          userLocation: {
            country: "US",
            city: "New York",
            timezone: "America/New_York",
          },
        },
      },
    },
  },
}
```

如果启用了原生 Codex 搜索但当前模型不支持 Codex，OpenClaw 保持正常的托管 `web_search` 行为。

## 网络安全

托管的 `web_search` Provider 调用使用 OpenClaw 的受保护抓取路径。对于受信任的 Provider API 主机，OpenClaw 仅对该 Provider 主机名允许 `198.18.0.0/15` 和 `fc00::/7` 中的 Surge、Clash 和 sing-box fake-IP DNS 答案。其他私有、回环、链路本地和元数据目标仍被阻止。

此自动允许不适用于任意 `web_fetch` URL。对于 `web_fetch`，仅当您的受信任代理拥有这些合成范围并强制执行自己的目标策略时，才显式启用 `tools.web.fetch.ssrfPolicy.allowRfc2544BenchmarkRange` 和 `tools.web.fetch.ssrfPolicy.allowIpv6UniqueLocalRange`。

## 自动检测

文档和设置流程中的 Provider 列表按字母顺序排列。自动检测保持独立的优先级顺序。

如果未设置 `provider`，OpenClaw 按以下顺序检查 Provider，并使用第一个就绪的：

API 支持的 Provider 优先：

1. **Brave** — `BRAVE_API_KEY` 或 `plugins.entries.brave.config.webSearch.apiKey`（顺序 10）
2. **MiniMax Search** — `MINIMAX_CODE_PLAN_KEY` / `MINIMAX_CODING_API_KEY` / `MINIMAX_OAUTH_TOKEN` / `MINIMAX_API_KEY` 或 `plugins.entries.minimax.config.webSearch.apiKey`（顺序 15）
3. **Gemini** — `plugins.entries.google.config.webSearch.apiKey`、`GEMINI_API_KEY` 或 `models.providers.google.apiKey`（顺序 20）
4. **Grok** — xAI OAuth、`XAI_API_KEY` 或 `plugins.entries.xai.config.webSearch.apiKey`（顺序 30）
5. **Kimi** — `KIMI_API_KEY` / `MOONSHOT_API_KEY` 或 `plugins.entries.moonshot.config.webSearch.apiKey`（顺序 40）
6. **Perplexity** — `PERPLEXITY_API_KEY` / `OPENROUTER_API_KEY` 或 `plugins.entries.perplexity.config.webSearch.apiKey`（顺序 50）
7. **Firecrawl** — `FIRECRAWL_API_KEY` 或 `plugins.entries.firecrawl.config.webSearch.apiKey`（顺序 60）
8. **Exa** — `EXA_API_KEY` 或 `plugins.entries.exa.config.webSearch.apiKey`；可选的 `plugins.entries.exa.config.webSearch.baseUrl` 覆盖 Exa 端点（顺序 65）
9. **Tavily** — `TAVILY_API_KEY` 或 `plugins.entries.tavily.config.webSearch.apiKey`（顺序 70）

之后的无需密钥回退：

10. **DuckDuckGo** — 无需账户或 API 密钥的无密钥 HTML 回退（顺序 100）
11. **Ollama Web Search** — 通过您配置的 Ollama 主机进行无需密钥的回退；需要 Ollama 可访问并通过 `ollama signin` 登录，如果主机需要，可复用 Ollama Provider 的 bearer 认证（顺序 110）
12. **SearXNG** — `SEARXNG_BASE_URL` 或 `plugins.entries.searxng.config.webSearch.baseUrl`（顺序 200）

如果未检测到任何 Provider，则回退到 Brave（您将收到缺少密钥错误，提示您配置一个）。

<Note>
  所有 Provider 密钥字段都支持 SecretRef 对象。`plugins.entries.<plugin>.config.webSearch.apiKey` 下的 Plugin 范围 SecretRef 会为捆绑的 API 支持的网络搜索 Provider 解析，包括 Brave、Exa、Firecrawl、Gemini、Grok、Kimi、MiniMax、Perplexity 和 Tavily，无论 Provider 是通过 `tools.web.search.provider` 显式选择还是通过自动检测选择。在自动检测模式下，OpenClaw 仅解析所选 Provider 的密钥——未选中的 SecretRef 保持非活动状态，因此您可以配置多个 Provider 而无需为未使用的 Provider 付出解析成本。
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

Provider 专属配置（API 密钥、base URL、模式）位于 `plugins.entries.<plugin>.config.webSearch.*` 下。Gemini 还可以在其专属网络搜索配置和 `GEMINI_API_KEY` 之后，将 `models.providers.google.apiKey` 和 `models.providers.google.baseUrl` 作为较低优先级的回退。请参见各 Provider 页面的示例。Grok 还可以复用通过 `openclaw models auth login --provider xai --method oauth` 生成的 xAI OAuth 认证配置文件；API 密钥配置仍为回退。

`tools.web.search.provider` 会根据捆绑和已安装 Plugin Manifest 声明的网络搜索 Provider id 进行验证。拼写错误（如 `"brvae"`）会导致配置验证失败，而非静默地回退到自动检测。如果已配置的 Provider 仅有过时的 Plugin 证据（例如卸载第三方 Plugin 后残留的 `plugins.entries.<plugin>` 块），OpenClaw 会保持启动弹性并报告警告，以便你重新安装 Plugin 或运行 `openclaw doctor --fix` 清理过时配置。

`web_fetch` 回退 Provider 选择是独立的：

- 通过 `tools.web.fetch.provider` 选择
- 或省略该字段让 OpenClaw 从可用凭据中自动检测第一个就绪的 web fetch Provider
- 目前捆绑的 web fetch Provider 是 Firecrawl，配置在 `plugins.entries.firecrawl.config.webFetch.*` 下

在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Kimi** 时，OpenClaw 还会询问：

- Moonshot API 地区（`https://api.moonshot.ai/v1` 或 `https://api.moonshot.cn/v1`）
- 默认 Kimi 网络搜索模型（默认为 `kimi-k2.6`）

对于 `x_search`，在 `plugins.entries.xai.config.xSearch.*` 下配置。它使用与 Grok 网络搜索相同的 `XAI_API_KEY` 回退。旧版 `tools.web.x_search.*` 配置由 `openclaw doctor --fix` 自动迁移。在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 Grok 时，OpenClaw 还会提供使用相同密钥的可选 `x_search` 设置。这是 Grok 路径内的独立后续步骤，而非独立的顶级网络搜索 Provider 选择。如果选择其他 Provider，OpenClaw 不会显示 `x_search` 提示。

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
| `search_lang`         | 搜索语言代码（仅限 Brave）                              |
| `freshness`           | 时间过滤：`day`、`week`、`month` 或 `year`              |
| `date_after`          | 此日期之后的结果（YYYY-MM-DD）                          |
| `date_before`         | 此日期之前的结果（YYYY-MM-DD）                          |
| `ui_lang`             | UI 语言代码（仅限 Brave）                               |
| `domain_filter`       | 域名允许/拒绝列表数组（仅限 Perplexity）                |
| `max_tokens`          | 总内容预算，默认 25000（仅限 Perplexity）               |
| `max_tokens_per_page` | 每页 token 限制，默认 2048（仅限 Perplexity）           |

<Warning>
  并非所有参数都适用于所有 Provider。Brave `llm-context` 模式拒绝 `ui_lang`、`freshness`、`date_after` 和 `date_before`。Gemini、Grok 和 Kimi 返回一个带引用的综合答案；它们接受 `count` 以保持工具兼容性，但不会改变接地答案形式。当您使用 Sonar/OpenRouter 兼容路径（`plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 或 `OPENROUTER_API_KEY`）时，Perplexity 行为相同。SearXNG 仅对受信任的私有网络或回环主机接受 `http://`；公共 SearXNG 端点必须使用 `https://`。Firecrawl 和 Tavily 通过 `web_search` 仅支持 `query` 和 `count` — 使用它们的专用工具获取高级选项。
</Warning>

## x_search

`x_search` 使用 xAI 查询 X（前 Twitter）帖子并返回带引用的 AI 综合答案。它接受自然语言查询和可选的结构化过滤器。OpenClaw 仅在处理此工具调用的请求上启用内置的 xAI `x_search` 工具。

<Note>
  xAI 记录 `x_search` 支持关键词搜索、语义搜索、用户搜索和线程获取。对于每条帖子的互动统计（如转发、回复、书签或浏览量），优先使用精确帖子 URL 或状态 ID 进行针对性查找。广泛的关键词搜索可能找到正确的帖子但返回较少的每帖子元数据。一个好的模式是：先定位帖子，然后针对该精确帖子运行第二个 `x_search` 查询。
</Note>

### x_search 配置

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          xSearch: {
            enabled: true,
            model: "grok-4-1-fast-non-reasoning",
            baseUrl: "https://api.x.ai/v1", // 可选，覆盖 webSearch.baseUrl
            inlineCitations: false,
            maxTurns: 2,
            timeoutSeconds: 30,
            cacheTtlMinutes: 15,
          },
          webSearch: {
            apiKey: "xai-...", // 如果已设置 xAI 认证配置文件或 XAI_API_KEY 则可选
            baseUrl: "https://api.x.ai/v1", // 可选的共享 xAI Responses base URL
          },
        },
      },
    },
  },
}
```

`x_search` 在设置了 `plugins.entries.xai.config.xSearch.baseUrl` 时发布到 `<baseUrl>/responses`。如果省略该字段，则回退到 `plugins.entries.xai.config.webSearch.baseUrl`，然后是旧版 `tools.web.search.grok.baseUrl`，最后是公共 xAI 端点。

### x_search 参数

| 参数                         | 描述                                    |
| ---------------------------- | --------------------------------------- |
| `query`                      | 搜索查询（必需）                        |
| `allowed_x_handles`          | 将结果限制到特定 X 账号                 |
| `excluded_x_handles`         | 排除特定 X 账号                         |
| `from_date`                  | 仅包含此日期或之后的帖子（YYYY-MM-DD）  |
| `to_date`                    | 仅包含此日期或之前的帖子（YYYY-MM-DD）  |
| `enable_image_understanding` | 让 xAI 检查匹配帖子中附带的图片        |
| `enable_video_understanding` | 让 xAI 检查匹配帖子中附带的视频        |

### x_search 示例

```javascript
await x_search({
  query: "dinner recipes",
  allowed_x_handles: ["nytfood"],
  from_date: "2026-03-01",
});
```

```javascript
// 每帖子统计：尽可能使用精确的状态 URL 或状态 ID
await x_search({
  query: "https://x.com/huntharo/status/1905678901234567890",
});
```

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

如果您使用工具配置文件或允许列表，添加 `web_search`、`x_search` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_search", "x_search"],
    // 或：allow: ["group:web"]  （同时包含 web_search、x_search 和 web_fetch）
  },
}
```

## 相关

- [Web Fetch](/tools/web-fetch) — 获取 URL 并提取可读内容
- [Web Browser](/tools/browser) — 适用于 JS 密集型网站的完整浏览器自动化
- [Grok Search](/tools/grok-search) — 将 Grok 作为 `web_search` Provider
- [Ollama Web Search](/tools/ollama-search) — 通过您的 Ollama 主机进行无需密钥的网络搜索
