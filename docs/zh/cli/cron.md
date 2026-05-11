---
summary: "`openclaw cron` 的 CLI 参考（安排和运行后台作业）"
read_when:
  - 您想安排定时作业和唤醒
  - 您在调试 cron 执行和日志
title: "Cron"
---

# `openclaw cron`

管理 Gateway 调度器的 cron 作业。

<Tip>
运行 `openclaw cron --help` 获取完整命令界面。请参阅 [Cron 作业](/automation/cron-jobs) 获取概念指南。
</Tip>

## Session

`--session` 接受 `main`、`isolated`、`current` 或 `session:<id>`。

<AccordionGroup>
  <Accordion title="Session 密钥">
    - `main` 绑定到 Agent 的主 Session。
    - `isolated` 为每次运行创建新的转录和 Session ID。
    - `current` 在创建时绑定到活跃 Session。
    - `session:<id>` 固定到显式的持久 Session 密钥。

  </Accordion>
  <Accordion title="隔离 Session 语义">
    隔离运行会重置环境对话上下文。Channel 和群组路由、发送/队列策略、提升、来源和 ACP 运行时绑定会为新运行重置。安全偏好和显式用户选择的模型或身份验证覆盖可以跨运行延续。
  </Accordion>
</AccordionGroup>

## 传递

`openclaw cron list` 和 `openclaw cron show <job-id>` 预览已解析的传递路由。对于 `channel: "last"`，预览显示路由是从主 Session 还是当前 Session 解析的，或者是否会失败关闭。

Provider 前缀目标可以消除未解析的通告 Channel 的歧义。例如，`to: "telegram:123"` 在 `delivery.channel` 省略或为 `last` 时选择 Telegram。只有已加载 Plugin 通告的前缀才是 Provider 选择器。如果 `delivery.channel` 是显式的，前缀必须匹配该 Channel；`channel: "whatsapp"` 与 `to: "telegram:123"` 会被拒绝。`imessage:` 和 `sms:` 等服务前缀仍然是 Channel 拥有的目标语法。

<Note>
隔离 `cron add` 作业默认为 `--announce` 传递。使用 `--no-deliver` 将输出保持在内部。`--deliver` 作为已弃用的别名仍然保留。
</Note>

### 传递所有权

隔离 cron 聊天传递在 Agent 和运行器之间共享：

- 当聊天路由可用时，Agent 可以使用 `message` 工具直接发送。
- `announce` 后备传递仅在 Agent 未直接发送到已解析目标时传递最终回复。
- `webhook` 将完成的有效载荷发布到 URL。
- `none` 禁用运行器后备传递。

`--announce` 是最终回复的运行器后备传递。`--no-deliver` 禁用该后备，但当聊天路由可用时不移除 Agent 的 `message` 工具。

从活跃聊天创建的提醒保留实时聊天传递目标用于后备通告传递。内部 Session 密钥可能是小写的；不要将它们用作区分大小写的 Provider ID（如 Matrix 房间 ID）的事实来源。

### 失败传递

失败通知按此顺序解析：

1. 作业上的 `delivery.failureDestination`。
2. 全局 `cron.failureDestination`。
3. 作业的主通告目标（当未设置显式失败目标时）。

<Note>
主 Session 作业仅在主传递模式为 `webhook` 时才可以使用 `delivery.failureDestination`。隔离作业在所有模式下都接受它。
</Note>

注意：隔离 cron 运行将运行级别 Agent 失败视为作业错误，即使没有产生回复有效载荷，因此模型/Provider 失败仍然增加错误计数器并触发失败通知。

如果隔离运行在第一次模型请求之前超时，`openclaw cron show` 和 `openclaw cron runs` 会包含特定阶段的错误，如 `setup timed out before runner start` 或 `stalled before first model call (last phase: context-engine)`。对于 CLI 支持的 Provider，预模型看门狗保持活跃直到外部 CLI 轮次开始，因此 Session 查找、Hook、身份验证、提示和 CLI 设置停滞被报告为预模型 cron 失败。

