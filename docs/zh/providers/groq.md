---
title: "Groq"
mmh3_hash: "5518886493dbabc61a16d86b4380df7a"
summary: "Groq 设置（身份验证 + 模型选择）"
read_when:
  - 您想在 OpenClaw 中使用 Groq
  - 您需要 API 密钥环境变量或 CLI 身份验证选项
---

# Groq

[Groq](https://groq.com) 使用定制 LPU 硬件为开源模型（Llama、Gemma、Mistral 等）提供超快速推理。OpenClaw 通过其 OpenAI 兼容 API 连接到 Groq。

| 属性     | 值                |
| -------- | ----------------- |
| Provider | `groq`            |
| 身份验证 | `GROQ_API_KEY`    |
| API      | OpenAI 兼容       |

## 快速开始

<Steps>
  <Step title="获取 API 密钥">
    在 [console.groq.com/keys](https://console.groq.com/keys) 创建 API 密钥。
  </Step>
  <Step title="设置 API 密钥">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="设置默认模型">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
</Steps>

### 配置文件示例

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## 内置目录

Groq 的模型目录经常变化。运行 `openclaw models list | grep groq` 查看当前可用模型，或查看 [console.groq.com/docs/models](https://console.groq.com/docs/models)。

| 模型                        | 说明                               |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | 通用，大上下文                     |
| **Llama 3.1 8B Instant**    | 快速，轻量                         |
| **Gemma 2 9B**              | 紧凑，高效                         |
| **Mixtral 8x7B**            | MoE 架构，推理能力强               |

<Tip>
使用 `openclaw models list --provider groq` 获取您账户上最新的可用模型列表。
</Tip>

## 音频转录

Groq 还提供基于 Whisper 的快速音频转录。当配置为媒体理解 Provider 时，OpenClaw 使用 Groq 的 `whisper-large-v3-turbo` 模型通过共享的 `tools.media.audio` 界面转录语音消息。

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="音频转录详情">
    | 属性               | 值                                        |
    | ------------------ | ----------------------------------------- |
    | 共享配置路径       | `tools.media.audio`                       |
    | 默认 Base URL      | `https://api.groq.com/openai/v1`          |
    | 默认模型           | `whisper-large-v3-turbo`                  |
    | API 端点           | OpenAI 兼容的 `/audio/transcriptions`     |
  </Accordion>

  <Accordion title="环境注意事项">
    如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `GROQ_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。

    <Warning>
    仅在交互式 Shell 中设置的密钥对守护进程管理的 Gateway 进程不可见。使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置以确保持久可用性。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    包含 Provider 和音频设置的完整配置 Schema。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 控制台、API 文档和定价。
  </Card>
  <Card title="Groq 模型列表" href="https://console.groq.com/docs/models" icon="list">
    官方 Groq 模型目录。
  </Card>
</CardGroup>
