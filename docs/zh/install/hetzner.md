---
mmh3_hash: "5b96827067b202303fda8f2c421bb64d"
summary: "在廉价的 Hetzner VPS（Docker）上全天候运行 OpenClaw Gateway，具有持久状态和嵌入的二进制文件"
read_when:
  - 你希望 OpenClaw 在云 VPS 上全天候运行（不是你的笔记本电脑）
  - 你想要生产级、永久在线的 Gateway 在你自己的 VPS 上
  - 你希望完全控制持久性、二进制文件和重启行为
  - 你在 Hetzner 或类似 Provider 上的 Docker 中运行 OpenClaw
title: "Hetzner"
---

# OpenClaw on Hetzner（Docker，生产 VPS 指南）

## 目标

使用 Docker 在 Hetzner VPS 上运行持久的 OpenClaw Gateway，具有持久状态、烘焙的二进制文件和安全的重启行为。

如果你想要"每月约 $5 全天候运行 OpenClaw"，这是最简单可靠的设置。
Hetzner 定价会变动；选择最小的 Debian/Ubuntu VPS，如果遇到 OOM 则扩展。

安全模型提醒：

- 当每个人都在同一信任边界且运行时仅用于业务时，公司共享的 agent 没问题。
- 保持严格分离：专用 VPS/运行时 + 专用账户；该主机上不放个人的 Apple/Google/浏览器/密码管理器配置文件。
- 如果用户互相对立，按 gateway/主机/OS 用户分割。

参阅 [Security](/gateway/security) 和 [VPS 托管](/vps)。

## 我们在做什么（简单说明）？

- 租用小型 Linux 服务器（Hetzner VPS）
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw Gateway
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（在重启/重建后仍然存在）
- 通过 SSH 隧道从你的笔记本电脑访问控制 UI

该挂载的 `~/.openclaw` 状态包括 `openclaw.json`、每个 agent 的
`agents/<agentId>/agent/auth-profiles.json` 和 `.env`。

Gateway 可通过以下方式访问：

- 从你的笔记本电脑进行 SSH 端口转发
- 如果你自己管理防火墙和 token，则直接端口暴露

本指南假设 Hetzner 上使用 Ubuntu 或 Debian。
如果你使用其他 Linux VPS，相应地映射软件包。
通用 Docker 流程请参阅 [Docker](/install/docker)。

---

## 快速路径（有经验的操作者）

1. 配置 Hetzner VPS
2. 安装 Docker
3. 克隆 OpenClaw 仓库
4. 创建持久主机目录
5. 配置 `.env` 和 `docker-compose.yml`
6. 将所需二进制文件烘焙到镜像中
7. `docker compose up -d`
8. 验证持久性和 Gateway 访问

---

## 你需要什么

