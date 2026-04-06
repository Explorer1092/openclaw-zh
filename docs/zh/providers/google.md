---
mmh3_hash: "fe648c177577d792ab6f55ced4de5d7e"
title: "Google (Gemini)"
summary: "Google Gemini 设置（API 密钥、图像生成、媒体理解、Web 搜索）"
read_when:
  - 您想在 OpenClaw 中使用 Google Gemini 模型
  - 您需要 API 密钥身份验证流程
---

# Google (Gemini)

Google 插件通过 Google AI Studio 提供对 Gemini 模型的访问，以及图像生成、媒体理解（图像/音频/视频）和通过 Gemini Grounding 实现的 Web 搜索。

- Provider：`google`
- 身份验证：`GEMINI_API_KEY` 或 `GOOGLE_API_KEY`
- API：Google Gemini API

## 快速开始

1. 设置 API 密钥：

```bash
openclaw onboard --auth-choice gemini-api-key
```

2. 设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "google/gemini-3.1-pro-preview" },
    },
  },
}
```

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice gemini-api-key \
  --gemini-api-key "$GEMINI_API_KEY"
```

## 能力

| 能力                   | 支持              |
| ---------------------- | ----------------- |
| 聊天补全               | 是                |
| 图像生成               | 是                |
| 音乐生成               | 是                |
| 图像理解               | 是                |
| 音频转录               | 是                |
| 视频理解               | 是                |
| Web 搜索（Grounding）  | 是                |
| 思考/推理              | 是（Gemini 3.1+） |

## 直接 Gemini 缓存复用

对于直接 Gemini API 运行（`api: "google-generative-ai"`），OpenClaw 现在将配置的 `cachedContent` 句柄透传到 Gemini 请求。

- 可以通过 `cachedContent` 或旧版 `cached_content` 为每个模型或全局参数配置
- 如果两者都存在，`cachedContent` 优先
- 示例值：`cachedContents/prebuilt-context`
- Gemini 缓存命中使用量从上游 `cachedContentTokenCount` 归一化为 OpenClaw `cacheRead`

示例：

```json5
{
  agents: {
    defaults: {
      models: {
        "google/gemini-2.5-pro": {
          params: {
            cachedContent: "cachedContents/prebuilt-context",
          },
        },
      },
    },
  },
}
```

## 图像生成

内置的 `google` 图像生成 Provider 默认使用 `google/gemini-3.1-flash-image-preview`。

- 也支持 `google/gemini-3-pro-image-preview`
- 每次请求最多生成 4 张图像
- 编辑模式：已启用，最多 5 张输入图像
- 几何控件：`size`、`aspectRatio` 和 `resolution`

图像生成、媒体理解和 Gemini Grounding 都保持在 `google` Provider id 上。

将 Google 设置为默认图像 Provider：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

请参阅[图像生成](/tools/image-generation)了解共享工具参数、Provider 选择和故障转移行为。

## 视频生成

内置的 `google` 插件也通过共享的 `video_generate` 工具注册视频生成。

- 默认视频模型：`google/veo-3.1-fast-generate-preview`
- 模式：文本到视频、图像到视频和单视频参考流程
- 支持 `aspectRatio`、`resolution` 和 `audio`
- 当前时长限制：**4 到 8 秒**

将 Google 设置为默认视频 Provider：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "google/veo-3.1-fast-generate-preview",
      },
    },
  },
}
```

请参阅[视频生成](/tools/video-generation)了解共享工具参数、Provider 选择和故障转移行为。

## 音乐生成

内置的 `google` 插件也通过共享的 `music_generate` 工具注册音乐生成。

- 默认音乐模型：`google/lyria-3-clip-preview`
- 也支持 `google/lyria-3-pro-preview`
- 提示控制：`lyrics` 和 `instrumental`
- 输出格式：默认 `mp3`，`google/lyria-3-pro-preview` 还支持 `wav`
- 参考输入：最多 10 张图像
- 基于 Session 的运行通过共享任务/状态流程分离，包括 `action: "status"`

将 Google 设置为默认音乐 Provider：

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

请参阅[音乐生成](/tools/music-generation)了解共享工具参数、Provider 选择和故障转移行为。

## 环境注意事项

如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `GEMINI_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
