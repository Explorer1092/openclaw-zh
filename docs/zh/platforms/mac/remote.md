---
title: "远程 OpenClaw (macOS ⇄ 远程主机)"
sidebarTitle: "远程 OpenClaw"
mmh3_hash: "430945a40e7293911c0e1b5b03a3f1b0"
summary: "macOS 应用通过 SSH 控制远程 OpenClaw gateway 的流程"
read_when:
  - 设置或调试远程 mac 控制
---

# 远程 OpenClaw (macOS ⇄ 远程主机)

此流程让 macOS 应用充当在另一台主机（桌面/服务器）上运行的 OpenClaw gateway 的完整远程控制。这是应用的 **Remote over SSH**（远程运行）功能。所有功能——健康检查、语音唤醒转发和 Web Chat——都重用 _Settings → General_ 中相同的远程 SSH 配置。

## 模式

- **Local (this Mac)**：一切都在笔记本电脑上运行。不涉及 SSH。
- **Remote over SSH（默认）**：OpenClaw 命令在远程主机上执行。mac 应用使用 `-o BatchMode` 加上你选择的身份/密钥和本地端口转发打开 SSH 连接。
- **Remote direct (ws/wss)**：无 SSH 隧道。mac 应用直接连接到 gateway URL（例如，通过 Tailscale Serve 或公共 HTTPS 反向代理）。

## 远程传输

远程模式支持两种传输：

- **SSH tunnel**（默认）：使用 `ssh -N -L ...` 将 gateway 端口转发到 localhost。gateway 将节点的 IP 视为 `127.0.0.1`，因为隧道是 loopback。
- **Direct (ws/wss)**：直接连接到 gateway URL。gateway 看到真实的客户端 IP。

在 SSH tunnel 模式下，发现的 LAN/tailnet 主机名保存为 `gateway.remote.sshTarget`。应用将 `gateway.remote.url` 保持在本地隧道端点，例如 `ws://127.0.0.1:18789`，因此 CLI、Web Chat 和本地 node host 服务都使用相同的安全 loopback 传输。

浏览器自动化在远程模式下由 CLI node host 负责，而不是由原生 macOS 应用节点负责。可能时，应用会启动已安装的 node host 服务；如果你需要从该 Mac 进行浏览器控制，请使用 `openclaw node install ...` 和 `openclaw node start` 安装/启动（或在前台运行 `openclaw node run ...`），然后以该浏览器可用的节点为目标。

## 远程主机的前置条件

1. 安装 Node + pnpm 并构建/安装 OpenClaw CLI（`pnpm install && pnpm build && pnpm link --global`）。
2. 确保 `openclaw` 在非交互式 shell 的 PATH 中（如果需要，符号链接到 `/usr/local/bin` 或 `/opt/homebrew/bin`）。
3. 使用密钥认证打开 SSH。我们推荐使用 **Tailscale** IP 以实现离开局域网的稳定可访问性。

## macOS 应用设置

1. 打开 _Settings → General_。
2. 在 **OpenClaw runs** 下，选择 **Remote over SSH** 并设置：
   - **Transport**: **SSH tunnel** 或 **Direct (ws/wss)**。
   - **SSH target**: `user@host`（可选 `:port`）。
     - 如果 gateway 在同一局域网上并广播 Bonjour，从发现的列表中选择它以自动填充此字段。
   - **Gateway URL**（仅限 Direct）：`wss://gateway.example.ts.net`（或局域网的 `ws://...`）。
   - **Identity file**（高级）：你的密钥路径。
   - **Project root**（高级）：用于命令的远程检出路径。
   - **CLI path**（高级）：可选的可运行 `openclaw` 入口点/二进制文件路径（广播时自动填充）。
3. 点击 **Test remote**。成功表示远程 `openclaw status --json` 正确运行。失败通常意味着 PATH/CLI 问题；退出代码 127 意味着远程找不到 CLI。
4. 健康检查和 Web Chat 现在将自动通过此 SSH 隧道运行。

## Web Chat

- **SSH tunnel**: Web Chat 通过转发的 WebSocket 控制端口（默认 18789）连接到 gateway。
- **Direct (ws/wss)**: Web Chat 直接连接到配置的 gateway URL。
- 不再有单独的 WebChat HTTP 服务器。

## 权限

- 远程主机需要与本地相同的 TCC 批准（自动化、辅助功能、屏幕录制、麦克风、语音识别、通知）。在该机器上运行入门以授予它们一次。
- 节点通过 `node.list` / `node.describe` 广播其权限状态，以便 agent 知道可用的内容。

## 安全说明

- 在远程主机上优先使用 loopback 绑定，并通过 SSH 或 Tailscale 连接。
- SSH 隧道使用严格的主机密钥检查；先信任主机密钥，确保它存在于 `~/.ssh/known_hosts` 中。
- 如果你将 Gateway 绑定到非 loopback 接口，需要有效的 Gateway auth：token、密码，或带有 `gateway.auth.mode: "trusted-proxy"` 的身份感知反向代理。
- 参见 [安全](/gateway/security) 和 [Tailscale](/gateway/tailscale)。

## WhatsApp 登录流程（远程）

- **在远程主机上**运行 `openclaw channels login --verbose`。用手机上的 WhatsApp 扫描二维码。
- 如果认证过期，在该主机上重新运行登录。健康检查将显示链接问题。

## 故障排除

- **exit 127 / not found**: `openclaw` 不在非登录 shell 的 PATH 中。将其添加到 `/etc/paths`、你的 shell rc 或符号链接到 `/usr/local/bin`/`/opt/homebrew/bin`。
- **Health probe failed**: 检查 SSH 可访问性、PATH 以及 Baileys 是否已登录（`openclaw status --json`）。
- **Web Chat stuck**: 确认 gateway 在远程主机上运行，转发的端口匹配 gateway WS 端口；UI 需要健康的 WS 连接。
- **Node IP shows 127.0.0.1**: SSH 隧道的预期行为。如果你希望 gateway 看到真实的客户端 IP，请将 **Transport** 切换到 **Direct (ws/wss)**（参见 [macOS 远程访问](/platforms/mac/remote)）。
- **Voice Wake**: 触发短语在远程模式下自动转发；不需要单独的转发器。

## 通知声音

使用 `openclaw` 和 `node.invoke` 从脚本中为每个通知选择声音，例如：

```bash
openclaw nodes notify --node <id> --title "Ping" --body "Remote gateway ready" --sound Glass
```

应用中不再有全局"默认声音"切换；调用者为每个请求选择声音（或无）。

## 相关文档

- [macOS 应用](/platforms/macos)
- [远程访问](/gateway/remote)
