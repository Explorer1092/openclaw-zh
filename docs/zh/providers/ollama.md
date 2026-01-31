---
mmh3_hash: "cf38094ad22d1a4e0293d762cf8a11be"
summary: "使用 Ollama 运行 OpenClaw (本地 LLM 运行时)"
read_when:
  - 您想通过 Ollama 使用本地模型运行 OpenClaw
  - 您需要 Ollama 设置和配置指导
---
# Ollama

Ollama 是一个本地 LLM 运行时,可以轻松在您的机器上运行开源模型。OpenClaw 与 Ollama 的 OpenAI 兼容 API 集成,并且当您使用 `OLLAMA_API_KEY`(或身份验证配置文件)选择加入并且不定义显式的 `models.providers.ollama` 条目时,可以**自动发现支持工具的模型**。

## 快速开始

1) 安装 Ollama: https://ollama.ai

2) 拉取一个模型:

```bash
ollama pull llama3.3
# 或
ollama pull qwen2.5-coder:32b
# 或
ollama pull deepseek-r1:32b
```

3) 为 OpenClaw 启用 Ollama(任何值都有效;Ollama 不需要真正的密钥):

```bash
# 设置环境变量
export OLLAMA_API_KEY="ollama-local"

# 或在配置文件中配置
openclaw config set models.providers.ollama.apiKey "ollama-local"
```

4) 使用 Ollama 模型:

```json5
{
  agents: {
    defaults: {
      model: { primary: "ollama/llama3.3" }
    }
  }
}
```

## 模型发现(隐式提供商)

当您设置 `OLLAMA_API_KEY`(或身份验证配置文件)并且**不**定义 `models.providers.ollama` 时,OpenClaw 从本地 Ollama 实例 `http://127.0.0.1:11434` 发现模型:

- 查询 `/api/tags` 和 `/api/show`
- 仅保留报告 `tools` 功能的模型
- 当模型报告 `thinking` 时标记 `reasoning`
- 从 `model_info["<arch>.context_length"]` 读取 `contextWindow`(如果可用)
- 将 `maxTokens` 设置为上下文窗口的 10 倍
- 将所有成本设置为 `0`

这避免了手动模型条目,同时使目录与 Ollama 的功能保持一致。

要查看哪些模型可用:

```bash
ollama list
openclaw models list
```

要添加新模型,只需使用 Ollama 拉取它:

```bash
ollama pull mistral
```

新模型将自动被发现并可用。

如果您明确设置 `models.providers.ollama`,则跳过自动发现,您必须手动定义模型(见下文)。

## 配置

### 基本设置(隐式发现)

启用 Ollama 的最简单方法是通过环境变量:

```bash
export OLLAMA_API_KEY="ollama-local"
```

### 显式设置(手动模型)

在以下情况下使用显式配置:
- Ollama 在另一个主机/端口上运行。
- 您想强制使用特定的上下文窗口或模型列表。
- 您想包含不报告工具支持的模型。

```json5
{
  models: {
    providers: {
      ollama: {
        // 使用包含 /v1 的主机用于 OpenAI 兼容的 API
        baseUrl: "http://ollama-host:11434/v1",
        apiKey: "ollama-local",
        api: "openai-completions",
        models: [
          {
            id: "llama3.3",
            name: "Llama 3.3",
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

如果设置了 `OLLAMA_API_KEY`,您可以在提供商条目中省略 `apiKey`,OpenClaw 将为可用性检查填充它。

### 自定义基础 URL(显式配置)

如果 Ollama 在不同的主机或端口上运行(显式配置禁用自动发现,因此请手动定义模型):

```json5
{
  models: {
    providers: {
      ollama: {
        apiKey: "ollama-local",
        baseUrl: "http://ollama-host:11434/v1"
      }
    }
  }
}
```

### 模型选择

配置后,您的所有 Ollama 模型都可用:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "ollama/llama3.3",
        fallback: ["ollama/qwen2.5-coder:32b"]
      }
    }
  }
}
```

## 高级

### 推理模型

当 Ollama 在 `/api/show` 中报告 `thinking` 时,OpenClaw 将模型标记为具有推理能力:

```bash
ollama pull deepseek-r1:32b
```

### 模型成本

Ollama 是免费的并在本地运行,因此所有模型成本都设置为 $0。

### 上下文窗口

对于自动发现的模型,OpenClaw 使用 Ollama 报告的上下文窗口(如果可用),否则默认为 `8192`。您可以在显式提供商配置中覆盖 `contextWindow` 和 `maxTokens`。

## 故障排除

### Ollama 未检测到

确保 Ollama 正在运行,并且您设置了 `OLLAMA_API_KEY`(或身份验证配置文件),并且您**没有**定义显式的 `models.providers.ollama` 条目:

```bash
ollama serve
```

并且 API 可访问:

```bash
curl http://localhost:11434/api/tags
```

### 没有可用的模型

OpenClaw 仅自动发现报告工具支持的模型。如果您的模型未列出,请:
- 拉取支持工具的模型,或
- 在 `models.providers.ollama` 中显式定义模型。

要添加模型:

```bash
ollama list  # 查看已安装的内容
ollama pull llama3.3  # 拉取模型
```

### 连接被拒绝

检查 Ollama 是否在正确的端口上运行:

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
<\!-- source-hash: cba9d55b28273e8af2f2a022ae2dd9c4 -->
