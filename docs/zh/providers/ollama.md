---
mmh3_hash: "75021ea9d80b4ae471b278fa117c6929"
title: "Ollama"
summary: "使用 Ollama 运行 OpenClaw（云端和本地模型）"
read_when:
  - 您想通过 Ollama 使用云端或本地模型运行 OpenClaw
  - 您需要 Ollama 设置和配置指导
  - 您想使用 Ollama 视觉模型进行图像理解
---

OpenClaw 与 Ollama 的原生 API（`/api/chat`）集成，支持托管的云端模型和本地/自托管的 Ollama 服务器。您可以通过三种模式使用 Ollama：通过可访问的 Ollama 主机同时使用 `Cloud + Local`，通过 `https://ollama.com` 仅使用 `Cloud only`，或通过可访问的 Ollama 主机仅使用 `Local only`。

<Warning>
**远程 Ollama 用户**：不要在 OpenClaw 中使用 `/v1` OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，模型可能会将原始工具 JSON 输出为纯文本。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不带 `/v1`）。
</Warning>

Ollama Provider 配置使用 `baseUrl` 作为规范键。OpenClaw 也接受 `baseURL` 以兼容 OpenAI SDK 风格的示例，但新配置应优先使用 `baseUrl`。

## 身份验证规则

<AccordionGroup>
  <Accordion title="本地和局域网主机">
    本地和局域网 Ollama 主机不需要真实的 Bearer 令牌。OpenClaw 仅对回环地址、私有网络、`.local` 和裸主机名的 Ollama Base URL 使用本地 `ollama-local` 标记。
  </Accordion>
  <Accordion title="远程和 Ollama Cloud 主机">
    远程公共主机和 Ollama Cloud（`https://ollama.com`）需要通过 `OLLAMA_API_KEY`、身份验证配置文件或 Provider 的 `apiKey` 提供真实凭据。
  </Accordion>
  <Accordion title="自定义 Provider ID">
    设置 `api: "ollama"` 的自定义 Provider ID 遵循相同的规则。例如，指向私有局域网 Ollama 主机的 `ollama-remote` Provider 可以使用 `apiKey: "ollama-local"`，子 Agent 将通过 Ollama Provider 钩子解析该标记，而不会将其视为缺失的凭据。Memory 搜索也可以将 `agents.defaults.memorySearch.provider` 设置为该自定义 Provider ID，以便嵌入使用匹配的 Ollama 端点。
  </Accordion>
  <Accordion title="身份验证配置文件">
    `auth-profiles.json` 存储 Provider ID 的凭据。将端点设置（`baseUrl`、`api`、模型 ID、标头、超时）放在 `models.providers.<id>` 中。旧版扁平身份验证配置文件（如 `{ "ollama-windows": { "apiKey": "ollama-local" } }`）不是运行时格式；运行 `openclaw doctor --fix` 可将其重写为规范的 `ollama-windows:default` API 密钥配置文件并进行备份。该文件中的 `baseUrl` 是兼容性噪声，应移至 Provider 配置中。
  </Accordion>
  <Accordion title="Memory 嵌入范围">
    当 Ollama 用于 Memory 嵌入时，Bearer 身份验证的范围限定在声明它的主机：

    - Provider 级别的密钥仅发送到该 Provider 的 Ollama 主机。
    - `agents.*.memorySearch.remote.apiKey` 仅发送到其远程嵌入主机。
    - 纯 `OLLAMA_API_KEY` 环境值被视为 Ollama Cloud 惯例，默认不发送到本地或自托管主机。

  </Accordion>
</AccordionGroup>

## 快速开始

选择您偏好的设置方式和模式。

