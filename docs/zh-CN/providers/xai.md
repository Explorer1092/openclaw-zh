---
mmh3_hash: "add76d608510606f55a391ebc9ce2565"
read_when:
  - 你想在 OpenClaw 中使用 Grok 模型
  - 你正在配置 xAI 认证或模型 ID
summary: 在 OpenClaw 中使用 xAI Grok 模型
title: xAI
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: providers/xai.md
  workflow: 15
---

# xAI

OpenClaw 内置了用于 Grok 模型的 `xai` 提供商插件。

## 设置

1. 在 xAI Console 中创建 API key。
2. 设置 `XAI_API_KEY`，或运行：

```bash
openclaw onboard --auth-choice xai-api-key
```

3. 选择一个模型，例如：

```json5
{
  agents: { defaults: { model: { primary: "xai/grok-4" } } },
}
```

OpenClaw 现在使用 xAI Responses API 作为内置 xAI 传输层。同一个
`XAI_API_KEY` 也可用于支持 Grok 的 `web_search`、一流的 `x_search`
和远程 `code_execution`。
如果你在 `plugins.entries.xai.config.webSearch.apiKey` 下存储了 xAI key，
内置 xAI 模型提供商现在也会将其作为回退 key 使用。
`code_execution` 调优位于 `plugins.entries.xai.config.codeExecution` 下。

## 当前内置模型目录

OpenClaw 开箱即包含以下 xAI 模型系列：

- `grok-4`、`grok-4-0709`
- `grok-4-fast-reasoning`、`grok-4-fast-non-reasoning`
- `grok-4-1-fast-reasoning`、`grok-4-1-fast-non-reasoning`
- `grok-4.20-reasoning`、`grok-4.20-non-reasoning`
- `grok-code-fast-1`

该插件还会前向解析遵循相同 API 形态的更新版 `grok-4*` 和 `grok-code-fast*` ID。

## 网络搜索

内置 `grok` 网络搜索提供商也使用 `XAI_API_KEY`：

```bash
openclaw config set tools.web.search.provider grok
```

## 已知限制

- 目前仅支持 API key 认证。OpenClaw 尚不支持 xAI OAuth/设备码流程。
- `grok-4.20-multi-agent-experimental-beta-0304` 不支持普通 xAI 提供商路径，因为它需要与标准 OpenClaw xAI 传输层不同的上游 API 接口。

## 说明

- OpenClaw 会在共享运行器路径上自动应用 xAI 专有的工具 Schema 和工具调用兼容性修复。
- `web_search`、`x_search` 和 `code_execution` 作为 OpenClaw 工具暴露。OpenClaw 在每次工具请求中启用所需的特定 xAI 内置功能，而不是将所有原生工具附加到每轮对话。
- `x_search` 和 `code_execution` 由内置 xAI 插件所有，而非硬编码到核心模型运行时。
- `code_execution` 是远程 xAI 沙箱执行，而非本地 [`exec`](/tools/exec)。
- 有关更广泛的提供商概览，请参见 [模型提供商](/providers/index)。
