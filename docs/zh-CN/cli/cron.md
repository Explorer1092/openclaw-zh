---
read_when:
  - 你需要定时作业和唤醒功能
  - 你正在调试 cron 执行和日志
summary: "`openclaw cron` 的 CLI 参考（调度和运行后台作业）"
title: cron
x-i18n:
  generated_at: "2026-02-03T07:44:47Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: ed0241f64d1a2d43191e331bf908b513b512697c629ae0416050a26288ad079c
  source_path: cli/cron.md
  workflow: 15
---

# `openclaw cron`

管理 Gateway 网关调度器的 cron 作业。

相关内容：

- Cron 作业：[Cron 作业](/automation/cron-jobs)

提示：运行 `openclaw cron --help` 查看完整的命令集。

说明：隔离式 `cron add` 任务默认使用 `--announce` 投递。使用 `--no-deliver` 仅内部运行。
`--deliver` 仍作为 `--announce` 的弃用别名保留。

说明：一次性（`--at`）任务成功后默认删除。使用 `--keep-after-run` 保留。

说明：对于一次性 CLI 任务，无偏移量的 `--at` 日期时间被视为 UTC，除非你同时传递 `--tz <iana>`，这会将该本地时钟时间解释为给定时区。

说明：定期任务在连续出错后现在使用指数退避重试（30s → 1m → 5m → 15m → 60m），下次成功运行后恢复正常调度。

说明：`openclaw cron run` 现在在手动运行加入执行队列后立即返回。成功响应包括 `{ ok: true, enqueued: true, runId }`；使用 `openclaw cron runs --id <job-id>` 跟踪最终结果。

说明：保留/修剪由配置控制：

- `cron.sessionRetention`（默认 `24h`）修剪已完成的隔离运行会话。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 修剪 `~/.openclaw/cron/runs/<jobId>.jsonl`。

升级说明：如果你有当前投递/存储格式之前的旧版 cron 作业，请运行
`openclaw doctor --fix`。Doctor 现在会规范化旧版 cron 字段（`jobId`、`schedule.cron`、
顶层投递字段、载荷 `provider` 投递别名），并在配置了 `cron.webhook` 时将简单的
`notify: true` webhook 回退作业迁移为显式 webhook 投递。

## 常见编辑

更新投递设置而不更改消息：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离的作业禁用投递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离的作业启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

向特定渠道发布：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

创建带轻量级引导上下文的隔离作业：

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离的智能体轮次作业。对于 cron 运行，轻量级模式保持引导上下文为空，而不是注入完整的工作区引导集。
