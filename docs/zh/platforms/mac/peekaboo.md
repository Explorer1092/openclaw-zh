---
title: "Peekaboo Bridge (macOS UI 自动化)"
sidebarTitle: "Peekaboo Bridge"
mmh3_hash: "2255c39457ba38977f5b959bd36e0b00"
summary: "macOS UI 自动化的 PeekabooBridge 集成"
read_when: ["在 OpenClaw.app 中托管 PeekabooBridge","通过 Swift Package Manager 集成 Peekaboo","更改 PeekabooBridge 协议/路径"]
---
# Peekaboo Bridge (macOS UI 自动化)

OpenClaw 可以将 **PeekabooBridge** 托管为本地、权限感知的 UI 自动化代理。
这让 `peekaboo` CLI 驱动 UI 自动化,同时重用 macOS 应用的 TCC 权限。

## 这是什么（以及不是什么）

- **Host**：OpenClaw.app 可以充当 PeekabooBridge 主机。
- **Client**：使用 `peekaboo` CLI（没有单独的 `openclaw ui ...` 界面）。
- **UI**：视觉叠加层留在 Peekaboo.app 中；OpenClaw 是一个薄 broker 主机。

## 与 Computer Use 的关系

OpenClaw 有三条桌面控制路径，它们有意保持分离：

- **PeekabooBridge host**：OpenClaw.app 可以托管本地 PeekabooBridge socket。
  `peekaboo` CLI 作为客户端，使用 OpenClaw.app 的 macOS
  权限进行 Peekaboo 自动化原语，例如截图、点击、菜单、对话框、Dock 操作和窗口管理。
- **Codex Computer Use**：捆绑的 `codex` plugin 准备 Codex app-server，
  验证 Codex 的 `computer-use` MCP 服务器是否可用，然后让
  Codex 在 Codex 模式轮次中拥有原生桌面控制工具调用。OpenClaw
  不通过 PeekabooBridge 代理这些操作。
- **直接 `cua-driver` MCP**：OpenClaw 可以将 TryCua 的上游
  `cua-driver mcp` 服务器注册为普通 MCP 服务器。这让 agent 可以使用
  CUA driver 自己的 schema 和 pid/window/element-index 工作流，
  无需通过 Codex marketplace 或 PeekabooBridge socket 路由。

当你需要广泛的 macOS 自动化界面和 OpenClaw.app 的权限感知 bridge host 时，使用 Peekaboo。当 Codex 模式 agent 应该依赖 Codex 的原生 computer-use plugin 时，使用 Codex Computer Use。当你想将 CUA driver 作为普通 MCP 服务器暴露给任何 OpenClaw 管理的运行时时，使用直接 `cua-driver mcp`。

## 启用桥接

在 macOS 应用中：

- 设置 → **Enable Peekaboo Bridge**

启用后，OpenClaw 启动本地 UNIX socket 服务器。如果禁用，主机停止，
`peekaboo` 将回退到其他可用主机。

## 客户端发现顺序

Peekaboo 客户端通常按以下顺序尝试主机：

1. Peekaboo.app（完整 UX）
2. Claude.app（如果已安装）
3. OpenClaw.app（薄 broker）

使用 `peekaboo bridge status --verbose` 查看哪个主机处于活动状态以及
正在使用哪个 socket 路径。你可以覆盖：

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## 安全性和权限

- 桥接验证**调用者代码签名**；强制执行 TeamID 的允许列表（Peekaboo 主机
  TeamID + OpenClaw 应用 TeamID）。
- 请求在约 10 秒后超时。
- 如果缺少所需权限，桥接返回清晰的错误消息，而不是启动系统设置。

## 快照行为（自动化）

快照存储在内存中，并在短时间窗口后自动过期。如果你需要更长的保留时间，
请从客户端重新捕获。

## 故障排除

- 如果 `peekaboo` 报告"bridge client is not authorized"，请确保客户端
  已正确签名，或**仅在调试**模式下使用
  `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` 运行主机。
- 如果未找到主机，请打开其中一个主机应用（Peekaboo.app 或 OpenClaw.app）
  并确认已授予权限。

## 相关文档

- [macOS 应用](/platforms/macos)
- [macOS 权限](/platforms/mac/permissions)
