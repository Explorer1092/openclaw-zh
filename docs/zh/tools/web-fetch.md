---
mmh3_hash: "7017a369f1fcf6b9c09e17ee0990d2f4"
summary: "web_fetch 工具 -- HTTP 抓取与可读内容提取"
read_when:
  - 需要抓取 URL 并提取可读内容
  - 需要配置 web_fetch 或其 Firecrawl 回退
  - 需要了解 web_fetch 的限制和缓存
title: "Web Fetch"
sidebarTitle: "Web Fetch"
---

# Web Fetch

`web_fetch` 工具执行普通 HTTP GET 请求并提取可读内容（HTML 转 Markdown 或文本）。它**不**执行 JavaScript。

对于 JS 密集型网站或需要登录的页面，请改用 [Web Browser](/tools/browser)。

## 快速开始

`web_fetch` **默认启用** -- 无需任何配置。Agent 可以立即调用：

```javascript
await web_fetch({ url: "https://example.com/article" });
```

## 工具参数

| 参数          | 类型     | 描述                                     |
| ------------- | -------- | ---------------------------------------- |
| `url`         | `string` | 要抓取的 URL（必填，仅 http/https）      |
| `extractMode` | `string` | `"markdown"`（默认）或 `"text"`          |
| `maxChars`    | `number` | 将输出截断为此字符数                     |

## 工作原理

<Steps>
  <Step title="抓取">
    使用类 Chrome 的 User-Agent 和 `Accept-Language` 头发送 HTTP GET 请求。阻止私有/内部主机名，并重新检查重定向。
  </Step>
  <Step title="提取">
    在 HTML 响应上运行 Readability（主内容提取）。
  </Step>
  <Step title="回退（可选）">
    如果 Readability 失败且已配置 Firecrawl，通过 Firecrawl API 以机器人规避模式重试。
  </Step>
  <Step title="缓存">
    结果缓存 15 分钟（可配置），以减少对相同 URL 的重复抓取。
  </Step>
</Steps>

## 配置

```json5
{
  tools: {
    web: {
      fetch: {
        enabled: true, // 默认：true
        provider: "firecrawl", // 可选；省略则自动检测
        maxChars: 50000, // 最大输出字符数
        maxCharsCap: 50000, // maxChars 参数的硬性上限
        maxResponseBytes: 2000000, // 截断前的最大下载大小
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true, // 使用 Readability 提取
        userAgent: "Mozilla/5.0 ...", // 覆盖 User-Agent
      },
    },
  },
}
```

## Firecrawl 回退

如果 Readability 提取失败，`web_fetch` 可以回退到 [Firecrawl](/tools/firecrawl) 以进行机器人规避和更好的提取：

```json5
{
  tools: {
    web: {
      fetch: {
        provider: "firecrawl", // 可选；省略则从可用凭据自动检测
      },
    },
  },
  plugins: {
    entries: {
      firecrawl: {
        enabled: true,
        config: {
          webFetch: {
            apiKey: "fc-...", // 如果已设置 FIRECRAWL_API_KEY 则可选
            baseUrl: "https://api.firecrawl.dev",
            onlyMainContent: true,
            maxAgeMs: 86400000, // 缓存持续时间（1 天）
            timeoutSeconds: 60,
          },
        },
      },
    },
  },
}
```

`plugins.entries.firecrawl.config.webFetch.apiKey` 支持 SecretRef 对象。旧版 `tools.web.fetch.firecrawl.*` 配置由 `openclaw doctor --fix` 自动迁移。

<Note>
  如果 Firecrawl 已启用但其 SecretRef 无法解析且没有 `FIRECRAWL_API_KEY` 环境变量回退，Gateway 启动将立即失败。
</Note>

<Note>
  Firecrawl `baseUrl` 覆盖受到限制：必须使用 `https://` 和官方 Firecrawl 主机（`api.firecrawl.dev`）。
</Note>

当前运行时行为：

- `tools.web.fetch.provider` 显式选择抓取回退提供商。
- 如果省略 `provider`，OpenClaw 从可用凭据中自动检测第一个就绪的 web fetch 提供商。目前捆绑的提供商是 Firecrawl。
- 如果 Readability 被禁用，`web_fetch` 直接跳转到所选提供商回退。如果没有可用的提供商，则安全失败。

## 限制与安全

- `maxChars` 被限制为 `tools.web.fetch.maxCharsCap`
- 响应体在解析前被限制为 `maxResponseBytes`；超大响应会被截断并显示警告
- 私有/内部主机名被阻止
- 重定向会被检查，且受 `maxRedirects` 限制
- `web_fetch` 是尽力而为的 -- 某些网站需要使用 [Web Browser](/tools/browser)

## 工具配置文件

如果使用工具配置文件或允许列表，请添加 `web_fetch` 或 `group:web`：

```json5
{
  tools: {
    allow: ["web_fetch"],
    // 或：allow: ["group:web"]  （同时包含 web_fetch、web_search 和 x_search）
  },
}
```

## 相关

- [Web Search](/tools/web) -- 使用多个提供商搜索网页
- [Web Browser](/tools/browser) -- 用于 JS 密集型网站的完整浏览器自动化
- [Firecrawl](/tools/firecrawl) -- Firecrawl 搜索和抓取工具
