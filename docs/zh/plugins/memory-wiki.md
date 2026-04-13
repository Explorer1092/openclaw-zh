---
mmh3_hash: "754cae9bb14483db2eff2ea6ca338f21"
summary: "memory-wiki：具有溯源、声明、仪表板和桥接模式的编译知识库"
read_when:
  - 您需要超越普通 MEMORY.md 笔记的持久知识
  - 您正在配置捆绑的 memory-wiki Plugin
  - 您想了解 wiki_search、wiki_get 或桥接模式
title: "Memory Wiki"
---

# Memory Wiki

`memory-wiki` 是一个捆绑 Plugin，将持久 Memory 转变为编译的知识库。

它**不**替换 Active Memory Plugin。Active Memory Plugin 仍然拥有召回、提升、索引和梦境。`memory-wiki` 位于其旁边，将持久知识编译成具有确定性页面、结构化声明、溯源、仪表板和机器可读摘要的可导航 Wiki。

当您希望 Memory 更像维护的知识层而不是一堆 Markdown 文件时使用它。

## 新增内容

- 具有确定性页面布局的专用 Wiki 库
- 结构化声明和证据元数据，而不仅仅是散文
- 页面级溯源、置信度、矛盾和开放问题
- 用于 Agent/运行时消费者的编译摘要
- Wiki 原生搜索/获取/应用/lint 工具
- 可选的桥接模式，从 Active Memory Plugin 导入公共构件
- 可选的 Obsidian 友好渲染模式和 CLI 集成

## 如何与 Memory 配合

可以这样理解分层：

| 层                                                      | 拥有                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Active Memory Plugin（`memory-core`、QMD、Honcho 等）   | 召回、语义搜索、提升、梦境、Memory 运行时                              |
| `memory-wiki`                                           | 编译的 Wiki 页面、溯源丰富的综合、仪表板、Wiki 特定搜索/获取/应用     |

如果 Active Memory Plugin 公开了共享召回构件，OpenClaw 可以通过 `memory_search corpus=all` 一次性搜索两个层。

当您需要 Wiki 特定排名、溯源或直接页面访问时，请改用 Wiki 原生工具。

## 推荐的混合模式

本地优先设置的强大默认值是：

- QMD 作为用于召回和广泛语义搜索的 Active Memory 后端
- 在 `bridge` 模式下的 `memory-wiki` 用于持久综合知识页面

这种分离效果很好，因为每个层保持专注：

- QMD 使原始笔记、Session 导出和额外集合可搜索
- `memory-wiki` 编译稳定的实体、声明、仪表板和源页面

实用规则：

- 当您想要跨 Memory 的一次广泛召回时，使用 `memory_search`
- 当您想要溯源感知的 Wiki 结果时，使用 `wiki_search` 和 `wiki_get`
- 当您希望共享搜索跨两个层时，使用 `memory_search corpus=all`

如果桥接模式报告零导出构件，Active Memory Plugin 当前尚未公开公共桥接输入。首先运行 `openclaw wiki doctor`，然后确认 Active Memory Plugin 是否支持公共构件。

## 库模式

`memory-wiki` 支持三种库模式：

### `isolated`

自有库，自有源，不依赖 `memory-core`。

当您希望 Wiki 成为自己的精选知识存储时使用此模式。

### `bridge`

通过公共 Plugin SDK 接缝从 Active Memory Plugin 读取公共 Memory 构件和 Memory 事件。

当您希望 Wiki 编译和组织 Memory Plugin 的导出构件，而不接触私有 Plugin 内部时使用此模式。

桥接模式可以索引：

- 导出的 Memory 构件
- 梦境报告
- 每日笔记
- Memory 根文件
- Memory 事件日志

### `unsafe-local`

用于本地私有路径的显式同一机器逃生舱。

此模式有意是实验性且不可移植的。仅在您了解信任边界并特别需要桥接模式无法提供的本地文件系统访问时使用它。

## 库布局

Plugin 初始化如下的库：

