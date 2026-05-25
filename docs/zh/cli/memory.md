---
mmh3_hash: "2816096ffaa325c67f55100f265c036f"
summary: "`openclaw memory` 的 CLI 参考（状态/索引/搜索/提升/提升解释/REM 运行环境）"
read_when:
  - 您想索引或搜索语义内存
  - 您正在调试内存可用性或索引
  - 您想将召回的短期记忆提升到 `MEMORY.md`
title: "Memory"
---

# `openclaw memory`

管理语义内存索引和搜索。
由捆绑的 `memory-core` Plugin 提供。当 `plugins.slots.memory` 选择 `memory-core`（默认值）时可用；其他内存 Plugin 公开其自己的 CLI 命名空间。

相关：

- 内存概念：[Memory](/concepts/memory)
- Memory wiki：[Memory Wiki](/plugins/memory-wiki)
- Wiki CLI：[wiki](/cli/wiki)
- Plugins：[Plugins](/tools/plugin)

## 示例

```bash
openclaw memory status
openclaw memory status --deep
openclaw memory status --fix
openclaw memory index --force
openclaw memory search "meeting notes"
openclaw memory search --query "deployment" --max-results 20
openclaw memory promote --limit 10 --min-score 0.75
openclaw memory promote --apply
openclaw memory promote --json --min-recall-count 0 --min-unique-queries 0
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
openclaw memory rem-harness
openclaw memory rem-harness --json
openclaw memory status --json
openclaw memory status --deep --index
openclaw memory status --deep --index --verbose
openclaw memory status --agent main
openclaw memory index --agent main --verbose
```

## 选项

`memory status` 和 `memory index`：

- `--agent <id>`：范围限定为单个 Agent。不使用此选项时，这些命令针对每个已配置的 Agent 运行；如果没有配置 Agent 列表，则回退到默认 Agent。
- `--verbose`：在探测和索引期间输出详细日志。

`memory status`：

- `--deep`：探测本地向量存储就绪状态、嵌入 Provider 就绪状态和语义向量搜索就绪状态。普通的 `memory status` 保持快速，不运行实时嵌入或 Provider 发现工作；未知的向量存储或语义向量状态意味着在该命令中未被探测。QMD 词法 `searchMode: "search"` 即使使用 `--deep` 也会跳过语义向量探测和嵌入维护。
- `--index`：如果存储已脏则运行重新索引（隐含 `--deep`）。
- `--fix`：修复过期的召回锁并规范化提升元数据。
- `--json`：打印 JSON 输出。

