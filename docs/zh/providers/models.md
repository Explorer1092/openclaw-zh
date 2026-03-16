---
mmh3_hash: "803a61e42feea090f3146120297db7b1"
title: "模型提供商"
sidebarTitle: "模型提供商示例"
summary: "OpenClaw 支持的模型提供商 (LLMs)"
read_when:
  - 您想选择一个模型提供商
  - 您需要 LLM 身份验证 + 模型选择的快速设置示例
---

# 模型提供商

OpenClaw 可以使用多个 LLM 提供商。选择一个，进行身份验证，然后将默认模型设置为 `provider/model`。

## 快速开始（两步）

1. 使用提供商进行身份验证（通常通过 `openclaw onboard`）。
2. 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 支持的提供商（入门集）

- [OpenAI (API + Codex)](/providers/openai)
- [Anthropic (API + Claude Code CLI)](/providers/anthropic)
- [OpenRouter](/providers/openrouter)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [Mistral](/providers/mistral)
- [Synthetic](/providers/synthetic)
- [OpenCode (Zen + Go)](/providers/opencode)
- [Z.AI](/providers/zai)
- [GLM 模型](/providers/glm)
- [MiniMax](/providers/minimax)
- [Venice (Venice AI)](/providers/venice)
- [Amazon Bedrock](/providers/bedrock)
- [Qianfan](/providers/qianfan)

有关完整的提供商目录（xAI、Groq、Mistral 等）和高级配置，请参见[模型提供商](/concepts/model-providers)。
