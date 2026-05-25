---
mmh3_hash: "d5886fb1e9ac62e4acb4292c70b22045"
title: "记忆配置参考"
sidebarTitle: "记忆配置"
summary: "记忆搜索、嵌入 Provider、QMD、混合搜索和多模态索引的所有配置选项"
read_when:
  - 您想配置记忆搜索 Provider 或嵌入模型
  - 您想设置 QMD 后端
  - 您想调整混合搜索、MMR 或时间衰减
  - 您想启用多模态记忆索引
---

本页列出了 OpenClaw 记忆搜索的所有配置选项。有关概念概述，请参见：

<CardGroup cols={2}>
  <Card title="记忆概述" href="/concepts/memory">
    记忆工作原理。
  </Card>
  <Card title="内置引擎" href="/concepts/memory-builtin">
    默认 SQLite 后端。
  </Card>
  <Card title="QMD 引擎" href="/concepts/memory-qmd">
    本地优先辅助程序。
  </Card>
  <Card title="记忆搜索" href="/concepts/memory-search">
    搜索管道和调优。
  </Card>
  <Card title="主动记忆" href="/concepts/active-memory">
    为交互式 Session 启用记忆子 Agent。
  </Card>
</CardGroup>

所有记忆搜索设置都位于 `openclaw.json` 中 `agents.defaults.memorySearch` 下（除非另有说明）。

<Note>
如果您在寻找**主动记忆**功能开关和子 Agent 配置，
它位于 `plugins.entries.active-memory` 下，而非 `memorySearch`。

主动记忆使用双门控模型：

1. Plugin 必须已启用并以当前 Agent id 为目标
2. 请求必须是符合条件的交互式持久聊天 Session

有关激活模型、Plugin 拥有的配置、转录持久化和安全推出模式，请参见[主动记忆](/concepts/active-memory)。
</Note>

---

## Provider 选择

| 键         | 类型      | 默认值       | 说明                                                                                                                                                                                                                               |
| ---------- | --------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `string`  | 自动检测     | 嵌入适配器 ID，如 `bedrock`、`deepinfra`、`gemini`、`github-copilot`、`local`、`mistral`、`ollama`、`openai` 或 `voyage`；也可以是配置了的 `models.providers.<id>`，其 `api` 指向上述适配器之一 |
| `model`    | `string`  | Provider 默认 | 嵌入模型名称                                                                                                                                                                                                                        |
| `fallback` | `string`  | `"none"`     | 主 Provider 失败时的回退适配器 ID                                                                                                                                                                                                   |
| `enabled`  | `boolean` | `true`       | 启用或禁用记忆搜索                                                                                                                                                                                                                  |

### 自动检测顺序

当未设置 `provider` 时，OpenClaw 选择第一个可用的：

<Steps>
  <Step title="local">
    如果配置了 `memorySearch.local.modelPath` 且文件存在，则选择。
  </Step>
  <Step title="github-copilot">
    如果可以解析 GitHub Copilot token（环境变量或身份验证配置文件），则选择。
  </Step>
  <Step title="openai">
    如果可以解析 OpenAI 密钥，则选择。
  </Step>
  <Step title="gemini">
    如果可以解析 Gemini 密钥，则选择。
  </Step>
  <Step title="voyage">
    如果可以解析 Voyage 密钥，则选择。
  </Step>
  <Step title="mistral">
    如果可以解析 Mistral 密钥，则选择。
  </Step>
  <Step title="deepinfra">
    如果可以解析 DeepInfra 密钥，则选择。
  </Step>
  <Step title="bedrock">
    如果 AWS SDK 凭据链解析成功（实例角色、访问密钥、Profile、SSO、Web Identity 或共享配置），则选择。
  </Step>
</Steps>

`ollama` 受支持但不会自动检测（需要明确设置）。

### 自定义 Provider ID

`memorySearch.provider` 可以指向自定义的 `models.providers.<id>` 条目。OpenClaw 解析该 Provider 的 `api` 归属作为嵌入适配器，同时保留自定义 Provider id 用于端点、身份验证和模型前缀处理。这样，多 GPU 或多主机设置可以将记忆嵌入专用到特定的本地端点：

