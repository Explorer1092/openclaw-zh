---
mmh3_hash: "1812967938ddcb71bc04d35ce9bc1a9e"
title: "Memory"
summary: "OpenClaw memory 如何工作(workspace 文件 + 自动内存刷新)"
read_when:
  - 你想了解内存文件布局和工作流程
  - 你想调整自动预 compaction 内存刷新
---

# Memory

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

这些文件位于 workspace 下(`agents.defaults.workspace`,默认 `~/.openclaw/workspace`)。参见 [Agent workspace](/concepts/agent-workspace) 了解完整布局。

## Memory tools

OpenClaw 为这些 Markdown 文件提供两个面向 agent 的工具:

- `memory_search` — 对已索引片段进行语义召回。
- `memory_get` — 对特定 Markdown 文件/行范围进行目标读取。

当文件不存在时(例如,第一次写入之前的今天的每日日志),`memory_get` 现在会**优雅降级**。内置管理器和 QMD 后端都会返回 `{ text: "", path }` 而不是抛出 `ENOENT`,因此 agent 可以处理"尚无记录"的情况,而无需将工具调用包在 try/catch 逻辑中。

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

有关完整的 compaction 生命周期,请参见 [Session management + compaction](/reference/session-management-compaction)。

## Vector memory search

OpenClaw 可以在 `MEMORY.md` 和 `memory/*.md` 上构建小型向量索引,以便语义查询即使在措辞不同时也能找到相关注释。

默认值:

- 默认启用。
- 监视 memory 文件的更改(去抖动)。
- 在 `agents.defaults.memorySearch` 下配置 memory search(不是顶级 `memorySearch`)。
- 默认使用远程 embeddings。如果未设置 `memorySearch.provider`,OpenClaw 自动选择:
  1. `local` 如果配置了 `memorySearch.local.modelPath` 并且文件存在。
  2. `openai` 如果可以解析 OpenAI key。
  3. `gemini` 如果可以解析 Gemini key。
  4. `voyage` 如果可以解析 Voyage key。
  5. `mistral` 如果可以解析 Mistral key。
  6. 否则 memory search 保持禁用,直到配置。
- Local 模式使用 node-llama-cpp,可能需要 `pnpm approve-builds`。
- 使用 sqlite-vec(在可用时)在 SQLite 内加速向量搜索。

远程 embeddings **需要** embedding provider 的 API key。OpenClaw 从 auth profiles、`models.providers.*.apiKey` 或环境变量解析 keys。Codex OAuth 仅涵盖 chat/completions,**不** 满足 memory search 的 embeddings。对于 Gemini,使用 `GEMINI_API_KEY` 或 `models.providers.google.apiKey`。对于 Voyage,使用 `VOYAGE_API_KEY` 或 `models.providers.voyage.apiKey`。对于 Mistral,使用 `MISTRAL_API_KEY` 或 `models.providers.mistral.apiKey`。Ollama 通常不需要真实 API key(当本地策略需要时,像 `OLLAMA_API_KEY=ollama-local` 这样的占位符就足够了)。
当使用自定义 OpenAI 兼容端点时,设置 `memorySearch.remote.apiKey`(和可选的 `memorySearch.remote.headers`)。

### QMD 后端(实验性)

