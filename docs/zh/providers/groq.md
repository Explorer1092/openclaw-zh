---
mmh3_hash: "7d51f8e26d20c0a85c7e86809cb56046"
title: "Groq"
summary: "Groq 设置（身份验证 + 模型选择 + Whisper 转录）"
read_when:
  - 您想在 OpenClaw 中使用 Groq
  - 您需要 API 密钥环境变量或 CLI 身份验证选项
  - 您在配置 Groq 上的 Whisper 音频转录
---

[Groq](https://groq.com) 使用定制 LPU 硬件为开源模型（Llama、Gemma、Kimi、Qwen、GPT OSS 等）提供超快速推理。OpenClaw 内置了 Groq Plugin，可同时注册 OpenAI 兼容的聊天 Provider 和音频媒体理解 Provider。

| 属性                  | 值                                       |
| --------------------- | ---------------------------------------- |
| Provider id           | `groq`                                   |
| Plugin                | 内置，`enabledByDefault: true`            |
| 认证环境变量          | `GROQ_API_KEY`                           |
| Onboarding flag       | `--auth-choice groq-api-key`             |
| API                   | OpenAI 兼容（`openai-completions`）      |
| Base URL              | `https://api.groq.com/openai/v1`         |
| 音频转录              | `whisper-large-v3-turbo`（默认）         |
| 建议聊天默认模型      | `groq/llama-3.3-70b-versatile`           |

## 快速开始

<Steps>
  <Step title="获取 API 密钥">
    在 [console.groq.com/keys](https://console.groq.com/keys) 创建 API 密钥。
  </Step>
  <Step title="设置 API 密钥">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice groq-api-key
```

```bash 仅环境变量
export GROQ_API_KEY=gsk_...
```

    </CodeGroup>

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
  <Step title="验证目录是否可访问">
    ```bash
    openclaw models list --provider groq
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

OpenClaw 附带了一个支持清单的 Groq 目录，包含推理和非推理条目。运行 `openclaw models list --provider groq` 查看您安装版本的捆绑行，或查看 [console.groq.com/docs/models](https://console.groq.com/docs/models) 获取 Groq 的权威列表。

| 模型引用                                             | 名称                          | 推理 | 输入         | 上下文  |
| ---------------------------------------------------- | ----------------------------- | ---- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                       | Llama 3.3 70B Versatile       | 否   | 文本         | 131,072 |
| `groq/llama-3.1-8b-instant`                          | Llama 3.1 8B Instant          | 否   | 文本         | 131,072 |
| `groq/meta-llama/llama-4-maverick-17b-128e-instruct` | Llama 4 Maverick 17B          | 否   | 文本 + 图像  | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct`     | Llama 4 Scout 17B             | 否   | 文本 + 图像  | 131,072 |
| `groq/llama3-70b-8192`                               | Llama 3 70B                   | 否   | 文本         | 8,192   |
| `groq/llama3-8b-8192`                                | Llama 3 8B                    | 否   | 文本         | 8,192   |
| `groq/gemma2-9b-it`                                  | Gemma 2 9B                    | 否   | 文本         | 8,192   |
| `groq/mistral-saba-24b`                              | Mistral Saba 24B              | 否   | 文本         | 32,768  |
| `groq/moonshotai/kimi-k2-instruct`                   | Kimi K2 Instruct              | 否   | 文本         | 131,072 |
| `groq/moonshotai/kimi-k2-instruct-0905`              | Kimi K2 Instruct 0905         | 否   | 文本         | 262,144 |
| `groq/openai/gpt-oss-120b`                           | GPT OSS 120B                  | 是   | 文本         | 131,072 |
| `groq/openai/gpt-oss-20b`                            | GPT OSS 20B                   | 是   | 文本         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`                  | Safety GPT OSS 20B            | 是   | 文本         | 131,072 |
| `groq/qwen-qwq-32b`                                  | Qwen QwQ 32B                  | 是   | 文本         | 131,072 |
| `groq/qwen/qwen3-32b`                                | Qwen3 32B                     | 是   | 文本         | 131,072 |
| `groq/deepseek-r1-distill-llama-70b`                 | DeepSeek R1 Distill Llama 70B | 是   | 文本         | 131,072 |
| `groq/groq/compound`                                 | Compound                      | 是   | 文本         | 131,072 |
| `groq/groq/compound-mini`                            | Compound Mini                 | 是   | 文本         | 131,072 |

<Tip>
  目录会随每次 OpenClaw 发布而更新。`openclaw models list --provider groq` 显示您安装版本已知的行；请与 [console.groq.com/docs/models](https://console.groq.com/docs/models) 交叉核对新增或已弃用的模型。
</Tip>

## 推理模型

OpenClaw 将共享的 `/think` 级别映射到 Groq 特定模型的 `reasoning_effort` 值：

- 对于 `qwen/qwen3-32b`，禁用思考时发送 `none`，启用思考时发送 `default`。
- 对于 Groq GPT OSS 推理模型（`openai/gpt-oss-*`），OpenClaw 根据 `/think` 级别发送 `low`、`medium` 或 `high`。禁用思考时省略 `reasoning_effort`，因为这些模型不支持禁用值。
- DeepSeek R1 Distill、Qwen QwQ 和 Compound 使用 Groq 的原生推理接口；`/think` 控制可见性，但模型始终进行推理。

有关共享 `/think` 级别以及 OpenClaw 如何将其逐 Provider 转换，请参见[思考模式](/tools/thinking)。

## 音频转录

Groq 捆绑的 Plugin 还注册了一个**音频媒体理解 Provider**，以便语音消息可通过共享的 `tools.media.audio` 接口进行转录。

| 属性               | 值                                        |
| ------------------ | ----------------------------------------- |
| 共享配置路径       | `tools.media.audio`                       |
| 默认 Base URL      | `https://api.groq.com/openai/v1`          |
| 默认模型           | `whisper-large-v3-turbo`                  |
| 自动优先级         | 20                                        |
| API 端点           | OpenAI 兼容的 `/audio/transcriptions`     |

将 Groq 设置为默认音频后端：

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
  <Accordion title="守护进程的环境可用性">
    如果 Gateway 作为托管服务（launchd、systemd、Docker）运行，`GROQ_API_KEY` 必须对该进程可见，而不仅仅是对您的交互式 Shell。

    <Warning>
      仅在交互式 shell 中导出的密钥不会对 launchd 或 systemd 守护进程生效，除非该环境也被导入其中。在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 设置密钥，使其可从 Gateway 进程读取。
    </Warning>

  </Accordion>

  <Accordion title="自定义 Groq 模型 id">
    OpenClaw 在运行时接受任何 Groq 模型 id。使用 Groq 显示的确切 id，并在前面加上 `groq/`。捆绑目录涵盖了常见情况；未在目录中的 id 将回退到默认的 OpenAI 兼容模板。

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型 Provider" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="思考模式" href="/tools/thinking" icon="brain">
    推理努力级别和 Provider 策略交互。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    包含 Provider 和音频设置的完整配置 Schema。
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    Groq 控制台、API 文档和定价。
  </Card>
</CardGroup>
