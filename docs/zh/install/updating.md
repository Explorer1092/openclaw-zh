---
title: "更新"
mmh3_hash: "2930cf69020d717ab72be6556d32f9b6"
summary: "安全地更新 OpenClaw (全局安装或源码)，加上回滚策略"
read_when:
  - 更新 OpenClaw
  - 更新后出现问题
---

# 更新

OpenClaw 发展迅速 (pre “1.0”)。像发布基础设施一样对待更新：更新 → 运行检查 → 重启 (或使用 `openclaw update`，它会重启) → 验证。

## 推荐：重新运行网站安装程序 (就地升级)

**首选** 更新路径是重新运行网站上的安装程序。它检测现有安装，就地升级，并在需要时运行 `openclaw doctor`。

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

注意：
- 如果不想再次运行入门向导，请添加 `--no-onboard`。
- 对于 **源码安装**，使用：
  ```bash
  curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method git --no-onboard
  ```
  安装程序 **仅** 在仓库干净时才会 `git pull --rebase`。
- 对于 **全局安装**，脚本在底层使用 `npm install -g openclaw@latest`。
- 旧版说明：`openclaw` 仍作为兼容性垫片可用。

## 更新之前

- 知道你是如何安装的：**全局** (npm/pnpm) vs **从源码** (git clone)。
- 知道你的网关是如何运行的：**前台终端** vs **受监管的服务** (launchd/systemd)。
- 快照你的定制：
  - 配置: `~/.openclaw/openclaw.json`
  - 凭据: `~/.openclaw/credentials/`
  - 工作区: `~/.openclaw/workspace`

## 更新 (全局安装)

全局安装 (选择一个):

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```
我们 **不** 推荐将 Bun 用于网关运行时 (WhatsApp/Telegram bug)。

切换更新频道 (git + npm 安装):

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --channel stable
```

使用 `--tag <dist-tag|version>` 进行一次性安装标签/版本。

有关频道语义和发布说明，请参见 [开发频道](/install/development-channels)。

注意：在 npm 安装上，网关会在启动时记录更新提示（检查当前频道标签）。通过 `update.checkOnStart: false` 禁用。

然后：

```bash
openclaw doctor
openclaw gateway restart
openclaw health
```

注意：
- 如果你的网关作为服务运行，`openclaw gateway restart` 优于杀死 PID。
- 如果你固定在特定版本，请参见下面的“回滚 / 固定”。

## 更新 (`openclaw update`)

对于 **源码安装** (git checkout)，首选：

```bash
openclaw update
```

它运行一个安全的更新流程：
- 需要干净的工作树。
- 切换到所选频道（标签或分支）。
- 针对配置的上游 (dev 频道) 进行获取 + 变基。
- 安装依赖，构建，构建控制界面，并运行 `openclaw doctor`。
- 默认重启网关 (使用 `--no-restart` 跳过)。

如果你通过 **npm/pnpm** 安装（无 git 元数据），`openclaw update` 将尝试通过你的包管理器更新。如果它无法检测到安装，请改用“更新 (全局安装)”。

## 更新 (控制界面 / RPC)

控制界面有 **更新 & 重启** (RPC: `update.run`)。它：
1) 运行与 `openclaw update` 相同的源码更新流程 (仅限 git checkout)。
2) 编写带有结构化报告 (stdout/stderr 尾部) 的重启哨兵。
3) 重启网关并用报告 ping 最后一个活动会话。

如果变基失败，网关将中止并在不应用更新的情况下重启。

## 更新 (从源码)

从仓库 checkout：

首选：

```bash
openclaw update
```

手动 (类似):

```bash
git pull
pnpm install
pnpm build
pnpm ui:build # 首次运行时自动安装 UI 依赖
openclaw doctor
openclaw health
```

注意：
- 当你运行打包的 `openclaw` 二进制文件 ([`openclaw.mjs`](https://github.com/openclaw/openclaw/blob/main/openclaw.mjs)) 或使用 Node 运行 `dist/` 时，`pnpm build` 很重要。
- 如果你在没有全局安装的情况下从仓库 checkout 运行，请使用 `pnpm openclaw ...` 执行 CLI 命令。
- 如果你直接从 TypeScript 运行 (`pnpm openclaw ...`)，通常不需要重建，但 **配置迁移仍然适用** → 运行 doctor。
- 在全局和 git 安装之间切换很容易：安装另一种风味，然后运行 `openclaw doctor`，以便网关服务入口点重写为当前安装。

## 始终运行：`openclaw doctor`

Doctor 是“安全更新”命令。它故意很无聊：修复 + 迁移 + 警告。

注意：如果你在 **源码安装** (git checkout) 上，`openclaw doctor` 将提议先运行 `openclaw update`。

它通常做的事情：
- 迁移已弃用的配置键 / 旧版配置文件位置。
- 审计私信策略并对有风险的“开放”设置发出警告。
- 检查网关健康状况并可以提议重启。
- 检测并将旧版网关服务 (launchd/systemd; 旧版 schtasks) 迁移到当前的 OpenClaw 服务。
- 在 Linux 上，确保 systemd 用户 lingering (以便网关在注销后存活)。

详情：[Doctor](/gateway/doctor)

## 启动 / 停止 / 重启网关

CLI (无论 OS 如何都有效):

```bash
openclaw gateway status
openclaw gateway stop
openclaw gateway restart
openclaw gateway --port 18789
openclaw logs --follow
```

如果你受监管：
- macOS launchd (应用绑定的 LaunchAgent): `launchctl kickstart -k gui/$UID/bot.molt.gateway` (使用 `bot.molt.<profile>`; 旧版 `com.openclaw.*` 仍然有效)
- Linux systemd 用户服务: `systemctl --user restart openclaw-gateway[-<profile>].service`
- Windows (WSL2): `systemctl --user restart openclaw-gateway[-<profile>].service`
  - `launchctl`/`systemctl` 仅在服务已安装时有效；否则运行 `openclaw gateway install`。

运行手册 + 确切的服务标签：[网关运行手册](/gateway)

## 回滚 / 固定 (当出现问题时)

### 固定 (全局安装)

安装已知的良好版本 (将 `<version>` 替换为最后一个工作版本):

```bash
npm i -g openclaw@<version>
```

```bash
pnpm add -g openclaw@<version>
```

提示：要查看当前发布的版本，运行 `npm view openclaw version`。

然后重启 + 重新运行 doctor：

```bash
openclaw doctor
openclaw gateway restart
```

### 固定 (源码) 按日期

从日期中选择一个提交 (示例：“2026-01-01 的 main 状态”):

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
```

然后重新安装依赖 + 重启：

```bash
pnpm install
pnpm build
openclaw gateway restart
```

如果你想稍后回到最新版本：

```bash
git checkout main
git pull
```

## 如果你卡住了

- 再次运行 `openclaw doctor` 并仔细阅读输出（它通常会告诉你修复方法）。
- 检查：[故障排除](/gateway/troubleshooting)
- 在 Discord 中提问：https://channels.discord.gg/clawd
