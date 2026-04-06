---
title: "在 DigitalOcean 上运行 OpenClaw"
mmh3_hash: "3208c26d47e2a9307a153bccff89a907"
summary: "OpenClaw on DigitalOcean（简单的付费 VPS 选项）"
read_when:
  - 在 DigitalOcean 上设置 OpenClaw
  - 寻找 OpenClaw 的廉价 VPS 托管
---

# 在 DigitalOcean 上运行 OpenClaw

## 目标

在 DigitalOcean 上运行持久化 OpenClaw Gateway，费用为**每月 $6**（预留定价可低至 $4/月）。

如果你想要 $0/月的选项且不介意 ARM + 特定 provider 设置，参见 [Oracle Cloud 指南](/platforms/oracle)。

## 成本比较（2026）

| Provider     | 套餐            | 规格                   | 价格/月      | 说明                                |
| ------------ | --------------- | ---------------------- | ------------ | ----------------------------------- |
| Oracle Cloud | Always Free ARM | 最多 4 OCPU，24GB RAM  | $0           | ARM，容量有限 / 注册有些繁琐        |
| Hetzner      | CX22            | 2 vCPU，4GB RAM        | €3.79（~$4） | 最便宜的付费选项                    |
| DigitalOcean | Basic           | 1 vCPU，1GB RAM        | $6           | 简单 UI，好文档                     |
| Vultr        | Cloud Compute   | 1 vCPU，1GB RAM        | $6           | 多个地区                            |
| Linode       | Nanode          | 1 vCPU，1GB RAM        | $5           | 现属于 Akamai                       |

**选择 provider：**

- DigitalOcean：最简单 UX + 可预测的设置（本指南）
- Hetzner：好的性价比（参见 [Hetzner 指南](/install/hetzner)）
- Oracle Cloud：可以 $0/月，但更繁琐且仅 ARM（参见 [Oracle 指南](/platforms/oracle)）

---

## 先决条件

- DigitalOcean 账户（[注册获得 $200 免费信用](https://m.do.co/c/signup)）
- SSH 密钥对（或愿意使用密码 auth）
- ~20 分钟

## 1) 创建 Droplet

<Warning>
使用干净的基础镜像（Ubuntu 24.04 LTS）。避免使用第三方 Marketplace 一键镜像，除非你已经检查了它们的启动脚本和防火墙默认值。
</Warning>

1. 登录 [DigitalOcean](https://cloud.digitalocean.com/)
2. 点击 **Create → Droplets**
3. 选择：
   - **Region：** 离你最近（或你的用户）
   - **Image：** Ubuntu 24.04 LTS
   - **Size：** Basic → Regular → **$6/月**（1 vCPU，1GB RAM，25GB SSD）
   - **Authentication：** SSH key（推荐）或密码
4. 点击 **Create Droplet**
5. 记下 IP 地址

## 2) 通过 SSH 连接

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) 安装 OpenClaw

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 24
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs

# 安装 OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# 验证
openclaw --version
```

## 4) 运行引导向导

```bash
openclaw onboard --install-daemon
```

向导将引导你完成：

- Model auth（API keys 或 OAuth）
- Channel 设置（Telegram、WhatsApp、Discord 等）
- Gateway token（自动生成）
- Daemon 安装（systemd）

## 5) 验证 Gateway

```bash
# 检查状态
openclaw status

# 检查服务
systemctl --user status openclaw-gateway.service

# 查看日志
journalctl --user -u openclaw-gateway.service -f
```

## 6) 访问 Dashboard

gateway 默认绑定到 loopback。要访问 Control UI：

**选项 A：SSH 隧道（推荐）**

```bash
# 从你的本地机器
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# 然后打开：http://localhost:18789
```

**选项 B：Tailscale Serve（HTTPS，仅 loopback）**

```bash
# 在 droplet 上
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# 配置 Gateway 使用 Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

打开：`https://<magicdns>/`

说明：

- Serve 保持 Gateway 仅 loopback，并通过 Tailscale 身份头验证 Control UI/WebSocket 流量（无 token auth 假定受信任的 gateway 主机；HTTP API 不使用这些 Tailscale 头，而是遵循 gateway 的正常 HTTP auth 模式）。
- 要改为需要显式共享密钥凭据，设置 `gateway.auth.allowTailscale: false` 并使用 `gateway.auth.mode: "token"` 或 `"password"`。

**选项 C：Tailnet 绑定（无 Serve）**

```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

打开：`http://<tailscale-ip>:18789`（需要 token）。

## 7) 连接你的 Channels

### Telegram

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### WhatsApp

```bash
openclaw channels login whatsapp
# 扫描二维码
```

其他 providers 参见 [Channels](/channels)。

---

## 1GB RAM 的优化

$6 的 droplet 只有 1GB RAM。为了保持顺畅运行：

### 添加 swap（推荐）

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 使用更轻的 model

如果你遇到 OOM，考虑：

- 使用基于 API 的 models（Claude、GPT）而不是本地 models
- 将 `agents.defaults.model.primary` 设置为较小的 model

### 监控内存

```bash
free -h
htop
```

---

## 持久化

所有状态位于：

- `~/.openclaw/` — `openclaw.json`、每个 agent 的 `auth-profiles.json`、channel/provider 状态和 session 数据
- `~/.openclaw/workspace/` — workspace（SOUL.md、memory 等）

这些在重启后仍然存在。定期备份它们：

```bash
openclaw backup create
```

---

## Oracle Cloud 免费替代

Oracle Cloud 提供**始终免费**的 ARM 实例，比这里任何付费选项都强大得多——每月 $0。

| 你得到什么        | 规格                   |
| ----------------- | ---------------------- |
| **4 OCPUs**       | ARM Ampere A1          |
| **24GB RAM**      | 绰绰有余               |
| **200GB 存储**    | 块存储                 |
| **永久免费**      | 无信用卡费用           |

**注意事项：**

- 注册可能有些繁琐（失败时重试）
- ARM 架构 — 大多数东西有效，但某些二进制文件需要 ARM 构建

完整设置指南见 [Oracle Cloud](/platforms/oracle)。注册提示和解决注册流程问题，见此[社区指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)。

---

## 故障排除

### Gateway 无法启动

```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl --user -u openclaw-gateway.service --no-pager -n 50
```

### 端口已被占用

```bash
lsof -i :18789
kill <PID>
```

### 内存不足

```bash
# 检查内存
free -h

# 添加更多 swap
# 或升级到 $12/月的 droplet（2GB RAM）
```

---

## 另请参阅

- [Hetzner 指南](/install/hetzner) — 更便宜，更强大
- [Docker 安装](/install/docker) — 容器化设置
- [Tailscale](/gateway/tailscale) — 安全远程访问
- [配置](/gateway/configuration) — 完整配置参考
