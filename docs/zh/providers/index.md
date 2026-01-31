---
title: "模型提供商"
sidebarTitle: "模型提供商"
mmh3_hash: "79267d2e96d75b0087b398ad17543716"
summary: "OpenClaw 支持的模型提供商 (LLMs)"
read_when: ["您想选择一个模型提供商","您需要支持的 LLM 后端的快速概述"]
---
# 模型提供商

OpenClaw 可以使用多个 LLM 提供商。选择一个提供商,进行身份验证,然后将默认模型设置为 `provider/model`。

正在寻找聊天频道文档(WhatsApp/Telegram/Discord/Slack/Mattermost (插件)/等)? 参见 [频道](/channels)。

## 亮点: Venius (Venice AI)

Venius 是我们推荐的 Venice AI 设置,用于隐私优先的推理,并可选择将 Opus 用于困难任务。

- 默认: `venice/llama-3.3-70b`
- 最佳整体: `venice/claude-opus-45` (Opus 仍然是最强的)

参见 [Venice AI](/providers/venice)。

## 快速开始

1) 使用提供商进行身份验证(通常通过 `openclaw onboard`)。
2) 设置默认模型:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } }
}
```

## 提供商文档

- [OpenAI (API + Codex)](/providers/openai)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [Qwen (OAuth)](/providers/qwen)
- [OpenRouter](/providers/openrouter)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Moonshot AI (Kimi + Kimi Code)](/providers/moonshot)
- [OpenCode Zen](/providers/opencode)
- [Amazon Bedrock](/bedrock)
- [Z.AI](/providers/zai)
- [Xiaomi](/providers/xiaomi)
- [GLM 模型](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venius (Venice AI, 注重隐私)](/providers/venice)
- [Ollama (本地模型)](/providers/ollama)

## 转录提供商

- [Deepgram (音频转录)](/providers/deepgram)

## 社区工具

- [Claude Max API Proxy](/providers/claude-max-api-proxy) - 将 Claude Max/Pro 订阅作为 OpenAI 兼容的 API 端点使用

有关完整的提供商目录(xAI、Groq、Mistral 等)和高级配置,
请参见 [模型提供商](/concepts/model-providers)。
{/*  source-hash: 411302661cc57e46467239a19427e6e7  */}