```text
<vault>/
  AGENTS.md
  WIKI.md
  index.md
  inbox.md
  entities/
  concepts/
  syntheses/
  sources/
  reports/
  _attachments/
  _views/
  .openclaw-wiki/
```

托管内容保留在生成的块内。人类笔记块被保留。

主要页面组是：

- `sources/` 用于导入的原始材料和桥接支持的页面
- `entities/` 用于持久的事物、人员、系统、项目和对象
- `concepts/` 用于想法、抽象、模式和策略
- `syntheses/` 用于编译的摘要和维护的汇总
- `reports/` 用于生成的仪表板

## 结构化声明和证据

页面可以携带结构化的 `claims` 前置内容，而不仅仅是自由格式的文本。

每个声明可以包括：

- `id`
- `text`
- `status`
- `confidence`
- `evidence[]`
- `updatedAt`

证据条目可以包括：

- `sourceId`
- `path`
- `lines`
- `weight`
- `note`
- `updatedAt`

这就是使 Wiki 更像信念层而不是被动笔记转储的原因。声明可以被跟踪、评分、争议和解决回源。

## 编译管道

编译步骤读取 Wiki 页面，规范化摘要，并在以下位置发出稳定的机器可读构件：

- `.openclaw-wiki/cache/agent-digest.json`
- `.openclaw-wiki/cache/claims.jsonl`

这些摘要的存在使 Agent 和运行时代码无需抓取 Markdown 页面。

编译输出还驱动：

- 用于搜索/获取流程的第一遍 Wiki 索引
- 声明 ID 查找回拥有页面
- 紧凑的提示补充
- 报告/仪表板生成

## 仪表板和健康报告

当启用 `render.createDashboards` 时，编译在 `reports/` 下维护仪表板。

内置报告包括：

- `reports/open-questions.md`
- `reports/contradictions.md`
- `reports/low-confidence.md`
- `reports/claim-health.md`
- `reports/stale-pages.md`

这些报告跟踪以下内容：

- 矛盾笔记集群
- 竞争声明集群
- 缺少结构化证据的声明
- 低置信度页面和声明
- 过时或未知新鲜度
- 有未解决问题的页面

## 搜索和检索

`memory-wiki` 支持两种搜索后端：

- `shared`：在可用时使用共享 Memory 搜索流程
- `local`：本地搜索 Wiki

它还支持三种语料库：

- `wiki`
- `memory`
- `all`

重要行为：

- `wiki_search` 和 `wiki_get` 在可能时使用编译摘要作为第一遍
- 声明 ID 可以解析回拥有页面
- 争议/过时/新鲜声明影响排名
- 溯源标签可以在结果中保留

实用规则：

- 使用 `memory_search corpus=all` 进行一次广泛的召回
- 当您关心 Wiki 特定排名、溯源或页面级信念结构时，使用 `wiki_search` + `wiki_get`

## Agent 工具

Plugin 注册以下工具：

- `wiki_status`
- `wiki_search`
- `wiki_get`
- `wiki_apply`
- `wiki_lint`

它们的功能：

- `wiki_status`：当前库模式、健康状态、Obsidian CLI 可用性
- `wiki_search`：搜索 Wiki 页面，以及在配置时搜索共享 Memory 语料库
- `wiki_get`：通过 ID/路径读取 Wiki 页面，或回退到共享 Memory 语料库
- `wiki_apply`：在不进行自由格式页面手术的情况下进行精确的综合/元数据变更
- `wiki_lint`：结构检查、溯源缺口、矛盾、开放问题

Plugin 还注册了一个非独占的 Memory 语料库补充，因此当 Active Memory Plugin 支持语料库选择时，共享的 `memory_search` 和 `memory_get` 可以访问 Wiki。

## 提示和上下文行为

当启用 `context.includeCompiledDigestPrompt` 时，Memory 提示部分会从 `agent-digest.json` 附加紧凑的编译快照。

该快照有意小且高信噪比：

- 仅顶部页面
- 仅顶部声明
- 矛盾计数
- 问题计数
- 置信度/新鲜度限定词

