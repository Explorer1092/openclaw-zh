---
mmh3_hash: "3beff8e2d61e4487e7f802ccc9dadd4d"
summary: "使用共享提供商（包括工作流驱动的插件）生成音乐"
read_when:
  - 通过 Agent 生成音乐或音频
  - 配置音乐生成提供商和模型
  - 了解 music_generate 工具参数
title: "Music Generation"
---

# Music Generation

`music_generate` 工具让 Agent 能够通过已配置提供商（如 Google、MiniMax 和工作流配置的 ComfyUI）的共享音乐生成能力来创作音乐或音频。

对于共享提供商支持的 Agent Session，OpenClaw 会将音乐生成作为后台任务启动，在任务账本中跟踪进度，然后在音轨准备好后重新唤醒 Agent，以便 Agent 将完成的音频发回原始频道。

<Note>
内置共享工具仅在至少一个音乐生成提供商可用时才会显示。如果你在 Agent 工具列表中看不到 `music_generate`，请配置 `agents.defaults.musicGenerationModel` 或设置提供商 API 密钥。
</Note>

## 快速入门

### 共享提供商支持的生成

1. 为至少一个提供商设置 API 密钥，例如 `GEMINI_API_KEY` 或 `MINIMAX_API_KEY`。
2. 可选择设置你偏好的模型：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. 向 Agent 提问：_"生成一段关于夜间穿越霓虹城市驾驶的欢快合成流行音轨。"_

Agent 会自动调用 `music_generate`，无需设置工具允许列表。

对于没有 Session 支持的直接同步上下文，内置工具仍会回退到内联生成，并在工具结果中返回最终媒体路径。

示例提示：

```text
Generate a cinematic piano track with soft strings and no vocals.
```

```text
Generate an energetic chiptune loop about launching a rocket at sunrise.
```

### 工作流驱动的 Comfy 生成

捆绑的 `comfy` 插件通过音乐生成提供商注册表接入共享 `music_generate` 工具。

1. 使用工作流 JSON 和提示/输出节点配置 `models.providers.comfy.music`。
2. 如果使用 Comfy Cloud，设置 `COMFY_API_KEY` 或 `COMFY_CLOUD_API_KEY`。
3. 向 Agent 请求音乐或直接调用工具。

示例：

```text
/tool music_generate prompt="Warm ambient synth loop with soft tape texture"
```

## 共享捆绑提供商支持

| 提供商  | 默认模型               | 参考输入       | 支持的控制参数                                                   | API 密钥                               |
| ------- | ---------------------- | -------------- | ---------------------------------------------------------------- | -------------------------------------- |
| ComfyUI | `workflow`             | 最多 1 张图像  | 工作流定义的音乐或音频                                           | `COMFY_API_KEY`、`COMFY_CLOUD_API_KEY` |
| Google  | `lyria-3-clip-preview` | 最多 10 张图像 | `lyrics`、`instrumental`、`format`                               | `GEMINI_API_KEY`、`GOOGLE_API_KEY`     |
| MiniMax | `music-2.5+`           | 无             | `lyrics`、`instrumental`、`durationSeconds`、`format=mp3`        | `MINIMAX_API_KEY`                      |

### 声明的能力矩阵

这是 `music_generate`、契约测试和共享实时扫描使用的显式模式契约。

| 提供商  | `generate` | `edit` | 编辑限制    | 共享实时通道                                                              |
| ------- | ---------- | ------ | ----------- | ------------------------------------------------------------------------- |
| ComfyUI | 是         | 是     | 1 张图像    | 不在共享扫描中；由 `extensions/comfy/comfy.live.test.ts` 覆盖             |
| Google  | 是         | 是     | 10 张图像   | `generate`、`edit`                                                        |
| MiniMax | 是         | 否     | 无          | `generate`                                                                |

使用 `action: "list"` 在运行时查看可用的共享提供商和模型：

```text
/tool music_generate action=list
```

使用 `action: "status"` 查看当前 Session 支持的音乐任务状态：

```text
/tool music_generate action=status
```

直接生成示例：

