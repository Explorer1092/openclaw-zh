---
mmh3_hash: "eebf4c50600e7d606d57eca35327ce1f"
title: "模型提供商"
sidebarTitle: "模型提供商"
summary: "OpenClaw 支持的模型提供商 (LLMs)"
read_when:
  - 您想选择一个模型提供商
  - 您需要支持的 LLM 后端的快速概述
---

# 模型提供商

OpenClaw 可以使用多个 LLM 提供商。选择一个提供商，进行身份验证，然后将默认模型设置为 `provider/model`。

正在寻找聊天频道文档（WhatsApp/Telegram/Discord/Slack/Mattermost (插件)/等）？参见 [Channels](/channels)。

## 亮点：Venice (Venice AI)

Venice 是我们推荐的 Venice AI 设置，用于隐私优先的推理，并可选择将 Opus 用于困难任务。

- 默认：`venice/llama-3.3-70b`
- 最佳整体：`venice/claude-opus-45`（Opus 仍然是最强的）

参见 [Venice AI](/providers/venice)。

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
- [Hugging Face (Inference)](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM（统一网关）](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama（本地模型）](/providers/ollama)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode Zen](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Qianfan](/providers/qianfan)
- [Qwen (OAuth)](/providers/qwen)
- [Together AI](/providers/together)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice（Venice AI，注重隐私）](/providers/venice)
- [vLLM（本地模型）](/providers/vllm)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## 转录提供商

- [Deepgram（音频转录）](/providers/deepgram)

## 社区工具

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - 将 Claude Max/Pro 订阅用作 OpenAI 兼容的 API 端点

有关完整的提供商目录（xAI、Groq、Mistral 等）和高级配置，请参见[模型提供商](/concepts/model-providers)。
