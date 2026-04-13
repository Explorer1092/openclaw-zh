---
mmh3_hash: "9d62aaa66eec83af6647a2b62eb6ad32"
summary: "媒体生成、理解和语音功能的统一登录页面"
read_when:
  - 寻找媒体能力概述
  - 决定配置哪个媒体 Provider
  - 了解异步媒体生成的工作原理
title: "Media Overview"
---

# 媒体生成与理解

OpenClaw 生成图像、视频和音乐，理解入站媒体（图像、音频、视频），并通过文本转语音大声朗读回复。所有媒体能力都由工具驱动：Agent 根据对话决定何时使用它们，每个工具仅在至少配置了一个支持 Provider 时才会出现。

## 能力一览

| 能力            | 工具             | Provider                                                                                     | 功能                                      |
| --------------- | ---------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 图像生成        | `image_generate` | ComfyUI、fal、Google、MiniMax、OpenAI、Vydra                                                  | 从文本提示或参考创建或编辑图像            |
| 视频生成        | `video_generate` | Alibaba、BytePlus、ComfyUI、fal、Google、MiniMax、OpenAI、Qwen、Runway、Together、Vydra、xAI | 从文本、图像或现有视频创建视频            |
| 音乐生成        | `music_generate` | ComfyUI、Google、MiniMax                                                                     | 从文本提示创建音乐或音轨                  |
| 文本转语音（TTS） | `tts`           | ElevenLabs、Microsoft、MiniMax、OpenAI                                                        | 将出站回复转换为语音音频                  |
| 媒体理解        | （自动）         | 任何具有视觉/音频能力的模型 Provider，加上 CLI 回退                                          | 总结入站图像、音频和视频                  |

## Provider 能力矩阵

此表显示哪些 Provider 支持平台上的哪些媒体能力。

| Provider   | 图像 | 视频 | 音乐 | TTS | STT / 转录 | 媒体理解 |
| ---------- | ---- | ---- | ---- | --- | ---------- | -------- |
| Alibaba    |      | 是   |      |     |            |          |
| BytePlus   |      | 是   |      |     |            |          |
| ComfyUI    | 是   | 是   | 是   |     |            |          |
| Deepgram   |      |      |      |     | 是         |          |
| ElevenLabs |      |      |      | 是  |            |          |
| fal        | 是   | 是   |      |     |            |          |
| Google     | 是   | 是   | 是   |     |            | 是       |
| Microsoft  |      |      |      | 是  |            |          |
| MiniMax    | 是   | 是   | 是   | 是  |            |          |
| OpenAI     | 是   | 是   |      | 是  | 是         | 是       |
| Qwen       |      | 是   |      |     |            |          |
| Runway     |      | 是   |      |     |            |          |
| Together   |      | 是   |      |     |            |          |
| Vydra      | 是   | 是   |      |     |            |          |
| xAI        |      | 是   |      |     |            |          |

<Note>
媒体理解使用在您的 Provider 配置中注册的任何具有视觉能力或音频能力的模型。上表重点介绍具有专用媒体理解支持的 Provider；大多数具有多模态模型的 LLM Provider（Anthropic、Google、OpenAI 等）在配置为活跃回复模型时也可以理解入站媒体。
</Note>

## 异步生成的工作原理

视频和音乐生成作为后台任务运行，因为 Provider 处理通常需要 30 秒到几分钟。当 Agent 调用 `video_generate` 或 `music_generate` 时，OpenClaw 立即将请求提交给 Provider，返回任务 ID，并在任务账本中跟踪作业。当 Provider 完成时，OpenClaw 唤醒 Agent，以便它可以将完成的媒体发布回原始 Channel。图像生成和 TTS 是同步的，并与回复内联完成。

## 快速链接

- [图像生成](/tools/image-generation) -- 生成和编辑图像
- [视频生成](/tools/video-generation) -- 文本转视频、图像转视频和视频转视频
- [音乐生成](/tools/music-generation) -- 创作音乐和音轨
- [文本转语音](/tools/tts) -- 将回复转换为语音音频
- [媒体理解](/nodes/media-understanding) -- 理解入站图像、音频和视频
