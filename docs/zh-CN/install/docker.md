---
read_when:
  - 你想要容器化的 Gateway 网关而不是本地安装
  - 你正在验证 Docker 流程
summary: OpenClaw 的可选 Docker 设置和新手引导
title: Docker
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: d80e7928ce68631985072cda92a51cf95e5d4558f1adedbf13f82315f9beee4b
  source_path: install/docker.md
  workflow: 15
---

# Docker（可选）

Docker 是**可选的**。仅当你想要容器化的 Gateway 网关或验证 Docker 流程时才使用它。

## Docker 适合我吗？

- **是**：你想要一个隔离的、可丢弃的 Gateway 网关环境，或在没有本地安装的主机上运行 OpenClaw。
- **否**：你在自己的机器上运行，只想要最快的开发循环。请改用正常的安装流程。
- **沙箱注意事项**：智能体沙箱也使用 Docker，但它**不需要**完整的 Gateway 网关在 Docker 中运行。参阅[沙箱隔离](/gateway/sandboxing)。

## 要求

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 至少 2 GB RAM 用于镜像构建（`pnpm install` 在 1 GB 主机上可能因内存不足而被杀死，退出码 137）
- 足够的磁盘空间用于镜像 + 日志
- 如果在 VPS/公网主机上运行，请查阅[网络暴露的安全加固](/gateway/security)，尤其是 Docker `DOCKER-USER` 防火墙策略。

## 容器化 Gateway 网关

<Steps>
  <Step title="构建镜像">
    从仓库根目录运行安装脚本：

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地构建 Gateway 网关镜像。要改用预构建镜像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像发布在
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常用标签：`main`、`latest`、`<version>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成新手引导">
    安装脚本会自动运行新手引导向导。它将：

    - 提示输入提供商 API 密钥
    - 生成 Gateway 网关令牌并写入 `.env`
    - 通过 Docker Compose 启动 Gateway 网关

    在设置期间，预启动的新手引导和配置写入通过 `openclaw-gateway` 直接运行。`openclaw-cli` 用于在 Gateway 网关容器已存在后运行的命令。

  </Step>

  <Step title="打开控制 UI">
    在浏览器中打开 `http://127.0.0.1:18789/` 并将令牌粘贴到设置中。

    需要再次获取 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="配置渠道（可选）">
    使用 CLI 容器添加消息渠道：

    ```bash
    # WhatsApp（QR）
    docker compose run --rm openclaw-cli channels login

    # Telegram
    docker compose run --rm openclaw-cli channels add --channel telegram --token "<token>"

    # Discord
    docker compose run --rm openclaw-cli channels add --channel discord --token "<token>"
    ```

    文档：[WhatsApp](/channels/whatsapp)，[Telegram](/channels/telegram)，[Discord](/channels/discord)

  </Step>
</Steps>

### 手动流程

如果你想手动运行每个步骤而不使用安装脚本：

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.mode local
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.bind lan
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set gateway.controlUi.allowedOrigins \
  '["http://localhost:18789","http://127.0.0.1:18789"]' --strict-json
docker compose up -d openclaw-gateway
```

<Note>
从仓库根目录运行 `docker compose`。如果你启用了 `OPENCLAW_EXTRA_MOUNTS` 或 `OPENCLAW_HOME_VOLUME`，安装脚本会写入 `docker-compose.extra.yml`；在其他地方运行 Compose 时包含它：`-f docker-compose.yml -f docker-compose.extra.yml`。
</Note>

<Note>
由于 `openclaw-cli` 共享 `openclaw-gateway` 的网络命名空间，它是一个启动后工具。在 `docker compose up -d openclaw-gateway` 之前，请通过 `openclaw-gateway` 使用 `--no-deps --entrypoint node` 运行新手引导和安装时的配置写入。
</Note>

### 环境变量

安装脚本接受以下可选环境变量：

| 变量                           | 用途                                                         |
| ------------------------------ | ------------------------------------------------------------ |
| `OPENCLAW_IMAGE`               | 使用远程镜像而不是本地构建                                   |
| `OPENCLAW_DOCKER_APT_PACKAGES` | 在构建时安装额外的 apt 包（空格分隔）                        |
| `OPENCLAW_EXTENSIONS`          | 在构建时预安装扩展依赖（空格分隔的名称）                     |
| `OPENCLAW_EXTRA_MOUNTS`        | 额外的主机绑定挂载（逗号分隔的 `source:target[:opts]`）      |
| `OPENCLAW_HOME_VOLUME`         | 在命名 Docker 卷中持久化 `/home/node`                        |
| `OPENCLAW_SANDBOX`             | 选择加入沙箱引导（`1`、`true`、`yes`、`on`）                 |
| `OPENCLAW_DOCKER_SOCKET`       | 覆盖 Docker socket 路径                                      |

### 健康检查

容器探针端点（无需认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 存活检查
curl -fsS http://127.0.0.1:18789/readyz     # 就绪检查
```

Docker 镜像包含内置 `HEALTHCHECK`，会 ping `/healthz`。如果检查持续失败，Docker 会将容器标记为 `unhealthy`，编排系统可以重启或替换它。

带认证的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与 loopback

`scripts/docker/setup.sh` 默认设置 `OPENCLAW_GATEWAY_BIND=lan`，以便主机访问 `http://127.0.0.1:18789` 与 Docker 端口发布配合使用。

- `lan`（默认）：主机浏览器和主机 CLI 可以访问已发布的 Gateway 网关端口。
- `loopback`：只有容器网络命名空间内的进程才能直接访问 Gateway 网关。

