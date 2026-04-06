---
mmh3_hash: "2bef51d3cf514c292e1e50d34d3117d6"
title: "Alibaba Model Studio"
summary: "在 OpenClaw 中使用 Alibaba Model Studio Wan 视频生成"
read_when:
  - 您想在 OpenClaw 中使用 Alibaba Wan 视频生成
  - 您需要为视频生成设置 Model Studio 或 DashScope API 密钥
---

# Alibaba Model Studio

OpenClaw 内置了一个 `alibaba` 视频生成 Provider，用于在 Alibaba Model Studio / DashScope 上运行 Wan 模型。

- Provider：`alibaba`
- 首选身份验证：`MODELSTUDIO_API_KEY`
- 也接受：`DASHSCOPE_API_KEY`、`QWEN_API_KEY`
- API：DashScope / Model Studio 异步视频生成

## 快速开始

1. 设置 API 密钥：

```bash
openclaw onboard --auth-choice qwen-standard-api-key
```

2. 设置默认视频模型：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "alibaba/wan2.6-t2v",
      },
    },
  },
}
```

## 内置 Wan 模型

内置的 `alibaba` Provider 目前注册了：

- `alibaba/wan2.6-t2v`
- `alibaba/wan2.6-i2v`
- `alibaba/wan2.6-r2v`
- `alibaba/wan2.6-r2v-flash`
- `alibaba/wan2.7-r2v`

## 当前限制

- 每次请求最多输出 **1** 个视频
- 最多 **1** 张输入图片
- 最多 **4** 个输入视频
- 最长 **10 秒**时长
- 支持 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark`
- 参考图片/视频模式目前需要**远程 http(s) URL**

## 与 Qwen 的关系

内置的 `qwen` Provider 也使用 Alibaba 托管的 DashScope 端点进行 Wan 视频生成。使用建议：

- 当您想使用标准 Qwen Provider 界面时，使用 `qwen/...`
- 当您想使用供应商直接拥有的 Wan 视频界面时，使用 `alibaba/...`

## 相关链接

- [视频生成](/tools/video-generation)
- [Qwen](/providers/qwen)
- [配置参考](/gateway/configuration-reference#agent-defaults)
