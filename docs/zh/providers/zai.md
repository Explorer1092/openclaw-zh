---
mmh3_hash: "cfd8e679c588e24824c8f8e4f3d80c82"
title: "Z.AI"
sidebarTitle: "Z.AI"
summary: "将 Z.AI (GLM 模型) 与 OpenClaw 一起使用"
read_when:
  - 您想在 OpenClaw 中使用 Z.AI / GLM 模型
  - 您需要简单的 ZAI_API_KEY 设置
---

# Z.AI

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API 密钥进行身份验证。在 Z.AI 控制台中创建您的 API 密钥。OpenClaw 使用带有 Z.AI API 密钥的 `zai` Provider。

## CLI 设置

```bash
# 通用 API 密钥设置，自动检测端点
openclaw onboard --auth-choice zai-api-key

# Coding Plan Global，推荐给 Coding Plan 用户
openclaw onboard --auth-choice zai-coding-global

# Coding Plan CN（中国区），推荐给 Coding Plan 用户
openclaw onboard --auth-choice zai-coding-cn

# 通用 API
openclaw onboard --auth-choice zai-global

# 通用 API CN（中国区）
openclaw onboard --auth-choice zai-cn
```

## 配置片段

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

`zai-api-key` 让 OpenClaw 从密钥中检测匹配的 Z.AI 端点并自动应用正确的 Base URL。当您想强制使用特定的 Coding Plan 或通用 API 接口时，请使用明确的区域选项。

## 内置 GLM 目录

OpenClaw 目前内置以下 `zai` Provider 模型：

- `glm-5.1`
- `glm-5`
- `glm-5-turbo`
- `glm-5v-turbo`
- `glm-4.7`
- `glm-4.7-flash`
- `glm-4.7-flashx`
- `glm-4.6`
- `glm-4.6v`
- `glm-4.5`
- `glm-4.5-air`
- `glm-4.5-flash`
- `glm-4.5v`

## 注意事项

- GLM 模型可用作 `zai/<model>`（例如：`zai/glm-5`）。
- 默认内置模型引用：`zai/glm-5`。
- 未知的 `glm-5*` ID 仍会在内置 Provider 路径上前向解析——当 ID 匹配当前 GLM-5 系列形态时，会从 `glm-4.7` 模板合成 Provider 自有的元数据。
- 默认情况下，Z.AI 启用 `tool_stream` 以支持工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设置为 `false` 可禁用它。
- 有关模型系列概述，请参见 [/providers/glm](/providers/glm)。
- Z.AI 使用带有您的 API 密钥的 Bearer 身份验证。
