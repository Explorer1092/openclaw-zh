---
mmh3_hash: "095f79b350d2954c5babd4c9a9907138"
title: "GLM Models"
sidebarTitle: "GLM"
summary: "GLM 模型系列概述 + 如何在 OpenClaw 中使用它"
read_when:
  - 您想在 OpenClaw 中使用 GLM 模型
  - 您需要模型命名约定和设置
---

# GLM 模型

GLM 是通过 Z.AI 平台提供的**模型系列**（不是公司）。在 OpenClaw 中，GLM 模型通过 `zai` Provider 和类似 `zai/glm-5` 的模型 ID 访问。

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

`zai-api-key` 让 OpenClaw 从密钥检测匹配的 Z.AI 端点并自动应用正确的 Base URL。当您想强制使用特定的 Coding Plan 或通用 API 界面时，使用显式的区域选项。

## 当前内置 GLM 模型

OpenClaw 目前为内置 `zai` Provider 提供以下 GLM 引用：

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

- GLM 版本和可用性可能会发生变化；请查看 Z.AI 的文档以获取最新信息。
- 默认内置模型引用为 `zai/glm-5`。
- 有关 Provider 详细信息，请参见 [/providers/zai](/providers/zai)。
