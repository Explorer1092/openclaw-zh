---
mmh3_hash: "e30474b114db85fe0f8c8663020f5e9a"
summary: "Gemini 网页搜索，基于 Google Search 接地"
read_when:
  - 希望将 Gemini 用于 web_search
  - 需要 GEMINI_API_KEY 或 models.providers.google.apiKey
  - 需要 Google Search 接地功能
title: "Gemini search"
---

OpenClaw 支持带内置 [Google Search 接地](https://ai.google.dev/gemini-api/docs/grounding) 的 Gemini 模型，可返回由实时 Google Search 结果支持的 AI 合成答案，并附带引用。

## 获取 API 密钥

<Steps>
  <Step title="创建密钥">
    前往 [Google AI Studio](https://aistudio.google.com/apikey) 创建 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 环境中设置 `GEMINI_API_KEY`，复用 `models.providers.google.apiKey`，或通过以下命令配置专用网络搜索密钥：

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## 配置

```json5
{
  plugins: {
    entries: {
      google: {
        config: {
          webSearch: {
            apiKey: "AIza...", // 如果已设置 GEMINI_API_KEY 或 models.providers.google.apiKey 则可选
            baseUrl: "https://generativelanguage.googleapis.com/v1beta", // 可选；回退到 models.providers.google.baseUrl
            model: "gemini-2.5-flash", // 默认值
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "gemini",
      },
    },
  },
}
```

**凭据优先级：** Gemini 网络搜索优先使用 `plugins.entries.google.config.webSearch.apiKey`，其次是 `GEMINI_API_KEY`，最后是 `models.providers.google.apiKey`。对于基础 URL，专用的 `plugins.entries.google.config.webSearch.baseUrl` 优先于 `models.providers.google.baseUrl`。

对于 Gateway 安装，将环境密钥放入 `~/.openclaw/.env`。

## 工作原理

与返回链接和摘要列表的传统搜索提供商不同，Gemini 使用 Google Search 接地来生成带内联引用的 AI 合成答案。结果同时包含合成答案和来源 URL。

- 来自 Gemini 接地的引用 URL 会自动从 Google 重定向 URL 解析为直接 URL。
- 重定向解析使用 SSRF 防护路径（HEAD + 重定向检查 + http/https 验证），然后返回最终引用 URL。
- 重定向解析使用严格的 SSRF 默认设置，因此重定向到私有/内部目标会被阻止。

## 支持的参数

Gemini 搜索支持 `query`、`freshness`、`date_after` 和 `date_before`。

`count` 为共享 `web_search` 兼容性而被接受，但 Gemini 接地仍返回一个带引用的合成答案，而非 N 条结果列表。

`freshness` 接受 `day`、`week`、`month`、`year` 以及共享快捷方式 `pd`、`pw`、`pm` 和 `py`。OpenClaw 将这些值或显式的 `date_after`/`date_before` 范围转换为 Gemini Google Search 接地的 `timeRangeFilter`。不支持 `country`、`language` 和 `domain_filter`。

## 模型选择

默认模型为 `gemini-2.5-flash`（快速且经济高效）。任何支持接地功能的 Gemini 模型都可以通过 `plugins.entries.google.config.webSearch.model` 使用。

## Base URL 覆盖

当 Gemini 网络搜索需要通过操作者代理或自定义 Gemini 兼容端点路由时，设置 `plugins.entries.google.config.webSearch.baseUrl`。如果未设置，Gemini 网络搜索会复用 `models.providers.google.baseUrl`。纯 `https://generativelanguage.googleapis.com` 值会被规范化为 `https://generativelanguage.googleapis.com/v1beta`；自定义代理路径在去除末尾斜杠后保持原样。

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Brave Search](/tools/brave-search) -- 带摘要的结构化结果
- [Perplexity Search](/tools/perplexity-search) -- 结构化结果 + 内容提取
