---
title: "fal"
mmh3_hash: "bb2546ab80388cd3ebc8b71fe4e798d2"
summary: "在 OpenClaw 中设置 fal 图像和视频生成"
read_when:
  - 您想在 OpenClaw 中使用 fal 图像生成
  - 您需要 FAL_KEY 身份验证流程
  - 您想要 fal 的 image_generate 或 video_generate 默认配置
---

# fal

OpenClaw 内置了一个 `fal` Provider，用于托管的图像和视频生成。

| 属性     | 值                                                            |
| -------- | ------------------------------------------------------------- |
| Provider | `fal`                                                         |
| 身份验证 | `FAL_KEY`（标准；`FAL_API_KEY` 也可作为备选）                 |
| API      | fal 模型端点                                                  |

## 快速开始

<Steps>
  <Step title="设置 API 密钥">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="设置默认图像模型">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## 图像生成

内置的 `fal` 图像生成 Provider 默认使用 `fal/fal-ai/flux/dev`。

| 能力         | 值                         |
| ------------ | -------------------------- |
| 最大图像数   | 每次请求 4 张              |
| 编辑模式     | 已启用，支持 1 张参考图像  |
| 尺寸覆盖     | 支持                       |
| 宽高比       | 支持                       |
| 分辨率       | 支持                       |

<Warning>
fal 图像编辑端点**不**支持 `aspectRatio` 覆盖。
</Warning>

将 fal 设置为默认图像 Provider：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/fal-ai/flux/dev",
      },
    },
  },
}
```

## 视频生成

内置的 `fal` 视频生成 Provider 默认使用 `fal/fal-ai/minimax/video-01-live`。

| 能力   | 值                                                           |
| ------ | ------------------------------------------------------------ |
| 模式   | 文本到视频、单图像参考                                       |
| 运行时 | 基于队列的提交/状态/结果流程，适用于长时间运行的任务         |

<AccordionGroup>
  <Accordion title="可用视频模型">
    **HeyGen video-agent：**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0：**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`

  </Accordion>

  <Accordion title="Seedance 2.0 配置示例">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="HeyGen video-agent 配置示例">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

<Tip>
使用 `openclaw models list --provider fal` 查看可用 fal 模型的完整列表，包括最近添加的条目。
</Tip>

## 相关

<CardGroup cols={2}>
  <Card title="图像生成" href="/tools/image-generation" icon="image">
    共享图像工具参数和 Provider 选择。
  </Card>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    共享视频工具参数和 Provider 选择。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference#agent-defaults" icon="gear">
    包括图像和视频模型选择的 Agent 默认值。
  </Card>
</CardGroup>
