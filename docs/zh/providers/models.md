---
title: "模型提供商"
sidebarTitle: "模型提供商示例"
mmh3_hash: "5067399efadf0e68fdc47a25c0a945b8"
summary: "OpenClaw 支持的模型提供商 (LLMs)"
read_when: ["您想选择一个模型提供商","您需要 LLM 身份验证 + 模型选择的快速设置示例"]
---
# 模型提供商

OpenClaw 可以使用多个 LLM 提供商。选择一个,进行身份验证,然后将默认模型设置为 `provider/model`。

## 亮点: Venice (Venice AI)

Venice 是我们推荐的 Venice AI 设置,用于隐私优先的推理,并可选择将 Opus 用于最困难的任务。

- 默认: `venice/llama-3.3-70b`
- 最佳整体: `venice/claude-opus-45` (Opus 仍然是最强的)

参见 [Venice AI](/providers/venice)。

## 快速开始(两步)

1. 使用提供商进行身份验证(通常通过 `openclaw onboard`)。
2. 设置默认模型:

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-5" } } },
}
```

## 支持的提供商(入门集)

- [OpenAI (API + Codex)](/providers/openai)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [OpenRouter](/providers/openrouter)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [Synthetic](/providers/synthetic)
- [OpenCode Zen](/providers/opencode)
- [Z.AI](/providers/zai)
- [GLM 模型](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venice (Venice AI)](/providers/venice)
- [Amazon Bedrock](/bedrock)

有关完整的提供商目录(xAI、Groq、Mistral 等)和高级配置,请参见 [模型提供商](/concepts/model-providers)。
