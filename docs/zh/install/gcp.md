---
mmh3_hash: "cc26fe97cc21ed1e5e7f58284bceb769"
summary: "在 GCP Compute Engine VM（Docker）上全天候运行 OpenClaw Gateway，具有持久状态"
read_when:
  - 你希望 OpenClaw 在 GCP 上全天候运行
  - 你想要生产级、永久在线的 Gateway 在你自己的 VM 上
  - 你希望完全控制持久性、二进制文件和重启行为
title: "GCP"
---

# OpenClaw on GCP Compute Engine（Docker，生产 VPS 指南）

## 目标

使用 Docker 在 GCP Compute Engine VM 上运行持久的 OpenClaw Gateway，具有持久状态、烘焙的二进制文件和安全的重启行为。

如果你想要"每月约 $5-12 全天候运行 OpenClaw"，这是 Google Cloud 上可靠的设置。
定价因机器类型和地区而异；选择适合你工作负载的最小 VM，如果遇到 OOM 则扩展。

## 我们在做什么（简单说明）？

- 创建 GCP 项目并启用计费
- 创建 Compute Engine VM
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw Gateway
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（在重启/重建后仍然存在）
- 通过 SSH 隧道从你的笔记本电脑访问控制 UI

该挂载的 `~/.openclaw` 状态包括 `openclaw.json`、每个 agent 的
`agents/<agentId>/agent/auth-profiles.json` 和 `.env`。

Gateway 可通过以下方式访问：

- 从你的笔记本电脑进行 SSH 端口转发
- 如果你自己管理防火墙和 token，则直接端口暴露

本指南使用 GCP Compute Engine 上的 Debian。
Ubuntu 也可以；相应地映射软件包。
通用 Docker 流程请参阅 [Docker](/install/docker)。

---

## 快速路径（有经验的操作者）

1. 创建 GCP 项目 + 启用 Compute Engine API
2. 创建 Compute Engine VM（e2-small，Debian 12，20GB）
3. SSH 进入 VM
4. 安装 Docker
5. 克隆 OpenClaw 仓库
6. 创建持久主机目录
7. 配置 `.env` 和 `docker-compose.yml`
8. 烘焙所需二进制文件，构建并启动

---

## 你需要什么

- GCP 账户（e2-micro 符合免费层资格）
- 已安装 gcloud CLI（或使用 Cloud Console）
- 从你的笔记本电脑进行 SSH 访问
- 基本的 SSH + 复制/粘贴操作能力
- 约 20-30 分钟
- Docker 和 Docker Compose
- 模型认证凭据
- 可选 provider 凭据
  - WhatsApp 二维码
  - Telegram bot token
  - Gmail OAuth

---

