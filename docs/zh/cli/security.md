---
mmh3_hash: "2e11427942acef805238fe5ad8c2f460"
summary: "`openclaw security` 的 CLI 参考(审计和修复常见的安全陷阱)"
read_when:
  - 您想对配置/状态运行快速安全审计
  - 您想应用安全的"修复"建议(chmod、加强默认值)
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

当多个 DM 发件人共享主会话时,审计会发出警告,并建议对共享收件箱使用 `session.dmScope="per-channel-peer"`(或对多账户频道使用 `per-account-channel-peer`)。
当使用小型模型(`<=300B`)而没有沙盒并启用 web/浏览器工具时,它也会发出警告。
