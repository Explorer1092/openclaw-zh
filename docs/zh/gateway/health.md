---
mmh3_hash: "8b527e6551a72c3df1d318e31370241b"
summary: "Channel 连接性的健康检查步骤"
read_when:
  - 诊断 WhatsApp channel 健康状况
title: "Health Checks"
---

# Health Checks(CLI)

验证 Channel 连接性的简短指南,无需猜测。

## 快速检查

- `openclaw status` — 本地摘要:Gateway 可达性/模式,更新提示,链接的 Channel 认证年龄,Session + 最近活动。
- `openclaw status --all` — 完整本地诊断(只读,彩色,安全粘贴以进行调试)。
- `openclaw status --deep` — 还探测正在运行的 Gateway(支持时每个 Channel 探测)。
- `openclaw health --json` — 向正在运行的 Gateway 请求完整的健康快照(仅 WS;无直接 Baileys socket)。
- 在 WhatsApp/WebChat 中作为独立消息发送 `/status` 以获取状态回复而不调用 Agent。
- 日志:tail `/tmp/openclaw/openclaw-*.log` 并过滤 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

## 深度诊断

- 磁盘上的凭证:`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`(mtime 应该是最近的)。
- Session 存储:`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`(路径可以在配置中覆盖)。计数和最近的接收者通过 `status` 显示。
- 重新链接流程:当日志中出现状态代码 409–515 或 `loggedOut` 时,`openclaw channels logout && openclaw channels login --verbose`。(注意:QR 登录流程在配对后为状态 515 自动重启一次。)

## 健康监控配置

- `gateway.channelHealthCheckMinutes`:Gateway 检查 Channel 健康的频率。默认:`5`。设置 `0` 以全局禁用健康监控重启。
- `gateway.channelStaleEventThresholdMinutes`:已连接的 Channel 在健康监控将其视为陈旧并重启之前可以保持空闲多长时间。默认:`30`。保持大于或等于 `gateway.channelHealthCheckMinutes`。
- `gateway.channelMaxRestartsPerHour`:每个 Channel/账户健康监控重启的滚动一小时上限。默认:`10`。
- `channels.<provider>.healthMonitor.enabled`:在保留全局监控启用的同时禁用特定 Channel 的健康监控重启。
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`:优先于 Channel 级别设置的多账户覆盖。
- 这些每 Channel 覆盖适用于今天公开它们的内置 Channel 监控:Discord、Google Chat、iMessage、Microsoft Teams、Signal、Slack、Telegram 和 WhatsApp。

## 当某些东西失败时

- `logged out` 或状态 409–515 → 使用 `openclaw channels logout` 然后 `openclaw channels login` 重新链接。
- Gateway 无法访问 → 启动它:`openclaw gateway --port 18789`(如果端口忙,使用 `--force`)。
- 无入站消息 → 确认链接的手机在线且发送者被允许(`channels.whatsapp.allowFrom`);对于群聊,确保 allowlist + 提及规则匹配(`channels.whatsapp.groups`、`agents.list[].groupChat.mentionPatterns`)。

## 专用"health"命令

`openclaw health --json` 向正在运行的 Gateway 请求其健康快照(CLI 无直接 Channel socket)。它在可用时报告链接的凭证/认证年龄,每个 Channel 探测摘要,Session-store 摘要和探测持续时间。如果 Gateway 无法访问或探测失败/超时,它以非零退出。使用 `--timeout <ms>` 覆盖 10 秒默认值。
