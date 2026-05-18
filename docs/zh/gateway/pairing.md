---
mmh3_hash: "7c930b34d96f9fd476b7cdea3fa7cdaf"
summary: "Gateway 拥有的节点配对（Option B）用于 iOS 和其他远程节点"
read_when:
  - 在没有 macOS UI 的情况下实现节点配对批准
  - 为批准远程节点添加 CLI 流程
  - 使用节点管理扩展 Gateway 协议
title: "Gateway 拥有的配对"
---

在 Gateway 拥有的配对中,**Gateway** 是允许哪些节点加入的事实来源。UIs(macOS app、未来的客户端)只是批准或拒绝待处理请求的前端。

**重要:** WS 节点在 `connect` 期间使用**设备配对**(角色 `node`)。`node.pair.*` 是一个单独的配对存储,**不**作为 WS 握手的门控。只有显式调用 `node.pair.*` 的客户端使用此流程。

## 概念

- **待处理请求**:节点要求加入;需要批准。
- **配对节点**:已批准的节点,带有已颁发的认证令牌。
- **传输**:Gateway WS 端点转发请求,但不决定成员资格。(旧版 TCP bridge 支持已弃用/删除。)

## 配对如何工作

1. 节点连接到 Gateway WS 并请求配对。
2. Gateway 存储一个**待处理请求**并发出 `node.pair.requested`。
3. 您批准或拒绝请求(CLI 或 UI)。
4. 批准时,Gateway 颁发一个**新令牌**(令牌在重新配对时轮换)。
5. 节点使用令牌重新连接,现在"已配对"。

待处理请求在 **5 分钟**后自动过期。

## CLI 工作流程(无头友好)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 显示配对/连接的节点及其功能。

## API surface(gateway 协议)

事件:
- `node.pair.requested` — 创建新的待处理请求时发出。
- `node.pair.resolved` — 请求被批准/拒绝/过期时发出。

方法:
- `node.pair.request` — 创建或重用待处理请求。
- `node.pair.list` — 列出待处理 + 配对节点（`operator.pairing`）。
- `node.pair.approve` — 批准待处理请求（颁发令牌）。
- `node.pair.reject` — 拒绝待处理请求。
- `node.pair.remove` — 移除已过期的配对节点条目。
- `node.pair.verify` — 验证 `{ nodeId, token }`。

注意：

- `node.pair.request` 对每个节点是幂等的：重复调用返回相同的待处理请求。
- 对同一待处理节点的重复请求也会刷新存储的节点元数据和最新的允许列表声明命令快照，供操作员查看。
- 批准**始终**生成新令牌；从不从 `node.pair.request` 返回令牌。
- Operator 作用域级别和审批时检查总结在 [Operator 作用域](/gateway/operator-scopes) 中。
- 请求可能包含 `silent: true` 作为自动批准流程的提示。
- `node.pair.approve` 使用待处理请求的声明命令来强制执行额外的审批作用域：
  - 无命令请求：`operator.pairing`
  - 非 exec 命令请求：`operator.pairing` + `operator.write`
  - `system.run` / `system.run.prepare` / `system.which` 请求：
    `operator.pairing` + `operator.admin`

<Warning>
节点配对是信任和身份流程加上令牌颁发。它**不**按节点固定实时节点命令接口。

- 实时节点命令来自节点在 Gateway 全局节点命令策略（`gateway.nodes.allowCommands` 和 `denyCommands`）应用后在 connect 时声明的内容。
- 每节点 `system.run` 允许和请求策略存在于节点的 `exec.approvals.node.*` 中，而不是配对记录中。

</Warning>

## 节点命令门控（2026.3.31+）

<Warning>
**破坏性变更：** 从 `2026.3.31` 开始，节点命令在节点配对批准之前被禁用。仅设备配对不再足以公开声明的节点命令。
</Warning>

当节点首次连接时，自动请求配对。在配对请求被批准之前，来自该节点的所有待处理节点命令都会被过滤且不会执行。一旦通过配对批准建立信任，节点声明的命令就会在正常命令策略下可用。

