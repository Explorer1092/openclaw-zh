---
mmh3_hash: "8119469c1e34736179346207c6500bef"
title: "Docker (可选)"
sidebarTitle: "Docker"
summary: "OpenClaw 的可选 Docker 设置和引导"
read_when: ["您希望使用容器化网关而非本地安装","您正在验证 Docker 流程"]
---

# Docker (可选)

Docker 是**可选的**。仅在您希望使用容器化网关或验证 Docker 流程时使用。

## Docker 适合我吗?

- **适合**: 您希望使用隔离的、一次性的网关环境,或在不进行本地安装的主机上运行 OpenClaw。
- **不适合**: 您在自己的机器上运行,只想要最快的开发循环。请改用常规安装流程。
- **沙盒注意事项**: 代理沙盒也使用 Docker,但**不**要求完整网关在 Docker 中运行。请参阅[沙盒](/gateway/sandboxing)。

本指南涵盖:

- 容器化网关(Docker 中的完整 OpenClaw)
- 每会话代理沙盒(主机网关 + Docker 隔离的代理工具)

沙盒详情:[沙盒](/gateway/sandboxing)

## 要求

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 镜像构建至少需要 2 GB RAM（在 1 GB 主机上 `pnpm install` 可能因 OOM 被杀死，退出代码 137）
- 足够的磁盘空间用于镜像 + 日志
- 如果在 VPS/公共主机上运行，请查阅[网络暴露安全加固](/gateway/security#04-network-exposure-bind--port--firewall)，特别是 Docker `DOCKER-USER` 防火墙策略。

## 容器化网关（Docker Compose）

### 快速开始（推荐）

<Note>
此处的 Docker 默认值假设绑定模式（`lan`/`loopback`），而不是主机别名。在 `gateway.bind` 中使用绑定模式值（例如 `lan` 或 `loopback`），而不是主机别名如 `0.0.0.0` 或 `localhost`。
</Note>

从仓库根目录:

```bash
./docker-setup.sh
```

此脚本:

- 构建网关镜像
- 运行引导向导
- 打印可选的提供者设置提示
- 通过 Docker Compose 启动网关
- 生成网关令牌并写入 `.env`

可选环境变量:

- `OPENCLAW_IMAGE` — 使用远程镜像而不是本地构建（例如 `ghcr.io/openclaw/openclaw:latest`）
- `OPENCLAW_DOCKER_APT_PACKAGES` — 在构建期间安装额外的 apt 软件包
- `OPENCLAW_EXTENSIONS` — 在构建时预安装扩展依赖项（空格分隔的扩展名称，例如 `diagnostics-otel matrix`）
- `OPENCLAW_EXTRA_MOUNTS` — 添加额外的主机绑定挂载
- `OPENCLAW_HOME_VOLUME` — 在命名卷中持久化 `/home/node`
- `OPENCLAW_SANDBOX` — 选择启用 Docker Gateway 沙盒引导。仅显式真值才能启用：`1`、`true`、`yes`、`on`
- `OPENCLAW_INSTALL_DOCKER_CLI` — 本地镜像构建的构建参数透传（`1` 在镜像中安装 Docker CLI）。当 `OPENCLAW_SANDBOX=1` 用于本地构建时，`docker-setup.sh` 会自动设置此项。
- `OPENCLAW_DOCKER_SOCKET` — 覆盖 Docker socket 路径（默认：`DOCKER_HOST=unix://...` 路径，否则为 `/var/run/docker.sock`）
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` — 紧急解除：允许 CLI/引导客户端路径访问受信任私有网络的 `ws://` 目标（默认仅限回环）
- `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` — 当您需要 WebGL/3D 兼容性时，禁用容器浏览器硬化标志 `--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`。
- `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` — 当浏览器流程需要扩展时保持扩展启用（默认在沙盒浏览器中禁用扩展）。
- `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` — 设置 Chromium 渲染器进程限制；设置为 `0` 可跳过该标志并使用 Chromium 默认行为。

完成后:

- 在浏览器中打开 `http://127.0.0.1:18789/`。
- 将令牌粘贴到控制 UI（设置 → 令牌）。
- 再次需要 URL？运行 `docker compose run --rm openclaw-cli dashboard --no-open`。

在 VPS 上运行？请参阅 [Hetzner (Docker VPS)](/install/hetzner)。

### 为 Docker Gateway 启用代理沙盒（选择启用）

`docker-setup.sh` 还可以为 Docker 部署引导 `agents.defaults.sandbox.*`。

通过以下方式启用：

```bash
export OPENCLAW_SANDBOX=1
./docker-setup.sh
```

自定义 socket 路径（例如无根 Docker）：

```bash
export OPENCLAW_SANDBOX=1
export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
./docker-setup.sh
```

注意：

- 脚本仅在沙盒先决条件通过后才挂载 `docker.sock`。
- 如果沙盒设置无法完成，脚本会将 `agents.defaults.sandbox.mode` 重置为 `off`，以避免重新运行时出现陈旧/损坏的沙盒配置。
- 如果 `Dockerfile.sandbox` 缺失，脚本会打印警告并继续；如果需要，使用 `scripts/sandbox-setup.sh` 构建 `openclaw-sandbox:bookworm-slim`。
- 对于非本地 `OPENCLAW_IMAGE` 值，镜像必须已包含 Docker CLI 支持以执行沙盒。

### 自动化/CI（非交互式，无 TTY 噪音）

对于脚本和 CI，使用 `-T` 禁用 Compose 伪 TTY 分配：

```bash
docker compose run -T --rm openclaw-cli gateway probe
docker compose run -T --rm openclaw-cli devices list --json
```

如果您的自动化未导出 Claude session 变量，在 `docker-compose.yml` 中将它们保持未设置现在默认解析为空值，以避免重复的"变量未设置"警告。

### 共享网络安全说明（CLI + Gateway）

`openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，以便 CLI 命令可以在 Docker 中可靠地通过 `127.0.0.1` 访问 Gateway。

将此视为共享信任边界：回环绑定不是这两个容器之间的隔离。如果需要更强的隔离，请从单独的容器/主机网络路径运行命令，而不是使用捆绑的 `openclaw-cli` 服务。

为了减少 CLI 进程被入侵时的影响，compose 配置在 `openclaw-cli` 上删除了 `NET_RAW`/`NET_ADMIN` 并启用了 `no-new-privileges`。

### 使用远程镜像（跳过本地构建）

官方预构建镜像发布在：

- [GitHub Container Registry 包](https://github.com/openclaw/openclaw/pkgs/container/openclaw)

使用镜像名称 `ghcr.io/openclaw/openclaw`（不要使用名称相似的 Docker Hub 镜像）。

常用标签：

- `main` — 来自 `main` 的最新构建
- `<version>` — 发布标签构建（例如 `2026.2.26`）
- `latest` — 最新稳定发布标签

### 基础镜像元数据

主要 Docker 镜像目前使用：

- `node:22-bookworm`

Docker 镜像现在发布 OCI 基础镜像注释（sha256 为示例）：

- `org.opencontainers.image.base.name=docker.io/library/node:22-bookworm`
- `org.opencontainers.image.base.digest=sha256:cd7bcd2e7a1e6f72052feb023c7f6b722205d3fcab7bbcbd2d1bfdab10b1e935`
- `org.opencontainers.image.source=https://github.com/openclaw/openclaw`
- `org.opencontainers.image.url=https://openclaw.ai`
- `org.opencontainers.image.documentation=https://docs.openclaw.ai/install/docker`
- `org.opencontainers.image.licenses=MIT`
- `org.opencontainers.image.title=OpenClaw`
- `org.opencontainers.image.description=OpenClaw gateway and CLI runtime container image`
- `org.opencontainers.image.revision=<git-sha>`
- `org.opencontainers.image.version=<tag-or-main>`
- `org.opencontainers.image.created=<rfc3339 timestamp>`

默认情况下，设置脚本从源码构建镜像。要拉取预构建镜像，请在运行脚本前设置 `OPENCLAW_IMAGE`：

```bash
export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
./docker-setup.sh
```

脚本检测到 `OPENCLAW_IMAGE` 不是默认的 `openclaw:local`，将运行 `docker pull` 而不是 `docker build`。其他所有内容（引导、Gateway 启动、令牌生成）的工作方式相同。

`docker-setup.sh` 仍从仓库根目录运行，因为它使用本地的 `docker-compose.yml` 和辅助文件。`OPENCLAW_IMAGE` 跳过本地镜像构建时间；它不会替换 compose/设置工作流。

### Shell 助手（可选）

为了更方便的日常 Docker 管理，请安装 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/shell-helpers/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
```

**添加到您的 shell 配置(zsh)：**

```bash
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

然后使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等。运行 `clawdock-help` 查看所有命令。

请参阅 [`ClawDock` 助手 README](https://github.com/openclaw/openclaw/blob/main/scripts/shell-helpers/README.md) 了解详情。

### 手动流程(compose)

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

注意：从仓库根目录运行 `docker compose ...`。如果启用了
`OPENCLAW_EXTRA_MOUNTS` 或 `OPENCLAW_HOME_VOLUME`，设置脚本会写入
`docker-compose.extra.yml`；在其他地方运行 Compose 时请包含它：

```bash
docker compose -f docker-compose.yml -f docker-compose.extra.yml <command>
```

### 控制 UI 令牌 + 配对(Docker)

如果看到"unauthorized"或"disconnected (1008): pairing required"，请获取新的
仪表板链接并批准浏览器设备：

```bash
docker compose run --rm openclaw-cli dashboard --no-open
docker compose run --rm openclaw-cli devices list
docker compose run --rm openclaw-cli devices approve <requestId>
```

更多详情：[Dashboard](/web/dashboard)、[Devices](/cli/devices)。

### 额外挂载(可选)

如果要将额外的主机目录挂载到容器中，请在运行 `docker-setup.sh` 之前设置
`OPENCLAW_EXTRA_MOUNTS`。这接受逗号分隔的 Docker 绑定挂载列表，并通过生成
`docker-compose.extra.yml` 将它们应用于 `openclaw-gateway` 和 `openclaw-cli`。

示例:

```bash
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

注意:

- 路径必须在 macOS/Windows 上与 Docker Desktop 共享。
- 每个条目必须是 `source:target[:options]`，不含空格、制表符或换行符。
- 如果编辑 `OPENCLAW_EXTRA_MOUNTS`，请重新运行 `docker-setup.sh` 以重新生成
  额外的 compose 文件。
- `docker-compose.extra.yml` 是生成的。不要手动编辑它。

### 持久化整个容器主目录(可选)

如果希望 `/home/node` 在容器重新创建后持久化，请通过 `OPENCLAW_HOME_VOLUME` 设置命名
卷。这会创建一个 Docker 卷并将其挂载到 `/home/node`，同时保留标准的配置/工作空间绑定挂载。
此处使用命名卷(不是绑定路径)；对于绑定挂载，使用 `OPENCLAW_EXTRA_MOUNTS`。

示例:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

您可以将其与额外挂载结合使用:

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

注意:

- 命名卷必须匹配 `^[A-Za-z0-9][A-Za-z0-9_.-]*$`。
- 如果更改 `OPENCLAW_HOME_VOLUME`，请重新运行 `docker-setup.sh` 以重新生成
  额外的 compose 文件。
- 命名卷会持久化，直到使用 `docker volume rm <name>` 删除。

### 安装额外的 apt 软件包(可选)

如果需要镜像中的系统软件包(例如构建工具或媒体库)，请在运行 `docker-setup.sh` 之前设置
`OPENCLAW_DOCKER_APT_PACKAGES`。这会在镜像构建期间安装软件包，因此即使删除容器它们也会持久化。

示例:

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential"
./docker-setup.sh
```

注意:

- 这接受空格分隔的 apt 软件包名称列表。
- 如果更改 `OPENCLAW_DOCKER_APT_PACKAGES`，请重新运行 `docker-setup.sh` 以重建镜像。

### 预安装扩展依赖项（可选）

带有自己 `package.json` 的扩展（例如 `diagnostics-otel`、`matrix`、`msteams`）在首次加载时安装其 npm 依赖项。要将这些依赖项烘焙到镜像中，请在运行 `docker-setup.sh` 之前设置 `OPENCLAW_EXTENSIONS`：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel matrix"
./docker-setup.sh
```

或直接构建时：

```bash
docker build --build-arg OPENCLAW_EXTENSIONS="diagnostics-otel matrix" .
```

注意：

- 这接受扩展目录名称的空格分隔列表（在 `extensions/` 下）。
- 只有带有 `package.json` 的扩展才受影响；没有 `package.json` 的轻量级插件会被忽略。
- 如果更改 `OPENCLAW_EXTENSIONS`，请重新运行 `docker-setup.sh` 以重建镜像。

### 高级用户/功能完整容器(选择启用)

默认 Docker 镜像是**安全优先**的，以非 root 的 `node` 用户运行。这减小了攻击面，但意味着：

- 运行时无法安装系统软件包
- 默认不含 Homebrew
- 不捆绑 Chromium/Playwright 浏览器

如果您想要功能更完整的容器，请使用以下选择启用选项：

1. **持久化 `/home/node`**，以便浏览器下载和工具缓存在容器重建后保留：

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

2. **将系统依赖项烘焙到镜像中**(可重复 + 持久)：

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"
./docker-setup.sh
```

3. **不使用 `npx` 安装 Playwright 浏览器**(避免 npm 覆盖冲突)：

```bash
docker compose run --rm openclaw-cli \
  node /app/node_modules/playwright-core/cli.js install chromium
```

如果需要 Playwright 安装系统依赖项，请使用 `OPENCLAW_DOCKER_APT_PACKAGES` 重建镜像，
而不是在运行时使用 `--with-deps`。

4. **持久化 Playwright 浏览器下载**：

- 在 `docker-compose.yml` 中设置 `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright`。
- 通过 `OPENCLAW_HOME_VOLUME` 确保 `/home/node` 持久化，或通过 `OPENCLAW_EXTRA_MOUNTS` 挂载
  `/home/node/.cache/ms-playwright`。

### 权限 + EACCES

镜像以 `node`(uid 1000)运行。如果在 `/home/node/.openclaw` 上看到权限错误，
请确保您的主机绑定挂载由 uid 1000 拥有。

示例(Linux 主机)：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果出于方便选择以 root 运行，您需自行承担安全权衡。

### 更快的重建(推荐)

要加速重建，请对 Dockerfile 进行排序，以便缓存依赖层。
这避免了重新运行 `pnpm install`，除非锁文件更改：

```dockerfile
FROM node:22-bookworm

# 安装 Bun(构建脚本所需)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# 除非包元数据更改，否则缓存依赖项
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
RUN pnpm ui:install
RUN pnpm ui:build

ENV NODE_ENV=production

CMD ["node","dist/index.js"]
```

### 频道设置(可选)

使用 CLI 容器配置频道，然后根据需要重启网关。

WhatsApp(二维码)：

```bash
docker compose run --rm openclaw-cli channels login
```

Telegram(机器人令牌)：

```bash
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"
```

Discord(机器人令牌)：

```bash
docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
```

文档：[WhatsApp](/channels/whatsapp)、[Telegram](/channels/telegram)、[Discord](/channels/discord)

### OpenAI Codex OAuth(无头 Docker)

如果在向导中选择 OpenAI Codex OAuth，它会打开一个浏览器 URL 并尝试在
`http://127.0.0.1:1455/auth/callback` 捕获回调。在 Docker 或无头设置中，该回调
可能会显示浏览器错误。复制您登陆的完整重定向 URL 并将其粘贴回向导以完成身份验证。

### 健康检查

容器探针端点（无需认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz
curl -fsS http://127.0.0.1:18789/readyz
```

别名：`/health` 和 `/ready`。

Docker 镜像包含内置的 `HEALTHCHECK`，在后台 ping `/healthz`。简单来说：Docker 持续检查 OpenClaw 是否仍然响应。如果检查持续失败，Docker 将容器标记为 `unhealthy`，编排系统（Docker Compose 重启策略、Swarm、Kubernetes 等）可以自动重启或替换它。

经过认证的深度健康快照（Gateway + Channels）：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### E2E 冒烟测试（Docker）

```bash
scripts/e2e/onboard-docker.sh
```

### QR 导入冒烟测试（Docker）

```bash
pnpm test:docker:qr
```

### LAN vs 回环（Docker Compose）

`docker-setup.sh` 默认将 `OPENCLAW_GATEWAY_BIND=lan`，以便通过 Docker 端口发布的主机访问 `http://127.0.0.1:18789` 有效。

- `lan`（默认）：主机浏览器 + 主机 CLI 可以访问已发布的 Gateway 端口。
- `loopback`：只有容器网络命名空间内的进程才能直接访问 Gateway；主机已发布的端口访问可能失败。

设置脚本还在引导后固定 `gateway.mode=local`，以便 Docker CLI 命令默认以本地回环为目标。

旧配置说明：在 `gateway.bind` 中使用绑定模式值（`lan` / `loopback` / `custom` / `tailnet` / `auto`），而不是主机别名（`0.0.0.0`、`127.0.0.1`、`localhost`、`::`、`::1`）。

如果您看到 `Gateway target: ws://172.x.x.x:18789` 或来自 Docker CLI 命令的重复 `pairing required` 错误，请运行：

```bash
docker compose run --rm openclaw-cli config set gateway.mode local
docker compose run --rm openclaw-cli config set gateway.bind lan
docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
```

### 注意

- Gateway 绑定默认为 `lan` 用于容器使用（`OPENCLAW_GATEWAY_BIND`）。
- Dockerfile CMD 使用 `--allow-unconfigured`；挂载的配置中 `gateway.mode` 不为 `local` 也会启动。覆盖 CMD 以强制执行守卫。
- Gateway 容器是会话的真实来源（`~/.openclaw/agents/<agentId>/sessions/`）。

## 代理沙盒(主机网关 + Docker 工具)

深入了解:[沙盒](/gateway/sandboxing)

### 它的作用

当启用 `agents.defaults.sandbox` 时，**非主会话**在 Docker 容器内运行工具。网关保留在主机上，但工具执行是隔离的：

- 作用域：默认为 `"agent"`(每个代理一个容器 + 工作空间)
- 作用域：`"session"` 用于每会话隔离
- 每作用域工作空间文件夹挂载在 `/workspace`
- 可选的代理工作空间访问(`agents.defaults.sandbox.workspaceAccess`)
- 允许/拒绝工具策略(拒绝优先)
- 入站媒体被复制到活动沙盒工作空间(`media/inbound/*`)，以便工具可以读取它(使用 `workspaceAccess: "rw"`，这会落在代理工作空间中)

警告：`scope: "shared"` 禁用跨会话隔离。所有会话共享一个容器和一个工作空间。

### 每代理沙盒配置文件(多代理)

如果使用多代理路由，每个代理可以覆盖沙盒 + 工具设置：
`agents.list[].sandbox` 和 `agents.list[].tools`(加上 `agents.list[].tools.sandbox.tools`)。这允许您在一个网关中运行混合访问级别：

- 完全访问(个人代理)
- 只读工具 + 只读工作空间(家庭/工作代理)
- 无文件系统/shell 工具(公共代理)

请参阅[多代理沙盒与工具](/tools/multi-agent-sandbox-tools)以获取示例、优先级和故障排除。

### 默认行为

- 镜像：`openclaw-sandbox:bookworm-slim`
- 每个代理一个容器
- 代理工作空间访问：`workspaceAccess: "none"`(默认)使用 `~/.openclaw/sandboxes`
  - `"ro"` 将沙盒工作空间保留在 `/workspace`，并将代理工作空间只读挂载到 `/agent`(禁用 `write`/`edit`/`apply_patch`)
  - `"rw"` 将代理工作空间读写挂载到 `/workspace`
- 自动清理：空闲 > 24 小时或年龄 > 7 天
- 网络：默认为 `none`（明确选择加入，如果需要出口）
  - `host` 被阻止。
  - `container:<id>` 默认被阻止（命名空间加入风险）。
- 默认允许：`exec`、`process`、`read`、`write`、`edit`、`sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`
- 默认拒绝：`browser`、`canvas`、`nodes`、`cron`、`discord`、`gateway`

### 启用沙盒

如果计划在 `setupCommand` 中安装软件包，请注意：

- 默认 `docker.network` 为 `"none"`（无出口）。
- `docker.network: "host"` 被阻止。
- `docker.network: "container:<id>"` 默认被阻止。
- 紧急解除覆盖：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。
- `readOnlyRoot: true` 阻止软件包安装。
- `user` 必须是 root 才能使用 `apt-get`（省略 `user` 或设置 `user: "0:0"`）。
  OpenClaw 在 `setupCommand`(或 docker 配置)更改时自动重新创建容器，除非容器**最近使用过**(约 5 分钟内)。热容器会记录一条警告，其中包含确切的 `openclaw sandbox recreate ...` 命令。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared(默认为 agent)
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"]
        },
        prune: {
          idleHours: 24, // 0 禁用空闲清理
          maxAgeDays: 7  // 0 禁用最大年龄清理
        }
      }
    }
  },
  tools: {
    sandbox: {
      tools: {
        allow: ["exec", "process", "read", "write", "edit", "sessions_list", "sessions_history", "sessions_send", "sessions_spawn", "session_status"],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"]
      }
    }
  }
}
```

强化旋钮位于 `agents.defaults.sandbox.docker` 下：
`network`、`user`、`pidsLimit`、`memory`、`memorySwap`、`cpus`、`ulimits`、
`seccompProfile`、`apparmorProfile`、`dns`、`extraHosts`、
`dangerouslyAllowContainerNamespaceJoin`（仅限紧急解除）。

多代理：通过 `agents.list[].sandbox.{docker,browser,prune}.*` 覆盖每个代理的 `agents.defaults.sandbox.{docker,browser,prune}.*`
(当 `agents.defaults.sandbox.scope` / `agents.list[].sandbox.scope` 为 `"shared"` 时被忽略)。

### 构建默认沙盒镜像

```bash
scripts/sandbox-setup.sh
```

这使用 `Dockerfile.sandbox` 构建 `openclaw-sandbox:bookworm-slim`。

### 沙盒通用镜像(可选)

如果需要具有通用构建工具(Node、Go、Rust 等)的沙盒镜像，请构建通用镜像：

```bash
scripts/sandbox-common-setup.sh
```

这构建 `openclaw-sandbox-common:bookworm-slim`。要使用它：

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "openclaw-sandbox-common:bookworm-slim" } },
    },
  },
}
```

