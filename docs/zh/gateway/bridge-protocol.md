---
mmh3_hash: "c8d695b71796303a83edc85bd224ff2e"
summary: "历史 Bridge 协议（旧版节点）：TCP JSONL、配对、作用域 RPC"
read_when:
  - 构建或调试节点客户端（iOS/Android/macOS 节点模式）
  - 调查配对或 Bridge 认证失败
  - 审计 Gateway 公开的节点 surface
title: "Bridge Protocol"
---

# Bridge 协议（旧版节点传输）

<Warning>
TCP Bridge 已被**移除**。当前的 OpenClaw 版本不附带 Bridge 监听器，`bridge.*` 配置键不再在 schema 中。本页仅供历史参考。所有节点/operator 客户端请使用 [Gateway Protocol](/gateway/protocol)。
</Warning>

## 为什么它存在

- **安全边界**：Bridge 公开一个小的 allowlist，而不是完整的 Gateway API surface。
- **配对 + 节点身份**：节点准入由 Gateway 拥有，并绑定到每个节点的令牌。
- **发现 UX**：节点可以通过 LAN 上的 Bonjour 发现 Gateway，或直接通过 Tailnet 连接。
- **Loopback WS**：完整的 WS 控制平面保持本地，除非通过 SSH 隧道。

## 传输

- TCP，每行一个 JSON 对象（JSONL）。
- 可选 TLS（当 `bridge.tls.enabled` 为 true 时）。
- 旧版默认监听器端口为 `18790`（当前构建不启动 TCP Bridge）。

启用 TLS 时，发现 TXT 记录包括 `bridgeTls=1` 加上 `bridgeTlsSha256` 作为非机密提示。请注意，Bonjour/mDNS TXT 记录是未经身份验证的；客户端不得在没有明确的用户意图或其他带外验证的情况下，将广播的指纹视为权威固定。

## 握手 + 配对

1. 客户端发送 `hello` 带有节点元数据 + 令牌（如果已配对）。
2. 如果未配对，Gateway 回复 `error`（`NOT_PAIRED`/`UNAUTHORIZED`）。
3. 客户端发送 `pair-request`。
4. Gateway 等待批准，然后发送 `pair-ok` 和 `hello-ok`。

`hello-ok` 历史上返回 `serverName` 并可能包含 `canvasHostUrl`。

## 帧

客户端 → Gateway：

- `req` / `res`：作用域 Gateway RPC（chat、sessions、config、health、voicewake、skills.bins）
- `event`：节点信号（语音转录、Agent 请求、聊天订阅、exec 生命周期）

Gateway → 客户端：

- `invoke` / `invoke-res`：节点命令（`canvas.*`、`camera.*`、`screen.record`、`location.get`、`sms.send`）
- `event`：订阅 Session 的聊天更新
- `ping` / `pong`：保活

旧版 allowlist 强制执行位于 `src/gateway/server-bridge.ts`（已删除）。

## Exec 生命周期事件

节点可以发出 `exec.finished` 或 `exec.denied` 事件以显示 system.run 活动。这些被映射到 Gateway 中的系统事件。（旧版节点可能仍然发出 `exec.started`。）

有效负载字段（除非注明，否则都是可选的）：

- `sessionKey`（必需）：接收系统事件的 Agent Session。
- `runId`：用于分组的唯一 exec ID。
- `command`：原始或格式化的命令字符串。
- `exitCode`、`timedOut`、`success`、`output`：完成详情（仅限 finished）。
- `reason`：拒绝原因（仅限 denied）。

## 历史 Tailnet 使用

- 将 Bridge 绑定到 Tailnet IP：`~/.openclaw/openclaw.json` 中的 `bridge.bind: "tailnet"`（仅历史；`bridge.*` 不再有效）。
- 客户端通过 MagicDNS 名称或 Tailnet IP 连接。
- Bonjour **不能**跨网络；需要时使用手动 host/port 或 wide-area DNS-SD。

## 版本控制

Bridge 是**隐式 v1**（无最小/最大协商）。本节仅供历史参考；当前节点/operator 客户端使用 WebSocket [Gateway 协议](/gateway/protocol)。
