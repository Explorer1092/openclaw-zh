---
mmh3_hash: "623e80df1acd1645b45c108bb4984627"
summary: "Bonjour/mDNS 发现 + 调试(Gateway beacon、客户端和常见故障模式)"
read_when:
  - 在 macOS/iOS 上调试 Bonjour 发现问题
  - 更改 mDNS 服务类型、TXT 记录或发现 UX
title: "Bonjour Discovery"
---

# Bonjour / mDNS 发现

OpenClaw 使用 Bonjour（mDNS / DNS‑SD）来发现活动的 Gateway（WebSocket 端点）。多播 `local.` 浏览是一种**仅限 LAN 的便利功能**。对于跨网络发现，同一 beacon 也可以通过配置的广域 DNS-SD 域发布。发现仍然是尽力而为的，**不能**替代基于 SSH 或 Tailnet 的连接。

## Wide-area Bonjour（单播 DNS-SD）通过 Tailscale

如果节点和 Gateway 位于不同的网络上，多播 mDNS 无法跨越边界。您可以通过切换到**单播 DNS-SD**（"Wide-Area Bonjour"）通过 Tailscale 来保持相同的发现 UX。

高级步骤：

1. 在 Gateway 主机上运行 DNS 服务器（可通过 Tailnet 访问）。
2. 在专用区域下发布 `_openclaw-gw._tcp` 的 DNS-SD 记录（例如：`openclaw.internal.`）。
3. 配置 Tailscale **split DNS**，以便您选择的域通过该 DNS 服务器解析客户端（包括 iOS）。

OpenClaw 支持任何发现域；`openclaw.internal.` 只是一个示例。iOS/Android 节点浏览 `local.` 和您配置的广域域。

### Gateway 配置（推荐）

```json5
{
  gateway: { bind: "tailnet" }, // 仅 tailnet（推荐）
  discovery: { wideArea: { enabled: true } }, // 启用 wide-area DNS-SD 发布
}
```

### 一次性 DNS 服务器设置（Gateway 主机）

```bash
openclaw dns setup --apply
```

这将安装 CoreDNS 并配置它：

- 仅在 Gateway 的 Tailscale 接口上监听端口 53
- 从 `~/.openclaw/dns/<domain>.db` 提供您选择的域（例如：`openclaw.internal.`）

从 Tailnet 连接的机器验证：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 设置

在 Tailscale 管理控制台中：

- 添加指向 Gateway 的 Tailnet IP 的 nameserver（UDP/TCP 53）。
- 添加 split DNS，以便您的发现域使用该 nameserver。

一旦客户端接受 Tailnet DNS，iOS 节点和 CLI 发现可以在您的发现域中浏览 `_openclaw-gw._tcp`，而无需多播。

### Gateway 监听器安全性（推荐）

Gateway WS 端口（默认 `18789`）默认绑定到 loopback。对于 LAN/Tailnet 访问，请显式绑定并保持启用认证。

对于仅 Tailnet 设置：

- 在 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`。
- 重启 Gateway（或重启 macOS 菜单栏应用）。

## 什么进行广播

只有 Gateway 广播 `_openclaw-gw._tcp`。LAN 多播广播由捆绑的 `bonjour` 插件提供；wide-area DNS-SD 发布由 Gateway 自己拥有。

## 服务类型

- `_openclaw-gw._tcp` — gateway transport beacon（由 macOS/iOS/Android 节点使用）。

## TXT 键（非机密提示）

Gateway 广播小的非机密提示，以使 UI 流程更方便：

- `role=gateway`
- `displayName=<友好名称>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（Gateway WS + HTTP）
- `gatewayTls=1`（仅在启用 TLS 时）
- `gatewayTlsSha256=<sha256>`（仅在启用 TLS 且指纹可用时）
- `canvasPort=<port>`（仅在启用 canvas host 时；当前与 `gatewayPort` 相同）
- `transport=gateway`
- `tailnetDns=<magicdns>`（Tailnet 可用时的可选提示）
- `sshPort=<port>`（仅 mDNS 完整模式；wide-area DNS-SD 可能省略）
- `cliPath=<path>`（仅 mDNS 完整模式；wide-area DNS-SD 仍将其作为远程安装提示写入）

安全注意事项：

- Bonjour/mDNS TXT 记录是**未经身份验证的**。客户端不得将 TXT 视为权威路由。
- 客户端应使用解析的服务端点（SRV + A/AAAA）进行路由。将 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 仅视为提示。
- SSH 自动定向同样应使用解析的服务主机，而非仅 TXT 提示。
- TLS 固定绝不能允许广播的 `gatewayTlsSha256` 覆盖先前存储的固定。
- iOS/Android 节点应将基于发现的直接连接视为**仅 TLS**，并在信任首次指纹之前要求明确的用户确认。

## 在 macOS 上调试

有用的内置工具：

- 浏览实例：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析一个实例（替换 `<instance>`）：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果浏览有效但解析失败，通常是遇到了 LAN 策略或 mDNS 解析器问题。

## 在 Gateway 日志中调试

