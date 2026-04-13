---
mmh3_hash: "82191ac11c198e40bf07aa6a06397558"
title: "Vercel AI Gateway"
sidebarTitle: "Vercel AI Gateway"
summary: "Vercel AI Gateway 设置（身份验证 + 模型选择）"
read_when:
  - 您想将 Vercel AI Gateway 与 OpenClaw 一起使用
  - 您需要 API 密钥环境变量或 CLI 身份验证选项
---

# Vercel AI Gateway

[Vercel AI Gateway](https://vercel.com/ai-gateway) 提供统一的 API，通过单个端点访问数百个模型。

| 属性         | 值                               |
| ------------- | -------------------------------- |
| Provider      | `vercel-ai-gateway`              |
| 身份验证      | `AI_GATEWAY_API_KEY`             |
| API           | Anthropic Messages 兼容          |
| 模型目录      | 通过 `/v1/models` 自动发现       |

<Tip>
OpenClaw 自动发现 Gateway `/v1/models` 目录，因此
`/models vercel-ai-gateway` 包含当前模型引用，如
`vercel-ai-gateway/openai/gpt-5.4`。
</Tip>

## 快速开始

<Steps>
  <Step title="设置 API 密钥">
    运行入门并选择 AI Gateway 身份验证选项：

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="设置默认模型">
    将模型添加到您的 OpenClaw 配置中：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## 非交互式示例

对于脚本或 CI 设置，在命令行上传递所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## 模型 ID 简写

OpenClaw 接受 Vercel Claude 简写模型引用，并在运行时将其标准化：

| 简写输入                                | 标准化模型引用                                |
| --------------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6`     | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`            | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
您可以在配置中使用简写或完全限定的模型引用。OpenClaw 会自动解析规范形式。
</Tip>

## 高级说明

<AccordionGroup>
  <Accordion title="守护进程的环境变量">
    如果 OpenClaw Gateway 作为守护进程（launchd/systemd）运行，请确保 `AI_GATEWAY_API_KEY` 对该进程可用。

    <Warning>
    仅在 `~/.profile` 中设置的密钥不会对 launchd/systemd 守护进程可见，除非明确导入该环境。请在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 设置密钥，以确保 Gateway 进程可以读取它。
    </Warning>

  </Accordion>

  <Accordion title="Provider 路由">
    Vercel AI Gateway 根据模型引用前缀将请求路由到上游 Provider。例如，`vercel-ai-gateway/anthropic/claude-opus-4.6` 通过 Anthropic 路由，而 `vercel-ai-gateway/openai/gpt-5.4` 通过 OpenAI 路由。您的单个 `AI_GATEWAY_API_KEY` 处理所有上游 Provider 的身份验证。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常规故障排除和 FAQ。
  </Card>
</CardGroup>
