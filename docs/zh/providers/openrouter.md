---
mmh3_hash: "1d5b65f67fa0ae47e184c8c0cb36cd9f"
title: "OpenRouter"
summary: "在 OpenClaw 中使用 OpenRouter 的统一 API 访问多种模型"
read_when:
  - 您想要用一个 API 密钥访问多种 LLM
  - 您想通过 OpenRouter 在 OpenClaw 中运行模型
  - 您想使用 OpenRouter 进行图像生成
  - 您想使用 OpenRouter 进行视频生成
---

OpenRouter 提供**统一 API**，通过单一端点和 API 密钥将请求路由到多种模型。它与 OpenAI 兼容，因此大多数 OpenAI SDK 只需切换 Base URL 即可工作。

## 快速开始

<Steps>
  <Step title="获取 API 密钥">
    在 [openrouter.ai/keys](https://openrouter.ai/keys) 创建 API 密钥。
  </Step>
  <Step title="运行入门">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="（可选）切换到具体模型">
    入门默认为 `openrouter/auto`。稍后选择具体模型：

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## 配置示例

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## 模型引用

<Note>
模型引用遵循 `openrouter/<provider>/<model>` 的格式。有关可用 Provider 和模型的完整列表，请参见 [/concepts/model-providers](/concepts/model-providers)。
</Note>

内置回退示例：

| 模型引用                          | 备注                         |
| --------------------------------- | ---------------------------- |
| `openrouter/auto`                 | OpenRouter 自动路由           |
| `openrouter/moonshotai/kimi-k2.6` | 通过 MoonshotAI 的 Kimi K2.6 |
| `openrouter/moonshotai/kimi-k2.5` | 通过 MoonshotAI 的 Kimi K2.5 |

## 图像生成

OpenRouter 也可以支持 `image_generate` 工具。在 `agents.defaults.imageGenerationModel` 下使用 OpenRouter 图像模型：

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
        timeoutMs: 180_000,
      },
    },
  },
}
```

OpenClaw 使用 `modalities: ["image", "text"]` 通过 OpenRouter 的聊天补全图像 API 发送图像请求。Gemini 图像模型通过 OpenRouter 的 `image_config` 接收支持的 `aspectRatio` 和 `resolution` 提示。对较慢的 OpenRouter 图像模型使用 `agents.defaults.imageGenerationModel.timeoutMs`；`image_generate` 工具的每次调用 `timeoutMs` 参数仍优先生效。

## 视频生成

OpenRouter 也可以通过其异步 `/videos` API 支持 `video_generate` 工具。在 `agents.defaults.videoGenerationModel` 下使用 OpenRouter 视频模型：

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "openrouter/google/veo-3.1-fast",
      },
    },
  },
}
```

OpenClaw 向 OpenRouter 提交文本到视频和图像到视频任务，轮询返回的 `polling_url`，并从 OpenRouter 的 `unsigned_urls` 或记录的任务内容端点下载完成的视频。参考图像默认作为首帧/尾帧图像发送；标记为 `reference_image` 的图像作为 OpenRouter 输入参考发送。内置的 `google/veo-3.1-fast` 默认支持目前支持的 4/6/8 秒时长、`720P`/`1080P` 分辨率和 `16:9`/`9:16` 宽高比。视频到视频未注册到 OpenRouter，因为上游视频生成 API 目前仅接受文本和图像参考。

## 文本转语音

OpenRouter 也可以通过其 OpenAI 兼容的 `/audio/speech` 端点作为 TTS Provider 使用。

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

如果省略 `messages.tts.providers.openrouter.apiKey`，TTS 会重用 `models.providers.openrouter.apiKey`，然后是 `OPENROUTER_API_KEY`。

## 身份验证和标头

OpenRouter 在底层使用 Bearer 令牌和您的 API 密钥。

在真实的 OpenRouter 请求（`https://openrouter.ai/api/v1`）上，OpenClaw 还会添加 OpenRouter 记录的应用归因标头：

