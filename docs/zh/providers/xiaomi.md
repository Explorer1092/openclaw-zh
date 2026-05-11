---
title: "Xiaomi MiMo"
mmh3_hash: "a8deb4ae4b93c0c02e2a51e0a0a1fbbf"
summary: "将 Xiaomi MiMo 模型与 OpenClaw 一起使用"
read_when:
  - 您想在 OpenClaw 中使用 Xiaomi MiMo 模型
  - 您需要 XIAOMI_API_KEY 设置
---

Xiaomi MiMo 是 **MiMo** 模型的 API 平台。OpenClaw 使用 Xiaomi
OpenAI 兼容端点和 API 密钥身份验证。

| 属性     | 值                              |
| -------- | ------------------------------- |
| Provider | `xiaomi`                        |
| 身份验证 | `XIAOMI_API_KEY`                |
| API      | OpenAI 兼容                     |
| Base URL | `https://api.xiaomimimo.com/v1` |

## 快速开始

<Steps>
  <Step title="获取 API 密钥">
    在 [Xiaomi MiMo 控制台](https://platform.xiaomimimo.com/#/console/api-keys)中创建 API 密钥。
  </Step>
  <Step title="运行入门">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    或直接传递密钥：

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## 内置目录

| 模型引用               | 输入        | 上下文    | 最大输出 | 推理 | 说明     |
| ---------------------- | ----------- | --------- | -------- | ---- | -------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192    | 否   | 默认模型 |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000   | 是   | 大上下文 |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000   | 是   | 多模态   |

<Tip>
默认模型引用为 `xiaomi/mimo-v2-flash`。当设置 `XIAOMI_API_KEY` 或存在身份验证配置文件时，Provider 会自动注入。
</Tip>

## 文本转语音

内置的 `xiaomi` Plugin 还将 Xiaomi MiMo 注册为 `messages.tts` 的语音 Provider。它使用文本作为 `assistant` 消息，可选的风格指导作为 `user` 消息，调用 Xiaomi 的 chat-completions TTS 合约。

| 属性     | 值                                       |
| -------- | ---------------------------------------- |
| TTS ID   | `xiaomi`（`mimo` 别名）                  |
| 身份验证 | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` with `audio` |
| 默认     | `mimo-v2.5-tts`，声音 `mimo_default`     |
| 输出     | 默认 MP3；配置后输出 WAV                  |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

内置支持的声音包括 `mimo_default`、`default_zh`、`default_en`、`Mia`、`Chloe`、`Milo` 和 `Dean`。旧版 MiMo TTS 账户仍支持 `mimo-v2-tts`；默认使用当前的 MiMo-V2.5 TTS 模型。对于 Feishu 和 Telegram 等语音备注目标，OpenClaw 在投递前使用 `ffmpeg` 将 Xiaomi 输出转码为 48kHz Opus。

## 配置示例

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="自动注入行为">
    当您的环境中设置了 `XIAOMI_API_KEY` 或存在身份验证配置文件时，`xiaomi` Provider 会自动注入。除非您想覆盖模型元数据或 Base URL，否则无需手动配置 Provider。
  </Accordion>

  <Accordion title="模型详情">
    - **mimo-v2-flash** — 轻量快速，适合通用文本任务。不支持推理。
    - **mimo-v2-pro** — 支持推理，拥有 1M 词元上下文窗口，适合长文档工作负载。
    - **mimo-v2-omni** — 支持推理的多模态模型，可接受文本和图像输入。

    <Note>
    所有模型使用 `xiaomi/` 前缀（例如 `xiaomi/mimo-v2-pro`）。
    </Note>

  </Accordion>

  <Accordion title="故障排查">
    - 如果模型未显示，请确认 `XIAOMI_API_KEY` 已设置且有效。
    - 当 Gateway 作为守护进程运行时，请确保密钥对该进程可用（例如在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。

    <Warning>
    仅在交互式 shell 中设置的密钥对守护进程管理的 Gateway 进程不可见。请使用 `~/.openclaw/.env` 或 `env.shellEnv` 配置以持久可用。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    完整的 OpenClaw 配置参考。
  </Card>
  <Card title="Xiaomi MiMo 控制台" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Xiaomi MiMo 控制台和 API 密钥管理。
  </Card>
</CardGroup>
