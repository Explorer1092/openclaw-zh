---
title: "Mistral"
mmh3_hash: "33fe4e87ca70d18bf9bf16e8e9f30310"
summary: "在 OpenClaw 中使用 Mistral 模型和 Voxtral 转录"
read_when:
  - 希望在 OpenClaw 中使用 Mistral 模型
  - 希望将 Voxtral 用于 Voice Call 实时转录
  - 需要 Mistral API 密钥入门和模型参考
---

OpenClaw 内置了 Mistral Plugin，可注册四个合约：聊天补全、媒体理解（Voxtral 批量转录）、Voice Call 实时 STT（Voxtral Realtime）和内存嵌入（`mistral-embed`）。

| 属性               | 值                                          |
| ------------------ | ------------------------------------------- |
| Provider id        | `mistral`                                   |
| Plugin             | bundled, `enabledByDefault: true`           |
| 认证环境变量       | `MISTRAL_API_KEY`                           |
| Onboarding flag    | `--auth-choice mistral-api-key`             |
| 直接 CLI 标志      | `--mistral-api-key <key>`                   |
| API                | OpenAI 兼容（`openai-completions`）         |
| Base URL           | `https://api.mistral.ai/v1`                 |
| 默认模型           | `mistral/mistral-large-latest`              |
| 嵌入模型           | `mistral-embed`                             |
| Voxtral 批量       | `voxtral-mini-latest`（音频转录）           |
| Voxtral 实时       | `voxtral-mini-transcribe-realtime-2602`     |

## 快速开始

<Steps>
  <Step title="获取 API 密钥">
    在 [Mistral Console](https://console.mistral.ai/) 中创建 API 密钥。
  </Step>
  <Step title="运行入门">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    或直接传递密钥：

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="设置默认模型">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## 内置 LLM 目录

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04) 是内置目录中当前的混合 Medium 模型：128B 密集权重，文本和图像输入，256K 上下文，函数调用、结构化输出、编码，以及通过 Chat Completions API 可调推理。当您需要 Mistral 更新的统一智能体/编码模型时，使用 `mistral/mistral-medium-3-5` 而非默认的 `mistral/mistral-large-latest`。

OpenClaw 目前提供以下内置 Mistral 目录：

| 模型引用                         | 输入        | 上下文  | 最大输出 | 备注                                                             |
| -------------------------------- | ----------- | ------- | -------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144 | 16,384   | 默认模型                                                         |
| `mistral/mistral-medium-2508`    | text, image | 262,144 | 8,192    | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | text, image | 262,144 | 8,192    | Mistral Medium 3.5；可调推理                                     |
| `mistral/mistral-small-latest`   | text, image | 128,000 | 16,384   | Mistral Small 4；通过 API `reasoning_effort` 可调推理            |
| `mistral/pixtral-large-latest`   | text, image | 128,000 | 32,768   | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000 | 4,096    | 编码                                                             |
| `mistral/devstral-medium-latest` | text        | 262,144 | 32,768   | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000 | 40,000   | 启用推理                                                         |

入门后，无需启动 Gateway 即可冒烟测试 Medium 3.5：

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

浏览内置目录行：

```bash
openclaw models list --all --provider mistral --plain
```

## 音频转录（Voxtral）

通过媒体理解管道使用 Voxtral 进行音频转录。

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
媒体转录路径使用 `/v1/audio/transcriptions`。Mistral 的默认音频模型是 `voxtral-mini-latest`。
</Tip>

## Voice Call 流式 STT

内置的 `mistral` 插件将 Voxtral Realtime 注册为 Voice Call 流式 STT Provider。

| 设置         | 配置路径                                                               | 默认值                                  |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| API 密钥     | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | 回退到 `MISTRAL_API_KEY`                |
| 模型         | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| 编码         | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| 采样率       | `...mistral.sampleRate`                                                | `8000`                                  |
| 目标延迟     | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
OpenClaw 将 Mistral 实时 STT 默认设置为 8 kHz 的 `pcm_mulaw`，以便 Voice Call 可以直接转发 Twilio 媒体帧。仅当您的上游流已经是原始 PCM 时，才使用 `encoding: "pcm_s16le"` 和匹配的 `sampleRate`。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="可调推理">
    `mistral/mistral-small-latest`（Mistral Small 4）和 `mistral/mistral-medium-3-5` 通过 `reasoning_effort` 在 Chat Completions API 上支持[可调推理](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable)（`none` 最小化输出中的额外思考；`high` 在最终答案前显示完整思考痕迹）。Mistral 建议对 Medium 3.5 智能体和代码用例使用 `reasoning_effort="high"`。

    OpenClaw 将会话的**思考**级别映射到 Mistral 的 API：

    | OpenClaw 思考级别                                              | Mistral `reasoning_effort` |
    | -------------------------------------------------------------- | -------------------------- |
    | **off** / **minimal**                                          | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`                |

    <Warning>
    不要将 Medium 3.5 推理模式与 `temperature: 0` 结合使用。Mistral HTTP API 会以 400 响应拒绝 `reasoning_effort="high"` 加 `temperature: 0` 的组合。保持温度不设置让 Mistral 使用默认值，或按照 [Medium 3.5 推荐设置](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)对高推理使用 `temperature: 0.7`。对于确定性直接回答，请关闭/最小化思考，让 OpenClaw 在您降低温度之前发送 `reasoning_effort: "none"`。
    </Warning>

    Medium 3.5 推理的模型范围配置示例：

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    其他内置 Mistral 目录模型不使用此参数。当您需要 Mistral 原生推理优先行为时，继续使用 `magistral-*` 模型。
    </Note>

  </Accordion>

  <Accordion title="内存嵌入">
    Mistral 可通过 `/v1/embeddings` 提供内存嵌入（默认模型：`mistral-embed`）。

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="身份验证和 Base URL">
    - Mistral 身份验证使用 `MISTRAL_API_KEY`（Bearer 标头）。
    - Provider Base URL 默认为 `https://api.mistral.ai/v1`，接受标准 OpenAI 兼容的聊天补全请求格式。
    - 入门默认模型为 `mistral/mistral-large-latest`。
    - 仅当 Mistral 明确发布您需要的区域端点时，才在 `models.providers.mistral.baseUrl` 下覆盖 Base URL。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="媒体理解" href="/nodes/media-understanding" icon="microphone">
    音频转录设置和 Provider 选择。
  </Card>
</CardGroup>
