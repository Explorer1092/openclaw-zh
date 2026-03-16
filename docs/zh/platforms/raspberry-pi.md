---
mmh3_hash: "2cd6204b72751d529c087d3b746dba18"
title: "在 Raspberry Pi 上运行 OpenClaw"
summary: "OpenClaw on Raspberry Pi（低价自托管设置）"
read_when:
  - 在 Raspberry Pi 上设置 OpenClaw
  - 在 ARM 设备上运行 OpenClaw
  - 构建廉价的始终在线个人 AI
---

# 在 Raspberry Pi 上运行 OpenClaw

## 目标

在 Raspberry Pi 上运行持久化、始终在线的 OpenClaw Gateway，**一次性成本约 $35-80**（无月费）。

适合：

- 24/7 个人 AI 助手
- 家庭自动化中枢
- 低功耗、始终可用的 Telegram/WhatsApp bot

## 硬件要求

| Pi 型号         | RAM     | 是否可用 | 说明                               |
| --------------- | ------- | -------- | ---------------------------------- |
| **Pi 5**        | 4GB/8GB | 最佳     | 最快，推荐                         |
| **Pi 4**        | 4GB     | 好       | 适合大多数用户的甜蜜点             |
| **Pi 4**        | 2GB     | 可用     | 有效，添加 swap                    |
| **Pi 4**        | 1GB     | 偏紧     | 加 swap 和最小配置可以用           |
| **Pi 3B+**      | 1GB     | 慢       | 有效但很慢                         |
| **Pi Zero 2 W** | 512MB   | 不推荐   | 不推荐                             |

**最低规格：** 1GB RAM，1 核，500MB 磁盘
**推荐：** 2GB+ RAM，64 位 OS，16GB+ SD 卡（或 USB SSD）

## 你需要什么

- Raspberry Pi 4 或 5（推荐 2GB+）
- MicroSD 卡（16GB+）或 USB SSD（更好的性能）
- 电源适配器（推荐官方 Pi PSU）
- 网络连接（以太网或 WiFi）
- ~30 分钟

## 1) 刷写 OS

使用 **Raspberry Pi OS Lite（64位）** — 无头服务器不需要桌面。

1. 下载 [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. 选择 OS：**Raspberry Pi OS Lite（64位）**
3. 点击齿轮图标（⚙️）预配置：
   - 设置主机名：`gateway-host`
   - 启用 SSH
   - 设置用户名/密码
   - 配置 WiFi（如果不使用以太网）
4. 刷写到 SD 卡 / USB 驱动器
5. 插入并启动 Pi

## 2) 通过 SSH 连接

```bash
ssh user@gateway-host
# 或使用 IP 地址
ssh user@192.168.x.x
```

## 3) 系统设置

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基本包
sudo apt install -y git curl build-essential

# 设置时区（对 cron/提醒很重要）
sudo timedatectl set-timezone Asia/Shanghai  # 改为你的时区
```

## 4) 安装 Node.js 24（ARM64）

```bash
# 通过 NodeSource 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 验证
node --version  # 应显示 v24.x.x
npm --version
```

## 5) 添加 Swap（2GB 或更少时很重要）

Swap 防止内存不足崩溃：

```bash
# 创建 2GB swap 文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 使其永久
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 针对低 RAM 优化（降低 swappiness）
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 6) 安装 OpenClaw

### 选项 A：标准安装（推荐）

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

### 选项 B：可修改安装（用于折腾）

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
npm install
npm run build
npm link
```

可修改安装让你直接访问日志和代码 — 对调试 ARM 特定问题很有用。

## 7) 运行引导向导

```bash
openclaw onboard --install-daemon
```

跟随向导：

1. **Gateway 模式：** Local
2. **Auth：** 推荐 API keys（OAuth 在无头 Pi 上可能有些麻烦）
3. **Channels：** Telegram 最容易开始
4. **Daemon：** 是（systemd）

## 8) 验证安装

```bash
# 检查状态
openclaw status

# 检查服务
sudo systemctl status openclaw

# 查看日志
journalctl -u openclaw -f
```

## 9) 访问 OpenClaw Dashboard

将 `user@gateway-host` 替换为你的 Pi 用户名和主机名或 IP 地址。

在你的电脑上，要求 Pi 打印一个新的 dashboard URL：

```bash
ssh user@gateway-host 'openclaw dashboard --no-open'
```

该命令打印 `Dashboard URL:`。根据 `gateway.auth.token` 的配置方式，URL 可能是普通的 `http://127.0.0.1:18789/` 链接或包含 `#token=...` 的链接。

在你电脑的另一个终端，创建 SSH 隧道：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

然后在本地浏览器中打开打印的 Dashboard URL。

如果 UI 要求 auth，从 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）粘贴 token 到 Control UI settings。

对于始终在线的远程访问，参见 [Tailscale](/gateway/tailscale)。

---

## 性能优化

### 使用 USB SSD（巨大提升）

SD 卡速度慢且容易损耗。USB SSD 显著提高性能：

```bash
# 检查是否从 USB 启动
lsblk
```

