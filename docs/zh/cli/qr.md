---
mmh3_hash: "bbdbf3243dc8f29aa3dfec7f7de75a10"
title: "qr"
summary: "`openclaw qr` 的 CLI 参考（生成 iOS 配对二维码和设置码）"
read_when:
  - 需要快速将 iOS 应用与 Gateway 配对
  - 需要用于远程/手动共享的设置码输出
---

# `openclaw qr`

根据当前 Gateway 配置生成 iOS 配对二维码和设置码。

## 用法

```bash
openclaw qr
openclaw qr --setup-code-only
openclaw qr --json
openclaw qr --remote
openclaw qr --url wss://gateway.example/ws --token '<token>'
```

## 选项

- `--remote`：使用配置中的 `gateway.remote.url` 和远程 token/密码
- `--url <url>`：覆盖 payload 中使用的 Gateway URL
- `--public-url <url>`：覆盖 payload 中使用的公开 URL
- `--token <token>`：覆盖 payload 中的 Gateway token
- `--password <password>`：覆盖 payload 中的 Gateway 密码
- `--setup-code-only`：仅打印设置码
- `--no-ascii`：跳过 ASCII 二维码渲染
- `--json`：输出 JSON 格式（`setupCode`、`gatewayUrl`、`auth`、`urlSource`）

## 说明

- `--token` 和 `--password` 互斥。
- 使用 `--remote` 时,如果有效的远程凭据配置为 SecretRef 且您未传递 `--token` 或 `--password`,命令会从活动 Gateway 快照解析它们。如果 Gateway 不可用,命令会快速失败。
- 不使用 `--remote` 时,当未传递 CLI 身份验证覆盖时,本地 Gateway 身份验证 SecretRef 会被解析:
  - `gateway.auth.token` 在令牌身份验证可以获胜时解析(明确的 `gateway.auth.mode="token"` 或推断模式下没有密码来源获胜)。
  - `gateway.auth.password` 在密码身份验证可以获胜时解析(明确的 `gateway.auth.mode="password"` 或推断模式下没有获胜的令牌来自身份验证/环境变量)。
- 如果 `gateway.auth.token` 和 `gateway.auth.password` 都已配置(包括 SecretRef)且 `gateway.auth.mode` 未设置,设置码解析将失败直到明确设置模式。
- Gateway 版本偏差说明:此命令路径需要支持 `secrets.resolve` 的 Gateway;较旧的 Gateway 会返回未知方法错误。
- 扫码后，使用以下命令审批设备配对：
  - `openclaw devices list`
  - `openclaw devices approve <requestId>`
