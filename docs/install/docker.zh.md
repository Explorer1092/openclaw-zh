---
mmh3_hash: "a935555fa117ac8b7940b1ae50d4d50b"
summary: "OpenClaw 的可选 Docker 设置和入门"
read_when:
  - 你想要容器化网关而不是本地安装
  - 你正在验证 Docker 流程
---

# Docker (可选)

Docker 是 **可选的**。仅当你想要容器化网关或验证 Docker 流程时才使用它。

## Docker 适合我吗？

- **是**：你想要一个隔离的、一次性的网关环境，或者想在没有本地安装的主机上运行 OpenClaw。
- **否**：你在自己的机器上运行，只想要最快的开发循环。请改用正常的安装流程。
- **沙盒说明**：智能体沙盒也使用 Docker，但它 **不** 要求完整的网关在 Docker 中运行。参见 [沙盒](/gateway/sandboxing)。

本指南涵盖：
- 容器化网关 (Docker 中的完整 OpenClaw)
- 每会话智能体沙盒 (主机网关 + Docker 隔离的智能体工具)

沙盒详情：[沙盒](/gateway/sandboxing)

## 要求

- Docker Desktop (或 Docker Engine) + Docker Compose v2
- 足够的磁盘空间用于镜像 + 日志

## 容器化网关 (Docker Compose)

### 快速开始 (推荐)

从仓库根目录：

```bash
./docker-setup.sh
```

此脚本：
- 构建网关镜像
- 运行入门向导
- 打印可选的提供商设置提示
- 通过 Docker Compose 启动网关
- 生成网关令牌并将其写入 `.env`

可选环境变量：
- `OPENCLAW_DOCKER_APT_PACKAGES` — 在构建期间安装额外的 apt 包
- `OPENCLAW_EXTRA_MOUNTS` — 添加额外的主机绑定挂载
- `OPENCLAW_HOME_VOLUME` — 在命名卷中持久化 `/home/node`

完成后：
- 在浏览器中打开 `http://127.0.0.1:18789/`。
- 将令牌粘贴到控制界面 (设置 → 令牌)。

它在主机上写入配置/工作区：
- `~/.openclaw/`
- `~/.openclaw/workspace`

在 VPS 上运行？参见 [Hetzner (Docker VPS)](/platforms/hetzner)。

### 手动流程 (compose)

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm openclaw-cli onboard
docker compose up -d openclaw-gateway
```

### 额外挂载 (可选)

如果你想将额外的主机目录挂载到容器中，请在运行 `docker-setup.sh` 之前设置 `OPENCLAW_EXTRA_MOUNTS`。这接受逗号分隔的 Docker 绑定挂载列表，并通过生成 `docker-compose.extra.yml` 将它们应用于 `openclaw-gateway` 和 `openclaw-cli`。

示例：

```bash
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

注意：
- 路径必须在 macOS/Windows 上与 Docker Desktop 共享。
- 如果你编辑 `OPENCLAW_EXTRA_MOUNTS`，请重新运行 `docker-setup.sh` 以重新生成额外的 compose 文件。
- `docker-compose.extra.yml` 是生成的。不要手动编辑它。

### 持久化整个容器 home (可选)

如果你希望 `/home/node` 在容器重建期间持久存在，请通过 `OPENCLAW_HOME_VOLUME` 设置命名卷。这会创建一个 Docker 卷并将其挂载在 `/home/node`，同时保留标准配置/工作区绑定挂载。这里使用命名卷（不是绑定路径）；对于绑定挂载，使用 `OPENCLAW_EXTRA_MOUNTS`。

示例：

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
./docker-setup.sh
```

你可以将其与额外挂载结合使用：

```bash
export OPENCLAW_HOME_VOLUME="openclaw_home"
export OPENCLAW_EXTRA_MOUNTS="$HOME/.codex:/home/node/.codex:ro,$HOME/github:/home/node/github:rw"
./docker-setup.sh
```

注意：
- 如果你更改 `OPENCLAW_HOME_VOLUME`，请重新运行 `docker-setup.sh` 以重新生成额外的 compose 文件。
- 命名卷会一直持续到使用 `docker volume rm <name>` 删除为止。

### 安装额外的 apt 包 (可选)

如果你需要镜像内的系统包（例如，构建工具或媒体库），请在运行 `docker-setup.sh` 之前设置 `OPENCLAW_DOCKER_APT_PACKAGES`。
这会在镜像构建期间安装这些包，因此即使容器被删除，它们也会持久存在。

示例：

```bash
export OPENCLAW_DOCKER_APT_PACKAGES="ffmpeg build-essential"
./docker-setup.sh
```

注意：
- 这接受空格分隔的 apt 包名称列表。
- 如果你更改 `OPENCLAW_DOCKER_APT_PACKAGES`，请重新运行 `docker-setup.sh` 以重建镜像。

### 更快的重建 (推荐)

为了加速重建，请排序你的 Dockerfile，以便缓存依赖层。
这避免了重新运行 `pnpm install`，除非锁文件更改：

```dockerfile
FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# Cache dependencies unless package metadata changes
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

