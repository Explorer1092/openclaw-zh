---
mmh3_hash: "3457e0960b09fae2d395bc74c40454a8"
summary: "Tavily 搜索和提取工具"
read_when:
  - 需要 Tavily 支持的网页搜索
  - 需要 Tavily API 密钥
  - 希望将 Tavily 用作 web_search Provider
  - 需要从 URL 提取内容
title: "Tavily"
---

[Tavily](https://tavily.com) 是专为 AI 应用设计的搜索 API。OpenClaw 通过两种方式公开它：

- 作为通用搜索工具的 `web_search` Provider
- 作为显式 Plugin 工具：`tavily_search` 和 `tavily_extract`

Tavily 返回针对 LLM 使用优化的结构化结果，支持可配置的搜索深度、主题过滤、域名过滤、AI 生成的答案摘要，以及从 URL 提取内容（包括 JavaScript 渲染的页面）。

| 属性          | 值                                  |
| ------------- | ----------------------------------- |
| Plugin id     | `tavily`                            |
| 认证          | `TAVILY_API_KEY` 或配置 `apiKey`    |
| Base URL      | `https://api.tavily.com`（默认）    |
| 捆绑工具      | `tavily_search`、`tavily_extract`   |

## 快速入门

<Steps>
  <Step title="获取 API 密钥">
    在 [tavily.com](https://tavily.com) 创建 Tavily 账号，然后在控制面板中生成 API 密钥。
  </Step>
  <Step title="配置 Plugin 和 Provider">
    ```json5
    {
      plugins: {
        entries: {
          tavily: {
            enabled: true,
            config: {
              webSearch: {
                apiKey: "tvly-...", // 如果已设置 TAVILY_API_KEY 则可选
                baseUrl: "https://api.tavily.com",
              },
            },
          },
        },
      },
      tools: {
        web: {
          search: {
            provider: "tavily",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="验证搜索运行">
    从任意 Agent 触发 `web_search`，或直接调用 `tavily_search`。
  </Step>
</Steps>

<Tip>
在引导程序或 `openclaw configure --section web` 中选择 Tavily 会自动启用捆绑的 Tavily Plugin。
</Tip>

## 工具参考

### `tavily_search`

当需要 Tavily 特定的搜索控制而非通用 `web_search` 时使用此工具。

| 参数              | 类型         | 约束/默认值                            | 描述                                            |
| ----------------- | ------------ | -------------------------------------- | ----------------------------------------------- |
| `query`           | string       | 必填                                   | 搜索查询词（保持在 400 个字符以内）。           |
| `search_depth`    | enum         | `basic`（默认）、`advanced`            | `advanced` 较慢但相关性更高。                   |
| `topic`           | enum         | `general`（默认）、`news`、`finance`   | 按主题系列过滤。                                |
| `max_results`     | integer      | 1-20                                   | 结果数量。                                      |
| `include_answer`  | boolean      | 默认 `false`                           | 包含 Tavily AI 生成的答案摘要。                 |
| `time_range`      | enum         | `day`、`week`、`month`、`year`         | 按时效过滤结果。                                |
| `include_domains` | string array | （无）                                 | 仅包含这些域名的结果。                          |
| `exclude_domains` | string array | （无）                                 | 从结果中排除这些域名。                          |

搜索深度权衡：

| 深度       | 速度 | 相关性 | 最适合                           |
| ---------- | ---- | ------ | -------------------------------- |
| `basic`    | 较快 | 高     | 通用查询（默认）。               |
| `advanced` | 较慢 | 最高   | 精确研究和事实核查。             |

### `tavily_extract`

用于从一个或多个 URL 提取干净的内容。支持 JavaScript 渲染的页面，并支持针对目标提取的查询聚焦分块。

| 参数                | 类型         | 约束/默认值                   | 描述                                                      |
| ------------------- | ------------ | ----------------------------- | --------------------------------------------------------- |
| `urls`              | string array | 必填，1-20                    | 要提取内容的 URL。                                        |
| `query`             | string       | （可选）                      | 按与此查询的相关性对提取的分块重新排序。                  |
| `extract_depth`     | enum         | `basic`（默认）、`advanced`   | 对 JS 密集页面、SPA 或动态表格使用 `advanced`。           |
| `chunks_per_source` | integer      | 1-5；**需要 `query`**         | 每个 URL 返回的分块数。不带 `query` 设置时报错。          |
| `include_images`    | boolean      | 默认 `false`                  | 在结果中包含图片 URL。                                    |

提取深度权衡：

| 深度       | 使用场景                                   |
| ---------- | ------------------------------------------ |
| `basic`    | 简单页面。优先尝试此选项。                 |
| `advanced` | JS 渲染的 SPA、动态内容、表格。           |

<Tip>
将较大的 URL 列表拆分为多次 `tavily_extract` 调用（每次请求最多 20 个）。使用 `query` 加 `chunks_per_source` 仅获取相关内容，而非完整页面。
</Tip>

## 选择合适的工具

| 需求                               | 工具             |
| ---------------------------------- | ---------------- |
| 快速网页搜索，无特殊选项           | `web_search`     |
| 需要深度、主题、AI 答案的搜索      | `tavily_search`  |
| 从特定 URL 提取内容                | `tavily_extract` |

<Note>
使用 Tavily 作为 Provider 的通用 `web_search` 工具支持 `query` 和 `count`（最多 20 条结果）。对于 Tavily 特定的控制（`search_depth`、`topic`、`include_answer`、域名过滤、时间范围），请改用 `tavily_search`。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="API 密钥解析顺序">
    Tavily 客户端按以下顺序查找其 API 密钥：

    1. `plugins.entries.tavily.config.webSearch.apiKey`（通过 SecretRef 解析）。
    2. Gateway 环境中的 `TAVILY_API_KEY`。

    如果两者都不存在，`tavily_extract` 会报告设置错误。

  </Accordion>

  <Accordion title="自定义 Base URL">
    如果您通过代理前置 Tavily，可覆盖 `plugins.entries.tavily.config.webSearch.baseUrl`。默认值为 `https://api.tavily.com`。
  </Accordion>

  <Accordion title="`chunks_per_source` 需要 `query`">
    `tavily_extract` 拒绝传递了 `chunks_per_source` 但没有 `query` 的调用。Tavily 按查询相关性对分块排序，因此没有 query 时该参数没有意义。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Web Search 概览" href="/tools/web" icon="magnifying-glass">
    所有 Provider 和自动检测规则。
  </Card>
  <Card title="Firecrawl" href="/tools/firecrawl" icon="fire">
    搜索加抓取与内容提取。
  </Card>
  <Card title="Exa Search" href="/tools/exa-search" icon="binoculars">
    神经网络搜索与内容提取。
  </Card>
  <Card title="配置" href="/gateway/configuration" icon="gear">
    Plugin 条目和工具路由的完整配置 Schema。
  </Card>
</CardGroup>
