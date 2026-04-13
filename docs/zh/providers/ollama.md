---
mmh3_hash: "2f79954e66b35dbacdb133a432e76eb2"
title: "Ollama"
summary: "使用 Ollama 运行 OpenClaw（云端和本地模型）"
read_when:
  - 您想通过 Ollama 使用云端或本地模型运行 OpenClaw
  - 您需要 Ollama 设置和配置指导
---

# Ollama

Ollama 是一个本地 LLM 运行时，可以轻松在您的机器上运行开源模型。OpenClaw 与 Ollama 的原生 API（`/api/chat`）集成，支持流式传输和工具调用，并且当您通过 `OLLAMA_API_KEY`（或身份验证配置文件）选择加入且未定义显式 `models.providers.ollama` 条目时，可以自动发现本地 Ollama 模型。

<Warning>
**远程 Ollama 用户**：不要在 OpenClaw 中使用 `/v1` OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，模型可能会将原始工具 JSON 输出为纯文本。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（不带 `/v1`）。
</Warning>

## 快速开始

选择您偏好的设置方式和模式。

<Tabs>
  <Tab title="入门（推荐）">
    **适合：** 通过自动模型发现最快速地完成 Ollama 设置。

    <Steps>
      <Step title="运行入门">
        ```bash
        openclaw onboard
        ```

        从 Provider 列表中选择 **Ollama**。
      </Step>
      <Step title="选择模式">
        - **Cloud + Local** — 同时使用云端托管模型和本地模型
        - **Local** — 仅使用本地模型

        如果您选择 **Cloud + Local** 且未登录 ollama.com，入门将打开浏览器登录流程。
      </Step>
      <Step title="选择模型">
        入门会发现可用模型并建议默认值。如果所选模型本地不可用，会自动拉取。
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
    **适合：** 完全控制安装、模型拉取和配置。

    <Steps>
      <Step title="安装 Ollama">
        从 [ollama.com/download](https://ollama.com/download) 下载。
      </Step>
      <Step title="拉取本地模型">
        ```bash
        ollama pull gemma4
        # 或
        ollama pull gpt-oss:20b
        # 或
        ollama pull llama3.3
        ```
      </Step>
      <Step title="登录以使用云端模型（可选）">
        如果您也想使用云端模型：

        ```bash
        ollama signin
        ```
      </Step>
      <Step title="为 OpenClaw 启用 Ollama">
        为 API 密钥设置任意值（Ollama 不需要真实密钥）：

        ```bash
        # 设置环境变量
        export OLLAMA_API_KEY="ollama-local"

        # 或在配置文件中配置
        openclaw config set models.providers.ollama.apiKey "ollama-local"
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
    云端模型允许您将云端托管的模型与本地模型一起运行。例如 `kimi-k2.5:cloud`、`minimax-m2.7:cloud` 和 `glm-5.1:cloud`——这些**不需要**本地 `ollama pull`。

    在设置期间选择 **Cloud + Local** 模式。向导会检查您是否已登录，并在需要时打开浏览器登录流程。如果无法验证身份验证，向导将回退到本地模型默认值。

    您也可以直接在 [ollama.com/signin](https://ollama.com/signin) 登录。

    OpenClaw 目前建议的云端默认值：`kimi-k2.5:cloud`、`minimax-m2.7:cloud`、`glm-5.1:cloud`。

  </Tab>

  <Tab title="仅本地">
    在仅本地模式下，OpenClaw 从本地 Ollama 实例发现模型。无需云端登录。

    OpenClaw 目前建议 `gemma4` 作为本地默认值。

  </Tab>
</Tabs>

## 模型发现（隐式 Provider）

当您设置 `OLLAMA_API_KEY`（或身份验证配置文件）且**未**定义 `models.providers.ollama` 时，OpenClaw 从 `http://127.0.0.1:11434` 的本地 Ollama 实例发现模型。

| 行为             | 详情                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 目录查询         | 查询 `/api/tags`                                                                                                                                                    |
| 能力检测         | 使用尽力而为的 `/api/show` 查找来读取 `contextWindow` 并检测能力（包括视觉）                                                                                        |
| 视觉模型         | `/api/show` 报告 `vision` 能力的模型被标记为图像支持（`input: ["text", "image"]`），因此 OpenClaw 会自动将图像注入提示词                                             |
| 推理检测         | 使用模型名称启发式（`r1`、`reasoning`、`think`）标记 `reasoning`                                                                                                   |
| Token 限制       | 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大 Token 上限                                                                                                   |
| 成本             | 将所有成本设置为 `0`                                                                                                                                                |

这样可以避免手动模型条目，同时保持目录与本地 Ollama 实例对齐。

```bash
# 查看可用模型
ollama list
openclaw models list
```

要添加新模型，只需用 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型将被自动发现并可供使用。

<Note>
如果您显式设置 `models.providers.ollama`，则跳过自动发现，您必须手动定义模型。请参阅下方显式配置部分。
</Note>

## 配置

<Tabs>
  <Tab title="基本（隐式发现）">
    启用 Ollama 的最简单方式是通过环境变量：

    ```bash
    export OLLAMA_API_KEY="ollama-local"
    ```

    <Tip>
    如果设置了 `OLLAMA_API_KEY`，您可以在 Provider 条目中省略 `apiKey`，OpenClaw 将为可用性检查填充它。
    </Tip>

  </Tab>

  <Tab title="显式（手动模型）">
    在以下情况下使用显式配置：Ollama 在另一台主机/端口上运行、您想强制使用特定的上下文窗口或模型列表，或者您想要完全手动的模型定义。

    ```json5
    {
      models: {
        providers: {
          ollama: {
            baseUrl: "http://ollama-host:11434",
            apiKey: "ollama-local",
            api: "ollama",
            models: [
              {
                id: "gpt-oss:20b",
                name: "GPT-OSS 20B",
                reasoning: false,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 8192,
                maxTokens: 8192 * 10
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

## Ollama Web 搜索

OpenClaw 支持 **Ollama Web Search** 作为内置的 `web_search` Provider。

| 属性         | 详情                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------- |
| 主机         | 使用您配置的 Ollama 主机（设置时为 `models.providers.ollama.baseUrl`，否则为 `http://127.0.0.1:11434`）           |
| 身份验证     | 无需密钥                                                                                                          |
| 要求         | Ollama 必须运行并使用 `ollama signin` 登录                                                                        |

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
    对于自动发现的模型，OpenClaw 在可用时使用 Ollama 报告的上下文窗口，否则回退到 OpenClaw 使用的默认 Ollama 上下文窗口。

    您可以在显式 Provider 配置中覆盖 `contextWindow` 和 `maxTokens`：

    ```json5
    {
      models: {
        providers: {
          ollama: {
            models: [
              {
                id: "llama3.3",
                contextWindow: 131072,
                maxTokens: 65536,
              }
            ]
          }
        }
      }
    }
    ```

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
    内置 Ollama Plugin 为 [Memory 搜索](/concepts/memory) 注册了一个 Memory 嵌入 Provider。它使用配置的 Ollama Base URL 和 API 密钥。

    | 属性          | 值                  |
    | ------------- | ------------------- |
    | 默认模型      | `nomic-embed-text`  |
    | 自动拉取      | 是——如果本地不存在，嵌入模型会自动拉取 |

    要选择 Ollama 作为 Memory 搜索嵌入 Provider：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "ollama" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="流式传输配置">
    OpenClaw 的 Ollama 集成默认使用**原生 Ollama API**（`/api/chat`），完全支持同时流式传输和工具调用。不需要特殊配置。

    <Tip>
    如果您需要使用 OpenAI 兼容端点，请参阅上方"旧版 OpenAI 兼容模式"部分。在该模式下，流式传输和工具调用可能无法同时工作。
    </Tip>

  </Accordion>
</AccordionGroup>

## 故障排除

<AccordionGroup>
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
