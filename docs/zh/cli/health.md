---
mmh3_hash: "002710f94b16a6553a94ff8e1155d7d0"
summary: "`openclaw health` 的 CLI 参考（通过 RPC 获取 Gateway 健康快照）"
read_when:
  - 您想快速检查运行中 Gateway 的健康状况
title: "Health"
---

# `openclaw health`

从运行中的 Gateway 获取健康状态。

## 选项

| 标志             | 默认值  | 描述                                                         |
| ---------------- | ------- | ------------------------------------------------------------ |
| `--json`         | `false` | 打印机器可读的 JSON 而不是文本。                             |
| `--timeout <ms>` | `10000` | 连接超时（毫秒）。                                           |
| `--verbose`      | `false` | 详细日志。强制实时探测并展开每个 Agent 的输出。              |
| `--debug`        | `false` | `--verbose` 的别名。                                         |

示例：

```bash
openclaw health
openclaw health --json
openclaw health --timeout 2500
openclaw health --verbose
openclaw health --debug
```

注意：

- 默认 `openclaw health` 向运行中的 Gateway 请求其健康快照。当 Gateway 已有新鲜的缓存快照时，它可以返回该缓存有效载荷并在后台刷新。
- `--verbose` 强制实时探测，打印 Gateway 连接详情，并在所有已配置的账户和 Agent 上展开人类可读的输出。
- 当配置了多个 Agent 时，输出包含每个 Agent 的 Session 存储。

## 相关

- [CLI 参考](/cli)
- [Gateway health](/gateway/health)
