---
mmh3_hash: "95e8c9f652b34e9dfd8a4c9859d8e261"
summary: "通过 image_generate 使用 OpenAI、Google、fal、MiniMax、ComfyUI、DeepInfra、OpenRouter、LiteLLM、xAI、Vydra 生成和编辑图像"
read_when:
  - 通过 Agent 生成或编辑图像
  - 配置图像生成提供商和模型
  - 了解 image_generate 工具参数
title: "Image generation"
sidebarTitle: "Image generation"
---

`image_generate` 工具让 Agent 能够使用你已配置的提供商创建和编辑图像。在聊天 Session 中，图像生成以异步方式运行：OpenClaw 记录后台任务，立即返回任务 id，并在提供商完成时唤醒 Agent。完成 Agent 必须通过 `message` 工具发送生成的图像。如果请求者 Session 已不活跃且部分生成的图像仍未通过 message 工具投递，OpenClaw 会以幂等方式直接发送仅包含缺失图像的回退投递。

<Note>
该工具仅在至少一个图像生成提供商可用时才会显示。如果你在 Agent 工具列表中看不到 `image_generate`，请配置 `agents.defaults.imageGenerationModel`、设置提供商 API 密钥，或通过 OpenAI Codex OAuth 登录。
</Note>

## 快速入门

<Steps>
  <Step title="配置认证">
    为至少一个提供商设置 API 密钥（例如 `OPENAI_API_KEY`、`GEMINI_API_KEY`、`OPENROUTER_API_KEY`）或通过 OpenAI Codex OAuth 登录。
  </Step>
  <Step title="选择默认模型（可选）">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openai/gpt-image-2",
            timeoutMs: 180_000,
          },
        },
      },
    }
    ```

    Codex OAuth 使用相同的 `openai/gpt-image-2` 模型引用。配置 `openai-codex` OAuth 配置文件后，OpenClaw 通过该 OAuth 配置文件路由图像请求，而非先尝试 `OPENAI_API_KEY`。显式的 `models.providers.openai` 配置（API 密钥、自定义/Azure 基础 URL）会切换回直接 OpenAI 图像 API 路由。

  </Step>
  <Step title="向 Agent 提问">
    _"生成一张友好的机器人吉祥物图片。"_

    Agent 会自动调用 `image_generate`。无需设置工具允许列表——当提供商可用时默认启用。工具返回后台任务 id，完成 Agent 在图像准备好后通过 `message` 工具发送生成的附件。

  </Step>
</Steps>

<Warning>
对于 LocalAI 等 OpenAI 兼容的 LAN 端点，请保留自定义 `models.providers.openai.baseUrl` 并显式通过 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` 选择加入。私有和内部图像端点默认被阻止。
</Warning>

## 常用路由

