---
title: "Linux 应用"
sidebarTitle: "Linux"
mmh3_hash: "655d6dcf64781f041fc2775c80a9e863"
summary: "Linux 支持 + 伴侣应用状态"
read_when:
  - 查找 Linux 伴侣应用状态
  - 规划平台覆盖或贡献
---

# Linux 应用

Gateway 在 Linux 上完全受支持。**Node 是推荐的运行时**。
不推荐 Bun 用于 Gateway（WhatsApp/Telegram 问题）。

原生 Linux 伴侣应用正在计划中。如果你想帮助构建，欢迎贡献。

## 初学者快速路径（VPS）

1. 安装 Node 24（推荐；Node 22 LTS，当前 `22.14+`，仍然用于兼容性）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 从你的笔记本：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 打开 `http://127.0.0.1:18789/` 并使用配置的共享密钥进行认证（默认为 token；如果你设置了 `gateway.auth.mode: "password"` 则为密码）

完整 Linux 服务器指南：[Linux Server](/vps)。逐步 VPS 示例：[exe.dev](/install/exe-dev)

## 安装

- [入门](/start/getting-started)
- [安装和更新](/install/updating)
- 可选流程：[Bun（实验性）](/install/bun)、[Nix](/install/nix)、[Docker](/install/docker)

## Gateway

- [Gateway 手册](/gateway)
- [配置](/gateway/configuration)

## Gateway 服务安装（CLI）

使用以下之一：

```
openclaw onboard --install-daemon
```

或：

```
openclaw gateway install
```

或：

```
openclaw configure
```

在提示时选择 **Gateway service**。

修复/迁移：

```
openclaw doctor
```

## 系统控制（systemd 用户单元）

OpenClaw 默认安装 systemd **用户**服务。对于共享或始终在线的服务器，使用**系统**服务。`openclaw gateway install` 和 `openclaw onboard --install-daemon` 已经为你渲染了当前的规范单元；仅当你需要自定义系统/服务管理器设置时才手动编写。完整的服务指导位于 [Gateway 手册](/gateway)。

最小设置：

创建 `~/.config/systemd/user/openclaw-gateway[-<profile>].service`：

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

启用它：

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## 内存压力和 OOM 终止

在 Linux 上，当主机、VM 或容器 cgroup 内存耗尽时，内核会选择 OOM 受害者。Gateway 可能是一个糟糕的受害者，因为它拥有长期存活的 Session 和 Channel 连接。因此，OpenClaw 会尽可能地将短暂的子进程偏向于在 Gateway 之前被终止。

对于符合条件的 Linux 子进程生成，OpenClaw 通过一个短小的 `/bin/sh` 包装器启动子进程，将子进程自身的 `oom_score_adj` 提高到 `1000`，然后 `exec` 实际命令。这是一个非特权操作，因为子进程只是增加了自身被 OOM 终止的可能性。

覆盖的子进程包括：

- supervisor 管理的命令子进程
- PTY shell 子进程
- MCP stdio 服务器子进程
- OpenClaw 启动的浏览器/Chrome 进程

此包装器仅限 Linux，当 `/bin/sh` 不可用时跳过。如果子进程环境设置了 `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`、`false`、`no` 或 `off`，也会跳过。

验证子进程：

```bash
cat /proc/<child-pid>/oom_score_adj
```

覆盖的子进程期望值为 `1000`。Gateway 进程应保持正常分数，通常为 `0`。

这不能取代正常的内存调优。如果 VPS 或容器反复终止子进程，请增加内存限制、降低并发度，或添加更强的资源控制，如 systemd `MemoryMax=` 或容器级内存限制。

## 相关文档

- [安装概述](/install)
- [Linux 服务器](/vps)
- [Raspberry Pi](/platforms/raspberry-pi)
