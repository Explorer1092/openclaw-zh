---
title: "Linux 应用"
mmh3_hash: "b036d0ea9146e3fa60861c91819b3825"
summary: "Linux 支持 + 配套应用状态"
read_when:
  - 寻找 Linux 配套应用状态
  - 规划平台覆盖或贡献
---
# Linux 应用

网关在 Linux 上完全支持。**推荐使用 Node 作为运行时**。
不推荐在网关中使用 Bun(WhatsApp/Telegram 错误)。

计划推出原生 Linux 配套应用。如果你想帮助构建,欢迎贡献。

## 初学者快速路径(VPS)

1) 安装 Node 22+  
2) `npm i -g openclaw@latest`  
3) `openclaw onboard --install-daemon`  
4) 从你的笔记本电脑: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`  
5) 打开 `http://127.0.0.1:18789/` 并粘贴你的令牌

逐步 VPS 指南: [exe.dev](/platforms/exe-dev)

## 安装
- [入门指南](/start/getting-started)
- [安装和更新](/install/updating)
- 可选流程: [Bun(实验性)](/install/bun)、[Nix](/install/nix)、[Docker](/install/docker)

## 网关
- [网关运行手册](/gateway)
- [配置](/gateway/configuration)

## 网关服务安装(CLI)

使用以下其中之一:

```
openclaw onboard --install-daemon
```

或:

```
openclaw gateway install
```

或:

```
openclaw configure
```

提示时选择 **Gateway service**。

修复/迁移:

```
openclaw doctor
```

## 系统控制(systemd 用户单元)
OpenClaw 默认安装 systemd **用户**服务。对于共享或始终在线的服务器,
使用 **系统**服务。完整的单元示例和指导位于[网关运行手册](/gateway)中。

最小设置:

创建 `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

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

启用它:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```