| 目标                                  | 模型引用                                           | 认证                                   |
| ------------------------------------- | -------------------------------------------------- | -------------------------------------- |
| OpenAI 图像生成（API 计费）           | `openai/gpt-image-2`                               | `OPENAI_API_KEY`                       |
| OpenAI 图像生成（Codex 订阅认证）     | `openai/gpt-image-2`                               | OpenAI Codex OAuth                     |
| OpenAI 透明背景 PNG/WebP              | `openai/gpt-image-1.5`                             | `OPENAI_API_KEY` 或 OpenAI Codex OAuth |
| DeepInfra 图像生成                    | `deepinfra/black-forest-labs/FLUX-1-schnell`       | `DEEPINFRA_API_KEY`                    |
| OpenRouter 图像生成                   | `openrouter/google/gemini-3.1-flash-image-preview` | `OPENROUTER_API_KEY`                   |
| LiteLLM 图像生成                      | `litellm/gpt-image-2`                              | `LITELLM_API_KEY`                      |
| Google Gemini 图像生成                | `google/gemini-3.1-flash-image-preview`            | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`   |

同一 `image_generate` 工具处理文本生成图像和参考图像编辑。使用 `image` 传入一张参考图，或使用 `images` 传入多张。提供商支持的输出提示（如 `quality`、`outputFormat` 和 `background`）在可用时会被转发，不支持时会在工具结果中报告为已忽略。捆绑的透明背景支持是 OpenAI 专属的；如果其他提供商后端支持 PNG alpha，它们可能仍会保留透明度。

## 支持的提供商

| 提供商     | 默认模型                                | 编辑支持                           | 认证                                                  |
| ---------- | --------------------------------------- | ---------------------------------- | ----------------------------------------------------- |
| ComfyUI    | `workflow`                              | 是（1 张图像，工作流配置）         | `COMFY_API_KEY` 或云端的 `COMFY_CLOUD_API_KEY`        |
| DeepInfra  | `black-forest-labs/FLUX-1-schnell`      | 是（1 张图像）                     | `DEEPINFRA_API_KEY`                                   |
| fal        | `fal-ai/flux/dev`                       | 是（模型特定限制）                 | `FAL_KEY`                                             |
| Google     | `gemini-3.1-flash-image-preview`        | 是                                 | `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`                  |
| LiteLLM    | `gpt-image-2`                           | 是（最多 5 张输入图像）            | `LITELLM_API_KEY`                                     |
| MiniMax    | `image-01`                              | 是（主体参考）                     | `MINIMAX_API_KEY` 或 MiniMax OAuth（`minimax-portal`） |
| OpenAI     | `gpt-image-2`                           | 是（最多 4 张图像）                | `OPENAI_API_KEY` 或 OpenAI Codex OAuth                |
| OpenRouter | `google/gemini-3.1-flash-image-preview` | 是（最多 5 张输入图像）            | `OPENROUTER_API_KEY`                                  |
| Vydra      | `grok-imagine`                          | 否                                 | `VYDRA_API_KEY`                                       |
| xAI        | `grok-imagine-image`                    | 是（最多 5 张图像）                | `XAI_API_KEY`                                         |

使用 `action: "list"` 在运行时查看可用提供商和模型：

```text
/tool image_generate action=list
```

使用 `action: "status"` 查看当前 Session 的活跃图像生成任务：

```text
/tool image_generate action=status
```

## 提供商能力

| 能力                  | ComfyUI            | DeepInfra | fal                        | Google         | MiniMax               | OpenAI         | Vydra | xAI            |
| --------------------- | ------------------ | --------- | -------------------------- | -------------- | --------------------- | -------------- | ----- | -------------- |
| 生成（最大数量）      | 工作流定义         | 4         | 4                          | 4              | 9                     | 4              | 1     | 4              |
| 编辑/参考             | 1 张图像（工作流） | 1 张图像  | Flux：1；GPT：10；NB2：14  | 最多 5 张图像  | 1 张图像（主体参考）  | 最多 5 张图像  | —     | 最多 5 张图像  |
| 尺寸控制              | —                  | ✓         | ✓                          | ✓              | —                     | 最多 4K        | —     | —              |
| 宽高比                | —                  | —         | ✓                          | ✓              | ✓                     | —              | —     | ✓              |
| 分辨率（1K/2K/4K）    | —                  | —         | ✓                          | ✓              | —                     | —              | —     | 1K、2K         |

## 工具参数

<ParamField path="prompt" type="string" required>
  图像生成提示词。`action: "generate"` 时必填。
</ParamField>
<ParamField path="action" type='"generate" | "status" | "list"' default="generate">
  使用 `"status"` 查看当前 Session 的活跃任务，或使用 `"list"` 在运行时查看可用提供商和模型。
</ParamField>
<ParamField path="model" type="string">
  提供商/模型覆盖（例如 `openai/gpt-image-2`）。使用 `openai/gpt-image-1.5` 获得透明 OpenAI 背景。
</ParamField>
<ParamField path="image" type="string">
  编辑模式的单张参考图像路径或 URL。
</ParamField>
<ParamField path="images" type="string[]">
  编辑模式的多张参考图像（支持的提供商最多 5 张）。
</ParamField>
<ParamField path="size" type="string">
  尺寸提示：`1024x1024`、`1536x1024`、`1024x1536`、`2048x2048`、`3840x2160`。
</ParamField>
<ParamField path="aspectRatio" type="string">
  宽高比：`1:1`、`2:3`、`3:2`、`3:4`、`4:3`、`4:5`、`5:4`、`9:16`、`16:9`、`21:9`。
</ParamField>
<ParamField path="resolution" type='"1K" | "2K" | "4K"'>分辨率提示。</ParamField>
<ParamField path="quality" type='"low" | "medium" | "high" | "auto"'>
  提供商支持时的质量提示。
</ParamField>
<ParamField path="outputFormat" type='"png" | "jpeg" | "webp"'>
  提供商支持时的输出格式提示。
</ParamField>
<ParamField path="background" type='"transparent" | "opaque" | "auto"'>
  提供商支持时的背景提示。将 `transparent` 与 `outputFormat: "png"` 或 `"webp"` 结合用于支持透明度的提供商。
</ParamField>
<ParamField path="count" type="number">生成图像数量（1–4）。</ParamField>
<ParamField path="timeoutMs" type="number">可选的提供商请求超时（毫秒）。当 Codex 通过动态工具调用 `image_generate` 时，此每次调用值仍会覆盖已配置的默认值，并上限为 600000 ms。</ParamField>
<ParamField path="filename" type="string">输出文件名提示。</ParamField>
<ParamField path="openai" type="object">
  OpenAI 专属提示：`background`、`moderation`、`outputCompression` 和 `user`。
</ParamField>

<Note>
并非所有提供商都支持所有参数。当回退提供商支持近似的几何选项而非确切请求的选项时，OpenClaw 在提交前会重新映射到最近支持的尺寸、宽高比或分辨率。不受支持的输出提示会在工具结果中针对未声明支持的提供商被丢弃并报告。工具结果会报告应用的设置；`details.normalization` 记录请求到应用的转换。
</Note>

## 配置

### 模型选择

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        timeoutMs: 180_000,
        fallbacks: [
          "openrouter/google/gemini-3.1-flash-image-preview",
          "google/gemini-3.1-flash-image-preview",
          "fal/fal-ai/flux/dev",
        ],
      },
    },
  },
}
```

