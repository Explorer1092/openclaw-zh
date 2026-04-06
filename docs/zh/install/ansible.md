---
mmh3_hash: "00a37f2f611c0ef79cf059cd97fffa19"
title: "Ansible"
sidebarTitle: "Ansible"
summary: "使用 Ansible、Tailscale VPN 和防火墙隔离实现自动化、强化的 OpenClaw 安装"
read_when:
  - 你想要带有安全加固的自动化服务器部署
  - 你需要带有 VPN 访问的防火墙隔离设置
  - 你正在部署到远程 Debian/Ubuntu 服务器
---

# Ansible 安装

使用 **[openclaw-ansible](https://github.com/openclaw/openclaw-ansible)** 将 OpenClaw 部署到生产服务器 — 一个具有安全优先架构的自动化安装程序。

<Info>
[openclaw-ansible](https://github.com/openclaw/openclaw-ansible) 仓库是 Ansible 部署的事实来源。本页是一个快速概览。
</Info>

## 前置条件

| 要求         | 详情                                                      |
| ------------ | --------------------------------------------------------- |
| **OS**       | Debian 11+ 或 Ubuntu 20.04+                               |
| **Access**   | Root 或 sudo 权限                                         |
| **Network**  | 用于安装包的互联网连接                                    |
| **Ansible**  | 2.14+（通过快速开始脚本自动安装）                         |

## 你将获得什么

- **防火墙优先安全** -- UFW + Docker 隔离（仅 SSH + Tailscale 可访问）
- **Tailscale VPN** -- 安全远程访问，无需公网暴露服务
- **Docker** -- 隔离的沙盒容器，仅限 localhost 绑定
- **纵深防御** -- 4 层安全架构
- **Systemd 集成** -- 开机自启并带有加固
- **一键设置** -- 数分钟内完成部署

## 快速开始

一键安装：

```bash
curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw-ansible/main/install.sh | bash
```

## 安装了什么

Ansible playbook 安装并配置：

1. **Tailscale** -- 用于安全远程访问的网状 VPN
2. **UFW 防火墙** -- 仅 SSH + Tailscale 端口
3. **Docker CE + Compose V2** -- 用于 Agent 沙盒
4. **Node.js 24 + pnpm** -- 运行时依赖（Node 22 LTS，目前为 `22.14+`，仍受支持）
5. **OpenClaw** -- 基于主机，非容器化
6. **Systemd 服务** -- 开机自启并带有安全加固

<Note>
Gateway **直接在主机上**运行（不在 Docker 中），但 Agent 沙盒使用 Docker 进行隔离。详情请参阅[沙盒](/gateway/sandboxing)。
</Note>

## 安装后设置

<Steps>
  <Step title="切换到 openclaw 用户">
    ```bash
    sudo -i -u openclaw
    ```
  </Step>
  <Step title="运行引导向导">
    安装后脚本会引导你完成 OpenClaw 设置配置。
  </Step>
  <Step title="连接消息提供商">
    登录 WhatsApp、Telegram、Discord 或 Signal：
    ```bash
    openclaw channels login
    ```
  </Step>
  <Step title="验证安装">
    ```bash
    sudo systemctl status openclaw
    sudo journalctl -u openclaw -f
    ```
  </Step>
  <Step title="连接 Tailscale">
    加入你的 VPN 网格以实现安全远程访问。
  </Step>
</Steps>

### 快速命令

```bash
# 检查服务状态
sudo systemctl status openclaw

# 查看实时日志
sudo journalctl -u openclaw -f

# 重启 Gateway
sudo systemctl restart openclaw

# 提供商登录（以 openclaw 用户身份运行）
sudo -i -u openclaw
openclaw channels login
```

## 安全架构

部署使用 4 层防御模型：

1. **防火墙（UFW）** -- 仅 SSH (22) + Tailscale (41641/udp) 公网暴露
2. **VPN（Tailscale）** -- Gateway 仅通过 VPN 网格可访问
3. **Docker 隔离** -- DOCKER-USER iptables 链防止外部端口暴露
4. **Systemd 加固** -- NoNewPrivileges、PrivateTmp、非特权用户

验证外部攻击面：

```bash
nmap -p- YOUR_SERVER_IP
```

应仅显示端口 22（SSH）开放。所有其他服务（Gateway、Docker）均被锁定。

Docker 是为 Agent 沙盒（隔离工具执行）安装的，而不是用于运行 Gateway 本身。沙盒配置请参阅[多 Agent 沙盒和工具](/tools/multi-agent-sandbox-tools)。

## 手动安装

如果你更喜欢手动控制自动化：

<Steps>
  <Step title="安装先决条件">
    ```bash
    sudo apt update && sudo apt install -y ansible git
    ```
  </Step>
  <Step title="克隆仓库">
    ```bash
    git clone https://github.com/openclaw/openclaw-ansible.git
    cd openclaw-ansible
    ```
  </Step>
  <Step title="安装 Ansible collections">
    ```bash
    ansible-galaxy collection install -r requirements.yml
    ```
  </Step>
  <Step title="运行 playbook">
    ```bash
    ./run-playbook.sh
    ```

    或者直接运行，然后手动执行设置脚本：
    ```bash
    ansible-playbook playbook.yml --ask-become-pass
    # 然后运行：/tmp/openclaw-setup.sh
    ```

  </Step>
</Steps>

## 更新

Ansible 安装程序为手动更新设置了 OpenClaw。标准更新流程请参阅[更新](/install/updating)。

重新运行 Ansible playbook（例如，用于配置更改）：

```bash
cd openclaw-ansible
./run-playbook.sh
```

这是幂等的，可以安全地多次运行。

## 故障排除

<AccordionGroup>
  <Accordion title="防火墙阻止我的连接">
    - 首先确保你可以通过 Tailscale VPN 访问
    - SSH 访问（端口 22）始终被允许
    - 按设计，Gateway 仅可通过 Tailscale 访问
  </Accordion>
  <Accordion title="服务无法启动">
    ```bash
    # 检查日志
    sudo journalctl -u openclaw -n 100

    # 验证权限
    sudo ls -la /opt/openclaw

    # 测试手动启动
    sudo -i -u openclaw
    cd ~/openclaw
    openclaw gateway run
    ```

  </Accordion>
  <Accordion title="Docker 沙盒问题">
    ```bash
    # 验证 Docker 正在运行
    sudo systemctl status docker

    # 检查沙盒镜像
    sudo docker images | grep openclaw-sandbox

    # 如果缺失，构建沙盒镜像
    cd /opt/openclaw/openclaw
    sudo -u openclaw ./scripts/sandbox-setup.sh
    ```

  </Accordion>
  <Accordion title="提供商登录失败">
    确保你以 `openclaw` 用户身份运行：
    ```bash
    sudo -i -u openclaw
    openclaw channels login
    ```
  </Accordion>
</AccordionGroup>

## 高级配置

有关详细的安全架构和故障排除，请参阅 openclaw-ansible 仓库：

- [安全架构](https://github.com/openclaw/openclaw-ansible/blob/main/docs/security.md)
- [技术细节](https://github.com/openclaw/openclaw-ansible/blob/main/docs/architecture.md)
- [故障排除指南](https://github.com/openclaw/openclaw-ansible/blob/main/docs/troubleshooting.md)

## 相关

- [openclaw-ansible](https://github.com/openclaw/openclaw-ansible) -- 完整部署指南
- [Docker](/install/docker) -- 容器化 Gateway 设置
- [沙盒](/gateway/sandboxing) -- Agent 沙盒配置
- [多 Agent 沙盒和工具](/tools/multi-agent-sandbox-tools) -- 每 Agent 隔离
