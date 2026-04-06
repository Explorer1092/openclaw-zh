---
mmh3_hash: "cc2311f99d1266a7ef20bee6f2531b2f"
summary: "通过你配置的 Ollama 主机进行 Ollama 网页搜索"
read_when:
  - 希望将 Ollama 用于 web_search
  - 希望使用无需密钥的 web_search 提供商
  - 需要 Ollama 网页搜索设置指引
title: "Ollama Web Search"
---

# Ollama Web Search

OpenClaw 支持将 **Ollama Web Search** 作为捆绑的 `web_search` 提供商。它使用 Ollama 的实验性网页搜索 API，返回包含标题、URL 和摘要的结构化结果。

与 Ollama 模型提供商不同，此设置默认不需要 API 密钥。但需要：

- 可从 OpenClaw 访问的 Ollama 主机
- 执行 `ollama signin`

## 设置

<Steps>
  <Step title="启动 Ollama">
    确保 Ollama 已安装并正在运行。
  </Step>
  <Step title="登录">
    运行：

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="选择 Ollama Web Search">
    运行：

    ```bash
    openclaw configure --section web
    ```

    然后选择 **Ollama Web Search** 作为提供商。

  </Step>
</Steps>

如果你已经将 Ollama 用于模型，Ollama Web Search 会复用相同的已配置主机。

## 配置

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

可选的 Ollama 主机覆盖：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

如果未设置明确的 Ollama 基础 URL，OpenClaw 使用 `http://127.0.0.1:11434`。

如果你的 Ollama 主机需要 Bearer 认证，OpenClaw 会对网页搜索请求复用 `models.providers.ollama.apiKey`（或匹配的环境变量支持的提供商认证）。

## 注意事项

- 此提供商不需要特定于网页搜索的 API 密钥字段。
- 如果 Ollama 主机受认证保护，OpenClaw 会在存在时复用普通 Ollama 提供商 API 密钥。
- 如果 Ollama 无法访问或未登录，OpenClaw 会在设置期间发出警告，但不会阻止选择。
- 当没有配置更高优先级的带凭据提供商时，运行时自动检测可以回退到 Ollama Web Search。
- 该提供商使用 Ollama 的实验性 `/api/experimental/web_search` 端点。

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Ollama](/providers/ollama) -- Ollama 模型设置和云端/本地模式
