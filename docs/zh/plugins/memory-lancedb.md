---
mmh3_hash: "40d2766baaf41a39c0ceeb0602d846d1"
summary: "配置 Bundle LanceDB 内存 Plugin，包括本地 Ollama 兼容嵌入"
read_when:
  - 您正在配置 Bundle memory-lancedb Plugin
  - 您希望 LanceDB 支持的长期记忆具有自动召回或自动捕获功能
  - 您正在使用本地 OpenAI 兼容嵌入，例如 Ollama
title: "Memory LanceDB"
sidebarTitle: "Memory LanceDB"
---

`memory-lancedb` 是一个 Bundle 内存 Plugin，它将长期记忆存储在 LanceDB 中，并使用嵌入进行召回。它可以在模型轮次之前自动召回相关记忆，并在响应后捕获重要事实。

当您希望本地向量数据库用于内存、需要 OpenAI 兼容的嵌入端点，或希望将内存数据库保存在默认内置内存存储之外时，请使用它。

<Note>
`memory-lancedb` 是一个活动内存 Plugin。通过 `plugins.slots.memory = "memory-lancedb"` 选择内存槽来启用它。`memory-wiki` 等配套 Plugin 可以与其并排运行，但只有一个 Plugin 拥有活动内存槽。
</Note>

## 快速开始

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

更改 Plugin 配置后重启 Gateway：

```bash
openclaw gateway restart
```

然后验证 Plugin 是否已加载：

```bash
openclaw plugins list
```

## Provider 支持的嵌入

`memory-lancedb` 可以使用与 `memory-core` 相同的内存嵌入 Provider 适配器。设置 `embedding.provider` 并省略 `embedding.apiKey`，以使用 Provider 的已配置身份验证配置文件、环境变量或 `models.providers.<provider>.apiKey`。

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "openai",
            model: "text-embedding-3-small",
          },
          autoRecall: true,
        },
      },
    },
  },
}
```

此路径与暴露嵌入凭据的 Provider 身份验证配置文件一起使用。例如，当 Copilot 配置文件/计划支持嵌入时，可以使用 GitHub Copilot：

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "github-copilot",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

OpenAI Codex / ChatGPT OAuth（`openai-codex`）不是 OpenAI Platform 嵌入凭据。对于 OpenAI 嵌入，请使用 OpenAI API 密钥身份验证配置文件、`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`。仅 OAuth 用户可以使用其他具有嵌入能力的 Provider，例如 GitHub Copilot 或 Ollama。

## Ollama 嵌入

对于 Ollama 嵌入，请优先使用 Bundle Ollama 嵌入 Provider。它使用原生 Ollama `/api/embed` 端点，并遵循与 [Ollama](/providers/ollama) 中记录的 Ollama Provider 相同的身份验证/基础 URL 规则。

```json5
{
  plugins: {
    slots: {
      memory: "memory-lancedb",
    },
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            provider: "ollama",
            baseUrl: "http://127.0.0.1:11434",
            model: "mxbai-embed-large",
            dimensions: 1024,
          },
          recallMaxChars: 400,
          autoRecall: true,
          autoCapture: false,
        },
      },
    },
  },
}
```

为非标准嵌入模型设置 `dimensions`。OpenClaw 知道 `text-embedding-3-small` 和 `text-embedding-3-large` 的维度；自定义模型需要配置中的值，以便 LanceDB 可以创建向量列。

对于小型本地嵌入模型，如果您从本地服务器看到上下文长度错误，请降低 `recallMaxChars`。

## OpenAI 兼容 Provider

一些 OpenAI 兼容的嵌入 Provider 会拒绝 `encoding_format` 参数，而其他 Provider 会忽略它并始终返回 `number[]` 向量。因此，`memory-lancedb` 在嵌入请求中省略 `encoding_format`，并接受浮点数组响应或 base64 编码的 float32 响应。

如果您有没有 Bundle Provider 适配器的原始 OpenAI 兼容嵌入端点，请省略 `embedding.provider`（或将其保留为 `openai`）并设置 `embedding.apiKey` 加 `embedding.baseUrl`。这保留了直接 OpenAI 兼容客户端路径。

为维度未内置的 Provider 设置 `embedding.dimensions`。例如，智谱 `embedding-3` 使用 `2048` 维度：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          embedding: {
            apiKey: "${ZHIPU_API_KEY}",
            baseUrl: "https://open.bigmodel.cn/api/paas/v4",
            model: "embedding-3",
            dimensions: 2048,
          },
        },
      },
    },
  },
}
```

