---
mmh3_hash: "b08dd96c3e6a4c993159c70430dba0ec"
read_when:
  - 你想选择一个模型提供商
  - 你需要支持的 LLM 后端的快速概览
summary: OpenClaw 支持的模型提供商（LLM）
title: 模型提供商目录
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: providers/index.md
  workflow: 15
---

# 模型提供商

OpenClaw 可以使用许多 LLM 提供商。选择一个提供商，完成身份验证，然后将
默认模型设置为 `provider/model`。

在找聊天 Channel 文档（WhatsApp/Telegram/Discord/Slack/Mattermost（插件）/等）？请参见 [Channels](/channels)。

## 快速开始

1. 使用该提供商进行身份验证（通常通过 `openclaw onboard`）。
2. 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 提供商文档

- [Amazon Bedrock](/providers/bedrock)
- [Anthropic（API + Claude Code CLI）](/providers/anthropic)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [DeepSeek](/providers/deepseek)
- [GitHub Copilot](/providers/github-copilot)
- [GLM 模型](/providers/glm)
- [Google（Gemini）](/providers/google)
- [Groq（LPU 推理）](/providers/groq)
- [Hugging Face（Inference）](/providers/huggingface)
- [Kilocode](/providers/kilocode)
- [LiteLLM（统一 Gateway）](/providers/litellm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI（Kimi + Kimi Coding）](/providers/moonshot)
- [NVIDIA](/providers/nvidia)
- [Ollama（云端 + 本地模型）](/providers/ollama)
- [OpenAI（API + Codex）](/providers/openai)
- [OpenCode](/providers/opencode)
- [OpenCode Go](/providers/opencode-go)
- [OpenRouter](/providers/openrouter)
- [Perplexity（网络搜索）](/providers/perplexity-provider)
- [Qianfan](/providers/qianfan)
- [Qwen / Model Studio（阿里云）](/providers/qwen_modelstudio)
- [SGLang（本地模型）](/providers/sglang)
- [Synthetic](/providers/synthetic)
- [Together AI](/providers/together)
- [Venice（Venice AI，注重隐私）](/providers/venice)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [vLLM（本地模型）](/providers/vllm)
- [Volcengine（豆包）](/providers/volcengine)
- [xAI](/providers/xai)
- [Xiaomi](/providers/xiaomi)
- [Z.AI](/providers/zai)

## 转录提供商

- [Deepgram（音频转录）](/providers/deepgram)

## 社区工具

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - 面向 Claude 订阅凭证的社区代理（使用前请核实 Anthropic 政策/条款）

有关完整的提供商目录（xAI、Groq、Mistral 等）和高级配置，
请参见 [模型提供商](/concepts/model-providers)。
