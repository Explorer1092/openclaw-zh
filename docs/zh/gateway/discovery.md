---
mmh3_hash: "dc2814035c78f2d8ad90b2c1b1605578"
summary: "节点发现和传输(Bonjour、Tailscale、SSH)用于查找 Gateway"
read_when:
  - 实现或更改 Bonjour 发现/广播
  - 调整远程连接模式(直连 vs SSH)
  - 为远程节点设计节点发现 + 配对
title: "发现与传输"
---

# 发现与传输

OpenClaw 有两个表面上看起来相似的不同问题:

1. **操作员远程控制**:macOS 菜单栏应用程序控制在其他地方运行的 Gateway。
2. **节点配对**:iOS/Android(和未来的节点)找到 Gateway 并安全配对。

设计目标是将所有网络发现/广播保留在 **Node Gateway**(`openclaw gateway`)中,并将客户端(mac 应用、iOS)作为消费者。

## 术语

- **Gateway**:单个长时间运行的 Gateway 进程,拥有状态(Session、配对、节点注册表)并运行 Channel。大多数设置每个主机使用一个;隔离的多 Gateway 设置是可能的。
- **Gateway WS(控制平面)**:默认情况下在 `127.0.0.1:18789` 上的 WebSocket 端点;可以通过 `gateway.bind` 绑定到 LAN/tailnet。
- **直连 WS 传输**:面向 LAN/tailnet 的 Gateway WS 端点(无 SSH)。
- **SSH 传输(回退)**:通过 SSH 转发 `127.0.0.1:18789` 进行远程控制。
- **旧版 TCP Bridge（已移除）**：较旧的节点传输（参见 [Bridge 协议](/gateway/bridge-protocol)）；不再为发现而广播，当前构建中不再存在。

协议详情:

- [Gateway 协议](/gateway/protocol)
- [Bridge 协议(旧版)](/gateway/bridge-protocol)

## 为什么我们保留"直连"和 SSH

- **直连 WS** 是同一网络和 tailnet 内的最佳 UX:
  - 通过 Bonjour 在 LAN 上自动发现
  - Gateway 拥有配对令牌 + ACL
  - 不需要 Shell 访问;协议表面可以保持紧凑和可审计
- **SSH** 仍然是通用回退:
  - 在您有 SSH 访问的任何地方工作(即使跨不相关的网络)
  - 在多播/mDNS 问题中存活
  - 除了 SSH 之外不需要新的入站端口

## 发现输入(客户端如何了解 Gateway 在哪里)

### 1) Bonjour / DNS-SD 发现

多播 Bonjour 是尽力而为的，不能跨网络。OpenClaw 也可以通过配置的广域 DNS-SD 域浏览相同的 Gateway 信标，因此发现可以覆盖：

- 同一 LAN 上的 `local.`
- 配置的单播 DNS-SD 域用于跨网络发现

目标方向：

- **Gateway** 通过 Bonjour 广播其 WS 端点。
- 客户端浏览并显示"选择 Gateway"列表，然后存储所选端点。

故障排除和信标详情：[Bonjour](/gateway/bonjour)。

#### 服务信标详情

- 服务类型：
  - `_openclaw-gw._tcp`（Gateway 传输信标）
- TXT 键（非机密）：
  - `role=gateway`
  - `transport=gateway`
  - `displayName=<友好名称>`（操作员配置的显示名称）
  - `lanHost=<hostname>.local`
  - `gatewayPort=18789`（Gateway WS + HTTP）
  - `gatewayTls=1`（仅在启用 TLS 时）
  - `gatewayTlsSha256=<sha256>`（仅在启用 TLS 且指纹可用时）
  - `canvasPort=<port>`（Canvas Host 端口；目前在启用 Canvas Host 时与 `gatewayPort` 相同）
  - `tailnetDns=<magicdns>`（可选提示；Tailscale 可用时自动检测）
  - `sshPort=<port>`（仅限 mDNS 全模式；广域 DNS-SD 可能省略，此时 SSH 默认保持为 `22`）
  - `cliPath=<path>`（仅限 mDNS 全模式；广域 DNS-SD 仍将其作为远程安装提示写入）

