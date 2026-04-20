---
mmh3_hash: "15c62201a2c8c33cd5fa580d8490abea"
summary: "在 Linux 服务器或云 VPS 上运行 OpenClaw — 提供商选择、架构和调优"
read_when:
  - 您想在 Linux 服务器或云 VPS 上运行 Gateway
  - 您需要托管指南的快速地图
  - 您想要 OpenClaw 的通用 Linux 服务器调优
title: "Linux 服务器"
sidebarTitle: "Linux 服务器"
---

# Linux 服务器

在任何 Linux 服务器或云 VPS 上运行 OpenClaw Gateway。本页帮助您选择提供商、
解释云部署的工作方式，并涵盖适用于所有环境的通用 Linux 调优。

## 选择提供商

<CardGroup cols={2}>
  <Card title="Railway" href="/install/railway">一键，浏览器设置</Card>
  <Card title="Northflank" href="/install/northflank">一键，浏览器设置</Card>
  <Card title="DigitalOcean" href="/install/digitalocean">简单付费 VPS</Card>
  <Card title="Oracle Cloud" href="/install/oracle">Always Free ARM 层</Card>
  <Card title="Fly.io" href="/install/fly">Fly Machines</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner VPS 上的 Docker</Card>
  <Card title="Hostinger" href="/install/hostinger">VPS 一键设置</Card>
  <Card title="GCP" href="/install/gcp">Compute Engine</Card>
  <Card title="Azure" href="/install/azure">Linux VM</Card>
  <Card title="exe.dev" href="/install/exe-dev">带 HTTPS 代理的 VM</Card>
  <Card title="Raspberry Pi" href="/install/raspberry-pi">ARM 自托管</Card>
</CardGroup>

**AWS（EC2 / Lightsail / 免费层）** 也很好用。
社区视频演示可在以下位置找到：
[x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)
（社区资源 -- 可能变得不可用）。

## 云设置的工作方式

- **Gateway 在 VPS 上运行**并拥有状态 + workspace。
- 您通过**控制 UI** 或 **Tailscale/SSH** 从笔记本电脑或手机连接。
- 将 VPS 视为真实来源并**备份**状态 + workspace。
- 安全默认值：将 Gateway 保持在 loopback 上，并通过 SSH 隧道或 Tailscale Serve 访问它。
  如果您绑定到 `lan` 或 `tailnet`，请要求 `gateway.auth.token` 或 `gateway.auth.password`。

相关页面：[Gateway 远程访问](/gateway/remote)、[平台中心](/platforms)。

## VPS 上的公司共享代理

当每个用户处于同一信任边界且代理仅用于业务时，为团队运行单个代理是一个有效的设置。

- 将其保留在专用运行时（VPS/VM/容器 + 专用 OS 用户/账户）上。
- 不要将该运行时登录到个人 Apple/Google 账户或个人浏览器/密码管理器配置文件。
- 如果用户对彼此具有对抗性，按 Gateway/主机/OS 用户拆分。

安全模型详情：[安全](/gateway/security)。

## 将节点与 VPS 一起使用

您可以将 Gateway 保留在云中，并在本地设备（Mac/iOS/Android/无头）上配对**节点**。
节点提供本地屏幕/相机/canvas 和 `system.run` 功能，而 Gateway 保留在云中。

文档：[节点](/nodes)、[节点 CLI](/cli/nodes)。

## 小型 VM 和 ARM 主机的启动调优

如果 CLI 命令在低功耗 VM（或 ARM 主机）上感觉缓慢，请启用 Node 的模块编译缓存：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

- `NODE_COMPILE_CACHE` 改善重复命令的启动时间。
- `OPENCLAW_NO_RESPAWN=1` 避免自重生路径带来的额外启动开销。
- 第一次命令运行时预热缓存；后续运行速度更快。
- 有关 Raspberry Pi 的具体信息，请参阅 [Raspberry Pi](/install/raspberry-pi)。

### systemd 调优清单（可选）

对于使用 `systemd` 的 VM 主机，请考虑：

- 为稳定的启动路径添加服务环境：
  - `OPENCLAW_NO_RESPAWN=1`
  - `NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache`
- 保持重启行为明确：
  - `Restart=always`
  - `RestartSec=2`
  - `TimeoutStartSec=90`
- 首选 SSD 支持的磁盘用于状态/缓存路径，以减少随机 I/O 冷启动惩罚。

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

如果您有意安装了系统单元，请通过 `sudo systemctl edit openclaw-gateway.service` 编辑 `openclaw-gateway.service`。

`Restart=` 策略如何帮助自动化恢复：
[systemd 可以自动化服务恢复](https://www.redhat.com/en/blog/systemd-automate-recovery)。
