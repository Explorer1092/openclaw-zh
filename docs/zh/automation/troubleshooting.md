---
mmh3_hash: "5cab0eaa64696b8101094ce0af12711a"
summary: "排查 Cron 和 Heartbeat 调度及传递问题"
read_when:
  - Cron 未运行
  - Cron 运行但未传递消息
  - Heartbeat 似乎静默或被跳过
title: "自动化故障排除"
---

# 自动化故障排除

使用本页面解决调度器和传递问题（`cron` + `heartbeat`）。

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

## Cron 未触发

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw logs --follow
```

良好的输出应该是：

- `cron status` 报告已启用并有未来的 `nextWakeAtMs`。
- Job 已启用并具有有效的 schedule/timezone。
- `cron runs` 显示 `ok` 或明确的跳过原因。

常见特征：

- `cron: scheduler disabled; jobs will not run automatically` → cron 在配置/环境中被禁用。
- `cron: timer tick failed` → 调度器时钟崩溃；检查周围的堆栈/日志上下文。
- 运行输出中的 `reason: not-due` → 手动运行调用时未使用 `--force` 且 Job 尚未到期。

## Cron 触发但未传递

```bash
openclaw cron runs --id <jobId> --limit 20
openclaw cron list
openclaw channels status --probe
openclaw logs --follow
```

良好的输出应该是：

- 运行状态为 `ok`。
- 为隔离的 Jobs 设置了传递模式/目标。
- Channel 探测报告目标 Channel 已连接。

常见特征：

- 运行成功但传递模式为 `none` → 不期望有外部消息。
- 传递目标缺失/无效（`channel`/`to`）→ 运行可能在内部成功但跳过出站。
- Channel 身份验证错误（`unauthorized`、`missing_scope`、`Forbidden`）→ 传递被 Channel 凭据/权限阻止。

## Heartbeat 被抑制或跳过

```bash
openclaw system heartbeat last
openclaw logs --follow
openclaw config get agents.defaults.heartbeat
openclaw channels status --probe
```

良好的输出应该是：

- Heartbeat 已启用且间隔非零。
- 最后的 Heartbeat 结果为 `ran`（或跳过原因已理解）。

常见特征：

- `heartbeat skipped` 且 `reason=quiet-hours` → 在 `activeHours` 之外。
- `requests-in-flight` → 主通道繁忙；Heartbeat 延迟。
- `empty-heartbeat-file` → `HEARTBEAT.md` 存在但没有可操作内容。
- `alerts-disabled` → 可见性设置抑制出站 Heartbeat 消息。

## 时区和 activeHours 陷阱

```bash
openclaw config get agents.defaults.heartbeat.activeHours
openclaw config get agents.defaults.heartbeat.activeHours.timezone
openclaw config get agents.defaults.userTimezone || echo "agents.defaults.userTimezone not set"
openclaw cron list
openclaw logs --follow
```

快速规则：

- `Config path not found: agents.defaults.userTimezone` 表示该键未设置；Heartbeat 回退到主机时区（或如果设置了 `activeHours.timezone`）。
- 没有 `--tz` 的 Cron 使用 Gateway 主机时区。
- Heartbeat `activeHours` 使用配置的时区解析（`user`、`local` 或显式 IANA tz）。
- 没有时区的 ISO 时间戳对于 Cron `at` 调度被视为 UTC。

常见特征：

- 主机时区更改后，Jobs 在错误的时钟时间运行。
- Heartbeat 在您白天时总是被跳过，因为 `activeHours.timezone` 错误。

相关：

- [/automation/cron-jobs](/automation/cron-jobs)
- [/gateway/heartbeat](/gateway/heartbeat)
- [/automation/cron-vs-heartbeat](/automation/cron-vs-heartbeat)
- [/concepts/timezone](/concepts/timezone)