### 提供商选择顺序

OpenClaw 按以下顺序尝试提供商：

1. **`model` 参数** — 来自工具调用（如果 Agent 指定了一个）。
2. **`imageGenerationModel.primary`** — 来自配置。
3. **`imageGenerationModel.fallbacks`** — 按顺序尝试。
4. **自动检测** — 仅使用已认证的提供商默认值：
   - 当前默认提供商优先；
   - 按提供商 ID 顺序排列的剩余已注册图像生成提供商。

如果某个提供商失败（认证错误、速率限制等），会自动尝试下一个候选提供商。如果全部失败，错误信息会包含每次尝试的详情。

<AccordionGroup>
  <Accordion title="每次调用的模型覆盖是精确的">
    每次调用的 `model` 覆盖仅尝试该提供商/模型，不会继续到已配置的 primary/fallback 或自动检测的提供商。
  </Accordion>
  <Accordion title="自动检测是认证感知的">
    只有 OpenClaw 能够实际验证该提供商时，提供商默认值才会进入候选列表。设置 `agents.defaults.mediaGenerationAutoProviderFallback: false` 以仅使用显式 `model`、`primary` 和 `fallbacks` 条目。
  </Accordion>
  <Accordion title="超时">
    为慢速图像后端设置 `agents.defaults.imageGenerationModel.timeoutMs`。每次调用的 `timeoutMs` 工具参数会覆盖已配置的默认值，已配置的默认值会覆盖 Plugin 编写的提供商默认值。Google 和 OpenRouter 托管图像提供商默认使用 180 秒；xAI 和 Azure OpenAI 图像生成默认使用 600 秒。Codex 动态工具调用使用 120 秒的 `image_generate` 桥接默认值，并在已配置时遵循相同的超时预算，以 OpenClaw 的 600000 ms 动态工具桥接最大值为上限。
  </Accordion>
  <Accordion title="运行时检查">
    使用 `action: "list"` 查看当前已注册的提供商、其默认模型及认证环境变量提示。
  </Accordion>
