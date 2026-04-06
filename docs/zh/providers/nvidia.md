---
mmh3_hash: "f95a7591ac23755bcf5b0e612ce71e87"
summary: "在 OpenClaw 中使用 NVIDIA 的 OpenAI 兼容 API"
read_when:
  - 您想要在 OpenClaw 中使用 NVIDIA 模型
  - 您需要 NVIDIA_API_KEY 设置
title: "NVIDIA"
---

# NVIDIA

NVIDIA 在 `https://integrate.api.nvidia.com/v1` 提供 Nemotron 和 NeMo 模型的 OpenAI 兼容 API。使用来自 [NVIDIA NGC](https://catalog.ngc.nvidia.com/) 的 API 密钥进行身份验证。

## CLI 设置

导出密钥后，运行入门并设置 NVIDIA 模型：

```bash
export NVIDIA_API_KEY="nvapi-..."
openclaw onboard --auth-choice skip
openclaw models set nvidia/nvidia/llama-3.1-nemotron-70b-instruct
```

如果您仍然传递 `--token`，请记住它会出现在 Shell 历史和 `ps` 输出中；尽可能优先使用环境变量。

## 配置片段

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
      model: { primary: "nvidia/nvidia/llama-3.1-nemotron-70b-instruct" },
    },
  },
}
```

## 模型 ID

| 模型引用                                             | 名称                                     | 上下文  | 最大输出 |
| ---------------------------------------------------- | ---------------------------------------- | ------- | -------- |
| `nvidia/nvidia/llama-3.1-nemotron-70b-instruct`      | NVIDIA Llama 3.1 Nemotron 70B Instruct   | 131,072 | 4,096    |
| `nvidia/meta/llama-3.3-70b-instruct`                 | Meta Llama 3.3 70B Instruct              | 131,072 | 4,096    |
| `nvidia/nvidia/mistral-nemo-minitron-8b-8k-instruct` | NVIDIA Mistral NeMo Minitron 8B Instruct | 8,192   | 2,048    |

## 注意事项

- OpenAI 兼容的 `/v1` 端点；使用来自 NVIDIA NGC 的 API 密钥。
- 设置 `NVIDIA_API_KEY` 时，Provider 自动启用。
- 内置目录是静态的；源代码中成本默认为 `0`。
