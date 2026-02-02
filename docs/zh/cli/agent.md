---
title: "`openclaw agent`"
sidebarTitle: "openclaw agent"
mmh3_hash: "aa131da2624f71bfcca5dab4fec8d1b5"
summary: "`openclaw agent` 的 CLI 参考(通过 Gateway 发送一轮 Agent)"
read_when:
  - 您想从脚本运行一轮 Agent(可选择传递回复)
---

# `openclaw agent`

通过 Gateway 运行 Agent 轮次(使用 `--local` 进行嵌入式)。
使用 `--agent <id>` 直接定位已配置的 Agent。

相关:

- Agent send 工具:[Agent send](/tools/agent-send)

## 示例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```
