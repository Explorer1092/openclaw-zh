---
mmh3_hash: "ffcecd5d5b2fc861948a7f955326077c"
title: "`openclaw dashboard`"
sidebarTitle: "openclaw dashboard"
summary: "`openclaw dashboard` 的 CLI 参考(打开控制 UI)"
read_when:
  - 您想使用当前令牌打开控制 UI
  - 您想打印 URL 而不启动浏览器
---

# `openclaw dashboard`

使用您当前的身份验证打开控制 UI。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

注意:

- `dashboard` 在可能的情况下解析已配置的 `gateway.auth.token` SecretRef。
- `dashboard` 遵循 `gateway.tls.enabled`：启用 TLS 的 Gateway 会打印/打开 `https://` 控制 UI URL 并通过 `wss://` 连接。
- 对于 SecretRef 管理的令牌(无论是否已解析),`dashboard` 打印/复制/打开不含令牌的 URL,以避免在终端输出、剪贴板历史记录或浏览器启动参数中暴露外部密钥。
- 如果 `gateway.auth.token` 由 SecretRef 管理但在当前命令路径中未解析,该命令将打印不含令牌的 URL 及明确的修复指引,而不是嵌入无效的令牌占位符。

## 相关

- [CLI 参考](/cli)
- [Dashboard](/web/dashboard)
