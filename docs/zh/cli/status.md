---
mmh3_hash: "dfcaf698979fb875a8740ade10523adb"
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

- `--deep` 运行实时探测(WhatsApp Web + Telegram + Discord + Slack + Signal)。
- `--usage` 以 `X% left` 格式打印标准化的提供商使用窗口。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段是剩余配额,因此 OpenClaw 在显示前将其反转;有基于计数的字段时优先使用。`model_remains` 响应优先选择聊天模型条目,在需要时从时间戳派生窗口标签,并在计划标签中包含模型名称。
- 当当前 Session 快照稀疏时,`/status` 可以从最近的记录使用日志中回填令牌和缓存计数器。现有的非零实时值仍然优于记录回退值。
- 记录回退也可以在实时 Session 条目缺少时恢复活动运行时模型标签。如果该记录模型与所选模型不同,status 根据恢复的运行时模型而不是所选模型解析上下文窗口。
- 对于提示大小计算,当 Session 元数据丢失或较小时,记录回退优先选择较大的面向提示的总数,这样自定义提供商 Session 就不会折叠为 `0` 令牌显示。
- 配置多个 Agent 时,输出包括每个 Agent 的 Session 存储。
- 概述包括 Gateway + Node 主机服务安装/运行时状态(如果可用)。
- 概述包括更新 Channel + git SHA(用于源检出)。
- 更新信息显示在概述中;如果有可用更新,status 会打印运行 `openclaw update` 的提示(参见[更新](/install/updating))。
- 只读状态界面(`status`、`status --json`、`status --all`)在可能的情况下解析支持的 SecretRef 用于其目标配置路径。
- 如果支持的 Channel SecretRef 已配置但在当前命令路径中不可用,status 保持只读并报告降级输出而不是崩溃。人类可读输出显示警告(例如"configured token unavailable in this command path"),JSON 输出包含 `secretDiagnostics`。
- 当命令本地 SecretRef 解析成功时,status 优先使用已解析的快照,并从最终输出中清除瞬时的"secret unavailable" Channel 标记。
- `status --all` 包含 Secrets 概述行和诊断部分,该部分汇总 secret 诊断信息(为可读性截断),而不会停止报告生成。
