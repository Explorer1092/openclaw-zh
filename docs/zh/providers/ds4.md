---
summary: "通过 ds4（本地 DeepSeek V4 Flash OpenAI 兼容服务器）运行 OpenClaw"
read_when:
  - 你想通过 antirez/ds4 运行 OpenClaw 时
  - 你想要一个支持工具调用的本地 DeepSeek V4 Flash 后端时
  - 你需要 ds4-server 的 OpenClaw 配置时
title: "ds4"
---

[ds4](https://github.com/antirez/ds4) 通过本地 Metal 后端提供 DeepSeek V4 Flash，并提供 OpenAI 兼容的 `/v1` API。OpenClaw 通过通用的 `openai-completions` Provider 系列连接到 ds4。

ds4 不是 OpenClaw 的捆绑 Provider 插件。在 `models.providers.ds4` 下配置它，然后选择 `ds4/deepseek-v4-flash`。

- Provider ID：`ds4`
- 插件：无
- API：OpenAI 兼容聊天补全（`openai-completions`）
- 建议的 base URL：`http://127.0.0.1:18000/v1`
- 模型 ID：`deepseek-v4-flash`
- 工具调用：通过 OpenAI 风格的 `tools` 和 `tool_calls` 支持
- 推理：DeepSeek 风格的 `thinking` 和 `reasoning_effort`

## 要求

- 支持 Metal 的 macOS。
- 一个可用的 ds4 检出版本，包含 `ds4-server` 和 DeepSeek V4 Flash GGUF 文件。
- 足够的内存用于你选择的上下文。较大的 `--ctx` 值在服务器启动时分配更多 KV 内存。

<Warning>
OpenClaw Agent 轮次包含工具 Schema 和工作区上下文。像 `--ctx 4096` 这样的极小上下文可以通过直接 curl 测试，但在完整 Agent 运行时会因 `500 prompt exceeds context` 而失败。Agent 和工具冒烟测试至少使用 `--ctx 32768`。仅在内存足够且想要 ds4 Think Max 行为时才使用 `--ctx 393216`。
</Warning>

## 快速开始

<Steps>
  <Step title="启动 ds4-server">
    将 `<DS4_DIR>` 替换为你的 ds4 检出路径。

    ```bash
    <DS4_DIR>/ds4-server \
      --model <DS4_DIR>/ds4flash.gguf \
      --host 127.0.0.1 \
      --port 18000 \
      --ctx 32768 \
      --tokens 128
    ```

  </Step>
  <Step title="验证 OpenAI 兼容端点">
    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

    响应应包含 `deepseek-v4-flash`。

  </Step>
  <Step title="添加 OpenClaw Provider 配置">
    添加[完整配置](#full-config)中的配置，然后运行一次性模型检查：

    ```bash
    openclaw infer model run \
      --local \
      --model ds4/deepseek-v4-flash \
      --thinking off \
      --prompt "Reply with exactly: openclaw-ds4-ok" \
      --json
    ```

  </Step>
</Steps>

## 完整配置

在 ds4 已运行于 `127.0.0.1:18000` 时使用此配置。

```json5
{
  agents: {
    defaults: {
      model: { primary: "ds4/deepseek-v4-flash" },
      models: {
        "ds4/deepseek-v4-flash": {
          alias: "DS4 local",
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

保持 `contextWindow` 与 `ds4-server --ctx` 值一致。保持 `maxTokens` 与 `--tokens` 一致，除非你有意希望 OpenClaw 请求的输出少于服务器默认值。

## 按需启动

OpenClaw 可以仅在选择 `ds4/...` 模型时启动 ds4。将 `localService` 添加到同一 Provider 条目：

```json5
{
  models: {
    providers: {
      ds4: {
        baseUrl: "http://127.0.0.1:18000/v1",
        apiKey: "ds4-local",
        api: "openai-completions",
        timeoutSeconds: 300,
        localService: {
          command: "<DS4_DIR>/ds4-server",
          args: [
            "--model",
            "<DS4_DIR>/ds4flash.gguf",
            "--host",
            "127.0.0.1",
            "--port",
            "18000",
            "--ctx",
            "32768",
            "--tokens",
            "128",
          ],
          cwd: "<DS4_DIR>",
          healthUrl: "http://127.0.0.1:18000/v1/models",
          readyTimeoutMs: 300000,
          idleStopMs: 0,
        },
        models: [
          {
            id: "deepseek-v4-flash",
            name: "DeepSeek V4 Flash (ds4)",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32768,
            maxTokens: 128,
            compat: {
              supportsUsageInStreaming: true,
              supportsReasoningEffort: true,
              maxTokensField: "max_tokens",
              supportsStrictMode: false,
              thinkingFormat: "deepseek",
              supportedReasoningEfforts: ["low", "medium", "high", "xhigh"],
            },
          },
        ],
      },
    },
  },
}
```

`command` 必须是绝对可执行路径。不使用 Shell 查找和 `~` 展开。参见[本地模型服务](/gateway/local-model-services)了解所有 `localService` 字段。

## Think Max

ds4 仅在以下两个条件同时满足时应用 Think Max：

- `ds4-server` 以 `--ctx 393216` 或更高值启动。
- 请求使用 `reasoning_effort: "max"` 或等效的 ds4 effort 字段。

如果运行该大型上下文，请同时更新服务器标志和 OpenClaw 模型元数据：

```json5
{
  contextWindow: 393216,
  maxTokens: 384000,
  compat: {
    supportsUsageInStreaming: true,
    supportsReasoningEffort: true,
    maxTokensField: "max_tokens",
    supportsStrictMode: false,
    thinkingFormat: "deepseek",
    supportedReasoningEfforts: ["low", "medium", "high", "xhigh", "max"],
  },
}
```

## 测试

从直接 HTTP 检查开始：

```bash
curl http://127.0.0.1:18000/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"Reply with exactly: ds4-ok"}],"max_tokens":16,"stream":false,"thinking":{"type":"disabled"}}'
```

然后测试 OpenClaw 模型路由：

```bash
openclaw infer model run \
  --local \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --prompt "Reply with exactly: openclaw-ds4-ok" \
  --json
```

对于完整的 Agent 和工具调用冒烟测试，使用至少 32768 的上下文：

```bash
openclaw agent \
  --local \
  --session-id ds4-tool-smoke \
  --model ds4/deepseek-v4-flash \
  --thinking off \
  --message "Use the shell command pwd once, then reply exactly: tool-ok <output>" \
  --json \
  --timeout 240
```

预期结果：

- `executionTrace.winnerProvider` 为 `ds4`
- `executionTrace.winnerModel` 为 `deepseek-v4-flash`
- `toolSummary.calls` 至少为 `1`
- `finalAssistantVisibleText` 以 `tool-ok` 开头

## 故障排除

<AccordionGroup>
  <Accordion title="curl /v1/models 无法连接">
    ds4 未运行或未绑定到 `baseUrl` 中的主机和端口。启动 `ds4-server`，然后重试：

    ```bash
    curl http://127.0.0.1:18000/v1/models
    ```

  </Accordion>

  <Accordion title="500 prompt exceeds context">
    配置的 `--ctx` 对于 OpenClaw 轮次来说太小了。提高 `ds4-server --ctx`，然后更新 `models.providers.ds4.models[].contextWindow` 以匹配。带工具的完整 Agent 轮次需要比直接单消息 curl 请求多得多的上下文。
  </Accordion>

  <Accordion title="Think Max 未激活">
    ds4 仅在 `--ctx` 至少为 `393216` 且请求要求 `reasoning_effort: "max"` 时使用 Think Max。较小的上下文回退到高推理。
  </Accordion>

  <Accordion title="第一个请求很慢">
    ds4 有冷 Metal 驻留和模型预热阶段。当 OpenClaw 按需启动服务器时，使用 `localService.readyTimeoutMs: 300000`。
  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="本地模型服务" href="/gateway/local-model-services" icon="play">
    在模型请求之前按需启动本地模型服务器。
  </Card>
  <Card title="本地模型" href="/gateway/local-models" icon="server">
    选择和操作本地模型后端。
  </Card>
  <Card title="模型 Provider" href="/concepts/model-providers" icon="layers">
    配置 Provider 引用、认证和故障转移。
  </Card>
  <Card title="DeepSeek" href="/providers/deepseek" icon="brain">
    原生 DeepSeek Provider 行为和 Thinking 控制。
  </Card>
</CardGroup>