</AccordionGroup>

### 图像编辑

OpenAI、OpenRouter、Google、DeepInfra、fal、MiniMax、ComfyUI 和 xAI 支持编辑参考图像。传入参考图像路径或 URL：

```text
"Generate a watercolor version of this photo" + image: "/path/to/photo.jpg"
```

OpenAI、OpenRouter、Google 和 xAI 通过 `images` 参数支持最多 5 张参考图像。fal 的 Flux 图像到图像支持 1 张，GPT Image 2 编辑最多支持 10 张，Nano Banana 2 编辑最多支持 14 张。DeepInfra、MiniMax 和 ComfyUI 支持 1 张。

## 提供商深入介绍

<AccordionGroup>
  <Accordion title="OpenAI gpt-image-2（和 gpt-image-1.5）">
    OpenAI 图像生成默认使用 `openai/gpt-image-2`。如果配置了 `openai-codex` OAuth 配置文件，OpenClaw 会复用 Codex 订阅聊天模型使用的相同 OAuth 配置文件，并通过 Codex Responses 后端发送图像请求。旧版 Codex 基础 URL（如 `https://chatgpt.com/backend-api`）会被规范化为图像请求的 `https://chatgpt.com/backend-api/codex`。OpenClaw **不会**静默地回退到 `OPENAI_API_KEY`——要强制直接 OpenAI 图像 API 路由，请使用 API 密钥、自定义基础 URL 或 Azure 端点显式配置 `models.providers.openai`。

    `openai/gpt-image-1.5`、`openai/gpt-image-1` 和 `openai/gpt-image-1-mini` 模型仍可显式选择。使用 `gpt-image-1.5` 获得透明背景 PNG/WebP 输出；当前的 `gpt-image-2` API 会拒绝 `background: "transparent"`。

    `gpt-image-2` 通过同一 `image_generate` 工具支持文本生成图像和参考图像编辑。OpenClaw 将 `prompt`、`count`、`size`、`quality`、`outputFormat` 和参考图像转发给 OpenAI。OpenAI **不**直接接收 `aspectRatio` 或 `resolution`；OpenClaw 会尽可能将其映射到支持的 `size`，否则工具结果会将其报告为已忽略的覆盖。

    OpenAI 专属选项位于 `openai` 对象下：

    ```json
    {
      "quality": "low",
      "outputFormat": "jpeg",
      "openai": {
        "background": "opaque",
        "moderation": "low",
        "outputCompression": 60,
        "user": "end-user-42"
      }
    }
    ```

    `openai.background` 接受 `transparent`、`opaque` 或 `auto`；透明输出需要 `outputFormat` 为 `png` 或 `webp` 以及支持透明度的 OpenAI 图像模型。OpenClaw 将默认 `gpt-image-2` 透明背景请求路由到 `gpt-image-1.5`。`openai.outputCompression` 适用于 JPEG/WebP 输出。

    顶层 `background` 提示是提供商中立的，当前在选择 OpenAI 提供商时映射到相同的 OpenAI `background` 请求字段。不声明背景支持的提供商会在 `ignoredOverrides` 中返回它，而不是接收不受支持的参数。

    要通过 Azure OpenAI 部署而非 `api.openai.com` 路由 OpenAI 图像生成，请参见 [Azure OpenAI 端点](/providers/openai#azure-openai-endpoints)。

  </Accordion>
  <Accordion title="OpenRouter 图像模型">
    OpenRouter 图像生成使用相同的 `OPENROUTER_API_KEY`，通过 OpenRouter 的聊天补全图像 API 路由。使用 `openrouter/` 前缀选择 OpenRouter 图像模型：

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "openrouter/google/gemini-3.1-flash-image-preview",
          },
        },
      },
    }
    ```

    OpenClaw 将 `prompt`、`count`、参考图像以及与 Gemini 兼容的 `aspectRatio` / `resolution` 提示转发给 OpenRouter。当前内置的 OpenRouter 图像模型快捷方式包括 `google/gemini-3.1-flash-image-preview`、`google/gemini-3-pro-image-preview` 和 `openai/gpt-5.4-image-2`。使用 `action: "list"` 查看你配置的插件暴露的内容。

  </Accordion>
  <Accordion title="MiniMax 双认证">
    MiniMax 图像生成可通过两种捆绑的 MiniMax 认证路径使用：

    - `minimax/image-01` — 用于 API 密钥设置
    - `minimax-portal/image-01` — 用于 OAuth 设置

  </Accordion>
  <Accordion title="xAI grok-imagine-image">
    捆绑的 xAI 提供商在仅提示词请求时使用 `/v1/images/generations`，在存在 `image` 或 `images` 时使用 `/v1/images/edits`。

    - 模型：`xai/grok-imagine-image`、`xai/grok-imagine-image-quality`
    - 数量：最多 4 张
    - 参考：一张 `image` 或最多五张 `images`
    - 宽高比：`1:1`、`16:9`、`9:16`、`4:3`、`3:4`、`2:3`、`3:2`
    - 分辨率：`1K`、`2K`
    - 输出：作为 OpenClaw 托管的图像附件返回

    OpenClaw 有意不暴露 xAI 原生的 `quality`、`mask`、`user` 或额外的原生专属宽高比，直到这些控制项存在于共享的跨提供商 `image_generate` 契约中。

  </Accordion>
</AccordionGroup>

## 示例

<Tabs>
  <Tab title="生成（4K 横向）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="A clean editorial poster for OpenClaw image generation" size=3840x2160 count=1
```
  </Tab>
  <Tab title="生成（透明 PNG）">
