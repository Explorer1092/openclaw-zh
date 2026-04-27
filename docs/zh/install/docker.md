---
mmh3_hash: "45509def6de5424a3dc6a522098524a0"
title: "Docker（可选）"
sidebarTitle: "Docker"
summary: "OpenClaw 的可选 Docker 设置和引导"
read_when:
  - 你想要容器化的 Gateway 而非本地安装
  - 你正在验证 Docker 流程
---

Docker 是**可选的**。仅当你想要容器化 gateway 或验证 Docker 流程时才使用它。

## Docker 适合我吗？

- **适合**：你想要隔离的、可丢弃的 gateway 环境，或在没有本地安装的主机上运行 OpenClaw。
- **不适合**：你在自己的机器上运行，只想要最快的开发循环。请改用普通安装流程。
- **沙箱注意事项**：启用沙箱时，默认沙箱后端使用 Docker，但沙箱默认是关闭的，**不**需要整个 gateway 在 Docker 中运行。SSH 和 OpenShell 沙箱后端也可用。参阅 [Sandboxing](/gateway/sandboxing)。

## 前提条件

- Docker Desktop（或 Docker Engine）+ Docker Compose v2
- 至少 2 GB RAM 用于镜像构建（`pnpm install` 在 1 GB 主机上可能因退出码 137 被 OOM 终止）
- 足够的磁盘空间用于镜像和日志
- 如果在 VPS/公共主机上运行，请查阅
  [网络暴露的安全加固](/gateway/security)，
  特别是 Docker `DOCKER-USER` 防火墙策略。

## 容器化 gateway