这意味着：

- 以前依靠设备配对来公开命令的节点现在必须完成节点配对。
- 配对批准之前排队的命令会被丢弃，而不是延迟。

## 节点事件信任边界（2026.3.31+）

<Warning>
**破坏性变更：** 节点发起的运行现在保持在减少的受信任接口上。
</Warning>

节点发起的摘要和相关 Session 事件被限制在预期的受信任接口。以前依赖更广泛的主机或 Session 工具访问的通知驱动或节点触发流程可能需要调整。此加固确保节点事件不能超出节点信任边界允许的范围升级到主机级工具访问。

持久的节点在线更新遵循相同的身份边界。`node.presence.alive` 事件仅接受来自已认证节点设备 Session 的请求，并且仅在设备/节点身份已配对时才更新配对元数据。自我声明的 `client.id` 值不足以写入最后在线状态。

## 自动批准（macOS app）

macOS 应用程序可以选择尝试**静默批准**,当:
- 请求被标记为 `silent`,并且
- 应用程序可以使用相同用户验证到 gateway 主机的 SSH 连接。

如果静默批准失败，它会回退到正常的"批准/拒绝"提示。

## 受信任 CIDR 设备自动批准

`role: node` 的 WS 设备配对默认保持手动。对于 Gateway 已信任网络路径的私有节点网络，操作员可以通过显式 CIDR 或精确 IP 选择启用：

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

安全边界：

- 当 `gateway.nodes.pairing.autoApproveCidrs` 未设置时禁用。
- 不存在全面的 LAN 或私有网络自动批准模式。
- 只有没有请求作用域的全新 `role: node` 设备配对才有资格。
- Operator、浏览器、Control UI 和 WebChat 客户端保持手动。
- 角色、作用域、元数据和公钥升级保持手动。
- 同主机 loopback trusted-proxy 头路径不符合条件，因为本地调用者可以伪造该路径。

## 元数据升级自动批准

当已配对设备仅以非敏感元数据更改（例如显示名称或客户端平台提示）重新连接时，OpenClaw 将其视为 `metadata-upgrade`。静默自动批准范围较窄：仅适用于已证明持有本地或共享凭证（包括操作系统版本元数据更改后的同主机原生应用重连）的受信任非浏览器本地重连。浏览器/Control UI 客户端和远程客户端仍使用显式重新批准流程。作用域升级（read 到 write/admin）和公钥更改**不**符合元数据升级自动批准条件——它们保持为显式重新批准请求。

## QR 配对辅助

`/pair qr` 将配对有效载荷渲染为结构化媒体，以便移动和浏览器客户端可以直接扫描。

删除设备也会清除该设备 ID 的所有过期待处理配对请求，因此撤销后 `nodes pending` 不会显示孤立的行。

## 本地性和转发头

Gateway 配对仅在原始套接字和任何上游代理证据都一致时才将连接视为 loopback。如果请求到达 loopback 但携带 `Forwarded`、任何 `X-Forwarded-*` 或 `X-Real-IP` 头证据，该转发头证据会取消 loopback 本地性声明。配对路径随后需要显式批准，而不是静默地将请求视为同主机连接。有关 operator 认证的等效规则，请参见 [Trusted Proxy Auth](/gateway/trusted-proxy-auth)。

## 存储（本地，私有）

配对状态存储在 Gateway 状态目录下(默认 `~/.openclaw`):

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果您覆盖 `OPENCLAW_STATE_DIR`,`nodes/` 文件夹会随之移动。

安全注意事项:
- 令牌是秘密;将 `paired.json` 视为敏感信息。
- 轮换令牌需要重新批准(或删除节点条目)。

## 传输行为

- 传输是**无状态的**;它不存储成员资格。
- 如果 Gateway 离线或配对被禁用,节点无法配对。
- 如果 Gateway 处于远程模式,配对仍然针对远程 Gateway 的存储发生。

## 相关

- [Channel 配对](/channels/pairing)
- [节点](/nodes)
- [设备 CLI](/cli/devices)
