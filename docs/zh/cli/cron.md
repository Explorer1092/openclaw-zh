---
mmh3_hash: "3e8c85f7da2a46a023ca97db400e6bed"
title: "`openclaw cron`"
sidebarTitle: "openclaw cron"
summary: "`openclaw cron` 的 CLI 参考(安排和运行后台作业)"
read_when:
  - 您想要计划任务和唤醒
  - 您正在调试 cron 执行和日志
---

# `openclaw cron`

管理 Gateway 调度程序的 cron 作业。

相关:

- Cron 作业:[Cron 作业](/automation/cron-jobs)

提示:运行 `openclaw cron --help` 查看完整的命令界面。

注意:隔离的 `cron add` 作业默认使用 `--announce` 传递。使用 `--no-deliver` 来保持输出内部。`--deliver` 仍作为 `--announce` 的已弃用别名保留。

注意:一次性(`--at`)作业默认在成功后删除。使用 `--keep-after-run` 来保留它们。

注意:重复作业现在在连续错误后使用指数重试退避(30秒 → 1分钟 → 5分钟 → 15分钟 → 60分钟),然后在下次成功运行后返回正常计划。

注意:`openclaw cron run` 现在在手动运行排队执行后立即返回。成功响应包括 `{ ok: true, enqueued: true, runId }`;使用 `openclaw cron runs --id <job-id>` 跟踪最终结果。

注意:保留/清理由配置控制:

- `cron.sessionRetention`(默认 `24h`)清理已完成的隔离运行 Session。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 常见编辑

在不更改消息的情况下更新传递设置:

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

为隔离作业禁用传递:

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离作业启用轻量级引导上下文:

```bash
openclaw cron edit <job-id> --light-context
```

向特定 Channel 通知:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

使用轻量级引导上下文创建隔离作业:

```bash
openclaw cron add \
  --name "Lightweight morning brief" \
  --cron "0 7 * * *" \
  --session isolated \
  --message "Summarize overnight updates." \
  --light-context \
  --no-deliver
```

`--light-context` 仅适用于隔离的 Agent 轮次作业。对于 cron 运行,轻量级模式将引导上下文保持为空,而不是注入完整的工作区引导集。
