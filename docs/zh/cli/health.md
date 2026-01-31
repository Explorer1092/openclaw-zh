---
title: "`openclaw health`"
mmh3_hash: "cf8ce2db55b62a3f70bbed7eb9a798ba"
summary: "`openclaw health` 的 CLI 参考(通过 RPC 的网关健康端点)"
read_when:
  - 您想快速检查正在运行的网关的健康状况
---

# `openclaw health`

从正在运行的网关获取健康状况。

```bash
openclaw health
openclaw health --json
openclaw health --verbose
```

注意:
- `--verbose` 运行实时探测,并在配置多个账户时打印每个账户的时间。
- 配置多个代理时,输出包括每个代理的会话存储。
