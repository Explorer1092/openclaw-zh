---
mmh3_hash: "de8f6138663db24a5ac941c66b9c3515"
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

注意:cron 拥有的隔离运行期望纯文本摘要,运行器拥有最终发送路径。`--no-deliver` 保持运行内部;它不会将传递交还给 Agent 的消息工具。

注意:一次性(`--at`)作业默认在成功后删除。使用 `--keep-after-run` 来保留它们。

注意:`--session` 支持 `main`、`isolated`、`current` 和 `session:<id>`。使用 `current` 在创建时绑定到活动 Session,或使用 `session:<id>` 获取显式持久 Session 密钥。

注意:对于一次性 CLI 作业,无偏移量的 `--at` 日期时间被视为 UTC,除非您还传递 `--tz <iana>`,这会在给定时区中解释该本地挂钟时间。

注意:重复作业现在在连续错误后使用指数重试退避(30秒 → 1分钟 → 5分钟 → 15分钟 → 60分钟),然后在下次成功运行后返回正常计划。

注意:`openclaw cron run` 现在在手动运行排队执行后立即返回。成功响应包括 `{ ok: true, enqueued: true, runId }`;使用 `openclaw cron runs --id <job-id>` 跟踪最终结果。

注意:`openclaw cron run <job-id>` 默认强制运行。使用 `--due` 保持旧的"仅在到期时运行"行为。

注意:隔离的 cron 轮次会抑制过时的仅确认回复。如果第一个结果只是中间状态更新且没有后代子 Agent 运行负责最终答案,cron 在传递前会重新提示一次获取真实结果。

注意:如果隔离的 cron 运行仅返回静默令牌(`NO_REPLY` / `no_reply`),cron 会抑制直接出站传递以及回退排队摘要路径,因此不会向聊天发布任何内容。

注意:`cron add|edit --model ...` 使用该选定的允许模型用于作业。如果模型不被允许,cron 会警告并回退到作业的 Agent/默认模型选择。配置的回退链仍然适用,但没有显式每作业回退列表的普通模型覆盖不再将 Agent 主模型作为隐藏的额外重试目标附加。

注意:隔离 cron 模型优先级为:Gmail hook 覆盖优先,然后是每作业 `--model`,然后是任何存储的 cron-Session 模型覆盖,然后是正常的 Agent/默认选择。

注意:隔离 cron 快速模式遵循解析的实时模型选择。模型配置 `params.fastMode` 默认应用,但存储的 Session `fastMode` 覆盖仍然优先于配置。

注意:如果隔离运行抛出 `LiveSessionModelSwitchError`,cron 在重试前会持久化切换的提供商/模型(以及切换的认证配置文件覆盖(如果存在))。外部重试循环在初始尝试后限制为 2 次切换重试,然后中止而不是无限循环。

注意:失败通知先使用 `delivery.failureDestination`,然后是全局 `cron.failureDestination`,最后在没有配置显式失败目标时回退到作业的主要通知目标。

注意:保留/清理由配置控制:

- `cron.sessionRetention`(默认 `24h`)清理已完成的隔离运行 Session。
- `cron.runLog.maxBytes` + `cron.runLog.keepLines` 清理 `~/.openclaw/cron/runs/<jobId>.jsonl`。

升级说明:如果您有当前传递/存储格式之前的旧版 cron 作业,请运行 `openclaw doctor --fix`。Doctor 现在规范化旧版 cron 字段(`jobId`、`schedule.cron`、顶层传递字段(包括旧版 `threadId`)、payload `provider` 传递别名),并在配置了 `cron.webhook` 的情况下将简单的 `notify: true` webhook 回退作业迁移为显式 webhook 传递。

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

传递所有权说明:

- Cron 拥有的隔离作业始终通过 cron 运行器(`announce`、`webhook` 或仅内部 `none`)路由最终用户可见的传递。
- 如果任务提到向某个外部收件人发送消息,Agent 应在其结果中描述预期目标,而不是直接尝试发送。

## 常见管理命令

手动运行:

```bash
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

Agent/Session 重新定向:

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

传递调整:

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

失败传递说明:

- 隔离作业支持 `delivery.failureDestination`。
- 当主传递模式为 `webhook` 时,主 Session 作业才可以使用 `delivery.failureDestination`。
- 如果您没有设置任何失败目标且作业已向 Channel 通知,失败通知会重用相同的通知目标。
