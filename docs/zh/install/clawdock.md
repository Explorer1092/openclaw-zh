---
mmh3_hash: "73fda9b3247113cd4154af3e84a1890f"
title: "ClawDock"
sidebarTitle: "ClawDock"
summary: "适用于基于 Docker 的 OpenClaw 安装的 ClawDock shell 辅助工具"
read_when:
  - 你经常使用 Docker 运行 OpenClaw 并希望简化日常命令
  - 你想要一个用于仪表板、日志、token 设置和配对流程的辅助层
---

ClawDock 是一个用于基于 Docker 的 OpenClaw 安装的小型 shell 辅助层。

它为你提供简短的命令，如 `clawdock-start`、`clawdock-dashboard` 和 `clawdock-fix-token`，而不是更长的 `docker compose ...` 调用。

如果你尚未设置 Docker，请从 [Docker](/install/docker) 开始。

## 安装

使用规范的辅助路径：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你之前从 `scripts/shell-helpers/clawdock-helpers.sh` 安装了 ClawDock，请从新的 `scripts/clawdock/clawdock-helpers.sh` 路径重新安装。旧的原始 GitHub 路径已被删除。

## 你获得什么

### 基本操作

| 命令               | 描述             |
| ------------------ | ---------------- |
| `clawdock-start`   | 启动 gateway     |
| `clawdock-stop`    | 停止 gateway     |
| `clawdock-restart` | 重启 gateway     |
| `clawdock-status`  | 检查容器状态     |
| `clawdock-logs`    | 跟踪 gateway 日志|

### 容器访问

| 命令                      | 描述                            |
| ------------------------- | ------------------------------- |
| `clawdock-shell`          | 打开 gateway 容器内的 shell     |
| `clawdock-cli <command>`  | 在 Docker 中运行 OpenClaw CLI 命令 |
| `clawdock-exec <command>` | 在容器中执行任意命令            |

### Web UI 和配对

| 命令                    | 描述                   |
| ----------------------- | ---------------------- |
| `clawdock-dashboard`    | 打开控制 UI URL        |
| `clawdock-devices`      | 列出待处理的设备配对   |
| `clawdock-approve <id>` | 批准配对请求           |

### 设置和维护

| 命令                 | 描述                                    |
| -------------------- | --------------------------------------- |
| `clawdock-fix-token` | 在容器内配置 gateway token              |
| `clawdock-update`    | 拉取、重建并重启                        |
| `clawdock-rebuild`   | 仅重建 Docker 镜像                      |
| `clawdock-clean`     | 删除容器和卷                            |

### 实用工具

| 命令                   | 描述                             |
| ---------------------- | -------------------------------- |
| `clawdock-health`      | 运行 gateway 健康检查            |
| `clawdock-token`       | 打印 gateway token               |
| `clawdock-cd`          | 跳转到 OpenClaw 项目目录         |
| `clawdock-config`      | 打开 `~/.openclaw`               |
| `clawdock-show-config` | 打印带有隐藏值的配置文件         |
| `clawdock-workspace`   | 打开工作区目录                   |

## 首次运行流程

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

如果浏览器提示需要配对：

```bash
clawdock-devices
clawdock-approve <request-id>
```

## 配置和密钥

ClawDock 与 [Docker](/install/docker) 中描述的相同 Docker 配置分割一起工作：

- `<project>/.env` 用于 Docker 特定值，如镜像名称、端口和 gateway token
- `~/.openclaw/.env` 用于 env 支持的 provider 密钥和 bot token
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 用于存储的 provider OAuth/API 密钥认证
- `~/.openclaw/openclaw.json` 用于行为配置

当你想快速检查 `.env` 文件和 `openclaw.json` 时，使用 `clawdock-show-config`。它在打印输出中隐藏 `.env` 值。

## 相关页面

- [Docker](/install/docker)
- [Docker VM 运行时](/install/docker-vm-runtime)
- [更新](/install/updating)
