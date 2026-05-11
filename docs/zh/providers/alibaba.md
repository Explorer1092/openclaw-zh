---
mmh3_hash: "d295dfe5f21a844d0314c210c4645c2f"
title: "Alibaba Model Studio"
summary: "在 OpenClaw 中使用 Alibaba Model Studio Wan 视频生成"
read_when:
  - 您想在 OpenClaw 中使用 Alibaba Wan 视频生成
  - 您需要为视频生成设置 Model Studio 或 DashScope API 密钥
---

OpenClaw 内置了一个 `alibaba` Plugin，为 Alibaba Model Studio（DashScope 的国际名称）上的 Wan 模型注册了视频生成 Provider。Plugin 默认启用；您只需设置 API 密钥。

| 属性             | 值                                                                              |
| ---------------- | ------------------------------------------------------------------------------- |
| Provider id      | `alibaba`                                                                       |
| Plugin           | bundled, `enabledByDefault: true`                                               |
| 认证环境变量     | `MODELSTUDIO_API_KEY` → `DASHSCOPE_API_KEY` → `QWEN_API_KEY`（取第一个非空值） |
| Onboarding flag  | `--auth-choice alibaba-model-studio-api-key`                                    |
| 直接 CLI 标志    | `--alibaba-model-studio-api-key <key>`                                          |
| 默认模型         | `alibaba/wan2.6-t2v`                                                            |
| 默认 Base URL    | `https://dashscope-intl.aliyuncs.com`                                           |

## 快速开始

<Steps>
  <Step title="设置 API 密钥">
    使用引导程序将密钥存储到 `alibaba` Provider：

    ```bash
    openclaw onboard --auth-choice alibaba-model-studio-api-key
    ```

    或在安装/引导时直接传入密钥：

    ```bash
    openclaw onboard --alibaba-model-studio-api-key <your-key>
    ```

    或在启动 Gateway 之前导出任何接受的环境变量：

    ```bash
    export MODELSTUDIO_API_KEY=sk-...
    # 或 DASHSCOPE_API_KEY=...
    # 或 QWEN_API_KEY=...
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
  <Step title="验证 Provider 是否已配置">
    ```bash
    openclaw models list --provider alibaba
    ```

    列表应包含所有五个内置 Wan 模型。如果 `MODELSTUDIO_API_KEY` 未解析，`openclaw models status --json` 会在 `auth.unusableProfiles` 下报告缺失的凭据。

  </Step>
</Steps>

<Note>
  Alibaba Plugin 和 [Qwen Plugin](/providers/qwen) 都对 DashScope 进行认证并接受重叠的环境变量。使用 `alibaba/...` 模型 id 来驱动专用的 Wan 视频接口；使用 `qwen/...` id 来获取 Qwen 的聊天、Embedding 或媒体理解接口。
</Note>

## 内置 Wan 模型

| 模型引用                   | 模式                          |
| -------------------------- | ----------------------------- |
| `alibaba/wan2.6-t2v`       | 文本到视频（默认）            |
| `alibaba/wan2.6-i2v`       | 图像到视频                    |
| `alibaba/wan2.6-r2v`       | 参考到视频                    |
| `alibaba/wan2.6-r2v-flash` | 参考到视频（快速）            |
| `alibaba/wan2.7-r2v`       | 参考到视频                    |

## 功能和限制

内置 Provider 反映了 DashScope 的 Wan 视频 API 限制。所有三种模式共享相同的每请求视频数量和时长限制；仅输入形状不同。

| 模式           | 最大输出视频数 | 最大输入图像数 | 最大输入视频数 | 最大时长 | 支持的控制参数                                            |
| -------------- | -------------- | -------------- | -------------- | -------- | --------------------------------------------------------- |
| 文本到视频     | 1              | n/a            | n/a            | 10 秒    | `size`、`aspectRatio`、`resolution`、`audio`、`watermark` |
| 图像到视频     | 1              | 1              | n/a            | 10 秒    | `size`、`aspectRatio`、`resolution`、`audio`、`watermark` |
| 参考到视频     | 1              | n/a            | 4              | 10 秒    | `size`、`aspectRatio`、`resolution`、`audio`、`watermark` |

当请求省略 `durationSeconds` 时，Provider 发送 DashScope 接受的默认值 **5 秒**。在[视频生成工具](/tools/video-generation)上显式设置 `durationSeconds` 可延长至最多 10 秒。

<Warning>
  参考图像和视频输入必须是远程 `http(s)` URL。DashScope 的参考模式不接受本地文件路径；请先上传到对象存储，或使用已生成公共 URL 的[媒体工具](/tools/media-overview)流程。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="覆盖 DashScope Base URL">
    该 Provider 默认使用国际 DashScope 端点。要指向中国区端点，请设置：

    ```json5
    {
      models: {
        providers: {
          alibaba: {
            baseUrl: "https://dashscope.aliyuncs.com",
          },
        },
      },
    }
    ```

    Provider 在构建 AIGC 任务 URL 之前会去除尾部斜杠。

  </Accordion>

  <Accordion title="认证环境变量优先级">
    OpenClaw 按以下顺序从环境变量解析 Alibaba API 密钥，取第一个非空值：

    1. `MODELSTUDIO_API_KEY`
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    通过 `openclaw models auth login` 设置的配置 `auth.profiles` 条目会覆盖环境变量解析。有关配置轮换、冷却时间和覆盖机制，请参见[模型 FAQ 中的认证配置文件](/help/faq-models#what-is-an-auth-profile)。

  </Accordion>

  <Accordion title="与 Qwen Plugin 的关系">
    两个内置 Plugin 都与 DashScope 通信并接受重叠的 API 密钥。请使用：

    - `alibaba/wan*.*` id 来驱动此页面记录的专用 Wan 视频 Provider。
    - `qwen/*` id 用于 Qwen 聊天、Embedding 和媒体理解（参见 [Qwen](/providers/qwen)）。

    设置一次 `MODELSTUDIO_API_KEY` 即可同时对两个 Plugin 进行认证，因为认证环境变量列表故意重叠；您无需分别引导每个 Plugin。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    共享视频工具参数和 Provider 选择。
  </Card>
  <Card title="Qwen" href="/providers/qwen" icon="microchip">
    在同一 DashScope 认证下的 Qwen 聊天、Embedding 和媒体理解设置。
  </Card>
  <Card title="配置参考" href="/gateway/config-agents#agent-defaults" icon="gear">
    Agent 默认值和模型配置。
  </Card>
  <Card title="模型 FAQ" href="/help/faq-models" icon="circle-question">
    认证配置文件、切换模型和解决"无配置文件"错误。
  </Card>
</CardGroup>
