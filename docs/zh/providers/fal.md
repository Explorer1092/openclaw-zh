---
mmh3_hash: "c221c3f6dc1dc5a10ca9c9b1695f2e21"
title: "fal"
summary: "在 OpenClaw 中设置 fal 图像、视频和音乐生成"
read_when:
  - 您想在 OpenClaw 中使用 fal 图像生成
  - 您需要 FAL_KEY 身份验证流程
  - 您想要 fal 的 image_generate、video_generate 或 music_generate 默认配置
---

OpenClaw 内置了一个 `fal` Provider，用于托管的图像、视频和音乐生成。

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

| 能力         | 值                                                                  |
| ------------ | ------------------------------------------------------------------- |
| 最大图像数   | 每次请求 4 张                                                       |
| 编辑模式     | Flux：1 张参考图像；GPT Image 2：10 张；Nano Banana 2：14 张        |
| 尺寸覆盖     | 支持                                                                |
| 宽高比       | 支持生成及 GPT Image 2/Nano Banana 2 编辑                           |
| 分辨率       | 支持                                                                |
| 输出格式     | `png` 或 `jpeg`                                                     |

<Warning>
Flux 图像到图像请求**不**支持 `aspectRatio` 覆盖。GPT Image 2 和 Nano Banana 2 编辑请求使用 fal 的 `/edit` 端点，并接受宽高比提示。
</Warning>

当您需要 PNG 输出时，使用 `outputFormat: "png"`。fal 在 OpenClaw 中未声明明确的透明背景控制，因此 `background: "transparent"` 对 fal 模型将报告为被忽略的覆盖。

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
| 模式   | 文本到视频、单图像参考、Seedance 参考到视频                   |
| 运行时 | 基于队列的提交/状态/结果流程，适用于长时间运行的任务         |

<AccordionGroup>
  <Accordion title="可用视频模型">
    **HeyGen video-agent：**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0：**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

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

  <Accordion title="Seedance 2.0 reference-to-video 配置示例">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    Reference-to-video 通过共享 `video_generate` 的 `images`、`videos` 和 `audioRefs` 参数最多接受 9 张图像、3 个视频和 3 个音频参考，总参考文件数量不超过 12 个。

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

## 音乐生成

内置的 `fal` 插件还为共享的 `music_generate` 工具注册了一个音乐生成 Provider。

| 能力       | 值                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| 默认模型   | `fal/fal-ai/minimax-music/v2.6`                                                                      |
| 模型       | `fal-ai/minimax-music/v2.6`、`fal-ai/ace-step/prompt-to-audio`、`fal-ai/stable-audio-25/text-to-audio` |
| 运行时     | 同步请求加生成音频下载                                                                               |

将 fal 设置为默认音乐 Provider：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` 支持明确歌词和纯音乐模式。ACE-Step 和 Stable Audio 是文本到音频端点；在需要这些模型系列时通过 `model` 覆盖选择它们。

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
  <Card title="音乐生成" href="/tools/music-generation" icon="music">
    共享音乐工具参数和 Provider 选择。
  </Card>
  <Card title="配置参考" href="/gateway/config-agents#agent-defaults" icon="gear">
    包括图像、视频和音乐模型选择的 Agent 默认值。
  </Card>
</CardGroup>
