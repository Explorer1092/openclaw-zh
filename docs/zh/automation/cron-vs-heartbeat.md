---
title: "Cron 与心跳：何时使用"
sidebarTitle: "Cron 与心跳"
mmh3_hash: "d825b89263c0333fe120f94738270368"
summary: "关于在自动化中选择心跳还是 cron 作业的指导"
read_when:
  - 决定如何调度重复任务时
  - 设置后台监控或通知时
  - 优化定期检查的 token 使用时
---

# Cron 与心跳：何时使用

心跳和 cron 作业都可以让你按计划运行任务。本指南帮助你为你的用例选择正确的机制。

## 快速决策指南

| 用例 | 推荐 | 原因 |
| ------------------------------------ | ------------------- | ---------------------------------------- |
| 每 30 分钟检查一次收件箱 | 心跳 | 与其他检查批量处理，上下文感知 |
| 早上 9 点准时发送报告 | Cron（isolated） | 需要确切的时间 |
| 监控日历中的即将到来的事件 | 心跳 | 定期感知的自然选择 |
| 运行每周深度分析 | Cron（isolated） | 独立任务，可以使用不同的模型 |
| 20 分钟后提醒我 | Cron（main，`--at`） | 具有精确计时的一次性任务 |
| 后台项目健康检查 | 心跳 | 搭载在现有周期上 |

## 心跳：定期感知

心跳以定期间隔（默认：30 分钟）在 **主 session** 中运行。它们旨在让 Agent 检查事物并浮现任何重要信息。

### 何时使用心跳

- **多个定期检查**：与其用 5 个单独的 cron 作业检查收件箱、日历、天气、通知和项目状态，不如用单次心跳批量处理所有这些。
- **上下文感知决策**：Agent 具有完整的主 session 上下文，因此可以做出关于什么紧急、什么可以等待的明智决策。
- **对话连续性**：心跳运行共享同一 session，因此 Agent 记得最近的对话并可以自然跟进。
- **低开销监控**：一次心跳代替许多小型轮询任务。

### 心跳的优势

- **批量多个检查**：一次 Agent 回合可以同时检查收件箱、日历和通知。
- **减少 API 调用**：单次心跳比 5 个 isolated cron 作业更便宜。
- **上下文感知**：Agent 知道你在处理什么，可以相应地确定优先级。
- **智能抑制**：如果没有需要关注的内容，Agent 回复 `HEARTBEAT_OK` 且不传递消息。
- **自然时机**：根据队列负载略有漂移，对大多数监控来说没问题。

### 心跳示例：HEARTBEAT.md 清单

```md
# 心跳清单

- 检查紧急消息的电子邮件
- 检查接下来 2 小时内的日历事件
- 如果后台任务完成，总结结果
- 如果空闲 8 小时以上，发送简短的签到
```

Agent 在每次心跳时读取此内容，并在一次回合中处理所有项目。

### 配置心跳

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 间隔
        target: "last", // 显式警报传递目标（默认为 "none"）
        activeHours: { start: "08:00", end: "22:00" }, // 可选
      },
    },
  },
}
```

完整配置参见 [Heartbeat](/gateway/heartbeat)。

## Cron：精确调度

Cron 作业在精确时间运行，可以在 isolated session 中运行而不影响主上下文。
周期性的整点计划会自动在 0-5 分钟窗口内通过每作业的确定性
偏移量分散。

### 何时使用 cron

- **需要精确时间**："每周一上午 9:00 发送"（不是"大约 9 点左右"）。
- **独立任务**：不需要对话上下文的任务。
- **不同的模型/thinking**：值得使用更强大模型的重度分析。
- **一次性提醒**：使用 `--at` 的"20 分钟后提醒我"。
- **嘈杂/频繁的任务**：会使主 session 历史杂乱的任务。
- **外部触发**：应该独立于 agent 是否活跃而运行的任务。

### Cron 的优势

- **精确时机**：带时区支持的 5 字段或 6 字段（秒）cron 表达式。
- **内置负载分散**：周期性的整点计划默认错开最多 5 分钟。
- **每作业控制**：使用 `--stagger <duration>` 覆盖错开，或使用 `--exact` 强制精确时间。
- **Session 隔离**：在 `cron:<jobId>` 中运行，不污染主历史。
- **模型覆盖**：每作业使用更便宜或更强大的模型。
- **传递控制**：Isolated 作业默认为 `announce`（摘要）；根据需要选择 `none`。
- **立即传递**：Announce 模式直接发布，无需等待心跳。
- **不需要 Agent 上下文**：即使主 session 空闲或已压缩也能运行。
- **支持一次性**：`--at` 用于精确的未来时间戳。

### Cron 示例：每日早晨简报

```bash
openclaw cron add \
  --name "Morning briefing" \
  --cron "0 7 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Generate today's briefing: weather, calendar, top emails, news summary." \
  --model opus \
  --announce \
  --channel whatsapp \
  --to "+15551234567"
```

这在纽约时间早上 7:00 精确运行，使用 Opus 保证质量，并直接向 WhatsApp 通知摘要。

### Cron 示例：一次性提醒

```bash
openclaw cron add \
  --name "Meeting reminder" \
  --at "20m" \
  --session main \
  --system-event "Reminder: standup meeting starts in 10 minutes." \
  --wake now \
  --delete-after-run
```

完整 CLI 参考参见 [Cron 作业](/automation/cron-jobs)。

## 决策流程图

```
任务是否需要在确切时间运行？
  是 -> 使用 cron
  否 -> 继续...

