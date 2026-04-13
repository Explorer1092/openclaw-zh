---
title: "DeepSeek"
mmh3_hash: "eeee41e57c6b076f7e76a88b50e3bb6f"
summary: "DeepSeek 设置（身份验证 + 模型选择）"
read_when:
  - 您想在 OpenClaw 中使用 DeepSeek
  - 您需要 API 密钥环境变量或 CLI 身份验证选项
---

# DeepSeek

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

    这将提示您输入 API 密钥，并将 `deepseek/deepseek-chat` 设置为默认模型。

  </Step>
  <Step title="验证模型是否可用">
    ```bash
    openclaw models list --provider deepseek
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

| 模型引用                     | 名称              | 输入 | 上下文  | 最大输出 | 备注                                              |
| ---------------------------- | ----------------- | ---- | ------- | -------- | ------------------------------------------------- |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text | 131,072 | 8,192    | 默认模型；DeepSeek V3.2 非思考界面                |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text | 131,072 | 65,536   | 推理启用的 V3.2 界面                              |

<Tip>
两个内置模型在源码中均声明了流式传输使用兼容性。
</Tip>

## 配置示例

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-chat" },
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
