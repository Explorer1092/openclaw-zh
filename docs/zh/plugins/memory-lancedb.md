---
mmh3_hash: "262518aba20692056a5545988c67b5d8"
summary: "配置官方外部 LanceDB 内存 Plugin，包括本地 Ollama 兼容嵌入"
read_when:
  - 您正在配置 memory-lancedb Plugin
  - 您希望通过自动召回或自动捕获使用 LanceDB 支持的长期内存
  - 您正在使用本地 OpenAI 兼容嵌入，例如 Ollama
title: "Memory LanceDB"
sidebarTitle: "Memory LanceDB"
doc-schema-version: 1
---

`memory-lancedb` 是一个官方外部内存 Plugin，它将长期记忆存储在 LanceDB 中，并使用嵌入进行召回。它可以在模型轮次之前自动召回相关记忆，并在响应之后捕获重要事实。

当您需要用于内存的本地向量数据库、需要 OpenAI 兼容嵌入端点，或希望将内存数据库保存在默认内置内存存储之外时，请使用它。

## 安装

在设置 `plugins.slots.memory = "memory-lancedb"` 之前，请先安装 `memory-lancedb`：

```bash
openclaw plugins install @openclaw/memory-lancedb
```

该 Plugin 已发布到 npm，不捆绑在 OpenClaw 运行时镜像中。安装程序会写入 Plugin 条目，并在没有其他 Plugin 占用时切换到内存 Slot。

<Note>
`memory-lancedb` 是一个活跃内存 Plugin。通过 `plugins.slots.memory = "memory-lancedb"` 选择内存 Slot 来启用它。`memory-wiki` 等伴随 Plugin 可以与它并行运行，但只有一个 Plugin 拥有活跃内存 Slot。
</Note>

## 快速入门

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

然后验证 Plugin 已加载：

```bash
openclaw plugins list
```

## Provider 支持的嵌入

`memory-lancedb` 可以使用与 `memory-core` 相同的内存嵌入 Provider 适配器。设置 `embedding.provider` 并省略 `embedding.apiKey`，以使用 Provider 配置的身份验证配置文件、环境变量或 `models.providers.<provider>.apiKey`。

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

此路径适用于公开嵌入凭证的 Provider 身份验证配置文件。例如，当 Copilot 配置文件/计划支持嵌入时，可以使用 GitHub Copilot：

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

OpenAI Codex / ChatGPT OAuth（`openai-codex`）不是 OpenAI Platform 嵌入凭证。对于 OpenAI 嵌入，请使用 OpenAI API 密钥身份验证配置文件、`OPENAI_API_KEY` 或 `models.providers.openai.apiKey`。仅使用 OAuth 的用户可以使用另一个支持嵌入的 Provider，例如 GitHub Copilot 或 Ollama。

## Ollama 嵌入

对于 Ollama 嵌入，优先使用捆绑的 Ollama 嵌入 Provider。它使用原生 Ollama `/api/embed` 端点，并遵循 [Ollama](/providers/ollama) 文档中记录的相同身份验证/基础 URL 规则。

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

对于非标准嵌入模型，请设置 `dimensions`。OpenClaw 知道 `text-embedding-3-small` 和 `text-embedding-3-large` 的维度；自定义模型需要在配置中提供该值，以便 LanceDB 可以创建向量列。

对于小型本地嵌入模型，如果您在本地服务器看到上下文长度错误，请降低 `recallMaxChars`。

## OpenAI 兼容 Provider

某些 OpenAI 兼容嵌入 Provider 会拒绝 `encoding_format` 参数，而其他 Provider 会忽略它并始终返回 `number[]` 向量。因此，`memory-lancedb` 在嵌入请求中省略 `encoding_format`，并接受浮点数组响应或 base64 编码的 float32 响应。

如果您有一个没有捆绑 Provider 适配器的原始 OpenAI 兼容嵌入端点，请省略 `embedding.provider`（或保留为 `openai`），并设置 `embedding.apiKey` 和 `embedding.baseUrl`。这将保留直接的 OpenAI 兼容客户端路径。

对于内置模型维度未知的 Provider，请设置 `embedding.dimensions`。例如，ZhiPu `embedding-3` 使用 `2048` 维度：

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

| 设置              | 默认值  | 范围      | 适用于                                                    |
| ----------------- | ------- | --------- | --------------------------------------------------------- |
| `recallMaxChars`  | `1000`  | 100-10000 | 发送到嵌入 API 进行召回的文本                             |
| `captureMaxChars` | `500`   | 100-10000 | 符合自动捕获条件的消息长度                                |
| `customTriggers`  | `[]`    | 0-50      | 使自动捕获考虑某条消息的字面短语                          |

