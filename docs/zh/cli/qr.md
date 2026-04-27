---
mmh3_hash: "bec6b0e571d225a24b52c6592945a996"
title: "`openclaw qr`"
sidebarTitle: "openclaw qr"
summary: "`openclaw qr` 的 CLI 参考(生成移动端配对二维码和设置码)"
read_when:
  - 您想快速将移动 Node 应用与 Gateway 配对
  - 您需要用于远程/手动共享的设置码输出
---

# `openclaw qr`

根据当前 Gateway 配置生成移动端配对二维码和设置码。

## 用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws
```

## 选项

- `--remote`:优先使用 `gateway.remote.url`;如果未设置,`gateway.tailscale.mode=serve|funnel` 仍可提供远程公开 URL
- `--url <url>`:覆盖 payload 中使用的 Gateway URL
- `--public-url <url>`:覆盖 payload 中使用的公开 URL
- `--token <token>`:覆盖引导流程对应的 Gateway 令牌
- `--password <password>`:覆盖引导流程对应的 Gateway 密码
- `--setup-code-only`:仅打印设置码
- `--no-ascii`:跳过 ASCII 二维码渲染
- `--json`:输出 JSON 格式(`setupCode`、`gatewayUrl`、`auth`、`urlSource`)

## 说明

- `--token` 和 `--password` 互斥。
- 设置码本身现在携带一个不透明的短期 `bootstrapToken`,而非共享的 Gateway 令牌/密码。
- 在内置 Node/操作员引导流程中,主要 Node 令牌仍以 `scopes: []` 落地。
- 如果引导切换也发放操作员令牌,它受引导允许列表限制:`operator.approvals`、`operator.read`、`operator.talk.secrets`、`operator.write`。
- 引导范围检查有角色前缀。该操作员允许列表只满足操作员请求;非操作员角色仍需在自己的角色前缀下的范围。
- 移动配对对 Tailscale/公开 `ws://` Gateway URL 失败关闭。私有局域网 `ws://` 仍受支持,但 Tailscale/公开移动路由应使用 Tailscale Serve/Funnel 或 `wss://` Gateway URL。
- 使用 `--remote` 时,OpenClaw 需要 `gateway.remote.url` 或 `gateway.tailscale.mode=serve|funnel`。
- 使用 `--remote` 时,如果有效的活动远程凭据配置为 SecretRef 且您未传递 `--token` 或 `--password`,命令会从活动 Gateway 快照解析它们。如果 Gateway 不可用,命令会快速失败。
- 不使用 `--remote` 时,当未传递 CLI 身份验证覆盖时,本地 Gateway 身份验证 SecretRef 会被解析:
  - `gateway.auth.token` 在令牌身份验证可以获胜时解析(明确的 `gateway.auth.mode="token"` 或推断模式下没有密码来源获胜)。
  - `gateway.auth.password` 在密码身份验证可以获胜时解析(明确的 `gateway.auth.mode="password"` 或推断模式下没有获胜的令牌来自身份验证/环境变量)。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置(包括 SecretRef)且 `gateway.auth.mode` 未设置,设置码解析将失败直到明确设置模式。
- Gateway 版本偏差说明:此命令路径需要支持 `secrets.resolve` 的 Gateway;较旧的 Gateway 会返回未知方法错误。
- 扫码后,使用以下命令批准设备配对:
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`

## 相关

- [CLI 参考](/cli)
- [配对](/cli/pairing)
