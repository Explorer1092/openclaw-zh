---
mmh3_hash: "7c26a214e944ef23655a72c0bb2aac27"
summary: "使用 vLLM 运行 OpenClaw（OpenAI 兼容的本地服务器）"
read_when:
  - 您想要针对本地 vLLM 服务器运行 OpenClaw
  - 您想要使用自己的模型的 OpenAI 兼容 /v1 端点
title: "vLLM"
---

vLLM 可以通过 **OpenAI 兼容**的 HTTP API 提供开源（和一些自定义）模型。OpenClaw 可以使用 `openai-completions` API 连接到 vLLM。

OpenClaw 还可以在您使用 `VLLM_API_KEY`（如果您的服务器不强制身份验证，任何值都可以）选择加入并且您没有定义显式的 `models.providers.vllm` 条目时，从 vLLM **自动发现**可用模型。

OpenClaw 将 `vllm` 视为支持流式使用计费的本地 OpenAI 兼容 Provider，因此状态/上下文 Token 计数可以从 `stream_options.include_usage` 响应中更新。

| 属性             | 值                                       |
| ---------------- | ---------------------------------------- |
| Provider ID      | `vllm`                                   |
| API              | `openai-completions`（OpenAI 兼容）      |
| 身份验证         | `VLLM_API_KEY` 环境变量                  |
| 默认 Base URL    | `http://127.0.0.1:8000/v1`               |

## 快速开始

<Steps>
  <Step title="使用 OpenAI 兼容服务器启动 vLLM">
    您的 Base URL 应该暴露 `/v1` 端点（例如 `/v1/models`、`/v1/chat/completions`）。vLLM 通常运行在：

    ```
    http://127.0.0.1:8000/v1
    ```

  </Step>
  <Step title="设置 API 密钥环境变量">
    如果您的服务器不强制身份验证，任何值都可以：

    ```bash
    export VLLM_API_KEY="vllm-local"
    ```

  </Step>
  <Step title="选择模型">
    替换为您的 vLLM 模型 ID 之一：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vllm/your-model-id" },
        },
      },
    }
    ```

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider vllm
    ```
  </Step>
</Steps>

## 模型发现（隐式 Provider）

当设置 `VLLM_API_KEY`（或存在身份验证配置文件）并且您**没有**定义 `models.providers.vllm` 时，OpenClaw 将查询：

```
GET http://127.0.0.1:8000/v1/models
```

并将返回的 ID 转换为模型条目。

<Note>
如果您显式设置 `models.providers.vllm`，则跳过自动发现，您必须手动定义模型。
</Note>

## 显式配置（手动模型）

在以下情况下使用显式配置：

- vLLM 运行在不同的主机或端口上
- 您想要固定 `contextWindow` 或 `maxTokens` 值
- 您的服务器需要真实的 API 密钥（或您想要控制标头）
- 您连接到受信任的回环、LAN 或 Tailscale vLLM 端点

