---
mmh3_hash: "fb809c4d73262802c6d3cf0b4bc19d19"
title: "OpenAI"
summary: "在 OpenClaw 中通过 API 密钥或 Codex 订阅使用 OpenAI"
read_when:
  - 您想在 OpenClaw 中使用 OpenAI 模型
  - 您想使用 Codex 订阅身份验证而不是 API 密钥
  - 您需要更严格的 GPT-5 Agent 执行行为
---

OpenAI 为 GPT 模型提供开发者 API，Codex 也可作为 OpenAI Codex 客户端的 ChatGPT Plan 编程 Agent 使用。OpenClaw 将这些接口分开，以保持配置的可预测性。

OpenClaw 将 `openai/*` 用作规范的 OpenAI 模型路由。OpenAI 模型上嵌入的 Agent 轮次默认通过原生 Codex app-server 运行时运行；直接 OpenAI API 密钥身份验证仍适用于非 Agent OpenAI 接口，如图像、嵌入、语音和实时。

- **Agent 模型** — 通过 Codex 运行时的 `openai/*` 模型；使用 `openai-codex` 身份验证进行 ChatGPT/Codex 订阅使用，或在有意使用 API 密钥身份验证时配置 `openai-codex` API 密钥配置文件。
- **非 Agent OpenAI API** — 通过 `OPENAI_API_KEY` 或 OpenAI API 密钥入门，以按使用量计费方式直接访问 OpenAI Platform。
- **旧版配置** — `openai-codex/*` 模型引用由 `openclaw doctor --fix` 修复为 `openai/*` 加 Codex 运行时。

OpenAI 明确支持在 OpenClaw 等外部工具/工作流中使用订阅 OAuth。

Provider、模型、运行时和 Channel 是独立的层。如果这些标签混淆在一起，请在更改配置前阅读 [Agent 运行时](/concepts/agent-runtimes)。

## 快速选择

| 目标                                                  | 使用                                                         | 备注                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| 使用原生 Codex 运行时的 ChatGPT/Codex 订阅            | `openai/gpt-5.5`                                             | 默认 OpenAI Agent 设置。使用 `openai-codex` 身份验证登录。                   |
| Agent 模型的直接 API 密钥计费                         | `openai/gpt-5.5` 加 `openai-codex` API 密钥配置文件         | 使用 `auth.order.openai-codex` 优先选择该配置文件。                          |
| 通过显式 PI 的直接 API 密钥计费                       | `openai/gpt-5.5` 加 Provider/模型运行时 `pi`                 | 选择普通的 `openai` API 密钥配置文件。                                       |
| 最新 ChatGPT Instant API 别名                         | `openai/chat-latest`                                         | 仅限直接 API 密钥。用于实验的移动别名，非默认。                              |
| 通过显式 PI 的 ChatGPT/Codex 订阅身份验证             | `openai/gpt-5.5` 加 Provider/模型运行时 `pi`                 | 为兼容性路由选择 `openai-codex` 身份验证配置文件。                           |
| 图像生成或编辑                                        | `openai/gpt-image-2`                                         | 支持 `OPENAI_API_KEY` 或 OpenAI Codex OAuth。                                |
| 透明背景图像                                          | `openai/gpt-image-1.5`                                       | 使用 `outputFormat=png` 或 `webp` 加 `openai.background=transparent`。       |

## 命名映射

以下名称相似但不可互换：

| 您看到的名称                              | 层级               | 含义                                                                                                    |
| ----------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------- |
| `openai`                                  | Provider 前缀      | 规范 OpenAI 模型路由；Agent 轮次使用 Codex 运行时。                                                     |
| `openai-codex`                            | 身份验证/配置文件前缀 | OpenAI Codex OAuth/订阅身份验证配置文件 Provider。                                                    |
| `codex` Plugin                            | Plugin             | 提供原生 Codex app-server 运行时和 `/codex` 聊天控制的内置 OpenClaw Plugin。                            |
| Provider/模型 `agentRuntime.id: codex`   | Agent 运行时       | 为匹配的嵌入式轮次强制使用原生 Codex app-server 套件。                                                  |
| `/codex ...`                              | 聊天命令集         | 从对话中绑定/控制 Codex app-server 线程。                                                               |
| `runtime: "acp", agentId: "codex"`        | ACP Session 路由   | 通过 ACP/acpx 运行 Codex 的显式回退路径。                                                               |

这意味着一个配置可以同时包含 `openai/*` 模型引用和 `openai-codex` 身份验证配置文件。`openclaw doctor --fix` 将旧版 `openai-codex/*` 模型引用重写为规范的 OpenAI 模型路由。

<Note>
GPT-5.5 可通过直接 OpenAI Platform API 密钥访问和订阅/OAuth 路由使用。对于 ChatGPT/Codex 订阅加原生 Codex 执行，使用 `openai/gpt-5.5`；未设置运行时配置时，OpenAI Agent 轮次现在自动选择 Codex 套件。仅当您想为 OpenAI Agent 模型使用直接 API 密钥身份验证时，才使用 OpenAI API 密钥配置文件。
</Note>