<Steps>
  <Step title="安装 gcloud CLI（或使用 Console）">
    **选项 A：gcloud CLI**（推荐用于自动化）

    从 [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) 安装

    初始化并认证：

    ```bash
    gcloud init
    gcloud auth login
    ```

    **选项 B：Cloud Console**

    所有步骤都可以通过 [https://console.cloud.google.com](https://console.cloud.google.com) 的 Web UI 完成

  </Step>

  <Step title="创建 GCP 项目">
    **CLI：**

    ```bash
    gcloud projects create my-openclaw-project --name="OpenClaw Gateway"
    gcloud config set project my-openclaw-project
    ```

    在 [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) 启用计费（Compute Engine 需要）。

    启用 Compute Engine API：

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console：**

    1. 转到 IAM & Admin > Create Project
    2. 命名并创建
    3. 为项目启用计费
    4. 导航到 APIs & Services > Enable APIs > 搜索"Compute Engine API" > 启用

  </Step>

  <Step title="创建 VM">
    **机器类型：**

    | 类型      | 规格                     | 费用               | 说明                                          |
    | --------- | ------------------------ | ------------------ | --------------------------------------------- |
    | e2-medium | 2 vCPU，4GB RAM          | 约 $25/月          | 本地 Docker 构建最可靠                         |
    | e2-small  | 2 vCPU，2GB RAM          | 约 $12/月          | Docker 构建的最低推荐                           |
    | e2-micro  | 2 vCPU（共享），1GB RAM  | 符合免费层资格      | Docker 构建 OOM 常见（退出码 137）             |

    **CLI：**

    ```bash
    gcloud compute instances create openclaw-gateway \
      --zone=us-central1-a \
      --machine-type=e2-small \
      --boot-disk-size=20GB \
      --image-family=debian-12 \
      --image-project=debian-cloud
    ```

    **Console：**

    1. 转到 Compute Engine > VM instances > Create instance
    2. 名称：`openclaw-gateway`
    3. 地区：`us-central1`，区域：`us-central1-a`
    4. 机器类型：`e2-small`
    5. 启动磁盘：Debian 12，20GB
    6. 创建

  </Step>

  <Step title="SSH 进入 VM">
    **CLI：**

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
    ```

    **Console：**

    点击 Compute Engine 仪表板中 VM 旁边的"SSH"按钮。

    说明：SSH 密钥传播在 VM 创建后可能需要 1-2 分钟。如果连接被拒绝，请等待并重试。

  </Step>

  <Step title="安装 Docker（在 VM 上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    注销并重新登录以使组更改生效：

    ```bash
    exit
    ```

    然后重新 SSH 进入：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a
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
    mkdir -p ~/.openclaw
    mkdir -p ~/.openclaw/workspace
    ```

  </Step>

  <Step title="配置环境变量">
    在仓库根目录创建 `.env`。

    ```bash
    OPENCLAW_IMAGE=openclaw:latest
    OPENCLAW_GATEWAY_TOKEN=
    OPENCLAW_GATEWAY_BIND=lan
    OPENCLAW_GATEWAY_PORT=18789

    OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
    OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

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
          # 推荐：将 Gateway 保持在 VM 的 loopback 上；通过 SSH 隧道访问。
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

  <Step title="GCP 特定启动说明">
    在 GCP 上，如果构建在 `pnpm install --frozen-lockfile` 期间因 `Killed` 或退出码 137 失败，则 VM 内存不足。使用至少 e2-small，或使用 e2-medium 以获得更可靠的首次构建。

    绑定到 LAN（`OPENCLAW_GATEWAY_BIND=lan`）时，在继续之前配置受信任的浏览器来源：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    如果你更改了 gateway 端口，请将 `18789` 替换为你配置的端口。

  </Step>

  <Step title="从你的笔记本电脑访问">
    创建 SSH 隧道以转发 Gateway 端口：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    在浏览器中打开：

    `http://127.0.0.1:18789/`

    重新打印干净的仪表板链接：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    如果 UI 提示共享密钥认证，请将配置的 token 或
    密码粘贴到控制 UI 设置中。此 Docker 流程默认写入 token；
    如果你将容器配置切换为密码认证，请改用该密码。

    如果控制 UI 显示 `unauthorized` 或 `disconnected (1008): pairing required`，请批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    再次需要共享持久化和更新参考？
    参阅 [Docker VM 运行时](/install/docker-vm-runtime#what-persists-where) 和 [Docker VM 运行时更新](/install/docker-vm-runtime#updates)。

  </Step>
</Steps>

---

## 故障排除

**SSH 连接被拒绝**

SSH 密钥传播在 VM 创建后可能需要 1-2 分钟。等待并重试。

**OS Login 问题**

检查你的 OS Login 配置文件：

```bash
gcloud compute os-login describe-profile
```

确保你的账户具有所需的 IAM 权限（Compute OS Login 或 Compute OS Admin Login）。

**内存不足（OOM）**

如果 Docker 构建因 `Killed` 和退出码 137 失败，则 VM 被 OOM 终止。升级到 e2-small（最低）或 e2-medium（推荐用于可靠的本地构建）：

```bash
# 先停止 VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# 更改机器类型
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# 启动 VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## 服务账户（安全最佳实践）

对于个人使用，你的默认用户账户可以正常工作。

对于自动化或 CI/CD 管道，创建具有最低权限的专用服务账户：

1. 创建服务账户：

   ```bash
   gcloud iam service-accounts create openclaw-deploy \
     --display-name="OpenClaw Deployment"
   ```

2. 授予 Compute Instance Admin 角色（或更窄的自定义角色）：

   ```bash
   gcloud projects add-iam-policy-binding my-openclaw-project \
     --member="serviceAccount:openclaw-deploy@my-openclaw-project.iam.gserviceaccount.com" \
     --role="roles/compute.instanceAdmin.v1"
   ```

避免对自动化使用 Owner 角色。使用最小权限原则。

有关 IAM 角色详情，请参阅 [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles)。

---

## 下一步

- 设置消息 channel：[Channels](/channels)
- 将本地设备配对为 node：[Nodes](/nodes)
- 配置 Gateway：[Gateway 配置](/gateway/configuration)

## 相关

- [安装概览](/install)
- [Azure](/install/azure)
- [VPS 托管](/vps)
