---
mmh3_hash: "ba1c4fd73e20ccd3d643412bddeae074"
summary: "Gemini 网页搜索，基于 Google Search 接地"
read_when:
  - 希望将 Gemini 用于 web_search
  - 需要 GEMINI_API_KEY
  - 需要 Google Search 接地功能
title: "Gemini Search"
---

# Gemini Search

OpenClaw 支持带内置 [Google Search 接地](https://ai.google.dev/gemini-api/docs/grounding) 的 Gemini 模型，可返回由实时 Google Search 结果支持的 AI 合成答案，并附带引用。

## 获取 API 密钥

<Steps>
  <Step title="创建密钥">
    前往 [Google AI Studio](https://aistudio.google.com/apikey) 创建 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 环境中设置 `GEMINI_API_KEY`，或通过以下命令配置：

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
            apiKey: "AIza...", // 如果已设置 GEMINI_API_KEY 则可选
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

**环境变量替代方案：** 在 Gateway 环境中设置 `GEMINI_API_KEY`。
对于 Gateway 安装，将其放入 `~/.openclaw/.env`。

## 工作原理

与返回链接和摘要列表的传统搜索提供商不同，Gemini 使用 Google Search 接地来生成带内联引用的 AI 合成答案。结果同时包含合成答案和来源 URL。

- 来自 Gemini 接地的引用 URL 会自动从 Google 重定向 URL 解析为直接 URL。
- 重定向解析使用 SSRF 防护路径（HEAD + 重定向检查 + http/https 验证），然后返回最终引用 URL。
- 重定向解析使用严格的 SSRF 默认设置，因此重定向到私有/内部目标会被阻止。

## 支持的参数

Gemini 搜索支持 `query`。

`count` 为共享 `web_search` 兼容性而被接受，但 Gemini 接地仍返回一个带引用的合成答案，而非 N 条结果列表。

不支持 `country`、`language`、`freshness` 和 `domain_filter` 等特定提供商过滤器。

## 模型选择

默认模型为 `gemini-2.5-flash`（快速且经济高效）。任何支持接地功能的 Gemini 模型都可以通过 `plugins.entries.google.config.webSearch.model` 使用。

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Brave Search](/tools/brave-search) -- 带摘要的结构化结果
- [Perplexity Search](/tools/perplexity-search) -- 结构化结果 + 内容提取
