---
mmh3_hash: "29dc3cc4888f8337378802e9be5a69c9"
summary: "`openclaw proxy` 的 CLI 参考 — 本地调试代理和捕获检查器"
read_when:
  - 您需要在本地捕获 OpenClaw 传输流量以进行调试
  - 您想检查调试代理 Session、数据块或内置查询预设
title: "Proxy"
---

# `openclaw proxy`

运行本地显式调试代理并检查捕获的流量。

这是用于传输层排查的调试命令。它可以启动本地代理、在启用捕获的情况下运行子命令、列出捕获 Session、查询常见流量模式、读取捕获的数据块以及清除本地捕获数据。

## 命令

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 查询预设

`openclaw proxy query --preset <name>` 接受以下预设：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 说明

- `start` 默认绑定到 `127.0.0.1`，除非设置了 `--host`。
- `run` 启动本地调试代理，然后运行 `--` 之后的命令。
- 捕获数据为本地调试数据；完成后请使用 `openclaw proxy purge` 清除。

## 相关链接

- [CLI 参考](/cli)
- [受信任代理认证](/gateway/trusted-proxy-auth)
