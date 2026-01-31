---
mmh3_hash: "0eeae9a8b658fc9bc47fd3aa90f92fb1"
summary: "特定频道的故障排除快捷方式（Discord/Telegram/WhatsApp）"
read_when:
  - A channel connects but messages don't flow
  - Investigating channel misconfiguration (intents, permissions, privacy mode)
---
# 频道故障排除

从以下命令开始：

```bash
openclaw doctor
openclaw channels status --probe
```

`channels status --probe` 会在检测到常见频道配置错误时打印警告，并包含小型实时检查（凭据、部分权限/成员资格）。

## 频道
- Discord: [/channels/discord#troubleshooting](/channels/discord#troubleshooting)
- Telegram: [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)
- WhatsApp: [/channels/whatsapp#troubleshooting-quick](/channels/whatsapp#troubleshooting-quick)

## Telegram 快速修复
- 日志显示 `HttpError: Network request for 'sendMessage' failed` 或 `sendChatAction` → 检查 IPv6 DNS。如果 `api.telegram.org` 优先解析到 IPv6 而主机缺少 IPv6 出站连接，请强制使用 IPv4 或启用 IPv6。参见 [/channels/telegram#troubleshooting](/channels/telegram#troubleshooting)。
- 日志显示 `setMyCommands failed` → 检查到 `api.telegram.org` 的出站 HTTPS 和 DNS 可达性（在锁定的 VPS 或代理上很常见）。