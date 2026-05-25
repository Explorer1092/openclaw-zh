---
mmh3_hash: "ae26767c3a85d90076a525c0ade9da8f"
summary: "用于 Provider 支持的模型、图像、音频、TTS、视频、网络和嵌入工作流的推理优先 CLI"
read_when:
  - 添加或修改 `openclaw infer` 命令
  - 设计稳定的无头能力自动化
title: "推理 CLI"
---

`openclaw infer` 是 Provider 支持的推理工作流的规范无头界面。

它有意公开能力系列，而不是原始 Gateway RPC 名称，也不是原始 Agent 工具 ID。

## 将 infer 转化为 Skill

将以下内容复制粘贴给 Agent：

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

好的基于 infer 的 Skill 应该：

- 将常见的用户意图映射到正确的 infer 子命令
- 为其涵盖的工作流包含一些规范的 infer 示例
- 在示例和建议中优先使用 `openclaw infer ...`
- 避免在 Skill 主体内重新记录整个 infer 界面

典型的以 infer 为中心的 Skill 覆盖范围：

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## 为什么使用 infer

`openclaw infer` 为 OpenClaw 内部 Provider 支持的推理任务提供一致的 CLI。

优势：

- 使用 OpenClaw 中已配置的 Provider 和模型，而不是为每个后端单独编写包装器。
- 将模型、图像、音频转录、TTS、视频、网络和嵌入工作流保持在一个命令树下。
- 使用稳定的 `--json` 输出形式用于脚本、自动化和 Agent 驱动的工作流。
- 当任务本质上是"运行推理"时，优先使用 OpenClaw 原生界面。
- 大多数 infer 命令使用正常的本地路径，无需 Gateway。

对于端到端的 Provider 检查，在较低级别的 Provider 测试通过后，优先使用 `openclaw infer ...`。
它在发出 Provider 请求之前会测试已发布的 CLI、配置加载、默认 Agent 解析、捆绑 Plugin 激活和共享能力运行时。

## 命令树

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## 常见任务

下表将常见的推理任务映射到对应的 infer 命令。

| 任务                         | 命令                                                                                          | 备注                                                  |
| ---------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 运行文本/模型提示            | `openclaw infer model run --prompt "..." --json`                                              | 默认使用正常的本地路径                                |
| 在图像上运行模型提示         | `openclaw infer model run --prompt "Describe this" --file ./image.png --model provider/model` | 重复 `--file` 可输入多个图像                          |
| 生成图像                     | `openclaw infer image generate --prompt "..." --json`                                         | 从现有文件开始时使用 `image edit`                     |
| 描述图像文件                 | `openclaw infer image describe --file ./image.png --prompt "..." --json`                      | `--model` 必须是支持图像的 `<provider/model>`         |
| 转录音频                     | `openclaw infer audio transcribe --file ./memo.m4a --json`                                    | `--model` 必须是 `<provider/model>`                   |
| 合成语音                     | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json`                        | `tts status` 面向 Gateway                             |
| 生成视频                     | `openclaw infer video generate --prompt "..." --json`                                         | 支持 `--resolution` 等 Provider 提示                  |
| 描述视频文件                 | `openclaw infer video describe --file ./clip.mp4 --json`                                      | `--model` 必须是 `<provider/model>`                   |
| 搜索网络                     | `openclaw infer web search --query "..." --json`                                              |                                                       |
| 抓取网页                     | `openclaw infer web fetch --url https://example.com --json`                                   |                                                       |
| 创建嵌入向量                 | `openclaw infer embedding create --text "..." --json`                                         |                                                       |

## 行为

