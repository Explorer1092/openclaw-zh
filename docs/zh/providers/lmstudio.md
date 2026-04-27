---
mmh3_hash: "e6f92f993200ad0e4c4366b62808f053"
summary: "在 LM Studio 中运行 OpenClaw"
read_when:
  - 您想通过 LM Studio 使用开源模型运行 OpenClaw
  - 您想设置和配置 LM Studio
title: "LM Studio"
---

# LM Studio

LM Studio 是一款友好而强大的应用程序，可在您自己的硬件上运行开放权重模型。它可以运行 llama.cpp（GGUF）或 MLX 模型（Apple Silicon）。提供 GUI 包或无界面守护进程（`llmster`）。有关产品和设置文档，请参见 [lmstudio.ai](https://lmstudio.ai/)。

## 快速开始

1. 安装 LM Studio（桌面版）或 `llmster`（无界面版），然后启动本地服务器：

```bash
curl -fsSL https://lmstudio.ai/install.sh | bash
```

2. 启动服务器

确保您启动桌面应用程序或使用以下命令运行守护进程：

```bash
lms daemon up
```

```bash
lms server start --port 1234
```

如果您使用应用程序，请确保已启用 JIT 以获得流畅体验。在 [LM Studio JIT 和 TTL 指南](https://lmstudio.ai/docs/developer/core/ttl-and-auto-evict)中了解更多信息。

3. 如果启用了 LM Studio 认证，请设置 `LM_API_TOKEN`：

```bash
export LM_API_TOKEN="your-lm-studio-api-token"
```

如果 LM Studio 认证被禁用，您可以在交互式 OpenClaw 设置期间将 API 密钥留空。

有关 LM Studio 认证设置的详细信息，请参见 [LM Studio 认证](https://lmstudio.ai/docs/developer/core/authentication)。

4. 运行引导程序并选择 `LM Studio`：

```bash
openclaw onboard
```

5. 在引导程序中，使用 `Default model` 提示选择您的 LM Studio 模型。

您也可以稍后设置或更改它：

```bash
openclaw models set lmstudio/qwen/qwen3.5-9b
```

LM Studio 模型键遵循 `author/model-name` 格式（例如 `qwen/qwen3.5-9b`）。OpenClaw
模型引用在前面加上 Provider 名称：`lmstudio/qwen/qwen3.5-9b`。您可以通过运行 `curl http://localhost:1234/api/v1/models` 并查看 `key` 字段来找到模型的确切键。

## 非交互式引导

当您想要脚本化设置（CI、配置、远程引导）时使用非交互式引导：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio
```

或使用 API 密钥指定基础 URL 或模型：

```bash
openclaw onboard \
  --non-interactive \
  --accept-risk \
  --auth-choice lmstudio \
  --custom-base-url http://localhost:1234/v1 \
  --lmstudio-api-key "$LM_API_TOKEN" \
  --custom-model-id qwen/qwen3.5-9b
```

`--custom-model-id` 采用 LM Studio 返回的模型键（例如 `qwen/qwen3.5-9b`），不带 `lmstudio/` Provider 前缀。

对于经过认证的 LM Studio 服务器，请传递 `--lmstudio-api-key` 或设置 `LM_API_TOKEN`。
对于未经认证的 LM Studio 服务器，省略密钥；OpenClaw 会存储一个本地非密钥标记。

`--custom-api-key` 仍然支持以保持兼容性，但 LM Studio 首选 `--lmstudio-api-key`。

这将写入 `models.providers.lmstudio` 并将默认模型设置为
`lmstudio/<custom-model-id>`。当您提供 API 密钥时，设置还会写入
`lmstudio:default` 认证配置文件。

交互式设置可以提示输入可选的首选加载上下文长度，并将其应用到它保存到配置中的已发现 LM Studio 模型中。
LM Studio 插件配置信任配置的 LM Studio 端点用于模型请求，包括环回、局域网和 tailnet 主机。您可以通过设置 `models.providers.lmstudio.request.allowPrivateNetwork: false` 来退出此行为。

## 配置

### 流式使用兼容性

LM Studio 与流式使用兼容。当它不发出 OpenAI 样式的 `usage` 对象时，OpenClaw 会从 llama.cpp 样式的 `timings.prompt_n` / `timings.predicted_n` 元数据中恢复令牌计数。

相同行为适用于以下 OpenAI 兼容的本地后端：

- vLLM
- SGLang
- llama.cpp
- LocalAI
- Jan
- TabbyAPI
- text-generation-webui

### 显式配置

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://localhost:1234/v1",
        apiKey: "${LM_API_TOKEN}",
        api: "openai-completions",
        models: [
          {
            id: "qwen/qwen3-coder-next",
            name: "Qwen 3 Coder Next",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## 故障排除

### 未检测到 LM Studio

确保 LM Studio 正在运行。如果启用了认证，还需设置 `LM_API_TOKEN`：

```bash
# 通过桌面应用程序启动，或无界面版本：
lms server start --port 1234
```

验证 API 是否可访问：

```bash
curl http://localhost:1234/api/v1/models
```

### 认证错误（HTTP 401）

如果设置报告 HTTP 401，请验证您的 API 密钥：

- 检查 `LM_API_TOKEN` 是否与 LM Studio 中配置的密钥匹配。
- 有关 LM Studio 认证设置详细信息，请参见 [LM Studio 认证](https://lmstudio.ai/docs/developer/core/authentication)。
- 如果您的服务器不需要认证，请在设置期间将密钥留空。

### 即时模型加载

LM Studio 支持即时（JIT）模型加载，其中模型在第一次请求时加载。确保您已启用此功能以避免"模型未加载"错误。

### 局域网或 tailnet LM Studio 主机

使用 LM Studio 主机的可达地址，保留 `/v1`，并确保 LM Studio 在该机器上绑定到了环回地址之外：

```json5
{
  models: {
    providers: {
      lmstudio: {
        baseUrl: "http://gpu-box.local:1234/v1",
        apiKey: "lmstudio",
        api: "openai-completions",
        models: [{ id: "qwen/qwen3.5-9b" }],
      },
    },
  },
}
```

与通用 OpenAI 兼容 Provider 不同，`lmstudio` 会自动信任其配置的本地/私有端点用于受保护的模型请求。如果您使用自定义 Provider id 而不是 `lmstudio`，请显式设置 `models.providers.<id>.request.allowPrivateNetwork: true`。

## 相关

- [模型选择](/concepts/model-providers)
- [Ollama](/providers/ollama)
- [本地模型](/gateway/local-models)
