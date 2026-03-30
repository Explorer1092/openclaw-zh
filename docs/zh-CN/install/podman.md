---
read_when:
  - 你想用 Podman 替代 Docker 来运行容器化的 Gateway 网关
summary: 在无根 Podman 容器中运行 OpenClaw
title: Podman
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: 3f64142b55285493d68c567fc4cce1b5e745226f6eaa4ea77da44f2b74daaa10
  source_path: install/podman.md
  workflow: 15
---

# Podman

在无根 Podman 容器中运行 OpenClaw Gateway 网关，由当前非 root 用户管理。

预期模型：

- Podman 运行 Gateway 网关容器。
- 你的主机 `openclaw` CLI 是控制平面。
- 持久状态默认存储在主机的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...`，而不是 `sudo -u openclaw`、`podman exec` 或单独的服务用户。

## 要求

- **Podman** 无根模式
- **OpenClaw CLI** 安装在主机上
- **可选：** `systemd --user`，如果你想要 Quadlet 管理的自动启动
- **可选：** `sudo`，仅当你想在无头主机上通过 `loginctl enable-linger "$(whoami)"` 实现开机持久化时

## 快速开始

<Steps>
  <Step title="一次性设置">
    从仓库根目录运行 `./scripts/podman/setup.sh`。
  </Step>

  <Step title="启动 Gateway 网关容器">
    使用 `./scripts/run-openclaw-podman.sh launch` 启动容器。
  </Step>

  <Step title="在容器内运行新手引导">
    运行 `./scripts/run-openclaw-podman.sh launch setup`，然后打开 `http://127.0.0.1:18789/`。
  </Step>

  <Step title="通过主机 CLI 管理运行中的容器">
    设置 `OPENCLAW_CONTAINER=openclaw`，然后从主机使用普通的 `openclaw` 命令。
  </Step>
</Steps>

设置详情：

- `./scripts/podman/setup.sh` 默认在你的无根 Podman 存储中构建 `openclaw:local`，或者如果你设置了 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE`，则使用该镜像。
- 如果不存在，它会创建带有 `gateway.mode: "local"` 的 `~/.openclaw/openclaw.json`。
- 如果不存在，它会创建带有 `OPENCLAW_GATEWAY_TOKEN` 的 `~/.openclaw/.env`。
- 对于手动启动，辅助脚本只从 `~/.openclaw/.env` 读取 Podman 相关键的小型允许列表，并向容器传递显式运行时环境变量；它不会将完整的 env 文件传给 Podman。

Quadlet 管理的设置：

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet 是仅限 Linux 的选项，因为它依赖 systemd 用户服务。

你也可以设置 `OPENCLAW_PODMAN_QUADLET=1`。

可选的构建/设置环境变量：

- `OPENCLAW_IMAGE` 或 `OPENCLAW_PODMAN_IMAGE` -- 使用现有/已拉取的镜像而不是构建 `openclaw:local`
- `OPENCLAW_DOCKER_APT_PACKAGES` -- 在镜像构建时安装额外的 apt 包
- `OPENCLAW_EXTENSIONS` -- 在构建时预安装扩展依赖

容器启动：

```bash
./scripts/run-openclaw-podman.sh launch
```

该脚本以你当前的 uid/gid 使用 `--userns=keep-id` 启动容器，并将你的 OpenClaw 状态绑定挂载到容器中。

新手引导：

```bash
./scripts/run-openclaw-podman.sh launch setup
```

然后打开 `http://127.0.0.1:18789/` 并使用来自 `~/.openclaw/.env` 的令牌。

主机 CLI 默认值：

```bash
export OPENCLAW_CONTAINER=openclaw
```

然后以下这类命令将自动在该容器内运行：

```bash
openclaw dashboard --no-open
openclaw gateway status --deep
openclaw doctor
openclaw channels login
```

