---
mmh3_hash: "064f5e4847dfa56769c73fc219cb7c08"
summary: "后台内存整合系统，包含轻度、深度和 REM 阶段以及梦境日记"
title: "Dreaming"
sidebarTitle: "Dreaming"
read_when:
  - 您希望内存升级自动运行
  - 您想了解每个 dreaming 阶段的作用
  - 您希望在不污染 MEMORY.md 的情况下调整整合频率
---

Dreaming 是 `memory-core` 中的后台内存整合系统。它帮助 OpenClaw 将强短期信号转移到持久内存中，同时保持过程的可解释性和可审查性。

<Note>
Dreaming 是**可选开启**的，默认禁用。
</Note>

## Dreaming 写入的内容

Dreaming 保存两类输出：

- **机器状态**：位于 `memory/.dreams/`（召回存储、阶段信号、摄入检查点、锁）。
- **人类可读输出**：位于 `DREAMS.md`（或已有的 `dreams.md`），以及 `memory/dreaming/<phase>/YYYY-MM-DD.md` 下的可选阶段报告文件。

长期升级仍仅写入 `MEMORY.md`。

## 阶段模型

Dreaming 使用三个协作阶段：

| 阶段 | 目的 | 持久写入 |
| ----- | ----------------------------------------- | ----------------- |
| Light | 排序并暂存近期短期材料 | 否 |
| Deep | 评分并升级持久候选项 | 是（`MEMORY.md`）|
| REM | 反思主题和反复出现的想法 | 否 |

这些阶段是内部实现细节，不是用户可配置的独立"模式"。

<AccordionGroup>
  <Accordion title="Light 阶段">
    Light 阶段摄入近期每日内存信号和召回追踪，对其去重并暂存候选行。

    - 从短期召回状态、近期每日内存文件以及（当可用时）已脱敏的 Session 记录中读取。
    - 当存储包含内联输出时，写入托管的 `## Light Sleep` 块。
    - 记录强化信号供后续深度排名使用。
    - 绝不写入 `MEMORY.md`。

  </Accordion>
  <Accordion title="Deep 阶段">
    Deep 阶段决定哪些内容成为长期内存。

    - 使用加权评分和阈值门控对候选项排名。
    - 需要通过 `minScore`、`minRecallCount` 和 `minUniqueQueries`。
    - 在写入前从实时每日文件重新注水代码段，以跳过过时/已删除的代码段。
    - 将升级条目追加到 `MEMORY.md`。
    - 向 `DREAMS.md` 写入 `## Deep Sleep` 摘要，并可选地写入 `memory/dreaming/deep/YYYY-MM-DD.md`。

  </Accordion>
  <Accordion title="REM 阶段">
    REM 阶段提取模式和反思信号。

    - 从近期短期追踪构建主题和反思摘要。
    - 当存储包含内联输出时，写入托管的 `## REM Sleep` 块。
    - 记录供深度排名使用的 REM 强化信号。
    - 绝不写入 `MEMORY.md`。

  </Accordion>
</AccordionGroup>

## Session 记录摄入

Dreaming 可将已脱敏的 Session 记录摄入到 dreaming 语料库中。当记录可用时，它们会与每日内存信号和召回追踪一起被送入 Light 阶段。个人和敏感内容在摄入前会被脱敏。

## 梦境日记

Dreaming 还在 `DREAMS.md` 中保存一份叙事性**梦境日记**。每个阶段积累足够材料后，`memory-core` 会运行一个尽力而为的后台子 Agent 轮次并追加一条简短的日记条目。它使用默认运行时模型，除非配置了 `dreaming.model`。如果配置的模型不可用，梦境日记会使用 Session 默认模型重试一次。

<Note>
此日记用于在 Dreams UI 中供人类阅读，而非升级来源。由 Dreaming 生成的日记/报告产物被排除在短期升级之外。只有有据可查的内存代码段才有资格升级到 `MEMORY.md`。
</Note>

还有一个用于审查和恢复工作的有据可查的历史回填通道：

<AccordionGroup>
  <Accordion title="回填命令">
    - `memory rem-harness --path ... --grounded` 从历史 `YYYY-MM-DD.md` 笔记预览有据可查的日记输出。
    - `memory rem-backfill --path ...` 将可逆的有据可查的日记条目写入 `DREAMS.md`。
    - `memory rem-backfill --path ... --stage-short-term` 将有据可查的持久候选项暂存到普通 Deep 阶段已使用的相同短期证据存储中。
    - `memory rem-backfill --rollback` 和 `--rollback-short-term` 删除那些暂存的回填产物，而不影响普通日记条目或实时短期召回。

  </Accordion>
</AccordionGroup>

Control UI 公开了相同的日记回填/重置流程，您可以在梦境场景中检查结果，然后决定有据可查的候选项是否值得升级。该场景还显示一个独特的有据可查的通道，您可以查看哪些暂存的短期条目来自历史重放，哪些升级的项目是有据可查主导的，并仅清除有据可查的暂存条目而不影响普通的实时短期状态。

