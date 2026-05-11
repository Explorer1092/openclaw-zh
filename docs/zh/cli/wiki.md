---
mmh3_hash: "867b1a293fa92627aae628f96eccde71"
summary: "`openclaw wiki` 的 CLI 参考（memory-wiki 库状态、搜索、编译、lint、应用、桥接和 Obsidian 助手）"
read_when:
  - 您想使用 memory-wiki CLI
  - 您正在记录或更改 `openclaw wiki`
title: "Wiki"
---

# `openclaw wiki`

检查和维护 `memory-wiki` 库。

由捆绑的 `memory-wiki` Plugin 提供。

相关：

- [Memory Wiki Plugin](/plugins/memory-wiki)
- [内存概述](/concepts/memory)
- [CLI: memory](/cli/memory)

## 用途

当您想要具有以下特性的编译知识库时，使用 `openclaw wiki`：

- wiki 原生搜索和页面读取
- 来源丰富的综合
- 矛盾和新鲜度报告
- 从活动内存 Plugin 的桥接导入
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
openclaw wiki search "who should I ask about Teams?" --mode route-question
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

当您不确定库是否已初始化、桥接模式是否健康或 Obsidian 集成是否可用时，请先使用此命令。

当桥接模式处于活动状态并配置为读取内存工件时，此命令查询运行中的 Gateway，以便它看到与 Agent/运行时内存相同的活动内存 Plugin 上下文。

### `wiki doctor`

运行 wiki 健康检查并浮现配置或库问题。

当桥接模式处于活动状态并配置为读取内存工件时，此命令在构建报告之前查询运行中的 Gateway。禁用了桥接导入和不读取内存工件的桥接配置保持本地/离线。

典型问题包括：

- 在没有公共内存工件的情况下启用了桥接模式
- 无效或缺失的库布局
- 预期 Obsidian 模式时缺少外部 Obsidian CLI

### `wiki init`

创建 wiki 库布局和起始页面。

这将初始化根结构，包括顶级索引和缓存目录。

### `wiki ingest <path-or-url>`

将内容导入 wiki 源层。

注意事项：

- URL 摄取由 `ingest.allowUrlIngest` 控制
- 导入的源页面在 frontmatter 中保留来源信息
- 启用时，摄取后可以运行自动编译

### `wiki compile`

重建索引、相关块、仪表板和编译摘要。

这在以下位置写入稳定的面向机器的工件：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

如果启用了 `render.createDashboards`，compile 还会刷新报告页面。

### `wiki lint`

对库进行 lint 并报告：

- 结构问题
- 来源缺口
- 矛盾
- 开放性问题
- 低置信度页面/声明
- 过期的页面/声明

在有意义的 wiki 更新后运行此命令。

### `wiki search <query>`

搜索 wiki 内容。

行为取决于配置：

- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `--mode`：`auto`、`find-person`、`route-question`、`source-evidence` 或 `raw-claim`

当您想要 wiki 特定排名或来源详细信息时使用 `wiki search`。
对于一次广泛的共享召回，当活动内存 Plugin 公开共享搜索时，优先使用 `openclaw memory search`。

搜索模式帮助 Agent 选择正确的界面：

- `find-person`：别名、句柄、社交账号、规范 ID 和人员页面
- `route-question`：询问/最佳用于提示和关系上下文
- `source-evidence`：源页面和结构化证据字段
- `raw-claim`：带有声明/证据元数据的结构化声明文本

示例：

```bash
openclaw wiki search "bgroux" --mode find-person
openclaw wiki search "who knows Teams rollout?" --mode route-question
openclaw wiki search "maintainer-whois" --mode source-evidence
openclaw wiki search "strong route Teams" --mode raw-claim --json
```

当结果匹配结构化声明时，文本输出包含 `Claim:` 和 `Evidence:` 行。JSON 输出还公开 `matchedClaimId`、`matchedClaimStatus`、`matchedClaimConfidence`、`evidenceKinds` 和 `evidenceSourceIds` 供 Agent 端深入研究。

### `wiki get <lookup>`

按 ID 或相对路径读取 wiki 页面。

示例：

```bash
openclaw wiki get entity.alpha
openclaw wiki get syntheses/alpha-summary.md --from 1 --lines 80
```

### `wiki apply`

应用窄范围的变更，而无需自由形式的页面外科手术。

支持的流程包括：

- 创建/更新综合页面
- 更新页面元数据
- 附加源 ID
- 添加问题
- 添加矛盾
- 更新置信度/状态
- 写入结构化声明

此命令的存在是为了让 wiki 可以安全演进，而无需手动编辑托管块。

### `wiki bridge import`

从活动内存 Plugin 将公共内存工件导入桥接支持的源页面。

在 `bridge` 模式下，当您想要将最新导出的内存工件拉入 wiki 库时使用此命令。

对于活动桥接工件读取，CLI 通过 Gateway RPC 路由导入，使导入使用运行时内存 Plugin 上下文。如果禁用了桥接导入或关闭了工件读取，命令保持本地/离线零导入行为。

### `wiki unsafe-local import`

从 `unsafe-local` 模式中显式配置的本地路径导入。

这是有意实验性的，仅限于同一机器。

### `wiki obsidian ...`

用于在 Obsidian 友好模式下运行的库的 Obsidian 助手命令。

子命令：

- `status`
- `search`
- `open`
- `command`
- `daily`

启用 `obsidian.useOfficialCli` 时，这些需要 `PATH` 上的官方 `obsidian` CLI。

## 实用使用指南

- 当来源和页面标识重要时，使用 `wiki search` + `wiki get`。
- 使用 `wiki apply`，而不是手动编辑托管生成的部分。
- 在信任矛盾的或低置信度的内容之前，使用 `wiki lint`。
- 在批量导入或源更改后，当您想立即获得新鲜的仪表板和编译摘要时，使用 `wiki compile`。
- 当桥接模式依赖新导出的内存工件时，使用 `wiki bridge import`。

## 配置关联

`openclaw wiki` 的行为由以下配置塑造：

- `plugins.entries.memory-wiki.config.vaultMode`
- `plugins.entries.memory-wiki.config.search.backend`
- `plugins.entries.memory-wiki.config.search.corpus`
- `plugins.entries.memory-wiki.config.bridge.*`
- `plugins.entries.memory-wiki.config.obsidian.*`
- `plugins.entries.memory-wiki.config.render.*`
- `plugins.entries.memory-wiki.config.context.includeCompiledDigestPrompt`

请参阅 [Memory Wiki Plugin](/plugins/memory-wiki) 了解完整的配置模型。

## 相关

- [CLI 参考](/cli)
- [Memory wiki](/plugins/memory-wiki)