## 调度

### 一次性作业

`--at <datetime>` 安排一次性运行。无偏移量的日期时间被视为 UTC，除非您还传递 `--tz <iana>`，这会将挂钟时间解释为给定时区。

<Note>
一次性作业默认在成功后删除。使用 `--keep-after-run` 保留它们。
</Note>

### 重复作业

重复作业在连续错误后使用指数退避重试：30s、1m、5m、15m、60m。下次成功运行后，调度恢复正常。

跳过的运行与执行错误分开跟踪。它们不影响重试退避，但 `openclaw cron edit <job-id> --failure-alert-include-skipped` 可以选择让失败警报加入重复跳过运行通知。

对于针对本地已配置模型 Provider 的隔离作业，cron 在开始 Agent 轮次之前运行轻量级 Provider 预检。回环、私有网络和 `.local` `api: "ollama"` Provider 在 `/api/tags` 处探测；本地 OpenAI 兼容 Provider 如 vLLM、SGLang 和 LM Studio 在 `/models` 处探测。如果端点不可达，运行被记录为 `skipped` 并在稍后的调度上重试；匹配的死端点被缓存 5 分钟，以避免许多作业频繁访问同一本地服务器。

注意：cron 作业定义存在于 `jobs.json` 中，而待处理的运行时状态存在于 `jobs-state.json` 中。如果 `jobs.json` 被外部编辑，Gateway 会重新加载更改的调度并清除陈旧的待处理槽；仅格式化的重写不会清除待处理槽。

### 手动运行

`openclaw cron run` 在手动运行加入队列后立即返回。成功响应包含 `{ ok: true, enqueued: true, runId }`。使用 `openclaw cron runs --id <job-id>` 跟踪最终结果。

<Note>
`openclaw cron run <job-id>` 默认强制运行。使用 `--due` 保留旧的"仅在到期时运行"行为。
</Note>

## 模型

`cron add|edit --model <ref>` 为作业选择允许的模型。

<Warning>
如果模型不被允许或无法解析，cron 会以显式验证错误使运行失败，而不是回退到作业的 Agent 或默认模型选择。
</Warning>

Cron `--model` 是**作业主要**，而不是聊天 Session 的 `/model` 覆盖。这意味着：

- 当所选作业模型失败时，配置的模型回退仍然适用。
- 存在时，每作业有效载荷 `fallbacks` 替换配置的回退列表。
- 空的每作业回退列表（作业有效载荷/API 中的 `fallbacks: []`）使 cron 运行严格。
- 当作业有 `--model` 但没有配置回退列表时，OpenClaw 传递一个显式的空回退覆盖，使 Agent 主要不会被追加为隐藏的重试目标。

### 隔离 cron 模型优先级

隔离 cron 按此顺序解析活跃模型：

1. Gmail-hook 覆盖。
2. 每作业 `--model`。
3. 存储的 cron Session 模型覆盖（当用户选择一个时）。
4. Agent 或默认模型选择。

### 快速模式

隔离 cron 快速模式遵循已解析的实时模型选择。模型配置 `params.fastMode` 默认适用，但存储的 Session `fastMode` 覆盖仍然优于配置。

### 实时模型切换重试

如果隔离运行抛出 `LiveSessionModelSwitchError`，cron 在重试之前为活跃运行持久化切换的 Provider 和模型（以及存在时的切换身份验证配置文件覆盖）。外部重试循环在初始尝试后以最多两次切换重试为界，然后中止而不是永久循环。

## 运行输出和拒绝

### 陈旧确认抑制

隔离 cron 轮次抑制陈旧的仅确认回复。如果第一个结果只是中间状态更新，且没有后代子 Agent 运行负责最终答案，cron 在传递之前重新提示一次以获取真实结果。

