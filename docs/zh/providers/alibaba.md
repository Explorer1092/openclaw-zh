---
mmh3_hash: "676ce465e9b8ab1dcb6cb3f47534bb2b"
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

<Steps>
  <Step title="设置 API 密钥">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="设置默认视频模型">
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
  </Step>
  <Step title="验证 Provider 是否可用">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
任何已接受的身份验证密钥（`MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`、`QWEN_API_KEY`）都可以使用。`qwen-standard-api-key` 入门选项配置共享的 DashScope 凭据。
</Note>

## 内置 Wan 模型

内置的 `alibaba` Provider 目前注册了：

| 模型引用                       | 模式                      |
| ------------------------------ | ------------------------- |
| `alibaba/wan2.6-t2v`           | 文本到视频                |
| `alibaba/wan2.6-i2v`           | 图像到视频                |
| `alibaba/wan2.6-r2v`           | 参考到视频                |
| `alibaba/wan2.6-r2v-flash`     | 参考到视频（快速）        |
| `alibaba/wan2.7-r2v`           | 参考到视频                |

## 当前限制

| 参数               | 限制                                                      |
| ------------------ | --------------------------------------------------------- |
| 输出视频           | 每次请求最多 **1** 个                                     |
| 输入图像           | 最多 **1** 张                                             |
| 输入视频           | 最多 **4** 个                                             |
| 时长               | 最长 **10 秒**                                            |
| 支持的控制项       | `size`、`aspectRatio`、`resolution`、`audio`、`watermark` |
| 参考图像/视频      | 仅限远程 `http(s)` URL                                    |

<Warning>
参考图像/视频模式目前需要**远程 http(s) URL**。本地文件路径不支持作为参考输入。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="与 Qwen 的关系">
    内置的 `qwen` Provider 也使用 Alibaba 托管的 DashScope 端点进行 Wan 视频生成。使用建议：

    - 当您想使用标准 Qwen Provider 界面时，使用 `qwen/...`
    - 当您想使用供应商直接拥有的 Wan 视频界面时，使用 `alibaba/...`

    详情请参见 [Qwen Provider 文档](/providers/qwen)。

  </Accordion>

  <Accordion title="身份验证密钥优先级">
    OpenClaw 按以下顺序检查身份验证密钥：

    1. `MODELSTUDIO_API_KEY`（首选）
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    这些密钥中任何一个都可以对 `alibaba` Provider 进行身份验证。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    共享视频工具参数和 Provider 选择。
  </Card>
  <Card title="Qwen" href="/providers/qwen" icon="microchip">
    Qwen Provider 设置和 DashScope 集成。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference#agent-defaults" icon="gear">
    Agent 默认值和模型配置。
  </Card>
</CardGroup>
