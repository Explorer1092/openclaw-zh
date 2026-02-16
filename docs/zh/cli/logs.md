---
title: "`openclaw logs`"
sidebarTitle: "openclaw logs"
mmh3_hash: "96e184e7ffd6f99c3612b325b62ed37b"
summary: "`openclaw logs` 的 CLI 参考(通过 RPC 尾随Gateway日志)"
read_when:
  - 您需要远程尾随Gateway日志(无需 SSH)
  - 您想要用于工具的 JSON 日志行
---

# `openclaw logs`

通过 RPC 尾随Gateway文件日志(在远程模式下工作)。

相关:

- 日志概述:[日志](/logging)

## 示例

```bash
openclaw logs
openclaw logs --follow
openclaw logs --json
openclaw logs --limit 500
openclaw logs --local-time
openclaw logs --follow --local-time
```

使用 `--local-time` 以您的本地时区渲染时间戳。
