---
title: "`openclaw system`"
mmh3_hash: "e1f8ac3453695d8d3c7005e7551edb87"
summary: "`openclaw system` 的 CLI 参考(系统事件、心跳、存在)"
read_when:
  - 您想在不创建 cron 作业的情况下将系统事件排队
  - 您需要启用或禁用心跳
  - 您想检查系统存在条目
---

# `openclaw system`

网关的系统级助手:将系统事件排队、控制心跳
并查看存在。

## 常用命令

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
openclaw system heartbeat enable
openclaw system heartbeat last
openclaw system presence
```

## `system event`

在**主**会话上将系统事件排队。下一次心跳将
在提示中作为 `System:` 行注入它。使用 `--mode now` 立即触发心跳;
`next-heartbeat` 等待下一个计划的滴答。

标志:
- `--text <text>`:必需的系统事件文本。
- `--mode <mode>`:`now` 或 `next-heartbeat`(默认)。
- `--json`:机器可读输出。

## `system heartbeat last|enable|disable`

心跳控制:
- `last`:显示最后一次心跳事件。
- `enable`:重新打开心跳(如果它们被禁用则使用此功能)。
- `disable`:暂停心跳。

标志:
- `--json`:机器可读输出。

## `system presence`

列出网关知道的当前系统存在条目(节点、
实例和类似的状态行)。

标志:
- `--json`:机器可读输出。

## 注意

- 需要通过当前配置(本地或远程)可访问的正在运行的网关。
- 系统事件是短暂的,不会在重启之间持久化。