```json5
{
  models: {
    providers: {
      "ollama-5080": {
        api: "ollama",
        baseUrl: "http://gpu-box.local:11435",
        apiKey: "ollama-local",
        models: [{ id: "qwen3-embedding:0.6b" }],
      },
    },
  },
  agents: {
    defaults: {
      memorySearch: {
        provider: "ollama-5080",
        model: "qwen3-embedding:0.6b",
      },
    },
  },
}
```

### API 密钥解析

远程嵌入需要 API 密钥。Bedrock 使用 AWS SDK 默认凭据链代替（实例角色、SSO、访问密钥）。

| Provider       | 环境变量                                               | 配置键                              |
| -------------- | ------------------------------------------------------ | ----------------------------------- |
| Bedrock        | AWS 凭据链                                             | 无需 API 密钥                       |
| DeepInfra      | `DEEPINFRA_API_KEY`                                    | `models.providers.deepinfra.apiKey` |
| Gemini         | `GEMINI_API_KEY`                                       | `models.providers.google.apiKey`    |
| GitHub Copilot | `COPILOT_GITHUB_TOKEN`、`GH_TOKEN`、`GITHUB_TOKEN`    | 通过设备登录的身份验证配置文件      |
| Mistral        | `MISTRAL_API_KEY`                                      | `models.providers.mistral.apiKey`   |
| Ollama         | `OLLAMA_API_KEY`（占位符）                             | --                                  |
| OpenAI         | `OPENAI_API_KEY`                                       | `models.providers.openai.apiKey`    |
| Voyage         | `VOYAGE_API_KEY`                                       | `models.providers.voyage.apiKey`    |

<Note>
Codex OAuth 仅涵盖 chat/completions，不满足嵌入请求。
</Note>

---

## 远程端点配置

用于自定义 OpenAI 兼容端点或覆盖 Provider 默认值：

<ParamField path="remote.baseUrl" type="string">
  自定义 API 基础 URL。
</ParamField>
<ParamField path="remote.apiKey" type="string">
  覆盖 API 密钥。
</ParamField>
<ParamField path="remote.headers" type="object">
  额外 HTTP 头（与 Provider 默认值合并）。
