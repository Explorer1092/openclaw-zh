---
title: "Ollama"
mmh3_hash: "1a63c3e4b6b67f6e2e1634fbd6a18030"
summary: "使用 Ollama 运行 OpenClaw（云端 + 本地模型）"
read_when:
  - 您想通过 Ollama 使用云端或本地模型运行 OpenClaw
  - 您需要 Ollama 设置和配置指导
---

# Ollama

Ollama 是一个本地 LLM 运行时，可以轻松在您的机器上运行开源模型。OpenClaw 与 Ollama 的原生 API（`/api/chat`）集成，支持流式传输和工具调用，并且当您使用 `OLLAMA_API_KEY`（或身份验证配置文件）选择加入且不定义显式的 `models.providers.ollama` 条目时，可以自动发现本地 Ollama 模型。

<Warning>
**远程 Ollama 用户**：请勿在 OpenClaw 中使用 `/v1` OpenAI 兼容 URL（`http://host:11434/v1`）。这会破坏工具调用，模型可能将原始工具 JSON 作为纯文本输出。请改用原生 Ollama API URL：`baseUrl: "http://host:11434"`（无 `/v1`）。
</Warning>

## 快速开始

### 引导向导（推荐）

设置 Ollama 的最快方法是通过设置向导：

```bash
openclaw onboard
```

在提供商列表中选择 **Ollama**。向导将：

1. 询问 Ollama 实例可访问的基础 URL（默认为 `http://127.0.0.1:11434`）。
2. 让您选择 **Cloud + Local**（云端模型和本地模型）或 **Local**（仅本地模型）。
3. 如果您选择 **Cloud + Local** 且未登录 ollama.com，将打开浏览器登录流程。
4. 发现可用模型并建议默认值。
5. 如果所选模型在本地不可用，自动拉取该模型。

也支持非交互式模式：

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --accept-risk
```

可选指定自定义基础 URL 或模型：

```bash
openclaw onboard --non-interactive \
  --auth-choice ollama \
  --custom-base-url "http://ollama-host:11434" \
  --custom-model-id "qwen3.5:27b" \
  --accept-risk
```

### 手动设置

1. 安装 Ollama：[https://ollama.com/download](https://ollama.com/download)

2. 如果您想使用本地推理，拉取一个本地模型：

```bash
ollama pull glm-4.7-flash
# 或
ollama pull gpt-oss:20b
# 或
ollama pull llama3.3
```

3. 如果您还想使用云端模型，请登录：

```bash
ollama signin
```

4. 运行引导并选择 `Ollama`：

```bash
openclaw onboard
```

- `Local`：仅限本地模型
- `Cloud + Local`：本地模型加云端模型
- 云端模型（如 `kimi-k2.5:cloud`、`minimax-m2.5:cloud`、`glm-5:cloud`）**无需**本地 `ollama pull`

OpenClaw 当前建议：

- 本地默认：`glm-4.7-flash`
- 云端默认：`kimi-k2.5:cloud`、`minimax-m2.5:cloud`、`glm-5:cloud`

5. 如果您希望手动设置，直接为 OpenClaw 启用 Ollama（任何值都有效；Ollama 不需要真正的密钥）：

```bash
# 设置环境变量
export OLLAMA_API_KEY="ollama-local"

# 或在配置文件中配置
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

6. 检查或切换模型：

```bash
openclaw models list
openclaw models set ollama/glm-4.7-flash
```

7. 或在配置中设置默认值：

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/glm-4.7-flash" },
    },
  },
}
```

## 模型发现（隐式提供商）

当您设置 `OLLAMA_API_KEY`（或身份验证配置文件）并且**不**定义 `models.providers.ollama` 时，OpenClaw 从本地 Ollama 实例 `http://127.0.0.1:11434` 发现模型：

- 查询 `/api/tags`
- 使用尽力而为的 `/api/show` 查找来读取 `contextWindow`（如果可用）
- 使用模型名称启发式（`r1`、`reasoning`、`think`）标记 `reasoning`
- 将 `maxTokens` 设置为 OpenClaw 使用的默认 Ollama 最大 token 上限
- 将所有成本设置为 `0`

这避免了手动模型条目，同时使目录与本地 Ollama 实例保持一致。

要查看哪些模型可用：

```bash
ollama list
openclaw models list
```

要添加新模型，只需使用 Ollama 拉取它：

```bash
ollama pull mistral
```

新模型将自动被发现并可用。

如果您明确设置 `models.providers.ollama`，则跳过自动发现，您必须手动定义模型（见下文）。

## 配置

