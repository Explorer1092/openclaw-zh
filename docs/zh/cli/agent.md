---
mmh3_hash: "1d1c3c55a39a3e901a2e433591a92003"
title: "`openclaw agent`"
sidebarTitle: "openclaw agent"
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

## 注意事项

- 当此命令触发 `models.json` 重新生成时,SecretRef 管理的 Provider 凭据将以非密钥标记形式保留(例如环境变量名称、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`),而不是解析后的明文密钥。
- 标记写入具有来源权威性:OpenClaw 从活动来源配置快照持久化标记,而非从已解析的运行时密钥值。
