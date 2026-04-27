---
mmh3_hash: "39abc7293b069712d716ea335d6d3d75"
summary: "Cerebras 设置（认证 + 模型选择）"
title: "Cerebras"
read_when:
  - 您希望在 OpenClaw 中使用 Cerebras
  - 您需要 Cerebras API 密钥环境变量或 CLI 认证选项
---

[Cerebras](https://www.cerebras.ai) 提供高速的 OpenAI 兼容推理服务。

| 属性     | 值                           |
| -------- | ---------------------------- |
| Provider | `cerebras`                   |
| 认证     | `CEREBRAS_API_KEY`           |
| API      | OpenAI 兼容                  |
| 基础 URL | `https://api.cerebras.ai/v1` |

## 入门

<Steps>
  <Step title="获取 API 密钥">
    在 [Cerebras Cloud Console](https://cloud.cerebras.ai) 中创建 API 密钥。
  </Step>
  <Step title="运行引导程序">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### 非交互式设置

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## 内置目录

OpenClaw 为公共 OpenAI 兼容端点提供了一个静态 Cerebras 目录：

| 模型引用                                  | 名称                 | 备注                               |
| ----------------------------------------- | -------------------- | ---------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | 默认模型；预览推理模型             |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | 生产推理模型                       |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | 预览非推理模型                     |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | 以速度为重点的生产模型             |

<Warning>
Cerebras 将 `zai-glm-4.7` 和 `qwen-3-235b-a22b-instruct-2507` 标记为预览模型，`llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` 已记录为将于 2026 年 5 月 27 日弃用。在将其用于生产之前，请查看 Cerebras 的支持模型页面。
</Warning>

## 手动配置

捆绑的 Plugin 通常意味着您只需要 API 密钥。当您想要覆盖模型元数据时，请使用显式的 `models.providers.cerebras` 配置：

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
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
如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `CEREBRAS_API_KEY` 对该进程可用，例如在 `~/.openclaw/.env` 中或通过 `env.shellEnv`。
</Note>
