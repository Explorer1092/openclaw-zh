---
title: "MiniMax"
sidebarTitle: "MiniMax"
mmh3_hash: "cfb5d4c066a16ba0856f9e98475f6776"
summary: "在 OpenClaw 中使用 MiniMax 模型"
read_when:
  - 您想在 OpenClaw 中使用 MiniMax 模型
  - 您需要 MiniMax 设置指导
---

# MiniMax

OpenClaw 的 MiniMax Provider 默认使用 **MiniMax M2.7**。

MiniMax 还提供：

- 通过 T2A v2 内置语音合成
- 通过 `MiniMax-VL-01` 内置图像理解
- 通过 `music-2.6` 内置音乐生成
- 通过 MiniMax Coding Plan 搜索 API 内置 `web_search`

Provider 拆分：

| Provider ID      | 身份验证 | 能力                                                       |
| ---------------- | -------- | ---------------------------------------------------------- |
| `minimax`        | API 密钥 | 文本、图像生成、音乐生成、视频生成、图像理解、语音、Web 搜索 |
| `minimax-portal` | OAuth    | 文本、图像生成、音乐生成、视频生成、图像理解、语音           |

## 内置目录

| 模型                     | 类型             | 描述                                     |
| ------------------------ | ---------------- | ---------------------------------------- |
| `MiniMax-M2.7`           | 聊天（推理）     | 默认托管推理模型                         |
| `MiniMax-M2.7-highspeed` | 聊天（推理）     | 更快的 M2.7 推理层                       |
| `MiniMax-VL-01`          | 视觉             | 图像理解模型                             |
| `image-01`               | 图像生成         | 文本到图像和图像到图像编辑               |
| `music-2.6`              | 音乐生成         | 默认音乐模型                             |
| `music-2.5`              | 音乐生成         | 上一代音乐生成层                         |
| `music-2.0`              | 音乐生成         | 旧版音乐生成层                           |
| `MiniMax-Hailuo-2.3`     | 视频生成         | 文本到视频和图像参考流程                 |

## 快速开始

选择您首选的身份验证方式并按照设置步骤操作。

<Tabs>
  <Tab title="OAuth（Coding Plan）">
    **最适合：** 通过 OAuth 使用 MiniMax Coding Plan 快速设置，无需 API 密钥。

    <Tabs>
      <Tab title="国际版">
        <Steps>
          <Step title="运行入门">
            ```bash
            openclaw onboard --auth-choice minimax-global-oauth
            ```

            这将针对 `api.minimax.io` 进行身份验证。
          </Step>
          <Step title="验证模型是否可用">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中国区">
        <Steps>
          <Step title="运行入门">
            ```bash
            openclaw onboard --auth-choice minimax-cn-oauth
            ```

            这将针对 `api.minimaxi.com` 进行身份验证。
          </Step>
          <Step title="验证模型是否可用">
            ```bash
            openclaw models list --provider minimax-portal
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    <Note>
    OAuth 设置使用 `minimax-portal` Provider id。模型引用形式为 `minimax-portal/MiniMax-M2.7`。
    </Note>

    <Tip>
    MiniMax Coding Plan 推荐链接（9折）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
    </Tip>

  </Tab>

  <Tab title="API 密钥">
    **最适合：** 使用 Anthropic 兼容 API 的托管 MiniMax。

    <Tabs>
      <Tab title="国际版">
        <Steps>
          <Step title="运行入门">
            ```bash
            openclaw onboard --auth-choice minimax-global-api
            ```

            这将配置 `api.minimax.io` 作为 Base URL。
          </Step>
          <Step title="验证模型是否可用">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
      <Tab title="中国区">
        <Steps>
          <Step title="运行入门">
            ```bash
            openclaw onboard --auth-choice minimax-cn-api
            ```

            这将配置 `api.minimaxi.com` 作为 Base URL。
          </Step>
          <Step title="验证模型是否可用">
            ```bash
            openclaw models list --provider minimax
            ```
          </Step>
        </Steps>
      </Tab>
    </Tabs>

    ### 配置示例

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "minimax/MiniMax-M2.7" } } },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
              {
                id: "MiniMax-M2.7-highspeed",
                name: "MiniMax M2.7 Highspeed",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    在 Anthropic 兼容流式路径上，OpenClaw 默认禁用 MiniMax 思考，除非您自己显式设置 `thinking`。MiniMax 的流式端点在 OpenAI 样式的 delta 块中发出 `reasoning_content`，而不是原生 Anthropic 思考块，如果隐式启用，可能会将内部推理泄露到可见输出中。
    </Warning>

    <Note>
    API 密钥设置使用 `minimax` Provider id。模型引用形式为 `minimax/MiniMax-M2.7`。
    </Note>

  </Tab>
</Tabs>

## 通过 `openclaw configure` 配置

使用交互式配置向导设置 MiniMax，无需编辑 JSON：

<Steps>
  <Step title="启动向导">
    ```bash
    openclaw configure
    ```
  </Step>
  <Step title="选择 Model/auth">
    从菜单中选择 **Model/auth**。
  </Step>
  <Step title="选择 MiniMax 身份验证选项">
    选择可用的 MiniMax 选项之一：

    | 身份验证选项         | 描述                    |
    | -------------------- | ----------------------- |
    | `minimax-global-oauth` | 国际 OAuth（Coding Plan）|
    | `minimax-cn-oauth`   | 中国区 OAuth（Coding Plan）|
    | `minimax-global-api` | 国际 API 密钥           |
    | `minimax-cn-api`     | 中国区 API 密钥         |

  </Step>
  <Step title="选择默认模型">
    在提示时选择默认模型。
  </Step>
</Steps>

## 能力

### 图像生成

MiniMax 插件为 `image_generate` 工具注册了 `image-01` 模型。它支持：

- **文本到图像生成**，带宽高比控制
- **图像到图像编辑**（主题参考），带宽高比控制
- 每次请求最多 **9** 张输出图像
- 每次编辑请求最多 **1** 张参考图像
- 支持的宽高比：`1:1`、`16:9`、`4:3`、`3:2`、`2:3`、`3:4`、`9:16`、`21:9`

将 MiniMax 用于图像生成：

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "minimax/image-01" },
    },
  },
}
```

