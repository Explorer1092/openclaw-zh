---
mmh3_hash: "e744832dfd378a4cef830167ac98e2b2"
title: "xAI"
summary: "在 OpenClaw 中使用 xAI Grok 模型"
read_when:
  - 您想在 OpenClaw 中使用 Grok 模型
  - 您正在配置 xAI 身份验证或模型 ID
---

# xAI

OpenClaw 内置了 `xai` Provider Plugin，用于 Grok 模型。

## 设置

1. 在 xAI 控制台创建 API 密钥。
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

## 当前内置模型目录

OpenClaw 开箱即包含以下 xAI 模型系列：

- `grok-4`、`grok-4-0709`
- `grok-4-fast-reasoning`、`grok-4-fast-non-reasoning`
- `grok-4-1-fast-reasoning`、`grok-4-1-fast-non-reasoning`
- `grok-4.20-reasoning`、`grok-4.20-non-reasoning`
- `grok-code-fast-1`

Plugin 还会前向解析遵循相同 API 形态的新版 `grok-4*` 和 `grok-code-fast*` ID。

## Web 搜索

内置的 `grok` Web 搜索 Provider 同样使用 `XAI_API_KEY`：

```bash
openclaw config set tools.web.search.provider grok
```

## 已知限制

- 目前仅支持 API 密钥身份验证，OpenClaw 尚未实现 xAI OAuth/设备码流程。
- `grok-4.20-multi-agent-experimental-beta-0304` 不支持常规 xAI Provider 路径，因为它需要与标准 OpenClaw xAI 传输不同的上游 API 接口。
- 原生 xAI 服务端工具（如 `x_search` 和 `code_execution`）尚未作为内置 Plugin 的一级模型 Provider 功能支持。

## 注意事项

- OpenClaw 会在共享运行路径上自动应用 xAI 专属的工具 Schema 和工具调用兼容性修复。
- 如需了解更广泛的 Provider 概览，请参见 [模型 Provider](/providers/index)。
