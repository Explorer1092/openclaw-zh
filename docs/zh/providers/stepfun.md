---
mmh3_hash: "332f1286986ef4c15ded16d283808b94"
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

内置目录按界面有所不同：

- 标准：`step-3.5-flash`
- Step Plan：`step-3.5-flash`、`step-3.5-flash-2603`

## 区域和端点概述

- 中国标准端点：`https://api.stepfun.com/v1`
- 全球标准端点：`https://api.stepfun.ai/v1`
- 中国 Step Plan 端点：`https://api.stepfun.com/step_plan/v1`
- 全球 Step Plan 端点：`https://api.stepfun.ai/step_plan/v1`
- 身份验证环境变量：`STEPFUN_API_KEY`

中国密钥使用 `.com` 端点，全球密钥使用 `.ai` 端点。

## CLI 设置

交互式设置：

```bash
openclaw onboard
```

选择以下身份验证选项之一：

- `stepfun-standard-api-key-cn`
- `stepfun-standard-api-key-intl`
- `stepfun-plan-api-key-cn`
- `stepfun-plan-api-key-intl`

非交互式示例：

```bash
openclaw onboard --auth-choice stepfun-standard-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
openclaw onboard --auth-choice stepfun-plan-api-key-intl --stepfun-api-key "$STEPFUN_API_KEY"
```

## 模型引用

- 标准默认模型：`stepfun/step-3.5-flash`
- Step Plan 默认模型：`stepfun-plan/step-3.5-flash`
- Step Plan 备选模型：`stepfun-plan/step-3.5-flash-2603`

## 内置目录

标准（`stepfun`）：

| 模型引用                 | 上下文  | 最大输出 | 备注                   |
| ------------------------ | ------- | -------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536   | 默认标准模型           |

Step Plan（`stepfun-plan`）：

| 模型引用                           | 上下文  | 最大输出 | 备注                      |
| ---------------------------------- | ------- | -------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536   | 默认 Step Plan 模型        |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536   | 额外的 Step Plan 模型      |

## 配置片段

标准 Provider：

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

Step Plan Provider：

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

## 注意事项

- 该 Provider 内置于 OpenClaw，无需单独安装插件步骤。
- `step-3.5-flash-2603` 目前仅在 `stepfun-plan` 上公开。
- 单个身份验证流程会为 `stepfun` 和 `stepfun-plan` 写入区域匹配的配置文件，因此两个界面可以一起被发现。
- 使用 `openclaw models list` 和 `openclaw models set <provider/model>` 来检查或切换模型。
- 有关更广泛的 Provider 概述，请参见[模型 Provider](/concepts/model-providers)。