```json5
{
  models: {
    providers: {
      vllm: {
        baseUrl: "http://127.0.0.1:8000/v1",
        apiKey: "${VLLM_API_KEY}",
        api: "openai-completions",
        request: { allowPrivateNetwork: true },
        timeoutSeconds: 300, // 可选：为慢速本地模型延长连接/标头/正文/请求超时
        models: [
          {
            id: "your-model-id",
            name: "Local vLLM Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 高级说明

<AccordionGroup>
  <Accordion title="代理风格行为">
    vLLM 被视为代理风格的 OpenAI 兼容 `/v1` 后端，而非原生 OpenAI 端点。这意味着：

    | 行为 | 是否应用 |
    |----------|----------|
    | 原生 OpenAI 请求塑形 | 否 |
    | `service_tier` | 不发送 |
    | Responses `store` | 不发送 |
    | 提示缓存提示 | 不发送 |
    | OpenAI 推理兼容负载塑形 | 不适用 |
    | 隐藏 OpenClaw 归因标头 | 不注入到自定义 Base URL 上 |

  </Accordion>

  <Accordion title="Qwen 思维控制">
    对于通过 vLLM 提供服务的 Qwen 模型，当服务器需要 Qwen chat-template kwargs 时，请在模型条目上设置
    `params.qwenThinkingFormat: "chat-template"`。OpenClaw 将 `/think off` 映射为：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "preserve_thinking": true
      }
    }
    ```

    非 `off` 的思维级别发送 `enable_thinking: true`。如果您的端点需要 DashScope 风格的顶层标志，
    请使用 `params.qwenThinkingFormat: "top-level"` 在请求根发送 `enable_thinking`。
    也接受蛇形命名的 `params.qwen_thinking_format`。

  </Accordion>

  <Accordion title="Nemotron 3 思维控制">
    vLLM/Nemotron 3 可以使用 chat-template kwargs 控制推理是作为隐藏的推理内容还是可见的答案文本返回。当 OpenClaw Session 使用 `vllm/nemotron-3-*` 且思维关闭时，OpenClaw 会发送：

    ```json
    {
      "chat_template_kwargs": {
        "enable_thinking": false,
        "force_nonempty_content": true
      }
    }
    ```

    要自定义这些值，请在模型参数下设置 `chat_template_kwargs`。如果您同时设置了 `params.extra_body.chat_template_kwargs`，该值具有最终优先级，因为 `extra_body` 是最后的请求体覆盖。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/nemotron-3-super": {
              params: {
                chat_template_kwargs: {
                  enable_thinking: false,
                  force_nonempty_content: true,
                },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Qwen 工具调用显示为文本">
    首先确保 vLLM 以正确的工具调用解析器和模型对应的聊天模板启动。例如，vLLM 文档为 Qwen2.5 模型推荐 `hermes`，为 Qwen3-Coder 模型推荐 `qwen3_xml`。

    症状：

    - 技能或工具从不运行
    - 助手打印原始 JSON/XML，例如 `{"name":"read","arguments":...}`
    - 当 OpenClaw 发送 `tool_choice: "auto"` 时，vLLM 返回空的 `tool_calls` 数组

    某些 Qwen/vLLM 组合仅在请求使用 `tool_choice: "required"` 时才返回结构化工具调用。对于这些模型条目，使用 `params.extra_body` 强制 OpenAI 兼容请求字段：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "vllm/Qwen-Qwen2.5-Coder-32B-Instruct": {
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

    将 `Qwen-Qwen2.5-Coder-32B-Instruct` 替换为以下命令返回的确切 id：

    ```bash
    openclaw models list --provider vllm
    ```

    您也可以从 CLI 应用相同的覆盖：

    ```bash
    openclaw config set agents.defaults.models '{"vllm/Qwen-Qwen2.5-Coder-32B-Instruct":{"params":{"extra_body":{"tool_choice":"required"}}}}' --strict-json --merge
    ```

    这是一个选择加入的兼容性变通方案。它使每个带有工具的模型轮次都需要工具调用，因此仅对专用本地模型条目使用它（该行为可接受的情况下）。不要将其用作所有 vLLM 模型的全局默认值，也不要使用盲目将任意助手文本转换为可执行工具调用的代理。

  </Accordion>

  <Accordion title="自定义 Base URL">
    如果您的 vLLM 服务器运行在非默认主机或端口上，请在显式 Provider 配置中设置 `baseUrl`：

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:9000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [
              {
                id: "my-custom-model",
                name: "Remote vLLM Model",
                reasoning: false,
                input: ["text"],
                contextWindow: 64000,
                maxTokens: 4096,
              },
            ],
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="首次响应缓慢或远程服务器超时">
    对于大型本地模型、远程 LAN 主机或 tailnet 链接，请设置 Provider 范围的请求超时：

    ```json5
    {
      models: {
        providers: {
          vllm: {
            baseUrl: "http://192.168.1.50:8000/v1",
            apiKey: "${VLLM_API_KEY}",
            api: "openai-completions",
            request: { allowPrivateNetwork: true },
            timeoutSeconds: 300,
            models: [{ id: "your-model-id", name: "Local vLLM Model" }],
          },
        },
      },
    }
    ```

    `timeoutSeconds` 仅适用于 vLLM 模型 HTTP 请求，包括连接建立、响应标头、正文流和总体受保护的 fetch 中止。在增加 `agents.defaults.timeoutSeconds`（控制整个 Agent 运行）之前，优先使用此选项。

  </Accordion>

  <Accordion title="服务器不可访问">
    检查 vLLM 服务器是否正在运行并可访问：

    ```bash
    curl http://127.0.0.1:8000/v1/models
    ```

    如果看到连接错误，请验证主机、端口以及 vLLM 是否以 OpenAI 兼容服务器模式启动。对于显式回环、LAN 或 Tailscale 端点，还需设置 `models.providers.vllm.request.allowPrivateNetwork: true`；除非 Provider 被明确信任，否则 Provider 请求默认阻止私有网络 URL。

  </Accordion>

  <Accordion title="请求身份验证错误">
    如果请求因身份验证错误而失败，请设置与您的服务器配置匹配的真实 `VLLM_API_KEY`，或在 `models.providers.vllm` 下显式配置 Provider。

    <Tip>
    如果您的 vLLM 服务器不强制身份验证，`VLLM_API_KEY` 的任何非空值都可以作为 OpenClaw 的选择加入信号。
    </Tip>

  </Accordion>

  <Accordion title="未发现任何模型">
    自动发现需要设置 `VLLM_API_KEY` **且**没有显式的 `models.providers.vllm` 配置条目。如果您手动定义了 Provider，OpenClaw 会跳过发现，仅使用您声明的模型。
  </Accordion>

  <Accordion title="工具显示为原始文本">
    如果 Qwen 模型打印 JSON/XML 工具语法而不是执行技能，请查看上方高级配置中的 Qwen 指南。通常的修复方法是：

    - 以正确的解析器/模板启动 vLLM
    - 使用 `openclaw models list --provider vllm` 确认确切的模型 id
    - 仅在 `tool_choice: "auto"` 仍返回空或纯文本工具调用时，添加专用的每模型 `params.extra_body.tool_choice: "required"` 覆盖

  </Accordion>
</AccordionGroup>

<Warning>
更多帮助：[故障排除](/help/troubleshooting)和 [FAQ](/help/faq)。
</Warning>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="OpenAI" href="/providers/openai" icon="bolt">
    原生 OpenAI Provider 和 OpenAI 兼容路由行为。
  </Card>
  <Card title="OAuth 和身份验证" href="/gateway/authentication" icon="key">
    身份验证详情和凭据重用规则。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常见问题及解决方法。
  </Card>
</CardGroup>
