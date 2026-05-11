---
mmh3_hash: "e7ec832595cf84395648b3c8bc6aabe6"
summary: "Grok 网页搜索，通过 xAI 网页接地响应"
read_when:
  - 希望将 Grok 用于 web_search
  - 需要 XAI_API_KEY 用于网页搜索
title: "Grok search"
---

OpenClaw 支持将 Grok 作为 `web_search` 提供商，使用 xAI 网页接地响应生成带引用的 AI 合成答案，由实时搜索结果支持。

同一个 xAI API 密钥还可以驱动内置的 `x_search` 工具（用于 X（原 Twitter）帖子搜索）和 `code_execution` 工具。如果你将密钥存储在 `plugins.entries.xai.config.webSearch.apiKey` 下，OpenClaw 现在也会将其作为捆绑 xAI 模型提供商的回退。

对于转发、回复、书签或查看次数等帖子级 X 指标，优先使用带有确切帖子 URL 或状态 ID 的 `x_search`，而非宽泛的搜索查询。

## 引导和配置

如果你在以下流程中选择 **Grok**：

- `openclaw onboard`
- `openclaw configure --section web`

OpenClaw 可以显示一个单独的后续步骤，使用相同的 `XAI_API_KEY` 启用 `x_search`。该后续步骤：

- 仅在你为 `web_search` 选择 Grok 后出现
- 不是单独的顶级 web 搜索提供商选择
- 可以选择在同一流程中设置 `x_search` 模型

如果跳过，你可以稍后在配置中启用或更改 `x_search`。

## 获取 API 密钥

<Steps>
  <Step title="创建密钥">
    从 [xAI](https://console.x.ai/) 获取 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 环境中设置 `XAI_API_KEY`，或通过以下命令配置：

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
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...", // 如果已设置 XAI_API_KEY 则可选
            baseUrl: "https://api.x.ai/v1", // 可选的 Responses API 代理/基础 URL 覆盖
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

**环境变量替代方案：** 在 Gateway 环境中设置 `XAI_API_KEY`。
对于 Gateway 安装，将其放入 `~/.openclaw/.env`。

## 工作原理

Grok 使用 xAI 网页接地响应来合成带内联引用的答案，与 Gemini 的 Google Search 接地方式类似。

## 支持的参数

Grok 搜索支持 `query`。

`count` 为共享 `web_search` 兼容性而被接受，但 Grok 仍返回一个带引用的合成答案，而非 N 条结果列表。

目前不支持特定提供商的过滤器。

Grok 使用提供商特定的 60 秒默认超时，因为 xAI Responses 网页接地搜索运行时间可能比共享的 `web_search` 默认值更长。设置 `tools.web.search.timeoutSeconds` 可覆盖此值。

## Base URL 覆盖

当 Grok 网络搜索需要通过操作者代理或 xAI 兼容的 Responses 端点路由时，设置 `plugins.entries.xai.config.webSearch.baseUrl`。OpenClaw 在去除末尾斜杠后向 `<baseUrl>/responses` 发起请求。除非设置了 `plugins.entries.xai.config.xSearch.baseUrl`，否则 `x_search` 使用相同的 `webSearch.baseUrl` 回退。

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Web Search 中的 x_search](/tools/web#x_search) -- 通过 xAI 的一流 X 搜索
- [Gemini Search](/tools/gemini-search) -- 通过 Google 接地的 AI 合成答案
