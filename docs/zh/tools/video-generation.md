---
mmh3_hash: "e65d0c0407305401151d5775bbbf4ae3"
summary: "使用 14 个提供商后端从文本、图像或现有视频生成视频"
read_when:
  - 通过 Agent 生成视频
  - 配置视频生成提供商和模型
  - 了解 video_generate 工具参数
title: "Video Generation"
---

# Video Generation

OpenClaw Agent 可以从文本提示词、参考图像或现有视频生成视频。支持 14 个提供商后端，每个后端具有不同的模型选项、输入模式和功能集。Agent 会根据你的配置和可用 API 密钥自动选择合适的提供商。

<Note>
`video_generate` 工具仅在至少一个视频生成提供商可用时才会显示。如果你在 Agent 工具列表中看不到它，请设置提供商 API 密钥或配置 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 将视频生成视为三种运行时模式：

- `generate` — 无参考媒体的文本到视频请求
- `imageToVideo` — 请求包含一张或多张参考图像时
- `videoToVideo` — 请求包含一段或多段参考视频时

提供商可以支持这些模式的任意子集。工具在提交前验证活动模式，并在 `action=list` 中报告支持的模式。

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

### 任务生命周期

每个 `video_generate` 请求经历四个状态：

1. **queued** -- 任务已创建，等待提供商接受。
2. **running** -- 提供商正在处理（通常需要 30 秒至 5 分钟，具体取决于提供商和分辨率）。
3. **succeeded** -- 视频准备就绪；Agent 唤醒并将其发布到对话中。
4. **failed** -- 提供商错误或超时；Agent 唤醒并显示错误详情。

从 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

重复预防：如果当前 Session 已有视频任务处于 `queued` 或 `running` 状态，`video_generate` 返回现有任务状态而非启动新任务。使用 `action: "status"` 在不触发新生成的情况下显式检查状态。

## 支持的提供商

| 提供商                 | 默认模型                        | 文本 | 图像参考                                 | 视频参考         | API 密钥                                 |
| ---------------------- | ------------------------------- | ---- | ---------------------------------------- | ---------------- | ---------------------------------------- |
| Alibaba                | `wan2.6-t2v`                    | 是   | 是（远程 URL）                           | 是（远程 URL）   | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)         | `seedance-1-0-pro-250528`       | 是   | 最多 2 张图像（仅 I2V 模型；首帧+末帧）  | 否               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5  | `seedance-1-5-pro-251215`       | 是   | 最多 2 张图像（通过 role 设置首帧+末帧） | 否               | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0  | `dreamina-seedance-2-0-260128`  | 是   | 最多 9 张参考图像                        | 最多 3 段视频    | `BYTEPLUS_API_KEY`                       |
| ComfyUI                | `workflow`                      | 是   | 1 张图像                                 | 否               | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| fal                    | `fal-ai/minimax/video-01-live`  | 是   | 1 张图像                                 | 否               | `FAL_KEY`                                |
| Google                 | `veo-3.1-fast-generate-preview` | 是   | 1 张图像                                 | 1 段视频         | `GEMINI_API_KEY`                         |
| MiniMax                | `MiniMax-Hailuo-2.3`            | 是   | 1 张图像                                 | 否               | `MINIMAX_API_KEY`                        |
| OpenAI                 | `sora-2`                        | 是   | 1 张图像                                 | 1 段视频         | `OPENAI_API_KEY`                         |
| Qwen                   | `wan2.6-t2v`                    | 是   | 是（远程 URL）                           | 是（远程 URL）   | `QWEN_API_KEY`                           |
| Runway                 | `gen4.5`                        | 是   | 1 张图像                                 | 1 段视频         | `RUNWAYML_API_SECRET`                    |
| Together               | `Wan-AI/Wan2.2-T2V-A14B`        | 是   | 1 张图像                                 | 否               | `TOGETHER_API_KEY`                       |
| Vydra                  | `veo3`                          | 是   | 1 张图像（`kling`）                      | 否               | `VYDRA_API_KEY`                          |
| xAI                    | `grok-imagine-video`            | 是   | 1 张图像                                 | 1 段视频         | `XAI_API_KEY`                            |

