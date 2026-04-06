---
mmh3_hash: "3fa3187a776fd01daf4a59dfbe7997ab"
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

OpenClaw 现在使用 xAI Responses API 作为内置 xAI 传输。同一个 `XAI_API_KEY` 还可以驱动 Grok 支持的 `web_search`、一级 `x_search` 和远程 `code_execution`。如果您在 `plugins.entries.xai.config.webSearch.apiKey` 下存储了 xAI 密钥，内置 xAI 模型 Provider 现在也会将其作为回退密钥。`code_execution` 调优在 `plugins.entries.xai.config.codeExecution` 下配置。

## 当前内置模型目录

OpenClaw 开箱即包含以下 xAI 模型系列：

- `grok-3`、`grok-3-fast`、`grok-3-mini`、`grok-3-mini-fast`
- `grok-4`、`grok-4-0709`
- `grok-4-fast`、`grok-4-fast-non-reasoning`
- `grok-4-1-fast`、`grok-4-1-fast-non-reasoning`
- `grok-4.20-beta-latest-reasoning`、`grok-4.20-beta-latest-non-reasoning`
- `grok-code-fast-1`

Plugin 还会前向解析遵循相同 API 形态的新版 `grok-4*` 和 `grok-code-fast*` ID。

快速模型说明：

- `grok-4-fast`、`grok-4-1-fast` 和 `grok-4.20-beta-*` 变体是内置目录中当前支持图像的 Grok 引用。
- `/fast on` 或 `agents.defaults.models["xai/<model>"].params.fastMode: true` 会按以下方式重写原生 xAI 请求：
  - `grok-3` -> `grok-3-fast`
  - `grok-3-mini` -> `grok-3-mini-fast`
  - `grok-4` -> `grok-4-fast`
  - `grok-4-0709` -> `grok-4-fast`

旧版兼容别名仍会规范化到内置的规范 ID，例如：

- `grok-4-fast-reasoning` -> `grok-4-fast`
- `grok-4-1-fast-reasoning` -> `grok-4-1-fast`
- `grok-4.20-reasoning` -> `grok-4.20-beta-latest-reasoning`
- `grok-4.20-non-reasoning` -> `grok-4.20-beta-latest-non-reasoning`

## Web 搜索

内置的 `grok` Web 搜索 Provider 同样使用 `XAI_API_KEY`：

```bash
openclaw config set tools.web.search.provider grok
```

## 视频生成

内置的 `xai` Plugin 还通过共享的 `video_generate` 工具注册视频生成。

- 默认视频模型：`xai/grok-imagine-video`
- 模式：文本到视频、图像到视频和远程视频编辑/延长流程
- 支持 `aspectRatio` 和 `resolution`
- 当前限制：不接受本地视频缓冲区；视频参考/编辑输入请使用远程 `http(s)` URL

将 xAI 设置为默认视频 Provider：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "xai/grok-imagine-video",
      },
    },
  },
}
```

请参见[视频生成](/tools/video-generation)了解共享工具参数、Provider 选择和故障转移行为。

## 已知限制

- 目前仅支持 API 密钥身份验证，OpenClaw 尚未实现 xAI OAuth/设备码流程。
- `grok-4.20-multi-agent-experimental-beta-0304` 不支持常规 xAI Provider 路径，因为它需要与标准 OpenClaw xAI 传输不同的上游 API 接口。

## 注意事项

- OpenClaw 会在共享运行路径上自动应用 xAI 专属的工具 Schema 和工具调用兼容性修复。
- 原生 xAI 请求默认启用 `tool_stream: true`。将 `agents.defaults.models["xai/<model>"].params.tool_stream` 设置为 `false` 可禁用它。
- 内置 xAI 封装器在发送原生 xAI 请求前会剥离不支持的严格工具 Schema 标志和推理负载键。
- `web_search`、`x_search` 和 `code_execution` 作为 OpenClaw 工具暴露。OpenClaw 在每次工具请求中启用所需的具体 xAI 内置工具，而不是在每次聊天轮次中附加所有原生工具。
- `x_search` 和 `code_execution` 由内置 xAI Plugin 管理，而非硬编码到核心模型运行时中。
- `code_execution` 是远程 xAI 沙箱执行，不是本地 [`exec`](/tools/exec)。
- 有关更广泛的 Provider 概览，请参见[模型 Provider](/providers/index)。
