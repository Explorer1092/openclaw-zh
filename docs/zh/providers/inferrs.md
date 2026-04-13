---
mmh3_hash: "eec43ccc109d753a45e9186e030b8c04"
summary: "通过 inferrs（OpenAI 兼容本地服务器）运行 OpenClaw"
read_when:
  - 您想针对本地 inferrs 服务器运行 OpenClaw
  - 您正在通过 inferrs 提供 Gemma 或其他模型
  - 您需要 inferrs 的确切 OpenClaw 兼容标志
title: "inferrs"
---

# inferrs

[inferrs](https://github.com/ericcurtin/inferrs) 可以在 OpenAI 兼容的 `/v1` API 后面提供本地模型。OpenClaw 通过通用的 `openai-completions` 路径与 `inferrs` 配合使用。

目前，`inferrs` 最好被视为自定义自托管 OpenAI 兼容后端，而不是专用的 OpenClaw Provider Plugin。

## 快速开始

<Steps>
  <Step title="使用模型启动 inferrs">
    ```bash
    inferrs serve google/gemma-4-E2B-it \
      --host 127.0.0.1 \
      --port 8080 \
      --device metal
    ```
  </Step>
  <Step title="验证服务器可访问">
    ```bash
    curl http://127.0.0.1:8080/health
    curl http://127.0.0.1:8080/v1/models
    ```
  </Step>
  <Step title="添加 OpenClaw Provider 条目">
    添加显式 Provider 条目并将默认模型指向它。请参见下面的完整配置示例。
  </Step>
</Steps>

## 完整配置示例

此示例在本地 `inferrs` 服务器上使用 Gemma 4。

```json5
{
  agents: {
    defaults: {
      model: { primary: "inferrs/google/gemma-4-E2B-it" },
      models: {
        "inferrs/google/gemma-4-E2B-it": {
          alias: "Gemma 4 (inferrs)",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      inferrs: {
        baseUrl: "http://127.0.0.1:8080/v1",
        apiKey: "inferrs-local",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-4-E2B-it",
            name: "Gemma 4 E2B (inferrs)",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 131072,
            maxTokens: 4096,
            compat: {
              requiresStringContent: true,
            },
          },
        ],
      },
    },
  },
}
```

## 高级

<AccordionGroup>
  <Accordion title="为什么 requiresStringContent 很重要">
    某些 `inferrs` Chat Completions 路由只接受字符串
    `messages[].content`，而不接受结构化内容部分数组。

    <Warning>
    如果 OpenClaw 运行失败，出现如下错误：

    ```text
    messages[1].content: invalid type: sequence, expected a string
    ```

    请在您的模型条目中设置 `compat.requiresStringContent: true`。
    </Warning>

    ```json5
    compat: {
      requiresStringContent: true
    }
    ```

    OpenClaw 将在发送请求之前将纯文本内容部分展平为纯字符串。

  </Accordion>

  <Accordion title="Gemma 和工具 Schema 注意事项">
    某些当前的 `inferrs` + Gemma 组合接受小型直接
    `/v1/chat/completions` 请求，但在完整的 OpenClaw Agent 运行时轮次上仍然失败。

    如果发生这种情况，请先尝试：

    ```json5
    compat: {
      requiresStringContent: true,
      supportsTools: false
    }
    ```

    这将禁用 OpenClaw 对该模型的工具 Schema 接口，并可以减少对更严格本地后端的提示压力。

    如果小型直接请求仍然有效，但正常的 OpenClaw Agent 轮次继续在 `inferrs` 内崩溃，
    剩余的问题通常是上游模型/服务器行为，而不是 OpenClaw 的传输层。

  </Accordion>

  <Accordion title="手动冒烟测试">
    配置后，测试两个层：

    ```bash
    curl http://127.0.0.1:8080/v1/chat/completions \
      -H 'content-type: application/json' \
      -d '{"model":"google/gemma-4-E2B-it","messages":[{"role":"user","content":"What is 2 + 2?"}],"stream":false}'
    ```

    ```bash
    openclaw infer model run \
      --model inferrs/google/gemma-4-E2B-it \
      --prompt "What is 2 + 2? Reply with one short sentence." \
      --json
    ```

    如果第一个命令有效但第二个失败，请查看下面的故障排除部分。

  </Accordion>

  <Accordion title="代理式行为">
    `inferrs` 被视为代理式 OpenAI 兼容 `/v1` 后端，而不是
    原生 OpenAI 端点。

    - 原生 OpenAI 专用请求塑形不适用于此处
    - 没有 `service_tier`，没有 Responses `store`，没有提示缓存提示，也没有
      OpenAI 推理兼容负载塑形
    - 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）
      不会注入到自定义 `inferrs` 基础 URL 上

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="curl /v1/models 失败">
    `inferrs` 未运行、不可访问，或未绑定到预期的
    主机/端口。确保服务器已启动并在您配置的地址上监听。
  </Accordion>

  <Accordion title="messages[].content 期望字符串">
    在模型条目中设置 `compat.requiresStringContent: true`。有关
    详细信息，请参见上面的 `requiresStringContent` 部分。
  </Accordion>

  <Accordion title="直接 /v1/chat/completions 调用通过但 openclaw infer model run 失败">
    尝试设置 `compat.supportsTools: false` 以禁用工具 Schema 接口。
    请参见上面的 Gemma 工具 Schema 注意事项。
  </Accordion>

  <Accordion title="inferrs 在较大的 Agent 轮次上仍然崩溃">
    如果 OpenClaw 不再出现 Schema 错误，但 `inferrs` 在较大的
    Agent 轮次上仍然崩溃，请将其视为上游 `inferrs` 或模型限制。减少
    提示压力或切换到不同的本地后端或模型。
  </Accordion>
</AccordionGroup>

<Tip>
如需一般帮助，请参见[故障排除](/help/troubleshooting)和 [FAQ](/help/faq)。
</Tip>

## 另请参阅

<CardGroup cols={2}>
  <Card title="本地模型" href="/gateway/local-models" icon="server">
    针对本地模型服务器运行 OpenClaw。
  </Card>
  <Card title="Gateway 故障排除" href="/gateway/troubleshooting#local-openai-compatible-backend-passes-direct-probes-but-agent-runs-fail" icon="wrench">
    调试通过直接探测但 Agent 运行失败的本地 OpenAI 兼容后端。
  </Card>
  <Card title="Model Provider" href="/concepts/model-providers" icon="layers">
    所有 Provider、模型引用和故障转移行为的概述。
  </Card>
</CardGroup>
