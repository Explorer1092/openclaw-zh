---
mmh3_hash: "46f35ae762e7ea8bff22373a3c1be756"
summary: "使用 12 个提供商后端从文本、图像或现有视频生成视频"
read_when:
  - 通过 Agent 生成视频
  - 配置视频生成提供商和模型
  - 了解 video_generate 工具参数
title: "Video Generation"
---

# Video Generation

OpenClaw Agent 可以从文本提示词、参考图像或现有视频生成视频。支持 12 个提供商后端，每个后端具有不同的模型选项、输入模式和功能集。Agent 会根据你的配置和可用 API 密钥自动选择合适的提供商。

<Note>
`video_generate` 工具仅在至少一个视频生成提供商可用时才会显示。如果你在 Agent 工具列表中看不到它，请设置提供商 API 密钥或配置 `agents.defaults.videoGenerationModel`。
</Note>

## 快速入门

1. 为任意支持的提供商设置 API 密钥：

```bash
export GEMINI_API_KEY="your-key"
```

2. 可选择固定默认模型：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
```

3. 向 Agent 提问：

> 生成一段 5 秒的电影级视频，内容是一只友好的龙虾在日落时冲浪。

Agent 会自动调用 `video_generate`，无需设置工具允许列表。

## 生成视频时发生了什么

视频生成是异步的。当 Agent 在 Session 中调用 `video_generate` 时：

1. OpenClaw 向提供商提交请求并立即返回任务 ID。
2. 提供商在后台处理任务（通常需要 30 秒至 5 分钟，具体取决于提供商和分辨率）。
3. 视频准备好后，OpenClaw 通过内部完成事件唤醒同一 Session。
4. Agent 将完成的视频发回原始对话中。

任务进行中时，同一 Session 中重复的 `video_generate` 调用会返回当前任务状态，而非启动新的生成。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 从 CLI 检查进度。

在 Session 支持的 Agent 运行之外（例如直接工具调用），工具会回退到内联生成，并在同一轮次中返回最终媒体路径。

## 支持的提供商

| 提供商   | 默认模型                        | 文本 | 图像参考           | 视频参考         | API 密钥                                 |
| -------- | ------------------------------- | ---- | ------------------ | ---------------- | ---------------------------------------- |
| Alibaba  | `wan2.6-t2v`                    | 是   | 是（远程 URL）     | 是（远程 URL）   | `MODELSTUDIO_API_KEY`                    |
| BytePlus | `seedance-1-0-lite-t2v-250428`  | 是   | 1 张图像           | 否               | `BYTEPLUS_API_KEY`                       |
| ComfyUI  | `workflow`                      | 是   | 1 张图像           | 否               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| fal      | `fal-ai/minimax/video-01-live`  | 是   | 1 张图像           | 否               | `FAL_KEY`                                |
| Google   | `veo-3.1-fast-generate-preview` | 是   | 1 张图像           | 1 段视频         | `GEMINI_API_KEY`                         |
| MiniMax  | `MiniMax-Hailuo-2.3`            | 是   | 1 张图像           | 否               | `MINIMAX_API_KEY`                        |
| OpenAI   | `sora-2`                        | 是   | 1 张图像           | 1 段视频         | `OPENAI_API_KEY`                         |
| Qwen     | `wan2.6-t2v`                    | 是   | 是（远程 URL）     | 是（远程 URL）   | `QWEN_API_KEY`                           |
| Runway   | `gen4.5`                        | 是   | 1 张图像           | 1 段视频         | `RUNWAYML_API_SECRET`                    |
| Together | `Wan-AI/Wan2.2-T2V-A14B`        | 是   | 1 张图像           | 否               | `TOGETHER_API_KEY`                       |
| Vydra    | `veo3`                          | 是   | 1 张图像（`kling`）| 否               | `VYDRA_API_KEY`                          |
| xAI      | `grok-imagine-video`            | 是   | 1 张图像           | 1 段视频         | `XAI_API_KEY`                            |

部分提供商接受额外或替代的 API 密钥环境变量。详情请参见各[提供商页面](#相关)。

运行 `video_generate action=list` 在运行时查看可用提供商和模型。

## 工具参数

### 必填

| 参数     | 类型   | 描述                                                             |
| -------- | ------ | ---------------------------------------------------------------- |
| `prompt` | string | 要生成视频的文本描述（`action: "generate"` 时必填）              |

### 内容输入

| 参数     | 类型     | 描述                         |
| -------- | -------- | ---------------------------- |
| `image`  | string   | 单张参考图像（路径或 URL）   |
| `images` | string[] | 多张参考图像（最多 5 张）    |
| `video`  | string   | 单段参考视频（路径或 URL）   |
| `videos` | string[] | 多段参考视频（最多 4 段）    |

### 风格控制

| 参数              | 类型    | 描述                                                                   |
| ----------------- | ------- | ---------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9` |
| `resolution`      | string  | `480P`、`720P` 或 `1080P`                                              |
| `durationSeconds` | number  | 目标时长（秒，四舍五入到最近的提供商支持值）                           |
| `size`            | string  | 提供商支持时的尺寸提示                                                 |
| `audio`           | boolean | 支持时启用生成音频                                                     |
| `watermark`       | boolean | 支持时切换提供商水印                                                   |

