---
mmh3_hash: "459980079455a08543ea39959944ff48"
title: "Model Studio"
summary: "Alibaba Cloud Model Studio 设置（Coding Plan、双区域端点）"
read_when:
  - 您想在 OpenClaw 中使用 Alibaba Cloud Model Studio
  - 您需要 Model Studio 的 API 密钥环境变量
---

# Model Studio（阿里云）

Model Studio Provider 提供对阿里云 Coding Plan 模型的访问，包括 Qwen 和平台上托管的第三方模型。

- Provider：`modelstudio`
- 身份验证：`MODELSTUDIO_API_KEY`
- API：OpenAI 兼容

## 快速开始

1. 设置 API 密钥：

```bash
openclaw onboard --auth-choice modelstudio-api-key
```

2. 设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "modelstudio/qwen3.5-plus" },
    },
  },
}
```

## 区域端点

Model Studio 根据区域有两个端点：

| 区域       | 端点                                 |
| ---------- | ------------------------------------ |
| 中国（CN） | `coding.dashscope.aliyuncs.com`      |
| 全球       | `coding-intl.dashscope.aliyuncs.com` |

Provider 根据身份验证选择自动选择（`modelstudio-api-key` 用于全球，`modelstudio-api-key-cn` 用于中国）。您可以在配置中使用自定义 `baseUrl` 覆盖。

## 可用模型

- **qwen3.5-plus**（默认）- Qwen 3.5 Plus
- **qwen3-max** - Qwen 3 Max
- **qwen3-coder** 系列 - Qwen 编码模型
- **GLM-5**、**GLM-4.7** - 通过阿里云的 GLM 模型
- **Kimi K2.5** - 通过阿里云的 Moonshot AI
- **MiniMax-M2.5** - 通过阿里云的 MiniMax

大多数模型支持图像输入。上下文窗口范围从 200K 到 1M Token。

## 环境注意事项

如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `MODELSTUDIO_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
