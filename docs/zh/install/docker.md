---
mmh3_hash: "416757391ed73da264fd4270f5ab1163"
title: "Docker（可选）"
sidebarTitle: "Docker"
summary: "OpenClaw 的可选 Docker 设置和引导"
read_when:
  - 你想要容器化的 Gateway 而非本地安装
  - 你正在验证 Docker 流程
---

# Docker（可选）

Docker 是**可选的**。仅在你想要容器化的 Gateway 或验证 Docker 流程时使用。

## Docker 适合我吗？

- **适合**：你想要隔离的、一次性的 Gateway 环境，或者在没有本地安装的主机上运行 OpenClaw。
- **不适合**：你在自己的机器上运行，只想要最快的开发循环。请改用常规安装流程。
- **沙盒注意事项**：Agent 沙盒也使用 Docker，但**不**要求完整 Gateway 在 Docker 中运行。参阅[沙盒](/gateway/sandboxing)。

## 前置条件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 镜像构建至少需要 2 GB RAM（在 1 GB 主机上 `pnpm install` 可能以退出码 137 被 OOM 杀死）
- 足够的镜像和日志磁盘空间
- 如果在 VPS/公共主机上运行，请查阅[网络暴露安全加固](/gateway/security)，特别是 Docker `DOCKER-USER` 防火墙策略。

## 容器化 Gateway