### 高级

| 参数       | 类型   | 描述                                         |
| ---------- | ------ | -------------------------------------------- |
| `action`   | string | `"generate"`（默认）、`"status"` 或 `"list"` |
| `model`    | string | 提供商/模型覆盖（例如 `runway/gen4.5`）      |
| `filename` | string | 输出文件名提示                               |

并非所有提供商都支持所有参数。不受支持的覆盖项会尽力忽略并在工具结果中报告为警告。硬能力限制（如参考输入过多）会在提交前失败。

## 动作

- **generate**（默认）-- 根据给定提示词和可选参考输入创建视频。
- **status** -- 检查当前 Session 的进行中视频任务状态，不启动新的生成。
- **list** -- 显示可用提供商、模型及其能力。

## 模型选择

生成视频时，OpenClaw 按以下顺序解析模型：

1. **`model` 工具参数** -- 如果 Agent 在调用中指定了一个。
2. **`videoGenerationModel.primary`** -- 来自配置。
3. **`videoGenerationModel.fallbacks`** -- 按顺序尝试。
4. **自动检测** -- 使用具有有效认证的提供商，从当前默认提供商开始，然后按字母顺序排列剩余提供商。

如果某个提供商失败，会自动尝试下一个候选提供商。如果所有候选都失败，错误信息会包含每次尝试的详情。

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
        fallbacks: ["runway/gen4.5", "qwen/wan2.6-t2v"],
      },
    },
  },
}
```

## 提供商说明

| 提供商   | 说明                                                                                                                                                           |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba  | 使用 DashScope/Model Studio 异步端点。参考图像和视频必须是远程 `http(s)` URL。                                                                                 |
| BytePlus | 仅支持单张图像参考。                                                                                                                                           |
| ComfyUI  | 工作流驱动的本地或云端执行。通过已配置的图形支持文本到视频和图像到视频。                                                                                      |
| fal      | 使用队列支持的流程处理长时间运行的任务。仅支持单张图像参考。                                                                                                   |
| Google   | 使用 Gemini/Veo。支持一张图像或一段视频参考。                                                                                                                  |
| MiniMax  | 仅支持单张图像参考。                                                                                                                                           |
| OpenAI   | 仅转发 `size` 覆盖。其他风格覆盖（`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略并显示警告。                                                      |
| Qwen     | 与 Alibaba 使用相同的 DashScope 后端。参考输入必须是远程 `http(s)` URL；本地文件会被提前拒绝。                                                                 |
| Runway   | 通过 data URI 支持本地文件。视频到视频需要 `runway/gen4_aleph`。纯文本运行支持 `16:9` 和 `9:16` 宽高比。                                                       |
| Together | 仅支持单张图像参考。                                                                                                                                           |
| Vydra    | 直接使用 `https://www.vydra.ai/api/v1` 以避免认证丢失重定向。`veo3` 捆绑为纯文本到视频；`kling` 需要远程图像 URL。                                             |
| xAI      | 支持文本到视频、图像到视频和远程视频编辑/扩展流程。                                                                                                            |

## 配置

在 OpenClaw 配置中设置默认视频生成模型：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-r2v-flash"],
      },
    },
  },
}
```

或通过 CLI：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "qwen/wan2.6-t2v"
```

## 相关

- [工具概览](/tools)
- [后台任务](/automation/tasks) -- 异步视频生成的任务跟踪
- [Alibaba Model Studio](/providers/alibaba)
- [BytePlus](/concepts/model-providers#byteplus-international)
- [ComfyUI](/providers/comfy)
- [fal](/providers/fal)
- [Google (Gemini)](/providers/google)
- [MiniMax](/providers/minimax)
- [OpenAI](/providers/openai)
- [Qwen](/providers/qwen)
- [Runway](/providers/runway)
- [Together AI](/providers/together)
- [Vydra](/providers/vydra)
- [xAI](/providers/xai)
- [配置参考](/gateway/configuration-reference#agent-defaults)
- [模型](/concepts/models)
