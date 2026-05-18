---
mmh3_hash: "4839b8f82fabbe5d042e6048aaa768d7"
summary: "通过 video_generate 从文本、图像或视频参考使用 16 个提供商后端生成视频"
read_when:
  - 通过 Agent 生成视频
  - 配置视频生成提供商和模型
  - 了解 video_generate 工具参数
title: "Video generation"
sidebarTitle: "Video generation"
---

OpenClaw Agent 可以从文本提示词、参考图像或现有视频生成视频。支持 16 个提供商后端，每个后端具有不同的模型选项、输入模式和功能集。Agent 会根据你的配置和可用 API 密钥自动选择合适的提供商。

<Note>
`video_generate` 工具仅在至少一个视频生成提供商可用时才会显示。如果你在 Agent 工具列表中看不到它，请设置提供商 API 密钥或配置 `agents.defaults.videoGenerationModel`。
</Note>

OpenClaw 将视频生成视为三种运行时模式：

- `generate` — 无参考媒体的文本到视频请求
- `imageToVideo` — 请求包含一张或多张参考图像时
- `videoToVideo` — 请求包含一段或多段参考视频时

提供商可以支持这些模式的任意子集。工具在提交前验证活动模式，并在 `action=list` 中报告支持的模式。

## 快速入门

<Steps>
  <Step title="配置认证">
    为任意支持的提供商设置 API 密钥：

    ```bash
    export GEMINI_API_KEY="your-key"
    ```

  </Step>
  <Step title="选择默认模型（可选）">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "google/veo-3.1-fast-generate-preview"
    ```
  </Step>
  <Step title="向 Agent 提问">
    > 生成一段 5 秒的电影级视频，内容是一只友好的龙虾在日落时冲浪。

    Agent 会自动调用 `video_generate`，无需设置工具允许列表。

  </Step>
</Steps>

## 异步生成的工作原理

视频生成是异步的。当 Agent 在 Session 中调用 `video_generate` 时：

1. OpenClaw 向提供商提交请求并立即返回任务 ID。
2. 提供商在后台处理任务（通常需要 30 秒至数分钟，具体取决于提供商和分辨率；慢速队列支持的提供商可能运行到配置的超时时间）。
3. 视频准备好后，OpenClaw 通过内部完成事件唤醒同一 Session。
4. Agent 告知用户并通过 message 工具附上完成的视频。如果完成 Agent 仅写了私有最终回复，OpenClaw 不会自动将视频作为回退发布。

任务进行中时，同一 Session 中重复的 `video_generate` 调用会返回当前任务状态，而非启动新的生成。使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 从 CLI 检查进度。

在 Session 支持的 Agent 运行之外（例如直接工具调用），工具会回退到内联生成，并在同一轮次中返回最终媒体路径。

生成的视频文件在提供商返回字节时保存在 OpenClaw 管理的媒体存储下。默认的生成视频保存上限遵循视频媒体限制，`agents.defaults.mediaMaxMb` 可为较大的渲染提高该限制。当提供商同时返回托管输出 URL 时，如果本地持久化因文件过大而拒绝，OpenClaw 可以投递该 URL 而不是让任务失败。

### 任务生命周期

| 状态        | 含义                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------- |
| `queued`    | 任务已创建，等待提供商接受。                                                                |
| `running`   | 提供商正在处理（通常需要 30 秒至数分钟，具体取决于提供商和分辨率）。                        |
| `succeeded` | 视频准备就绪；Agent 唤醒并将其发布到对话中。                                               |
| `failed`    | 提供商错误或超时；Agent 唤醒并显示错误详情。                                               |

从 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

如果当前 Session 已有视频任务处于 `queued` 或 `running` 状态，`video_generate` 返回现有任务状态而非启动新任务。使用 `action: "status"` 在不触发新生成的情况下显式检查状态。

## 支持的提供商

| 提供商                 | 默认模型                        | 文本 | 图像参考                                           | 视频参考                                    | 认证                                     |
| ---------------------- | ------------------------------- | :--: | -------------------------------------------------- | ------------------------------------------- | ---------------------------------------- |
| Alibaba                | `wan2.6-t2v`                    |  ✓   | 是（远程 URL）                                     | 是（远程 URL）                              | `MODELSTUDIO_API_KEY`                    |
| BytePlus (1.0)         | `seedance-1-0-pro-250528`       |  ✓   | 最多 2 张图像（仅 I2V 模型；首帧+末帧）            | -                                           | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 1.5  | `seedance-1-5-pro-251215`       |  ✓   | 最多 2 张图像（通过 role 设置首帧+末帧）           | -                                           | `BYTEPLUS_API_KEY`                       |
| BytePlus Seedance 2.0  | `dreamina-seedance-2-0-260128`  |  ✓   | 最多 9 张参考图像                                  | 最多 3 段视频                               | `BYTEPLUS_API_KEY`                       |
| ComfyUI                | `workflow`                      |  ✓   | 1 张图像                                           | -                                           | `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY` |
| DeepInfra              | `Pixverse/Pixverse-T2V`         |  ✓   | -                                                  | -                                           | `DEEPINFRA_API_KEY`                      |
| fal                    | `fal-ai/minimax/video-01-live`  |  ✓   | 1 张图像；Seedance 参考转视频最多 9 张             | Seedance 参考转视频最多 3 段                | `FAL_KEY`                                |
| Google                 | `veo-3.1-fast-generate-preview` |  ✓   | 1 张图像                                           | 1 段视频                                    | `GEMINI_API_KEY`                         |
| MiniMax                | `MiniMax-Hailuo-2.3`            |  ✓   | 1 张图像                                           | -                                           | `MINIMAX_API_KEY` 或 MiniMax OAuth       |
| OpenAI                 | `sora-2`                        |  ✓   | 1 张图像                                           | 1 段视频                                    | `OPENAI_API_KEY`                         |
| OpenRouter             | `google/veo-3.1-fast`           |  ✓   | 最多 4 张图像（首帧/末帧或参考图像）               | -                                           | `OPENROUTER_API_KEY`                     |
| Qwen                   | `wan2.6-t2v`                    |  ✓   | 是（远程 URL）                                     | 是（远程 URL）                              | `QWEN_API_KEY`                           |
| Runway                 | `gen4.5`                        |  ✓   | 1 张图像                                           | 1 段视频                                    | `RUNWAYML_API_SECRET`                    |
| Together               | `Wan-AI/Wan2.2-T2V-A14B`        |  ✓   | 1 张图像                                           | -                                           | `TOGETHER_API_KEY`                       |
| Vydra                  | `veo3`                          |  ✓   | 1 张图像（`kling`）                                | -                                           | `VYDRA_API_KEY`                          |
| xAI                    | `grok-imagine-video`            |  ✓   | 1 张首帧图像或最多 7 张 `reference_image`          | 1 段视频                                    | `XAI_API_KEY`                            |

部分提供商接受额外或替代的 API 密钥环境变量。详情请参见各[提供商页面](#相关)。

运行 `video_generate action=list` 在运行时查看可用提供商、模型和运行时模式。

### 声明的能力矩阵

这是 `video_generate`、契约测试和共享实时扫描使用的显式模式契约：

| 提供商     | `generate` | `imageToVideo` | `videoToVideo` | 共享实时通道                                                                                                                                    |
| ---------- | :--------: | :------------: | :------------: | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Alibaba    |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；`videoToVideo` 因需要远程 `http(s)` 视频 URL 而跳过                                                                 |
| BytePlus   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                                      |
| ComfyUI    |     ✓      |       ✓        |       -        | 不在共享扫描中；工作流特定覆盖位于 Comfy 测试中                                                                                                 |
| DeepInfra  |     ✓      |       -        |       -        | `generate`；捆绑契约中原生 DeepInfra 视频 schema 为文本到视频                                                                                   |
| fal        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；`videoToVideo` 仅在使用 Seedance 参考转视频时运行                                                                   |
| Google     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；共享 `videoToVideo` 因当前缓冲区支持的 Gemini/Veo 扫描不接受该输入而跳过                                            |
| MiniMax    |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                                      |
| OpenAI     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；共享 `videoToVideo` 因此组织/输入路径当前需要提供商端 inpaint/remix 访问而跳过                                      |
| OpenRouter |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                                      |
| Qwen       |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；`videoToVideo` 因需要远程 `http(s)` 视频 URL 而跳过                                                                 |
| Runway     |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；`videoToVideo` 仅在选定模型为 `runway/gen4_aleph` 时运行                                                            |
| Together   |     ✓      |       ✓        |       -        | `generate`、`imageToVideo`                                                                                                                      |
| Vydra      |     ✓      |       ✓        |       -        | `generate`；共享 `imageToVideo` 因捆绑的 `veo3` 仅支持文本且捆绑的 `kling` 需要远程图像 URL 而跳过                                              |
| xAI        |     ✓      |       ✓        |       ✓        | `generate`、`imageToVideo`；`videoToVideo` 因此提供商当前需要远程 MP4 URL 而跳过                                                                |

## 工具参数

### 必填

<ParamField path="prompt" type="string" required>
  要生成视频的文本描述。`action: "generate"` 时必填。
</ParamField>

### 内容输入

<ParamField path="image" type="string">单张参考图像（路径或 URL）。</ParamField>
<ParamField path="images" type="string[]">多张参考图像（最多 9 张）。</ParamField>
<ParamField path="imageRoles" type="string[]">
与合并图像列表平行的可选每位置角色提示。规范值：`first_frame`、`last_frame`、`reference_image`。
</ParamField>
<ParamField path="video" type="string">单段参考视频（路径或 URL）。</ParamField>
<ParamField path="videos" type="string[]">多段参考视频（最多 4 段）。</ParamField>
<ParamField path="videoRoles" type="string[]">
与合并视频列表平行的可选每位置角色提示。规范值：`reference_video`。
</ParamField>
<ParamField path="audioRef" type="string">
单个参考音频（路径或 URL）。提供商支持音频输入时用于背景音乐或语音参考。
</ParamField>
<ParamField path="audioRefs" type="string[]">多个参考音频（最多 3 个）。</ParamField>
<ParamField path="audioRoles" type="string[]">
与合并音频列表平行的可选每位置角色提示。规范值：`reference_audio`。
</ParamField>

<Note>
角色提示按原样转发给提供商。规范值来自 `VideoGenerationAssetRole` 联合，但提供商可能接受额外的角色字符串。`*Roles` 数组的条目数不能超过对应的参考列表；位置错误会以清晰的错误信息失败。使用空字符串使某个槽位未设置。对于 xAI，将每个图像角色设置为 `reference_image` 以使用其 `reference_images` 生成模式；省略角色或使用 `first_frame` 进行单图像转视频。
</Note>

### 风格控制

<ParamField path="aspectRatio" type="string">
  宽高比提示，如 `1:1`、`16:9`、`9:16`、`adaptive` 或提供商特定值。OpenClaw 按提供商规范化或忽略不支持的值。
</ParamField>
<ParamField path="resolution" type="string">分辨率提示，如 `480P`、`720P`、`768P`、`1080P`、`4K` 或提供商特定值。OpenClaw 按提供商规范化或忽略不支持的值。</ParamField>
<ParamField path="durationSeconds" type="number">
  目标时长（秒，四舍五入到最近的提供商支持值）。
</ParamField>
<ParamField path="size" type="string">提供商支持时的尺寸提示。</ParamField>
<ParamField path="audio" type="boolean">
  支持时启用输出中的生成音频。与 `audioRef*`（输入）不同。
</ParamField>
<ParamField path="watermark" type="boolean">支持时切换提供商水印。</ParamField>

`adaptive` 是提供商特定的哨兵值：它按原样转发给声明了 `adaptive` 能力的提供商（例如 BytePlus Seedance 用它从输入图像尺寸自动检测比例）。未声明该能力的提供商会通过工具结果中的 `details.ignoredOverrides` 显示该值被丢弃。

### 高级

<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  `"status"` 返回当前 Session 任务；`"list"` 查看提供商。
</ParamField>
<ParamField path="model" type="string">提供商/模型覆盖（例如 `runway/gen4.5`）。</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="timeoutMs" type="number">可选的提供商操作超时（毫秒）。省略时，如果配置了 `agents.defaults.videoGenerationModel.timeoutMs`，OpenClaw 使用该值。</ParamField>
<ParamField path="providerOptions" type="object">
  提供商特定选项，以 JSON 对象形式传入（例如 `{"seed": 42, "draft": true}`）。声明了类型化 schema 的提供商会验证键和类型；未知键或类型不匹配会在回退时跳过该候选。未声明 schema 的提供商按原样接收选项。运行 `video_generate action=list` 查看每个提供商接受的内容。
</ParamField>

<Note>
并非所有提供商都支持所有参数。OpenClaw 将时长规范化到最近的提供商支持值，并在回退提供商暴露不同控制面时重新映射几何提示（如尺寸到宽高比）。真正不受支持的覆盖项会尽力忽略并在工具结果中报告为警告。硬能力限制（如参考输入过多）会在提交前失败。工具结果报告应用的设置；`details.normalization` 捕获任何请求到应用的转换。
</Note>

参考输入还会选择运行时模式：

- 无参考媒体 → `generate`
- 任意图像参考 → `imageToVideo`
- 任意视频参考 → `videoToVideo`
- 音频参考输入**不**会改变解析的模式；它们叠加在图像/视频参考选择的模式之上，且仅适用于声明了 `maxInputAudios` 的提供商。

混合图像和视频参考不是稳定的共享能力表面。每次请求优先使用一种参考类型。

#### 回退和类型化选项

某些能力检查在回退层而非工具边界应用，以便超出主提供商限制的请求仍可在有能力的回退上运行：

- 活动候选未声明 `maxInputAudios`（或声明为 `0`）时，在请求包含音频参考时该候选被跳过；尝试下一个候选。
- 活动候选的 `maxDurationSeconds` 低于请求的 `durationSeconds` 且没有声明 `supportedDurationSeconds` 列表时 → 跳过。
- 请求包含 `providerOptions` 且活动候选明确声明了类型化 `providerOptions` schema 时 → 如果提供的键不在 schema 中或值类型不匹配则跳过。未声明 schema 的提供商按原样接收选项（向后兼容的直通）。提供商可以通过声明空 schema（`capabilities.providerOptions: {}`）显式退出所有提供商选项，这与类型不匹配一样触发跳过。

请求中第一个跳过原因以 `warn` 级别记录，以便操作者看到主提供商被绕过；后续跳过以 `debug` 级别记录以保持长回退链安静。如果所有候选都被跳过，聚合错误包含每个候选的跳过原因。

## 动作

| 动作       | 功能                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `generate` | 默认。根据给定提示词和可选参考输入创建视频。                                                     |
| `status`   | 检查当前 Session 的进行中视频任务状态，不启动新的生成。                                          |
| `list`     | 显示可用提供商、模型及其能力。                                                                   |

## 模型选择

OpenClaw 按以下顺序解析模型：

1. **`model` 工具参数** — 如果 Agent 在调用中指定了一个。
2. **`videoGenerationModel.primary`** — 来自配置。
3. **`videoGenerationModel.fallbacks`** — 按顺序尝试。
4. **自动检测** — 使用具有有效认证的提供商，从当前默认提供商开始，然后按字母顺序排列剩余提供商。

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

<AccordionGroup>
  <Accordion title="Alibaba">
    使用 DashScope / Model Studio 异步端点。参考图像和视频必须是远程 `http(s)` URL。
  </Accordion>
  <Accordion title="BytePlus (1.0)">
    Provider id：`byteplus`。

    模型：`seedance-1-0-pro-250528`（默认）、`seedance-1-0-pro-t2v-250528`、`seedance-1-0-pro-fast-251015`、`seedance-1-0-lite-t2v-250428`、`seedance-1-0-lite-i2v-250428`。

    T2V 模型（`*-t2v-*`）不接受图像输入；I2V 模型和通用 `*-pro-*` 模型支持单张参考图像（首帧）。按位置传递图像或设置 `role: "first_frame"`。提供图像时 T2V 模型 ID 自动切换为对应的 I2V 变体。

    支持的 `providerOptions` 键：`seed`（数字）、`draft`（布尔——强制 480p）、`camera_fixed`（布尔）。

  </Accordion>
  <Accordion title="BytePlus Seedance 1.5">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin。Provider id：`byteplus-seedance15`。模型：`seedance-1-5-pro-251215`。

    使用统一 `content[]` API。最多支持 2 张输入图像（首帧+末帧）。所有输入必须是远程 `https://` URL。在每张图像上设置 `role: "first_frame"` / `"last_frame"`，或按位置传递图像。

    `aspectRatio: "adaptive"` 从输入图像自动检测比例。`audio: true` 映射到 `generate_audio`。`providerOptions.seed`（数字）被转发。

  </Accordion>
  <Accordion title="BytePlus Seedance 2.0">
    需要 [`@openclaw/byteplus-modelark`](https://www.npmjs.com/package/@openclaw/byteplus-modelark) Plugin。Provider id：`byteplus-seedance2`。模型：`dreamina-seedance-2-0-260128`、`dreamina-seedance-2-0-fast-260128`。

    使用统一 `content[]` API。最多支持 9 张参考图像、3 段参考视频和 3 个参考音频。所有输入必须是远程 `https://` URL。在每个资源上设置 `role`——支持的值：`"first_frame"`、`"last_frame"`、`"reference_image"`、`"reference_video"`、`"reference_audio"`。

    `aspectRatio: "adaptive"` 从输入图像自动检测比例。`audio: true` 映射到 `generate_audio`。`providerOptions.seed`（数字）被转发。

  </Accordion>
  <Accordion title="ComfyUI">
    工作流驱动的本地或云端执行。通过已配置的图形支持文本到视频和图像到视频。
  </Accordion>
  <Accordion title="fal">
    使用队列支持的流程处理长时间运行的任务。OpenClaw 默认等待最多 20 分钟，然后将进行中的 fal 队列任务视为超时。大多数 fal 视频模型接受单张图像参考。Seedance 2.0 参考转视频模型支持最多 9 张图像、3 段视频和 3 个音频参考，总参考文件最多 12 个。
  </Accordion>
  <Accordion title="Google (Gemini / Veo)">
    支持一张图像或一段视频参考。生成音频请求在 Gemini API 路径上会被忽略并显示警告，因为该 API 拒绝当前 Veo 视频生成的 `generateAudio` 参数。
  </Accordion>
  <Accordion title="MiniMax">
    仅支持单张图像参考。MiniMax 接受 `768P` 和 `1080P` 分辨率；`720P` 等请求在提交前规范化到最近的支持值。
  </Accordion>
  <Accordion title="OpenAI">
    仅转发 `size` 覆盖。其他风格覆盖（`aspectRatio`、`resolution`、`audio`、`watermark`）会被忽略并显示警告。
  </Accordion>
  <Accordion title="OpenRouter">
    使用 OpenRouter 的异步 `/videos` API。OpenClaw 提交任务，轮询 `polling_url`，并下载 `unsigned_urls` 或文档化的任务内容端点。捆绑的 `google/veo-3.1-fast` 默认支持 4/6/8 秒时长、`720P`/`1080P` 分辨率和 `16:9`/`9:16` 宽高比。
  </Accordion>
  <Accordion title="Qwen">
    与 Alibaba 使用相同的 DashScope 后端。参考输入必须是远程 `http(s)` URL；本地文件会被提前拒绝。
  </Accordion>
  <Accordion title="Runway">
    通过 data URI 支持本地文件。视频到视频需要 `runway/gen4_aleph`。纯文本运行支持 `16:9` 和 `9:16` 宽高比。
  </Accordion>
  <Accordion title="Together">
    仅支持单张图像参考。
  </Accordion>
  <Accordion title="Vydra">
    直接使用 `https://www.vydra.ai/api/v1` 以避免认证丢失重定向。`veo3` 捆绑为纯文本到视频；`kling` 需要远程图像 URL。
  </Accordion>
  <Accordion title="xAI">
    支持文本到视频、单首帧图像转视频、通过 xAI `reference_images` 最多 7 张 `reference_image` 输入，以及远程视频编辑/扩展流程。
  </Accordion>
</AccordionGroup>

## 提供商能力模式

共享视频生成契约支持模式特定的能力，而不仅仅是平面聚合限制。新的提供商实现应优先使用显式模式块：

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
    maxInputImagesByModel: { "provider/reference-to-video": 9 },
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

`maxInputImages` 和 `maxInputVideos` 等旧版扁平字段**不**足以声明转换模式支持。提供商应显式声明 `generate`、`imageToVideo` 和 `videoToVideo`，以便实时测试、契约测试和共享 `video_generate` 工具能够确定性地验证模式支持。

当提供商中某个模型的参考输入支持比其他模型更广泛时，使用 `maxInputImagesByModel`、`maxInputVideosByModel` 或 `maxInputAudiosByModel`，而不是提高模式范围限制。

## 实时测试

共享捆绑提供商的可选实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts
```

仓库包装器：

```bash
pnpm test:live:media video
```

该实时文件默认优先使用已导出的提供商环境变量而非存储的认证配置文件，并默认运行发布安全冒烟测试：

- 扫描中每个非 FAL 提供商的 `generate`。
- 一秒 lobster 提示。
- 来自 `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` 的每提供商操作上限（默认：`180000`）。

FAL 是可选的，因为提供商端队列延迟可能主导发布时间：

```bash
pnpm test:live:media video --video-providers fal
```

设置 `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1` 以同时运行共享扫描可以使用本地媒体安全执行的已声明转换模式：

- 当 `capabilities.imageToVideo.enabled` 时运行 `imageToVideo`。
- 当 `capabilities.videoToVideo.enabled` 且提供商/模型在共享扫描中接受缓冲区支持的本地视频输入时运行 `videoToVideo`。

当前共享 `videoToVideo` 实时通道仅在选择 `runway/gen4_aleph` 时覆盖 `runway`。

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

- [Alibaba Model Studio](/providers/alibaba)
- [后台任务](/automation/tasks) — 异步视频生成的任务跟踪
- [BytePlus](/concepts/model-providers#byteplus-international)
- [ComfyUI](/providers/comfy)
- [配置参考](/gateway/config-agents#agent-defaults)
- [fal](/providers/fal)
- [Google (Gemini)](/providers/google)
- [MiniMax](/providers/minimax)
- [模型](/concepts/models)
- [OpenAI](/providers/openai)
- [Qwen](/providers/qwen)
- [Runway](/providers/runway)
- [Together AI](/providers/together)
- [工具概览](/tools)
- [Vydra](/providers/vydra)
- [xAI](/providers/xai)