Gateway 写入滚动日志文件（在启动时打印为 `gateway log file: ...`）。查找 `bonjour:` 行，特别是：

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`
- `bonjour: disabling advertiser after ... failed restarts ...`

## 在 iOS 节点上调试

iOS 节点使用 `NWBrowser` 发现 `_openclaw-gw._tcp`。

捕获日志：

- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 重现 → **Copy**

日志包括浏览器状态转换和结果集更改。

## 何时禁用 Bonjour

仅当 LAN 多播广播不可用或有害时才禁用 Bonjour。常见情况是 Gateway 在 Docker bridge 网络、WSL 或丢弃 mDNS 多播的网络策略后面运行。在这些环境中，Gateway 仍然可以通过其发布的 URL、SSH、Tailnet 或 wide-area DNS-SD 访问，但 LAN 自动发现不可靠。

当问题是部署范围时，优先使用现有的环境变量覆盖：

```bash
OPENCLAW_DISABLE_BONJOUR=1
```

这会在不更改插件配置的情况下禁用 LAN 多播广播。对于 Docker 镜像、服务文件、启动脚本和一次性调试来说是安全的，因为该设置会随环境一起消失。

仅当您有意要关闭该 OpenClaw 配置的捆绑 LAN 发现插件时，才使用插件配置：

```bash
openclaw plugins disable bonjour
```

## Docker 注意事项

当 `OPENCLAW_DISABLE_BONJOUR` 未设置时，捆绑的 Bonjour 插件在检测到的容器中自动禁用 LAN 多播广播。Docker bridge 网络通常不会在容器和 LAN 之间转发 mDNS 多播（`224.0.0.251:5353`），因此从容器广播很少能使发现正常工作。

重要注意事项：

- 禁用 Bonjour 不会停止 Gateway。它只是停止 LAN 多播广播。
- 禁用 Bonjour 不会更改 `gateway.bind`；Docker 仍然默认为 `OPENCLAW_GATEWAY_BIND=lan`，以便发布的主机端口可以工作。
- 禁用 Bonjour 不会禁用 wide-area DNS-SD。当 Gateway 和节点不在同一 LAN 上时，使用 wide-area discovery 或 Tailnet。
- 在 Docker 外部重用相同的 `OPENCLAW_CONFIG_DIR` 不会保留容器自动禁用策略。
- 仅对主机网络、macvlan 或已知 mDNS 多播可以通过的其他网络设置 `OPENCLAW_DISABLE_BONJOUR=0`；设置为 `1` 以强制禁用。

## 禁用 Bonjour 的故障排除

如果节点在 Docker 设置后不再自动发现 Gateway：

1. 确认 Gateway 是在自动、强制开启还是强制关闭模式下运行：

   ```bash
   docker compose config | grep OPENCLAW_DISABLE_BONJOUR
   ```

2. 确认 Gateway 本身可以通过发布的端口访问：

   ```bash
   curl -fsS http://127.0.0.1:18789/healthz
   ```

3. 当 Bonjour 被禁用时使用直连目标：
   - Control UI 或本地工具：`http://127.0.0.1:18789`
   - LAN 客户端：`http://<gateway-host>:18789`
   - 跨网络客户端：Tailnet MagicDNS、Tailnet IP、SSH 隧道或 wide-area DNS-SD

4. 如果您在 Docker 中通过 `OPENCLAW_DISABLE_BONJOUR=0` 有意启用了 Bonjour，请从主机测试多播：

   ```bash
   dns-sd -B _openclaw-gw._tcp local.
   ```

   如果浏览为空或 Gateway 日志显示重复的 ciao watchdog 取消，请还原为 `OPENCLAW_DISABLE_BONJOUR=1` 并使用直连或 Tailnet 路由。

## 常见故障模式

- **Bonjour 不能跨网络**：使用 Tailnet 或 SSH。
- **多播被阻止**：某些 Wi‑Fi 网络禁用 mDNS。
- **广播器卡在探测/广播中**：具有被阻止多播、容器 bridge、WSL 或接口波动的主机可能会使 ciao 广播器处于未广播状态。OpenClaw 重试几次，然后禁用当前 Gateway 进程的 Bonjour，而不是永久重启广播器。
- **Docker bridge 网络**：Bonjour 在检测到的容器中自动禁用。仅对主机、macvlan 或其他支持 mDNS 的网络设置 `OPENCLAW_DISABLE_BONJOUR=0`。
- **睡眠/接口波动**：macOS 可能暂时丢弃 mDNS 结果；重试。
- **浏览有效但解析失败**：保持机器名称简单（避免表情符号或标点符号），然后重启 Gateway。服务实例名称源自主机名，因此过于复杂的名称可能会混淆某些解析器。

## 转义实例名称（`\032`）

Bonjour/DNS‑SD 通常将服务实例名称中的字节转义为十进制 `\DDD` 序列（例如，空格变为 `\032`）。

- 这在协议级别是正常的。
- UI 应该解码以供显示（iOS 使用 `BonjourEscapes.decode`）。

## 禁用/配置

- `openclaw plugins disable bonjour` 通过禁用捆绑插件来禁用 LAN 多播广播。
- `openclaw plugins enable bonjour` 恢复默认的 LAN 发现插件。
- `OPENCLAW_DISABLE_BONJOUR=1` 在不更改插件配置的情况下禁用 LAN 多播广播；接受的真值为 `1`、`true`、`yes` 和 `on`（旧版：`OPENCLAW_DISABLE_BONJOUR`）。
- `OPENCLAW_DISABLE_BONJOUR=0` 强制开启 LAN 多播广播，包括在检测到的容器内；接受的假值为 `0`、`false`、`no` 和 `off`。
- 当 `OPENCLAW_DISABLE_BONJOUR` 未设置时，Bonjour 在普通主机上广播，在检测到的容器内自动禁用。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 绑定模式。
- `OPENCLAW_SSH_PORT` 覆盖广播 `sshPort` 时使用的 SSH 端口（旧版：`OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` 在 mDNS 完整模式启用时在 TXT 中发布 MagicDNS 提示（旧版：`OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` 覆盖广播的 CLI 路径（旧版：`OPENCLAW_CLI_PATH`）。

## 相关文档

- 发现策略和传输选择：[Discovery](/gateway/discovery)
- 节点配对 + 批准：[Gateway pairing](/gateway/pairing)
