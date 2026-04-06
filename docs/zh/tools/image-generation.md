---
mmh3_hash: "a102f4f98493f3b84caf15a61ea5f98f"
summary: "使用已配置的提供商（OpenAI、Google Gemini、fal、MiniMax、ComfyUI、Vydra）生成和编辑图像"
read_when:
  - 通过 Agent 生成图像
  - 配置图像生成提供商和模型
  - 了解 image_generate 工具参数
title: "Image Generation"
---

# Image Generation

`image_generate` 工具让 Agent 能够使用你已配置的提供商创建和编辑图像。生成的图像会作为媒体附件自动发送在 Agent 的回复中。

<Note>
该工具仅在至少一个图像生成提供商可用时才会显示。如果你在 Agent 工具列表中看不到 `image_generate`，请配置 `agents.defaults.imageGenerationModel` 或设置提供商 API 密钥。
</Note>

## 快速入门

1. 为至少一个提供商设置 API 密钥（例如 `OPENAI_API_KEY` 或 `GEMINI_API_KEY`）。
2. 可选择设置你偏好的模型：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
      },
    },
  },
}
```

3. 向 Agent 提问：_"生成一张友好的龙虾吉祥物图片。"_

Agent 会自动调用 `image_generate`。无需设置工具允许列表——当提供商可用时默认启用。

## 支持的提供商

| 提供商  | 默认模型                         | 编辑支持                           | API 密钥                                               |
| ------- | -------------------------------- | ---------------------------------- | ------------------------------------------------------ |
| OpenAI  | `gpt-image-1`                    | 是（最多 5 张图像）                | `OPENAI_API_KEY`                                       |
| Google  | `gemini-3.1-flash-image-preview` | 是                                 | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                   |
| fal     | `fal-ai/flux/dev`                | 是                                 | `FAL_KEY`                                              |
| MiniMax | `image-01`                       | 是（主体参考）                     | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`） |
| ComfyUI | `workflow`                       | 是（1 张图像，工作流配置）         | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`（云端）       |
| Vydra   | `grok-imagine`                   | 否                                 | `VYDRA_API_KEY`                                        |

使用 `action: "list"` 在运行时查看可用提供商和模型：

```
/tool image_generate action=list
```

## 工具参数

| 参数          | 类型     | 描述                                                                              |
| ------------- | -------- | --------------------------------------------------------------------------------- |
| `prompt`      | string   | 图像生成提示词（`action: "generate"` 时必填）                                     |
| `action`      | string   | `"generate"`（默认）或 `"list"` 以查看提供商                                      |
| `model`       | string   | 提供商/模型覆盖，例如 `openai/gpt-image-1`                                        |
| `image`       | string   | 单张参考图像路径或 URL（编辑模式）                                                |
| `images`      | string[] | 多张参考图像（编辑模式，最多 5 张）                                               |
| `size`        | string   | 尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`1024x1792`、`1792x1024`         |
| `aspectRatio` | string   | 宽高比：`1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9` |
| `resolution`  | string   | 分辨率提示：`1K`、`2K` 或 `4K`                                                    |
| `count`       | number   | 生成图像数量（1–4）                                                               |
| `filename`    | string   | 输出文件名提示                                                                    |

并非所有提供商都支持所有参数。工具会传递每个提供商支持的内容，忽略其余部分，并在工具结果中报告被忽略的覆盖项。

## 配置

### 模型选择

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview", "fal/fal-ai/flux/dev"],
      },
    },
  },
}
```

### 提供商选择顺序

生成图像时，OpenClaw 按以下顺序尝试提供商：

1. **`model` 参数** -- 来自工具调用（如果 Agent 指定了一个）
2. **`imageGenerationModel.primary`** -- 来自配置
3. **`imageGenerationModel.fallbacks`** -- 按顺序尝试
4. **自动检测** -- 仅使用已认证的提供商默认值：
   - 当前默认提供商优先
   - 按提供商 ID 顺序排列的剩余已注册图像生成提供商

如果某个提供商失败（认证错误、速率限制等），会自动尝试下一个候选提供商。如果全部失败，错误信息会包含每次尝试的详情。

注意：

- 自动检测是认证感知的。只有 OpenClaw 能够实际验证该提供商时，提供商默认值才会进入候选列表。
- 使用 `action: "list"` 查看当前已注册的提供商、其默认模型及认证环境变量提示。

### 图像编辑

OpenAI、Google、fal、MiniMax 和 ComfyUI 支持编辑参考图像。传入参考图像路径或 URL：

```
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI 和 Google 通过 `images` 参数支持最多 5 张参考图像。fal、MiniMax 和 ComfyUI 支持 1 张。

MiniMax 图像生成可通过两种捆绑的 MiniMax 认证路径使用：

- `minimax/image-01` -- 用于 API 密钥设置
- `minimax-portal/image-01` -- 用于 OAuth 设置

## 提供商能力

| 能力                  | OpenAI               | Google               | fal                 | MiniMax                    | ComfyUI                            | Vydra   |
| --------------------- | -------------------- | -------------------- | ------------------- | -------------------------- | ---------------------------------- | ------- |
| 生成                  | 是（最多 4 张）      | 是（最多 4 张）      | 是（最多 4 张）     | 是（最多 9 张）            | 是（工作流定义输出）               | 是（1） |
| 编辑/参考             | 是（最多 5 张图像）  | 是（最多 5 张图像）  | 是（1 张图像）      | 是（1 张图像，主体参考）   | 是（1 张图像，工作流配置）         | 否      |
| 尺寸控制              | 是                   | 是                   | 是                  | 否                         | 否                                 | 否      |
| 宽高比                | 否                   | 是                   | 是（仅生成）        | 是                         | 否                                 | 否      |
| 分辨率（1K/2K/4K）    | 否                   | 是                   | 是                  | 否                         | 否                                 | 否      |

## 相关

- [工具概览](/tools) -- 所有可用 Agent 工具
- [fal](/providers/fal) -- fal 图像和视频提供商设置
- [ComfyUI](/providers/comfy) -- 本地 ComfyUI 和 Comfy Cloud 工作流设置
- [Google (Gemini)](/providers/google) -- Gemini 图像提供商设置
- [MiniMax](/providers/minimax) -- MiniMax 图像提供商设置
- [OpenAI](/providers/openai) -- OpenAI 图像提供商设置
- [Vydra](/providers/vydra) -- Vydra 图像、视频和语音设置
- [配置参考](/gateway/configuration-reference#agent-defaults) -- `imageGenerationModel` 配置
- [模型](/concepts/models) -- 模型配置和故障转移