```text
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## 内置工具参数

| 参数              | 类型     | 描述                                                                                          |
| ----------------- | -------- | --------------------------------------------------------------------------------------------- |
| `prompt`          | string   | 音乐生成提示词（`action: "generate"` 时必填）                                                 |
| `action`          | string   | `"generate"`（默认）、`"status"` 查看当前 Session 任务，或 `"list"` 查看提供商                |
| `model`           | string   | 提供商/模型覆盖，例如 `google/lyria-3-pro-preview` 或 `comfy/workflow`                        |
| `lyrics`          | string   | 提供商支持显式歌词输入时的可选歌词                                                            |
| `instrumental`    | boolean  | 提供商支持时请求仅器乐输出                                                                    |
| `image`           | string   | 单张参考图像路径或 URL                                                                        |
| `images`          | string[] | 多张参考图像（最多 10 张）                                                                    |
| `durationSeconds` | number   | 提供商支持时的目标时长（秒）                                                                  |
| `format`          | string   | 提供商支持时的输出格式提示（`mp3` 或 `wav`）                                                  |
| `filename`        | string   | 输出文件名提示                                                                                |

并非所有提供商都支持所有参数。OpenClaw 在提交前仍会验证硬限制（如输入数量）。当提供商支持时长但其最大值小于请求值时，OpenClaw 会自动将其限制到最近支持的时长。当所选提供商或模型无法满足时，不受支持的可选提示会被忽略并显示警告。

工具结果会报告应用的设置。当 OpenClaw 在提供商回退期间限制时长时，返回的 `durationSeconds` 反映提交的值，`details.normalization.durationSeconds` 显示请求到应用的映射。

## 共享提供商支持路径的异步行为

- Session 支持的 Agent 运行：`music_generate` 创建后台任务，立即返回已启动/任务响应，稍后在后续 Agent 消息中发布完成的音轨。
- 重复预防：当后台任务仍处于 `queued` 或 `running` 状态时，同一 Session 中后续的 `music_generate` 调用将返回任务状态而非启动新的生成。
- 状态查询：使用 `action: "status"` 查看当前 Session 支持的音乐任务状态，而不启动新的生成。
- 任务跟踪：使用 `openclaw tasks list` 或 `openclaw tasks show <taskId>` 查看生成的排队、运行和终止状态。
- 完成唤醒：OpenClaw 将内部完成事件注入同一 Session，以便模型能够自行撰写面向用户的后续消息。
- 提示提示：当音乐任务已在进行中时，同一 Session 中后续的用户/手动轮次会收到一个小型运行时提示，以防模型盲目再次调用 `music_generate`。
- 无 Session 回退：没有真实 Agent Session 的直接/本地上下文仍会内联运行，并在同一轮次中返回最终音频结果。

### 任务生命周期

每个 `music_generate` 请求经历四个状态：

1. **queued** -- 任务已创建，等待提供商接受。
2. **running** -- 提供商正在处理（通常需要 30 秒至 3 分钟，具体取决于提供商和时长）。
3. **succeeded** -- 音轨准备就绪；Agent 唤醒并将其发布到对话中。
4. **failed** -- 提供商错误或超时；Agent 唤醒并显示错误详情。

从 CLI 检查状态：

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

重复预防：如果当前 Session 已有音乐任务处于 `queued` 或 `running` 状态，`music_generate` 返回现有任务状态而非启动新任务。使用 `action: "status"` 在不触发新生成的情况下显式检查状态。

## 配置

### 模型选择

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### 提供商选择顺序

生成音乐时，OpenClaw 按以下顺序尝试提供商：

1. 来自工具调用的 `model` 参数（如果 Agent 指定了一个）
2. 来自配置的 `musicGenerationModel.primary`
3. 按顺序的 `musicGenerationModel.fallbacks`
4. 仅使用已认证提供商默认值的自动检测：
   - 当前默认提供商优先
   - 按提供商 ID 顺序排列的剩余已注册音乐生成提供商

如果某个提供商失败，会自动尝试下一个候选提供商。如果全部失败，错误信息会包含每次尝试的详情。

如果你希望音乐生成仅使用显式 `model`、`primary` 和 `fallbacks` 条目，请设置 `agents.defaults.mediaGenerationAutoProviderFallback: false`。

## 提供商说明

- Google 使用 Lyria 3 批量生成。当前捆绑流程支持提示词、可选歌词文本和可选参考图像。
- MiniMax 使用批量 `music_generation` 端点。当前捆绑流程支持提示词、可选歌词、器乐模式、时长调整和 mp3 输出。
- ComfyUI 支持由工作流驱动，依赖于已配置的图形以及提示/输出字段的节点映射。

## 提供商能力模式

共享音乐生成契约现在支持显式模式声明：

- `generate` 用于仅提示词的生成
- `edit` 用于请求包含一张或多张参考图像时

新的提供商实现应优先使用显式模式块：

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

`maxInputImages`、`supportsLyrics` 和 `supportsFormat` 等旧版扁平字段不足以声明编辑支持。提供商应显式声明 `generate` 和 `edit`，以便实时测试、契约测试和共享 `music_generate` 工具能够确定性地验证模式支持。

## 选择合适的路径

- 当你需要模型选择、提供商故障转移和内置异步任务/状态流时，使用共享提供商支持的路径。
- 当你需要自定义工作流图或共享捆绑音乐能力不包含的提供商时，使用 ComfyUI 等插件路径。
- 如果你在调试 ComfyUI 特定行为，请参见 [ComfyUI](/providers/comfy)。如果你在调试共享提供商行为，请从 [Google (Gemini)](/providers/google) 或 [MiniMax](/providers/minimax) 开始。

## 实时测试

共享捆绑提供商的可选实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

仓库包装器：

```bash
pnpm test:live:media music
```

该实时文件从 `~/.profile` 加载缺失的提供商环境变量，默认优先使用实时/环境 API 密钥而非存储的认证配置文件，并在提供商启用编辑模式时同时运行 `generate` 和声明的 `edit` 覆盖。

目前：

- `google`：`generate` 加 `edit`
- `minimax`：仅 `generate`
- `comfy`：单独的 Comfy 实时覆盖，不在共享提供商扫描中

捆绑 ComfyUI 音乐路径的可选实时覆盖：

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

Comfy 实时文件还包含配置了相关部分时的 comfy 图像和视频工作流测试。

## 相关

- [后台任务](/automation/tasks) -- 独立 `music_generate` 运行的任务跟踪
- [配置参考](/gateway/configuration-reference#agent-defaults) -- `musicGenerationModel` 配置
- [ComfyUI](/providers/comfy)
- [Google (Gemini)](/providers/google)
- [MiniMax](/providers/minimax)
- [模型](/concepts/models) -- 模型配置和故障转移
- [工具概览](/tools)