<Note>
在 `gateway.bind` 中使用绑定模式值（`lan` / `loopback` / `custom` / `tailnet` / `auto`），而不是主机别名如 `0.0.0.0` 或 `127.0.0.1`。
</Note>

### 存储与持久化

Docker Compose 将 `OPENCLAW_CONFIG_DIR` 绑定挂载到 `/home/node/.openclaw`，将 `OPENCLAW_WORKSPACE_DIR` 绑定挂载到 `/home/node/.openclaw/workspace`，因此这些路径在容器替换后仍然存在。

有关 VM 部署上的完整持久化详情，请参阅
[Docker VM 运行时——什么会持久化到哪里](/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：** 注意 `media/`、会话 JSONL 文件、`cron/runs/*.jsonl` 以及 `/tmp/openclaw/` 下的滚动文件日志。

### Shell 辅助工具（可选）

要更便捷地进行日常 Docker 管理，安装 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你从旧的 `scripts/shell-helpers/clawdock-helpers.sh` 路径安装了 ClawDock，请重新运行上面的安装命令，以便你的本地辅助文件跟踪新位置。

然后使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等命令。运行 `clawdock-help` 查看所有命令。完整辅助指南见 [ClawDock](/install/clawdock)。

<AccordionGroup>
  <Accordion title="为 Docker Gateway 网关启用智能体沙箱">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    自定义 socket 路径（例如无根 Docker）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    仅在沙箱先决条件通过后，脚本才会挂载 `docker.sock`。如果沙箱设置无法完成，脚本会将 `agents.defaults.sandbox.mode` 重置为 `off`。

  </Accordion>

  <Accordion title="自动化 / CI（非交互式）">
    使用 `-T` 禁用 Compose 伪 TTY 分配：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共享网络安全说明">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，因此 CLI 命令可以通过 `127.0.0.1` 访问 Gateway 网关。将此视为共享信任边界。compose 配置在 `openclaw-cli` 上丢弃了 `NET_RAW`/`NET_ADMIN` 并启用了 `no-new-privileges`。
  </Accordion>

  <Accordion title="权限与 EACCES">
    镜像以 `node`（uid 1000）运行。如果你在 `/home/node/.openclaw` 上看到权限错误，请确保你的主机绑定挂载由 uid 1000 拥有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="更快的重建">
    排序你的 Dockerfile 以便依赖层被缓存。这样除非锁文件更改，否则可以避免重新运行 `pnpm install`：

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

  <Accordion title="超级用户容器选项">
    默认镜像以安全优先，以非 root 的 `node` 用户运行。要获得功能更完整的容器：

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
    如果你在向导中选择 OpenAI Codex OAuth，它会打开浏览器 URL。在 Docker 或无头设置中，复制你到达的完整重定向 URL 并将其粘贴回向导以完成认证。
  </Accordion>

  <Accordion title="基础镜像元数据">
    主 Docker 镜像使用 `node:24-bookworm`，并发布 OCI 基础镜像注解，包括 `org.opencontainers.image.base.name`、`org.opencontainers.image.source` 等。参阅 [OCI 镜像注解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上运行？

参阅 [Hetzner（Docker VPS）](/install/hetzner) 和 [Docker VM 运行时](/install/docker-vm-runtime)，了解共享 VM 部署步骤，包括二进制烘焙、持久化和更新。

## 智能体沙箱

当 `agents.defaults.sandbox` 启用时，Gateway 网关在隔离的 Docker 容器内运行智能体工具执行（shell、文件读/写等），而 Gateway 网关本身保持在主机上。这在不将整个 Gateway 网关容器化的情况下，为不受信任或多租户智能体会话提供了硬隔离。

沙箱范围可以是每智能体（默认）、每会话或共享。每个范围都有自己的工作区挂载在 `/workspace`。你还可以配置允许/拒绝工具策略、网络隔离、资源限制和浏览器容器。

完整配置、镜像、安全说明和多智能体配置文件，请参阅：

- [沙箱隔离](/gateway/sandboxing) -- 完整沙箱参考
- [OpenShell](/gateway/openshell) -- 沙箱容器的交互式 shell 访问
- [多智能体沙箱与工具](/tools/multi-agent-sandbox-tools) -- 每智能体覆盖

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

构建默认沙箱镜像：

```bash
scripts/sandbox-setup.sh
```

## 故障排除

<AccordionGroup>
  <Accordion title="镜像缺失或沙箱容器无法启动">
    使用 [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh) 构建沙箱镜像，或将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。容器按需为每个会话自动创建。
  </Accordion>

  <Accordion title="沙箱中的权限错误">
    将 `docker.user` 设置为与你挂载的工作区所有权匹配的 UID:GID，或 chown 工作区文件夹。
  </Accordion>

  <Accordion title="沙箱中找不到自定义工具">
    OpenClaw 使用 `sh -lc`（登录 shell）运行命令，这会 source `/etc/profile` 并可能重置 PATH。设置 `docker.env.PATH` 以在前面添加你的自定义工具路径，或在你的 Dockerfile 中在 `/etc/profile.d/` 下添加脚本。
  </Accordion>

  <Accordion title="镜像构建时被 OOM 杀死（退出码 137）">
    VM 需要至少 2 GB RAM。使用更大的机器规格并重试。
  </Accordion>

  <Accordion title="控制 UI 中显示 unauthorized 或需要配对">
    获取新的仪表板链接并批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多详情：[仪表板](/web/dashboard)，[设备](/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 网关目标显示 ws://172.x.x.x 或 Docker CLI 出现配对错误">
    重置 Gateway 网关模式和绑定：

    ```bash
    docker compose run --rm openclaw-cli config set gateway.mode local
    docker compose run --rm openclaw-cli config set gateway.bind lan
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>