<Steps>
  <Step title="构建镜像">
    从仓库根目录运行设置脚本：

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地构建 Gateway 镜像。要使用预构建镜像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像发布在 [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常见标签：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成引导">
    设置脚本会自动运行引导。它会：

    - 提示输入提供商 API 密钥
    - 生成 Gateway 令牌并写入 `.env`
    - 通过 Docker Compose 启动 Gateway

    在设置期间，预启动引导和配置写入通过 `openclaw-gateway` 直接运行。`openclaw-cli` 用于 Gateway 容器已存在后运行的命令。

  </Step>

  <Step title="打开控制 UI">
    在浏览器中打开 `http://127.0.0.1:18789/` 并将配置的共享密钥粘贴到设置中。设置脚本默认将令牌写入 `.env`；如果你将容器配置切换为密码认证，则使用该密码。

    需要再次获取 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="配置 Channel（可选）">
    使用 CLI 容器添加消息 Channel：

    ```bash
    # WhatsApp (QR)
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    文档：[WhatsApp](/channels/whatsapp)、[Telegram](/channels/telegram)、[Discord](/channels/discord)

  </Step>
</Steps>

### 手动流程

如果你希望自己运行每个步骤而不使用设置脚本：

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
从仓库根目录运行 `docker compose`。如果你启用了 `OPENCLAW_EXTRA_MOUNTS` 或 `OPENCLAW_HOME_VOLUME`，设置脚本会写入 `docker-compose.extra.yml`；使用 `-f docker-compose.yml -f docker-compose.extra.yml` 包含它。
</Note>

<Note>
由于 `openclaw-cli` 共享 `openclaw-gateway` 的网络命名空间，它是一个启动后工具。在 `docker compose up -d openclaw-gateway` 之前，通过 `openclaw-gateway` 使用 `--no-deps --entrypoint node` 运行引导和设置时配置写入。
</Note>

### 环境变量

设置脚本接受以下可选环境变量：

| 变量                             | 用途                                                        |
| -------------------------------- | ----------------------------------------------------------- |
| `OPENCLAW_IMAGE`                 | 使用远程镜像而不是本地构建                                  |
| `OPENCLAW_DOCKER_APT_PACKAGES`   | 在构建期间安装额外的 apt 包（空格分隔）                     |
| `OPENCLAW_EXTENSIONS`            | 在构建时预安装扩展依赖（空格分隔名称）                      |
| `OPENCLAW_EXTRA_MOUNTS`          | 额外的主机绑定挂载（逗号分隔的 `source:target[:opts]`）     |
| `OPENCLAW_HOME_VOLUME`           | 在命名 Docker 卷中持久化 `/home/node`                       |
| `OPENCLAW_SANDBOX`               | 启用沙盒引导（`1`、`true`、`yes`、`on`）                    |
| `OPENCLAW_DOCKER_SOCKET`         | 覆盖 Docker socket 路径                                     |

### 健康检查

容器探测端点（无需认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 存活性
curl -fsS http://127.0.0.1:18789/readyz     # 就绪性
```

Docker 镜像包含内置的 `HEALTHCHECK`，用于 ping `/healthz`。如果检查持续失败，Docker 会将容器标记为 `unhealthy`，编排系统可以重启或替换它。

需要认证的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与 loopback

`scripts/docker/setup.sh` 默认将 `OPENCLAW_GATEWAY_BIND=lan`，以便主机访问 `http://127.0.0.1:18789` 配合 Docker 端口发布工作。

- `lan`（默认）：主机浏览器和主机 CLI 可以到达发布的 Gateway 端口。
- `loopback`：只有容器网络命名空间内的进程才能直接到达 Gateway。

<Note>
在 `gateway.bind` 中使用绑定模式值（`lan` / `loopback` / `custom` / `tailnet` / `auto`），而不是主机别名如 `0.0.0.0` 或 `127.0.0.1`。
</Note>

### 存储和持久化

Docker Compose 将 `OPENCLAW_CONFIG_DIR` 绑定挂载到 `/home/node/.openclaw`，将 `OPENCLAW_WORKSPACE_DIR` 绑定挂载到 `/home/node/.openclaw/workspace`，以便这些路径在容器替换后仍然存在。

挂载的配置目录是 OpenClaw 保存以下内容的地方：

- `openclaw.json` 用于行为配置
- `agents/<agentId>/agent/auth-profiles.json` 用于存储的提供商 OAuth/API 密钥认证
- `.env` 用于环境变量支持的运行时密钥，如 `OPENCLAW_GATEWAY_TOKEN`

有关 VM 部署的完整持久化详情，请参阅 [Docker VM Runtime - 什么在哪里持久化](/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：** 监视 `media/`、会话 JSONL 文件、`cron/runs/*.jsonl` 和 `/tmp/openclaw/` 下的滚动文件日志。

### Shell 辅助工具（可选）

为了更轻松的日常 Docker 管理，安装 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你从旧的 `scripts/shell-helpers/clawdock-helpers.sh` 原始路径安装了 ClawDock，请重新运行上面的安装命令，以便你的本地辅助文件跟踪新位置。

然后使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等。运行 `clawdock-help` 查看所有命令。参阅 [ClawDock](/install/clawdock) 获取完整辅助指南。

<AccordionGroup>
  <Accordion title="为 Docker Gateway 启用 Agent 沙盒">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    自定义 socket 路径（例如 rootless Docker）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    脚本仅在沙盒先决条件通过后才挂载 `docker.sock`。如果沙盒设置无法完成，脚本会将 `agents.defaults.sandbox.mode` 重置为 `off`。

  </Accordion>

  <Accordion title="自动化 / CI（非交互式）">
    使用 `-T` 禁用 Compose 伪 TTY 分配：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共享网络安全说明">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，因此 CLI 命令可以通过 `127.0.0.1` 到达 Gateway。将此视为共享信任边界。Compose 配置在 `openclaw-cli` 上删除 `NET_RAW`/`NET_ADMIN` 并启用 `no-new-privileges`。
  </Accordion>

  <Accordion title="权限和 EACCES">
    镜像以 `node`（uid 1000）身份运行。如果你在 `/home/node/.openclaw` 上看到权限错误，请确保你的主机绑定挂载归 uid 1000 所有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="更快的重建">
    对 Dockerfile 排序，以便缓存依赖层。这避免了除非 lockfile 改变才重新运行 `pnpm install`：

    ```dockerfile
    FROM node:24-bookworm
    RUN curl -fsSL https://bun.sh/install | bash
    ENV PATH="/root/.bun/bin:${PATH}"
    RUN corepack enable
    WORKDIR /app
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

  </Accordion>

  <Accordion title="高级用户容器选项">
    默认镜像以安全为先，以非 root 的 `node` 身份运行。对于功能更丰富的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **烘焙系统依赖**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安装 Playwright 浏览器**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **持久化浏览器下载**：设置 `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` 并使用 `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（无头 Docker）">
    如果你在向导中选择 OpenAI Codex OAuth，它会打开一个浏览器 URL。在 Docker 或无头设置中，复制你登录的完整重定向 URL 并粘贴回向导以完成认证。
  </Accordion>

  <Accordion title="基础镜像元数据">
    主 Docker 镜像使用 `node:24-bookworm` 并发布 OCI 基础镜像注释，包括 `org.opencontainers.image.base.name`、`org.opencontainers.image.source` 等。参阅 [OCI 镜像注释](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上运行？

参阅 [Hetzner（Docker VPS）](/install/hetzner) 和 [Docker VM Runtime](/install/docker-vm-runtime) 了解共享 VM 部署步骤，包括二进制烘焙、持久化和更新。

## Agent 沙盒

当 `agents.defaults.sandbox` 启用时，Gateway 在隔离的 Docker 容器中运行 Agent 工具执行（shell、文件读/写等），而 Gateway 本身保留在主机上。这为不受信任或多租户 Agent 会话提供了一道硬墙，无需容器化整个 Gateway。

沙盒范围可以是每个 Agent（默认）、每个会话或共享的。每个范围都有自己的工作区挂载在 `/workspace`。你还可以配置允许/拒绝工具策略、网络隔离、资源限制和浏览器容器。

有关完整配置、镜像、安全说明和多 Agent 配置文件，请参阅：

- [沙盒](/gateway/sandboxing) -- 完整沙盒参考
- [OpenShell](/gateway/openshell) -- 对沙盒容器的交互式 shell 访问
- [多 Agent 沙盒和工具](/tools/multi-agent-sandbox-tools) -- 每 Agent 覆盖

### 快速启用

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
      },
    },
  },
}
```

构建默认沙盒镜像：

```bash
scripts/sandbox-setup.sh
```

## 故障排除

<AccordionGroup>
  <Accordion title="镜像缺失或沙盒容器未启动">
    使用 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) 构建沙盒镜像，或将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。容器按需自动创建。
  </Accordion>

  <Accordion title="沙盒中的权限错误">
    将 `docker.user` 设置为与你挂载的工作区所有权匹配的 UID:GID，或 chown 工作区文件夹。
  </Accordion>

  <Accordion title="沙盒中找不到自定义工具">
    OpenClaw 使用 `sh -lc`（登录 shell）运行命令，这会加载 `/etc/profile` 并可能重置 PATH。在 `docker.env.PATH` 中设置以预置你的自定义工具路径，或在你的 Dockerfile 中在 `/etc/profile.d/` 下添加脚本。
  </Accordion>

  <Accordion title="镜像构建期间 OOM 被杀死（退出码 137）">
    VM 需要至少 2 GB RAM。使用更大的机器规格并重试。
  </Accordion>

  <Accordion title="控制 UI 中未授权或需要配对">
    获取新的仪表板链接并批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多详情：[仪表板](/web/dashboard)、[设备](/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 目标显示 ws://172.x.x.x 或 Docker CLI 配对错误">
    重置 Gateway 模式和绑定：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相关

- [安装概览](/install) — 所有安装方法
- [Podman](/install/podman) — Docker 的 Podman 替代方案
- [ClawDock](/install/clawdock) — Docker Compose 社区设置
- [更新](/install/updating) — 保持 OpenClaw 最新
- [配置](/gateway/configuration) — 安装后的 Gateway 配置
