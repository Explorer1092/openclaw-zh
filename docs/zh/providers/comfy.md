---
mmh3_hash: "c785c3bc88c5b8210a8205c5e14489a6"
title: "ComfyUI"
summary: "在 OpenClaw 中设置 ComfyUI 工作流图像、视频和音乐生成"
read_when:
  - 您想在 OpenClaw 中使用本地 ComfyUI 工作流
  - 您想将 Comfy Cloud 用于图像、视频或音乐工作流
  - 您需要内置 comfy 插件配置键
---

# ComfyUI

OpenClaw 内置了一个 `comfy` 插件，用于工作流驱动的 ComfyUI 运行。

- Provider：`comfy`
- 模型：`comfy/workflow`
- 共享界面：`image_generate`、`video_generate`、`music_generate`
- 身份验证：本地 ComfyUI 无需身份验证；Comfy Cloud 使用 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`
- API：ComfyUI `/prompt` / `/history` / `/view` 和 Comfy Cloud `/api/*`

## 支持的功能

- 从工作流 JSON 生成图像
- 使用 1 张上传的参考图像进行图像编辑
- 从工作流 JSON 生成视频
- 使用 1 张上传的参考图像生成视频
- 通过共享 `music_generate` 工具进行音乐或音频生成
- 从配置的节点或所有匹配的输出节点下载输出

内置插件是工作流驱动的，因此 OpenClaw 不会尝试将通用的 `size`、`aspectRatio`、`resolution`、`durationSeconds` 或 TTS 样式控件映射到您的图形上。

## 配置结构

Comfy 支持共享的顶级连接设置以及每个功能的工作流部分：

```json5
{
  models: {
    providers: {
      comfy: {
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
}
```

共享键：

- `mode`：`local` 或 `cloud`
- `baseUrl`：本地模式默认为 `http://127.0.0.1:8188`，云模式默认为 `https://cloud.comfy.org`
- `apiKey`：可选的内联密钥，作为环境变量的替代
- `allowPrivateNetwork`：在云模式下允许私有/LAN `baseUrl`

`image`、`video` 或 `music` 下的每功能键：

- `workflow` 或 `workflowPath`：必需
- `promptNodeId`：必需
- `promptInputName`：默认为 `text`
- `outputNodeId`：可选
- `pollIntervalMs`：可选
- `timeoutMs`：可选

图像和视频部分还支持：

- `inputImageNodeId`：传入参考图像时必需
- `inputImageInputName`：默认为 `image`

## 向后兼容性

现有的顶级图像配置仍然有效：

```json5
{
  models: {
    providers: {
      comfy: {
        workflowPath: "./workflows/flux-api.json",
        promptNodeId: "6",
        outputNodeId: "9",
      },
    },
  },
}
```

OpenClaw 将该旧版形式视为图像工作流配置。

## 图像工作流

设置默认图像模型：

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

参考图像编辑示例：

```json5
{
  models: {
    providers: {
      comfy: {
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
}
```

## 视频工作流

设置默认视频模型：

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

Comfy 视频工作流目前通过配置的图形支持文本到视频和图像到视频。OpenClaw 不会将输入视频传入 Comfy 工作流。

## 音乐工作流

内置插件为工作流定义的音频或音乐输出注册了一个音乐生成 Provider，通过共享的 `music_generate` 工具公开：

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

使用 `music` 配置部分指向您的音频工作流 JSON 和输出节点。

## Comfy Cloud

使用 `mode: "cloud"` 加上以下其中之一：

- `COMFY_API_KEY`
- `COMFY_CLOUD_API_KEY`
- `models.providers.comfy.apiKey`

云模式仍使用相同的 `image`、`video` 和 `music` 工作流部分。

## 实时测试

内置插件存在可选的实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

实时测试会跳过各个图像、视频或音乐用例，除非配置了相应的 Comfy 工作流部分。

## 相关链接

- [图像生成](/tools/image-generation)
- [视频生成](/tools/video-generation)
- [音乐生成](/tools/music-generation)
- [Provider 目录](/providers/index)
- [配置参考](/gateway/configuration-reference#agent-defaults)
