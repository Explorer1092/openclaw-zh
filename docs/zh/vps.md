---
mmh3_hash: "9da620471ca8f4ba586e18dce08ce1ba"
summary: "在 Linux 服务器或云 VPS 上运行 OpenClaw — 提供商选择、架构和调优"
read_when:
  - 您想在 Linux 服务器或云 VPS 上运行 Gateway
  - 您需要快速了解托管指南
  - 您想了解适用于 OpenClaw 的通用 Linux 服务器调优
title: "Linux 服务器"
sidebarTitle: "Linux 服务器"
---

在任何 Linux 服务器或云 VPS 上运行 OpenClaw Gateway。本页帮助您选择 Provider，解释云部署的工作原理，并涵盖适用于所有平台的通用 Linux 调优。

## 选择 Provider

<CardGroup cols={2}>
  <Card title="Railway" href="/install/railway">一键式，浏览器设置</Card>
  <Card title="Northflank" href="/install/northflank">一键式，浏览器设置</Card>
  <Card title="DigitalOcean" href="/install/digitalocean">简单的付费 VPS</Card>
  <Card title="Oracle Cloud" href="/install/oracle">永久免费 ARM 套餐</Card>
  <Card title="Fly.io" href="/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner VPS 上的 Docker</Card>
  <Card title="Hostinger" href="/install/hostinger">带一键设置的 VPS</Card>
  <Card title="GCP" href="/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/install/exe-dev">带 HTTPS 代理的 VM</Card>
  <Card title="Raspberry Pi" href="/install/raspberry-pi">ARM 自托管</Card>
</CardGroup>

**AWS（EC2 / Lightsail / 免费套餐）** 同样适用。社区视频演示可在 [x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547) 查看（社区资源 -- 可能随时不可用）。

## 云设置的工作原理

- **Gateway 在 VPS 上运行**，拥有状态和工作区。
- 您通过 **Control UI** 或 **Tailscale/SSH** 从笔记本电脑或手机连接。
- 将 VPS 视为事实来源，并定期**备份**状态和工作区。
- 安全默认设置：将 Gateway 保持在环回，通过 SSH 隧道或 Tailscale Serve 访问。如果您绑定到 `lan` 或 `tailnet`，请要求 `gateway.auth.token` 或 `gateway.auth.password`。

相关页面：[Gateway 远程访问](/gateway/remote)、[平台中心](/platforms)。

## 首先强化管理访问

在公共 VPS 上安装 OpenClaw 之前，决定您希望如何管理主机本身。

- 如果您想要仅 Tailnet 的管理访问，请先安装 Tailscale，将 VPS 加入您的 tailnet，通过 Tailscale IP 或 MagicDNS 名称验证第二个 SSH 会话，然后限制公共 SSH。
- 如果您不使用 Tailscale，在公开更多服务之前，请为您的 SSH 路径应用等效的强化措施。
- 这与 Gateway 访问是分开的。您仍然可以将 OpenClaw 绑定到环回，并使用 SSH 隧道或 Tailscale Serve 进行仪表板访问。

Tailscale 特定的 Gateway 选项在 [Tailscale](/gateway/tailscale) 中。

## VPS 上的公司共享 Agent

当所有用户都在相同的信任边界内且 agent 仅用于业务时，为团队运行单个 agent 是一个有效的设置。

- 在专用运行时上运行（VPS/VM/容器 + 专用 OS 用户/账户）。
- 不要将该运行时登录到个人 Apple/Google 账户或个人浏览器/密码管理器配置文件。
- 如果用户相互对立，请按 gateway/主机/OS 用户拆分。

安全模型详情：[安全](/gateway/security)。

## 将 Node 与 VPS 结合使用

您可以将 Gateway 保持在云端，并在本地设备上配对 **Node**（Mac/iOS/Android/无头设备）。Node 提供本地屏幕/摄像头/Canvas 和 `system.run` 功能，而 Gateway 保持在云端。

文档：[Node](/nodes)、[Node CLI](/cli/nodes)。

## 小型 VM 和 ARM 主机的启动调优

如果 CLI 命令在低功耗 VM（或 ARM 主机）上感觉很慢，请启用 Node 的模块编译缓存：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` 改善重复命令的启动时间。
- `OPENCLAW_NO_RESPAWN=1` 使常规 Gateway 重启在进程内完成，避免额外的进程切换，并在小型主机上保持 PID 跟踪简洁。
- 第一次命令运行会预热缓存；后续运行更快。
- 有关 Raspberry Pi 的具体信息，请参阅 [Raspberry Pi](/install/raspberry-pi)。

### systemd 调优清单（可选）

对于使用 `systemd` 的 VM 主机，考虑：

- 为稳定的启动路径添加服务环境：
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 保持重启行为明确：
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 首选 SSD 支持的磁盘用于状态/缓存路径，以减少随机 I/O 冷启动延迟。

对于标准的 `openclaw onboard --install-daemon` 路径，编辑用户单元：

```bash
systemctl --user edit openclaw-gateway.service
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```

如果您故意安装了系统单元，请通过 `sudo systemctl edit openclaw-gateway.service` 编辑 `openclaw-gateway.service`。

关于 `Restart=` 策略如何帮助自动恢复：[systemd 可以自动化服务恢复](https://www.redhat.com/en/blog/systemd-automate-recovery)。

有关 Linux OOM 行为、子进程受害者选择和 `exit 137` 诊断，请参阅 [Linux 内存压力和 OOM 终止](/platforms/linux#memory-pressure-and-oom-kills)。

## 相关文档

- [安装概述](/install)
- [DigitalOcean](/install/digitalocean)
- [Fly.io](/install/fly)
- [Hetzner](/install/hetzner)
