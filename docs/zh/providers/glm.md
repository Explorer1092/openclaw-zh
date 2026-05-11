---
title: "GLM (Zhipu)"
mmh3_hash: "1b719d019d02d57b5e4e8084452fe992"
summary: "GLM 模型系列概述 + 如何在 OpenClaw 中使用它"
read_when:
  - 您想在 OpenClaw 中使用 GLM 模型
  - 您需要模型命名约定和设置
---

GLM 是通过 [Z.AI](https://z.ai) 平台提供的**模型系列**（不是公司）。在 OpenClaw 中，GLM 模型通过内置的 `zai` Provider 和类似 `zai/glm-5.1` 的模型 ID 访问。

| 属性             | 值                                                                          |
| ---------------- | --------------------------------------------------------------------------- |
| Provider id      | `zai`                                                                       |
| Plugin           | bundled, `enabledByDefault: true`                                           |
| 认证环境变量     | `ZAI_API_KEY` 或 `Z_AI_API_KEY`                                             |
| Onboarding 选项  | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API              | OpenAI 兼容                                                                 |
| 默认 Base URL    | `https://api.z.ai/api/paas/v4`                                              |
| 建议默认模型     | `zai/glm-5.1`                                                               |
| 默认图像模型     | `zai/glm-4.6v`                                                              |

## 快速开始

<Steps>
  <Step title="选择身份验证路由并运行入门">
    选择与您的 Z.AI 计划和地区匹配的入门选项。通用 `zai-api-key` 选项会从密钥格式自动检测匹配端点；当您想强制使用特定的 Coding Plan 或通用 API 接口时，使用显式的区域选项。

    | 身份验证选项        | 适用于                                   |
    | ------------------- | ---------------------------------------- |
    | `zai-api-key`       | 通用 API 密钥，自动检测端点              |
    | `zai-coding-global` | Coding Plan 用户（全球）                 |
    | `zai-coding-cn`     | Coding Plan 用户（中国区）               |
    | `zai-global`        | 通用 API（全球）                         |
    | `zai-cn`            | 通用 API（中国区）                       |

    <CodeGroup>

```bash 自动检测
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan（全球）
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan（中国区）
openclaw onboard --auth-choice zai-coding-cn
```

```bash 通用 API（全球）
openclaw onboard --auth-choice zai-global
```

```bash 通用 API（中国区）
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

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
  `zai-api-key` 让 OpenClaw 从密钥格式检测匹配的 Z.AI 端点并自动应用正确的 Base URL。当您想固定特定的 Coding Plan 或通用 API 接口时，使用显式的区域选项。
</Tip>

## 内置目录

捆绑的 `zai` Provider 预置了 13 个 GLM 模型引用。所有条目除另有说明外均支持推理；`glm-5v-turbo` 和 `glm-4.6v` 同时接受图像和文本输入。

| 模型引用             | 说明                                              |
| -------------------- | ------------------------------------------------- |
| `zai/glm-5.1`        | 默认模型。推理，纯文本，202k 上下文。             |
| `zai/glm-5`          | 推理，纯文本，202k 上下文。                       |
| `zai/glm-5-turbo`    | 推理，纯文本，202k 上下文。                       |
| `zai/glm-5v-turbo`   | 推理，文本 + 图像，202k 上下文。                  |
| `zai/glm-4.7`        | 推理，纯文本，204k 上下文。                       |
| `zai/glm-4.7-flash`  | 推理，纯文本，200k 上下文。                       |
| `zai/glm-4.7-flashx` | 推理，纯文本。                                    |
| `zai/glm-4.6`        | 推理，纯文本。                                    |
| `zai/glm-4.6v`       | 推理，文本 + 图像。默认图像模型。                 |
| `zai/glm-4.5`        | 推理，纯文本。                                    |
| `zai/glm-4.5-air`    | 推理，纯文本。                                    |
| `zai/glm-4.5-flash`  | 推理，纯文本。                                    |
| `zai/glm-4.5v`       | 推理，文本 + 图像。                               |

<Note>
  GLM 版本和可用性可能会发生变化。运行 `openclaw models list --provider zai` 查看当前安装版本已知的目录行，并查看 Z.AI 的文档了解新增或已弃用的模型。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="端点自动检测">
    当您使用 `zai-api-key` 身份验证选项时，OpenClaw 检查密钥格式以确定正确的 Z.AI Base URL。显式的区域选项（`zai-coding-global`、`zai-coding-cn`、`zai-global`、`zai-cn`）会覆盖自动检测并直接固定端点。
  </Accordion>

  <Accordion title="Provider 详情">
    GLM 模型由 `zai` 运行时 Provider 提供服务。有关完整的 Provider 配置、区域端点和附加功能，请参见 [Z.AI Provider 页面](/providers/zai)。
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
  <Card title="思考模式" href="/tools/thinking" icon="brain">
    推理能力 GLM 系列的 `/think` 级别。
  </Card>
  <Card title="模型 FAQ" href="/help/faq-models" icon="circle-question">
    认证配置文件、切换模型和解决"无配置文件"错误。
  </Card>
</CardGroup>
