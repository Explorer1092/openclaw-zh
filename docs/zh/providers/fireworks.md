---
title: "Fireworks"
mmh3_hash: "738d28ec52fed41f606831f9efdb6349"
summary: "Fireworks 设置（身份验证 + 模型选择）"
read_when:
  - 您想在 OpenClaw 中使用 Fireworks
  - 您需要 Fireworks API 密钥环境变量或默认模型 id
---

[Fireworks](https://fireworks.ai) 通过 OpenAI 兼容的 API 公开开放权重和路由模型。OpenClaw 内置了 Fireworks Provider 插件。

| 属性          | 值                                                     |
| ------------- | ------------------------------------------------------ |
| Provider      | `fireworks`                                            |
| 身份验证      | `FIREWORKS_API_KEY`                                    |
| API           | OpenAI 兼容的聊天/补全                                 |
| Base URL      | `https://api.fireworks.ai/inference/v1`                |
| 默认模型      | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## 快速开始

<Steps>
  <Step title="通过入门设置 Fireworks 身份验证">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    这会将您的 Fireworks 密钥存储在 OpenClaw 配置中，并将 Fire Pass 入门模型设置为默认值。

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## 非交互式示例

对于脚本化或 CI 设置，在命令行上传递所有值：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 内置目录

| 模型引用                                               | 名称                        | 输入       | 上下文  | 最大输出 | 备注                                                                                         |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | -------- | -------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | text,image | 262,144 | 262,144  | Fireworks 上最新的 Kimi 模型。Fireworks K2.6 请求的思考功能被禁用；如需 Kimi 思考输出，请直接通过 Moonshot 路由。 |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000  | Fireworks 上的默认内置入门模型                                                               |

<Tip>
如果 Fireworks 发布了更新的模型（例如新的 Qwen 或 Gemma 版本），您可以直接使用其 Fireworks 模型 id 切换到该模型，无需等待内置目录更新。
</Tip>

## 自定义 Fireworks 模型 id

OpenClaw 也接受动态 Fireworks 模型 id。使用 Fireworks 显示的确切模型或路由器 id，并在前面加上 `fireworks/`。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="模型 id 前缀的工作方式">
    OpenClaw 中的每个 Fireworks 模型引用都以 `fireworks/` 开头，后跟来自 Fireworks 平台的确切 id 或路由器路径。例如：

    - 路由器模型：`fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - 直接模型：`fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw 在构建 API 请求时去掉 `fireworks/` 前缀，并将剩余路径发送到 Fireworks 端点。

  </Accordion>

  <Accordion title="环境注意事项">
    如果 Gateway 在您的交互式 Shell 之外运行，请确保 `FIREWORKS_API_KEY` 对该进程也可用。

    <Warning>
    仅存在于 `~/.profile` 中的密钥不会帮助 launchd/systemd 守护进程，除非该环境也被导入其中。在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 设置密钥，以确保 Gateway 进程可以读取它。
    </Warning>

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常规故障排除和 FAQ。
  </Card>
</CardGroup>