### 沙盒浏览器镜像

要在沙盒内运行浏览器工具，请构建浏览器镜像：

```bash
scripts/sandbox-browser-setup.sh
```

这使用 `Dockerfile.sandbox-browser` 构建 `openclaw-sandbox-browser:bookworm-slim`。容器运行启用了 CDP 的 Chromium 和可选的 noVNC 观察器(通过 Xvfb 有头)。

注意：

- 有头(Xvfb)比无头减少机器人阻止。
- 仍可以通过设置 `agents.defaults.sandbox.browser.headless=true` 使用无头。
- 不需要完整的桌面环境(GNOME)；Xvfb 提供显示。
- 浏览器容器默认使用专用 Docker 网络(`openclaw-sandbox-browser`)，而不是全局 `bridge`。
- 可选的 `agents.defaults.sandbox.browser.cdpSourceRange` 通过 CIDR 限制容器边缘 CDP 入口(例如 `172.21.0.1/32`)。
- noVNC 观察器访问默认受密码保护；OpenClaw 提供短期观察器令牌 URL，而不是在 URL 中共享原始密码。

使用配置：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        browser: { enabled: true }
      }
    }
  }
}
```

自定义浏览器镜像：

```json5
{
  agents: {
    defaults: {
      sandbox: { browser: { image: "my-openclaw-browser" } }
    }
  }
}
```

启用后，代理接收：

- 沙盒浏览器控制 URL(用于 `browser` 工具)
- noVNC URL(如果启用且 headless=false)

记住：如果对工具使用允许列表，请添加 `browser`(并将其从拒绝中删除)，否则工具仍被阻止。
清理规则(`agents.defaults.sandbox.prune`)也适用于浏览器容器。

### 自定义沙盒镜像

构建您自己的镜像并将配置指向它：

```bash
docker build -t my-openclaw-sbx -f Dockerfile.sandbox .
```

```json5
{
  agents: {
    defaults: {
      sandbox: { docker: { image: "my-openclaw-sbx" } }
    }
  }
}
```

### 工具策略(允许/拒绝)

- `deny` 优先于 `allow`。
- 如果 `allow` 为空：所有工具(除了拒绝的)都可用。
- 如果 `allow` 非空：只有 `allow` 中的工具可用(减去拒绝的)。

### 清理策略

两个旋钮：

- `prune.idleHours`：删除在 X 小时内未使用的容器(0 = 禁用)
- `prune.maxAgeDays`：删除超过 X 天的容器(0 = 禁用)

示例：

- 保留繁忙的会话但限制生命周期：
  `idleHours: 24`、`maxAgeDays: 7`
- 永不清理：
  `idleHours: 0`、`maxAgeDays: 0`

### 安全注意事项

- 硬墙仅适用于**工具**(exec/read/write/edit/apply_patch)。
- 仅主机工具如 browser/camera/canvas 默认被阻止。
- 在沙盒中允许 `browser` **会破坏隔离**(浏览器在主机上运行)。

## 故障排除

- 镜像缺失：使用 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) 构建或设置 `agents.defaults.sandbox.docker.image`。
- 容器未运行：它会根据需要按会话自动创建。
- 沙盒中的权限错误：将 `docker.user` 设置为与挂载的工作空间所有权匹配的 UID:GID(或 chown 工作空间文件夹)。
- 找不到自定义工具：OpenClaw 使用 `sh -lc`(登录 shell)运行命令，它会源 `/etc/profile` 并可能重置 PATH。设置 `docker.env.PATH` 以添加您的自定义工具路径(例如 `/custom/bin:/usr/local/share/npm-global/bin`)，或在 Dockerfile 中的 `/etc/profile.d/` 下添加脚本。
