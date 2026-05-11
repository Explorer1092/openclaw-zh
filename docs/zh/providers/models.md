---
title: "Model provider quickstart"
mmh3_hash: "199dc00c46aa3c5325623de89acc6990"
summary: "OpenClaw 支持的模型 Provider（LLM）"
read_when:
  - 您想选择一个模型 Provider
  - 您需要 LLM 身份验证 + 模型选择的快速设置示例
---

OpenClaw 可以使用多个 LLM Provider。选择一个，进行身份验证，然后将默认模型设置为 `provider/model`。

## 快速开始（两步）

1. 使用 Provider 进行身份验证（通常通过 `openclaw onboard`）。
2. 设置默认模型：

```json5
{
  agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
}
```

## 支持的 Provider（入门集）

- [Alibaba Model Studio](/providers/alibaba)
- [Amazon Bedrock](/providers/bedrock)
- [Anthropic (API + Claude CLI)](/providers/anthropic)
- [BytePlus（国际）](/concepts/model-providers#byteplus-international)
- [Chutes](/providers/chutes)
- [ComfyUI](/providers/comfy)
- [Cloudflare AI Gateway](/providers/cloudflare-ai-gateway)
- [DeepInfra](/providers/deepinfra)
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

## 其他内置 Provider 变体

- `anthropic-vertex` - 当 Vertex 凭据可用时隐式支持 Anthropic 在 Google Vertex 上运行；无需单独的入门身份验证选项
- `copilot-proxy` - 本地 VS Code Copilot Proxy 桥接；使用 `openclaw onboard --auth-choice copilot-proxy`
- `google-gemini-cli` - 非官方 Gemini CLI OAuth 流程；需要本地安装 `gemini`（`brew install gemini-cli` 或 `npm install -g @google/gemini-cli`）；默认模型 `google-gemini-cli/gemini-3-flash-preview`；使用 `openclaw onboard --auth-choice google-gemini-cli` 或 `openclaw models auth login --provider google-gemini-cli --set-default`

有关完整的 Provider 目录（xAI、Groq、Mistral 等）和高级配置，请参见[模型 Provider](/concepts/model-providers)。

## 相关

- [模型选择](/concepts/model-providers)
- [模型故障转移](/concepts/model-failover)
- [模型 CLI](/cli/models)
