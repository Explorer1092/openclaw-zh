---
mmh3_hash: "0775470c49f67d24fa721a66ec44104a"
summary: "ClawDock：基于 Docker 的 OpenClaw 安装的 Shell 辅助工具"
read_when:
  - 您经常使用 Docker 运行 OpenClaw 并想要更简短的日常命令
  - 您需要仪表板、日志、令牌设置和配对流程的辅助层
title: "ClawDock"
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: placeholder
  source_path: "install/clawdock.md"
  workflow: 15
---

# ClawDock

ClawDock 是基于 Docker 的 OpenClaw 安装的小型 Shell 辅助层。

它提供 `clawdock-start`、`clawdock-dashboard` 和 `clawdock-fix-token` 等短命令，代替较长的 `docker compose ...` 调用。

如果您尚未设置 Docker，请先从 [Docker](/install/docker) 开始。

## 安装

使用规范的辅助路径：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果您之前从 `scripts/shell-helpers/clawdock-helpers.sh` 安装了 ClawDock，请从新的 `scripts/clawdock/clawdock-helpers.sh` 路径重新安装。旧的原始 GitHub 路径已被删除。

## 功能

### 基本操作

| 命令                | 描述               |
| ------------------ | ---------------------- |
| `clawdock-start`   | 启动 Gateway           |
| `clawdock-stop`    | 停止 Gateway           |
| `clawdock-restart` | 重启 Gateway           |
| `clawdock-status`  | 检查容器状态           |
| `clawdock-logs`    | 跟踪 Gateway 日志      |

### 容器访问

| 命令                       | 描述                                    |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | 在 Gateway 容器内打开 Shell              |
| `clawdock-cli <command>`  | 在 Docker 中运行 OpenClaw CLI 命令       |
| `clawdock-exec <command>` | 在容器中执行任意命令                     |

### Web UI 和配对

| 命令                    | 描述                    |
| ----------------------- | ---------------------------- |
| `clawdock-dashboard`    | 打开控制 UI URL              |
| `clawdock-devices`      | 列出待处理的设备配对         |
| `clawdock-approve <id>` | 批准配对请求                 |

### 设置和维护

| 命令                 | 描述                                          |
| -------------------- | ------------------------------------------------ |
| `clawdock-fix-token` | 在容器内配置 Gateway 令牌                       |
| `clawdock-update`    | 拉取、重建并重启                                |
| `clawdock-rebuild`   | 仅重建 Docker 镜像                              |
| `clawdock-clean`     | 删除容器和卷                                    |

### 实用工具

| 命令                    | 描述                              |
| ---------------------- | --------------------------------------- |
| `clawdock-health`      | 运行 Gateway 健康检查                  |
| `clawdock-token`       | 打印 Gateway 令牌                      |
| `clawdock-cd`          | 跳转到 OpenClaw 项目目录               |
| `clawdock-config`      | 打开 `~/.openclaw`                     |
| `clawdock-show-config` | 打印配置文件（脱敏值）                  |
| `clawdock-workspace`   | 打开工作区目录                         |

## 首次使用流程

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

ClawDock 使用 [Docker](/install/docker) 中描述的相同 Docker 配置拆分：

- `<project>/.env` 用于 Docker 特定值，如镜像名称、端口和 Gateway 令牌
- `~/.openclaw/.env` 用于 Provider 密钥和机器人令牌
- `~/.openclaw/openclaw.json` 用于行为配置

当您想快速检查这些文件时，使用 `clawdock-show-config`。它在打印输出中对 `.env` 值进行脱敏处理。

## 相关页面

- [Docker](/install/docker)
- [Docker VM 运行时](/install/docker-vm-runtime)
- [更新](/install/updating)
