---
summary: "入站音频/语音笔记如何下载、转录并注入到回复中"
read_when:
  - 更改音频转录或媒体处理时
---
# 音频 / 语音笔记 — 2026-01-17

## 功能现状
- **媒体理解 (音频)**: 如果启用了音频理解（或自动检测），OpenClaw 会：
  1) 定位第一个音频附件（本地路径或 URL）并在需要时下载。
  2) 在发送到每个模型条目之前强制执行 `maxBytes`。
  3) 按顺序运行第一个符合条件的模型条目（提供商或 CLI）。
  4) 如果失败或跳过（大小/超时），它会尝试下一个条目。
  5) 成功时，它将 `Body` 替换为 `[Audio]` 块并设置 `{{Transcript}}`。
- **命令解析**: 当转录成功时，`CommandBody`/`RawBody` 设置为转录文本，以便斜杠命令仍然有效。
- **详细日志**: 在 `--verbose` 模式下，我们会记录转录何时运行以及何时替换正文。

## 自动检测 (默认)
如果你 **没有配置模型** 并且 `tools.media.audio.enabled` **未** 设置为 `false`，
OpenClaw 会按以下顺序自动检测并在第一个可用的选项处停止：

1) **本地 CLI** (如果已安装)
   - `sherpa-onnx-offline` (需要带有编码器/解码器/连接器/令牌的 `SHERPA_ONNX_MODEL_DIR`)
   - `whisper-cli` (来自 `whisper-cpp`; 使用 `WHISPER_CPP_MODEL` 或捆绑的 tiny 模型)
   - `whisper` (Python CLI; 自动下载模型)
2) **Gemini CLI** (`gemini`) 使用 `read_many_files`
3) **提供商密钥** (OpenAI → Groq → Deepgram → Google)

要禁用自动检测，请设置 `tools.media.audio.enabled: false`。
要自定义，请设置 `tools.media.audio.models`。
注意：二进制检测在 macOS/Linux/Windows 上是尽力而为的；确保 CLI 在 `PATH` 上（我们会扩展 `~`），或者使用完整的命令路径设置明确的 CLI 模型。

## 配置示例

### 提供商 + CLI 回退 (OpenAI + Whisper CLI)
```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          {
            type: "cli",
            command: "whisper",
            args: ["--model", "base", "{{MediaPath}}"],
            timeoutSeconds: 45
          }
        ]
      }
    }
  }
}
```

### 仅提供商带范围控制
```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        scope: {
          default: "allow",
          rules: [
            { action: "deny", match: { chatType: "group" } }
          ]
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" }
        ]
      }
    }
  }
}
```

### 仅提供商 (Deepgram)
```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "deepgram", model: "nova-3" }]
      }
    }
  }
}
```

## 说明 & 限制
- 提供商认证遵循标准模型认证顺序（认证配置文件、环境变量、`models.providers.*.apiKey`）。
- 当使用 `provider: "deepgram"` 时，Deepgram 会获取 `DEEPGRAM_API_KEY`。
- Deepgram 设置详情：[Deepgram (音频转录)](/providers/deepgram)。
- 音频提供商可以通过 `tools.media.audio` 覆盖 `baseUrl`, `headers` 和 `providerOptions`。
- 默认大小上限为 20MB (`tools.media.audio.maxBytes`)。超大音频将跳过该模型并尝试下一个条目。
- 音频的默认 `maxChars` **未设置**（完整转录）。设置 `tools.media.audio.maxChars` 或每个条目的 `maxChars` 以修剪输出。
- OpenAI 自动默认值为 `gpt-4o-mini-transcribe`；设置 `model: "gpt-4o-transcribe"` 以获得更高准确性。
- 使用 `tools.media.audio.attachments` 处理多个语音笔记 (`mode: "all"` + `maxAttachments`)。
- 转录可通过 `{{Transcript}}` 在模板中使用。
- CLI stdout 有上限 (5MB)；保持 CLI 输出简洁。

## 常见问题
- 范围规则使用首次匹配获胜。`chatType` 标准化为 `direct`, `group`, 或 `room`。
- 确保你的 CLI 退出码为 0 并打印纯文本；JSON 需要通过 `jq -r .text` 处理。
- 保持合理的超时时间 (`timeoutSeconds`, 默认 60s) 以避免阻塞回复队列。
