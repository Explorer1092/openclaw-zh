---
mmh3_hash: "beb7405b1e4148fb8d527cdbe483e259"
title: "Runway"
summary: "在 OpenClaw 中设置 Runway 视频生成"
read_when:
  - 您想在 OpenClaw 中使用 Runway 视频生成
  - 您需要 Runway API 密钥/环境设置
  - 您想将 Runway 设置为默认视频 Provider
---

OpenClaw 内置了一个 `runway` Provider，用于托管的视频生成。Plugin 默认启用，并将 `runway` Provider 注册到 `videoGenerationProviders` 合约。

| 属性            | 值                                                                |
| --------------- | ----------------------------------------------------------------- |
| Provider id     | `runway`                                                          |
| Plugin          | bundled, `enabledByDefault: true`                                 |
| 认证环境变量    | `RUNWAYML_API_SECRET`（标准）或 `RUNWAY_API_KEY`                  |
| Onboarding flag | `--auth-choice runway-api-key`                                    |
| 直接 CLI 标志   | `--runway-api-key <key>`                                          |
| API             | Runway 基于任务的视频生成（`GET /v1/tasks/{id}` 轮询）            |
| 默认模型        | `runway/gen4.5`                                                   |

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

## 支持的模式和模型

该 Provider 提供七个 Runway 模型，分布在三种模式下。同一个模型 id 可以用于多种模式（例如 `gen4.5` 同时支持文本到视频和图像到视频）。

| 模式           | 模型                                                                   | 参考输入                 |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| 文本到视频     | `gen4.5`（默认）、`veo3.1`、`veo3.1_fast`、`veo3`                      | 无                      |
| 图像到视频     | `gen4.5`、`gen4_turbo`、`gen3a_turbo`、`veo3.1`、`veo3.1_fast`、`veo3` | 1 张本地或远程图像      |
| 视频到视频     | `gen4_aleph`                                                           | 1 个本地或远程视频      |

本地图像和视频参考通过 data URI 支持。

| 宽高比                 | 允许的值                                    |
| ---------------------- | ------------------------------------------- |
| 文本到视频             | `16:9`、`9:16`                              |
| 图像和视频编辑         | `1:1`、`16:9`、`9:16`、`3:4`、`4:3`、`21:9` |

<Warning>
  视频到视频目前需要 `runway/gen4_aleph`。其他 Runway 模型 id 会拒绝视频参考输入。
</Warning>

<Note>
  从错误列中选择 Runway 模型 id 会在 API 请求发出前产生明确的错误。Provider 在 `extensions/runway/video-generation-provider.ts` 中对照模式允许列表（`TEXT_ONLY_MODELS`、`IMAGE_MODELS`、`VIDEO_MODELS`）验证 `model`。
</Note>

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

## 高级配置

<AccordionGroup>
  <Accordion title="环境变量别名">
    OpenClaw 同时识别 `RUNWAYML_API_SECRET`（标准）和 `RUNWAY_API_KEY`。任一变量均可对 Runway Provider 进行认证。
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
  <Card title="配置参考" href="/gateway/config-agents#agent-defaults" icon="gear">
    包含视频生成模型的 Agent 默认设置。
  </Card>
</CardGroup>
