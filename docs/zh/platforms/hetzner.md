---
title: "在 Hetzner 上运行 OpenClaw (Docker, 生产 VPS 指南)"
sidebarTitle: "Hetzner"
mmh3_hash: "e3ea001f086d5c901020d44ec1f44933"
summary: "在廉价的 Hetzner VPS(Docker)上全天候运行 OpenClaw 网关,具有持久状态和内置二进制文件"
read_when: ["你想在云 VPS 上全天候运行 OpenClaw(而不是在你的笔记本电脑上)","你想要一个生产级、始终在线的网关在自己的 VPS 上","你想要完全控制持久化、二进制文件和重启行为","你在 Hetzner 或类似提供商上的 Docker 中运行 OpenClaw"]
---

# 在 Hetzner 上运行 OpenClaw (Docker, 生产 VPS 指南)

## 目标
使用 Docker 在 Hetzner VPS 上运行持久的 OpenClaw 网关,具有持久状态、内置二进制文件和安全重启行为。

如果你想要"每月约 5 美元的全天候 OpenClaw",这是最简单可靠的设置。
Hetzner 定价会变化;选择最小的 Debian/Ubuntu VPS,如果遇到 OOM 则扩容。

## 我们在做什么(简单术语)?

- 租用一个小型 Linux 服务器(Hetzner VPS)
- 安装 Docker(隔离的应用运行时)
- 在 Docker 中启动 OpenClaw 网关
- 在主机上持久化 `~/.openclaw` + `~/.openclaw/workspace`(重启/重建后保留)
- 通过 SSH 隧道从你的笔记本电脑访问控制 UI

网关可以通过以下方式访问:
- 从你的笔记本电脑进行 SSH 端口转发
- 如果你自己管理防火墙和令牌,则直接端口暴露

本指南假设在 Hetzner 上使用 Ubuntu 或 Debian。
如果你在其他 Linux VPS 上,请相应地映射包。
对于通用 Docker 流程,请参阅 [Docker](/install/docker)。

---

## 快速路径(有经验的操作员)

1) 配置 Hetzner VPS  
2) 安装 Docker  
3) 克隆 OpenClaw 仓库  
4) 创建持久主机目录  
5) 配置 `.env` 和 `docker-compose.yml`  
6) 将所需二进制文件烘焙到镜像中  
7) `docker compose up -d`  
8) 验证持久化和网关访问

---

## 你需要什么

- 具有 root 访问权限的 Hetzner VPS  
- 从你的笔记本电脑的 SSH 访问  
- 对 SSH + 复制/粘贴的基本熟悉  
- 约 20 分钟  
- Docker 和 Docker Compose  
- 模型认证凭据  
- 可选的提供商凭据  
  - WhatsApp 二维码  
  - Telegram 机器人令牌  
  - Gmail OAuth  

---

## 1) 配置 VPS

在 Hetzner 中创建 Ubuntu 或 Debian VPS。

以 root 身份连接:

```bash
ssh root@YOUR_VPS_IP
```

本指南假设 VPS 是有状态的。
不要将其视为一次性基础设施。

---

## 2) 安装 Docker(在 VPS 上)

```bash
apt-get update
apt-get install -y git curl ca-certificates
curl -fsSL https://get.docker.com | sh
```

验证:

```bash
docker --version
docker compose version
```

---

## 3) 克隆 OpenClaw 仓库

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
```

本指南假设你将构建自定义镜像以保证二进制持久化。

---

## 4) 创建持久主机目录

Docker 容器是短暂的。
所有长期状态必须位于主机上。

```bash
mkdir -p /root/.openclaw
mkdir -p /root/.openclaw/workspace

# 将所有权设置为容器用户(uid 1000):
chown -R 1000:1000 /root/.openclaw
chown -R 1000:1000 /root/.openclaw/workspace
```

---

## 5) 配置环境变量

在仓库根目录创建 `.env`。

```bash
OPENCLAW_IMAGE=openclaw:latest
OPENCLAW_GATEWAY_TOKEN=change-me-now
OPENCLAW_GATEWAY_BIND=lan
OPENCLAW_GATEWAY_PORT=18789

