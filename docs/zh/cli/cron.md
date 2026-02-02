---
title: "`openclaw cron`"
sidebarTitle: "openclaw cron"
mmh3_hash: "93e5c118237ac203829540c619322c9f"
summary: "`openclaw cron` 的 CLI 参考(安排和运行后台作业)"
read_when:
  - 您想要计划任务和唤醒
  - 您正在调试 cron 执行和日志
---

# `openclaw cron`

管理Gateway调度程序的 cron 作业。

相关:
- Cron 作业:[Cron 作业](/automation/cron-jobs)

提示:运行 `openclaw cron --help` 查看完整的命令界面。

## 常见编辑

在不更改消息的情况下更新传递设置:

```bash
openclaw cron edit <job-id> --deliver --channel telegram --to "123456789"
```

为隔离作业禁用传递:

```bash
openclaw cron edit <job-id> --no-deliver
```
