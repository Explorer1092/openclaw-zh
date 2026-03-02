---
mmh3_hash: "4b0d1a5d6f37ceb228d96daae56dadcd"
summary: "OpenClaw 的 VPS 托管中心 (Oracle/Fly/Hetzner/GCP/exe.dev)"
read_when:
  - 您想在云中运行 Gateway
  - 您需要 VPS/托管指南的快速地图
title: "VPS 托管"
---

# VPS 托管

此中心链接到支持的 VPS/托管指南,并从高层次解释云部署的工作方式。

## 选择提供商

- **Railway** (一键 + 浏览器设置): [Railway](/install/railway)
- **Northflank** (一键 + 浏览器设置): [Northflank](/install/northflank)
- **Oracle Cloud (Always Free)**: [Oracle](/platforms/oracle) — $0/月 (Always Free, ARM; 容量/注册可能很棘手)
- **Fly.io**: [Fly.io](/install/fly)
- **Hetzner (Docker)**: [Hetzner](/install/hetzner)
- **GCP (Compute Engine)**: [GCP](/install/gcp)
- **exe.dev** (VM + HTTPS 代理): [exe.dev](/install/exe-dev)
- **AWS (EC2/Lightsail/免费层)**: 也很好用。视频指南:
  [https://x.com/techfrenAJ/status/2014934471095812547](https://x.com/techfrenAJ/status/2014934471095812547)

## 云设置的工作方式

- **Gateway 在 VPS 上运行**并拥有状态 + workspace。
- 您通过**控制 UI** 或 **Tailscale/SSH** 从笔记本电脑/手机连接。
- 将 VPS 视为真实来源并**备份**状态 + workspace。
- 安全默认值: 将 Gateway 保持在 loopback 上,并通过 SSH 隧道或 Tailscale Serve 访问它。
  如果您绑定到 `lan`/`tailnet`,则需要 `gateway.auth.token` 或 `gateway.auth.password`。

远程访问: [Gateway 远程](/gateway/remote)
平台中心: [平台](/platforms)

## VPS 上的公司共享代理

当用户处于同一信任边界时（例如一个公司团队），且代理仅用于业务，这是一个有效的设置。

- 将其保留在专用运行时（VPS/VM/容器 + 专用 OS 用户/账户）上。
- 不要将该运行时登录到个人 Apple/Google 账户或个人浏览器/密码管理器配置文件。
- 如果用户对彼此具有对抗性，按 Gateway/主机/OS 用户拆分。

安全模型详情：[安全](/gateway/security)

## 将节点与 VPS 一起使用

您可以将 Gateway 保留在云中，并在本地设备（Mac/iOS/Android/无头）上配对**节点**。节点提供本地屏幕/相机/canvas 和 `system.run` 功能，而 Gateway 保留在云中。

文档: [节点](/nodes), [节点 CLI](/cli/nodes)

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
- 有关 Raspberry Pi 的具体信息，请参阅 [Raspberry Pi](/platforms/raspberry-pi)。

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

示例：

```bash
sudo systemctl edit openclaw
```

```ini
[Service]
Environment=OPENCLAW_NO_RESPAWN=1
Environment=NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
Restart=always
RestartSec=2
TimeoutStartSec=90
```
