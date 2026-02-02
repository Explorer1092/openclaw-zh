---
title: "Brave Search API"
mmh3_hash: "9aa5629a682c7357407dbffbe0061cf9"
summary: "用于 web_search 的 Brave Search API 设置"
read_when: ["您想使用 Brave Search 进行 web_search","您需要 BRAVE_API_KEY 或计划详细信息"]
---

# Brave Search API

OpenClaw 使用 Brave Search 作为 `web_search` 的默认提供程序。

## 获取 API 密钥

1) 在 https://brave.com/search/api/ 创建 Brave Search API 账户
2) 在仪表板中,选择 **Data for Search** 计划并生成 API 密钥。
3) 将密钥存储在配置中(推荐)或在网关环境中设置 `BRAVE_API_KEY`。

## 配置示例

```json5
{
  tools: {
    web: {
      search: {
        provider: "brave",
        apiKey: "BRAVE_API_KEY_HERE",
        maxResults: 5,
        timeoutSeconds: 30
      }
    }
  }
}
```

## 注意事项

- Data for AI 计划与 `web_search` **不兼容**。
- Brave 提供免费层级和付费计划;请查看 Brave API 门户以了解当前限制。

有关完整的 web_search 配置,请参阅 [Web 工具](/tools/web)。
