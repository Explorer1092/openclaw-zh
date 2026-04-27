---
mmh3_hash: "15279d598ced9561165c45385c4fe392"
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

## 可靠的定时工作流模式

对于市场情报简报等周期性工作流，将调度、编排和可靠性检查视为独立的层：

1. 使用[定时任务](/automation/cron-jobs)控制时间。
2. 当工作流需要在之前上下文上构建时，使用持久 Cron Session。
3. 使用 [Lobster](/tools/lobster) 处理确定性步骤、审批门和恢复令牌。
4. 使用 Task Flow 跨子任务、等待、重试和 Gateway 重启追踪多步骤运行。

Cron 示例形式：

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

当周期性工作流需要特意保留历史记录、之前的运行摘要或持久上下文时，使用 `session:<id>` 而非 `isolated`。当每次运行应从全新状态开始且所有必要状态在工作流中已明确提供时，使用 `isolated`。

在工作流内部，在 LLM 摘要步骤之前进行可靠性检查：

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

推荐的预检项目：

- 浏览器可用性和 Profile 选择，例如使用 `openclaw` 用于托管状态，或在需要已登录的 Chrome Session 时使用 `user`。参见 [Browser](/tools/browser)。
- 每个来源的 API 凭证和配额。
- 所需端点的网络可达性。
- Agent 所需工具已启用，例如 `lobster`、`browser` 和 `llm-task`。
- 已为 Cron 配置失败通知目标，以便预检失败可见。参见[定时任务](/automation/cron-jobs#delivery-and-output)。

每个收集项目的推荐数据溯源字段：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

在摘要处理前，工作流应拒绝或标记陈旧项目。LLM 步骤应只接收结构化 JSON，并被要求在输出中保留 `sourceUrl`、`retrievedAt` 和 `asOf`。当工作流内需要经过 Schema 验证的模型步骤时，使用 [LLM Task](/tools/llm-task)。

对于可复用的团队或社区工作流，将 CLI、`.lobster` 文件和任何设置说明打包为 Skill 或 Plugin，并通过 [ClawHub](/tools/clawhub) 发布。除非 Plugin API 缺少所需的通用功能，否则请将工作流特定的 guardrail 保留在该包中。

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

## 相关

- [后台任务](/automation/tasks) — 流程协调的后台工作账本
- [CLI：tasks](/cli/tasks) — `openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/automation) — 所有自动化机制一览
- [Cron 作业](/automation/cron-jobs) — 可能馈入流程的定时作业
