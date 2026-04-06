---
mmh3_hash: "4d40bc0d8e4f8bbdad0d1b50dd72e55c"
title: "模型 Provider"
sidebarTitle: "模型 Provider"
summary: "OpenClaw 支持的模型 Provider（LLM）"
read_when:
  - 您想选择一个模型 Provider
  - 您需要支持的 LLM 后端的快速概述
---

# 模型 Provider

OpenClaw 可以使用多个 LLM Provider。选择一个 Provider，进行身份验证，然后将默认模型设置为 `provider/model`。

正在寻找聊天 Channel 文档（WhatsApp/Telegram/Discord/Slack/Mattermost（Plugin）/等）？参见 [Channels](/channels)。

## 快速开始

1. 使用 Provider 进行身份验证（通常通过 `openclaw onboard`）。
2. 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## Provider 文档

- [Alibaba Model Studio](/providers/alibaba)
- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [BytePlus（国际版）](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [ComfyUI](/providers/comfy)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [DeepSeek](/providers/deepseek)
- [fal](/providers/fal)
- [Fireworks](/providers/fireworks)
- [GitHub Copilot](/providers/github-copilot)
- [GLM 模型](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq（LPU 推理）](/providers/groq)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM（统一网关）](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama（云端 + 本地模型）](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode](/providers/opencode)
- [OpenCode Go](/providers/opencode-go)
- [OpenRouter](/providers/openrouter)
- [Perplexity（Web 搜索）](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen Cloud](/providers/qwen)
- [Runway](/providers/runway)
- [SGLang（本地模型）](/providers/sglang)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Together AI](/providers/together)
- [Venice（Venice AI，注重隐私）](/providers/venice)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Vydra](/providers/vydra)
- [vLLM（本地模型）](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## 共享概述页面

- [其他内置变体](/providers/models#additional-bundled-provider-variants) - Anthropic Vertex、Copilot Proxy 和 Gemini CLI OAuth
- [图像生成](/tools/image-generation) - 共享 `image_generate` 工具、Provider 选择和故障转移
- [音乐生成](/tools/music-generation) - 共享 `music_generate` 工具、Provider 选择和故障转移
- [视频生成](/tools/video-generation) - 共享 `video_generate` 工具、Provider 选择和故障转移

## 转录 Provider

- [Deepgram（音频转录）](/providers/deepgram)

## 社区工具

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - 用于 Claude 订阅凭据的社区代理（使用前请验证 Anthropic 政策/条款）

有关完整的 Provider 目录（xAI、Groq、Mistral 等）和高级配置，请参见[模型 Provider](/concepts/model-providers)。
