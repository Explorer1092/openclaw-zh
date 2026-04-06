---
mmh3_hash: "625021b88a1a73445edeb4bec7cd01cd"
title: "`openclaw agent`"
sidebarTitle: "openclaw agent"
summary: "`openclaw agent` 的 CLI 参考(通过 Gateway 发送一轮 Agent)"
read_when:
  - 您想从脚本运行一轮 Agent(可选择传递回复)
---

# `openclaw agent`

通过 Gateway 运行 Agent 轮次(使用 `--local` 进行嵌入式)。
使用 `--agent <id>` 直接定位已配置的 Agent。

至少传递一个 Session 选择器:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

相关:

- Agent send 工具:[Agent send](/tools/agent-send)

## 选项

- `-m, --message <text>`:必需的消息内容
- `-t, --to <dest>`:用于派生 Session 密钥的收件人
- `--session-id <id>`:显式 Session ID
- `--agent <id>`:Agent ID;覆盖路由绑定
- `--thinking <off|minimal|low|medium|high|xhigh>`:Agent 思考级别
- `--verbose <on|off>`:为 Session 持久化详细级别
- `--channel <channel>`:传递 Channel;省略以使用主 Session Channel
- `--reply-to <target>`:传递目标覆盖
- `--reply-channel <channel>`:传递 Channel 覆盖
- `--reply-account <id>`:传递账户覆盖
- `--local`:直接运行嵌入式 Agent(在插件注册表预加载后)
- `--deliver`:将回复发送回所选 Channel/目标
- `--timeout <seconds>`:覆盖 Agent 超时(默认 600 或配置值)
- `--json`:输出 JSON

## 示例

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## 注意事项

- Gateway 模式在 Gateway 请求失败时回退到嵌入式 Agent。使用 `--local` 可预先强制嵌入式执行。
- `--local` 仍然会首先预加载插件注册表,以便插件提供的 Provider、工具和 Channel 在嵌入式运行中保持可用。
- `--channel`、`--reply-channel` 和 `--reply-account` 影响回复传递,而非 Session 路由。
- 当此命令触发 `models.json` 重新生成时,SecretRef 管理的 Provider 凭据将以非密钥标记形式保留(例如环境变量名称、`secretref-env:ENV_VAR_NAME` 或 `secretref-managed`),而不是解析后的明文密钥。
- 标记写入具有来源权威性:OpenClaw 从活动来源配置快照持久化标记,而非从已解析的运行时密钥值。
