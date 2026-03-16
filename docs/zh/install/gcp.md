---
mmh3_hash: "c61e2b445ca6acf67136c7480fbe6b4d"
summary: "在 GCP Compute Engine VM（Docker）上全天候运行 OpenClaw Gateway，具有持久状态"
read_when:
  - 您希望 OpenClaw 在 GCP 上全天候运行
  - 您想要生产级、永久在线的 Gateway 在您自己的 VM 上
  - 您希望完全控制持久性、二进制文件和重启行为
title: "GCP"
---

# OpenClaw 在 GCP Compute Engine 上（Docker，生产 VPS 指南）

## 目标

使用 Docker 在 GCP Compute Engine VM 上运行持久的 OpenClaw Gateway，具有持久状态、嵌入的二进制文件和安全的重启行为。

如果您想要"OpenClaw 全天候运行，每月约 $5-12"，这是 Google Cloud 上的可靠设置。定价因机器类型和区域而异；选择适合您工作负载的最小 VM，如果遇到 OOM 则扩展。

## 我们在做什么（简单术语）？

- 创建 GCP 项目并启用计费
- 创建 Compute Engine VM
- 安装 Docker（隔离应用运行时）
- 在 Docker 中启动 OpenClaw Gateway
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`（在重启/重建后保留）
- 通过 SSH 隧道从笔记本电脑访问 Control UI

Gateway 可以通过以下方式访问：

- 从笔记本电脑进行 SSH 端口转发
- 如果您自己管理防火墙和令牌，则直接暴露端口

本指南使用 GCP Compute Engine 上的 Debian。Ubuntu 也可以；相应地映射软件包。对于通用 Docker 流程，请参阅 [Docker](/install/docker)。

---

## 快速路径（经验丰富的操作员）

1. 创建 GCP 项目 + 启用 Compute Engine API
2. 创建 Compute Engine VM（e2-small、Debian 12、20GB）
3. SSH 进入 VM
4. 安装 Docker
5. 克隆 OpenClaw 仓库
6. 创建持久主机目录
7. 配置 `.env` 和 `docker-compose.yml`
8. 烘焙所需的二进制文件，构建并启动

---

## 您需要什么

- GCP 帐户（e2-micro 符合免费套餐资格）
- 已安装 gcloud CLI（或使用 Cloud Console）
- 从笔记本电脑进行 SSH 访问
- 对 SSH + 复制/粘贴的基本舒适度
- 约 20-30 分钟
- Docker 和 Docker Compose
- 模型身份验证凭据
- 可选的 Provider 凭据
  - WhatsApp QR
  - Telegram 机器人令牌
  - Gmail OAuth

---

## 1) 安装 gcloud CLI（或使用 Console）

**选项 A：gcloud CLI**（推荐用于自动化）

从 [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install) 安装

初始化并进行身份验证：

```bash
gcloud init
gcloud auth login
```

**选项 B：Cloud Console**

所有步骤都可以通过 [https://console.cloud.google.com](https://console.cloud.google.com) 的 Web UI 完成

---

## 2) 创建 GCP 项目

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

1. 转到 IAM 和管理 > 创建项目
2. 命名并创建
3. 为项目启用计费
4. 导航到 API 和服务 > 启用 API > 搜索"Compute Engine API" > 启用

---

## 3) 创建 VM

**机器类型：**

| 类型      | 规格                     | 成本             | 注意事项                          |
| --------- | ------------------------ | ---------------- | --------------------------------- |
| e2-medium | 2 vCPU，4GB RAM          | 每月约 $25       | 对于本地 Docker 构建最可靠        |
| e2-small  | 2 vCPU，2GB RAM          | 每月约 $12       | Docker 构建的最低推荐             |
| e2-micro  | 2 vCPU（共享），1GB RAM  | 符合免费套餐资格 | Docker 构建 OOM 频繁（退出 137）  |

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

1. 转到 Compute Engine > VM 实例 > 创建实例
2. 名称：`openclaw-gateway`
3. 区域：`us-central1`，区域：`us-central1-a`
4. 机器类型：`e2-small`
5. 启动磁盘：Debian 12，20GB
6. 创建

---

## 4) SSH 进入 VM

**CLI：**

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a
```

**Console：**

在 Compute Engine 仪表板中点击 VM 旁边的"SSH"按钮。

注意：VM 创建后，SSH 密钥传播可能需要 1-2 分钟。如果连接被拒绝，请等待并重试。

