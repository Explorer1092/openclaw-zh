---
mmh3_hash: "155fb5f7d2d9227796c3b49b891f4e44"
summary: "`openclaw qr` 的 CLI 参考（生成移动端配对二维码和设置码）"
read_when:
  - 您想快速将移动端 Node 应用与 Gateway 配对
  - 您需要用于远程/手动共享的设置码输出
title: "QR"
---

# `openclaw qr`

从您当前的 Gateway 配置生成移动端配对二维码和设置码。

## 用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## 选项

- `--remote`：优先使用 `gateway.remote.url`；如果未设置，`gateway.tailscale.mode=serve|funnel` 仍然可以提供远程公共 URL
- `--url <url>`：覆盖有效载荷中使用的 Gateway URL
- `--public-url <url>`：覆盖有效载荷中使用的公共 URL
- `--token <token>`：覆盖引导流程身份验证的 Gateway 令牌
- `--password <password>`：覆盖引导流程身份验证的 Gateway 密码
- `--setup-code-only`：仅打印设置码
- `--no-ascii`：跳过 ASCII 二维码渲染
- `--json`：发出 JSON（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 注意事项

- `--token` 和 `--password` 互斥。
- 设置码本身现在携带不透明的短期 `bootstrapToken`，而非共享的 Gateway 令牌/密码。
- 在内置的 Node/操作员引导流程中，主 Node 令牌仍以 `scopes: []` 到达。
- 如果引导交接还颁发操作员令牌，它被限制在引导允许列表范围内：`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`。
- 引导范围检查带有角色前缀。该操作员允许列表仅满足操作员请求；非操作员角色仍需要其自己角色前缀下的范围。
- 移动端配对对 Tailscale/公共 `ws://` Gateway URL 关闭失败。私有 LAN 地址和 `.local` Bonjour 主机仍然支持通过 `ws://`，但 Tailscale/公共移动路由应使用 Tailscale Serve/Funnel 或 `wss://` Gateway URL。
- 使用 `--remote` 时，OpenClaw 需要 `gateway.remote.url` 或 `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 时，如果有效的远程凭据配置为 SecretRef 且您未传递 `--token` 或 `--password`，命令会从活动的 Gateway 快照解析它们。如果 Gateway 不可用，命令快速失败。
- 不使用 `--remote` 时，当未传递 CLI 身份验证覆盖时，解析本地 Gateway 身份验证 SecretRef：
  - 当令牌身份验证可以获胜时（显式 `gateway.auth.mode="token"` 或推断模式下没有密码源获胜），解析 `gateway.auth.token`。
  - 当密码身份验证可以获胜时（显式 `gateway.auth.mode="password"` 或推断模式下没有来自 auth/env 的获胜令牌），解析 `gateway.auth.password`。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置（包括 SecretRef）且 `gateway.auth.mode` 未设置，设置码解析失败，直到显式设置模式。
- Gateway 版本偏差注意：此命令路径需要支持 `secrets.resolve` 的 Gateway；旧版 Gateway 返回未知方法错误。
- 扫描后，使用以下命令批准设备配对：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 相关

- [CLI 参考](/cli)
- [配对](/cli/pairing)
