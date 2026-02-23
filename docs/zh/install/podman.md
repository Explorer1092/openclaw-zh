---
mmh3_hash: "db9f251dcea2675fa750c0fa435f9c23"
summary: "在无根 Podman 容器中运行 OpenClaw"
read_when:
  - 您想要使用 Podman 而不是 Docker 的容器化 Gateway
title: "Podman"
---

# Podman

在**无根** Podman 容器中运行 OpenClaw Gateway。使用与 Docker 相同的镜像（从仓库 [Dockerfile](https://github.com/openclaw/openclaw/blob/main/Dockerfile) 构建）。

## 要求

- Podman（无根）
- Sudo 用于一次性设置（创建用户、构建镜像）

## 快速开始

**1. 一次性设置**（从仓库根目录；创建用户、构建镜像、安装启动脚本）：

```bash
./setup-podman.sh
```

这还会创建一个最小的 `~openclaw/.openclaw/openclaw.json`（设置 `gateway.mode="local"`），以便 Gateway 可以在不运行向导的情况下启动。

默认情况下，容器**不**作为 systemd 服务安装，您手动启动它（见下文）。对于具有自动启动和重启的生产式设置，请将其安装为 systemd Quadlet 用户服务：

```bash
./setup-podman.sh --quadlet
```

（或设置 `OPENCLAW_PODMAN_QUADLET=1`；使用 `--container` 仅安装容器和启动脚本。）

**2. 启动 Gateway**（手动，用于快速冒烟测试）：

```bash
./scripts/run-openclaw-podman.sh launch
```

**3. 引导向导**（例如添加 Channels 或 Providers）：

```bash
./scripts/run-openclaw-podman.sh launch setup
```

然后打开 `http://127.0.0.1:18789/` 并使用 `~openclaw/.openclaw/.env` 中的令牌（或设置打印的值）。

## Systemd（Quadlet，可选）

如果您运行了 `./setup-podman.sh --quadlet`（或 `OPENCLAW_PODMAN_QUADLET=1`），则会安装 [Podman Quadlet](https://docs.podman.io/en/latest/markdown/podman-systemd.unit.5.html) 单元，以便 Gateway 作为 openclaw 用户的 systemd 用户服务运行。该服务在设置结束时启用并启动。

- **启动：** `sudo systemctl --machine openclaw@ --user start openclaw.service`
- **停止：** `sudo systemctl --machine openclaw@ --user stop openclaw.service`
- **状态：** `sudo systemctl --machine openclaw@ --user status openclaw.service`
- **日志：** `sudo journalctl --machine openclaw@ --user -u openclaw.service -f`

Quadlet 文件位于 `~openclaw/.config/containers/systemd/openclaw.container`。要更改端口或环境，请编辑该文件（或它获取的 `.env`），然后 `sudo systemctl --machine openclaw@ --user daemon-reload` 并重启服务。在启动时，如果为 openclaw 启用了 lingering，服务会自动启动（设置在 loginctl 可用时执行此操作）。

要在最初未使用它的设置**之后**添加 Quadlet，请重新运行：`./setup-podman.sh --quadlet`。

## openclaw 用户（非登录）

`setup-podman.sh` 创建一个专用系统用户 `openclaw`：

- **Shell：** `nologin` — 无交互式登录；减少攻击面。
- **主目录：** 例如 `/home/openclaw` — 保存 `~/.openclaw`（配置、工作空间）和启动脚本 `run-openclaw-podman.sh`。
- **无根 Podman：** 用户必须有一个 **subuid** 和 **subgid** 范围。许多发行版在创建用户时会自动分配这些。如果设置打印警告，请向 `/etc/subuid` 和 `/etc/subgid` 添加行：

  ```text
  openclaw:100000:65536
  ```

  然后以该用户身份启动 Gateway（例如从 cron 或 systemd）：

  ```bash
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh
  sudo -u openclaw /home/openclaw/run-openclaw-podman.sh setup
  ```

- **配置：** 只有 `openclaw` 和 root 可以访问 `/home/openclaw/.openclaw`。要编辑配置：一旦 Gateway 运行，使用 Control UI，或 `sudo -u openclaw $EDITOR /home/openclaw/.openclaw/openclaw.json`。

## 环境和配置

- **令牌：** 存储在 `~openclaw/.openclaw/.env` 中作为 `OPENCLAW_GATEWAY_TOKEN`。`setup-podman.sh` 和 `run-openclaw-podman.sh` 如果缺失则生成它（使用 `openssl`、`python3` 或 `od`）。
- **可选：** 在该 `.env` 中，您可以设置 Provider 密钥（例如 `GROQ_API_KEY`、`OLLAMA_API_KEY`）和其他 OpenClaw 环境变量。
- **主机端口：** 默认情况下，脚本映射 `18789`（Gateway）和 `18790`（桥接）。在启动时使用 `OPENCLAW_PODMAN_GATEWAY_HOST_PORT` 和 `OPENCLAW_PODMAN_BRIDGE_HOST_PORT` 覆盖**主机**端口映射。
- **路径：** 主机配置和工作空间默认为 `~openclaw/.openclaw` 和 `~openclaw/.openclaw/workspace`。使用 `OPENCLAW_CONFIG_DIR` 和 `OPENCLAW_WORKSPACE_DIR` 覆盖启动脚本使用的主机路径。

## 有用的命令

- **日志：** 使用 Quadlet：`sudo journalctl --machine openclaw@ --user -u openclaw.service -f`。使用脚本：`sudo -u openclaw podman logs -f openclaw`
- **停止：** 使用 Quadlet：`sudo systemctl --machine openclaw@ --user stop openclaw.service`。使用脚本：`sudo -u openclaw podman stop openclaw`
- **再次启动：** 使用 Quadlet：`sudo systemctl --machine openclaw@ --user start openclaw.service`。使用脚本：重新运行启动脚本或 `podman start openclaw`
- **删除容器：** `sudo -u openclaw podman rm -f openclaw` — 主机上的配置和工作空间被保留

## 故障排除

- **配置或 auth-profiles 上的权限被拒绝（EACCES）：** 容器默认为 `--userns=keep-id` 并以与运行脚本的主机用户相同的 uid/gid 运行。确保您的主机 `OPENCLAW_CONFIG_DIR` 和 `OPENCLAW_WORKSPACE_DIR` 由该用户拥有。
- **Gateway 启动被阻止（缺少 `gateway.mode=local`）：** 确保 `~openclaw/.openclaw/openclaw.json` 存在并设置 `gateway.mode="local"`。如果缺失，`setup-podman.sh` 会创建此文件。
- **用户 openclaw 的无根 Podman 失败：** 检查 `/etc/subuid` 和 `/etc/subgid` 是否包含 `openclaw` 的行（例如 `openclaw:100000:65536`）。如果缺失则添加并重启。
- **容器名称正在使用：** 启动脚本使用 `podman run --replace`，因此当您再次启动时，现有容器会被替换。要手动清理：`podman rm -f openclaw`。
- **作为 openclaw 运行时找不到脚本：** 确保运行了 `setup-podman.sh`，以便 `run-openclaw-podman.sh` 被复制到 openclaw 的主目录（例如 `/home/openclaw/run-openclaw-podman.sh`）。
- **Quadlet 服务未找到或无法启动：** 编辑 `.container` 文件后运行 `sudo systemctl --machine openclaw@ --user daemon-reload`。Quadlet 需要 cgroups v2：`podman info --format '{{.Host.CgroupsVersion}}'` 应显示 `2`。

## 可选：以您自己的用户身份运行

要以您的普通用户（无专用 openclaw 用户）身份运行 Gateway：构建镜像，使用 `OPENCLAW_GATEWAY_TOKEN` 创建 `~/.openclaw/.env`，并使用 `--userns=keep-id` 和挂载到您的 `~/.openclaw` 来运行容器。启动脚本专为 openclaw 用户流程设计；对于单用户设置，您可以手动运行脚本中的 `podman run` 命令，将配置和工作空间指向您的主目录。推荐给大多数用户：使用 `setup-podman.sh` 并以 openclaw 用户身份运行，以便配置和进程被隔离。