<Tabs>
  <Tab title="入门（推荐）">
    **适合：** 快速完成 Ollama 云端或本地设置的最快路径。

    <Steps>
      <Step title="运行入门">
        ```bash
        openclaw onboard
        ```

        从 Provider 列表中选择 **Ollama**。
      </Step>
      <Step title="选择模式">
        - **Cloud + Local** — 通过该主机路由的本地 Ollama 主机加云端模型
        - **Cloud only** — 通过 `https://ollama.com` 托管的 Ollama 模型
        - **Local only** — 仅本地模型
      </Step>
      <Step title="选择模型">
        `Cloud only` 会提示输入 `OLLAMA_API_KEY` 并建议托管的云端默认值。`Cloud + Local` 和 `Local only` 会询问 Ollama Base URL，发现可用模型，并在所选本地模型尚不可用时自动拉取。`Cloud + Local` 还会检查该 Ollama 主机是否已登录以获取云端访问权限。
      </Step>
      <Step title="验证模型是否可用">
        ```bash
        openclaw models list --provider ollama
        ```
      </Step>
    </Steps>

    ### 非交互式模式

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --accept-risk
    ```

    可以选择指定自定义 Base URL 或模型：

    ```bash
    openclaw onboard --non-interactive \
      --auth-choice ollama \
      --custom-base-url "http://ollama-host:11434" \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk
    ```

  </Tab>

  <Tab title="手动设置">
    **适合：** 完全控制云端或本地设置。

    <Steps>
      <Step title="选择云端或本地">
        - **Cloud + Local**：安装 Ollama，使用 `ollama signin` 登录，然后通过该主机路由云端请求
        - **Cloud only**：使用带 `OLLAMA_API_KEY` 的 `https://ollama.com`
        - **Local only**：从 [ollama.com/download](https://ollama.com/download) 安装 Ollama
      </Step>
      <Step title="拉取本地模型（仅本地）">
        ```bash
        ollama pull gemma4
        # 或
        ollama pull gpt-oss:20b
        # 或
        ollama pull llama3.3
        ```
      </Step>
      <Step title="为 OpenClaw 启用 Ollama">
        对于 `Cloud only`，请使用真实的 `OLLAMA_API_KEY`。对于主机支持的设置，任何占位符值均有效：

        ```bash
        # 云端
        export OLLAMA_API_KEY="your-ollama-api-key"

        # 仅本地
        export OLLAMA_API_KEY="ollama-local"

        # 或在配置文件中配置
        openclaw config set models.providers.ollama.apiKey "OLLAMA_API_KEY"
        ```
      </Step>
      <Step title="检查并设置模型">
        ```bash
        openclaw models list
        openclaw models set ollama/gemma4
        ```

        或在配置中设置默认值：

        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "ollama/gemma4" },
            },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## 云端模型

<Tabs>
  <Tab title="Cloud + Local">
    `Cloud + Local` 使用可访问的 Ollama 主机作为本地模型和云端模型的控制点。这是 Ollama 首选的混合流程。

    在设置期间选择 **Cloud + Local**。OpenClaw 会提示输入 Ollama Base URL，从该主机发现本地模型，并使用 `ollama signin` 检查主机是否已登录以获取云端访问权限。当主机已登录时，OpenClaw 还会建议托管的云端默认值，例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`。

    如果主机尚未登录，OpenClaw 将保持仅本地设置，直到您运行 `ollama signin`。

  </Tab>

  <Tab title="Cloud only">
    `Cloud only` 针对 `https://ollama.com` 上 Ollama 的托管 API 运行。

    在设置期间选择 **Cloud only**。OpenClaw 会提示输入 `OLLAMA_API_KEY`，设置 `baseUrl: "https://ollama.com"`，并填充托管云端模型列表。此路径**不需要**本地 Ollama 服务器或 `ollama signin`。

    设置期间 `openclaw onboard` 显示的云端模型列表从 `https://ollama.com/api/tags` 实时获取，上限 500 条，因此选择器反映当前托管目录而非静态种子。如果 `ollama.com` 在设置时不可访问或未返回模型，OpenClaw 会回退到之前的硬编码建议，以确保引导仍可完成。

  </Tab>

  <Tab title="Local only">
    在仅本地模式下，OpenClaw 从配置的 Ollama 实例发现模型。此路径适用于本地或自托管的 Ollama 服务器。

    OpenClaw 目前建议 `gemma4` 作为本地默认值。

  </Tab>
</Tabs>

## 模型发现（隐式 Provider）

当您设置 `OLLAMA_API_KEY`（或身份验证配置文件）且**未**定义 `models.providers.ollama` 或其他带 `api: "ollama"` 的自定义远程 Provider 时，OpenClaw 从 `http://127.0.0.1:11434` 的本地 Ollama 实例发现模型。

| 行为             | 详情                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询         | 查询 `/api/tags`                                                                                                                                                    |
| 能力检测         | 使用尽力而为的 `/api/show` 查找来读取 `contextWindow`、扩展的 `num_ctx` Modelfile 参数以及包括视觉/工具在内的能力                                                   |
| 视觉模型         | `/api/show` 报告 `vision` 能力的模型被标记为图像支持（`input: ["text", "image"]`），因此 OpenClaw 会自动将图像注入提示词                                             |
| 推理检测         | 使用模型名称启发式（`r1`、`reasoning`、`think`）标记 `reasoning`                                                                                                   |
| Token 限制       | 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大 Token 上限                                                                                                   |
| 成本             | 将所有成本设置为 `0`                                                                                                                                                |

