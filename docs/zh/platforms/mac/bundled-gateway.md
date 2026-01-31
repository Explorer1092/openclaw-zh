---
title: "macOS 上的网关 (外部 launchd)"
sidebarTitle: "macOS 网关"
mmh3_hash: "80c477e35d0b122b5a306f1a83cb8edf"
summary: "macOS 上的网关运行时(外部 launchd 服务)"
read_when:
  - 打包 OpenClaw.app
  - 调试 macOS 网关 launchd 服务
  - 为 macOS 安装网关 CLI
---

# macOS 上的网关 (外部 launchd)

OpenClaw.app 不再捆绑 Node/Bun 或网关运行时。macOS 应用期望**外部**
`openclaw` CLI 安装,不会将网关作为子进程生成,并管理每个用户的 launchd
服务以保持网关运行(或附加到现有的本地网关,如果已经在运行)。

## 安装 CLI(本地模式所需)

你需要在 Mac 上安装 Node 22+,然后全局安装 `openclaw`:

```bash
npm install -g openclaw@<version>
```

macOS 应用的 **Install CLI** 按钮通过 npm/pnpm 运行相同的流程(不推荐 bun 用于网关运行时)。

## Launchd(网关作为 LaunchAgent)

标签:
- `bot.molt.gateway`(或 `bot.molt.<profile>`;旧版 `com.openclaw.*` 可能保留)

Plist 位置(每个用户):
- `~/Library/LaunchAgents/bot.molt.gateway.plist`
  (或 `~/Library/LaunchAgents/bot.molt.<profile>.plist`)

管理器:
- macOS 应用在本地模式下拥有 LaunchAgent 安装/更新。
- CLI 也可以安装它:`openclaw gateway install`。

行为:
- "OpenClaw Active" 启用/禁用 LaunchAgent。
- 应用退出**不会**停止网关(launchd 保持其活跃)。
- 如果网关已在配置的端口上运行,应用会附加到它而不是启动新的。

日志记录:
- launchd stdout/err:`/tmp/openclaw/openclaw-gateway.log`

## 版本兼容性

macOS 应用会检查网关版本与其自身版本的兼容性。如果不兼容,请更新全局 CLI 以匹配应用版本。

## 冒烟测试

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 OPENCLAW_SKIP_CANVAS_HOST=1 openclaw gateway --port 18999 --bind loopback
```

然后:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
