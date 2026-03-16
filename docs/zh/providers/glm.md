---
title: "GLM Models"
sidebarTitle: "GLM"
mmh3_hash: "d5d48f6847ad89ba02502b488200140a"
summary: "GLM 模型系列概述 + 如何在 OpenClaw 中使用它"
read_when:
  - 您想在 OpenClaw 中使用 GLM 模型
  - 您需要模型命名约定和设置
---

# GLM 模型

GLM 是通过 Z.AI 平台提供的**模型系列**（不是公司）。在 OpenClaw 中，GLM 模型通过 `zai` 提供商和类似 `zai/glm-5` 的模型 ID 访问。

## CLI 设置

```bash
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

## 注意事项

- GLM 版本和可用性可能会发生变化；请查看 Z.AI 的文档以获取最新信息。
- 示例模型 ID 包括 `glm-5`、`glm-4.7` 和 `glm-4.6`。
- 有关提供商详细信息，请参见 [/providers/zai](/providers/zai)。