这样可以避免手动模型条目，同时保持目录与本地 Ollama 实例对齐。您可以在本地 `infer model run` 中使用完整引用（如 `ollama/<pulled-model>:latest`）；OpenClaw 从 Ollama 的实时目录解析已安装的模型，无需手写 `models.json` 条目。

对于已登录的 Ollama 主机，某些 `:cloud` 模型可能在出现在 `/api/tags` 之前就可以通过 `/api/chat` 和 `/api/show` 使用。当您显式选择完整的 `ollama/<model>:cloud` 引用时，OpenClaw 会通过 `/api/show` 验证该缺失的模型，仅在 Ollama 确认模型元数据后才将其添加到运行时目录。拼写错误仍会以未知模型的形式失败，而不是自动创建。

```bash
# 查看可用模型
ollama list
openclaw models list
```

对于避免完整 Agent 工具接口的窄文本生成冒烟测试，请使用本地 `infer model run`：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/llama3.2:latest \
    --prompt "Reply with exactly: pong" \
    --json
```

对于视觉模型冒烟测试，添加图像文件：

```bash
OLLAMA_API_KEY=ollama-local \
  openclaw infer model run \
    --local \
    --model ollama/qwen2.5vl:7b \
    --prompt "Describe this image in one sentence." \
    --file ./photo.jpg \
    --json
```

要添加新模型，只需用 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型将被自动发现并可供使用。

<Note>
如果您显式设置 `models.providers.ollama`，或配置了带 `api: "ollama"` 的自定义远程 Provider（例如 `models.providers.ollama-cloud`），则跳过自动发现，您必须手动定义模型。回环自定义 Provider（例如 `http://127.0.0.2:11434`）仍被视为本地。请参阅下方显式配置部分。
</Note>

## 视觉和图像描述

内置 Ollama Plugin 将 Ollama 注册为具有图像能力的媒体理解 Provider。这使 OpenClaw 能够将显式图像描述请求和已配置的图像模型默认值路由到本地或托管的 Ollama 视觉模型。

对于本地视觉，拉取支持图像的模型：

```bash
ollama pull qwen2.5vl:7b
export OLLAMA_API_KEY="ollama-local"
```

然后使用推理 CLI 验证：

```bash
openclaw infer image describe \
  --file ./photo.jpg \
  --model ollama/qwen2.5vl:7b \
  --json
```

`--model` 必须是完整的 `<provider/model>` 引用。设置后，`openclaw infer image describe` 会直接运行该模型，而不会因模型支持原生视觉而跳过描述。

要将 Ollama 设置为入站媒体的默认图像理解模型，请配置 `agents.defaults.imageModel`：

```json5
{
  agents: {
    defaults: {
      imageModel: {
        primary: "ollama/qwen2.5vl:7b",
      },
    },
  },
}
```

缓慢的本地视觉模型可能需要比云端模型更长的图像理解超时。在受限硬件上，当 Ollama 尝试分配完整的视觉上下文时，它们也可能崩溃或停止。设置能力超时，并在模型条目上限制 `num_ctx`（当您只需要普通图像描述轮次时）：

```json5
{
  models: {
    providers: {
      ollama: {
        models: [
          {
            id: "qwen2.5vl:7b",
            name: "qwen2.5vl:7b",
            input: ["text", "image"],
            params: { num_ctx: 2048, keep_alive: "1m" },
          },
        ],
      },
    },
  },
  tools: {
    media: {
      image: {
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "qwen2.5vl:7b", timeoutSeconds: 300 }],
      },
    },
  },
}
```

此超时适用于入站图像理解和 Agent 在一轮中可以调用的显式 `image` 工具。Provider 级别的 `models.providers.ollama.timeoutSeconds` 仍然控制正常模型调用的底层 Ollama HTTP 请求守卫。

使用以下命令针对本地 Ollama 实时验证显式图像工具：

```bash
OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_OLLAMA_IMAGE=1 \
  pnpm test:live -- src/agents/tools/image-tool.ollama.live.test.ts
```

如果您手动定义 `models.providers.ollama.models`，请用图像输入支持标记视觉模型：

```json5
{
  id: "qwen2.5vl:7b",
  name: "qwen2.5vl:7b",
  input: ["text", "image"],
  contextWindow: 128000,
  maxTokens: 8192,
}
```

OpenClaw 会拒绝对未标记为图像支持的模型的图像描述请求。在隐式发现时，OpenClaw 会在 `/api/show` 报告视觉能力时从 Ollama 读取此信息。

## 配置