### 频道设置 (可选)

使用 CLI 容器配置频道，然后如果需要，重启网关。

WhatsApp (QR):
```bash
docker compose run --rm openclaw-cli channels login
```

Telegram (机器人令牌):
```bash
docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"
```

Discord (机器人令牌):
```bash
docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
```

文档：[WhatsApp](/channels/whatsapp), [Telegram](/channels/telegram), [Discord](/channels/discord)

### 健康检查

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### E2E 冒烟测试 (Docker)

```bash
scripts/e2e/onboard-docker.sh
```

### QR 导入冒烟测试 (Docker)

```bash
pnpm test:docker:qr
```

### 说明

- 网关绑定默认为 `lan` 供容器使用。
- 网关容器是会话的事实来源 (`~/.openclaw/agents/<agentId>/sessions/`)。

## 智能体沙盒 (主机网关 + Docker 工具)

深入探讨：[沙盒](/gateway/sandboxing)

### 它的作用

当启用 `agents.defaults.sandbox` 时，**非主会话** 在 Docker 容器内运行工具。网关停留在你的主机上，但工具执行是隔离的：
- scope: `"agent"` 默认 (每个智能体一个容器 + 工作区)
- scope: `"session"` 用于每会话隔离
- 挂载在 `/workspace` 的每范围工作区文件夹
- 可选的智能体工作区访问 (`agents.defaults.sandbox.workspaceAccess`)
- 允许/拒绝工具策略 (拒绝优先)
- 入站媒体被复制到活动沙盒工作区 (`media/inbound/*`)，以便工具可以读取（使用 `workspaceAccess: "rw"`，这落在智能体工作区中）

警告：`scope: "shared"` 禁用跨会话隔离。所有会话共享一个容器和一个工作区。

### 每智能体沙盒配置文件 (多智能体)

如果你使用多智能体路由，每个智能体都可以覆盖沙盒 + 工具设置：
`agents.list[].sandbox` 和 `agents.list[].tools` (加上 `agents.list[].tools.sandbox.tools`)。这让你可以在一个网关中运行混合访问级别：
- 完全访问 (个人智能体)
- 只读工具 + 只读工作区 (家庭/工作智能体)
- 无文件系统/shell 工具 (公共智能体)

有关示例、优先级和故障排除，请参见 [多智能体沙盒 & 工具](/multi-agent-sandbox-tools)。

### 默认行为

- 镜像: `openclaw-sandbox:bookworm-slim`
- 每个智能体一个容器
- 智能体工作区访问: `workspaceAccess: "none"` (默认) 使用 `~/.openclaw/sandboxes`
  - `"ro"` 将沙盒工作区保持在 `/workspace` 并将智能体工作区只读挂载在 `/agent` (禁用 `write`/`edit`/`apply_patch`)
  - `"rw"` 将智能体工作区读/写挂载在 `/workspace`