插件使用与文本模型相同的 `MINIMAX_API_KEY` 或 OAuth 身份验证。如果 MiniMax 已经设置好，则无需额外配置。

`minimax` 和 `minimax-portal` 都使用相同的 `image-01` 模型注册 `image_generate`。API 密钥设置使用 `MINIMAX_API_KEY`；OAuth 设置可以改用内置的 `minimax-portal` 身份验证路径。

图像生成始终使用 MiniMax 的专用图像端点（`/v1/image_generation`），并忽略 `models.providers.minimax.baseUrl`，因为该字段配置的是聊天/Anthropic 兼容 Base URL。设置 `MINIMAX_API_HOST=https://api.minimaxi.com` 可将图像生成路由到中国区端点；默认全球端点为 `https://api.minimax.io`。

当入门或 API 密钥设置写入显式 `models.providers.minimax` 条目时，OpenClaw 会将 `MiniMax-M2.7` 和 `MiniMax-M2.7-highspeed` 具体化为仅文本聊天模型。图像理解通过插件自有的 `MiniMax-VL-01` 媒体 Provider 单独公开。

<Note>
请参阅[图像生成](/tools/image-generation)了解共享工具参数、Provider 选择和故障转移行为。
</Note>

### 文本转语音

内置的 `minimax` 插件为 `messages.tts` 注册了 MiniMax T2A v2 语音 Provider。

- 默认 TTS 模型：`speech-2.8-hd`
- 默认语音：`English_expressive_narrator`
- 支持的内置模型 id 包括 `speech-2.8-hd`、`speech-2.8-turbo`、`speech-2.6-hd`、`speech-2.6-turbo`、`speech-02-hd`、`speech-02-turbo`、`speech-01-hd` 和 `speech-01-turbo`。
- 身份验证解析顺序：`messages.tts.providers.minimax.apiKey`，然后是 `minimax-portal` OAuth/令牌身份验证配置文件，然后是 Token Plan 环境变量（`MINIMAX_OAUTH_TOKEN`、`MINIMAX_CODE_PLAN_KEY`、`MINIMAX_CODING_API_KEY`），最后是 `MINIMAX_API_KEY`。
- 如果未配置 TTS 主机，OpenClaw 会复用配置的 `minimax-portal` OAuth 主机并去掉 Anthropic 兼容路径后缀（如 `/anthropic`）。
- 普通音频附件保持 MP3 格式。
- 语音笔记目标（如 Feishu 和 Telegram）会使用 `ffmpeg` 将 MiniMax MP3 转码为 48kHz Opus，因为 Feishu/Lark 文件 API 原生音频消息只接受 `file_type: "opus"`。
- MiniMax T2A 接受小数 `speed` 和 `vol`，但 `pitch` 以整数形式发送；OpenClaw 在 API 请求前会截断小数 `pitch` 值。