如果 `memory status` 显示 `Dreaming status: blocked`，说明托管 dreaming cron 已启用，但驱动它的心跳对默认 Agent 没有触发。请参阅 [Dreaming 从不运行](/concepts/dreaming#dreaming-never-runs-status-shows-blocked) 了解两种常见原因。

`memory index`：

- `--force`：强制完全重新索引。

`memory search`：

- 查询输入：传递位置参数 `[query]` 或 `--query <text>`。
- 如果两者都提供，`--query` 优先。
- 如果两者都未提供，命令以错误退出。
- `--agent <id>`：范围限定为单个 Agent（默认：默认 Agent）。
- `--max-results <n>`：限制返回的结果数量。
- `--min-score <n>`：过滤掉低分匹配。
- `--json`：打印 JSON 结果。

`memory promote`：

预览和应用短期记忆提升。

```bash
openclaw memory promote [--apply] [--limit <n>] [--include-promoted]
```

- `--apply` — 将提升内容写入 `MEMORY.md`（默认：仅预览）。
- `--limit <n>` — 限制显示的候选数量。
- `--include-promoted` — 包含前几个周期中已提升的条目。

完整选项：

- 使用加权提升信号（`频率`、`相关性`、`查询多样性`、`时效性`、`整合`、`概念丰富度`）对 `memory/YYYY-MM-DD.md` 中的短期候选进行排名。
- 使用来自内存召回和每日摄取过程的短期信号，以及轻度/REM 阶段强化信号。
- 当 dreaming 启用时，`memory-core` 自动管理一个 cron 任务，在后台运行完整扫描（`轻度 -> REM -> 深度`）（无需手动 `openclaw cron add`）。
- `--agent <id>`：范围限定为单个 Agent（默认：默认 Agent）。
- `--limit <n>`：返回/应用的最大候选数量。
- `--min-score <n>`：最小加权提升分数。
- `--min-recall-count <n>`：候选所需的最小召回次数。
- `--min-unique-queries <n>`：候选所需的最小不同查询次数。
- `--apply`：将选定候选追加到 `MEMORY.md` 并标记为已提升。
- `--include-promoted`：在输出中包含已提升的候选。
- `--json`：打印 JSON 输出。

`memory promote-explain`：

解释特定的提升候选及其分数细分。

```bash
openclaw memory promote-explain <selector> [--agent <id>] [--include-promoted] [--json]
```

- `<selector>`：要查找的候选键、路径片段或片段。
- `--agent <id>`：范围限定为单个 Agent（默认：默认 Agent）。
- `--include-promoted`：包含已提升的候选。
- `--json`：打印 JSON 输出。

`memory rem-harness`：

预览 REM 反思、候选真相和深度提升输出，而不写入任何内容。

```bash
openclaw memory rem-harness [--agent <id>] [--include-promoted] [--json]
```

- `--agent <id>`：范围限定为单个 Agent（默认：默认 Agent）。
- `--include-promoted`：包含已提升的深度候选。
- `--json`：打印 JSON 输出。

## Dreaming

Dreaming 是具有三个协作阶段的后台内存整合系统：**轻度**（排序/暂存短期材料）、**深度**（将持久事实提升到 `MEMORY.md`）和 **REM**（反思和浮现主题）。

- 通过 `plugins.entries.memory-core.config.dreaming.enabled: true` 启用。
- 通过聊天中的 `/dreaming on|off` 切换（或使用 `/dreaming status` 检查）。
- Dreaming 在一个托管扫描计划（`dreaming.frequency`）上运行，并按顺序执行各阶段：轻度、REM、深度。
- 只有深度阶段将持久内存写入 `MEMORY.md`。
- 人类可读的阶段输出和日记条目写入 `DREAMS.md`（或现有的 `dreams.md`），可选的每阶段报告写入 `memory/dreaming/<phase>/YYYY-MM-DD.md`。
- 排名使用加权信号：召回频率、检索相关性、查询多样性、时间时效性、跨天整合和派生概念丰富度。
- 提升在写入 `MEMORY.md` 之前重新读取实时日记，因此已编辑或删除的短期片段不会从过期的召回存储快照中被提升。
- 计划和手动 `memory promote` 运行共享相同的深度阶段默认值，除非传递 CLI 阈值覆盖。
- 自动运行跨配置的内存工作空间展开。

默认调度：

- **扫描节奏**：`dreaming.frequency = 0 3 * * *`
- **深度阈值**：`minScore=0.8`、`minRecallCount=3`、`minUniqueQueries=3`、`recencyHalfLifeDays=14`、`maxAgeDays=30`

示例：

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true
          }
        }
      }
    }
  }
}
```

注意事项：

- `memory index --verbose` 打印每阶段详细信息（Provider、模型、来源、批次活动）。
- `memory status` 包含通过 `memorySearch.extraPaths` 配置的任何额外路径。
- 如果有效的活动内存远程 API 密钥字段配置为 SecretRef，命令会从活动 Gateway 快照解析这些值。如果 Gateway 不可用，命令会快速失败。
- Gateway 版本偏差注意：此命令路径需要支持 `secrets.resolve` 的 Gateway；旧版 Gateway 会返回未知方法错误。
- 使用 `dreaming.frequency` 调整计划扫描节奏。深度提升策略为内部实现；在需要一次性手动覆盖时，在 `memory promote` 上使用 CLI 标志。
- `memory rem-harness --path <file-or-dir> --grounded` 从历史日记预览基础化的 `What Happened`、`Reflections` 和 `Possible Lasting Updates`，不写入任何内容。
- `memory rem-backfill --path <file-or-dir>` 将可逆的基础化日记条目写入 `DREAMS.md` 供 UI 审查。
- `memory rem-backfill --path <file-or-dir> --stage-short-term` 还将基础化的持久候选植入实时短期提升存储，使正常的深度阶段可以对其排名。
- `memory rem-backfill --rollback` 删除之前写入的基础化日记条目，`memory rem-backfill --rollback-short-term` 删除之前暂存的基础化短期候选。
- 请参阅 [Dreaming](/concepts/dreaming) 了解完整的阶段描述和配置参考。

## 相关

- [CLI 参考](/cli)
- [内存概述](/concepts/memory)
