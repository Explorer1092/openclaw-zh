---
mmh3_hash: "151b389ee1f6a2ff3195eb4edbbbb909"
summary: "在本地 LLM 上运行 OpenClaw(LM Studio、vLLM、LiteLLM、自定义 OpenAI 端点)"
read_when:
  - 您想从自己的 GPU 机器提供模型
  - 您正在连接 LM Studio 或兼容 OpenAI 的代理
  - 您需要最安全的本地模型指导
title: "Local models"
---

本地模型是可行的。但它们也对硬件、上下文大小和防提示注入防御提出了更高的要求——小型或激进量化的模型会截断上下文并泄漏安全防护。本页是针对高端本地堆栈和自定义 OpenAI 兼容本地服务器的意见指南。如需最简单的本地设置，请从 [LM Studio](/providers/lmstudio) 或 [Ollama](/providers/ollama) 和 `openclaw onboard` 开始。

如需仅在所选模型需要时才启动的本地服务器，请参见 [Local model services](/gateway/local-model-services)。

## 硬件底线

目标要高：**≥2 台最高配置的 Mac Studios 或同等 GPU 设备（约 30,000 美元以上）** 可获得舒适的 Agent 循环体验。单张 **24 GB** GPU 只适合较轻量的 prompt，且延迟较高。始终运行**您能托管的最大/完整尺寸变体**；小型或重度量化的检查点会增加提示注入风险（参见 [安全](/gateway/security)）。

## 选择后端

| 后端                                                   | 适用场景                                                                |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| [ds4](/providers/ds4)                                  | 在 macOS Metal 上本地运行 DeepSeek V4 Flash，支持 OpenAI 兼容工具调用  |
| [LM Studio](/providers/lmstudio)                       | 首次本地设置、GUI 加载器、原生 Responses API                            |
| LiteLLM / OAI-proxy / 自定义 OpenAI 兼容代理           | 您在另一个模型 API 前面做代理，希望 OpenClaw 将其视为 OpenAI            |
| MLX / vLLM / SGLang                                    | 高吞吐量自托管服务，带 OpenAI 兼容 HTTP 端点                            |
| [Ollama](/providers/ollama)                            | CLI 工作流、模型库、免手动 systemd 服务                                 |

当后端支持时使用 Responses API（`api: "openai-responses"`）（LM Studio 支持）。否则使用 Chat Completions（`api: "openai-completions"`）。

