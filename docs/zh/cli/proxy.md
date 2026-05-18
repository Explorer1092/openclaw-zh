---
mmh3_hash: "16a511e54785ebb13e8d659fb5c226f8"
summary: "`openclaw proxy` 的 CLI 参考，包括操作员管理的代理验证和本地调试代理捕获检查器"
read_when:
  - 您需要在部署前验证操作员管理的代理路由
  - 您需要在本地捕获 OpenClaw 传输流量以进行调试
  - 您想检查调试代理 Session、blob 或内置查询预设
title: "Proxy"
---

# `openclaw proxy`

验证操作员管理的代理路由，或运行本地显式调试代理并检查捕获的流量。

使用 `validate` 在启用 OpenClaw 代理路由之前预检操作员管理的正向代理。其他命令是用于传输级调查的调试工具：它们可以启动本地代理、运行带有捕获启用的子命令、列出捕获 Session、查询常见流量模式、读取捕获的 blob 以及清除本地捕获数据。

## 命令

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy validate [--json] [--proxy-url <url>] [--proxy-ca-file <path>] [--allowed-url <url>] [--denied-url <url>] [--apns-reachable] [--apns-authority <url>] [--timeout-ms <ms>]
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## 验证

`openclaw proxy validate` 检查来自 `--proxy-url`、配置或 `OPENCLAW_PROXY_URL` 的有效操作员管理代理 URL。托管代理 URL 可以使用 `http://` 用于普通正向代理监听器，也可以使用 `https://` 用于 OpenClaw 在发送代理请求前必须先对代理端点建立 TLS 连接的场景。当没有启用和配置代理时，它报告配置问题；在更改配置之前，使用 `--proxy-url` 进行一次性预检。添加 `--proxy-ca-file` 以信任用于连接到 HTTPS 代理端点的私有 CA。默认情况下，它验证公共目标通过代理成功，并且代理无法访问临时回环金丝雀。自定义拒绝的目标为关闭失败：HTTP 响应和模糊的传输失败都会失败，除非您可以单独验证特定于部署的拒绝信号。添加 `--apns-reachable` 以通过代理打开 APNs HTTP/2 CONNECT 隧道并确认沙盒 APNs 响应；探测使用故意无效的 Provider 令牌，因此 APNs `403 InvalidProviderToken` 响应是成功的可达性信号。

选项：

- `--json`：打印机器可读 JSON。
- `--proxy-url <url>`：验证此 `http://` 或 `https://` 代理 URL，而不是配置或环境变量。
- `--proxy-ca-file <path>`：信任此 PEM CA 文件，用于对 HTTPS 代理端点进行 TLS 验证。
- `--allowed-url <url>`：添加预期通过代理成功的目标。重复以检查多个目标。
- `--denied-url <url>`：添加预期被代理阻止的目标。重复以检查多个目标。
- `--apns-reachable`：还验证沙盒 APNs HTTP/2 是否可通过代理访问。
- `--apns-authority <url>`：使用 `--apns-reachable` 探测的 APNs 权威（默认为 `https://api.sandbox.push.apple.com`；生产版本为 `https://api.push.apple.com`）。
- `--timeout-ms <ms>`：每个请求的超时（毫秒）。

有关部署指导和拒绝语义，请参阅[网络代理](/security/network-proxy)。

## 查询预设

`openclaw proxy query --preset <name>` 接受：

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## 注意事项

- `start` 默认为 `127.0.0.1`，除非设置了 `--host`。
- `run` 启动本地调试代理，然后运行 `--` 后面的命令。
- 调试代理的直接上游转发为诊断打开上游套接字。当 OpenClaw 托管代理模式处于活动状态时，默认情况下代理请求和 CONNECT 隧道的直接转发被禁用；仅对经批准的本地诊断设置 `OPENCLAW_DEBUG_PROXY_ALLOW_DIRECT_CONNECT_WITH_MANAGED_PROXY=1`。
- 当代理配置或目标检查失败时，`validate` 以代码 1 退出。
- 捕获是本地调试数据；完成后使用 `openclaw proxy purge`。

## 相关

- [CLI 参考](/cli)
- [网络代理](/security/network-proxy)
- [可信代理身份验证](/gateway/trusted-proxy-auth)
