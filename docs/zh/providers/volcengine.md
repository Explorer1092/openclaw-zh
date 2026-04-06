---
mmh3_hash: "79acc58a455757cb25393850f3878a8a"
title: "Volcengine (Doubao)"
summary: "火山引擎设置（Doubao 模型、通用 + 编码端点）"
read_when:
  - 您想在 OpenClaw 中使用火山引擎或 Doubao 模型
  - 您需要 Volcengine API 密钥设置
---

# Volcengine（Doubao）

Volcengine Provider 提供对 Doubao 模型和火山引擎上托管的第三方模型的访问，为通用和编码工作负载分别提供单独的端点。

- Provider：`volcengine`（通用）+ `volcengine-plan`（编码）
- 身份验证：`VOLCANO_ENGINE_API_KEY`
- API：OpenAI 兼容

## 快速开始

1. 设置 API 密钥：

```bash
openclaw onboard --auth-choice volcengine-api-key
```

2. 设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "volcengine-plan/ark-code-latest" },
    },
  },
}
```

## 非交互式示例

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

## Provider 和端点

| Provider          | 端点                                      | 用途       |
| ----------------- | ----------------------------------------- | ---------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | 通用模型   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | 编码模型   |

两个 Provider 都从单个 API 密钥配置。设置会自动注册两者。

## 可用模型

通用 Provider（`volcengine`）：

| 模型引用                                             | 名称                            | 输入        | 上下文  |
| ---------------------------------------------------- | ------------------------------- | ----------- | ------- |
| `volcengine/doubao-seed-1-8-251228`                  | Doubao Seed 1.8                 | text, image | 256,000 |
| `volcengine/doubao-seed-code-preview-251028`         | doubao-seed-code-preview-251028 | text, image | 256,000 |
| `volcengine/kimi-k2-5-260127`                        | Kimi K2.5                       | text, image | 256,000 |
| `volcengine/glm-4-7-251222`                          | GLM 4.7                         | text, image | 200,000 |
| `volcengine/deepseek-v3-2-251201`                    | DeepSeek V3.2                   | text, image | 128,000 |

编码 Provider（`volcengine-plan`）：

| 模型引用                                              | 名称                     | 输入 | 上下文  |
| ----------------------------------------------------- | ------------------------ | ---- | ------- |
| `volcengine-plan/ark-code-latest`                     | Ark Coding Plan          | text | 256,000 |
| `volcengine-plan/doubao-seed-code`                    | Doubao Seed Code         | text | 256,000 |
| `volcengine-plan/glm-4.7`                             | GLM 4.7 Coding           | text | 200,000 |
| `volcengine-plan/kimi-k2-thinking`                    | Kimi K2 Thinking         | text | 256,000 |
| `volcengine-plan/kimi-k2.5`                           | Kimi K2.5 Coding         | text | 256,000 |
| `volcengine-plan/doubao-seed-code-preview-251028`     | Doubao Seed Code Preview | text | 256,000 |

`openclaw onboard --auth-choice volcengine-api-key` 目前将 `volcengine-plan/ark-code-latest` 设置为默认模型，同时也注册通用 `volcengine` 目录。

在入门/配置模型选择时，Volcengine auth 选项会优先显示 `volcengine/*` 和 `volcengine-plan/*` 行。如果这些模型尚未加载，OpenClaw 会回退到未过滤的目录，而不是显示空的 Provider 范围选择器。

## 环境注意事项

如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `VOLCANO_ENGINE_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
