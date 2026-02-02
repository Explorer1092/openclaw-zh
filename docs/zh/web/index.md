---
title: "Web (Gateway)"
mmh3_hash: "5165719c1bb55eb5d91165eb4ee3338c"
summary: "Gateway Web 界面: Control UI、绑定模式和安全性"
read_when: ["您想通过 Tailscale 访问 Gateway","您想要浏览器 Control UI 和配置编辑"]
---
# Web (Gateway)

Gateway 从与 Gateway WebSocket 相同的端口提供小型**浏览器 Control UI**(Vite + Lit):

- 默认: `http://<host>:18789/`
- 可选前缀: 设置 `gateway.controlUi.basePath`(例如 `/openclaw`)

功能在 [Control UI](/web/control-ui) 中。
本页重点关注绑定模式、安全性和面向 Web 的界面。

## Webhooks

当 `hooks.enabled=true` 时,Gateway 还在同一 HTTP 服务器上公开一个小型 webhook 端点。
有关身份验证 + 负载,请参见 [Gateway 配置](/gateway/configuration) → `hooks`。

## 配置(默认开启)

当资产存在时(`dist/control-ui`),Control UI **默认启用**。
您可以通过配置控制它:

```json5
{
  gateway: {
    controlUi: { enabled: true, basePath: "/openclaw" }, // basePath 可选
  },
}
```

## Tailscale 访问

### 集成 Serve(推荐)

将 Gateway 保持在环回上,让 Tailscale Serve 代理它:

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

然后启动 Gateway:

```bash
openclaw gateway
```

打开:

- `https://<magicdns>/`(或您配置的 `gateway.controlUi.basePath`)

### Tailnet 绑定 + 令牌

```json5
{
  gateway: {
    bind: "tailnet",
    controlUi: { enabled: true },
    auth: { mode: "token", token: "your-token" },
  },
}
```

然后启动 Gateway(非环回绑定需要令牌):

```bash
openclaw gateway
```

打开:

- `http://<tailscale-ip>:18789/`(或您配置的 `gateway.controlUi.basePath`)

### 公共互联网(Funnel)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password" }, // 或 OPENCLAW_GATEWAY_PASSWORD
  },
}
```

## 安全说明

- 默认情况下需要 Gateway 身份验证(令牌/密码或 Tailscale 身份标头)。
- 非环回绑定仍然**需要**共享令牌/密码(`gateway.auth` 或 env)。
- 向导默认生成 Gateway 令牌(即使在环回上)。
- UI 发送 `connect.params.auth.token` 或 `connect.params.auth.password`。
- 使用 Serve 时,当
  `gateway.auth.allowTailscale` 为 `true` 时,Tailscale 身份标头可以满足身份验证(不需要令牌/密码)。设置
  `gateway.auth.allowTailscale: false` 以要求显式凭证。请参见
  [Tailscale](/gateway/tailscale) 和 [安全性](/gateway/security)。
- `gateway.tailscale.mode: "funnel"` 需要 `gateway.auth.mode: "password"`(共享密码)。

## 构建 UI

Gateway 从 `dist/control-ui` 提供静态文件。使用以下命令构建它们:

```bash
pnpm ui:build # 首次运行时自动安装 UI 依赖项
```
