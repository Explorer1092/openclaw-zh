---
title: "Windows (WSL2)"
sidebarTitle: "Windows"
mmh3_hash: "d8ea3e0a50e18f90ada6987a2f400811"
summary: "Windows（WSL2）支持 + 伴侣应用状态"
read_when:
  - 在 Windows 上安装 OpenClaw
  - 查找 Windows 伴侣应用状态
---

# Windows (WSL2)

Windows 上的 OpenClaw 推荐**通过 WSL2**（推荐 Ubuntu）。
CLI + Gateway 在 Linux 内部运行，这使运行时保持一致，并使工具更兼容（Node/Bun/pnpm、Linux 二进制文件、skills）。原生 Windows 可能更麻烦。WSL2 提供完整的 Linux 体验 — 一条命令安装：`wsl --install`。

原生 Windows 伴侣应用正在计划中。

## 安装（WSL2）

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
systemctl --user is-enabled openclaw-gateway
systemctl --user status openclaw-gateway --no-pager
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

在 WSL 内按照 Linux 入门流程：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # 首次运行时自动安装 UI 依赖
pnpm build
openclaw onboard
```

完整指南：[入门](/start/getting-started)

## Windows 伴侣应用

我们还没有 Windows 伴侣应用。如果你想贡献力量使其实现，欢迎贡献。
