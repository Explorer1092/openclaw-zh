---
mmh3_hash: "2805d8bb6bae5f14efbe5d39f7cb65b1"
read_when:
  - 你想使用 Grok 进行 web_search
  - 你需要用于网络搜索的 XAI_API_KEY
summary: 通过 xAI 网络接地响应实现 Grok 网络搜索
title: Grok Search
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: tools/grok-search.md
  workflow: 15
---

# Grok Search

OpenClaw 支持将 Grok 作为 `web_search` 提供商，使用 xAI 网络接地响应生成由实时搜索结果和引用支持的 AI 合成答案。

同一个 `XAI_API_KEY` 还可以支持内置的 `x_search` 工具用于 X（前身为 Twitter）帖子搜索。如果你将 key 存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，OpenClaw 现在也会将其作为内置 xAI 模型提供商的回退 key 复用。

对于转发、回复、书签或浏览量等帖子级 X 指标，优先使用带有精确帖子 URL 或状态 ID 的 `x_search`，而非宽泛的搜索查询。

## 引导和配置

如果你在以下场景选择了 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以显示一个单独的后续步骤，用同一个 `XAI_API_KEY` 启用 `x_search`。该后续步骤：

- 仅在你为 `web_search` 选择 Grok 后出现
- 不是一个单独的顶层网络搜索提供商选项
- 可以在同一流程中可选地设置 `x_search` 模型

如果你跳过，可以稍后在配置中启用或更改 `x_search`。

## 获取 API Key

在 [xAI](https://console.x.ai/) 获取 API key，然后设置 `XAI_API_KEY` 在 Gateway 环境中，或通过以下方式配置：

```bash
openclaw configure --section web
```

## 配置

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // 如果设置了 XAI_API_KEY 则可选
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "grok",
      },
    },
  },
}
```

**环境变量替代方案：** 在 Gateway 环境中设置 `XAI_API_KEY`。对于 Gateway 安装，将其放入 `~/.openclaw/.env`。

## 工作原理

Grok 使用 xAI 网络接地响应合成带有内联引用的答案，类似于 Gemini 的 Google Search 接地方法。

## 支持的参数

Grok 搜索支持标准的 `query` 和 `count` 参数。当前不支持特定于提供商的过滤器。

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Web Search 中的 x_search](/tools/web#x_search) -- 通过 xAI 的一流 X 搜索
- [Gemini Search](/tools/gemini-search) -- 通过 Google 接地实现 AI 合成答案
