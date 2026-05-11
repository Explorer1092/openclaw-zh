---
mmh3_hash: "c657474f2661f2bd8878f5416a29511a"
summary: "使用 Qianfan 的统一 API 在 OpenClaw 中访问许多模型"
read_when:
  - 您想要单个 API 密钥用于许多 LLM
  - 您需要百度千帆设置指导
title: "Qianfan"
---

Qianfan 是百度的 MaaS 平台，提供**统一的 API**，将请求路由到单个端点和 API 密钥后面的许多模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 通过切换 Base URL 即可工作。

| 属性     | 值                                |
| -------- | --------------------------------- |
| Provider | `qianfan`                         |
| 身份验证 | `QIANFAN_API_KEY`                 |
| API      | OpenAI 兼容                       |
| Base URL | `https://qianfan.baidubce.com/v2` |

## 快速开始

<Steps>
  <Step title="创建百度云账户">
    在 [Qianfan 控制台](https://console.bce.baidu.com/qianfan/ais/console/apiKey)注册或登录，并确保已启用 Qianfan API 访问权限。
  </Step>
  <Step title="生成 API 密钥">
    创建新应用程序或选择现有应用程序，然后生成 API 密钥。密钥格式为 `bce-v3/ALTAK-...`。
  </Step>
  <Step title="运行入门">
    ```bash
    openclaw onboard --auth-choice qianfan-api-key
    ```
  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider qianfan
    ```
  </Step>
</Steps>

## 内置目录

| 模型引用                             | 输入        | 上下文  | 最大输出 | 推理  | 说明         |
| ------------------------------------ | ----------- | ------- | -------- | ----- | ------------ |
| `qianfan/deepseek-v3.2`              | text        | 98,304  | 32,768   | 是    | 默认模型     |
| `qianfan/ernie-5.0-thinking-preview` | text, image | 119,000 | 64,000   | 是    | 多模态       |

<Tip>
默认内置模型引用为 `qianfan/deepseek-v3.2`。仅在需要自定义 Base URL 或模型元数据时才需要覆盖 `models.providers.qianfan`。
</Tip>

## 配置示例

```json5
{
  env: { QIANFAN_API_KEY: "bce-v3/ALTAK-..." },
  agents: {
    defaults: {
      model: { primary: "qianfan/deepseek-v3.2" },
      models: {
        "qianfan/deepseek-v3.2": { alias: "QIANFAN" },
      },
    },
  },
  models: {
    providers: {
      qianfan: {
        baseUrl: "https://qianfan.baidubce.com/v2",
        api: "openai-completions",
        models: [
          {
            id: "deepseek-v3.2",
            name: "DEEPSEEK V3.2",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 98304,
            maxTokens: 32768,
          },
          {
            id: "ernie-5.0-thinking-preview",
            name: "ERNIE-5.0-Thinking-Preview",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 119000,
            maxTokens: 64000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="传输和兼容性">
    Qianfan 通过 OpenAI 兼容传输路径运行，而非原生 OpenAI 请求塑形。这意味着标准 OpenAI SDK 功能可用，但 Provider 特定参数可能不会被转发。
  </Accordion>

  <Accordion title="目录和覆盖">
    内置目录目前包含 `deepseek-v3.2` 和 `ernie-5.0-thinking-preview`。仅在需要自定义 Base URL 或模型元数据时才需要添加或覆盖 `models.providers.qianfan`。

    <Note>
    模型引用使用 `qianfan/` 前缀（例如 `qianfan/deepseek-v3.2`）。
    </Note>

  </Accordion>

  <Accordion title="故障排除">
    - 确保您的 API 密钥以 `bce-v3/ALTAK-` 开头，且已在百度云控制台中启用 Qianfan API 访问权限。
    - 如果未列出模型，请确认您的账户已激活 Qianfan 服务。
    - 默认 Base URL 为 `https://qianfan.baidubce.com/v2`。仅在使用自定义端点或代理时才需要更改。
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
  <Card title="Agent 设置" href="/concepts/agent" icon="robot">
    配置 Agent 默认值和模型分配。
  </Card>
  <Card title="Qianfan API 文档" href="https://cloud.baidu.com/doc/qianfan-api/s/3m7of64lb" icon="arrow-up-right-from-square">
    官方 Qianfan API 文档。
  </Card>
</CardGroup>
