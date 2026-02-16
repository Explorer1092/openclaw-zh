---
title: "`openclaw security`"
sidebarTitle: "openclaw security"
mmh3_hash: "13954b8905493fcdf4cda376ef23478f"
summary: "`openclaw security` 的 CLI 参考(审计和修复常见的安全陷阱)"
read_when: ["您想对配置/状态运行快速安全审计","您想应用安全的\"修复\"建议(chmod、加强默认值)"]
---

# `openclaw security`

安全工具(审计 + 可选修复)。

相关:

- 安全指南:[安全](/gateway/security)

## 审计

```bash
openclaw security audit
openclaw security audit --deep
openclaw security audit --fix
```

当多个 DM 发件人共享主Session时,审计会发出警告,并建议**安全 DM 模式**:对共享收件箱使用 `session.dmScope="per-channel-peer"`(或对多账户Channel使用 `per-account-channel-peer`)。
当使用小型模型(`<=300B`)而没有沙盒并启用 web/浏览器工具时,它也会发出警告。
对于 webhook 入口,当 `hooks.defaultSessionKey` 未设置、当启用请求 `sessionKey` 覆盖以及当在没有 `hooks.allowedSessionKeyPrefixes` 的情况下启用覆盖时,它会发出警告。
当沙盒模式关闭时配置了沙盒 Docker 设置、当 `gateway.nodes.denyCommands` 使用无效的模式类/未知条目、当全局 `tools.profile="minimal"` 被Agent工具配置文件覆盖以及当安装的扩展Plugin工具可能在宽松的工具策略下可达时,它也会发出警告。
