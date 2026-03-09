---
mmh3_hash: "60d5682ee9072677e3fdc4c9cd3e74d4"
summary: "入站图像/音频/视频理解 (可选), 带有 provider + CLI 回退"
read_when:
  - 设计或重构媒体理解
  - 调整入站音频/视频/图像预处理
title: "媒体理解"
---

# 媒体理解 (入站) — 2026-01-17

OpenClaw 可以在回复管道运行之前**总结入站媒体** (图像/音频/视频)。它会自动检测本地工具或 provider 密钥何时可用, 并且可以禁用或自定义。如果理解功能关闭, 模型仍会照常接收原始文件/URL。

## 目标

- 可选: 将入站媒体预先消化为简短文本, 以便更快路由 + 更好命令解析。
- 保留向模型传递原始媒体 (始终)。
- 支持 **provider API** 和 **CLI 回退**。
- 允许具有有序回退 (错误/大小/超时) 的多个模型。

## 高级行为

1. 收集入站附件 (`MediaPaths`, `MediaUrls`, `MediaTypes`)。
2. 对于每个启用的功能 (图像/音频/视频), 根据策略 (默认: **第一个**) 选择附件。
3. 选择第一个符合条件的模型条目 (大小 + 功能 + 认证)。
4. 如果模型失败或媒体过大, **回退到下一个条目**。
5. 成功时:
   - `Body` 变为 `[Image]`, `[Audio]`, 或 `[Video]` 块。
   - 音频设置 `{{Transcript}}`; 命令解析在存在时使用标题文本,
     否则使用转录。
   - 标题作为块内的 `User text:` 保留。

如果理解失败或被禁用, **回复流程继续**使用原始正文 + 附件。

## 配置概览

`tools.media` 支持**共享模型**以及每个功能的覆盖:

- `tools.media.models`: 共享模型列表 (使用 `capabilities` 进行门控)。
- `tools.media.image` / `tools.media.audio` / `tools.media.video`:
  - 默认值 (`prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`)
  - provider 覆盖 (`baseUrl`, `headers`, `providerOptions`)
  - 通过 `tools.media.audio.providerOptions.deepgram` 的 Deepgram 音频选项
  - 可选的**每功能 `models` 列表** (优先于共享模型)
  - `attachments` 策略 (`mode`, `maxAttachments`, `prefer`)
  - `scope` (可选的按 channel/chatType/session key 门控)
- `tools.media.concurrency`: 最大并发功能运行数 (默认 **2**)。

```json5
{
  tools: {
    media: {
      models: [
        /* 共享列表 */
      ],
      image: {
        /* 可选覆盖 */
      },
      audio: {
        /* 可选覆盖 */
        echoTranscript: true,
        echoFormat: '📝 "{transcript}"',
      },
      video: {
        /* 可选覆盖 */
      },
    },
  },
}
```

### 模型条目

每个 `models[]` 条目可以是 **provider (提供商)** 或 **CLI**:

```json5
{
  type: "provider", // 如果省略则为默认
  provider: "openai",
  model: "gpt-5.2",
  prompt: "Describe the image in <= 500 chars.",
  maxChars: 500,
  maxBytes: 10485760,
  timeoutSeconds: 60,
  capabilities: ["image"], // 可选，用于多模态条目
  profile: "vision-profile",
  preferredProfile: "vision-fallback",
}
```

```json5
{
  type: "cli",
  command: "gemini",
  args: [
    "-m",
    "gemini-3-flash",
    "--allowed-tools",
    "read_file",
    "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters.",
  ],
  maxChars: 500,
  maxBytes: 52428800,
  timeoutSeconds: 120,
  capabilities: ["video", "image"],
}
```

CLI 模板还可以使用:

- `{{MediaDir}}` (包含媒体文件的目录)
- `{{OutputDir}}` (为此运行创建的暂存目录)
- `{{OutputBase}}` (暂存文件基础路径，无扩展名)

## 默认值和限制

推荐默认值:

- `maxChars`: **500** 用于图像/视频（简短，命令友好）
- `maxChars`: **未设置** 用于音频（除非你设置限制，否则为完整转录）
- `maxBytes`:
  - 图像: **10MB**
  - 音频: **20MB**
  - 视频: **50MB**

规则:

- 如果媒体超过 `maxBytes`，该模型被跳过，**尝试下一个模型**。
- 小于 **1024 字节**的音频文件在 Provider/CLI 转录之前被视为空/损坏并跳过。
- 如果模型返回超过 `maxChars`，输出会被修剪。
- `prompt` 默认为简单的 "Describe the {media}." 加上 `maxChars` 指导（仅图像/视频）。
- 如果 `<capability>.enabled: true` 但未配置模型，OpenClaw 尝试
  **活动回复模型**（当其提供商支持该功能时）。

### 自动检测媒体理解 (默认)

如果 `tools.media.<capability>.enabled` **未** 设置为 `false` 且你尚未
配置模型，OpenClaw 会按以下顺序自动检测并在 **第一个可用的选项处停止**:

1. **本地 CLI** (仅音频; 如果已安装)
   - `sherpa-onnx-offline` (需要带有编码器/解码器/连接器/令牌的 `SHERPA_ONNX_MODEL_DIR`)
   - `whisper-cli` (`whisper-cpp`; 使用 `WHISPER_CPP_MODEL` 或捆绑的 tiny 模型)
   - `whisper` (Python CLI; 自动下载模型)
2. **Gemini CLI** (`gemini`) 使用 `read_many_files`
3. **提供商密钥**
   - 音频: OpenAI → Groq → Deepgram → Google
   - 图像: OpenAI → Anthropic → Google → MiniMax
   - 视频: Google

