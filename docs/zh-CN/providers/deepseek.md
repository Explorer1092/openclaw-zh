---
mmh3_hash: "6eb18e6fd8640fecb08f77af1b08e359"
summary: "DeepSeek 设置（认证 + 模型选择）"
read_when:
  - 您想在 OpenClaw 中使用 DeepSeek
  - 您需要 API key 环境变量或 CLI 认证选项
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: placeholder
  source_path: "providers/deepseek.md"
  workflow: 15
---

# DeepSeek

[DeepSeek](https://www.deepseek.com) 提供具有 OpenAI 兼容 API 的强大 AI 模型。

- Provider：`deepseek`
- 认证：`DEEPSEEK_API_KEY`
- API：OpenAI 兼容

## 快速开始

设置 API key（推荐：为 Gateway 存储）：

```bash
openclaw onboard --auth-choice deepseek-api-key
```

这将提示输入您的 API key，并将 `deepseek/deepseek-chat` 设置为默认模型。

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice deepseek-api-key \
  --deepseek-api-key "$DEEPSEEK_API_KEY" \
  --skip-health \
  --accept-risk
```

## 环境注意事项

如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `DEEPSEEK_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。

## 可用模型

| 模型 ID             | 名称                     | 类型      | 上下文 |
| ------------------- | ------------------------ | --------- | ------- |
| `deepseek-chat`     | DeepSeek Chat (V3.2)     | 通用      | 128K    |
| `deepseek-reasoner` | DeepSeek Reasoner (V3.2) | 推理      | 128K    |

- **deepseek-chat** 对应非思考模式下的 DeepSeek-V3.2。
- **deepseek-reasoner** 对应具有思维链推理的思考模式下的 DeepSeek-V3.2。

在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 获取您的 API key。
