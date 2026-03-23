---
mmh3_hash: "cb1c39182eca86d6b3b9a3807145a1ae"
summary: "在 DigitalOcean Droplet 上托管 OpenClaw"
read_when:
  - 在 DigitalOcean 上设置 OpenClaw
  - 寻找简单的付费 VPS 来运行 OpenClaw
title: "DigitalOcean"
---

# DigitalOcean

在 DigitalOcean Droplet 上运行持久化的 OpenClaw Gateway。

## 前置条件

- DigitalOcean 账号（[注册](https://cloud.digitalocean.com/registrations/new)）
- SSH 密钥对（或愿意使用密码认证）
- 约 20 分钟

## 设置

<Steps>
  <Step title="创建 Droplet">
    <Warning>
    使用干净的基础镜像（Ubuntu 24.04 LTS）。除非你已审查过启动脚本和防火墙默认值，否则避免使用第三方 Marketplace 一键镜像。
    </Warning>

    1. 登录 [DigitalOcean](https://cloud.digitalocean.com/)。
    2. 点击 **Create > Droplets**。
    3. 选择：
       - **Region：** 距你最近的地区
       - **Image：** Ubuntu 24.04 LTS
       - **Size：** Basic，Regular，1 vCPU / 1 GB RAM / 25 GB SSD
       - **Authentication：** SSH 密钥（推荐）或密码
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
    openclaw --version
    ```

  </Step>

  <Step title="运行引导向导">
    ```bash
    openclaw onboard --install-daemon
    ```

    向导会引导你完成模型认证、Channel 设置、Gateway 令牌生成和守护进程安装（systemd）。

  </Step>

  <Step title="添加 swap（1 GB Droplet 推荐）">
    ```bash
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ```
  </Step>

  <Step title="验证 Gateway">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="访问控制界面">
    Gateway 默认绑定到本地回环地址。选择以下选项之一。

    **选项 A：SSH 隧道（最简单）**

    ```bash
    # 在你的本地机器上执行
    ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP
    ```

    然后打开 `http://localhost:18789`。

    **选项 B：Tailscale Serve**

    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    tailscale up
    openclaw config set gateway.tailscale.mode serve
    openclaw gateway restart
    ```

    然后在 tailnet 上的任意设备打开 `https://<magicdns>/`。

    **选项 C：Tailnet bind（不使用 Serve）**

    ```bash
    openclaw config set gateway.bind tailnet
    openclaw gateway restart
    ```

    然后打开 `http://<tailscale-ip>:18789`（需要令牌）。

  </Step>
</Steps>

## 故障排除

**Gateway 无法启动** -- 运行 `openclaw doctor --non-interactive` 并使用 `journalctl --user -u openclaw-gateway.service -n 50` 检查日志。

**端口已被占用** -- 运行 `lsof -i :18789` 找到占用进程，然后停止它。

**内存不足** -- 使用 `free -h` 验证 swap 是否激活。如果仍然出现 OOM，改用基于 API 的模型（Claude、GPT）而非本地模型，或升级到 2 GB Droplet。

## 后续步骤

- [Channels](/channels) -- 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/gateway/configuration) -- 所有配置选项
- [更新](/install/updating) -- 保持 OpenClaw 更新
