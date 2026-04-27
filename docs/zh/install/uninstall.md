---
mmh3_hash: "7d9bb4429589c0369a54bb33d656bdf1"
title: "卸载"
sidebarTitle: "卸载"
summary: "完全卸载 OpenClaw (CLI, 服务, 状态, 工作区)"
read_when:
  - 你想从机器上删除 OpenClaw
  - 卸载后 gateway 服务仍在运行
---

两条路径：

- **简单路径** — 如果 `openclaw` 仍已安装。
- **手动服务删除** — 如果 CLI 已消失但服务仍在运行。

## 简单路径（CLI 仍已安装）

推荐：使用内置卸载器：

```bash
openclaw uninstall
```

非交互式（自动化 / npx）：

```bash
openclaw uninstall --all --yes --non-interactive
npx -y openclaw uninstall --all --yes --non-interactive
```

手动步骤（结果相同）：

1. 停止 gateway 服务：

```bash
openclaw gateway stop
```

2. 卸载 gateway 服务（launchd/systemd/schtasks）：

```bash
openclaw gateway uninstall
```

3. 删除状态 + 配置：

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}"
```

如果你将 `OPENCLAW_CONFIG_PATH` 设置为状态目录之外的自定义位置，也请删除该文件。

4. 删除你的工作区（可选，删除 agent 文件）：

```bash
rm -rf ~/.openclaw/workspace
```

5. 删除 CLI 安装（选择你使用的那个）：

```bash
npm rm -g openclaw
pnpm remove -g openclaw
bun remove -g openclaw
```

6. 如果你安装了 macOS 应用：

```bash
rm -rf /Applications/OpenClaw.app
```

注意：

- 如果你使用了配置文件（`--profile` / `OPENCLAW_PROFILE`），对每个状态目录重复步骤 3（默认为 `~/.openclaw-<profile>`）。
- 在远程模式下，状态目录位于 **gateway 主机**上，因此也在那里运行步骤 1-4。

## 手动服务删除（CLI 未安装）

如果 gateway 服务继续运行但 `openclaw` 已丢失，请使用此方法。

### macOS (launchd)

默认标签为 `ai.openclaw.gateway`（或 `ai.openclaw.<profile>`；旧版 `com.openclaw.*` 可能仍然存在）：

```bash
launchctl bootout gui/$UID/ai.openclaw.gateway
rm -f ~/Library/LaunchAgents/ai.openclaw.gateway.plist
```

如果你使用了配置文件，请将标签和 plist 名称替换为 `ai.openclaw.<profile>`。如果存在旧版 `com.openclaw.*` plist，请删除它们。

### Linux (systemd 用户单元)

默认单元名称为 `openclaw-gateway.service`（或 `openclaw-gateway-<profile>.service`）：

```bash
systemctl --user disable --now openclaw-gateway.service
rm -f ~/.config/systemd/user/openclaw-gateway.service
systemctl --user daemon-reload
```

### Windows（计划任务）

默认任务名称为 `OpenClaw Gateway`（或 `OpenClaw Gateway (<profile>)`）。
任务脚本位于你的状态目录下。

```powershell
schtasks /Delete /F /TN "OpenClaw Gateway"
Remove-Item -Force "$env:USERPROFILE\.openclaw\gateway.cmd"
```

如果你使用了配置文件，请删除匹配的任务名称和 `~\.openclaw-<profile>\gateway.cmd`。

## 正常安装 vs 源码检出

### 正常安装（install.sh / npm / pnpm / bun）

如果你使用了 `https://openclaw.ai/install.sh` 或 `install.ps1`，CLI 是用 `npm install -g openclaw@latest` 安装的。
用 `npm rm -g openclaw` 删除它（如果那样安装的，则用 `pnpm remove -g` / `bun remove -g`）。

### 源码检出（git clone）

如果你从仓库检出运行（`git clone` + `openclaw ...` / `bun run openclaw ...`）：

1. 在删除仓库**之前**卸载 gateway 服务（使用上面的简单路径或手动服务删除）。
2. 删除仓库目录。
3. 如上所示删除状态 + 工作区。

## 相关

- [安装概览](/install)
- [迁移指南](/install/migrating)