</ParamField>

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
        remote: {
          baseUrl: "https://api.example.com/v1/",
          apiKey: "YOUR_KEY",
        },
      },
    },
  },
}
```

---

## Provider 特定配置

<AccordionGroup>
  <Accordion title="Gemini">
    | 键                     | 类型     | 默认值                 | 说明                                            |
    | ---------------------- | -------- | ---------------------- | ----------------------------------------------- |
    | `model`                | `string` | `gemini-embedding-001` | 也支持 `gemini-embedding-2-preview`             |
    | `outputDimensionality` | `number` | `3072`                 | 对于 Embedding 2：768、1536 或 3072             |

    <Warning>
    更改模型或 `outputDimensionality` 会触发自动完整重新索引。
    </Warning>

  </Accordion>
  <Accordion title="OpenAI 兼容输入类型">
    OpenAI 兼容的嵌入端点可以选择加入 Provider 特定的 `input_type` 请求字段。这对于查询和文档嵌入需要不同标签的非对称嵌入模型非常有用。

    | 键                  | 类型     | 默认值 | 说明                                                     |
    | ------------------- | -------- | ------ | -------------------------------------------------------- |
    | `inputType`         | `string` | 未设置 | 查询和文档嵌入的共享 `input_type`                        |
    | `queryInputType`    | `string` | 未设置 | 查询时的 `input_type`；覆盖 `inputType`                  |
    | `documentInputType` | `string` | 未设置 | 索引/文档的 `input_type`；覆盖 `inputType`               |

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "openai",
            remote: {
              baseUrl: "https://embeddings.example/v1",
              apiKey: "env:EMBEDDINGS_API_KEY",
            },
            model: "asymmetric-embedder",
            queryInputType: "query",
            documentInputType: "passage",
          },
        },
      },
    }
    ```

    更改这些值会影响 Provider 批量索引的嵌入缓存标识，当上游模型对标签的处理方式不同时，应随后进行记忆重新索引。

  </Accordion>
  <Accordion title="Bedrock">
    ### Bedrock 嵌入配置

    Bedrock 使用 AWS SDK 默认凭据链——无需 API 密钥。如果 OpenClaw 在配有 Bedrock 实例角色的 EC2 上运行，只需设置 Provider 和模型：

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0",
          },
        },
      },
    }
    ```

    | 键                     | 类型     | 默认值                         | 说明                            |
    | ---------------------- | -------- | ------------------------------ | ------------------------------- |
    | `model`                | `string` | `amazon.titan-embed-text-v2:0` | 任何 Bedrock 嵌入模型 ID        |
    | `outputDimensionality` | `number` | 模型默认值                     | 对于 Titan V2：256、512 或 1024 |

    **支持的模型**（带系列检测和维度默认值）：

    | 模型 ID                                    | Provider   | 默认维度 | 可配置维度           |
    | ------------------------------------------ | ---------- | -------- | -------------------- |
    | `amazon.titan-embed-text-v2:0`             | Amazon     | 1024     | 256、512、1024       |
    | `amazon.titan-embed-text-v1`               | Amazon     | 1536     | --                   |
    | `amazon.titan-embed-g1-text-02`            | Amazon     | 1536     | --                   |
    | `amazon.titan-embed-image-v1`              | Amazon     | 1024     | --                   |
    | `amazon.nova-2-multimodal-embeddings-v1:0` | Amazon     | 1024     | 256、384、1024、3072 |
    | `cohere.embed-english-v3`                  | Cohere     | 1024     | --                   |
    | `cohere.embed-multilingual-v3`             | Cohere     | 1024     | --                   |
    | `cohere.embed-v4:0`                        | Cohere     | 1536     | 256-1536             |
    | `twelvelabs.marengo-embed-3-0-v1:0`        | TwelveLabs | 512      | --                   |
    | `twelvelabs.marengo-embed-2-7-v1:0`        | TwelveLabs | 1024     | --                   |

    带有吞吐量后缀的变体（例如 `amazon.titan-embed-text-v1:2:8k`）继承基础模型的配置。

    **身份验证：** Bedrock 身份验证使用标准 AWS SDK 凭据解析顺序：

    1. 环境变量（`AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`）
    2. SSO token 缓存
    3. Web identity token 凭据
    4. 共享凭据和配置文件
    5. ECS 或 EC2 元数据凭据

    区域从 `AWS_REGION`、`AWS_DEFAULT_REGION`、`amazon-bedrock` Provider `baseUrl` 中解析，或默认为 `us-east-1`。

    **IAM 权限：** IAM 角色或用户需要：

    ```json
    {
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "*"
    }
    ```

    对于最小权限，将 `InvokeModel` 范围限制到特定模型：

    ```
    arn:aws:bedrock:*::foundation-model/amazon.titan-embed-text-v2:0
    ```

  </Accordion>
  <Accordion title="本地（GGUF + node-llama-cpp）">
    | 键                    | 类型               | 默认值                  | 说明                                                                                                                                                                                                                                                                     |
    | --------------------- | ------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
    | `local.modelPath`     | `string`           | 自动下载                | GGUF 模型文件路径                                                                                                                                                                                                                                                        |
    | `local.modelCacheDir` | `string`           | node-llama-cpp 默认值   | 下载模型的缓存目录                                                                                                                                                                                                                                                       |
    | `local.contextSize`   | `number \| "auto"` | `4096`                  | 嵌入上下文的上下文窗口大小。4096 覆盖典型的块（128–512 个 token），同时限制非权重 VRAM。在受限主机上降低到 1024–2048。`"auto"` 使用模型训练的最大值——不推荐用于 8B+ 模型（Qwen3-Embedding-8B：40 960 个 token → 约 32 GB VRAM vs 4096 时约 8.8 GB）。                   |

    默认模型：`embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB，自动下载）。Source checkout 仍需要原生构建审批：`pnpm approve-builds` 然后 `pnpm rebuild node-llama-cpp`。

    使用独立 CLI 验证 Gateway 使用的相同 Provider 路径：

    ```bash
    openclaw memory status --deep --agent main
    openclaw memory index --force --agent main
    ```

    如果 `provider` 为 `auto`，只有当 `local.modelPath` 指向现有本地文件时才选择 `local`。`hf:` 和 HTTP(S) 模型引用仍然可以与 `provider: "local"` 一起明确使用，但在模型在磁盘上可用之前，它们不会使 `auto` 在本地之前选择。

  </Accordion>
