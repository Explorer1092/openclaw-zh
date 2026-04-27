---
mmh3_hash: "ff319bf8ee1003960ca83a7dcc899bf5"
summary: "在本地 LLM 上运行 OpenClaw(LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点)"
read_when:
  - 您想从自己的 GPU 机器提供模型
  - 您正在连接 LM Studio 或兼容 OpenAI 的代理
  - 您需要最安全的本地模型指导
title: "本地模型"
---

# 本地模型

本地运行是可行的,但 OpenClaw 需要大上下文 + 强大的防提示注入防御。小卡截断上下文并泄漏安全。目标要高:**≥2 个满配 Mac Studio 或等效 GPU 设备(约 3 万美元以上)**。单个 **24 GB** GPU 仅适用于较轻的提示,延迟较高。使用**您能运行的最大/完整尺寸模型变体**;激进量化或"小型"检查点会增加提示注入风险(参见[安全](/gateway/security))。

如果您想要最简单的本地设置,从 [LM Studio](/providers/lmstudio) 或 [Ollama](/providers/ollama) 和 `openclaw onboard` 开始。本页是针对高端本地堆栈和自定义 OpenAI 兼容本地服务器的意见指南。

## 推荐:LM Studio + 大型本地模型(Responses API)

当前最佳本地堆栈。在 LM Studio 中加载大型模型(例如完整尺寸的 Qwen、DeepSeek 或 Llama 构建),启用本地服务器(默认 `http://127.0.0.1:1234`),并使用 Responses API 将推理与最终文本分开。

```json5
{
  agents: {
    defaults: {
      model: { primary: "lmstudio/my-local-model" },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "lmstudio/my-local-model": { alias: "Local" },
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
            id: "my-local-model",
            name: "Local Model",
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
- 在 LM Studio 中,下载**最大可用的模型构建**(避免"small"/重度量化变体),启动服务器,确认 `http://127.0.0.1:1234/v1/models` 列出它。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
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
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["lmstudio/my-local-model", "anthropic/claude-opus-4-6"],
      },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "lmstudio/my-local-model": { alias: "Local" },
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
            id: "my-local-model",
            name: "Local Model",
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
对慢速本地或远程模型服务器，在提高 `agents.defaults.timeoutSeconds` 之前，先使用 `models.providers.<id>.timeoutSeconds`。该 provider timeout 仅适用于模型 HTTP 请求，包括连接、头部、正文流以及全程 guarded-fetch abort。

本地/代理 `/v1` 后端的行为说明:

- OpenClaw 将这些视为代理风格的 OpenAI 兼容路由,而不是原生 OpenAI 端点
- 原生 OpenAI 专用请求形状不适用于此:无 `service_tier`,无 Responses `store`,无 OpenAI 推理兼容负载形状,以及无提示缓存提示
- 隐藏的 OpenClaw 归因头(`originator`、`version`、`User-Agent`)不注入到这些自定义代理 URL 上

兼容性说明(针对较严格的 OpenAI 兼容后端):

- 某些服务器在 Chat Completions 上只接受字符串 `messages[].content`,而不是结构化内容部分数组。对于这些端点,设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 某些本地模型将独立括号内的工具请求作为文本输出，例如 `[tool_name]` 后跟 JSON 和 `[END_TOOL_REQUEST]`。OpenClaw 仅在名称与该轮次已注册工具完全匹配时，才将其提升为真正的工具调用；否则该块被视为不支持的文本，并从用户可见的回复中隐藏。
- 如果模型输出了 JSON、XML 或 ReAct 风格的文本，看起来像工具调用，但 provider 未发出结构化调用，OpenClaw 将其留作文本并记录带有 run id、provider/model、检测到的模式及工具名称（如可用）的警告。将其视为 provider/model 工具调用不兼容，而非已完成的工具运行。
- 如果工具以助手文本形式出现而未运行（例如原始 JSON、XML、ReAct 语法，或 provider 响应中的空 `tool_calls` 数组），请先确认服务器使用了具有工具调用能力的 chat template/parser。对于 Chat Completions 后端，若其 parser 仅在强制工具使用时才生效，请设置每模型请求覆盖，而非依赖文本解析：

  ```json5
  {
    agents: {
      defaults: {
        models: {
          "local/my-local-model": {
            params: {
              extra_body: {
                tool_choice: "required",
              },
            },
          },
        },
      },
    },
  }
  ```

  仅在每个正常轮次都应调用工具的模型/Session 中使用此设置。它会覆盖 OpenClaw 对代理的默认值 `tool_choice: "auto"`。将 `local/my-local-model` 替换为 `openclaw models list` 显示的精确 provider/model ref。

  ```bash
  openclaw config set agents.defaults.models '{"local/my-local-model":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
  ```

- 某些较小或较严格的本地后端在 OpenClaw 的完整 Agent 运行时提示形状下不稳定,尤其是当包含工具 schema 时。如果后端对小型直接 `/v1/chat/completions` 调用有效,但在正常 OpenClaw Agent 轮次上失败,请先尝试 `agents.defaults.experimental.localModelLean: true` 以去除重量级默认工具（如 `browser`、`cron` 和 `message`）；这是一个实验性标志,不是稳定的默认模式设置。请参阅[实验性功能](/concepts/experimental-features)。如果仍然失败,请尝试 `models.providers.<provider>.models[].compat.supportsTools: false`。
- 如果后端仅在较大的 OpenClaw 运行上仍然失败,剩余问题通常是上游模型/服务器容量或后端 bug,而不是 OpenClaw 的传输层。

## 故障排除

- Gateway 能够访问代理?`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型已卸载?重新加载;冷启动是常见的"挂起"原因。
- 本地服务器提示 `terminated`、`ECONNRESET` 或在轮次中途关闭流？OpenClaw 会记录低基数 `model.call.error.failureKind` 以及 OpenClaw 进程 RSS/heap 快照到诊断。对于 LM Studio/Ollama 内存压力，将该时间戳与服务器日志或 macOS crash/jetsam 日志对比，确认模型服务器是否被杀死。
- OpenClaw 在检测到上下文窗口低于 **32k** 时发出警告,低于 **16k** 时阻止。如果触发此预检,请提高服务器/模型上下文限制或选择更大的模型。
- 上下文错误?降低 `contextWindow` 或提高服务器限制。
- OpenAI 兼容服务器返回 `messages[].content ... expected a string`?在该模型条目上添加 `compat.requiresStringContent: true`。
- 直接小型 `/v1/chat/completions` 调用有效,但 `openclaw infer model run` 在 Gemma 或其他本地模型上失败?先用 `compat.supportsTools: false` 禁用工具 schema,然后重新测试。如果服务器仍然只在较大的 OpenClaw 提示上崩溃,将其视为上游服务器/模型限制。
- 工具调用以原始 JSON/XML/ReAct 文本形式出现，或 provider 返回空 `tool_calls` 数组？不要添加将助手文本盲目转换为工具执行的代理。先修复服务器 chat template/parser。如果模型只有在强制工具使用时才有效，添加上述每模型 `params.extra_body.tool_choice: "required"` 覆盖，并仅对每轮次都期望工具调用的 Session 使用该模型条目。
- 安全:本地模型跳过提供商端过滤器;保持 Agent 范围窄,并启用压缩以限制提示注入爆炸半径。

## 相关

- [配置参考](/gateway/configuration-reference)
- [模型故障转移](/concepts/model-failover)
