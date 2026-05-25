---
mmh3_hash: "0ff4f4a02b3dec9192129585327cf04e"
summary: "在无根 Podman 容器中运行 OpenClaw"
read_when:
  - 你想使用 Podman 而不是 Docker 运行容器化 gateway
title: "Podman"
---

在无根 Podman 容器中运行 OpenClaw Gateway，由你当前的非 root 用户管理。

预期模型如下：

- Podman 运行 gateway 容器。
- 你的主机 `openclaw` CLI 是控制平面。
- 持久状态默认存储在主机的 `~/.openclaw` 下。
- 日常管理使用 `openclaw --container <name> ...` 而不是 `sudo -u openclaw`、`podman exec` 或单独的服务用户。

## 前提条件

- **Podman** 无根模式
- **OpenClaw CLI** 安装在主机上
- **可选：** `systemd --user`，如果你想要 Quadlet 管理的自动启动
- **可选：** `sudo`，仅当你想在无头主机上使用 `loginctl enable-linger "$(whoami)"` 实现开机持久化时

## 快速开始

<Steps>
  <Step title="一次性设置">
    在仓库根目录，运行 `./scripts/podman/setup.sh`。
  </Step>

  <Step title="启动 Gateway 容器">
    使用 `./scripts/run-openclaw-podman.sh launch` 启动容器。
  </Step>

  <Step title="在容器内运行引导">
    运行 `./scripts/run-openclaw-podman.sh launch setup`，然后打开 `http://127.0.0.1:18789/`。
  </Step>

  <Step title="从主机 CLI 管理运行中的容器">
    设置 `OPENCLAW_CONTAINER=openclaw`，然后从主机使用普通的 `openclaw` 命令。
  </Step>
</Steps>

设置详情：

- `./scripts/podman/setup.sh` 默认在你的无根 Podman 存储中构建 `openclaw:local`，或者如果你设置了 `OPENCLAW_IMAGE` / `OPENCLAW_PODMAN_IMAGE` 则使用该镜像。
- 如果 `~/.openclaw/openclaw.json` 不存在，它会创建该文件并设置 `gateway.mode: "local"`。
- 如果 `~/.openclaw/.env` 不存在，它会创建该文件并设置 `OPENCLAW_GATEWAY_TOKEN`。
- 对于手动启动，辅助脚本仅从 `~/.openclaw/.env` 中读取少量 Podman 相关密钥的允许列表，并将显式运行时环境变量传递给容器；它不会将完整的 env 文件交给 Podman。

Quadlet 管理的设置：

```bash
./scripts/podman/setup.sh --quadlet
```

Quadlet 是仅 Linux 的选项，因为它依赖 systemd 用户服务。

你也可以设置 `OPENCLAW_PODMAN_QUADLET=1`。

可选的构建/设置环境变量：

- `OPENCLAW_IMAGE` 或 `OPENCLAW_PODMAN_IMAGE` -- 使用现有/已拉取的镜像而不是构建 `openclaw:local`
- `OPENCLAW_IMAGE_APT_PACKAGES` -- 在镜像构建期间安装额外的 apt 包（也接受旧版 `OPENCLAW_DOCKER_APT_PACKAGES`）
- `OPENCLAW_IMAGE_PIP_PACKAGES` -- 在镜像构建期间安装额外的 Python 包；请固定版本并仅使用你信任的包索引
- `OPENCLAW_EXTENSIONS` -- 在构建时预安装 plugin 依赖项
- `OPENCLAW_INSTALL_BROWSER` -- 为浏览器自动化预安装 Chromium 和 Xvfb（设置为 `1` 启用）

容器启动：

```bash
./scripts/run-openclaw-podman.sh launch
```

脚本以你当前的 uid/gid 启动容器，使用 `--userns=keep-id` 并将你的 OpenClaw 状态绑定挂载到容器中。

引导：

```bash
./scripts/run-openclaw-podman.sh launch setup
```

然后打开 `http://127.0.0.1:18789/` 并使用 `~/.openclaw/.env` 中的令牌。

主机 CLI 默认：

```bash
export OPENCLAW_CONTAINER=openclaw
```

然后以下命令将自动在该容器内运行：

```bash
openclaw dashboard --no-open
openclaw gateway status --deep   # 包含额外的服务扫描
openclaw doctor
openclaw channels login
```

