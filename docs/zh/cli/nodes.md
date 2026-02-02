---
title: "`openclaw nodes`"
sidebarTitle: "openclaw nodes"
mmh3_hash: "809bb945b12fe510c003796b049815a8"
summary: "`openclaw nodes` 的 CLI 参考(列表/状态/批准/调用、相机/画布/屏幕)"
read_when:
  - 您正在管理配对的Node(相机、屏幕、画布)
  - 您需要批准请求或调用Node命令
---

# `openclaw nodes`

管理配对的Node(设备)并调用Node功能。

相关:
- Node概述:[Node](/nodes)
- 相机:[相机Node](/nodes/camera)
- 图像:[图像Node](/nodes/images)

常用选项:
- `--url`、`--token`、`--timeout`、`--json`

## 常用命令

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` 打印待处理/配对表。配对行包括最近的连接年龄(Last Connect)。
使用 `--connected` 仅显示当前连接的Node。使用 `--last-connected <duration>` 过滤
到在持续时间内连接的Node(例如 `24h`、`7d`)。

## 调用/运行

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
openclaw nodes run --node <id|name|ip> <command...>
openclaw nodes run --raw "git status"
openclaw nodes run --agent main --node <id|name|ip> --raw "git status"
```

调用标志:
- `--params <json>`:JSON 对象字符串(默认 `{}`)。
- `--invoke-timeout <ms>`:Node调用超时(默认 `15000`)。
- `--idempotency-key <key>`:可选的幂等性键。

### Exec 风格默认值

`nodes run` 镜像模型的 exec 行为(默认值 + 批准):

- 读取 `tools.exec.*`(加上 `agents.list[].tools.exec.*` 覆盖)。
- 在调用 `system.run` 之前使用 exec 批准(`exec.approval.request`)。
- 当设置 `tools.exec.node` 时可以省略 `--node`。
- 需要公布 `system.run` 的Node(macOS 伴侣应用或无头Node主机)。

标志:
- `--cwd <path>`:工作目录。
- `--env <key=val>`:环境覆盖(可重复)。
- `--command-timeout <ms>`:命令超时。
- `--invoke-timeout <ms>`:Node调用超时(默认 `30000`)。
- `--needs-screen-recording`:需要屏幕录制权限。
- `--raw <command>`:运行 shell 字符串(`/bin/sh -lc` 或 `cmd.exe /c`)。
- `--agent <id>`:Agent范围的批准/允许列表(默认为配置的Agent)。
- `--ask <off|on-miss|always>`、`--security <deny|allowlist|full>`:覆盖。
