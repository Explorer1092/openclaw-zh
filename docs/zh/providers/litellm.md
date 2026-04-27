---
title: "LiteLLM"
mmh3_hash: "98415298ca247d4ef6ada47d733ebd2f"
summary: "通过 LiteLLM Proxy 运行 OpenClaw 以实现统一的模型访问和成本跟踪"
read_when:
  - 您想要通过 LiteLLM 代理路由 OpenClaw
  - 您需要通过 LiteLLM 进行成本跟踪、日志记录或模型路由
---

# LiteLLM

[LiteLLM](https://litellm.ai) 是一个开源 LLM 网关，为 100 多个模型 Provider 提供统一 API。通过 LiteLLM 路由 OpenClaw，可以实现集中的成本跟踪、日志记录，以及无需更改 OpenClaw 配置即可切换后端的灵活性。

<Tip>
**为什么在 OpenClaw 中使用 LiteLLM？**

- **成本跟踪** — 精确了解 OpenClaw 在所有模型上的支出
- **模型路由** — 在 Claude、GPT-4、Gemini、Bedrock 之间切换，无需更改配置
- **虚拟密钥** — 为 OpenClaw 创建带支出限制的密钥
- **日志记录** — 用于调试的完整请求/响应日志
- **故障转移** — 当主要 Provider 宕机时自动切换
  </Tip>

## 快速开始

<Tabs>
  <Tab title="入门（推荐）">
    **最适合：** 最快速地完成 LiteLLM 设置。

    <Steps>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="手动设置">
    **最适合：** 对安装和配置进行完全控制。

    <Steps>
      <Step title="启动 LiteLLM Proxy">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="将 OpenClaw 指向 LiteLLM">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        就这些。OpenClaw 现在通过 LiteLLM 路由。
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 配置

### 环境变量

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### 配置文件

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## 高级配置

### 图像生成

LiteLLM 还可以通过 OpenAI 兼容的 `/images/generations` 和 `/images/edits` 路由为 `image_generate` 工具提供支持。在 `agents.defaults.imageGenerationModel` 下配置 LiteLLM 图像模型：

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

环回 LiteLLM URL（如 `http://localhost:4000`）无需全局私有网络覆盖即可使用。对于局域网托管的代理，请设置 `models.providers.litellm.request.allowPrivateNetwork: true`，因为 API 密钥将发送到配置的代理主机。

<AccordionGroup>
  <Accordion title="虚拟密钥">
    为 OpenClaw 创建一个带支出限制的专用密钥：

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    将生成的密钥用作 `LITELLM_API_KEY`。

  </Accordion>

  <Accordion title="模型路由">
    LiteLLM 可以将模型请求路由到不同的后端。在您的 LiteLLM `config.yaml` 中配置：

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw 继续请求 `claude-opus-4-6` — LiteLLM 处理路由。

  </Accordion>

  <Accordion title="查看使用情况">
    查看 LiteLLM 的仪表板或 API：

    ```bash
    # 密钥信息
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # 支出日志
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="代理行为注意事项">
    - LiteLLM 默认运行在 `http://localhost:4000`
    - OpenClaw 通过 LiteLLM 的代理样式 OpenAI 兼容 `/v1` 端点连接
    - 原生 OpenAI 独有的请求塑形不适用于 LiteLLM：无 `service_tier`、无 Responses `store`、无 prompt 缓存提示，也无 OpenAI 推理兼容负载塑形
    - 自定义 LiteLLM Base URL 上不注入隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）
  </Accordion>
</AccordionGroup>

<Note>
有关一般 Provider 配置和故障转移行为，请参见[模型 Provider](/concepts/model-providers)。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="LiteLLM 文档" href="https://docs.litellm.ai" icon="book">
    官方 LiteLLM 文档和 API 参考。
  </Card>
  <Card title="模型 Provider" href="/concepts/model-providers" icon="layers">
    所有 Provider、模型引用和故障转移行为的概述。
  </Card>
  <Card title="配置" href="/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
  <Card title="模型选择" href="/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
</CardGroup>
