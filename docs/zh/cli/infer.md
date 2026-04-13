---
mmh3_hash: "43f24cc6a8b2bfcc0dbee97e3b09d70f"
summary: "用于 Provider 支持的模型、图像、音频、TTS、视频、网络和嵌入工作流的推理优先 CLI"
read_when:
  - 添加或修改 `openclaw infer` 命令
  - 设计稳定的无界面能力自动化
title: "Inference CLI"
---

# Inference CLI

`openclaw infer` 是 Provider 支持的推理工作流的标准无界面接口。

它有意公开能力系列，而非原始 Gateway RPC 名称或原始 Agent 工具 ID。

## 将 infer 转变为 Skill

将以下内容粘贴给 Agent：

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

良好的基于 infer 的 Skill 应该：

- 将常见用户意图映射到正确的 infer 子命令
- 为其覆盖的工作流包含一些典型的 infer 示例
- 在示例和建议中优先使用 `openclaw infer ...`
- 避免在 Skill 正文中重新记录整个 infer 接口

典型的 infer 聚焦 Skill 覆盖范围：

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## 为什么使用 infer

`openclaw infer` 为 OpenClaw 内部 Provider 支持的推理任务提供一个统一的 CLI。

优势：

- 使用 OpenClaw 中已配置的 Provider 和模型，而无需为每个后端编写一次性封装器。
- 将模型、图像、音频转录、TTS、视频、网络和嵌入工作流保持在一个命令树下。
- 使用稳定的 `--json` 输出格式，适用于脚本、自动化和 Agent 驱动的工作流。
- 当任务本质上是"运行推理"时，优先使用 OpenClaw 原生接口。
- 对于大多数 infer 命令，使用普通本地路径，无需运行 Gateway。

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

此表将常见推理任务映射到相应的 infer 命令。

| 任务             | 命令                                                                   | 说明                                     |
| ---------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| 运行文本/模型提示 | `openclaw infer model run --prompt "..." --json`                       | 默认使用普通本地路径                     |
| 生成图像         | `openclaw infer image generate --prompt "..." --json`                  | 从现有文件开始时使用 `image edit`        |
| 描述图像文件     | `openclaw infer image describe --file ./image.png --json`              | `--model` 必须为 `<provider/model>`      |
| 转录音频         | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` 必须为 `<provider/model>`      |
| 合成语音         | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` 面向 Gateway               |
| 生成视频         | `openclaw infer video generate --prompt "..." --json`                  |                                          |
| 描述视频文件     | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` 必须为 `<provider/model>`      |
| 搜索网络         | `openclaw infer web search --query "..." --json`                       |                                          |
| 获取网页         | `openclaw infer web fetch --url https://example.com --json`            |                                          |
| 创建嵌入         | `openclaw infer embedding create --text "..." --json`                  |                                          |

## 行为

- `openclaw infer ...` 是这些工作流的主要 CLI 接口。
- 当输出将被其他命令或脚本使用时，使用 `--json`。
- 当需要特定后端时，使用 `--provider` 或 `--model provider/model`。
- 对于 `image describe`、`audio transcribe` 和 `video describe`，`--model` 必须使用 `<provider/model>` 形式。
- 无状态执行命令默认为本地。
- Gateway 管理的状态命令默认为 Gateway。
- 普通本地路径不需要运行 Gateway。

## Model

使用 `model` 进行 Provider 支持的文本推理和模型/Provider 检查。

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.4 --json
```

说明：

- `model run` 复用 Agent 运行时，因此 Provider/模型覆盖的行为与正常 Agent 执行相同。
- `model auth login`、`model auth logout` 和 `model auth status` 管理保存的 Provider 认证状态。

## Image

使用 `image` 进行生成、编辑和描述。

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
```

说明：

- 从现有输入文件开始时使用 `image edit`。
- 对于 `image describe`，`--model` 必须为 `<provider/model>`。

## Audio

使用 `audio` 进行文件转录。

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

说明：

- `audio transcribe` 用于文件转录，而非实时 Session 管理。
- `--model` 必须为 `<provider/model>`。

## TTS

使用 `tts` 进行语音合成和 TTS Provider 状态管理。

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

说明：

- `tts status` 默认为 Gateway，因为它反映 Gateway 管理的 TTS 状态。
- 使用 `tts providers`、`tts voices` 和 `tts set-provider` 检查和配置 TTS 行为。

## Video

使用 `video` 进行生成和描述。

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

说明：

- 对于 `video describe`，`--model` 必须为 `<provider/model>`。

## Web

使用 `web` 进行搜索和获取工作流。

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

说明：

- 使用 `web providers` 检查可用、已配置和已选择的 Provider。

## Embedding

使用 `embedding` 进行向量创建和嵌入 Provider 检查。

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## JSON 输出

Infer 命令在共享信封下规范化 JSON 输出：

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-1",
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

## 常见陷阱

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

## 说明

- `openclaw capability ...` 是 `openclaw infer ...` 的别名。
