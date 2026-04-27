---
mmh3_hash: "4c309b48847286e2cba83967305c9f75"
summary: "DuckDuckGo 网页搜索 -- 无需密钥的回退提供商（实验性，基于 HTML）"
read_when:
  - 希望使用无需 API 密钥的网页搜索提供商
  - 希望将 DuckDuckGo 用于 web_search
  - 需要零配置的搜索回退方案
title: "DuckDuckGo Search"
---

OpenClaw 支持将 DuckDuckGo 作为**无需密钥**的 `web_search` 提供商。无需 API 密钥或账号。

<Warning>
  DuckDuckGo 是一个**实验性、非官方**集成，从 DuckDuckGo 的非 JavaScript 搜索页面
  获取结果——并非官方 API。可能因机器人验证页面或 HTML 结构变化而出现不稳定情况。
</Warning>

## 设置

无需 API 密钥，只需将 DuckDuckGo 设为你的提供商：

<Steps>
  <Step title="配置">
    ```bash
    openclaw configure --section web
    # 选择 "duckduckgo" 作为提供商
    ```
  </Step>
</Steps>

## 配置

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

地区和安全搜索的可选 Plugin 级设置：

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo 地区代码
            safeSearch: "moderate", // "strict"、"moderate" 或 "off"
          },
        },
      },
    },
  },
}
```

## 工具参数

<ParamField path="query" type="string" required>
搜索查询词。
</ParamField>

<ParamField path="count" type="number" default="5">
返回结果数量（1-10）。
</ParamField>

<ParamField path="region" type="string">
DuckDuckGo 地区代码（如 `us-en`、`uk-en`、`de-de`）。
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
安全搜索级别。
</ParamField>

地区和安全搜索也可在 Plugin 配置中设置（见上文）——工具参数会在每次查询时覆盖配置值。

## 注意事项

- **无需 API 密钥** -- 开箱即用，零配置
- **实验性** -- 从 DuckDuckGo 的非 JavaScript HTML 搜索页面获取结果，并非官方 API 或 SDK
- **机器人验证风险** -- 在高频或自动化使用时，DuckDuckGo 可能显示验证码或封锁请求
- **HTML 解析** -- 结果依赖于页面结构，可能在无通知的情况下发生变化
- **自动检测顺序** -- DuckDuckGo 是第一个无需密钥的回退（顺序 100）。带有已配置密钥的 API 支持提供商优先，然后是 Ollama Web Search（顺序 110），再是 SearXNG（顺序 200）
- **安全搜索默认为中等** -- 未配置时默认为 `moderate`

<Tip>
  在生产环境中，建议使用 [Brave Search](/tools/brave-search)（有免费套餐）
  或其他基于 API 的提供商。
</Tip>

## 相关

- [Web Search 概览](/tools/web) -- 所有提供商和自动检测
- [Brave Search](/tools/brave-search) -- 有免费套餐的结构化结果
- [Exa Search](/tools/exa-search) -- 神经网络搜索与内容提取
