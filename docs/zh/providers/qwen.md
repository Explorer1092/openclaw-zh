---
title: "Qwen"
mmh3_hash: "0e62062096344343f52bd72a2ccfe820"
summary: "通过 OpenClaw 内置 qwen Provider 使用 Qwen Cloud"
read_when:
  - 您想在 OpenClaw 中使用 Qwen
  - 您之前使用过 Qwen OAuth
---

<Warning>

**Qwen OAuth 已移除。** 使用 `portal.qwen.ai` 端点的免费层 OAuth 集成
（`qwen-portal`）不再可用。
详见 [Issue #49557](https://github.com/openclaw/openclaw/issues/49557)。

</Warning>

OpenClaw 现在将 Qwen 作为一级内置 Provider，规范 ID 为 `qwen`。内置 Provider 面向 Qwen Cloud / Alibaba DashScope 和 Coding Plan 端点，并保持旧版 `modelstudio` ID 作为兼容别名。

- Provider：`qwen`
- 首选环境变量：`QWEN_API_KEY`
- 兼容接受：`MODELSTUDIO_API_KEY`、`DASHSCOPE_API_KEY`
- API 风格：OpenAI 兼容

<Tip>
如果您需要 `qwen3.6-plus`，建议使用**标准（按量付费）**端点。Coding Plan 对公开目录的支持可能有延迟。
</Tip>

## 快速开始

选择您的计划类型并按照设置步骤操作。

<Tabs>
  <Tab title="Coding Plan（订阅制）">
    **适合：** 通过 Qwen Coding Plan 进行订阅式访问。

    <Steps>
      <Step title="获取 API 密钥">
        在 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制 API 密钥。
      </Step>
      <Step title="运行入门">
        **全球**端点：

        ```bash
        openclaw onboard --auth-choice qwen-api-key
        ```

        **中国**端点：

        ```bash
        openclaw onboard --auth-choice qwen-api-key-cn
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    旧版 `modelstudio-*` auth-choice ID 和 `modelstudio/...` 模型引用仍可作为兼容别名使用，但新设置流程应优先使用规范的 `qwen-*` auth-choice ID 和 `qwen/...` 模型引用。如果您定义了具有其他 `api` 值的精确自定义 `models.providers.modelstudio` 条目，该自定义 Provider 将拥有 `modelstudio/...` 引用，而非 Qwen 兼容别名。
    </Note>

  </Tab>

  <Tab title="标准（按量付费）">
    **适合：** 通过标准 Model Studio 端点按量付费访问，包括 Coding Plan 上可能不可用的模型（如 `qwen3.6-plus`）。

    <Steps>
      <Step title="获取 API 密钥">
        在 [home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) 创建或复制 API 密钥。
      </Step>
      <Step title="运行入门">
        **全球**端点：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key
        ```

        **中国**端点：

        ```bash
        openclaw onboard --auth-choice qwen-standard-api-key-cn
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "qwen/qwen3.5-plus" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider qwen
        ```
      </Step>
    </Steps>

    <Note>
    旧版 `modelstudio-*` auth-choice ID 和 `modelstudio/...` 模型引用仍可作为兼容别名使用，但新设置流程应优先使用规范的 `qwen-*` auth-choice ID 和 `qwen/...` 模型引用。如果您定义了具有其他 `api` 值的精确自定义 `models.providers.modelstudio` 条目，该自定义 Provider 将拥有 `modelstudio/...` 引用，而非 Qwen 兼容别名。
    </Note>

  </Tab>
</Tabs>

## 计划类型和端点

| 计划                   | 区域   | Auth 选项                  | 端点                                             |
| ---------------------- | ------ | -------------------------- | ------------------------------------------------ |
| 标准（按量付费）       | 中国   | `qwen-standard-api-key-cn` | `dashscope.aliyuncs.com/compatible-mode/v1`      |
| 标准（按量付费）       | 全球   | `qwen-standard-api-key`    | `dashscope-intl.aliyuncs.com/compatible-mode/v1` |
| Coding Plan（订阅制）  | 中国   | `qwen-api-key-cn`          | `coding.dashscope.aliyuncs.com/v1`               |
| Coding Plan（订阅制）  | 全球   | `qwen-api-key`             | `coding-intl.dashscope.aliyuncs.com/v1`          |

Provider 会根据您的 auth 选项自动选择端点。规范选项使用 `qwen-*` 系列；`modelstudio-*` 仅保留用于兼容性。您可以在配置中使用自定义 `baseUrl` 覆盖端点。

<Tip>
**管理密钥**：[home.qwencloud.com/api-keys](https://home.qwencloud.com/api-keys) |
**文档**：[docs.qwencloud.com](https://docs.qwencloud.com/developer-guides/getting-started/introduction)
</Tip>

## 内置目录

OpenClaw 目前内置以下 Qwen 目录。已配置的目录具有端点感知能力：Coding Plan 配置会省略仅已知在标准端点上可用的模型。

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

<Note>
即使模型在内置目录中，其可用性仍可能因端点和计费方案而异。
</Note>

## 思考控件

对于支持推理的 Qwen Cloud 模型，内置 Provider 会将 OpenClaw 思考级别映射到 DashScope 的顶级 `enable_thinking` 请求标志。禁用思考时发送 `enable_thinking: false`；其他思考级别发送 `enable_thinking: true`。

## 多模态附加功能

`qwen` 扩展还在**标准** DashScope 端点（非 Coding Plan 端点）上提供多模态功能：

- 通过 `qwen-vl-max-latest` 的**视频理解**
- 通过 `wan2.6-t2v`（默认）、`wan2.6-i2v`、`wan2.6-r2v`、`wan2.6-r2v-flash`、`wan2.7-r2v` 的 **Wan 视频生成**

将 Qwen 设置为默认视频 Provider：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "qwen/wan2.6-t2v" },
    },
  },
}
```

<Note>
有关共享工具参数、Provider 选择和故障转移行为，请参见[视频生成](/tools/video-generation)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="图像和视频理解">
    内置 Qwen Plugin 在**标准** DashScope 端点（非 Coding Plan 端点）上注册了图像和视频的媒体理解能力。

    | 属性          | 值                    |
    | ------------- | --------------------- |
    | 模型          | `qwen-vl-max-latest`  |
    | 支持的输入    | 图像、视频            |

    媒体理解会从已配置的 Qwen 身份验证中自动解析——无需额外配置。请确保使用标准（按量付费）端点以支持媒体理解。

  </Accordion>

  <Accordion title="Qwen 3.6 Plus 可用性">
    `qwen3.6-plus` 在标准（按量付费）Model Studio 端点上可用：

    - 中国：`dashscope.aliyuncs.com/compatible-mode/v1`
    - 全球：`dashscope-intl.aliyuncs.com/compatible-mode/v1`

    如果 Coding Plan 端点对 `qwen3.6-plus` 返回"不支持的模型"错误，请切换到标准（按量付费）端点/密钥对。

    OpenClaw 内置 Qwen 目录不在 Coding Plan 端点上发布 `qwen3.6-plus`，但在 `models.providers.qwen.models` 下显式配置的 `qwen/qwen3.6-plus` 条目会在 Coding Plan baseUrl 上生效，因此如果阿里云为您的订阅启用了该模型，您可以选择加入。上游 API 仍决定调用是否成功。

  </Accordion>

  <Accordion title="能力规划">
    `qwen` 扩展正在作为完整 Qwen Cloud 服务的厂商主页定位，不仅限于编码/文本模型。

    - **文本/聊天模型**：已内置
    - **工具调用、结构化输出、思维**：继承自 OpenAI 兼容传输
    - **图像生成**：计划在 Provider Plugin 层实现
    - **图像/视频理解**：已在标准端点内置
    - **语音/音频**：计划在 Provider Plugin 层实现
    - **Memory 嵌入/重排序**：计划通过嵌入适配器接口实现
    - **视频生成**：已通过共享视频生成能力内置

  </Accordion>

  <Accordion title="视频生成详情">
    对于视频生成，OpenClaw 会在提交任务前将配置的 Qwen 区域映射到对应的 DashScope AIGC 主机：

    - 全球/国际：`https://dashscope-intl.aliyuncs.com`
    - 中国：`https://dashscope.aliyuncs.com`

    这意味着指向 Coding Plan 或标准 Qwen 主机的普通 `models.providers.qwen.baseUrl` 仍会将视频生成保持在正确的区域 DashScope 视频端点上。

    当前内置 Qwen 视频生成限制：

    - 每次请求最多 **1** 个输出视频
    - 最多 **1** 张输入图像
    - 最多 **4** 个输入视频
    - 最长 **10 秒**时长
    - 支持 `size`、`aspectRatio`、`resolution`、`audio` 和 `watermark`
    - 参考图像/视频模式目前需要**远程 http(s) URL**。本地文件路径会被直接拒绝，因为 DashScope 视频端点不接受上传的本地缓冲区作为这些引用。

  </Accordion>

  <Accordion title="流式传输使用兼容性">
    原生 Model Studio 端点在共享的 `openai-completions` 传输上声明流式传输使用兼容性。OpenClaw 现在基于端点能力检测此特性，因此指向同一原生主机的 DashScope 兼容自定义 Provider ID 也会继承相同的流式传输使用行为，而不需要专门使用内置的 `qwen` Provider ID。

    原生流式传输使用兼容性适用于 Coding Plan 主机和标准 DashScope 兼容主机：

    - `https://coding.dashscope.aliyuncs.com/v1`
    - `https://coding-intl.dashscope.aliyuncs.com/v1`
    - `https://dashscope.aliyuncs.com/compatible-mode/v1`
    - `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="多模态端点区域">
    多模态功能（视频理解和 Wan 视频生成）使用**标准** DashScope 端点，而非 Coding Plan 端点：

    - 全球/国际标准 Base URL：`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
    - 中国标准 Base URL：`https://dashscope.aliyuncs.com/compatible-mode/v1`

  </Accordion>

  <Accordion title="环境和守护进程设置">
    如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `QWEN_API_KEY` 对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    共享视频工具参数和 Provider 选择。
  </Card>
  <Card title="Alibaba（ModelStudio）" href="/providers/alibaba" icon="cloud">
    旧版 ModelStudio Provider 和迁移说明。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常规故障排除和 FAQ。
  </Card>
</CardGroup>
