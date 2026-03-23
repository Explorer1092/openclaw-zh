---
mmh3_hash: "cd023b65f3c3965d5d6d4654e8fcf850"
summary: "Kimi 网页搜索，通过 Moonshot 网页搜索"
read_when:
  - 希望将 Kimi 用于 web_search
  - 需要 KIMI_API_KEY 或 MOONSHOT_API_KEY
title: "Kimi Search"
---

# Kimi Search

OpenClaw 支持将 Kimi 作为 `web_search` 提供商，使用 Moonshot 网页搜索生成带引用的 AI 合成答案。

## 获取 API 密钥

<Steps>
  <Step title="创建密钥">
    从 [Moonshot AI](https://platform.moonshot.cn/) 获取 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 环境中设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，或通过以下命令配置：

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
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // 如果已设置 KIMI_API_KEY 或 MOONSHOT_API_KEY 则可选
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

**环境变量替代方案：** 在 Gateway 环境中设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`。
对于 Gateway 安装，将其放入 `~/.openclaw/.env`。

## 工作原理

Kimi 使用 Moonshot 网页搜索来合成带内联引用的答案，与 Gemini 和 Grok 的接地响应方式类似。

## 支持的参数

Kimi 搜索支持标准的 `query` 和 `count` 参数。目前不支持特定提供商的过滤器。

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Gemini Search](/tools/gemini-search) -- 通过 Google 接地的 AI 合成答案
- [Grok Search](/tools/grok-search) -- 通过 xAI 接地的 AI 合成答案
