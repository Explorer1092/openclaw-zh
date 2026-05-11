---
mmh3_hash: "1835a1d324ab6d381290695538fdfa53"
summary: "具有 BM25、向量、重排序和查询扩展的本地优先搜索辅助程序"
title: "QMD 内存引擎"
read_when:
  - 您想将 QMD 设置为内存后端
  - 您需要重排序或额外索引路径等高级内存功能
---

[QMD](https://github.com/tobi/qmd) 是一个与 OpenClaw 并行运行的本地优先搜索辅助程序。它在单个二进制文件中结合了 BM25、向量搜索和重排序，并可以索引工作区内存文件之外的内容。

## 相比内置引擎的优势

- **重排序和查询扩展**，提升召回质量。
- **索引额外目录**——项目文档、团队笔记、磁盘上的任何内容。
- **索引 Session 记录**——召回早期对话。
- **完全本地化**——与可选的 node-llama-cpp 运行时包一起运行，并自动下载 GGUF 模型。
- **自动回退**——如果 QMD 不可用，OpenClaw 无缝回退到内置引擎。

## 入门

### 前提条件

- 安装 QMD：`npm install -g @tobilu/qmd` 或 `bun install -g @tobilu/qmd`
- 允许扩展的 SQLite 构建（macOS 上 `brew install sqlite`）。
- QMD 必须在 Gateway 的 `PATH` 中。
- macOS 和 Linux 开箱即用。Windows 最好通过 WSL2 支持。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 在 `~/.openclaw/agents/<agentId>/qmd/` 下创建一个独立的 QMD 主目录，并自动管理辅助程序的生命周期——集合、更新和嵌入运行都为您处理。它优先使用当前 QMD 集合和 MCP 查询形状，但在需要时仍回退到替代集合模式标志和旧版 MCP 工具名称。启动时的对账还会在检测到旧版同名 QMD 集合时，将过时的托管集合重新创建为规范模式。

## 辅助程序工作原理

- OpenClaw 从工作区内存文件和任何已配置的 `memory.qmd.paths` 创建集合，然后在 QMD 管理器打开时运行 `qmd update`，并定期之后运行（默认每 5 分钟）。这些刷新通过 QMD 子进程运行，而非进程内文件系统爬取。语义模式还会运行 `qmd embed`。
- 默认工作区集合跟踪 `MEMORY.md` 加上 `memory/` 树。小写的 `memory.md` 不会作为根内存文件被索引。
- QMD 自身的扫描器忽略隐藏路径和常见的依赖/构建目录，如 `.git`、`.cache`、`node_modules`、`vendor`、`dist` 和 `build`。Gateway 启动时默认不初始化 QMD，因此冷启动在首次使用内存之前避免导入内存运行时或创建长期运行的监视器。
- 如果您希望 Gateway 启动时刷新，请将 `memory.qmd.update.startup` 设置为 `idle` 或 `immediate`。可选的启动刷新使用一次性 QMD 子进程路径，而非创建完整的长期进程内监视器。
- 搜索使用已配置的 `searchMode`（默认：`search`；也支持 `vsearch` 和 `query`）。`search` 仅为 BM25，因此 OpenClaw 在该模式下跳过语义向量就绪探测和嵌入维护。如果模式失败，OpenClaw 使用 `qmd query` 重试。
- 对于宣传多集合过滤器的 QMD 版本，OpenClaw 将同源集合分组到一个 QMD 搜索调用中。旧版 QMD 保留兼容的每集合回退。
- 如果 QMD 完全失败，OpenClaw 回退到内置 SQLite 引擎。聊天轮次重复尝试在打开失败后短暂退避，避免缺失的二进制文件或损坏的辅助程序依赖项造成重试风暴；`openclaw memory status` 和一次性 CLI 探测仍直接重新检查 QMD。

<Info>
首次搜索可能较慢——QMD 在首次 `qmd query` 运行时自动下载 GGUF 模型（约 2 GB），用于重排序和查询扩展。
</Info>

## 搜索性能和兼容性

OpenClaw 保持 QMD 搜索路径与当前和旧版 QMD 安装兼容。

启动时，OpenClaw 每个管理器检查一次已安装的 QMD 帮助文本。如果二进制文件宣传支持多集合过滤器，OpenClaw 使用一个命令搜索所有同源集合：

```bash
qmd search "router notes" --json -n 10 -c memory-root-main -c memory-dir-main
```

这避免了为每个持久内存集合启动一个 QMD 子进程。Session 记录集合保留在各自的源组中，因此混合 `memory` + `sessions` 搜索仍然为结果多样化器提供两个来源的输入。

旧版 QMD 构建只接受一个集合过滤器。当 OpenClaw 检测到此类构建时，保留兼容性路径，分别搜索每个集合，然后合并和去重结果。

要手动检查已安装的契约，请运行：

```bash
qmd --help | grep -i collection
```

当前 QMD 帮助说集合过滤器可以针对一个或多个集合。旧版帮助通常描述单个集合。

## 模型覆盖

QMD 模型环境变量从 Gateway 进程原样传递，因此您可以全局调整 QMD，无需添加新的 OpenClaw 配置：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改嵌入模型后，重新运行嵌入以使索引与新的向量空间匹配。

## 索引额外路径

将 QMD 指向额外目录使其可搜索：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      paths: [{ name: "docs", path: "~/notes", pattern: "**/*.md" }],
    },
  },
}
```

额外路径的代码段在搜索结果中显示为 `qmd/<collection>/<relative-path>`。`memory_get` 理解此前缀，从正确的集合根读取。

## 索引 Session 记录

启用 Session 索引以召回早期对话：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      sessions: { enabled: true },
    },
  },
}
```

