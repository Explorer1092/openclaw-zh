---
mmh3_hash: "1af0524fa869005faef1a1aa93d1bdcb"
title: "Z.AI"
summary: "将 Z.AI (GLM 模型) 与 OpenClaw 一起使用"
read_when:
  - 您想在 OpenClaw 中使用 Z.AI / GLM 模型
  - 您需要简单的 ZAI_API_KEY 设置
---

Z.AI 是 **GLM** 模型的 API 平台。它为 GLM 提供 REST API，并使用 API 密钥进行身份验证。在 Z.AI 控制台中创建您的 API 密钥。OpenClaw 使用带有 Z.AI API 密钥的 `zai` Provider。

| 属性 | 值                                           |
| ---- | -------------------------------------------- |
| Provider | `zai`                                   |
| 身份验证 | `ZAI_API_KEY`（旧版别名：`Z_AI_API_KEY`） |
| API  | Z.AI Chat Completions（Bearer 身份验证）     |

## GLM 模型

GLM 是一个模型系列，而非单独的 Provider。在 OpenClaw 中，GLM 模型使用
`zai/glm-5.1` 格式的引用：Provider `zai`，模型 ID `glm-5.1`。

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
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --all --provider zai
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
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 配置示例

<Tip>
`zai-api-key` 让 OpenClaw 从密钥中检测匹配的 Z.AI 端点并自动应用正确的 Base URL。当您想强制使用特定 Coding Plan 或通用 API 接口时，请使用明确的区域选项。
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // 示例值。入门程序为您的端点写入匹配的 baseUrl。
        baseUrl: "https://api.z.ai/api/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

## 内置目录

OpenClaw 在 Plugin 清单中提供捆绑的 `zai` Provider 目录，因此只读
列表可以在不加载 Provider 运行时的情况下显示已知的 GLM 行：

```bash
openclaw models list --all --provider zai
```

清单支持的目录当前包含：

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
GLM 模型可用作 `zai/<model>`（例如：`zai/glm-5`）。
</Tip>

<Note>
默认内置模型引用为 `zai/glm-5.1`。GLM 版本和可用性可能会变化；运行 `openclaw models list --all --provider zai` 查看您已安装版本所知的目录。
</Note>

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
    - `zai-api-key` 入门选项通过探测支持的端点来自动检测匹配的 Z.AI 端点。
    - 当您想强制使用特定 API 接口时，请使用明确的区域选项（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）。
    - 旧版环境变量 `Z_AI_API_KEY` 仍被接受；如果 `ZAI_API_KEY` 未设置，OpenClaw 会在启动时将其复制到 `ZAI_API_KEY`。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置 Schema，包括 Provider 和模型设置。
  </Card>
</CardGroup>
