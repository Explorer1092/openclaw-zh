---
mmh3_hash: "08e6b44cfb018d46595802adec454953"
title: "OpenCode Go"
summary: "将 OpenCode Go 目录与共享 OpenCode 设置一起使用"
read_when:
  - 您想使用 OpenCode Go 目录
  - 您需要 Go 托管模型的运行时模型引用
---

OpenCode Go 是 [OpenCode](/providers/opencode) 中的 Go 目录。
它使用与 Zen 目录相同的 `OPENCODE_API_KEY`，但保留运行时
Provider ID `opencode-go`，以使上游的每模型路由保持正确。

| 属性             | 值                              |
| ---------------- | ------------------------------- |
| 运行时 Provider  | `opencode-go`                   |
| 身份验证         | `OPENCODE_API_KEY`              |
| 父级设置         | [OpenCode](/providers/opencode) |

## 内置目录

OpenClaw 从内置 pi 模型注册表中获取大部分 Go 目录行，并在注册表追赶进度时补充当前的上游行。运行 `openclaw models list --provider opencode-go` 获取当前模型列表。

该 Provider 包含：

| 模型引用                            | 名称                  |
| ----------------------------------  | --------------------- |
| `opencode-go/glm-5`                 | GLM-5                 |
| `opencode-go/glm-5.1`               | GLM-5.1               |
| `opencode-go/kimi-k2.5`             | Kimi K2.5             |
| `opencode-go/kimi-k2.6`             | Kimi K2.6 (3x limits) |
| `opencode-go/deepseek-v4-pro`       | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash`     | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`          | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`           | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`          | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`          | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`          | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`          | Qwen3.6 Plus          |

## 快速开始

<Tabs>
  <Tab title="交互式">
    <Steps>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="将 Go 模型设置为默认">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="非交互式">
    <Steps>
      <Step title="直接传递密钥">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
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
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## 高级说明

<AccordionGroup>
  <Accordion title="路由行为">
    当模型引用使用 `opencode-go/...` 时，OpenClaw 自动处理每模型路由。无需额外的 Provider 配置。
  </Accordion>

  <Accordion title="运行时引用约定">
    运行时引用保持显式：Zen 使用 `opencode/...`，Go 使用 `opencode-go/...`。这使两个目录的上游每模型路由保持正确。
  </Accordion>

  <Accordion title="共享凭据">
    Zen 和 Go 目录使用相同的 `OPENCODE_API_KEY`。在设置期间输入密钥会为两个运行时 Provider 存储凭据。
  </Accordion>
</AccordionGroup>

<Tip>
有关共享引导概述和完整的 Zen + Go 目录参考，请参见 [OpenCode](/providers/opencode)。
</Tip>

## 相关

<CardGroup cols={2}>
  <Card title="OpenCode（父级）" href="/providers/opencode" icon="server">
    共享引导、目录概述和高级说明。
  </Card>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
</CardGroup>
