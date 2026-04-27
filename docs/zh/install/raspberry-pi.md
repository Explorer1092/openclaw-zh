---
mmh3_hash: "dfb12695a99b0a11438f323bcd8e968f"
summary: "在 Raspberry Pi 上托管 OpenClaw，实现始终在线的自托管"
read_when:
  - 在 Raspberry Pi 上设置 OpenClaw
  - 在 ARM 设备上运行 OpenClaw
  - 构建廉价的始终在线个人 AI
title: "Raspberry Pi"
---

在 Raspberry Pi 上运行持久、始终在线的 OpenClaw Gateway。由于 Pi 只是 gateway（模型通过 API 在云端运行），即使是普通的 Pi 也能很好地处理工作负载。

## 前提条件

- Raspberry Pi 4 或 5，2 GB+ RAM（推荐 4 GB）
- MicroSD 卡（16 GB+）或 USB SSD（性能更好）
- 官方 Pi 电源适配器
- 网络连接（以太网或 WiFi）
- 64 位 Raspberry Pi OS（必需 — 不要使用 32 位）
- 大约 30 分钟

## 设置

<Steps>
  <Step title="刷写 OS">
    使用 **Raspberry Pi OS Lite (64 位)** — 无头服务器不需要桌面。

    1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)。
    2. 选择 OS：**Raspberry Pi OS Lite (64 位)**。
    3. 在设置对话框中，预配置：
       - 主机名：`gateway-host`
       - 启用 SSH
       - 设置用户名和密码
       - 配置 WiFi（如果不使用以太网）
    4. 刷写到你的 SD 卡或 USB 驱动器，插入并启动 Pi。

  </Step>

  <Step title="通过 SSH 连接">
    ```bash
    ssh user@gateway-host
    ```
  </Step>

  <Step title="更新系统">
    ```bash
    sudo apt update && sudo apt upgrade -y
    sudo apt install -y git curl build-essential

    # 设置时区（对 cron 和提醒很重要）
    sudo timedatectl set-timezone America/Chicago
    ```

  </Step>

  <Step title="安装 Node.js 24">
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt install -y nodejs
    node --version
    ```
  </Step>

  <Step title="添加交换空间（2 GB 或更少内存时很重要）">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # 对于低 RAM 设备，减少交换率
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="安装 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="运行入门引导">
    ```bash
    openclaw onboard --install-daemon
    ```

    按照向导操作。对于无头设备，建议使用 API 密钥而不是 OAuth。Telegram 是最容易开始的 channel。

  </Step>

  <Step title="验证">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="访问控制 UI">
    在你的计算机上，从 Pi 获取仪表板 URL：

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    然后在另一个终端创建 SSH 隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    在你的本地浏览器中打开打印的 URL。如需始终在线的远程访问，请参阅 [Tailscale 集成](/gateway/tailscale)。

  </Step>
</Steps>

## 性能提示

**使用 USB SSD** — SD 卡速度慢且会磨损。USB SSD 显著提升性能。参见 [Pi USB 启动指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

**启用模块编译缓存** — 加速低功耗 Pi 主机上的重复 CLI 调用：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**减少内存使用** — 对于无头设置，释放 GPU 内存并禁用未使用的服务：

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

## 故障排除

**内存不足** — 用 `free -h` 验证交换空间是否活跃。禁用未使用的服务（`sudo systemctl disable cups bluetooth avahi-daemon`）。仅使用基于 API 的模型。

**性能缓慢** — 使用 USB SSD 而不是 SD 卡。用 `vcgencmd get_throttled` 检查 CPU 节流（应返回 `0x0`）。

**服务无法启动** — 用 `journalctl --user -u openclaw-gateway.service --no-pager -n 100` 检查日志，并运行 `openclaw doctor --non-interactive`。如果这是无头 Pi，还要验证 linger 是否已启用：`sudo loginctl enable-linger "$(whoami)"`。

**ARM 二进制文件问题** — 如果某个 skill 因"exec format error"而失败，检查该二进制文件是否有 ARM64 构建。用 `uname -m`（应显示 `aarch64`）验证架构。

**WiFi 断开** — 禁用 WiFi 电源管理：`sudo iwconfig wlan0 power off`。

## 下一步

- [Channels](/channels) — 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/gateway/configuration) — 所有配置选项
- [更新](/install/updating) — 保持 OpenClaw 最新

## 相关

- [安装概览](/install)
- [Linux 服务器](/vps)
- [平台](/platforms)
