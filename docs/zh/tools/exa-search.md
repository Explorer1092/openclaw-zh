---
mmh3_hash: "72e3f5ad48a2349a5e90aaa7e90c101a"
summary: "Exa AI 搜索 -- 神经网络搜索与关键词搜索，支持内容提取"
read_when:
  - 希望将 Exa 用于 web_search
  - 需要 EXA_API_KEY
  - 需要神经网络搜索或内容提取
title: "Exa search"
---

OpenClaw 支持将 [Exa AI](https://exa.ai/) 作为 `web_search` 提供商。Exa 提供神经网络、关键词和混合搜索模式，并内置内容提取功能（摘要、文本、总结）。

## 获取 API 密钥

<Steps>
  <Step title="创建账号">
    在 [exa.ai](https://exa.ai/) 注册并从控制面板生成 API 密钥。
  </Step>
  <Step title="存储密钥">
    在 Gateway 环境中设置 `EXA_API_KEY`，或通过以下命令配置：

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
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // 如果已设置 EXA_API_KEY 则可选
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**环境变量替代方案：** 在 Gateway 环境中设置 `EXA_API_KEY`。
对于 Gateway 安装，将其放入 `~/.openclaw/.env`。

## 工具参数

<ParamField path="query" type="string" required>
搜索查询词。
</ParamField>

<ParamField path="count" type="number">
返回结果数量（1–100）。
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
搜索模式。
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
时间过滤。
</ParamField>

<ParamField path="date_after" type="string">
此日期后的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="date_before" type="string">
此日期前的结果（`YYYY-MM-DD`）。
</ParamField>

<ParamField path="contents" type="object">
内容提取选项（见下文）。
</ParamField>

### 内容提取

Exa 可在搜索结果的同时返回提取的内容。传入 `contents` 对象以启用：

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // 完整页面文本
    highlights: { numSentences: 3 }, // 关键句子
    summary: true, // AI 摘要
  },
});
```

| 内容选项      | 类型                                                                  | 描述             |
| ------------- | --------------------------------------------------------------------- | ---------------- |
| `text`        | `boolean \| { maxCharacters }`                                        | 提取完整页面文本 |
| `highlights`  | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | 提取关键句子     |
| `summary`     | `boolean \| { query }`                                                | AI 生成的摘要    |

### 搜索模式

| 模式             | 描述                     |
| ---------------- | ------------------------ |
| `auto`           | Exa 选择最佳模式（默认） |
| `neural`         | 语义/含义搜索            |
| `fast`           | 快速关键词搜索           |
| `deep`           | 深度全面搜索             |
| `deep-reasoning` | 带推理的深度搜索         |
| `instant`        | 最快结果                 |

## 注意事项

- 如果未提供 `contents` 选项，Exa 默认使用 `{ highlights: true }`，结果中会包含关键句子摘录
- 结果在 Exa API 响应可用时会保留 `highlightScores` 和 `summary` 字段
- 结果描述优先从摘要（highlights）解析，然后是 summary，最后是完整文本
- `freshness` 和 `date_after`/`date_before` 不能同时使用——请选择一种时间过滤模式
- 每次查询最多返回 100 条结果（受 Exa 搜索类型限制）
- 结果默认缓存 15 分钟（可通过 `cacheTtlMinutes` 配置）
- Exa 是官方 API 集成，返回结构化 JSON 响应

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Brave Search](/tools/brave-search) -- 支持国家/语言过滤的结构化结果
- [Perplexity Search](/tools/perplexity-search) -- 支持域名过滤的结构化结果
