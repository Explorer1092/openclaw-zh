---
mmh3_hash: "ad7d4b2e0b1698cb963dae42cdd4033f"
summary: "`openclaw tasks` 的 CLI 参考（后台任务账本和 Task Flow 状态）"
read_when:
  - 您想检查、审计或取消后台任务记录
  - 您正在记录 `openclaw tasks flow` 下的 Task Flow 命令
title: "`openclaw tasks`"
---

检查持久化后台任务和 Task Flow 状态。不带子命令时，`openclaw tasks` 等同于 `openclaw tasks list`。

有关生命周期和送达模型，请参阅[后台任务](/automation/tasks)。

## 用法

```bash
openclaw tasks
openclaw tasks list
openclaw tasks list --runtime acp
openclaw tasks list --status running
openclaw tasks show <lookup>
openclaw tasks notify <lookup> state_changes
openclaw tasks cancel <lookup>
openclaw tasks audit
openclaw tasks maintenance
openclaw tasks maintenance --apply
openclaw tasks flow list
openclaw tasks flow show <lookup>
openclaw tasks flow cancel <lookup>
```

## 根级选项

- `--json`：输出 JSON。
- `--runtime <name>`：按类型筛选：`subagent`、`acp`、`cron` 或 `cli`。
- `--status <name>`：按状态筛选：`queued`、`running`、`succeeded`、`failed`、`timed_out`、`cancelled` 或 `lost`。

## 子命令

### `list`

```bash
openclaw tasks list [--runtime <name>] [--status <name>] [--json]
```

按从新到旧的顺序列出已跟踪的后台任务。

### `show`

```bash
openclaw tasks show <lookup> [--json]
```

通过任务 ID、运行 ID 或 Session 键显示单个任务。

### `notify`

```bash
openclaw tasks notify <lookup> <done_only|state_changes|silent>
```

更改正在运行的任务的通知策略。

### `cancel`

```bash
openclaw tasks cancel <lookup>
```

取消正在运行的后台任务。

### `audit`

```bash
openclaw tasks audit [--severity <warn|error>] [--code <name>] [--limit <n>] [--json]
```

显示过期、丢失、送达失败或其他不一致的任务及 Task Flow 记录。保留至 `cleanupAfter` 的丢失任务为警告；已过期或未加时间戳的丢失任务为错误。

### `maintenance`

```bash
openclaw tasks maintenance [--apply] [--json]
```

预览或应用任务及 Task Flow 的协调、清理标记和修剪操作。
对于 Cron 任务，协调使用持久化的运行日志/作业状态，在将旧的活跃任务标记为 `lost` 之前进行核实，因此已完成的 Cron 运行不会仅因内存中的 Gateway 运行时状态消失就产生虚假审计错误。离线 CLI 审计对 Gateway 进程本地 Cron 活跃作业集不具有权威性。

### `flow`

```bash
openclaw tasks flow list [--status <name>] [--json]
openclaw tasks flow show <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

检查或取消任务账本下的持久化 Task Flow 状态。

## 相关链接

- [CLI 参考](/cli)
- [后台任务](/automation/tasks)