设置 `memory.backend = "qmd"` 以将内置 SQLite 索引器替换为 [QMD](https://github.com/tobi/qmd):一个本地优先的搜索 sidecar,结合了 BM25 + 向量 + 重新排序。Markdown 仍然是事实的来源;OpenClaw 调用 QMD 进行检索。关键点:

**前提条件**

- 默认禁用。通过配置选择加入(`memory.backend = "qmd"`)。
- 单独安装 QMD CLI(`bun install -g https://github.com/tobi/qmd` 或获取发行版)并确保 `qmd` 二进制文件在 gateway 的 `PATH` 上。
- QMD 需要允许扩展的 SQLite 构建(macOS 上使用 `brew install sqlite`)。
- QMD 通过 Bun + `node-llama-cpp` 完全在本地运行,并在首次使用时从 HuggingFace 自动下载 GGUF 模型(不需要单独的 Ollama 守护进程)。
- Gateway 在 `~/.openclaw/agents/<agentId>/qmd/` 下运行 QMD 的自包含 XDG home,通过设置 `XDG_CONFIG_HOME` 和 `XDG_CACHE_HOME`。
- 操作系统支持:一旦安装了 Bun + SQLite,macOS 和 Linux 可以直接工作。Windows 最好通过 WSL2 支持。

**Sidecar 如何运行**

- Gateway 在 `~/.openclaw/agents/<agentId>/qmd/` 下写入自包含的 QMD home(config + cache + sqlite DB)。
- 从 `memory.qmd.paths`(加上默认 workspace memory 文件)通过 `qmd collection add` 创建 collections,然后 `qmd update` + `qmd embed` 在启动时和可配置间隔(`memory.qmd.update.interval`,默认 5 分钟)运行。
- Gateway 现在在启动时初始化 QMD 管理器,因此即使在第一次 `memory_search` 调用之前也会激活定期更新定时器。
- Boot 刷新现在默认在后台运行,因此聊天启动不会被阻塞;设置 `memory.qmd.update.waitForBootSync = true` 以保留之前的阻塞行为。
- 搜索通过 `memory.qmd.searchMode` 运行(默认 `qmd search --json`;还支持 `vsearch` 和 `query`)。如果所选模式在您的 QMD 构建中拒绝标志,OpenClaw 会使用 `qmd query` 重试。如果 QMD 失败或二进制文件丢失,OpenClaw 会自动回退到内置 SQLite 管理器,以便 memory tools 继续工作。
- **第一次搜索可能很慢**:QMD 可能在第一次 `qmd query` 运行时下载本地 GGUF 模型(重排序/查询扩展)。
  - OpenClaw 在运行 QMD 时会自动设置 `XDG_CONFIG_HOME`/`XDG_CACHE_HOME`。
  - 如果你想手动预下载模型(并预热 OpenClaw 使用的同一索引),可以使用 agent 的 XDG 目录运行一次性查询。

    OpenClaw 的 QMD 状态位于你的**状态目录**下(默认为 `~/.openclaw`)。你可以通过导出 OpenClaw 使用的相同 XDG 变量,让 `qmd` 指向完全相同的索引:

    ```bash
    # 选择 OpenClaw 使用的同一状态目录
    STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"

    export XDG_CONFIG_HOME="$STATE_DIR/agents/main/qmd/xdg-config"
    export XDG_CACHE_HOME="$STATE_DIR/agents/main/qmd/xdg-cache"

    # (可选)强制刷新索引 + embeddings
    qmd update
    qmd embed

    # 预热/触发首次模型下载
    qmd query "test" -c memory-root --json >/dev/null 2>&1
    ```

**配置界面(`memory.qmd.*`)**

- `command`(默认 `qmd`):覆盖可执行路径。
- `searchMode`(默认 `search`):选择哪个 QMD 命令支持 `memory_search`(`search`、`vsearch`、`query`)。
- `includeDefaultMemory`(默认 `true`):自动索引 `MEMORY.md` + `memory/**/*.md`。
- `paths[]`:添加额外的目录/文件(`path`、可选 `pattern`、可选稳定 `name`)。
- `sessions`:选择加入 session JSONL 索引(`enabled`、`retentionDays`、`exportDir`)。
- `update`:控制刷新节奏和维护执行:(`interval`、`debounceMs`、`onBoot`、`waitForBootSync`、`embedInterval`、`commandTimeoutMs`、`updateTimeoutMs`、`embedTimeoutMs`)。
- `limits`:限制召回 payload(`maxResults`、`maxSnippetChars`、`maxInjectedChars`、`timeoutMs`)。
- `scope`:与 [`session.sendPolicy`](/gateway/configuration#session) 相同的 schema。默认仅 DM(`deny` 所有,`allow` 直接聊天);放宽以在群组/channel 中显示 QMD 结果。
  - `match.keyPrefix` 匹配 **规范化的** session key(小写,去除任何开头的 `agent:<id>:`)。示例:`discord:channel:`。
  - `match.rawKeyPrefix` 匹配 **原始** session key(小写),包含 `agent:<id>:`。示例:`agent:main:discord:`。
  - 遗留:`match.keyPrefix: "agent:..."` 仍被视为原始 key 前缀,但为了清晰起见,优先使用 `rawKeyPrefix`。
- 当 `scope` 拒绝搜索时,OpenClaw 记录一个带有派生 `channel`/`chatType` 的警告,以便更容易调试空结果。
- 来自 workspace 之外的片段在 `memory_search` 结果中显示为 `qmd/<collection>/<relative-path>`;`memory_get` 理解该前缀并从配置的 QMD collection root 读取。
- 当 `memory.qmd.sessions.enabled = true` 时,OpenClaw 将经过清理的 session 记录(User/Assistant 轮)导出到 `~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD collection 中,以便 `memory_search` 可以召回最近的对话,而无需触及内置 SQLite 索引。
- 当 `memory.citations` 为 `auto`/`on` 时,`memory_search` 片段现在包含 `Source: <path#line>` 页脚;设置 `memory.citations = "off"` 以将路径元数据保持为内部(agent 仍接收路径用于 `memory_get`,但片段文本省略页脚,system prompt 警告 agent 不要引用它)。

**示例**

```json5
memory: {
  backend: "qmd",
  citations: "auto",
  qmd: {
    includeDefaultMemory: true,
    update: { interval: "5m", debounceMs: 15000 },
    limits: { maxResults: 6, timeoutMs: 4000 },
    scope: {
      default: "deny",
      rules: [
        { action: "allow", match: { chatType: "direct" } },
        // 规范化 session-key 前缀(去除 `agent:<id>:`)。
        { action: "deny", match: { keyPrefix: "discord:channel:" } },
        // 原始 session-key 前缀(包含 `agent:<id>:`)。
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ]
    },
    paths: [
      { name: "docs", path: "~/notes", pattern: "**/*.md" }
    ]
  }
}
```

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
- `memorySearch.fallback` 可以是 `openai`、`gemini`、`voyage`、`mistral`、`ollama`、`local` 或 `none`。
- 仅当主 embedding provider 失败时才使用后备 provider。

批量索引(OpenAI + Gemini + Voyage):
- 默认禁用。设置 `agents.defaults.memorySearch.remote.batch.enabled = true` 以启用用于大语料库索引(OpenAI、Gemini 和 Voyage)。
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
- `memory_get` 读取特定的 memory Markdown 文件(workspace 相对),可选地从起始行开始并读取 N 行。`MEMORY.md` / `memory/` 之外的路径将被拒绝。
- 仅当 `memorySearch.enabled` 对 agent 解析为 true 时,两个 tools 才启用。

### 索引什么(以及何时)

- 文件类型:仅 Markdown(`MEMORY.md`、`memory/**/*.md`)。
- 索引存储:每个 agent 的 SQLite 位于 `~/.openclaw/memory/<agentId>.sqlite`(可通过 `agents.defaults.memorySearch.store.path` 配置,支持 `{agentId}` token)。
- 新鲜度:`MEMORY.md` + `memory/` 上的 watcher 标记索引为脏(去抖动 1.5s)。同步在 session 开始时、搜索时或在间隔上调度,并异步运行。Session transcripts 使用 delta 阈值触发后台同步。
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

#### 后处理管道

合并向量和关键字分数后,两个可选的后处理阶段会在结果到达 agent 之前对结果列表进行精细化:

```
向量 + 关键字 → 加权合并 → 时间衰减 → 排序 → MMR → 前 K 个结果
```

两个阶段**默认关闭**,可以独立启用。

#### MMR 重排序(多样性)

当混合搜索返回结果时,多个 chunks 可能包含相似或重叠的内容。

**MMR(最大边际相关性)**重新排序结果以平衡相关性与多样性,确保顶部结果涵盖查询的不同方面,而不是重复相同的信息。

工作原理:
1. 结果按其原始相关性评分(向量 + BM25 加权分数)。
2. MMR 迭代选择最大化以下值的结果:`λ × 相关性 − (1−λ) × 与已选择的最大相似度`。
3. 结果之间的相似度使用标记化内容的 Jaccard 文本相似度来衡量。

`lambda` 参数控制权衡:
- `lambda = 1.0` → 纯相关性(无多样性惩罚)
- `lambda = 0.0` → 最大多样性(忽略相关性)
- 默认:`0.7`(平衡,略微偏重相关性)

#### 时间衰减(近期增强)

每日记录随时间积累数百个有日期的文件。**时间衰减**根据每个结果的年龄对分数应用指数乘数,使近期记忆自然排名更高,而旧记忆逐渐淡出。

**长青文件永远不会衰减:**
- `MEMORY.md`(根 memory 文件)
- `memory/` 中的非日期文件(例如 `memory/projects.md`、`memory/network.md`)

默认半衰期 30 天时:
- 今天的记录:**100%** 原始分数
- 7 天前:**~84%**
- 30 天前:**50%**
- 90 天前:**12.5%**

#### 配置

两个功能都在 `memorySearch.query.hybrid` 下配置:

```json5
agents: {
  defaults: {
    memorySearch: {
      query: {
        hybrid: {
          enabled: true,
          vectorWeight: 0.7,
          textWeight: 0.3,
          candidateMultiplier: 4,
          // 多样性:减少冗余结果
          mmr: {
            enabled: true,    // 默认: false
            lambda: 0.7       // 0 = 最大多样性, 1 = 最大相关性
          },
          // 近期性:提升较新的记忆
          temporalDecay: {
            enabled: true,    // 默认: false
            halfLifeDays: 30  // 每 30 天分数减半
          }
        }
      }
    }
  }
}
```

您可以独立启用任一功能:
- **仅 MMR** — 当您有许多相似记录但年龄不重要时有用。
- **仅时间衰减** — 当近期性很重要但您的结果已经多样化时有用。
- **两者都启用** — 推荐用于具有大量长期运行每日记录历史的 agent。

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

- 默认 local embedding model: `hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf` (~0.6 GB)。
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
