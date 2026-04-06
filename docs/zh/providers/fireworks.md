---
mmh3_hash: "c5b6b6b24866119364762e4eda08d7f4"
summary: "Fireworks 设置（身份验证 + 模型选择）"
read_when:
  - 您想在 OpenClaw 中使用 Fireworks
  - 您需要 Fireworks API 密钥环境变量或默认模型 id
---

# Fireworks

[Fireworks](https://fireworks.ai) 通过 OpenAI 兼容的 API 公开开放权重和路由模型。OpenClaw 现已内置 Fireworks Provider 插件。

- Provider：`fireworks`
- 身份验证：`FIREWORKS_API_KEY`
- API：OpenAI 兼容的聊天/补全
- Base URL：`https://api.fireworks.ai/inference/v1`
- 默认模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`

## 快速开始

通过入门设置 Fireworks 身份验证：

```bash
openclaw onboard --auth-choice fireworks-api-key
```

这会将您的 Fireworks 密钥存储在 OpenClaw 配置中，并将 Fire Pass 入门模型设置为默认值。

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 环境注意事项

如果 Gateway 在您的交互式 Shell 之外运行，请确保 `FIREWORKS_API_KEY` 对该进程也可用。仅存在于 `~/.profile` 中的密钥不会帮助 launchd/systemd 守护进程，除非该环境也被导入其中。

## 内置目录

| 模型引用                                               | 名称                        | 输入       | 上下文  | 最大输出 | 备注                                      |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | -------- | ------------------------------------------ |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000  | Fireworks 上的默认内置入门模型             |

## 自定义 Fireworks 模型 id

OpenClaw 也接受动态 Fireworks 模型 id。使用 Fireworks 显示的确切模型或路由器 id，并在前面加上 `fireworks/`。

示例：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

如果 Fireworks 发布了更新的模型（例如新的 Qwen 或 Gemma 版本），您可以直接使用其 Fireworks 模型 id 切换到该模型，无需等待内置目录更新。
