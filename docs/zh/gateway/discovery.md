---
title: "发现与传输"
sidebarTitle: "发现与传输"
mmh3_hash: "4d7405c4bea9647193de7cb76a05a143"
summary: "节点发现和传输(Bonjour、Tailscale、SSH)用于查找 gateway"
read_when: ["实现或更改 Bonjour 发现/广播","调整远程连接模式(直连 vs SSH)","为远程节点设计节点发现 + 配对"]
---
# 发现与传输

OpenClaw 有两个表面上看起来相似的不同问题:

1) **操作员远程控制**:macOS 菜单栏应用程序控制在其他地方运行的 gateway。
2) **节点配对**:iOS/Android(和未来的节点)找到 gateway 并安全配对。

设计目标是将所有网络发现/广播保留在 **Node Gateway**(`openclaw gateway`)中,并将客户端(mac 应用、iOS)作为消费者。

## 术语

- **Gateway**:单个长时间运行的 gateway 进程,拥有状态(sessions、配对、节点注册表)并运行 channels。大多数设置每个主机使用一个;隔离的多 gateway 设置是可能的。
- **Gateway WS(控制平面)**:默认情况下在 `127.0.0.1:18789` 上的 WebSocket 端点;可以通过 `gateway.bind` 绑定到 LAN/tailnet。
- **直连 WS 传输**:面向 LAN/tailnet 的 Gateway WS 端点(无 SSH)。
- **SSH 传输(回退)**:通过 SSH 转发 `127.0.0.1:18789` 进行远程控制。
- **旧版 TCP bridge(已弃用/已删除)**:较旧的节点传输(参见 [Bridge 协议](/zh/gateway/bridge-protocol));不再为发现而广播。

协议详情:
- [Gateway 协议](/zh/gateway/protocol)
- [Bridge 协议(旧版)](/zh/gateway/bridge-protocol)

## 为什么我们保留"直连"和 SSH

- **直连 WS** 是同一网络和 tailnet 内的最佳 UX:
  - 通过 Bonjour 在 LAN 上自动发现
  - gateway 拥有配对令牌 + ACLs
  - 不需要 shell 访问;协议 surface 可以保持紧凑和可审计
- **SSH** 仍然是通用回退:
  - 在您有 SSH 访问的任何地方工作(即使跨不相关的网络)
  - 在多播/mDNS 问题中存活
  - 除了 SSH 之外不需要新的入站端口

## 发现输入(客户端如何了解 gateway 在哪里)

### 1) Bonjour / mDNS(仅限 LAN)

Bonjour 是尽力而为的,不能跨网络。它仅用于"同一 LAN"的便利。

目标方向:
- **gateway** 通过 Bonjour 广播其 WS 端点。
- 客户端浏览并显示"选择 gateway"列表,然后存储所选端点。

故障排除和 beacon 详情:[Bonjour](/zh/gateway/bonjour)。

#### 服务 beacon 详情

- 服务类型:
  - `_openclaw-gw._tcp`(gateway 传输 beacon)
- TXT 键(非机密):
  - `role=gateway`
  - `lanHost=<hostname>.local`
  - `sshPort=22`(或任何广播的端口)
  - `gatewayPort=18789`(Gateway WS + HTTP)
  - `gatewayTls=1`(仅在启用 TLS 时)
  - `gatewayTlsSha256=<sha256>`(仅在启用 TLS 且指纹可用时)
  - `canvasPort=18793`(默认 canvas host 端口;提供 `/__openclaw__/canvas/`)
  - `cliPath=<path>`(可选;可运行的 `openclaw` 入口点或二进制文件的绝对路径)
  - `tailnetDns=<magicdns>`(可选提示;Tailscale 可用时自动检测)

禁用/覆盖:
- `OPENCLAW_DISABLE_BONJOUR=1` 禁用广播。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制 Gateway 绑定模式。
- `OPENCLAW_SSH_PORT` 覆盖 TXT 中广播的 SSH 端口(默认为 22)。
- `OPENCLAW_TAILNET_DNS` 发布 `tailnetDns` 提示(MagicDNS)。
- `OPENCLAW_CLI_PATH` 覆盖广播的 CLI 路径。

### 2) Tailnet(跨网络)

对于伦敦/维也纳风格的设置,Bonjour 无济于事。推荐的"直连"目标是:
- Tailscale MagicDNS 名称(首选)或稳定的 tailnet IP。

如果 gateway 可以检测到它正在 Tailscale 下运行,它会为客户端发布 `tailnetDns` 作为可选提示(包括 wide-area beacons)。

### 3) 手动/SSH 目标

当没有直接路由(或禁用直连)时,客户端始终可以通过 SSH 转发 loopback gateway 端口进行连接。

参见 [远程访问](/zh/gateway/remote)。

## 传输选择(客户端策略)

推荐的客户端行为:

1) 如果配置了配对的直连端点并且可访问,则使用它。
2) 否则,如果 Bonjour 在 LAN 上找到 gateway,提供一键"使用此 gateway"选择并将其保存为直连端点。
3) 否则,如果配置了 tailnet DNS/IP,尝试直连。
4) 否则,回退到 SSH。

## 配对 + 认证(直连传输)

Gateway 是节点/客户端准入的事实来源。

- 配对请求在 gateway 中创建/批准/拒绝(参见 [Gateway 配对](/zh/gateway/pairing))。
- Gateway 强制执行:
  - 认证(令牌/密钥对)
  - 作用域/ACLs(gateway 不是每个方法的原始代理)
  - 速率限制

## 按组件划分的职责

- **Gateway**:广播发现 beacons,拥有配对决策,并托管 WS 端点。
- **macOS 应用程序**:帮助您选择 gateway,显示配对提示,并仅将 SSH 用作回退。
- **iOS/Android 节点**:浏览 Bonjour 作为便利,并连接到配对的 Gateway WS。
