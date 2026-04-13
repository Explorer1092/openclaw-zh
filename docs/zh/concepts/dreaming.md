---
mmh3_hash: "73b513ce3a48f2cd81e29cf00c8a26c2"
title: "Dreaming (experimental)"
summary: "后台内存整合系统，包含轻度、深度和 REM 阶段以及梦境日记"
read_when:
  - 你希望内存升级自动运行
  - 你想了解每个 dreaming 阶段的作用
  - 你希望在不污染 MEMORY.md 的情况下调整整合频率
---

# Dreaming（实验性功能）

Dreaming 是 `memory-core` 中的后台内存整合系统。它帮助 OpenClaw 将强短期信号转移到持久内存中，同时保持过程的可解释性和可审查性。

Dreaming 是**可选开启**的，默认禁用。

## Dreaming 写入的内容

Dreaming 保存两类输出：

- **机器状态**，位于 `memory/.dreams/`（召回存储、阶段信号、摄取检查点、锁文件）。
- **人类可读输出**，位于 `DREAMS.md`（或已有的 `dreams.md`），以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期升级仍仅写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段   | 用途                           | 持久写入          |
| ------ | ------------------------------ | ----------------- |
| 轻度   | 排序并暂存近期短期材料         | 否                |
| 深度   | 评分并升级持久候选项           | 是（`MEMORY.md`） |
| REM    | 反映主题和反复出现的想法       | 否                |

这些阶段是内部实现细节，不是单独的用户可配置"模式"。

### 轻度阶段

轻度阶段摄取最近的每日内存信号和召回痕迹，去重后暂存候选行。

- 从短期召回状态、最近的每日内存文件和可用时的已脱敏 Session 记录中读取。
- 当存储包含内联输出时，写入一个托管的 `## Light Sleep` 块。
- 记录强化信号，供后续深度排名使用。
- 永不写入 `MEMORY.md`。

### 深度阶段

深度阶段决定什么成为长期内存。

- 使用加权评分和阈值门控对候选项排名。
- 需要通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
- 在写入前从实时每日文件重新加载片段，跳过已过时/已删除的片段。
- 将升级条目追加到 `MEMORY.md`。
- 向 `DREAMS.md` 写入 `## Deep Sleep` 摘要，并可选地写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

### REM 阶段

REM 阶段提取模式和反思信号。

- 从最近的短期痕迹中构建主题和反思摘要。
- 当存储包含内联输出时，写入一个托管的 `## REM Sleep` 块。
- 记录用于深度排名的 REM 强化信号。
- 永不写入 `MEMORY.md`。

## Session 记录摄取

Dreaming 可以将已脱敏的 Session 记录摄取到 dreaming 语料库中。当记录可用时，它们与每日内存信号和召回痕迹一起被送入轻度阶段。个人和敏感内容在摄取前会被脱敏处理。

## 梦境日记

Dreaming 还在 `DREAMS.md` 中保留一份叙述性**梦境日记**。每个阶段积累足够材料后，`memory-core` 会运行一个尽力而为的后台子 Agent 回合（使用默认运行时模型）并追加一条简短的日记条目。

此日记供人类在 Dreams UI 中阅读，不作为升级来源。

还有一个用于审阅和恢复工作的有依据的历史回填通道：

- `memory rem-harness --path ... --grounded` 从历史 `YYYY-MM-DD.md` 笔记预览有依据的日记输出。
- `memory rem-backfill --path ...` 将可逆的有依据日记条目写入 `DREAMS.md`。
- `memory rem-backfill --path ... --stage-short-term` 将有依据的持久候选项暂存到正常深度阶段已使用的同一短期证据存储中。
- `memory rem-backfill --rollback` 和 `--rollback-short-term` 删除这些暂存的回填工件，不影响普通日记条目或实时短期召回。

控制 UI 提供相同的日记回填/重置流程，你可以在决定有依据的候选项是否值得升级之前，在 Dreams 场景中检查结果。该场景还显示一个独特的有依据通道，让你能看到哪些暂存的短期条目来自历史重放，哪些升级项目是有依据引导的，并仅清除有依据的暂存条目而不影响普通实时短期状态。

## 深度排名信号

深度排名使用六个加权基础信号加阶段强化：

| 信号         | 权重 | 描述                                     |
| ------------ | ---- | ---------------------------------------- |
| 频率         | 0.24 | 条目累积的短期信号数量                   |
| 相关性       | 0.30 | 条目的平均检索质量                       |
| 查询多样性   | 0.15 | 出现该条目的不同查询/日期上下文数        |
| 近期性       | 0.15 | 时间衰减的新鲜度分数                     |
| 整合度       | 0.10 | 多日复现强度                             |
| 概念丰富度   | 0.06 | 片段/路径的概念标签密度                  |

来自 `memory/.dreams/phase-signals.json` 的轻度和 REM 阶段命中会添加一个小的近期性衰减加成。

## 调度

启用后，`memory-core` 自动管理一个完整 dreaming 扫描的定时任务。每次扫描按顺序运行各阶段：轻度 -> REM -> 深度。

默认节奏行为：

| 设置                 | 默认值        |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *`   |

## 快速开始

启用 dreaming：

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

使用自定义扫描节奏启用 dreaming：

```json
{
  "plugins": {
    "entries": {
      "memory-core": {
        "config": {
          "dreaming": {
            "enabled": true,
            "timezone": "America/Los_Angeles",
            "frequency": "0 */6 * * *"
          }
        }
      }
    }
  }
}
```

## Slash 命令

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI 工作流程

使用 CLI 升级进行预览或手动应用：

```bash
openclaw memory promote
openclaw memory promote --apply
openclaw memory promote --limit 5
openclaw memory status --deep
```

手动 `memory promote` 默认使用深度阶段阈值，除非使用 CLI 参数覆盖。

解释特定候选项是否会升级的原因：

```bash
openclaw memory promote-explain "router vlan"
openclaw memory promote-explain "router vlan" --json
```

预览 REM 反思、候选真相和深度升级输出，不写入任何内容：

```bash
openclaw memory rem-harness
openclaw memory rem-harness --json
```

## 关键默认值

所有设置位于 `plugins.entries.memory-core.config.dreaming` 下。

| 键          | 默认值        |
| ----------- | ------------- |
| `enabled`   | `false`       |
| `frequency` | `0 3 * * *`   |

阶段策略、阈值和存储行为是内部实现细节（非用户可配置项）。

参见[内存配置参考](/reference/memory-config#dreaming-experimental)了解完整键列表。

## Dreams UI

启用后，Gateway 的 **Dreams** 标签页显示：

- 当前 dreaming 启用状态
- 阶段级别状态和托管扫描是否存在
- 短期、有依据、信号和今日已升级计数
- 下次计划运行时间
- 用于暂存历史重放条目的独特有依据场景通道
- 由 `doctor.memory.dreamDiary` 支持的可展开梦境日记阅读器

## 相关链接

- [Memory](/concepts/memory)
- [Memory Search](/concepts/memory-search)
- [memory CLI](/cli/memory)
- [内存配置参考](/reference/memory-config)
