---
mmh3_hash: "c2e22bc9464d6eaa49fa5879dba72aaf"
title: "fal"
summary: "在 OpenClaw 中设置 fal 图像和视频生成"
read_when:
  - 您想在 OpenClaw 中使用 fal 图像生成
  - 您需要 FAL_KEY 身份验证流程
  - 您想要 fal 的 image_generate 或 video_generate 默认配置
---

# fal

OpenClaw 内置了一个 `fal` Provider，用于托管的图像和视频生成。

- Provider：`fal`
- 身份验证：`FAL_KEY`（标准；`FAL_API_KEY` 也可作为备选）
- API：fal 模型端点

## 快速开始

1. 设置 API 密钥：

```bash
openclaw onboard --auth-choice fal-api-key
```

2. 设置默认图像模型：

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

## 图像生成

内置的 `fal` 图像生成 Provider 默认使用 `fal/fal-ai/flux/dev`。

- 每次请求最多生成 4 张图像
- 编辑模式：已启用，支持 1 张参考图像
- 支持 `size`、`aspectRatio` 和 `resolution`
- 当前编辑注意事项：fal 图像编辑端点**不**支持 `aspectRatio` 覆盖

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

- 模式：文本到视频和单图像参考流程
- 运行时：基于队列的提交/状态/结果流程，适用于长时间运行的任务

将 fal 设置为默认视频 Provider：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "fal/fal-ai/minimax/video-01-live",
      },
    },
  },
}
```

## 相关链接

- [图像生成](/tools/image-generation)
- [视频生成](/tools/video-generation)
- [配置参考](/gateway/configuration-reference#agent-defaults)
