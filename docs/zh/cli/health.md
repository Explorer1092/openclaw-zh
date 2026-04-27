---
mmh3_hash: "a72475ca3d6bb80c4d84d4e19a98f7d6"
title: "`openclaw health`"
sidebarTitle: "openclaw health"
summary: "`openclaw health` 的 CLI 参考(通过 RPC 获取 Gateway 健康快照)"
read_when:
  - 您想快速检查正在运行的 Gateway 的健康状况
---

# `openclaw health`

从正在运行的 Gateway 获取健康状况。

选项:

- `--json`:机器可读输出
- `--timeout <ms>`:连接超时(毫秒,默认 `10000`)
- `--verbose`:详细日志
- `--debug`:`--verbose` 的别名

示例:

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

说明:

- 默认 `openclaw health` 向正在运行的 Gateway 请求其健康快照。当 Gateway 已有新鲜的缓存快照时,它可以返回该缓存载荷并在后台刷新。
- `--verbose` 强制进行实时探测,打印 Gateway 连接详情,并在所有已配置的账户和 Agent 中扩展人类可读输出。
- 配置多个 Agent 时,输出包括每个 Agent 的 Session 存储。

## 相关

- [CLI 参考](/cli)
- [Gateway health](/gateway/health)
