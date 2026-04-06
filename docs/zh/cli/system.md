---
title: "`openclaw system`"
sidebarTitle: "openclaw system"
mmh3_hash: "87fefed7e01ee79582c1d4a6a22f9a4f"
summary: "`openclaw system` 的 CLI 参考(系统事件、心跳、存在)"
read_when:
  - 您想在不创建 Cron 作业的情况下将系统事件排队
  - 您需要启用或禁用心跳
  - 您想检查系统存在条目
---

# `openclaw system`

Gateway 的系统级助手:将系统事件排队、控制心跳并查看存在状态。

所有 `system` 子命令使用 Gateway RPC 并接受共享客户端标志:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--expect-final`

## 常用命令

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system event --text "Check for urgent follow-ups" --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

在**主** Session 上将系统事件排队。下一次心跳将在提示中作为 `System:` 行注入它。使用 `--mode now` 立即触发心跳;`next-heartbeat` 等待下一个计划的滴答。

标志:

- `--text <text>`:必需的系统事件文本。
- `--mode <mode>`:`now` 或 `next-heartbeat`(默认)。
- `--json`:机器可读输出。
- `--url`、`--token`、`--timeout`、`--expect-final`:共享 Gateway RPC 标志。

## `system heartbeat last|enable|disable`

心跳控制:

- `last`:显示最后一次心跳事件。
- `enable`:重新打开心跳(如果它们被禁用则使用此功能)。
- `disable`:暂停心跳。

标志:

- `--json`:机器可读输出。
- `--url`、`--token`、`--timeout`、`--expect-final`:共享 Gateway RPC 标志。

## `system presence`

列出 Gateway 知道的当前系统存在条目(Node、实例和类似的状态行)。

标志:

- `--json`:机器可读输出。
- `--url`、`--token`、`--timeout`、`--expect-final`:共享 Gateway RPC 标志。

## 注意

- 需要通过当前配置(本地或远程)可访问的正在运行的 Gateway。
- 系统事件是短暂的,不会在重启之间持久化。
