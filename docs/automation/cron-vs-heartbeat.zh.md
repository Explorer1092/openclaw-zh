---
mmh3_hash: "54caeb38fea2fb6aad577024658879b5"
summary: "关于在自动化中选择心跳还是 cron 作业的指导"
read_when:
  - 决定如何调度重复任务时
  - 设置后台监控或通知时
  - 优化定期检查的 token 使用时
---
# Cron vs 心跳：何时使用

心跳和 cron 作业都可以让你按计划运行任务。本指南帮助你为你的用例选择正确的机制。

## 快速决策指南

| 用例 | 推荐 | 原因 |
|----------|-------------|-----|
| 每 30 分钟检查一次收件箱 | 心跳 | 与其他检查批量处理，上下文感知 |
| 早上 9 点准时发送报告 | Cron (隔离) | 需要确切的时间 |
| 监控日历中的即将到来的事件 | 心跳 | 定期感知的自然选择 |
| 运行每周深度分析 | Cron (隔离) | 独立任务，可以使用不同的模型 |
| 20 分钟后提醒我 | Cron (主会话, `--at`) | 具有精确计时的一次性任务 |
| 后台项目健康检查 | 心跳 | 搭载在现有周期上 |

## 心跳：定期感知

心跳以定期间隔（默认：30 分钟）在 **主会话** 中运行。它们旨在让智能体检查事物并浮现任何重要信息。

### 何时使用心跳

- **多个定期检查**：与其使用 5 个单独的 cron 作业分别检查收件箱、日历、天气、通知和项目状态，不如使用单个心跳批量处理所有这些。
- **上下文感知决策**：智能体拥有完整的主会话上下文，因此它可以就什么紧急与什么可以等待做出明智的决定。
- **对话连续性**：心跳运行共享相同的会话，因此智能体记住最近的对话并可以自然地跟进。
- **低开销监控**：一个心跳取代许多小的轮询任务。

### 心跳优势

- **批量处理多个检查**：一个智能体回合可以一起审查收件箱、日历和通知。
- **减少 API 调用**：单个心跳比 5 个隔离的 cron 作业便宜。
- **上下文感知**：智能体知道你一直在做什么，并可以据此确定优先级。
- **智能抑制**：如果不需要注意，智能体回复 `HEARTBEAT_OK` 且不传递任何消息。
- **自然计时**：根据队列负载略有漂移，这对于大多数监控来说都很好。

### 心跳示例：HEARTBEAT.md 清单

```md
# Heartbeat checklist

- Check email for urgent messages
- Review calendar for events in next 2 hours
- If a background task finished, summarize results
- If idle for 8+ hours, send a brief check-in
```

智能体在每次心跳时阅读此内容，并在一个回合中处理所有项目。

### 配置心跳

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",        // 间隔
        target: "last",      // 在哪里传递警报
        activeHours: { start: "08:00", end: "22:00" }  // 可选
      }
    }
  }
}
```

有关完整配置，请参见 [心跳](/gateway/heartbeat)。

## Cron：精确调度

Cron 作业在 **确切时间** 运行，可以在隔离会话中运行而不影响主上下文。

### 何时使用 cron

- **需要确切计时**：“每周一上午 9:00 发送这个”（不是“9 点左右某个时间”）。
- **独立任务**：不需要对话上下文的任务。
- **不同的模型/思考**：值得使用更强大模型的繁重分析。
- **一次性提醒**：使用 `--at` 的“20 分钟后提醒我”。
- **嘈杂/频繁的任务**：会弄乱主会话历史记录的任务。
- **外部触发器**：应该独立于智能体是否在其他方面处于活动状态而运行的任务。

### Cron 优势

- **确切计时**：带有时区支持的 5 字段 cron 表达式。
- **会话隔离**：在 `cron:<jobId>` 中运行而不污染主历史记录。
- **模型覆盖**：每个作业使用更便宜或更强大的模型。
- **传递控制**：可以直接传递到频道；默认情况下仍向主会话发布摘要（可配置）。
- **无需智能体上下文**：即使主会话空闲或被压缩也会运行。
- **一次性支持**：用于精确未来时间戳的 `--at`。

### Cron 示例：每日晨间简报

```bash
openclaw cron add \
  --name "Morning briefing" \
  --cron "0 7 * * *" \
  --tz "America/New_York" \
  --session isolated \
  --message "Generate today's briefing: weather, calendar, top emails, news summary." \
  --model opus \
  --deliver \
  --channel whatsapp \
  --to "+15551234567"
```

这在纽约时间早上 7:00 准时运行，使用 Opus 保证质量，并直接传递到 WhatsApp。

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

有关完整 CLI 参考，请参见 [Cron 作业](/automation/cron-jobs)。

## 决策流程图

```
任务是否需要在确切时间运行？
  是 -> 使用 cron
  否 -> 继续...

任务是否需要与主会话隔离？
  是 -> 使用 cron (隔离)
  否 -> 继续...

这个任务可以与其他定期检查批量处理吗？
  是 -> 使用心跳 (添加到 HEARTBEAT.md)
  否 -> 使用 cron

