---
title: "`openclaw logs`"
mmh3_hash: "f96af2bf58c6dc48618514727959a3c8"
summary: "`openclaw logs` 的 CLI 参考(通过 RPC 尾随网关日志)"
read_when:
  - 您需要远程尾随网关日志(无需 SSH)
  - 您想要用于工具的 JSON 日志行
---

# `openclaw logs`

通过 RPC 尾随网关文件日志(在远程模式下工作)。

相关:
- 日志概述:[日志](/logging)

## 示例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --json
openclaw logs --limit 500
```
