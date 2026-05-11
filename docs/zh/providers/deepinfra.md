---
mmh3_hash: "71874daa9e68125e82525457279e9007"
summary: "在 OpenClaw 中使用 DeepInfra 的统一 API 访问最流行的开源和前沿模型"
read_when:
  - 您想使用单个 API 密钥访问主流开源大语言模型
  - 您想在 OpenClaw 中通过 DeepInfra 的 API 运行模型
title: "DeepInfra"
---

DeepInfra 提供**统一 API**，通过单一端点和 API 密钥将请求路由到最流行的开源和前沿模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换 Base URL 即可使用。

## 获取 API 密钥

1. 前往 [https://deepinfra.com/](https://deepinfra.com/)
2. 登录或创建账户
3. 导航至 Dashboard / Keys，生成新的 API 密钥或使用自动创建的密钥

## CLI 设置

```bash
openclaw onboard --deepinfra-api-key <key>
```

或设置环境变量：

```bash
export DEEPINFRA_API_KEY="<your-deepinfra-api-key>" # pragma: allowlist secret
```

## 配置示例

```json5
{
  env: { DEEPINFRA_API_KEY: "<your-deepinfra-api-key>" }, // pragma: allowlist secret
  agents: {
    defaults: {
      model: { primary: "deepinfra/deepseek-ai/DeepSeek-V3.2" },
    },
  },
}
```

## 支持的 OpenClaw 接口

内置 Plugin 注册所有与当前 OpenClaw Provider 合约匹配的 DeepInfra 接口：

| 接口                     | 默认模型                               | OpenClaw 配置/工具                                       |
| ------------------------ | -------------------------------------- | -------------------------------------------------------- |
| Chat / 模型 Provider     | `deepseek-ai/DeepSeek-V3.2`            | `agents.defaults.model`                                  |
| 图像生成/编辑            | `black-forest-labs/FLUX-1-schnell`     | `image_generate`, `agents.defaults.imageGenerationModel` |
| 媒体理解                 | `moonshotai/Kimi-K2.5`（图像）         | 入站图像理解                                             |
| 语音转文字               | `openai/whisper-large-v3-turbo`        | 入站音频转录                                             |
| 文字转语音               | `hexgrad/Kokoro-82M`                   | `messages.tts.provider: "deepinfra"`                     |
| 视频生成                 | `Pixverse/Pixverse-T2V`                | `video_generate`, `agents.defaults.videoGenerationModel` |
| 记忆 Embedding           | `BAAI/bge-m3`                          | `agents.defaults.memorySearch.provider: "deepinfra"`     |

DeepInfra 还提供重排序、分类、目标检测等原生模型类型。OpenClaw 目前尚未为这些类别提供一级 Provider 合约，因此该 Plugin 暂不注册它们。

## 可用模型

OpenClaw 在启动时动态发现可用的 DeepInfra 模型。使用 `/models deepinfra` 查看完整的可用模型列表。

[DeepInfra.com](https://deepinfra.com/) 上的任何模型都可以使用 `deepinfra/` 前缀：

```
deepinfra/MiniMaxAI/MiniMax-M2.5
deepinfra/deepseek-ai/DeepSeek-V3.2
deepinfra/moonshotai/Kimi-K2.5
deepinfra/zai-org/GLM-5.1
...以及更多
```

## 说明

- 模型引用格式为 `deepinfra/<provider>/<model>`（例如 `deepinfra/Qwen/Qwen3-Max`）。
- 默认模型：`deepinfra/deepseek-ai/DeepSeek-V3.2`
- Base URL：`https://api.deepinfra.com/v1/openai`
- 原生视频生成使用 `https://api.deepinfra.com/v1/inference/<model>`。

## 相关

- [模型 Provider](/concepts/model-providers)
- [所有 Provider](/providers/index)