- 具有 root 访问权限的 Hetzner VPS
- 从你的笔记本电脑进行 SSH 访问
- 基本的 SSH + 复制/粘贴操作能力
- 约 20 分钟
- Docker 和 Docker Compose
- 模型认证凭据
- 可选 provider 凭据
  - WhatsApp 二维码
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="配置 VPS">
    在 Hetzner 创建 Ubuntu 或 Debian VPS。

    以 root 身份连接：

    ```bash
    ssh root@YOUR_VPS_IP
    ```

    本指南假设 VPS 是有状态的。
    不要将其视为可丢弃的基础设施。

  </Step>

  <Step title="安装 Docker（在 VPS 上）">
    ```bash
    apt-get update
    apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sh
    ```

    验证：

    ```bash
    docker --version
    docker compose version
    ```

  </Step>

  <Step title="克隆 OpenClaw 仓库">
    ```bash
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw
    ```

    本指南假设你将构建自定义镜像以保证二进制持久性。

  </Step>

  <Step title="创建持久主机目录">
    Docker 容器是临时的。
    所有长期状态必须存储在主机上。

    ```bash
    mkdir -p /root/.openclaw/workspace

    # 将所有权设置为容器用户（uid 1000）：
    chown -R 1000:1000 /root/.openclaw
    ```

  </Step>

  <Step title="配置环境变量">
    在仓库根目录创建 `.env`。

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/root/.openclaw
    OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

    GOG_KEYRING_PASSWORD=
    XDG_CONFIG_HOME=/home/node/.openclaw
    ```

    除非你明确想通过 `.env` 管理 `OPENCLAW_GATEWAY_TOKEN`，否则将其留空；OpenClaw 在首次启动时向配置写入随机 gateway token。生成 keyring 密码并粘贴到 `GOG_KEYRING_PASSWORD` 中：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交此文件。**

    此 `.env` 文件用于容器/运行时环境，如 `OPENCLAW_GATEWAY_TOKEN`。
    存储的 provider OAuth/API 密钥认证存储在挂载的
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` 中。

  </Step>

  <Step title="Docker Compose 配置">
    创建或更新 `docker-compose.yml`。

    ```yaml
    services:
      openclaw-gateway:
        image: ${OPENCLAW_IMAGE}
        build: .
        restart: unless-stopped
        env_file:
          - .env
        environment:
          - HOME=/home/node
          - NODE_ENV=production
          - TERM=xterm-256color
          - OPENCLAW_GATEWAY_BIND=${OPENCLAW_GATEWAY_BIND}
          - OPENCLAW_GATEWAY_PORT=${OPENCLAW_GATEWAY_PORT}
          - OPENCLAW_GATEWAY_TOKEN=${OPENCLAW_GATEWAY_TOKEN}
          - GOG_KEYRING_PASSWORD=${GOG_KEYRING_PASSWORD}
          - XDG_CONFIG_HOME=${XDG_CONFIG_HOME}
          - PATH=/home/linuxbrew/.linuxbrew/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
        volumes:
          - ${OPENCLAW_CONFIG_DIR}:/home/node/.openclaw
          - ${OPENCLAW_WORKSPACE_DIR}:/home/node/.openclaw/workspace
        ports:
          # 推荐：将 Gateway 保持在 VPS 的 loopback 上；通过 SSH 隧道访问。
          # 要公开暴露，删除 `127.0.0.1:` 前缀并相应配置防火墙。
          - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"
        command:
          [
            "node",
            "dist/index.js",
            "gateway",
            "--bind",
            "${OPENCLAW_GATEWAY_BIND}",
            "--port",
            "${OPENCLAW_GATEWAY_PORT}",
            "--allow-unconfigured",
          ]
    ```

    `--allow-unconfigured` 仅用于引导便利，它不是正确 gateway 配置的替代品。仍然设置认证（`gateway.auth.token` 或密码）并为你的部署使用安全的绑定设置。

  </Step>

  <Step title="共享 Docker VM 运行时步骤">
    使用共享运行时指南进行常见的 Docker 主机流程：

    - [将所需二进制文件烘焙到镜像中](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建和启动](/install/docker-vm-runtime#build-and-launch)
    - [持久化位置](/install/docker-vm-runtime#what-persists-where)
    - [更新](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="Hetzner 特定访问">
    完成共享构建和启动步骤后，从你的笔记本电脑创建隧道：

    ```bash
    ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
    ```

    打开：

    `http://127.0.0.1:18789/`

    粘贴配置的共享密钥。本指南默认使用 gateway token；
    如果你切换到密码认证，请改用该密码。

  </Step>
</Steps>

共享持久化映射在 [Docker VM 运行时](/install/docker-vm-runtime#what-persists-where) 中。

## 基础设施即代码（Terraform）

对于偏好基础设施即代码工作流的团队，社区维护的 Terraform 设置提供：

- 具有远程状态管理的模块化 Terraform 配置
- 通过 cloud-init 自动化配置
- 部署脚本（引导、部署、备份/恢复）
- 安全加固（防火墙、UFW、仅 SSH 访问）
- gateway 访问的 SSH 隧道配置

**仓库：**

- 基础设施：[openclaw-terraform-hetzner](https://github.com/andreesg/openclaw-terraform-hetzner)
- Docker 配置：[openclaw-docker-config](https://github.com/andreesg/openclaw-docker-config)

这种方法通过可重现的部署、版本控制的基础设施和自动化灾难恢复来补充上面的 Docker 设置。

<Note>
社区维护。如有问题或贡献，请参阅上面的仓库链接。
</Note>

## 下一步

- 设置消息 channel：[Channels](/channels)
- 配置 Gateway：[Gateway 配置](/gateway/configuration)
- 保持 OpenClaw 最新：[更新](/install/updating)

## 相关

- [安装概览](/install)
- [Fly.io](/install/fly)
- [Docker](/install/docker)
- [VPS 托管](/vps)
