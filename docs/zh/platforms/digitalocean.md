---
title: "在 DigitalOcean 上运行 OpenClaw"
mmh3_hash: "77ecf8dbf5bf466b06cb62f273253067"
summary: "在 DigitalOcean 上运行 OpenClaw(简单的付费 VPS 选项)"
read_when: ["在 DigitalOcean 上设置 OpenClaw","寻找 OpenClaw 的廉价 VPS 托管"]
---

# 在 DigitalOcean 上运行 OpenClaw

## 目标

在 DigitalOcean 上运行持久的 OpenClaw 网关,费用为**每月 6 美元**(或使用预留定价每月 4 美元)。

如果你想要每月 0 美元的选项,并且不介意 ARM + 特定提供商设置,请参阅 [Oracle Cloud 指南](/platforms/oracle)。

## 成本比较(2026)

| 提供商 | 计划 | 规格 | 价格/月 | 备注 |
|----------|------|-------|----------|-------|
| Oracle Cloud | Always Free ARM | 最多 4 OCPU,24GB RAM | $0 | ARM,容量有限 / 注册问题 |
| Hetzner | CX22 | 2 vCPU,4GB RAM | €3.79 (~$4) | 最便宜的付费选项 |
| DigitalOcean | Basic | 1 vCPU,1GB RAM | $6 | 简单的 UI,良好的文档 |
| Vultr | Cloud Compute | 1 vCPU,1GB RAM | $6 | 多个位置 |
| Linode | Nanode | 1 vCPU,1GB RAM | $5 | 现在是 Akamai 的一部分 |

**选择提供商:**
- DigitalOcean:最简单的用户体验 + 可预测的设置(本指南)
- Hetzner:良好的性价比(参见 [Hetzner 指南](/platforms/hetzner))
- Oracle Cloud:可以每月 0 美元,但更麻烦且仅限 ARM(参见 [Oracle 指南](/platforms/oracle))

---

## 前置条件

- DigitalOcean 账户([注册获取 200 美元免费积分](https://m.do.co/c/signup))
- SSH 密钥对(或愿意使用密码认证)
- 约 20 分钟

## 1) 创建 Droplet

<Warning>
使用干净的基础镜像（Ubuntu 24.04 LTS）。避免使用第三方 Marketplace 一键镜像，除非你已检查其启动脚本和防火墙默认值。
</Warning>

1. 登录 [DigitalOcean](https://cloud.digitalocean.com/)
2. 点击**创建 → Droplets**
3. 选择:
   - **区域:**离你(或你的用户)最近的
   - **镜像:** Ubuntu 24.04 LTS
   - **大小:** Basic → Regular → **$6/mo**(1 vCPU,1GB RAM,25GB SSD)
   - **认证:** SSH 密钥(推荐)或密码
4. 点击**创建 Droplet**
5. 记下 IP 地址

## 2) 通过 SSH 连接

```bash
ssh root@YOUR_DROPLET_IP
```

## 3) 安装 OpenClaw

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# 安装 OpenClaw
curl -fsSL https://openclaw.ai/install.sh | bash

# 验证
openclaw --version
```

## 4) 运行入门向导

```bash
openclaw onboard --install-daemon
```

向导将引导你完成:
- 模型认证(API 密钥或 OAuth)
- 通道设置(Telegram、WhatsApp、Discord 等)
- 网关令牌(自动生成)
- 守护进程安装(systemd)

## 5) 验证网关

```bash
# 检查状态
openclaw status

# 检查服务
systemctl --user status openclaw-gateway.service

# 查看日志
journalctl --user -u openclaw-gateway.service -f
```

## 6) 访问仪表板

网关默认绑定到环回地址。要访问控制 UI:

**选项 A: SSH 隧道(推荐)**
```bash
# 从你的本地机器
ssh -L 18789:localhost:18789 root@YOUR_DROPLET_IP

# 然后打开: http://localhost:18789
```

**选项 B: Tailscale Serve(HTTPS,仅环回)**
```bash
# 在 droplet 上
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up

# 配置网关使用 Tailscale Serve
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

打开:`https://<magicdns>/`

注意:
- Serve 保持网关仅环回,并通过 Tailscale 身份标头进行认证。
- 要改为需要令牌/密码,设置 `gateway.auth.allowTailscale: false` 或使用 `gateway.auth.mode: "password"`。

**选项 C: Tailnet 绑定(无 Serve)**
```bash
openclaw config set gateway.bind tailnet
openclaw gateway restart
```

打开:`http://<tailscale-ip>:18789`(需要令牌)。

## 7) 连接你的通道

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

参见[通道](/channels)了解其他提供商。

---

## 1GB RAM 的优化

6 美元的 droplet 只有 1GB RAM。为了保持平稳运行:

### 添加交换空间(推荐)
```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 使用更轻的模型
如果遇到内存不足,考虑:
- 使用基于 API 的模型(Claude、GPT)而不是本地模型
- 将 `agents.defaults.model.primary` 设置为更小的模型

### 监控内存
```bash
free -h
htop
```

---

## 持久化

所有状态位于:
- `~/.openclaw/` — 配置、凭据、会话数据
- `~/.openclaw/workspace/` — 工作区(SOUL.md、记忆等)

这些在重启后保留。定期备份:
```bash
tar -czvf openclaw-backup.tar.gz ~/.openclaw ~/.openclaw/workspace
```

---

## Oracle Cloud 免费替代方案

Oracle Cloud 提供**始终免费**的 ARM 实例,比这里的任何付费选项都强大得多 — 每月 0 美元。

| 获得的内容 | 规格 |
|--------------|-------|
| **4 个 OCPU** | ARM Ampere A1 |
| **24GB RAM** | 绰绰有余 |
| **200GB 存储** | 块卷 |
| **永久免费** | 无信用卡费用 |

**注意事项:**
- 注册可能很麻烦(如果失败请重试)
- ARM 架构 — 大多数东西都能工作,但一些二进制文件需要 ARM 构建

完整设置指南,请参阅 [Oracle Cloud](/platforms/oracle)。有关注册提示和注册过程故障排除,请参阅此[社区指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)。

---

## 故障排除

### 网关无法启动
```bash
openclaw gateway status
openclaw doctor --non-interactive
journalctl -u openclaw --no-pager -n 50
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

# 添加更多交换空间
# 或升级到每月 12 美元的 droplet(2GB RAM)
```

---

## 另请参阅

- [Hetzner 指南](/platforms/hetzner) — 更便宜、更强大
- [Docker 安装](/install/docker) — 容器化设置
- [Tailscale](/gateway/tailscale) — 安全远程访问
- [配置](/gateway/configuration) — 完整配置参考
