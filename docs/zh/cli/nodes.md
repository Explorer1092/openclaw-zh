---
mmh3_hash: "dc28ef4e029f9774a76fc39a163ba0b4"
summary: "`openclaw nodes` 的 CLI 参考（状态、配对、调用、相机/Canvas/屏幕）"
read_when:
  - 您正在管理已配对的 Node（相机、屏幕、Canvas）
  - 您需要批准请求或调用 Node 命令
title: "Nodes"
---

# `openclaw nodes`

管理已配对的 Node（设备）并调用 Node 能力。

相关：

- Nodes 概述：[Nodes](/nodes)
- 相机：[相机 Node](/nodes/camera)
- 图像：[图像 Node](/nodes/images)

常用选项：

- `--url`、`--token`、`--timeout`、`--json`

## 常用命令

```bash
openclaw nodes list
openclaw nodes list --connected
openclaw nodes list --last-connected 24h
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name <displayName>
openclaw nodes status
openclaw nodes status --connected
openclaw nodes status --last-connected 24h
```

`nodes list` 打印待处理/已配对表格。已配对行包含最近连接年龄（最后连接时间）。
使用 `--connected` 仅显示当前连接的 Node。使用 `--last-connected <duration>` 过滤在时长内连接的 Node（例如 `24h`、`7d`）。
使用 `nodes remove --node <id|name|ip>` 删除过期的 Gateway 拥有的 Node 配对记录。

审批注意事项：

- `openclaw nodes pending` 只需要配对范围。
- `gateway.nodes.pairing.autoApproveCidrs` 只能对明确可信的首次 `role: node` 设备配对跳过待处理步骤。默认关闭，不批准升级。
- `openclaw nodes approve <requestId>` 从待处理请求继承额外的范围要求：
  - 无命令请求：仅配对
  - 非 exec Node 命令：配对 + 写入
  - `system.run` / `system.run.prepare` / `system.which`：配对 + 管理员

## 调用

```bash
openclaw nodes invoke --node <id|name|ip> --command <command> --params <json>
```

调用标志：

- `--params <json>`：JSON 对象字符串（默认 `{}`）。
- `--invoke-timeout <ms>`：Node 调用超时（默认 `15000`）。
- `--idempotency-key <key>`：可选的幂等性密钥。
- `system.run` 和 `system.run.prepare` 在这里被阻止；请使用带 `host=node` 的 `exec` 工具进行 Shell 执行。

对于 Node 上的 Shell 执行，请使用带 `host=node` 的 `exec` 工具，而不是 `openclaw nodes run`。
`nodes` CLI 现在以能力为中心：通过 `nodes invoke` 直接 RPC，加上配对、相机、屏幕、位置、Canvas 和通知。Canvas 命令由捆绑的实验性 Canvas Plugin 实现；核心保留兼容性 hook，因此它们保留在 `openclaw nodes canvas` 下。

## 相关

- [CLI 参考](/cli)
- [Nodes](/nodes)
