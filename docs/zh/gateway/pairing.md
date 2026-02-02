---
title: "网关托管配对 (选项 B)"
sidebarTitle: "网关托管配对"
mmh3_hash: "2acc6ec5ba5d01db44e649e561ee5347"
summary: "Gateway 拥有的节点配对(Option B)用于 iOS 和其他远程节点"
read_when: ["在没有 macOS UI 的情况下实现节点配对批准","为批准远程节点添加 CLI 流程","使用节点管理扩展 gateway 协议"]
---
# 网关托管配对 (选项 B)

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
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 显示配对/连接的节点及其功能。

## API surface(gateway 协议)

事件:
- `node.pair.requested` — 创建新的待处理请求时发出。
- `node.pair.resolved` — 请求被批准/拒绝/过期时发出。

方法:
- `node.pair.request` — 创建或重用待处理请求。
- `node.pair.list` — 列出待处理 + 配对节点。
- `node.pair.approve` — 批准待处理请求(颁发令牌)。
- `node.pair.reject` — 拒绝待处理请求。
- `node.pair.verify` — 验证 `{ nodeId, token }`。

注意:
- `node.pair.request` 对每个节点是幂等的:重复调用返回相同的待处理请求。
- 批准**始终**生成新令牌;从不从 `node.pair.request` 返回令牌。
- 请求可能包含 `silent: true` 作为自动批准流程的提示。

## 自动批准(macOS app)

macOS 应用程序可以选择尝试**静默批准**,当:
- 请求被标记为 `silent`,并且
- 应用程序可以使用相同用户验证到 gateway 主机的 SSH 连接。

如果静默批准失败,它会回退到正常的"批准/拒绝"提示。

## 存储(本地,私有)

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
