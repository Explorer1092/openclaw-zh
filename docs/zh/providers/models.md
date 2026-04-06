---
mmh3_hash: "e121b32d34c5406ea26449930f0e8ac2"
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

- [Alibaba Model Studio](/providers/alibaba)
- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [Amazon Bedrock](/providers/bedrock)
- [BytePlus（国际）](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [ComfyUI](/providers/comfy)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [fal](/providers/fal)
- [Fireworks](/providers/fireworks)
- [GLM 模型](/providers/glm)
- [MiniMax](/providers/minimax)
- [Mistral](/providers/mistral)
- [Moonshot AI (Kimi + Kimi Coding)](/providers/moonshot)
- [OpenAI (API + Codex)](/providers/openai)
- [OpenCode (Zen + Go)](/providers/opencode)
- [OpenRouter](/providers/openrouter)
- [Qianfan](/providers/qianfan)
- [Qwen](/providers/qwen)
- [Runway](/providers/runway)
- [StepFun](/providers/stepfun)
- [Synthetic](/providers/synthetic)
- [Vercel AI Gateway](/providers/vercel-ai-gateway)
- [Venice (Venice AI)](/providers/venice)
- [xAI](/providers/xai)
- [Z.AI](/providers/zai)

## 额外的内置提供商变体

- `anthropic-vertex` - 当 Vertex 凭据可用时隐式 Anthropic 支持 Google Vertex；无需单独的入门身份验证选项
- `copilot-proxy` - 本地 VS Code Copilot Proxy 桥接；使用 `openclaw onboard --auth-choice copilot-proxy`

有关完整的提供商目录（xAI、Groq、Mistral 等）和高级配置，请参见[模型提供商](/concepts/model-providers)。
