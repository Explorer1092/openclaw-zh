---
mmh3_hash: "a2c1b520bab9897c183a78d51f75c315"
summary: "在 OpenClaw 中使用 StepFun 模型"
read_when:
  - 您想在 OpenClaw 中使用 StepFun 模型
  - 您需要 StepFun 设置指导
title: "StepFun"
---

# StepFun

OpenClaw 内置了一个 StepFun Provider 插件，包含两个 Provider id：

- `stepfun` 用于标准端点
- `stepfun-plan` 用于 Step Plan 端点

<Warning>
标准和 Step Plan 是**独立的 Provider**，具有不同的端点和模型引用前缀（`stepfun/...` 对 `stepfun-plan/...`）。中国密钥使用 `.com` 端点，全球密钥使用 `.ai` 端点。
</Warning>

## 区域和端点概述

| 端点      | 中国（`.com`）                         | 全球（`.ai`）                         |
| --------- | -------------------------------------- | ------------------------------------- |
| 标准      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

身份验证环境变量：`STEPFUN_API_KEY`

## 内置目录

标准（`stepfun`）：

| 模型引用                 | 上下文  | 最大输出 | 说明                   |
| ------------------------ | ------- | -------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536   | 默认标准模型           |

Step Plan（`stepfun-plan`）：

| 模型引用                           | 上下文  | 最大输出 | 说明                      |
| ---------------------------------- | ------- | -------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536   | 默认 Step Plan 模型        |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536   | 额外的 Step Plan 模型      |

## 快速开始

选择您的 Provider 接口并按照设置步骤操作。

<Tabs>
  <Tab title="标准">
    **适合：** 通过标准 StepFun 端点进行通用用途。

    <Steps>
      <Step title="选择端点区域">
        | Auth 选项                        | 端点                             | 区域          |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | 国际          |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | 中国          |
      </Step>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        或使用中国端点：

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="非交互式替代方式">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### 模型引用

    - 默认模型：`stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **适合：** Step Plan 推理端点。

    <Steps>
      <Step title="选择端点区域">
        | Auth 选项                    | 端点                                    | 区域          |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | 国际          |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | 中国          |
      </Step>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        或使用中国端点：

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="非交互式替代方式">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### 模型引用

    - 默认模型：`stepfun-plan/step-3.5-flash`
    - 备选模型：`stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## 高级

<AccordionGroup>
  <Accordion title="完整配置：标准 Provider">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          stepfun: {
            baseUrl: "https://api.stepfun.ai/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="完整配置：Step Plan Provider">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          "stepfun-plan": {
            baseUrl: "https://api.stepfun.ai/step_plan/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
              {
                id: "step-3.5-flash-2603",
                name: "Step 3.5 Flash 2603",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="说明">
    - 该 Provider 内置于 OpenClaw，无需单独安装插件步骤。
    - `step-3.5-flash-2603` 目前仅在 `stepfun-plan` 上公开。
    - 单个身份验证流程会为 `stepfun` 和 `stepfun-plan` 写入区域匹配的配置文件，因此两个接口可以一起被发现。
    - 使用 `openclaw models list` 和 `openclaw models set <provider/model>` 来检查或切换模型。
  </Accordion>
</AccordionGroup>

<Note>
有关更广泛的 Provider 概述，请参见[模型 Provider](/concepts/model-providers)。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="模型 Provider" href="/concepts/model-providers" icon="layers">
    所有 Provider、模型引用和故障转移行为概述。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    Provider、模型和插件的完整配置 Schema。
  </Card>
  <Card title="模型选择" href="/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="StepFun 平台" href="https://platform.stepfun.com" icon="globe">
    StepFun API 密钥管理和文档。
  </Card>
</CardGroup>