参见 [Pi USB 启动指南](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#usb-mass-storage-boot) 了解设置。

### 加速 CLI 启动（模块编译缓存）

在低功耗 Pi 主机上，启用 Node 的模块编译缓存，以便重复 CLI 运行更快：

```bash
grep -q 'NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache' ~/.bashrc || cat >> ~/.bashrc <<'EOF'
export NODE_COMPILE_CACHE=/var/tmp/openclaw-compile-cache
mkdir -p /var/tmp/openclaw-compile-cache
export OPENCLAW_NO_RESPAWN=1
EOF
source ~/.bashrc
```

说明：

- `NODE_COMPILE_CACHE` 加速后续运行（`status`、`health`、`--help`）。
- `/var/tmp` 比 `/tmp` 更能在重启后存活。
- `OPENCLAW_NO_RESPAWN=1` 避免 CLI 自重启带来的额外启动成本。
- 第一次运行预热缓存；后续运行受益最多。

### systemd 启动调整（可选）

如果此 Pi 主要运行 OpenClaw，添加服务 drop-in 以减少重启抖动并保持启动 env 稳定：

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

然后应用：

```bash
sudo systemctl daemon-reload
sudo systemctl restart openclaw
```

如果可能，将 OpenClaw 状态/缓存保存在 SSD 支持的存储上，以避免冷启动期间 SD 卡随机 I/O 瓶颈。

`Restart=` 策略如何帮助自动恢复：
[systemd 可以自动化服务恢复](https://www.redhat.com/en/blog/systemd-automate-recovery)。

### 减少内存使用

```bash
# 禁用 GPU 内存分配（无头）
echo 'gpu_mem=16' | sudo tee -a /boot/config.txt

# 如果不需要，禁用 Bluetooth
sudo systemctl disable bluetooth
```

### 监控资源

```bash
# 检查内存
free -h

# 检查 CPU 温度
vcgencmd measure_temp

# 实时监控
htop
```

---

## ARM 特定说明

### 二进制兼容性

大多数 OpenClaw 功能在 ARM64 上有效，但一些外部二进制文件可能需要 ARM 构建：

| 工具               | ARM64 状态 | 说明                                |
| ------------------ | ---------- | ----------------------------------- |
| Node.js            | 支持       | 运行良好                            |
| WhatsApp (Baileys) | 支持       | 纯 JS，无问题                       |
| Telegram           | 支持       | 纯 JS，无问题                       |
| gog (Gmail CLI)    | 待检查     | 检查是否有 ARM 版本                 |
| Chromium (browser) | 支持       | `sudo apt install chromium-browser` |

如果一个 skill 失败，检查它的二进制文件是否有 ARM 构建。许多 Go/Rust 工具有；一些没有。

### 32位 vs 64位

**始终使用 64位 OS。** Node.js 和许多现代工具需要它。检查方法：

```bash
uname -m
# 应显示：aarch64（64位）而不是 armv7l（32位）
```

---

## 推荐 Model 设置

由于 Pi 只是 Gateway（models 在云中运行），使用基于 API 的 models：

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "anthropic/claude-sonnet-4-20250514",
        "fallbacks": ["openai/gpt-4o-mini"]
      }
    }
  }
}
```

**不要尝试在 Pi 上运行本地 LLM** — 即使是小模型也太慢了。让 Claude/GPT 来承担重任。

---

## 启动时自动启动

设置向导会设置这个，但要验证：

```bash
# 检查服务是否已启用
sudo systemctl is-enabled openclaw

# 如果没有，启用
sudo systemctl enable openclaw

# 启动时启动
sudo systemctl start openclaw
```

---

## 故障排除

### 内存不足（OOM）

```bash
# 检查内存
free -h

# 添加更多 swap（见步骤 5）
# 或减少 Pi 上运行的服务
```

### 性能缓慢

- 使用 USB SSD 而不是 SD 卡
- 禁用未使用的服务：`sudo systemctl disable cups bluetooth avahi-daemon`
- 检查 CPU 节流：`vcgencmd get_throttled`（应返回 `0x0`）

### 服务无法启动

```bash
# 检查日志
journalctl -u openclaw --no-pager -n 100

# 常见修复：重建
cd ~/openclaw  # 如果使用可修改安装
npm run build
sudo systemctl restart openclaw
```

### ARM 二进制问题

如果一个 skill 失败并显示"exec format error"：

1. 检查该二进制文件是否有 ARM64 构建
2. 尝试从源码构建
3. 或使用支持 ARM 的 Docker 容器

### WiFi 断线

对于 WiFi 上的无头 Pis：

```bash
# 禁用 WiFi 电源管理
sudo iwconfig wlan0 power off

# 使其永久
echo 'wireless-power off' | sudo tee -a /etc/network/interfaces
```

---

## 成本比较

| 设置              | 一次性成本 | 月费  | 说明                    |
| ----------------- | ---------- | ----- | ----------------------- |
| **Pi 4（2GB）**   | ~$45       | $0    | + 电费（~$5/年）        |
| **Pi 4（4GB）**   | ~$55       | $0    | 推荐                    |
| **Pi 5（4GB）**   | ~$60       | $0    | 最佳性能                |
| **Pi 5（8GB）**   | ~$80       | $0    | 过剩但面向未来          |
| DigitalOcean      | $0         | $6/月 | $72/年                  |
| Hetzner           | $0         | €3.79/月 | ~$50/年              |

**盈亏平衡：** Pi 与云 VPS 相比在约 6-12 个月内收回成本。

---

## 另请参阅

- [Linux 指南](/platforms/linux) — 通用 Linux 设置
- [DigitalOcean 指南](/platforms/digitalocean) — 云替代
- [Hetzner 指南](/install/hetzner) — Docker 设置
- [Tailscale](/gateway/tailscale) — 远程访问
- [Nodes](/nodes) — 将你的笔记本/手机与 Pi gateway 配对