## 召回和捕获限制

`memory-lancedb` 有两个独立的文本限制：

| 设置              | 默认值  | 范围      | 适用于                                    |
| ----------------- | ------- | --------- | ----------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | 发送到嵌入 API 用于召回的文本             |
| `captureMaxChars` | `500`   | 100-10000 | 符合捕获条件的助手消息长度                |

`recallMaxChars` 控制自动召回、`memory_recall` Tool、`memory_forget` 查询路径和 `openclaw ltm search`。自动召回优先使用轮次中最新的用户消息，并仅在没有用户消息时才回退到完整提示。这使 Channel 元数据和大型提示块不进入嵌入请求。

`captureMaxChars` 控制响应是否足够短以被考虑自动捕获。它不限制召回查询嵌入。

## 命令

当 `memory-lancedb` 是活动内存 Plugin 时，它注册 `ltm` CLI 命名空间：

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

Plugin 还使用非向量 `query` 子命令扩展 `openclaw memory`，该子命令直接针对 LanceDB 表运行：

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`：逗号分隔的列允许列表（默认为 `id`、`text`、`importance`、`category`、`createdAt`）。
- `--filter <condition>`：SQL 样式的 WHERE 子句；上限为 200 个字符，限于字母数字、比较运算符、引号、括号和一小组安全标点符号。
- `--limit <n>`：正整数；默认值 `10`。
- `--order-by <column>:<asc|desc>`：过滤后应用的内存排序；排序列自动包含在投影中。

Agent 还从活动内存 Plugin 获得 LanceDB 内存 Tool：

- `memory_recall` 用于 LanceDB 支持的召回
- `memory_store` 用于保存重要事实、偏好、决策和实体
- `memory_forget` 用于删除匹配的记忆

## 存储

默认情况下，LanceDB 数据位于 `~/.openclaw/memory/lancedb` 下。使用 `dbPath` 覆盖路径：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "~/.openclaw/memory/lancedb",
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

`storageOptions` 接受用于 LanceDB 存储后端的字符串键/值对，并支持 `${ENV_VAR}` 展开：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        enabled: true,
        config: {
          dbPath: "s3://memory-bucket/openclaw",
          storageOptions: {
            access_key: "${AWS_ACCESS_KEY_ID}",
            secret_key: "${AWS_SECRET_ACCESS_KEY}",
            endpoint: "${AWS_ENDPOINT_URL}",
          },
          embedding: {
            apiKey: "${OPENAI_API_KEY}",
            model: "text-embedding-3-small",
          },
        },
      },
    },
  },
}
```

## 运行时依赖

`memory-lancedb` 依赖原生 `@lancedb/lancedb` Package。打包的 OpenClaw 将该 Package 视为 Plugin Package 的一部分。Gateway 启动不修复 Plugin 依赖；如果依赖缺失，请重新安装或更新 Plugin Package 并重启 Gateway。

如果旧版安装在 Plugin 加载期间记录了缺少 `dist/package.json` 或缺少 `@lancedb/lancedb` 错误，请升级 OpenClaw 并重启 Gateway。

如果 Plugin 在 `darwin-x64` 上记录 LanceDB 不可用，请在该机器上使用默认内存后端、将 Gateway 移动到受支持的平台，或禁用 `memory-lancedb`。

## 故障排查

### 输入长度超过上下文长度

这通常意味着嵌入模型拒绝了召回查询：

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

设置更低的 `recallMaxChars`，然后重启 Gateway：

```json5
{
  plugins: {
    entries: {
      "memory-lancedb": {
        config: {
          recallMaxChars: 400,
        },
      },
    },
  },
}
```

对于 Ollama，还要验证嵌入服务器可以从 Gateway 主机访问：

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支持的嵌入模型

没有 `dimensions`，只有内置的 OpenAI 嵌入维度是已知的。对于本地或自定义嵌入模型，请将 `embedding.dimensions` 设置为该模型报告的向量大小。

### Plugin 加载但没有记忆出现

检查 `plugins.slots.memory` 是否指向 `memory-lancedb`，然后运行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果 `autoCapture` 被禁用，Plugin 将召回现有记忆，但不会自动存储新的记忆。如果您希望自动捕获，请使用 `memory_store` Tool 或启用 `autoCapture`。

## 相关

- [内存概览](/concepts/memory)
- [活动内存](/concepts/active-memory)
- [内存搜索](/concepts/memory-search)
- [Memory Wiki](/plugins/memory-wiki)
- [Ollama](/providers/ollama)