| 设置                                     | 环境变量               | 默认值                        | 描述                             |
| ---------------------------------------- | ---------------------- | ----------------------------- | -------------------------------- |
| `messages.tts.providers.minimax.baseUrl` | `MINIMAX_API_HOST`     | `https://api.minimax.io`      | MiniMax T2A API 主机。           |
| `messages.tts.providers.minimax.model`   | `MINIMAX_TTS_MODEL`    | `speech-2.8-hd`               | TTS 模型 id。                    |
| `messages.tts.providers.minimax.voiceId` | `MINIMAX_TTS_VOICE_ID` | `English_expressive_narrator` | 语音输出使用的语音 id。          |
| `messages.tts.providers.minimax.speed`   |                        | `1.0`                         | 播放速度，`0.5..2.0`。           |
| `messages.tts.providers.minimax.vol`     |                        | `1.0`                         | 音量，`(0, 10]`。                |
| `messages.tts.providers.minimax.pitch`   |                        | `0`                           | 整数音调偏移，`-12..12`。        |

### 音乐生成

内置的 `minimax` 插件也通过共享的 `music_generate` 工具注册音乐生成。

- 默认音乐模型：`minimax/music-2.6`
- OAuth 音乐模型：`minimax-portal/music-2.6`
- 也支持 `minimax/music-2.5` 和 `minimax/music-2.0`
- 提示控制：`lyrics`、`instrumental`、`durationSeconds`
- 输出格式：`mp3`
- 基于 Session 的运行通过共享任务/状态流程分离，包括 `action: "status"`

将 MiniMax 设置为默认音乐 Provider：

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "minimax/music-2.6",
      },
    },
  },
}
```

<Note>
请参阅[音乐生成](/tools/music-generation)了解共享工具参数、Provider 选择和故障转移行为。
</Note>

### 视频生成

内置的 `minimax` 插件也通过共享的 `video_generate` 工具注册视频生成。

- 默认视频模型：`minimax/MiniMax-Hailuo-2.3`
- 模式：文本到视频和单图像参考流程
- 支持 `aspectRatio` 和 `resolution`

将 MiniMax 设置为默认视频 Provider：

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "minimax/MiniMax-Hailuo-2.3",
      },
    },
  },
}
```

<Note>
请参阅[视频生成](/tools/video-generation)了解共享工具参数、Provider 选择和故障转移行为。
</Note>

### 图像理解

MiniMax 插件将图像理解与文本目录分开注册：

| Provider ID      | 默认图像模型     |
| ---------------- | ---------------- |
| `minimax`        | `MiniMax-VL-01`  |
| `minimax-portal` | `MiniMax-VL-01`  |

这就是为什么即使内置文本 Provider 目录仍显示仅文本的 M2.7 聊天引用，自动媒体路由也能使用 MiniMax 图像理解。

### Web 搜索

MiniMax 插件也通过 MiniMax Coding Plan 搜索 API 注册 `web_search`。

- Provider id：`minimax`
- 结构化结果：标题、URL、摘要、相关查询
- 首选环境变量：`MINIMAX_CODE_PLAN_KEY`
- 接受的环境别名：`MINIMAX_CODING_API_KEY`
- 兼容回退：`MINIMAX_API_KEY`（当它已指向 Coding Plan 令牌时）
- 区域复用：`plugins.entries.minimax.config.webSearch.region`，然后是 `MINIMAX_API_HOST`，然后是 MiniMax Provider Base URL
- 搜索保持在 Provider id `minimax` 上；OAuth CN/全球设置仍可通过 `models.providers.minimax-portal.baseUrl` 间接控制区域

配置位于 `plugins.entries.minimax.config.webSearch.*` 下。

