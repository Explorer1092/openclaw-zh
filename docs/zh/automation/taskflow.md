---
mmh3_hash: "288eacdbce457f01f7603ccdb8d1872b"
summary: "Task Flow：后台任务之上的流程编排层"
read_when:
  - 想了解 Task Flow 与后台任务的关系时
  - 在发布说明或文档中遇到 Task Flow 或 openclaw tasks flow 时
  - 想检查或管理持久化流程状态时
title: "Task Flow"
---

Task Flow 是位于[后台任务](/automation/tasks)之上的流程编排基础设施。它管理持久化多步骤流程，具有独立的状态、修订跟踪和同步语义，而各个任务仍然是后台工作的基本单元。

## 何时使用 Task Flow

当工作跨越多个顺序或分支步骤，且需要在 Gateway 重启后保持持久化进度跟踪时，使用 Task Flow。对于单个后台操作，普通[任务](/automation/tasks)就足够了。

| 场景                              | 使用                   |
| --------------------------------- | ---------------------- |
| 单个后台任务                      | 普通任务               |
| 多步骤流水线（A 然后 B 然后 C）   | Task Flow（托管）      |
| 观察外部创建的任务                | Task Flow（镜像）      |
| 一次性提醒                        | Cron 任务              |

## 可靠的定时工作流模式

对于周期性工作流（如市场情报简报），将调度、编排和可靠性检查作为独立层：

1. 使用[定时任务](/automation/cron-jobs)控制时间。
2. 当工作流需要基于先前上下文时，使用持久化 Cron Session。
3. 使用 [Lobster](/tools/lobster) 处理确定性步骤、批准门控和恢复令牌。
4. 使用 Task Flow 跨子任务、等待、重试和 Gateway 重启跟踪多步骤运行。

Cron 形状示例：

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

当周期性工作流需要刻意积累历史、先前运行摘要或常驻上下文时，使用 `session:<id>` 而非 `isolated`。当每次运行应全新开始且所有必要状态在工作流中明确时，使用 `isolated`。

在工作流内部，将可靠性检查放在 LLM 摘要步骤之前：

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

推荐的预检检查：

- 浏览器可用性和配置文件选择，例如 `openclaw` 用于托管状态，或当需要已登录的 Chrome Session 时使用 `user`。参见 [Browser](/tools/browser)。
- 每个来源的 API 凭证和配额。
- 所需端点的网络可达性。
- 为 Agent 启用的所需工具，如 `lobster`、`browser` 和 `llm-task`。
- 为 Cron 配置的失败目标，以便预检失败可见。参见[定时任务](/automation/cron-jobs#delivery-and-output)。

每个收集项目推荐的数据来源字段：

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

让工作流在汇总之前拒绝或标记过时项目。LLM 步骤应仅接收结构化 JSON，并被要求在其输出中保留 `sourceUrl`、`retrievedAt` 和 `asOf`。当需要在工作流内部进行模式验证的模型步骤时，使用 [LLM Task](/tools/llm-task)。

对于可重用的团队或社区工作流，将 CLI、`.lobster` 文件和任何设置说明打包为 Skill 或插件，并通过 [ClawHub](/clawhub) 发布。除非插件 API 缺少所需的通用功能，否则将工作流特定的守卫保留在该包中。

## 同步模式

### 托管模式

Task Flow 端到端拥有生命周期。它将任务创建为流程步骤，推动它们完成，并自动推进流程状态。

示例：每周报告流程，（1）收集数据，（2）生成报告，（3）交付。Task Flow 将每个步骤创建为后台任务，等待完成，然后进入下一步。

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### 镜像模式

Task Flow 观察外部创建的任务，并在不拥有任务创建权限的情况下保持流程状态同步。当任务来自 Cron 任务、CLI 命令或其他来源，且你希望统一查看其进展作为流程时，这非常有用。

示例：三个独立的 Cron 任务共同构成"早间运营"例程。镜像流程跟踪它们的集体进展，而不控制它们何时或如何运行。

## 持久化状态和修订跟踪

每个流程持久化其自身状态并跟踪修订，使进展在 Gateway 重启后得以保留。修订跟踪支持在多个来源尝试同时推进同一流程时进行冲突检测。流程注册表使用带有有界预写日志维护（包括周期性和关机检查点）的 SQLite，使长期运行的 Gateway 不会保留无限增长的 `registry.sqlite-wal` 侧车文件。

## 取消行为

`openclaw tasks flow cancel` 在流程上设置一个粘性取消意图。流程内的活跃任务会被取消，且不会启动新步骤。取消意图在重启后仍持续，因此即使在所有子任务终止之前 Gateway 重启，已取消的流程也保持取消状态。

## CLI 命令

```bash
# 列出活跃和最近的流程
openclaw tasks flow list

# 显示特定流程的详情
openclaw tasks flow show <lookup>

# 取消正在运行的流程及其活跃任务
openclaw tasks flow cancel <lookup>
```

| 命令                              | 描述                                      |
| --------------------------------- | ----------------------------------------- |
| `openclaw tasks flow list`        | 显示带有状态和同步模式的跟踪流程          |
| `openclaw tasks flow show <id>`   | 按流程 ID 或查找键检查单个流程            |
| `openclaw tasks flow cancel <id>` | 取消正在运行的流程及其活跃任务            |

## 流程与任务的关系

流程协调任务，而非替代它们。单个流程在其生命周期内可能驱动多个后台任务。使用 `openclaw tasks` 检查单个任务记录，使用 `openclaw tasks flow` 检查编排流程。

## 相关

- [后台任务](/automation/tasks) — 流程协调的后台工作账本
- [CLI：tasks](/cli/tasks) — `openclaw tasks flow` 的 CLI 命令参考
- [自动化概览](/automation) — 所有自动化机制概览
- [Cron 任务](/automation/cron-jobs) — 可能流入流程的定时任务
