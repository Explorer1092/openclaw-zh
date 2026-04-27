---
title: "Kilocode"
mmh3_hash: "2de38422ae3efc59b57c77f8719c0216"
summary: "在 OpenClaw 中使用 Kilo Gateway 的统一 API 访问多种模型"
read_when:
  - 您希望用一个 API 密钥访问多种 LLM
  - 您想通过 Kilo Gateway 在 OpenClaw 中运行模型
---

# Kilo Gateway

Kilo Gateway 提供**统一 API**，通过单一端点和 API 密钥将请求路由到多种模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换 Base URL 即可工作。

| 属性     | 值                                 |
| -------- | ---------------------------------- |
| Provider | `kilocode`                         |
| 身份验证 | `KILOCODE_API_KEY`                 |
| API      | OpenAI 兼容                        |
| Base URL | `https://api.kilo.ai/api/gateway/` |

## 快速开始

<Steps>
  <Step title="创建账户">
    前往 [app.kilo.ai](https://app.kilo.ai)，登录或创建账户，然后导航到 API Keys 并生成新密钥。
  </Step>
  <Step title="运行入门">
    ```bash
    openclaw onboard --auth-choice kilocode-api-key
    ```

    或直接设置环境变量：

    ```bash
    export KILOCODE_API_KEY="<your-kilocode-api-key>" # pragma: allowlist secret
    ```

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider kilocode
    ```
  </Step>
</Steps>

## 默认模型

默认模型是 `kilocode/kilo/auto`，这是由 Kilo Gateway 管理的 Provider 自有智能路由模型。

<Note>
OpenClaw 将 `kilocode/kilo/auto` 视为稳定的默认引用，但不发布该路由的任务到上游模型的映射。`kilocode/kilo/auto` 背后的确切上游路由由 Kilo Gateway 拥有，未在 OpenClaw 中硬编码。
</Note>

## 内置目录

OpenClaw 在启动时从 Kilo Gateway 动态发现可用模型。使用 `/models kilocode` 查看您账户可用的完整模型列表。

Gateway 上可用的任何模型都可以使用 `kilocode/` 前缀：

| 模型引用                               | 说明                               |
| -------------------------------------- | ---------------------------------- |
| `kilocode/kilo/auto`                   | 默认 — 智能路由                    |
| `kilocode/anthropic/claude-sonnet-4`   | 通过 Kilo 的 Anthropic             |
| `kilocode/openai/gpt-5.5`              | 通过 Kilo 的 OpenAI                |
| `kilocode/google/gemini-3-pro-preview` | 通过 Kilo 的 Google                |
| ...以及更多                            | 使用 `/models kilocode` 列出所有   |

<Tip>
启动时，OpenClaw 查询 `GET https://api.kilo.ai/api/gateway/models` 并将发现的模型合并到静态回退目录之前。内置回退目录始终包含 `kilocode/kilo/auto`（`Kilo Auto`），具有 `input: ["text", "image"]`、`reasoning: true`、`contextWindow: 1000000` 和 `maxTokens: 128000`。
</Tip>

## 配置示例

```json5
{
  env: { KILOCODE_API_KEY: "<your-kilocode-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "kilocode/kilo/auto" },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="传输和兼容性">
    Kilo Gateway 在源码中记录为与 OpenRouter 兼容，因此它保持代理样式的 OpenAI 兼容路径，而不是原生 OpenAI 请求塑形。

    - Gemini 支持的 Kilo 引用保持在代理 Gemini 路径上，因此 OpenClaw 在那里保持 Gemini 思维签名清理，而不启用原生 Gemini 回放验证或引导重写。
    - Kilo Gateway 在底层使用 Bearer 令牌和您的 API 密钥。

  </Accordion>

  <Accordion title="流包装器和推理">
    Kilo 的共享流包装器为支持的具体模型引用添加 Provider 应用标头并规范化代理推理负载。

    <Warning>
    `kilocode/kilo/auto` 和其他代理推理不支持的提示会跳过推理注入。如果您需要推理支持，请使用具体的模型引用，例如 `kilocode/anthropic/claude-sonnet-4`。
    </Warning>

  </Accordion>

  <Accordion title="故障排除">
    - 如果模型发现在启动时失败，OpenClaw 回退到包含 `kilocode/kilo/auto` 的内置静态目录。
    - 确认您的 API 密钥有效，并且您的 Kilo 账户已启用所需的模型。
    - 当 Gateway 作为守护进程运行时，确保 `KILOCODE_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置参考。
  </Card>
  <Card title="Kilo Gateway" href="https://app.kilo.ai" icon="arrow-up-right-from-square">
    Kilo Gateway 控制台、API 密钥和账户管理。
  </Card>
</CardGroup>
