---
mmh3_hash: "03ae348905e3f5edfcdbcb705b303cb0"
title: "Volcengine (Doubao)"
summary: "火山引擎设置（Doubao 模型、通用 + 编码端点）"
read_when:
  - 您想在 OpenClaw 中使用火山引擎或 Doubao 模型
  - 您需要 Volcengine API 密钥设置
---

# Volcengine（Doubao）

Volcengine Provider 提供对 Doubao 模型和火山引擎上托管的第三方模型的访问，为通用和编码工作负载分别提供单独的端点。

| 详细信息   | 值                                                  |
| --------- | --------------------------------------------------- |
| Provider  | `volcengine`（通用）+ `volcengine-plan`（编码）      |
| 身份验证  | `VOLCANO_ENGINE_API_KEY`                            |
| API       | OpenAI 兼容                                         |

## 快速开始

<Steps>
  <Step title="设置 API 密钥">
    运行交互式入门：

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    这将从单个 API 密钥注册通用（`volcengine`）和编码（`volcengine-plan`）Provider。

  </Step>
  <Step title="设置默认模型">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
对于非交互式设置（CI、脚本），直接传递密钥：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Provider 和端点

| Provider          | 端点                                      | 用途       |
| ----------------- | ----------------------------------------- | ---------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | 通用模型   |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | 编码模型   |

<Note>
两个 Provider 都从单个 API 密钥配置。设置会自动注册两者。
</Note>

## 可用模型

<Tabs>
  <Tab title="通用（volcengine）">
    | 模型引用                                             | 名称                            | 输入        | 上下文  |
    | ---------------------------------------------------- | ------------------------------- | ----------- | ------- |
    | `volcengine/doubao-seed-1-8-251228`                  | Doubao Seed 1.8                 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028`         | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                        | Kimi K2.5                       | text, image | 256,000 |
    | `volcengine/glm-4-7-251222`                          | GLM 4.7                         | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`                    | DeepSeek V3.2                   | text, image | 128,000 |
  </Tab>
  <Tab title="编码（volcengine-plan）">
    | 模型引用                                              | 名称                     | 输入 | 上下文  |
    | ----------------------------------------------------- | ------------------------ | ---- | ------- |
    | `volcengine-plan/ark-code-latest`                     | Ark Coding Plan          | text | 256,000 |
    | `volcengine-plan/doubao-seed-code`                    | Doubao Seed Code         | text | 256,000 |
    | `volcengine-plan/glm-4.7`                             | GLM 4.7 Coding           | text | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                    | Kimi K2 Thinking         | text | 256,000 |
    | `volcengine-plan/kimi-k2.5`                           | Kimi K2.5 Coding         | text | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028`     | Doubao Seed Code Preview | text | 256,000 |
  </Tab>
</Tabs>

## 高级说明

<AccordionGroup>
  <Accordion title="入门后的默认模型">
    `openclaw onboard --auth-choice volcengine-api-key` 目前将
    `volcengine-plan/ark-code-latest` 设置为默认模型，同时也注册通用 `volcengine` 目录。
  </Accordion>

  <Accordion title="模型选择器回退行为">
    在入门/配置模型选择期间，Volcengine 身份验证选项优先显示
    `volcengine/*` 和 `volcengine-plan/*` 行。如果这些模型尚未加载，
    OpenClaw 会回退到未过滤的目录，而不是显示空的 Provider 范围选择器。
  </Accordion>

  <Accordion title="守护进程的环境变量">
    如果 Gateway 作为守护进程（launchd/systemd）运行，请确保
    `VOLCANO_ENGINE_API_KEY` 对该进程可用（例如，在
    `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
  </Accordion>
</AccordionGroup>

<Warning>
将 OpenClaw 作为后台服务运行时，在交互式 shell 中设置的环境变量不会自动继承。请参见上面的守护进程说明。
</Warning>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置" href="/configuration" icon="gear">
    Agent、模型和 Provider 的完整配置参考。
  </Card>
  <Card title="故障排查" href="/help/troubleshooting" icon="wrench">
    常见问题和调试步骤。
  </Card>
  <Card title="FAQ" href="/help/faq" icon="circle-question">
    关于 OpenClaw 设置的常见问题。
  </Card>
</CardGroup>
