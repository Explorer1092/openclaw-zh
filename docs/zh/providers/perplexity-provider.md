---
mmh3_hash: "a1618034267689b42f37179f6d499c26"
title: "Perplexity（Provider）"
summary: "Perplexity Web 搜索 Provider 设置（API 密钥、搜索模式、过滤）"
read_when:
  - 您想将 Perplexity 配置为 Web 搜索 Provider
  - 您需要 Perplexity API 密钥或 OpenRouter 代理设置
---

# Perplexity（Web 搜索 Provider）

Perplexity Plugin 通过 Perplexity Search API 或通过 OpenRouter 的 Perplexity Sonar 提供 Web 搜索功能。

<Note>
本页介绍 Perplexity **Provider** 设置。有关 Perplexity **Tool**（Agent 如何使用它），请参见 [Perplexity Tool](/tools/perplexity-search)。
</Note>

- 类型：Web 搜索 Provider（非模型 Provider）
- 身份验证：`PERPLEXITY_API_KEY`（直接）或 `OPENROUTER_API_KEY`（通过 OpenRouter）
- 配置路径：`plugins.entries.perplexity.config.webSearch.apiKey`

## 快速开始

1. 设置 API 密钥：

```bash
openclaw configure --section web
```

或直接设置：

```bash
openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
```

2. 配置后，Agent 将自动为 Web 搜索使用 Perplexity。

## 搜索模式

Plugin 根据 API 密钥前缀自动选择传输方式：

| 密钥前缀 | 传输方式                        | 功能                                               |
| -------- | ------------------------------- | -------------------------------------------------- |
| `pplx-`  | 原生 Perplexity Search API      | 结构化结果、域名/语言/日期过滤器                   |
| `sk-or-` | OpenRouter（Sonar）             | 带引用的 AI 合成答案                               |

## 原生 API 过滤

使用原生 Perplexity API（`pplx-` 密钥）时，搜索支持：

- **国家**：两字母国家代码
- **语言**：ISO 639-1 语言代码
- **日期范围**：day、week、month、year
- **域名过滤器**：允许列表/拒绝列表（最多 20 个域名）
- **内容预算**：`max_tokens`、`max_tokens_per_page`

## 环境注意事项

如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `PERPLEXITY_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
