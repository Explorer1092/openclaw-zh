---
mmh3_hash: "3cbdefbe6b238cbad6a934ad90197abc"
title: "QMD 记忆引擎"
summary: "本地优先搜索辅助进程，支持 BM25、向量、重排序和查询扩展"
read_when:
  - 您想将 QMD 设置为记忆后端
  - 您想要重排序或额外索引路径等高级记忆功能
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: placeholder
  source_path: "concepts/memory-qmd.md"
  workflow: 15
---

# QMD 记忆引擎

[QMD](https://github.com/tobi/qmd) 是一个与 OpenClaw 并行运行的本地优先搜索辅助进程。它在单个二进制文件中结合了 BM25、向量搜索和重排序，并可以索引工作区记忆文件之外的内容。

## 相比内置引擎的优势

- **重排序和查询扩展**：更好的召回率。
- **索引额外目录**：项目文档、团队笔记、磁盘上的任何内容。
- **索引 Session 转录**：召回早期对话。
- **完全本地**：通过 Bun + node-llama-cpp 运行，自动下载 GGUF 模型。
- **自动回退**：如果 QMD 不可用，OpenClaw 会无缝回退到内置引擎。

## 入门

### 前提条件

- 安装 QMD：`bun install -g https://github.com/tobi/qmd`
- 允许扩展的 SQLite 构建（macOS 上：`brew install sqlite`）。
- QMD 必须在 Gateway 的 `PATH` 上。
- macOS 和 Linux 开箱即用。Windows 最好通过 WSL2 支持。

### 启用

```json5
{
  memory: {
    backend: "qmd",
  },
}
```

OpenClaw 在 `~/.openclaw/agents/<agentId>/qmd/` 下创建一个自包含的 QMD 主目录，并自动管理辅助进程生命周期 — 集合、更新和嵌入运行由系统自动处理。

## 辅助进程工作原理

- OpenClaw 从您的工作区记忆文件和任何配置的 `memory.qmd.paths` 创建集合，然后在启动时以及定期（默认每 5 分钟）运行 `qmd update` + `qmd embed`。
- 启动刷新在后台运行，因此聊天启动不会被阻塞。
- 搜索使用配置的 `searchMode`（默认：`search`；也支持 `vsearch` 和 `query`）。如果某种模式失败，OpenClaw 会用 `qmd query` 重试。
- 如果 QMD 完全失败，OpenClaw 会回退到内置 SQLite 引擎。

<Info>
第一次搜索可能会很慢 — QMD 在第一次 `qmd query` 运行时自动下载 GGUF 模型（约 2 GB）用于重排序和查询扩展。
</Info>

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

额外路径中的片段在搜索结果中以 `qmd/<collection>/<relative-path>` 形式出现。`memory_get` 理解此前缀并从正确的集合根读取。

## 索引 Session 转录

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

转录以清理后的用户/助手轮次导出到 `~/.openclaw/agents/<id>/qmd/sessions/` 下的专用 QMD 集合中。

## 搜索范围

默认情况下，QMD 搜索结果仅在私信 Session 中显示（非群组或 Channel）。配置 `memory.qmd.scope` 可更改此行为：

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

当范围拒绝搜索时，OpenClaw 会记录带有推导出的 Channel 和聊天类型的警告，使空结果更易于调试。

## 引用

当 `memory.citations` 为 `auto` 或 `on` 时，搜索片段包含 `Source: <path#line>` 页脚。设置 `memory.citations = "off"` 可省略页脚，同时仍在内部将路径传递给 Agent。

## 使用场景

在以下情况选择 QMD：

- 需要重排序以获得更高质量的结果。
- 需要搜索工作区外的项目文档或笔记。
- 需要召回过去的 Session 对话。
- 需要完全本地搜索，无 API key。

对于更简单的设置，[内置引擎](/concepts/memory-builtin) 无需额外依赖即可运行。

## 故障排除

**找不到 QMD？** 确保二进制文件在 Gateway 的 `PATH` 上。如果 OpenClaw 作为服务运行，请创建符号链接：
`sudo ln -s ~/.bun/bin/qmd /usr/local/bin/qmd`。

**第一次搜索非常慢？** QMD 在首次使用时下载 GGUF 模型。使用 OpenClaw 使用的相同 XDG 目录预热：`qmd query "test"`。

**搜索超时？** 增加 `memory.qmd.limits.timeoutMs`（默认：4000ms）。在较慢的硬件上设置为 `120000`。

**群聊中结果为空？** 检查 `memory.qmd.scope` — 默认只允许私信 Session。

## 配置

有关完整配置界面（`memory.qmd.*`）、搜索模式、更新间隔、范围规则和所有其他选项，请参见
[记忆配置参考](/reference/memory-config)。
