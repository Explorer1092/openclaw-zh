---
title: "Presence"
sidebarTitle: "Presence"
mmh3_hash: "a8d4f1434ecc6dd5d56694c96b0bdd67"
summary: "OpenClaw presence 条目如何生成、合并和显示"
read_when:
  - 调试 Instances 标签页
  - 排查重复或过时的实例行
  - 更改 Gateway WS 连接或 system-event 信标
---

OpenClaw "presence" 是一个轻量级、尽力而为的视图，显示：

- **Gateway** 本身，以及
- **连接到 Gateway 的客户端**（macOS 应用、WebChat、CLI 等）

Presence 主要用于渲染 macOS 应用的 **Instances** 标签页，并提供快速的运营商可见性。

## Presence 字段（显示内容）

Presence 条目是具有以下字段的结构化对象：

- `instanceId`（可选但强烈推荐）：稳定的客户端身份（通常为 `connect.client.instanceId`）
- `host`：人类友好的主机名
- `ip`：尽力而为的 IP 地址
- `version`：客户端版本字符串
- `deviceFamily` / `modelIdentifier`：硬件提示
- `mode`：`ui`、`webchat`、`cli`、`backend`、`probe`、`test`、`node`……
- `lastInputSeconds`："距上次用户输入的秒数"（如已知）
- `reason`：`self`、`connect`、`node-connected`、`periodic`……
- `ts`：最后更新时间戳（毫秒纪元时间）

## 生产者（Presence 来源）

Presence 条目由多个来源生成并**合并**。

### 1) Gateway 自身条目

Gateway 在启动时始终生成一个"自身"条目，以便即使在任何客户端连接之前，UI 也能显示 Gateway 主机。

### 2) WebSocket 连接

每个 WS 客户端以 `connect` 请求开始。握手成功后，Gateway 会为该连接插入或更新一个 presence 条目。

#### 为什么一次性 CLI 命令不会显示

CLI 通常以短暂的一次性命令方式连接。为避免 Instances 列表被频繁刷新，`client.mode === "cli"` **不会**被转化为 presence 条目。

### 3) `system-event` 信标

客户端可以通过 `system-event` 方法发送更丰富的周期性信标。macOS 应用使用此功能报告主机名、IP 和 `lastInputSeconds`。

### 4) Node 连接（role: node）

当 node 以 `role: node` 通过 Gateway WebSocket 连接时，Gateway 会为该 node 插入或更新一个 presence 条目（与其他 WS 客户端流程相同）。

## 合并 + 去重规则（为什么 `instanceId` 重要）

Presence 条目存储在单个内存映射中：

- 条目以 **presence 键** 为索引。
- 最佳键是稳定的 `instanceId`（来自 `connect.client.instanceId`），可在重启后保持稳定。
- 键不区分大小写。

如果客户端在没有稳定 `instanceId` 的情况下重新连接，可能会显示为**重复**行。

## TTL 和有限大小

Presence 有意设计为短暂的：

- **TTL：** 超过 5 分钟的条目会被清除
- **最大条目数：** 200（最旧的先被删除）

这保持列表的新鲜度并避免无限制的内存增长。

## 远程/隧道注意事项（loopback IP）

当客户端通过 SSH 隧道/本地端口转发连接时，Gateway 可能将远程地址视为 `127.0.0.1`。为避免覆盖客户端报告的良好 IP，loopback 远程地址会被忽略。

## 消费者

### macOS Instances 标签页

macOS 应用渲染 `system-presence` 的输出，并根据最后更新的时间显示状态指示器（Active/Idle/Stale）。

## 调试提示

- 要查看原始列表，向 Gateway 调用 `system-presence`。
- 如果看到重复：
  - 确认客户端在握手时发送了稳定的 `client.instanceId`
  - 确认周期性信标使用相同的 `instanceId`
  - 检查连接派生的条目是否缺少 `instanceId`（重复是预期的）

## 相关

<CardGroup cols={2}>
  <Card title="Typing indicators" href="/concepts/typing-indicators" icon="ellipsis">
    何时发送 typing indicator 以及如何调整。
  </Card>
  <Card title="Streaming and chunking" href="/concepts/streaming" icon="bars-staggered">
    出站 streaming、分块和 per-channel 格式。
  </Card>
  <Card title="Gateway architecture" href="/concepts/architecture" icon="diagram-project">
    Gateway 组件和驱动 presence 更新的 WebSocket 协议。
  </Card>
  <Card title="Gateway protocol" href="/gateway/protocol" icon="plug">
    `connect`、`system-event` 和 `system-presence` 的线协议。
  </Card>
</CardGroup>
