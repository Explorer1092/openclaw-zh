---
mmh3_hash: "6843c8e314704ea525b511b6b82ac345"
title: "记忆配置参考"
summary: "OpenClaw 记忆搜索、嵌入 Provider、QMD 后端、混合搜索和多模态记忆的完整配置参考"
read_when:
  - 您想配置记忆搜索 Provider 或嵌入模型
  - 您想设置 QMD 后端
  - 您想调整混合搜索、MMR 或时间衰减
  - 您想启用多模态记忆索引
---

# 记忆配置参考

本页涵盖 OpenClaw 记忆搜索的完整配置界面。有关概念概述（文件布局、记忆工具、何时写入记忆以及自动刷新），请参见[记忆](/concepts/memory)。

## 记忆搜索默认值

- 默认启用。
- 监视记忆文件的变更（防抖）。
- 在 `agents.defaults.memorySearch` 下配置记忆搜索（不是顶级 `memorySearch`）。
- 默认使用远程嵌入。如果未设置 `memorySearch.provider`，OpenClaw 会自动选择：
  1. `local`（如果配置了 `memorySearch.local.modelPath` 且文件存在）。
  2. `openai`（如果可以解析 OpenAI 密钥）。
  3. `gemini`（如果可以解析 Gemini 密钥）。
  4. `voyage`（如果可以解析 Voyage 密钥）。
  5. `mistral`（如果可以解析 Mistral 密钥）。
  6. 否则记忆搜索保持禁用状态，直到配置完毕。
- 本地模式使用 node-llama-cpp，可能需要 `pnpm approve-builds`。
- 使用 sqlite-vec（如果可用）加速 SQLite 内的向量搜索。
- `memorySearch.provider = "ollama"` 也支持本地/自托管 Ollama 嵌入（`/api/embeddings`），但不会自动选择。

远程嵌入**需要**嵌入 Provider 的 API 密钥。OpenClaw 从 auth profiles、`models.providers.*.apiKey` 或环境变量解析密钥。Codex OAuth 仅涵盖 chat/completions，**不**满足记忆搜索的嵌入要求。对于 Gemini，使用 `GEMINI_API_KEY` 或 `models.providers.google.apiKey`。对于 Voyage，使用 `VOYAGE_API_KEY` 或 `models.providers.voyage.apiKey`。对于 Mistral，使用 `MISTRAL_API_KEY` 或 `models.providers.mistral.apiKey`。Ollama 通常不需要真实的 API 密钥（需要本地策略时，类似 `OLLAMA_API_KEY=ollama-local` 的占位符就足够了）。使用自定义 OpenAI 兼容端点时，设置 `memorySearch.remote.apiKey`（以及可选的 `memorySearch.remote.headers`）。

## QMD 后端（实验性）

