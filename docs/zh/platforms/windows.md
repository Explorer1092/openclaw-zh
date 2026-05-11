---
title: "Windows"
sidebarTitle: "Windows"
mmh3_hash: "51220c54b2990253892e8bdc6e207595"
summary: "Windows 支持：原生和 WSL2 安装路径、守护进程及当前注意事项"
read_when:
  - 在 Windows 上安装 OpenClaw
  - 在原生 Windows 和 WSL2 之间选择
  - 查找 Windows 配套应用状态
---

OpenClaw 同时支持**原生 Windows** 和 **WSL2**。WSL2 是更稳定的路径，推荐用于完整体验——CLI、Gateway 和工具链在 Linux 内部运行，具有完整的兼容性。原生 Windows 适用于核心 CLI 和 Gateway 使用，但有以下注意事项。

原生 Windows 配套应用已在计划中。

## WSL2（推荐）

- [入门](/start/getting-started)（在 WSL 内使用）
- [安装和更新](/install/updating)
- 官方 WSL2 指南（Microsoft）：[https://learn.microsoft.com/windows/wsl/install](https://learn.microsoft.com/windows/wsl/install)

## 原生 Windows 状态

原生 Windows CLI 流程正在改进，但 WSL2 仍然是推荐路径。

今天在原生 Windows 上运行良好的内容：

- 通过 `install.ps1` 的网站安装程序
- 本地 CLI 使用，如 `openclaw --version`、`openclaw doctor` 和 `openclaw plugins list --json`
- 嵌入式本地 agent/provider 冒烟测试，如：

```powershell
openclaw agent --local --agent main --thinking low -m "Reply with exactly WINDOWS-HATCH-OK."
```

当前注意事项：

- `openclaw onboard --non-interactive` 仍然期望可达的本地 gateway，除非你传递 `--skip-health`
- `openclaw onboard --non-interactive --install-daemon` 和 `openclaw gateway install` 首先尝试 Windows 计划任务
- 如果计划任务创建被拒绝，OpenClaw 回退到每用户 Startup 文件夹登录项并立即启动 gateway
- 如果 `schtasks` 本身卡住或停止响应，OpenClaw 现在会快速中止该路径并回退，而不是永远挂起
- 计划任务在可用时仍然是首选，因为它们提供更好的 supervisor 状态

如果你只想要原生 CLI，不安装 gateway 服务，使用以下之一：

```powershell
openclaw onboard --non-interactive --skip-health
openclaw gateway run
```

如果你确实想要在原生 Windows 上的托管启动：

```powershell
openclaw gateway install
openclaw gateway status --json
```

如果计划任务创建被阻止，备用服务模式仍然通过当前用户的 Startup 文件夹在登录后自动启动。

## Gateway

- [Gateway 手册](/gateway)
- [配置](/gateway/configuration)

## Gateway 服务安装（CLI）

在 WSL2 内：

```
openclaw onboard --install-daemon
```

或：

```
openclaw gateway install
```

或：

```
openclaw configure
```

在提示时选择 **Gateway service**。

修复/迁移：

```
openclaw doctor
```

## Windows 登录前自动启动 Gateway

对于无头设置，确保即使没有人登录 Windows，完整的启动链也会运行。

### 1) 无需登录保持用户服务运行

在 WSL 内：

```bash
sudo loginctl enable-linger "$(whoami)"
```

### 2) 安装 OpenClaw gateway 用户服务

在 WSL 内：

```bash
openclaw gateway install
```

### 3) 在 Windows 启动时自动启动 WSL

以管理员身份在 PowerShell 中：

```powershell
schtasks /create /tn "WSL Boot" /tr "wsl.exe -d Ubuntu --exec /bin/true" /sc onstart /ru SYSTEM
```

将 `Ubuntu` 替换为你的发行版名称：

```powershell
wsl --list --verbose
```

### 验证启动链

重启后（Windows 登录前），从 WSL 检查：

```bash
systemctl --user is-enabled openclaw-gateway.service
systemctl --user status openclaw-gateway.service --no-pager
```

## 高级：通过 LAN 暴露 WSL 服务（portproxy）

WSL 有自己的虚拟网络。如果另一台机器需要访问在 **WSL 内部**运行的服务（SSH、本地 TTS 服务器或 Gateway），你必须将 Windows 端口转发到当前 WSL IP。WSL IP 在重启后会改变，所以你可能需要刷新转发规则。

示例（PowerShell **以管理员身份**）：

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

通过 Windows 防火墙允许端口（一次性）：

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL 重启后刷新 portproxy：

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

说明：

- 从另一台机器 SSH 以 **Windows 主机 IP** 为目标（示例：`ssh user@windows-host -p 2222`）。
- 远程节点必须指向**可达的** Gateway URL（不是 `127.0.0.1`）；使用 `openclaw status --all` 确认。
- 使用 `listenaddress=0.0.0.0` 进行局域网访问；`127.0.0.1` 仅保持本地。
- 如果你想自动化，注册一个计划任务在登录时运行刷新步骤。

## 逐步 WSL2 安装

### 1) 安装 WSL2 + Ubuntu

打开 PowerShell（管理员）：

```powershell
wsl --install
# 或明确选择发行版：
wsl --list --online
wsl --install -d Ubuntu-24.04
```

如果 Windows 要求，重启。

### 2) 启用 systemd（gateway 安装必需）

在你的 WSL 终端：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

然后从 PowerShell：

```powershell
wsl --shutdown
```

重新打开 Ubuntu，然后验证：

```bash
systemctl --user status
```

### 3) 安装 OpenClaw（在 WSL 内）

在 WSL 内按照 Linux 入门流程进行正常首次设置：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw onboard --install-daemon
```

如果你是从源码开发而不是首次引导，请使用 [设置](/start/setup) 中的源码开发循环：

```bash
pnpm install
# 仅首次运行（或重置本地 OpenClaw 配置/工作区后）
pnpm openclaw setup
pnpm gateway:watch
```

完整指南：[入门](/start/getting-started)

## Windows 配套应用

我们还没有 Windows 配套应用。如果你想贡献力量使其实现，欢迎贡献。

## Git 和 GitHub 连接（贡献者）

某些网络会阻止或限速到 GitHub 的 HTTPS 连接。如果 `git clone` 因超时或连接重置而失败，请尝试其他网络、VPN 或你的组织提供的 HTTP/HTTPS 代理。

如果 `gh auth login` 在浏览器设备流程中失败（例如访问 `github.com:443` 超时），请改用个人访问 token 进行认证：

1. 创建一个至少具有 `repo` scope（经典 PAT）或同等细粒度访问权限的 token。
2. 在 PowerShell 中针对当前会话：

```powershell
$env:GH_TOKEN="<your-token>"
gh auth status
gh auth setup-git
```

3. 如果 `gh auth status` 警告缺少 `read:org`，请创建包含该 scope 的 token 并重新赋值：

```powershell
$env:GH_TOKEN="<your-token-with-repo-and-read:org>"
gh auth status
```

`gh auth refresh -s read:org` 仅适用于通过 `gh auth login` 认证并有存储凭据可刷新的情况（而非使用 `GH_TOKEN` 时）。

切勿在 issue 或 pull request 中提交或粘贴 token。

## 相关文档

- [安装概述](/install)
- [平台](/platforms)