<Tabs>
  <Tab title="基本（隐式发现）">
    启用 Ollama 的最简单本地路径是通过环境变量：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果设置了 `OLLAMA_API_KEY`，您可以在 Provider 条目中省略 `apiKey`，OpenClaw 将为可用性检查填充它。
    </Tip>

  </Tab>

  <Tab title="显式（手动模型）">
    在以下情况下使用显式配置：需要托管云端设置、Ollama 在另一台主机/端口上运行、您想强制使用特定的上下文窗口或模型列表，或者您想要完全手动的模型定义。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 128000,
                maxTokens: 8192
              }
            ]
          }
        }
      }
    }
    ```

  </Tab>

  <Tab title="自定义 Base URL">
    如果 Ollama 在不同的主机或端口上运行（显式配置会禁用自动发现，因此请手动定义模型）：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            apiKey: "ollama-local",
            baseUrl: "http://ollama-host:11434", // 不带 /v1 - 使用原生 Ollama API URL
            api: "ollama", // 显式设置以保证原生工具调用行为
            timeoutSeconds: 300, // 可选：给冷启动的本地模型更长的连接和流式传输时间
            models: [
              {
                id: "qwen3:32b",
                name: "qwen3:32b",
                params: {
                  keep_alive: "15m", // 可选：在轮次之间保持模型加载状态
                },
              },
            ],
          },
        },
      },
    }
    ```

    <Warning>
    不要在 URL 中添加 `/v1`。`/v1` 路径使用 OpenAI 兼容模式，其中工具调用不可靠。使用不带路径后缀的 Ollama 基础 URL。
    </Warning>

  </Tab>
</Tabs>

## 常用示例

以下示例可作为起点，请将模型 ID 替换为 `ollama list` 或 `openclaw models list --provider ollama` 中的确切名称。