```text
/tool image_generate action=generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

等效 CLI：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

  </Tab>
  <Tab title="生成（两张正方形）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Two visual directions for a calm productivity app icon" size=1024x1024 count=2
```
  </Tab>
  <Tab title="编辑（一张参考图）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Keep the subject, replace the background with a bright studio setup" image=/path/to/reference.png size=1024x1536
```
  </Tab>
  <Tab title="编辑（多张参考图）">
```text
/tool image_generate action=generate model=openai/gpt-image-2 prompt="Combine the character identity from the first image with the color palette from the second" images='["/path/to/character.png","/path/to/palette.jpg"]' size=1536x1024
```
  </Tab>
</Tabs>

同样的 `--output-format` 和 `--background` 标志可用于 `openclaw infer image edit`；`--openai-background` 保留为 OpenAI 专属别名。除 OpenAI 外的其他捆绑提供商目前未声明显式背景控制，因此 `background: "transparent"` 会针对它们报告为已忽略。

## 相关

- [工具概览](/tools) — 所有可用 Agent 工具
- [ComfyUI](/providers/comfy) — 本地 ComfyUI 和 Comfy Cloud 工作流设置
- [fal](/providers/fal) — fal 图像和视频提供商设置
- [Google (Gemini)](/providers/google) — Gemini 图像提供商设置
- [MiniMax](/providers/minimax) — MiniMax 图像提供商设置
- [OpenAI](/providers/openai) — OpenAI 图像提供商设置
- [Vydra](/providers/vydra) — Vydra 图像、视频和语音设置
- [xAI](/providers/xai) — Grok 图像、视频、搜索、代码执行和 TTS 设置
- [配置参考](/gateway/config-agents#agent-defaults) — `imageGenerationModel` 配置
- [模型](/concepts/models) — 模型配置和故障转移
