---
read_when:
  - 定时任务未运行
  - 定时任务运行了但没有投递消息
  - 心跳似乎静默或被跳过
summary: 排查 Cron 和心跳调度与投递问题
title: 自动化故障排查
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: 6de27b8acac65a5dade3f61969fd6cbb77341d843c2a9aab4900aeed4803e710
  source_path: automation/troubleshooting.md
  workflow: 15
---

# 自动化故障排查

使用本页解决调度器和投递问题（`cron` + 心跳）。

## 命令阶梯

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

然后运行自动化检查：

```bash
openclaw cron status
openclaw cron list
openclaw system heartbeat last
```

## 定时任务未触发

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw logs --follow
```

正常输出如下：

- `cron status` 报告已启用且有未来的 `nextWakeAtMs`。
- 任务已启用且有有效的调度/时区。
- `cron runs` 显示 `ok` 或明确的跳过原因。

常见特征：

- `cron: scheduler disabled; jobs will not run automatically` → 定时任务在配置/环境变量中被禁用。
- `cron: timer tick failed` → 调度器 tick 崩溃；检查周围的堆栈/日志上下文。
- 运行输出中的 `reason: not-due` → 手动运行时未使用 `--force` 且任务尚未到期。

## 定时任务触发了但没有投递

```bash
openclaw cron runs --id <jobId> --limit 20
openclaw cron list
openclaw channels status --probe
openclaw logs --follow
```

正常输出如下：

- 运行状态为 `ok`。
- 隔离任务已设置投递模式/目标。
- 渠道探测报告目标渠道已连接。

常见特征：

- 运行成功但投递模式为 `none` → 预期无外部消息。
- 投递目标缺失/无效（`channel`/`to`）→ 运行可能在内部成功但跳过出站。
- 渠道认证错误（`unauthorized`、`missing_scope`、`Forbidden`）→ 投递被渠道凭据/权限阻止。

## 心跳被抑制或跳过

```bash
openclaw system heartbeat last
openclaw logs --follow
openclaw config get agents.defaults.heartbeat
openclaw channels status --probe
```

正常输出如下：

- 心跳已启用且有非零间隔。
- 最后一次心跳结果为 `ran`（或跳过原因已知）。

常见特征：

- `heartbeat skipped` 且 `reason=quiet-hours` → 在 `activeHours` 之外。
- `requests-in-flight` → 主通道繁忙；心跳延迟。
- `empty-heartbeat-file` → 因 `HEARTBEAT.md` 无可操作内容且无标记 cron 事件排队，间隔心跳被跳过。
- `alerts-disabled` → 可见性设置抑制出站心跳消息。

## 时区和 activeHours 的注意事项

```bash
openclaw config get agents.defaults.heartbeat.activeHours
openclaw config get agents.defaults.heartbeat.activeHours.timezone
openclaw config get agents.defaults.userTimezone || echo "agents.defaults.userTimezone not set"
openclaw cron list
openclaw logs --follow
```

快速规则：

- `Config path not found: agents.defaults.userTimezone` 表示该键未设置；心跳回退到主机时区（或已设置的 `activeHours.timezone`）。
- 未带 `--tz` 的 Cron 使用 Gateway 网关主机时区。
- 心跳 `activeHours` 使用已配置的时区解析（`user`、`local` 或显式 IANA 时区）。
- Cron `at` 调度将无时区的 ISO 时间戳视为 UTC，除非你使用了 CLI 的 `--at "<offset-less-iso>" --tz <iana>` 形式。

常见特征：

- 主机时区更改后，任务在错误的时钟时间运行。
- 因 `activeHours.timezone` 设置错误，心跳在你的白天始终被跳过。

相关内容：

- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)
- [/automation/cron-vs-heartbeat](/automation/cron-vs-heartbeat)
- [/concepts/timezone](/concepts/timezone)
