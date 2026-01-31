---
title: "Bonjour / mDNS 发现"
sidebarTitle: "Bonjour / mDNS"
mmh3_hash: "d81f0081a96d5d48ddcbeb59be659b76"
summary: "Bonjour/mDNS 发现 + 调试(Gateway beacons、clients 和常见故障模式)"
read_when:
  - 在 macOS/iOS 上调试 Bonjour 发现问题
  - 更改 mDNS 服务类型、TXT 记录或发现 UX
---
# Bonjour / mDNS 发现

OpenClaw 使用 Bonjour(mDNS / DNS‑SD)作为 **仅限 LAN 的便利功能**来发现活动的 Gateway(WebSocket 端点)。这是尽力而为的,**不能**替代基于 SSH 或 Tailnet 的连接。

## Wide‑area Bonjour(单播 DNS‑SD)通过 Tailscale

如果节点和 gateway 位于不同的网络上,多播 mDNS 无法跨越边界。您可以通过切换到 **单播 DNS‑SD**("Wide‑Area Bonjour")通过 Tailscale 来保持相同的发现 UX。

高级步骤:

1) 在 gateway 主机上运行 DNS 服务器(可通过 Tailnet 访问)。
2) 在专用区域下发布 `_openclaw-gw._tcp` 的 DNS‑SD 记录(例如:`openclaw.internal.`)。
3) 配置 Tailscale **split DNS**,以便您选择的域通过该 DNS 服务器解析(包括 iOS)。

OpenClaw 支持任何发现域;`openclaw.internal.` 只是一个示例。iOS/Android 节点浏览 `local.` 和您配置的 wide‑area 域。

### Gateway 配置(推荐)

```json5
{
  gateway: { bind: "tailnet" }, // 仅 tailnet(推荐)
  discovery: { wideArea: { enabled: true } } // 启用 wide-area DNS-SD 发布
}
```

### 一次性 DNS 服务器设置(gateway 主机)

```bash
openclaw dns setup --apply
```

这将安装 CoreDNS 并配置它:
- 仅在 gateway 的 Tailscale 接口上监听端口 53
- 从 `~/.openclaw/dns/<domain>.db` 提供您选择的域(例如:`openclaw.internal.`)

从 tailnet 连接的机器验证:

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 设置

在 Tailscale 管理控制台中:

- 添加指向 gateway 的 tailnet IP 的 nameserver(UDP/TCP 53)。
- 添加 split DNS,以便您的发现域使用该 nameserver。

一旦客户端接受 tailnet DNS,iOS 节点可以在您的发现域中浏览 `_openclaw-gw._tcp`,而无需多播。

### Gateway 监听器安全性(推荐)

Gateway WS 端口(默认 `18789`)默认绑定到 loopback。对于 LAN/tailnet 访问,请显式绑定并保持启用认证。

对于仅 tailnet 设置:
- 在 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`。
- 重启 Gateway(或重启 macOS 菜单栏应用)。

## 什么进行广播

只有 Gateway 广播 `_openclaw-gw._tcp`。

## 服务类型

- `_openclaw-gw._tcp` — gateway transport beacon(由 macOS/iOS/Android 节点使用)。

## TXT 键(非机密提示)

Gateway 广播小的非机密提示,以使 UI 流程更方便:

- `role=gateway`
- `displayName=<友好名称>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`(Gateway WS + HTTP)
- `gatewayTls=1`(仅在启用 TLS 时)
- `gatewayTlsSha256=<sha256>`(仅在启用 TLS 且指纹可用时)
- `canvasPort=<port>`(仅在启用 canvas host 时;默认 `18793`)
- `sshPort=<port>`(未覆盖时默认为 22)
- `transport=gateway`
- `cliPath=<path>`(可选;可运行的 `openclaw` 入口点的绝对路径)
- `tailnetDns=<magicdns>`(Tailnet 可用时的可选提示)

## 在 macOS 上调试

有用的内置工具:

- 浏览实例:
  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```
- 解析一个实例(替换 `<instance>`):
  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果浏览有效但解析失败,通常是遇到了 LAN 策略或 mDNS 解析器问题。

## 在 Gateway 日志中调试

Gateway 写入滚动日志文件(在启动时打印为 `gateway log file: ...`)。查找 `bonjour:` 行,特别是:

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

## 在 iOS 节点上调试

iOS 节点使用 `NWBrowser` 发现 `_openclaw-gw._tcp`。

捕获日志:
- Settings → Gateway → Advanced → **Discovery Debug Logs**
- Settings → Gateway → Advanced → **Discovery Logs** → 重现 → **Copy**

日志包括浏览器状态转换和结果集更改。

## 常见故障模式

- **Bonjour 不能跨网络**:使用 Tailnet 或 SSH。
- **多播被阻止**:某些 Wi‑Fi 网络禁用 mDNS。
- **睡眠/接口波动**:macOS 可能暂时丢弃 mDNS 结果;重试。
- **浏览有效但解析失败**:保持机器名称简单(避免表情符号或标点符号),然后重启 Gateway。服务实例名称源自主机名,因此过于复杂的名称可能会混淆某些解析器。

## 转义实例名称(`\032`)

Bonjour/DNS‑SD 通常将服务实例名称中的字节转义为十进制 `\DDD` 序列(例如,空格变为 `\032`)。

- 这在协议级别是正常的。
- UI 应该解码以供显示(iOS 使用 `BonjourEscapes.decode`)。

## 禁用/配置

- `OPENCLAW_DISABLE_BONJOUR=1` 禁用广播(旧版:`OPENCLAW_DISABLE_BONJOUR`)。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 绑定模式。
- `OPENCLAW_SSH_PORT` 覆盖 TXT 中广播的 SSH 端口(旧版:`OPENCLAW_SSH_PORT`)。
- `OPENCLAW_TAILNET_DNS` 在 TXT 中发布 MagicDNS 提示(旧版:`OPENCLAW_TAILNET_DNS`)。
- `OPENCLAW_CLI_PATH` 覆盖广播的 CLI 路径(旧版:`OPENCLAW_CLI_PATH`)。

## 相关文档

- 发现策略和传输选择:[Discovery](/zh/gateway/discovery)
- 节点配对 + 批准:[Gateway pairing](/zh/gateway/pairing)
