---
title: "Dashboard (Control UI)"
sidebarTitle: "Dashboard"
mmh3_hash: "placeholder"
summary: "Gateway Dashboard(Control UI)访问和身份验证"
read_when: ["更改 Dashboard 身份验证或暴露模式"]
---
# Dashboard (Control UI)

Gateway Dashboard 是默认情况下在 `/` 提供的浏览器 Control UI
(使用 `gateway.controlUi.basePath` 覆盖)。

快速打开(本地 Gateway):

- http://127.0.0.1:18789/(或 http://localhost:18789/)

关键参考:

- [Control UI](/web/control-ui) 用于使用和 UI 功能。
- [Tailscale](/gateway/tailscale) 用于 Serve/Funnel 自动化。
- [Web 界面](/web) 用于绑定模式和安全说明。

身份验证通过 `connect.params.auth` 在 WebSocket 握手时强制执行
(令牌或密码)。请参见 [Gateway 配置](/gateway/configuration) 中的 `gateway.auth`。

安全说明: Control UI 是**管理界面**(聊天、配置、exec 批准)。
不要公开暴露它。UI 在首次加载后将令牌存储在 `localStorage` 中。
首选 localhost、Tailscale Serve 或 SSH 隧道。

## 快速路径(推荐)

- 引导后,CLI 现在使用您的令牌自动打开 Dashboard 并打印相同的令牌化链接。
- 随时重新打开: `openclaw dashboard`(复制链接,如果可能则打开浏览器,如果无头则显示 SSH 提示)。
- 令牌保持本地(仅查询参数);UI 在首次加载后将其剥离并保存在 localStorage 中。

## 令牌基础(本地 vs 远程)

- **Localhost**: 打开 `http://127.0.0.1:18789/`。如果您看到"unauthorized",运行 `openclaw dashboard` 并使用令牌化链接(`?token=...`)。
- **令牌来源**: `gateway.auth.token`(或 `OPENCLAW_GATEWAY_TOKEN`);UI 在首次加载后存储它。
- **非 localhost**: 使用 Tailscale Serve(如果 `gateway.auth.allowTailscale: true` 则无令牌)、带令牌的 tailnet 绑定或 SSH 隧道。请参见 [Web 界面](/web)。

## 如果您看到"unauthorized" / 1008

- 运行 `openclaw dashboard` 以获取新的令牌化链接。
- 确保 Gateway 可访问(本地: `openclaw status`;远程: SSH 隧道 `ssh -N -L 18789:127.0.0.1:18789 user@host` 然后打开 `http://127.0.0.1:18789/?token=...`)。
- 在 Dashboard 设置中,粘贴您在 `gateway.auth.token`(或 `OPENCLAW_GATEWAY_TOKEN`)中配置的相同令牌。
