---
title: "记忆 (Memory)"
sidebarTitle: "记忆"
mmh3_hash: "0d47cd20c177bff82ce81f897b7c1829"
summary: "OpenClaw memory 如何工作(workspace 文件 + 自动内存刷新)"
read_when: ["你想了解内存文件布局和工作流程","你想调整自动预 compaction 内存刷新"]
---
# 记忆 (Memory)

OpenClaw memory 是 **agent workspace 中的纯 Markdown**。文件是真相的来源;model 只"记住"写入磁盘的内容。

Memory search tools 由活动 memory plugin 提供(默认:`memory-core`)。使用 `plugins.slots.memory = "none"` 禁用 memory plugins。

## Memory 文件(Markdown)

默认 workspace 布局使用两个内存层:

- `memory/YYYY-MM-DD.md`
  - 每日日志(仅追加)。
  - 在 session 开始时读取今天 + 昨天。
- `MEMORY.md` (可选)
  - 精选的长期内存。
  - **仅在主要私有 session 中加载**(从不在 group contexts 中)。

这些文件位于 workspace 下(`agents.defaults.workspace`,默认 `~/.openclaw/workspace`)。参见 [Agent workspace](/zh/concepts/agent-workspace) 了解完整布局。

## 何时写入 memory

- 决策、偏好和持久事实进入 `MEMORY.md`。
- 日常注释和运行 context 进入 `memory/YYYY-MM-DD.md`。
- 如果有人说"记住这个",写下来(不要保存在 RAM 中)。
- 这个领域仍在发展。提醒 model 存储 memories 有帮助;它会知道该怎么做。
- 如果你想让某些东西坚持,**要求 bot 将其写入** memory。

## 自动 memory flush(预 compaction ping)

当 session **接近自动 compaction** 时,OpenClaw 触发 **静默的 agentic 回合**,提醒 model 在 context 被压缩 **之前** 写入持久 memory。默认 prompts 明确说 model *可以回复*,但通常 `NO_REPLY` 是正确的响应,因此用户永远不会看到这个回合。

这由 `agents.defaults.compaction.memoryFlush` 控制:

```json5
{
  agents: {
    defaults: {
      compaction: {
        reserveTokensFloor: 20000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 4000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store."
        }
      }
    }
  }
}
```

详细信息:
- **软阈值**: 当 session token 估计值超过 `contextWindow - reserveTokensFloor - softThresholdTokens` 时触发 flush。
- **默认静默**: prompts 包含 `NO_REPLY`,因此不会传递任何内容。
- **两个 prompts**: 用户 prompt 加上 system prompt 附加提醒。
- **每个 compaction 周期一次 flush**(在 `sessions.json` 中跟踪)。
- **Workspace 必须可写**: 如果 session 在沙盒中运行,并且 `workspaceAccess: "ro"` 或 `"none"`,则跳过 flush。

有关完整的 compaction 生命周期,请参见 [Session management + compaction](/zh/reference/session-management-compaction)。

## Vector memory search

OpenClaw 可以在 `MEMORY.md` 和 `memory/*.md`(加上你选择加入的任何额外目录或文件)上构建小型向量索引,以便语义查询即使在措辞不同时也能找到相关注释。

默认值:
- 默认启用。
- 监视 memory 文件的更改(去抖动)。
- 默认使用远程 embeddings。如果未设置 `memorySearch.provider`,OpenClaw 自动选择:
  1. `local` 如果配置了 `memorySearch.local.modelPath` 并且文件存在。
  2. `openai` 如果可以解析 OpenAI key。
  3. `gemini` 如果可以解析 Gemini key。
  4. 否则 memory search 保持禁用,直到配置。
- Local 模式使用 node-llama-cpp,可能需要 `pnpm approve-builds`。
- 使用 sqlite-vec(在可用时)在 SQLite 内加速向量搜索。

远程 embeddings **需要** embedding provider 的 API key。OpenClaw 从 auth profiles、`models.providers.*.apiKey` 或环境变量解析 keys。Codex OAuth 仅涵盖 chat/completions,**不** 满足 memory search 的 embeddings。对于 Gemini,使用 `GEMINI_API_KEY` 或 `models.providers.google.apiKey`。当使用自定义 OpenAI 兼容端点时,设置 `memorySearch.remote.apiKey`(和可选的 `memorySearch.remote.headers`)。

### 额外的 memory 路径

如果你想索引默认 workspace 布局之外的 Markdown 文件,添加显式路径:

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

注意:
- 路径可以是绝对的或 workspace 相对的。
- 目录递归扫描 `.md` 文件。
- 仅索引 Markdown 文件。
- 忽略 Symlinks(文件或目录)。

### Gemini embeddings (native)

将 provider 设置为 `gemini` 以直接使用 Gemini embeddings API:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-001",
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

注意:
- `remote.baseUrl` 是可选的(默认为 Gemini API 基础 URL)。
- `remote.headers` 允许你在需要时添加额外的 headers。
- 默认 model: `gemini-embedding-001`。