`recallMaxChars` 控制自动召回、`memory_recall` 工具、`memory_forget` 查询路径和 `openclaw ltm search`。自动召回优先使用轮次中的最新用户消息，仅在没有用户消息时才回退到完整提示。这使 Channel 元数据和大型提示块不会出现在嵌入请求中。

`captureMaxChars` 控制响应是否足够短以被考虑进行自动捕获。它不会限制召回查询嵌入。

`customTriggers` 允许您添加字面自动捕获短语，而无需编写正则表达式。内置触发器包括常见的英语、捷克语、中文、日语和韩语记忆短语。

## 命令

当 `memory-lancedb` 是活跃内存 Plugin 时，它会注册 `ltm` CLI 命名空间：

```bash
openclaw ltm list
openclaw ltm search "project preferences"
openclaw ltm stats
```

该 Plugin 还使用非向量 `query` 子命令扩展了 `openclaw memory`，该命令直接对 LanceDB 表运行：

```bash
openclaw memory query --cols id,text,createdAt --limit 20
openclaw memory query --filter "category = 'preference'" --order-by createdAt:desc
```

- `--cols <columns>`：逗号分隔的列白名单（默认为 `id`、`text`、`importance`、`category`、`createdAt`）。
- `--filter <condition>`：SQL 风格的 WHERE 子句；上限为 200 个字符，仅限字母数字、比较运算符、引号、括号和一小组安全标点符号。
- `--limit <n>`：正整数；默认 `10`。
- `--order-by <column>:<asc|desc>`：过滤后应用的内存中排序；排序列会自动包含在投影中。

Agent 还会从活跃内存 Plugin 获得 LanceDB 内存工具：

- `memory_recall`：用于 LanceDB 支持的召回
- `memory_store`：用于保存重要事实、偏好、决策和实体
- `memory_forget`：用于删除匹配的记忆

## 存储

默认情况下，LanceDB 数据存储在 `~/.openclaw/memory/lancedb` 下。使用 `dbPath` 覆盖路径：

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

`storageOptions` 接受用于 LanceDB 存储后端的字符串键值对，并支持 `${ENV_VAR}` 展开：

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

`memory-lancedb` 依赖于原生 `@lancedb/lancedb` 包。打包的 OpenClaw 将该包视为 Plugin 包的一部分。Gateway 启动不会修复 Plugin 依赖；如果缺少依赖，请重新安装或更新 Plugin 包并重启 Gateway。

如果旧版安装在 Plugin 加载期间记录了缺少 `dist/package.json` 或缺少 `@lancedb/lancedb` 错误，请升级 OpenClaw 并重启 Gateway。

如果 Plugin 记录 LanceDB 在 `darwin-x64` 上不可用，请在该机器上使用默认内存后端，将 Gateway 移至受支持的平台，或禁用 `memory-lancedb`。

## 故障排除

### 输入长度超过上下文长度

这通常意味着嵌入模型拒绝了召回查询：

```text
memory-lancedb: recall failed: Error: 400 the input length exceeds the context length
```

设置较低的 `recallMaxChars`，然后重启 Gateway：

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

对于 Ollama，还要验证嵌入服务器是否可从 Gateway 主机访问：

```bash
curl http://127.0.0.1:11434/v1/embeddings \
  -H "Content-Type: application/json" \
  -d '{"model":"mxbai-embed-large","input":"hello"}'
```

### 不支持的嵌入模型

没有 `dimensions`，只知道内置的 OpenAI 嵌入维度。对于本地或自定义嵌入模型，请将 `embedding.dimensions` 设置为该模型报告的向量大小。

### Plugin 已加载但未出现记忆

检查 `plugins.slots.memory` 是否指向 `memory-lancedb`，然后运行：

```bash
openclaw ltm stats
openclaw ltm search "recent preference"
```

如果 `autoCapture` 被禁用，Plugin 将召回现有记忆，但不会自动存储新记忆。如果您希望自动捕获，请使用 `memory_store` 工具或启用 `autoCapture`。

## 相关

- [内存概述](/concepts/memory)
- [活跃内存](/concepts/active-memory)
- [内存搜索](/concepts/memory-search)
- [Memory Wiki](/plugins/memory-wiki)
- [Ollama](/providers/ollama)