在 macOS 上，Podman machine 可能会让浏览器对 gateway 显示为非本地。
如果控制 UI 在启动后报告设备认证错误，请使用
[Podman 与 Tailscale](#podman--tailscale) 中的 Tailscale 指南。

<a id="podman--tailscale"></a>

## Podman 与 Tailscale

对于 HTTPS 或远程浏览器访问，请遵循主要的 Tailscale 文档。

Podman 特定说明：

- 将 Podman 发布主机保持在 `127.0.0.1`。
- 优先使用主机管理的 `tailscale serve` 而不是 `openclaw gateway --tailscale serve`。
- 在 macOS 上，如果本地浏览器设备认证上下文不可靠，请使用 Tailscale 访问而不是临时本地隧道变通方案。

参见：

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

要在 SSH/无头主机上实现开机持久化，请为当前用户启用 linger：

```bash
sudo loginctl enable-linger "$(whoami)"
```

## 配置、环境变量和存储

- **配置目录：** `~/.openclaw`
- **工作区目录：** `~/.openclaw/workspace`
- **令牌文件：** `~/.openclaw/.env`
- **启动辅助脚本：** `./scripts/run-openclaw-podman.sh`

启动脚本和 Quadlet 将主机状态绑定挂载到容器中：

- `OPENCLAW_CONFIG_DIR` -> `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR` -> `/home/node/.openclaw/workspace`

默认情况下，这些是主机目录，而不是匿名容器状态，因此
`openclaw.json`、每个 agent 的 `auth-profiles.json`、channel/provider 状态、
session 和工作区在容器替换后仍然存在。
Podman 设置还为已发布的 gateway 端口上的 `127.0.0.1` 和 `localhost` 设置 `gateway.controlUi.allowedOrigins`，以便本地 dashboard 与容器的非回环绑定一起工作。

手动启动器的常用环境变量：

- `OPENCLAW_PODMAN_CONTAINER` -- 容器名称（默认为 `openclaw`）
- `OPENCLAW_PODMAN_IMAGE` / `OPENCLAW_IMAGE` -- 要运行的镜像
- `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` -- 映射到容器 `18789` 的主机端口
- `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` -- 映射到容器 `18790` 的主机端口
- `OPENCLAW_PODMAN_PUBLISH_HOST` -- 已发布端口的主机接口；默认为 `127.0.0.1`
- `OPENCLAW_GATEWAY_BIND` -- 容器内的 gateway 绑定模式；默认为 `lan`
- `OPENCLAW_PODMAN_USERNS` -- `keep-id`（默认）、`auto` 或 `host`

手动启动器在确定容器/镜像默认值之前会读取 `~/.openclaw/.env`，因此你可以将这些变量持久保存在那里。

如果你使用非默认的 `OPENCLAW_CONFIG_DIR` 或 `OPENCLAW_WORKSPACE_DIR`，请为 `./scripts/podman/setup.sh` 和后续的 `./scripts/run-openclaw-podman.sh launch` 命令设置相同的变量。仓库本地启动器不会跨 shell 持久保存自定义路径覆盖。

Quadlet 说明：

- 生成的 Quadlet 服务有意保持固定的、加固的默认形态：`127.0.0.1` 发布端口、容器内的 `--bind lan`，以及 `keep-id` 用户命名空间。
- 它固定了 `OPENCLAW_NO_RESPAWN=1`、`Restart=on-failure` 和 `TimeoutStartSec=300`。
- 它发布了 `127.0.0.1:18789:18789`（gateway）和 `127.0.0.1:18790:18790`（bridge）。
- 它将 `~/.openclaw/.env` 作为运行时 `EnvironmentFile` 读取 `OPENCLAW_GATEWAY_TOKEN` 等值，但不使用手动启动器的 Podman 特定覆盖允许列表。
- 如果你需要自定义发布端口、发布主机或其他容器运行标志，请使用手动启动器或直接编辑 `~/.config/containers/systemd/openclaw.container`，然后重新加载并重启服务。

## 常用命令

- **容器日志：** `podman logs -f openclaw`
- **停止容器：** `podman stop openclaw`
- **删除容器：** `podman rm -f openclaw`
- **从主机 CLI 打开 dashboard URL：** `openclaw dashboard --no-open`
- **通过主机 CLI 进行健康/状态检查：** `openclaw gateway status --deep`（RPC 探测 + 额外服务扫描）

## 故障排除

- **配置或工作区权限被拒绝（EACCES）：** 容器默认使用 `--userns=keep-id` 和 `--user <你的 uid>:<你的 gid>` 运行。确保主机配置/工作区路径由你的当前用户拥有。
- **Gateway 启动被阻止（缺少 `gateway.mode=local`）：** 确保 `~/.openclaw/openclaw.json` 存在并设置了 `gateway.mode="local"`。`scripts/podman/setup.sh` 会在缺失时创建此文件。
- **容器 CLI 命令指向错误目标：** 明确使用 `openclaw --container <name> ...`，或在 shell 中导出 `OPENCLAW_CONTAINER=<name>`。
- **`openclaw update` 与 `--container` 一起失败：** 这是预期行为。重新构建/拉取镜像，然后重启容器或 Quadlet 服务。
- **Quadlet 服务无法启动：** 运行 `systemctl --user daemon-reload`，然后 `systemctl --user start openclaw.service`。在无头系统上，你可能还需要 `sudo loginctl enable-linger "$(whoami)"`。
- **SELinux 阻止绑定挂载：** 不要修改默认挂载行为；当 SELinux 处于强制或宽容模式时，启动器会在 Linux 上自动添加 `:Z`。

## 相关

- [Docker](/install/docker)
- [Gateway 后台进程](/gateway/background-process)
- [Gateway 故障排除](/gateway/troubleshooting)
