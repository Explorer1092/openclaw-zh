---
mmh3_hash: "cb8723fc03b6847be83417c0314139eb"
summary: "Perplexity Search API 及 Sonar/OpenRouter 兼容性，用于 web_search"
read_when:
  - 希望使用 Perplexity Search 进行网页搜索
  - 需要设置 PERPLEXITY_API_KEY 或 OPENROUTER_API_KEY
title: "Perplexity Search"
---

OpenClaw 支持将 Perplexity Search API 作为 `web_search` 提供商。它返回包含 `title`、`url` 和 `snippet` 字段的结构化结果。

为了兼容性，OpenClaw 也支持旧版 Perplexity Sonar/OpenRouter 设置。
如果使用 `OPENROUTER_API_KEY`、在 `plugins.entries.perplexity.config.webSearch.apiKey` 中使用 `sk-or-...` 密钥，或设置了 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model`，提供商会切换到聊天补全路径，返回带引用的 AI 合成答案，而非结构化 Search API 结果。

## 获取 Perplexity API 密钥

1. 在 [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api) 创建 Perplexity 账号
2. 在控制面板中生成 API 密钥
3. 将密钥存储在配置中或在 Gateway 环境中设置 `PERPLEXITY_API_KEY`。

## OpenRouter 兼容性

如果你之前使用 OpenRouter 访问 Perplexity Sonar，请保持 `provider: "perplexity"` 并在 Gateway 环境中设置 `OPENROUTER_API_KEY`，或在 `plugins.entries.perplexity.config.webSearch.apiKey` 中存储 `sk-or-...` 密钥。

可选兼容性控制：

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

### OpenRouter / Sonar 兼容

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

## 密钥存储位置

**通过配置：** 运行 `openclaw configure --section web`。密钥存储在 `~/.openclaw/openclaw.json` 的 `plugins.entries.perplexity.config.webSearch.apiKey` 下。该字段也接受 SecretRef 对象。

**通过环境变量：** 在 Gateway 进程环境中设置 `PERPLEXITY_API_KEY` 或 `OPENROUTER_API_KEY`。对于 Gateway 安装，将其放入 `~/.openclaw/.env`（或你的服务环境）。参见 [环境变量](/help/faq#env-vars-and-env-loading)。

如果配置了 `provider: "perplexity"` 且 Perplexity 密钥 SecretRef 无法解析也没有环境变量回退，启动/重载会立即失败。

## 工具参数

以下参数适用于原生 Perplexity Search API 路径。

<ParamField path="query" type="string" required>
搜索查询词。
</ParamField>

<ParamField path="count" type="number" default="5">
返回结果数量（1-10）。
</ParamField>

<ParamField path="country" type="string">
2 位 ISO 国家代码（如 `US`、`DE`）。
</ParamField>

<ParamField path="language" type="string">
ISO 639-1 语言代码（如 `en`、`de`、`fr`）。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
时间过滤 - `day` 为 24 小时。
</ParamField>

<ParamField path="date_after" type="string">
仅返回此日期后发布的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
仅返回此日期前发布的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="domain_filter" type="string[]">
域名允许/拒绝列表数组（最多 20 个）。
</ParamField>

<ParamField path="max_tokens" type="number" default="25000">
总内容预算（最大 1000000）。
</ParamField>

<ParamField path="max_tokens_per_page" type="number" default="2048">
每页 token 限制。
</ParamField>

对于旧版 Sonar/OpenRouter 兼容路径：

- 接受 `query`、`count` 和 `freshness`
- `count` 在那里仅供兼容性使用；响应仍然是一个带引用的合成答案，而非 N 条结果列表
- `country`、`language`、`date_after`、`date_before`、`domain_filter`、`max_tokens` 和 `max_tokens_per_page` 等仅 Search API 支持的过滤器会返回明确的错误

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

// 域名过滤（允许列表）
await web_search({
  query: "climate research",
  domain_filter: ["nature.com", "science.org", ".edu"],
});

// 域名过滤（拒绝列表 - 加 - 前缀）
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

- 每次过滤最多 20 个域名
- 同一请求中不能混用允许列表和拒绝列表
- 拒绝列表条目使用 `-` 前缀（如 `["-reddit.com"]`）

## 注意事项

- Perplexity Search API 返回结构化网页搜索结果（`title`、`url`、`snippet`）
- 使用 OpenRouter 或显式设置 `plugins.entries.perplexity.config.webSearch.baseUrl` / `model` 会将 Perplexity 切换回 Sonar 聊天补全模式，以保持兼容性
- Sonar/OpenRouter 兼容返回一个带引用的合成答案，而非结构化结果行
- 结果默认缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）

## 相关

<CardGroup cols={2}>
  <Card title="Web Search 概览" href="/tools/web" icon="globe">
    所有提供商和自动检测规则。
  </Card>
  <Card title="Brave Search" href="/tools/brave-search" icon="shield">
    支持国家/语言过滤的结构化结果。
  </Card>
  <Card title="Exa Search" href="/tools/exa-search" icon="magnifying-glass">
    神经网络搜索与内容提取。
  </Card>
  <Card title="Perplexity Search API 文档" href="https://docs.perplexity.ai/docs/search/quickstart" icon="arrow-up-right-from-square">
    Perplexity Search API 官方快速入门和参考文档。
  </Card>
</CardGroup>