如果你想使用 **自定义 OpenAI 兼容端点**(OpenRouter、vLLM 或 proxy),你可以使用 OpenAI provider 的 `remote` 配置:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_OPENAI_COMPAT_API_KEY",
        headers: { "X-Custom-Header": "value" }
      }
    }
  }
}
```

如果你不想设置 API key,使用 `memorySearch.provider = "local"` 或设置 `memorySearch.fallback = "none"`。

后备:
- `memorySearch.fallback` 可以是 `openai`、`gemini`、`local` 或 `none`。
- 仅当主 embedding provider 失败时才使用后备 provider。

批量索引(OpenAI + Gemini):
- 默认为 OpenAI 和 Gemini embeddings 启用。设置 `agents.defaults.memorySearch.remote.batch.enabled = false` 以禁用。
- 默认行为等待批处理完成;如果需要,调整 `remote.batch.wait`、`remote.batch.pollIntervalMs` 和 `remote.batch.timeoutMinutes`。
- 设置 `remote.batch.concurrency` 以控制我们并行提交多少批处理作业(默认: 2)。
- 批处理模式适用于 `memorySearch.provider = "openai"` 或 `"gemini"` 并使用相应的 API key。
- Gemini 批处理作业使用异步 embeddings 批处理端点,需要 Gemini Batch API 可用性。

为什么 OpenAI batch 快 + 便宜:
- 对于大型回填,OpenAI 通常是我们支持的最快选项,因为我们可以在单个批处理作业中提交许多 embedding 请求,并让 OpenAI 异步处理它们。
- OpenAI 为 Batch API 工作负载提供折扣定价,因此大型索引运行通常比同步发送相同请求更便宜。
- 有关详细信息,请参见 OpenAI Batch API 文档和定价:
  - https://platform.openai.com/docs/api-reference/batch
  - https://platform.openai.com/pricing

配置示例:

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      fallback: "openai",
      remote: {
        batch: { enabled: true, concurrency: 2 }
      },
      sync: { watch: true }
    }
  }
}
```

Tools:
- `memory_search` — 返回带有文件 + 行范围的片段。
- `memory_get` — 通过路径读取 memory 文件内容。

Local 模式:
- 设置 `agents.defaults.memorySearch.provider = "local"`。
- 提供 `agents.defaults.memorySearch.local.modelPath` (GGUF 或 `hf:` URI)。
- 可选:设置 `agents.defaults.memorySearch.fallback = "none"` 以避免远程后备。

### Memory tools 如何工作

- `memory_search` 从 `MEMORY.md` + `memory/**/*.md` 语义搜索 Markdown chunks(~400 token 目标,80-token 重叠)。它返回片段文本(上限 ~700 字符)、文件路径、行范围、分数、provider/model 以及我们是否从 local → remote embeddings 后备。不返回完整的文件 payload。
- `memory_get` 读取特定的 memory Markdown 文件(workspace 相对),可选地从起始行开始并读取 N 行。仅当在 `memorySearch.extraPaths` 中明确列出时,才允许 `MEMORY.md` / `memory/` 之外的路径。
- 仅当 `memorySearch.enabled` 对 agent 解析为 true 时,两个 tools 才启用。

### 索引什么(以及何时)

- 文件类型:仅 Markdown(`MEMORY.md`、`memory/**/*.md`,加上 `memorySearch.extraPaths` 下的任何 `.md` 文件)。
- 索引存储:每个 agent 的 SQLite 位于 `~/.openclaw/memory/<agentId>.sqlite`(可通过 `agents.defaults.memorySearch.store.path` 配置,支持 `{agentId}` token)。
- 新鲜度:`MEMORY.md`、`memory/` 和 `memorySearch.extraPaths` 上的 watcher 标记索引为脏(去抖动 1.5s)。同步在 session 开始时、搜索时或在间隔上调度,并异步运行。Session transcripts 使用 delta 阈值触发后台同步。
- 重新索引触发器:索引存储 embedding **provider/model + 端点指纹 + chunking 参数**。如果其中任何一个更改,OpenClaw 会自动重置并重新索引整个 store。

### 混合搜索(BM25 + vector)

启用时,OpenClaw 结合:
- **Vector similarity**(语义匹配,措辞可以不同)
- **BM25 keyword relevance**(精确 tokens,如 IDs、env vars、代码符号)

如果你的平台上全文搜索不可用,OpenClaw 会退回到仅向量搜索。

#### 为什么混合?

Vector search 擅长"这意味着同样的事情":
- "Mac Studio gateway host" vs "运行 gateway 的机器"
- "debounce file updates" vs "避免在每次写入时索引"

但它在精确、高信号 tokens 上可能较弱:
- IDs(`a828e60`、`b3b9895a…`)
- 代码符号(`memorySearch.query.hybrid`)
- 错误字符串("sqlite-vec unavailable")

BM25(全文)相反:在精确 tokens 上很强,在释义上较弱。混合搜索是务实的中间地带:**使用两种检索信号**,以便你在"自然语言"查询和"大海捞针"查询上都能获得良好的结果。

#### 我们如何合并结果(当前设计)

实现草图:

1) 从两侧检索候选池:
- **Vector**: 按余弦相似度的前 `maxResults * candidateMultiplier`。
- **BM25**: 按 FTS5 BM25 排名(越低越好)的前 `maxResults * candidateMultiplier`。

2) 将 BM25 排名转换为 0..1-ish 分数:
- `textScore = 1 / (1 + max(0, bm25Rank))`

3) 通过 chunk id 联合候选并计算加权分数:
- `finalScore = vectorWeight * vectorScore + textWeight * textScore`

注意:
- `vectorWeight` + `textWeight` 在配置解析中归一化为 1.0,因此权重表现为百分比。
- 如果 embeddings 不可用(或 provider 返回零向量),我们仍运行 BM25 并返回关键字匹配。
- 如果无法创建 FTS5,我们保持仅向量搜索(无硬故障)。

这不是"IR 理论完美",但它简单、快速,并且倾向于改善真实注释的召回/精度。如果我们以后想变得更花哨,常见的下一步是 Reciprocal Rank Fusion (RRF) 或在混合之前进行分数归一化(min/max 或 z-score)。

配置:

```json5
agents: {
  defaults: {
    memorySearch: {
      query: {
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4
        }
      }
    }
  }
}
```

### Embedding cache

OpenClaw 可以在 SQLite 中缓存 **chunk embeddings**,以便重新索引和频繁更新(尤其是 session transcripts)不会重新嵌入未更改的文本。

配置:

```json5
agents: {
  defaults: {
    memorySearch: {
      cache: {
        enabled: true,
        maxEntries: 50000
      }
    }
  }
}
```

### Session memory search(实验性)

你可以选择性地索引 **session transcripts** 并通过 `memory_search` 显示它们。这受实验性 flag 控制。

```json5
agents: {
  defaults: {
    memorySearch: {
      experimental: { sessionMemory: true },
      sources: ["memory", "sessions"]
    }
  }
}
```

注意:
- Session 索引是 **选择加入**(默认关闭)。
- Session 更新被去抖动并在超过 delta 阈值后 **异步索引**(尽力而为)。
- `memory_search` 从不阻塞索引;结果在后台同步完成之前可能稍微陈旧。
- 结果仍仅包含片段;`memory_get` 仍限于 memory 文件。
- Session 索引按 agent 隔离(仅索引该 agent 的 session 日志)。
- Session 日志位于磁盘上(`~/.openclaw/agents/<agentId>/sessions/*.jsonl`)。任何具有文件系统访问权限的进程/用户都可以读取它们,因此将磁盘访问视为信任边界。为了更严格的隔离,在单独的 OS 用户或主机下运行 agents。

Delta 阈值(显示默认值):

```json5
agents: {
  defaults: {
    memorySearch: {
      sync: {
        sessions: {
          deltaBytes: 100000,   // ~100 KB
          deltaMessages: 50     // JSONL lines
        }
      }
    }
  }
}
```

### SQLite vector 加速(sqlite-vec)

当 sqlite-vec 扩展可用时,OpenClaw 将 embeddings 存储在 SQLite 虚拟表(`vec0`)中,并在数据库中执行向量距离查询。这使搜索保持快速,而无需将每个 embedding 加载到 JS 中。

配置(可选):

```json5
agents: {
  defaults: {
    memorySearch: {
      store: {
        vector: {
          enabled: true,
          extensionPath: "/path/to/sqlite-vec"
        }
      }
    }
  }
}
```

注意:
- `enabled` 默认为 true;禁用时,搜索退回到对存储的 embeddings 的进程内余弦相似度。
- 如果 sqlite-vec 扩展缺失或无法加载,OpenClaw 记录错误并继续使用 JS 后备(无向量表)。
- `extensionPath` 覆盖捆绑的 sqlite-vec 路径(对自定义构建或非标准安装位置有用)。

### Local embedding 自动下载

- 默认 local embedding model: `hf:ggml-org/embeddinggemma-300M-GGUF/embeddinggemma-300M-Q8_0.gguf` (~0.6 GB)。
- 当 `memorySearch.provider = "local"` 时,`node-llama-cpp` 解析 `modelPath`;如果 GGUF 缺失,它 **自动下载** 到缓存(或如果设置了 `local.modelCacheDir`),然后加载它。下载在重试时恢复。
- Native 构建要求:运行 `pnpm approve-builds`,选择 `node-llama-cpp`,然后 `pnpm rebuild node-llama-cpp`。
- 后备:如果 local 设置失败并且 `memorySearch.fallback = "openai"`,我们自动切换到远程 embeddings(`openai/text-embedding-3-small`,除非覆盖)并记录原因。

### 自定义 OpenAI 兼容端点示例

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "openai",
      model: "text-embedding-3-small",
      remote: {
        baseUrl: "https://api.example.com/v1/",
        apiKey: "YOUR_REMOTE_API_KEY",
        headers: {
          "X-Organization": "org-id",
          "X-Project": "project-id"
        }
      }
    }
  }
}
```

注意:
- `remote.*` 优先于 `models.providers.openai.*`。
- `remote.headers` 与 OpenAI headers 合并;remote 在键冲突时获胜。省略 `remote.headers` 以使用 OpenAI 默认值。
