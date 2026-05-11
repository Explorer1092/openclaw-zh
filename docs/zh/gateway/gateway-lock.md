---
mmh3_hash: "b093edb36f70360881faeb3af315724c"
summary: "使用 WebSocket 监听器绑定的 Gateway 单例守护"
read_when:
  - 运行或调试 gateway 进程
  - 调查单实例强制执行
title: "Gateway 锁定"
---

## 为什么

- 确保在同一主机上每个基础端口只运行一个 gateway 实例；额外的 gateways 必须使用隔离的配置文件和唯一的端口。
- 在崩溃/SIGKILL 后存活，而不会留下过时的锁文件。
- 当控制端口已被占用时，快速失败并提供清晰的错误。

## 机制

- Gateway 首先在状态锁目录下获取每个配置的锁文件，并探测已配置端口是否有现有监听器。
- 如果记录的锁持有者已消失、端口空闲或锁已过期，则启动重新获取锁并继续。
- Gateway 随后使用独占 TCP 监听器绑定 HTTP/WebSocket 监听器（默认 `ws://127.0.0.1:18789`）。
- 如果绑定失败并出现 `EADDRINUSE`，启动会抛出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 关闭时，gateway 关闭 HTTP/WebSocket 服务器并删除锁文件。

## 错误 surface

- 如果另一个进程持有端口，启动会抛出 `GatewayLockError("another gateway instance is already listening on ws://127.0.0.1:<port>")`。
- 其他绑定失败会显示为 `GatewayLockError("failed to bind gateway socket on ws://127.0.0.1:<port>: …")`。

## 操作注意事项

- 如果端口被_另一个_进程占用，错误是相同的；释放端口或使用 `openclaw gateway --port <port>` 选择另一个端口。
- 在服务监督器下，看到现有健康 `/healthz` 响应器的新 gateway 进程会让该进程保持控制。在 systemd 上，重复启动器以代码 78 退出，以便默认的 `RestartPreventExitStatus=78` 在锁或 `EADDRINUSE` 冲突上阻止 `Restart=always` 循环。如果现有进程始终不变为健康状态，重试有界限，启动以明确的锁定错误失败，而不是永久循环。
- macOS 应用程序在生成 gateway 之前仍然维护自己的轻量级 PID 守护；运行时锁由锁文件加上 HTTP/WebSocket 绑定强制执行。

## 相关

- [多个 Gateway](/gateway/multiple-gateways) — 使用唯一端口运行多个实例
- [故障排除](/gateway/troubleshooting) — 诊断 `EADDRINUSE` 和端口冲突