- 自动修剪: 空闲 > 24h 或 年龄 > 7d
- 网络: 默认 `none` (如果需要出口，则显式选择加入)
- 默认允许: `exec`, `process`, `read`, `write`, `edit`, `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- 默认拒绝: `browser`, `canvas`, `nodes`, `cron`, `discord`, `gateway`

### 启用沙盒

如果你计划在 `setupCommand` 中安装包，请注意：
- 默认 `docker.network` 为 `"none"` (无出口)。
- `readOnlyRoot: true` 阻止包安装。
- `user` 必须为 root 才能 `apt-get` (省略 `user` 或设置 `user: "0:0"`)。
当 `setupCommand` (或 docker 配置) 更改时，OpenClaw 自动重新创建容器，除非容器 **最近使用过**（约 5 分钟内）。热容器会记录带有确切 `openclaw sandbox recreate ...` 命令的警告。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared (agent 默认)
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
          idleHours: 24, // 0 禁用空闲修剪
          maxAgeDays: 7  // 0 禁用最大年龄修剪
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

加固旋钮位于 `agents.defaults.sandbox.docker` 下：
`network`, `user`, `pidsLimit`, `memory`, `memorySwap`, `cpus`, `ulimits`,
`seccompProfile`, `apparmorProfile`, `dns`, `extraHosts`。

多智能体：通过 `agents.list[].sandbox.{docker,browser,prune}.*` 覆盖每个智能体的 `agents.defaults.sandbox.{docker,browser,prune}.*`
(当 `agents.defaults.sandbox.scope` / `agents.list[].sandbox.scope` 为 `"shared"` 时忽略)。

### 构建默认沙盒镜像

```bash
scripts/sandbox-setup.sh
```

这将使用 `Dockerfile.sandbox` 构建 `openclaw-sandbox:bookworm-slim`。

### 沙盒通用镜像 (可选)
如果你想要一个带有通用构建工具 (Node, Go, Rust 等) 的沙盒镜像，请构建通用镜像：

```bash
scripts/sandbox-common-setup.sh
```

这将构建 `openclaw-sandbox-common:bookworm-slim`。要使用它：

```json5
{
  agents: { defaults: { sandbox: { docker: { image: "openclaw-sandbox-common:bookworm-slim" } } } }
}
```

### 沙盒浏览器镜像

要在沙盒内运行浏览器工具，请构建浏览器镜像：

```bash
scripts/sandbox-browser-setup.sh
```

这将使用 `Dockerfile.sandbox-browser` 构建 `openclaw-sandbox-browser:bookworm-slim`。容器运行启用了 CDP 的 Chromium 和可选的 noVNC 观察者 (通过 Xvfb 有头运行)。

注意：
- 有头 (Xvfb) 减少了机器人相对于无头模式的拦截。
- 无头模式仍可通过设置 `agents.defaults.sandbox.browser.headless=true` 使用。
- 不需要完整的桌面环境 (GNOME)；Xvfb 提供显示。

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

启用时，智能体接收：
- 沙盒浏览器控制 URL (用于 `browser` 工具)
- noVNC URL (如果已启用且 headless=false)

切记：如果你对工具使用白名单，请添加 `browser`（并将其从拒绝中删除），否则工具将被阻止。
修剪规则 (`agents.defaults.sandbox.prune`) 也适用于浏览器容器。

### 自定义沙盒镜像

构建你自己的镜像并将配置指向它：

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

### 工具策略 (允许/拒绝)

- `deny` 优先于 `allow`。
- 如果 `allow` 为空：所有工具（除了拒绝的）都可用。
- 如果 `allow` 非空：仅 `allow` 中的工具可用（减去拒绝的）。

### 修剪策略

两个旋钮：
- `prune.idleHours`: 删除 X 小时未使用的容器 (0 = 禁用)
- `prune.maxAgeDays`: 删除早于 X 天的容器 (0 = 禁用)

示例：
- 保持繁忙会话但限制生命周期：
  `idleHours: 24`, `maxAgeDays: 7`
- 从不修剪：
  `idleHours: 0`, `maxAgeDays: 0`

### 安全说明

- 硬墙仅适用于 **工具** (exec/read/write/edit/apply_patch)。
- 默认情况下阻止像 browser/camera/canvas 这样的仅主机工具。
- 在沙盒中允许 `browser` 会 **破坏隔离**（浏览器在主机上运行）。

## 故障排除

- 镜像丢失：使用 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) 构建或设置 `agents.defaults.sandbox.docker.image`。
- 容器未运行：它会根据需要为每个会话自动创建。
- 沙盒中的权限错误：将 `docker.user` 设置为与挂载的工作区所有权匹配的 UID:GID（或 chown 工作区文件夹）。
- 未找到自定义工具：OpenClaw 使用 `sh -lc`（登录 shell）运行命令，这会来源 `/etc/profile` 并可能重置 PATH。设置 `docker.env.PATH` 以预置你的自定义工具路径（例如 `/custom/bin:/usr/local/share/npm-global/bin`），或在 Dockerfile 中添加脚本到 `/etc/profile.d/` 下。
