---
mmh3_hash: "3ebf55be8f52e4f7edfcc1d581b72cc5"
summary: "`openclaw status` 的 CLI 参考（诊断、探测、使用快照）"
read_when:
  - 您想快速诊断 Channel 健康状态 + 最近的 Session 收件人
  - 您想获取用于调试的可粘贴"all"状态
title: "openclaw status"
---

Channel + Session 的诊断信息。

```bash
openclaw status
openclaw status --all
openclaw status --deep
openclaw status --usage
```

注意事项：

- `--deep` 运行实时探测（WhatsApp Web + Telegram + Discord + Slack + Signal）。
- 普通的 `openclaw status` 保持在快速只读路径上，并在跳过内存检查时将内存标记为 `not checked` 而不是不可用。繁重的安全审计、Plugin 兼容性和内存向量探测留给 `openclaw status --all`、`openclaw status --deep`、`openclaw security audit` 和 `openclaw memory status --deep`。
- `status --json --all` 报告来自 `plugins.slots.memory` 选择的活动内存 Plugin 运行时的内存详细信息。自定义内存 Plugin 可以保持内置 `agents.defaults.memorySearch.enabled` 禁用，仍然报告它们自己的文件、块、向量和全文搜索状态。
- `--usage` 将规范化的 Provider 使用窗口打印为 `X% left`。
- Session 状态输出将 `Execution:` 与 `Runtime:` 分开。`Execution` 是沙盒路径（`direct`、`docker/*`），而 `Runtime` 告诉您该 Session 是否使用 `OpenClaw Pi Default`、`OpenAI Codex`、CLI 后端或 ACP 后端（如 `codex (acp/acpx)`）。请参阅 [Agent 运行时](/concepts/agent-runtimes) 了解 Provider/模型/运行时的区别。
- MiniMax 的原始 `usage_percent` / `usagePercent` 字段是剩余配额，因此 OpenClaw 在显示前将其取反；有基于计数的字段时优先使用。`model_remains` 响应优先使用聊天模型条目，在需要时从时间戳派生窗口标签，并在计划标签中包含模型名称。
- 当当前 Session 快照稀疏时，`/status` 可以从最近的对话记录使用日志中回填令牌和缓存计数器。现有的非零实时值仍然优先于对话记录回退值。
- `/status` 包含紧凑的 Gateway 进程正常运行时间和主机系统正常运行时间。
- 当实时 Session 条目缺少它时，对话记录回退还可以恢复活动运行时模型标签。如果该对话记录模型与所选模型不同，status 会根据恢复的运行时模型而不是所选模型解析上下文窗口。
- 当 Session 固定到与已配置主模型不同的模型时，status 打印两个值、原因（`session override`）和清除提示（`/model <configured-default>` 或 `/reset`）。已配置的主模型适用于新的或未固定的 Session；现有固定 Session 保留其 Session 选择直到被清除。
- 对于提示大小核算，当 Session 元数据缺失或较小时，对话记录回退优先使用较大的面向提示的总量，这样自定义 Provider Session 就不会折叠到 `0` 令牌显示。
- 配置了多个 Agent 时，输出包括每 Agent Session 存储。
- 概览在可用时包含 Gateway + Node 主机服务安装/运行时状态。
- 概览包含更新渠道 + git SHA（对于源代码检出）。
- 更新信息显示在概览中；如果有可用更新，status 打印运行 `openclaw update` 的提示（请参阅[更新](/install/updating)）。
- 模型定价刷新失败以可选的定价警告显示。它们不意味着 Gateway 或 Channel 不健康。
- 只读状态界面（`status`、`status --json`、`status --all`）在可能时为其目标配置路径解析支持的 SecretRef。
- 如果支持的 Channel SecretRef 已配置但在当前命令路径中不可用，status 保持只读并报告降级输出，而不是崩溃。人类输出显示警告，如"此命令路径中配置的令牌不可用"，JSON 输出包含 `secretDiagnostics`。
- 当命令本地 SecretRef 解析成功时，status 优先使用已解析的快照，并从最终输出中清除瞬态"密钥不可用"Channel 标记。
- `status --all` 包含密钥概览行和摘要密钥诊断的诊断部分（为可读性截断），而不会停止报告生成。

## 相关

- [CLI 参考](/cli)
- [Doctor](/gateway/doctor)
