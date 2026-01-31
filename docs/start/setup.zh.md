---
mmh3_hash: "4e7f635dbc607b9e04829bdca0dfeb26"
summary: "设置指南：保持 OpenClaw 设置量身定制，同时保持最新"
read_when:
  - 设置新机器
  - 想要“最新 + 最好”而不破坏个人设置
---

# 设置

最后更新：2026-01-01

## 摘要 (TL;DR)
- **定制内容在仓库之外：** `~/.openclaw/workspace` (工作区) + `~/.openclaw/openclaw.json` (配置)。
- **稳定工作流：** 安装 macOS 应用程序；让它运行捆绑的网关。
- **前沿工作流：** 通过 `pnpm gateway:watch` 自己运行网关，然后让 macOS 应用程序以本地模式连接。

## 前提条件 (从源码)
- Node `>=22`
- `pnpm`
- Docker (可选；仅用于容器化设置/端到端测试 — 参见 [Docker](/install/docker))

## 定制策略 (使更新不造成破坏)

如果你想要“100% 为我定制” *并且* 易于更新，请将你的自定义内容保存在：

- **配置:** `~/.openclaw/openclaw.json` (JSON/类 JSON5)
- **工作区:** `~/.openclaw/workspace` (技能、提示词、记忆；将其设为私有 git 仓库)

引导一次：

```bash
openclaw setup
```

在此仓库内部，使用本地 CLI 入口：

```bash
openclaw setup
```

如果你还没有全局安装，通过 `pnpm openclaw setup` 运行它。

## 稳定工作流 (macOS 应用优先)

1) 安装 + 启动 **OpenClaw.app** (菜单栏)。
2) 完成入门/权限清单 (TCC 提示)。
3) 确保网关是 **本地 (Local)** 且正在运行（应用程序管理它）。
4) 链接界面（示例：WhatsApp）:

```bash
openclaw channels login
```

5) 健全性检查:

```bash
openclaw health
```

如果你的构建中没有入门流程：
- 运行 `openclaw setup`，然后 `openclaw channels login`，然后手动启动网关 (`openclaw gateway`)。

## 前沿工作流 (终端中的网关)

目标：在 TypeScript 网关上工作，获得热重载，保持 macOS 应用程序 UI 连接。

### 0) (可选) 从源码运行 macOS 应用程序

如果你也希望 macOS 应用程序处于前沿版本：

```bash
./scripts/restart-mac.sh
```

### 1) 启动开发网关

```bash
pnpm install
pnpm gateway:watch
```

`gateway:watch` 在监视模式下运行网关，并在 TypeScript 更改时重新加载。

### 2) 将 macOS 应用程序指向正在运行的网关

在 **OpenClaw.app** 中：

- 连接模式 (Connection Mode): **本地 (Local)**
应用程序将连接到配置端口上正在运行的网关。

### 3) 验证

- 应用内网关状态应显示 **“正在使用现有网关 ... (Using existing gateway …)”**
- 或者通过 CLI:

```bash
openclaw health
```

### 常见的坑
- **端口错误：** 网关 WS 默认为 `ws://127.0.0.1:18789`；保持应用程序 + CLI 在同一端口上。
- **状态存储位置：**
  - 凭据：`~/.openclaw/credentials/`
  - 会话：`~/.openclaw/agents/<agentId>/sessions/`
  - 日志：`/tmp/openclaw/`

## 凭据存储地图

调试认证或决定备份什么时使用此地图：

- **WhatsApp**: `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
- **Telegram 机器人令牌**: 配置/环境变量 或 `channels.telegram.tokenFile`
- **Discord 机器人令牌**: 配置/环境变量 (尚不支持令牌文件)
- **Slack 令牌**: 配置/环境变量 (`channels.slack.*`)
- **配对白名单**: `~/.openclaw/credentials/<channel>-allowFrom.json`
- **模型认证配置文件**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- **旧版 OAuth 导入**: `~/.openclaw/credentials/oauth.json`
更多详情：[安全](/gateway/security#credential-storage-map)。

## 更新 (不破坏你的设置)

- 将 `~/.openclaw/workspace` 和 `~/.openclaw/` 作为“你的东西”；不要将个人提示词/配置放入 `openclaw` 仓库。
- 更新源码：`git pull` + `pnpm install` (当锁定文件更改时) + 继续使用 `pnpm gateway:watch`。

## Linux (systemd 用户服务)

Linux 安装使用 systemd **用户** 服务。默认情况下，systemd 会在注销/空闲时停止用户服务，这会杀死网关。入门流程会尝试为你启用 lingering（可能会提示 sudo）。如果仍然关闭，请运行：

```bash
sudo loginctl enable-linger $USER
```

对于始终在线或多用户服务器，请考虑使用 **系统** 服务而不是用户服务（无需 lingering）。有关 systemd 的说明，请参见 [网关手册](/gateway)。

## 相关文档

- [网关手册](/gateway) (标志、监督、端口)
- [网关配置](/gateway/configuration) (配置模式 + 示例)
- [Discord](/channels/discord) 和 [Telegram](/channels/telegram) (回复标签 + replyToMode 设置)
- [OpenClaw 助手设置](/start/openclaw)
- [macOS 应用](/platforms/macos) (网关生命周期)
