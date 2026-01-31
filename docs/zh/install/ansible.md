---
mmh3_hash: "831331b85f3db6c5deb670b8a7fe06a8"
summary: "使用 Ansible、Tailscale VPN 和防火墙隔离实现自动化、强化的 OpenClaw 安装"
read_when:
  - 你想要带有安全加固的自动化服务器部署
  - 你需要带有 VPN 访问的防火墙隔离设置
  - 你正在部署到远程 Debian/Ubuntu 服务器
---

# Ansible 安装

将 OpenClaw 部署到生产服务器的推荐方法是通过 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** — 一个具有安全优先架构的自动化安装程序。

## 快速开始

一键安装：

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

> **📦 完整指南: [github.com/openclaw/openclaw-ansible](https://github.com/openclaw/openclaw-ansible)**
>
> openclaw-ansible 仓库是 Ansible 部署的事实来源。本页是一个快速概览。

## 你得到了什么

- 🔒 **防火墙优先安全**: UFW + Docker 隔离（仅 SSH + Tailscale 可访问）
- 🔐 **Tailscale VPN**: 安全远程访问，无需公网暴露服务
- 🐳 **Docker**: 隔离的沙盒容器，仅限 localhost 绑定
- 🛡️ **纵深防御**: 4 层安全架构
- 🚀 **一键设置**: 数分钟内完成部署
- 🔧 **Systemd 集成**: 开机自启并带有加固

## 要求

- **OS**: Debian 11+ 或 Ubuntu 20.04+
- **Access**: Root 或 sudo 权限
- **Network**: 用于安装包的互联网连接
- **Ansible**: 2.14+ (通过快速开始脚本自动安装)

## 安装了什么

Ansible playbook 安装并配置：

1. **Tailscale** (用于安全远程访问的网状 VPN)
2. **UFW 防火墙** (仅 SSH + Tailscale 端口)
3. **Docker CE + Compose V2** (用于智能体沙盒)
4. **Node.js 22.x + pnpm** (运行时依赖)
5. **OpenClaw** (基于主机，非容器化)
6. **Systemd 服务** (开机自启并带有安全加固)

注意：网关 **直接在主机上** 运行（不在 Docker 中），但智能体沙盒使用 Docker 进行隔离。有关详细信息，请参见 [沙盒](/gateway/sandboxing)。

## 安装后设置

安装完成后，切换到 openclaw 用户：

```bash
sudo -i -u openclaw
```

安装后脚本将引导你完成：

1. **入门向导**: 配置 OpenClaw 设置
2. **提供商登录**: 连接 WhatsApp/Telegram/Discord/Signal
3. **网关测试**: 验证安装
4. **Tailscale 设置**: 连接到你的 VPN 网格

### 快速命令

```bash
# 检查服务状态
sudo systemctl status openclaw

# 查看实时日志
sudo journalctl -u openclaw -f

# 重启网关
sudo systemctl restart openclaw

# 提供商登录 (作为 openclaw 用户运行)
sudo -i -u openclaw
openclaw channels login
```

## 安全架构

### 4 层防御

1. **防火墙 (UFW)**: 仅 SSH (22) + Tailscale (41641/udp) 公网暴露
2. **VPN (Tailscale)**: 网关仅通过 VPN 网格可访问
3. **Docker 隔离**: DOCKER-USER iptables 链防止外部端口暴露
4. **Systemd 加固**: NoNewPrivileges, PrivateTmp, 非特权用户

### 验证

测试外部攻击面：

```bash
nmap -p- YOUR_SERVER_IP
```

应显示 **仅端口 22** (SSH) 开放。所有其他服务（网关、Docker）都被锁定。

### Docker 可用性

安装 Docker 是为了 **智能体沙盒**（隔离工具执行），而不是为了运行网关本身。网关仅绑定到 localhost，并通过 Tailscale VPN 访问。

有关沙盒配置，请参见 [多智能体沙盒 & 工具](/multi-agent-sandbox-tools)。

## 手动安装

如果你更喜欢手动控制自动化：

```bash
# 1. 安装先决条件
sudo apt update && sudo apt install -y ansible git

# 2. 克隆仓库
git clone https://github.com/openclaw/openclaw-ansible.git
cd openclaw-ansible

# 3. 安装 Ansible 集合
ansible-galaxy collection install -r requirements.yml

# 4. 运行 playbook
./run-playbook.sh

# 或者直接运行 (然后手动执行 /tmp/openclaw-setup.sh)
# ansible-playbook playbook.yml --ask-become-pass
```

## 更新 OpenClaw

Ansible 安装程序为手动更新设置了 OpenClaw。有关标准更新流程，请参见 [更新](/install/updating)。

要重新运行 Ansible playbook（例如，用于配置更改）：

```bash
cd openclaw-ansible
./run-playbook.sh
```

注意：这是幂等的，并且可以安全地多次运行。

## 故障排除

### 防火墙阻止我的连接

如果你被锁定：
- 首先确保你可以通过 Tailscale VPN 访问
- SSH 访问 (端口 22) 始终被允许
- 按照设计，网关 **仅** 可通过 Tailscale 访问

### 服务无法启动

```bash
# 检查日志
sudo journalctl -u openclaw -n 100

# 验证权限
sudo ls -la /opt/openclaw

# 测试手动启动
sudo -i -u openclaw
cd ~/openclaw
pnpm start
```

### Docker 沙盒问题

```bash
# 验证 Docker 正在运行
sudo systemctl status docker

# 检查沙盒镜像
sudo docker images | grep openclaw-sandbox

# 如果丢失，构建沙盒镜像
cd /opt/openclaw/openclaw
sudo -u openclaw ./scripts/sandbox-setup.sh
```

### 提供商登录失败

确保你以 `openclaw` 用户身份运行：

```bash
sudo -i -u openclaw
openclaw channels login
```

## 高级配置

有关详细的安全架构和故障排除：
- [安全架构](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技术细节](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [故障排除指南](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 相关

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) — 完整部署指南
- [Docker](/install/docker) — 容器化网关设置
- [沙盒](/gateway/sandboxing) — 智能体沙盒配置
- [多智能体沙盒 & 工具](/multi-agent-sandbox-tools) — 每智能体隔离