<Note>
OpenAI Agent 模型轮次需要内置的 Codex app-server Plugin。显式 PI 运行时配置仍可作为可选的兼容性路由。当通过 `openai-codex` 身份验证配置文件显式选择 PI 时，OpenClaw 将公共模型引用保留为 `openai/*` 并在内部通过旧版 Codex 身份验证传输路由 PI。运行 `openclaw doctor --fix` 可修复过时的 `openai-codex/*` 模型引用或不来自显式运行时配置的旧版 PI Session 固定。
</Note>

## OpenClaw 功能覆盖

| OpenAI 功能               | OpenClaw 接口                                                                        | 状态                                                  |
| ------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| 聊天 / Responses          | `openai/<model>` 模型 Provider                                                       | 是                                                    |
| Codex 订阅模型            | `openai/<model>` 加 `openai-codex` OAuth                                             | 是                                                    |
| 旧版 Codex 模型引用       | `openai-codex/<model>`                                                               | 由 doctor 修复为 `openai/<model>`                     |
| Codex app-server 套件     | `openai/<model>` 加省略运行时或 Provider/模型 `agentRuntime.id: codex`               | 是                                                    |
| 服务器端网络搜索          | 原生 OpenAI Responses 工具                                                            | 是（启用网络搜索且未固定 Provider 时）                |
| 图像                      | `image_generate`                                                                     | 是                                                    |
| 视频                      | `video_generate`                                                                     | 是                                                    |
| 文本转语音                | `messages.tts.provider: "openai"` / `tts`                                            | 是                                                    |
| 批量语音转文字            | `tools.media.audio` / 媒体理解                                                       | 是                                                    |
| 流式语音转文字            | Voice Call `streaming.provider: "openai"`                                            | 是                                                    |
| 实时语音                  | Voice Call `realtime.provider: "openai"` / Control UI Talk                           | 是                                                    |
| 嵌入                      | 内存嵌入 Provider                                                                    | 是                                                    |

## Memory 嵌入

OpenClaw 可以使用 OpenAI 或 OpenAI 兼容嵌入端点进行 `memory_search` 索引和查询嵌入：

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