| 标头                      | 值                    |
| ------------------------- | --------------------- |
| `HTTP-Referer`            | `https://openclaw.ai`                                                                                  |
| `X-OpenRouter-Title`      | `OpenClaw`                                                                                             |
| `X-OpenRouter-Categories` | `cli-agent,cloud-agent,programming-app,creative-writing,writing-assistant,general-chat,personal-agent` |

<Warning>
如果您将 OpenRouter Provider 重新指向其他代理或 Base URL，OpenClaw **不会**注入这些 OpenRouter 特定标头或 Anthropic 缓存标记。
</Warning>

## 高级配置

<AccordionGroup>
  <Accordion title="响应缓存">
    OpenRouter 响应缓存是可选的。通过模型参数按 OpenRouter 模型启用：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openrouter/auto": {
              params: {
                responseCache: true,
                responseCacheTtlSeconds: 300,
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw 发送 `X-OpenRouter-Cache: true`，以及配置时的 `X-OpenRouter-Cache-TTL`。`responseCacheClear: true` 强制刷新当前请求并存储替换响应。也接受 snake_case 别名（`response_cache`、`response_cache_ttl_seconds` 和 `response_cache_clear`）。

    这与 Provider 提示缓存和 OpenRouter 的 Anthropic `cache_control` 标记分开。仅应用于已验证的 `openrouter.ai` 路由，不适用于自定义代理 Base URL。

  </Accordion>

  <Accordion title="Anthropic 缓存标记">
    在已验证的 OpenRouter 路由上，Anthropic 模型引用保留 OpenRouter 特定的 Anthropic `cache_control` 标记，OpenClaw 使用这些标记在系统/开发者提示块上实现更好的提示缓存复用。
  </Accordion>

  <Accordion title="Anthropic 推理预填充">
    在已验证的 OpenRouter 路由上，启用推理的 Anthropic 模型引用在请求到达 OpenRouter 之前会丢弃尾部的 assistant 预填充轮次，以符合 Anthropic 要求推理对话以用户轮次结束的规定。
  </Accordion>

  <Accordion title="思考/推理注入">
    在支持的非 `auto` 路由上，OpenClaw 将所选思考级别映射到 OpenRouter 代理推理负载。不支持的模型提示和 `openrouter/auto` 跳过该推理注入。Hunter Alpha 也为陈旧的已配置模型引用跳过代理推理，因为 OpenRouter 可能在该已退役路由的推理字段中返回最终答案文本。
  </Accordion>

  <Accordion title="DeepSeek V4 推理回放">
    在已验证的 OpenRouter 路由上，`openrouter/deepseek/deepseek-v4-flash` 和 `openrouter/deepseek/deepseek-v4-pro` 在回放的 assistant 轮次上填充缺失的 `reasoning_content`，以保持 DeepSeek V4 所需的后续形状用于思维/工具对话。OpenClaw 为这些路由发送 OpenRouter 支持的 `reasoning_effort` 值；`xhigh` 是最高广告级别，陈旧的 `max` 覆盖会映射到 `xhigh`。
  </Accordion>

  <Accordion title="OpenAI 专属请求塑形">
    OpenRouter 仍然通过代理风格的 OpenAI 兼容路径运行，因此原生 OpenAI 专属请求塑形（如 `serviceTier`、Responses `store`、OpenAI 推理兼容负载和提示缓存提示）不会被转发。
  </Accordion>

  <Accordion title="Gemini 支持路由">
    Gemini 支持的 OpenRouter 引用保持在代理 Gemini 路径上：OpenClaw 在那里保持 Gemini 思维签名清理，但不启用原生 Gemini 回放验证或引导重写。
  </Accordion>

  <Accordion title="Provider 路由元数据">
    如果您在模型参数下传递 OpenRouter Provider 路由，OpenClaw 在共享流包装器运行之前将其转发为 OpenRouter 路由元数据。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    Agent、模型和 Provider 的完整配置参考。
  </Card>
</CardGroup>
