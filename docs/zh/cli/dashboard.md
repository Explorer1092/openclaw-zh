---
mmh3_hash: "e3e91159fde4dbbc6b3a9a0fa262dbe4"
summary: "`openclaw dashboard` 的 CLI 参考（打开控制 UI）"
read_when:
  - 您想使用当前 token 打开控制 UI
  - 您想打印 URL 而不启动浏览器
title: "Dashboard"
---

# `openclaw dashboard`

使用您当前的身份验证打开控制 UI。

```bash
openclaw dashboard
openclaw dashboard --no-open
```

注意：

- `dashboard` 在可能时解析已配置的 `gateway.auth.token` SecretRef。
- `dashboard` 遵循 `gateway.tls.enabled`：启用 TLS 的 Gateway 打印/打开 `https://` 控制 UI URL 并通过 `wss://` 连接。
- 如果剪贴板/浏览器传递对 token 身份验证的仪表板 URL 失败，`dashboard` 记录一个安全的手动身份验证提示，命名 `OPENCLAW_GATEWAY_TOKEN`、`gateway.auth.token` 和片段键 `token`，但不打印 token 值。
- 对于 SecretRef 管理的 token（已解析或未解析），`dashboard` 打印/复制/打开非 token 化 URL，以避免在终端输出、剪贴板历史记录或浏览器启动参数中暴露外部密钥。
- 如果 `gateway.auth.token` 是 SecretRef 管理的但在此命令路径中未解析，命令会打印非 token 化 URL 和明确的补救指南，而不是嵌入无效的 token 占位符。

## 相关

- [CLI 参考](/cli)
- [Dashboard](/web/dashboard)
