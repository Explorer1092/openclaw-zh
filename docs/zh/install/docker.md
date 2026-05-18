---
mmh3_hash: "26dd2721f087a801527904695b164224"
title: "Docker（可选）"
sidebarTitle: "Docker"
summary: "OpenClaw 的可选 Docker 设置和引导"
read_when:
  - 你想要容器化的 gateway 而不是本地安装
  - 你正在验证 Docker 流程
---

Docker 是**可选的**。仅在你想要容器化的 gateway 或验证 Docker 流程时使用。

## Docker 适合我吗？

- **适合**：你想要一个隔离的、可丢弃的 gateway 环境，或在没有本地安装的主机上运行 OpenClaw。
- **不适合**：你在自己的机器上运行，只想要最快的开发循环。请使用普通安装流程。
- **沙箱说明**：默认沙箱后端在启用沙箱时使用 Docker，但沙箱默认关闭，并且**不**要求整个 gateway 在 Docker 中运行。SSH 和 OpenShell 沙箱后端也可用。请参阅 [Sandboxing](/gateway/sandboxing)。

## 前提条件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 镜像构建至少需要 2 GB RAM（`pnpm install` 可能在 1 GB 主机上以 exit 137 被 OOM 终止）
- 足够的磁盘空间用于镜像和日志
- 如果在 VPS/公网主机上运行，请查阅 [网络暴露的安全加固](/gateway/security)，特别是 Docker `DOCKER-USER` 防火墙策略。

## 容器化 gateway

<Steps>
  <Step title="构建镜像">
    从仓库根目录运行设置脚本：

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地构建 gateway 镜像。要使用预构建镜像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像发布在
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常见标签：`main`、`latest`、`<版本>`（例如 `2026.2.26`）。

  </Step>

  <Step title="完成引导">
    设置脚本会自动运行引导。它将：

    - 提示输入 provider API 密钥
    - 生成 gateway 令牌并写入 `.env`
    - 通过 Docker Compose 启动 gateway

    在设置期间，预启动引导和配置写入通过 `openclaw-gateway` 直接运行。`openclaw-cli` 用于 gateway 容器已存在后运行的命令。

  </Step>

  <Step title="打开控制界面">
    在浏览器中打开 `http://127.0.0.1:18789/` 并将已配置的
    共享密钥粘贴到设置中。设置脚本默认将令牌写入 `.env`；
    如果你将容器配置切换为密码认证，请改用该密码。

    需要再次获取 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="配置 channel（可选）">
    使用 CLI 容器添加消息 channel：

    ```bash
    # WhatsApp（QR）
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

如果你更喜欢自己运行每个步骤而不使用设置脚本：

```bash
docker build -t openclaw:local -f Dockerfile .
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js onboard --mode local --no-install-daemon
docker compose run --rm --no-deps --entrypoint node openclaw-gateway \
  dist/index.js config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"},{"path":"gateway.controlUi.allowedOrigins","value":["http://localhost:18789","http://127.0.0.1:18789"]}]'