- `openclaw infer ...` 是这些工作流的主要 CLI 界面。
- 当输出将被另一个命令或脚本使用时，使用 `--json`。
- 当需要特定后端时，使用 `--provider` 或 `--model provider/model`。
- 使用 `model run --thinking <level>` 传递一次性思考/推理级别（`off`、`minimal`、`low`、`medium`、`high`、`adaptive`、`xhigh` 或 `max`），同时保持运行原始状态。
- 对于 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必须使用 `<provider/model>` 形式。
- 对于 `image describe`，`--file` 接受本地路径和 HTTP(S) 图像 URL。远程 URL 使用正常的媒体抓取 SSRF 策略。
- 对于 `image describe`，显式 `--model` 直接运行该 Provider/模型。模型必须在模型目录或 Provider 配置中支持图像输入。`codex/<model>` 运行有界 Codex 应用服务器图像理解轮次；`openai-codex/<model>` 使用 OpenAI Codex OAuth Provider 路径。
- 无状态执行命令默认为本地。
- Gateway 管理的状态命令默认为 Gateway。
- 正常的本地路径不需要 Gateway 运行。
- 本地 `model run` 是精简的一次性 Provider 完成。它解析已配置的 Agent 模型和认证，但不启动聊天 Agent 轮次、加载工具或打开捆绑的 MCP 服务器。
- `model run --file` 接受图像文件，检测其 MIME 类型，并与提供的提示一起发送给所选模型。重复 `--file` 可输入多个图像。
- `model run --file` 拒绝非图像输入。音频文件使用 `infer audio transcribe`，视频文件使用 `infer video describe`。
- `model run --gateway` 测试 Gateway 路由、已保存的认证、Provider 选择和嵌入式运行时，但仍作为原始模型探测运行：它发送提供的提示和任何图像附件，而不包含先前的 Session 转录、bootstrap/AGENTS 上下文、上下文引擎组装、工具或捆绑的 MCP 服务器。
- `model run --gateway --model <provider/model>` 需要受信任的运营商 Gateway 凭据，因为请求要求 Gateway 运行一次性 Provider/模型覆盖。
- 本地 `model run --thinking` 使用精简的 Provider 完成路径；Provider 特定的级别（如 `adaptive` 和 `max`）被映射到最接近的可移植简单完成级别。

## Model

使用 `model` 进行 Provider 支持的文本推理和模型/Provider 检查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --model openai/gpt-5.4 --json
openclaw infer model run --prompt "Describe this image in one sentence" --file ./photo.jpg --model google/gemini-2.5-flash --json
openclaw infer model run --prompt "Use more reasoning here" --thinking high --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

使用完整的 `<provider/model>` 引用对特定 Provider 进行冒烟测试，而无需启动 Gateway 或加载完整的 Agent 工具界面：

```bash
openclaw infer model run --local --model anthropic/claude-sonnet-4-6 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model cerebras/zai-glm-4.7 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model google/gemini-2.5-flash --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model groq/llama-3.1-8b-instant --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-medium-3-5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model mistral/mistral-small-latest --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model openai/gpt-5.5 --prompt "Reply with exactly: pong" --json
openclaw infer model run --local --model ollama/qwen2.5vl:7b --prompt "Describe this image." --file ./photo.jpg --json
```

注意事项：

- 本地 `model run` 是最窄的 CLI 冒烟测试，用于检查 Provider/模型/认证健康状况，因为对于非 Codex Provider，它只将提供的提示发送给所选模型。
- 本地 `model run --model <provider/model>` 可以在该 Provider 写入配置之前使用 `models list --all` 中的精确捆绑静态目录行。Provider 认证仍然是必需的；缺少凭据会以认证错误失败，而不是 `Unknown model`。
- 对于 Mistral Medium 3.5 推理探测，不设置 temperature/保持默认值。Mistral 拒绝 `reasoning_effort="high"` 加 `temperature: 0`；使用 `mistral/mistral-medium-3-5` 配合默认 temperature 或非零推理模式值（如 `0.7`）。
- `openai-codex/*` 本地探测是窄例外：OpenClaw 添加一个最小系统指令，以便 Codex Responses 传输可以填充其必需的 `instructions` 字段，而不添加完整的 Agent 上下文、工具、Memory 或 Session 转录。
- 本地 `model run --file` 保持精简路径，并将图像内容直接附加到单个用户消息。当检测到 `image/*` MIME 类型时，PNG、JPEG 和 WebP 等常见图像文件可以工作；不支持或无法识别的文件在调用 Provider 之前失败。
- `model run --file` 最适合直接测试所选的多模态文本模型。当您想要 OpenClaw 的图像理解 Provider 选择和默认图像模型路由时，使用 `infer image describe`。
- 所选模型必须支持图像输入；纯文本模型可能会在 Provider 层拒绝请求。
- `model run --prompt` 必须包含非空白文本；空提示在调用本地 Provider 或 Gateway 之前被拒绝。
- 本地 `model run` 在 Provider 不返回文本输出时以非零退出，因此无法访问的本地 Provider 和空完成结果不会看起来像成功的探测。
- 当您需要测试 Gateway 路由、Agent 运行时设置或 Gateway 管理的 Provider 状态同时保持模型输入原始时，使用 `model run --gateway`。当您想要完整的 Agent 上下文、工具、Memory 和 Session 转录时，使用 `openclaw agent` 或聊天界面。
- `model auth login`、`model auth logout` 和 `model auth status` 管理已保存的 Provider 认证状态。

