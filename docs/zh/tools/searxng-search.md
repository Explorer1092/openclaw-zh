---
mmh3_hash: "93377e95a52f8a915f3df5a8a5cb5d38"
summary: "SearXNG 网页搜索 -- 自托管、无需密钥的元搜索提供商"
read_when:
  - 希望使用自托管的网页搜索提供商
  - 希望将 SearXNG 用于 web_search
  - 需要注重隐私或离线隔离的搜索方案
title: "SearXNG Search"
---

# SearXNG Search

OpenClaw 支持将 [SearXNG](https://docs.searxng.org/) 作为**自托管、无需密钥**的 `web_search` 提供商。SearXNG 是一个开源元搜索引擎，汇聚来自 Google、Bing、DuckDuckGo 和其他来源的搜索结果。

优势：

- **免费且无限量** -- 无需 API 密钥或商业订阅
- **隐私/离线隔离** -- 查询永远不会离开你的网络
- **随处可用** -- 不受商业搜索 API 的地区限制

## 设置

<Steps>
  <Step title="运行 SearXNG 实例">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    或使用你有访问权限的任何现有 SearXNG 部署。生产环境设置请参见 [SearXNG 文档](https://docs.searxng.org/)。

  </Step>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    # 选择 "searxng" 作为提供商
    ```

    或设置环境变量让自动检测找到它：

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## 配置

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

SearXNG 实例的插件级设置：

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // 可选
            language: "en", // 可选
          },
        },
      },
    },
  },
}
```

`baseUrl` 字段也接受 SecretRef 对象。

传输规则：

- `https://` 适用于公共或私有 SearXNG 主机
- `http://` 仅接受受信任的私有网络或回环主机
- 公共 SearXNG 主机必须使用 `https://`

## 环境变量

设置 `SEARXNG_BASE_URL` 作为配置的替代方案：

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

当设置了 `SEARXNG_BASE_URL` 且未配置明确的提供商时，自动检测会自动选择 SearXNG（优先级最低——任何带密钥的 API 支持提供商优先）。

## 插件配置参考

| 字段         | 描述                                               |
| ------------ | -------------------------------------------------- |
| `baseUrl`    | SearXNG 实例的基础 URL（必填）                     |
| `categories` | 逗号分隔的类别，如 `general`、`news` 或 `science`  |
| `language`   | 结果的语言代码，如 `en`、`de` 或 `fr`              |

## 注意事项

- **JSON API** -- 使用 SearXNG 原生的 `format=json` 端点，而非 HTML 抓取
- **无需 API 密钥** -- 适用于任何 SearXNG 实例，开箱即用
- **Base URL 验证** -- `baseUrl` 必须是有效的 `http://` 或 `https://` URL；公共主机必须使用 `https://`
- **自动检测顺序** -- SearXNG 在自动检测中排在最后（顺序 200）。带有已配置密钥的 API 支持提供商优先，然后是 DuckDuckGo（顺序 100），再是 Ollama Web Search（顺序 110）
- **自托管** -- 你控制实例、查询和上游搜索引擎
- **类别**默认为 `general`（未配置时）

<Tip>
  要使 SearXNG JSON API 正常工作，请确保你的 SearXNG 实例在 `settings.yml` 的 `search.formats` 下启用了 `json` 格式。
</Tip>

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [DuckDuckGo Search](/tools/duckduckgo-search) -- 另一个无需密钥的回退方案
- [Brave Search](/tools/brave-search) -- 有免费套餐的结构化结果