安全注意事项:

- Bonjour/mDNS TXT 记录**未经身份验证**。客户端必须将 TXT 值仅视为 UX 提示。
- 路由(主机/端口)应优先使用**已解析的服务端点**(SRV + A/AAAA),而不是 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS 固定绝不能允许广播的 `gatewayTlsSha256` 覆盖先前存储的固定。
- iOS/Android 节点应将基于发现的直连视为 **TLS-only**,并在存储首次固定之前需要明确的"信任此指纹"确认(带外验证)。

禁用/覆盖:

- `OPENCLAW_DISABLE_BONJOUR=1` 禁用广播。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 绑定模式。
- `OPENCLAW_SSH_PORT` 覆盖 TXT 中广播的 SSH 端口(默认为 22)。
- `OPENCLAW_TAILNET_DNS` 发布 `tailnetDns` 提示(MagicDNS)。
- `OPENCLAW_CLI_PATH` 覆盖广播的 CLI 路径。

### 2) Tailnet(跨网络)

对于伦敦/维也纳风格的设置,Bonjour 无济于事。推荐的"直连"目标是:

- Tailscale MagicDNS 名称(首选)或稳定的 tailnet IP。

如果 Gateway 可以检测到它正在 Tailscale 下运行，它会为客户端发布 `tailnetDns` 作为可选提示（包括广域信标）。

macOS 应用现在优先使用 MagicDNS 名称而非原始 Tailscale IP 进行 Gateway 发现。这在 tailnet IP 变化时（例如节点重启或 CGNAT 重新分配后）提高了可靠性，因为 MagicDNS 名称会自动解析到当前 IP。

对于移动节点配对，发现提示不会放宽 tailnet/公网路由上的传输安全性：

- iOS/Android 在 tailnet/公网上仍需要安全的首次连接路径（`wss://` 或 Tailscale Serve/Funnel）。
- 发现到的原始 tailnet IP 是路由提示，而非使用明文远程 `ws://` 的许可。
- 私有 LAN 直连 `ws://` 仍受支持。
- 如果您想为移动节点使用最简单的 Tailscale 路径，请使用 Tailscale Serve，这样发现和设置代码都解析到同一个安全的 MagicDNS 端点。

### 3) 手动/SSH 目标

当没有直接路由(或禁用直连)时,客户端始终可以通过 SSH 转发回环 Gateway 端口进行连接。

参见[远程访问](/gateway/remote)。

## 传输选择(客户端策略)

推荐的客户端行为:

1. 如果配置了配对的直连端点并且可访问,则使用它。
2. 否则，如果发现在 `local.` 或配置的广域域上找到 Gateway，提供一键"使用此 Gateway"选择并将其保存为直连端点。
3. 否则，如果配置了 tailnet DNS/IP，尝试直连。对于 tailnet/公网路由上的移动节点，直连意味着安全端点，而非明文远程 `ws://`。
4. 否则，回退到 SSH。

## 配对 + 认证(直连传输)

Gateway 是节点/客户端准入的事实来源。

- 配对请求在 Gateway 中创建/批准/拒绝(参见 [Gateway 配对](/gateway/pairing))。
- Gateway 强制执行:
  - 认证(令牌/密钥对)
  - 作用域/ACL(Gateway 不是每个方法的原始代理)
  - 速率限制

## 按组件划分的职责

- **Gateway**:广播发现信标,拥有配对决策,并托管 WS 端点。
- **macOS 应用程序**:帮助您选择 Gateway,显示配对提示,并仅将 SSH 用作回退。
- **iOS/Android 节点**:浏览 Bonjour 作为便利,并连接到配对的 Gateway WS。
