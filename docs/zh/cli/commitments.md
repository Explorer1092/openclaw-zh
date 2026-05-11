---
mmh3_hash: "78dad7c393d73d62f3731fd590821f02"
summary: "`openclaw commitments` 的 CLI 参考（检查和取消推断出的后续跟进）"
read_when:
  - 您想检查推断出的后续跟进 Commitment
  - 您想取消待处理的签到
  - 您在审计 Heartbeat 可能发送的内容
title: "`openclaw commitments`"
---

列出并管理推断出的后续跟进 Commitment。

Commitment 是选择性加入的、短期的后续跟进记忆，由对话上下文创建。请参阅 [推断出的 Commitment](/concepts/commitments) 获取概念指南。

不带子命令时，`openclaw commitments` 列出待处理的 Commitment。

## 用法

```bash
openclaw commitments [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments list [--all] [--agent <id>] [--status <status>] [--json]
openclaw commitments dismiss <id...> [--json]
```

## 选项

- `--all`：显示所有状态，而不仅仅是待处理的 Commitment。
- `--agent <id>`：过滤到某个 Agent ID。
- `--status <status>`：按状态过滤。值：`pending`、`sent`、`dismissed`、`snoozed` 或 `expired`。
- `--json`：输出机器可读的 JSON。

## 示例

列出待处理的 Commitment：

```bash
openclaw commitments
```

列出所有已存储的 Commitment：

```bash
openclaw commitments --all
```

过滤到某个 Agent：

```bash
openclaw commitments --agent main
```

查找已暂停的 Commitment：

```bash
openclaw commitments --status snoozed
```

取消一个或多个 Commitment：

```bash
openclaw commitments dismiss cm_abc123 cm_def456
```

以 JSON 格式导出：

```bash
openclaw commitments --all --json
```

## 输出

文本输出包含：

- Commitment ID
- 状态
- 类型
- 最早到期时间
- 范围
- 建议的签到文本

JSON 输出还包含 Commitment 存储路径和完整的已存储记录。

## 相关

- [推断出的 Commitment](/concepts/commitments)
- [Memory 概述](/concepts/memory)
- [Heartbeat](/gateway/heartbeat)
- [定时任务](/automation/cron-jobs)
