---
mmh3_hash: "a629d894db6e7e024299f14f59d4e5e2"
title: "macOS 上的 Gateway (外部 launchd)"
summary: "macOS 上的 Gateway 运行时（外部 launchd 服务）"
read_when:
  - 打包 OpenClaw.app
  - 调试 macOS gateway launchd 服务
  - 为 macOS 安装 gateway CLI
---

# macOS 上的 Gateway（外部 launchd）

OpenClaw.app 不再捆绑 Node/Bun 或 Gateway 运行时。macOS 应用期望一个**外部** `openclaw` CLI 安装，不将 Gateway 作为子进程生成，并管理每用户 launchd 服务以保持 Gateway 运行（或在已有本地 Gateway 运行时附加到它）。

## 安装 CLI（本地模式必需）

Mac 上的默认运行时是 Node 24。Node 22 LTS，当前 `22.14+`，仍然用于兼容性。然后全局安装 `openclaw`：

```bash
npm install -g openclaw@<version>
```

macOS 应用的 **Install CLI** 按钮运行与应用内部相同的全局安装流程：它优先选择 npm，然后是 pnpm，如果只检测到 bun 则使用 bun。Node 仍然是推荐的 Gateway 运行时。

## Launchd（Gateway 作为 LaunchAgent）

标签：

- `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 可能仍然存在）

Plist 位置（每用户）：

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  （或 `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`）

管理器：

- macOS 应用在本地模式下拥有 LaunchAgent 安装/更新。
- CLI 也可以安装它：`openclaw gateway install`。

行为：

- "OpenClaw Active" 启用/禁用 LaunchAgent。
- 应用退出**不会**停止 gateway（launchd 保持它存活）。
- 如果 Gateway 已经在配置的端口上运行，应用会附加到它而不是启动一个新的。

日志：

- launchd stdout/err：`/tmp/openclaw/openclaw-gateway.log`

## 版本兼容性

macOS 应用检查 gateway 版本与其自身版本的兼容性。如果不兼容，更新全局 CLI 以匹配应用版本。

## 冒烟检查

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

然后：

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
