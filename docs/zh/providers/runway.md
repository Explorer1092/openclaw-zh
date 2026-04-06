---
mmh3_hash: "0318660e9a841d6fbc4939982dea780d"
title: "Runway"
summary: "在 OpenClaw 中设置 Runway 视频生成"
read_when:
  - 您想在 OpenClaw 中使用 Runway 视频生成
  - 您需要 Runway API 密钥/环境设置
  - 您想将 Runway 设置为默认视频 Provider
---

# Runway

OpenClaw 内置了一个 `runway` Provider，用于托管的视频生成。

- Provider id：`runway`
- 身份验证：`RUNWAYML_API_SECRET`（标准）或 `RUNWAY_API_KEY`
- API：Runway 基于任务的视频生成（`GET /v1/tasks/{id}` 轮询）

## 快速开始

1. 设置 API 密钥：

```bash
openclaw onboard --auth-choice runway-api-key
```

2. 将 Runway 设置为默认视频 Provider：

```bash
openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
```

3. 要求 Agent 生成视频。Runway 将自动被使用。

## 支持的模式

| 模式           | 模型               | 参考输入                 |
| -------------- | ------------------ | ------------------------ |
| 文本到视频     | `gen4.5`（默认）   | 无                       |
| 图像到视频     | `gen4.5`           | 1 张本地或远程图像       |
| 视频到视频     | `gen4_aleph`       | 1 个本地或远程视频       |

- 本地图像和视频参考通过数据 URI 支持。
- 视频到视频目前需要专门使用 `runway/gen4_aleph`。
- 纯文本运行目前支持 `16:9` 和 `9:16` 宽高比。

## 配置

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## 相关链接

- [视频生成](/tools/video-generation) -- 共享工具参数、Provider 选择和异步行为
- [配置参考](/gateway/configuration-reference#agent-defaults)
