---
mmh3_hash: "d6355fa99d862b55b560a5cc72316e22"
summary: "WebSocket Gateway 架构、组件和客户端流程"
read_when:
  - 处理 Gateway 协议、客户端或传输
title: "Gateway 架构"
---

## 概述

- 单个长期运行的 **Gateway** 拥有所有消息界面（通过 Baileys 的 WhatsApp、通过 grammY 的 Telegram、Slack、Discord、Signal、iMessage、WebChat）。
- 控制面客户端（macOS 应用、CLI、Web UI、自动化）通过**WebSocket**连接到 Gateway，监听配置的绑定主机（默认 `127.0.0.1:18789`）。
- **Node**（macOS/iOS/Android/无界面）也通过**WebSocket**连接，但声明 `role: node`，带有明确的能力/命令。
- 每个主机一个 Gateway；它是打开 WhatsApp Session 的唯一地方。
- **Canvas 主机**由 Gateway HTTP 服务器在以下路径提供：
  - `/__openclaw__/canvas/`（Agent 可编辑的 HTML/CSS/JS）
  - `/__openclaw__/a2ui/`（A2UI 主机）
    它使用与 Gateway 相同的端口（默认 `18789`）。

## 组件和流程

### Gateway（守护进程）

- 维护 Provider 连接。
- 暴露类型化的 WS API（请求、响应、服务器推送事件）。
- 根据 JSON Schema 验证入站帧。
- 发出 `agent`、`chat`、`presence`、`health`、`heartbeat`、`cron` 等事件。

### 客户端（Mac 应用 / CLI / Web 管理）

- 每个客户端一个 WS 连接。
- 发送请求（`health`、`status`、`send`、`agent`、`system-presence`）。
- 订阅事件（`tick`、`agent`、`presence`、`shutdown`）。

### Node（macOS / iOS / Android / 无界面）

- 使用 `role: node` 连接到**相同的 WS 服务器**。
- 在 `connect` 中提供设备身份；配对是**基于设备的**（角色 `node`），审批存储在设备配对存储中。
- 暴露 `canvas.*`、`camera.*`、`screen.record`、`location.get` 等命令。

协议详情：

- [Gateway 协议](/gateway/protocol)

### WebChat

- 静态 UI，使用 Gateway WS API 进行聊天历史和发送。
- 在远程设置中，通过与其他客户端相同的 SSH/Tailscale 隧道连接。

## 连接生命周期（单客户端）

```mermaid
sequenceDiagram
    participant Client
    participant Gateway

    Client->>Gateway: req:connect
    Gateway-->>Client: res (ok)
    Note right of Gateway: 或 res error + close
    Note left of Client: payload=hello-ok<br>snapshot: presence + health

    Gateway-->>Client: event:presence
    Gateway-->>Client: event:tick

    Client->>Gateway: req:agent
    Gateway-->>Client: res:agent<br>ack {runId, status:"accepted"}
    Gateway-->>Client: event:agent<br>(streaming)
    Gateway-->>Client: res:agent<br>final {runId, status, summary}
```

## 线路协议（摘要）

- 传输：WebSocket，JSON 有效载荷的文本帧。
- 第一帧**必须**是 `connect`。
- 握手后：
  - 请求：`{type:"req", id, method, params}` → `{type:"res", id, ok, payload|error}`
  - 事件：`{type:"event", event, payload, seq?, stateVersion?}`
- `hello-ok.features.methods` / `events` 是发现元数据，不是每个可调用辅助路由的生成转储。
- 共享密钥认证使用 `connect.params.auth.token` 或 `connect.params.auth.password`，取决于配置的 Gateway 认证模式。
- 带身份的模式（如 Tailscale Serve（`gateway.auth.allowTailscale: true`）或非 loopback `gateway.auth.mode: "trusted-proxy"`）从请求标头而不是 `connect.params.auth.*` 满足认证。
- 私有入口 `gateway.auth.mode: "none"` 完全禁用共享密钥认证；将该模式保持在公开/不受信任的入口之外。
- 幂等性键对于具有副作用的方法（`send`、`agent`）是必需的，以安全重试；服务器保留短期去重缓存。
- Node 必须在 `connect` 中包含 `role: "node"` 加上能力/命令/权限。

## 配对 + 本地信任

- 所有 WS 客户端（操作员 + Node）在 `connect` 时包含**设备身份**。
- 新设备 ID 需要配对审批；Gateway 为后续连接颁发**设备令牌**。
- 直接本地 loopback 连接可以自动审批，以保持同主机 UX 的流畅。
- OpenClaw 还有一个用于受信任共享密钥辅助流的窄后端/容器本地自连接路径。
- Tailnet 和 LAN 连接，包括同主机 tailnet 绑定，仍然需要明确的配对审批。
- 所有连接必须签署 `connect.challenge` nonce。
- 签名有效载荷 `v3` 也绑定 `platform` + `deviceFamily`；Gateway 在重新连接时固定配对的元数据，并在元数据更改时需要修复配对。
- **非本地**连接仍然需要明确审批。
- Gateway 认证（`gateway.auth.*`）仍然适用于**所有**连接，本地或远程。

详情：[Gateway 协议](/gateway/protocol)、[配对](/channels/pairing)、[安全](/gateway/security)。

## 协议类型和代码生成

- TypeBox 模式定义协议。
- JSON Schema 从这些模式生成。
- Swift 模型从 JSON Schema 生成。

## 远程访问

- 首选：Tailscale 或 VPN。
- 备选：SSH 隧道

  ```bash
  ssh -N -L 18789:127.0.0.1:18789 user@host
  ```

- 相同的握手 + 认证令牌适用于隧道。
- TLS + 可选固定可以为远程设置中的 WS 启用。

## 操作快照

- 启动：`openclaw gateway`（前台，日志输出到 stdout）。
- 健康检查：通过 WS 的 `health`（也包含在 `hello-ok` 中）。
- 监督：launchd/systemd 用于自动重启。

## 不变量

- 每个主机恰好一个 Gateway 控制单个 Baileys Session。
- 握手是强制性的；任何非 JSON 或非 connect 的第一帧都是硬关闭。
- 事件不会重播；客户端必须在间隙时刷新。

## 相关

- [Agent Loop](/concepts/agent-loop) — 详细的 Agent 执行周期
- [Gateway 协议](/gateway/protocol) — WebSocket 协议契约
- [队列](/concepts/queue) — 命令队列和并发
- [安全](/gateway/security) — 信任模型和加固
