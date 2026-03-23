---
title: "Dashboard (Control UI)"
sidebarTitle: "Dashboard"
mmh3_hash: "db1054d8d57a6ad361816bcb7febbbb5"
summary: "Gateway Dashboard（Control UI）访问和身份验证"
read_when:
  - 更改 Dashboard 身份验证或暴露模式
---

# Dashboard (Control UI)

Gateway Dashboard 是默认情况下在 `/` 提供的浏览器 Control UI
（使用 `gateway.controlUi.basePath` 覆盖）。

快速打开（本地 Gateway）：

- [http://127.0.0.1:18789/](http://127.0.0.1:18789/)（或 [http://localhost:18789/](http://localhost:18789/)）

关键参考：

- [Control UI](/web/control-ui) 用于使用和 UI 功能。
- [Tailscale](/gateway/tailscale) 用于 Serve/Funnel 自动化。
- [Web 界面](/web) 用于绑定模式和安全说明。

身份验证通过 `connect.params.auth` 在 WebSocket 握手时强制执行
（令牌或密码）。请参见 [Gateway 配置](/gateway/configuration) 中的 `gateway.auth`。

安全说明：Control UI 是**管理界面**（聊天、配置、exec 批准）。
不要公开暴露它。UI 将 Dashboard URL 令牌保留在当前浏览器标签会话和所选 Gateway URL 的
sessionStorage 中，并在加载后从 URL 中清除。
首选 localhost、Tailscale Serve 或 SSH 隧道。

## 快速路径（推荐）

- 引导后，CLI 自动打开 Dashboard 并打印一个干净（无令牌）链接。
- 随时重新打开：`openclaw dashboard`（复制链接，如果可能则打开浏览器，如果无头则显示 SSH 提示）。
- 如果 UI 提示身份验证，将 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）中的令牌粘贴到 Control UI 设置中。

## 令牌基础（本地 vs 远程）

- **Localhost**：打开 `http://127.0.0.1:18789/`。
- **令牌来源**：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）；`openclaw dashboard` 可以通过 URL 片段传递令牌以进行一次性引导，Control UI 将其保留在当前浏览器标签会话和所选 Gateway URL 的 sessionStorage 中，而非 localStorage。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard` 会按设计打印/复制/打开一个无令牌 URL。这避免了在 shell 日志、剪贴板历史或浏览器启动参数中暴露外部管理的令牌。
- 如果 `gateway.auth.token` 配置为 SecretRef 且在您当前的 shell 中未解析，`openclaw dashboard` 仍然打印无令牌 URL 以及可操作的身份验证设置指导。
- **非 localhost**：使用 Tailscale Serve（如果 `gateway.auth.allowTailscale: true` 则 Control UI/WebSocket 无令牌，假设 Gateway 主机受信任；HTTP API 仍需令牌/密码）、带令牌的 tailnet 绑定或 SSH 隧道。请参见 [Web 界面](/web)。

## 如果您看到"unauthorized" / 1008

- 确保 Gateway 可访问（本地：`openclaw status`；远程：SSH 隧道 `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` 然后打开 `http://127.0.0.1:18789/`）。
- 对于 `AUTH_TOKEN_MISMATCH`，当 Gateway 返回重试提示时，客户端可以用缓存的设备令牌进行一次可信重试。如果重试后身份验证仍然失败，请手动解决令牌漂移问题。
- 有关令牌漂移修复步骤，请遵循[令牌漂移恢复清单](/cli/devices#token-drift-recovery-checklist)。
- 从 Gateway 主机检索或提供令牌：
  - 明文配置：`openclaw config get gateway.auth.token`
  - SecretRef 管理的配置：解析外部密钥提供商或在此 shell 中导出 `OPENCLAW_GATEWAY_TOKEN`，然后重新运行 `openclaw dashboard`
  - 未配置令牌：`openclaw doctor --generate-gateway-token`
- 在 Dashboard 设置中，将令牌粘贴到身份验证字段中，然后连接。
