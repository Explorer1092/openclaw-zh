---
mmh3_hash: "697448e7c6dfce86bace74fb5ed0ade1"
summary: "图像、视频、音乐、语音和媒体理解能力一览"
read_when:
  - 寻找 OpenClaw 媒体能力的概述
  - 决定配置哪个媒体提供商
  - 了解异步媒体生成的工作原理
title: "Media overview"
sidebarTitle: "Media overview"
---

OpenClaw 生成图像、视频和音乐，理解入站媒体（图像、音频、视频），并通过文本转语音大声朗读回复。所有媒体能力都由工具驱动：Agent 根据对话决定何时使用它们，每个工具仅在至少配置了一个支持提供商时才会出现。

实时语音使用 Talk Session 契约，而非一次性媒体工具路径。Talk 有三种模式：提供商原生的 `realtime`、本地或流式 `stt-tts`，以及仅观察式语音捕获的 `transcription`。这些模式与电话、会议、浏览器实时和原生按键通话客户端共享提供商目录、事件信封和取消语义。

## 能力

<CardGroup cols={2}>
  <Card title="图像生成" href="/tools/image-generation" icon="image">
    通过 `image_generate` 从文本提示或参考图像创建和编辑图像。同步——与回复内联完成。
  </Card>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    通过 `video_generate` 实现文本转视频、图像转视频和视频转视频。异步——在后台运行并在就绪时发布结果。
  </Card>
  <Card title="音乐生成" href="/tools/music-generation" icon="music">
    通过 `music_generate` 生成音乐或音轨。共享提供商为异步；ComfyUI 工作流路径同步运行。
  </Card>
  <Card title="文本转语音" href="/tools/tts" icon="microphone">
    通过 `tts` 工具加 `messages.tts` 配置将出站回复转换为语音音频。同步。
  </Card>
  <Card title="媒体理解" href="/nodes/media-understanding" icon="eye">
    使用具有视觉能力的模型提供商和专用媒体理解插件总结入站图像、音频和视频。
  </Card>
  <Card title="语音转文字" href="/nodes/audio" icon="ear-listen">
    通过批量 STT 或 Voice Call 流式 STT 提供商转录入站语音消息。
  </Card>
</CardGroup>

## 提供商能力矩阵

| 提供商       | 图像 | 视频 | 音乐 | TTS | STT | 实时语音 | 媒体理解 |
| ------------ | :--: | :--: | :--: | :-: | :-: | :------: | :------: |
| Alibaba      |      |  ✓   |      |     |     |          |          |
| BytePlus     |      |  ✓   |      |     |     |          |          |
| ComfyUI      |  ✓   |  ✓   |  ✓   |     |     |          |          |
| DeepInfra    |  ✓   |  ✓   |      |  ✓  |  ✓  |          |    ✓     |
| Deepgram     |      |      |      |     |  ✓  |    ✓     |          |
| ElevenLabs   |      |      |      |  ✓  |  ✓  |          |          |
| fal          |  ✓   |  ✓   |      |     |     |          |          |
| Google       |  ✓   |  ✓   |  ✓   |  ✓  |     |    ✓     |    ✓     |
| Gradium      |      |      |      |  ✓  |     |          |          |
| Local CLI    |      |      |      |  ✓  |     |          |          |
| Microsoft    |      |      |      |  ✓  |     |          |          |
| MiniMax      |  ✓   |  ✓   |  ✓   |  ✓  |     |          |          |
| Mistral      |      |      |      |     |  ✓  |          |          |
| OpenAI       |  ✓   |  ✓   |      |  ✓  |  ✓  |    ✓     |    ✓     |
| OpenRouter   |  ✓   |  ✓   |      |  ✓  |     |          |    ✓     |
| Qwen         |      |  ✓   |      |     |     |          |          |
| Runway       |      |  ✓   |      |     |     |          |          |
| SenseAudio   |      |      |      |     |  ✓  |          |          |
| Together     |      |  ✓   |      |     |     |          |          |
| Vydra        |  ✓   |  ✓   |      |  ✓  |     |          |          |
| xAI          |  ✓   |  ✓   |      |  ✓  |  ✓  |          |    ✓     |
| Xiaomi MiMo  |  ✓   |      |      |  ✓  |     |          |    ✓     |