### 静默 token 抑制

如果隔离 cron 运行仅返回静默 token（`NO_REPLY` 或 `no_reply`），cron 会抑制直接出站传递和后备队列摘要路径，因此没有任何内容发布回聊天。

### 结构化拒绝

隔离 cron 运行优先使用来自嵌入运行的结构化执行拒绝元数据，然后回退到最终输出中的已知拒绝标记，如 `SYSTEM_RUN_DENIED`、`INVALID_REQUEST` 和审批绑定拒绝短语。

`cron list` 和运行历史记录显示拒绝原因，而不是将被阻止的命令报告为 `ok`。

## 保留

保留和修剪在配置中控制：

- `cron.sessionRetention`（默认 `24h`）修剪已完成的隔离运行 Session。
- `cron.runLog.maxBytes` 和 `cron.runLog.keepLines` 修剪 `~/.openclaw/cron/runs/<jobId>.jsonl`。

## 迁移旧作业

<Note>
如果您有来自当前传递和存储格式之前的 cron 作业，请运行 `openclaw doctor --fix`。Doctor 规范化旧版 cron 字段（`jobId`、`schedule.cron`、顶层传递字段（包括旧版 `threadId`）、有效载荷 `provider` 传递别名），并在配置了 `cron.webhook` 时将简单的 `notify: true` webhook 回退作业迁移到显式 webhook 传递。
</Note>

## 常见编辑

在不更改消息的情况下更新传递设置：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "123456789"
```

禁用隔离作业的传递：

```bash
openclaw cron edit <job-id> --no-deliver
```

为隔离作业启用轻量级引导上下文：

```bash
openclaw cron edit <job-id> --light-context
```

通告到特定 Channel：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
```

通告到 Telegram 论坛主题：

```bash
openclaw cron edit <job-id> --announce --channel telegram --to "-1001234567890" --thread-id 42
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

`--light-context` 仅适用于隔离 Agent 轮次作业。对于 cron 运行，轻量级模式保持引导上下文为空，而不是注入完整的工作区引导集。

## 常见管理命令

手动运行和检查：

```bash
openclaw cron list
openclaw cron list --agent ops
openclaw cron show <job-id>
openclaw cron run <job-id>
openclaw cron run <job-id> --due
openclaw cron runs --id <job-id> --limit 50
```

`openclaw cron list` 默认显示所有匹配的作业。传递 `--agent <id>` 仅显示有效规范化 Agent ID 匹配的作业；没有存储 Agent ID 的作业计为配置的默认 Agent。

`cron list --json` 和 `cron show <job-id> --json` 在每个作业上包含顶层 `status` 字段，由 `enabled`、`state.runningAtMs` 和 `state.lastRunStatus` 计算。值：`disabled`、`running`、`ok`、`error`、`skipped` 或 `idle`。这镜像了人类可读的状态列，以便外部工具可以读取作业状态而无需重新推导。

`cron runs` 条目包含传递诊断，包含预期的 cron 目标、已解析的目标、消息工具发送、后备使用和已传递状态。

Agent 和 Session 重新定位：

```bash
openclaw cron edit <job-id> --agent ops
openclaw cron edit <job-id> --clear-agent
openclaw cron edit <job-id> --session current
openclaw cron edit <job-id> --session "session:daily-brief"
```

`openclaw cron add` 在 Agent 轮次作业上省略 `--agent` 时发出警告，并回退到默认 Agent（`main`）。在创建时传递 `--agent <id>` 以固定特定 Agent。

传递调整：

```bash
openclaw cron edit <job-id> --announce --channel slack --to "channel:C1234567890"
openclaw cron edit <job-id> --best-effort-deliver
openclaw cron edit <job-id> --no-best-effort-deliver
openclaw cron edit <job-id> --no-deliver
```

## 相关

- [CLI 参考](/cli)
- [定时任务](/automation/cron-jobs)