docker compose up -d openclaw-gateway
```

<Note>
从仓库根目录运行 `docker compose`。如果你启用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，设置脚本会写入 `docker-compose.extra.yml`；
用 `-f docker-compose.yml -f docker-compose.extra.yml` 包含它。
</Note>

<Note>
由于 `openclaw-cli` 共享 `openclaw-gateway` 的网络命名空间，它是一个
启动后工具。在 `docker compose up -d openclaw-gateway` 之前，通过
带 `--no-deps --entrypoint node` 的 `openclaw-gateway` 运行引导和
设置时配置写入。
</Note>

### 环境变量

设置脚本接受以下可选环境变量：

| 变量                                       | 用途                                                            |
| ------------------------------------------ | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                           | 使用远程镜像而不是本地构建                                      |
| `OPENCLAW_IMAGE_APT_PACKAGES`              | 构建时安装额外 apt 包（空格分隔）                                     |
| `OPENCLAW_EXTENSIONS`                      | 构建时预安装 plugin 依赖项（空格分隔的名称）                          |
| `OPENCLAW_EXTRA_MOUNTS`                    | 额外主机绑定挂载（逗号分隔 `source:target[:opts]`）             |
| `OPENCLAW_HOME_VOLUME`                     | 在命名 Docker 卷中持久化 `/home/node`                           |
| `OPENCLAW_SANDBOX`                         | 选择加入沙箱引导（`1`、`true`、`yes`、`on`）                    |
| `OPENCLAW_SKIP_ONBOARDING`                 | 跳过交互式引导步骤（`1`、`true`、`yes`、`on`）                  |
| `OPENCLAW_DOCKER_SOCKET`                   | 覆盖 Docker socket 路径                                         |
| `OPENCLAW_DISABLE_BONJOUR`                 | 禁用 Bonjour/mDNS 广播（Docker 默认为 `1`）                     |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS` | 禁用捆绑 plugin 源绑定挂载覆盖                                  |
| `OTEL_EXPORTER_OTLP_ENDPOINT`              | OpenTelemetry 导出的共享 OTLP/HTTP 收集器端点                   |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`            | 用于跟踪、指标或日志的信号特定 OTLP 端点                        |
| `OTEL_EXPORTER_OTLP_PROTOCOL`              | OTLP 协议覆盖。目前仅支持 `http/protobuf`                       |
| `OTEL_SERVICE_NAME`                        | OpenTelemetry 资源使用的服务名称                                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`            | 选择加入最新的实验性 GenAI 语义属性                             |
| `OPENCLAW_OTEL_PRELOADED`                  | 预加载 OpenTelemetry SDK 时跳过启动第二个                        |

官方 Docker 镜像不附带 Homebrew。在引导过程中，当 OpenClaw 运行在没有 `brew` 的 Linux 容器中时，它会隐藏仅适用于 brew 的技能依赖项安装程序；这些依赖项必须由自定义镜像提供或手动安装。对于可从 Debian 包获取的依赖项，请在镜像构建时使用 `OPENCLAW_IMAGE_APT_PACKAGES`。旧版 `OPENCLAW_DOCKER_APT_PACKAGES` 名称仍然被接受。

维护者可以通过将一个 plugin 源目录挂载到其打包源路径上来测试捆绑 plugin 源与打包镜像，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
该挂载的源目录会覆盖相同 plugin id 的匹配编译
`/app/dist/extensions/synology-chat` 包。

### 可观测性

OpenTelemetry 导出从 Gateway 容器向外到你的 OTLP
收集器。它不需要发布的 Docker 端口。如果你在本地构建镜像
并希望捆绑的 OpenTelemetry 导出器在镜像内可用，
请包含其运行时依赖：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

在启用导出之前，在打包的 Docker 安装中从 ClawHub 安装官方 `@openclaw/diagnostics-otel` plugin。
自定义源构建镜像仍然可以使用
`OPENCLAW_EXTENSIONS=diagnostics-otel` 包含本地 plugin 源。
要启用导出，在配置中允许并启用 `diagnostics-otel` plugin，然后设置
`diagnostics.otel.enabled=true` 或使用 [OpenTelemetry
导出](/gateway/opentelemetry) 中的配置示例。收集器认证标头通过
`diagnostics.otel.headers` 配置，而不是通过 Docker 环境变量。

Prometheus 指标使用已发布的 Gateway 端口。安装
`clawhub:@openclaw/diagnostics-prometheus`，启用
`diagnostics-prometheus` plugin，然后抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

该路由受 Gateway 认证保护。不要暴露单独的
公网 `/metrics` 端口或未认证的反向代理路径。请参阅
[Prometheus 指标](/gateway/prometheus)。

### 健康检查

容器探针端点（不需要认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 存活检查
curl -fsS http://127.0.0.1:18789/readyz     # 就绪检查
```

Docker 镜像包含内置的 `HEALTHCHECK`，会 ping `/healthz`。
如果检查持续失败，Docker 将容器标记为 `unhealthy`，
编排系统可以重启或替换它。

认证的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与 loopback

`scripts/docker/setup.sh` 默认将 `OPENCLAW_GATEWAY_BIND=lan` 设置为，
使主机访问 `http://127.0.0.1:18789` 与 Docker 端口发布一起工作。