<Note>
媒体理解使用在你的提供商配置中注册的任何具有视觉能力或音频能力的模型。上表列出了具有专用媒体理解支持的提供商；大多数多模态 LLM 提供商（Anthropic、Google、OpenAI 等）在配置为活跃回复模型时也可以理解入站媒体。
</Note>

## 异步 vs 同步

| 能力           | 模式 | 原因                                                               |
| -------------- | ---- | ------------------------------------------------------------------ |
| 图像           | 同步 | 提供商响应在几秒内返回；与回复内联完成。                           |
| 文本转语音     | 同步 | 提供商响应在几秒内返回；附加到回复音频。                           |
| 视频           | 异步 | 提供商处理需要 30 秒到几分钟。                                     |
| 音乐（共享）   | 异步 | 与视频相同的提供商处理特性。                                       |
| 音乐（ComfyUI）| 同步 | 本地工作流针对已配置的 ComfyUI 服务器内联运行。                   |

对于异步工具，OpenClaw 将请求提交给提供商，立即返回任务 ID，并在任务账本中跟踪作业。Agent 在作业运行期间继续响应其他消息。当提供商完成时，OpenClaw 唤醒 Agent，并携带生成的媒体路径，以便 Agent 告知用户并在源投递策略要求时通过 message 工具传递结果。对于仅限 message 工具的群组/Channel 路由，OpenClaw 将缺少 message 工具投递证据视为完成失败，并直接将生成的媒体发送到原始 Channel。

## 语音转文字和 Voice Call

Deepgram、DeepInfra、ElevenLabs、Mistral、OpenAI、SenseAudio 和 xAI 在配置后都可以通过批量 `tools.media.audio` 路径转录入站音频。在入站上下文中预检语音备注以进行提及门控或命令解析的 Channel 插件会标记已转录的附件，因此共享媒体理解通道会复用该转录，而不是对同一音频进行第二次 STT 调用。

Deepgram、ElevenLabs、Mistral、OpenAI 和 xAI 还注册了 Voice Call 流式 STT 提供商，因此实时电话音频可以转发到所选供应商，而无需等待完整录音。

## 提供商映射（供应商如何跨表面分布）

<AccordionGroup>
  <Accordion title="Google">
    图像、视频、音乐、批量 TTS、后端实时语音和媒体理解表面。
  </Accordion>
  <Accordion title="OpenAI">
    图像、视频、批量 TTS、批量 STT、Voice Call 流式 STT、后端实时语音和记忆嵌入表面。
  </Accordion>
  <Accordion title="DeepInfra">
    聊天/模型路由、图像生成/编辑、文本到视频、批量 TTS、批量 STT、图像媒体理解和记忆嵌入表面。DeepInfra 原生重排/分类/目标检测模型在 OpenClaw 拥有这些类别的专用提供商契约之前不会注册。
  </Accordion>
  <Accordion title="xAI">
    图像、视频、搜索、代码执行、批量 TTS、批量 STT 和 Voice Call 流式 STT。xAI 实时语音是上游能力，但在共享实时语音契约能够表示它之前，尚未在 OpenClaw 中注册。
  </Accordion>
</AccordionGroup>

## 相关

- [图像生成](/tools/image-generation)
- [视频生成](/tools/video-generation)
- [音乐生成](/tools/music-generation)
- [文本转语音](/tools/tts)
- [媒体理解](/nodes/media-understanding)
- [音频节点](/nodes/audio)
- [Talk 模式](/nodes/talk)
