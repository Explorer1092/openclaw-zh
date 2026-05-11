---
mmh3_hash: "06bc0d55e2f31b5f068dc8d2e71e302e"
summary: "网关仪表板的集成 Tailscale Serve/Funnel"
read_when:
  - 在 localhost 外暴露 Gateway Control UI
  - 自动化 tailnet 或公共仪表板访问
title: "Tailscale"
---

OpenClaw 可以为网关仪表板和 WebSocket 端口自动配置 Tailscale **Serve**(tailnet)或 **Funnel**(公共)。这使网关保持绑定到环回,而 Tailscale 提供 HTTPS、路由和(对于 Serve)身份头。

## 模式

- `serve`:通过 `tailscale serve` 仅 Tailnet Serve。网关停留在 `127.0.0.1`。
- `funnel`:通过 `tailscale funnel` 公共 HTTPS。OpenClaw 需要共享密码。
- `off`:默认(无 Tailscale 自动化)。

Status 和审计输出使用 **Tailscale exposure** 来表示此 OpenClaw Serve/Funnel 模式。`off` 意味着 OpenClaw 未管理 Serve 或 Funnel；它不意味着本地 Tailscale 守护进程已停止或注销。

## 身份验证

设置 `gateway.auth.mode` 来控制握手:

- `none`（仅私有 ingress）
- `token`（当设置 `OPENCLAW_GATEWAY_TOKEN` 时默认）
- `password`（通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置的共享密钥）
- `trusted-proxy`（身份感知反向代理；参见 [Trusted Proxy Auth](/gateway/trusted-proxy-auth)）

当 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 为 `true` 时,Control UI/WebSocket 身份验证可以使用 Tailscale 身份头(`tailscale-user-login`)而无需提供令牌/密码。OpenClaw 通过本地 Tailscale 守护进程(`tailscale whois`)解析 `x-forwarded-for` 地址并将其与头匹配来验证身份,然后接受它。OpenClaw 仅在请求来自环回并带有 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 头时将请求视为 Serve。
对于包含浏览器设备身份的 Control UI 操作员 Session，此已验证的 Serve 路径也会跳过设备配对往返。它不会绕过浏览器设备身份：无设备的客户端仍会被拒绝，节点角色或非 Control UI WebSocket 连接仍遵循正常的配对和认证检查。
HTTP API 端点（例如 `/v1/*`、`/tools/invoke` 和 `/api/channels/*`）**不**使用 Tailscale 身份头认证。它们仍遵循 Gateway 正常的 HTTP 认证模式：默认为共享密钥认证，或有意配置的 trusted-proxy / 私有 ingress `none` 设置。
此无令牌流程假设 Gateway 主机是可信的。如果不受信任的本地代码可能在同一主机上运行，请禁用 `gateway.auth.allowTailscale` 并改为要求令牌/密码身份验证。
要求明确的共享密钥凭证，请设置 `gateway.auth.allowTailscale: false` 并使用 `gateway.auth.mode: "token"` 或 `"password"`。

## 配置示例

### 仅 Tailnet(Serve)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" }
  }
}
```

打开:`https://<magicdns>/`(或您配置的 `gateway.controlUi.basePath`)

### 仅 Tailnet(绑定到 Tailnet IP)

当您希望网关直接侦听 Tailnet IP(无 Serve/Funnel)时使用此选项。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" }
  }
}
```

从另一个 Tailnet 设备连接:
- 控制 UI:`http://<tailscale-ip>:18789/`
- WebSocket:`ws://<tailscale-ip>:18789`

<Note>
在此模式下,环回(`http://127.0.0.1:18789`)将**无法**工作。
</Note>

### 公共互联网(Funnel + 共享密码)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" }
  }
}
```

优先选择 `OPENCLAW_GATEWAY_PASSWORD` 而不是将密码提交到磁盘。

## CLI 示例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

## 注意事项

- Tailscale Serve/Funnel 需要安装并登录 `tailscale` CLI。
- `tailscale.mode: "funnel"` 拒绝启动,除非身份验证模式为 `password` 以避免公共暴露。
- 如果您希望 OpenClaw 在关闭时撤消 `tailscale serve` 或 `tailscale funnel` 配置，请设置 `gateway.tailscale.resetOnExit`。
- 设置 `gateway.tailscale.preserveFunnel: true` 可在 Gateway 重启时保持外部配置的 `tailscale funnel` 路由存活。启用后且 Gateway 在 `mode: "serve"` 下运行时，OpenClaw 在重新应用 Serve 前检查 `tailscale funnel status`，若 Funnel 路由已覆盖 Gateway 端口则跳过。OpenClaw 管理的 Funnel 密码专用策略不变。
- `gateway.bind: "tailnet"` 是直接 Tailnet 绑定（无 HTTPS，无 Serve/Funnel）。
- `gateway.bind: "auto"` 优先选择环回;如果需要仅 Tailnet,请使用 `tailnet`。
- Serve/Funnel 仅暴露**网关控制 UI + WS**。节点通过相同的网关 WS 端点连接,因此 Serve 可以用于节点访问。

## 浏览器控制(远程网关 + 本地浏览器)

如果您在一台机器上运行网关但想在另一台机器上驱动浏览器,请在浏览器机器上运行**节点主机**并将两者保持在同一 tailnet 上。网关将浏览器操作代理到节点;不需要单独的控制服务器或 Serve URL。

避免将 Funnel 用于浏览器控制;将节点配对视为操作员访问。

## Tailscale 先决条件 + 限制

- Serve 需要为您的 tailnet 启用 HTTPS;如果缺少,CLI 会提示。
- Serve 注入 Tailscale 身份头;Funnel 不会。
- Funnel 需要 Tailscale v1.38.3+、MagicDNS、启用 HTTPS 和 funnel 节点属性。
- Funnel 仅支持通过 TLS 的端口 `443`、`8443` 和 `10000`。
- macOS 上的 Funnel 需要开源 Tailscale 应用变体。

## 了解更多

- Tailscale Serve 概述:https://tailscale.com/kb/1312/serve
- `tailscale serve` 命令:https://tailscale.com/kb/1242/tailscale-serve
- Tailscale Funnel 概述:https://tailscale.com/kb/1223/tailscale-funnel
- `tailscale funnel` 命令:https://tailscale.com/kb/1311/tailscale-funnel

## 相关

- [远程访问](/gateway/remote)
- [发现](/gateway/discovery)
- [认证](/gateway/authentication)