设置 `memory.backend = "qmd"` 将内置 SQLite 索引器替换为 [QMD](https://github.com/tobi/qmd)：一个将 BM25 + 向量 + 重排序结合的本地优先搜索辅助程序。Markdown 保持为真实来源；OpenClaw 调用 QMD 进行检索。关键点：

### 先决条件

- 默认禁用。按配置选择加入（`memory.backend = "qmd"`）。
- 单独安装 QMD CLI（`bun install -g https://github.com/tobi/qmd` 或获取版本），并确保 `qmd` 二进制文件在 Gateway 的 `PATH` 中。
- QMD 需要允许扩展的 SQLite 构建（macOS 上使用 `brew install sqlite`）。
- QMD 通过 Bun + `node-llama-cpp` 完全本地运行，并在首次使用时从 HuggingFace 自动下载 GGUF 模型（不需要单独的 Ollama 守护进程）。
- Gateway 在 `~/.openclaw/agents/<agentId>/qmd/` 下运行 QMD 于自包含的 XDG 主目录，通过设置 `XDG_CONFIG_HOME` 和 `XDG_CACHE_HOME`。
- 操作系统支持：安装 Bun + SQLite 后，macOS 和 Linux 开箱即用。Windows 最好通过 WSL2 支持。

### 辅助程序如何运行

- Gateway 在 `~/.openclaw/agents/<agentId>/qmd/`（配置 + 缓存 + sqlite DB）下写入自包含的 QMD 主目录。
- 从 `memory.qmd.paths`（加上默认工作区记忆文件）通过 `qmd collection add` 创建集合，然后在启动时和可配置间隔（`memory.qmd.update.interval`，默认 5 分钟）运行 `qmd update` + `qmd embed`。
- Gateway 现在在启动时初始化 QMD 管理器，因此即使在第一次 `memory_search` 调用之前，定期更新计时器也已启动。
- 启动刷新现在默认在后台运行，以免阻塞聊天启动；设置 `memory.qmd.update.waitForBootSync = true` 保持之前的阻塞行为。
- 搜索通过 `memory.qmd.searchMode` 运行（默认 `qmd search --json`；也支持 `vsearch` 和 `query`）。如果所选模式在您的 QMD 构建上拒绝标志，OpenClaw 会重试 `qmd query`。如果 QMD 失败或二进制文件缺失，OpenClaw 自动回退到内置 SQLite 管理器，以保持记忆工具正常工作。
- OpenClaw 目前不公开 QMD 嵌入批量大小调整；批量行为由 QMD 本身控制。
- **首次搜索可能较慢**：QMD 可能在第一次 `qmd query` 运行时下载本地 GGUF 模型（重排序器/查询扩展）。
  - OpenClaw 在运行 QMD 时自动设置 `XDG_CONFIG_HOME`/`XDG_CACHE_HOME`。
  - 如果您想手动预下载模型（并预热 OpenClaw 使用的同一索引），请使用 Agent 的 XDG 目录运行一次性查询。

    OpenClaw 的 QMD 状态存储在您的**状态目录**下（默认为 `~/.openclaw`）。您可以通过导出 OpenClaw 使用的相同 XDG 变量，将 `qmd` 指向完全相同的索引：

    ```bash
    # 使用 OpenClaw 使用的相同状态目录
    STATE_DIR="${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"

    export XDG_CONFIG_HOME="$STATE_DIR/agents/main/qmd/xdg-config"
    export XDG_CACHE_HOME="$STATE_DIR/agents/main/qmd/xdg-cache"

    # （可选）强制索引刷新 + 嵌入
    qmd update
    qmd embed

    # 预热 / 触发首次模型下载
    qmd query "test" -c memory-root --json >/dev/null 2>&1
    ```

### 配置界面（`memory.qmd.*`）

- `command`（默认 `qmd`）：覆盖可执行文件路径。
- `searchMode`（默认 `search`）：选择哪个 QMD 命令支持 `memory_search`（`search`、`vsearch`、`query`）。
- `includeDefaultMemory`（默认 `true`）：自动索引 `MEMORY.md` + `memory/**/*.md`。
- `paths[]`：添加额外的目录/文件（`path`、可选 `pattern`、可选稳定 `name`）。
- `sessions`：选择加入 session JSONL 索引（`enabled`、`retentionDays`、`exportDir`）。
- `update`：控制刷新节奏和维护执行：（`interval`、`debounceMs`、`onBoot`、`waitForBootSync`、`embedInterval`、`commandTimeoutMs`、`updateTimeoutMs`、`embedTimeoutMs`）。
- `limits`：限制召回负载（`maxResults`、`maxSnippetChars`、`maxInjectedChars`、`timeoutMs`）。
- `scope`：与 [`session.sendPolicy`](/gateway/configuration-reference#session) 相同的架构。默认仅 DM（`deny` 全部，`allow` 直接聊天）；放宽以在群组/频道中显示 QMD 命中。
  - `match.keyPrefix` 匹配**规范化**的会话键（小写，去掉任何前导 `agent:<id>:`）。示例：`discord:channel:`。
  - `match.rawKeyPrefix` 匹配**原始**会话键（小写），包括 `agent:<id>:`。示例：`agent:main:discord:`。
  - 旧版：`match.keyPrefix: "agent:..."` 仍被视为原始键前缀，但为了清晰起见，请优先使用 `rawKeyPrefix`。
- 当 `scope` 拒绝搜索时，OpenClaw 记录带有派生 `channel`/`chatType` 的警告，使空结果更容易调试。
- 从工作区外部获取的代码片段在 `memory_search` 结果中显示为 `qmd/<collection>/<relative-path>`；`memory_get` 理解该前缀并从配置的 QMD 集合根目录读取。
- 当 `memory.qmd.sessions.enabled = true` 时，OpenClaw 将清理后的 session 转录（用户/助手轮次）导出到 `~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD 集合，以便 `memory_search` 可以召回最近的对话，而不涉及内置 SQLite 索引。
- 当 `memory.citations` 为 `auto`/`on` 时，`memory_search` 代码片段现在包含 `Source: <path#line>` 页脚；设置 `memory.citations = "off"` 将路径元数据保持内部（Agent 仍然接收路径用于 `memory_get`，但代码片段文本省略页脚，系统提示警告 Agent 不要引用它）。

### QMD 示例

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
        // 规范化会话键前缀（去掉 `agent:<id>:`）。
        { action: "deny", match: { keyPrefix: "discord:channel:" } },
        // 原始会话键前缀（包括 `agent:<id>:`）。
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ]
    },
    paths: [
      { name: "docs", path: "~/notes", pattern: "**/*.md" }
    ]
  }
}
```

### 引用和回退

- `memory.citations` 无论后端如何都适用（`auto`/`on`/`off`）。
- 当 `qmd` 运行时，我们标记 `status().backend = "qmd"`，以便诊断显示哪个引擎提供了结果。如果 QMD 子进程退出或 JSON 输出无法解析，搜索管理器记录警告并返回内置 Provider（现有 Markdown 嵌入），直到 QMD 恢复。

## 额外记忆路径

如果您想索引默认工作区布局之外的 Markdown 文件，请添加显式路径：

```json5
agents: {
  defaults: {
    memorySearch: {
      extraPaths: ["../team-docs", "/srv/shared-notes/overview.md"]
    }
  }
}
```

注意事项：

- 路径可以是绝对路径或相对于工作区的路径。
- 目录会递归扫描 `.md` 文件。
- 默认情况下，仅索引 Markdown 文件。
- 如果 `memorySearch.multimodal.enabled = true`，OpenClaw 还会索引仅在 `extraPaths` 下的支持的图像/音频文件。默认记忆根目录（`MEMORY.md`、`memory.md`、`memory/**/*.md`）仅保留 Markdown。
- 忽略符号链接（文件或目录）。

## 多模态记忆文件（Gemini 图像 + 音频）

使用 Gemini embedding 2 时，OpenClaw 可以从 `memorySearch.extraPaths` 索引图像和音频文件：

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-2-preview",
      extraPaths: ["assets/reference", "voice-notes"],
      multimodal: {
        enabled: true,
        modalities: ["image", "audio"], // 或 ["all"]
        maxFileBytes: 10000000
      },
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

注意事项：

- 多模态记忆目前仅支持 `gemini-embedding-2-preview`。
- 多模态索引仅适用于通过 `memorySearch.extraPaths` 发现的文件。
- 此阶段支持的模态：图像和音频。
- 启用多模态记忆时，`memorySearch.fallback` 必须保持为 `"none"`。
- 匹配的图像/音频文件字节在索引期间上传到配置的 Gemini 嵌入端点。
- 支持的图像扩展名：`.jpg`、`.jpeg`、`.png`、`.webp`、`.gif`、`.heic`、`.heif`。
- 支持的音频扩展名：`.mp3`、`.wav`、`.ogg`、`.opus`、`.m4a`、`.aac`、`.flac`。
- 搜索查询仍然是文本，但 Gemini 可以将这些文本查询与索引的图像/音频嵌入进行比较。
- `memory_get` 仍然只读取 Markdown；二进制文件可搜索但不作为原始文件内容返回。

## Gemini 嵌入（原生）

将 Provider 设置为 `gemini` 以直接使用 Gemini 嵌入 API：

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

注意事项：

- `remote.baseUrl` 是可选的（默认为 Gemini API base URL）。
- `remote.headers` 允许您在需要时添加额外的标头。
- 默认模型：`gemini-embedding-001`。
- `gemini-embedding-2-preview` 也受支持：8192 令牌限制和可配置维度（768 / 1536 / 3072，默认 3072）。

### Gemini Embedding 2（预览版）

```json5
agents: {
  defaults: {
    memorySearch: {
      provider: "gemini",
      model: "gemini-embedding-2-preview",
      outputDimensionality: 3072,  // 可选：768、1536 或 3072（默认）
      remote: {
        apiKey: "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

> **需要重新索引：** 从 `gemini-embedding-001`（768 维）切换到 `gemini-embedding-2-preview`（3072 维）会改变向量大小。如果您在 768、1536 和 3072 之间更改 `outputDimensionality`，情况也是如此。OpenClaw 在检测到模型或维度变更时会自动重新索引。

## 自定义 OpenAI 兼容端点

如果您想使用自定义 OpenAI 兼容端点（OpenRouter、vLLM 或代理），可以使用 `remote` 配置与 OpenAI Provider：

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

如果您不想设置 API 密钥，请使用 `memorySearch.provider = "local"` 或设置 `memorySearch.fallback = "none"`。

### 回退

- `memorySearch.fallback` 可以是 `openai`、`gemini`、`voyage`、`mistral`、`ollama`、`local` 或 `none`。
- 仅在主要嵌入 Provider 失败时使用回退 Provider。

### 批量索引（OpenAI + Gemini + Voyage）

- 默认禁用。设置 `agents.defaults.memorySearch.remote.batch.enabled = true` 以启用大型语料库索引（OpenAI、Gemini 和 Voyage）。
- 默认行为等待批量完成；如果需要，调整 `remote.batch.wait`、`remote.batch.pollIntervalMs` 和 `remote.batch.timeoutMinutes`。
- 设置 `remote.batch.concurrency` 以控制并行提交多少批量作业（默认：2）。
- 当 `memorySearch.provider = "openai"` 或 `"gemini"` 时应用批量模式，并使用相应的 API 密钥。
- Gemini 批量作业使用异步嵌入批量端点，需要 Gemini Batch API 可用性。

为什么 OpenAI 批量快速且便宜：

- 对于大型回填，OpenAI 通常是我们支持的最快选项，因为我们可以在单个批量作业中提交许多嵌入请求，让 OpenAI 异步处理它们。
- OpenAI 为批量 API 工作负载提供折扣定价，因此大型索引运行通常比同步发送相同请求更便宜。
- 有关详情，请参见 OpenAI 批量 API 文档和定价：
  - [https://platform.openai.com/docs/api-reference/batch](https://platform.openai.com/docs/api-reference/batch)
  - [https://platform.openai.com/pricing](https://platform.openai.com/pricing)

配置示例：

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

## 记忆工具的工作原理

- `memory_search` 从 `MEMORY.md` + `memory/**/*.md` 语义搜索 Markdown 块（目标约 400 令牌，80 令牌重叠）。返回代码片段文本（上限约 700 字符）、文件路径、行范围、分数、Provider/模型以及是否从本地回退到远程嵌入。不返回完整文件内容。
- `memory_get` 读取特定的记忆 Markdown 文件（相对于工作区），可选从起始行开始读取 N 行。`MEMORY.md` / `memory/` 之外的路径会被拒绝。
- 仅当 `memorySearch.enabled` 对 Agent 解析为 true 时，两个工具才启用。

## 索引什么（以及何时）

- 文件类型：仅 Markdown（`MEMORY.md`、`memory/**/*.md`）。
- 索引存储：每个 Agent 的 SQLite 在 `~/.openclaw/memory/<agentId>.sqlite`（可通过 `agents.defaults.memorySearch.store.path` 配置，支持 `{agentId}` 令牌）。
- 新鲜度：`MEMORY.md` + `memory/` 上的监视器将索引标记为脏（防抖 1.5 秒）。同步在会话开始时、搜索时或按间隔调度，并异步运行。Session 转录使用增量阈值触发后台同步。
- 重新索引触发器：索引存储嵌入 **Provider/模型 + 端点指纹 + 分块参数**。如果其中任何一个发生变化，OpenClaw 自动重置并重新索引整个存储。

## 混合搜索（BM25 + 向量）

启用后，OpenClaw 结合：

- **向量相似度**（语义匹配，措辞可以不同）
- **BM25 关键词相关性**（精确令牌，如 ID、环境变量、代码符号）

如果您的平台上全文搜索不可用，OpenClaw 会回退到仅向量搜索。

### 为什么使用混合

向量搜索擅长"这意思相同"：

- "Mac Studio gateway host" vs "the machine running the gateway"
- "debounce file updates" vs "avoid indexing on every write"

但对于精确的高信号令牌可能较弱：

- ID（`a828e60`、`b3b9895a...`）
- 代码符号（`memorySearch.query.hybrid`）
- 错误字符串（"sqlite-vec unavailable"）

BM25（全文）相反：对精确令牌强，对释义较弱。混合搜索是务实的中间地带：**同时使用两种检索信号**，以便对"自然语言"查询和"大海捞针"查询都能获得好结果。

### 如何合并结果（当前设计）

实现概述：

1. 从双方检索候选池：

- **向量**：按余弦相似度排名前 `maxResults * candidateMultiplier`。
- **BM25**：按 FTS5 BM25 排名（越低越好）排名前 `maxResults * candidateMultiplier`。

2. 将 BM25 排名转换为 0..1 左右的分数：

- `textScore = 1 / (1 + max(0, bm25Rank))`

3. 按块 id 联合候选并计算加权分数：

- `finalScore = vectorWeight * vectorScore + textWeight * textScore`

注意事项：

- `vectorWeight` + `textWeight` 在配置解析中归一化为 1.0，因此权重表现为百分比。
- 如果嵌入不可用（或 Provider 返回零向量），我们仍然运行 BM25 并返回关键词匹配。
- 如果无法创建 FTS5，我们保持仅向量搜索（不硬失败）。

### 后处理流程

合并向量和关键词分数后，两个可选的后处理阶段在结果到达 Agent 之前细化结果列表：

```
向量 + 关键词 -> 加权合并 -> 时间衰减 -> 排序 -> MMR -> 前 K 个结果
```

两个阶段**默认关闭**，可以独立启用。

### MMR 重排序（多样性）

当混合搜索返回结果时，多个块可能包含相似或重叠的内容。例如，搜索"home network setup"可能从不同的每日笔记中返回五个几乎相同的片段，这些笔记都提到相同的路由器配置。

**MMR（最大边际相关性）**重排结果以平衡相关性和多样性，确保顶部结果覆盖查询的不同方面，而不是重复相同的信息。

工作原理：

1. 结果按其原始相关性（向量 + BM25 加权分数）评分。
2. MMR 迭代选择最大化以下值的结果：`lambda x 相关性 - (1-lambda) x 与已选择的最大相似度`。
3. 结果之间的相似度使用标记化内容上的 Jaccard 文本相似度测量。

`lambda` 参数控制权衡：

- `lambda = 1.0` -- 纯相关性（无多样性惩罚）
- `lambda = 0.0` -- 最大多样性（忽略相关性）
- 默认：`0.7`（均衡，轻微相关性偏差）

**示例 -- 查询："home network setup"**

给定这些记忆文件：

```
memory/2026-02-10.md  -> "Configured Omada router, set VLAN 10 for IoT devices"
memory/2026-02-08.md  -> "Configured Omada router, moved IoT to VLAN 10"
memory/2026-02-05.md  -> "Set up AdGuard DNS on 192.168.10.2"
memory/network.md     -> "Router: Omada ER605, AdGuard: 192.168.10.2, VLAN 10: IoT"
```

不使用 MMR -- 前 3 个结果：

```
1. memory/2026-02-10.md  (分数: 0.92)  <- 路由器 + VLAN
2. memory/2026-02-08.md  (分数: 0.89)  <- 路由器 + VLAN（几乎重复！）
3. memory/network.md     (分数: 0.85)  <- 参考文档
```

使用 MMR（lambda=0.7）-- 前 3 个结果：

```
1. memory/2026-02-10.md  (分数: 0.92)  <- 路由器 + VLAN
2. memory/network.md     (分数: 0.85)  <- 参考文档（多样！）
3. memory/2026-02-05.md  (分数: 0.78)  <- AdGuard DNS（多样！）
```

2 月 8 日的几乎重复结果被删除，Agent 获得三条不同的信息。

**何时启用：** 如果您注意到 `memory_search` 返回冗余或几乎重复的片段，特别是每日笔记经常在不同天重复类似信息时。

### 时间衰减（新近度提升）

每天记笔记的 Agent 随时间积累数百个带日期的文件。没有衰减，六个月前措辞良好的笔记可能在同一主题上超过昨天的更新排名。

**时间衰减**根据每个结果的年龄对分数应用指数乘数，使最近的记忆自然排名更高，而旧的记忆逐渐消退：

```
decayedScore = score x e^(-lambda x ageInDays)
```

其中 `lambda = ln(2) / halfLifeDays`。

使用默认半衰期 30 天：

- 今天的笔记：原始分数的 **100%**
- 7 天前：**约 84%**
- 30 天前：**50%**
- 90 天前：**12.5%**
- 180 天前：**约 1.6%**

**常青文件从不衰减：**

- `MEMORY.md`（根记忆文件）
- `memory/` 中非带日期的文件（例如，`memory/projects.md`、`memory/network.md`）
- 这些包含持久参考信息，应始终正常排名。

**带日期的每日文件**（`memory/YYYY-MM-DD.md`）使用从文件名提取的日期。其他来源（例如，session 转录）回退到文件修改时间（`mtime`）。

**示例 -- 查询："what's Rod's work schedule?"**

给定这些记忆文件（今天是 2 月 10 日）：

```
memory/2025-09-15.md  -> "Rod works Mon-Fri, standup at 10am, pairing at 2pm"  (148 天前)
memory/2026-02-10.md  -> "Rod has standup at 14:15, 1:1 with Zeb at 14:45"    (今天)
memory/2026-02-03.md  -> "Rod started new team, standup moved to 14:15"        (7 天前)
```

不使用衰减：

```
1. memory/2025-09-15.md  (分数: 0.91)  <- 最佳语义匹配，但已过时！
2. memory/2026-02-10.md  (分数: 0.82)
3. memory/2026-02-03.md  (分数: 0.80)
```

使用衰减（halfLife=30）：

```
1. memory/2026-02-10.md  (分数: 0.82 x 1.00 = 0.82)  <- 今天，无衰减
2. memory/2026-02-03.md  (分数: 0.80 x 0.85 = 0.68)  <- 7 天，轻微衰减
3. memory/2025-09-15.md  (分数: 0.91 x 0.03 = 0.03)  <- 148 天，几乎消失
```

尽管 9 月份的笔记具有最佳的原始语义匹配，但它降至底部。

**何时启用：** 如果您的 Agent 有数月的每日笔记，并且您发现旧的、过时的信息超过最近的上下文排名。30 天的半衰期适用于日记密集型工作流程；如果您经常参考较旧的笔记，请增加（例如 90 天）。

### 混合搜索配置

两个功能在 `memorySearch.query.hybrid` 下配置：

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
          // 多样性：减少冗余结果
          mmr: {
            enabled: true,    // 默认：false
            lambda: 0.7       // 0 = 最大多样性，1 = 最大相关性
          },
          // 新近度：提升较新的记忆
          temporalDecay: {
            enabled: true,    // 默认：false
            halfLifeDays: 30  // 分数每 30 天减半
          }
        }
      }
    }
  }
}
```

您可以独立启用任一功能：

- **仅 MMR** -- 当您有许多相似笔记但年龄不重要时有用。
- **仅时间衰减** -- 当新近度重要但结果已经多样时有用。
- **两者** -- 推荐用于拥有大型、长期运行每日笔记历史的 Agent。

## 嵌入缓存

OpenClaw 可以在 SQLite 中缓存**块嵌入**，这样重新索引和频繁更新（特别是 session 转录）就不会重新嵌入未更改的文本。

配置：

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

## Session 记忆搜索（实验性）

您可以选择索引 **session 转录**并通过 `memory_search` 呈现它们。这需要实验性标志。

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

注意事项：

- Session 索引是**选择加入**（默认关闭）。
- Session 更新被防抖，一旦超过增量阈值就**异步索引**（尽力而为）。
- `memory_search` 从不阻塞索引；在后台同步完成之前，结果可能略有过时。
- 结果仍然只包括片段；`memory_get` 仍然限于记忆文件。
- Session 索引按 Agent 隔离（只有该 Agent 的 session 日志被索引）。
- Session 日志存储在磁盘（`~/.openclaw/agents/<agentId>/sessions/*.jsonl`）。任何具有文件系统访问权限的进程/用户都可以读取它们，因此将磁盘访问视为信任边界。对于更严格的隔离，在单独的操作系统用户或主机下运行 Agent。

增量阈值（显示的默认值）：

```json5
agents: {
  defaults: {
    memorySearch: {
      sync: {
        sessions: {
          deltaBytes: 100000,   // ~100 KB
          deltaMessages: 50     // JSONL 行数
        }
      }
    }
  }
}
```

## SQLite 向量加速（sqlite-vec）

当 sqlite-vec 扩展可用时，OpenClaw 在 SQLite 虚拟表（`vec0`）中存储嵌入，并在数据库中执行向量距离查询。这使搜索保持快速而无需将每个嵌入加载到 JS 中。

配置（可选）：

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

注意事项：

- `enabled` 默认为 true；禁用时，搜索回退到存储嵌入上的进程内余弦相似度。
- 如果 sqlite-vec 扩展缺失或加载失败，OpenClaw 记录错误并继续使用 JS 回退（无向量表）。
- `extensionPath` 覆盖捆绑的 sqlite-vec 路径（适用于自定义构建或非标准安装位置）。

## 本地嵌入自动下载

- 默认本地嵌入模型：`hf:ggml-org/embeddinggemma-300m-qat-q8_0-GGUF/embeddinggemma-300m-qat-Q8_0.gguf`（约 0.6 GB）。
- 当 `memorySearch.provider = "local"` 时，`node-llama-cpp` 解析 `modelPath`；如果 GGUF 缺失，它会**自动下载**到缓存（或 `local.modelCacheDir` 如果设置），然后加载。下载在重试时继续。
- 本地构建要求：运行 `pnpm approve-builds`，选择 `node-llama-cpp`，然后运行 `pnpm rebuild node-llama-cpp`。
- 回退：如果本地设置失败且 `memorySearch.fallback = "openai"`，我们自动切换到远程嵌入（`openai/text-embedding-3-small` 除非被覆盖）并记录原因。

## 自定义 OpenAI 兼容端点示例

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

注意事项：

- `remote.*` 优先于 `models.providers.openai.*`。
- `remote.headers` 与 OpenAI 标头合并；远程在键冲突时获胜。省略 `remote.headers` 以使用 OpenAI 默认值。
