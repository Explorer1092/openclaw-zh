---
mmh3_hash: "4e491879811ee3f040731339bc7b0a00"
title: "Together AI"
summary: "Together AI 设置（身份验证 + 模型选择）"
read_when:
  - 您想要在 OpenClaw 中使用 Together AI
  - 您需要 API 密钥环境变量或 CLI 身份验证选项
---

[Together AI](https://together.ai) 通过统一的 API 提供对领先开源模型的访问，包括 Llama、DeepSeek、Kimi 等。

| 属性     | 值                            |
| -------- | ----------------------------- |
| Provider | `together`                    |
| 身份验证 | `TOGETHER_API_KEY`            |
| API      | OpenAI 兼容                   |
| Base URL | `https://api.together.xyz/v1` |

## 快速开始

<Steps>
  <Step title="获取 API 密钥">
    在 [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys) 创建 API 密钥。
  </Step>
  <Step title="运行入门">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="设置默认模型">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "together/moonshotai/Kimi-K2.5" },
        },
      },
    }
    ```
  </Step>
</Steps>

### 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
入门预设将 `together/moonshotai/Kimi-K2.5` 设置为默认模型。
</Note>

## 内置目录

OpenClaw 目前内置以下 Together 目录：

| 模型引用                                                     | 名称                                    | 输入         | 上下文     | 说明                         |
| ------------------------------------------------------------ | --------------------------------------- | ------------ | ---------- | ---------------------------- |
| `together/moonshotai/Kimi-K2.5`                              | Kimi K2.5                               | text, image  | 262,144    | 默认模型；已启用推理         |
| `together/zai-org/GLM-4.7`                                   | GLM 4.7 Fp8                             | text         | 202,752    | 通用文本模型                 |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`           | Llama 3.3 70B Instruct Turbo            | text         | 131,072    | 快速指令模型                 |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`         | Llama 4 Scout 17B 16E Instruct          | text, image  | 10,000,000 | 多模态                       |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8  | text, image  | 20,000,000 | 多模态                       |
| `together/deepseek-ai/DeepSeek-V3.1`                         | DeepSeek V3.1                           | text         | 131,072    | 通用文本模型                 |
| `together/deepseek-ai/DeepSeek-R1`                           | DeepSeek R1                             | text         | 131,072    | 推理模型                     |
| `together/moonshotai/Kimi-K2-Instruct-0905`                  | Kimi K2-Instruct 0905                   | text         | 262,144    | 次要 Kimi 文本模型           |

## 视频生成

内置的 `together` Plugin 还通过共享的 `video_generate` 工具注册视频生成。

| 属性             | 值                                    |
| ---------------- | ------------------------------------- |
| 默认视频模型     | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| 模式             | 文本到视频、单图像参考                |
| 支持的参数       | `aspectRatio`、`resolution`           |

将 Together 设置为默认视频 Provider：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
有关共享工具参数、Provider 选择和故障转移行为，请参见[视频生成](/tools/video-generation)。
</Tip>

<AccordionGroup>
  <Accordion title="环境说明">
    如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `TOGETHER_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。

    <Warning>
    仅在交互式 Shell 中设置的密钥对守护进程管理的 Gateway 进程不可见。请使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置以确保持久可用性。
    </Warning>

  </Accordion>

  <Accordion title="故障排除">
    - 验证您的密钥是否有效：`openclaw models list --provider together`
    - 如果模型未出现，请确认 API 密钥在 Gateway 进程的正确环境中已设置。
    - 模型引用使用 `together/<model-id>` 形式。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型 Provider" href="/concepts/model-providers" icon="layers">
    Provider 规则、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    共享视频生成工具参数和 Provider 选择。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    包含 Provider 设置的完整配置 Schema。
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Together AI 仪表板、API 文档和定价。
  </Card>
</CardGroup>
