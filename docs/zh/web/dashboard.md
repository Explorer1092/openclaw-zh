---
title: "Dashboard (Control UI)"
sidebarTitle: "Dashboard"
mmh3_hash: "2438c7c2265afd2fb9bae991f33b354c"
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

身份验证通过配置的 Gateway 认证路径在 WebSocket 握手时强制执行：

- `connect.params.auth.token`
- `connect.params.auth.password`
- 当 `gateway.auth.allowTailscale: true` 时的 Tailscale Serve 身份标头
- 当 `gateway.auth.mode: "trusted-proxy"` 时的受信任代理身份标头

请参见 [Gateway 配置](/gateway/configuration) 中的 `gateway.auth`。

安全说明：Control UI 是**管理界面**（聊天、配置、exec 批准）。
不要公开暴露它。UI 将 Dashboard URL 令牌保留在当前浏览器标签会话和所选 Gateway URL 的
sessionStorage 中，并在加载后从 URL 中清除。
首选 localhost、Tailscale Serve 或 SSH 隧道。

## 快速路径（推荐）

- 引导后，CLI 自动打开 Dashboard 并打印一个干净（无令牌）链接。
- 随时重新打开：`openclaw dashboard`（复制链接，如果可能则打开浏览器，如果无头则显示 SSH 提示）。
- 如果 UI 提示身份验证，将 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）中的令牌粘贴到 Control UI 设置中。

## 身份验证基础（本地 vs 远程）

- **Localhost**：打开 `http://127.0.0.1:18789/`。
- **共享密钥令牌来源**：`gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）；`openclaw dashboard` 可以通过 URL 片段传递令牌以进行一次性引导，Control UI 将其保留在当前浏览器标签会话和所选 Gateway URL 的 sessionStorage 中，而非 localStorage。
- 如果 `gateway.auth.token` 由 SecretRef 管理，`openclaw dashboard` 会按设计打印/复制/打开一个无令牌 URL。这避免了在 shell 日志、剪贴板历史或浏览器启动参数中暴露外部管理的令牌。
- 如果 `gateway.auth.token` 配置为 SecretRef 且在您当前的 shell 中未解析，`openclaw dashboard` 仍然打印无令牌 URL 以及可操作的身份验证设置指导。
- **共享密钥密码**：使用配置的 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。Dashboard 不在重新加载时持久化密码。
- **身份标头模式**：当 `gateway.auth.allowTailscale: true` 时，Tailscale Serve 可以通过身份标头满足 Control UI/WebSocket 认证；非环回身份感知反向代理可以满足 `gateway.auth.mode: "trusted-proxy"`。在这些模式下，Dashboard 不需要粘贴共享密钥到 WebSocket。
- **非 localhost**：使用 Tailscale Serve、非环回共享密钥绑定、带 `gateway.auth.mode: "trusted-proxy"` 的非环回身份感知反向代理或 SSH 隧道。HTTP API 仍然使用共享密钥认证，除非您有意运行私有入口 `gateway.auth.mode: "none"` 或受信任代理 HTTP 认证。请参见 [Web 界面](/web)。

## 如果您看到"unauthorized" / 1008

- 确保 Gateway 可访问（本地：`openclaw status`；远程：SSH 隧道 `ssh -N -L 18789:127.0.0.1:18789 user@gateway-host` 然后打开 `http://127.0.0.1:18789/`）。
- 对于 `AUTH_TOKEN_MISMATCH`，当 Gateway 返回重试提示时，客户端可以用缓存的设备令牌进行一次可信重试。该缓存令牌重试重用令牌缓存的已批准范围；显式 `deviceToken` / 显式 `scopes` 调用方保留其请求的范围集。如果重试后身份验证仍然失败，请手动解决令牌漂移问题。
- 在该重试路径之外，连接认证优先级为：显式共享令牌/密码优先，然后是显式 `deviceToken`，然后是存储的设备令牌，然后是引导令牌。
- 在异步 Tailscale Serve Control UI 路径上，相同 `{scope, ip}` 的失败尝试在失败认证限制器记录之前被序列化，因此第二个并发错误重试可能已经显示 `retry later`。
- 有关令牌漂移修复步骤，请遵循[令牌漂移恢复清单](/cli/devices#token-drift-recovery-checklist)。
- 从 Gateway 主机检索或提供共享密钥：
  - 令牌：`openclaw config get gateway.auth.token`
  - 密码：解析配置的 `gateway.auth.password` 或 `OPENCLAW_GATEWAY_PASSWORD`
  - SecretRef 管理的令牌：解析外部密钥提供商或在此 shell 中导出 `OPENCLAW_GATEWAY_TOKEN`，然后重新运行 `openclaw dashboard`
  - 未配置共享密钥：`openclaw doctor --generate-gateway-token`
- 在 Dashboard 设置中，将令牌或密码粘贴到身份验证字段中，然后连接。
- UI 语言选择器在 **Overview -> Gateway Access -> Language**。它是访问卡的一部分，而不是 Appearance 部分。
