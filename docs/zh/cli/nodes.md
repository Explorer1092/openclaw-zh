---
title: "`openclaw nodes`"
sidebarTitle: "openclaw nodes"
mmh3_hash: "242e51d292b1092a19b82bccc845bf1f"
summary: "`openclaw nodes` 的 CLI 参考(列表/状态/批准/调用、相机/画布/屏幕)"
read_when:
  - 您正在管理配对的 Node(相机、屏幕、画布)
  - 您需要批准请求或调用 Node 命令
---

# `openclaw nodes`

管理配对的 Node(设备)并调用 Node 功能。

相关:

- Node 概述:[Node](/nodes)
- 相机:[相机 Node](/nodes/camera)
- 图像:[图像 Node](/nodes/images)

常用选项:

- `--url`、`--token`、`--timeout`、`--json`

## 常用命令

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` 打印待处理/配对表。配对行包括最近的连接年龄(Last Connect)。
使用 `--connected` 仅显示当前连接的 Node。使用 `--last-connected <duration>` 过滤
到在持续时间内连接的 Node(例如 `24h`、`7d`)。

批准说明:

- `openclaw nodes pending` 只需要配对范围。
- `openclaw nodes approve <requestId>` 继承待处理请求的额外范围要求:
  - 无命令请求:仅配对
  - 非 exec Node 命令:配对 + 写入
  - `system.run` / `system.run.prepare` / `system.which`:配对 + 管理员

## 调用

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

调用标志:

- `--params <json>`:JSON 对象字符串(默认 `{}`)。
- `--invoke-timeout <ms>`:Node 调用超时(默认 `15000`)。
- `--idempotency-key <key>`:可选的幂等性键。
- `system.run` 和 `system.run.prepare` 在此处被阻止;使用带 `host=node` 的 `exec` 工具进行 shell 执行。

对于 Node 上的 shell 执行,请使用带 `host=node` 的 `exec` 工具,而不是 `openclaw nodes run`。
`nodes` CLI 现在以功能为中心:通过 `nodes invoke` 进行直接 RPC,以及配对、相机、
屏幕、位置、画布和通知。
