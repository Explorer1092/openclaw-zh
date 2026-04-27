---
mmh3_hash: "a3bf4813b6f99cc1a4d7107928234e51"
title: "Runway"
summary: "在 OpenClaw 中设置 Runway 视频生成"
read_when:
  - 您想在 OpenClaw 中使用 Runway 视频生成
  - 您需要 Runway API 密钥/环境设置
  - 您想将 Runway 设置为默认视频 Provider
---

OpenClaw 内置了一个 `runway` Provider，用于托管的视频生成。

| 属性         | 值                                                                |
| ----------- | ----------------------------------------------------------------- |
| Provider id | `runway`                                                          |
| 身份验证    | `RUNWAYML_API_SECRET`（标准）或 `RUNWAY_API_KEY`                  |
| API         | Runway 基于任务的视频生成（`GET /v1/tasks/{id}` 轮询）            |

## 快速开始

<Steps>
  <Step title="设置 API 密钥">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="将 Runway 设置为默认视频 Provider">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="生成视频">
    要求 Agent 生成视频。Runway 将自动被使用。
  </Step>
</Steps>

## 支持的模式

| 模式           | 模型               | 参考输入                 |
| -------------- | ------------------ | ------------------------ |
| 文本到视频     | `gen4.5`（默认）   | 无                       |
| 图像到视频     | `gen4.5`           | 1 张本地或远程图像       |
| 视频到视频     | `gen4_aleph`       | 1 个本地或远程视频       |

<Note>
本地图像和视频参考通过数据 URI 支持。纯文本运行目前支持 `16:9` 和 `9:16` 宽高比。
</Note>

<Warning>
视频到视频目前需要专门使用 `runway/gen4_aleph`。
</Warning>

## 配置

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## 高级说明

<AccordionGroup>
  <Accordion title="环境变量别名">
    OpenClaw 同时识别 `RUNWAYML_API_SECRET`（标准）和 `RUNWAY_API_KEY`。任一变量均可对 Runway Provider 进行身份验证。
  </Accordion>

  <Accordion title="任务轮询">
    Runway 使用基于任务的 API。提交生成请求后，OpenClaw 会轮询 `GET /v1/tasks/{id}` 直到视频准备好。无需对轮询行为进行额外配置。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    共享工具参数、Provider 选择和异步行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference#agent-defaults" icon="gear">
    包含视频生成模型的 Agent 默认设置。
  </Card>
</CardGroup>
