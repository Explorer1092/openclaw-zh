---
title: "`openclaw agent`"
mmh3_hash: "892928c62566d9db19fc2a28612aa828"
summary: "`openclaw agent` 的 CLI 参考(通过网关发送一轮代理)"
read_when:
  - 您想从脚本运行一轮代理(可选择传递回复)
---

# `openclaw agent`

通过网关运行代理轮次(使用 `--local` 进行嵌入式)。
使用 `--agent <id>` 直接定位已配置的代理。

相关:
- 代理发送工具:[代理发送](/tools/agent-send)

## 示例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
```
