---
summary: "使用 SGLang（OpenAI 兼容自托管服务器）运行 OpenClaw"
read_when:
  - 您想针对本地 SGLang 服务器运行 OpenClaw
  - 您想使用 OpenAI 兼容的 /v1 端点运行自己的模型
title: "SGLang"
---

SGLang 通过 OpenAI 兼容 HTTP API 提供开源模型服务。OpenClaw 使用 `openai-completions` Provider 系列连接 SGLang，并自动发现可用模型。

| 属性                    | 值                                                           |
| ----------------------- | ------------------------------------------------------------ |
| Provider id             | `sglang`                                                     |
| Plugin                  | 内置，`enabledByDefault: true`                               |
| 认证环境变量            | `SGLANG_API_KEY`（服务器无认证时填任意非空值）               |
| Onboarding flag         | `--auth-choice sglang`                                       |
| API                     | OpenAI 兼容（`openai-completions`）                          |
| 默认 Base URL           | `http://127.0.0.1:30000/v1`                                  |
| 默认模型占位符          | `sglang/Qwen/Qwen3-8B`                                       |
| 流式使用                | 是（`supportsStreamingUsage: true`）                         |
| 定价                    | 标记为外部免费（`modelPricing.external: false`）             |

当您设置了 `SGLANG_API_KEY` 且未定义显式的 `models.providers.sglang` 条目时，OpenClaw 还会**自动发现** SGLang 的可用模型——详见下方[模型发现（隐式 Provider）](#model-discovery-implicit-provider)。

## 快速开始

<Steps>
  <Step title="启动 SGLang">
    使用 OpenAI 兼容服务器启动 SGLang。您的 Base URL 应公开 `/v1` 端点（例如 `/v1/models`、`/v1/chat/completions`）。SGLang 通常运行在：

    - `http://127.0.0.1:30000/v1`

  </Step>
  <Step title="设置 API 密钥">
    如果服务器未配置认证，任何值都有效：

    ```bash
    export SGLANG_API_KEY="sglang-local"
    ```

  </Step>
  <Step title="运行引导程序或直接设置模型">
    ```bash
    openclaw onboard
    ```

    或手动配置模型：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "sglang/your-model-id" },
        },
      },
    }
    ```

  </Step>
</Steps>

## 模型发现（隐式 Provider）

当设置了 `SGLANG_API_KEY`（或存在认证配置文件）且您**未**
定义 `models.providers.sglang` 时，OpenClaw 将查询：

- `GET http://127.0.0.1:30000/v1/models`

并将返回的 ID 转换为模型条目。

<Note>
如果您显式设置 `models.providers.sglang`，则跳过自动发现，
您必须手动定义模型。
</Note>

## 显式配置（手动模型）

在以下情况下使用显式配置：

- SGLang 在不同的主机/端口上运行。
- 您想固定 `contextWindow`/`maxTokens` 值。
- 您的服务器需要真实的 API 密钥（或您想控制请求头）。

```json5
{
  models: {
    providers: {
      sglang: {
        baseUrl: "http://127.0.0.1:30000/v1",
        apiKey: "${SGLANG_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "your-model-id",
            name: "Local SGLang Model",
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

## 高级配置

<AccordionGroup>
  <Accordion title="代理风格行为">
    SGLang 被视为代理风格的 OpenAI 兼容 `/v1` 后端，而非原生 OpenAI 端点。

    | 行为 | SGLang |
    |------|--------|
    | OpenAI 专属请求塑形 | 不适用 |
    | `service_tier`、Responses `store`、提示缓存提示 | 不发送 |
    | 推理兼容负载塑形 | 不适用 |
    | 隐藏归因标头（`originator`、`version`、`User-Agent`） | 不注入到自定义 SGLang Base URL 上 |

  </Accordion>

  <Accordion title="故障排除">
    **服务器不可访问**

    验证服务器是否正在运行并响应：

    ```bash
    curl http://127.0.0.1:30000/v1/models
    ```

    **认证错误**

    如果请求因认证错误而失败，请设置与您的服务器配置匹配的真实 `SGLANG_API_KEY`，或在 `models.providers.sglang` 下显式配置 Provider。

    <Tip>
    如果您在没有认证的情况下运行 SGLang，`SGLANG_API_KEY` 的任何非空值都足以选择加入模型发现。
    </Tip>

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    包含 Provider 条目的完整配置 Schema。
  </Card>
</CardGroup>