任务是否需要与主 session 隔离？
  是 -> 使用 cron（isolated）
  否 -> 继续...

这个任务是否可以与其他定期检查批量处理？
  是 -> 使用心跳（添加到 HEARTBEAT.md）
  否 -> 使用 cron

这是一次性提醒吗？
  是 -> 使用带 --at 的 cron
  否 -> 继续...

它是否需要不同的模型或 thinking 级别？
  是 -> 使用 cron（isolated）带 --model/--thinking
  否 -> 使用心跳
```

## 组合使用两者

最高效的设置**同时使用两者**：

1. **心跳**处理常规监控（收件箱、日历、通知），每 30 分钟在一次批量回合中完成。
2. **Cron**处理精确计划（每日报告、每周回顾）和一次性提醒。

### 示例：高效的自动化设置

**HEARTBEAT.md**（每 30 分钟检查）：

```md
# 心跳清单

- 扫描收件箱中的紧急邮件
- 检查接下来 2 小时内的日历事件
- 检查任何待处理的任务
- 如果安静了 8 小时以上，轻度签到
```

**Cron 作业**（精确时间）：

```bash
# 每天早上 7 点的每日简报
openclaw cron add --name "Morning brief" --cron "0 7 * * *" --session isolated --message "..." --announce

# 每周一上午 9 点的每周项目回顾
openclaw cron add --name "Weekly review" --cron "0 9 * * 1" --session isolated --message "..." --model opus

# 一次性提醒
openclaw cron add --name "Call back" --at "2h" --session main --system-event "Call back the client" --wake now
```

## Lobster：带审批的确定性工作流

Lobster 是需要确定性执行和显式审批的**多步骤工具管道**的工作流运行时。
当任务不止是单次 agent 回合，且你需要带有人工检查点的可恢复工作流时，使用它。

### Lobster 适用的场景

- **多步骤自动化**：你需要固定的工具调用管道，而不是一次性的提示。
- **审批门控**：副作用应暂停直到你批准，然后继续。
- **可恢复运行**：在不重新运行之前步骤的情况下继续暂停的工作流。

### 如何与心跳和 cron 配合

- **心跳/cron** 决定运行*何时*发生。
- **Lobster** 定义运行开始后*发生什么步骤*。

对于计划工作流，使用 cron 或心跳触发调用 Lobster 的 agent 回合。
对于临时工作流，直接调用 Lobster。

### 操作注意事项（来自代码）

- Lobster 以**本地子进程**（`lobster` CLI）在工具模式下运行，并返回 **JSON 封装**。
- 如果工具返回 `needs_approval`，则使用 `resumeToken` 和 `approve` 标志恢复。
- 该工具是**可选插件**；通过 `tools.alsoAllow: ["lobster"]` 附加启用（推荐）。
- Lobster 期望 `lobster` CLI 在 `PATH` 上可用。

完整用法和示例参见 [Lobster](/tools/lobster)。

## 主 Session 与 Isolated Session

心跳和 cron 都可以与主 session 交互，但方式不同：

|         | 心跳                       | Cron（main）              | Cron（isolated）                                 |
| ------- | ------------------------------- | ------------------------ | ----------------------------------------------- |
| Session | Main                            | Main（通过系统事件）  | `cron:<jobId>` 或自定义 session                |
| 历史 | 共享                          | 共享                     | 每次运行全新（isolated）/ 持久化（custom）           |
| 上下文 | 完整                            | 完整                     | 无（isolated）/ 累积（custom）           |
| 模型   | 主 session 模型              | 主 session 模型       | 可以覆盖                                    |
| 输出  | 如果不是 `HEARTBEAT_OK` 则传递 | 心跳提示 + 事件 | 通知摘要（默认）                      |

### 何时使用 main session cron

当你想要以下情况时使用带 `--system-event` 的 `--session main`：

- 提醒/事件出现在主 session 上下文中
- Agent 在下一次带完整上下文的心跳期间处理它
- 没有单独的 isolated 运行

```bash
openclaw cron add \
  --name "Check project" \
  --every "4h" \
  --session main \
  --system-event "Time for a project health check" \
  --wake now
```

### 何时使用 isolated cron

当你想要以下情况时使用 `--session isolated`：

- 没有先前上下文的干净起点
- 不同的模型或 thinking 设置
- 直接向 channel 通知摘要
- 不使主 session 历史杂乱的历史记录

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 0" \
  --session isolated \
  --message "Weekly codebase analysis..." \
  --model opus \
  --thinking high \
  --announce
```

## 成本考虑

| 机制       | 成本概况                                            |
| --------------- | ------------------------------------------------------- |
| 心跳       | 每 N 分钟一次回合；随 HEARTBEAT.md 大小扩展 |
| Cron（main）     | 将事件添加到下一次心跳（无 isolated 回合）         |
| Cron（isolated） | 每作业完整的 agent 回合；可以使用更便宜的模型          |

**提示**：

- 保持 `HEARTBEAT.md` 简短以减少 token 开销。
- 将类似的检查批量纳入心跳，而不是多个 cron 作业。
- 如果只想要内部处理，在心跳上使用 `target: "none"`。
- 对常规任务使用带更便宜模型的 isolated cron。

## 相关

- [Heartbeat](/gateway/heartbeat) - 完整的心跳配置
- [Cron 作业](/automation/cron-jobs) - 完整的 cron CLI 和 API 参考
- [System](/cli/system) - 系统事件 + 心跳控制
