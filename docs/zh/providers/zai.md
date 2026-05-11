---
mmh3_hash: "8bfcf50d677d3273e5449541af238e17"
title: "Z.AI"
summary: "将 Z.AI (GLM 模型) 与 OpenClaw 一起使用"
read_when:
  - 您想在 OpenClaw 中使用 Z.AI / GLM 模型
  - 您需要简单的 ZAI_API_KEY 设置
---

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API 密钥进行身份验证。在 Z.AI 控制台中创建您的 API 密钥。OpenClaw 使用带有 Z.AI API 密钥的 `zai` Provider。

- Provider：`zai`
- 身份验证：`ZAI_API_KEY`
- API：Z.AI Chat Completions（Bearer 身份验证）

## 快速开始

<Tabs>
  <Tab title="自动检测端点">
    **适合：** 大多数用户。OpenClaw 从密钥中检测匹配的 Z.AI 端点并自动应用正确的 Base URL。

    <Steps>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="明确区域端点">
    **适合：** 想要强制使用特定 Coding Plan 或通用 API 接口的用户。

    <Steps>
      <Step title="选择正确的入门选项">
        ```bash
        # Coding Plan Global（推荐给 Coding Plan 用户）
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN（中国区）
        openclaw onboard --auth-choice zai-coding-cn

        # 通用 API
        openclaw onboard --auth-choice zai-global

        # 通用 API CN（中国区）
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 内置 GLM 目录

OpenClaw 目前内置以下 `zai` Provider 模型：

| 模型引用             | 说明     |
| -------------------- | -------- |
| `zai/glm-5.1`        | 默认模型 |
| `zai/glm-5`          |          |
| `zai/glm-5-turbo`    |          |
| `zai/glm-5v-turbo`   |          |
| `zai/glm-4.7`        |          |
| `zai/glm-4.7-flash`  |          |
| `zai/glm-4.7-flashx` |          |
| `zai/glm-4.6`        |          |
| `zai/glm-4.6v`       |          |
| `zai/glm-4.5`        |          |
| `zai/glm-4.5-air`    |          |
| `zai/glm-4.5-flash`  |          |
| `zai/glm-4.5v`       |          |

<Tip>
GLM 模型可用作 `zai/<model>`（例如：`zai/glm-5`）。默认内置模型引用为 `zai/glm-5.1`。
</Tip>

## 高级配置

<AccordionGroup>
  <Accordion title="前向解析未知 GLM-5 模型">
    未知的 `glm-5*` ID 仍会在内置 Provider 路径上前向解析——当 ID 匹配当前 GLM-5 系列形态时，
    会从 `glm-4.7` 模板合成 Provider 自有的元数据。
  </Accordion>

  <Accordion title="工具调用流式传输">
    默认情况下，Z.AI 启用 `tool_stream` 以支持工具调用流式传输。要禁用它：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="思考和保留思考">
    Z.AI 的思考功能遵循 OpenClaw 的 `/think` 控制。当思考关闭时，
    OpenClaw 发送 `thinking: { type: "disabled" }` 以避免在可见文本之前将输出预算
    消耗在 `reasoning_content` 上。

    保留思考为可选加入，因为 Z.AI 要求回放完整的历史 `reasoning_content`，
    这会增加提示词 Token 数。按模型启用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    启用后，当思考开启时，OpenClaw 发送
    `thinking: { type: "enabled", clear_thinking: false }` 并为同一
    OpenAI 兼容转录回放先前的 `reasoning_content`。

    高级用户仍可通过 `params.extra_body.thinking` 覆盖确切的 Provider 载荷。

  </Accordion>

  <Accordion title="图像理解">
    内置 Z.AI Plugin 注册图像理解。

    | 属性  | 值         |
    | ----- | ---------- |
    | 模型  | `glm-4.6v` |

    图像理解从已配置的 Z.AI 身份验证自动解析，无需额外配置。

  </Accordion>

  <Accordion title="身份验证详情">
    - Z.AI 使用带有您的 API 密钥的 Bearer 身份验证。
    - `zai-api-key` 入门选项从密钥前缀自动检测匹配的 Z.AI 端点。
    - 当您想强制使用特定 API 接口时，请使用明确的区域选项（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="GLM 模型系列" href="/providers/glm" icon="microchip">
    GLM 模型系列概览。
  </Card>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
</CardGroup>
