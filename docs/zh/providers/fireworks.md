---
mmh3_hash: "1d02e90bbd8a975902227c3cd73a0a2f"
title: "Fireworks"
summary: "Fireworks 设置（身份验证 + 模型选择）"
read_when:
  - 您想在 OpenClaw 中使用 Fireworks
  - 您需要 Fireworks API 密钥环境变量或默认模型 id
  - 您在调试 Fireworks 上 Kimi 思考关闭行为
---

[Fireworks](https://fireworks.ai) 通过 OpenAI 兼容的 API 公开开放权重和路由模型。OpenClaw 内置了 Fireworks Provider Plugin，预置了两个 Kimi 模型目录，并在运行时接受任何 Fireworks 模型或路由器 id。

| 属性             | 值                                                     |
| ---------------- | ------------------------------------------------------ |
| Provider id      | `fireworks`（别名：`fireworks-ai`）                    |
| Plugin           | 内置，`enabledByDefault: true`                          |
| 认证环境变量     | `FIREWORKS_API_KEY`                                    |
| Onboarding flag  | `--auth-choice fireworks-api-key`                      |
| 直接 CLI 标志    | `--fireworks-api-key <key>`                            |
| API              | OpenAI 兼容（`openai-completions`）                    |
| Base URL         | `https://api.fireworks.ai/inference/v1`                |
| 默认模型         | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| 默认别名         | `Kimi K2.5 Turbo`                                      |

## 快速开始

<Steps>
  <Step title="设置 Fireworks API 密钥">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash 直接标志
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash 仅环境变量
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    Onboarding 将密钥存储在您的认证配置文件中的 `fireworks` Provider 下，并将 **Fire Pass** Kimi K2.5 Turbo 路由器设置为默认模型。

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider fireworks
    ```

    列表应包含 `Kimi K2.6` 和 `Kimi K2.5 Turbo (Fire Pass)`。如果 `FIREWORKS_API_KEY` 未解析，`openclaw models status --json` 会在 `auth.unusableProfiles` 下报告缺失的凭据。

  </Step>
</Steps>

## 非交互式设置

对于脚本化或 CI 安装，在命令行上传递所有内容：

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## 内置目录

| 模型引用                                               | 名称                        | 输入           | 上下文  | 最大输出 | 思考     |
| ------------------------------------------------------ | --------------------------- | -------------- | ------- | -------- | -------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | 文本 + 图像    | 262,144 | 262,144  | 强制关闭 |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | 文本 + 图像    | 256,000 | 256,000  | 强制关闭（默认） |

<Note>
  OpenClaw 将所有 Fireworks Kimi 模型固定为 `thinking: off`，因为 Fireworks 在生产中拒绝 Kimi 思考参数。通过 [Moonshot](/providers/moonshot) 直接路由相同模型可以保留 Kimi 推理输出。有关在 Provider 之间切换，请参见[思考模式](/tools/thinking)。
</Note>

## 自定义 Fireworks 模型 id

OpenClaw 在运行时接受任何 Fireworks 模型或路由器 id。使用 Fireworks 显示的确切 id，并在前面加上 `fireworks/`。动态解析会克隆 Fire Pass 模板（文本 + 图像输入，OpenAI 兼容 API，默认零成本），并在 id 匹配 Kimi 模式时自动禁用思考。

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
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

    OpenClaw 在构建 API 请求时去掉 `fireworks/` 前缀，并将剩余路径作为 OpenAI 兼容的 `model` 字段发送到 Fireworks 端点。

  </Accordion>

  <Accordion title="为何对 Kimi 强制关闭思考">
    Fireworks K2.6 在请求携带 `reasoning_*` 参数时会返回 400 错误，即使 Kimi 通过 Moonshot 自己的 API 支持思考。捆绑的策略（`extensions/fireworks/thinking-policy.ts`）仅为 Kimi 模型 id 声明 `off` 思考级别，因此手动 `/think` 开关和 Provider 策略界面与运行时规范保持一致。

    要端到端使用 Kimi 推理，请配置 [Moonshot Provider](/providers/moonshot) 并通过它路由相同的模型。

  </Accordion>

  <Accordion title="守护进程的环境可用性">
    如果 Gateway 作为托管服务（launchd、systemd、Docker）运行，Fireworks 密钥必须对该进程可见，而不仅仅是对您的交互式 Shell。

    <Warning>
      仅存在于 `~/.profile` 中的密钥不会帮助 launchd 或 systemd 守护进程，除非该环境也被导入其中。在 `~/.openclaw/.env` 中或通过 `env.shellEnv` 设置密钥，使其可从 Gateway 进程读取。
    </Warning>

    在 macOS 上，`openclaw gateway install` 已经将 `~/.openclaw/.env` 连接到 LaunchAgent 环境文件中。轮换密钥后重新运行安装（或 `openclaw doctor --fix`）。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型 Provider" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="思考模式" href="/tools/thinking" icon="brain">
    `/think` 级别、Provider 策略和路由推理模型。
  </Card>
  <Card title="Moonshot" href="/providers/moonshot" icon="moon">
    通过 Moonshot 自己的 API 以原生思考输出运行 Kimi。
  </Card>
  <Card title="故障排除" href="/help/troubleshooting" icon="wrench">
    常规故障排除和 FAQ。
  </Card>
</CardGroup>
