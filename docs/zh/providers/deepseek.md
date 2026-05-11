---
title: "DeepSeek"
mmh3_hash: "f69fa073de01d37698459ffbf4c90ea9"
summary: "DeepSeek 设置（身份验证 + 模型选择）"
read_when:
  - 您想在 OpenClaw 中使用 DeepSeek
  - 您需要 API 密钥环境变量或 CLI 身份验证选项
---

[DeepSeek](https://www.deepseek.com) 通过 OpenAI 兼容的 API 提供强大的 AI 模型。

| 属性     | 值                         |
| -------- | -------------------------- |
| Provider | `deepseek`                 |
| 身份验证 | `DEEPSEEK_API_KEY`         |
| API      | OpenAI 兼容                |
| Base URL | `https://api.deepseek.com` |

## 快速开始

<Steps>
  <Step title="获取 API 密钥">
    在 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 创建 API 密钥。
  </Step>
  <Step title="运行入门">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    这将提示您输入 API 密钥，并将 `deepseek/deepseek-v4-flash` 设置为默认模型。

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider deepseek
    ```

    要在不需要运行中的 Gateway 的情况下检查内置静态目录，请使用：

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="非交互式设置">
    对于脚本化或无头安装，直接传递所有标志：

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
如果 Gateway 作为守护进程（launchd/systemd）运行，请确保 `DEEPSEEK_API_KEY`
对该进程可用（例如，在 `~/.openclaw/.env` 中或通过 `env.shellEnv`）。
</Warning>

## 内置目录

| 模型引用                     | 名称              | 输入 | 上下文      | 最大输出  | 备注                                      |
| ---------------------------- | ----------------- | ---- | ----------- | --------- | ----------------------------------------- |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text | 1,000,000   | 384,000   | 默认模型；支持 V4 思考的接口              |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text | 1,000,000   | 384,000   | 支持 V4 思考的接口                        |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text | 131,072     | 8,192     | DeepSeek V3.2 非思考接口                  |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text | 131,072     | 65,536    | 推理启用的 V3.2 接口                      |

<Tip>
V4 模型支持 DeepSeek 的 `thinking` 控制。OpenClaw 还会在后续轮次中重放 DeepSeek `reasoning_content`，以便带有工具调用的思考会话可以继续进行。
使用 `/think xhigh` 或 `/think max` 与 DeepSeek V4 模型，以请求 DeepSeek 的最大 `reasoning_effort`。
</Tip>

## 思考与工具

DeepSeek V4 思考会话的重放规则比大多数 OpenAI 兼容 Provider 更严格：当启用思考的助手消息包含工具调用时，DeepSeek 期望在后续请求中发回之前助手的 `reasoning_content`。OpenClaw 在 DeepSeek 插件内部处理这个问题，因此普通的多轮工具使用可以与 `deepseek/deepseek-v4-flash` 和 `deepseek/deepseek-v4-pro` 正常工作。

如果您将现有会话从另一个 OpenAI 兼容 Provider 切换到 DeepSeek V4 模型，旧的助手工具调用轮次可能没有原生 DeepSeek `reasoning_content`。OpenClaw 会为 DeepSeek V4 思考请求填充缺失的字段，以便 Provider 可以接受重放的工具调用历史而无需 `/new`。

当 OpenClaw 中禁用思考（包括 UI **None** 选择）时，OpenClaw 发送 DeepSeek `thinking: { type: "disabled" }` 并从输出历史中删除重放的 `reasoning_content`。这使禁用思考的会话保持在 DeepSeek 非思考路径上。

对于默认快速路径，使用 `deepseek/deepseek-v4-flash`。当您需要更强大的 V4 模型且可以接受更高成本或延迟时，使用 `deepseek/deepseek-v4-pro`。

## 实时测试

直接实时模型套件在现代模型集中包含 DeepSeek V4。要仅运行 DeepSeek V4 直接模型检查：

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

该实时检查验证两个 V4 模型都能完成，且思考/工具后续轮次保留 DeepSeek 所需的重放负载。

## 配置示例

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    Agent、模型和 Provider 的完整配置参考。
  </Card>
</CardGroup>
