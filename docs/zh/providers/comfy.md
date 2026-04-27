---
mmh3_hash: "5cec231fd21d9c8ec0799f3541702f52"
title: "ComfyUI"
summary: "在 OpenClaw 中设置 ComfyUI 工作流图像、视频和音乐生成"
read_when:
  - 您想在 OpenClaw 中使用本地 ComfyUI 工作流
  - 您想将 Comfy Cloud 用于图像、视频或音乐工作流
  - 您需要内置 comfy 插件配置键
---

OpenClaw 内置了一个 `comfy` 插件，用于工作流驱动的 ComfyUI 运行。插件完全由工作流驱动，因此 OpenClaw 不会尝试将通用的 `size`、`aspectRatio`、`resolution`、`durationSeconds` 或 TTS 样式控件映射到您的图形上。

| 属性     | 详情                                                                               |
| -------- | ---------------------------------------------------------------------------------- |
| Provider | `comfy`                                                                            |
| 模型     | `comfy/workflow`                                                                   |
| 共享界面 | `image_generate`、`video_generate`、`music_generate`                               |
| 身份验证 | 本地 ComfyUI 无需身份验证；Comfy Cloud 使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| API      | ComfyUI `/prompt` / `/history` / `/view` 和 Comfy Cloud `/api/*`                  |

## 支持的功能

- 从工作流 JSON 生成图像
- 使用 1 张上传的参考图像进行图像编辑
- 从工作流 JSON 生成视频
- 使用 1 张上传的参考图像生成视频
- 通过共享 `music_generate` 工具进行音乐或音频生成
- 从配置的节点或所有匹配的输出节点下载输出

## 快速开始

选择在您自己的机器上运行 ComfyUI 或使用 Comfy Cloud。

<Tabs>
  <Tab title="本地">
    **最适合：** 在您的机器或局域网上运行自己的 ComfyUI 实例。

    <Steps>
      <Step title="在本地启动 ComfyUI">
        确保您的本地 ComfyUI 实例正在运行（默认为 `http://127.0.0.1:8188`）。
      </Step>
      <Step title="准备工作流 JSON">
        导出或创建 ComfyUI 工作流 JSON 文件。注意提示输入节点和您希望 OpenClaw 读取的输出节点的节点 ID。
      </Step>
      <Step title="配置 Provider">
        设置 `mode: "local"` 并指向您的工作流文件。这是一个最小图像示例：

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "local",
                  baseUrl: "http://127.0.0.1:8188",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```
      </Step>
      <Step title="设置默认模型">
        将 OpenClaw 指向您配置的功能的 `comfy/workflow` 模型：

        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="验证">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Comfy Cloud">
    **最适合：** 在 Comfy Cloud 上运行工作流，无需管理本地 GPU 资源。

    <Steps>
      <Step title="获取 API 密钥">
        在 [comfy.org](https://comfy.org) 注册并从帐户控制台生成 API 密钥。
      </Step>
      <Step title="设置 API 密钥">
        通过以下方法之一提供您的密钥：

        ```bash
        # 环境变量（推荐）
        export COMFY_API_KEY="your-key"

        # 备用环境变量
        export COMFY_CLOUD_API_KEY="your-key"

        # 或内联配置
        openclaw config set plugins.entries.comfy.config.apiKey "your-key"
        ```
      </Step>
      <Step title="准备工作流 JSON">
        导出或创建 ComfyUI 工作流 JSON 文件。注意提示输入节点和输出节点的节点 ID。
      </Step>
      <Step title="配置 Provider">
        设置 `mode: "cloud"` 并指向您的工作流文件：

        ```json5
        {
          plugins: {
            entries: {
              comfy: {
                config: {
                  mode: "cloud",
                  image: {
                    workflowPath: "./workflows/flux-api.json",
                    promptNodeId: "6",
                    outputNodeId: "9",
                  },
                },
              },
            },
          },
        }
        ```

        <Tip>
        云模式默认 `baseUrl` 为 `https://cloud.comfy.org`。只有在使用自定义云端点时才需要设置 `baseUrl`。
        </Tip>
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              imageGenerationModel: {
                primary: "comfy/workflow",
              },
            },
          },
        }
        ```
      </Step>
      <Step title="验证">
        ```bash
        openclaw models list --provider comfy
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 配置

Comfy 支持共享的顶级连接设置以及每个功能的工作流部分（`image`、`video`、`music`）：

```json5
{
  plugins: {
    entries: {
      comfy: {
        config: {
          mode: "local",
          baseUrl: "http://127.0.0.1:8188",
          image: {
            workflowPath: "./workflows/flux-api.json",
            promptNodeId: "6",
            outputNodeId: "9",
          },
          video: {
            workflowPath: "./workflows/video-api.json",
            promptNodeId: "12",
            outputNodeId: "21",
          },
          music: {
            workflowPath: "./workflows/music-api.json",
            promptNodeId: "3",
            outputNodeId: "18",
          },
        },
      },
    },
  },
}
```

