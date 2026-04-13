---
mmh3_hash: "92e1d62d8a83fd7c5ed099e3a6ce7e26"
summary: "`openclaw wiki` 的 CLI 参考（memory-wiki 库状态、搜索、编译、lint、应用、桥接和 Obsidian 助手）"
read_when:
  - 您想使用 memory-wiki CLI
  - 您正在记录或更改 `openclaw wiki`
title: "wiki"
---

# `openclaw wiki`

检查和维护 `memory-wiki` 库。

由捆绑的 `memory-wiki` Plugin 提供。

相关内容：

- [Memory Wiki plugin](/plugins/memory-wiki)
- [Memory 概述](/concepts/memory)
- [CLI: memory](/cli/memory)

## 用途

当您需要具有以下功能的编译知识库时，使用 `openclaw wiki`：

- Wiki 原生搜索和页面读取
- 具有丰富溯源的综合内容
- 矛盾和新鲜度报告
- 从活跃 Memory Plugin 的桥接导入
- 可选的 Obsidian CLI 助手

## 常用命令

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha --from 1 --lines 80

openclaw wiki apply synthesis "Alpha Summary" \
  --body "Short synthesis body" \
  --source-id source.alpha

openclaw wiki apply metadata entity.alpha \
  --source-id source.alpha \
  --status review \
  --question "Still active?"

openclaw wiki bridge import
openclaw wiki unsafe-local import

openclaw wiki obsidian status
openclaw wiki obsidian search "alpha"
openclaw wiki obsidian open syntheses/alpha-summary.md
openclaw wiki obsidian command workspace:quick-switcher
openclaw wiki obsidian daily
```

## 命令

### `wiki status`

检查当前库模式、健康状态和 Obsidian CLI 可用性。

当您不确定库是否已初始化、桥接模式是否健康或 Obsidian 集成是否可用时，首先使用此命令。

### `wiki doctor`

运行 Wiki 健康检查并发现配置或库问题。

典型问题包括：

- 桥接模式已启用但没有公共 Memory 构件
- 无效或缺失的库布局
- 在预期 Obsidian 模式时缺少外部 Obsidian CLI

### `wiki init`

创建 Wiki 库布局和入门页面。

这将初始化根结构，包括顶级索引和缓存目录。

### `wiki ingest <path-or-url>`

将内容导入 Wiki 源层。

说明：

- URL 导入由 `ingest.allowUrlIngest` 控制
- 导入的源页面在前置内容中保留溯源信息
- 启用时，导入后可自动运行编译

### `wiki compile`

重建索引、相关块、仪表板和编译摘要。

这将在以下位置写入稳定的机器可读构件：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果启用了 `render.createDashboards`，compile 还会刷新报告页面。

### `wiki lint`

检查库并报告：

- 结构问题
- 溯源缺口
- 矛盾
- 开放问题
- 低置信度页面/声明
- 过时的页面/声明

在进行有意义的 Wiki 更新后运行此命令。

### `wiki search <query>`

搜索 Wiki 内容。

行为取决于配置：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`

当您需要 Wiki 特定排名或溯源详细信息时，使用 `wiki search`。
如需一次广泛的共享召回，当活跃 Memory Plugin 公开共享搜索时，优先使用 `openclaw memory search`。

### `wiki get <lookup>`

通过 ID 或相对路径读取 Wiki 页面。

示例：

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

在不进行自由格式页面手术的情况下应用精确的更改。

支持的流程包括：

- 创建/更新综合页面
- 更新页面元数据
- 附加源 ID
- 添加问题
- 添加矛盾
- 更新置信度/状态
- 写入结构化声明

此命令的存在是为了让 Wiki 能够安全地演化，而无需手动编辑托管块。

### `wiki bridge import`

从活跃 Memory Plugin 将公共 Memory 构件导入桥接支持的源页面。

当您希望将最新导出的 Memory 构件拉入 Wiki 库时，在 `bridge` 模式下使用此命令。

### `wiki unsafe-local import`

在 `unsafe-local` 模式下从显式配置的本地路径导入。

这是有意设计为实验性且仅限同一机器使用的。

### `wiki obsidian ...`

在 Obsidian 友好模式下运行的库的 Obsidian 助手命令。

子命令：

- `status`
- `search`
- `open`
- `command`
- `daily`

当启用 `obsidian.useOfficialCli` 时，这些命令需要 `PATH` 上的官方 `obsidian` CLI。

## 实用使用指南

- 当溯源和页面标识重要时，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply` 而不是手动编辑托管生成的部分。
- 在信任矛盾或低置信度内容之前，运行 `wiki lint`。
- 在批量导入或源更改后，当您想立即获得新鲜的仪表板和编译摘要时，使用 `wiki compile`。
- 当桥接模式依赖于新导出的 Memory 构件时，使用 `wiki bridge import`。

## 配置关联

`openclaw wiki` 的行为由以下配置决定：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

有关完整配置模型，请参见 [Memory Wiki plugin](/plugins/memory-wiki)。
