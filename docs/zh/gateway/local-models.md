---
mmh3_hash: "989a807dbf9b4c88ae8340c8647e368e"
summary: "在本地 LLM 上运行 OpenClaw(LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点)"
read_when:
  - 您想从自己的 GPU 机器提供模型
  - 您正在连接 LM Studio 或兼容 OpenAI 的代理
  - 您需要最安全的本地模型指导
title: "本地模型"
---

# 本地模型

本地运行是可行的,但 OpenClaw 需要大上下文 + 强大的防提示注入防御。小卡截断上下文并泄漏安全。目标要高:**≥2 个满配 Mac Studio 或等效 GPU 设备(约 3 万美元以上)**。单个 **24 GB** GPU 仅适用于较轻的提示,延迟较高。使用**您能运行的最大/完整尺寸模型变体**;激进量化或"小型"检查点会增加提示注入风险(参见[安全](/gateway/security))。

如果您想要最简单的本地设置,从 [Ollama](/providers/ollama) 和 `openclaw onboard` 开始。本页是针对高端本地堆栈和自定义 OpenAI 兼容本地服务器的意见指南。

## 推荐:LM Studio + MiniMax M2.5(Responses API,完整尺寸)

当前最佳本地堆栈。在 LM Studio 中加载 MiniMax M2.5,启用本地服务器(默认 `http://127.0.0.1:1234`),并使用 Responses API 将推理与最终文本分开。

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/minimax-m2.5-gs32" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/minimax-m2.5-gs32": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

**设置清单**

- 安装 LM Studio:[https://lmstudio.ai](https://lmstudio.ai)
- 在 LM Studio 中,下载**最大可用的 MiniMax M2.5 构建**(避免"small"/重度量化变体),启动服务器,确认 `http://127.0.0.1:1234/v1/models` 列出它。
- 保持模型加载;冷加载会增加启动延迟。
- 如果您的 LM Studio 构建不同,请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp,坚持使用 Responses API,以便只发送最终文本。

即使运行本地时也保持托管模型配置;使用 `models.mode: "merge"` 以保持备用方案可用。

### 混合配置:托管主模型,本地备用

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-sonnet-4-5",
        fallbacks: ["lmstudio/minimax-m2.5-gs32", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
        "lmstudio/minimax-m2.5-gs32": { alias: "MiniMax Local" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "minimax-m2.5-gs32",
            name: "MiniMax M2.5 GS32",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

### 本地优先,带托管安全网

交换主模型和备用顺序;保持相同的 providers 块和 `models.mode: "merge"`,以便在本地机器宕机时回退到 Sonnet 或 Opus。

### 区域托管/数据路由

- 托管 MiniMax/Kimi/GLM 变体也在 OpenRouter 上以区域固定的端点存在(例如美国托管)。在那里选择区域变体,将流量保留在您选择的司法管辖区内,同时仍然使用 `models.mode: "merge"` 作为 Anthropic/OpenAI 备用。
- 仅本地仍然是最强的隐私路径;当您需要提供商功能但想控制数据流时,托管区域路由是中间地带。

## 其他兼容 OpenAI 的本地代理

vLLM、LiteLLM、OAI-proxy 或自定义网关在它们公开 OpenAI 风格的 `/v1` 端点时都能工作。将上面的 provider 块替换为您的端点和模型 ID:

```json5
{
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 120000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

保持 `models.mode: "merge"` 以使托管模型作为备用保持可用。

## 故障排除

- Gateway 能够访问代理?`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型已卸载?重新加载;冷启动是常见的"挂起"原因。
- 上下文错误?降低 `contextWindow` 或提高服务器限制。
- 安全:本地模型跳过提供商端过滤器;保持 Agent 范围窄,并启用压缩以限制提示注入爆炸半径。
