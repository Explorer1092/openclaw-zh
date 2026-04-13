---
mmh3_hash: "2066ca0d0ad964c36bc5a8dab77de992"
title: "OpenCode"
summary: "将 OpenCode Zen 和 Go 目录与 OpenClaw 一起使用"
read_when:
  - 您想要 OpenCode 托管的模型访问
  - 您想在 Zen 和 Go 目录之间选择
---

# OpenCode

OpenCode 在 OpenClaw 中公开两个托管目录：

| 目录    | 前缀              | 运行时 Provider  |
| ------- | ----------------- | ---------------- |
| **Zen** | `opencode/...`    | `opencode`       |
| **Go**  | `opencode-go/...` | `opencode-go`    |

两个目录使用相同的 OpenCode API 密钥。OpenClaw 保持运行时 Provider ID 分离，以便上游的每模型路由保持正确，但引导和文档将它们视为一个 OpenCode 设置。

## 快速开始

<Tabs>
  <Tab title="Zen 目录">
    **适合：** 精选的 OpenCode 多模型代理（Claude、GPT、Gemini）。

    <Steps>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        或直接传递密钥：

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="将 Zen 模型设置为默认">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Go 目录">
    **适合：** OpenCode 托管的 Kimi、GLM 和 MiniMax 阵容。

    <Steps>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        或直接传递密钥：

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="将 Go 模型设置为默认">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 配置示例

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## 目录

### Zen

| 属性             | 值                                                                      |
| ---------------- | ----------------------------------------------------------------------- |
| 运行时 Provider  | `opencode`                                                              |
| 示例模型         | `opencode/claude-opus-4-6`、`opencode/gpt-5.4`、`opencode/gemini-3-pro` |

### Go

| 属性             | 值                                                                       |
| ---------------- | ------------------------------------------------------------------------ |
| 运行时 Provider  | `opencode-go`                                                            |
| 示例模型         | `opencode-go/kimi-k2.5`、`opencode-go/glm-5`、`opencode-go/minimax-m2.5` |

## 高级说明

<AccordionGroup>
  <Accordion title="API 密钥别名">
    `OPENCODE_ZEN_API_KEY` 也支持作为 `OPENCODE_API_KEY` 的别名。
  </Accordion>

  <Accordion title="共享凭据">
    在设置期间输入一个 OpenCode 密钥会为两个运行时 Provider 存储凭据。您无需单独引导每个目录。
  </Accordion>

  <Accordion title="计费和仪表板">
    您登录 OpenCode，添加计费详情，并复制您的 API 密钥。计费和目录可用性从 OpenCode 仪表板管理。
  </Accordion>

  <Accordion title="Gemini 回放行为">
    Gemini 支持的 OpenCode 引用保持在代理 Gemini 路径上，因此 OpenClaw 在那里保持 Gemini 思维签名清理，而不启用原生 Gemini 回放验证或引导重写。
  </Accordion>

  <Accordion title="非 Gemini 回放行为">
    非 Gemini OpenCode 引用保持最小 OpenAI 兼容回放策略。
  </Accordion>
</AccordionGroup>

<Tip>
在设置期间输入一个 OpenCode 密钥会为 Zen 和 Go 两个运行时 Provider 存储凭据，因此您只需引导一次。
</Tip>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    Agent、模型和 Provider 的完整配置参考。
  </Card>
</CardGroup>
