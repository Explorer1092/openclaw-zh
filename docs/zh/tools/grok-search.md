---
mmh3_hash: "d94983c4aa37505fa2e72d3486ba6cc1"
summary: "Grok 网页搜索，通过 xAI 网页接地响应"
read_when:
  - 希望将 Grok 用于 web_search
  - 需要 XAI_API_KEY 用于网页搜索
title: "Grok Search"
---

# Grok Search

OpenClaw 支持将 Grok 作为 `web_search` 提供商，使用 xAI 网页接地响应生成带引用的 AI 合成答案，由实时搜索结果支持。

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

Grok 搜索支持标准的 `query` 和 `count` 参数。目前不支持特定提供商的过滤器。

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Gemini Search](/tools/gemini-search) -- 通过 Google 接地的 AI 合成答案