### 共享键

| 键                    | 类型                   | 描述                                                                               |
| --------------------- | ---------------------- | ---------------------------------------------------------------------------------- |
| `mode`                | `"local"` 或 `"cloud"` | 连接模式。                                                                         |
| `baseUrl`             | 字符串                 | 本地模式默认为 `http://127.0.0.1:8188`，云模式默认为 `https://cloud.comfy.org`。   |
| `apiKey`              | 字符串                 | 可选的内联密钥，作为 `COMFY_API_KEY` / `COMFY_CLOUD_API_KEY` 环境变量的替代。      |
| `allowPrivateNetwork` | 布尔值                 | 在云模式下允许私有/LAN `baseUrl`。                                                 |

### 每功能键

这些键适用于 `image`、`video` 或 `music` 部分内：

| 键                           | 必需 | 默认值   | 描述                                                                    |
| ---------------------------- | ---- | -------- | ----------------------------------------------------------------------- |
| `workflow` 或 `workflowPath` | 是   | --       | ComfyUI 工作流 JSON 文件的路径。                                        |
| `promptNodeId`               | 是   | --       | 接收文本提示的节点 ID。                                                 |
| `promptInputName`            | 否   | `"text"` | 提示节点上的输入名称。                                                  |
| `outputNodeId`               | 否   | --       | 从中读取输出的节点 ID。如果省略，则使用所有匹配的输出节点。              |
| `pollIntervalMs`             | 否   | --       | 作业完成的轮询间隔（毫秒）。                                            |
| `timeoutMs`                  | 否   | --       | 工作流运行的超时（毫秒）。                                              |

`image` 和 `video` 部分还支持：

| 键                    | 必需                       | 默认值    | 描述                               |
| --------------------- | -------------------------- | --------- | ---------------------------------- |
| `inputImageNodeId`    | 是（传入参考图像时）       | --        | 接收上传的参考图像的节点 ID。      |
| `inputImageInputName` | 否                         | `"image"` | 图像节点上的输入名称。             |

## 工作流详情

<AccordionGroup>
  <Accordion title="图像工作流">
    将默认图像模型设置为 `comfy/workflow`：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    **参考图像编辑示例：**

    要使用上传的参考图像启用图像编辑，请在图像配置中添加 `inputImageNodeId`：

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              image: {
                workflowPath: "./workflows/edit-api.json",
                promptNodeId: "6",
                inputImageNodeId: "7",
                inputImageInputName: "image",
                outputNodeId: "9",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="视频工作流">
    将默认视频模型设置为 `comfy/workflow`：

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "comfy/workflow",
          },
        },
      },
    }
    ```

    Comfy 视频工作流通过配置的图形支持文本到视频和图像到视频。

    <Note>
    OpenClaw 不会将输入视频传入 Comfy 工作流。仅支持文本提示和单张参考图像作为输入。
    </Note>

  </Accordion>

  <Accordion title="音乐工作流">
    内置插件为工作流定义的音频或音乐输出注册了一个音乐生成 Provider，通过共享的 `music_generate` 工具公开：

    ```text
    /tool music_generate prompt="Warm ambient synth loop with soft tape texture"
    ```

    使用 `music` 配置部分指向您的音频工作流 JSON 和输出节点。

  </Accordion>

  <Accordion title="向后兼容性">
    现有的顶级图像配置（没有嵌套的 `image` 部分）仍然有效：

    ```json5
    {
      plugins: {
        entries: {
          comfy: {
            config: {
              workflowPath: "./workflows/flux-api.json",
              promptNodeId: "6",
              outputNodeId: "9",
            },
          },
        },
      },
    }
    ```

    OpenClaw 将该旧版形式视为图像工作流配置。您不需要立即迁移，但对于新设置推荐使用嵌套的 `image` / `video` / `music` 部分。

    <Tip>
    如果您只使用图像生成，旧版平面配置和新的嵌套 `image` 部分在功能上是等效的。
    </Tip>

  </Accordion>

  <Accordion title="实时测试">
    内置插件存在可选的实时覆盖：

    ```bash
    OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
    ```

    实时测试会跳过各个图像、视频或音乐用例，除非配置了相应的 Comfy 工作流部分。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="图像生成" href="/tools/image-generation" icon="image">
    图像生成工具配置和使用。
  </Card>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    视频生成工具配置和使用。
  </Card>
  <Card title="音乐生成" href="/tools/music-generation" icon="music">
    音乐和音频生成工具设置。
  </Card>
  <Card title="Provider 目录" href="/providers/index" icon="layers">
    所有 Provider 和模型引用的概述。
  </Card>
  <Card title="配置参考" href="/gateway/config-agents#agent-defaults" icon="gear">
    完整配置参考，包括 Agent 默认值。
  </Card>
</CardGroup>
