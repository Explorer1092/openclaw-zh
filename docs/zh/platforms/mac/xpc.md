---
title: "OpenClaw macOS IPC 架构"
sidebarTitle: "macOS IPC"
mmh3_hash: "7580fabb0a3a142d07ec29b2e72fa406"
summary: "OpenClaw 应用、网关节点传输和 PeekabooBridge 的 macOS IPC 架构"
read_when: ["编辑 IPC 合约或菜单栏应用 IPC"]
---
# OpenClaw macOS IPC 架构

**当前模型:** 本地 Unix 套接字将 **node host service** 连接到 **macOS 应用**
以进行执行批准 + `system.run`。存在 `openclaw-mac` 调试 CLI 用于发现/连接检查;
代理操作仍然通过网关 WebSocket 和 `node.invoke` 流动。UI 自动化使用 PeekabooBridge。

## 目标
- 拥有所有面向 TCC 的工作(通知、屏幕录制、麦克风、语音、AppleScript)的单个 GUI 应用实例。
- 自动化的小表面:网关 + 节点命令,加上用于 UI 自动化的 PeekabooBridge。
- 可预测的权限:始终是相同的签名捆绑包 ID,由 launchd 启动,因此 TCC 授予会保留。

## 工作原理
### 网关 + 节点传输
- 应用运行网关(本地模式)并作为节点连接到它。
- 代理操作通过 `node.invoke` 执行(例如 `system.run`、`system.notify`、`canvas.*`)。

### 节点服务 + 应用 IPC
- 无头节点主机服务连接到网关 WebSocket。
- `system.run` 请求通过本地 Unix 套接字转发到 macOS 应用。
- 应用在 UI 上下文中执行 exec,如果需要则提示,并返回输出。

图表(SCI):
```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge(UI 自动化)
- UI 自动化使用名为 `bridge.sock` 的单独 UNIX 套接字和 PeekabooBridge JSON 协议。
- 主机偏好顺序(客户端):Peekaboo.app → Claude.app → OpenClaw.app → 本地执行。
- 安全性:桥接主机需要允许的 TeamID;仅限 DEBUG 的同 UID 逃生舱由
  `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 保护(Peekaboo 约定)。
- 参见:[PeekabooBridge 用法](/platforms/mac/peekaboo)了解详细信息。

## 操作流程
- 重启/重建:`SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - 杀死现有实例
  - Swift 构建 + 打包
  - 写入/引导/启动 LaunchAgent
- 单实例:如果另一个具有相同捆绑包 ID 的实例正在运行,应用会提前退出。

## 强化说明
- 优先要求所有特权表面的 TeamID 匹配。
- PeekabooBridge:`PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`(仅限 DEBUG)
  可能允许同 UID 调用者进行本地开发。
- 所有通信都保持仅本地;没有网络套接字被暴露。
- TCC 提示仅来自 GUI 应用捆绑包;在重建时保持签名的捆绑包 ID 稳定。
- IPC 强化:套接字模式 `0600`、令牌、对等 UID 检查、HMAC 质询/响应、短 TTL。
