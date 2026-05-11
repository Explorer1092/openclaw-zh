---
mmh3_hash: "bb71b67976c0132cd4448b253e115152"
summary: "Cerebras 设置（认证 + 模型选择）"
title: "Cerebras"
read_when:
  - 您希望在 OpenClaw 中使用 Cerebras
  - 您需要 Cerebras API 密钥环境变量或 CLI 认证选项
---

[Cerebras](https://www.cerebras.ai) 提供在定制推理硬件上基于 OpenAI 兼容接口的高速推理服务。OpenClaw 内置了一个 Cerebras Provider Plugin，包含静态的四模型目录。

| 属性             | 值                                       |
| ---------------- | ---------------------------------------- |
| Provider id      | `cerebras`                               |
| Plugin           | bundled, `enabledByDefault: true`        |
| 认证环境变量     | `CEREBRAS_API_KEY`                       |
| Onboarding flag  | `--auth-choice cerebras-api-key`         |
| 直接 CLI 标志    | `--cerebras-api-key <key>`               |
| API              | OpenAI 兼容（`openai-completions`）      |
| 默认 Base URL    | `https://api.cerebras.ai/v1`             |
| 默认模型         | `cerebras/zai-glm-4.7`                   |

## 快速开始

<Steps>
  <Step title="获取 API 密钥">
    在 [Cerebras Cloud Console](https://cloud.cerebras.ai) 中创建 API 密钥。
  </Step>
  <Step title="运行引导程序">
    <CodeGroup>

```bash 引导程序
openclaw onboard --auth-choice cerebras-api-key
```

```bash 直接标志
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash 仅环境变量
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider cerebras
    ```

    列表应包含所有四个捆绑模型。如果 `CEREBRAS_API_KEY` 未解析，`openclaw models status --json` 会在 `auth.unusableProfiles` 下报告缺失的凭据。

  </Step>
</Steps>

## 非交互式设置

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 内置目录

OpenClaw 为公共 OpenAI 兼容端点提供了一个静态 Cerebras 目录。所有四个模型共享 128k 上下文和 8,192 最大输出 token。

| 模型引用                                  | 名称                 | 推理 | 说明                               |
| ----------------------------------------- | -------------------- | ---- | ---------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 是   | 默认模型；预览推理模型             |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 是   | 生产推理模型                       |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 否   | 预览非推理模型                     |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 否   | 以速度为重点的生产模型             |

<Warning>
Cerebras 将 `zai-glm-4.7` 和 `qwen-3-235b-a22b-instruct-2507` 标记为预览模型，`llama3.1-8b` 和 `qwen-3-235b-a22b-instruct-2507` 已记录为将于 2026 年 5 月 27 日弃用。在将其用于生产之前，请查看 Cerebras 的支持模型页面。
</Warning>

## 手动配置

捆绑的 Plugin 通常意味着您只需要 API 密钥。当您想要覆盖模型元数据或在 `mode: "merge"` 下针对静态目录运行时，请使用显式的 `models.providers.cerebras` 配置：

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
如果 Gateway 作为守护进程（launchd、systemd、Docker）运行，请确保 `CEREBRAS_API_KEY` 对该进程可用——例如在 `~/.openclaw/.env` 中或通过 `env.shellEnv`。仅存在于 `~/.profile` 中的密钥不会对托管服务生效，除非单独导入环境变量。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="模型 Provider" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="思考模式" href="/tools/thinking" icon="brain">
    两个支持推理的 Cerebras 模型的推理努力级别。
  </Card>
  <Card title="配置参考" href="/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认值和模型配置。
  </Card>
  <Card title="模型 FAQ" href="/help/faq-models" icon="circle-question">
    认证配置文件、切换模型和解决"无配置文件"错误。
  </Card>
</CardGroup>