对于需要非对称嵌入标签的 OpenAI 兼容端点，在 `memorySearch` 下设置 `queryInputType` 和 `documentInputType`。OpenClaw 将这些作为 Provider 特定的 `input_type` 请求字段转发：查询嵌入使用 `queryInputType`；索引的 Memory 块和批量索引使用 `documentInputType`。有关完整示例，请参见 [Memory 配置参考](/reference/memory-config#provider-specific-config)。

## 快速开始

选择您偏好的身份验证方式并按照设置步骤操作。

<Tabs>
  <Tab title="API 密钥（OpenAI Platform）">
    **适合：** 直接 API 访问和按使用量计费。

    <Steps>
      <Step title="获取 API 密钥">
        从 [OpenAI Platform 仪表板](https://platform.openai.com/api-keys) 创建或复制 API 密钥。
      </Step>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        或直接传递密钥：

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用              | 运行时配置                                         | 路由                       | 身份验证              |
    | --------------------- | -------------------------------------------------- | -------------------------- | --------------------- |
    | `openai/gpt-5.5`      | 省略 / Provider/模型 `agentRuntime.id: "codex"`    | Codex app-server 套件      | `openai-codex` 配置文件 |
    | `openai/gpt-5.4-mini` | 省略 / Provider/模型 `agentRuntime.id: "codex"`    | Codex app-server 套件      | `openai-codex` 配置文件 |
    | `openai/gpt-5.5`      | Provider/模型 `agentRuntime.id: "pi"`              | PI 嵌入运行时              | `openai` 配置文件或选定的 `openai-codex` 配置文件 |

    <Note>
    `openai/*` Agent 模型使用 Codex app-server 套件。要为 Agent 模型使用 API 密钥身份验证，请创建 `openai-codex` API 密钥配置文件并用 `auth.order.openai-codex` 排序；`OPENAI_API_KEY` 仍是非 Agent OpenAI API 接口的直接回退。
    </Note>

    ### 配置示例

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/gpt-5.5" } } },
    }
    ```

    要从 OpenAI API 尝试 ChatGPT 当前的 Instant 模型，请将模型设置为 `openai/chat-latest`：

    ```json5
    {
      env: { OPENAI_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` 是一个移动别名。OpenAI 将其记录为 ChatGPT 中使用的最新 Instant 模型，并推荐将 `gpt-5.5` 用于生产 API，因此除非您明确需要该别名行为，否则请将 `openai/gpt-5.5` 保持为稳定默认值。该别名目前仅接受 `medium` 文本详细度，因此 OpenClaw 会规范化此模型的不兼容 OpenAI 文本详细度覆盖。

    <Warning>
    OpenClaw **不**公开 `openai/gpt-5.3-codex-spark`。实际 OpenAI API 请求会拒绝该模型，当前 Codex 目录也不公开它。
    </Warning>

  </Tab>

  <Tab title="Codex 订阅">
    **适合：** 使用 ChatGPT/Codex 订阅加原生 Codex app-server 执行，而非单独的 API 密钥。Codex 云需要 ChatGPT 登录。

    <Steps>
      <Step title="运行 Codex OAuth">
        ```bash
        openclaw onboard --auth-choice openai-codex
        ```

        或直接运行 OAuth：

        ```bash
        openclaw models auth login --provider openai-codex
        ```

        对于无头或回调受限的设置，添加 `--device-code` 以使用 ChatGPT 设备代码流代替本地浏览器回调进行登录：

        ```bash
        openclaw models auth login --provider openai-codex --device-code
        ```
      </Step>
      <Step title="使用规范的 OpenAI 模型路由">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.5
        ```

        默认路径不需要运行时配置。OpenAI Agent 轮次自动选择原生 Codex app-server 运行时，OpenClaw 在选择此路由时会安装或修复内置 Codex Plugin。
      </Step>
      <Step title="验证 Codex 身份验证是否可用">
        ```bash
        openclaw models list --provider openai-codex
        ```

        Gateway 运行后，在聊天中发送 `/codex status` 或 `/codex models` 以验证原生 app-server 运行时。
      </Step>
    </Steps>

    ### 路由摘要

    | 模型引用          | 运行时配置                                         | 路由                                            | 身份验证                               |
    |-------------------| -------------------------------------------------- | ----------------------------------------------- | -------------------------------------- |
    | `openai/gpt-5.5`  | 省略 / Provider/模型 `agentRuntime.id: "codex"`    | 原生 Codex app-server 套件                      | Codex 登录或选定的 `openai-codex` 配置文件 |
    | `openai/gpt-5.5`  | Provider/模型 `agentRuntime.id: "pi"`              | PI 嵌入运行时加内部 Codex 身份验证传输          | 选定的 `openai-codex` 配置文件         |
    | `openai-codex/gpt-5.5` | 由 doctor 修复                                | 旧版路由重写为 `openai/gpt-5.5`                 | 现有 `openai-codex` 配置文件           |

    <Warning>
    不要配置旧版 `openai-codex/gpt-5.1*`、`openai-codex/gpt-5.2*` 或 `openai-codex/gpt-5.3*` 模型引用。ChatGPT/Codex OAuth 账户现在拒绝这些模型。使用 `openai/gpt-5.5`；OpenAI Agent 轮次现在默认选择 Codex 运行时。
    </Warning>

    <Note>
    继续为身份验证/配置文件命令使用 `openai-codex` provider id。`openai-codex/*` 模型前缀是由 doctor 修复的旧版配置。对于常见的订阅加原生运行时设置，使用 `openai-codex` 登录，但将模型引用保持为 `openai/gpt-5.5`。
    </Note>

    ### 配置示例

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.5" },
        },
      },
    }
    ```

    <Note>
    入门不再从 `~/.codex` 导入 OAuth 材料。使用浏览器 OAuth（默认）或上方的设备代码流登录——OpenClaw 在自己的 Agent 身份验证存储中管理生成的凭据。
    </Note>

    ### 检查和恢复 Codex OAuth 路由

    使用以下命令查看默认 Agent 使用的模型、运行时和身份验证路由：

    ```bash
    openclaw models status
    openclaw models auth list --provider openai-codex
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    对于特定 Agent，添加 `--agent <id>`：

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai-codex
    ```

    如果旧版配置仍有 `openai-codex/gpt-*` 或没有显式运行时配置的过时 OpenAI PI Session 固定，请修复：

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    如果 `models auth list --provider openai-codex` 显示没有可用配置文件，请重新登录：

    ```bash
    openclaw models auth login --provider openai-codex
    openclaw models status --probe --probe-provider openai-codex
    ```

    `openai-codex` 仍是身份验证/配置文件 Provider id。`openai/*` 是通过 Codex 进行 OpenAI Agent 轮次的模型路由。

    ### 状态指示器

    聊天 `/status` 显示当前 Session 的活动模型运行时。内置 Codex app-server 套件对 OpenAI Agent 模型轮次显示为 `Runtime: OpenAI Codex`。过时的 PI Session 固定将修复为 Codex，除非配置明确固定 PI。

    ### Doctor 警告

    如果配置或 Session 状态中仍有 `openai-codex/*` 路由或过时的 OpenAI PI 固定，`openclaw doctor --fix` 会将其重写为带 Codex 运行时的 `openai/*`，除非显式配置了 PI。

    ### 上下文窗口上限

    OpenClaw 将模型元数据和运行时上下文上限视为独立的值。

    对于通过 Codex OAuth 目录使用 `openai/gpt-5.5`：

    - 原生 `contextWindow`：`1000000`
    - 默认运行时 `contextTokens` 上限：`272000`

    较小的默认上限在实践中具有更好的延迟和质量特性。通过 `contextTokens` 覆盖：

    ```json5
    {
      models: {
        providers: {
          "openai-codex": {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    使用 `contextWindow` 声明原生模型元数据。使用 `contextTokens` 限制运行时上下文预算。
    </Note>

    ### 目录恢复

    当 `gpt-5.5` 的上游 Codex 目录元数据存在时，OpenClaw 使用它。如果实时 Codex 发现在账户已认证的情况下省略了 `gpt-5.5` 行，OpenClaw 会合成该 OAuth 模型行，以避免 cron、子 Agent 和配置的默认模型运行因 `Unknown model` 而失败。

  </Tab>
</Tabs>

## 原生 Codex app-server 身份验证

原生 Codex app-server 套件使用 `openai/*` 模型引用加省略的运行时配置或 Provider/模型 `agentRuntime.id: "codex"`，但其身份验证仍基于账户。OpenClaw 按此顺序选择身份验证：

1. 绑定到 Agent 的显式 OpenClaw `openai-codex` 身份验证配置文件。
2. app-server 的现有账户，例如本地 Codex CLI ChatGPT 登录。
3. 仅限本地 stdio app-server 启动：当 app-server 未报告账户且仍需要 OpenAI 身份验证时，先尝试 `CODEX_API_KEY`，再尝试 `OPENAI_API_KEY`。

这意味着本地 ChatGPT/Codex 订阅登录不会因为 Gateway 进程也有 `OPENAI_API_KEY`（用于直接 OpenAI 模型或嵌入）而被替换。环境变量 API 密钥回退仅适用于本地 stdio 无账户路径；不发送到 WebSocket app-server 连接。当选择了订阅式 Codex 配置文件时，OpenClaw 也会将 `CODEX_API_KEY` 和 `OPENAI_API_KEY` 排除在生成的 stdio app-server 子进程之外，并通过 app-server 登录 RPC 发送选定的凭据。

## 图像生成

内置的 `openai` Plugin 通过 `image_generate` 工具注册图像生成。它同时支持 OpenAI API 密钥图像生成和通过相同 `openai/gpt-image-2` 模型引用的 Codex OAuth 图像生成。

| 功能                 | OpenAI API 密钥                    | Codex OAuth                        |
| -------------------- | ---------------------------------- | ---------------------------------- |
| 模型引用             | `openai/gpt-image-2`               | `openai/gpt-image-2`               |
| 身份验证             | `OPENAI_API_KEY`                   | OpenAI Codex OAuth 登录            |
| 传输                 | OpenAI Images API                  | Codex Responses 后端               |
| 每次请求最大图像数   | 4                                  | 4                                  |
| 编辑模式             | 已启用（最多 5 张参考图像）        | 已启用（最多 5 张参考图像）        |
| 尺寸覆盖             | 支持，包括 2K/4K 尺寸              | 支持，包括 2K/4K 尺寸              |
| 宽高比/分辨率        | 不转发给 OpenAI Images API         | 安全时映射到支持的尺寸             |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
有关共享工具参数、Provider 选择和故障转移行为，请参见[图像生成](/tools/image-generation)。
</Note>

`gpt-image-2` 是 OpenAI 文本到图像生成和图像编辑的默认模型。`gpt-image-1.5`、`gpt-image-1` 和 `gpt-image-1-mini` 仍可作为显式模型覆盖使用。使用 `openai/gpt-image-1.5` 输出透明背景的 PNG/WebP；当前 `gpt-image-2` API 拒绝 `background: "transparent"`。

对于透明背景请求，Agent 应使用 `model: "openai/gpt-image-1.5"`、`outputFormat: "png"` 或 `"webp"` 以及 `background: "transparent"` 调用 `image_generate`；旧版 `openai.background` Provider 选项仍被接受。OpenClaw 还通过将默认的 `openai/gpt-image-2` 透明请求重写为 `gpt-image-1.5` 来保护公共 OpenAI 和 OpenAI Codex OAuth 路由；Azure 和自定义 OpenAI 兼容端点保留其配置的部署/模型名称。

同样的设置也公开给无头 CLI 运行：

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "A simple red circle sticker on a transparent background" \
  --json
```

编辑时使用相同的 `--output-format` 和 `--background` 标志配合 `openclaw infer image edit`。`--openai-background` 仍可作为 OpenAI 特定的别名使用。

对于 Codex OAuth 安装，保留相同的 `openai/gpt-image-2` 引用。当配置了 `openai-codex` OAuth 配置文件时，OpenClaw 解析存储的 OAuth 访问令牌并通过 Codex Responses 后端发送图像请求。它不会先尝试 `OPENAI_API_KEY` 或静默回退到 API 密钥。若需要直接 OpenAI Images API 路由，请使用 API 密钥、自定义 base URL 或 Azure 端点显式配置 `models.providers.openai`。如果该自定义图像端点位于受信任的 LAN/私有地址，还需设置 `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true`；OpenClaw 默认阻止私有/内部 OpenAI 兼容图像端点，除非存在此选项。

生成：

```
/tool image_generate model=openai/gpt-image-2 prompt="A polished launch poster for OpenClaw on macOS" size=3840x2160 count=1
```

生成透明 PNG：

```
/tool image_generate model=openai/gpt-image-1.5 prompt="A simple red circle sticker on a transparent background" outputFormat=png background=transparent
```

编辑：

```
/tool image_generate model=openai/gpt-image-2 prompt="Preserve the object shape, change the material to translucent glass" image=/path/to/reference.png size=1024x1536
```

## 视频生成

内置的 `openai` Plugin 通过 `video_generate` 工具注册视频生成。

| 功能          | 值                                                                                 |
| ------------- | ---------------------------------------------------------------------------------- |
| 默认模型      | `openai/sora-2`                                                                    |
| 模式          | 文本到视频、图像到视频、单视频编辑                                                 |
| 参考输入      | 1 张图像或 1 个视频                                                                |
| 尺寸覆盖      | 支持                                                                               |
| 其他覆盖      | `aspectRatio`、`resolution`、`audio`、`watermark` 被忽略并作为工具警告报告         |

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
有关共享工具参数、Provider 选择和故障转移行为，请参见[视频生成](/tools/video-generation)。
</Note>

## GPT-5 提示贡献

OpenClaw 为跨 Provider 的 GPT-5 系列运行添加共享的 GPT-5 提示贡献。它按模型 id 应用，因此 `openai/gpt-5.5`、修复前的旧版引用（如 `openai-codex/gpt-5.5`）、`openrouter/openai/gpt-5.5`、`opencode/gpt-5.5` 和其他兼容的 GPT-5 引用都会收到相同的叠加层。较旧的 GPT-4.x 模型则不会。

内置的原生 Codex 套件通过 Codex app-server 开发者指令使用相同的 GPT-5 行为和心跳叠加层，因此通过 Codex 路由的 `openai/gpt-5.x` Session 即使在 Codex 拥有套件提示的其余部分时，也保持相同的后续和主动心跳指导。

GPT-5 贡献为角色持久性、执行安全、工具规范、输出形状、完成检查和验证添加了带标签的行为契约。Channel 特定的回复和静默消息行为保留在共享的 OpenClaw 系统提示和出站传递策略中。GPT-5 指导对匹配的模型始终启用。友好的交互风格层是独立且可配置的。

| 值                     | 效果                          |
| ---------------------- | ----------------------------- |
| `"friendly"`（默认）   | 启用友好交互风格层            |
| `"on"`                 | `"friendly"` 的别名           |
| `"off"`                | 仅禁用友好风格层              |

<Tabs>
  <Tab title="配置">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
值在运行时不区分大小写，因此 `"Off"` 和 `"off"` 都可以禁用友好风格层。
</Tip>

<Note>
旧版 `plugins.entries.openai.config.personality` 在未设置共享 `agents.defaults.promptOverlays.gpt5.personality` 设置时，仍作为兼容性回退读取。
</Note>

## 语音和语音合成

<AccordionGroup>
  <Accordion title="语音合成（TTS）">
    内置的 `openai` Plugin 为 `messages.tts` 接口注册语音合成。

    | 设置   | 配置路径                                          | 默认值                                  |
    |--------|---------------------------------------------------|-----------------------------------------|
    | 模型   | `messages.tts.providers.openai.model`             | `gpt-4o-mini-tts`                       |
    | 音色   | `messages.tts.providers.openai.voice`             | `coral`                                 |
    | 速度   | `messages.tts.providers.openai.speed`             | （未设置）                              |
    | 指令   | `messages.tts.providers.openai.instructions`      | （未设置，仅 `gpt-4o-mini-tts`）        |
    | 格式   | `messages.tts.providers.openai.responseFormat`    | 语音备注为 `opus`，文件为 `mp3`         |
    | API 密钥 | `messages.tts.providers.openai.apiKey`           | 回退到 `OPENAI_API_KEY`                 |
    | Base URL | `messages.tts.providers.openai.baseUrl`          | `https://api.openai.com/v1`             |
    | 额外正文 | `messages.tts.providers.openai.extraBody` / `extra_body` | （未设置）                    |

    可用模型：`gpt-4o-mini-tts`、`tts-1`、`tts-1-hd`。可用音色：`alloy`、`ash`、`ballad`、`cedar`、`coral`、`echo`、`fable`、`juniper`、`marin`、`onyx`、`nova`、`sage`、`shimmer`、`verse`。

    `extraBody` 在 OpenClaw 生成的字段之后合并到 `/audio/speech` 请求 JSON 中，因此可用于需要额外键（如 `lang`）的 OpenAI 兼容端点。原型键会被忽略。

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", voice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    设置 `OPENAI_TTS_BASE_URL` 可覆盖 TTS Base URL 而不影响聊天 API 端点。OpenAI TTS 仍通过 API 密钥配置；对于仅 OAuth 的实时回话，请使用 Realtime 语音路径而非 Agent 模式 STT -> TTS 语音。
    </Note>

  </Accordion>

  <Accordion title="语音转文字">
    内置的 `openai` Plugin 通过 OpenClaw 的媒体理解转录接口注册批量语音转文字。

    - 默认模型：`gpt-4o-transcribe`
    - 端点：OpenAI REST `/v1/audio/transcriptions`
    - 输入路径：multipart 音频文件上传
    - OpenClaw 在使用 `tools.media.audio` 的入站音频转录场景中支持，包括 Discord 语音频道片段和 Channel 音频附件

    强制 OpenAI 用于入站音频转录：

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    语言和提示在由共享音频媒体配置或每次调用的转录请求提供时，会转发给 OpenAI。

  </Accordion>

  <Accordion title="实时转录">
    内置的 `openai` Plugin 为 Voice Call Plugin 注册实时转录。

    | 设置       | 配置路径                                                                             | 默认值              |
    |------------|--------------------------------------------------------------------------------------|---------------------|
    | 模型       | `plugins.entries.voice-call.config.streaming.providers.openai.model`                 | `gpt-4o-transcribe` |
    | 语言       | `...openai.language`                                                                 | （未设置）          |
    | 提示       | `...openai.prompt`                                                                   | （未设置）          |
    | 静音时长   | `...openai.silenceDurationMs`                                                        | `800`               |
    | VAD 阈值   | `...openai.vadThreshold`                                                             | `0.5`               |
    | 身份验证   | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth                        | API 密钥直连；OAuth 生成 Realtime 转录客户端密钥 |

    <Note>
    使用 WebSocket 连接到 `wss://api.openai.com/v1/realtime`，采用 G.711 u-law（`g711_ulaw` / `audio/pcmu`）音频。当只配置了 `openai-codex` OAuth 时，Gateway 在打开 WebSocket 前会生成临时 Realtime 转录客户端密钥。此流式 Provider 用于 Voice Call 的实时转录路径；Discord 语音目前录制短片段并使用批量 `tools.media.audio` 转录路径。
    </Note>

  </Accordion>

  <Accordion title="实时语音">
    内置的 `openai` Plugin 为 Voice Call Plugin 注册实时语音。

    | 设置                   | 配置路径                                                                              | 默认值        |
    |------------------------|---------------------------------------------------------------------------------------|---------------|
    | 模型                   | `plugins.entries.voice-call.config.realtime.providers.openai.model`                   | `gpt-realtime-2` |
    | 音色                   | `...openai.voice`                                                                     | `alloy`       |
    | 温度（Azure 部署桥接） | `...openai.temperature`                                                               | `0.8`         |
    | VAD 阈值               | `...openai.vadThreshold`                                                              | `0.5`         |
    | 静音时长               | `...openai.silenceDurationMs`                                                         | `500`         |
    | 前缀填充               | `...openai.prefixPaddingMs`                                                           | `300`         |
    | 推理努力               | `...openai.reasoningEffort`                                                           | （未设置）    |
    | 身份验证               | `...openai.apiKey`、`OPENAI_API_KEY` 或 `openai-codex` OAuth                         | 浏览器 Talk 和非 Azure 后端桥接可使用 Codex OAuth |

    `gpt-realtime-2` 的内置 Realtime 音色：`alloy`、`ash`、`ballad`、`coral`、`echo`、`sage`、`shimmer`、`verse`、`marin`、`cedar`。OpenAI 推荐 `marin` 和 `cedar` 以获得最佳 Realtime 质量。这与上方的文本转语音音色集合不同；不要假设 `fable`、`nova` 或 `onyx` 等 TTS 音色对 Realtime Session 有效。

    <Note>
    后端 OpenAI Realtime 桥接使用 GA Realtime WebSocket Session 形状，不接受 `session.temperature`。Azure OpenAI 部署仍可通过 `azureEndpoint` 和 `azureDeployment` 使用，并保留部署兼容的 Session 形状。支持双向工具调用和 G.711 u-law 音频。
    </Note>

    <Note>
    Realtime 语音在创建 Session 时选定。OpenAI 允许之后更改大多数 Session 字段，但音色在该 Session 中模型发出音频后不能更改。OpenClaw 目前将内置 Realtime 音色 id 作为字符串公开。
    </Note>

    <Note>
    Control UI Talk 使用 OpenAI 浏览器 Realtime Session，带有 Gateway 生成的临时客户端密钥，以及直接与 OpenAI Realtime API 进行的浏览器 WebRTC SDP 交换。当没有配置直接 OpenAI API 密钥时，Gateway 可以使用选定的 `openai-codex` OAuth 配置文件生成该客户端密钥。Gateway 中继和 Voice Call 后端 Realtime WebSocket 桥接对原生 OpenAI 端点使用相同的 OAuth 回退。
    </Note>

  </Accordion>
</AccordionGroup>

## Azure OpenAI 端点

内置的 `openai` Provider 可以通过覆盖 base URL 将图像生成目标指向 Azure OpenAI 资源。在图像生成路径上，OpenClaw 检测 `models.providers.openai.baseUrl` 上的 Azure 主机名并自动切换到 Azure 的请求形状。

<Note>
实时语音使用独立的配置路径（`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`），不受 `models.providers.openai.baseUrl` 影响。有关其 Azure 设置，请参见[语音和语音合成](#voice-and-speech)下的**实时语音** Accordion。
</Note>

在以下情况下使用 Azure OpenAI：

- 您已有 Azure OpenAI 订阅、配额或企业协议
- 您需要 Azure 提供的区域数据驻留或合规控制
- 您希望在现有 Azure 租户内保持流量

### 配置

对于通过内置 `openai` Provider 的 Azure 图像生成，将 `models.providers.openai.baseUrl` 指向您的 Azure 资源，并将 `apiKey` 设置为 Azure OpenAI 密钥（而非 OpenAI Platform 密钥）：

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw 识别以下 Azure 主机后缀用于 Azure 图像生成路由：

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

对于已识别 Azure 主机上的图像生成请求，OpenClaw：

- 发送 `api-key` 标头而非 `Authorization: Bearer`
- 使用部署范围路径（`/openai/deployments/{deployment}/...`）
- 为每个请求附加 `?api-version=...`
- 对 Azure 图像生成调用使用 600 秒默认请求超时。每次调用的 `timeoutMs` 值仍可覆盖此默认值。

其他 base URL（公共 OpenAI、OpenAI 兼容代理）保留标准 OpenAI 图像请求形状。

<Note>
`openai` Provider 图像生成路径的 Azure 路由需要 OpenClaw 2026.4.22 或更高版本。早期版本将任何自定义 `openai.baseUrl` 视为公共 OpenAI 端点，对 Azure 图像部署会失败。
</Note>

### API 版本

设置 `AZURE_OPENAI_API_VERSION` 为 Azure 图像生成路径固定特定的 Azure 预览版或 GA 版本：

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

未设置变量时，默认为 `2024-12-01-preview`。

### 模型名称即部署名称

Azure OpenAI 将模型绑定到部署。对于通过内置 `openai` Provider 路由的 Azure 图像生成请求，OpenClaw 中的 `model` 字段必须是您在 Azure 门户中配置的**Azure 部署名称**，而非公共 OpenAI 模型 id。

如果您创建了一个名为 `gpt-image-2-prod` 的部署来提供 `gpt-image-2`：

```
/tool image_generate model=openai/gpt-image-2-prod prompt="A clean poster" size=1024x1024 count=1
```

同样的部署名称规则适用于通过内置 `openai` Provider 路由的图像生成调用。

### 区域可用性

Azure 图像生成目前仅在部分区域可用（例如 `eastus2`、`swedencentral`、`polandcentral`、`westus3`、`uaenorth`）。在创建部署之前，请查看 Microsoft 当前的区域列表，并确认特定模型在您的区域中提供。

### 参数差异

Azure OpenAI 和公共 OpenAI 并不总是接受相同的图像参数。Azure 可能拒绝公共 OpenAI 允许的选项（例如 `gpt-image-2` 上的某些 `background` 值），或仅在特定模型版本上公开这些选项。这些差异来自 Azure 和底层模型，而非 OpenClaw。如果 Azure 请求因验证错误而失败，请在 Azure 门户中检查您特定部署和 API 版本支持的参数集。

<Note>
Azure OpenAI 使用原生传输和兼容行为，但不接收 OpenClaw 的隐藏归因标头——请参见[高级配置](#advanced-configuration)下的**原生路由与 OpenAI 兼容路由** Accordion。

对于 Azure 上的聊天或 Responses 流量（超出图像生成），请使用入门流程或专用的 Azure Provider 配置——单独的 `openai.baseUrl` 不会选取 Azure API/身份验证形状。存在独立的 `azure-openai-responses/*` Provider；请参见下方的服务器端压缩 Accordion。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="传输方式（WebSocket vs SSE）">
    OpenClaw 对 `openai/*` 使用 WebSocket 优先、SSE 回退（`"auto"`）。

    在 `"auto"` 模式下，OpenClaw：
    - 在回退到 SSE 之前重试一次早期的 WebSocket 失败
    - 失败后，将 WebSocket 标记为降级约 60 秒，并在冷却期间使用 SSE
    - 为重试和重连附加稳定的 Session 和轮次标识标头
    - 跨传输变体规范化使用计数器（`input_tokens` / `prompt_tokens`）

    | 值               | 行为               |
    |------------------|--------------------|
    | `"auto"`（默认） | WebSocket 优先，SSE 回退 |
    | `"sse"`          | 强制仅使用 SSE     |
    | `"websocket"`    | 强制仅使用 WebSocket |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    相关 OpenAI 文档：
    - [Realtime API with WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Streaming API responses (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="快速模式">
    OpenClaw 为 `openai/*` 提供共享的快速模式切换：

    - **聊天/UI：** `/fast status|on|off`
    - **配置：** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    启用时，OpenClaw 将快速模式映射到 OpenAI 优先处理（`service_tier = "priority"`）。现有的 `service_tier` 值会被保留，快速模式不重写 `reasoning` 或 `text.verbosity`。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: true } },
          },
        },
      },
    }
    ```

    <Note>
    Session 覆盖优先于配置。在 Sessions UI 中清除 Session 覆盖会将 Session 恢复为配置的默认值。
    </Note>

  </Accordion>

  <Accordion title="优先处理（service_tier）">
    OpenAI 的 API 通过 `service_tier` 公开优先处理。在 OpenClaw 中按模型设置：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    支持的值：`auto`、`default`、`flex`、`priority`。

    <Warning>
    `serviceTier` 仅转发到原生 OpenAI 端点（`api.openai.com`）和原生 Codex 端点（`chatgpt.com/backend-api`）。如果您通过代理路由任一 Provider，OpenClaw 不会修改 `service_tier`。
    </Warning>

  </Accordion>

  <Accordion title="服务器端压缩（Responses API）">
    对于直接 OpenAI Responses 模型（`api.openai.com` 上的 `openai/*`），OpenAI Plugin 的 Pi 套件流包装器自动启用服务器端压缩：

    - 强制 `store: true`（除非模型兼容设置了 `supportsStore: false`）
    - 注入 `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - 默认 `compact_threshold`：`contextWindow` 的 70%（不可用时为 `80000`）

    这适用于内置 Pi 套件路径和嵌入式运行使用的 OpenAI Provider 钩子。原生 Codex app-server 套件通过 Codex 管理自己的上下文，并通过 OpenAI 默认 Agent 路由或 Provider/模型运行时策略配置。

    <Tabs>
      <Tab title="显式启用">
        适用于 Azure OpenAI Responses 等兼容端点：

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="自定义阈值">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="禁用">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` 仅控制 `context_management` 注入。直接 OpenAI Responses 模型仍然强制 `store: true`，除非兼容设置了 `supportsStore: false`。
    </Note>

  </Accordion>

  <Accordion title="严格 Agent GPT 模式">
    对于 `openai/*` 上的 GPT-5 系列运行，OpenClaw 可以使用更严格的嵌入式执行契约：

    ```json5
    {
      agents: {
        defaults: {
          embeddedPi: { executionContract: "strict-agentic" },
        },
      },
    }
    ```

    使用 `strict-agentic` 时，OpenClaw：
    - 当有工具操作可用时，不再将仅计划的轮次视为成功进展
    - 使用立即行动的引导重试该轮次
    - 为重要工作自动启用 `update_plan`
    - 如果模型持续计划而不行动，则显示明确的阻塞状态

    <Note>
    仅限于 OpenAI 和 Codex GPT-5 系列运行。其他 Provider 和旧模型系列保持默认行为。
    </Note>

  </Accordion>

  <Accordion title="原生路由与 OpenAI 兼容路由">
    OpenClaw 对直接 OpenAI、Codex 和 Azure OpenAI 端点的处理方式与通用 OpenAI 兼容 `/v1` 代理不同：

    **原生路由**（`openai/*`、Azure OpenAI）：
    - 仅对支持 OpenAI `none` effort 的模型保留 `reasoning: { effort: "none" }`
    - 对拒绝 `reasoning.effort: "none"` 的模型或代理省略禁用的推理
    - 默认工具 Schema 为严格模式
    - 仅在已验证的原生主机上附加隐藏的归因标头
    - 保留 OpenAI 专属请求塑形（`service_tier`、`store`、推理兼容、提示缓存提示）

    **代理/兼容路由：**
    - 使用更宽松的兼容行为
    - 从非原生 `openai-completions` 负载中剥离 Completions `store`
    - 接受高级 `params.extra_body`/`params.extraBody` 透传 JSON，用于 OpenAI 兼容 Completions 代理
    - 接受 `params.chat_template_kwargs`，用于 vLLM 等 OpenAI 兼容 Completions 代理
    - 不强制严格工具 Schema 或原生专属标头

    Azure OpenAI 使用原生传输和兼容行为，但不接收隐藏的归因标头。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="图像生成" href="/tools/image-generation" icon="image">
    共享图像工具参数和 Provider 选择。
  </Card>
  <Card title="视频生成" href="/tools/video-generation" icon="video">
    共享视频工具参数和 Provider 选择。
  </Card>
  <Card title="OAuth 和身份验证" href="/gateway/authentication" icon="key">
    身份验证详情和凭据重用规则。
  </Card>
</CardGroup>