<AccordionGroup>
  <Accordion title="带自动发现的本地模型">
    当 Ollama 与 Gateway 运行在同一台机器上，且您希望 OpenClaw 自动发现已安装的模型时使用此方式。

    ```bash
    ollama serve
    ollama pull gemma4
    export OLLAMA_API_KEY="ollama-local"
    openclaw models list --provider ollama
    openclaw models set ollama/gemma4
    ```

    此路径使配置保持最简。除非您想手动定义模型，否则不要添加 `models.providers.ollama` 块。

  </Accordion>

  <Accordion title="带手动模型的局域网 Ollama 主机">
    对局域网主机使用原生 Ollama URL。不要添加 `/v1`。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                reasoning: true,
                input: ["text"],
                params: {
                  num_ctx: 32768,
                  thinking: false,
                  keep_alive: "15m",
                },
              },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: { primary: "ollama/qwen3.5:9b" },
        },
      },
    }
    ```

    `contextWindow` 是 OpenClaw 侧的上下文预算。`params.num_ctx` 发送给 Ollama 用于请求。当您的硬件无法运行模型完整的广告上下文时，请保持两者对齐。

  </Accordion>

  <Accordion title="仅 Ollama Cloud">
    当您不运行本地守护进程且想直接使用托管的 Ollama 模型时使用此方式。

    ```bash
    export OLLAMA_API_KEY="your-ollama-api-key"
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "https://ollama.com",
            apiKey: "OLLAMA_API_KEY",
            api: "ollama",
            models: [
              {
                id: "kimi-k2.5:cloud",
                name: "kimi-k2.5:cloud",
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
          model: { primary: "ollama/kimi-k2.5:cloud" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="通过已登录守护进程同时使用云端和本地">
    当本地或局域网 Ollama 守护进程已通过 `ollama signin` 登录，并应同时提供本地模型和 `:cloud` 模型时使用此方式。

    ```bash
    ollama signin
    ollama pull gemma4
    ```

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 300,
            models: [
              { id: "gemma4", name: "gemma4", input: ["text"] },
              { id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text", "image"] },
            ],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama/gemma4",
            fallbacks: ["ollama/kimi-k2.5:cloud"],
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="多个 Ollama 主机">
    当您有多个 Ollama 服务器时使用自定义 Provider ID。每个 Provider 有自己的主机、模型、身份验证、超时和模型引用。

    ```json5
    {
      models: {
        providers: {
          "ollama-fast": {
            baseUrl: "http://mini.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [{ id: "gemma4", name: "gemma4", input: ["text"] }],
          },
          "ollama-large": {
            baseUrl: "http://gpu-box.local:11434",
            apiKey: "ollama-local",
            api: "ollama",
            timeoutSeconds: 420,
            contextWindow: 131072,
            maxTokens: 16384,
            models: [{ id: "qwen3.5:27b", name: "qwen3.5:27b", input: ["text"] }],
          },
        },
      },
      agents: {
        defaults: {
          model: {
            primary: "ollama-fast/gemma4",
            fallbacks: ["ollama-large/qwen3.5:27b"],
          },
        },
      },
    }
    ```

    当 OpenClaw 发送请求时，活动的 Provider 前缀会被剥离，因此 `ollama-large/qwen3.5:27b` 到达 Ollama 时为 `qwen3.5:27b`。

  </Accordion>

  <Accordion title="精简本地模型配置">
    某些本地模型可以回答简单提示，但难以处理完整的 Agent 工具接口。在更改全局运行时设置之前，先通过限制工具和上下文来开始。

    ```json5
    {
      agents: {
        defaults: {
          experimental: {
            localModelLean: true,
          },
          model: { primary: "ollama/gemma4" },
        },
      },
      models: {
        providers: {
          ollama: {
            baseUrl: "http://127.0.0.1:11434",
            apiKey: "ollama-local",
            api: "ollama",
            contextWindow: 32768,
            models: [
              {
                id: "gemma4",
                name: "gemma4",
                input: ["text"],
                params: { num_ctx: 32768 },
                compat: { supportsTools: false },
              },
            ],
          },
        },
      },
    }
    ```

    仅当模型或服务器在工具 Schema 上持续失败时才使用 `compat.supportsTools: false`。它以 Agent 能力换取稳定性。
    `localModelLean` 从 Agent 接口中移除浏览器、Cron 和消息工具，但不改变 Ollama 的运行时上下文或思维模式。对于会循环或将响应预算消耗在隐藏推理上的小型 Qwen 风格思维模型，请搭配显式 `params.num_ctx` 和 `params.thinking: false` 使用。

  </Accordion>
</AccordionGroup>

### 模型选择

配置后，所有 Ollama 模型均可用：

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/gpt-oss:20b",
        fallbacks: ["ollama/llama3.3", "ollama/qwen2.5-coder:32b"],
      },
    },
  },
}
```

也支持自定义 Ollama Provider ID。当模型引用使用活动 Provider 前缀（例如 `ollama-spark/qwen3:32b`）时，OpenClaw 仅剥离该前缀，然后调用 Ollama，服务器收到的是 `qwen3:32b`。

对于缓慢的本地模型，在提高整个 Agent 运行时超时之前，优先使用 Provider 范围的请求调优：

```json5
{
  models: {
    providers: {
      ollama: {
        timeoutSeconds: 300,
        models: [
          {
            id: "gemma4:26b",
            name: "gemma4:26b",
            params: { keep_alive: "15m" },
          },
        ],
      },
    },
  },
}
```

`timeoutSeconds` 适用于模型 HTTP 请求，包括连接建立、标头、正文流式传输和总守卫获取中止。`params.keep_alive` 作为顶层 `keep_alive` 转发给原生 `/api/chat` 请求中的 Ollama；当第一轮加载时间是瓶颈时，按模型设置它。

### 快速验证

```bash
# 此机器可见的 Ollama 守护进程
curl http://127.0.0.1:11434/api/tags

# OpenClaw 目录和所选模型
openclaw models list --provider ollama
openclaw models status

# 直接模型冒烟测试
openclaw infer model run \
  --model ollama/gemma4 \
  --prompt "Reply with exactly: ok"
```

对于远程主机，将 `127.0.0.1` 替换为 `baseUrl` 中使用的主机。如果 `curl` 有效但 OpenClaw 无效，请检查 Gateway 是否在不同的机器、容器或服务账户上运行。

## Ollama Web 搜索

OpenClaw 支持 **Ollama Web Search** 作为内置的 `web_search` Provider。

| 属性         | 详情                                                                                                                                                                  |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 主机         | 使用您配置的 Ollama 主机（设置时为 `models.providers.ollama.baseUrl`，否则为 `http://127.0.0.1:11434`）；`https://ollama.com` 直接使用托管 API                         |
| 身份验证     | 已登录本地 Ollama 主机无需密钥；直接 `https://ollama.com` 搜索或受身份验证保护的主机需要 `OLLAMA_API_KEY` 或配置的 Provider 身份验证                                   |
| 要求         | 本地/自托管主机必须运行并使用 `ollama signin` 登录；直接托管搜索需要 `baseUrl: "https://ollama.com"` 加上真实的 Ollama API 密钥                                         |

在 `openclaw onboard` 或 `openclaw configure --section web` 期间选择 **Ollama Web Search**，或设置：

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