这是一次性提醒吗？
  是 -> 使用带有 --at 的 cron
  否 -> 继续...

它是否需要不同的模型或思考级别？
  是 -> 使用带有 --model/--thinking 的 cron (隔离)
  否 -> 使用心跳
```

## 结合两者

最高效的设置使用 **两者**：

1. **心跳** 每 30 分钟在一个批处理回合中处理常规监控（收件箱、日历、通知）。
2. **Cron** 处理精确的计划（每日报告、每周审查）和一次性提醒。

### 示例：高效的自动化设置

**HEARTBEAT.md** (每 30 分钟检查一次):
```md
# Heartbeat checklist
- Scan inbox for urgent emails
- Check calendar for events in next 2h
- Review any pending tasks
- Light check-in if quiet for 8+ hours
```

**Cron 作业** (精确计时):
```bash
# 早上 7 点的每日晨间简报
openclaw cron add --name "Morning brief" --cron "0 7 * * *" --session isolated --message "..." --deliver

# 周一上午 9 点的每周项目审查
openclaw cron add --name "Weekly review" --cron "0 9 * * 1" --session isolated --message "..." --model opus

# 一次性提醒
openclaw cron add --name "Call back" --at "2h" --session main --system-event "Call back the client" --wake now
```


## Lobster：带有批准的确定性工作流

Lobster 是用于 **多步骤工具管道** 的工作流运行时，需要确定性执行和显式批准。
当任务不仅仅是单个智能体回合，并且你想要一个带有人工检查点的可恢复工作流时使用它。

### Lobster 何时适用

- **多步骤自动化**：你需要一个固定的工具调用管道，而不是一次性的提示词。
- **批准门控**：副作用应该暂停直到你批准，然后恢复。
- **可恢复运行**：继续暂停的工作流而不重新运行较早的步骤。

### 它如何与心跳和 cron 搭配

- **心跳/cron** 决定 *何时* 运行发生。
- **Lobster** 定义运行开始后 *发生什么步骤*。

对于计划的工作流，使用 cron 或心跳来触发调用 Lobster 的智能体回合。
对于临时工作流，直接调用 Lobster。

### 运维说明 (来自代码)

- Lobster 作为工具模式下的 **本地子进程** (`lobster` CLI) 运行并返回 **JSON 信封**。
- 如果工具返回 `needs_approval`，你使用 `resumeToken` 和 `approve` 标志恢复。
- 该工具是一个 **可选插件**；通过 `tools.alsoAllow: ["lobster"]` 累加启用它（推荐）。
- 如果你传递 `lobsterPath`，它必须是一个 **绝对路径**。

有关完整用法和示例，请参见 [Lobster](/tools/lobster)。

## 主会话 vs 隔离会话

心跳和 cron 都可以与主会话交互，但方式不同：

| | 心跳 | Cron (主会话) | Cron (隔离) |
|---|---|---|---|
| 会话 | 主会话 | 主会话 (通过系统事件) | `cron:<jobId>` |
| 历史 | 共享 | 共享 | 每次运行全新 |
| 上下文 | 完整 | 完整 | 无 (开始时干净) |
| 模型 | 主会话模型 | 主会话模型 | 可覆盖 |
| 输出 | 如果不是 `HEARTBEAT_OK` 则传递 | 心跳提示词 + 事件 | 摘要发布到主会话 |

### 何时使用主会话 cron

当你想要以下内容时，使用带有 `--system-event` 的 `--session main`：
- 提醒/事件出现在主会话上下文中
- 智能体在下一次心跳期间以完整的上下文处理它
- 没有单独的隔离运行

```bash
openclaw cron add \
  --name "Check project" \
  --every "4h" \
  --session main \
  --system-event "Time for a project health check" \
  --wake now
```

### 何时使用隔离 cron

当你想要以下内容时，使用 `--session isolated`：
- 没有先前上下文的干净状态
- 不同的模型或思考设置
- 输出直接传递到频道（摘要默认仍发布到主会话）
- 不会弄乱主会话的历史记录

```bash
openclaw cron add \
  --name "Deep analysis" \
  --cron "0 6 * * 0" \
  --session isolated \
  --message "Weekly codebase analysis..." \
  --model opus \
  --thinking high \
  --deliver
```

## 成本考虑

| 机制 | 成本概况 |
|-----------|--------------|
| 心跳 | 每 N 分钟一个回合；随 HEARTBEAT.md 大小扩展 |
| Cron (主会话) | 向下一次心跳添加事件（无隔离回合） |
| Cron (隔离) | 每个作业完整的智能体回合；可以使用更便宜的模型 |

**提示**:
- 保持 `HEARTBEAT.md` 小以最小化 token 开销。
- 将类似的检查批量处理到心跳中，而不是多个 cron 作业。
- 如果你只想要内部处理，在心跳上使用 `target: "none"`。
- 对常规任务使用带有更便宜模型的隔离 cron。

## 相关

- [心跳](/gateway/heartbeat) - 完整的心跳配置
- [Cron 作业](/automation/cron-jobs) - 完整的 cron CLI 和 API 参考
- [系统](/cli/system) - 系统事件 + 心跳控制