记录作为已净化的 User/Assistant 轮次导出到 `~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD 集合中。

## 搜索范围

默认情况下，QMD 搜索结果在直接和 Channel Session 中显示（不在群组中）。配置 `memory.qmd.scope` 以更改：

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

当范围拒绝搜索时，OpenClaw 用推导的 Channel 和聊天类型记录警告，使空结果更容易调试。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索代码段包含 `Source: <path#line>` 尾注。设置 `memory.citations = "off"` 可省略尾注，同时内部仍将路径传递给 Agent。

## 何时使用

选择 QMD 的情况：

- 需要重排序以获得更高质量的结果。
- 需要搜索工作区外的项目文档或笔记。
- 需要召回过去的 Session 对话。
- 完全本地搜索，无需 API 密钥。

对于更简单的设置，[内置引擎](/concepts/memory-builtin)无需额外依赖即可正常工作。

## 故障排除

**找不到 QMD？** 确保二进制文件在 Gateway 的 `PATH` 中。如果 OpenClaw 作为服务运行，请创建符号链接：`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

如果 `qmd --version` 在您的 Shell 中有效，但 OpenClaw 仍然报告 `spawn qmd ENOENT`，则 Gateway 进程的 `PATH` 可能与您的交互式 Shell 不同。显式固定二进制路径：

```json5
{
  memory: {
    backend: "qmd",
    qmd: {
      command: "/absolute/path/to/qmd",
    },
  },
}
```

在安装 QMD 的环境中使用 `command -v qmd`，然后使用 `openclaw memory status --deep` 重新检查。

**首次搜索非常慢？** QMD 在首次使用时下载 GGUF 模型。使用 OpenClaw 使用的相同 XDG 目录运行 `qmd query "test"` 进行预热。

**搜索期间有许多 QMD 子进程？** 尽可能更新 QMD。只有当已安装的 QMD 宣传支持多个 `-c` 过滤器时，OpenClaw 才为同源多集合搜索使用一个进程；否则，为了正确性保留旧版每集合回退。

**仅 BM25 的 QMD 仍在尝试构建 llama.cpp？** 设置 `memory.qmd.searchMode = "search"`。OpenClaw 将该模式视为仅词法，不运行 QMD 向量状态探测或嵌入维护，将语义就绪检查留给 `vsearch` 或 `query` 设置。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认：4000ms）。对于较慢的硬件，设置为 `120000`。

**群聊中结果为空？** 检查 `memory.qmd.scope`——默认只允许直接和 Channel Session。

**根内存搜索突然范围太广？** 重启 Gateway 或等待下次启动对账。当 OpenClaw 检测到同名冲突时，会将过时的托管集合重新创建为规范的 `MEMORY.md` 和 `memory/` 模式。

**工作区可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？** QMD 遍历目前遵循底层 QMD 扫描器行为，而非 OpenClaw 的内置符号链接规则。在 QMD 公开安全循环遍历或显式排除控制之前，将临时单仓库检出保留在 `.tmp/` 等隐藏目录下，或放在已索引的 QMD 根目录之外。

## 配置

有关完整配置界面（`memory.qmd.*`）、搜索模式、更新间隔、范围规则和所有其他旋钮，请参阅[内存配置参考](/reference/memory-config)。

## 相关

- [内存概述](/concepts/memory)
- [内置内存引擎](/concepts/memory-builtin)
- [Honcho 内存](/concepts/memory-honcho)
