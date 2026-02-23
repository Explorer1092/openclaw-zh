---
mmh3_hash: "will-be-updated"
title: "Z.AI"
sidebarTitle: "Z.AI"
summary: "将 Z.AI (GLM 模型) 与 OpenClaw 一起使用"
read_when:
  - 您想在 OpenClaw 中使用 Z.AI / GLM 模型
  - 您需要简单的 ZAI_API_KEY 设置
---

# Z.AI

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API 密钥进行身份验证。在 Z.AI 控制台中创建您的 API 密钥。OpenClaw 使用带有 Z.AI API 密钥的 `zai` 提供商。

## CLI 设置

```bash
openclaw onboard --auth-choice zai-api-key
# 或非交互式
openclaw onboard --zai-api-key "$ZAI_API_KEY"
```

## 配置片段

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5" } } },
}
```

## 注意事项

- GLM 模型可用作 `zai/<model>`（例如：`zai/glm-5`）。
- 默认情况下，Z.AI 启用 `tool_stream` 以支持工具调用流式传输。将 `agents.defaults.models["zai/<model>"].params.tool_stream` 设置为 `false` 可禁用它。
- 有关模型系列概述，请参见 [/providers/glm](/providers/glm)。
- Z.AI 使用带有您的 API 密钥的 Bearer 身份验证。
