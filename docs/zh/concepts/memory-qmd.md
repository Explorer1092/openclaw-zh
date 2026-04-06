---
title: "QMD 内存引擎"
summary: "本地优先的搜索辅助程序，支持 BM25、向量、重排序和查询扩展"
read_when:
  - 你想将 QMD 设置为内存后端
  - 你想要重排序或索引额外路径等高级内存功能
---

# QMD 内存引擎

[QMD](https://github.com/tobi/qmd) 是一个本地优先的搜索辅助程序，与 OpenClaw 并行运行。它在单个二进制文件中结合了 BM25、向量搜索和重排序，并可以索引工作区内存文件以外的内容。

## 相比内置引擎的优势

- **重排序和查询扩展**，提升召回质量。
- **索引额外目录** — 项目文档、团队笔记、磁盘上的任何内容。
- **索引 Session 记录** — 召回早期对话。
- **完全本地** — 通过 Bun + node-llama-cpp 运行，自动下载 GGUF 模型。
- **自动回退** — 如果 QMD 不可用，OpenClaw 无缝回退到内置引擎。

## 入门指南

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

OpenClaw 在 `~/.openclaw/agents/<agentId>/qmd/` 下创建一个自包含的 QMD 主目录，并自动管理辅助程序生命周期——集合、更新和 embedding 运行都由 OpenClaw 处理。它优先使用当前的 QMD 集合和 MCP 查询形式，但在需要时仍会回退到旧版 `--mask` 集合标志和较旧的 MCP 工具名称。

## 辅助程序工作原理

- OpenClaw 从工作区内存文件和任何配置的 `memory.qmd.paths` 创建集合，然后在启动时和定期（默认每 5 分钟）运行 `qmd update` + `qmd embed`。
- 启动刷新在后台运行，不会阻塞聊天启动。
- 搜索使用配置的 `searchMode`（默认：`search`；也支持 `vsearch` 和 `query`）。如果某个模式失败，OpenClaw 会使用 `qmd query` 重试。
- 如果 QMD 完全失败，OpenClaw 回退到内置 SQLite 引擎。

<Info>
首次搜索可能较慢 — QMD 在首次运行 `qmd query` 时自动下载 GGUF 模型（约 2 GB），用于重排序和查询扩展。
</Info>

## 模型覆盖

QMD 模型环境变量直接从 Gateway 进程传递，因此你可以全局调整 QMD 而无需添加新的 OpenClaw 配置：

```bash
export QMD_EMBED_MODEL="hf:Qwen/Qwen3-Embedding-0.6B-GGUF/Qwen3-Embedding-0.6B-Q8_0.gguf"
export QMD_RERANK_MODEL="/absolute/path/to/reranker.gguf"
export QMD_GENERATE_MODEL="/absolute/path/to/generator.gguf"
```

更改 embedding 模型后，重新运行 embedding 以使索引与新的向量空间匹配。

## 索引额外路径

将 QMD 指向额外目录以使其可搜索：

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

额外路径中的片段在搜索结果中以 `qmd/<collection>/<relative-path>` 形式显示。`memory_get` 理解此前缀并从正确的集合根目录读取。

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

记录被导出为经过清理的 User/Assistant 回合，存储在 `~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD 集合中。

## 搜索范围

默认情况下，QMD 搜索结果仅在私信 Session（非群组或 Channel）中显示。配置 `memory.qmd.scope` 可更改此行为：

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

当范围拒绝搜索时，OpenClaw 会记录带有推导出的 Channel 和聊天类型的警告，以便于调试空结果。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段包含 `Source: <path#line>` 页脚。设置 `memory.citations = "off"` 可省略页脚，同时仍在内部将路径传递给 Agent。

## 适用场景

在以下情况选择 QMD：

- 需要重排序以获得更高质量的结果。
- 需要搜索工作区外的项目文档或笔记。
- 需要召回过去的 Session 对话。
- 需要完全本地的搜索，不使用 API 密钥。

对于更简单的设置，[内置引擎](/concepts/memory-builtin) 无需额外依赖即可正常工作。

## 故障排除

**找不到 QMD？** 确保二进制文件在 Gateway 的 `PATH` 中。如果 OpenClaw 作为服务运行，请创建符号链接：`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

**首次搜索非常慢？** QMD 在首次使用时下载 GGUF 模型。使用 OpenClaw 所用的相同 XDG 目录运行 `qmd query "test"` 进行预热。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认：4000ms）。对于较慢的硬件，设置为 `120000`。

**群组聊天中结果为空？** 检查 `memory.qmd.scope` — 默认只允许私信 Session。

**工作区可见的临时仓库导致 `ENAMETOOLONG` 或索引损坏？** QMD 遍历目前遵循底层 QMD 扫描器行为，而非 OpenClaw 的内置符号链接规则。在 QMD 提供循环安全遍历或显式排除控制之前，请将临时 monorepo 检出保存在隐藏目录（如 `.tmp/`）下或索引 QMD 根目录之外。

## 配置

关于完整配置接口（`memory.qmd.*`）、搜索模式、更新间隔、范围规则及所有其他配置项，请参见[内存配置参考](/reference/memory-config)。