这是选入的，因为它改变提示形状，主要对明确消费 Memory 补充的上下文引擎或旧版提示组装有用。

## 配置

将配置放在 `plugins.entries.memory-wiki.config` 下：

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "isolated",
          vault: {
            path: "~/.openclaw/wiki/main",
            renderMode: "obsidian",
          },
          obsidian: {
            enabled: true,
            useOfficialCli: true,
            vaultName: "OpenClaw Wiki",
            openAfterWrites: false,
          },
          bridge: {
            enabled: false,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          ingest: {
            autoCompile: true,
            maxConcurrentJobs: 1,
            allowUrlIngest: true,
          },
          search: {
            backend: "shared",
            corpus: "wiki",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
          render: {
            preserveHumanBlocks: true,
            createBacklinks: true,
            createDashboards: true,
          },
        },
      },
    },
  },
}
```

关键开关：

- `vaultMode`：`isolated`、`bridge`、`unsafe-local`
- `vault.renderMode`：`native` 或 `obsidian`
- `bridge.readMemoryArtifacts`：导入 Active Memory Plugin 公共构件
- `bridge.followMemoryEvents`：在桥接模式下包含事件日志
- `search.backend`：`shared` 或 `local`
- `search.corpus`：`wiki`、`memory` 或 `all`
- `context.includeCompiledDigestPrompt`：将紧凑摘要快照附加到 Memory 提示部分
- `render.createBacklinks`：生成确定性相关块
- `render.createDashboards`：生成仪表板页面

### 示例：QMD + 桥接模式

当您希望 QMD 用于召回，`memory-wiki` 用于维护的知识层时使用此配置：

```json5
{
  memory: {
    backend: "qmd",
      "memory-wiki": {
        enabled: true,
        config: {
          vaultMode: "bridge",
          bridge: {
            enabled: true,
            readMemoryArtifacts: true,
            indexDreamReports: true,
            indexDailyNotes: true,
            indexMemoryRoot: true,
            followMemoryEvents: true,
          },
          search: {
            backend: "shared",
            corpus: "all",
          },
          context: {
            includeCompiledDigestPrompt: false,
          },
        },
      },
    },
  },
}
```

这保持：

- QMD 负责 Active Memory 召回
- `memory-wiki` 专注于编译页面和仪表板
- 提示形状不变，直到您有意启用编译摘要提示

## CLI

`memory-wiki` 还公开了顶级 CLI 接口：

```bash
openclaw wiki status
openclaw wiki doctor
openclaw wiki init
openclaw wiki ingest ./notes/alpha.md
openclaw wiki compile
openclaw wiki lint
openclaw wiki search "alpha"
openclaw wiki get entity.alpha
openclaw wiki apply synthesis "Alpha Summary" --body "..." --source-id source.alpha
openclaw wiki bridge import
openclaw wiki obsidian status
```

有关完整命令参考，请参见 [CLI: wiki](/cli/wiki)。

## Obsidian 支持

当 `vault.renderMode` 为 `obsidian` 时，Plugin 写入 Obsidian 友好的 Markdown，并可以选择使用官方 `obsidian` CLI。

支持的工作流包括：

- 状态探测
- 库搜索
- 打开页面
- 调用 Obsidian 命令
- 跳转到每日笔记

这是可选的。Wiki 在没有 Obsidian 的原生模式下仍然有效。

## 推荐工作流

1. 保留您的 Active Memory Plugin 用于召回/提升/梦境。
2. 启用 `memory-wiki`。
3. 从 `isolated` 模式开始，除非您明确需要桥接模式。
4. 当溯源重要时，使用 `wiki_search` / `wiki_get`。
5. 使用 `wiki_apply` 进行精确的综合或元数据更新。
6. 在进行有意义的更改后运行 `wiki_lint`。
7. 如果您想要过时/矛盾可见性，开启仪表板。

## 相关文档

- [Memory 概述](/concepts/memory)
- [CLI: memory](/cli/memory)
- [CLI: wiki](/cli/wiki)
- [Plugin SDK 概述](/plugins/sdk-overview)