部分提供商接受额外或替代的 API 密钥环境变量。详情请参见各[提供商页面](#相关)。

运行 `video_generate action=list` 在运行时查看可用提供商、模型和运行时模式。

### 声明的能力矩阵

这是 `video_generate`、契约测试和共享实时扫描使用的显式模式契约。

| 提供商                | `generate` | `imageToVideo` | `videoToVideo` | 共享实时通道                                                                                                                                     |
| --------------------- | ---------- | -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Alibaba               | 是         | 是             | 是             | `generate`、`imageToVideo`；`videoToVideo` 因需要远程 `http(s)` 视频 URL 而跳过                                                                  |
| BytePlus              | 是         | 是             | 否             | `generate`、`imageToVideo`                                                                                                                       |
| ComfyUI               | 是         | 是             | 否             | 不在共享扫描中；工作流特定覆盖位于 Comfy 测试中                                                                                                  |
| fal                   | 是         | 是             | 否             | `generate`、`imageToVideo`                                                                                                                       |
| Google                | 是         | 是             | 是             | `generate`、`imageToVideo`；共享 `videoToVideo` 因当前缓冲区支持的 Gemini/Veo 扫描不接受该输入而跳过                                             |
| MiniMax               | 是         | 是             | 否             | `generate`、`imageToVideo`                                                                                                                       |
| OpenAI                | 是         | 是             | 是             | `generate`、`imageToVideo`；共享 `videoToVideo` 因此组织/输入路径当前需要提供商端 inpaint/remix 访问而跳过                                        |
| Qwen                  | 是         | 是             | 是             | `generate`、`imageToVideo`；`videoToVideo` 因需要远程 `http(s)` 视频 URL 而跳过                                                                  |
| Runway                | 是         | 是             | 是             | `generate`、`imageToVideo`；`videoToVideo` 仅在选定模型为 `runway/gen4_aleph` 时运行                                                             |
| Together              | 是         | 是             | 否             | `generate`、`imageToVideo`                                                                                                                       |
| Vydra                 | 是         | 是             | 否             | `generate`；共享 `imageToVideo` 因捆绑的 `veo3` 仅支持文本且捆绑的 `kling` 需要远程图像 URL 而跳过                                               |
| xAI                   | 是         | 是             | 是             | `generate`、`imageToVideo`；`videoToVideo` 因此提供商当前需要远程 MP4 URL 而跳过                                                                 |

## 工具参数

### 必填

| 参数     | 类型   | 描述                                                             |
| -------- | ------ | ---------------------------------------------------------------- |
| `prompt` | string | 要生成视频的文本描述（`action: "generate"` 时必填）              |

### 内容输入

| 参数         | 类型     | 描述                                                                                                      |
| ------------ | -------- | --------------------------------------------------------------------------------------------------------- |
| `image`      | string   | 单张参考图像（路径或 URL）                                                                                |
| `images`     | string[] | 多张参考图像（最多 9 张）                                                                                 |
| `imageRoles` | string[] | 与合并图像列表平行的可选每位置角色提示。规范值：`first_frame`、`last_frame`、`reference_image`            |
| `video`      | string   | 单段参考视频（路径或 URL）                                                                                |
| `videos`     | string[] | 多段参考视频（最多 4 段）                                                                                 |
| `videoRoles` | string[] | 与合并视频列表平行的可选每位置角色提示。规范值：`reference_video`                                        |
| `audioRef`   | string   | 单个参考音频（路径或 URL）。提供商支持音频输入时用于背景音乐或语音参考                                   |
| `audioRefs`  | string[] | 多个参考音频（最多 3 个）                                                                                 |
| `audioRoles` | string[] | 与合并音频列表平行的可选每位置角色提示。规范值：`reference_audio`                                        |

角色提示按原样转发给提供商。规范值来自 `VideoGenerationAssetRole` 联合，但提供商可能接受额外的角色字符串。`*Roles` 数组的条目数不能超过对应的参考列表；位置错误会以清晰的错误信息失败。使用空字符串使某个槽位未设置。

### 风格控制

| 参数              | 类型    | 描述                                                                                      |
| ----------------- | ------- | ----------------------------------------------------------------------------------------- |
| `aspectRatio`     | string  | `1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9` 或 `adaptive`   |
| `resolution`      | string  | `480P`、`720P`、`768P` 或 `1080P`                                                         |
| `durationSeconds` | number  | 目标时长（秒，四舍五入到最近的提供商支持值）                                              |
| `size`            | string  | 提供商支持时的尺寸提示                                                                    |
| `audio`           | boolean | 支持时启用输出中的生成音频。与 `audioRef*`（输入）不同                                    |
| `watermark`       | boolean | 支持时切换提供商水印                                                                      |

`adaptive` 是提供商特定的哨兵值：它按原样转发给声明了 `adaptive` 能力的提供商（例如 BytePlus Seedance 用它从输入图像尺寸自动检测比例）。未声明该能力的提供商会通过工具结果中的 `details.ignoredOverrides` 显示该值被丢弃。

### 高级

| 参数              | 类型   | 描述                                                                                                                                                                                                                                            |
| ----------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `action`          | string | `"generate"`（默认）、`"status"` 或 `"list"`                                                                                                                                                                                                    |
| `model`           | string | 提供商/模型覆盖（例如 `runway/gen4.5`）                                                                                                                                                                                                         |
| `filename`        | string | 输出文件名提示                                                                                                                                                                                                                                  |
| `providerOptions` | object | 提供商特定选项，以 JSON 对象形式传入（例如 `{"seed": 42, "draft": true}`）。声明了类型化 schema 的提供商会验证键和类型；未知键或类型不匹配会在回退时跳过该候选。未声明 schema 的提供商按原样接收选项。运行 `video_generate action=list` 查看详情 |

并非所有提供商都支持所有参数。OpenClaw 已将时长规范化到最近的提供商支持值，并在回退提供商暴露不同控制面时重新映射几何提示（如尺寸到宽高比）。真正不受支持的覆盖项会尽力忽略并在工具结果中报告为警告。硬能力限制（如参考输入过多）会在提交前失败。

工具结果会报告应用的设置。当 OpenClaw 在提供商回退期间重新映射时长或几何参数时，返回的 `durationSeconds`、`size`、`aspectRatio` 和 `resolution` 值反映实际发送的内容，`details.normalization` 记录请求到应用的转换。

参考输入还会选择运行时模式：

- 无参考媒体：`generate`
- 任意图像参考：`imageToVideo`
- 任意视频参考：`videoToVideo`
- 音频参考输入不会改变解析的模式；它们叠加在图像/视频参考选择的模式之上，且仅适用于声明了 `maxInputAudios` 的提供商

混合图像和视频参考不是稳定的共享能力表面。每次请求优先使用一种参考类型。

#### 回退和类型化选项

某些能力检查在回退层而非工具边界应用，以便超出主提供商限制的请求仍可在有能力的回退上运行：

- 如果活动候选未声明 `maxInputAudios`（或声明为 `0`），在请求包含音频参考时该候选被跳过，尝试下一个候选。
- 如果活动候选的 `maxDurationSeconds` 低于请求的 `durationSeconds` 且候选未声明 `supportedDurationSeconds` 列表，则跳过该候选。
- 如果请求包含 `providerOptions` 且活动候选明确声明了类型化 `providerOptions` schema，则当提供的键不在 schema 中或值类型不匹配时跳过该候选。未声明 schema 的提供商按原样接收选项（向后兼容的直通）。提供商可以通过声明空 schema（`capabilities.providerOptions: {}`）显式退出所有提供商选项，这会与类型不匹配一样触发跳过。

请求中第一个跳过原因以 `warn` 级别记录，以便操作者看到主提供商被绕过；后续跳过以 `debug` 级别记录以保持长回退链安静。如果所有候选都被跳过，聚合错误包含每个候选的跳过原因。

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

如果你希望视频生成仅使用显式 `model`、`primary` 和 `fallbacks` 条目，请设置 `agents.defaults.mediaGenerationAutoProviderFallback: false`。

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

| 提供商                | 说明                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba               | 使用 DashScope/Model Studio 异步端点。参考图像和视频必须是远程 `http(s)` URL。                                                                                                                                                                                                                                                                                                                                                                |
| BytePlus (1.0)        | Provider id `byteplus`。模型：`seedance-1-0-pro-250528`（默认）、`seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、`seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。T2V 模型（`*-t2v-*`）不接受图像输入；I2V 模型和通用 `*-pro-*` 模型支持单张参考图像（首帧）。按位置传递图像或设置 `role: "first_frame"`。提供图像时 T2V 模型 ID 自动切换为对应的 I2V 变体。支持的 `providerOptions` 键：`seed`（数字）、`draft`（布尔，强制 480p）、`camera_fixed`（布尔）。 |
| BytePlus Seedance 1.5 | 需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin。Provider id `byteplus-seedance15`。模型：`seedance-1-5-pro-251215`。使用统一 `content[]` API。最多支持 2 张输入图像（首帧+末帧）。所有输入必须是远程 `https://` URL。在每张图像上设置 `role: "first_frame"` / `"last_frame"`，或按位置传递图像。`aspectRatio: "adaptive"` 从输入图像自动检测比例。`audio: true` 映射到 `generate_audio`。`providerOptions.seed`（数字）被转发。 |
| BytePlus Seedance 2.0 | 需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin。Provider id `byteplus-seedance2`。模型：`dreamina-seedance-2-0-260128`、`dreamina-seedance-2-0-fast-260128`。使用统一 `content[]` API。最多支持 9 张参考图像、3 段参考视频和 3 个参考音频。所有输入必须是远程 `https://` URL。在每个资源上设置 `role`——支持的值：`"first_frame"`、`"last_frame"`、`"reference_image"`、`"reference_video"`、`"reference_audio"`。`aspectRatio: "adaptive"` 从输入图像自动检测比例。`audio: true` 映射到 `generate_audio`。`providerOptions.seed`（数字）被转发。 |
| ComfyUI               | 工作流驱动的本地或云端执行。通过已配置的图形支持文本到视频和图像到视频。                                                                                                                                                                                                                                                                                                                                                                      |
| fal                   | 使用队列支持的流程处理长时间运行的任务。仅支持单张图像参考。                                                                                                                                                                                                                                                                                                                                                                                  |
| Google                | 使用 Gemini/Veo。支持一张图像或一段视频参考。                                                                                                                                                                                                                                                                                                                                                                                                 |
| MiniMax               | 仅支持单张图像参考。                                                                                                                                                                                                                                                                                                                                                                                                                          |
| OpenAI                | 仅转发 `size` 覆盖。其他风格覆盖（`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略并显示警告。                                                                                                                                                                                                                                                                                                                                     |
| Qwen                  | 与 Alibaba 使用相同的 DashScope 后端。参考输入必须是远程 `http(s)` URL；本地文件会被提前拒绝。                                                                                                                                                                                                                                                                                                                                                |
| Runway                | 通过 data URI 支持本地文件。视频到视频需要 `runway/gen4_aleph`。纯文本运行支持 `16:9` 和 `9:16` 宽高比。                                                                                                                                                                                                                                                                                                                                      |
| Together              | 仅支持单张图像参考。                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Vydra                 | 直接使用 `https://www.vydra.ai/api/v1` 以避免认证丢失重定向。`veo3` 捆绑为纯文本到视频；`kling` 需要远程图像 URL。                                                                                                                                                                                                                                                                                                                            |
| xAI                   | 支持文本到视频、图像到视频和远程视频编辑/扩展流程。                                                                                                                                                                                                                                                                                                                                                                                           |

## 提供商能力模式

共享视频生成契约现在让提供商可以声明模式特定的能力，而不仅仅是平面聚合限制。新的提供商实现应优先使用显式模式块：

```typescript
capabilities: {
  generate: {
    maxVideos: 1,
    maxDurationSeconds: 10,
    supportsResolution: true,
  },
  imageToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputImages: 1,
    maxDurationSeconds: 5,
  },
  videoToVideo: {
    enabled: true,
    maxVideos: 1,
    maxInputVideos: 1,
    maxDurationSeconds: 5,
  },
}
```

`maxInputImages` 和 `maxInputVideos` 等旧版扁平字段不足以声明转换模式支持。提供商应显式声明 `generate`、`imageToVideo` 和 `videoToVideo`，以便实时测试、契约测试和共享 `video_generate` 工具能够确定性地验证模式支持。

## 实时测试

共享捆绑提供商的可选实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

仓库包装器：

```bash
pnpm test:live:media video
```

该实时文件从 `~/.profile` 加载缺失的提供商环境变量，默认优先使用实时/环境 API 密钥而非存储的认证配置文件，并运行可以使用本地媒体安全执行的已声明模式：

- 扫描中每个提供商的 `generate`
- 当 `capabilities.imageToVideo.enabled` 时运行 `imageToVideo`
- 当 `capabilities.videoToVideo.enabled` 且提供商/模型在共享扫描中接受缓冲区支持的本地视频输入时运行 `videoToVideo`

当前共享 `videoToVideo` 实时通道覆盖：

- 仅在你选择 `runway/gen4_aleph` 时覆盖 `runway`

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
