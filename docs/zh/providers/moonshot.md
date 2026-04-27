---
mmh3_hash: "ddf8429a63f6abec0896ff47587638f9"
title: "Moonshot AI"
summary: "配置 Moonshot K2 vs Kimi Coding（单独的 Provider + 密钥）"
read_when:
  - 您想设置 Moonshot K2 (Moonshot Open Platform) vs Kimi Coding
  - 您需要了解单独的端点、密钥和模型引用
  - 您想要复制/粘贴任一 Provider 的配置
---

# Moonshot AI (Kimi)

Moonshot 提供 Kimi API，具有 OpenAI 兼容的端点。配置 Provider 并将默认模型设置为 `moonshot/kimi-k2.6`，或使用 Kimi Coding 的 `kimi/kimi-code`。

<Warning>
Moonshot 和 Kimi Coding 是**独立的 Provider**。密钥不可互换，端点不同，模型引用也不同（`moonshot/...` vs `kimi/...`）。
</Warning>

## 内置模型目录

[//]: # "moonshot-kimi-k2-ids:start"

| 模型引用                          | 名称                   | 推理  | 输入        | 上下文  | 最大输出 |
| --------------------------------- | ---------------------- | ----- | ----------- | ------- | -------- |
| `moonshot/kimi-k2.6`              | Kimi K2.6              | 否    | text, image | 262,144 | 262,144  |
| `moonshot/kimi-k2.5`              | Kimi K2.5              | 否    | text, image | 262,144 | 262,144  |
| `moonshot/kimi-k2-thinking`       | Kimi K2 Thinking       | 是    | text        | 262,144 | 262,144  |
| `moonshot/kimi-k2-thinking-turbo` | Kimi K2 Thinking Turbo | 是    | text        | 262,144 | 262,144  |
| `moonshot/kimi-k2-turbo`          | Kimi K2 Turbo          | 否    | text        | 256,000 | 16,384   |

[//]: # "moonshot-kimi-k2-ids:end"

当前 Moonshot 托管的 K2 模型的内置成本估算使用 Moonshot 公布的按量付费费率：Kimi K2.6 为 $0.16/MTok 缓存命中、$0.95/MTok 输入、$4.00/MTok 输出；Kimi K2.5 为 $0.10/MTok 缓存命中、$0.60/MTok 输入、$3.00/MTok 输出。其他旧版目录条目保留零成本占位符，除非您在配置中覆盖它们。

## 快速开始

选择您的 Provider 并按照设置步骤操作。

<Tabs>
  <Tab title="Moonshot API">
    **适合：** 通过 Moonshot Open Platform 使用 Kimi K2 模型。

    <Steps>
      <Step title="选择端点区域">
        | Auth 选项              | 端点                           | 区域          |
        | ---------------------- | ------------------------------ | ------------- |
        | `moonshot-api-key`     | `https://api.moonshot.ai/v1`   | 国际          |
        | `moonshot-api-key-cn`  | `https://api.moonshot.cn/v1`   | 中国          |
      </Step>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice moonshot-api-key
        ```

        或使用中国端点：

        ```bash
        openclaw onboard --auth-choice moonshot-api-key-cn
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "moonshot/kimi-k2.6" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider moonshot
        ```
      </Step>
      <Step title="运行实时冒烟测试">
        当您想要验证模型访问和成本跟踪而不影响正常 Session 时，请使用隔离的状态目录：

        ```bash
        OPENCLAW_CONFIG_PATH=/tmp/openclaw-kimi/openclaw.json \
        OPENCLAW_STATE_DIR=/tmp/openclaw-kimi \
        openclaw agent --local \
          --session-id live-kimi-cost \
          --message 'Reply exactly: KIMI_LIVE_OK' \
          --thinking off \
          --json
        ```

        JSON 响应应报告 `provider: "moonshot"` 和 `model: "kimi-k2.6"`。当 Moonshot 返回使用元数据时，助手转录条目会在 `usage.cost` 下存储归一化的令牌使用量加上估算成本。
      </Step>
    </Steps>

    ### 配置示例

    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: {
            // moonshot-kimi-k2-aliases:start
            "moonshot/kimi-k2.6": { alias: "Kimi K2.6" },
            "moonshot/kimi-k2.5": { alias: "Kimi K2.5" },
            "moonshot/kimi-k2-thinking": { alias: "Kimi K2 Thinking" },
            "moonshot/kimi-k2-thinking-turbo": { alias: "Kimi K2 Thinking Turbo" },
            "moonshot/kimi-k2-turbo": { alias: "Kimi K2 Turbo" },
            // moonshot-kimi-k2-aliases:end
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              // moonshot-kimi-k2-models:start
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2.5",
                name: "Kimi K2.5",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.6, output: 3, cacheRead: 0.1, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking",
                name: "Kimi K2 Thinking",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-thinking-turbo",
                name: "Kimi K2 Thinking Turbo",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
              {
                id: "kimi-k2-turbo",
                name: "Kimi K2 Turbo",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 256000,
                maxTokens: 16384,
              },
              // moonshot-kimi-k2-models:end
            ],
          },
        },
      },
    }
    ```

  </Tab>

  <Tab title="Kimi Coding">
    **适合：** 通过 Kimi Coding 端点进行代码专注任务。

    <Note>
    Kimi Coding 使用与 Moonshot（`moonshot/...`）不同的 API 密钥和 Provider 前缀（`kimi/...`）。旧版模型引用 `kimi/k2p5` 作为兼容性 ID 仍被接受。
    </Note>

    <Steps>
      <Step title="运行入门">
        ```bash
        openclaw onboard --auth-choice kimi-code-api-key
        ```
      </Step>
      <Step title="设置默认模型">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "kimi/kimi-code" },
            },
          },
        }
        ```
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider kimi
        ```
      </Step>
    </Steps>

    ### 配置示例

    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-code" },
          models: {
            "kimi/kimi-code": { alias: "Kimi" },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## Kimi Web 搜索

OpenClaw 也将 **Kimi** 作为 `web_search` Provider，由 Moonshot Web 搜索支持。

<Steps>
  <Step title="运行交互式 Web 搜索设置">
    ```bash
    openclaw configure --section web
    ```

    在 Web 搜索部分选择 **Kimi** 以存储
    `plugins.entries.moonshot.config.webSearch.*`。

  </Step>
  <Step title="配置 Web 搜索区域和模型">
    交互式设置提示：

    | 设置                | 选项                                                                 |
    | ------------------- | -------------------------------------------------------------------- |
    | API 区域            | `https://api.moonshot.ai/v1`（国际）或 `https://api.moonshot.cn/v1`（中国） |
    | Web 搜索模型        | 默认为 `kimi-k2.6`                                                   |

  </Step>
</Steps>

配置位于 `plugins.entries.moonshot.config.webSearch` 下：

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // 或使用 KIMI_API_KEY / MOONSHOT_API_KEY
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

## 高级配置

<AccordionGroup>
  <Accordion title="原生思考模式">
    Moonshot Kimi 支持二元原生思考：

    - `thinking: { type: "enabled" }`
    - `thinking: { type: "disabled" }`

    通过 `agents.defaults.models.<provider/model>.params` 按模型配置：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "disabled" },
              },
            },
          },
        },
      },
    }
    ```

    OpenClaw 也为 Moonshot 映射运行时 `/think` 级别：

    | `/think` 级别        | Moonshot 行为              |
    | -------------------- | -------------------------- |
    | `/think off`         | `thinking.type=disabled`   |
    | 任何非 off 级别      | `thinking.type=enabled`    |

    <Warning>
    当 Moonshot 思考启用时，`tool_choice` 必须为 `auto` 或 `none`。OpenClaw 会将不兼容的 `tool_choice` 值归一化为 `auto` 以确保兼容性。
    </Warning>

    Kimi K2.6 还接受可选的 `thinking.keep` 字段，用于控制多轮保留 `reasoning_content`。将其设置为 `"all"` 可跨轮次保留完整推理；省略（或设置为 `null`）则使用服务器默认策略。OpenClaw 仅对 `moonshot/kimi-k2.6` 转发 `thinking.keep`，并从其他模型中去除该字段。

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "moonshot/kimi-k2.6": {
              params: {
                thinking: { type: "enabled", keep: "all" },
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="工具调用 ID 清理">
    Moonshot Kimi 提供形如 `functions.<name>:<index>` 的 tool_call id。OpenClaw 保持其不变，以确保多轮工具调用正常工作。

    若要在自定义 OpenAI 兼容 Provider 上强制严格清理，请设置 `sanitizeToolCallIds: true`：

    ```json5
    {
      models: {
        providers: {
          "my-kimi-proxy": {
            api: "openai-completions",
            sanitizeToolCallIds: true,
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="流式传输使用兼容性">
    原生 Moonshot 端点（`https://api.moonshot.ai/v1` 和
    `https://api.moonshot.cn/v1`）在共享的 `openai-completions` 传输上声明流式传输使用兼容性。OpenClaw 基于端点能力检测此特性，因此针对同一原生 Moonshot 主机的兼容自定义 Provider ID 也会继承相同的流式传输使用行为。

    凭借内置的 K2.6 定价，包含输入、输出和缓存读取令牌的流式使用量也会转换为本地估算 USD 成本，用于 `/status`、`/usage full`、`/usage cost` 和基于转录的 Session 计费。

  </Accordion>

  <Accordion title="端点和模型引用参考">
    | Provider   | 模型引用前缀 | 端点                          | Auth 环境变量       |
    | ---------- | ------------ | ----------------------------- | ------------------- |
    | Moonshot   | `moonshot/`  | `https://api.moonshot.ai/v1`  | `MOONSHOT_API_KEY`  |
    | Moonshot CN| `moonshot/`  | `https://api.moonshot.cn/v1`  | `MOONSHOT_API_KEY`  |
    | Kimi Coding| `kimi/`      | Kimi Coding 端点              | `KIMI_API_KEY`      |
    | Web 搜索   | 无           | 与 Moonshot API 区域相同      | `KIMI_API_KEY` 或 `MOONSHOT_API_KEY` |

    - Kimi Web 搜索使用 `KIMI_API_KEY` 或 `MOONSHOT_API_KEY`，默认为 `https://api.moonshot.ai/v1`，模型为 `kimi-k2.6`。
    - 如果需要，在 `models.providers` 中覆盖价格和上下文元数据。
    - 如果 Moonshot 为某个模型发布了不同的上下文限制，请相应调整 `contextWindow`。

  </Accordion>
</AccordionGroup>

## 相关

<CardGroup cols={2}>
  <Card title="模型选择" href="/concepts/model-providers" icon="layers">
    选择 Provider、模型引用和故障转移行为。
  </Card>
  <Card title="Web 搜索" href="/tools/web" icon="magnifying-glass">
    配置 Web 搜索 Provider，包括 Kimi。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    Provider、模型和插件的完整配置 Schema。
  </Card>
  <Card title="Moonshot Open Platform" href="https://platform.moonshot.ai" icon="globe">
    Moonshot API 密钥管理和文档。
  </Card>
</CardGroup>
