---
mmh3_hash: "415518a6ed4b015f88868b89747ec2c7"
title: "模型提供商"
sidebarTitle: "模型提供商"
summary: "OpenClaw 支持的模型提供商 (LLMs)"
read_when:
  - 您想选择一个模型提供商
  - 您需要支持的 LLM 后端的快速概述
---

# 模型提供商

OpenClaw 可以使用多个 LLM 提供商。选择一个提供商，进行身份验证，然后将默认模型设置为 `provider/model`。

正在寻找聊天频道文档（WhatsApp/Telegram/Discord/Slack/Mattermost（插件）/等）？参见 [Channels](/channels)。

## 快速开始

1. 使用提供商进行身份验证（通常通过 `openclaw onboard`）。
2. 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 提供商文档

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [GLM 模型](/providers/glm)
- [Google (Gemini)](/providers/google)
- [Groq（LPU 推理）](/providers/groq)
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM（统一网关）](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Model Studio（阿里云）](/providers/modelstudio)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama（云端 + 本地模型）](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode (Zen + Go)](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Perplexity（Web 搜索）](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen (OAuth)](/providers/qwen)
- [SGLang（本地模型）](/providers/sglang)
- [Together AI](/providers/together)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice（Venice AI，注重隐私）](/providers/venice)
- [vLLM（本地模型）](/providers/vllm)
- [Volcengine (Doubao)](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## 转录提供商

- [Deepgram（音频转录）](/providers/deepgram)

## 社区工具

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - 用于 Claude 订阅凭据的社区代理（使用前请验证 Anthropic 政策/条款）

有关完整的提供商目录（xAI、Groq、Mistral 等）和高级配置，请参见[模型提供商](/concepts/model-providers)。