<Warning>
**WSL2 + Ollama + NVIDIA/CUDA 用户：** 官方 Ollama Linux 安装程序会启用带 `Restart=always` 的 systemd 服务。在 WSL2 GPU 设置中，自动启动可能在启动时重新加载最后的模型并固定主机内存。如果您的 WSL2 VM 在启用 Ollama 后反复重启，请参见 [WSL2 崩溃循环](/providers/ollama#wsl2-crash-loop-repeated-reboots)。
</Warning>

## 推荐：LM Studio + 大型本地模型（Responses API）

当前最佳本地堆栈。在 LM Studio 中加载大型模型（例如完整尺寸的 Qwen、DeepSeek 或 Llama 构建），启用本地服务器（默认 `http://127.0.0.1:1234`），并使用 Responses API 将推理与最终文本分开。

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

- 安装 LM Studio：[https://lmstudio.ai](https://lmstudio.ai)
- 在 LM Studio 中，下载**最大可用的模型构建**（避免"small"/重度量化变体），启动服务器，确认 `http://127.0.0.1:1234/v1/models` 列出它。
- 将 `my-local-model` 替换为 LM Studio 中显示的实际模型 ID。
- 保持模型加载；冷加载会增加启动延迟。
- 如果您的 LM Studio 构建不同，请调整 `contextWindow`/`maxTokens`。
- 对于 WhatsApp，坚持使用 Responses API，以便只发送最终文本。

即使运行本地时也保持托管模型配置；使用 `models.mode: "merge"` 以保持备用方案可用。

### 混合配置：托管主模型，本地备用

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

### 本地优先，带托管安全网

交换主模型和备用顺序；保持相同的 providers 块和 `models.mode: "merge"`，以便在本地机器宕机时回退到 Sonnet 或 Opus。

### 区域托管/数据路由

- 托管 MiniMax/Kimi/GLM 变体也在 OpenRouter 上以区域固定的端点存在（例如美国托管）。在那里选择区域变体，将流量保留在您选择的司法管辖区内，同时仍然使用 `models.mode: "merge"` 作为 Anthropic/OpenAI 备用。
- 仅本地仍然是最强的隐私路径；当您需要提供商功能但想控制数据流时，托管区域路由是中间地带。

## 其他兼容 OpenAI 的本地代理

MLX（`mlx_lm.server`）、vLLM、SGLang、LiteLLM、OAI-proxy 或自定义网关在暴露 OpenAI 风格的 `/v1/chat/completions` 端点时都能工作。除非后端明确记录支持 `/v1/responses`，否则使用 Chat Completions 适配器。将上面的 provider 块替换为您的端点和模型 ID：

```json5
{
  agents: {
    defaults: {
      model: { primary: "local/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      local: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "sk-local",
        api: "openai-completions",
        timeoutSeconds: 300,
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

如果自定义 provider 有 `baseUrl` 且省略了 `api`，OpenClaw 默认使用 `openai-completions`。自定义/本地 provider 条目对受保护的模型请求信任其精确配置的 `baseUrl` 来源，包括回环、LAN、tailnet 和私有 DNS 主机。对其他私有来源的请求仍需要 `request.allowPrivateNetwork: true`；元数据/链路本地来源在没有明确选择加入的情况下仍被阻止。设置为 `false` 可选择退出精确来源信任。

`models.providers.<id>.models[].id` 值是 Provider 本地的。不要在其中包含 provider 前缀。例如，使用 `mlx_lm.server --model mlx-community/Qwen3-30B-A3B-6bit` 启动的 MLX 服务器应使用此目录 id 和模型引用：

- `models.providers.mlx.models[].id: "mlx-community/Qwen3-30B-A3B-6bit"`
- `agents.defaults.model.primary: "mlx/mlx-community/Qwen3-30B-A3B-6bit"`

在本地或代理视觉模型上设置 `input: ["text", "image"]`，以便将图像附件注入 Agent 轮次。交互式自定义 Provider 引导推断常见的视觉模型 ID，只询问未知名称。非交互式引导使用相同的推断；对未知视觉 ID 使用 `--custom-image-input`，或者当已知看起来像的模型在您的端点后面是纯文本时使用 `--custom-text-input`。

保持 `models.mode: "merge"` 以使托管模型作为备用保持可用。在提高 `agents.defaults.timeoutSeconds` 之前，先对慢速本地或远程模型服务器使用 `models.providers.<id>.timeoutSeconds`。Provider timeout 仅适用于模型 HTTP 请求，包括连接、头部、正文流和全程 guarded-fetch abort。如果 Agent 或运行 timeout 更低，也要提高该上限，因为 Provider timeout 无法延伸整个 Agent 运行。

<Note>
对于自定义 OpenAI 兼容 Provider，当 `baseUrl` 解析到回环、私有 LAN、`.local` 或裸主机名时，持久化非密钥本地标记（如 `apiKey: "ollama-local"`）是可以接受的。OpenClaw 将其视为有效的本地凭证，而非报告密钥缺失。对接受公共主机名的任何 Provider 请使用真实值。
</Note>

本地/代理 `/v1` 后端的行为说明：

- OpenClaw 将这些视为代理风格的 OpenAI 兼容路由，而不是原生 OpenAI 端点
- 原生 OpenAI 专用请求形状不适用于此：无 `service_tier`，无 Responses `store`，无 OpenAI 推理兼容负载形状，以及无 prompt 缓存提示
- 隐藏的 OpenClaw 归因头（`originator`、`version`、`User-Agent`）不注入到这些自定义代理 URL 上

兼容性说明（针对较严格的 OpenAI 兼容后端）：

- 某些服务器在 Chat Completions 上只接受字符串 `messages[].content`，而不是结构化内容部分数组。对于这些端点，设置 `models.providers.<provider>.models[].compat.requiresStringContent: true`。
- 某些本地模型将独立括号内的工具请求作为文本输出，例如 `[tool_name]` 后跟 JSON 和 `[END_TOOL_REQUEST]`。OpenClaw 仅在名称与该轮次已注册工具完全匹配时，才将其提升为真正的工具调用；否则该块被视为不支持的文本，并从用户可见的回复中隐藏。
- 如果模型输出了 JSON、XML 或 ReAct 风格的文本，看起来像工具调用，但 Provider 未发出结构化调用，OpenClaw 将其留作文本并记录带有 run id、provider/model、检测到的模式及工具名称（如可用）的警告。将其视为 provider/model 工具调用不兼容，而非已完成的工具运行。
- 如果工具以助手文本形式出现而未运行（例如原始 JSON、XML、ReAct 语法，或 provider 响应中的空 `tool_calls` 数组），请先确认服务器使用了具有工具调用能力的 chat template/parser。对于 OpenAI 兼容 Chat Completions 后端，若其 parser 仅在强制工具使用时才生效，请设置每模型请求覆盖，而非依赖文本解析：

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

- 如果自定义 OpenAI 兼容模型接受超出内置配置文件的 OpenAI 推理 effort，请在模型 compat 块上声明它们。在此处添加 `"xhigh"` 可使 `/think xhigh`、Session 选择器、Gateway 验证和 `llm-task` 验证为该已配置 provider/model ref 公开该级别：

  ```json5
  {
    models: {
      providers: {
        local: {
          baseUrl: "http://127.0.0.1:8000/v1",
          apiKey: "sk-local",
          api: "openai-responses",
          models: [
            {
              id: "gpt-5.4",
              name: "GPT 5.4 via local proxy",
              reasoning: true,
              input: ["text"],
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
              contextWindow: 196608,
              maxTokens: 8192,
              compat: {
                supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
                reasoningEffortMap: { xhigh: "xhigh" },
              },
            },
          ],
        },
      },
    },
  }
  ```

## 较小或较严格的后端

如果模型加载正常但完整的 Agent 轮次出现异常，请从上到下排查——先确认传输，再缩小范围。

1. **确认本地模型本身响应。** 无工具，无 Agent 上下文：

   ```bash
   openclaw infer model run --local --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

2. **确认 Gateway 路由。** 仅发送提供的 prompt——跳过转录、AGENTS 引导、上下文引擎组装、工具和捆绑的 MCP 服务器，但仍测试 Gateway 路由、认证和 Provider 选择：

   ```bash
   openclaw infer model run --gateway --model <provider/model> --prompt "Reply with exactly: pong" --json
   ```

3. **尝试精简模式。** 如果两个探测都通过，但真实 Agent 轮次因格式错误的工具调用或超大 prompt 失败，启用 `agents.defaults.experimental.localModelLean: true`。它会删除三个最重的默认工具（`browser`、`cron`、`message`），使 prompt 形状更小且更不脆弱。参见[实验性功能 → 本地模型精简模式](/concepts/experimental-features#local-model-lean-mode)了解完整说明、何时使用以及如何确认已启用。

4. **作为最后手段完全禁用工具。** 如果精简模式不够，对该模型条目设置 `models.providers.<provider>.models[].compat.supportsTools: false`。Agent 将在该模型上不使用工具调用运行。

5. **超过这个点，瓶颈在上游。** 如果后端在精简模式和 `supportsTools: false` 后仍仅在较大的 OpenClaw 运行上失败，剩余问题通常是上游模型或服务器容量——上下文窗口、GPU 内存、kv-cache 驱逐或后端 bug。此时不是 OpenClaw 的传输层问题。

## 故障排除

- Gateway 能够访问代理？`curl http://127.0.0.1:1234/v1/models`。
- LM Studio 模型已卸载？重新加载；冷启动是常见的"挂起"原因。
- 本地服务器提示 `terminated`、`ECONNRESET` 或在轮次中途关闭流？OpenClaw 会记录低基数 `model.call.error.failureKind` 以及 OpenClaw 进程 RSS/heap 快照到诊断。对于 LM Studio/Ollama 内存压力，将该时间戳与服务器日志或 macOS crash/jetsam 日志对比，确认模型服务器是否被杀死。
- OpenClaw 根据检测到的模型窗口推导上下文窗口预检阈值，或在 `agents.defaults.contextTokens` 降低有效窗口时使用未限制的模型窗口。低于 20% 时以 **8k** 下限发出警告。硬阻塞使用 10% 阈值，**4k** 下限，上限为有效上下文窗口，以避免超大模型元数据拒绝否则有效的用户限制。如果触发该预检，请提高服务器/模型上下文限制或选择更大的模型。
- 上下文错误？降低 `contextWindow` 或提高服务器限制。
- OpenAI 兼容服务器返回 `messages[].content ... expected a string`？在该模型条目上添加 `compat.requiresStringContent: true`。
- OpenAI 兼容服务器返回 `validation.keys` 或说消息条目只允许 `role` 和 `content`？在该模型条目上添加 `compat.strictMessageKeys: true`。
- 直接小型 `/v1/chat/completions` 调用有效，但 `openclaw infer model run --local` 在 Gemma 或其他本地模型上失败？先检查 Provider URL、模型引用、认证标记和服务器日志；本地 `model run` 不包含 Agent 工具。如果本地 `model run` 成功但较大的 Agent 轮次失败，使用 `localModelLean` 或 `compat.supportsTools: false` 减少 Agent 工具表面。
- 工具调用以原始 JSON/XML/ReAct 文本形式出现，或 Provider 返回空 `tool_calls` 数组？不要添加将助手文本盲目转换为工具执行的代理。先修复服务器 chat template/parser。如果模型只有在强制工具使用时才有效，添加上述每模型 `params.extra_body.tool_choice: "required"` 覆盖，并仅对每轮次都期望工具调用的 Session 使用该模型条目。
- 安全：本地模型跳过提供商端过滤器；保持 Agent 范围窄，并启用压缩以限制提示注入爆炸半径。

## 相关

- [配置参考](/gateway/configuration-reference)
- [模型故障转移](/concepts/model-failover)