</AccordionGroup>

### 内联嵌入超时

<ParamField path="sync.embeddingBatchTimeoutSeconds" type="number">
  覆盖记忆索引期间内联嵌入批次的超时时间。

未设置时使用 Provider 默认值：本地/自托管 Provider（如 `local`、`ollama` 和 `lmstudio`）为 600 秒，托管 Provider 为 120 秒。当本地 CPU 绑定的嵌入批次是健康的但速度较慢时，增加此值。
</ParamField>

---

## 混合搜索配置

所有配置位于 `memorySearch.query.hybrid` 下：

| 键                    | 类型      | 默认值  | 说明                              |
| --------------------- | --------- | ------- | --------------------------------- |
| `enabled`             | `boolean` | `true`  | 启用混合 BM25 + 向量搜索          |
| `vectorWeight`        | `number`  | `0.7`   | 向量得分权重（0-1）               |
| `textWeight`          | `number`  | `0.3`   | BM25 得分权重（0-1）              |
| `candidateMultiplier` | `number`  | `4`     | 候选池大小乘数                    |

<Tabs>
  <Tab title="MMR（多样性）">
    | 键            | 类型      | 默认值  | 说明                                   |
    | ------------- | --------- | ------- | -------------------------------------- |
    | `mmr.enabled` | `boolean` | `false` | 启用 MMR 重排序                        |
    | `mmr.lambda`  | `number`  | `0.7`   | 0 = 最大多样性，1 = 最大相关性         |
  </Tab>
  <Tab title="时间衰减（近期性）">
    | 键                           | 类型      | 默认值  | 说明                        |
    | ---------------------------- | --------- | ------- | --------------------------- |
    | `temporalDecay.enabled`      | `boolean` | `false` | 启用近期性加成              |
    | `temporalDecay.halfLifeDays` | `number`  | `30`    | 得分每 N 天减半             |

    常青文件（`MEMORY.md`、`memory/` 中的非日期文件）永不衰减。

  </Tab>
</Tabs>

### 完整示例

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        query: {
          hybrid: {
            vectorWeight: 0.7,
            textWeight: 0.3,
            mmr: { enabled: true, lambda: 0.7 },
            temporalDecay: { enabled: true, halfLifeDays: 30 },
          },
        },
      },
    },
  },
}
```

---

## 额外记忆路径

| 键           | 类型       | 说明                              |
| ------------ | ---------- | --------------------------------- |
| `extraPaths` | `string[]` | 要索引的额外目录或文件             |

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
    },
  },
}
```

路径可以是绝对路径或相对于工作区的路径。目录会递归扫描 `.md` 文件。符号链接处理取决于活动后端：内置引擎忽略符号链接，而 QMD 遵循底层 QMD 扫描器行为。

对于 Agent 范围的跨 Agent 转录搜索，使用 `agents.list[].memorySearch.qmd.extraCollections` 而非 `memory.qmd.paths`。这些额外集合遵循相同的 `{ path, name, pattern? }` 形状，但它们按 Agent 合并，并且当路径指向当前工作区外部时可以保留明确的共享名称。如果相同的解析路径同时出现在 `memory.qmd.paths` 和 `memorySearch.qmd.extraCollections` 中，QMD 保留第一个条目并跳过重复项。

