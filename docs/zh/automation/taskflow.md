---
mmh3_hash: "42659931bb7073603491e4a027574a02"
summary: "Task Flow：后台任务之上的流程编排层"
read_when:
  - 想了解 Task Flow 与后台任务的关系时
  - 在发布说明或文档中遇到 Task Flow 或 openclaw tasks flow 时
  - 想检查或管理持久流程状态时
title: "Task Flow"
---

# Task Flow

Task Flow 是位于[后台任务](/automation/tasks)之上的流程编排基础设施。它管理具有独立状态、修订追踪和同步语义的持久多步骤流程，而各个任务仍然是后台工作的基本单元。

## 何时使用 Task Flow

当工作跨越多个顺序或分支步骤，且需要在 Gateway 重启后持久追踪进度时，使用 Task Flow。对于单个后台操作，一个普通[任务](/automation/tasks)就足够了。

| 场景                                   | 使用                  |
| -------------------------------------- | --------------------- |
| 单个后台作业                           | 普通任务              |
| 多步骤管道（A 然后 B 然后 C）          | Task Flow（托管模式） |
| 观察外部创建的任务                     | Task Flow（镜像模式） |
| 一次性提醒                             | Cron 作业             |

## 同步模式

### 托管模式

Task Flow 端到端拥有生命周期。它将任务创建为流程步骤，驱动它们完成，并自动推进流程状态。

示例：一个每周报告流程，（1）收集数据，（2）生成报告，（3）传递报告。Task Flow 将每个步骤创建为后台任务，等待完成，然后进入下一步。

```
流程：weekly-report
  步骤 1：gather-data     → 任务已创建 → 成功
  步骤 2：generate-report → 任务已创建 → 成功
  步骤 3：deliver         → 任务已创建 → 运行中
```

### 镜像模式

Task Flow 观察外部创建的任务，并在不接管任务创建所有权的情况下保持流程状态同步。当任务来自 Cron 作业、CLI 命令或其他来源，且你想要作为流程统一查看其进度时，这非常有用。

示例：三个独立的 Cron 作业共同构成"早晨运维"例程。镜像流程追踪它们的整体进度，而不控制它们何时或如何运行。

## 持久状态和修订追踪

每个流程持久保存自己的状态，并追踪修订，以便在 Gateway 重启后进度依然保留。修订追踪能够在多个来源尝试同时推进同一流程时进行冲突检测。

## 取消行为

`openclaw tasks flow cancel` 在流程上设置一个粘性取消意图。流程中的活动任务会被取消，不会启动新步骤。取消意图在重启后持续存在，因此即使 Gateway 在所有子任务终止之前重启，已取消的流程也会保持取消状态。

## CLI 命令

```bash
# 列出活动和近期流程
openclaw tasks flow list

# 显示特定流程的详情
openclaw tasks flow show <lookup>

# 取消运行中的流程及其活动任务
openclaw tasks flow cancel <lookup>
```

| 命令                                | 描述                                    |
| ----------------------------------- | --------------------------------------- |
| `openclaw tasks flow list`          | 显示带有状态和同步模式的追踪流程        |
| `openclaw tasks flow show <id>`     | 按流程 ID 或查找键检查一个流程          |
| `openclaw tasks flow cancel <id>`   | 取消运行中的流程及其活动任务            |

## 流程与任务的关系

流程协调任务，而不是替代任务。一个流程在其生命周期中可能驱动多个后台任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查编排流程。

## 相关文档

- [后台任务](/automation/tasks) — 流程协调的后台工作账本
- [CLI：tasks](/cli/index#tasks) — `openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/automation) — 所有自动化机制一览
- [Cron 作业](/automation/cron-jobs) — 可能馈入流程的定时作业
