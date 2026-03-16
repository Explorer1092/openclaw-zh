---
mmh3_hash: "3bfd21ef882b7c6723e592b73aa9fa9c"
title: "`openclaw status`"
sidebarTitle: "openclaw status"
summary: "`openclaw status` 的 CLI 参考(诊断、探测、使用快照)"
read_when:
  - 您想快速诊断 Channel 健康状况 + 最近的 Session 收件人
  - 您想要用于调试的可粘贴"全部"状态
---

# `openclaw status`

Channel + Session 的诊断。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意:

- `--deep` 运行实时探测(WhatsApp Web + Telegram + Discord + Google Chat + Slack + Signal)。
- 配置多个 Agent 时,输出包括每个 Agent 的 Session 存储。
- 概述包括 Gateway + Node 主机服务安装/运行时状态(如果可用)。
- 概述包括更新 Channel + git SHA(用于源检出)。
- 更新信息显示在概述中;如果有可用更新,status 会打印运行 `openclaw update` 的提示(参见[更新](/install/updating))。
- 只读状态界面(`status`、`status --json`、`status --all`)在可能的情况下解析支持的 SecretRef 用于其目标配置路径。
- 如果支持的 Channel SecretRef 已配置但在当前命令路径中不可用,status 保持只读并报告降级输出而不是崩溃。人类可读输出显示警告(例如"configured token unavailable in this command path"),JSON 输出包含 `secretDiagnostics`。
- 当命令本地 SecretRef 解析成功时,status 优先使用已解析的快照,并从最终输出中清除瞬时的"secret unavailable" Channel 标记。