---

## 多模态记忆（Gemini）

使用 Gemini Embedding 2 将图像和音频与 Markdown 一起索引：

| 键                        | 类型       | 默认值     | 说明                                    |
| ------------------------- | ---------- | ---------- | --------------------------------------- |
| `multimodal.enabled`      | `boolean`  | `false`    | 启用多模态索引                          |
| `multimodal.modalities`   | `string[]` | --         | `["image"]`、`["audio"]` 或 `["all"]`  |
| `multimodal.maxFileBytes` | `number`   | `10000000` | 索引的最大文件大小                      |

<Note>
仅适用于 `extraPaths` 中的文件。默认记忆根目录仅保持 Markdown。需要 `gemini-embedding-2-preview`。`fallback` 必须为 `"none"`。
</Note>

支持的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`（图像）；`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`（音频）。

---

## 嵌入缓存

| 键                 | 类型      | 默认值  | 说明                              |
| ------------------ | --------- | ------- | --------------------------------- |
| `cache.enabled`    | `boolean` | `true`  | 在 SQLite 中缓存块嵌入            |
| `cache.maxEntries` | `number`  | `50000` | 最大缓存嵌入数                    |

防止在重新索引或转录更新期间重新嵌入未更改的文本。

---

## 批量索引

| 键                            | 类型      | 默认值  | 说明                      |
| ----------------------------- | --------- | ------- | ------------------------- |
| `remote.nonBatchConcurrency`  | `number`  | `4`     | 并行内联嵌入数            |
| `remote.batch.enabled`        | `boolean` | `false` | 启用批量嵌入 API          |
| `remote.batch.concurrency`    | `number`  | `2`     | 并行批量任务数            |
| `remote.batch.wait`           | `boolean` | `true`  | 等待批量完成              |
| `remote.batch.pollIntervalMs` | `number`  | --      | 轮询间隔                  |
| `remote.batch.timeoutMinutes` | `number`  | --      | 批量超时                  |

适用于 `openai`、`gemini` 和 `voyage`。对于大型回填，OpenAI 批量通常最快且最便宜。

`remote.nonBatchConcurrency` 控制本地/自托管 Provider 以及托管 Provider 在 Provider 批量 API 未激活时使用的内联嵌入调用。Ollama 非批量索引默认为 `1` 以避免压垮较小的本地主机；在较大的机器上可以设置更高的值。

这与 `sync.embeddingBatchTimeoutSeconds` 不同，后者控制内联嵌入调用的超时时间。

---

## Session 记忆搜索（实验性）

索引 Session 转录并通过 `memory_search` 显示它们：

| 键                            | 类型       | 默认值       | 说明                              |
| ----------------------------- | ---------- | ------------ | --------------------------------- |
| `experimental.sessionMemory`  | `boolean`  | `false`      | 启用 Session 索引                 |
| `sources`                     | `string[]` | `["memory"]` | 添加 `"sessions"` 以包含转录     |
| `sync.sessions.deltaBytes`    | `number`   | `100000`     | 触发重新索引的字节阈值            |
| `sync.sessions.deltaMessages` | `number`   | `50`         | 触发重新索引的消息阈值            |

<Warning>
Session 索引是可选加入的，异步运行。结果可能略有过时。Session 日志存储在磁盘上，因此将文件系统访问视为信任边界。
</Warning>

---

## SQLite 向量加速（sqlite-vec）

| 键                           | 类型      | 默认值 | 说明                              |
| ---------------------------- | --------- | ------ | --------------------------------- |
| `store.vector.enabled`       | `boolean` | `true` | 使用 sqlite-vec 进行向量查询      |
| `store.vector.extensionPath` | `string`  | 捆绑   | 覆盖 sqlite-vec 路径              |

当 sqlite-vec 不可用时，OpenClaw 自动回退到进程内余弦相似度。

---

## 索引存储

| 键                    | 类型     | 默认值                                | 说明                                                |
| --------------------- | -------- | ------------------------------------- | --------------------------------------------------- |
| `store.path`          | `string` | `~/.openclaw/memory/{agentId}.sqlite` | 索引位置（支持 `{agentId}` token）                  |
| `store.fts.tokenizer` | `string` | `unicode61`                           | FTS5 分词器（`unicode61` 或 `trigram`）              |

---

## QMD 后端配置

设置 `memory.backend = "qmd"` 以启用。所有 QMD 设置位于 `memory.qmd` 下：

| 键                       | 类型      | 默认值   | 说明                                                                                         |
| ------------------------ | --------- | -------- | -------------------------------------------------------------------------------------------- |
| `command`                | `string`  | `qmd`    | QMD 可执行文件路径；当服务 `PATH` 与您的 shell 不同时，设置绝对路径                          |
| `searchMode`             | `string`  | `search` | 搜索命令：`search`、`vsearch`、`query`                                                       |
| `includeDefaultMemory`   | `boolean` | `true`   | 自动索引 `MEMORY.md` + `memory/**/*.md`                                                      |
| `paths[]`                | `array`   | --       | 额外路径：`{ name, path, pattern? }`                                                         |
| `sessions.enabled`       | `boolean` | `false`  | 索引 Session 转录                                                                            |
| `sessions.retentionDays` | `number`  | --       | 转录保留时间                                                                                 |
| `sessions.exportDir`     | `string`  | --       | 导出目录                                                                                     |

`searchMode: "search"` 仅为词法/BM25。对于该模式，OpenClaw 不运行语义向量就绪性探测或 QMD 嵌入维护，包括在 `memory status --deep` 期间；`vsearch` 和 `query` 仍然需要 QMD 向量就绪性和嵌入。

OpenClaw 优先使用当前 QMD 集合和 MCP 查询形状，但通过在需要时尝试兼容的集合模式标志和旧版 MCP 工具名称，保持旧版 QMD 版本正常工作。当 QMD 宣传支持多个集合过滤器时，同源集合使用一个 QMD 进程搜索；旧版 QMD 构建保留按集合的兼容路径。同源意味着持久记忆集合被分组在一起，而 Session 转录集合保持独立分组，以便来源多样化仍然有两个输入。

<Note>
QMD 模型覆盖保持在 QMD 侧，而非 OpenClaw 配置。如果需要全局覆盖 QMD 的模型，在 Gateway 运行时环境中设置环境变量，如 `QMD_EMBED_MODEL`、`QMD_RERANK_MODEL` 和 `QMD_GENERATE_MODEL`。
</Note>

<AccordionGroup>
  <Accordion title="更新计划">
    | 键                        | 类型      | 默认值   | 说明                                               |
    | ------------------------- | --------- | -------- | -------------------------------------------------- |
    | `update.interval`         | `string`  | `5m`     | 刷新间隔                                           |
    | `update.debounceMs`       | `number`  | `15000`  | 防抖文件更改                                       |
    | `update.onBoot`           | `boolean` | `true`   | 长期运行的 QMD 管理器打开时刷新；也控制可选加入的启动刷新 |
    | `update.startup`          | `string`  | `off`    | 可选的 Gateway 启动刷新：`off`、`idle` 或 `immediate` |
    | `update.startupDelayMs`   | `number`  | `120000` | `startup: "idle"` 刷新运行前的延迟                 |
    | `update.waitForBootSync`  | `boolean` | `false`  | 阻塞管理器打开直到初始刷新完成                     |
    | `update.embedInterval`    | `string`  | --       | 单独的嵌入节奏                                     |
    | `update.commandTimeoutMs` | `number`  | --       | QMD 命令超时                                       |
    | `update.updateTimeoutMs`  | `number`  | --       | QMD 更新操作超时                                   |
    | `update.embedTimeoutMs`   | `number`  | --       | QMD 嵌入操作超时                                   |
  </Accordion>
  <Accordion title="限制">
    | 键                        | 类型     | 默认值 | 说明                      |
    | ------------------------- | -------- | ------ | ------------------------- |
    | `limits.maxResults`       | `number` | `6`    | 最大搜索结果数            |
    | `limits.maxSnippetChars`  | `number` | --     | 限制代码片段长度          |
    | `limits.maxInjectedChars` | `number` | --     | 限制总注入字符数          |
    | `limits.timeoutMs`        | `number` | `4000` | 搜索超时                  |
  </Accordion>
  <Accordion title="范围">
    控制哪些 Session 可以接收 QMD 搜索结果。与 [`session.sendPolicy`](/gateway/config-agents#session) 相同的架构：

    ```json5
    {
      memory: {
        qmd: {
          scope: {
            default: "deny",
            rules: [{ action: "allow", match: { chatType: "direct" } }],
          },
        },
      },
    }
    ```

    默认允许直接和 Channel Session，同时仍然拒绝群组。

    默认仅 DM。`match.keyPrefix` 匹配规范化的 Session 键；`match.rawKeyPrefix` 匹配包含 `agent:<id>:` 的原始键。

  </Accordion>
  <Accordion title="引用">
    `memory.citations` 适用于所有后端：

    | 值               | 行为                                                       |
    | ---------------- | ---------------------------------------------------------- |
    | `auto`（默认）   | 在代码片段中包含 `Source: <path#line>` 页脚               |
    | `on`             | 始终包含页脚                                               |
    | `off`            | 省略页脚（路径仍在内部传递给 Agent）                       |

  </Accordion>
