---
title: "Qwen"
mmh3_hash: "d35ba688b41a40437b7ce52f33eb4690"
summary: "通过 OpenClaw 内置 qwen Provider 使用 Qwen Cloud"
read_when:
  - 您想在 OpenClaw 中使用 Qwen
  - 您之前使用过 Qwen OAuth
---

# Qwen

<Warning>

**Qwen OAuth 已移除。** 使用 `portal.qwen.ai` 端点的免费层 OAuth 集成
（`qwen-portal`）不再可用。
详见 [Issue #49557](https://github.com/openclaw/openclaw/issues/49557)。

</Warning>

## 推荐方式：Qwen Cloud

OpenClaw 现在将 Qwen 作为一级内置 Provider，规范 ID 为 `qwen`。内置 Provider 面向 Qwen Cloud / Alibaba DashScope 和 Coding Plan 端点，并保持旧版 `modelstudio` ID 作为兼容别名。

- Provider：`qwen`
- 首选环境变量：`QWEN_API_KEY`
- 兼容接受：`MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`
- API 风格：OpenAI 兼容

如果您需要 `qwen3.6-plus`，建议使用**标准（按量付费）**端点。Coding Plan 对公开目录的支持可能有延迟。

```bash
# 全球 Coding Plan 端点
openclaw onboard --auth-choice qwen-api-key

# 中国 Coding Plan 端点
openclaw onboard --auth-choice qwen-api-key-cn

# 全球标准（按量付费）端点
openclaw onboard --auth-choice qwen-standard-api-key

# 中国标准（按量付费）端点
openclaw onboard --auth-choice qwen-standard-api-key-cn
```

旧版 `modelstudio-*` auth-choice ID 和 `modelstudio/...` 模型引用仍可作为兼容别名使用，但新设置流程应优先使用规范的 `qwen-*` auth-choice ID 和 `qwen/...` 模型引用。

入门后，设置默认模型：

```json5
{
  agents: {
    defaults: {
      model: { primary: "qwen/qwen3.5-plus" },
    },
  },
}
```

## 计划类型和端点

| 计划                   | 区域   | Auth 选项                  | 端点                                             |
| ---------------------- | ------ | -------------------------- | ------------------------------------------------ |
| 标准（按量付费）       | 中国   | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| 标准（按量付费）       | 全球   | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan（订阅制）  | 中国   | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan（订阅制）  | 全球   | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Provider 会根据您的 auth 选项自动选择端点。规范选项使用 `qwen-*` 系列；`modelstudio-*` 仅保留用于兼容性。您可以在配置中使用自定义 `baseUrl` 覆盖端点。

原生 Model Studio 端点在共享的 `openai-completions` 传输上声明流式传输使用兼容性。OpenClaw 现在基于端点能力检测此特性，因此指向同一原生主机的 DashScope 兼容自定义 Provider ID 也会继承相同的流式传输使用行为，而不需要专门使用内置的 `qwen` Provider ID。

## 获取 API 密钥

- **管理密钥**：[home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys)
- **文档**：[docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)

## 内置目录

OpenClaw 目前内置以下 Qwen 目录：

| 模型引用                    | 输入         | 上下文    | 说明                                           |
| --------------------------- | ------------ | --------- | ---------------------------------------------- |
| `qwen/qwen3.5-plus`         | text, image  | 1,000,000 | 默认模型                                       |
| `qwen/qwen3.6-plus`         | text, image  | 1,000,000 | 需要此模型时建议使用标准端点                   |
| `qwen/qwen3-max-2026-01-23` | text         | 262,144   | Qwen Max 系列                                  |
| `qwen/qwen3-coder-next`     | text         | 262,144   | 编码                                           |
| `qwen/qwen3-coder-plus`     | text         | 1,000,000 | 编码                                           |
| `qwen/MiniMax-M2.5`         | text         | 1,000,000 | 已启用推理                                     |
| `qwen/glm-5`                | text         | 202,752   | GLM                                            |
| `qwen/glm-4.7`              | text         | 202,752   | GLM                                            |
| `qwen/kimi-k2.5`            | text, image  | 262,144   | 通过阿里巴巴的 Moonshot AI                     |

即使模型在内置目录中，其可用性仍可能因端点和计费方案而异。

原生流式传输使用兼容性适用于 Coding Plan 主机和标准 DashScope 兼容主机：

- `https://coding.dashscope.aliyuncs.com/v1`
- `https://coding-intl.dashscope.aliyuncs.com/v1`
- `https://dashscope.aliyuncs.com/compatible-mode/v1`
- `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

## Qwen 3.6 Plus 可用性

`qwen3.6-plus` 在标准（按量付费）Model Studio 端点上可用：

- 中国：`dashscope.aliyuncs.com/compatible-mode/v1`
- 全球：`dashscope-intl.aliyuncs.com/compatible-mode/v1`

如果 Coding Plan 端点对 `qwen3.6-plus` 返回"不支持的模型"错误，请切换到标准（按量付费）端点/密钥对。

## 能力规划

`qwen` 扩展正在作为完整 Qwen Cloud 服务的厂商主页定位，不仅限于编码/文本模型。

- 文本/聊天模型：已内置
- 工具调用、结构化输出、思维：继承自 OpenAI 兼容传输
- 图像生成：计划在 Provider Plugin 层实现
- 图像/视频理解：已在标准端点内置
- 语音/音频：计划在 Provider Plugin 层实现
- 内存嵌入/重排序：计划通过嵌入适配器接口实现
- 视频生成：已通过共享视频生成能力内置

## 多模态附加功能

`qwen` 扩展现在还提供：

- 通过 `qwen-vl-max-latest` 的视频理解
- 通过以下模型的 Wan 视频生成：
  - `wan2.6-t2v`（默认）
  - `wan2.6-i2v`
  - `wan2.6-r2v`
  - `wan2.6-r2v-flash`
  - `wan2.7-r2v`

这些多模态功能使用**标准** DashScope 端点，不使用 Coding Plan 端点。

- 全球/国际标准 Base URL：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- 中国标准 Base URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`

对于视频生成，OpenClaw 会在提交任务前将配置的 Qwen 区域映射到对应的 DashScope AIGC 主机：

- 全球/国际：`https://dashscope-intl.aliyuncs.com`
- 中国：`https://dashscope.aliyuncs.com`

这意味着指向 Coding Plan 或标准 Qwen 主机的普通 `models.providers.qwen.baseUrl` 仍会将视频生成保持在正确的区域 DashScope 视频端点上。

设置视频生成默认模型：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

当前内置 Qwen 视频生成限制：

- 每次请求最多 **1** 个输出视频
- 最多 **1** 张输入图像
- 最多 **4** 个输入视频
- 最长 **10 秒**时长
- 支持 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark`
- 参考图像/视频模式目前需要**远程 http(s) URL**。本地文件路径会被直接拒绝，因为 DashScope 视频端点不接受上传的本地缓冲区作为这些引用。

请参见[视频生成](/tools/video-generation)了解共享工具参数、Provider 选择和故障转移行为。

## 环境注意事项

如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `QWEN_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