### 基本设置（隐式发现）

启用 Ollama 的最简单方法是通过环境变量：

```bash
export OLLAMA_API_KEY="ollama-local"
```

### 显式设置（手动模型）

在以下情况下使用显式配置：

- Ollama 在另一个主机/端口上运行。
- 您想强制使用特定的上下文窗口或模型列表。
- 您想要完全手动的模型定义。

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

如果设置了 `OLLAMA_API_KEY`，您可以在提供商条目中省略 `apiKey`，OpenClaw 将为可用性检查填充它。

### 自定义基础 URL（显式配置）

如果 Ollama 在不同的主机或端口上运行（显式配置禁用自动发现，因此请手动定义模型）：

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434", // 无 /v1 - 使用原生 Ollama API URL
        api: "ollama", // 显式设置以保证原生工具调用行为
      },
    },
  },
}
```

<Warning>
请勿在 URL 中添加 `/v1`。`/v1` 路径使用 OpenAI 兼容模式，其中工具调用不可靠。请使用不带路径后缀的基础 Ollama URL。
</Warning>

### 模型选择

配置后，您的所有 Ollama 模型都可用：

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

## 云端模型

云端模型让您可以运行云托管模型（例如 `kimi-k2.5:cloud`、`minimax-m2.5:cloud`、`glm-5:cloud`）以及本地模型。

要使用云端模型，在设置期间选择 **Cloud + Local** 模式。向导会检查您是否已登录，并在需要时打开浏览器登录流程。如果无法验证身份验证，向导将回退到本地模型默认值。

您也可以直接在 [ollama.com/signin](https://ollama.com/signin) 登录。

## 高级

### 推理模型

OpenClaw 默认将名称包含 `deepseek-r1`、`reasoning` 或 `think` 的模型视为具有推理能力：

```bash
ollama pull deepseek-r1:32b
```

### 模型成本

Ollama 是免费的并在本地运行，因此所有模型成本都设置为 $0。

### 流式配置

OpenClaw 的 Ollama 集成默认使用**原生 Ollama API**（`/api/chat`），它完全支持同时进行流式传输和工具调用。无需特殊配置。

#### 旧版 OpenAI 兼容模式

<Warning>
**工具调用在 OpenAI 兼容模式下不可靠。** 仅当您需要代理的 OpenAI 格式且不依赖原生工具调用行为时，才使用此模式。
</Warning>

如果您需要使用 OpenAI 兼容端点（例如，在仅支持 OpenAI 格式的代理后面），请显式设置 `api: "openai-completions"`：

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434/v1",
        api: "openai-completions",
        injectNumCtxForOpenAICompat: true, // 默认: true
        apiKey: "ollama-local",
        models: [...]
      }
    }
  }
}
```

此模式可能不支持同时进行流式传输 + 工具调用。您可能需要在模型配置中使用 `params: { streaming: false }` 禁用流式传输。

当 `api: "openai-completions"` 与 Ollama 一起使用时，OpenClaw 默认注入 `options.num_ctx`，以防止 Ollama 静默回退到 4096 上下文窗口。如果您的代理/上游拒绝未知的 `options` 字段，请禁用此行为：

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

### 上下文窗口

对于自动发现的模型，OpenClaw 使用 Ollama 报告的上下文窗口（如果可用），否则回退到 OpenClaw 使用的默认 Ollama 上下文窗口。您可以在显式提供商配置中覆盖 `contextWindow` 和 `maxTokens`。

## 故障排除

### Ollama 未检测到

确保 Ollama 正在运行，并且您设置了 `OLLAMA_API_KEY`（或身份验证配置文件），并且您**没有**定义显式的 `models.providers.ollama` 条目：

```bash
ollama serve
```

并且 API 可访问：

```bash
curl http://localhost:11434/api/tags
```

### 没有可用的模型

如果您的模型未列出，请：

- 在本地拉取该模型，或
- 在 `models.providers.ollama` 中显式定义模型。

要添加模型：

```bash
ollama list  # 查看已安装的内容
ollama pull glm-4.7-flash
ollama pull gpt-oss:20b
ollama pull llama3.3     # 或其他模型
```

### 连接被拒绝

检查 Ollama 是否在正确的端口上运行：

```bash
# 检查 Ollama 是否正在运行
ps aux | grep ollama

# 或重新启动 Ollama
ollama serve
```

## 另见

- [模型提供商](/concepts/model-providers) - 所有提供商的概述
- [模型选择](/concepts/models) - 如何选择模型
- [配置](/gateway/configuration) - 完整的配置参考
