---
mmh3_hash: "57d8bc190cb0db4e9c8ed465be49d1c8"
title: "Qwen / Model Studio"
summary: "阿里云 Model Studio 设置（标准按量付费和编码套餐，双区域端点）"
read_when:
  - 您想在 OpenClaw 中使用 Qwen（阿里云 Model Studio）
  - 您需要 Model Studio 的 API key 环境变量
  - 您想使用标准（按量付费）或编码套餐端点
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: placeholder
  source_path: "providers/qwen_modelstudio.md"
  workflow: 15
---

# Qwen / Model Studio（阿里云）

Model Studio Provider 提供对阿里云模型的访问，包括 Qwen 和平台上托管的第三方模型。支持两种计费方案：**标准**（按量付费）和**编码套餐**（订阅）。

- Provider：`modelstudio`
- 认证：`MODELSTUDIO_API_KEY`
- API：OpenAI 兼容

## 快速开始

### 标准（按量付费）

```bash
# 中国区端点
openclaw onboard --auth-choice modelstudio-standard-api-key-cn

# 全球/国际端点
openclaw onboard --auth-choice modelstudio-standard-api-key
```

### 编码套餐（订阅）

```bash
# 中国区端点
openclaw onboard --auth-choice modelstudio-api-key-cn

# 全球/国际端点
openclaw onboard --auth-choice modelstudio-api-key
```

完成引导后，设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "modelstudio/qwen3.5-plus" },
    },
  },
}
```

## 套餐类型和端点

| 套餐                       | 区域  | 认证选项                          | 端点                                             |
| -------------------------- | ------ | --------------------------------- | ------------------------------------------------ |
| 标准（按量付费）           | 中国区 | `modelstudio-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| 标准（按量付费）           | 全球   | `modelstudio-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| 编码套餐（订阅）           | 中国区 | `modelstudio-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| 编码套餐（订阅）           | 全球   | `modelstudio-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Provider 根据您的认证选项自动选择端点。您可以在配置中使用自定义 `baseUrl` 覆盖。

## 获取 API key

- **中国区**：[bailian.console.aliyun.com](https://bailian.console.aliyun.com/)
- **全球/国际**：[modelstudio.console.alibabacloud.com](https://modelstudio.console.alibabacloud.com/)

## 可用模型

- **qwen3.5-plus**（默认）— Qwen 3.5 Plus
- **qwen3-coder-plus**、**qwen3-coder-next** — Qwen 编码模型
- **GLM-5** — 通过阿里巴巴的 GLM 模型
- **Kimi K2.5** — 通过阿里巴巴的月之暗面 AI
- **MiniMax-M2.7** — 通过阿里巴巴的 MiniMax

部分模型（qwen3.5-plus、kimi-k2.5）支持图像输入。上下文窗口范围从 200K 到 1M token。

## 环境注意事项

如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `MODELSTUDIO_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