---

## 5) 安装 Docker（在 VM 上）

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

---

## 6) 克隆 OpenClaw 仓库

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

本指南假设您将构建自定义镜像以保证二进制持久性。

---

## 7) 创建持久主机目录

Docker 容器是短暂的。所有长期状态必须位于主机上。

```bash
mkdir -p ~/.openclaw
mkdir -p ~/.openclaw/workspace
```

---

## 8) 配置环境变量

在仓库根目录创建 `.env`。

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/home/$USER/.openclaw
OPENCLAW_WORKSPACE_DIR=/home/$USER/.openclaw/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.openclaw
```

生成强密钥：

```bash
openssl rand -hex 32
```

**不要提交此文件。**

---

## 9) Docker Compose 配置

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
      # 推荐：将 Gateway 保持为 VM 上的仅回环；通过 SSH 隧道访问。
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
      ]
```

---

## 10) 共享 Docker VM 运行时步骤

使用共享运行时指南执行常见 Docker 主机流程：

- [将所需的二进制文件烘焙到镜像中](/install/docker-vm-runtime#bake-required-binaries-into-the-image)
- [构建并启动](/install/docker-vm-runtime#build-and-launch)
- [什么在哪里持久化](/install/docker-vm-runtime#what-persists-where)
- [更新](/install/docker-vm-runtime#updates)

---

## 11) GCP 特定启动注意事项

在 GCP 上，如果构建因 `pnpm install --frozen-lockfile` 期间的 `Killed` 或退出代码 137 而失败，VM 内存不足。至少使用 `e2-small`，或使用 `e2-medium` 以获得更可靠的首次构建。

绑定到 LAN（`OPENCLAW_GATEWAY_BIND=lan`）时，在继续之前配置受信任的浏览器来源：

```bash
docker compose run --rm openclaw-cli config set gateway.controlUi.allowedOrigins '["http://127.0.0.1:18789"]' --strict-json
```

如果更改了 Gateway 端口，请将 `18789` 替换为您配置的端口。

## 12) 从笔记本电脑访问

创建 SSH 隧道以转发 Gateway 端口：

```bash
gcloud compute ssh openclaw-gateway --zone=us-central1-a -- -L 18789:127.0.0.1:18789
```

在浏览器中打开：

`http://127.0.0.1:18789/`

获取新鲜的带令牌仪表板链接：

```bash
docker compose run --rm openclaw-cli dashboard --no-open
```

粘贴该 URL 中的令牌。

如果控制 UI 显示 `unauthorized` 或 `disconnected (1008): pairing required`，请批准浏览器设备：

```bash
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

再次需要共享持久性和更新参考？
请参阅 [Docker VM Runtime](/install/docker-vm-runtime#what-persists-where) 和 [Docker VM Runtime 更新](/install/docker-vm-runtime#updates)。

---

## 故障排除

**SSH 连接被拒绝**

VM 创建后，SSH 密钥传播可能需要 1-2 分钟。等待并重试。

**OS Login 问题**

检查您的 OS Login 配置文件：

```bash
gcloud compute os-login describe-profile
```

确保您的帐户具有所需的 IAM 权限（Compute OS Login 或 Compute OS Admin Login）。

**内存不足（OOM）**

如果 Docker 构建因 `Killed` 和退出代码 137 而失败，VM 被 OOM 杀死。升级到 e2-small（最低）或 e2-medium（推荐用于可靠的本地构建）：

```bash
# 首先停止 VM
gcloud compute instances stop openclaw-gateway --zone=us-central1-a

# 更改机器类型
gcloud compute instances set-machine-type openclaw-gateway \
  --zone=us-central1-a \
  --machine-type=e2-small

# 启动 VM
gcloud compute instances start openclaw-gateway --zone=us-central1-a
```

---

## 服务帐户（安全最佳实践）

对于个人使用，您的默认用户帐户可以正常工作。

对于自动化或 CI/CD 管道，创建具有最小权限的专用服务帐户：

1. 创建服务帐户：

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

有关 IAM 角色详细信息，请参阅 [https://cloud.google.com/iam/docs/understanding-roles](https://cloud.google.com/iam/docs/understanding-roles)。

---

## 后续步骤

- 设置消息 Channel：[Channels](/channels)
- 将本地设备配对为节点：[节点](/nodes)
- 配置 Gateway：[Gateway 配置](/gateway/configuration)
