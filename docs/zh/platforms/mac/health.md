---
title: "macOS 上的健康检查"
sidebarTitle: "健康检查"
mmh3_hash: "d9094db9a6dae40cb72eb4e308e60c70"
summary: "macOS 应用如何报告网关/Baileys 健康状态"
read_when: ["调试 mac 应用健康指示器"]
---
# macOS 上的健康检查

如何从菜单栏应用查看链接的通道是否健康。

## 菜单栏
- 状态点现在反映 Baileys 健康状态:
  - 绿色:已链接 + 套接字最近打开。
  - 橙色:连接/重试中。
  - 红色:已注销或探测失败。
- 辅助行显示"linked · auth 12m"或显示失败原因。
- "Run Health Check"菜单项触发按需探测。

## 设置
- General 选项卡获得一个健康卡,显示:链接认证时间、会话存储路径/计数、
  最后检查时间、最后错误/状态代码,以及 Run Health Check / Reveal Logs 按钮。
- 使用缓存快照,以便 UI 立即加载并在离线时优雅降级。
- **Channels 选项卡**显示 WhatsApp/Telegram 的通道状态 + 控件(登录二维码、
  注销、探测、最后断开连接/错误)。

## 探测如何工作
- 应用通过 `ShellExecutor` 每约 60 秒运行一次 `openclaw health --json`,
  并按需运行。探测加载凭据并报告状态,无需发送消息。
- 分别缓存最后的良好快照和最后的错误,以避免闪烁;显示每个的时间戳。

## 有疑问时
- 你仍然可以在[网关健康](/gateway/health)中使用 CLI 流程(`openclaw status`、
  `openclaw status --deep`、`openclaw health --json`)并跟踪
  `/tmp/openclaw/openclaw-*.log` 以查找 `web-heartbeat` / `web-reconnect`。
