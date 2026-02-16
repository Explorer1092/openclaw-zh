---
title: "Windows (WSL2)"
sidebarTitle: "Windows"
mmh3_hash: "c55c0a841c5a3c3aef1d4dafe97685fb"
summary: "Windows(WSL2)支持 + 配套应用状态"
read_when: ["在 Windows 上安装 OpenClaw","寻找 Windows 配套应用状态"]
---
# Windows (WSL2)

推荐**通过 WSL2**(推荐 Ubuntu)在 Windows 上运行 OpenClaw。CLI + 网关在
Linux 内部运行,这保持了运行时的一致性,并使工具更加兼容(Node/Bun/pnpm、
Linux 二进制文件、技能)。原生 Windows 可能更棘手。WSL2 提供完整的 Linux 体验 —
一条命令安装:`wsl --install`。

计划推出原生 Windows 配套应用。

## 安装(WSL2)
- [入门指南](/start/getting-started)(在 WSL 内使用)
- [安装和更新](/install/updating)
- 官方 WSL2 指南(Microsoft):https://learn.microsoft.com/windows/wsl/install

## 网关
- [网关运行手册](/gateway)
- [配置](/gateway/configuration)

## 网关服务安装(CLI)

在 WSL2 内部:

```
openclaw onboard --install-daemon
```

或:

```
openclaw gateway install
```

或:

```
openclaw configure
```

提示时选择 **Gateway service**。

修复/迁移:

```
openclaw doctor
```

## 高级:通过局域网公开 WSL 服务(portproxy)

WSL 有自己的虚拟网络。如果另一台机器需要访问**在 WSL 内**运行的服务
(SSH、本地 TTS 服务器或网关),你必须将 Windows 端口转发到当前的 WSL IP。
WSL IP 在重启后会更改,因此你可能需要刷新转发规则。

示例(PowerShell **以管理员身份**):

```powershell
$Distro = "Ubuntu-24.04"
$ListenPort = 2222
$TargetPort = 22

$WslIp = (wsl -d $Distro -- hostname -I).Trim().Split(" ")[0]
if (-not $WslIp) { throw "WSL IP not found." }

netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$ListenPort `
  connectaddress=$WslIp connectport=$TargetPort
```

通过 Windows 防火墙允许该端口(一次性):

```powershell
New-NetFirewallRule -DisplayName "WSL SSH $ListenPort" -Direction Inbound `
  -Protocol TCP -LocalPort $ListenPort -Action Allow
```

WSL 重启后刷新 portproxy:

```powershell
netsh interface portproxy delete v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 | Out-Null
netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=0.0.0.0 `
  connectaddress=$WslIp connectport=$TargetPort | Out-Null
```

注意:
- 从另一台机器 SSH 目标是 **Windows 主机 IP**(示例:`ssh user@windows-host -p 2222`)。
- 远程节点必须指向**可访问的**网关 URL(不是 `127.0.0.1`);
  使用 `openclaw status --all` 确认。
- 使用 `listenaddress=0.0.0.0` 进行局域网访问;`127.0.0.1` 仅保持本地。
- 如果你想要这个自动化,注册一个计划任务以在登录时运行刷新步骤。

## 逐步 WSL2 安装

### 1) 安装 WSL2 + Ubuntu

打开 PowerShell(管理员):

```powershell
wsl --install
# 或明确选择一个发行版:
wsl --list --online
wsl --install -d Ubuntu-24.04
```

如果 Windows 要求,请重启。

### 2) 启用 systemd(网关安装所需)

在你的 WSL 终端中:

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[boot]
systemd=true
EOF
```

然后从 PowerShell:

```powershell
wsl --shutdown
```

重新打开 Ubuntu,然后验证:

```bash
systemctl --user status
```

### 3) 安装 OpenClaw(在 WSL 内)

在 WSL 内按照 Linux 入门流程操作:

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # 首次运行时自动安装 UI 依赖项
pnpm build
openclaw onboard
```

完整指南:[入门指南](/start/getting-started)

## Windows 配套应用

我们还没有 Windows 配套应用。如果你想促成它,欢迎贡献。
