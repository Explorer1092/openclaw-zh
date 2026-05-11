---
mmh3_hash: "cb5eaffed0179a2cdc88fd6dd86bad89"
summary: "在 GCP Compute Engine VM（Docker）上全天候运行 OpenClaw Gateway，具有持久状态"
read_when:
  - 你希望 OpenClaw 在 GCP 上全天候运行
  - 你希望在自己的 VM 上拥有生产级别的始终在线 Gateway
  - 你想完全控制持久化、二进制文件和重启行为
title: "GCP"
---

使用 Docker 在 GCP Compute Engine VM 上运行持久化 OpenClaw Gateway，具有持久状态、内置二进制文件和安全的重启行为。

如果你想要"约 $5-12/月全天候运行 OpenClaw"，这是 Google Cloud 上一个可靠的方案。
定价因机器类型和区域而异；选择适合你工作负载的最小 VM，如果遇到 OOM 则升级。

## 我们在做什么（简单说明）？

- 创建 GCP 项目并启用计费
- 创建 Compute Engine VM
- 安装 Docker（隔离的应用运行时）
- 在 Docker 中启动 OpenClaw Gateway
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（在重启/重建后仍然存在）
- 通过 SSH 隧道从笔记本电脑访问控制界面

挂载的 `~/.openclaw` 状态包括 `openclaw.json`、每个 agent 的
`agents/<agentId>/agent/auth-profiles.json` 和 `.env`。

Gateway 可以通过以下方式访问：

- 从笔记本电脑进行 SSH 端口转发
- 如果你自己管理防火墙和令牌，则直接暴露端口

本指南在 GCP Compute Engine 上使用 Debian。
Ubuntu 也适用；相应地映射软件包。
有关通用 Docker 流程，请参阅 [Docker](/install/docker)。

---

## 快速路径（有经验的操作员）

1. 创建 GCP 项目 + 启用 Compute Engine API
2. 创建 Compute Engine VM（e2-small，Debian 12，20GB）
3. SSH 进入 VM
4. 安装 Docker
5. 克隆 OpenClaw 仓库
6. 创建持久化主机目录
7. 配置 `.env` 和 `docker-compose.yml`
8. 烘焙所需二进制文件、构建并启动

---

## 你需要什么

