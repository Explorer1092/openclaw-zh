---
title: "`openclaw health`"
sidebarTitle: "openclaw health"
mmh3_hash: "10dd2a9449a17d13112359c44c582d79"
summary: "`openclaw health` 的 CLI 参考(通过 RPC 的Gateway健康端点)"
read_when:
  - 您想快速检查正在运行的Gateway的健康状况
---

# `openclaw health`

从正在运行的Gateway获取健康状况。

```bash
openclaw health
openclaw health --json
openclaw health --verbose
```

注意:
- `--verbose` 运行实时探测,并在配置多个账户时打印每个账户的时间。
- 配置多个Agent时,输出包括每个Agent的Session存储。