## Image

使用 `image` 进行生成、编辑和描述。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image generate --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "simple red circle sticker on a transparent background" --json
openclaw infer image generate --prompt "slow image backend" --timeout-ms 180000 --json
openclaw infer image edit --file ./logo.png --model openai/gpt-image-1.5 --output-format png --background transparent --prompt "keep the logo, remove the background" --json
openclaw infer image edit --file ./poster.png --prompt "make this a vertical story ad" --size 2160x3840 --aspect-ratio 9:16 --resolution 4K --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file https://example.com/photo.png --json
openclaw infer image describe --file ./receipt.jpg --prompt "Extract the merchant, date, and total" --json
openclaw infer image describe-many --file ./before.png --file ./after.png --prompt "Compare the screenshots and list visible UI changes" --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-5.4-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --prompt "Describe the image in one sentence" --timeout-ms 300000 --json
```

注意事项：

- 从现有输入文件开始时使用 `image edit`。
- 对于支持参考图像编辑几何提示的 Provider/模型，在 `image edit` 中使用 `--size`、`--aspect-ratio` 或 `--resolution`。
- 对于 `--model openai/gpt-image-1.5` 的透明背景 OpenAI PNG 输出，使用 `--output-format png --background transparent`；`--openai-background` 作为 OpenAI 特定别名仍然可用。不声明背景支持的 Provider 将提示报告为被忽略的覆盖。
- 对于 `image describe`，`--file` 接受本地路径和 HTTP(S) 图像 URL。远程 URL 使用正常的媒体抓取 SSRF 策略。
- 使用 `image providers --json` 验证哪些捆绑图像 Provider 可被发现、已配置、已选择，以及每个 Provider 公开的生成/编辑能力。
- 使用 `image generate --model <provider/model> --json` 作为最窄的图像生成更改实时 CLI 冒烟测试。示例：

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  JSON 响应报告 `ok`、`provider`、`model`、`attempts` 和写入的输出路径。设置 `--output` 时，最终扩展名可能跟随 Provider 返回的 MIME 类型。

- 对于 `image describe` 和 `image describe-many`，使用 `--prompt` 为视觉模型提供任务特定指令，例如 OCR、比较、UI 检查或简洁描述。
- 对慢速本地视觉模型或冷启动的 Ollama 使用 `--timeout-ms`。
- 对于 `image describe`，`--model` 必须是支持图像的 `<provider/model>`。
- 对于本地 Ollama 视觉模型，先拉取模型并将 `OLLAMA_API_KEY` 设置为任意占位符值，例如 `ollama-local`。请参阅 [Ollama](/providers/ollama#vision-and-image-description)。

## Audio

使用 `audio` 进行文件转录。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

注意事项：

- `audio transcribe` 用于文件转录，不用于实时 Session 管理。
- `--model` 必须是 `<provider/model>`。

## TTS

使用 `tts` 进行语音合成和 TTS Provider 状态管理。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

注意事项：

- `tts status` 默认为 Gateway，因为它反映 Gateway 管理的 TTS 状态。
- 使用 `tts providers`、`tts voices` 和 `tts set-provider` 检查和配置 TTS 行为。

## Video

使用 `video` 进行生成和描述。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-5.4-mini --json
```

注意事项：

- `video generate` 接受 `--size`、`--aspect-ratio`、`--resolution`、`--duration`、`--audio`、`--watermark` 和 `--timeout-ms`，并将它们转发给视频生成运行时。
- 对于 `video describe`，`--model` 必须是 `<provider/model>`。

## Web

使用 `web` 进行搜索和抓取工作流。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

注意事项：

- 使用 `web providers` 检查可用、已配置和已选择的 Provider。

## Embedding

使用 `embedding` 进行向量创建和嵌入 Provider 检查。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 输出

infer 命令在共享的信封下规范化 JSON 输出：

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

顶层字段是稳定的：

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

对于生成媒体命令，`outputs` 包含 OpenClaw 写入的文件。在自动化中使用该数组中的 `path`、`mimeType`、`size` 和任何媒体特定尺寸，而不是解析人类可读的 stdout。

## 常见错误

```bash
# 错误
openclaw infer media image generate --prompt "friendly lobster"

# 正确
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# 错误
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# 正确
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## 注意事项

- `openclaw capability ...` 是 `openclaw infer ...` 的别名。

## 相关

- [CLI 参考](/cli)
- [模型](/concepts/models)