- GCP 账户（e2-micro 符合免费套餐条件）
- 已安装 gcloud CLI（或使用 Cloud Console）
- 从笔记本电脑的 SSH 访问
- 基本熟悉 SSH + 复制/粘贴
- 约 20-30 分钟
- Docker 和 Docker Compose
- 模型认证凭据
- 可选的 provider 凭据
  - WhatsApp QR
  - Telegram bot 令牌
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

    在 [https://console.cloud.google.com/billing](https://console.cloud.google.com/billing) 启用计费（Compute Engine 所必需）。

    启用 Compute Engine API：

    ```bash
    gcloud services enable compute.googleapis.com
    ```

    **Console：**

    1. 进入 IAM & Admin > Create Project
    2. 命名并创建
    3. 为项目启用计费
    4. 导航到 APIs & Services > Enable APIs > 搜索"Compute Engine API"> 启用

  </Step>

  <Step title="创建 VM">
    **机器类型：**

    | 类型      | 规格                       | 费用      | 备注                                        |
    | --------- | -------------------------- | --------- | ------------------------------------------- |
    | e2-medium | 2 vCPU，4GB RAM            | 约 $25/月 | 本地 Docker 构建最可靠                      |
    | e2-small  | 2 vCPU，2GB RAM            | 约 $12/月 | Docker 构建的最低建议                       |
    | e2-micro  | 2 vCPU（共享），1GB RAM    | 免费套餐  | Docker 构建经常因 OOM 失败（exit 137）       |

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

    1. 进入 Compute Engine > VM instances > Create instance
    2. 名称：`openclaw-gateway`
    3. 区域：`us-central1`，可用区：`us-central1-a`
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

    在 Compute Engine 控制面板中点击 VM 旁边的"SSH"按钮。

    注意：SSH 密钥传播在 VM 创建后可能需要 1-2 分钟。如果连接被拒绝，请等待并重试。

  </Step>

  <Step title="安装 Docker（在 VM 上）">
    ```bash
    sudo apt-get update
    sudo apt-get install -y git curl ca-certificates
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    ```

    登出并重新登录以使组更改生效：

    ```bash
    exit
    ```

    然后重新 SSH：

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

    本指南假设你将构建自定义镜像以保证二进制文件持久化。

  </Step>

  <Step title="创建持久化主机目录">
    Docker 容器是临时的。
    所有长期存在的状态必须存储在主机上。

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

    如果你想通过 `.env` 管理稳定的 gateway 令牌，请设置 `OPENCLAW_GATEWAY_TOKEN`；
    否则在依赖重启后的客户端之前配置 `gateway.auth.token`。如果两个来源都不存在，
    OpenClaw 在该次启动时使用仅运行时令牌。生成密钥环密码并粘贴到 `GOG_KEYRING_PASSWORD` 中：

    ```bash
    openssl rand -hex 32
    ```

    **不要提交此文件。**

    此 `.env` 文件用于容器/运行时环境（如 `OPENCLAW_GATEWAY_TOKEN`）。
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
          # 建议：在 VM 上保持 Gateway 仅绑定到 loopback；通过 SSH 隧道访问。
          # 要公开暴露，请删除 `127.0.0.1:` 前缀并相应地配置防火墙。
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

    `--allow-unconfigured` 仅用于引导便利，不是正确 gateway 配置的替代品。仍需设置认证（`gateway.auth.token` 或密码）并为你的部署使用安全的绑定设置。

  </Step>

  <Step title="共享 Docker VM 运行时步骤">
    使用共享运行时指南进行常见 Docker 主机流程：

    - [将所需二进制文件烘焙到镜像中](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
    - [构建并启动](/install/docker-vm-runtime#build-and-launch)
    - [什么会在哪里持久化](/install/docker-vm-runtime#what-persists-where)
    - [更新](/install/docker-vm-runtime#updates)

  </Step>

  <Step title="GCP 特定启动说明">
    在 GCP 上，如果在 `pnpm install --frozen-lockfile` 期间构建以 `Killed` 或 `exit code 137` 失败，则 VM 内存不足。使用最低 `e2-small`，或 `e2-medium` 以获得更可靠的首次构建。

    绑定到 LAN（`OPENCLAW_GATEWAY_BIND=lan`）时，请在继续之前配置受信任的浏览器 origin：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
    ```

    如果你更改了 gateway 端口，请将 `18789` 替换为你配置的端口。

  </Step>

  <Step title="从笔记本电脑访问">
    创建 SSH 隧道以转发 Gateway 端口：

    ```bash
    gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
    ```

    在浏览器中打开：

    `http://127.0.0.1:18789/`

    重新打印干净的 dashboard 链接：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

    如果 UI 提示共享密钥认证，请将配置的令牌或密码粘贴到控制界面设置中。
    此 Docker 流程默认写入令牌；如果你将容器配置切换为密码认证，请改用该密码。

    如果控制界面显示 `unauthorized` 或 `disconnected (1008): pairing required`，请批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    再次需要共享持久化和更新参考？
    请参阅 [Docker VM 运行时](/install/docker-vm-runtime#what-persists-where) 和 [Docker VM 运行时更新](/install/docker-vm-runtime#updates)。

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

如果 Docker 构建以 `Killed` 和 `exit code 137` 失败，VM 被 OOM 终止。升级到 e2-small（最低）或 e2-medium（推荐用于可靠的本地构建）：

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

个人使用时，你的默认用户账户就够了。

对于自动化或 CI/CD 管道，请创建具有最小权限的专用服务账户：

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

避免在自动化中使用 Owner 角色。使用最小权限原则。

有关 IAM 角色详细信息，请参阅 [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles)。

---

## 后续步骤

- 设置消息 channel：[Channels](/channels)
- 将本地设备配对为 node：[Nodes](/nodes)
- 配置 Gateway：[Gateway 配置](/gateway/configuration)

## 相关

- [安装概览](/install)
- [Azure](/install/azure)
- [VPS 托管](/vps)