要禁用自动检测，请设置:

```json5
{
  tools: {
    media: {
      audio: {
        enabled: false,
      },
    },
  },
}
```

注意: 二进制检测在 macOS/Linux/Windows 上是尽力而为的；确保 CLI 在 `PATH` 上（我们会扩展 `~`），或者使用完整的命令路径设置明确的 CLI 模型。

### 代理环境支持（Provider 模型）

当启用基于 Provider 的**音频**和**视频**媒体理解时，OpenClaw 遵循标准出站代理环境变量进行 Provider HTTP 调用：

- `HTTPS_PROXY`
- `HTTP_PROXY`
- `https_proxy`
- `http_proxy`

如果未设置代理环境变量，媒体理解使用直接出口。如果代理值格式错误，OpenClaw 会记录警告并回退到直接获取。

## 功能 (可选)

如果你设置 `capabilities`，条目仅针对那些媒体类型运行。对于共享
列表，OpenClaw 可以推断默认值:

- `openai`, `anthropic`, `minimax`: **image**
- `google` (Gemini API): **image + audio + video**
- `groq`: **audio**
- `deepgram`: **audio**

对于 CLI 条目，**显式设置 `capabilities`** 以避免意外匹配。
如果你省略 `capabilities`，条目就有资格用于它出现的列表。

## 提供商支持矩阵 (OpenClaw 集成)

| 功能           | 提供商集成                                    | 说明                                  |
| -------------- | --------------------------------------------- | ------------------------------------- |
| Image (图像)   | OpenAI / Anthropic / Google / 其他通过 `pi-ai` | 注册表中任何支持图像的模型都有效。    |
| Audio (音频)   | OpenAI, Groq, Deepgram, Google, Mistral        | 提供商转录 (Whisper/Deepgram/Gemini/Voxtral)。 |
| Video (视频)   | Google (Gemini API)                           | 提供商视频理解。                      |

## 模型选择指南

- 在质量和安全性重要时，优先为每种媒体功能选择最强的最新一代模型。
- 对于处理不受信任输入的工具型 Agent，避免使用旧版/较弱的媒体模型。
- 为每种功能至少保留一个回退以确保可用性（质量模型 + 更快/更便宜的模型）。
- 当 Provider API 不可用时，CLI 回退（`whisper-cli`、`whisper`、`gemini`）非常有用。
- `parakeet-mlx` 说明：使用 `--output-dir` 时，当输出格式为 `txt`（或未指定）时，OpenClaw 读取 `<output-dir>/<media-basename>.txt`；非 `txt` 格式回退到 stdout。

## 附件策略

每功能 `attachments` 控制处理哪些附件:

- `mode`: `first` (默认) 或 `all`
- `maxAttachments`: 限制处理的数量 (默认 **1**)
- `prefer`: `first`, `last`, `path`, `url`

当 `mode: "all"` 时，输出标记为 `[Image 1/2]`, `[Audio 2/2]` 等。

## 配置示例

### 1) 共享模型列表 + 覆盖
```json5
{
  tools: {
    media: {
      models: [
        { provider: "openai", model: "gpt-5.2", capabilities: ["image"] },
        { provider: "google", model: "gemini-3-flash-preview", capabilities: ["image", "audio", "video"] },
        {
          type: "cli",
          command: "gemini",
          args: [
            "-m",
            "gemini-3-flash",
            "--allowed-tools",
            "read_file",
            "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters."
          ],
          capabilities: ["image", "video"]
        }
      ],
      audio: {
        attachments: { mode: "all", maxAttachments: 2 }
      },
      video: {
        maxChars: 500
      }
    }
  }
}
```

### 2) 仅音频 + 视频 (图像关闭)
```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"]
          }
        ]
      },
      video: {
        enabled: true,
        maxChars: 500,
        models: [
          { provider: "google", model: "gemini-3-flash-preview" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters."
            ]
          }
        ]
      }
    }
  }
}
```

### 3) 可选图像理解
```json5
{
  tools: {
    media: {
      image: {
        enabled: true,
        maxBytes: 10485760,
        maxChars: 500,
        models: [
          { provider: "openai", model: "gpt-5.2" },
          { provider: "anthropic", model: "claude-opus-4-6" },
          {
            type: "cli",
            command: "gemini",
            args: [
              "-m",
              "gemini-3-flash",
              "--allowed-tools",
              "read_file",
              "Read the media at {{MediaPath}} and describe it in <= {{MaxChars}} characters."
            ]
          }
        ]
      }
    }
  }
}
```

### 4) 多模态单一条目 (显式功能)
```json5
{
  tools: {
    media: {
      image: { models: [{ provider: "google", model: "gemini-3.1-pro-preview", capabilities: ["image", "video", "audio"] }] },
      audio: { models: [{ provider: "google", model: "gemini-3.1-pro-preview", capabilities: ["image", "video", "audio"] }] },
      video: { models: [{ provider: "google", model: "gemini-3.1-pro-preview", capabilities: ["image", "video", "audio"] }] }
    }
  }
}
```

## 状态输出

当媒体理解运行时，`/status` 包括一个简短的摘要行:

```
📎 Media: image ok (openai/gpt-5.2) · audio skipped (maxBytes)
```

这显示了适用的每个功能的结果和选择的提供商/模型。

## 说明

- 理解是 **尽力而为**。错误不会阻塞回复。
- 即使理解被禁用，附件仍会传递给模型。
- 使用 `scope` 限制理解运行的位置（例如仅限私信）。

## 相关文档

- [配置](/gateway/configuration)
- [图像与媒体支持](/nodes/images)