<Note>
请参阅 [MiniMax Search](/tools/minimax-search) 获取完整的 Web 搜索配置和使用说明。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="配置选项">
    | 选项 | 描述 |
    | --- | --- |
    | `models.providers.minimax.baseUrl` | 首选 `https://api.minimax.io/anthropic`（Anthropic 兼容）；`https://api.minimax.io/v1` 是 OpenAI 兼容负载的可选项 |
    | `models.providers.minimax.api` | 首选 `anthropic-messages`；`openai-completions` 是 OpenAI 兼容负载的可选项 |
    | `models.providers.minimax.apiKey` | MiniMax API 密钥（`MINIMAX_API_KEY`）|
    | `models.providers.minimax.models` | 定义 `id`、`name`、`reasoning`、`contextWindow`、`maxTokens`、`cost` |
    | `agents.defaults.models` | 为您想要在允许列表中的模型设置别名 |
    | `models.mode` | 如果您想在内置模型旁边添加 MiniMax，保持 `merge` |
  </Accordion>

  <Accordion title="思考默认值">
    在 `api: "anthropic-messages"` 上，OpenClaw 注入 `thinking: { type: "disabled" }`，除非思考已在参数/配置中显式设置。

    这防止 MiniMax 的流式端点在 OpenAI 样式的 delta 块中发出 `reasoning_content`，从而将内部推理泄露到可见输出中。

  </Accordion>

  <Accordion title="Fast 模式">
    `/fast on` 或 `params.fastMode: true` 在 Anthropic 兼容流路径上将 `MiniMax-M2.7` 重写为 `MiniMax-M2.7-highspeed`。
  </Accordion>

  <Accordion title="备选示例">
    **最适合：** 将最强的最新一代模型作为主要模型，故障转移到 MiniMax M2.7。下面的示例使用 Opus 作为具体的主要模型；请替换为您首选的最新一代主要模型。

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-..." },
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": { alias: "primary" },
            "minimax/MiniMax-M2.7": { alias: "minimax" },
          },
          model: {
            primary: "anthropic/claude-opus-4-6",
            fallbacks: ["minimax/MiniMax-M2.7"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Coding Plan 使用详情">
    - Coding Plan 使用量 API：`https://api.minimaxi.com/v1/api/openplatform/coding_plan/remains`（需要 Coding Plan 密钥）。
    - OpenClaw 将 MiniMax Coding Plan 使用量归一化为其他 Provider 使用的相同 `% left` 显示。MiniMax 的原始 `usage_percent` / `usagePercent` 字段是剩余配额，而不是已消耗配额，因此 OpenClaw 将其反转。当存在基于计数的字段时优先使用。
    - 当 API 返回 `model_remains` 时，OpenClaw 优先使用聊天模型条目，在需要时从 `start_time` / `end_time` 派生窗口标签，并在计划标签中包含所选模型名称，以便更容易区分 Coding Plan 窗口。
    - 使用快照将 `minimax`、`minimax-cn` 和 `minimax-portal` 视为相同的 MiniMax 配额界面，并在回退到 Coding Plan 密钥环境变量之前优先使用存储的 MiniMax OAuth。
  </Accordion>
</AccordionGroup>

## 注意事项

- 模型引用遵循身份验证路径：
  - API 密钥设置：`minimax/<model>`
  - OAuth 设置：`minimax-portal/<model>`
- 默认聊天模型：`MiniMax-M2.7`
- 备选聊天模型：`MiniMax-M2.7-highspeed`
- 入门和直接 API 密钥设置为两个 M2.7 变体写入仅文本模型定义
- 图像理解使用插件自有的 `MiniMax-VL-01` 媒体 Provider
- 如果需要精确的成本跟踪，请更新 `models.json` 中的价格值
- 使用 `openclaw models list` 确认当前 Provider id，然后使用 `openclaw models set minimax/MiniMax-M2.7` 或 `openclaw models set minimax-portal/MiniMax-M2.7` 切换

<Tip>
MiniMax Coding Plan 推荐链接（9折）：[MiniMax Coding Plan](https://platform.minimax.io/subscribe/coding-plan?code=DbXJTRClnb&source=link)
</Tip>

<Note>
请参阅[模型 Provider](/concepts/model-providers) 了解 Provider 规则。
</Note>

## 故障排除

<AccordionGroup>
  <Accordion title='"未知模型：minimax/MiniMax-M2.7"'>
    这通常意味着 **MiniMax Provider 未配置**（未找到匹配的 Provider 条目且未找到 MiniMax 身份验证配置文件/环境密钥）。此检测的修复在 **2026.1.12** 中。修复方法：

    - 升级到 **2026.1.12**（或从源代码 `main` 运行），然后重启 Gateway。
    - 运行 `openclaw configure` 并选择一个 **MiniMax** 身份验证选项，或
    - 手动添加匹配的 `models.providers.minimax` 或 `models.providers.minimax-portal` 块，或
    - 设置 `MINIMAX_API_KEY`、`MINIMAX_OAUTH_TOKEN` 或 MiniMax 身份验证配置文件，以便注入匹配的 Provider。

    确保模型 id 区分大小写：

    - API 密钥路径：`minimax/MiniMax-M2.7` 或 `minimax/MiniMax-M2.7-highspeed`
    - OAuth 路径：`minimax-portal/MiniMax-M2.7` 或 `minimax-portal/MiniMax-M2.7-highspeed`

    然后用以下命令重新检查：

    ```bash
    openclaw models list
    ```

  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/help/troubleshooting) 和 [FAQ](/help/faq)。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="图像生成" href="/tools/image-generation" icon="image">
    共享图像工具参数和 Provider 选择。
  </Card>
  <Card title="音乐生成" href="/tools/music-generation" icon="music">
    共享音乐工具参数和 Provider 选择。
  </Card>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    共享视频工具参数和 Provider 选择。
  </Card>
  <Card title="MiniMax Search" href="/tools/minimax-search" icon="magnifying-glass">
    通过 MiniMax Coding Plan 的 Web 搜索配置。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常规故障排除和 FAQ。
  </Card>
</CardGroup>
