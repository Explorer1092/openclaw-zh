---
mmh3_hash: "3d35dc4dde62d56105a9de1d0fd21dff"
summary: "在 OpenClaw 中使用 NVIDIA 的 OpenAI 兼容 API"
read_when:
  - 您想要在 OpenClaw 中免费使用开源模型
  - 您需要 NVIDIA_API_KEY 设置
title: "NVIDIA"
---

# NVIDIA

NVIDIA 在 `https://integrate.api.nvidia.com/v1` 为开源模型提供免费的 OpenAI 兼容 API。使用来自 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 的 API 密钥进行身份验证。

## 快速开始

<Steps>
  <Step title="获取 API 密钥">
    在 [build.nvidia.com](https://build.nvidia.com/settings/api-keys) 创建 API 密钥。
  </Step>
  <Step title="导出密钥并运行入门">
    ```bash
    export NVIDIA_API_KEY="nvapi-..."
    openclaw onboard --auth-choice skip
    ```
  </Step>
  <Step title="设置 NVIDIA 模型">
    ```bash
    openclaw models set nvidia/nvidia/nemotron-3-super-120b-a12b
    ```
  </Step>
</Steps>

<Warning>
如果您传递 `--token` 而非环境变量，该值会出现在 Shell 历史和 `ps` 输出中。请尽可能优先使用 `NVIDIA_API_KEY` 环境变量。
</Warning>

## 配置示例

```json5
{
  env: { NVIDIA_API_KEY: "nvapi-..." },
  models: {
    providers: {
      nvidia: {
        baseUrl: "https://integrate.api.nvidia.com/v1",
        api: "openai-completions",
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "nvidia/nvidia/nemotron-3-super-120b-a12b" },
    },
  },
}
```

## 内置目录

| 模型引用                                   | 名称                         | 上下文  | 最大输出 |
| ------------------------------------------ | ---------------------------- | ------- | -------- |
| `nvidia/nvidia/nemotron-3-super-120b-a12b` | NVIDIA Nemotron 3 Super 120B | 262,144 | 8,192    |
| `nvidia/moonshotai/kimi-k2.5`              | Kimi K2.5                    | 262,144 | 8,192    |
| `nvidia/minimaxai/minimax-m2.5`            | Minimax M2.5                 | 196,608 | 8,192    |
| `nvidia/z-ai/glm5`                         | GLM 5                        | 202,752 | 8,192    |

## 高级说明

<AccordionGroup>
  <Accordion title="自动启用行为">
    当设置 `NVIDIA_API_KEY` 环境变量时，Provider 自动启用。除密钥外，无需显式 Provider 配置。
  </Accordion>

  <Accordion title="目录和定价">
    内置目录是静态的。由于 NVIDIA 目前为所列模型提供免费 API 访问，源代码中成本默认为 `0`。
  </Accordion>

  <Accordion title="OpenAI 兼容端点">
    NVIDIA 使用标准的 `/v1` completions 端点。任何 OpenAI 兼容工具都可以直接使用 NVIDIA Base URL。
  </Accordion>
</AccordionGroup>

<Tip>
NVIDIA 模型目前免费使用。查看 [build.nvidia.com](https://build.nvidia.com/) 了解最新可用性和速率限制详情。
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
