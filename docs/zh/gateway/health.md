---
mmh3_hash: "fce8da7b29ef50ffef31d67703192a24"
summary: "健康检查命令和 Gateway 健康监控"
read_when:
  - 诊断 Channel 连接性或 Gateway 健康
  - 了解健康检查 CLI 命令和选项
title: "Health Checks"
---

# Health Checks(CLI)

验证 Channel 连接性的简短指南,无需猜测。

## 快速检查

- `openclaw status` — 本地摘要：Gateway 可达性/模式，更新提示，链接的 Channel 认证年龄，Session + 最近活动。
- `openclaw status --all` — 完整本地诊断（只读，彩色，安全粘贴以进行调试）。
- `openclaw status --deep` — 向正在运行的 Gateway 请求实时健康探测（带 `probe:true` 的 `health`），在支持时包括每账户 Channel 探测。
- `openclaw health` — 向正在运行的 Gateway 请求其健康快照（仅 WS；CLI 无直接 Channel socket）。
- `openclaw health --verbose` — 强制实时健康探测并打印 Gateway 连接详情。
- `openclaw health --json` — 机器可读的健康快照输出。
- 在 WhatsApp/WebChat 中作为独立消息发送 `/status` 以获取状态回复而不调用 Agent。
- 日志：tail `/tmp/openclaw/openclaw-*.log` 并过滤 `web-heartbeat`、`web-reconnect`、`web-auto-reply`、`web-inbound`。

## 深度诊断

- 磁盘上的凭证:`ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json`(mtime 应该是最近的)。
- Session 存储:`ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json`(路径可以在配置中覆盖)。计数和最近的接收者通过 `status` 显示。
- 重新链接流程:当日志中出现状态代码 409–515 或 `loggedOut` 时,`openclaw channels logout && openclaw channels login --verbose`。(注意:QR 登录流程在配对后为状态 515 自动重启一次。)
- 默认情况下启用诊断。Gateway 记录操作事实，除非设置了 `diagnostics.enabled: false`。内存事件记录 RSS/heap 字节数、阈值压力和增长压力。超大负载事件记录被拒绝、截断或分块的内容，加上可用时的大小和限制。它们不记录消息文本、附件内容、webhook 正文、原始请求或响应正文、令牌、cookie 或密钥值。同一个 heartbeat 启动有界稳定性记录器，可通过 `openclaw gateway stability` 或 `diagnostics.stability` Gateway RPC 获取。Gateway 致命退出、关闭超时和重启启动失败会在事件存在时将最新的记录器快照持久化到 `~/.openclaw/logs/stability/` 下；使用 `openclaw gateway stability --bundle latest` 检查最新保存的包。
- 对于错误报告，运行 `openclaw gateway diagnostics export` 并附上生成的 zip。导出结合了 Markdown 摘要、最新的稳定性包、已清理的日志元数据、已清理的 Gateway 状态/健康快照和配置形状。它旨在共享：聊天文本、webhook 正文、工具输出、凭证、cookie、账户/消息标识符和密钥值会被省略或删除。参见 [诊断导出](/gateway/diagnostics)。

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

`openclaw health` 向正在运行的 Gateway 请求其健康快照（CLI 无直接 Channel socket）。默认情况下，它可以返回新鲜的缓存 Gateway 快照；然后 Gateway 在后台刷新该缓存。`openclaw health --verbose` 强制实时探测。该命令在可用时报告链接的凭证/认证年龄，每 Channel 探测摘要，Session-store 摘要和探测持续时间。如果 Gateway 无法访问或探测失败/超时，它以非零退出。

选项：

- `--json`：机器可读的 JSON 输出
- `--timeout <ms>`：覆盖默认 10 秒探测超时
- `--verbose`：强制实时探测并打印 Gateway 连接详情
- `--debug`：`--verbose` 的别名

健康快照包括：`ok`（布尔值）、`ts`（时间戳）、`durationMs`（探测时间）、每 Channel 状态、Agent 可用性和 Session-store 摘要。

## 相关

- [Gateway 说明书](/gateway)
- [诊断导出](/gateway/diagnostics)
- [Gateway 故障排除](/gateway/troubleshooting)
