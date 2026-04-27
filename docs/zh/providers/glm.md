---
title: "GLM (Zhipu)"
mmh3_hash: "3c794600d2516172f066b16ccaa96e9d"
summary: "GLM 模型系列概述 + 如何在 OpenClaw 中使用它"
read_when:
  - 您想在 OpenClaw 中使用 GLM 模型
  - 您需要模型命名约定和设置
---

# GLM 模型

GLM 是通过 Z.AI 平台提供的**模型系列**（不是公司）。在 OpenClaw 中，GLM 模型通过 `zai` Provider 和类似 `zai/glm-5` 的模型 ID 访问。

## 快速开始

<Steps>
  <Step title="选择身份验证路由并运行入门">
    选择与您的 Z.AI 计划和地区匹配的入门选项：

    | 身份验证选项        | 适用于                             |
    | ------------------- | ---------------------------------- |
    | `zai-api-key`       | 通用 API 密钥设置，自动检测端点    |
    | `zai-coding-global` | Coding Plan 用户（全球）           |
    | `zai-coding-cn`     | Coding Plan 用户（中国区）         |
    | `zai-global`        | 通用 API（全球）                   |
    | `zai-cn`            | 通用 API（中国区）                 |

    ```bash
    # 示例：通用自动检测
    openclaw onboard --auth-choice zai-api-key

    # 示例：Coding Plan 全球
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="将 GLM 设置为默认模型">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## 配置示例

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` 让 OpenClaw 从密钥检测匹配的 Z.AI 端点并自动应用正确的 Base URL。当您想强制使用特定的 Coding Plan 或通用 API 界面时，使用显式的区域选项。
</Tip>

## 内置 GLM 模型

OpenClaw 目前为内置 `zai` Provider 提供以下 GLM 引用：

| 模型            | 模型             |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
默认内置模型引用为 `zai/glm-5.1`。GLM 版本和可用性可能会发生变化；请查看 Z.AI 的文档以获取最新信息。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="端点自动检测">
    当您使用 `zai-api-key` 身份验证选项时，OpenClaw 检查密钥格式以确定正确的 Z.AI Base URL。显式的区域选项（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）会覆盖自动检测并直接固定端点。
  </Accordion>

  <Accordion title="Provider 详情">
    GLM 模型由 `zai` 运行时 Provider 提供服务。有关完整的 Provider 配置、区域端点和附加功能，请参见 [Z.AI Provider 文档](/providers/zai)。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="Z.AI Provider" href="/providers/zai" icon="server">
    完整的 Z.AI Provider 配置和区域端点。
  </Card>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
</CardGroup>