</AccordionGroup>

QMD 启动刷新在 Gateway 启动期间使用一次性子进程路径。长期运行的 QMD 管理器在为交互式使用打开记忆搜索时仍然拥有常规文件监视器和间隔计时器。

### 完整 QMD 示例

```json5
{
  memory: {
    backend: "qmd",
    citations: "auto",
    qmd: {
      includeDefaultMemory: true,
      update: { interval: "5m", debounceMs: 15000 },
      limits: { maxResults: 6, timeoutMs: 4000 },
      scope: {
        default: "deny",
        rules: [{ action: "allow", match: { chatType: "direct" } }],
      },
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

---

## 梦境

梦境在 `plugins.entries.memory-core.config.dreaming` 下配置，而非 `agents.defaults.memorySearch`。

梦境作为一个计划扫描运行，使用内部轻度/深度/REM 阶段作为实现细节。

有关概念行为和斜杠命令，请参见[梦境](/concepts/dreaming)。

### 用户设置

| 键          | 类型      | 默认值       | 说明                                         |
| ----------- | --------- | ------------ | -------------------------------------------- |
| `enabled`   | `boolean` | `false`      | 整体启用或禁用梦境                           |
| `frequency` | `string`  | `0 3 * * *`  | 完整梦境扫描的可选 cron 节奏                 |
| `model`     | `string`  | 默认模型     | 可选的 Dream Diary 子 Agent 模型覆盖         |

### 示例

```json5
{
  plugins: {
    entries: {
      "memory-core": {
        subagent: {
          allowModelOverride: true,
          allowedModels: ["anthropic/claude-sonnet-4-6"],
        },
        config: {
          dreaming: {
            enabled: true,
            frequency: "0 3 * * *",
            model: "anthropic/claude-sonnet-4-6",
          },
        },
      },
    },
  },
}
```

<Note>
- 梦境将机器状态写入 `memory/.dreams/`。
- 梦境将人类可读的叙事输出写入 `DREAMS.md`（或现有的 `dreams.md`）。
- `dreaming.model` 使用现有的 Plugin 子 Agent 信任门控；在启用之前设置 `plugins.entries.memory-core.subagent.allowModelOverride: true`。
- 当配置的模型不可用时，Dream Diary 使用 Session 默认模型重试一次。信任或允许列表失败会被记录，不会静默重试。
- 轻度/深度/REM 阶段策略和阈值是内部行为，不是面向用户的配置。

</Note>

## 相关

- [配置参考](/gateway/configuration-reference)
- [记忆概述](/concepts/memory)
- [记忆搜索](/concepts/memory-search)
