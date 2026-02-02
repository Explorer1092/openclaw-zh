---
title: "GLM Models"
sidebarTitle: "GLM"
mmh3_hash: "3f8c0842d522997f19d627e8ea234b7b"
summary: "GLM 模型系列概述 + 如何在 OpenClaw 中使用它"
read_when: ["您想在 OpenClaw 中使用 GLM 模型","您需要模型命名约定和设置"]
---
# GLM 模型

GLM 是通过 Z.AI 平台提供的**模型系列**(不是公司)。在 OpenClaw 中,GLM 模型通过 `zai` 提供商和类似 `zai/glm-4.7` 的模型 ID 访问。

## CLI 设置

```bash
openclaw onboard --auth-choice zai-api-key
```

## 配置片段

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-4.7" } } },
}
```

## 注意事项

- GLM 版本和可用性可能会发生变化;请查看 Z.AI 的文档以获取最新信息。
- 示例模型 ID 包括 `glm-4.7` 和 `glm-4.6`。
- 有关提供商详细信息,请参见 [/providers/zai](/providers/zai)。