在 macOS 上，Podman machine 可能使浏览器对 Gateway 网关显示为非本地。如果控制 UI 在启动后报告设备认证错误，优先使用 [macOS Podman SSH 隧道](#macos-podman-ssh-tunnel) 中的 SSH 隧道流程。对于远程 HTTPS 访问，使用 [Podman + Tailscale](#podman--tailscale) 中的 Tailscale 指南。

## macOS Podman SSH 隧道

在 macOS 上，即使发布的端口仅在 `127.0.0.1` 上，Podman machine 也可能使浏览器对 Gateway 网关显示为非本地。

对于本地浏览器访问，使用 SSH 隧道进入 Podman VM 并打开隧道 localhost 端口。

推荐的本地隧道端口：

- Mac 主机上的 `28889`
- 转发到 Podman VM 内的 `127.0.0.1:18789`

在单独的终端中启动隧道：

```bash
ssh -N \
  -i ~/.local/share/containers/podman/machine/machine \
  -p <podman-vm-ssh-port> \
  -L 28889:127.0.0.1:18789 \
  core@127.0.0.1
```

在该命令中，`<podman-vm-ssh-port>` 是 Mac 主机上 Podman VM 的 SSH 端口。用以下命令检查你当前的值：

```bash
podman system connection list
```

一次性允许隧道浏览器源。这是你第一次使用隧道时必须的步骤，因为启动器可以自动种植 Podman 发布的端口，但它无法推断你选择的浏览器隧道端口：

```bash
OPENCLAW_CONTAINER=openclaw openclaw config set gateway.controlUi.allowedOrigins \
  '["http://127.0.0.1:18789","http://localhost:18789","http://127.0.0.1:28889","http://localhost:28889"]' \
  --strict-json
podman restart openclaw
```

这是默认 `28889` 隧道的一次性步骤。

然后打开：

```text
http://127.0.0.1:28889/
```

注意事项：

- `18789` 通常已被 Mac 主机上 Podman 发布的 Gateway 网关端口占用，因此隧道使用 `28889` 作为本地浏览器端口。
- 如果 UI 要求配对批准，优先使用显式容器目标或显式 URL 命令，避免主机 CLI 回退到本地配对文件：

```bash
openclaw --container openclaw devices list
openclaw --container openclaw devices approve --latest
```

- 等价的显式 URL 形式：

```bash
openclaw devices list \
  --url ws://127.0.0.1:28889 \
  --token "$(sed -n 's/^OPENCLAW_GATEWAY_TOKEN=//p' ~/.openclaw/.env | head -n1)"
```

<a id="podman--tailscale"></a>

## Podman + Tailscale

对于 HTTPS 或远程浏览器访问，请参阅主要的 Tailscale 文档。

Podman 特定说明：

- 将 Podman 发布主机保持在 `127.0.0.1`。
- 优先使用主机管理的 `tailscale serve`，而不是 `openclaw gateway --tailscale serve`。
- 对于无需 HTTPS 的本地 macOS 浏览器访问，优先使用上面的 SSH 隧道部分。

参阅：

- [Tailscale](/gateway/tailscale)
- [控制 UI](/web/control-ui)

## Systemd（Quadlet，可选）

如果你运行了 `./scripts/podman/setup.sh --quadlet`，设置会在以下位置安装 Quadlet 文件：

```bash
~/.config/containers/systemd/openclaw.container
```

常用命令：

- **启动：** `systemctl --user start openclaw.service`
- **停止：** `systemctl --user stop openclaw.service`
- **状态：** `systemctl --user status openclaw.service`
- **日志：** `journalctl --user -u openclaw.service -f`

编辑 Quadlet 文件后：

```bash
systemctl --user daemon-reload
systemctl --user restart openclaw.service
```

对于 SSH/无头主机上的开机持久化，为你的当前用户启用 lingering：

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 配置、环境和存储

- **配置目录：** `~/.openclaw`
- **工作区目录：** `~/.openclaw/workspace`
- **令牌文件：** `~/.openclaw/.env`
- **启动辅助脚本：** `./scripts/run-openclaw-podman.sh`

启动脚本和 Quadlet 将主机状态绑定挂载到容器中：

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

默认情况下，这些是主机目录，而不是匿名的容器状态，因此配置和工作区在容器替换后仍然存在。Podman 设置还为发布的 Gateway 网关端口上的 `127.0.0.1` 和 `localhost` 预置 `gateway.controlUi.allowedOrigins`，以便本地仪表板与容器的非回环绑定配合使用。

手动启动器的有用环境变量：

- `OPENCLAW_PODMAN_CONTAINER` -- 容器名称（默认 `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 要运行的镜像
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- 映射到容器 `18789` 的主机端口
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- 映射到容器 `18790` 的主机端口
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 发布端口的主机接口；默认为 `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- 容器内的 Gateway 网关绑定模式；默认为 `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`（默认）、`auto` 或 `host`

手动启动器在最终确定容器/镜像默认值之前读取 `~/.openclaw/.env`，因此你可以在那里持久化这些设置。

如果你使用非默认的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，请为 `./scripts/podman/setup.sh` 和后续的 `./scripts/run-openclaw-podman.sh launch` 命令设置相同的变量。仓库本地启动器不会跨 shell 持久化自定义路径覆盖。

Quadlet 说明：

- 生成的 Quadlet 服务有意保持固定的、加固的默认形状：`127.0.0.1` 发布端口、容器内的 `--bind lan` 以及 `keep-id` 用户命名空间。
- 它仍然从 `~/.openclaw/.env` 读取 Gateway 网关运行时环境（如 `OPENCLAW_GATEWAY_TOKEN`），但不使用手动启动器的 Podman 特定覆盖允许列表。
- 如果你需要自定义发布端口、发布主机或其他容器运行标志，请使用手动启动器或直接编辑 `~/.config/containers/systemd/openclaw.container`，然后重新加载并重启服务。

## 常用命令

- **容器日志：** `podman logs -f openclaw`
- **停止容器：** `podman stop openclaw`
- **移除容器：** `podman rm -f openclaw`
- **从主机 CLI 打开仪表板 URL：** `openclaw dashboard --no-open`
- **通过主机 CLI 进行健康/状态检查：** `openclaw gateway status --deep`

## 故障排除

- **配置或工作区上的权限被拒绝（EACCES）：** 容器默认以 `--userns=keep-id` 和 `--user <你的uid>:<你的gid>` 运行。确保主机配置/工作区路径由你的当前用户拥有。
- **Gateway 网关启动被阻止（缺少 `gateway.mode=local`）：** 确保 `~/.openclaw/openclaw.json` 存在并设置了 `gateway.mode="local"`。`scripts/podman/setup.sh` 在缺失时会创建此文件。
- **容器 CLI 命令访问了错误的目标：** 明确使用 `openclaw --container <name> ...`，或在你的 shell 中导出 `OPENCLAW_CONTAINER=<name>`。
- **`openclaw update` 在 `--container` 下失败：** 这是预期行为。重新构建/拉取镜像，然后重启容器或 Quadlet 服务。
- **Quadlet 服务无法启动：** 运行 `systemctl --user daemon-reload`，然后运行 `systemctl --user start openclaw.service`。在无头系统上，你可能还需要 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 阻止绑定挂载：** 保持默认挂载行为不变；当 SELinux 处于强制或宽容模式时，启动器在 Linux 上自动添加 `:Z`。

## 相关内容

- [Docker](/install/docker)
- [Gateway 网关后台进程](/gateway/background-process)
- [Gateway 网关故障排除](/gateway/troubleshooting)
