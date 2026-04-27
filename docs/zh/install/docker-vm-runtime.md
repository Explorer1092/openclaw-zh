---
mmh3_hash: "9ed8fbe0597f6764ca881f767b7bb526"
summary: "适用于长期运行 OpenClaw Gateway 主机的共享 Docker VM 运行时步骤"
read_when:
  - 你正在使用 Docker 在云 VM 上部署 OpenClaw
  - 你需要共享的二进制文件烘焙、持久化和更新流程
title: "Docker VM 运行时"
---

用于基于 VM 的 Docker 安装（如 GCP、Hetzner 和类似 VPS provider）的共享运行时步骤。

## 将所需的二进制文件烘焙到镜像中

在运行中的容器内安装二进制文件是一个陷阱。
在运行时安装的任何内容在重启时都会丢失。

skills 所需的所有外部二进制文件必须在镜像构建时安装。

下面的示例仅显示三个常见的二进制文件：

- `gog` 用于 Gmail 访问
- `goplaces` 用于 Google Places
- `wacli` 用于 WhatsApp

这些是示例，不是完整列表。
你可以使用相同的模式安装任意多个二进制文件。

如果你后来添加依赖其他二进制文件的新 skills，你必须：

1. 更新 Dockerfile
2. 重建镜像
3. 重启容器

**示例 Dockerfile**

```dockerfile
FROM node:24-bookworm

RUN apt-get update && apt-get install -y socat && rm -rf /var/lib/apt/lists/*

# 示例二进制文件 1：Gmail CLI
RUN curl -L https://github.com/steipete/gog/releases/latest/download/gog_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/gog

# 示例二进制文件 2：Google Places CLI
RUN curl -L https://github.com/steipete/goplaces/releases/latest/download/goplaces_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/goplaces

# 示例二进制文件 3：WhatsApp CLI
RUN curl -L https://github.com/steipete/wacli/releases/latest/download/wacli_Linux_x86_64.tar.gz \
  | tar -xz -C /usr/local/bin && chmod +x /usr/local/bin/wacli

# 使用相同模式在下面添加更多二进制文件

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

<Note>
上面的下载 URL 适用于 x86_64 (amd64)。对于基于 ARM 的 VM（例如 Hetzner ARM、GCP Tau T2A），请将下载 URL 替换为每个工具发布页面上相应的 ARM64 变体。
</Note>

## 构建和启动

```bash
docker compose build
docker compose up -d openclaw-gateway
```

如果在 `pnpm install --frozen-lockfile` 期间构建失败并显示 `Killed` 或 `exit code 137`，则 VM 内存不足。
在重试之前使用更大的机器类型。

验证二进制文件：

```bash
docker compose exec openclaw-gateway which gog
docker compose exec openclaw-gateway which goplaces
docker compose exec openclaw-gateway which wacli
```

预期输出：

```
/usr/local/bin/gog
/usr/local/bin/goplaces
/usr/local/bin/wacli
```

验证 Gateway：

```bash
docker compose logs -f openclaw-gateway
```

预期输出：

```
[gateway] listening on ws://0.0.0.0:18789
```

## 持久化位置

OpenClaw 在 Docker 中运行，但 Docker 不是事实来源。
所有长期状态必须在重启、重建和重新启动后仍然存在。

| 组件               | 位置                              | 持久化机制             | 备注                                                            |
| ------------------ | --------------------------------- | ---------------------- | --------------------------------------------------------------- |
| Gateway 配置       | `/home/node/.openclaw/`           | 主机卷挂载             | 包括 `openclaw.json`、`.env`                                    |
| Model 认证配置文件 | `/home/node/.openclaw/agents/`    | 主机卷挂载             | `agents/<agentId>/agent/auth-profiles.json`（OAuth、API 密钥）  |
| Skill 配置         | `/home/node/.openclaw/skills/`    | 主机卷挂载             | Skill 级别状态                                                  |
| Agent 工作区       | `/home/node/.openclaw/workspace/` | 主机卷挂载             | 代码和 agent 产出物                                             |
| WhatsApp Session   | `/home/node/.openclaw/`           | 主机卷挂载             | 保留二维码登录                                                  |
| Gmail keyring      | `/home/node/.openclaw/`           | 主机卷挂载 + 密码      | 需要 `GOG_KEYRING_PASSWORD`                                     |
| 外部二进制文件     | `/usr/local/bin/`                 | Docker 镜像            | 必须在构建时烘焙                                                |
| Node 运行时        | 容器文件系统                      | Docker 镜像            | 每次镜像构建时重建                                              |
| OS 软件包          | 容器文件系统                      | Docker 镜像            | 不要在运行时安装                                                |
| Docker 容器        | 临时                              | 可重启                 | 可以安全销毁                                                    |

## 更新

要在 VM 上更新 OpenClaw：

```bash
git pull
docker compose build
docker compose up -d
```

## 相关

- [Docker](/install/docker)
- [Podman](/install/podman)
- [ClawDock](/install/clawdock)