对于通过 Ollama Cloud 直接进行托管搜索：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
        api: "ollama",
        models: [{ id: "kimi-k2.5:cloud", name: "kimi-k2.5:cloud", input: ["text"] }],
      },
    },
  },
  tools: {
    web: {
      search: { provider: "ollama" },
    },
  },
}
```

对于已登录的本地守护进程，OpenClaw 使用守护进程的 `/api/experimental/web_search` 代理。对于 `https://ollama.com`，它直接调用托管的 `/api/web_search` 端点。

<Note>
有关完整的设置和行为详情，请参见 [Ollama Web Search](/tools/ollama-search)。
</Note>

## 高级配置

<AccordionGroup>
  <Accordion title="旧版 OpenAI 兼容模式">
    <Warning>
    **工具调用在 OpenAI 兼容模式下不可靠。** 仅在需要代理的 OpenAI 格式且不依赖原生工具调用行为时使用此模式。
    </Warning>

    如果您需要使用 OpenAI 兼容端点（例如，在仅支持 OpenAI 格式的代理后面），请显式设置 `api: "openai-completions"`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: true, // 默认：true
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

    此模式可能不支持同时流式传输和工具调用。您可能需要在模型配置中使用 `params: { streaming: false }` 禁用流式传输。

    当 `api: "openai-completions"` 与 Ollama 一起使用时，OpenClaw 默认注入 `options.num_ctx`，以防 Ollama 静默回退到 4096 上下文窗口。如果您的代理/上游拒绝未知的 `options` 字段，请禁用此行为：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434/v1",
            api: "openai-completions",
            injectNumCtxForOpenAICompat: false,
            apiKey: "ollama-local",
            models: [...]
          }
        }
      }
    }
    ```

  </Accordion>

  <Accordion title="上下文窗口">
    对于自动发现的模型，OpenClaw 在可用时使用 Ollama 报告的上下文窗口（包括自定义 Modelfile 中较大的 `PARAMETER num_ctx` 值），否则回退到 OpenClaw 使用的默认 Ollama 上下文窗口。

    您可以为该 Ollama Provider 下的每个模型设置 Provider 级别的 `contextWindow`、`contextTokens` 和 `maxTokens` 默认值，然后根据需要按模型覆盖它们。`contextWindow` 是 OpenClaw 的提示和压缩预算。原生 Ollama 请求不设置 `options.num_ctx`，除非您显式配置 `params.num_ctx`，这样 Ollama 可以应用其自己的模型、`OLLAMA_CONTEXT_LENGTH` 或基于 VRAM 的默认值。要在不重建 Modelfile 的情况下限制或强制 Ollama 的每请求运行时上下文，请设置 `params.num_ctx`；无效、零、负数和非有限值将被忽略。OpenAI 兼容的 Ollama 适配器仍然默认从配置的 `params.num_ctx` 或 `contextWindow` 注入 `options.num_ctx`；如果您的上游拒绝 `options`，请用 `injectNumCtxForOpenAICompat: false` 禁用。

    原生 Ollama 模型条目也接受 `params` 下的常见 Ollama 运行时选项，包括 `temperature`、`top_p`、`top_k`、`min_p`、`num_predict`、`stop`、`repeat_penalty`、`num_batch`、`num_thread` 和 `use_mmap`。OpenClaw 仅转发 Ollama 请求键，因此 `streaming` 等 OpenClaw 运行时参数不会泄露给 Ollama。使用 `params.think` 或 `params.thinking` 发送顶层 Ollama `think`；`false` 禁用 Qwen 风格思维模型的 API 级思维。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
                params: {
                  num_ctx: 32768,
                  temperature: 0.7,
                  top_p: 0.9,
                  thinking: false,
                },
              }
            ]
          }
        }
      }
    }
    ```

    每模型的 `agents.defaults.models["ollama/<model>"].params.num_ctx` 也有效。如果两者都配置，显式 Provider 模型条目优先于 Agent 默认值。

  </Accordion>

  <Accordion title="思维控制">
    对于原生 Ollama 模型，OpenClaw 按照 Ollama 期望的方式转发思维控制：顶层 `think`，而非 `options.think`。自动发现的模型（其 `/api/show` 响应包含 `thinking` 能力）会公开 `/think low`、`/think medium`、`/think high` 和 `/think max`；非思维模型仅公开 `/think off`。

    ```bash
    openclaw agent --model ollama/gemma4 --thinking off
    openclaw agent --model ollama/gemma4 --thinking low
    ```

    您也可以设置模型默认值：

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "ollama/gemma4": {
              thinking: "low",
            },
          },
        },
      },
    }
    ```

    每模型的 `params.think` 或 `params.thinking` 可以禁用或强制特定已配置模型的 Ollama API 思维。OpenClaw 在活动运行仅有隐式默认 `off` 时保留这些显式模型参数；非 off 的运行时命令（如 `/think medium`）仍会覆盖活动运行。

  </Accordion>

  <Accordion title="推理模型">
    OpenClaw 默认将名称中包含 `deepseek-r1`、`reasoning` 或 `think` 的模型视为推理能力模型。

    ```bash
    ollama pull deepseek-r1:32b
    ```

    无需额外配置——OpenClaw 会自动标记它们。

  </Accordion>

  <Accordion title="模型成本">
    Ollama 是免费的，在本地运行，因此所有模型成本均设置为 $0。这适用于自动发现和手动定义的模型。
  </Accordion>

  <Accordion title="Memory 嵌入">
    内置 Ollama Plugin 为
    [Memory 搜索](/concepts/memory) 注册了一个 Memory 嵌入 Provider。它使用配置的 Ollama Base URL
    和 API 密钥，调用 Ollama 当前的 `/api/embed` 端点，并在可能时将多个 Memory 块批量放入一个 `input` 请求。

    | 属性          | 值                  |
    | ------------- | ------------------- |
    | 默认模型      | `nomic-embed-text`  |
    | 自动拉取      | 是——如果本地不存在，嵌入模型会自动拉取 |

    查询时嵌入对需要或推荐检索前缀的模型使用该前缀，包括 `nomic-embed-text`、`qwen3-embedding` 和 `mxbai-embed-large`。Memory 文档批次保持原始格式，因此现有索引无需格式迁移。

    要选择 Ollama 作为 Memory 搜索嵌入 Provider：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            remote: {
              // Ollama 默认值。在较大主机上如果重新索引太慢可适当提高。
              nonBatchConcurrency: 1,
            },
          },
        },
      },
    }
    ```

    对于远程嵌入主机，将身份验证范围限定在该主机：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "ollama",
            model: "nomic-embed-text",
            remote: {
              baseUrl: "http://gpu-box.local:11434",
              apiKey: "ollama-local",
              nonBatchConcurrency: 2,
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="流式传输配置">
    OpenClaw 的 Ollama 集成默认使用**原生 Ollama API**（`/api/chat`），完全支持同时流式传输和工具调用。不需要特殊配置。

    对于原生 `/api/chat` 请求，OpenClaw 也直接向 Ollama 转发思维控制：`/think off` 和 `openclaw agent --thinking off` 发送顶层 `think: false`，而 `/think low|medium|high` 发送匹配的顶层 `think` 努力字符串。`/think max` 映射到 Ollama 的最高原生努力 `think: "high"`。

    <Tip>
    如果您需要使用 OpenAI 兼容端点，请参阅上方"旧版 OpenAI 兼容模式"部分。在该模式下，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
  <Accordion title="WSL2 崩溃循环（反复重启）">
    在 WSL2 与 NVIDIA/CUDA 上，官方 Ollama Linux 安装程序创建了带 `Restart=always` 的 `ollama.service` systemd 单元。如果该服务在 WSL2 启动时自动启动并加载 GPU 支持的模型，Ollama 可能会在模型加载时固定主机内存。Hyper-V 内存回收无法始终回收这些固定页面，因此 Windows 可能会终止 WSL2 VM，systemd 再次启动 Ollama，循环往复。

    常见证据：

    - WSL2 从 Windows 侧反复重启或终止
    - WSL2 启动后 `app.slice` 或 `ollama.service` 中 CPU 占用高
    - 来自 systemd 的 SIGTERM，而非 Linux OOM-killer 事件

    当 OpenClaw 检测到 WSL2、已启用 `Restart=always` 的 `ollama.service` 以及可见的 CUDA 标记时，会记录启动警告。

    缓解方法：

    ```bash
    sudo systemctl disable ollama
    ```

    在 Windows 侧的 `%USERPROFILE%\.wslconfig` 中添加以下内容，然后运行 `wsl --shutdown`：

    ```ini
    [experimental]
    autoMemoryReclaim=disabled
    ```

    在 Ollama 服务环境中设置更短的 keep-alive，或仅在需要时手动启动 Ollama：

    ```bash
    export OLLAMA_KEEP_ALIVE=5m
    ollama serve
    ```

    参见 [ollama/ollama#11317](https://github.com/ollama/ollama/issues/11317)。

  </Accordion>

  <Accordion title="未检测到 Ollama">
    确保 Ollama 正在运行，并且您设置了 `OLLAMA_API_KEY`（或身份验证配置文件），且**未**定义显式 `models.providers.ollama` 条目：

    ```bash
    ollama serve
    ```

    验证 API 是否可访问：

    ```bash
    curl http://localhost:11434/api/tags
    ```

  </Accordion>

  <Accordion title="没有可用模型">
    如果您的模型未列出，请在本地拉取模型或在 `models.providers.ollama` 中显式定义它。

    ```bash
    ollama list  # 查看已安装的模型
    ollama pull gemma4
    ollama pull gpt-oss:20b
    ollama pull llama3.3     # 或其他模型
    ```

  </Accordion>

  <Accordion title="连接被拒绝">
    检查 Ollama 是否在正确的端口上运行：

    ```bash
    # 检查 Ollama 是否正在运行
    ps aux | grep ollama

    # 或重启 Ollama
    ollama serve
    ```

  </Accordion>

  <Accordion title="远程主机使用 curl 可以但 OpenClaw 不行">
    从运行 Gateway 的同一台机器和运行时进行验证：

    ```bash
    openclaw gateway status --deep
    curl http://ollama-host:11434/api/tags
    ```

    常见原因：

    - `baseUrl` 指向 `localhost`，但 Gateway 在 Docker 或另一台主机上运行。
    - URL 使用 `/v1`，选择了 OpenAI 兼容行为而非原生 Ollama。
    - 远程主机需要在 Ollama 侧更改防火墙或局域网绑定。
    - 模型存在于您笔记本电脑的守护进程上，但不在远程守护进程上。

  </Accordion>

  <Accordion title="模型将工具 JSON 输出为文本">
    这通常意味着 Provider 使用 OpenAI 兼容模式，或模型无法处理工具 Schema。

    优先使用原生 Ollama 模式：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            api: "ollama",
          },
        },
      },
    }
    ```

    如果小型本地模型仍然在工具 Schema 上失败，请在该模型条目上设置 `compat.supportsTools: false` 并重新测试。

  </Accordion>

  <Accordion title="Kimi 或 GLM 返回乱码符号">
    托管的 Kimi/GLM 响应中如果出现长串非语言符号，会被视为 Provider 输出失败，而非成功的助手回答。这样可以让正常的重试、故障转移或错误处理接管，而不会将损坏的文本持久化到 Session 中。

    如果反复发生，请记录原始模型名称、当前 Session 文件以及运行是否使用了 `Cloud + Local` 或 `Cloud only`，然后尝试新 Session 和备用模型：

    ```bash
    openclaw infer model run --model ollama/kimi-k2.5:cloud --prompt "Reply with exactly: ok" --json
    openclaw models set ollama/gemma4
    ```

  </Accordion>

  <Accordion title="冷启动本地模型超时">
    大型本地模型在流式传输开始前可能需要较长的首次加载时间。将超时范围限定在 Ollama Provider，并可选择要求 Ollama 在轮次之间保持模型加载：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            timeoutSeconds: 300,
            models: [
              {
                id: "gemma4:26b",
                name: "gemma4:26b",
                params: { keep_alive: "15m" },
              },
            ],
          },
        },
      },
    }
    ```

    如果主机本身接受连接速度较慢，`timeoutSeconds` 也会为此 Provider 延长守卫的 Undici 连接超时。

  </Accordion>

  <Accordion title="大上下文模型太慢或内存不足">
    许多 Ollama 模型宣传的上下文比您的硬件能舒适运行的要大。原生 Ollama 使用 Ollama 自己的运行时上下文默认值，除非您设置 `params.num_ctx`。当您想要可预测的首 Token 延迟时，同时限制 OpenClaw 的预算和 Ollama 的请求上下文：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            contextWindow: 32768,
            maxTokens: 8192,
            models: [
              {
                id: "qwen3.5:9b",
                name: "qwen3.5:9b",
                params: { num_ctx: 32768, thinking: false },
              },
            ],
          },
        },
      },
    }
    ```

    如果 OpenClaw 发送的提示太多，先降低 `contextWindow`。如果 Ollama 加载的运行时上下文对机器来说太大，降低 `params.num_ctx`。如果生成运行时间太长，降低 `maxTokens`。

  </Accordion>
</AccordionGroup>

<Note>
更多帮助：[故障排除](/help/troubleshooting)和 [FAQ](/help/faq)。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="模型 Provider" href="/concepts/model-providers" icon="layers">
    所有 Provider、模型引用和故障转移行为概述。
  </Card>
  <Card title="模型选择" href="/concepts/models" icon="brain">
    如何选择和配置模型。
  </Card>
  <Card title="Ollama Web Search" href="/tools/ollama-search" icon="magnifying-glass">
    Ollama 驱动的 Web 搜索完整设置和行为详情。
  </Card>
  <Card title="配置" href="/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