OPENCLAW_CONFIG_DIR=/root/.openclaw
OPENCLAW_WORKSPACE_DIR=/root/.openclaw/workspace

GOG_KEYRING_PASSWORD=change-me-now
XDG_CONFIG_HOME=/home/node/.openclaw
```

生成强密钥:

```bash
openssl rand -hex 32
```

**不要提交此文件。**

---

## 6) Docker Compose 配置

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
      # 推荐:在 VPS 上保持网关仅环回;通过 SSH 隧道访问。
      # 要公开暴露它,删除 `127.0.0.1:` 前缀并相应地设置防火墙。
      - "127.0.0.1:${OPENCLAW_GATEWAY_PORT}:18789"

      # 可选:仅当你针对此 VPS 运行 iOS/Android 节点并需要 Canvas 主机时。
      # 如果你公开暴露这个,阅读 /gateway/security 并相应地设置防火墙。
      # - "18793:18793"
    command:
      [
        "node",
        "dist/index.js",
        "gateway",
        "--bind",
        "${OPENCLAW_GATEWAY_BIND}",
        "--port",
        "${OPENCLAW_GATEWAY_PORT}"
      ]
```

---

## 7) 将所需二进制文件烘焙到镜像中(关键)

在运行的容器内安装二进制文件是一个陷阱。
运行时安装的任何内容都将在重启时丢失。

技能所需的所有外部二进制文件必须在镜像构建时安装。

下面的示例仅显示三个常见二进制文件:
- `gog` 用于 Gmail 访问
- `goplaces` 用于 Google Places
- `wacli` 用于 WhatsApp

这些是示例,不是完整列表。
你可以使用相同的模式安装所需的任意多个二进制文件。

如果你稍后添加依赖于其他二进制文件的新技能,你必须:
1. 更新 Dockerfile
2. 重建镜像
3. 重启容器

**示例 Dockerfile**

```dockerfile
FROM node:22-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# 示例二进制文件 1: Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz   | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# 示例二进制文件 2: Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz   | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# 示例二进制文件 3: WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz   | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# 使用相同的模式在下面添加更多二进制文件

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN corepack enable
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

---

## 8) 构建和启动

```bash
docker compose build
docker compose up -d openclaw-gateway
```

验证二进制文件:

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

预期输出:

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

---

## 9) 验证网关

```bash
docker compose logs -f openclaw-gateway
```

成功:

```
[gateway] listening on ws://0.0.0.0:18789
```

从你的笔记本电脑:

```bash
ssh -N -L 18789:127.0.0.1:18789 root@YOUR_VPS_IP
```

打开:

`http://127.0.0.1:18789/`

粘贴你的网关令牌。

---

## 什么在哪里持久化(真实来源)

OpenClaw 在 Docker 中运行,但 Docker 不是真实来源。
所有长期状态必须在重启、重建和重启后保留。

| 组件 | 位置 | 持久化机制 | 备注 |
|---|---|---|---|
| 网关配置 | `/home/node/.openclaw/` | 主机卷挂载 | 包括 `openclaw.json`、令牌 |
| 模型认证配置文件 | `/home/node/.openclaw/` | 主机卷挂载 | OAuth 令牌、API 密钥 |
| 技能配置 | `/home/node/.openclaw/skills/` | 主机卷挂载 | 技能级别状态 |
| 代理工作区 | `/home/node/.openclaw/workspace/` | 主机卷挂载 | 代码和代理工件 |
| WhatsApp 会话 | `/home/node/.openclaw/` | 主机卷挂载 | 保留二维码登录 |
| Gmail 密钥环 | `/home/node/.openclaw/` | 主机卷 + 密码 | 需要 `GOG_KEYRING_PASSWORD` |
| 外部二进制文件 | `/usr/local/bin/` | Docker 镜像 | 必须在构建时烘焙 |
| Node 运行时 | 容器文件系统 | Docker 镜像 | 每次镜像构建时重建 |
| OS 包 | 容器文件系统 | Docker 镜像 | 不要在运行时安装 |
| Docker 容器 | 临时 | 可重启 | 可以安全销毁 |
