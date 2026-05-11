---
summary: "重定向：flow 命令位于 `openclaw tasks flow` 下"
read_when:
  - 您在旧版文档或发布说明中遇到 `openclaw flows`
  - 您想要快速 TaskFlow 检查参考
title: "Flows（重定向）"
---

# `openclaw tasks flow`

没有顶层 `openclaw flows` 命令。持久 TaskFlow 检查位于 `openclaw tasks flow` 下。

## 子命令

```bash
openclaw tasks flow list   [--json] [--status <name>]
openclaw tasks flow show   <lookup> [--json]
openclaw tasks flow cancel <lookup>
```

| 子命令     | 描述                       | 参数/选项                                                                             |
| ---------- | -------------------------- | ------------------------------------------------------------------------------------- |
| `list`     | 列出已跟踪的 TaskFlow。    | `--json` 机器可读输出；`--status <name>` 过滤器（见下方状态值）。                    |
| `show`     | 显示一个 TaskFlow。        | `<lookup>` 流 ID 或拥有者密钥；`--json` 机器可读输出。                               |
| `cancel`   | 取消运行中的 TaskFlow。    | `<lookup>` 流 ID 或拥有者密钥。                                                       |

`<lookup>` 接受流 ID（由 `list` / `show` 返回）或流的拥有者密钥（拥有子系统用于跟踪流的稳定标识符）。

### 状态过滤值

`list` 上的 `--status` 接受以下之一：

`queued`、`running`、`waiting`、`blocked`、`succeeded`、`failed`、`cancelled`、`lost`

## 示例

```bash
openclaw tasks flow list
openclaw tasks flow list --status running
openclaw tasks flow list --json
openclaw tasks flow show flow_abc123
openclaw tasks flow show flow_abc123 --json
openclaw tasks flow cancel flow_abc123
```

有关完整的 TaskFlow 概念和编写，请参阅 [TaskFlow](/automation/taskflow)。有关父级 `tasks` 命令，请参阅 [tasks CLI 参考](/cli/tasks)。

## 相关

- [CLI 参考](/cli)
- [Automation](/automation)
- [TaskFlow](/automation/taskflow)
