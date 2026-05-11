---
mmh3_hash: "5401f3dfac89db5dc3f92656bc436d2b"
summary: "在 Raspberry Pi 上托管 OpenClaw，实现始终在线的自托管"
read_when:
  - 在 Raspberry Pi 上设置 OpenClaw
  - 在 ARM 设备上运行 OpenClaw
  - 构建低成本的始终在线个人 AI
title: "Raspberry Pi"
---

在 Raspberry Pi 上运行持久的、始终在线的 OpenClaw Gateway。由于 Pi 只是 gateway（模型通过 API 在云端运行），即使是普通的 Pi 也能很好地处理工作负载——典型硬件成本为**一次性 $35–80**，没有月费。

## 硬件兼容性

| Pi 型号     | 内存   | 是否可用 | 说明                     |
| ----------- | ------ | -------- | ------------------------ |
| Pi 5        | 4/8 GB | 最佳     | 最快，推荐。             |
| Pi 4        | 4 GB   | 良好     | 大多数用户的最佳选择。   |
| Pi 4        | 2 GB   | 尚可     | 添加 swap。              |
| Pi 4        | 1 GB   | 紧张     | 加 swap 后可用，配置极简。|
| Pi 3B+      | 1 GB   | 较慢     | 可用但较慢。             |
| Pi Zero 2 W | 512 MB | 不支持   | 不推荐。                 |

**最低配置：** 1 GB RAM，1 核，500 MB 可用磁盘，64 位操作系统。
**推荐配置：** 2 GB+ RAM，16 GB+ SD 卡（或 USB SSD），以太网。

## 前提条件

- Raspberry Pi 4 或 5，2 GB+ RAM（推荐 4 GB）
- MicroSD 卡（16 GB+）或 USB SSD（性能更好）
- 官方 Pi 电源适配器
- 网络连接（以太网或 WiFi）
- 64 位 Raspberry Pi OS（必须——不要使用 32 位）
- 大约 30 分钟

## 设置

<Steps>
  <Step title="烧录操作系统">
    使用 **Raspberry Pi OS Lite（64 位）**——无头服务器不需要桌面环境。

    1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)。
    2. 选择操作系统：**Raspberry Pi OS Lite（64 位）**。
    3. 在设置对话框中，预配置：
       - 主机名：`gateway-host`
       - 启用 SSH
       - 设置用户名和密码
       - 配置 WiFi（如果不使用以太网）
    4. 烧录到 SD 卡或 USB 驱动器，插入后启动 Pi。

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

  <Step title="添加 swap（2 GB 或更少内存时很重要）">
    ```bash
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

    # 为低内存设备降低 swappiness
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    ```

  </Step>

  <Step title="安装 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Step>

  <Step title="运行引导">
    ```bash
    openclaw onboard --install-daemon
    ```

    按照向导操作。对于无头设备，推荐使用 API 密钥而不是 OAuth。Telegram 是最容易上手的 channel。

  </Step>

  <Step title="验证">
    ```bash
    openclaw status
    systemctl --user status openclaw-gateway.service
    journalctl --user -u openclaw-gateway.service -f
    ```
  </Step>

  <Step title="访问控制 UI">
    在你的电脑上，从 Pi 获取 dashboard URL：

    ```bash
    ssh user@gateway-host 'openclaw dashboard --no-open'
    ```

    然后在另一个终端创建 SSH 隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
    ```

    在本地浏览器中打开打印的 URL。要实现始终在线的远程访问，请参阅 [Tailscale 集成](/gateway/tailscale)。

  </Step>
</Steps>

## 性能提示

**使用 USB SSD** -- SD 卡速度慢且容易损坏。USB SSD 显著提高性能。参阅 [Pi USB 启动指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot)。

**启用模块编译缓存** -- 在低功耗 Pi 主机上加速重复的 CLI 调用：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF' # pragma: allowlist secret
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

**减少内存使用** -- 对于无头设置，释放 GPU 内存并禁用未使用的服务：

```bash
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt
sudo systemctl disable bluetooth
```

**systemd drop-in 以实现稳定重启** -- 如果这台 Pi 主要运行 OpenClaw，添加服务 drop-in：

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

然后 `systemctl --user daemon-reload && systemctl --user restart openclaw-gateway.service`。在无头 Pi 上，还需启用一次 linger，使用户服务在注销后仍然存在：`sudo loginctl enable-linger "$(whoami)"`。

## 推荐的模型设置

由于 Pi 只运行 gateway，请使用云托管的 API 模型：

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-6",
        "fallbacks": ["openai/gpt-5.4-mini"]
      }
    }
  }
}
```

不要在 Pi 上运行本地 LLM——即使是小型模型也太慢，没有实用价值。让 Claude 或 GPT 来做模型工作。

## ARM 二进制文件说明

大多数 OpenClaw 功能在 ARM64 上无需更改即可运行（Node.js、Telegram、WhatsApp/Baileys、Chromium）。偶尔缺少 ARM 构建的二进制文件通常是 skill 附带的可选 Go/Rust CLI 工具。在回退到从源码构建之前，请验证缺失二进制文件的发布页面是否提供 `linux-arm64` / `aarch64` 构件。

## 持久化和备份

OpenClaw 状态存储在：

- `~/.openclaw/` — `openclaw.json`、每个 agent 的 `auth-profiles.json`、channel/provider 状态、session。
- `~/.openclaw/workspace/` — agent 工作区（SOUL.md、内存、构件）。

这些在重启后仍然存在。使用以下命令创建便携快照：

```bash
openclaw backup create
```

如果将这些存储在 SSD 上，性能和寿命都会比 SD 卡有所改善。

## 故障排除

**内存不足** -- 使用 `free -h` 验证 swap 是否已激活。禁用未使用的服务（`sudo systemctl disable cups bluetooth avahi-daemon`）。只使用基于 API 的模型。

**性能慢** -- 使用 USB SSD 代替 SD 卡。使用 `vcgencmd get_throttled`（应返回 `0x0`）检查 CPU 是否被限速。

**服务无法启动** -- 使用 `journalctl --user -u openclaw-gateway.service --no-pager -n 100` 检查日志，然后运行 `openclaw doctor --non-interactive`。如果这是无头 Pi，还需验证 linger 是否已启用：`sudo loginctl enable-linger "$(whoami)"`。

**ARM 二进制文件问题** -- 如果 skill 失败并显示"exec format error"，请检查该二进制文件是否有 ARM64 构建。使用 `uname -m` 验证架构（应显示 `aarch64`）。

**WiFi 断线** -- 禁用 WiFi 电源管理：`sudo iwconfig wlan0 power off`。

## 下一步

- [Channels](/channels) -- 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/gateway/configuration) -- 所有配置选项
- [更新](/install/updating) -- 保持 OpenClaw 最新

## 相关

- [安装概览](/install)
- [Linux 服务器](/vps)
- [平台](/platforms)