## 深度排名信号

深度排名使用六个加权基础信号加上阶段强化：

| 信号 | 权重 | 描述 |
| ------------------- | ------ | ------------------------------------------------- |
| 频率 | 0.24 | 条目累积的短期信号数量 |
| 相关性 | 0.30 | 条目的平均检索质量 |
| 查询多样性 | 0.15 | 浮现该条目的不同查询/日期上下文 |
| 时效性 | 0.15 | 时间衰减的新鲜度评分 |
| 整合性 | 0.10 | 多日复现强度 |
| 概念丰富度 | 0.06 | 来自代码段/路径的概念标签密度 |

Light 和 REM 阶段命中从 `memory/.dreams/phase-signals.json` 添加小幅时间衰减增益。

## QA 影子试验报告覆盖

QA Lab 包含一个仅报告的场景，用于探索未来的 dreaming 影子试验如何在升级前审查候选内存。该场景要求 agent 将基线答案与可以使用候选内存的答案进行比较，然后编写一份包含裁决、原因和风险标志的本地报告。

此覆盖有意限定在 QA 范围内。它验证报告产物是否与 `MEMORY.md` 保持分离，以及 agent 是否未声称候选项已被升级。它不会添加生产级影子试验行为或更改深度阶段升级引擎。

## 调度

启用后，`memory-core` 自动管理一个用于完整 dreaming 扫描的 Cron 任务。每次扫描按顺序运行各阶段：light → REM → deep。

扫描包括主要运行时工作区和任何已配置的 Agent 工作区（按路径去重），因此子 Agent 工作区扇出不会排除主 Agent 的 `DREAMS.md` 和内存状态。

默认节奏行为：

| 设置 | 默认值 |
| -------------------- | ------------- |
| `dreaming.frequency` | `0 3 * * *` |
| `dreaming.model` | 默认模型 |

## 快速开始

<Tabs>
  <Tab title="启用 dreaming">
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
  </Tab>
  <Tab title="自定义扫描节奏">
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
  </Tab>
</Tabs>

## Slash 命令

```
/dreaming status
/dreaming on
/dreaming off
/dreaming help
```

## CLI 工作流程

<Tabs>
  <Tab title="升级预览/应用">
    ```bash
    openclaw memory promote
    openclaw memory promote --apply
    openclaw memory promote --limit 5
    openclaw memory status --deep
    ```

    手动 `memory promote` 默认使用 Deep 阶段阈值，除非使用 CLI 标志覆盖。

  </Tab>
  <Tab title="解释升级">
    解释特定候选项为何会或不会升级：

    ```bash
    openclaw memory promote-explain "router vlan"
    openclaw memory promote-explain "router vlan" --json
    ```

  </Tab>
  <Tab title="REM 工具预览">
    预览 REM 反思、候选真相和深度升级输出，不写入任何内容：

    ```bash
    openclaw memory rem-harness
    openclaw memory rem-harness --json
    ```

  </Tab>
</Tabs>

## 关键默认值

所有设置位于 `plugins.entries.memory-core.config.dreaming` 下。

<ParamField path="enabled" type="boolean" default="false">
  启用或禁用 dreaming 扫描。
</ParamField>
<ParamField path="frequency" type="string" default="0 3 * * *">
  完整 dreaming 扫描的 Cron 节奏。
</ParamField>
<ParamField path="model" type="string">
  可选的梦境日记子 Agent 模型覆盖。同时设置子 Agent `allowedModels` 允许列表时，请使用规范的 `provider/model` 值。
</ParamField>

<Warning>
`dreaming.model` 需要 `plugins.entries.memory-core.subagent.allowModelOverride: true`。要限制它，还需设置 `plugins.entries.memory-core.subagent.allowedModels`。信任或允许列表失败时保持可见，而不是静默回退；重试仅涵盖模型不可用的错误。
</Warning>

<Note>
阶段策略、阈值和存储行为是内部实现细节（非用户可见配置）。完整键列表请参阅[内存配置参考](/reference/memory-config#dreaming)。
</Note>

## Dreams UI

启用后，Gateway **Dreams** 标签显示：

- 当前 dreaming 启用状态
- 阶段级状态和托管扫描是否存在
- 短期、有据可查、信号和今日升级的计数
- 下次计划运行时间
- 用于暂存历史重放条目的独特有据可查的场景通道
- 由 `doctor.memory.dreamDiary` 支持的可展开梦境日记阅读器

## Dreaming 从不运行：状态显示已阻止

如果 `openclaw memory status` 报告 `Dreaming status: blocked`，则托管 Cron 任务存在但默认 Agent 心跳未触发。检查默认 Agent 是否启用了心跳，以及其目标是否不是 `none`，然后在下一个心跳间隔后再次运行 `openclaw memory status --deep`。

## 相关

- [内存](/concepts/memory)
- [内存 CLI](/cli/memory)
- [内存配置参考](/reference/memory-config)
- [内存搜索](/concepts/memory-search)