- `lan`（默认）：主机浏览器和主机 CLI 可以访问已发布的 gateway 端口。
- `loopback`：只有容器网络命名空间内的进程才能直接访问 gateway。

<Note>
在 `gateway.bind` 中使用绑定模式值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），而不是主机别名如 `0.0.0.0` 或 `127.0.0.1`。
</Note>

### 主机本地 Provider

当 OpenClaw 在 Docker 中运行时，容器内的 `127.0.0.1` 是容器本身，
而不是你的主机。对于在主机上运行的 AI provider 使用 `host.docker.internal`：

| Provider  | 主机默认 URL             | Docker 设置 URL                     |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

捆绑的 Docker 设置将这些主机 URL 用作 LM Studio 和 Ollama
引导默认值，`docker-compose.yml` 为 Linux Docker Engine 将 `host.docker.internal` 映射到
Docker 的主机网关。Docker Desktop 在 macOS 和 Windows 上已经提供了相同的主机名。

主机服务还必须监听 Docker 可访问的地址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 文件或 `docker run` 命令，请自行添加相同的主机
映射，例如 `--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker 桥接网络通常无法可靠地转发 Bonjour/mDNS 多播
（`224.0.0.251:5353`）。因此捆绑的 Compose 设置默认
`OPENCLAW_DISABLE_BONJOUR=1`，这样当桥接丢弃多播流量时
Gateway 不会崩溃循环或反复重启广播。

对于 Docker 主机，使用已发布的 Gateway URL、Tailscale 或广域 DNS-SD。
只有在使用主机网络、macvlan 或已知 mDNS 多播有效的其他网络时，
才设置 `OPENCLAW_DISABLE_BONJOUR=0`。

有关常见问题和故障排除，请参阅 [Bonjour 发现](/gateway/bonjour)。

### 存储和持久化

Docker Compose 将 `OPENCLAW_CONFIG_DIR` 绑定挂载到 `/home/node/.openclaw`，
将 `OPENCLAW_WORKSPACE_DIR` 绑定挂载到 `/home/node/.openclaw/workspace`，以及
将 `OPENCLAW_AUTH_PROFILE_SECRET_DIR` 绑定挂载到 `/home/node/.config/openclaw`，
因此这些路径在容器替换后仍然保留。当任何变量未设置时，捆绑的
`docker-compose.yml` 在 `${HOME}` 下回退，或在 `HOME` 本身也缺失时使用 `/tmp`。
这避免了在裸环境中 `docker compose up` 发出空源卷规范。

认证配置文件密钥目录存储用于 OAuth 支持的认证配置文件令牌材料的本地加密密钥。请将其与 Docker 主机状态一起保留，但与 `OPENCLAW_CONFIG_DIR` 分开。

该挂载的配置目录是 OpenClaw 保存以下内容的地方：

- `openclaw.json` 用于行为配置
- `agents/<agentId>/agent/auth-profiles.json` 用于存储的 provider OAuth/API 密钥认证
- `.env` 用于环境支持的运行时密钥，如 `OPENCLAW_GATEWAY_TOKEN`

已安装的可下载 plugin 将其包状态存储在挂载的 OpenClaw 主目录下，
因此 plugin 安装记录和包根目录在容器替换后仍然存在。Gateway 启动不会
生成捆绑 plugin 依赖树。

有关 VM 部署的完整持久化详情，请参阅
[Docker VM 运行时 - 什么会在哪里持久化](/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：** 注意 `media/`、会话 JSONL 文件、
`cron/runs/*.jsonl`、已安装的 plugin 包根目录和 `/tmp/openclaw/` 下的滚动文件日志。

### Shell 辅助工具（可选）

为了更轻松的日常 Docker 管理，安装 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你从旧的 `scripts/shell-helpers/clawdock-helpers.sh` 原始路径安装了 ClawDock，请重新运行上面的安装命令，使你的本地辅助文件跟踪新位置。

然后使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等。运行
`clawdock-help` 查看所有命令。
参阅 [ClawDock](/install/clawdock) 获取完整辅助指南。

<AccordionGroup>
  <Accordion title="为 Docker gateway 启用 agent 沙箱">
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

    脚本仅在沙箱前提条件通过后挂载 `docker.sock`。如果
    沙箱设置无法完成，脚本会将 `agents.defaults.sandbox.mode`
    重置为 `off`。当 OpenClaw 沙箱处于活跃状态时，Codex 代码模式轮次仍受限于
    Codex `workspace-write`；不要将主机 Docker socket 挂载到 Agent 沙箱容器中。

  </Accordion>

  <Accordion title="自动化 / CI（非交互式）">
    使用 `-T` 禁用 Compose 伪 TTY 分配：

    ```bash
    docker compose run -T --rm openclaw-cli gateway probe
    docker compose run -T --rm openclaw-cli devices list --json
    ```

  </Accordion>

  <Accordion title="共享网络安全说明">
    `openclaw-cli` 使用 `network_mode: "service:openclaw-gateway"`，所以 CLI
    命令可以通过 `127.0.0.1` 访问 gateway。将其视为共享信任边界。
    compose 配置在 `openclaw-gateway` 和 `openclaw-cli` 上都删除了 `NET_RAW`/`NET_ADMIN` 并启用了
    `no-new-privileges`。
  </Accordion>

  <Accordion title="Docker Desktop 中 openclaw-cli 的 DNS 故障">
    某些 Docker Desktop 设置在删除 `NET_RAW` 后从共享网络
    `openclaw-cli` sidecar 进行 DNS 查找失败，表现为
    `openclaw plugins install` 等 npm 支持的命令期间出现 `EAI_AGAIN`。
    对正常 gateway 操作保持默认强化的 compose 文件。下面的本地覆盖通过
    恢复 Docker 的默认功能来放宽 CLI 容器的安全态势，因此仅将其用于
    需要包注册表访问的一次性 CLI 命令，而不是作为你的默认 Compose 调用：

    ```bash
    printf '%s\n' \
      'services:' \
      '  openclaw-cli:' \
      '    cap_drop: !reset []' \
      > docker-compose.cli-no-dropped-caps.local.yml

    docker compose -f docker-compose.yml -f docker-compose.cli-no-dropped-caps.local.yml run --rm openclaw-cli plugins install <package>
    ```

    如果你已经创建了长期运行的 `openclaw-cli` 容器，请使用相同的覆盖重新创建它。
    `docker compose exec` 和 `docker exec` 无法更改已创建容器上的 Linux 功能。

  </Accordion>

  <Accordion title="权限和 EACCES">
    镜像以 `node`（uid 1000）运行。如果你在
    `/home/node/.openclaw` 上看到权限错误，请确保你的主机绑定挂载由 uid 1000 拥有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

    同样的不匹配可能表现为 plugin 警告，如
    `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
    后跟 `plugin present but blocked`。这意味着进程 uid 和
    挂载的 plugin 目录所有者不一致。优先以默认 uid 1000 运行容器并修复绑定挂载所有权。
    只有在你有意长期以 root 运行 OpenClaw 时，才将
    `/path/to/openclaw-config/npm` chown 为 `root:root`。

  </Accordion>

  <Accordion title="更快的重建">
    对 Dockerfile 进行排序，使依赖层被缓存。这避免了重新运行
    `pnpm install`，除非 lockfile 发生变化：

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

  <Accordion title="高级容器选项">
    默认镜像以安全为先，以非 root `node` 运行。对于功能更全面的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **烘焙系统依赖**：`export OPENCLAW_IMAGE_APT_PACKAGES="git curl jq"`
    3. **烘焙 Playwright Chromium**：`export OPENCLAW_INSTALL_BROWSER=1`
    4. **或将 Playwright 浏览器安装到持久化卷中**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    5. **持久化浏览器下载**：使用 `OPENCLAW_HOME_VOLUME` 或
       `OPENCLAW_EXTRA_MOUNTS`。OpenClaw 在 Linux 上自动检测 Docker 镜像的
       Playwright 管理的 Chromium。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（无头 Docker）">
    如果你在向导中选择 OpenAI Codex OAuth，它会打开浏览器 URL。在
    Docker 或无头设置中，复制你所在的完整重定向 URL 并将其粘贴回向导以完成认证。
  </Accordion>

  <Accordion title="基础镜像元数据">
    主 Docker 运行时镜像使用 `node:24-bookworm-slim`，并包含 `tini` 作为入口点 init 进程（PID 1），以确保在长期运行的容器中僵尸进程被回收，信号被正确处理。它发布包含 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 等的 OCI 基础镜像注解。Node 基础摘要通过
    Dependabot Docker 基础镜像 PR 刷新；发布构建不运行 distro 升级层。请参阅
    [OCI 镜像注解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上运行？

请参阅 [Hetzner（Docker VPS）](/install/hetzner) 和
[Docker VM 运行时](/install/docker-vm-runtime) 获取共享 VM 部署步骤，
包括二进制文件烘焙、持久化和更新。

## Agent 沙箱

当 `agents.defaults.sandbox` 使用 Docker 后端启用时，gateway
在隔离的 Docker 容器内运行 agent 工具执行（shell、文件读写等），
而 gateway 本身保持在主机上。这在不容器化整个 gateway 的情况下，
为不可信或多租户 agent 会话提供了硬隔离。

沙箱范围可以是每个 agent（默认）、每个会话或共享。每个范围
都有自己的工作区挂载在 `/workspace`。你还可以配置
允许/拒绝工具策略、网络隔离、资源限制和浏览器容器。

有关完整配置、镜像、安全说明和多 agent 配置，请参阅：

- [Sandboxing](/gateway/sandboxing) -- 完整沙箱参考
- [OpenShell](/gateway/openshell) -- 沙箱容器的交互式 shell 访问
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) -- 每个 agent 的覆盖

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

构建默认沙箱镜像（从源码检出）：

```bash
scripts/sandbox-setup.sh
```

对于没有源码检出的 npm 安装，请参阅 [Sandboxing § 镜像和设置](/gateway/sandboxing#images-and-setup) 获取内联 `docker build` 命令。

## 故障排除

<AccordionGroup>
  <Accordion title="镜像缺失或沙箱容器不启动">
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    （源码检出）或 [Sandboxing § 镜像和设置](/gateway/sandboxing#images-and-setup)（npm 安装）中的内联 `docker build` 命令构建沙箱镜像，
    或将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。
    容器按需在每个会话上自动创建。
  </Accordion>

  <Accordion title="沙箱中的权限错误">
    将 `docker.user` 设置为与你挂载的工作区所有权匹配的 UID:GID，
    或 chown 工作区文件夹。
  </Accordion>

  <Accordion title="在沙箱中找不到自定义工具">
    OpenClaw 使用 `sh -lc`（登录 shell）运行命令，它会解析
    `/etc/profile` 并可能重置 PATH。设置 `docker.env.PATH` 以添加你的
    自定义工具路径，或在 Dockerfile 中的 `/etc/profile.d/` 下添加脚本。
  </Accordion>

  <Accordion title="镜像构建期间 OOM 终止（exit 137）">
    VM 至少需要 2 GB RAM。使用更大的机器类型并重试。
  </Accordion>

  <Accordion title="控制界面中未授权或需要配对">
    获取新的仪表板链接并批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多详情：[Dashboard](/web/dashboard)、[Devices](/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 目标显示 ws://172.x.x.x 或 Docker CLI 的配对错误">
    重置 gateway 模式和绑定：

    ```bash
    docker compose run --rm openclaw-cli config set --batch-json '[{"path":"gateway.mode","value":"local"},{"path":"gateway.bind","value":"lan"}]'
    docker compose run --rm openclaw-cli devices list --url ws://127.0.0.1:18789
    ```

  </Accordion>
</AccordionGroup>

## 相关

- [安装概览](/install) -- 所有安装方法
- [Podman](/install/podman) -- Docker 的 Podman 替代方案
- [ClawDock](/install/clawdock) -- Docker Compose 社区设置
- [更新](/install/updating) -- 保持 OpenClaw 最新
- [配置](/gateway/configuration) -- 安装后的 gateway 配置
