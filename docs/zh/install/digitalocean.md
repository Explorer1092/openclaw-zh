---
mmh3_hash: "95f555cc69c10f5969dbb3715f76dffb"
summary: "在 DigitalOcean Droplet 上托管 OpenClaw"
read_when:
  - 在 DigitalOcean 上设置 OpenClaw
  - 寻找简单的付费 VPS 来运行 OpenClaw
title: "DigitalOcean"
---

在 DigitalOcean Droplet 上运行持久的 OpenClaw Gateway（1 GB 基础计划约 $6/月）。

DigitalOcean 是最简单的付费 VPS 路径。如果你更倾向于更便宜或免费的选项：

- [Hetzner](/install/hetzner) -- 每月 €3.79，每美元可获得更多核心/RAM。
- [Oracle Cloud](/install/oracle) -- 永久免费 ARM（最多 4 OCPU，24 GB RAM），但注册可能比较麻烦且仅限 ARM。

## 前提条件

- DigitalOcean 账户（[注册](https://cloud.digitalocean.com/registrations/new)）
- SSH 密钥对（或愿意使用密码认证）
- 约 20 分钟

## 设置

<Steps>
  <Step title="创建 Droplet">
    <Warning>
    使用干净的基础镜像（Ubuntu 24.04 LTS）。除非你已审查其启动脚本和防火墙默认值，否则请避免使用第三方 Marketplace 一键镜像。
    </Warning>

    1. 登录 [DigitalOcean](https://cloud.digitalocean.com/)。
    2. 点击 **Create > Droplets**。
    3. 选择：
       - **区域：** 距你最近的
       - **镜像：** Ubuntu 24.04 LTS
       - **大小：** 基础版，常规，1 vCPU / 1 GB RAM / 25 GB SSD
       - **认证：** SSH 密钥（推荐）或密码
    4. 点击 **Create Droplet** 并记录 IP 地址。

  </Step>

  <Step title="连接并安装">
    ```bash
    ssh root@YOUR_DROPLET_IP

    apt update && apt upgrade -y

    # 安装 Node.js 24
    curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
    apt install -y nodejs

    # 安装 OpenClaw
    curl -fsSL https://openclaw.ai/install.sh | bash

    # 创建将拥有 OpenClaw 状态和服务的非 root 用户。
    adduser openclaw
    usermod -aG sudo openclaw
    loginctl enable-linger openclaw

    su - openclaw
    openclaw --version
    ```

    root shell 仅用于系统引导。以非 root 的 `openclaw` 用户身份运行 OpenClaw 命令，使状态存储在 `/home/openclaw/.openclaw/` 下，gateway 安装为该用户的 systemd 服务。

  </Step>

  <Step title="运行引导">
    ```bash
    openclaw onboard --install-daemon
    ```

    向导将引导你完成模型认证、channel 设置、gateway 令牌生成和守护进程安装（systemd）。

  </Step>

  <Step title="添加交换空间（1 GB Droplet 推荐）">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="验证 gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="访问控制界面">
    Gateway 默认绑定到 loopback。选择以下选项之一。

    **选项 A：SSH 隧道（最简单）**

    ```bash
    # 从你的本地机器
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    然后打开 `http://localhost:18789`。

    **选项 B：Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sudo sh
    sudo tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    然后从你 tailnet 上的任何设备打开 `https://<magicdns>/`。

    Tailscale Serve 通过 tailnet 身份标头验证控制界面和 WebSocket 流量，这假设 gateway 主机本身是可信的。HTTP API 端点无论如何都遵循 gateway 的正常认证模式（令牌/密码）。要在 Serve 上强制使用明确的共享密钥凭据，请设置 `gateway.auth.allowTailscale: false` 并使用 `gateway.auth.mode: "token"` 或 `"password"`。

    **选项 C：Tailnet 绑定（不使用 Serve）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    然后打开 `http://<tailscale-ip>:18789`（需要令牌）。

  </Step>
</Steps>

## 持久化和备份

OpenClaw 状态存储在：

- `~/.openclaw/` -- `openclaw.json`、每个 agent 的 `auth-profiles.json`、channel/provider 状态和会话数据。
- `~/.openclaw/workspace/` -- agent 工作区（SOUL.md、内存、产物）。

这些数据在 Droplet 重启后保留。要创建便携快照：

```bash
openclaw backup create
```

DigitalOcean 快照会备份整个 Droplet；`openclaw backup create` 可在主机之间迁移。

## 1 GB RAM 使用技巧

$6 Droplet 只有 1 GB RAM。保持流畅的方法：

- 确保上面的交换步骤写入 `/etc/fstab`，以便在重启后保留。
- 优先使用基于 API 的模型（Claude、GPT），而非本地模型 -- 本地 LLM 推理无法在 1 GB 内运行。
- 如果遇到大型提示的 OOM，将 `agents.defaults.model.primary` 设置为更小的模型。
- 使用 `free -h` 和 `htop` 监控。

## 故障排除

**Gateway 无法启动** -- 运行 `openclaw doctor --non-interactive` 并使用 `journalctl --user -u openclaw-gateway.service -n 50` 检查日志。

**端口已占用** -- 运行 `lsof -i :18789` 找到进程，然后停止它。

**内存不足** -- 使用 `free -h` 验证交换空间是否活跃。如果仍然遇到 OOM，请使用基于 API 的模型（Claude、GPT），而非本地模型，或升级到 2 GB Droplet。

## 后续步骤

- [Channels](/channels) -- 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/gateway/configuration) -- 所有配置选项
- [更新](/install/updating) -- 保持 OpenClaw 最新

## 相关

- [安装概览](/install)
- [Fly.io](/install/fly)
- [Hetzner](/install/hetzner)
- [VPS 托管](/vps)