<Steps>
  <Step title="构建镜像">
    从仓库根目录运行设置脚本：

    ```bash
    ./scripts/docker/setup.sh
    ```

    这会在本地构建 gateway 镜像。改用预构建镜像：

    ```bash
    export OPENCLAW_IMAGE="ghcr.io/openclaw/openclaw:latest"
    ./scripts/docker/setup.sh
    ```

    预构建镜像发布在
    [GitHub Container Registry](https://github.com/openclaw/openclaw/pkgs/container/openclaw)。
    常用标签：`main`、`latest`、`<version>`（如 `2026.2.26`）。

  </Step>

  <Step title="完成引导">
    设置脚本会自动运行引导。它将：

    - 提示输入 provider API 密钥
    - 生成 gateway token 并写入 `.env`
    - 通过 Docker Compose 启动 gateway

    在设置期间，预启动引导和配置写入通过
    `openclaw-gateway` 直接运行。`openclaw-cli` 是 gateway 容器已存在后运行的命令工具。

  </Step>

  <Step title="打开控制 UI">
    在浏览器中打开 `http://127.0.0.1:18789/` 并将配置的
    共享密钥粘贴到设置中。设置脚本默认将 token 写入 `.env`；
    如果你将容器配置切换为密码认证，请改用该密码。

    再次获取 URL？

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    ```

  </Step>

  <Step title="配置 channel（可选）">
    使用 CLI 容器添加消息 channel：

    ```bash
    # WhatsApp（二维码）
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
从仓库根目录运行 `docker compose`。如果你启用了 `OPENCLAW_EXTRA_MOUNTS`
或 `OPENCLAW_HOME_VOLUME`，设置脚本会写入 `docker-compose.extra.yml`；
用 `-f docker-compose.yml -f docker-compose.extra.yml` 包含它。
</Note>

<Note>
由于 `openclaw-cli` 共享 `openclaw-gateway` 的网络命名空间，它是一个
启动后的工具。在 `docker compose up -d openclaw-gateway` 之前，通过
带 `--no-deps --entrypoint node` 的 `openclaw-gateway` 运行引导
和设置时的配置写入。
</Note>

### 环境变量

设置脚本接受这些可选环境变量：

| 变量                                         | 用途                                                            |
| -------------------------------------------- | --------------------------------------------------------------- |
| `OPENCLAW_IMAGE`                             | 使用远程镜像而不是本地构建                                       |
| `OPENCLAW_DOCKER_APT_PACKAGES`               | 构建时安装额外的 apt 包（空格分隔）                              |
| `OPENCLAW_EXTENSIONS`                        | 构建时预安装插件依赖（空格分隔的名称）                           |
| `OPENCLAW_EXTRA_MOUNTS`                      | 额外的主机绑定挂载（逗号分隔的 `source:target[:opts]`）          |
| `OPENCLAW_HOME_VOLUME`                       | 在命名的 Docker 卷中持久化 `/home/node`                          |
| `OPENCLAW_SANDBOX`                           | 选择加入沙箱引导（`1`、`true`、`yes`、`on`）                    |
| `OPENCLAW_DOCKER_SOCKET`                     | 覆盖 Docker socket 路径                                          |
| `OPENCLAW_DISABLE_BONJOUR`                   | 禁用 Bonjour/mDNS 广播（Docker 默认为 `1`）                      |
| `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS`   | 禁用捆绑插件源绑定挂载覆盖                                       |
| `OTEL_EXPORTER_OTLP_ENDPOINT`               | OpenTelemetry 导出的共享 OTLP/HTTP 收集器端点                    |
| `OTEL_EXPORTER_OTLP_*_ENDPOINT`             | 用于 traces、metrics 或 logs 的信号特定 OTLP 端点               |
| `OTEL_EXPORTER_OTLP_PROTOCOL`               | OTLP 协议覆盖。目前仅支持 `http/protobuf`                        |
| `OTEL_SERVICE_NAME`                          | 用于 OpenTelemetry 资源的服务名称                                |
| `OTEL_SEMCONV_STABILITY_OPT_IN`             | 选择加入最新的实验性 GenAI 语义属性                              |
| `OPENCLAW_OTEL_PRELOADED`                   | 预加载时跳过启动第二个 OpenTelemetry SDK                         |

维护者可以通过将一个插件源目录挂载到其打包的源路径上来针对打包镜像测试捆绑插件源，例如
`OPENCLAW_EXTRA_MOUNTS=/path/to/fork/extensions/synology-chat:/app/extensions/synology-chat:ro`。
该挂载的源目录会覆盖同一插件 id 匹配的编译 `/app/dist/extensions/synology-chat` 包。

### 可观测性

OpenTelemetry 导出从 Gateway 容器出站到你的 OTLP 收集器。它不需要发布的 Docker 端口。如果你在本地构建镜像并希望捆绑的 OpenTelemetry 导出器在镜像内可用，请包含其运行时依赖项：

```bash
export OPENCLAW_EXTENSIONS="diagnostics-otel"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://otel-collector:4318"
export OTEL_SERVICE_NAME="openclaw-gateway"
./scripts/docker/setup.sh
```

官方 OpenClaw Docker 发布镜像包含捆绑的 `diagnostics-otel` 插件源。根据镜像和缓存状态，Gateway 在第一次启用插件时可能仍会暂存插件本地的 OpenTelemetry 运行时依赖项，因此允许首次启动访问包注册表或在你的发布通道中预热镜像。要启用导出，在配置中允许并启用 `diagnostics-otel` 插件，然后设置
`diagnostics.otel.enabled=true` 或使用
[OpenTelemetry 导出](/gateway/opentelemetry) 中的配置示例。收集器认证头通过 `diagnostics.otel.headers` 配置，而不是通过 Docker 环境变量。

Prometheus 指标使用已发布的 Gateway 端口。启用 `diagnostics-prometheus` 插件，然后抓取：

```text
http://<gateway-host>:18789/api/diagnostics/prometheus
```

路由受 Gateway 认证保护。不要暴露单独的公共 `/metrics` 端口或未认证的反向代理路径。参阅
[Prometheus 指标](/gateway/prometheus)。

### 健康检查

容器探针端点（无需认证）：

```bash
curl -fsS http://127.0.0.1:18789/healthz   # 存活检查
curl -fsS http://127.0.0.1:18789/readyz     # 就绪检查
```

Docker 镜像包含一个内置的 `HEALTHCHECK`，会 ping `/healthz`。
如果检查持续失败，Docker 将容器标记为 `unhealthy`，
编排系统可以重启或替换它。

已认证的深度健康快照：

```bash
docker compose exec openclaw-gateway node dist/index.js health --token "$OPENCLAW_GATEWAY_TOKEN"
```

### LAN 与 loopback

`scripts/docker/setup.sh` 默认 `OPENCLAW_GATEWAY_BIND=lan`，以便主机通过
`http://127.0.0.1:18789` 访问 Docker 发布的端口。

- `lan`（默认）：主机浏览器和主机 CLI 可以访问发布的 gateway 端口。
- `loopback`：只有容器网络命名空间内的进程可以直接访问
  gateway。

<Note>
在 `gateway.bind` 中使用绑定模式值（`lan` / `loopback` / `custom` /
`tailnet` / `auto`），而不是主机别名如 `0.0.0.0` 或 `127.0.0.1`。
</Note>

### 主机本地 Provider

当 OpenClaw 在 Docker 中运行时，容器内的 `127.0.0.1` 是容器
本身，而不是你的主机。对于在主机上运行的 AI provider，使用 `host.docker.internal`：

| Provider  | 主机默认 URL             | Docker 设置 URL                     |
| --------- | ------------------------ | ----------------------------------- |
| LM Studio | `http://127.0.0.1:1234`  | `http://host.docker.internal:1234`  |
| Ollama    | `http://127.0.0.1:11434` | `http://host.docker.internal:11434` |

捆绑的 Docker 设置使用这些主机 URL 作为 LM Studio 和 Ollama 引导默认值，而 `docker-compose.yml` 将 `host.docker.internal` 映射到 Linux Docker Engine 的主机网关。Docker Desktop 已在 macOS 和 Windows 上提供相同的主机名。

主机服务还必须监听 Docker 可访问的地址：

```bash
lms server start --port 1234 --bind 0.0.0.0
OLLAMA_HOST=0.0.0.0:11434 ollama serve
```

如果你使用自己的 Compose 文件或 `docker run` 命令，请自行添加相同的主机映射，例如
`--add-host=host.docker.internal:host-gateway`。

### Bonjour / mDNS

Docker 桥接网络通常不能可靠地转发 Bonjour/mDNS 多播
（`224.0.0.251:5353`）。因此，捆绑的 Compose 设置默认
`OPENCLAW_DISABLE_BONJOUR=1`，这样当桥接丢弃多播流量时 Gateway 不会崩溃循环或反复重启广播。

对于 Docker 主机，使用已发布的 Gateway URL、Tailscale 或广域 DNS-SD。
仅在使用主机网络、macvlan 或其他已知 mDNS 多播有效的网络时设置 `OPENCLAW_DISABLE_BONJOUR=0`。

有关注意事项和故障排除，请参阅 [Bonjour 发现](/gateway/bonjour)。

### 存储和持久化

Docker Compose 将 `OPENCLAW_CONFIG_DIR` 绑定挂载到 `/home/node/.openclaw`，将
`OPENCLAW_WORKSPACE_DIR` 绑定挂载到 `/home/node/.openclaw/workspace`，因此这些路径在容器替换后仍然存在。

该挂载的配置目录是 OpenClaw 保存以下内容的地方：

- `openclaw.json` 用于行为配置
- `agents/<agentId>/agent/auth-profiles.json` 用于存储的 provider OAuth/API 密钥认证
- `.env` 用于基于环境的运行时密钥，如 `OPENCLAW_GATEWAY_TOKEN`

有关 VM 部署的完整持久化详情，请参阅
[Docker VM 运行时 - 持久化位置](/install/docker-vm-runtime#what-persists-where)。

**磁盘增长热点：** 注意 `media/`、session JSONL 文件、`cron/runs/*.jsonl`
以及 `/tmp/openclaw/` 下的滚动文件日志。

### Shell 助手（可选）

为了更方便的日常 Docker 管理，安装 `ClawDock`：

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

如果你从较旧的 `scripts/shell-helpers/clawdock-helpers.sh` 原始路径安装了 ClawDock，请重新运行上面的安装命令以使本地助手文件跟踪新位置。

然后使用 `clawdock-start`、`clawdock-stop`、`clawdock-dashboard` 等。运行
`clawdock-help` 查看所有命令。
参阅 [ClawDock](/install/clawdock) 获取完整的助手指南。

<AccordionGroup>
  <Accordion title="为 Docker gateway 启用 agent 沙箱">
    ```bash
    export OPENCLAW_SANDBOX=1
    ./scripts/docker/setup.sh
    ```

    自定义 socket 路径（如无根 Docker）：

    ```bash
    export OPENCLAW_SANDBOX=1
    export OPENCLAW_DOCKER_SOCKET=/run/user/1000/docker.sock
    ./scripts/docker/setup.sh
    ```

    脚本仅在沙箱先决条件通过后挂载 `docker.sock`。如果
    沙箱设置无法完成，脚本会将 `agents.defaults.sandbox.mode`
    重置为 `off`。

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
    命令可以通过 `127.0.0.1` 访问 gateway。将此视为共享
    信任边界。Compose 配置在 `openclaw-cli` 上丢弃 `NET_RAW`/`NET_ADMIN` 并启用
    `no-new-privileges`。
  </Accordion>

  <Accordion title="权限和 EACCES">
    镜像以 `node`（uid 1000）运行。如果你在
    `/home/node/.openclaw` 上看到权限错误，确保你的主机绑定挂载
    由 uid 1000 拥有：

    ```bash
    sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
    ```

  </Accordion>

  <Accordion title="更快的重建">
    对 Dockerfile 进行排序，使依赖层被缓存。这避免了
    在 lockfile 未更改时重新运行 `pnpm install`：

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
    默认镜像以安全为优先，以非 root `node` 运行。要获得功能更完整的容器：

    1. **持久化 `/home/node`**：`export OPENCLAW_HOME_VOLUME="openclaw_home"`
    2. **烘焙系统依赖**：`export OPENCLAW_DOCKER_APT_PACKAGES="git curl jq"`
    3. **安装 Playwright 浏览器**：
       ```bash
       docker compose run --rm openclaw-cli \
         node /app/node_modules/playwright-core/cli.js install chromium
       ```
    4. **持久化浏览器下载**：设置
       `PLAYWRIGHT_BROWSERS_PATH=/home/node/.cache/ms-playwright` 并使用
       `OPENCLAW_HOME_VOLUME` 或 `OPENCLAW_EXTRA_MOUNTS`。

  </Accordion>

  <Accordion title="OpenAI Codex OAuth（无头 Docker）">
    如果你在向导中选择 OpenAI Codex OAuth，它会打开一个浏览器 URL。在
    Docker 或无头设置中，复制你访问的完整重定向 URL 并将其
    粘贴回向导以完成认证。
  </Accordion>

  <Accordion title="基础镜像元数据">
    主要 Docker 运行时镜像使用 `node:24-bookworm-slim` 并发布 OCI
    基础镜像注解，包括 `org.opencontainers.image.base.name`、
    `org.opencontainers.image.source` 等。Node 基础摘要通过 Dependabot Docker 基础镜像 PR 刷新；发布构建不运行
    发行版升级层。参阅
    [OCI 镜像注解](https://github.com/opencontainers/image-spec/blob/main/annotations.md)。
  </Accordion>
</AccordionGroup>

### 在 VPS 上运行？

有关共享 VM 部署步骤（包括二进制烘焙、持久化和更新），请参阅
[Hetzner（Docker VPS）](/install/hetzner) 和
[Docker VM 运行时](/install/docker-vm-runtime)。

## Agent 沙箱

当 `agents.defaults.sandbox` 使用 Docker 后端启用时，gateway
在隔离的 Docker 容器内运行 agent 工具执行（shell、文件读/写等），同时 gateway 本身留在主机上。这在不容器化整个 gateway 的情况下，围绕不受信任或多租户的 agent session 建立了一道硬壁。

沙箱范围可以是每个 agent（默认）、每个 session 或共享。每个范围
都有自己的工作区挂载在 `/workspace`。你还可以配置
允许/拒绝工具策略、网络隔离、资源限制和浏览器容器。

有关完整配置、镜像、安全说明和多 agent 配置文件，请参阅：

- [Sandboxing](/gateway/sandboxing) — 完整沙箱参考
- [OpenShell](/gateway/openshell) — 沙箱容器的交互式 shell 访问
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) — 每个 agent 的覆盖

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
    使用
    [`scripts/sandbox-setup.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/sandbox-setup.sh)
    构建沙箱镜像，或将 `agents.defaults.sandbox.docker.image` 设置为你的自定义镜像。
    容器按需为每个 session 自动创建。
  </Accordion>

  <Accordion title="沙箱中的权限错误">
    将 `docker.user` 设置为与挂载的工作区所有权匹配的 UID:GID，
    或对工作区文件夹执行 chown。
  </Accordion>

  <Accordion title="沙箱中找不到自定义工具">
    OpenClaw 使用 `sh -lc`（登录 shell）运行命令，它会加载
    `/etc/profile` 并可能重置 PATH。将 `docker.env.PATH` 设置为预置你的
    自定义工具路径，或在你的 Dockerfile 中的 `/etc/profile.d/` 下添加脚本。
  </Accordion>

  <Accordion title="镜像构建期间 OOM 终止（退出码 137）">
    VM 需要至少 2 GB RAM。使用更大的机器类型并重试。
  </Accordion>

  <Accordion title="控制 UI 中未授权或需要配对">
    获取新的仪表板链接并批准浏览器设备：

    ```bash
    docker compose run --rm openclaw-cli dashboard --no-open
    docker compose run --rm openclaw-cli devices list
    docker compose run --rm openclaw-cli devices approve <requestId>
    ```

    更多详情：[Dashboard](/web/dashboard)、[Devices](/cli/devices)。

  </Accordion>

  <Accordion title="Gateway 目标显示 ws://172.x.x.x 或来自 Docker CLI 的配对错误">
    重置 gateway 模式和绑定：

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
- [配置](/gateway/configuration) — 安装后的 gateway 配置
