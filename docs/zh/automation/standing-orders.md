---
mmh3_hash: "0ab20e103e5c0e588178240868625515"
summary: "为自主 Agent 程序定义永久操作权限"
read_when:
  - 设置无需逐任务提示即可运行的自主 Agent 工作流时
  - 定义 Agent 可以独立做什么以及什么需要人工批准时
  - 构建具有清晰边界和升级规则的多程序 Agent 时
title: "Standing Orders"
---

Standing Orders 为你的 Agent 授予针对已定义程序的**永久操作权限**。你不需要每次给出单独的任务指令，而是定义具有明确范围、触发器和升级规则的程序——Agent 在这些边界内自主执行。

这就像是告诉你的助手"发送每周报告"与授予常驻权限的区别："你负责每周报告。每周五编写它、发送它，只有在出现异常时才升级。"

## 为什么需要 Standing Orders

**没有 Standing Orders 时：**

- 你必须为每个任务提示 Agent
- Agent 在请求之间保持空闲
- 日常工作被遗忘或延迟
- 你成为瓶颈

**有了 Standing Orders 后：**

- Agent 在已定义的边界内自主执行
- 日常工作按计划进行，无需提示
- 你只在出现例外和需要批准时介入
- Agent 充分利用空闲时间

## 工作原理

Standing Orders 定义在你的 [Agent 工作区](/concepts/agent-workspace) 文件中。推荐的方式是直接包含在 `AGENTS.md` 中（每个 Session 自动注入），确保 Agent 始终将其保留在上下文中。对于更大的配置，你也可以将它们放在专用文件（如 `standing-orders.md`）中，并从 `AGENTS.md` 引用它。

每个程序指定：

1. **范围** - Agent 被授权做什么
2. **触发器** - 何时执行（计划、事件或条件）
3. **批准门控** - 什么需要人工签字才能行动
4. **升级规则** - 何时停止并寻求帮助

Agent 通过工作区引导文件（完整的自动注入文件列表见 [Agent 工作区](/concepts/agent-workspace)）在每个 Session 加载这些指令，并与[Cron 任务](/automation/cron-jobs)结合执行基于时间的强制执行。

<Tip>
将 Standing Orders 放入 `AGENTS.md` 以保证每个 Session 都加载它们。工作区引导自动注入 `AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md` 和 `MEMORY.md`，但不注入子目录中的任意文件。
</Tip>

## Standing Order 的结构

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad - report accurately
```

## Standing Orders 与 Cron 任务

Standing Orders 定义 Agent **有权**做什么。[Cron 任务](/automation/cron-jobs)定义**何时**发生。它们协同工作：

```
Standing Order: "你负责每日收件箱分类"
    ↓
Cron 任务（每天 8 AM）："按照 Standing Orders 执行收件箱分类"
    ↓
Agent：读取 Standing Orders → 执行步骤 → 报告结果
```

Cron 任务提示词应引用 Standing Order 而非复制它：

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## 示例

### 示例 1：内容和社交媒体（每周循环）

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday-Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### 示例 2：财务操作（事件触发）

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When new data arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### 示例 3：监控和告警（持续）

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## 执行-验证-报告模式

与严格的执行纪律相结合，Standing Orders 效果最佳。Standing Order 中的每个任务都应遵循这个循环：

1. **执行** - 完成实际工作（不只是确认指令）
2. **验证** - 确认结果正确（文件存在、消息已交付、数据已解析）
3. **报告** - 告知负责人完成了什么以及已验证了什么

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

这种模式防止了最常见的 Agent 失败模式：确认任务而不实际完成它。

## 多程序架构

对于管理多个关注点的 Agent，将 Standing Orders 组织为具有清晰边界的独立程序：

```markdown
## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

每个程序应有：

- 自己的**触发节奏**（每周、每月、事件驱动、持续）
- 自己的**批准门控**（某些程序需要更多监督）
- 清晰的**边界**（Agent 应该知道一个程序在哪里结束，另一个在哪里开始）

## 最佳实践

### 应该

- 从窄权限开始，随着信任的建立而扩展
- 为高风险操作定义明确的批准门控
- 包含"不应该做什么"部分——边界与权限同样重要
- 与 Cron 任务结合以实现可靠的基于时间的执行
- 每周回顾 Agent 日志以验证 Standing Orders 是否被遵守
- 随着需求的演变更新 Standing Orders——它们是活动文档

### 避免

- 第一天就授予广泛权限（"做你认为最好的事"）
- 跳过升级规则——每个程序都需要"何时停止和询问"条款
- 假设 Agent 会记住口头指令——把所有内容写入文件
- 在单个程序中混合关注点——不同领域使用独立程序
- 忘记用 Cron 任务强制执行——没有触发器的 Standing Orders 变成了建议

## 相关

- [自动化与任务](/automation)：所有自动化机制概览。
- [Cron 任务](/automation/cron-jobs)：Standing Orders 的计划执行。
- [Hooks](/automation/hooks)：Agent 生命周期事件的事件驱动脚本。
- [Webhooks](/automation/cron-jobs#webhooks)：入站 HTTP 事件触发器。
- [Agent 工作区](/concepts/agent-workspace)：Standing Orders 存放的地方，包括自动注入引导文件的完整列表（`AGENTS.md`、`SOUL.md` 等）。
