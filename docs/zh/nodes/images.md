---
title: "图像与媒体支持"
sidebarTitle: "图像与媒体"
mmh3_hash: "c176c12f15ec15828d9cb316fd2b25df"
summary: "发送、Gateway 和 Agent 回复的图像和媒体处理规则"
read_when:
  - 修改媒体管道或附件
---

WhatsApp Channel 通过 **Baileys Web** 运行。本文档记录了发送、Gateway 和 agent 回复的当前媒体处理规则。

## 目标

- 通过 `openclaw message send --media` 发送带可选说明的媒体。
- 允许来自 Web 收件箱的自动回复包含媒体和文本。
- 保持每种类型的限制合理且可预测。

## CLI 界面

- `openclaw message send --media <path-or-url> [--message <caption>]`
  - `--media` 可选；纯媒体发送时说明可以为空。
  - `--dry-run` 打印解析的负载；`--json` 输出 `{ channel, to, messageId, mediaUrl, caption }`。

## WhatsApp Web Channel 行为

- 输入：本地文件路径**或** HTTP(S) URL。
- 流程：加载到缓冲区，检测媒体类型，并构建正确的负载：
  - **图像：** 调整大小并重新压缩为 JPEG（最大边 2048px），目标为 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
  - **音频/语音/视频：** 直通，最大 16 MB；音频以语音笔记发送（`ptt: true`）。
  - **文档：** 其他所有内容，最大 100 MB，在可用时保留文件名。
- WhatsApp GIF 样式播放：发送带 `gifPlayback: true` 的 MP4（CLI：`--gif-playback`），以便移动客户端内联循环播放。
- MIME 检测优先使用魔术字节，然后是标头，然后是文件扩展名。
- 说明来自 `--message` 或 `reply.text`；允许空说明。
- 日志：非详细模式显示 `↩️`/`✅`；详细模式包括大小和源路径/URL。

## 自动回复管道

- `getReplyFromConfig` 返回 `{ text?, mediaUrl?, mediaUrls? }`。
- 当存在媒体时，Web 发送方使用与 `openclaw message send` 相同的管道解析本地路径或 URL。
- 如果提供了多个媒体条目，则按顺序发送。

## 入站媒体到命令（Pi）

- 当入站 Web 消息包含媒体时，OpenClaw 下载到临时文件并提供模板变量：
  - `{{MediaUrl}}`：入站媒体的伪 URL。
  - `{{MediaPath}}`：在运行命令之前写入的本地临时路径。
- 启用每会话 Docker 沙盒时，入站媒体被复制到沙盒工作区，`MediaPath`/`MediaUrl` 被重写为相对路径，如 `media/inbound/<filename>`。
- 媒体理解（如果通过 `tools.media.*` 或共享 `tools.media.models` 配置）在模板化之前运行，可以将 `[Image]`、`[Audio]` 和 `[Video]` 块插入 `Body`。
  - 音频设置 `{{Transcript}}` 并使用转录进行命令解析，以便斜杠命令仍然有效。
  - 视频和图像描述在命令解析中保留任何说明文字。
  - 如果活动的主图像模型已原生支持视觉，OpenClaw 会跳过 `[Image]` 摘要块，直接将原始图像传递给模型。
- 默认情况下只处理第一个匹配的图像/音频/视频附件；设置 `tools.media.<cap>.attachments` 以处理多个附件。

## 限制和错误

**出站发送上限（WhatsApp Web 发送）**

- 图像：重新压缩后最大 `channels.whatsapp.mediaMaxMb`（默认：50 MB）。
- 音频/语音/视频：16 MB 上限；文档：100 MB 上限。
- 超大或不可读的媒体 → 日志中清晰的错误，回复被跳过。

**媒体理解上限（转录/描述）**

- 图像默认：10 MB（`tools.media.image.maxBytes`）。
- 音频默认：20 MB（`tools.media.audio.maxBytes`）。
- 视频默认：50 MB（`tools.media.video.maxBytes`）。
- 超大媒体跳过理解，但回复仍以原始正文发送。

## 测试说明

- 涵盖图像/音频/文档情况的发送 + 回复流程。
- 验证图像的重新压缩（大小限制）和音频的语音笔记标志。
- 确保多媒体回复以顺序发送的方式展开。

## 相关文档

- [相机捕获](/nodes/camera)
- [媒体理解](/nodes/media-understanding)
- [音频与语音笔记](/nodes/audio)
