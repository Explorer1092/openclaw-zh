---
mmh3_hash: "8cd6eefab2c75f93001df2a49f15598b"
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

在 `openclaw onboard` 或 `openclaw configure --section web` 中选择 **Kimi** 时，OpenClaw 还可以询问：

- Moonshot API 地区：
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- 默认 Kimi 网页搜索模型（默认为 `kimi-k2.5`）

## 配置

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // 如果已设置 KIMI_API_KEY 或 MOONSHOT_API_KEY 则可选
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.5",
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

如果你使用中国 API 主机进行聊天（`models.providers.moonshot.baseUrl`：`https://api.moonshot.cn/v1`），当省略 `tools.web.search.kimi.baseUrl` 时，OpenClaw 会为 Kimi `web_search` 复用相同的主机，因此来自 [platform.moonshot.cn](https://platform.moonshot.cn/) 的密钥不会错误地访问国际端点（通常返回 HTTP 401）。需要不同的搜索基础 URL 时，通过 `tools.web.search.kimi.baseUrl` 覆盖。

**环境变量替代方案：** 在 Gateway 环境中设置 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`。对于 Gateway 安装，将其放入 `~/.openclaw/.env`。

如果省略 `baseUrl`，OpenClaw 默认为 `https://api.moonshot.ai/v1`。
如果省略 `model`，OpenClaw 默认为 `kimi-k2.5`。

## 工作原理

Kimi 使用 Moonshot 网页搜索来合成带内联引用的答案，与 Gemini 和 Grok 的接地响应方式类似。

## 支持的参数

Kimi 搜索支持 `query`。

`count` 为共享 `web_search` 兼容性而被接受，但 Kimi 仍返回一个带引用的合成答案，而非 N 条结果列表。

目前不支持特定提供商的过滤器。

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Moonshot AI](/providers/moonshot) -- Moonshot 模型 + Kimi Coding Provider 文档
- [Gemini Search](/tools/gemini-search) -- 通过 Google 接地的 AI 合成答案
- [Grok Search](/tools/grok-search) -- 通过 xAI 接地的 AI 合成答案
