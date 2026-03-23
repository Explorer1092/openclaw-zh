---
title: "Linux 应用"
sidebarTitle: "Linux"
mmh3_hash: "1fc31d33374367e164ea27292c58f4ea"
summary: "Linux 支持 + 伴侣应用状态"
read_when:
  - 查找 Linux 伴侣应用状态
  - 规划平台覆盖或贡献
---

# Linux 应用

Gateway 在 Linux 上完全受支持。**Node 是推荐的运行时**。
不推荐 Bun 用于 Gateway（WhatsApp/Telegram 错误）。

原生 Linux 伴侣应用正在计划中。如果你想帮助构建，欢迎贡献。

## 初学者快速路径（VPS）

1. 安装 Node 24（推荐；Node 22 LTS，当前 `22.16+`，仍然用于兼容性）
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. 从你的笔记本：`ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. 打开 `http://127.0.0.1:18789/` 并粘贴你的 token

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

OpenClaw 默认安装 systemd **用户**服务。对于共享或始终在线的服务器，使用**系统**服务。完整的单元示例和指导位于 [Gateway 手册](/gateway)。

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

[Install]
WantedBy=default.target
```

启用它：

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
